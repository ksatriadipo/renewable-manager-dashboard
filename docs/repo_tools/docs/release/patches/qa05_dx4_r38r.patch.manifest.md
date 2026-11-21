# qa05_dx4_r38r — kait pemanggil diagnostik DX1–DX3 (Batch 0.5)

Patch: qa05_dx4_r38r
Jalur: QA/diagnostik tangkapan (Game/UI/Screens, jalur tangkapan saja)
Butir ceklist / temuan: Batch 0.5 ronde diagnostik — U2-001 (G04), U2-002 (G05), U2-004/U2-034 (G17)

Apa yang berubah: tiga baris pemanggil di jalur tangkapan, tanpa logika baru — HubHUD.WinterNightShot.cs, HubHUD.R9cShots.cs, HubHUD.AutoShot.cs:
- RenewableCEO/Assets/Scripts/Game/UI/Screens/HubHUD.WinterNightShot.cs: di akhir `Shoot`, tangkapan peta → `QaDiagDx1` + `QaDiagDx2`, tangkapan plaza → `QaDiagDx3` (kantor tidak).
- RenewableCEO/Assets/Scripts/Game/UI/Screens/HubHUD.R9cShots.cs: `R9cAt` sesudah tiap tangkapan → `QaDiagDx1` (layar 90–98, pita kuning).
- RenewableCEO/Assets/Scripts/Game/UI/Screens/HubHUD.AutoShot.cs: loop dekor/garasi → `QaDiagDx3` sesudah tiap tangkapan (67/68).
Kenapa: Batch 0.5 ronde diagnostik — DX1 (U2-001 pita kuning), DX2 (U2-002 haze malam), DX3 (G17 plaza/dekor; U2-004, U2-034). Titik panggil yang ditulis agen DX (berkas-berkas ini dimiliki F1–F12, jadi dipasang sesudahnya).
Dampak: KPI target = bukti dx_dx1/2/3.jsonl di ronde diagnostik. KPI lindung = pemain tidak berubah: setiap QaDiagDxN mengembalikan false tanpa QaCapture.On DAN `-qadiag dxN` (diuji QaDiagDx1/2/3Tests "tanpa argumen tidak menulis/mengubah apa pun"); jalur tangkapan tanpa `-qadiag` = no-op. Risiko: rendah (pemanggil saja).
Verifikasi offline: compile offline seluruh tumpukan F1–F14 + DX1–DX4 TOTAL 0 (/srv/rm/scratch/wip_b05full); git apply --cached berurutan 16 patch di atas HEAD 61e4457 OK.
Tes: QaDiagDx1Tests (3), QaDiagDx2Tests (2), QaDiagDx3Tests (2) dari dx1–dx3; compile offline seluruh tumpukan F1–F14 + DX1–DX4 = TOTAL 0.
Cara membatalkan: `git apply -R docs/release/patches/qa05_dx4_r38r.patch` (3 berkas); tangkapan yang diulang: ronde diagnostik dx.
Bergantung pada: qa05_f1…f5 (WinterNightShot `Shoot`), qa05_f6…f12 (AutoShot), qa05_dx1…dx3.
