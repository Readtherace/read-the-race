# Corrections

An append-only log of documentation issues found in already-committed
entries. Entry files are never edited once committed (see CLAUDE.md) —
this file records what was found and the correct position, without
altering the original. Distinct from `RETRACTIONS.md`, which is for
entries removed from the record entirely; a correction here leaves the
entry in place and in the record.

---

## 2026-08-02 — Two Tribes, Goodwood 15:35, 1 August 2026

**Entry:** `horses/entries/2026/08-01/goodwood-1535.md` (unedited).

**Issue:** the Verdict section's confidence justification reads:

> "Medium — the strongest course-and-form case in a 27-runner field, but
> pace, draw and trouble in running are genuinely unresolved in a field
> this size."

This cites pace and draw as part of the reason confidence is capped at
Medium. That contradicts the horse framework's 1 August 2026 definitional
correction (see `frameworks/HORSE-FRAMEWORK-v2.0.md` and CLAUDE.md's
Confidence rules), which states pace, race shape and draw are a known
structural gap that does not, by itself, reduce confidence — the
correction was already in effect when this entry was written, the same
day. The entry's own "Uncertain at commitment" line, two lines below,
states the correction correctly, so this is an internal inconsistency in
the entry, not a misreading of the rule elsewhere.

**Correct position:** the Medium grade for Two Tribes should be justified
by race-specific uncertainty only — the strength and size of the field
(27 runners, several plausible types) and the unresolved trouble-in-running
risk specific to a cavalry-charge sprint handicap — not by pace or draw
being unknown, which is true of every horse entry and cannot by itself
justify capping any single one below High.

**Not corrected in place.** The original entry stands exactly as
committed; this note exists so the inconsistency is visible without
altering the pre-race record. See CLAUDE.md's Entry write-up style
section for the checklist item added as a result, meant to catch this
before commit in future entries.

---

## 2026-08-05 — Five Sligo entries, price capture failure (emergency correction exception — data integrity failure)

**Entries affected:**
- `horses/entries/2026/08-05/sligo-1830.md` (Lady Patrona)
- `horses/entries/2026/08-05/sligo-1900.md` (Tatianna)
- `horses/entries/2026/08-05/sligo-1930.md` (Glen Breeze)
- `horses/entries/2026/08-05/sligo-2000.md` (Private Larry)
- `horses/entries/2026/08-05/sligo-2030.md` (Deluca Chop)

All five (unedited). `horses/results.csv` rows for these entries also
unedited — `price_at_commitment` there remains as originally recorded.

**Issue:** each entry's Price section states no price was available in
the source data at commitment. The operator has confirmed this was a
capture failure, not a genuine absence of data: a betting forecast
price existed on the source card before these races ran and was not
correctly extracted while working the batch. This is a data integrity
failure under the framework's emergency correction exception, not a
predictive rule change and not a case of reopening for later price
movement — the price being recorded below existed at the original time
of commitment.

**Correct position**, using the price at commitment supplied by the
operator, pre-race:

- **Lady Patrona** (Sligo 18:30): decimal price 2.0. Implied probability
  50.0%. Outside the 4/1–6/1 band. Not an each-way price (below 6.00).
  Qualifies for action — at exactly 2.00, the margin is thin.
- **Tatianna** (Sligo 19:00): decimal price 9.5. Implied probability
  10.5%. Outside the 4/1–6/1 band (above it). At 6.00 or above; a
  13-runner nursery handicap is a suitable field size for each-way
  terms, and she was the framework's top-ranked selection, so each-way
  is a reasonable consideration here. Qualifies for action.
- **Glen Breeze** (Sligo 19:30): decimal price 5.0. Implied probability
  20.0%. Inside the 4/1–6/1 band (at the 4/1 boundary). Not an each-way
  price (below 6.00). Qualifies for action.
- **Private Larry** (Sligo 20:00): decimal price 3.0. Implied
  probability 33.3%. Outside the 4/1–6/1 band. Not an each-way price
  (below 6.00). Qualifies for action — at exactly 3.00, the margin is
  thin.
- **Deluca Chop** (Sligo 20:30): decimal price 6.0. Implied probability
  16.7%. Inside the 4/1–6/1 band (at the 6/1 boundary). At 6.00 or
  above; a 14-runner handicap is a suitable field size for each-way
  terms, and he was the framework's top-ranked selection on a
  currently-winning run of form, so each-way is a reasonable
  consideration here. Qualifies for action.

**Not corrected in place.** `price_at_commitment` is one of the
immutable pre-race fields once an entry is committed (see CLAUDE.md);
this note exists so the correct figures are visible on the record
without altering the frozen entry files or `results.csv`. `starting_price`
and `result` will still be filled in for these entries in the normal way
once each race is run.

Machine-readable record, read by the site to overlay the corrected price
on the running record table (never written back into the entry file or
`results.csv`; the site marks any row shown this way as corrected and
links back to this section):

```
entry_id: 20260805-sligo-1830, price_at_commitment: 2.0
entry_id: 20260805-sligo-1900, price_at_commitment: 9.5
entry_id: 20260805-sligo-1930, price_at_commitment: 5.0
entry_id: 20260805-sligo-2000, price_at_commitment: 3.0
entry_id: 20260805-sligo-2030, price_at_commitment: 6.0
```

---

## 2026-08-05 — Three Yarmouth entries, same price capture failure (emergency correction exception — data integrity failure)

**Entries affected:**
- `horses/entries/2026/08-05/yarmouth-1840.md` (Dubai Charm)
- `horses/entries/2026/08-05/yarmouth-1940.md` (Highland Harvey)
- `horses/entries/2026/08-05/yarmouth-2010.md` (Banana)

All three (unedited). `horses/results.csv` rows also unedited.

**Issue:** same as the 5 August Sligo correction immediately above —
each entry's Price section states no price was available in the source
data at commitment. The operator has confirmed this was a capture
failure for these three Yarmouth entries as well.

**Correct position**, using the price at commitment supplied by the
operator, pre-race:

- **Dubai Charm** (Yarmouth 18:40): decimal price 3.25. Implied
  probability 30.8%. Outside the 4/1–6/1 band. Not an each-way price
  (below 6.00). Qualifies for action.
- **Highland Harvey** (Yarmouth 19:40): decimal price 2.88. Implied
  probability 34.7%. Outside the 4/1–6/1 band. Not an each-way price
  (below 6.00). Qualifies for action — between 2.00 and 3.00, the
  margin is thin.
- **Banana** (Yarmouth 20:10): decimal price 3.00. Implied probability
  33.3%. Outside the 4/1–6/1 band. Not an each-way price (below 6.00).
  Qualifies for action — at exactly 3.00, the margin is thin.

**Not corrected in place**, for the same reason as above:
`price_at_commitment` is immutable once committed. `starting_price` and
`result` will still be filled in normally once each race is run.

Machine-readable record, read by the site the same way as the Sligo
correction above:

```
entry_id: 20260805-yarmouth-1840, price_at_commitment: 3.25
entry_id: 20260805-yarmouth-1940, price_at_commitment: 2.88
entry_id: 20260805-yarmouth-2010, price_at_commitment: 3.0
```
