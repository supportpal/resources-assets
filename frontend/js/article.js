$(document).ready(function () {
    // Open links in comments (not anchors) in a new window/tab. Needs rel="noopener" due to
    // https://www.jitbit.com/alexblog/256-targetblank---the-most-underestimated-vulnerability-ever/
    $(".sp-comment-text a:not([href^='#'])").attr('target', '_blank').attr('rel', 'noopener');

    // Previews for attachments.
    App.attachments.loadPreviews('.sp-content');

    // Previews for inline images.
    var $article = $('.sp-article');
    $article.find('img').each(function () {
        if ($(this).parents('a').length === 0) {
            $(this).addClass('sp-lightbox');
            $(this).attr('data-src', $(this).attr('src'));
        }
    });
    $article.lightGallery({selector: '.sp-lightbox', counter: false});

    // Change ordering
    $('.sp-comment-ordering').on('change', function () {
        // Show loading
        var $loading = $(this).parent().find('.sp-loading');
        $loading.removeClass('sp-hidden');

        // Make call
        $.get(
            typeof commentRoute !== 'undefined' ? commentRoute : laroute.route('selfservice.comment'),
            {
                "articleId": articleId,
                "typeId": typeId,
                "order": $(this).val(),
            },
            function (response) {
                if (response.status == 'success') {
                    $('.sp-comments-block').html(response.data.comments);
                    if ($('.sp-comments-block > .sp-comments > .sp-comment').length >= response.data.comment_total) {
                        // Hide show more option
                        $('.sp-more-parent-comments').hide();
                    } else {
                        // Show option and update count
                        $('.sp-more-parent-comments').show().data('count', $('.sp-comments-block > .sp-comments > .sp-comment').length);
                    }
                } else {
                    // Show error
                    $('.sp-comments-loading.sp-alert-error').show(500).delay(5000).hide(500);
                }
            },
            'json'
        ).fail(function () {
            // Show error
            $('.sp-comments-loading.sp-alert-error').show(500).delay(5000).hide(500);
        }).always(function () {
            // Hide loading
            $loading.addClass('sp-hidden');
        });
    });

    // Fetch more comments
    $('.sp-more-parent-comments').on('click', function () {
        var $this = $(this);
        $this.prop('disabled', 'disabled');

        $.get(
            typeof commentRoute !== 'undefined' ? commentRoute : laroute.route('selfservice.comment'),
            {
                "articleId": articleId,
                "typeId": typeId,
                "order": $('.sp-comment-ordering').val(),
                "last" : $('.sp-comments-block > .sp-comments > .sp-comment:last-child').data('id'),
                "startParent": $this.data('count')
            },
            function (response) {
                // Re-enable button
                $this.prop('disabled', false);

                if (response.status == 'success') {
                    // Add the new comments to the end of the comments list
                    $(response.data.comments).children('div').appendTo('.sp-comments-block > .sp-comments');

                    // Hide the button if we've shown all the comments
                    if ($('.sp-comments-block > .sp-comments > .sp-comment').length >= response.data.comment_total) {
                        $this.hide();
                    } else {
                        // Update the number of parents
                        $this.data('count', $('.sp-comments-block > .sp-comments > .sp-comment').length);
                    }
                } else {
                    // Show error
                    $('.sp-comments-loading.sp-alert-error').show(500).delay(5000).hide(500);
                }
            },
            'json'
        ).fail(function () {
            // Re-enable button
            $this.prop('disabled', false);

            // Show error
            $('.sp-comments-loading.sp-alert-error').show(500).delay(5000).hide(500);
        });
    });

    $(document.body).on('click', '.sp-show-children-comments', function () {
        var $this = $(this);
        $this.prop('disabled', 'disabled');

        $.get(
            typeof commentRoute !== 'undefined' ? commentRoute : laroute.route('selfservice.comment'),
            {
                "articleId": articleId,
                "typeId": typeId,
                "order": $('.sp-comment-ordering').val(),
                "parentId": $this.data('parent')
            },
            function (response) {
                // Re-enable button
                $this.prop('disabled', false);

                if (response.status == 'success') {
                    // Replace current list with new list
                    $this.parent().find('.sp-comments').replaceWith(response.data.comments);
                    // Remove link
                    $this.remove();
                } else {
                    // Show error
                    $('.sp-comments-loading.sp-alert-error').show(500).delay(5000).hide(500);
                }
            },
            'json'
        ).fail (function () {
            // Re-enable button
            $this.prop('disabled', false);

            // Show error
            $('.sp-comments-loading.sp-alert-error').show(500).delay(5000).hide(500);
        });
    });

    // Handle comment actions
    $('.sp-comments-block')
        // Handles showing hidden comments
        .on('click', '.sp-comment-hidden', function () {
            // Show the form
            $(this).next().show();

            // Add comment parent id to the form
            $(this).remove();
        })

        // Handles the comment reply form
        .on('click', '.sp-reply-to-comment', function () {
            // Update parent ID on form
            $(".add-comment").find('input[name=parent_id]').val($(this).data('id'));

            // Get name of parent comment
            var name = $(this).parent().parent().find('> .sp-message-header .sp-name').text();

            // Show name of being replied to
            $('.sp-reply-name').text(name);
            $('.sp-replying-to').show();

            // Hover to the reply form
            $('html, body, #content').animate({
                scrollTop: $(".add-comment-form").position().top - 24
            }, 500);

            // Add to textarea
            name = $.trim(name.replace(/\s/g, ''));
            $(".add-comment").find('textarea').val('@' + $.trim(name) + ' ').trigger('focus');

            // Show reply form if it's not already visible
            if (! $('.add-comment-form').next().is(':visible')) {
                $('.add-comment-form').trigger('click');
            }
        })

        // Handles the rating of a comment
        .on('click', '.sp-rate-comment', function () {
            // Save element for later
            var $this = $(this),
                // Get the other thumb so we can reset it
                $that = $this.data('score') == '1' ? $this.next(['data-score']) : $this.prev('[data-score]');

            // Post data
            $.post(
                laroute.route('selfservice.comment.rating'),
                {
                    "comment_id": $this.data('comment'),
                    "score": $this.data('score')
                },
                function (response) {
                    if (response.status == 'success') {
                        // Update thumb colour, reset other thumb
                        $this.find('.fas').hasClass('sp-text-secondary') ? $this.find('.fas').removeClass('sp-text-secondary') : $this.find('.fas').addClass('sp-text-secondary');
                        $that.find('.fas').removeClass('sp-text-secondary');

                        // Update article rating
                        if (response.data !== null) {
                            $this.parents('.sp-comment-options').find('.sp-comment-rating').show().text(response.data);
                        }
                    }
                },
                'json'
            );
        });

    // Handles cancelling a reply
    $('.sp-cancel-reply').on('click', function () {
        // Update parent ID on form to null
        $(".add-comment").find('input[name=parent_id]').val(null);

        // Hide name
        $('.sp-replying-to').hide();

        // Clear textarea
        $(".add-comment").find('textarea').val('');
    });

    // Handles the rating of an article
    $('.sp-rate-article').on('click', function () {
        var $this = $(this),
            rating = $this.data('rating'),
            feedbackLog = null;

        Swal.fire({allowOutsideClick: false});
        Swal.showLoading();

        $.post(laroute.route('selfservice.article.rating', {'id': articleId}), {"rating": rating})
            .then(function (response) {
                if (response.status == 'success') {
                    feedbackLog = response.data.record;

                    $.get(laroute.route("selfservice.article.feedback", {'id': articleId}))
                        .then(function (response) {
                            if (response.status === "error") {
                                return Swal.close();
                            }

                            // No feedback form
                            if (response.data === null) {
                                $this.parents('.sp-rate-article-container')
                                    .text(Lang.get('selfservice.thank_you_for_feedback'));

                                return Swal.fire({
                                    title: null,
                                    html: Lang.get('selfservice.thank_you_for_feedback'),
                                    icon: 'success',
                                    showConfirmButton: false,
                                    timer: 2000,
                                });
                            }

                            Swal.fire({
                                html: response.data,
                                confirmButtonText: Lang.get('general.save'),
                                cancelButtonText: Lang.get('general.dismiss'),
                                showCancelButton: true,
                                showLoaderOnConfirm: true,
                                allowOutsideClick: false,
                                didOpen: function () {
                                    $('input[type=password]').hideShowPassword();

                                    // Date picker
                                    $(Swal.getContent()).find('.datepicker').datepicker();
                                },
                                preConfirm: function () {
                                    var data = $(Swal.getContent()).find("input, textarea, select").serializeArray();
                                    data.push({name: '_token', value: $('meta[name="csrf_token"]').prop('content') });

                                    $.post(laroute.route('selfservice.article.feedback.store', {'id': feedbackLog.id}), data);
                                }
                            }).then(function (result) {
                                if (result.value) {
                                    $this.parents('.sp-rate-article-container')
                                        .text(Lang.get('selfservice.thank_you_for_feedback'));

                                    Swal.fire({
                                        title: null,
                                        html: Lang.get('selfservice.thank_you_for_feedback'),
                                        showConfirmButton: false,
                                        icon: 'success',
                                        timer: 2000,
                                    });
                                }
                            })
                        })
                        .fail(function () {
                            return Swal.close();
                        });
                } else {
                    return Swal.close();
                }
            });
    });

});
