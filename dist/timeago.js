(function () {
  'use strict';

  var EN_US = ['second', 'minute', 'hour', 'day', 'week', 'month', 'year'];
  function en_US(diff, idx) {
    if (idx === 0) return ['just now', 'right now'];
    var unit = EN_US[Math.floor(idx / 2)];
    if (diff > 1) unit += 's';
    return [diff + " " + unit + " ago", "in " + diff + " " + unit];
  }
  var ZH_CN = ['秒', '分钟', '小时', '天', '周', '个月', '年'];
  function zh_CN(diff, idx) {
    if (idx === 0) return ['刚刚', '片刻后'];
    var unit = ZH_CN[~~(idx / 2)];
    return [diff + " " + unit + "\u524D", diff + " " + unit + "\u540E"];
  }

  /**
   * Created by hustcc on 18/5/20.
   * Contract: i@hust.cc
   */
  /**
   * All supported locales
   */
  var Locales = {};
  /**
   * register a locale
   * @param locale
   * @param func
   */
  var register = function (locale, func) {
    Locales[locale] = func;
  };
  /**
   * get a locale, default is en_US
   * @param locale
   * @returns {*}
   */
  var getLocale = function (locale) {
    return Locales[locale] || Locales['en_US'];
  };

  /**
   * Created by hustcc on 18/5/20.
   * Contract: i@hust.cc
   */
  var SEC_ARRAY = [60, 60, 24, 7, 365 / 7 / 12, 12];
  /**
   * format Date / string / timestamp to timestamp
   * @param input
   * @returns {*}
   */
  function toDate(input) {
    if (input instanceof Date) return input;
    // @ts-ignore
    if (!isNaN(input) || /^\d+$/.test(input)) return new Date(parseInt(input));
    input = (input || ''
    // @ts-ignore
    ).trim().replace(/\.\d+/, '') // remove milliseconds
    .replace(/-/, '/').replace(/-/, '/').replace(/(\d)T(\d)/, '$1 $2').replace(/Z/, ' UTC') // 2017-2-5T3:57:52Z -> 2017-2-5 3:57:52UTC
    .replace(/([+-]\d\d):?(\d\d)/, ' $1$2'); // -04:00 -> -0400
    return new Date(input);
  }
  /**
   * format the diff second to *** time ago, with setting locale
   * @param diff
   * @param localeFunc
   * @returns
   */
  function formatDiff(diff, localeFunc) {
    /**
     * if locale is not exist, use defaultLocale.
     * if defaultLocale is not exist, use build-in `en`.
     * be sure of no error when locale is not exist.
     *
     * If `time in`, then 1
     * If `time ago`, then 0
     */
    var agoIn = diff < 0 ? 1 : 0;
    /**
     * Get absolute value of number (|diff| is non-negative) value of x
     * |diff| = diff if diff is positive
     * |diff| = -diff if diff is negative
     * |0| = 0
     */
    diff = Math.abs(diff);
    /**
     * Time in seconds
     */
    var totalSec = diff;
    /**
     * Unit of time
     */
    var idx = 0;
    for (; diff >= SEC_ARRAY[idx] && idx < SEC_ARRAY.length; idx++) {
      diff /= SEC_ARRAY[idx];
    }
    /**
     * Math.floor() is alternative of ~~
     *
     * The differences and bugs:
     * Math.floor(3.7) -> 4 but ~~3.7 -> 3
     * Math.floor(1559125440000.6) -> 1559125440000 but ~~1559125440000.6 -> 52311552
     *
     * More information about the performance of algebraic:
     * https://www.youtube.com/watch?v=65-RbBwZQdU
     */
    diff = Math.floor(diff);
    idx *= 2;
    if (diff > (idx === 0 ? 9 : 1)) idx += 1;
    return localeFunc(diff, idx, totalSec)[agoIn].replace('%s', diff.toString());
  }
  /**
   * calculate the diff second between date to be formatted an now date.
   * @param date
   * @param relativeDate
   * @returns {number}
   */
  function diffSec(date, relativeDate) {
    var relDate = relativeDate ? toDate(relativeDate) : new Date();
    return (+relDate - +toDate(date)) / 1000;
  }
  /**
   * nextInterval: calculate the next interval time.
   * - diff: the diff sec between now and date to be formatted.
   *
   * What's the meaning?
   * diff = 61 then return 59
   * diff = 3601 (an hour + 1 second), then return 3599
   * make the interval with high performance.
   **/
  function nextInterval(diff) {
    var rst = 1,
      i = 0,
      d = Math.abs(diff);
    for (; diff >= SEC_ARRAY[i] && i < SEC_ARRAY.length; i++) {
      diff /= SEC_ARRAY[i];
      rst *= SEC_ARRAY[i];
    }
    d = d % rst;
    d = d ? rst - d : rst;
    return Math.ceil(d);
  }

  /**
   * format a TDate into string
   * @param date
   * @param locale
   * @param opts
   */
  var format = function (date, locale, opts) {
    // diff seconds
    var sec = diffSec(date, opts);
    // format it with locale
    return formatDiff(sec, getLocale(locale));
  };
  var ATTR_TIMEAGO_TID = 'timeago-id';
  /**
   * get the datetime attribute, `datetime` are supported.
   * @param node
   * @returns {*}
   */
  function getDateAttribute(node) {
    return node.getAttribute('datetime');
  }
  /**
   * set the node attribute, native DOM
   * @param node
   * @param timerId
   * @returns {*}
   */
  function setTimerId(node, timerId) {
    // @ts-ignore
    node.setAttribute(ATTR_TIMEAGO_TID, timerId);
  }
  /**
   * get the timer id
   * @param node
   */
  function getTimerId(node) {
    return parseInt(node.getAttribute(ATTR_TIMEAGO_TID));
  }

  /**
   * clear a timer from pool
   * @param tid
   */
  var clear = function (tid) {
    clearTimeout(tid);
  };
  // run with timer(setTimeout)
  function run(node, date, localeFunc, opts) {
    // clear the node's exist timer
    clear(getTimerId(node));
    var relativeDate = opts.relativeDate,
      minInterval = opts.minInterval;
    // get diff seconds
    var diff = diffSec(date, relativeDate);
    // render
    node.innerText = formatDiff(diff, localeFunc);
    var tid = setTimeout(function () {
      run(node, date, localeFunc, opts);
    }, Math.min(Math.max(nextInterval(diff), minInterval || 1) * 1000, 0x7fffffff));
    setTimerId(node, tid);
  }
  /**
   * render a dom realtime
   * @param nodes
   * @param locale
   * @param opts
   */
  function render(nodes, locale, opts) {
    // by .length
    // @ts-ignore
    var nodeList = nodes.length ? nodes : [nodes];
    nodeList.forEach(function (node) {
      run(node, getDateAttribute(node), getLocale(locale), {});
    });
    return nodeList;
  }

  /**
   * Created by hustcc on 18/5/20.
   * Contract: i@hust.cc
   */
  register('en_US', en_US);
  register('zh_CN', zh_CN);
  class TimeAgo {
    locale;
    constructor() {
      this.locale = 'supportpal';
    }
    format(date) {
      return format(date, this.locale);
    }
    render(nodes) {
      // Convert jQuery elements to array of HTMLElements
      if (nodes && typeof nodes.jquery !== 'undefined') {
        nodes = nodes.toArray();
      }
      // Return immediately if nodes is empty
      if (Array.isArray(nodes) && nodes.length === 0) {
        return;
      }
      if (nodes instanceof NodeList && nodes.length === 0) {
        return;
      }
      render(nodes, this.locale);
    }
  }
  // Register the SupportPal locale
  register('supportpal', (number, index, total_sec) => {
    // Convert weeks to days.
    if ([8, 9].indexOf(index) !== -1 && total_sec !== undefined) {
      total_sec = parseInt(String(total_sec / 86400));
    }
    const translations = [[Lang.get('general.just_now'), Lang.get('general.shortly')], [Lang.choice('general.minutes_ago', 1, {
      'number': 1
    }), Lang.choice('general.in_minutes', 1, {
      'number': 1
    })], [Lang.choice('general.minutes_ago', 1, {
      'number': 1
    }), Lang.choice('general.in_minutes', 1, {
      'number': 1
    })], [Lang.choice('general.minutes_ago', 2, {
      'number': '%s'
    }), Lang.choice('general.in_minutes', 2, {
      'number': '%s'
    })], [Lang.choice('general.hours_ago', 1, {
      'number': 1
    }), Lang.choice('general.in_hours', 1, {
      'number': 1
    })], [Lang.choice('general.hours_ago', 2, {
      'number': '%s'
    }), Lang.choice('general.in_hours', 2, {
      'number': '%s'
    })], [Lang.choice('general.days_ago', 1, {
      'number': 1
    }), Lang.choice('general.in_days', 1, {
      'number': 1
    })], [Lang.choice('general.days_ago', 2, {
      'number': '%s'
    }), Lang.choice('general.in_days', 2, {
      'number': '%s'
    })], [Lang.choice('general.days_ago', 2, {
      'number': total_sec
    }), Lang.choice('general.in_days', 2, {
      'number': total_sec
    })], [Lang.choice('general.days_ago', 2, {
      'number': total_sec
    }), Lang.choice('general.in_days', 2, {
      'number': total_sec
    })], [Lang.choice('general.months_ago', 1, {
      'number': 1
    }), Lang.choice('general.in_months', 1, {
      'number': 1
    })], [Lang.choice('general.months_ago', 2, {
      'number': '%s'
    }), Lang.choice('general.in_months', 2, {
      'number': '%s'
    })], [Lang.choice('general.years_ago', 1, {
      'number': 1
    }), Lang.choice('general.in_years', 1, {
      'number': 1
    })], [Lang.choice('general.years_ago', 2, {
      'number': '%s'
    }), Lang.choice('general.in_years', 2, {
      'number': '%s'
    })]];
    return translations[index];
  });
  // Initialise global timeAgo variable (used in several other files).
  window.timeAgo = new TimeAgo();
  var index = window.timeAgo;
  return index;
})();