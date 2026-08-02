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
