/* AnalyticsAdda — client behaviour.
   Vanilla JS, no build step, no dependencies. Everything degrades gracefully:
   the site is fully readable with JavaScript disabled. */

(function () {
  'use strict';

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const base = window.AA_BASE || './';

  /* ------------------------------------------------------------ storage */

  const store = {
    get(key, fallback) {
      try {
        const raw = localStorage.getItem(key);
        return raw === null ? fallback : JSON.parse(raw);
      } catch (e) { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* private mode */ }
    },
  };

  /* -------------------------------------------------------------- theme */

  const themeToggle = $('[data-theme-toggle]');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = next;
      store.set('aa-theme', next);
    });
  }

  /* --------------------------------------------------------- mobile nav */

  const menuToggle = $('[data-menu-toggle]');
  const mobileNav = $('[data-mobile-nav]');
  if (menuToggle && mobileNav) {
    menuToggle.addEventListener('click', () => {
      const open = mobileNav.classList.toggle('open');
      menuToggle.setAttribute('aria-expanded', String(open));
    });
  }

  /* -------------------------------------------------------- copy button */

  $$('.copy-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const code = $('code', btn.closest('.code-block'));
      if (!code) return;
      try {
        await navigator.clipboard.writeText(code.innerText);
      } catch (e) {
        // Fallback for browsers without the async clipboard API.
        const ta = document.createElement('textarea');
        ta.value = code.innerText;
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); } catch (e2) { /* ignore */ }
        document.body.removeChild(ta);
      }
      btn.textContent = 'Copied!';
      btn.classList.add('copied');
      setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 1600);
    });
  });

  const printBtn = $('[data-print]');
  if (printBtn) printBtn.addEventListener('click', () => window.print());

  /* ------------------------------------------------------- progress API */

  const DONE_KEY = 'aa-completed';
  const completed = () => store.get(DONE_KEY, []);
  const isDone = (url) => completed().indexOf(url) !== -1;

  function toggleDone(url) {
    const list = completed();
    const i = list.indexOf(url);
    if (i === -1) list.push(url); else list.splice(i, 1);
    store.set(DONE_KEY, list);
    paintProgress();
    return i === -1;
  }

  function paintProgress() {
    const done = completed();

    $$('[data-mark-done]').forEach((btn) => {
      const on = done.indexOf(btn.dataset.markDone) !== -1;
      btn.classList.toggle('is-done', on);
      btn.textContent = on ? '✓ Completed' : 'Mark as complete';
    });

    $$('[data-done-dot]').forEach((dot) => {
      dot.classList.toggle('is-done', done.indexOf(dot.dataset.doneDot) !== -1);
    });

    $$('[data-done-flag]').forEach((flag) => {
      flag.textContent = done.indexOf(flag.dataset.doneFlag) !== -1 ? '✓ Done' : '';
    });

    $$('[data-track-progress]').forEach((el) => {
      const urls = (el.dataset.trackUrls || '').split(',').filter(Boolean);
      const n = urls.filter((u) => done.indexOf(u) !== -1).length;
      el.textContent = n ? `${n}/${urls.length} done` : '';
    });

    $$('[data-track-progress-bar]').forEach((el) => {
      const urls = (el.dataset.trackUrls || '').split(',').filter(Boolean);
      const n = urls.filter((u) => done.indexOf(u) !== -1).length;
      const pct = urls.length ? Math.round((n / urls.length) * 100) : 0;
      const fill = $('.progress-fill', el);
      const label = $('.progress-label', el);
      if (fill) fill.style.width = pct + '%';
      if (label) label.textContent = `${n} of ${urls.length} complete (${pct}%)`;
    });
  }

  $$('[data-mark-done]').forEach((btn) => {
    btn.addEventListener('click', () => toggleDone(btn.dataset.markDone));
  });

  paintProgress();

  /* --------------------------------------------------------------- TOC */

  const tocLinks = $$('.toc a');
  if (tocLinks.length && 'IntersectionObserver' in window) {
    const headings = tocLinks
      .map((a) => document.getElementById(a.getAttribute('href').slice(1)))
      .filter(Boolean);

    const seen = new Set();
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) seen.add(entry.target.id);
        else seen.delete(entry.target.id);
      });
      // Highlight the first heading currently in view, else keep the last one.
      const active = headings.find((h) => seen.has(h.id));
      if (active) {
        tocLinks.forEach((a) => {
          a.classList.toggle('active', a.getAttribute('href') === '#' + active.id);
        });
      }
    }, { rootMargin: '-80px 0px -70% 0px' });

    headings.forEach((h) => observer.observe(h));
  }

  /* ------------------------------------------------------------- quiz */

  const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

  /**
   * Renders a list of questions into `host`.
   * Each question: { q, options: [], answer: index, explain }
   */
  function renderQuiz(host, questions, opts) {
    const options = opts || {};
    host.innerHTML = '';

    if (options.title !== false) {
      const head = document.createElement('div');
      head.className = 'quiz-head';
      head.innerHTML =
        '<h3>✅ Check your understanding</h3>' +
        `<span class="quiz-progress">0 / ${questions.length}</span>`;
      host.appendChild(head);
    }

    let answered = 0;

    questions.forEach((question, qi) => {
      const block = document.createElement('div');
      block.className = 'quiz-q';

      const prompt = document.createElement('p');
      prompt.className = 'quiz-prompt';
      prompt.textContent = `${qi + 1}. ${question.q}`;
      block.appendChild(prompt);

      if (question.source && options.showSource) {
        const src = document.createElement('p');
        src.className = 'practice-source';
        src.append('From: ');
        if (question.sourceUrl) {
          const link = document.createElement('a');
          link.href = base + question.sourceUrl.replace(/^\//, '');
          link.textContent = question.source;
          src.appendChild(link);
        } else {
          src.append(question.source);
        }
        block.insertBefore(src, prompt);
      }

      const list = document.createElement('ul');
      list.className = 'quiz-options';

      const buttons = [];
      question.options.forEach((text, oi) => {
        const li = document.createElement('li');
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'quiz-option';
        btn.innerHTML = `<span class="opt-key">${LETTERS[oi]}</span><span></span>`;
        btn.lastChild.textContent = text;

        btn.addEventListener('click', () => {
          if (block.dataset.answered) return;
          block.dataset.answered = 'yes';
          answered += 1;

          buttons.forEach((b, bi) => {
            b.disabled = true;
            if (bi === question.answer) b.classList.add('correct');
            else if (bi === oi) b.classList.add('wrong');
          });

          const explain = document.createElement('div');
          explain.className = 'quiz-explain';
          const correct = oi === question.answer;
          explain.innerHTML =
            `<strong>${correct ? 'Correct.' : 'Not quite.'}</strong> ` +
            `The answer is ${LETTERS[question.answer]}. `;
          explain.append(question.explain || '');
          block.appendChild(explain);

          const progress = $('.quiz-progress', host);
          if (progress) progress.textContent = `${answered} / ${questions.length}`;
          if (options.onAnswer) options.onAnswer(correct);
        });

        buttons.push(btn);
        li.appendChild(btn);
        list.appendChild(li);
      });

      block.appendChild(list);
      host.appendChild(block);
    });
  }

  // In-article quizzes.
  if (window.AA_QUIZZES) {
    $$('[data-quiz]').forEach((host) => {
      const questions = window.AA_QUIZZES[host.dataset.quiz];
      if (questions) renderQuiz(host, questions);
    });
  }

  /* --------------------------------------------------- practice page */

  const practiceList = $('[data-practice-list]');
  if (practiceList && window.AA_PRACTICE) {
    const pool = window.AA_PRACTICE;
    let filter = 'all';
    let score = store.get('aa-score', { right: 0, total: 0 });
    const scoreLine = $('[data-quiz-score]');

    function paintScore() {
      if (!scoreLine) return;
      scoreLine.textContent = score.total
        ? `Session score: ${score.right} / ${score.total} correct ` +
          `(${Math.round((score.right / score.total) * 100)}%)`
        : '';
    }

    function shuffle(arr) {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    }

    function paintPractice(questions) {
      practiceList.innerHTML = '';
      if (!questions.length) {
        practiceList.innerHTML = '<p class="empty-state">No questions in this track yet.</p>';
        return;
      }
      const host = document.createElement('div');
      host.className = 'practice-item';
      practiceList.appendChild(host);
      renderQuiz(host, questions, {
        title: false,
        showSource: true,
        onAnswer(correct) {
          score = { right: score.right + (correct ? 1 : 0), total: score.total + 1 };
          store.set('aa-score', score);
          paintScore();
        },
      });
    }

    function currentPool() {
      return filter === 'all' ? pool : pool.filter((q) => q.track === filter);
    }

    $$('[data-quiz-filter]').forEach((chip) => {
      chip.addEventListener('click', () => {
        $$('[data-quiz-filter]').forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
        filter = chip.dataset.quizFilter;
        paintPractice(currentPool());
      });
    });

    const startBtn = $('[data-quiz-start]');
    if (startBtn) {
      startBtn.addEventListener('click', () => paintPractice(shuffle(currentPool()).slice(0, 10)));
    }

    const resetBtn = $('[data-quiz-reset]');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        score = { right: 0, total: 0 };
        store.set('aa-score', score);
        paintScore();
        paintPractice(currentPool());
      });
    }

    paintScore();
    paintPractice(pool);
  }

  /* ------------------------------------------------ list/tab filtering */

  const filterTarget = $('[data-filter-target]');
  if (filterTarget) {
    const cards = $$('.card', filterTarget);
    const emptyEl = $('[data-empty]');
    let trackFilter = 'all';
    let textFilter = '';

    function applyFilters() {
      let visible = 0;
      cards.forEach((card) => {
        const okTrack = trackFilter === 'all' || card.dataset.track === trackFilter;
        const okText = !textFilter || card.dataset.title.indexOf(textFilter) !== -1;
        const show = okTrack && okText;
        card.hidden = !show;
        if (show) visible += 1;
      });
      if (emptyEl) emptyEl.hidden = visible !== 0;
    }

    $$('[data-filter]').forEach((chip) => {
      chip.addEventListener('click', () => {
        $$('[data-filter]').forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
        trackFilter = chip.dataset.filter;
        applyFilters();
      });
    });

    const inlineFilter = $('[data-inline-filter]');
    if (inlineFilter) {
      inlineFilter.addEventListener('input', () => {
        textFilter = inlineFilter.value.trim().toLowerCase();
        applyFilters();
      });
    }
  }

  // Cheat sheet tabs.
  $$('[data-sheet-tab]').forEach((tab) => {
    tab.addEventListener('click', () => {
      $$('[data-sheet-tab]').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      $$('[data-sheet]').forEach((panel) => {
        panel.hidden = panel.dataset.sheet !== tab.dataset.sheetTab;
      });
    });
  });

  // Glossary filter.
  const glossaryFilter = $('[data-glossary-filter]');
  if (glossaryFilter) {
    const items = $$('.glossary-item');
    const groups = $$('.glossary-group');
    const emptyEl = $('.glossary [data-empty]');
    glossaryFilter.addEventListener('input', () => {
      const q = glossaryFilter.value.trim().toLowerCase();
      let visible = 0;
      items.forEach((item) => {
        const show = !q || item.dataset.term.indexOf(q) !== -1 ||
          item.textContent.toLowerCase().indexOf(q) !== -1;
        item.hidden = !show;
        if (show) visible += 1;
      });
      groups.forEach((group) => {
        group.hidden = $$('.glossary-item', group).every((i) => i.hidden);
      });
      if (emptyEl) emptyEl.hidden = visible !== 0;
    });
  }

  /* ------------------------------------------------------------ search */

  const modal = $('[data-search-modal]');
  const input = $('[data-search-input]');
  const results = $('[data-search-results]');

  if (modal && input && results) {
    let cursor = -1;

    const openSearch = () => {
      modal.hidden = false;
      input.focus();
      input.select();
    };
    const closeSearch = () => {
      modal.hidden = true;
      cursor = -1;
    };

    $$('[data-search-open]').forEach((b) => b.addEventListener('click', openSearch));
    $$('[data-search-close]').forEach((b) => b.addEventListener('click', closeSearch));

    document.addEventListener('keydown', (e) => {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);
      if (e.key === '/' && !typing) { e.preventDefault(); openSearch(); }
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); openSearch(); }
      if (modal.hidden) return;
      if (e.key === 'Escape') closeSearch();
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        const hits = $$('.search-hit', results);
        if (!hits.length) return;
        e.preventDefault();
        cursor += e.key === 'ArrowDown' ? 1 : -1;
        if (cursor < 0) cursor = hits.length - 1;
        if (cursor >= hits.length) cursor = 0;
        hits.forEach((h, i) => h.classList.toggle('active', i === cursor));
        hits[cursor].scrollIntoView({ block: 'nearest' });
      }
      if (e.key === 'Enter') {
        const active = $('.search-hit.active', results) || $('.search-hit', results);
        if (active) window.location.href = active.href;
      }
    });

    /** Scores an entry: title hits beat headings, which beat body text. */
    function scoreEntry(entry, terms) {
      const title = entry.t.toLowerCase();
      const desc = entry.d.toLowerCase();
      const tags = entry.g.toLowerCase();
      const heads = entry.h.toLowerCase();
      const text = entry.x.toLowerCase();
      let total = 0;

      for (const term of terms) {
        let s = 0;
        if (title === term) s += 60;
        if (title.indexOf(term) !== -1) s += 30;
        if (title.split(/\s+/).some((w) => w.indexOf(term) === 0)) s += 12;
        if (tags.indexOf(term) !== -1) s += 14;
        // A dedicated section heading signals the article covers the topic
        // substantively, so it outranks a passing mention in the description.
        if (heads.indexOf(term) !== -1) s += 12;
        if (desc.indexOf(term) !== -1) s += 8;
        if (text.indexOf(term) !== -1) s += 3;
        if (s === 0) return 0; // every term must appear somewhere
        total += s;
      }
      return total;
    }

    function snippet(entry, term) {
      const text = entry.x;
      const at = text.toLowerCase().indexOf(term);
      if (at === -1) return entry.d || text.slice(0, 120);
      const start = Math.max(0, at - 40);
      return (start > 0 ? '…' : '') + text.slice(start, start + 150);
    }

    const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    function mark(text, terms) {
      let out = text.replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));
      for (const term of terms) {
        out = out.replace(new RegExp(`(${escapeRe(term)})`, 'ig'), '<mark>$1</mark>');
      }
      return out;
    }

    function search(query) {
      const index = window.__AA_SEARCH__ || [];
      const terms = query.toLowerCase().split(/\s+/).filter((t) => t.length > 1);

      if (!terms.length) {
        results.innerHTML =
          `<p class="search-hint">Type at least two characters to search ${index.length} tutorials.</p>`;
        return;
      }

      const hits = index
        .map((entry) => ({ entry, score: scoreEntry(entry, terms) }))
        .filter((h) => h.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 12);

      if (!hits.length) {
        results.innerHTML =
          `<p class="search-empty">No tutorial matches “${mark(query, [])}”. ` +
          'Try a broader term, like “regression” or “SQL”.</p>';
        return;
      }

      results.innerHTML = hits
        .map(({ entry }) =>
          `<a class="search-hit" href="${base}${entry.u.replace(/^\//, '')}" style="--hit-color:${entry.c}">
             <span class="hit-track">${entry.i} ${mark(entry.k, [])}</span>
             <strong>${mark(entry.t, terms)}</strong>
             <span class="hit-snippet">${mark(snippet(entry, terms[0]), terms)}</span>
           </a>`)
        .join('');
      cursor = -1;
    }

    let debounce;
    input.addEventListener('input', () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => search(input.value.trim()), 90);
    });
  }
})();
