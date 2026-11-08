/**
 * Small DOM helpers shared by the app.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else (root.QRApp = root.QRApp || {}).ui = api;
})(typeof self !== "undefined" ? self : this, function () {
  /** Delays fn until `wait` ms have passed without another call. */
  function debounce(fn, wait) {
    let timer = null;
    return function () {
      const args = arguments;
      const ctx = this;
      clearTimeout(timer);
      timer = setTimeout(function () { fn.apply(ctx, args); }, wait);
    };
  }

  /** Grows a textarea to fit its content, up to its CSS max-height. */
  function autoGrow(textarea) {
    textarea.style.height = "auto";
    // scrollHeight excludes borders; add them back for border-box sizing.
    const borders = textarea.offsetHeight - textarea.clientHeight;
    textarea.style.height = textarea.scrollHeight + borders + "px";
  }

  /** Shortens text for labels, adding an ellipsis when cut. */
  function truncate(text, max) {
    const clean = String(text).replace(/\s+/g, " ").trim();
    return clean.length > max ? clean.slice(0, max - 1) + "…" : clean;
  }

  /**
   * Accessible single-choice group (role="radiogroup") with roving
   * tabindex and arrow-key selection.
   *
   * options: [{ value, build(button) }] — build fills the button content.
   * Returns { setValue(value), getValue(), buttons }.
   */
  function createRadioGroup(container, options, config) {
    const buttons = options.map(function (option) {
      const button = document.createElement("button");
      button.type = "button";
      button.setAttribute("role", "radio");
      button.className = config.itemClass || "segment";
      button.dataset.value = String(option.value);
      option.build(button);
      container.appendChild(button);
      return button;
    });
    let value = config.value;

    function render() {
      let tabbable = null;
      buttons.forEach(function (button, i) {
        const checked = String(options[i].value) === String(value);
        button.setAttribute("aria-checked", String(checked));
        button.tabIndex = -1;
        if (checked) tabbable = button;
      });
      (tabbable || buttons[0]).tabIndex = 0;
    }

    function choose(index, focus) {
      value = options[index].value;
      render();
      if (focus) buttons[index].focus();
      config.onChange(value);
    }

    buttons.forEach(function (button, i) {
      button.addEventListener("click", function () { choose(i, false); });
    });

    container.addEventListener("keydown", function (event) {
      const index = buttons.indexOf(document.activeElement);
      if (index === -1) return;
      const last = buttons.length - 1;
      let next = -1;
      if (event.key === "ArrowRight" || event.key === "ArrowDown") next = index === last ? 0 : index + 1;
      else if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = index === 0 ? last : index - 1;
      else if (event.key === "Home") next = 0;
      else if (event.key === "End") next = last;
      if (next === -1) return;
      event.preventDefault();
      choose(next, true);
    });

    render();

    return {
      buttons: buttons,
      getValue: function () { return value; },
      setValue: function (next) { value = next; render(); }
    };
  }

  let toastTimer = null;

  /**
   * Shows a transient message with an optional action in #toast.
   * { message, actionLabel, onAction, duration }
   */
  function showToast(options) {
    const toast = document.getElementById("toast");
    const text = toast.querySelector(".toast-text");
    const action = toast.querySelector(".toast-action");
    clearTimeout(toastTimer);

    text.textContent = options.message;
    action.hidden = !options.actionLabel;
    action.textContent = options.actionLabel || "";
    action.onclick = function () {
      hideToast();
      if (options.onAction) options.onAction();
    };
    toast.hidden = false;
    toastTimer = setTimeout(hideToast, options.duration || 5000);
  }

  function hideToast() {
    clearTimeout(toastTimer);
    const toast = document.getElementById("toast");
    if (toast) toast.hidden = true;
  }

  return { debounce, autoGrow, truncate, createRadioGroup, showToast, hideToast };
});
