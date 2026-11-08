/**
 * Small DOM helpers shared by the app.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else (root.QRApp = root.QRApp || {}).ui = api;
})(typeof self !== "undefined" ? self : this, function () {
  /** Delays fn until `wait` ms have passed without another call. */
  function debounce(fn, wait) {
    let timer = null;
    return function () {
      const args = arguments;
      const ctx = this;
      clearTimeout(timer);
      timer = setTimeout(function () { fn.apply(ctx, args); }, wait);
    };
  }

  /** Grows a textarea to fit its content, up to its CSS max-height. */
  function autoGrow(textarea) {
    textarea.style.height = "auto";
    // scrollHeight excludes borders; add them back for border-box sizing.
    const borders = textarea.offsetHeight - textarea.clientHeight;
    textarea.style.height = textarea.scrollHeight + borders + "px";
  }

  /** Shortens text for labels, adding an ellipsis when cut. */
  function truncate(text, max) {
    const clean = String(text).replace(/\s+/g, " ").trim();
    return clean.length > max ? clean.slice(0, max - 1) + "…" : clean;
  }

  return { debounce, autoGrow, truncate };
});
