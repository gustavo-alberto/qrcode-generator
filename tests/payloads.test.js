const test = require("node:test");
const assert = require("node:assert/strict");
const p = require("../js/payloads.js");

test("link adds https:// only when there is no scheme", () => {
  assert.equal(p.buildPayload("link", { url: "example.com" }), "https://example.com");
  assert.equal(p.buildPayload("link", { url: " http://a.b/c " }), "http://a.b/c");
  assert.equal(p.buildPayload("link", { url: "ftp://files.example.com" }), "ftp://files.example.com");
});

test("link with spaces is invalid", () => {
  assert.deepEqual(p.validate("link", { url: "exa mple.com" }), { url: "errUrlSpaces" });
  assert.equal(p.buildPayload("link", { url: "exa mple.com" }), "");
});

test("missing required fields produce an empty payload", () => {
  assert.equal(p.buildPayload("wifi", { password: "x" }), "");
  assert.deepEqual(p.missingRequired("event", { title: "A" }), ["start"]);
  assert.deepEqual(p.missingRequired("location", {}), ["lat", "lng"]);
});

test("text keeps inner line breaks and trims the ends", () => {
  assert.equal(p.buildPayload("text", { text: "  a\nb  " }), "a\nb");
});

test("wifi escapes special characters", () => {
  const out = p.buildPayload("wifi", { ssid: 'My;Net,"1":\\', password: "p;a:s,s", security: "WPA" });
  assert.equal(out, 'WIFI:T:WPA;S:My\\;Net\\,\\"1\\"\\:\\\\;P:p\\;a\\:s\\,s;;');
});

test("wifi open network omits password and supports hidden", () => {
  assert.equal(
    p.buildPayload("wifi", { ssid: "Cafe", password: "ignored", security: "nopass", hidden: true }),
    "WIFI:T:nopass;S:Cafe;H:true;;"
  );
});

test("wifi defaults to WPA for unknown security", () => {
  assert.equal(p.buildPayload("wifi", { ssid: "A", password: "b", security: "???" }), "WIFI:T:WPA;S:A;P:b;;");
});

test("contact builds a vCard 3.0 with escaped values", () => {
  const out = p.buildPayload("contact", {
    name: "Ana Maria Silva",
    phone: "+55 (11) 98765-4321",
    email: "ana@example.com",
    org: "Acme, Inc.",
    url: "acme.com"
  });
  assert.equal(
    out,
    [
      "BEGIN:VCARD",
      "VERSION:3.0",
      "N:Silva;Ana Maria;;;",
      "FN:Ana Maria Silva",
      "ORG:Acme\\, Inc.",
      "TEL:+5511987654321",
      "EMAIL:ana@example.com",
      "URL:https://acme.com",
      "END:VCARD"
    ].join("\r\n")
  );
});

test("contact with a single name and only required fields", () => {
  assert.equal(
    p.buildPayload("contact", { name: "Ana" }),
    ["BEGIN:VCARD", "VERSION:3.0", "N:;Ana;;;", "FN:Ana", "END:VCARD"].join("\r\n")
  );
});

test("contact validates phone and email", () => {
  assert.deepEqual(p.validate("contact", { name: "A", phone: "123", email: "nope" }), {
    phone: "errPhone",
    email: "errEmail"
  });
});

test("whatsapp uses digits only and encodes the message", () => {
  assert.equal(
    p.buildPayload("whatsapp", { phone: "+55 (11) 98765-4321", message: "Olá, tudo bem?" }),
    "https://wa.me/5511987654321?text=Ol%C3%A1%2C%20tudo%20bem%3F"
  );
  assert.equal(p.buildPayload("whatsapp", { phone: "5511987654321" }), "https://wa.me/5511987654321");
});

test("whatsapp requires an international number", () => {
  assert.deepEqual(p.validate("whatsapp", { phone: "98765-4321" }), { phone: "errPhoneIntl" });
});

test("email builds mailto with optional params", () => {
  assert.equal(p.buildPayload("email", { to: "a@b.co" }), "mailto:a@b.co");
  assert.equal(
    p.buildPayload("email", { to: "a@b.co", subject: "Hi there", body: "Line 1\nLine 2" }),
    "mailto:a@b.co?subject=Hi%20there&body=Line%201%0ALine%202"
  );
  assert.deepEqual(p.validate("email", { to: "a@b" }), { to: "errEmail" });
});

test("phone and sms", () => {
  assert.equal(p.buildPayload("phone", { phone: "+1 (555) 123-4567" }), "tel:+15551234567");
  assert.equal(p.buildPayload("sms", { phone: "11 98765 4321" }), "SMSTO:11987654321");
  assert.equal(p.buildPayload("sms", { phone: "+5511987654321", message: "Hi: ok" }), "SMSTO:+5511987654321:Hi: ok");
  assert.deepEqual(p.validate("phone", { phone: "12" }), { phone: "errPhone" });
});

test("location accepts comma decimals and validates ranges", () => {
  assert.equal(p.buildPayload("location", { lat: "-23,5505", lng: "-46.6333" }), "geo:-23.5505,-46.6333");
  assert.deepEqual(p.validate("location", { lat: "91", lng: "abc" }), { lat: "errLat", lng: "errLng" });
});

test("event builds an iCalendar VEVENT", () => {
  const out = p.buildPayload("event", {
    title: "Launch; party",
    start: "2026-11-08T14:30",
    end: "2026-11-08T16:00",
    location: "Rua A, 10",
    description: "Bring\nfriends"
  });
  assert.equal(
    out,
    [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      "SUMMARY:Launch\\; party",
      "DTSTART:20261108T143000",
      "DTEND:20261108T160000",
      "LOCATION:Rua A\\, 10",
      "DESCRIPTION:Bring\\nfriends",
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n")
  );
});

test("event end must be after start", () => {
  assert.deepEqual(p.validate("event", { title: "A", start: "2026-11-08T14:30", end: "2026-11-08T14:00" }), {
    end: "errEndBeforeStart"
  });
});

test("quick payload follows the detected kind", () => {
  assert.equal(p.buildQuickPayload("example.com", "link"), "https://example.com");
  assert.equal(p.buildQuickPayload("a@b.co", "email"), "mailto:a@b.co");
  assert.equal(p.buildQuickPayload("mailto:a@b.co", "email"), "mailto:a@b.co");
  assert.equal(p.buildQuickPayload("+55 11 98765-4321", "phone"), "tel:+5511987654321");
  assert.equal(p.buildQuickPayload(" hello world ", "text"), "hello world");
  assert.equal(p.buildQuickPayload("   ", "text"), "");
});
