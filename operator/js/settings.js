$(function() {
    $('#smtp')
        // Get OAuth Access Token.
        .on('click', '.get-access-token, .reset-access-token', function () {
            var $form = $(this).parents('.sp-tab-content'),
                defaultBrandId = $form.parents('form').find(':input[name="default_brand"]').val(),
                brandId = $form.find(':input[name="brand_id"]').val() || defaultBrandId;

            var options = {
                provider: $form.find('select[name="smtp_provider"]').val(),
                action: 'smtp',
                address: $form.find('input[name="smtp_username"]').val(),
                brandId: brandId,
                authMech: $form.find('select[name="smtp_auth_mech"]').val(),
                $oauthData: $form.find('input[name="smtp_oauth_data"]'),
            };
            $form.oauth(options)
                .done(function () {
                    $form.find('.get-access-token').hide();
                    $form.find('.reset-access-token').show();
                });
        })
        // Validate SMTP authentication.
        .on('click', '.validate-smtp', function () {
            var $smtp = $(this).parents('#smtp');

            // Show in progress
            $('.validate-auth').hide();
            $('.validate-auth.text-progress').show();

            var data = $smtp.find(':input').serializeArray();

            // Post SMTP data
            $.post(laroute.route('core.operator.generalsetting.validatesmtp'), data)
                .then(function () {
                    $('.validate-auth.text-success').show();
                })
                .catch(function (error) {
                    $('.validate-auth .error-message').text(error.responseJSON.message || '');
                    $('.validate-auth.text-fail').show();
                })
                .always(function () {
                    $('.validate-auth.text-progress').hide();
                });
        });

    $('select[name="smtp_auth_mech"]').on('change', function () {
        $(this).parents('form').find('.password-form, .oauth-form').toggleClass('sp-hidden');
    });

    // On page load, if the radio is checked, show the sections...
    if ($('input[name="email_method"][value="smtp"]').is(":checked")) {
        $('#smtp').show();
    }
    if ($('input[name="smtp_requires_auth"][value="1"]').is(":checked")) {
        $('#smtp_auth').show();
    }
    if ($('input[name="captcha_type"][value="2"]').is(":checked")
        || $('input[name="captcha_type"][value="3"]').is(":checked")
    ) {
        $('.recaptcha').show();
    }
});

/**
 * SSL Warning.
 *
 * @param parameters
 * @constructor
 */
function SslWarning(parameters)
{
    "use strict";

    // Make sure the required parameters exist.
    if (! parameters.hasOwnProperty('route')) {
        throw Error('InvalidArgumentException. Missing argument: \'route\'.');
    }

    /**
     * Brand URL.
     *
     * @type {string}
     */
    var brand_route = parameters.route;

    /**
     * Current instance.
     *
     * @type {SslWarning}
     */
    var instance = this;

    /**
     * Set brand route.
     *
     * @param route
     */
    this.setRoute = function (route)
    {
        brand_route = route;
    };

    /**
     * Get brand route.
     *
     * @returns {string}
     */
    this.getRoute = function ()
    {
        return brand_route;
    };

    /**
     * Get the SSL route (replace http:// with https://)
     *
     * @returns {string}
     */
    this.getSslRoute = function ()
    {
        return brand_route.replace('http://', 'https://');
    };

    /**
     * Register the modal.
     */
    this.init = function () {
        // Show warning on enabling SSL
        var currentSSLValue = $('input[name="enable_ssl"]:checked').val();
        $('input[name="enable_ssl"]').on('change', function() {
            var self = this,
                type = $(self).attr('type'),
                value = $('input[name="enable_ssl"]:checked').val();

            if (value == 1) {
                Swal.fire({
                    title: Lang.get('messages.does_look_correct'),
                    html: '<div class="sp-alert sp-alert-warning">' + Lang.get('core.enable_ssl_warning') + '</div>'
                        + Lang.get('core.verify_frontend_loads') + '<br /><br />'
                        + '<iframe style="width: 100%;" src="' + instance.getSslRoute() + '"></iframe>',
                    icon: "warning",
                    showCancelButton: true,
                    confirmButtonColor: "#e74c3c",
                    confirmButtonText: Lang.get('messages.no_revert'),
                    cancelButtonText: Lang.get('general.yes'),
                    allowOutsideClick: false
                }).then(function (result) {
                    if (result.value) {
                        if (type == 'checkbox') {
                            $(self).prop('checked', false);
                        } else {
                            $('input[name="enable_ssl"]').val([currentSSLValue]);
                        }
                    }
                });
            } else {
                // Set another value, update the current value
                currentSSLValue = value;
            }
        });
    };
}
