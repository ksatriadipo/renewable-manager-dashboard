# b2_g07d_loc_r512 — kunci lokalisasi shop.prod.days / shop.prod.maxdays untuk r509

## Label manifest (format runner)
Butir ceklist / temuan: b2_g07d_loc_r512 — Batch 2 G07d (U2-028): dua kunci loc yang dibutuhkan r509 (tercatat di manifest r509 "Loc keys needed")
Apa yang berubah: berkas: RenewableCEO/Assets/Resources/Localization/strings.csv. +2 baris sesudah shop.prod.max: shop.prod.days ("± {0} hari produksi" / "About {0} days of production") dan shop.prod.maxdays ("± {0}+ hari produksi" / "About {0}+ days of production"), kolom ja/zh/ru/pt/ar terjemahan mesin (header berkas: perlu tinjauan penutur asli). Tanpa perubahan kode.
Kenapa: r509 memakai kunci ini; tanpa kunci jatuh ke cadangan jam ("± 144 jam produksi") yang tidak sesuai desain.
Dampak: KPI target label Toko memakai hari; KPI lindung baris loc lain byte-identik, switch G07dOn OFF tidak memakai kunci ini; risiko lebar chip 64_shop_3 (960x540 + A57).
Cara membatalkan: git apply -R b2_g07d_loc_r512.patch (r509 kembali ke cadangan jam); ulang tangkapan 64_shop_3.
Verifikasi offline: strings.csv terbaca 8 kolom per baris, tanpa kunci ganda; apply + apply -R --check OK di atas tumpukan b2r2 + r506–r511 (21 Nov).

Patch: b2_g07d_loc_r512          Jalur: Localization (data only)          Butir: G07d (U2-028), TACTICAL_EXECUTION_BOARD B2-08c
Base: game aee9794 (b2r2) + r506, r507, r508, r509, r510, r511. Author: orchestrator 21 Nov 2026. Master U37H dda07ec untouched.
