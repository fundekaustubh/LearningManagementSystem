'use strict';

/**
 * Post-build validation. Run after `node build.js`; exits non-zero on failure
 * so CI catches problems before they reach the published site.
 *
 * Checks:
 *   1. Every internal href/src resolves to a file that exists.
 *   2. Every in-page #anchor matches an element id on the target page.
 *   3. Every quiz question has a valid answer index and an explanation.
 *   4. The search index parses and covers every tutorial.
 */

const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'docs');
const failures = [];

function walk(dir, ext, found = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, ext, found);
    else if (full.endsWith(ext)) found.push(full);
  }
  return found;
}

if (!fs.existsSync(OUT)) {
  console.error('docs/ does not exist — run `node build.js` first.');
  process.exit(1);
}

const pages = walk(OUT, '.html');

/* ------------------------------------------------- 1 & 2: links and anchors */

/** Collects every `id="…"` on a page so anchors can be verified. */
const idCache = new Map();
function idsFor(file) {
  if (!idCache.has(file)) {
    const html = fs.readFileSync(file, 'utf8');
    idCache.set(file, new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));
  }
  return idCache.get(file);
}

for (const page of pages) {
  const html = fs.readFileSync(page, 'utf8');
  const rel = path.relative(OUT, page);

  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const href = match[1];
    if (/^(https?:|mailto:|data:|javascript:)/.test(href)) continue;

    const [targetPath, anchor] = href.split('#');

    // A bare "#id" refers to the current page.
    let target = page;
    if (targetPath) {
      target = path.resolve(path.dirname(page), targetPath);
      if (!path.extname(target)) target = path.join(target, 'index.html');
      if (!fs.existsSync(target)) {
        failures.push(`broken link  ${rel} -> ${href}`);
        continue;
      }
    }

    if (anchor && target.endsWith('.html') && !idsFor(target).has(anchor)) {
      failures.push(`broken anchor ${rel} -> ${href}`);
    }
  }
}

/* ------------------------------------------------------------- 3: quizzes */

const practice = path.join(OUT, 'practice', 'index.html');
if (fs.existsSync(practice)) {
  const html = fs.readFileSync(practice, 'utf8');
  const m = /window\.AA_PRACTICE = (\[[\s\S]*?\]);/.exec(html);
  if (!m) {
    failures.push('practice page has no question bank');
  } else {
    const questions = JSON.parse(m[1]);
    questions.forEach((q, i) => {
      if (!q.q) failures.push(`quiz ${i}: missing question text`);
      if (!Array.isArray(q.options) || q.options.length < 2) {
        failures.push(`quiz ${i}: needs at least two options`);
      } else if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= q.options.length) {
        failures.push(`quiz ${i}: answer index ${q.answer} out of range`);
      }
      if (!q.explain) failures.push(`quiz "${String(q.q).slice(0, 40)}": missing explanation`);
    });
    console.log(`  ${questions.length} quiz questions validated`);
  }
}

/* -------------------------------------------------------- 4: search index */

const indexFile = path.join(OUT, 'assets', 'js', 'search-index.js');
if (!fs.existsSync(indexFile)) {
  failures.push('search index missing');
} else {
  const raw = fs.readFileSync(indexFile, 'utf8');
  const json = raw.slice(raw.indexOf('=') + 1).trim().replace(/;$/, '');
  let entries;
  try {
    entries = JSON.parse(json);
  } catch (err) {
    failures.push(`search index does not parse: ${err.message}`);
  }
  if (entries) {
    const tutorialPages = pages.filter((p) => path.relative(OUT, p).startsWith('tutorials' + path.sep))
      .filter((p) => path.relative(OUT, p).split(path.sep).length === 4);
    if (entries.length !== tutorialPages.length) {
      failures.push(
        `search index has ${entries.length} entries but ${tutorialPages.length} tutorial pages exist`);
    }
    for (const e of entries) {
      if (!e.t || !e.u) failures.push(`search entry missing title or url: ${JSON.stringify(e).slice(0, 60)}`);
    }
    console.log(`  ${entries.length} search index entries validated`);
  }
}

/* ------------------------------------------------------------------ report */

console.log(`  ${pages.length} pages checked`);

if (failures.length) {
  console.error(`\n${failures.length} problem(s):`);
  for (const f of failures) console.error('  ' + f);
  process.exit(1);
}

console.log('\nAll checks passed.');
