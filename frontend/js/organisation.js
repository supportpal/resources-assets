$(document).ready(function () {
  $('.datepicker').datepicker();
  const $table = $('.dataTable');
  $table.on('change', '.access-level', function () {
    const $this = $(this);
    $this.prop('disabled', true);
    $.post($this.data('route'), {
      access_level: $(this).val()
    }).done(function (response) {
      if (response.status === 'success') {
        $('.sp-user-access-update.sp-alert-success').show(500).delay(5000).hide(500);
      } else {
        $('.sp-user-access-update.sp-alert-error').show(500).delay(5000).hide(500);
      }
    }).fail(function () {
      $('.sp-user-access-update.sp-alert-error').show(500).delay(5000).hide(500);
    }).always(function () {
      $this.prop('disabled', false);
    });
  }).on('click', '.remove-button', function () {
    const id = $(this).data('user');
    const params = {
      translationKeys: {
        title: 'user.remove_from',
        warning: 'user.remove_from_warn',
        confirmButton: Lang.get('general.yes'),
        cancelButton: Lang.get('general.no')
      },
      ajax: {
        url: $(this).data('route')
      }
    };
    new deleteAlert(params).fireDefault(Lang.choice('user.organisation', 1), $(this).data('name')).then(function (result) {
      if (result.value) {
        $('.delete.sp-alert-success').show(500).delay(5000).hide(500);

        // Remove option from owner dropdown. We check for length to ensure the dropdown exists, it
        // doesn't for normal managers.
        if ($ownerSelectize.length !== 0) {
          $ownerSelectize[0].selectize.removeOption(id);
        }
        $table.dataTable().api().ajax.reload(null, false);
      }
    });
  });
  const $ownerSelectize = $('select[name="owner"]').selectize({
    create: false,
    valueField: 'id',
    searchField: ['formatted_name', 'email'],
    render: {
      item: function (item, escape) {
        return '<div class="item">' + '<img class="sp-avatar sp-max-w-2xs" src=" ' + escape(item.avatar_url) + '" />&nbsp; ' + escape(item.formatted_name) + (item.email ? ' <span class="sp-description">' + escape('<' + item.email + '>') + '</span>' : '') + '</div>';
      },
      option: function (item, escape) {
        return '<div>' + '<img class="sp-avatar sp-max-w-2xs" src="' + escape(item.avatar_url) + '" />&nbsp; ' + escape(item.formatted_name) + (item.email ? ' <span class="sp-description">' + escape('<' + item.email + '>') + '</span>' : '') + '</div>';
      }
    },
    load: function (query, callback) {
      if (!query.length) {
        return callback();
      }
      $.get(laroute.route('user.organisation.transfer.search'), {
        q: query
      }).done(function (response) {
        callback(response.data);
      }).fail(function (response) {
        callback();
      });
    }
  });
});