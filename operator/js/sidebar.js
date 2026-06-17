$(function () {
  // =========================================================================
  // Cookie helpers – shared by both sidebars
  // =========================================================================

  var cookieOptions = {
    samesite: 'lax',
    path: '/'
  };
  function readCookie(name) {
    return typeof Cookies !== 'undefined' ? Cookies.get(name) : null;
  }
  function writeCookie(name, value) {
    if (typeof Cookies !== 'undefined') Cookies.set(name, value, cookieOptions);
  }
  function removeCookie(name) {
    if (typeof Cookies !== 'undefined') Cookies.remove(name);
  }

  // Shared sidebar state classes used by both navigation and context sidebars.
  var sidebarOpenClass = 'sp-sidebar-open';
  var sidebarClosedClass = 'sp-sidebar-closed';

  // =========================================================================
  // Navigation sidebar – left navigation
  // =========================================================================

  var $navPanel = $('#navigation-sidebar');

  // Dropdown element used when the navigation sidebar is collapsed (created lazily).
  var $iconDropdown = null;

  // Timer used to delay hiding the icon dropdown so the mouse can travel to it.
  var iconDropdownHideTimer = null;

  // Restore sidebar panel collapsed/expanded states from cookies.
  toggleAllCookieState();

  // Toggle sidebar panel visibility when clicked.
  $navPanel.on('click', '.sp-collapsible', function (e) {
    e.stopPropagation();

    // When the navigation sidebar is collapsed the dropdown is shown on hover;
    // ignore click events in that state.
    if (isNavSidebarClosed()) {
      return;
    }
    toggleSidebarPanel(this);

    // Store the collapsed/expanded state against the sidebar panel's own ID.
    var id = $(this).prop('id');
    if (id) writeCookie(id, $(this).hasClass('sp-closed') ? 'sp-collapsed' : 'sp-expanded');
  });

  // Show the icon dropdown on hover when the navigation sidebar is collapsed.
  $navPanel.on('mouseenter', '.sp-sidebar-panel-header', function () {
    if (!isNavSidebarClosed()) return;
    clearTimeout(iconDropdownHideTimer);
    showIconDropdown($(this).closest('.sp-sidebar-panel'));
  });

  // Start a short timer to hide the dropdown when the mouse leaves the sidebar panel,
  // giving the cursor time to travel into the floating dropdown itself.
  $navPanel.on('mouseleave', '.sp-sidebar-panel', function () {
    if (!isNavSidebarClosed()) return;
    iconDropdownHideTimer = setTimeout(hideIconDropdown, 150);
  });

  // Toggle navigation sidebar open/closed state.
  // helpdesk#3401 – on Safari iOS 'click' is often not fired, so also handle 'touchend'.
  // The preventDefault stops links in the navigation sidebar being accidentally followed.
  $navPanel.on('touchend click', '.sp-toggle-sidebar', function (e) {
    e.preventDefault();

    // Close any open icon dropdown (and return any borrowed content) when toggling the sidebar.
    hideIconDropdown();
    toggleNavSidebar();
    writeCookie('navigation-sidebar', $navPanel.hasClass(sidebarClosedClass) ? sidebarClosedClass : sidebarOpenClass);
  });

  // =========================================================================
  // Context sidebar – right side context
  // =========================================================================

  var $panel = $('#context-sidebar');
  if ($panel.length) {
    var $tabs = $panel.find('.sp-context-sidebar-tabs');
    var $content = $panel.find('.sp-context-sidebar-content');
    var resizeCookieName = 'context-sidebar-width';
    var contextCookieName = 'context-sidebar';
    var minWidth = 384;

    // Build a tab-strip button from each sp-sidebar-panel's sp-icon.
    $content.find('.sp-sidebar-panel').each(function () {
      var $box = $(this);
      var contextId = $box.data('context-id');
      // Icon may be a direct child (context-sidebar style) or inside a
      // sp-collapsible header row (sidebar style) – check both.
      var $icon = $box.find('> .sp-icon, > .sp-sidebar-panel-header .sp-icon').first();
      // Prefer an explicit title attribute; fall back to the h3 text.
      var label = $icon.attr('title') || $box.find('> .sp-sidebar-panel-header h3').text().trim() || '';

      // Check for status indicator
      var status = $box.data('context-status');
      var statusHtml = '';
      if (status) {
        statusHtml = '<i class="sp-context-status sp-context-status-' + status + ' fa-solid fa-circle"></i>';
      }
      var $btn = $('<button>').attr('type', 'button').attr('data-context-target', contextId).attr('title', label).addClass('sp-context-sidebar-tab-btn').html($icon.html() + statusHtml);

      // If panel is hidden by default, hide the button as well
      if ($box.hasClass('sp:hidden')) {
        $btn.addClass('sp:hidden');
      }
      $tabs.append($btn);

      // Remove title from icon within panel content.
      $icon.removeAttr('title');
    });

    // Resize handle – flex sibling inserted before the content area.
    var $resizeHandle = $('<div>').addClass('sp-context-sidebar-resize-handle sp:hidden');
    $content.before($resizeHandle);

    // Restore width + active panel(s) from cookies.
    var savedWidth = readCookie(resizeCookieName);
    if (savedWidth) $content.css('width', parseInt(savedWidth, 10) + 'px');

    // Only restore panel state from cookies on desktop; keep closed on mobile by default.
    if ($(window).width() >= 1024) {
      var savedState = readCookie(contextCookieName);
      if (savedState) {
        try {
          var parsed = JSON.parse(savedState);
          if (Array.isArray(parsed)) {
            // Current format: JSON array of active panel IDs.
            $.each(parsed, function (i, contextId) {
              // Only activate if the panel is not hidden
              var $panel = $content.find('[data-context-id="' + contextId + '"]');
              if ($panel.length && !$panel.hasClass('sp:hidden')) {
                activatePanel(contextId);
              }
            });
          }
          // JSON object = old multi-section format; silently discard.
        } catch (e) {
          // Plain string: old single-panel format.
          var $panel = $content.find('[data-context-id="' + savedState + '"]');
          if ($panel.length && !$panel.hasClass('sp:hidden')) {
            activatePanel(savedState);
          }
        }
      } else {
        // No saved state – open first panel marked as open by default.
        var $firstPanel = $content.find('.sp-sidebar-panel[data-context-open]:not(.sp\\:hidden)').first();
        if ($firstPanel.length) {
          activatePanel($firstPanel.data('context-id'));
        }
      }
    }
    syncContextSidebarVisibility();

    // Tab button – toggle the panel: activate + scroll if inactive, deactivate if already active.
    $tabs.on('click', '.sp-context-sidebar-tab-btn', function () {
      var contextId = $(this).data('context-target');
      if ($(this).hasClass('sp-sidebar-panel-active')) {
        deactivatePanel(contextId);
      } else {
        deactivateAll();
        activatePanel(contextId);
        scrollToPanel(contextId);
      }
      syncContextSidebarVisibility();
      savePanelState();
    });

    // Toggle button (from HTML) – close all panels.
    // helpdesk#3401 – also handle touchend for Safari iOS.
    $panel.on('touchend click', '.sp-toggle-sidebar', function (e) {
      e.preventDefault();
      deactivateAll();
      syncContextSidebarVisibility();
      savePanelState();
    });

    // Resize drag (desktop only – handle is hidden on mobile via CSS).
    var resizing = false,
      startX = 0,
      startWidth = 0;
    $resizeHandle.on('mousedown', function (e) {
      e.preventDefault();
      resizing = true;
      startX = e.clientX;
      startWidth = $content.outerWidth();
      $('body').addClass('sp-context-sidebar-resizing');
    });
    $(document).on('mousemove.contextsidebar', function (e) {
      if (!resizing) return;
      // maxWidth is the larger of 720px or half the page width
      var maxWidth = Math.max(720, $(window).width() / 2);
      $content.css('width', Math.min(maxWidth, Math.max(minWidth, startWidth + (startX - e.clientX))) + 'px');
    });
    $(document).on('mouseup.contextsidebar', function () {
      if (!resizing) return;
      resizing = false;
      $('body').removeClass('sp-context-sidebar-resizing');
      writeCookie(resizeCookieName, $content.outerWidth());
    });
    function activatePanel(contextId) {
      var $btn = $tabs.find('[data-context-target="' + contextId + '"]');
      if (!$btn.length) return;
      $btn.addClass('sp-sidebar-panel-active');
      $content.find('[data-context-id="' + contextId + '"]').addClass('sp-sidebar-panel-active');
    }
    function deactivatePanel(contextId) {
      $tabs.find('[data-context-target="' + contextId + '"]').removeClass('sp-sidebar-panel-active');
      $content.find('[data-context-id="' + contextId + '"]').removeClass('sp-sidebar-panel-active');
    }
    function deactivateAll() {
      $tabs.find('.sp-context-sidebar-tab-btn').removeClass('sp-sidebar-panel-active');
      $content.find('.sp-sidebar-panel').removeClass('sp-sidebar-panel-active');
    }
    function syncContextSidebarVisibility() {
      var hasActive = $content.find('.sp-sidebar-panel.sp-sidebar-panel-active').length > 0;
      $content.toggleClass('sp:hidden', !hasActive);
      $resizeHandle.toggleClass('sp:hidden', !hasActive);
    }
    function savePanelState() {
      var active = [];
      $tabs.find('.sp-context-sidebar-tab-btn.sp-sidebar-panel-active').each(function () {
        active.push($(this).data('context-target'));
      });
      active.length ? writeCookie(contextCookieName, JSON.stringify(active)) : removeCookie(contextCookieName);
    }
    function scrollToPanel(contextId) {
      var $target = $content.find('[data-context-id="' + contextId + '"]');
      if (!$target.length) return;
      // Calculate the target's scroll position within $content.
      var targetTop = $target.offset().top - $content.offset().top + $content.scrollTop();
      $content.animate({
        scrollTop: targetTop
      }, 200);
    }

    /**
     * Update the status indicator for a context panel.
     *
     * @param {string} contextId - The context panel ID
     * @param {string|null} status - The status color (green, orange, red, blue, gray) or null to remove
     */
    window.updateContextStatus = function (contextId, status) {
      var $btn = $tabs.find('[data-context-target="' + contextId + '"]');
      var $panel = $content.find('[data-context-id="' + contextId + '"]');
      if (!$btn.length || !$panel.length) return;

      // Remove existing status indicator
      $btn.find('.sp-context-status').remove();

      // Add new status indicator if provided
      if (status) {
        var $statusIcon = $('<i class="sp-context-status sp-context-status-' + status + ' fa-solid fa-circle"></i>');
        $btn.append($statusIcon);
        $panel.attr('data-context-status', status);
      } else {
        $panel.removeAttr('data-context-status');
      }
    };

    /**
     * Hide a context panel and its corresponding tab button.
     *
     * @param {string} contextId - The context panel ID to hide
     */
    window.hideContextPanel = function (contextId) {
      var $btn = $tabs.find('[data-context-target="' + contextId + '"]');
      var $panel = $content.find('[data-context-id="' + contextId + '"]');
      if (!$btn.length || !$panel.length) return;

      // First: Remove active classes
      deactivatePanel(contextId);

      // Second: Hide the button and panel
      $btn.addClass('sp:hidden');
      $panel.addClass('sp:hidden');

      // Third: Now check if ANY visible panels remain active
      // We need to exclude hidden panels from the check
      var hasActiveVisible = false;
      $content.find('.sp-sidebar-panel').each(function () {
        var $p = $(this);
        // Only count it as active if it has the active class AND is visible
        if ($p.hasClass('sp-sidebar-panel-active') && !$p.hasClass('sp:hidden') && $p.css('display') !== 'none') {
          hasActiveVisible = true;
        }
      });

      // If no visible panels are active, hide the entire context sidebar
      $content.toggleClass('sp:hidden', !hasActiveVisible);
      $resizeHandle.toggleClass('sp:hidden', !hasActiveVisible);

      // Save the updated state
      savePanelState();
    };

    /**
     * Show a context panel and its corresponding tab button.
     *
     * @param {string} contextId - The context panel ID to show
     * @param {boolean} activate - If true, activate the panel immediately
     */
    window.showContextPanel = function (contextId, activate = false) {
      var $btn = $tabs.find('[data-context-target="' + contextId + '"]');
      var $panel = $content.find('[data-context-id="' + contextId + '"]');
      if (!$btn.length || !$panel.length) return;

      // Show the tab button and panel
      $btn.removeClass('sp:hidden');
      $panel.removeClass('sp:hidden');
      if (activate) {
        activatePanel(contextId);
        syncContextSidebarVisibility();
        savePanelState();
      }
    };

    /**
     * Remove a context panel and its corresponding tab button.
     *
     * @param {string} contextId - The context panel ID to remove
     */
    window.removeContextPanel = function (contextId) {
      var $btn = $tabs.find('[data-context-target="' + contextId + '"]');
      var $panel = $content.find('[data-context-id="' + contextId + '"]');
      if (!$btn.length || !$panel.length) return;

      // Deactivate if currently active
      if ($btn.hasClass('sp-sidebar-panel-active')) {
        deactivatePanel(contextId);
      }

      // Remove the tab button and panel
      $btn.remove();
      $panel.remove();

      // Update sidebar visibility and save state
      syncContextSidebarVisibility();
      savePanelState();
    };
  }

  // =========================================================================
  // Shared helpers
  // =========================================================================

  /**
   * Returns true when the navigation sidebar is in its collapsed (narrow) state.
   */
  function isNavSidebarClosed() {
    return $(window).width() >= 1024 ? $navPanel.hasClass(sidebarClosedClass) : !$navPanel.hasClass(sidebarOpenClass);
  }

  /**
   * Show a floating dropdown of links from the given sidebar panel, positioned
   * to the right of the collapsed navigation sidebar icon.
   *
   * The panel's content element is physically moved into the dropdown (not cloned)
   * so that any JS-library bindings on child elements remain intact.
   *
   * @param {jQuery} $sidebarPanel
   */
  function showIconDropdown($sidebarPanel) {
    // Create the dropdown element once and reuse it.
    if (!$iconDropdown) {
      $iconDropdown = $('<div>').attr('id', 'sp-nav-icon-dropdown').hide().appendTo('body');

      // Keep the dropdown open while the cursor is inside it; hide when it leaves.
      $iconDropdown.on('mouseenter', function () {
        clearTimeout(iconDropdownHideTimer);
      }).on('mouseleave', function () {
        iconDropdownHideTimer = setTimeout(hideIconDropdown, 150);
      });
    }

    // Clicking the same icon again closes the dropdown.
    if ($iconDropdown.data('source') === $sidebarPanel[0] && $iconDropdown.is(':visible')) {
      hideIconDropdown();
      return;
    }

    // Return any previously borrowed content before borrowing new content.
    returnBorrowedContent();
    var title = $sidebarPanel.find('.sp-sidebar-panel-header h3').text().trim();
    var $body = $sidebarPanel.find('.sp-sidebar-panel-header + *');
    $iconDropdown.empty().data('source', $sidebarPanel[0]);
    if (title) {
      $iconDropdown.append($('<div>').addClass('sp-nav-icon-dropdown-title').text(title));
    }

    // Move (not clone) the content into the dropdown so JS library bindings stay intact.
    // Record where it came from so returnBorrowedContent() can put it back.
    $iconDropdown.data('borrowed', {
      $body: $body,
      $panel: $sidebarPanel
    });
    $body.detach().appendTo($iconDropdown);

    // Position just to the right of the collapsed navigation sidebar, capped so it
    // never extends beyond the bottom of the viewport.
    var iconOffset = $sidebarPanel.find('.sp-icon').offset();
    var availableHeight = $(window).height() - iconOffset.top - 16;
    // When there isn't much room below the icon, pin the bottom of the dropdown
    // 4 px from the viewport bottom so it isn't squashed to an unusable sliver.
    var smallHeight = availableHeight < 150;
    $iconDropdown.css({
      top: smallHeight ? '' : iconOffset.top - 8,
      bottom: smallHeight ? 4 : '',
      left: $navPanel.offset().left + $navPanel.outerWidth() + 4,
      maxHeight: Math.max(80, smallHeight ? $(window).height() - 8 : availableHeight) + 'px'
    }).show();
  }

  /**
   * Hide the icon dropdown, returning any borrowed content to its original panel first.
   */
  function hideIconDropdown() {
    returnBorrowedContent();
    if ($iconDropdown) $iconDropdown.hide();
  }

  /**
   * Return the content element that was moved into the dropdown back to its original
   * sidebar panel, restoring its collapsed/expanded display state.
   */
  function returnBorrowedContent() {
    if (!$iconDropdown) return;
    var borrowed = $iconDropdown.data('borrowed');
    if (!borrowed) return;

    // Put the content back after the panel header.
    borrowed.$body.detach().appendTo(borrowed.$panel);

    // Re-hide it if the panel is in its collapsed state.
    if (borrowed.$panel.find('.sp-sidebar-panel-header').hasClass('sp-closed')) {
      borrowed.$body.hide();
    }
    $iconDropdown.removeData('borrowed');
  }

  /**
   * Open / close the navigation sidebar.
   */
  function toggleNavSidebar() {
    // Note: The remove and add classes are important to make sure this works when you change from small to large
    // screen and vice versa after clicking the sidebar.
    if ($(window).width() < 1024) {
      // Mobile view
      $navPanel.removeClass(sidebarClosedClass).addClass('sp:lg:w-72').toggleClass('sp:w-72 sp:w-11 ' + sidebarOpenClass);
      $navPanel.find('.sp-toggle-sidebar').addClass('sp:lg:ms-72').toggleClass('sp:ms-72 sp:ms-11');
    } else {
      // Desktop view
      $navPanel.removeClass('sp:w-72 ' + sidebarOpenClass).toggleClass('sp:lg:w-72 ' + sidebarClosedClass);
      $navPanel.find('.sp-toggle-sidebar').removeClass('sp:ms-72').toggleClass('sp:lg:ms-72');
    }
  }

  /**
   * Toggle the visibility of a given sidebar panel.
   *
   * @param context
   */
  function toggleSidebarPanel(context) {
    // Change direction of arrow.
    $(context).find('.sp-chevron .fa-solid').toggleClass('fa-chevron-down fa-chevron-up');
    $(context).toggleClass('sp-closed');

    // Toggle sidebar panel content.
    $(context).next().toggle();
  }

  /**
   * Loop over each sidebar panel and collapse it depending on the state of the cookie. By default,
   * all sidebar panels are expected to be open on DOM load.
   */
  function toggleAllCookieState() {
    $navPanel.find('.sp-collapsible').each(function () {
      var id = $(this).prop('id');
      if (id && readCookie(id) === 'sp-collapsed' && !$(this).hasClass('sp-closed')) {
        toggleSidebarPanel(this);
      }
    });
  }
});