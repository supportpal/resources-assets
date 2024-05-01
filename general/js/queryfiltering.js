$(document).ready(function () {
  var queryTimer;

  /**
   * Reload datables on changing filter
   */
  $('.sp-filter-results').on('change input', ':input:not(.yadcf-filter)', function (event) {
    // Ignore if losing focus on text input
    if ($(this).is('input:text:not(.datepicker)') && event.type == 'change') {
      return;
    }

    // Delay query by 500ms so we don't run it on every keystroke
    clearTimeout(queryTimer);
    queryTimer = setTimeout(function () {
      // Reload table
      $('.dataTable').on('preXhr.dt', function (e, settings, data) {
        // Add conditions to parameters
        var conditions = $(".sp-filter-results :input").serializeArray();
        $.each(conditions, function (index, value) {
          if (value.value != '' && value.value != '-1') {
            data[value.name] = value.value;
          }
        });
      }).dataTable().api().ajax.reload();
    }, 500);
  });

  /**
   * Reset filter
   */
  $('.yadcf-filter-reset-button').on('click', function () {
    // Get param and reset
    var $input = $(this).prev();
    if ($input.is('input:text')) {
      $input.val('');
    } else if ($input.is('select')) {
      $input.val('-1');
    }

    // Trigger input to reload table
    $input.trigger('input');
  });
  $('.datepicker').datepicker();
});