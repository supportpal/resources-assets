paceOptions = {
  ajax: {
    trackWebSockets: false
  },
  eventLag: {
    lagThreshold: 30
  }
};
if (document.body.hasAttribute('data-disable-pace')) {
  paceOptions.ajax = false;
  paceOptions.startOnPageLoad = false;
}