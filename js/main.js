/**
 * App bootstrap: theme and language toggles, content input and live preview.
 */
(function () {
  const { state, i18n, ui, render } = window.QRApp;

  const PREVIEW_DEBOUNCE_MS = 150;
  const app = state.createAppState();

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
    renderStatus();
  }

  // ---------- Preview ----------

  const contentInput = document.getElementById("content-input");
  const qrCanvas = document.getElementById("qr-canvas");
  const statusEl = document.getElementById("status");
  const statusText = document.getElementById("status-text");
  const preview = render.createPreview(qrCanvas, window.QRCodeStyling);

  let lastStatus = "empty";

  const STATUS_KEYS = {
    empty: "statusEmpty",
    ready: "statusReady",
    overflow: "statusOverflow",
    error: "statusError"
  };

  function renderStatus() {
    statusEl.setAttribute("data-status", lastStatus);
    statusText.textContent = i18n.t(STATUS_KEYS[lastStatus]);

    const hasQr = preview.getCurrent() !== null;
    qrCanvas.classList.toggle("is-empty", !hasQr);
    qrCanvas.classList.toggle("is-stale", hasQr && lastStatus !== "ready");
    qrCanvas.setAttribute(
      "aria-label",
      lastStatus === "ready"
        ? i18n.t("previewLabel", { text: ui.truncate(app.content.text, 80) })
        : i18n.t("emptyPreviewLabel")
    );
  }

  function updatePreview() {
    const result = preview.render(app.content.text, app.appearance);
    if (result.status === "error") console.error(result.error);
    lastStatus = result.status;
    renderStatus();
  }

  const updatePreviewDebounced = ui.debounce(updatePreview, PREVIEW_DEBOUNCE_MS);

  contentInput.addEventListener("input", function () {
    ui.autoGrow(contentInput);
    app.content.text = contentInput.value.trim();
    updatePreviewDebounced();
  });

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
