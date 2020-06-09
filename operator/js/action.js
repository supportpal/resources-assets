$(function () {
    // Show desired value dropdown for given action
    $(document.body).on('change', '.rule-action select', function () {
        initAction($(this));
    });

    // Handle custom field option change
    $(document.body).on('change', '.rule-value .value-id', function () {
        if ($(this).parents('tr').find('.rule-action select').val() == '13') {
            initCustomFields($(this).parents('tr'), $(this).val());
        }

        // flatpickr if needed
        if ($(this).parents('tr').find('.datepicker').is(':visible')) {
            $(this).parents('tr').find('.datepicker').datepicker();
        }
    });

    // Switching between rule times
    $(document.body).on('change', '.rule-when select', function () {
        if ($(this).val() == 1) {
            $(this).prev().show();
        } else {
            $(this).prev().hide();
        }
    });

    // Show value dropdown based on actions set by default
    $('.rule').filter(function () {
        return $(this).css("display") != "none";
    }).find('.rule-action select').each(function () {
        initAction($(this));
    });

    // If we need to show the extra field based on default value
    $('.rule-when select').each(function () {
        if ($(this).val() == 1) {
            $(this).prev().show();
        }
    });

    // Disable the item that is used for copying
    $(".rule:first :input").prop('disabled', true);

    // Show/hide exclude CC option if the email user option is clicked (Add Reply action only)
    $(document).on('click', 'label.email-user', function () {
        $(this).parent().find('label.exclude-cc').toggle($(this).find(':input').is(':checked'));
    });

    // Web hooks.
    $(document).on('click', '.er-wh-toggle-headers', function (e) {
        e.preventDefault();

        $(this).next().toggle();
        $(this).next().find('textarea.codemirror').each(function () {
            codeMirror($(this));
        });
    });
    $(document).on('change', 'select.er-wh-method', function () {
        var $wrapper = $(this).parents('tr').find('.er-wh-content');

        // Only show content for options listed below.
        $wrapper.toggle($.inArray($(this).val(), ['POST','PUT','PATCH']) !== -1);
        $wrapper.find('textarea.codemirror').each(function () {
            codeMirror($(this));
        });
    });
    $(document).on('click', '.test-webhook', function (e) {
        e.preventDefault();

        var route = $(this).data('route'),
            $action = $(this).parents('.action'),
            getCodeMirror = function ($element) {
                if ($element[0].sourcecode) {
                    return $element[0].sourcecode.codemirror().getValue();
                } else if ($element.next('.CodeMirror').length) {
                    // Deprecated (DEV-2447). To be removed in favour of .sourcecode in v4.
                    return $element.next('.CodeMirror')[0].CodeMirror.getValue();
                } else {
                    return '';
                }
            },
            data = {
                headers: getCodeMirror($action.find('textarea[name$="[headers]"]')),
                method: $action.find('select[name$="[method]"]').val(),
                url: $action.find('input[name$="[url]"]').val(),
                content_type: $action.find('select[name$="[content_type]"]').val(),
                content: getCodeMirror($action.find('textarea[name$="[content]"]')),
                ticket_id: typeof ticket !== 'undefined' ? ticket.parameters().ticketId : null
            };

        $action.find('.test-webhook-response')
            .removeClass('text-success sp-text-green-600 text-fail sp-text-red-600')
            .html('<i class="fa fa-spinner fa-pulse fa-fw"></i> ' + Lang.get('general.loading') + '...');

        $.post(route, data)
            .done(function (data) {
                $action.find('.test-webhook-response')
                    .addClass(data.status === 'success' ? 'text-success sp-text-green-600' : 'text-fail sp-text-red-600')
                    .text(data.message);
            })
            .fail(function (jqXHR, textStatus, errorThrown) {
                $action.find('.test-webhook-response')
                    .addClass('text-fail sp-text-red-600')
                    .text(jqXHR.responseText);
            });
    });

    /**
     * Add a new item to the form
     */
    $(document.body).on('click', '.add-rule', function () {
        addNewItem('.rule');

        // Make sure table is visible
        $('.rule-table').removeClass('sp-hidden');

        // Disable and hide fields that are not needed now
        $('.rule:last .rule-value .action:not(:first)').hide()
            .find(':input').prop('disabled', true);

        $('.rule:last .rule-action select').trigger('change');
    });

    /**
     * Remove item from the DOM
     */
    $(document.body).on('click', '.remove-button', function () {
        $(this).parents('tr').remove();

        // Hide table if no actions set
        if (! $('.rule-table tbody tr:visible').length) {
            $('.rule-table').addClass('sp-hidden');
        }
    });

    /**
     * Order rules.
     */
    $("#sortable").sortable({
        draggable: '.rule',
        ghostClass: 'sp-opacity-50',
        handle: '.sp-sortable-handle',
    });

    function redactor(element, plugins)
    {
        // Back out if it's already been initialised.
        if (element.data('init')) {
            return;
        }

        var plugins = plugins || [],
            opts = {
                mergeFields: {
                    tickets: true,
                    organisations: organisationsEnabled
                },
                groups: $R.options.groups.concat(['sp-image']),
                plugins: $R.options.plugins.concat(plugins).concat(['sp-mergefields'])
            };

        // Redactor
        element.redactor(opts);

        // Save that this element has been initialised, as redactor keeps duplicating
        element.data('init', true);
    }

    /**
     * Initialise code mirror instance.
     *
     * @param $element
     */
    function codeMirror($element)
    {
        // Back out if it's already been initialised.
        if ($element.data('init')) {
            return;
        }

        $element.sourcecode({
            toolbar: true,
            mergeFields: {
                tickets: true,
                organisations: organisationsEnabled
            }
        });
        $element.data('init', true);
    }

    /**
     * Initialise the selected action.
     *
     * @param $dropdown
     */
    function initAction($dropdown)
    {
        var $tr = $dropdown.parents('tr'),
            $action = $tr.find('.rule-value .action[data-action="' + $dropdown.val() + '"]');

        // Hide all actions, and then show the "chosen one".
        $tr.find('.rule-value .action').hide().find(':input').prop('disabled', true);
        $action.show().find(':input').prop('disabled', false);

        // Handle custom fields
        if ($dropdown.val() == '13') {
            initCustomFields($tr, $dropdown.parents('tr').find('.value-id').val());
        }

        // flatpickr if needed
        if ($tr.find('.datepicker').is(':visible')) {
            $tr.find('.datepicker').datepicker();
        }

        // If it's a textarea, use redactor
        $action.find('textarea.text').each(function () {
            redactor($(this), $(this).data('plugins'));
        });

        // Initialise visible codemirror instances (we don't initialise on hidden textareas because CodeMirror
        // doesn't render correctly.
        $action.find('textarea.codemirror:visible').each(function () {
            codeMirror($(this));
        });

        // Initialise selectize, we have to do this on a per instance basis as the configuration / events is too complex
        // to do dynamically.
        $action.find('select[name$="[value_text][to][]"], select[name$="[value_text][cc][]"], select[name$="[value_text][bcc][]"]').each(function () {
            $(this).selectize($.extend({ }, emailSelectizeConfig(['restore_on_backspace', 'remove_button']), {
                render: {
                    item: function (item, escape) {
                        return '<div class="item' + (item.unremovable ? ' unremovable' : '') + '">' + escape(item.value) + '</div>';
                    },
                    option: function (item, escape) {
                        return '<div>' +
                            '<img class="sp-avatar sp-max-w-2xs" src="' + escape(item.avatar_url) + '" /> &nbsp;' +
                            escape(item.formatted_name) + (item.organisation ? ' (' + escape(item.organisation || '') + ')' : '') +
                            (item.email ? '<br /><span class="sp-description">' + escape(item.email || '') + '</span>' : '') +
                            '</div>';
                    }
                },
                load: function (query, callback) {
                    if (!query.length) {
                        return callback();
                    }

                    // Search for users
                    $.get(laroute.route('user.operator.search'), { brand_id: typeof ticket !== 'undefined' ? ticket.parameters().brandId : null, q: query })
                        .done(function (res) {
                            res.data = res.data.map(function (value) {
                                // Add needed info for search and selected item to work.
                                value.value = value.email;
                                value.text = value.firstname + ' ' + value.lastname + ' <' + value.email + '>';
                                return value;
                            });

                            callback(res.data);
                        })
                        .fail(function () {
                            callback();
                        });
                }
            }));
        });
    }

    /**
     * Initialise custom fields.
     *
     * @param $tr
     * @param id
     */
    function initCustomFields($tr, id)
    {
        $tr.find('.rule-customfield').addClass('sp-hidden')
            .find(':input').prop('disabled', true);

        $tr.find('.rule-customfield[data-id="' + id + '"]').removeClass('sp-hidden')
            .find(':input').prop('disabled', false);
    }
});
