# B3-04 — Rekonsiliasi syarat lintas jalan (road crossing)

Tanggal: 22 Nov 2026 · Jenis: ANALISIS (tanpa perubahan kode game, tanpa Unity, tanpa commit)
Basis: game repo `/srv/rm` HEAD `7f2a937` (memuat r530, r530b, r530b2, r530c, r530f). `PowerLine15x.cs` di HEAD identik byte dengan `scratch/wip_b3_r530f/PowerLine15x.cs.keep` (DLL probe r530f = logika HEAD).

## Spesifikasi pemilik (21 Nov 2026, acuan)
Kabel mengikuti jalan/bahu; tapak kios tetapan; penghubung layanan ≤ 100 m; kabel boleh melintas jalan TEGAK LURUS di antara simpang (rentang ≤ 50 m, tiang di bahu sah di kedua sisi, ≥ 6 m dari rumah); kabel tanah di kota; margin ≤ 12 m di luar tepi kota.

## Metode
- Alat ukur baru (scratch saja, hanya baca): `/tmp/claude-0/-srv-rm-work/e4288cdc-4346-41c4-8f5d-620846f277e9/scratchpad/xing/Cross.cs` (rencanakan Goldmeadow lewat `PowerLine15x.PlanCached` persis seperti probe r530f, lalu uji tiap ruas `Path` terhadap tiap ruas sumbu jalan: perpotongan, sudut, rentang, jarak ke simpang, jarak ujung ke sumbu vs tepi jalan, jarak ujung ke rumah, di kota/tidak; plus deteksi ruas udara yang melayang di atas aspal tanpa memotong sumbu) dan `Edges.cs` (refleksi `BuildGraph` → hitung sisi graf udara yang memotong sumbu jalan). Dikompilasi terhadap DLL `scratch/wip_b3_r530f/c/out` (ref relatif dibaca dari `c/proj`, tidak ada tulis ke /srv/rm).
- Peta: `Resources/World15x/region_hq_v5.json` dan `v6.json` + `kiosk_sites_15x.json`; 16 jalan, 47 simpang sumbu, 398/403 bangunan.
- Mode: (1) 21 slot sekaligus (probe r530f), (2) hanya 3 pembangkit b3r9u (x15:3_1, 3_9, 3_10), (3) UG=0 (perencana r530c, pembanding).
- Kecocokan dengan bukti b3r9u: rute in-game identik dengan probe (3_10: tanah 132 m/udara 180 m; 3_1: 666/142; 3_9: 132/144; rentang maks 41,2 m; 2 riser), sama dengan `api_underground_length_m` / `api_max_span_m` di `b3r525_evidence.jsonl` (rekaman b3r531_*_on). Tangkapan `b3r531_cable_road_1_on.png` dilihat: tidak ada kabel udara melintas jalan di bingkai.
- Hasil v5 dan v6 identik untuk semua lintasan (beda hanya jarak rumah pada ruas tanah, tidak relevan).

## 1. Lintasan per rute

### 21 slot Goldmeadow (UG nyala, 21/21 sah)
| Jenis | Jumlah | Rincian |
|---|---|---|
| Kabel TANAH melintas/menyusur sumbu jalan | 138 kejadian (rute × jalan × titik) di 20 titik jalan unik; 15 rute campuran | 100 % di dalam kota (`InTown` = true). Sudut: 90° (120), 41° (17, simpang jalan diagonal), 76° (1). Kabel tanah mengikuti sumbu jalan, jadi "lintasan" = lewat di bawah simpang. Aturan sudut/rentang hanya untuk udara → tidak berlaku; kabel tanah di kota = disetujui. |
| Kabel UDARA melintas jalan | 1 bentang fisik, dipakai 3 rute (x15:2_10 seg2, x15:2_11 seg1, x15:3_11 seg4) | Jalan `region_17:main_ns` di (-2; 27,715), luar kota; sudut 82° terhadap sumbu (8° dari tegak lurus); rentang 23,9 m; 147,7 m dari simpang terdekat; ujung A = tiang bahu 7,0 m dari sumbu (tepi 5,5 m), ujung B = titik sambung kios tetapan 16,7 m dari sumbu (di bahu barat, ≤ tepi + 12 m); rumah terdekat 69,2 / 72,4 m. |
| Ruas udara melayang di atas aspal tanpa memotong sumbu | 0 | — |

Rute udara murni (0_11, 1_10, 1_11, 2_10, 2_11, 3_11) dan 15 rute campuran: selain bentang di atas, tidak ada lintasan udara.

### 3 pembangkit nyata b3r9u (3_1, 3_9, 3_10)
- Lintasan udara: **0**. Lintasan tanah: 22 kejadian (16 titik jalan unik), semua di kota (3_1: 14, 3_9: 4, 3_10: 4).

### UG mati (perencana r530c, pembanding)
- 6/21 sah, lintasan udara = bentang kios yang sama (3 rute), 0 pelanggaran.

## 2. Apakah perencana sekarang menghasilkan lintasan UDARA? Patuh aturan?
Ya, satu bentang (3 rute, hanya di rencana 21 slot; tidak di 3 pembangkit nyata). Bentang itu adalah ruas penghubung gardu/kios (`Connect`, ≤ 45 m), bukan hasil aturan lintas.

Cek aturan pemilik:
| Syarat | Nilai | Hasil |
|---|---|---|
| Tegak lurus ± 15° | 82° (selisih 8°) | OK |
| Di antara simpang (alat r530e: ≥ 15 m dari sumbu jalan lain) | 147,7 m | OK |
| Rentang ≤ 50 m | 23,9 m | OK |
| Tiang di bahu sah kedua sisi | sisi timur: tiang LINE 7,0 m dari sumbu (lolos PoleOk); sisi barat: terminal kios tetapan di bahu (16,7 m, di luar aspal/trotoar), bukan tiang | OK, dengan catatan: ujung barat = tapak kios tetapan yang sudah divalidasi (KioskSiteOk), setara/lebih ketat dari tiang bahu |
| ≥ 6 m dari rumah | 69,2 / 72,4 m | OK |

**Pelanggaran: 0. Tidak ada cacat produk yang terlihat.**

Catatan penegakan (laten, bukan cacat saat ini): kepatuhan di atas kebetulan, bukan dijamin kode. Di HEAD:
- `Graph.Link`, `Connect` (≤ 45 m) dan `ServiceConnect` (≤ 100 m, lurus + 1 belokan) hanya memanggil `SegWhy` (daratan, air, zona, rumah 6 m). Tidak ada cek "memotong aspal jalan", sudut, simpang, atau rentang lintas.
- Graf udara `BuildGraph` (Goldmeadow v5): 2.892 simpul, 455 sisi; **45 sisi memotong sumbu jalan, dan ke-45 berada < 15 m dari simpang** (garis lajur bahu diperpanjang melewati aspal jalan lain di simpang; mis. `main_ew` di (-1,895; 21,4), 7 m dari simpang). Dijkstra saat ini tidak memakai satu pun untuk rute Goldmeadow (0 lintasan udara selain bentang kios), tetapi pada peta lain sisi ini bisa menghasilkan lintasan udara DI simpang, yang melanggar syarat "di antara simpang".

## 3. Apakah lintasan udara DIBUTUHKAN?
- Goldmeadow: **tidak**. Dengan kabel tanah r530f semua 21 slot sah tanpa lintasan udara tambahan. Probe r530e (lintasan tegak lurus diizinkan, UG mati) tetap 6/21 dan memakai 0 lintasan: dari 816 calon hanya 15 lolos, ±680 ditolak karena tiang di sisi seberang < 6 m dari rumah (bahu jalan desa berderet rumah); potongan koridor terputus di bahu, bukan oleh jalan.
- Region lain: syarat ini **belum dijalankan sama sekali**. `kiosk_sites_15x.json` hanya punya `region_17` (Goldmeadow); region tanpa entri = fail-closed (tanpa rute). Kabel digambar hanya di `Region15xPlay.Rebuild` untuk region aktif, dan `PowerLine15x.Enabled` bawaan MATI (hanya sakelar QA r525/r531 yang menyalakan).

## 4. Kesimpulan: (a), dengan catatan penegakan untuk region berikut
- **(a) Syarat terpenuhi oleh perilaku sekarang**: semua lintasan jalan di kota lewat tanah; satu-satunya lintasan udara (bentang kios di luar kota, 3 dari 21 rute rencana, 0 dari 3 pembangkit nyata) memenuhi semua syarat; tidak ada slot yang butuh lintasan udara.
- Bukan (b): tidak ada pelanggaran terukur. Bukan sekadar (c): syaratnya sah dan disetujui, tetapi kode belum MENEGAKKANNYA, sehingga region berikut (kios tetapan baru) bisa menghasilkan lintasan udara miring, di simpang, atau di atas aspal tanpa ketahuan. Syarat tidak diturunkan dan tidak dihapus.

## Usulan (TIDAK dipasang): r530g "penjaga lintas jalan udara"
Tujuan: aturan lintas pemilik menjadi SATU-SATUNYA cara kabel udara boleh melintas aspal/trotoar, dikunci tes, tanpa mengubah rute Goldmeadow.

Lingkup (berkas `PowerLine15x.cs` + tes baru `Tests/EditMode/Game/PowerLine15xR530gTests.cs`):
1. Fungsi murni `CrossingWhy(a, b)` (dipakai ulang dari `QaCrossingWhy` r530e): bila ruas udara a–b masuk area jalan (jarak ke sumbu < `RoadLine.Edge`) → wajib memotong sumbu jalan itu, sudut 90° ± 15° (`CrossAngleTolDeg`), rentang ≤ 50 m, ≥ 15 m dari sumbu jalan lain (`JunctionClearM`), kedua ujung lolos `PoleOk` atau ujung = tapak kios/pembangkit tervalidasi, ruas ≥ 6 m dari rumah; selain itu ditolak dengan alasan (`lintas_miring`, `lintas_simpang`, `lintas_rentang`, `lintas_tiang`).
2. Panggil di `Graph.Link` (sisi udara saja; `LinkRaw` tanah tidak tersentuh), `Connect`, dan kedua kaki `ServiceConnect`. Ini membuang 45 sisi simpang di graf Goldmeadow.
3. Sakelar per perubahan `RoadCrossingGuard` (bawaan NYALA hanya bila `Enabled`; mati = HEAD persis). Sisi lintas tambahan r530e (graf lintas) TIDAK ikut. Itu tetap patch terpisah, dipasang hanya bila sebuah region terbukti membutuhkannya (probe region tersebut < N/N tanpa lintasan).
4. API baca-saja `PlannedCable.RoadCrossings` + `MaxCrossingSpanM` (dari r530e) agar alat ukur Auditor bisa menilai lintasan.

Tes (EditMode murni + probe peta nyata):
- `Crossing_TegakLurus_DiAntaraSimpang_Lolos` (90°, 30 m, 100 m dari simpang).
- `Crossing_Miring_Ditolak` (sudut 60°) dan `Crossing_Batas15Derajat` (75° lolos, 74° tolak).
- `Crossing_DiSimpang_Ditolak` (< 15 m dari sumbu jalan lain).
- `Crossing_Rentang51m_Ditolak`; `Crossing_TiangDiAspal_Ditolak`; `Crossing_TiangDekatRumah_Ditolak` (< 6 m).
- `Connect_LintasJalanMiring_Ditolak` + `ServiceConnect_LintasJalanMiring_Ditolak` (penghubung tidak lagi jadi jalan belakang).
- `Graph_TanpaSisiUdaraDiSimpang` (graf sintetis perempatan: 0 sisi udara memotong sumbu < 15 m dari simpang).
- `KabelTanah_DiKota_TidakTerpengaruh` (lintasan tanah r530f tetap boleh).
- `SakelarMati_IdentikHEAD` (rute byte-identik dengan HEAD).
- Probe Goldmeadow v5 + v6: 21/21 sah, rute identik HEAD (panjang tanah/udara, tiang, rentang maks 41,2/44,2 m), lintasan udara = 1 bentang kios (82°, 23,9 m) RULE OK, `Edges` = 0 sisi udara memotong sumbu di simpang.
- Kunci regresi: tes R520/R530/R530c/R530f tanpa perubahan + uji mutasi (matikan cek sudut → tes miring GAGAL).

Risiko: rendah. Penjaga hanya menolak sisi; probe menunjukkan rute Goldmeadow tidak memakai sisi yang akan dibuang dan satu-satunya lintasan yang dipakai lolos aturan, jadi diharapkan 21/21 identik (wajib dibuktikan probe sebelum dipasang). Biaya: cek tambahan per sisi saat bangun graf, sekali per bangun ulang yang di-cache (rencana sekarang ±260–300 ms), bukan per bingkai. Risiko sisa: region baru dengan bahu terputus bisa jadi "tanpa rute" (fail-closed, terlihat di probe) dan bukan lintasan liar; jalan keluarnya patch graf lintas r530e terpisah. Cara batal: sakelar `RoadCrossingGuard = false` atau `git apply -R`. Tangkapan yang diulang: probe v5/v6 + rekaman r531 road/boundary/kiosk.

## Berkas bukti (scratch, hanya baca terhadap repo)
`/tmp/claude-0/-srv-rm-work/e4288cdc-4346-41c4-8f5d-620846f277e9/scratchpad/xing/`: `Cross.cs`, `Edges.cs`, `cross_all_v5.txt`, `cross_all_v6.txt`, `cross_b3r9u_v5.txt`, `cross_b3r9u_v6.txt`, `cross_noug_v5.txt`, `cross_noug_v6.txt`, `edges_v5.txt` (scratchpad sesi, bisa hilang; alat dapat dibangun ulang dari kode di atas).
