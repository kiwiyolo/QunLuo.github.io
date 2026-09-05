"""Check rendered pages, local links, and removal of former-owner content."""

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

    def handle_starttag(self, tag, attrs):
        attributes = dict(attrs)
        for name in (attributes.get("class") or "").split():
            self.class_counts[name] = self.class_counts.get(name, 0) + 1
        if "id" in attributes:
            self.ids.add(attributes["id"])
        for attribute in ("href", "src", "poster"):
            if attributes.get(attribute):
                self.links.append(attributes[attribute])


root = Path(sys.argv[1] if len(sys.argv) > 1 else "_site").resolve()
errors = []
required = [
    "index.html", "404.html", "content/about.html", "content/contact.html",
    "content/project.html", "content/publications.html", "content/privacy.html",
    "blog/index.html", "blog/Automatic-Research-20260401.html", "subscribe.html",
    "content/illustrations.html", "content/earth-system.html",
    "CNAME", ".nojekyll", "robots.txt", "sitemap.xml", "search.json",
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

for name in ("search.json", "sitemap.xml", "listings.json"):
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
    "index.html": {"city-wrapper": 1, "city-layer": 1, "city-background": 1, "city-icon": 8},
    "content/about.html": {"about-me": 1, "about-me-img": 1, "about-me-text": 1},
    "content/project.html": {"research-gallery": 1, "project-card": 6},
    "content/publications.html": {"listing-item": 5, "thumbnail": 5, "thumbnail-image": 5},
    "content/illustrations.html": {"modular-gallery": 2, "micro-gallery": 1, "img-popup": 1},
    "content/contact.html": {"social-icons": 1},
    "content/earth-system.html": {"cr-section": 4},
}
for filename, expected in components.items():
    page = pages.get(root / filename)
    if page:
        for component, count in expected.items():
            if page.class_counts.get(component, 0) != count:
                errors.append(f"Original component missing or changed: {filename} / {component}")

if errors:
    print("\n".join(errors))
    raise SystemExit(1)
print(f"Verified {len(pages)} pages: original components, local links, anchors, owner identity, and publish scope.")
