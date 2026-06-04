/* Contact form — submit to Formspree via AJAX so the visitor stays on the page. */
(function () {
  var form = document.getElementById('contact-form');
  if (!form) return;
  var note = document.getElementById('cf-note');
  var btn = form.querySelector('button[type="submit"]');
  var defaultNote = note ? note.textContent : '';

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
    if (note) { note.textContent = 'Sending…'; note.className = 'form-note'; }

    fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      headers: { 'Accept': 'application/json' }
    }).then(function (res) {
      if (res.ok) {
        form.reset();
        if (note) { note.textContent = 'Thanks — your message is on its way. We’ll get back to you soon.'; note.className = 'form-note ok'; }
        if (btn) { btn.textContent = 'Sent ✓'; }
      } else {
        return res.json().then(function (d) {
          var msg = (d && d.errors) ? d.errors.map(function (x) { return x.message; }).join(', ') : 'Something went wrong — please try again.';
          if (note) { note.textContent = msg; note.className = 'form-note err'; }
          if (btn) { btn.disabled = false; btn.textContent = 'Send message'; }
        });
      }
    }).catch(function () {
      if (note) { note.textContent = 'Network error — please try again, or email us directly.'; note.className = 'form-note err'; }
      if (btn) { btn.disabled = false; btn.textContent = 'Send message'; }
    });
  });
})();
