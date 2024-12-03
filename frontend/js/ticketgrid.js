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
  $table.on('init.dt', function (settings, json) {
    // Move filter results to after the filter row in datatables.
    $('div.sp-filter-results').insertAfter($("div.dt-search").parent('.sp-flex'));

    // Change filter row to include submit ticket and filter results buttons.
    $("div.dt-search").removeClass('dt-search').addClass('sp-flex sp-mb-6 sp-ms-6').append($('<a>', {
      class: 'sp-filter-results sp-button sp-rounded-s-none sp-hidden md:sp-inline-block',
      title: Lang.get('general.filter_results')
    }).append($('<i>', {
      'class': 'fas fa-fw fa-filter'
    }))).find('input').addClass('sp-w-full md:sp-rounded-e-none');

    // Add status dropdown to right of search area.
    $("div.dataTables_status").addClass('sp-ms-6 sp-hidden md:sp-inline-block').append($('<span>', {
      class: 'sp-me-2',
      text: Lang.choice('general.status', 1)
    })).append($('<select>', {
      name: 'status'
    }).append($('<option>', {
      value: '-1',
      text: Lang.get('general.any')
    })).append($('<option>', {
      value: '-2',
      text: Lang.get('ticket.unresolved')
    })).append($('<option>', {
      value: '-3',
      text: Lang.get('ticket.resolved')
    }))).parent().append($('<a>', {
      href: laroute.route('ticket.frontend.ticket.createStep1'),
      class: 'sp-button sp-button-submit sp-flex-none sp-ms-6 sp-hidden lg:sp-inline-block',
      text: Lang.get('core.submit_ticket')
    }));
  });
  $(document).on('change', 'div.dataTables_status select', function () {
    $('.dataTable').DataTable().columns(3).search($(this).val()).draw();
  });

  // Toggle show/hide of the filters area
  $(document).on('click', 'a.sp-filter-results', function () {
    $('div.sp-filter-results').toggleClass('sp-hidden');
  });
});