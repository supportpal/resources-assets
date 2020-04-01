var tableDndHandle = '.sp-sortable-handle';
function tableDnd(route)
{
    var $table = $(".dataTable");
    $table.tableDnD({
        dragHandle: tableDndHandle,
        onDragStart: function(table, row) {
            row = $(row).parents('tr');
            // Don't do anything if the table is filtered
            if ($(row).hasClass('nodrag') || $(row).hasClass('nodrop')) {
                return;
            }

            // Set a background colour on the row temporarily.
            $(row).css("background-color", "var(--color-background-secondary)");
            setTimeout(function () {
                $(row).css("background-color", "");
            }, 1500);
        },
        onDrop: function(table, row) {
            row = $(row).parents('tr');
            $(row).css("background-color", "");
            // Convert to a comma delimited list
            var newOrder = '';
            $.each($.tableDnD.serialize().split('&'), function(key, value) {
                var id = value.split('=');
                if (typeof id[1] !== 'undefined' && id[1] !== '') {
                    newOrder += id[1] + ',';
                }
            });

            // Show the alert
            Swal.fire({
                text: Lang.get('messages.save_order'),
                showConfirmButton: true,
                showCancelButton: false,
                confirmButtonText: Lang.get('general.update'),
                showLoaderOnConfirm: true,
                onOpen: function () {
                    Swal.clickConfirm();
                },
                preConfirm: function () {
                    return $.post(route, { "order": newOrder.slice(0, -1) })
                        .then(function (response) {
                            if (response.status == 'success') {
                                return response;
                            }

                            throw new Error(response.statusText);
                        })
                        .catch(function () {
                            $('.ordering.sp-alert-error').show(500).delay(5000).hide(500);

                            // Refresh grid so they are back in the original place
                            $('.dataTable').dataTable()._fnAjaxUpdate();
                        });
                },
                allowOutsideClick: function () {
                    return ! Swal.isLoading();
                }
            }).then(function (result) {
                if (result.value) {
                    $('.ordering.sp-alert-success').show(500).delay(5000).hide(500);
                }
            });
        }
    });

    // If we're filtering the table, disable row ordering as it might cause unexpected results.
    $table.on( 'draw.dt', function () {
        var api = $table.DataTable(),
            searchTerms = api.columns().search();

        searchTerms.push(api.search());

        // Check that we have a search term
        var nonEmpty = $.grep(searchTerms, function(v) {
            return v !== "";
        });

        if (nonEmpty.length > 0) {
            disableDndOrdering();
        } else {
            enableDndOrdering();
        }
    } );
}

/**
 * Enable row ordering on the DataTable.
 */
function enableDndOrdering()
{
    $(".dataTable").find('tr').removeClass('nodrag nodrop')
        .find(tableDndHandle).css('cursor', 'move');
    $('#dndOrderNote').show();
}

/**
 * Disable row ordering on the DataTable.
 */
function disableDndOrdering()
{
    $(".dataTable").find('tr').addClass('nodrag nodrop')
        .find(tableDndHandle).css('cursor', '');
    $('#dndOrderNote').hide();
}
