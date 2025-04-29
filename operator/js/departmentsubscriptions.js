$(function () {
  const render = {
    item: function (item, escape) {
      return '<div><span class="label">' + escape(item.name) + '</span></div>';
    },
    option: function (item, escape) {
      return "<div>" + '<strong>' + escape(item.name) + "</strong><br>" + '<span class="sp-description">' + escape(item.description) + "</span>" + "</div>";
    }
  };
  function postNotifications(data) {
    Swal.showLoading();
    return $.post(laroute.route('user.operator.operatornotification.departmentsubscription'), data).done(() => $('.action.sp-alert-success').show(500).delay(5000).hide(500)).always(() => Swal.close());
  }
  $('select[name="opsettings[default_department_subscription]"]').selectize({
    render: render
  });
  $('.dataTable').on('draw.dt', function (e, settings) {
    const api = new $.fn.dataTable.Api(settings);
    api.table().rows().every(function () {
      $(this.node()).find('select[name=notifications_subscription]').selectize({
        render: render,
        onChange: function (subscription) {
          postNotifications({
            user_id: this.$input.data('user-id'),
            department_id: this.$input.data('department-id'),
            subscription: subscription
          });
        }
      });
    });
  });
});