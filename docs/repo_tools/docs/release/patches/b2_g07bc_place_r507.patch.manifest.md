# b2_g07bc_place_r507 — Batch 2 G07b (place name source) + G07c (map location card object selection)

## Label manifest (format runner; isi diambil dari bagian di bawah, ditambahkan orkestrator 20 Nov 2026)
Butir ceklist / temuan: b2_g07bc_place_r507 — Batch 2 G07b (place name source) + G07c (map location card object selection)
Apa yang berubah: berkas: RenewableCEO/Assets/Scripts/Core/Simulation/Company.PlaceG07bc.cs, RenewableCEO/Assets/Scripts/Core/Simulation/Company.PlaceG07bc.cs.meta, RenewableCEO/Assets/Scripts/Game/UI/Screens/HubHUD.Hq.cs, RenewableCEO/Assets/Scripts/Game/UI/Screens/HubHUD.Map.cs, RenewableCEO/Assets/Scripts/Game/UI/Screens/HubHUD.PlaceG07bc.cs, RenewableCEO/Assets/Scripts/Game/UI/Screens/HubHUD.PlaceG07bc.cs.meta, RenewableCEO/Assets/Scripts/Game/UI/Screens/HubHUD.Popups.cs, RenewableCEO/Assets/Scripts/Game/UI/Screens/HubHUD.R9cShots.cs, RenewableCEO/Assets/Scripts/Game/UI/Screens/HubHUD.Small.cs, RenewableCEO/Assets/Scripts/Game/UI/Screens/HubHUD.WorldAlive.cs, RenewableCEO/Assets/Tests/EditMode/Game/PlaceLabelG07bTests.cs, RenewableCEO/Assets/Tests/EditMode/Game/PlaceLabelG07bTests.cs.meta, RenewableCEO/Assets/Tests/EditMode/PlaceSelectionG07bcTests.cs, RenewableCEO/Assets/Tests/EditMode/PlaceSelectionG07bcTests.cs.meta. 
Kenapa: U1-046/U1-049: place text from GDD hex-era `Places` table ("Galewatch Coast") while HUD says "Goldmeadow Flats". U2-014: `customer.Village` ("Desa terpencil") used in "di {0}". U1-044/U2-013: map card header (tender) and body (project) resolved independently per hex; sticky hex re-opened stale object's card.
Dampak: KPI target: place text == HUD region chip (`c15.rg.N.name`) on small card, inauguration, ProjectPhrase (map sheet, storm/incident/celebrate/contractor/commissioning toasts), feasibility chip; map pill = project's own tender; stage = selected project. KPI lindung: OFF-equivalence (both switches); save schema (ceremony/album keep hex ids, `_inaugVillages` unchanged); no economy/tuning; survey flow (no-project branches identical, sticky re-open kept for hex without project); AutoShot `OpenTileSheet(tender.CenterTile)` unchanged. Risiko: (1) all HQ-map hexes resolve to HQ region — a non-HQ project's album caption (hex arg) still shows HQ name (no project id in caption args; inauguration prompt itself uses project region); (2) feasibility chip text longer (zone + region, ~30 chars) — check A57/960×540 fit; (3) RU/JA/ZH region names fall back to EN where cells empty (Loc behaviour); (4) a deleted/abandoned selected project now closes the sticky sheet instead of re-opening its hex.
Cara membatalkan: `git apply -R b2_g07bc_place_r507.patch` or set `PlaceNameG07b.Enabled=false` / `MapSheetG07c.Enabled=false`. Captures to repeat: uidev 08_small_board, 36_mission4_done, 38_map_plant, 77 (event popup), 93-99 (map sheet / r9c roof / feasibility), A57 + 960×540; EditMode tests job.
Verifikasi offline: rcompile_ep.py TOTAL 0 (Core 0, Game 0, Core.Tests 0, Game.Tests 0, Editor 0) on the full stack (`/srv/rm/scratch/wip_b2_g07bc/c`). `git apply --check` + apply of r501→r502→r503→r505→r507 on a clean a5a9315 export in /tmp (outside any repo): all OK; `git apply -R --check` r507 OK; applied tree byte-identical to the compiled tree. CRLF preserved in Hq.cs/WorldAlive.cs. Offline NUnit (Core.Tests) PlaceSelectionG07bcTests 7/7 PASS. Game.Tests (PlaceLabelG07bTests, 4) need Unity EditMode job (HubHUD AddComponent + Loc resources).


Patch: b2_g07bc_place_r507          Jalur: C (Core read helper) + G (HubHUD text/map sheet) + EditMode tests          Butir/temuan: G07b (U1-046, U1-049, U2-014), G07c (U2-013, U1-044), TACTICAL_EXECUTION_BOARD B2-08a, RCA `/srv/rm/scratch/wip_b2_rca_g07bcd/RCA_G07BCD.md` §G07b/§G07c
Base: game `remediation/u37h-b2` @ `a5a9315` + r501 + r502 + r503 + r505 (in that order). Master U37H `dda07ec` untouched.

## Apa yang berubah (berkas)
- NEW `Core/Simulation/Company.PlaceG07bc.cs` (+ .meta): switches `PlaceNameG07b` (`On` = Enabled && World15x.Enabled) and `MapSheetG07c`; pure `MapSheetSelection.Resolve(projects, tenders, hexId, selProjectId, useObjectId)` + `Alive(p)`; partial Company `PlaceRegionOf(Project)` (= `X15RegionOfProject`) and `PlaceRegionOfTender(RegionTender)` (offer region, else HQ). No saved fields.
- NEW `Game/UI/Screens/HubHUD.PlaceG07bc.cs` (+ .meta): `PlaceLabels.For(no)` = `Loc.T(c15.rg.N.name)` (fallback `Cards15xR35.RegionLabel` "#N"); seams `SmallSiteRegion`/`HexRegion` (= `RegionLoader.HqNo`); HubHUD `CeremonyPlace(r)`, field `_selProjectId`, `ReopenSelectedSheet()`.
- `HubHUD.Small.cs` PlaceName, `HubHUD.WorldAlive.cs` VillageName: one guarded line each (switch on → region label) — covers all ~20 consumers (small cards, quests, celebrations, album captions via PlaceArg).
- `HubHUD.Hq.cs:232` inauguration prompt: `CeremonyPlace(r)` (region of `r.projectId`; else old `PlaceArg(r.village)`).
- `HubHUD.Popups.cs:438` ProjectPhrase: place slot `{0}` = region of project (switch on), else `customer.*` as before. `ProjectName` ("client · size" title) NOT changed: it has no place slot and the client type is correct there (RCA §G07b smallest change 3).
- `HubHUD.Map.cs`: line 204 sticky re-open → `ReopenSelectedSheet()`; OpenTileSheet project/tender via `MapSheetSelection.Resolve` (tender = `project.TenderId`) and records `_selProjectId`; close-X clears `_selProjectId`; feasibility zone chip gets " · <region>" (switch on). Hunks at ±204, ±433-446, ±836 — clear of G10 r504b (±302, ±555-561, ±740-756) and survey sheet.
- `HubHUD.R9cShots.cs` R9cAt (capture-only): with G07c on, clears `_selTile/_selProjectId` and closes the sheet before the camera move (RCA §G07c step 3).
- NEW tests: `Tests/EditMode/PlaceSelectionG07bcTests.cs` (Core.Tests, 7) and `Tests/EditMode/Game/PlaceLabelG07bTests.cs` (Game.Tests, 4) + .meta.
- Not touched: strings.csv (no new loc keys), economy/tuning/save schema, Missions.cs, Map.cs G10 lines, ProjectName, legacy `Places` table.

## Verifikasi "RegionLoader.ActiveNo" (RCA PROBABLE) → diganti HQ
Small sites never belong to a loaded non-HQ region: `SmallSites()` uses MapDecor clients (MapDecor off under LombokWorld in 15×, Sun15x.cs:62) → fallback `hq:*` at `HqPos`, plus HQ compound sites; `_zones` = `Region15xPlay.Zones()` = HQ region cells. `ActiveNo` changes when the player views another region, which would mislabel HQ jobs. So small-job place = `RegionLoader.HqNo` (seam `PlaceLabels.SmallSiteRegion`). Same for hex→village (`Company.Region` = HQ region map in 15×).

## Sakelar
1. `PlaceNameG07b.Enabled` (static, bawaan NYALA; effective only with World15x.Enabled): MATI or dunia hex = legacy `Places` / `customer.*` path, byte-identical.
2. `MapSheetG07c.Enabled` (static, bawaan NYALA): MATI = old per-hex lookup (first live project on hex; first Won tender else first Open/Evaluating), old sticky `_selTile` re-open, R9cAt unchanged. (Test `Resolve_*` asserts OFF equals legacy order.)
Defaults ON per tester-build precedent (G11); RCA asked "default ON only after capture" — orchestrator may flip both to false until the uidev capture round confirms.

## Kenapa
U1-046/U1-049: place text from GDD hex-era `Places` table ("Galewatch Coast") while HUD says "Goldmeadow Flats". U2-014: `customer.Village` ("Desa terpencil") used in "di {0}". U1-044/U2-013: map card header (tender) and body (project) resolved independently per hex; sticky hex re-opened stale object's card.

## Dampak
- KPI target: place text == HUD region chip (`c15.rg.N.name`) on small card, inauguration, ProjectPhrase (map sheet, storm/incident/celebrate/contractor/commissioning toasts), feasibility chip; map pill = project's own tender; stage = selected project.
- KPI lindung: OFF-equivalence (both switches); save schema (ceremony/album keep hex ids, `_inaugVillages` unchanged); no economy/tuning; survey flow (no-project branches identical, sticky re-open kept for hex without project); AutoShot `OpenTileSheet(tender.CenterTile)` unchanged.
- Risiko: (1) all HQ-map hexes resolve to HQ region — a non-HQ project's album caption (hex arg) still shows HQ name (no project id in caption args; inauguration prompt itself uses project region); (2) feasibility chip text longer (zone + region, ~30 chars) — check A57/960×540 fit; (3) RU/JA/ZH region names fall back to EN where cells empty (Loc behaviour); (4) a deleted/abandoned selected project now closes the sticky sheet instead of re-opening its hex.

## Cara membatalkan
`git apply -R b2_g07bc_place_r507.patch` or set `PlaceNameG07b.Enabled=false` / `MapSheetG07c.Enabled=false`. Captures to repeat: uidev 08_small_board, 36_mission4_done, 38_map_plant, 77 (event popup), 93-99 (map sheet / r9c roof / feasibility), A57 + 960×540; EditMode tests job.

## Verifikasi offline
- rcompile_ep.py TOTAL 0 (Core 0, Game 0, Core.Tests 0, Game.Tests 0, Editor 0) on the full stack (`/srv/rm/scratch/wip_b2_g07bc/c`).
- `git apply --check` + apply of r501→r502→r503→r505→r507 on a clean a5a9315 export in /tmp (outside any repo): all OK; `git apply -R --check` r507 OK; applied tree byte-identical to the compiled tree. CRLF preserved in Hq.cs/WorldAlive.cs.
- Offline NUnit (Core.Tests) PlaceSelectionG07bcTests 7/7 PASS. Game.Tests (PlaceLabelG07bTests, 4) need Unity EditMode job (HubHUD AddComponent + Loc resources).

## Test map
| Test | Checks |
|---|---|
| Switches_DefaultOn | both switches default ON |
| PlaceRegionOf_TutorialProject_IsHqRegion | TenderId 0 / no offer / null → HQ 0; tender without offer → HQ |
| PlaceRegionOf_X15Offer_IsOfferRegion | seeded `_x15OfferOf` → region 5 for project and tender; == X15RegionOfProject |
| Resolve_ProjectOnHex_TenderIsProjectsTender | 2 Won tenders on one hex → pill = project's tender; OFF = first Won |
| Resolve_SelectedProjectWins_OverFirstOnHex | selected id wins; OFF = first; other hex / dead project ignored |
| Resolve_StageFollowsSelectedProject | stage key = selected Construction project |
| Resolve_NoProject_BranchesUnchanged | ON/OFF identical without project: none, Open/Evaluating, Won first, Lost ignored |
| PlaceLabel_15xOn_NeverReturnsLegacyPlacesNames (Game) | EN/ID/RU, regions 0 and 5 == Loc.T(c15.rg.N.name), ∉ Places; unknown → "#9999" |
| PlaceName_VillageName_15xOn_HqRegion_OffLegacy (Game) | ON → HQ name; switch OFF / hex world → legacy Places |
| ProjectPhrase_DoesNotUseCustomerLabelAsPlace (Game) | ID "di <region>" for tutorial (HQ) and offer (5) projects; OFF = "di Desa terpencil" |
| SmallCardAndInauguration_IdStrings_NoCustomerOrLegacyAfterDi (Game) | sp.where + cer.prompt.plant contain neither "di Desa terpencil" nor any Places name; inauguration = project region |
