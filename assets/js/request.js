// Clan page request form: test mode, roles, repeatable rows, link checks, live cost, image checks, submit
(function () {
  var form = document.getElementById('page-request-form');
  if (!form) return;
  var status = form.querySelector('.form-status');
  var files = {};
  var UPLOAD_URL = 'https://script.google.com/macros/s/AKfycbwphn5424FThrtfXQW-UpITS4c8huCVg1MP0pT5oGQPwmV0wj8cs22TkV43s3Unb9FLFw/exec';
  var UPLOAD_TOKEN = 'begga-temple-scrolls';

  // ---- Test mode: add ?test=1 to the URL to turn off required fields
  var TEST = /[?&]test=1\b/.test(location.search);
  if (TEST) {
    form.querySelector('#test-banner').hidden = false;
    form.querySelector('input[name=subject]').value = 'TEST: Clan page request';
  }

  // ---- Link checks
  var KINDS = {
    any: { label: 'link' },
    youtube: { host: /(^|\.)(youtube\.com|youtu\.be)$/i, label: 'YouTube link' },
    instagram: { host: /(^|\.)instagram\.com$/i, label: 'Instagram link', handle: 'https://www.instagram.com/' },
    linktree: { host: /(^|\.)linktr\.ee$/i, label: 'Linktree link', handle: 'https://linktr.ee/' }
  };
  function ytId(u) {
    var m = u.match(/(?:youtu\.be\/|[?&]v=|\/(?:embed|shorts|live)\/)([\w-]{11})/);
    return m ? m[1] : '';
  }
  function checkLink(input) {
    var kind = input.getAttribute('data-link') || 'any', k = KINDS[kind] || KINDS.any;
    var st = input.parentNode.querySelector('.link-status');
    var v = input.value.trim();
    input.setCustomValidity(''); if (st) { st.textContent = ''; st.className = 'link-status'; }
    if (!v) return;
    if (k.handle && /^@?[\w.]+$/.test(v)) { v = k.handle + v.replace(/^@/, '') + (kind === 'instagram' ? '/' : ''); input.value = v; }
    if (!/^https?:\/\//i.test(v) && /^[\w-]+(\.[\w-]+)+(\/|$)/.test(v)) { v = 'https://' + v; input.value = v; }
    var url; try { url = new URL(v); } catch (e) { url = null; }
    function bad(msg) { input.setCustomValidity(msg); if (st) { st.textContent = msg; st.className = 'link-status bad'; } }
    function good(msg) { if (st) { st.textContent = msg; st.className = 'link-status good'; } }
    if (!url || !/^https?:$/.test(url.protocol) || url.hostname.indexOf('.') < 0) return bad('That is not a full link. It should start with https://');
    if (k.host && !k.host.test(url.hostname)) return bad('That is not ' + (/^[AEIOU]/i.test(k.label) ? 'an ' : 'a ') + k.label + '.');
    var input2 = input;
    if (kind === 'youtube' && input.hasAttribute('data-video')) {
      var id = ytId(v);
      if (!id) return bad('That YouTube link does not point to a video.');
      good('Checking the video...');
      fetch('https://www.youtube.com/oembed?format=json&url=' + encodeURIComponent('https://www.youtube.com/watch?v=' + id))
        .then(function (r) { if (!r.ok) throw r.status; return r.json(); })
        .then(function (d) {
          if (input2.value.trim() !== v) return;
          good('Found: ' + d.title);
          var row = input2.closest('.work-row'), t = row && row.querySelector('[data-title]');
          if (t && !t.value.trim()) t.value = d.title;
        })
        .catch(function (e) {
          if (input2.value.trim() !== v) return;
          if (e === 401 || e === 403 || e === 404) bad('We could not find that video. Check that it is public or unlisted.');
          else good('Link looks right.');
        });
      return;
    }
    good('Link looks right.');
  }
  function wireLink(input) {
    input.addEventListener('change', function () { checkLink(input); });
    input.addEventListener('blur', function () { checkLink(input); });
  }
  form.querySelectorAll('[data-link]').forEach(wireLink);

  // ---- Repeatable rows
  // [label, type, required-when-used, link kind, extra]
  var CREDITS = [['Performed by', 'text', true], ['Produced by', 'text', true]];
  var GROUPS = {
    'Other link': { noun: 'link', fields: [['What it is', 'text', true, null, 'title'], ['Link', 'link', true, 'any']] },
    'Selected work': { noun: 'song', start: 1, fields: [['Title', 'text', true, null, 'title'], ['Song link', 'link', false, 'any']].concat(CREDITS, [['Mixed and mastered by', 'text', false], ['Cover art', 'cover', false]]) },
    'Executive production': { noun: 'release', fields: [['Title', 'text', true, null, 'title'], ['Link', 'link', false, 'any']].concat(CREDITS, [['Mixed and mastered by', 'text', false]]) },
    'Projects': { noun: 'project', fields: [['Title', 'text', true, null, 'title'], ['Link', 'link', false, 'any']].concat(CREDITS, [['Mixed and mastered by', 'text', false]]) },
    'Music visual': { noun: 'video', fields: [['Title', 'text', true, null, 'title'], ['YouTube link', 'link', true, 'youtube', 'video'], ['Prod by', 'text', false], ['Video by', 'text', false]] },
    'Documentary': { noun: 'documentary', fields: [['Title', 'text', true, null, 'title'], ['YouTube link', 'link', true, 'youtube', 'video'], ['Video by', 'text', false]] },
    'Dirty demo': { noun: 'demo', fields: [['Title', 'text', true, null, 'title'], ['Link', 'link', false, 'any'], ['Who is on it', 'text', false], ['Produced by', 'text', false]] }
  };
  var counts = {};
  function addRow(set) {
    var key = set.getAttribute('data-group'), g = GROUPS[key];
    counts[key] = (counts[key] || 0) + 1;
    var n = counts[key], Noun = g.noun.charAt(0).toUpperCase() + g.noun.slice(1);
    var row = document.createElement('div'); row.className = 'work-row';
    var html = '<p class="kicker" style="margin:0">' + Noun + ' ' + n + '</p>', pair = [];
    g.fields.forEach(function (f) {
      var id = 'g-' + key.replace(/\W/g, '') + n + f[0].replace(/\W/g, '');
      var name = key + ' ' + n + ' - ' + f[0];
      var lab = f[0] + (f[2] ? '' : ' (optional)');
      var inp = '<input id="' + id + '" name="' + name + '" type="text"' + (f[2] ? ' data-rowreq' : '') +
        (f[1] === 'link' ? ' inputmode="url" autocomplete="off" data-link="' + f[3] + '"' : '') +
        (f[4] === 'title' ? ' data-title' : '') + (f[4] === 'video' ? ' data-video' : '') + '>';
      var block = '<div class="field"><label for="' + id + '">' + lab + '</label>' + inp + (f[1] === 'link' ? '<p class="link-status" aria-live="polite"></p>' : '') + '</div>';
      if (f[1] === 'cover') block = '<div class="field img-field"><label for="' + id + '">' + lab + '</label><p class="hint">PNG only, at least 1500 x 1500 pixels, under 15 MB.</p>' +
        '<div class="row" style="gap:12px;flex-wrap:wrap;align-items:center"><input id="' + id + '" type="file" accept="image/png" data-img="cover" data-w="1500" data-h="1500" data-types="png" data-label="Cover art">' +
        '<button type="button" class="link-mono clear-file">Clear</button></div><p class="img-status" aria-live="polite"></p></div>';
      if (f[0] === 'Performed by' || f[0] === 'Produced by') { pair.push(block); if (pair.length === 2) { html += '<div class="g2" style="gap:18px">' + pair.join('') + '</div>'; pair = []; } }
      else html += block;
    });
    html += '<button type="button" class="link-mono remove-row">Remove this ' + g.noun + '</button>';
    row.innerHTML = html;
    set.querySelector('.work-rows').appendChild(row);
    row.querySelectorAll('[data-link]').forEach(wireLink);
    row.querySelectorAll('input[type=file][data-img]').forEach(wireImage);
    row.querySelector('.remove-row').addEventListener('click', function () {
      row.querySelectorAll('input[type=file]').forEach(function (i) { delete files[i.id]; });
      row.remove();
    });
  }
  form.querySelectorAll('[data-group]').forEach(function (set) {
    set.querySelector('.add-row').addEventListener('click', function () { addRow(set); });
    if (GROUPS[set.getAttribute('data-group')].start) addRow(set);
  });

  // ---- Live cost
  var game = form.querySelector('#r-game'), pat = form.querySelector('#r-patreon'), cov = form.querySelector('#r-cover');
  var total = form.querySelector('#cost-total'), detail = form.querySelector('#cost-detail'), costField = form.querySelector('#r-cost');
  function cost() {
    var g = game.value, p = pat.value, c = cov.value, t = '', d = '', wantsGame = g === 'Yes';
    if (!g || !p || !c) { t = 'Answer the questions above to see your cost.'; costField.value = ''; }
    else if (c === 'Approved stems') { t = '$0'; d = 'Approved stems cover your page' + (wantsGame ? ' and your game chapter.' : '.'); }
    else if (p === 'Yes') { t = wantsGame ? '$100' : '$0'; d = wantsGame ? 'Your page is included with Patreon. The game chapter is $100, half up front and half on delivery.' : 'Your page is included with Patreon.'; }
    else { t = wantsGame ? '$150' : '$50'; d = wantsGame ? 'Page and game chapter. Half up front and half on delivery.' : 'Page only. Add a game chapter for $100 more.'; }
    if (g === 'Maybe later' && t.charAt(0) === '$') d += ' A game chapter can be added later.';
    total.textContent = t; detail.textContent = d;
    if (t.charAt(0) === '$') costField.value = t + ' (' + d + ')';
  }
  [game, pat, cov].forEach(function (el) { el.addEventListener('change', cost); });

  // ---- Image checks: type, minimum size, file size
  var MAX_MB = 15;
  function wireImage(input) {
    var field = input.closest('.field'), st = field.querySelector('.img-status');
    function reset() { delete files[input.id]; input.setCustomValidity(''); st.textContent = ''; st.className = 'img-status'; }
    field.querySelector('.clear-file').addEventListener('click', function () { input.value = ''; reset(); });
    input.addEventListener('change', function () {
      reset();
      var file = input.files[0];
      if (!file) return;
      var types = (input.getAttribute('data-types') || 'png').split(',');
      var isPng = file.type === 'image/png' || /\.png$/i.test(file.name);
      var isJpg = file.type === 'image/jpeg' || /\.jpe?g$/i.test(file.name);
      function bad(msg) { input.setCustomValidity(msg); st.textContent = msg; st.className = 'img-status bad'; }
      if (!(isPng && types.indexOf('png') > -1) && !(isJpg && types.indexOf('jpg') > -1)) {
        return bad('This file can\'t be used. It has to be a ' + (types.length > 1 ? 'PNG or JPG' : 'PNG') + ' image.');
      }
      if (file.size > MAX_MB * 1024 * 1024) return bad('This image is too big (' + (file.size / 1048576).toFixed(1) + ' MB). It has to be under ' + MAX_MB + ' MB.');
      var url = URL.createObjectURL(file), img = new Image();
      img.onload = function () {
        var w = +input.getAttribute('data-w'), h = +input.getAttribute('data-h'), iw = img.naturalWidth, ih = img.naturalHeight;
        URL.revokeObjectURL(url);
        if (iw < w || ih < h) return bad('This image is too small. It\'s ' + iw + ' x ' + ih + ' pixels and needs to be at least ' + (h ? w + ' x ' + h : w + ' pixels wide') + '.');
        files[input.id] = { file: file, kind: input.getAttribute('data-img'), input: input };
        st.textContent = 'Looks good: ' + iw + ' x ' + ih + ' pixels.'; st.className = 'img-status good';
      };
      img.onerror = function () { URL.revokeObjectURL(url); bad('This image couldn\'t be opened. Try saving it again as a ' + (types.length > 1 ? 'PNG or JPG' : 'PNG') + '.'); };
      img.src = url;
    });
  }
  form.querySelectorAll('input[type=file][data-img]').forEach(wireImage);

  // ---- Submit
  var errBox = form.querySelector('#form-errors');
  function labelFor(el) {
    var f = el.closest('.field'), l = f && f.querySelector('label, .label');
    var row = el.closest('.work-row'), rl = row && row.querySelector('.kicker');
    if (el.name === 'Permission') return 'The permission box at the bottom';
    var t = l ? l.textContent.replace(/\s*\(optional\)/i, '') : (el.name || 'A field');
    return (rl ? rl.textContent + ', ' : '') + t;
  }
  function showErrors(list, title) {
    if (!list.length) { errBox.hidden = true; errBox.innerHTML = ''; return; }
    errBox.innerHTML = '<p class="err-title">' + title + '</p><ul>' + list.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>';
    errBox.hidden = false;
    errBox.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function send(imageNotes) {
    var fd = new FormData(form);
    form.querySelectorAll('input[type=file]').forEach(function (i) { fd.delete(i.name); });
    if (imageNotes) fd.append('Images', imageNotes);
    return fetch(form.action, { method: 'POST', headers: { Accept: 'application/json' }, body: fd }).then(function (r) { return r.json(); });
  }
  function b64(file) {
    return new Promise(function (res, rej) {
      var fr = new FileReader();
      fr.onload = function () { res(String(fr.result).split(',')[1]); };
      fr.onerror = rej; fr.readAsDataURL(file);
    });
  }
  function nameFor(item) {
    if (item.kind !== 'cover') return item.input.getAttribute('data-label');
    var row = item.input.closest('.work-row'), t = row && row.querySelector('[data-title]');
    return 'Cover art - ' + ((t && t.value.trim()) || (row ? row.querySelector('.kicker').textContent : 'song'));
  }
  // One image per request, so big covers don't hit size limits
  function uploadAll() {
    var items = Object.keys(files).map(function (k) { return files[k]; });
    var failed = [], links = [], folder = '', i = 0;
    function done() { return { failed: failed, links: links, folder: folder }; }
    if (!items.length) return Promise.resolve(done());
    if (!UPLOAD_URL) { failed = items.map(function (it) { return nameFor(it) + ': uploads are not set up yet.'; }); return Promise.resolve(done()); }
    function next() {
      if (i >= items.length) return Promise.resolve(done());
      var it = items[i++], label = nameFor(it);
      status.innerHTML = '<p>Sending image ' + i + ' of ' + items.length + ' (' + esc(label) + ')...</p>';
      return b64(it.file)
        .then(function (d) {
          return fetch(UPLOAD_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({
            token: UPLOAD_TOKEN, test: TEST, begga: form.querySelector('#r-begga').value, name: form.querySelector('#r-name').value,
            email: form.querySelector('#r-email').value, images: [{ label: label, kind: it.kind, type: it.file.type || (/\.png$/i.test(it.file.name) ? 'image/png' : 'image/jpeg'), data: d }] }) });
        })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          (d.links || []).forEach(function (l) { links.push(l.label + ': ' + l.url); });
          if (d.folder) folder = d.folder;
          if (!d.success) failed.push(label + ': ' + ((d.rejected && d.rejected.length) ? d.rejected.join('; ').replace(/^[^:]*:\s*/, '') : (d.message || 'the upload was refused.')));
        })
        .catch(function () { failed.push(label + ': we couldn\'t reach the upload service.'); })
        .then(next);
    }
    return next();
  }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    status.innerHTML = '';
    var roles = [].map.call(form.querySelectorAll('.role:checked'), function (c) { return c.value; });
    form.querySelector('#r-roles').value = roles.join(', ');
    form.querySelectorAll('[data-link]').forEach(checkLink);
    form.querySelectorAll('.work-row').forEach(function (row) {
      var used = [].some.call(row.querySelectorAll('input:not([type=file])'), function (i) { return i.value.trim(); });
      row.querySelectorAll('[data-rowreq]').forEach(function (i) { i.required = used; });
    });
    if (TEST) form.querySelectorAll('[required]').forEach(function (i) { i.required = false; });
    cost();
    var bad = [].slice.call(form.querySelectorAll(':invalid')).filter(function (el) { return el.tagName !== 'FORM' && el.tagName !== 'FIELDSET'; });
    if (bad.length) {
      showErrors(bad.map(function (el) {
        var why = el.validity.valueMissing ? 'This is required.' : (el.validationMessage || 'Check this field.');
        return '<strong>' + esc(labelFor(el)) + ':</strong> ' + esc(why);
      }), 'Fix ' + (bad.length === 1 ? 'this' : 'these ' + bad.length + ' things') + ' before sending:');
      return;
    }
    showErrors([]);
    var btn = form.querySelector('button[type="submit"]');
    btn.disabled = true; status.innerHTML = '<p>Sending...</p>';
    uploadAll()
      .then(function (up) {
        var notes = [];
        if (up.links.length) notes.push(up.links.join('\n'));
        if (up.folder) notes.push('Folder: ' + up.folder);
        if (up.failed.length) notes.push('Did not upload:\n' + up.failed.join('\n'));
        status.innerHTML = '<p>Sending your answers...</p>';
        return send(notes.join('\n\n')).then(function (d) { return { d: d, up: up }; });
      })
      .then(function (r) {
        if (!r.d.success) {
          status.innerHTML = '';
          showErrors(['Your answers did not send. Wait a minute and press Send my page again.' + (r.d.message ? ' (' + esc(r.d.message) + ')' : '')], 'Nothing was sent.');
          return;
        }
        if (r.up.failed.length) {
          status.innerHTML = '<p class="ok">Your answers were sent.</p>';
          showErrors(r.up.failed.map(esc).concat(['Your answers still went through. Fix the images above and send the form again, or we will reach out to get them.']),
            'Some images did not go through:');
        } else {
          status.innerHTML = '<p class="ok">Received. We\'ll reach out to start building your page.</p>';
          status.scrollIntoView({ block: 'center' });
        }
      })
      .catch(function () {
        status.innerHTML = '';
        showErrors(['We could not reach the form service. Check your connection, wait a minute and press Send my page again.'], 'Nothing was sent.');
      })
      .then(function () { btn.disabled = false; });
  });
})();
