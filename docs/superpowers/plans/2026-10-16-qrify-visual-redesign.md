# QRify Visual Redesign Implementation Plan

> **For agentic workers:** Execute this plan inline in the existing repository; the user explicitly authorized commits to `main`. Steps use checkbox syntax.

**Goal:** Redesign QRify's generator workspace and add accurate SEO descriptions without changing the static app's behavior or Pages deployment.

**Architecture:** Keep the existing HTML/CSS/vanilla-module structure. Move appearance controls into the configuration pane, give preset buttons an accessible selected state, and refine the cohesive two-column/mobile layout; keep QR generation in the existing core and renderer.

**Tech Stack:** HTML5, CSS, vanilla JavaScript ES modules, existing Node test runner, Python Playwright/Chromium browser smoke test, GitHub CLI connector for the repository About description.

**Spec:** `docs/superpowers/specs/2026-10-16-qrify-visual-redesign.md`

## Global Constraints

- Preserve six QR types, local generation, validation, live preview, copy, PNG/SVG exports, contrast warning, and privacy behavior.
- Keep all assets local and relative; no framework, runtime dependency, backend, analytics, storage, or external font.
- Preserve light/dark appearance, keyboard accessibility, reduced-motion support, and `/QRify/` GitHub Pages compatibility.
- Keep GitHub Pages on the existing `main`/root source with HTTPS; make incremental, fast-forward commits on `main` as requested.
- Use commit author `Melvin Varghese <36334526+melvinvarghese@users.noreply.github.com>`.

## Review Focus

1. Preset `aria-pressed` can become stale after manual color edits or reset — browser-test matching preset, custom colors, and reset.
2. Moving appearance controls may alter mobile order or create overflow — test the live page at 320, 375, 768, and desktop widths.
3. An SEO title/description may be missing, duplicated, or outside the intended length — test the rendered document title and 150–160 character meta description.
4. Relocating controls could disconnect labels or disrupt exports — exercise all six accessible input modes, colors/size, copy, and both download formats.
5. Dark mode and reduced-motion support could regress while styles change — inspect computed page surfaces in light/dark and retain the existing reduced-motion rules.

---

### Task 1: Refresh the generator workspace and preset state

**Files:**
- Modify: `tests/browser_smoke.py`
- Modify: `index.html`
- Modify: `assets/css/styles.css`
- Modify: `assets/js/app.mjs`

**Interfaces:**
- The browser smoke test consumes the existing accessible labels and buttons.
- The app maintains `aria-pressed` on `.preset-button` according to the current foreground/background values; no QR-core interface changes.

- [ ] **Step 1: Write the failing browser assertions.** Expect the new hero heading `QR codes, made simple.`, the initial black-and-white preset to be pressed, Pine to become pressed when selected, and manual colors/reset to update the pressed state correctly. Add viewport overflow assertions for 320, 375, and 768 px.
- [ ] **Step 2: Run `python3 tests/browser_smoke.py` and confirm RED** because the old hero and interface have no preset selection semantics.
- [ ] **Step 3: Implement the approved layout.** In `index.html`, update the hero copy and relocate the existing size/color/preset group into the left configuration pane. Give preset buttons initial `aria-pressed="false"` states.
- [ ] **Step 4: Implement preset-state synchronization in `assets/js/app.mjs`.** Match both color values, update `aria-pressed` after preset selection, manual color changes, initialization, and reset; preserve existing generation behavior.
- [ ] **Step 5: Refine `assets/css/styles.css`.** Apply the approved tokens and shared workspace styling, retain the two-column desktop / stacked mobile order, and visibly distinguish the pressed preset while preserving focus, contrast, dark-mode, and reduced-motion rules.
- [ ] **Step 6: Run `python3 tests/browser_smoke.py`, `node --test tests/qrify-core.test.mjs`, `node --check assets/js/app.mjs`, and `git diff --check`; expect all existing modes/exports/privacy checks and new state/layout assertions to pass.** Commit as `feat: redesign QRify generator workspace` and push the fast-forward commit to `origin/main`.

### Task 2: Add search descriptions to the page, README, and repository

**Files:**
- Modify: `tests/browser_smoke.py`
- Modify: `index.html`
- Modify: `README.md`
- External setting: GitHub repository description for `melvinvarghese/QRify`

**Interfaces:**
- Page title: `QRify — Free QR Code Generator for URLs, Wi-Fi, and More`.
- Meta description: the exact 154-character value in the design specification.
- GitHub About description: the exact text in the design specification.

- [ ] **Step 1: Add failing browser assertions** for a title containing `Free QR Code Generator`, a 150–160 character description that mentions PNG/SVG, and the canonical Pages URL.
- [ ] **Step 2: Run `python3 tests/browser_smoke.py` and confirm RED** against the old title and metadata.
- [ ] **Step 3: Add the page title, meta description, canonical URL, and matching Open Graph tags** in `index.html`; update the README lead to naturally identify QRify as a free online QR code generator and describe its formats, customization, downloads, and local generation.
- [ ] **Step 4: Verify the full browser and core suites** with the command set from Task 1 and commit as `docs: optimize QRify search descriptions`; push the fast-forward commit to `origin/main`.
- [ ] **Step 5: Set the requested GitHub About description** with the enabled GitHub connector and verify the exact result using `gh repo view melvinvarghese/QRify --json description`.

### Task 3: Verify the deployed redesign

**Files:**
- No planned source changes; fix any verified regression in its owning task.

- [ ] **Step 1: Re-run** `node --test tests/qrify-core.test.mjs`, `node --check assets/js/app.mjs`, `node --check assets/js/qrify-core.mjs`, `python3 tests/browser_smoke.py`, and `git diff --check`; record the actual outcomes.
- [ ] **Step 2: Load the public HTTPS GitHub Pages URL** and verify updated title, metadata, relative assets, responsive generator, and absence of console/runtime errors without changing Pages settings.
- [ ] **Step 3: Capture one final desktop screenshot of the deployed page** and record any checks that cannot be performed.
