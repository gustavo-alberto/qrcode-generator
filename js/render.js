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

  /** Maps app state to qr-code-styling options. Pure, no DOM access. */
  function buildQrOptions(data, appearance, size) {
    return {
      type: "svg",
      width: size,
      height: size,
      margin: 0,
      data: data,
      qrOptions: { errorCorrectionLevel: appearance.errorCorrection },
      dotsOptions: { type: appearance.dotsType, color: appearance.foreground },
      cornersSquareOptions: { type: appearance.cornersSquareType, color: appearance.foreground },
      cornersDotOptions: { type: appearance.cornersDotType, color: appearance.foreground },
      backgroundOptions: { color: appearance.background }
    };
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
        next = new QRCodeStyling(buildQrOptions(data, appearance, PREVIEW_SIZE));
      } catch (error) {
        return { status: isOverflowError(error) ? "overflow" : "error", error: error };
      }

      // Encoding succeeded: replace the previous QR.
      container.querySelectorAll("svg, canvas").forEach(function (el) { el.remove(); });
      next.append(container);
      current = next;
      return { status: "ready" };
    }

    return {
      render: render,
      /** Last successfully rendered instance, or null when empty. */
      getCurrent: function () { return current; }
    };
  }

  return { PREVIEW_SIZE, buildQrOptions, isOverflowError, createPreview };
});
