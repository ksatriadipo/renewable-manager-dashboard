# qa05_dx5_r38u — diagnostik DX1–DX3 tidak menghentikan coroutine tangkapan; kontrak di pintu masuk QaDiag.RunSafe (Batch 0.5, temuan T8)

Patch: qa05_dx5_r38u
Jalur: QA/diagnostik tangkapan (Game/Diagnostics + Game/UI/Screens, jalur -qadiag saja)
Butir ceklist / temuan: Batch 0.5 DX1–DX4 + temuan T8 (qa05_t8_r38s / qa05_t8b_r38v: DxKontrak_RunSafe_ExceptionDitahan_FalseDanErrorTercatat)

Apa yang berubah: empat berkas RenewableCEO/Assets/Scripts/Game/Diagnostics/QaDiag.cs, RenewableCEO/Assets/Scripts/Game/UI/Screens/HubHUD.QaDiagDx1.cs, RenewableCEO/Assets/Scripts/Game/UI/Screens/HubHUD.QaDiagDx2.cs, RenewableCEO/Assets/Scripts/Game/UI/Screens/HubHUD.QaDiagDx3.cs:
- RenewableCEO/Assets/Scripts/Game/Diagnostics/QaDiag.cs: fungsi statis baru `QaDiag.RunSafe(string item, string shotId, Func<bool> probe)`: try → `return probe()`; catch (Exception e) → `Debug.LogError("[QADIAG] " + item + " " + shotId + ": " + e.GetType().Name + " " + e.Message)`, return false.
- RenewableCEO/Assets/Scripts/Game/UI/Screens/HubHUD.QaDiagDx1.cs: `QaDiagDx1(...)` memanggil `QaDiag.RunSafe(QaDiag.Dx1, shotId, () => QaDiagDx1.Probe(...))` (tanpa try/catch sendiri).
- RenewableCEO/Assets/Scripts/Game/UI/Screens/HubHUD.QaDiagDx2.cs: `QaDiagDx2(...)` sama (Dx2).
- RenewableCEO/Assets/Scripts/Game/UI/Screens/HubHUD.QaDiagDx3.cs: `QaDiagDx3(...)` sama (Dx3).
QaDiagDx1/2/3.Probe TIDAK diubah: Probe boleh melempar, pemulihan lapisan/kamera/material tetap di finally-nya, Object.Destroy tetap.
Kenapa: lemparan di Probe menghentikan coroutine WinterNightShot.MapShot / R9cAt / AutoShot (tangkapan berikut hilang). Keputusan kontrak orkestrator (18 Nov): jaminan "diagnostik tidak pernah menghentikan tangkapan" berada di PINTU MASUK yang dipanggil kode tangkapan, bukan di Probe (tes Dx*_Lempar… mensyaratkan Probe melempar untuk membuktikan pemulihan di finally). Satu helper menggantikan tiga try/catch inline versi sebelumnya (satu tempat, satu format log, bisa diuji langsung).
Dampak: KPI target = coroutine tangkapan tidak pernah berhenti karena diagnostik; T8 DxKontrak (versi RunSafe, qa05_t8b_r38v) PASS; Dx1 Lempar ×3, Dx1/Dx2 KameraNull, Dx2/Dx3 Lempar tetap PASS. KPI lindung = pemain tidak berubah (pembungkus kembali false sebelum RunSafe tanpa QaCapture.On + -qadiag; RunSafe hanya dipanggil dari pembungkus itu). Risiko: rendah; kegagalan tetap terlihat sebagai error [QADIAG] (tidak disembunyikan).
Verifikasi offline: compile offline tumpukan penuh + qa05_t8_r38s + qa05_f6b_r38t + patch ini + qa05_t8b_r38v = TOTAL 0 (/srv/rm/scratch/wip_f6b); `patch -p1 --dry-run` kumulatif t8 → f6b → dx5 → t8b OK di /srv/rm/scratch/wip_f6b/dry_r2.
Tes: QaRestoreOnExceptionT8Tests (12 tes), QaDiagDx1/2/3Tests. Hasil diharapkan: 12/12 PASS bersama qa05_f6b_r38t + qa05_t8b_r38v. Bukti dikumpulkan: hasil EditMode T8 + log `[QADIAG]` di ronde -qadiag.
Cara membatalkan: `git apply -R docs/release/patches/qa05_dx5_r38u.patch` (4 berkas; cabut qa05_t8b_r38v lebih dulu karena memanggil RunSafe); tangkapan yang diulang: ronde diagnostik dx.
Bergantung pada: qa05_dx1_r38o, qa05_dx2_r38p, qa05_dx3_r38q, qa05_dx4_r38r, qa05_t8_r38s.
