(() => {
  const metadata = document.getElementById('ql-language-anchors');
  const anchors = metadata ? JSON.parse(metadata.textContent) : {};
  const currentLanguage = document.documentElement.lang.startsWith('zh') ? 'zh-CN' : 'en';

  function updateLinks() {
    let fragment;
    try { fragment = decodeURIComponent(window.location.hash.slice(1)); }
    catch { fragment = ''; }
    document.querySelectorAll('a[data-language]').forEach((link) => {
      const target = new URL(link.getAttribute('href'), window.location.href);
      target.search = window.location.search;
      const sameLanguage = link.getAttribute('data-language') === currentLanguage;
      const translatedAnchor = sameLanguage ? fragment : anchors[fragment];
      // Subscription confirmation fragments are route-independent within this site.
      target.hash = translatedAnchor || (fragment.startsWith('confirm=') ? fragment : '');
      link.href = target.pathname + target.search + target.hash;
    });
  }

  updateLinks();
  window.addEventListener('hashchange', updateLinks);
})();
