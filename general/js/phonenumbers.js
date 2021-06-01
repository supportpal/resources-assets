$(document).ready(function () {
    /**
     * Class name for addNewItem() function.
     *
     * @type {string}
     */
    var className = '.sp-phone-number';

    /**
     * Disable the hidden input.
     */
    $(className + ":first :input").prop('disabled', true);

    /**
     * Initialise phone number inputs.
     */
    $('.sp-phone-number input[type="tel"]:not([disabled])').phoneinput();

    /**
     * Add a new option to the form
     */
    $('.sp-add-number').on('click', function () {
        addNewItem(className);

        $('.sp-phone-number:last input[type="tel"]').phoneinput();
    });

    /**
     * Remove an option from the DOM
     */
    $(document.body).on('click', '.sp-remove-number', function () {
        $(this).parents(className).remove();
    });
});