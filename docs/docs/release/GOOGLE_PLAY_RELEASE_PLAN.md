# Google Play Release Plan

Release management workstream for Renewable Manager (package `com.konfersi.renewablemanager`). Created 21 Nov 2026 on owner directive. This file is the source of truth; the Command Center RELEASE MANAGEMENT section is a projection of it and of `docs/release/RELEASE_REGISTER.md`.

All dates are **PROVISIONAL** targets. Per the project rule "release follows readiness" (15 Nov 2026), a date is a planning anchor, not a deadline: a phase starts only when its gate is proven. No release action (AAB build, Play Console change, upload, tester invitation) is taken from this plan without an explicit owner request. iOS is **deferred** (out of scope for this plan).

## Separate gates

Each gate is independent. Passing one never implies the next.

| Gate | Meaning | Proven by |
|---|---|---|
| G-ENG | Engineering complete | Task register ACCEPTED + device validation (not VPS screenshots) |
| G-COMPLY | Play compliance | Every Play Console readiness row DONE with evidence |
| G-CLOSED | Closed testing qualified | ≥ 12 testers opted in continuously ≥ 14 days (tracker in RELEASE_REGISTER) |
| G-PROD | Production access granted | Play Console decision recorded in the application log |
| G-SOFT | Soft launch validated | Launch KPIs measured against targets with an adequate sample |
| G-ROLL | Rollout | Staged rollout percentages recorded per release |

## Timeline

| Phase | Name | Target | Gate | Status | Evidence |
|---|---|---|---|---|---|
| P1 | Account and policy verification | 2026-11-28 (PROVISIONAL) | G-COMPLY | IN_PROGRESS | docs/release/RELEASE_REGISTER.md |
| P2 | Internal QA (internal testing track, device validation incl. A57) | 2026-11-29 (PROVISIONAL) | G-ENG | NOT_STARTED | — |
| P3 | Closed testing (≥ 12 testers × 14 days) | 2026-11-30 start (PROVISIONAL) | G-CLOSED | NOT_STARTED | — |
| P4 | Production access application | late Dec 2026 (PROVISIONAL) | G-PROD | NOT_STARTED | — |
| P5 | Soft launch ID + PH (production, restricted countries) | early Jan 2027 (PROVISIONAL) | G-SOFT | NOT_STARTED | — |
| P6 | KPI review and staged rollout | Jan 2027 onward (PROVISIONAL) | G-ROLL | NOT_STARTED | — |

Arithmetic check: a closed test that starts 30 Nov with 12 testers already opted in can first qualify on 14 Dec 2026; any opt-out below 12 restarts the count for that tester. A late-December application leaves slack for recruitment shortfalls. Google states production-access review usually takes 7 days or less but can take longer (UNVERIFIED wording, see Rules).

## Phase detail

1. **P1 Account and policy verification.** Owner confirms in Play Console: account type, account creation date, identity verification state, whether the closed-testing requirement is shown. Complete App content declarations (privacy policy, app access, ads, content rating, target audience, data safety). Confirm target API 36 (repo shows 36) and Play App Signing enrollment.
2. **P2 Internal QA.** Engineering gate G-ENG only; internal track AAB, device runs on the target devices. Not a Play requirement for production access.
3. **P3 Closed testing.** Recruit testers (pseudonymous IDs in the register only), track opt-in dates, keep ≥ 12 opted in continuously for ≥ 14 days, collect feedback (counts only in the register).
4. **P4 Production access.** Apply from the Play Console dashboard after the requirement is met; answers prepared from the closed-test record (questions listed below).
5. **P5 Soft launch.** First production release in Indonesia and Philippines only (country/region availability). Staged rollout cannot be used for the very first production release; it applies to later updates.
6. **P6 KPIs and rollout.** Read KPIs (targets in RELEASE_REGISTER), decide scale/fix/hold per `docs/design/PROFIT_STRATEGY_15X.md` §6; updates go out by staged rollout.

## Rules (official sources, fetched 2026-11-21)

| ID | Rule | Source | Status |
|---|---|---|---|
| R1 | Personal developer accounts created after 13 Nov 2023 must run a closed test with at least 12 testers opted in continuously for at least 14 days before applying for production access. Testers who leave before 14 days do not count; opting out and back in needs a fresh 14 consecutive days. | https://support.google.com/googleplay/android-developer/answer/14151465 | CONFIRMED |
| R2 | Production access application asks: how easy recruiting was; whether testers used all features; whether usage matched expected production behaviour; feedback summary and how collected; target audience; what makes the game unique; estimated first-year install range; changes made from the closed test; how readiness for production was determined. | https://support.google.com/googleplay/android-developer/answer/14151465 | CONFIRMED |
| R3 | From 31 Aug 2026 new apps and app updates must target Android 16 (API 36) or higher (extension requests possible to 1 Nov 2026). | https://developer.android.com/google/play/requirements/target-sdk | CONFIRMED |
| R4 | Target API requirement for 2027 (expected next annual step to API 37) | not yet published on the page fetched | UNVERIFIED |
| R5 | New apps are required to publish with the Android App Bundle (since Aug 2021). | https://developer.android.com/guide/app-bundle | CONFIRMED |
| R6 | Play App Signing: creating an app requires accepting the Play App Signing Terms of Service; AAB publishing defers signing to Google Play. Exact wording that enrollment is mandatory for new apps not found on the page fetched. | https://support.google.com/googleplay/android-developer/answer/9859152 | PARTIAL (mandatory wording UNVERIFIED) |
| R7 | All apps on closed, open or production tracks must complete the Data safety form (internal-testing-only apps exempt); a privacy policy is required, even for apps collecting no data. | https://support.google.com/googleplay/android-developer/answer/10787469 | CONFIRMED |
| R8 | All apps must have an IARC content rating; unrated apps are removed. | https://support.google.com/googleplay/android-developer/answer/9898843 | CONFIRMED |
| R9 | Before the Target audience and content section, the developer must declare whether the app contains ads; target age group must be declared for new apps/updates; apps including children must follow the Families policy (Families Self-Certified Ads SDKs). | https://support.google.com/googleplay/android-developer/answer/9867159 | CONFIRMED |
| R10 | Staged rollouts are for updates only, not the first publication; rollout can be limited to selected countries; countries cannot be removed after start; halting keeps existing users on the version. | https://support.google.com/googleplay/android-developer/answer/6346149 | CONFIRMED |
| R11 | Country/region availability for production is set on the Production page (Countries / regions tab); targeting follows the user's Play account country. | https://support.google.com/googleplay/android-developer/answer/7550024 | PARTIAL (search summary, page not fetched in full) |
| R12 | Production access review time ("7 days or less") | https://support.google.com/googleplay/android-developer/answer/14151465 | UNVERIFIED |

## Owner actions (UNVERIFIED until confirmed in Play Console)

- Account type (personal vs organization) and creation date; whether the 12/14 requirement banner is shown.
- Identity and contact verification state.
- Play App Signing enrollment state.
- Current state of each App content declaration.
