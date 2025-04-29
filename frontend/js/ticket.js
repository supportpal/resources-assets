$(document).ready(function () {
  const $form = $('form.sp-message-form'),
    $btn = $form.find('button.sp-mark-resolved'),
    $postBtn = $form.find('input[type="submit"]'),
    defaultBtnValue = $btn.text();
  $postBtn.on('click', () => $form.find('input[name="close"]').val(0));
  $btn.on('click', () => {
    $form.find('input[name="close"]').val(1);
    $form.trigger('submit');
  });

  // Date picker
  $('.datepicker').datepicker();

  // Editor
  const editor = new SpTicket.Editor();
  editor.initEditor('#newMessage', $form, {}).then(function (editor) {
    updateSubmitButtons(editor);
    editor.on('SetContent', () => updateSubmitButtons(editor));
    editor.on('keyup', () => updateSubmitButtons(editor));
  });

  // Expand all messages on print.
  $(window).beforeprint(() => App.TicketView.print());

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
        return !this.options.hasOwnProperty(match[0]);
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
        if (!$('.cc-emails div[data-value="' + value + '"]').hasClass('unremovable')) {
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
  $form.data('ajax', 'ajax');

  // Add Reply.
  $form.on('form:submit', function () {
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
    }).then(function (response) {
      if (response.status !== 'success') {
        throw new Error();
      }
      $('.sp-ticket-update.sp-alert-success').show(500).delay(5000).hide(500);
    }).catch(function () {
      $('.sp-ticket-update.sp-alert-error').show(500).delay(5000).hide(500);
    }).always(function () {
      $(self).find('input[type="submit"]').prop('disabled', false);
    });
  });
  function TicketEvents() {
    var instance = this;
    this.fetchNewMessage = e => {
      // Wait a second for the view to update before running this.
      setTimeout(function () {
        if ($('.sp-message[data-id=' + e.message.id + ']').length) {
          return;
        }
        let params = {
          'id': e.message.id
        };
        const token = $('meta[name="token"]').prop('content');
        if (token.length !== 0) {
          params.token = token;
        }
        $.ajax({
          url: laroute.route('ticket.frontend.message.showRendered', params),
          success: function (response) {
            showMessage(response.data);
          }
        });
      }, 1000);
    };
    this.listen = () => {
      App.Notifications.connector().join('Frontend.App.Modules.Ticket.Models.Ticket.' + ticketId).listen('.App\\Modules\\Ticket\\Events\\OperatorReplyCreated', instance.fetchNewMessage).listen('.App\\Modules\\Ticket\\Events\\UserReplyCreated', instance.fetchNewMessage).listen('.App\\Modules\\Ticket\\Events\\DepartmentUpdated', e => {
        $('.sp-ticket-department').text(e.name);
      }).listen('.App\\Modules\\Ticket\\Events\\PriorityUpdated', e => {
        $('.sp-ticket-priority').text(e.name).css('background-color', e.colour);
      }).listen('.App\\Modules\\Ticket\\Events\\StatusUpdated', e => {
        $('.sp-ticket-status').text(e.name).css('background-color', e.colour);

        // Show/hide mark as resolved link.
        if (e.id !== parseInt(closedStatusId)) {
          $('.sp-mark-resolved').removeClass('sp-hidden');
        } else {
          $('.sp-mark-resolved').addClass('sp-hidden');
        }
      }).listen('.App\\Modules\\Ticket\\Events\\SubjectUpdated', e => {
        $('h1, .sp-ticket-subject').text(e.subject);
        $('meta[name="ticket-subject"]').attr('content', e.subject);
      }).listen('.App\\Modules\\Ticket\\Events\\TicketLocked', () => {
        // If changed to locked, refresh page.
        if ($form.length) {
          location.reload();
        }
      }).listen('.App\\Modules\\Ticket\\Events\\TicketUnlocked', () => {
        // If changed to unlocked, refresh page.
        if ($('.sp-ticket-locked').length) {
          location.reload();
        }
      });

      // Unsubscribe from channel before leaving page.
      window.addEventListener('beforeunload', function () {
        App.Notifications.connector().leave('Frontend.App.Modules.Ticket.Models.Ticket.' + ticketId);
      });
    };
  }
  var events = new TicketEvents();
  events.listen();

  /*
   * Posts message to ticket
   */
  function saveMessage(form) {
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
        if (response.data.view) {
          showMessage(response.data.view);
        }

        // Reset the form
        form.find('textarea[name="text"]').val('').prop('disabled', false);
        tinymce.activeEditor.setContent('');
        $('.sp-attached-files').find('li:not(:first)').remove();
        $('.sp-attachment-details').find('input[type=hidden][name^="attachment["]:not(:first)').remove();

        // Only update if status is not undefined/null (loose type check !=).
        // http://contribute.jquery.org/style-guide/js/#equality
        if (response.data.status_name != null && response.data.status_colour != null) {
          $('.sp-ticket-status').text(response.data.status_name).css("background-color", response.data.status_colour);
        }
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

  /*
   * Displays message and highlights it temporarily
   */
  function showMessage(message) {
    // Show new message
    if (descReplyOrder) {
      message = $(message).prependTo($('.sp-message-block'));
    } else {
      message = $(message).insertAfter($('.sp-message').last());
    }
    App.FrontendTicketView.showMessage(message);
    App.FrontendTicketView.loadAttachmentPreviews(message);
    App.FrontendTicketView.showDownloadAllButton();

    // Special effects, set as blue for 10 seconds.
    message.toggleClass('sp-new-message', 1000);
    setTimeout(function () {
      message.toggleClass('sp-new-message', 1000);
    }, 10000);

    // Update last reply time/date.
    var $time = message.find('.sp-message-header time');
    if ($time.length) {
      $('.sp-ticket-updated time').replaceWith($time.first().clone());

      // Refresh timeago.
      if (typeof timeAgo !== 'undefined') {
        timeAgo.render($('time.timeago'));
      }
    }
  }
  function updateSubmitButtons(editor) {
    let name = defaultBtnValue,
      disabled = 'disabled';
    if ($.trim(editor.getContent({
      format: 'text'
    })) !== '') {
      name = $btn.data('close');
      disabled = false;
    }
    $btn.text(name);
    $postBtn.prop('disabled', disabled);
  }
});