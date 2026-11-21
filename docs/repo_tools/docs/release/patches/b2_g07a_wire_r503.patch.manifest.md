# b2_g07a_wire_r503 — Batch 2 G07a screen wiring: screens 28 / go-no-go / 31 / 34 / 37 read only from ProjectFinanceView

## Label manifest (format runner; isi diambil dari bagian di bawah, ditambahkan orkestrator 20 Nov 2026)
Apa yang berubah: berkas: RenewableCEO/Assets/Resources/Localization/strings.csv, RenewableCEO/Assets/Scripts/Core/Economy/ProjectFinanceViewDisplay.cs, RenewableCEO/Assets/Scripts/Core/Economy/ProjectFinanceViewDisplay.cs.meta, RenewableCEO/Assets/Scripts/Game/UI/Screens/FinanceScreensG07a.cs, RenewableCEO/Assets/Scripts/Game/UI/Screens/FinanceScreensG07a.cs.meta, RenewableCEO/Assets/Scripts/Game/UI/Screens/HubHUD.FinanceG07a.cs, RenewableCEO/Assets/Scripts/Game/UI/Screens/HubHUD.FinanceG07a.cs.meta, RenewableCEO/Assets/Scripts/Game/UI/Screens/HubHUD.Map.cs, RenewableCEO/Assets/Scripts/Game/UI/Screens/HubHUD.Projects.cs, RenewableCEO/Assets/Tests/EditMode/Game/FinanceScreensG07aTests.cs, RenewableCEO/Assets/Tests/EditMode/Game/FinanceScreensG07aTests.cs.meta. 
Kenapa: G07a / RC-U1-11 (screens computed finance on inconsistent bases, spec §2). Spec §5–§6, §12; owner decisions E-21…E-30 (D-1 E-26, D-2 E-27, D-3 E-28, P-02 E-23, P-03 E-29, D-4 E-30, O-3 spec §6).
Dampak: KPI target: one Core source for all finance figures on 28 / go-no-go / 31 / 34 / 37; no ratio on own cash spent; approved labels shown. KPI lindung: no change to economy formulas, tuning, save schema, accounting, `BuildCost`, `EquityNeeded`, legacy paths; B2-04 files untouched; switch off = old behaviour. Risiko / perubahan angka yang terlihat (sakelar nyala): 1. Plant card net / per-month / earned move from run-rate (`p.RevenuePerYear − p.OpexPerYear`) to plan basis (`p.Supply`), accepted by E-23. 2. Funding loan per card now `OfferedLoan(p, f, contractor)` (same contractor as `EquityNeeded`); before: `OfferedLoan(p, f)` (no contractor). Differs only where the contractor changes the loan (tutorial programme loan). 3. Funding breakdown labor = `ConstructionLabor` (spec §5) instead of the residual `EquityNeeded(OwnCash) − net`; differs only when a Stillwater top-up applies to OwnCash. 4. Go/no-go without `Supply` (legacy only): revenue falls back to `p.RevenuePerYear` instead of 0. 5. "/th" suffix dropped where the label already says "perkiraan per tahun". 6. P-03: the ID label "Perkiraan energi dihasilkan" (taken literally from the decision) sits on a **coin** figure; EN "Estimated energy produced". Owner may want "pendapatan"/earnings wording or an MWh figure — one CSV row to change. 7. Left in HubHUD (out of scope per spec §6): permit cost sum (31/go-no-go), sale price − loan (37), feasibility capex composition bar (component grouping of `plan.Capex`), `EstimatedOwnCapital`
Cara membatalkan: `git apply -R b2_g07a_wire_r503.patch` (r501 stays), or set `FinanceScreensG07a.On = false`. Captures to repeat: 28 feasibility (summary + detail), go/no-go (summary + detail), 31 project card (Permitting + Construction), 34 funding (with and without cash gap), 37 plant card (normal + Engineer, with an equity-partner stake), ID + EN, switch on vs off.
Verifikasi offline: rcompile_ep.py TOTAL 0 (Core 0, Game 0, Core.Tests 0, Game.Tests 0, Editor 0); also TOTAL 0 with `-define:SOFT_LAUNCH_WIP`. `git apply --check` r501 then r503 OK on a clean `a5a9315` export outside any repo; applied tree byte-identical to the compiled tree; `git apply -R --check` OK. Offline NUnit harness: `SameProject_SameNumbers_AcrossScreens28_GoNoGo_31_34_37`, `Partner_ShownOnlyWithActiveStake_ProfitIsProjectProfit`, `Switch_DefaultOn` PASS; r501 `FinanceViewG07aTests` (excl. T9) PASS. `Labels_Present_ApprovedTexts` and `NoRatio_SpentOwnCash_AnyStage` read strings.csv via `Application.dataPath` → Unity EditMode job only (CSV content checked offline with a script: 14 keys, EN+ID non-empty, approved ID texts exact). Not verified: Unity EditMode run, captures, device. Status = IMPLEMENTED (not TESTED).


Patch: b2_g07a_wire_r503          Jalur: UI (HubHUD screens) + Core display helpers + loc + EditMode tests          Butir ceklist / temuan: G07a (RC-U1-11: U1-022, U1-024, U1-025, U1-043, U1-060), TACTICAL_EXECUTION_BOARD B2-03
Stacked on: game `remediation/u37h-b2` @ `a5a9315` + `b2_g07a_core_r501`. Master U37H `dda07ec` untouched. B2-04 files (Fmt.cs, HubHUD.Team.cs Money(), HubHUD.cs Short(), EquityOfferHook.cs) NOT touched; existing Fmt/Money calls are used as they are.

## Apa yang berubah (berkas)
- `Scripts/Core/Economy/ProjectFinanceViewDisplay.cs` (new, + .meta): view-derived display values `PaybackYears` (CapexNet / NetProfitPerYear), `FundingBase` (CapexNet + LaborPart), `CashLeftAfter(f)`, `EstimatedEarned(years)` (NetProfitPerYear × years). No new economy formula; moves the arithmetic the screens used to do out of HubHUD.
- `Scripts/Game/UI/Screens/FinanceScreensG07a.cs` (new, + .meta): switch `FinanceScreensG07a.On` (default **true**; false = pre-r503 code paths, unchanged) + pure row model per screen (`Summary`, `Yearly`, `Cost`, `SpentOwn`, `FundingOption`, `FundingHeadline`, `FundingGap`, `Plant`, `ShowPartner`, `Keys`). No UnityEngine; every value comes from `ProjectFinanceView`.
- `Scripts/Game/UI/Screens/HubHUD.FinanceG07a.cs` (new, + .meta): row renderer (`FactRow` + existing `Fmt.Coins`/`Fmt.CoinLabel(Money())`) and D-4 partner note.
- `HubHUD.Map.cs` (28 feasibility): summary card (`FinanceOfPlan`) = "Biaya pembangunan" (CapexNet), revenue + net "perkiraan per tahun", payback from view; detail cost card header/grant/"Biaya pembangunan" from view; yearly card = revenue, OPEX, penalty, **Net** (P-02); lease (SOFT_LAUNCH_WIP) from view. `SummaryCard` gets an optional `ProjectFinanceView?` (null = old rows).
- `HubHUD.Projects.cs`: go/no-go money card = capacity, CAPEX, grant, Biaya pembangunan, revenue/OPEX/penalty/**Net** (P-02), reliability, partner note; summary = same view. 31 project card = "Kas sendiri terpakai X" with **no ratio at any stage** (D-1) + "Biaya survei tender tidak termasuk" for tender projects (D-2). 34 funding: headline "Kas yang kamu keluarkan sekarang (kas sendiri): X" = `CashNeededNow(OwnCash)` (O-3); gap band = `CashShortfall(OwnCash)`; per card "Kas keluar sekarang" = `CashNeededNow(f)`, loan = `LoanOffered(f)`, deposit, short = `CashShortfall(f)`; breakdown CAPEX/grant/labor/total from view; reserve from `ReserveAfter`/`CashLeftAfter`. 37 plant card: revenue (+ OPEX, penalty in Engineer mode) and **"Laba proyek (perkiraan per tahun)"** on plan basis (E-23), "Mitra ekuitas: 25%" + "Laba proyek ditampilkan sebelum bagian mitra" when `PartnerSharePct > 0` (D-4), earned figure labelled "Perkiraan energi dihasilkan" (= `EstimatedEarned`, P-03), keep option = `NetProfitPerMonth` labelled "Laba proyek (perkiraan)".
- `Resources/Localization/strings.csv`: 14 keys `fin.*` appended (EN + ID real text; ja/zh/ru/pt/ar empty, same as the latest rows in the file → existing fallback). CRLF kept.
- `Tests/EditMode/Game/FinanceScreensG07aTests.cs` (new, + .meta): 5 tests (below).

Sakelar: `RenewableCEO.Game.UI.FinanceScreensG07a.On` (default true). Off = every edited spot takes the original code path; views are not even built (`default`).

## Kenapa
G07a / RC-U1-11 (screens computed finance on inconsistent bases, spec §2). Spec §5–§6, §12; owner decisions E-21…E-30 (D-1 E-26, D-2 E-27, D-3 E-28, P-02 E-23, P-03 E-29, D-4 E-30, O-3 spec §6).

## Dampak
- KPI target: one Core source for all finance figures on 28 / go-no-go / 31 / 34 / 37; no ratio on own cash spent; approved labels shown.
- KPI lindung: no change to economy formulas, tuning, save schema, accounting, `BuildCost`, `EquityNeeded`, legacy paths; B2-04 files untouched; switch off = old behaviour.
- Risiko / perubahan angka yang terlihat (sakelar nyala):
  1. Plant card net / per-month / earned move from run-rate (`p.RevenuePerYear − p.OpexPerYear`) to plan basis (`p.Supply`), accepted by E-23.
  2. Funding loan per card now `OfferedLoan(p, f, contractor)` (same contractor as `EquityNeeded`); before: `OfferedLoan(p, f)` (no contractor). Differs only where the contractor changes the loan (tutorial programme loan).
  3. Funding breakdown labor = `ConstructionLabor` (spec §5) instead of the residual `EquityNeeded(OwnCash) − net`; differs only when a Stillwater top-up applies to OwnCash.
  4. Go/no-go without `Supply` (legacy only): revenue falls back to `p.RevenuePerYear` instead of 0.
  5. "/th" suffix dropped where the label already says "perkiraan per tahun".
  6. P-03: the ID label "Perkiraan energi dihasilkan" (taken literally from the decision) sits on a **coin** figure; EN "Estimated energy produced". Owner may want "pendapatan"/earnings wording or an MWh figure — one CSV row to change.
  7. Left in HubHUD (out of scope per spec §6): permit cost sum (31/go-no-go), sale price − loan (37), feasibility capex composition bar (component grouping of `plan.Capex`), `EstimatedOwnCapital` strip.
  8. Layout: new labels are longer (e.g. "Pendapatan (perkiraan per tahun)"); 31 adds one small note line; 34 always shows the CAPEX line in the detail card. Needs capture check (960×540 + A57) for overflow/ellipsis.

## Cara membatalkan
`git apply -R b2_g07a_wire_r503.patch` (r501 stays), or set `FinanceScreensG07a.On = false`. Captures to repeat: 28 feasibility (summary + detail), go/no-go (summary + detail), 31 project card (Permitting + Construction), 34 funding (with and without cash gap), 37 plant card (normal + Engineer, with an equity-partner stake), ID + EN, switch on vs off.

## Verifikasi offline
- rcompile_ep.py TOTAL 0 (Core 0, Game 0, Core.Tests 0, Game.Tests 0, Editor 0); also TOTAL 0 with `-define:SOFT_LAUNCH_WIP`.
- `git apply --check` r501 then r503 OK on a clean `a5a9315` export outside any repo; applied tree byte-identical to the compiled tree; `git apply -R --check` OK.
- Offline NUnit harness: `SameProject_SameNumbers_AcrossScreens28_GoNoGo_31_34_37`, `Partner_ShownOnlyWithActiveStake_ProfitIsProjectProfit`, `Switch_DefaultOn` PASS; r501 `FinanceViewG07aTests` (excl. T9) PASS. `Labels_Present_ApprovedTexts` and `NoRatio_SpentOwnCash_AnyStage` read strings.csv via `Application.dataPath` → Unity EditMode job only (CSV content checked offline with a script: 14 keys, EN+ID non-empty, approved ID texts exact).
- Not verified: Unity EditMode run, captures, device. Status = IMPLEMENTED (not TESTED).

## Test map
| Test | Checks |
|---|---|
| SameProject_SameNumbers_AcrossScreens… | 28 (`FinanceOfPlan`) = go/no-go summary + yearly; go/no-go = 34 (`FinanceOf(p, contractor)`); 31 = `SpentUsd` at go/no-go, ReadyToBuild, Operating; 34 cash-now = `EquityNeeded` per funding, headline = OwnCash need, gap = max(0, need − Cash); 37 rows = plan view of the same `Supply` (Engineer = normal profit); month = year/12; earned = net × years; D-3 build cost = CapexNet |
| NoRatio_SpentOwnCash_AnyStage | `fin.spent_own` EN/ID has one placeholder, no "/", "of", "dari"; `pj.spent` not used; no spent/budget row |
| Labels_Present_ApprovedTexts | all `fin.*` keys EN+ID; D-2, D-3, P-03, D-4 ID texts exact; P-02 "perkiraan per tahun"; every row key present |
| Partner_ShownOnlyWithActiveStake… | note only with active stake; 25 %; project profit unchanged by the stake |
| Switch_DefaultOn | switch default |
