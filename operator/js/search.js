$(document.body).ready(function () {
    // There's no Selectize event which runs before an item is added / an option is selected. So we're overriding the
    // function here to allow us to intercept that event and perform an action before it adds the item to the UI etc.
    Selectize.define('disable_options', function (options) {
        var self = this;

        this.onOptionSelect = (function (e) {
            return function (e) {
                var $target = $(e.currentTarget);
                var value = $target.attr('data-value');
                var $item = self.getOption(value);

                self.trigger('item_add', value, $item);

                return false;
            }
        })();
    });

    // Show a No Results message if the server returns no data.
    Selectize.define('no_results', function (options) {
        var self = this;

        options = $.extend({
            message: Lang.get('messages.no_results'),
            html: function (data) {
                return (
                    '<div class="selectize-dropdown ' + data.classNames + ' dropdown-empty-message">' +
                        '<div class="selectize-dropdown-content sp-p-3">' + data.message + '</div>' +
                    '</div>'
                );
            }
        }, options);

        self.displayEmptyResultsMessage = function () {
            this.$empty_results_container.css('top', this.$control.outerHeight());
            this.$empty_results_container.css('width', this.$control.outerWidth());
            this.$empty_results_container.show();
        };

        self.onKeyDown = (function () {
            var original = self.onKeyDown;

            return function ( e ) {
                original.apply(self, arguments);
                this.$empty_results_container.hide();
            }
        })();

        self.onBlur = (function () {
            var original = self.onBlur;

            return function () {
                original.apply(self, arguments);
                this.$empty_results_container.hide();
            };
        })();

        self.setup = (function () {
            var original = self.setup;
            return function () {
                original.apply(self, arguments);
                self.$empty_results_container = $(options.html($.extend({
                    classNames: self.$input.attr('class')
                }, options)));
                self.$empty_results_container.insertBefore(self.$dropdown);
                self.$empty_results_container.hide();
            };
        })();
    });

    // Intiailise selectize.
    var $selectize = $('.search-form .search').selectize({
        // This is arbitrary and only used by Selectize internally (a user/ticket/organisation may share the same DB id).
        valueField: 'uniqid',
        labelField: 'label',
        // Selectize has internal filtering based on searchField which we don't want. So in order to get it to display
        // all the data returned from the server we're passing a 'search' property for each option which is the term
        // that we've searched for...
        searchField: ['search'],
        plugins: ['disable_options', 'no_results'],
        create: false,
        onItemAdd: function (value, $item) {
            window.location.href = this.options[value].link;
        },
        onFocus: function () {
            // Set search box to be half page width in desktop mode.
            $('#header .search-form').parent('.sp-flex-grow').addClass('lg:sp-w-1/2');
        },
        onBlur: function () {
            $('#header .search-form').parent('.sp-flex-grow').removeClass('lg:sp-w-1/2');
        },
        onDropdownOpen: function ($dropdown) {
            // Make dropdown bigger than normal selectize dropdown.
            $dropdown.css('max-height', $(window).height() * 0.75);
            $dropdown.css('overflow-y', 'auto');
        },
        render: {
            optgroup_header: function (item, escape) {
                return '<div class="sp-search-category sp-p-3 sp-pb-2 sp-text-secondary sp-uppercase">'
                            + '<strong>' + escape(item.label) + '</strong>' +
                     + '</div>';
            },
            option: function (item, escape) {
                if (item.id !== 0 && item.id !== '') {
                    return "<div>"
                            + "<a class='sp-block sp-px-3 sp-py-1 sp-truncate sp-leading-snug' href='" + escape(item.link) + "'>"
                                + "<span class='result-id sp-tag sp-bg-primary-800 sp-text-white'>" + escape("#" + item.id.toString()) + "</span>"
                                + "<span class='result-name'>" + item.label + "</span><br />"
                                + "<span class='result-secondary sp-description'>" + item.secondary + "</span>"
                            + "</a>"
                        + "</div>";
                } else if (item.id === '') {
                    return "<div class='sp-mt-1'>"
                            + "<a class='sp-block sp-p-3 sp-bg-secondary sp-text-sm sp-font-semibold' href='" + escape(item.link) + "'>"
                                + item.label
                            + "</a>"
                        + "</div>";
                } else {
                    return "<div>" + item.label + "</div>";
                }
            }
        },
        load: function (query, callback) {
            if (! query.length) {
                return callback();
            }

            // Clear previous options.
            this.clearOptions();

            // Remove # from start when searching
            if (query.substring(0, 1) === '#') {
                query = query.substring(1);
            }

            // Only search if term is two characters or more
            var self = this;
            $.post(laroute.route('core.operator.search_preview'), {query: query})
                .then(function (res) {
                    self.addOptionGroup(Lang.choice('user.user', 2), {label: Lang.choice('user.user', 2)});
                    self.addOptionGroup(Lang.choice('ticket.ticket', 2), {label: Lang.choice('ticket.ticket', 2)});
                    self.addOptionGroup(Lang.choice('user.organisation', 2), {label: Lang.choice('user.organisation', 2)});
                    self.refreshOptions();

                    callback(res.data);

                    if (res.data.length === 0) {
                        self.displayEmptyResultsMessage();
                    }
                })
                .fail(function () {
                    callback();
                });
        },
    });

    // Focus on search input if click anywhere in wrapper (mainly to handle clicking on the search icon).
    $('.search-form .selectize-control').on('click', function () {
        $selectize[0].selectize.focus();
    });
});