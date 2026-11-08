/**
 * Block 02 (Appearance): presets with live thumbnails, "Customize"
 * (module style, corners, colors, transparent background), "Advanced"
 * (error correction, margin) and reset with undo.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else (root.QRApp = root.QRApp || {}).appearance = api;
})(typeof self !== "undefined" ? self : this, function () {
  const THUMB_SIZE = 64;
  const SAMPLE_DATA = "https://example.com";
  const LOGO_MAX_BYTES = 2 * 1024 * 1024;
  const LOGO_TYPES = ["image/png", "image/jpeg", "image/svg+xml"];
  const LOGO_SIZES = ["small", "medium", "large"];
  const LOGO_SIZE_LABELS = { small: "logoSmall", medium: "logoMedium", large: "logoLarge" };
  const LOGO_DEFAULT_SIZE = "medium";

  /** Reads and checks a logo file. Resolves to a data URL; rejects with an i18n key. */
  function readLogoFile(file) {
    return new Promise(function (resolve, reject) {
      if (LOGO_TYPES.indexOf(file.type) === -1) return reject("errLogoType");
      if (file.size > LOGO_MAX_BYTES) return reject("errLogoSize");
      const reader = new FileReader();
      reader.onerror = function () { reject("errLogoRead"); };
      reader.onload = function () {
        // Make sure the browser can actually decode it.
        const img = new Image();
        img.onload = function () { resolve(reader.result); };
        img.onerror = function () { reject("errLogoRead"); };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  const DOT_LABELS = {
    square: "dotSquare",
    dots: "dotDots",
    rounded: "dotRounded",
    "extra-rounded": "dotExtraRounded",
    "classy-rounded": "dotClassy"
  };
  const CORNER_LABELS = { square: "cornerSquare", "extra-rounded": "cornerRounded", dot: "cornerDot" };
  const ECC_LABELS = {
    L: ["eccLow", "7%"],
    M: ["eccMedium", "15%"],
    Q: ["eccHigh", "25%"],
    H: ["eccMax", "30%"]
  };

  /**
   * deps: { i18n, ui, presets, render, QRCodeStyling }
   * options: { appearance, onChange(appearance), onLogoChange({ src, size } | null) }
   */
  function create(rootEl, deps, options) {
    const { i18n, ui, presets, render, QRCodeStyling } = deps;
    let appearance = Object.assign({}, options.appearance);
    let thumbData = SAMPLE_DATA;

    const customize = rootEl.querySelector("#customize");
    const resetBtn = rootEl.querySelector("#reset-btn");
    const transparentInput = rootEl.querySelector("#bg-transparent");

    function setText(el, key) {
      el.setAttribute("data-i18n", key);
      el.textContent = i18n.t(key);
    }

    function textButton(labelKey, subLabel) {
      return function (button) {
        const label = document.createElement("span");
        label.className = "segment-label";
        setText(label, labelKey);
        button.appendChild(label);
        if (subLabel) {
          const sub = document.createElement("span");
          sub.className = "segment-sub";
          sub.textContent = subLabel;
          button.appendChild(sub);
        }
      };
    }

    // ---------- Presets ----------

    const presetOptions = presets.PRESETS.map(function (preset) {
      return {
        value: preset.id,
        build: function (button) {
          const thumb = document.createElement("span");
          thumb.className = "preset-thumb";
          thumb.setAttribute("aria-hidden", "true");
          const label = document.createElement("span");
          label.className = "preset-label";
          setText(label, preset.label);
          button.appendChild(thumb);
          button.appendChild(label);
        }
      };
    });
    presetOptions.push({
      value: "custom",
      build: function (button) {
        const thumb = document.createElement("span");
        thumb.className = "preset-thumb is-custom";
        thumb.setAttribute("aria-hidden", "true");
        const label = document.createElement("span");
        label.className = "preset-label";
        setText(label, "presetCustom");
        button.appendChild(thumb);
        button.appendChild(label);
      }
    });

    const presetGroup = ui.createRadioGroup(rootEl.querySelector("#presets"), presetOptions, {
      itemClass: "preset",
      value: presets.matchPreset(appearance),
      onChange: function (id) {
        if (id === "custom") {
          // Custom is a state, not a style: open the controls instead.
          customize.open = true;
          presetGroup.setValue(presets.matchPreset(appearance));
          const first = customize.querySelector("[role=radio][tabindex='0']");
          if (first) first.focus();
          return;
        }
        update(presets.applyPreset(appearance, id));
      }
    });

    // ---------- Customize ----------

    const dotsGroup = ui.createRadioGroup(
      rootEl.querySelector("#dots-group"),
      presets.DOT_TYPES.map(function (type) {
        return { value: type, build: textButton(DOT_LABELS[type]) };
      }),
      { value: appearance.dotsType, onChange: function (v) { update({ dotsType: v }); } }
    );

    const cornersGroup = ui.createRadioGroup(
      rootEl.querySelector("#corners-group"),
      presets.CORNER_STYLES.map(function (style) {
        return { value: style, build: textButton(CORNER_LABELS[style]) };
      }),
      { value: appearance.cornerStyle, onChange: function (v) { update({ cornerStyle: v }); } }
    );

    function bindColor(key, prefix) {
      const picker = rootEl.querySelector("#" + prefix + "-picker");
      const hex = rootEl.querySelector("#" + prefix + "-hex");
      const error = rootEl.querySelector("#" + prefix + "-error");

      picker.addEventListener("input", function () {
        hex.value = picker.value;
        showError(false);
        update({ [key]: picker.value });
      });

      hex.addEventListener("input", function () {
        const value = presets.normalizeHex(hex.value);
        // Only apply complete values; keep the error quiet while typing.
        if (value) {
          showError(false);
          picker.value = value;
          update({ [key]: value });
        }
      });

      hex.addEventListener("blur", function () {
        const value = presets.normalizeHex(hex.value);
        if (value) hex.value = value;
        showError(!value);
      });

      function showError(show) {
        error.hidden = !show;
        hex.setAttribute("aria-invalid", String(show));
        if (show) setText(error, "errHex");
      }

      return function sync() {
        picker.value = appearance[key];
        hex.value = appearance[key];
        showError(false);
      };
    }

    const syncForeground = bindColor("foreground", "fg");
    const syncBackground = bindColor("background", "bg");

    rootEl.querySelector("#swap-colors").addEventListener("click", function () {
      update({ foreground: appearance.background, background: appearance.foreground });
    });

    transparentInput.addEventListener("change", function () {
      update({ transparent: transparentInput.checked });
    });

    // ---------- Advanced ----------

    const eccGroup = ui.createRadioGroup(
      rootEl.querySelector("#ecc-group"),
      presets.ERROR_LEVELS.map(function (level) {
        return { value: level, build: textButton(ECC_LABELS[level][0], ECC_LABELS[level][1]) };
      }),
      { value: appearance.errorCorrection, onChange: function (v) { update({ errorCorrection: v }); } }
    );

    const marginGroup = ui.createRadioGroup(
      rootEl.querySelector("#margin-group"),
      presets.MARGINS.map(function (m) {
        return {
          value: m,
          build: function (button) {
            const label = document.createElement("span");
            label.className = "segment-label mono";
            label.textContent = String(m);
            button.appendChild(label);
          }
        };
      }),
      { value: appearance.margin, onChange: function (v) { update({ margin: Number(v) }); } }
    );

    // ---------- Logo ----------
    // The logo lives only in memory (never persisted: it can be large).

    let logo = null; // { src, name, size }
    let eccBeforeLogo = null;

    const logoInput = rootEl.querySelector("#logo-input");
    const logoEmpty = rootEl.querySelector("#logo-empty");
    const logoFilled = rootEl.querySelector("#logo-filled");
    const logoThumb = rootEl.querySelector("#logo-thumb");
    const logoName = rootEl.querySelector("#logo-name");
    const logoRemove = rootEl.querySelector("#logo-remove");
    const logoSizeRow = rootEl.querySelector("#logo-size-row");
    const logoError = rootEl.querySelector("#logo-error");

    const logoSizeGroup = ui.createRadioGroup(
      rootEl.querySelector("#logo-size-group"),
      LOGO_SIZES.map(function (size) {
        return { value: size, build: textButton(LOGO_SIZE_LABELS[size]) };
      }),
      {
        value: LOGO_DEFAULT_SIZE,
        onChange: function (size) {
          if (!logo) return;
          logo.size = size;
          emitLogo();
        }
      }
    );

    function showLogoError(key) {
      logoError.hidden = !key;
      if (key) setText(logoError, key);
    }

    function renderLogo() {
      logoEmpty.hidden = Boolean(logo);
      logoFilled.hidden = !logo;
      logoSizeRow.hidden = !logo;
      if (logo) {
        logoThumb.src = logo.src;
        logoName.textContent = logo.name;
        logoName.title = logo.name;
        logoSizeGroup.setValue(logo.size);
      } else {
        logoThumb.removeAttribute("src");
      }
    }

    function emitLogo() {
      options.onLogoChange(logo ? { src: logo.src, size: logo.size } : null);
    }

    logoInput.addEventListener("change", function () {
      const file = logoInput.files && logoInput.files[0];
      logoInput.value = ""; // allow picking the same file again
      if (!file) return;
      readLogoFile(file).then(
        function (src) {
          showLogoError(null);
          logo = { src: src, name: file.name, size: logo ? logo.size : LOGO_DEFAULT_SIZE };
          renderLogo();
          emitLogo();
          // A logo hides modules: use the highest error correction.
          if (appearance.errorCorrection !== "H") {
            eccBeforeLogo = appearance.errorCorrection;
            update({ errorCorrection: "H" });
            ui.showToast({ message: i18n.t("logoEccRaised") });
          }
          logoRemove.focus();
        },
        function (key) {
          showLogoError(typeof key === "string" ? key : "errLogoRead");
        }
      );
    });

    logoRemove.addEventListener("click", function () {
      logo = null;
      renderLogo();
      emitLogo();
      // Restore the previous level unless the user changed it meanwhile.
      if (eccBeforeLogo && appearance.errorCorrection === "H") update({ errorCorrection: eccBeforeLogo });
      eccBeforeLogo = null;
      logoInput.focus();
    });

    // ---------- Reset ----------

    const resetDone = rootEl.querySelector("#reset-done");
    const resetUndo = rootEl.querySelector("#reset-undo");
    const UNDO_VISIBLE_MS = 15000;
    let undoSnapshot = null;
    let undoTimer = null;

    function hideUndo() {
      clearTimeout(undoTimer);
      undoSnapshot = null;
      resetDone.hidden = true;
    }

    resetBtn.addEventListener("click", function () {
      const previous = Object.assign({}, appearance);
      // Reset style, but keep max error correction while a logo is present.
      update(Object.assign({}, presets.DEFAULT_APPEARANCE, logo ? { errorCorrection: "H" } : {}));
      undoSnapshot = previous;
      resetDone.hidden = false;
      // The reset button is now disabled; move focus to Undo, next to it.
      resetUndo.focus();
      clearTimeout(undoTimer);
      undoTimer = setTimeout(function hideWhenIdle() {
        // Never pull the control away while the user is on it.
        if (resetDone.contains(document.activeElement)) undoTimer = setTimeout(hideWhenIdle, 3000);
        else hideUndo();
      }, UNDO_VISIBLE_MS);
    });

    resetUndo.addEventListener("click", function () {
      const snapshot = undoSnapshot;
      hideUndo();
      if (snapshot) update(snapshot);
      resetBtn.focus();
    });

    // ---------- State ----------

    function syncControls() {
      presetGroup.setValue(presets.matchPreset(appearance));
      dotsGroup.setValue(appearance.dotsType);
      cornersGroup.setValue(appearance.cornerStyle);
      eccGroup.setValue(appearance.errorCorrection);
      marginGroup.setValue(appearance.margin);
      syncForeground();
      syncBackground();
      transparentInput.checked = appearance.transparent;
      resetBtn.disabled = presets.isDefault(appearance);
    }

    function update(patch) {
      // Any further change makes the pending undo stale.
      if (undoSnapshot) {
        const hadFocus = document.activeElement === resetUndo;
        hideUndo();
        if (hadFocus) resetBtn.focus();
      }
      appearance = presets.sanitizeAppearance(Object.assign({}, appearance, patch));
      syncControls();
      renderCustomThumb();
      options.onChange(Object.assign({}, appearance));
    }

    // ---------- Thumbnails ----------

    function drawThumb(el, look) {
      el.textContent = "";
      try {
        // Thumbnails ignore margin and transparency: they compare styles.
        const qr = render.createQr(
          QRCodeStyling,
          thumbData,
          Object.assign({}, look, { margin: 0, transparent: false, errorCorrection: "L" }),
          THUMB_SIZE
        );
        qr.append(el);
      } catch (e) {
        // Too much data for a thumbnail: fall back to the sample.
        if (thumbData !== SAMPLE_DATA) {
          const saved = thumbData;
          thumbData = SAMPLE_DATA;
          drawThumb(el, look);
          thumbData = saved;
        }
      }
    }

    function renderCustomThumb() {
      const button = presetGroup.buttons[presetGroup.buttons.length - 1];
      const thumb = button.querySelector(".preset-thumb");
      const isCustom = presets.matchPreset(appearance) === "custom";
      thumb.classList.toggle("is-custom", !isCustom);
      if (isCustom) drawThumb(thumb, appearance);
      else thumb.textContent = "";
    }

    /** Redraws thumbnails with the current content (or a sample). */
    function refreshThumbnails(data) {
      const next = data || SAMPLE_DATA;
      if (next === thumbData && presetGroup.buttons[0].querySelector("svg")) {
        renderCustomThumb();
        return;
      }
      thumbData = next;
      presets.PRESETS.forEach(function (preset, i) {
        drawThumb(presetGroup.buttons[i].querySelector(".preset-thumb"), Object.assign({}, presets.DEFAULT_APPEARANCE, preset));
      });
      renderCustomThumb();
    }

    syncControls();
    renderLogo();
    refreshThumbnails(SAMPLE_DATA);

    return {
      refreshThumbnails: refreshThumbnails,
      /** Applies a partial appearance change (used by status actions). */
      apply: update,
      getAppearance: function () { return Object.assign({}, appearance); }
    };
  }

  return { create };
});
