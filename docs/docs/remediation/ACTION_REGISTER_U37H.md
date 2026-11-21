# Action register — U37H remediation (Batch 2 era)

- **Document status:** LIVING REGISTER.
- **Last updated:** 19 Nov 2026 (update 2: owner decisions on P-01/P-02/O-4; see change log at the end).
- **Rules:**
  - no artificial deadlines;
  - status labels: PENDING, NOT_TESTED, HOLD, APPROVED, CONFIRMED;
  - decisions are in [USER_DECISION_REGISTER_U37H.md](USER_DECISION_REGISTER_U37H.md) (section "Engineering decisions — Batch 2").

| ID | Action | Priority | Dependency | Status | Required approval | Evidence / Output |
|---|---|---|---|---|---|---|
| A-01 | Finish O-1: choose the screen-31 representation consistent with `SpentUsd` (own-cash outlay; option (a) or (b)) and confirm which build path the 15× UI uses (O-1b) | P0 for G07a | — | PENDING (code verification done; owner choice open) | Owner | [batch02/G07A_G08_SPECIFICATION.md](batch02/G07A_G08_SPECIFICATION.md) §3 |
| A-02 | Resolve the OPEX/Penalty representation for operating projects (plan-basis proposal §4.4; plant-card Net Profit definition change; O-5 "earned so far") | P0 for r501 | A-03 Auditor input recommended | PENDING | Owner | spec §4–§5 |
| A-03 | Auditor review of O-4 (maintenance share scales the folded penalty) | P1 | — | PENDING | Auditor; owner for any formula change (not authorized) | [batch02/AUDITOR_FINDING_O4_PENALTY_MAINTENANCE.md](batch02/AUDITOR_FINDING_O4_PENALTY_MAINTENANCE.md) |
| A-04 | Complete G07a/G08 specification refinement and approval, then implement r501 → r502 → r503 | P0 | A-01, A-02 | PENDING (specification only; no code) | Owner (implementation); capture authorization for r503 | spec §10 |
| A-05 | Submit the runner commit-scope specification and isolated test plan for Auditor review; no production change until authorized | P0 (before the next patch round, per owner) | — | PENDING | Auditor + owner | [batch02/RUNNER_INTEGRITY_FINDING.md](batch02/RUNNER_INTEGRITY_FINDING.md) |
| A-06 | G06 visual validation: uidev a57 + small16x9 shots 21, 22, 23, 24, 26, 57, 58 (planned with the r503 capture round) | P1 | capture authorization | NOT_TESTED | Owner (build/capture) | [batch02/G06_COMPLETION.md](batch02/G06_COMPLETION.md) |
| A-07 | G06 device validation | P2 | device / APK path (not requested) | NOT_TESTED | Owner | — |
| A-08 | G06 native-speaker review of ja/zh/ru/pt/ar | P2 | reviewers | PENDING | Owner | `/srv/rm/scratch/wip_b2_g06hex/report.json` |
| A-09 | Obtain the provider response for ticket #1954 (outbound restriction) | P0 for recovery | — | PENDING (external) | — | [../recovery/RECOVERY_EXECUTION_STATUS.md](../recovery/RECOVERY_EXECUTION_STATUS.md) |
| A-10 | Resume backup upload (#20–#37 + 24 docs/bundles) only after A-09 and explicit owner approval (proposed `--bwlimit` 8–10 Mbit/s; check for a partial `scratch_p01.tar` first) | P0 for recovery | A-09 | HOLD | Owner | `/srv/rm_recovery/20261119/upload/CHECKPOINT.md` |
| A-11 | Stage 6 integrity verification and Stage 7 restore test | P0 for recovery | A-10 | PENDING | Owner (each stage separately) | `docs/recovery/RESTORE_TEST_PROCEDURE.md` |
| A-12 | Unresolved LFS: 2,380 OIDs (≈ 2.24 GB) not on the VPS; recover from an authorized source and verify per-OID SHA-256 | P1 | source access (laptop/GitLab) | PENDING | Owner (source access, any fetch) | `/srv/rm_recovery/20261119/RECOVERY_LFS_UNVERIFIED.csv` |
| A-13 | Decide whether `audit169r16`, `audit169b1r3u` and `Android` builds join the backup (single VPS copies; owner priority: Android, b1r3u, r16) | P1 | A-10 | PENDING | Owner (scope change) | [../recovery/STORAGE_AND_RETENTION.md](../recovery/STORAGE_AND_RETENTION.md) |
| A-14 | Owner check: Drive backup folder sharing is Restricted (BK-DRIVE note 15 Nov; not re-checked) | P1 | — | PENDING | Owner | `docs/release/PENDING_DECISIONS.md` (BK-DRIVE) |
| A-15 | OAuth Testing-mode token expires ≈ 26 Nov; re-login via the one-time relay when needed | P2 | — | PENDING | Owner (login) | recovery status |
| A-16 | Apply the build retention policy (marking only; deletion separately) | P1 before Batch 3 | A-11 recommended; runner change via Auditor | HOLD (design approved only) | Owner | storage document |
| A-17 | Remaining Batch 2: G01 close-out (U1-003/004, doc verification), G07b–g, G10, G09, G11 (RCA first) | P1 | A-04 (shared finance/format layer) | PENDING | Owner per milestone | `MASTER_REMEDIATION_TRACKER_U37H.md` |
| A-18 | Technical debt TD-01: `Prototype.unity` stays in Build Settings; legacy "$" paths (`Legacy/GameUI.cs:941`, `Legacy/PrototypeGame.cs:439`) | P3 | dependency check | PENDING | Owner (removal decision) | spec §2 |
| A-19 | Untracked `LocHexTermsG06Tests.cs.meta` will be swept by the next runner commit unless A-05 lands first | P1 | A-05 | PENDING | — | G06 record |
| A-20 | Mis-structured scratch copy `/srv/rm/scratch/wip_b2_g06hex/proj/` (67 MB) kept because deletion is prohibited | P3 | cleanup authorization | HOLD | Owner | — |

## Change log
- **19 Nov 2026, update 2** (owner decisions; rows above are kept as first written and superseded as follows):
  - **A-01:** P-01 APPROVED (E-21). P-01b CONFIRMED (E-22: 15× UI uses `BuildWithFunding`). Remaining sub-item: derive "planned own cash Y" without a save change (spec §12 item 1). Status: PENDING (derivation).
  - **A-02:** P-02 APPROVED conditionally (E-23). Remaining: basis-consistency table across screens 28 / go-no-go / 31 / 34 / 37 / project detail (spec §12 item 2). O-5 (= P-03) still PENDING.
  - **A-03:** O-4 DEFERRED by owner (E-24). No economic change. Separate evaluation later.
  - **A-04:** r501 still waits for A-01 (Y derivation) and A-02 (consistency table). No implementation started.
  - **New A-21:** documentation commit (12 files) to the work repo, branch `remediation/u37h-b2`. APPROVED (E-25). Commit hash is recorded in the commit report.
