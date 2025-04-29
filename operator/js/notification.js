;
(function (global, window, App, PNotify, PNotifyDesktop, $, document) {
  'use strict';

  var DISABLED = 0,
    IN_APP = 1,
    DESKTOP = 2;
  var options = {
    type: DISABLED,
    icon: null
  };

  // Echo instance.
  var instance;

  // Stack for PNotify browser notifications.
  var pNotifyStack = new PNotify.Stack({
    dir1: 'up',
    dir2: 'left',
    // Position from the bottom right corner.
    firstpos1: 16,
    firstpos2: 16,
    // 16px from the bottom, 16px from the right.
    spacing1: 16,
    spacing2: 16,
    // 16px from the last one.
    push: 'top',
    // Put new notifications above old.
    maxOpen: 3,
    maxStrategy: 'wait',
    modal: false,
    context: document.body
  });
  function Notifications() {}
  function uuid() {
    return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c => (+c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> +c / 4).toString(16));
  }

  /**
   * Configure the notifications instance.
   *
   * @param broadcaster
   * @param userId
   */
  Notifications.configure = function (broadcaster, userId) {
    instance = broadcaster;
    Notifications.connector().private('App.Modules.User.Models.User.' + userId).notification(function (data) {
      Notifications.showNotification(data.uuid, data.title, data.text, data.route);
    });
    document.addEventListener('pollcast:request-error', function (e) {
      void 0;
      if (e.detail.status === 419) {
        void 0;
        Notifications.connector().disconnect();
      }
    });
  };

  /**
   * Return the broadcaster instance.
   *
   * @return {Echo}
   */
  Notifications.connector = function () {
    if (!instance) {
      throw new Error('Instance has not been initialised. Call configure().');
    }
    return instance;
  };

  /**
   * Set whether notifications should show in browser, desktop or not at all.
   *
   * @param {string} type
   * @return {this}
   */
  Notifications.setType = function (type) {
    options.type = parseInt(type);
    return this;
  };
  Notifications.getType = function () {
    return options.type;
  };

  /**
   * Set the icon to use for desktop notifications.
   *
   * @param {string} icon
   * @return {this}
   */
  Notifications.setDesktopIcon = function (icon) {
    options.icon = icon;
    return this;
  };

  /**
   * Get the icon to use for desktop notifications
   *
   * @return {?string}
   */
  Notifications.getDesktopIcon = function () {
    return options.icon;
  };

  /**
   * Set the user a notification.
   *
   * @param {string} uuid
   * @param {string} title
   * @param {string} text
   * @param {string} route
   */
  Notifications.showNotification = function (uuid, title, text, route) {
    switch (Notifications.getType()) {
      case IN_APP:
        return Notifications.showInAppNotification(title, text);
      case DESKTOP:
        return Notifications.showDesktopNotification(uuid, title, text, route);
      default:
        return;
    }
  };

  /**
   * Show an in-app notification.
   *
   * @param {string} title
   * @param {string} text
   */
  Notifications.showInAppNotification = function (title, text) {
    PNotify.alert({
      title: title,
      titleTrusted: true,
      text: text,
      textTrusted: true,
      closerHover: false,
      sticker: false,
      styling: 'supportpal',
      icon: 'fas fa-bell',
      icons: {
        closer: 'fas fa-times'
      },
      stack: pNotifyStack
    });
  };

  /**
   * Show a desktop notification.
   *
   * @param {string} uuid
   * @param {string} title
   * @param {string} text
   * @param {string=} route
   */
  Notifications.showDesktopNotification = function (uuid, title, text, route) {
    // Request permission for the browser to display notifications (a popup will show up).
    PNotifyDesktop.permission();
    var notice = PNotify.notice({
      title: title,
      text: $('<p>' + text + '</p>').text(),
      modules: new Map([[PNotifyDesktop, {
        icon: Notifications.getDesktopIcon(),
        tag: uuid,
        fallback: false
      }]])
    });
    notice.on('click', function (e) {
      if ($('.ui-pnotify-closer, .ui-pnotify-sticker, .ui-pnotify-closer *, .ui-pnotify-sticker *').is(e.target)) {
        return;
      }

      // Open the link if one is provided
      if (typeof route !== 'undefined') {
        window.open(route, '_blank');
      }
    });
  };
  Notifications.registerPreviewHandlers = function () {
    // Show example in-app notification
    $('.preview-in-app-notification').on('click', function () {
      Notifications.showInAppNotification(Lang.get('notification.new_ticket'), Lang.get('notification.new_ticket_text', {
        'item': '<a href="#">' + Math.floor(100000 + Math.random() * 900000) + '</a>',
        'name': 'Joe Bloggs'
      }));
    });

    // Show example desktop notification
    $('.preview-desktop-notification').on('click', function () {
      Notifications.showDesktopNotification(uuid(), Lang.get('notification.new_ticket'), Lang.get('notification.new_ticket_text', {
        'item': Math.floor(100000 + Math.random() * 900000),
        'name': 'Joe Bloggs'
      }));
    });
  };
  App.extend('Notifications', Notifications);
})(this, window, App, PNotify, PNotifyDesktop, jQuery, document);