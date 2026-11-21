# b2_g11_cand_r505 — Batch 2 G11: one Core source for candidate counts (U1-026, U1-028)

## Label manifest (format runner; isi diambil dari bagian di bawah, ditambahkan orkestrator 20 Nov 2026)
Butir ceklist / temuan: b2_g11_cand_r505 — Batch 2 G11: one Core source for candidate counts (U1-026, U1-028)
Apa yang berubah: berkas: RenewableCEO/Assets/Scripts/Core/Simulation/Company.CandidateView.cs, RenewableCEO/Assets/Scripts/Core/Simulation/Company.CandidateView.cs.meta, RenewableCEO/Assets/Tests/EditMode/CandidateCountG11Tests.cs, RenewableCEO/Assets/Tests/EditMode/CandidateCountG11Tests.cs.meta, RenewableCEO/Assets/Scripts/Game/UI/Screens/HubHUD.TeamHub.cs, RenewableCEO/Assets/Scripts/Game/UI/Screens/HubHUD.cs, RenewableCEO/Assets/Scripts/Game/UI/Screens/HubHUD.Recruit.cs. 
Kenapa: U1-026: satu layar menampilkan 11/10/8/1 karena 4 filter berbeda (RCA §1 A/C/E/F) + lencana Rekrut dihitung sebelum tandai-dilihat. U1-028: modal memakai skill asli, kartu memakai VisibleSkills (RCA §1 I/J).
Dampak: KPI target: judul == Kandidat + Hasil == jumlah kartu di jalur + filter aktif (T1); lencana Rekrut == bagian pelamar lencana Tim (definisi tunggal, dihitung sesudah tandai-dilihat). KPI lindung: tanpa perubahan ekonomi, harga booster/Headhunter/InstantInterview, skema simpanan, SaveSanitizer, alur Interview/StartInterview/Offer/Hire, MissionHire (judul inline + `nav.team` Set tidak berubah), empty state `hire.empty`/`rb.empty_out`. Risiko: (1) chip/auto-switch kini per jalur: jalur outsourcing yang hanya punya hasil membuka sub-tab Hasil (disengaja); (2) judul berubah dari "semua pelamar" ke "jalur + filter" — angka pada tangkapan 14_hire_board berubah (11 → jumlah jalur Lowongan); (3) lencana Rekrut kini juga menghitung hasil wawancara (sama dengan Tim) dan tidak lagi tampil basi di bingkai yang sama; (4) `_seenCandidates` tetap sesi saja (residual, persistensi = skema simpanan, di luar lingkup); (5) "hanya 2 kartu per lipatan" = tinggi kartu G12/U1-027, bukan G11.
Cara membatalkan: `git apply -R b2_g11_cand_r505.patch` (diperiksa: `git apply -R --check` OK), atau sakelar `CandidateViewG11.Counts = false` (dan `InterviewVisible` tetap false). Tangkapan diulang: uidev 14_hire_board + 15_interview (a57 + small16x9), lencana Tim/Rekrut; tes: EditMode penuh.
Verifikasi offline: rcompile_ep.py TOTAL 0 (Core 0, Game 0, Core.Tests 0, Game.Tests 0, Editor 0) pada a5a9315 + r501 + r505. `git apply --check` OK pada ekspor bersih di luar repo (scratchpad /tmp): a5a9315 saja, a5a9315 + r501, a5a9315 + r501 + r502; hasil apply byte-identik dengan pohon yang dikompilasi; `-R --check` OK. Harness NUnit offline: CandidateCountG11Tests 7/7 PASS; HiringLadderTests 11/13 PASS, 2 sisanya (QuestCatalog_AllRoleTokensResolve, CharacterDesigns_…) membaca `Application.dataPath` → hanya jalan di job Unity EditMode (tidak tersentuh patch). Step2bTests + GddRulesTests 0 gagal. EditMode penuh + uidev menunggu ronde runner (orkestrator).


Patch: b2_g11_cand_r505          Jalur: C (Core read layer) + G (HubHUD Tim/Rekrut) + EditMode tests          Butir/temuan: G11 (U1-026, U1-028), TACTICAL_EXECUTION_BOARD B2-11, RCA `/srv/rm/scratch/wip_b2_rca_g11/RCA_G11.md`
Base: game `remediation/u37h-b2` @ `a5a9315` + `b2_g07a_core_r501` (r505 also applies on bare a5a9315 and on a5a9315 + r501 + r502). Master U37H `dda07ec` untouched.

## Apa yang berubah (berkas)
- NEW `RenewableCEO/Assets/Scripts/Core/Simulation/Company.CandidateView.cs` (+ .meta): static switches `CandidateViewG11`, struct `CandidateTally {Waiting, Results, Total}`, partial `Company`: `CandidatesVisible(lane, role, level)`, `CandidateTallyFor(lane, role, level)` (interviewing = Waiting), `CandidatesNeedingAttention(Func<int,bool> seen)` (unseen or interviewed, all lanes), `HasApplicantFor(role)` (open lane), static `InterviewResultSkills(c)`. Read-only, no save fields, no economy.
- `Game/UI/Screens/HubHUD.TeamHub.cs`: BuildRecruitCenter title/chips/sub-tab auto-switch/card list from `CandidateTallyFor/CandidatesVisible(_outsourceTab, _fRole, _fLevel)` (title == chip Kandidat + chip Hasil == cards across both sub-tabs); OpenHireFilter title = lane total without filter; BuildTeamHub Rekrut badge = `CandidatesNeedingAttention`, added AFTER the content switch (after mark-seen) instead of before.
- `Game/UI/Screens/HubHUD.cs` RefreshBadges: Tim number candidate part via `CandidatesNeedingAttention` (same formula as before, now shared with Rekrut).
- `Game/UI/Screens/HubHUD.Recruit.cs` OpenInterview: "Hasil wawancara" column = `Company.InterviewResultSkills(c)` (honesty % from the same array).
- NEW `Assets/Tests/EditMode/CandidateCountG11Tests.cs` (+ .meta, Core.Tests): T1–T6 from RCA §4 + switch defaults.
- Not touched: Fmt.cs, HubHUD.Team.cs Money(), HubHUD.cs Short(), EquityOfferHook.cs, HubHUD.Projects.cs, HubHUD.Map.cs, strings.csv, AutoShot/capture code, Company.cs/Company.Quests.cs (RCA item 5 optional refactor skipped to keep the patch small; T6 proves `HasApplicantFor` == the inline predicate so it can be swapped later). No new loc key needed (existing `tm.hire.title` {0} reused).

## Sakelar
1. `CandidateViewG11.Counts` (static bool, bawaan NYALA, sesuai RCA "default ON tester build"): mati = semua jalur lama persis (kode lama di cabang else).
2. `CandidateViewG11.InterviewVisible` (static bool, bawaan MATI) — **NEEDS OWNER DECISION**: nyala = modal wawancara membandingkan CV dengan `VisibleSkills` (penilaian pewawancara, sama dengan kartu); dengan pewawancara lemah (Komunikasi/Kepemimpinan < 7, termasuk tanpa pewawancara = 4 → derau 0,75) pemain melihat angka berderau dan kejujuran % ikut berderau. Ini memulihkan perilaku GDD sketsa 8 dan menutup kebocoran skill asli, tetapi terlihat pemain = perubahan gameplay → tidak dinyalakan tanpa keputusan user (masuk PENDING_DECISIONS). Mati = skill asli (perilaku lama).
Tidak didaftarkan ke Profile15x (tidak terkait dunia 15×).

## Kenapa
U1-026: satu layar menampilkan 11/10/8/1 karena 4 filter berbeda (RCA §1 A/C/E/F) + lencana Rekrut dihitung sebelum tandai-dilihat. U1-028: modal memakai skill asli, kartu memakai VisibleSkills (RCA §1 I/J).

## Dampak
- KPI target: judul == Kandidat + Hasil == jumlah kartu di jalur + filter aktif (T1); lencana Rekrut == bagian pelamar lencana Tim (definisi tunggal, dihitung sesudah tandai-dilihat).
- KPI lindung: tanpa perubahan ekonomi, harga booster/Headhunter/InstantInterview, skema simpanan, SaveSanitizer, alur Interview/StartInterview/Offer/Hire, MissionHire (judul inline + `nav.team` Set tidak berubah), empty state `hire.empty`/`rb.empty_out`.
- Risiko: (1) chip/auto-switch kini per jalur: jalur outsourcing yang hanya punya hasil membuka sub-tab Hasil (disengaja); (2) judul berubah dari "semua pelamar" ke "jalur + filter" — angka pada tangkapan 14_hire_board berubah (11 → jumlah jalur Lowongan); (3) lencana Rekrut kini juga menghitung hasil wawancara (sama dengan Tim) dan tidak lagi tampil basi di bingkai yang sama; (4) `_seenCandidates` tetap sesi saja (residual, persistensi = skema simpanan, di luar lingkup); (5) "hanya 2 kartu per lipatan" = tinggi kartu G12/U1-027, bukan G11.

## Perubahan tangkapan yang dibutuhkan (TIDAK di patch ini; perlu tanda tangan Auditor — pemilik alat ukur)
AutoShot.cs:225-233 (skenario 14_hire_board/15_interview): pilih kandidat dengan `ClaimedSkills.RoleSkill > Person.Skills.RoleSkill + 0.5` (fallback: pertama); pakai `StartInterview` + selesaikan timer (Advance) agar `HasRevealed` nyata, bukan `Company.Interview` instan; set `_hireSub = 1` (atau tangkapan tambahan `14b_hire_results`) supaya kandidat yang diwawancarai terlihat di papan sebelum 15_interview. Tidak melonggarkan ambang apa pun. Untuk bukti U1-028 dengan `InterviewVisible` nyala, tangkapan perlu varian sakelar nyala.

## Cara membatalkan
`git apply -R b2_g11_cand_r505.patch` (diperiksa: `git apply -R --check` OK), atau sakelar `CandidateViewG11.Counts = false` (dan `InterviewVisible` tetap false). Tangkapan diulang: uidev 14_hire_board + 15_interview (a57 + small16x9), lencana Tim/Rekrut; tes: EditMode penuh.

## Verifikasi offline
- rcompile_ep.py TOTAL 0 (Core 0, Game 0, Core.Tests 0, Game.Tests 0, Editor 0) pada a5a9315 + r501 + r505.
- `git apply --check` OK pada ekspor bersih di luar repo (scratchpad /tmp): a5a9315 saja, a5a9315 + r501, a5a9315 + r501 + r502; hasil apply byte-identik dengan pohon yang dikompilasi; `-R --check` OK.
- Harness NUnit offline: CandidateCountG11Tests 7/7 PASS; HiringLadderTests 11/13 PASS, 2 sisanya (QuestCatalog_AllRoleTokensResolve, CharacterDesigns_…) membaca `Application.dataPath` → hanya jalan di job Unity EditMode (tidak tersentuh patch). Step2bTests + GddRulesTests 0 gagal. EditMode penuh + uidev menunggu ronde runner (orkestrator).

## Peta tes
| Tes | Memeriksa |
|---|---|
| T1 | campuran 2 jalur × 2 peran × Junior/Senior × menunggu/sedang/selesai: untuk tiap kombinasi jalur/peran/tingkat (termasuk null) Total == Waiting + Results == CandidatesVisible.Count, Results == jumlah Interviewed, isi sesuai filter; gabungan jalur == Candidates.Count; jumlah per peran×tingkat == jalur |
| T2 | sedang diwawancarai = Waiting; sesudah timer jadi Results, Total tetap |
| T3 | NeedingAttention: seen kosong/null = semua; semua dilihat = hanya yang diwawancarai; himpunan sebagian == rumus lencana Tim lama |
| T4 | Headhunter → Waiting jalur Lowongan +3, jalur outsourcing tidak berubah |
| T5 | pewawancara lemah: VisibleSkills == RevealedSkills; InterviewResultSkills mati = skill asli, nyala = VisibleSkills; wawancara instan lama (tanpa reveal) jatuh ke skill asli |
| T6 | HasApplicantFor == predikat inline lama (Company.Quests.cs:271, Company.cs:122) untuk kosong / hanya outsourcing / lowongan |
| Switch | Counts bawaan nyala, InterviewVisible bawaan mati |
