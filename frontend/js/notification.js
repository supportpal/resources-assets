;
(function (global, window, App, $, document) {
  'use strict';

  // Echo instance.
  var instance;
  function Notifications() {}

  /**
   * Configure the notifications instance.
   *
   * @param broadcaster
   * @param userId
   */
  Notifications.configure = function (broadcaster) {
    instance = broadcaster;
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
  App.extend('Notifications', Notifications);
})(this, window, App, jQuery, document);