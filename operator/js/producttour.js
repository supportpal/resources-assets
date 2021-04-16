if (! App.userAgent.isIe()) {
    (function ($, window, document, undefined) {
        /**
         * Product tour.
         *
         * @constructor
         */
        function Tour() {
            /**
             * This instance.
             *
             * @type {Tour}
             */
            var instance = this;

            /**
             * Shepherd tour instance.
             *
             * @type {Shepherd.Tour}
             */
            var shepherd = null;

            /**
             * Key used to access and store items in localStorage.
             *
             * @type {string}
             */
            var key = 'supportpalProductTour';

            /**
             * Default Shepherd tour parameters.
             *
             * @type {Object}
             */
            var defaults = {
                defaultStepOptions: {
                    scrollTo: {
                        behavior: 'smooth'
                    },
                    buttons: [
                        {
                            text: Lang.get('general.next'),
                            action: function () {
                                return this.next();
                            }
                        }
                    ],
                    cancelIcon: {
                        enabled: true
                    }
                }
            };

            /**
             * Tour steps.
             *
             * @type {Array}
             */
            var steps = [
                {
                    id: 'step-1',
                    title: Lang.get('core.dashboard'),
                    text: Lang.get('core.dashboard_desc')
                },
                {
                    id: 'step-2',
                    title: Lang.get('core.private_messages'),
                    text: Lang.get('core.messages_desc'),
                    attachTo: {
                        element: '#privateMessages',
                        on: 'bottom'
                    }
                },
                {
                    id: 'step-3',
                    title: Lang.get('core.configure'),
                    text: Lang.get('core.configure_desc'),
                    attachTo: {
                        element: '#settingsNavigation',
                        on: 'bottom'
                    },
                    buttons: [
                        {
                            text: Lang.get('general.next'),
                            action: function () {
                                instance.setStep(this.getCurrentStep().id);

                                window.location = laroute.route('core.operator.setting');
                            }
                        }
                    ]
                },
                {
                    id: 'step-4',
                    title: Lang.choice('core.brand', 2),
                    text: Lang.get('core.brand_desc'),
                    attachTo: {
                        element: '#brandSettings',
                        on: 'right'
                    },
                    when: {
                        show: function () {
                            Cookies.remove('generalSettingsBox');

                            if ($('#generalSettingsBox').hasClass('sp-closed')) {
                                $('#generalSettingsBox').trigger('click');
                            }
                        }
                    },
                    buttons: [
                        {
                            text: Lang.get('general.next'),
                            action: function () {
                                instance.setStep(this.getCurrentStep().id);

                                window.location = laroute.route('core.operator.brand.edit', {brand: 1});
                            }
                        }
                    ]
                },
                {
                    id: 'step-5',
                    title: Lang.get('core.brand_name'),
                    text: Lang.get('core.brand_name_desc'),
                    attachTo: {
                        element: '#name',
                        on: 'right'
                    },
                    buttons: [
                        {
                            text: Lang.get('general.next'),
                            action: function () {
                                $('#Email').trigger('click');

                                return this.next();
                            }
                        }
                    ]
                },
                {
                    id: 'step-6',
                    title: Lang.get('core.default_email'),
                    text: Lang.get('core.default_email_desc'),
                    attachTo: {
                        element: '#default_email',
                        on: 'bottom'
                    },
                    when: {
                        show: function () {
                            Cookies.remove('ticketSettingsBox');

                            if (!$('#generalSettingsBox').hasClass('sp-closed')) {
                                $('#generalSettingsBox').trigger('click');
                            }
                            if ($('#ticketSettingsBox').hasClass('sp-closed')) {
                                $('#ticketSettingsBox').trigger('click');
                            }
                        }
                    }
                },
                {
                    id: 'step-7',
                    title: Lang.choice('ticket.department', 2),
                    text: Lang.get('core.department_desc'),
                    attachTo: {
                        element: '#ticketDeptSetting',
                        on: 'right'
                    },
                    buttons: [
                        {
                            text: Lang.get('general.next'),
                            action: function () {
                                instance.setStep(this.getCurrentStep().id);

                                window.location = laroute.route('ticket.operator.department.edit', {department: 0});
                            }
                        }
                    ]
                },
                {
                    id: 'step-8',
                    title: Lang.choice('ticket.department', 2),
                    text: Lang.get('core.dept_settings_desc'),
                    attachTo: {
                        element: '#departmentSettings',
                        on: 'top'
                    }
                },
                {
                    id: 'step-9',
                    title: Lang.get('core.department_email'),
                    text: Lang.get('core.dept_email_desc'),
                    attachTo: {
                        element: '#emailAccounts',
                        on: 'top'
                    }
                },
                {
                    id: 'step-10',
                    title: Lang.get('core.dept_tmpl'),
                    text: Lang.get('core.dept_tmpl_desc'),
                    attachTo: {
                        element: '#department-templates',
                        on: 'bottom'
                    }
                },
                {
                    id: 'step-11',
                    title: Lang.choice('core.scheduled_task', 2),
                    text: Lang.get('core.schedule_task_desc'),
                    attachTo: {
                        element: '#scheduledTaskSetting',
                        on: 'right'
                    },
                    when: {
                        show: function () {
                            if ($('#generalSettingsBox').hasClass('sp-closed')) {
                                $('#generalSettingsBox').trigger('click');
                            }
                            if (!$('#ticketSettingsBox').hasClass('sp-closed')) {
                                $('#ticketSettingsBox').trigger('click');
                            }
                        }
                    },
                    buttons: [
                        {
                            text: Lang.get('general.next'),
                            action: function () {
                                instance.setStep(this.getCurrentStep().id);

                                window.location = laroute.route('core.operator.scheduledtask.index');
                            }
                        }
                    ]
                },
                {
                    id: 'step-12',
                    title: Lang.choice('core.scheduled_task', 2),
                    text: Lang.get('core.schedule_task_2'),
                    attachTo: {
                        element: '#scheduledTaskTable',
                        on: 'top'
                    }
                },
                {
                    id: 'step-13',
                    title: Lang.get('core.schedule_task_cron'),
                    text: Lang.get('core.schedule_task_3'),
                    attachTo: {
                        element: '#scheduledTaskCron',
                        on: 'top'
                    }
                },
                {
                    id: 'step-14',
                    title: Lang.choice('ticket.channel', 2),
                    text: Lang.get('core.ticket_channel_desc'),
                    attachTo: {
                        element: '#channelSettings',
                        on: 'right'
                    },
                    when: {
                        show: function () {
                            if (!$('#generalSettingsBox').hasClass('sp-closed')) {
                                $('#generalSettingsBox').trigger('click');
                            }
                            if ($('#ticketSettingsBox').hasClass('sp-closed')) {
                                $('#ticketSettingsBox').trigger('click');
                            }
                        }
                    },
                    buttons: [
                        {
                            text: Lang.get('general.next'),
                            action: function () {
                                instance.setStep(this.getCurrentStep().id);

                                window.location = laroute.route('ticket.operator.channel.index');
                            }
                        }
                    ]
                },
                {
                    id: 'step-15',
                    title: Lang.choice('ticket.channel', 2),
                    text: Lang.get('core.ticket_channel_2'),
                    attachTo: {
                        element: '#ticketChannelTable',
                        on: 'top'
                    },
                    buttons: [
                        {
                            text: Lang.get('general.next'),
                            action: function () {
                                instance.setStep(this.getCurrentStep().id);

                                window.location = laroute.route('ticket.channel.web.settings');
                            }
                        }
                    ]
                },
                {
                    id: 'step-16',
                    title: Lang.get('ticket.web_settings'),
                    text: Lang.get('core.web_settings_desc'),
                    attachTo: {
                        element: '#unauthenticated_users_label',
                        on: 'bottom'
                    }
                },
                {
                    id: 'step-17',
                    title: Lang.choice('user.user', 2),
                    text: Lang.get('core.user_desc'),
                    attachTo: {
                        element: '#manageUserSetting',
                        on: 'right'
                    },
                    when: {
                        show: function () {
                            // Show the Users drop down in the header
                            $('#userHeaderDropdown > a').addClass('sp-hover');
                        }
                    }
                },
                {
                    id: 'step-18',
                    title: Lang.choice('user.organisation', 2),
                    text: Lang.get('core.organisation_desc'),
                    attachTo: {
                        element: '#manageOrgSetting',
                        on: 'right'
                    }
                },
                {
                    id: 'step-19',
                    title: Lang.choice('general.operator', 2),
                    text: Lang.get('core.operator_desc'),
                    attachTo: {
                        element: '#manageOperatorSetting',
                        on: 'right'
                    }
                },
                {
                    id: 'step-20',
                    title: Lang.choice('ticket.ticket', 2),
                    text: Lang.get('core.ticket_desc'),
                    attachTo: {
                        element: '#manageTickets',
                        on: 'right'
                    },
                    when: {
                        show: function () {
                            // Open the Tickets drop down in the header
                            $('#ticketHeaderDropdown > a').addClass('sp-hover');
                            // Hide the users drop down in the header
                            $('#userHeaderDropdown > a').removeClass('sp-hover');
                        }
                    },
                    buttons: [
                        {
                            text: Lang.get('general.next'),
                            action: function () {
                                instance.setStep(this.getCurrentStep().id);

                                window.location = laroute.route('ticket.operator.ticket');
                            }
                        }
                    ]
                },
                {
                    id: 'step-21',
                    title: Lang.choice('ticket.ticket', 2),
                    text: Lang.get('core.ticket_desc2'),
                    attachTo: {
                        element: '#ticketGridTable',
                        on: 'top'
                    },
                    when: {
                        show: function () {
                            // Hide the Tickets drop down in the header
                            $('#ticketHeaderDropdown > a').removeClass('sp-hover');
                        }
                    }
                },
                {
                    id: 'step-22',
                    title: Lang.get('core.ticket_toolbar'),
                    text: Lang.get('core.ticket_desc3'),
                    attachTo: {
                        element: '#openNewTicket',
                        on: 'bottom'
                    },
                    buttons: [
                        {
                            text: Lang.get('general.next'),
                            action: function () {
                                instance.setStep(this.getCurrentStep().id);

                                window.location = laroute.route('core.operator.dashboard');
                            }
                        }
                    ]
                },
                {
                    id: 'step-23',
                    title: Lang.get('core.tour_complete'),
                    text: Lang.get('core.tour_complete_desc'),
                    buttons: [
                        {
                            text: Lang.get('general.dismiss'),
                            action: function () {
                                return this.complete();
                            }
                        }
                    ]
                }
            ];

            /**
             * Function to run when the product tour is complete.
             */
            var completeCallback = function () {
                instance.clearStep();

                $.post(laroute.route('core.operator.product_tour.toggle'));
            };

            /**
             * Get the step from storage.
             *
             * @returns {string}
             */
            this.getStep = function () {
                return localStorage.getItem(key);
            };

            /**
             * Store the step in storage.
             *
             * @param value
             * @return {void}
             */
            this.setStep = function (value) {
                localStorage.setItem(key, value);
            };

            /**
             * Remove the step from storage.
             *
             * @return {void}
             */
            this.clearStep = function () {
                localStorage.removeItem(key);
            };

            /**
             * Start the tour.
             *
             * @returns {*}
             */
            this.start = function () {
                return this.instance().start();
            };

            /**
             * Show the given step.
             *
             * @param step
             * @returns {*}
             */
            this.show = function (step) {
                return this.instance().show('step-' + step);
            };

            /**
             * Shepherd tour instance.
             *
             * @returns {Shepherd.Tour}
             */
            this.instance = function () {
                if (shepherd === null) {
                    shepherd = new Shepherd.Tour(defaults);
                    shepherd.addSteps(steps);
                    shepherd.on('complete', completeCallback);
                    shepherd.on('cancel', completeCallback);
                }

                return shepherd;
            };

            // Register shepherd instance immediately.
            this.instance();
        }

        App.extend('tour', new Tour);

        $(function () {
            // If a tour is in progress.
            if (App.tour.getStep() !== null) {
                // Get the current page URL
                var currentUrl = [location.protocol, '//', location.host, location.pathname].join(''),
                    step = parseInt(App.tour.getStep().split('-')[1]) + 1;

                if (currentUrl == laroute.route('core.operator.dashboard')) {
                    $('#widgets').on('widgetsLoaded', function (e) {
                        App.tour.show(step);
                    });
                } else {
                    // For all other pages, start the tour when document.ready is fired
                    App.tour.show(step);
                }
            }
        });
    })($, window, document);
}
