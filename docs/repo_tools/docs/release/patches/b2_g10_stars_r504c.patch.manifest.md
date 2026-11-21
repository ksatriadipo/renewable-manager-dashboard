# b2_g10_stars_r504c — Batch 2 G10: survey score → stars, one owner `SiteRating` (revision of r504)

## Label manifest (format runner; isi diambil dari bagian di bawah, ditambahkan orkestrator 20 Nov 2026)
Apa yang berubah: berkas: RenewableCEO/Assets/Scripts/Core/Tenders/SiteRating.cs, RenewableCEO/Assets/Scripts/Core/Tenders/SiteRating.cs.meta, RenewableCEO/Assets/Scripts/Game/UI/Screens/HubHUD.Map.cs, RenewableCEO/Assets/Scripts/Game/UI/Screens/HubHUD.MapTint.cs, RenewableCEO/Assets/Scripts/Game/UI/Screens/HubHUD.QuestMech.cs, RenewableCEO/Assets/Scripts/Game/UI/Screens/HubHUD.SelfProposal.cs, RenewableCEO/Assets/Scripts/Game/UI/Screens/HubHUD.SiteRating.cs, RenewableCEO/Assets/Scripts/Game/UI/Screens/HubHUD.SiteRating.cs.meta, RenewableCEO/Assets/Tests/EditMode/SiteRatingG10Tests.cs, RenewableCEO/Assets/Tests/EditMode/SiteRatingG10Tests.cs.meta. 
Kenapa: RCA G10 found: No owner for survey ratings. Four CF scales were in use (legend 0.13–0.23, relative ×25, cf/0.25, 0.15/0.18). Two safety formulas (survey vs feasibility). r504b does NOT unify them (see Open owner question). The map pin showed the raw index. Stars saturated at 5★, and the widget floor showed 1★ for 0. Decision D-5 approves absolute sun stars equal to the legend.
Dampak: KPI target:** The same site shows the same stars and band in survey, feasibility/go-no-go, pin and legend (T4, T11). The pin shows stars, not "0,67". Sun stars do not saturate on a Goldmeadow-like fixture (T5: ≥ 3 distinct values). With (a) ON, slope/safety/access/reliability rows equal the legacy output over a value table (T6). KPI lindung:** Map tint, legend and lens are float-identical (T1, T2). `Team.Stars(double)` and its callers are unchanged (T7 grep lock). Engineer mode is unchanged. No economy formula change (EstimatedCf, survey sigma, BidScore, SectorStars, RareFindCfRatio are untouched) and no save change (nothing stored). Risks:** 1. (r504b) Removed: there are no new bands for safety, slope, access or reliability. These rows keep the old formulas and the old widget (min 1★, ceil(v/2)), so saturation and the "1★ for 0" floor stay for those rows. Only the sun row changes (D-5). 2. Pin text "★n" changes the pin width and `_mapPlaced` collision. Re-capture 26 on A57 + small16x9. 3. Visible star spread changes on 27, 28 and go/no-go. Re-run `audit_loop` fit (row widths are fixed at 5 icons). 4. D1 yield label thresholds move from 0.18/0.15 to 4★ (cf ≥ 0.19) / 3★ (cf ≥ 0.17). The quest card scale moves from cf/0.25 to the legend bands. 5. `HubHUD.Map.cs` SummaryCard hunk (l.740–756) sits inside the B2-03 range ±724–760. The hunks change only the star lines with −U1 context, but if B2-03 changes the `SummaryCard` signature or body, a manual rebase of this hunk is needed.
Cara membatalkan: Set `SiteRating.WiringOn = false` (whole G10 back to the old UI) or `SiteRating.AbsoluteSunOn = false` (only the sun meaning goes back to relative). Or `git apply -R` this patch. Captures to repeat: 26_map_surveyed, 27_survey_result, 28_feasibility, the go/no-go card, the quest performance card and the D1 hex list (A57 + 960×540), plus EditMode tests.
Verifikasi offline: `rcompile_ep.py` TOTAL 0 (Core 0, Game 0, Core.Tests 0, Game.Tests 0, Editor 0) on the mirror `/srv/rm/scratch/wip_b2_g10b/c`. `git apply --check` OK on a clean `a5a9315` + r501 export, outside any repo (`/tmp/g10b_r1/chk`). The isolated apply is byte-identical to the compiled tree. `git apply -R --check` OK. Offline NUnit harness: T1–T6, T6b and T8–T11 PASS (0 fail, T9 ×5). T7 (source grep via `Application.dataPath`) needs the Unity EditMode job.


**Revision r504b (20 Nov 2026):** r504 added new 0..5 bands for slope/safety/access/reliability (`SlopeStars`, `SafetyStars`, `AccessStars`, `ReliabilityStars`) and showed them with (a) ON. Owner decision D-5 allows only the sun rating to change, with no new thresholds. r504b removes those four band functions and their monotonic tests. `SiteRatingView` now carries the legacy 0..10 values (`SurveySlope10`, `SurveySafety10`, `CardAccess10`, `CardSafety10`, `CardReliability10`), computed with the existing `Legacy*` formulas. The UI shows them with the old `KvStars`/`Stars(double)` widget, so with (a) ON every non-sun row is identical to today. The sun part (switch (b), D-5 tests T9–T11, legend consistency) and the raw-pin fix are unchanged from r504.

Patch: b2_g10_stars_r504c          Jalur: Core (Tenders, read-only rating) + Game UI (star lines only) + EditMode tests          Butir ceklist / temuan: G10 (U1-040, U1-041, U1-042), TACTICAL_EXECUTION_BOARD B2-09, RCA `/srv/rm/scratch/wip_b2_rca_g10/RCA_G10.md`, owner decision D-5 (20 Nov 2026)
Base: game `remediation/u37h-b2` @ `a5a9315` + `b2_g07a_core_r501.patch`. Master U37H `dda07ec` untouched.

## Apa yang berubah (berkas)
- NEW `Core/Tenders/SiteRating.cs` (+ .meta): static, pure (no UnityEngine/state/RNG/save).
  - `Quality01(cf)` = old `MapTint.CfScore` formula exactly (clamp01((cf−0.13)/0.10)).
  - `Stars(q)` and `BandKey(q)` use the `QualityRamp` band table (0.8/0.6/0.4/0.2, compared in float like the legend). One table, so stars and label always agree.
  - `SiteRatingView` readonly struct plus `Of(...)` and `Of(SurveyResult, ...)`: `SunStars` (D-5 bands) plus the legacy 0..10 values `SurveySlope10`, `SurveySafety10`, `CardAccess10`, `CardSafety10`, `CardReliability10` (no new bands).
  - `YieldClass(cf)` for D1.
  - `Legacy*`: the old UI formulas, moved verbatim. The sun/quest/D1 ones are used only when a switch is OFF. Slope/safety/access/reliability are used in both states (r504b).
- NEW `Game/UI/Screens/HubHUD.SiteRating.cs` (+ .meta): adds `StarsN(int)` (exactly 0..5 stars), `KvStarsN` and `StarFactN`. `HubHUD.Team.cs:Stars(double)` is untouched, so team, contractor and quest-bid screens are unchanged.
- `HubHUD.MapTint.cs:79`: `CfScore` now delegates to `SiteRating.Quality01`. This is float-identical, so tint, legend and lens do not change.
- `HubHUD.Map.cs`: 5 small hunks (−U1 context):
  - l.302 map pin: shows "★n" instead of the raw "0,67" (U1-040). Engineer mode still shows CF %.
  - l.554–561 survey sheet: the sun row uses `KvStarsN`; slope and safety stay on `KvStars(…, 0..10)` with the legacy value from `SiteRating`.
  - l.740–744 + l.756 `SummaryCard`: sun = `StarsN`; access/safety/reliability stay on `Stars(double)` with the legacy value from `SiteRating`.
  - Money rows in `SummaryCard` and `FeasibilitySummary` are not touched. Lines 880–913 are not touched.
- `HubHUD.QuestMech.cs:211-212` (quest performance card) and `HubHUD.SelfProposal.cs:59` (`YieldLabel`): both now read from `SiteRating`.
- NEW `Tests/EditMode/SiteRatingG10Tests.cs` (+ .meta), Core.Tests: T1–T11 (13 cases).
- NOT touched: `HubHUD.Projects.cs` (go/no-go gets the new values through `SummaryCard`, signature unchanged), `Fmt.cs`, `HubHUD.Team.cs`, `HubHUD.cs`, `EquityOfferHook.cs`, `strings.csv`, Profile15x.

## Sakelar (static bools in `SiteRating`; not registered in Profile15x, so they apply in both the 15× and the old world)
| Switch | Default | ON | OFF |
|---|---|---|---|
| (a) `SiteRating.WiringOn` | **ON** | Pin, survey sheet, Sekilas (feasibility + go/no-go), quest performance card and D1 label all read `SiteRating`. One CF scale (the legend) for the sun. Slope/safety/access/reliability rows are the old values and the old star display exactly (r504b). | Old UI code path exactly (`Legacy*` + `Stars(double)`), raw pin "0,67". |
| (b) `SiteRating.AbsoluteSunOn` | **ON** (owner decision D-5, 20 Nov 2026) | Survey and feasibility "Potensi energi" stars are absolute, with exactly the map legend formula and thresholds (no new thresholds, no location average). | Relative to the region average (old meaning, old star display exactly). |

(b) is independent of (a). It acts only through `SiteRating.Of`, which is used when (a) is ON. With (a) OFF, the screens show the old relative stars whatever (b) is set to.

## Kenapa
RCA G10 found:
- No owner for survey ratings. Four CF scales were in use (legend 0.13–0.23, relative ×25, cf/0.25, 0.15/0.18).
- Two safety formulas (survey vs feasibility). r504b does NOT unify them (see Open owner question).
- The map pin showed the raw index.
- Stars saturated at 5★, and the widget floor showed 1★ for 0.

Decision D-5 approves absolute sun stars equal to the legend.

## Dampak
- **KPI target:**
  - The same site shows the same stars and band in survey, feasibility/go-no-go, pin and legend (T4, T11).
  - The pin shows stars, not "0,67".
  - Sun stars do not saturate on a Goldmeadow-like fixture (T5: ≥ 3 distinct values).
  - With (a) ON, slope/safety/access/reliability rows equal the legacy output over a value table (T6).
- **KPI lindung:**
  - Map tint, legend and lens are float-identical (T1, T2).
  - `Team.Stars(double)` and its callers are unchanged (T7 grep lock).
  - Engineer mode is unchanged.
  - No economy formula change (EstimatedCf, survey sigma, BidScore, SectorStars, RareFindCfRatio are untouched) and no save change (nothing stored).
- **Risks:**
  1. (r504b) Removed: there are no new bands for safety, slope, access or reliability. These rows keep the old formulas and the old widget (min 1★, ceil(v/2)), so saturation and the "1★ for 0" floor stay for those rows. Only the sun row changes (D-5).
  2. Pin text "★n" changes the pin width and `_mapPlaced` collision. Re-capture 26 on A57 + small16x9.
  3. Visible star spread changes on 27, 28 and go/no-go. Re-run `audit_loop` fit (row widths are fixed at 5 icons).
  4. D1 yield label thresholds move from 0.18/0.15 to 4★ (cf ≥ 0.19) / 3★ (cf ≥ 0.17). The quest card scale moves from cf/0.25 to the legend bands.
  5. `HubHUD.Map.cs` SummaryCard hunk (l.740–756) sits inside the B2-03 range ±724–760. The hunks change only the star lines with −U1 context, but if B2-03 changes the `SummaryCard` signature or body, a manual rebase of this hunk is needed.
  6. NaN CF (unknown) shows 3★ / "mid" band (the old display was 3★ too).
  7. D1 label (risk 4) and quest card are sun/CF scales moved to the legend bands under (a). They are not new bands, but the owner may want to confirm that D-5 covers them as well (see the open question).

## Open owner questions
- **Two safety formulas:** the survey sheet uses `10 − hazard·10`, while the feasibility/go-no-go card uses `10 − hazard·8 − slope·0.3`. The same site can show different safety stars on the two screens. r504b keeps both unchanged (D-5 forbids new meaning). Should they be unified, and on which formula?
- **D1 yield label and quest performance card:** both move to the legend sun bands under (a) (unchanged from r504). Does D-5 cover them?
- **Not done (RCA L, U1-042 orphan star):** battery `FactRow("star")` at Map.cs:852 is left for G12, because the brief limits this patch to the named star lines.

## Cara membatalkan
- Set `SiteRating.WiringOn = false` (whole G10 back to the old UI) or `SiteRating.AbsoluteSunOn = false` (only the sun meaning goes back to relative).
- Or `git apply -R` this patch.
- Captures to repeat: 26_map_surveyed, 27_survey_result, 28_feasibility, the go/no-go card, the quest performance card and the D1 hex list (A57 + 960×540), plus EditMode tests.

## Verifikasi offline
- `rcompile_ep.py` TOTAL 0 (Core 0, Game 0, Core.Tests 0, Game.Tests 0, Editor 0) on the mirror `/srv/rm/scratch/wip_b2_g10b/c`.
- `git apply --check` OK on a clean `a5a9315` + r501 export, outside any repo (`/tmp/g10b_r1/chk`).
- The isolated apply is byte-identical to the compiled tree. `git apply -R --check` OK.
- Offline NUnit harness: T1–T6, T6b and T8–T11 PASS (0 fail, T9 ×5). T7 (source grep via `Application.dataPath`) needs the Unity EditMode job.

## Test map
| Test | Checks |
|---|---|
| T1 | `Quality01` == legacy CfScore (float-identical), CF 0..0.40 step 0.001 |
| T2 | Stars/BandKey == QualityRamp on every q, edges inclusive |
| T3 | sun stars monotonic, range 1..5 (r504b: the other-band checks are removed) |
| T4 | the same survey gives the same sun/slope/survey-safety via the survey and feasibility paths, (b) ON and OFF; OFF = old relative display |
| T5 | no saturation on a 20-hex fixture (CF 0.15–0.22): ≥ 3 distinct sun values |
| T6 | (r504b) with (a) ON, slope/survey-safety/access/card-safety/reliability equal the old inline formulas (value and widget stars) over a value table, (b) ON and OFF |
| T6b | (r504b) `SafetyStars`/`SlopeStars`/`AccessStars`/`ReliabilityStars` do not exist (no new bands) |
| T7 | regression lock: no inline CF→star formula in `HubHUD*.cs`; `Team.Stars(double)` still present (Unity only) |
| T8 | switch defaults (a) ON, (b) ON; Legacy* identical to the old formulas |
| T9 | D-5 low/medium/high: cf 0.14/0.16/0.18/0.20/0.23 → 1..5★ + band key == legend |
| T10 | D-5 exact boundaries cf 0.13/0.15/0.17/0.19/0.21/0.23 ± 1e-4 == legend stars; q 0.2/0.8 inclusive |
| T11 | D-5 survey == feasibility == map pin == legend for CF 0.10..0.25, independent of the location average |


## Rebase r504c (orchestrator, 20 Nov 2026)
- Identical to r504b except one trailing context line in the HubHUD.Map.cs SummaryCard hunk (after r503 moved `feas.total_cost` into `if (fin.HasValue)`). No added/removed line changed. Stack order: r501, r502, r503, r505, r504c.
