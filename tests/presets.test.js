const test = require("node:test");
const assert = require("node:assert/strict");
const p = require("../js/presets.js");

test("normalizeHex accepts short and long forms", () => {
  assert.equal(p.normalizeHex("#ABC"), "#aabbcc");
  assert.equal(p.normalizeHex("1b2a4a"), "#1b2a4a");
  assert.equal(p.normalizeHex(" #FFFFFF "), "#ffffff");
  assert.equal(p.normalizeHex("#12345"), null);
  assert.equal(p.normalizeHex("red"), null);
  assert.equal(p.normalizeHex(null), null);
});

test("default appearance matches the classic preset", () => {
  assert.equal(p.matchPreset(p.DEFAULT_APPEARANCE), "classic");
  assert.equal(p.isDefault(p.DEFAULT_APPEARANCE), true);
});

test("applyPreset keeps error correction and margin", () => {
  const base = Object.assign({}, p.DEFAULT_APPEARANCE, { errorCorrection: "H", margin: 4, transparent: true });
  const next = p.applyPreset(base, "wine");
  assert.equal(next.dotsType, "classy-rounded");
  assert.equal(next.foreground, "#6b1d2a");
  assert.equal(next.errorCorrection, "H");
  assert.equal(next.margin, 4);
  assert.equal(next.transparent, false);
  assert.equal(p.matchPreset(next), "wine");
});

test("any change outside a preset is custom", () => {
  const next = Object.assign(p.applyPreset(p.DEFAULT_APPEARANCE, "dots"), { foreground: "#222222" });
  assert.equal(p.matchPreset(next), "custom");
  assert.equal(p.matchPreset(Object.assign({}, p.DEFAULT_APPEARANCE, { transparent: true })), "custom");
});

test("sanitizeAppearance falls back per key", () => {
  assert.deepEqual(p.sanitizeAppearance(null), Object.assign({}, p.DEFAULT_APPEARANCE));
  const out = p.sanitizeAppearance({
    dotsType: "hearts",
    cornerStyle: "dot",
    foreground: "#ABC",
    background: "nope",
    transparent: "yes",
    errorCorrection: "Q",
    margin: 9
  });
  assert.deepEqual(out, {
    dotsType: "square",
    cornerStyle: "dot",
    foreground: "#aabbcc",
    background: "#ffffff",
    transparent: false,
    errorCorrection: "Q",
    margin: 2
  });
});
