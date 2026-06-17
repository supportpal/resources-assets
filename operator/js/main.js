$(document).ready(function () {
  // Search - Don't submit if it's empty
  $('form[name=search_form]').on('submit', function (e) {
    if ($(this).find('input[name=query]').val() == '') {
      e.preventDefault();
    }
  });

  // Check / Uncheck all checkboxes in an input group.
  $(document).on('click', 'a.check_all, button.check_all, a.uncheck_all, button.uncheck_all', function (e) {
    e.preventDefault();
    const checked = $(this).hasClass('check_all');
    $(this).parents('.sp-input-group').find('input[type="checkbox"]').prop('checked', checked).trigger('change');
  });

  // For opening collapsed form containers
  $(document.body).on('click', '.sp-form-container.sp-collapsed', function () {
    $(this).removeClass('sp-collapsed').find('.sp-chevron').remove();
    $(this).find('.sp\\:hidden').not('.sp-translatable-modal').not('.sp-translatable-modal .sp:hidden').removeClass('sp:hidden');
  });

  // Toggle show/hide of the filter results area
  $(document.body).on('mousedown', 'button.sp-filter-results', function () {
    var $div = $('div.sp-filter-results');
    if ($div.length) {
      $div.show();
      $('#content').animate({
        scrollTop: $div.position().top - 24
      }, 1000);
    }
  });

  // Toggle show/hide of the filter grid area
  $('.sp-quick-actions').on('click', 'button.sp-filter-grid', function () {
    $('div.sp-filter-grid').removeClass('sp:hidden').find('input').trigger('focus');
  });
  $('.sp-quick-actions').on('focusout blur', 'div.sp-filter-grid input', function () {
    $('div.sp-filter-grid').addClass('sp:hidden');
  });

  /**
   * Global AJAX error handler to catch session timeouts.
   */
  var csrfRefreshPromise = null;
  var csrfRetryQueue = [];
  $.ajaxPrefilter(function (options, originalOptions, jqXHR) {
    // Store originalOptions on jqXHR so it can be used for retries in ajaxError handlers.
    jqXHR.originalOptions = originalOptions;

    // Skip the proxy deferred wrapping for the CSRF refresh request itself or retried requests.
    if (originalOptions._csrfRefresh || originalOptions._csrfRetry) {
      return;
    }

    // Replace the jqXHR deferred methods with a proxy deferred so that on a 419,
    // .done()/.fail()/.always() chains only fire based on the retried request's result.
    var proxyDeferred = $.Deferred();

    // Expose the proxy deferred's promise methods on the jqXHR.
    jqXHR._proxyDeferred = proxyDeferred;
    jqXHR.done = function () {
      proxyDeferred.done.apply(proxyDeferred, arguments);
      return jqXHR;
    };
    jqXHR.fail = function () {
      proxyDeferred.fail.apply(proxyDeferred, arguments);
      return jqXHR;
    };
    jqXHR.always = function () {
      proxyDeferred.always.apply(proxyDeferred, arguments);
      return jqXHR;
    };
    jqXHR.then = function () {
      proxyDeferred.then.apply(proxyDeferred, arguments);
      return jqXHR;
    };

    // When the real request settles, resolve the proxy — unless it's a 419,
    // in which case the 419 handler will resolve it after the retry.
    var originalComplete = options.complete;
    options.complete = function (completedXhr, textStatus) {
      if (completedXhr.status !== 419) {
        if (textStatus === 'success' || textStatus === 'notmodified') {
          proxyDeferred.resolveWith(this, [completedXhr.responseJSON || completedXhr.responseText, textStatus, completedXhr]);
        } else {
          proxyDeferred.rejectWith(this, [completedXhr, textStatus]);
        }
      }
      if (typeof originalComplete === 'function') {
        if (completedXhr.status !== 419) {
          originalComplete.apply(this, arguments);
        }
      }
    };
  });
  $(document).ajaxError(function sessionHandler(event, xhr, ajaxOptions, thrownError) {
    // Ignore errors from the CSRF refresh request itself.
    if (ajaxOptions._csrfRefresh) {
      return;
    }
    if (xhr.status === 401) {
      // Logged out, redirect to session expired page.
      window.location.replace(laroute.route('operator.sessionexpired', {
        'intended': btoa(window.location.href)
      }));
      return false;
    }
    if (xhr.status === 419) {
      // If the retried request also fails with 419, reject its proxy deferred
      // so .fail()/.always() chains still fire rather than hanging.
      if (ajaxOptions._csrfRetry) {
        if (ajaxOptions._proxyDeferred) {
          ajaxOptions._proxyDeferred.rejectWith(this, [xhr, 'error']);
        }
        return false;
      }

      // Queue this request's original options and its proxy deferred so we can
      // retry it and forward the result back to the original .done()/.fail()/.always() chains.
      csrfRetryQueue.push({
        originalOptions: xhr.originalOptions,
        proxyDeferred: xhr._proxyDeferred
      });

      // If a refresh is not already in progress, start one.
      if (csrfRefreshPromise === null) {
        csrfRefreshPromise = $.get({
          url: laroute.route('core.operator.csrf_token.refresh'),
          _csrfRefresh: true
        }).done(function (data) {
          if (data.status === 'success' && data.data && data.data.csrfToken) {
            $('meta[name=csrf_token]').attr('content', data.data.csrfToken);
          }

          // Retry all queued requests and forward their results to the proxy deferreds.
          var queue = csrfRetryQueue.splice(0);
          $.each(queue, function (i, item) {
            $.ajax($.extend({}, item.originalOptions, {
              _csrfRetry: true,
              _proxyDeferred: item.proxyDeferred
            })).done(function () {
              if (item.proxyDeferred) {
                item.proxyDeferred.resolveWith(this, arguments);
              }
            }).fail(function () {
              if (item.proxyDeferred) {
                item.proxyDeferred.rejectWith(this, arguments);
              }
            });
          });
        }).fail(function (refreshXhr) {
          // Reject all queued proxy deferreds so their .fail()/.always() chains fire.
          var queue = csrfRetryQueue.splice(0);
          $.each(queue, function (i, item) {
            if (item.proxyDeferred) {
              item.proxyDeferred.rejectWith(this, [refreshXhr, 'error']);
            }
          });
          if (refreshXhr.status === 401) {
            // Session has expired, redirect to session expired page.
            window.location.replace(laroute.route('operator.sessionexpired', {
              'intended': btoa(window.location.href)
            }));
          } else {
            if (!$('.session-error').is(':visible')) {
              $('.sp-content-inner').prepend('<div class="session-error sp-alert sp-alert-error">' + Lang.get('messages.session_refresh') + '</div>');
            }
            $('#content').animate({
              scrollTop: 0
            }, 1000);
          }
        }).always(function () {
          // Clear the promise so future 419s can trigger a new refresh.
          csrfRefreshPromise = null;
        });
      }
      return false;
    }
  });

  // Scrolling for sidebar on desktop
  const sidebarInner = document.querySelector('.sp-sidebar-inner');
  if (typeof OverlayScrollbarsGlobal !== 'undefined' && sidebarInner !== null) {
    /**
     * Initialise overlay scrollbars on the element.
     */
    let overlayScrollBars;
    var initOverlayScrollbars = function () {
      overlayScrollBars = OverlayScrollbarsGlobal.OverlayScrollbars(sidebarInner, {
        overflowBehavior: {
          x: 'hidden'
        },
        scrollbars: {
          autoHide: 'leave'
        }
      });
    };

    /**
     * Destroy the overlay scrollbars instance.
     */
    var destroyOverlayScrollbars = function () {
      if (overlayScrollBars) {
        overlayScrollBars.destroy();
        overlayScrollBars = null;
      }
    };

    // Initialise overlay scrollbars on the sidebar.
    initOverlayScrollbars();

    // Destroy and reinitialise overlay scrollbars on print event otherwise overflow content is hidden.
    $(window).beforeprint(destroyOverlayScrollbars).afterprint(initOverlayScrollbars);
  }

  // Operator specific DataTable config.
  $(document).on('preInit.dt', function (e, settings) {
    // Hide filter from loading on page load
    $('div.dt-search').addClass('sp:hidden');
    var $table = $(settings.nTable),
      $wrapper = $table.parents('.dt-container');
    if (!$table.hasClass('sp-with-actions')) {
      return;
    }

    // Hide pagination initially, it will be moved to quick actions bar later.
    $wrapper.find('.dt-inputpaging.dt-paging').addClass('sp:hidden');
  }).on('init.dt', function (e, settings) {
    var $table = $(settings.nTable),
      $wrapper = $table.parents('.dt-container');
    if (!$table.hasClass('sp-with-actions')) {
      return;
    }
    var $quickActions = $('.sp-quick-actions'),
      $ul = $quickActions.find('ul:first'),
      $li = $('<li>');
    $quickActions.prepend($('<div>').addClass('sp-filter-grid sp:absolute sp:flex sp:w-full sp:bg-primary sp:px-3 sp:-mx-3 sp:z-50 sp:hidden').append($wrapper.find('div.dt-search').removeClass('sp:hidden').addClass('sp:grow sp:inline-block sp:sm:flex-initial')).append($('<button>').addClass('sp-filter-results sp:px-2 sp:rounded-s-none').prop('title', Lang.get('general.filter_results')).append('<i class="fa-solid fa-caret-down"></i>')));
    $quickActions.find('.sp-filter-grid').find('input').addClass('sp:w-full sp:border-e-0 sp:rounded-e-none sp:sm:w-auto');
    $ul.append($li.addClass('sp-action-group sp:relative sp:float-end').append($('<div>').addClass('sp-grid-pagination sp:inline-block').append($wrapper.find('div.dt-paging').removeClass('sp:hidden'))));
    $ul.trigger('dt.header.init', $li);
  });
});
function array_map(callback) {
  // eslint-disable-line camelcase
  //  discuss at: http://locutus.io/php/array_map/
  // original by: Andrea Giammarchi (http://webreflection.blogspot.com)
  // improved by: Kevin van Zonneveld (http://kvz.io)
  // improved by: Brett Zamir (http://brett-zamir.me)
  //    input by: thekid
  //      note 1: If the callback is a string (or object, if an array is supplied),
  //      note 1: it can only work if the function name is in the global context
  //   example 1: array_map( function (a){return (a * a * a)}, [1, 2, 3, 4, 5] )
  //   returns 1: [ 1, 8, 27, 64, 125 ]

  var argc = arguments.length;
  var argv = arguments;
  var obj = null;
  var cb = callback;
  var j = argv[1].length;
  var i = 0;
  var k = 1;
  var m = 0;
  var tmp = [];
  var tmpArr = [];
  var $global = typeof window !== 'undefined' ? window : GLOBAL;
  while (i < j) {
    while (k < argc) {
      tmp[m++] = argv[k++][i];
    }
    m = 0;
    k = 1;
    if (callback) {
      if (typeof callback === 'string') {
        cb = $global[callback];
      } else if (typeof callback === 'object' && callback.length) {
        obj = typeof callback[0] === 'string' ? $global[callback[0]] : callback[0];
        if (typeof obj === 'undefined') {
          throw new Error('Object not found: ' + callback[0]);
        }
        cb = typeof callback[1] === 'string' ? obj[callback[1]] : callback[1];
      }
      tmpArr[i++] = cb.apply(obj, tmp);
    } else {
      tmpArr[i++] = tmp;
    }
    tmp = [];
  }
  return tmpArr;
}
function emailSelectizeConfig(plugins) {
  var re = /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
  var config = {
    'restore_on_backspace': {},
    'remove_button': {},
    'max_items': {
      'message': Lang.get('general.show_count_more')
    }
  };
  for (var name in config) {
    if (config.hasOwnProperty(name) && plugins.indexOf(name) === -1) {
      delete config[name];
    }
  }
  return {
    plugins: config,
    delimiter: ',',
    persist: false,
    dropdownParent: 'body',
    placeholder: Lang.get('ticket.enter_email_address'),
    render: {
      item: function (item, escape) {
        return '<div class="item' + (item.unremovable ? ' unremovable' : '') + '">' + escape(item.value) + '</div>';
      }
    },
    createFilter: function (input) {
      var match = input.match(re);
      if (match) return !this.options.hasOwnProperty(match[0]);
      return false;
    },
    create: function (input) {
      if (re.test(input)) {
        return {
          value: input,
          text: input
        };
      }
      return false;
    }
  };
}