# b3_shot44_rename_r528

Patch: b3_shot44_rename_r528
Jalur: QA tooling (definisi tangkapan uidev) — Batch 3, B3R3 fase 5
Butir ceklist / temuan: B3R1U_CAPTURE_AUDIT 44_office_mission NEEDS RECHECK — tangkapan bernama "office" tetapi skenarionya plaza Beranda + dialog misi Erina
Apa yang berubah: RenewableCEO/Assets/Scripts/Game/UI/Screens/HubHUD.AutoShot.cs — nama tangkapan `office_mission` → `beranda_mission_dialog` + komentar definisi; urutan langkah, kamera, skenario, dialog tidak diubah.
Kenapa: langkah menjalankan `_interior = false; Select("office")` (tab Beranda/distrik) lalu memotret dialog misi Erina; nama lama berasal dari masa tab kantor = distrik dan membuat audit mengira interior kantor hilang. Owner B3R3: perbaiki definisi + nama, jangan paksa kamera kantor.
Dampak: KPI target: tangkapan 44 bernama `44_beranda_mission_dialog` dengan isi identik dengan b3r1u `44_office_mission` (plaza + dialog Erina). KPI lindung: nomor tangkapan lain tetap (00–98), perilaku kamera kantor r523 tidak disentuh. Risiko: pembanding judge/uidev per nama kehilangan baseline untuk tangkapan ini satu ronde (dipetakan manual 44_office_mission → 44_beranda_mission_dialog).
Cara membatalkan: git apply -R b3_shot44_rename_r528.patch; ulang tangkapan uidev A57 + small16x9.
Verifikasi offline: git apply --check di atas ekspor bersih HEAD ea0be34 + r525 (di luar repo) = OK; satu string literal + satu komentar, tanpa simbol baru (tidak memengaruhi compile).
