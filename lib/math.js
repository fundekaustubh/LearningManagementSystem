'use strict';

/**
 * A very small LaTeX-subset renderer.
 *
 * The content uses `$...$` for formulas, but only a handful of constructs:
 * fractions, radicals, sub/superscripts, sized parentheses and a few symbols.
 * Rendering that subset to HTML+CSS keeps the site dependency-free and avoids
 * shipping a full math engine and its fonts for ~40 formulas.
 *
 * Anything unrecognised falls through as escaped text, so an unsupported
 * command degrades to being readable rather than breaking the page.
 */

const { escapeHtml } = require('./highlight');

/** Multi-character commands that map to a single glyph. */
const SYMBOLS = {
  times: '×', cdot: '·', div: '÷', pm: '±', mp: '∓',
  approx: '≈', neq: '≠', ne: '≠', leq: '≤', le: '≤', geq: '≥', ge: '≥',
  ll: '≪', gg: '≫', equiv: '≡', propto: '∝', sim: '∼',
  sum: '∑', prod: '∏', int: '∫', infty: '∞', partial: '∂',
  alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', epsilon: 'ε', zeta: 'ζ',
  eta: 'η', theta: 'θ', kappa: 'κ', lambda: 'λ', mu: 'μ', nu: 'ν',
  xi: 'ξ', pi: 'π', rho: 'ρ', sigma: 'σ', tau: 'τ', phi: 'φ', chi: 'χ',
  psi: 'ψ', omega: 'ω',
  Gamma: 'Γ', Delta: 'Δ', Theta: 'Θ', Lambda: 'Λ', Xi: 'Ξ', Pi: 'Π',
  Sigma: 'Σ', Phi: 'Φ', Psi: 'Ψ', Omega: 'Ω',
  in: '∈', notin: '∉', subset: '⊂', cup: '∪', cap: '∩',
  rightarrow: '→', to: '→', leftarrow: '←', Rightarrow: '⇒',
  ldots: '…', dots: '…', cdots: '⋯',
  bar: '̄', hat: '̂',   // combining marks, applied to the next char
};

/** Escaped punctuation: `\%` -> `%`. */
const ESCAPED = new Set(['%', '$', '&', '#', '_', '{', '}', '\\']);

/**
 * Reads a braced group starting at `src[i]` (which must be `{`).
 * Returns the raw inner text and the index just past the closing brace.
 */
function readGroup(src, i) {
  let depth = 0;
  const start = i + 1;
  for (let j = i; j < src.length; j++) {
    if (src[j] === '{') depth++;
    else if (src[j] === '}') {
      depth--;
      if (depth === 0) return { body: src.slice(start, j), next: j + 1 };
    }
  }
  // Unbalanced: treat the remainder as the group rather than throwing.
  return { body: src.slice(start), next: src.length };
}

/**
 * From just after a `\left<delim>`, finds its matching `\right<delim>`,
 * accounting for nesting. Returns where the inner content ends, the closing
 * delimiter, and where to resume. If there is no `\right`, the rest of the
 * string is treated as the group so the formula still renders.
 */
function findMatchingRight(src, from) {
  let depth = 0;
  const re = /\\(left|right)(.?)/g;
  re.lastIndex = from;
  let m;
  while ((m = re.exec(src)) !== null) {
    if (m[1] === 'left') depth++;
    else if (depth === 0) {
      return { start: m.index, delim: m[2], next: m.index + m[0].length };
    } else depth--;
  }
  return { start: src.length, delim: '', next: src.length };
}

/**
 * Reads one argument: a braced group, a command, or a single character.
 * Used for `\frac` operands and for sub/superscripts.
 */
function readArg(src, i) {
  while (src[i] === ' ') i++;
  if (src[i] === '{') {
    const g = readGroup(src, i);
    return { html: render(g.body), next: g.next };
  }
  if (src[i] === '\\') {
    const m = /^\\([a-zA-Z]+|.)/.exec(src.slice(i));
    if (m) {
      const piece = render(m[0]);
      return { html: piece, next: i + m[0].length };
    }
  }
  if (i >= src.length) return { html: '', next: i };
  return { html: escapeHtml(src[i]), next: i + 1 };
}

/** Renders a LaTeX-subset string to HTML. */
function render(src) {
  const atoms = [];
  let i = 0;

  while (i < src.length) {
    const ch = src[i];

    // ---- commands
    if (ch === '\\') {
      const rest = src.slice(i);

      // `\ ` is an explicit space, used to keep words apart inside formulas.
      if (rest[1] === ' ') { atoms.push(' '); i += 2; continue; }

      const cmd = /^\\([a-zA-Z]+)/.exec(rest);
      if (cmd) {
        const name = cmd[1];
        i += cmd[0].length;

        if (name === 'frac' || name === 'dfrac' || name === 'tfrac') {
          const a = readArg(src, i);
          const b = readArg(src, a.next);
          i = b.next;
          atoms.push(
            `<span class="m-frac"><span class="m-num">${a.html}</span>` +
            `<span class="m-den">${b.html}</span></span>`);
          continue;
        }

        if (name === 'sqrt') {
          let index = '';
          if (src[i] === '[') {
            const close = src.indexOf(']', i);
            if (close !== -1) { index = render(src.slice(i + 1, close)); i = close + 1; }
          }
          const a = readArg(src, i);
          i = a.next;
          atoms.push(
            `<span class="m-sqrt">${index ? `<span class="m-root">${index}</span>` : ''}` +
            `<span class="m-radical">√</span>` +
            `<span class="m-sqrt-body">${a.html}</span></span>`);
          continue;
        }

        // \left( ... \right) — pair the delimiters so the group can be laid
        // out as one flex row, which centres tall delimiters against their
        // contents instead of leaving them sitting on the baseline.
        if (name === 'left') {
          const open = src[i] === undefined ? '' : src[i];
          i += 1;
          const close = findMatchingRight(src, i);
          const inner = render(src.slice(i, close.start));
          i = close.next;
          atoms.push(
            `<span class="m-delims">` +
            (open && open !== '.' ? `<span class="m-open">${escapeHtml(open)}</span>` : '') +
            `<span class="m-inner">${inner}</span>` +
            (close.delim && close.delim !== '.' ? `<span class="m-close">${escapeHtml(close.delim)}</span>` : '') +
            `</span>`);
          continue;
        }

        // A stray \right without its \left: emit the delimiter alone.
        if (name === 'right') {
          const delim = src[i];
          if (delim !== undefined && delim !== '.') {
            atoms.push(`<span class="m-open">${escapeHtml(delim)}</span>`);
          }
          i += 1;
          continue;
        }

        // Accents attach to the following argument.
        if (name === 'bar' || name === 'hat') {
          const a = readArg(src, i);
          i = a.next;
          atoms.push(`<span class="m-accent">${a.html}${SYMBOLS[name]}</span>`);
          continue;
        }

        if (name === 'text' || name === 'mathrm' || name === 'operatorname') {
          const a = readArg(src, i);
          i = a.next;
          atoms.push(`<span class="m-text">${a.html}</span>`);
          continue;
        }

        if (SYMBOLS[name]) { atoms.push(SYMBOLS[name]); continue; }

        // Unknown command: show its name rather than swallowing it.
        atoms.push(escapeHtml(name));
        continue;
      }

      // `\%`, `\$`, `\_` and friends.
      const esc = rest[1];
      if (esc !== undefined) {
        atoms.push(escapeHtml(ESCAPED.has(esc) ? esc : esc));
        i += 2;
        continue;
      }
      i += 1;
      continue;
    }

    // ---- groups
    if (ch === '{') {
      const g = readGroup(src, i);
      atoms.push(render(g.body));
      i = g.next;
      continue;
    }

    // ---- sub/superscripts attach to the atom just emitted
    if (ch === '^' || ch === '_') {
      const base = atoms.pop() || '';
      const a = readArg(src, i + 1);
      const tag = ch === '^' ? 'sup' : 'sub';
      atoms.push(`${base}<${tag}>${a.html}</${tag}>`);
      i = a.next;
      continue;
    }

    // ---- plain text, consumed in runs so escaping happens once
    const run = /^[^\\{}^_]+/.exec(src.slice(i))[0];
    atoms.push(escapeHtml(run));
    i += run.length;
  }

  return atoms.join('');
}

/** Wraps a rendered formula in its inline container. */
function renderInline(src) {
  return `<span class="math">${render(src)}</span>`;
}

module.exports = { render, renderInline };
