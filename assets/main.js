(function () {
  'use strict';

  var cfg = window.SISWAA_CONFIG || {};
  var number = String(cfg.whatsappNumber || '').replace(/\D/g, '');
  var hasWhatsApp = number.length >= 11; // country code + 10-digit number
  var billing = 'monthly';

  function waUrl(text) {
    return 'https://wa.me/' + number + (text ? '?text=' + encodeURIComponent(text) : '');
  }

  /* ---------- Theme ---------- */
  var root = document.documentElement;
  var toggle = document.getElementById('theme-toggle');

  function isDark() {
    var set = root.getAttribute('data-theme');
    if (set) return set === 'dark';
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  function syncToggleLabel() {
    if (toggle) toggle.setAttribute('aria-label', isDark() ? 'Switch to light theme' : 'Switch to dark theme');
  }
  if (toggle) {
    toggle.addEventListener('click', function () {
      var next = isDark() ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('siswaa-theme', next); } catch (e) {}
      syncToggleLabel();
    });
  }
  syncToggleLabel();

  /* ---------- WhatsApp, booking and email links ---------- */
  function planText(plan) {
    return 'Hi Siswaa, I\'m interested in the ' + plan + ' website plan (' +
      (billing === 'yearly' ? 'paid yearly' : 'paid monthly') + '). My business is: ';
  }

  function updateLinks() {
    if (!hasWhatsApp) return;
    document.querySelectorAll('[data-wa]').forEach(function (a) {
      if (a.id === 'book-call' && cfg.bookingUrl) return;
      var text = a.hasAttribute('data-plan') ? planText(a.getAttribute('data-plan')) : (a.getAttribute('data-wa-text') || '');
      a.href = waUrl(text);
      a.target = '_blank';
      a.rel = 'noopener';
    });
  }

  document.querySelectorAll('[data-wa-number-text]').forEach(function (el) {
    if (cfg.whatsappDisplay) el.textContent = cfg.whatsappDisplay;
  });

  var book = document.getElementById('book-call');
  if (book && cfg.bookingUrl) {
    book.href = cfg.bookingUrl;
    book.target = '_blank';
    book.rel = 'noopener';
  }

  if (cfg.email) {
    document.querySelectorAll('[data-email]').forEach(function (a) { a.href = 'mailto:' + cfg.email; });
    document.querySelectorAll('[data-email-text]').forEach(function (el) { el.textContent = cfg.email; });
  }

  // Without a number yet, plan buttons still pre-select the form.
  document.querySelectorAll('[data-plan]').forEach(function (a) {
    a.addEventListener('click', function () {
      if (hasWhatsApp) return;
      selectNeed('Website');
      var msg = document.getElementById('f-message');
      if (msg && !msg.value) msg.value = 'I\'m interested in the ' + a.getAttribute('data-plan') + ' plan (' + billing + ').';
    });
  });

  updateLinks();

  /* ---------- Monthly / yearly toggle ---------- */
  document.querySelectorAll('[data-billing]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      billing = btn.getAttribute('data-billing');
      document.querySelectorAll('[data-billing]').forEach(function (b) {
        b.setAttribute('aria-pressed', String(b === btn));
      });
      document.querySelectorAll('[data-monthly][data-yearly]').forEach(function (el) {
        el.textContent = el.getAttribute('data-' + billing);
      });
      updateLinks();
    });
  });

  /* ---------- "What do you need?" shortcuts ---------- */
  function selectNeed(value) {
    var radio = document.querySelector('input[name="need"][value="' + value + '"]');
    if (radio) radio.checked = true;
  }
  document.querySelectorAll('[data-need]').forEach(function (a) {
    a.addEventListener('click', function () { selectNeed(a.getAttribute('data-need')); });
  });

  /* ---------- Enquiry form ---------- */
  var form = document.getElementById('enquiry');
  if (form) {
    var nameEl = document.getElementById('f-name');
    var phoneEl = document.getElementById('f-phone');

    function setError(input, show) {
      var err = document.getElementById(input.id + '-err');
      input.setAttribute('aria-invalid', show ? 'true' : 'false');
      if (err) {
        err.hidden = !show;
        if (show) input.setAttribute('aria-describedby', err.id); else input.removeAttribute('aria-describedby');
      }
    }

    [nameEl, phoneEl].forEach(function (el) {
      el.addEventListener('input', function () { if (el.getAttribute('aria-invalid') === 'true') setError(el, false); });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = nameEl.value.trim();
      var digits = phoneEl.value.replace(/\D/g, '');
      var nameBad = name.length < 2;
      var phoneBad = digits.length < 10;
      setError(nameEl, nameBad);
      setError(phoneEl, phoneBad);
      if (nameBad) { nameEl.focus(); return; }
      if (phoneBad) { phoneEl.focus(); return; }

      var data = new FormData(form);
      var lines = [
        'Hi Siswaa, I found you on tech.siswaa.com.',
        '',
        'Name: ' + name,
        data.get('business') ? 'Business: ' + String(data.get('business')).trim() : null,
        'Phone: ' + phoneEl.value.trim(),
        'Looking for: ' + (data.get('need') || 'Not sure'),
        String(data.get('message') || '').trim() ? '\n' + String(data.get('message')).trim() : null
      ].filter(function (l) { return l !== null; });
      var text = lines.join('\n');

      if (hasWhatsApp) {
        // Open WhatsApp in a new tab and keep this page where it is.
        // (window.open with the 'noopener' feature always returns null, so it can't be used to detect a blocked popup.)
        var url = waUrl(text);
        var win = window.open(url, '_blank');
        if (win) { try { win.opener = null; } catch (err) {} }
        else { window.location.href = url; }
      } else if (cfg.email) {
        window.location.href = 'mailto:' + cfg.email +
          '?subject=' + encodeURIComponent('Website enquiry from ' + name) +
          '&body=' + encodeURIComponent(text);
      }
    });
  }

  /* ---------- Footer year ---------- */
  var y = document.getElementById('year');
  if (y) y.textContent = String(new Date().getFullYear());
})();
