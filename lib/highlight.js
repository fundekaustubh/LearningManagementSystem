'use strict';

/**
 * A deliberately small syntax highlighter.
 *
 * It only needs to handle the languages used in the course content (SQL,
 * Python, R, plus plain text), so it tokenises with a single ordered regex per
 * language instead of pulling in a parser. Anything it does not recognise falls
 * through as escaped plain text, which is the safe default.
 */

const escapeHtml = (s) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const KEYWORDS = {
  sql: [
    'select', 'from', 'where', 'group', 'by', 'order', 'having', 'join', 'inner',
    'left', 'right', 'full', 'outer', 'cross', 'on', 'as', 'and', 'or', 'not',
    'in', 'is', 'null', 'like', 'ilike', 'between', 'case', 'when', 'then',
    'else', 'end', 'with', 'union', 'all', 'distinct', 'limit', 'offset',
    'insert', 'into', 'values', 'update', 'set', 'delete', 'create', 'table',
    'view', 'index', 'drop', 'alter', 'add', 'primary', 'key', 'foreign',
    'references', 'over', 'partition', 'rows', 'range', 'preceding',
    'following', 'unbounded', 'current', 'row', 'asc', 'desc', 'exists', 'any',
    'cast', 'interval', 'using', 'qualify', 'window', 'fetch', 'first', 'only',
  ],
  python: [
    'and', 'as', 'assert', 'async', 'await', 'break', 'class', 'continue',
    'def', 'del', 'elif', 'else', 'except', 'finally', 'for', 'from', 'global',
    'if', 'import', 'in', 'is', 'lambda', 'nonlocal', 'not', 'or', 'pass',
    'raise', 'return', 'try', 'while', 'with', 'yield', 'True', 'False', 'None',
  ],
  r: [
    'if', 'else', 'for', 'while', 'repeat', 'function', 'return', 'break',
    'next', 'in', 'TRUE', 'FALSE', 'NULL', 'NA', 'Inf', 'NaN', 'library',
    'require',
  ],
  bash: [
    'if', 'then', 'else', 'fi', 'for', 'in', 'do', 'done', 'while', 'case',
    'esac', 'function', 'export', 'return', 'echo', 'cd', 'pip', 'npm', 'node',
  ],
};

const BUILTINS = {
  python: [
    'abs', 'dict', 'enumerate', 'float', 'int', 'len', 'list', 'max', 'min',
    'print', 'range', 'round', 'set', 'sorted', 'str', 'sum', 'tuple', 'zip',
  ],
  sql: [
    'count', 'sum', 'avg', 'min', 'max', 'coalesce', 'nullif', 'round',
    'row_number', 'rank', 'dense_rank', 'ntile', 'lag', 'lead', 'first_value',
    'last_value', 'date_trunc', 'extract', 'now', 'current_date', 'abs',
    'greatest', 'least', 'percentile_cont', 'stddev', 'variance', 'concat',
    'substring', 'trim', 'lower', 'upper', 'length', 'regexp_replace',
  ],
  r: ['c', 'mean', 'median', 'sd', 'var', 'sum', 'lm', 'glm', 'summary', 'head', 'plot'],
};

const ALIASES = {
  py: 'python', python3: 'python', postgresql: 'sql', mysql: 'sql',
  psql: 'sql', shell: 'bash', sh: 'bash', console: 'bash', txt: 'text',
  plain: 'text', output: 'text',
};

/** Ordered token matchers. First match wins, so comments/strings come first. */
function rulesFor(lang) {
  const kw = (KEYWORDS[lang] || []).join('|');
  const bi = (BUILTINS[lang] || []).join('|');
  const rules = [];

  if (lang === 'sql') {
    rules.push({ type: 'comment', re: /^--[^\n]*/ });
    rules.push({ type: 'comment', re: /^\/\*[\s\S]*?\*\// });
    rules.push({ type: 'string', re: /^'(?:''|\\.|[^'])*'/ });
    rules.push({ type: 'string', re: /^"(?:\\.|[^"])*"/ });
  } else if (lang === 'python') {
    rules.push({ type: 'comment', re: /^#[^\n]*/ });
    rules.push({ type: 'string', re: /^[rbf]?"""[\s\S]*?"""/ });
    rules.push({ type: 'string', re: /^[rbf]?'''[\s\S]*?'''/ });
    rules.push({ type: 'string', re: /^[rbf]?"(?:\\.|[^"\\])*"/ });
    rules.push({ type: 'string', re: /^[rbf]?'(?:\\.|[^'\\])*'/ });
    rules.push({ type: 'decorator', re: /^@[A-Za-z_][\w.]*/ });
  } else if (lang === 'r') {
    rules.push({ type: 'comment', re: /^#[^\n]*/ });
    rules.push({ type: 'string', re: /^"(?:\\.|[^"\\])*"/ });
    rules.push({ type: 'string', re: /^'(?:\\.|[^'\\])*'/ });
  } else if (lang === 'bash') {
    rules.push({ type: 'comment', re: /^#[^\n]*/ });
    rules.push({ type: 'string', re: /^"(?:\\.|[^"\\])*"/ });
    rules.push({ type: 'string', re: /^'[^']*'/ });
  }

  rules.push({ type: 'number', re: /^\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b/ });
  if (kw) {
    rules.push({
      type: 'keyword',
      re: new RegExp(`^\\b(?:${kw})\\b`, lang === 'sql' ? 'i' : ''),
    });
  }
  if (bi) {
    rules.push({
      type: 'builtin',
      re: new RegExp(`^\\b(?:${bi})\\b`, lang === 'sql' ? 'i' : ''),
    });
  }
  rules.push({ type: 'function', re: /^\b[A-Za-z_][\w.]*(?=\s*\()/ });
  rules.push({ type: 'operator', re: /^(?:<-|->|\|>|%[a-z]*%|[-+*/%=<>!~^|&:]+)/ });
  return rules;
}

/**
 * Highlight `code` for `lang`, returning HTML-escaped markup.
 * Unknown languages return escaped text unchanged.
 */
function highlight(code, langInput) {
  const lang = ALIASES[String(langInput || '').toLowerCase()] ||
    String(langInput || '').toLowerCase();
  if (!lang || lang === 'text' || !KEYWORDS[lang]) return escapeHtml(code);

  const rules = rulesFor(lang);
  let out = '';
  let rest = code;
  let guard = 0;

  while (rest.length && guard++ < 200000) {
    // Fast-path whitespace so rules never have to care about it.
    const ws = /^\s+/.exec(rest);
    if (ws) {
      out += escapeHtml(ws[0]);
      rest = rest.slice(ws[0].length);
      continue;
    }
    let matched = false;
    for (const rule of rules) {
      const m = rule.re.exec(rest);
      if (m && m[0].length) {
        out += `<span class="tok-${rule.type}">${escapeHtml(m[0])}</span>`;
        rest = rest.slice(m[0].length);
        matched = true;
        break;
      }
    }
    if (!matched) {
      // Consume a whole identifier/character so we always make progress.
      const chunk = /^[A-Za-z_][\w]*|^[\s\S]/.exec(rest)[0];
      out += escapeHtml(chunk);
      rest = rest.slice(chunk.length);
    }
  }
  return out;
}

module.exports = { highlight, escapeHtml };
