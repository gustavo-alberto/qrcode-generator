const test = require("node:test");
const assert = require("node:assert/strict");
const e = require("../js/export.js");

test("slugify strips accents and symbols", () => {
  assert.equal(e.slugify("Café da Manhã!"), "cafe-da-manha");
  assert.equal(e.slugify("  example.com/path?x=1 "), "example-com-path-x-1");
  assert.equal(e.slugify("***"), "");
  assert.equal(e.slugify(null), "");
});

test("slugify limits length without a trailing dash", () => {
  const out = e.slugify("a".repeat(39) + " bcd");
  assert.equal(out, "a".repeat(39));
  assert.ok(out.length <= 40);
});

test("buildFileName prefixes qr- and falls back to qrcode", () => {
  assert.equal(e.buildFileName("example.com"), "qr-example-com");
  assert.equal(e.buildFileName("wifi Casa 1"), "qr-wifi-casa-1");
  assert.equal(e.buildFileName(""), "qrcode");
});

test("cleanFileName removes extensions and forbidden characters", () => {
  assert.equal(e.cleanFileName("my:file?.png", "x"), "my-file-");
  assert.equal(e.cleanFileName("  ", "fallback"), "fallback");
  assert.equal(e.cleanFileName("Menu Lunch.JPEG", "x"), "Menu Lunch");
});

test("sanitizeExportPrefs falls back per key", () => {
  assert.deepEqual(e.sanitizeExportPrefs(undefined), Object.assign({}, e.DEFAULT_EXPORT));
  assert.deepEqual(e.sanitizeExportPrefs({ format: "svg", size: 777, pdfSize: 8, pdfPage: "letter" }), {
    format: "svg",
    size: 1024,
    pdfSize: 8,
    pdfPage: "qr"
  });
});

test("pdfPixels is 300 dpi with a 1024 px floor", () => {
  assert.equal(e.pdfPixels(3), 1024);
  assert.equal(e.pdfPixels(10), 1181);
});

test("pdfLayout: QR-only page adds padding, A4 centers", () => {
  assert.deepEqual(e.pdfLayout(5, "qr"), { format: [60, 60], x: 5, y: 5, size: 50 });
  assert.deepEqual(e.pdfLayout(8, "a4"), { format: "a4", x: 65, y: 108.5, size: 80 });
});
