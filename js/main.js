/**
 * App bootstrap: theme and language toggles, content input and live preview.
 */
(function () {
  const { state, i18n, ui, render, content, payloads, detect, presets, appearance, validate, exporter } = window.QRApp;

  const PREVIEW_DEBOUNCE_MS = 150;
  const SAVE_DEBOUNCE_MS = 300;
  const prefs = state.loadPrefs();
  const app = state.createAppState(presets.sanitizeAppearance(prefs.appearance));
  app.logo = null; // { src, size } — session only, never persisted

  /** Appearance plus the logo, as the renderer and exporter expect it. */
  function renderLook() {
    return Object.assign({}, app.appearance, app.logo ? { logo: app.logo.src, logoSize: app.logo.size } : {});
  }

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

  const statusAction = document.getElementById("status-action");
  let statusActionHandler = null;
  let exportPanel = null; // created after the appearance block

  statusAction.addEventListener("click", function () {
    if (statusActionHandler) statusActionHandler();
    // The button may disappear after the fix; keep focus nearby.
    statusText.focus();
  });

  function formatRatio(ratio) {
    return ratio.toLocaleString(i18n.getLang() === "pt" ? "pt-BR" : "en", { maximumFractionDigits: 1 });
  }

  function renderStatus() {
    let status = lastStatus;
    let text = i18n.t(STATUS_KEYS[lastStatus]);
    let action = null;

    // A rendered QR may still be hard to scan because of its colors.
    if (lastStatus === "ready") {
      const check = validate.checkScannability(app.appearance);
      if (check.code === "inverted") {
        status = "warning";
        text = i18n.t("warnInverted");
        action = {
          label: i18n.t("actionInvert"),
          run: function () {
            appearanceBlock.apply({ foreground: app.appearance.background, background: app.appearance.foreground });
          }
        };
      } else if (check.code === "lowContrast") {
        status = "warning";
        text = i18n.t("warnLowContrast", { ratio: formatRatio(check.ratio) });
        action = {
          label: i18n.t("actionFix"),
          run: function () {
            const bg = app.appearance.transparent ? "#ffffff" : app.appearance.background;
            const fixed = validate.fixContrast(app.appearance.foreground, bg);
            appearanceBlock.apply(
              app.appearance.transparent ? { foreground: fixed.foreground } : fixed
            );
          }
        };
      } else if (app.logo && app.appearance.errorCorrection !== "H") {
        status = "warning";
        text = i18n.t("warnLogoEcc");
        action = {
          label: i18n.t("actionUseMax"),
          run: function () { appearanceBlock.apply({ errorCorrection: "H" }); }
        };
      }
    }

    statusEl.setAttribute("data-status", status);
    statusText.textContent = text;
    statusAction.hidden = !action;
    statusAction.textContent = action ? action.label : "";
    statusActionHandler = action ? action.run : null;

    const hasQr = preview.getCurrent() !== null;
    qrCanvas.classList.toggle("is-empty", !hasQr);
    qrCanvas.classList.toggle("is-stale", hasQr && lastStatus !== "ready");
    qrCanvas.setAttribute(
      "aria-label",
      lastStatus === "ready"
        ? i18n.t("previewLabel", { text: contentBlock.getSummary() })
        : i18n.t("emptyPreviewLabel")
    );

    if (exportPanel) exportPanel.refresh();
  }

  function updatePreview() {
    const result = contentBlock.getResult();
    app.content.payload = result.payload;

    if (result.status === "invalid") {
      lastStatus = "invalid";
    } else if (result.status === "ok") {
      const rendered = preview.render(result.payload, renderLook());
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
      },
      onLogoChange: function (logo) {
        app.logo = logo;
        updatePreviewDebounced();
      }
    }
  );

  // ---------- Export ----------

  exportPanel = exporter.createPanel(
    { i18n: i18n, ui: ui, render: render, QRCodeStyling: window.QRCodeStyling, jsPDF: window.jspdf.jsPDF },
    {
      prefs: prefs.export,
      // Export only what the preview shows as ready (warnings included).
      getExportable: function () {
        if (lastStatus !== "ready" || !app.content.payload) return null;
        return {
          payload: app.content.payload,
          appearance: renderLook(),
          nameHint: contentBlock.getNameHint()
        };
      },
      onPrefsChange: function (next) {
        state.savePrefs({ export: next });
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
