$(function () {

    var $sidebar = $('#sidebar'),
        sidebarOpenState = 'sp-sidebar-open',
        sidebarClosedState = 'sp-sidebar-closed';

    // Collapse appropriate side boxes on DOM load.
    if (typeof Cookies !== 'undefined') {
        toggleAllCookieState();
    }

    // Toggle side box visibility when sidebar is refreshed.
    $sidebar.on('refreshedSidebar', function () {
        toggleAllCookieState();
    });

    // Toggle side box visibility when clicked.
    $sidebar.on('click', '.sp-collapsible', function(e) {
        e.stopPropagation();

        toggleSidebox(this);

        // The sidebox must have an ID to store the cookie.
        if (typeof Cookies !== 'undefined' && $(this).prop('id')) {
            Cookies.set(
                $(this).prop('id'),
                $(this).hasClass('sp-closed') ? 'sp-collapsed' : 'sp-expanded',
                {samesite: 'lax'}
            );
        }
    });

    // Toggle sidebar open/closed state.
    $sidebar.on('click', '.sp-toggle-sidebar', function () {
        toggleSidebar();

        // The sidebar must have an ID to store the cookie.
        if (typeof Cookies !== 'undefined' && $sidebar.prop('id')) {
            Cookies.set(
                $sidebar.prop('id'),
                $sidebar.hasClass(sidebarClosedState) ? sidebarClosedState : sidebarOpenState,
                {samesite: 'lax'}
            );
        }
    });

    /**
     * Open / close the sidebar.
     */
    function toggleSidebar() {
        // Note: The remove and add classes are important to make sure this works when you change from small to large
        // screen and vice versa after clicking the sidebar.
        if ($(window).width() < 1024) {
            // Mobile view
            $sidebar
                .removeClass(sidebarClosedState)
                .addClass('lg:sp-w-72')
                .toggleClass('sp-w-72 sm:sp-w-72 ' + sidebarOpenState);

            $sidebar.find('.sp-toggle-sidebar')
                .addClass('lg:sp-ml-72')
                .toggleClass('sp-ml-72 sm:sp-ml-72');
        } else {
            // Desktop view
            $sidebar
                .removeClass('sp-w-72 sm:sp-w-72 ' + sidebarOpenState)
                .toggleClass('lg:sp-w-72 ' + sidebarClosedState);

            $sidebar.find('.sp-toggle-sidebar')
                .removeClass('sp-ml-72 sm:sp-ml-72')
                .toggleClass('lg:sp-ml-72');
        }
    }

    /**
     * Toggle the visibility of a given side box.
     *
     * @param context
     */
    function toggleSidebox(context) {
        // Change direction of arrow.
        $(context).find('.sp-chevron .fas').toggleClass('fa-chevron-down fa-chevron-up');
        $(context).toggleClass('sp-closed');

        // Toggle sidebox content.
        $(context).next().toggle();

        if ($(window).width() < 1024) {
            // Scroll to icon clicked on
            App.sidebarScrollbar
                .overlayScrollbars()
                .scroll($(context).parent().offset().top - $('header').outerHeight(), 500);
        }
    }

    /**
     * Loop over each side box and collapse it depending on the state of the cookie. By default,
     * all side boxes are expected to be open on DOM load.
     */
    function toggleAllCookieState() {
        $sidebar.find('.sp-collapsible').each(function (index) {
            if (typeof $(this).prop('id') !== 'undefined') {
                var cookie = Cookies.get($(this).prop('id'));

                // Side box is currently open but cookie says it should be closed.
                if (! $(this).hasClass('sp-closed') && cookie == 'sp-collapsed') {
                    toggleSidebox(this);
                }
            }
        });
    }

});