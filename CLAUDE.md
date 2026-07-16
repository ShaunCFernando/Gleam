# Gleam

A K-beauty routine quiz web app: product catalog, a quiz-based scoring engine
that maps answers to routine recommendations, and shareable results.

## Stack

- Frontend: Vite + React + TypeScript, Tailwind CSS, Radix UI primitives, Framer Motion, react-three-fiber (3D)
- Backend: FastAPI (Python), SQLAlchemy, Postgres
- Package managers: npm (frontend), pip (backend)
- Local dev: Docker Compose (frontend + backend + Postgres)
- Deploy: Render (backend + Postgres, via `render.yaml`), Vercel (frontend)

## How to run

- Local (Docker, no Node/Python install needed): `docker compose up --build`
  - Frontend: http://localhost:5173, Backend: http://localhost:8000/docs
- Frontend only: `cd frontend && npm install && npm run dev`
- Backend only: `cd backend && python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt && uvicorn app.main:app --reload`
- Build (frontend): `cd frontend && npm run build`

No test suite or lint/typecheck script exists yet — test-runner should flag this rather than invent one.

## Conventions

- Product/concern/routine data lives in Postgres (`backend/app/models.py`), never hardcoded in the frontend. `backend/app/seed_data.py` is one-time seed content only.
- Scoring logic (`scoreProduct`/`buildRoutine`) lives only in `backend/app/scoring.py` — one source of truth, not duplicated client-side.
- Every catalog product has a `source`: `curated` (hand-tagged, only set the quiz scores against) or `external` (bulk-imported from Open Beauty Facts, browse-only, no price/safety tags — never used in quiz matching).
- Frontend UI follows the `frontend-design` skill (typography/spacing/color/component patterns) — check it before adding or restyling components rather than inventing ad hoc values.
- Don't add new dependencies without asking.

## Secrets & config

- `DATABASE_URL`, `ALLOWED_ORIGINS`, `VITE_API_URL` are env vars, never hardcoded. `.env.example` holds placeholders.
- No API keys or secrets belong in the frontend bundle — it's public the moment it deploys.

## Known footguns

- Client-side React bundle is public: never ship a secret to it.
- A malformed product row (missing `skin_types`/`concerns`/`actives`/`sensitive_safe`) breaks scoring silently for `curated` products — validate against the shared schema.
- `import_external.py` re-runs are safe (dedup by barcode, never overwrites curated data) — don't add one-off manual cleanup scripts for this.
- Photo quality gating (`backend/app/image_quality.py`) is a heuristic pre-filter, not a guarantee — a missing photo beats a bad one; don't relax the reject bar to force more photos in.

## Current goals

- **Expand catalog/content**: grow coverage via `import_external.py` (Open Beauty Facts) and add more hand-tagged `curated` products so quiz matching isn't limited to the initial ~28.
- **Cinematic scroll animation**: page-spanning visuals that move as the user scrolls, photorealistic and richly detailed — not the simple 3D geometry/silhouettes currently in `react-three-fiber`/`postprocessing`. Reference: Apple product pages — assets move with real weight and physics, not a canned CSS scroll-fade. Images should layer behind/around text (parallax), not sit static while the page scrolls past them. Reduce dead whitespace, but don't fill it with filler components just to fill it.
- **Monetization path**: this is headed toward an app-store release that makes money. Before building any new feature, work out how it fits a revenue model (freemium/subscription tiers, paid unlocks) — don't build features that have no monetization story and then retrofit one.
- **AI/ML features**: leverage AI for personalization beyond the static quiz — e.g. a face-scan analysis feature that gives pointed skin recommendations instead of (or alongside) the questionnaire. Gate AI-driven features behind the monetization plan above (e.g. premium/subscription) rather than shipping them free.
- **Visual consistency**: the design system in `.claude/skills/frontend-design/SKILL.md` (typography, 8px spacing rhythm, HSL color tokens, motion conventions, "avoid generic AI aesthetic") is the single source of truth for keeping this professional and deployable — extend it when new patterns (like scroll-cinematics) are added, don't fork off ad hoc values.

## Workflow

builder → test-runner → security-reviewer → git-publisher.
Never push unless VERDICT PASS and tests pass (or test-runner has confirmed no test suite exists).
