# b2_g07d_shop_r509 — Batch 2 G07d: Shop coin-pack production label (U2-028)

Patch: b2_g07d_shop_r509          Jalur: Core (Economy, label only) + Game UI (Shop label)          Item / finding: G07d (U2-028), TACTICAL_EXECUTION_BOARD B2-08c, RCA `/srv/rm/scratch/wip_b2_rca_g07bcd/RCA_G07BCD.md` §G07d
Base: game `remediation/u37h-b2` @ `a5a9315` + r501, r502, r503, r505, r504c, r506 (in that order). Master U37H `dda07ec` untouched.


## Label manifest (format runner; isi diambil dari bagian di bawah, ditambahkan orkestrator 21 Nov 2026)
Butir ceklist / temuan: b2_g07d_shop_r509 — Batch 2 G07d (U2-028): label produksi paket koin Toko tidak jenuh di 24 jam
Apa yang berubah: berkas: RenewableCEO/Assets/Scripts/Core/Economy/ProductionLabel.cs, RenewableCEO/Assets/Scripts/Game/UI/Screens/HubHUD.Shop.cs, RenewableCEO/Assets/Tests/EditMode/ProductionLabelG07dTests.cs, RenewableCEO/Assets/Tests/EditMode/ProductionLabelG07dTests.cs.meta. Switch ProductionLabelRules.G07dOn (ON): satu jalur Core untuk build penguji + soft launch; pendapatan = FinanceOf Net; > 24 jam ditampilkan dalam hari, maks 30+ hari; Compute lama tidak berubah.
Kenapa: RCA G07d — batas 24 jam membuat tiga paket T1 berlabel sama ('± 24+ jam produksi'); dua jalur kode berbeda dan rumus pendapatan beda dari layar keuangan lain (G07A §5).
Dampak: KPI target tiga paket T1 berlabel berbeda dan naik; KPI lindung label < 24 jam identik dengan Compute lama, harga/kurs/iklan/IAP/ekonomi/save tidak berubah; risiko lebar chip 64_shop_3 (960x540 + A57). Kunci loc shop.prod.days/maxdays datang dari r512.
Cara membatalkan: git apply -R b2_g07d_shop_r509.patch atau ProductionLabelRules.G07dOn = false; ulang tangkapan 64_shop_3.
Verifikasi offline: compile TOTAL 0 (Core/Game/Core.Tests/Game.Tests/Editor, juga dengan SOFT_LAUNCH_WIP); T1–T7 7/7 PASS offline; tumpukan b2r2 + r506–r511 apply OK di worktree scratch (21 Nov).

## Which branch runs (verified)
- `ProjectSettings.asset` scriptingDefineSymbols: Standalone = `UNITY_EDM_DISABLED;RM_PENDING_INTRO;RM_PENDING_SP1`; Android = same + `FIREBASE_SDK`. Neither has `SOFT_LAUNCH_WIP` (only `WebBuild -softLaunchWip` / runner `BuildDefines -defs` add it; `AndroidBuild.Aab` rejects it for the tester AAB).
- So the tester/Standalone/Android build runs the `#else` legacy branch of `HubHUD.Shop.cs ProductionLabel` (Revenue − Opex, clamp `productionLabelMaxHours` 24 → "± 24+ jam"). Soft launch (`SOFT_LAUNCH_WIP`) runs `HubHUD.SoftLaunch.cs ProductionLabelV2` → `ProductionLabelRules.Compute` with the same 24 h clamp (`ProductionLabel.cs:98`). Both flavours saturate; both are fixed by the same switch.

## What changed (files)
- `Core/Economy/ProductionLabel.cs`:
  - `CoinPackLabel.Kind` gets `Days`, `MaxDays` (appended; struct is not saved).
  - NEW switch `ProductionLabelRules.G07dOn` (default **ON**).
  - NEW `ComputeShop(...)`: identical to `Compute` below `maxHours`; at/above it returns `Days` (rounded to 0.5 d) up to `MaxDays` = 30 d. Display constants, not tuning (`tuning.json` untouched).
  - NEW `PerRealHour(netPerYear)` (net/yr ÷ 720, same GameTime conversion as before) and `PlantNetPerRealHour(Company)` = Σ Operating max(0, `FinanceOf(p).NetProfitPerYear`) (r501 ProjectFinanceView, plan basis Gross − Opex − Penalty). Read-only.
  - `Compute` is NOT changed (OFF path and existing tests).
- `Game/UI/Screens/HubHUD.Shop.cs`:
  - `ProductionPerRealHour()`: ON → `PlantNetPerRealHour(_company)`; OFF → old formula.
  - `ProductionLabel()`: ON → new `ProductionLabelG07d` (one Core path for both flavours); OFF → old `#if SOFT_LAUNCH_WIP` / `#else` code untouched.
  - NEW `ProductionLabelG07d`: small-project income per play hour + avg job + fallback from `PlayIncomeLog` only under `SOFT_LAUNCH_WIP` (the log exists only there); tester build passes 0 = same as before (no label before first power).
  - NEW `ProductionLabelText(CoinPackLabel)`: one text mapping (Hours/MaxHours/Jobs/Days/MaxDays).
- NEW `Tests/EditMode/ProductionLabelG07dTests.cs` (+ .meta), Core.Tests, T1–T7.
- NOT touched: `HubHUD.SoftLaunch.cs` (ProductionLabelV2 left for OFF), `Popups.cs`, `Map.cs`, `strings.csv`, USS, `ShopConfig.cs`, `tuning.json`, prices, exchange (`ExchangeGems`, `CoinsPerGem`), purchase flow, save.

## Switch
| Switch | Default | ON | OFF |
|---|---|---|---|
| `ProductionLabelRules.G07dOn` (static bool, both worlds) | **ON** | One Core path for tester + soft launch; income = FinanceOf Net (plan basis); > 24 h → "≈ n hari", cap 30+ d | Old behaviour exactly (legacy `#if` branches, Revenue − Opex, "24+ jam") |

## Income basis (RCA confirmed)
- Plants: Σ `FinanceOf(p).NetProfitPerYear` over Operating projects ÷ 720 real hours (penalty now subtracted; lower than old Revenue − Opex where a penalty exists — RCA "acceptable").
- Small projects: they are not `Project`s; included as `PlayIncomeLog.SmallPerPlayHour` only in the soft-launch flavour (RCA: "pass small income 0 when the play log does not exist in that flavour"). Tester build has no small-income log → plant income only (unchanged scope from before).

## Loc keys needed (NOT added — strings.csv owned by r508; orchestrator/next patch to add)
- `shop.prod.days` — ID "± {0} hari produksi", EN "About {0} days of production", RU "Около {0} дн. выработки" (+ other columns).
- `shop.prod.maxdays` — ID "± {0}+ hari produksi", EN "About {0}+ days of production", RU "Около {0}+ дн. выработки".
- Until the keys exist, `ProductionLabelText` falls back via `Loc.Has`: Days → `shop.prod.hours` with n×24 ("± 144 jam produksi"), MaxDays → `shop.prod.max` with 720 ("± 720+ jam produksi"). Still distinct per pack, but the keys should land before a capture is judged. Chip width ("± 15 hari produksi" vs "± 24+ jam produksi") must be re-checked at 960×540 + A57 (`UI_COMPONENT_SPEC` chip character budget).

## Why
RCA G07d: the 24 h clamp (Shop.cs:491 / ProductionLabel.cs:98) collapses three T1 packs ($1,180 / $2,950 / $7,080) into one "± 24+ jam produksi"; tester build and soft launch use two different code paths and an income formula differing from other finance screens (G07A §5).

## Impact
- KPI target: three T1 packs show three different, increasing labels (T1: 6 d / 15 d / 30+ d at 50 kWp ≈ $6k/yr net; soft launch with small income: 2 / 5 / 11,5 h); no saturation above 24 h (T2); plant income = Σ FinanceOf Net (T6).
- KPI protected: below 24 h labels are identical to the old `Compute` (T3 sweep); legacy `Compute` unchanged (T4 + SoftLaunchShopTests); read-only (T6 Cash unchanged); prices, exchange rate, ad/IAP rules, monetisation decisions, economy, tuning, save: unchanged.
- Risks: (1) chip text longer → re-capture 64_shop_3 (960×540 + A57); (2) fallback strings in hours until loc keys land; (3) FinanceOf called per Shop page build per Operating project (cheap path for Operating: funding block skipped; not per frame); (4) penalty-subtracted income makes labels longer than before for penalised plants (intended).

## Existing tests for Auditor decision (NOT edited)
- `Tests/EditMode/SoftLaunchShopTests.cs:74-76` (`ProductionLabel_HoursFromPlantsPlusSmallProjects`: `Compute(1e6, 10, …)` → `MaxHours` 24). It locks the legacy `Compute`, which this patch keeps unchanged, so it still passes; but it no longer describes what the Shop shows with the switch ON (Shop now uses `ComputeShop` → `MaxDays`). Auditor to decide whether to keep it as the OFF-path lock or retarget it to `ComputeShop`.
- `SoftLaunchShopTests.cs:66-73, 80-87` (Hours/Jobs cases): unaffected (ComputeShop = Compute below 24 h, T3).

## Verification (offline, VPS)
- Offline compile (mirror `/srv/rm/scratch/wip_b2_g07d/c`, rcompile_ep.py, GoogleMobileAds/Art/Resources/Scenes linked read-only to live): Core/Game/Core.Tests/Game.Tests/Editor **TOTAL 0**; same with `-define:SOFT_LAUNCH_WIP` on Game + Game.Tests (`rcompile_slw.py`): **TOTAL 0**.
- New tests via offline NUnit runner (Core + Core.Tests DLL): T1–T7 **7/7 PASS**. SoftLaunchShopTests could not run in the offline runner (missing UnityEngine.ScriptingModule for another test in the class; environment, not this patch) → run in Unity EditMode batch.
- `git apply --check` of the full stack r501→r502→r503→r505→r504c→r506→r509 on a clean `git archive a5a9315` export in `/tmp/b2g07d_chk2` (outside any repo): OK; `git apply -R --check` r509: OK.
- Not yet done (orchestrator, Unity round): EditMode suite, capture 64_shop_3 at 960×540 + A57 with switch ON/OFF.

## Rollback
`git apply -R b2_g07d_shop_r509.patch`, or set `ProductionLabelRules.G07dOn = false` (old behaviour exactly). Re-capture 64_shop_3.
