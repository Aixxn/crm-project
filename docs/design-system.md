# CRM and portal design system

Status: accepted design direction, 2026-10-22; migration pending. This document defines a shared foundation for the existing screens. It does not claim the current screens comply.

## Baseline and friction

The application already has Radix-based primitives in `laravel/resources/js/components/ui`, class-variance-authority variants, CSS semantic variables, and `use-appearance.tsx` with light/dark/system modes. Keep these investments.

| Evidence | Current inconsistency | Target |
| --- | --- | --- |
| `resources/css/app.css` | Semantic tokens exist, but page styling often bypasses them | One token source consumed by every surface |
| `pages/dashboard.tsx`, `listings/index.tsx` | Repeated raw lavender, gray, white and blue classes | CRM page patterns using semantic tokens |
| `pages/public/browse.tsx`, `property.tsx` | Similar but different raw colors, radii and headers | One portal layout with shared primitives |
| `pages/workflow-support.tsx` | Types, formatting, statuses and visual patterns share a page module | Independent types, formatters and shared visual modules |
| `workflow-support` status registry | Requested and most Listing statuses have no explicit mapping | Domain-aware coverage of every stored status |
| `app.css` dark sidebar tokens | Primary background and foreground use the same color | Verify each foreground/background pair in both appearances |
| Existing appearance hook | System changes apply CSS but do not notify hook subscribers | Keep rendered appearance controls synchronized with the resolved theme |

## Token model

Use **primitive → semantic → component** tokens. Keep raw values in `resources/css/app.css`; do not add a runtime token dependency or a Figma synchronization pipeline without an actual design source.

| Tier | Purpose | Examples / consumer |
| --- | --- | --- |
| Primitive | Named palette, spacing and size values | `--ds-blue-700`, `--ds-slate-950`; CSS definitions only |
| Semantic | Meaning that adapts to appearance | Existing `--background`, `--foreground`, `--primary`, `--border`, plus status pairs |
| Component | A local exception needed by a shared pattern | Table header background or shell width; reference semantic/size tokens |

Preserve the existing shadcn-style semantic names. Avoid two parallel vocabularies such as `surface-default` and `background` for the same purpose. Add an alias only for a distinct use. A page should use `bg-background`, `text-foreground`, `border-border`, `bg-card`, `text-muted-foreground`, and `bg-primary text-primary-foreground`.

| Semantic role | Light starting point | Dark starting point |
| --- | --- | --- |
| Background | slate-50 / `#f8fafc` | slate-950 / `#020617` |
| Foreground | slate-950 / `#020617` | slate-50 / `#f8fafc` |
| Card / popover | white / `#ffffff` | slate-900 / `#0f172a` |
| Card foreground | slate-950 | slate-50 |
| Muted surface | slate-100 / `#f1f5f9` | slate-800 / `#1e293b` |
| Muted foreground | slate-600 / `#475569` | slate-300 / `#cbd5e1` |
| Primary action | blue-700 / `#1d4ed8` | blue-300 / `#93c5fd` |
| Primary foreground | white | slate-950 |
| Border / input | slate-300 / `#cbd5e1` | slate-600 / `#475569` |
| Focus ring | blue-700 | blue-300 |

These are implementation starting values, not a completed contrast audit. Secondary/accent/popover/sidebar tokens must derive from the same roles. Provide matching foreground values for all states; do not reuse an accent as its own foreground. Where CSS variables reference appearance-dependent variables, use the Tailwind 4 `@theme inline` alias pattern and verify the emitted utility values.

Status roles have foreground, background, and optional border tokens for `neutral`, `info`, `warning`, `success`, and `danger`. Use slate, blue, amber, emerald, and red primitives respectively. Define both appearances. A status is a lifecycle label, not necessarily an action result: an accepted Offer is success; an Inquiry labeled Closed can be neutral.

| Domain | Status → semantic tone |
| --- | --- |
| Listing | Draft → neutral; Active → success; Under Offer → warning; Closed → success; Closed Lost → neutral |
| Inquiry | New → info; Contacted → info; Qualified → success; Converted → success; Closed → neutral |
| Viewing | Requested → warning; Scheduled → info; Completed → success; No Show → warning; Cancelled → neutral |
| Offer | Submitted → info; Accepted → success; Rejected → danger; Withdrawn → neutral |
| Task | Open → info; In Progress → warning; Done → success |

The future status presentation module resolves both domain and stored value. It must preserve the visible text, cover all enum cases, and provide a readable fallback for unknown legacy values. Status color never grants an action or determines a transition; the backend owns those rules.

## Typography, space and motion

- Keep Instrument Sans and the existing system fallback. Do not load a different page-specific font.
- Use Tailwind's 4px-based spacing scale: page padding 16/24px, section gaps 24/32px, card padding 16/24px, control gaps 8/12px. Avoid arbitrary spacing except for real content/layout constraints.
- Body and form content use 14–16px; muted metadata may use 12px with adequate contrast. Page titles use 24–30px; labels and headings keep a consistent weight hierarchy.
- Keep the current base radius `0.625rem`; use its small/medium/large derivatives instead of varying raw radii by page. Keep shadows subtle; reserve elevation for overlays and raised surfaces.
- Controls generally use 40–44px height; compact table actions can be smaller while retaining a usable hit area. Small icon glyphs do not require small buttons.
- Use brief color/opacity transitions, no essential animation, and respect `prefers-reduced-motion`. Skeletons must have a static reduced-motion state.

## Visual module ownership

| Location | Owns | Must not own |
| --- | --- | --- |
| `components/ui` | Reusable accessible primitives and stable variants | CRM authorization, queries, page-specific data |
| `components` | Shared status/empty/pagination/form/table patterns | Raw palette values or a second copy of domain state |
| `layouts` | Staff sidebar, portal header/content and authentication shells | Business mutations or duplicate publication rules |
| `pages/<domain>/_components` | Domain-specific forms and presentations | Primitives reimplemented per form |
| `types` and page-domain types | Shared transport/pagination and domain types | React rendering code |
| `lib` | Pure formatting and display helpers | Network requests or hidden writes |

When migrating `pages/workflow-support.tsx`, move behavior by responsibility and retain temporary re-exports for existing imports. Move one concern and update its callers before deleting the compatibility exports. Do not replace one mixed module with dozens of trivial files.

Keep CVA for primitive variants and `cn` for composition. Extend an existing primitive before introducing an equivalent button/input/badge. Preserve Radix focus management, keyboard interactions, labels, and ARIA attributes. Keep class names statically discoverable by Tailwind; do not build color utilities from arbitrary status strings.

## Screen patterns

The CRM and portal have distinct navigation density, but share color meaning, typography, form behavior and primitives.

| Pattern | Consistent behavior |
| --- | --- |
| CRM shell | Existing sidebar, breadcrumbs and content frame; resource links reflect capabilities |
| Portal shell | One shared header/navigation and content width; signed-in and guest states; usable small-screen navigation |
| Index | Title + primary action, labeled filters, result count, table/list, pagination; filter state stays in the URL |
| Detail | Summary + status, authorized actions, related activity grouped predictably |
| Form | Visible labels, help text, inline validation, pending submit, preserved values, success feedback |
| Destructive action | Explicit confirmation naming the record; disable during submission |
| Table | Semantic headers, readable empty state, bounded columns, horizontal overflow when necessary; do not silently hide essential values |
| Feedback | One toast convention plus persistent field errors; no toast-only validation |
| Property card | Image fallback, price, address, area units and status; only actual interactive controls appear interactive |

Use named Wayfinder routes for internal navigation. A property header's inline implementation should migrate to the shared portal header. Decorative icons do not imply a working action. Search, Sell, Concierge and other navigation labels must match actual implemented behavior; incomplete flows need explicit product handling.

## Appearance and accessibility acceptance

Keep the single appearance mechanism: initialization before paint, `.dark` selector, existing local storage/cookie preference, and light/dark/system modes. Normalize invalid stored values. System changes must update both CSS and subscribers, with cleanup where listeners are registered. Do not add a second theme provider.

Every migrated pattern is reviewed in default, hover, focus-visible, disabled, invalid, pending, loading, empty, error and success states as applicable. Verify both appearances and keyboard operation. Check representative widths at 375, 768 and 1280px, including 200% text zoom. Dialog focus returns to the trigger; icon-only actions have accessible names; field errors are linked to their inputs; asynchronous results are announced appropriately.

Text contrast target: 4.5:1 for normal text and 3:1 for large text under WCAG AA. Check interactive outlines and non-text affordances separately. Never encode status only by color. These are acceptance requirements, not a claim that the existing palette passes.

## Incremental adoption

1. Document tokens and correct shared contrast pairs; keep existing semantic names.
2. Extract the status presentation and shared formatters/types with compatibility exports.
3. Migrate one staff vertical slice: Listings index/create/detail, including validation and empty states.
4. Apply those shared patterns to customer activity and dashboard screens.
5. Consolidate portal layout/header and migrate Browse/Property/Viewing request.
6. Remove superseded literals and exports only after caller checks and visual verification.

Use the installed type/lint/format/build tools. Do not introduce Storybook, another UI library, a test runner, or a token build pipeline merely to complete this phase. Add meaningful browser interaction tests when the project adopts a browser-test harness; PHP render tests alone cannot verify visual quality.

## References

Checked 2026-10-22: [Tailwind theme variables](https://tailwindcss.com/docs/theme), [Tailwind dark mode](https://tailwindcss.com/docs/dark-mode), [WCAG minimum contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html). Values, file ownership and adoption order above are project-specific design decisions.
