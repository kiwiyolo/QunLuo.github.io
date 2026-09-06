"""Small, self-contained navigation icons; no remote icon service is required."""
import html

PATHS = {
    "about": '<circle cx="12" cy="8" r="3"/><path d="M5 21v-2a7 7 0 0 1 14 0v2"/>',
    "project": '<path d="M9 3v6L4 19a1 1 0 0 0 1 2h14a1 1 0 0 0 1-2L15 9V3M8 3h8M7 15h10"/>',
    "blog": '<path d="M4 3h13a3 3 0 0 1 3 3v15H6a2 2 0 0 1-2-2zm0 14h16M8 7h8M8 11h6"/>',
    "contact": '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 6 9 7 9-7"/>',
    "planner": '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/>',
    "subscribe": '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4M12 1v1"/>',
    "orcid": '<circle cx="12" cy="12" r="10"/><circle cx="7" cy="7" r=".5"/><path d="M7 10v7M11 7h3a5 5 0 0 1 0 10h-3z"/>',
    "instagram": '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".5"/>',
    "github": '<path d="M9 21v-4c-4 1-4-2-6-2M15 21v-4c0-1-.4-2-1-2 4-.5 6-2 6-6 0-1-1-3-2-3 0-2 0-3-.5-3L14 5h-4L6.5 3C6 3 6 4 6 6 4 7 4 8 4 9c0 4 2 5.5 6 6-.5.5-1 1-1 2"/>',
    "linkedin": '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 10v7M11 17v-7m0 3a3 3 0 0 1 6 0v4"/><circle cx="7" cy="7" r=".5"/>',
    "language": '<path d="M3 5h11M8 3v2M5 5c0 5 4 8 8 10M12 5c0 5-4 8-9 10M14 21l4-10 4 10M15.5 17h5"/>',
}

ITEMS = [
    ("content/about.html", "about", "About me", "关于我"),
    ("content/project.html", "project", "Research projects", "研究项目"),
    ("blog/index.html", "blog", "Blog", "博客"),
    ("content/contact.html", "contact", "Contact", "联系我"),
    ("planner.qunluo-kiwi.com", "planner", "Private plan", "私密规划"),
    ("subscribe.html", "subscribe", "Subscribe", "订阅"),
    ("orcid.org/", "orcid", "ORCID", "ORCID"),
    ("instagram.com/", "instagram", "Instagram", "Instagram"),
    ("github.com/kiwiyolo", "github", "GitHub", "GitHub"),
    ("linkedin.com/", "linkedin", "LinkedIn", "LinkedIn"),
]

def markup(key, label):
    return ('<svg class="ql-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" '
            'stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
            + PATHS[key] + '</svg><span class="ql-nav-tooltip" aria-hidden="true">'
            + html.escape(label) + '</span>')
