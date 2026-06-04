/* Fetches CHANGELOG.md from the app repo and renders the Keep-a-Changelog timeline.
   3 entries on the landing page, all entries on changelog.html. Per SOFTWARE_RELEASE.md. */
(function () {
  var REPO = 'Vybecode-LTD/stripkit';
  var RAW_URL = 'https://raw.githubusercontent.com/' + REPO + '/main/docs/CHANGELOG.md';
  var CACHE_KEY = 'sk_changelog';
  var CACHE_TTL = 300000; // 5 minutes
  var MAX_HOME = 3;

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function inline(s) {
    return esc(s)
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  }

  function parseChangelog(md) {
    var versions = [], current = null, currentSection = '';
    var lines = md.split('\n');

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];

      var versionMatch = line.match(/^## \[([^\]]+)\]\s*(?:—|-)\s*(.+)/);
      if (versionMatch) {
        if (current) versions.push(current);
        if (/^unreleased$/i.test(versionMatch[1].trim())) { current = null; currentSection = ''; continue; }
        var dateM = versionMatch[2].match(/\d{4}-\d{2}-\d{2}/);
        current = { version: versionMatch[1], date: dateM ? dateM[0] : '', sections: [] };
        currentSection = '';
        continue;
      }
      if (!current) continue;

      var sectionMatch = line.match(/^### (.+)/);
      if (sectionMatch) { currentSection = sectionMatch[1].trim().toLowerCase(); continue; }

      var bulletMatch = line.match(/^- \*\*(.+?)\*\*\s*(.*)/);
      if (bulletMatch) {
        current.sections.push({ tag: currentSection || 'changed', title: bulletMatch[1], desc: bulletMatch[2] || '' });
        continue;
      }
      var plainBullet = line.match(/^- (.+)/);
      if (plainBullet) {
        current.sections.push({ tag: currentSection || 'changed', title: '', desc: plainBullet[1] });
        continue;
      }
      if (line.match(/^\s{2,}/) && current.sections.length > 0) {
        current.sections[current.sections.length - 1].desc += ' ' + line.trim();
      }
    }
    if (current) versions.push(current);
    return versions;
  }

  function tagLabel(t) { return t === 'added' ? 'New' : t === 'fixed' ? 'Fix' : t === 'changed' ? 'Improved' : (t.charAt(0).toUpperCase() + t.slice(1)); }
  function tagClass(t) { return t === 'added' ? 'new' : t === 'fixed' ? 'fix' : 'improved'; }
  function formatDate(s) {
    if (!s) return '';
    var iso = /^\d{4}-\d{2}-\d{2}$/.test(s) ? s + 'T00:00:00' : s;
    var d = new Date(iso);
    return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  function renderTimeline(versions, container, limit) {
    var show = limit ? versions.slice(0, limit) : versions;
    var html = '';
    for (var i = 0; i < show.length; i++) {
      var v = show[i], items = '';
      for (var j = 0; j < v.sections.length; j++) {
        var s = v.sections[j];
        if (s.tag === 'tests' || s.tag === 'test') continue; // internal — not for the public page
        items += '<li>' +
          '<span class="update-col-tag"><span class="update-tag ' + tagClass(s.tag) + '">' + tagLabel(s.tag) + '</span></span>' +
          '<span class="update-col-title">' + (s.title ? inline(s.title) : '') + '</span>' +
          '<span class="update-col-desc">' + inline(s.desc) + '</span></li>';
      }
      html += '<div class="update-entry">' +
        '<div class="update-marker"></div>' +
        '<div class="update-content">' +
        '<div class="update-version">v' + esc(v.version) + '</div>' +
        (formatDate(v.date) ? '<div class="update-date">' + formatDate(v.date) + '</div>' : '') +
        '<ul class="update-list">' + items + '</ul></div></div>';
    }
    container.innerHTML = html || '<p class="muted">No published releases yet.</p>';
  }

  function applyChangelog(md, isFull) {
    var versions = parseChangelog(md);
    var el = document.getElementById(isFull ? 'changelog-full' : 'changelog-timeline');
    if (el) renderTimeline(versions, el, isFull ? 0 : MAX_HOME);
  }

  function fetchChangelog() {
    var isFull = !!document.getElementById('changelog-full');
    try {
      var cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        var parsed = JSON.parse(cached);
        if (Date.now() - parsed.ts < CACHE_TTL) { applyChangelog(parsed.md, isFull); return; }
      }
    } catch (e) {}

    fetch(RAW_URL)
      .then(function (res) { if (!res.ok) throw new Error(res.status); return res.text(); })
      .then(function (md) {
        applyChangelog(md, isFull);
        try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), md: md })); } catch (e) {}
      })
      .catch(function () {
        var el = document.getElementById(isFull ? 'changelog-full' : 'changelog-timeline');
        if (el) el.innerHTML = '<p class="muted">Changelog will appear here after the first release.</p>';
      });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fetchChangelog);
  else fetchChangelog();
})();
