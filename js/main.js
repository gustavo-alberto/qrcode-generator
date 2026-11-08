/**
 * App bootstrap: theme and language toggles, content input and live preview.
 */
(function () {
  const { state, i18n, ui, render, content, payloads, detect, presets, appearance } = window.QRApp;

  const PREVIEW_DEBOUNCE_MS = 150;
  const SAVE_DEBOUNCE_MS = 300;
  const prefs = state.loadPrefs();
  const app = state.createAppState(presets.sanitizeAppearance(prefs.appearance));

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

  const qrCanvas = document.getElementById("qr-canvas");
  const statusEl = document.getElementById("status");
  const statusText = document.getElementById("status-text");
  const preview = render.createPreview(qrCanvas, window.QRCodeStyling);

  let lastStatus = "empty";

  // Status shown under the preview. "invalid" keeps the last valid QR (dimmed);
  // "empty" and "incomplete" clear it so it never shows outdated content.
  const STATUS_KEYS = {
    empty: "statusEmpty",
    incomplete: "statusIncomplete",
    invalid: "statusInvalid",
    ready: "statusReady",
    overflow: "statusOverflow",
    error: "statusError"
  };

  const contentBlock = content.create(
    document.getElementById("content-body"),
    { i18n: i18n, ui: ui, payloads: payloads, detect: detect },
    { onChange: function () { updatePreviewDebounced(); } }
  );

  function renderStatus() {
    statusEl.setAttribute("data-status", lastStatus);
    statusText.textContent = i18n.t(STATUS_KEYS[lastStatus]);

    const hasQr = preview.getCurrent() !== null;
    qrCanvas.classList.toggle("is-empty", !hasQr);
    qrCanvas.classList.toggle("is-stale", hasQr && lastStatus !== "ready");
    qrCanvas.setAttribute(
      "aria-label",
      lastStatus === "ready"
        ? i18n.t("previewLabel", { text: contentBlock.getSummary() })
        : i18n.t("emptyPreviewLabel")
    );
  }

  function updatePreview() {
    const result = contentBlock.getResult();
    app.content.payload = result.payload;

    if (result.status === "invalid") {
      lastStatus = "invalid";
    } else if (result.status === "ok") {
      const rendered = preview.render(result.payload, app.appearance);
      if (rendered.status === "error") console.error(rendered.error);
      lastStatus = rendered.status;
    } else {
      preview.render("", app.appearance);
      lastStatus = result.status; // "empty" | "incomplete"
    }
    renderStatus();
    appearanceBlock.refreshThumbnails(result.status === "ok" ? result.payload : "");
  }

  const updatePreviewDebounced = ui.debounce(updatePreview, PREVIEW_DEBOUNCE_MS);

  // ---------- Appearance ----------

  const saveAppearance = ui.debounce(function () {
    state.savePrefs({ appearance: app.appearance });
  }, SAVE_DEBOUNCE_MS);

  const appearanceBlock = appearance.create(
    document.getElementById("appearance-body"),
    { i18n: i18n, ui: ui, presets: presets, render: render, QRCodeStyling: window.QRCodeStyling },
    {
      appearance: app.appearance,
      onChange: function (next) {
        app.appearance = next;
        saveAppearance();
        updatePreviewDebounced();
      }
    }
  );

  langToggle.addEventListener("click", function () {
    const next = i18n.getLang() === "pt" ? "en" : "pt";
    i18n.setLang(next);
    state.savePrefs({ lang: next });
    renderLanguage();
  });

  // ---------- Init ----------

  i18n.setLang(i18n.resolveLang(prefs.lang, navigator.language));
  renderLanguage();
})();
