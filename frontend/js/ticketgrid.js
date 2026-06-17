$(document).ready(function () {
  oTable.yadcf([{
    column_number: 0,
    column_data_type: "text",
    filter_container_id: "filter_number",
    filter_type: "text",
    filter_delay: 500
  }, {
    column_number: 1,
    column_data_type: "text",
    filter_container_id: "filter_subject",
    filter_type: "text",
    filter_delay: 500
  }, {
    column_number: 2,
    filter_container_id: "filter_department"
  }]);
  var $table = $('#ticketGridTable').DataTable();

  // DataTable events.
  $table.on('init.dt', function (e, settings, json) {
    // Move filter results to after the filter row in datatables.
    $('div.sp-filter-results').insertAfter($("div.dt-search").parent('.sp\\:flex'));

    // Change filter row to include submit ticket and filter results buttons.
    $("div.dt-search").removeClass('dt-search').addClass('sp:flex sp:mb-4! sp:ms-6 sp:me-6 sp:md:me-0').append($('<a>', {
      class: 'sp-filter-results sp-button sp:rounded-s-none',
      title: Lang.get('general.filter_results')
    }).append($('<i>', {
      'class': 'fa-solid fa-filter'
    }))).find('input').addClass('sp:w-full sp:md:rounded-e-none');
  });

  // Handle status filter change
  $(document).on('change', '#filter_status select', function () {
    var val = $(this).val();
    $table.columns(3).search(val === '-1' ? '' : val).draw();
  });

  // Toggle show/hide of the filters area
  $(document).on('click', 'a.sp-filter-results', function () {
    $('div.sp-filter-results').toggleClass('sp:hidden');
  });
});