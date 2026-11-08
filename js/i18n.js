/**
 * Minimal i18n.
 *
 * Markup:
 *   data-i18n="key"                      -> sets textContent
 *   data-i18n-attr="aria-label:key;title:key" -> sets attributes
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else (root.QRApp = root.QRApp || {}).i18n = api;
})(typeof self !== "undefined" ? self : this, function () {
  const SUPPORTED = ["en", "pt"];

  const dictionaries = {
    en: {
      skipToContent: "Skip to content",
      headerActions: "Settings",
      toggleTheme: "Switch to dark theme",
      toggleThemeToLight: "Switch to light theme",
      switchLanguage: "Mudar para português",
      sourceCode: "Source code on GitHub",
      contentTitle: "Content",
      appearanceTitle: "Appearance",
      exportTitle: "Export",
      previewTitle: "Preview",
      comingSoon: "Coming in a later stage.",
      emptyPreviewLabel: "Empty QR code preview",
      statusEmpty: "Your QR code will appear here",
      footerLicense: "Open source (MIT)",
      download: "Download",
      copy: "Copy"
    },
    pt: {
      skipToContent: "Pular para o conteúdo",
      headerActions: "Configurações",
      toggleTheme: "Mudar para tema escuro",
      toggleThemeToLight: "Mudar para tema claro",
      switchLanguage: "Switch to English",
      sourceCode: "Código-fonte no GitHub",
      contentTitle: "Conteúdo",
      appearanceTitle: "Aparência",
      exportTitle: "Exportar",
      previewTitle: "Pré-visualização",
      comingSoon: "Disponível em uma próxima etapa.",
      emptyPreviewLabel: "Pré-visualização do QR code vazia",
      statusEmpty: "Seu QR code aparece aqui",
      footerLicense: "Código aberto (MIT)",
      download: "Baixar",
      copy: "Copiar"
    }
  };

  let current = "en";

  /** Picks the saved language, else the browser language, else English. */
  function resolveLang(saved, browserLang) {
    if (SUPPORTED.includes(saved)) return saved;
    const base = String(browserLang || "").toLowerCase().slice(0, 2);
    return SUPPORTED.includes(base) ? base : "en";
  }

  function setLang(lang) {
    current = SUPPORTED.includes(lang) ? lang : "en";
    return current;
  }

  function getLang() {
    return current;
  }

  /** Translates a key, falling back to English and then to the key itself. */
  function t(key) {
    const dict = dictionaries[current] || dictionaries.en;
    if (key in dict) return dict[key];
    if (key in dictionaries.en) return dictionaries.en[key];
    return key;
  }

  function applyI18n(rootEl) {
    const scope = rootEl || document;
    document.documentElement.lang = current === "pt" ? "pt-BR" : "en";

    scope.querySelectorAll("[data-i18n]").forEach(function (el) {
      el.textContent = t(el.getAttribute("data-i18n"));
    });

    scope.querySelectorAll("[data-i18n-attr]").forEach(function (el) {
      el.getAttribute("data-i18n-attr").split(";").forEach(function (pair) {
        const parts = pair.split(":");
        if (parts.length === 2) el.setAttribute(parts[0].trim(), t(parts[1].trim()));
      });
    });
  }

  return { SUPPORTED, dictionaries, resolveLang, setLang, getLang, t, applyI18n };
});
