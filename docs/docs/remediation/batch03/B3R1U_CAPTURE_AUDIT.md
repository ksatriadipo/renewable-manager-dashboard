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
