/* Alf Maskan — settings.
   Enhancement only. Every section is a real <details> with a real form, so the
   page works with JavaScript off. This keeps the side nav in step with which
   section you are reading. */

(function () {
  'use strict';

  var links = Array.prototype.slice.call(document.querySelectorAll('.setnav a[href^="#"]'));
  if (!links.length) return;

  links.forEach(function (link) {
    link.addEventListener('click', function () {
      // Jumping to a collapsed section that stays collapsed is a dead link.
      var target = document.querySelector(link.getAttribute('href'));
      if (target && target.tagName === 'DETAILS') target.open = true;
      links.forEach(function (l) {
        if (l === link) l.setAttribute('aria-current', 'page');
        else l.removeAttribute('aria-current');
      });
    });
  });
})();
