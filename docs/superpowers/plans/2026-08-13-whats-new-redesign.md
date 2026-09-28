# What's New Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign `/whats-new` (`WhatsNewComponent`) from its current dark-navy corporate-SaaS look into a warm, editorial, Willow-inspired page — while staying inside ADB's brand colors (`#007DB7` blue, `#8DC63F` green) and button-shape rules — and turn the static roadmap grid into a dated changelog-style timeline.

**Architecture:** Single-component visual redesign. No new components, no routing changes, no new dependencies. All work happens in `src/app/features/whats-new/` (template, styles, and a small amount of component-class cleanup) plus one shared font asset added to `src/styles.scss` / `public/fonts/`, and one new static image in `public/whats-new/`.

**Tech Stack:** Angular 22 standalone component, SCSS, GSAP + ScrollTrigger (already a dependency, already wired up in this component), Vitest + Angular `TestBed` for the two logic-bearing behaviors (tab switching, roadmap data shape).

## Global Constraints

- Brand colors: ADB Blue `#007DB7` (primary accent), ADB Green `#8DC63F` (secondary/sparingly). No other blues or greens.
- Buttons keep the ADB Design System's ~6px border-radius — **no pill buttons**. Pill shapes are reserved for legitimate Chip usage (tab selector, eyebrow badge, tag labels).
- Body/UI text keeps the app's existing font (`var(--font)` → `'Ideal Sans', 'Helvetica Neue', Arial, sans-serif`, defined in `src/styles.scss:83`). Only H1/H2/tab-title headings switch to the new serif.
- Fonts are self-hosted under `public/fonts/` via `@font-face` in `src/styles.scss` — this codebase does not load fonts from a CDN (see the existing Ideal Sans block at `src/styles.scss:11-52`), so the new serif follows the same pattern.
- No changes to `RoadmapItem`/`tabContent` copy content — only the `RoadmapItem` shape gains a `tag` (and, for one item, a `tagColor`) field; the `icon` field is dropped since tag chips replace the icon glyphs in the new timeline (see Task 5).
- Page is light-mode only (no dark-mode toggle exists on this page today — not introducing one).

---

### Task 1: Self-host the Fraunces variable font

**Files:**
- Create: `public/fonts/Fraunces-Variable.woff2`
- Modify: `src/styles.scss:52` (insert new `@font-face` block right after the existing Ideal Sans block, before the `/* CSS Custom Properties` comment)

**Interfaces:**
- Produces: font-family `'Fraunces'`, usable anywhere in the app as `font-family: 'Fraunces', Georgia, serif;`, weight range 300–700.

- [ ] **Step 1: Download the variable font file**

```bash
curl -sS --max-time 20 -o public/fonts/Fraunces-Variable.woff2 \
  "https://fonts.gstatic.com/s/fraunces/v38/6NUu8FyLNQOQZAnv9bYEvDiIdE9Ea92uemAk_WBq8U_9v0c2Wa0K7iN7hzFUPJH58nib14c7qv8oRcTn.woff2"
```

- [ ] **Step 2: Verify the download**

Run: `file public/fonts/Fraunces-Variable.woff2 && ls -la public/fonts/Fraunces-Variable.woff2`
Expected: reports a `Web Open Font Format` (or similar binary) file, non-zero size (~36KB).

- [ ] **Step 3: Add the `@font-face` declaration**

Insert immediately after the existing Ideal Sans `@font-face` block (after `src/styles.scss:52`, before the `/* ── CSS Custom Properties` comment):

```scss
/* ── Fraunces @font-face (variable, self-hosted) ─────────────────────────── */
@font-face {
  font-family: 'Fraunces';
  src: url('/fonts/Fraunces-Variable.woff2') format('woff2');
  font-weight: 300 700;
  font-style: normal;
  font-display: swap;
}
```

- [ ] **Step 4: Confirm the app still builds**

Run: `npm run build`
Expected: build succeeds with no new errors/warnings related to `styles.scss`.

- [ ] **Step 5: Commit**

```bash
git add public/fonts/Fraunces-Variable.woff2 src/styles.scss
git commit -m "feat: self-host Fraunces variable font for editorial headlines"
```

---

### Task 2: Add the cropped home-page mockup image

**Files:**
- Create: `public/whats-new/home-preview.png`

**Interfaces:**
- Produces: a static image at `/whats-new/home-preview.png`, served from `public/`, used by Task 4's tab-visual frame.

- [ ] **Step 1: Capture the home page**

With the dev server running (`npm start`, default `http://localhost:4200`), capture a screenshot of `/` (the home page) at a 1440×900 viewport. If Playwright isn't already available in the project, install it as a one-off dev dependency for this step only (or use whatever headless-browser tooling is already set up in the repo/CI):

```bash
npm install --no-save playwright
npx playwright install chromium
node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:4200/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/tmp/home-full.png' });
  await browser.close();
})();
"
```

- [ ] **Step 2: Crop out the left sidebar nav**

The captured screenshot includes the app's left icon sidebar (~56px wide) — crop it out so the mockup shows just the hero + prompt bar + card content, since the sidebar isn't relevant to the "what this unlocks" preview. Use any image tool available (e.g. `sips` on macOS, or Playwright's `clip` option re-run with `clip: { x: 56, y: 0, width: 1384, height: 900 }`):

```bash
sips -c 900 1384 --cropOffset 0 56 /tmp/home-full.png --out public/whats-new/home-preview.png
```

(If `sips` crop-offset ordering differs on the runner, re-crop with the Playwright `clip` option instead — the goal is simply: full width minus the 56px sidebar, full height, sidebar edge removed.)

- [ ] **Step 3: Verify the asset**

Run: `file public/whats-new/home-preview.png`
Expected: reports a valid PNG image, roughly 1384×900 (or close, depending on crop tool rounding).

- [ ] **Step 4: Commit**

```bash
git add public/whats-new/home-preview.png
git commit -m "feat: add cropped home-page mockup for whats-new tab visual"
```

---

### Task 3: Redesign the hero section

**Files:**
- Modify: `src/app/features/whats-new/whats-new.component.ts` (remove mouse-follow glow logic)
- Modify: `src/app/features/whats-new/whats-new.component.html:1-18` (hero markup)
- Modify: `src/app/features/whats-new/whats-new.component.scss:1-128` (`:host` block + entire Hero section)

**Interfaces:**
- Consumes: nothing from other tasks.
- Produces: CSS custom properties on `:host` — `--wn-bg`, `--wn-ink`, `--wn-ink-muted`, `--wn-blue`, `--wn-green`, `--wn-border`, `--wn-serif` — that every later task (4, 5, 6) reuses. Tasks 4–6 must use these exact variable names rather than introducing new color literals.

- [ ] **Step 1: Remove the mouse-follow glow logic from the component class**

In `whats-new.component.ts`, remove the `HostListener` import, the `onMouseMove` method, and the `glowEl`/`heroEl` private fields — they drove a dark-background mouse-follow radial glow that doesn't apply to the new static light hero. Also remove the two lines in `ngAfterViewInit` that assign `this.glowEl`/`this.heroEl`.

Before:
```typescript
import {
  Component, ChangeDetectionStrategy, AfterViewInit, OnDestroy,
  ElementRef, HostListener, inject, signal,
} from '@angular/core';
```
```typescript
  private glowEl: HTMLElement | null = null;
  private heroEl: HTMLElement | null = null;

  @HostListener('mousemove', ['$event'])
  onMouseMove(e: MouseEvent): void {
    if (!this.glowEl || !this.heroEl) return;
    const rect = this.heroEl.getBoundingClientRect();
    if (e.clientY < rect.top || e.clientY > rect.bottom) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    this.glowEl.style.transform = `translate(${x - 350}px, ${y - 350}px)`;
  }

  ngAfterViewInit(): void {
    const host = this.el.nativeElement;
    this.glowEl  = host.querySelector('.wn__hero-glow');
    this.heroEl  = host.querySelector('.wn__hero');

    ScrollTrigger.defaults({ scroller: host });
```

After:
```typescript
import {
  Component, ChangeDetectionStrategy, AfterViewInit, OnDestroy,
  ElementRef, inject, signal,
} from '@angular/core';
```
```typescript
  ngAfterViewInit(): void {
    const host = this.el.nativeElement;

    ScrollTrigger.defaults({ scroller: host });
```

- [ ] **Step 2: Fix the dead hero entrance animation selectors**

A few lines below, in the same `ngAfterViewInit`, the hero entrance stagger references two classes that don't exist anywhere in this template — `.wn__hero-eyebrow` (the badge's real class is `.wn__hero-badge`) and `.wn__screenshot-frame` (no such element exists on this page). GSAP silently skips selectors that match nothing, so today the badge and CTA never animate in with the rest of the hero — fix it while this method is already being edited:

Before:
```typescript
    // Hero entrance — staggered lines
    gsap.from(['.wn__hero-eyebrow', '.wn__hero-h1', '.wn__hero-sub', '.wn__hero-cta', '.wn__screenshot-frame'], {
      y: 36, opacity: 0, duration: 0.9, stagger: 0.11, ease: 'power3.out', delay: 0.15,
    });
```

After:
```typescript
    // Hero entrance — staggered lines
    gsap.from(['.wn__hero-badge', '.wn__hero-h1', '.wn__hero-sub', '.wn__hero-cta'], {
      y: 36, opacity: 0, duration: 0.9, stagger: 0.11, ease: 'power3.out', delay: 0.15,
    });
```

- [ ] **Step 3: Replace the hero template markup**

Replace `whats-new.component.html:1-18`:

```html
<div class="wn">

  <!-- ── Hero ───────────────────────────────────────────────────────────── -->
  <section class="wn__hero">
    <div class="wn__hero-glow"></div>
    <div class="wn__grain"></div>
    <div class="wn__hero-content">
      <span class="wn__hero-badge">DataNex 2.0</span>
      <h1 class="wn__hero-h1">
        Intent to<br><span class="wn__hero-accent">Discover</span>
      </h1>
      <p class="wn__hero-sub">
        Connect to relevant data, institutional knowledge, AI capabilities and tools &mdash;
        so you can move from a business need to informed action.
      </p>
      <button class="wn__hero-cta" (click)="signIn()">Open DataNex</button>
    </div>
  </section>
```

with:

```html
<div class="wn">

  <!-- ── Hero ───────────────────────────────────────────────────────────── -->
  <section class="wn__hero">
    <div class="wn__hero-glow"></div>
    <svg class="wn__hero-squiggle" viewBox="0 0 400 320" fill="none" aria-hidden="true">
      <path d="M12 180 C 90 60, 180 260, 260 130 S 400 30, 388 190"
            stroke="#007DB7" stroke-width="1.5" stroke-dasharray="1 9" stroke-linecap="round" />
    </svg>
    <div class="wn__grain"></div>
    <div class="wn__hero-content">
      <span class="wn__hero-badge">DataNex 2.0</span>
      <h1 class="wn__hero-h1">
        Intent to<br><span class="wn__hero-accent">Discover</span>
      </h1>
      <p class="wn__hero-sub">
        Connect to relevant data, institutional knowledge, AI capabilities and tools &mdash;
        so you can move from a business need to informed action.
      </p>
      <button class="wn__hero-cta" (click)="signIn()">Open DataNex</button>
    </div>
  </section>
```

(Only the hero `<section>` changes — leave the rest of the file, from `<!-- ── What this unlocks -->` onward, untouched in this task.)

- [ ] **Step 4: Replace `:host` + the Hero SCSS block**

Replace `whats-new.component.scss:1-128` (from `:host {` through the end of `.wn__hero-cta`'s `&:hover` block) with:

```scss
:host {
  display: block;
  overflow-y: auto;
  height: 100%;
  font-family: var(--font, system-ui, sans-serif);

  --wn-bg: #FAF7F2;
  --wn-ink: #221F1B;
  --wn-ink-muted: #6B6660;
  --wn-blue: #007DB7;
  --wn-green: #8DC63F;
  --wn-border: #E8E2D8;
  --wn-serif: 'Fraunces', Georgia, serif;

  background: var(--wn-bg);
}

// ── Hero ─────────────────────────────────────────────────────────────────────
.wn__hero {
  min-height: 88vh;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  position: relative;
  overflow: hidden;
  background: var(--wn-bg);
}

.wn__hero-glow {
  position: absolute;
  width: 640px;
  height: 640px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(0, 125, 183, 0.10) 0%, transparent 70%);
  filter: blur(70px);
  top: -12%;
  right: -8%;
  pointer-events: none;
  z-index: 0;
}

.wn__hero-squiggle {
  position: absolute;
  top: 6%;
  right: 4%;
  width: 340px;
  height: auto;
  opacity: 0.55;
  pointer-events: none;
  z-index: 1;
}

.wn__grain {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
  opacity: 0.035;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-repeat: repeat;
  background-size: 140px 140px;
}

.wn__hero-content {
  position: relative;
  z-index: 2;
  padding: 0 72px 80px;
  max-width: 820px;
}

.wn__hero-badge {
  display: inline-flex;
  align-items: center;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.06em;
  color: var(--wn-blue);
  border: 1px solid rgba(0, 125, 183, 0.28);
  background: rgba(0, 125, 183, 0.06);
  border-radius: 999px;
  padding: 4px 12px;
  margin-bottom: 28px;
}

.wn__hero-h1 {
  font-family: var(--wn-serif);
  font-size: clamp(42px, 5vw, 64px);
  font-weight: 500;
  color: var(--wn-ink);
  line-height: 1.08;
  letter-spacing: -0.01em;
  margin: 0 0 20px;
}

.wn__hero-accent {
  color: var(--wn-blue);
}

.wn__hero-sub {
  font-size: 15px;
  line-height: 1.65;
  color: var(--wn-ink-muted);
  margin: 0 0 36px;
  max-width: 460px;
}

.wn__hero-cta {
  display: inline-flex;
  align-items: center;
  height: 42px;
  padding: 0 24px;
  background: var(--wn-blue);
  border: 1px solid var(--wn-blue);
  border-radius: 6px;
  font-size: 13.5px;
  font-weight: 500;
  font-family: inherit;
  color: #fff;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;

  &:hover {
    background: #006996;
    border-color: #006996;
  }
}
```

- [ ] **Step 5: Visually verify**

With the dev server running, navigate to `/whats-new` in a browser (or headless-screenshot it as in Task 2) and confirm: warm off-white background (not dark navy), serif "Intent to Discover" headline with "Discover" in ADB blue, visible thin dotted squiggle near the top-right of the hero, blue pill CTA button, badge/headline/subtext/CTA now actually stagger in on load (Step 2's fix), no console errors.

- [ ] **Step 6: Commit**

```bash
git add src/app/features/whats-new/whats-new.component.ts \
        src/app/features/whats-new/whats-new.component.html \
        src/app/features/whats-new/whats-new.component.scss
git commit -m "feat: redesign whats-new hero with warm editorial palette"
```

---

### Task 4: Redesign the "What This Unlocks" tabs and mockup frame

**Files:**
- Modify: `src/app/features/whats-new/whats-new.component.html` (tabs + tab-visual markup, within the `<!-- ── What this unlocks -->` section)
- Modify: `src/app/features/whats-new/whats-new.component.scss` (Unlocks section block, immediately following the Hero block from Task 3)
- Create: `src/app/features/whats-new/whats-new.component.spec.ts`

**Interfaces:**
- Consumes: `--wn-bg`, `--wn-ink`, `--wn-ink-muted`, `--wn-blue`, `--wn-border`, `--wn-serif` (from Task 3); `public/whats-new/home-preview.png` (from Task 2).
- Produces: nothing new consumed by later tasks (Task 5/6 are independent sections).

- [ ] **Step 1: Write the failing tests**

Create `src/app/features/whats-new/whats-new.component.spec.ts`:

```typescript
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { WhatsNewComponent } from './whats-new.component';

describe('WhatsNewComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WhatsNewComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(WhatsNewComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('defaults to the discover tab and switches when setTab is called', () => {
    const fixture = TestBed.createComponent(WhatsNewComponent);
    const component = fixture.componentInstance;

    expect(component.activeTab()).toBe('discover');

    component.setTab('trust');

    expect(component.activeTab()).toBe('trust');
  });
});
```

Note: these tests call component methods directly and never call `fixture.detectChanges()`, so `ngAfterViewInit` (which wires up GSAP/ScrollTrigger) never runs — avoids depending on browser-only layout APIs inside the JSDOM test environment.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- whats-new`
Expected: FAIL — `whats-new.component.spec.ts` doesn't exist yet at the start of this step (it's being created in this same step, so really this confirms the harness runs it; if it already passes because the component already satisfies both assertions, that's fine — the component logic here is pre-existing and unchanged by this task, only its template is changing).

- [ ] **Step 3: Replace the tabs + tab-visual markup**

Within the `<!-- ── What this unlocks -->` section of `whats-new.component.html`, replace the `<div class="wn__tab-right">...</div>` block:

Before:
```html
      <div class="wn__tab-right">
        <div class="wn__tab-visual"></div>
      </div>
```

After:
```html
      <div class="wn__tab-right">
        <div class="wn__tab-frame">
          <div class="wn__tab-frame-bar">
            <span class="wn__tab-frame-dot"></span>
            <span class="wn__tab-frame-dot"></span>
            <span class="wn__tab-frame-dot"></span>
          </div>
          <img
            class="wn__tab-frame-img"
            src="/whats-new/home-preview.png"
            alt="DataNex home page showing the search prompt bar and recommended use cases" />
        </div>
      </div>
```

The tab buttons themselves (`@for (tab of tabs; ...)`) and their bindings are unchanged — only their CSS class styling changes, in Step 4.

- [ ] **Step 4: Replace the Unlocks section SCSS**

Replace the `// ── What This Unlocks` block in `whats-new.component.scss` (everything from that comment through the end of `.wn__tab-visual`'s rule) with:

```scss
// ── What This Unlocks ─────────────────────────────────────────────────────────
.wn__unlocks {
  background: var(--wn-bg);
  padding: 96px 72px 80px;
  border-top: 1px solid var(--wn-border);
}

.wn__unlocks-head {
  display: flex;
  align-items: flex-start;
  gap: 80px;
  margin-bottom: 56px;
}

.wn__unlocks-h2 {
  font-family: var(--wn-serif);
  font-size: clamp(26px, 3vw, 38px);
  font-weight: 500;
  color: var(--wn-ink);
  line-height: 1.2;
  letter-spacing: -0.01em;
  margin: 0;
  flex-shrink: 0;
}

.wn__tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding-top: 4px;
}

.wn__tab {
  padding: 7px 16px;
  border: 1px solid var(--wn-border);
  background: transparent;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 500;
  font-family: inherit;
  color: var(--wn-ink-muted);
  cursor: pointer;
  text-align: left;
  transition: color 0.15s, background 0.15s, border-color 0.15s;
  white-space: nowrap;

  &:hover { color: var(--wn-ink); border-color: #d8d0c2; }

  &--active {
    color: #fff;
    background: var(--wn-blue);
    border-color: var(--wn-blue);
  }
}

.wn__tab-body {
  display: flex;
  gap: 64px;
  align-items: flex-start;
}

.wn__tab-left {
  flex: 1;
  max-width: 440px;
}

.wn__tab-title {
  font-family: var(--wn-serif);
  font-size: 20px;
  font-weight: 500;
  color: var(--wn-ink);
  margin: 0 0 18px;
  letter-spacing: -0.005em;
}

.wn__tab-para {
  font-size: 14px;
  line-height: 1.72;
  color: var(--wn-ink-muted);
  margin: 0 0 14px;

  &:last-child { margin-bottom: 0; }
}

.wn__tab-right {
  flex: 1;
}

.wn__tab-frame {
  border-radius: 12px;
  border: 1px solid var(--wn-border);
  background: #fff;
  box-shadow: 0 24px 48px -24px rgba(34, 31, 27, 0.18);
  overflow: hidden;
}

.wn__tab-frame-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 14px;
  background: #F3EEE5;
  border-bottom: 1px solid var(--wn-border);
}

.wn__tab-frame-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #D8D0C2;
}

.wn__tab-frame-img {
  display: block;
  width: 100%;
  height: auto;
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test -- whats-new`
Expected: PASS (2 tests).

- [ ] **Step 6: Visually verify**

Navigate to `/whats-new`, confirm: tab selector renders as blue-filled/outlined pill chips, clicking a tab switches both the active pill styling and the copy below it, the right-hand panel shows the framed home-page screenshot with a small three-dot bar on top, no console errors.

- [ ] **Step 7: Commit**

```bash
git add src/app/features/whats-new/whats-new.component.html \
        src/app/features/whats-new/whats-new.component.scss \
        src/app/features/whats-new/whats-new.component.spec.ts
git commit -m "feat: redesign whats-new unlocks tabs as pill chips with real product mockup"
```

---

### Task 5: Rebuild the roadmap as a changelog timeline

**Files:**
- Modify: `src/app/features/whats-new/whats-new.component.ts` (`RoadmapItem` interface, `roadmap` data, GSAP selector retarget)
- Modify: `src/app/features/whats-new/whats-new.component.html` (`<!-- ── What's next -->` section)
- Modify: `src/app/features/whats-new/whats-new.component.scss` (`// ── What's Next` block)
- Modify: `src/app/features/whats-new/whats-new.component.spec.ts` (add data-shape test)

**Interfaces:**
- Consumes: `--wn-bg`, `--wn-ink`, `--wn-ink-muted`, `--wn-blue`, `--wn-green`, `--wn-border` (from Task 3).
- Produces: `RoadmapItem { title: string; desc: string; quarter: string; tag?: string; tagColor?: 'green' }` — the new shape of `WhatsNewComponent.roadmap`, in case any later work references it.

- [ ] **Step 1: Write the failing test**

Add to `whats-new.component.spec.ts` (inside the existing `describe` block):

```typescript
  it('tags every roadmap item except the trailing "more" entry', () => {
    const fixture = TestBed.createComponent(WhatsNewComponent);
    const component = fixture.componentInstance;

    const withTitle = component.roadmap.filter(item => item.title);
    const trailing = component.roadmap[component.roadmap.length - 1];

    expect(withTitle.length).toBeGreaterThan(0);
    expect(withTitle.every(item => !!item.tag)).toBe(true);
    expect(trailing.title).toBe('');
    expect(trailing.tag).toBeUndefined();
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx ng test --include='src/app/features/whats-new/whats-new.component.spec.ts' --watch=false`
(Note: `npm test -- whats-new` does not work in this workspace — `ng test`'s positional argument is a project name, `angular.json` only defines one project named `DataNext`, so `whats-new` errors out. Use the `--include` invocation instead.)
Expected: FAIL — current `RoadmapItem` items don't have a `tag` field yet.

- [ ] **Step 3: Update the `RoadmapItem` interface and data, and retarget GSAP**

In `whats-new.component.ts`, replace the `RoadmapItem` interface and `roadmap` array:

Before:
```typescript
interface RoadmapItem {
  icon: string;
  title: string;
  desc: string;
  quarter: string;
}
```
```typescript
  readonly roadmap: RoadmapItem[] = [
    { icon: 'stack',    title: 'Additional Assets',    desc: 'Over 1,000 more assets coming your way!',                              quarter: 'Q4 2026' },
    { icon: 'interact', title: 'Interact with Assets', desc: "Explore and interact with the assets before 'check-out'.",             quarter: 'Q1 2027' },
    { icon: 'window',   title: 'One-Stop Experience',  desc: 'Everything and more that you loved about ADB Genie in one space!',     quarter: 'Q2 2027' },
    { icon: 'api',      title: 'Reuse Capabilities',   desc: 'Access integration capabilities such as APIs.',                        quarter: 'Q3 2027' },
    { icon: 'upload',   title: 'Contribute Assets',    desc: 'Help ADB scale its impact by contributing assets.',                   quarter: 'Q4 2027' },
    { icon: 'more',     title: '',                     desc: 'Keep a lookout for more!',                                            quarter: '' },
  ];
```

After:
```typescript
interface RoadmapItem {
  title: string;
  desc: string;
  quarter: string;
  tag?: string;
  tagColor?: 'green';
}
```
```typescript
  readonly roadmap: RoadmapItem[] = [
    { title: 'Additional Assets',    desc: 'Over 1,000 more assets coming your way!',                              quarter: 'Q4 2026', tag: 'Assets' },
    { title: 'Interact with Assets', desc: "Explore and interact with the assets before 'check-out'.",             quarter: 'Q1 2027', tag: 'Interaction' },
    { title: 'One-Stop Experience',  desc: 'Everything and more that you loved about ADB Genie in one space!',     quarter: 'Q2 2027', tag: 'Experience' },
    { title: 'Reuse Capabilities',   desc: 'Access integration capabilities such as APIs.',                        quarter: 'Q3 2027', tag: 'Integration' },
    { title: 'Contribute Assets',    desc: 'Help ADB scale its impact by contributing assets.',                    quarter: 'Q4 2027', tag: 'Contribution', tagColor: 'green' },
    { title: '',                     desc: 'Keep a lookout for more!',                                             quarter: '' },
  ];
```

(Dropping `icon` because the timeline replaces per-item icon glyphs with the `tag` chip — see Design Spec §Roadmap → Changelog timeline. `Contribute Assets` gets the green tag as the one deliberate, sparing use of the secondary brand color, since "contribute" maps naturally to ADB's green/growth association.)

Then, in `ngAfterViewInit`, retarget the roadmap stagger animation:

Before:
```typescript
    // Roadmap cards stagger
    gsap.from('.wn__roadmap-card', {
      scrollTrigger: { trigger: '.wn__roadmap-grid', start: 'top 80%' },
      y: 18, opacity: 0, duration: 0.5, stagger: 0.07, ease: 'power2.out',
    });
```

After:
```typescript
    // Timeline rows stagger
    gsap.from('.wn__timeline-row', {
      scrollTrigger: { trigger: '.wn__timeline', start: 'top 80%' },
      x: -12, opacity: 0, duration: 0.5, stagger: 0.08, ease: 'power2.out',
    });
```

- [ ] **Step 4: Replace the roadmap template markup**

Replace the `<div class="wn__roadmap-grid">...</div>` block (the whole `@for` loop with the per-icon `@if` chain) in `whats-new.component.html` with:

```html
    <div class="wn__timeline wn__reveal">
      @for (item of roadmap; track item.title || item.desc) {
        <div class="wn__timeline-row" [class.wn__timeline-row--more]="!item.title">
          <div class="wn__timeline-date">{{ item.quarter }}</div>
          <div class="wn__timeline-rail">
            @if (item.title) {
              <span class="wn__timeline-dot"></span>
            }
            <span class="wn__timeline-line"></span>
          </div>
          <div class="wn__timeline-content">
            @if (item.title) {
              <div class="wn__timeline-top">
                <p class="wn__timeline-title">{{ item.title }}</p>
                @if (item.tag) {
                  <span class="wn__timeline-tag" [class.wn__timeline-tag--green]="item.tagColor === 'green'">{{ item.tag }}</span>
                }
              </div>
              <p class="wn__timeline-desc">{{ item.desc }}</p>
            } @else {
              <p class="wn__timeline-more">{{ item.desc }}</p>
            }
          </div>
        </div>
      }
    </div>
```

(This replaces `.wn__roadmap-grid` — the surrounding `<section class="wn__next">`, the `.wn__next-head`, and the `.wn__next-cta-row` stay exactly as they are; only the grid itself is replaced.)

- [ ] **Step 5: Replace the "What's Next" SCSS block**

Replace the `// ── What's Next` block in `whats-new.component.scss` (from that comment through the end of `.wn__next-cta`'s `&:hover` rule, i.e. everything that currently styles `.wn__next`, `.wn__roadmap-grid`, `.wn__roadmap-card` and friends) with:

```scss
// ── What's Next ───────────────────────────────────────────────────────────────
.wn__next {
  background: #F5F0E6;
  padding: 96px 72px 80px;
  border-top: 1px solid var(--wn-border);
}

.wn__next-head {
  margin-bottom: 48px;
}

.wn__next-h2 {
  font-family: var(--wn-serif);
  font-size: clamp(26px, 3vw, 36px);
  font-weight: 500;
  color: var(--wn-ink);
  letter-spacing: -0.01em;
  margin: 0 0 8px;
}

.wn__next-sub {
  font-size: 14px;
  color: var(--wn-ink-muted);
  margin: 0;
}

.wn__timeline {
  display: flex;
  flex-direction: column;
  margin-bottom: 56px;
}

.wn__timeline-row {
  display: grid;
  grid-template-columns: 88px 24px 1fr;
  column-gap: 20px;
  padding-bottom: 28px;

  &:last-child .wn__timeline-line { display: none; }
}

.wn__timeline-date {
  font-size: 12px;
  font-weight: 500;
  color: var(--wn-ink-muted);
  padding-top: 2px;
}

.wn__timeline-row--more .wn__timeline-date {
  color: transparent;
}

.wn__timeline-rail {
  position: relative;
  display: flex;
  justify-content: center;
}

.wn__timeline-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--wn-blue);
  margin-top: 4px;
  z-index: 1;
}

.wn__timeline-line {
  position: absolute;
  top: 4px;
  bottom: -28px;
  width: 1px;
  background: var(--wn-border);
}

.wn__timeline-content {
  padding-bottom: 4px;
}

.wn__timeline-top {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}

.wn__timeline-title {
  font-size: 14.5px;
  font-weight: 600;
  color: var(--wn-ink);
  margin: 0;
}

.wn__timeline-tag {
  display: inline-flex;
  align-items: center;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.02em;
  color: var(--wn-blue);
  background: rgba(0, 125, 183, 0.08);
  border-radius: 999px;
  padding: 3px 10px;

  &--green {
    color: #5a8f28;
    background: rgba(141, 198, 63, 0.14);
  }
}

.wn__timeline-desc {
  font-size: 13px;
  line-height: 1.6;
  color: var(--wn-ink-muted);
  margin: 0;
  max-width: 480px;
}

.wn__timeline-more {
  font-size: 13px;
  color: var(--wn-ink-muted);
  margin: 0;
  font-style: italic;
}

.wn__next-cta-row {
  display: flex;
  justify-content: center;
}

.wn__next-cta {
  height: 42px;
  padding: 0 28px;
  background: var(--wn-blue);
  border: 1px solid var(--wn-blue);
  border-radius: 6px;
  font-size: 13.5px;
  font-weight: 500;
  font-family: inherit;
  color: #fff;
  cursor: pointer;
  transition: background 0.15s;

  &:hover { background: #006996; }
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npx ng test --include='src/app/features/whats-new/whats-new.component.spec.ts' --watch=false`
Expected: PASS (3 tests total).

- [ ] **Step 7: Visually verify**

Navigate to `/whats-new`, scroll to "What's next", confirm: a vertical dated timeline (not a 3-column grid) with a connecting line, a blue dot per dated row, a small pill tag on each row (mostly blue, "Contribute Assets" green), and the trailing "Keep a lookout for more!" row rendered in muted italic with no dot/date. Confirm the roll-in stagger animation still plays on scroll and there are no console errors.

- [ ] **Step 8: Commit**

```bash
git add src/app/features/whats-new/whats-new.component.ts \
        src/app/features/whats-new/whats-new.component.html \
        src/app/features/whats-new/whats-new.component.scss \
        src/app/features/whats-new/whats-new.component.spec.ts
git commit -m "feat: turn whats-new roadmap grid into a dated changelog timeline"
```

---

### Task 6: Restyle the footer to the light palette

**Files:**
- Modify: `src/app/features/whats-new/whats-new.component.scss` (`// ── Footer` block)

**Interfaces:**
- Consumes: `--wn-bg`, `--wn-ink`, `--wn-ink-muted`, `--wn-border` (from Task 3).

- [ ] **Step 1: Replace the Footer SCSS block**

Replace the `// ── Footer` block in `whats-new.component.scss` (from that comment through the end of `.wn__footer-copy`) with:

```scss
// ── Footer ────────────────────────────────────────────────────────────────────
.wn__footer {
  background: var(--wn-bg);
  padding: 56px 72px 0;
  border-top: 1px solid var(--wn-border);
}

.wn__footer-inner {
  display: flex;
  gap: 80px;
  padding-bottom: 48px;
  border-bottom: 1px solid var(--wn-border);
}

.wn__footer-brand {
  flex: 1;
}

.wn__footer-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.wn__footer-logo-text {
  font-size: 14px;
  font-weight: 600;
  color: var(--wn-ink);
}

.wn__footer-ai {
  color: var(--wn-ink-muted);
  font-weight: 400;
}

.wn__footer-tagline {
  font-size: 12px;
  color: var(--wn-ink-muted);
  margin: 0;
  line-height: 1.6;
}

.wn__footer-col {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 160px;
}

.wn__footer-col-title {
  font-size: 11px;
  font-weight: 500;
  color: var(--wn-ink-muted);
  margin: 0 0 2px;
}

.wn__footer-link {
  font-size: 13px;
  color: var(--wn-ink-muted);
  text-decoration: none;
  transition: color 0.12s;

  &:hover { color: var(--wn-ink); }
}

.wn__footer-copy {
  padding: 20px 0;
  font-size: 11.5px;
  color: var(--wn-ink-muted);
  opacity: 0.7;
}
```

No HTML/TS changes — the footer markup (brand block, ADB logo, two link columns, copyright) is unchanged; the ADB logo mark (`public/adb-logo.svg`) is a navy badge that already reads correctly on light backgrounds (confirmed: its fill is `#002569`, not white), so it needs no swap.

- [ ] **Step 2: Visually verify**

Scroll to the footer, confirm: light warm background (not dark navy block), a thin top border, navy ADB logo mark still legible, ink-colored brand text, muted gray links that darken on hover, no console errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/features/whats-new/whats-new.component.scss
git commit -m "feat: restyle whats-new footer to the light warm palette"
```

---

### Task 7: Update responsive breakpoints for the new markup

**Files:**
- Modify: `src/app/features/whats-new/whats-new.component.scss` (`// ── Responsive` block, at the end of the file)

**Interfaces:**
- Consumes: all class names introduced in Tasks 3–6 (`.wn__hero-squiggle`, `.wn__tab`, `.wn__timeline-row`, `.wn__timeline-date`, `.wn__footer-inner`).

- [ ] **Step 1: Replace the Responsive block**

The existing responsive block references classes that no longer exist (`.wn__roadmap-grid`, the old `.wn__tab`/`.wn__tab--active` mobile pill override — which is now redundant since tabs are pill-shaped at all sizes by default from Task 4). Replace the entire `// ── Responsive` block (from that comment to the end of the file) with:

```scss
// ── Responsive ────────────────────────────────────────────────────────────────
@media (max-width: 960px) {
  .wn__hero-content { padding: 0 36px 60px; }
  .wn__hero-squiggle { width: 200px; }

  .wn__unlocks { padding: 64px 36px; }
  .wn__unlocks-head { flex-direction: column; gap: 32px; }

  .wn__tab-body { flex-direction: column; gap: 32px; }
  .wn__tab-left { max-width: 100%; }

  .wn__next { padding: 64px 36px; }
  .wn__timeline-row { grid-template-columns: 64px 20px 1fr; column-gap: 14px; }

  .wn__footer { padding: 48px 36px 0; }
  .wn__footer-inner { flex-direction: column; gap: 36px; }
}

@media (max-width: 600px) {
  .wn__timeline-row { grid-template-columns: 20px 1fr; }
  .wn__timeline-date { display: none; }
}
```

- [ ] **Step 2: Visually verify at both breakpoints**

Resize the browser (or headless-screenshot) to 900px and 500px wide, navigate to `/whats-new`, confirm: hero/unlocks/footer reflow to single-column layouts as before, the timeline collapses its date column at ≤600px without breaking the dot/line alignment, tabs wrap onto multiple lines cleanly as pill chips, no horizontal scrollbar, no console errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/features/whats-new/whats-new.component.scss
git commit -m "fix: update whats-new responsive breakpoints for redesigned sections"
```

---

### Task 8: Full-page verification pass

**Files:** none (verification only)

- [ ] **Step 1: Run the full test suite**

Run: `npm test`
Expected: all tests pass, including the 3 new `whats-new` tests.

- [ ] **Step 2: Run a production build**

Run: `npm run build`
Expected: succeeds with no new errors/warnings.

- [ ] **Step 3: Full manual walkthrough**

With the dev server running, walk `/whats-new` top to bottom at desktop width (~1440px):
- Hero: warm background, serif headline, squiggle, badge chip, blue CTA — entrance animation plays once on load.
- Unlocks: click through all 4 tabs (Discover/Connect/Reuse/Trust), confirm copy swaps and the active pill highlights correctly; confirm the framed home-page screenshot renders.
- Roadmap: scroll to trigger the timeline stagger-in animation; confirm dates, dots, tags (mostly blue, one green), and the trailing "more" row all render correctly.
- Footer: confirm light palette, working links (even if they're `href="#"` placeholders), correct ADB logo.
- Check the browser console for errors across the whole walkthrough.
- Confirm the "Open DataNex" and "Sign in to get started" buttons both navigate to `/` (via `signIn()`).

- [ ] **Step 4: Take a final reference screenshot**

Capture a full-page screenshot of `/whats-new` at 1440px width and review it end-to-end against the Design Spec's goals (warm/editorial mood, ADB brand colors, changelog timeline, real product mockup, light footer).

No commit for this task — it's verification only. If anything fails, return to the relevant task above and fix it there.
