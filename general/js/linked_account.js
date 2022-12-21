$(document).ready(function() {
    $(document.body).on('click', '.unlink-button', function () {
        // Removing existing rows, need to make an AJAX call
        var row = $(this).parents('tr'),
            $this = $(this),
            name = $(row).find('.provider-name').text(),
            params = {
                translationKeys: {
                    title: 'user.unlink_account',
                    warning: 'user.unlink_account_warning',
                    confirmButton: 'general.yes',
                    cancelButton: 'general.no'
                },
                ajax: {
                    url: $this.data('unlink-route'),
                    type: 'POST',
                    data: {
                        provider: $this.data('id')
                    }
                }
            };

        (new deleteAlert(params))
            .fireDefault(name, name)
            .then(function (result) {
                if (result.value) {
                    Swal.fire(
                        Lang.get('messages.deleted'),
                        Lang.get('messages.success_deleted', {'item': Lang.choice('general.provider', 1)}),
                        'success'
                    );

                    // Remove row
                    row.remove();
                }
            });
    });
});
