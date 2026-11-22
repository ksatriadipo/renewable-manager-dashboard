# DEC-STOR decision brief: storage release (22 Nov 2026)

Status: **PROPOSED**. Records only. **Cleanup is FROZEN** (owner priority reset, 20 Nov 2026: "cleanup = FREEZE"). Nothing was deleted, moved or compressed while preparing this brief. All sizes below were measured read-only (`du -sh`, `df -h /`) on 22 Nov 2026.

Register row: `DEC-STOR` in `docs/remediation/TASK_REGISTER.md` (Blockers and risks). Earlier analysis: `docs/recovery/STAGE6_7_STORAGE_RELEASE_REPORT.md` §2–§3 (19–20 Nov).

## 1. Why the decision is no longer urgent

- FACT: `df -h /` on 22 Nov: size 251 GB, used 140 GB, **112 GB free**. The volume was enlarged to 251 GB on 21 Nov (register row REC-STOR).
- FACT: the heavy-build gate (no heavy build below 20 GB free, owner decision E-38, 20 Nov) still applies as a rule. It is met today without releasing anything.
- INFERENCE (HIGH): DEC-STOR no longer blocks B2-13 or V-01. It is a housekeeping decision about growth, not a critical-path item.

## 2. Candidates and measured reclaimable space

| ID | Path | Measured 22 Nov | 19–20 Nov estimate | Prerequisite before any release (owner rules 19–20 Nov) |
|---|---|---|---|---|
| S1 | `/srv/rm/scratch/wip_a05_runner/test` (run_1…run_6) | 2.0 GB | ≈ 2.0 GB | Auditor confirms the A-05 evidence is kept elsewhere (E-35) |
| S2 | `/srv/rm_restore_test/20261120` | 3.5 GB | 3.5 GB | Stage 7 report + evidence reconciled by the owner (REC-S7 still IMPLEMENTED, not reconciled) |
| S3 | 11 old builds in `/srv/rm_recovery/20261119/storage_release/A1_builds_reproducible.paths` (`audit169{b1r2u,b1r1u,b05r5u,b05r4u,b05r2u,b05c,u37w,b35k,r19b,r18,r17}`) | 11 GB | 10.8 GB | HOLD (E-35). Owner confirmation under retention policy B; binaries are not on Drive, so a rebuild (≈ 35 min each) is the only way to re-inspect them |
| S4 | 1,357 entries in `/srv/rm_recovery/20261119/storage_release/A2_scratch_archived_unchanged.paths` | 6.0 GB | 5.9 GB | HOLD (E-35). Drive packages #20/#21 must be Stage-6 VERIFIED first |
| S5 | `/srv/rm/backup/ArtSource` | 16 GB | 15.2 GB | HOLD (E-35). Stage-6 VERIFIED on all 14 packages (#24–37) **and** a second copy outside the VPS or explicit owner risk acceptance; owner rule 19 Nov: one unprotected asset = cancel |
| S6 | `/root/.npm/_cacache` | 183 MB | 0.34 GB | Auditor confirms the cache is not in active use (E-35) |

Context (not candidates): `/srv/rm/RenewableCEO/Builds` totals 31 GB (29 `audit169*` builds + Android); the whole `/srv/rm/scratch` totals 14 GB. Builds newer than S3 are not covered by any approved retention list.

Sum if every candidate were released: about 38.7 GB (S1 2.0 + S2 3.5 + S3 11 + S4 6.0 + S5 16 + S6 0.2).

## 3. Options

| Option | What happens | Space | Risk |
|---|---|---|---|
| A. Keep frozen (status quo) | Nothing is released; revisit when free space nears the 20 GB gate or a retention policy is needed | 0 | Disk grows by roughly one build (≈ 0.9–1 GB) per uidev round |
| B. Low-risk set when the freeze is lifted | S1 + S6 after the Auditor confirmations, S2 after Stage 7 reconciliation | ≈ 5.7 GB | Low; all three are regenerable or test artefacts |
| C. B + S3 | Adds the 11 old builds under policy B | ≈ 16.7 GB | Binaries are not on Drive; re-inspection needs a rebuild |
| D. Full set | Adds S4 and S5 after their Stage-6 checks and a second copy | ≈ 38.7 GB | Drive would hold the only copy of S4 and of ≈ 4.94 GB unique art in S5 |

PROPOSAL: Option A now (consistent with the freeze and with 112 GB free), and adopt a build retention rule (OPS-RET, A-16) before free space falls toward the gate. Option B is the first step whenever the owner lifts the freeze.

## 4. Verification prerequisites for any future release

1. The owner lifts the cleanup freeze explicitly for the named items.
2. Each item has a deletion manifest: exact path, size, dependency check (runner, Unity, Git, active agent workspaces), and free space before and after (owner rule 19 Nov).
3. No release while Unity or the runner uses the files; never an active agent workspace.
4. Item-specific checks from §2 (Auditor confirmations, Stage 7 reconciliation, Stage-6 VERIFIED packages, second copy for S5).
5. Repository integrity check and evidence afterwards; master U37H `dda07ec` and Git history untouched.
