# G06 — Player-facing "hex" terminology (completion record)

- **Document status:** RECORD.
- **G06 status:** **IMPLEMENTATION PASS + EDITMODE PASS** (APPROVED by owner, 19 Nov 2026).
  - Visual validation: **NOT_TESTED**. Device validation: **NOT_TESTED**. Native-language review (ja/zh/ru/pt/ar): **PENDING**.
  - G06 is **not** release-validated.
- **Last updated:** 19 Nov 2026.

## Scope
- **Findings:** U1-005, U1-006, U2-020, U2-021, B1-N4 (root cause G06 / RC-U1-04).
- **Owner decision (19 Nov 2026):**
  - "area" for map / survey / tender contexts;
  - "per location" for skill cost/time contexts;
  - keys, internal identifiers, event names and technical references keep "hex".
- **Not in scope** (other tasks/batches):
  - U1-008 map highlight/fog (G19);
  - U1-009 survey button priority (G12);
  - U2-015 marker dedupe;
  - U2-022 skill branch labels via code;
  - U2-009 weather icon;
  - U2-038 garage strings;
  - U1-032/033/034/037 (D2: English institution names kept).

## Implementation (CONFIRMED)

| Item | Reference |
|---|---|
| Patch | `docs/release/patches/b2_g06hex_r500.patch` (sha256 prefix `b7f08a1122b1f3a9`) |
| Manifest | `docs/release/patches/b2_g06hex_r500.patch.manifest.md` (sha256 prefix `af2eea6a9d67762f`); runner check `LENGKAP` |
| Game commit | `a5a9315` "patch b2_g06hex_r500", branch `remediation/u37h-b2`, parent `03743a9` (runner identity `vps`) |
| Work-repo commit | `4e9a0802`, branch `remediation/u37h-b2` (patch + manifest only) |
| Generator / review data | `/srv/rm/scratch/wip_b2_g06hex/` (`g06hex.py`, `overrides.json` with 69 per-row overrides, `report.json` with before/after per row) |

**Changed:**
- `RenewableCEO/Assets/Resources/Localization/strings.csv`: 79 rows, 529 value cells, all 7 language columns.
  - 77 rows with "hex" in EN + ID;
  - 2 rows with stale hex wording only in translations (`mission.2.done`, `tender.won.body`).
- `RenewableCEO/Assets/Tests/EditMode/LocHexTermsG06Tests.cs` (new, 5 tests).

**Glossary:**

| Language | Map/survey/tender | Skill cost/time |
|---|---|---|
| EN | area | per location |
| ID | area | per lokasi |
| JA | エリア | 地点ごと |
| ZH | 区域 | 每个地点 |
| RU | участок | за локацию |
| PT | área (feminine agreement) | por local |
| AR | منطقة (feminine agreement) | لكل موقع |

Where "area" collided with the region meaning, the region word became region / wilayah / 地域 / 地区 / النطاق. In RU, the slot word became площадка.

**Intentionally unchanged:**
- rows that use "cell" for slots (`slot.need`, `refuse.slot.no_water`, `refuse.slot.no_sea`);
- battery cells (`event.battery.replace`, `q.MT-BAT-1.desc`);
- `wel.WEL-TREE.name`.

**Preserved invariants (CONFIRMED):**
- 13,181 rows, keys and order unchanged;
- CRLF kept; untouched lines byte-identical;
- 0 placeholder differences across 529 cells;
- identical placeholder sets across the 7 languages for all 79 rows;
- 492 banned-term matches before, 0 after.

## Verification (CONFIRMED)
- Offline compile `rcompile_ep.py`: TOTAL 0.
- `git -C /srv/rm apply --check` OK. Isolated apply byte-identical. `git apply -R --check` OK.
- Content of `a5a9315` for `strings.csv` and the test file is **byte-identical** to the patch result. Parent `03743a9` equals the patch base.
- Runner round **b2r1** (JOBS=patch,tests), 15:20:29–15:25:50 UTC:
  - EditMode **2,452 passed / 0 failed / 0 skipped / 4 inconclusive** (15:22:06–15:25:35);
  - judge: 0 regressions; rollback: none;
  - log `/srv/rm/docs/evidence/169_parity_b2r1/tests/editmode_b2r1_1521_none.log`;
  - NUnit XML `/srv/rm/RenewableCEO/Library/JobRunner/done/20261119-152156-280-tests.xml`.
- All 5 new tests passed:
  - `NoHexTerm_InAnyPlayerFacingValue`
  - `Glossary_AreaAndPerLocation`
  - `InternalKeys_ContainingHex_AreKept`
  - `ChangedRows_PlaceholdersMatchEnglish_InEveryLanguage`
  - `Header_HasExpectedLanguageColumns`

## Not tested / pending

| Item | Status |
|---|---|
| uidev captures a57 + small16x9 (shots 21, 22, 23, 24, 26, 57, 58) | NOT_TESTED. Planned to join the G07a/G08 capture round; needs capture authorization |
| Device (A57 or other phone) | NOT_TESTED |
| ja/zh/ru/pt/ar wording | PENDING native-speaker review (machine translation; no linguistic validation claimed) |
| Card text fit for longer RU/PT strings | NOT_TESTED |

## Known process issue
- The runner commit `a5a9315` also contains three files that are not in the patch:
  - `RenewableCEO/Assets/Resources/Config/build_stamp.txt` (stale stamp 05:06 → 06:13 from the b1r4u build);
  - `RenewableCEO/Assets/Tests/EditMode/Game/UiDevQaU1002cTests.cs.meta`;
  - `RenewableCEO/Assets/Tests/EditMode/Game/WinterQaWnMidR410Tests.cs.meta`.
- They contain no logic or product data.
- `RenewableCEO/Assets/Tests/EditMode/LocHexTermsG06Tests.cs.meta` (created 15:20:37 by Unity import) is still **untracked** and will be swept by the next runner commit unless the runner is fixed.
- See [RUNNER_INTEGRITY_FINDING.md](RUNNER_INTEGRITY_FINDING.md).
- **Rollback note:** `git apply -R` reverts only the patch content. `git revert a5a9315` would also remove the two r410/r411 `.meta` files (GUID churn).

## Productivity record (CONFIRMED measurements; separate orchestrator observation, n=1)

| Metric | Value |
|---|---|
| Executor | orchestrator; 0 subagents |
| Implementation active time | 9.0 min (15:11:39–15:20:39) |
| Runner time | 5.4 min (EditMode 209 s) |
| Approval → work-repo commit | 14.7 min |
| API calls / tool calls (implementation + close-out) | ≈43 / ≈43 |
| Tokens (implementation + close-out) | input ≈90; output ≈55.7 k; cache creation ≈110 k; cache read ≈24.5 M (≈0.56 M per call) |
| Rework | runner: 0 retries, 0 rollbacks, 0 test failures. Internal: generator re-runs, 1 manifest format rejection, 1 false-negative apply test, 1 compile-tool folder issue, 1 mis-structured scratch copy (left in place) |
| First-pass success | yes (first runner round green) |
| Storage | evidence 2.6 MB; scratch `wip_b2_g06hex/` ≈109 MB |

Agent-based localization benchmark (n=4: median 7.3 min, 30 k output, 4.4 M total tokens) is kept **separate** and is not overwritten.

The split of tokens between G06 close-out and a concurrent timeline analysis (15:20–15:44 UTC) is approximate.

## Follow-up actions
See [../ACTION_REGISTER_U37H.md](../ACTION_REGISTER_U37H.md): A-06, A-07, A-08.
