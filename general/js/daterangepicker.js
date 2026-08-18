;
(function ($, m) {
  /*
   * Maps PHP date() format to moment.js equivalent
   * From https://stackoverflow.com/a/30192680
   * https://www.php.net/manual/en/datetime.format.php
   * http://momentjs.com/docs/#/displaying/format/
   */
  const formatEx = /[dDjlNSwzWFmMntLoYyaABgGhHisueIOPTZcrU]/g,
    formatMap = {
      d: 'DD',
      D: 'ddd',
      j: 'D',
      l: 'dddd',
      N: 'E',
      S: 'o',
      w: 'e',
      z: 'DDD',
      W: 'W',
      F: 'MMMM',
      m: 'MM',
      M: 'MMM',
      n: 'M',
      t: '',
      // no equivalent
      L: '',
      // no equivalent
      o: 'YYYY',
      Y: 'YYYY',
      y: 'YY',
      a: 'a',
      A: 'A',
      B: '',
      // no equivalent
      g: 'h',
      G: 'H',
      h: 'hh',
      H: 'HH',
      i: 'mm',
      s: 'ss',
      u: 'SSS',
      e: 'zz',
      I: '',
      // no equivalent
      O: '',
      // no equivalent
      P: '',
      // no equivalent
      T: '',
      // no equivalent
      Z: '',
      // no equivalent
      c: '',
      // no equivalent
      r: '',
      // no equivalent
      U: 'X'
    };
  const getSupportPalDateFormat = () => $('meta[name=date_format]').prop('content').replace(formatEx, match => formatMap[match]);
  m.fn.formatSupportPal = function () {
    return this.format(getSupportPalDateFormat());
  };

  // Construct predefined date ranges for easy access.
  let ranges = {};
  ranges[Lang.get('general.today')] = [m(), m()];
  ranges[Lang.get('general.yesterday')] = [m().subtract(1, 'days'), m().subtract(1, 'days')];
  ranges[Lang.get('general.last_7_days')] = [m().subtract(6, 'days'), m()];
  ranges[Lang.get('general.last_30_days')] = [m().subtract(29, 'days'), m()];
  ranges[Lang.get('general.this_month')] = [m().startOf('month'), m().endOf('month')];
  ranges[Lang.get('general.last_month')] = [m().subtract(1, 'month').startOf('month'), m().subtract(1, 'month').endOf('month')];

  // Set date range picker default options.
  $.fn.daterangepicker.defaultOptions = {
    autoApply: true,
    maxDate: m().endOf('day'),
    minYear: 2000,
    alwaysShowCalendars: true,
    showDropdowns: true,
    ranges: ranges,
    showCustomRangeLabel: false,
    'locale': {
      'format': getSupportPalDateFormat(),
      'applyLabel': Lang.get('general.apply'),
      'cancelLabel': Lang.get('general.clear'),
      'separator': Lang.get('general.range_separator'),
      'daysOfWeek': [Lang.get('general.sun'), Lang.get('general.mon'), Lang.get('general.tue'), Lang.get('general.wed'), Lang.get('general.thu'), Lang.get('general.fri'), Lang.get('general.sat')],
      'monthNames': [Lang.get('general.jan'), Lang.get('general.feb'), Lang.get('general.mar'), Lang.get('general.apr'), Lang.get('general.may'), Lang.get('general.jun'), Lang.get('general.jul'), Lang.get('general.aug'), Lang.get('general.sep'), Lang.get('general.oct'), Lang.get('general.nov'), Lang.get('general.dec')]
    }
  };
})(jQuery, moment);