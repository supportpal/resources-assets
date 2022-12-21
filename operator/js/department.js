jQuery(function($){

    // If there was an error and they had selected that this department
    // is a child of another then we need to toggle the field to hide
    // all the necessary DOM elements
    if ($('select[name=parent]').val() != '0') {
        $('.parentToggle').hide();
    }

    /**
     * Department parents.
     */
    var xhr;
    var $parent = $('select[name=parent]').selectize({
        plugins: ['disableDelete'],
        valueField: 'id',
        labelField: 'name',
        searchField: 'name',
        placeholder: Lang.get('ticket.select_a_parent'),
        onChange: function (value) {
            // Toggle sections if the department is a subdepartment.
            value != '0' ? $('.parentToggle').hide() : $('.parentToggle').show();
        }
    });

    // If there's no options, disable the dropdown.
    if (! Object.keys($parent[0].selectize.options).length) {
        $parent[0].selectize.disable();
    }

    /**
     * Department brands.
     */
    $('select[name="brand[]"]').selectize({
        plugins: ['remove_button'],
        delimiter: ',',
        persist: false,
        dropdownParent: 'body',
        placeholder: Lang.get('core.select_brand'),
        render: {
            item: function(item, escape) {
                return '<div class="item" data-name="'+escape(item.text)+'">' + escape(item.text) + '</div>';
            }
        },
        onChange: function (values) {
            // Get the parent departments that are associated with this brand.
            var selectize = $parent[0].selectize,
                selected_item = selectize.getValue();
            selectize.disable();

            // Remove all options except for "None".
            var options = selectize.options;
            for (var key in options) {
                if (! options.hasOwnProperty(key)) continue;

                if (options[key].id != 0) {
                    selectize.removeOption(options[key].id, true);
                }
            }

            // Load the parents that belong to these brands via AJAX.
            selectize.load(function(callback) {
                xhr && xhr.abort();
                xhr = $.ajax({
                    url: laroute.route(
                        'ticket.operator.department.parents',
                        { 'department': $('#departmentForm').data('id'), 'brands': values }
                    ),
                    success: function(res) {
                        selectize.enable();
                        callback(res.data);

                        // Try to set existing value
                        selectize.setValue(selected_item, false);

                        // If that option wasn't available and it wasn't None, set it to None now.
                        if (selected_item != 0 && selectize.getValue() == '') {
                            selectize.setValue(0, false);
                        }
                    },
                    error: function() {
                        callback();
                    }
                })
            });

            // Synchronise with the email brand drop-downs.
            updateEmailBrands(this, values);
        }
    });

    initBrandDropdown('select[name$="[brand_id]"]:not([name^="emails[]"])');
    $('input[name$="[address]"]').donetyping();

    /**
     * Department groups.
     */
    var $dept_groups = $('select[name="group[]"]');
    $dept_groups.selectize({
        plugins: ['remove_button'],
        valueField: 'id',
        labelField: 'name',
        searchField: 'name',
        create: false,
        maxItems: null,
        placeholder: Lang.get('user.select_groups'),
        render: {
            item: function(item, escape) {
                return '<div class="item">'
                    + '<i class="fas fa-circle" style="color: ' + escape(item.colour) + ';"></i> &nbsp;'
                    + escape(item.name)
                    + '</div>';
            },
            option: function(item, escape) {
                return '<div>'
                    + '<i class="fas fa-circle" style="color: ' + escape(item.colour) + ';"></i> &nbsp;'
                    + escape(item.name)
                    + '</div>';
            }
        },
        onChange: function (values) {
            updateDefaultAssignedTo(da_xhr, $default_assigned, values, $dept_operators[0].selectize.getValue());
        }
    });

    /**
     * Department operators.
     */
    var $dept_operators = $('select[name="dept_operators[]"]');
    $dept_operators.selectize({
         plugins: ['remove_button'],
         valueField: 'id',
         labelField: 'formatted_name',
         searchField: 'formatted_name',
         create: false,
         maxItems: null,
         placeholder: Lang.get('user.select_operators'),
         render: {
             item: function(item, escape) {
                 return '<div class="item">'
                     + '<img class="sp-avatar sp-max-w-3xs" src="' + escape(item.avatar_url) + '" />&nbsp; '
                     + escape(item.formatted_name)
                     + '</div>';
             },
             option: function(item, escape) {
                 return '<div>'
                     + '<img class="sp-avatar sp-max-w-2xs" src="' + escape(item.avatar_url) + '" />&nbsp; '
                     + escape(item.formatted_name)
                     + '</div>';
             }
         },
         onChange: function (values) {
             updateDefaultAssignedTo(da_xhr, $default_assigned, $dept_groups[0].selectize.getValue(), values);
         }
    });

    var da_xhr;
    var $default_assigned = $('select[name="default_assignedto[]"]').selectize({
        plugins: ['remove_button'],
        valueField: 'id',
        labelField: 'formatted_name',
        searchField: 'formatted_name',
        create: false,
        maxItems: null,
        render: {
            item: function(item, escape) {
                return '<div class="item">'
                    + '<img class="sp-avatar sp-max-w-3xs" src="' + escape(item.avatar_url) + '" />&nbsp; '
                    + escape(item.formatted_name)
                    + '</div>';
            },
            option: function(item, escape) {
                return '<div>'
                    + '<img class="sp-avatar sp-max-w-2xs" src="' + escape(item.avatar_url) + '" />&nbsp; '
                    + escape(item.formatted_name)
                    + '</div>';
            }
        }
    });

    /**
     * Add a new e-mail address to the department form
     */
    $('.add-email').on('click', function() {
        addNewEmail();
    });

    /**
     * Remove an e-mail address from the DOM
     */
    $('#emailAccounts').on('click', '.remove-button', function() {
        $(this).parents('.departmentEmail').remove();

        // If it was the last one, add an empty form back in
        if ($('.departmentEmail').length == 1) {
            addNewEmail();
        }
    });

    $(".departmentEmail:first :input").prop('disabled', true);

    /**
     * Toggle sections depending on email support type
     */
    $('#emailAccounts').on('change', '.email-support', function() {
        var $email = $(this).parents('.departmentEmail');

        if ($(this).val() == '0') {
            $email.find('.email-download, .email-piping, .remote-piping')
                .hide()
                .find(':input').prop('disabled', true);
        } else if ($(this).val() == '1') {
            $email.find('.email-download').show().find(':input').prop('disabled', false);
            $email.find('.email-piping, .remote-piping')
                .hide()
                .find(':input').prop('disabled', true);

            // If a new email address and switching from a different type, trigger the auto configure.
            if (! $email.find('div.sp-configure-email').is(':visible')) {
                $email.find('input[name$="[address]"]').trigger('donetyping');
            }
        } else if ($(this).val() == '2') {
            $email.find('.email-download, .remote-piping')
                .hide()
                .find(':input').prop('disabled', true);
            $email.find('.email-piping').show().find(':input').prop('disabled', false);
        } else if ($(this).val() == '3') {
            $email.find('.email-download, .email-piping')
                .hide()
                .find(':input').prop('disabled', true);;
            $email.find('.remote-piping').show().find(':input').prop('disabled', false);
        }
    });
    $('.email-support').each(function() {
        $(this).trigger('change');
    });

    $('#emailAccounts')
        // Handle hiding delete downloaded option when POP3 is selected
        .on('change', '.email-protocol select', function() {
            if ($(this).val() == 0) {
                $(this).parents('.email-download').find('.delete-downloaded').removeClass('sp-hidden');
            } else {
                $(this).parents('.email-download').find('.delete-downloaded').addClass('sp-hidden');
            }
        })
        // Show manual config options and hide button.
        .on('click', '.sp-configure-email-button button', function () {
            $(this).parents('.email-download').find('div.sp-configure-email').removeClass('sp-hidden');
            $(this).parent('div.sp-configure-email-button').remove();
        })
        // Get / Reset Access Token
        .on('click', '.get-access-token, .reset-access-token', function () {
            var $email = $(this).parents('.departmentEmail');

            var options = {
                provider: getProvider($email),
                action: 'departmentemail',
                address: $email.find('input[name$="[address]"]').val(),
                brandId: $email.find(':input[name$="[brand_id]"]').val(),
                authMech: $email.find('select[name$="[auth_mech]"]').val(),
                $oauthData: $email.find('input[name$="[oauth_data]"]'),
            };
            $email.oauth(options)
                .done(function () {
                    $email.find('.get-access-token').hide();
                    $email.find('.reset-access-token').show();
                });
        })
        // Validate email download details
        .on('click', '.validate-email', function () {
            var $email = $(this).parents('.departmentEmail'),
                $parent = $(this).parent();

            $parent.find('.validate-auth').hide();
            $parent.find('.validate-auth.text-progress').show();

            var data = $email.find(':input').serializeArray().map(function (value, key) {
                value.name = value.name.replace(/.*\[(\w+)]/mg, '$1');

                return value;
            });

            validateEmail(data, $parent);
        })
        // Handle appending --address to piping command when using consume all.
        .on('change', '.email-piping input[name$="[consume_all]"]', function () {
            setPipingPath(this);
        })
        // Auto configure the email download server details.
        .on('donetyping', 'input[name$="[address]"]', function () {
            var $email = $(this).parents('.departmentEmail');

            // Only run if we haven't already clicked set up manually or an existing email account.
            if ($email.find('div.sp-configure-email').is(':visible')) {
                return;
            }

            // Ensure email download is selected.
            if ($email.find('select[name$="[type]"]').val() === "1") {
                autoConfigure($email);
            }
        })
        // Handle authentication mechanisms.
        .on('change', 'select[name$="[auth_mech]"]', function () {
            var $email = $(this).parents('.departmentEmail'),
                isOAuth = $(this).val() == 'oauth';

            $email.find(isOAuth ? '.password-form' : '.oauth-form').addClass('sp-hidden');
            $email.find(isOAuth ? '.oauth-form' : '.password-form').removeClass('sp-hidden');

            // If OAuth, disable the POP3 option and select IMAP.
            $email.find('select[name$="[protocol]"] option[value=1]').prop('disabled', isOAuth);
            if (isOAuth) {
                $email.find('select[name$="[protocol]"]').val(0);
            }
        });

    // Run auth mechanism change code when page loads (to disable POP3 on OAuth emails).
    $('#emailAccounts').find('select[name$="[auth_mech]"]').trigger('change');

    // Handle consume all already checked when the page loads.
    $('.email-piping').find('input[name$="[consume_all]"]').each(function () {
         setPipingPath(this);
    });

    // Handle Disable User Replies.
    $('input[name="disable_user_email_replies"]').on('change', function () {
        $('#disableRepliesTemplate').toggleClass('sp-hidden');
    });

    // Handle Registered Users Only.
    $('input[name="registered_only"]').on('change', function () {
        $('#registeredOnlyTemplate').toggleClass('sp-hidden');
    });

    // Convert email template dropdowns to use selectize.
    $('.department-templates').find('select').selectize({
        plugins: ['disableDelete']
    });

    /**
     * Auto-configure the given email address.
     *
     * @param $email
     */
    function autoConfigure($email)
    {
        var address = $email.find('input[name$="[address]"]').val();

        // Set username to be equal to address.
        $email.find('input[name$="[username]"]').val(address);

        // Extract the domain portion of the email address.
        var domain = emailDomain(address);

        // If domain empty, set all values to defaults.
        if (domain === '') {
            configureDefault($email);
            return;
        }

        // Lookup on Mozilla ISP database.
        $.get("https://autoconfig.thunderbird.net/v1.1/" + domain)
            .then(function (data, textStatus, jqXHR) {
                if (jqXHR.status === 404) {
                    throw new Error;
                }

                var $xml = $(data),
                    $imap = $xml.find('incomingServer[type="imap"]'),
                    $pop3 = $xml.find('incomingServer[type="pop3"]');

                if ($imap.length) {
                    configure($email, $imap, 0);
                } else if ($pop3.length) {
                    configure($email, $pop3, 1);
                } else {
                    throw new Error;
                }
            })
            .catch(function () {
                // Error - reset to default and require manual set up.
                configureDefault($email);
                $email.find('.sp-configure-email-button button').click();
            });
    }

    /**
     * Set the input fields based on the XML response.
     * See https://wiki.mozilla.org/Thunderbird:Autoconfiguration:ConfigFileFormat
     *
     * @param $email
     * @param $server
     * @param type
     */
    function configure($email, $server, type)
    {
        $email.find('select[name$="[protocol]"]').val(type);

        $email.find('input[name$="[server]"]').val($server.find('hostname').text());
        $email.find('input[name$="[port]"]').val($server.find('port').text());

        //  %EMAILADDRESS% (full email address of the user, usually entered by the user)
        //  %EMAILLOCALPART% (email address, part before @)
        //  %EMAILDOMAIN% (email address, part after @)
        var address = $email.find('input[name$="[address]"]').val();
        switch ($server.find('username').text()) {
            case "%EMAILLOCALPART%":
                address = emailLocalPart(address);
                break;

            case "%EMAILDOMAIN%":
                address = emailLocalPart(address);
                break;
        }
        $email.find('input[name$="[username]"]').val(address);

        // "plain": no encryption
        // "SSL": SSL 3 or TLS 1 on SSL-specific port
        // "STARTTLS": on normal plain port and mandatory upgrade to TLS via STARTTLS
        if ($server.find('socketType').text() !== "plain") {
            $email.find('input[class="sp-toggle"][name$="[encryption]"][value="1"]').prop('checked', true);
        }
    }

    /**
     * Sets the fields to the default values.
     *
     * @param $email
     */
    function configureDefault($email)
    {
        $email.find('select[name$="[protocol]"]').val(0);
        $email.find('input[name$="[server]"], input[name$="[port]"]').val('');
        $email.find('input[class="sp-toggle"][name$="[encryption]"][value="1"]').prop('checked', true);
    }

    /**
     * Get the name part of an email address (everything before the @ symbol).
     *
     * @param address
     * @returns {string}
     */
    function emailLocalPart(address)
    {
        return address.substring(0, address.indexOf("@"));
    }

    /**
     * Get the domain part of an email address.
     *
     * @param address
     * @returns {string}
     */
    function emailDomain(address)
    {
        return address.split('@').pop();
    }

    /**
     * Get OAuth provider.
     *
     * @param $email
     * @returns {string|boolean}
     */
    function getProvider($email)
    {
        var val = $email.find('select[name$="[provider]"]').val();
        if (typeof val === 'undefined' || val === '') {
            return false;
        }

        return val;
    }

    /**
     * Validate incoming email server authentication detail.
     *
     * @param data
     * @param item
     */
    function validateEmail(data, item)
    {
        $.post(laroute.route('ticket.operator.department.validate'), data)
            .then(function (response, textStatus, jqXHR) {
                if (response.status !== 'success') {
                    throw new Error(response.message);
                }

                item.find('.validate-auth.text-progress').hide();
                item.find('.validate-auth.text-success').show();
            })
            .catch(function (error) {
                item.find('.validate-auth.text-progress').hide();
                item.find('.error-message').text(error.message || '');
                item.find('.validate-auth.text-fail').show();

                // If email download, automatically trigger manual set up.
                if (! item.parents('.departmentEmail').find('div.sp-configure-email').is(':visible')) {
                    item.parents('.departmentEmail').find('div.sp-configure-email-button button').trigger('click');
                }
            });
    }
});

/**
 * Add a new department email.
 */
function addNewEmail()
{
    // Clone the DOM.
    var index = addNewItem('.departmentEmail');

    // Initialise the brand drop-down.
    var $selectize = initBrandDropdown('select[name="emails['+index+'][brand_id]"]');

    // Clear the selected values (fix the "fix for firefox" in addNewItem).
    if (typeof $selectize !== 'undefined') {
        $selectize[0].selectize.clear();
    }

    // Register donetyping event.
    $('input[name$="[address]"]').donetyping();
}

/**
 * Initialise the brand drop-down.
 *
 * @param selector
 * @returns {*|jQuery}
 */
function initBrandDropdown(selector)
{
    var $select = $(selector).selectize({
        placeholder: Lang.get('core.select_brand')
    });

    // Make sure the selector exists (the system may only have 1 brand).
    if (! $(selector).length) {
        return;
    }

    // Make sure the department brands exists, before continuing (the system may only have 1 brand).
    var $department_brand = $('select[name="brand[]"]');
    if (! $department_brand.length) {
        return $select;
    }

    var department_selectize = $department_brand[0].selectize,
        selected_brands = department_selectize.getValue() || [];

    // If no department brands have been selected, we want to disable this drop-down.
    if (selected_brands.length == 0) {
        $select[0].selectize.clearOptions();
    } else {
        var options = department_selectize.options;
        for (var key in options) {
            if (! options.hasOwnProperty(key)) {
                continue;
            }

            // If the option is currently selected, add it to the $select dropdown.
            if (selected_brands.indexOf(options[key].value) > -1) {
                $select[0].selectize.addOption({ 'value': options[key].value, 'text': options[key].text });
                $select[0].selectize.refreshOptions(false);
            } else {
                $select[0].selectize.removeOption(options[key].value);
            }
        }
    }

    // If there's no options in the drop-down, disable it.
    if (Object.keys($select[0].selectize.options).length == 0) {
        $select[0].selectize.disable();
    }

    return $select;
}

/**
 * Update the e-mail brand drop-downs depending on the selected department brands.
 *
 * @param context
 * @param values  Array of selected department brands e.g. ["1","5"]
 */
function updateEmailBrands(context, values)
{
    // If there's no selected values, values is null - we change it to an empty array as the rest of the
    // code is expecting an array (e.g. values.length in the loop).
    values = values || [];

    // Get selected options.
    var options = [];
    for (var i = 0; i < values.length; i++) {
        options.push({ 'text': context.getItem(values[i]).data('name'), 'value': values[i] });
    }

    // Update email brands.
    $(document).find('select[name$="[brand_id]"]').each(function (index, item) {
        // Handle normal select box e.g. the element we use for cloning; select[name="emails[][brand_id]"]
        if (typeof item.selectize === 'undefined') {
            $(item).empty();
            $.each(options, function (index, value) {
                $(item).append($('<option>', { value: value.value, text: value.text }));
            });

            return;
        }

        // Get the selectize instance, and it's currently selected item.
        var selectize = item.selectize,
            selected_item = selectize.getValue(),
            last_value;

        // Clear the selectize options.
        selectize.disable();
        selectize.clearOptions();

        // Insert the new selected options.
        $.each(options, function(index, value) {
            // Save last value in case we only have one item
            last_value = value.value;

            // Add option and refresh selectize
            selectize.addOption(value);
            selectize.refreshOptions(false);
        });

        // Select previously selected item.
        selectize.addItem(selected_item, true);

        // Only enable the drop-down if there's more than 1 item available.
        if (Object.keys(selectize.options).length > 0) {
            selectize.enable();

            // If we have one item only, set that
            if (Object.keys(selectize.options).length === 1) {
                selectize.setValue(last_value);
            }
        }
    });
}

/**
 * Update the default assigned to drop down.
 *
 * @param xhr
 * @param $default_assigned
 * @param group_ids
 * @param operator_ids
 */
function updateDefaultAssignedTo(xhr, $default_assigned, group_ids, operator_ids)
{
    var selectize = $default_assigned[0].selectize,
        selected_items = selectize.getValue();

    selectize.disable();

    selectize.load(function(callback) {
        xhr && xhr.abort();
        xhr = $.ajax({
            url: laroute.route(
                'ticket.operator.department.search',
                {
                    id: $('#departmentForm').data('id') || 0,
                    group_ids: group_ids,
                    operator_ids: operator_ids
                }
            ),
            success: function(res) {
                selectize.clearOptions();
                selectize.enable();
                callback(res.data);

                // Select previously selected items.
                $.each(selected_items, function (index, value) {
                    selectize.addItem(value, true);
                });
            },
            error: function() {
                callback();
            }
        })
    });
}

/**
 * Add the consume all address to email piping command.
 *
 * @param context
 */
function setPipingPath(context)
{
    var input = $(context).parents('.email-piping').find('input.pipe_path'),
        address = $(context).parents('.departmentEmail').find('input[name$="[address]"]');

    if ($(context).is(":checked")) {
        input.val(input.val() + ' --address=' + address.val());
    } else {
        input.val(input.val().replace(/--address=.*/, '').trim())
    }
}
