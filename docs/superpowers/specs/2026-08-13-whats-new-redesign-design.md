# What's New Page Redesign — Design Spec

Date: 2026-08-13
Component: `src/app/features/whats-new/` (`WhatsNewComponent`)

## Context

The current `/whats-new` page is a marketing/landing-style page (hero → tabbed
"what this unlocks" feature showcase → roadmap grid → footer) with a moody
dark-navy gradient hero and a cool, corporate SaaS feel.

This redesign takes inspiration from:
- **willowvoice.com** — warm cream/off-white backgrounds, large editorial serif
  headlines paired with clean sans body text, generous whitespace, hand-drawn
  dotted-line squiggle decorations, soft/organic mood.
- **Mobbin references** (Attio, Linear, Cursor, Campsite "What's new" /
  changelog patterns) — dated, tag-categorized timeline entries as a more
  scannable alternative to a static card grid.

Constraint: must stay within the ADB Design System brand tokens
(`#007DB7` blue, `#8DC63F` green) and button/chip shape rules — see
`project_adb_design_system` memory. Buttons keep the system's ~6px radius
(no true pills); pill shapes are reserved for legitimate Chip usage (tab
selector, tag labels, eyebrow badge).

## Goals

1. Replace the dark, cool, corporate visual language with a warm, editorial,
   Willow-inspired one — while staying within ADB brand colors and component
   shape rules.
2. Keep the existing content structure and copy (hero → unlocks tabs →
   roadmap → footer) but reflow the roadmap grid into a dated changelog-style
   timeline (Mobbin-inspired), which is more scannable than 3-column cards.
3. Replace the empty tab-visual placeholder with a real product screenshot
   (home page), framed like a browser mockup.
4. Preserve the existing GSAP scroll-reveal choreography, retargeted at the
   new elements.

## Non-goals

- No changes to the underlying `RoadmapItem` / `tabContent` data shape beyond
  adding a `tag` label per roadmap item (for the new timeline chips).
- No per-tab visual swapping — the tab-visual mockup is a single static image
  (the home page screenshot), not one screenshot per tab.
- No changes to routing, navigation, or other pages.

## Palette & Typography

| Token | Value | Usage |
|---|---|---|
| `--wn-bg` | `#FAF7F2` (warm off-white) | Page background, hero through footer |
| `--wn-ink` | `#221F1B` (warm near-black) | Headings, primary text |
| `--wn-ink-muted` | `#6B6660` (warm gray) | Body copy, secondary text |
| `--wn-blue` | `#007DB7` (ADB primary) | Accent word, links, primary CTA, timeline dots |
| `--wn-green` | `#8DC63F` (ADB secondary) | Secondary tag chips only, used sparingly |
| `--wn-border` | `#E8E2D8` (warm hairline) | Card/section borders |

- **Headline font:** Fraunces (Google Font, variable, serif) for H1/H2 only.
  Loaded via existing app font-loading mechanism (or `@font-face` in this
  component's SCSS if the app doesn't already load it globally).
- **Body/UI font:** unchanged — existing app sans font (`var(--font, system-ui, sans-serif)`) for
  paragraphs, nav, buttons, chips.
- **Buttons:** ~6px border-radius (per ADB Design System), ADB blue for
  primary CTAs. No pill buttons.
- **Chips/pills:** fully rounded, used for the eyebrow badge, the tab
  selector, and roadmap timeline tag labels — this is the design system's
  intended pill use case.

## Section-by-section

### Hero

- Background switches from the dark navy gradient to `--wn-bg` with a soft,
  static radial wash (ADB blue at low opacity) in one corner — replaces the
  mouse-follow glow (doesn't read on light backgrounds).
- Existing grain texture kept at low opacity for tactility.
- New: a thin, low-opacity decorative SVG squiggle (dotted stroke, ADB blue)
  behind/around the headline — Willow's signature motif, kept subtle.
- Eyebrow: `DataNex 2.0` as a pill Chip (outlined, small).
- H1: same copy ("Intent to Discover"), set in Fraunces, `--wn-ink`, with the
  accent word ("Discover") in `--wn-blue`.
- Subtext: sans, `--wn-ink-muted`.
- CTA: "Open DataNex" button, ~6px radius, ADB blue, restyled for the light
  background (was translucent-white-on-dark).
- Remove `onMouseMove`/`HostListener` glow-follow logic (no longer applicable
  to a static wash).

### "What This Unlocks"

- Same 4 tabs (Discover / Connect / Reuse / Trust), same `tabContent` copy —
  no data changes.
- Tab selector restyled from plain-text list to a pill-chip segmented
  control: each tab is a small Chip, active state filled ADB blue, inactive
  outlined/neutral.
- `.wn__tab-visual` placeholder is replaced with the captured home-page
  screenshot (`public/` asset, see Implementation Notes), presented inside a
  soft rounded frame: thin border, subtle shadow, minimal top bar (three dots
  or just a rounded top edge) — same treatment as the Craft/Intercom Mobbin
  reference screenshots.
- Section heading set in Fraunces.

### Roadmap → Changelog timeline

- Replaces the 3-column `.wn__roadmap-grid` card layout with a vertical
  dated timeline:
  - A vertical connecting line down the left.
  - Each `RoadmapItem` becomes a row: quarter label + small filled dot on the
    line (left), title + description + a small tag Chip (right).
  - Tag chip label derived from each item's existing `icon` field (mapping
    below) — colored alternately ADB blue / ADB green, used sparingly.
  - The trailing "keep a lookout for more" item renders as a final
    dashed/muted row (no dot, no tag) instead of a dashed grid card.
- `RoadmapItem` interface gains one optional field: `tag?: string` (falls
  back to a derived label from `icon` if omitted — see Implementation Notes).

  | icon | tag label |
  |---|---|
  | `stack` | Assets |
  | `interact` | Interaction |
  | `window` | Experience |
  | `api` | Integration |
  | `upload` | Contribution |

- CTA "Sign in to get started" unchanged in behavior, restyled to the new
  palette (~6px radius, ADB blue).

### Footer

- Switches from the dark-navy block to the light `--wn-bg` palette: subtle
  top border (`--wn-border`) instead of the dark block boundary, `--wn-ink`
  text, `--wn-ink-muted` links, same 3-column structure (brand/tagline, About
  ADB links, Terms & Privacy links) and copyright line.

## Motion

- Keep the existing GSAP entrance (`ScrollTrigger`) choreography:
  hero staggered lines, `.wn__reveal` section reveals, roadmap-stagger — just
  retarget the roadmap stagger selector at the new timeline rows instead of
  grid cards.
- Optional (nice-to-have, not blocking): a `stroke-dashoffset` draw-on
  animation for the hero squiggle SVG on load.

## Implementation Notes

- The home-page screenshot for the tab visual was captured at 1440×900 via a
  headless Playwright run against the local dev server and saved to
  `/private/tmp/claude-501/.../scratchpad/home-screenshot.png`. Crop out the
  left sidebar nav (keep just the hero + card content area) before saving to
  `public/whats-new/home-preview.png` — the nav isn't relevant to the "what
  this unlocks" mockup and a tighter crop reads better inside the frame.
- Fraunces needs a loading strategy — check whether the app already loads
  Google Fonts globally (e.g. in `index.html`) before adding a new
  `@font-face`/`<link>`.
- All new colors ship as CSS custom properties scoped to `:host` in
  `whats-new.component.scss`, consistent with the existing `$blue`/`$dark`
  SCSS variables pattern already in the file (can coexist or replace them).

## Testing

- Visual/manual verification only (marketing page, no business logic):
  run the dev server, view `/whats-new` at desktop and the existing 960px/600px
  breakpoints, confirm tab switching, scroll-reveal animations, and the new
  timeline render correctly light-mode only (page has no dark-mode toggle).
