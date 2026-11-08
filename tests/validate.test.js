const test = require("node:test");
const assert = require("node:assert/strict");
const v = require("../js/validate.js");

const look = (foreground, background, transparent = false) => ({ foreground, background, transparent });

test("relative luminance of black and white", () => {
  assert.equal(v.relativeLuminance("#000000"), 0);
  assert.equal(v.relativeLuminance("#ffffff"), 1);
});

test("contrast ratio matches WCAG reference values", () => {
  assert.equal(v.contrastRatio("#000000", "#ffffff"), 21);
  assert.equal(v.contrastRatio("#ffffff", "#000000"), 21);
  assert.equal(Number(v.contrastRatio("#777777", "#ffffff").toFixed(2)), 4.48);
});

test("black on white is ok", () => {
  assert.equal(v.checkScannability(look("#000000", "#ffffff")).level, "ok");
});

test("low contrast is reported", () => {
  const r = v.checkScannability(look("#bbbbbb", "#ffffff"));
  assert.equal(r.level, "warn");
  assert.equal(r.code, "lowContrast");
  assert.ok(r.ratio < v.MIN_CONTRAST);
});

test("inverted colors are reported before contrast", () => {
  const r = v.checkScannability(look("#ffffff", "#000000"));
  assert.equal(r.code, "inverted");
});

test("transparent background is judged against white", () => {
  assert.equal(v.checkScannability(look("#000000", "#000000", true)).level, "ok");
  assert.equal(v.checkScannability(look("#eeeeee", "#000000", true)).code, "lowContrast");
});

test("fixContrast darkens the foreground and keeps the background when possible", () => {
  const out = v.fixContrast("#ff9900", "#ffffff");
  assert.equal(out.background, "#ffffff");
  assert.ok(v.contrastRatio(out.foreground, out.background) >= v.FIX_TARGET);
  // Hue is kept: red stays the dominant channel.
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(out.foreground.slice(i, i + 2), 16));
  assert.ok(r > g && g >= b);
});

test("fixContrast lightens a dark background when black is not enough", () => {
  const out = v.fixContrast("#333333", "#444444");
  assert.equal(out.foreground, "#000000");
  assert.ok(v.contrastRatio(out.foreground, out.background) >= v.FIX_TARGET);
});
