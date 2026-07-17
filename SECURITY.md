# Security Policy

## Reporting a Vulnerability

Please report vulnerabilities privately via GitHub Security Advisories
("Report a vulnerability" on the repository's Security tab) or by email to
madhavarapusandeep@gmail.com. Do not open public issues for security reports.

You can expect an acknowledgement within 7 days.

## Scope notes

- The app has no authentication, no user accounts, and stores no personal data
  beyond a user-chosen display name on demo leaderboard entries.
- Provider API keys are server-side only and must never be exposed with a
  `NEXT_PUBLIC_` prefix.
- The in-memory rate limiter is a demo control, not a production abuse control;
  this is documented in the README.
