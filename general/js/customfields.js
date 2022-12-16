$(document).ready(function () {
  customfieldEditor();

  // Dependent custom fields.
  var resetForm = function ($container, disabled) {
    // Disable inputs.
    $container.find('textarea').prop('disabled', disabled);
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
function customfieldEditor() {
  $.each($('.sp-form-customfields textarea'), function () {
    if ($(this).editor()) {
      // Destroy previous instance if it exists.
      $(this).editor().destroy();
    }
    $(this).editor({
      // Locked fields.
      readonly: $(this).prop('disabled') || $(this).prop('readonly') ? true : false,
      // Paste settings.
      valid_elements: 'a[href|target=_blank],br,p',
      // Toolbar settings.
      toolbar: false,
      // https://www.tiny.cloud/docs/plugins/opensource/autoresize/#min_height
      min_height: 50,
      // Statusbar settings.
      statusbar: false,
      // Disable keyboard shortcuts.
      plugins: $.fn.editor.defaults.plugins.concat(['disable_shortcuts'])
    });
  });
}