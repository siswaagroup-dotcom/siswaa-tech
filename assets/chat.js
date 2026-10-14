/*
 * Siswaa chat assistant (browser side).
 * Asks /api/chat (Gemini on Vercel). If that isn't available (no API key, quota used up,
 * running on localhost), it answers from assets/chat-knowledge.json instead.
 * All text is inserted with textContent, never innerHTML.
 */
(function () {
  'use strict';

  var cfg = window.SISWAA_CONFIG || {};
  var waNumber = String(cfg.whatsappNumber || '').replace(/\D/g, '');
  var STORE = 'siswaa-chat-v1';
  var MAX_LEN = 500;
  var WA_TOKEN = '[[WHATSAPP]]';

  var fab = document.getElementById('chat-fab');
  var panel = document.getElementById('chat-panel');
  if (!fab || !panel) return;
  var log = document.getElementById('chat-log');
  var form = document.getElementById('chat-form');
  var input = document.getElementById('chat-input');
  var sendBtn = document.getElementById('chat-send');
  var quick = document.getElementById('chat-quick');
  var closeBtn = document.getElementById('chat-close');
  var waBtn = document.getElementById('chat-wa');
  var resetBtn = document.getElementById('chat-reset');
  var counter = document.getElementById('chat-count');

  var GREETING = 'Hi! I’m the Siswaa assistant. Ask me about website plans, apps, prices or timelines. When you’re ready, I’ll pass you to Atul or Abhishek on WhatsApp.';
  var state = { messages: [], aiAvailable: true };
  var knowledge = null;
  var busy = false;

  /* ---------- storage (per tab) ---------- */
  function save() { try { sessionStorage.setItem(STORE, JSON.stringify(state.messages.slice(-30))); } catch (e) {} }
  function load() { try { var m = JSON.parse(sessionStorage.getItem(STORE) || '[]'); if (Array.isArray(m)) state.messages = m; } catch (e) {} }

  /* ---------- rendering ---------- */
  function addInline(parent, text) {
    // Supports **bold** only; everything else stays plain text.
    var parts = text.split(/(\*\*[^*]+\*\*)/g);
    parts.forEach(function (p) {
      if (/^\*\*[^*]+\*\*$/.test(p)) { var b = document.createElement('strong'); b.textContent = p.slice(2, -2); parent.appendChild(b); }
      else if (p) parent.appendChild(document.createTextNode(p));
    });
  }
  function renderText(el, text) {
    var lines = text.split(/\n+/);
    var list = null;
    lines.forEach(function (line) {
      var t = line.trim();
      if (!t) return;
      var m = t.match(/^(?:[-*•]|\d+[.)])\s+(.*)$/);
      if (m) {
        if (!list) { list = document.createElement('ul'); el.appendChild(list); }
        var li = document.createElement('li'); addInline(li, m[1]); list.appendChild(li);
      } else {
        list = null;
        var p = document.createElement('p'); addInline(p, t.replace(/^#+\s*/, '')); el.appendChild(p);
      }
    });
  }
  function waUrl(text) { return 'https://wa.me/' + waNumber + '?text=' + encodeURIComponent(text); }
  function summary() {
    var asked = state.messages.filter(function (m) { return m.role === 'user'; }).slice(-4).map(function (m) { return '• ' + m.content; });
    return 'Hi Siswaa, I was chatting with the assistant on your website.' + (asked.length ? '\n\nMy questions:\n' + asked.join('\n') : '') + '\n\n';
  }
  function bubble(role, text, opts) {
    opts = opts || {};
    var row = document.createElement('div');
    row.className = 'chat-msg chat-msg--' + (role === 'user' ? 'user' : 'bot');
    var b = document.createElement('div');
    b.className = 'chat-bubble';
    var wantsWa = text.indexOf(WA_TOKEN) !== -1;
    renderText(b, text.split(WA_TOKEN).join('').trim());
    row.appendChild(b);
    if (role !== 'user' && wantsWa && waNumber) {
      var a = document.createElement('a');
      a.className = 'btn btn-wa chat-inline-wa';
      a.href = waUrl(summary()); a.target = '_blank'; a.rel = 'noopener';
      a.textContent = 'Continue on WhatsApp';
      row.appendChild(a);
    }
    if (opts.note) { var n = document.createElement('p'); n.className = 'chat-note'; n.textContent = opts.note; row.appendChild(n); }
    log.appendChild(row);
    log.scrollTop = log.scrollHeight;
  }
  function typing(on) {
    var t = document.getElementById('chat-typing');
    if (on && !t) {
      t = document.createElement('div'); t.id = 'chat-typing'; t.className = 'chat-msg chat-msg--bot';
      var b = document.createElement('div'); b.className = 'chat-bubble chat-typing'; b.setAttribute('aria-label', 'Assistant is typing');
      for (var i = 0; i < 3; i++) b.appendChild(document.createElement('span'));
      t.appendChild(b); log.appendChild(t); log.scrollTop = log.scrollHeight;
    } else if (!on && t) { t.remove(); }
  }
  function renderAll() {
    log.textContent = '';
    bubble('assistant', GREETING);
    state.messages.forEach(function (m) { bubble(m.role, m.content); });
    quick.hidden = state.messages.length > 0;
    updateWa();
  }
  function updateWa() { if (waNumber) waBtn.href = waUrl(summary()); }

  /* ---------- offline FAQ answers ---------- */
  function loadKnowledge() {
    if (knowledge) return Promise.resolve(knowledge);
    return fetch('/assets/chat-knowledge.json', { cache: 'force-cache' })
      .then(function (r) { return r.json(); })
      .then(function (k) { knowledge = k; return k; })
      .catch(function () { return null; });
  }
  function faqAnswer(question) {
    var q = ' ' + question.toLowerCase().replace(/[^\p{L}\p{N}₹\s]/gu, ' ').replace(/\s+/g, ' ') + ' ';
    // Topic words (app, cancel, domain…) count fully; generic price words count less,
    // so "how much is an app" picks the app answer, not the website price answer.
    var GENERIC = ['how much', 'price', 'pricing', 'cost', 'charge', 'fee', 'fees', 'rate', 'kitna', 'kitne', 'paisa', 'rupees', '₹', 'budget', 'cheap'];
    var best = null, bestScore = 0;
    (knowledge && knowledge.faq || []).forEach(function (f) {
      var score = 0;
      f.keywords.forEach(function (k) {
        k = k.toLowerCase();
        var hit = q.indexOf(' ' + k + ' ') !== -1 || (k.length > 5 && q.indexOf(k) !== -1);
        if (hit) score += GENERIC.indexOf(k) !== -1 ? 0.5 : (k.indexOf(' ') !== -1 ? 2 : 1);
      });
      if (score > bestScore) { bestScore = score; best = f; }
    });
    if (bestScore < 1) best = null; // only generic words matched: not confident
    if (/\b(human|person|call me|talk to|baat|quote|book|hire|start|interested|ready)\b/.test(q)) {
      return 'Happy to connect you. Tap below to continue on WhatsApp, and Atul or Abhishek will reply directly. ' + WA_TOKEN;
    }
    if (best) return best.a;
    return 'I’m not sure about that one. Atul or Abhishek can answer it properly on WhatsApp. You can also ask me about plans, prices, apps or timelines. ' + WA_TOKEN;
  }

  /* ---------- sending ---------- */
  function ask(text) {
    text = String(text || '').trim().slice(0, MAX_LEN);
    if (!text || busy) return;
    busy = true; sendBtn.disabled = true; quick.hidden = true;
    state.messages.push({ role: 'user', content: text });
    bubble('user', text); save(); updateWa();
    input.value = ''; updateCount(); autosize();
    typing(true);

    var tryAi = state.aiAvailable
      ? fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: state.messages.slice(-12) })
        }).then(function (r) {
          if (r.status === 404 || r.status === 405 || r.status === 501) { state.aiAvailable = false; return null; } // no server function (e.g. localhost)
          return r.json().catch(function () { return null; });
        }).catch(function () { return null; })
      : Promise.resolve(null);

    tryAi.then(function (data) {
      if (data && data.reply) return data.reply;
      return loadKnowledge().then(function () { return faqAnswer(text); });
    }).then(function (reply) {
      typing(false);
      state.messages.push({ role: 'assistant', content: reply });
      bubble('assistant', reply); save(); updateWa();
    }).finally(function () {
      busy = false; sendBtn.disabled = false; input.focus();
    });
  }

  /* ---------- open / close ---------- */
  function open() {
    panel.hidden = false;
    fab.setAttribute('aria-expanded', 'true');
    document.documentElement.classList.add('chat-open');
    if (!log.childElementCount) renderAll();
    input.focus();
    loadKnowledge();
  }
  function close() {
    panel.hidden = true;
    fab.setAttribute('aria-expanded', 'false');
    document.documentElement.classList.remove('chat-open');
    fab.focus();
  }

  fab.addEventListener('click', function (e) { e.preventDefault(); panel.hidden ? open() : close(); });
  closeBtn.addEventListener('click', close);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panel.hidden) close(); });
  document.querySelectorAll('[data-chat-open]').forEach(function (el) {
    el.addEventListener('click', function (e) { e.preventDefault(); open(); });
  });

  form.addEventListener('submit', function (e) { e.preventDefault(); ask(input.value); });
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); ask(input.value); }
  });
  function autosize() { input.style.height = 'auto'; input.style.height = Math.min(input.scrollHeight, 120) + 'px'; }
  function updateCount() {
    var left = MAX_LEN - input.value.length;
    counter.hidden = left > 80;
    counter.textContent = left + ' characters left';
  }
  input.addEventListener('input', function () { autosize(); updateCount(); });
  quick.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-q]');
    if (b) ask(b.getAttribute('data-q'));
  });
  resetBtn.addEventListener('click', function () {
    state.messages = []; save(); renderAll(); input.focus();
  });

  if (!waNumber) waBtn.hidden = true;
  load();
})();
