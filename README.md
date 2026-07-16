# Gleam

A K-beauty routine quiz. React frontend, FastAPI backend, Postgres database.

```
frontend/   Vite + React SPA — Tailwind CSS, shadcn/ui-style components (src/components/ui),
            Framer Motion page/step transitions. Pages: Home, About (Why K-Beauty),
            Quiz, Catalog, Results (src/pages).
backend/    FastAPI app (scoring, catalog, saved/shared routines)
```

The product catalog, concerns list, and every saved/shared routine live in
Postgres — nothing product-related is hardcoded in the frontend anymore.
`backend/app/seed_data.py` is the one-time seed content; after that the app
only reads from the database.

## Run it locally (Docker)

Requires Docker Desktop. No local Node or Python install needed.

```
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend: http://localhost:8000 (docs at /docs)
- Postgres: localhost:5432 (user/pass/db: `seoulshelf`)

The backend seeds the database automatically on first boot
(`backend/app/seed.py`, safe to re-run — skips if data already exists).

To pull in a much bigger, photographed catalog from
[Open Beauty Facts](https://world.openbeautyfacts.org) (free/open cosmetics
database), run:
```
docker compose exec backend python -m app.import_external
```
See "Catalog data: curated vs. external" below for what this does and why.

### Local dev without Docker

Backend:
```
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
# start a local Postgres and set DATABASE_URL, or copy .env.example
python -m app.seed
uvicorn app.main:app --reload
```

Frontend:
```
cd frontend
npm install
npm run dev
```

## API

| Endpoint | Description |
|---|---|
| `GET /api/quiz-config` | Quiz question structure, concerns pulled from DB |
| `GET /api/concerns` | All skin concerns |
| `GET /api/products` | Catalog, filterable by `q`, `category`, `skin_type`, `max_price`, `source` (`curated`/`external`), sortable via `sort` |
| `GET /api/products/{id}` | Single product |
| `POST /api/routines` | Submit quiz answers → scores the catalog, saves the submission, returns a routine + share slug |
| `GET /api/routines/{slug}` | Fetch a routine by its share slug (recomputed live against current catalog data) |

## Catalog data: curated vs. external

Every product row has a `source`:

- **`curated`** — the original ~28 hand-tagged products. These are the only
  ones with verified `skin_types`/`concerns`/`actives`/`sensitive_safe` data,
  so `scoring.build_routine()` only ever selects from this set. This is what
  makes the quiz's sensitive-skin exclusion trustworthy.
- **`external`** — bulk-imported from Open Beauty Facts by
  `backend/app/import_external.py`. Real brand/name/photo/ingredient-list
  data, searched for by brand name and classified into our 7 categories by
  keyword (Open Beauty Facts' own category tagging for cosmetics is too
  sparse to browse by). These have **no price and no safety tags** — they
  exist to make `/catalog` richer to browse, and are filtered out of quiz
  matching entirely rather than guessed at.

The same script also does a conservative best-effort pass to backfill real
photos onto the curated products (matches only when brand matches, the
candidate classifies into the *same category* as the curated product, and
ALL of the curated product's significant name words appear in the
candidate's name — partial overlap isn't enough, since product lines often
share a name prefix across different real SKUs).

Re-running the import is safe — it skips products already in the database
(deduped by barcode) and never overwrites curated data.

### Photo quality bar

Every photo — curated or external — must be a clear, in-focus shot on a
plain white/light background with nothing else in frame. Crowdsourced photos
vary wildly (hands, cluttered rooms, blurry close-ups, price stickers), so
`backend/app/image_quality.py` rejects a candidate photo automatically if:
- it's a tiny/broken image,
- its corners aren't bright and uniform (a proxy for "plain light background"),
- or it isn't sharp enough (a proxy for "in focus").

This is a heuristic, not a guarantee — it can't detect every obstruction
(e.g. a hand against a white wall could pass), so it's a pre-filter, not the
final word. A missing photo (→ the catalog's placeholder tile) always beats
a bad one: `import_external_products` skips a product entirely if its only
candidate photo fails the bar, rather than importing it photo-less.

## Deploying

**Backend + Postgres → Render**
1. Push this repo to GitHub.
2. In Render: New → Blueprint → point at the repo (uses `render.yaml` at the root — provisions a free Postgres instance and the API as a Docker web service).
3. After the frontend is deployed, update the `ALLOWED_ORIGINS` env var on the `seoulshelf-api` service to the frontend's real URL.

**Frontend → Vercel**
1. In Vercel: New Project → import the repo → set root directory to `frontend/`.
2. Set env var `VITE_API_URL` to the deployed Render backend URL.
3. Deploy (`vercel.json` in `frontend/` handles the SPA rewrite for client-side routing).

## What changed from the original prototype

- Product/concern data moved from hardcoded JS arrays into Postgres tables (`backend/app/models.py`), seeded once from `seed_data.py`.
- Matching logic (`scoreProduct`/`buildRoutine`) moved to the backend (`backend/app/scoring.py`) so scoring is centralized and consistent for every client.
- Quiz answers are POSTed to the API, which persists the submission and returns a shareable slug (`/r/:slug`) instead of routine results only existing in local component state.
- Added a `/catalog` page to search/filter/browse the full product catalog directly.
- Quiz progress now persists to `localStorage` so a refresh doesn't lose your place, plus a step-transition animation.
- Bulk-imported real, photographed products from Open Beauty Facts (browse-only, see above), plus backfilled real photos onto a few curated products — gated by an automated + manually-reviewed photo quality bar (clear, white background, no obstructions).
