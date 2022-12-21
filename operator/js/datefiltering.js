;(function ($, document, m) {
    /*
     * Maps PHP date() format to moment.js equivalent
     * https://www.php.net/manual/en/datetime.format.php
     * http://momentjs.com/docs/#/displaying/format/
     */
    var formatEx = /[dDjlNSwzWFmMntLoYyaABgGhHisueIOPTZcrU]/g,
        formatMap = {
            d: 'DD',
            D: 'ddd',
            j: 'D',
            l: 'dddd',
            N: 'E',
            S: function () {
                return '[' + this.format('Do').replace(/\d*/g, '') + ']';
            },
            w: 'd',
            z: function () {
                return this.format('DDD') - 1;
            },
            W: 'W',
            F: 'MMMM',
            m: 'MM',
            M: 'MMM',
            n: 'M',
            t: function () {
                return this.daysInMonth();
            },
            L: function () {
                return this.isLeapYear() ? 1 : 0;
            },
            o: 'GGGG',
            Y: 'YYYY',
            y: 'YY',
            a: 'a',
            A: 'A',
            B: function () {
                var utc = this.clone().utc(),
                    swatch = ((utc.hours() + 1) % 24) + (utc.minutes() / 60) + (utc.seconds() / 3600);

                return Math.floor(swatch * 1000 / 24);
            },
            g: 'h',
            G: 'H',
            h: 'hh',
            H: 'HH',
            i: 'mm',
            s: 'ss',
            u: '', // Microseconds aren't supported by JS Date object: https://github.com/moment/moment/issues/3196
            e: '', // No equivalent of Timezone names.
            I: function () {
                return this.isDST() ? 1 : 0;
            },
            O: 'ZZ',
            P: 'Z',
            T: '', // [z, zz] options are deprecated, only work when moment-timezone addon is used.
            Z: function () {
                return parseInt(this.format('ZZ'), 10) * 36;
            },
            c: 'YYYY-MM-DD[T]HH:mm:ssZ',
            r: 'ddd, DD MMM YYYY HH:mm:ss ZZ',
            U: 'X'
        };

    m.fn.formatSupportPal = function () {
        var that = this,
            format = $('meta[name=date_format]').prop('content');

        return this.format(format.replace(formatEx, function (phpStr) {
            return typeof formatMap[phpStr] === 'function' ? formatMap[phpStr].call(that) : formatMap[phpStr];
        }));
    };

    //

    var $filter = $('.sp-filter-datepicker'),
        endDate, startDate;

    // Construct predefined date ranges for easy access.
    var ranges = {};
    ranges[Lang.get('general.today')] = [m(), m()];
    ranges[Lang.get('general.yesterday')] = [m().subtract(1, 'days'), m().subtract(1, 'days')];
    ranges[Lang.get('general.last_7_days')] = [m().subtract(6, 'days'), m()];
    ranges[Lang.get('general.last_30_days')] = [m().subtract(29, 'days'), m()];
    ranges[Lang.get('general.this_month')] = [m().startOf('month'), m().endOf('month')];
    ranges[Lang.get('general.last_month')] = [m().subtract(1, 'month').startOf('month'), m().subtract(1, 'month').endOf('month')];

    // Set date range picker default options.
    $.fn.daterangepicker.defaultOptions = {
        autoApply: true,
        maxDate: m(),
        minYear: 2000,
        maxSpan: {
            'days': 365
        },
        alwaysShowCalendars: true,
        showDropdowns: true,
        ranges: ranges,
        showCustomRangeLabel: false,
        'locale': {
            'separator': Lang.get('general.range_separator'),
            'daysOfWeek': [
                Lang.get('general.sun'),
                Lang.get('general.mon'),
                Lang.get('general.tue'),
                Lang.get('general.wed'),
                Lang.get('general.thu'),
                Lang.get('general.fri'),
                Lang.get('general.sat')
            ],
            'monthNames': [
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
                Lang.get('general.dec')
            ],
        },
    };

    /**
     * Update the Date filter element text to show the start and end date.
     */
    function updateDatePickerText() {
        var text = startDate.formatSupportPal() + Lang.get('general.range_separator') + endDate.formatSupportPal();
        $filter.find('.sp-filter-datepicker-text').text(text);
    }

    /**
     * Get the DataTable element it was initialised on e.g. $('#...').dataTable({ options })
     *
     * @returns {jQuery}
     */
    function dataTable() {
        return $('#' + $('.sp-dataTable:first').attr('id'));
    }

    $(document).ready(function () {
        var isActive = $filter.data('active') !== 0,
            options = {};

        if (isActive) {
            startDate = m().subtract(29, 'days');
            endDate   = m();

            updateDatePickerText();
            options = {startDate: startDate, endDate: endDate};
        }

        // Initialise the date picker.
        $filter.daterangepicker(options);

        // Add date range filters to DataTable requests.
        dataTable().on('preXhr.dt', function (e, settings, data) {
            if (! startDate && ! endDate) {
                return;
            }

            data['sSearch_0_start'] = startDate.formatSupportPal();
            data['sSearch_0_end'] = endDate.formatSupportPal();
        });

        // Handle updating date range picker.
        $filter.on('apply.daterangepicker', function (e, picker) {
            startDate = picker.startDate;
            endDate = picker.endDate;

            updateDatePickerText();
            dataTable().dataTable().api().ajax.reload();
        });
    });
})($, document, moment);
