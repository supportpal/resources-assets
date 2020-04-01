/**
 * Initialise a new delete alert modal.
 *
 * @constructor
 */
function deleteAlert(parameters)
{
    "use strict";

    // Validate parameters.
    if (typeof parameters !== 'object') {
        throw new Error("Expected 'parameters' argument to be of type 'object'.");
    }

    /**
     * The current instance.
     *
     * @type {deleteAlert}
     */
    var instance = this;

    /**
     * Delete options common to both delete alert types.
     *
     * @type {object}
     */
    this.defaultOpts = $.extend(true, {}, {
        showLoaderOnConfirm: true,
        allowOutsideClick: function () {
            return ! Swal.isLoading();
        },
        width: 550,
        customClass: 'delete-modal'
    }, parameters.defaultOpts || {});

    /**
     * Checkbox selector for severe modal.
     *
     * @type {string}
     */
    this.checkboxSelector = parameters.checkboxSelector ? parameters.checkboxSelector : deleteAlert.defaultCheckboxSelector;

    /**
     * List of translation keys to use in the alert modal.
     *
     * @type {object}
     */
    this.translationKeys = $.extend(true, {}, deleteAlert.translationKeys, parameters.translationKeys || {});

    /**
     * Make description for deleting a record with several relations.
     *
     * @param section
     * @param name
     * @param relations
     * @param disabled
     * @returns {string}
     */
    var makeRelationsDescription = function (section, name, relations, disabled)
    {
        disabled = disabled || false;

        // Make checklist.
        var checklist = [];
        for (var i = 0; i < relations.length; i++) {
            var str = '<label style="margin: 0 10px 0 20px">'
                + '<input type="checkbox" name="confirm-delete[]" style="margin: 0 15px 0 0" ' + (disabled ? 'disabled checked' : '') + ' />'
                + relations[i]
                + '</label>';
            checklist.push(str);
        }

        // Lang string replacements.
        var replacements = {"record": section.toLowerCase(), 'name': name};

        return '<span>' + Lang.get(instance.translationKeys.relations, replacements) + '</span>'
            + '<br />'
            + checklist.join('<br />');
    };

    /**
     * Swal2 preconfirm parameter.
     *
     * @returns {void|*}
     */
    var preConfirm = function () {
        if (typeof parameters.ajax !== 'object') {
            return Swal.showLoading();
        }

        return $.ajax($.extend(true, {}, { type: 'DELETE', dataType: 'json' }, parameters.ajax))
            .then(function (response) {
                if (response.status == 'success') {
                    return response;
                }

                throw new Error(response.statusText);
            })
            .catch(function () {
                Swal.showValidationMessage(Lang.get('messages.error_deleted', { item: Lang.get('general.record') }));
            });
    };

    /**
     * Modify the default HTML.
     *
     * @param html
     * @returns {*}
     */
    var modifyHtml = function (html) {
        if (typeof parameters.html !== 'function') {
            return html;
        }

        return parameters.html(html);
    };

    /**
     * SWAL options for deleting a normal record.
     *
     * @param name
     * @param section
     * @param relations
     * @returns {Promise}
     */
    this.fireDefault = function (section, name, relations)
    {
        name = name || '';
        if (typeof section !== 'string' || typeof name !== 'string') {
            throw ("Expecting parameters 'section' and 'name' to be of type string.");
        }

        var message = Lang.get(this.translationKeys.warning, {"record": section.toLowerCase(), 'name': name});
        if (typeof relations === 'object' && relations.length > 0) {
            message = makeRelationsDescription(section, name, relations, true);
        }

        return Swal.fire($.extend(this.defaultOpts, {
            title: Lang.get(this.translationKeys.title, {'record': section }),
            html: modifyHtml('<div style="text-align: left">'
                    + '<div class="sp-alert sp-alert-warning">'
                        + '<i class="fas fa-exclamation-triangle" aria-hidden="true"></i> &nbsp;'
                        + Lang.get('messages.cannot_be_undone')
                    + '</div>'
                    + message
                + '</div>'),
            showCancelButton: true,
            confirmButtonColor: "#e74c3c",
            confirmButtonText: Lang.get(this.translationKeys.confirmButton, {'record': section}),
            cancelButtonText: Lang.get(this.translationKeys.cancelButton, {'record': section}),
            preConfirm: function () {
                return preConfirm();
            }
        }));
    };

    /**
     * SWAL options for deleting a record that has severe consequences i.e. the delete will cascade and
     * wipe out several other related records.
     *
     * @param section
     * @param name
     * @param relations
     * @returns {{title: (*|String), html: string, showCancelButton: boolean, confirmButtonColor: string, confirmButtonText: (*|String), closeOnConfirm: boolean, width: number}}
     */
    this.fireSevere = function (section, name, relations)
    {
        name = name || '';
        relations = relations || [];
        if (typeof name !== 'string' || typeof section !== 'string') {
            throw ("Expecting parameters 'section' and 'name' to be of type string.");
        } else if (typeof relations !== 'object') {
            throw ("Expecting 'relations' parameter of type array.");
        }

        return Swal.fire($.extend(this.defaultOpts, {
            title: Lang.get(this.translationKeys.title, {'record': section }),
            html: modifyHtml('<div style="text-align: left;">'
                    + '<div class="sp-alert sp-alert-warning">'
                        + '<i class="fas fa-exclamation-triangle" aria-hidden="true"></i> &nbsp;'
                        + Lang.get('messages.cannot_be_undone')
                    + '</div>'
                    + makeRelationsDescription(section, name, relations)
                    + '<br /><span>' + Lang.get('messages.please_check') + '</span>'
                + '</div>'),
            showCancelButton: true,
            cancelButtonText: Lang.get(this.translationKeys.cancelButton, {'record': section}),
            confirmButtonColor: "#e74c3c",
            confirmButtonText: Lang.get(this.translationKeys.confirmButton, {'record': section}),
            preConfirm: function () {
                instance.disableCheckboxes();

                return preConfirm();
            }
        }));
    };

    /**
     * Disable severe modal checkboxes.
     */
    this.disableCheckboxes = function ()
    {
        $(this.checkboxSelector).prop('disabled', 'disabled');
    };

    /**
     * Enable severe modal checkboxes.
     */
    this.enableCheckboxes = function ()
    {
        $(this.checkboxSelector).prop('disabled', false);
    }
}

/**
 * Default checkbox selector.
 *
 * @type {string}
 */
deleteAlert.defaultCheckboxSelector = 'input[name="confirm-delete[]"]';

/**
 * Default translation keys.
 *
 * @type {{cancelButton: string, warning: string, title: string, relations: string, confirmButton: string}}
 */
deleteAlert.translationKeys = {
    title: 'messages.delete_record',
    warning: 'messages.warn_delete',
    relations: 'messages.delete_relations',
    confirmButton: 'messages.delete_confirm',
    cancelButton: 'messages.keep_record'
};

$(function () {

    var checkboxSelector = deleteAlert.defaultCheckboxSelector;
    $(document).on('change', checkboxSelector, function (e) {
        if ($(checkboxSelector+':checked').length === $(checkboxSelector).length) {
            $('.swal2-modal').find('button.swal2-confirm').removeAttr('disabled').removeClass('disabled');
            $('.swal2-modal').find('button.swal-cancel').hide();
        } else {
            $('.swal2-modal').find('button.swal2-confirm').prop('disabled', 'disabled').addClass('disabled');
            $('.swal2-modal').find('button.swal2-cancel').show();
        }
    });

    $(document.body).on('click', '.delete-confirm', function() {

        // Save the delete route
        var deleteRoute = $(this).data('route'),
            name = $('<div/>').text($(this).data('name')).html(),
            LANG = $(this).data('lang'),
            section = typeof LANG === 'object' ? LANG.section : Lang.get('general.record'), // backwards compatibility.
            relations = typeof LANG === 'object' ? LANG.relations : [],
            _self = this;

        // Show the alert
        var func = $(this).data('severe') ? 'fireSevere' : 'fireDefault',
            params = {
                ajax: {
                    url: deleteRoute
                }
            };
        (new deleteAlert(params))
            [func](section, name, relations)
            .then(function (result) {
                if (result.value) {
                    Swal.fire(
                        Lang.get('messages.deleted'),
                        Lang.get('messages.success_deleted', { item: Lang.get('general.record') }),
                        'success'
                    );

                    // Trigger an event for any custom handling on successful deletion
                    $(_self).trigger("delete-successful", [result.value]);

                    // Remove the row from the table. If we're using DataTables we'll refresh it via
                    // AJAX in a moment anyway... This resolves an issue with departments were refreshing
                    // DataTables doesn't actually remove the row.
                    $(_self).parents('tr').remove();

                    // Check if DataTables exists, otherwise try and delete the row
                    if (typeof $.fn.dataTable === 'function' && $('.dataTable').length >= 1) {
                        $('.dataTable').dataTable()._fnAjaxUpdate();
                    }
                }
            });

        // User must confirm before the button will unlock.
        if ($(this).data('severe')) {
            $('.swal2-modal').find('button.swal2-confirm').prop('disabled', 'disabled').addClass('disabled');
        }

    });

});
