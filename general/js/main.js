// SupportPal global namespace, we use App because the help widget uses SupportPal.
var App = (function () {

    'use strict';

    // Create a public methods object
    var modules = {
        env: $('meta[name="environment"]').prop('content') || "production",
        userAgent: {
            isIe: function () {
                return window.navigator.userAgent.indexOf('MSIE') !== -1
                    || window.navigator.appVersion.indexOf('Trident/') !== -1;
            },
        }
    };

    /**
     * Add a module or function to the namespace.
     *
     * @param  {String}   name The name of the module.
     * @param  {Object}   obj  The module object.
     */
    modules.extend = function (name, obj) {
        if (typeof modules[name] !== "undefined") {
            throw new Error("A module with name '" + name + "' already exists.");
        }

        modules[name] = obj;
    };

    // Return public methods object
    return modules;

})();

// Disable jQuery migrate in production.
if (App.env === "production") {
    $.migrateMute = true;
}

// Convert Date objects to unix time.
// Deprecated (DEV-2500). To be removed in v4.
Date.prototype.getUnixTime = function() { return this.getTime()/1000|0 };

// flatpickr.
if (typeof Lang !== 'undefined') {
    flatpickr.localize({
        weekdays: {
            shorthand: [
                Lang.get('general.sun'),
                Lang.get('general.mon'),
                Lang.get('general.tue'),
                Lang.get('general.wed'),
                Lang.get('general.thu'),
                Lang.get('general.fri'),
                Lang.get('general.sat')

            ],
            longhand: [
                Lang.get('general.sunday'),
                Lang.get('general.monday'),
                Lang.get('general.tuesday'),
                Lang.get('general.wednesday'),
                Lang.get('general.thursday'),
                Lang.get('general.friday'),
                Lang.get('general.saturday'),
            ]
        },
        months: {
            shorthand: [
                Lang.get('general.jan'),
                Lang.get('general.feb'),
                Lang.get('general.mar'),
                Lang.get('general.apr'),
                Lang.get('general.may'),
                Lang.get('general.jun'),
                Lang.get('general.jul'),
                Lang.get('general.aug'),
                Lang.get('general.sep'),
                Lang.get('general.oct'),
                Lang.get('general.nov'),
                Lang.get('general.dec'),
            ],
            longhand: [
                Lang.get('general.january'),
                Lang.get('general.february'),
                Lang.get('general.march'),
                Lang.get('general.april'),
                Lang.get('general.may'),
                Lang.get('general.june'),
                Lang.get('general.july'),
                Lang.get('general.august'),
                Lang.get('general.september'),
                Lang.get('general.october'),
                Lang.get('general.november'),
                Lang.get('general.december')
            ]
        },
        firstDayOfWeek: 1,
        ordinal: function (nth) {
            var s = nth % 100;
            if (s > 3 && s < 21)
                return Lang.get('general.ordinal_th');
            switch (s % 10) {
                case 1:
                    return Lang.get('general.ordinal_st');
                case 2:
                    return Lang.get('general.ordinal_nd');
                case 3:
                    return Lang.get('general.ordinal_rd');
                default:
                    return Lang.get('general.ordinal_th');
            }
        },
        rangeSeparator: Lang.get('general.range_separator'),
        weekAbbreviation: Lang.get('general.week_abbr'),
        scrollTitle: Lang.get('general.scroll_to_increment'),
        toggleTitle: Lang.get('general.click_to_toggle'),
        amPM: [Lang.get('general.am'), Lang.get('general.pm')],
        yearAriaLabel: Lang.choice('general.year', 1),
        hourAriaLabel: Lang.choice('general.hour', 1),
        minuteAriaLabel: Lang.choice('general.min', 1),
        time_24hr: true
    });
}

// Date picker.
$.fn.datepicker = function (options) {
    var defaults = {
        // Convert from PHP date format to flatpickr format.
        dateFormat: $('meta[name=date_format]').prop('content')
            .replace('jS', 'J')
            .replace(/([^a-zA-Z])/g, "\\\\$1")
    };

    return $(this).each(function () {
        // Quick fix to stop flatpickr being loaded twice on an input
        if (this._flatpickr === undefined) {
            $(this).flatpickr(
                $.extend(true, defaults, options)
            )
        }
    });
};

// Time picker.
$.fn.timepicker = function (options) {
    var defaults = {
        // Convert from PHP date format to flatpickr format.
        dateFormat: $('meta[name=time_format]').prop('content').replace('g', 'h')
            .replace('a', 'K')
            .replace('A', 'K')
            .replace(/([^a-zA-Z])/g, "\\\\$1"),
        enableTime: true,
        noCalendar: true,
        time_24hr: ! ($('meta[name=time_format]').prop('content').indexOf('g') > -1),
    };

    return $(this).each(function () {
        // Quick fix to stop flatpickr being loaded twice on an input
        if (this._flatpickr === undefined) {
            $(this).flatpickr(
                $.extend(true, defaults, options)
            )
        }
    });
};

// Polyfill for matches, closest and find (IE11), needed for tippy.js
// https://developer.mozilla.org/en-US/docs/Web/API/Element/matches#Polyfill
if (!Element.prototype.matches) {
    Element.prototype.matches = Element.prototype.msMatchesSelector ||
        Element.prototype.webkitMatchesSelector;
}
// https://developer.mozilla.org/en-US/docs/Web/API/Element/closest#Polyfill
if (!Element.prototype.closest) {
    Element.prototype.closest = function (s) {
        var el = this;

        do {
            if (el.matches(s)) return el;
            el = el.parentElement || el.parentNode;
        } while (el !== null && el.nodeType === 1);
        return null;
    };
}
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/find#Polyfill
if (!Array.prototype.find) {
    Object.defineProperty(Array.prototype, 'find', {
        value: function(predicate) {
            // 1. Let O be ? ToObject(this value).
            if (this == null) {
                throw TypeError('"this" is null or not defined');
            }

            var o = Object(this);

            // 2. Let len be ? ToLength(? Get(O, "length")).
            var len = o.length >>> 0;

            // 3. If IsCallable(predicate) is false, throw a TypeError exception.
            if (typeof predicate !== 'function') {
                throw TypeError('predicate must be a function');
            }

            // 4. If thisArg was supplied, let T be thisArg; else let T be undefined.
            var thisArg = arguments[1];

            // 5. Let k be 0.
            var k = 0;

            // 6. Repeat, while k < len
            while (k < len) {
                // a. Let Pk be ! ToString(k).
                // b. Let kValue be ? Get(O, Pk).
                // c. Let testResult be ToBoolean(? Call(predicate, T, « kValue, k, O »)).
                // d. If testResult is true, return kValue.
                var kValue = o[k];
                if (predicate.call(thisArg, kValue, k, o)) {
                    return kValue;
                }
                // e. Increase k by 1.
                k++;
            }

            // 7. Return undefined.
            return undefined;
        },
        configurable: true,
        writable: true
    });
}

// Reverse items in selector.
// https://www.mail-archive.com/discuss@jquery.com/msg04272.html
$.fn.reverse = function () {
    return this.pushStack(this.get().reverse(), arguments);
};

/**
 * Add a new item to DOM container. This function expects a classname:input[name$="[id]"] to be present
 * for every unique DOM item within the container.
 *
 * @param className
 * @param container
 * @returns {number}
 */
function addNewItem(className, container)
{
    // Clone the element
    var newElem = $(className + ':first').clone();

    // Clear the input values from the cloned DOM
    newElem.removeClass('first');

    // Update the index.. god damn you Laravel
    // Longwinded but ensures a unique key
    // Find the highest index first and add one
    var re = /^\w+\[(\d+)?]\[\w+]?$/;
    var m, index = 0;
    $(className + ' :input[name$="[id]"]').each(function () {
        if ((m = re.exec($(this).attr('name'))) !== null) {
            if (typeof m[1] != 'undefined') {
                if ((m = parseInt(m[1])) >= index) {
                    index = m + 1;
                }
            }
        }
    });

    // Update all the indexes in the new element
    newElem.find(':input, label').each(function () {
        var elem = $(this);
        elem.prop('disabled', false);
        [ 'name', 'for', 'id' ].map(function (attribute) {
            var attr = elem.attr(attribute);
            if (/^\w+\[(\d+)?](\[[\w:-]+])*(\[\])?$/g.test(attr)) {
                elem.attr(attribute, attr.replace(/\[(\d+)?]/, '[' + index + ']'));
            }
        });
    });

    // Where do we want to put it?
    if (typeof container !== 'undefined') {
        // Append cloned DOM to the end of the parent container
        $(container).append(newElem);
    } else {
        // Append cloned DOM to the end of the list
        $(className + ':last').after(newElem);
    }

    // Make it visible
    newElem.removeClass('sp-hidden');

    // Auto select first option of dropdowns - fix for firefox
    newElem.find('select').each(function () {
        $(this).find('option:first').prop('selected', 'selected');
    });

    return index;
}

// Wait for DOM to load before running the below.
$(function () {
    // IE 11 css --var support.
    cssVars({
        include: '[data-include]',
        preserveStatic: false,
        variables: spCssVarThemes[$('body').hasClass('sp-theme-dark') ? 'dark' : 'light'],
        silent: App.env === "production"
    });

    // Tooltip - tippy.js
    tippy.delegate(document.body, {
        content: function (reference) {
            var title = reference.getAttribute('title');
            reference.removeAttribute('title');
            return title;
        },
        target: '[title]',
        touch: ['hold', 500],
        zIndex: 10003,
    });

    // Logout handler.
    $('.logout-link').on('click', function (e) {
        e.preventDefault();

        var $form = $('<form>', {method: $(this).data('method'), action: $(this).data('url')})
            .hide()
            .append(
                $('<input>', {
                    type: "hidden",
                    name: "_token",
                    value: $('meta[name=csrf_token]').prop('content')
                })
            );

        $(document.body).append($form);
        $form.submit();
    });

    // Global event events.
    // Avoid polluting the $(document) space with too many event listeners, try to place as close to element as possible
    // otherwise performance will be affected (https://api.jquery.com/on/).
    $(document.body)
        // Tabs toggling
        .on('click', 'ul.sp-tabs li', function () {
            // Get name of tab
            var name = $(this).attr('id');

            // Hide current div
            $(this).parent().siblings('div.sp-tab-content').hide();
            // Show new div
            $('#tab' + name).show();

            // Remove active from old tab
            $(this).parent().find('li.sp-active').removeClass('sp-active');
            // Set to active
            $(this).addClass('sp-active');
        })
        // For dropdowns
        .on('click', '.sp-dropdown-container .sp-button, .sp-dropdown-container .sp-action, .sp-dropdown-container .sp-dropdown li', function () {
            var $dropdown = $(this).parents('.sp-dropdown-container').find('.sp-dropdown');
            if ($dropdown.is(':visible')) {
                $dropdown.hide();
                $dropdown.trigger('sp.dropdown.hide');
            } else {
                $dropdown.show();
                $dropdown.trigger('sp.dropdown.show');
            }
        })
        // Hide dropdown if clicking outside the dropdown div
        .on('click', function (event) {
            $('.sp-dropdown-container').not($(event.target).closest('.sp-dropdown-container'))
                .find('.sp-dropdown:visible')
                .hide();
        })
        // For opening/collapsing collapsible boxes
        .on('click', '.sp-collapsible', function () {
            $(this).find('.fas.fa-chevron-down, .fas.fa-chevron-up').toggleClass('fa-chevron-down fa-chevron-up');
            $(this).next().toggle(500);
        })
        // Smooth scrolling for anchors
        .on('click', 'a[href^="#"]', function (event) {
            event.preventDefault();

            // Check if we have a name with an underscore (used in comments)
            var href = $.attr(this, 'href').substr(1),
                $elem = $('[name="_' + $.attr(this, 'href').substr(1) + '"]');

            // If not, check if it's an ID first or a name without an underscore
            // (normal usage)
            if ($elem.length === 0) {
                $elem = $('[id="' + $.attr(this, 'href').substr(1) + '"]');
                if ($elem.length === 0) {
                    $elem = $('[name="' + $.attr(this, 'href').substr(1) + '"]');
                }
            }

            // Only handle it if we have an element
            if (href.length !== 0 && $elem.length !== 0) {
                $('html, body, #content').animate({
                    scrollTop: $elem.position().top - 24
                }, 500);
            }
        })
        // Close alerts
        .on('click', '.sp-alert .sp-alert-close', function () {
            $(this).parent().slideToggle(300);
        });

    // Handle anchors on page load
    if (window.location.hash) {
        var elem = $('[name="_' + window.location.hash.replace('#', '') + '"]');
        if (elem.length) {
            // Scroll to top just in case
            scroll(0, 0);
            // Now scroll to anchor
            $('html, body, #content').animate({
                scrollTop: elem.position().top - 24
            }, 1000);
        }
    }

    // Global AJAX setup handler to add the CSRF token to ALL POST requests.
    $.ajaxPrefilter(function (options, originalOptions, jqXHR) {
        if (options.type.toLowerCase() === "post"
            || options.type.toLowerCase() === "put"
            || options.type.toLowerCase() === "delete"
        ) {
            jqXHR.setRequestHeader('X-CSRF-Token', $('meta[name=csrf_token]').prop('content'));
        }
    });

    // Register localisation settings.
    if (typeof Lang !== 'undefined') {
        // Timeago
        timeago.register('supportpal', function (number, index, total_sec) {
            // Convert weeks to days.
            if ([8,9].indexOf(index) !== -1) {
                total_sec = parseInt(total_sec / 86400);
            }

            return [
                [Lang.get('general.just_now'), Lang.get('general.shortly')],
                [Lang.choice('general.minutes_ago', 1, {'number': 1}), Lang.choice('general.in_minutes', 1, {'number': 1})],
                [Lang.choice('general.minutes_ago', 1, {'number': 1}), Lang.choice('general.in_minutes', 1, {'number': 1})],
                [Lang.choice('general.minutes_ago', 2, {'number': '%s'}), Lang.choice('general.in_minutes', 2, {'number': '%s'})],
                [Lang.choice('general.hours_ago', 1, {'number': 1}), Lang.choice('general.in_hours', 1, {'number': 1})],
                [Lang.choice('general.hours_ago', 2, {'number': '%s'}), Lang.choice('general.in_hours', 2, {'number': '%s'})],
                [Lang.choice('general.days_ago', 1, {'number': 1}), Lang.choice('general.in_days', 1, {'number': 1})],
                [Lang.choice('general.days_ago', 2, {'number': '%s'}), Lang.choice('general.in_days', 2, {'number': '%s'})],
                [Lang.choice('general.days_ago', 2, {'number': total_sec}), Lang.choice('general.in_days', 2, {'number': total_sec})],
                [Lang.choice('general.days_ago', 2, {'number': total_sec}), Lang.choice('general.in_days', 2, {'number': total_sec})],
                [Lang.choice('general.months_ago', 1, {'number': 1}), Lang.choice('general.in_months', 1, {'number': 1})],
                [Lang.choice('general.months_ago', 2, {'number': '%s'}), Lang.choice('general.in_months', 2, {'number': '%s'})],
                [Lang.choice('general.years_ago', 1, {'number': 1}), Lang.choice('general.in_years', 1, {'number': 1})],
                [Lang.choice('general.years_ago', 2, {'number': '%s'}), Lang.choice('general.in_years', 2, {'number': '%s'})]
            ][index];
        });

        // Initialise global timeAgo variable (used in several other files).
        window.timeAgo = new timeago();
        timeAgo.setLocale("supportpal");

        // Hide/Show Password library defaults.
        $.extend(true, $.fn.hideShowPassword.defaults, {
            show: false,
            innerToggle: 'focus',
            states: {
                shown: {
                    toggle: {
                        attr: {
                            content: Lang.get('general.hide'),
                            attr: { title: '' }
                        }
                    }
                },
                hidden: {
                    toggle: {
                        attr: {
                            content: Lang.get('general.show'),
                            attr: { title: '' }
                        }
                    }
                }
            },
            toggle: {
                className: 'sp-button-sm'
            }
        });

        // Selectize defaults.
        $.extend(true, $.fn.selectize.defaults, {
            render: {
                option_create: function (data, escape) {
                    var item = Lang.get('core.add_selectize', {item: escape(data.input)});

                    return '<div class="create">' + item + '</div>';
                }
            }
        });
    }

    /**
     * Get the form row that the error element sits in.
     *
     * @param  {HTMLElement} element
     * @returns {jQuery}
     */
    function getErrorElementRow(element)
    {
        return $(element).closest('.sp-form-row');
    }

    /**
     * Get the wrapper element around the element that failed validation.
     *
     * @param  {HTMLElement} element
     * @returns {jQuery}
     */
    function getErrorElementWrapper(element)
    {
        if ($(element).parents('.sp-validation-container').length) {
            return $(element).parents('.sp-validation-container');
        }

        if ($(element).parents('.sp-phone-number').length) {
            return $(element).parents('.sp-phone-number');
        }

        var $row = getErrorElementRow(element);

        return $row.find(':input:not(:button)').length > 1 &&
            (! $(element).parent('.redactor-box').length
                && ! $(element).parent('.sp-editor-container').length
                && ! $(element).parent('.hideShowPassword-wrapper').length
                && ! $(element).parent('.sp-input-translatable-container').length
                && ! $(element).parent('.sp-input-group').length
                && ! $(element).next().has('selectize')
                && $(element).prop('type') !== 'checkbox'
                && $(element).prop('type') !== 'radio'
            ) ? $(element) : $row;
    }

    /**
     * Get the container that we're going to add the error message after.
     *
     * @param element
     * @returns {*}
     */
    function getErrorContainer(element)
    {
        var position = element;

        // If it's redactor, codemirror, show/hide button, phone input, recaptcha, a checkbox or radio, add after parent
        if (element.parent('.redactor-box').length || element.parent('.sp-editor-container').length
            || element.parent('.hideShowPassword-wrapper').length || element.parent('.iti').length
            || element.parent('.sp-input-group').length || element.parent().parent('.g-recaptcha').length
            || element.prop('type') === 'checkbox' || element.prop('type') === 'radio'
        ) {
            position = element.parent();
        }

        // If it's selectize or codemirror (source code), add after sibling.
        if (element.next().hasClass('selectize-control') || element.hasClass('source-code')) {
            position = element.next();
        }

        // If it's got a translatable model, add afterwards.
        if (element.next().hasClass('fa-language')) {
            position = element.next().next();
        }

        // If it's phone input, add after sibling (remove button).
        if (element.parent('.iti').length) {
            position = position.next();
        }

        // If it's a checkbox or radio, make sure we put the error after the last element.
        if (position.is('label') && (element.prop('type') === 'checkbox' || element.prop('type') === 'radio')) {
            position = position.siblings().last('label');
        }

        return position;
    }

    // jQuery validate.
    $.validator.setDefaults({
        ignore: '[contenteditable=\'true\']',

        errorElement: 'span',
        errorClass: 'sp-input-error',
        wrapper: 'div',

        errorPlacement: function(error, element) {
            error.insertAfter(getErrorContainer(element));
        },

        highlight: function(element, errorClass, validClass) {
            getErrorElementWrapper(element).addClass('sp-input-has-error');
        },

        unhighlight: function(element, errorClass, validClass) {
            getErrorElementWrapper(element).removeClass('sp-input-has-error');

            // If phone input, it's the next element which is the hidden input.
            if ($(element).parent('.iti').length) {
                element = $(element).next();
            }

            // Hide error if it's "pending" (remote validation).
            var describer = $(element).attr("aria-describedby");
            if (describer) {
                getErrorElementRow(element).find('#' + this.escapeCssMeta(describer)).hide();
            }
        },

        success: function (label, element) {
            //
        },

        // Custom submit handler.
        submitHandler: function (form) {
            // CodeMirror saves when form submit events are fired. We need to manually trigger a save
            // so that jquery-validation has the correct form data.
            $(form).find('.CodeMirror').each(function(i, el){
                el.CodeMirror.save();
            });

            $(form).find('input[type="submit"], button[type="submit"]').prop('disabled', true);

            // Validate the form.
            if (this.form()) {
                // Handle remote validation rules.
                if (this.pendingRequest) {
                    this.formSubmitted = true;

                    return false;
                }

                // Form is valid, trigger form submission event.
                $(form).trigger('form:submit');

                // If the form is marked as using AJAX, then return false to prevent the page refreshing.
                if (typeof $(form).data('ajax') !== "undefined") {
                    return false;
                }

                // Submit the form (will cause the page to refresh etc).
                form.submit();
            } else {
                $(form).find('input[type="submit"], button[type="submit"]').prop('disabled', false);
                this.focusInvalid();
                return false;
            }
        },

        focusInvalid: true,

        invalidHandler: function(event, validator) {
            // Enable submit button again (necessary for invalid remote validation).
            $(this).find(':submit').prop('disabled', false);
        },

        showErrors: function(errorMap, errorList) {
            // Run default error message handler.
            this.defaultShowErrors();

            // Move the screen to show the first error message.
            $.each(errorList, function (key, error) {
                var $elm = getErrorContainer($(error.element));

                // If the error is on another tab, switch to it.
                if ($elm.parents('.sp-tab-content').length) {
                    var id = $elm.parents('.sp-tab-content').attr('id');
                    if (typeof id !== 'undefined' && id.substring(0, 3) === 'tab') {
                        $('.sp-tabs li#' + id.substring(3)).trigger('click');
                    }
                }

                // If the error is in a translatable model, open it.
                if ($elm.parent().hasClass('sp-translation')) {
                    var $translatableInput = $elm.parents('.sp-input-translatable');

                    $translatableInput.find('.fa-language').click();

                    // If the translation is not visible, select it from the dropdown.
                    if (! $elm.parent().is(':visible')) {
                        var $selectize = $translatableInput.find('select[name=sp-translation-add]')[0].selectize;

                        if (typeof $selectize !== 'undefined') {
                            $selectize.addItem($elm.parent().data('locale'), false);
                        }
                    }
                }

                // Make sure the element is visible otherwise it will scroll to the top of the page.
                if ($elm.is(':visible')) {
                    $('html, body, #content').animate({scrollTop: $elm.position().top - 44}, 1000);

                    // Break loop.
                    return false;
                }
            });
        }
    });
});

/**
 * Adds a button to show/hide passwords
 *
 * @deprecated To be removed in v4. Use $().hideShowPassword() instead.
 */
function callHideShowPassword()
{
    $('input[type=password]').hideShowPassword();
}
