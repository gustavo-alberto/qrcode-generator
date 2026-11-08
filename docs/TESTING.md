# Manual test checklist

Run the unit tests first:

```bash
node --test
```

Then go through this list in a desktop browser and on a phone (or the browser's
device emulation). Scan QR codes with at least two camera apps (for example the
built-in camera on iOS and Android).

## Setup and offline

- [ ] Open `index.html` directly (`file://`): the page renders with fonts and no console errors.
- [ ] DevTools → Network: no request leaves the page (only `file:`/`data:`/`blob:`).
- [ ] Layout at 360, 768, 1024 and 1440 px: no horizontal scroll.

## Content (01)

- [ ] Empty field: ghost QR, "Your QR code will appear here", Download/Copy disabled with reason.
- [ ] Type `hello` → Text chip selected; type `example.com` → Link chip, "Link detected".
- [ ] Paste an email → "Email detected", scans as a new email; "Use as text" switches to Text.
- [ ] Link with spaces → inline error after leaving the field; preview dims the last valid QR.
- [ ] 3,000 characters → overflow message; the last valid QR stays dimmed.
- [ ] Wi-Fi (WPA, special characters `; , : \ "` in name and password) → phone joins the network.
- [ ] Wi-Fi "None (open network)" disables the password field.
- [ ] Contact → phone offers to save the contact with all fields.
- [ ] WhatsApp with country code and message → opens the chat with the message.
- [ ] Email, Phone, SMS, Location, Event (via "More") → each opens the right app.
- [ ] Event with end before start → inline error.
- [ ] Switching types keeps what was typed in each form.
- [ ] DevTools → Application → Local Storage: no content, only preferences.

## Appearance (02)

- [ ] Each preset updates the preview; thumbnails show the current content.
- [ ] Changing any option selects "Custom".
- [ ] Hex field: `#0a0` becomes `#00aa00`; invalid value shows an error without breaking the QR.
- [ ] Swap colors, transparent background (checkerboard behind the preview).
- [ ] Error correction and margin change the code; every style scans.
- [ ] Reset → "Appearance reset." with Undo next to it; Undo restores everything.
- [ ] Reload: appearance is restored.

## Scan checks

- [ ] Light gray on white → low contrast warning; Fix makes it pass.
- [ ] Swap to light-on-dark → inverted warning; Invert fixes it.

## Logo

- [ ] `.txt`, a file over 2 MB, and a broken SVG are rejected with clear messages.
- [ ] Adding a logo raises error correction to Max with a notice.
- [ ] Small / Medium / Large all scan.
- [ ] Lowering error correction shows a warning with "Use Max".
- [ ] Removing the logo restores the previous error correction.

## Export (03)

- [ ] PNG and JPG at 512 / 1024 / 2048 / 4096 px have exactly that size.
- [ ] JPG with transparent background selected still has a solid background.
- [ ] SVG opens in a browser and a vector editor; the logo is embedded.
- [ ] PDF "QR only" page is the chosen size + 5 mm margin; "A4, centered" prints centered and scans.
- [ ] File name follows the content (host, network name, contact name); editing it is respected; clearing it restores the default.
- [ ] Copy pastes the image into another app (Chrome/Edge); unsupported browsers explain why.
- [ ] Mobile: the arrow next to Download opens the export sheet; Esc or tapping outside closes it.

## Keyboard and accessibility

- [ ] Whole flow with keyboard only: skip link → type → content → preset → download.
- [ ] Arrow keys move through chips, presets and segmented controls; "More" menu works with arrows and Esc.
- [ ] `Ctrl/⌘+S` downloads, `Ctrl/⌘+Shift+C` copies, `Ctrl/⌘+V` outside a field pastes into Link.
- [ ] Focus is always visible and never hidden under the header, preview or mobile action bar.
- [ ] Screen reader announces status changes ("Ready to scan", warnings, "Copied").
- [ ] OS "reduce motion" setting removes animations.
- [ ] Lighthouse (DevTools) Accessibility score ≥ 95.

## Themes and languages

- [ ] Theme follows the system by default; the toggle persists after reload.
- [ ] Language follows the browser by default; the toggle translates everything, including forms and errors.
