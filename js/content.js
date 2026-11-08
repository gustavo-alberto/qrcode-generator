/**
 * Block 01 (Content): type picker, quick link/text field with detection,
 * and one form per structured type.
 *
 * Form values live only in memory, per type, so switching types keeps what
 * was typed. Nothing here is persisted.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else (root.QRApp = root.QRApp || {}).content = api;
})(typeof self !== "undefined" ? self : this, function () {
  const PRIMARY_TYPES = ["link", "text", "wifi", "contact", "whatsapp"];
  const MORE_TYPES = ["email", "phone", "sms", "location", "event"];
  const QUICK_TYPES = ["link", "text"];

  const TYPE_LABELS = {
    link: "typeLink",
    text: "typeText",
    wifi: "typeWifi",
    contact: "typeContact",
    whatsapp: "typeWhatsapp",
    email: "typeEmail",
    phone: "typePhone",
    sms: "typeSms",
    location: "typeLocation",
    event: "typeEvent"
  };

  /**
   * Form schemas. kind: text | email | tel | url | password | textarea |
   * select | checkbox | datetime. `half` places two fields side by side.
   */
  const FORMS = {
    wifi: {
      hint: "hWifi",
      fields: [
        { id: "ssid", kind: "text", label: "fSsid", autocomplete: "off" },
        {
          id: "security",
          kind: "select",
          label: "fSecurity",
          initial: "WPA",
          options: [["WPA", "optWpa"], ["WEP", "optWep"], ["nopass", "optNone"]]
        },
        { id: "password", kind: "password", label: "fPassword", autocomplete: "off" },
        { id: "hidden", kind: "checkbox", label: "fHidden" }
      ]
    },
    contact: {
      fields: [
        { id: "name", kind: "text", label: "fName", autocomplete: "name" },
        { id: "phone", kind: "tel", label: "fPhone", placeholder: "phPhone", autocomplete: "tel" },
        { id: "email", kind: "email", label: "fEmail", placeholder: "phEmail", autocomplete: "email" },
        { id: "org", kind: "text", label: "fOrg", autocomplete: "organization" },
        { id: "url", kind: "url", label: "fWebsite", placeholder: "phUrl", autocomplete: "url" }
      ]
    },
    whatsapp: {
      fields: [
        { id: "phone", kind: "tel", label: "fWhatsPhone", placeholder: "phPhone", hint: "hPhoneIntl", autocomplete: "tel" },
        { id: "message", kind: "textarea", label: "fMessage" }
      ]
    },
    email: {
      fields: [
        { id: "to", kind: "email", label: "fTo", placeholder: "phEmail", autocomplete: "email" },
        { id: "subject", kind: "text", label: "fSubject" },
        { id: "body", kind: "textarea", label: "fBody" }
      ]
    },
    phone: {
      fields: [{ id: "phone", kind: "tel", label: "fPhone", placeholder: "phPhone", autocomplete: "tel" }]
    },
    sms: {
      fields: [
        { id: "phone", kind: "tel", label: "fPhone", placeholder: "phPhone", autocomplete: "tel" },
        { id: "message", kind: "textarea", label: "fMessage" }
      ]
    },
    location: {
      hint: "hLocation",
      fields: [
        { id: "lat", kind: "text", label: "fLat", placeholder: "phLat", inputmode: "decimal", half: true },
        { id: "lng", kind: "text", label: "fLng", placeholder: "phLng", inputmode: "decimal", half: true }
      ]
    },
    event: {
      fields: [
        { id: "title", kind: "text", label: "fTitle" },
        { id: "start", kind: "datetime", label: "fStart", half: true },
        { id: "end", kind: "datetime", label: "fEnd", half: true },
        { id: "location", kind: "text", label: "fLocation" },
        { id: "description", kind: "textarea", label: "fDescription" }
      ]
    }
  };

  const INPUT_TYPES = { text: "text", email: "email", tel: "tel", url: "url", password: "password", datetime: "datetime-local" };

  /**
   * Mounts the content block.
   * deps: { i18n, ui, payloads, detect }, options: { onChange }.
   */
  function create(rootEl, deps, options) {
    const { i18n, ui, payloads, detect } = deps;
    const onChange = options.onChange;

    const chipsEl = rootEl.querySelector("#type-chips");
    const moreBtn = rootEl.querySelector("#more-btn");
    const moreLabel = rootEl.querySelector("#more-label");
    const moreMenu = rootEl.querySelector("#more-menu");
    const quickPanel = rootEl.querySelector("#quick-panel");
    const quickLabel = rootEl.querySelector("#quick-label");
    const quickInput = rootEl.querySelector("#content-input");
    const quickError = rootEl.querySelector("#quick-error");
    const detectText = rootEl.querySelector("#detect-text");
    const detectAction = rootEl.querySelector("#detect-action");
    const formsEl = rootEl.querySelector("#form-panels");

    const state = {
      type: "link",
      // Quick field: in "auto" mode the link/text chip follows detection.
      quick: { value: "", auto: true, touched: false },
      fields: {},
      touched: {}
    };

    const panels = {}; // type -> { panel, inputs: { id: el }, errors: { id: el } }

    // ---------- i18n helpers ----------

    function setText(el, key) {
      el.setAttribute("data-i18n", key);
      el.textContent = i18n.t(key);
    }

    function setAttr(el, attr, key) {
      const pairs = (el.getAttribute("data-i18n-attr") || "")
        .split(";")
        .filter(function (p) { return p && p.split(":")[0].trim() !== attr; });
      pairs.push(attr + ":" + key);
      el.setAttribute("data-i18n-attr", pairs.join(";"));
      el.setAttribute(attr, i18n.t(key));
    }

    // ---------- Type picker ----------

    PRIMARY_TYPES.forEach(function (type) {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "chip";
      chip.setAttribute("role", "radio");
      chip.dataset.type = type;
      setText(chip, TYPE_LABELS[type]);
      chipsEl.appendChild(chip);
    });

    MORE_TYPES.forEach(function (type) {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "menu-item";
      item.setAttribute("role", "menuitemradio");
      item.dataset.type = type;
      setText(item, TYPE_LABELS[type]);
      moreMenu.appendChild(item);
    });

    const chips = Array.prototype.slice.call(chipsEl.querySelectorAll(".chip"));
    const menuItems = Array.prototype.slice.call(moreMenu.querySelectorAll(".menu-item"));

    function renderPicker() {
      chips.forEach(function (chip) {
        const selected = chip.dataset.type === state.type;
        chip.setAttribute("aria-checked", String(selected));
        chip.tabIndex = -1;
      });
      // Roving tabindex: the checked chip, or the first one, is tabbable.
      const tabbable = chips.find(function (c) { return c.dataset.type === state.type; }) || chips[0];
      tabbable.tabIndex = 0;

      const moreSelected = MORE_TYPES.indexOf(state.type) !== -1;
      moreBtn.classList.toggle("is-selected", moreSelected);
      setText(moreLabel, moreSelected ? TYPE_LABELS[state.type] : "more");
      menuItems.forEach(function (item) {
        item.setAttribute("aria-checked", String(item.dataset.type === state.type));
      });
    }

    function selectType(type, opts) {
      const fromUser = !opts || opts.fromUser !== false;
      if (QUICK_TYPES.indexOf(type) !== -1 && fromUser && state.quick.value.trim()) {
        // An explicit link/text choice overrides detection until the field is cleared.
        state.quick.auto = false;
      }
      state.type = type;
      renderPicker();
      renderPanels();
      emit();
    }

    chips.forEach(function (chip) {
      chip.addEventListener("click", function () { selectType(chip.dataset.type); });
    });

    chipsEl.addEventListener("keydown", function (event) {
      const index = chips.indexOf(document.activeElement);
      if (index === -1) return;
      let next = -1;
      if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (index + 1) % chips.length;
      else if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = (index - 1 + chips.length) % chips.length;
      else if (event.key === "Home") next = 0;
      else if (event.key === "End") next = chips.length - 1;
      if (next === -1) return;
      event.preventDefault();
      chips[next].focus();
      selectType(chips[next].dataset.type);
    });

    // ---------- "More" menu ----------

    function openMenu(focusIndex) {
      moreMenu.hidden = false;
      moreBtn.setAttribute("aria-expanded", "true");
      const selected = menuItems.findIndex(function (i) { return i.dataset.type === state.type; });
      const target = focusIndex != null ? focusIndex : selected !== -1 ? selected : 0;
      menuItems[(target + menuItems.length) % menuItems.length].focus();
    }

    function closeMenu(returnFocus) {
      if (moreMenu.hidden) return;
      moreMenu.hidden = true;
      moreBtn.setAttribute("aria-expanded", "false");
      if (returnFocus) moreBtn.focus();
    }

    moreBtn.addEventListener("click", function () {
      if (moreMenu.hidden) openMenu();
      else closeMenu(true);
    });

    moreBtn.addEventListener("keydown", function (event) {
      if (event.key === "ArrowDown") { event.preventDefault(); openMenu(0); }
      if (event.key === "ArrowUp") { event.preventDefault(); openMenu(menuItems.length - 1); }
    });

    moreMenu.addEventListener("keydown", function (event) {
      const index = menuItems.indexOf(document.activeElement);
      if (event.key === "ArrowDown") { event.preventDefault(); menuItems[(index + 1) % menuItems.length].focus(); }
      else if (event.key === "ArrowUp") { event.preventDefault(); menuItems[(index - 1 + menuItems.length) % menuItems.length].focus(); }
      else if (event.key === "Home") { event.preventDefault(); menuItems[0].focus(); }
      else if (event.key === "End") { event.preventDefault(); menuItems[menuItems.length - 1].focus(); }
      else if (event.key === "Escape") { event.preventDefault(); closeMenu(true); }
      else if (event.key === "Tab") closeMenu(false);
    });

    menuItems.forEach(function (item) {
      item.addEventListener("click", function () {
        closeMenu(false);
        selectType(item.dataset.type);
        focusFirstField();
      });
    });

    document.addEventListener("click", function (event) {
      if (!moreMenu.hidden && !moreMenu.contains(event.target) && !moreBtn.contains(event.target)) closeMenu(false);
    });

    // ---------- Quick field (link / text) ----------

    function quickKind() {
      if (state.type === "text") return "text";
      const detected = detect.detectType(state.quick.value);
      return detected === "email" || detected === "phone" ? detected : "link";
    }

    function renderQuick() {
      const isLink = state.type === "link";
      setText(quickLabel, isLink ? "quickLabelLink" : "quickLabelText");
      setAttr(quickInput, "placeholder", isLink ? "phLink" : "phText");
      quickInput.setAttribute("inputmode", isLink ? "url" : "text");

      const value = state.quick.value.trim();
      const detected = detect.detectType(value);

      // Inline error: a link cannot contain spaces.
      const showError = isLink && state.quick.touched && value !== "" && /\s/.test(value);
      quickError.hidden = !showError;
      if (showError) setText(quickError, "errUrlSpaces");
      quickInput.setAttribute("aria-invalid", String(showError));

      // Detection hint + action.
      detectAction.hidden = true;
      if (!value) {
        setText(detectText, "quickHint");
      } else if (isLink) {
        setText(detectText, { link: "detLink", email: "detEmail", phone: "detPhone" }[quickKind()]);
        detectAction.hidden = false;
        detectAction.dataset.target = "text";
        setText(detectAction, "useAsText");
      } else {
        setText(detectText, "detText");
        if (detected !== "text") {
          detectAction.hidden = false;
          detectAction.dataset.target = "link";
          setText(detectAction, "useAutoDetect");
        }
      }
    }

    quickInput.addEventListener("input", function () {
      ui.autoGrow(quickInput);
      state.quick.value = quickInput.value;
      const value = quickInput.value.trim();

      if (!value) {
        state.quick.auto = true;
        state.quick.touched = false;
      } else if (state.quick.auto) {
        // Follow detection: plain text goes to the Text chip, the rest to Link.
        const next = detect.detectType(value) === "text" ? "text" : "link";
        if (next !== state.type) {
          state.type = next;
          renderPicker();
        }
      }
      if (!quickError.hidden && !/\s/.test(value)) quickError.hidden = true;
      renderQuick();
      emit();
    });

    quickInput.addEventListener("blur", function () {
      state.quick.touched = true;
      renderQuick();
    });

    detectAction.addEventListener("click", function () {
      if (detectAction.dataset.target === "text") {
        state.quick.auto = false;
        selectType("text", { fromUser: false });
      } else {
        // Back to automatic detection.
        state.quick.auto = true;
        selectType("link", { fromUser: false });
      }
      quickInput.focus();
    });

    // ---------- Structured forms ----------

    function fieldDomId(type, id) {
      return "f-" + type + "-" + id;
    }

    function buildPanel(type) {
      const schema = FORMS[type];
      const panel = document.createElement("div");
      panel.className = "form-panel";
      panel.dataset.type = type;
      panel.hidden = true;

      const grid = document.createElement("div");
      grid.className = "form-grid";
      panel.appendChild(grid);

      const record = { panel: panel, inputs: {}, errors: {} };
      state.fields[type] = {};
      state.touched[type] = {};
      const required = payloads.REQUIRED[type] || [];

      schema.fields.forEach(function (field) {
        const domId = fieldDomId(type, field.id);
        const wrap = document.createElement("div");
        wrap.className = "form-field" + (field.half ? " is-half" : "") + (field.kind === "checkbox" ? " is-check" : "");

        let input;
        if (field.kind === "checkbox") {
          input = document.createElement("input");
          input.type = "checkbox";
          input.id = domId;
          input.className = "checkbox";
          const label = document.createElement("label");
          label.htmlFor = domId;
          label.className = "check-label";
          const span = document.createElement("span");
          setText(span, field.label);
          label.appendChild(input);
          label.appendChild(span);
          wrap.appendChild(label);
          state.fields[type][field.id] = false;
        } else {
          const label = document.createElement("label");
          label.className = "field-label";
          label.htmlFor = domId;
          const text = document.createElement("span");
          setText(text, field.label);
          label.appendChild(text);
          if (required.indexOf(field.id) !== -1) {
            const mark = document.createElement("span");
            mark.className = "required-mark";
            mark.setAttribute("aria-hidden", "true");
            mark.textContent = " *";
            label.appendChild(mark);
            const sr = document.createElement("span");
            sr.className = "visually-hidden";
            setText(sr, "required");
            label.appendChild(sr);
          }
          wrap.appendChild(label);

          if (field.kind === "select") {
            input = document.createElement("select");
            input.className = "field select";
            field.options.forEach(function (opt) {
              const option = document.createElement("option");
              option.value = opt[0];
              setText(option, opt[1]);
              input.appendChild(option);
            });
            input.value = field.initial;
          } else if (field.kind === "textarea") {
            input = document.createElement("textarea");
            input.className = "field textarea";
            input.rows = 2;
          } else {
            input = document.createElement("input");
            input.className = "field";
            input.type = INPUT_TYPES[field.kind];
          }
          input.id = domId;
          if (field.autocomplete) input.setAttribute("autocomplete", field.autocomplete);
          if (field.inputmode) input.setAttribute("inputmode", field.inputmode);
          if (field.placeholder) setAttr(input, "placeholder", field.placeholder);
          if (required.indexOf(field.id) !== -1) input.setAttribute("aria-required", "true");
          if (field.kind === "email" || field.kind === "url" || field.kind === "password") {
            input.setAttribute("autocapitalize", "off");
            input.setAttribute("spellcheck", "false");
          }

          if (field.kind === "password") {
            const fieldWrap = document.createElement("div");
            fieldWrap.className = "field-with-action";
            fieldWrap.appendChild(input);
            const toggle = document.createElement("button");
            toggle.type = "button";
            toggle.className = "field-action";
            toggle.setAttribute("aria-pressed", "false");
            toggle.setAttribute("aria-controls", domId);
            setText(toggle, "showPassword");
            toggle.addEventListener("click", function () {
              const show = input.type === "password";
              input.type = show ? "text" : "password";
              toggle.setAttribute("aria-pressed", String(show));
              setText(toggle, show ? "hidePassword" : "showPassword");
            });
            fieldWrap.appendChild(toggle);
            wrap.appendChild(fieldWrap);
          } else {
            wrap.appendChild(input);
          }

          const describedBy = [];
          if (field.hint) {
            const hint = document.createElement("p");
            hint.className = "field-hint";
            hint.id = domId + "-hint";
            setText(hint, field.hint);
            wrap.appendChild(hint);
            describedBy.push(hint.id);
          }
          const error = document.createElement("p");
          error.className = "field-error";
          error.id = domId + "-error";
          error.hidden = true;
          wrap.appendChild(error);
          describedBy.push(error.id);
          input.setAttribute("aria-describedby", describedBy.join(" "));
          record.errors[field.id] = error;
          state.fields[type][field.id] = field.kind === "select" ? field.initial : "";
        }

        record.inputs[field.id] = input;
        grid.appendChild(wrap);

        const eventName = field.kind === "checkbox" || field.kind === "select" ? "change" : "input";
        input.addEventListener(eventName, function () {
          if (field.kind === "textarea") ui.autoGrow(input);
          state.fields[type][field.id] = field.kind === "checkbox" ? input.checked : input.value;
          if (type === "wifi" && field.id === "security") syncWifiPassword();
          renderErrors(type, false);
          emit();
        });
        input.addEventListener("blur", function () {
          if (field.kind === "checkbox" || field.kind === "select") return;
          state.touched[type][field.id] = true;
          renderErrors(type, false);
        });
      });

      if (schema.hint) {
        const hint = document.createElement("p");
        hint.className = "field-hint form-hint";
        setText(hint, schema.hint);
        panel.appendChild(hint);
      }

      formsEl.appendChild(panel);
      panels[type] = record;
      return record;
    }

    function syncWifiPassword() {
      const record = panels.wifi;
      const open = state.fields.wifi.security === "nopass";
      record.inputs.password.disabled = open;
      record.inputs.password.closest(".form-field").classList.toggle("is-disabled", open);
    }

    /** Shows errors for touched fields. `all` marks every field as touched. */
    function renderErrors(type, all) {
      const record = panels[type];
      if (!record) return;
      const fields = state.fields[type];
      const touched = state.touched[type];
      const invalid = payloads.validate(type, fields);
      const missing = payloads.missingRequired(type, fields);

      Object.keys(record.errors).forEach(function (id) {
        if (all) touched[id] = true;
        let key = null;
        if (invalid[id] && touched[id]) key = invalid[id];
        else if (missing.indexOf(id) !== -1 && touched[id]) key = "errRequired";
        const errorEl = record.errors[id];
        errorEl.hidden = !key;
        if (key) setText(errorEl, key);
        record.inputs[id].setAttribute("aria-invalid", String(Boolean(key)));
      });
    }

    function renderPanels() {
      const quick = QUICK_TYPES.indexOf(state.type) !== -1;
      quickPanel.hidden = !quick;
      if (quick) renderQuick();
      if (!quick && !panels[state.type]) {
        buildPanel(state.type);
        if (state.type === "wifi") syncWifiPassword();
      }
      Object.keys(panels).forEach(function (type) {
        panels[type].panel.hidden = type !== state.type;
      });
    }

    function focusFirstField() {
      const record = panels[state.type];
      if (record) {
        const first = record.panel.querySelector("input, select, textarea");
        if (first) first.focus();
      } else {
        quickInput.focus();
      }
    }

    // ---------- Result ----------

    /**
     * Returns { payload, status } where status is
     * "empty" | "incomplete" | "invalid" | "ok".
     */
    function getResult() {
      if (QUICK_TYPES.indexOf(state.type) !== -1) {
        const value = state.quick.value;
        if (!value.trim()) return { payload: "", status: "empty" };
        const kind = quickKind();
        if (kind === "link" && /\s/.test(value.trim())) return { payload: "", status: "invalid" };
        return { payload: payloads.buildQuickPayload(value, kind), status: "ok" };
      }

      const fields = state.fields[state.type] || {};
      const schema = FORMS[state.type];
      const anyValue = schema.fields.some(function (f) {
        return f.kind !== "select" && f.kind !== "checkbox" && String(fields[f.id] || "").trim() !== "";
      });
      if (!anyValue) return { payload: "", status: "empty" };
      if (Object.keys(payloads.validate(state.type, fields)).length) return { payload: "", status: "invalid" };
      if (payloads.missingRequired(state.type, fields).length) return { payload: "", status: "incomplete" };
      return { payload: payloads.buildPayload(state.type, fields), status: "ok" };
    }

    /** Short, non-sensitive description for the preview's accessible name. */
    function getSummary() {
      const typeName = i18n.t(TYPE_LABELS[state.type]);
      if (QUICK_TYPES.indexOf(state.type) !== -1) return ui.truncate(state.quick.value, 80);
      const f = state.fields[state.type] || {};
      const main = { wifi: f.ssid, contact: f.name, whatsapp: f.phone, email: f.to, phone: f.phone, sms: f.phone, location: f.lat + ", " + f.lng, event: f.title }[state.type];
      return typeName + ": " + ui.truncate(main || "", 60);
    }

    /** Text used to build the default file name. Never includes passwords. */
    function getNameHint() {
      if (QUICK_TYPES.indexOf(state.type) !== -1) {
        const value = state.quick.value.trim();
        if (state.type === "link" && quickKind() === "link") {
          // Host without "www.": "https://www.example.com/a" -> "example.com".
          const match = /^(?:[a-z][a-z0-9+.-]*:\/\/)?([^/?#:]+)/i.exec(value);
          return match ? match[1].replace(/^www\./i, "") : value;
        }
        if (state.type === "link" && quickKind() === "email") return value.replace(/^mailto:/i, "").split("@")[0];
        if (state.type === "link" && quickKind() === "phone") return "phone";
        return value.split(/\s+/).slice(0, 4).join(" ");
      }
      const f = state.fields[state.type] || {};
      switch (state.type) {
        case "wifi": return "wifi " + (f.ssid || "");
        case "contact": return f.name || "contact";
        case "email": return "email " + String(f.to || "").split("@")[0];
        case "event": return f.title || "event";
        default: return state.type;
      }
    }

    function getType() {
      return state.type;
    }

    function emit() {
      onChange(getResult());
    }

    renderPicker();
    renderPanels();

    /** Puts pasted text in the quick field (switching to it if needed). */
    function pasteIntoQuick(text) {
      if (QUICK_TYPES.indexOf(state.type) === -1) selectType("link", { fromUser: false });
      quickInput.value = text;
      quickInput.dispatchEvent(new Event("input"));
      quickInput.focus();
    }

    return { getResult, getSummary, getNameHint, getType, pasteIntoQuick };
  }

  return { create, PRIMARY_TYPES, MORE_TYPES, FORMS };
});
