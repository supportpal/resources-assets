;
(function (global) {
  "use strict";

  /**
   * TicketAction instance.
   *
   * @param parameters
   * @constructor
   */
  function TicketAction(parameters) {
    //
  }

  /**
   * List of recent ticket IDs as a comma delimited string.
   *
   * @returns string
   */
  var recentTicketIds = $('meta[name="recent_tickets"]').prop('content').split(',');

  /**
   * Create a <ul> of tickets.
   *
   * @param tickets
   * @returns {*|jQuery}
   */
  var createList = function (tickets) {
    var ticketList = $('<ul />').addClass('sp-list-none sp-p-0 sp-m-0 sp-border sp-border-secondary sp-rounded sp-text-left sp-overflow-y-auto').css('max-height', '15rem');

    // Add each ticket to list.
    $.each(tickets, function (index, value) {
      var $li = $('<li />').addClass('sp-py-1 sp-px-3');
      if (index >= 1) {
        $li.addClass('sp-border-t sp-border-secondary');
      }
      $li.append($('<a />').text('#' + value.number + ' - ' + value.subject).prop('href', value.operator_url).prop('target', '_blank')).append('<br />').append($('<img />').prop('src', value.user.avatar_url).prop('class', 'sp-avatar sp-max-w-2xs')).append('&nbsp; ').append($('<span>').addClass('sp-description').text(value.user.formatted_name)).appendTo(ticketList);
    });
    return ticketList;
  };

  /**
   * Append <option> elements to a list (<select>).
   *
   * @param $list
   * @param tickets
   * @param selectedTicket
   */
  var appendTicketsToList = function ($list, tickets, selectedTicket) {
    $.each(tickets, function (index, ticket) {
      var $option = $('<option/>').val(ticket.id).text("#" + ticket.number).attr('data-data', JSON.stringify(ticket));

      // Pre select the oldest ticket.
      if (typeof selectedTicket !== 'undefined' && ticket.id === selectedTicket.id) {
        $option.attr('selected', 'selected');
      }
      $list.append($option);
    });
  };

  /**
   * Register a selectize instance on the given jQuery context.
   *
   * @param $context
   * @param tickets
   */
  var registerSelectize = function ($context, tickets) {
    var params = {
      valueField: 'id',
      labelField: 'number',
      // Selectize has internal filtering based on searchField which we don't want. So in order to get it to display
      // all the data returned from the server we're passing a 'searchField' property for each option which is the
      // term that we've searched for...
      searchField: ['searchField'],
      placeholder: Lang.get('core.sSearchPlaceholder'),
      create: false,
      render: {
        item: function (item, escape) {
          return '<div class="item">#' + escape(item.number) + " - " + escape(item.subject) + "</div>";
        },
        option: function (item, escape) {
          return '<div>' + '<strong>#' + escape(item.number) + "</strong>&nbsp; " + escape(item.subject) + '<br />' + '<span class="sp-description">' + escape(item.user.formatted_name) + ' &nbsp;&middot;&nbsp; ' + escape(item.department.name) + ' &nbsp;&middot;&nbsp; ' + escape(item.brand.name) + '</span>' + '</div>';
        }
      },
      load: function (query, callback) {
        this.clearOptions();

        // Switch back to recent tickets if term is empty
        var data = {
          term: query,
          exclude_ids: tickets
        };
        if (!query.length) {
          data = {
            include_ids: recentTicketIds,
            exclude_ids: tickets
          };
        }
        $.get(laroute.route('ticket.operator.action.search'), data).done(function (res) {
          callback(res.data.map(function (resource) {
            resource.searchField = query;
            return resource;
          }));
        }).fail(function () {
          callback();
        });
      }
    };
    $context.selectize(params);
  };

  /*
   * TicketAction static functions.
   */

  TicketAction.createListFromGrid = function (tickets) {
    var data = [];
    $.each(tickets, function (index, value) {
      var $tr = $('#ticketGridTable tr#' + value),
        ticket = {
          number: $tr.data('number'),
          subject: $tr.data('subject'),
          operator_url: $tr.data('view_url'),
          user: {
            avatar_url: $tr.data('user').avatar_url,
            formatted_name: $tr.data('user').formatted_name
          }
        };
      data.push(ticket);
    });
    return createList(data)[0].outerHTML;
  };

  /**
   * Merge given tickets into a new ticket.
   *
   * @param tickets
   * @returns {*}
   */
  TicketAction.merge = function (tickets) {
    /**
     * Filter out tickets which are not in the provided list.
     *
     * @param tickets
     * @param ids
     * @param excludeIds
     * @returns {*}
     */
    var whereIn = function (tickets, ids, excludeIds) {
      var results = [];
      $.each(ids, function (index, value) {
        if (typeof excludeIds !== 'undefined' && $.inArray(value, excludeIds) !== -1) {
          return;
        }
        var ticket = $.grep(tickets, function (obj) {
          return obj.id == value;
        });
        if (ticket.length) {
          results.push(ticket[0]);
        }
      });
      return results;
    };

    /**
     * Get the oldest ticket from the collection.
     *
     * @param tickets
     * @returns {number}
     */
    var getOldestTicket = function (tickets) {
      var oldest = null;
      $.each(tickets, function (index, ticket) {
        if (oldest === null || ticket.created_at < oldest.created_at) {
          oldest = ticket;
        }
      });
      return oldest;
    };

    /**
     * Generate the HTML used for the modal.
     *
     * @param ticketInfo
     * @returns {jQuery}
     */
    var makeInterface = function (ticketInfo) {
      var selectedTickets = whereIn(ticketInfo, tickets),
        $select = $('<select/>').attr('name', 'merge_into_id').attr('id', 'swal2-select');
      if (selectedTickets.length > 1) {
        appendTicketsToList($select, selectedTickets, getOldestTicket(selectedTickets));
      } else {
        var recentTickets = whereIn(ticketInfo, recentTicketIds, tickets);
        $select.append($('<option />'));
        appendTicketsToList($select, recentTickets);
      }
      return $('<div />').append(createList(selectedTickets)).append('<br />').append($('<form />').append($('<label />').text(Lang.get('ticket.merge_tickets_into'))).append($select)).html();
    };
    return Swal.fire({
      title: Lang.get('ticket.merge_tickets'),
      html: '',
      confirmButtonText: Lang.get('general.merge'),
      showCancelButton: false,
      didOpen: function () {
        Swal.showLoading();

        // Fetch details of the selected tickets and also recent tickets.
        return $.get(laroute.route('ticket.operator.action.search'), {
          include_ids: tickets.concat(recentTicketIds)
        }).then(function (response) {
          if (response.status === 'success') {
            Swal.hideLoading();
            Swal.update({
              html: makeInterface(response.data),
              showCancelButton: true
            });
            registerSelectize($(Swal.getHtmlContainer().querySelector('#swal2-select')), tickets);
          } else {
            throw new Error(response.statusText);
          }
        }).catch(function () {
          Swal.fire(Lang.get('messages.error'), Lang.get('messages.general_error'), 'error');
        });
      },
      showLoaderOnConfirm: true,
      preConfirm: function () {
        if (!$('#swal2-select').val()) {
          return false;
        }
        return $.ajax({
          url: laroute.route('ticket.operator.action.merge'),
          type: 'POST',
          data: {
            'ticket': tickets,
            'merge_into_id': $('#swal2-select').val()
          },
          dataType: 'json'
        }).then(function (response) {
          if (response.status == 'success') {
            return response;
          }
          throw new Error(response.statusText);
        }).catch(function () {
          Swal.showValidationMessage(Lang.get('messages.error_updated', {
            'item': Lang.choice('ticket.ticket', 1)
          }));
        });
      },
      allowOutsideClick: false
    });
  };

  /**
   * Link tickets together
   *
   * @param model
   * @returns {*}
   */
  TicketAction.link = function (model) {
    /**
     * Generate the HTML used for the modal.
     *
     * @param ticketInfo
     * @returns {jQuery}
     */
    var makeInterface = function (ticketInfo) {
      var $select = $('<select/>').attr('name', 'merge_into_id').attr('id', 'swal2-select').append($('<option />'));
      appendTicketsToList($select, ticketInfo);
      return $('<div />').append($select).html();
    };
    return Swal.fire({
      title: Lang.get('ticket.add_linked_ticket'),
      html: '',
      confirmButtonText: Lang.get('general.link'),
      showCancelButton: false,
      didOpen: function () {
        Swal.showLoading();

        // Don't include already linked tickets.
        var linkedTickets = $('ul.linked-tickets').find('a.unlink').map(function () {
            return $(this).data('id');
          }).get(),
          excludeIds = [model].concat(linkedTickets);

        // Fetch recent tickets.
        return $.get(laroute.route('ticket.operator.action.search'), {
          include_ids: recentTicketIds,
          exclude_ids: excludeIds
        }).then(function (response) {
          if (response.status === 'success') {
            Swal.hideLoading();
            Swal.update({
              html: makeInterface(response.data),
              showCancelButton: true
            });
            registerSelectize($(Swal.getHtmlContainer().querySelector('#swal2-select')), [model]);
          } else {
            throw new Error(response.statusText);
          }
        }).catch(function () {
          Swal.fire(Lang.get('messages.error'), Lang.get('messages.general_error'), 'error');
        });
      },
      showLoaderOnConfirm: true,
      preConfirm: function () {
        if (!$('#swal2-select').val()) {
          return false;
        }
        return $.ajax({
          url: laroute.route('ticket.operator.action.link'),
          type: 'POST',
          data: {
            'ticket': ticket.parameters().ticketId + ',' + $('#swal2-select').val()
          },
          dataType: 'json'
        }).then(function (response) {
          if (response.status == 'success') {
            return response;
          }
          throw new Error(response.statusText);
        }).catch(function () {
          Swal.showValidationMessage(Lang.get('messages.error_updated', {
            'item': Lang.choice('ticket.ticket', 1)
          }));
        });
      },
      allowOutsideClick: function () {
        return !Swal.isLoading();
      }
    });
  };

  // Register namespace.
  global.TicketAction = TicketAction;
})(this);