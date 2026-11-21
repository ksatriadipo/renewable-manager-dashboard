# Stage 6–7 verification and VPS storage-release register

- **Status:** INTERIM. Stage 6 is PAUSED, deferred by owner decision E-34 (no competition with the Unity runner). Stage 7 targeted restore is COMPLETE. The register below is a proposal: **nothing has been deleted.**
- **Date:** 20 Nov 2026.
- **Sources** (all in `/srv/rm_recovery/20261119/`):
  - `stage6/results.jsonl`, `stage6/pause.log`, `tools/stage6_stream_verify.py`;
  - Stage 7 restore at `/srv/rm_restore_test/20261120/` (`logs/`);
  - path lists in `storage_release/`.

## 1. Stage 6 — download integrity

**Method** (no disk use for archive content):
1. `rclone cat` streams each package from Drive (download bwlimit 10 MiB/s).
2. The whole stream is hashed with SHA-256 and compared with the upload evidence and the Drive-reported SHA-256.
3. At the same time a streaming tar parse hashes every regular file and compares it with the per-file `RECOVERY_SHA256_MANIFEST.csv` (size + SHA-256). Entry and file counts are compared with `ARCHIVE_PLAN.tsv`.

Stage 7 extraction also hashed each full stream, so the 10 packages it restored count as download-verified.

| # | Package | Result | Bytes | Files / plan | File mismatches | Method |
|---|---|---|---|---|---|---|
| 1 | work_git_core | VERIFIED | 151,203,840 | 3,538 / 3,538 | 0 | stream + per-file; Stage 7 extract |
| 2 | work_lfs_0-3 | VERIFIED | 3,399,219,200 | 1,885 / 1,885 | 0 | stream + per-file |
| 3 | work_lfs_4-7 | VERIFIED | 2,530,877,440 | 1,886 / 1,886 | 0 | stream + per-file |
| 4 | work_lfs_8-b | VERIFIED | 2,999,572,480 | 1,935 / 1,935 | 0 | stream + per-file |
| 5 | work_lfs_c-f | VERIFIED | 2,176,256,000 | 1,923 / 1,923 | 0 | stream + per-file |
| 6 | work_worktree_nonreproducible | VERIFIED | 114,247,680 | — | 0 | Stage 7 extract (stream sha = evidence; per-file match) |
| 7 | game_git | VERIFIED | 83,404,800 | — | 0 | Stage 7 extract |
| 8 | game_tools_files | VERIFIED | 405,964,800 | — | 0 | Stage 7 extract |
| 9 | laneb_git | VERIFIED | 17,070,080 | — | 0 | Stage 7 extract |
| 10 | laneb_tools_files | VERIFIED | 273,254,400 | — | 0 | Stage 7 extract |
| 12 | build_identity_text | VERIFIED | 2,795,520 | — | 0 | Stage 7 extract |
| 22 | unity_rm_project | VERIFIED | 1,491,537,920 | — | 0 | Stage 7 extract |
| 27 | artsource_Fonts | VERIFIED | 42,680,320 | 27 / 27 | 0 | stream + per-file; Stage 7 extract |
| 29 | artsource_Marketing | VERIFIED | 23,756,800 | — | 0 | Stage 7 extract |
| 37 | artsource__toplevel | VERIFIED | 20,480 | 1 / 1 | 0 | stream + per-file |

**VERIFIED: 15 / 37 (≈ 13.9 GB). FAILED: 0. NOT_TESTED: 22.** The 22 NOT_TESTED packages:
- #11 work_bare_origin_repo_git;
- #13–15 build_ref_b05fu / b1r4u / u37h;
- #16–18 evidence_rm_docs_p01 / p02, evidence_rmb_docs;
- #19 results_logs;
- #20–21 scratch_p01 / p02;
- #23 unity_rmb_project;
- #24–26 artsource_Audio / Characters_p01 / p02;
- #28 artsource_Inbox;
- #30–36 artsource_Props, QA, Redesign, References, UI, World_p01, World_p02.

Their integrity rests on the Stage 5 upload evidence (local stream SHA-256 = Drive SHA-256) until they are streamed.

**Remaining Stage 6 work:** ≈ 33.5 GB. That is about 55 min at 10 MiB/s, with no disk use. Run it in an idle runner slot (E-34).

## 2. Stage 7 — targeted restore test

- **Restore location:** isolated `/srv/rm_restore_test/20261120/x` (3.5 GB). No active repository, branch or master was touched.

| Check | Result |
|---|---|
| Extract 10 packages | rc 0 for all; full-stream SHA-256 = upload evidence for all 10 |
| Per-file check of restored files | 47,741 match the manifest. 3 mismatches = the three `.git/index` files, **caused by the test itself**: the first `read-tree` ran without a separate index and rewrote the restored copies. Archive index bytes were verified separately in Stage 6 (`work_git_core`, 0 mismatches) |
| `git fsck --full` (work, game, lane B) | 0 errors |
| Refs vs live repos | identical, except `remediation/u37h-b2` (work + game), which was created **after** the 19 Nov snapshot and is therefore not in the backup |
| Checkout master U37H `dda07ec` | tree `4e82ac7ed` = live |
| Checkout game `remediation/u37h-b1` | tree `28df4cf62` = live |
| Checkout lane B HEAD / work HEAD | trees `578da6936` / `6ac12b121` = live; stash restored |
| Unity project assembly | the `unity_rm_project` overlay (Assets 25,156 files, UserSettings, AndroidSrc) restores with matching hashes. `Library/` is not in the backup (regenerable by Unity import) |

**Not in the backup (post-snapshot delta, decision S5-D16 pending):**
- Batch 2 commits (work `4e9a0802`, `63215d0a`; game `a5a9315`);
- 20 Nov documents;
- patches r501/r502 and the new agent work folders.

## 3. Storage-release candidate register (proposal; nothing deleted)

Free space now: **15 GB** (125 GB disk, 111 GB used). Sizes are disk usage (`du`, 1 MiB blocks).

| ID | Exact path | Data / function | Size | Drive package | SHA-256 / manifest | Needed by active work? | Dependencies | Risk if removed | Class |
|---|---|---|---|---|---|---|---|---|---|
| S1 | `/srv/rm/scratch/wip_a05_runner/test/run_1` … `run_6` | Throwaway git repos built by the A-05 test script | ≈ 2.0 GB | none (regenerable by `test_a05_scope.sh`) | n/a | Only as A-05 evidence until the Auditor verdict | none (not used by runner, Unity or Git) | Low; the script recreates them | **A after Auditor confirms evidence is kept elsewhere** (owner rule 5) |
| S2 | `/srv/rm_restore_test/20261120` | Stage 7 restore workspace | 3.5 GB | (restored from #1, 6–10, 12, 22, 27, 29) | verified | Retain until report reconciled (owner rule 6) | none | Loses restore evidence; can be re-run (≈ 6 min) | **B now → A after reconciliation** |
| S3 | the 11 builds listed in `storage_release/A1_builds_reproducible.paths`: `/srv/rm/RenewableCEO/Builds/audit169{b1r2u,b1r1u,b05r5u,b05r4u,b05r2u,b05c,u37w,b35k,r19b,r18,r17}` | Old uidev/audit player builds | 10.8 GB | binaries **not** on Drive. Identity (commit, DLL hash, config) archived in #12 and its source is in the verified git packages | n/a | No runner reference (runner creates `audit169<ROUND>` per round). Evidence screenshots stay in `docs/evidence` | none found in repo_tools | Rebuild needed to re-inspect a binary (≈ 35 min each) | **A by retention policy B** (19 Nov: keep U37H, b05fu and the two newest), but no Drive copy of the binaries, so the owner must confirm |
| S4 | `/srv/rm/scratch/<1,357 entries>` listed in `storage_release/A2_scratch_archived_unchanged.paths` | Agent work folders from r35–b1 | 5.9 GB | #20 scratch_p01, #21 scratch_p02 | every file unchanged since the snapshot (size + mtime = manifest); packages are upload-verified but **not yet** Stage-6 streamed | No (no Batch 2 folder is in the list) | Runner reads patches from repo_tools, not these folders | Drive would hold the only copy | **C until #20/#21 are Stage-6 VERIFIED**, then A |
| S5 | `/srv/rm/backup/ArtSource` | Old ArtSource backup (includes ≈ 4.94 GB unique data) | 15.2 GB | #24–37 | 3/14 packages download-verified; per-file manifest complete | No active workspace uses it | none | **Single copy on Drive after removal**; unique art lost if Drive fails | **C**: needs Stage-6 VERIFIED on all 14 packages **and** a second copy (e.g. laptop) or explicit owner risk acceptance |
| S6 | `/root/.npm/_cacache` | npm download cache | 0.34 GB | — | — | No | regenerates on demand | Negligible | A (cache) |
| S7 | `/tmp/claude-0/-srv-rm-work` | Orchestrator session temp (task outputs, tool downloads) | 1.4 GB | — | — | Yes, while this session runs | current session | Breaks running task outputs | B (until session end) |

**Retain (B), not candidates:**

| Path | Size | Reason |
|---|---|---|
| `/srv/rm/RenewableCEO/Library` | 4.2 GB | Active Unity Library |
| `/srv/rm_b/RenewableCEO/Library` | 3.9 GB | Active Unity Library |
| `/srv/rm/work/.git` (incl. LFS) | 11 GB | Active repo |
| `/srv/rm/work/ArtSource` | 11 GB | Active ArtSource |
| `/srv/rm/docs` | 4.3 GB | QA evidence |
| `/srv/rm_b/docs` | 2.3 GB | QA evidence |
| Builds `audit169u37h`, `audit169b05fu`, `audit169b1r4u`, `audit169b1r3u`, `audit169r16`, `Android` | 7.1 GB | Reference builds / owner priority list |
| `/srv/rm_recovery` | — | Recovery sources and evidence |
| `/opt` | — | Unity Editor |

### Recoverable capacity

| Step | Frees | Free afterwards (from 15 GB) |
|---|---|---|
| S1 (after Auditor) | ≈ 2.0 GB | ≈ 17 GB |
| + S6 | ≈ 0.3 GB | ≈ 17.3 GB |
| + S2 (after reconciliation) | ≈ 3.5 GB | ≈ 20.8 GB → **heavy-build gate (≥ 20 GB) met** |
| + S3 (owner confirmation) | ≈ 10.8 GB | ≈ 31.6 GB |
| + S4 (after Stage 6 #20/#21) | ≈ 5.9 GB | ≈ 37.5 GB |
| + S5 (after Stage 6 #24–37 + second copy or risk acceptance) | ≈ 15.2 GB | ≈ 52.7 GB |

### Safest order
1. S1 → S6 → S2: test artefacts and caches only.
2. S3: reproducible builds, by owner confirmation under policy B.
3. S4: after Stage 6 streams #20/#21 (≈ 5.6 GB download, no disk).
4. S5: last, only after full Stage 6 and a second copy.

Each step needs explicit owner approval of the exact path list, a deletion manifest and before/after capacity. No `rm`, `find -delete` or rotation was run.

## 4. Suggested capacity allocation after S1–S3 (≈ 31 GB free)

| Use | Budget |
|---|---|
| Unity Library (2 lanes, existing) | already counted |
| Player builds for Batch 2–3 + validation (≈ 1.1 GB/round, keep newest 2 + references) | 8 GB |
| QA evidence for Batch 2–3 (captures, uidev, perfshot) | 4 GB |
| Temporary restore/build workspace | 4 GB |
| Runner safety floor (warn 15 / stop 8) | 15 GB held free |
