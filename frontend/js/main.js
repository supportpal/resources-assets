$(document).ready(function () {

    // Change the cursor to wait when an AJAX request is fired
    $(document)
        .ajaxStart(function () {
            $(document.body).css({'cursor': 'wait'})
        })
        .ajaxComplete(function () {
            $(document.body).css({'cursor': 'default'})
        })
        .ajaxStop(function () {
            $(document.body).css({'cursor': 'default'});
        });

    // Change language
    $('select[name=language]').on('change', function (e) {
        var returnTo = $("option:selected", this).data('return-to'),
            valueSelected = this.value;

        $.post(laroute.route('core.set.language'), {
            language: valueSelected
        }).always(function (data) {
            if (typeof returnTo !== 'undefined' && returnTo !== '') {
                window.location.href = returnTo;
            } else {
                // Add the language in the URL and reload the page
                var separator = (window.location.search.indexOf("?") === -1) ? "?" : "&";
                window.location.search += separator + 'lang=' + valueSelected;
            }
        });
    });

    // Search - open/close search bar
    $('.sp-search-button, .sp-search-close').on('click', function () {
        $('header .sp-search').toggleClass('sp-hidden');

        if ($('header .sp-search').is(':visible')) {
            $('header .sp-search').find('input[name=query]').focus();
        }
    });

    // Search - Don't submit if it's empty
    $('form[name=search]').on('submit', function (e) {
        if ($(this).find('input[name=query]').val() == '') {
            e.preventDefault();
        }
    });

    // Mobile navigation
    $('.sp-mobile-nav-button').on('click', function () {
        $('.sp-mobile-nav').slideToggle().toggleClass('sp-hidden');
        $('body').toggleClass('sp-mobile-nav-open');
    });

});
