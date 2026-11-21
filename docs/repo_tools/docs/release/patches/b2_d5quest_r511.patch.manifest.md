# b2_d5quest_r511 — D-5 scope limit (owner E-37): quest performance cards keep quest-performance rating semantics

## Label manifest (format runner; isi diambil dari bagian di bawah, ditambahkan orkestrator 20 Nov 2026)
Butir ceklist / temuan: b2_d5quest_r511 — D-5 scope limit (owner E-37): quest performance cards keep quest-performance rating semantics
Apa yang berubah: berkas: RenewableCEO/Assets/Scripts/Game/UI/Screens/HubHUD.QuestMech.cs. Berkas: `Game/UI/Screens/HubHUD.QuestMech.cs` (3 lines). The survey/meter rows on the quest performance card always use the legacy quest scale `SiteRating.LegacyQuestCf10` (cf / 0.25 × 10) with the legacy star widget, regardless of `SiteRating.WiringOn`. r504c had switched them to solar-resource sun stars.
Kenapa: Owner decision E-37: absolute solar rating only for survey, feasibility, map legend and the D1 yield label (solar resource quality). Quest performance cards keep their own semantics. D1 YieldLabel (SelfProposal) stays on the legend bands (it rates solar resource quality).
Cara membatalkan: `git apply -R b2_d5quest_r511.patch`. Repeat: tests job; quest mechanics card capture.


Patch: b2_d5quest_r511          Jalur: Game UI quest mechanics card          Butir: G10 D-5 scope (E-37), TACTICAL_EXECUTION_BOARD
Base: game a5a9315 + r501, r502, r503, r505, r504c. Author: orchestrator. Master U37H dda07ec untouched.

## Apa yang berubah
Berkas: `Game/UI/Screens/HubHUD.QuestMech.cs` (3 lines). The survey/meter rows on the quest performance card always use the legacy quest scale `SiteRating.LegacyQuestCf10` (cf / 0.25 × 10) with the legacy star widget, regardless of `SiteRating.WiringOn`. r504c had switched them to solar-resource sun stars.

## Kenapa
Owner decision E-37: absolute solar rating only for survey, feasibility, map legend and the D1 yield label (solar resource quality). Quest performance cards keep their own semantics. D1 YieldLabel (SelfProposal) stays on the legend bands (it rates solar resource quality).

## Dampak
Dampak: quest performance card stars identical to a5a9315 (KPI target); KPI lindung = survey/feasibility/legend sun stars unchanged from r504c; no economy/save change; no test locks the old r504c quest behaviour (checked SiteRatingG10Tests).

## Cara membatalkan
`git apply -R b2_d5quest_r511.patch`. Repeat: tests job; quest mechanics card capture.

## Verifikasi offline
Verifikasi offline: compile TOTAL 0 on a5a9315 + b2r2 five + r510 + r511; git apply --check/-R --check OK outside any repo.
