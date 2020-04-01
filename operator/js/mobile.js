$(document).ready(function () {
    // Header mobile navigation button
    $('header .sp-mobile-nav div').on('click', function () {
        $('header nav').slideToggle(500);
    });

    // Clicking navigation menu in mobile
    $('a.sp-nav-item, a.sp-nav-sub-menu').on('click', function () {
        if ($(window).width() <= 1024) {
            $(this).find('.fas').toggleClass('sp-chevron fa-chevron-down');
            $(this).next().slideToggle(500);
        }
    });

    // Hide the mobile navigation on clicking the content (sidebar or main) area
    $('#content').on('click', function () {
        if ($('header .sp-mobile-nav').is(':visible')) {
            $('header nav').hide().addClass('');
        }
    });

    // Toggle sidebar
    $('#sidebar').on('click', '.sp-toggle-sidebar', function (e) {
        // Note: The remove and add classes are important to make sure this works when you change from small to large
        // screen and vice versa after clicking the sidebar.
        if ($(window).width() <= 1024) {
            // Mobile view
            $('#sidebar').removeClass('sp-sidebar-closed')
                .addClass('lg:sp-w-72')
                .toggleClass('sp-w-72 sm:sp-w-72 sp-sidebar-open');
            $('.sp-toggle-sidebar').addClass('lg:sp-ml-72')
                .toggleClass('sp-ml-72 sm:sp-ml-72');
        } else {
            // Desktop view
            $('#sidebar').removeClass('sp-w-72 sm:sp-w-72 sp-sidebar-open')
                .toggleClass('lg:sp-w-72 sp-sidebar-closed');
            $('.sp-toggle-sidebar').removeClass('sp-ml-72 sm:sp-ml-72')
                .toggleClass('lg:sp-ml-72');
        }
    });
});
