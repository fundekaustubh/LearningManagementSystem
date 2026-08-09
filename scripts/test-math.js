'use strict';

/**
 * Unit tests for the LaTeX-subset renderer and its integration with the
 * Markdown inline pass. Run via `npm run check`.
 *
 * The bug these guard against: `$...$` used to be passed through as literal
 * text, so readers saw raw `\frac{p}{1-p}` on the page.
 */

const assert = require('assert');
const math = require('../lib/math');
const md = require('../lib/markdown');

let pass = 0;
const failures = [];

function t(name, fn) {
  try { fn(); pass++; } catch (err) { failures.push(`${name}: ${err.message}`); }
}

/** Asserts the rendered output contains a fragment and never leaks LaTeX. */
function renders(src, ...expected) {
  const html = math.render(src);
  for (const frag of expected) {
    assert.ok(html.includes(frag), `expected ${JSON.stringify(frag)} in ${html}`);
  }
  assert.ok(!/\\[a-zA-Z]/.test(html), `raw LaTeX command left in output: ${html}`);
  return html;
}

/* ------------------------------------------------------------- structures */

t('fraction', () => {
  renders('\\frac{a}{b}',
    '<span class="m-frac">', '<span class="m-num">a</span>', '<span class="m-den">b</span>');
});

t('fraction with multi-word operands', () => {
  const html = renders('\\frac{Total\\ spend}{New\\ customers}');
  assert.ok(html.includes('Total spend'), html);
  assert.ok(html.includes('New customers'), html);
});

t('nested fraction', () => {
  const html = renders('\\frac{\\frac{a}{b}}{c}');
  assert.strictEqual((html.match(/m-frac/g) || []).length, 2, html);
});

t('square root', () => {
  renders('\\sqrt{x}', '<span class="m-sqrt">', 'm-radical', '<span class="m-sqrt-body">x</span>');
});

t('root with index', () => {
  renders('\\sqrt[3]{x}', 'm-root');
});

t('superscript, braced and bare', () => {
  assert.ok(math.render('e^{-x}').includes('<sup>-x</sup>'));
  assert.ok(math.render('x^2').includes('<sup>2</sup>'));
});

t('subscript, braced and bare', () => {
  assert.ok(math.render('z_{α/2}').includes('<sub>α/2</sub>'));
  assert.ok(math.render('β_0').includes('<sub>0</sub>'));
});

t('script attaches to the preceding atom only', () => {
  const html = math.render('β_0 + β_1');
  assert.ok(html.includes('β<sub>0</sub>'), html);
  assert.ok(html.includes('β<sub>1</sub>'), html);
});

t('left/right delimiters are paired into one group', () => {
  const html = renders('\\left(\\frac{p}{1-p}\\right)', 'm-delims', 'm-open', 'm-close');
  assert.strictEqual((html.match(/m-delims/g) || []).length, 1, html);
  // the fraction must sit inside the delimiter group, not after it
  assert.ok(/m-inner[^]*m-frac[^]*<\/span><span class="m-close"/.test(html), html);
});

t('nested left/right pairs match correctly', () => {
  const html = renders('\\left(a + \\left(b\\right)\\right)');
  assert.strictEqual((html.match(/m-delims/g) || []).length, 2, html);
});

t('unclosed \\left still renders its contents', () => {
  const html = renders('\\left(\\frac{a}{b}');
  assert.ok(html.includes('m-frac'), html);
});

t('symbols map to glyphs', () => {
  assert.ok(math.render('\\sum').includes('∑'));
  assert.ok(math.render('a \\times b').includes('×'));
  assert.ok(math.render('\\approx').includes('≈'));
  assert.ok(math.render('\\mu').includes('μ'));
});

t('escaped characters', () => {
  assert.ok(math.render('50\\%').includes('50%'));
});

t('inherited object members are not treated as symbols', () => {
  // A bare SYMBOLS[name] lookup would return Object.prototype.toString here
  // and splice a function into the output.
  for (const name of ['toString', 'constructor', 'valueOf', 'hasOwnProperty']) {
    const html = math.render('\\' + name);
    assert.ok(!/function|native code|\[object/.test(html),
      `${name} leaked a prototype member: ${html}`);
    assert.ok(html.includes(name), html);
  }
});

t('unknown command degrades to readable text', () => {
  const html = math.render('\\notarealcommand');
  assert.ok(!html.includes('\\'), html);
  assert.ok(html.includes('notarealcommand'), html);
});

t('unbalanced braces do not throw', () => {
  assert.doesNotThrow(() => math.render('\\frac{a}{b'));
});

t('html in a formula is escaped', () => {
  const html = math.render('a < b & c');
  assert.ok(html.includes('&lt;'), html);
  assert.ok(html.includes('&amp;'), html);
  assert.ok(!/<(?!\/?(span|sup|sub)\b)/.test(html), `unescaped tag in ${html}`);
});

/* ----------------------------------------------------- markdown integration */

t('inline $...$ is rendered, not passed through', () => {
  const html = md.inline('The formula $\\frac{a}{b}$ here.');
  assert.ok(html.includes('m-frac'), html);
  assert.ok(!html.includes('\\frac'), `raw LaTeX leaked: ${html}`);
});

t('the real logistic regression formulas render', () => {
  for (const src of [
    '$P(y=1) = \\frac{1}{1 + e^{-(β_0 + β_1x_1 + ... + β_kx_k)}}$',
    '$log\\left(\\frac{p}{1-p}\\right) = β_0 + β_1x_1 + ... + β_kx_k$',
  ]) {
    const html = md.inline(src);
    assert.ok(!/\\(frac|left|right|sqrt|sum)/.test(html), `raw LaTeX leaked: ${html}`);
    assert.ok(html.includes('m-frac'), html);
  }
});

t('emphasis rules do not corrupt formulas', () => {
  // Underscores inside a formula must not be treated as markup, and a
  // formula must not swallow surrounding emphasis.
  const html = md.inline('**Bold** and $β_0 + β_1$ and *italic*');
  assert.ok(html.includes('<strong>Bold</strong>'), html);
  assert.ok(html.includes('<em>italic</em>'), html);
  assert.ok(html.includes('β<sub>0</sub>'), html);
});

t('a $ inside code is not treated as math', () => {
  const html = md.inline('Costs `$100` per unit.');
  assert.ok(html.includes('<code>$100</code>'), html);
  assert.ok(!html.includes('class="math"'), html);
});

t('two formulas in one line stay separate', () => {
  const html = md.inline('$a^2$ and $b^2$');
  assert.strictEqual((html.match(/class="math"/g) || []).length, 2, html);
});

t('a lone dollar amount is left alone', () => {
  const html = md.inline('It costs $5 to make.');
  assert.ok(!html.includes('class="math"'), html);
});

/* ------------------------------------------------------------------ report */

if (failures.length) {
  console.error(`\nmath: ${pass} passed, ${failures.length} FAILED`);
  for (const f of failures) console.error('  ' + f);
  process.exit(1);
}
console.log(`  ${pass} math rendering tests passed`);
