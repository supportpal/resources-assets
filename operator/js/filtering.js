function Filtering() {}
;

/**
 * Condition items that support the "is one of" / "is not one of" (IN / NOT IN) operators.
 * Ticket: Assigned operator, channel, brand, department, priority, status and tag.
 * User: brand, group.
 * Organisation: brand.
 *
 * @type {number[]}
 */
Filtering.multiValueItems = [0, 4, 5, 7, 11, 13, 18, 20, 25, 76];

/**
 * Show or hide the "is one of" / "is not one of" operator options based on whether the
 * selected condition item supports multiple values.
 *
 * @param $row The condition <tr>
 * @param item The selected condition item ID
 */
Filtering.toggleMultiOperators = function ($row, item) {
  var $operatorSelect = $($row).find('.condition-operator select.operator0'),
    capable = $.inArray(item, Filtering.multiValueItems) !== -1,
    selected = $operatorSelect.val();
  $operatorSelect.find('option[value=13], option[value=14]').prop('disabled', !capable).toggleClass('sp:hidden', !capable);
  if (!capable && $.inArray(selected, ['13', '14']) !== -1) {
    $operatorSelect.val('0');
  }
};

/**
 * Swap the value input between the single value select and a multi-select (selectize) input
 * for "is one of" / "is not one of" conditions. The multi-select input holds a comma
 * separated string of values.
 *
 * @param row   The condition <tr>
 * @param value Optional comma separated string of values to preselect
 */
Filtering.toggleMultiSelect = function (row, value) {
  var $row = $(row),
    item = parseInt($row.find('.condition-item select').val()),
    $operatorSelect = $row.find('.condition-operator select.operator0'),
    $select = $row.find('.condition-value select[data-item="' + item + '"][name*="[value]"]'),
    $input = $row.find('.condition-value .multi-value-input'),
    multi = $.inArray(item, Filtering.multiValueItems) !== -1 && !$operatorSelect.is(':disabled') && $.inArray($operatorSelect.val(), ['13', '14']) !== -1;
  if ($input.length) {
    // Keep the current selections when toggling between "is one of" and "is not one of".
    if (typeof value === 'undefined' && parseInt($input.attr('data-item')) === item) {
      value = $input.val();
    }
    if ($input[0].selectize) {
      $input[0].selectize.destroy();
    }
    $input.remove();

    // Restore the single value select.
    $select.prop('disabled', false).removeClass('sp:hidden');
  }
  if (!multi) {
    return;
  }
  if (typeof value === 'undefined') {
    value = $select.val() || '';
  }

  // Build the multi-select from the single value select options and submit in its place.
  var options = $select.find('option').map(function () {
    return {
      value: this.value,
      text: this.text
    };
  }).get();
  $input = $('<input>', {
    'type': 'text',
    'class': 'multi-value-input',
    'name': $select.attr('name'),
    'data-item': item,
    'value': value
  });
  $select.prop('disabled', true).addClass('sp:hidden').after($input);
  $input.selectize({
    options: options,
    delimiter: ',',
    maxItems: null,
    plugins: ['remove_button'],
    valueField: 'value',
    labelField: 'text',
    searchField: 'text'
  });
};

/**
 * Fetch a unique group ID.
 *
 * @returns {number}
 */
Filtering.getUniqueGroupId = function () {
  var re = /^\w+\[(\d+)?]\[\w+]?$/;
  var m,
    index = 0;
  // loop over all group IDs (selecting elements by those starting with "conditiongroups" and ending with "[id]"
  $('.sp-condition-group input[name ^=conditiongroups][name $="[id]"]').each(function () {
    if ((m = re.exec($(this).attr('name'))) !== null) {
      if (typeof m[1] != 'undefined') {
        if ((m = parseInt(m[1])) >= index) {
          index = m + 1;
        }
      }
    }
  });
  return index;
};

/**
 * Remove any condition items that have an empty value dropdown.
 *
 * @param context
 */
Filtering.removeEmpty = function (context) {
  $(context).find('.condition-value select').each(function () {
    if (!$(this).find('option').length) {
      $(context).find('.condition-item select').find('option[value="' + $(this).data('item') + '"]').remove();
    }
  });
};

/**
 * Show a given condition.
 *
 * @param context
 */
Filtering.showCondition = function (context) {
  var item = parseInt($(context).val()),
    $selectedOption = $(context).find(':selected');
  $(context).parents('tr').find('.condition-value :input').prop('disabled', true).addClass('sp:hidden');
  $(context).parents('tr').find('.condition-value :input[data-item="' + item + '"]').prop('disabled', false).removeClass('sp:hidden');
  $(context).parents('tr').find('.condition-value .sp-description').addClass('sp:hidden');
  $(context).parents('tr').find('.condition-value .sp-description[data-item="' + item + '"]').removeClass('sp:hidden');
  $(context).parents('tr').find('.condition-operator select').prop('disabled', true).addClass('sp:hidden');
  var operator = $(context).parents('tr').find('.condition-value :input[data-item="' + item + '"]').data('operator');
  $(context).parents('tr').find('.condition-operator select.operator' + operator).prop('disabled', false).removeClass('sp:hidden');

  // Remove any items that have an empty dropdown
  Filtering.removeEmpty($(context).parents('tr'));

  // Special case: If a date picker, initialise flatpickr
  if (operator === 2 || operator === 7) {
    $(context).parents('tr').find('.datepicker').datepicker();
  }

  // Special case: If a phone input, initialise intl-tel-input
  if (item === 71) {
    $(context).parents('tr').find('.sp-phone-number').phoneinput();
  }

  // Special case: need to enable the custom field ID value for custom fields (hide and disable it otherwise)
  var ids = [44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58];
  $(context).parents('tr').find('.condition-value select[name*="[value]"]').filter(function () {
    return ids.indexOf($(this).data('item')) > -1;
  }).prop('disabled', true).addClass('sp:hidden');
  if ($.inArray(item, ids) !== -1) {
    $(context).parents('tr').find('.condition-value select[data-item=' + item + '][name*="[value]"]').prop('disabled', false).val($selectedOption.data('field'));
  }

  // Special case: only show options relevant to the selected custom field.
  if (item == 45 || item == 47 || item == 50 || item == 52 || item == 55 || item == 57) {
    var $conditionValue = $(context).parents('tr').find('.condition-value select[data-item=' + item + '][name*="[value_extra]"]');
    $conditionValue.find('option').each(function () {
      if ($(this).is('[data-field="' + $selectedOption.data('field') + '"]')) {
        $(this).prop('disabled', false).removeClass('sp:hidden');
      } else {
        $(this).prop('disabled', true).addClass('sp:hidden');
      }
    });

    // Select the first option if currently selected value is not valid.
    if ($conditionValue.find('option:selected').is(':disabled')) {
      $conditionValue.find('option:selected').prop('selected', false);
      $conditionValue.find('option:not(:disabled):first').prop('selected', true);
    }
  }

  // Only offer "is one of" / "is not one of" for items that support multiple values.
  Filtering.toggleMultiOperators($(context).parents('tr'), item);

  // Swap the value input to a multi-select if needed. On first render use the raw condition
  // value (a comma separated string doesn't match any single option in the select).
  var multiValue = $(context).attr('data-value');
  $(context).removeAttr('data-value').removeData('value');
  Filtering.toggleMultiSelect($(context).parents('tr'), multiValue === '' ? undefined : multiValue);
};

/**
 * Initialise the filtering menus.
 */
Filtering.initialise = function () {
  // Add custom fields to every condition-item drop-down (the hidden <tr> used for new conditions and any other
  // <tr> for current conditions).
  // Important: We need to do this before we delete empty dropdowns.
  var ids = [44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58],
    $ticketCustomFields = $('.condition .condition-item select').find('option[value=44]'),
    $userCustomFields = $('.condition .condition-item select').find('option[value=49]'),
    $organisationCustomFields = $('.condition .condition-item select').find('option[value=54]');

  // Only get custom fields from the first condition, otherwise we get several duplicates...
  var customFields = $('.condition:first .condition-value select[name*="[value]"]').filter(function () {
    return ids.indexOf($(this).data('item')) > -1;
  }).find('option').map(function () {
    return {
      item: $(this).parents('select').data('item'),
      option: this
    };
  }).get().sort(function (a, b) {
    // Sort alphabetically, and then flip it because we insert backwards...
    return a.option.text.toUpperCase().localeCompare(b.option.text.toUpperCase());
  }).reverse();

  // Insert the custom field conditions.
  $(customFields).each(function (index, value) {
    var condition = parseInt(value.item);

    // Target the right section
    if (condition <= 48) {
      var $text = Lang.get('conditions.ticket_custom_field'),
        $section = $ticketCustomFields;
    } else if (condition >= 49 && condition <= 53) {
      var $text = Lang.get('conditions.user_custom_field'),
        $section = $userCustomFields;
    } else {
      var $text = Lang.get('conditions.user_organisation_custom_field'),
        $section = $organisationCustomFields;
    }
    var $option = $('<option>', {
      value: condition,
      text: $text + ': ' + value.option.text,
      "data-field": value.option.value
    });
    $section.after($option);
  });
  $ticketCustomFields.remove();
  $userCustomFields.remove();
  $organisationCustomFields.remove();

  // Remove any items that have an empty dropdown
  Filtering.removeEmpty('.condition:first');

  // Ensure right operator and value is showing for each condition.
  $('.condition-item select').each(function () {
    // Set selected item for existing conditions.
    var data = $(this).data();
    if (typeof data.selected !== 'undefined' && data.field !== '') {
      $(this).find('option[value="' + data.selected + '"][data-field="' + data.field + '"]').prop('selected', true);
    }

    // Show relevant condition fields.
    Filtering.showCondition(this);
  });

  // Disable items in first (hidden) row
  $(".sp-condition-group:first:not(:visible) :input, .condition:first :input").prop('disabled', true);
  $(".sp-condition-group").find(".condition:first :input").prop('disabled', true);
  $('.sp-condition-group .add-condition, .sp-condition-group-buttons button').prop('disabled', false);

  // If we have default conditions, show them.
  if ($('.condition:not(.hide)').length) {
    $('.sp-condition-group table').removeClass('sp:hidden');
  }

  // If we more than one condition group, show the plan conditiongroup type dropdown
  if ($('.sp-condition-group:visible').length > 1) {
    $('.plan-conditiongroup-type').removeClass('sp:hidden');
  } else {
    $('.plan-conditiongroup-type').addClass('sp:hidden');
  }

  // Show the condition group type dropdown if conditiongroup has 2 or more conditions
  // Show the remove button always if using in grid filtering or in reports
  $('.sp-condition-group').each(function () {
    if ($(this).find('.condition:visible').length > 1 || $(this).parents('.grid-options').length || $(this).hasClass('sp-report-filtering')) {
      $(this).find('.sp-condition-group-type, .condition .remove-button').removeClass('sp:hidden');
    } else {
      $(this).find('.sp-condition-group-type, .condition .remove-button').addClass('sp:hidden');
    }
  });
};
$(function () {
  // Toggle filtering
  $('.sp-quick-actions').on('mousedown', 'button.sp-filter-results', function () {
    // If we're toggling to show and it's currently empty, insert new condition group
    if ($('.sp-condition-group').parent().toggle().is(':visible') && !$('.sp-condition-group:not(.sp\\:hidden)').length) {
      $('.add-conditiongroup').trigger('click');
    }
  });
  Filtering.initialise();

  /**
   * When selecting a condition, show the appropriate operator and value fields.
   */
  $(document.body).on('change', '.condition-item select', function () {
    Filtering.showCondition(this);
  });

  /**
   * When selecting an operator, swap the value input between the single and multi-select
   * inputs as necessary.
   */
  $(document.body).on('change', '.condition-operator select', function () {
    Filtering.toggleMultiSelect($(this).parents('tr'));
  });

  /**
   * Add Condition Group.
   */
  $(document.body).on('click', '.add-conditiongroup', function () {
    // Get unique index for this new group (before we insert the new DOM)
    var index = Filtering.getUniqueGroupId();

    // Insert new group into the DOM
    addNewItem('.sp-condition-group', undefined, undefined, function (attr, idx) {
      if (/^conditiongroups\[]/g.test(attr)) {
        return attr.replace(/\[]/, '[' + index + ']');
      }
    });

    // This needs to be here, after we've added the item above.
    var $this = $('.sp-condition-group:last');

    // Disable the first condition row (template row).
    $this.find('.condition:first :input').prop('disabled', true);

    // Add a condition by default
    $this.find('.add-condition').trigger('click');

    // Disable unnecessary condition operator and values
    $this.find('.condition-operator, .condition-value').find(':input:not(:visible)').prop('disabled', true);

    // Hide the delete button for now as there's only one condition
    $this.find('.sp-condition-group-type, .condition .remove-button').addClass('sp:hidden');

    // Set condition group ID on condition
    $this.find('input[name^=conditiongroups][name$="[local_id]"], .conditiongroup-id, .condition-group-id').val(index);

    // If we more than one conditiongroup now, show the plan conditiongroup type dropdown
    if ($('.sp-condition-group:visible').length > 1) {
      $('.plan-conditiongroup-type').removeClass('sp:hidden');
    } else {
      $('.plan-conditiongroup-type').addClass('sp:hidden');
    }
  });

  /**
   * Remove Condition Group.
   */
  $(document.body).on('click', '.sp-condition-group-header .remove-button', function () {
    // Hide the plan conditiongroup type dropdown if just one conditiongroup now
    $(this).parents('.sp-condition-group').remove();
    if ($('.sp-condition-group:visible').length > 1) {
      $('.plan-conditiongroup-type').removeClass('sp:hidden');
    } else {
      $('.plan-conditiongroup-type').addClass('sp:hidden');
    }
  });

  /**
   * Add filtering condition
   */
  $(document.body).on('click', '.add-condition', function () {
    const $this = $(this).parents('.sp-condition-group');
    addNewItem($this.find('.condition:first'), $this.find('table'), $this.find(':input[name*="[conditions]"][name$="[id]"]'), function (attr, index) {
      if (/^conditiongroups\[\d+]\[conditions\]\[]\[\w+]$/g.test(attr)) {
        return attr.replace(/\[]/, '[' + index + ']');
      }
    });

    // Set condition group ID on condition
    var index = $this.find('input[name$="[local_id]"').val();
    $this.find('.condition-group-id').val(index);

    // Show table
    $this.find('table').removeClass('sp:hidden');

    // Disable and hide fields that are not needed now
    $this.find('.condition:last .condition-value :input, .condition:last .condition-operator :input').prop('disabled', true).addClass('sp:hidden');

    // Show the right condition options and values
    var selected = $this.find('.condition:last .condition-item select').val();
    $this.find('.condition:last .condition-value :input[data-item="' + selected + '"]').prop('disabled', false).removeClass('sp:hidden');
    var operator = $this.find('.condition:last .condition-value :input[data-item="' + selected + '"]').data('operator');
    $this.find('.condition:last .condition-operator select.operator' + operator).prop('disabled', false).removeClass('sp:hidden');
    if (operator === 2) {
      $this.find('.condition:last').find('.datepicker').datepicker();
    }

    // Only offer "is one of" / "is not one of" for items that support multiple values.
    Filtering.toggleMultiOperators($this.find('.condition:last'), parseInt(selected));

    // Show the conditiongroup type dropdown and condition remove button if conditiongroup now has 2 or more conditions
    // Show the remove button always if using in grid filtering or in reports
    if ($this.find('.condition:visible').length > 1 || $this.parents('.grid-options').length || $(this).parents('.sp-report-filtering').length) {
      $this.find('.sp-condition-group-type, .condition .remove-button').removeClass('sp:hidden');
    } else {
      $this.find('.sp-condition-group-type, .condition .remove-button').addClass('sp:hidden');
    }
  });

  /**
   * Remove filtering condition
   */
  $(document.body).on('click', '.condition .remove-button', function () {
    var $group = $(this).parents('.sp-condition-group');

    // Hide the conditiongroup type dropdown if conditiongroup has at least 3 conditions before deleting this one
    // Show the remove button always if using in grid filtering or in reports
    if ($group.find('.condition:visible').length > 2 || $(this).parents('.grid-options').length || $(this).parents('.sp-report-filtering').length) {
      $group.find('.sp-condition-group-type, .condition .remove-button').removeClass('sp:hidden');
    } else {
      $group.find('.sp-condition-group-type, .condition .remove-button').addClass('sp:hidden');
    }

    // Remove the condition row
    $(this).parents('.condition').remove();

    // Hide table if no conditions left
    if ($group.find('.condition:visible').length === 0) {
      $group.find('table').addClass('sp:hidden');
    }
  });
});