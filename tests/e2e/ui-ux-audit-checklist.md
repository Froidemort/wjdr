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
- [ ] Confirm no focus trap dead ends exist when tabbing through the page shell.
- [ ] Confirm all icon-only actions have a text alternative or tooltip.

## 2) Navbar Reactive States + Touch Targets

- [ ] Open `02-navbar-mobile-touch-targets.png`.
- [ ] Confirm action buttons are finger-friendly (>= 44x44px).
- [ ] If authenticated state was used: confirm notifications toggles `aria-expanded` false -> true -> false.
- [ ] Confirm notification panel has meaningful state messaging (loading/error/empty).
- [ ] Confirm mobile navigation button, menu close control, and notification actions are all easy to tap with one thumb.
- [ ] Confirm the current route is visually obvious in desktop navigation.

## 3) Forms + Submit Feedback

- [ ] Open `03-form-submit-feedback-auth-modal.png`.
- [ ] Confirm auth modal uses native `<form>` submit behavior (Enter key works).
- [ ] Confirm submit button enters disabled state during pending request.
- [ ] Confirm error feedback is shown in an alert region when request fails.
- [ ] Confirm inline validation text is readable on both mobile and desktop.
- [ ] Confirm button labels stay visible and do not wrap awkwardly at 320px width.

## 4) Character Detail Visual Tokens + Responsive Overflow

- [ ] Open `04-character-detail-mobile-overflow-audit.png` and `04-character-detail-desktop-overflow-audit.png`.
- [ ] Confirm no horizontal overflow (content stays inside viewport).
- [ ] If toast visible during run: confirm semantic content classes are used (`text-error-content` / `text-warning-content`).
- [ ] Confirm characteristic/grid layout is stable on 375px and desktop widths.
- [ ] Confirm BASE/TOTAL labels are explicit and not truncated in stat cards.
- [ ] Confirm large character sheets still allow scrolling without layout jumps after edits.

## 5) Session List, Session Detail, and Notes Refresh

- [ ] Open the session list and confirm the first load happens once, not in a visible loop.
- [ ] Open a session detail page and confirm invitations, join requests, and notes load without periodic refetching.
- [ ] Confirm realtime updates refresh the relevant section only once per event.
- [ ] Confirm leaving the tab and returning does not trigger a burst of duplicate reloads.

## 6) Character Detail Realtime + Cache Stability

- [ ] Open a character detail page and confirm repeated idle polling does not continue in the background.
- [ ] Confirm edits only reload the data that changed.
- [ ] Confirm identity/profile display changes only refetch after a deliberate profile update.
- [ ] Confirm related collections such as skills, talents, weapons, armors, and items do not flash-reload repeatedly.

## 7) Network Stability (Double Fetch Audit)

- [ ] Open `05-network-stability-route-state.png`.
- [ ] Confirm no duplicate fetch on initial list mount (when route is reachable).
- [ ] Confirm no duplicate fetch on initial detail mount (when route is reachable).
- [ ] Review test notes for auth-gated branches to know which checks were conditionally skipped.
- [ ] Confirm auth changes do not re-request the same profile data on every navigation.

## 8) Navigation, Footer, and Return Actions

- [ ] Confirm back buttons look like actions, not like passive text links.
- [ ] Confirm return buttons are at least comfortably tappable on mobile.
- [ ] Confirm footer navigation remains visible and does not collide with nearby actions.
- [ ] Confirm session access request screen exposes the back action clearly.

## 9) Baseline Diagnostic Capture

- [ ] Open `06-home-diagnostic-fullpage.png`.
- [ ] Confirm global UI consistency: spacing, contrast, typography, and component alignment.

## 10) Mobile-Specific Pass

- [ ] Test at 320px, 375px, and 430px widths.
- [ ] Confirm no horizontal scrolling on list, detail, profile, and modal views.
- [ ] Confirm drawers, popovers, and dialogs close cleanly on outside tap or Escape.
- [ ] Confirm primary actions stay above the fold where possible.
- [ ] Confirm cards, badges, and stat blocks remain readable without zooming.

## 11) Desktop-Specific Pass

- [ ] Test at 1280px and 1440px widths.
- [ ] Confirm navigation density feels balanced, not sparse.
- [ ] Confirm multi-column layouts do not over-expand content width.
- [ ] Confirm hover states, focus rings, and active states are distinguishable.
- [ ] Confirm modal widths remain comfortable and do not dominate the screen.

## Optional Manual Follow-up (Recommended)

- [ ] Re-run same spec in authenticated session to validate auth-gated checks (notifications panel, sessions list/detail, character detail toast).
- [ ] Run once with `PLAYWRIGHT_BASE_URL` against deployed preview and compare screenshots.
- [ ] Attach traces and screenshots to QA report for regression history.
- [ ] Compare the back button prominence before/after the latest pass on mobile screenshots.
