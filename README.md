# WorldCup Oracle

**WorldCup Oracle is a full-stack World Cup 2026 prediction intelligence PWA built with Next.js, TypeScript, explainable football modeling, and Monte Carlo tournament simulation.**

Live demo placeholder: `https://your-vercel-deployment-url.vercel.app`

## Screenshots

Add screenshots after deployment:

- Landing page hero and analytics preview: `public/screenshots/landing-hero.png`
- Tournament dashboard analytics: `public/screenshots/dashboard-analytics.png`
- Match predictor explanation panel: `public/screenshots/match-predictor.png`
- Bracket simulator champion probability chart: `public/screenshots/tournament-simulator.png`
- Team intelligence page: `public/screenshots/team-intelligence.png`
- Model Lab: `public/screenshots/model-lab.png`

See `public/screenshots/README.md` for polished captions and capture guidance.

## What Makes This Impressive

- It is not a CRUD clone. The hard part is domain logic: ratings, score probabilities, group tiebreaking, third-place qualification, seeded knockout paths, and simulation aggregation.
- It uses honest product design. Sample data is labeled, live data is never faked, and predictions are clearly educational estimates.
- It has a clean engineering split between UI, API routes, validation, prediction math, tournament rules, data loading, and future persistence.
- It gives interviewers multiple discussion paths: frontend systems, backend validation, data modeling, sports analytics, testing, deployment, and product ethics.

## Features

- Premium dark-mode sports intelligence UI with responsive dashboard tabs.
- Match predictor with win/draw/loss probabilities, expected goals, scoreline distribution, confidence, and "why this prediction" factors.
- 48-team World Cup structure: 12 groups of 4, top two advance, 8 best third-place teams, Round of 32 through final.
- Monte Carlo simulator with 1, 1,000, and 10,000 iteration controls.
- Champion Probability, Most Likely Final, Dark Horse Detector, Upset Risk, Group Chaos Meter, Model Confidence, and Third-Place Bubble sections.
- Team intelligence pages with rating, form, attack, defense, and round probabilities.
- Demo prediction game and leaderboard clearly labeled as in-memory Demo Mode.
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
src/lib/repositories    Persistence abstraction with in-memory and Postgres-ready adapters
data/sample             Local sample historical results
data/worldcup-2026      Official-data-ready fixtures, groups, venues, paths, notes
database/schema.sql     Postgres/Supabase-ready schema
src/__tests__           Unit and route-handler tests
```

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

The Round-of-32 matrix is an MVP approximation until an official verified fixture matrix is wired in.

## Dataset Mode

WorldCup Oracle defaults to **SAMPLE_DATASET_MODE**. The local teams, groups, and 49 historical sample rows are demo data for engineering review.

Provider modes:

- `LIVE_DATA_PROVIDER=none` -> `SAMPLE_DATASET_MODE`
- Provider selected without matching key -> `OFFLINE_DATASET_MODE`
- Provider selected with matching server-side key -> `LIVE_PROVIDER_MODE`

The current app never fakes live scores, never presents sample data as official, and is not betting advice.

## 2026 Tournament Data Layer

`data/worldcup-2026` is a separate official-data-ready layer for:

- `groups.ts`
- `fixtures.ts`
- `venues.ts`
- `knockout-paths.ts`
- `source-notes.md`

This layer is intentionally separate from the sample prediction dataset. It includes a small manual seed from FIFA public pages and placeholders for the rest of the official fixture curation workflow. Source notes cite FIFA public tournament and scores/fixtures pages without claiming endorsement or affiliation.

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

POST routes use Zod validation and a small in-memory rate-limit-ready helper.

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

The schema includes useful indexes, `created_at`, `updated_at`, and Supabase RLS notes. The app currently runs without a database so the portfolio demo remains easy to install.

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
FOOTBALL_DATA_API_KEY=
API_FOOTBALL_KEY=
DATABASE_URL=
```

Do not expose provider keys through `NEXT_PUBLIC_*`.

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
5. Update `metadataBase`, sitemap URL, and README live demo URL.
6. Add screenshots after deployment.

See `DEPLOYMENT.md` for the full checklist.

## Limitations

- Sample data is intentionally compact and incomplete.
- Model metrics are scaffolded on sample rows and are not out-of-sample calibration claims.
- The bracket pairing matrix is deterministic but approximate.
- Demo leaderboard is in-memory and resets with the server.
- No production auth or database writes are active yet.
- Predictions are educational estimates, not official FIFA data and not betting advice.
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
