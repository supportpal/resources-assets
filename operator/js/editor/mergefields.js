(function ( $, window, document, undefined ) {
    /*
     * DOMParser HTML extension
     * 2012-09-04
     *
     * By Eli Grey, http://eligrey.com
     * Public domain.
     * NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.
     */

    /*! @source https://gist.github.com/1129031 */
    /*global document, DOMParser*/

    (function(DOMParser) {
        "use strict";

        var
            proto = DOMParser.prototype
            , nativeParse = proto.parseFromString
        ;

        // Firefox/Opera/IE throw errors on unsupported types
        try {
            // WebKit returns null on unsupported types
            if ((new DOMParser()).parseFromString("", "text/html")) {
                // text/html parsing is natively supported
                return;
            }
        } catch (ex) {}

        proto.parseFromString = function(markup, type) {
            if (/^\s*text\/html\s*(?:;|$)/i.test(type)) {
                var
                    doc = document.implementation.createHTMLDocument("")
                ;
                if (markup.toLowerCase().indexOf('<!doctype') > -1) {
                    doc.documentElement.innerHTML = markup;
                }
                else {
                    doc.body.innerHTML = markup;
                }
                return doc;
            } else {
                return nativeParse.apply(this, arguments);
            }
        };
    }(DOMParser));

    /**
     * A wrapper to unify methods across Redactor and CodeMirror.
     *
     * @param app
     * @constructor
     */
    function Editor(app)
    {
        "use strict";

        var instance = this;

        /**
         * Whether the textarea has been initialised for use with Redactor.
         *
         * @returns {boolean}
         */
        this.isRedactor = function () {
            return app.namespace === 'redactor';
        };

        /**
         * Get the editor container.
         *
         * @returns {jQuery}
         */
        this.container = function () {
            if (instance.isRedactor()) {
                return $(app.container.getElement().get());
            }

            return app.container();
        };

        /**
         * Get the value from the editor.
         *
         * @returns {string}
         */
        this.val = function () {
            if (instance.isRedactor() && ! app.editor.isSourceMode()) {
                return instance.api().api('module.source.getCode');
            }

            return instance.api().getValue();
        };

        /**
         * Sync the textarea and the editor.
         *
         * @return {void}
         */
        this.sync = function () {
            // Only on CodeMirror.
            if (! instance.isRedactor() || app.editor.isSourceMode()) {
                this.api().save();
            }
        };

        /**
         * Insert text into the editor at the cursor position.
         *
         * @param text
         * @return {void}
         */
        this.insert = function (text) {
            if (instance.isRedactor() && ! app.editor.isSourceMode()) {
                instance.api().insertion.insertRaw(text);
            } else {
                var doc = instance.api().getDoc(),
                    cursor = doc.getCursor(); // gets the line number in the cursor position

                doc.replaceRange(text, { line: cursor.line, ch: cursor.ch });
            }
        };

        /**
         * Get the editor API.
         *
         * @returns {CodeMirror|App}
         */
        this.api = function () {
            if (instance.isRedactor()) {
                if (app.editor.isSourceMode()) {
                    return app.container.getElement().find('.CodeMirror').get().CodeMirror;
                }

                return app;
            }

            return app.codemirror();
        };
    }

    /**
     * Merge fields.
     *
     * @param parameters
     * @constructor
     */
    function MergeFields(parameters)
    {
        "use strict";

        var instance = this;

        /**
         * Options.
         */
        var $container, $toolbar, $preview,
            editor = new Editor(parameters.editor),
            show_tickets = parameters.show_tickets || false,
            show_organisations = parameters.show_organisations || false,
            show_canned_responses = typeof parameters.show_canned_responses !== 'undefined' ? parameters.show_canned_responses : true;

        /**
         * List of node attributes that are permitted to contain twig template code.
         */
        var whitelisted = {
            'img': [ 'src' ],
            'a': [ 'href' ]
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
            return '<div class="sp-inline-block sp-mt-3">' +
                        '<button class="switch-view visual-preview" type="button">' +
                            Lang.get('general.preview') +
                        '</button>' +
                        '<button class="switch-view code-editor sp-hidden" type="button">' +
                            Lang.get('general.editor') +
                        '</button>' +
                    '</div>';
        };

        /**
         * Create the preview HTML.
         *
         * @returns {string}
         * @private
         */
        var createPreview = function () {
            return '<div class="sp-editor-preview"></div>';
        };

        /**
         * Ticket merge fields.
         *
         * @returns {string}
         */
        var ticketTemplate = function () {
            return String()
                + '<div class="sp-w-full lg:sp-w-1/2">'
                    + '<strong class="sp-text-xl">' + Lang.choice('ticket.ticket', 2) + '</strong>'
                    + '<table>'
                        + '<tr>'
                            + '<td><strong>' + Lang.get('operator.strings') + '</strong></td>'
                        + '</tr>'
                        + '<tr>'
                            + '<td><button type="button" data-mf="{{ ticket.id }}">' + Lang.get('general.id') + '</button></td>'
                        + '</tr>'
                        + '<tr>'
                            + '<td><button type="button" data-mf="{{ ticket.number }}">' + Lang.get('general.number') + '</button></td>'
                        + '</tr>'
                        + '<tr>'
                            + '<td><button type="button" data-mf="{{ ticket.token }}">' + Lang.get('core.token') + '</button></td>'
                        + '</tr>'
                        + '<tr>'
                            + '<td><button type="button" data-mf="{{ ticket.subject }}">' + Lang.get('ticket.subject') + '</button></td>'
                        + '</tr>'
                        + '<tr>'
                            + '<td><button type="button" data-mf="{{ formatDate(ticket.due_time) }}">' + Lang.get('ticket.due_time') + '</button></td>'
                        + '</tr>'
                        + '<tr>'
                            + '<td><button type="button" data-mf="{{ formatDate(ticket.created_at) }}">' + Lang.get('ticket.created_time') + '</button></td>'
                        + '</tr>'
                        + '<tr>'
                            + '<td><button type="button" data-mf="{{ formatDate(ticket.updated_at) }}">' + Lang.get('ticket.last_action') + '</button></td>'
                        + '</tr>'
                        + '<tr>'
                            + '<td><button type="button" data-mf="{{ ticket.lastReply.purified_text|raw }}">' + Lang.get('ticket.last_message_text') + '</button></td>'
                        + '</tr>'
                        + '<tr>'
                            + '<td><button type="button" data-mf="{{ ticket.frontend_url }}">' + Lang.get('operator.frontend_url') + '</button></td>'
                        + '</tr>'
                        + '<tr>'
                            + '<td><button type="button" data-mf="{{ ticket.operator_url }}">' + Lang.get('operator.operator_url') + '</button></td>'
                        + '</tr>'
                        + '<tr>'
                            + '<td><strong>' + Lang.choice('ticket.department', 1) + '</strong></td>'
                        + '</tr>'
                        + '<tr>'
                            + '<td><button type="button" data-mf="{{ ticket.department.id }}">' + Lang.get('general.id') + '</button></td>'
                        + '</tr>'
                        + '<tr>'
                            + '<td><button type="button" data-mf="{{ ticket.department.frontend_name }}">' + Lang.get('general.name') + '</button></td>'
                        + '</tr>'
                        + '<tr>'
                            + '<td><strong>' + Lang.choice('general.status', 1) + '</strong></td>'
                        + '</tr>'
                        + '<tr>'
                            + '<td><button type="button" data-mf="{{ ticket.status.id }}">' + Lang.get('general.id') + '</button></td>'
                        + '</tr>'
                        + '<tr>'
                            + '<td><button type="button" data-mf="{{ ticket.status.name }}">' + Lang.get('general.name') + '</button></td>'
                        + '</tr>'
                        + '<tr>'
                            + '<td><strong>' + Lang.choice('ticket.priority', 1) + '</strong></td>'
                        + '</tr>'
                        + '<tr>'
                            + '<td><button type="button" data-mf="{{ ticket.priority.id }}">' + Lang.get('general.id') + '</button></td>'
                        + '</tr>'
                        + '<tr>'
                            + '<td><button type="button" data-mf="{{ ticket.priority.name }}">' + Lang.get('general.name') + '</button></td>'
                        + '</tr>'
                        + '<tr>'
                            + '<td><strong>' + Lang.choice('ticket.sla_plan', 1) + '</strong></td>'
                        + '</tr>'
                        + '<tr>'
                            + '<td><button type="button" data-mf="{{ ticket.slaplan.name }}">' + Lang.get('general.name') + '</button></td>'
                        + '</tr>'
                        + '<tr>'
                            + '<td><strong>' + Lang.get('operator.collections') + '</strong></td>'
                        + '</tr>'
                        + '<tr>'
                            + '<td><button type="button" data-mf="{% for tag in ticket.tags %}{{ tag.name }}{% endfor %}">' + Lang.choice('ticket.tag', 2) + '</button></td>'
                        + '</tr>'
                        + '<tr>'
                            + '<td><button type="button" data-mf="{% for user in ticket.assigned %}{{ user.formatted_name }}{% endfor %}}">' + Lang.get('ticket.assigned_operator') + '</button></td>'
                        + '</tr>'
                        + '<tr>'
                            + '<td><button type="button" data-mf="{% for field in ticket.customfields %}{{ field.id }}{% endfor %}">' + Lang.choice('customfield.customfield', 2) + '</button></td>'
                        + '</tr>'
                        + (! show_canned_responses ? '' :
                        '<tr>'
                            + '<td><br /></td>'
                        + '</tr>'
                        + '<tr>'
                            + '<td><strong class="sp-text-xl">' + Lang.choice('ticket.cannedresponse', 2) + '</strong></td>'
                        + '</tr>'
                        + '<tr>'
                            + '<td><span class="sp-description">' + Lang.get('operator.merge_field_canned_desc') + '</span></td>'
                        + '</tr>')
                    + '</table>'
                + '</div>';
        };

        /**
         * User and system merge fields.
         *
         * @returns {string}
         */
        var userAndSystemTemplate = function () {
            return String()
                + '<div class="sp-w-full sp-mt-6 lg:sp-w-1/2 lg:sp-mt-0">'
                    + '<strong class="sp-text-xl">' + Lang.choice('user.user', 2) + '</strong>'
                    + '<table>'
                        + '<tr>'
                            + '<td><strong>' + Lang.get('operator.strings') + '</strong></td>'
                        + '</tr>'
                        + '<tr>'
                            + '<td><button type="button" data-mf="{{ user.id }}">' + Lang.get('general.id') + '</button></td>'
                        + '</tr>'
                        + '<tr>'
                            + '<td><button type="button" data-mf="{{ user.formatted_name }}">' + Lang.get('user.formatted_name') + '</button></td>'
                        + '</tr>'
                        + '<tr>'
                            + '<td><button type="button" data-mf="{{ user.firstname }}">' + Lang.get('user.firstname') + '</button></td>'
                        + '</tr>'
                        + '<tr>'
                            + '<td><button type="button" data-mf="{{ user.lastname }}">' + Lang.get('user.lastname') + '</button></td>'
                        + '</tr>'
                        + '<tr>'
                            + '<td><button type="button" data-mf="{{ user.email }}">' + Lang.get('general.email') + '</button></td>'
                        + '</tr>'
                        + '<tr>'
                            + '<td><button type="button" data-mf="{{ user.confirmed }}">' + Lang.get('user.confirmed') + '</button></td>'
                        + '</tr>'
                        + '<tr>'
                            + '<td><button type="button" data-mf="{{ user.active }}">' + Lang.get('user.account_active') + '</button></td>'
                        + '</tr>'
                        + '<tr>'
                            + '<td><button type="button" data-mf="{{ user.country }}">' + Lang.get('user.country') + '</button></td>'
                        + '</tr>'
                        + '<tr>'
                            + '<td><button type="button" data-mf="{{ user.language_code }}">' + Lang.choice('general.language', 1) + '</button></td>'
                        + '</tr>'
                        + '<tr>'
                            + '<td><button type="button" data-mf="{{ formatDate(user.created_at) }}">' + Lang.get('ticket.created_time') + '</button></td>'
                        + '</tr>'
                        + (! show_organisations ? '' :
                        '<tr>'
                            + '<td><strong>' + Lang.choice('user.organisation', 1) + '</strong></td>'
                        + '</tr>'
                        + '<tr>'
                            + '<td><button type="button" data-mf="{{ user.organisation.name }}">' + Lang.get('general.name') + '</button></td>'
                        + '</tr>')
                        + '<tr>'
                            + '<td><strong>' + Lang.get('operator.collections') + '</strong></td>'
                        + '</tr>'
                        + '<tr>'
                            + '<td><button type="button" data-mf="{% for group in user.groups %}{{ group.name }}{% endfor %}">' + Lang.choice('user.group', 2) + '</button></td>'
                        + '</tr>'
                        + '<tr>'
                            + '<td><button type="button" data-mf="{% for field in ticket.customfields %}{{ field.id }}{% endfor %}">' + Lang.choice('customfield.customfield', 2) + '</button></td>'
                        + '</tr>'
                        + '<tr>'
                            + '<td>'
                                + '<br />'
                                + '<strong class="sp-text-xl">' + Lang.choice('core.brand', 1) + '</strong>'
                            + '</td>'
                        + '</tr>'
                        + '<tr>'
                            + '<td><strong>' + Lang.get('operator.strings') + '</strong></td>'
                        + '</tr>'
                        + '<tr>'
                            + '<td><button type="button" data-mf="{{ brand.name }}">' + Lang.get('core.brand_name') + '</button></td>'
                        + '</tr>'
                        + '<tr>'
                            + '<td><button type="button" data-mf="{{ brand.default_email }}">' + Lang.get('general.email_address') + '</button></td>'
                        + '</tr>'
                        + '<tr>'
                            + '<td><button type="button" data-mf="{{ brand.frontend_url }}">' + Lang.get('operator.frontend_url') + '</button></td>'
                        + '</tr>'
                    + '</table>'
                + '</div>';
        };

        /**
         * Append merge fields to the modal.
         *
         * @param $modal
         * @returns {jQuery}
         */
        this.appendMergeFields = function ($modal) {
            return $modal.find('.sp-merge-fields')
                .append(show_tickets ? ticketTemplate() : '')
                .append(userAndSystemTemplate())
                .find('button')
                .on('click', function () {
                    editor.insert($(this).data('mf'));
                    $(this).trigger('mergefield:inserted');
                })
        };

        /**
         * Check whether the 'html' contains any twig code that exists within HTML nodes or its' attributes.
         *
         * @param html
         * @returns {boolean}
         */
        this.containsTwig = function (html) {
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
                var node_html = node.innerHTML
                    ? node.outerHTML.slice(0,node.outerHTML.indexOf(node.innerHTML))
                    : node.outerHTML;

                // Check if the node contains any twig.
                if (/<[^{>]*(\{\{(?:[^}]+|}(?!}))*}}|\{%(?:[^%]+|%(?!}))*%})[^>]*>/gi.test(node_html)) {
                    // Job done. Feet up, laughing.
                    return true;
                }
            }

            return false;
        };

        /**
         * Check whether the redactor instance contains {{ operator.signature }} and show a warning.
         *
         * @param html
         */
        this.containsSignature = function (html) {
            // Check if the editor contains {{ operator.signature }}
            if (/\{\{\s*operator\.signature(\|raw)?\s*}}/.test(html)) {
                if (! $container.find('.twig-sig-warning').length) {
                    $container.append(
                        $('<div>', { class: "sp-alert sp-alert-warning sp-mt-3 sp-mb-0 twig-sig-warning", text: Lang.get('core.twig_operator_signature') })
                    );
                }
            } else {
                $container.find('.twig-sig-warning').remove();
            }
        };

        /**
         * Editor instance.
         *
         * @returns {Editor}
         */
        this.editor = function () {
            return editor;
        };

        /**
         * Changed callback function.
         *
         * @param html
         */
        this.callback = function (html) {
            // Sync the textarea and editor.
            editor.sync();

            // Check if the editor contains {{ operator.signature }}.
            instance.containsSignature(html);

            // Check any twig code exists within HTML nodes or its' attributes.
            if (instance.containsTwig(html)) {
                // Add a warning if there isn't one already
                if (! $container.find('.twig-html-warning').length) {
                    $container.append(
                        $('<div>', {class: "sp-alert sp-alert-warning sp-mt-3 sp-mb-0 twig-html-warning", text: Lang.get('core.twig_html_warning')})
                    );
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

            // Determine the height of the redactor box.
            var height = $container.find(':first-child').outerHeight(true);

            $toolbar.find('button.switch-view').prop('disabled', true);
            $preview.html('').css('height', height).addClass('loadinggif').show();

            // If the form has an input called brand_id, use that value else fall back to the
            // data-brand set on form-row. If nothing is set then it won't be included.
            var brandId = $container.parents('form').find(':input[name="brand_id"]').length
                ? $container.parents('form').find(':input[name="brand_id"]').val()
                : $container.parents('.form-row').data('brand');

            // Get ticket ID.
            var ticketId = $container.parents('form').find(':input[name="ticket_id"]').length
                ? $container.parents('form').find(':input[name="ticket_id"]').val()
                : null;

            // Attempt to get locale.
            var locale = $container.parents('.sp-form-container').find(':input[name$="[language]"]').length
                ? $container.parents('.sp-form-container').find(':input[name$="[language]"]').val()
                : Lang.locale();

            $.post(
                    laroute.route('core.operator.emailtemplate.preview'),
                    {
                        'template': editor.val(),
                        'redactor[]': editor.isRedactor() ? 'template' : null, // Only run p2br if it's redactor.
                        'locale': locale,
                        'template_id': $container.parents('form').data('templateId'),
                        'brand_id': brandId,
                        'ticket_id': ticketId,
                        'is_email': (parameters.syntaxEmailTemplate || false) ? 1 : 0
                    }
                )
                .done(function (json) {
                    if (typeof json.data !== 'undefined') {
                        // Inject the HTML (this should be sanitized server-side).
                        $preview.html(json.data);
                    } else {
                        errorHandler();
                    }
                })
                .fail(function (jqXHR, textStatus, errorThrown) {
                    try {
                        var json = JSON.parse(jqXHR.responseText);

                        errorHandler(typeof json.message !== 'undefined' ? json.message : errorThrown);
                    } catch (e) {
                        errorHandler(errorThrown);
                    }
                })
                .always(function () {
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
         * @return {void}
         */
        this.init = function () {
            // Add the toolbar after the redactor box.
            $container = editor.container().wrapAll(createContainer()).parent();

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

            // CodeMirror change callback.
            editor.api().on('change', function (codemirror, changeObj) {
                instance.callback(codemirror.getValue());
            });

            // Check if the editor contains {{ operator.signature }}.
            instance.containsSignature(editor.val());
        };
    }

    /**
     * Translations.
     *
     * @type {object}
     */
    MergeFields.translations = {
        en: {
            merge_fields: Lang.get('operator.merge_fields'),
            merge_fields_desc: Lang.get('operator.merge_fields_desc')
        }
    };

    /**
     * Toolbar icon.
     *
     * @type {string}
     */
    MergeFields.icon = '<i class="fas fa-database"></i>';

    /**
     * Default modal contents.
     *
     * @type {string}
     */
    MergeFields.modalContent = '<section> \
                          <span class="sp-description">' + MergeFields.translations.en.merge_fields_desc + '</span> \
                          <br /><br /> \
                          <div class="sp-merge-fields sp-flex sp-flex-wrap"> \
                          </div> \
                        </section>';

    App.extend('mergefields', MergeFields);
})($, window, document);