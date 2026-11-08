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
      previewLabel: "QR code for: {text}",
      statusEmpty: "Your QR code will appear here",
      statusReady: "Ready to scan",
      statusOverflow: "Too much content for a QR code. Shorten it or lower the error correction.",
      statusError: "Could not generate the QR code.",
      contentLabel: "Link or text",
      contentPlaceholder: "Paste a link or type…",
      contentHint: "The QR code updates as you type.",
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
      previewLabel: "QR code para: {text}",
      statusEmpty: "Seu QR code aparece aqui",
      statusReady: "Pronto para escanear",
      statusOverflow: "Conteúdo grande demais para um QR code. Encurte ou reduza a correção de erro.",
      statusError: "Não foi possível gerar o QR code.",
      contentLabel: "Link ou texto",
      contentPlaceholder: "Cole um link ou digite…",
      contentHint: "O QR code atualiza enquanto você digita.",
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

  /**
   * Translates a key, falling back to English and then to the key itself.
   * Placeholders like {name} are replaced from `params`.
   */
  function t(key, params) {
    const dict = dictionaries[current] || dictionaries.en;
    let text = key in dict ? dict[key] : key in dictionaries.en ? dictionaries.en[key] : key;
    if (params) {
      text = text.replace(/\{(\w+)\}/g, function (match, name) {
        return name in params ? String(params[name]) : match;
      });
    }
    return text;
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
