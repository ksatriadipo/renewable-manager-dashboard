# b3_g18a_cableroute_r530b2

Patch: b3_g18a_cableroute_r530b2
Jalur: B3-04 kabel (delta r530b) — perbaikan regresi kunci r407
Butir ceklist / temuan: b3r7 EditMode fail 1: ElecWindows15xR407Tests.PowerView_NyalaTanpaKubus_MatiKubusLama — baris terkunci r407 "tanpa pembangkit: semua gelap" diubah oleh r530b
Apa yang berubah: RenewableCEO/Assets/Scripts/Game/World/X15/Region15xPlay.cs — panggilan PowerLine15x.Off(...) saat tanpa pembangkit dipindah ke baris tersendiri sebelum baris r407; baris r407 `if (plants.Count == 0) { if (ElecWindows15x.Enabled) BuildWindows(null); return; }` dikembalikan persis.
Kenapa: kunci regresi r407 (perilaku "tanpa pembangkit = semua jendela gelap") wajib dipertahankan; r530b menggabungkan Off() ke baris yang sama sehingga kunci gagal. Perilaku identik: Off() tetap dipanggil, lalu jendela gelap + return seperti r407.
Dampak: KPI target: EditMode fail 0 (ElecWindows15xR407Tests lulus) dengan r530b + r531 terpasang. KPI lindung: semua string terkunci r407 hadir (dicek offline: 4/4), perilaku r530b (Off saat tanpa pembangkit) tidak berubah, r523/r529b tidak disentuh, sakelar PowerLine15x tetap MATI bawaan. Risiko: tidak ada perubahan logika (urutan pemanggilan sama).
Cara membatalkan: git apply -R b3_g18a_cableroute_r530b2.patch; ulang job tests none (tes r407 akan gagal lagi).
Verifikasi offline: git apply --check pada /srv/rm HEAD 0cce9e2 (r530b + r531 terpasang) OK; pemeriksaan string: keempat StringAssert.Contains di ElecWindows15xR407Tests ditemukan di Region15xPlay.cs hasil patch.
