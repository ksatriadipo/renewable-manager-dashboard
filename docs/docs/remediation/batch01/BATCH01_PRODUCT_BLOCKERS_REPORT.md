# BATCH 1 — PRODUCT BLOCKERS REPORT

Version 2, 19 Nov 2026, VPS orchestrator (v2 adds §9 b1r4: r410 D-B1-1 + r411 D-B1-2; v1 b1r3 results kept unchanged below as historical evidence). Mandate: user, 19 Nov ("Batch 0.5 DITERIMA, Opsi A; Batch 1 dimulai") plus the visual decisions of 19 Nov (night per zoom, cubes replaced, tender verified down to the submit button).

## 0. Summary

| Blocker | Root cause (proven) | Status | Runtime (b1r3) |
|---|---|---|---|
| U1-001 HQ pick + "Dirikan di sini" | the 15× reco sheet was empty; no confirmation flow; raw key `zone.village` | IMPLEMENTED + TESTED | **PASS**: sheet 6 children, confirm=1, reco_count=1; 05_hq_pick PASS on both profiles |
| U1-002 Tender board | card order placed the active tender outside the viewport; mail sent before the board opened; (b1r4) the Kirim click opens the QuestOffer15x client dialog first, which the b1r3 QA tool did not handle | IMPLEMENTED + TESTED; **b1r4: real click path PASS on both profiles** (see §9) | 07 locked at Lv1 PASS, 19 card visible at Lv3 PASS, 20 bid button **really clicked** PASS; **21 submit → status stayed Open = PRECONDITION_FAIL (UNCLASSIFIED)** |
| U1-035 Dialog history | static history stored translated text with no scoping | IMPLEMENTED + TESTED | PASS: the intro log is clean Indonesian (b1r1) |
| U2-001 Yellow bands / legacy hex | the legacy Map Grid Tender layer was active in 15× | IMPLEMENTED + TESTED | PASS: band gone; soft rings for relevant tenders only |
| U2-002 Night haze | the Unlit haze material stayed day-coloured (luma ±213) and covered the night background | IMPLEMENTED + TESTED | PASS: FAR 47.1, BUILD 104.3, HQ 108.8, nosnow 101.7 (targets 80–112 / FAR 40–85) |

None is **VERIFIED** (no device evidence; llvmpipe ≠ phone). The runtime column is b1r3 (historical); the b1r4 result is in §9.

Additional changes per the user's 19 Nov decisions:
- r407: cubes replaced by contextual windows;
- r408: night criteria per zoom redefined by the Auditor;
- r409: real-click verification of the tender flow.

**Final integrated regression (b1r3, game HEAD `57a381c`, all patches r400–r409):**

| Check | Result |
|---|---|
| EditMode | **2416 / 0 fail / 0 skip / 4 inconclusive**; regressions 0; rollbacks 0 |
| uidev a57 and 960×540 | **98 PASS + 1 PRECONDITION_FAIL** (21_tender_evaluating) per profile; exceptions 0 |
| x15shot lane B | **6/6 PASS**; exceptions 0 |
| WinterNight | BUILD/nosnow/HQ/FAR PASS; **MID FAIL** (warm 0.24 % < 0.25 %); plaza/office PRECONDITION_FAIL (G17) |

## 1. Game commits (branch `remediation/u37h-b1`, from b05 `0b12130`; master U37H `dda07ec` untouched)

| Game commit | Patch | Blocker |
|---|---|---|
| `9348a72` | b1_u1001_r400 | U1-001 |
| `77260cb` | b1_u1002_r401 | U1-002 |
| `d5ed9ef` | b1_u1035_r402 | U1-035 |
| `ea3f4fd` | b1_u2001_r403 | U2-001 |
| `d8bb99a` | b1_u2002_r404 | U2-002 |
| `26de516` | b1_u1001b_r406 | U1-001 (raw `zone.village` key, found in b1r1) |
| `6818d75` | qa05_f17d_r405 | F17d (PerfShot only; reviewed by the Auditor) |
| `efc7447` | b1_elec15x_r407 | cubes → windows (user decision 19 Nov; separate from U2-002) |
| `1be7a33` | qa_b1_wnwarm_r408 | night criteria per zoom (Auditor) |
| `57a381c` | qa_b1_u1002b_r409 | real-click tender verification (QA tool) |

Manifests (all `LENGKAP` per `rollback.py manifest`): `docs/release/patches/<patch>.patch.manifest.md`.

Work repo commits:
- `b24f5a45` (r400–r405);
- `f4d07458` (r406–r409 + b1r1/b1r2 evidence);
- this commit: report + b1r3 evidence.

## 2. Per blocker

### U1-001 / G02 — HQ pick + "Dirikan di sini"

**Root cause:**
- `Region15xPlay.Zones()` did not mark any cell as recommended, and `HubHUD.Onboarding` built an empty sheet.
- There was no confirmation step before BuildHq.
- Follow-up root cause (b1r1): `Region15xGrid.cs:65` sets `Zone = "village"/"rural"`, but strings.csv had no `zone.village`, so the raw key showed.

**Patch:**
- r400: exactly one recommendation via `RecoCellId` (plaza HqCell → nearest cell with lots → first); sheet hidden until it has content; primary button `onb.hq.confirm` "Dirikan di sini" calls the **existing** BuildHq. Switch `Region15xPlay.HqConfirm15x`.
- r406: rows `zone.village` and `zone.village.tenders` in ID/EN/RU.

**Tests:**
- `HqPick15xU1001Tests` (11);
- `HqPickZoneLoc15xU1001bTests` (positive + negative: `Loc.Has` catches a missing key).

**Before/after:** `evidence/b1r1/png/before_after_05_hq_pick.jpg`, `evidence/b1r2/png/05_hq_pick_b1r2.jpg` (no raw key).

**Runtime b1r3:** `QA_HQPICK sheet_children=6 confirm=1 reco_count=1 x15=True`; 05_hq_pick PASS (a57 + 960×540).

**Not changed:** BuildHq/RestoreHq, save schema (D1).

**Remaining:** save/load consistency of `Company.HqTile`↔`Profile.hq` is covered by EditMode tests only; it has not been tested at runtime through the full flow (see §6).

### U1-002 / G01 — Tender board

**Root cause:**
- The order in `HubHUD.Projects` put the active tender after other cards, so it fell outside the viewport (Batch 0.5: y 964/1080).
- The tender mail came from `HubHUD.Missions.cs:274` before the board opened.
- RCA correction: the mail was not from X15EnsureFirstTender.

**Patch:**
- r401: `TenderBoardSlots` order is active tenders → D1 → paths → Lv5 lock (`HubHUD.TenderBoardOrderFix`).
- r401: `Company.TenderNotifiable`/`TenderMailAllowed`, one shared state for availability + notification (`Company.TenderNotifyGate`).

**Tests:** `TenderBoardOrderU1002Tests` (5), `TenderNotifyU1002Tests` (5), `UiDevQaU1002bTests` (10, r409).

**Runtime b1r3, per the user's request (not just "the card renders"):**

| Check | Result |
|---|---|
| Tender appears at the right level | 07: Lv1 = locked (`tender_board_level` 3) PASS; 19: Lv3 `tender_level_ok=1` PASS |
| Card in the viewport | 19: `visible_frac=1`, card at y 337–792 of 1080 PASS (TENDERDIAG) |
| "Ajukan penawaran" button really works | 20: a real `NavigationSubmitEvent` on the visible card's button → bid modal opens (`bid_button=clicked`) PASS |
| Submit button in the modal changes the state | **21: the click on "Kirim" (pre=ready) → status stayed `Open`, `submit_button=not_evaluating` → PRECONDITION_FAIL** |
| Not lost through ordering/scroll | 19/20 PASS; 22_tender_won PASS but **reached through the old fallback path** (`SubmitBid` called directly after 21 failed), so it is **not evidence** of the click flow |

**Diagnosis of 21 (not yet proven at runtime → UNCLASSIFIED):**
- The tutorial tender has a client template (`Company.Tutorial15x.cs:72/80` → `X15TenderTemplate`).
- The "Kirim" button (`HubHUD.Projects.cs:365`) therefore first opens **the client opening dialog** `QuestOffer15x.Gate`. That matches the user decision of 16 Nov, "setiap quest punya dialog pembuka".
- `SubmitBid` only runs after the player accepts the dialog.
- The r409 tool measures the status one frame after the click and does not follow the dialog.

The main hypothesis is that the capture does not follow the dialog (a CAPTURE issue), **but** an alternative is still open: a refusal by `SubmitBid` (team/tariff/level), whose toast is not logged. The class will not be changed until there is runtime evidence (rule 7).

**Proposed follow-up r409b (Auditor; the tool gets stricter, not looser):**
- After "Kirim", log whether the offer dialog is open, plus `LastRefusal`.
- Click the dialog's accept button for real.
- Require `Evaluating` + the Evaluating card visible.
- Shot 22 then counts only if 21 PASSes through the click path.

### U1-035 / G03 — Dialog history

**Root cause:** the static `DialogControls` history stored already-translated text, so it outlived new game/load/language changes.

**Patch r402 (per the user's decision: keys + args):**
- `AddKeyed(speakerKey, speaker, textKey, args, text, lang)` translates when opened.
- `ResetSession` on LoadCompanySafe/NewCompany.
- WIP "say:" lines are tagged with a language and filtered.
- Switch `DialogControls.ScopedOn`.

**Tests:** 9 Core + 7 Game.

**Before/after:** `evidence/b1r1/png/before_after_intro_a3_id_log.jpg`.

**Runtime:** the intro log is clean Indonesian (b1r1/b1r3 PASS).

**Remaining:** the reset hook in `HubHUD.Soak.cs:167` is not done yet (soak/diagnostic only).

### U2-001 / G04 — Yellow bands / legacy hex

**Root cause:** in 15×, `HubHUD.Slots.BuildMapGrid` still built the legacy Map Grid Tender band (DX1 Batch 0.5).

**Patch r403:**
- under 15×, the legacy band is skipped;
- `TenderGrid15x`: one soft ring per *relevant* tender (Open/Evaluating/Won/Developing), edge alpha ≤ 0.35, shared night material.

Valid tender information is kept.

**Tests:** `TenderGrid15xTests` (7).

**Before/after:** `evidence/b1r1/png/before_after_wn_map_hq_night.jpg`, `..._mid_night.jpg`.

**Runtime:** no yellow band (day/night, a57 + 960×540).

**Note:** the FAR warm PASS of 0.27 % in b05f was a **false PASS** caused by the yellow band. That is why r408 redefines it (below).

### U2-002 / G05 — Night haze

**Root cause:** the Unlit `x15_haze` material stayed day-coloured (luma ±213) and covered `NightGrade.Background` (luma 41). DX2 Batch 0.5 proved this (haze off → FAR 204 → 46).

**Patch r404 (scope: the haze material only, per D Batch 0.5):**
- `HazeNight15x`: colour = `Lerp(HazeColor, NightGrade.Background, NightGrade.Current)`.
- Night 0 = bit-identical to before.
- LateUpdate compares one float (cost lock).
- Switch `HazeNight15x.On`.

**Tests:** `HazeNight15xU2002Tests` (5).

**Before/after:** `evidence/b1r1/png/before_after_wn_map_far_night.jpg`.

**Runtime b1r3:**
- FAR 47.1 (b05f 204.3);
- BUILD 104.3;
- HQ 108.8 (b05f 123.3 FAIL → PASS after U2-001);
- nosnow 101.7;
- MID 90.9 (meanL ok);
- daytime BUILD 202.5 (unchanged).

OFF-equivalence r37k3/r37h4 was re-run in b1r1 (FAR byte-identical; the rest = animation noise) → VALID.

## 3. Additional user decisions (19 Nov)

### 3a. Yellow cubes → contextual electrification (r407, separate patch from U2-002)

**Root cause:**
- The `X15_Lampu` cubes (Region15xPowerView, prototype x15play_r26) were drawn floating above houses.
- Every window glowed regardless of `Lit`, through HC_glass/HC_lamp `_NightGlow`.

**Patch:**
- no cubes;
- at night, unpowered houses get a dark-window overlay (material copy `_NightGlow` 0, LOD0 only);
- `Lit`/`LitCount` data kept;
- switch `ElecWindows15x.Enabled`.

**Tests:** 9.

**Before/after (b1r1 → b1r3):** `evidence/b1r3/png/before_after_wn_map_build_night.jpg`, `..._mid_night.jpg`, `..._far_night.jpg`, `..._build_day.jpg`.

| Zoom | Result (looked at in the images) |
|---|---|
| CLOSE/BUILD | cubes gone; lit windows only on some houses, others dark → it reads as "electrified houses look alive". warm 0.51 % PASS. |
| MID | cubes gone; settlement light is **very sparse** (only a few houses lit). **warm 0.24 % < 0.25 % → FAIL.** Reported as a **PRODUCT finding** and **not compensated with fake light**, per the user's decision. |
| FAR | night atmosphere + settlement silhouette (sil 9.07 %, detail 14.4), no glow → PASS under the new criteria |
| Day | identical apart from the cubes disappearing |

**Not yet proven:** "the number of lit windows = LitCount". r407 has no capture log for the Lit count → UNVERIFIED at runtime (EditMode tests only).

**Deferred:** substation/infrastructure light (there is no suitable lamp asset yet).

### 3b. Night criteria per zoom (r408, Auditor)

Defined to match the user's specification, without loosening:

| Zoom | Criteria |
|---|---|
| FAR | warm ≤ 0.10 %, blob ≤ 0.02 %, silhouette ≥ 4.5 % with detail std ≥ 7, meanL 40–85 |
| MID | warm ≥ 0.25 % (unchanged), blob ≤ 0.10 % |
| BUILD/HQ | warm ≥ 0.50 % (unchanged), blob ≤ 0.18 % |

**Tests:** `WinterQaNightZoomTests` (17).

**Open:** `NightLodTarget.WarmFar` (`HubHUD.NightLodShot.cs:25`) still uses the old FAR minimum → Auditor follow-up.

## 4. F17d (PerfShot, parallel; criteria not changed)

**b1r2 (before r407):** 44 PASS / 1 FAIL / 5 PRECONDITION_FAIL; duplicates 0; same-frame 7/8.
- The FAIL (Tinggi_peta_jauh vs lama_peta_jauh, 275 px in the HUD quest-ring animation) is classified CAPTURE, and the strict FAIL is kept.
- The 5 PRECONDITION_FAIL = office (G17).

perf_gate structural FAIL is unchanged from b05f:
- BUILD 887 draw calls / 636k triangles vs 851 / 399k;
- FAR 406 vs 148.

Perfshot has **not been re-run after r407**, and removing the cubes affects the draw calls. It goes into the next round.

## 5. G17 dependency (B05-P1)

Office/plaza in 15× is still unreachable: `RegionCamera`/`RegionCameraClamp.LateUpdate` pulls the focus back to the region.
- `wn_plaza_night`, `wn_office_night` and perfshot `kantor_dalam` = PRECONDITION_FAIL "G17 PRODUCT".
- The camera/gameplay is not changed without diagnosis and a plan (user condition 5).
- Planned as a Batch 3 product route.

## 6. Residual risks and open findings

1. **U1-002 submit flow not proven** (21 UNCLASSIFIED). r409b follow-up + one uidev round.
2. **MID night FAIL after the cubes were removed (product decision, see §7).**
3. **Lit windows = LitCount** has no runtime evidence → needs a capture log (r407b, small).
4. Perfshot after r407 + the HUD animation residual (CAPTURE).
5. `NightLodTarget.WarmFar` (Auditor) and the `HubHUD.Soak.cs` reset hook (U1-035).
6. Tender card text "hex berkabut" (G06 terminology) → Batch 2.
7. HqTile↔Profile.hq save/load: unit tests only.
8. uidev: 19 UI issues on 9 of 99 screens (same as b1r2, not a new regression); profiles vivo_y/r20x9/r19_5x9/r18x9 are not run in this chain (summary "0/6 profil" = only 2 profiles were run).
9. **Release safety:** all of Batch 0.5/1 (game repo, evidence) has **no backup outside the VPS** → `docs/recovery/RECOVERY_READINESS_REPORT.md` (PREPARATION_BLOCKED, waiting for user authorization).

## 7. Product decisions for the user

**D-B1-1 — MID night after the cubes were removed.** Early in the game only a few houses are electrified, so MID looks almost dark (warm 0.24 %, minimum 0.25 %). Options:
- **(a)** accept MID as dark while electrification is low (honest to the data; the criterion becomes conditional on the electrification ratio — needs an Auditor redefinition);
- **(b)** a subtle MID aggregation of *real* lit houses (e.g. a slightly stronger window glow at MID for `Lit` houses only — no light for unlit houses);
- **(c)** keep the FAIL as an open finding until electrification data increases naturally (mid/late game captures).

No fake light is added under any option.

**D-B1-2 — 21_tender_evaluating:** approve r409b (the tool follows the client dialog, logs the refusal) before U1-002 is declared runtime-complete.

## 8. Evidence

| Evidence | Location |
|---|---|
| b1r1 | `evidence/b1r1/` (uidev + winter + HQ pick + OFF-eq + EditMode 2367) |
| b1r2 | `evidence/b1r2/` (perf, uidev, EditMode 2380) |
| b1r4 | `evidence/b1r4/` (EditMode 2447, uidev 99/99 x2, winter elec metrics, u1002c log, 21/22 valid PNG, PerfShot + gate vs b1r2u, rolled_back) |
| b1r3 | `evidence/b1r3/` (EditMode 2416, uidev a57/960×540 shots + winter metrics + u1002b/hqpick logs, x15shot 6/6, before/after night/day sheets, 20_bid, 21 INVALID) |
| Original rounds (VPS) | `/srv/rm/docs/evidence/169_parity_b1r{1,2,3}{,u}`, `/srv/rm_b/docs/evidence/169_parity_b1r{1,3}x` |

## 9. Round b1r4 (19 Nov, 06:07–07:24): r410 (D-B1-1) + r411 (D-B1-2)

Scope: only the two QA/Auditor patches approved on 19 Nov. No production gameplay, lighting, camera, economy or save change. b1r3 results in §0–§8 stay as historical evidence.

### 9.1 Commits and manifests
| Game commit | Patch | Content | Manifest |
|---|---|---|---|
| `1f1ffcb` | qa_b1_wnmid_r410 | MID night CONDITIONAL_PASS by electrification ratio (T = 0.60, provisional); lit-window = LitCount check; `NightLodTarget.WarmFar` minimum removed → `WarmFarMax`/`BlobFarMax`; read-only accessors in ElecWindows15x/Region15xPowerView; 21 tests | LENGKAP |
| `03743a9` | qa_b1_u1002c_r411 | uidev follows the QuestOffer15x client dialog with real presses (Lanjut → choice → Terima), logs refusal/validation, shot 22 valid only via the click path; fallback logged as error; 10 tests | LENGKAP |

Game HEAD `03743a9` (branch `remediation/u37h-b1`). Master U37H `dda07ec` untouched. Patches + manifests: `docs/release/patches/`.

### 9.2 Results per job (reported independently)
| Job | Result | Compared with |
|---|---|---|
| EditMode (b1r4) | **2447 pass / 0 fail / 0 skip / 4 inconclusive** (= 2416 + 21 + 10) | b1r3 2416/0/0/4 |
| Build (b1r4u) | ok, CS errors 0 | — |
| uidev a57 (2340×1080) | **99/99 PASS**, 0 PRECONDITION_FAIL, 0 missing metrics, 0 duplicates; 19 UI issues on 9/99 screens (unchanged) | b1r3 98 + 1 PF |
| uidev small16x9 (960×540) | **99/99 PASS**, same counts | b1r3 98 + 1 PF |
| uidev other profiles | **NOT_TESTED** (vivo_y, r20x9, r19_5x9, r18x9 not in this chain; the "0/6 profil" summary line counts them as not passed) | — |
| WinterNight (both profiles, identical verdicts) | BUILD/nosnow/HQ/FAR/day PASS; **MID CONDITIONAL_PASS**; plaza/office PRECONDITION_FAIL (G17); sub-summary 5 PASS + 1 CONDITIONAL_PASS + 2 PF → verdict FAIL | b1r3 MID FAIL |
| PerfShot (b1r4u) | 45 PASS / 0 FAIL / 5 PRECONDITION_FAIL; duplicates 0; same-frame 8/8; perf_gate FAIL (gagal=2, structural) | b1r2u 44/1/5, same-frame 7/8 |
| x15shot lane B | NOT re-run (no lane-B change); latest valid = b1r3 6/6 | — |
| NightLod capture | NOT run; `WarmFar` fix covered by EditMode test `NightLodFar_MaksTanpaMinimum` only → runtime NOT_TESTED | — |
| Device | **NOT_TESTED** (VPS llvmpipe only) | — |

### 9.3 U1-002 tender submit (D-B1-2) — engineering diagnosis
Log (both profiles):
```
u1002c submit_dialog opened=1 outcome=accepted steps=next:6,choice:1,accept:1
u1002b submit_button pre=ready state=clicked status=Evaluating tariff=86
```
- Shot 21: `submit_button_clicked=1`, `evaluating_card_visible_frac=1` → PASS. Capture shows the card with status "Dinilai" and the top notice "Penawaran dikirim. Panitia sedang menilai."
- Shot 22: `tender_won_via_click=1` → PASS ("Tender dimenangkan!"). No `u1002c FALLBACK` line in either log.
- **Classification of the b1r3 failure: unhandled client dialog (QA instrumentation), not a genuine `LastRefusal`.** The Kirim button opens `QuestOffer15x.Gate` first for the tutorial tender; b1r3 never accepted it, so `SubmitBid` was not reached and the status stayed Open. With a real accept the submit succeeds and the status moves to Evaluating. No production tender code changed.
- U1-002 runtime status (VPS): level gate (07 locked Lv1), viewport (19 card visible, TENDERDIAG visible_frac=1), bid button (20), submit (21), win (22) all PASS by real clicks.

### 9.4 MID night (D-B1-1) — raw values
| Shot | elec ratio (LitCount / lots) | LitCount | lit windows | raw warm | blob | meanL | Verdict |
|---|---|---|---|---|---|---|---|
| wn_map_mid_night | 0.526 (209/397), T = 0.60 | 209 | 209 | **0.24 %** (min 0.25 not applied below T) | 0.025 % | 90.9 | **CONDITIONAL_PASS** |
| wn_map_build_night | 0.526 | 209 | 209 | 0.51 % | 0.115 % | 104.3 | PASS |
| wn_map_build_night_nosnow | 0.526 | 209 | 209 | 0.55 % | 0.118 % | 101.6 | PASS |
| wn_map_hq_night | 0.526 | 209 | 209 | 1.63 % | 0.120 % | 108.8 | PASS |
| wn_map_far_night | — (not applicable) | — | — | 0.0013 % | 0.000 % | 47.1 | PASS |

- `elec_*` metrics are **present** on every shot where they apply (build/nosnow/mid/hq) on both profiles → no missing instrumentation.
- Lit windows = LitCount (209 = 209) on all four → **no mismatch**. Note: this is an object-level count (window renderers built by `ElecWindows15x` for `Lit` lots, via `Census`), not a pixel count. It is the runtime evidence the user asked for. It does not replace a visual check.
- `WINTER_NIGHT total conditional_pass=1` printed. CONDITIONAL_PASS is **not counted as PASS**: the winter sub-summary verdict is FAIL (with the 2 G17 PF), and `regress_lock` treats every non-PASS as fail.
- T = 0.60 remains **provisional**. It rests on two observations from region_17, and the Auditor re-calibrates it when a round produces another ratio point.

### 9.5 PerfShot vs previous valid baseline (b1r2u, before r407)
| Seimbang | b1r2u draw calls / tris | b1r4u draw calls / tris | Δ |
|---|---|---|---|
| peta_bangun (BUILD) | 887 / 636.0k | 889 / 637.9k | +0.2 % / +0.3 % |
| peta_tengah (MID) | 325 / 403.0k | 319 / 400.5k | −1.8 % / −0.6 % |
| peta_jauh (FAR) | 406 / 115.9k | 405 / 115.9k | ≈ 0 |
| peta_lebar | 304 / 404.5k | 296 / 404.5k | −2.6 % / 0 |
| F2 shadow cost peta_bangun | −1.3 % | +1.5 % (max +15 %) | PASS both |

- r407 (cubes → windows) is **render-cost neutral**: the cube draw calls removed are roughly replaced by the window renderers.
- perf_gate FAIL gagal=2 is **the same structural FAIL as b1r2u and b05f**: BUILD 889/638k vs the hc2 budget 851/399k, FAR 405 vs 148. Not new and not caused by Batch 1.
- Frame times (rata_ms) are 10–30 % higher on every screen, including the UI-only pages (proyek 49 → 58 ms, tim 47 → 62 ms) whose draw calls did not change. That points to host load on the llvmpipe VPS, not to the patches. Frame time on llvmpipe is not a device metric.
- The b1r2u FAIL (Tinggi_peta_jauh HUD animation, CAPTURE) did not recur. same-frame is 8/8.

### 9.6 All PRECONDITION_FAIL and UNCLASSIFIED cases in b1r4/b1r4u
| Case | Count | Class | Cause |
|---|---|---|---|
| perfshot `kantor_dalam` (lama, Tinggi, Seimbang, Seimbang_tanpa_bayangan, Hemat) | 5 | PRECONDITION_FAIL, PRODUCT (G17) | `officeV31=offscreen(focus_clamped_region15x)`; region camera clamp |
| winter `wn_plaza_night` (a57, small16x9) | 2 | PRECONDITION_FAIL, PRODUCT (G17) | `plaza=offscreen(focus_clamped_region15x)` |
| winter `wn_office_night` (a57, small16x9) | 2 | PRECONDITION_FAIL, PRODUCT (G17) | `officeV31=offscreen`, focus_want 1159.7,59.8 vs focus_now 0.6,28.6 |
| UNCLASSIFIED | **0** | — | the b1r3 shot-21 UNCLASSIFIED is resolved (§9.3) |

All 9 are the known G17 dependency (B05-P1, Batch 3). None is new.

### 9.7 Rollback — runner decision (separate from the diagnosis)
- **Runner decision: no rollback.** `rolled_back.txt` for b1r4 and b1r4u contains only its header. DIPASANG: `qa_b1_wnmid_r410 qa_b1_u1002c_r411`. DITAHAN: none. ROLLBACK: none.
- b1r4 (tests): `tests pass=2447 fail=0` → judge PASS, no candidate.
- b1r4u perfshot: the lock printed `fail=5 <= 0 -> FAIL` and `precondition_fail=5 <= 0 -> FAIL`. The judge JSON classifies both as `FAIL tanpa baseline` (R16 has no comparable perfshot shots metric) → `regresi=0 pre-existing=0 baru=2` → exit ≠ 3 → the rollback branch is not entered. Additionally, b1r4u's queue was empty (APPLIED empty), so no candidate patch would have existed.
- uidev: `LOCK RINGKAS gagal=0` on both profiles; judge `regresi=0`.
- **Runner-structure observation (not changed; reported for the Auditor/user):**
  - Capture jobs run in the "u" round, whose APPLIED list is empty, while the patches are installed in the preceding tests-only round. A capture regression caused by r410/r411 would therefore have been reported but **not automatically rolled back**.
  - The uidev judge JSON is written only for the last profile (small16x9); a57 is covered by the lock line only.
  - The guard was neither disabled nor weakened. No reapply was needed.
- Pre-rollback evidence: none needed. Round evidence is preserved as-is in `/srv/rm/docs/evidence/169_parity_b1r4{,u}` and copied to `evidence/b1r4/`.

### 9.8 Engineering diagnosis (separate from the runner decision)
- r410 behaves as specified: MID moves from FAIL to CONDITIONAL_PASS with raw warm 0.24 % reported. BUILD/HQ/nosnow keep PASS with the window check ok. FAR is unchanged.
- r411 proves the tender submit works end to end through the player's real path. The b1r3 failure was the QA tool, not the product.
- Accepting the client dialog changes `QuestOffer15x` acceptance and relation state for later shots: 99/99 on both profiles, so no visible side effect in this run.

### 9.9 Status of the Batch 1 closing checks (user, 19 Nov)
| Check | Status |
|---|---|
| Runtime evidence lit windows vs LitCount | **DONE** (object level, 209 = 209 on four shots × two profiles) |
| PerfShot re-run after r407 | **DONE** (§9.5) |
| `NightLodTarget.WarmFar` fixed | IMPLEMENTED + TESTED (EditMode); NightLod capture NOT_TESTED |
| Device status separate from VPS | All five blockers: VPS runtime PASS; **device NOT_TESTED**; nothing VERIFIED |
| Tender PASS only via a real click ending in visible Evaluating | **DONE** (§9.3) |

### 9.10 Remaining product and tool findings
1. G17: office/plaza unreachable in 15× (9 PF) → Batch 3 product route.
2. G06 terminology: "7 hex berkabut" on the tender card (shot 21) and "Hex untuk dijelajahi" in the win modal (shot 22) → Batch 2.
3. MID at low electrification looks dark by design (D-B1-1). Visual acceptance of the MID capture is the user's call; T = 0.60 is provisional.
4. perf_gate structural FAIL (BUILD/FAR over the hc2 budget) → Batch 7/perf, not a Batch 1 regression.
5. Auditor: `shots_classify.py` has no CONDITIONAL_PASS class (falls into UNCLASSIFIED, conservative); runner rollback coverage for capture jobs in "u" rounds (§9.7).
6. `HubHUD.Soak.cs` reset hook (U1-035); 19 UI issues on 9/99 screens (pre-existing); uidev profiles other than a57/small16x9 not run.
7. Substation light at night (not in Batch 1 scope).

**Batch 1 recommendation:** all five blockers are IMPLEMENTED + TESTED with VPS runtime PASS (MID as CONDITIONAL_PASS). Not VERIFIED (no device). Closing Batch 1 at the "TESTED (VPS)" level needs the user's acceptance, including visual acceptance of the MID capture.

Evidence for b1r4: `evidence/b1r4/`. It contains:
- runner logs;
- EditMode log;
- per-profile shots, summaries, tenderdiag, u1002 logs and winter metrics;
- PerfShot csv/summary/zoom plus perf_gate output for b1r4u and the b1r2u baseline;
- `rollback/` rolled_back files;
- `png/`: 20, 21, 22 and the night captures.
