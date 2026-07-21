# UI/UX Audit Post-Test Checklist (Playwright)

Use this checklist after running:

```bash
npx playwright test tests/e2e/ui-ux-audit.spec.ts
```

Screenshots are generated in `tests/e2e/screenshots/`.

## 1) App Shell, Semantics, Keyboard A11y

- [ ] Open `01-app-shell-and-modal-focus.png`.
- [ ] Confirm skip link appears on first `Tab` focus (not permanently visible).
- [ ] Confirm app has one clear `header`, one `main#main-content`, and a visible `nav` landmark.
- [ ] Confirm modal title is mapped by `aria-labelledby`.
- [ ] Confirm focus returns to the exact trigger after `Escape` closes modal.

## 2) Navbar Reactive States + Touch Targets

- [ ] Open `02-navbar-mobile-touch-targets.png`.
- [ ] Confirm action buttons are finger-friendly (>= 44x44px).
- [ ] If authenticated state was used: confirm notifications toggles `aria-expanded` false -> true -> false.
- [ ] Confirm notification panel has meaningful state messaging (loading/error/empty).

## 3) Forms + Submit Feedback

- [ ] Open `03-form-submit-feedback-auth-modal.png`.
- [ ] Confirm auth modal uses native `<form>` submit behavior (Enter key works).
- [ ] Confirm submit button enters disabled state during pending request.
- [ ] Confirm error feedback is shown in an alert region when request fails.

## 4) Character Detail Visual Tokens + Responsive Overflow

- [ ] Open `04-character-detail-mobile-overflow-audit.png` and `04-character-detail-desktop-overflow-audit.png`.
- [ ] Confirm no horizontal overflow (content stays inside viewport).
- [ ] If toast visible during run: confirm semantic content classes are used (`text-error-content` / `text-warning-content`).
- [ ] Confirm characteristic/grid layout is stable on 375px and desktop widths.

## 5) Network Stability (Double Fetch Audit)

- [ ] Open `05-network-stability-route-state.png`.
- [ ] Confirm no duplicate fetch on initial list mount (when route is reachable).
- [ ] Confirm no duplicate fetch on initial detail mount (when route is reachable).
- [ ] Review test notes for auth-gated branches to know which checks were conditionally skipped.

## 6) Baseline Diagnostic Capture

- [ ] Open `06-home-diagnostic-fullpage.png`.
- [ ] Confirm global UI consistency: spacing, contrast, typography, and component alignment.

## Optional Manual Follow-up (Recommended)

- [ ] Re-run same spec in authenticated session to validate auth-gated checks (notifications panel, sessions list/detail, character detail toast).
- [ ] Run once with `PLAYWRIGHT_BASE_URL` against deployed preview and compare screenshots.
- [ ] Attach traces and screenshots to QA report for regression history.
