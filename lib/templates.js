'use strict';

const { site, nav } = require('../site.config');
const { escapeHtml } = require('./markdown');

/**
 * All internal links are emitted relative to the page being rendered, so the
 * generated site works from a sub-path (GitHub Pages project sites) without any
 * configuration. `depth` is the number of directory segments below the site
 * root for the current page.
 */
function linker(depth) {
  const prefix = depth === 0 ? './' : '../'.repeat(depth);
  return (path) => {
    if (/^(https?:|mailto:|#)/.test(path)) return path;
    return prefix + String(path).replace(/^\//, '');
  };
}

const svgLogo = `<svg viewBox="0 0 32 32" aria-hidden="true" class="logo-mark">
  <rect x="1" y="1" width="30" height="30" rx="8" fill="currentColor" opacity=".12"/>
  <rect x="7" y="16" width="4" height="9" rx="1.5" fill="currentColor"/>
  <rect x="14" y="11" width="4" height="14" rx="1.5" fill="currentColor"/>
  <rect x="21" y="6" width="4" height="19" rx="1.5" fill="currentColor"/>
</svg>`;

function header(u, current) {
  const items = nav
    .map((item) => {
      const active = current && item.href.startsWith(`/${current}`) ? ' class="active"' : '';
      return `<li><a href="${u(item.href)}"${active}>${item.label}</a></li>`;
    })
    .join('');

  return `<a class="skip-link" href="#main">Skip to content</a>
<header class="site-header">
  <div class="wrap header-inner">
    <a class="brand" href="${u('/')}">
      ${svgLogo}
      <span class="brand-text">Analytics<span class="brand-accent">Adda</span></span>
    </a>
    <nav class="main-nav" aria-label="Main">
      <ul>${items}</ul>
    </nav>
    <div class="header-actions">
      <button class="search-trigger" type="button" data-search-open aria-label="Search tutorials">
        <span aria-hidden="true">🔍</span>
        <span class="search-trigger-text">Search</span>
        <kbd>/</kbd>
      </button>
      <button class="theme-toggle" type="button" data-theme-toggle aria-label="Toggle dark mode">
        <span class="theme-icon-light" aria-hidden="true">☀️</span>
        <span class="theme-icon-dark" aria-hidden="true">🌙</span>
      </button>
      <button class="menu-toggle" type="button" data-menu-toggle aria-expanded="false" aria-label="Open menu">
        <span></span><span></span><span></span>
      </button>
    </div>
  </div>
  <nav class="mobile-nav" data-mobile-nav aria-label="Mobile">
    <ul>${items}</ul>
  </nav>
</header>`;
}

function footer(u, tracks) {
  const trackLinks = tracks
    .map((t) => `<li><a href="${u(`/tutorials/${t.slug}/`)}">${t.title}</a></li>`)
    .join('');

  return `<footer class="site-footer">
  <div class="wrap footer-grid">
    <div class="footer-about">
      <a class="brand" href="${u('/')}">${svgLogo}
        <span class="brand-text">Analytics<span class="brand-accent">Adda</span></span></a>
      <p>${escapeHtml(site.description)}</p>
    </div>
    <div>
      <h3>Learning tracks</h3>
      <ul>${trackLinks}</ul>
    </div>
    <div>
      <h3>Resources</h3>
      <ul>
        <li><a href="${u('/tutorials/')}">All tutorials</a></li>
        <li><a href="${u('/practice/')}">Practice questions</a></li>
        <li><a href="${u('/cheatsheets/')}">Cheat sheets</a></li>
        <li><a href="${u('/glossary/')}">Glossary</a></li>
      </ul>
    </div>
    <div>
      <h3>About</h3>
      <ul>
        <li><a href="${u('/about/')}">About this site</a></li>
        <li><a href="${u('/contribute/')}">Contribute a tutorial</a></li>
      </ul>
    </div>
  </div>
  <div class="wrap footer-bottom">
    <p>© ${site.year} ${escapeHtml(site.name)}. Educational content, free to read and share.</p>
  </div>
</footer>`;
}

function searchOverlay() {
  return `<div class="search-modal" data-search-modal hidden>
  <div class="search-backdrop" data-search-close></div>
  <div class="search-panel" role="dialog" aria-modal="true" aria-label="Search tutorials">
    <div class="search-input-row">
      <span aria-hidden="true">🔍</span>
      <input type="search" placeholder="Search concepts, e.g. p-value, window function, churn…"
             data-search-input autocomplete="off" spellcheck="false">
      <button type="button" data-search-close aria-label="Close search">Esc</button>
    </div>
    <div class="search-results" data-search-results>
      <p class="search-hint">Type at least two characters to search ${'{{COUNT}}'} tutorials.</p>
    </div>
  </div>
</div>`;
}

/** Wraps page content in the full HTML document. */
function layout(opts) {
  const {
    title, description, content, depth = 0, bodyClass = '',
    current = '', tracks = [], articleCount = 0, extraHead = '', extraScripts = '',
  } = opts;

  const u = linker(depth);
  const fullTitle = title === site.name
    ? `${site.name} — ${site.tagline}`
    : `${title} | ${site.name}`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(fullTitle)}</title>
<meta name="description" content="${escapeHtml(description || site.description)}">
<meta property="og:title" content="${escapeHtml(fullTitle)}">
<meta property="og:description" content="${escapeHtml(description || site.description)}">
<meta property="og:type" content="website">
<meta name="theme-color" content="#2f8f5b">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%232f8f5b'/%3E%3Crect x='7' y='16' width='4' height='9' rx='1.5' fill='white'/%3E%3Crect x='14' y='11' width='4' height='14' rx='1.5' fill='white'/%3E%3Crect x='21' y='6' width='4' height='19' rx='1.5' fill='white'/%3E%3C/svg%3E">
<link rel="stylesheet" href="${u('/assets/css/style.css')}">
${extraHead}
<script>
// Applied before first paint so the page never flashes the wrong theme.
// The value is stored as a bare string; site.js must write it the same way.
(function () {
  try {
    var t = localStorage.getItem('aa-theme');
    // Builds before this fix stored it JSON-encoded, so an existing value can
    // arrive as "dark" with the quotes included. Strip them, or the attribute
    // matches neither [data-theme="dark"] nor [data-theme="light"].
    if (t) t = t.replace(/^"+|"+$/g, '');
    if (t !== 'dark' && t !== 'light') {
      t = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.dataset.theme = t;
  } catch (e) {}
})();
</script>
</head>
<body class="${bodyClass}">
${header(u, current)}
<main id="main">
${content}
</main>
${footer(u, tracks)}
${searchOverlay().replace('{{COUNT}}', String(articleCount))}
<script>window.AA_BASE = ${JSON.stringify(depth === 0 ? './' : '../'.repeat(depth))};</script>
<script src="${u('/assets/js/search-index.js')}" defer></script>
<script src="${u('/assets/js/site.js')}" defer></script>
${extraScripts}
</body>
</html>`;
}

module.exports = { layout, linker, svgLogo };
