$(document).ready(function() {

    $(document.body).on('click', '.existing-row .remove-button', function(e) {
        e.preventDefault();

        // Removing existing rows, need to make an AJAX call
        var row = $(this).parents('tr'),
            $this = $(this),
            name = $('<div/>').text(row.find('td:first .light').text().replace(/^<|>$/g, '')).html();

        // Show the alert
        var params = {
            ajax: {
                url: laroute.route('user.organisation.removeUser'),
                data: {
                    user: $this.data('user')
                }
            },
            translationKeys: {
                title: 'user.remove_from',
                warning: 'user.remove_from_warn',
                confirmButton: Lang.get('general.yes'),
                cancelButton: Lang.get('general.no')
            }
        };
        (new deleteAlert(params))
            .fireDefault(Lang.choice('user.organisation', 1), name)
            .then(function (result) {
                if (result.value) {
                    Swal.fire(
                        Lang.get('messages.deleted'),
                        Lang.get('messages.success_deleted', {'item': Lang.choice('user.user', 1)}),
                        'success'
                    );

                    // Remove option from owner dropdown. We check for length to ensure the dropdown exists, it
                    // doesn't for normal managers.
                    if ($ownerSelectize.length !== 0) {
                        $ownerSelectize[0].selectize.removeOption($this.data('user'));
                    }

                    // Remove row
                    row.remove();
                }
            });
    });

    var $ownerSelectize = $('select[name="owner"]').selectize({
        searchField: [ 'formatted_name', 'email' ],
        render: {
            item: function(item, escape) {
                return '<div class="item">' +
                    '<img class="sp-avatar sp-max-w-2xs" src=" ' + escape(item.avatar_url) + '" />&nbsp; ' +
                    escape(item.formatted_name) +
                    (item.email ? ' <span class="sp-description">' + escape('<' + item.email + '>') + '</span>' : '') +
                    '</div>';
            },
            option: function(item, escape) {
                return '<div>' +
                    '<img <img class="sp-avatar sp-max-w-2xs" src="' + escape(item.avatar_url) + '" />&nbsp; ' +
                    escape(item.formatted_name) +
                    (item.email ? ' <span class="sp-description">' + escape('<' + item.email + '>') + '</span>' : '') +
                    '</div>';
            }
        }
    });

});
