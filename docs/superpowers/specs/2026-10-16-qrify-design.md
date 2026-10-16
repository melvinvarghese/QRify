# QRify Design Specification

**Status:** Design basis for implementation

## Intent and success criteria

QRify is a free, privacy-first QR generator for people who need to create and download readable QR codes without sending content to a service. Success means a responsive static site hosted at `https://melvinvarghese.github.io/QRify/` that can encode URLs, text, email, phone, Wi-Fi, and vCard contacts; customize and download PNG/SVG; and operate without analytics, backend calls, accounts, or paid services.

The existing repository is a clean public `main` branch containing only a placeholder README. GitHub Pages is already enabled from `main`/root with HTTPS enforcement. Preserve the existing repository, Pages URL, and publishing source; deploy by pushing to `main` rather than creating another repository or changing the source.

## Constraints and non-goals

- Use HTML5, CSS3, and vanilla JavaScript; no framework, backend, database, build pipeline, paid service, analytics, advertising, or tracker.
- All user content remains in browser memory and is never sent to an external service or saved to local storage.
- Use relative asset paths so the project works below `/QRify/`.
- QRify generates a code; it is not a QR scanner, URL reputation service, or guarantee that encoded destinations are safe.
- Do not open a user-entered URL or interpret entered content as HTML.

## Architecture and data flow

The root `index.html` loads local CSS, app ES modules, and vendored QR scripts. A pure `qrify-core.mjs` module validates and formats payloads; `app.mjs` owns form state, debounced generation, rendering, accessibility status, and browser actions. The vendored QR library creates the QR matrix. A local canvas renderer produces the preview and PNG; an SVG renderer produces a color-matched SVG download. No QR payload is transmitted or persisted.

The initially considered `qrcode@1.5.4` package does not include the precompiled browser bundle described by its README in its published npm archive. To preserve a no-build, no-CDN app, use `qrcode-generator@2.0.4` instead. Its MIT-licensed standalone distribution is about 56.7 KB, its UTF-8 helper is about 0.8 KB, and its documented APIs provide QR creation, matrix access, SVG output, and 2D canvas rendering. Vendor the needed scripts and retain their MIT attribution/license. This does not change the approved static-app architecture.

## Product behavior

- Modes: URL, plain text, email, phone, Wi-Fi, and vCard.
- URL mode accepts HTTP(S) URLs and adds `https://` when a scheme is omitted; non-HTTP(S) schemes are rejected. Plain-text mode preserves the entered content, except whitespace-only input is invalid.
- Email accepts an email address or `mailto:` value; phone accepts a phone number or `tel:` value. Inputs are validated and converted to the appropriate URI where needed.
- Wi-Fi emits the standard `WIFI:` payload, escaping reserved field characters and supporting WPA, WEP, and open networks.
- vCard emits vCard 3.0 fields for name, phone, email, and organization, with text escaping.
- A valid, non-empty payload updates the preview after a short debounce. Invalid input clears/disables exports and presents a useful message. QR capacity/rendering errors are reported without logging payload content.
- Defaults are black on white, medium error correction, and a 256 px output. Users can select output size and colors, choose curated color presets, and receive a non-blocking contrast warning when the foreground/background ratio is low.
- Provide PNG and SVG downloads with a meaningful default filename (`qrify-code` plus the chosen extension), copy-payload, and clear/reset controls. Each action reports success or failure; clipboard use relies on the browser Clipboard API.
- The page explains that a code contains exactly the entered information, that anyone who scans it may read that information, and that users should verify content before sharing. It must not suggest that QRify checks destination safety.

## Interface and accessibility

The page has a compact navigation/header and QRify identity, the hero “Your QR. Your Privacy.”, explanatory privacy copy, a responsive generator form and prominent preview/actions, a short feature section, a concise FAQ, and a footer linking to this repository. Use a distinctive restrained accent, system typography, subtle borders, and a polished empty preview state. Support system light/dark preference through CSS without saving user content or settings. Layout adapts for mobile, tablet, and desktop. Use semantic landmarks, visible keyboard focus, associated labels, status/error live regions, keyboard-operable controls, and reduced-motion-aware transitions.

User input is untrusted. Render it only as text; construct QR payloads and SVG using escaped/validated values and QR matrix data, never by injecting user strings into HTML. Do not automatically navigate to a URL.

## GitHub Pages, documentation, and licensing

- Keep a valid `index.html` at repository root and all resources relative.
- Add a `.gitignore`, project `LICENSE` (MIT is appropriate; no existing license conflicts), and `.nojekyll`. Preserve the existing branch-based `main`/root Pages source; updates to `main` publish without a build step or deployment workflow.
- Do not change the repository’s Pages source. Verify that the existing HTTPS-enforced URL serves the new site after pushing to `main`.
- README must document features, privacy/data handling, setup, branch-based Pages deployment, project layout, QR library/version/license attribution, limitations, contribution steps, project license, and the live demo link. Add a screenshot only if a real screenshot can be captured.

## Verification

Use the built-in Node test runner for payload construction, escaping, validation, color/contrast logic, and SVG serialization where isolated from the DOM. Run JavaScript syntax checks. Where browser automation is available, test every payload mode, live preview, color/size settings, PNG/SVG downloads, empty/invalid input, keyboard-visible states, and mobile/desktop layouts. Verify the app and local vendor assets load from the `/QRify/` base path; inspect browser console/network behavior to ensure no user content leaves the page. Attempt a QR-reader scan only if an appropriate scanner is available. Report any unavailable checks accurately.

## Planned file boundaries

- `index.html`: static semantic page and relative script/style references.
- `assets/css/styles.css`: responsive visual system, themes, and focus/motion behavior.
- `assets/js/qrify-core.mjs`: payload builders, validation, escaping, color/contrast and deterministic SVG logic.
- `assets/js/app.mjs`: DOM interactions, preview, clipboard, downloads, status messages, and reset.
- `assets/vendor/qrcode.js`, `assets/vendor/qrcode_UTF8.js`, and `assets/vendor/LICENSE-qrcode-generator`: vendored QR implementation and attribution.
- `tests/qrify-core.test.mjs`: real unit tests using Node’s built-in test runner.
- `.nojekyll`, `.gitignore`, `LICENSE`, and `README.md`: static hosting support, hygiene, and user documentation.
