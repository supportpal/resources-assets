;(function (global, window, App, PNotify, $)
{
    'use strict';

    var DISABLED = 0,
        IN_BROWSER = 1,
        IN_DESKTOP = 2;

    var options = {
        type: DISABLED,
        icon: null,
    }

    // Echo instance.
    var instance

    function Notifications() {}

    /**
     * Configure the notifications instance.
     *
     * @param broadcaster
     * @param userId
     */
    Notifications.configure = function (broadcaster, userId) {
        instance = broadcaster

        Notifications
            .connector()
            .private('App.Modules.User.Models.User.' + userId)
            .notification(function (data) {
                Notifications.showNotification(data.title, data.text, data.route)
            });
    }

    /**
     * Return the broadcaster instance.
     *
     * @return {Echo}
     */
    Notifications.connector = function () {
        if (! instance) {
            throw new Error('Instance has not been initialised. Call configure().')
        }

        return instance;
    }

    /**
     * Set whether notifications should show in browser, desktop or not at all.
     *
     * @param {string} type
     * @return {this}
     */
    Notifications.setType = function (type) {
        options.type = parseInt(type);

        return this
    }

    Notifications.getType = function () {
        return options.type
    }

    /**
     * Set the icon to use for desktop notifications.
     *
     * @param {string} icon
     * @return {this}
     */
    Notifications.setDesktopIcon = function (icon) {
        options.icon = icon;

        return this
    }

    /**
     * Get the icon to use for desktop notifications
     *
     * @return {?string}
     */
    Notifications.getDesktopIcon = function () {
        return options.icon
    }

    /**
     * Set the user a notification.
     *
     * @param {string} title
     * @param {string} text
     * @param {string} route
     */
    Notifications.showNotification = function (title, text, route) {
        switch (Notifications.getType()) {
            case IN_BROWSER:
                return Notifications.showBrowserNotification(title, text)

            case IN_DESKTOP:
                return Notifications.showDesktopNotification(title, text, route)

            default:
                return
        }
    }

    /**
     * Show a browser notification.
     *
     * @param {string} title
     * @param {string} text
     */
    Notifications.showBrowserNotification = function (title, text) {
        PNotify.defaults.icons = 'fontawesome5';
        PNotify.notice({
            title: title,
            titleTrusted: true,
            text: text,
            textTrusted: true,
            addClass: 'stack-bottomright warning',
            icon: "fas fa-bell",
            modules: {
                Buttons: {
                    closerHover: false,
                    labels: {close: ''},
                    sticker: false,
                    stickerHover: false
                }
            },
            shadow: false,
            stack: {
                dir1: 'up', dir2: 'left',       // Position from the bottom right corner.
                firstpos1: 16, firstpos2: 16,   // 16px from the bottom, 16px from the right.
                spacing1: 16, spacing2: 16,     // 16px from the last one.
                push: 'top',                    // Put new notifications above old.
            },
        });
    };

    /**
     * Show a desktop notification.
     *
     * @param {string} title
     * @param {string} text
     * @param {string=} route
     */
    Notifications.showDesktopNotification = function (title, text, route) {
        // Request permission for the browser to display notifications (a popup will show up).
        PNotify.modules.Desktop.permission();

        PNotify.notice({
            title: title,
            text: $('<p>' + text + '</p>').text(),
            modules: {
                Desktop: {
                    desktop: true,
                    icon: Notifications.getDesktopIcon(),
                    tag: text,
                    fallback: false
                }
            }
        }).on('click', function(e) {
            if ($('.ui-pnotify-closer, .ui-pnotify-sticker, .ui-pnotify-closer *, .ui-pnotify-sticker *').is(e.target)) {
                return;
            }

            // Open the link if one is provided
            if (typeof route !== 'undefined') {
                window.open(route, '_blank');
            }
        });
    };

    App.extend('Notifications', Notifications)

})(this, window, App, PNotify, jQuery);
