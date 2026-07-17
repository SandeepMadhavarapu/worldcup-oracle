# WorldCup Oracle

[![CI](https://github.com/SandeepMadhavarapu/worldcup-oracle/actions/workflows/ci.yml/badge.svg)](https://github.com/SandeepMadhavarapu/worldcup-oracle/actions/workflows/ci.yml) [![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**WorldCup Oracle is a full-stack World Cup 2026 prediction intelligence PWA built with Next.js, TypeScript, explainable football modeling, and Monte Carlo tournament simulation.**

Live demo: deployment pending — see `DEPLOYMENT.md` for the checklist.

## Screenshots

Screenshots are captured after deployment; see `public/screenshots/README.md` for the shot list and captions.

## Design Notes

- The core of the project is domain logic: ratings, score probabilities, group tiebreaking, third-place qualification, seeded knockout paths, and simulation aggregation.
- It uses honest product design. Sample data is labeled, live data is never faked, and predictions are clearly educational estimates.
- It has a clean engineering split between UI, API routes, validation, prediction math, tournament rules, data loading, and future persistence.
- The codebase separates frontend systems, backend validation, data modeling, sports analytics logic, and testing so each can be reviewed independently.

## Features

- Premium dark-mode sports intelligence UI with responsive dashboard tabs.
- Cinematic CSS/SVG intro over an optimized generic stadium backdrop (WebP
  derived from ignored raw masters) — no real player likenesses or marks.
- Match predictor with win/draw/loss probabilities, expected goals, scoreline distribution, confidence, and "why this prediction" factors.
- 48-team World Cup structure: 12 groups of 4, top two advance, 8 best third-place teams, Round of 32 through final.
- Monte Carlo simulator with public-demo-safe 1, 500, and 1,000 iteration controls.
- Champion Probability, Most Likely Final, Dark Horse Detector, Upset Risk, Group Chaos Meter, Model Confidence, and Third-Place Bubble sections.
- Team intelligence pages with rating, form, attack, defense, and round probabilities.
- Demo prediction game and model-aligned placeholder leaderboard clearly labeled as temporary in-memory Demo Mode.
- PWA manifest, service worker shell caching, metadata, sitemap, and robots file.
- PostgreSQL/Supabase-ready schema with RLS notes.
- Official-data-ready 2026 tournament dataset structure with source notes and honest placeholder labels.

## Tech Stack

- Next.js App Router and Route Handlers
- TypeScript strict mode
- Tailwind CSS
- Motion for React
- Recharts
- Zod validation
- Vitest
- PostgreSQL-ready SQL schema

## Architecture

```text
src/app                 Pages, route handlers, metadata, sitemap, robots
src/components          Owned UI primitives and navigation
src/lib/api             API envelopes, typed errors, validation, rate-limit helper
src/lib/data            Sample teams, historical importer, provider-mode detection
src/lib/prediction      Elo updates, score probabilities, backtesting scaffold
src/lib/tournament      Group standings, third-place ranking, simulation engine
src/lib/leaderboard     Demo in-memory leaderboard
src/lib/repositories    Persistence abstraction with the current in-memory adapter
data/sample             Local sample historical results
data/worldcup-2026      Official-data-ready fixtures, groups, venues, paths, notes
database/schema.sql     Postgres/Supabase-ready schema
src/__tests__           Unit and route-handler tests
```

## Architecture & Limitations

WorldCup Oracle is intentionally production-presentable without pretending that
demo infrastructure is production infrastructure. The app separates the parts
that are launch-shaped from the parts that are still portfolio/demo tier.

Production-grade foundations:

- API layer uses consistent success/error envelopes, request IDs, typed route
  helpers, Zod validation, and centralized error sanitization.
- Structured access logging records method, path, request ID, status, and
  duration without logging request or response bodies.
- Live football-data.org integration is server-key only, provider-gated, cached,
  and allowed to fail closed into honest fallback UI.
- Calibration is honest about source state: real resolved matches are used only
  when available, otherwise the app labels synthetic examples as illustrative.
- Security posture includes CSP, frame protection, content-type sniffing
  protection, referrer policy, permissions policy, sitemap, robots, and PWA
  metadata.
- Domain logic is isolated and tested: prediction math, tournament simulation,
  knockout path resolution, API hardening, live-cache behavior, and calibration.

Demo-tier pieces:

- Saved brackets and leaderboard entries currently use an in-memory repository.
  They are suitable for review sessions, but reset on cold starts, redeploys, or
  process replacement.
- The public route rate limiter is also in memory and per instance. It reduces
  accidental abuse in a demo, but it is not a distributed production control.
- The leaderboard score is a model-aligned demo score from the cached baseline
  simulation, not real tournament result grading.
- The fixture/bracket matrix has an approximate resolver until the complete
  official source data is curated and locked.

Real productionization would need:

- Postgres or another durable relational store for users, saved brackets,
  leaderboard entries, simulations, model runs, fixtures, and audit history.
- Redis, Vercel KV, Upstash, or equivalent shared storage for rate-limit buckets,
  live provider cache coordination, and abuse controls across instances.
- Authentication, authorization, user-owned bracket history, profile management,
  and moderation/admin workflows.
- Observability beyond console logs: log drains, metrics, alerts, tracing, error
  reporting, and uptime checks.
- Verified data ingestion jobs, source freshness checks, backfills, migrations,
  backup/restore, load testing, legal review, and privacy/security review.

## Prediction Model

The model is a practical baseline, not a claim of real forecasting superiority.

1. Teams start with seed rating, attack, defense, form, and World Cup pedigree.
2. Historical sample results update ratings with an Elo-style formula.
3. Competition weights make World Cup and continental matches matter more than friendlies.
4. Recent matches carry more weight than older rows.
5. Expected goals are generated from rating gap, form, attack, defense, and pedigree.
6. A Poisson-style scoreline matrix estimates win/draw/loss probabilities.
7. Tournament simulations use deterministic seeds for reproducible portfolio demos.

## Tournament Rules

- 48 teams
- 12 groups of 4
- 3 group matches per team
- Win = 3 points, draw = 1 point
- Tie-breakers: points, goal difference, goals scored, head-to-head approximation, rating/seed fallback
- Top two in each group advance
- 8 best third-place teams advance
- Knockout starts at Round of 32
- Total tournament structure: 104 matches

The Round-of-32 matrix is an MVP approximation until an official verified fixture matrix is wired in. The current resolver applies a deterministic compatibility fallback to avoid same-group Round-of-32 rematches where possible, and simulation metadata labels the result as approximate.

## Dataset Mode

WorldCup Oracle defaults to **SAMPLE_DATASET_MODE**. The local teams, groups, and 49 historical sample rows are demo data for engineering review.

Provider modes:

- `LIVE_DATA_PROVIDER=none` -> `SAMPLE_DATASET_MODE`
- Provider selected without matching key -> `OFFLINE_DATASET_MODE`
- Provider selected with matching server-side key -> `LIVE_PROVIDER_MODE`

The current app never fakes live scores, never presents sample data as official, and is not betting advice.

## Near-Live Scores

An optional near-live score ticker (`LiveScoreStrip`) polls `GET /api/live` every
45 seconds, diffs the score, and flashes a subtle emerald "GOAL" pulse when a
score changes (honoring `prefers-reduced-motion`). It shows kickoff times for
upcoming matches and final scores for finished ones, and is labeled honestly as
**"Near-live, ~45s refresh"** — it does not imply instant updates. The existing
dataset-mode banner is unchanged.

- Provider: **football-data.org, FREE tier only** (no paid API). Get a key at
  <https://www.football-data.org/client/register>.
- Enable with `LIVE_DATA_PROVIDER=football-data` and `FOOTBALL_DATA_API_KEY=<key>`.
- `GET /api/live` caches results **in memory for 45 seconds**, so the provider is
  called at most once per window no matter how many clients poll — keeping us
  comfortably under the free-tier rate limit.
- Without a key, or on any provider error, the strip degrades gracefully to a
  clearly-labeled "scores unavailable" state and never crashes the page.

## 2026 Tournament Data Layer

`data/worldcup-2026` is a separate official-data-ready layer for:

- `groups.ts`
- `fixtures.ts`
- `venues.ts`
- `knockout-paths.ts`
- `source-notes.md`

This layer is intentionally separate from the sample prediction dataset. It includes a small manual seed from public tournament pages and placeholders for the rest of the official fixture curation workflow. Source notes cite public tournament and scores/fixtures pages without claiming endorsement or affiliation.

## API Routes

All APIs return a consistent envelope:

```ts
{ ok: true, data, meta }
{ ok: false, error, meta }
```

Routes:

- `GET /api/teams`
- `GET /api/groups`
- `GET /api/matches`
- `POST /api/predict-match`
- `POST /api/simulate-tournament`
- `POST /api/save-bracket`
- `GET /api/leaderboard`
- `GET /api/live` (near-live World Cup scores, cached 45s)

POST routes use Zod validation and a safer in-memory demo rate-limit helper. The limiter does not trust arbitrary `X-Forwarded-For` by itself, but it is still per-process. Public production should move rate-limit buckets to a shared store such as Upstash Redis, Vercel KV, Supabase, or another managed data store.

## Database Schema

`database/schema.sql` includes production-ready table shapes for:

- `teams`
- `fixtures`
- `historical_results`
- `dataset_versions`
- `tournament_groups`
- `matches`
- `predictions`
- `simulations`
- `model_runs`
- `user_brackets`
- `leaderboard_entries`

The schema includes useful indexes, `created_at`, `updated_at`, and Supabase RLS notes. The app currently runs without a database so the portfolio demo remains easy to install. In Demo Mode, saved leaderboard entries and shared bracket URLs are in-memory and are not durable across process restarts.

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Environment Variables

Copy `.env.example` to `.env.local` for provider/database work.

```text
LIVE_DATA_PROVIDER=none
NEXT_PUBLIC_SITE_URL=http://localhost:3000
FOOTBALL_DATA_API_KEY=
DATABASE_URL=
```

`FOOTBALL_DATA_API_KEY` is the football-data.org **free-tier** key that powers
near-live scores. Pair it with `LIVE_DATA_PROVIDER=football-data` to enable the
live ticker; leave both unset to stay in the offline dataset mode. See
[Near-Live Scores](#near-live-scores).

Do not expose provider keys through `NEXT_PUBLIC_*`.
Set `NEXT_PUBLIC_SITE_URL` to the deployed public origin before a public portfolio launch. If it is missing, metadata falls back to Vercel's deployment URL when available, then `http://localhost:3000` for local development.

## Testing

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

Current test coverage includes:

- Elo rating update
- Probability normalization
- Scoreline distribution sanity
- Group point calculation
- Standings tie-break sorting
- Best third-place ranking
- Knockout path shape
- Deterministic seeded simulation
- API validation errors and success envelopes

## Deployment

Recommended path:

1. Push to GitHub.
2. Import the repo into Vercel.
3. Keep `LIVE_DATA_PROVIDER=none` unless real provider keys are configured.
4. Add `DATABASE_URL` only after persistence is implemented.
5. Set `NEXT_PUBLIC_SITE_URL` to the public deployment origin and update the README live demo URL.
6. Add screenshots after deployment.

See `DEPLOYMENT.md` for the full checklist.

## Launch Readiness Matrix

| Stage | Suitable now? | What is ready | Required before advancing |
| --- | --- | --- | --- |
| Portfolio demo | Yes | Sample dataset, explainable predictions, in-memory demo leaderboard, optimized cinematic intro, API validation, and local tests. | Keep Demo Mode labels visible and do not claim official/live completeness. |
| Public beta | Partially | UI, route handlers, server-only football-data key path, and provider-dependent near-live score fallback. | Add durable Supabase/Postgres brackets and leaderboard storage, shared/distributed rate limiting, monitoring, and production environment review. |
| Production | Not yet | Core app architecture and database schema direction are in place. | Finish verified data curation, durable persistence, auth/abuse controls, observability, legal copy review, and load/performance testing. |

Notes: raw intro masters must stay out of `public/` and Git; keep them under the
gitignored `assets-src/intro-preview/` folder and publish only optimized
derivatives. The football-data key is server-only, live scores are
provider-dependent, WorldCup Oracle has no official affiliation, and
predictions are educational estimates, not betting advice.

## Limitations

- Sample data is intentionally compact and incomplete.
- Model metrics are scaffolded on sample rows and are not out-of-sample calibration claims.
- The bracket pairing matrix is deterministic but approximate until the exact official matrix is fully curated.
- Demo leaderboard and shared bracket links are in-memory and reset with the server.
- No production auth or database writes are active yet.
- The in-memory rate limiter is appropriate for a demo, not a distributed production deployment.
- Public beta needs durable Supabase/Postgres storage plus shared rate limiting
  before real users rely on saved brackets or leaderboard rankings.
- Predictions are educational estimates, not official tournament data and not betting advice.
- Official fixtures are not fully curated in-repo yet; placeholder rows are explicitly labeled.

## Future Improvements

- Wire a verified football data provider through server-only imports.
- Add Supabase auth and Postgres persistence for user brackets.
- Replace bracket approximation with official fixture mapping once available from a verified source.
- Add larger historical imports and true out-of-sample calibration.
- Add Playwright smoke tests after a stable deployment URL exists.
- Add screenshots and a short product demo video.
- Complete manual curation of `data/worldcup-2026` from verified public sources.

## Resume Bullet Examples

- Built a full-stack World Cup 2026 prediction platform using Next.js, TypeScript, API routes, Elo ratings, Poisson score modeling, and Monte Carlo tournament simulation.
- Implemented 48-team tournament logic including group standings, third-place qualification, knockout brackets, seeded simulations, and explainable probability outputs.
- Designed a production-style sports analytics dashboard with responsive UI, animated probability visualizations, API validation, automated tests, and deployment-ready documentation.

## License

MIT — see [LICENSE](LICENSE).
