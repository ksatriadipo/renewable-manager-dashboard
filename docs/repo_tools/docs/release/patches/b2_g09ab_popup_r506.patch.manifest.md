# b2_g09ab_popup_r506 — G09 g09a (B05-P2) + g09b (U1-030)

## Label manifest (format runner; isi diambil dari bagian di bawah, ditambahkan orkestrator 20 Nov 2026)
Patch: b2_g09ab_popup_r506
Jalur: Batch 2 game patch (lihat judul): b2_g09ab_popup_r506 — G09 g09a (B05-P2) + g09b (U1-030)
Butir ceklist / temuan: b2_g09ab_popup_r506 — G09 g09a (B05-P2) + g09b (U1-030)
Apa yang berubah: berkas: RenewableCEO/Assets/Scripts/Game/UI/Common/PopupOrderG09.cs, RenewableCEO/Assets/Scripts/Game/UI/Common/PopupOrderG09.cs.meta, RenewableCEO/Assets/Scripts/Game/UI/Screens/HubHUD.Missions.cs, RenewableCEO/Assets/Scripts/Game/UI/Screens/HubHUD.Quests.cs, RenewableCEO/Assets/Tests/EditMode/Game/PopupOrderG09Tests.cs, RenewableCEO/Assets/Tests/EditMode/Game/PopupOrderG09Tests.cs.meta. 
Kenapa: g09a = U37H-B05-P2: `AddDirectorXp` memicu `DirectorLeveledUp` sinkron → `QueuePopup(5, Naik level)` tampil seketika (tidak ada modal) sebelum "Misi selesai" diantre. NYALA: "Misi selesai" diantre/tampil dulu, XP sesudahnya → "Naik level!" antre di belakang dan tampil sesudah modal misi ditutup (CloseModal → ShowNextPopup). Urutan relatif XP → OnMissionStarted → SaveAll dipertahankan. g09b = U1-030: Toast ditulis ke `_modalToast` modal Tugas lama, lalu `OpenTasks()` → `OpenModal` → `CloseModal` menghancurkannya. NYALA: SaveAll → OpenTasks → Toast (masuk `_modalToast` modal baru).
Dampak: KPI target: tangkapan 16_mission1_done menunjukkan "Misi selesai" langsung (levelup_closed_before = 0); 13_quest_board_claimed menampilkan toast klaim di modal Tugas. KPI lindung: F6c/F6d precondition levelup_modal = none; urutan tutorial (OnMissionStarted, tender tutorial G01 r401); papan Tugas; r37k3/r37h4 tidak tersentuh. Risiko: (1) saat misi selesai TANPA naik level, tip/surat dari OnMissionStarted kini tiba saat modal misi sudah terbuka → diantre (dulu bisa tampil sekejap lalu disalin ulang P3 saat modal dibuka) — efek setara/lebih bersih; (2) urutan dua pop-up prioritas 5 berubah — alur yang mengandalkan "Naik level!" dulu (UnlockPacing tip) kini sesudah misi (diinginkan RCA §5); (3) g09b: Toast dalam modal baru tetap bisa disalin P3 ke `_mailQueue` bila modal lain dibuka < 2,5 dtk — butir g09c, bukan patch ini. Kunci biaya: tidak ada kode tiap-frame.
Cara membatalkan: `git apply -R b2_g09ab_popup_r506.patch` (diperiksa `-R --check` OK di atas tumpukan), atau sakelar per butir = false. Tangkapan diulang: uidev 16_mission1_done, 13_quest_board_claimed, 12_quest_board_main (a57 + small16x9); EditMode penuh.
Verifikasi offline: rcompile_ep.py TOTAL 0 (Core 0, Game 0, Core.Tests 0, Game.Tests 0, Editor 0) pada a5a9315 + r501 + r502 + r505 + r506 (pohon /srv/rm/scratch/wip_b2_g09ab/c2). `git apply --check` + apply berurutan r501 → r502 → r505 → r506 OK pada ekspor bersih a5a9315 di luar repo (scratchpad /tmp); hasil byte-identik dengan pohon yang dikompilasi; `git apply -R --check` r506 OK. Runner NUnit offline (dengan TearDown): PopupOrderG09Tests 8/8 PASS. EditMode Unity penuh + tangkapan = BELUM (ronde runner). Status: IMPLEMENTED (bukan TESTED/VERIFIED sampai EditMode Unity + tangkapan).


Batch 2, butir B2-10 bagian 1 (G09). Dasar: game a5a9315 + b2_g07a_core_r501 + b2_g08_fmt_r502 + b2_g11_cand_r505. RCA: /srv/rm/scratch/wip_b2_rca_g09/RCA_G09.md §2–§4 (hanya dua butir CONFIRMED kode). g09c/d/e TIDAK termasuk; tanpa log diagnostik.

## Apa yang berubah (berkas)
- `Assets/Scripts/Game/UI/Common/PopupOrderG09.cs` (+ .meta, BARU): kelas statis murni, dua sakelar independen + dua fungsi urutan.
- `Assets/Scripts/Game/UI/Screens/HubHUD.Missions.cs` `CheckMission`: ekor (AddDirectorXp → OnMissionStarted+SaveAll → QueuePopup "Misi selesai") dibungkus `PopupOrderG09.MissionDone(grantXp, afterXp, queueResult)`. Badan pop-up tidak berubah.
- `Assets/Scripts/Game/UI/Screens/HubHUD.Quests.cs` `ClaimQuest`: `Toast → SaveAll → OpenTasks` dibungkus `PopupOrderG09.Claimed(toast, save, reopen)`; teks toast dihitung sebelum (sama seperti dulu).
- `Assets/Tests/EditMode/Game/PopupOrderG09Tests.cs` (+ .meta, BARU): 8 tes.
- Tidak disentuh: HubHUD.cs, strings.csv, HubHUD.Map/Projects/Team/Recruit/TeamHub.cs, Fmt.cs, EquityOfferHook.cs, Core, simpanan, ekonomi, prioritas/antrean pop-up.

## Kenapa
- g09a = U37H-B05-P2: `AddDirectorXp` memicu `DirectorLeveledUp` sinkron → `QueuePopup(5, Naik level)` tampil seketika (tidak ada modal) sebelum "Misi selesai" diantre. NYALA: "Misi selesai" diantre/tampil dulu, XP sesudahnya → "Naik level!" antre di belakang dan tampil sesudah modal misi ditutup (CloseModal → ShowNextPopup). Urutan relatif XP → OnMissionStarted → SaveAll dipertahankan.
- g09b = U1-030: Toast ditulis ke `_modalToast` modal Tugas lama, lalu `OpenTasks()` → `OpenModal` → `CloseModal` menghancurkannya. NYALA: SaveAll → OpenTasks → Toast (masuk `_modalToast` modal baru).

## Sakelar (bawaan NYALA; MATI = urutan lama persis)
- g09a: `RenewableCEO.Game.UI.PopupOrderG09.MissionFirst`
- g09b: `RenewableCEO.Game.UI.PopupOrderG09.ClaimToastAfter`

## Dampak
- KPI target: tangkapan 16_mission1_done menunjukkan "Misi selesai" langsung (levelup_closed_before = 0); 13_quest_board_claimed menampilkan toast klaim di modal Tugas.
- KPI lindung: F6c/F6d precondition levelup_modal = none; urutan tutorial (OnMissionStarted, tender tutorial G01 r401); papan Tugas; r37k3/r37h4 tidak tersentuh.
- Risiko: (1) saat misi selesai TANPA naik level, tip/surat dari OnMissionStarted kini tiba saat modal misi sudah terbuka → diantre (dulu bisa tampil sekejap lalu disalin ulang P3 saat modal dibuka) — efek setara/lebih bersih; (2) urutan dua pop-up prioritas 5 berubah — alur yang mengandalkan "Naik level!" dulu (UnlockPacing tip) kini sesudah misi (diinginkan RCA §5); (3) g09b: Toast dalam modal baru tetap bisa disalin P3 ke `_mailQueue` bila modal lain dibuka < 2,5 dtk — butir g09c, bukan patch ini.
- Kunci biaya: tidak ada kode tiap-frame.

## Tes yang mungkin mengunci urutan lama (TIDAK diubah; Auditor memutuskan)
- `Tests/EditMode/Game/UiDevQaF6dTests.cs` + `UiDevQa.MissionDoneStep`/`HubHUD.AutoShotQa.QaMission1DoneStep`: fungsi murni tetap benar; dengan NYALA jalur tangkapan langsung `StepMissionDone`, `levelup_closed_before` 0 (bukan 1). Dokumentasi/komentar F6d menyebut urutan lama sebagai perilaku produk.
- `Tests/EditMode/Game/UiDevQaF6cTests.cs` (DropQueuedSince/levelup_modal precondition): tidak terdampak logika, cek di EditMode penuh.
- CampaignTests, QuestTriggerEmissionTests, Sp1QuestGuideTests, TenderNotifyU1002Tests: Core tidak disentuh; diperkirakan tetap hijau — dikonfirmasi di EditMode penuh runner.

## Cara batal
- `git apply -R b2_g09ab_popup_r506.patch` (diperiksa `-R --check` OK di atas tumpukan), atau sakelar per butir = false.
- Tangkapan diulang: uidev 16_mission1_done, 13_quest_board_claimed, 12_quest_board_main (a57 + small16x9); EditMode penuh.

## Verifikasi offline
- rcompile_ep.py TOTAL 0 (Core 0, Game 0, Core.Tests 0, Game.Tests 0, Editor 0) pada a5a9315 + r501 + r502 + r505 + r506 (pohon /srv/rm/scratch/wip_b2_g09ab/c2).
- `git apply --check` + apply berurutan r501 → r502 → r505 → r506 OK pada ekspor bersih a5a9315 di luar repo (scratchpad /tmp); hasil byte-identik dengan pohon yang dikompilasi; `git apply -R --check` r506 OK.
- Runner NUnit offline (dengan TearDown): PopupOrderG09Tests 8/8 PASS. EditMode Unity penuh + tangkapan = BELUM (ronde runner).
- Status: IMPLEMENTED (bukan TESTED/VERIFIED sampai EditMode Unity + tangkapan).
