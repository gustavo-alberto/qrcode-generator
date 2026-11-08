const test = require("node:test");
const assert = require("node:assert/strict");
const { detectType } = require("../js/detect.js");

test("empty input returns null", () => {
  assert.equal(detectType(""), null);
  assert.equal(detectType("   "), null);
  assert.equal(detectType(null), null);
});

test("detects links", () => {
  for (const input of [
    "https://example.com",
    "http://a.b/c?d=1",
    "www.example.com",
    "example.com",
    "sub.example.com.br/path#x",
    "localhost.dev:8080/a"
  ]) {
    assert.equal(detectType(input), "link", input);
  }
});

test("detects emails", () => {
  assert.equal(detectType("ana@example.com"), "email");
  assert.equal(detectType("mailto:ana@example.com"), "email");
});

test("detects phones", () => {
  for (const input of ["+55 (11) 98765-4321", "11987654321", "tel:+15551234567", "555.123.4567"]) {
    assert.equal(detectType(input), "phone", input);
  }
});

test("falls back to text", () => {
  for (const input of ["hello", "hello world", "1234", "example .com", "v1.2", "Meet at 10:30"]) {
    assert.equal(detectType(input), "text", input);
  }
});
