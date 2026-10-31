# Developer beta - test protocol

## Purpose
Determine whether someone with little web-hosting knowledge can create, customize and publish a credible portfolio without assistance.

## Suggested cohort
Invite 5-8 consenting participants across frontend, backend, AI/ML, data and full-stack development. Use staging or a controlled invite-only production environment, not the local HTML simulation. Never add real third-party personal information without consent.

## Tasks for each participant

1. Register with their own account and confirm email.
2. Enter a headline, professional introduction, GitHub and LinkedIn URLs.
3. Create two projects, adding at least one screenshot and one case study.
4. Choose one of the three templates; compare desktop and mobile views.
5. Customize a hero or project section using the B1 visual editor.
6. Save the draft, close the app, return and check that changes persisted.
7. Publish at a unique subdomain; open the public page on mobile and desktop.
8. Edit again without republishing, then republish and verify changes.
9. Submit feedback through Dashboard > Beta feedback.

## What to record

| Metric | Target / interpretation |
|---|---|
| Completion without intervention | Record each step a participant cannot complete; no fabricated success rate |
| Time to first published portfolio | Product goal is 15-20 minutes, **not yet validated** |
| Publish reliability | Zero unresolved critical publishing failures during the final rehearsal |
| Responsive display | No horizontal overflow, missing controls, or clipped content at tested widths |
| Security isolation | All two-account access attempts must be blocked |
| Accessibility | Keyboard controls and focus indicators usable for core tasks |
| User feedback | Reproducible bugs filed with severity and steps; no secrets in reports |

## Triage policy

- **Blocker:** loss of another user's privacy, exposed service credentials, incorrect public content ownership, account takeover, draft leaks, or unusable publishing -> no-go.
- **Major:** broken upload, editor data loss, nonworking authentication flows, severe mobile rendering issues -> fix before expanding beta.
- **Minor:** copy, spacing or nonessential workflow improvements -> backlog with owner and follow-up.

## Go/no-go review
The operator must check: passing CI build and typecheck, executed staging SQL/RLS tests, real two-account browser tests, wildcard HTTPS publishing/rollback, verified email confirmation and reset, backups and restore rehearsal, and usable monitoring/incident response. Record dates, testers and evidence without sharing passwords or secrets.
