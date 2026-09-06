"""Check rendered pages, local links, and removal of former-owner content."""

import json
import base64
import re
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit


class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []
        self.ids = set()
        self.class_counts = {}
        self.language = None
        self.language_links = {}
        self.alternates = {}

    def handle_starttag(self, tag, attrs):
        attributes = dict(attrs)
        if tag == "html":
            self.language = attributes.get("lang")
        if tag == "a" and attributes.get("data-language"):
            self.language_links[attributes["data-language"]] = attributes
        if tag == "link" and attributes.get("rel") == "alternate":
            self.alternates[attributes.get("hreflang")] = attributes.get("href")
        for name in (attributes.get("class") or "").split():
            self.class_counts[name] = self.class_counts.get(name, 0) + 1
        if "id" in attributes:
            self.ids.add(attributes["id"])
        for attribute in ("href", "src", "poster"):
            if attributes.get(attribute):
                self.links.append(attributes[attribute])


root = Path(sys.argv[1] if len(sys.argv) > 1 else "_site").resolve()
errors = []
required_pages = [
    "index.html", "404.html", "content/about.html", "content/contact.html",
    "content/project.html", "content/publications.html", "content/privacy.html",
    "blog/index.html", "blog/Automatic-Research-20260401.html", "subscribe.html",
    "content/illustrations.html", "content/earth-system.html",
    "content/datasets.html", "content/open-science.html", "content/talks.html",
]
features = json.loads((Path(__file__).parent / 'community.json').read_text(encoding='utf-8'))
required_pages += [f"community/{feature['id']}.html" for feature in features]
required = required_pages + ["zh/" + name for name in required_pages] + [
    "CNAME", ".nojekyll", "robots.txt", "sitemap.xml", "search.json", "search-en.json", "search-zh.json",
]
for name in required:
    if not (root / name).is_file():
        errors.append(f"Missing output: {name}")

former_owner = re.compile(
    r"baldoni|baldons|cecibaldoni|cbaldoni|ceci-city|ceci-talk|"
    r"SORTEE|R-Ladies|shrew|I2I71CEP0Y|Hb3sWw6NhEQoTWt3A|G-DV6K7C0XDV",
    re.IGNORECASE,
)
pages = {}
for path in root.rglob("*.html"):
    source = path.read_text(encoding="utf-8")
    page = Page()
    page.feed(source)
    pages[path.resolve()] = page
    if former_owner.search(source):
        errors.append(f"Former-owner content: {path.relative_to(root)}")
    if path.parent != root / "site_libs" and "LUO Qun" not in source:
        errors.append(f"Missing owner identity: {path.relative_to(root)}")

for path, page in pages.items():
    for link in page.links:
        parts = urlsplit(link)
        if parts.scheme or parts.netloc:
            continue
        target = unquote(parts.path)
        if target.endswith(".qmd"):
            errors.append(f"Unrendered link: {path.relative_to(root)} -> {link}")
            continue
        resolved = (root / target.lstrip("/") if target.startswith("/")
                    else path.parent / target).resolve() if target else path
        if resolved.is_dir():
            resolved /= "index.html"
        if not resolved.is_file():
            errors.append(f"Broken link: {path.relative_to(root)} -> {link}")
        elif parts.fragment and resolved in pages and unquote(parts.fragment) not in pages[resolved].ids:
            errors.append(f"Broken anchor: {path.relative_to(root)} -> {link}")

for name in ("search.json", "search-en.json", "search-zh.json", "sitemap.xml", "listings.json"):
    path = root / name
    if path.exists() and former_owner.search(path.read_text(encoding="utf-8")):
        errors.append(f"Former-owner metadata: {name}")

for name in ("content/shrews.html", "manual.html",
             "blog/20260501_Earth-system-forecast.html", "supabase", "scripts"):
    if (root / name).exists():
        errors.append(f"Unpublished content included: {name}")

if (root / "CNAME").exists() and (root / "CNAME").read_text().strip() != "qunluo-kiwi.com":
    errors.append("Unexpected custom domain")

components = {
    "index.html": {"city-wrapper": 1, "city-layer": 1, "city-background": 1, "city-icon": 8 + len(features), "city-runner": 1},
    "blog/index.html": {"ql-interactions": 0},
    "blog/Automatic-Research-20260401.html": {"ql-interactions": 1},
    "content/about.html": {"about-me": 1, "about-me-img": 1, "about-me-text": 1},
    "content/project.html": {"research-gallery": 1, "project-card": 6},
    "content/publications.html": {"listing-item": 5, "thumbnail": 5, "thumbnail-image": 5},
    "content/illustrations.html": {"modular-gallery": 2, "micro-gallery": 1, "img-popup": 1},
    "content/contact.html": {"social-icons": 1},
    "content/earth-system.html": {"cr-section": 4},
}
for prefix in ("", "zh/"):
    for filename, expected in components.items():
        page = pages.get(root / (prefix + filename))
        if page:
            for component, count in expected.items():
                if page.class_counts.get(component, 0) != count:
                    errors.append(f"Original component missing or changed: {prefix}{filename} / {component}")

for filename in required_pages:
    for prefix, language in (("", "en"), ("zh/", "zh-CN")):
        page = pages.get(root / (prefix + filename))
        if not page:
            continue
        if page.language != language:
            errors.append(f"Incorrect document language: {prefix}{filename}")
        other = "en" if language == "zh-CN" else "zh-CN"
        if set(page.language_links) != {other}:
            errors.append(f"Expected one direct language toggle: {prefix}{filename}")
        for locale, target in (("en", "/" + filename), ("zh-CN", "/zh/" + filename)):
            if locale == other:
                link = page.language_links.get(locale, {})
                if link.get("href") != target or link.get("hreflang") != locale or link.get("aria-current"):
                    errors.append(f"Incorrect direct language link: {prefix}{filename} / {locale}")
            if page.alternates.get(locale) != "https://qunluo-kiwi.com" + target:
                errors.append(f"Incorrect alternate language metadata: {prefix}{filename} / {locale}")

for prefix in ('', 'zh/'):
    article = (root / (prefix + 'blog/Automatic-Research-20260401.html')).read_text(encoding='utf-8')
    main = re.search(r'<main\b[\s\S]*?</main>', article)
    if not main or 'class="ql-interactions"' not in main.group(0):
        errors.append(f'Interactions must be inside the article: {prefix}blog')
    home = (root / (prefix + 'index.html')).read_text(encoding='utf-8')
    if '/assets/community-character.js' not in home:
        errors.append(f'Missing community character runtime: {prefix}index.html')

sprite_path = root / 'assets/character/kirito-sprite.json'
if not sprite_path.is_file():
    errors.append('Missing Kirito sprite metadata')
else:
    sprite = json.loads(sprite_path.read_text(encoding='utf-8'))
    if not (sprite_path.parent / sprite['image']).is_file():
        errors.append('Missing Kirito sprite image')
for extension in ('*.pmx', '*.pmd', '*.zip', '*.blend'):
    if list(root.rglob(extension)):
        errors.append(f'Unpublished model/source data included: {extension}')

client_file = root / 'assets/supabase-public.json'
try:
    client = json.loads(client_file.read_text(encoding='utf-8'))
    claims = json.loads(base64.urlsafe_b64decode(client['anonKey'].split('.')[1] + '==='))
    if set(client) != {'anonKey'} or claims.get('role') != 'anon' or claims.get('ref') != 'fracycwtkurcimbwcvjz':
        errors.append('Public client configuration must contain only the correct anon key')
except (OSError, ValueError, KeyError, IndexError):
    errors.append('Missing or invalid public client configuration')

for locale, chinese in (("en", False), ("zh", True)):
    index_path = root / f"search-{locale}.json"
    if index_path.exists():
        entries = json.loads(index_path.read_text(encoding="utf-8"))
        indexed = set()
        for entry in entries:
            target = urlsplit(entry["href"]).path.lstrip("/")
            indexed.add(target)
            if target.startswith("zh/") != chinese or not (root / target).is_file():
                errors.append(f"Wrong language or missing page in search-{locale}.json: {target}")
        for filename in required_pages:
            if filename != "404.html" and ("zh/" if chinese else "") + filename not in indexed:
                errors.append(f"Page absent from search-{locale}.json: {filename}")

search_script = root / "site_libs/quarto-search/quarto-search.js"
if search_script.is_file() and 'offsetURL("search.json")' in search_script.read_text(encoding="utf-8"):
    errors.append("Search still uses a mixed-language index")

if errors:
    print("\n".join(errors))
    raise SystemExit(1)
print(f"Verified {len(pages)} pages: original components, bilingual navigation/search, local links, anchors, owner identity, and publish scope.")
