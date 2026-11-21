# qa05_f6b_r38t — pemulihan T5 F6 di finally (Batch 0.5, temuan T8)

Patch: qa05_f6b_r38t
Jalur: QA/tangkapan (Game/UI/Screens, jalur -autoshot saja)
Butir ceklist / temuan: Batch 0.5 F6 + temuan T8 (qa05_t8_r38s: F6_AutoShot_QaT5End_HarusDiFinally "SEAM HILANG")

Apa yang berubah: satu berkas RenewableCEO/Assets/Scripts/Game/UI/Screens/HubHUD.AutoShot.cs, satu fungsi (coroutine AutoShot, blok Beranda plaza V5):
- RenewableCEO/Assets/Scripts/Game/UI/Screens/HubHUD.AutoShot.cs: badan tangkapan `home_t5_day`/`home_t5_night` dibungkus `try { … } finally { _berandaTierOverride = 0; QaT5End(qaT5); home.ForceNight = false; home.SnapNight(); }`. QaT5Begin tetap sebelum try; QaT5End hanya di finally (satu-satunya situs) ⇒ pemulihan tepat sekali. try/finally (tanpa catch) di sekitar yield sah di iterator C#.
Kenapa: T8 membuktikan bila Shot()/Select()/SnapNight() melempar, Company tertinggal di T5 (tier/level/XP/kas) dan _berandaTierOverride=5. Butir F6 (qa05_f6_r38h).
Dampak: KPI target = T8 F6_AutoShot_QaT5End_HarusDiFinally PASS; F6_* lain tetap PASS. KPI lindung = pemain tidak berubah (QaT5Begin/End no-op tanpa _qaLog = jalur tangkapan; urutan tangkapan home_t5_day/night identik pada jalur normal). Risiko: rendah — urutan pemulihan kini progres dulu lalu visual siang (sebelumnya visual dulu; tidak ada tangkapan di antaranya).
Verifikasi offline: compile offline tumpukan F1–F12 + DX1–DX4 + t8 + patch ini + qa05_dx5_r38u = TOTAL 0 (/srv/rm/scratch/wip_f6b); `patch -p1 --dry-run` kumulatif di atas pohon t8 OK; regex tes T8 dicek pada sumber (guarded = True).
Tes: QaRestoreOnExceptionT8Tests.F6_AutoShot_QaT5End_HarusDiFinally (+ F6_LemparDiBadanTangkapan…, F6_HubHUD_QaT5BeginEnd…). Hasil diharapkan: PASS. Bukti dikumpulkan: hasil EditMode T8 di ronde berikut + log `[AutoShot] F6 T5 dipulihkan` tepat sekali per -autoshot.
Cara membatalkan: `git apply -R docs/release/patches/qa05_f6b_r38t.patch` (1 berkas); tangkapan yang diulang: home_t5_day, home_t5_night.
Bergantung pada: qa05_f6_r38h (QaT5Begin/QaT5End), tumpukan F1–F12, qa05_t8_r38s.
