# qa_b1_wnwarm_r408 — Auditor: kriteria Winter malam per zoom (redefinisi FAR sesuai keputusan user)

Patch: qa_b1_wnwarm_r408          Jalur: Q (alat ukur Winter malam, jalur tangkapan saja) + tes EditMode Game          Butir ceklist / temuan: U2-001 lanjutan (warm FAR b1r1 FAIL 0,006 %), B05 DX1 (pita Map Grid Tender = PASS palsu warm FAR b05f)
Jenis: alat ukur (pemilik: Auditor). Tidak ada perilaku pemain yang berubah. Basis: /srv/rm/RenewableCEO @ 6818d75 (b1r2). Tidak bertumpang berkas dengan b1_* / qa05_f17d_r405.

## Dasar keputusan user (19 Nov 2026, kutipan)
"FAR: tidak perlu menampilkan glow setiap rumah. Cukup mempertahankan atmosfer malam dan siluet permukiman. MID: cahaya permukiman boleh mulai terlihat sebagai agregasi yang halus. CLOSE: jendela rumah dan lampu infrastruktur memperlihatkan sumber cahaya yang nyata. Jadi jangan mengejar PASS dengan menambahkan cahaya palsu di FAR."

Ini REDEFINISI, bukan pelonggaran: syarat lama "FAR warm >= 0,10 %" (KPI C5/H7 era hex r9c, FINAL_BUILD_PROGRESS.md:614,772; tidak pernah dikalibrasi dari 165) mengukur hal yang menurut keputusan user tidak diwajibkan, dan justru memberi PASS palsu ke pita kuning artefak (b05f 0,27 %). Ia DIGANTI oleh tiga pemeriksaan terukur yang mewakili kalimat keputusan (atmosfer, siluet permukiman, tanpa cahaya palsu). Semua pemeriksaan lain tetap atau lebih ketat: meanL FAR 40–85 tetap; white maks tetap; warm min MID 0,25 % dan BUILD/plaza 0,50 % tetap; anti-artefak BARU di MID dan BUILD.

## Isi
Apa yang berubah: berkas: RenewableCEO/Assets/Scripts/Game/Diagnostics/WinterQa.cs, RenewableCEO/Assets/Scripts/Game/UI/Screens/HubHUD.WinterNightShot.cs (hanya target + vonis + metrik log), RenewableCEO/Assets/Tests/EditMode/Game/WinterQaNightZoomTests.cs (baru).
- WinterQa.cs: `FrameStats` + `Measure(Color32[], w, h)` murni: meanL, white %, warm % (C5a sama persis), **gumpal hangat terbesar** (komponen 8-tetangga, % bingkai), **L latar** = median L cincin tepi 4 %, **siluet** = % piksel |L − latar| >= 24, **detail siluet** = simpangan baku L piksel siluet. `Judge(name, kind, FrameStats, …)` baru; `Judge(L, wh, wa, …)` lama = overload (gumpal/siluet tak terukur ⇒ FAR FAIL "tak terukur"; build/mid perilaku lama). `AddNightZoomMetrics(spec, kind, tod)`: metrik wajib `warm_blob_pct` (peta malam build/mid/far) + `silhouette_pct`, `silhouette_det` (FAR); hilang ⇒ QaShotLog FAIL. Kunci kanonik spec tidak berubah. White < 0 (tak terukur) kini FAIL.
- HubHUD.WinterNightShot.cs: `WinterNightTarget`: `WarmFar` (min) dihapus; baru `WarmFarMax 0,10`, `BlobFarMax 0,02`, `BlobMidMax 0,10`, `BlobBuildMax 0,18`, `SilFarMin 4,5`, `SilDeltaL 24`, `SilDetFarMin 7`. `WinterVerdict` memakai `WinterQa.Measure`; `WinterStats` lama (duplikat) dihapus. `Shoot`: spec peta + `AddNightZoomMetrics`, metrik baru dicatat ke QaShotLog.
- Tidak disentuh: Region15xPlay, RegionMapBuilder, HazeNight15x, TenderGrid15x, QaShotLog, PerfShot, NightLodShot (punya `NightLodTarget.WarmFar` sendiri — di luar lingkup, lihat Risiko).

Sakelar: tidak ada (alat ukur QA, sesuai B1_AGENT_RULES); hanya jalur tangkapan Winter (-autoshot/-wintershot), build pemain tidak memanggilnya.

## Kriteria baru per zoom (vonis peta malam)
| zoom | meanL | warm | gumpal hangat maks | siluet | lain |
|---|---|---|---|---|---|
| FAR | 40–85 (tetap) | **maks 0,10 %** (dulu min 0,10) | **0,02 %** | **>= 4,5 % dan detail >= 7** | white maks 0,30 tetap |
| MID | 80–112 (tetap) | min 0,25 % (tetap) | **0,10 %** (baru) | – | |
| BUILD (peta + HQ) | 80–112 (tetap) | min 0,50 % (tetap) | **0,18 %** (baru) | – | |
| plaza / office / day | tetap | tetap | – | – | |

Turunan ambang (diukur ulang dengan definisi yang sama, skrip /srv/rm/scratch/wip_b1_wnaud/ana/wn.py):
- Cahaya nyata FAR b1r1: warm 0,006 %, gumpal 7 px = 0,0005 %; varian DX1 lamps_off/both_off 0,001 %. Pita palsu: b05f 0,270 % / gumpal 0,099 %; u37h 0,319 % / 0,100 %; u36f 0,384 % / 0,062 %. ⇒ warm maks 0,10 (16× cahaya nyata, ≤ 37 % pita terkecil), gumpal maks 0,02 (40× nyata, ≤ 1/3 pita terkecil 0,062).
- MID: nyata b1r1 gumpal 0,025 % (semua varian DX1); pita b05f 0,236 % ⇒ maks 0,10 (4× nyata, 2,4× di bawah pita).
- BUILD: nyata b1r1 build 0,115 %, nosnow 0,118 %, HQ 0,120 %; pita u37h build/HQ 0,220 %, b05f HQ 0,513 % ⇒ maks 0,18 (1,5× nyata, 18 % di bawah pita terkecil).
- Siluet FAR b1r1: 9,05 % (both_off 9,04 %), detail 15,5 (both_off 14,3); latar L 41. ⇒ min = ½ nilai valid: siluet 4,5 %, detail 7. Lempeng yang tenggelam di gelap (|ΔL| < 24) atau rata tanpa rumah ⇒ FAIL.

## Tabel sebelum/sesudah (a57; small16x9 b05f identik untuk FAR)
| tangkapan | ukuran (L / warm / gumpal / siluet,det) | vonis lama | vonis baru | sebab baru |
|---|---|---|---|---|
| b05f wn_map_far_night | 204,3 / 0,27 / 0,099 / 9,2,28,0 | FAIL (L) — warm "ok" = PASS palsu | FAIL | L; warm > 0,10; gumpal > 0,02 |
| b05f wn_map_mid_night | 141,9 / 1,56 / 0,236 | FAIL (L) | FAIL | L; gumpal > 0,10 |
| b05f wn_map_build_night | 117,4 / 1,30 / 0,115 | FAIL (L) | FAIL | L |
| b05f wn_map_build_night_nosnow | 114,8 / 1,37 / 0,118 | FAIL (L) | FAIL | L |
| b05f wn_map_hq_night | 123,3 / 3,58 / 0,513 | FAIL (L) | FAIL | L; gumpal > 0,18 |
| b05f build_day / plaza / office | – | PASS / FAIL / FAIL | sama | tidak berubah |
| b1r1 wn_map_far_night | 47,1 / 0,006 / 0,0005 / 9,05,15,5 | FAIL (warm min 0,10) | **PASS** | redefinisi FAR (atmosfer + siluet, tanpa artefak) |
| b1r1 wn_map_mid_night | 91,6 / 0,76 / 0,025 | PASS | PASS | |
| b1r1 wn_map_build_night | 105,1 / 1,30 / 0,115 | PASS | PASS | |
| b1r1 wn_map_build_night_nosnow | 102,5 / 1,37 / 0,118 | PASS | PASS | |
| b1r1 wn_map_hq_night | 110,0 / 2,69 / 0,120 | PASS | PASS | |
| b1r1 build_day / plaza / office | – | PASS / FAIL / FAIL | sama | plaza/office tetap PRECONDITION (G17) |
Semua tangkapan yang dulu "lolos warm" karena pita (b05f/u37h/u36f FAR, b05f MID/HQ) FAIL di kriteria baru bahkan bila L diperbaiki (tes negatif dengan angka nyata). b1r1 total fails Winter diharapkan 3 → 2.

## Dampak
Kenapa: keputusan user 19 Nov 2026 (visual malam per zoom: FAR tanpa glow rumah individual, atmosfer + siluet; MID agregasi halus; CLOSE sumber cahaya nyata) + bukti DX1 b05f (warm FAR 0,27 % = pita Map Grid Tender = PASS palsu) dan b1r1 (FAR 0,006 % benar tapi FAIL oleh KPI hex r9c yang tak dikalibrasi 165).
Dampak: KPI target: FAR dinilai sesuai keputusan user (tanpa insentif menambah glow palsu); pita/blok hangat terdeteksi di FAR/MID/BUILD. KPI lindung: L/white/warm-min MID & BUILD tidak diubah; plaza/office/day tidak diubah; precondition QaShotLog tidak diubah (hanya metrik wajib bertambah); kunci spec (deteksi duplikat) tidak berubah; build pemain tidak berubah, tanpa gameplay/ekonomi/simpanan/kamera.
Risiko: (1) ambang gumpal BUILD 0,18 hanya 1,5× di atas nyata — fasad terang besar baru di zoom bangun bisa FAIL; bila terjadi, Auditor menilai dari gambar (ragu = FAIL) dan mengkalibrasi ulang dengan bukti, tidak dilonggarkan diam-diam. (2) Siluet memakai cincin tepi sebagai latar: bila lanskap sekitar (r37k) mengisi tepi bingkai FAR, latar = lanskap — tetap bermakna (permukiman vs sekitar), tetapi perlu dicek di ronde lanskap. (3) Biaya ukur: flood-fill 1,44 Mpx per tangkapan (hanya jalur tangkapan, bukan per-frame). (4) `NightLodTarget.WarmFar` (HubHUD.NightLodShot.cs:25, tangkapan nl_far_night) masih memakai warm-min FAR lama — di luar kepemilikan patch ini; usulan butir lanjutan Auditor. (5) HubHUD.Winter.cs:97 (`met.Append(WinterVerdict(...))`, jalur -wintershot hex lama) menambahkan struct ke StringBuilder (cacat lama, tidak diubah).

Cara membatalkan: `git apply -R docs/release/patches/qa_b1_wnwarm_r408.patch` (tanpa ketergantungan di atasnya). Tangkapan yang diulang: job tests + uidev a57 & small16x9 winter_night.

Tes: WinterQaNightZoomTests (17): positif — Far_B1r1_AtmosferDanSiluet_Pass_TanpaWarmMinimum, Far_WarmNol_TetapPass, Mid_B1r1_Pass_WarmMinTetap (+ negatif warm 0,20), Build_B1r1_Pass (build + HQ), Build_UkuranLama_PerilakuLamaTetap, Measure_LempengMalam_SiluetTerbaca, NightZoomMetrics (kunci kanonik tetap); negatif — Far_B05f_PitaGridHex_Fail, Far_PitaSaja_DiBingkaiGelap_TetapFail (b05f/u37h/u36f, warm saja, gumpal saja), Far_SiluetHilangDiGelap_Fail, Far_AtmosferTerlaluTerangAtauGelap_Fail, Far_UkuranLamaTanpaSiluet_Fail, Mid_PitaB05f_GumpalBesar_Fail, Build_WarmMinTetapKetat_DanPitaFail, Measure_TitikLampuKecil_GumpalKecil_PitaGumpalBesar, Measure_LempengSewarnaLatar_SiluetHilang_FarFail, Measure_InputRusak_TakTerukur_Fail. Tes lama WinterQaTests/F1b/F4b tidak diubah dan tetap berlaku (spec kanonik tidak berubah).
Verifikasi offline: /srv/rm/scratch/wip_b1_wnaud; rcompile_ep.py TOTAL 0 (Core 0, Game 0, Core.Tests 0, Game.Tests 0, Editor 0). `git -C /srv/rm apply --check` = OK. EditMode belum dijalankan di Unity (orkestrator).

## Bukti yang dikumpulkan
- Job tests: WinterQaNightZoomTests 17/17 + WinterQaTests/WinterQaF1bTests/WinterQaF4bTests tetap hijau.
- uidev a57 + small16x9 winter_night/metrics.txt: wn_map_far_night baris memuat `blob=` dan `sil=… det=…`; diharapkan PASS bila gambar seperti b1r1 (malam gelap, lempeng terbaca, tanpa pita); mid/build/hq memuat `blob=` dan tetap PASS; shots.jsonl memuat metrik warm_blob_pct (+ silhouette_pct/_det untuk far), tidak ada "metrik wajib hilang". Auditor melihat wn_map_far_night.png sebelum menerima PASS (vonis angka tanpa gambar = belum diterima).
