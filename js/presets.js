/**
 * Appearance options, presets and sanitizing of stored appearance.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else (root.QRApp = root.QRApp || {}).presets = api;
})(typeof self !== "undefined" ? self : this, function () {
  const DOT_TYPES = ["square", "dots", "rounded", "extra-rounded", "classy-rounded"];
  // One "corners" control drives both the finder frame and its inner dot
  // (mapping to library types lives in render.js).
  const CORNER_STYLES = ["square", "extra-rounded", "dot"];
  const ERROR_LEVELS = ["L", "M", "Q", "H"];
  const MARGINS = [0, 1, 2, 3, 4];

  const DEFAULT_APPEARANCE = Object.freeze({
    dotsType: "square",
    cornerStyle: "square",
    foreground: "#000000",
    background: "#ffffff",
    transparent: false,
    errorCorrection: "M",
    margin: 2
  });

  /** Visual presets. They only set style and colors, never ECC or margin. */
  const PRESETS = [
    { id: "classic", label: "presetClassic", dotsType: "square", cornerStyle: "square", foreground: "#000000", background: "#ffffff" },
    { id: "dots", label: "presetDots", dotsType: "dots", cornerStyle: "dot", foreground: "#000000", background: "#ffffff" },
    { id: "rounded", label: "presetRounded", dotsType: "extra-rounded", cornerStyle: "extra-rounded", foreground: "#000000", background: "#ffffff" },
    { id: "ink", label: "presetInk", dotsType: "rounded", cornerStyle: "extra-rounded", foreground: "#1b2a4a", background: "#ffffff" },
    { id: "wine", label: "presetWine", dotsType: "classy-rounded", cornerStyle: "extra-rounded", foreground: "#6b1d2a", background: "#ffffff" }
  ];

  const PRESET_KEYS = ["dotsType", "cornerStyle", "foreground", "background"];

  /** Returns "#rrggbb" for "#rgb", "rgb", "#rrggbb" or "rrggbb"; otherwise null. */
  function normalizeHex(value) {
    const v = String(value == null ? "" : value).trim().replace(/^#/, "").toLowerCase();
    if (/^[0-9a-f]{3}$/.test(v)) return "#" + v.split("").map(function (c) { return c + c; }).join("");
    if (/^[0-9a-f]{6}$/.test(v)) return "#" + v;
    return null;
  }

  /** Returns the id of the preset matching the appearance, or "custom". */
  function matchPreset(appearance) {
    if (appearance.transparent) return "custom";
    const found = PRESETS.find(function (preset) {
      return PRESET_KEYS.every(function (key) { return preset[key] === appearance[key]; });
    });
    return found ? found.id : "custom";
  }

  /** Applies a preset over an appearance, keeping ECC and margin. */
  function applyPreset(appearance, id) {
    const preset = PRESETS.find(function (p) { return p.id === id; });
    if (!preset) return Object.assign({}, appearance);
    const next = Object.assign({}, appearance, { transparent: false });
    PRESET_KEYS.forEach(function (key) { next[key] = preset[key]; });
    return next;
  }

  /** Validates stored/untrusted appearance, falling back to defaults per key. */
  function sanitizeAppearance(input) {
    const src = input && typeof input === "object" ? input : {};
    const d = DEFAULT_APPEARANCE;
    return {
      dotsType: DOT_TYPES.indexOf(src.dotsType) !== -1 ? src.dotsType : d.dotsType,
      cornerStyle: CORNER_STYLES.indexOf(src.cornerStyle) !== -1 ? src.cornerStyle : d.cornerStyle,
      foreground: normalizeHex(src.foreground) || d.foreground,
      background: normalizeHex(src.background) || d.background,
      transparent: src.transparent === true,
      errorCorrection: ERROR_LEVELS.indexOf(src.errorCorrection) !== -1 ? src.errorCorrection : d.errorCorrection,
      margin: MARGINS.indexOf(src.margin) !== -1 ? src.margin : d.margin
    };
  }

  function isDefault(appearance) {
    return Object.keys(DEFAULT_APPEARANCE).every(function (key) {
      return appearance[key] === DEFAULT_APPEARANCE[key];
    });
  }

  return {
    DOT_TYPES,
    CORNER_STYLES,
    ERROR_LEVELS,
    MARGINS,
    DEFAULT_APPEARANCE,
    PRESETS,
    normalizeHex,
    matchPreset,
    applyPreset,
    sanitizeAppearance,
    isDefault
  };
});
