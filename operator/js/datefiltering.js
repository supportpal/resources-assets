;
(function ($, document, m) {
  /**
   * Update the Date filter element text to show the start and end date.
   */
  function updateDatePickerText($filter, startDate, endDate) {
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
  $(function () {
    $('.sp-filter-datepicker').each(function () {
      var $filter = $(this),
        columnIndex = $(this).data('column') || 0,
        startDate,
        endDate,
        isActive = $filter.data('active') !== 0,
        options = {};
      if (isActive) {
        startDate = m().subtract(29, 'days');
        endDate = m().endOf('day');
        updateDatePickerText($filter, startDate, endDate);
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
        data['sSearch_' + columnIndex + '_start'] = startDate.formatSupportPal();
        data['sSearch_' + columnIndex + '_end'] = endDate.formatSupportPal();
      });

      // Handle updating date range picker.
      $filter.on('apply.daterangepicker', function (e, picker) {
        startDate = picker.startDate;
        endDate = picker.endDate;
        updateDatePickerText($filter, startDate, endDate);
        dataTable().dataTable().api().ajax.reload();
      });
    });
  });
})($, document, moment);