/* Small enhancements: footer year + scroll-reveal for cards. */
(function () {
  var year = String(new Date().getFullYear());
  document.querySelectorAll('#year, #year2, .year-now').forEach(function (el) { el.textContent = year; });

  if ('IntersectionObserver' in window) {
    var els = document.querySelectorAll('.feature-card, .download-card, .section-head');
    els.forEach(function (el) { el.style.opacity = '0'; el.style.transform = 'translateY(16px)'; el.style.transition = 'opacity .5s ease, transform .5s ease'; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.style.opacity = '1'; e.target.style.transform = 'none'; io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    els.forEach(function (el) { io.observe(el); });
  }
})();
