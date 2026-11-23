# ui_gu07_hirecard_r558

Patch: ui_gu07_hirecard_r558 (berkas ui_gu07_hirecard_r558.patch, di atas HEAD + r539a3, r551, r550, r553, r552, r554 berurutan)
Jalur: UI (Tim › Rekrut, kartu kandidat) + QA lokalisasi (validator NN-06)
Butir ceklist / temuan: G-U07 (Auditor, tangkapan HP user docs/evidence/user_20261123/05.jpg, A57 2340×1080); P0-8 validator panjang string NN-06

Apa yang berubah: Resources/Localization/strings.csv, Resources/UI/teamhub.uss, Scripts/Game/UI/Screens/HireCardR558.cs, Scripts/Game/UI/Screens/HubHUD.TeamHub.cs, Tests/EditMode/Game/NN06/c15_dlg_limits.csv, Tests/EditMode/Game/NN06/c15_limits.csv, Tests/EditMode/Game/NN06/nn06_allow.csv, Tests/EditMode/Game/NN06/nn06_spec15x_limits.csv, Tests/EditMode/Game/Nn06LocLengthR558Tests.cs (+ .meta berkas baru). Rincian:
- `RenewableCEO/Assets/Scripts/Game/UI/Screens/HubHUD.TeamHub.cs` `CandidateCard()`: di balik sakelar, nama = Label `tm-name tm-name--block` (blok tetap 2 baris, tanpa `Kit.Fit` yang mengecilkan huruf); baris skill dipecah: baris 1 label skill + rentang `3–5/10` (nowrap, rata kanan), baris 2 bilah selebar isi tanpa label persen (`44%` hilang), baris 3 (hanya pelamar belum diwawancara) catatan `tm.skill.cv_note` menggantikan teks keras "(CV)"; kartu diberi kelas `tm-card--hire`.
- `Scripts/Game/UI/Screens/HireCardR558.cs` (+ .meta): sakelar `HireCardR558.Enabled` (bawaan NYALA).
- `Resources/UI/teamhub.uss`: aturan `tm-card--hire` (nama 84 px = 2 baris pada --fs-button, rentang --fs-small, catatan --fs-caption, tombol kaki 64/64/64 px). Tidak ada font di bawah token.
- `Resources/Localization/strings.csv`: 1 baris baru `tm.skill.cv_note` (ID "Perkiraan dari CV" 17, EN "Estimate from CV" 16, RU "Оценка по CV" 12; ja/zh/pt/ar diisi). Akhir baris CRLF dipertahankan (diff 1 baris).
- `Tests/EditMode/Game/Nn06LocLengthR558Tests.cs` (+ .meta): `NN06_LocStrings_WithinC15AndSpecLimits` (8.473 kunci, ID/EN/RU ≤ batas; allow-list maks 8, hanya boleh turun) + `GU07_HireCard_Layout_Locked`.
- `Tests/EditMode/Game/NN06/` (+ .meta): salinan `tools/loc/c15_limits.csv`, `c15_dlg_limits.csv`, `nn06_spec15x_limits.csv` (turunan `docs/ui/ui_component_spec_15x.json` lewat scratch `nn06_build_spec15x.py`), `nn06_allow.csv` (8 baris TODO).

- Daftar berkas lengkap:
- `RenewableCEO/Assets/Resources/Localization/strings.csv`
- `RenewableCEO/Assets/Resources/UI/teamhub.uss`
- `RenewableCEO/Assets/Scripts/Game/UI/Screens/HireCardR558.cs`
- `RenewableCEO/Assets/Scripts/Game/UI/Screens/HireCardR558.cs.meta`
- `RenewableCEO/Assets/Scripts/Game/UI/Screens/HubHUD.TeamHub.cs`
- `RenewableCEO/Assets/Tests/EditMode/Game/NN06.meta`
- `RenewableCEO/Assets/Tests/EditMode/Game/NN06/c15_dlg_limits.csv`
- `RenewableCEO/Assets/Tests/EditMode/Game/NN06/c15_dlg_limits.csv.meta`
- `RenewableCEO/Assets/Tests/EditMode/Game/NN06/c15_limits.csv`
- `RenewableCEO/Assets/Tests/EditMode/Game/NN06/c15_limits.csv.meta`
- `RenewableCEO/Assets/Tests/EditMode/Game/NN06/nn06_allow.csv`
- `RenewableCEO/Assets/Tests/EditMode/Game/NN06/nn06_allow.csv.meta`
- `RenewableCEO/Assets/Tests/EditMode/Game/NN06/nn06_spec15x_limits.csv`
- `RenewableCEO/Assets/Tests/EditMode/Game/NN06/nn06_spec15x_limits.csv.meta`
- `RenewableCEO/Assets/Tests/EditMode/Game/Nn06LocLengthR558Tests.cs`
- `RenewableCEO/Assets/Tests/EditMode/Game/Nn06LocLengthR558Tests.cs.meta`

Kenapa: G-U07 — "3–5/10 (CV" terpotong di tepi kartu Ivo, "(CV)" masuk padding (Rhea), "Orin Bramblewood" 2 baris membuat tiga kartu tidak sejajar, ikon bilah + "44%" berdesakan dengan rentang (lebar label 200 + angka 170 memeras bilah). NN-06 menuntut validator panjang string vs c15_limits = 0 pelanggaran ID/EN/RU.

Dampak: kartu kandidat Rekrut saja (kelas tm-card--hire) + tes baru; kartu lain tidak tersentuh. Rincian:
- KPI target: kartu kandidat tanpa teks keluar kotak/terpotong, tiga kartu sejajar (kepala nama sama tinggi), tombol kaki 64 px; validator NN-06 = 0 pelanggaran di luar allow-list.
- KPI lindung: kartu hasil wawancara (skill `x.x/10` tanpa catatan CV), modal wawancara/hasil, kartu Karyawan/Event/Pelatihan (kelas lain tidak tersentuh: aturan hanya `.tm-card--hire`), `Goal1G9CardTemplateLockTests`, audit UI TOTAL.
- Risiko: kartu sedikit lebih tinggi (+1 baris bilah, +1 baris catatan); grid sudah menyejajarkan tinggi baris. Tinggi 84 px nama mengasumsikan line-height Baloo 2 800 @32 ≈ 40–42 px — perlu dilihat di tangkapan. Nama > 2 baris (≥ ±36 karakter) akan terpotong oleh overflow hidden (nama generator ≤ 20 karakter). Bukti "≈ 62 px" tombol: aturan sudah 64 px di layout.uss; kemungkinan pembulatan skala panel — UNVERIFIED sampai tangkapan A57 diukur.
- Temuan NN-06 di luar layar ini (allow-list, TODO): `sp.watch` en/ru (secondary 14/12), `ui.c15.ev.smelter.choice.a` id/en/ru (card-button 18/18/16), `ui.c15.ev.smelter.choice.b` id/en/ru (secondary 14/14/12) = 8 baris.

Cara membatalkan: `git apply -R ui_gu07_hirecard_r558.patch` (berkas baru ikut tercabut), atau sakelar `HireCardR558.Enabled = false` = tata letak kartu lama persis (USS baru hanya menempel pada `tm-card--hire` yang tidak dipasang saat MATI). Tangkapan diulang: uidev Tim › Rekrut (14_hire_board) A57 2340×1080 + 960×540, ID/EN/RU.

Verifikasi offline: git apply --check tumpukan OK; compile offline TOTAL 0; nn06_check.py violations=0 (allow-listed 8). Rincian:
- `git apply --check` pada tumpukan HEAD + r539a3, r551, r550, r553, r552, r554: OK.
- Compile offline (`rcompile_ep.py`, layout wip_b3_r529): Core/Game/Core.Tests/Game.Tests/Editor TOTAL 0.
- `python3 /srv/rm/scratch/wip_gu07_r558/nn06_check.py` (strings bertambal + 3 berkas batas + allow-list): checked=8473, violations=0, allow-listed=8, missing-keys=0. Tanpa allow-list: 8 pelanggaran (daftar di atas).
- EditMode belum dijalankan (butuh Unity; ronde orkestrator).

Cek konsep: NN-06 — huruf tetap di token type.uss (--fs-button nama, --fs-small rentang, --fs-caption catatan), tanpa elipsis, tanpa teks di luar kotak (rentang nowrap shrink 0, label skill boleh 2 baris), satu tombol utama 64 px; panjang string ID/EN/RU dijaga validator. NN-07: Baloo 2 800 nama/angka, Nunito Sans isi, catatan #24403c di krem (kontras ≥ 4,5:1). NN-01: teks netral.
