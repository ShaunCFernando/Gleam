---
name: frontend-design
description: Design system and taste rules for the Gleam frontend (React + Tailwind + Radix + Framer Motion). Use whenever building or modifying UI — new components, pages, layouts, or styling changes — to keep typography, spacing, color, and component patterns consistent with the rest of the app instead of inventing new ad hoc values.
---

# Gleam frontend design system

This project already has a real design system baked into
`frontend/tailwind.config.js` and `frontend/src/styles.css`. Don't
invent new tokens, font sizes, or colors — reuse what's below. If a
task seems to need something outside this system, say so explicitly
rather than quietly adding a one-off value.

## Typography scale

Two font families, never mixed within the same text element:

- **Sans** (`font-sans`, the default body font) — system UI stack
  (`-apple-system`, `Segoe UI`, Roboto, Helvetica). Used for body copy,
  labels, nav, buttons, form controls.
- **Serif display** (`font-serif-display`, "Gowun Batang") — headings
  only (`h1`/`h2`/`h3`, page titles, product names). Never use it for
  body text, buttons, or UI chrome.

Stick to this scale, smallest to largest. Don't drop in an arbitrary
`text-[13px]` because something "feels" a pixel off:

| Class | Use |
|---|---|
| `text-[10px]` / `text-[11px]` | Photo credits, tiny uppercase eyebrows/tags (`tracking-[0.28em] uppercase`) |
| `text-xs` | Meta text, badges, fine print |
| `text-sm` | Default UI text, form labels, secondary copy |
| `text-base` / `text-lg` | Body paragraphs, lead-in copy |
| `text-xl` / `text-2xl` / `text-3xl` | Card titles, section headings (`font-serif-display`) |
| `text-4xl` → `text-6xl` (`sm:`/`lg:` responsive steps) | Page hero titles (`font-serif-display`) |

Headings are always tight leading (`leading-[1.08]` to `leading-tight`)
and pair with `text-muted-foreground` body copy underneath, not
`text-foreground` at full weight.

## Spacing system

Tailwind's default 4px-based scale, but treat **8px increments as the
default rhythm** — use the even-numbered utilities (`2, 4, 6, 8, 10,
12, 16, 20, 24`) for layout, gaps, and section padding. Reach for the
odd/fractional ones (`1, 3, 5, 2.5, 3.5`) only for small internal
tweaks (icon gaps, badge padding), not for page or section structure.

- Section vertical rhythm: `py-16` / `py-20` / `py-24` between major
  page sections.
- Card/content padding: `p-5` or `p-6`.
- Stacked element spacing: `mt-2` / `mt-3` (related items) up to
  `mt-8` (before a new sub-block).
- Grid/flex gaps: `gap-2` (tight, e.g. badges) → `gap-4`/`gap-5`
  (cards, columns).
- Page containers go through `PageContainer` (`max-w-3xl` default,
  override with `max-w-5xl` for wider grids) — don't hand-roll
  `mx-auto max-w-*` elsewhere.

## Color tokens

Every color is a semantic HSL CSS variable defined once in
`styles.css` and exposed as a Tailwind color in `tailwind.config.js`.
**Never write a raw hex code or arbitrary color** (`bg-[#4a5d43]`,
`text-green-700`, etc.) — use the token:

| Token | Role |
|---|---|
| `background` / `foreground` | Page background / default text |
| `primary` / `primary-foreground` | Brand sage-green, CTAs, active states, links |
| `secondary` / `secondary-foreground` | Soft green-tinted surface (selected states, chips) |
| `muted` / `muted-foreground` | De-emphasized surfaces and body copy |
| `accent` / `accent-foreground` | Same family as secondary, for highlighted UI |
| `card` / `card-foreground` | Card surfaces |
| `border` / `input` / `ring` | Borders, form control borders, focus rings |
| `destructive` / `destructive-foreground` | Errors only |

The palette is warm and muted: cream background (`45 33% 98%`), sage
green primary (`138 15% 33%`), never a saturated blue/indigo/purple.
If a new feature needs a new semantic role (e.g. a "success" state),
add it as a CSS variable in `styles.css` + `tailwind.config.js` the
same way the existing tokens are defined — don't hardcode a color.

## Component patterns

Reuse the primitives in `frontend/src/components/ui/` instead of
writing raw `<button>`/`<div className="border...">` markup:

- **Button** (`ui/button.jsx`) — variants `default` (filled primary,
  pill-shaped `rounded-full`), `outline`, `ghost`, `link`; sizes `sm`,
  `default`, `lg`, `icon`. Every button already springs on hover
  (`scale: 1.035`) and tap (`scale: 0.965`) via Framer Motion — don't
  add competing CSS `hover:scale-*` on top of it.
- **Card** (`ui/card.jsx`) — `Card` + `CardHeader`/`CardTitle`/
  `CardDescription`/`CardContent`/`CardFooter`. Cards already lift on
  hover (`y: -4` + soft shadow); don't re-add `hover:-translate-y-1`
  or `hover:shadow-md` at the call site, it's redundant with the
  component itself.
- **Badge** (`ui/badge.jsx`) — `default` (filled secondary pill),
  `outline`, `muted` (italic, for de-emphasized tags like "not in
  quiz matching").
- **Form controls** — `Input`, `Select`, `Checkbox` all use `rounded-full`
  or `rounded-md`, `border-border`, and `focus-visible:ring-2
  focus-visible:ring-ring`. Match that instead of introducing square
  corners or a different focus treatment.
- **Layout** — `PageContainer` for horizontal max-width + padding,
  `FeatureRow` for the alternating image/text sections with scroll
  parallax, `PageTransition` wraps every routed page.

### Motion conventions

Framer Motion is already wired project-wide — match the existing feel
rather than introducing a different easing/timing language:

- Scroll-triggered entrances: `initial={{ opacity: 0, y: 16-24 }}`,
  `whileInView={{ opacity: 1, y: 0 }}`, `viewport={{ once: true,
  margin: "-40px" to "-100px" }}`.
- Staggered lists/grids: same entrance, `delay: i * 0.04-0.08`.
- Standard easing for larger moves: `[0.22, 1, 0.36, 1]`; springs
  (`type: "spring", stiffness: 400-500, damping: 25-40`) for
  hover/tap feedback and layout transitions (`layoutId` underlines,
  `AnimatePresence` exits).
- Respect `prefers-reduced-motion` (already handled globally in
  `styles.css`) — don't add animations that bypass it.

## Avoid generic AI aesthetic

This is a warm, editorial, Korean-skincare-shelf brand — not a SaaS
dashboard. Concretely avoid:

- Purple-to-blue gradients, glassmorphism panels, or neon accent
  colors — this palette is cream + sage green only.
- Default Inter/system-sans headings — display headings are always
  `font-serif-display`.
- Generic centered hero with an icon-in-a-circle + gradient blob
  background. Heroes here are photo-led (`FeatureRow`-style split
  layout or full-bleed image), not icon-led.
- Overusing `shadow-lg`/heavy drop shadows everywhere — this system
  uses `shadow-sm` at rest and a soft lift shadow only on hover.
- Emoji as UI icons — use `lucide-react` icons (already the project's
  icon set) at `strokeWidth={1.5-1.6}`, sized `h-4 w-4` to `h-8 w-8`
  depending on context.
- All-caps bold headlines or heavy font weights everywhere — this
  system reserves uppercase/tracked-out text (`tracking-[0.28em]`) for
  small eyebrow labels only, not headings.
- Cramming every card with a border **and** a shadow **and** a
  gradient — pick the existing single treatment (`border-border` +
  `shadow-sm`, lift on hover) and stop there.
