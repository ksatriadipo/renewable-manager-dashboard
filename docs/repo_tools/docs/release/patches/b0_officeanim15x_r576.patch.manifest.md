# b0_officeanim15x_r576.patch

Patch: b0_officeanim15x_r576 (game HEAD bf708d9; dipasang sesudah antrean p0r7 + p0r8 — tidak ada berkas yang sama)
Jalur: B0 / NN-03-NN-09 kantor A2 15× (bukti animasi)
Butir ceklist / temuan: G-U17 (wawancara tanpa animasi), G-U18 (sesi kerja kantor tanpa animasi), AUDIT_REGRESI_23NOV W25 (UNVERIFIABLE)

Apa yang berubah: log + kunci animasi tokoh kantor A2 di 15× (tanpa perubahan perilaku). Berkas: RenewableCEO/Assets/Scripts/Game/Characters/A2/OfficeAnim15x.cs, RenewableCEO/Assets/Scripts/Game/Characters/A2/OfficeAnim15x.cs.meta, RenewableCEO/Assets/Scripts/Game/UI/Screens/HubHUD.OfficeAnim15x.cs, RenewableCEO/Assets/Scripts/Game/UI/Screens/HubHUD.OfficeAnim15x.cs.meta, RenewableCEO/Assets/Scripts/Game/UI/Screens/HubHUD.AutoShotQa.cs, RenewableCEO/Assets/Tests/EditMode/Game/OfficeAnim15xR576Tests.cs, RenewableCEO/Assets/Tests/EditMode/Game/OfficeAnim15xR576Tests.cs.meta
- BARU `Scripts/Game/Characters/A2/OfficeAnim15x.cs` (+meta): sakelar `OfficeAnim15x.Enabled` (bawaan NYALA), daftar klip kantor wajib, filter tangkapan 50-55, baris log `[NN09A] shot=… actor=… clip=… playing=… state=… w15x=…`.
- BARU `Scripts/Game/UI/Screens/HubHUD.OfficeAnim15x.cs` (+meta): `Nn09aOfficeLog(shotId)` mencatat tiap tokoh kantor A2 aktif (kru `_a2Crew`, direktur, pemandu Erina `_a2Office`, tamu wawancara `_a2Visitor`) + ringkasan jumlah.
- `Scripts/Game/UI/Screens/HubHUD.AutoShotQa.cs`: satu baris di `QaTakeSpec` memanggil `Nn09aOfficeLog(id)` (jalur tangkapan QA saja).
- BARU tes `Tests/EditMode/Game/OfficeAnim15xR576Tests.cs` (+meta): 15× NYALA → `Scene3DFlags.A2Office` true; klip kantor wajib ada di pustaka A2; staf meja duduk + `ClipName == "type"` + playing; tamu wawancara memutar sit/explain/wave/walk; filter tangkapan.
- Tidak ada perubahan perilaku tokoh, gameplay, ekonomi, simpanan, kamera.

Kenapa: RCA (read-only HEAD): sesudah r551 tidak ada lagi gerbang Off15x/World15x di jalur kantor A2 — `A2OfficeStaff` (duduk/mengetik/dokumen/telepon/minum/istirahat, pulang/datang jam kerja), `A2Wander` pemandu, `UpdateVisitorA2` (duduk, `InterviewTalkTick`, lambai + jalan ke pintu), `WellnessWorldTick` semuanya memakai `A2OfficeOn = Scene3DFlags.A2Office && V31Active`, sama persis dengan jalur pra-15× (A2World). Tangkapan p0r4u 50_office_crew_wave memperlihatkan kru A2 duduk di meja (bukan rig 2D diam seperti sebelum r551). Yang hilang adalah BUKTI: tangkapan diam tanpa metrik klip (W25 UNVERIFIABLE). Patch ini menambah kunci + log per tokoh, memakai ulang sistem animasi lama (tanpa komponen paralel).

Dampak: KPI target = W25 dapat diverifikasi (log `[NN09A] … playing=True` untuk tiap tokoh di 50-55); KPI lindung = NN-03 (pose_sprite=0), tangkapan 50-55 tidak berubah piksel, EditMode r551 tetap hijau. Risiko: sangat rendah (log + tes). Catatan sisa (bukan 15×, tidak diubah): (1) wellness dimatikan WipGates di build soft launch (keputusan WIP, sama di dunia lama); (2) harness AutoShot `office_crew_wave/later` hanya memanggil Greet/WalkNow pada `_actors` 2D lama, jadi tangkapan 50/51 tidak memicu lambai/jalan kru A2 — perbaikan harness butuh `HubHUD.AutoShot.cs` (sedang dipegang antrean p0r7/p0r8), diusulkan patch terpisah sesudahnya.

Cara membatalkan: `git apply -R b0_officeanim15x_r576.patch`, atau sakelar `OfficeAnim15x.Enabled = false` (log mati; perilaku tidak berubah). Tangkapan yang diulang: uidev 50-55 (A57 + 960×540) + EditMode `OfficeAnim15xR576Tests`, `Nn03A2In15xR551Tests`.

Verifikasi offline: `git apply --check` pada HEAD bf708d9 OK; berkas tidak beririsan dengan p0r7 {r566b, r569, r570} / p0r8 {r572, r571, r573, r574b, r575b}; compile offline `rcompile_ep.py` TOTAL 0 (Core/Game/Core.Tests/Game.Tests/Editor 0 error).

Cek konsep: NN-03 lolos (tidak ada jalur sprite 2D baru; log hanya membaca A2Actor) / NN-09 lolos (tokoh kantor memakai klip A2 lama: duduk, mengetik, lambai, jalan; tes mengunci klip wajib + ClipName aktif). Bukti runtime: log [NN09A] di ronde berikut.
