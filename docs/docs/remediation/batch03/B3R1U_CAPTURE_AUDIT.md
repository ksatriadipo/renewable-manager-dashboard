# b3r1u capture audit (orchestrator, 21 Nov 2026)

Rounds: b3r1 EditMode 2594/0/0/4 (r520–r523, game repo 11d2d0e); b3r1u build + uidev A57/960×540 + perfshot.
uidev: A57 18 issues / 8 of 99 screens (b2r4u 21/9), 960×540 18/8 (b2r4u 18/8); lock gagal 0; judge regressions 0; P12c 0/6 (unchanged).
Perfshot: 50/50 PASS, precondition_fail 0 (b2r4u: 5× kantor_dalam precondition_fail), same-frame 8/8.
Visual evidence = screenshots only; code tests are not visual proof. All captures switch ON; OFF verified by EditMode only.

| Patch | Capture | Verdict | Note |
|---|---|---|---|
| r523 office | 50, 51, 52, 54 | PASS | Before: world from above. After: office interior (floor 2 / floor 1, crew, visitor). |
| r523 office | 53_office_night | NEEDS RECHECK | Interior is night-shaded but the backdrop around the room stays light/day-coloured |
| r523 office | 44_office_mission | NEEDS RECHECK | Unchanged: Erina dialog over world (scenario may be Beranda, not office) — confirm what the shot should show |
| r523 office | perfshot kantor_dalam ×5 | PASS | precondition_fail cleared (B05-P1) |
| r520 cable | 94, 96 (+zoom) | NEEDS RECHECK | Grey cube replaced by kiosk + poles; but at this zoom the line still crosses residential blocks diagonally — needs a CLOSE capture to judge route/clearance/sag; log line X15POWER konflik_rumah not found in evidence |
| r520 cable | 98_plant_feasibility | PASS (unchanged) | Card unchanged as expected |
| r521 map | 39, 23, 26, 48 | PASS (baseline preserved) | Identical to b2r4u |
| r521 map | tender highlight | NOT_TESTED (visual) | No capture with an open tender in a region |
| r522 hq gate | 88_hq_gate_progress | **FAIL — false PASS** | Shot verdict PASS (metrics req 4 / met 3, hq_state Locked) but the PNG shows the "Skill direktur" panel, not the HQ gate progress. Tool measured the gate but photographed another modal → r522 NEEDS_REWORK; must PRECONDITION_FAIL when the visible panel is not the gate |

## Screenshot rename mapping (r528, B3R3)
| Legacy name (≤ b3r2u) | New name (≥ b3r3u) | Scenario (unchanged) |
|---|---|---|
| `44_office_mission` | `44_beranda_mission_dialog` | Beranda plaza (`_interior = false; Select("office")`) + Erina mission dialog; not the office interior |

Comparison tooling: `rollback.judge` locks are keyed by capture job/profile + metric, not by PNG name, so the rename cannot register as a missing lock. Visual before/after pairing for this shot uses this table (manual baseline mapping). Office camera behaviour and the step scenario are not modified.

## b3r2u — r524 HQ gate (Unity, 21 Nov 2026)
EditMode b3r2 2597/0/0/4. uidev A57 21 issues / 9 screens (+3 = `69_garage` "lompatan-tata-letak" only, unrelated to r524 QA-only change → recheck in b3r3u), 960×540 18/8; regress lock gagal 0; judge regressions 0.

| Profile | Shot | Verdict (tool) | Visual review | Metrics |
|---|---|---|---|---|
| A57 | 88_hq_gate_progress | PASS | PASS — gate card "Tingkat HQ berikutnya: Tingkat 2" open, 4 rows fully visible inside modal + safe area (card x 157 > inset 96), badges Beres×3 / Belum×1 = data mw/level/spent met, row3 todo | req 4, met 3, rows_visible 4, rows_covered 0, panel hq_gate_card |
| 960×540 | 88_hq_gate_progress | PASS | PASS — same card, all 4 rows + badges visible | req 4, met 3, rows_visible 4, rows_covered 0 |

r522 false PASS (b3r1u) is not repeated. Runtime occlusion with two rendered elements = r529b in b3r3u (NOT_TESTED until then).

## b3r3u — r525/r526/r528/r529b/r527c runtime (21 Nov 2026)
EditMode b3r3 2645/0/0/4 (`7d5c958`). Build OK. Perfshot regress 0 (known PERF GATE FAIL, konfig Seimbang). uidev A57 18 issues / 8 screens, 960×540 18/8. Shot numbering unchanged (88 hq_gate_progress, 89 plant_solarground, 94 r9c_roof_build_night). `44_beranda_mission_dialog` present (r528 mapping holds).
**Regression lock FAIL (VI-F15) on both profiles: fail 5, measure_fail 4, missing_metrics 32, precondition_fail 5 — all caused by the r525 evidence shots being written into the regular uidev shot log.** → b3r3u NOT accepted; b3r4 (r527e) stays gated.

| Item | Evidence | Verdict |
|---|---|---|
| r529b live occlusion (A57 + 960×540) | `b3r529_hqgate_selftest.json`: token before `hq_gate_progress`; real overlay on row 1 → `hq_gate:rows_covered_1`; overlay removed (2 frames) → `hq_gate_progress`; overlay beside row → not covered, no overlap; lingering 0; root child delta 0; `selftest_b3r529_hqgate_occluded.png` shows the pink overlay over row 1 | **PASS (Unity runtime)** — negative + positive proven; overlay evidence kept out of the uidev log |
| 88_hq_gate_progress | PASS both profiles, same card/badges as b3r2u | PASS |
| r528 rename | `44_beranda_mission_dialog` both profiles | PASS |
| r523 office day/night (same camera) | `b3r525_office_day_on` / `night_on`: room night-graded; backdrop luma 0.5626 day and night (identical) | Finding CONFIRMED: camera clear colour #5C9E96 not night-graded → separate visual-consistency finding (no fix applied) |
| r523 OFF | `b3r525_office_day_off` = legacy world view | OFF matches legacy (visual) |
| r520 cable close-up (ON/OFF) | `b3r525_cable_route_*__INVALID`: frame shows map overview + Erina dialog, no cable; geometry metrics missing (NaN) | **NEEDS_REWORK (capture)** — no evidence about the cable itself |
| r521 tender highlight via r527c fixture | precondition: only 1 unlocked region of 30 at that point (`plain_regions_1_lt2`); fixture not installed; `locked_tap … selectable1`; state hash changed `[save_full]` without fixture → FAIL | **NOT_TESTED** (scenario not reachable at that step); two items to investigate: locked-tap "selectable1" semantics and the save_full hash change |

## r520 product defect — cable routes pass houses (reported 21 Nov 2026, before any fix)
Evidence: b3r3u `player.log` (A57 + 960×540): `X15POWER: g18a_cable gardu=A15-B4A-GARDU-KIOSK-V001 kabel 1 tiang 8 konflik_rumah 17`, `kabel 2 tiang 17 konflik_rumah 38`, `kabel 3 tiang 24 konflik_rumah 56` (cumulative; per cable 17 / 21 / 18 houses within the 6 m clearance).
Cause (code, FACT): `Game/World/X15/PowerLine15x.cs` route planner evaluates only three candidates (straight, two single-L) and keeps the one with the fewest conflicts even when every candidate conflicts (`Conflicts(...)` counts buildings whose footprint radius + `HouseClearM` touches a segment). There is no road-following or obstacle-avoiding search.
Impact: violates r520 acceptance (no cables to/over houses, plausible routes, ≥ 6 m clearance). B3-04 → NEEDS_REWORK (product). r520 switch `PowerLine15x.Enabled` defaults ON in tester builds.
Proposed fix (PROPOSAL, awaiting owner): route along the road/verge network from map geometry (owner decision 15 Nov "geometri peta = sumber kebenaran") with a grid/graph search that treats house footprints + 6 m as blocked; if no clear route exists, place the kiosk/substation at a reachable node or keep the old straight line OFF — never accept a conflicting route; acceptance = measured clearance ≥ 6 m for every cable in the r525b close-up evidence. Interim option: set `PowerLine15x.Enabled` default OFF until fixed (OFF = legacy behaviour, already verified).

## b3r5u — r525b evidence channel (21 Nov 2026)
EditMode b3r5 2652/0/0/4. uidev A57 18/8, 960×540 18/8; **regression lock gagal 0 on both profiles** (evidence now in `b3r525_evidence.jsonl` + raw PNG, not in shots.jsonl) → capture integrity restored.

| Evidence | Measured (A57; 960×540 identical) | Verdict |
|---|---|---|
| r520 cable 1 ON (route + near-house close-up) | endpoints matched 1; poles 8 @ 11.0 m; max span 43.2 m; sag 2.0 %; **house_intersections 5; min_house_clear_m 0** | **FAIL** — confirms product defect (close-up shows the cable crossing a house block) |
| r520 cable 2 ON | poles 9 @ 11 m; span 47.5 m; sag 2 %; **house_intersections 7; clearance 0 m** | **FAIL** |
| r520 cable 3 ON | poles 7 @ 11 m; span 44.9 m; sag 2 %; **house_intersections 5; clearance 0 m** | **FAIL** |
| r520 OFF (legacy straight line) | no poles; house_intersections 5 (record only) | OFF = legacy (recorded) |
| Locked-region tap | `locked_tap_target_changed 0`; `locked_tap_infocard_selectable 1` (island-map info card only) | Locked regions are **not** selectable as project targets (FACT); r521 locked look unchanged (`locked_tint_unchanged 29`) |
| r521 tender highlight | 29 of 30 regions locked at every autoshot step (no step has ≥ 2 Open regions) | **NOT_TESTED** (scenario unreachable without unlocking regions) |
| r527c fixture integrity | fixture not installed; `save_full_changed: maxSeenUnix,residents` | Finding: `save_full` hash includes real-time fields (`maxSeenUnix` wall-clock guard, `residents` simulation) that change during any capture → fixture restoration check must hash these separately as volatile (proposal for Auditor; criterion unchanged until approved) |
| r523 office day/night/OFF | PASS (edge_clear_hits 0) | as b3r3u |
| r529b occlusion | PASS (unchanged) | as b3r3u |

## b3r6 / b3r6u — r530 road-following routing, actual Goldmeadow (21 Nov 2026)
HEAD `ed0b01c` (r530) on `a2f8876` (r525b). EditMode 2659/0/0/4. Build OK. uidev A57 18/8, 960×540 18/8; **regression lock gagal 0 both profiles**; judge regressions 0; perfshot lock 0 (known PERF GATE FAIL unchanged, F2 +1.2 %). r529b self-test, r523 office evidence unchanged (PASS). Switch default OFF (`DefaultEnabled = false`); evidence ON shots force the switch ON (`switch_powerline15x 1`), OFF shot = legacy straight line.
player.log: `X15POWER: g18a_cable gardu=A15-B4A-GARDU-KIOSK-V001 kabel 3 tiang 45 konflik_rumah 0 dipindah 1 tanpa_rute 0`.

| Cable | Houses crossed | Min house clearance | Poles (11 m) | Max span | Sag | Endpoints | Verdict |
|---|---|---|---|---|---|---|---|
| 1 | 0 | 10.83 m | 13 | 48.08 m | 2 % | not matched (0) | FAIL |
| 2 | 0 | 10.49 m | 18 | 48.00 m | 2 % | not matched (0) | FAIL |
| 3 | 0 | 10.83 m | 14 | 48.08 m | 2 % | not matched (0) | FAIL |

Visual review: cables no longer cross houses (FACT, measured + PNG). **Defects:** (1) `b3r525_cable_nearhouse_1_on.png` / `_3_on.png`: the route runs past the island land edge and poles stand in the void (floating poles) — terrain boundary not blocked in r530; (2) cable 2 cuts diagonally across open fields rather than following road/verge; (3) endpoints_matched 0 is unresolved: the kiosk was relocated (`dipindah 1`) and the measurement compares against the original substation data point — not yet proven to be a measurement artefact; (4) route-planning time not measured in the game (no timing instrumentation in r530).
**Decision: r530 REJECTED (actual-world).** B3-04 stays NEEDS_REWORK; switch stays OFF. Rework in progress: r530b (slope, water/bridge, terrain boundary, min corner spacing 8 m, cache/lifecycle, timing API) + r531 (per-cable measurement against actual kiosk, off-land poles as invalid, 20-rebuild performance).

## b3r8 / b3r8u — r530b + r531 + r530b2 (21 Nov 2026)
HEAD `1e2392a`. EditMode b3r8 **2679/0/0/4** (r407 lock restored by r530b2). Build OK. Perfshot lock 0 (known PERF GATE FAIL; F2 −0.8 %). uidev A57 / 960×540 18 issues / 8 screens each (from screenshot audit).
**Regular uidev verdict: FAIL (tooling)** — runner HANG_GUARD killed the player at 18:37:37 and 18:43:13 (`120 dtk tanpa tangkapan baru (png=113)`) during the r531 performance series (no PNG for > 120 s), so `shots_summary.json` was not written → VI-F15 locks "FAIL tanpa baseline". Hang guard unchanged; r531b reworks pacing.

| Evidence | Result |
|---|---|
| r530b fail-closed (actual Goldmeadow) | `X15POWER … kabel 0 tiang 0 … tanpa_rute 3 alasan 1:pembangkit_tanpa_penghubung:jauh_dari_jalan, 2:graf_tidak_tersambung_ke_gardu, 3:graf_tidak_tersambung_ke_gardu` — no invalid cable drawn; `b3r531_noroute_1..3_on` PASS |
| Planner timing (log) | cold 102.2 ms (graph 2,892 nodes / 455 edges, 3 plants, 398 houses), warm 0.0 ms (cache hit); full 3×20 series NOT_RECORDED (killed) |
| r531 legacy OFF 1–3 | PRECONDITION_FAIL — cause under investigation (r531b) |
| Island overview | NOT_TESTED (island map deactivates the power root) |
| Corner close-up | NOT_TESTED (no route has a turn) |
| Switch toggle / overview after ON→OFF | NOT_RECORDED (killed before) |
B3-04 stays NEEDS_REWORK; switch OFF. Next round: r530c + r530f + r531b.

## b3r9 / b3r9u — r530c + r530f + r531b, actual Goldmeadow (21 Nov 2026)
HEAD `727d8c8` (r530c `5bc1fc1`, r530f `6c21978`, r531b `727d8c8`). EditMode **2706/0/0/4**. Build OK. uidev A57 + 960×540: 18 issues / 8 screens each, `shots_summary.json` written, **regression lock gagal 0 both profiles** (hang guard not triggered: max PNG gap 24.4 s, r531 block 316 s / cap 480 s). Perfshot: **lock FAIL 1 — `Tinggi_peta_jauh` same-frame sha1 ≠ `lama_peta_jauh`**; 281 px differ (AE, fuzz 2 %) of 2.5 M, no visible change, cable switch OFF in perfshot, same pair PASS in b3r8u → same class as G22 (sim state moves between same-frame shots); lock left FAIL (Auditor).
player.log: `X15POWER: g18a_cable gardu=A15-B4A-GARDU-KIOSK-V001 kabel 3 tiang 18 konflik_rumah 0 dipindah 1 tanpa_rute 0`.

| Cable (ON) | Houses crossed (exact/sampled) | Overhead min clearance | Underground min to footprint | Overhead / underground m | Poles | Max span | Min corner | Endpoints (kiosk / plant) | Off-land / water / no-build | Road adherence | Underground outside town |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 0 / 0 | 8.0 m | 5.1 m | 180 / 132 | 6 | 41.2 m | 20.0 m | 0 / 0 m | 0 / 0 / 0 | 100 % | **8.0 m** |
| 2 | 0 / 0 | 8.0 m | 5.1 m | 142 / 666 | 6 | 41.2 m | 16.0 m | 0 / 0 m | 0 / 0 / 0 | 100 % | **8.0 m** |
| 3 | 0 / 0 | 8.0 m | 5.1 m | 144 / 132 | 6 | 41.2 m | 17.6 m | 0 / 0 m | 0 / 0 / 0 | 100 % | **8.0 m** |

OFF (legacy straight line, no poles): legacy_known_r520 recorded, PASS (not a regression of ON). Overview after ON→OFF: no stale ON objects (PASS); switch toggle 3× + rebuilds: PASS. evidence_readonly_ok = 1 on every record. Island overview NOT_TESTED (island map deactivates the power root); no-route case NOT_TESTED (all 3 plants routed).
Performance (VPS software renderer, 20 rebuilds per series, same start state):

| Series | Plan ms median/P95/max | Main-thread rebuild ms | Frame spike ms |
|---|---|---|---|
| cold | 139 / 167 / 167 | 152 / 181 / 187 | 29 / 65 / 67 |
| invalidated | 132 / 164 / 176 | 146 / 179 / 187 | 28 / 55 / 65 |
| warm | 0 / 0 / 0 | 12 / 14 / 17 | 1.6 / 17 / 19 |
Initial generation: plan 99.8 ms, main thread 114 ms. Planning runs on the main thread.

**Outcome: CONDITIONAL PASS (geometry, endpoints, boundary, adherence, OFF/ON all PASS in the real world).** Open conditions: (1) underground runs 8.0 m outside the town edge at risers — owner ruling on the "underground only in town" rule; (2) perfshot same-frame lock FAIL (G22 class, not cable-related) — Auditor; (3) ~150 ms main-thread hitch on cold/invalidated rebuild measured on the VPS software renderer — device impact unknown (rebuilds happen on plant/geometry change only; warm 12 ms). B3-04 stays NEEDS_REWORK until the conditions are resolved; switch stays OFF.
Owner ruling (21 Nov 2026): underground lateral to the transition pole up to 12 m outside the town edge ACCEPTED (measured 8.0 m) → condition (1) closed. Remaining: (2) perfshot same-frame G22 (Auditor), (3) rebuild main-thread hitch (device measurement pending; owner/Auditor).

## b3r10 / b3r10u — r527f + r532 (22 Nov 2026)
HEAD `7f2a937` (r527f `65fb0e2`, r532 `7f2a937`). EditMode **2735/0/0/4** (NUnit XML `Library/JobRunner/done/20261122-023719-24916-tests.xml`): SaveGuardRuntimeR527eTests 9/9, B3TenderFixtureR527Tests 22/22, PerfShotSameFrameR532Tests 14/14, QaShotLogTests 5/5, ElecWindows15xR407Tests 9/9, B3QaR529Tests 10/10 (r529b), OfficeEntry15xG17aTests 9/9 (r523), UiDevQaB3HqGateMatrixTests 16/16; inconclusive = the same 4 pre-existing tests. Build OK. uidev A57 / 960×540: 18 issues / 8 of 99 screens each, **regression locks gagal 0**, judge regressions 0.
**r532 (G22): works** — `Tinggi_peta_jauh` sha `3e5e5e70f1` = `lama_peta_jauh` `3e5e5e70f1`; same_frame_verified 8/8.
**Perfshot lock FAIL (2): fail 1 + duplicates 1 = `Seimbang_tanpa_bayangan_peta+modal` byte-identical to `Seimbang_peta+modal` (sha `35c162c24d`).** Cause (code): the `_tanpa_bayangan` config only sets `MapDecor.NoPlanarShadow` (HubHUD.PerfShot.cs:211) — legacy hex-map decor shadows that are not rendered in the 15× world → the setting has no visible effect; earlier rounds differed only through sim drift, which r532 now freezes. Consequence: KPI F2 "bayangan peta_bangun" (−14.0 % this round) compares identical scenes = noise. Measurement-definition finding for the Auditor (not a product regression, not caused by r527f/r532 behaviour).
Save integrity (uidev fixture runs, both profiles): `save_untouched 1`, `save_write_attempts 0`, teardown_ok 1; fixture still not installable (`plain_regions_1_lt2`) → B3-06 tender highlight NOT_TESTED; `save_full` hash mismatch from volatile fields `maxSeenUnix,residents` (rule unchanged pending Auditor approval). r523 office day/night/OFF evidence PASS.
Verdict: r527f **TESTED** (Unity EditMode against real save code + capture-run save integrity), r532 **TESTED** (G22 pair now identical), round **not clean** (perfshot lock FAIL on the duplicate/F2 measurement definition) → Round A gate waits for the Auditor ruling.
Auditor ruling (22 Nov, AUDIT_PERFSHOT_SHADOW_DUP.md): measurement-definition defect, not a product regression — no planar shadows exist in the 15× player build (HCShadow15x/Sun15x only with `-x15parity` Shadows; MapDecor off under 15×), so `_tanpa_bayangan` is a no-op; peta+modal byte-identical (SHA-256 c8573901723f… both) is a true result after the r532 freeze; KPI F2 −14.0 % = noise (must not be quoted). Proposal P1 (duplicate allowed only for that pair when measured visible planar shadows = 0 on both, counted as `duplicates_noop_shadow`) + P2 (F2 NOT_APPLICABLE when no shadows; real F2 in a `-x15parity Shadows` pilot job) — not applied. Gate: Round A (b3r11) may start; perfshot stays FAIL; Round A passes only if perfshot equals b3r10u exactly (fail 1 + duplicates 1 on the same shot id, precondition_fail 0, missing_metrics 0); any new failure (esp. kantor_dalam from r534) fails Round A. Side note: vehicles still move between configs on peta_bangun despite the r532 freeze (logged for the r532 owner).
