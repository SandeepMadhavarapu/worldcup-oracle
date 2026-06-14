# World Cup 2026 Data Source Notes

This folder is an official-data-ready data layer, not a claim that the app has a complete licensed FIFA dataset.

Current manual seed:

- FIFA public tournament pages confirm the 48-team format, 104 matches, opening date of June 11, 2026, and final date of July 19, 2026: https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/fifa-world-cup-2026-hosts-cities-dates-usa-mexico-canada
- FIFA public scores/fixtures pages list Mexico vs South Africa as Match 1 in Mexico City on June 11, 2026, and the final as Match 104 on July 19, 2026: https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/scores-fixtures
- Match 1 result is manually curated from public match-report data: Mexico 2, South Africa 0. This is a single curated completed result, not a complete official result feed.

Important boundaries:

- Do not scrape copyrighted pages blindly.
- Do not mark placeholder rows as official.
- Do not add scores unless sourced and completed.
- Keep completed-result fields optional so scheduled and placeholder rows do not imply results.
- Keep source labels on every curated row.
- Keep visible UI copy clear that this static fixture layer is incomplete until all official fixtures and results are manually curated or supplied by a licensed/live provider.
- This project has no FIFA affiliation or endorsement.
- Round-of-32 third-place placement currently uses a deterministic compatibility fallback to avoid same-group rematches where possible. It is still an approximation until the exact official matrix is manually curated.

Recommended completion workflow:

1. Manually curate groups, fixtures, venues, and bracket paths from verified public sources.
2. Keep each row's `sourceLabel` and notes up to date.
3. Run data validation tests before deployment.
4. Keep sample prediction data separate from tournament fixture data.
