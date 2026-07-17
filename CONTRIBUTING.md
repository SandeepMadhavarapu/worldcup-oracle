# Contributing

Thanks for your interest in WorldCup Oracle.

## Development

```bash
npm install
npm run dev        # local dev server
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
npm test           # vitest suite
npm run build      # production build
```

All four checks must pass before a PR is merged; CI enforces them.

## Guidelines

- Keep domain logic (`src/lib`) pure and framework-free; inject clocks, fetch,
  and randomness so behavior stays unit-testable.
- Every API route goes through `apiHandler` and returns the standard envelope.
- Never present sample or synthetic data as real: keep dataset/source labels
  intact when touching UI.
- Add or update tests alongside behavior changes.
