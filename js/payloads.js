/**
 * Payload builders: turn form fields into the string encoded in the QR.
 *
 * validate(type, fields) -> { fieldId: errorKey } for invalid values.
 * missingRequired(type, fields) -> [fieldId] for empty required fields.
 * buildPayload(type, fields) -> string ("" when the content is incomplete
 * or invalid). Error keys are i18n keys.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else (root.QRApp = root.QRApp || {}).payloads = api;
})(typeof self !== "undefined" ? self : this, function () {
  const TYPES = ["link", "text", "wifi", "contact", "whatsapp", "email", "phone", "sms", "location", "event"];

  const REQUIRED = {
    link: ["url"],
    text: ["text"],
    wifi: ["ssid"],
    contact: ["name"],
    whatsapp: ["phone"],
    email: ["to"],
    phone: ["phone"],
    sms: ["phone"],
    location: ["lat", "lng"],
    event: ["title", "start"]
  };

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // ---------- Helpers ----------

  function str(value) {
    return value == null ? "" : String(value).trim();
  }

  function digitsOnly(value) {
    return str(value).replace(/\D/g, "");
  }

  /** Keeps a leading "+" and digits only: "+55 (11) 9..." -> "+55119...". */
  function normalizePhone(value) {
    const v = str(value);
    const digits = digitsOnly(v);
    return v.charAt(0) === "+" ? "+" + digits : digits;
  }

  function isValidPhone(value) {
    const digits = digitsOnly(value);
    return digits.length >= 8 && digits.length <= 15;
  }

  /** Adds https:// when the URL has no scheme. */
  function normalizeUrl(value) {
    const v = str(value);
    if (!v) return "";
    return /^[a-z][a-z0-9+.-]*:/i.test(v) ? v : "https://" + v;
  }

  /** Wi-Fi QR format: \ ; , : " must be backslash-escaped. */
  function escapeWifi(value) {
    return String(value).replace(/([\\;,:"])/g, "\\$1");
  }

  /** vCard 3.0 / iCalendar text values: escape \ ; , and newlines. */
  function escapeText(value) {
    return String(value)
      .replace(/\\/g, "\\\\")
      .replace(/;/g, "\\;")
      .replace(/,/g, "\\,")
      .replace(/\r?\n/g, "\\n");
  }

  /** Parses a coordinate, accepting a comma as decimal separator. */
  function parseCoord(value) {
    const v = str(value).replace(",", ".");
    if (!/^-?\d+(\.\d+)?$/.test(v)) return NaN;
    return Number(v);
  }

  /** "2026-11-08T14:30" (datetime-local) -> "20261108T143000". */
  function toIcalDate(value) {
    const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(str(value));
    if (!m) return "";
    return m[1] + m[2] + m[3] + "T" + m[4] + m[5] + (m[6] || "00");
  }

  function lines(list) {
    return list.filter(Boolean).join("\r\n");
  }

  function query(params) {
    const parts = Object.keys(params)
      .filter(function (k) { return str(params[k]) !== ""; })
      .map(function (k) { return k + "=" + encodeURIComponent(str(params[k])); });
    return parts.length ? "?" + parts.join("&") : "";
  }

  // ---------- Validation ----------

  function missingRequired(type, fields) {
    const f = fields || {};
    return (REQUIRED[type] || []).filter(function (id) { return str(f[id]) === ""; });
  }

  function validate(type, fields) {
    const f = fields || {};
    const errors = {};

    function check(id, ok, key) {
      if (str(f[id]) !== "" && !ok) errors[id] = key;
    }

    switch (type) {
      case "link":
        check("url", !/\s/.test(str(f.url)), "errUrlSpaces");
        break;
      case "contact":
        check("phone", isValidPhone(f.phone), "errPhone");
        check("email", EMAIL_RE.test(str(f.email)), "errEmail");
        break;
      case "whatsapp":
        // wa.me needs the full international number: country code + number.
        check("phone", digitsOnly(f.phone).length >= 10 && digitsOnly(f.phone).length <= 15, "errPhoneIntl");
        break;
      case "email":
        check("to", EMAIL_RE.test(str(f.to)), "errEmail");
        break;
      case "phone":
      case "sms":
        check("phone", isValidPhone(f.phone), "errPhone");
        break;
      case "location": {
        const lat = parseCoord(f.lat);
        const lng = parseCoord(f.lng);
        check("lat", !isNaN(lat) && lat >= -90 && lat <= 90, "errLat");
        check("lng", !isNaN(lng) && lng >= -180 && lng <= 180, "errLng");
        break;
      }
      case "event":
        check("start", toIcalDate(f.start) !== "", "errDate");
        check("end", toIcalDate(f.end) !== "", "errDate");
        if (!errors.start && !errors.end && str(f.end) && toIcalDate(f.end) <= toIcalDate(f.start)) {
          errors.end = "errEndBeforeStart";
        }
        break;
    }
    return errors;
  }

  // ---------- Builders ----------

  const builders = {
    link: function (f) {
      return normalizeUrl(f.url);
    },

    text: function (f) {
      // Keep inner whitespace and line breaks; only trim the ends.
      return f.text == null ? "" : String(f.text).trim();
    },

    wifi: function (f) {
      const security = f.security === "WEP" || f.security === "nopass" ? f.security : "WPA";
      const parts = ["WIFI:T:" + security, "S:" + escapeWifi(str(f.ssid))];
      if (security !== "nopass" && f.password) parts.push("P:" + escapeWifi(f.password));
      if (f.hidden === true || f.hidden === "true") parts.push("H:true");
      return parts.join(";") + ";;";
    },

    contact: function (f) {
      const name = str(f.name);
      const words = name.split(/\s+/);
      const last = words.length > 1 ? words.pop() : "";
      const first = words.join(" ");
      return lines([
        "BEGIN:VCARD",
        "VERSION:3.0",
        "N:" + escapeText(last) + ";" + escapeText(first) + ";;;",
        "FN:" + escapeText(name),
        str(f.org) && "ORG:" + escapeText(str(f.org)),
        str(f.phone) && "TEL:" + normalizePhone(f.phone),
        str(f.email) && "EMAIL:" + escapeText(str(f.email)),
        str(f.url) && "URL:" + escapeText(normalizeUrl(f.url)),
        "END:VCARD"
      ]);
    },

    whatsapp: function (f) {
      return "https://wa.me/" + digitsOnly(f.phone) + query({ text: f.message });
    },

    email: function (f) {
      return "mailto:" + str(f.to) + query({ subject: f.subject, body: f.body });
    },

    phone: function (f) {
      return "tel:" + normalizePhone(f.phone);
    },

    sms: function (f) {
      const message = str(f.message);
      return "SMSTO:" + normalizePhone(f.phone) + (message ? ":" + message : "");
    },

    location: function (f) {
      return "geo:" + parseCoord(f.lat) + "," + parseCoord(f.lng);
    },

    event: function (f) {
      return lines([
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "BEGIN:VEVENT",
        "SUMMARY:" + escapeText(str(f.title)),
        "DTSTART:" + toIcalDate(f.start),
        str(f.end) && "DTEND:" + toIcalDate(f.end),
        str(f.location) && "LOCATION:" + escapeText(str(f.location)),
        str(f.description) && "DESCRIPTION:" + escapeText(str(f.description)),
        "END:VEVENT",
        "END:VCALENDAR"
      ]);
    }
  };

  function buildPayload(type, fields) {
    const f = fields || {};
    if (!builders[type]) return "";
    if (missingRequired(type, f).length) return "";
    if (Object.keys(validate(type, f)).length) return "";
    return builders[type](f);
  }

  /**
   * Payload for the quick field, interpreted as `kind`
   * ("link" | "email" | "phone" | "text", usually from detectType).
   */
  function buildQuickPayload(value, kind) {
    const v = str(value);
    if (!v) return "";
    switch (kind) {
      case "email": return "mailto:" + v.replace(/^mailto:/i, "");
      case "phone": return "tel:" + normalizePhone(v.replace(/^tel:/i, ""));
      case "link": return normalizeUrl(v);
      default: return builders.text({ text: value });
    }
  }

  return {
    TYPES,
    REQUIRED,
    buildPayload,
    buildQuickPayload,
    validate,
    missingRequired,
    normalizeUrl,
    normalizePhone,
    escapeWifi,
    escapeText,
    toIcalDate
  };
});
