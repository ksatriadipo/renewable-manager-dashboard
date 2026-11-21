# Release audit addendum — policy, account, schedule, commercial readiness (21 Nov 2026)

**Type:** analysis only. Addendum to `RELEASE_RECOVERY_REPORT_20261121.md` (not edited). **No game code, task status, milestone,
baseline date, approved scope or release commitment was changed.** Every recommendation is **PROPOSED** (decisions in
`PROPOSED_RELEASE_DECISIONS.md`). Game code was read only (`/srv/rm/RenewableCEO`, branch state of 21 Nov).
**Labels:** CONFIRMED = official page read on the date shown; MEASURED = read from repo files; ASSUMPTION = no record;
UNVERIFIED = needs a Play Console / owner record. Secrets and personal data are not reproduced (ad unit IDs and keys masked).

## A. Account verification (owner evidence required)

Account type stays **UNVERIFIED**. A Gmail-owned account does not prove a personal developer account, and the repo decision
(`DECISIONS.md` row 2, 4 Nov) is a plan, not a Console record.

| # | Evidence the owner must capture (screenshot or written value in RELEASE_REGISTER) | Proves | Source (read 21 Nov 2026) | Status |
|---|---|---|---|---|
| A1 | Play Console → **Account details** (Manage account › Account details), section "Developer profile": the developer account type / organisation fields | Personal vs Organization | https://support.google.com/googleplay/android-developer/answer/13628312 | UNVERIFIED |
| A2 | Presence or absence of a **D-U-N-S number** on the same page (organisation accounts cannot be created without one; Google shows D-U-N-S, legal address, email and phone on Play for organisations) | Organization if present | same page | UNVERIFIED |
| A3 | Account **creation date** (account registration / payment receipt of the USD 25 fee, or the date on the Account details page) | Whether "created after 13 Nov 2023" applies | https://support.google.com/googleplay/android-developer/answer/14151465 | UNVERIFIED |
| A4 | Dashboard item / banner **"Apply for production access"** with the closed-testing requirement (12 testers, 14 days) and its progress card | Rule R1 applies to this account | same page | UNVERIFIED |
| A5 | Identity verification and contact (email/phone) verification state on Account details | Account can publish | same page | UNVERIFIED |

Decision rule (PROPOSED): if A4 is shown → plan with the 12 × 14 rule (current plan). If A2 shows a D-U-N-S → organisation, R1 does
not apply and the schedule in §C shortens by the 14-day closed test (the closed test may still be kept as a quality gate). The help
page does not name an explicit "account type" label, so A1 + A2 + A4 together are the evidence; any single screenshot alone is
LOW CONFIDENCE.

## B. Policy compliance

| Requirement | Official source (read 21 Nov 2026) | Rule | Project status (records + read-only code) |
|---|---|---|---|
| Target API | https://developer.android.com/google/play/requirements/target-sdk | From **31 Aug 2026 new apps and app updates must target Android 16 (API 36)**; extension to 1 Nov 2026 (passed). Existing apps API 35 to stay visible to new users. | `ProjectSettings.asset`: `AndroidTargetSdkVersion: 36`, `AndroidMinSdkVersion: 26` (MEASURED). No 15× AAB built → **PARTIAL** (the merged manifest of a real AAB was never inspected). |
| Target API 2027 | same page | **No 2027 target-API step published** on the page as read. Annual pattern suggests API 37 from ±31 Aug 2027 = ASSUMPTION. | Not relevant before soft launch; re-check in mid-2027. UNVERIFIED. |
| 16 KB page size | https://developer.android.com/guide/practices/page-sizes | Apps targeting API 35+ must support 16 KB pages on 64-bit devices; **from 1 Feb 2027 updates that do not support 16 KB cannot be released**. | `AndroidTargetArchitectures: 2` (ARM64 only), IL2CPP. 16 KB alignment of Unity 6000.6 + Firebase/GMA native libs **NOT_RECORDED**; check with `bundletool dump config` / `zipalign -P 16` on the first AAB. Before 1 Feb 2027 a soft-launch update would be blocked if unaligned. |
| Android App Bundle | https://developer.android.com/guide/app-bundle | AAB required for new apps (since Aug 2021). | `BUILD_AAB.md` procedure only; last AAB #6 (9 Nov, pre-15×, debug-signed). **NOT_STARTED** for the 15× build. |
| Play App Signing | https://support.google.com/googleplay/android-developer/answer/9859152 | Creating an app requires accepting the Play App Signing ToS; AAB publishing defers signing to Google. | `androidUseCustomKeystore: 0`, keystore name empty (MEASURED) → **no upload key configured in the project**. Enrollment UNVERIFIED (owner). |
| Data safety | https://support.google.com/googleplay/android-developer/answer/10787469 | Required for closed/open/production tracks; must cover SDK data; discrepancies are enforced. | Drafts `DATA_SAFETY_TESTER_20261109.md` / `DATA_SAFETY_SOFTLAUNCH.md`; Console filled 11 Nov **pre-15×**. Must be re-checked against the real AAB (Firebase Analytics/Auth/Firestore/Crashlytics/Remote Config + GMA + UMP present in `mainTemplate.gradle`). PARTIAL. |
| Privacy policy | same page | Required even with no data collection. | v1.0 live 7 Nov per repo; v1.1 (SDK build) and v1.2 (soft launch) **not deployed** (`CHECKLIST_USER_ACTIONS` §B/§E). PARTIAL. |
| Content rating (IARC) | https://support.google.com/googleplay/android-developer/answer/9898843 | All apps need an IARC rating; unrated apps are removed. | Answers drafted (`PLAY_APP_CONTENT_ANSWERS.md`, expected 3+); Console completion 11 Nov recorded by owner checklist → UNVERIFIED against 15× content (ads/IAP change answers for soft launch). |
| Ads declaration | https://support.google.com/googleplay/android-developer/answer/9867159 ; https://support.google.com/googleplay/android-developer/answer/9859455 | Declare ads before target audience; "contains ads" = the app shows ads (incl. via SDK); misrepresentation is a violation. | Tester build: ads code compiled only with `SOFT_LAUNCH_BUILD`, but **`play-services-ads` + UMP libraries and an AdMob APPLICATION_ID ship in every AAB** (`docs/legal/ADMOB_IN_TESTER_BUILD_20261108.md`). Risk of "We found ad SDKs" warning with an "No ads" answer. PARTIAL. |
| Advertising ID | https://support.google.com/googleplay/android-developer/answer/6048248 (per legal note 8 Nov) | `AD_ID` permission declaration must match the manifest. | `AnalyticsManifestFlags.RemoveAdIdPermission` removes AD_ID in non-SL builds (legal note) → must match the Console answer per build. UNVERIFIED. |
| In-app purchases / Play Billing | https://developer.android.com/google/play/billing/deprecation-faq | Billing Library deadlines (new apps + updates): v7 31 Aug 2026 (ext. 1 Nov 2026), **v8 31 Aug 2027** (ext. 1 Nov 2027), **v9 31 Aug 2028** (ext. 1 Nov 2028). Digital goods must use Play Billing (Payments policy). | Unity IAP **5.4.4** (local tgz) → `IAPAndroidDependencies.cs` pulls **billingclient:billing:9.0.0** (CHANGELOG "updated to 9.0.0 (was 8.3.0)") → **compliant until 31 Aug 2028**. IAP code compiles only with `SOFT_LAUNCH_BUILD && RCEO_IAP && UNITY_ANDROID`; tester build `Monet15x.TesterBuild = true` → `IapAvailable = false`. |
| App access instructions | https://support.google.com/googleplay/android-developer/answer/9859455 | Needed when parts of the app are restricted (login, gated content). | Game uses Firebase Auth (anonymous per backend docs) and level/tier gates; whether reviewers need instructions is **UNVERIFIED** (owner to answer "All functionality available without special access" or provide steps). |
| Production access | https://support.google.com/googleplay/android-developer/answer/14151465 | Personal accounts created after 13 Nov 2023: ≥ 12 testers opted in continuously ≥ 14 days, then apply (questionnaire R2). Review time wording ("7 days or less") UNVERIFIED. | Not started (`RELEASE_REGISTER.md`). |

## C. Closed testing schedule (mandatory vs estimated)

**MANDATORY (policy, if A4 confirms R1):** ≥ 12 testers opted in **continuously** for ≥ 14 days; an opt-out resets that tester.
Earliest qualification = first day with ≥ 12 opted in + 14 days. Nothing else in the timeline is a policy duration.

**Prerequisites for the first qualifying day (all must hold):** (1) a 15× AAB signed with an upload key, targetSdk 36; (2) closed
track release created, Data safety/app content consistent with that AAB; (3) Google review of the closed track completed (track
live, opt-in link works); (4) ≥ 12 testers have **opted in** (an invitation is not an opt-in).

| Step | Type | P50 | P80 | Basis |
|---|---|---|---|---|
| Account evidence A1–A5 | owner action | 0.25 d | 1 d | ASSUMPTION; parallel, start now |
| Upload key + Play App Signing at first upload | owner + orchestrator | 0.25 d | 1 d | ASSUMPTION; `androidUseCustomKeystore: 0` |
| Closed Testing Readiness (engineering B, recovery report §I) | estimated | 2 Dec | 15 Dec | recovery report (unchanged inputs) |
| Data safety / ads / AD_ID recheck vs real AAB | owner + legal | 0.25 d | 1 d | ASSUMPTION; extra rework if SDK detection flags ads |
| Closed-track review | **estimated, Google-controlled** | 1 d | 3 d | ASSUMPTION (NOT_RECORDED) |
| Tester recruitment (12, target 30) | estimated, parallel | 5 d | 10 d | ASSUMPTION; not started; buffer of ≥ 3 extra testers against opt-outs |
| 14-day qualifying window | **MANDATORY** | 14 d | 14 d (+ restart risk) | R1 |
| Production-access questionnaire | estimated | 0.5 d | 1 d | ASSUMPTION |
| Production-access review | **estimated, Google-controlled** | 7 d | 14 d | project budget; Google wording UNVERIFIED |

Recruitment is off the critical path only if it starts by ±25 Nov (P50) / ±5 Dec (P80). **Production access is never guaranteed
after 14 days**: Google may reject or ask for more testing; the forecast models only one application.

## D. Commercial readiness (code read-only)

| Area | Finding (MEASURED) | Files | Blocks |
|---|---|---|---|
| IAP products | SKUs in code: `cash_t1…cash_t6` (USD 0.99–39.99), `starter_founder`, `monthly_card`, `season_YYYY_MM` (2 ahead), `monument_t6` (behind `MonetFill15x.MonumentOn`). **`piggy_gold_7500` (Celengan Emas Rp7.500, approved 16 Nov) is not in the IAP catalog; the buy button only shows a "pending" toast.** | `Assets/Scripts/Core/Simulation/StoreCatalog.cs`, `Assets/Scripts/Core/Economy/IapCatalog.cs` (`Build`), `Assets/Scripts/Core/Economy/Monet15x.cs` (L194), `Assets/Scripts/Game/UI/Screens/HubHUD.Monet15x.cs` (L93–98) | Soft launch (CB-1) |
| Season pass in catalog | Season SKUs are always built although the season pass is **deferred to after soft launch 1** (decision 16 Nov) and G20 flagged it visible. | `IapCatalog.cs` L100–105; READINESS_RESCORE_U37H (G20 FAIL) | Closed test (testers must not see it) + SL (CB-2) |
| Unity IAP / Billing | Unity IAP 5.4.4, Billing 9.0.0 (OK to Aug 2028). Products not created in Play Console (`CHECKLIST_USER_ACTIONS` §D L26); Console product creation needs an uploaded AAB with BILLING permission. | `Packages/manifest.json` | SL (CB-3) |
| Server verification | `iap.json`: `serverVerify: true`, `verifyUrl: ""` → `ServerVerifierStub`; purchases would **never be confirmed** (Play auto-refunds after 3 days). `googlePlayPublicKey` empty (signature check skipped). Needs Blaze + `verifyPurchase` deploy (`VERIFY_PURCHASE_DEPLOY.md`). | `Assets/Resources/Config/iap.json`, `Assets/Scripts/Game/Diagnostics/Monetization.Services.cs` L41–66, 170 | SL (CB-4) |
| AdMob app ID | `ads.json` holds a real publisher app ID (prefix `ca-app-pub-6075…`), but the checked-in `GoogleMobileAdsSettings` and `GoogleMobileAdsPlugin.androidlib/AndroidManifest.xml` carry the **Google sample app ID** (`…3940256099942544~…`), written by `AdMobBuildGuard` for non-SL builds. The SL build path must swap it; never verified in an AAB. | `Assets/Resources/Config/ads.json`, `Assets/Plugins/Android/GoogleMobileAdsPlugin.androidlib/AndroidManifest.xml`, `Assets/Editor/Build/AndroidBuild.SoftLaunch.cs` | SL (CB-5) |
| Ad units | 4 real rewarded units; `speed_up` and `helper_choice` (Kunci Pas, Bantuan pilihan — 3 of the 6 non-boost daily ads, decision 16 Nov) are **`PLACEHOLDER_R38B_*`**. | `ads.json` `pendingRewardedUnits15x` | SL (CB-6) |
| UMP consent | UMP 4.0.0 integrated (`ConsentInformation.Update`, `LoadAndShowConsentFormIfRequired`, privacy-options form). AdMob Privacy & messaging form configuration in the AdMob console = NOT_RECORDED. | `Assets/Scripts/Game/Diagnostics/Monetization.Ads.cs` L123–150, `GoogleUmpDependencies.xml` | SL (owner) |
| app-ads.txt | File prepared (1 line, DIRECT, Google cert ID) but **not deployed** on the developer website domain. | `docs/marketing/landing/release_softlaunch/app-ads.txt` | SL (CB-7) |
| Analytics | Firebase Analytics 24.0.0 via `Telemetry.Cloud.cs` (`FirebaseAnalytics.LogEvent`); events `ad_offer_shown`, `ad_offer_tapped`, `ad_shown`, `ad_reward`, `ad_cap_reached`, `iap_start/success/fail`, `piggy_gold_full/buy`, `offer_shown`, `store_view` exist in code. Runtime delivery to Firebase never verified on a device (NOT_RECORDED). KPI rows in RELEASE_REGISTER are `NOT_CONNECTED`. | `Assets/Scripts/Game/Diagnostics/Telemetry.Cloud.cs`, `Monet15x.cs` L114–122 | SL KPI gate (CB-8) |
| Data safety mapping | SDKs present: Firebase Analytics/Auth/Firestore/Crashlytics/Remote Config, GMA 25.5.0, UMP 4.0.0, Unity IAP. Drafts exist per build flavour; must be re-mapped to the actual AAB of each track. | `Assets/Plugins/Android/mainTemplate.gradle` L9–25 | CT + SL |
| Regional availability | ID + PH planned (`RELEASE_REGISTER` markets). PH has no localisation decision beyond EN; not set in Console (NOT_STARTED). | — | SL (owner) |
| Currency / pricing | Docs price in IDR only (cash Rp7.500–319.000, starter Rp15.000, monthly Rp29.000, piggy Rp7.500, decor Rp15.000–49.000); code defaults in USD (`StarterUsd 1.99`, `MonthlyCardUsd 4.99`). **No PHP price tiers documented**; `CHECKLIST_USER_ACTIONS` L26 still lists season pass Rp35.000 (deferred). | `StoreCatalog.cs`, `Monet15x.cs` L336, `docs/design/MONETIZATION_15X.md` | SL (CB-9, owner decision) |
| Monetization testing | License testers (Console › License testing) and test-card purchases: NOT_RECORDED. | — | SL (CB-10) |

**Closed-test compliance blockers:** CB-2 (season pass visible), ads-SDK-vs-"No ads" declaration consistency, Data safety vs real
AAB, upload key. **Soft-launch commercial blockers:** CB-1, CB-3…CB-10 plus legal v1.2. None of these is on the engineering
critical path for the closed test except CB-2.

## E. Forecast integration (sequential Unity runner; LOW CONFIDENCE)

Baseline dates and owner provisional targets are **unchanged** (30 Nov CT, late-Dec production application, early-Jan SL). The
recovery-report model (§I, day 0 = 22 Nov) is extended with the dependencies above; Unity work stays strictly sequential on one
runner, owner/Google steps run in parallel where they do not need the AAB.

Added serial terms after B (Closed Testing Readiness): upload key + first upload 0.25 | 1 d; Data safety/ads recheck 0.25 | 1 d
(review 1 | 3 d already in the model). Added before F: commercial blockers CB-1/2/4/5/6 need ±1 Unity round each for code
(serial, ASSUMPTION 0.5 | 1 d each, 2.5 | 5 d total) — scheduled inside the 14-day window, so they add 0 d at P50 and up to
+2 d at P80 if runner capacity is consumed by tester-fix builds.

| Milestone | Recovery report P50 / P80 | Addendum P50 / P80 | Change | Driver |
|---|---|---|---|---|
| C Closed Testing Start | 3 Dec / 18 Dec | **4 Dec / 20 Dec** | +1 / +2 d | upload key, Data safety recheck |
| D Testing completion (mandatory 14 d) | 17 Dec / 1 Jan | **18 Dec / 3 Jan** | +1 / +2 d | follows C |
| E Production access granted | 24 Dec / 15 Jan | **25 Dec / 18 Jan** | +1 / +3 d | questionnaire 0.5 / 1 d |
| F Soft launch ID (+PH) | 25 Dec / 18 Jan | **26 Dec / 23 Jan** | +1 / +5 d | commercial blockers at P80 |

Not modelled (all push later): tester opt-out restart, rejection of the production-access application, holiday-season review delay,
organisation account (would remove 14 d if A2 confirms D-U-N-S). With recovery-report decisions K2 + K3 the same deltas apply to
the K2 column (C 1 Dec / 12 Dec). **Confidence: LOW** (4 days of throughput history; Google review times NOT_RECORDED).

## F. Status cards (Command Center projection)

| Card | Status | Basis | Evidence |
|---|---|---|---|
| Account verification | UNVERIFIED | Account type, creation date, 12/14 banner not proven in Console (§A) | owner to confirm in Play Console |
| Closed testing readiness | BLOCKED | No 15× AAB, no upload key, Data safety not rechecked, closed track not live (§B, §C) | — |
| Tester recruitment readiness | NOT_STARTED | 0 testers recorded; ≥ 12 needed, target 30 (§C) | — |
| Target API compliance | PARTIAL | targetSdk 36 in ProjectSettings; no AAB built; 16 KB NOT_RECORDED (§B) | /srv/rm/RenewableCEO/ProjectSettings/ProjectSettings.asset |
| Store compliance | PARTIAL | App content filled pre-15×; privacy v1.1 not deployed; ads/Data safety recheck open (§B) | docs/release/RELEASE_REGISTER.md |
| Production access readiness | NOT_STARTED | Requires qualified closed test; never guaranteed (§C) | — |
| Soft launch readiness | BLOCKED | Commercial blockers CB-1…CB-10 (§D) | docs/release/RELEASE_ADDENDUM_POLICY_COMMERCIAL_20261121.md |
