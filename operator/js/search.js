$(document.body).ready(function () {
  // Show a No Results message if the server returns no data.
  Selectize.define('no_results', function (options) {
    var self = this;
    options = $.extend({
      message: Lang.get('messages.no_results'),
      html: function (data) {
        return '<div class="selectize-dropdown ' + data.classNames + ' dropdown-empty-message">' + '<div class="selectize-dropdown-content sp-p-3">' + data.message + '</div>' + '</div>';
      }
    }, options);
    self.displayEmptyResultsMessage = function () {
      this.$empty_results_container.css('top', this.$control.outerHeight());
      this.$empty_results_container.css('width', this.$control.outerWidth());
      this.$empty_results_container.show();
    };
    self.onKeyDown = function () {
      var original = self.onKeyDown;
      return function (e) {
        original.apply(self, arguments);
        this.$empty_results_container.hide();
      };
    }();
    self.onBlur = function () {
      var original = self.onBlur;
      return function () {
        original.apply(self, arguments);
        this.$empty_results_container.hide();
      };
    }();
    self.setup = function () {
      var original = self.setup;
      return function () {
        original.apply(self, arguments);
        self.$empty_results_container = $(options.html($.extend({
          classNames: self.$input.attr('class')
        }, options)));
        self.$empty_results_container.insertBefore(self.$dropdown);
        self.$empty_results_container.hide();
      };
    }();
  });
  var xhr,
    options = [];
  function initializeSelectize() {
    var $selectize = $('.search-form .search').selectize({
      // This is arbitrary and only used by Selectize internally (a user/ticket/organisation may share the same DB id).
      valueField: 'uniqid',
      labelField: 'label',
      // Selectize has internal filtering based on searchField which we don't want. So in order to get it to display
      // all the data returned from the server we're passing a 'search' property for each option which is the term
      // that we've searched for...
      searchField: ['search'],
      lockOptgroupOrder: true,
      plugins: ['no_results'],
      create: false,
      onInitialize: function () {
        var $this = this;
        xhr = $.ajax({
          url: laroute.route('core.operator.search.history'),
          success: function (response) {
            options = response.data;
            $.each(response.data, function (index, value) {
              $this.addOption(value);
            });
            $this.refreshOptions();
          }
        });
      },
      onFocus: function () {
        // Set search box to be large width in desktop mode.
        $('#header .search-form').parent('.sp-grow').addClass('lg:sp-w-128 xl:sp-w-128').removeClass('xl:sp-w-64');
        $('#header .search-form .sp-search-shortcut').addClass('sp-hidden xl:sp-hidden');
      },
      onBlur: function () {
        // Keep value on losing focus.
        this.setTextboxValue(this.currentResults.query);
        $('#header .search-form').parent('.sp-grow').removeClass('lg:sp-w-128 xl:sp-w-128').addClass('xl:sp-w-64');
        $('#header .search-form .sp-search-shortcut').removeClass('sp-hidden xl:sp-hidden');
      },
      onChange: function (value) {
        // Clear set value.
        this.setValue(null, true);
        this.refreshOptions(false);
        const $elm = $('.search-form .selectize-dropdown-content div[data-value="' + value + '"] a');
        if ($elm.length) {
          window.location.href = $elm.attr('href');
        }
      },
      onDropdownOpen: function ($dropdown) {
        var $this = this;

        // Make dropdown bigger than normal selectize dropdown.
        $dropdown.css('max-height', $(window).height() * 0.75);
        $dropdown.css('overflow-y', 'auto');

        // Remove Selectize onOptionSelected event handler so that you can click
        // on a[href] inside dropdown options and it opens a new window.
        $dropdown.off('mousedown click');
        $dropdown.on('mousedown click', 'a', function (e) {
          // https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/which#Return_value
          // https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button#Return_value
          if (e.button === 0 || e.which === 1) {
            window.location.href = $(this).attr('href');
          }

          // Keep the dropdown open.
          return false;
        });

        // Handle clicking on a historical search term.
        $dropdown.on('mousedown click', '.sp-search-history', function (e) {
          var term = $(this).find('div.sp-search-term').text();
          if (term.length === 0) {
            return;
          }

          // Remove term from history.
          if ($(e.target).parents('.sp-search-history-clear').length || $(e.target).hasClass('sp-search-history-clear')) {
            $.post(laroute.route('core.operator.search.history_delete'), {
              term: term
            }).then(function () {
              options = options.filter(function (item) {
                return item.label !== term;
              });
              $this.clearOptions();
              $.each(options, function (index, value) {
                $this.addOption(value);
              });
              $this.refreshOptions();
            });

            // Keep the dropdown open.
            return false;
          }
          $this.setTextboxValue($(this).find('div.sp-search-term').text());
          $this.onSearchChange($(this).find('div.sp-search-term').text());

          // Keep the dropdown open.
          return false;
        });
      },
      render: {
        optgroup_header: function (item, escape) {
          return '<div></div>';
        },
        option: function (item, escape) {
          if (item.optgroup === 'history') {
            return "<div class='sp-search-history'>" + "<div class='sp-flex sp-px-3 sp-py-1'>" + "<div class='sp-flex-initial sp-mr-3 sp-text-tertiary'>" + "<i class='fa-solid fa-clock fa-fw'></i>" + "</div>" + "<div class='sp-search-term sp-flex-grow'>" + escape(item.label) + "</div>" + "<div class='sp-search-history-clear sp-flex-initial sp-ml-3 sp-text-tertiary sp-text-sm'>" + "<i class='fa-solid fa-xmark fa-fw'></i>" + "</div>" + "</div>" + "</div>";
          } else if (item.optgroup === 'showall') {
            return "<div>" + "<a class='sp-block sp-px-3 sp-py-1' href='" + escape(item.link) + "'>" + "<div class='sp-inline-block sp-mr-3 sp-text-tertiary'>" + "<i class='fa-solid fa-magnifying-glass fa-fw'></i>" + "</div>" + "<span class='sp-text-sm sp-text-secondary'>" + escape(item.label) + "</span>" + "</a>" + "</div>";
          } else if (item.id !== 0 && item.id !== '') {
            var icon,
              badge = false;
            switch (item.optgroup) {
              case 'tickets':
                icon = 'fa-ticket';
                badge = true;
                break;
              case 'users':
                icon = 'fa-user';
                break;
              case 'organisations':
                icon = 'fa-building';
                break;
              case 'articles':
                icon = 'fa-file-lines';
                break;
            }
            return "<div>" + "<a class='sp-flex sp-items-center sp-px-3 sp-py-1' href='" + escape(item.link) + "'>" + "<div class='sp-flex-initial sp-mr-3 sp-text-tertiary'>" + "<i class='fa-solid " + icon + " fa-fw'></i>" + "</div>" + "<div class='sp-flex-grow sp-truncate sp-leading-snug'>" + (badge ? "<span class='result-id sp-tag sp-bg-primary-800 sp-text-white'>" + escape("#" + item.id.toString()) + "</span>" : "") + "<span class='result-name'>" + item.label + "</span><br />" + "<span class='result-secondary sp-description'>" + item.secondary + "</span>" + "</div>" + "</a>" + "</div>";
          } else {
            return "<div>" + item.label + "</div>";
          }
        }
      },
      loadThrottle: 500,
      load: function (query, callback) {
        $('.sp-search-clear').addClass('sp-hidden').removeClass('sp-inline-block lg:sp-hidden xl:sp-inline-block');
        if (!query.length) {
          return callback();
        }

        // Abort history loading if it us.
        xhr && xhr.abort();

        // Only search if term is two characters or more
        var self = this;
        xhr = $.post(laroute.route('core.operator.search_preview'), {
          query: query
        }).done(function (res) {
          // Clear previous options.
          self.clearOptions();
          self.addOptionGroup('history', {
            label: ''
          });
          self.addOptionGroup('tickets', {
            label: Lang.choice('ticket.ticket', 2)
          });
          self.addOptionGroup('users', {
            label: Lang.choice('user.user', 2)
          });
          self.addOptionGroup('organisations', {
            label: Lang.choice('user.organisation', 2)
          });
          self.addOptionGroup('articles', {
            label: Lang.choice('selfservice.article', 2)
          });
          self.addOptionGroup('showall', {
            label: ''
          });
          self.refreshOptions();
          callback(res.data);
          if (res.data.length === 0) {
            self.displayEmptyResultsMessage();
          }
          $('.sp-search-clear').removeClass('sp-hidden').addClass('sp-inline-block lg:sp-hidden xl:sp-inline-block');
        }).fail(function () {
          callback();
        });
      }
    });
    function focusSearch() {
      $selectize[0].selectize.focus();
    }

    // Focus now.
    focusSearch();

    // Focus on search input if click anywhere in wrapper (mainly to handle clicking on the search icon).
    $('.search-form').on('click', focusSearch);

    // Clear search and reset to search history options only.
    $('.search-form .sp-search-clear').on('click', function () {
      $(this).addClass('sp-hidden').removeClass('sp-inline-block lg:sp-hidden xl:sp-inline-block');
      $selectize[0].selectize.setTextboxValue('');
      $selectize[0].selectize.clearOptions();
      $.each(options, function (index, value) {
        $selectize[0].selectize.addOption(value);
      });
    });
  }

  // Initialise selectize on first click of search.
  $('.search-form').one('click', initializeSelectize);

  // Register keyboard shortcut.
  App.KeyboardShortcuts.SHORTCUT_SEARCH.bind(function () {
    $('.search-form, .search-form .selectize-control').click();

    // Disable browsers built-in shortcut.
    return false;
  });
});