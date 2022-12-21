$(function () {

    // Reference to the current open modal.
    // We use this to close any modals that are already open (only one modal open at a time).
    var $currentModal;

    // Open Modal when clicking input box.
    $(document).on('click', '.sp-input-translatable input.default, .sp-input-translatable-container i.fa-language', function (e) {
        open($(this).parent().siblings('.sp-translatable-modal'));

        // Prevent propagation - this prevents clashes with global click event to close the modal.
        e.stopPropagation();
    });

    // Close Modal.
    $(document).on('click', '.sp-translatable-modal .sp-modal-close', function (e) {
        close($(this).parent().parents('.sp-translatable-modal'));
    });

    // Close Modal when tabbing on last item in it (and moving out of modal).
    $(document).on('keydown', '.sp-translatable-modal', function (e) {
        // jQuery normalises the .which property so be used to reliably fetch the pressed key code across browsers.
        // https://api.jquery.com/keydown/
        if (e.which === 9) {
            // Get srcElement if target is false (IE, Safari2).
            var target = e.target || e.srcElement;
            if (!target) {
                return;
            }

            // Is it the selectize or last translation option if selectize is not there
            if ($(target).parent('.selectize-input').length
                || ($(this).find('select[name="sp-translation-add"]').length && $(target).parents('.sp-translation').is(':last-child'))
            ) {
                // If so, we've tabbed outside, close it.
                close($(this));
            }
        }
    });

    // Delete a translation.
    $(document).on('click', '.sp-remove-translation', function (e) {
        var $modal = $(this).parents('.sp-translatable-modal'),
            $translation = $(this).parents('div.sp-translation');

        // Hide translation.
        if ($translation.parent().hasClass('existing-translations')) {
            // Delete existing translation.
            var $clonedTranslation = $translation.clone();
            $translation.remove();

            // Move to missing, disable inputs and hide it.
            $modal.find('.missing-translations').append($clonedTranslation);
            $clonedTranslation.find(':input').val('').prop('disabled', 'disabled');
            $clonedTranslation.hide();
        } else {
            // Disable inputs and hide it.
            $translation.find(':input').prop('disabled', 'disabled');
            $translation.hide();
        }

        // If there's no translation's left, show "No existing translations".
        if ($modal.find('.existing-translations .sp-translation').length === 0
            && $modal.find('.missing-translations .sp-translation:visible').length === 0
        ) {
            $modal.find('.sp-no-translations').show();
        }

        // Build option and add it to the dropdown.
        var selectize = $modal.find('select[name="sp-translation-add"]')[0].selectize;
        selectize.addOption({
            value: $translation.data('locale'),
            text: $translation.data('display-name')
        });

        selectize.refreshOptions(false);

        // Ensure selectize is showing.
        $modal.find('select[name="sp-translation-add"]').parent().show();
    });

    // If the user clicks outside of the modal, close it.
    $(window).on('click', function () {
        var $visibleModal = $('.sp-translatable-modal:visible');

        // Hide modal if visible.
        if ($visibleModal.length !== 0) {
            close($visibleModal);
        }
    });

    // Do not move - it is important that this is at the bottom of the propagation chain.
    $(document).on('click', '.sp-translatable-modal', function (e) {
        e.stopPropagation();
    });

    /**
     * Open given modal.
     *
     * @param {jQuery} $modal
     */
    function open($modal)
    {
        // If there's another modal open, close it.
        if ($($currentModal).length === 1 && $currentModal.get(0) !== $modal.get(0)) {
            $currentModal.hide();
        }

        // Initialise selectize.
        registerSelectize($modal.find('select[name="sp-translation-add"]'));

        // Show modal.
        $modal.show();
        $currentModal = $modal;
    }

    /**
     * Close the given modal.
     *
     * @param {jQuery} $modal
     */
    function close($modal)
    {
        $modal.hide();
        $currentModal = null;
    }

    /**
     * Register selectize.
     *
     * @param $selector
     * @returns {*}
     */
    function registerSelectize($selector)
    {
        return $selector.selectize({
            // Invoked when an item is selected.
            //      Insert a new translation.
            onItemAdd: function (value, $option) {
                var $modal = this.$dropdown.parents('.sp-translatable-modal');

                // Find template in missing list.
                var $translation = $modal.find('.missing-translations .sp-translation[data-locale="' + value + '"]');
                $translation.find(':input').prop('disabled', false);
                $translation.show();

                // Hide "No Existing Translations" if it's currently visible.
                if ($modal.find('.sp-no-translations').is(':visible')) {
                    $modal.find('.sp-no-translations').hide();
                    $modal.find('div.sp-translations').show();
                }

                // Remove option from the menu.
                this.clear(true); // Clear selected option, otherwise selectize gets confused when we delete it..
                this.removeOption(value);

                // If no more options, hide the selectize box.
                if ($.isEmptyObject(this.options)) {
                    $modal.find('select[name="sp-translation-add"]').parent().hide();
                }

                // Focus the input box.
                $translation.find('input:first').trigger('focus');
            }
        });
    }

});
