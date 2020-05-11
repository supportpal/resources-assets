$(document).ready(function () {
    customfieldRedactor();

    // Open links in locked custom fields in new tab.
    $('.redactor-read-only a').on('click', function () {
        this.target = "_blank";
    });

    // Dependent custom fields.
    var resetForm = function ($container, disabled) {
        // Disable redactor.
        $container.find('textarea').prop('contenteditable', disabled);
        $container.find(':input').not(':button, :submit, :reset').prop('disabled', disabled);
    };
    var showDependentFields = function ($field) {
        var selected = $field.val();
        if (selected.length) {
            // Show the field that depends on the selected option.
            var $element = $('[data-depends-on-option="' + selected + '"]');
            $element.removeClass('sp-hidden');
            resetForm($element, $element.data('locked') === 1);

            // Check whether the field has a value selected, if so we can want to show any dependent fields.
            var $select = $element.find('select:not([multiple])');
            if ($select.length > 0 && $select.find(':selected').length > 0) {
                showDependentFields($select);
            }
        }
    };
    $(document).on('change', '.sp-form-customfields select:not([multiple])', function () {
        // Hide all dependent fields.
        var children = $(this).parents('.sp-form-customfields').data('dependent-children');
        if (children && children.length > 0) {
            $.each(children, function (index, value) {
                var $element = $('[data-field="' + value + '"]');
                $element.addClass('sp-hidden');
                resetForm($element, true);
            });
        }

        // We don't want this to run if they select the placeholder <option value=''>Please select...</option>
        // otherwise all non-dependent fields disappear.
        showDependentFields($(this));
    });
});

function customfieldRedactor()
{
    $.each($('.sp-form-customfields textarea'), function () {
        // Don't show link tootlip if redactor is disabled/readonly
        var linkTooltip = $(this).prop('disabled') || $(this).prop('readonly') ? false : true;

        $(this).redactor({
            // Height settings.
            minHeight: false,

            // Paste settings.
            pasteImages: false,
            pasteBlockTags: ['p'],
            pasteInlineTags: ['a', 'br'],

            // Toolbar settings.
            toolbar: false,
            toolbarContext: linkTooltip,

            // Shortcut settings.
            shortcuts: false,
        });

        // Handle locked textareas
        if ($(this).prop('disabled') || $(this).prop('readonly')) {
            $(this).redactor('enableReadOnly');
        }
    });
}
