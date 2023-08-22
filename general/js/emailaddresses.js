$(document).ready(function () {
  /**
   * Class name for addNewItem() function.
   *
   * @type {string}
   */
  var className = '.sp-email-address';

  /**
   * Disable the hidden input.
   */
  $(className + ":first :input").prop('disabled', true);

  /**
   * Add a new option to the form
   */
  $('.sp-add-email-address').on('click', function () {
    addNewItem(className);
  });

  /**
   * Remove an option from the DOM
   */
  $(document.body).on('click', '.sp-remove-email-address', function () {
    $(this).parents(className).remove();
  });

  /**
   * Verify email address by link (frontend only).
   */
  $(document.body).on('click', '.sp-verify-email-address', function () {
    Swal.fire({
      allowOutsideClick: false
    });
    Swal.showLoading();
    $.post($(this).data('route'), {
      id: $(this).data('id')
    }).then(function (response) {
      if (response.status !== 'success') {
        throw new Error();
      }
      Swal.fire(Lang.get('messages.success'), '', 'success');
    }).catch(function () {
      Swal.fire(Lang.get('messages.error'), Lang.get('messages.general_error'), 'error');
    });
  });

  /**
   * Verify email address manually (operator only).
   */
  $(document.body).on('click', '.sp-mark-email-address-verified', function () {
    var $this = $(this),
      $row = $(this).parents('.sp-email-address');
    Swal.fire({
      allowOutsideClick: false
    });
    Swal.showLoading();
    $.post($this.data('route'), {
      id: $this.data('id')
    }).then(function (response) {
      if (response.status !== 'success') {
        throw new Error();
      }
      Swal.fire(Lang.get('messages.success'), '', 'success');
      $row.find('.sp-mark-email-address-verified, .sp-verify-email-address').parent().remove();
      $row.find('.sp-email-address-not-verified').remove();
    }).catch(function () {
      Swal.fire(Lang.get('messages.error'), Lang.get('messages.general_error'), 'error');
    });
  });
});