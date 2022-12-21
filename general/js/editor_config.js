(function($)
{
    'use strict';

    /**
     * Convert SupportPal colour scheme to an array usable by tinymce.
     *
     * @return {[]}
     */
    function colourSchemeMap()
    {
        var theme = typeof spCssVarThemes === "undefined" ? {} : spCssVarThemes,
          light = theme.light || {},
          colours = [];

        for (var color in light) {
            colours.push(light[color]);
            colours.push(light[color]);
        }

        return colours;
    }

    /**
     * Delay execution of callback.
     */
    var delay = (function() {
        var timer = 0;
        return function(callback, ms){
            clearTimeout (timer);
            timer = setTimeout(callback, ms);
        };
    })();

    /**
     * Image upload handler.
     */
    function image_upload_handler (blobInfo, success, failure, progress)
    {
        var formData = new FormData();
        formData.append('_token', $('meta[name=csrf_token]').prop('content'));
        formData.append('file', blobInfo.blob(), blobInfo.filename());

        var ajaxData = {
            url: laroute.route('core.embed.image'),
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false
        };

        $.ajax(ajaxData)
            .done(function(json) {
                if (json.location) {
                    success(json.location);
                } else {
                    failure(json.message || Lang.get('messages.error_embed_image'));
                }
            })
            .fail(function(){
                failure(Lang.get('messages.error_embed_image'));
          });
    }

    // CodeMirror global options.
    // Must be used manually - CodeMirror doesn't have global options support.
    CodeMirror.options = {
        autoRefresh: true,
        lineNumbers: true,
        lineWrapping: true,
        mode: {name: "htmltwig", htmlMode: true},
        theme: 'material',
    };
    CodeMirror.defineMode("htmltwig", function(config, parserConfig) {
        return CodeMirror.overlayMode(
            CodeMirror.getMode(config, parserConfig.backdrop || "text/html"),
            CodeMirror.getMode(config, "twig")
        );
    });

    $.fn.editor.defaults = {
        menubar: false,
        selector: "textarea",
        plugins: [
            "lists", "codemirror", "codesample", "link", "image", "autolink", "autoresize", "blockquotepatch",
            "paste", "emoticons",
        ],
        skin: false,
        body_class: 'sp-editor-content',
        content_style: ':root {' + cssToString(spCssVarThemes[$('body').hasClass('sp-theme-dark') ? 'dark' : 'light']) + '}',
        content_css: laroute.asset('resources/assets/libs/tinymce/css/tinymce-editor' + (App.env === 'production' ? '.min.css' : '.css')),
        // Disable Word processing in the paste plugin.
        // It breaks copy/paste of images from help desk messages containing p.MsoNormal
        paste_enable_default_filters: false,
        // Enable drag & drop, copy & paste, etc of locally stored images.
        // This setting works in conjunction with automatic_uploads, and image_upload_handler to convert base64 data
        // uri images into URLs.
        paste_data_images: true,
        // HTML source view using CodeMirror plugin.
        codemirror: CodeMirror.options,
        // https://www.tiny.cloud/docs/plugins/opensource/autoresize/#min_height
        resize: false,
        min_height: 200,
        autoresize_bottom_margin: 0,
        // open links in a new tab
        // https://www.tiny.cloud/docs-4x/plugins/link/?_ga=2.260037772.769829965.1642594724-447489908.1642594724#default_link_target
        default_link_target: "_blank",
        link_title: false,
        link_context_toolbar: true,
        // do not manipulate input URLs
        // https://www.tiny.cloud/docs/configure/url-handling/#relative_urls
        relative_urls : false,
        convert_urls: false,
        // empty paragraphs are padded with a non-breaking space
        // https://www.tiny.cloud/docs/configure/content-filtering/#extended_valid_elements
        extended_valid_elements: 'data[contenteditable=false|class|value],#p',
        // styleselect toolbar configuration
        // https://www.tiny.cloud/docs-4x/configure/content-formatting/#style_formats
        style_formats: [
            {title: Lang.get('core.paragraph'), block: 'p'},
            {title: Lang.get('core.heading1'), block: 'h1'},
            {title: Lang.get('core.heading2'), block: 'h2'},
            {title: Lang.get('core.heading3'), block: 'h3'},
            {title: Lang.get('core.heading4'), block: 'h4'},
            {title: Lang.get('core.heading5'), block: 'h5'},
            {title: Lang.get('core.heading6'), block: 'h6'}
        ],
        toolbar: "codemirror | styleselect formatgroup | listsgroup link image",
        toolbar_groups: {
            formatgroup: {
                // see https://www.tiny.cloud/docs/advanced/editor-icon-identifiers/ for icons
                icon: 'text-color',
                tooltip: Lang.get('core.more_formatting'),
                items: 'bold underline italic strikethrough | forecolor backcolor | blockquote codesample | removeformat'
            },
            listsgroup: {
                icon: 'unordered-list',
                tooltip: Lang.get('core.lists'),
                items: 'bullist numlist | indent outdent'
            }
        },
        // https://www.tiny.cloud/docs/configure/spelling/#browser_spellcheck
        browser_spellcheck: true,
        // https://www.tiny.cloud/docs/plugins/opensource/emoticons/#emoticons_database_url
        emoticons_database_url: laroute.asset("resources/assets/libs/tinymce/emojis.min.js"),
        // https://www.tiny.cloud/docs/configure/content-appearance/#color_map
        color_map: colourSchemeMap(),
        color_cols: 9,
        // https://www.tiny.cloud/docs/ui-components/contextmenu/
        // If enabled, consider that browser_spellcheck requires use of CTRL+Right Click
        // (https://www.tiny.cloud/blog/tinymce-spellchecker/).
        contextmenu: false,
        // https://www.tiny.cloud/docs/general-configuration-guide/upload-images/
        images_upload_handler: image_upload_handler,
        image_dimensions: false,
        language: 'supportpal',
        setup: function (editor) {
            // Toggle expandable quoted sections.
            editor.on('click', function (e) {
                if ($(e.target).is('div.expandable')) {
                    $(e.target).next().toggle();
                    editor.execCommand('mceAutoResize');
                }
            });

            // https://www.tiny.cloud/docs/advanced/events/
            editor.on('keyup', function (e) {
                var textarea = editor.getElement(),
                  $form     = $(textarea).parents('form.validate'),
                  validator = $form.data('validator');

                // jquery-validation hasn't been initialised on this form.
                if (! validator) {
                    return;
                }

                // 8  = back space
                // 46 = forward backspace or delete
                if (typeof e.keyCode !== 'undefined' && e.keyCode !== 8 && e.keyCode !== 46) {
                    // Wait 1 second for the user to stop typing before checking if the textarea contents is valid. Otherwise
                    // if jquery.validate is using remote (AJAX) rules then this can fire an AJAX for every single key press.
                    // The element function will only validate this single element rather than whole form.
                    delay(function () {
                        validator.element(textarea);
                    }, 1000);
                }
            });

            // https://www.tiny.cloud/docs/api/tinymce.editor.ui/tinymce.editor.ui.registry/#addicon
            editor.ui.registry.addIcon('brackets-curly', '<svg height="24" width="24"><path d="M 6.098 7.104 C 6.298 8.404 6.498 8.704 6.498 10.004 C 6.498 10.804 4.998 11.504 4.998 11.504 L 4.998 12.504 C 4.998 12.504 6.498 13.204 6.498 14.004 C 6.498 15.304 6.298 15.604 6.098 16.904 C 5.798 19.004 6.898 20.004 7.898 20.004 C 8.898 20.004 9.998 20.004 9.998 20.004 L 9.998 18.004 C 9.998 18.004 8.198 18.204 8.198 17.004 C 8.198 16.104 8.398 16.104 8.598 14.104 C 8.698 13.204 8.098 12.504 7.498 12.004 C 8.098 11.504 8.698 10.904 8.598 10.004 C 8.298 8.004 8.198 8.004 8.198 7.104 C 8.198 5.904 9.998 6.004 9.998 6.004 L 9.998 4.004 C 9.998 4.004 8.998 4.004 7.898 4.004 C 6.798 4.004 5.798 5.004 6.098 7.104 Z"></path><path d="M 17.898 7.104 C 17.698 8.404 17.498 8.704 17.498 10.004 C 17.498 10.804 18.998 11.504 18.998 11.504 L 18.998 12.504 C 18.998 12.504 17.498 13.204 17.498 14.004 C 17.498 15.304 17.698 15.604 17.898 16.904 C 18.198 19.004 17.098 20.004 16.098 20.004 C 15.098 20.004 13.998 20.004 13.998 20.004 L 13.998 18.004 C 13.998 18.004 15.798 18.204 15.798 17.004 C 15.798 16.104 15.598 16.104 15.398 14.104 C 15.298 13.204 15.898 12.504 16.498 12.004 C 15.898 11.504 15.298 10.904 15.398 10.004 C 15.598 8.004 15.798 8.004 15.798 7.104 C 15.798 5.904 13.998 6.004 13.998 6.004 L 13.998 4.004 C 13.998 4.004 14.998 4.004 16.098 4.004 C 17.198 4.004 18.198 5.004 17.898 7.104 Z"></path></svg>');

            // https://www.tiny.cloud/docs/advanced/keyboard-shortcuts/
            var shortcuts = {
                bold: 'ctrl+b',
                italic: 'ctrl+i',
                underline: 'ctrl+u',
                link: 'ctrl+k',
            };

            // ctrl+h
            editor.addShortcut('ctrl+72', 'Insert superscript.', function () {
                editor.execCommand('Superscript');
            });
            // ctrl+l
            editor.addShortcut('ctrl+76', 'Insert subscript.', function () {
                editor.execCommand('Subscript');
            });
            // ctrl+shift+s
            shortcuts['strikethrough'] = 'ctrl+shift+s';
            editor.addShortcut('ctrl+shift+83', 'Strikethrough the text.', function () {
                editor.execCommand('Strikethrough');
            });
            // ctrl+shift+x
            shortcuts['codesample'] = 'ctrl+shift+x';
            editor.addShortcut('ctrl+shift+88', 'Insert code fragment.', function () {
                editor.execCommand('CodeSample');
            });
            // ctrl+q
            shortcuts['blockquote'] = 'ctrl+q';
            editor.addShortcut('ctrl+81', 'Insert block quote.', function () {
                editor.execCommand('mceBlockQuote');
            });
            // ctrl+.
            shortcuts['numlist'] = 'ctrl+.';
            editor.addShortcut('ctrl+190', 'Insert ordered list.', function () {
                editor.execCommand('InsertOrderedList');
            });
            // ctrl+/
            shortcuts['bullist'] = 'ctrl+/';
            editor.addShortcut('ctrl+191', 'Insert unordered list.', function () {
                editor.execCommand('InsertUnorderedList');
            });
            // ctrl+[
            shortcuts['outdent'] = 'ctrl+[';
            editor.addShortcut('ctrl+160', 'Outdent the current selection.', function () {
                editor.execCommand('Outdent');
            });
            // ctrl+]
            shortcuts['indent'] = 'ctrl+]';
            editor.addShortcut('ctrl+221', 'Indent the current selection.', function () {
                editor.execCommand('Indent');
            });
            // ctrl+\
            shortcuts['removeformat'] = 'ctrl+\\';
            editor.addShortcut('ctrl+220', 'Remove formatting from the current selection.', function () {
                editor.execCommand('RemoveFormat');
            });
            // ctrl+alt+0
            editor.addShortcut('ctrl+alt+48', 'Insert a paragraph.', function () {
                editor.execCommand('FormatBlock', false, 'p');
            });
            // ctrl+alt+1
            editor.addShortcut('ctrl+alt+49', 'Insert header 1.', function () {
                editor.execCommand('FormatBlock', false, 'h1');
            });
            // ctrl+alt+2
            editor.addShortcut('ctrl+alt+50', 'Insert header 2.', function () {
                editor.execCommand('FormatBlock', false, 'h2');
            });
            // ctrl+alt+3
            editor.addShortcut('ctrl+alt+51', 'Insert header 3.', function () {
                editor.execCommand('FormatBlock', false, 'h3');
            });
            // ctrl+alt+4
            editor.addShortcut('ctrl+alt+52', 'Insert header 4.', function () {
                editor.execCommand('FormatBlock', false, 'h4');
            });
            // ctrl+alt+5
            editor.addShortcut('ctrl+alt+53', 'Insert header 5.', function () {
                editor.execCommand('FormatBlock', false, 'h5');
            });
            // ctrl+alt+6
            editor.addShortcut('ctrl+alt+54', 'Insert header 6.', function () {
                editor.execCommand('FormatBlock', false, 'h6');
            });
            // ctrl+shift+1
            shortcuts['cannedresponses'] = 'ctrl+shift+1';
            editor.addShortcut('ctrl+shift+49', 'Insert a canned response.', function () {
                editor.execCommand('mceCannedResponses');
            });
            // ctrl+shift+2
            shortcuts['selfservice'] = 'ctrl+shift+2';
            editor.addShortcut('ctrl+shift+50', 'Insert a self-service article.', function () {
                editor.execCommand('mceSelfService');
            });

            // Add shortcuts to tooltips.
            editor.on('PreInit', function () {
                $.each(shortcuts, function(btnName, shortcut) {
                    if (! editor.ui.registry.getAll().buttons.hasOwnProperty(btnName)) {
                        return;
                    }

                    // translations seem to occur sometime after PreInit...
                    var tooltip = editor.ui.registry.getAll().buttons[btnName].tooltip;
                    editor.ui.registry.getAll().buttons[btnName].tooltip
                        = tinymce.util.I18n.translate(tooltip) + " (" + shortcut + ")";
                });
            });
        }
    };

    function addShortcutToButtonTooltip(editor, btnName, shortcut)
    {
        if (! editor.ui.registry.getAll().buttons.hasOwnProperty(btnName)) {
            return;
        }

        editor.ui.registry.getAll().buttons[btnName].tooltip += " (" + shortcut + ")";
    }

    function cssToString(obj)
    {
        return Object.entries(obj).reduce((str, [p, val]) => {
            return `${str}${p}: ${val};\n`;
        }, '');
    }
})(jQuery);
