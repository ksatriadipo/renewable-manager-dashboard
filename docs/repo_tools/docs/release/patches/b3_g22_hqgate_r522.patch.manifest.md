# Manifest b3_g22_hqgate_r522

Patch: b3_g22_hqgate_r522
Jalur: QA tooling (alat tangkapan uidev, milik Auditor) — Batch 3, B3-10, G22
Butir ceklist / temuan: U2-023 (uidev step hq_gate_progress + skill badges; VERIFICATION_INTEGRITY_U37H A7)
Apa yang berubah: RenewableCEO/Assets/Scripts/Game/Diagnostics/UiDevQa.cs; RenewableCEO/Assets/Scripts/Game/UI/Screens/HubHUD.AutoShot.cs; RenewableCEO/Assets/Scripts/Game/UI/Screens/HubHUD.AutoShotQa.cs; RenewableCEO/Assets/Tests/EditMode/Game/UiDevQaB3HqGateTests.cs (baru); RenewableCEO/Assets/Tests/EditMode/Game/UiDevQaB3HqGateTests.cs.meta (baru)
Kenapa: langkah I2 tidak pernah mencapai layar progres gerbang HQ. Cabang F9 hanya mengenal HqState=Ready (OpenHqStart); pada keadaan nyata (b2r4u: HqState=Locked, T1, Lv10) ia membuka pohon skill, mengganti nama jadi `88_director_skills` dan mencatat PASS hanya dari judul modal — chip gerbang (TierCard: syarat tingkat berikut + lencana Selesai/Belum) tetap terlipat bila met < count−1, tidak ada yang diukur. Layar progres gerbang yang sebenarnya pada keadaan Locked = chip gerbang `sk-gate` di pohon skill.

## Rincian perubahan
- `QaOpenGateScreen()` (AutoShotQa) ditulis ulang: buka pohon skill; bila konten chip gerbang terlipat, tekan tombol chip-nya sendiri (`QaPress`, NavigationSubmitEvent, sama seperti langkah tombol nyata u1002b); gulir kartu `sk-tier` ke viewport. Nama tangkapan selalu `hq_gate_progress` (cabang ganti-nama `director_skills` + cabang Ready dihapus).
- Spec: `SelectedObject = "hq_gate_progress"`, metrik wajib `hq_gate_req_count`, `hq_gate_met_count`. Terukur: `UiDevQa.HqGateObserved(...)` = `hq_gate_progress` hanya bila modal = "Skill direktur", DirectorGates nyala + tingkat < 5, syarat > 0, kartu tergambar (IsDrawn) dan seluruhnya di viewport (InViewport), jumlah baris `sk-req` = jumlah syarat, lencana tiap baris (`ly-badge-text`) cocok dengan Met dan tidak memuat status lawan (`HqGateBadgeOk`), dan kemajuan SEBAGIAN (0 < met < count, sesuai niat I2 "syarat MW + level terpenuhi, skill belum"). Selain itu `hq_gate:<alasan>` ⇒ PRECONDITION_FAIL + PNG `__INVALID`. Dicatat juga `hq_state` dan `hq_gate_reqs` (key=met/todo per syarat).
- Jalur lama (`_qaLog == null`) membuka layar yang sama (chip terbuka) tanpa spec.
- Tidak ada perubahan pada QaShotLog/QaShotSpec (kriteria vonis), OpenSkillTree/TierCard/OpenHqStart (produk), ekonomi, simpanan, sakelar.

Dampak: KPI target: tangkapan `hq_gate_progress` uidev (A57 + small16x9) = layar progres gerbang HQ terbuka dengan lencana per syarat, terverifikasi; atau PRECONDITION_FAIL jujur. Lebih ketat: dulu keadaan Locked = PASS `director_skills` tanpa ukuran apa pun, keadaan Ready = PASS dari judul saja; sekarang Ready (semua terpenuhi) = `hq_gate:all_met` ⇒ PRECONDITION_FAIL.
- Hasil yang diharapkan di ronde berikut (UNVERIFIED, belum dijalankan di Unity): keadaan b2r4u (Locked, T1) → kemungkinan PASS bila kartu muat di viewport A57; bila kartu di luar viewport/lencana tidak cocok → PRECONDITION_FAIL (temuan nyata, bukan cacat alat).
- KPI lindung: semua tangkapan lain uidev tidak berubah (urutan, spec). Jumlah tangkapan sama (satu tangkapan; nama `88_director_skills` → `NN_hq_gate_progress`). Build pemain: kode hanya di jalur -autoshot (Capture/QaCapture.On); UiDevQa fungsi murni.
- Risiko: (1) penekanan chip lewat NavigationSubmitEvent bergantung pada Button Unity 6 (pola yang sama sudah dipakai u1002b r409); bila tidak terbuka ⇒ `hq_gate:card_hidden` (FAIL, bukan PASS palsu). (2) Langkah sebelumnya mempelajari semua skill yang bisa; bila itu memenuhi semua syarat ⇒ `all_met` PRECONDITION_FAIL (diketahui b2r4u: Locked, jadi sebagian). (3) Bagian PRODUCT "skill badges" (label Dipelajari, lencana hanya poin yang bisa dipakai) = U2-024, TIDAK di patch ini.

Cara membatalkan: `git apply -R b3_g22_hqgate_r522.patch` (tanpa sakelar; alat QA saja), lalu ulang tangkapan uidev A57 + small16x9 langkah I2 (`hq_gate_progress`/`director_skills`).

Verifikasi offline: Basis: `git -C /srv/rm archive HEAD` (c8c4eda) + b2_auditfix_tests_r516 + b2_fin_ru_r517 di folder di luar repo git; `git apply --check` ketiga patch berurutan = OK.
- Compile offline (rcompile_ep.py, cermin /srv/rm/scratch/wip_b3_10/c_r2, GoogleMobileAds/Art/Resources/Scenes ditaut ke folder live hanya-baca): Core 0, Game 0, Core.Tests 0, Game.Tests 0, Editor 0 — TOTAL 0.
- EditMode baru `UiDevQaB3HqGateTests` (4 tes) dijalankan offline lewat Runner dotnet: 4 PASS, 0 FAIL. Tes yang butuh VisualElement (mis. UiDevQaF9Tests) tidak bisa jalan di luar Unity — wajib EditMode penuh di runner.
- Belum: tangkapan Unity (ronde uidev) — status DIAGNOSED → IMPLEMENTED; TESTED hanya sesudah ronde uidev + EditMode penuh.
- sha1 patch: bb0e9877a8406158382124c37f688c0f76943b56
