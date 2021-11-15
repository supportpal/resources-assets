$(document).ready(function() {

    var polling = new PollReplies(30000);
    polling.start();

    // Initialise reply editor.
    var form = new Form();
    form.initReplyForm();

    // Enable hide/show password toggle
    $('input[type=password]').hideShowPassword();

    // Date picker
    $('.datepicker').datepicker();

    // Timepicker
    $('.timepicker').timepicker();

    // Reply type
    $('.sp-reply-type .sp-action').on('click', function() {
        // Hide all forms.
        $('.sp-reply-type .sp-action.sp-active').removeClass('sp-active');
        $('.message-form:not(.edit), .notes-form, .forward-form').hide();

        // Determine whether to show the reply, notes or forward form.
        var $form;
        switch ($(this).data('type')) {
            case 1:
                $form = $('.notes-form').toggle();
                form.initNotesForm();
                break;

            case 2:
                $form = $('.forward-form').toggle();
                form.initForwardForm();

                // If it's not been used before, forward the whole ticket.
                if ($(this).hasClass('sp-fresh')) {
                    // Choose right message depending on reply order.
                    var $message;
                    if (ticket.parameters().replyOrder == 'ASC') {
                        $message = $('#tabMessages .sp-message:not(.sp-note, .sp-forward):last');
                    } else {
                        $message = $('#tabMessages .sp-message:not(.sp-note, .sp-forward):first');
                    }

                    $message.find('a.forward-from-here').trigger('click');
                    return;
                }

                break;

            default:
                $form = $('.message-form:not(.edit)').toggle();
        }

        // If a form is visible but out of view, just scroll to it.
        if ($form.is(':visible')) {
            var elementTop = $form.position().top;
            var elementBottom = elementTop + $form.outerHeight();
            var screenTop = $('#content').scrollTop();
            var screenBottom = screenTop + $('#content').innerHeight();

            if (screenBottom < elementTop || screenTop > elementBottom) {
                // Element is not visible.
                $('#content').animate({scrollTop: $form.position().top - 24}, 1000);
                return;
            }
        }

        // If form is now visible, focus in editor and scroll to it.
        if ($form.is(':visible')) {
            $(this).addClass('sp-active');

            $form.find('textarea.redactor').redactor('editor.startFocus');

            // Scroll to form
            $('#content').animate({scrollTop: $form.position().top - 24}, 1000);
        }
    });

    // Process take button
    $('.take-ticket').on('click', function() {
        ticketAction(laroute.route('ticket.operator.action.take'));
    });
    // Process close button
    $('.close-ticket').on('click', function() {
        ticketAction(laroute.route('ticket.operator.action.close'));
        $(document).ajaxStop(function () {
            // Go back to ticket grid
            window.location.href = ticket.parameters().ticketGridUrl;
        });
    });
    // Process lock button
    $('.lock-ticket').on('click', function() {
        ticketAction(laroute.route('ticket.operator.action.lock'));
        $(document).ajaxStop(function () {
            // Go back to ticket grid
            window.location.href = ticket.parameters().ticketGridUrl;
        });
    });
    // Process unlock button
    $('.unlock-ticket').on('click', function() {
        ticketAction(laroute.route('ticket.operator.action.unlock'));
    });
    // Process watch button
    $('.watch-ticket').on('click', function() {
        ticketAction(laroute.route('ticket.operator.action.watch'));
        $('.watch-ticket').hide();
        $('.unwatch-ticket').show();
    });
    // Process unwatch button
    $('.unwatch-ticket').on('click', function() {
        ticketAction(laroute.route('ticket.operator.action.unwatch'));
        $('.watch-ticket').show();
        $('.unwatch-ticket').hide();
    });
    // Process unmerge button
    $('.unmerge-ticket').on('click', function() {
        ticketAction(laroute.route('ticket.operator.action.unmerge'));
        $(document).ajaxStop(function () {
            // Go back to ticket grid
            window.location.href = ticket.parameters().ticketGridUrl;
        });
    });

    /**
     * Merge Tickets
     */
    $(document).on('click', '.merge-ticket', function () {
        TicketAction.merge([ticket.parameters().ticketId])
            .then(function (result) {
                if (result.value) {
                    $('.sp-ticket-update.sp-alert-success').show(500).delay(5000).hide(500);

                    // We need to update a lot of details on the page. Quick fix, refresh the page.
                    window.location.reload();
                }
            });
    });

    $('.restore-ticket').on('click', function () {
        restoreTicket();
    });

    // Process delete button
    $('.delete-forever-ticket').on('click', function () {
        deleteTicket(false, true);
    });
    $('.delete-ticket').on('click', function() {
        deleteTicket(false, false);
    });
    // Process block button
    $('.block-ticket').on('click', function() {
        deleteTicket(true, false);
    });

    /*
     * Handle updating the ticket side bar
     */
    var $ticketDetails = $('.sp-ticket-details');
    $ticketDetails.find('select[name=priority]').on('change', function() {
        updateTicket($(this).serializeArray());
    });

    $ticketDetails.find('select[name=department]').on('change', function() {
        changeDepartment({ department_id: $(this).val() });
    });

    $ticketDetails.find('select[name=status]').on('change', function() {
        if (typeof closedStatusId !== 'undefined' && $(this).val() == closedStatusId) {
            // If they closed the ticket, we want to handle this differently...
            ticketAction(laroute.route('ticket.operator.action.close'));
            $(document).ajaxStop(function () {
                // Update escalation rules table
                ticket.updateEscalationsTable();
            });
        } else {
            updateTicket($(this).serializeArray());
        }

        // Update the status in the notes box.
        $('.notes-form, .forward-form').find('select[name="to_status"]').val($(this).val());
    });

    // Update SLA plan
    $ticketDetails.find('select[name="slaplan"]').on('change', function() {
        // Post data
        $.post(
            laroute.route('ticket.operator.ticket.updateSlaPlan', { id: ticket.parameters().ticketId }),
            { slaplan: $(this).val() },
            function(response) {
                if (response.status == 'success') {
                    $('.sp-ticket-update.sp-alert-success').show(500).delay(5000).hide(500);
                    // Show escalation rules tabs if we have any
                    if (response.data.escalationrules) {
                        $('.sp-tabs #EscalationRules').show();
                    } else {
                        $('.sp-tabs #EscalationRules').hide();
                    }
                    // Update due time
                    $('.edit-duetime').html(response.data.time);
                    // If it says 'set a due time', hide the trash can icon, else show it
                    if (response.data.time == Lang.get('ticket.set_due_time')) {
                        $('.update-duetime .remove-duetime').hide();
                    } else {
                        $('.update-duetime .remove-duetime').show();
                    }
                    // Update log and escalation rules tables
                    ticket.updateLogTable();
                    ticket.updateEscalationsTable();
                } else {
                    $('.sp-ticket-update.sp-alert-error').show(500).delay(5000).hide(500);
                }
            }, "json").fail(function() {
            $('.sp-ticket-update.sp-alert-error').show(500).delay(5000).hide(500);
        });
    });

    // Update due time
    $ticketDetails.find('.edit-duetime').on('click', function() {
        $('.update-duetime').toggle();
    });
    $ticketDetails.find('.update-duetime button').on('click', function() {
        var date, time;

        // Are we updating or removing?
        if ($(this).hasClass('update')) {
            date = $('input[name="duetime_date"]').val();
            time = $('input[name="duetime_time"]').val();
        }

        // Post data
        $.post(
            laroute.route('ticket.operator.ticket.updateDueTime', { id: ticket.parameters().ticketId }),
            {
                duetime_date: date,
                duetime_time: time
            },
            function(response) {
                if (response.status == 'success') {
                    $('.sp-ticket-update.sp-alert-success').show(500).delay(5000).hide(500);
                    // Update due time and hide form
                    $('.edit-duetime').html(response.data);
                    $('.update-duetime').hide();
                    // If it says 'set a due time', hide the trash can icon, else show it
                    if (response.data == Lang.get('ticket.set_due_time')) {
                        $('.update-duetime .remove-duetime').hide();
                    } else {
                        $('.update-duetime .remove-duetime').show();
                    }
                    // Update log and escalation rules tables
                    ticket.updateLogTable();
                    ticket.updateEscalationsTable();
                } else {
                    $('.sp-ticket-update.sp-alert-error').show(500).delay(5000).hide(500);
                }
            }, "json").fail(function() {
            $('.sp-ticket-update.sp-alert-error').show(500).delay(5000).hide(500);
        });
    });

    // Update ticket custom fields
    $('.save-fields').on('click', function() {
        var data = $(this).parents('form').serializeArray();
        updateTicket(data);
    });

    // Forward message.
    $(document.body).on('submit', '.forward-form', function(event) {
        event.preventDefault();

        // Make sure we have at least one recipient to forward the message to.
        if ($forwardToSelectize[0].selectize.getValue().length === 0
            && $forwardCcSelectize[0].selectize.getValue().length === 0
            && $forwardBccSelectize[0].selectize.getValue().length === 0
        ) {
            Swal.fire(Lang.get('messages.error'), Lang.get('ticket.at_least_one_recipient'), 'error');
        } else {
            ticket.createMessage($(this), $('#newForward'));
        }
    });

    // Reset the forwarding form after posting a message.
    $(document).on('supportpal.new_message:success', 'form.forward-form', function (event, $textarea) {
        // Reset address boxes.
        $forwardToSelectize[0].selectize.clear(true);
        $forwardCcSelectize[0].selectize.clear(true);
        $forwardBccSelectize[0].selectize.clear(true);

        // Reset subject.
        $(this).find('input[name="subject"]').val('FW: ' + $('<div/>').html($(document).find('.sp-ticket-subject').text()).text().trim());
    });

    // Update message
    $(document.body).on('submit', '.message-form, .notes-form', function(event) {
        event.preventDefault();

        // If it's an edit or new message
        if ($(this).hasClass('edit')) {
            ticket.updateMessage($(this), $(this).find('textarea:not(.CodeMirror textarea):eq(0)'));
        } else {
            var selector = $(this).find('input[name="reply_type"]').val() == 1 ? '#newNote' : '#newMessage';

            ticket.createMessage($(this), $(selector));
        }
    });

    /*
     * Update subject
     */
    var subject = $('.sp-edit-subject').val(),
        updateSubject = function (context) {
            // Only update if different
            if (subject !== $(context).val()) {
                // Hide input and show new subject
                $(context).hide();
                $('.sp-ticket-subject').text($(context).val()).show();

                // Post data to perform action
                var url = laroute.route('ticket.operator.ticket.updateSubject', { id: ticket.parameters().ticketId });
                $.post(url, { subject: $(context).val() })
                    .done(function (response) {
                        if (response.status == 'success') {
                            $('.sp-ticket-update.sp-alert-success').show(500).delay(5000).hide(500);
                            // Update subject
                            subject = $('.edit-subject').val();
                        } else {
                            $('.sp-ticket-update.sp-alert-error').show(500).delay(5000).hide(500);
                            // Show old subject
                            $('.sp-ticket-subject').text(subject);
                        }
                    })
                    .fail(function () {
                        $('.sp-ticket-update.sp-alert-error').show(500).delay(5000).hide(500);
                        // Show old subject
                        $('.sp-ticket-subject').text(subject);
                    });
            } else {
                // Hide input and show old subject
                $(context).hide();
                $('.sp-ticket-subject').show();
            }
        };

    // Show edit input
    $('.sp-ticket-subject').on('click', function() {
        var self = this;
        setTimeout(function() {
            var selectedText = "";
            if (document.selection && document.selection.createRange) {
                selectedText = document.selection.createRange().text || "";
            }
            if (window.getSelection) {
                selectedText = window.getSelection().toString();
            }

            // If they haven't selected any text, then show the edit form.
            if (selectedText === "") {
                $(self).hide();
                $('.sp-edit-subject').show().trigger('focus');
            }
        }, 250);
    });

    $('.sp-edit-subject')
        .on('keyup', function (e) {
            if (e.keyCode === 13) {
                updateSubject(this);
            }
        })
        .on('focusout', function () {
            updateSubject(this);
        });
    /*
     * END update subject
     */

    /*
     * Split to new ticket
     */
    // If more than one message, show split ticket button and checkboxes
    if ($('.sp-messages-container[data-position="inline"]').children('.sp-message').length > 1) {
        $('span.split-ticket').removeClass('sp-hidden');
    }

    // Enable button if at least one checkbox ticked
    $(document.body).on('click', 'span.split-ticket input', function(event) {
        event.stopPropagation();

        // Ensure if notes, any other instances of same message is ticked
        $('span.split-ticket input[data-id="' + $(this).data('id') + '"]').prop('checked', $(this).prop('checked'));

        // Show button if at least one is ticked
        if ($('span.split-ticket input:checked').length) {
            $('.split-ticket-action').removeClass('sp-hidden');
            $('.split-ticket-button').prop('disabled', false);
        } else {
            $('.split-ticket-action').addClass('sp-hidden');
            $('.split-ticket-button').prop('disabled', true);
        }
    });

    // Split checked messages to a new ticket
    $('.split-ticket-button').on('click', function() {
        var selected = '';
        // Add checked fields to form
        $('span.split-ticket input:checked').each(function() {
            selected += $(this).data('id') + ',';
        });
        $('<input>').attr({
            type: 'hidden',
            name: 'message_id',
            value: selected.slice(0, -1)
        }).appendTo($(this).parent());
        // Submit form
        $(this).parent().trigger('submit');
    });
    /*
     * END Split to new ticket
     */

    /*
     * Scroll to message
     */
    var hash = window.location.hash.substring(1),
        $message = ticket.getMessage(hash),
        scrollToMessage = false;
    if ($message !== false) {
        // Remove the collapsed class if the URL wants to scroll to a specific message (/view/18#message-2).
        scrollToMessage = true;

        // Wait 1 seconds to start, due to page moving about
        setTimeout(function() {
            ticket.scrollToMessage($message);
        }, 1000);
    }

    /*
     * END Scroll to message
     */

    /*
     * Toggle long tickets (>5 messages)
     */

    // Remove expandable from visible messages.
    $('.sp-message-collapsible').each(function () {
        ticket.removeExpandable($(this));

        // DEV-2163, DEV-2069. By default, we only load 20 messages from the database for performance reasons.
        // If the ticket has >20 messages and the operator hasn't read any of them then they're collapsible (visible)
        // but have no content. We need to force load these messages.
        //
        // loadMessage already ensures that we don't reload a message where the content is already visible.
        ticket.loadMessage($(this));
    });

    // Collapsing or opening message
    $(document).on('click', '#tabMessages .sp-message-collapsed, #tabMessages .sp-message-collapsible .sp-message-header', function() {
        // Get right object
        var $this = $(this);
        if ($this.parents('.sp-message-collapsible').length) {
            $this = $this.parents('.sp-message-collapsible');
        }

        // AJAX load the message into the view.
        ticket.loadMessage($this);

        // If we're collapsing and the edit view is showing, hide it and show the normal message view.
        if ($this.hasClass('sp-message-collapsible') && $this.find('.sp-message-text-edit').is(':visible')) {
            $this.find('.sp-message-text, .sp-message-text-edit').toggle();
        }

        // Toggle between collapsed and collapsible mode
        $this.find('.sp-message-text').children('.sp-message-text-original, .sp-message-text-trimmed').toggle();
        $this.toggleClass('sp-message-collapsible sp-message-collapsed');
    });

    // Collapse tickets with more than 2 collapsed messages
    if ($('.sp-message.sp-message-collapsed').length > 2 && ! scrollToMessage) {
        // Staff notes and ticket content regions of the screen
        var regions = [".sp-messages-container[data-position='top']", ".sp-messages-container[data-position='inline']"];

        for (var i = 0; i < regions.length; i++) {
            // Build the basic selector
            var basicSelector = $(regions[i] + ' > .sp-message.sp-message-collapsed');

            // If this region of the screen has more than 2 collapsed messages, let's shrink it!
            if (basicSelector.length > 2) {
                // Group the middle section of messages and hide them
                var items;
                if (ticket.parameters().replyOrder == 'ASC') {
                    items = basicSelector.not(':first').not(':eq(-1)');
                } else {
                    items = basicSelector.not(':last').not(':eq(0)');
                }

                items.wrapAll(
                    "<div class='sp-collapsed-messages'><span>" + Lang.get('ticket.older_messages', {'count': items.length}) + "</span></div>"
                );
            }
        }

        $('.sp-collapsed-messages').children().children().hide();

        // Make the new hidden group displayable again
        $('.sp-collapsed-messages').on('click', function(event) {
            $(this).find('.sp-message').show();
            $(this).children().children().insertBefore($(this));
            $(this).remove();
        });
    }
    /*
     * END Toggle long tickets (>5 messages)
     */

    /*
     * Expand/collapse all messages
     */
    // Show button that allows expanding all if more than 2 messages
    if ($('.sp-message').length > 2) {
        $('.expand-messages').show();
    }

    // Expand/collapse all messages on click
    $('.expand-messages, .collapse-messages').on('click', function() {
        if ($(this).hasClass('expand-messages')) {
            $('.sp-collapsed-messages').trigger('click');
            $('#tabMessages .sp-message-collapsed').trigger('click');
        } else {
            $('#tabMessages .sp-message-collapsible .sp-message-header').trigger('click');
        }
        $('.expand-messages, .collapse-messages').toggle();
    });
    /*
     * END Expand/collapse all messages
     */

    /*
     * Show ticket attachment previews
     */
    ticket.loadAttachmentPreviews($('.sp-message.sp-message-collapsible'));
    /*
     * END Show ticket attachment previews
     */

    /*
     * Saving drafts automatically
     */
    function saveDraft($form, type, useBeacon) {
        var message = $form.find('textarea:not(.CodeMirror textarea):eq(0)').redactor('source.getCode');

        // Update draft message variable
        if (type == '1') {
            ticket.setNoteDraft(message);
        } else if (type == '2') {
            ticket.setForwardDraft(message);
        } else {
            ticket.setMessageDraft(message);
        }

        // Make AJAX data.
        var data = {
            _token: $('meta[name=csrf_token]').prop('content'),
            ticket: [ ticket.parameters().ticketId ],
            reply_type: type,
            is_draft: 1,
            text: message,
            redactor: [ $form.find('textarea:not(.CodeMirror textarea):eq(0)').attr('name') ],
            from_address: type == '2' ? $form.find('select[name="from_address"]').val() : null,
            to_address: type == '2' ? $form.find('select[name="to_address[]"]').val() : null,
            cc_address: type == '2' ? $form.find('select[name="cc_address[]"]').val() : null,
            bcc_address: type == '2' ? $form.find('select[name="bcc_address[]"]').val() : null,
            subject: type == '2' ? $form.find('input[name="subject"]').val() : null
        };

        // Add attachments to AJAX data.
        $($form.find('input[name^="attachment["]:not(:disabled)').serializeArray()).each(function(index, obj) {
            data[obj.name] = obj.value;
        });

        if (useBeacon && "sendBeacon" in navigator) {
            navigator.sendBeacon(laroute.route('ticket.operator.message.store'), new URLSearchParams($.param(data)));
        } else {
            // Call the ajax to save draft
            $.ajax({
                method: 'POST',
                url: laroute.route('ticket.operator.message.store'),
                data: data,
                success: function (response) {
                    if (typeof response.status !== 'undefined' && response.status == 'success') {
                        // Show saved message
                        $form.find('.draft-success').text(response.message).show();
                        // Show discard button
                        $form.find('.discard-draft').show();
                        // Show draft icon in quick action
                        $('.sp-reply-type .sp-action[data-type=' + type + '] .sp-draft-icon').removeClass('sp-hidden');
                        // Add attachment-id data to each attachment.
                        var attachments = response.data.attachments;
                        for (var upload_hash in attachments) {
                            if (!attachments.hasOwnProperty(upload_hash)) {
                                continue;
                            }

                            var id = attachments[upload_hash];
                            $form.find('.sp-delete-attachment').each(function () {
                                if ($(this).data('hash') === upload_hash || $(this).prop('data-hash') === upload_hash) {
                                    $(this).data('attachment-id', id);
                                }
                            });
                        }
                    }
                },
                dataType: "json"
            });
        }
    }

    function autoSaveDraft(useBeacon) {
        // Only if draft button is available on either reply or note form
        if ($('.save-draft').length) {
            var drafts = ticket.getDrafts();

            // Check both message drafts and note drafts.
            for (var redactor_id in drafts) {
                var $textarea = $('#'+redactor_id),
                    $form = $textarea.parents('form');

                // Only if it's a redactor editor (e.g. not for Twitter replies)
                if ($($textarea).siblings('.redactor-in').length) {
                    // skip loop if the property is from prototype
                    if (!drafts.hasOwnProperty(redactor_id) || $form.find('input[type="submit"]').prop('disabled')) {
                        continue;
                    }

                    // Get the draft message.
                    var draftMessage = drafts[redactor_id];

                    // Save current message
                    if (draftMessage == null) {
                        ticket.setDraft(redactor_id, $textarea.redactor('source.getCode'));
                    }

                    // Check if message has changed
                    var currentMessage = $textarea.redactor('source.getCode');
                    if (ticket.draftHasChanged(redactor_id, currentMessage)) {
                        // Disable button while saving
                        $form.find('.save-draft').prop('disabled', true);

                        // Save draft
                        saveDraft($form, $form.find('input[name="reply_type"]').val(), useBeacon);

                        // Re-enable button
                        $form.find('.save-draft').prop('disabled', false);
                    }
                }
            }

            // Delay the next poll by 30 seconds
            setTimeout(function() {
                autoSaveDraft();
            }, 30000);
        }
    }

    // Wait 2 seconds to start, due to redactor changing HTML
    setTimeout(function() {
        autoSaveDraft();
    }, 2000);

    // Before closing/redirecting away, check if there's a draft that needs to be saved.
    window.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'hidden') {
            autoSaveDraft(true);
        }
    });
    /*
     * END Saving drafts automatically
     */

    // Save draft button
    $('.save-draft').on('click', function(e) {
        var $form = $(this).parents('form'),
            replyType = $form.find('input[name="reply_type"]').val();

        saveDraft($form, replyType);
    });

    // Discard draft button
    $('.discard-draft').on('click', function() {
        // Post data to perform action
        var $form = $(this).parents('form'),
            replyType = $form.find('input[name="reply_type"]').val(),
            params = { ticket_id: ticket.parameters().ticketId, reply_type: replyType };

        // Delete any attachments currently showing
        $form.find('input[name="attachment[]"]:not(:first)').remove();
        $form.find('.sp-attached-files li:not(:first) .sp-delete-attachment').attr('data-silent', true).trigger('click');

        $.post(laroute.route('ticket.operator.message.discard'), params, function(response) {
            if (response.status == 'success') {
                $('.sp-ticket-update.sp-alert-success').show(500).delay(5000).hide(500);

                // Clear redactor
                if (replyType == 1) {
                    $('#newNote').redactor('insertion.set', '');
                    ticket.setNoteDraft(null);
                } else if (replyType == 2) {
                    $('#newForward').redactor('insertion.set', '');
                    $('.sp-reply-type .sp-action[data-type="2"]').addClass('sp-fresh');
                    ticket.setForwardDraft(null);
                } else {
                    $('#newMessage').redactor('insertion.set', '');
                    $('#newMessage').redactor('insertion.insertHtml', ticket.parameters().signature, false);
                    $('#newMessage').redactor('editor.startFocus');
                    ticket.setMessageDraft(null);
                }

                // Remove draft icon in quick action
                $('.sp-reply-type .sp-action[data-type=' + replyType + '] .sp-draft-icon').addClass('sp-hidden');

                // Hide button
                $form.find('.discard-draft, .draft-success').hide();
            } else {
                $('.sp-ticket-update.sp-alert-error').show(500).delay(5000).hide(500);
            }
        }, "json").fail(function() {
            $('.sp-ticket-update.sp-alert-error').show(500).delay(5000).hide(500);
        });
    });

    $('#tabMessages')
        // Download all attachments.
        .on('click', '.sp-download-all', function () {
            var $attachments = $(this).parents('ul.sp-attachments').find('li');
            var filename = $('.sp-ticket-subject').text();

            (new ZipFile).create($attachments, filename)
        })
        // Show a draft message.
        .on('click', '.sp-draft-message-title', function () {
            var $draft = $(this).parent();

            // Toggle the content area.
            $draft.find('.sp-draft-message-content').toggleClass('sp-hidden');
            $draft.find('.sp-chevron i').toggleClass('fa-chevron-down fa-chevron-up');

            // If it's now closed, we can stop here.
            if ($draft.find('.fa-chevron-up').length) {
                return;
            }

            // Otherwise, load the message and show it.
            return $.get(laroute.route('ticket.operator.message.showJson', {id: $draft.data('message-id')}))
                .done(function (ajax) {
                    // Load draft message.
                    $draft.find('.sp-draft-message-content-body').html(ajax.data.purified_text);
                })
                .catch(function (error) {
                    if (error.status === 404 || error.status === 403) {
                        $draft.remove();
                    } else {
                        // User should retry expanding the draft.
                        $draft.find('.sp-draft-message-content').toggleClass('sp-hidden');
                        $draft.find('.sp-chevron i').toggleClass('fa-chevron-down fa-chevron-up');
                    }
                });
        });

    // Apply macro
    $('.apply-macro').on('click', function() {
        var text = he.encode($(this).text()),
            description = he.encode($(this).data('description')),
            data = $(this).data('macro');

        // Show the alert
        Swal.fire({
            title: Lang.get('ticket.run_macro'),
            html: Lang.get('ticket.run_macro_desc', {'macro': text, 'description': description}),
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3B91CE",
            confirmButtonText: Lang.get('general.run'),
            showLoaderOnConfirm: true,
            preConfirm: function () {
                return applyMacro(data);
            },
            allowOutsideClick: function () {
                return ! Swal.isLoading();
            }
        });
    });

    // Reply all
    $('.reply-all .sp-dropdown li').on('click', function () {
        var value = $(this).data('value');

        // Update reply_all input
        $('input[name="reply_all"]').val(value);

        // Change active dropdown option
        $(this).parent().find('li').removeClass('sp-selected');
        $(this).addClass('sp-selected');

        // Update icon in button and show/hide CC emails based on value
        $(this).parents('.reply-all').find('.sp-action .sp-icon').removeClass('fa-reply fa-reply-all');
        if (value == '1') {
            $(this).parents('.reply-all').find('.sp-action .sp-icon').addClass('fa-reply-all');
            $('.sp-reply-all-recipients, .cc-emails').removeClass('sp-hidden');
            $('.sp-reply-recipients').addClass('sp-hidden');
        } else {
            $(this).parents('.reply-all').find('.sp-action .sp-icon').addClass('fa-reply');
            $('.sp-reply-all-recipients, .cc-emails').addClass('sp-hidden');
            $('.sp-reply-recipients').removeClass('sp-hidden');
        }
    });

    // Expand recipients list to full form for editing
    $('.sp-simplified-recipients').on('click', function () {
        $('.sp-simplified-recipients, .sp-full-recipients').toggleClass('sp-hidden');

        $('.reply-all').prependTo('.to-emails')
            .addClass('sp-inline-block')
            .find('.sp-action')
            .toggleClass('sp-m-1 sp-mr-2');
    });

    // From email input
    var fromSelectizeConfig = {
        persist: false,
        dropdownParent: 'body',
        plugins: ['disableDelete']
    };
    $('select[name="department_email"]').selectize(fromSelectizeConfig);
    ticket.ccSelectize();

    // Show CC email input
    $('.add-cc').on('click', function() {
        $('.add-cc, .cc-emails').toggleClass('sp-hidden');
    });

    // Show BCC email input
    $('.add-bcc').on('click', function() {
        $('.add-bcc, .bcc-emails').toggleClass('sp-hidden');
    });

    /**
     * Initialise Forward tab.
     */
    var userSearchSelectizeConfig = {
            render: {
                item: function(item, escape) {
                    return '<div class="item' + (item.unremovable ? ' unremovable' : '') + '">' + escape(item.value) + '</div>';
                },
                option: function(item, escape) {
                    return '<div>' +
                        '<img class="sp-avatar sp-max-w-2xs" src="' + escape(item.avatar_url) + '" /> &nbsp;' +
                        escape(item.formatted_name) + (item.organisation ? ' (' + escape(item.organisation || '') + ')' : '') +
                        (item.email ? '<br /><span class="sp-description">' + escape(item.email || '') + '</span>' : '') +
                        '</div>';
                }
            },
            load: function(query, callback) {
                if (!query.length) return callback();

                // Hide Add CC / Add BCC to stop spinner from overlapping.
                var $elements = $('.add-cc:visible, .add-bcc:visible');
                $elements.hide();

                // Search for users
                $.get(laroute.route('user.operator.search'), { brand_id: ticket.parameters().brandId, q: query })
                    .done(function(res) {
                        res.data = res.data.map(function(value) {
                            // Add needed info for search and selected item to work.
                            value.value = value.email;
                            value.text = value.firstname + ' ' + value.lastname + ' <' + value.email + '>';
                            return value;
                        });

                        callback(res.data);
                    })
                    .fail(function() { callback(); })
                    .always(function () {
                        $elements.show();
                    });
            }
        },
        $forwardFromSelectize = $('select[name="from_address"]').selectize(fromSelectizeConfig),
        $forwardToSelectize = $('select[name="to_address[]"]').selectize($.extend({ }, emailSelectizeConfig(ticket.defaultSelectizePlugins()), userSearchSelectizeConfig)),
        $forwardCcSelectize = $('select[name="cc_address[]"]').selectize($.extend({ }, emailSelectizeConfig(ticket.defaultSelectizePlugins()), userSearchSelectizeConfig)),
        $forwardBccSelectize = $('select[name="bcc_address[]"]').selectize($.extend({ }, emailSelectizeConfig(ticket.defaultSelectizePlugins()), userSearchSelectizeConfig));

    /**
     * Edit user on ticket
     */
    $('.edit-user').on('click', function() {
        $('.update-user').toggle();
    });
    $userSelectize = $('select[name="user"]').selectize({
        valueField: 'id',
        labelField: 'formatted_name',
        searchField: [ 'formatted_name', 'email' ],
        placeholder: Lang.get('user.search_for_user_operator'),
        create: false,
        render: {
            optgroup_header: function(item, escape) {
                return '<div class="optgroup_header sp-px-3 sp-py-3/2 sp-font-bold">' + escape(item.label) + '</div>';
            },
            option: function(item, escape) {
                return '<div>' +
                    '<img class="sp-avatar sp-max-w-2xs" src="' + escape(item.avatar_url) + '" /> &nbsp;' +
                    escape(item.formatted_name) + (item.organisation ? ' (' + escape(item.organisation || '') + ')' : '') +
                    (item.email ? '<br /><span class="sp-description">' + escape(item.email || '') + '</span>' : '') +
                    '</div>';
            }
        },
        load: function(query, callback) {
            if (!query.length) return callback();

            var self = this;

            $.get(laroute.route('user.operator.search'), {
                q: query,
                brand_id: ticket.parameters().brandId,
                operators: 1
            })
                .done(function(res) {
                    self.addOptionGroup(Lang.choice('user.user', 1), { label: Lang.choice('user.user', 2) });
                    self.addOptionGroup(Lang.choice('general.operator', 1), { label: Lang.choice('general.operator', 2) });
                    self.refreshOptions();
                    callback(res.data);
                })
                .fail(function() { callback(); });
        },
        onChange: function(value) {
            if (value) {
                // Attempt to update user
                updateTicket($('select[name="user"]').serializeArray());
            }
        }
    });

    /**
     * Create new user and update ticket.
     */
    $('.create-new-user .new-user-toggle').on('click', function() {
        // Toggle the form
        $('form.new-user-form').toggle();

        // Submit form
        $('form.new-user-form button').on('click', function () {
            var $button = $(this);
            $button.prop('disabled', true);

            $.ajax({
                url: laroute.route('ticket.operator.action.newuser'),
                type: 'POST',
                data: $('form.new-user-form').serializeArray(),
                success: function(response) {
                    if (response.status == 'success') {
                        // We need to update a lot of details on the page. Quick fix, refresh the page.
                        window.location.reload();

                        // Show success message while page loads
                        $('.sp-ticket-update.sp-alert-success').show(500).delay(5000).hide(500);
                    } else {
                        Swal.fire(Lang.get('messages.error'), response.message, 'error');

                        $button.prop('disabled', false);
                    }
                }
            }).fail(function() {
                Swal.fire(
                    Lang.get('messages.error'),
                    Lang.get('messages.error_created', { item: Lang.get('general.record') }),
                    'error'
                );

                $button.prop('disabled', false);
            });
        });
    });

    /**
     * Selecting organisation for new user form.
     */
    $('form.new-user-form select[name="organisation"]').selectize({
        valueField: 'id',
        labelField: 'name',
        searchField: 'name',
        create: true,
        placeholder: Lang.choice('user.organisation', 1),
        allowEmptyOption: true,
        load: function(query, callback) {
            if (!query.length) return callback();
            $.ajax({
                url: laroute.route('user.organisation.search'),
                type: 'GET',
                dataType: 'json',
                data: {
                    q: query,
                    brand_id: ticket.parameters().brandId
                },
                error: function() {
                    callback();
                },
                success: function(res) {
                    callback(res.data);
                }
            });
        },
        onChange: function(value) {
            // We want to set a separate input if they enter an existing organisation.
            if (value.length > 0 && value !== this.getOption(value)[0].textContent) {
                $('form.new-user-form input[name="organisation_id"]').val(value);
            } else {
                $('form.new-user-form input[name="organisation_id"]').val("");
            }
        }
    });

    /**
     * Add tag on ticket
     */
    $tagSelectize = $('.assign-tags').selectize({
        plugins: ['remove_button'],
        valueField: 'original_name',
        labelField: 'name',
        searchField: [ 'name' ],
        create: tagPermission ? true : false,
        createFilter: function(input) {
            return input.length <= 45;
        },
        maxItems: null,
        placeholder: Lang.get('ticket.type_in_tags') + '...',
        render: {
            item: function(item, escape) {
                return '<div class="item" style="background-color: ' + escape(item.colour) + '; color: ' + escape(item.colour_text) + '">'
                    + escape(item.name)
                    + '</div>';
            },
            option: function(item, escape) {
                return '<div>'
                    + '<i class="fas fa-circle" style="color: ' + escape(item.colour) +'"></i>'
                    + '&nbsp; ' + escape(item.name)
                    + '</div>';
            }
        },
        load: function(query, callback) {
            if (!query.length) return callback();

            $.get(laroute.route('ticket.operator.tag.search'), { q: query })
                .done(function(res) { callback(res.data); })
                .fail(function() { callback(); });
        },
        onChange: function(tags) {
            if (!tags) {
                // In case of removing all tags
                tags = [];
            }
            // Detach and re-attach the list of assigned tags
            $.post(laroute.route('ticket.operator.ticket.assignTags', { id: ticket.parameters().ticketId }), { 'tags': tags } )
                .done(function(data) {
                    if (data.status == 'success') {
                        $('.sp-ticket-update.sp-alert-success').show(500).delay(5000).hide(500);
                        return;
                    }

                    // Else, an error occurred
                    $('.sp-ticket-update.sp-alert-error').show(500).delay(5000).hide(500);
                })
                .fail(function(data) {
                    $('.sp-ticket-update.sp-alert-error').show(500).delay(5000).hide(500);
                });
        }
    });

    /**
     * Assign operator to ticket
     */
    $assignSelectize = $('#assignOperator').selectize({
        plugins: ['remove_button'],
        valueField: 'id',
        labelField: 'formatted_name',
        searchField: [ 'formatted_name', 'email' ],
        create: false,
        maxItems: null,
        placeholder: Lang.get('ticket.assign_operator') + '...',
        render: {
            item: function(item, escape) {
                return '<div class="item">'
                    + '<img class="sp-avatar sp-max-w-3xs" src="' + escape(item.avatar_url) + '" />&nbsp; '
                    + escape(item.formatted_name)
                    + '</div>';
            },
            option: function(item, escape) {
                return '<div>'
                    + '<img class="sp-avatar sp-max-w-2xs" src="' + escape(item.avatar_url) + '" />&nbsp; '
                    + escape(item.formatted_name)
                    + '</div>';
            }
        },
        load: function(query, callback) {
            if (!query.length) return callback();

            // Set the route for the current department
            var route = laroute.route('ticket.operator.department.search', { id: $('select[name="department"]').val() });

            $.get( route, { s: query, brand_id: ticket.parameters().brandId })
                .done(function(res) { callback(res.data); })
                .fail(function() { callback(); });
        },
        onChange: function(assigned_operators) {
            if (!assigned_operators) {
                // In case of removing all operators
                assigned_operators = [];
            }
            // Detach and re-attach the list of assigned operators
            $.post( laroute.route('ticket.operator.action.assign'), { ticket: ticket.parameters().ticketId, operator: assigned_operators, replace: true } )
                .done(function(data) {
                    if (data.status == 'success') {
                        $('.sp-ticket-update.sp-alert-success').show(500).delay(5000).hide(500);

                        polling.runNow();

                        return;
                    }

                    // Else, an error occurred
                    $('.sp-ticket-update.sp-alert-error').show(500).delay(5000).hide(500);
                })
                .fail(function(data) {
                    $('.sp-ticket-update.sp-alert-error').show(500).delay(5000).hide(500);
                });
        }
    });

    /**
     * Linked Tickets
     */
    $(document).on('click', '.add-link', function () {
        TicketAction.link(ticket.parameters().ticketId)
            .then(function (result) {
                if (result.value) {
                    $('.sp-ticket-update.sp-alert-success').show(500).delay(5000).hide(500);

                    // Update linked tickets list
                    $('.linked-tickets-list').html(result.value.data);

                    // Update log
                    ticket.updateLogTable();
                }
            });
    });

    $(document).on('click', '.linked-tickets .unlink', function () {
        var $this = $(this);

        $.ajax({
            url: $this.data('route'),
            type: 'POST',
            data: { 'ticket': ticket.parameters().ticketId + ',' + $this.data('id') },
            dataType: 'json'
        }).done(function(response) {
            if (response.status == 'success') {
                $('.sp-ticket-update.sp-alert-success').show(500).delay(5000).hide(500);

                // Update linked tickets list
                $('.linked-tickets-list').html(response.data);

                // Update log
                ticket.updateLogTable();
            } else {
                $('.sp-ticket-update.sp-alert-error').show(500).delay(5000).hide(500);
            }
        }).fail(function() {
            $('.sp-ticket-update.sp-alert-error').show(500).delay(5000).hide(500);
        });
    });

    // Load ticket log table on clicking tab for first time
    $(document).on('click', '.sp-tabs #Log', function () {
        if (! ticket.isLogTableLoaded()) {
            // Load table (force it)
            ticket.updateLogTable(true);
        }
    });

    // Load escalation rules table on clicking tab for first time
    $(document).on('click', '.sp-tabs #EscalationRules', function () {
        if (! ticket.isEscalationsTableLoaded()) {
            // Load table (force it)
            ticket.updateEscalationsTable(true);
        }
    });

    /*
     * FOLLOW UP TAB
     */

    // Load follow up tab for the first time.
    $(document).on('click', '.sp-tabs #Followup', function () {
        // The #FollowUp node will be empty if we haven't loaded it before.
        if ($('#tabFollowup').is(':empty')) {
            refreshFollowUpTab();
        }
    });

    // Follow up is active, show the follow up tab.
    $(document).on('click', '.view-followup', function () {
        $('li#Followup').trigger('click');
    });

    var setDateType = function() {
        if ($(this).val() == 0) {
            $('.followup-exact').show().find(':input').prop('disabled', false);
            $('.followup-difference').hide().find(':input').prop('disabled', 'disabled');
        } else {
            $('.followup-exact').hide().find(':input').prop('disabled', 'disabled');
            $('.followup-difference').show().find(':input').prop('disabled', false);
        }
    };

    $(document).on('change', 'input[name="date_type"]', setDateType);

    // Show add follow up form.
    $(document).on('click', '.add-followup', function () {
        $('form.followup-form').show();
        $('.followup-table').hide();
    });

    $(document).on('click', '.cancel-followup', function() {
        refreshFollowUpTab();
    });

    $(document).on('click', '.edit-followup', function() {
        // Reload follow up tab with edit form
        refreshFollowUpTab($(this).data('id'));
    });

    $(document).on('click', '.save-followup', function() {
        var $button = $(this),
            saveFollowUp = function ($button) {
                // Disable button
                $button.prop('disabled', true);

                var data = $('.followup-form').serializeArray();
                data.push({ name: 'ticket', value: ticket.parameters().ticketId });

                // Post updated data
                return $.ajax({
                    url: $('.followup-form').data('uri'),
                    type: $('.followup-form').data('method'),
                    data: data,
                    dataType: 'json'
                }).done(function(response) {
                    if (response.status == 'success') {
                        $('.sp-ticket-update.sp-alert-success').show(500).delay(5000).hide(500);

                        // Show warning message
                        $('.followup-warning').show().find('span').html(response.message);

                        // Reload follow up tab
                        refreshFollowUpTab();
                    } else {
                        $('.sp-ticket-update.sp-alert-error').show(500).delay(5000).hide(500);

                        // Re-enable button
                        $(this).prop('disabled', false);
                    }

                    return response;
                }).fail(function() {
                    $('.sp-ticket-update.sp-alert-error').show(500).delay(5000).hide(500);

                    // Re-enable button
                    $button.prop('disabled', false);
                });
            };

        if ($('table.rule-table tr.rule:visible').length === 0) {
            // Show the alert
            Swal.fire({
                title: Lang.get('messages.are_you_sure'),
                html: Lang.get('ticket.follow_up_no_actions'),
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#e74c3c",
                confirmButtonText: Lang.get('messages.yes_im_sure'),
                showLoaderOnConfirm: true,
                preConfirm: function () {
                    return saveFollowUp($button)
                },
                allowOutsideClick: function () {
                    return !Swal.isLoading();
                }
            });
        } else {
            saveFollowUp($button);
        }
    });

    $(document).on('click', '.delete-followup', function() {
        var $followUp = $(this).data('id');

        var params = {
            ajax: {
                url: laroute.route('ticket.operator.followup.destroy', {'followup': $followUp})
            }
        };
        (new deleteAlert(params))
            .fireDefault(Lang.get('ticket.follow_up'))
            .then(function (result) {
                if (result.value) {
                    $('.sp-ticket-update.sp-alert-success').show(500).delay(5000).hide(500);

                    // Update warning message or hide it if no more follow ups.
                    if (result.value.message != null && result.value.message.length > 0) {
                        $('.followup-warning').show().find('span').html(result.value.message);
                    } else {
                        $('.followup-warning').hide();
                    }

                    // Reload table
                    $('#tabFollowup .dataTable').dataTable().api().ajax.reload();
                }
            });
    });

    function updateTicket(data) {
        // Disable buttons and dropdowns
        var selector = '#sidebar button, #sidebar select',
            $disabled = $(selector).filter(':disabled');
        $(selector).prop('disabled', true);

        // Add ticket ID
        data.push({ name: 'ticket', value: ticket.parameters().ticketId });

        // Post updated data
        $.post(
            laroute.route('ticket.operator.action.update'),
            data,
            function(response) {
                if (response.status == 'success') {
                    $('.sp-ticket-update.sp-alert-success').show(500).delay(5000).hide(500);
                    // Update log
                    ticket.updateLogTable();
                    // Specific case for updating user
                    if (response.message != 'undefined' && response.message == 'ticket_user_updated') {
                        $('.edit-user').text(response.data);
                        $('.update-user').hide();

                        // We need to update a lot of details on the page. Quick fix, refresh the page.
                        window.location.reload();

                        // Show success message while page loads
                        $('.sp-ticket-update.sp-alert-success').show(500).delay(5000).hide(500);
                    }

                    polling.runNow();
                } else {
                    $('.sp-ticket-update.sp-alert-error').show(500).delay(5000).hide(500);
                }
            }, "json").fail(function() {
            $('.sp-ticket-update.sp-alert-error').show(500).delay(5000).hide(500);
        }).always(function() {
            // Enable buttons and dropdowns
            $(selector).not($disabled).prop('disabled', false);
        });
    }

    function ticketAction(route, data) {
        // Disable buttons and dropdowns
        var selector = '.sp-quick-actions button, #sidebar button, #sidebar select',
            $disabled = $(selector).filter(':disabled');
        $(selector).prop('disabled', true);

        // Post data to perform action
        $.post(
            route,
            $.extend(data || {}, { ticket: ticket.parameters().ticketId }),
            function(response) {
                if (response.status == 'success') {
                    $('.sp-ticket-update.sp-alert-success').show(500).delay(5000).hide(500);
                    // Update log
                    ticket.updateLogTable();

                    polling.runNow();
                } else {
                    $('.sp-ticket-update.sp-alert-error').show(500).delay(5000).hide(500);
                }
            }, "json").fail(function() {
            $('.sp-ticket-update.sp-alert-error').show(500).delay(5000).hide(500);
        }).always(function() {
            // Enable buttons and dropdowns
            $(selector).not($disabled).prop('disabled', false);
        });
    }

    function changeDepartment(data) {
        // Disable buttons and dropdowns
        var selector = '.sp-quick-actions button, #sidebar button, #sidebar select',
            $disabled = $(selector).filter(':disabled');
        $(selector).prop('disabled', true);

        // Post data to perform action
        $.post(
            laroute.route('ticket.operator.action.department'),
            $.extend(data || {}, { ticket: ticket.parameters().ticketId }),
            function(response) {
                if (response.status == 'success') {
                    $('.sp-ticket-update.sp-alert-success').show(500).delay(5000).hide(500);

                    // Check we're still allowed to view ticket.
                    if (! response.data.operator_can_view) {
                        window.location.reload(); // Reload, this will redirect back to the grid with an error message.
                        return;
                    }

                    // Update log
                    ticket.updateLogTable();

                    // Update assigned operators and remove operators from the dropdown that are no longer assigned.
                    $assignSelectize[0].selectize.loadedSearches = {};
                    $assignSelectize[0].selectize.setValue(response.data.assigned, true);
                    $.each($assignSelectize[0].selectize.options, function (index, value) {
                        if ($.inArray(value.id, response.data.assigned) === -1) {
                            $assignSelectize[0].selectize.removeOption(value.id);
                        }
                    });
                    $assignSelectize[0].selectize.refreshOptions(false);

                    polling.runNow();

                    // If the ticket has a department email dropdown
                    var first,
                        $fromSelectize = $('select[name="department_email"]');
                    if ($fromSelectize.length) {
                        // Update department emails list
                        first = null;
                        $fromSelectize[0].selectize.clearOptions();
                        $.each(response.data.emails, function (index, value) {
                            if (first === null) first = index;
                            $fromSelectize[0].selectize.addOption({value: index, text: value});
                            $fromSelectize[0].selectize.refreshOptions(false);
                        });
                        // Select first option
                        $fromSelectize[0].selectize.addItem(first, true);
                    }

                    // Update the forward department email list.
                    var $forwardFromSelectize = $('select[name="from_address"]');
                    if ($forwardFromSelectize.length) {
                        first = null;

                        // Get the "me" option.
                        var me = $('select[name="from_address"]')[0].selectize.options.me;

                        // Reset the list.
                        $forwardFromSelectize[0].selectize.clearOptions();
                        $.each(response.data.emails, function (index, value) {
                            if (first === null) first = index;
                            $forwardFromSelectize[0].selectize.addOption({value: index, text: value});
                            $forwardFromSelectize[0].selectize.refreshOptions(false);
                        });

                        // Add "me" option back.
                        $forwardFromSelectize[0].selectize.addOption({value: me.value, text: me.text});
                        $forwardFromSelectize[0].selectize.refreshOptions(false);

                        // Select first option
                        $forwardFromSelectize[0].selectize.addItem(first, true);
                    }

                    // Update custom fields
                    if (typeof response.data.customfields != 'undefined') {
                        $('#sidebar .customfields').html(response.data.customfields);

                        // Just check to see if we have any custom fields for this department
                        if ($('#sidebar .customfields').html().trim() == '') {
                            // None - hide custom fields box
                            $('#sidebar .customfields').parents('.sidebox').hide();
                        } else {
                            // We do - show custom fields box
                            $('#sidebar .customfields').parents('.sidebox').show();
                            // Enable hide/show password toggle and textarea redactor if needed
                            $('input[type=password]').hideShowPassword();
                            customfieldRedactor();
                        }
                    }

                    // Update department templates.
                    departmentTemplates = response.data.templates;
                    // Force run that code that checks if we can send the email to user/operators, by mocking events.
                    $('.message-form select[name="to_status"]').trigger('change');

                    // Refresh follow up tab
                    refreshFollowUpTab();
                } else {
                    $('.sp-ticket-update.sp-alert-error').show(500).delay(5000).hide(500);
                }
            }, "json").fail(function() {
            $('.sp-ticket-update.sp-alert-error').show(500).delay(5000).hide(500);
        }).always(function() {
            // Enable buttons and dropdowns
            $(selector).not($disabled).prop('disabled', false);
        });
    }

    function restoreTicket() {
        $.ajax({
            url: laroute.route('ticket.operator.action.restore'),
            type: 'POST',
            data: { ticket: ticket.parameters().ticketId },
            dataType: 'json'
        }).done(function(response) {
            if (response.status == 'success') {
                // Reload ticket.
                window.location.reload();

                // Show success message while page loads
                $('.sp-ticket-update.sp-alert-success').show(500).delay(5000).hide(500);
            } else {
                $('.sp-tickets-update.sp-alert-error').show(500).delay(5000).hide(500);
            }
        }).fail(function() {
            $('.sp-tickets-update.sp-alert-error').show(500).delay(5000).hide(500);
        });
    }

    function deleteTicket(block, force) {
        var type = block ? 'POST' : 'DELETE',
            route = block ? laroute.route('ticket.operator.action.block') :
                (force ? laroute.route('ticket.operator.action.destroy') : laroute.route('ticket.operator.action.trash')),
            successMessage = force ? 'messages.success_deleted' : 'messages.success_trashed',
            errorMessage = force ? 'messages.error_deleted' : 'messages.error_trashed';

        var success = function () {
            Swal.fire(
                Lang.get('messages.success'),
                Lang.get(successMessage, { item: Lang.get('general.record') }),
                'success'
            );

            window.location.href = ticket.parameters().ticketGridUrl;
        };

        var ajaxParams = {
            url: route,
            type: type,
            data: {ticket: ticket.parameters().ticketId}
        };
        if (force) {
            (new deleteAlert({ ajax: ajaxParams }))
                .fireDefault(Lang.choice('ticket.ticket', 1), '', deleteRelations)
                .then(function (result) {
                    if (result.value) {
                        success();
                    }
                });
        } else {
            $.ajax(ajaxParams)
                .then(function (response) {
                    if (response.status == 'success') {
                        return success();
                    }

                    throw new Error(response.statusText);
                })
                .catch(function () {
                    Swal.fire(
                        Lang.get('messages.error'),
                        Lang.get(errorMessage, { item: Lang.get('general.record') }),
                        'error'
                    );
                });
        }
    }

    function applyMacro(macroId) {
        var data = {
            macro: macroId,
            ticket: ticket.parameters().ticketId
        };

        return $.post(laroute.route('ticket.operator.macro.apply'), data)
            .then(function (response) {
                if (response.status == 'success') {
                    $('.sp-ticket-update.sp-alert-success').show(500).delay(5000).hide(500);
                    if (response.data.deleted) {
                        // Deleted ticket - go back to ticket grid
                        setTimeout(function() {
                            window.location.href = ticket.parameters().ticketGridUrl;
                        }, 2000);
                    } else {
                        // Update log
                        ticket.updateLogTable();

                        polling.runNow(true);
                    }

                    return response;
                }

                throw new Error(response.statusText);
            })
            .catch(function () {
                $('.sp-ticket-update.sp-alert-error').show(500).delay(5000).hide(500);
            });
    }

    function refreshFollowUpTab(edit) {
        // If we want to edit a follow up.
        edit = (typeof edit === 'undefined') ? 0 : edit;

        // Show loading icon
        $('#tabFollowup').html('<i class="fas fa-spinner fa-pulse fa-fw"></i>');

        // Fetch view
        $.get(
            laroute.route('ticket.operator.followup.render', {id: ticket.parameters().ticketId, edit: edit}), { },
            function(response) {
                if (response.status == 'success') {
                    // Update form
                    $('#tabFollowup').html(response.data);

                    // Initialise date picker.
                    $('.datepicker').datepicker();

                    // Initialise sortable.
                    $("#sortable").sortable({
                        draggable: '.rule',
                        ghostClass: 'sp-opacity-50',
                        handle: '.sp-sortable-handle',
                    });

                    // Initialise timepicker.
                    $('.followup-form')
                        .find('.timepicker')
                        .timepicker();

                    // Handle rules on refreshing tab, this will call code in escalationrule.js
                    $(".rule:first :input").prop('disabled', true);
                    $('.rule').filter(function() { return $(this).css("display") != "none"; }).find('.rule-action select').trigger('change');
                } else {
                    // Show message to refresh
                    $('#tabFollowup').html(Lang.get('messages.please_refresh'));
                }
            }, "json").fail(function() {
            // Show message to refresh
            $('#tabFollowup').html(Lang.get('messages.please_refresh'));
        });
    }

    /*
     * Polling for new messages & other ticket related updates
     */
    var $tagSelectize, $assignSelectize;

    function PollReplies(milliseconds)
    {
        var lastReplyPoll, loopTimer, xhr,
            startAfterTimer,
            instance = this;

        this.runNow = function (allMessages) {
            instance.stop();

            void 0;

            return xhr = $.ajax({
                url: laroute.route('ticket.operator.message.poll'),
                data: {
                    ticket_id: ticket.parameters().ticketId,
                    lastPoll: lastReplyPoll,
                    // Fetch all messages (included authed user) or just other users
                    all: (typeof allMessages === 'undefined') ? 0 : 1
                },
                success: function(response) {
                    // If there are notifications, show them
                    if (response.status == 'success' && typeof response.data != 'undefined' && response.data !== null) {
                        if (response.data.messages.length) {
                            // Add each message
                            $.each(response.data.messages, function (index, value) {
                                ticket.insertMessage(value);
                            });

                            $('form.message-form').trigger("supportpal.polled_messages");
                        }

                        // If the browser supports, it enable the download all attachments function.
                        if (ZipFile.isSupported()) {
                            $('#tabMessages').find('ul.sp-attachments').each(function () {
                                if ($(this).find('li').length > 1) {
                                    $(this).find('.sp-download-all').show();
                                }
                            });
                        }

                        // Show other operators viewing ticket
                        $('.ticket-viewing').replaceWith(response.data.viewing).show(500);
                        // Depending on view, add margin to top or bottom of content area if visible (code in mobile.js)
                        $(window).trigger('resize');

                        // Show other operator's draft
                        $.each(response.data.drafts, function (type, value) {
                            var elements = { 0: $(".message-form"), 1: $(".notes-form"), 2: $(".forward-form") },
                                $draftsElm = elements[type].find('.sp-drafts'),
                                $draftIcon = $('.sp-reply-type .sp-action[data-type=' + type + '] .sp-other-draft-icon');

                            // Remove drafts which were not returned in the response.
                            $draftsElm.find('.sp-draft-message').each(function () {
                                var id = $(this).data('message-id');
                                if (typeof value[id] === "undefined") {
                                    $(this).remove();
                                    $draftIcon.addClass('sp-hidden');
                                }
                            });

                            // Show new drafts, and update existing ones.
                            $.each(value, function (id, message) {
                                var $message = $draftsElm.find('.sp-draft-message[data-message-id=' + id + ']');
                                if ($message.length > 0) {
                                    $message.find('.sp-draft-updated-at').html(message.model.updated_at);

                                    // If the draft message is visible, update the content (via AJAX).
                                    // If it's not visible, when the draft is expanded, it will automatically refresh via AJAX.
                                    var $content = $message.find('.sp-draft-message-content');
                                    if ($content.hasClass('sp-hidden') === false) {
                                        $message.trigger('click').trigger('click');
                                    }
                                } else {
                                    $draftsElm.append(message.template);
                                }

                                $draftIcon.removeClass('sp-hidden');
                            });
                        });

                        // Update ticket details
                        $('.last-action').html(response.data.details.updated_at);
                        if (response.data.details.update) {
                            // Update subject
                            $('.sp-ticket-subject').text(response.data.details.subject);
                            $('.sp-edit-subject').val(response.data.details.subject);

                            // Update sidebar items
                            $('.edit-user').html(response.data.details.user);
                            $('select[name="department"]').val(response.data.details.department);
                            $('select[name="priority"]').val(response.data.details.priority);

                            // Update status in sidebar
                            if ($('select[name="status"]').val() != response.data.details.status) {
                                $('select[name="status"]').val(response.data.details.status);

                                // Update the status dropdown in the notes box (only if it's changed)
                                $('.notes-form, .forward-form').find('select[name="to_status"]').val(response.data.details.status);
                            }

                            $tagSelectize[0].selectize.clear(true);
                            $tagSelectize[0].selectize.refreshOptions(false);
                            $.each(response.data.details.tags, function(index, value) {
                                $tagSelectize[0].selectize.addOption({ id: value.id, name: value.name, original_name: value.original_name, colour: value.colour, colour_text: value.colour_text });
                                $tagSelectize[0].selectize.refreshOptions(false);
                                $tagSelectize[0].selectize.addItem(value.original_name, true);
                            });

                            $assignSelectize[0].selectize.clear(true);
                            $assignSelectize[0].selectize.refreshOptions(false);
                            $.each(response.data.details.assigned, function(index, value) {
                                $assignSelectize[0].selectize.addOption({ id: value.id, formatted_name: value.formatted_name, avatar_url: value.avatar_url });
                                $assignSelectize[0].selectize.refreshOptions(false);
                                $assignSelectize[0].selectize.addItem(value.id, true);
                            });

                            if (typeof ticket.ccSelectize()[0] !== 'undefined') {
                                // We need to keep a list of the 'unremovable' options so they get added back properly.
                                var options = [];
                                $.each(ticket.ccSelectize()[0].selectize.options, function (index, option) {
                                    if (typeof option.unremovable !== 'undefined' && option.unremovable) {
                                        options.push(option);
                                    }
                                });
                                $.each(response.data.details.cc, function (index, value) {
                                    options.push({ text: value, value: value });
                                });
                                ticket.ccSelectize()[0].selectize.clear(true);
                                ticket.ccSelectize()[0].selectize.refreshOptions(false);
                                $.each(options, function (index, value) {
                                    ticket.ccSelectize()[0].selectize.addOption(value);
                                    ticket.ccSelectize()[0].selectize.refreshOptions(false);
                                    ticket.ccSelectize()[0].selectize.addItem(value.value, true);
                                });
                            }

                            $('select[name="slaplan"]').val(response.data.details.sla_plan);
                            $('.edit-duetime').html(response.data.details.due_time);
                            // If it says 'set a due time', hide the trash can icon, else show it
                            if (response.data.details.due_time == Lang.get('ticket.set_due_time')) {
                                $('.update-duetime .remove-duetime').hide();
                            } else {
                                $('.update-duetime .remove-duetime').show();
                            }

                            // Update reply options status and if closed, hide close button
                            if (response.data.details.status == closedStatusId) {
                                $('.close-ticket').addClass('hide');
                            } else {
                                $('.close-ticket').removeClass('hide');
                            }

                            // Show/hide take button depending if self is assigned to ticket and only one assigned.
                            var assigned = response.data.details.assigned.some(function(obj) {
                                return obj.hasOwnProperty('id') && obj['id'] == operatorId;
                            });
                            if (assigned && response.data.details.assigned.length === 1) {
                                $('.take-ticket').addClass('hide');
                            } else {
                                $('.take-ticket').removeClass('hide');
                            }

                            // If locked, show unlock button instead
                            if (response.data.details.locked) {
                                $('.lock-ticket').addClass('hide');
                                $('h1 .fa-lock, .unlock-ticket').removeClass('hide');
                            } else {
                                $('.lock-ticket').removeClass('hide');
                                $('h1 .fa-lock, .unlock-ticket').addClass('hide');
                            }

                            // Update log and escalation rules tables
                            ticket.updateLogTable();
                            ticket.updateEscalationsTable();
                        }

                        // Update custom fields
                        if (typeof response.data.customfields != 'undefined') {
                            $('#sidebar .customfields').html(response.data.customfields);
                            // Enable hide/show password toggle, textarea redactor and flatpickr if needed
                            $('input[type=password]').hideShowPassword();
                            customfieldRedactor();
                            $('.datepicker').datepicker();
                        }

                        $('#sidebar').trigger('refreshedSidebar');

                        // Refresh timeago.
                        if (typeof timeAgo !== 'undefined') {
                            timeAgo.render($('time.timeago'));
                        }
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
     * END polling of new messages
     */

    function Form() {
        /**
         * Key, value pair of editors which have been initialised.
         * Key is the text editor element ID. Value is bool (initialised or not).
         *
         * @type {{}}
         */
        var editors = {};

        var initEditor = function(selector, $form) {
            if (editors.hasOwnProperty(selector) && editors[selector] === true) {
                return;
            }

            editors[selector] = true;

            $(selector).redactor($.extend({}, ticket.defaultRedactorConfig(), {
                callbacks: {
                    started: function() {
                        loadEditorContent(selector, $form, this);
                    },
                    changed: function (html) {
                        var id = this.element.getElement().attr('id');

                        // Remove the error box if they've entered content.
                        if (! this.utils.isEmptyHtml(this.source.getCode())) {
                            $('#'+id+'-error').remove();
                        }
                    }
                }
            }));
        };

        var initFileUploads = function($form, name, params) {
            params = params || {};
            var defaults = {
                $element: $form.find('.sp-file-upload'),
                $container: $form,
                blueimp: {
                    dropZone: $form.find('.sp-attachment-dragover')
                }
            };

            ticket.setParameter(name, new FileUpload($.extend(true, {}, defaults, params)));
        };

        var loadEditorContent = function (selector, $form, editor) {
            var route = $(selector).data('route');
            if (typeof route !== 'string' || route === '') {
                return;
            }

            var $container = $form.find('.reply-form'),
                $preview = $('<div class="sp-editor-preview"></div>').hide();
            $container.append($preview);

            $preview.html('').css('height', '100%').addClass('loadinggif').show();

            $.get(route)
                .done(function (json) {
                    editor.insertion.set(json.data.purified_text);
                })
                .always(function () {
                    $preview.hide();
                });
        };

        this.initReplyForm = function () {
            var $form = $('.message-form');
            initFileUploads($form, 'replyFileUpload');
            initEditor('#newMessage', $form);
        };

        this.initNotesForm = function () {
            var $form = $('.notes-form');
            initFileUploads($form, 'notesFileUpload');
            initEditor('#newNote', $form);
        };

        this.initForwardForm = function () {
            var $form = $('.forward-form');
            initFileUploads($form, 'forwardFileUpload', {
                blueimp: {
                    cumulativeMaxFileSize: $form.data('cumulative-max-file-size'),
                }
            });
            initEditor('#newForward', $form);
        };
    }
});
