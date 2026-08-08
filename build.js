'use strict';

/**
 * Static site generator for AnalyticsAdda.
 *
 * Reads Markdown from content/, renders it with the local Markdown module and
 * writes a fully static site into docs/ (the folder GitHub Pages serves).
 * No third-party dependencies: `node build.js` is the whole toolchain.
 */

const fs = require('fs');
const path = require('path');

const { site, tracks, nav } = require('./site.config');
const md = require('./lib/markdown');
const { layout, linker } = require('./lib/templates');

const ROOT = __dirname;
const CONTENT = path.join(ROOT, 'content');
const ASSETS = path.join(ROOT, 'assets');
const OUT = path.join(ROOT, 'docs');

const esc = md.escapeHtml;

/* ------------------------------------------------------------ fs utilities */

function rmrf(dir) {
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
}

function write(relPath, contents) {
  const target = path.join(OUT, relPath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, contents);
}

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const src = path.join(from, entry.name);
    const dst = path.join(to, entry.name);
    if (entry.isDirectory()) copyDir(src, dst);
    else fs.copyFileSync(src, dst);
  }
}

/* ---------------------------------------------------------- front matter */

/**
 * Minimal YAML front matter: `key: value`, quoted strings and inline
 * `[a, b, c]` arrays. That covers everything the content needs.
 */
function parseFrontMatter(raw) {
  const m = /^---\n([\s\S]*?)\n---\n?/.exec(raw);
  if (!m) return { data: {}, body: raw };

  const data = {};
  for (const line of m[1].split('\n')) {
    if (!line.trim() || /^\s*#/.test(line)) continue;
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if (/^\[.*\]$/.test(value)) {
      value = value
        .slice(1, -1)
        .split(',')
        .map((v) => v.trim().replace(/^["']|["']$/g, ''))
        .filter(Boolean);
    } else {
      value = value.replace(/^["']|["']$/g, '');
      if (/^\d+$/.test(value)) value = Number(value);
    }
    data[key] = value;
  }
  return { data, body: raw.slice(m[0].length) };
}

/* ------------------------------------------------------------------ model */

const WORDS_PER_MINUTE = 210;
// Code is read far more slowly than prose, and is stripped out of the plain
// text, so it is counted separately rather than ignored.
const CODE_LINES_PER_MINUTE = 14;

function loadArticles() {
  const articles = [];

  for (const track of tracks) {
    const dir = path.join(CONTENT, track.slug);
    if (!fs.existsSync(dir)) {
      console.warn(`  ! no content directory for track "${track.slug}"`);
      continue;
    }
    for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.md'))) {
      const raw = fs.readFileSync(path.join(dir, file), 'utf8');
      const { data, body } = parseFrontMatter(raw);
      const slug = data.slug || file.replace(/\.md$/, '');
      const plain = md.toPlainText(body);
      const words = plain.split(/\s+/).length;
      const codeLines = md.countCodeLines(body);
      const rendered = md.render(body, { linkPrefix: '../../../' });

      if (!data.title) throw new Error(`Missing title in ${track.slug}/${file}`);

      articles.push({
        ...data,
        slug,
        track: track.slug,
        trackTitle: track.title,
        trackIcon: track.icon,
        trackColor: track.color,
        order: data.order || 99,
        difficulty: data.difficulty || 'Beginner',
        tags: Array.isArray(data.tags) ? data.tags : [],
        url: `/tutorials/${track.slug}/${slug}/`,
        depth: 3,
        html: rendered.html,
        toc: rendered.toc,
        quizzes: rendered.quizzes,
        words,
        codeLines,
        readingTime: Math.max(
          2,
          Math.round(words / WORDS_PER_MINUTE + codeLines / CODE_LINES_PER_MINUTE)),
        plain,
      });
    }
  }

  articles.sort((a, b) =>
    a.track === b.track
      ? a.order - b.order
      : tracks.findIndex((t) => t.slug === a.track) - tracks.findIndex((t) => t.slug === b.track));

  return articles;
}

function loadData(name, fallback) {
  const file = path.join(CONTENT, '_data', name);
  if (!fs.existsSync(file)) return fallback;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

/* -------------------------------------------------------- shared partials */

function breadcrumbs(u, items) {
  const parts = items
    .map((item, i) =>
      item.href && i < items.length - 1
        ? `<li><a href="${u(item.href)}">${esc(item.label)}</a></li>`
        : `<li aria-current="page">${esc(item.label)}</li>`)
    .join('');
  return `<nav class="breadcrumbs" aria-label="Breadcrumb"><ol>${parts}</ol></nav>`;
}

function difficultyBadge(level) {
  const key = String(level).toLowerCase().split(' ')[0];
  return `<span class="badge badge-${key}">${esc(level)}</span>`;
}

/**
 * `opts.level` sets the card's heading level so document outlines stay valid:
 * h2 where cards sit directly under the page h1, h3 under a section heading.
 */
function articleCard(u, article, opts = {}) {
  const track = tracks.find((t) => t.slug === article.track);
  const h = opts.level || 3;
  return `<article class="card" data-track="${article.track}" data-title="${esc(article.title.toLowerCase())}">
  <div class="card-top">
    <a class="card-track" href="${u(`/tutorials/${track.slug}/`)}" style="--track-color:${track.color}">
      <span aria-hidden="true">${track.icon}</span> ${esc(track.short)}
    </a>
    ${difficultyBadge(article.difficulty)}
  </div>
  <h${h} class="card-title"><a href="${u(article.url)}">${esc(article.title)}</a></h${h}>
  <p>${esc(article.description || '')}</p>
  <div class="card-meta">
    <span>⏱ ${article.readingTime} min read</span>
    ${opts.showProgress === false ? '' : `<span class="done-flag" data-done-flag="${article.url}"></span>`}
  </div>
</article>`;
}

/* -------------------------------------------------------------- home page */

function renderHome(articles) {
  const u = linker(0);
  const total = articles.length;

  const trackCards = tracks
    .map((track) => {
      const items = articles.filter((a) => a.track === track.slug);
      return `<a class="track-card" href="${u(`/tutorials/${track.slug}/`)}" style="--track-color:${track.color}">
  <span class="track-icon" aria-hidden="true">${track.icon}</span>
  <h3>${esc(track.title)}</h3>
  <p>${esc(track.summary)}</p>
  <div class="track-card-meta">
    <span>${items.length} tutorials</span>
    <span class="track-progress" data-track-progress="${track.slug}"
          data-track-urls="${items.map((a) => a.url).join(',')}"></span>
  </div>
</a>`;
    })
    .join('');

  const featured = ['what-is-business-analytics', 'hypothesis-testing', 'window-functions',
    'choosing-the-right-chart', 'linear-regression', 'rfm-analysis']
    .map((slug) => articles.find((a) => a.slug === slug))
    .filter(Boolean)
    .map((a) => articleCard(u, a))
    .join('');

  const roadmap = tracks
    .map((track, i) => {
      const items = articles.filter((a) => a.track === track.slug);
      const links = items
        .map((a) => `<li><a href="${u(a.url)}">${esc(a.title)}</a></li>`)
        .join('');
      return `<li class="roadmap-step" style="--track-color:${track.color}">
  <div class="roadmap-num">${i + 1}</div>
  <div class="roadmap-body">
    <h3><a href="${u(`/tutorials/${track.slug}/`)}">${track.icon} ${esc(track.title)}</a>
      <span class="roadmap-level">${esc(track.level)}</span></h3>
    <ol class="roadmap-links">${links}</ol>
  </div>
</li>`;
    })
    .join('');

  const content = `
<section class="hero">
  <div class="wrap hero-inner">
    <div class="hero-copy">
      <p class="eyebrow">Free · Self-paced · No sign-up</p>
      <h1>Learn <span class="hl">Business Analytics</span> the way it is actually practised.</h1>
      <p class="lede">${esc(site.description)}</p>
      <div class="hero-actions">
        <a class="btn btn-primary" href="${u('/tutorials/foundations/what-is-business-analytics/')}">Start with the basics</a>
        <a class="btn btn-ghost" href="${u('/tracks/')}">Browse all tracks</a>
      </div>
      <ul class="hero-stats">
        <li><strong>${total}</strong><span>Tutorials</span></li>
        <li><strong>${tracks.length}</strong><span>Learning tracks</span></li>
        <li><strong>${articles.reduce((n, a) => n + a.quizzes.reduce((m, q) => m + q.questions.length, 0), 0)}</strong><span>Practice questions</span></li>
      </ul>
    </div>
    <div class="hero-panel" aria-hidden="true">
      <div class="hero-panel-head"><span class="dot"></span><span class="dot"></span><span class="dot"></span>
        <span class="hero-panel-title">monthly_revenue.sql</span></div>
<pre class="hero-code"><code><span class="tok-keyword">SELECT</span> date_trunc(<span class="tok-string">'month'</span>, order_date) <span class="tok-keyword">AS</span> mth,
       <span class="tok-builtin">sum</span>(revenue)              <span class="tok-keyword">AS</span> revenue,
       <span class="tok-builtin">sum</span>(revenue) / <span class="tok-builtin">lag</span>(<span class="tok-builtin">sum</span>(revenue))
         <span class="tok-keyword">OVER</span> (<span class="tok-keyword">ORDER BY</span> <span class="tok-number">1</span>) <span class="tok-operator">-</span> <span class="tok-number">1</span> <span class="tok-keyword">AS</span> mom_growth
<span class="tok-keyword">FROM</span>   orders
<span class="tok-keyword">WHERE</span>  status <span class="tok-operator">=</span> <span class="tok-string">'completed'</span>
<span class="tok-keyword">GROUP</span> <span class="tok-keyword">BY</span> <span class="tok-number">1</span>
<span class="tok-keyword">ORDER</span> <span class="tok-keyword">BY</span> <span class="tok-number">1</span>;</code></pre>
      <div class="hero-panel-foot">Month-over-month growth in six lines — covered in <strong>Window Functions</strong>.</div>
    </div>
  </div>
</section>

<section class="wrap section">
  <div class="section-head">
    <h2>Learning tracks</h2>
    <a class="section-link" href="${u('/tracks/')}">See all tracks →</a>
  </div>
  <div class="track-grid">${trackCards}</div>
</section>

<section class="band">
  <div class="wrap section">
    <div class="section-head"><h2>Popular tutorials</h2>
      <a class="section-link" href="${u('/tutorials/')}">All tutorials →</a></div>
    <div class="card-grid">${featured}</div>
  </div>
</section>

<section class="wrap section">
  <div class="section-head"><h2>The complete roadmap</h2></div>
  <p class="section-sub">Work top to bottom and you will cover the ground a junior
  business analyst is expected to know before their first interview.</p>
  <ol class="roadmap">${roadmap}</ol>
</section>

<section class="band">
  <div class="wrap section why-grid">
    <div>
      <h2>How this site is organised</h2>
      <p>Every tutorial follows the same shape so you always know what you are getting:
      the concept in plain English, the formula or syntax, a worked example on realistic
      business data, the mistakes people actually make, and a short quiz.</p>
      <ul class="tick-list">
        <li><strong>Concept first.</strong> No jargon before it has been defined.</li>
        <li><strong>Business context always.</strong> Every example is a decision someone has to make.</li>
        <li><strong>Runnable code.</strong> SQL and Python you can paste into a console.</li>
        <li><strong>Progress tracking.</strong> Mark tutorials complete; progress is saved in your browser.</li>
      </ul>
    </div>
    <div class="next-steps">
      <h3>Not sure where to start?</h3>
      <p>Pick the description that sounds most like you.</p>
      <ul class="chooser">
        <li><a href="${u('/tutorials/foundations/')}"><strong>Complete beginner</strong><span>Start with Analytics Foundations</span></a></li>
        <li><a href="${u('/tutorials/sql/')}"><strong>I need job-ready skills fast</strong><span>Go straight to SQL &amp; Data Wrangling</span></a></li>
        <li><a href="${u('/tutorials/statistics/')}"><strong>Preparing for interviews</strong><span>Statistics &amp; A/B testing</span></a></li>
        <li><a href="${u('/tutorials/domains/')}"><strong>Already in a business role</strong><span>Applied Business Analytics</span></a></li>
      </ul>
    </div>
  </div>
</section>`;

  return layout({
    title: site.name,
    description: site.description,
    content,
    depth: 0,
    bodyClass: 'page-home',
    tracks,
    articleCount: articles.length,
  });
}

/* ------------------------------------------------------------ track pages */

function renderTracksIndex(articles) {
  const u = linker(1);
  const cards = tracks
    .map((track) => {
      const items = articles.filter((a) => a.track === track.slug);
      const list = items
        .map((a) => `<li><a href="${u(a.url)}">${esc(a.title)}</a>
          <span class="mini-meta">${a.readingTime} min</span></li>`)
        .join('');
      return `<section class="track-detail" style="--track-color:${track.color}">
  <header>
    <span class="track-icon" aria-hidden="true">${track.icon}</span>
    <div>
      <h2><a href="${u(`/tutorials/${track.slug}/`)}">${esc(track.title)}</a></h2>
      <p class="track-level">${esc(track.level)} · ${items.length} tutorials ·
        ${items.reduce((n, a) => n + a.readingTime, 0)} min total</p>
    </div>
  </header>
  <p>${esc(track.summary)}</p>
  <ol class="track-list">${list}</ol>
</section>`;
    })
    .join('');

  const content = `<div class="wrap page-head">
  ${breadcrumbs(u, [{ label: 'Home', href: '/' }, { label: 'Tracks' }])}
  <h1>Learning tracks</h1>
  <p class="lede">Six tracks that build on each other. Each one is a self-contained
  syllabus you can finish in a few evenings.</p>
</div>
<div class="wrap section track-details">${cards}</div>`;

  return layout({
    title: 'Learning tracks',
    description: 'All business analytics learning tracks: foundations, statistics, SQL, visualization, predictive analytics and applied analytics.',
    content, depth: 1, current: 'tracks', tracks, articleCount: articles.length,
  });
}

function renderTrackPage(track, articles) {
  const u = linker(2);
  const items = articles.filter((a) => a.track === track.slug);
  const cards = items.map((a) => articleCard(u, a, { level: 2 })).join('');
  const totalMinutes = items.reduce((n, a) => n + a.readingTime, 0);

  const content = `<div class="wrap page-head" style="--track-color:${track.color}">
  ${breadcrumbs(u, [
    { label: 'Home', href: '/' },
    { label: 'Tutorials', href: '/tutorials/' },
    { label: track.title },
  ])}
  <div class="track-head">
    <span class="track-icon-lg" aria-hidden="true">${track.icon}</span>
    <div>
      <h1>${esc(track.title)}</h1>
      <p class="lede">${esc(track.summary)}</p>
      <p class="track-level">${esc(track.level)} · ${items.length} tutorials · ~${totalMinutes} min</p>
      <div class="progress-bar-lg" data-track-progress-bar="${track.slug}"
           data-track-urls="${items.map((a) => a.url).join(',')}">
        <div class="progress-fill"></div><span class="progress-label"></span>
      </div>
    </div>
  </div>
  <div class="page-head-actions">
    ${items[0] ? `<a class="btn btn-primary" href="${u(items[0].url)}">Start track →</a>` : ''}
    <a class="btn btn-ghost" href="${u('/practice/')}">Practice questions</a>
  </div>
</div>
<div class="wrap section"><div class="card-grid">${cards}</div></div>`;

  return layout({
    title: track.title,
    description: track.summary,
    content, depth: 2, current: 'tutorials', tracks, articleCount: articles.length,
  });
}

function renderTutorialsIndex(articles) {
  const u = linker(1);
  const filters = tracks
    .map((t) => `<button type="button" class="chip" data-filter="${t.slug}"
      style="--track-color:${t.color}">${t.icon} ${esc(t.short)}</button>`)
    .join('');
  const cards = articles.map((a) => articleCard(u, a, { level: 2 })).join('');

  const content = `<div class="wrap page-head">
  ${breadcrumbs(u, [{ label: 'Home', href: '/' }, { label: 'Tutorials' }])}
  <h1>All tutorials</h1>
  <p class="lede">${articles.length} tutorials across ${tracks.length} tracks. Filter by
  track, or use the search box for a specific concept.</p>
  <div class="filter-row" data-filter-row>
    <button type="button" class="chip active" data-filter="all">All</button>
    ${filters}
  </div>
  <input class="inline-filter" type="search" placeholder="Filter by title…" data-inline-filter>
</div>
<div class="wrap section"><div class="card-grid" data-filter-target>${cards}</div>
  <p class="empty-state" data-empty hidden>No tutorials match that filter.</p></div>`;

  return layout({
    title: 'All tutorials',
    description: 'Complete list of business analytics tutorials on AnalyticsAdda.',
    content, depth: 1, current: 'tutorials', tracks, articleCount: articles.length,
  });
}

/* ---------------------------------------------------------- article pages */

function renderArticle(article, articles) {
  const u = linker(3);
  const track = tracks.find((t) => t.slug === article.track);
  const siblings = articles.filter((a) => a.track === article.track);
  const idx = siblings.findIndex((a) => a.slug === article.slug);
  const prev = siblings[idx - 1];
  const next = siblings[idx + 1];

  const sidebar = tracks
    .map((t) => {
      const items = articles.filter((a) => a.track === t.slug);
      const open = t.slug === article.track;
      const links = items
        .map((a) => {
          const active = a.slug === article.slug && a.track === article.track;
          return `<li><a href="${u(a.url)}"${active ? ' class="active" aria-current="page"' : ''}>
            <span class="dot-check" data-done-dot="${a.url}"></span>${esc(a.title)}</a></li>`;
        })
        .join('');
      return `<details class="side-track"${open ? ' open' : ''} style="--track-color:${t.color}">
  <summary><span aria-hidden="true">${t.icon}</span> ${esc(t.short)}
    <span class="side-count">${items.length}</span></summary>
  <ul>${links}</ul>
</details>`;
    })
    .join('');

  const toc = article.toc.length
    ? `<nav class="toc" aria-label="On this page">
  <p class="toc-title">On this page</p>
  <ul>${article.toc
    .map((h) => `<li class="toc-l${h.level}"><a href="#${h.id}">${esc(h.text)}</a></li>`)
    .join('')}</ul>
</nav>`
    : '';

  const tagList = article.tags.length
    ? `<div class="tag-row">${article.tags
      .map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>`
    : '';

  const pager = `<nav class="pager" aria-label="Tutorial navigation">
  ${prev ? `<a class="pager-prev" href="${u(prev.url)}"><span>← Previous</span><strong>${esc(prev.title)}</strong></a>` : '<span></span>'}
  ${next ? `<a class="pager-next" href="${u(next.url)}"><span>Next →</span><strong>${esc(next.title)}</strong></a>` : '<span></span>'}
</nav>`;

  const related = articles
    .filter((a) => a.url !== article.url)
    .map((a) => ({
      a,
      score: a.tags.filter((t) => article.tags.includes(t)).length +
        (a.track === article.track ? 1 : 0),
    }))
    .filter((x) => x.score > 0)
    .sort((x, y) => y.score - x.score)
    .slice(0, 3)
    .map(({ a }) => `<li><a href="${u(a.url)}">${esc(a.title)}</a>
      <span class="mini-meta">${esc(a.trackTitle)}</span></li>`)
    .join('');

  const content = `<div class="doc-layout">
  <aside class="doc-sidebar" data-sidebar>
    <div class="sidebar-inner">
      <p class="sidebar-title">Course contents</p>
      ${sidebar}
    </div>
  </aside>

  <article class="doc-main" style="--track-color:${track.color}">
    ${breadcrumbs(u, [
      { label: 'Home', href: '/' },
      { label: 'Tutorials', href: '/tutorials/' },
      { label: track.title, href: `/tutorials/${track.slug}/` },
      { label: article.title },
    ])}
    <header class="doc-header">
      <div class="doc-meta-row">
        <a class="card-track" href="${u(`/tutorials/${track.slug}/`)}" style="--track-color:${track.color}">
          <span aria-hidden="true">${track.icon}</span> ${esc(track.short)}</a>
        ${difficultyBadge(article.difficulty)}
        <span class="mini-meta">⏱ ${article.readingTime} min read</span>
      </div>
      <h1>${esc(article.title)}</h1>
      <p class="lede">${esc(article.description || '')}</p>
      ${tagList}
      <div class="doc-actions">
        <button type="button" class="btn btn-small btn-done" data-mark-done="${article.url}">
          Mark as complete</button>
        <button type="button" class="btn btn-small btn-ghost" data-print>Print / PDF</button>
      </div>
    </header>

    <div class="doc-body">${article.html}</div>

    ${related ? `<section class="related"><h2>Related tutorials</h2><ul>${related}</ul></section>` : ''}
    ${pager}
  </article>

  <aside class="doc-toc">${toc}
    <div class="toc-cta">
      <p><strong>Ready to test yourself?</strong></p>
      <a class="btn btn-small btn-primary" href="${u('/practice/')}">Practice questions</a>
    </div>
  </aside>
</div>`;

  const quizData = article.quizzes.length
    ? `<script>window.AA_QUIZZES = ${JSON.stringify(
      Object.fromEntries(article.quizzes.map((q) => [q.id, q.questions])))};</script>`
    : '';

  return layout({
    title: article.title,
    description: article.description,
    content,
    depth: 3,
    bodyClass: 'page-doc',
    current: 'tutorials',
    tracks,
    articleCount: articles.length,
    extraScripts: quizData,
  });
}

/* --------------------------------------------------------- practice page */

function renderPractice(articles) {
  const u = linker(1);
  const all = [];
  for (const a of articles) {
    for (const q of a.quizzes) {
      for (const question of q.questions) {
        all.push({ ...question, track: a.track, source: a.title, sourceUrl: a.url });
      }
    }
  }

  const filters = tracks
    .map((t) => `<button type="button" class="chip" data-quiz-filter="${t.slug}"
      style="--track-color:${t.color}">${t.icon} ${esc(t.short)}</button>`)
    .join('');

  const content = `<div class="wrap page-head">
  ${breadcrumbs(u, [{ label: 'Home', href: '/' }, { label: 'Practice' }])}
  <h1>Practice questions</h1>
  <p class="lede">${all.length} questions pulled from every tutorial on the site.
  Answer them here, or find them in context at the end of each lesson.</p>
  <div class="filter-row">
    <button type="button" class="chip active" data-quiz-filter="all">All tracks</button>
    ${filters}
  </div>
  <div class="page-head-actions">
    <button class="btn btn-primary" type="button" data-quiz-start>Start a 10-question set</button>
    <button class="btn btn-ghost" type="button" data-quiz-reset>Reset score</button>
  </div>
  <div class="score-line" data-quiz-score></div>
</div>
<div class="wrap section"><div class="practice-list" data-practice-list></div></div>
<script>window.AA_PRACTICE = ${JSON.stringify(all)};</script>`;

  return layout({
    title: 'Practice questions',
    description: 'Multiple-choice practice questions on business analytics, statistics, SQL, visualization and predictive modelling.',
    content, depth: 1, current: 'practice', tracks, articleCount: articles.length,
  });
}

/* -------------------------------------------------- cheatsheets & glossary */

function renderCheatsheets(articles) {
  const u = linker(1);
  const dir = path.join(CONTENT, 'cheatsheets');
  const sheets = [];
  if (fs.existsSync(dir)) {
    for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.md'))) {
      const { data, body } = parseFrontMatter(fs.readFileSync(path.join(dir, file), 'utf8'));
      sheets.push({ ...data, order: data.order || 99,
        html: md.render(body, { linkPrefix: '../' }).html });
    }
  }
  sheets.sort((a, b) => a.order - b.order);

  const tabs = sheets
    .map((s, i) => `<button type="button" class="chip${i === 0 ? ' active' : ''}"
      data-sheet-tab="${md.slugify(s.title)}">${esc(s.title)}</button>`)
    .join('');

  const panels = sheets
    .map((s, i) => `<section class="sheet" data-sheet="${md.slugify(s.title)}"${i === 0 ? '' : ' hidden'}>
  <h2>${esc(s.title)}</h2>
  <p class="lede">${esc(s.description || '')}</p>
  <div class="doc-body">${s.html}</div>
</section>`)
    .join('');

  const content = `<div class="wrap page-head">
  ${breadcrumbs(u, [{ label: 'Home', href: '/' }, { label: 'Cheat sheets' }])}
  <h1>Cheat sheets</h1>
  <p class="lede">The formulas, syntax and decision rules worth keeping open in a
  second tab during an analysis.</p>
  <div class="filter-row" data-sheet-tabs>${tabs}</div>
</div>
<div class="wrap section sheets">${panels}</div>`;

  return layout({
    title: 'Cheat sheets',
    description: 'Quick-reference cheat sheets for statistics, SQL, chart selection and model metrics.',
    content, depth: 1, current: 'cheatsheets', tracks, articleCount: articles.length,
  });
}

function renderGlossary(articles) {
  const u = linker(1);
  const terms = loadData('glossary.json', []).slice().sort((a, b) =>
    a.term.localeCompare(b.term));

  const letters = [...new Set(terms.map((t) => t.term[0].toUpperCase()))].sort();
  const jump = letters
    .map((l) => `<a href="#letter-${l}">${l}</a>`)
    .join('');

  let body = '';
  for (const letter of letters) {
    const group = terms.filter((t) => t.term[0].toUpperCase() === letter);
    body += `<section class="glossary-group"><h2 id="letter-${letter}">${letter}</h2><dl>`;
    for (const t of group) {
      const link = t.link
        ? ` <a class="glossary-link" href="${u(t.link)}">Read more →</a>`
        : '';
      body += `<div class="glossary-item" data-term="${esc(t.term.toLowerCase())}">
        <dt>${esc(t.term)}</dt><dd>${md.inline(t.definition, { linkPrefix: '../' })}${link}</dd></div>`;
    }
    body += '</dl></section>';
  }

  const content = `<div class="wrap page-head">
  ${breadcrumbs(u, [{ label: 'Home', href: '/' }, { label: 'Glossary' }])}
  <h1>Glossary</h1>
  <p class="lede">${terms.length} terms an analyst hears in their first month, in plain English.</p>
  <input class="inline-filter" type="search" placeholder="Filter terms…" data-glossary-filter>
  <nav class="alpha-jump">${jump}</nav>
</div>
<div class="wrap section glossary">${body}
  <p class="empty-state" data-empty hidden>No terms match that filter.</p></div>`;

  return layout({
    title: 'Glossary',
    description: 'Business analytics glossary: every term explained in one line.',
    content, depth: 1, current: 'glossary', tracks, articleCount: articles.length,
  });
}

/* ------------------------------------------------------------ misc pages */

function renderSimplePage(opts, articles) {
  const u = linker(1);
  const content = `<div class="wrap page-head">
  ${breadcrumbs(u, [{ label: 'Home', href: '/' }, { label: opts.title }])}
  <h1>${esc(opts.title)}</h1>
  <p class="lede">${esc(opts.lede)}</p>
</div>
<div class="wrap section narrow"><div class="doc-body">${opts.html}</div></div>`;

  return layout({
    title: opts.title, description: opts.lede, content,
    depth: 1, tracks, articleCount: articles.length,
  });
}

function render404(articles) {
  const u = linker(0);
  const content = `<div class="wrap section narrow center">
  <p class="big-emoji" aria-hidden="true">📉</p>
  <h1>404 — this page has no data</h1>
  <p class="lede">The URL you followed does not exist. It happens to the best datasets.</p>
  <div class="page-head-actions center">
    <a class="btn btn-primary" href="${u('/tutorials/')}">Browse tutorials</a>
    <a class="btn btn-ghost" href="${u('/')}">Go home</a>
  </div>
</div>`;
  return layout({
    title: 'Page not found', description: 'Page not found',
    content, depth: 0, tracks, articleCount: articles.length,
  });
}

/* ------------------------------------------------------- search + sitemap */

/**
 * Client-side search index. Keys are single letters to keep the payload small;
 * `x` carries the full article text so search covers tables and body copy, not
 * just titles. The file is loaded once and cached across pages.
 */
function buildSearchIndex(articles) {
  const entries = articles.map((a) => ({
    t: a.title,
    d: a.description || '',
    u: a.url,
    k: a.trackTitle,
    c: a.trackColor,
    i: a.trackIcon,
    g: a.tags.join(' '),
    h: a.toc.map((h) => h.text).join(' | '),
    x: a.plain,
  }));
  return `window.__AA_SEARCH__ = ${JSON.stringify(entries)};`;
}

function buildSitemap(urls) {
  const body = urls
    .map((u) => `  <url><loc>${site.url}${u}</loc></url>`)
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>`;
}

/* ------------------------------------------------------------------- main */

function build() {
  const started = Date.now();
  console.log('Building AnalyticsAdda…');

  rmrf(OUT);
  fs.mkdirSync(OUT, { recursive: true });

  const articles = loadArticles();
  console.log(`  ${articles.length} tutorials across ${tracks.length} tracks`);

  const urls = ['/'];

  write('index.html', renderHome(articles));

  write('tracks/index.html', renderTracksIndex(articles));
  urls.push('/tracks/');

  write('tutorials/index.html', renderTutorialsIndex(articles));
  urls.push('/tutorials/');

  for (const track of tracks) {
    write(`tutorials/${track.slug}/index.html`, renderTrackPage(track, articles));
    urls.push(`/tutorials/${track.slug}/`);
  }

  for (const article of articles) {
    write(`tutorials/${article.track}/${article.slug}/index.html`,
      renderArticle(article, articles));
    urls.push(article.url);
  }

  write('practice/index.html', renderPractice(articles));
  write('cheatsheets/index.html', renderCheatsheets(articles));
  write('glossary/index.html', renderGlossary(articles));
  urls.push('/practice/', '/cheatsheets/', '/glossary/');

  for (const page of ['about', 'contribute']) {
    const file = path.join(CONTENT, '_pages', `${page}.md`);
    if (!fs.existsSync(file)) continue;
    const { data, body } = parseFrontMatter(fs.readFileSync(file, 'utf8'));
    write(`${page}/index.html`, renderSimplePage({
      title: data.title, lede: data.description || '',
      html: md.render(body, { linkPrefix: '../' }).html,
    }, articles));
    urls.push(`/${page}/`);
  }

  write('404.html', render404(articles));

  copyDir(ASSETS, path.join(OUT, 'assets'));
  write('assets/js/search-index.js', buildSearchIndex(articles));

  write('sitemap.xml', buildSitemap(urls));
  write('robots.txt', `User-agent: *\nAllow: /\nSitemap: ${site.url}/sitemap.xml\n`);
  write('.nojekyll', '');

  const quizCount = articles.reduce(
    (n, a) => n + a.quizzes.reduce((m, q) => m + q.questions.length, 0), 0);
  console.log(`  ${urls.length} pages, ${quizCount} quiz questions`);
  console.log(`Done in ${Date.now() - started}ms → docs/`);
}

if (require.main === module) build();

module.exports = { build };
