;
(function ($, document, m) {
  var $filter = $('.sp-filter-datepicker'),
    endDate,
    startDate;

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
      endDate = m().endOf('day');
      updateDatePickerText();
      options = {
        startDate: startDate,
        endDate: endDate
      };
    }

    // Initialise the date picker.
    $filter.daterangepicker(options);

    // Add date range filters to DataTable requests.
    dataTable().on('preXhr.dt', function (e, settings, data) {
      if (!startDate && !endDate) {
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