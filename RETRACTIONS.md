# Retractions

An append-only log of any entry ever removed from a `results.csv` running
record, with the date and reason. This file exists so a removal is
documented and explained, not silently invisible in a diff.

**Entries are never retracted for losing.** See each framework's
Overfitting rule and the append-only rule for `results.csv` in
`CLAUDE.md` — the entire point of the record is that losing selections
stay in it. An entry is only retracted where it fails a basic data
integrity requirement the framework itself sets: for both sports, that a
selection is genuinely committed to *before* the result is known. An
entry made after the fact never satisfies that requirement, regardless of
what it says, so it was never valid data for the running record in the
first place — removing it is a correction, not editing history.

---

## 2026-08-01 — Talk Of New York, Goodwood 14:25, 31 July 2026

**Removed from:** `horses/results.csv`, `horses/entries/manifest.json`.

**Kept, marked retracted, for the audit trail:**
`horses/entries/2026/07-31/goodwood-1425.md`.

**Reason:** the entry was committed after the 14:25 race had already been
run — a test entry made while setting up the site, not a genuine pre-race
commitment. The horse framework requires selection, confidence and price
to be recorded before the result is known (Stage 4, Stage 5, Commit
rule). An entry written after the fact cannot meet that requirement no
matter how it reads, so it never qualified as valid data for the running
record.

**Not removed because it lost.** The result was a loss, but that is not
the reason — see above. Had this been a genuine pre-race commitment that
lost, it would stay in the record exactly like every other loss.
