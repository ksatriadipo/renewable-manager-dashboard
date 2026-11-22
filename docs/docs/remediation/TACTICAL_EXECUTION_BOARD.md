# Renewable Manager — Tactical Execution Board (Batch 2 → RC decision)

- **Status:** LIVING. Created 20 Nov 2026 after the owner's PRIORITY RESET (game development = critical path; recovery = supporting track, P2).
- **Measure of progress:** game features that pass acceptance and are playable. Not backups, not documents.
- **Allocation target:** game 85 % · recovery 10 % · contingency 5 %.
- **Modes kept:** Controlled Engineering Mode; master U37H `dda07ec` immutable; disk preflight before heavy Unity jobs; runner changes only by the Auditor with authorization; no APK, device QA, cleanup or capture rounds without their gate.
- **Sources:**
  - [ENGINEERING_STATUS.md](ENGINEERING_STATUS.md)
  - [MASTER_REMEDIATION_TRACKER_U37H.md](MASTER_REMEDIATION_TRACKER_U37H.md)
  - [REMEDIATION_DEPENDENCY_MAP.md](REMEDIATION_DEPENDENCY_MAP.md)
  - [batch02/G07A_G08_SPECIFICATION.md](batch02/G07A_G08_SPECIFICATION.md)
  - the r501 RCA (19 Nov) and the data-driven estimate (19 Nov, 191 agent logs).

Owner key:
- **ORK** = orchestrator (Claude, VPS);
- **AGN** = fresh rm-worker agent (max 4 in parallel, one patch each);
- **AUD** = Auditor;
- **OWN** = project owner;
- **RUN** = Unity runner (single, serial).

Day = working day. H1 = Fri 20 Nov 2026. Target dates assume Mon–Fri.

## Milestones

| Milestone | Content | Target P50 | Target P80 | Exit criterion |
|---|---|---|---|---|
| M1 | G07a/G08 closed | H2 (23 Nov) | H3 | Finance view + formatter implemented, EditMode PASS, Auditor review PASS |
| M2 | G10 closed | H3 (24 Nov) | H4 | Survey score → stars from the finance/plan layer; tests PASS |
| M3 | G09/G11 closed | H4 (25 Nov) | H5 | One state source for guidance/toasts and candidate counts; tests PASS |
| M4 | Batch 2 complete | H4–H5 | H6 | All Batch 2 rows TESTED (VPS), one integrated capture round reviewed |
| M5 | Batch 3 complete | H7–H8 (30 Nov–1 Dec) | H10 | 10 Batch 3 tasks TESTED (VPS), owner visual acceptance |
| M6 | Integrated game validation | H8–H9 | H11–H12 | Player build + uidev A57/960×540 + regression; device run if APK authorized |
| M7 | Release Candidate decision | H9–H10 | H12+ | Owner decision on RC from M6 evidence |

## Board — Batch 2

| ID | Task | Depends on | Owner | Est. P50 / P80 | Status | Blocker | Acceptance criteria | Target |
|---|---|---|---|---|---|---|---|---|
| B2-01 | **G07a core:** `ProjectFinanceView` (Core, read-only) + T1–T17 EditMode tests; plan basis `p.Supply` (P-02), `CashNeededNow` per funding option (O-3), `SpentOwnCash = SpentUsd` without ratio | spec §5/§9 + r501 RCA | ORK / AGN | 0.5 / 1 d | **IN PROGRESS** (agent, 20 Nov) | — | T1–T17 PASS; no economy formula, save schema or tuning change; legacy paths untouched | H1–H2 |
| B2-02 | **G07a decisions** D-1 (no ratio at all stages), D-2 (`pj.spent` label), D-3 ("Total biaya" label vs formula), P-03 ("earned so far"), D-4 (partner-share note on plant card, see note 1) | r501 RCA | OWN | minutes–hours | **DONE 20 Nov** (E-26…E-30) | — | Recorded in USER_DECISION_REGISTER | H1 |
| B2-03 | **G07a screen wiring:** screens 28, go/no-go, 31, 34, 37 read only the view; labels per B2-02 | B2-01, B2-02 | AGN | 0.5 / 1 d | **IMPLEMENTED** r503 (reviewed; compile TOTAL 0) | — | No finance arithmetic left in HubHUD; T16/T17 PASS; uidev 28/31/34/37 identical numbers for one project | H2 |
| B2-04 | **G08 formatter:** `Money()` → thin wrapper on `Fmt.Num(0)`, `Short()`/`EquityOfferHook.Short` → `Fmt.CoinsShort`; D3 switch unchanged | B2-01 (same files) | AGN | 0.3 / 0.6 d | **IMPLEMENTED** r502 (compile TOTAL 0, apply OK; EditMode pending runner round) | — | Thousands separator follows `Loc.Culture` (ja/zh/ru/pt/ar tests); EN/ID output unchanged; "$" only in tester build | H2 |
| B2-05 | **Auditor review G07a/G08** (spec + patch manifests) | B2-03, B2-04 | AUD | 0.2 d | WAITING | — | Review PASS, no FAIL→PASS reclassification | H2 |
| B2-06 | **Runner commit-scope fix A-05** (`lib.sh:69` stages only patch files + paired `.meta`) | — | AUD | 0.2 / 0.5 d | **IMPLEMENTED** (offline 39/0; Auditor review in progress) | — | Next round commit = exactly the manifest files | before first B2 patch round |
| B2-07 | **G07b–g RCA** (region-name source, map location card, Shop production label, feasibility design field, regulation event, team event card) | — (read-only) | AGN ×2 | 0.3 d | **IN PROGRESS** (2 agents, 20 Nov) | — | Each row DIAGNOSED with file:function and smallest change | H1–H2 |
| B2-08 | **G07b–g fixes** (6 small patches on the B2-01 layer) | B2-01, B2-07 | AGN | 0.5 / 1 d | WAITING | — | Per-row test + manifest; tracker rows TESTED (VPS) | H3 |
| B2-09 | **G10** survey score → stars (U1-040/041/042) | B2-01 | ORK / AGN | 0.5 / 0.8 d | **RCA IN PROGRESS** (agent, 20 Nov); implementation after B2-01 | — | Mapping from one source; feasibility/survey/map show the same stars; EditMode PASS | H3 |
| B2-10 | **G09** stale guidance/toasts (U1-012/014/029/030/051, B05-P2 "Naik level" before "Misi selesai") | G01 state (done in B1) | AGN | 0.5 / 1 d | **IMPLEMENTED** part 1 r506 (popup order + claim toast; reviewed; compile TOTAL 0 on full stack); g09c–e queued | — | Messages derived from current state; queue order fixed; capture 16_mission1_done before/after | H4 |
| B2-11 | **G11** candidate count (U1-026/028) | B2-01 (read layer) | AGN | 0.3 / 0.5 d | **IMPLEMENTED** r505 (compile TOTAL 0, 7/7 offline; reviewed; interview switch OFF pending owner) | — | Board and interview show the same count from one filter; tests PASS | H4 |
| B2-12 | **G01 close-out** (U1-003/004 documentary) | b1r4 evidence | ORK | 0.1 d | **DONE 20 Nov** (TESTED VPS, tracker row added) | — | Tracker rows updated with evidence path | H1 |
| B2-13 | **Batch 2 integrated round:** EditMode + one build/uidev (A57 + 960×540) | all above, disk preflight | RUN / ORK | 0.3 / 0.6 d | WAITING | heavy-job gate | Regression 0 failures; finance screens consistent in capture; owner review | H4–H5 |

## Board — Batch 3 (10 tasks)

| ID | Task | Depends on | Owner | Est. P50 / P80 | Status | Blocker | Acceptance criteria |
|---|---|---|---|---|---|---|---|
| B3-01 | G17a office/floor navigation in 15× (U2-007/008) | product decision + camera diagnosis (B05-P1) | OWN → AGN | 0.8 / 1.5 d | **BLOCKED** | owner decision on what "office" means now that the HQ is on the plaza; camera clamp change is a product change | Office reachable in player build; floors navigable; no camera regression |
| B3-02 | G17b plaza at night (U2-004) | B3-01 camera, G05 (B1) | AGN | 0.3 / 0.6 d | WAITING | — | Plaza night capture within night criteria |
| B3-03 | G17c decor placement (U2-034) | B3-01 | AGN | 0.4 / 0.8 d | WAITING | — | Placement works in 15×; no overlap |
| B3-04 | G18a plant → substation cable (U2-010) | — | AGN | 0.4 / 0.7 d | CAN START after M4 | — | Cable only plant → gardu, ends at legal node |
| B3-05 | G18b substation lights at night (B1 residual) | B3-04 | AGN | 0.2 / 0.4 d | WAITING | — | Real light sources at CLOSE only, per night-per-zoom rule |
| B3-06 | G19 map: locked regions + tender fog (U1-045) | — | AGN | 0.4 / 0.8 d | CAN START after M4 | — | Locked = dimmed + lock pin (18 Nov rule), no clouds; tender highlight |
| B3-07 | G16a Home/photo camera framing (U1-013/057/061) | B3-01 diagnosis | AGN | 0.4 / 0.8 d | WAITING | camera diagnosis | Frames HQ/plants at A57 + 960×540 |
| B3-08 | G16b world edge/void + diorama camera (U1-020/036) | B3-07 | AGN | 0.4 / 0.8 d | WAITING | — | No void visible in any capture step |
| B3-09 | G16c initial camera per aspect ratio (U2-018) | B3-07 | AGN | 0.2 / 0.4 d | WAITING | — | Same framing across profiles |
| B3-10 | G22 uidev step hq_gate (U2-023) | — | AGN (QA tool, AUD review) | 0.2 / 0.3 d | CAN START after M4 | — | Capture step reaches its state; precondition checks unchanged |

**Batch 3 backlog (not on the 10-task board, not in M5):** G23 region layout data (map geometry; register B3-G23) — placed here 22 Nov by Director D-6e1ca40a6f20 (Codex SG-983acab9415b); owner Lead (orchestrator); dependencies recorded when it is broken into tasks; re-placed if B4–B8 scope is set. Closes DEP-G23.

## Validation (M6–M7)

| ID | Task | Owner | Gate | Status |
|---|---|---|---|---|
| V-01 | Player build + uidev A57/960×540 + PerfShot, full regression | RUN / ORK | disk preflight (≥ 15 GB free) | WAITING M5 |
| V-02 | Visual review vs benchmark 165 (side-by-side sheet) | OWN | — | WAITING V-01 |
| V-03 | Device testing (A57 + lower-spec) | OWN / ORK | **APK requires owner request**; Firebase Test Lab approved (free quota) once an APK is requested | BLOCKED until APK authorized |
| V-04 | Release blocker fixes | AGN | per finding | WAITING |
| V-05 | RC decision | OWN | — | WAITING |

## Supporting track (not on the critical path)

| Item | Priority | Status |
|---|---|---|
| Drive: 24 documentation items | P2 | not authorized; no uploads during engineering hours |
| Stage 6 / Stage 7 | P2 | not before the agreed game milestone |
| LFS 2,380 OIDs | supporting | UNVERIFIED; no action |
| Cleanup / housekeeping | FREEZE | — |
| A-16 build retention | risk for Batch 3 (disk) | design approved; deletion needs owner approval |

## Notes
1. **D-4 (new, from the r501 verification, 20 Nov).** `X15OfferEquity` does not change `EquityNeeded` or `SpentUsd`: the partner's 25 % arrives as company cash, and profit is reduced by `X15OwnerProfit` during the term. A plan-basis Net on the plant card therefore overstates the player's share for a partnered project. The smallest option is a neutral "mitra 25 %" note on that card, with no formula change.
2. **Grid projects without `Supply`.** These exist only on legacy paths (Prototype scene, old `BotPlayer`, `QaAddPlantCore`). Every 15× player project gets `Supply` (`Company.Campaign.cs:639`, reloaded at `Company.Save.cs:582`). The view keeps a fallback (`p.RevenuePerYear`/`p.OpexPerYear`, penalty 0) for those paths only.
3. **Capacity facts behind the estimates.**
   - Single serial Unity runner: tests 5–7 min; build + uidev 31–41 min.
   - Up to 4 agents (median 7 min, P80 10 min per patch).
   - Rework ≈ 18 %; first pass per blocker in Batch 1 was 20 %.
   - Verification time ≈ 3× agent time.
   - Disk 21 GB free (runner warns < 15 GB, stops < 8 GB). Roughly 8 build rounds fit without retention, which is enough for Batch 2 but tight for Batch 3 + validation.

## Log
- 20 Nov: B2-01 patch `b2_g07a_core_r501` ready (offline compile TOTAL 0, 12/13 tests offline, T9 runner-only). RCAs G07b–d, G07e–g, G09, G10, G11 done (scratch `wip_b2_rca_*`). Owner decisions E-26…E-31. B2-03, B2-04, A-05 and G10 implementation started.
- 20 Nov: owner decisions E-32 (D-5 absolute stars = map legend, own toggle, boundary tests), E-33 (geothermal row stays visible), E-34 (Stage 6–7 deferred off the runner path). Patches integrate only after individual review + acceptance.
- 20 Nov **operational warning:** one B2-01 agent ran `rm -rf`/`rm -f` inside its own scratch folder on paths that did not exist yet; nothing was deleted (live tree verified clean). Agent briefs now forbid rm/rmdir/find -delete everywhere; cleanup still needs explicit owner approval.
- 20 Nov: r502 (G08) reviewed by orchestrator: scope 4 files + tests, switch `Fmt.UnifiedNumbers`, EN/ID Money/Short byte-identical (42-value table). Accepted EN change on 15× cards ("3,4 jt" → "3.4 M") as a localization fix inside G08. Waiting: EditMode round. G11 r505 started.
- 20 Nov: A-05 patch `a05_runner_scope.patch` (lib.sh + run_job.sh) offline 39 PASS / 0 FAIL: r407/r410/r500 replays commit 4/7/3 files instead of 8/12/7; leftovers logged; rollback/reapply same tree; DRY no commit. Not applied; independent Auditor review started. Disk 15 GB free (runner warning threshold).
- 20 Nov: G10 r504 delivered (compile TOTAL 0, 10/11 offline; sun stars per D-5 OK). **Rejected in review:** with WiringOn the slope/safety/access/reliability rows used NEW bands (violates E-32 "no new thresholds"). Revision r504b started: those rows keep the legacy formulas byte-identical; only the sun rating changes. Open owner question: survey vs feasibility card use two different legacy safety formulas (kept as-is).
- 20 Nov: owner E-35. r505 (G11) reviewed: new Core CandidateView (no save fields), Recruit/Tim badges via one source, switch Counts ON, InterviewVisible OFF (owner decision pending). Queued for the round after b2r2. G09 part 1 (r506: popup order + claim toast) started.
- 20 Nov: **A-05 Auditor verdict FAIL** (R1 commits outside RenewableCEO/ArtSource; R2 quoted renames; R3 new Unity .meta never committed; R4/R5 silent no-commit on pre-staged index / leaked COMMIT_DRY). Revision A-05b started; not installed. r503 reviewed (labels per E-26…E-30, switch FinanceScreensG07a.On). r504b reviewed (non-sun rows legacy, byte-identical) and rebased by orchestrator to r504c (1 context line after r503). Full stack r501+r502+r503+r505+r504c: apply OK, reverse OK, offline compile TOTAL 0. b2r2 queue = these 5, waiting for A-05 PASS. G07b+c (r507) started.
- 20 Nov: r506 (G09a+b) accepted into b2r2 (applies on full stack; TOTAL 0). **Operational warning #2:** the G09 agent attempted `rmdir` on empty folders in its own scratch; the call was blocked, nothing deleted. G07e+f+g (r508) and G07d (r509) started.
- 20 Nov: owner E-36 (P-03 = MWh), E-37 (D-5 scope: quest performance cards keep their semantics), E-38 (b2r2 = r501, r502, r503, r505, r504c). r506 moved to the next round. Follow-ups r510 (plant card MWh) and r511 (quest performance cards back to legacy semantics) for the next round. A-05b delivered (orig 39/0, adversarial 25/0); independent Auditor re-review started.
- 20 Nov: **A-05b** Auditor PASS_WITH_CONDITIONS (R1–R5 fixed; C2 junk `.meta.meta` adoption and C3 STAGE_FAIL logging = follow-ups, 0 such files live). Installed in /srv/rm/repo_tools (bytes = reviewed copy; backup `scratch/wip_a05b/install_backup_20261120`).
- 20 Nov: **b2r2** (r501, r502, r503, r505, r504c). Four manifests were first rejected by the runner format check (labels must be single-line `Label:`); the orchestrator added a label block from the existing text (originals in `scratch/manifest_backup_b2r2`), the runner retried them in the same round. EditMode **2504/0/0/4**, judge regression 0, rollback 0, T9 PASS. Commits contain exactly the patch files. Captures and Auditor review B2-05 still open.
- 20 Nov: **HALT** (owner): all work and agents stopped after b2r2. Ready but NOT queued: r506 (G09a+b), r507 (G07b+c), r508 (G07e+f+g), r509 (G07d; 2 loc keys missing), r510 (P-03 MWh), r511 (D-5 quest cards). Manifests of r506–r511 pre-validated except r509.

- 21 Nov: **Owner lifted HALT** ("lanjutkan pekerjaan yang sebelumnya"). Disk now 141 GB free (volume enlarged to 251 GB; heavy-job gate no longer the constraint). r509 manifest got the runner label block; loc keys `shop.prod.days`/`shop.prod.maxdays` added as separate patch r512 (data only). Round **b2r3** started (patch,tests): r506, r507, r508, r509, r512, r510, r511 (stack applies cleanly, all 7 manifests LENGKAP). Agents: G09e r513, G09d r514, Auditor B2-05 review.
- 21 Nov: **B2-05 Auditor verdict** (`batch02/B2_05_AUDITOR_REVIEW.md`): r501 PASS; r502, r505 PASS_WITH_CONDITIONS; r503 FAIL (E-36 Koin under energy label) and r504c FAIL (E-37 quest card stars) as landed in b2r2. Both FAILs are the known follow-ups r510/r511 (in b2r3), which need their own Auditor review + captures. Conditions C-1…C-10 open (r502 EN "3.4 M" change to be recorded as a spec deviation, remaining HubHUD arithmetic, fin.* keys EN/ID only, OFF-path test for r503, FinanceOf per-frame cost, U1-028 stays PENDING). Captures NOT_TESTED; VERIFIED 0.
- 21 Nov: G09e r513 delivered (switch QuestToastG09.G09OneText ON; compile TOTAL 0; 5 EditMode tests need Unity) — reviewed by orchestrator, queued for b2r4; recapture 07_tender_locked + 21_hire_board. G09c r515 started on stack + r513.
- 21 Nov: **b2r3 PASS** — r506, r507, r508, r509, r512, r510, r511 all applied (game c0d1000), EditMode **2545/0/0/4**, rollback 0. G09d r514 (6/6 offline) + G09c r515 (9/9 offline) delivered and reviewed; stack r513→r515→r514 applies on c0d1000, manifests LENGKAP. Round **b2r4** (patch,tests) → **b2r4u** (B2-13 integrated build + uidev A57/960×540 + perfshot) started. Agent note: `/srv/rm/scratch` sits inside the game repo, so a plain `git apply` there can silently skip; stack checks now use a detached worktree or `GIT_CEILING_DIRECTORIES`.
- 21 Nov: RM Control Tower (owner directive, separate from the game repo): backend + web client in /srv/rmct (14/14 tests), systemd server + 15-min ingest + daily backup, Caddy installed; waiting for owner subdomain + GitHub deploy key.
- 21 Nov **HANDOVER → rm-vps** (owner: "pindahkan aja"). Chain `scratch/chain_b2r4.sh` (b2r4 tests → b2r4u build+uidev+perfshot) was started by the interim session (account hasyim, outside tmux) and keeps running there: **do not start any Unity job until `scratch/b2r4u_nohup.log` ends with CHAIN_DONE** (or b2r4_nohup.log shows CHAIN_STOP). Then: review b2r4 EditMode + b2r4u captures (07, 11, 12, 13, 16, 21, 44, 64_shop_3 at A57 + 960×540), Auditor review of r506–r515, B2-13 closure. Control Tower: /srv/rmct committed locally (not pushed); systemd rmct.service + timers active; waiting for owner (a) GitHub deploy key (public key in /srv/rmct-private/secrets/github_deploy_ed25519.pub, remote set to SSH) and (b) subdomain → Caddy site from deploy/Caddyfile.example, set cookie_secure true, then send owner a one-time setup link (`python3 -m rmct setup-token`) and test login/edit from phone.
- 21 Nov (rm-vps): resumed from handover; chain b2r4→b2r4u left running (no Unity job started). **Auditor r507–r512** (`batch02/AUDIT_R507_R512.md`): r512 PASS; r507, r508, r509, r510, r511 PASS_WITH_CONDITIONS; no FAIL. Required before ☑: C511-1 regression test for E-37. Call-site test gap (C507-3, C508-3, C509-2), RU for fin.* keys (C510-3), captures CX-2. C510-2 resolved by code fact: plants without Supply exist only on legacy paths (board note 2), fallback stays. Owner copy questions: C507-2 (every HQ village reads "Goldmeadow Flats"), C508-2 (regulation popup when 0 plants operate). Follow-ups r516 (tests) + r517 (RU fin.* rows) started.
- 21 Nov: **b2r4** r513, r515, r514 installed, EditMode **2565/0/0/4**, rollback 0. **Auditor G09** (`batch02/AUDIT_G09_R506_R513_R515.md`): r506, r513, r514, r515 PASS_WITH_CONDITIONS, no code defect; C-G09-01 tests cover helpers only, so the lock comes from b2r4u captures 07/11/12/13/16/21/44 (C-G09-02). U1-012/U1-029 remaining parts stay OPEN. Status TESTED.
- 21 Nov (semi-aggressive mode): b2r4u build + perfshot done; perfshot = known structural FAIL (5 precondition kantor_dalam, perf gate) + 1 new FAIL `Tinggi_proyek` caused by the sim day advancing between same-frame shots ("Ditutup 12 hari lagi" vs "11") = QA-tool finding (G22), not a product regression; verdict unchanged. b2r5 (r516 + r517) queued to start after b2r4u. **B3-01 decision E-39 = option C hybrid**; B3-01a (clamp exception + tap HQ → interior) started. Independent Batch 3 started: B3-04 cable (r520), B3-06 map (r521), B3-10 hq_gate QA step (r522).

- 21 Nov: **b2r5** r516+r517 EditMode 2570/1 (r516 test referenced SOFT_LAUNCH_WIP-only PlantPerfTab; runner rolled back r517 = wrong patch) → **r518** test guard → **b2r5b 2570/0/0/4** (`de139b0`). **Batch 2 CLOSED at TESTED (VPS)** (`batch02/BATCH02_CLOSURE_REPORT.md`). **b3r1** r520–r523 EditMode **2594/0/0/4** (`11d2d0e`); **b3r1u** uidev A57 18/8 (from 21/9), perfshot 50/50 (kantor_dalam precondition cleared). Visual audit `batch03/B3R1U_CAPTURE_AUDIT.md`: r523 office 50–54 PASS, 53 night + 44 NEEDS RECHECK; r520 NEEDS RECHECK (close-up); r521 baseline PASS, highlight NOT_TESTED; **r522 FALSE PASS → NEEDS_REWORK (P0)**. B3R2 directive: r524 (hq gate fix + negative tests) and r525 (evidence captures r520/r521/r523 + OFF) in progress.
