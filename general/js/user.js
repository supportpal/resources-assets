(function ( $, window, document, undefined ) {
    /**
     * User instance.
     *
     * @constructor
     */
    function User() {
        //
    }

    /**
     * Delete user avatar AJAX.
     *
     * @param url
     * @returns {jQuery}
     */
    User.deleteAvatar = function (url) {
        return $.ajax({ url: url, type: 'DELETE' });
    };

    App.extend('user', User);

    $(function () {
        // Delete avatar.
        $('.remove-avatar').on('click', function () {
            var button = this;

            $(button).prop('disabled', true);

            // Show the alert
            Swal.fire({
                willOpen: function () {
                    Swal.showLoading();

                    App.user.deleteAvatar($(button).data('url'))
                        .then(function (response, textStatus, jqXHR) {
                            if (response.status === 'success') {
                                var $row = $(button).parents('.sp-form-row');
                                $row.find('.input[type="file"]').val("");
                                $row.find('.sp-avatar').prop('src', response.data);

                                $(button).parent().remove();

                                Swal.close();

                                return response;
                            }

                            throw new Error(response.message);
                        })
                        .catch(function (error) {
                            Swal.fire(Lang.get('messages.error'), error.message || Lang.get('messages.general_error'), 'error');

                            $(button).prop('disabled', false);
                        });
                },
                allowOutsideClick: function () {
                    return ! Swal.isLoading();
                }
            });
        });
    });
})($, window, document);
