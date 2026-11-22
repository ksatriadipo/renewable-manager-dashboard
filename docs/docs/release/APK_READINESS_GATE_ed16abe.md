# APK Readiness Gate — candidate `ed16abe` (D1, internal tester APK for V-03)

Date: 22 Nov 2026 (UTC 11:50). Type: **read-only preflight**. Nothing was built, no Unity process or runner job was started, nothing in `/srv/rm` or `/srv/rm_b` was written.
Sources: CLAUDE.md 22 Nov entries "D1 APK internal untuk V-03: DISETUJUI BERSYARAT" and "D1 rekonsiliasi Round A + B3-02/03"; Auditor ruling `docs/remediation/batch03/AUDIT_ROUND_B2_B3R13.md` §6–§7.

## Verdict: **STOP**

The candidate commit itself is in order (identity, tests, Auditor gate, switch defaults all hold). The APK cannot be produced under the D1 conditions yet because:

1. **No Android build support on the VPS (hard blocker).** `/opt/unity/6000.6.7f1/Editor/Data/PlaybackEngines/` contains only `LinuxStandaloneSupport`; no `AndroidPlayer`, no JDK/Android SDK/NDK, no `pwsh`, no `bundletool`. Installing these is a download/install and needs a separate owner permission per operation (CLAUDE.md rules). The only existing APK route (`tools/release/build_aab.ps1 -Apk`) is the Windows laptop path.
2. **No VPS build path exists for the tester APK/AAB.** The runner (`/srv/rm/repo_tools/tools/qa/runner/run_job.sh:73`) only knows `build` = `audit_build -testerBuild -simPurchases` (Linux Standalone). `AndroidBuild.RunTesterAab` (`RenewableCEO/Assets/Editor/Build/AndroidBuild.Aab.cs:43-51`) refuses to run while the AdMob/UMP plugins are present (`Assets/GoogleMobileAds`, `Assets/Plugins/Android/googlemobileads-unity.aar`, `…/GoogleMobileAdsPlugin.androidlib` — all present in the live tree, git-ignored). Parking them is done only by `build_aab.ps1`; a Linux equivalent would be a new tooling change (manifest + review) that temporarily moves files inside `/srv/rm`.
3. **Owner screenshot review not evidenced.** D1 requires "review tangkapan"; memory rule "Screenshots before APK" requires the owner to review a before/after set and approve before any APK. Only the Auditor review (§3) is on record; no owner review of the b3r13u set was found in PENDING_DECISIONS, the tactical board, the task register or the progress tracker.

Per D1 ("bila prasyarat gagal → STOP + laporkan, jangan ganti commit"): the candidate stays `ed16abe`; no other commit is proposed.

---

## 1. Commit identity

| Item | Value | Status |
|---|---|---|
| HEAD | `ed16abeca013254122f923b5ad18a5d517e22e3d` "patch b3_qa_capturefix_r537b" (2026-11-22 10:02:52 UTC) | = Auditor candidate `ed16abe` — PASS |
| Branch | `remediation/u37h-b2` | — |
| Parents (top 3) | `ed16abe` r537b, `9c253ba` r535b2, `678e016` r537 | matches AUDIT_ROUND_B2 §6 |
| Working tree, Unity project (`git status -- RenewableCEO`) | only ` M RenewableCEO/Assets/Resources/Config/build_stamp.txt` (1 line) | PASS (A-05 exclusion) |
| Working tree, repo root | additionally `?? scratch/` and `?? work/` (runner scratch + the nested work repo; outside the Unity project, not in any build) | NOTE (not a build input) |
| Git-ignored build inputs in the live tree | `Assets/GoogleMobileAds/`, `Assets/Plugins/Android/googlemobileads-unity.aar`, `GoogleMobileAdsPlugin.androidlib`, `Assets/google-services.json` (ignored by `.gitignore:1`) | NOTE: a build "from `ed16abe`" also reads these untracked files; record their presence/park state in the build record |
| U37H master `dda07ec` | ancestor of HEAD (`merge-base --is-ancestor` OK), unchanged | PASS |
| Commits since U37H | 100 = 93 patch, 4 rollback, 2 re-apply, 1 meta-adopt (`git log dda07ec..HEAD`) | — |

## 2. Consolidated results

| Round / item | Result | Evidence |
|---|---|---|
| b3r10 / b3r10u review (r527f + r532) | r527f TESTED, r532 TESTED; perfshot lock FAIL (no-op shadow duplicate) → Auditor: measurement-definition defect, not a product regression | `docs/remediation/batch03/B3R1U_CAPTURE_AUDIT.md` §"b3r10 / b3r10u" (L122–128); `AUDIT_PERFSHOT_SHADOW_DUP.md`; `/srv/rm/docs/evidence/169_parity_b3r10u/` |
| Round A (b3r11 / b3r11b / b3r11bu: r533, r533b, r534) | **CONDITIONAL_PASS** (not PASS); conditions §7 | `docs/remediation/batch03/AUDIT_ROUND_A_B3R11.md` |
| Round B (b3r12 / b3r12u: r535b, r536, r537) | **FAIL** — commits not usable for D1 | `docs/remediation/batch03/AUDIT_ROUND_B_B3R12.md` |
| Round B2 (b3r13 / b3r13u: r535b2, r537b) | **CONDITIONAL_PASS**; Round A conditions confirmed at `ed16abe` (§6) | `docs/remediation/batch03/AUDIT_ROUND_B2_B3R13.md` |
| EditMode b3r13 | total 2800, **passed 2796 / failed 0 / inconclusive 4 / skipped 0** (verified from XML `<test-run>`) | `/srv/rm/docs/evidence/169_parity_b3r13/tests/20261122-100500-23704-tests.xml` |
| uidev b3r13u | A57 **15 issues / 7 of 99 screens**, 960×540 **15 / 7** (caps ≤ 21 / ≤ 18); locks gagal 0 both; exc 0; `rolled_back.txt` empty. Note: `uidev_summary_1120.txt` prints "FAIL (0/6 profil lulus)" because only 2 of 6 profiles were run by design | `/srv/rm/docs/evidence/169_parity_b3r13u/uidev_summary_1120.txt`, `uidev_a57_1120/`, `uidev_small16x9_1120/` |
| Perfshot b3r13u | **FAIL** (fail 2, duplicates 1, same_frame 7/8) = **FAIL-known**: (a) no-op shadow pair, (b) G22-class residue on `lama_peta_jauh` mission-ring edge. **Never counted as PASS** | `/srv/rm/scratch/b3r13u_nohup.log` (LOCK VI-F15 lines), `/srv/rm/docs/evidence/169_parity_b3r13u/perf/player/shots_summary.json` |
| Open G items | G-R11a (HQ slab in void), G-R11b (grey hex block in plaza), G-R11c (A57 garage modal 48/96 px shift), G-R11d (r532 freeze / perfshot FAIL-known) — all ☐ OPEN; **G-R13a** (perfshot HUD signature must include mission-pulse state) — proposed by the Auditor, **not yet a row in CHECKLIST_GOAL1** (register gap, to be added by the orchestrator) | `docs/release/CHECKLIST_GOAL1.md` L414–417; AUDIT_ROUND_B2 §4 |
| V-02 benchmark column | **"UNVERIFIED — F18 PENDING"** (D3); no 165-parity claim | CLAUDE.md 22 Nov D3; `B3_04_DEVICE_PERF_PLAN.md`, `RCA_B3-02_B3-03.md` |
| Device status | all rows NOT_TESTED; VERIFIED 0 | AUDIT_ROUND_B2 §7.5 |

## 3. Screenshot review list (what was reviewed, by whom)

Reviewed by the **Auditor** (AUDIT_ROUND_A_B3R11, AUDIT_ROUND_B_B3R12, AUDIT_ROUND_B2_B3R13). Paths under `/srv/rm/docs/evidence/169_parity_b3r13u/`:

| Capture | Profile(s) | Reviewed for |
|---|---|---|
| `uidev_a57_1120/29_slot_picker.png`, `uidev_small16x9_1120/29_slot_picker.png` | A57, 960×540 | r535b2: overlapping text 0, cell centres ≥ 44 px, no slab/fog (A57 label discs overlap → tap check required) |
| `uidev_a57_1120/47_home_build_zoom.png`, `uidev_small16x9_1120/47_home_build_zoom.png` | both | r537 redefinition: PASS (size 0.6, island 0, HQ in viewport) |
| `uidev_a57_1120/b3r537_region_initial_zoom.png` + `b3r537_evidence.jsonl` | A57 (+ 960×540 counterpart) | r536: 40 houses across, MidSize 1.2656 |
| `uidev_a57_1120/b3r525_evidence.jsonl`, `b3r527_fixture_restore.jsonl` | both | r537b ordering; rows identical to b3r12u |
| `perf/player/Tinggi_peta_jauh.png` vs `lama_peta_jauh.png`; `Seimbang_peta+modal.png` vs `Seimbang_tanpa_bayangan_peta+modal.png` | 2340×1080 | perfshot FAIL-known (a) + (b) |
| `uidev_a57_1120/40_photo_mode.png`, `68_decor_map.png` (Round A) | A57 | G-R11b grey hex block |
| `uidev_a57_1120/69_garage.png` (Round A) | A57 | G-R11c safe-area shift |
| `uidev_a57_1120/06_office_welcome.png`, `45_home_day.png`, `46_home_night.png`, `b3r525_office_*` (Round A) | A57 | r533/r533b framing, r534 office night (switch OFF) |
| perf `Seimbang_peta_jauh` / `peta_bangun` (b3r10u, Round A) | 2340×1080 | G-R11a slab edge |

**Owner/Director review:** not found on record → condition open (see Verdict 3).

## 4. Build configuration the APK would use

Route: `AndroidBuild.RunTesterAab` → `BuildAab("tester", ["TESTER_BUILD"])`, then universal APK via bundletool from the same AAB (`docs/release/APK_FIRE_PLAN.md` L16–23, step 2B `-DebugSign -Apk`; `docs/release/APK_TESTER_READY.md` §1–§3). `RunTesterApk` must **not** be used (it carries `RCEO_TEST_BUILD`; `AndroidBuild.cs:58-68`).

| Setting | Value at `ed16abe` | Source (file:line) |
|---|---|---|
| Project defines (Android) | `FIREBASE_SDK;UNITY_EDM_DISABLED;RM_PENDING_INTRO;RM_PENDING_SP1` (no RCEO_TEST_BUILD / SIM_PURCHASES / SOFT_LAUNCH_*) | `RenewableCEO/ProjectSettings/ProjectSettings.asset:651` |
| Extra build define | `TESTER_BUILD` only | `Assets/Editor/Build/AndroidBuild.Aab.cs:51` |
| Scripting backend | IL2CPP (project `Android: 1`; forced by build) Release, OptimizeSize | `ProjectSettings.asset:656`; `AndroidBuild.Aab.cs:108-110` |
| Architecture | ARM64 only (ARMv7 only with `-armv7`) | `ProjectSettings.asset:273` (`2` = ARM64); `AndroidBuild.Aab.cs:113` |
| min / target SDK | 26 / 36 | `ProjectSettings.asset:181-182` |
| Development build | refused if on; `BuildOptions.None` | `AndroidBuild.Aab.cs:100`, `:138` |
| Package | `com.konfersi.renewablemanager` | `ProjectSettings.asset:173` |
| Keystore | Project: `androidUseCustomKeystore: 0`, `AndroidKeystoreName` empty-project placeholder (`ProjectSettings.asset:276`, `:289`). Build reads env vars `RM_UPLOAD_KEYSTORE`, `RM_UPLOAD_KEYSTORE_PASS`, `RM_UPLOAD_KEY_ALIAS`, `RM_UPLOAD_KEY_PASS` (`AndroidBuild.Aab.cs:40`, `:170-185`), rejects a keystore inside the repo (`:178`), clears signing afterwards (`:192-196`). For the internal V-03 APK: `-debugSign` (no keystore, no secret). No keystore file or secret was opened or printed. | — |
| Ad plugins | must be parked before Unity (else build refuses) | `AndroidBuild.Aab.cs:48-60` |

Player defaults at `ed16abe` (in a TESTER_BUILD APK):

| Switch | Default in APK | Source |
|---|---|---|
| World 15× | **ON**: `Player15x.Enabled = true` (`Game/World/X15/Player15x.cs:42`); `IsTestBuild` true under `TESTER_BUILD` (`:52`); `Decide` → `cfg.test_builds` (`:74`); `Resources/World15x/player15x.json` `"test_builds": true`, `"release_builds": false`. Core `World15x.Enabled = false` (`Core/World/X15/World15x.cs:28`) is flipped by `Player15x.Apply` (`:89`). Runtime confirmation (Standalone build): `[PLAYER15X] World15x=on profile=on` in `169_parity_b3r13u/uidev_a57_1120/player.log:75` | PASS |
| PowerLine15x (B3-04) | **OFF**: `public const bool DefaultEnabled = false;` | `Game/World/X15/PowerLine15x.cs:26-27`; only QA paths set it (`HubHUD.B3QaR525.cs:215`, `HubHUD.B3QaR531.cs:58`) |
| OfficeNightBackdrop (r534) | **OFF**: `public const bool DefaultEnabled = false;` | `Game/World/OfficeNightBackdrop.cs:16-17`; only QA path sets it (`HubHUD.B3QaR525.cs:390`) |
| QA capture / diagnostics | **OFF**: `QaCapture.On = TestBuild.Enabled && FromArgs(args)` (`Game/Diagnostics/QaCapture.cs:31`), capture args `-autoshot -x15shot -wintershot -perfshot -qadiag` (`:14`); `TestBuild.Enabled` true only for `RCEO_TEST_BUILD || UNITY_EDITOR` (`Game/UI/Common/TestBuild.cs:40`), and `TestBuild.Arg` returns −1 otherwise (`:15`). A TESTER_BUILD APK has neither, and Android passes no command-line args | PASS |
| Tester perf overlay | present only under `TESTER_BUILD` (`Game/UI/Screens/HubHUD.TesterPerf.cs:1`); Settings → Penguji → tap version 5× | — |

**Define mismatch (known, APK_TESTER_READY §7):** all VPS evidence comes from the Linux Standalone `audit_build -testerBuild -simPurchases` (adds `RCEO_TEST_BUILD`, `SIM_PURCHASES`); the APK has `TESTER_BUILD` only, plus Android-only `FIREBASE_SDK`, ASTC textures, Medium quality. Device results are the only evidence for the APK itself.

## 5. Disk / RAM / runner preflight (read 22 Nov 11:50 UTC)

| Check | Value | Status |
|---|---|---|
| `df -h /` | 251 G, used 139 G, **113 G free** (56 %) | PASS (≥ 20 GB build gate) |
| RAM | 15 991 MB total, **14 469 MB available** | PASS (Unity ≥ 3.1 GB) |
| Unity / runner processes | none (`pgrep` Editor/Unity, WorldSlice, run_round, chain_b3*: empty) | idle |
| JobRunner queue | `pending/` and `running/` empty; `status.json` shows stale pid 271971 (`busy:settle`, 10:39 UTC) — **process not running** | idle (stale status file) |
| Last chain | `b3r13u_nohup.log` ends `b3r13u_DONE` / `CHAIN_DONE` (11:43) | idle |
| `heavy.lock` | last entries from earlier rounds (b05r5u); no active entry | idle |
| Previous build size/time | Only prior Android build: tester AAB 0.2.0-ct1, 9 Nov 2026, built on the **Windows laptop** (`Builds/Android/build-0.2.0-ct1.log` L6): AAB 144.9 MiB (Unity report 886.9 MiB), build steps ≈ 7.5 min. VPS estimate in `B3_04_DEVICE_PERF_PLAN.md`: 24–31 min. Universal APK expected ≈ AAB size or larger (single install-time pack) | estimate only |

## 6. Output path proposal (when unblocked)

- Proposed: `/srv/apk/rm/ed16abe/` — outside both git repos (`/srv/rm` is the game-repo root, so anything under it, including `/srv/rm/builds/`, is inside the worktree). Unity may write intermediates to `RenewableCEO/Builds/Android/` (git-ignored); the final APK + records are copied out.
- Record (one `build_record.json` + `.md`): commit SHA `ed16abeca013254122f923b5ad18a5d517e22e3d`, `git status -- RenewableCEO` (build_stamp only), build id / build_stamp, versionName/versionCode, define set (project + extra), signing (`debug`), plugin park state, Unity version 6000.6.7f1, AAB + APK **SHA-256 and size in bytes**, build log path, date/time.
- **No Play upload, no Firebase Test Lab upload, no distribution of any kind.** The APK goes only to the owner's devices (A57 reference, Vivo secondary) for V-03; each upload elsewhere needs separate owner permission.

## 7. V-03 scenario additions (Auditor §7.4) and gaps

Base: `docs/remediation/BLOCKER_TRIAGE_20261122.md` §6 (S1–S8, A57 PASS criteria, lower-spec proposal) + `docs/remediation/batch03/B3_04_DEVICE_PERF_PLAN.md`.

Add:
- **S4b — slot picker tap check (A57, mandatory):** open the 29 slot picker; tap the centre of each of the 7 cells; each tap selects that cell (selected index = tapped cell) → **7/7** required; record a screenshot per tap. Closes the B3-08 tap criterion only on device evidence.
- **S6b — Garage in A57 safe area (G-R11c):** open Garasi several times (cold and warm); the modal must stay inside the left safe-area inset with no 48/96 px jump; screenshot each open.

Gaps found (to be resolved in the V-03 plan before testing, not by changing the APK):
- **S7 (B3-04 cable series) is not executable on this APK.** The plan forces `PowerLine15x` ON "only through the existing QA capture flag", but `QaCapture.On` needs `RCEO_TEST_BUILD`/Editor plus command-line args (§4), which a TESTER_BUILD APK on Android does not have. With the switch OFF for players (D1: no switch enablement), S7 = NOT_TESTABLE in this build; a separate owner decision would be needed for any cable device measurement.
- **`[PERF15X]` log every 5 s** (BLOCKER_TRIAGE §6 build config): the only `[PERF15X]` emitter found is the X15Shot QA path (`Game/World/X15/X15ShotPlan.cs:126`), which is off in the APK. Device metrics must come from the tester perf overlay + external tooling (e.g. `adb shell dumpsys gfxinfo/meminfo`); p95/p99 frame time collection method must be fixed in the V-03 test kit.

## 8. D1 condition checklist

| # | D1 / Auditor §7 condition | Result | Evidence |
|---|---|---|---|
| 1 | Build from Round B commit only = `ed16abe`, tree clean except build_stamp | **PASS** | §1 (`git log -1`, `git status -- RenewableCEO`) |
| 2 | b3r10u reviewed | **PASS** | B3R1U_CAPTURE_AUDIT.md L122–128; AUDIT_PERFSHOT_SHADOW_DUP.md |
| 3 | Round A/B pass validation (Round A CONDITIONAL_PASS confirmed at `ed16abe`; Round B FAIL superseded by B2 CONDITIONAL_PASS) | **PASS** (conditional; not PASS-grade) | AUDIT_ROUND_B2_B3R13.md §6 |
| 4 | EditMode clean, XML archived | **PASS** (2796/0/0/4) | 169_parity_b3r13/tests/…23704-tests.xml |
| 5 | uidev within caps, locks 0, no rollback | **PASS** (15/15 issues, caps 21/18) | uidev_summary_1120.txt, rolled_back.txt empty |
| 6 | Perfshot FAIL-known, never counted PASS | **PASS** (recorded FAIL) | b3r13u_nohup.log LOCK VI-F15; AUDIT_ROUND_B2 §4 |
| 7 | G-R11a–d + G-R13a OPEN and recorded | **PARTIAL** — G-R11a–d recorded ☐; G-R13a not yet a CHECKLIST row (not a STOP; orchestrator to add) | CHECKLIST_GOAL1 L414–417 |
| 8 | V-02 = "UNVERIFIED — F18 PENDING" | **PASS** | AUDIT_ROUND_B2 §7.3; D3 |
| 9 | Screenshot review (owner, per "Screenshots before APK") | **FAIL** — only Auditor review on record | §3 |
| 10 | Preflight disk | **PASS** (113 G free) | §5 |
| 11 | Preflight configuration: 15× ON, B3-04 OFF, r534 OFF, QA/diag OFF in player build | **PASS** (code at `ed16abe`) | §4 file:line |
| 12 | Preflight: build toolchain able to produce the APK at `ed16abe` without changing other things | **FAIL** — VPS has no Android module/JDK/SDK/NDK/bundletool; no VPS build job; ad-plugin parking only in Windows `build_aab.ps1` | §Verdict 1–2 |
| 13 | Artifact destination outside git, record SHA/build id/SHA-256/size, no upload/distribution | **PASS** (proposal ready) | §6 |
| 14 | V-03 scenarios include 7/7 tap check (A57) + Garage safe-area (G-R11c) | **PASS** (added here as S4b/S6b); S7 + `[PERF15X]` gaps noted | §7 |
| 15 | Device status NOT_TESTED, VERIFIED 0, no switch enablement implied | **PASS** | AUDIT_ROUND_B2 §7.5 |

**Gate result: STOP** (conditions 9 and 12 fail).

To unblock (owner decisions, not taken here): (a) choose the build host — install Unity Android Build Support + OpenJDK/SDK/NDK on the VPS (download/install permission), or build on the laptop with `build_aab.ps1 -DebugSign -Apk` at exactly `ed16abe` (requires laptop access and sync); (b) if VPS: approve a manifested Linux build script that parks/restores the AdMob/UMP plugins and records the identity fields of §6; (c) owner reviews the §3 screenshot set and approves; (d) decide whether S7 (cable device perf) is dropped from this APK or needs a separate decision.
