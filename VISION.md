# Gleam — Roadmap

Working backlog. Keep items small, concrete, and independently shippable — one item
per PR, with clear acceptance criteria so there's no ambiguity about what "done" means.

## Product vision (stable context)
Gleam helps people find K-beauty products through a short quiz, and is headed toward
an app-store release that makes money. Priorities, in order:
1. Recommendation quality (the quiz should feel personal and accurate).
2. Trust (clear reasons for each recommendation, no dark patterns).
3. A cinematic, professional feel — see `CLAUDE.md` and the `frontend-design` skill.
4. Every new feature should have a plausible monetization story before it's built.

Constraints: recommendation logic stays pure/testable; UI as a state machine; no new
dependencies without a note explaining why; follow `frontend-design` for anything visual.

## Next up
- [ ] Add a "why we picked this" one-line explanation under each recommended product on the Results page, derived from the quiz answers that scored it. Acceptance: every recommendation shows a reason; scoring logic unchanged; unit test covers the explanation function.
- [ ] Add a scroll-linked parallax hero on the Home page: a full-bleed image that moves at a different scroll speed than the heading text layered on top of it, using Framer Motion's `useScroll`/`useTransform` (already a dependency, no new one). Acceptance: image and text move at visibly different rates while scrolling; respects `prefers-reduced-motion` (already handled globally in `styles.css`); no new dependency; matches `frontend-design` color/typography tokens.
- [ ] Add a skin-concern filter (acne, dryness, sensitivity) on the Catalog page that re-ranks results. Acceptance: filter is pure, covered by tests, and never returns an empty list (falls back to closest matches).

## Needs a product decision first
- Face-scan / skin analysis feature: needs a decision on which service or model to call, cost per scan, and how it's gated (free vs. premium) before any code is written.
- Subscription/premium tier: needs a decision on what's free vs. paid before a data model or paywall is built.

## Done
```
```
