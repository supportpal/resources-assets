(function ($, window, document, undefined) {
  "use strict";

  /**
   * Whether keyboard shortcuts are enabled.
   *
   * @type {boolean}
   */
  var enabled;

  /**
   * Whether keyboard shortcuts dialog is open.
   *
   * @type {boolean}
   */
  var dialogOpen = false;

  /**
   * @param {string} title
   * @param {KeyboardShortcut[]} shortcuts
   * @returns {string}
   */
  var buildShortcutsTable = function (title, shortcuts) {
    var $table = $('<table>'),
      $tbody = $('<tbody>');

    // Append thead.
    $table.append($('<thead>').append($('<tr>').append($('<th>', {
      class: 'sp-py-2',
      colspan: '2'
    }).text(title))));
    for (var shortcut in shortcuts) {
      var key = shortcuts[shortcut].shortcut().split('+').map(element => element.trim()).filter(element => element !== '').map(element => $('<code class="sp-font-bold">').text(element)[0].outerHTML).join('+');
      var $row = $('<tr>').append($('<td>', {
        class: 'sp-w-12'
      }).append(key)).append($('<td>').text(shortcuts[shortcut].description()));
      $tbody.append($row);
    }
    return $table.append($tbody).html();
  };
  var toggleKeyboardShortcutsDialog = function () {
    if (dialogOpen) {
      hideKeyboardShortcutsDialog();
    } else {
      showKeyboardShortcutsDialog();
    }
  };
  var showKeyboardShortcutsDialog = function () {
    var rows = '',
      shortcuts = keyboardShortcuts.all();
    for (var group in shortcuts) {
      rows += buildShortcutsTable(shortcuts[group].name(), shortcuts[group].all());
    }
    var checked = KeyboardShortcuts.isEnabled() ? 'checked="checked"' : '';
    Swal.fire({
      title: Lang.get('core.keyboard_shortcuts'),
      html: '<div class="sp-shortcuts-container ' + (checked ? '' : 'sp-hidden') + '">' + '<div class="sp-mb-4">' + '<input type="text" placeholder="' + Lang.get('core.sSearchPlaceholder') + '" class="sp-shortcuts-search sp-w-full">' + '</div>' + '<table class="sp-mb-6 sp-text-left">' + rows + '</table>' + '<hr />' + '</div>' + '<div class="sp-mt-6">' + '<input class="sp-toggle" id="toggle_keyboard_shortcuts" name="keyboard_shortcuts" ' + checked + ' type="checkbox" value="1">' + '<label for="toggle_keyboard_shortcuts"></label>' + '<label class="sp-ml-4">' + Lang.get('core.enable_keyboard_shortcuts') + '</label>' + '</div>',
      showCloseButton: true,
      showConfirmButton: false,
      showCancelButton: false,
      width: 600,
      didOpen: () => {
        $('.sp-shortcuts-search').focus();
        const input = Swal.getHtmlContainer().querySelector('input[type="text"]');
        input.addEventListener('keyup', function () {
          const table = Swal.getHtmlContainer().querySelector('table');
          $(table).find('thead').each(function () {
            const $thead = $(this),
              $tbody = $thead.next('tbody');
            let match = false;
            $tbody.find('tr').each(function () {
              const $tr = $(this),
                $cells = $tr.find('td').filter(function () {
                  return $(this).text().toLowerCase().includes(input.value.toLowerCase());
                });
              if (!match) {
                match = $cells.length > 0;
              }
              $tr.toggle($cells.length > 0);
            });
            $thead.toggle(match);
          });
        });
        const checkbox = Swal.getHtmlContainer().querySelector('input[name="keyboard_shortcuts"]');
        checkbox.addEventListener('change', function () {
          KeyboardShortcuts.toggle(checkbox.checked);
        });
      },
      didClose: () => {
        dialogOpen = false;
      }
    });
    dialogOpen = true;
  };
  var hideKeyboardShortcutsDialog = function () {
    Swal.close();
    dialogOpen = false;
  };

  /**
   * @param {int} id
   * @param {string} shortcut
   * @param {string} description
   * @constructor
   */
  function KeyboardShortcut(id, shortcut, description) {
    /**
     * @returns {int}
     */
    this.id = function () {
      return id;
    };

    /**
     * @returns {string}
     */
    this.shortcut = function () {
      return shortcut;
    };

    /**
     * @returns {string}
     */
    this.description = function () {
      return description;
    };

    /**
     * @param {function} callback
     */
    this.bind = function (callback) {
      Mousetrap.bind(shortcut, callback);
    };
  }

  /**
   * @param {int} id
   * @param {string} name
   * @constructor
   */
  function KeyboardShortcutGroup(id, name) {
    var shortcuts = {};

    /**
     * @returns {int}
     */
    this.id = function () {
      return id;
    };

    /**
     * @returns {string}
     */
    this.name = function () {
      return name;
    };

    /**
     * @param {KeyboardShortcut} shortcut
     */
    this.registerShortcut = function (shortcut) {
      shortcuts[shortcut.id()] = shortcut;
    };

    /**
     * @returns {KeyboardShortcut[]}
     */
    this.all = function () {
      return shortcuts;
    };
  }
  function KeyboardShortcuts() {
    var groups = {};

    /**
     * @param {KeyboardShortcutGroup} group
     */
    this.registerGroup = function (group) {
      groups[group.id()] = group;
    };

    /**
     * @returns {KeyboardShortcutGroup[]}
     */
    this.all = function () {
      return groups;
    };

    /**
     * @param {string} id
     * @returns {KeyboardShortcutGroup}
     */
    this.getGroup = function (id) {
      if (typeof groups[id] === 'undefined') {
        throw new Error('Group ' + id + ' is not defined.');
      }
      return groups[id];
    };
  }

  /**
   * @returns {boolean}
   */
  KeyboardShortcuts.isEnabled = function () {
    if (typeof enabled === 'undefined') {
      return true;
    }
    return enabled;
  };

  /**
   * @param {boolean} value
   * @param {boolean=} save Persist value to the database.
   */
  KeyboardShortcuts.toggle = function (value, save) {
    enabled = value;
    if (enabled) {
      Mousetrap.unpause();
    } else {
      Mousetrap.pause();
    }
    if (typeof save === 'undefined' || save === true) {
      $.ajax({
        url: laroute.route('user.operator.toggle_keyboard_shortcuts'),
        type: 'PUT',
        data: {
          shortcuts_enabled: value
        },
        dataType: 'json'
      });
    }
    $('.sp-shortcuts-container').toggleClass('sp-hidden');
  };
  KeyboardShortcuts.toggle($('meta[name="shortcuts_enabled"]').attr('content') === '1', false);
  KeyboardShortcutGroup.GLOBAL = 1;
  KeyboardShortcutGroup.TICKET_VIEW = 2;
  var keyboardShortcuts = new KeyboardShortcuts();
  keyboardShortcuts.SHORTCUT_TOGGLE_HELP = new KeyboardShortcut(1, '?', Lang.get('core.shortcut_toggle'));
  keyboardShortcuts.SHORTCUT_SEARCH = new KeyboardShortcut(2, '/', Lang.get('core.shortcut_start_search'));
  keyboardShortcuts.SHORTCUT_OPEN_NEW_TICKET = new KeyboardShortcut(3, 'n', Lang.get('core.shortcut_goto_new_ticket'));
  keyboardShortcuts.SHORTCUT_FOCUS_REPLY_FORM = new KeyboardShortcut(4, 'r', Lang.get('core.shortcut_focus_reply'));
  keyboardShortcuts.SHORTCUT_FOCUS_NOTES_FORM = new KeyboardShortcut(5, 'x', Lang.get('core.shortcut_focus_notes'));
  keyboardShortcuts.SHORTCUT_FOCUS_FORWARD_FORM = new KeyboardShortcut(6, 'f', Lang.get('core.shortcut_focus_forward'));
  keyboardShortcuts.SHORTCUT_TOGGLE_USER_DETAILS = new KeyboardShortcut(7, 'u', Lang.get('core.shortcut_toggle_user_tab'));
  keyboardShortcuts.SHORTCUT_TAKE_TICKET = new KeyboardShortcut(8, 't', Lang.get('core.shortcut_take_ticket'));
  keyboardShortcuts.SHORTCUT_CLOSE_TICKET = new KeyboardShortcut(9, 'c', Lang.get('core.shortcut_close_ticket'));
  keyboardShortcuts.SHORTCUT_LOCK_TICKET = new KeyboardShortcut(10, 'l', Lang.get('core.shortcut_lock_ticket'));
  keyboardShortcuts.SHORTCUT_UNLOCK_TICKET = new KeyboardShortcut(11, 'k', Lang.get('core.shortcut_unlock_ticket'));
  keyboardShortcuts.SHORTCUT_TRASH_TICKET = new KeyboardShortcut(12, 'd', Lang.get('core.shortcut_trash_ticket'));
  keyboardShortcuts.SHORTCUT_BLOCK_USER = new KeyboardShortcut(13, 'b', Lang.get('core.shortcut_block_user'));
  keyboardShortcuts.SHORTCUT_WATCH_TICKET = new KeyboardShortcut(14, 'w', Lang.get('core.shortcut_watch_ticket'));
  keyboardShortcuts.SHORTCUT_UNWATCH_TICKET = new KeyboardShortcut(15, 'q', Lang.get('core.shortcut_unwatch_ticket'));
  keyboardShortcuts.SHORTCUT_MERGE_TICKET = new KeyboardShortcut(16, 'm', Lang.get('core.shortcut_merge_ticket'));
  keyboardShortcuts.SHORTCUT_UNMERGE_TICKET = new KeyboardShortcut(17, ',', Lang.get('core.shortcut_unmerge_ticket'));
  keyboardShortcuts.SHORTCUT_EXPAND_ALL = new KeyboardShortcut(18, ';', Lang.get('core.shortcut_expand_all'));
  keyboardShortcuts.SHORTCUT_COLLAPSE_ALL = new KeyboardShortcut(19, ':', Lang.get('core.shortcut_collapse_all'));
  keyboardShortcuts.SHORTCUT_PRINT_TICKET = new KeyboardShortcut(20, 'p', Lang.get('core.shortcut_print_ticket'));

  // Register the shortcuts.
  var globalGroup = new KeyboardShortcutGroup(KeyboardShortcutGroup.GLOBAL, Lang.get('core.shortcut_global'));
  globalGroup.registerShortcut(keyboardShortcuts.SHORTCUT_TOGGLE_HELP);
  globalGroup.registerShortcut(keyboardShortcuts.SHORTCUT_SEARCH);
  globalGroup.registerShortcut(keyboardShortcuts.SHORTCUT_OPEN_NEW_TICKET);
  keyboardShortcuts.registerGroup(globalGroup);
  var ticketView = new KeyboardShortcutGroup(KeyboardShortcutGroup.TICKET_VIEW, Lang.get('core.shortcut_ticket_view'));
  ticketView.registerShortcut(keyboardShortcuts.SHORTCUT_FOCUS_REPLY_FORM);
  ticketView.registerShortcut(keyboardShortcuts.SHORTCUT_FOCUS_NOTES_FORM);
  ticketView.registerShortcut(keyboardShortcuts.SHORTCUT_FOCUS_FORWARD_FORM);
  ticketView.registerShortcut(keyboardShortcuts.SHORTCUT_TOGGLE_USER_DETAILS);
  ticketView.registerShortcut(keyboardShortcuts.SHORTCUT_TAKE_TICKET);
  ticketView.registerShortcut(keyboardShortcuts.SHORTCUT_CLOSE_TICKET);
  ticketView.registerShortcut(keyboardShortcuts.SHORTCUT_LOCK_TICKET);
  ticketView.registerShortcut(keyboardShortcuts.SHORTCUT_UNLOCK_TICKET);
  ticketView.registerShortcut(keyboardShortcuts.SHORTCUT_TRASH_TICKET);
  ticketView.registerShortcut(keyboardShortcuts.SHORTCUT_BLOCK_USER);
  ticketView.registerShortcut(keyboardShortcuts.SHORTCUT_WATCH_TICKET);
  ticketView.registerShortcut(keyboardShortcuts.SHORTCUT_UNWATCH_TICKET);
  ticketView.registerShortcut(keyboardShortcuts.SHORTCUT_MERGE_TICKET);
  ticketView.registerShortcut(keyboardShortcuts.SHORTCUT_UNMERGE_TICKET);
  ticketView.registerShortcut(keyboardShortcuts.SHORTCUT_EXPAND_ALL);
  ticketView.registerShortcut(keyboardShortcuts.SHORTCUT_COLLAPSE_ALL);
  ticketView.registerShortcut(keyboardShortcuts.SHORTCUT_PRINT_TICKET);
  keyboardShortcuts.registerGroup(ticketView);

  // Bind global shortcuts.
  keyboardShortcuts.SHORTCUT_TOGGLE_HELP.bind(toggleKeyboardShortcutsDialog);
  keyboardShortcuts.SHORTCUT_OPEN_NEW_TICKET.bind(function () {
    window.location.href = $('#open-new-ticket').attr('href');
  });

  // Register click handler.
  $('#header #keyboard-shortcuts').on('click', showKeyboardShortcutsDialog);
  App.extend('KeyboardShortcuts', keyboardShortcuts);
})($, window, document);