;(function ($, window, document, undefined)
{
    "use strict";

    /**
     * Constructor.
     *
     * @param element
     * @param parameters
     * @constructor
     */
    function OAuth (element, parameters)
    {
        var $element = $(element);

        // Validate parameters.
        var REQUIRED = ['provider', 'action', 'address', 'brandId', 'authMech', '$oauthData'];
        for (var i = 0; i < REQUIRED.length; i++) {
            if (! parameters.hasOwnProperty(REQUIRED[i])) {
                throw new Error("InvalidArgumentError. " + REQUIRED[i] + " is required to construct an instance.");
            }
        }

        /**
         * Get OAuth URL.
         *
         * @returns {string}
         */
        var getCallbackUrl = function ()
        {
            return laroute.route('core.operator.oauth', {
                'provider': parameters.provider,
                'action': parameters.action,
                'address': parameters.address,
                'brand_id': parameters.brandId
            });
        };

        /**
         * Open OAuth popup window.
         *
         * @returns {Window}
         */
        var openPopup = function ()
        {
            var windowName = "OAuthWindow",
                newForm = document.createElement("form");
            newForm.setAttribute("method", "post");
            newForm.setAttribute("action", getCallbackUrl());
            newForm.setAttribute("target", windowName);

            // Add token to form.
            $element.parents('form').find('input[name="_token"]').clone().appendTo(newForm);

            document.body.appendChild(newForm);

            var child = window.open('', windowName, "width=800, height=600");
            newForm.submit();

            newForm.parentNode.removeChild(newForm);

            return child;
        };

        /**
         * Begin authentication.
         *
         * @returns {jQuery}
         */
        this.start = function ()
        {
            var dfd = $.Deferred(),
                child = openPopup(),
                interval,
                callbackHasRan = false;

            // The popup window will call this callback when it's completed the oAuth flow.
            window.spOAuthCallback = function (data) {
                callbackHasRan = true;
                parameters.$oauthData.val(data);
            };

            interval = setInterval(function () {
                if (child.closed) {
                    clearInterval(interval);

                    ! callbackHasRan ? dfd.reject() : dfd.resolve();
                }
            }, 100);

            return dfd.promise();
        };
    }

    $.fn.oauth = function (options) {
        var oauth = new OAuth($(this)[0], options);

        return oauth.start();
    };
})(jQuery, window, window.document);
