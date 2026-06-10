# LinkedIn Post Draft

I built **WorldCup Oracle**, a full-stack World Cup 2026 prediction intelligence app.

It is not another CRUD dashboard. The interesting parts are the domain systems:

- Elo-style team ratings from historical sample results
- Poisson scoreline probabilities
- 48-team group-stage simulation
- best third-place qualification logic
- seeded Monte Carlo tournament runs
- explainable prediction factors
- typed API envelopes and Zod validation
- Postgres/Supabase-ready schema design

I also kept the product honest: the current version runs in Sample Dataset Mode, does not fake live scores, does not claim FIFA affiliation, and is not betting advice.

Tech stack: Next.js App Router, TypeScript, Tailwind CSS, Recharts, Motion for React, Zod, Vitest, and a PostgreSQL-ready schema.

Next step: connect a verified data provider and persist user brackets with Supabase/Postgres.
