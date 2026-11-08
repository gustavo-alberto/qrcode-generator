/**
 * Detects what the user pasted or typed in the quick (link/text) field.
 * Returns "link" | "email" | "phone" | "text", or null for empty input.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else (root.QRApp = root.QRApp || {}).detect = api;
})(typeof self !== "undefined" ? self : this, function () {
  const SCHEME_URL_RE = /^(https?|ftp):\/\/\S+$/i;
  const WWW_RE = /^www\.\S+\.\S+$/i;
  // Bare domain with an alphabetic TLD and optional path: "example.com/a".
  const DOMAIN_RE = /^([a-z0-9-]+\.)+[a-z]{2,}(:\d+)?([/?#]\S*)?$/i;
  const EMAIL_RE = /^(mailto:)?[^\s@]+@[^\s@]+\.[^\s@]+$/i;
  const PHONE_RE = /^(tel:)?\+?[\d\s().-]+$/i;

  function detectType(input) {
    const text = input == null ? "" : String(input).trim();
    if (!text) return null;

    if (EMAIL_RE.test(text)) return "email";
    if (SCHEME_URL_RE.test(text) || WWW_RE.test(text) || DOMAIN_RE.test(text)) return "link";

    if (PHONE_RE.test(text)) {
      const digits = text.replace(/\D/g, "").length;
      if (digits >= 8 && digits <= 15) return "phone";
    }
    return "text";
  }

  return { detectType };
});
