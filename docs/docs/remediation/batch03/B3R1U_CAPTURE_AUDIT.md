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
