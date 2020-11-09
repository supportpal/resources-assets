(function ( $, window, document, undefined ) {
    /**
     * Toolbar helpers.
     *
     * @param $container
     * @constructor
     */
    function Toolbar($container)
    {
        "use strict";

        /**
         * Container.
         *
         * @type {jQuery}
         */
        var $toolbar;

        /**
         * Create the toolbar.
         *
         * @return {void}
         */
        var createToolbar = function () {
            $toolbar = $('<div>', {class: 'redactor-toolbar-wrapper sp-z-50'})
                .append(
                    $('<div>', {class: 'redactor-toolbar'})
                );

            $container.prepend($toolbar);
        }

        /**
         * Add a button to the toolbar. Use .on('click', fn) to handle what should happen when the
         * toolbar button is pressed.
         *
         * @param name
         * @param data
         * @returns {jQuery}
         */
        this.addButton = function (name, data) {
            if (! $toolbar) {
                createToolbar();
            }

            var $button = $('<a/>', {
                class: 're-button re-button-icon re-' + name,
                href: '#',
                title: data.title || '',
                role: 'button',
                alt: data.title || ''
            });
            if (data.icon) {
                $button.html(data.icon);
            }

            $toolbar.find('.redactor-toolbar').append($button);

            return $button;
        };
    }

    /**
     * Add merge fields to the toolbar.
     *
     * @param parameters
     * @constructor
     */
    function MergeFields(parameters)
    {
        "use strict";

        var mergeFields = new App.mergefields({
            editor: parameters.editor,
            show_tickets: parameters.show_tickets,
            show_organisations: parameters.show_organisations,
            show_canned_responses: parameters.show_canned_responses,
            syntaxEmailTemplate: parameters.syntaxEmailTemplate
        });

        mergeFields.init();

        var $button = parameters.toolbar.addButton('mergefields', {
            title: App.mergefields.translations.en.merge_fields,
            icon: App.mergefields.icon
        });

        $button.on('click', function (e) {
            Swal.fire({
                title: App.mergefields.translations.en.merge_fields,
                html: $('<div/>', {style: 'text-align: initial'})
                    .append(App.mergefields.modalContent),
                showCancelButton: true,
                showCloseButton: true,
                showConfirmButton: false,
                showClass: {
                    popup: 'swal2-noanimation',
                    backdrop: 'swal2-noanimation'
                },
                hideClass: {
                    popup: '',
                    backdrop: ''
                },
                willOpen: function () {
                    mergeFields.appendMergeFields($(Swal.getContent()))
                        .on('mergefield:inserted', function () {
                            Swal.close();
                        });
                }
            })
        });
    }

    /**
     * Source code editor.
     *
     * @param element
     * @param parameters
     * @constructor
     */
    function Editor(element, parameters)
    {
        "use strict";

        /**
         * Default parameters.
         *
         * @type {object}
         */
        var defaults = {
            toolbar: false,
            codemirror: CodeMirror.options
        };

        var editor,
            toolbar,
            $element = $(element),
            instance = this,
            containerClassName = 'codemirror-box';

        /**
         * Create a container box.
         *
         * @returns {jQuery}
         */
        var createContainer = function () {
            var $container = $('<div/>', {class: containerClassName});
            $element.next('.CodeMirror').wrapAll($container);
        }

        /**
         * Initialise the editor.
         */
        var init = function () {
            // Initialise the text area.
            $element = $(element);
            var options = $.extend(true, defaults, parameters);
            editor = CodeMirror.fromTextArea(element, options.codemirror);

            // Wrap the editor in a container.
            createContainer();

            // Add toolbar if necessary.
            if (options.toolbar) {
                toolbar = new Toolbar(instance.container());
                new MergeFields({
                    toolbar: toolbar,
                    editor: instance,
                    show_tickets: parameters.mergeFields.tickets,
                    show_organisations: parameters.mergeFields.organisations,
                    show_canned_responses: parameters.mergeFields.canned_responses,
                    syntaxEmailTemplate: parameters.mergeFields.syntaxEmailTemplate
                });
            }
        };

        /**
         * The container element.
         *
         * @returns {jQuery}
         */
        this.container = function () {
            return $element.next('.' + containerClassName);
        };

        /**
         * Code mirror instance.
         *
         * @returns {CodeMirror}
         */
        this.codemirror = function () {
            return editor;
        }

        // Initialise!
        init();
    }

    $.fn.sourcecode = function (options) {
        return $(this).each(function () {
            $(this)[0].sourcecode = new Editor($(this)[0], options);
        });
    };
})($, window, document);