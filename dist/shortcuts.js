(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(require('@supportpal/sweetalert2')) : typeof define === 'function' && define.amd ? define(['@supportpal/sweetalert2'], factory) : (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.Swal));
})(this, function (Swal) {
  'use strict';

  /**
   * Default editor shortcuts.
   * Used where App.KeyboardShortcuts is not available.
   *
   * Note: TinyMCE uses 'meta' as a cross-platform modifier (ctrl on PC, command on macOS).
   *
   * @type {Object}
   */
  const defaultShortcuts = {
    bold: 'meta+b',
    italic: 'meta+i',
    underline: 'meta+u',
    link: 'meta+k',
    strikethrough: 'meta+shift+s',
    codesample: 'meta+shift+x',
    blockquote: 'meta+q',
    numlist: 'meta+.',
    bullist: 'meta+/',
    outdent: 'meta+[',
    indent: 'meta+]',
    removeformat: 'meta+\\',
    superscript: 'meta+h',
    subscript: 'meta+l',
    paragraph: 'meta+alt+0',
    heading1: 'meta+alt+1',
    heading2: 'meta+alt+2',
    heading3: 'meta+alt+3',
    heading4: 'meta+alt+4',
    heading5: 'meta+alt+5',
    heading6: 'meta+alt+6',
    cannedresponses: 'ctrl+shift+1',
    selfservice: 'ctrl+shift+2',
    submit: 'ctrl+enter'
  };

  // Special keys are backspace, tab, enter, return, capslock, esc, escape, space, pageup, pagedown, end, home, left, up,
  // right, down, ins, del, and plus.
  // https://craig.is/killing/mice
  const BACKSPACE = 'backspace';
  const TAB = 'tab';
  const ENTER = 'enter';
  const CAPSLOCK = 'capslock';
  const ESC = 'esc';
  const SPACE = 'space';
  const PAGEUP = 'pageup';
  const PAGEDOWN = 'pagedown';
  const END = 'end';
  const HOME = 'home';
  const LEFT = 'left';
  const UP = 'up';
  const RIGHT = 'right';
  const DOWN = 'down';
  const INS = 'ins';
  const DEL = 'del';

  // Code values for keyboard events
  // https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_code_values
  const CODE_MAP = {
    "Digit1": "1",
    "Digit2": "2",
    "Digit3": "3",
    "Digit4": "4",
    "Digit5": "5",
    "Digit6": "6",
    "Digit7": "7",
    "Digit8": "8",
    "Digit9": "9",
    "Digit0": "0",
    "Minus": "-",
    "Equal": "=",
    "KeyA": "a",
    "KeyB": "b",
    "KeyC": "c",
    "KeyD": "d",
    "KeyE": "e",
    "KeyF": "f",
    "KeyG": "g",
    "KeyH": "h",
    "KeyI": "i",
    "KeyJ": "j",
    "KeyK": "k",
    "KeyL": "l",
    "KeyM": "m",
    "KeyN": "n",
    "KeyO": "o",
    "KeyP": "p",
    "KeyQ": "q",
    "KeyR": "r",
    "KeyS": "s",
    "KeyT": "t",
    "KeyU": "u",
    "KeyV": "v",
    "KeyW": "w",
    "KeyX": "x",
    "KeyY": "y",
    "KeyZ": "z",
    "BracketLeft": "[",
    "BracketRight": "]",
    "Enter": ENTER,
    "Backspace": BACKSPACE,
    "Tab": TAB,
    "Semicolon": ";",
    "Quote": "'",
    "Backquote": "`",
    "Backslash": "\\",
    "Comma": ",",
    "Period": ".",
    "Slash": "/",
    "Space": SPACE,
    "CapsLock": CAPSLOCK,
    "Escape": ESC,
    "PageUp": PAGEUP,
    "PageDown": PAGEDOWN,
    "End": END,
    "Home": HOME,
    "Insert": INS,
    "Delete": DEL,
    "ArrowRight": RIGHT,
    "ArrowLeft": LEFT,
    "ArrowDown": DOWN,
    "ArrowUp": UP
  };

  // Key values for keyboard events
  // https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_key_values
  const KEY_MAP = {
    ' ': SPACE,
    'ArrowUp': UP,
    'ArrowDown': DOWN,
    'ArrowLeft': LEFT,
    'ArrowRight': RIGHT,
    'Escape': ESC,
    'Backspace': BACKSPACE,
    'CapsLock': CAPSLOCK,
    'Tab': TAB,
    'Enter': ENTER,
    'Control': 'ctrl'
  };
  (function ($, window, document, undefined$1) {
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
     * Custom shortcut mappings (id -> shortcut key or null for disabled).
     *
     * @type {Object}
     */
    var customMappings = {};

    /**
     * Default shortcut mappings (id -> shortcut key).
     *
     * @type {Object}
     */
    var defaultMappings = {};

    /**
     * Load custom mappings from meta tag.
     */
    var loadCustomMappings = function () {
      try {
        var content = $('meta[name="shortcut_mappings"]').attr('content');
        if (content && content !== 'null' && content !== '') {
          // Create a mutable copy to avoid "read only property" errors
          customMappings = Object.assign({}, JSON.parse(content) || {});
        }
      } catch (e) {
        customMappings = {};
      }
    };

    /**
     * Save custom mappings to server.
     *
     * @return {Promise}
     */
    var saveCustomMappings = function () {
      return $.ajax({
        url: laroute.route('user.operator.update_shortcut_mappings'),
        type: 'PUT',
        data: {
          shortcut_mappings: customMappings
        },
        dataType: 'json'
      });
    };

    /**
     * Get the effective shortcut key for a given shortcut id.
     *
     * @param {int} id
     * @returns {string|null} Returns null if disabled, otherwise the shortcut key.
     */
    var getEffectiveShortcut = function (id) {
      if (customMappings.hasOwnProperty(id)) {
        return customMappings[id];
      }
      return defaultMappings[id] || null;
    };

    /**
     * Check if a shortcut key is already in use by another shortcut.
     *
     * @param {string} key
     * @param {int} excludeId
     * @returns {Object|null} Returns the shortcut object if in use, null otherwise.
     */
    var isShortcutInUse = function (key, excludeId) {
      if (!key) return null;
      var groups = keyboardShortcuts.all();
      for (var groupId in groups) {
        var shortcuts = groups[groupId].all();
        for (var shortcutId in shortcuts) {
          if (parseInt(shortcutId) === excludeId) continue;
          var effectiveKey = getEffectiveShortcut(parseInt(shortcutId));
          if (effectiveKey && effectiveKey.toLowerCase() === key.toLowerCase()) {
            return shortcuts[shortcutId];
          }
        }
      }
      return null;
    };

    /**
     * Format a shortcut key for display.
     *
     * @param {string|null} shortcut
     * @returns {string}
     */
    var formatShortcutDisplay = function (shortcut) {
      if (!shortcut) {
        return '<span class="sp:text-secondary-500 sp:italic">' + Lang.get('core.shortcut_disabled') + '</span>';
      }
      return shortcut.split('+').map(element => element.trim()).filter(element => element !== '').map(element => $('<code class="sp:font-bold">').text(element)[0].outerHTML).join('+');
    };

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
        class: 'sp:py-2',
        colspan: '3'
      }).text(title))));
      for (var shortcut in shortcuts) {
        var shortcutObj = shortcuts[shortcut];
        var effectiveKey = getEffectiveShortcut(shortcutObj.id());
        var isCustom = customMappings.hasOwnProperty(shortcutObj.id());
        var $keyCell = $('<td>', {
          class: 'sp-shortcut-key sp:py-1'
        }).attr('data-shortcut-id', shortcutObj.id()).html(formatShortcutDisplay(effectiveKey));
        var $actionsCell = $('<td>', {
          class: 'sp:py-1 sp:text-end'
        });
        var $editBtn = $('<button>', {
          class: 'sp-shortcut-edit sp-button-sm',
          title: Lang.get('core.shortcut_edit'),
          'data-shortcut-id': shortcutObj.id(),
          'data-default-key': shortcutObj.defaultShortcut()
        }).html('<i class="fas fa-pencil"></i>');
        var $resetBtn = $('<button>', {
          class: 'sp-shortcut-reset sp:ms-2 sp-button-sm sp:cursor-pointer' + (isCustom ? '' : ' sp:hidden'),
          title: Lang.get('core.shortcut_reset'),
          'data-shortcut-id': shortcutObj.id(),
          'data-default-key': shortcutObj.defaultShortcut()
        }).html('<i class="fas fa-undo"></i>');
        $actionsCell.append($editBtn).append($resetBtn);
        var $row = $('<tr>').append($keyCell).append($('<td>', {
          class: 'sp:py-1'
        }).text(shortcutObj.description())).append($actionsCell);
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
        html: '<div>' + '<input class="sp-toggle" id="toggle_keyboard_shortcuts" name="keyboard_shortcuts" ' + checked + ' type="checkbox" value="1">' + '<label for="toggle_keyboard_shortcuts"></label>' + '<label class="sp:ms-4">' + Lang.get('core.enable_keyboard_shortcuts') + '</label>' + '</div>' + '<div class="sp-shortcuts-container ' + (checked ? '' : 'sp:hidden') + '">' + '<hr class="sp:my-6" />' + '<div class="sp:mb-4">' + '<input type="text" placeholder="' + Lang.get('core.sSearchPlaceholder') + '" class="sp-shortcuts-search sp:w-full">' + '</div>' + '<table class="sp:w-full sp:text-start">' + rows + '</table>' + '</div>',
        showCloseButton: true,
        showConfirmButton: false,
        showCancelButton: false,
        width: 800,
        didOpen: () => {
          $('.sp-shortcuts-search').trigger('focus');
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

          // Handle edit button clicks
          $(Swal.getHtmlContainer()).on('click', '.sp-shortcut-edit', function () {
            var $btn = $(this);
            var $row = $btn.closest('tr');
            var shortcutId = parseInt($btn.data('shortcut-id'));
            var defaultKey = $btn.data('default-key');
            showInlineEdit(shortcutId, defaultKey, $row);
          });

          // Handle reset button clicks
          $(Swal.getHtmlContainer()).on('click', '.sp-shortcut-reset', function () {
            var $btn = $(this);
            var shortcutId = parseInt($btn.data('shortcut-id'));
            var defaultKey = $btn.data('default-key');
            resetShortcut(shortcutId, defaultKey);
          });
        },
        didClose: () => {
          dialogOpen = false;
        }
      });
      dialogOpen = true;
    };

    /**
     * Show inline edit row for a shortcut.
     *
     * @param {int} shortcutId
     * @param {string} defaultKey
     * @param {jQuery} $row
     */
    var showInlineEdit = function (shortcutId, defaultKey, $row) {
      // Close any existing edit row
      closeInlineEdit();
      var currentKey = getEffectiveShortcut(shortcutId);

      // Create the edit row
      var $editRow = $('<tr>', {
        class: 'sp-shortcut-edit-row'
      }).append($('<td>', {
        colspan: 3,
        class: 'sp:py-1'
      }).append($('<div>', {
        class: 'sp:flex sp:items-center sp:gap-2 sp:px-3 sp:py-2 sp:bg-secondary sp:rounded'
      }).append($('<div>', {
        class: 'sp-shortcut-capture sp:flex-1 sp:h-8 sp:bg-primary sp:text-primary sp:rounded sp:text-center sp:leading-[2] sp:ring-2 sp:ring-primary-200',
        tabindex: 0
      }).html(currentKey ? formatShortcutDisplay(currentKey) : '<span class="sp:text-secondary">' + Lang.get('core.shortcut_press_key') + '</span>'), $('<button>', {
        type: 'button',
        class: 'sp-shortcut-disable sp-button-sm sp:bg-primary sp:hover:bg-tertiary',
        title: Lang.get('general.disable')
      }).html('<i class="fas fa-ban"></i>'), $('<button>', {
        type: 'button',
        class: 'sp-shortcut-cancel sp-button-sm sp:bg-primary sp:hover:bg-tertiary',
        title: Lang.get('general.cancel')
      }).html('<i class="fas fa-times"></i>')), $('<div>', {
        class: 'sp-shortcut-error sp:text-red-600 sp:text-sm sp:my-1 sp:hidden'
      })));

      // Insert after the current row
      $row.after($editRow);
      var $capture = $editRow.find('.sp-shortcut-capture');
      var $error = $editRow.find('.sp-shortcut-error');

      // Focus the capture area
      $capture.trigger('focus');

      // Capture key presses
      $capture.on('keydown', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var key = '';
        var modifiers = [];
        if (e.ctrlKey) modifiers.push('ctrl');
        if (e.altKey) modifiers.push('alt');
        if (e.shiftKey) modifiers.push('shift');
        if (e.metaKey) modifiers.push('meta');
        var keyName;
        if (e.altKey || e.shiftKey || e.metaKey || e.ctrlKey) {
          // We need to use e.code here to get the physical key pressed, as e.key may be affected by modifier keys.
          // For example, SHIFT + SEMICOLON produces SHIFT + COLON which Mousetrap cannot interpret correctly.
          if (CODE_MAP.hasOwnProperty(e.code)) {
            keyName = CODE_MAP[e.code];
          } else {
            return;
          }
        } else {
          // We can't use e.code for everything because it's not reliable.
          // For example, the code returned is "KeyQ" for the Q key on a QWERTY layout keyboard, but the same code
          // value also represents the ' key on Dvorak keyboards and the A key on AZERTY keyboards. That makes it
          // impossible to use the value of code to determine what the name of the key is to users if they're not
          // using an anticipated keyboard layout.
          keyName = KEY_MAP.hasOwnProperty(e.key) ? KEY_MAP[e.key] : e.key.toLowerCase();
        }

        // Skip if only modifier keys are pressed
        if (['ctrl', 'alt', 'shift', 'meta'].includes(keyName)) {
          return;
        }

        // Handle escape to cancel
        if (keyName === 'esc' && modifiers.length === 0) {
          closeInlineEdit();
          return;
        }

        // Build the shortcut string
        if (modifiers.length > 0) {
          key = modifiers.join('+') + '+' + keyName;
        } else {
          key = keyName;
        }

        // Check if shortcut is already in use
        var conflict = isShortcutInUse(key, shortcutId);
        if (conflict) {
          $error.text(Lang.get('core.shortcut_already_in_use', {
            name: conflict.description()
          })).removeClass('sp:hidden');
          return;
        }
        $error.addClass('sp:hidden');

        // Update immediately
        updateShortcut(shortcutId, key, defaultKey, $error).done(function () {
          closeInlineEdit();
        });
      });

      // Handle disable button
      $editRow.find('.sp-shortcut-disable').on('click', function () {
        updateShortcut(shortcutId, null, defaultKey, $error).done(function () {
          closeInlineEdit();
        });
      });

      // Handle cancel button
      $editRow.find('.sp-shortcut-cancel').on('click', function () {
        closeInlineEdit();
      });
    };

    /**
     * Close the inline edit row.
     */
    var closeInlineEdit = function () {
      $('.sp-shortcut-edit-row').remove();
    };

    /**
     * Update a shortcut mapping.
     *
     * @param {int} shortcutId
     * @param {string|null} newKey
     * @param {string} defaultKey
     * @param {jQuery=} $error Optional error element to display errors
     * @return {Promise}
     */
    var updateShortcut = function (shortcutId, newKey, defaultKey, $error) {
      var oldKey = getEffectiveShortcut(shortcutId);

      // Update custom mappings
      if (newKey === defaultKey) {
        delete customMappings[shortcutId];
      } else {
        customMappings[shortcutId] = newKey;
      }

      // Save to server
      return saveCustomMappings().done(function () {
        // Unbind old shortcut
        if (oldKey) {
          Mousetrap.unbind(oldKey);
        }

        // Rebind shortcut if not disabled
        if (newKey) {
          rebindShortcut(shortcutId, newKey);
        }
        updateShortcutUI(shortcutId, newKey, defaultKey);
      }).fail(function (jqXHR) {
        // Show error message
        if ($error) {
          $error.text(Lang.get('messages.general_error')).removeClass('sp:hidden');
        }
      });
    };

    /**
     * Reset a shortcut to its default.
     *
     * @param {int} shortcutId
     * @param {string} defaultKey
     */
    var resetShortcut = function (shortcutId, defaultKey) {
      updateShortcut(shortcutId, defaultKey, defaultKey);
    };

    /**
     * Update the UI after a shortcut change.
     *
     * @param {int} shortcutId
     * @param {string|null} newKey
     * @param {string} defaultKey
     */
    var updateShortcutUI = function (shortcutId, newKey, defaultKey) {
      var $keyCell = $('.sp-shortcut-key[data-shortcut-id="' + shortcutId + '"]');
      var $resetBtn = $('.sp-shortcut-reset[data-shortcut-id="' + shortcutId + '"]');
      $keyCell.html(formatShortcutDisplay(newKey));
      if (newKey === defaultKey) {
        $resetBtn.addClass('sp:hidden');
      } else {
        $resetBtn.removeClass('sp:hidden');
      }
    };

    /**
     * Rebind a shortcut to its callback.
     *
     * @param {int} shortcutId
     * @param {string} key
     */
    var rebindShortcut = function (shortcutId, key) {
      var callback = shortcutCallbacks[shortcutId];
      if (callback) {
        Mousetrap.bind(key, callback);
      }
    };

    /**
     * Store callbacks for rebinding.
     *
     * @type {Object}
     */
    var shortcutCallbacks = {};
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
      // Store default mapping
      defaultMappings[id] = shortcut;

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
        return getEffectiveShortcut(id) || '';
      };

      /**
       * @returns {string}
       */
      this.defaultShortcut = function () {
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
        // Store callback for rebinding
        shortcutCallbacks[id] = callback;
        var effectiveShortcut = getEffectiveShortcut(id);
        if (effectiveShortcut) {
          Mousetrap.bind(effectiveShortcut, callback);
        }
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

      /**
       * Get the effective editor shortcuts for TinyMCE.
       * Returns an object mapping shortcut names to their effective key combinations.
       *
       * @returns {Object}
       */
      this.getEditorShortcuts = function () {
        return {
          bold: keyboardShortcuts.SHORTCUT_EDITOR_BOLD.shortcut(),
          italic: keyboardShortcuts.SHORTCUT_EDITOR_ITALIC.shortcut(),
          underline: keyboardShortcuts.SHORTCUT_EDITOR_UNDERLINE.shortcut(),
          link: keyboardShortcuts.SHORTCUT_EDITOR_LINK.shortcut(),
          strikethrough: keyboardShortcuts.SHORTCUT_EDITOR_STRIKETHROUGH.shortcut(),
          codesample: keyboardShortcuts.SHORTCUT_EDITOR_CODESAMPLE.shortcut(),
          blockquote: keyboardShortcuts.SHORTCUT_EDITOR_BLOCKQUOTE.shortcut(),
          numlist: keyboardShortcuts.SHORTCUT_EDITOR_NUMLIST.shortcut(),
          bullist: keyboardShortcuts.SHORTCUT_EDITOR_BULLIST.shortcut(),
          outdent: keyboardShortcuts.SHORTCUT_EDITOR_OUTDENT.shortcut(),
          indent: keyboardShortcuts.SHORTCUT_EDITOR_INDENT.shortcut(),
          removeformat: keyboardShortcuts.SHORTCUT_EDITOR_REMOVEFORMAT.shortcut(),
          superscript: keyboardShortcuts.SHORTCUT_EDITOR_SUPERSCRIPT.shortcut(),
          subscript: keyboardShortcuts.SHORTCUT_EDITOR_SUBSCRIPT.shortcut(),
          paragraph: keyboardShortcuts.SHORTCUT_EDITOR_PARAGRAPH.shortcut(),
          heading1: keyboardShortcuts.SHORTCUT_EDITOR_HEADING1.shortcut(),
          heading2: keyboardShortcuts.SHORTCUT_EDITOR_HEADING2.shortcut(),
          heading3: keyboardShortcuts.SHORTCUT_EDITOR_HEADING3.shortcut(),
          heading4: keyboardShortcuts.SHORTCUT_EDITOR_HEADING4.shortcut(),
          heading5: keyboardShortcuts.SHORTCUT_EDITOR_HEADING5.shortcut(),
          heading6: keyboardShortcuts.SHORTCUT_EDITOR_HEADING6.shortcut(),
          cannedresponses: keyboardShortcuts.SHORTCUT_EDITOR_CANNEDRESPONSES.shortcut(),
          selfservice: keyboardShortcuts.SHORTCUT_EDITOR_SELFSERVICE.shortcut(),
          submit: keyboardShortcuts.SHORTCUT_EDITOR_SUBMIT.shortcut()
        };
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
      $('.sp-shortcuts-container').toggleClass('sp:hidden');
    };

    // Load custom mappings before creating shortcuts
    loadCustomMappings();
    KeyboardShortcuts.toggle($('meta[name="shortcuts_enabled"]').attr('content') === '1', false);
    KeyboardShortcutGroup.GLOBAL = 1;
    KeyboardShortcutGroup.TICKET_VIEW = 2;
    KeyboardShortcutGroup.EDITOR = 3;
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

    // Editor shortcuts (IDs 100+)
    // Mapping from editorShortcuts key to {id, langKey}
    var editorShortcutMappings = {
      bold: {
        id: 100,
        langKey: 'shortcut_editor_bold'
      },
      italic: {
        id: 101,
        langKey: 'shortcut_editor_italic'
      },
      underline: {
        id: 102,
        langKey: 'shortcut_editor_underline'
      },
      link: {
        id: 103,
        langKey: 'shortcut_editor_link'
      },
      strikethrough: {
        id: 104,
        langKey: 'shortcut_editor_strikethrough'
      },
      codesample: {
        id: 105,
        langKey: 'shortcut_editor_codesample'
      },
      blockquote: {
        id: 106,
        langKey: 'shortcut_editor_blockquote'
      },
      numlist: {
        id: 107,
        langKey: 'shortcut_editor_numlist'
      },
      bullist: {
        id: 108,
        langKey: 'shortcut_editor_bullist'
      },
      outdent: {
        id: 109,
        langKey: 'shortcut_editor_outdent'
      },
      indent: {
        id: 110,
        langKey: 'shortcut_editor_indent'
      },
      removeformat: {
        id: 111,
        langKey: 'shortcut_editor_removeformat'
      },
      cannedresponses: {
        id: 112,
        langKey: 'shortcut_editor_canned_responses'
      },
      selfservice: {
        id: 113,
        langKey: 'shortcut_editor_self_service'
      },
      submit: {
        id: 114,
        langKey: 'shortcut_editor_submit'
      },
      superscript: {
        id: 115,
        langKey: 'shortcut_editor_superscript'
      },
      subscript: {
        id: 116,
        langKey: 'shortcut_editor_subscript'
      },
      paragraph: {
        id: 117,
        langKey: 'shortcut_editor_paragraph'
      },
      heading1: {
        id: 118,
        langKey: 'shortcut_editor_heading1'
      },
      heading2: {
        id: 119,
        langKey: 'shortcut_editor_heading2'
      },
      heading3: {
        id: 120,
        langKey: 'shortcut_editor_heading3'
      },
      heading4: {
        id: 121,
        langKey: 'shortcut_editor_heading4'
      },
      heading5: {
        id: 122,
        langKey: 'shortcut_editor_heading5'
      },
      heading6: {
        id: 123,
        langKey: 'shortcut_editor_heading6'
      }
    };
    for (var shortcutName in editorShortcutMappings) {
      var mapping = editorShortcutMappings[shortcutName];
      var shortcutKey = defaultShortcuts[shortcutName];
      var constName = 'SHORTCUT_EDITOR_' + shortcutName.toUpperCase();
      keyboardShortcuts[constName] = new KeyboardShortcut(mapping.id, shortcutKey, Lang.get('core.' + mapping.langKey));
    }

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
    var editorGroup = new KeyboardShortcutGroup(KeyboardShortcutGroup.EDITOR, Lang.get('core.shortcut_editor'));
    editorGroup.registerShortcut(keyboardShortcuts.SHORTCUT_EDITOR_BOLD);
    editorGroup.registerShortcut(keyboardShortcuts.SHORTCUT_EDITOR_ITALIC);
    editorGroup.registerShortcut(keyboardShortcuts.SHORTCUT_EDITOR_UNDERLINE);
    editorGroup.registerShortcut(keyboardShortcuts.SHORTCUT_EDITOR_LINK);
    editorGroup.registerShortcut(keyboardShortcuts.SHORTCUT_EDITOR_STRIKETHROUGH);
    editorGroup.registerShortcut(keyboardShortcuts.SHORTCUT_EDITOR_CODESAMPLE);
    editorGroup.registerShortcut(keyboardShortcuts.SHORTCUT_EDITOR_BLOCKQUOTE);
    editorGroup.registerShortcut(keyboardShortcuts.SHORTCUT_EDITOR_NUMLIST);
    editorGroup.registerShortcut(keyboardShortcuts.SHORTCUT_EDITOR_BULLIST);
    editorGroup.registerShortcut(keyboardShortcuts.SHORTCUT_EDITOR_OUTDENT);
    editorGroup.registerShortcut(keyboardShortcuts.SHORTCUT_EDITOR_INDENT);
    editorGroup.registerShortcut(keyboardShortcuts.SHORTCUT_EDITOR_REMOVEFORMAT);
    editorGroup.registerShortcut(keyboardShortcuts.SHORTCUT_EDITOR_SUPERSCRIPT);
    editorGroup.registerShortcut(keyboardShortcuts.SHORTCUT_EDITOR_SUBSCRIPT);
    editorGroup.registerShortcut(keyboardShortcuts.SHORTCUT_EDITOR_PARAGRAPH);
    editorGroup.registerShortcut(keyboardShortcuts.SHORTCUT_EDITOR_HEADING1);
    editorGroup.registerShortcut(keyboardShortcuts.SHORTCUT_EDITOR_HEADING2);
    editorGroup.registerShortcut(keyboardShortcuts.SHORTCUT_EDITOR_HEADING3);
    editorGroup.registerShortcut(keyboardShortcuts.SHORTCUT_EDITOR_HEADING4);
    editorGroup.registerShortcut(keyboardShortcuts.SHORTCUT_EDITOR_HEADING5);
    editorGroup.registerShortcut(keyboardShortcuts.SHORTCUT_EDITOR_HEADING6);
    editorGroup.registerShortcut(keyboardShortcuts.SHORTCUT_EDITOR_CANNEDRESPONSES);
    editorGroup.registerShortcut(keyboardShortcuts.SHORTCUT_EDITOR_SELFSERVICE);
    editorGroup.registerShortcut(keyboardShortcuts.SHORTCUT_EDITOR_SUBMIT);
    keyboardShortcuts.registerGroup(editorGroup);

    // Bind global shortcuts.
    keyboardShortcuts.SHORTCUT_TOGGLE_HELP.bind(toggleKeyboardShortcutsDialog);
    keyboardShortcuts.SHORTCUT_OPEN_NEW_TICKET.bind(function () {
      window.location.href = $('#open-new-ticket').attr('href');
    });

    // Register click handler.
    $('#header #keyboard-shortcuts').on('click', showKeyboardShortcutsDialog);
    App.extend('KeyboardShortcuts', keyboardShortcuts);
    App.extend('KeyboardShortcutsStatic', KeyboardShortcuts);
  })($, window);
});