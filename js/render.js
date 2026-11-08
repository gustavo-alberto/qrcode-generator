/**
 * QR rendering on top of qr-code-styling.
 *
 * qr-code-styling's update() clears its container before encoding, so a
 * data overflow would wipe the preview. To always keep the last valid QR
 * on screen, each render builds a fresh, detached instance and only swaps
 * it into the DOM when encoding succeeds.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else (root.QRApp = root.QRApp || {}).render = api;
})(typeof self !== "undefined" ? self : this, function () {
  const PREVIEW_SIZE = 320;

  const CORNER_STYLES = {
    square: { square: "square", dot: "square" },
    "extra-rounded": { square: "extra-rounded", dot: "dot" },
    dot: { square: "dot", dot: "dot" }
  };

  /**
   * Quiet-zone width in px for `modules` modules around a QR with
   * `moduleCount` modules per side, drawn in a `size` px square.
   */
  function marginPx(size, moduleCount, modules) {
    if (!modules || !moduleCount) return 0;
    return Math.round((size * modules) / (moduleCount + 2 * modules));
  }

  /** Maps app state to qr-code-styling options. Pure, no DOM access. */
  function buildQrOptions(data, appearance, size, margin, type) {
    const corners = CORNER_STYLES[appearance.cornerStyle] || CORNER_STYLES.square;
    return {
      type: type || "svg",
      width: size,
      height: size,
      margin: margin || 0,
      data: data,
      qrOptions: { errorCorrectionLevel: appearance.errorCorrection },
      dotsOptions: { type: appearance.dotsType, color: appearance.foreground },
      cornersSquareOptions: { type: corners.square, color: appearance.foreground },
      cornersDotOptions: { type: corners.dot, color: appearance.foreground },
      // An empty color makes the library skip the background rect.
      backgroundOptions: { color: appearance.transparent ? "" : appearance.background }
    };
  }

  /**
   * Builds a detached QRCodeStyling instance. Throws on encoding errors
   * (e.g. capacity overflow). `margin` in the appearance is in modules.
   */
  function createQr(QRCodeStyling, data, appearance, size, type) {
    const qr = new QRCodeStyling(buildQrOptions(data, appearance, size, 0, type));
    if (appearance.margin > 0) {
      // Module count is only known after encoding; it comes from the
      // bundled qrcode-generator instance (private but stable in 1.9.x).
      const count = qr._qr && typeof qr._qr.getModuleCount === "function" ? qr._qr.getModuleCount() : 0;
      const px = marginPx(size, count, appearance.margin);
      if (px > 0) qr.update({ margin: px });
    }
    return qr;
  }

  /** Returns true when the error comes from exceeding QR data capacity. */
  function isOverflowError(error) {
    return String(error && error.message ? error.message : error).indexOf("code length overflow") !== -1;
  }

  /**
   * Creates a preview renderer bound to a container element.
   * render() returns { status: "empty" | "ready" | "overflow" | "error" }.
   */
  function createPreview(container, QRCodeStyling) {
    let current = null;

    function render(data, appearance) {
      if (!data) {
        current = null;
        return { status: "empty" };
      }

      let next;
      try {
        next = createQr(QRCodeStyling, data, appearance, PREVIEW_SIZE);
      } catch (error) {
        return { status: isOverflowError(error) ? "overflow" : "error", error: error };
      }

      // Encoding succeeded: replace the previous QR.
      container.querySelectorAll("svg, canvas").forEach(function (el) { el.remove(); });
      next.append(container);
      container.classList.toggle("is-transparent", Boolean(appearance.transparent));
      current = next;
      return { status: "ready" };
    }

    return {
      render: render,
      /** Last successfully rendered instance, or null when empty. */
      getCurrent: function () { return current; }
    };
  }

  return { PREVIEW_SIZE, marginPx, buildQrOptions, createQr, isOverflowError, createPreview };
});
