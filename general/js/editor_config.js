(function($)
{
    'use strict';

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
     * The callback function for imageUploadErrorCallback in the imagemanager.js
     * redactor plugin.
     *
     * @param json
     */
    function embed_image_callback(json)
    {
        var message = json.message;
        if (typeof message !== 'string' || message.length === 0 || ! message.trim()) {
            message = Lang.get('messages.error_embed_image');
        }

        Swal.fire({
            title: Lang.get('messages.error'),
            html: message,
            icon: 'error'
        });
    }

    /**
     * Callback function to handle changes to redactor.
     *
     * @param e Event object
     */
    function isValidCallback(e)
    {
        var textarea = this.element.getElement().get(),
            $form     = $(textarea).parents('form.validate'),
            validator = $form.data('validator');

        // jquery-validation hasn't been initialised on this form.
        if (! validator) {
            return;
        }

        // 8  = back space
        // 46 = forward backspace or delete
        if (typeof e.keyCode !== 'undefined' && e.keyCode != 8 && e.keyCode != 46) {
            // Wait 1 second for the user to stop typing before checking if the textarea contents is valid. Otherwise
            // if jquery.validate is using remote (AJAX) rules then this can fire an AJAX for every single key press.
            // The element function will only validate this single element rather than whole form.
            delay(function () {
                validator.element(textarea);
            }, 1000);
        }
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

    // Redactor (WYSIWYG editor) global options.
    $R.options = {
        // View source settings.
        source: {
            // Enable codemirror
            codemirror: CodeMirror.options
        },

        // Disable default redactor styling.
        styles: false,

        // Toolbar settings.
        toolbarFixed: false, // This is implemented for the operator panel in CSS instead.

        // Height settings.
        minHeight: '150px',

        // Formatting settings.
        breakline: false, // Use <p> instead of <br>.
                          // breakline mode is very buggy. We do not recommend to turn this on.

        // Disable formatting shortcodes.
        shortcodes: false,

        // Shortcuts.
        shortcuts: {
            'ctrl+b, meta+b': { api: 'module.inline.format', args: 'b' },
            'ctrl+i, meta+i': { api: 'module.inline.format', args: 'i' },
            'ctrl+u, meta+u': { api: 'module.inline.format', args: 'u' },
            'ctrl+h, meta+h': { api: 'module.inline.format', args: 'sup' },
            'ctrl+l, meta+l': { api: 'module.inline.format', args: 'sub' },
            'ctrl+shift+s, meta+shift+s': { api: 'module.inline.format', args: 'del' },
            'ctrl+shift+x, meta+shift+x': { api: 'module.block.format', args: {tag: 'pre'} },
            'ctrl+q, meta+q': { api: 'module.block.format', args: {tag: 'blockquote'} },
            'ctrl+., meta+.': { api: 'module.list.toggle', args: 'ol' },
            'ctrl+/, meta+/': { api: 'module.list.toggle', args: 'ul' },
            // Redactor has META+[ and META+] shortcuts hardcoded. Presence of them here results
            // in a bug where pressing META (CMD) triggers module.list.outdent
            'ctrl+[': { api: 'module.list.outdent' },
            'ctrl+]': { api: 'module.list.indent' },
            'ctrl+k, meta+k': { api: 'module.link.open' },
            'ctrl+\\, meta+\\': { api: 'plugin.sp-fontformat.clearformat' },
            'ctrl+alt+0, meta+alt+0': { api: 'plugin.sp-fontsize.set', args: {tag: 'p'} },
            'ctrl+alt+1, meta+alt+1': { api: 'plugin.sp-fontsize.set', args: {tag: 'h1'} },
            'ctrl+alt+2, meta+alt+2': { api: 'plugin.sp-fontsize.set', args: {tag: 'h2'} },
            'ctrl+alt+3, meta+alt+3': { api: 'plugin.sp-fontsize.set', args: {tag: 'h3'} },
            'ctrl+alt+4, meta+alt+4': { api: 'plugin.sp-fontsize.set', args: {tag: 'h4'} },
            'ctrl+alt+5, meta+alt+5': { api: 'plugin.sp-fontsize.set', args: {tag: 'h5'} },
            'ctrl+alt+6, meta+alt+6': { api: 'plugin.sp-fontsize.set', args: {tag: 'h6'} },
            'ctrl+shift+1, meta+shift+1': { api: 'plugin.sp-cannedresponses.show' },
            'ctrl+shift+2, meta+shift+2': { api: 'plugin.sp-selfservice.show' }
        },

        // Paste settings.
        pastePlainText: false, // Don't convert pasted HTML into plain/text.
        pasteLinkTarget: '_blank', // Open pasted links in a new tab (consistent with link settings below).

        // Link settings.
        linkSize: 255, // Truncate link text longer than this size.
        linkNewTab: true, // Show the 'Open Link in New Tab' checkbox in the Link modal.
        linkTarget: '_blank', // Pre-check the 'Open Link in New Tab' checkbox.

        // Image settings.
        imageFigure: false,
        imageResizable: true,
        imageUpload: laroute.route('core.embed.image'),
        imageData: {
            "_token": $('meta[name=csrf_token]').prop('content')
        },

        // Event callbacks.
        callbacks: {
            image: {
                uploadError: embed_image_callback
            },
            keyup: isValidCallback
        },

        // SupportPal specific plugins to alter look-and-feel.
        buttons: ['html', 'sp-fontsize', 'bold', 'sp-fontformat', 'sp-lists', 'sp-link', 'sp-image'],

        // After each defined button a group separator icon will be inserted.
        groups: ['html', 'sp-fontformat'],

        plugins: [
            'sp-fontsize', 'sp-fontformat', 'sp-lists', 'imagemanager', 'sp-link',
            // Load these last (order matters).
            'sp-fontawesome', 'sp-tooltips', 'sp-group',
        ],
    };
})(jQuery);
