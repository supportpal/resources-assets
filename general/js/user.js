(function ( $, window, document, undefined ) {
    function AvatarUploader($element) {
        var cropper,
            instance = this;

        var getRoundedCanvas = function (sourceCanvas) {
            var canvas = document.createElement('canvas');
            var context = canvas.getContext('2d');
            var width = sourceCanvas.width;
            var height = sourceCanvas.height;

            canvas.width = width;
            canvas.height = height;
            context.imageSmoothingEnabled = true;
            context.drawImage(sourceCanvas, 0, 0, width, height);
            context.globalCompositeOperation = 'destination-in';
            context.beginPath();
            context.arc(width / 2, height / 2, Math.min(width, height) / 2, 0, 2 * Math.PI, true);
            context.fill();

            return canvas;
        };

        var upload = function () {
            Swal.fire({allowOutsideClick: false});
            Swal.showLoading();

            var croppedCanvas = cropper.getCroppedCanvas({width: 128, height: 128}),
                roundedCanvas = getRoundedCanvas(croppedCanvas);

            roundedCanvas.toBlob(function (blob) {
                var data = new FormData();
                data.append('avatar', blob);

                $.ajax({
                    url : $element.data('url'),
                    type: 'POST',
                    data: data,
                    contentType: false,
                    processData: false,
                    success: function (data) {
                        $('.action.sp-alert-success').show(500).delay(5000).hide(500);

                        var row = $element.parents('.sp-form-row');
                        row.find('input[name="avatar"]').val('');
                        row.find('.sp-avatar').attr('src', data.data);
                        row.find('.remove-avatar').removeClass('sp-hidden').parent().addClass('sp-button-group');

                        Swal.close();
                    }
                }).fail(function (jqXHR, textStatus, errorThrown) {
                    try {
                        var text, json = JSON.parse(jqXHR.responseText);
                        text = typeof json.message !== 'undefined' ? json.message : errorThrown;
                    } catch (e) {
                        text = errorThrown;
                    }

                    Swal.fire(Lang.get('messages.error'), text, 'error');
                });
            }, 'image/png');
        };

        var readFile = function (file) {
            Swal.fire({allowOutsideClick: false});
            Swal.showLoading();

            var reader = new FileReader();
            reader.onload = function(e) {
                showModal(this.result);
            };

            reader.readAsDataURL(file);
        };

        var showModal = function (image) {
            Swal.fire({
                title: Lang.get('user.avatar'),
                html: $('<div>')
                    .append(
                        $('<div>', {class: 'profile-crop-image-container', style: 'max-height: 20rem;'})
                            .append($('<img>', {width: '100%', src: image}))
                    )
                    .append(
                        $('<div>', {class: 'profile-crop-image-controls sp-button-group sp-inline-block sp-mt-3'})
                            .append(
                                $('<button>', {class: 'profile-crop-image-control-minus'})
                                    .append($('<i>', {class: 'fas fa-search-minus'}))
                            )
                            .append(
                                $('<button>', {class: 'profile-crop-image-control-plus'})
                                    .append($('<i>', {class: 'fas fa-search-plus'}))
                            )
                    )
                    .html(),
                didOpen: onShowModal,
                didClose: onHideModal,
                confirmButtonText: Lang.get('general.save'),
                showCancelButton: true,
                allowOutsideClick: false,
            }).then(function (result) {
                if (result.isConfirmed) {
                    upload();
                }
            });
        };

        var bindControlEvents = function () {
            var $content = $(Swal.getContent()),
                zoom = 0.1,
                $minusButton = $content.find('.profile-crop-image-control-minus'),
                $plusButton = $content.find('.profile-crop-image-control-plus');

            $minusButton.on('click', function (e) {
                cropper.zoom(-Math.abs(zoom));
            });
            $plusButton.on('click', function (e) {
                cropper.zoom(Math.abs(zoom));
            });
        };

        var onShowModal = function (popup) {
            var $content = $(Swal.getContent());

            cropper = new Cropper($content.find('img')[0], {
                aspectRatio: 1,
                viewMode: 1,
                background: false,
                minCropBoxHeight: 128,
                minCropBoxWidth: 128,
                zoomOnTouch: false,
                zoomOnWheel: false,
                toggleDragModeOnDblclick: false,
                ready: function () {
                    bindControlEvents();
                    $content
                        .find('.cropper-view-box, .cropper-face')
                        .css('border-radius', '50%');
                },
            });
        };

        var onHideModal = function () {
            cropper.destroy();
            cropper = null;

            $element.parents('.sp-form-row').find('input[name="avatar"]').val('');
        };

        this.onFileInputChange = function (event) {
            if (this.files.length <= 0) {
                return;
            }

            var file = this.files[0];
            if (file.size > 1048576) {
                return Swal.fire(
                    Lang.get('messages.error'),
                    Lang.get('validation.max.file', {'attribute': Lang.get('user.avatar').toLowerCase(), 'max': 1024}),
                    'error'
                );
            }

            if (! ['image/gif', 'image/jpeg', 'image/jpg', 'image/png'].includes(file['type'])) {
                return Swal.fire(
                    Lang.get('messages.error'),
                    Lang.get('validation.embed_image', {'attribute': Lang.get('user.avatar').toLowerCase()}),
                    'error'
                );
            }

            readFile(file);
        };

        $element.on('change', instance.onFileInputChange);
    }

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
        new AvatarUploader($('input[name="avatar"]'));

        // Delete avatar.
        $('.remove-avatar').on('click', function () {
            var button = this;

            $(button).prop('disabled', true);

            // Show the alert
            Swal.fire({
                didOpen: function () {
                    Swal.showLoading();

                    App.user.deleteAvatar($(button).data('url'))
                        .then(function (response, textStatus, jqXHR) {
                            if (response.status === 'success') {
                                $('.action.sp-alert-success').show(500).delay(5000).hide(500);

                                var row = $(button).parents('.sp-form-row');
                                row.find('input[name="avatar"]').val('');
                                row.find('.sp-avatar').prop('src', response.data);
                                $(button).addClass('sp-hidden').parent().removeClass('sp-button-group');

                                Swal.close();

                                return response;
                            }

                            throw new Error(response.message);
                        })
                        .catch(function (error) {
                            Swal.fire(Lang.get('messages.error'), error.message || Lang.get('messages.general_error'), 'error');
                        })
                        .always(function () {
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
