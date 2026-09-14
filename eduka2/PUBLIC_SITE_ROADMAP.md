# EDUKA Public Website — v0.0 → v1.0 Roadmap

Status: v0.1 completed; v0.2 mostly implemented; v0.3 mobile navigation started on `website/v0.0-audit`.

## v0.0 — Audit & freeze
- Inventory every page, CTA, link, menu, modal, form, language switch, breakpoint and animation.
- Desktop/mobile screenshot baseline.
- Separate shipped features from planned/coming-soon features.
- No CRM/database changes.

Exit: every public interaction is classified as working, broken, misleading, or planned.

## v0.1 — Brand foundation
- [x] Replace oversized/wrong raster logo with canonical SVG mark + favicon asset.
- [x] Stop reusing the logo as generic feature/integration icons in the homepage feature illustrations.
- [x] Create design tokens for color, typography, radius, shadow and spacing.
- [x] Normalize header/footer branding across public pages.

Exit: one consistent EDUKA identity on /, /prices, /gamification, /vacancies and modals.

## v0.2 — Buttons, forms, menus
- [x] Create a single Demo submit flow; duplicate localStorage/API bridge handlers disabled.
- [x] Show success only after the API succeeds; show error/retry on failure.
- [x] Connect support leads/messages to the real `/api/support-requests` backend and label the UI as an automated assistant.
- [x] Replace text-scanning sales-link patch with explicit URLs/actions.
- [x] Fix payment CTA semantics so the pricing CTA opens the real demo flow instead of the gamification anchor.
- [x] Add real Privacy Policy and Terms pages and wire footer/demo-consent links to them.
- [~] Overlay behavior: backdrop/ESC/focus restore exists for demo/support; shared one-overlay-at-a-time manager still pending.
- [ ] Remove remaining duplicate attributes/dead CTAs directly from copied HTML templates.

Exit: 100% CTA/link/form test matrix passes.

## v0.3 — Navigation & responsive
- [x] Build mobile hamburger/drawer navigation instead of hiding desktop links.
- [x] Keep language, support, phone and demo CTA accessible on mobile.
- [x] Normalize header behavior through the shared public topbar runtime.
- [ ] Fix mobile pricing table, footer, modal and support panel layouts.

Exit: 320, 375, 390, 768, 1024, 1440 widths pass without missing navigation or horizontal breakage.

## v0.4 — Motion system
- Keep one animation engine only; remove competing reveal/page-transition systems.
- Hero entrance, scroll reveal, staggered cards, counter animation, hover micro-interactions.
- Smooth menu/modal/drawer open-close transitions.
- Respect prefers-reduced-motion.

Exit: animations are visible, consistent and never block navigation/interactions.

## v0.5 — Content truth & conversion
- Remove/verify unsupported social proof and placeholder partner names.
- Align homepage claims with the modules currently shipped in CRM.
- Mark unfinished modules as “Tez kunda” instead of presenting them as live.
- Align pricing copy with the real tariff source of truth.
- Rewrite hero, proof, feature and CTA hierarchy around real customer value.

Exit: no public claim promises a feature or metric that cannot be demonstrated.

## v0.6 — Public pages completion
- Rebuild Prices, Gamification and Vacancies on the same component/design system.
- Pricing CTA opens a real sales/demo/payment path.
- Gamification is either a real product page or explicitly marked coming soon.
- Vacancy application becomes a real submission flow.
- Shared header/footer/modal components are generated from one source instead of copied into every HTML file.

Exit: all public pages have the same quality and interaction standard.

## v0.7 — i18n & accessibility
- Replace exact-text DOM translation walker with stable i18n keys.
- Complete UZ/RU/EN translation coverage for dynamic content.
- Keyboard navigation, focus trap, aria-expanded/controls, visible focus states.
- Proper form errors and accessible validation.
- Contrast and semantic heading audit.

Exit: keyboard-only critical flows pass and language switches do not leave mixed-language UI.

## v0.8 — Performance
- Convert large PNGs to WebP/AVIF; generate thumbnails and responsive srcset.
- Canonical SVG logo and lightweight favicons.
- Lazy-load below-the-fold gallery images; preload only the LCP asset.
- Remove obsolete CSS/JS patch files, duplicate listeners and dead code.
- Add deterministic cache-busting/build asset versioning.

Exit targets: LCP <2.5s, CLS <0.1, INP <200ms on a normal mobile connection.

## v0.9 — SEO, legal, analytics & hardening
- Canonical, OG/Twitter metadata and Organization/SoftwareApplication schema.
- Correct robots behavior and noindex /ceo and /app.
- Real 404 instead of serving homepage with 200 for unknown public URLs.
- Privacy Policy, Terms, data-processing consent wording.
- Analytics/conversion events for demo, sales, pricing and support.
- Tighten CSP after asset cleanup.

Exit: public routes index correctly; admin/CRM routes do not; legal and analytics flows are explicit.

## v1.0 — Release QA
- End-to-end tests for every CTA, menu, form and route.
- Chrome/Safari/Firefox + iPhone/Android + desktop QA.
- No console errors, no dead links, no placeholder content.
- Lighthouse/performance/accessibility regression check.
- Production release tag and rollback point.

Exit: EDUKA public website is client-ready and every advertised core flow can be demonstrated live.
