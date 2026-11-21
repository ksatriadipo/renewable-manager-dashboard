# qa05_t8b_r38v — tes kontrak DX T8 diarahkan ke pintu masuk tangkapan QaDiag.RunSafe (Batch 0.5, temuan T8; tes saja)

Patch: qa05_t8b_r38v
Jalur: tes EditMode QA (Assets/Tests/EditMode/Game), tanpa kode produk
Butir ceklist / temuan: Batch 0.5 butir 8 (qa05_t8_r38s) — konflik kontrak DxKontrak vs Dx*_Lempar

Apa yang berubah: satu berkas RenewableCEO/Assets/Tests/EditMode/Game/QaRestoreOnExceptionT8Tests.cs, satu tes saja: `DxKontrak_ExceptionDitahan_FalseAtauErrorTercatat` → `DxKontrak_RunSafe_ExceptionDitahan_FalseDanErrorTercatat`. Lemparan yang disuntik SAMA (PNG varian dx1/dx2 = direktori, folder keluaran dx3 = berkas); pemanggilan berubah dari `QaDiagDxN.Probe(...)` ke `QaDiag.RunSafe("dxN", "k", () => QaDiagDxN.Probe(...))`. Tes lain tidak diubah.
Kenapa: tes lama bertentangan dengan tes Dx1_LemparSaatVarian (×3), Dx2_LemparSaatHazeOff, Dx3_LemparSaatTulis — Probe yang sama diwajibkan melempar (prasyarat "lemparan disuntik") sekaligus mengembalikan false. Keputusan kontrak orkestrator (18 Nov): jaminan "diagnostik tidak pernah menghentikan tangkapan" dipindah ke pintu masuk yang dipanggil kode tangkapan (QaDiag.RunSafe, dipakai HubHUD.QaDiagDx1/2/3 lewat qa05_dx5_r38u); Probe boleh melempar.
Dampak: kekuatan asersi TIDAK berkurang, malah bertambah: tetap wajib hasil "false" untuk ketiga dx (lemparan yang keluar = gagal), DITAMBAH wajib error `[QADIAG] dxN k: <Tipe> <pesan>` tercatat (LogAssert.Expect regex, urutan diperiksa) dan LogAssert.NoUnexpectedReceived. Ekspektasi Destroy EditMode tetap 4 log (ExpectEditModeDestroy(2) dipecah 1 + 1 agar urutan antrean LogAssert cocok: Destroy di finally Probe → [QADIAG] di catch RunSafe). KPI lindung: 11 tes T8 lain tidak tersentuh. Risiko: rendah (tes saja).
Verifikasi offline: compile offline tumpukan penuh + t8 + f6b + dx5 + patch ini = TOTAL 0 (/srv/rm/scratch/wip_f6b); `patch -p1 --dry-run` kumulatif t8 → f6b → dx5 → t8b OK.
Tes: QaRestoreOnExceptionT8Tests.DxKontrak_RunSafe_ExceptionDitahan_FalseDanErrorTercatat. Hasil diharapkan: PASS dengan qa05_dx5_r38u; tanpa dx5 = gagal compile (RunSafe tidak ada). Bukti dikumpulkan: hasil EditMode T8 (12/12).
Cara membatalkan: `git apply -R docs/release/patches/qa05_t8b_r38v.patch` (1 berkas); tangkapan yang diulang: tidak ada (tes saja).
Bergantung pada: qa05_t8_r38s, qa05_dx5_r38u.
