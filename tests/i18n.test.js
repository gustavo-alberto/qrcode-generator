const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const i18n = require("../js/i18n.js");

const root = path.join(__dirname, "..");
const { en, pt } = i18n.dictionaries;

test("English and Portuguese have the same keys", () => {
  assert.deepEqual(Object.keys(pt).sort(), Object.keys(en).sort());
});

test("no empty translations", () => {
  for (const [lang, dict] of Object.entries(i18n.dictionaries)) {
    for (const [key, value] of Object.entries(dict)) {
      assert.ok(String(value).trim() !== "", `${lang}.${key} is empty`);
    }
  }
});

test("placeholders match between languages", () => {
  const vars = (s) => (s.match(/\{\w+\}/g) || []).sort().join(",");
  for (const key of Object.keys(en)) {
    assert.equal(vars(pt[key]), vars(en[key]), key);
  }
});

test("every key referenced in index.html exists", () => {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const keys = [...html.matchAll(/data-i18n="([^"]+)"/g)].map((m) => m[1]);
  for (const m of html.matchAll(/data-i18n-attr="([^"]+)"/g)) {
    for (const pair of m[1].split(";")) keys.push(pair.split(":")[1]);
  }
  assert.ok(keys.length > 20);
  for (const key of keys) assert.ok(key in en, `missing key: ${key}`);
});

test("every i18n.t(\"key\") call in scripts uses an existing key", () => {
  const dir = path.join(root, "js");
  for (const file of fs.readdirSync(dir)) {
    const src = fs.readFileSync(path.join(dir, file), "utf8");
    for (const m of src.matchAll(/i18n\.t\("([^"]+)"/g)) {
      assert.ok(m[1] in en, `${file}: missing key ${m[1]}`);
    }
  }
});

test("t() falls back and fills placeholders", () => {
  i18n.setLang("pt");
  assert.equal(i18n.t("downloadFormat", { format: "PNG" }), "Baixar PNG");
  assert.equal(i18n.t("no-such-key"), "no-such-key");
  i18n.setLang("en");
});

test("resolveLang prefers saved, then browser, then English", () => {
  assert.equal(i18n.resolveLang("pt", "en-US"), "pt");
  assert.equal(i18n.resolveLang(undefined, "pt-BR"), "pt");
  assert.equal(i18n.resolveLang("xx", "de-DE"), "en");
});
