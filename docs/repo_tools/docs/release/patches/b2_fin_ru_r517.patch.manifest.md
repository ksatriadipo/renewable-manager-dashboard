# b2_fin_ru_r517.patch

Patch: b2_fin_ru_r517 (base game repo remediation/u37h-b2 HEAD c8c4edaea8a5da08142057fc0357a0106768b784), data-only
Jalur: Lokalisasi (data); tanpa kode, tanpa Unity
Butir ceklist / temuan: Batch 2, syarat Auditor C510-3 (docs/remediation/batch02/AUDIT_R507_R512.md), menyusul r503 (14cfb0b) + r510 (85e12ee)
Apa yang berubah: RenewableCEO/Assets/Resources/Localization/strings.csv: kolom ru diisi untuk 15 baris fin.* (14 dari r503 termasuk fin.earned_est, 1 dari r510 fin.energy_na); ja/zh/pt/ar dibiarkan kosong sesuai pola 8.098 baris terbaru (hanya ru terisi); en/id tidak berubah; {0} dan $ tetap
Kenapa: C510-3 mewajibkan RU fin.energy_na + baris fin.* r503 terisi sebelum tangkapan RU dinilai (sel ru kosong = fallback/teks kosong di UI RU)
Dampak: KPI target = semua fin.* punya sel ru non-kosong; KPI lindung = teks en/id, placeholder, jumlah baris (13.200), CRLF, kuota tanpa elipsis (teks pendek); risiko rendah (data saja), panjang ru belum diuji di kartu 960x540/A57
Cara membatalkan: git apply -R b2_fin_ru_r517.patch; ulang tangkapan kartu keuangan proyek dalam bahasa RU
Verifikasi offline: git apply --check + apply pada ekspor bersih di luar repo = OK (hasil identik byte dengan berkas kerja); skrip csv: 15 baris fin.* masing-masing 8 kolom, ru non-kosong, en/id/ja/zh/pt/ar tak berubah, placeholder {0} cocok en↔ru, total baris 13.200 = basis; file = UTF-8 CRLF
