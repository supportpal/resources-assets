$(document).ready(function() {
    // Date picker
    $('.datepicker').datepicker();

    // Enable hide / show password toggle
    $('input[type=password]').hideShowPassword();

    // Load attachment previews
    App.attachments.loadPreviews($('.sp-message'));

    $(document)
      // Ajax load messages.
      .on('click', '.sp-message-text-show-more', function (e) {
        e.preventDefault();
        e.stopPropagation();

        var $this = $(this),
            $message = $(this).parents('.sp-message'),
            token = $('meta[name="token"]').prop('content'),
            route = laroute.route('ticket.frontend.message.showJson', { id: $message.data('id') });
        if (token.length !== 0) {
            route += "?token=" + token;
        }

        // Remove the show more link and replace it by a loading icon.
        $(this).hide();
        $message.find('.sp-message-text').append(
            '<span class="sp-loading sp-description">'
            + '<i class="fas fa-spinner fa-pulse"></i>&nbsp; ' + Lang.get('general.loading') + '...'
            + '</span>'
        );

        $.get(route)
            .done(function (ajax) {
                // Load the message in, it should already be sanitized.
                $message.find('.sp-message-text').html(ajax.data.purified_text);
            })
            .fail(function () {
                Swal.fire(Lang.get('messages.error'), Lang.get('messages.error_loading_message'), 'error');
                $this.show();
                $message.find('.sp-loading').remove();
            });
      })
      // Download all attachments.
      .on('click', '.sp-download-all', function () {
          var $attachments = $(this).parents('.sp-message').find('.sp-attachments li');
          var filename = $('meta[name="ticket-subject"]').prop('content');

          (new ZipFile).create($attachments, filename)
      })
      // Open links in a new window/tab. Needs rel="noopener" due to
      // https://www.jitbit.com/alexblog/256-targetblank---the-most-underestimated-vulnerability-ever/
      .on('click', '.sp-message-text a', function () {
        $(this).attr('target', '_blank').attr('rel', 'noopener');
      });

    // Redactor
    var instance = $('textarea[name=text]').redactor();

    // Regex for email
    var re = /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;

    // CC email input
    $('select[name="cc[]"]').selectize({
        plugins: {
            'restore_on_backspace': {},
            'remove_button': {},
            'max_items': {
                'message': Lang.get('general.show_count_more')
            }
        },
        delimiter: ',',
        persist: false,
        dropdownParent: 'body',
        placeholder: Lang.get('ticket.enter_email_address'),
        render: {
            item: function (item, escape) {
                return '<div class="item' + (item.unremovable ? ' unremovable' : '') + '">' + escape(item.value) + '</div>';
            }
        },
        createFilter: function (input) {
            var match = input.match(re);
            if (match) {
                return ! this.options.hasOwnProperty(match[0]);
            }

            return false;
        },
        create: function (input) {
            if (re.test(input)) {
                return {
                    value: input,
                    text: input
                };
            }

            return false;
        },
        onDelete: function (input) {
            var self = this;
            $.each(input, function (key, value) {
                // Delete any items selected that don't have a 'unremovable' class.
                if (! $('.cc-emails div[data-value="' + value + '"]').hasClass('unremovable')) {
                    self.removeItem(value);
                }
            });

            // We handle the deletions above, no need to carry on with deleteSelect()
            return false;
        }
    });

    // Expand recipients list to full form for editing
    $('.sp-recipients-text').on('click', function () {
        $('.sp-recipients-text, .sp-recipients-input').toggleClass('sp-hidden');
    });

    // Backwards compatibility for JS changes in 2.1.2 (DEV-1032), this means the reply form continues to work.
    $('.sp-message-form').data('ajax', 'ajax');

    // Add Reply.
    $('.sp-message-form').on('form:submit', function () {
        saveMessage($(this));
    });

    // Update ticket custom fields
    $('.sp-custom-fields').on('form:submit', function () {
        var self = this;
        $.ajax({
                url: $(this).attr('action'),
                type: $(this).attr('method'),
                data: $(this).serializeArray(),
                dataType: 'json'
            })
            .then(function (response) {
                if (response.status !== 'success') {
                    throw new Error;
                }

                $('.sp-ticket-update.sp-alert-success').show(500).delay(5000).hide(500);
            })
            .catch(function () {
                $('.sp-ticket-update.sp-alert-error').show(500).delay(5000).hide(500);
            })
            .always(function () {
                $(self).find('input[type="submit"]').prop('disabled', false);
            });
    });

    // Start polling for new replies
    var polling = new PollReplies(30000);
    polling.start();

    /*
     * Posts message to ticket
     */
    function saveMessage(form)
    {
        // Save data here before disabling fields
        var data = form.serializeArray();

        // Disable form and submit button
        form.find('textarea[name="text"]').prop('disabled', true);
        form.find('input[type="submit"]').prop('disabled', true);

        // Post updated data
        $.ajax({
            url: form.attr('action'),
            type: form.attr('method'),
            data: data,
            dataType: 'json'
        }).done(function (response) {
            if (response.status == 'success') {
                $('.sp-ticket-reply.sp-alert-success').show(500).delay(5000).hide(500);

                // Show new message
                showMessage(response.data.view);

                // Reset the form
                form.find('textarea[name="text"]').val('').prop('disabled', false);
                instance.source.setCode('');
                $('.sp-attached-files').find('li:not(:first)').remove();
                $('.sp-attachment-details').find('input[type=hidden][name^="attachment["]:not(:first)').remove();

                // Update status
                $('.sp-ticket-status').text(response.data.status_name);
                $('.sp-ticket-status').css("background-color", response.data.status_colour);
            } else {
                if (typeof response.message != 'undefined' && response.message != '') {
                    // Custom message
                    $('.sp-ticket-custom.sp-alert-error .sp-container').text(response.message).show(500).delay(5000).hide(500);
                } else {
                    $('.sp-ticket-reply.sp-alert-error').show(500).delay(5000).hide(500);
                }
                // Re-enable textarea
                form.find('textarea[name="text"]').prop('disabled', false);
            }
        }).fail(function () {
            // Show error
            $('.sp-ticket-reply.sp-alert-error').show(500).delay(5000).hide(500);

            // Re-enable textarea
            form.find('textarea[name="text"]').prop('disabled', false);
        }).always(function () {
            // Reset form
            form.find('input[type="submit"]').prop('disabled', false);
        });
    }

    function PollReplies(milliseconds)
    {
        var loopTimer, lastReplyPoll, xhr,
            startAfterTimer,
            instance = this;

        this.runNow = function () {
            instance.stop();

            void 0;

            return xhr = $.ajax({
                url: laroute.route('ticket.frontend.message.poll'),
                data: {
                    ticket_number: ticketNumber,
                    token: $('meta[name="token"]').prop('content'),
                    lastPoll: lastReplyPoll,
                },
                success: function (response) {
                    // If there are notifications, show them
                    if (typeof response.data != 'undefined') {
                        if (response.data.messages.length) {
                            // Add each message
                            $.each(response.data.messages, function (index, value) {
                                showMessage(value);
                            });
                        }

                        // Update ticket details
                        if (response.data.details.update) {
                            // Update sidebar items
                            $('.sp-ticket-department').text(response.data.details.department);
                            $('.sp-ticket-status')
                                .text(response.data.details.status)
                                .css('background-color', response.data.details.status_colour);
                            $('.sp-ticket-priority')
                                .text(response.data.details.priority)
                                .css('background-color', response.data.details.priority_colour);
                            $('.sp-ticket-updated').html(response.data.details.updated_at);

                            // If closed, hide mark as resolved button
                            if (response.data.details.status_id == closedStatusId) {
                                $('.sp-mark-resolved').hide();
                            } else {
                                $('.sp-mark-resolved').show();
                            }

                            // If changed to locked or unlocked, refresh page
                            if (response.data.details.locked) {
                                if ($('form.sp-message-form').length) {
                                    location.reload();
                                }
                            } else {
                                if ($('.sp-ticket-locked').length) {
                                    location.reload();
                                }
                            }
                        }

                        // Refresh timeago.
                        if (typeof timeAgo !== 'undefined') {
                            timeAgo.render($('time.timeago'));
                        }
                    }

                    // If the browser supports, it enable the download all attachments function.
                    if (ZipFile.isSupported()) {
                        $('.sp-message-block').find('ul.sp-attachments').each(function () {
                            if ($(this).find('li').length > 1) {
                                $(this).find('.sp-download-all').show();
                            }
                        });
                    }

                    // Update the last poll time
                    lastReplyPoll = response.timestamp;
                },
                dataType: "json"
            });
        };

        this.start = function () {
            instance.runNow().always(function () {
                loopTimer = setTimeout(instance.start, milliseconds);
            });
        };

        this.startAfter = function (milliseconds) {
            void 0;
            clearTimeout(startAfterTimer);
            startAfterTimer = setTimeout(instance.start, milliseconds);
        };

        this.stop = function () {
            void 0;
            clearTimeout(loopTimer);
            xhr && xhr.abort();
        };

        // When window is not active, stop polling.
        $(document).on('visibilitychange', function () {
            if (document.hidden) {
                void 0;
                instance.stop();
            } else {
                void 0;
                instance.startAfter(2000);
            }
        });
    }

    /*
     * Displays message and highlights it temporarily
     */
    function showMessage(message)
    {
        // Show new message
        if (descReplyOrder) {
            message = $(message).prependTo($('.sp-message-block'));
        } else {
            message = $(message).insertAfter($('.sp-message').last());
        }

        // Load attachment previews if needed
        App.attachments.loadPreviews(message);

        // Special effects, set as blue for 10 seconds.
        message.toggleClass('sp-new-message', 1000);
        setTimeout(function () {
            message.toggleClass('sp-new-message', 1000);
        }, 10000);
    }
});