# qa_lock15x_hook_r573

Patch: qa_lock15x_hook_r573
Basis: (basis game HEAD bf708d9; sha256 awal 56b59ee713899b45; 4 berkas BARU, tidak ada berkas lama yang diubah)
Jalur: QA / alat tangkapan 15× (kunci lock15x, job scene15x/traffic15x/grid15x) — capture-only, tanpa perubahan gameplay/ekonomi/simpanan
Butir ceklist / temuan: AUDIT_REGRESI_23NOV butir 14 (job VPS scene15x/traffic15x/grid15x + port kunci ke jalur 15×); README wip_tool_13_18 "Required game hook"

Apa yang berubah: 2 berkas C# baru (+ .meta), tanpa berkas lama diubah.
- BARU RenewableCEO/Assets/Scripts/Game/World/X15/QaLock15x.cs (+ .meta): kait BeforeSceneLoad (hanya `#if UNITY_EDITOR`). Bila `-world15x on` bersama `-scene3dshot`/`-trafficshot`/`-viewshot` → World15x.Enabled = RegionUi15x.Enabled = true sebelum Region15xBoot.AfterSceneLoad membangun dunia; PowerLine15x.Enabled = true hanya bila `-powerline15x on`; log persis `[QA15X] world15x=1 powerline15x=0|1`. Argumen dibaca lewat TestBuild.Arg (parser yang sama dengan Soak; -1 di build rilis). Sakelar induk QaLock15x.Enabled.
- BARU RenewableCEO/Assets/Tests/EditMode/Game/QaLock15xTests.cs (+ .meta): 3 job × flag nyala sebelum build + log persis; -powerline15x on; argumen tidak ada/off/nilai hilang/tanpa job/-soak/-x15shot = tidak berubah; induk mati; parser rilis (-1) tidak pernah menulis; kait = BeforeSceneLoad + Player15x Editor tetap Skip.
- Pendamping (bukan bagian patch, data runner): /srv/rm/scratch/wip_r573/views15x_grid.tsv → salin ke $SW/views15x_grid.tsv (/srv/rm/scratch/views15x_grid.tsv, default VIEWS15X_TSV); 12 tampilan Goldmeadow pembangkit→kios (kios tetapan -2.25,27.75 + fokus b3r525/b3r531).

Kenapa: di Editor Player15x.Decide = Skip dan EditorPlay15x diam bila ada -world15x; hanya Soak membaca flag. Akibatnya job 15× Editor mengukur dunia lama (w15x_on=0 → FAIL tertutup), sehingga kunci 15× tidak pernah bisa lolos sah.

Dampak: capture-only Editor; build pemain dan job tanpa -world15x on tidak berubah.
- KPI target: X15-PRE w15x_on ≥ 1 di job scene15x/traffic15x/grid15x; X15POWER kabel ≥ 1 di grid15x (dengan -powerline15x on).
- KPI lindung: build pemain tidak berubah (boot hanya dikompilasi di Editor; TestBuild.Arg -1 di rilis); job Editor tanpa -world15x on tidak berubah (R16/lama); Player15x/EditorPlay15x/Soak tidak disentuh; PowerLine15x.DefaultEnabled tetap MATI.
- Risiko: rendah. Tumpang berkas dengan r566b/r569/r570/r571/r572 = tidak ada (berkas baru saja). Bila -viewshot di Editor dijalankan dengan -world15x on oleh job lain, dunia 15× yang dibangun (memang maksudnya).

Cara membatalkan: `git apply -R qa_lock15x_hook_r573.patch` (atau QaLock15x.Enabled=false); ulang job scene15x/traffic15x/grid15x (diharapkan kembali w15x_on=0 FAIL tertutup).

Verifikasi offline: `git apply --check` pada HEAD bf708d9 OK; compile offline rcompile_ep (Core/Game/Core.Tests/Game.Tests/Editor) TOTAL 0; EditMode QaLock15xTests dijalankan di ronde berikut (belum dijalankan, butuh Unity).
