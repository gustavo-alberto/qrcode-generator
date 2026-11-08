const test = require("node:test");
const assert = require("node:assert/strict");
const r = require("../js/render.js");

const base = {
  dotsType: "dots",
  cornerStyle: "extra-rounded",
  foreground: "#112233",
  background: "#ffffff",
  transparent: false,
  errorCorrection: "Q",
  margin: 2
};

test("marginPx converts modules to pixels", () => {
  assert.equal(r.marginPx(320, 25, 0), 0);
  assert.equal(r.marginPx(320, 0, 2), 0);
  // 2 modules out of 25 + 4 = 29 total -> 320 * 2 / 29
  assert.equal(r.marginPx(320, 25, 2), 22);
});

test("buildQrOptions maps appearance to library options", () => {
  const o = r.buildQrOptions("hi", base, 100, 5);
  assert.equal(o.width, 100);
  assert.equal(o.margin, 5);
  assert.equal(o.type, "svg");
  assert.equal(o.qrOptions.errorCorrectionLevel, "Q");
  assert.deepEqual(o.dotsOptions, { type: "dots", color: "#112233" });
  assert.deepEqual(o.cornersSquareOptions, { type: "extra-rounded", color: "#112233" });
  assert.deepEqual(o.cornersDotOptions, { type: "dot", color: "#112233" });
  assert.deepEqual(o.backgroundOptions, { color: "#ffffff" });
});

test("transparent background clears the background color", () => {
  const o = r.buildQrOptions("hi", Object.assign({}, base, { transparent: true }), 100);
  assert.deepEqual(o.backgroundOptions, { color: "" });
});

test("logoImageSize maps named sizes to the library cover coefficient", () => {
  assert.equal(r.logoImageSize("small"), 0.2);
  assert.equal(r.logoImageSize("large"), 0.4);
  assert.equal(r.logoImageSize("huge"), 0.3);
  assert.ok(Object.values(r.LOGO_SIZES).every((v) => v <= 0.5));
});

test("logo adds image options; no logo adds none", () => {
  const withLogo = r.buildQrOptions("hi", Object.assign({}, base, { logo: "data:image/png;base64,AA", logoSize: "large", errorCorrection: "H" }), 1000);
  assert.equal(withLogo.image, "data:image/png;base64,AA");
  assert.deepEqual(withLogo.imageOptions, { hideBackgroundDots: true, imageSize: 0.4, margin: 10, saveAsBlob: true });
  const plain = r.buildQrOptions("hi", base, 1000);
  assert.equal("image" in plain, false);
});

test("unknown corner style falls back to square", () => {
  const o = r.buildQrOptions("hi", Object.assign({}, base, { cornerStyle: "x" }), 100);
  assert.equal(o.cornersSquareOptions.type, "square");
  assert.equal(o.cornersDotOptions.type, "square");
});
