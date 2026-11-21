# Release Register

Google Play release records for Renewable Manager. Created 21 Nov 2026. Plan and official rules: `docs/release/GOOGLE_PLAY_RELEASE_PLAN.md`. The Command Center parses this file; edit the tables here, never the dashboard.

Status vocabulary: `DONE` (only with evidence), `PARTIAL` (repo record exists, not confirmed in Play Console), `IN_PROGRESS`, `NOT_STARTED`, `UNVERIFIED` (owner must confirm in Play Console), `BLOCKED`, `N/A`. A row marked `DONE` without evidence is shown as `UNVERIFIED` on the dashboard.

Privacy: this register is published. Testers appear only as pseudonymous IDs (T01, T02, …). Never write names, email addresses, phone numbers or account handles here.

## Account verification

| Item | Value | Status | Evidence |
|---|---|---|---|
| Account type | Personal (decision recorded 4 Nov 2026; not proven in Play Console) | UNVERIFIED | docs/release/DECISIONS.md row 2; owner to confirm in Play Console |
| Account owner | Personal Google account (project memory); not a company account | UNVERIFIED | owner to confirm in Play Console |
| Account creation date | before 5 Nov 2026 (app record dated 5 Nov 2026 in repo); exact date not recorded | UNVERIFIED | docs/release/PLAY_APP_SETUP.md; owner to confirm in Play Console |
| 12 testers / 14 days rule applies | Likely yes if personal and created after 13 Nov 2023 | UNVERIFIED | owner to confirm the requirement is shown in Play Console |
| Identity verification | Not recorded | UNVERIFIED | owner to confirm in Play Console |
| Developer contact email verified | Not recorded | UNVERIFIED | owner to confirm in Play Console |
| App created in Play Console | Recorded 5 Nov 2026 in repo | PARTIAL | docs/release/PLAY_APP_SETUP.md |

## Play Console readiness

| Item | Requirement | Status | Evidence |
|---|---|---|---|
| Target API level | API 36 or higher for new apps (from 31 Aug 2026) | PARTIAL | Unity ProjectSettings AndroidTargetSdkVersion 36, AndroidMinSdkVersion 26; no AAB built with it yet |
| Package name | Locked at first upload | PARTIAL | Unity ProjectSettings applicationIdentifier com.konfersi.renewablemanager |
| Version | versionName / versionCode | PARTIAL | Unity ProjectSettings bundleVersion 0.2.0-hc2, AndroidBundleVersionCode 20005 |
| Android App Bundle | AAB required for new apps | NOT_STARTED | docs/release/BUILD_AAB.md (procedure only; no release candidate) |
| Play App Signing | Enrollment on first release | UNVERIFIED | owner to confirm in Play Console |
| Privacy policy URL | Public URL, also in game | PARTIAL | docs/release/PLAY_APP_SETUP.md (v1.0 live 7 Nov per repo; v1.1 for SDK build not deployed) |
| Data safety form | Required for closed/open/production tracks | PARTIAL | docs/release/DATA_SAFETY_SOFTLAUNCH.md (answers drafted, not submitted) |
| Content rating (IARC) | Required for all apps | PARTIAL | docs/release/PLAY_APP_CONTENT_ANSWERS.md (answers drafted, expected 3+) |
| Ads declaration | Declare before target audience | PARTIAL | docs/release/PLAY_APP_CONTENT_ANSWERS.md (tester build No, soft-launch build Yes) |
| Target audience and content | Age groups declared | PARTIAL | docs/release/PLAY_APP_SETUP.md (13–15, 16–17, 18+ planned) |
| App access instructions | Required if parts are restricted | UNVERIFIED | owner to confirm in Play Console |
| Store listing | Text, graphics, contact | PARTIAL | docs/marketing/PLAY_LISTING.md |

## Store listing checklist

| Item | Status | Evidence |
|---|---|---|
| App name (≤ 30 chars) | PARTIAL | docs/marketing/PLAY_LISTING.md |
| Short description ID + EN | PARTIAL | docs/marketing/PLAY_LISTING.md |
| Full description ID + EN | PARTIAL | docs/marketing/PLAY_LISTING.md |
| App icon 512×512 | PARTIAL | docs/marketing/PLAY_LISTING.md (ICON-APP-A-V001 approved) |
| Feature graphic 1024×500 | NOT_STARTED | docs/marketing/PLAY_LISTING.md §9 (to be made) |
| Phone screenshots (current 15× build) | NOT_STARTED | — |
| Category and tags | PARTIAL | docs/marketing/PLAY_LISTING.md §4 |
| Public contact email | UNVERIFIED | owner to confirm in Play Console |
| Privacy policy link in listing | PARTIAL | docs/release/PLAY_APP_SETUP.md |

## Testers

Pseudonymous IDs only. Dates ISO (YYYY-MM-DD). An invitation is not an opt-in; only the Opted-in date counts. Fill Opted-out when a tester leaves.

| ID | Invited | Opted-in | Opted-out | Last build | Feedback count |
|---|---|---|---|---|---|

## Qualifying period

| Item | Value |
|---|---|
| Closed test track | NOT_STARTED |
| Required testers | 12 |
| Required consecutive days | 14 |
| Start date (first day with ≥ 12 opted in) | NOT_STARTED |
| Qualified date | NOT_STARTED |

## Production access application log

| Date | Event | Result | Evidence |
|---|---|---|---|

## Release candidates

| RC | Version name | Version code | Commit | Track | Build evidence | Status |
|---|---|---|---|---|---|---|

## Soft-launch markets

| Market | Country code | Phase | Availability | Rollout % | Status |
|---|---|---|---|---|---|
| Indonesia | ID | P5 soft launch | Production, restricted countries | 100 (first release cannot be staged) | NOT_STARTED |
| Philippines | PH | P5 soft launch | Production, restricted countries | 100 (first release cannot be staged) | NOT_STARTED |
| All other countries | — | after G-SOFT | Not available | — | NOT_STARTED |

## Launch KPIs

Targets are the green gates from `docs/marketing/SOFTLAUNCH_PLAN_20261108.md` §8.1 and `docs/design/PROFIT_STRATEGY_15X.md` §6 (ARPDAU plan: `docs/design/ARPDAU_PLAN_15X.md`). Actuals are not connected to any data source yet.

| KPI | Target | Actual | Source |
|---|---|---|---|
| Installs (organic, first 3 weeks) | ≥ 500 | NOT_RECORDED | NOT_CONNECTED |
| DAU | ≥ 620 (break-even, PROFIT_STRATEGY_15X §3) | NOT_RECORDED | NOT_CONNECTED |
| WAU | NOT_DEFINED | NOT_RECORDED | NOT_CONNECTED |
| D1 retention | ≥ 35 % | NOT_RECORDED | NOT_CONNECTED |
| D7 retention | ≥ 12 % | NOT_RECORDED | NOT_CONNECTED |
| Session length | NOT_DEFINED (design session 6–8 min) | NOT_RECORDED | NOT_CONNECTED |
| Tutorial completion | ≥ 70 % | NOT_RECORDED | NOT_CONNECTED |
| First power (median) | ≤ 8 min | NOT_RECORDED | NOT_CONNECTED |
| Crash-free sessions | ≥ 99 % | NOT_RECORDED | NOT_CONNECTED |
| ANR rate | NOT_DEFINED | NOT_RECORDED | NOT_CONNECTED |
| IAP conversion (payers / DAU / month) | ≥ 3,5 % | NOT_RECORDED | NOT_CONNECTED |
| Ad engagement (% DAU with ≥ 1 ad) | ≥ 50 % | NOT_RECORDED | NOT_CONNECTED |
| Ads per DAU | ≥ 2,85 | NOT_RECORDED | NOT_CONNECTED |
| ARPDAU ID | ≥ US$0,012 | NOT_RECORDED | NOT_CONNECTED |
| Economy balance (paid vs free tempo gap) | ≤ 15 % | NOT_RECORDED | NOT_CONNECTED |
| Play rating | ≥ 4,3 | NOT_RECORDED | NOT_CONNECTED |
