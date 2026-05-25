## About Route — CyberAI Story & Cinematic Glass Sections

### Goal
Create a new `/about` route that tells the CyberAI origin story through immersive, cinematic glass-panel sections, staying fully consistent with the existing dark-luxury design system.

### Files to Create

1. **`src/routes/about.tsx`** — The About route file with:
   - `head()` metadata: title, description, og tags, canonical `/about`
   - `errorComponent` and `notFoundComponent`
   - Page wrapper: `CursorSpotlight`, `Navbar`, `<main>`, `Footer`
   - Sections (all using existing design tokens + `framer-motion` `whileInView`):

   **Section: AboutHero**
   - Cinematic headline: "Built for the moment after the alarm."
   - Subtitle about the synthetic era and autonomous defense
   - `StatusPill` with accent tone: "Origin Document // CLASSIFIED"
   - `AnimatedGrid` background, gradient-text treatment

   **Section: OriginStory**
   - Two-column layout (text left, visual right)
   - Narrative copy: founding story — former intelligence operators + AI researchers who saw that legacy SOCs couldn't keep pace with synthetic threats
   - Right side: a large `GlassPanel` with abstract visual (gradient orb or generated image placeholder)
   - Scroll-triggered fade-up animation

   **Section: Mission**
   - Full-width `GlassPanel` with `glass-panel-strong`
   - Three mission pillars inside a 3-column grid, each with a Lucide icon, label, and short statement
   - Icons: `Target`, `BrainCircuit`, `GlobeLock` (or similar from existing icon set)

   **Section: Timeline**
   - Vertical timeline with 4 milestones (2023–2026)
   - Each milestone is a `GlassPanel` card with year, title, and description
   - Alternating left/right layout on desktop, stacked on mobile
   - A thin glowing vertical line connecting milestones
   - Scroll-triggered staggered entrance

   **Section: Values**
   - 2×2 bento grid of `GlassPanel` cards
   - Four values: Sovereignty, Velocity, Silence, Certainty
   - Each card has a mono label, headline, and one-sentence description
   - `hoverGlow` enabled on all cards

   **Section: AboutCTA**
   - Minimal section with headline + dual buttons
   - "Join the defense grid" / "Read the docs"
   - Reuses `MagneticButton` patterns

2. **`src/components/features/about/AboutHero.tsx`**
2. **`src/components/features/about/OriginStory.tsx`**
2. **`src/components/features/about/Mission.tsx`**
2. **`src/components/features/about/Timeline.tsx`**
2. **`src/components/features/about/Values.tsx`**
2. **`src/components/features/about/AboutCTA.tsx`**

### Files to Modify

1. **`src/routes/sitemap[.]xml.ts`** — Add `/about` entry (`changefreq: monthly`, `priority: 0.7`)

2. **`src/components/layout/Navbar.tsx`** — Change the "About" nav link `to: "/"` → `to: "/about"`

### Design Constraints
- All colors via CSS tokens (`--primary`, `--accent`, `--surface`, etc.)
- Typography: `font-display` for headings, `font-mono` for labels/pills
- Glass panels use existing `.glass-panel` / `.glass-panel-strong` utilities
- Animations use `framer-motion` with `[0.16, 1, 0.3, 1]` ease (existing convention)
- No new dependencies — `lucide-react` icons only
- Responsive: works on mobile (663px viewport) through desktop

### Technical Details
- Route file follows the exact same wrapper pattern as `src/routes/index.tsx`
- All section components are purely presentational (no data fetching)
- `head()` meta is unique to `/about` — not copied from home page
- No `og:image` added (follows existing rule: only leaf routes with meaningful images)

### Acceptance Criteria
- `/about` renders correctly in the preview
- Navbar "About" link navigates to `/about`
- Sitemap includes `/about`
- All sections animate in on scroll
- Glass panels render with correct blur and border styling
- Page passes visual QA on mobile and desktop viewports