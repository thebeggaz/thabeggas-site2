// First-visit mailing list popup (Temple Scrolls)
(function () {
  var KEY = 'tb_scrolls_seen';
  var dlg = document.getElementById('scroll-popup');
  if (!dlg || typeof dlg.showModal !== 'function') return;
  var seen = false;
  try { seen = localStorage.getItem(KEY) === '1'; } catch (e) { return; }
  if (seen || location.pathname.indexOf('/contact/') !== -1 || location.pathname.indexOf('/clan-page-request/') !== -1) return;

  function markSeen() { try { localStorage.setItem(KEY, '1'); } catch (e) {} }
  function open() {
    if (dlg.open) return;
    markSeen();
    dlg.showModal();
    window.removeEventListener('scroll', onScroll);
  }
  function onScroll() {
    var h = document.documentElement;
    if ((h.scrollTop + window.innerHeight) / h.scrollHeight > 0.4) open();
  }
  setTimeout(open, 8000);
  window.addEventListener('scroll', onScroll, { passive: true });

  dlg.querySelector('[data-close]').addEventListener('click', function () { dlg.close(); });
  dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
})();

// Mailchimp signups: submit in place (JSONP) instead of opening a new tab
(function () {
  var n = 0;
  document.querySelectorAll('form[data-mc]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var status = form.querySelector('.form-status');
      var email = form.querySelector('input[name="EMAIL"]');
      if (!email.value || !email.checkValidity()) { status.textContent = 'Enter a valid email.'; email.focus(); return; }
      var cb = 'tbMc' + (++n) + Date.now();
      var params = new URLSearchParams(new FormData(form)).toString();
      var url = form.action.replace('/post?', '/post-json?') + '&' + params + '&c=' + cb;
      var s = document.createElement('script');
      var done = false;
      window[cb] = function (r) {
        done = true;
        if (r && r.result === 'success') {
          form.reset();
          var ok = document.createElement('div');
          ok.className = 'mc-success';
          ok.setAttribute('role', 'status');
          var img = document.createElement('img');
          img.src = form.getAttribute('data-temple'); img.alt = '';
          var t = document.createElement('p');
          t.textContent = 'Welcome to The Temple';
          ok.appendChild(img); ok.appendChild(t);
          form.replaceWith(ok);
          var dlg = form.closest('dialog');
          if (dlg) setTimeout(function () { dlg.close(); }, 1600);
        } else {
          var msg = (r && r.msg) ? String(r.msg).replace(/<[^>]*>/g, '') : '';
          status.textContent = /already subscribed/i.test(msg) ? 'You are already on the list.' : 'That did not go through. Check the email and try again.';
        }
        delete window[cb]; s.remove();
      };
      s.src = url;
      s.onerror = function () { if (!done) { status.textContent = 'That did not go through. Try again in a minute.'; } };
      status.textContent = 'Sending...';
      document.body.appendChild(s);
    });
  });
})();

// Click-to-play videos: open in an on-site lightbox instead of sending people to YouTube
(function () {
  var box = document.getElementById('yt-box');
  if (!box || typeof box.showModal !== 'function') return;
  var stage = box.querySelector('.yt-stage');
  function close() { stage.innerHTML = ''; if (box.open) box.close(); }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('.yt[data-yt]');
    if (!b) return;
    e.preventDefault();
    var id = b.getAttribute('data-yt');
    box.classList.toggle('short', b.hasAttribute('data-short'));
    stage.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) +
      '?autoplay=1&rel=0&modestbranding=1&playsinline=1" title="' + (b.getAttribute('aria-label') || 'Video').replace(/"/g, '&quot;') +
      '" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>';
    box.showModal();
  });
  box.querySelector('.yt-close').addEventListener('click', close);
  box.addEventListener('click', function (e) { if (e.target === box) close(); });
  box.addEventListener('close', function () { stage.innerHTML = ''; });
})();

// House of Traps: play games in a window on the page (phones open the game's own page)
(function () {
  var box = document.getElementById('game-box');
  if (!box || typeof box.showModal !== 'function') return;
  var stage = box.querySelector('.game-stage'), full = box.querySelector('#game-full'), title = box.querySelector('#game-title');
  function close() { stage.innerHTML = ''; if (box.open) box.close(); }
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[data-game]');
    if (!a || window.innerWidth < 900 || e.metaKey || e.ctrlKey) return;
    e.preventDefault();
    title.textContent = a.getAttribute('data-game');
    full.href = a.href;
    stage.innerHTML = '<iframe src="' + a.href + '" title="' + a.getAttribute('data-game').replace(/"/g, '&quot;') + '" allow="autoplay; fullscreen; gamepad" allowfullscreen></iframe>';
    box.showModal();
    var f = stage.querySelector('iframe'); f.addEventListener('load', function () { try { f.contentWindow.focus(); } catch (x) {} f.focus(); });
  });
  box.querySelector('.game-close').addEventListener('click', close);
  box.addEventListener('close', function () { stage.innerHTML = ''; });
  box.addEventListener('click', function (e) { if (e.target === box) close(); });
})();

// Site v2: sections rise in as they scroll into view
(function () {
  if (document.documentElement.getAttribute('data-v') !== '2' || !('IntersectionObserver' in window)) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var els = [].slice.call(document.querySelectorAll('#main > section')).slice(1);
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  els.forEach(function (el) { el.classList.add('reveal'); io.observe(el); });
})();
