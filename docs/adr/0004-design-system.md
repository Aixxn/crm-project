# ADR 0004: Share token meaning and visual patterns across CRM and portal

Date: 2026-10-22. Status: accepted; shared tokens and Phase 4 screen migrations are implemented locally, with visual acceptance pending.

## Context

Shared CSS variables and Radix-based primitives exist, but many pages use raw colors and duplicate headers/status/form patterns. A page utility module mixes transport types, formatters and visual behavior. Dark appearance does not consistently follow the intended semantic pairs.

## Decision

Keep Tailwind 4, existing primitives, CVA, `cn`, Instrument Sans and the current appearance mechanism. Use primitive → semantic → component tokens in one CSS source, retaining existing semantic names. Give every status an explicit domain-aware tone. Pages consume shared primitives and patterns while keeping domain-specific presentation local.

Keep distinct CRM and portal shells, with shared typography, spacing, interaction and accessibility rules. Migrate shared types/formatters/visual patterns out of `pages/workflow-support.tsx` incrementally with compatibility exports. See the [design-system contract](../design-system.md).

## Consequences

Theme and accessibility fixes gain leverage across screens. The migration starts with a Listing slice and then portal browse/detail rather than replacing every screen at once. There is no new component library, token compiler, theme provider or external design synchronization requirement.

## Verification

The local implementation is covered by Node behavior tests for status coverage, formatting, appearance synchronization, and semantic token contrast, plus the installed type, lint, format, and production build commands. Browser review of light/dark/system rendering, 375/768/1280px layouts, keyboard/focus behavior, and image-overlay legibility remains pending because the local preview server is unavailable. A PHP render assertion is not a visual acceptance test.
