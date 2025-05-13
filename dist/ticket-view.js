(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('@supportpal/sweetalert2')) : typeof define === 'function' && define.amd ? define(['exports', '@supportpal/sweetalert2'], factory) : (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.SpTicket = {}, global.Swal));
})(this, function (exports, Swal) {
  'use strict';

  var Editor = /** @class */function () {
    function Editor() {
      /**
       * Key, value pair of editors which have been initialised.
       * Key is the text editor element ID. Value is bool (initialised or not).
       */
      this.editors = {};
    }
    Editor.prototype.initEditor = function (selector, $form, opts, focus) {
      if (focus === void 0) {
        focus = true;
      }
      var dfd = $.Deferred(),
        instance = this;
      if (this.isInitialised(selector)) {
        // If it's loaded but not focused once and we want to.
        if (focus && !this.isFocused(selector)) {
          this.editors[selector]['editor'].focus();
        }
        // This helps reset the sticky toolbar which can sometimes get stuck when switching tabs.
        this.editors[selector]['editor'].fire('ResizeWindow');
        return dfd.resolve(this.editors[selector]['editor']).promise();
      }
      opts = $.extend({}, {
        setup: function (editor) {
          editor.on('init', function () {
            instance.loadEditorContent(selector, $form, editor).then(function () {
              if (focus && !instance.isFocused(selector)) {
                editor.focus();
              }
              instance.setEditor(selector, focus, editor);
              $(selector).trigger('loaded-editor-content', [selector, $form, editor]);
              dfd.resolve(editor);
            });
          });
        }
      }, opts);
      var editor = $(selector).editor(opts);
      this.setEditor(selector, false, editor);
      return dfd.promise();
    };
    Editor.prototype.destroy = function (selector) {
      if (!this.isInitialised(selector)) {
        return;
      }
      delete this.editors[selector];
      $(selector).editor().remove();
    };
    Editor.prototype.loadEditorContent = function (selector, $form, editor) {
      var _a;
      var deferred = $.Deferred();
      var route = $(selector).data('route');
      if (typeof route !== 'string' || route === '') {
        return deferred.resolve();
      }
      $form = $form.find('.reply-form');
      $form.after('<div class="sp-editor-container"></div>');
      var $container = $form.next('.sp-editor-container');
      var $preview = $('<div class="sp-editor-preview sp-editor-content"></div>').hide();
      $container.append($preview);
      $preview.html('')
      // @ts-ignore
      .css((_a = $form.position()) !== null && _a !== void 0 ? _a : {}).css('width', $form.outerWidth()).css('height', $form.outerHeight(true)).addClass('loadinggif').show();
      $.get(route).done(function (json) {
        editor.setContent(json.data.purified_text);
        deferred.resolve();
      }).always(function () {
        $preview.hide();
      });
      return deferred.promise();
    };
    Editor.prototype.isInitialised = function (selector) {
      return this.editors.hasOwnProperty(selector) && this.editors[selector].hasOwnProperty('initialised') && this.editors[selector]['initialised'];
    };
    Editor.prototype.isFocused = function (selector) {
      return this.editors.hasOwnProperty(selector) && this.editors[selector].hasOwnProperty('focused') && this.editors[selector]['focused'];
    };
    Editor.prototype.setEditor = function (selector, focus, editor) {
      this.editors[selector] = {
        'initialised': true,
        'focused': focus,
        'editor': editor
      };
    };
    return Editor;
  }();
  var TicketView = /** @class */function () {
    function TicketView(ticket, replyOrder) {
      if (replyOrder === void 0) {
        replyOrder = 'ASC';
      }
      this.ticket = ticket;
      this.replyOrder = replyOrder;
      var scrollToMessage = this.scrollToMessage();
      if (!scrollToMessage) {
        this.addCollapsedMessageGroup();
      }
      ticket.loadAttachmentPreviews($('.sp-message.sp-message-collapsible'));
      ticket.showDownloadAllButton();
      if ($('.sp-message').length > 2) {
        $('.expand-messages').show();
      }
      this.registerListeners();
    }
    TicketView.prototype.print = function () {
      var $a = $('.sp-print-ticket a');
      if ($a.length === 0) {
        return;
      }
      window.open($a.attr('href'), '_blank');
    };
    TicketView.prototype.addCollapsedMessageGroup = function () {
      // Don't create if there's less than 2 messages, or a collapsed group already exists.
      if ($('.sp-message.sp-message-collapsed').length <= 2 || $('.sp-collapsed-messages').length) {
        return;
      }
      // Staff notes and ticket content regions of the screen
      var regions = [".sp-messages-container[data-position='top']", ".sp-messages-container[data-position='inline']"];
      for (var i = 0; i < regions.length; i++) {
        // Build the basic selector
        var basicSelector = $(regions[i] + ' > .sp-message.sp-message-collapsed');
        // If this region of the screen has more than 2 collapsed messages, let's shrink it!
        if (basicSelector.length > 2) {
          // Group the middle section of messages and hide them
          var items;
          if (this.replyOrder == 'ASC') {
            items = basicSelector.not(':first').not(':eq(-1)');
          } else {
            items = basicSelector.not(':last').not(':eq(0)');
          }
          items.wrapAll("<div class='sp-collapsed-messages'><span>" + Lang.get('ticket.older_messages', {
            'count': items.length
          }) + "</span></div>");
        }
      }
      $('.sp-collapsed-messages').children().children().hide();
    };
    TicketView.removeCollapsedMessageGroup = function () {
      $('.sp-collapsed-messages').each(function () {
        $(this).replaceWith(function () {
          return $(this).find('.sp-message').show();
        });
      });
    };
    TicketView.prototype.expand = function ($message) {
      // AJAX load the message into the view.
      this.ticket.loadMessage($message);
      this.ticket.showMessage($message);
    };
    TicketView.collapse = function ($message) {
      // If we're collapsing and the edit view is showing, hide it and show the normal message view.
      if ($message.hasClass('sp-message-collapsible') && $message.find('.sp-message-text-edit').is(':visible')) {
        $message.find('.sp-message-text').show();
        $message.find('.sp-message-text-edit').hide();
      }
      // Toggle between collapsed and collapsible mode
      $message.find('.sp-message-text').children('.sp-message-text-original').addClass('sp-hidden');
      $message.find('.sp-message-text').children('.sp-message-text-trimmed').removeClass('sp-hidden');
      $message.addClass('sp-message-collapsed');
      $message.removeClass('sp-message-collapsible');
    };
    TicketView.prototype.expandAll = function () {
      var instance = this;
      TicketView.removeCollapsedMessageGroup();
      $('.sp-messages-container .sp-message-collapsed').each(function () {
        instance.expand($(this));
      });
      $('.expand-messages, .collapse-messages').toggle();
    };
    TicketView.prototype.collapseAll = function () {
      $('.sp-messages-container .sp-message-collapsible').each(function () {
        TicketView.collapse($(this));
      });
      this.addCollapsedMessageGroup();
      $('.expand-messages, .collapse-messages').toggle();
    };
    TicketView.prototype.scrollToMessage = function () {
      var _this = this;
      var hash = window.location.hash.substring(1),
        $message = this.ticket.getMessage(hash),
        scrollToMessage = false;
      if ($message !== false) {
        var messageElement_1 = $message;
        // Remove the collapsed class if the URL wants to scroll to a specific message (/view/18#message-2).
        scrollToMessage = true;
        // Wait 1 seconds to start, due to page moving about
        setTimeout(function () {
          return _this.ticket.scrollToMessage(messageElement_1);
        }, 1000);
      }
      return scrollToMessage;
    };
    TicketView.prototype.registerListeners = function () {
      var $container = this.ticket.getMessagesContainer();
      $('.sp-collapsed-messages').on('click', TicketView.removeCollapsedMessageGroup);
      // Collapsing or opening message
      $(document).on('click', '.sp-message-collapsed .sp-message-header-interactive, .sp-message-collapsible .sp-message-header .sp-message-header-interactive', function (e) {
        e.stopPropagation();
      });
      var instance = this;
      $(document).on('click', '.sp-message-collapsed', function () {
        instance.expand($(this));
      });
      $(document).on('click', '.sp-message-collapsible .sp-message-header', function () {
        TicketView.collapse($(this).parents('.sp-message-collapsible'));
      });
      // Expand/collapse all messages on click
      $('.expand-messages').on('click', instance.expandAll.bind(instance));
      $('.collapse-messages').on('click', instance.collapseAll.bind(instance));
      // Remove expandable from visible messages.
      $('.sp-message-collapsible').each(function () {
        instance.ticket.removeExpandable($(this));
        // DEV-2163, DEV-2069. By default, we only load 20 messages from the database for performance reasons.
        // If the ticket has >20 messages and the operator hasn't read any of them then they're collapsible (visible)
        // but have no content. We need to force load these messages.
        //
        // loadMessage already ensures that we don't reload a message where the content is already visible.
        instance.ticket.loadMessage($(this));
      });
      $container.on('click', '.sp-download-all', function () {
        var $attachments = $(this).parents('ul.sp-attachments').find('li');
        var filename = instance.ticket.getSubject();
        new ZipFile().create($attachments, filename);
      });
      $container
      // Expand quoted areas
      .on('click', '.expandable', function () {
        $(this).next().toggle();
      })
      // Open links in a new window/tab. Needs rel="noopener" due to
      // https://www.jitbit.com/alexblog/256-targetblank---the-most-underestimated-vulnerability-ever/
      .on('click', '.sp-message .sp-message-text a', function () {
        $(this).attr('target', '_blank').attr('rel', 'noopener');
      });
    };
    return TicketView;
  }();

  /******************************************************************************
  Copyright (c) Microsoft Corporation.
    Permission to use, copy, modify, and/or distribute this software for any
  purpose with or without fee is hereby granted.
    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
  REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
  AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
  INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
  LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
  OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
  PERFORMANCE OF THIS SOFTWARE.
  ***************************************************************************** */
  /* global Reflect, Promise, SuppressedError, Symbol, Iterator */

  var extendStatics = function (d, b) {
    extendStatics = Object.setPrototypeOf || {
      __proto__: []
    } instanceof Array && function (d, b) {
      d.__proto__ = b;
    } || function (d, b) {
      for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p];
    };
    return extendStatics(d, b);
  };
  function __extends(d, b) {
    if (typeof b !== "function" && b !== null) throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
    extendStatics(d, b);
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  }
  typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
  };
  var DraftMessage = /** @class */function () {
    function DraftMessage() {
      this.autoSaveDraftTime = 30000;
      this.drafts = {};
      for (var _i = 0, _a = this.getTextEditors(); _i < _a.length; _i++) {
        var id = _a[_i];
        this.drafts[id] = '';
      }
      this.registerListeners();
    }
    DraftMessage.prototype.getDrafts = function () {
      return this.drafts;
    };
    DraftMessage.prototype.setDraft = function (key, value) {
      this.drafts[key] = value;
    };
    DraftMessage.prototype.draftHasChanged = function (key, new_value) {
      new_value = DraftMessage.normaliseMessage(new_value);
      return DraftMessage.normaliseMessage(this.drafts[key]) !== new_value && new_value !== '';
    };
    DraftMessage.prototype.addAttachmentsToData = function ($form, data) {
      // Add attachments to AJAX data.
      $form.find('input[name^="attachment["]:not(:disabled)').serializeArray().forEach(function (obj) {
        data[obj.name] = obj.value;
      });
      return data;
    };
    DraftMessage.prototype.storeDraftUsingBeacon = function (data) {
      if (!("sendBeacon" in navigator)) {
        return;
      }
      navigator.sendBeacon(this.getStoreRoute(), new URLSearchParams($.param(data)));
    };
    DraftMessage.prototype.storeDraftUsingAjax = function ($form, data) {
      return $.post(this.getStoreRoute(), data).then(function (response) {
        if (typeof response.status !== 'undefined' && response.status == 'success') {
          // Show saved message
          $form.find('.draft-success').text(response.message).show();
          // Show discard button
          $form.find('.discard-draft').show();
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
      });
    };
    DraftMessage.prototype.discardDraft = function ($form) {
      // Post data to perform action
      var instance = this;
      // Delete any attachments currently showing
      $form.find('input[name="attachment[]"]:not(:first)').remove();
      $form.find('.sp-attached-files li:not(:first) .sp-delete-attachment')
      // @ts-ignore
      .attr('data-silent', true).trigger('click');
      return $.post(instance.getDiscardRoute(), instance.getDiscardData($form)).then(function (response) {
        if (response.status == 'success') {
          $('.sp-ticket-update.sp-alert-success').show(500).delay(5000).hide(500);
          // Hide button
          $form.find('.discard-draft, .draft-success').hide();
        } else {
          $('.sp-ticket-update.sp-alert-error').show(500).delay(5000).hide(500);
        }
        return response;
      });
    };
    /**
     * Add &nbsp; to empty paragraphs so they don't get hidden in HTML.
     */
    DraftMessage.normaliseMessage = function (str) {
      return str.replace('<p></p>', '<p>&nbsp;</p>');
    };
    DraftMessage.prototype.autoSave = function (useBeacon) {
      if (this.autoSaveDraftTimer) {
        clearTimeout(this.autoSaveDraftTimer);
      }
      for (var editorId in this.drafts) {
        var $textarea = $('#' + editorId),
          $form = $textarea.parents('form');
        // Only if it's an editor (e.g. not for Twitter replies)
        if (!this.drafts.hasOwnProperty(editorId) || $form.find('.save-draft').length === 0 || !tinymce.get(editorId) || $form.find('input[type="submit"]').prop('disabled')) {
          continue;
        }
        // Get the draft message.
        var draftMessage = this.drafts[editorId];
        // Check if message has changed
        var currentMessage = $textarea.editor().getContent({
          withoutCursorMarker: true
        });
        if (draftMessage === null || !this.draftHasChanged(editorId, currentMessage)) {
          continue;
        }
        // Disable button while saving
        $form.find('.save-draft').prop('disabled', true);
        // Save draft
        this.saveDraft($form, useBeacon);
        // Re-enable button
        $form.find('.save-draft').prop('disabled', false);
      }
      // Delay the next poll by 30 seconds
      this.autoSaveDraftTimer = setTimeout(this.autoSave.bind(this), this.autoSaveDraftTime);
    };
    DraftMessage.prototype.registerListeners = function () {
      this.autoSave(false);
      // Before closing/redirecting away, check if there's a draft that needs to be saved.
      var instance = this;
      window.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'hidden') {
          instance.autoSave(true);
        }
      });
      var selector = Object.keys(this.drafts).map(function (v) {
        return '#' + v;
      }).join(',');
      $(selector).on('loaded-editor-content', function (e, selector, $form, editor) {
        var editorId = $(selector).attr('id');
        if (typeof editorId !== 'string') {
          throw new Error('Invalid id attribute.');
        }
        instance.setDraft(editorId, editor.getContent({
          withoutCursorMarker: true
        }));
      });
      // Save draft button
      $('.save-draft').on('click', function (e) {
        instance.saveDraft($(this).parents('form'), false);
      });
      // Discard draft button
      $('.discard-draft').on('click', function () {
        instance.discardDraft($(this).parents('form'));
      });
    };
    return DraftMessage;
  }();
  var FrontendDraftMessage = /** @class */function (_super) {
    __extends(FrontendDraftMessage, _super);
    function FrontendDraftMessage() {
      return _super !== null && _super.apply(this, arguments) || this;
    }
    FrontendDraftMessage.prototype.getTextEditors = function () {
      return [FrontendDraftMessage.messageId];
    };
    FrontendDraftMessage.prototype.saveDraft = function ($form, useBeacon) {
      var editor = $form.find('textarea:not(.CodeMirror textarea):eq(0)').editor(),
        messageWithoutCursorMarker = editor.getContent({
          withoutCursorMarker: true
        }),
        message = editor.getContent();
      // Update draft message variable
      this.setDraft(FrontendDraftMessage.messageId, messageWithoutCursorMarker);
      var data = {
        _token: $('meta[name=csrf_token]').prop('content'),
        ticket_number: $form.find('input[name="ticket_number"]').val(),
        is_draft: 1,
        text: message
      };
      // Add attachments to AJAX data.
      this.addAttachmentsToData($form, data);
      if (useBeacon) {
        this.storeDraftUsingBeacon(data);
      } else {
        this.storeDraftUsingAjax($form, data);
      }
    };
    FrontendDraftMessage.prototype.getStoreRoute = function () {
      return laroute.route('ticket.frontend.draft.store');
    };
    FrontendDraftMessage.prototype.getDiscardRoute = function () {
      return laroute.route('ticket.frontend.draft.discard');
    };
    FrontendDraftMessage.prototype.getDiscardData = function ($form) {
      return {
        ticket_number: $form.find('input[name="ticket_number"]').val()
      };
    };
    FrontendDraftMessage.prototype.discardDraft = function ($form) {
      var instance = this;
      return _super.prototype.discardDraft.call(this, $form).then(function (response) {
        if (response.status == 'success') {
          var editor = $('#' + FrontendDraftMessage.messageId).editor();
          editor.setContent('');
          instance.setDraft(FrontendDraftMessage.messageId, editor.getContent({
            withoutCursorMarker: true
          }));
        }
        return response;
      });
    };
    FrontendDraftMessage.messageId = 'newMessage';
    return FrontendDraftMessage;
  }(DraftMessage);
  function scrollToPosition(position) {
    var $elm = $('.sp-alert-sticky:visible');
    var $stickyHeight = $elm.length ? -48 : 0;
    $elm.each(function () {
      var height = $(this).outerHeight();
      if (height !== undefined) {
        $stickyHeight += height;
      }
    });
    $('#content').animate({
      scrollTop: position + $stickyHeight - 12
    }, 1000);
  }
  var Ticket = /** @class */function () {
    function Ticket() {
      this.messageDfd = $.Deferred();
      this.messageDfdNext = this.messageDfd;
      this.messageDfd.resolve();
    }
    Ticket.prototype.print = function () {
      var instance = this;
      // Lock the interface and show a waiting spinner (this may take a while on a large ticket).
      Swal.fire({
        title: Lang.get('general.loading'),
        allowOutsideClick: false,
        didOpen: function () {
          Swal.showLoading();
          var deferred = [];
          $('.sp-message').each(function (index, message) {
            deferred.push(instance.loadMessage($(message)));
          });
          $.when.apply($, deferred).then(function () {
            return Swal.close();
          });
        },
        didClose: function () {
          setTimeout(window.print, 100);
        }
      });
    };
    Ticket.prototype.loadMessage = function ($message, successCallback) {
      if (successCallback === void 0) {
        successCallback = null;
      }
      var instance = this;
      // This holds the trimmed and original versions of the message.
      var $text = $message.find('.sp-message-text');
      // If we're not currently in the processing of loading the message, and the message has not previously
      // been fetched then fire an AJAX request to load the message into the DOM.
      if (!$message.hasClass('sp-message-text-loading') && !$text.children('.sp-message-text-original').hasClass('sp-message-text-loaded')) {
        $message.find('.sp-message-text').append('<span class="sp-loading sp-description">' + '<i class="fas fa-spinner fa-pulse"></i>&nbsp; ' + Lang.get('general.loading') + '...' + '</span>');
        $message.addClass('sp-message-text-loading');
        // @ts-ignore
        this.messageDfdNext = this.messageDfdNext.then(function () {
          return $.get(instance.getLoadMessageRoute($message)).done(function (ajax) {
            // Load the message in, it should already be sanitized.
            $text.children('.sp-message-text-original').html(ajax.data.purified_text).addClass('sp-message-text-loaded');
            // Remove expandable - ONLY when expanding a message.
            // We must do this after the content has been made visible to the user!
            instance.removeExpandable($message);
            // Load attachment previews if needed.
            instance.loadAttachmentPreviews($message);
            // If a callback exists, run it.
            typeof successCallback === 'function' && successCallback();
          }).fail(function () {
            Swal.fire(Lang.get('messages.error'), Lang.get('messages.error_loading_message'), 'error');
          }).always(function () {
            // Unset loading icon.
            $message.removeClass('sp-message-text-loading');
            $message.find('.sp-message-text .sp-loading').remove();
          });
        });
        return this.messageDfdNext;
      } else {
        // Message has already been loaded.
        // Remove expandable if there's no other text visible.
        this.removeExpandable($message);
        // Load attachment previews if needed.
        this.loadAttachmentPreviews($message);
        // Run success callback if exists.
        typeof successCallback === 'function' && successCallback();
        return this.messageDfdNext;
      }
    };
    Ticket.prototype.showMessage = function ($message) {
      // Make the message visible.
      $message.removeClass('sp-message-collapsed').addClass('sp-message-collapsible');
      $message.find('.sp-message-text').children('.sp-message-text-trimmed').addClass('sp-hidden');
      $message.find('.sp-message-text').children('.sp-message-text-original').removeClass('sp-hidden');
      // Remove expandable if appropriate.
      this.removeExpandable($message);
    };
    Ticket.prototype.loadAttachmentPreviews = function ($message) {
      App.attachments.loadPreviews($message);
    };
    Ticket.prototype.removeExpandable = function ($message) {
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
    Ticket.prototype.scrollToMessage = function ($message) {
      // Uncollapse messages first
      TicketView.removeCollapsedMessageGroup();
      // AJAX load the message into the view.
      this.loadMessage($message);
      // Toggle collapsed state.
      if ($message.hasClass('sp-message-collapsed')) {
        $message.toggleClass('sp-message-collapsible sp-message-collapsed').find('.sp-message-text').children('.sp-message-text-original, .sp-message-text-trimmed').toggle();
      }
      // Special effects, set as blue for 3 seconds.
      $message.addClass('sp-new-message');
      setTimeout(function () {
        $message.removeClass('sp-new-message');
      }, 3000);
      // Scroll to it.
      scrollToPosition($message.position().top);
    };
    Ticket.prototype.showDownloadAllButton = function () {
      if (ZipFile.isSupported()) {
        this.getMessagesContainer().find('ul.sp-attachments').each(function () {
          if ($(this).find('li').length > 1) {
            $(this).find('.sp-download-all').show();
          }
        });
      }
    };
    return Ticket;
  }();
  var FrontendTicket = /** @class */function (_super) {
    __extends(FrontendTicket, _super);
    function FrontendTicket() {
      return _super !== null && _super.apply(this, arguments) || this;
    }
    FrontendTicket.prototype.getSubject = function () {
      return $('meta[name="ticket-subject"]').prop('content');
    };
    FrontendTicket.prototype.getMessagesContainer = function () {
      return $('.sp-message-block');
    };
    FrontendTicket.prototype.getMessage = function (hash) {
      // id should be in the format notes-%ID% so we need to split it into those two components.
      var components = hash.split('-');
      if (components.length !== 2 || !/^\d+$/.test(components[1])) {
        return false;
      }
      // Get messages.
      var messages = $('.sp-message-' + components[1]);
      return messages.length >= 1 ? messages.first() : false;
    };
    FrontendTicket.prototype.getLoadMessageRoute = function ($message) {
      var token = $('meta[name="token"]').prop('content'),
        route = laroute.route('ticket.frontend.message.showJson', {
          id: $message.data('id')
        });
      if (token.length !== 0) {
        route += "?token=" + token;
      }
      return route;
    };
    return FrontendTicket;
  }(Ticket);
  var OperatorDraftMessage = /** @class */function (_super) {
    __extends(OperatorDraftMessage, _super);
    function OperatorDraftMessage(replyTemplate) {
      var _this = _super.call(this) || this;
      _this.replyTemplate = replyTemplate;
      return _this;
    }
    OperatorDraftMessage.prototype.getTextEditors = function () {
      return [OperatorDraftMessage.messageId, OperatorDraftMessage.noteId, OperatorDraftMessage.forwardId];
    };
    OperatorDraftMessage.prototype.getStoreRoute = function () {
      return laroute.route('ticket.operator.message.store');
    };
    OperatorDraftMessage.prototype.getDiscardRoute = function () {
      return laroute.route('ticket.operator.message.discard');
    };
    OperatorDraftMessage.prototype.getDiscardData = function ($form) {
      var replyType = $form.find('input[name="reply_type"]').val();
      return {
        ticket_id: $form.data('ticket-id'),
        reply_type: replyType
      };
    };
    OperatorDraftMessage.prototype.setMessageDraft = function (value) {
      this.setDraft(OperatorDraftMessage.messageId, value);
    };
    OperatorDraftMessage.prototype.setNoteDraft = function (value) {
      this.setDraft(OperatorDraftMessage.noteId, value);
    };
    OperatorDraftMessage.prototype.setForwardDraft = function (value) {
      this.setDraft(OperatorDraftMessage.forwardId, value);
    };
    OperatorDraftMessage.prototype.saveDraft = function ($form, useBeacon) {
      var editor = $form.find('textarea:not(.CodeMirror textarea):eq(0)').editor(),
        messageWithoutCursorMarker = editor.getContent({
          withoutCursorMarker: true
        }),
        message = editor.getContent(),
        type = $form.find('input[name="reply_type"]').val();
      // Update draft message variable
      if (type == '1') {
        this.setNoteDraft(messageWithoutCursorMarker);
      } else if (type == '2') {
        this.setForwardDraft(messageWithoutCursorMarker);
      } else {
        this.setMessageDraft(messageWithoutCursorMarker);
      }
      var $usages = $form.find('input[name="cannedresponse_usage[]"]');
      var data = {
        _token: $('meta[name=csrf_token]').prop('content'),
        ticket: [$form.data('ticket-id')],
        reply_type: type,
        is_draft: 1,
        text: message,
        from_address: type == '2' ? $form.find('select[name="from_address"]').val() : null,
        to_address: type == '2' ? $form.find('select[name="to_address[]"]').val() : null,
        cc_address: type == '2' ? $form.find('select[name="cc_address[]"]').val() : null,
        bcc_address: type == '2' ? $form.find('select[name="bcc_address[]"]').val() : null,
        subject: type == '2' ? $form.find('input[name="subject"]').val() : null,
        cannedresponse_usage: $usages.val()
      };
      // Remove them otherwise their usage will be counted twice (when the message is posted).
      $usages.remove();
      // Add attachments to AJAX data.
      this.addAttachmentsToData($form, data);
      if (useBeacon) {
        this.storeDraftUsingBeacon(data);
      } else {
        this.storeDraftUsingAjax($form, data).then(function () {
          // Show draft icon in quick action
          $('.sp-reply-type .sp-action[data-type=' + type + '] .sp-draft-icon').removeClass('sp-hidden');
        });
      }
    };
    OperatorDraftMessage.prototype.discardDraft = function ($form) {
      var instance = this,
        replyType = $form.find('input[name="reply_type"]').val();
      return _super.prototype.discardDraft.call(this, $form).then(function (response) {
        if (response.status == 'success') {
          // Remove draft icon in quick action
          $('.sp-reply-type .sp-action[data-type=' + replyType + '] .sp-draft-icon').addClass('sp-hidden');
          // Clear editor
          if (replyType == 1) {
            $('#newNote').editor().setContent('');
            instance.setNoteDraft($('#newNote').editor().getContent({
              withoutCursorMarker: true
            }));
          } else if (replyType == 2) {
            $('#newForward').editor().setContent('');
            instance.setForwardDraft($('#newForward').editor().getContent({
              withoutCursorMarker: true
            }));
          } else {
            $('#newMessage').editor().setContent(instance.replyTemplate);
            $('#newMessage').editor().focus();
            instance.setMessageDraft($('#newMessage').editor().getContent({
              withoutCursorMarker: true
            }));
          }
        }
        return response;
      });
    };
    OperatorDraftMessage.messageId = 'newMessage';
    OperatorDraftMessage.noteId = 'newNote';
    OperatorDraftMessage.forwardId = 'newForward';
    return OperatorDraftMessage;
  }(DraftMessage);
  var OperatorTicket = /** @class */function (_super) {
    __extends(OperatorTicket, _super);
    function OperatorTicket() {
      return _super !== null && _super.apply(this, arguments) || this;
    }
    OperatorTicket.prototype.getSubject = function () {
      return $('.sp-ticket-subject').text();
    };
    OperatorTicket.prototype.getMessagesContainer = function () {
      return $('#tabMessages');
    };
    OperatorTicket.prototype.getMessage = function (hash) {
      // id should be in the format notes-%ID% so we need to split it into those two components.
      var components = hash.split('-');
      if (components.length !== 2 || !/^\d+$/.test(components[1])) {
        return false;
      }
      // Check whether a note (displayed at the top) or a message has been requested.
      var notesOnly = components[0].toUpperCase() === this.getNotesPlaceholder().replace('-%ID%', '').toUpperCase();
      // Get messages.
      var instance = this;
      var messages = $('.sp-message-' + components[1]).filter(function () {
        var isInline = instance.getMessagePosition($(this)) === "inline";
        return notesOnly ? !isInline : isInline;
      });
      return messages.length >= 1 ? messages.first() : false;
    };
    OperatorTicket.prototype.getMessagePosition = function ($message) {
      if ($message.parents(".sp-messages-container[data-position='top']").length) {
        return "top";
      }
      return "inline";
    };
    OperatorTicket.prototype.getId = function ($message) {
      // If the .messages-header doesn't exist in the previous siblings then we've been given
      // a note that's displayed at the top of the page.
      if (this.getMessagePosition($message) === "top") {
        return this.getNotesPlaceholder().replace('%ID%', $message.data('id'));
      } else {
        return this.getMessagesPlaceholder().replace('%ID%', $message.data('id'));
      }
    };
    OperatorTicket.prototype.getNotesPlaceholder = function () {
      return $('meta[name="notes-url-id"]').prop('content');
    };
    OperatorTicket.prototype.getMessagesPlaceholder = function () {
      return $('meta[name="messages-url-id"]').prop('content');
    };
    OperatorTicket.prototype.getLoadMessageRoute = function ($message) {
      return laroute.route('ticket.operator.message.showJson', {
        id: $message.data('id')
      });
    };
    return OperatorTicket;
  }(Ticket);
  exports.Editor = Editor;
  exports.FrontendDraftMessage = FrontendDraftMessage;
  exports.FrontendTicket = FrontendTicket;
  exports.OperatorDraftMessage = OperatorDraftMessage;
  exports.OperatorTicket = OperatorTicket;
  exports.TicketView = TicketView;
});