# b2_r516_wipguard_r518

Patch: b2_r516_wipguard_r518
Jalur: Batch 2 / B2-17 (perbaikan tes r516, hanya berkas tes)
Butir ceklist / temuan: C511-1 (Auditor AUDIT_R507_R512) — tes kunci r516 gagal di b2r5 (EditMode none: pass=2570 fail=1)
Apa yang berubah: RenewableCEO/Assets/Tests/EditMode/Game/AuditFixR516Tests.cs — tes C511_1_PlantPerfTab_WiringOn_RendersLegacyQuestStars_NotSunStars dibungkus #if SOFT_LAUNCH_WIP ... #endif (2 baris ditambah; isi tes tidak diubah).
Kenapa: HubHUD.PlantPerfTab ada di HubHUD.QuestMech.cs yang seluruhnya di dalam #if SOFT_LAUNCH_WIP; profil EditMode none tidak mendefinisikannya sehingga refleksi tidak menemukan metode ("metode HubHUD hilang: PlantPerfTab"). Ini cacat tes, bukan regresi produk; konvensi proyek (QuestScreenTests, StabilityR9Tests, dll.) membungkus tes kode WIP dengan define yang sama. Rollback runner b2r5 mencoba r517 (bukan penyebab) — temuan cakupan rollback runner untuk Auditor.
Dampak: KPI target: EditMode none fail 0 di ronde berikut. KPI lindung: tes C511_1_QuestPerfCard_Value_IsLegacyQuestCf10_NotSunStars (Core, tetap aktif di semua profil) + seluruh tes r516 lain tidak berubah. Risiko: tes call-site PlantPerfTab TIDAK berjalan di runner saat ini karena tidak ada job EditMode dengan SOFT_LAUNCH_WIP (job tester hanya TESTER_BUILD) — kunci call-site dorman sampai Auditor menambah profil tes WIP; dicatat sebagai temuan terbuka, bukan PASS.
Cara membatalkan: git apply -R b2_r516_wipguard_r518.patch; ulang job tests none (tes akan gagal lagi seperti b2r5).
Verifikasi offline: git apply --check pada ekspor bersih HEAD eaf594d di luar repo = OK; perubahan hanya direktif preprosesor di sekitar satu metode tes (tanpa perubahan simbol lain; helper Hud/LitStars/Call tetap dipakai/diizinkan tak terpakai tanpa error).
