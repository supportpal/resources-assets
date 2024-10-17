$(document).ready(function () {
  function getErrorMessage(jqXHR) {
    var message = Lang.get('messages.general_error');
    if (jqXHR.status === 429) {
      var resetTime = jqXHR.getResponseHeader('X-RateLimit-Reset') || Date.now();
      if (resetTime) {
        resetTime = '<time class="timeago" datetime="' + new Date(resetTime * 1000).toISOString() + '">' + timeAgo.format(new Date(resetTime * 1000)) + '</time>';
      }
      message = Lang.get('messages.throttle_error', {
        'in_time': resetTime
      });
    }
    return message;
  }

  /**
   * Class name for addNewItem() function.
   *
   * @type {string}
   */
  var className = '.sp-phone-number';

  /**
   * Disable the hidden input.
   */
  $(className + ":first :input").prop('disabled', true);

  /**
   * Initialise phone number inputs.
   */
  $('.sp-phone-number input[type="tel"]:not([disabled])').phoneinput();

  /**
   * Add a new option to the form
   */
  $('.sp-add-number').on('click', function () {
    addNewItem(className);
    $('.sp-phone-number:last input[type="tel"]').phoneinput();
  });

  /**
   * Remove an option from the DOM
   */
  $(document.body).on('click', '.sp-remove-number', function () {
    $(this).parents(className).remove();
  });

  /**
   * Verify phone number by code (frontend only).
   */
  $(document.body).on('click', '.sp-verify-number', function () {
    var $this = $(this),
      $row = $this.parents('.sp-phone-number'),
      id = $this.data('id'),
      verifyRoute = $this.data('verify-route');
    Swal.fire({
      title: Lang.get('user.verify_phone_number'),
      html: Lang.get('user.verify_phone_method') + '<br /><br /><span class="sp-button-group sp-justify-center">' + '<button class="sp-verify-phone-method" data-value="sms"><i class="fa-solid fa-fw fa-comment-sms"></i>&nbsp; SMS</button>' + '<button class="sp-verify-phone-method" data-value="call"><i class="fa-solid fa-fw fa-phone"></i>&nbsp; Call</button>' + '</span>',
      showConfirmButton: false,
      showCancelButton: true
    });
    $('button.sp-verify-phone-method').on('click', function () {
      Swal.fire({
        allowOutsideClick: false
      });
      Swal.showLoading();
      $.post($this.data('route'), {
        id: id,
        mode: $(this).data('value')
      }).then(function (response) {
        if (response.status !== 'success') {
          throw new Error(response.message || '');
        }
        Swal.fire({
          title: Lang.get('user.verify_phone_number'),
          text: Lang.get('user.verify_phone_code_sent'),
          input: 'text',
          showCancelButton: true,
          confirmButtonText: Lang.choice('general.submit', 1),
          showLoaderOnConfirm: true,
          preConfirm: function (code) {
            return $.post(verifyRoute, {
              id: id,
              token: code
            }).then(function (response) {
              if (response.status === 'success') {
                return response;
              }
              Swal.showValidationMessage(response.message || Lang.get('messages.general_error'));
            }).catch(function (jqXHR, textStatus, errorThrown) {
              Swal.showValidationMessage(getErrorMessage(jqXHR));
              timeAgo.render($('time.timeago'));
            });
          },
          allowOutsideClick: false
        }).then(function (result) {
          if (result.value) {
            Swal.fire(Lang.get('messages.success'), '', 'success');
            $row.find('.sp-verify-number').parent().remove();
            $row.find('.sp-number-not-verified').remove();
          }
        });
      }).catch(function (jqXHR, textStatus, errorThrown) {
        Swal.fire(Lang.get('messages.error'), getErrorMessage(jqXHR), 'error');
        timeAgo.render($('time.timeago'));
      });
    });
  });

  /**
   * Verify phone number manually (operator only).
   */
  $(document.body).on('click', '.sp-mark-number-verified', function () {
    var $this = $(this),
      $row = $(this).parents('.sp-phone-number');
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
      $row.find('.sp-mark-number-verified').parent().remove();
      $row.find('.sp-number-not-verified').remove();
    }).catch(function () {
      Swal.fire(Lang.get('messages.error'), Lang.get('messages.general_error'), 'error');
    });
  });
});