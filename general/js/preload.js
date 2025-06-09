(function () {
  function toggleDarkMode(matches) {
    if (matches) {
      document.documentElement.classList.add('sp-theme-dark');
    } else {
      document.documentElement.classList.remove('sp-theme-dark');
    }

    // Handles TinyMCE editors
    var iframes = document.getElementsByClassName("tox-edit-area__iframe");
    for (let iframe of iframes) {
      if (!iframe.contentWindow) {
        return;
      }
      if (matches) {
        iframe.contentWindow.document.body.classList.add('sp-theme-dark');
      } else {
        iframe.contentWindow.document.body.classList.remove('sp-theme-dark');
      }
    }
  }
  if (document.documentElement.classList.contains('sp-theme-system')) {
    const darkModePreference = window.matchMedia('(prefers-color-scheme: dark)');
    toggleDarkMode(darkModePreference.matches);
    darkModePreference.addEventListener('change', e => toggleDarkMode(e.matches));
  }
})();