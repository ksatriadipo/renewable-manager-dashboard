# BATCH 0.5 VERIFICATION INTEGRITY — FINAL ACCEPTANCE REPORT

18 Nov 2026, VPS orchestrator. Final integrated round **b05f**:

| Part | Round | Content |
|---|---|---|
| patches + EditMode | `b05f` | patches and full EditMode |
| lane A | `b05fu` | build, uidev A57 + 960×540 with winter + DX, perfshot, flag-OFF player run |
| lane B | `b05fx` | x15shot |

All results here are actual. No FAIL was changed to PASS, no inconclusive was removed, and no precondition was weakened. Batch 1 has **not** started.

Evidence:
- `docs/remediation/batch05/evidence/b05f/` (summaries, jsonl, PNGs, perf, x15shot, laneA_flagoff, editmode_b05f.xml)
- raw output: `/srv/rm/docs/evidence/169_parity_b05f*`, `/srv/rm_b/docs/evidence/169_parity_b05fx`

Repositories:
- Game `/srv/rm`: branch `remediation/u37h-b05`, HEAD `0b12130`.
- **master U37H `dda07ec` unchanged.**
- Work repo: branch `remediation/u37h-b05`.

## 1. Engineering recommendation

**ACCEPT with documented residuals.** Six of the seven exit criteria are met in full. Criterion 2 is met for UI and world captures. Perfshot still has two capture-plan issues (B05-10, B05-11, §8): it now *detects* them as FAIL and no longer gives a false PASS, but it cannot yet produce a clean PASS for the configurations that are equivalent.

The user decides:
- **Option A:** accept now. B05-10/11 are fixed as F17d in parallel with Batch 1; they touch only PerfShot files, and Batch 1 does not depend on them.
- **Option B:** fix F17d and rerun perfshot (about 1 hour) before accepting.

## 2. Exit criteria (directive §3)

| # | Criterion | Result | Evidence |
|---|---|---|---|
| 1 | Required tests pass | ✔ EditMode **2318 passed / 0 failed / 0 skipped / 4 inconclusive**, 0 regressions, no rollback | `evidence/b05f/editmode_b05f.xml`, `/srv/rm/scratch/b05f_nohup.log` |
| 2 | Runtime capture integrity | ✔ uidev, Winter, x15shot. ◐ perfshot: no false PASS; 2 capture-plan residuals (§8) | §5 |
| 3 | Negative tests prove failures propagate | ✔ N1–N13 plus N6c, N8b, F11b-N, F6d-N, F1b-N, F4b-N, F17b/F17c tests. Runner: b05c negative run (7 locks FAIL, judge FAIL). The real b05r3 rollback fired. Real FAILs propagate: uidev verdict FAIL, Winter FAIL, perfshot FAIL. | §4 |
| 4 | Player build with flag OFF is safe | ✔ identical to U37H (§6) | `evidence/b05f/laneA_flagoff/` |
| 5 | OFF-equivalence r37k3/r37h4 | ✔ with documented scope (§7) | `evidence/offeq/`, OFFEQ_R37K3_R37H4.md |
| 6 | Regression evaluation | ✔ §3 | — |
| 7 | Environment blockers documented | ✔ F18 BLOCKED_BY_ENVIRONMENT; device performance has no data (§9) | — |

## 3. EditMode and regression

| Round | Stack | Result |
|---|---|---|
| b05base | U37H | 2212/0/0/4 |
| b05r1 | + F13, F14 | 2220/0/0/4 |
| b05r2 | + F1–F12, DX1–DX4 | 2253/0/0/4 |
| b05r3 | + T8, F6b, DX5, T8b | 2263/**1**/0/4 → automatic rollback of DX5 → compile broken → round stopped (no destructive git) |
| b05r3b | DX5 re-applied + T8c | 2264/0/0/4 |
| b05r4 | + F6c | 2269/0/0/4 |
| b05r5 | + F12b, F10b, F17b | 2289/0/0/4 |
| **b05f** | + F1b, F4b, F11b, F6d, F17c | **2318/0/0/4** |

Regression:
- Of the 2212 baseline tests, none changed result.
- 106 new tests, all passing.
- Inconclusive stays at 4 (same as baseline, not removed).
- Product test changes:
  - SoftLaunchShopTests 10/10 (F8 refactor).
  - One existing assertion changed with a documented reason: UiDevQaF11Tests.ThBln_DanKlaimBerbulan. The F11b spec was wrong; the monthly rule is unchanged.
- Honest note: T8c is *looser* than T8b. An unexpected info log no longer fails the test. Unexpected errors still fail it, and the three `[QADIAG]` errors are still required.

Targeted suites in b05f, all passing:

| Group | Suites |
|---|---|
| Diagnostics | QaDiagDx1 3, Dx2 2, Dx3 2; QaRestoreOnExceptionT8 11 |
| Capture log | QaShotLog 5 |
| Shop | SoftLaunchShop 10 |
| UiDevQa F6–F12 | F6 2 + F6c 5 + F6d 3, F7 1, F8 2, F9 1, F10 1 + F10b 4, F11 1 + F11b 4, F12 1 + F12b 5 |
| Winter | WinterQa 17 + F1b 6 + F4b 6 |
| Perf | PerfShotQa F17b 11 + F17c 10 |
| x15shot | X15ShotPlan 8, X15ShotVerdict 3 |

Python tool tests: 8 files, all OK (including perf_gate F17b 9 and F17c 5).

## 4. Status per F-item

Stages:
- IMP = implemented
- EMV = EditMode verified in Unity
- RTV = runtime verified in a real round

VISUALLY_ACCEPTED and DEVICE_VALIDATED do not apply to capture tooling. Game commit / work commit / manifest: `docs/release/patches/<patch>.patch.manifest.md` (all LENGKAP).

| F | Patches (game / work) | Negative test | Final runtime evidence (b05f) | Status |
|---|---|---|---|---|
| F1 Winter verdict | qa05_f1 `66f251b`/`14d17c2f`; F1b `613807f`/`50ba7472` | N1, F1b-N | `total fails=7` = 5 FAIL + 2 PRECONDITION_FAIL rows. nosnow is **no longer a duplicate** (duplicates 0). Snow is measured at runtime. | **RTV** |
| F2 house/tree counters | `df125df`/`00a8a959` | N4 | 54/24, 193/72, 385/139; objects build PASS | **RTV** |
| F3 MID/FAR capture path | `595334e`/`11669293` | N3 | 0.6/1.266/6.6, ≥ 25 %; product clamp unchanged | **RTV** |
| F4 night + office | `b6ab9ff`/`14a717e7`; F4b `c3fe24e`/`d64b5957` | N2, N5, F4b-N | Night grade active. Office/plaza = PRECONDITION_FAIL `offscreen(focus_clamped_region15x)`. This is a correct detection of **product finding U37H-B05-P1 (G17)**; the capture is not faked. | **RTV** (tool); product OPEN |
| F5 try/finally | `13aeb8e`/`38829221` | — | Winter completes; state restored | **RTV** |
| F6 T5 | F6 `de50c47`/`cb806869`, F6b `5a0558f`/`b1977efe`, F6c `feb9e20`/`60315f21`, F6d `6122d4e`/`3a4207d6` | N6, N6c, F6d-N | 48–71 have no level-up modal. **16_mission1_done = PASS, modal "Misi selesai"** (shows the subject it names, for the first time including U37H). 18_level_up = shown. | **RTV** |
| F7 plant focus | `b7d977e`/`4bcd866d` | N9 | 89–91 PASS | **RTV** |
| F8 shop tabs | `d9947d9`/`023a2d89` | N7 | b05r4u vs U37H identical; accepted by the user. Limitation: the purchase flow is covered by tests only. | **RTV + accepted** |
| F9 tester scroll | `5eae556`/`ca70a065` | — | 86/88 PASS | **RTV** |
| F10 drawn tender | F10 `e786978`/`377867ad`; F10b `9f9ed67`/`409e8577` | N8, N8b | **19_tender_board = PRECONDITION_FAIL `tender_out_of_viewport`.** This is a correct detection of product blocker U1-002; the earlier false PASS is gone. **20_bid = PASS `bid:1`** (the earlier false FAIL is gone). | **RTV** |
| F11 GameHours / monthly claim | F11 `c0c6e47`/`bdd41a35`; F11b `928f9fd`/`c9cb88af` | F11b-N | 42_mail_claimed PASS `sim:sub_month` (measured) | **RTV** |
| F12 seed / clock / summary / intro | F12 `f1b8d3e`/`39fbbe02`; F12b `a4febaf`/`6e66c159` | N10 | **Cross-profile: EQUAL (99 shots)**. **shots_summary.json present** on both profiles. Hang guard did not fire. | **RTV** |
| F13 / F14 | `b5cd0bf` / `61e4457` | N11, N12 | lanes b05c + **x15shot b05fx 6/6 PASS**, sheet_rc 0 | **RTV** |
| F15 / F16 | work `91b1ca0d`, `810a032b` | N11, N13 | locks + judge propagate FAIL (b05c negative run; b05r3 rollback really fired) | **RTV** |
| F17 perf gate + perfshot | F17 work `dfd94312`; F17b `e159129`/`b10d2e34`; F17c `0b12130`/`daef2ba6` | F17b/c tests | Summary present, 50/50 rows recorded, PerfTier held. Tinggi now measured at 2340×1080 (b05r2u had dropped to 1950×900). `peta_lebar` is distinct (island: 270–298 draw calls / 404k triangles vs `peta_jauh` 115k). An empty frame is now INVALID ⇒ FAIL. Residuals B05-10/11: see §8. | **RTV** (tool), with residuals |
| F18 165 benchmark | F18 `fdb3cdeb`, F18b `d781f6f2` | N14 | original benchmark not available | **BLOCKED_BY_ENVIRONMENT** |

| DX | Patches | Tests | Runtime | Status |
|---|---|---|---|---|
| DX1 yellow band | `c564b9e`/`19aa7e0a` | Dx1 3 + T8 | 30 rows winter + 30 rows R9c; the main layer is Map Grid Tender | **RTV** (diagnosis complete) |
| DX2 night haze | `7278969`/`39489419` | Dx2 2 + T8 | 12 rows; haze off: FAR 204.3 → 46.5, MID 141.9 → 98.3 | **RTV** |
| DX3 plaza/decor | `0685dc4`/`6a71b7dd` | Dx3 2 + T8 | 5 + 1 rows; camera clamped (supports B05-P1) | **RTV** |
| DX4 callers / DX5 RunSafe | `6324e33`; `6f879ce` (re-applied) / `21df3018`, `f3276de3` | T8 11 | diagnostics never stopped a capture (exc 0) | **RTV** |

## 5. Final capture results and classification

| Set | Summary | Valid/total | Non-PASS → class (cause) |
|---|---|---|---|
| uidev A57 2340×1080 | 99 shots: 98 PASS, 1 PRECONDITION_FAIL, 0 duplicates, 0 missing metrics; verdict FAIL | 98/99 | 19_tender_board → CAPTURE_FAILURE (precondition). Measured cause: PRODUCT U1-002, the card is outside the viewport. |
| uidev 960×540 | identical to A57 | 98/99 | same |
| UI audit (audit_loop) | 19 issues on 9 of 99 screens per profile | — | product UI findings (G12–G15), not Batch 0.5 |
| WinterNightShot (both profiles) | 8 shots: 1 PASS, 5 FAIL, 2 PRECONDITION_FAIL, 0 duplicates; FAIL | 6/8 valid | 5 meanL FAIL (build 117.4, nosnow 114.8, mid 141.9, far 204.3, hq 123.3) → UNCLASSIFIED (consistent with U2-002; DX2 shows haze is the cause, except HQ). Plaza/office → CAPTURE (precondition), cause PRODUCT B05-P1. |
| x15shot lane B (pilot) | 6 shots: 6 PASS, 0 precondition_fail; PASS; sheet_rc 0 | 6/6 | — |
| perfshot | 50 rows: 36 PASS, 9 FAIL, 5 PRECONDITION_FAIL, 8 duplicates; FAIL | 36/50 | **kantor_dalam ×5** → CAPTURE (precondition), cause PRODUCT B05-P1. **8 duplicates** (Tinggi = lama for jauh/proyek/tim/toko; Seimbang_tanpa_bayangan = Seimbang for jauh/proyek/tim/toko) → CAPTURE_FAILURE: identical frames across configs, B05-10. **Seimbang_peta_lebar** frame nearly empty (51 draw calls / 2.4k triangles) → INVALID; class UNCLASSIFIED in the tool. Evidence: the PNG shows the "Warga Menyapa" gameplay popup covering the frame → probable CAPTURE_FAILURE (B05-11). |
| perf_gate Seimbang | FAIL (2 failures) | — | **MEASURED_FAIL structural:** BUILD 884 draw calls / 635k triangles vs reference 851 / 399k; FAR 405 draw calls vs 148. MID PASS (321 / 401k). Shadow cost −0.3 % PASS. |
| Lane A flag-OFF player | — | ✔ | §6 |

## 6. Player build with flag OFF (b05f vs U37H, same method)

| Check | b05f (`Builds/audit169b05fu`) | U37H (`Builds/audit169u37h`) |
|---|---|---|
| Arguments | none for capture; `env -i`, separate HOME, 180 s, window focused | same |
| shots.jsonl / summary created | 0 | 0 |
| Log lines QaShot / QaCapture / AutoShot / x15shot / QADIAG / PERFSHOT | 0 | — |
| Files in HOME (outside the mesa cache) | analytics.jsonl + Unity prefs | **same file set** |
| File contents | analytics differs only in `t_open_s` (1.878 vs 1.86); prefs differ only in Unity session IDs | — |
| Normalised log | differs only in GL context handle, timing of 0.001 s, X display number | — |
| Screen at 180 s | **0 of 921,600 pixels differ** | — |

Correction to the earlier report (LANES_B05C_REPORT): it said "Files written under HOME: mesa shader cache only". That was incomplete. Both U37H and the new build write `analytics.jsonl` (normal app_open/load_complete events) and Unity prefs. These are not capture output and are identical between base and new.

## 7. OFF-equivalence r37k3 / r37h4: scope and limits

**What is proven:** at `61e4457`, with the visual-parity switches OFF, x15shot of the pilot index (Goldmeadow + Lanternhill, FAR/MID/BUILD) gave:
- FAR byte-identical;
- tris/draw/renderers/size identical;
- BUILD/MID pixel differences equal to animation noise from the same code.

**Why it still holds for HEAD `0b12130`:** `git diff 61e4457..HEAD` touches no r37k3/r37h4 file and no RegionMapBuilder or NaturePilot file. Changes outside QA files:
- the F8 BuildShopTabBar refactor (accepted);
- `HubHUD.cs`: the seed via `UiDevQa.HiringSeed` and a guard `QaClockHoldsFrame`, both inert without capture arguments (proven by §6);
- `Company.QaProgress.cs`: QA methods only.

Lane A flag-OFF in b05f is an additional boot equivalence check.

**Limits:**
- Only the pilot index (2 regions) and pilot views were captured. The other 28 regions are covered by the code-path argument, not by images.
- Runtime is llvmpipe/lavapipe (software rendering).
- Not proven on Android.
- Any later patch that touches r37 / RegionMapBuilder / NaturePilot / haze (including Batch 1 U2-002) **invalidates** this claim and requires a rerun (script `evidence/offeq/chain_offeq.sh`).

## 8. Remaining items (open) and residual risks

| ID | Item | Class | Impact | Plan |
|---|---|---|---|---|
| B05-10 | perfshot: identical frames across configs (UI pages and FAR do not change between lama/Tinggi or with shadows off), marked duplicate ⇒ FAIL | CAPTURE (plan design) | perfshot cannot PASS even when the product is fine; no false PASS | F17d: the spec includes the config and the frame-equality expectation must be explicit and measured (e.g. `expect_same_frame_as`, recorded and checked), never dedup silently turned off; needs Auditor review |
| B05-11 | perfshot: a gameplay popup ("Warga Menyapa") can appear mid-measurement; caught only by the plausibility gate | CAPTURE | rows can become INVALID at random | F17d: modal precondition (no modal unless the state is `peta+modal`) + random events held on the capture path |
| B05-12 | AutoShot uidev: the final summary writes `planned = -1` (no explicit plan count); a killed run is still caught by the checkpoint (planned = shots + 1) | CAPTURE (residual) | a run that dies after the checkpoint and before the tail phase is detected only through the checkpoint | declare the plan count in F12c (optional) |
| B05-P1 | office/plaza cannot be reached in 15× (G17) | PRODUCT | office features unusable for the player; winter office/plaza + perfshot kantor_dalam stay FAIL | Batch 3 (changes product camera behaviour → needs a plan and approval) |
| B05-P2 | "Naik level!" appears before "Misi selesai" | PRODUCT | comprehension | Batch 2 (G09) |
| U1-002 / U2-001 / U2-002 | product blockers (now measured by valid tools) | PRODUCT | Closed Test blocker | Batch 1 |
| F18 | 165 benchmark | BLOCKED_BY_ENVIRONMENT | 165 parity cannot be claimed | rsync from the laptop |

Residual risks:
1. Every runtime result is llvmpipe/lavapipe (software). Draw call, triangle, renderer and memory counts are valid as **structural metrics**. Milliseconds and FPS are **not** Android performance; DEVICE_VALIDATED = none (F3/Batch 7).
2. The cross-profile equality (F12b) only covers A57 and 960×540; the other 4 uidev profiles were not run in this round.
3. OFF-equivalence has limited scope (§7) and must be rerun after Batch 1 U2-002.
4. T8c is looser than T8b on unexpected info logs (§3).
5. Purchase flow F8 is covered by tests only.
6. Disk is 91 % used (13 GB free); capture rounds need space. No cleanup without confirming what is retained.

## 9. VPS structural metrics vs Android performance

| Metric | Source | Status |
|---|---|---|
| draw calls, triangles, renderers, setpass, memory | VPS perfshot / x15shot | VALID as counts; perf_gate FAR 405 vs 148 and BUILD 884/635k vs 851/399k = MEASURED_FAIL (structural) |
| ms / FPS / thermals / battery | VPS software rendering | NOT VALID for devices |
| A57 + low-spec phones | — | NOT_TESTED (F3, Batch 7) |

## 10. REVISED GOAL 1 READINESS ASSESSMENT

**Historical score before the U37H audit** (CHECKLIST_GOAL1, morning of 18 Nov):

| Measure | In-game | Total |
|---|---|---|
| Closed Test | 83 % (58/70) | 64 % |
| Soft Launch | 80 % (84/105) | 47 % |

**Why it is no longer representative:**
1. The U37H audit found 119 findings, 102 of them product defects (5 blocker, 45 major), and none is verified fixed.
2. Batch 0.5 proved the old capture tooling produced false PASSes:
   - the popup leak covering shots;
   - the tender card outside the viewport counted as drawn;
   - empty perf rows passing;
   - MID = FAR;
   - counters at −1;
   - duplicate shop tab.
   So the IG rows "installed, waiting for capture" carry no valid evidence.
3. IG20: approved economy flows exist only in the bot, so the tempo evidence from the bot is INVALIDATED_BY_IG20.
4. IG111: the 15× world FAILs against 165, with 8/38 criteria passing.

**Audited baseline:** `docs/release/READINESS_RESCORE_U37H.md`, independent Auditor, 18 Nov afternoon. Historical, not overwritten.

| | In-game | Total |
|---|---|---|
| Closed Test | 28.4/70 (41 %) | **40.0 %** |
| Soft Launch | 43.1/105 | **40.2 %** |

| Closed Test component | Morning | Rescore | Label |
|---|---|---|---|
| Core features (20) | 19.5 | 13.0 | ESTIMATE |
| Visual (40) | 29.5 | 12.4 | DERIVED from measurements |
| Stability + perf (10) | 9.0 | 3.0 | DERIVED + ESTIMATE |
| APK + phone (15) | 3.0 | 3.0 | carried over |
| Play + legal + testers (15) | 8.6 | 8.6 | carried over |

**IG rows (112):**

| | ☑ | ◐ | ☐ | ✗ |
|---|---|---|---|---|
| Before | 13 | 96 | 1 | 2 |
| After | 14 | 83 | 1 | 14 |

- 12 rows dropped to ✗: IG16, 29, 40, 46, 48, 61, 68, 73, 77, 83, 91, 92.
- IG65 and IG104 rose on measured evidence.
- Full per-row status: READINESS_RESCORE_U37H §6.

**Impact of the 119 findings:**
- 4 closed by decisions D2/D3;
- 13 tooling defects (handled in Batch 0.5);
- 102 product defects;
- 67 product findings (26 major) have no IG row, so the checklist understates the remaining work. Mapping happens in Phase D.

**Impact of IG20:**
- IG61, IG68 and IG83 become ✗.
- Tempo evidence for IG41/66/78/85/99/64b is not counted until the Stillwater loan, the crisis safety net and the separate small-project K are in the game.

**Changes after b05f (this report):**
- No product changes (Batch 0.5 = capture tooling only), so **the readiness numbers do not change: 40.0 % / 40.2 %**.
- What changed is evidence quality. Captures from b05f onward are VALID evidence, so:
  - U1-002 is measured as product: card outside the viewport.
  - U2-002 is measured: meanL outside target, with haze as the cause.
  - B05-P1 is new: office unreachable, major (proposed). It confirms Closed Test blocker #9.
  - Structural perf is measured and FAILs FAR/BUILD.
- None of these raises the score. The new score will be READINESS_RESCORE_POST_BATCH1.md (Phase D).

**Blockers before Closed Test** (detail: READINESS_RESCORE_U37H §5a):
1. Batch 0.5 gate (this report)
2. U1-001 HQ pick ("Dirikan di sini")
3. U1-002 Tender board
4. U1-035 dialog history
5. U2-001 yellow band / hex
6. U2-002 night haze
7. IG20 economy flows into the game
8. 15× world parity with 165 (pilot r37, G18)
9. Office/HQ 15× (G17, B05-P1)
10. Finance numbers + legacy terms (G07, G06)
11. Performance (FAR/BUILD structural, plus device)
12. Harbour (IG110)
13. IG21: I play the player build

Outside the game: F18 benchmark, F3 devices, Play/legal/12 testers.

**Additional blockers before Soft Launch** (§5b):
1. 14-day closed test
2. Late-game tempo (Lv 64, identical T5 chains)
3. Monetisation per decisions (G20) + SDK/Play
4. Cards/layout/overlay/contrast (G12–G15)
5. Remaining localisation/Koin (G06/G08/G10/G11/G09)
6. Camera/scale (G16/G21)
7. 13 SL features with valid captures
8. SL assets
9. Legal/marketing
10. Final QA (G22)

## 11. Decision requested from the user
1. Accept Batch 0.5 under **Option A** (F17d in parallel with Batch 1) or **Option B** (F17d + perfshot before acceptance).
2. With acceptance, Batch 1 (the 5 product blockers) may start under the Road to Closed Test directive. Until there is explicit acceptance, Batch 1 does not start.
