# qa05_dx3_r38q — Batch 0.5 DX3: log plaza/kamera/titik dekor/lampu (G17, U2-004, U2-034)

Patch: qa05_dx3_r38q          Jalur: Q (Game/Diagnostics + partial HubHUD baru, kode QA saja) + tes EditMode Game          Butir ceklist / temuan: DX3 (ROOT_CAUSE_EVIDENCE_U37H Part D no. 4; G17 / U2-004 / U2-034)
Jenis: diagnostik tangkapan-saja, BACA SAJA (3 berkas BARU; tidak menyentuh berkas yang ada; tanpa efek pada pemain).

## Isi
Apa yang berubah: (1) RenewableCEO/Assets/Scripts/Game/Diagnostics/QaDiagDx3.cs (baru): `QaDiagDx3.Probe(Input, dir, shotId)` menulis satu baris ke dx_dx3.jsonl: plaza_present (`Plaza != null`) + extent plaza, home_present, HomeFocus, mapFocus, HqPos, layar + interior, posisi/euler/forward/ortho/ukuran/pixel kamera, camera_target (WorldCamera.Focus) + world_camera_size, zona dekor, tiap titik dekor (posisi dunia, viewport, in_view, panel_rect worldBound, left/top/display, attached) + spots_in_view + spots_stacked (titik berimpit = gejala fallback satu titik), NightLampPools.Registered/LastCount/LastFirst, WinterWorld.LanternsDrawn/LanternsPlaza/LanternsMap, NaturePilot.Time, NightGrade.Current. (2) RenewableCEO/Assets/Scripts/Game/UI/Screens/HubHUD.QaDiagDx3.cs (baru): `public bool QaDiagDx3(string shotId, string dir = null)` mengisi Input dari Plaza, home, mapFocus, HqPos, _screen, _interior, _decorZone, _decorSpots, worldCamera, _cam. (3) RenewableCEO/Assets/Tests/EditMode/Game/QaDiagDx3Tests.cs (baru, 2 tes): Probe_TanpaQadiag_TanpaEfek, TitikBertumpuk_Terhitung.
Fungsi: QaDiagDx3.Probe/Stacked; HubHUD.QaDiagDx3.
Sakelar: QaCapture.On DAN `-qadiag dx3`. Tidak mengubah apa pun (tanpa SetActive/enabled, tanpa render).
Situs panggilan (orkestrator, satu baris masing-masing): HubHUD.WinterNightShot.cs sesudah `WGrab(cam, rt, tex, Path.Combine(dir, "wn_plaza_night.png"));` → `QaDiagDx3("wn_plaza_night", dir);` ; HubHUD.AutoShot.cs baris loop `foreach (var qaShot in QaDecorGarageSteps()) yield return Shot(qaShot, 1.2f);` → `foreach (var qaShot in QaDecorGarageSteps()) { yield return Shot(qaShot, 1.2f); QaDiagDx3(qaShot, dir); }`.
Kenapa: DX3 — G17 PROBABLE (DecorSpotWorld jatuh ke satu titik HomeFocus/mapFocus bila Plaza == null di 15×; wn_plaza_night menampilkan Peta dari atas tetapi lanterns=4). Cek: `Plaza != null`, kamera, posisi panel titik, NightLampPools.Registered.
Dampak: KPI target = dx_dx3.jsonl untuk wn_plaza_night, decor_plaza, decor_plaza_selected, decor_map (+garage bila loop memanggilnya; dicatat apa adanya). Harapan G17: plaza_present=false dan spots_stacked ≥ 1 di 15× bila hipotesis benar. KPI lindung: tidak ada keadaan yang diubah; tangkapan produk tidak berubah. Risiko: sangat rendah.
Tes: QaDiagDx3Tests (2 tes EditMode). Hasil yang diharapkan: 2/2 PASS.
Cara membatalkan: `git apply -R docs/release/patches/qa05_dx3_r38q.patch`, atau jalankan tanpa `-qadiag dx3` (sakelar). Tangkapan yang diulang: job `tests` EditMode (QaDiagDx3Tests) + compile 0.
Verifikasi offline: scratch /srv/rm/scratch/wip_qa05_dx; rcompile_ep.py TOTAL 0 bertumpuk di atas qa05_dx1_r38o + qa05_dx2_r38p. `git -C /srv/rm apply --check` OK sendiri dan bertumpuk.

## Bukti yang dikumpulkan
- Job tests: QaDiagDx3Tests 2/2 PASS, compile 0.
- Ronde diagnostik (uidev + winter, `-qadiag dx3`): `<dir>/dx_dx3.jsonl` untuk wn_plaza_night dan decor_*.
- Depends-on: qa05_dx1_r38o (QaDiag), qa05_f13_r38a. Rollback-unit: U-B05-DX.
