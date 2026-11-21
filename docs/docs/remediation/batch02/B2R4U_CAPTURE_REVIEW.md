# b2r4u capture review (orchestrator, 21 Nov 2026)

Source: /srv/rm/docs/evidence/169_parity_b2r4u/uidev_a57_0805 (A57). Reviewed visually; Auditor conditions referenced.

| Capture | Observation | Condition | Verdict |
|---|---|---|---|
| 07_tender_locked | Locked board, unlock line "level direktur 3", progress bar, single CTA "Ke proyek kecil"; no ellipsis | G09 C-G09-02 | PASS (visual) |
| 11_home_next_step | Toast "Quest selesai: Jalan Pertama · klaim di Tugas" readable, centered above nav | G09 | PASS (visual) |
| 12/13_quest_board | Main mission card with reward + progress; claimed toast "Hadiah diklaim: Surat dari Desa" | G09 C-G09-02 | PASS (visual) |
| 16_mission1_done | Modal reward + next mission line, one primary button | G09 | PASS (visual) |
| 21_tender_evaluating | "Panitia menilai, 5 detik lagi" + Dinilai badge; own-proposal row locked "level direktur 7" | G07/G09 | PASS (visual); the lock level for own proposals (Lv 7 vs the D1 ladder) is noted for the Auditor to cross-check |
| 37_plant_card | Sell vs operate; "+$477/bln" profit next to "Pendapatan (perkiraan per tahun) $6.663" | C507-1/C508-1 | PARTIAL: P-03 "Perkiraan energi dihasilkan" (MWh) row not visible in this frame (needs scroll or missing) — re-check in b3r1u |
| 39_map_overview | Old-style 3D map, lock pins, info card single CTA | G19 baseline for r521 | PASS (baseline kept for r521 comparison) |
| 44_office_mission | Shows the world, not the office interior (B05-P1/G17 camera clamp) | — | KNOWN FAIL → targeted by r523 |

Perfshot: Tinggi_proyek same-frame FAIL caused by the sim clock advancing between shots (12 → 11 days) = QA-tool finding G22 (not a product regression); for the Auditor.
