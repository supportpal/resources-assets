$(document).ready(function () {
  // Date picker
  $('.datepicker').datepicker();

  // Load attachment previews
  App.attachments.loadPreviews($('.sp-message'));
  showDownloadAllButton();
  $(document)
  // Ajax load messages.
  .on('click', '.sp-message-text-show-more', function (e) {
    e.preventDefault();
    e.stopPropagation();
    var $this = $(this),
      $message = $(this).parents('.sp-message'),
      token = $('meta[name="token"]').prop('content'),
      route = laroute.route('ticket.frontend.message.showJson', {
        id: $message.data('id')
      });
    if (token.length !== 0) {
      route += "?token=" + token;
    }

    // Remove the show more link and replace it by a loading icon.
    $(this).hide();
    $message.find('.sp-message-text').append('<span class="sp-loading sp-description">' + '<i class="fas fa-spinner fa-pulse"></i>&nbsp; ' + Lang.get('general.loading') + '...' + '</span>');
    $.get(route).done(function (ajax) {
      // Load the message in, it should already be sanitized.
      $message.find('.sp-message-text').html(ajax.data.purified_text);
    }).fail(function () {
      Swal.fire(Lang.get('messages.error'), Lang.get('messages.error_loading_message'), 'error');
      $this.show();
      $message.find('.sp-loading').remove();
    });
  })
  // Download all attachments.
  .on('click', '.sp-download-all', function () {
    var $attachments = $(this).parents('.sp-message').find('.sp-attachments li');
    var filename = $('meta[name="ticket-subject"]').prop('content');
    new ZipFile().create($attachments, filename);
  })
  // Open links in a new window/tab. Needs rel="noopener" due to
  // https://www.jitbit.com/alexblog/256-targetblank---the-most-underestimated-vulnerability-ever/
  .on('click', '.sp-message-text a', function () {
    $(this).attr('target', '_blank').attr('rel', 'noopener');
  });

  // Editor
  $('textarea[name=text]').editor();

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
          success: function (data) {
            showMessage(data);
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
      }).listen('.App\\Modules\\Ticket\\Events\\SubjectUpdated', e => {
        $('h1, .sp-ticket-subject').text(e.subject);
        $('meta[name="ticket-subject"]').attr('content', e.subject);
      }).listen('.App\\Modules\\Ticket\\Events\\TicketLocked', () => {
        // If changed to locked, refresh page.
        if ($('form.sp-message-form').length) {
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

        // Show new message
        showMessage(response.data.view);

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

    // Load attachment previews if needed
    App.attachments.loadPreviews(message);
    showDownloadAllButton();

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

  /**
   * If the browser supports, it enable the download all attachments function.
   */
  function showDownloadAllButton() {
    if (ZipFile.isSupported()) {
      $('.sp-message-block').find('ul.sp-attachments').each(function () {
        if ($(this).find('li').length > 1) {
          $(this).find('.sp-download-all').show();
        }
      });
    }
  }
});