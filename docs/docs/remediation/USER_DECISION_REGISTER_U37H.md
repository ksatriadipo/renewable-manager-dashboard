# USER DECISION REGISTER — U37H

These are product decisions that only the user can make (directive v2 §3.4, §13). Nothing in this list is changed until the user answers. Unrelated remediation continues meanwhile.

| ID | Findings | Question | Current decision / state | Options and impact | Engineering recommendation | Blocks |
|---|---|---|---|---|---|---|
| D1 | U1-001 | In 15× the HQ always lands on the plaza. Should the "pick HQ" screen become a confirmation step ("Dirikan di sini")? | Today: a pick screen that has no recommended tile, so the panel stays empty (blocker). | (a) Confirmation step: one tile, panel with location info + "Dirikan di sini". Simple, honest, no false choice. (b) Keep a real choice: needs a list of pickable locations and makes the HQ position data-driven. That conflicts with the plaza-centred HQ (vis15x_r37d/h4) and the save fields. | (a) | Only the final form of the U1-001 fix. The panel-empty fix (hide until content) can go ahead either way. |
| D2 | U1-032, U1-033 | Institution names in the Indonesian build: Energy Ministry, Electricity Agency, Environmental Agency. | 2 Nov 2026: institution names stay English in the ID build. | (a) Keep English (no change, findings closed as ACCEPTED_BY_PRODUCT_DECISION). (b) Indonesian names (Kementerian Energi, Badan Listrik, Badan Lingkungan). (c) Fictional Indonesian-flavoured names. | (a) unless the user now prefers (b). The audit treats English as a defect, but it was a deliberate decision. | G06 for these two IDs |
| D3 | U1-031, U2-056 | Coin symbol in the tester build. | 8 Nov 2026: "$" in the tester build, "Koin" in the soft-launch build (`Fmt.cs:36-48`). | (a) Keep "$" in tester builds. (b) "Koin" everywhere now. That changes what testers see and what screenshots show, but the economy is unchanged. | (b) for consistency with the Indonesian player experience, but it is the user's call. | G08 |
| D4 | U2-049 (+ G15: U2-042, 043, 051, 054) | Theme E green/mint contrast: white label on green #6CC04A and mint #99D2C7, toggle active state. | Theme E tokens approved. | (a) Darken the green/mint token or switch the label to dark text. (b) Keep the tokens and accept below-4.5:1 contrast. A before/after sheet comes first. | (a), shown on a before/after sheet first. | G15 |
| D5 | U2-031 | Decorative leaf/sun stickers on every panel (Theme E panel kit B, DRAFT). | Asset UI-THEME-E-PANEL-KIT-B-V001 is DRAFT but shown in game. | (a) Approve the stickers. (b) Remove them (no other impact). (c) Keep them only on some panels. | User taste; no engineering preference. | U2-031 only |

Earlier pending decisions that still stand: ENV-HC1-PLANTS-V001 (trees) and ENV-HC5-PLAZA-DECOR-V001 (plaza decor) stay DRAFT, to be approved separately after the pilot passes. Visual pilot switches stay OFF for players.

## Jawaban user (18 Nov 2026)
- **D1 — DIPUTUSKAN:** pilih HQ menjadi konfirmasi "Dirikan di sini". Batas: jangan ubah `BuildHq` / `RestoreHq` (ikuti batas Phase 1: hanya `Region15xPlay.Zones` + `ShowHqPick`).
- **D2 — DIPUTUSKAN:** nama lembaga tetap bahasa Inggris di build Indonesia → U1-032, U1-033 = ACCEPTED_BY_PRODUCT_DECISION.
- **D3 — DIPUTUSKAN:** tetap "$" di build penguji; soft launch memakai "Koin" → U1-031, U2-056 = ACCEPTED_BY_PRODUCT_DECISION untuk build penguji (cek build soft launch tetap "Koin").
- **D4 — TERTUNDA:** buat lembar kontras Tema E sebelum/sesudah dulu; jangan implementasi sebelum persetujuan.
- **D5 — ARAH AWAL:** stiker daun/matahari hanya pada panel tertentu; tampilkan preview sebelum implementasi.
- **D4 — DIPUTUSKAN (18 Nov):** opsi B — token hijau #6CC04A dan mint #99D2C7 tetap; label jadi gelap #1F3B38 (5,33:1 di hijau, 7,12:1 di mint); toggle aktif = garis tepi gelap + centang. Implementasi di Batch 6 (G15), tidak di Batch 0.5.
- **D5 — DIPUTUSKAN (18 Nov):** aturan usulan disetujui — satu daun hanya di halaman hub penuh (Toko, Tim, Proyek, Peta); tidak pernah di modal, form, form penguji, kartu, sheet → tiga form onboarding (Privasi, Direktur, Perusahaanmu) tanpa stiker. Aset UI-THEME-E-PANEL-KIT-B-V001 tetap DRAFT sampai user menyetujui asetnya. Implementasi di Batch 6.

## Engineering decisions — Batch 2 (19 Nov 2026)

Appended 19 Nov 2026. The entries above are unchanged.
- Status labels: APPROVED (owner), PROPOSED, PENDING, HOLD, CONFIRMED.
- Proposals and open questions are kept in separate tables below.

### Approved decisions and restrictions

| ID | Topic | Decision / Description | Status | Evidence / Reference | Owner / Next Action |
|---|---|---|---|---|---|
| E-01 | Engineering mode | CONTROLLED ENGINEERING MODE replaces HOLD — PRESERVATION ONLY for engineering. Batch 2 implementation, refactoring, lightweight unit tests, docs and review are allowed on the designated branch, incremental and reversible, with each milestone reported with its changed files | APPROVED | owner message 19 Nov | Orchestrator follows the boundaries |
| E-02 | Branch | Work on `remediation/u37h-b2` (created from `remediation/u37h-b1`) in the game and work repos | APPROVED | game `a5a9315`, work `4e9a0802` | — |
| E-03 | Baseline | master U37H `dda07ec` is immutable; no push/fetch, history rewrite or gc | APPROVED (restriction) | — | — |
| E-04 | Cleanup | No cleanup or deletion without separate approval. P1 + P2 were done under explicit approval | APPROVED (restriction) | `docs/recovery/STORAGE_AND_RETENTION.md` | — |
| E-05 | Backup upload | HOLD until provider ticket #1954 is resolved and the owner explicitly approves resuming | HOLD | `docs/recovery/RECOVERY_EXECUTION_STATUS.md` | Owner / provider |
| E-06 | G06 glossary | "area" for map/survey/tender; "per location" for skill cost/time; keys and identifiers keep "hex" | APPROVED | `batch02/G06_COMPLETION.md` | — |
| E-07 | G06 status | Implementation PASS + EditMode PASS; visual, device and native-language validation pending; not release-validated. Commit contamination does not invalidate G06 (patch content verified identical) | APPROVED | `batch02/G06_COMPLETION.md` | Actions A-06..A-08 |
| E-08 | G07a/G08 architecture | Read-only `ProjectFinanceView` in Core; `Company` owns calculations; `Fmt` is the single formatting entry point; G07a + G08 are one integrated implementation; no save-schema change | APPROVED | `batch02/G07A_G08_SPECIFICATION.md` | Implementation after A-01/A-02 |
| E-09 | NetProfit | NetProfit = Revenue − Opex − Penalty | APPROVED | spec §1 | Representation basis: see P-02 |
| E-10 | O-2 | Option B: normal mode = Net Profit + project rating; Engineer Mode and detail = Gross Revenue, OPEX, Penalty, Net Profit; Decision 6 unchanged | APPROVED | spec §1 | — |
| E-11 | O-3 | Funding screen primary amount = `CashNeededNow`, clearly labelled, with CAPEX / Grant / Labor breakdown | APPROVED | spec §1, §6 | — |
| E-12 | O-1 | Screen-31 denominator uses the same definition as `SpentUsd`; not finalized before verification | APPROVED (conditional) | spec §3 (verification done: own-cash outlay) | Owner chooses P-01 |
| E-13 | O-4 | Maintenance × penalty interaction is a separate Auditor finding; no economic formula change authorized | APPROVED | `batch02/AUDITOR_FINDING_O4_PENALTY_MAINTENANCE.md` | Auditor (A-03) |
| E-14 | D3 / CoinWords | Unchanged: "$" in tester builds, Koin in soft launch | APPROVED (unchanged, D3) | `Fmt.cs`, `Loc.cs` | — |
| E-15 | Prototype.unity | Stays in Build Settings for now; recorded as technical debt TD-01 | APPROVED | spec §2 | A-18 |
| E-16 | BuildCost | `Company.BuildCost` stays the authoritative player build cost | APPROVED | `Company.Economy.cs:142` | — |
| E-17 | Runner integrity | Manifest-scoped staging proposal approved in principle; production runner changes **not** authorized | APPROVED in principle / HOLD for change | `batch02/RUNNER_INTEGRITY_FINDING.md` | Auditor (A-05) |
| E-18 | Retention | Three-tier retention (permanent / rolling / candidate) approved as a design; no deletion or automatic rotation | APPROVED (design) / HOLD (application) | `docs/recovery/STORAGE_AND_RETENTION.md` | A-16 |
| E-19 | Calibration | G06 recorded as a separate orchestrator observation (n=1); agent benchmarks preserved; standard milestone metrics collected | APPROVED | `ENGINEERING_STATUS.md` | — |
| E-20 | Upload resumption | Proposed `--bwlimit` 8–10 Mbit/s on resume | PROPOSED | recovery status | Owner |

### Open proposals and unresolved questions (not decided)

| ID | Topic | Decision / Description | Status | Evidence / Reference | Owner / Next Action |
|---|---|---|---|---|---|
| P-01 | O-1 representation | (a) "Spent X" without ratio until funded, then "of planned own cash Y"; or (b) a projected own-outlay ratio labelled as an estimate. Recommendation (a) | PENDING | spec §3 | Owner |
| P-01b | Build path | Confirm whether the 15× UI uses `Build` (no grant term) or `BuildWithFunding` | PENDING | spec §3 | Implementation RCA |
| P-02 | OPEX/Penalty basis | Plan basis (`p.Supply`) for all component displays; plant-card Net Profit changes from the run-rate remainder to the plan basis; residual decomposition rejected as not semantically truthful | PROPOSED | spec §4.4 | Owner |
| P-03 | O-5 "earned so far" | Relabel as an estimate or hide until a per-project ledger exists | PENDING | spec §4.4 | Owner |
| P-04 | Per-project ledger | Actual-basis OPEX/penalty/profit needs an accounting and save-schema change | PROPOSED (not authorized) | spec §4.3 | Owner / Auditor |
| P-05 | Backup scope | Add `audit169r16`, `audit169b1r3u`, `Android` builds to the backup (owner priority Android > b1r3u > r16) | PENDING | recovery status | Owner |

### Owner decisions — update 19 Nov 2026 (appended; earlier rows E-01…E-20 and P-01…P-05 unchanged)

| ID | Topic | Decision / Description | Status | Evidence / Reference | Owner / Next Action |
|---|---|---|---|---|---|
| E-21 | P-01 screen 31 | Before funding: "Spent X" without a ratio. After funding: "Spent X of planned own cash Y". Never compare `SpentUsd` with gross Capex + Development or `BuildCost` | APPROVED (resolves P-01) | `batch02/G07A_G08_SPECIFICATION.md` §12 | Derive Y without save change (spec §12 open item 1) |
| E-22 | P-01b build path | 15× player UI uses `BuildWithFunding` (`HubHUD.Projects.cs:1069`; uidev `HubHUD.AutoShot.cs:369`); legacy `Company.Build` only in Prototype-scene UIs (TD-01), old `BotPlayer`, tests | CONFIRMED (verification; resolves P-01b) | spec §12 | — |
| E-23 | P-02 OPEX/Penalty | Plan basis (`p.Supply`) for all displayed finance components, labelled "estimated per year"; no residual shown as actual; `RecurringChargePerYear` / `PenaltyInRecurring` internal only; no accounting/economy/save change; plant-card Net Profit change accepted | APPROVED (conditional: basis consistency across all related screens incl. plant card and project detail before implementation; resolves P-02) | spec §12 | Basis-consistency table (spec §12 open item 2) |
| E-24 | O-4 penalty × maintenance | Deferred. No change to penalty formula, maintenance or economy parameters, or save schema; separate economic evaluation later | DEFERRED | `batch02/AUDITOR_FINDING_O4_PENALTY_MAINTENANCE.md` | Auditor / owner later |
| E-25 | Documentation commit | Commit documentation only (the 12 reported Markdown files) to `remediation/u37h-b2` in the work repo; explicit per-file staging; no push/fetch; no game-repo change | APPROVED | this commit | — |
| — | P-03, P-05 | Still undecided | PENDING | spec §12; recovery status | Owner |
| E-26 | D-1 spent display | "Terpakai X" without ratio at every stage; Y is not reconstructed or estimated | APPROVED | owner 20 Nov 2026 (M1 unblock) | Owner |
| E-27 | D-2 spent label | "Kas sendiri terpakai" + note that tender survey cost is not included | APPROVED | owner 20 Nov 2026 | Owner |
| E-28 | D-3 cost label | "Total biaya" → "Biaya pembangunan" on feasibility and go/no-go; formula unchanged | APPROVED | owner 20 Nov 2026 | Owner |
| E-29 | P-03 earned figure | Plant card shows the figure labelled "Perkiraan energi dihasilkan" | APPROVED | owner 20 Nov 2026 | Owner |
| E-30 | D-4 equity partner | When an equity partner stake is active: note "Mitra ekuitas: 25%" in the same card context; profit-share formula unchanged; project profit must not read as the player's share | APPROVED | owner 20 Nov 2026 | Owner |
| E-31 | A-05 runner commit scope | Limited runner fix: manifest-scoped staging, paired Unity `.meta`, `build_stamp` excluded, unstaged leftovers logged; regression tests r407/r410/r500, rollback/reapply, DRY mode; Auditor review | AUTHORIZED | owner 20 Nov 2026 | Owner / Auditor |
| E-32 | D-5 survey/feasibility stars | Absolute solar rating with exactly the map-legend thresholds and formula; no relative ranking, no new thresholds; independent toggle kept; tests low/medium/high + boundaries; same stars on survey, feasibility and map legend | APPROVED | owner 20 Nov 2026 | Owner |
| E-33 | G07e geothermal row | "Segera hadir" geothermal row on the feasibility card stays visible (5 Nov decision kept); not hidden or removed | APPROVED (KEEP VISIBLE) | owner 20 Nov 2026 | Owner |
| E-34 | Stage 6–7 scheduling | Heavy restore/download must not compete with the Unity runner or the game critical path; deferred to an engineering slot with disk preflight | APPROVED | owner 20 Nov 2026 | Owner |
| E-35 | M1 execution + storage release | A-05 installed only after independent Auditor PASS + runner integrity check; then b2r2 (r501+r502) after preflight; r503/r504b/r505 after individual review. Storage: S1 + S6 may be released after the Auditor confirms A-05 evidence persists and the cache is inactive; S2 after restore report + evidence reconciliation; S3/S4/S5 HOLD; before each deletion show exact path, size and dependency evidence; no other deletion. Stage 6 paused while the runner works, resumed in idle slots; S5-D16 delta backup prepared at a stable game checkpoint | APPROVED | owner 20 Nov 2026 | Owner |
| E-36 | P-03 plant card energy | Plant card shows estimated energy produced in **MWh** under "Perkiraan energi dihasilkan"; no Koin/revenue figure under that label; honest fallback (not an economic figure) when MWh is unavailable/invalid | APPROVED | owner 20 Nov 2026 | Owner |
| E-37 | D-5 scope limit | Absolute solar rating (map-legend thresholds) only where it rates solar resource: site survey, feasibility, map legend, D1 result card only if it represents solar resource quality. Quest performance cards keep their existing quest-performance rating semantics | APPROVED WITH SCOPE LIMIT | owner 20 Nov 2026 | Owner |
| E-38 | b2r2 composition | b2r2 = r501, r502, r503, r505, r504c only, after A-05b Auditor PASS + install + validation; full EditMode incl. T9 reported; no heavy build below 20 GB free | APPROVED | owner 20 Nov 2026 | Owner |
| E-39 | B3-01 office in 15× | Option C hybrid: the existing multi-floor office interior stays; tapping the HQ building on the plaza enters it; the Home tab brings the camera to the plaza HQ; no second HQ. Steps 1–2 (camera clamp exception only while the interior is shown + tap HQ opens the interior) now; step 3 (Home → plaza region) waits for the plaza pilot decision (pilot switches stay OFF for players) | APPROVED | owner 21 Nov 2026 | Owner |
