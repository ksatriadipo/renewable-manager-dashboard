# qa05_f6c_r38w — pop-up "Naik level!" dari ForceTier T5 tidak bocor + prasyarat modal naik level (Batch 0.5 F6c + N6c)

Patch: qa05_f6c_r38w
Jalur: QA/tangkapan (Game/Diagnostics + Game/UI/Screens, jalur -autoshot saja; semua kode baru hanya jalan bila `_qaLog != null` = QaCapture.On)
Butir ceklist / temuan: Batch 0.5 F6 (lanjutan F6c) + N6c; bukti cacat docs/evidence/169_parity_b05r2u/uidev_small16x9_1405 tangkapan 48–71 (modal Lv 6/7/26/30/45 menutupi home_t5_*, shop, office, decor, garage, semua tercatat PASS)

Apa yang berubah: 4 berkas + 1 meta — RenewableCEO/Assets/Scripts/Game/UI/Screens/HubHUD.AutoShotQa.cs, RenewableCEO/Assets/Scripts/Game/Diagnostics/QaShotLog.cs, RenewableCEO/Assets/Scripts/Game/Diagnostics/UiDevQa.cs, RenewableCEO/Assets/Tests/EditMode/Game/UiDevQaF6cTests.cs (+ .meta):
- RenewableCEO/Assets/Scripts/Game/UI/Screens/HubHUD.AutoShotQa.cs: `QaT5Begin` menyimpan `_popupOrder` + `_modal` sebelum `UiDevQa.ForceTier`, lalu `QaDropPopupsSince` (baru) membuang pop-up berurutan >= tanda dan menutup modal yang terbuka sejak itu (`CloseModal` dengan `_swappingModal = true` = tanpa suara/PerfMark; antrean lama disisihkan selama CloseModal agar ShowNextPopup tidak membuka pop-up lama, lalu dipulihkan persis). `QaT5End` melakukan hal sama sesudah `QaRestoreProgress` (tanda = tanda begin). `QaTakeSpec` mengisi prasyarat `LevelUpModal`; `QaObserve` mengukur `levelup_modal` dari `_modal` nyata (judul `Loc.T("lvl.up.title")`).
- RenewableCEO/Assets/Scripts/Game/Diagnostics/QaShotLog.cs: `QaShotSpec.KLevelUpModal = "levelup_modal"` + field `LevelUpModal` + masuk `Preconditions()` (null = tidak diperiksa; spec lain tidak berubah).
- RenewableCEO/Assets/Scripts/Game/Diagnostics/UiDevQa.cs: `IsLevelUpShot`, `ExpectedLevelUpModal` ("shown" untuk `NN_level_up…`, "none" untuk tangkapan lain), `LevelUpModalObserved`, `DropQueuedSince<T>`.
- RenewableCEO/Assets/Tests/EditMode/Game/UiDevQaF6cTests.cs (+ .meta): 5 tes.
Tidak diubah: penangan DirectorLeveledUp (HubHUD.Small.cs), Company/gameplay, ekonomi, simpanan, jalur pemain, CloseModal.

Kenapa: ForceTier → AddDirectorXp → DirectorLeveledUp → QueuePopup("Naik level!") ×N; QaT5End memulihkan tier/XP/kas tetapi tidak antrean pop-up, dan tidak ada prasyarat yang mendeteksi modal tak terduga ⇒ PASS palsu.

Dampak: KPI target = tangkapan 48_home_t5_* s.d. ±71 tanpa modal naik level; modal naik level di tangkapan selain level_up = PRECONDITION_FAIL (N6c). KPI lindung = 18_level_up tetap PASS (kini wajib "shown"); pemain tidak berubah (semua jalur baru di balik `_qaLog`). Risiko: (1) pop-up sah yang kebetulan diantre selama jendela T5 (±2 dtk) ikut dibuang — jalur tangkapan saja; (2) tip `GuideTips.LevelWhy` yang diantre OpenLevelUp tetap di antrean tip (bukan pop-up modal); (3) prasyarat baru lebih ketat: tangkapan lain yang selama ini tertutup modal naik level kini jadi PRECONDITION_FAIL (temuan nyata, bukan regresi). Alat hanya makin ketat.

Verifikasi offline: `git -C /srv/rm apply --check` OK di pohon hidup. Compile offline /srv/rm/scratch/wip_f6c: TOTAL 3 = galat bawaan pohon hidup (QaRestoreOnExceptionT8Tests memanggil QaDiag.RunSafe, sedangkan qa05_dx5_r38u sudah di-rollback); dengan dx5 dipasang sementara di scratch TOTAL 0 termasuk UiDevQaF6cTests.cs; patch ini menambah 0 galat.
Tes: UiDevQaF6cTests.F6c_T5BeginEnd_PopupNaikLevelTidakBocor_AntreanTetap, F6c_TangkapanTanpaModalNaikLevel_Pass, N6c_ModalNaikLevelDiTangkapanBukanLevelUp_PreconditionFail, F6c_TangkapanLevelUp_WajibModalNaikLevel, F6c_JalurNyata_BuangPopupSesudahForceTierDanSesudahRestore. Hasil diharapkan: PASS semua; F6/T8 lama tetap PASS.
Bukti dikumpulkan: EditMode ronde berikut + -autoshot uidev: log `[AutoShot] F6c begin: pop-up dibuang N, modal ditutup 1` dan `F6c end`, tangkapan 48–71 tanpa modal (shots.jsonl `levelup_modal` = none), 18_level_up = shown.
Cara membatalkan: `git apply -R docs/release/patches/qa05_f6c_r38w.patch` (4 berkas + meta); tangkapan yang diulang: 18_level_up, 48_home_t5_day s.d. ±71 (shop/office/decor/garage).
Bergantung pada: qa05_f6_r38h (QaT5Begin/End), qa05_f6b_r38t (QaT5End di finally), qa05_f13_r38a (QaShotSpec/QaShotLog), qa05_f9 (UiDevQa.ModalShows).
