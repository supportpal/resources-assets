$(function () {

    var $sidebar = $('#sidebar');

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
        if (typeof Cookies !== 'undefined' && typeof $(this).prop('id') !== 'undefined') {
            Cookies.set($(this).prop('id'), $(this).hasClass('sp-closed') ? 'sp-collapsed' : 'sp-expanded');
        }
    });

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

        if ($(window).width() <= 1024) {
            // Scroll to icon clicked on
            $('#sidebar').overlayScrollbars().scroll($(context).parent().offset().top - $('header').outerHeight(), 500);
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