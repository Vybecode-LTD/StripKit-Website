/* Renders the simplified, user-facing changelog from updates.json (curated for
   the website). The full technical changelog lives in the app repo's
   docs/CHANGELOG.md and is what drives the GitHub Release notes — keep the two
   in step when you ship: add a plain-language entry here per release.
   3 entries on the landing page (#changelog-timeline), all on changelog.html
   (#changelog-full). */
(function () {
  var SRC = 'updates.json';
  var MAX_HOME = 3;

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function inline(s) {
    return esc(s)
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  }
  function tagLabel(t) { return t === 'new' ? 'New' : t === 'fix' ? 'Fix' : t === 'improved' ? 'Improved' : (t.charAt(0).toUpperCase() + t.slice(1)); }
  function tagClass(t) { return (t === 'new' || t === 'fix' || t === 'improved') ? t : 'improved'; }
  function fmtDate(s) {
    if (!s) return '';
    var iso = /^\d{4}-\d{2}-\d{2}$/.test(s) ? s + 'T00:00:00' : s;
    var d = new Date(iso);
    return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  function render(versions, container, limit) {
    var show = limit ? versions.slice(0, limit) : versions;
    var html = '';
    for (var i = 0; i < show.length; i++) {
      var v = show[i], items = '', changes = v.changes || [];
      for (var j = 0; j < changes.length; j++) {
        var c = changes[j];
        items += '<li>' +
          '<span class="update-col-tag"><span class="update-tag ' + tagClass(c.type) + '">' + tagLabel(c.type) + '</span></span>' +
          '<span class="update-col-desc">' + inline(c.text || '') + '</span></li>';
      }
      html += '<div class="update-entry">' +
        '<div class="update-marker"></div>' +
        '<div class="update-content">' +
        '<div class="update-version">v' + esc(v.version) + '</div>' +
        (fmtDate(v.date) ? '<div class="update-date">' + fmtDate(v.date) + '</div>' : '') +
        (v.summary ? '<p class="update-summary">' + inline(v.summary) + '</p>' : '') +
        '<ul class="update-list">' + items + '</ul>' +
        '</div></div>';
    }
    container.innerHTML = html || '<p class="muted">No updates yet.</p>';
  }

  function load() {
    var full = document.getElementById('changelog-full');
    var el = full || document.getElementById('changelog-timeline');
    if (!el) return;
    fetch(SRC, { cache: 'no-cache' })
      .then(function (res) { if (!res.ok) throw new Error(res.status); return res.json(); })
      .then(function (data) { render(data, el, full ? 0 : MAX_HOME); })
      .catch(function () { el.innerHTML = '<p class="muted">Changelog unavailable right now.</p>'; });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', load);
  else load();
})();
