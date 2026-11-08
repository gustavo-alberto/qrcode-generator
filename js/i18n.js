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
      statusIncomplete: "Fill in the required fields (*).",
      statusInvalid: "Fix the highlighted fields.",
      required: "(required)",
      contentType: "Content type",
      more: "More",
      typeLink: "Link",
      typeText: "Text",
      typeWifi: "Wi-Fi",
      typeContact: "Contact",
      typeWhatsapp: "WhatsApp",
      typeEmail: "Email",
      typePhone: "Phone",
      typeSms: "SMS",
      typeLocation: "Location",
      typeEvent: "Event",
      quickLabelLink: "Link",
      quickLabelText: "Text",
      phLink: "Paste a link or type…",
      phText: "Type your text…",
      quickHint: "The QR code updates as you type.",
      detLink: "Link detected.",
      detEmail: "Email detected: opens a new email when scanned.",
      detPhone: "Phone detected: starts a call when scanned.",
      detText: "Plain text: shown as text when scanned.",
      useAsText: "Use as text",
      useAutoDetect: "Detect automatically",
      fSsid: "Network name (SSID)",
      fSecurity: "Security",
      fPassword: "Password",
      fHidden: "Hidden network",
      optWpa: "WPA / WPA2 / WPA3",
      optWep: "WEP",
      optNone: "None (open network)",
      showPassword: "Show",
      hidePassword: "Hide",
      hWifi: "Anyone who scans it joins the network without typing the password.",
      fName: "Name",
      fPhone: "Phone",
      fEmail: "Email",
      fOrg: "Company",
      fWebsite: "Website",
      fWhatsPhone: "WhatsApp number",
      hPhoneIntl: "Include the country code, e.g. +55 11 98765-4321.",
      fMessage: "Message",
      fTo: "To",
      fSubject: "Subject",
      fBody: "Message",
      fLat: "Latitude",
      fLng: "Longitude",
      hLocation: "Tip: right-click a place in your map app to copy its coordinates.",
      fTitle: "Title",
      fStart: "Starts",
      fEnd: "Ends",
      fLocation: "Location",
      fDescription: "Description",
      phPhone: "+1 555 123 4567",
      phEmail: "name@example.com",
      phUrl: "example.com",
      phLat: "-23.5505",
      phLng: "-46.6333",
      errRequired: "This field is required.",
      errUrlSpaces: "A link can't contain spaces.",
      errPhone: "Enter a valid phone number (8 to 15 digits).",
      errPhoneIntl: "Enter the full number with country code (10 to 15 digits).",
      errEmail: "Enter a valid email address.",
      errLat: "Latitude must be a number between -90 and 90.",
      errLng: "Longitude must be a number between -180 and 180.",
      errDate: "Enter a valid date and time.",
      errEndBeforeStart: "The end must be after the start.",
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
      statusIncomplete: "Preencha os campos obrigatórios (*).",
      statusInvalid: "Corrija os campos destacados.",
      required: "(obrigatório)",
      contentType: "Tipo de conteúdo",
      more: "Mais",
      typeLink: "Link",
      typeText: "Texto",
      typeWifi: "Wi-Fi",
      typeContact: "Contato",
      typeWhatsapp: "WhatsApp",
      typeEmail: "E-mail",
      typePhone: "Telefone",
      typeSms: "SMS",
      typeLocation: "Localização",
      typeEvent: "Evento",
      quickLabelLink: "Link",
      quickLabelText: "Texto",
      phLink: "Cole um link ou digite…",
      phText: "Digite seu texto…",
      quickHint: "O QR code atualiza enquanto você digita.",
      detLink: "Link detectado.",
      detEmail: "E-mail detectado: abre um novo e-mail ao escanear.",
      detPhone: "Telefone detectado: inicia uma ligação ao escanear.",
      detText: "Texto puro: aparece como texto ao escanear.",
      useAsText: "Usar como texto",
      useAutoDetect: "Detectar automaticamente",
      fSsid: "Nome da rede (SSID)",
      fSecurity: "Segurança",
      fPassword: "Senha",
      fHidden: "Rede oculta",
      optWpa: "WPA / WPA2 / WPA3",
      optWep: "WEP",
      optNone: "Nenhuma (rede aberta)",
      showPassword: "Mostrar",
      hidePassword: "Ocultar",
      hWifi: "Quem escanear entra na rede sem digitar a senha.",
      fName: "Nome",
      fPhone: "Telefone",
      fEmail: "E-mail",
      fOrg: "Empresa",
      fWebsite: "Site",
      fWhatsPhone: "Número do WhatsApp",
      hPhoneIntl: "Inclua o código do país, ex.: +55 11 98765-4321.",
      fMessage: "Mensagem",
      fTo: "Para",
      fSubject: "Assunto",
      fBody: "Mensagem",
      fLat: "Latitude",
      fLng: "Longitude",
      hLocation: "Dica: clique com o botão direito num local do seu app de mapas para copiar as coordenadas.",
      fTitle: "Título",
      fStart: "Início",
      fEnd: "Fim",
      fLocation: "Local",
      fDescription: "Descrição",
      phPhone: "+55 11 98765-4321",
      phEmail: "nome@exemplo.com",
      phUrl: "exemplo.com",
      phLat: "-23.5505",
      phLng: "-46.6333",
      errRequired: "Campo obrigatório.",
      errUrlSpaces: "Um link não pode ter espaços.",
      errPhone: "Digite um telefone válido (8 a 15 dígitos).",
      errPhoneIntl: "Digite o número completo com código do país (10 a 15 dígitos).",
      errEmail: "Digite um e-mail válido.",
      errLat: "Latitude deve ser um número entre -90 e 90.",
      errLng: "Longitude deve ser um número entre -180 e 180.",
      errDate: "Digite uma data e hora válidas.",
      errEndBeforeStart: "O fim deve ser depois do início.",
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
