/**
 * Persistent user preferences.
 *
 * Only preferences are stored (theme, language and, later, appearance and
 * export settings). QR content is never persisted because it may contain
 * Wi-Fi passwords or personal data.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else (root.QRApp = root.QRApp || {}).state = api;
})(typeof self !== "undefined" ? self : this, function () {
  const STORAGE_KEY = "qrgen:v1";

  /**
   * Creates the in-memory app state. Content is session-only;
   * `appearance` is filled at startup from sanitized preferences.
   */
  function createAppState(appearance) {
    return {
      content: { payload: "" },
      appearance: appearance
    };
  }

  function getStorage() {
    try {
      return typeof localStorage !== "undefined" ? localStorage : null;
    } catch (e) {
      // Access can throw in private mode or with blocked site data.
      return null;
    }
  }

  function loadPrefs() {
    const storage = getStorage();
    if (!storage) return {};
    try {
      const parsed = JSON.parse(storage.getItem(STORAGE_KEY) || "{}");
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (e) {
      return {};
    }
  }

  function savePrefs(patch) {
    const next = Object.assign(loadPrefs(), patch);
    const storage = getStorage();
    if (!storage) return next;
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      // Quota or access error: preferences simply won't persist.
    }
    return next;
  }

  return { STORAGE_KEY, createAppState, loadPrefs, savePrefs };
});
