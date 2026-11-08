/**
 * App bootstrap: theme and language toggles.
 */
(function () {
  const { state, i18n } = window.QRApp;

  const root = document.documentElement;
  const themeToggle = document.getElementById("theme-toggle");
  const langToggle = document.getElementById("lang-toggle");
  const langCode = document.getElementById("lang-code");
  const systemDark = window.matchMedia("(prefers-color-scheme: dark)");

  // ---------- Theme ----------

  function effectiveTheme() {
    const explicit = root.getAttribute("data-theme");
    if (explicit === "light" || explicit === "dark") return explicit;
    return systemDark.matches ? "dark" : "light";
  }

  function renderThemeToggle() {
    const theme = effectiveTheme();
    // CSS uses this to show the icon of the theme the button switches to.
    root.setAttribute("data-theme-effective", theme);
    const label = i18n.t(theme === "dark" ? "toggleThemeToLight" : "toggleTheme");
    themeToggle.setAttribute("aria-label", label);
    themeToggle.setAttribute("title", label);
  }

  themeToggle.addEventListener("click", function () {
    const next = effectiveTheme() === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    state.savePrefs({ theme: next });
    renderThemeToggle();
  });

  // Follow system changes while the user has not chosen a theme explicitly.
  systemDark.addEventListener("change", renderThemeToggle);

  // ---------- Language ----------

  function renderLanguage() {
    i18n.applyI18n();
    langCode.textContent = i18n.getLang().toUpperCase();
    renderThemeToggle(); // its label depends on both theme and language
  }

  langToggle.addEventListener("click", function () {
    const next = i18n.getLang() === "pt" ? "en" : "pt";
    i18n.setLang(next);
    state.savePrefs({ lang: next });
    renderLanguage();
  });

  // ---------- Init ----------

  const prefs = state.loadPrefs();
  i18n.setLang(i18n.resolveLang(prefs.lang, navigator.language));
  renderLanguage();
})();
