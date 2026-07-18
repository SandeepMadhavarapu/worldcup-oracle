# Deployment Checklist

WorldCup Oracle is deployed at <https://worldcup-oracle-ecru.vercel.app> (Live Provider Mode). The checklist below covers redeployment.

## Before Deploying

1. Push the repository to GitHub.
2. Confirm these commands pass locally:

   ```bash
   npm run typecheck
   npm run test
   npm run lint
   npm run build
   ```

3. Keep `LIVE_DATA_PROVIDER=none` unless real server-side provider keys are configured.
4. Do not add provider keys with `NEXT_PUBLIC_`.
5. Set `NEXT_PUBLIC_SITE_URL` to the public deployment origin after the Vercel URL is known.
6. Keep Demo Mode copy visible unless durable database persistence is wired.

## Vercel Settings

- Framework preset: Next.js
- Build command: `npm run build`
- Install command: `npm install`
- Output directory: managed by Next.js

## Environment Variables

Optional for current demo:

```text
LIVE_DATA_PROVIDER=none
NEXT_PUBLIC_SITE_URL=https://your-vercel-deployment-url.vercel.app
FOOTBALL_DATA_API_KEY=
DATABASE_URL=
```

`NEXT_PUBLIC_SITE_URL` drives metadata, Open Graph URLs, `sitemap.xml`, and `robots.txt`. If it is missing, the app falls back to Vercel's deployment URL when available, then `http://localhost:3000` for local development.

The built-in rate limiter is in-memory and per-process. For production traffic, move the buckets to a shared store such as Upstash Redis, Vercel KV, Supabase, or another managed data store.

Demo leaderboard entries and bracket share URLs are in-memory only. They are useful for portfolio review, but they are not durable across redeploys or server restarts until the repository abstraction is wired to a database.

## Readiness Matrix

| Stage | Status | Requirements |
| --- | --- | --- |
| Portfolio demo | Ready | Keep Demo Mode labels, sample-data limitations, no FIFA affiliation, and not-betting-advice copy visible. |
| Public beta | Needs work | Add Supabase/Postgres persistence for brackets/leaderboards, shared rate limiting, monitoring, and production abuse controls. |
| Production | Not ready | Complete verified data curation, durable persistence, auth/abuse controls, observability, legal review, and load testing. |

The football-data key must remain server-only. Near-live scores are
provider-dependent and may gracefully degrade when the provider or key is
unavailable. Raw cinematic intro masters must stay out of `public/` and Git;
ship only the optimized WebP backdrop derivative bundled with the intro
component.

## After Deploying

1. Smoke check `/`, `/dashboard`, `/model-lab`, `/teams/argentina`.
2. Test `POST /api/predict-match`.
3. Test `POST /api/simulate-tournament`.
4. Capture screenshots listed in `public/screenshots/README.md`.
5. Update the README live demo URL and screenshot links.
