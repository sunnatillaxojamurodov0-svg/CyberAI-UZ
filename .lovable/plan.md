## CyberAI — Build Plan

**Stack reality:** This project runs on TanStack Start + Lovable Cloud (managed Supabase). I'll faithfully adapt the Next.js architecture you spec'd to TanStack equivalents — same features, idiomatic routing/server functions.

**Design lock:** Command Center Bento. Tokens (deep black `#020408`, surface `#0a0e17`, electric cyan `#00f2ff`, violet `#7c3aed`, Inter + JetBrains Mono), glass panels, animated grid, magnetic CTAs, and the bento composition port verbatim into the React app.

---

### Phase 1 — Foundation + Landing (this turn)

1. **Design system** in `src/styles.css`: port the prototype's `@theme` tokens (background, surface, border, primary cyan, accent violet, muted), Inter + JetBrains Mono via Google Fonts, `.glass-panel`, `.glow-hover`, grid background, float / pulse-soft / scanline keyframes.
2. **Layout shell** (`src/routes/__root.tsx` + components):
   - `Navbar` — sticky, blur, animated logo mark, magnetic CTA, mobile sheet.
   - `Footer` — bento footer with newsletter glass card + social links.
   - Cursor-reactive radial spotlight overlay (light, GPU-only, no particle spam).
3. **Landing route** (`src/routes/index.tsx`) with framer-motion sectioned reveals:
   - Hero: status pill, gradient hero type, dual CTA with cyan glow.
   - Command Center Bento (8/4 split, stats trio) — generated hero visualization images for the two placeholders (globe + neural topology).
   - Trust strip.
   - Capability grid (4 modules: Threat Intel, AI Assistant, Prompt Library, Projects).
   - AI Assistant teaser panel (chat surface mock).
   - Community/mission section.
   - Footer.
4. **Reusable primitives** in `src/components/shared/`: `MagneticButton`, `GlassPanel`, `SectionHeading`, `CursorSpotlight`, `AnimatedGrid`, `StatusPill`.
5. **SEO**: route-level `head()` with title, description, OG tags; semantic h1, alt text on images.

### Phase 2 — Content routes

- `src/routes/about.tsx`, `projects/index.tsx`, `projects/$slug.tsx`, `prompts/index.tsx`, `prompts/$slug.tsx` — each with own `head()` metadata, bento-aligned layouts, project cards, filterable prompt search (debounced).
- Seed mock content (later swapped for DB-backed via server fns).

### Phase 3 — Lovable Cloud + Auth

- Enable Lovable Cloud (managed Supabase).
- DB schema: `profiles`, `user_roles` (enum: `admin`, `user`) + `has_role()` SECURITY DEFINER, `projects`, `prompts`, `conversations`, `messages`, `audit_log`, `feature_flags`. RLS on every table.
- Trigger to auto-create `profiles` on signup.
- Auth: email/password + Google. `src/routes/login.tsx`, `register.tsx`, `reset-password.tsx`. Cinematic auth modal/page with animated form.
- Protected layout `src/routes/_authenticated.tsx` with `beforeLoad` redirect; admin layout `_authenticated/_admin.tsx` gated by `has_role('admin')`.

### Phase 4 — AI Assistant + Dashboard

- `_authenticated/dashboard.tsx` — user bento home (recent convos, saved prompts, stats).
- `_authenticated/ai-assistant/index.tsx` + `$id.tsx` — streaming chat against Lovable AI Gateway via a server route at `src/routes/api/ai/chat.ts` (SSE). Sidebar of conversations, message bubbles with markdown, chat input with command palette feel.
- Server fns for conversations CRUD; rate-limiting middleware.
- Profile route.

### Phase 5 — Admin

- Admin sidebar layout.
- Overview cards, users table, projects/prompts management, analytics charts, feature-flags toggle, audit-log viewer. All gated server-side via `has_role('admin')`.

### Phase 6 — Polish & launch

- Page transitions, loading skeletons, error/404 polish, keyboard shortcuts (⌘K), accessibility pass, perf pass (lazy heavy panels, prefers-reduced-motion), `robots.txt`, OG images for each route.

---

### Technical mapping (Next.js spec → TanStack)

- `app/(public|auth|protected|admin)/` → `src/routes/` with `_authenticated.tsx` / `_authenticated/_admin.tsx` pathless layouts.
- `app/api/**/route.ts` → `src/routes/api/**.ts` server routes (`createFileRoute` with `server.handlers`).
- `createServerFn` for app-internal RPC (conversations, prompts, projects, admin queries).
- Streaming AI: server route `src/routes/api/ai/chat.ts` returning SSE from Lovable AI Gateway (`LOVABLE_API_KEY` auto-provisioned). Default model `google/gemini-3-flash-preview`.
- `lib/supabase/client.ts` (browser), `auth-middleware.ts` (user-scoped server fn), `client.server.ts` (service role) — already scaffolded in template.
- Zod schemas in `src/lib/validations/`. Rate limiter in-memory per Worker (KV not on Cloudflare here).
- `framer-motion`, `lucide-react`, `react-markdown` added as needed.

### What I'll start building right now

Phase 1 in one batch: tokens, fonts, primitives, navbar, footer, landing route with hero + bento (with generated images) + capability grid + AI teaser + community + trust strip. After it's live and looks right, we ship Phase 2 next turn, etc. — this keeps each milestone reviewable and avoids a 200-file dump that's hard to QA.

Confirm and I'll switch to build mode.