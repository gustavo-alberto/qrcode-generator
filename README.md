# qrcode-generator

A simple, self-contained web app to create static QR codes for links, text,
Wi-Fi, contacts and more, with visual customization and export to PNG, JPG,
SVG and PDF.

- No backend, no account, no tracking: everything runs in your browser.
- No external requests at runtime: libraries and fonts are bundled in the repo.
- No build step: plain HTML, CSS and JavaScript.

> Work in progress.

## Running

Open `index.html` directly in a browser, or serve the folder with any static server:

```bash
npx serve .
```

```bash
python -m http.server 8000
```

## Project structure

```
index.html
css/        design tokens (light/dark) and styles
js/         app scripts (classic scripts, no modules, so file:// works)
vendor/     pinned third-party libraries (see vendor/README.md)
fonts/      self-hosted fonts
tests/      unit tests for pure functions (node --test)
```

## Third-party licenses

| Dependency | License |
|---|---|
| [qr-code-styling](https://github.com/kozakdenys/qr-code-styling) 1.9.2 | MIT |
| [jsPDF](https://github.com/parallax/jsPDF) 4.2.1 | MIT |
| [Space Grotesk](https://github.com/floriankarsten/space-grotesk) | SIL OFL 1.1 |
| [JetBrains Mono](https://github.com/JetBrains/JetBrainsMono) | SIL OFL 1.1 |

Details and sources in [vendor/README.md](vendor/README.md).

## License

[MIT](LICENSE)
