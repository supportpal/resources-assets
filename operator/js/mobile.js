$(document).ready(function () {
  // Header mobile navigation button
  $('header .sp-mobile-nav > div').on('click', function () {
    $(this).toggleClass('sp:bg-primary-800 sp:bg-primary-600');
    $('header nav').slideToggle(500);
  });

  // Clicking navigation menu in mobile
  $('a.sp-nav-item, a.sp-nav-sub-menu').on('click', function () {
    if ($(window).width() < 1024) {
      $(this).find('.fa-solid').toggleClass('sp-chevron fa-chevron-down');
      $(this).next().slideToggle(500);
    }
  });

  // Hide the mobile navigation on clicking the content (sidebar or main) area
  $('#content').on('click', function () {
    if ($('header .sp-mobile-nav').is(':visible')) {
      $('header nav').hide().addClass('');
    }
  });
});