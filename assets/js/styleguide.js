/* Styleguide chrome only. The specimens are product components; these two
   toggles let you check every one of them in the other theme and the other
   writing direction without leaving the page. */

(function () {
  'use strict';
  var root = document.documentElement;

  var themeBtn = document.querySelector('[data-theme-toggle]');
  var label = document.querySelector('[data-theme-label]');
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var dark = root.dataset.theme === 'dark';
      if (dark) delete root.dataset.theme; else root.dataset.theme = 'dark';
      try { localStorage.setItem('am-theme', dark ? 'light' : 'dark'); } catch (e) {}
      themeBtn.setAttribute('aria-pressed', String(!dark));
      if (label) label.textContent = dark ? 'Dark' : 'Light';
    });
    var isDark = root.dataset.theme === 'dark';
    themeBtn.setAttribute('aria-pressed', String(isDark));
    if (label) label.textContent = isDark ? 'Light' : 'Dark';
  }

  var dirBtn = document.querySelector('[data-dir-toggle]');
  if (dirBtn) {
    dirBtn.addEventListener('click', function () {
      // Only the sheets flip. The page chrome stays LTR so the labels that
      // describe the mirroring do not mirror along with it.
      var rtl = document.body.dir === 'rtl';
      document.body.dir = rtl ? 'ltr' : 'rtl';
      dirBtn.setAttribute('aria-pressed', String(!rtl));
      dirBtn.textContent = rtl ? 'Mirror to RTL' : 'Back to LTR';
    });
  }
})();
