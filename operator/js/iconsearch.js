/**
 * Icon Search Selectize
 *
 * Initializes a selectize dropdown for Font Awesome icon selection.
 *
 * @param {string|jQuery} selector - CSS selector or jQuery object for the select element
 * @param {Object} options - Configuration options
 * @param {string} [options.size='fa-3x'] - ID of the element used for icon validation
 */
function initIconSearch(selector, options) {
  options = options || {};
  var sizeClass = options.size || 'fa-1x';
  $(selector).selectize({
    labelField: 'label',
    searchField: 'label',
    render: {
      item: function (item, escape) {
        if (escape(item.value) === 'none') {
          return '<div>' + escape(item.label) + '</div>';
        }
        return '<div><i class="fa-solid ' + escape(item.value) + '"></i>&nbsp; ' + escape(item.label) + '</div>';
      },
      option: function (item, escape) {
        return '<div><i class="fa-solid ' + sizeClass + ' ' + escape(item.value) + ' sp:align-middle"></i>&nbsp; ' + escape(item.label) + '</div>';
      }
    },
    load: function (query, callback) {
      if (!query.length) {
        return callback();
      }
      const params = new URLSearchParams();
      params.append("query", 'query { search ( version: "7.x", query: "' + query + '") { id, familyStylesByLicense { free { family, style }}, label } }');
      fetch(`https://api.fontawesome.com?${params}`).then(response => response.json()).then(data => callback(data.data.search.map(function (icon) {
        if (icon.familyStylesByLicense.free.some(item => item.family === "classic" && item.style === "solid")) {
          return {
            value: 'fa-' + icon.id,
            label: icon.label
          };
        }
        return false;
      }))).catch(() => callback());
    },
    onChange: function (value) {
      var $select = $(selector);
      var selectName = $select.attr('name');
      var labelInputName = selectName.includes('[') ? selectName.replace(/\[([^\]]+)]$/, '[$1_label]') : selectName + '_label';

      // Get or create hidden input for icon_label
      var $labelInput = $select.siblings('input[name="' + labelInputName + '"]');
      if ($labelInput.length === 0) {
        $labelInput = $('<input type="hidden" name="' + labelInputName + '">');
        $select.parent().append($labelInput);
      }

      // Update the label value
      if (value) {
        var item = this.options[value];
        if (item) {
          $labelInput.val(item.label);
        } else {
          $labelInput.val('');
        }
      } else {
        $labelInput.val('');
      }
    }
  });
}