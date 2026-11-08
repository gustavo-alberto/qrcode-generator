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
   * options: { appearance, onChange(appearance) }
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

    // ---------- Reset ----------

    resetBtn.addEventListener("click", function () {
      const previous = Object.assign({}, appearance);
      update(Object.assign({}, presets.DEFAULT_APPEARANCE));
      ui.showToast({
        message: i18n.t("resetDone"),
        actionLabel: i18n.t("undo"),
        onAction: function () {
          update(previous);
          resetBtn.focus();
        }
      });
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
    refreshThumbnails(SAMPLE_DATA);

    return {
      refreshThumbnails: refreshThumbnails,
      getAppearance: function () { return Object.assign({}, appearance); }
    };
  }

  return { create };
});
