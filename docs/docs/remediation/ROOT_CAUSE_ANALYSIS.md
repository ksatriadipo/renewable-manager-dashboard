# ROOT CAUSE ANALYSIS — U37H (Batch 0)

119 temuan dari audit 18 Nov dipetakan oleh dua agen RCA (U1: 22 akar masalah, U2: 12) dan satu agen arsitektur. Dokumen ini menyatukannya menjadi **22 akar masalah global (G01–G22) + G00 (belum terverifikasi)**, sehingga satu akar masalah punya satu solusi. Tidak ada kode yang diubah. Rincian per temuan: MASTER_REMEDIATION_BACKLOG.md; mentah: rca_u1.json/md, rca_u2.json/md, ARCHITECTURE_DISCOVERY.md.

## 1. Klasifikasi

| Jenis | Jumlah | Arti |
|---|---|---|
| PRODUCT | 103 | game salah; diperbaiki di kode/data |
| CAPTURE | 11 | foto tidak memperlihatkan keadaan yang dimaksud; diperbaiki di alur tangkapan (G22), bukan di game |
| MEASUREMENT | 1 | alat ukur salah (detektor rumah/pohon, metrics winter); diperbaiki Auditor |
| UNVERIFIED | 2 | belum pasti produk atau tangkapan |
| DECISION CONFLICT | 2 | bertentangan dengan keputusan terkunci; butuh keputusan user |

Tes otomatis lolos ≠ diterima visual ≠ tervalidasi di HP: ketiganya dicatat terpisah di status backlog.

## 2. Akar masalah global

| RC | Akar masalah | Area | RC agen digabung | Batch | Temuan (blocker/major) |
|---|---|---|---|---|---|
| G22 | Alat tangkapan/ukur: alur tidak mencapai/memverifikasi state, penghitung dunia lama, zoom terjepit, tanggal tak maju | Tangkapan/pengukuran | RC-U1-06, RC-U1-22, RC-U2-03, RC-U2-04 | 0 | 13 (0/5): U1-017, U1-018, U1-019, U1-039, U1-063, U2-003, U2-005, U2-006, U2-016, U2-023, U2-027, U2-052, U2-055 |
| G01 | Notifikasi/papan tender tidak berasal dari satu state ketersediaan; urutan kartu | Gameplay/state | RC-U1-02 | 1 | 3 (1/2): U1-002, U1-003, U1-004 |
| G02 | Pilih HQ 15x tanpa petak rekomendasi -> panel kosong | UI/state | RC-U1-01 | 1 | 1 (1/0): U1-001 |
| G03 | DialogLog statis berisi teks jadi, tidak pernah dibersihkan/dipisah per sesi | State/lokalisasi | RC-U1-03 | 1 | 1 (1/0): U1-035 |
| G04 | Lapisan hex lama (outline tender emas, tint sel, kubus lampu) digambar di dunia 15x | Rendering | RC-U2-01, RC-U1-05 | 1 | 5 (1/3): U1-010, U2-001, U2-011, U2-012, U2-036 |
| G05 | Malam tidak terikat satu state siang/malam: bidang kabut 15x tak bereaksi malam | Rendering | RC-U2-02, RC-U1-17 | 1 | 3 (1/1): U1-015, U1-016, U2-002 |
| G06 | Teks pemain berisi istilah internal/Inggris (hex, nama lembaga, cabang skill) | Lokalisasi | RC-U1-04, RC-U1-09, RC-U2-06 | 2 | 13 (0/10): U1-005, U1-006, U1-008, U1-009, U1-032, U1-033, U1-034, U1-037, U2-015, U2-020, U2-021, U2-022, U2-038 |
| G07 | Angka keuangan/data tampilan dari sumber berbeda per layar (anggaran, pendapatan, nama region, tahap) | Ekonomi/data | RC-U1-11, RC-U1-12, RC-U2-08 | 2 | 14 (0/7): U1-022, U1-024, U1-025, U1-043, U1-044, U1-046, U1-049, U1-060, U2-013, U2-014, U2-028, U2-039, U2-044, U2-047 |
| G08 | Format Koin tidak tunggal; "$" sengaja di build penguji (keputusan 8 Nov) | Ekonomi/keputusan | RC-U1-10, RC-U2-12 | 2 | 2 (0/0): U1-031, U2-056 |
| G09 | Panduan, toast, pesan Erina tidak di-invalidasi saat state berubah | Gameplay/UI | RC-U1-08 | 2 | 5 (0/3): U1-012, U1-014, U1-029, U1-030, U1-051 |
| G10 | Skor survei -> bintang tidak tersambung | Data | RC-U1-13 | 2 | 3 (0/1): U1-040, U1-041, U1-042 |
| G17 | Jalur kantor/lantai dan gerbang HQ lama masih aktif di 15x tanpa interior | Gameplay/HQ | RC-U2-05 | 3 | 2 (0/2): U2-007, U2-008 |
| G18 | Visual daya placeholder: kabel lurus ke kubus gardu, kubus kuning per rumah | Rendering/infrastruktur | RC-U2-07 | 3 | 1 (0/1): U2-010 |
| G19 | Peta pulau 15x: perlakuan region terkunci + sorotan kabut tender | UI/peta | RC-U1-20 | 3 | 1 (0/1): U1-045 |
| G11 | Jumlah kandidat dari filter berbeda | Gameplay/data | RC-U1-15 | 4 | 2 (0/1): U1-026, U1-028 |
| G20 | Monetisasi tidak di balik sakelar sesuai keputusan (pass musim, tab Gratis IG64a, pesan kuota) | Monetisasi | RC-U2-11 | 4 | 3 (0/2): U2-026, U2-029, U2-030 |
| G16 | Kamera Beranda/foto tidak menyasar HQ/pembangkit; tepi dunia/void dan kamera diorama terpisah | Rendering/kamera | RC-U1-07, RC-U1-16 | 5 | 5 (0/3): U1-013, U1-020, U1-036, U1-057, U1-061 |
| G21 | Skala tokoh vs properti; objek melayang | Seni | RC-U1-21 | 5 | 1 (0/0): U1-038 |
| G12 | Spesifikasi komponen kartu tidak ditegakkan (satu tombol utama, slot aksi, seni vs aksi) | UI | RC-U1-14 | 6 | 9 (0/1): U1-021, U1-023, U1-027, U1-047, U1-048, U1-050, U1-058, U1-059, U1-062 |
| G13 | Ukuran kontainer, safe area, anchor responsif tidak diterapkan di sebagian overlay/strip | UI | RC-U1-19, RC-U2-10 | 6 | 12 (0/3): U1-007, U1-054, U1-055, U2-019, U2-025, U2-033, U2-035, U2-037, U2-040, U2-048, U2-053, U2-054 |
| G14 | Lapisan overlay/toast/badge tanpa slot tetap | UI | RC-U1-18 | 6 | 4 (0/1): U1-011, U1-052, U1-053, U1-056 |
| G15 | Token warna Tema E: label putih di hijau/mint dan toggle aktif gagal kontras | UI/desain | RC-U2-09 | 6 | 6 (0/3): U2-032, U2-042, U2-043, U2-045, U2-049, U2-051 |
| G00 | Akar masalah belum terverifikasi: perlu tangkapan diagnostik/jalan Editor sebelum diperbaiki | Diagnosis | - | 0 | 10 (0/2): U2-004, U2-009, U2-017, U2-018, U2-024, U2-031, U2-034, U2-041, U2-046, U2-050 |

## 3. Rekonsiliasi antar agen (satu solusi per akar masalah)

- **U2-001 pita kuning.** Agen U2 menunjuk outline tender hex lama `Map Grid Tender` (`HubHUD.Slots.cs:161-180`, menyala di Peta biasa `:348`) + tint sel hex + kubus lampu rumah unlit (`Region15xPlay.cs:224-235`). Agen arsitektur menyebut tiga kandidat (cakram glow malam, outline tender lama, lanskap r37k3) dan menandainya UNVERIFIED. Keputusan: hipotesis utama = G04 (lapisan hex lama); langkah pertama Batch 1 = tangkapan diagnostik dengan tiap lapisan dimatikan bergantian untuk membuktikan lapisan mana sebelum mengubah kode. r37k3 hanya aktif di region pilot dengan argumen baris perintah, jadi bukan penyebab di tangkapan uidev (bawaan mati) — dibuktikan di tangkapan yang sama.
- **U2-002 + U1-016 malam.** Kedua agen sepakat: tidak ada pemilik tunggal latar/langit. Agen U2: bidang kabut 15× berwarna tetap (`RegionMapBuilder.cs:641-646`) menutupi latar kamera; warna malam kamera (`NaturePilot.cs:72-75`) tidak pernah terlihat. Agen arsitektur: fase malam dihitung dua kali (`NaturePilot.FromHour` dan `NightGrade.IsNight`). Satu solusi (G05): kabut 15× ikut shading malam yang sama dengan tepi pulau, memakai satu fungsi fase (NightGrade/NaturePilot disatukan sebagai pembacaan, bukan pengendali baru).
- **U1-002 papan Tender.** Terverifikasi: tender tutorial + suratnya dibuat saat boot (`Region15xPlay.cs:70-77` → `Company.X15EnsureFirstTender`, surat `HubHUD.Missions.cs:273-274`) tanpa memeriksa gerbang papan Lv 3; kartu D1 selalu ditambahkan pertama (`HubHUD.Projects.cs:93`). Belum terverifikasi: kenapa kartu tender ada di pohon UI tetapi tidak tergambar di layar 19 — perlu log worldBound/opacity per kartu di uidev sebelum diperbaiki.
- **Istilah hex/Inggris (G06)** digabung dari tiga RC agen; satu perbaikan lewat strings.csv + pipeline loc, bukan per layar.
- **Data/keuangan (G07)** digabung dari RC-U1-11/12 dan RC-U2-08: satu lapisan baca (sumber tunggal) untuk anggaran, pendapatan, nama region, tahap.
- **Alat tangkapan/ukur (G22)** digabung dari empat RC: diperbaiki di alat (uidev/x15shot/WinterNightShot/detektor), milik Auditor, dan wajib selesai sebelum tangkapan dipakai sebagai bukti VERIFIED.

## 4. Sumber kebenaran tunggal (dari ARCHITECTURE_DISCOVERY §4.1)

| Sistem | Berwenang hari ini | Ganda | Risiko |
|---|---|---|---|
| Lokasi HQ | Dua field simpanan hex (`Company.HqTile`, `Profile.hq`); posisi HQ 15× dari data RegionPlan (tidak disimpan) | Zona HqSite hex | Id hex menggerakkan logika HQ 15× |
| Visual HQ | Kampus `HqSite` (dinyatakan sumber kebenaran di `SingleHq15x.cs:12-25`) | HQ T1 terbakar di RegionMapBuilder, HqStageView15x | Dua HQ (sudah diatasi r37d/h2/h4 hanya di pilot, sakelar mati) |
| Peta | `PetaTabOld15x` + `IslandMapOld15x` | IslandWorld15x, IslandMapV2, IslandMapView, IslandMap15x, peta hex | 6 jalur peta |
| State region | Core `RegionState` → `World15xSave` | `RegionUi15x` (UI) | UI dan Core bisa berbeda |
| Waktu/malam | `Company.GameHours`; fase dihitung dua kali | HomeDistrict, OfficeWall, Sun15x, WorldTone, ShotDaylight15x, WinterWorld | Latar/langit tanpa pemilik (U2-002) |
| Tender | `Company.Tenders` | Surat/toast dibuat saat tender dibuat | Notifikasi tidak dari state papan (U1-002) |
| Teks Koin | `Fmt.Coins/CoinLabel` | 42 tempat ad-hoc | Simbol/angka tidak konsisten |

Temuan struktural besar: scene game sebenarnya `WorldSlice.unity` tidak ada di Build Settings (build memakai daftar scene sendiri — dicek di Batch 1 sebelum menyentuh build), 159 partial HubHUD, ±593 static yang bisa berubah. Konsolidasi besar TIDAK diusulkan di Batch 1; hanya sumber state yang langsung menyebabkan blocker.

## 5. Keamanan patch r37k3 + r37h4

Keduanya terpasang (tes 2207/0, 2212/0) dan hanya aktif untuk region pilot 17/13 lewat argumen baris perintah; pemain tidak melihatnya. Agen arsitektur mencatat keduanya **tidak murni aditif**: r37k3 mengubah parameter kabut Apron, r37h4 mengganti FitBounds dengan UnitBounds, dan `SingleHq15x.LandmarkOn` bawaan true di bawah sakelar induk yang mati. "Sama persis saat mati" belum dibuktikan saat runtime. Aturan Batch 1: (a) tidak ada patch Batch 1 yang menyentuh berkas/fungsi r37k3/r37h4 tanpa disebut di manifest; (b) U2-002 menyentuh `RegionMapBuilder` (kabut) — fungsi yang sama dipakai r37c/r37k3, jadi patch-nya wajib membuktikan tampilan siang pilot berubah ≤ ±3 meanL dan lolos tes r37k3; (c) tangkapan dasar sakelar-mati dipakai sebagai bukti bahwa mati = U37H.

## 6. Konflik dengan keputusan terkunci (butuh keputusan user)

| Temuan | Rekomendasi audit | Keputusan yang berlaku | Usulan |
|---|---|---|---|
| U1-032, U1-033 | Terjemahkan nama lembaga (Energy Ministry, Electricity/Environmental Agency) | 2 Nov: nama lembaga tetap Inggris di build ID | Minta keputusan: tetap Inggris atau pakai nama fiktif Indonesia |
| U1-037 | Ganti nama tempat | Nama fiktif berlaku | Cek konsistensi saja |
| U1-031, U2-056 | Hapus "$" untuk Koin | 8 Nov: "$" sengaja di build penguji (`Fmt.cs:36-48`), "Koin" di build soft launch | Minta keputusan apakah build penguji ikut "Koin" |
| U2-026 | Sembunyikan pass musim | 16 Nov: pass musim ditunda | Sejalan: sakelar bawaan mati (bukan konflik, wajib dikerjakan) |
| U2-030 | Tombol iklan gratis | IG64a: tombol iklan Toko dibiarkan + 8/hari | Sejalan; pastikan tab Gratis menampilkannya |
| U2-049 | Kontras tombol hijau | Token Tema E | Perubahan token butuh lembar sebelum/sesudah ke user |

## 7. Rincian blocker (dari agen RCA)

### U1-001 HQ pick: right panel empty (RC-U1-01, verified in code)
- Path: `HubHUD.cs:161` with 15x on uses `_zones = Region15xPlay.Zones()`. `Region15xPlay.cs:47-53` builds the Tiles **without `reco`**.
- `HubHUD.Onboarding.cs:476-478`: `_sheet` (`.pick-sheet`, a styled box) is added, then `SelectTile(reco)` runs with `reco == null`. `SelectTile` returns at its first guard (`:483`), so the box stays visible and empty.
- Side effect: `Zones()` builds a hexagon `b[]` for square cells, so `DrawOutline` draws a hex outline.
- Smallest fix:
  1. In `Zones()`, set `reco = true` on `Grid.HqCell`, or on the nearest `HqPickable` cell that has lots.
  2. In `ShowHqPick`, fall back to the first pickable tile, and keep `_sheet` at `display:None` until it has content.
  3. Make the outline square for 15x.
- Files: `Game/World/X15/Region15xPlay.cs`, `Game/UI/Screens/HubHUD.Onboarding.cs`.
- Save risk: none. `profile.hq` still stores the cell id, and `BuildHq` puts the HQ at the plaza anyway (`SingleHq15x.PlazaGroundOr`, `:632`).
- Tests:
  - EditMode: `Zones()` returns exactly 1 reco, and `HqPickable(reco)` is true.
  - uidev assertion: `.pick-sheet` childCount > 0 at 05 on a57 and small16x9.
- Open question for the user: in 15x the HQ always lands on the plaza, so "pick" could become a confirm step ("Dirikan di sini").

### U1-002 tender board empty while a toast says a tender opened (RC-U1-02, partly verified)
- The tutorial tender and its mail are created at boot: `Region15xPlay.Attach` → `Company.X15EnsureFirstTender` (`Region15xPlay.cs:70-77`, mail `mail.tutorial_tender`). This happens even though the board only opens at Lv 3, so the notification is not tied to availability. The HUD mail toast then stays the same from 07 to 21 (stale).
- `BuildTenders` (`HubHUD.Projects.cs:47-107`): the tutorial tender passes `TenderLevelOk` (`Company.Small.cs:79`, `t.Tutorial`). The D1 wide card is **always added first** (`:93`), the tender list comes after it, and the Lv 5 lock card comes last.
- Evidence that the card exists but is not drawn at 19:
  - The `audit.jsonl` text-size counts for 19 and 21 are identical, so the tender card's text is in the tree.
  - The scroll thumb at 19 shows content about 2.5x the viewport height.
  - Yet nothing is drawn under the D1 card. At 21 (Evaluating) the card shows, but below the D1 card and cut off.
- The exact mechanism is **UNVERIFIED**. The suspects are the CardGrid opacity/width gating (`Common/Kit.cs:180-200`) and the wide-row layout.
- Smallest fix:
  1. Add a diagnostic log line per tender card (worldBound inside the viewport, opacity > 0) in the uidev run to pin the mechanism.
  2. Order cards: Won/Evaluating/Open actionable → D1 → locked.
  3. Post `mail.tutorial_tender` and its toast only when `TenderBoardOpen` (or at the Lv 3 level-up), so every notification maps to a visible card with an enabled "Ajukan" button.
- Files: `HubHUD.Projects.cs`, `Region15xPlay.cs`/`Company.Tutorial15x.cs` (mail timing), possibly `Kit.cs` CardGrid.
- Save risk: none. Saves with an already-posted mail keep their mail, and tender state is unchanged.
- Tests:
  - EditMode: board-order test, and a test that no tender mail goes out while the board is locked.
  - uidev assertion per card at 19/21 on both profiles.
- The IG64a ad buttons are not involved.

### U1-035 dialogue history: English, mixed sessions, wrong order, truncated (RC-U1-03, verified)
- Cause:
  - `Core/Progress/DialogControls.cs:17-38`: `DialogLog` is a **static** list of already-translated strings, scoped to the process.
  - `Clear()` has **0 callers**.
  - The writers are `HubHUD.Intro.cs:402`, `HubHUD.NamedNpcs.cs:181` and `HubHUD.Tips.cs:329`.
- What the capture shows:
  - Tip `tip.g.m_2` was logged during the EN pass (`81_tenders_en`, player.log:302). Its de-duplication key is per language, so the English text stays in the list.
  - The intro then replays in the same process (player.log:589+), so its lines appear after the English tip.
  - The order is chronological per process. The "wrong order" is cross-session leakage, not sorting.
  - "besar." is the tail of an earlier item clipped at the top of the ScrollView after the auto-scroll to the bottom (`Kit.DialogControls.cs:187`). It is a viewport clip, not data truncation.
- Smallest fix:
  - Store `(speakerKey, textKey, args)` and translate when the log opens.
  - Call `DialogLog.Clear()` at intro start (`ShowIntro`), new game and save load.
  - Optionally tag lines with a session id.
  - Add a top fade or scroll affordance.
  - Capture flow: run the intro in a fresh session (also fixes U1-039).
- Files: `DialogControls.cs`, `HubHUD.Intro.cs`, `HubHUD.Tips.cs`, `HubHUD.NamedNpcs.cs`, `Kit.DialogControls.cs`, plus the new-game/load hook.
- Save risk: none. `DialogLog` is not saved.
- Tests:
  - EditMode: clear on intro, new game and load; switching language re-renders the lines in the new language.
  - uidev: `intro_a3_id_log` after an EN pass contains no EN text.

## 1. Blocker U2-001: yellow glow bands
**Layer:** `Map Grid Tender`, built by `HubHUD.BuildMapGrid()` (`Game/UI/Screens/HubHUD.Slots.cs:161-180`) through `SoftFieldQuad` (`HubHUD.SoftRegions.cs:27`).
- It is a Sprites/Default texture quad at render queue 3000. It is unlit and transparent, and sits at ground height + 0.06.
- Its rim colour is (0.98, 0.80, 0.32, 0.85) and its fill is gold at 16 % alpha.
- It is built from the legacy hex tiles (`ZoneTileOf`, `HexRadius*1.75`) of every tender with `Status <= Developing`. The enum order (`RegionTender.cs:37`) is Open, Evaluating, Won, Lost, Expired, Developing, so Lost and Expired tenders also count.

**When it shows:** `UpdateMapGrid` (`Slots.cs:348`) turns it on whenever `_screen=="map" && HqOverlayVisible && !PhotoClean`. That is always true in normal Peta play. Because the quad is unlit, night grading does not touch it, which is why it reads as a highlighter band at night. It is also drawn above ground-mounted PV, which washes out the panels (U2-011, U2-012).

**Other glow sources:**
- The green blob over the 50 kWp plant comes from `BuildSelection`: the `_gridSelect` disc plus the green res-8 `_gridCells` at build zoom.
- The yellow dots on streets and roofs come from `Region15xPowerView.Rebuild` (`World/X15/Region15xPlay.cs:224-235`). It draws an Unlit/Color cube (1, 0.86, 0.45) for each lit house, day and night.

**Smallest consistent fix (one patch, with a switch):**
1. Filter to actionable states only: Open, Evaluating and Developing.
2. Show the outline only in tender/network context (tender sheet or slot picker open, or a tender selected).
3. Under World15x, build the outline from the 15x region cells instead of the legacy zone tiles.
4. Use a thin rim (alpha ≤ 0.35) that is drawn under PV and multiplied by night.
5. Gate the lit-house cubes on `_NightAmount`, or remove them.

**Files:** `HubHUD.Slots.cs`, `HubHUD.SoftRegions.cs`, `Region15xPlay.cs`.

**Risks:** the tender outline (captures 19, 20, 29) and the slot picker. Pre-15x mode still needs its outline.

**Tests:**
- EditMode: the status filter.
- Captures 91, 94, 96, 98 and wn_* before and after, with a yellow-pixel metric (< 0.1 % outside PV and windows).
- `regress_lock` on the tender and slot-picker captures.

## 2. Blocker U2-002: night keeps a bright blue background
**Cause:** the background seen in 15x is not the camera clear colour. `RegionMapBuilder.Skirt()` (`World/X15/RegionMapBuilder.cs:641-646`) always builds a `Haze` plane:
- it extends 40 u beyond the region, at y = -SlabD - 0.02;
- its material is **Unlit/Color** `x15_haze` = `HazeColor` (0.78, 0.85, 0.90), luminance about 213.

This plane hides the camera background. NaturePilot.Apply already sets that background to `NightGrade.Background` at night (`NaturePilot.cs:72-75`), but it is never visible.

The apron and Landscape15x vertex colours fade to `HazeColor` through the Toon shader, which is night-graded (`RegionMapBuilder.cs:706`, `Landscape15x.cs:297`). So at night the slab darkens while the haze stays at its daytime colour. Measured meanL is 180–205; the target is 80–112.

**Controllers involved:**
- NaturePilot.Apply sets `_NightAmount`, `_DuskAmount` and the camera background on the map.
- NightGrade.Set is the single authority for the night value (`NightGrade.cs:128`).
- NightGradeDriver handles the office.
- HomeDistrict / `HubHUD.UpdateHome` handles the plaza.
- `HubHUD.Select` also writes `SeaBackground` to the camera (`HubHUD.cs:773`, `Home.cs:136`).
- Sun15x only sets the sun direction and `_HCShadowNight`.

**Smallest consistent fix:** do not add a new controller. Two options:
- (a) Give the haze plane the RenewableCEO/Toon shader with `_Unlit=1` and `HazeColor`, so it gets the same `_NightAmount`/WinterNightGrade as the apron and the seam disappears. This is preferred.
- (b) In NaturePilot.Apply, set the `x15_haze` colour to `Lerp(HazeColor, NightGrade.Background, _night)`, using the same value as the camera background.

**Files:** `RegionMapBuilder.cs` (Skirt/Unlit), or `NaturePilot.cs`.

**Risks:**
- The daytime look of r37c/r37k (silhouette and landscape pilots) must not change by more than ±3 meanL.
- Dusk and morning tints need checking.
- Plaza and office use their own spaces and must not be affected.

**Tests:**
- Winter set (after the measurement fix below).
- Captures 45/46, 48/49 and 95/96 before and after.
- A background corner pixel compared against `NightGrade.Background` × grade.

## 3. Measurement and capture defects
1. **houses=0 / trees=0 (U2-006):** `WinterNightAutoShots` (`HubHUD.WinterNightShot.cs:95-110`) counts through `MapDecorRef` (`FindAnyObjectByType<MapDecor>`) and `MapDecor.QaCounts()`. Under World15x, `Region15xBoot.cs:48-49` deactivates the `LombokWorld` root, so the lookup returns null and the count is (0,0). The 15x world is drawn by `RegionMapBuilder`. The village list is empty too, so every "village" shot actually focuses on HQ.
   - **Fix (Auditor's tool):** count from the active region root, using `RegionMapBuilder.Stats` or frustum-tested renderers.
2. **Failure counter never counts per-shot FAILs:** the code uses `line.EndsWith("FAIL")` after appending ` snow=.. poolsWinter=..`. That suffix always comes after the verdict, so map, plaza and office FAILs are not counted. metrics.txt says `total fails=1` while 7 lines say FAIL. This is a false-PASS risk in the gate.
3. **Mid and far shots are identical (U2-005):** sizes 14 and 40 are legacy units. `RegionCameraClamp` (execution order 1000, LateUpdate) clamps both to MaxSize, which is half the region side plus margin.
4. **Office night shot (U2-003):** it sets `_interior=true` and calls `Select("office")`, but in 15x the camera stays on the daytime village (same product cause as U2-007).
5. **Other capture-only defects:** U2-016, U2-023, U2-027, U2-052 and U2-055 come from uidev steps that grab without checking preconditions (tab, scroll, target, seed). The exact step lines were not traced (UNVERIFIED).
