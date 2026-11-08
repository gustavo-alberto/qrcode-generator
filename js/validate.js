/**
 * Scannability checks based on color contrast.
 *
 * QR readers need dark modules on a light background with enough
 * contrast. We use the WCAG relative luminance and contrast ratio as a
 * practical proxy and warn below MIN_CONTRAST.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else (root.QRApp = root.QRApp || {}).validate = api;
})(typeof self !== "undefined" ? self : this, function () {
  const MIN_CONTRAST = 4;
  // "Fix" aims a bit above the minimum so small edits don't re-trigger it.
  const FIX_TARGET = 4.5;
  const WHITE = "#ffffff";

  function hexToRgb(hex) {
    const v = String(hex).replace(/^#/, "");
    return [0, 2, 4].map(function (i) { return parseInt(v.slice(i, i + 2), 16); });
  }

  function rgbToHex(rgb) {
    return "#" + rgb.map(function (c) {
      return Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, "0");
    }).join("");
  }

  /** WCAG 2.x relative luminance, 0 (black) to 1 (white). */
  function relativeLuminance(hex) {
    const lin = hexToRgb(hex).map(function (c) {
      const s = c / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
  }

  function contrastRatio(a, b) {
    const la = relativeLuminance(a);
    const lb = relativeLuminance(b);
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
  }

  /** Light modules on a dark background: many readers fail on these. */
  function isInverted(foreground, background) {
    return relativeLuminance(foreground) > relativeLuminance(background);
  }

  /** Transparent backgrounds are judged against white, the usual surface. */
  function effectiveBackground(appearance) {
    return appearance.transparent ? WHITE : appearance.background;
  }

  /**
   * Returns { level: "ok" } or { level: "warn", code: "inverted" | "lowContrast", ratio }.
   * Inversion is reported first: fixing contrast would not help it.
   */
  function checkScannability(appearance) {
    const fg = appearance.foreground;
    const bg = effectiveBackground(appearance);
    const ratio = contrastRatio(fg, bg);
    if (isInverted(fg, bg)) return { level: "warn", code: "inverted", ratio: ratio };
    if (ratio < MIN_CONTRAST) return { level: "warn", code: "lowContrast", ratio: ratio };
    return { level: "ok", ratio: ratio };
  }

  /** Moves `hex` toward `toward` by fraction t (0..1). */
  function mix(hex, toward, t) {
    const a = hexToRgb(hex);
    const b = hexToRgb(toward);
    return rgbToHex(a.map(function (c, i) { return c + (b[i] - c) * t; }));
  }

  /**
   * Raises contrast to `target` keeping the hue: darkens the foreground
   * toward black; if black is not enough, lightens the background.
   * Returns { foreground, background }.
   */
  function fixContrast(foreground, background, target) {
    const goal = target || FIX_TARGET;
    let fg = foreground;
    let bg = background;

    for (let t = 0; t <= 1.0001 && contrastRatio(fg, bg) < goal; t += 0.02) {
      fg = mix(foreground, "#000000", Math.min(1, t));
    }
    for (let t = 0; t <= 1.0001 && contrastRatio(fg, bg) < goal; t += 0.02) {
      bg = mix(background, WHITE, Math.min(1, t));
    }
    return { foreground: fg, background: bg };
  }

  return {
    MIN_CONTRAST,
    FIX_TARGET,
    relativeLuminance,
    contrastRatio,
    isInverted,
    checkScannability,
    fixContrast
  };
});
