(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) : typeof define === 'function' && define.amd ? define(['exports'], factory) : (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.MergeFields = {}));
})(this, function (exports) {
  'use strict';

  /*
     * DOMParser HTML extension
     * 2012-09-04
     *
     * By Eli Grey, http://eligrey.com
     * Public domain.
     * NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.
     */

  /*! @source https://gist.github.com/1129031 */
  function DOMParser() {
    var proto = DOMParser.prototype,
      nativeParse = proto.parseFromString;

    // Firefox/Opera/IE throw errors on unsupported types
    try {
      // WebKit returns null on unsupported types
      if (new DOMParser().parseFromString("", "text/html")) {
        // text/html parsing is natively supported
        return;
      }
    } catch (ex) {}
    proto.parseFromString = function (markup, type) {
      if (/^\s*text\/html\s*(?:;|$)/i.test(type)) {
        var doc = document.implementation.createHTMLDocument("");
        if (markup.toLowerCase().indexOf('<!doctype') > -1) {
          doc.documentElement.innerHTML = markup;
        } else {
          doc.body.innerHTML = markup;
        }
        return doc;
      } else {
        return nativeParse.apply(this, arguments);
      }
    };
  }

  /**
   * Merge fields.
   *
   * @param parameters
   * @constructor
   */
  function MergeFields(parameters) {
    var instance = this;

    /**
     * Options.
     */
    var $container,
      $toolbar,
      $preview,
      $editor,
      valFn = parameters.valFn;

    /**
     * List of node attributes that are permitted to contain twig template code.
     */
    var whitelisted = {
      'img': ['src'],
      'a': ['href']
    };

    /**
     * HTML used to wrap plugin contents in the DOM.
     *
     * Use $.wrap() with this function.
     *
     * @returns {string}
     * @private
     */
    var createContainer = function () {
      return '<div class="sp-editor-container"></div>';
    };

    /**
     * Create the textarea toolbar.
     *
     * @returns {string}
     * @private
     */
    var createToolbar = function () {
      return '' + '<div class="sp-inline-block sp-mt-3">' + '<button class="switch-view visual-preview" type="button">' + Lang.get('general.preview') + '</button>' + '<button class="switch-view code-editor sp-hidden" type="button">' + Lang.get('general.editor') + '</button>' + '</div>';
    };

    /**
     * Create the preview HTML.
     *
     * @returns {string}
     * @private
     */
    var createPreview = function () {
      return '<div class="sp-editor-preview sp-editor-content"></div>';
    };

    /**
     * Check whether the 'html' contains any twig code that exists within HTML nodes or its' attributes.
     *
     * @param html
     * @returns {boolean}
     */
    var containsTwig = function (html) {
      var parser = new DOMParser(),
        doc = parser.parseFromString(html, "text/html");
      var items = doc.getElementsByTagName("*");
      for (var i = items.length; i--;) {
        // Get the Element.
        var node = items[i];

        // Remove any whitelisted attributes.
        if (whitelisted.hasOwnProperty(node.tagName.toLowerCase())) {
          var attributes = whitelisted[node.tagName.toLowerCase()];
          for (var c = attributes.length; c--;) {
            if (node.hasAttribute(attributes[c])) {
              node.removeAttribute(attributes[c]);
            }
          }
        }

        // Get the node value (not including any children).
        var node_html = node.innerHTML ? node.outerHTML.slice(0, node.outerHTML.indexOf(node.innerHTML)) : node.outerHTML;

        // Check if the node contains any twig.
        if (/<[^{>]*(\{\{(?:[^}]+|}(?!}))*}}|\{%(?:[^%]+|%(?!}))*%})[^>]*>/gi.test(node_html)) {
          return true;
        }
      }
      return false;
    };

    /**
     * Check whether the html contains {{ operator.reply_template }} and show a warning.
     *
     * @param html
     */
    var containsReplyTemplate = function (html) {
      // Check if the editor contains {{ operator.reply_template }}
      if (/\{\{\s*operator\.reply_template(\|raw)?\s*}}/.test(html)) {
        if (!$container.find('.twig-sig-warning').length) {
          $container.append($('<div>', {
            class: "sp-alert sp-alert-warning sp-mt-3 sp-mb-0 twig-sig-warning",
            text: Lang.get('core.twig_operator_reply_template')
          }));
        }
      } else {
        $container.find('.twig-sig-warning').remove();
      }
    };

    /**
     * Changed callback function.
     *
     * @param html
     */
    this.callback = function (html) {
      // Check if the editor contains {{ operator.reply_template }}.
      containsReplyTemplate(html);

      // Check any twig code exists within HTML nodes or its' attributes.
      if (containsTwig(html)) {
        // Add a warning if there isn't one already
        if (!$container.find('.twig-html-warning').length) {
          $container.append($('<div>', {
            class: "sp-alert sp-alert-warning sp-mt-3 sp-mb-0 twig-html-warning",
            text: Lang.get('core.twig_html_warning')
          }));
        }
      } else {
        // Remove warning if it exists
        $container.find('.twig-html-warning').remove();
      }
    };

    /**
     * Show the visual preview.
     *
     * @return {void}
     */
    this.showPreview = function () {
      var errorHandler = function (message) {
        // Change the view back to how it was originally.
        $toolbar.find('button:visible').prop('disabled', false).trigger('click');
        Swal.fire(Lang.get('messages.error'), message || Lang.get('messages.general_error'), 'error');
      };

      // Determine the height of the editor.
      $toolbar.find('button.switch-view').prop('disabled', true);
      $preview.html('').css($editor.position()).css('width', $editor.outerWidth(true)).css('height', $editor.outerHeight(true)).addClass('loadinggif').show();

      // If the form has an input called brand_id, use that value else fall back to the
      // data-brand set on form-row. If nothing is set then it won't be included.
      var brandId = $container.parents('form').find(':input[name="brand_id"]').length ? $container.parents('form').find(':input[name="brand_id"]').val() : $container.parents('.sp-form-row').data('brand');

      // Get ticket ID.
      var ticketId = $container.parents('form').find(':input[name="ticket_id"]').length ? $container.parents('form').find(':input[name="ticket_id"]').val() : null;

      // Attempt to get locale.
      var locale = $container.parents('.sp-form-container').find(':input[name$="[language]"]').length ? $container.parents('.sp-form-container').find(':input[name$="[language]"]').val() : Lang.locale();
      $.post(laroute.route('core.operator.emailtemplate.preview'), {
        'template': valFn(),
        'locale': locale,
        'template_id': $container.parents('form').data('templateId'),
        'brand_id': brandId,
        'ticket_id': ticketId,
        'is_email': parameters.syntaxEmailTemplate || false ? 1 : 0
      }).done(function (json) {
        if (typeof json.data !== 'undefined') {
          // Inject the HTML (this should be sanitized server-side).
          $preview.html(json.data);
        } else {
          errorHandler();
        }
      }).fail(function (jqXHR, textStatus, errorThrown) {
        try {
          var json = JSON.parse(jqXHR.responseText);
          errorHandler(typeof json.message !== 'undefined' ? json.message : errorThrown);
        } catch (e) {
          errorHandler(errorThrown);
        }
      }).always(function () {
        $toolbar.find('button.switch-view').prop('disabled', false);
        $preview.removeClass('loadinggif');
      });
    };

    /**
     * Show the WYSIWYG editor.
     *
     * @return {void}
     */
    this.showEditor = function () {
      $preview.hide();
    };

    /**
     * Container instance.
     *
     * @returns {*}
     */
    this.container = function () {
      return $container;
    };

    /**
     * Initialise the container.
     *
     * @param {jQuery} $wrapper
     * @return {void}
     */
    this.init = function ($wrapper) {
      // Add the toolbar after the wrapper.
      $editor = $wrapper.after(createContainer());
      $container = $editor.next('.sp-editor-container');
      $preview = $(createPreview()).hide();
      $container.append($preview);
      $toolbar = $(createToolbar()).on('click', 'button', function (e) {
        e.preventDefault();
        if ($(this).hasClass('visual-preview')) {
          instance.showPreview();
        } else {
          instance.showEditor();
        }

        // Switch buttons
        $container.find('.switch-view').toggle();
      });
      $container.append($toolbar);
    };
  }

  /**
   * Translations.
   *
   * @type {object}
   */
  MergeFields.translations = {
    merge_fields: Lang.get('operator.merge_fields'),
    merge_fields_desc: Lang.get('operator.merge_fields_desc')
  };

  /**
   * Toolbar icon.
   *
   * @type {string}
   */
  MergeFields.icon = '<svg height="24" width="24"><path d="M 6.098 7.104 C 6.298 8.404 6.498 8.704 6.498 10.004 C 6.498 10.804 4.998 11.504 4.998 11.504 L 4.998 12.504 C 4.998 12.504 6.498 13.204 6.498 14.004 C 6.498 15.304 6.298 15.604 6.098 16.904 C 5.798 19.004 6.898 20.004 7.898 20.004 C 8.898 20.004 9.998 20.004 9.998 20.004 L 9.998 18.004 C 9.998 18.004 8.198 18.204 8.198 17.004 C 8.198 16.104 8.398 16.104 8.598 14.104 C 8.698 13.204 8.098 12.504 7.498 12.004 C 8.098 11.504 8.698 10.904 8.598 10.004 C 8.298 8.004 8.198 8.004 8.198 7.104 C 8.198 5.904 9.998 6.004 9.998 6.004 L 9.998 4.004 C 9.998 4.004 8.998 4.004 7.898 4.004 C 6.798 4.004 5.798 5.004 6.098 7.104 Z"></path><path d="M 17.898 7.104 C 17.698 8.404 17.498 8.704 17.498 10.004 C 17.498 10.804 18.998 11.504 18.998 11.504 L 18.998 12.504 C 18.998 12.504 17.498 13.204 17.498 14.004 C 17.498 15.304 17.698 15.604 17.898 16.904 C 18.198 19.004 17.098 20.004 16.098 20.004 C 15.098 20.004 13.998 20.004 13.998 20.004 L 13.998 18.004 C 13.998 18.004 15.798 18.204 15.798 17.004 C 15.798 16.104 15.598 16.104 15.398 14.104 C 15.298 13.204 15.898 12.504 16.498 12.004 C 15.898 11.504 15.298 10.904 15.398 10.004 C 15.598 8.004 15.798 8.004 15.798 7.104 C 15.798 5.904 13.998 6.004 13.998 6.004 L 13.998 4.004 C 13.998 4.004 14.998 4.004 16.098 4.004 C 17.198 4.004 18.198 5.004 17.898 7.104 Z"></path></svg>';

  /**
   * Default modal contents.
   *
   * @type {string}
   */
  MergeFields.modalContent = '<section> \
                        <span class="sp-description">' + MergeFields.translations.merge_fields_desc + '</span> \
                        <br /><br /> \
                        <div class="sp-merge-fields sp-flex sp-flex-wrap"> \
                        </div> \
                      </section>';

  /**
   * Ticket merge fields.
   *
   * @param {bool} show_canned_responses
   * @returns {string}
   */
  MergeFields.ticketTemplate = function (show_canned_responses) {
    show_canned_responses = show_canned_responses || true;
    return String() + '<div class="sp-w-full lg:sp-w-1/2">' + '<strong class="sp-text-xl">' + Lang.choice('ticket.ticket', 2) + '</strong>' + '<table>' + '<tr>' + '<td><strong>' + Lang.get('operator.strings') + '</strong></td>' + '</tr>' + '<tr>' + '<td><button type="button" class="sp-button-sm" data-mf="{{ ticket.id }}">' + Lang.get('general.id') + '</button></td>' + '</tr>' + '<tr>' + '<td><button type="button" class="sp-button-sm" data-mf="{{ ticket.number }}">' + Lang.get('general.number') + '</button></td>' + '</tr>' + '<tr>' + '<td><button type="button" class="sp-button-sm" data-mf="{{ ticket.token }}">' + Lang.get('core.token') + '</button></td>' + '</tr>' + '<tr>' + '<td><button type="button" class="sp-button-sm" data-mf="{{ ticket.subject }}">' + Lang.get('ticket.subject') + '</button></td>' + '</tr>' + '<tr>' + '<td><button type="button" class="sp-button-sm" data-mf="{{ formatDate(ticket.due_time) }}">' + Lang.get('ticket.due_time') + '</button></td>' + '</tr>' + '<tr>' + '<td><button type="button" class="sp-button-sm" data-mf="{{ formatDate(ticket.created_at) }}">' + Lang.get('ticket.created_time') + '</button></td>' + '</tr>' + '<tr>' + '<td><button type="button" class="sp-button-sm" data-mf="{{ formatDate(ticket.updated_at) }}">' + Lang.get('ticket.last_action') + '</button></td>' + '</tr>' + '<tr>' + '<td><button type="button" class="sp-button-sm" data-mf="{{ ticket.lastReply.purified_text|raw }}">' + Lang.get('ticket.last_message_text') + '</button></td>' + '</tr>' + '<tr>' + '<td><button type="button" class="sp-button-sm" data-mf="{{ ticket.frontend_url }}">' + Lang.get('operator.frontend_url') + '</button></td>' + '</tr>' + '<tr>' + '<td><button type="button" class="sp-button-sm" data-mf="{{ ticket.operator_url }}">' + Lang.get('operator.operator_url') + '</button></td>' + '</tr>' + '<tr>' + '<td><strong>' + Lang.choice('ticket.department', 1) + '</strong></td>' + '</tr>' + '<tr>' + '<td><button type="button" class="sp-button-sm" data-mf="{{ ticket.department.id }}">' + Lang.get('general.id') + '</button></td>' + '</tr>' + '<tr>' + '<td><button type="button" class="sp-button-sm" data-mf="{{ ticket.department.frontend_name }}">' + Lang.get('general.name') + '</button></td>' + '</tr>' + '<tr>' + '<td><strong>' + Lang.choice('general.status', 1) + '</strong></td>' + '</tr>' + '<tr>' + '<td><button type="button" class="sp-button-sm" data-mf="{{ ticket.status.id }}">' + Lang.get('general.id') + '</button></td>' + '</tr>' + '<tr>' + '<td><button type="button" class="sp-button-sm" data-mf="{{ ticket.status.name }}">' + Lang.get('general.name') + '</button></td>' + '</tr>' + '<tr>' + '<td><strong>' + Lang.choice('ticket.priority', 1) + '</strong></td>' + '</tr>' + '<tr>' + '<td><button type="button" class="sp-button-sm" data-mf="{{ ticket.priority.id }}">' + Lang.get('general.id') + '</button></td>' + '</tr>' + '<tr>' + '<td><button type="button" class="sp-button-sm" data-mf="{{ ticket.priority.name }}">' + Lang.get('general.name') + '</button></td>' + '</tr>' + '<tr>' + '<td><strong>' + Lang.choice('ticket.sla_plan', 1) + '</strong></td>' + '</tr>' + '<tr>' + '<td><button type="button" class="sp-button-sm" data-mf="{{ ticket.slaplan.name }}">' + Lang.get('general.name') + '</button></td>' + '</tr>' + '<tr>' + '<td><strong>' + Lang.get('operator.collections') + '</strong></td>' + '</tr>' + '<tr>' + '<td><button type="button" class="sp-button-sm" data-mf="{% for tag in ticket.tags %}{{ tag.name }}{% endfor %}">' + Lang.choice('ticket.tag', 2) + '</button></td>' + '</tr>' + '<tr>' + '<td><button type="button" class="sp-button-sm" data-mf="{% for user in ticket.assigned %}{{ user.formatted_name }}{% endfor %}">' + Lang.get('ticket.assigned_operator') + '</button></td>' + '</tr>' + '<tr>' + '<td><button type="button" class="sp-button-sm" data-mf="{% for field in ticket.customfields %}{{ field.id }}{% endfor %}">' + Lang.choice('customfield.customfield', 2) + '</button></td>' + '</tr>' + (!show_canned_responses ? '' : '<tr>' + '<td><br /></td>' + '</tr>' + '<tr>' + '<td><strong class="sp-text-xl">' + Lang.choice('ticket.cannedresponse', 2) + '</strong></td>' + '</tr>' + '<tr>' + '<td><span class="sp-description">' + Lang.get('operator.merge_field_canned_desc') + '</span></td>' + '</tr>') + '</table>' + '</div>';
  };

  /**
   * User and system merge fields.
   *
   * @param {bool} show_organisations
   * @returns {string}
   */
  MergeFields.userAndSystemTemplate = function (show_organisations) {
    return String() + '<div class="sp-w-full sp-mt-6 lg:sp-w-1/2 lg:sp-mt-0">' + '<strong class="sp-text-xl">' + Lang.choice('user.user', 2) + '</strong>' + '<table>' + '<tr>' + '<td><strong>' + Lang.get('operator.strings') + '</strong></td>' + '</tr>' + '<tr>' + '<td><button type="button" class="sp-button-sm" data-mf="{{ user.id }}">' + Lang.get('general.id') + '</button></td>' + '</tr>' + '<tr>' + '<td><button type="button" class="sp-button-sm" data-mf="{{ user.formatted_name }}">' + Lang.get('user.formatted_name') + '</button></td>' + '</tr>' + '<tr>' + '<td><button type="button" class="sp-button-sm" data-mf="{{ user.firstname }}">' + Lang.get('user.firstname') + '</button></td>' + '</tr>' + '<tr>' + '<td><button type="button" class="sp-button-sm" data-mf="{{ user.lastname }}">' + Lang.get('user.lastname') + '</button></td>' + '</tr>' + '<tr>' + '<td><button type="button" class="sp-button-sm" data-mf="{{ user.email }}">' + Lang.get('general.email') + '</button></td>' + '</tr>' + '<tr>' + '<td><button type="button" class="sp-button-sm" data-mf="{{ user.email_verified }}">' + Lang.get('user.verified') + '</button></td>' + '</tr>' + '<tr>' + '<td><button type="button" class="sp-button-sm" data-mf="{{ user.active }}">' + Lang.get('user.account_active') + '</button></td>' + '</tr>' + '<tr>' + '<td><button type="button" class="sp-button-sm" data-mf="{{ user.country }}">' + Lang.get('user.country') + '</button></td>' + '</tr>' + '<tr>' + '<td><button type="button" class="sp-button-sm" data-mf="{{ user.language_code }}">' + Lang.choice('general.language', 1) + '</button></td>' + '</tr>' + '<tr>' + '<td><button type="button" class="sp-button-sm" data-mf="{{ formatDate(user.created_at) }}">' + Lang.get('ticket.created_time') + '</button></td>' + '</tr>' + (!show_organisations ? '' : '<tr>' + '<td><strong>' + Lang.choice('user.organisation', 1) + '</strong></td>' + '</tr>' + '<tr>' + '<td><button type="button" class="sp-button-sm" data-mf="{{ user.organisation.name }}">' + Lang.get('general.name') + '</button></td>' + '</tr>') + '<tr>' + '<td><strong>' + Lang.get('operator.collections') + '</strong></td>' + '</tr>' + '<tr>' + '<td><button type="button" class="sp-button-sm" data-mf="{% for group in user.groups %}{{ group.name }}{% endfor %}">' + Lang.choice('user.group', 2) + '</button></td>' + '</tr>' + '<tr>' + '<td><button type="button" class="sp-button-sm" data-mf="{% for field in ticket.customfields %}{{ field.id }}{% endfor %}">' + Lang.choice('customfield.customfield', 2) + '</button></td>' + '</tr>' + '<tr>' + '<td>' + '<br />' + '<strong class="sp-text-xl">' + Lang.choice('core.brand', 1) + '</strong>' + '</td>' + '</tr>' + '<tr>' + '<td><strong>' + Lang.get('operator.strings') + '</strong></td>' + '</tr>' + '<tr>' + '<td><button type="button" class="sp-button-sm" data-mf="{{ brand.name }}">' + Lang.get('core.brand_name') + '</button></td>' + '</tr>' + '<tr>' + '<td><button type="button" class="sp-button-sm" data-mf="{{ brand.default_email }}">' + Lang.get('general.email_address') + '</button></td>' + '</tr>' + '<tr>' + '<td><button type="button" class="sp-button-sm" data-mf="{{ brand.frontend_url }}">' + Lang.get('operator.frontend_url') + '</button></td>' + '</tr>' + '</table>' + '</div>';
  };

  /**
   * Append merge fields to the modal.
   *
   * @param $modal
   * @param {bool} show_tickets
   * @param {bool} show_canned_responses
   * @param {bool} show_organisations
   * @returns {jQuery}
   */
  MergeFields.appendTo = function ($modal, show_tickets, show_canned_responses, show_organisations) {
    return $modal.find('.sp-merge-fields').append(show_tickets ? MergeFields.ticketTemplate(show_canned_responses) : '').append(MergeFields.userAndSystemTemplate(show_organisations)).find('button').on('click', function () {
      $(this).trigger('mergefield:inserted', {
        value: $(this).data('mf')
      });
    });
  };
  exports.MergeFields = MergeFields;
});