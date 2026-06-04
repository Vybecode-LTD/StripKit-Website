/* Fetches the latest GitHub Release and wires up the download buttons.
   Passive consumer per SOFTWARE_RELEASE.md Stage 3. */
(function () {
  var REPO = 'Vybecode-LTD/stripkit';
  var API  = 'https://api.github.com/repos/' + REPO + '/releases/latest';
  var CACHE_KEY = 'sk_latest_release';
  var CACHE_TTL = 300000; // 5 minutes

  var BTN_IDS = ['download-btn', 'download-btn-2'];
  var VER_IDS = ['download-version', 'download-version-2'];
  var VT_IDS  = ['vt-link', 'vt-link-2'];

  function setEach(ids, fn) {
    for (var i = 0; i < ids.length; i++) {
      var el = document.getElementById(ids[i]);
      if (el) fn(el);
    }
  }

  function applyRelease(data) {
    var tag = data.tag_name || '';
    var version = tag.replace(/^v/i, '');
    var asset = null;

    for (var i = 0; i < (data.assets || []).length; i++) {
      var a = data.assets[i];
      if (a.name && a.name.toLowerCase().indexOf('.exe') !== -1) { asset = a; break; }
    }
    if (!asset) return;

    setEach(BTN_IDS, function (el) { el.href = asset.browser_download_url; });

    var sizeMb = asset.size ? (asset.size / (1024 * 1024)).toFixed(0) + ' MB' : '';
    var verText = (version ? 'v' + version + ' · ' : '') + 'Windows 10/11 · x64' + (sizeMb ? ' · ' + sizeMb : '');
    setEach(VER_IDS, function (el) { el.textContent = verText; });

    if (data.body) {
      var m = data.body.match(/https:\/\/www\.virustotal\.com\/gui\/file\/[a-f0-9]+/);
      if (m) setEach(VT_IDS, function (el) { el.href = m[0]; });
    }
  }

  function fetchLatest() {
    try {
      var cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        var parsed = JSON.parse(cached);
        if (Date.now() - parsed.ts < CACHE_TTL) { applyRelease(parsed.data); return; }
      }
    } catch (e) { /* ignore */ }

    fetch(API)
      .then(function (res) { return res.ok ? res.json() : Promise.reject(res.status); })
      .then(function (data) {
        applyRelease(data);
        try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data: data })); } catch (e) {}
      })
      .catch(function () { /* no release yet — buttons keep their fallback hrefs */ });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fetchLatest);
  else fetchLatest();
})();
