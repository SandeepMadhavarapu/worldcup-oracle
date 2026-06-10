# World Cup 2026 Data Source Notes

This folder is an official-data-ready data layer, not a claim that the app has a complete licensed FIFA dataset.

Current manual seed:

- FIFA public tournament pages confirm the 48-team format, 104 matches, opening date of June 11, 2026, and final date of July 19, 2026: https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/fifa-world-cup-2026-hosts-cities-dates-usa-mexico-canada
- FIFA public scores/fixtures pages list Mexico vs South Africa as Match 1 in Mexico City on June 11, 2026, and the final as Match 104 on July 19, 2026: https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/scores-fixtures

Important boundaries:

- Do not scrape copyrighted pages blindly.
- Do not mark placeholder rows as official.
- Do not add scores unless sourced and completed.
- Keep source labels on every curated row.
- This project has no FIFA affiliation or endorsement.

Recommended completion workflow:

1. Manually curate groups, fixtures, venues, and bracket paths from verified public sources.
2. Keep each row's `sourceLabel` and notes up to date.
3. Run data validation tests before deployment.
4. Keep sample prediction data separate from tournament fixture data.
