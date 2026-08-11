# Read The Race

Read The Race is a public record of racing analysis, applied consistently
using two locked, versioned frameworks — one for horses, one for
greyhounds. Every entry follows the same stages, every entry is recorded
before the result is known, and every entry stays in the record whether it
wins or loses.

**18+. Educational racing analysis only. Gambling involves financial risk.
This site does not accept stakes or provide bookmaker services.**

Analysis on this site is AI-assisted: entries are produced by working
through the framework stages below with the help of an AI assistant, from
data available at the time. Nothing here is betting advice, and nothing
here should be read as a recommendation to stake money.

## Why this exists

Most racing "tips" are unfalsifiable: the reasoning changes after the
result, the losing calls quietly disappear, and there is no way to check
whether the method actually works. Read The Race does the opposite:

- The method is written down and locked before selections are made.
- Every selection is committed to before the result is known, with a
  timestamp.
- Every selection stays in the record, win or lose — there's no deleting
  the misses.
- Performance is reported as a strike rate with the numerator and
  denominator shown, never a bare percentage, and never dressed up as
  proof with too small a sample.

## The method

Two frameworks, kept deliberately separate because horses and greyhounds
differ enough (trap draws vs starting stalls, first-bend projection vs
race shape, GBGB rules vs BHA rules) that one set of rules would blur both:

- [**Horse framework**](horses/framework.html) — race suitability, hard
  eliminations, a weighted ranking of ability, suitability, pace and draw,
  class and weight, condition, and connections, then selection and price
  policy.
- [**Greyhound framework**](greyhounds/framework.html) — starts with the
  trap grid as a data-integrity precondition, then race suitability, hard
  eliminations, a weighted ranking led by first-bend projection and early
  pace, then selection and price policy.

Both frameworks share the same shape:

1. **Definitions** — what "proven", "recent" and "unexposed" actually mean,
   so evidence is judged consistently.
2. **Race suitability** — is this race even assessable, and what confidence
   ceiling applies given how exposed the field is.
3. **Hard eliminations** — remove runners only on clear evidence, never for
   missing evidence.
4. **Ranking** — a fixed order of weight, applied every time, so the same
   kind of evidence always carries the same kind of influence.
5. **Selection** — the most likely winner, a confidence grade (high, medium,
   low), the strongest reason, and the principal risk, all named before the
   price is looked at.
6. **Price policy** — price is recorded after the selection is made, never
   used to talk into or out of one. Selections below 2.00 don't qualify for
   action but are still recorded.
7. **No qualifying action** — recorded honestly when the evidence doesn't
   support a clear call, rather than forcing a selection.

Every entry is permanently recorded with its framework version, the
evidence considered, the selection, the confidence grade, the price at
commitment and the starting price, the result, and the principal risk
identified beforehand. A process compliance grade (A/B/C) may be added
after a separate operator review; an ungraded entry is shown plainly as
not yet reviewed. Compliance grades whether the framework was followed
properly, not whether the selection won.

Both frameworks are **locked**: the predictive rules cannot change on the
back of a single result. They only change at a scheduled review (after the
first 100 recorded selections) or through an emergency correction for a
factual error, a calculation fault, a data integrity failure, or a
regulatory change — never because a selection won or lost.

Read the full text: [horse framework](horses/framework.html) ·
[greyhound framework](greyhounds/framework.html).

## The record

- [**Horses**](horses/) — running record and entries browsable by date.
- [**Greyhounds**](greyhounds/) — running record and entries browsable by
  date.

Each sport keeps its own permanent `results.csv`. The pre-race commitment
fields — reasoning, selection, confidence, publication price and principal
risk — are immutable. Approved factual overlay fields such as result,
starting price, total runners and process-compliance status are completed
afterward, because those facts do not exist at commitment. Rows are never
quietly removed or rewritten to improve the record; the exceptional
retraction and correction processes are documented publicly in the
repository.

Individual entry pages keep these two layers visibly separate: the frozen
pre-race record is shown first, followed by result information added after
the race.

Repository maintainers can run `node scripts/validate-records.js` to check
CSV schemas, unique IDs, manifest parity, entry-file existence, result
labels, prices and runner counts. The staged form of the check also blocks
removal of permanent rows and changes to immutable commitment fields.

## Language

This site never uses "tip", "pick", "back", "bet", "lump on" or "banker",
never names or shows bookmaker logos, and never reports stakes, returns or
profit and loss. It reports what the framework selected, at what
confidence, at what price, and what happened.

## Repository layout

```
frameworks/            published framework pages (source of truth)
horses/                horse section: running record, framework, dated entries
greyhounds/             greyhound section: running record, framework, dated entries
assets/                 shared stylesheet and scripts for the GitHub Pages site
CLAUDE.md               framework text and entry conventions for AI-assisted analysis
```

---

**18+. Educational racing analysis only. Gambling involves financial risk.
This site does not accept stakes or provide bookmaker services. Analysis is
AI-assisted.**
