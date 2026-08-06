# Read The Race — project instructions

Read The Race is a public, educational racing analysis record. It applies two
locked, versioned frameworks — one for horses, one for greyhounds — to
produce recorded selections with a full audit trail. It is **not** a tipping
service: no stakes, no bookmaker names, no profit and loss. Site notice on
every page: **18+. Educational racing analysis only. Gambling involves
financial risk. This site does not accept stakes or provide bookmaker
services.** Analysis on this site is AI-assisted.

## Governance

The frameworks are LOCKED (see each framework's status line). They may only
change via the **Emergency correction exception** (factual errors,
calculation faults, data integrity failures, regulatory changes — never
because a selection won or lost) or a **scheduled review** (after the first
100 recorded selections). Reopening a race for a material change is always a
**new** entry, never an edit to the original. If asked to change a
predictive rule outside those two paths, push back and point to the
Overfitting rule. Full text of all of this lives in the framework files —
see below.

**Retracting an entry** (removing a row from `results.csv` entirely) is
different from a material-change reopening, and far rarer: it's only for
an entry that fails a basic data-integrity requirement — e.g. one
committed after the result was already known, so it never satisfied
"before the race" in the first place. Never retract for losing. Log every
retraction in `RETRACTIONS.md` at the repo root with the date and reason,
and mark the original entry file (kept, not deleted) with a retraction
notice — see that file for the format and the one existing example.

**Correcting a documentation issue in an already-committed entry** (the
write-up said something wrong or inconsistent, but the entry otherwise
stands) is different again, and never involves editing the entry file —
see the Commit rule. Log it in `CORRECTIONS.md` at the repo root instead:
what the entry said, why it's wrong, and what the correct position is.
The entry stays in the record exactly as committed.

**This file is a fast operational index, not the framework.** It inlines
only the rules that must never be skipped regardless of how much context is
loaded: eliminators, confidence rules, price rules, language rules,
copyright rules. Everything else — Definitions, full Stage 1 suitability,
full Stage 3 ranking order and weighting, Stage 0/0b (greyhounds), the
Commit/Material-change/Overfitting/Emergency-correction rules, Permanent
record, Review point — is in `frameworks/HORSE-FRAMEWORK-v2.0.md` and
`frameworks/GREYHOUND-FRAMEWORK-v2.0.md`. **Read the relevant one in full
before working an entry.** If this file and a framework file ever disagree,
the framework file is authoritative.

---

## Repo structure

```
read-the-race/
  CLAUDE.md                          this file
  README.md                          public explanation of the method
  index.html                         site home: both running records, links in
  assets/css/style.css               shared dark, mobile-first stylesheet
  assets/js/markdown.js              tiny dependency-free markdown -> HTML renderer
  assets/js/csv.js                   tiny dependency-free CSV parser
  assets/js/site.js                  loads results.csv / manifest.json / entries, renders pages
  frameworks/
    HORSE-FRAMEWORK-v2.0.md          published framework page (source of truth)
    GREYHOUND-FRAMEWORK-v2.0.md      published framework page (source of truth)
  horses/
    index.html                      section home: running record + date archive
    framework.html                  renders frameworks/HORSE-FRAMEWORK-v2.0.md
    entry.html                      renders one entry: verdict card + full working
    results.csv                     append-only permanent record, one row per entry
    entries/
      manifest.json                 flat list of entries, feeds the date browser
      YYYY/MM-DD/<course-slug>-<HHMM>.md   one file per race entry
  greyhounds/
    index.html
    framework.html
    entry.html
    results.csv
    entries/
      manifest.json
      YYYY/MM-DD/<track-slug>-<HHMM>.md
```

## Workflow for a new entry

1. **Read the relevant framework file in full** before working the race —
   Definitions, Stage 1 suitability, Stage 3 ranking order, Stage 0/0b
   (greyhounds) live there, not here.
2. Work the stages in a new entry file at
   `<sport>/entries/YYYY/MM-DD/<slug>-<HHMM>.md`, using the template below.
   Create the date folder if it doesn't exist.
3. Append exactly one row to that sport's `results.csv` — append-only,
   never edit or remove a row.
4. Append one object to that sport's `entries/manifest.json` so the entry
   shows up in the date browser.
5. Material change later (withdrawal, going/distance/surface change,
   significant non-runner, changed jockey, altered draw/trap, removed pace
   influence) → reopen as a **new** entry file and a **new** CSV row. Never
   edit the original.
6. Follow the Language rules and Source/copyright rules below, everywhere.
7. Every entry needs a **complete Price section** (see Price rules below).
   An entry missing it is incomplete and must not be committed.
7a. **Before committing a batch, check every entry recording no price at
    commitment against the source card one more time.** A repo pre-commit
    hook (`scripts/check-missing-prices.sh`, installed at
    `.git/hooks/pre-commit`) blocks any commit touching an entry whose
    Price section says the price was unavailable, and requires an
    explicit `ALLOW_MISSING_PRICE=1` override to proceed. The hook can
    only see staged files, not the original source card, so it cannot
    verify a price actually existed — it exists to force a deliberate
    re-check rather than a silent default to "no qualifying action."
    Confirm with the operator before overriding if there's any doubt.
    (See CORRECTIONS.md, 5 August 2026, for the incident this closes.)
8. **Once the result is known**, fill in `result` (and `starting_price` if
   available) in the CSV row and the manifest.json entry only. **Never
   edit the entry file itself** — it stays exactly as committed pre-race,
   the frozen audit record. results.csv and manifest.json are the living
   overlay that carries what happened afterward: result, starting_price,
   material_change, process_compliance_grade (see below), going_allowance
   for greyhounds (see 8a), and nothing else. This is completing fields
   deliberately left blank/default at commitment, not editing the
   pre-race reasoning (selection, confidence, price at commitment,
   principal risk) — that part of the row is genuinely immutable.
8a. **Greyhounds: capture the going allowance from the result once
    published, if it wasn't available at commitment.** Track going
    allowance (e.g. "Going: -20") is frequently only published alongside
    the result, not on the pre-race card, so `going_allowance` in
    `results.csv` is a living-overlay field like `result` and
    `starting_price` — fill it in there once known. The entry file's
    frontmatter is never touched, per point 8: it keeps whatever was
    recorded (or "not stated") at commitment, since that reflects what
    was actually known when the Stage 0 grid was worked. The value is
    recorded for the permanent record only — never used to recompute
    calculated times or revisit the entry's ranking, since those were
    already fixed at commitment.
9. **If a material change is discovered after commitment** but a full
   reopening isn't practical (missing details, or the change only
   surfaces well after the fact), record what's known in the CSV row's
   `material_change` field — same rule as point 8: CSV only, entry file
   untouched. Note explicitly what evidence supports the finding and what
   would still be needed to reopen properly. A genuine reopening (new
   entry, new CSV row) remains the default when there's enough
   information to redo the analysis under the changed conditions.
10. **Leave `process_compliance_grade` blank at commitment — never
    self-assign it while writing the entry.** Per the framework's 2 August
    2026 definitional correction, compliance is checked against a stated
    checklist (all runners accounted for, eliminations tied to a named
    stage, complete price block, confidence matching its definition,
    language/copyright rules observed) and any grade is assigned by the
    operator afterward, not generated as part of the entry — the same
    party can't reliably grade its own work at the moment it produces it.
    If asked to audit an entry against the checklist, report what's
    present and missing item by item; do not assign a letter grade unless
    explicitly asked to.

### CSV columns

`horses/results.csv`:
```
entry_id,date,course,framework_version,time_of_commitment,code,structure,category,distance,surface,going,selection,confidence,price_at_commitment,starting_price,result,principal_risk,material_change,process_compliance_grade,operator_disagreement,entry_file
```

`greyhounds/results.csv`:
```
entry_id,date,track,framework_version,time_of_commitment,exact_distance,official_distance_designation,grade,going_allowance,trap_grid,selection,confidence,price_at_commitment,starting_price,result,principal_risk,material_change,process_compliance_grade,operator_disagreement,vacancy_testing_record,entry_file
```

These columns are the "Permanent record" fields each framework requires
(full list in the framework file) — the CSV is that record made queryable.
`entry_id` format: `YYYYMMDD-<slug>-<HHMM>`. `entry_file` is the relative
path to the full entry markdown file.

### Entry write-up style

Keep entry bodies short — this is for daily use, not an essay. The
frontmatter already carries the formal Permanent record fields; the body's
job is to show the framework was actually applied, not restate it.

- **Every runner named gets an explicit Stage 2 verdict** — no exceptions,
  no silent omissions. Eliminated: one line, stage and reason, nothing
  more (`**Runner** — eliminated, Stage 2.<n>: reason in one clause.`).
  Not eliminated: carried forward into the survivor write-up below (or,
  for an unraced/unexposed runner with nothing to assess, a one-line
  "unproven, not eliminated" note is enough). **If literally no runner is
  eliminated, say so explicitly** — a line such as "No eliminations —
  all N survive Stage 2" — rather than leaving Stage 2 silently implied
  by jumping straight to the survivor list. Before committing, check every
  name in the field appears in exactly one of: an eliminated line, a
  survivor write-up, or an explicit non-runner/unraced note.
- **Survivors:** three to four lines each — current ability/form, the
  suitability question (if any), the ranking factor that placed it. No
  sub-headers per runner, no stage-by-stage narration.
- **Verdict:** selection, confidence, strongest reason, principal risk,
  uncertain evidence. **Confidence justification must never cite pace,
  race shape or draw as a reason for capping below High** (horses only —
  see the 1 August 2026 definitional correction above). If pace/race
  shape/draw comes up at all, it belongs only in the "Uncertain at
  commitment" line, stated as a structural gap that does not affect
  confidence — never as part of the reason confidence is Medium or Low.
  Before committing, re-read the Confidence line and confirm it isn't
  smuggling pace/draw back in as a justification. (See `CORRECTIONS.md`
  for the one entry that missed this.)
- **Price:** decimal price, implied probability, whether inside the
  4/1–6/1 band, whether at/above 6.00 for each way, whether it qualifies
  for action. **Mandatory, every entry, no exceptions** — see Price rules.

### Entry file template — horses

```markdown
---
entry_id: 20260731-example-1430
date: 2026-07-31
course: Example Park
framework_version: v2.0
time_of_commitment: 13:52
code: Flat turf
structure: Handicap
category: ""
distance: ""
surface: Turf
going: ""
selection: ""
confidence: ""
price_at_commitment: ""
starting_price: ""
result: ""
principal_risk: ""
material_change: "No"
process_compliance_grade: ""
operator_disagreement: ""
---

## Field

<!-- Every runner must appear exactly once below: eliminated, carried
     forward as a survivor, or an explicit unraced/non-runner note. If
     nothing is eliminated, replace the first bullet with a single line:
     "No eliminations — all N survive Stage 2." -->

- **Runner** — eliminated, Stage 2.<n>: reason in one clause.
- **Runner** — three to four lines: current ability/form, suitability, the
  ranking factor that placed it here, anything held against it.

## Verdict

- **Selection:**
- **Confidence:** high / medium / low
  <!-- Justify with race-specific factors only. Never cite pace, race
       shape or draw here — that's a structural gap (see Confidence
       rules), not a reason to cap below High. -->
- **Strongest reason:**
- **Principal risk:**
- **Uncertain at commitment:**

## Price

- **Decimal price:**
- **Implied probability:**
- **4/1–6/1 band:** yes/no
- **Each way (6.00+):** yes/no
- **Qualifies for action:** yes/no — below 2.00 is always no; selection is
  still named and recorded regardless.
```

### Entry file template — greyhounds

```markdown
---
entry_id: 20260731-example-1932
date: 2026-07-31
track: Example Stadium
framework_version: v2.0
time_of_commitment: 19:10
exact_distance: ""
official_distance_designation: ""
grade: ""
going_allowance: ""
trap_grid: "T1 ?, T2 ?, T3 ?, T4 ?, T5 ?, T6 ?"
selection: ""
confidence: ""
price_at_commitment: ""
starting_price: ""
result: ""
principal_risk: ""
material_change: "No"
process_compliance_grade: ""
operator_disagreement: ""
vacancy_testing_record: ""
---

## Trap grid

> T1 ?, T2 ?, T3 ?, T4 ?, T5 ?, T6 ?

## Field

<!-- Every runner must appear exactly once below: eliminated, carried
     forward as a survivor, or an explicit unraced/non-runner note. If
     nothing is eliminated, replace the first bullet with a single line:
     "No eliminations — all N survive Stage 2." -->

- **Runner (Tn)** — eliminated, Stage 2.<n>: reason in one clause.
- **Runner (Tn)** — three to four lines: first-bend projection/early pace,
  calculated time, the ranking factor that placed it here, anything held
  against it.

## Verdict

- **Selection:**
- **Confidence:** high / medium / low
  <!-- Unlike horses, an uncertain first bend projection IS legitimate
       race-specific uncertainty here and can justify capping below High
       — see Confidence rules. The horse-only "never cite pace/draw"
       restriction does not apply to greyhounds. -->
- **Strongest reason:**
- **Principal risk:**
- **Uncertain at commitment:**

## Price

- **Decimal price:**
- **Implied probability:**
- **4/1–6/1 band:** yes/no
- **Each way (6.00+):** yes/no
- **Qualifies for action:** yes/no — below 2.00 is always no; selection is
  still named and recorded regardless.
- **Vacancy testing record:** n/a, or the Stage 0b checklist if a trap was
  vacant.
```

---

## Eliminators (Stage 2 — hard eliminations)

Eliminate only on clear evidence. **Never eliminate solely for missing
evidence** — that's unproven, not proven unsuitable.

**Horses:**
1. Repeated poor performance under genuinely comparable conditions
2. Current ability clearly below the level required today
3. Demonstrated inability to cope with today's trip, surface or going
4. A major tactical dependency today's likely race shape strongly contradicts

**Greyhounds:**
1. Repeated poor performance under genuinely comparable conditions
2. Current ability clearly below the grade required today
3. Demonstrated inability to cope with today's distance
4. A running style today's trap draw strongly contradicts (e.g. a confirmed
   wide runner drawn T1 with quick starters outside, or a confirmed railer
   drawn T6 needing to cross the field)
5. No credible path to the first bend given today's grid and split times

**Unproven confidence cap (both sports):** if the eventual selection relies
on unproven evidence for trip/surface/going (horses) or distance/track/trap
(greyhounds), confidence is capped at **low**. Missing evidence is recorded
as uncertainty, never as a negative.

## Confidence rules (Stage 4, plus the ceilings above)

- **High:** clear advantage across the leading ranking factors, no
  important suitability question, no major tactical contradiction.
- **Medium:** ranks first, but the advantage is narrow or one meaningful
  **race-specific** uncertainty remains.
- **Low:** depends on unproven conditions or several unresolved
  **race-specific** factors.
- Confidence reflects the quality and completeness of the evidence,
  **never the price**.
- If the leading two are essentially inseparable, record **no clear
  selection**.

Ceilings that cap confidence regardless of the above:
- More than half the field unexposed → capped at **medium** (both sports).
- Greyhounds only: low-grade race (A9/A10 and equivalent) → capped at
  **medium**.
- Unproven-evidence selection (see Eliminators) → capped at **low**.

**Definitional correction, 1 August 2026 (horses only — emergency
correction exception, not a predictive rule change).** Pace, race shape
and draw are structurally unassessable at commitment under this project's
sourcing rules (no proprietary commentary, no in-running video), every
time, regardless of the race. Counting that as "one meaningful
uncertainty" would cap every horse entry at medium or below and make the
confidence field uninformative, so it is recorded as a known structural
gap and does **not** count against confidence — see the horse framework
for the full note. This does **not** apply to greyhound first bend
projection, which is built from Stage 0's trap grid plus each runner's
own recorded history, genuinely varies race to race, and continues to
count as race-specific uncertainty under Low.

## Price rules (Stage 5–7)

Only after the selection is made, record: decimal price; implied
probability (1 ÷ decimal × 100); whether it falls inside the preferred
**4/1–6/1** publishing band.

- The band is a publishing preference, not proof of value — **never
  withhold the most likely winner for sitting outside it.** (Greyhounds:
  never build a case around a 10/1+ story dog.) Never claim "value" or a
  fair price without a documented probability method — none exists in
  v2.0, so record the price and stop.
- **Below 2.00 → does not qualify for action.** Price restriction only —
  the selection is still named and recorded in full.
- 2.00–3.00 → name the selection, state plainly the margin is thin. Above
  3.00 → report normally.
- **No qualifying action** also applies when: no clear selection reached;
  evidence is insufficient; unresolved uncertainty dominates; unexposed
  runners prevent meaningful comparison; price below 2.00. (Greyhounds
  add: the trap grid can't be reliably established — stop at Stage 0.)
- **Each way:** never below 6.00. At 6.00+, also needs suitable field
  size, acceptable place terms, a credible placing chance, and no
  excessive place-term reduction after withdrawals/non-runners. Price
  alone doesn't make it an each-way case.

**Every entry's Price section must cover all five items:** decimal price,
implied probability, 4/1–6/1 band, each-way threshold, qualifies for
action. An entry missing any of them is incomplete — do not commit it.

## Language rules

Use "the framework selects", "under this method", "the qualifying runner
is". Never use "my pick", "my tip", "back", "bet", "lump on", "banker".

No bookmaker names or logos. No stakes, no returns, no profit and loss.
Performance is reported as strike rate, with numerator and denominator.

## Source and copyright rules

The record is public, permanent and timestamped, so entries are held to a
higher standard than private analysis.

- **Never reproduce third-party content:** commercial form providers'
  written commentary and verdicts, their proprietary ratings and speed
  figures (e.g. Racing Post's TS/RPR), their form tables.
- **Facts may be stated:** course/track, date, race time, distance,
  going(-allowance), class/grade, official ratings as published by the
  regulator, weights, draw/trap, headgear declarations, finishing
  positions, official times, starting prices, published race remarks.
- **Published entries must read as original reasoning** — the framework's
  assessment in the operator's own words. Where a third-party figure
  informed a judgement, state the judgement, not the figure.
- Do not paste raw card extracts into a published entry — analyse from
  them, then write the assessment.
- If in doubt whether something is fact-of-record or a provider's
  proprietary work, **omit it**.
