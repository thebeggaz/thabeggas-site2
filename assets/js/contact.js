// Contact form: sends through Web3Forms without exposing the inbox address
document.querySelectorAll('#contact-form').forEach(function (form) {
  var status = form.querySelector('.form-status');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    status.textContent = 'Sending...';
    fetch(form.action, { method: 'POST', headers: { Accept: 'application/json' }, body: new FormData(form) })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data.success) { form.reset(); status.textContent = form.getAttribute('data-done') || 'Received. We will get back to you.'; window.scrollTo && status.scrollIntoView({ block: 'center' }); }
        else { status.textContent = 'That did not go through. Try again in a minute.'; }
      })
      .catch(function () { status.textContent = 'That did not go through. Try again in a minute.'; })
      .then(function () { btn.disabled = false; });
  });
});
