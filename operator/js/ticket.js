(function ($, window, document, undefined) {
  /**
   * Functions to handle a specific ticket.
   *
   * @param {object} parameters
   * @constructor
   */
  function Ticket(parameters) {
    "use strict";

    /**
     * Default parameters.
     *
     * @type {object}
     */
    var defaults = {
      ticketId: null,
      userId: null,
      brandId: null,
      departmentId: null,
      notesPosition: null,
      replyOrder: null,
      forwardFileUpload: null,
      ticketGridUrl: null,
      replyTemplate: '',
      selfservice: true
    };

    /**
     * Copy Link message identifiers.
     *
     * @type {string}
     */
    var NOTES_PLACEHOLDER = $('meta[name="notes-url-id"]').prop('content'),
      MESSAGE_PLACEHOLDER = $('meta[name="messages-url-id"]').prop('content');

    /**
     * Message drafts.
     *
     * @type {{newMessage: null, newNote: null, newForward: null}}
     */
    var drafts = {
      'newMessage': null,
      'newNote': null,
      'newForward': null
    };

    /**
     * If the Datatables have been loaded
     *
     * @type {object}
     */
    var datatablesLoaded = {
      'log': false,
      'escalationRules': false
    };

    /**
     * Default selectize plugins.
     *
     * @type {string[]}
     */
    var selectizePlugins = ['restore_on_backspace', 'remove_button', 'max_items'];

    /**
     * Queue to load messages synchronously, non blocking.
     */
    var messageDfd = $.Deferred(),
      messageDfdNext = messageDfd;
    messageDfd.resolve();

    /**
     * Show a success / failure message for a short period.
     */
    var showFeedback = function (failure) {
      failure = failure || false;
      if ($('.sp-ticket-update').length) {
        $('.sp-ticket-update.' + (failure ? 'sp-alert-error' : 'sp-alert-success')).show(500).delay(5000).hide(500);
      } else {
        if (failure) {
          Swal.fire(Lang.get('messages.error'), Lang.get('messages.general_error'), 'error');
        }
      }
    };

    /**
     * Function to run every time a store / update message AJAX call is made.
     *
     * @param form
     */
    var always_message_handler = function (form) {
      // Reset form
      form.find('textarea').prop('disabled', false);
      form.find('input[type="submit"]').prop('disabled', false);

      // Remove draft related elements
      form.find('.draft-success, .discard-draft').hide();

      // If more than one message, show split ticket button and checkboxes
      if ($('.sp-message').length > 1) {
        $('span.split-ticket').removeClass('sp-hidden');
      }

      // If we have one or more CC email in the reply form, show the reply-all button, else hide it (if it's there)
      if ($('.message-form .cc-emails').is(':visible')) {
        if (instance.ccSelectize()[0].selectize.getValue().length) {
          $('.message-form .recipients').addClass('with-cc');
          $('.message-form .recipients .reply-all').show();
        } else {
          $('.message-form .recipients').removeClass('with-cc');
          $('.message-form .recipients .reply-all').hide();
        }
      }
    };

    /**
     * Pre-process the createMessage and updateMessage form functions. This will return false
     * if the message should not be processed.
     *
     * @param $form
     * @param $textarea
     * @returns {boolean}
     */
    var handleMessageForm = function ($form, $textarea) {
      var textarea_id = $textarea.prop('id');
      if (tinymce.get(textarea_id)) {
        var editor = $textarea.editor(),
          content = editor.getContent({
            withoutCursorMarker: true
          }),
          message = null,
          isEmpty = content.length === 0,
          isTooLong = editor.settings.character_limit && content.length >= editor.settings.character_limit;

        // Validation.
        // We're using manual validation here because jquery validate does not support multiple fields with the
        // same name. We use the same name for replies and notes so this causes a problem.
        if (isEmpty) {
          message = Lang.get('validation.required', {
            'attribute': Lang.get('general.text').toLowerCase()
          });
        } else if (isTooLong) {
          message = Lang.get('validation.max.string', {
            'attribute': Lang.get('general.text').toLowerCase(),
            'max': editor.settings.character_limit
          });
        }
        if (message !== null) {
          var error_id = textarea_id + '-error';
          if ($("#" + error_id).length === 0) {
            $textarea.parents('.sp-form-row, .sp-message-text-edit').addClass('sp-input-has-error');
            $(editor.getContainer()).after('<span id="' + error_id + '" class="sp-input-error"></span>');
          }
          $('#' + error_id).text(message).show();
          return false;
        }
      }

      // Remove 'split' checkboxes from form data
      $form.find('input[name="split"]').remove();

      // We want to disable all textarea's except the one that we want to submit (otherwise serializeArray contains everything).
      $form.find('textarea:not(#' + textarea_id + ')').prop('disabled', true);

      // Disable the submit button, so they don't submit multiple messages.
      $form.find('input[type="submit"]').prop('disabled', true);
    };

    /**
     * Insert a message into the DOM.
     *
     * @param {string} html
     */
    this.insertMessage = function (html) {
      // Add message to right place
      var message,
        code = $(html);

      // Make the message visible.
      instance.showMessage(code);

      // It's a note and we need to show it somewhere else than messages block only.
      if (code.hasClass('sp-note') && (parameters.notesPosition === 0 || parameters.notesPosition === 1)) {
        // Show the headers (in case its first note)
        $('.notes-header, .messages-header').show();

        // Definitely want to add to notes area
        var place = $('.sp-messages-container[data-position="top"]');

        // Also want to add to message area
        if (parameters.notesPosition === 0) {
          place = place.add($('.sp-messages-container[data-position="inline"]'));
        }
        if (parameters.replyOrder == 'ASC') {
          // Add to end of block
          message = code.appendTo(place);
        } else {
          // Add to start of block
          message = code.prependTo(place);
        }
      } else {
        // We need to just show it in the messages block
        if (parameters.replyOrder == 'ASC') {
          // Add to end of messages block
          message = code.appendTo('.sp-messages-container[data-position="inline"]');
        } else {
          // Add to start of messages block
          message = code.prependTo('.sp-messages-container[data-position="inline"]');
        }
      }
      instance.initialiseMessage(message);
    };

    /**
     * Makes a message view visible (not collapsed).
     *
     * @param message
     */
    this.showMessage = function (message) {
      // Make the message visible.
      message.removeClass('sp-message-collapsed').addClass('sp-message-collapsible');
      message.find('.sp-message-text').children('.sp-message-text-trimmed').addClass('sp-hidden');
      message.find('.sp-message-text').children('.sp-message-text-original').removeClass('sp-hidden');

      // Remove expandable if appropriate.
      instance.removeExpandable(message);
    };

    /**
     * Highlight message and run through final loading of the message.
     *
     * @param message
     */
    this.initialiseMessage = function (message) {
      // Load attachment previews if needed.
      instance.loadAttachmentPreviews(message);
      instance.highlightUserMentions(message);

      // Show download all button for message if needed.
      instance.showDownloadAllButton();

      // Special effects, set as blue for 10 seconds.
      message.toggleClass('sp-new-message', 1000);
      setTimeout(function () {
        message.toggleClass('sp-new-message', 1000);
      }, 10000);

      // Update editor for editing this new message
      message.find('textarea').editor(instance.defaultEditorConfig());
    };

    /**
     * Create a new message reply to the user or new operator note.
     *
     * @param $form
     * @param $textarea
     * @returns {boolean}
     */
    this.createMessage = function ($form, $textarea) {
      var self = this;

      // Validation & remove unnecessary items from the form.
      if (handleMessageForm($form, $textarea) === false) {
        return false;
      }

      // Now that we've modified the form, add the ticket id to the POST data.
      var data = $form.serializeArray();
      data.push({
        name: 'text',
        value: this.normaliseMessage($textarea.editor().getContent({
          withoutCursorMarker: true
        }))
      });
      data.push({
        name: 'ticket[0]',
        value: $form.find(':input[name=ticket_id]').val()
      });
      $.ajax({
        url: laroute.route('ticket.operator.message.store'),
        type: 'POST',
        data: data,
        dataType: 'json'
      }).done(function (response) {
        if (response.status != 'success') {
          showFeedback(true);
          $form.trigger("supportpal.new_message:failed");
          return;
        }

        // Add message
        showFeedback();
        self.insertMessage(response.data.view);
        $form.trigger("supportpal.new_message:success", [$textarea]);

        // Only clear the editor if it's a tinymce instance
        if (tinymce.get($textarea.prop('id'))) {
          // Clear current text
          $textarea.editor().setContent('');
          var replyType = $form.find('input[name="reply_type"]').val();

          // Only add the reply template back to the message reply box (not notes).
          if (replyType == '1') {
            self.setNoteDraft($textarea.editor().getContent({
              withoutCursorMarker: true
            }));
          } else if (replyType == '2') {
            self.setForwardDraft($textarea.editor().getContent({
              withoutCursorMarker: true
            }));
          } else {
            $textarea.editor().setContent(parameters.replyTemplate);
            self.setMessageDraft($textarea.editor().getContent({
              withoutCursorMarker: true
            }));
          }

          // Remove draft icon in quick action
          $('.sp-reply-type .sp-action[data-type=' + replyType + '] .sp-draft-icon').addClass('sp-hidden');
        }

        // If posting a reply to the user, update the status in the notes and forwarding box.
        if ($form.find('input[name="reply_type"]').val() == '0') {
          $('.notes-form, .forward-form').find('select[name="to_status"]').val($('.message-form').find('select[name="to_status"]').val());
        }

        // Clear ticket attachments
        $form.find('input[name^=attachment]:not(:first)').remove();
        $form.find('ul.sp-attached-files').find('li:not(:first)').remove();

        // Redirect to the ticket grid
        if (response.data.redirect !== false) {
          window.location.href = response.data.redirect;
        }
      }).fail(function () {
        showFeedback(true);
      }).always(function () {
        always_message_handler($form);

        // Update log and escalation rules tables
        self.updateLogTable();
        self.updateEscalationsTable();
      });
    };

    /**
     * Edit an existing message.
     *
     * @param $form
     * @param $textarea
     */
    this.updateMessage = function ($form, $textarea) {
      // Validation.
      if (handleMessageForm($form, $textarea) === false) {
        return false;
      }
      var self = this;
      var data = $form.serializeArray();
      data.push({
        name: 'text',
        value: this.normaliseMessage($textarea.editor().getContent({
          withoutCursorMarker: true
        }))
      });
      $.ajax({
        url: $form.data('route'),
        type: 'PUT',
        data: data,
        dataType: 'json'
      }).done(function (response) {
        if (response.status != 'success') {
          showFeedback(true);
          return;
        }

        // Replace message view with response (we use the message ID in case it's a note as it could be showing in
        // two places).
        var message = $form.parents('.sp-message');
        message.find('.sp-message-text').html(response.data.message);
        message.find('.sp-message-text-trimmed').addClass('sp-hidden');
        message.find('.sp-message-text-original').removeClass('sp-hidden');
        message.find('.sp-message-edit-history').html(response.data.editHistory);

        // Close the edit form.
        $form.find('button.edit-button').trigger('click');

        // Update editor for editing this updated message
        showFeedback();
        message.find('textarea').editor(instance.defaultEditorConfig());
      }).fail(function () {
        showFeedback(true);
      }).always(function () {
        always_message_handler($form);

        // Update log table
        self.updateLogTable();
      });
    };

    /**
     * AJAX load a large message into the view.
     *
     * @param $messageContainer
     * @param successCallback
     */
    this.loadMessage = function ($messageContainer, successCallback) {
      // This holds the trimmed and original versions of the message.
      var $text = $messageContainer.find('.sp-message-text');

      // If we're not currently in the processing of loading the message, and the message has not previously
      // been fetched then fire an AJAX request to load the message into the DOM.
      if (!$messageContainer.hasClass('sp-message-text-loading') && !$text.children('.sp-message-text-original').hasClass('sp-message-text-loaded')) {
        $messageContainer.find('.sp-message-text').append('<span class="sp-loading sp-description">' + '<i class="fas fa-spinner fa-pulse"></i>&nbsp; ' + Lang.get('general.loading') + '...' + '</span>');
        $messageContainer.addClass('sp-message-text-loading');
        messageDfdNext = messageDfdNext.then(function () {
          return $.get(laroute.route('ticket.operator.message.showJson', {
            id: $messageContainer.data('id')
          })).done(function (ajax) {
            // Load the message in, it should already be sanitized.
            $text.children('.sp-message-text-original').html(ajax.data.purified_text).addClass('sp-message-text-loaded');

            // Remove expandable - ONLY when expanding a message.
            // We must do this after the content has been made visible to the user!
            instance.removeExpandable($messageContainer);

            // Load attachment previews if needed.
            instance.loadAttachmentPreviews($messageContainer);

            // Load editor for editing message if not already loaded
            $messageContainer.find('textarea').editor(instance.defaultEditorConfig());

            // If a callback exists, run it.
            typeof successCallback === 'function' && successCallback();
          }).fail(function () {
            Swal.fire(Lang.get('messages.error'), Lang.get('messages.error_loading_message'), 'error');
          }).always(function () {
            // Unset loading icon.
            $messageContainer.removeClass('sp-message-text-loading');
            $messageContainer.find('.sp-message-text .sp-loading').remove();
          });
        });
        return messageDfdNext;
      } else {
        // Message has already been loaded.

        // Remove expandable if there's no other text visible.
        instance.removeExpandable($messageContainer);

        // Load attachment previews if needed.
        instance.loadAttachmentPreviews($messageContainer);

        // Run success callback if exists.
        typeof successCallback === 'function' && successCallback();
      }
    };

    /**
     * If the browser supports, it enable the download all attachments function.
     */
    this.showDownloadAllButton = function () {
      if (ZipFile.isSupported()) {
        $('#tabMessages').find('ul.sp-attachments').each(function () {
          if ($(this).find('li').length > 1) {
            $(this).find('.sp-download-all').show();
          }
        });
      }
    };

    /**
     * Scroll to a message in the view.
     *
     * @param $message
     */
    this.scrollToMessage = function ($message) {
      // AJAX load the message into the view.
      instance.loadMessage($message);

      // Toggle collapsed state.
      if ($message.hasClass('sp-message-collapsed')) {
        $message.toggleClass('sp-message-collapsible sp-message-collapsed').find('.sp-message-text').children('.sp-message-text-original, .sp-message-text-trimmed').toggle();
      }

      // Scroll to it.
      $('#content').animate({
        scrollTop: $message.position().top - 24
      }, 1000);
    };

    /**
     * Quote the specified message into the active reply box (message or note).
     *
     * @param $messageContainer
     */
    this.quoteMessage = function ($messageContainer) {
      var message = $messageContainer.find('.sp-message-text');

      // In case it's a collapsed message, get the original text
      if (message.children('.sp-message-text-original').length) {
        message = message.children('.sp-message-text-original');
      }

      // Put the HTML in a new container
      var $currentHtml = $('<div>').append(message.html());

      // Remove any currently quoted section in that message
      $currentHtml.find('.expandable, .supportpal_quote').remove();

      // Insert into the textarea where the cursor/caret currently is, sets to start if not in focus
      var $textarea = instance.visibleTextarea();
      $textarea.editor().focus();
      $textarea.editor().execCommand('mceInsertContent', false, '<blockquote>' + $currentHtml.html() + '</blockquote>');
    };

    /**
     * Get the visible text area.
     *
     * @returns {JQuery|jQuery|HTMLElement|jQuery|[]}
     */
    this.visibleTextarea = function () {
      var $form = $('.ticket-reply-form:visible');
      if ($form.length === 1) {
        return $form.find('textarea');
      }

      // Show the reply form.
      $('.sp-reply-type .sp-action[data-type="0"]').removeClass('sp-fresh').show().trigger('click');
      return $('#newMessage');
    };

    /**
     * Add &nbsp; to empty paragraphs so they don't get hidden in HTML.
     *
     * @param {string} str
     * @returns {string}
     */
    this.normaliseMessage = function (str) {
      return str.replace('<p></p>', '<p>&nbsp;</p>');
    };

    /**
     * Get the drafts object.
     *
     * @returns {{newMessage: null, newNote: null}}
     */
    this.getDrafts = function () {
      return drafts;
    };

    /**
     * Set a new draft.
     *
     * @param key
     * @param value
     */
    this.setDraft = function (key, value) {
      drafts[key] = value;
    };

    /**
     * Check whether a draft is different to a given value.
     *
     * @param {string} key
     * @param {string} new_value
     * @returns {boolean}
     */
    this.draftHasChanged = function (key, new_value) {
      new_value = this.normaliseMessage(new_value);
      return this.normaliseMessage(drafts[key]) !== new_value && new_value !== '';
    };

    /**
     * Determine whether the message draft has changed.
     *
     * @param new_value
     * @returns {boolean}
     */
    this.messageDraftHasChanged = function (new_value) {
      return this.draftHasChanged('newMessage', new_value);
    };

    /**
     * Set a new message to the user draft.
     *
     * @param message
     */
    this.setMessageDraft = function (message) {
      drafts.newMessage = message;
    };

    /**
     * Get the current message draft.
     *
     * @returns {string}
     */
    this.getMessageDraft = function () {
      return drafts.newMessage;
    };

    /**
     * Determine whether the notes has changed.
     *
     * @param new_value
     * @returns {boolean}
     */
    this.noteDraftHasChanged = function (new_value) {
      return this.draftHasChanged('newNote', new_value);
    };

    /**
     * Set a new message note draft.
     *
     * @param message
     */
    this.setNoteDraft = function (message) {
      drafts.newNote = message;
    };

    /**
     * Get the current note draft.
     *
     * @returns {string}
     */
    this.getNoteDraft = function () {
      return drafts.newNote;
    };

    /**
     * Determine whether the forward draft has changed.
     *
     * @param new_value
     * @returns {boolean}
     */
    this.forwardDraftHasChanged = function (new_value) {
      return this.draftHasChanged('newForward', new_value);
    };

    /**
     * Set a new forward draft.
     *
     * @param message
     */
    this.setForwardDraft = function (message) {
      drafts.newForward = message;
    };

    /**
     * Get the current forward draft.
     *
     * @returns {string}
     */
    this.getForwardDraft = function () {
      return drafts.newForward;
    };

    /**
     * Get if the ticket log table has been loaded yet.
     *
     * @returns {boolean}
     */
    this.isLogTableLoaded = function () {
      return datatablesLoaded.log;
    };

    /**
     * Refresh the log datatable if it's been loaded.
     *
     * @param {boolean} force
     */
    this.updateLogTable = function (force) {
      force = force || false;
      if (this.isLogTableLoaded() || force) {
        // Refresh the table
        $('#tabLog .dataTable').dataTable().api().ajax.reload(function () {
          datatablesLoaded.log = true;
        });
      }
    };

    /**
     * Get if the escalations table has been loaded yet.
     *
     * @returns {boolean}
     */
    this.isEscalationsTableLoaded = function () {
      return datatablesLoaded.escalationRules;
    };

    /**
     * Refresh the escalations rules datatable if it's been loaded.
     *
     * @param {boolean} force
     */
    this.updateEscalationsTable = function (force) {
      force = force || false;
      if (this.isEscalationsTableLoaded() || force) {
        // Refresh the table
        $('#tabEscalationRules .dataTable').dataTable().api().ajax.reload(function (data) {
          var $escalationRules = $('.sp-tabs #EscalationRules');
          if (data.iTotalRecords > 0) {
            // Show the tab if hidden and update the count of rules
            $escalationRules.show();
          } else {
            // Switch to messages if we're currently on escalation rules
            if ($escalationRules.hasClass('active')) {
              $('.sp-tabs #Messages').trigger('click');
            }
            // Hide the tab as no more rules exist
            $escalationRules.hide();
          }
          datatablesLoaded.escalationRules = true;
        });
      }
    };

    /**
     * Check whether a message with the ID exists.
     *
     * @param id
     * @returns {boolean}
     */
    this.getMessage = function (id) {
      // id should be in the format notes-%ID% so we need to split it into those two components.
      var components = id.split('-');
      if (components.length !== 2 || !/^\d+$/.test(components[1])) {
        return false;
      }

      // Check whether a note (displayed at the top) or a message has been requested.
      var notesOnly = components[0].toUpperCase() === NOTES_PLACEHOLDER.replace('-%ID%', '').toUpperCase();

      // Get messages.
      var messages = $('.sp-message-' + components[1]).filter(function () {
        var isInline = instance.getMessagePosition($(this)) === "inline";
        return notesOnly ? !isInline : isInline;
      });
      return messages.length >= 1 ? messages.first() : false;
    };

    /**
     * Whether the message is displayed at the top are inline.
     *
     * @param $message
     * @returns {string}
     */
    this.getMessagePosition = function ($message) {
      if ($message.parents(".sp-messages-container[data-position='top']").length) {
        return "top";
      }
      return "inline";
    };

    /**
     * Get message ID for Copy Link functionality.
     *
     * @param $message
     * @returns {string}
     */
    this.getId = function ($message) {
      // If the .messages-header doesn't exist in the previous siblings then we've been given
      // a note that's displayed at the top of the page.
      if (instance.getMessagePosition($message) === "top") {
        return NOTES_PLACEHOLDER.replace('%ID%', $message.data('id'));
      } else {
        return MESSAGE_PLACEHOLDER.replace('%ID%', $message.data('id'));
      }
    };

    /**
     * Remove expandable if there's no content before it.
     *
     * @param $message
     */
    this.removeExpandable = function ($message) {
      var $quote = $message.find('.supportpal_quote:first');
      if ($quote.length === 0) {
        return;
      }
      var text = $message.children('.sp-message-text').children('.sp-message-text-original').text();

      // Check if there is any text before the quoted text.
      if (!text.substring(0, text.indexOf($quote.text())).trim().length) {
        $quote.removeClass('supportpal_quote');
        $quote.prev('.expandable').remove();
      }
    };

    /**
     * Forward all messages from the given one.
     *
     * @param $message
     */
    this.forwardFrom = function ($message) {
      // Uncollapse messages first
      App.TicketViewAction.removeCollapsedMessageGroup();

      // Fetch the list of messages from this one based on the reply order, we always want latest first
      // like you would get in an email client.
      var $messages;
      if (parameters.replyOrder === 'ASC') {
        $messages = $message.prevUntil('#tabMessages', '.sp-message:not(.sp-note, .sp-forward)').addBack().reverse();
      } else {
        $messages = $message.nextUntil('#tabMessages', '.sp-message:not(.sp-note, .sp-forward)').addBack();
      }
      instance.forward($messages);
    };

    /**
     * Populate editor with the specified messages to forward.
     *
     * @param $messages
     */
    this.forward = function ($messages) {
      // Lock the interface and show a waiting spinner (this may take a while on a large ticket).
      Swal.fire({
        title: Lang.get('general.loading'),
        allowOutsideClick: false,
        focusConfirm: false,
        focusDeny: false,
        focusCancel: false,
        returnFocus: false
      });
      Swal.showLoading();

      // Switch to Forward tab.
      App.TicketViewForm.showForwardForm();

      // Delete any attachments currently tied to the form.
      var deferred = [];
      $('.forward-form .sp-attached-files li:not(.sp-hidden) .sp-delete-attachment').each(function (index, element) {
        deferred.push(parameters.forwardFileUpload.deleteNewFile(element, true));
      });

      // Load any messages that need to be AJAX loaded.
      $messages.each(function (index, message) {
        deferred.push(instance.loadMessage($(message)));
      });

      // Can't pass a literal array, so use apply.
      $.when.apply($, deferred).then(function () {
        // Grab the text of all prior messages (excluding notes).
        var subject = $(document).find('.sp-ticket-subject').text().trim(),
          messages = [],
          attachments = [],
          failed_attachments = [];
        var departmentEmail = $('select[name="department_email"] option:selected').text();
        departmentEmail = departmentEmail.slice(departmentEmail.lastIndexOf('<') + 1, -1);
        $messages.each(function (index, message) {
          var $message = $(message),
            message_attachments = [];

          // Message has attachments.
          $message.find('ul.sp-attachments li').each(function (index, attachment) {
            var $attachment = $(attachment),
              size = $attachment.find('.sp-delete-attachment').data('size'),
              filename = $attachment.find('.sp-attachment-name').text().trim();

            // If we've gone above the cumulative file size, don't attach any more.
            parameters.forwardFileUpload.incrementTotalUploadedFileSize(size);
            if (parameters.forwardFileUpload.totalUploadedFileSize() > parameters.forwardFileUpload.cumulativeMaxFileSize) {
              parameters.forwardFileUpload.decrementTotalUploadedFileSize(size);
              failed_attachments.push(filename);
            } else {
              attachments.push({
                hash: $attachment.find('.sp-delete-attachment').data('hash'),
                filename: filename,
                size: size
              });
              message_attachments.push(filename);
            }
          });
          messages.push('<strong>' + Lang.get('ticket.from') + ':</strong> ' + he.encode($message.find('.sp-name').html().trim()) + '&nbsp;&lt;' + he.encode($message.find('.sp-name').data('email') || departmentEmail) + '&gt;<br />' + '<strong>' + Lang.get('customfield.date') + ':</strong> ' + he.encode($message.find('time').data('date')) + '<br />' + '<strong>' + Lang.get('ticket.subject') + ':</strong> ' + he.encode(subject) + '<br />' + (message_attachments.length > 0 ? '<strong>' + Lang.choice('general.attachment', 2) + ':</strong> ' + he.encode(message_attachments.join(', ')) + '<br />' : '') + '<br />' + $message.find('.sp-message-text .sp-message-text-original').html().trim());
        });

        // Make forwarded message.
        var message = parameters.replyTemplate + '<br /><br />' + '<div class="expandable"></div>' + '<div class="supportpal_quote">' + '<span>' + Lang.get('ticket.forwarded_message') + '</span><br />' + messages.join('<br /><br />') + '</div>';

        // Set attachments.
        for (var i = 0; i < attachments.length; i++) {
          var filename = attachments[i].filename,
            hash = attachments[i].hash,
            $item = parameters.forwardFileUpload.addFile(filename, attachments[i].size);
          parameters.forwardFileUpload.registerFile($item, filename, hash);
        }

        // Set content on a delay, as for some reason sometimes tinymce wipes the content (some race condition).
        $('#newForward').editor().setContent(message);
        $('#newForward').editor().focus();

        // Update draft message variable so it doesn't save a draft automatically
        instance.setForwardDraft($('#newForward').editor().getContent({
          withoutCursorMarker: true
        }));

        // Show an alert of which attachments we failed to attach.
        if (failed_attachments.length > 0) {
          Swal.fire({
            title: Lang.get('messages.failed_attachments'),
            html: failed_attachments.join(', ') + '<br /><br />' + Lang.get('core.attachment_limit_reached', {
              size: parameters.forwardFileUpload.cumulativeMaxFileSize.fileSize()
            }),
            icon: 'info'
          });
        } else {
          Swal.close();
        }
      });
    };

    /**
     * Load attachment previews within message div if needed.
     *
     * @param $message
     */
    this.loadAttachmentPreviews = function ($message) {
      App.attachments.loadPreviews($message);
    };

    /**
     * Highlight ticket mentions.
     *
     * @param $message
     */
    this.highlightUserMentions = function ($message) {
      $message.find('.sp-editor-content .sp-mention:not(.sp-current-user)').each(function () {
        if ($(this).attr('value') === instance.parameters().authUserId) {
          $(this).addClass('sp-current-user');
        }
      });
    };

    /**
     * Default editor config.
     *
     * @returns {Object}
     */
    this.defaultEditorConfig = function () {
      var plugins = $.fn.editor.defaults.plugins.concat(['mentions', 'cannedresponses', 'autosavecursor']),
        toolbar = $.fn.editor.defaults.toolbar + ' | cannedresponses';
      if (parameters.selfservice) {
        plugins.push('selfservice');
        toolbar += ' selfservice';
      }
      return {
        plugins: plugins,
        toolbar: toolbar,
        // Plugin settings.
        ticketId: this.parameters().ticketId,
        userId: this.parameters().userId,
        brandId: this.parameters().brandId,
        departmentId: this.parameters().departmentId,
        excludeInternalArticles: this.parameters().excludeInternalArticles || false
      };
    };

    /**
     * Default selectize plugin list.
     *
     * @returns {string[]}
     */
    this.defaultSelectizePlugins = function () {
      return selectizePlugins;
    };

    /**
     * Register CC selectize on the reply form.
     *
     * @returns {*|jQuery}
     */
    this.ccSelectize = function () {
      if (this.$ccSelectize) {
        return this.$ccSelectize;
      }
      var params = $.extend({}, emailSelectizeConfig(selectizePlugins), {
        render: {
          item: function (item, escape) {
            return '<div class="item' + (item.unremovable ? ' unremovable' : '') + '">' + escape(item.value) + '</div>';
          },
          option: function (item, escape) {
            // pollReplies doesn't return full user attributes.
            if (!item.email) {
              return '<div>' + escape(item.value) + '</div>';
            }
            return '<div>' + '<img class="sp-avatar sp-max-w-2xs" src="' + escape(item.avatar_url) + '" /> &nbsp;' + escape(item.formatted_name) + (item.organisation ? ' (' + escape(item.organisation || '') + ')' : '') + (item.email ? '<br /><span class="sp-description">' + escape(item.email || '') + '</span>' : '') + '</div>';
          }
        },
        load: function (query, callback) {
          if (!query.length) return callback();

          // Search for users
          $.get(laroute.route('user.operator.search'), {
            brand_id: parameters.brandId,
            q: query
          }).done(function (res) {
            // Remove user from list if included.
            res.data = res.data.filter(function (user) {
              return user.id != parameters.userId;
            }).map(function (value) {
              // Add needed info for search and selected item to work.
              value.value = value.email;
              value.text = value.firstname + ' ' + value.lastname + ' <' + value.email + '>';
              return value;
            });
            callback(res.data);
          }).fail(function () {
            callback();
          });
        },
        onChange: function (input) {
          if (!input) {
            // In case of removing all emails
            input = [];
          }
          // Detach and re-attach the list of CC addresses
          $.post(laroute.route('ticket.operator.ticket.updateCc', {
            id: parameters.ticketId
          }), {
            'cc': input
          }).done(function (data) {
            if (data.status == 'success') {
              $('.sp-ticket-update.sp-alert-success').show(500).delay(5000).hide(500);
              return;
            }

            // Else, an error occurred
            $('.sp-ticket-update.sp-alert-error').show(500).delay(5000).hide(500);
          }).fail(function (data) {
            $('.sp-ticket-update.sp-alert-error').show(500).delay(5000).hide(500);
          });
        },
        onDelete: function (input) {
          var self = this;
          $.each(input, function (key, value) {
            // Delete any items selected that don't have a 'unremovable' class.
            if (!$('.cc-emails div[data-value="' + value + '"]').hasClass('unremovable')) {
              self.removeItem(value);
              self.removeOption(value);
            }
          });

          // We handle the deletions above, no need to carry on with deleteSelect()
          return false;
        }
      });
      this.$ccSelectize = $('.message-form select[name="cc[]"]').selectize(params);
    };

    /**
     * Register ticket message jQuery events.
     */
    this.registerMessageEvents = function () {
      $(document)
      // Expand quoted areas
      .on('click', '.expandable', function () {
        $(this).next().toggle();
      })

      // Open links in a new window/tab. Needs rel="noopener" due to
      // https://www.jitbit.com/alexblog/256-targetblank---the-most-underestimated-vulnerability-ever/
      .on('click', '.sp-message .sp-message-text a', function () {
        $(this).attr('target', '_blank').attr('rel', 'noopener');
      })

      // Handle message actions button to show dropdown.
      .on('click', '.sp-message .sp-dropdown-container .sp-action', function (e) {
        var $message = $(this).parents('.sp-message');

        // Open message if it's currently not open, but this won't open the dropdown (need to click again).
        if ($message.hasClass('sp-message-collapsed')) {
          $message.trigger('click');
        }

        // We need to stop the propagation so the dropdown doesn't close itself.
        e.stopPropagation();
      })

      // Message header actions
      //
      // Quote a message.
      .on('click', '.quote-message', function (event) {
        // Don't expand or collapse message
        event.stopPropagation();

        // Get the message container.
        var $message = $(this).parents('.sp-message'),
          callback = function () {
            instance.quoteMessage($message);
          };
        instance.loadMessage($message, callback);
      })

      // Toggle edit form
      .on('click', '.edit-button', function (event) {
        var $message = $(this).parents('.sp-message');

        // Don't collapse message if it's currently open
        if ($message.hasClass('sp-message-collapsible')) {
          event.stopPropagation();
        }
        if ($message.find('.sp-message-text .sp-message-text-original').hasClass('clipped')) {
          // Message is too big, so load the "View entire message" window.
          var url = $message.find('.sp-message-text .sp-message-text-original a.supportpal_clipped_vem').prop('href');
          window.open(url + '?edit=true');
        } else {
          // Toggle the views. It will show a loading icon if it hasn't been loaded before.
          $message.find('.sp-message-text, .sp-message-text-edit').toggle();
          var $editView = $message.find('.sp-message-text-edit');

          // If the edit message view is now visible and it hasn't already been loaded, we need
          // to AJAX load the edit view.
          if ($editView.is(':visible') && !$editView.hasClass('sp-loaded')) {
            $.get(laroute.route('ticket.operator.message.edit', {
              id: $message.data('id')
            })).then(function (response) {
              if (response.status == 'success') {
                // Replace the view and add a loaded class.
                $editView.addClass('sp-loaded').html(response.data.view);

                // Initialise editor.
                $message.find('form.edit textarea').editor(instance.defaultEditorConfig());

                // Focus the editor.
                $message.find('textarea:not(.CodeMirror textarea):eq(0)').editor('editor.startFocus');
              } else {
                // Switch back to the message view.
                $message.find('.sp-message-text, .sp-message-text-edit').toggle();

                // Show error message.
                $('.sp-message-update').show(500).delay(5000).hide(500);
              }
            }).fail(function () {
              // Switch back to the message view.
              $message.find('.sp-message-text, .sp-message-text-edit').toggle();

              // Show error message.
              $('.sp-message-update').show(500).delay(5000).hide(500);
            });
          }
        }
      })

      // Copy link to message.
      .on('click', '.link-message', function (event) {
        var $message = $(this).parents('.sp-message'),
          id = instance.getId($message),
          url = laroute.route('ticket.operator.ticket.show', {
            'view': parameters.ticketId
          }) + '#' + id;

        // Don't expand or collapse message, but close dropdown
        event.stopPropagation();

        // Update URL (and don't jump to top)
        var scrollmem = $('#content').scrollTop();
        window.location.hash = id;
        $('#content').scrollTop(scrollmem);

        // Scroll to message
        instance.scrollToMessage($message);

        // Copy URL
        var $temp = $("<input>");
        $('body').append($temp);
        $temp.val(url).trigger('select');
        document.execCommand('copy');
        $temp.remove();
      })

      // Forward this message.
      .on('click', 'a.forward-message', function (event) {
        // Don't collapse or expand message
        event.stopPropagation();
        event.preventDefault();
        instance.forward($(this).parents('.sp-message'));
      })

      // Forward ticket from here.
      .on('click', 'a.forward-from-here', function (event) {
        // Don't collapse or expand message
        event.stopPropagation();
        event.preventDefault();
        instance.forwardFrom($(this).parents('.sp-message'));
      })

      // Create linked ticket.
      .on('click', '.link-ticket', function (event) {
        // Don't collapse or expand message
        event.stopPropagation();
        event.preventDefault();

        // Go to link.
        window.location.href = $(this).data('href');
      })

      // Delete ticket message
      .on('click', '.delete-confirm', function (event) {
        // Don't collapse or expand message
        event.stopPropagation();
        var messageId = $(this).data('id');

        // Show the alert
        new deleteAlert({
          ajax: {
            url: $(this).data('route')
          }
        }).fireDefault(Lang.choice('general.message', 1)).then(function (result) {
          if (result.value) {
            $('.sp-ticket-update.sp-alert-success').show(500).delay(5000).hide(500);

            // Remove message from view
            $('.sp-message-' + messageId).remove();
            if (!$('.sp-message').length) {
              // No more messages exist, ticket will likely have been deleted, redirect to grid
              // We use replace() here as we don't want them to click back to ticket.
              window.location.replace(parameters.ticketGridUrl);
            }
            if (!$('.sp-note').length) {
              // No more notes, hide the headers
              $('.notes-header, .messages-header').hide();
            }
          }
        });
      });
    };

    /**
     * Print the entire ticket.
     */
    this.print = function () {
      var deferred = [];
      $('.sp-message').each(function (index, message) {
        deferred.push(instance.loadMessage($(message)));
      });

      // Lock the interface and show a waiting spinner (this may take a while on a large ticket).
      Swal.fire({
        title: Lang.get('general.loading'),
        allowOutsideClick: false,
        didClose: function () {
          window.print();
        }
      });
      Swal.showLoading();

      // Can't pass a literal array, so use apply.
      $.when.apply($, deferred).then(function () {
        Swal.close();
      });
    };

    /**
     * Get the current parameters.
     *
     * @returns {Object}
     */
    this.parameters = function () {
      return parameters;
    };

    /**
     * Set a parameter.
     *
     * @param key
     * @param value
     */
    this.setParameter = function (key, value) {
      parameters[key] = value;
    };

    // Merge defaults with user provided parameters.
    parameters = $.extend(true, defaults, parameters);

    // Validate parameters.
    var required = ['ticketId', 'userId', 'authUserId', 'brandId', 'notesPosition', 'replyOrder', 'ticketGridUrl'];
    for (var i = 0; i < required.length; i++) {
      if (parameters[required[i]] === null) {
        void 0;
      }
    }

    // Constructor.
    var instance = this;
    $(document).ready(function () {
      instance.registerMessageEvents();
    });
  }
  App.extend('ticket', Ticket);
})($, window, document);