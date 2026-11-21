# PHASE 1 REPORT: Repository Integrity, Document Reconciliation, Architecture Verification, G22 Verification Integrity

## Phase
Phase 1 of Master Technical Engineering Directive v2 (18 Nov 2026). Read-only: no game code changed, no Unity run, no feature-flag changed.

## Baseline
- Game repo `/srv/rm`, branch `master`, HEAD `dda07ec` (patch vis15x_r37h4). Working tree clean apart from the untracked folders `scratch/` and `work/`, which are not part of the game.
- Unity 6000.6.7f1, Built-in RP. Real game scene `Assets/Scenes/WorldSlice.unity` is not in EditorBuildSettings. Every build script passes it explicitly; the only build-settings writers are the legacy Beta/Prototype builders (ARCHITECTURE_INTEGRITY §4).
- Work repo `/srv/rm/work`, branch `work/2026-11-03`, HEAD `fbefc87a` before this report. Directive v2 says `9529e1df`, which is older; the newer commits are the Batch 0 documents only.
- Lane B tree `/srv/rm_b` at `8775ccb`, a capture copy synced from `/srv/rm` by tar, not a working branch.
- Patch stack (newest first): vis15x_r37h4 · vis15x_r37k3 · rollback r37k2 · re-apply r37h3 · rollback r37h3 · uipolish15x_r37z · vis15x_r37h3 · vis15x_r37k2 · vis15x_r37h2 · questart15x_r37x · petapins15x_r37y · …

## Findings covered
All 119 (5 blockers, 52 major, 51 minor, 11 polish). The traceability matrix is `MASTER_REMEDIATION_TRACKER_U37H.md`. The audit JSON, backlog and tracker contain the same 119 IDs; none is missing.

## Root causes confirmed
- 23 groups: G01–G23. G23 is new (region plan data: empty road loops and plots, U2-017). A DEC set holds the findings that need a user decision.
- G00 dissolved:
  - 4 CONFIRMED: U2-009 (season chip), U2-031 (sticker decision), U2-046, U2-050;
  - 4 PROBABLE: U2-004, U2-034 → G17; U2-018 → G16; U2-017 → G23;
  - 2 UNVERIFIED: U2-024, U2-041 → G12 with a runtime check named.
- Confidence by group (ROOT_CAUSE_EVIDENCE_U37H.md):

| Confidence | Groups |
|---|---|
| CONFIRMED | G02, G03, G06, G08, G18, G22 |
| CONFIRMED in part | G01 (mail + card order; the card not being drawn is still PROBABLE), G04 (code confirmed; "this is the band" PROBABLE) |
| PROBABLE | G05, G07, G09–G17, G19, G20, G23 |
| UNVERIFIED | G21 |

- Status today:

| Status | Findings |
|---|---|
| DIAGNOSED | 38 |
| OPEN | 75 |
| OPEN, waiting for a user decision | 6 |

- Nothing is above DIAGNOSED.

## Document reconciliation (disagreements and resolution)
| # | Disagreement | Evidence | Resolution |
|---|---|---|---|
| R1 | Directive v2 §2 lists `docs/qa/rca_u1.json` and `rca_u2.json` | The files are in `docs/remediation/` | Path error in the directive. The files are unchanged. |
| R2 | Directive v2 work HEAD `9529e1df` | Actual HEAD `fbefc87a` | Only document commits came after it |
| R3 | Directive v2 "2,277 test attributes, ≈2,202 passed" | The latest real runs are r37i 2207/0 and r37j 2212/0 (inconclusive 4) | Historical numbers are not current. Batch 0.5 starts with a fresh full EditMode run. |
| R4 | Directive v1 "28-page audit" | The PDF has 128 pages | Documentation error. The content is the same. |
| R5 | U2-001 cause: three candidates (architecture) vs one (RCA U2) | Evidence agent: glow discs ruled out (`villageGlows=0`); r37k3 ruled out (`-x15parity` appears 0 times in the uidev logs) | Rank 1 is the Map Grid Tender outline, rank 2 the 209 unlit house cubes. Still PROBABLE until the layer-toggle capture. |
| R6 | U2-009 RCA proposed tying the weather icon to time of day | The chip is a season countdown (`HubHUD.WorldAlive.cs:33`) | The time-controller fix is dropped. It becomes a label fix (G06). |
| R7 | Discovery: `Profile.hq`/`HqTile` = H3 hex id | In 15× it is a Region15xGrid cell id, from one writer (`BuildHq`) | Discovery table corrected (ARCHITECTURE_INTEGRITY §1) |
| R8 | Discovery: RegionUi15x is a second region store | It is derived from Core `RegionState` through an adapter | Not a second store unless the glue is off |
| R9 | Several groups change the same code | Nine conflicts C1–C9 (ROOT_CAUSE_EVIDENCE Part B), e.g. three different "active tender" definitions (G01/G04/G19), and the card grid wanted by G01/G12/G13 | One owner per conflict. One shared predicate `TenderActive` serves G01, G04 and G19. |
| R10 | audit165 / x37* evidence was used as PASS input earlier | VERIFICATION_INTEGRITY: no pre-shot preconditions; the 165 column was a pre-15× proxy | Declared UNTRUSTED as PASS evidence (see below) |

## Files inspected
The main ones: Region15xPlay.cs, HubHUD.Onboarding.cs, HubHUD.Missions.cs, HubHUD.Projects.cs, Kit.Layout.cs, DialogControls.cs, HubHUD.Slots.cs, HubHUD.SoftRegions.cs, RegionMapBuilder.cs, NaturePilot.cs, NightGrade, RegionCameraClamp.cs, Region15xBoot.cs, SingleHq15x.cs, HqSite, Fmt.cs, HubHUD.WinterNightShot.cs, HubHUD.WorldAlive.cs, HubHUD.Popups.cs, HubHUD.Tester.cs, DecorPlace.cs, Kit.cs, Profile.cs, Company.Save.cs, World15xSave.cs, SaveCodec/SaveMigration/SaveSanitizer, Profile15x/VisualParity15x/World15x and the switch classes, tools/qa/regress_lock.py, runner rollback.py/run_job.sh. Full file:line references are in the four Phase 1 documents.

## Files modified
Documents only, in `docs/remediation/`:
- ARCHITECTURE_INTEGRITY_U37H.md
- ROOT_CAUSE_EVIDENCE_U37H.md
- VERIFICATION_INTEGRITY_U37H.md
- MASTER_REMEDIATION_TRACKER_U37H.md
- USER_DECISION_REGISTER_U37H.md
- PHASE1_REPORT_U37H.md
- backlog.json

## Tests executed
None in this phase, because it is read-only. The latest real EditMode results come from the installing rounds: r37i 2207/0 and r37j 2212/0.

## Test results
Not re-established here. Batch 0.5 begins with a fresh full EditMode run as the new baseline (R3).

## Visual evidence
G22 assessment (VERIFICATION_INTEGRITY_U37H.md): no capture or measurement tool checks its preconditions before shooting. Proven false-PASS and wrong-state cases:

| Problem | Evidence |
|---|---|
| Winter verdict wrong | `EndsWith("FAIL")` reports "fails=1" while 9 lines say FAIL (`HubHUD.WinterNightShot.cs:112/144/154`) |
| "No data" lock passes | `regress_lock.py:203-207` |
| Rollback ignores capture jobs | `rollback.py:418-436` never judges x15shot/winter/uidev/perfshot |
| Shop shots identical | shop_0 = shop_1, byte-identical |
| MID and FAR identical | Both clamped to the same size (`RegionCameraClamp.cs:22/33`) |
| Houses/trees counted as 0 | `Region15xBoot.cs:48-49` |
| "Night" shots look like day | Includes the office shot |
| T5 shot shows T1 | The HUD shows T1 |
| Tender board check reads data | It reads data, not the drawn cards |
| Employees not deterministic | Seeded from `Environment.TickCount` |
| Profiles not equivalent | small16x9 has no intro |

**Consequence:** automated 15× captures from u37h, x37*, perfshot 15× and the audit165 PASS cells count only as evidence that a defect exists, never as PASS evidence. Earlier visual verdicts that the user made personally (e.g. r37w VISUAL PASS) are human judgements and stay as they are. Any VERIFIED status from now on needs Batch 0.5 captures.

## Save/load impact
None this phase. For Batch 1 (ARCHITECTURE_INTEGRITY §5):

| Blocker | Persisted data |
|---|---|
| U1-002 | Touches persisted mail and tenders without a schema change (`X15DoneSteps` is not saved) |
| U1-001 | Must keep writing the same Region15xGrid cell id to `Profile.hq` and `HqTile` |
| U1-035 | No saved data (`DialogLog` is never saved) |

## Feature-flag impact
None changed. Switch inventory: ARCHITECTURE_INTEGRITY §2.
- **HQ in the player build:** `SingleHq15x.On` is ON for players, so the baked plan HQ is hidden while the campus stays at its old cell position. That explains the empty plaza seen in player captures. It is not caused by the pilot patches; the pilot fix (r37d/h2/h4) is OFF.
- **r37h4, switch OFF (statically verified):** no new line runs. `LandmarkOn` has no command-line or profile override, so it can only be tested in EditMode.
- **r37k3, switch OFF (statically verified):** equal to U37H except:
  - `-x15parity all` now also turns on Landscape;
  - `LodFarCapture` runs in pilot regions (a no-op without its argument);
  - one extra opt-in profile entry.

  A runtime OFF-equivalence check is still required (ARCHITECTURE_INTEGRITY §3.4/3.5 lists what to compare).

## Regression status
No change, so no regression. Protected work: r37k3 and r37h4 (installed, tests 2207/0 and 2212/0). No Batch 1 change may touch these:

| Protected item | Shared with | Rule |
|---|---|---|
| `RegionMapBuilder.Skirt` signature, `HazeColor`, `ApronColor` | r37c/r37k3 bake the haze colour into the apron and landscape meshes | The night fix changes only the haze material |
| `HubHUD.Onboarding.BuildHq` and `RestoreHq` | r37d/r37h2 | Leave them alone |

The full overlap matrix is in ARCHITECTURE_INTEGRITY §3.

## Remaining risks
1. PROBABLE root causes for U1-002 (card not drawn) and U2-001 (which layer makes the band) still need runtime diagnostics.
2. Capture tooling is untrusted until Batch 0.5.
3. 593 mutable statics and 159 HubHUD partials: no consolidation is proposed; adapters only where a blocker requires it.
4. The OFF-equivalence of r37k3 is unproven at runtime.
5. Physical Android validation is not available yet (Batch 7; needs an APK and a phone or Firebase Test Lab).

## Blocked decisions
D1–D5 in USER_DECISION_REGISTER_U37H.md: HQ pick form, institution names, the "$" tester symbol, Theme E contrast tokens, panel stickers. Only those specific findings wait; everything else proceeds.

## Next phase (proposal; needs user approval)
**Batch 0.5: Verification Integrity.** Auditor-owned tooling, no gameplay code.
- Per-shot precondition record `shots.jsonl` (scene, save, region, zoom, time, weather, camera target, progression, selected object, seed) plus a structured verdict. A failed precondition means capture FAIL, and such a capture can never be used as evidence.
- Fixes F1–F18 (VERIFICATION_INTEGRITY §plan), e.g.:
  - the winter verdict parser;
  - regress_lock "no data" becomes FAIL;
  - rollback judges capture jobs;
  - MID/FAR distinct sizes for captures only, with the product clamp unchanged (C5 owner G16);
  - 15× house and tree counters;
  - office-night routing;
  - T5 save state;
  - deterministic employee seed;
  - equal flows on both profiles.
- Negative tests N1–N14: each tool must detect a deliberately wrong state.
- Diagnostic-only captures (no game change):
  - the TENDERDIAG per-card log at screens 19 and 21;
  - a layer-toggle capture of screen 96 (`_gridHex` off; house cubes off);
  - night corner pixel vs `NightGrade.Background` with the haze off;
  - `Plaza != null` and camera logs for the plaza and decor shots;
  - the r37k3/r37h4 OFF-equivalence runtime comparison against U37H;
  - a fresh full EditMode baseline.
- Exit gate: every tool passes its negative test, every PROBABLE blocker cause is CONFIRMED or corrected, and the OFF-equivalence is proven.

**Then Batch 1** (plan in REMEDIATION_DEPENDENCY_MAP §4, updated by this report):
- one patch per blocker, own switch, manifest LENGKAP;
- one shared `TenderActive` predicate for G01, G04 and G19;
- the U2-002 change limited to the haze material;
- U1-001 limited to `Region15xPlay.Zones` and `ShowHqPick` (not `BuildHq`/`RestoreHq`).

Diagnostic logging for Batch 0.5 is added behind a capture-only flag, so it does not change gameplay. Even so, it counts as a code change and needs your approval.
