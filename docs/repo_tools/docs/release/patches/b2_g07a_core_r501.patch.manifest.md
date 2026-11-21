# b2_g07a_core_r501 — Batch 2 G07a core: read-only ProjectFinanceView (Core only, not wired to UI)

Patch: b2_g07a_core_r501          Jalur: C (Core simulation, read layer) + EditMode tests          Butir ceklist / temuan: G07a (RC-U1-11: U1-022, U1-024, U1-025, U1-043, U1-060), TACTICAL_EXECUTION_BOARD B2-01
Type: new files only (2 Core source + 1 test + 3 `.meta`). No existing file is modified. Stacked on game `remediation/u37h-b2` @ `a5a9315`. Master U37H `dda07ec` untouched.

## Contents
Apa yang berubah: berkas: RenewableCEO/Assets/Scripts/Core/Economy/ProjectFinanceView.cs (new) + .meta, RenewableCEO/Assets/Scripts/Core/Simulation/Company.FinanceView.cs (new, partial Company) + .meta, RenewableCEO/Assets/Tests/EditMode/FinanceViewG07aTests.cs (new, Core.Tests, 13 tests) + .meta

- **`ProjectFinanceView`** (readonly struct, no UnityEngine, no saved fields):
  - cost (plan basis): `CapexGross`, `Grant`, `CapexNet` = max(0, Capex − Grant), `DevelopmentTotal`, `PlayerBuildCost` (= `Company.BuildCost(p)`; NaN on a feasibility plan, `DevelopmentKnown=false`);
  - own cash (actual): `SpentOwnCash` = `p.SpentUsd` with **no ratio and no "planned own cash Y" field**; flags `SpentExcludesSurveys` (tender project) and `SpentIncludesExtraCosts` (`HadIncident || PermitDelayed`);
  - funding (only while Stage ≤ ReadyToBuild, else NaN): `CashNeededNow(f)` = `EquityNeeded(p, f, contractor)`, `LoanOffered(f)` = `OfferedLoan(p, f, contractor)`, `CashShortfall(f)` = max(0, need − Cash), `InvestorDeposit`, `LaborPart` = `ConstructionLabor` (same function `OwnBase` uses), `ReserveAfter` = `FundingReserve(p, OfferedLoan(p, Bank))`;
  - yearly (plan basis, from `p.Supply`): `GrossRevenuePerYear`, `OpexPerYear`, `PenaltyPerYear`, `LeasePerYear`, `NetProfitPerYear` = Gross − Opex − Penalty (= `Supply.OperatingProfitPerYear`), `NetProfitPerMonth`; fallback without `Supply` (legacy paths only, board note 2): `p.RevenuePerYear` / `p.OpexPerYear`, penalty 0;
  - info: `DebtServicePerYear`, `InvestorProfitShare`, `PartnerSharePct` (active `EquityPartner` stake within its term; D-4 info only, no formula change);
  - internal diagnostics only (O-4): `RecurringChargePerYear` = `p.OpexPerYear` (operating), `PenaltyInRecurring` = P(1 − s) if the maintenance state has `OpexAdjusted`, else P.
- **Factories** `Company.FinanceOf(Project p, Bid contractor = null)` and `Company.FinanceOfPlan(RegionTender t, SupplyPlan plan)` (grant = `TutorialGrant(plan.Capex)` for a tutorial tender, else 0). They only call existing functions. Water/maintenance state is read with `TryGetValue` on the dictionaries, never through `WaterState`/`MaintState` (those create state and adjust `p.OpexPerYear`).

Sakelar: none needed (new read-only API with no caller in product code; rollback = `git apply -R`).

Kenapa: G07a / RC-U1-11 (screens 28, 31, go/no-go, 34, 37 compute finance with inconsistent bases, spec §2 table). Owner decisions 19 Nov 2026 in G07A_G08_SPECIFICATION §1 and §12: Company owns every calculation; NetProfit = Revenue − Opex − Penalty; P-01 no ratio against `SpentUsd`; P-02 plan basis for all displayed components; O-4 no formula change. B2-02 decisions (labels, D-1…D-4, P-03) are not needed for this core and are not pre-empted.

Dampak: KPI target = one Core source for project finance figures, FinanceOfPlan == FinanceOf for the same project (T16), plan-basis Net independent of run-rate (T17); KPI lindung = no change to economy formulas, tuning, save schema, BuildCost, legacy Company.Build, HubHUD or any screen (0 existing files touched), factories read-only (T9); risks below.
- **Risiko:**
  1. No consumer yet. Behaviour is unchanged until B2-03 wires the screens; until then the view can drift only if the called functions change, which T2/T7 catch.
  2. `PenaltyInRecurring` assumes `opexVisibleShare` is unchanged since the adjustment (spec §4.2 caveat). Diagnostic only, not player-facing.
  3. Plan-basis Net on a partnered project overstates the player's share (board note 1, D-4). The view exposes `PartnerSharePct`; how to show it is a B2-02 owner decision.
  4. T9 uses `JsonUtility` (save snapshot), so it runs only in the Unity EditMode job; it could not run in the offline harness.
  5. `CashShortfall` uses `Cash` at view time; the UI must rebuild the view when cash changes (not per frame).

Cara membatalkan: `git apply -R` this patch (new files only; nothing depends on it until B2-03/B2-04). Captures to repeat: tests job (EditMode) only; no capture needed (no UI change).

Verifikasi offline: rcompile_ep.py TOTAL 0 (Core 0, Game 0, Core.Tests 0, Game.Tests 0, Editor 0); git apply --check OK on a clean a5a9315 export outside any repo; isolated apply byte-identical to the compiled tree; git apply -R --check OK; offline NUnit harness 12/12 PASS (T9 needs Unity, EditMode by runner job tests).

## Test map (spec §9 + RCA)
| Test | Checks |
|---|---|
| T1 | plan factory: CapexNet, tutorial grant > 0, Net = `OperatingProfitPerYear`, no development/funding on a plan, grant 0 without tutorial tender |
| T2 | pre-operation: `PlayerBuildCost == BuildCost(p)`, Grant, CapexNet ≤ CapexGross, Development |
| T3 | operating: penalty folded into `p.OpexPerYear`; components from `p.Supply`; exact sum identity; displayed OPEX ≠ residual after a maintenance-style adjust |
| T4 | water adjust leaves plan fields unchanged; `PenaltyInRecurring` = P without maintenance state; P(1 − s) equals the penalty term in both adjust orders |
| T5 | grid project without `Supply`: penalty 0, fallback fields |
| T6 | same numbers at go/no-go, ReadyToBuild, with/without contractor |
| T7 | `CashNeededNow(f) == EquityNeeded`, `LoanOffered == OfferedLoan` for all 4 funding options; shortfall ≥ 0; labor, deposit, reserve |
| T8 | `SpentOwnCash == SpentUsd` before/after funding; extra-cost flags; reflection: no ratio/planned/budget/percent/progress member |
| T9 | read-only: save snapshot (incl. RNG seeds), Cash and project fields unchanged at plan, pre-operation and operating; no water/maintenance state created |
| T15 | survey paid from cash before the project exists: `SpentUsd` 0, `SpentExcludesSurveys` |
| T16 | `FinanceOfPlan(t, p.Supply)` == `FinanceOf(p)`; equals a fresh `PlanFor` |
| T17 | plant-card Net = plan basis, not `p.RevenuePerYear − p.OpexPerYear` run-rate; month = year / 12 |
| D4 | `PartnerSharePct` 0.25 only with switch on, stake present and within term; other fields unchanged |

T10–T14 (Fmt/Loc) belong to r502 (B2-04) and r503 (B2-03), per spec §10.
