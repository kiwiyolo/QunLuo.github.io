"""Finalize paired static language editions after Quarto renders the shared design."""

import html
import json
import os
import re
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urljoin, urlsplit

SITE = "https://qunluo-kiwi.com"
ROOT = Path(os.environ.get("QUARTO_PROJECT_OUTPUT_DIR", "_site")).resolve()
SOURCE = Path(__file__).resolve().parent.parent
SEARCH_EXPRESSION = 'offsetURL("search.json")'
LANGUAGE_SEARCH = 'offsetURL(document.documentElement.lang.startsWith("zh") ? "search-zh.json" : "search-en.json")'
NAV_ZH = {"About": "关于我", "Projects": "研究项目", "Blog": "博客", "Contact": "联系我",
          "Private Plan 🔒": "私密规划 🔒", "Subscribe": "订阅"}
SEARCH_ZH = {
    "search-no-results-text": "没有找到结果", "search-matching-documents-text": "篇相关页面",
    "search-copy-link-title": "复制搜索链接", "search-hide-matches-text": "隐藏其他匹配结果",
    "search-more-match-text": "条本页匹配结果", "search-more-matches-text": "条本页匹配结果",
    "search-clear-button-title": "清除", "search-text-placeholder": "搜索中文内容",
    "search-detached-cancel-button-title": "取消", "search-submit-button-title": "搜索",
    "search-label": "搜索",
}


class Anchors(HTMLParser):
    def __init__(self, source):
        super().__init__()
        self.ids = set()
        self.headings = []
        self.feed(source)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if attrs.get("id"):
            self.ids.add(attrs["id"])
        if re.fullmatch(r"h[1-6]", tag):
            anchor = attrs.get("id") or attrs.get("data-anchor-id")
            if anchor:
                self.headings.append(anchor)


def attributes(tag):
    return dict(re.findall(r'([\w:-]+)="([^"]*)"', tag))


def attribute(tag, name, value):
    pattern = rf'\s{re.escape(name)}="[^"]*"'
    tag = re.sub(pattern, "", tag)
    return tag[:-1] + f' {name}="{html.escape(value, quote=True)}">'


files = {p.relative_to(ROOT).as_posix(): p for p in ROOT.rglob("*.html") if "site_libs" not in p.parts}
documents = {name: path.read_text(encoding="utf-8") for name, path in files.items()}
anchor_data = {name: Anchors(source) for name, source in documents.items()}
switch_script = (SOURCE / "_includes/language-switch.js").read_text(encoding="utf-8")

for name, path in files.items():
    chinese = name.startswith("zh/")
    base = name[3:] if chinese else name
    counterpart = base if chinese else "zh/" + base
    if counterpart not in files:
        raise RuntimeError(f"Missing language counterpart for {name}")
    source = documents[name]

    def navigation(match):
        header = match.group(0)

        def anchor(match):
            opening, inner = match.group(1), match.group(2)
            attrs = attributes(opening)
            label = html.unescape(re.sub(r"<[^>]*>", "", inner)).strip()
            if label in ("English", "简体中文"):
                locale = "en" if label == "English" else "zh-CN"
                target = "/" + (base if locale == "en" else "zh/" + base)
                opening = attribute(opening, "href", target)
                opening = attribute(opening, "data-language", locale)
                opening = attribute(opening, "hreflang", locale)
                opening = attribute(opening, "lang", locale)
                classes = attrs.get("class", "").split()
                classes = [c for c in classes if c != "active"]
                active = (locale == "zh-CN") == chinese
                if active:
                    classes.append("active")
                    opening = attribute(opening, "aria-current", "page")
                else:
                    opening = re.sub(r'\saria-current="[^"]*"', "", opening)
                opening = attribute(opening, "class", " ".join(classes))
            elif chinese and attrs.get("href"):
                resolved = urlsplit(urljoin(SITE + "/" + name, html.unescape(attrs["href"])))
                local = unquote(resolved.path).lstrip("/") or "index.html"
                if local.endswith("/"):
                    local += "index.html"
                if resolved.netloc == urlsplit(SITE).netloc and not local.startswith("zh/") and "zh/" + local in files:
                    opening = attribute(opening, "href", "/zh/" + local)
                    if "nav-link" in attrs.get("class", "").split():
                        active = local == base or (local == "blog/index.html" and base.startswith("blog/"))
                        classes = [c for c in attrs.get("class", "").split() if c != "active"]
                        if active:
                            classes.append("active")
                            opening = attribute(opening, "aria-current", "page")
                        else:
                            opening = re.sub(r'\saria-current="[^"]*"', "", opening)
                        opening = attribute(opening, "class", " ".join(classes))
            return opening + inner + "</a>"

        header = re.sub(r"(<a\b[^>]*>)([\s\S]*?)</a>", anchor, header)
        if chinese:
            for english, translated in NAV_ZH.items():
                header = header.replace(f'<span class="menu-text">{english}</span>', f'<span class="menu-text">{translated}</span>')
            header = header.replace('title="Search"', 'title="搜索"').replace('aria-label="Search"', 'aria-label="搜索"')
            header = header.replace('aria-label="Toggle navigation"', 'aria-label="展开或收起导航"')
        return header

    source = re.sub(r'<header id="quarto-header"[\s\S]*?</header>', navigation, source, count=1)

    if chinese:
        source = source.replace("Optional blog interactions use browser storage and anti-spam checks.", "可选的博客互动功能使用浏览器存储和反垃圾验证。")
        source = source.replace('<button id="accept-cookies">OK</button>', '<button id="accept-cookies">知道了</button>')
        source = source.replace('href="/content/privacy.html" class="cookie-link">(learn more)', 'href="/zh/content/privacy.html" class="cookie-link">（了解更多）')
        source = source.replace("Copyright 2026,", "版权所有 2026，").replace("Built with <a", "使用 <a")
        def search_options(match):
            options = json.loads(match.group(1))
            options["language"] = SEARCH_ZH
            return '<script id="quarto-search-options" type="application/json">' + json.dumps(options, ensure_ascii=False) + '</script>'
        source = re.sub(r'<script id="quarto-search-options" type="application/json">([\s\S]*?)</script>', search_options, source)

    # Closeread embeds this same search code; localize both inline and shared copies.
    source = source.replace(SEARCH_EXPRESSION, LANGUAGE_SEARCH)
    source = re.sub(r'<!-- ql-language-links -->[\s\S]*?<!-- /ql-language-links -->\s*', "", source)
    source = re.sub(r'<link\b[^>]*rel="canonical"[^>]*>\s*', "", source)
    alternates = '\n<!-- ql-language-links -->\n' + '\n'.join([
        f'<link rel="canonical" href="{SITE}/{name}">',
        f'<link rel="alternate" hreflang="en" href="{SITE}/{base}">',
        f'<link rel="alternate" hreflang="zh-CN" href="{SITE}/zh/{base}">',
        f'<link rel="alternate" hreflang="x-default" href="{SITE}/{base}">',
    ]) + '\n<!-- /ql-language-links -->\n'
    source = source.replace("</head>", alternates + "</head>")

    here, there = anchor_data[name], anchor_data[counterpart]
    mapping = dict(zip(here.headings, there.headings))
    mapping.update({a: a for a in here.ids & there.ids})
    payload = json.dumps(mapping, ensure_ascii=False).replace("<", "\\u003c")
    source = re.sub(r'<!-- ql-language-switch -->[\s\S]*?<!-- /ql-language-switch -->\s*', "", source)
    switch = ('<!-- ql-language-switch -->\n<script id="ql-language-anchors" type="application/json">' + payload
              + '</script>\n<script>' + switch_script + '</script>\n<!-- /ql-language-switch -->\n')
    source = source.replace("</body>", switch + "</body>")
    path.write_text(source, encoding="utf-8")

search_file = ROOT / "search.json"
if search_file.exists():
    index = json.loads(search_file.read_text(encoding="utf-8"))
    for locale, chinese in (("en", False), ("zh", True)):
        selected = [item for item in index if item.get("href", "").lstrip("/").startswith("zh/") == chinese]
        (ROOT / f"search-{locale}.json").write_text(json.dumps(selected, ensure_ascii=False, indent=2), encoding="utf-8")

search_js = ROOT / "site_libs/quarto-search/quarto-search.js"
if search_js.exists():
    js = search_js.read_text(encoding="utf-8")
    if SEARCH_EXPRESSION not in js and LANGUAGE_SEARCH not in js:
        raise RuntimeError("Quarto search integration changed; check language index selection")
    search_js.write_text(js.replace(SEARCH_EXPRESSION, LANGUAGE_SEARCH), encoding="utf-8")

print(f"Localized {len(files)} pages with paired language links and separate search indexes.")
