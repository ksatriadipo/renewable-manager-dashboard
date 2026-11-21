# B2 Auditor review: r507, r508, r509, r512, r510, r511 as landed in round b2r3

Auditor (independent), 21 Nov 2026. Code read from the patches in `/srv/rm/repo_tools/docs/release/patches/` and from game repo `/srv/rm` branch `remediation/u37h-b2` (r507 `9ba2943`, r508 `d76906e`, r509 `970e845`, r512 `b12c2ca`, r510 `85e12ee`, r511 `c0d1000`). Read-only review. Nothing in the game repo, runner or patches was changed.

## 0. Evidence

| Source | Result | Label |
|---|---|---|
| `scratch/b2r3_nohup.log`: all 7 patches applied (r506–r512), ROLLBACK empty, CS errors 0 | OK | VALID |
| `docs/evidence/169_parity_b2r3/tests/editmode_b2r3_0522_none.log`: pass=2545 fail=0 inconclusive=4 (b2r2 was 2504) | OK | VALID (totals only) |
| Results per test: the b2r3 evidence folder has **no per-test XML**. The only per-test file is the Unity `TestResults.xml` from **b2r4** (06:58, 2565 passed; superset stack). In it: PlaceSelectionG07bcTests 7/7, PlaceLabelG07bTests 4/4, G07efgUiTests 4/4, RegulationPreviewG07fTests 4/4, ProductionLabelG07dTests 7/7, EnergyEstimateP03Tests 7/7, SoftLaunchShopTests 10/10 passed | OK | VALID for EditMode, but borrowed from b2r4 |
| Captures (A57, 960×540, uidev 08/36/37/38/64/72/77/79/93–99) | none taken in b2r3 (tests-only round) | NONE |

All six patches therefore stop at TESTED (VPS EditMode). None is VISUALLY_ACCEPTED or DEVICE_VALIDATED.

## 1. Verdicts

| Patch | Verdict |
|---|---|
| r507 `b2_g07bc_place_r507` (G07b region names, G07c map card object) | **PASS_WITH_CONDITIONS** |
| r508 `b2_g07efg_r508` (G07e feasibility rows, G07f regulation popup, G07g team card) | **PASS_WITH_CONDITIONS** |
| r509 `b2_g07d_shop_r509` (shop production label) | **PASS_WITH_CONDITIONS** |
| r512 `b2_g07d_loc_r512` (loc keys for r509) | **PASS** |
| r510 `b2_p03_energy_r510` (P-03 plant card MWh) | **PASS_WITH_CONDITIONS** |
| r511 `b2_d5quest_r511` (D-5 scope on quest card) | **PASS_WITH_CONDITIONS** |

No FAIL. No patch breaks an owner decision, changes economy, save schema or tuning, or adds per-frame cost. The conditions cover visual proof, which is missing, and test locks on call sites.

---

### r507 — PASS_WITH_CONDITIONS

**Decision compliance.** Fixes U1-046/U1-049/U2-014 (hex-era `Places` names and `customer.*` used as a place) and U1-044/U2-013 (map card header and body resolved separately). It conflicts with no E-row. Region names come from `c15.rg.N.name`, the same source as the HUD chip.

**Switches.** `PlaceNameG07b.On = Enabled && World15x.Enabled` and `MapSheetG07c.Enabled`, both default ON.
- OFF matches the old code. `PlaceName`/`VillageName` return early only when ON. `CeremonyPlace` falls back to `PlaceArg(r.village)`. `ProjectPhrase` uses `customer.*` when OFF. `Resolve(useObjectId:false)` gives the same order as the old `FirstOrDefault` (first live project on the hex; first Won tender, else Open/Evaluating). The test `Resolve_*` asserts this OFF order. `ReopenSelectedSheet` with the switch OFF goes straight to `OpenTileSheet(_selTile)`, the same as before. `R9cAt` is changed only when ON.
- With the switch ON, a project whose `TenderId` points to a tender that has been pruned falls back to the first Won/Open tender on the hex. That can still show another object's pill. This is rare (residual risk R507-R1).

**Economy/save.** Read-only. `PlaceRegionOf` = `X15RegionOfProject` (a pure lookup). `_selProjectId` is a UI field and is not saved. Ceremony and album records keep their hex ids.

**Tests.** PlaceSelectionG07bcTests (7) and PlaceLabelG07bTests (4) cover the resolver ON/OFF, the region lookup, ProjectPhrase/PlaceName/VillageName ON/OFF, and the ID strings for small cards and the inauguration. Reverting the helpers would fail compile or assertions. Not locked: the `HubHUD.Map.cs` call site (`OpenTileSheet` using `Resolve`, the close button clearing `_selProjectId`) and the feasibility chip suffix.

**Localization.** No new keys. `c15.rg.N.name` has EN/ID/RU filled and JA/ZH/PT/AR empty, which fall back to EN (`Loc.cs:145`). That is acceptable for proper nouns.

**Per-frame cost.** None. `PlaceName`/`VillageName` are now cheaper than the old `OrderBy` over `Places`.

**Capture risk.** The feasibility zone chip grows to "zone · region name" (about 30 characters) at A57/960×540. Every HQ-map village and small job now shows the same name, "Goldmeadow Flats". This affects the village modal title (`QuestMech.cs:454`), `wvillage.rose`, celebration flags and quest chips. Several villages in the HQ region become indistinguishable by name, and the album caption for a non-HQ project still shows HQ (manifest risk 1).

**Conditions**
- **C507-1** Capture uidev 08_small_board, 36, 38_map_plant, 77, 93–99 at A57 and 960×540 with both switches ON, and check that the feasibility chip fits without an ellipsis (UI_RULES). Until then the status stays TESTED.
- **C507-2** Product check of the village name collapse. The village modal title and the "village rose" toast now read "Goldmeadow Flats" for every HQ village. Either accept this in writing (orchestrator to user if it is visible in captures) or open a G item for village sub-names. Do not silently treat it as fixed.
- **C507-3** Add a Game test that locks the Map.cs wiring: the sheet for a selected project takes its pill from `project.TenderId`, and close-X clears `_selProjectId`. A revert of the call site must fail a test.

### r508 — PASS_WITH_CONDITIONS

**Decision compliance.** The E-33 geothermal "Segera hadir" row is untouched; the Map.cs hunk only adds classes to the star rows. The G12 battery-row icon is unchanged. `ApplyTariffChange` and `ResolveRegulation` are untouched.

**Switches.** `FeasibilityLayoutG07e.On`, `RegulationPopupG07f.On`, `TeamEventCardG07g.On`, all default ON.
- OFF: no classes are added (`MarkStarRow`/`MarkNoteRow` return early), the popup uses the old `event.regulation.body` with the old arguments, and the long-term row always shows (`ShowLongRow` returns true). Equivalent to the old behaviour. The global M-03 rule `#app .sk-fact { flex-wrap: wrap }` is intact, and a test asserts this.

**Economy/save.** `PreviewTariffChange` uses the same filter as `ApplyTariffChange` and changes no state; a test asserts the preview equals the applied delta. The popup reads the preview before the choice is resolved, so the figure is not computed on an already changed tariff.

**Tests.** Covered: the classes ON/OFF, the USS rules, the body in all 7 languages (customer name, sign, no "{"), and the "-" row. Not locked: the `SummaryCard` and `FactRow` call sites and the `OpenEvent` branch.

**Localization.** `event.regulation.body.up/.down` have all 7 columns filled (JA/ZH/RU/PT/AR are machine translations, which is the file's pattern).

**Per-frame cost.** None. Built when the popup or card is built.

**Copy risk.** With 0 operating plants of that customer type, the popup reads "≈ +$0/month from 0 operating plants". A test locks this text as intended. It is honest, but it reads oddly when the player has signed contracts that are not operating yet (Contracts > 0, Operating = 0). The text is longer than the old body, so check its fit.

**Conditions**
- **C508-1** Capture 99_plant_feasibility, 79_popup_perubahan_regulasi and 72_team_events at A57 and 960×540 with the switches ON. The stars must stay on the label line, the note row must not overflow, and the popup body must have no ellipsis. Run `tools/ui/audit_loop.sh` on all three.
- **C508-2** Review the copy for Operating = 0, either a short variant ("no operating plants yet; applies when they start") or written acceptance. Not a blocker for TESTED.
- **C508-3** Add one Game test that builds the Sekilas `SummaryCard` star row (or `FactRow` with a note) through HubHUD and asserts the classes are present, so that removing the call site fails.

### r509 — PASS_WITH_CONDITIONS

**Decision compliance.** Label only. Prices, exchange, ad quota (8/day), IAP, the Celengan and the MONET-15X/ARPDAU decisions are untouched. F8 (BuildShopTabBar) is not touched.

**Switch.** `ProductionLabelRules.G07dOn`, default ON. OFF runs the old `#if SOFT_LAUNCH_WIP` / `#else` code unchanged; `Compute` is unchanged.
- ON also changes the income basis below 24 h: it moves from Revenue − Opex to `FinanceOf(p).NetProfitPerYear`, which subtracts the penalty. So "identical to the old Compute below 24 h" holds for the same input, but the input differs. This is documented as risk 4 and is acceptable because it aligns with G07a §5.

**Economy/save.** `CoinPackLabel.Kind` gets two appended values. The struct is not saved. `tuning.json` is untouched and the display constants (30 days, 0.5-day step) are code-only.

**Tests.** ProductionLabelG07dTests (7) lock `ComputeShop`, `PerRealHour` and the read-only behaviour. `SoftLaunchShopTests:74-76` (`MaxHours` 24) still passes because it targets the legacy `Compute`. **Auditor decision: keep it as the OFF-path lock. Do not retarget it.** Not locked: `HubHUD.Shop.ProductionLabel` choosing `ComputeShop` when ON, and `ProductionLabelText` mapping Days/MaxDays.

**Localization.** The keys arrive in r512 (all 7 columns). The `Loc.Has` fallback in `ProductionLabelText` is now dead code. It is harmless.

**Per-frame cost.** `FinanceOf` runs per Operating project on each Shop page build, not per frame. If the Shop page refreshes on a timer, check the refresh interval (R509-R1).

**Capture risk.** The chip text "± 15 hari produksi" is longer than "± 24+ jam produksi". Check 64_shop_3 against the chip character budget in UI_COMPONENT_SPEC for ID/EN/RU.

**Conditions**
- **C509-1** Capture 64_shop_3 at A57 and 960×540 with ON and OFF. The three T1 packs must show distinct labels that increase, with no ellipsis. Check RU "Около 30+ дн. выработки" for width.
- **C509-2** Add a Game test: with `G07dOn` ON, `ProductionLabelText(ComputeShop(...))` for the three T1 pack sizes returns three different strings through `Loc` (the shop.prod.days/maxdays keys must exist). With OFF, the Shop label equals the legacy text.
- **C509-3** Record in the register that SoftLaunchShopTests:74-76 is the OFF-path lock (the Auditor decision above).

### r512 — PASS

Data only: two rows, 8 columns each, placeholders `{0}` in every language, no duplicate keys. EN/ID/RU match the r509 manifest text. No code, no switch needed. Rollback brings back the hour fallback in r509. The visual check is covered by C509-1.

### r510 — PASS_WITH_CONDITIONS

**Decision compliance (E-36).** Under the label `fin.earned_est` ("Perkiraan energi dihasilkan"), the row now shows "N MWh", computed as `Supply.DeliveredMwhPerYear × operating years`. No Koin or revenue figure appears under it, and the icon is `grid`. Missing or invalid data shows `fin.energy_na` (an honest fallback). This complies.

**Switch.** It uses `FinanceScreensG07a.On`. The OFF branch (`plant.earned`, a Koin row) is byte-identical.

**Economy/save.** Read-only helper, no tuning involved.

**Tests.** EnergyEstimateP03Tests (7) cover the formula, the year clamps, "not revenue-based" and the NaN cases. Not locked: the plant card call site (`EnergyProducedText` / `fin.energy_na` wiring).

**Localization.** `fin.energy_na` is filled in EN and ID only. The other languages fall back to EN, the same as the r503 `fin.*` rows. That is acceptable for the tester build, but RU is a stated target language (the E-row on RU language).

**Honesty risk.** `Supply` is set only for tender and campaign projects (`Company.Campaign.cs:639/829`, `Company.Save.cs:582`). A plant started outside the tender path (`Company.cs:261 new Project`, legacy cell start) has `Supply == null`. Its card would say "Belum tersedia" / "Not available yet" for its whole operating life. "Yet" implies the figure will appear later, which is untrue for such a plant. The value is also a plan basis (`DeliveredMwhPerYear`), not metered output. "Perkiraan" covers that.

**Per-frame cost.** None.

**Conditions**
- **C510-1** Capture uidev 37 (plant card) at A57 and 960×540, for one tender plant and one plant with no Supply (if reachable in 15×). Check the row width and the fallback text.
- **C510-2** If plants without Supply are reachable in 15× play, change the fallback text to one that does not promise data later (for example "Tidak tersedia" / "Not available"), or derive MWh from capacity × CF for them. Otherwise record that they are not reachable.
- **C510-3** Fill the RU column for `fin.energy_na` (and the sibling `fin.*` rows from r503) before any RU capture is judged.

### r511 — PASS_WITH_CONDITIONS

**Decision compliance (E-37).** The quest performance card (survey and meter rows) now always uses the quest scale `LegacyQuestCf10` (cf / 0.25 × 10, clamped 0–10) with the legacy `StarFact` widget. This is the same value as the a5a9315 expression `Math.Max(0, Math.Min(10, cf / 0.25 * 10))`, verified with git diff a5a9315..c0d1000. Survey, feasibility, legend and the D1 yield label keep the absolute solar rating from r504c. This complies, and it resolves the r504c FAIL from B2-05 for this screen.

**Switch.** Switch dependence is removed on purpose. Both the `SiteRating.WiringOn` ON and OFF paths now give the old quest behaviour, so "OFF = old" holds. ON is also old, which is what E-37 requires. The percent branch above it is unchanged.

**Economy/save.** None.

**Tests.** **No test locks this.** Re-applying the r504c lines (sun stars under WiringOn) would pass every current test, as the manifest itself notes ("no test locks the old r504c quest behaviour"). This is the weakest lock of the six.

**Localization and per-frame cost.** No change. `StarFactN` is now unused at this site; it remains in use or as dead code in `HubHUD.SiteRating.cs`. That is harmless.

**Conditions**
- **C511-1 (required before ☑)** Add a regression test: with `SiteRating.WiringOn = true`, the quest performance card value for cf = 0.20 equals `LegacyQuestCf10(0.20)` (8.0) and does not equal `SunStars(0.20)`. Alternatively, test a helper extracted from the card. Without it the E-37 scope fix is not regression-locked (`regress_lock.py` rule).
- **C511-2** Capture the quest mechanics card (the card that shows mech.perf.survey and mech.perf.meter) and compare it with the r504c capture.

---

## 2. Cross-cutting conditions

- **CX-1** The b2r3 evidence folder lacks the per-test `TestResults.xml`. The runner should copy it into `docs/evidence/<round>/tests/` for each round. The only per-test proof for these six patches is the later b2r4 file. This is a measurement gap, not a test failure.
- **CX-2** None of the six patches has a capture. Their status is TESTED (VPS). VISUALLY_ACCEPTED requires one uidev round covering C507-1, C508-1, C509-1, C510-1 and C511-2 at A57 and 960×540 with `audit_loop.sh`. DEVICE_VALIDATED is NOT_TESTED.
- **CX-3** A common pattern: Core and helper logic are tested, but the HubHUD call sites are not. C507-3, C508-3, C509-2 and C511-1 close this gap for these patches.

## 3. Residual risks (no condition)

- **R507-R1** With the switch ON, a project whose tender has been pruned falls back to the first tender on the hex.
- **R509-R1** `FinanceOf` runs per Operating plant on each Shop page build. This is fine unless the Shop page rebuilds on a short timer.
