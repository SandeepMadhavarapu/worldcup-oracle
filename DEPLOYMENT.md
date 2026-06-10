# Deployment Checklist

WorldCup Oracle is ready for Vercel deployment in Sample Dataset Mode.

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
5. Update `metadataBase` in `src/app/layout.tsx` after the Vercel URL is known.
6. Update `baseUrl` in `src/app/sitemap.ts` after the Vercel URL is known.

## Vercel Settings

- Framework preset: Next.js
- Build command: `npm run build`
- Install command: `npm install`
- Output directory: managed by Next.js

## Environment Variables

Optional for current demo:

```text
LIVE_DATA_PROVIDER=none
FOOTBALL_DATA_API_KEY=
API_FOOTBALL_KEY=
DATABASE_URL=
```

## After Deploying

1. Smoke check `/`, `/dashboard`, `/model-lab`, `/teams/argentina`.
2. Test `POST /api/predict-match`.
3. Test `POST /api/simulate-tournament`.
4. Capture screenshots listed in `public/screenshots/README.md`.
5. Update the README live demo URL and screenshot links.
