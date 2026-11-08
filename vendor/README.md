# Vendored dependencies

Third-party files are committed to the repository so the app runs fully offline,
with no requests to external servers at runtime. Versions are pinned; update them
deliberately and record the change here.

| File | Package | Version | License | Source |
|---|---|---|---|---|
| `qr-code-styling.js` | [qr-code-styling](https://github.com/kozakdenys/qr-code-styling) | 1.9.2 | MIT ([licenses/qr-code-styling.LICENSE](licenses/qr-code-styling.LICENSE)) | `https://cdn.jsdelivr.net/npm/qr-code-styling@1.9.2/lib/qr-code-styling.js` |
| `jspdf.umd.min.js` | [jsPDF](https://github.com/parallax/jsPDF) | 4.2.1 | MIT ([licenses/jspdf.LICENSE](licenses/jspdf.LICENSE)) | `https://cdn.jsdelivr.net/npm/jspdf@4.2.1/dist/jspdf.umd.min.js` |

Fonts live in [`../fonts`](../fonts):

| File | Font | Package | Version | License |
|---|---|---|---|---|
| `space-grotesk-latin-wght-normal.woff2` | [Space Grotesk](https://github.com/floriankarsten/space-grotesk) | `@fontsource-variable/space-grotesk` | 5.3.0 | SIL OFL 1.1 ([space-grotesk.LICENSE](../fonts/space-grotesk.LICENSE)) |
| `jetbrains-mono-latin-wght-normal.woff2` | [JetBrains Mono](https://github.com/JetBrains/JetBrainsMono) | `@fontsource-variable/jetbrains-mono` | 5.3.0 | SIL OFL 1.1 ([jetbrains-mono.LICENSE](../fonts/jetbrains-mono.LICENSE)) |

## Updating

```bash
curl -fL -o vendor/qr-code-styling.js https://cdn.jsdelivr.net/npm/qr-code-styling@<version>/lib/qr-code-styling.js
curl -fL -o vendor/jspdf.umd.min.js https://cdn.jsdelivr.net/npm/jspdf@<version>/dist/jspdf.umd.min.js
```

After updating, re-check the API notes in the code and run the manual test checklist.
