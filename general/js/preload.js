(function () {
  function toggleDarkMode(matches) {
    if (matches) {
      document.documentElement.classList.add('sp-theme-dark');
    } else {
      document.documentElement.classList.remove('sp-theme-dark');
    }
  }
  if (document.documentElement.classList.contains('sp-theme-system')) {
    const darkModePreference = window.matchMedia('(prefers-color-scheme: dark)');
    toggleDarkMode(darkModePreference.matches);
    darkModePreference.addEventListener('change', e => toggleDarkMode(e.matches));
  }
})();