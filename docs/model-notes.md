# Model Notes — Constants, Simplifications, Provenance

This file exists so no number in the model is unexplained. Everything below is
a **heuristic engineering choice**, not a fitted parameter: the sample dataset
(49 matches) is far too small to fit against, and the project says so honestly
wherever predictions are shown.

## Elo update (`src/lib/prediction/elo.ts`)

| Constant | Value | Rationale |
|---|---|---|
| Base K-factor | 28 | Between club-football K≈20 and World-Cup-style K≈35–60; chosen so 49 sample matches visibly reorder ratings without letting any single result dominate. |
| Home advantage | 42 rating pts | ≈55–60% expected score for the home side, the commonly cited international home edge; zeroed on neutral venues. |
| Margin multiplier | 1 + 0.12·min(4, goal margin) | Diminishing credit for blowouts, capped at 4-goal margins (a 1.48× ceiling), in the spirit of WorldFootballElo's margin adjustment. |
| Competition weights | WC 1.45 / continental 1.22 / qualifier 1.0 / friendly 0.72 | Ordinal importance; ratios chosen to keep a friendly from ever outweighing a qualifier. |
| Recency weight | 0.55 + 0.45·e^(−age/3yr) | Old matches keep ≥55% influence; ~3-year half-life for the decaying part. Anchored to a fixed training cutoff (2026-06-01) so rebuilds are reproducible. |

## Expected goals (`src/lib/prediction/match.ts`)

`xG = 1.22 · exp(Δrating/760 + 0.52·(attack−1) − 0.42·(oppDefense−1) + Δform/46 + 0.14·Δpedigree)`,
clamped to [0.22, 3.65] (shared constants with the Monte Carlo sampler).

- 1.22 base ≈ average goals per team per match in recent World Cups (~2.5 total).
- 760 divisor: a 400-point Elo gap (≈10× win-odds edge) moves xG by ~e^0.53 ≈ 1.7× — deliberately softer than the win-probability curve, since football margins compress.
- Attack/defense coefficients (0.52 / −0.42): attacking quality moves scorelines slightly more than defensive quality resists them; both are damped so the clamps rarely bind.
- Form divisor 46 keeps the form signal (±16 range) worth at most ~±0.4 in the exponent.
- Pedigree coefficient 0.14 is a small tournament-experience nudge, never decisive.
- Clamps [0.22, 3.65]: outside 0.2–3.7 xG, single-match football outcomes are essentially unheard of at international level.

## Confidence score

`0.42 + 0.5·|P(A win) − P(B win)| + 0.08·(1 − P(draw))`, clamped [0.38, 0.91].
This is a **presentation heuristic** ("how separated are the teams"), not a
calibrated statistical confidence — the UI copy says so. It is intentionally
capped below 1 so the model never displays certainty.

## Tournament simulation simplifications

- **Penalty shootouts** are a weighted coin flip using the two teams' win
  probabilities (floored at 5%). Extra time is not modeled separately.
- **Group tiebreaks** implement points → goal difference → goals scored →
  head-to-head → rating; FIFA's later criteria (fair-play points, drawing of
  lots) are replaced by a deterministic seeded jitter so simulations are
  reproducible. Affects only exact ties through five criteria.
- **Round-of-32 third-place mapping** is an approximation of the official
  allocation matrix; simulation metadata flags this (`isApproximation: true`).
- **Scoreline grid** truncates at 6 goals per team and renormalizes; the
  truncated mass at international level is < 0.1%.

## Data provenance

- `data/sample/historical-results.json` (49 rows) and all team attributes in
  `src/lib/data/teams.ts` (eloSeed, attack, defense, form, pedigree) are
  **hand-authored demo data** for engineering review — not measurements. This
  is the project's declared Sample Dataset Mode.
- Real accuracy reporting comes exclusively from the live calibration path
  (`/calibration`), which grades the engine against finished matches from
  football-data.org and refuses to blend real and synthetic sources.
