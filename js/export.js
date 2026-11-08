/**
 * Export: file generation (PNG, JPG, SVG, PDF), file names, clipboard,
 * and the export panel UI (inline on desktop, bottom sheet on mobile).
 *
 * Pure helpers (slugify, buildFileName, sanitizeExportPrefs, pdfLayout,
 * pdfPixels) have no DOM access and are unit-tested.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else (root.QRApp = root.QRApp || {}).exporter = api;
})(typeof self !== "undefined" ? self : this, function () {
  const FORMATS = ["png", "svg", "pdf", "jpg"];
  const SIZES = [512, 1024, 2048, 4096];
  const PDF_SIZES_CM = [3, 5, 8, 10];
  const PDF_PAGES = ["qr", "a4"];
  const PDF_DPI = 300;
  const PDF_MIN_PX = 1024;
  const PDF_PAGE_PADDING_MM = 5;
  const SVG_SIZE = 1024;
  const MAX_NAME = 40;

  const DEFAULT_EXPORT = Object.freeze({ format: "png", size: 1024, pdfSize: 5, pdfPage: "qr" });

  const MIME = { png: "image/png", jpg: "image/jpeg", svg: "image/svg+xml", pdf: "application/pdf" };

  // ---------- Pure helpers ----------

  /** ASCII, lowercase, dash-separated, at most MAX_NAME characters. */
  function slugify(text) {
    return String(text == null ? "" : text)
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, MAX_NAME)
      .replace(/-+$/g, "");
  }

  /** "qr-<slug>" from a hint, or "qrcode" when the hint has no usable text. */
  function buildFileName(hint) {
    const slug = slugify(hint);
    return slug ? "qr-" + slug : "qrcode";
  }

  /** Cleans a user-typed base name; falls back to `fallback`. */
  function cleanFileName(name, fallback) {
    const cleaned = String(name == null ? "" : name)
      .replace(/\.(png|jpe?g|svg|pdf)$/i, "")
      .replace(/[\\/:*?"<>|\u0000-\u001f]+/g, "-")
      .trim()
      .slice(0, 80);
    return cleaned || fallback;
  }

  function sanitizeExportPrefs(input) {
    const src = input && typeof input === "object" ? input : {};
    return {
      format: FORMATS.indexOf(src.format) !== -1 ? src.format : DEFAULT_EXPORT.format,
      size: SIZES.indexOf(src.size) !== -1 ? src.size : DEFAULT_EXPORT.size,
      pdfSize: PDF_SIZES_CM.indexOf(src.pdfSize) !== -1 ? src.pdfSize : DEFAULT_EXPORT.pdfSize,
      pdfPage: PDF_PAGES.indexOf(src.pdfPage) !== -1 ? src.pdfPage : DEFAULT_EXPORT.pdfPage
    };
  }

  /** Raster size for a PDF QR of `cm` centimeters at PDF_DPI. */
  function pdfPixels(cm) {
    return Math.max(PDF_MIN_PX, Math.round((cm / 2.54) * PDF_DPI));
  }

  /** Page format (mm) and QR position/size (mm) for a PDF. */
  function pdfLayout(cm, page) {
    const size = cm * 10;
    if (page === "a4") {
      return { format: "a4", x: (210 - size) / 2, y: (297 - size) / 2, size: size };
    }
    const side = size + 2 * PDF_PAGE_PADDING_MM;
    return { format: [side, side], x: PDF_PAGE_PADDING_MM, y: PDF_PAGE_PADDING_MM, size: size };
  }

  // ---------- File generation (browser) ----------

  function blobToDataUrl(blob) {
    return new Promise(function (resolve, reject) {
      const reader = new FileReader();
      reader.onload = function () { resolve(reader.result); };
      reader.onerror = function () { reject(reader.error); };
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Generates the file as a Blob.
   * deps: { QRCodeStyling, jsPDF, render }
   */
  async function generate(deps, payload, appearance, prefs) {
    const createQr = deps.render.createQr;

    if (prefs.format === "svg") {
      return createQr(deps.QRCodeStyling, payload, appearance, SVG_SIZE, "svg").getRawData("svg");
    }

    if (prefs.format === "jpg") {
      // JPEG has no alpha channel: always export a solid background.
      const solid = Object.assign({}, appearance, { transparent: false });
      return createQr(deps.QRCodeStyling, payload, solid, prefs.size, "canvas").getRawData("jpeg");
    }

    if (prefs.format === "pdf") {
      const px = pdfPixels(prefs.pdfSize);
      const png = await createQr(deps.QRCodeStyling, payload, appearance, px, "canvas").getRawData("png");
      const layout = pdfLayout(prefs.pdfSize, prefs.pdfPage);
      const doc = new deps.jsPDF({ unit: "mm", format: layout.format, compress: true });
      doc.addImage(await blobToDataUrl(png), "PNG", layout.x, layout.y, layout.size, layout.size);
      return doc.output("blob");
    }

    return createQr(deps.QRCodeStyling, payload, appearance, prefs.size, "canvas").getRawData("png");
  }

  function downloadBlob(blob, fileName) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 10000);
  }

  function canCopyImage() {
    return Boolean(
      typeof window !== "undefined" &&
      window.isSecureContext &&
      window.ClipboardItem &&
      navigator.clipboard &&
      typeof navigator.clipboard.write === "function"
    );
  }

  /**
   * Writes a PNG to the clipboard. Takes a Promise<Blob> and must be called
   * before any await in the click handler: Safari only allows clipboard
   * writes during the user gesture, and accepts a pending blob.
   */
  function copyPng(blobPromise) {
    return navigator.clipboard.write([new window.ClipboardItem({ "image/png": blobPromise })]);
  }

  // ---------- Panel UI ----------

  /**
   * Mounts the export panel.
   * deps: { i18n, ui, render, QRCodeStyling, jsPDF }
   * options: { prefs, getExportable() -> { payload, appearance, nameHint } | null, onPrefsChange(prefs) }
   */
  function createPanel(deps, options) {
    const { i18n, ui } = deps;
    let prefs = sanitizeExportPrefs(options.prefs);
    let customName = null; // set once the user edits the file name
    let busy = false;
    const copySupported = canCopyImage();

    const panel = document.getElementById("export-panel");
    const inlineHost = document.getElementById("export-body");
    const sheet = document.getElementById("export-sheet");
    const sheetHost = document.getElementById("export-sheet-body");
    const sizeRow = panel.querySelector("#size-row");
    const sizeNote = panel.querySelector("#size-note");
    const pdfRows = panel.querySelector("#pdf-rows");
    const nameInput = panel.querySelector("#file-name");
    const extLabel = panel.querySelector("#file-ext");
    const downloadBtn = panel.querySelector("#download-btn");
    const copyBtn = panel.querySelector("#copy-btn");
    const reason = panel.querySelector("#export-reason");
    const live = panel.querySelector("#export-live");
    const barDownload = document.getElementById("bar-download");
    const barOptions = document.getElementById("bar-options");
    const barCopy = document.getElementById("bar-copy");

    function textButton(text) {
      return function (button) {
        const label = document.createElement("span");
        label.className = "segment-label mono";
        label.textContent = text;
        button.appendChild(label);
      };
    }

    function i18nButton(key) {
      return function (button) {
        const label = document.createElement("span");
        label.className = "segment-label";
        label.setAttribute("data-i18n", key);
        label.textContent = i18n.t(key);
        button.appendChild(label);
      };
    }

    function setPrefs(patch) {
      prefs = sanitizeExportPrefs(Object.assign({}, prefs, patch));
      options.onPrefsChange(Object.assign({}, prefs));
      refresh();
    }

    const formatGroup = ui.createRadioGroup(
      panel.querySelector("#format-group"),
      FORMATS.map(function (f) { return { value: f, build: textButton(f.toUpperCase()) }; }),
      { value: prefs.format, onChange: function (v) { setPrefs({ format: v }); } }
    );
    ui.createRadioGroup(
      panel.querySelector("#size-group"),
      SIZES.map(function (s) { return { value: s, build: textButton(String(s)) }; }),
      { value: prefs.size, onChange: function (v) { setPrefs({ size: Number(v) }); } }
    );
    ui.createRadioGroup(
      panel.querySelector("#pdf-size-group"),
      PDF_SIZES_CM.map(function (cm) { return { value: cm, build: textButton(cm + " cm") }; }),
      { value: prefs.pdfSize, onChange: function (v) { setPrefs({ pdfSize: Number(v) }); } }
    );
    ui.createRadioGroup(
      panel.querySelector("#pdf-page-group"),
      [
        { value: "qr", build: i18nButton("pdfPageQr") },
        { value: "a4", build: i18nButton("pdfPageA4") }
      ],
      { value: prefs.pdfPage, onChange: function (v) { setPrefs({ pdfPage: v }); } }
    );

    function extension() {
      return "." + prefs.format;
    }

    function defaultName() {
      const exportable = options.getExportable();
      return buildFileName(exportable ? exportable.nameHint : "");
    }

    function fileName() {
      return cleanFileName(customName, defaultName()) + extension();
    }

    function downloadLabel() {
      const format = prefs.format.toUpperCase();
      if (prefs.format === "svg") return i18n.t("downloadFormat", { format: format });
      if (prefs.format === "pdf") return i18n.t("downloadFormatSize", { format: format, size: prefs.pdfSize + " cm" });
      return i18n.t("downloadFormatSize", { format: format, size: prefs.size + " px" });
    }

    /** Re-renders labels and enabled state. Call when content or prefs change. */
    function refresh() {
      const isPdf = prefs.format === "pdf";
      const isSvg = prefs.format === "svg";
      formatGroup.setValue(prefs.format);
      sizeRow.hidden = isPdf;
      pdfRows.hidden = !isPdf;
      panel.querySelectorAll("#size-group [role=radio]").forEach(function (b) { b.disabled = isSvg; });
      sizeNote.hidden = !isSvg;

      extLabel.textContent = extension();
      if (customName === null) nameInput.value = defaultName();
      nameInput.placeholder = defaultName();

      const ready = Boolean(options.getExportable());
      const label = busy ? i18n.t("generating") : downloadLabel();
      downloadBtn.textContent = label;
      barDownload.textContent = busy ? i18n.t("generating") : i18n.t("downloadFormat", { format: prefs.format.toUpperCase() });

      [downloadBtn, barDownload].forEach(function (b) {
        b.disabled = !ready || busy;
        b.setAttribute("aria-busy", String(busy));
      });
      [copyBtn, barCopy].forEach(function (b) {
        b.disabled = !ready || busy || !copySupported;
        b.title = copySupported ? "" : i18n.t("copyUnsupported");
      });

      reason.hidden = ready;
      if (!ready) reason.textContent = i18n.t("exportDisabled");
      else if (!copySupported) {
        reason.hidden = false;
        reason.textContent = i18n.t("copyUnsupported");
      }
    }

    nameInput.addEventListener("input", function () {
      customName = nameInput.value.trim() === "" ? null : nameInput.value;
    });
    nameInput.addEventListener("blur", function () {
      if (customName !== null) nameInput.value = cleanFileName(customName, defaultName());
      if (customName === null) nameInput.value = defaultName();
    });

    async function withBusy(task, failKey) {
      if (busy) return;
      const exportable = options.getExportable();
      if (!exportable) {
        // Reached via keyboard shortcut while there is nothing to export.
        ui.showToast({ message: i18n.t("exportDisabled") });
        return;
      }
      busy = true;
      refresh();
      try {
        await task(exportable);
      } catch (error) {
        console.error(error);
        ui.showToast({ message: i18n.t(failKey || "exportFailed") });
      } finally {
        busy = false;
        refresh();
      }
    }

    function download() {
      return withBusy(async function (exportable) {
        const blob = await generate(deps, exportable.payload, exportable.appearance, prefs);
        const name = fileName();
        downloadBlob(blob, name);
        live.textContent = i18n.t("downloaded", { name: name });
      });
    }

    function copy() {
      return withBusy(async function (exportable) {
        // Always copy a PNG at the selected raster size. No await before
        // copyPng: the clipboard write must start inside the click.
        const blobPromise = generate(deps, exportable.payload, exportable.appearance, Object.assign({}, prefs, { format: "png" }));
        await copyPng(blobPromise);
        live.textContent = i18n.t("copied");
        [copyBtn, barCopy].forEach(function (b) {
          b.classList.add("is-done");
          b.textContent = "✓ " + i18n.t("copied");
        });
        setTimeout(function () {
          [copyBtn, barCopy].forEach(function (b) {
            b.classList.remove("is-done");
            b.textContent = i18n.t("copy");
          });
        }, 2000);
      }, "copyFailed");
    }

    downloadBtn.addEventListener("click", download);
    barDownload.addEventListener("click", download);
    copyBtn.addEventListener("click", copy);
    barCopy.addEventListener("click", copy);

    // ---------- Mobile bottom sheet ----------

    // The same panel moves between the inline block and the sheet, so
    // there is only one set of controls and one source of state.
    barOptions.addEventListener("click", function () {
      sheetHost.appendChild(panel);
      sheet.showModal();
    });

    sheet.addEventListener("close", function () {
      inlineHost.appendChild(panel);
      barOptions.focus();
    });

    sheet.addEventListener("click", function (event) {
      // Click on the backdrop (outside the sheet content) closes it.
      if (event.target === sheet) sheet.close();
    });

    sheet.querySelector("#sheet-close").addEventListener("click", function () { sheet.close(); });

    refresh();

    return { refresh: refresh, download: download, copy: copy };
  }

  return {
    FORMATS,
    SIZES,
    PDF_SIZES_CM,
    PDF_PAGES,
    DEFAULT_EXPORT,
    MIME,
    slugify,
    buildFileName,
    cleanFileName,
    sanitizeExportPrefs,
    pdfPixels,
    pdfLayout,
    generate,
    createPanel
  };
});
