# QRify Visual Redesign Specification

**Status:** Approved direction; implementation in progress

## Intent and success criteria

Refresh QRify into a polished, calm QR-code utility that makes the generator the page's focus. Preserve the existing static app, all six QR types, local generation, validation, live preview, color and size controls, copy action, PNG/SVG downloads, privacy behavior, accessibility, dark mode, and root-published GitHub Pages URL. Improve the configuration/preview hierarchy, mobile layout, selected preset feedback, and search descriptions without adding dependencies, external assets, tracking, or a backend.

## Design direction

The approved direction is **Quiet Studio**: warm neutral surfaces, charcoal-green text, a restrained emerald accent, thin sage borders, disciplined spacing, and no decorative illustration. Reuse the existing QRify mark and local system sans-serif stack. Avoid oversized marketing copy, generic gradients, excessive shadows, and motion that competes with the QR code.

Core colors: page `#F4F7F3`; surface `#FFFFFF`; ink `#182721`; muted text `#58675F`; border `#DBE3DC`; accent `#0E7567`. Preserve a legible dark-mode adaptation using the existing system color-scheme preference.

## Layout and content

- Compact header: QRify mark and wordmark at left, truthful on-device privacy cue and existing source link at right.
- Focused hero: one-line-capable heading **“QR codes, made simple.”**, concise description, and a restrained privacy cue.
- Desktop generator: one coherent two-column workspace. Configuration is on the left: six-type selection, mode-specific inputs, size, colors, and color presets. Preview is on the right: crisp QR surface, live status/dimensions, PNG/SVG/copy actions, and a brief safe-sharing note.
- Mobile: stack header, hero, complete configuration, then preview/actions in a readable order; no horizontal overflow or clipped controls.
- Keep existing supporting feature, FAQ, and repository-link content, visually quieter than the generator. Keep the footer compact.
- Selected presets expose `aria-pressed` and a visible active treatment. Manually chosen colors clear the preset selection unless they exactly match one of the presets; the black-and-white preset is selected after reset.

## Functional and privacy constraints

All QR payload construction remains in the existing client-side modules and vendored local QR library. Do not change payload formats, validation, error handling, scan contrast warning, data-flow, filename behavior, Pages asset paths, deployment source, or HTTPS setting. User content remains in memory; don't add analytics, storage, remote fonts, APIs, or network requests. QR output remains high-contrast where possible, square, and surrounded by its quiet zone.

Use semantic HTML, associated labels, visible keyboard focus, status announcements, touch-friendly controls, and existing reduced-motion handling. Do not claim QRify checks link safety.

## Search metadata

Page title: `QRify — Free QR Code Generator for URLs, Wi-Fi, and More`.

Page meta description (154 characters): `Free QR code generator for websites, text, Wi-Fi, email, phone numbers, and contacts. Customize colors and size, then download PNG or SVG in your browser.`

GitHub repository description: `Free, private QR code generator for URLs, text, Wi-Fi, email, phone numbers, and contact cards. Customize colors and size, then download PNG or SVG.`

Use the canonical public Pages URL and matching Open Graph title/description/url/type. Keep the copy accurate: QR generation is confirmed to run locally; the site itself and local assets are served from GitHub Pages.

## Verification

Run the Node core suite and JavaScript syntax checks. Extend the real Playwright browser smoke test to cover the new page title/description, selected preset state and manual color behavior, all existing six-mode generation/export/privacy flows, and narrow/mobile layouts. Inspect desktop and mobile page rendering and the public Pages deployment after pushing; leave branch-based `main`/root publishing and HTTPS enforcement unchanged.
