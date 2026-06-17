(function () {
  var $tagSelectize, $assignSelectize;
  App.extend('TicketEditor', new SpTicket.Editor());
  function Form() {
    var reply_selector = '#newMessage';
    var forward_selector = '#newForward';
    var instance = this;
    var initFileUploads = function ($form, name, params) {
      if (ticket.parameters()[name]) {
        return;
      }
      params = params || {};
      var defaults = {
        $element: $form.find('.sp-file-upload'),
        $container: $form,
        dropZone: $form.find('.sp-attachment-dragover')
      };
      ticket.setParameter(name, new SpFileUpload.FileUpload($.extend(true, {}, defaults, params)));
    };
    var hideAllForms = function () {
      $('.sp-reply-type .sp-action.sp-active').removeClass('sp-active');
      $('.ticket-reply-form, .message-form:not(.edit), .notes-form, .forward-form, .sp-draft-preview').addClass('sp:hidden');
    };
    var focusForm = function ($form, type) {
      $('.sp-reply-type .sp-action[data-type=' + type + ']').addClass('sp-active');
      if (!$form.hasClass('sp:sticky')) {
        $form[0].scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    };
    this.destroyReplyForm = function () {
      App.TicketEditor.destroy(reply_selector);
    };
    this.initReplyForm = function (opts) {
      var $form = $('.message-form');
      initFileUploads($form, 'replyFileUpload');
      return App.TicketEditor.initEditor(reply_selector, $form, $.extend({}, ticket.defaultEditorConfig(), opts));
    };
    this.initNotesForm = function (opts) {
      var $form = $('.notes-form');
      initFileUploads($form, 'notesFileUpload');
      return App.TicketEditor.initEditor('#newNote', $form, $.extend({}, ticket.defaultEditorConfig(), opts, {
        excludeInternalArticles: false
      }));
    };
    this.initForwardForm = function (opts) {
      var $form = $('.forward-form');
      initFileUploads($form, 'forwardFileUpload', {
        cumulativeMaxFileSize: $form.data('cumulative-max-file-size')
      });
      return App.TicketEditor.initEditor(forward_selector, $form, $.extend({}, ticket.defaultEditorConfig(), opts));
    };
    this.toggleReplyForm = function (show = false) {
      return instance.toggleForm($('.message-form:not(.edit)'), instance.initReplyForm, 0, show);
    };
    this.toggleNotesForm = function (show = false) {
      return instance.toggleForm($('.notes-form'), instance.initNotesForm, 1, show);
    };
    this.toggleForwardForm = function (show = false) {
      return instance.toggleForm($('.forward-form'), instance.initForwardForm, 2, show);
    };
    this.toggleForm = function ($form, initFn, type, show = false) {
      if (!show && $form.is(':visible')) {
        hideAllForms();
        return $.when();
      }
      hideAllForms();
      $form.removeClass('sp:hidden');
      const $parentForm = $form.parent('.ticket-reply-form');
      $parentForm.removeClass('sp:hidden');

      // Show relevant draft messages.
      $parentForm.find('.sp-reply-form-draft').addClass('sp:hidden');
      $parentForm.find('.sp-reply-form-draft[data-type=' + type + ']').removeClass('sp:hidden');
      return initFn({
        min_height: 108
      }).then(editor => {
        focusForm($form, type);
        return editor;
      });
    };
  }
  function TicketViewAction() {
    var instance = this;
    var run = function (route, data) {
      // Disable buttons and dropdowns
      var selector = '.sp-quick-actions button, .sp-sidebar-panel button, .sp-sidebar-panel select',
        $disabled = $(selector).filter(':disabled'),
        fail = function () {
          $('.sp-ticket-update.sp-alert-error').show(500).delay(5000).hide(500);
        };
      $(selector).prop('disabled', true);

      // Post data to perform action
      return $.post(route, $.extend(data || {}, {
        ticket: ticket.parameters().ticketId
      })).done(function (response) {
        if (response.status === 'success') {
          $('.sp-ticket-update.sp-alert-success').show(500).delay(5000).hide(500);
        } else {
          fail();
        }
      }).fail(function () {
        fail();
      }).always(function () {
        // Enable buttons and dropdowns
        $(selector).not($disabled).prop('disabled', false);
      });
    };
    var deleteTicket = function (block, force) {
      var type = block ? 'POST' : 'DELETE',
        route = block ? laroute.route('ticket.operator.action.block') : force ? laroute.route('ticket.operator.action.destroy') : laroute.route('ticket.operator.action.trash'),
        successMessage = force ? 'messages.success_deleted' : 'messages.success_trashed',
        errorMessage = force ? 'messages.error_deleted' : 'messages.error_trashed';
      var success = function () {
        Swal.fire(Lang.get('messages.success'), Lang.get(successMessage, {
          item: Lang.get('general.record')
        }), 'success');
        window.location.href = ticket.parameters().ticketGridUrl;
      };
      var ajaxParams = {
        url: route,
        type: type,
        data: {
          ticket: ticket.parameters().ticketId
        }
      };
      var actionCall = function () {
        Swal.fire({
          allowOutsideClick: false
        });
        Swal.showLoading();
        $.ajax(ajaxParams).then(function (response) {
          if (response.status == 'success') {
            return success();
          }
          throw new Error(response.statusText);
        }).catch(function () {
          Swal.fire(Lang.get('messages.error'), Lang.get(errorMessage, {
            item: Lang.get('general.record')
          }), 'error');
        });
      };
      if (force) {
        new deleteAlert({
          ajax: ajaxParams
        }).fireDefault(Lang.choice('ticket.ticket', 1), '', deleteRelations).then(function (result) {
          if (result.value) {
            success();
          }
        });
      } else {
        if (block) {
          Swal.fire({
            title: Lang.get('messages.are_you_sure'),
            text: Lang.get('ticket.block_user_desc'),
            icon: "warning",
            confirmButtonText: Lang.get('messages.yes_im_sure'),
            cancelButtonText: Lang.get('general.cancel'),
            showCancelButton: true,
            showLoaderOnConfirm: true,
            preConfirm: function () {
              return actionCall();
            },
            allowOutsideClick: function () {
              return !Swal.isLoading();
            }
          });
        } else {
          actionCall();
        }
      }
    };
    this.take = function () {
      run(laroute.route('ticket.operator.action.take'));
    };

    /**
     * @param {bool=} notify
     */
    this.close = function (notify) {
      var notifyParam = typeof notify === 'undefined' ? '1' : notify ? '1' : '0';
      run(laroute.route('ticket.operator.action.close', {
        notify: notifyParam
      })).done(function () {
        window.location.href = ticket.parameters().ticketGridUrl;
      });
    };
    this.lock = function () {
      run(laroute.route('ticket.operator.action.lock')).done(function () {
        window.location.href = ticket.parameters().ticketGridUrl;
      });
    };
    this.unlock = function () {
      run(laroute.route('ticket.operator.action.unlock'));
    };
    this.deleteFromTrash = function () {
      deleteTicket(false, true);
    };
    this.moveToTrash = function () {
      deleteTicket(false, false);
    };
    this.block = function () {
      deleteTicket(true, false);
    };
    this.watch = function () {
      run(laroute.route('ticket.operator.action.watch'));
      $('.watch-ticket').addClass('sp:hidden');
      $('.unwatch-ticket').removeClass('sp:hidden');
    };
    this.unwatch = function () {
      run(laroute.route('ticket.operator.action.unwatch'));
      $('.watch-ticket').removeClass('sp:hidden');
      $('.unwatch-ticket').addClass('sp:hidden');
    };
    this.merge = function () {
      TicketAction.merge([ticket.parameters().ticketId]).then(function (result) {
        if (result.value) {
          $('.sp-ticket-update.sp-alert-success').show(500).delay(5000).hide(500);

          // We need to update a lot of details on the page. Quick fix, refresh the page.
          window.location.reload();
        }
      });
    };
    this.unmerge = function () {
      run(laroute.route('ticket.operator.action.unmerge')).done(function () {
        window.location.href = ticket.parameters().ticketGridUrl;
      });
    };
  }
  var events = new TicketEvents();
  function TicketEvents() {
    var instance = this;
    this.ticketUpdate = () => {
      ticket.updateEscalationsTable();

      // Refresh timeago.
      if (typeof timeAgo !== 'undefined') {
        timeAgo.render($('time.timeago'));
      }
    };
    this.fetchNewMessage = e => {
      if ($('.sp-message[data-id=' + e.message.id + ']').length) {
        return;
      }
      $.ajax({
        url: laroute.route('ticket.operator.message.showRendered', {
          'id': e.message.id
        }),
        success: function (data) {
          ticket.insertMessage(data);
        }
      });
      instance.ticketUpdate();
    };
    this.fetchOperatorMessage = e => {
      if (e.message.user_id == operatorId) {
        // Wait a second for the view to update before running this.
        setTimeout(function () {
          instance.fetchNewMessage(e);
        }, 1000);
        return;
      }
      instance.fetchNewMessage(e);
    };
    this.addViewingOperator = user => {
      if (user.id == operatorId) {
        return;
      }
      if ($('ul.sp-viewing-operators li[data-id=' + user.id + ']').length !== 0) {
        return;
      }
      $('.ticket-viewing').show();
      $('ul.sp-viewing-operators').append($('<li>').attr('data-id', user.id).append($('<img>').attr('src', user.avatar_url).attr('class', 'sp-avatar sp:max-w-5 sp:me-1')).append($('<span>').text(user.formatted_name)));
    };
    this.listen = () => {
      App.Notifications.connector().join('App.Modules.Ticket.Models.Ticket.' + ticket.parameters().ticketId).here(users => {
        if (users.length > 1) {
          $.each(users, function (index, user) {
            instance.addViewingOperator(user);
          });
        }
      }).joining(user => {
        instance.addViewingOperator(user);
      }).leaving(user => {
        $('ul.sp-viewing-operators li[data-id=' + user.id + ']').remove();
        if ($('ul.sp-viewing-operators li').length === 0) {
          $('.ticket-viewing').hide();
        }
      }).listen('.App\\Modules\\Ticket\\Events\\TimelineActivity', e => {
        if (!App.TicketView.showOnTimeline(e.type)) {
          return;
        }
        ticket.insertMessage(e.view);
        instance.ticketUpdate();
      }).listen('.App\\Modules\\Ticket\\Events\\UserReplyCreated', instance.fetchNewMessage).listen('.App\\Modules\\Ticket\\Events\\OperatorForwardCreated', instance.fetchOperatorMessage).listen('.App\\Modules\\Ticket\\Events\\OperatorNoteCreated', instance.fetchOperatorMessage).listen('.App\\Modules\\Ticket\\Events\\OperatorReplyCreated', instance.fetchOperatorMessage).listen('.App\\Modules\\Ticket\\Events\\MessageUpdated', e => {
        const $elm = $('.sp-message[data-id=' + e.message.id + ']');
        if (!$elm.length) {
          return;
        }

        // Don't update message if it was updated in this tab.
        if ($elm.hasClass('sp-message-updated')) {
          $elm.removeClass('sp-message-updated');
          return;
        }
        $.ajax({
          url: laroute.route('ticket.operator.message.showRendered', {
            'id': e.message.id
          }),
          success: function (data) {
            // Remove existing editor instance (before HTML is updated).
            $elm.find('form.edit textarea').editor().remove();
            var $message = $(data);
            if ($elm.hasClass('sp-message-collapsible')) {
              ticket.showMessage($message);
            }
            $elm.replaceWith($message);
            App.OperatorTicketView.markAsNew($message);
          }
        });
        instance.ticketUpdate();
      }).listen('.App\\Modules\\Ticket\\Events\\OperatorDraftUpdated', e => {
        // Don't process our own drafts.
        if (e.message.user_id == operatorId) {
          return;
        }
        if (e.deleted) {
          $('.sp-reply-form-draft[data-message-id=' + e.message.id + ']').remove();

          // Hide draft icon on reply type button if no other drafts of this type exist.
          if ($('.sp-reply-form-draft[data-type=' + e.message.type + ']').length === 0) {
            $('.sp-reply-type .sp-action[data-type=' + e.message.type + '] .sp-other-draft-icon').addClass('sp:hidden');
          }
        } else {
          let $draftButton = $('.sp-reply-form-draft[data-message-id=' + e.message.id + ']');

          // If draft doesn't already exist, create new button from placeholder and add it.
          if (!$draftButton.length) {
            const $placeholderButton = $('.sp-reply-form-draft.sp-reply-form-draft-placeholder');
            $draftButton = $placeholderButton.clone().removeClass('sp-reply-form-draft-example sp:bg-yellow-800!').prependTo($placeholderButton.parent());
          }

          // Create title for draft message preview.
          const title = Lang.get('ticket.drafting_message', {
            name: e.message.user_name,
            time: '<time class="timeago" datetime="' + new Date(e.message.updated_at * 1000).toISOString() + '">' + timeAgo.format(new Date(e.message.updated_at * 1000)) + '</time>'
          });

          // Simpler title without timeago for tooltip.
          var $title = $('<span>').html(title);
          $title.find('time').remove();

          // Set data attributes and title.
          $draftButton.attr('data-message-id', e.message.id);
          $draftButton.attr('data-type', e.message.type);
          $draftButton.attr('data-title', title);
          $draftButton.attr('title', $title.text().trim());

          // Show button if form is visible.
          if ($('.message-form:not(.edit)').is(':visible') && e.message.type == 0 || $('.notes-form').is(':visible') && e.message.type == 1 || $('.forward-form').is(':visible') && e.message.type == 2) {
            $draftButton.removeClass('sp:hidden');
          }

          // Show draft icon on reply type button.
          $('.sp-reply-type .sp-action[data-type=' + e.message.type + '] .sp-other-draft-icon').removeClass('sp:hidden');

          // If this draft was already visible, force a re-load.
          const $previewContainer = $('.sp-draft-preview');
          if ($previewContainer.is(':visible') && $previewContainer.data('message-id') == e.message.id) {
            $draftButton.trigger('click').trigger('click');
          }
        }
        instance.ticketUpdate();
      }).listen('.App\\Modules\\Ticket\\Events\\TicketCustomFieldUpdated', () => {
        $.ajax({
          url: laroute.route('ticket.operator.ticket.customfields', {
            'id': ticket.parameters().ticketId
          }),
          success: function (response) {
            if (typeof response.data.customfields != 'undefined') {
              $('.sp-sidebar-panel[data-context-id="ticket-details"] .customfields').html(response.data.customfields);

              // Enable hide/show password toggle, textarea editor and flatpickr if needed
              $('.sp-sidebar-panel[data-context-id="ticket-details"] .customfields').find('input[type=password]').hideShowPassword();
              customfieldEditor();
              $('.datepicker').datepicker();
              $('.sp-sidebar-panel[data-context-id="ticket-details"] .customfields').trigger('refreshed');
            }
          }
        });
        instance.ticketUpdate();
      }).listen('.App\\Modules\\Ticket\\Events\\AssignedUpdated', e => {
        $assignSelectize[0].selectize.clear(true);
        $assignSelectize[0].selectize.refreshOptions(false);
        $.each(e.assigned, function (index, value) {
          $assignSelectize[0].selectize.addOption({
            id: value.id,
            formatted_name: value.name,
            avatar_url: value.avatar_url
          });
          $assignSelectize[0].selectize.refreshOptions(false);
          $assignSelectize[0].selectize.addItem(value.id, true);
        });

        // Show/hide take button depending if self is assigned to ticket and only one assigned.
        var assigned = e.assigned.some(function (obj) {
          return obj.hasOwnProperty('id') && obj['id'] == operatorId;
        });
        if (assigned && e.assigned.length === 1) {
          $('.take-ticket').addClass('sp:hidden');
        } else {
          $('.take-ticket').removeClass('sp:hidden');
        }
        instance.ticketUpdate();
      }).listen('.App\\Modules\\Ticket\\Events\\BrandUpdated', e => {
        $('.sp-brand-name').val(e.name);

        // A lot of things change, so let's refresh the page.
        window.location.reload();
      }).listen('.App\\Modules\\Ticket\\Events\\CcUpdated', e => {
        if (typeof ticket.ccSelectize()[0] !== 'undefined') {
          // We need to keep a list of the 'unremovable' options so they get added back properly.
          var options = [];
          $.each(ticket.ccSelectize()[0].selectize.options, function (index, option) {
            if (typeof option.unremovable !== 'undefined' && option.unremovable) {
              options.push(option);
            }
          });
          $.each(e.cc, function (index, value) {
            options.push({
              text: value,
              value: value
            });
          });
          ticket.ccSelectize()[0].selectize.clear(true);
          ticket.ccSelectize()[0].selectize.refreshOptions(false);
          $.each(options, function (index, value) {
            ticket.ccSelectize()[0].selectize.addOption(value);
            ticket.ccSelectize()[0].selectize.refreshOptions(false);
            ticket.ccSelectize()[0].selectize.addItem(value.value, true);
          });
        }
        instance.ticketUpdate();
      }).listen('.App\\Modules\\Ticket\\Events\\DepartmentUpdated', e => {
        $('select[name="department"]').val(e.id);

        // A lot of things change, so let's refresh the page.
        window.location.reload();
      }).listen('.App\\Modules\\Ticket\\Events\\PriorityUpdated', e => {
        $('select[name="priority"]').val(e.id);
        instance.ticketUpdate();
      }).listen('.App\\Modules\\Ticket\\Events\\ReplyDueTimeUpdated', e => {
        $('.sp-reply-duetime').html(e.due_time);
        if (e.due_time == Lang.get('ticket.set_reply_due_time')) {
          $('.update-duetime .remove-duetime').hide();
        } else {
          $('.update-duetime .remove-duetime').show();
        }
        if (e.paused_time == null) {
          $('.paused-duetime').hide();
        } else {
          $('.paused-duetime').show().html(e.paused_time);
        }
        instance.ticketUpdate();
      }).listen('.App\\Modules\\Ticket\\Events\\ResolveDueTimeUpdated', e => {
        $('.sp-resolve-duetime').html(e.due_time);
        if (e.due_time == Lang.get('ticket.set_resolution_due_time')) {
          $('.update-duetime .remove-duetime').hide();
        } else {
          $('.update-duetime .remove-duetime').show();
        }
        if (e.paused_time == null) {
          $('.paused-duetime').hide();
        } else {
          $('.paused-duetime').show().html(e.paused_time);
        }
        instance.ticketUpdate();
      }).listen('.App\\Modules\\Ticket\\Events\\SlaPlanUpdated', e => {
        $('.edit-slaplan').html(e.sla_plan_name);
        $('select[name="slaplan"]').val(e.sla_plan).attr('data-id', e.sla_plan);
        instance.ticketUpdate();
      }).listen('.App\\Modules\\Ticket\\Events\\StatusUpdated', e => {
        // Update status in sidebar
        if ($('select[name="status"]').val() != e.id) {
          $('select[name="status"]').val(e.id);

          // Update the status dropdown in the notes box (only if it's changed)
          $('.notes-form, .forward-form').find('select[name="to_status"]').val(e.id);
        }

        // Update reply options status and if closed, hide close button
        if (e.id == closedStatusId) {
          $('.close-ticket, .close-ticket-options, .close-ticket-without-notification').addClass('sp:hidden');
          $('.sp-dropdown-container:not(.close-ticket-options) .lock-ticket').removeClass('sp:md:hidden');
        } else {
          $('.close-ticket, .close-ticket-options, .close-ticket-without-notification').removeClass('sp:hidden');
          $('.sp-dropdown-container:not(.close-ticket-options) .lock-ticket').addClass('sp:md:hidden');
        }
        instance.ticketUpdate();
      }).listen('.App\\Modules\\Ticket\\Events\\SubjectUpdated', e => {
        $('.sp-ticket-subject').text(e.subject);
        $('.sp-edit-subject').val(e.subject);
        instance.ticketUpdate();
      }).listen('.App\\Modules\\Ticket\\Events\\TagsUpdated', e => {
        $tagSelectize[0].selectize.clear(true);
        $tagSelectize[0].selectize.refreshOptions(false);
        $.each(e.tags, function (index, value) {
          $tagSelectize[0].selectize.addOption({
            id: value.id,
            name: value.name,
            original_name: value.original_name,
            colour: value.colour,
            colour_text: value.colour_text
          });
          $tagSelectize[0].selectize.refreshOptions(false);
          $tagSelectize[0].selectize.addItem(value.original_name, true);
        });
        instance.ticketUpdate();
      }).listen('.App\\Modules\\Ticket\\Events\\TicketLocked', () => {
        $('.lock-ticket').addClass('sp:hidden');
        $('.sp-title-description .sp-locked-icon, .unlock-ticket').removeClass('sp:hidden');
        instance.ticketUpdate();
      }).listen('.App\\Modules\\Ticket\\Events\\TicketUnlocked', () => {
        $('.lock-ticket').removeClass('sp:hidden');
        $('.sp-title-description .sp-locked-icon, .unlock-ticket').addClass('sp:hidden');
        instance.ticketUpdate();
      }).listen('.App\\Modules\\Ticket\\Events\\UserUpdated', e => {
        $('.edit-user').html(e.name);

        // A lot of things change, so let's refresh the page.
        window.location.reload();
      });

      // Unsubscribe from channel before leaving page.
      window.addEventListener('beforeunload', function () {
        App.Notifications.connector().leave('App.Modules.Ticket.Models.Ticket.' + ticket.parameters().ticketId);
      });
    };
  }
  App.extend('TicketViewAction', new TicketViewAction());
  App.extend('TicketViewForm', new Form());
  $(document).ready(function () {
    // Initialise reply editor.
    if ($('.sp-reply-type .sp-action[data-type=0]').hasClass('sp-active')) {
      App.TicketViewForm.initReplyForm({}, false);
    }

    // Date picker
    $('.datepicker').datepicker();

    // Timepicker
    $('.timepicker').timepicker();

    // Reply type
    $('.sp-reply-type .sp-action').on('click', function () {
      $('.sp-tabs li#Messages').trigger('click');
      switch ($(this).data('type')) {
        case 1:
          App.TicketViewForm.toggleNotesForm();
          break;
        case 2:
          App.TicketViewForm.toggleForwardForm().then(function (editor) {
            if (!editor || editor.plugins.content.getText().length > 0) {
              return;
            }
            var selector = '.sp-messages-container[data-position="inline"] .sp-message';
            selector += ticket.parameters().replyOrder === 'ASC' ? ':first' : ':last';
            ticket.forwardFrom($(selector));
          });
          break;
        default:
          App.TicketViewForm.toggleReplyForm();
      }
    });

    // Open print view when browser print button is clicked (or browser print shortcut).
    $(window).beforeprint(() => App.TicketView.print());

    // Process take button
    $('.take-ticket').on('click', App.TicketViewAction.take);
    // Process close button
    $('.close-ticket').on('click', App.TicketViewAction.close);
    $('.close-ticket-without-notification').on('click', () => App.TicketViewAction.close(false));
    // Process lock button
    $('.lock-ticket').on('click', App.TicketViewAction.lock);
    // Process unlock button
    $('.unlock-ticket').on('click', App.TicketViewAction.unlock);
    // Process watch button
    $('.watch-ticket').on('click', App.TicketViewAction.watch);
    // Process unwatch button
    $('.unwatch-ticket').on('click', App.TicketViewAction.unwatch);
    // Process unmerge button
    $('.unmerge-ticket').on('click', App.TicketViewAction.unmerge);
    $(document).on('click', '.merge-ticket', App.TicketViewAction.merge);
    $('.restore-ticket').on('click', function () {
      restoreTicket();
    });

    // Process delete button
    $('.delete-forever-ticket').on('click', App.TicketViewAction.deleteFromTrash);
    $('.delete-ticket').on('click', App.TicketViewAction.moveToTrash);
    // Process block button
    $('.block-ticket').on('click', App.TicketViewAction.block);

    /*
     * Handle updating the ticket side bar
     */
    var $ticketDetails = $('.sp-ticket-details');
    $ticketDetails.find('select[name=priority]').on('change', function () {
      updateTicket(laroute.route('ticket.operator.action.update'), $(this).serializeArray());
    });
    $ticketDetails.find('select[name=department]').on('change', function () {
      changeDepartment({
        department_id: $(this).val()
      });
    });
    $ticketDetails.find('select[name=status]').on('change', function () {
      if (typeof closedStatusId !== 'undefined' && $(this).val() == closedStatusId) {
        // If they closed the ticket, we want to handle this differently...
        App.TicketViewAction.close();
      } else {
        updateTicket(laroute.route('ticket.operator.action.update'), $(this).serializeArray());
      }

      // Update the status in the notes box.
      $('.notes-form, .forward-form').find('select[name="to_status"]').val($(this).val());
    });

    // Update SLA plan
    $ticketDetails.find('.edit-slaplan').on('click', function () {
      // Change to a loading icon
      $('.edit-slaplan').removeClass('sp-detail-link').html("<i class='fa-solid fa-spinner fa-spin'></i>");

      // Fetch matching SLA plans and update dropdown before displaying.
      $.get(laroute.route('ticket.operator.ticket.slaPlans', {
        id: ticket.parameters().ticketId
      }), function (response) {
        if (response.status == 'success') {
          $slaPlanDropdown = $ticketDetails.find('select[name="slaplan"]');

          // Empty dropdown.
          $slaPlanDropdown.empty();

          // Add 'none' option.
          $slaPlanDropdown.append($('<option>', {
            value: 0,
            text: Lang.get('general.none')
          }));

          // Add matching SLA plans as options.
          $.each(response.data, function (key, value) {
            $slaPlanDropdown.append($('<option>', {
              value: value.id,
              text: value.name
            }));
          });

          // Set current SLA plan as selected value.
          $slaPlanDropdown.val($slaPlanDropdown.attr('data-id'));

          // Display dropdown.
          $('.edit-slaplan, .update-slaplan').toggle();
        } else {
          $('.sp-ticket-update.sp-alert-error').show(500).delay(5000).hide(500);
        }
      }).fail(function () {
        $('.sp-ticket-update.sp-alert-error').show(500).delay(5000).hide(500);
      });
    });
    $ticketDetails.find('select[name="slaplan"]').on('change', function () {
      var value = $(this).val();

      // Post data
      $.post(laroute.route('ticket.operator.ticket.updateSlaPlan', {
        id: ticket.parameters().ticketId
      }), {
        slaplan: value
      }, function (response) {
        if (response.status == 'success') {
          $('.sp-ticket-update.sp-alert-success').show(500).delay(5000).hide(500);

          // Show escalation rules tabs if we have any
          if (response.data.escalationrules) {
            $('.sp-tabs #EscalationRules').removeClass('sp:hidden');
          } else {
            $('.sp-tabs #EscalationRules').addClass('sp:hidden');
          }

          // Update data attribute on dropdown
          $('select[name="slaplan"]').attr('data-id', value);

          // Switch back to edit link
          $('.edit-slaplan').addClass('sp-detail-link').html(response.data.name);
          $('.edit-slaplan, .update-slaplan').toggle();
          ticket.updateEscalationsTable();
        } else {
          $('.sp-ticket-update.sp-alert-error').show(500).delay(5000).hide(500);
        }
      }, "json").fail(function () {
        $('.sp-ticket-update.sp-alert-error').show(500).delay(5000).hide(500);
      });
    });

    // Update due time
    $ticketDetails.find('.edit-duetime').on('click', function () {
      $(this).parent().find('.update-duetime').toggle();
    });
    $ticketDetails.find('.update-duetime button').on('click', function () {
      var date,
        time,
        $this = $(this);

      // Are we updating or removing?
      if ($this.hasClass('update')) {
        date = $this.parents('.update-duetime').find('input[name="duetime_date"]').val();
        time = $this.parents('.update-duetime').find('input[name="duetime_time"]').val();
      }

      // Post data
      $.post(laroute.route('ticket.operator.ticket.updateDueTime', {
        id: ticket.parameters().ticketId
      }), {
        duetime_type: $this.parents('.update-duetime').find('input[name="duetime_type"]').val(),
        duetime_date: date,
        duetime_time: time
      }, function (response) {
        if (response.status == 'success') {
          $('.sp-ticket-update.sp-alert-success').show(500).delay(5000).hide(500);

          // Update due time and hide form
          var className = $this.parents('.update-duetime').find('input[name="duetime_type"]').val() == '1' ? '.sp-reply-duetime' : '.sp-resolve-duetime';
          $(className).html(response.data);
          $this.parents('.update-duetime').hide();
          $('.paused-duetime').hide();

          // If no time set, hide the trash can icon, else show it
          if (response.data === null) {
            $this.parents('.update-duetime').find('.remove-duetime').hide();
          } else {
            $this.parents('.update-duetime').find('.remove-duetime').show();
          }
          ticket.updateEscalationsTable();
        } else {
          $('.sp-ticket-update.sp-alert-error').show(500).delay(5000).hide(500);
        }
      }, "json").fail(function () {
        $('.sp-ticket-update.sp-alert-error').show(500).delay(5000).hide(500);
      });
    });

    // Update ticket custom fields
    $('.save-fields').on('click', function () {
      var $this = $(this);
      var data = $this.parents('form').serializeArray();
      updateTicket(laroute.route('ticket.operator.action.updateCustomFields'), data).then(() => $this.trigger('fields-saved'));
    });

    // Forward message.
    $(document.body).on('submit', '.forward-form', function (event) {
      event.preventDefault();

      // Make sure we have at least one recipient to forward the message to.
      if ($forwardToSelectize[0].selectize.getValue().length === 0 && $forwardCcSelectize[0].selectize.getValue().length === 0 && $forwardBccSelectize[0].selectize.getValue().length === 0) {
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
    $(document.body).on('submit', '.message-form, .notes-form', function (event) {
      event.preventDefault();

      // If it's an edit or new message
      if ($(this).hasClass('edit')) {
        ticket.updateMessage($(this), $(this).find('textarea:not(.CodeMirror textarea)').eq(0));
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
          var url = laroute.route('ticket.operator.ticket.updateSubject', {
            id: ticket.parameters().ticketId
          });
          $.post(url, {
            subject: $(context).val()
          }).done(function (response) {
            if (response.status == 'success') {
              $('.sp-ticket-update.sp-alert-success').show(500).delay(5000).hide(500);
              // Update subject
              subject = $('.edit-subject').val();
            } else {
              $('.sp-ticket-update.sp-alert-error').show(500).delay(5000).hide(500);
              // Show old subject
              $('.sp-ticket-subject').text(subject);
            }
          }).fail(function () {
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
    $('.sp-ticket-subject').on('click', function () {
      var self = this;
      setTimeout(function () {
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
    $('.sp-edit-subject').on('keyup', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        $(this).trigger('blur'); // This will trigger focusout which calls updateSubject
      }
    }).on('focusout', function () {
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
      $('span.split-ticket').removeClass('sp:hidden');
    }

    // Enable button if at least one checkbox ticked
    $(document.body).on('click', 'span.split-ticket input', function (event) {
      event.stopPropagation();

      // Show message actions always (not just on hover) when checked.
      $(this).parents('.sp-message-actions').toggleClass('sp:pointer-fine:inline-block', $(this).prop('checked'));

      // Ensure if notes, any other instances of same message is ticked
      $('span.split-ticket input[data-id="' + $(this).data('id') + '"]').prop('checked', $(this).prop('checked'));

      // Show button if at least one is ticked
      if ($('span.split-ticket input:checked').length) {
        $('.split-ticket-action').removeClass('sp:hidden');
        $('.split-ticket-button').prop('disabled', false);
      } else {
        $('.split-ticket-action').addClass('sp:hidden');
        $('.split-ticket-button').prop('disabled', true);
      }
    });

    // Split checked messages to a new ticket
    $('.split-ticket-button').on('click', function () {
      var selected = '';
      // Add checked fields to form
      $('span.split-ticket input:checked').each(function () {
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
     * Check ticket mentions for current user
     */
    ticket.highlightUserMentions($('.sp-message'));
    /*
     * END Check ticket mentions for current user
     */

    // Apply macro
    $('.apply-macro').on('click', function () {
      var text = he.encode($(this).text()),
        description = he.encode($(this).data('description')),
        data = $(this).data('macro');

      // Show the alert
      Swal.fire({
        title: Lang.get('ticket.run_macro'),
        html: Lang.get('ticket.run_macro_desc', {
          'macro': text,
          'description': description
        }),
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3B91CE",
        confirmButtonText: Lang.get('general.run'),
        showLoaderOnConfirm: true,
        preConfirm: function () {
          return applyMacro(data);
        },
        allowOutsideClick: function () {
          return !Swal.isLoading();
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
        $('.sp-reply-all-recipients, .cc-emails').show();
        $('.sp-reply-recipients').hide();
      } else {
        $(this).parents('.reply-all').find('.sp-action .sp-icon').addClass('fa-reply');
        $('.sp-reply-all-recipients, .cc-emails').hide();
        $('.sp-reply-recipients').show();
      }
    });

    // Toggle between short and full recipients form.
    $('.sp-simplified-recipients, .sp-full-recipients .sp\\:table-row > .sp\\:table-cell:first-child').on('click', function () {
      $('.sp-simplified-recipients, .sp-full-recipients').toggle();
      const $replyAll = $('.reply-all');
      if (!$replyAll.hasClass('reply-all-permitted')) {
        return;
      }
      if ($('.sp-full-recipients:visible').length) {
        $replyAll.prependTo('.to-emails').show();
      } else {
        $replyAll.prependTo('.recipients .sp\\:flex').show();
      }
      $replyAll.find('.sp-action').toggleClass('sp:m-1 sp:me-2');
    });

    // From email input
    var fromSelectizeConfig = {
      persist: false,
      dropdownParent: 'body',
      plugins: ['disable_delete']
    };
    $('select[name="department_email"]').selectize(fromSelectizeConfig);
    ticket.ccSelectize();

    // Show CC email input
    $('.add-cc').on('click', function () {
      $('.cc-emails').show();
      $('.add-cc, .cc-emails').hide();
    });

    // Show BCC email input
    $('.add-bcc').on('click', function () {
      $('.bcc-emails').show();
      $('.add-bcc, .bcc-emails').hide();
    });

    /**
     * Initialise Forward tab.
     */
    var userSearchSelectizeConfig = {
        render: {
          item: function (item, escape) {
            return '<div class="item' + (item.unremovable ? ' unremovable' : '') + '">' + escape(item.value) + '</div>';
          },
          option: function (item, escape) {
            return '<div>' + '<img class="sp-avatar sp:max-w-5" src="' + escape(item.avatar_url) + '" /> &nbsp;' + escape(item.formatted_name) + (item.organisation ? ' (' + escape(item.organisation || '') + ')' : '') + (item.email ? '<br /><span class="sp-description">' + escape(item.email || '') + '</span>' : '') + '</div>';
          }
        },
        load: function (query, callback) {
          if (!query.length) return callback();

          // Hide Add CC / Add BCC to stop spinner from overlapping.
          var $elements = $('.add-cc:visible, .add-bcc:visible');
          $elements.hide();

          // Search for users
          $.get(laroute.route('user.operator.search'), {
            brand_id: ticket.parameters().brandId,
            q: query
          }).done(function (res) {
            res.data = res.data.map(function (value) {
              // Add needed info for search and selected item to work.
              value.value = value.email;
              value.text = value.firstname + ' ' + value.lastname + ' <' + value.email + '>';
              return value;
            });
            callback(res.data);
          }).fail(function () {
            callback();
          }).always(function () {
            $elements.show();
          });
        }
      },
      $forwardFromSelectize = $('select[name="from_address"]').selectize(fromSelectizeConfig),
      $forwardToSelectize = $('select[name="to_address[]"]').selectize($.extend({}, emailSelectizeConfig(ticket.defaultSelectizePlugins()), userSearchSelectizeConfig)),
      $forwardCcSelectize = $('select[name="cc_address[]"]').selectize($.extend({}, emailSelectizeConfig(ticket.defaultSelectizePlugins()), userSearchSelectizeConfig)),
      $forwardBccSelectize = $('select[name="bcc_address[]"]').selectize($.extend({}, emailSelectizeConfig(ticket.defaultSelectizePlugins()), userSearchSelectizeConfig));

    /**
     * Edit user on ticket
     */
    $('.edit-user').on('click', function () {
      $('.update-user').toggle();
    });
    $userSelectize = $('select[name="user"]').selectize({
      valueField: 'id',
      labelField: 'formatted_name',
      searchField: ['formatted_name', 'email'],
      placeholder: Lang.get('user.search_for_user_operator'),
      create: false,
      render: {
        optgroup_header: function (item, escape) {
          return '<div class="optgroup_header sp:px-3 sp:py-1.5 sp:font-bold">' + escape(item.label) + '</div>';
        },
        option: function (item, escape) {
          return '<div>' + '<img class="sp-avatar sp:max-w-5" src="' + escape(item.avatar_url) + '" /> &nbsp;' + escape(item.formatted_name) + (item.organisation ? ' (' + escape(item.organisation || '') + ')' : '') + (item.email ? '<br /><span class="sp-description">' + escape(item.email || '') + '</span>' : '') + '</div>';
        }
      },
      load: function (query, callback) {
        if (!query.length) return callback();
        var self = this;
        $.get(laroute.route('user.operator.search'), {
          q: query,
          brand_id: ticket.parameters().brandId,
          operators: 1
        }).done(function (res) {
          self.addOptionGroup(Lang.choice('user.user', 1), {
            label: Lang.choice('user.user', 2)
          });
          self.addOptionGroup(Lang.choice('general.operator', 1), {
            label: Lang.choice('general.operator', 2)
          });
          self.refreshOptions();
          callback(res.data);
        }).fail(function () {
          callback();
        });
      },
      onChange: function (value) {
        if (value) {
          // Attempt to update user
          updateTicket(laroute.route('ticket.operator.action.update'), $('select[name="user"]').serializeArray());
        }
      }
    });

    /**
     * Create new user and update ticket.
     */
    $('.create-new-user .new-user-toggle').on('click', function () {
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
          success: function (response) {
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
        }).fail(function () {
          Swal.fire(Lang.get('messages.error'), Lang.get('messages.error_created', {
            item: Lang.get('general.record')
          }), 'error');
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
      load: function (query, callback) {
        if (!query.length) return callback();
        $.ajax({
          url: laroute.route('user.organisation.search'),
          type: 'GET',
          dataType: 'json',
          data: {
            q: query,
            brand_id: ticket.parameters().brandId
          },
          error: function () {
            callback();
          },
          success: function (res) {
            callback(res.data);
          }
        });
      },
      onChange: function (value) {
        // We want to set a separate input if they enter an existing organisation.
        if (value.length > 0 && value !== this.getOption(value).textContent) {
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
      searchField: ['name'],
      create: tagPermission ? true : false,
      createFilter: function (input) {
        return input.length <= 45;
      },
      maxItems: null,
      placeholder: Lang.get('ticket.type_in_tags') + '...',
      render: {
        item: function (item, escape) {
          return '<div class="item" style="background-color: ' + escape(item.colour) + '; color: ' + escape(item.colour_text) + '">' + escape(item.name) + '</div>';
        },
        option: function (item, escape) {
          return '<div>' + '<i class="fa-solid fa-circle" style="color: ' + escape(item.colour) + '"></i>' + '&nbsp; ' + escape(item.name) + '</div>';
        }
      },
      load: function (query, callback) {
        if (!query.length) return callback();
        $.get(laroute.route('ticket.operator.tag.search'), {
          q: query
        }).done(function (res) {
          callback(res.data);
        }).fail(function () {
          callback();
        });
      },
      onChange: function (tags) {
        if (!tags) {
          // In case of removing all tags
          tags = [];
        }
        // Detach and re-attach the list of assigned tags
        $.post(laroute.route('ticket.operator.ticket.assignTags', {
          id: ticket.parameters().ticketId
        }), {
          'tags': tags
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
      }
    });

    /**
     * Assign operator to ticket
     */
    $assignSelectize = $('#assignOperator').selectize({
      plugins: ['remove_button'],
      valueField: 'id',
      labelField: 'formatted_name',
      searchField: ['formatted_name', 'email'],
      create: false,
      maxItems: null,
      placeholder: Lang.get('ticket.assign_operator') + '...',
      render: {
        item: function (item, escape) {
          return '<div class="item">' + '<img class="sp-avatar sp:max-w-4" src="' + escape(item.avatar_url) + '" />&nbsp; ' + escape(item.formatted_name) + '</div>';
        },
        option: function (item, escape) {
          return '<div>' + '<img class="sp-avatar sp:max-w-5" src="' + escape(item.avatar_url) + '" />&nbsp; ' + escape(item.formatted_name) + '</div>';
        }
      },
      load: function (query, callback) {
        if (!query.length) return callback();

        // Set the route for the current department
        var route = laroute.route('ticket.operator.department.search', {
          id: $('select[name="department"]').val()
        });
        $.get(route, {
          s: query,
          brand_id: ticket.parameters().brandId
        }).done(function (res) {
          callback(res.data);
        }).fail(function () {
          callback();
        });
      },
      onChange: function (assigned_operators) {
        if (!assigned_operators) {
          // In case of removing all operators
          assigned_operators = [];
        }
        // Detach and re-attach the list of assigned operators
        $.post(laroute.route('ticket.operator.action.assign'), {
          ticket: ticket.parameters().ticketId,
          operator: assigned_operators,
          replace: true
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
      }
    });

    /**
     * Linked Tickets
     */
    $(document).on('click', '.add-link', function () {
      TicketAction.link(ticket.parameters().ticketId).then(function (result) {
        if (result.value) {
          $('.sp-ticket-update.sp-alert-success').show(500).delay(5000).hide(500);

          // Update linked tickets list
          $('.linked-tickets-list').html(result.value.data);
        }
      });
    });
    $(document).on('click', '.linked-tickets .unlink', function () {
      var $this = $(this);
      $.ajax({
        url: $this.data('route'),
        type: 'POST',
        data: {
          'ticket': ticket.parameters().ticketId + ',' + $this.data('id')
        },
        dataType: 'json'
      }).done(function (response) {
        if (response.status == 'success') {
          $('.sp-ticket-update.sp-alert-success').show(500).delay(5000).hide(500);

          // Update linked tickets list
          $('.linked-tickets-list').html(response.data);
        } else {
          $('.sp-ticket-update.sp-alert-error').show(500).delay(5000).hide(500);
        }
      }).fail(function () {
        $('.sp-ticket-update.sp-alert-error').show(500).delay(5000).hide(500);
      });
    });

    // Load escalation rules table on clicking tab for first time
    $(document).on('click', '.sp-tabs #EscalationRules', function () {
      if (!ticket.isEscalationsTableLoaded()) {
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
    var setDateType = function () {
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
    $(document).on('click', '.cancel-followup', function () {
      refreshFollowUpTab();
    });
    $(document).on('click', '.edit-followup', function () {
      // Reload follow up tab with edit form
      refreshFollowUpTab($(this).data('id'));
    });
    $(document).on('click', '.save-followup', function () {
      var $button = $(this),
        saveFollowUp = function ($button) {
          // Disable button
          $button.prop('disabled', true);
          var data = $('.followup-form').serializeArray();
          data.push({
            name: 'ticket',
            value: ticket.parameters().ticketId
          });

          // Post updated data
          return $.ajax({
            url: $('.followup-form').data('uri'),
            type: $('.followup-form').data('method'),
            data: data,
            dataType: 'json'
          }).done(function (response) {
            if (response.status == 'success') {
              $('.sp-ticket-update.sp-alert-success').show(500).delay(5000).hide(500);

              // Update follow ups badge
              if (response.data) {
                $('li#Followup .followup-count').show().find('.sp-badge').text(response.data);
              }

              // Reload follow up tab
              refreshFollowUpTab();
            } else {
              $('.sp-ticket-update.sp-alert-error').show(500).delay(5000).hide(500);

              // Re-enable button
              $(this).prop('disabled', false);
            }
            return response;
          }).fail(function () {
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
            return saveFollowUp($button);
          },
          allowOutsideClick: function () {
            return !Swal.isLoading();
          }
        });
      } else {
        saveFollowUp($button);
      }
    });
    $(document).on('click', '.delete-followup', function () {
      var $followUp = $(this).data('id');
      var params = {
        ajax: {
          url: laroute.route('ticket.operator.followup.destroy', {
            'followup': $followUp
          })
        }
      };
      new deleteAlert(params).fireDefault(Lang.get('ticket.follow_up')).then(function (result) {
        if (result.value) {
          $('.sp-ticket-update.sp-alert-success').show(500).delay(5000).hide(500);
          if (parseInt(result.value.data) > 0) {
            $('li#Followup .followup-count').show().find('.sp-badge').text(result.value.data);
          } else {
            $('li#Followup .followup-count').hide();
          }

          // Reload table
          $('#tabFollowup .dataTable').dataTable().api().ajax.reload();
        }
      });
    });
    function updateTicket(route, data) {
      // Disable buttons and dropdowns
      var selector = '.sp-sidebar-panel button, .sp-sidebar-panel select',
        $disabled = $(selector).filter(':disabled');
      $(selector).prop('disabled', true);

      // Add ticket ID
      data.push({
        name: 'ticket',
        value: ticket.parameters().ticketId
      });

      // Post updated data
      return $.post(route, data, function (response) {
        if (response.status == 'success') {
          $('.sp-ticket-update.sp-alert-success').show(500).delay(5000).hide(500);

          // Specific case for updating user
          if (response.message != 'undefined' && response.message == 'ticket_user_updated') {
            $('.edit-user').text(response.data);
            $('.update-user').hide();

            // We need to update a lot of details on the page. Quick fix, refresh the page.
            window.location.reload();

            // Show success message while page loads
            $('.sp-ticket-update.sp-alert-success').show(500).delay(5000).hide(500);
          }
        } else {
          $('.sp-ticket-update.sp-alert-error').show(500).delay(5000).hide(500);
        }
      }, "json").fail(function () {
        $('.sp-ticket-update.sp-alert-error').show(500).delay(5000).hide(500);
      }).always(function () {
        // Enable buttons and dropdowns
        $(selector).not($disabled).prop('disabled', false);
      });
    }
    function changeDepartment(data) {
      // Disable buttons and dropdowns
      var selector = '.sp-quick-actions button, .sp-sidebar-panel button, .sp-sidebar-panel select',
        $disabled = $(selector).filter(':disabled');
      $(selector).prop('disabled', true);

      // Post data to perform action
      $.post(laroute.route('ticket.operator.action.department'), $.extend(data || {}, {
        ticket: ticket.parameters().ticketId
      }), function (response) {
        if (response.status == 'success') {
          $('.sp-ticket-update.sp-alert-success').show(500).delay(5000).hide(500);

          // Check we're still allowed to view ticket.
          if (!response.data.operator_can_view) {
            window.location.reload(); // Reload, this will redirect back to the grid with an error message.
            return;
          }

          // Update assigned operators and remove operators from the dropdown that are no longer assigned.
          $assignSelectize[0].selectize.loadedSearches = {};
          $assignSelectize[0].selectize.setValue(response.data.assigned, true);
          $.each($assignSelectize[0].selectize.options, function (index, value) {
            if ($.inArray(value.id, response.data.assigned) === -1) {
              $assignSelectize[0].selectize.removeOption(value.id);
            }
          });
          $assignSelectize[0].selectize.refreshOptions(false);

          // If the ticket has a department email dropdown
          var first,
            $fromSelectize = $('select[name="department_email"]');
          if ($fromSelectize.length) {
            // Update department emails list
            first = null;
            $fromSelectize[0].selectize.clearOptions();
            $.each(response.data.emails, function (index, value) {
              if (first === null) first = index;
              $fromSelectize[0].selectize.addOption({
                value: index,
                text: value
              });
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
              $forwardFromSelectize[0].selectize.addOption({
                value: index,
                text: value
              });
              $forwardFromSelectize[0].selectize.refreshOptions(false);
            });

            // Add "me" option back.
            $forwardFromSelectize[0].selectize.addOption({
              value: me.value,
              text: me.text
            });
            $forwardFromSelectize[0].selectize.refreshOptions(false);

            // Select first option
            $forwardFromSelectize[0].selectize.addItem(first, true);
          }

          // Update custom fields
          if (typeof response.data.customfields != 'undefined') {
            $('.sp-sidebar-panel[data-context-id="ticket-details"] .customfields').html(response.data.customfields);

            // Just check to see if we have any custom fields for this department
            if ($('.sp-sidebar-panel[data-context-id="ticket-details"] .customfields').html().trim() == '') {
              // None - hide custom fields section
              $('.sp-sidebar-panel[data-context-id="ticket-details"] .sp-customfields-container').addClass('sp:hidden');
            } else {
              // We do - show custom fields section
              $('.sp-sidebar-panel[data-context-id="ticket-details"] .sp-customfields-container').removeClass('sp:hidden');

              // Enable hide/show password toggle and textarea editor if needed
              $('.sp-sidebar-panel[data-context-id="ticket-details"] .customfields').find('input[type=password]').hideShowPassword();
              customfieldEditor();
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
      }, "json").fail(function () {
        $('.sp-ticket-update.sp-alert-error').show(500).delay(5000).hide(500);
      }).always(function () {
        // Enable buttons and dropdowns
        $(selector).not($disabled).prop('disabled', false);
      });
    }
    function restoreTicket() {
      $.ajax({
        url: laroute.route('ticket.operator.action.restore'),
        type: 'POST',
        data: {
          ticket: ticket.parameters().ticketId
        },
        dataType: 'json'
      }).done(function (response) {
        if (response.status == 'success') {
          // Reload ticket.
          window.location.reload();

          // Show success message while page loads
          $('.sp-ticket-update.sp-alert-success').show(500).delay(5000).hide(500);
        } else {
          $('.sp-tickets-update.sp-alert-error').show(500).delay(5000).hide(500);
        }
      }).fail(function () {
        $('.sp-tickets-update.sp-alert-error').show(500).delay(5000).hide(500);
      });
    }
    function applyMacro(macroId) {
      var data = {
        macro: macroId,
        ticket: ticket.parameters().ticketId
      };
      return $.post(laroute.route('ticket.operator.macro.apply'), data).then(function (response) {
        if (response.status == 'success') {
          $('.sp-ticket-update.sp-alert-success').show(500).delay(5000).hide(500);
          if (response.data.deleted) {
            // Deleted ticket - go back to ticket grid
            setTimeout(function () {
              window.location.href = ticket.parameters().ticketGridUrl;
            }, 2000);
          }
          return response;
        }
        throw new Error(response.statusText);
      }).catch(function () {
        $('.sp-ticket-update.sp-alert-error').show(500).delay(5000).hide(500);
      });
    }
    function refreshFollowUpTab(edit) {
      // If we want to edit a follow up.
      edit = typeof edit === 'undefined' ? 0 : edit;

      // Show loading icon
      $('#tabFollowup').html('<i class="fa-solid fa-spinner fa-pulse"></i>');

      // Fetch view
      $.get(laroute.route('ticket.operator.followup.render', {
        id: ticket.parameters().ticketId,
        edit: edit
      }), {}, function (response) {
        if (response.status == 'success') {
          // Update form
          $('#tabFollowup').html(response.data);

          // Initialise date picker.
          $('.datepicker').datepicker();

          // Initialise sortable.
          $("#sortable").sortable({
            draggable: '.rule',
            ghostClass: 'sp:opacity-50',
            handle: '.sp-sortable-handle'
          });

          // Initialise timepicker.
          $('.followup-form').find('.timepicker').timepicker();

          // Handle rules on refreshing tab, this will call code in escalationrule.js
          $(".rule:first :input").prop('disabled', true);
          $('.rule').filter(function () {
            return $(this).css("display") != "none";
          }).find('.rule-action select').trigger('change');
        } else {
          // Show message to refresh
          $('#tabFollowup').html(Lang.get('messages.please_refresh'));
        }
      }, "json").fail(function () {
        // Show message to refresh
        $('#tabFollowup').html(Lang.get('messages.please_refresh'));
      });
    }
    events.listen();
  });

  /*
   * Keyboard shortcuts.
   */
  App.KeyboardShortcuts.SHORTCUT_FOCUS_REPLY_FORM.bind(App.TicketViewForm.toggleReplyForm);
  App.KeyboardShortcuts.SHORTCUT_FOCUS_NOTES_FORM.bind(App.TicketViewForm.toggleNotesForm);
  App.KeyboardShortcuts.SHORTCUT_FOCUS_FORWARD_FORM.bind(App.TicketViewForm.toggleForwardForm);
  App.KeyboardShortcuts.SHORTCUT_TOGGLE_USER_DETAILS.bind(function () {
    if ($('#tabUser').is(':visible')) {
      $('ul.sp-tabs li#Ticket').trigger('click');
    } else {
      $('ul.sp-tabs li#User').trigger('click');
    }
  });
  App.KeyboardShortcuts.SHORTCUT_TAKE_TICKET.bind(function () {
    if (!shortcutIsPermitted('take-ticket')) {
      return;
    }
    shortcutConfirmationPopup(Lang.get('core.shortcut_take_ticket'), App.TicketViewAction.take);
  });
  App.KeyboardShortcuts.SHORTCUT_CLOSE_TICKET.bind(function () {
    if (!shortcutIsPermitted('close-ticket')) {
      return;
    }
    shortcutConfirmationPopup(Lang.get('core.shortcut_close_ticket'), App.TicketViewAction.close);
  });
  App.KeyboardShortcuts.SHORTCUT_LOCK_TICKET.bind(function () {
    if (!shortcutIsPermitted('lock-ticket')) {
      return;
    }
    shortcutConfirmationPopup(Lang.get('core.shortcut_lock_ticket'), App.TicketViewAction.lock);
  });
  App.KeyboardShortcuts.SHORTCUT_UNLOCK_TICKET.bind(function () {
    if (!shortcutIsPermitted('unlock-ticket')) {
      return;
    }
    App.TicketViewAction.unlock();
  });
  App.KeyboardShortcuts.SHORTCUT_TRASH_TICKET.bind(function () {
    if (!shortcutIsPermitted('delete-ticket')) {
      return;
    }
    shortcutConfirmationPopup(Lang.get('core.shortcut_trash_ticket'), App.TicketViewAction.moveToTrash);
  });
  App.KeyboardShortcuts.SHORTCUT_BLOCK_USER.bind(function () {
    if (!shortcutIsPermitted('block-ticket')) {
      return;
    }
    shortcutConfirmationPopup(Lang.get('core.shortcut_block_user'), App.TicketViewAction.block);
  });
  App.KeyboardShortcuts.SHORTCUT_WATCH_TICKET.bind(function () {
    if (!shortcutIsPermitted('watch-ticket')) {
      return;
    }
    App.TicketViewAction.watch();
  });
  App.KeyboardShortcuts.SHORTCUT_UNWATCH_TICKET.bind(function () {
    if (!shortcutIsPermitted('unwatch-ticket')) {
      return;
    }
    App.TicketViewAction.unwatch();
  });
  App.KeyboardShortcuts.SHORTCUT_MERGE_TICKET.bind(function () {
    if (!shortcutIsPermitted('merge-ticket')) {
      return;
    }
    App.TicketViewAction.merge();
  });
  App.KeyboardShortcuts.SHORTCUT_UNMERGE_TICKET.bind(function () {
    if (!shortcutIsPermitted('unmerge-ticket')) {
      return;
    }
    shortcutConfirmationPopup(Lang.get('core.shortcut_unmerge_ticket'), App.TicketViewAction.unmerge);
  });
  App.KeyboardShortcuts.SHORTCUT_EXPAND_ALL.bind(() => App.TicketView.expandAll());
  App.KeyboardShortcuts.SHORTCUT_COLLAPSE_ALL.bind(() => App.TicketView.collapseAll());
  App.KeyboardShortcuts.SHORTCUT_PRINT_TICKET.bind(() => App.TicketView.print());
  var shortcutIsPermitted = function (className) {
    var $elm = $('.' + className);
    return !($elm.length === 0 || $elm.hasClass('sp:hidden'));
  };
  var shortcutConfirmationPopup = function (title, action) {
    Swal.fire({
      title: title,
      showCancelButton: true,
      confirmButtonText: Lang.choice('general.submit', 1),
      preConfirm: action
    });
  };
  /*
   * END Keyboard shortcuts.
   */
})();