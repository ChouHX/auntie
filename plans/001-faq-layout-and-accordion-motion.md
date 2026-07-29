# 001 — Rebuild the FAQ as one responsive help workspace

- **Status**: DONE
- **Commit**: 8260d66
- **Severity**: HIGH
- **Category**: Performance / Interruptibility / Layout
- **Estimated scope**: 5 files, roughly 180–260 lines changed

## Problem

The FAQ currently permits several answers to remain open and even opens the
first two by default. That makes the question list expand as a group instead of
keeping one clear reading target:

```tsx
// site-pages/faq-page.tsx:41 — current
const [openItems, setOpenItems] = useState<string[]>(() =>
  getInitialOpenItems(content.items.length)
)

// site-pages/faq-page.tsx:181 — current
<Accordion
  className="overflow-hidden rounded-lg border border-border bg-white/72 shadow-lg shadow-slate-950/5 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.045]"
  onValueChange={handleOpenChange}
  type="multiple"
  value={openItems}
>
```

Sidebar navigation appends another open value rather than selecting one, so
several links are highlighted at once:

```tsx
// site-pages/faq-page.tsx:59 — current
function handleNavClick(event: MouseEvent<HTMLAnchorElement>, value: string) {
  event.preventDefault()
  setOpenItems((current) =>
    current.includes(value) ? current : [...current, value]
  )
```

The shared accordion animates `height` with keyframes. Height changes cause
layout work for the entire long list, while keyframes restart instead of
retargeting from their current presentation value when users click another
question quickly:

```tsx
// components/ui/accordion.tsx:54 — current
<AccordionPrimitive.Content
  data-slot="accordion-content"
  className="overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
  {...props}
>
```

```css
/* app/globals.css:208 — current */
.animate-accordion-down {
  animation: accordion-down 240ms ease-out;
}
.animate-accordion-up {
  animation: accordion-up 220ms ease-in;
}

/* app/globals.css:330 — current */
@keyframes accordion-down {
  from {
    height: 0;
    opacity: 0;
  }
  to {
    height: var(--radix-accordion-content-height);
    opacity: 1;
  }
}
```

The first task is fragmented across two large regions. `PageHero` only contains
the page title and description, while usage instructions, search, and result
feedback start in a second section below it:

```tsx
// site-pages/faq-page.tsx:86 — current
<PageHero
  description={content.description}
  kicker={content.kicker}
  title={content.title}
/>

<Section className="py-10 sm:py-16">
  <div className="mx-auto max-w-7xl">
    <div className="grid gap-6 border-b border-border pb-8 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,0.8fr)] lg:items-end dark:border-white/10">
```

Finally, the sticky navigation and service notes do not share a containing
layout. The sidebar can only remain sticky until its FAQ section ends, and the
service notes cannot appear in its navigation because they are rendered after
that section:

```tsx
// site-pages/faq-page.tsx:149 — current
<div className="mt-8 grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)] lg:items-start">
  <aside className="hidden lg:block">
    <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto ...">

// site-pages/faq-page.tsx:232 — current
<ServiceDetailsSection />
```

## Target

Build one coherent FAQ workspace with these exact behaviors:

1. Radix uses `type="single"` and `collapsible`; state is `string | undefined`.
   At most one answer is open. The initial value is the valid `#faq-N` hash or
   `faq-1`; never open two answers by default.
2. Selecting a sidebar question replaces the open value, updates the URL hash,
   and scrolls that question into view. Selecting the service-notes item does
   not open a FAQ; it scrolls to `#service-details`.
3. The FAQ opts out of height keyframes. Its answer appears immediately, with
   state feedback supplied by the row color and a compositor-only caret
   transition. Use exactly:

   ```tsx
   // target FAQ usage
   <Accordion type="single" collapsible value={openItem} onValueChange={handleOpenChange}>
     {/* ... */}
     <AccordionContent motion="none" className="...">
   ```

   ```tsx
   // target caret classes in components/ui/accordion.tsx
   "transition-transform duration-[160ms] [transition-timing-function:cubic-bezier(0.23,1,0.32,1)] group-data-[state=open]:rotate-180 motion-reduce:transition-none"
   ```

   Add a backwards-compatible `motion?: "height" | "none"` prop to
   `AccordionContent`, defaulting to `"height"`, so payment-page accordions do
   not change. When `motion="none"`, omit both `animate-accordion-*` classes.
4. Hero contains the kicker, title, concise description, usage guidance,
   search input, clear control, and live result count. Search is the dominant
   control and is visible in the first content viewport on mobile. Keep one
   restrained material surface around the search control only; do not place a
   translucent card inside another translucent card.
5. Preserve the repository requirement `letter-spacing: 0`. Do not copy the
   negative or positive tracking suggestions from the Apple design reference.
   Remove FAQ-specific `tracking-*` utilities when touching this layout.
6. The desktop layout is a two-column grid with `lg:items-start`. The sidebar
   remains beneath the fixed header while scrolling through both the questions
   and service notes:

   ```tsx
   // target sidebar geometry
   <aside className="hidden lg:sticky lg:top-24 lg:block lg:self-start">
     <div className="max-h-[calc(100svh-7rem)] overflow-y-auto overscroll-contain ...">
   ```

   No ancestor of that sticky element may use `overflow: hidden`,
   `overflow: auto`, or `overflow: clip` on the scrolling axis.
7. The sidebar contains filtered FAQ links followed by a visually separated
   link labeled from `dict.servicesSection.detailTitle`, targeting
   `#service-details`. The service notes render inside the main column and the
   same grid boundary, so the sticky sidebar spans them.
8. The service section accepts an explicit `id` and an embedded rendering mode
   that omits its outer `Section`/max-width wrapper. Existing call sites retain
   their current standalone behavior by default.
9. Smooth anchor scrolling remains conditional on
   `prefers-reduced-motion`. Reduced motion uses `behavior: "auto"`; all state
   and focus feedback remains visible.

## Repo conventions to follow

- Continue using the existing Radix wrapper in
  `components/ui/accordion.tsx`; do not introduce a motion library.
- Continue using `cn()` from `lib/utils.ts` for conditional classes.
- Continue using the existing `Button`, `Input`, `SectionKicker`, and Phosphor
  icons rather than creating parallel controls.
- `site-pages/faq-page.tsx:67` already branches scroll behavior through
  `window.matchMedia("(prefers-reduced-motion: reduce)")`; retain that pattern.
- `app/globals.css:373` already provides the repository-wide reduced-motion
  fallback. Component-level `motion-reduce:transition-none` should make the
  caret behavior explicit as well.
- `components/common/page-hero.tsx:24` owns the standard hero max-width and
  responsive horizontal padding. Extend this component with optional children
  rather than duplicating its entire visual background in the FAQ page.

## Steps

1. In `components/common/page-hero.tsx`, add `children?: ReactNode` to
   `PageHeroProps`, accept it in the function arguments, and render it after the
   description inside the existing relative max-width container. Keep existing
   pages unchanged when no children are supplied. Remove negative tracking from
   the hero title while touching this code, using `tracking-normal` or no
   tracking utility to satisfy the repository-wide `letter-spacing: 0` rule.
2. In `site-pages/faq-page.tsx`, change `openItems: string[]` to
   `openItem: string | undefined`. Replace `getInitialOpenItems()` with
   `getInitialOpenItem()` returning a valid hash FAQ, otherwise `faq-1` when
   items exist, otherwise `undefined`. Change `handleOpenChange` to accept one
   string and only replace the URL hash when the value is non-empty.
3. Replace `handleNavClick` with a helper that sets exactly one `openItem`, sets
   the hash, and performs the existing reduced-motion-aware scroll on the next
   animation frame. Add a separate service-details navigation handler that
   sets the hash and scrolls without modifying the accordion value.
4. Change the FAQ root to `type="single"`, add `collapsible`, pass the scalar
   value, and update active-sidebar checks from
   `openItems.includes(value)` to `openItem === value`.
5. In `components/ui/accordion.tsx`, introduce the optional
   `motion?: "height" | "none"` prop. Strip it before spreading Radix props.
   Apply `animate-accordion-up/down` only for the default `height` mode. Update
   the caret to a 160ms transform-only transition with
   `cubic-bezier(0.23, 1, 0.32, 1)` and `motion-reduce:transition-none`.
6. Pass `motion="none"` only from FAQ answers. Do not remove global accordion
   keyframes because `site-pages/payment-pages.tsx:1653` uses the shared
   default accordion behavior.
7. Move the current usage intro, search input, clear button, and live count
   into `PageHero` children. Use a responsive two-column arrangement only when
   it improves scanning at `lg`; on mobile keep title, short usage copy, search,
   and count in that order. Remove the now-empty intro/search block and its
   redundant border from the following `Section`.
8. Keep usage copy concise in the layout: render at most the existing
   paragraphs without adding feature-instruction prose. Use body leading and
   weight for hierarchy, keep all letter spacing at `0`, and avoid oversized
   type inside the search/control area.
9. In `components/sections/service-details-section.tsx`, add props equivalent
   to `{ id?: string; embedded?: boolean; className?: string }`. Extract the
   existing inner content once. For `embedded={false}` retain the current
   `Section`; for `embedded={true}` return an unframed section/div with the
   provided ID and `scroll-mt-24`. Do not nest a `Section` inside another
   constrained section.
10. In `site-pages/faq-page.tsx`, make the sidebar and main content one grid.
    Render the FAQ accordion followed by
    `<ServiceDetailsSection id="service-details" embedded />` in the main
    column. The sticky aside must be a sibling of that complete main column so
    its containing block covers both content areas.
11. Put `lg:sticky lg:top-24 lg:self-start` on the grid's `aside` so its
    containing block spans the complete main column. Put
    `max-h-[calc(100svh-7rem)]`, `overflow-y-auto`, and `overscroll-contain` on
    the inner navigation surface. Inspect every ancestor between the sticky
    element and document scrolling; remove only a vertical overflow class that
    prevents sticky positioning.
12. Append the service-notes link after the filtered FAQ links with a subtle
    top divider and spacing. Use `dict.servicesSection.detailTitle` for the
    localized label and `href="#service-details"`. Do not number it as a FAQ.
13. Track active navigation explicitly: the selected FAQ remains active after
    accordion interaction; clicking service notes makes that link active. If
    adding scroll-position tracking, use one `IntersectionObserver`, clean it
    up on unmount, and do not attach per-frame scroll listeners.
14. Preserve semantic and keyboard behavior: visible focus rings, native search
    labeling, `aria-live="polite"` for result count, Radix trigger semantics,
    stable IDs, and scroll margins beneath the fixed header.
15. Set `data-scroll-reveal="false"` on the long FAQ workspace `Section`. The
    global observer uses a `0.12` intersection threshold; on a tall mobile
    section that can leave the first questions transparent until the user
    scrolls farther. This high-frequency task must render immediately.

## Boundaries

- Do NOT change FAQ content, service-scope wording, CMS schemas, or database
  access.
- Do NOT add Framer Motion, Motion, spring packages, or any dependency.
- Do NOT globally remove accordion keyframes; payment pages rely on the shared
  default behavior.
- Do NOT add cards around the hero, sidebar, FAQ, or service section merely for
  decoration. A single framed FAQ list and a restrained sidebar surface are
  sufficient.
- Do NOT add decorative gradients, blobs, SVG illustrations, or new imagery.
- Do NOT use negative or positive letter-spacing values; repository design
  requirements override the Apple reference's general typography guidance.
- Do NOT modify unrelated dirty-worktree files or clean up existing user
  changes.
- If these excerpts no longer match commit `8260d66`, STOP and report drift
  instead of improvising.

## Verification

- **Mechanical**: run these commands and require successful exits:

  ```bash
  pnpm typecheck
  pnpm eslint site-pages/faq-page.tsx components/ui/accordion.tsx components/common/page-hero.tsx components/sections/service-details-section.tsx
  pnpm run build
  git diff --check
  ```

- **Feel check**: run the app and verify at 390×844, 1024×768, and 1440×900:
  - Open one FAQ and then another; the first closes and only one sidebar link
    is active.
  - Alternate rapidly between two questions. Content updates immediately,
    there is no height tween, no visible restart from zero, and the caret
    remains responsive.
  - In Chrome DevTools Performance, record rapid accordion switching. Confirm
    no accordion `height` animation and no repeated long layout tasks.
  - In the Animations panel at 10% playback, confirm the caret rotates smoothly
    through 160ms with no overshoot. Accordion content itself must not slide.
  - Scroll from the first FAQ through the final service-note card. At desktop
    widths the sidebar top remains under the site header and its own list can
    scroll without moving the page unexpectedly.
  - Click “服务范围补充说明” / “Service scope notes”; the URL becomes
    `#service-details` and the section lands below the fixed header.
  - Load direct URLs ending in `#faq-12` and `#service-details`. The former
    opens only question 12; the latter reaches service notes without opening
    additional questions.
  - Search for a term that yields results and one that yields none. Search,
    clear action, result count, and empty state remain usable with keyboard and
    screen-reader labels.
  - Toggle `prefers-reduced-motion: reduce`. Anchor navigation becomes instant,
    caret movement is removed, and active/focus/color feedback remains.
  - Toggle `prefers-reduced-transparency: reduce` if supported. Ensure text
    stays legible; if the existing material surfaces fail, replace blur with a
    near-solid background in that media query without adding motion.
  - Test both Chinese and English, including long questions at 200% text zoom;
    no label overlaps, clips, or changes grid width.
- **Done when**: only one FAQ can be open, rapid switching is free of height
  animation jank, the first task is integrated into Hero, the sticky sidebar
  spans FAQ and service notes, and service notes are reachable from that
  sidebar in both languages.
