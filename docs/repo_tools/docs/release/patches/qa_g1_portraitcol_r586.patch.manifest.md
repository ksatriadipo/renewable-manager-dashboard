# qa_g1_portraitcol_r586
Patch: qa_g1_portraitcol_r586
Jalur: QA (audit UI di kode game, UiAuditStandard.cs; tidak mengubah UI pemain)
Butir ceklist / temuan: audit 23 Nov butir 14; triage Auditor p0r9 (docs/qa/p0r9/TRIAGE.md) G1 — aturan tombol pj-card mengharapkan 535 px padahal spesifikasi r36c menaruh tombol di kolom kiri samping potret
Apa yang berubah: bila .qa-portrait tampil, kolom tombol = lebar dalam kartu − (lebar potret + 22); ukuran, ketengahan, dan keluar-kotak diukur di kolom itu; tanpa potret aturan lebar penuh tetap.
Kenapa: putusan Auditor (pemilik alat ukur) atas G1 p0r9; mengukur terhadap tata letak yang benar, bukan melonggarkan (aturan kaki 16–20 tetap → "kaki 14" tetap FAIL).
Dampak: KPI target G1 kartu berpotret diukur benar; KPI lindung: semua aturan tombol lain tidak berubah; risiko: rendah (hanya audit QA).
Cara membatalkan: git apply -R qa_g1_portraitcol_r586.patch; ulang job uidev.
Verifikasi offline: git apply --check di HEAD + r581b + r582b OK; compile offline tumpukan TOTAL 0.
