// Light/dark mode toggle and client-side post search.
(function () {
  'use strict';

  var root = document.documentElement;

  // ---------------------------------------------------------------------------
  // Theme toggle
  // ---------------------------------------------------------------------------

  var media = window.matchMedia('(prefers-color-scheme: dark)');

  function storedTheme() {
    try { return localStorage.getItem('theme'); } catch (e) { return null; }
  }

  function activeTheme() {
    var stored = storedTheme();
    if (stored === 'light' || stored === 'dark') return stored;
    return media.matches ? 'dark' : 'light';
  }

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    root.setAttribute('data-theme-active', theme);
    try { localStorage.setItem('theme', theme); } catch (e) {}
  }

  var toggle = document.getElementById('theme-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      applyTheme(activeTheme() === 'dark' ? 'light' : 'dark');
    });
  }

  // Follow OS changes until the user makes an explicit choice.
  var onSystemChange = function () {
    if (!storedTheme()) root.setAttribute('data-theme-active', activeTheme());
  };
  if (media.addEventListener) media.addEventListener('change', onSystemChange);
  else if (media.addListener) media.addListener(onSystemChange);

  // ---------------------------------------------------------------------------
  // Search
  // ---------------------------------------------------------------------------

  var input = document.getElementById('site-search-input');
  var list = document.getElementById('site-search-results');
  if (!input || !list) return;

  var MAX_RESULTS = 10;
  var SNIPPET_RADIUS = 40;
  var index = null;
  var loading = null;
  var active = -1;

  function loadIndex() {
    if (!loading) {
      loading = fetch(input.getAttribute('data-index'))
        .then(function (r) { return r.json(); })
        .then(function (posts) {
          index = posts.map(function (p) {
            p.haystackTitle = p.title.toLowerCase();
            p.haystackTags = (p.tags || []).join(' ').toLowerCase();
            p.haystackContent = p.content.toLowerCase();
            return p;
          });
          return index;
        });
    }
    return loading;
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // Split on a capturing group so matches land at odd indices.
  function highlight(text, terms) {
    var re = new RegExp('(' + terms.map(function (t) {
      return t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }).join('|') + ')', 'gi');
    return text.split(re).map(function (part, i) {
      return i % 2 ? '<mark>' + escapeHtml(part) + '</mark>' : escapeHtml(part);
    }).join('');
  }

  function snippet(post, terms) {
    var pos = -1;
    for (var i = 0; i < terms.length && pos < 0; i++) pos = post.haystackContent.indexOf(terms[i]);
    if (pos < 0) return post.content.slice(0, SNIPPET_RADIUS * 2) + '…';
    var start = Math.max(0, pos - SNIPPET_RADIUS);
    var end = Math.min(post.content.length, pos + SNIPPET_RADIUS * 2);
    return (start > 0 ? '…' : '') + post.content.slice(start, end) + (end < post.content.length ? '…' : '');
  }

  // Every term must appear somewhere; title and tag hits rank higher.
  function search(query) {
    var terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) return { terms: terms, hits: [] };
    var hits = [];
    index.forEach(function (post) {
      var score = 0;
      for (var i = 0; i < terms.length; i++) {
        var t = terms[i];
        var inTitle = post.haystackTitle.indexOf(t) >= 0;
        var inTags = post.haystackTags.indexOf(t) >= 0;
        var inContent = post.haystackContent.indexOf(t) >= 0;
        if (!inTitle && !inTags && !inContent) return;
        score += (inTitle ? 10 : 0) + (inTags ? 5 : 0) + (inContent ? 1 : 0);
      }
      hits.push({ post: post, score: score });
    });
    hits.sort(function (a, b) { return b.score - a.score || (a.post.date < b.post.date ? 1 : -1); });
    return { terms: terms, hits: hits.slice(0, MAX_RESULTS) };
  }

  function render() {
    var query = input.value.trim();
    active = -1;
    if (!query) {
      list.hidden = true;
      list.innerHTML = '';
      return;
    }
    loadIndex().then(function () {
      if (input.value.trim() !== query) return;
      var res = search(query);
      if (!res.hits.length) {
        list.innerHTML = '<li class="result-empty">No results for “' + escapeHtml(query) + '”</li>';
      } else {
        list.innerHTML = res.hits.map(function (h) {
          var p = h.post;
          return '<li><a href="' + escapeHtml(p.url) + '">' +
            '<span class="result-title">' + highlight(p.title, res.terms) + '</span>' +
            '<span class="result-meta">' + escapeHtml(p.date) +
            (p.tags && p.tags.length ? ' · ' + escapeHtml(p.tags.join(', ')) : '') + '</span>' +
            '<span class="result-snippet">' + highlight(snippet(p, res.terms), res.terms) + '</span>' +
            '</a></li>';
        }).join('');
      }
      list.hidden = false;
    });
  }

  function links() {
    return list.querySelectorAll('a');
  }

  function setActive(i) {
    var items = links();
    if (!items.length) return;
    active = (i + items.length) % items.length;
    items.forEach(function (a, j) { a.classList.toggle('active', j === active); });
    items[active].scrollIntoView({ block: 'nearest' });
  }

  input.addEventListener('focus', function () {
    loadIndex();
    if (input.value.trim()) render();
  });
  input.addEventListener('input', render);
  input.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(active + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(active - 1); }
    else if (e.key === 'Enter') {
      var items = links();
      if (items.length) { e.preventDefault(); items[Math.max(active, 0)].click(); }
    } else if (e.key === 'Escape') {
      input.value = '';
      render();
      input.blur();
    }
  });

  document.addEventListener('click', function (e) {
    if (!e.target.closest('.site-search')) list.hidden = true;
  });

  // Press "/" anywhere to focus the search box.
  document.addEventListener('keydown', function (e) {
    var tag = (e.target.tagName || '').toLowerCase();
    if (e.key === '/' && tag !== 'input' && tag !== 'textarea' && !e.target.isContentEditable) {
      e.preventDefault();
      input.focus();
    }
  });
})();
