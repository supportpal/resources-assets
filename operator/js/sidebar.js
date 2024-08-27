/**
 * Load the ticket grid sidebar.
 *
 * @type {{refresh}}
 */
var sideBar = function () {
  "use strict";

  var storageName = 'sidebarData',
    storageExpiry = 3600000;
  var initJQueryListeners = function () {
    $('select[name="search_tag"]').selectize({
      valueField: 'id',
      searchField: ['name'],
      load: function (query, callback) {
        if (!query.length) return callback();
        $.get(laroute.route('ticket.operator.tag.search'), {
          q: query
        }).done(function (res) {
          callback(res.data);
        }).fail(function () {
          callback();
        });
      },
      render: {
        option: function (item, escape) {
          return '<div>' + '<i class="fas fa-circle" style="color: ' + escape(item.colour) + '"></i>' + '&nbsp; ' + escape(item.name) + '</div>';
        }
      },
      onChange: function (value) {
        if (value) {
          Swal.showLoading();
          window.location.href = window.location.href.split(/[?#]/)[0] + '?tag=' + value;
          this.clear(true);
        }
      }
    });
  };

  /**
   * Convert string to HTML entities.
   *
   * @param string
   * @returns {*|jQuery}
   */
  var encode = function (string) {
    return $('<div/>').text(string).html();
  };

  /**
   * Update sidebar data.
   *
   * @param data
   */
  var updateSidebar = function (data) {
    // Update counts
    $.each(data.filters, function (key, value) {
      updateCount($('ul.filter-list .sp-badge[data-id="' + key + '"]'), value);
    });
    $.each(data.obj_statuses, function (key, value) {
      updateCount($('ul.status-list .sp-badge[data-id="' + key + '"]'), value);
    });
    $.each(data.obj_departments, function (key, value) {
      updateCount($('ul.department-list .sp-badge[data-id="' + key + '"]'), value);
    });
    $.each(data.obj_brands, function (key, value) {
      updateCount($('ul.brand-list .sp-badge[data-id="' + key + '"]'), value);
    });

    // Update recent activity
    $('ul.recent-activity').empty();
    $.each(data.recentActivity, function (key, value) {
      $("ul.recent-activity").append('<li>' + '<img src="' + value.user.avatar_url + '" alt="' + encode(value.user.formatted_name) + '"' + 'class="sp-avatar sp-max-w-xs" /> <strong>' + encode(value.user.formatted_name) + '</strong><br />' + value.event + '<div class="sp-description">' + value.created_at + '</div>' + '</li>');
    });
    if ($('ul.recent-activity li').length == 0) {
      $('ul.recent-activity').parent().addClass('sp-hidden');
    } else {
      $('ul.recent-activity').parent().removeClass('sp-hidden');
    }

    // Refresh timeago.
    if (typeof timeAgo !== 'undefined') {
      timeAgo.render($('time.timeago'));
    }
  };

  /**
   * Update the count in the sidebar for a given badge
   *
   * @param $item
   * @param value
   */
  var updateCount = function ($item, value) {
    if (value == 0) {
      $item.hide();
    } else {
      $item.text(value > 999 ? '999+' : value).show();
    }
  };

  /*
   * Initialise sidebar.
   */

  initJQueryListeners();

  // If we have the sidebar data stored in local storage, use that initially before refreshing it
  var sidebarData = localStorage.getItem(storageName);
  if (sidebarData !== null) {
    sidebarData = JSON.parse(sidebarData);
    if (sidebarData !== 'undefined' && sidebarData.expires !== 'undefined' && sidebarData.expires < new Date().getTime() + storageExpiry) {
      updateSidebar(sidebarData.data);
    } else {
      localStorage.removeItem(storageName);
    }
  }

  /**
   * Public API.
   */
  return {
    /**
     * Fetch the latest sidebar data.
     */
    refresh: function () {
      $.get(laroute.route('ticket.operator.ticket.sidebar')).done(function (response) {
        if (response.status == 'success') {
          // Update the sidebar
          updateSidebar(response.data);

          // Store the latest sidebar data in local storage.
          localStorage.setItem(storageName, JSON.stringify({
            data: response.data,
            expires: new Date().getTime() + storageExpiry
          }));
        }
      });
    }
  };
}();

// Force refresh of the sidebar to load the latest counts and store it in local storage.
sideBar.refresh();