# qa05_t8c_r38x — tes DxKontrak: cabut LogAssert.NoUnexpectedReceived (menolak log info normal) (Batch 0.5, tes saja)

Patch: qa05_t8c_r38x
Jalur: tes EditMode QA (Assets/Tests/EditMode/Game), tanpa kode produk
Butir ceklist / temuan: Batch 0.5 butir 8 — ronde b05r3: QaRestoreOnExceptionT8Tests.DxKontrak_RunSafe_ExceptionDitahan_FalseDanErrorTercatat gagal "Unhandled log message: '[Log] [QADIAG] dx1 {...}'"

Apa yang berubah: satu berkas RenewableCEO/Assets/Tests/EditMode/Game/QaRestoreOnExceptionT8Tests.cs, satu baris: `LogAssert.NoUnexpectedReceived();` di akhir DxKontrak_RunSafe_ExceptionDitahan_FalseDanErrorTercatat diganti komentar.
Kenapa: NoUnexpectedReceived juga menolak baris INFO normal "[QADIAG] dx1 {...}" yang ditulis Probe untuk varian 'all' sebelum lemparan disuntik pada varian gridhex_off. Itu bukan error; tes gagal karena asersi tambahan t8b yang keliru, bukan karena RunSafe (hasil false + error [QADIAG] tetap terbukti di run b05r3: hanya pesan log info yang dikeluhkan).
Dampak: jujur — asersi ini LEBIH LONGGAR daripada t8b (log info tak terduga tidak lagi menggagalkan tes). Tetap wajib: hasil "false" ketiga dx, tiga error `[QADIAG] dxN k: <Tipe>` (LogAssert.Expect, urutan diperiksa), Destroy EditMode 2 run; error/exception yang tidak di-Expect tetap menggagalkan tes (perilaku bawaan LogAssert). Kontrak asli user ("returns false or logs an error, tidak menghentikan tangkapan") tetap diperiksa penuh. KPI lindung: 11 tes T8 lain tidak tersentuh. Risiko: rendah (tes saja).
Cara membatalkan: `git apply -R docs/release/patches/qa05_t8c_r38x.patch` (1 berkas); tangkapan yang diulang: tidak ada.
Verifikasi offline: `git -C /srv/rm apply --check` OK di atas tumpukan b05r3 (t8b terpasang); bergantung qa05_dx5_r38u dipasang ulang di ronde yang sama.
Tes: QaRestoreOnExceptionT8Tests (12). Hasil diharapkan: 12/12 PASS; EditMode penuh 2264/0/0/4 (2253 + 11 tes T8 baru lulus... jumlah final dicatat dari XML).
Bergantung pada: qa05_t8_r38s, qa05_dx5_r38u, qa05_t8b_r38v.
