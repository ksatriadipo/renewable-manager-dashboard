# b2_p03_energy_r510 — P-03 (owner E-36): plant card "Perkiraan energi dihasilkan" shows MWh, not Koin

## Label manifest (format runner; isi diambil dari bagian di bawah, ditambahkan orkestrator 20 Nov 2026)
Butir ceklist / temuan: b2_p03_energy_r510 — P-03 (owner E-36): plant card "Perkiraan energi dihasilkan" shows MWh, not Koin
Apa yang berubah: berkas: RenewableCEO/Assets/Resources/Localization/strings.csv, RenewableCEO/Assets/Scripts/Core/Economy/EnergyEstimateP03.cs, RenewableCEO/Assets/Scripts/Core/Economy/EnergyEstimateP03.cs.meta, RenewableCEO/Assets/Scripts/Game/UI/Screens/HubHUD.Projects.cs, RenewableCEO/Assets/Tests/EditMode/EnergyEstimateP03Tests.cs, RenewableCEO/Assets/Tests/EditMode/EnergyEstimateP03Tests.cs.meta. Berkas: new `Core/Economy/EnergyEstimateP03.cs` (+ .meta), `Game/UI/Screens/HubHUD.Projects.cs` (plant card row only), `Resources/Localization/strings.csv` (+1 row `fin.energy_na`), new `Tests/EditMode/EnergyEstimateP03Tests.cs` (+ .meta). Under `FinanceScreensG07a.On` the row labelled `fin.earned_est` ("Perkiraan energi dihasilkan") now shows `p.Supply.DeliveredMwhPerYear × operating years` formatted "N MWh" (plan basis), icon "grid". No Koin/revenue figure under that label. Missing/invalid data (no Supply, per-year ≤ 0/NaN/∞, invalid years) → `fin.energy_na` ("Belum tersedia" / "Not available yet").
Kenapa: Owner decision E-36 (P-03 = energy in MWh, honest fallback). r503 had put a Koin figure under the energy label.
Cara membatalkan: `git apply -R b2_p03_energy_r510.patch` or switch `FinanceScreensG07a.On = false` (whole G07a screen set). Repeat: tests job; uidev plant card capture (37).


Patch: b2_p03_energy_r510          Jalur: Core Economy helper + Game UI plant card          Butir: G07a P-03 (E-36), TACTICAL_EXECUTION_BOARD
Base: game a5a9315 + r501, r502, r503, r505, r504c (b2r2 stack). Author: orchestrator. Master U37H dda07ec untouched.

## Apa yang berubah
Berkas: new `Core/Economy/EnergyEstimateP03.cs` (+ .meta), `Game/UI/Screens/HubHUD.Projects.cs` (plant card row only), `Resources/Localization/strings.csv` (+1 row `fin.energy_na`), new `Tests/EditMode/EnergyEstimateP03Tests.cs` (+ .meta).
- Under `FinanceScreensG07a.On` the row labelled `fin.earned_est` ("Perkiraan energi dihasilkan") now shows `p.Supply.DeliveredMwhPerYear × operating years` formatted "N MWh" (plan basis), icon "grid". No Koin/revenue figure under that label.
- Missing/invalid data (no Supply, per-year ≤ 0/NaN/∞, invalid years) → `fin.energy_na` ("Belum tersedia" / "Not available yet").

## Kenapa
Owner decision E-36 (P-03 = energy in MWh, honest fallback). r503 had put a Koin figure under the energy label.

## Dampak
Dampak: plant card energy row = MWh (KPI target); KPI lindung = switch OFF path unchanged (old plant.earned Koin row), no economy/save/tuning change; risk = label width on A57/960×540 (capture check).

## Cara membatalkan
`git apply -R b2_p03_energy_r510.patch` or switch `FinanceScreensG07a.On = false` (whole G07a screen set). Repeat: tests job; uidev plant card capture (37).

## Verifikasi offline
Verifikasi offline: compile TOTAL 0 (Core/Game/Core.Tests/Game.Tests/Editor) on a5a9315 + b2r2 five + r510 + r511; git apply --check/-R --check OK on a clean export outside any repo.

## Tes
EnergyEstimateP03Tests (7): per-year × years; zero/negative years; not revenue-based; no Supply / null project / invalid inputs → NaN.
