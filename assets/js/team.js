/* Alf Maskan — team.
   Enhancement only: the table is complete without JavaScript, and the invite
   dialog is a real <dialog> with a real form. This opens it and keeps the role
   description honest as you change the role. */

(function () {
  'use strict';

  var dialog = document.querySelector('[data-invite]');
  if (!dialog) return;

  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) {
    return Array.prototype.slice.call(document.querySelectorAll(s));
  };

  // The same wording as the roles matrix, said at the moment it matters.
  var ROLES = {
    admin: ['Admin', 'Everything an owner can do except billing and transferring the store. Give it to the person who runs the office day to day.'],
    manager: ['Sales manager', 'All listings, all leads, team assignment and analytics. Cannot touch the storefront design or billing.'],
    agent: ['Agent', 'Sees only their own listings and their own leads. Can create drafts but not publish them, and cannot see another agent’s pipeline or touch the storefront design.'],
    editor: ['Content editor', 'The storefront builder, pages, blog and media. No leads, and cannot change a price.'],
    accountant: ['Accountant', 'Deals, commissions, invoices and billing. Listings are read-only to them.'],
    viewer: ['Viewer', 'Read-only across the store. Useful for an owner’s partner or an external accountant who only needs to look.']
  };

  var role = $('[data-invite-role]');
  var note = $('[data-role-note]');
  var scope = $('[data-scope-field]');

  function describe() {
    if (!role || !note) return;
    var info = ROLES[role.value];
    if (!info) return;
    note.textContent = '';
    var b = document.createElement('b');
    b.textContent = info[0];
    note.appendChild(b);
    note.appendChild(document.createTextNode(info[1]));

    // Scope narrows a role. Roles that are not about places have nothing to
    // narrow, so offering the field would only confuse.
    if (scope) scope.hidden = ['accountant', 'editor'].indexOf(role.value) !== -1;
  }

  if (role) role.addEventListener('change', describe);
  describe();

  $$('[data-open-invite]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
      var first = $('#i-who');
      if (first) first.focus();
    });
  });

  $$('[data-close-invite]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (typeof dialog.close === 'function') dialog.close();
      else dialog.removeAttribute('open');
    });
  });
})();
