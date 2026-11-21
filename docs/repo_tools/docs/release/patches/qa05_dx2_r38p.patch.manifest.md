# qa05_dx2_r38p — Batch 0.5 DX2: diagnostik kabut malam vs latar malam (U2-002, G05)

Patch: qa05_dx2_r38p          Jalur: Q (Game/Diagnostics + partial HubHUD baru, kode QA saja) + tes EditMode Game          Butir ceklist / temuan: DX2 (ROOT_CAUSE_EVIDENCE_U37H Part D no. 3; G05 / U2-002 / U1-015 / U1-016)
Jenis: diagnostik tangkapan-saja (3 berkas BARU; tidak menyentuh berkas yang ada; tanpa efek pada pemain).

## Isi
Apa yang berubah: (1) RenewableCEO/Assets/Scripts/Game/Diagnostics/QaDiagDx2.cs (baru): `QaDiagDx2.Probe(cam, dir, shotId)` merender tampilan kamera yang sama 2 kali — haze_on (apa adanya) dan haze_off (renderer "Haze" berinduk "CloudSkirt" = bidang kabut RegionMapBuilder.Skirt dimatikan SEMENTARA, dipulihkan di finally) — lalu mencatat ke dx_dx2.jsonl per varian: rata-rata RGB + luma petak 16×16 di 4 sudut (bl/br/tl/tr), jarak tiap sudut ke `NightGrade.Background` dan ke warna latar kamera (diset NaturePilot), luma latar, clearFlags, warna material kabut (baca saja), NaturePilot.Time, NightGrade.Current, meanL bingkai (rumus WinterStats) + PNG `dx2_<shot>__haze_{on,off}.png`. (2) RenewableCEO/Assets/Scripts/Game/UI/Screens/HubHUD.QaDiagDx2.cs (baru): `public bool QaDiagDx2(string shotId, string dir = null)`. (3) RenewableCEO/Assets/Tests/EditMode/Game/QaDiagDx2Tests.cs (baru, 2 tes): Probe_TanpaQadiag_TanpaEfek (tanpa berkas, renderer kabut + latar kamera tidak disentuh), PengenalKabut_DanSudut.
Fungsi: QaDiagDx2.Probe/HazeRenderers/IsHaze/CornerMean; HubHUD.QaDiagDx2.
Sakelar: QaCapture.On DAN `-qadiag dx2`. Tidak pernah mengubah RegionMapBuilder.Skirt, HazeColor, ApronColor, maupun material (hanya renderer.enabled sementara di dalam satu panggilan, BATCH05_RULES §4).
Situs panggilan (orkestrator, satu baris): HubHUD.WinterNightShot.cs MapShot, sesudah `WGrab(cam, rt, tex, Path.Combine(dir, name + ".png"));` → `QaDiagDx2(name, dir);` (rekaman memuat time_phase; yang dinilai wn_map_build_night).
Kenapa: DX2 — G05 PROBABLE ("bidang kabut 15× tidak ikut grade malam"; cek: piksel sudut wn_map_build_night vs NightGrade.Background dengan kabut mati). Membuktikan apakah sudut terang (meanL 180–205 vs target 80–112) berasal dari bidang kabut.
Dampak: KPI target = dx_dx2.jsonl haze_on/haze_off untuk wn_map_build_night; harapan G05: haze_off ⇒ corner_max_d_cam_bg kecil (sudut = latar malam), haze_on ⇒ sudut ≈ HazeColor terang. KPI lindung: tangkapan/metrik winter produk tidak berubah (probe sesudah grab, renderer dipulihkan), tanpa perubahan gameplay/save/kamera/material. Risiko: rendah — 2 render per tangkapan hanya saat -qadiag dx2.
Tes: QaDiagDx2Tests (2 tes EditMode). Hasil yang diharapkan: 2/2 PASS.
Cara membatalkan: `git apply -R docs/release/patches/qa05_dx2_r38p.patch`, atau jalankan tanpa `-qadiag dx2` (sakelar). Tangkapan yang diulang: job `tests` EditMode (QaDiagDx2Tests) + compile 0.
Verifikasi offline: scratch /srv/rm/scratch/wip_qa05_dx; rcompile_ep.py TOTAL 0 bertumpuk di atas qa05_dx1_r38o (dan dengan dx3). `git -C /srv/rm apply --check` OK sendiri dan bertumpuk.

## Bukti yang dikumpulkan
- Job tests: QaDiagDx2Tests 2/2 PASS, compile 0.
- Ronde diagnostik (winter, `-qadiag dx2`): `<dir>/dx_dx2.jsonl` + PNG `dx2_wn_map_build_night__haze_{on,off}.png`.
- Depends-on: qa05_dx1_r38o (QaDiag), qa05_f13_r38a. Rollback-unit: U-B05-DX.
