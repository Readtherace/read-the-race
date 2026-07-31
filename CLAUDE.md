# Read The Race — project instructions

Read The Race is a public, educational racing analysis record. It applies two
locked, versioned frameworks — one for horses, one for greyhounds — to
produce recorded selections with a full audit trail. It is **not** a tipping
service: no stakes, no bookmaker names, no profit and loss. Site notice on
every page: **18+. Educational racing analysis only. Gambling involves
financial risk. This site does not accept stakes or provide bookmaker
services.** Analysis on this site is AI-assisted.

This file exists so that every session applies the correct framework, by
sport, without re-explaining it. **Do not alter the framework text below.**
The frameworks are LOCKED (see each framework's status line) and may only
change via the Emergency correction exception or a scheduled review — both
described inside each framework. If asked to change predictive rules outside
those two paths, push back and point to the Overfitting rule.

The canonical, published copies of these frameworks live at
`frameworks/HORSE-FRAMEWORK-v2.0.md` and
`frameworks/GREYHOUND-FRAMEWORK-v2.0.md`, and are rendered on the site at
`/horses/framework.html` and `/greyhounds/framework.html`. The copies below
are for session context — if the two ever disagree, the files in
`frameworks/` are authoritative and this file should be regenerated from
them.

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
  assets/js/site.js                  loads results.csv / manifest.json, renders pages
  frameworks/
    HORSE-FRAMEWORK-v2.0.md          published framework page (source of truth)
    GREYHOUND-FRAMEWORK-v2.0.md      published framework page (source of truth)
  horses/
    index.html                      section home: running record + date archive
    framework.html                  renders frameworks/HORSE-FRAMEWORK-v2.0.md
    results.csv                     append-only permanent record, one row per entry
    entries/
      manifest.json                 flat list of entries, feeds the date browser
      YYYY/MM-DD/<course-slug>-<HHMM>.md   one file per race entry
  greyhounds/
    index.html
    framework.html
    results.csv
    entries/
      manifest.json
      YYYY/MM-DD/<track-slug>-<HHMM>.md
```

## Adding a new entry (either sport)

1. Work the framework stages in order (see below), in a new entry file at
   `horses/entries/YYYY/MM-DD/<course-slug>-<HHMM>.md` or
   `greyhounds/entries/YYYY/MM-DD/<track-slug>-<HHMM>.md`, using the entry
   template for that sport (below). Create the `YYYY/MM-DD` folder if it
   doesn't exist yet.
2. Append exactly one row to that sport's `results.csv` — never edit or
   remove an existing row. `results.csv` is append-only, full stop.
3. Append one object to that sport's `entries/manifest.json` so the entry
   shows up in the site's date browser.
4. If the framework's **Material change rule** applies later (a withdrawal,
   a going/going-allowance change, a distance or surface change, a
   significant non-runner, a changed jockey, an altered draw, a removed pace
   influence), reopen as a **new** entry file and a **new** CSV row. Never
   edit the original — see each framework's Reopening rule.
5. Follow each framework's **Language rules** everywhere on the site: "the
   framework selects", "under this method", "the qualifying runner is" —
   never "my pick", "tip", "back", "bet", "lump on", "banker". No bookmaker
   names or logos anywhere. No stakes, no returns, no profit and loss.
   Performance is always reported as strike rate with numerator and
   denominator, never a bare percentage.

### CSV columns

`horses/results.csv`:
```
entry_id,date,course,framework_version,time_of_commitment,code,structure,category,distance,surface,going,selection,confidence,price_at_commitment,starting_price,result,principal_risk,material_change,process_compliance_grade,operator_disagreement,entry_file
```

`greyhounds/results.csv`:
```
entry_id,date,track,framework_version,time_of_commitment,exact_distance,official_distance_designation,grade,going_allowance,trap_grid,selection,confidence,price_at_commitment,starting_price,result,principal_risk,material_change,process_compliance_grade,operator_disagreement,vacancy_testing_record,entry_file
```

These columns are the "Permanent record" fields each framework already
requires (see each framework's Permanent record section) — the CSV is just
that record made queryable. `entry_id` format: `YYYYMMDD-<slug>-<HHMM>`.
`entry_file` is the relative path to the full entry markdown file.

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

## Stage 1: Race suitability
## Stage 2: Hard eliminations
## Stage 3: Rank the survivors
## Stage 4: Selection
## Stage 5: Price policy
## Stage 6: No qualifying action (if applicable)
## Stage 7: Each way (if applicable)
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

## Stage 0: Trap grid
## Stage 1: Race suitability
## Stage 2: Hard eliminations
## Stage 3: Rank the survivors
## Stage 4: Selection
## Stage 5: Price policy
## Stage 6: No qualifying action (if applicable)
## Stage 7: Each way (if applicable)
```

---

## HORSE FRAMEWORK v2.0

# READ THE RACE: HORSE FRAMEWORK v2.0

**Effective 31 July 2026. Supersedes the 13 July 2026 framework.**
**Status: LOCKED. Scheduled review after the first 100 recorded selections.**

---

## Definitions

**Proven** under any condition means at least one recent performance close to the horse's established ability under comparable conditions, or two credible competitive performances. A distant historical win is not sufficient on its own.

**Recent** normally means within the horse's last six completed runs and sufficiently current to represent present ability. No fixed month limit applies, because National Hunt horses and seasonal Flat horses may legitimately have long gaps. Older evidence must be identified explicitly as historical and cannot establish current suitability on its own.

**A credible competitive performance** means one in which the horse performed close to its established level after accounting for class, pace, conditions and any documented trouble. Finishing position alone does not establish whether a performance was credible.

**Unproven** means the evidence does not exist. It is not the same as proven unsuitable.

**Proven unsuitable** means repeated poor performance under genuinely comparable conditions.

**Sample sizes.** Always record the numerator and denominator, for example 4 winners from 11 runs, never a bare percentage. Fewer than five relevant cases cannot support a conclusion on their own. Five to nine cases remain weak supporting evidence and cannot override the leading ranking factors.

---

## Stage 1: Race suitability

Identify, separately:

1. **Racing code:** Flat turf, Flat all weather, hurdle, chase, or National Hunt Flat
2. **Race structure:** handicap or non handicap
3. **Race category:** maiden, novice, conditions, claiming, selling, Listed, Group or Graded

Apply only the rules relevant to that combination. A race can be both a novice and a handicap. Do not treat a novice handicap as one or the other.

Confirm declarations, distance, surface, going and jockey bookings are reliable enough to assess.

**Unexposed runner definition.** A runner is unexposed where it has fewer than five relevant completed races under sufficiently comparable conditions.

**Confidence ceiling.** Where more than half the field is unexposed, confidence cannot exceed medium.

---

## Stage 2: Hard eliminations

Eliminate only on clear evidence:

1. Repeated poor performance under genuinely comparable conditions
2. Current ability clearly below the level required today
3. Demonstrated inability to cope with today's trip, surface or going
4. A major tactical dependency that today's likely race shape strongly contradicts

**Do not eliminate solely because evidence is missing.**

**Unproven confidence cap.** Where the eventual selection relies on unproven evidence for trip, surface or going, confidence is capped at low. Missing evidence is recorded as uncertainty, never treated as negative evidence.

---

## Stage 3: Rank the survivors

Assess in this order of weight:

**1. Current ability and recent form.** Underlying performance, not finishing position. Account for strength of opposition, pace of the race, trouble in running, and draw or track bias. A flattering win does not automatically outrank a strong defeat.

**2. Trip, surface, going and course suitability.** Assess today's distance, turf or artificial surface, the exact artificial surface where relevant, today's going, and course configuration including handedness, straight or turning, and the nature of the finish. Separate the evidence into proven suitable, unproven, and proven unsuitable.

**3. Pace, race shape and draw.** Classify each survivor as leader, prominent, midfield or held up. Predict whether the race contains little early pace, normal pace, several competing leaders, or excessive early pace. Assess the draw in combination with distance, course layout, expected pace, running style, field size and likely racing line. Do not apply generic low draw or high draw rules without course and distance evidence. A runner requiring an unlikely race shape is downgraded.

**4. Class, weight and handicap mark.** Credit a class drop only where the horse competed effectively at the higher level. Compare today's class, current mark, the mark from its last competitive performance, weight carried, previous success from a similar mark, and the performance improvement required to win today. Be sceptical of sharp rises requiring a substantially higher performance than the horse has ever produced.

**5. Current condition and freshness.** Time since last run, recent workload, whether the horse is progressing or declining, whether it performs well after a break, whether recent form remains relevant, and whether the latest race may have been unusually demanding. Do not treat old suitability evidence as proof of current ability.

**6. Trainer, jockey and equipment, as supporting factors only.** Consider recent trainer form, course record, race type record, the trainer and jockey partnership, sample size, and the significance of the booking. Do not rely on small sample strike rates.

**Connections and equipment must not outweigh ability, conditions and race shape.**

**Equipment and material changes** are recorded as uncertainty, not as positive or negative signals, unless repeatable recorded evidence supports an interpretation. Record: first time headgear, headgear removed, tongue strap changes, first run after wind surgery, gelded since last run, significant jockey change. Headgear remains under observation and is not a selection rule.

---

## Stage 4: Selection

Name:

1. The most likely winner
2. Confidence: high, medium or low
3. The strongest reason
4. The principal risk
5. Any evidence unavailable or uncertain at time of commitment

If the leading two are essentially inseparable, record **no clear selection**.

**Confidence definitions:**

- **High:** one runner holds a clear advantage across the leading ranking factors, with no important suitability question and no major tactical contradiction.
- **Medium:** one runner ranks first, but the advantage is narrow or one meaningful uncertainty remains.
- **Low:** a selection can be made, but it depends on unproven conditions, uncertain race shape, or several unresolved factors.

**Confidence reflects the quality and completeness of the evidence, never the price.**

**Paddock.** Where no parade feed is available at commitment, record "not assessable at time of commitment". A late drift is market information only. Do not claim it reflects paddock concerns without independent evidence.

---

## Stage 5: Price policy

**Only after the selection is made.** Record:

1. Available decimal price
2. Implied market probability, calculated as 1 divided by decimal odds, multiplied by 100
3. Whether the price falls inside the preferred 4/1 to 6/1 publishing band

**Do not claim a runner is value, or assign a fair price, unless a documented probability method has been applied.** No such method exists in v2.0, so record the price and stop there.

The 4/1 to 6/1 range is a preferred publishing band, not proof of value. **Never withhold the most likely winner because its price sits outside it.**

**Below 2.00 does not qualify for action.** This is a price restriction only. It does not mean the horse is not the most likely winner, and the selection is still named and recorded.

**Between 2.00 and 3.00**, name the selection and state plainly that the margin is thin. Above 3.00, report the price normally.

---

## Stage 6: No qualifying action

Record no qualifying action where:

1. Stages 2 and 3 produce no clear selection
2. Reliable evidence is insufficient
3. Unresolved uncertainties dominate the assessment
4. The number of unexposed runners prevents meaningful comparison between the leading candidates
5. The available price is below 2.00

More than half the field being unexposed does **not** automatically produce no qualifying action. It applies the Stage 1 confidence ceiling.

**The framework selection is still named and recorded. It simply does not qualify for action under the price policy.**

---

## Stage 7: Each way

**Never describe a runner as an each way selection below 6.00.**

At 6.00 or above, each way consideration also requires suitable field size, acceptable place terms, a credible probability of finishing in the places, and no excessive reduction in place terms following non runners.

Price alone does not make a runner an each way proposition.

---

## Commit rule

Complete the stages once, then commit. Do not reopen because of ordinary price movement, opinions, or later screenshots.

## Material change rule

Reopen only for a meaningful going change, a surface switch, a significant non runner, a changed jockey, an altered distance, a changed draw, or removal of a major pace influence.

**Reopening is recorded as a new entry, never as an edit to the original.**

## Overfitting rule

Do not create or alter a rule because of a single result. Record unusual factors under observation. Promote them into the framework only after repeated, recorded evidence.

## Emergency correction exception

Predictive rules remain locked until the scheduled review. Factual errors, calculation faults, data integrity failures and regulatory changes may be corrected immediately through a clearly recorded version change.

**Such corrections must not be justified by whether previous selections won or lost.**

---

## Permanent record

Every entry retains:

1. Framework version
2. Time of commitment
3. Race conditions: code, structure, category, course, distance, surface, going
4. Selection
5. Confidence
6. Price at commitment
7. Starting price
8. Result
9. Principal risk identified beforehand
10. Whether a material change occurred
11. Process compliance grade
12. Whether the operator disagreed with the framework output, and what they would have selected instead

Field 12 is recorded but never acted on within the entry. It is reviewed only at the scheduled review point.

**Process compliance grade, assessed blind to the result:**

- **A:** every required stage completed, evidence recorded, confidence rules followed, no framework rule breached
- **B:** the selection followed the framework, but a minor item was missing or insufficiently documented
- **C:** a material stage was skipped, evidence applied inconsistently, or a framework rule breached

**The grade must not depend on whether the horse won.** Judge the process separately from the result.

---

## Review point

Scheduled review after the first 100 recorded selections. Do not amend predictive rules before then.

Treat 100 as an initial assessment rather than proof. It remains a small sample in racing.

---

## Source and copyright rules

The record is public, permanent and timestamped, so published entries are held to a higher standard than private analysis.

**Do not reproduce third party content.** This includes commercial form providers' written commentary and verdicts, their proprietary ratings and speed figures, and their form tables reproduced as tables.

**Facts may be stated.** Course, date, race time, distance, surface, going, class, official ratings as published by the regulator, weights, draw, headgear declarations, finishing positions and starting prices are matters of record and may be stated as facts.

**Published entries must read as original reasoning.** Every entry states the framework's assessment and conclusion in the operator's own words. Where a third party figure informed a judgement, state the judgement, not the figure.

Do not paste raw card extracts into a published entry. Analyse from them, then write the assessment.

If in doubt about whether something is a fact of record or a provider's proprietary work, omit it.

---

## Language rules

Use "the framework selects", "under this method", "the qualifying runner is".

Never use "my pick", "my tip", "back", "bet", "lump on", "banker".

No bookmaker names or logos. No stakes, no returns, no profit and loss. Performance is reported as strike rate, with numerator and denominator.

Site notice: 18+. Educational racing analysis only. Gambling involves financial risk. This site does not accept stakes or provide bookmaker services.

---

## GREYHOUND FRAMEWORK v2.0

# READ THE RACE: GREYHOUND FRAMEWORK v2.0

**Effective 31 July 2026. Supersedes the 22 July 2026 framework.**
**Status: LOCKED. Scheduled review after the first 100 recorded selections.**
**Regulatory references checked against GBGB Rules of Racing effective 5 June 2026.**

---

## Definitions

**Proven** under any condition means at least one recent performance close to the greyhound's established ability under comparable conditions, or two credible competitive performances. A distant historical run is not sufficient on its own.

**Recent** means within the greyhound's last six completed runs and within the last four months, whichever is tighter. Greyhounds generally race frequently and have short careers, so form goes stale faster than in horses. Older evidence must be identified explicitly as historical and cannot establish current suitability on its own.

**A credible competitive performance** means one in which the greyhound ran close to its established level after accounting for grade, trap, race shape and any documented trouble. Finishing position alone does not establish whether a performance was credible.

**Unexposed.** A runner is unexposed where it has fewer than five relevant completed races or qualifying trials under sufficiently comparable track, distance and race conditions.

Puppy status is recorded separately as context and does **not** automatically make a greyhound unexposed. GBGB defines a puppy by age, for 24 months from and including the month of whelping, which says nothing about relevant race experience. Note also that graded runners at a new track normally require qualifying trials, so a first graded appearance may still provide track evidence where no race record exists.

**Unproven** means the evidence does not exist. It is not the same as proven unsuitable.

**Proven unsuitable** means repeated poor performance under genuinely comparable conditions.

**Sample sizes.** Always state the sample size beside a statistic, as numerator and denominator. Fewer than five comparable runs cannot be used as evidence on its own. Statistics based on five to nine runs remain weak supporting evidence. No small sample percentage may override race shape, current ability or calculated times.

---

## Stage 0: Trap grid (data integrity precondition)

**Before any assessment**, state today's trap grid explicitly:

> T1 [greyhound], T2 [greyhound], T3 [greyhound], T4 vacant, T5 [greyhound], T6 [greyhound]

Read today's trap number from the **current official racecard, live declarations or current trap grid**. Cross check each greyhound's name against its declared trap.

**Never infer the trap from visual row order. Never read it from the Trp column in previous form lines**, which is history, not today's draw.

Runners start numerically from the inside rail outwards, except where specific handicap provisions apply.

**If the current grid cannot be established reliably, the race is not assessable. Record no qualifying action and stop.**

### Stage 0b: Vacant trap adjacency (stated v2.0 hypothesis)

A vacant trap **may** give the directly adjacent greyhound additional room, particularly where the available space matches that greyhound's established running tendency.

**This is a stated v2.0 hypothesis, not an established fact.** It is retained because it is plausible, observable and testable.

Treat it as a possible tactical benefit, never as a guaranteed clean line. A greyhound with a vacancy beside it can still break slowly, move incorrectly, be pressured from its other side, or meet trouble at the bend.

**Reduce the weight of prior crowding evidence only where the evidence shows that the crowding came specifically from the side now vacant.** Do not disregard general crowding history.

**After any withdrawal, rebuild the complete trap grid and recalculate the whole first bend projection.** Do not adjust only the runner directly adjacent to the vacant trap. A withdrawal can alter pressure into the first bend, the available crossing route, which runner reaches the bend first, whether an outside runner can move inward, and whether an inside runner becomes crowded from its remaining side.

### Vacancy testing record

Where a trap is vacant, record all of the following in the entry:

1. Whether a trap was vacant
2. Which runner was directly adjacent
3. Whether the vacant space was inside or outside that runner
4. Whether that direction matched its established rail, middle or wide tendency
5. Whether previous crowding came specifically from the side now vacant
6. Whether the adjustment changed the ranking
7. Whether it changed the final selection
8. Whether it changed confidence only
9. Selection price and starting price
10. Result

**At review, separate two groups:**

- Vacancy noted but made no difference to the output
- Vacancy changed the ranking or the selection

**Only the second group tests whether the adjustment adds anything.** Report as numerator and denominator, never as a bare percentage.

If the first 100 selections contain only a small number of qualifying vacancy cases, **do not draw a conclusion**. Record the early result and continue collecting evidence. One hundred overall selections does not guarantee a meaningful sample of vacant trap cases.

---

## Stage 1: Race suitability

Identify:

1. **Exact distance and the track's official distance designation.** Do not infer suitability from generic national distance bands. GBGB recognises track specific Sprint, Standard, Standard B and Standard Long designations, and licensed races normally run between 200 and 1,105 metres. Compare performances at today's exact track and distance first, then use genuinely comparable distances only where exact evidence is limited.
2. **Race structure:** graded or open
3. **Grade or class**, and whether hurdles
4. **Published going allowance** for today's meeting. GBGB requires going allowances to be expressed mathematically as plus or minus from normal.

Confirm the grid, declarations, distance and going are reliable enough to assess.

**Confidence ceilings applied at this stage:**

- **Low grade races (A9, A10 and equivalent):** noise is high and form is unreliable. Confidence cannot exceed medium.
- **Where more than half the field is unexposed:** confidence cannot exceed medium.

---

## Stage 2: Hard eliminations

Eliminate only on clear evidence:

1. Repeated poor performance under genuinely comparable conditions
2. Current ability clearly below the grade required today
3. Demonstrated inability to cope with today's distance
4. A running style that today's trap draw strongly contradicts, for example a confirmed wide runner drawn T1 with quick starters outside it, or a confirmed railer drawn T6 needing to cross the field
5. No credible path to the first bend given today's grid and split times

**Do not eliminate solely because evidence is missing.**

**Unproven confidence cap.** Where the selection relies on unproven evidence for distance, track or trap, confidence is capped at low. Missing evidence is recorded as uncertainty, never treated as negative evidence.

---

## Stage 3: Rank the survivors

Assess in this order of weight. **The priority given to first bend projection is a stated v2.0 testing choice, not an established universal fact**, and is subject to the scheduled review.

**1. Trap draw, running style and first bend projection.** Classify each survivor as railer, mid or wide, and as quick, average or slow away on split times. Project who reaches the first bend first and who reaches it clean.

**2. Early pace via split times.** Compare split times primarily at the same track and distance. Account for the track's run to the first bend, the starting position, surface conditions and available going information. Do not compare raw splits across different tracks as though they measure the same section.

A slow starter drawn inside quick starters is exposed to crowding. A quick starter drawn outside slow ones may be able to cut across.

The importance of an early deficit depends on track configuration, distance and likely interference. **Do not apply a fixed distance threshold.**

**3. Calculated time as the speed anchor.**

**Use the calculated time as published on the card. Do not recompute it from the raw time and the going allowance.** The going adjustment has already been applied by the official timekeeper. Recomputing it risks applying the sign convention backwards, which would invert the speed anchor for every runner.

Where a manual going adjustment is genuinely unavoidable, verify the sign convention empirically first, against an actual published result showing raw winning time, going allowance and calculated time together. Do not rely on a secondary description of the convention. Record the verification and its date.

Calculated time is not necessarily an independently recorded finishing time for each greyhound. Where only the winner is timed, other calculated times are derived from beaten distances. GBGB calculations use 0.08 seconds per length in the circumstances set out in Rule 139. Do not present 0.08 as a perfect physical conversion applying identically to every greyhound, track and situation.

**Treat times from troubled runs as compromised evidence rather than automatically discarding them.**

**4. Class movement.** Credit droppers still competitive at the higher grade.

Trust a class rise only where the previous performance was trouble free and the going adjusted calculated time, early pace and overall race performance indicate the greyhound can remain competitive at the higher grade. **Winning margin alone is not sufficient**, since margin is mechanically linked to time and a wide margin in a slow time may be less impressive than a narrow one in a strong time.

**5. Track, trap and class record** via stat blocks, subject to the sample size rules. Recent trap statistics are a tiebreaker only, never a primary reason.

**6. Trouble pattern.** Repeated crowding, blocking or bumping remarks indicate a **recurring interference risk**.

Do not conclude that the greyhound creates the trouble unless race comments or available video repeatedly show self created movement: checking itself, turning inward, moving off, or failing to hold its line.

RnOn after trouble shows the greyhound continued strongly. It does **not** by itself prove the greyhound will overcome similar interference today.

**7. Condition and freshness.** Days since last run, whether the greyhound is progressing or declining, whether recent form remains relevant.

**Racing weight.** Record the recent racing weight pattern and any notable change. GBGB records weight at kennelling to the nearest 100 grams, and a variation of more than one kilogram from the previous recorded race or trial weight requires withdrawal and a subsequent trial before racing again. Weight is supporting condition evidence, **not** an automatic positive or negative signal. Where today's kennelling weight is unavailable at commitment, record it as not assessable.

---

## Stage 4: Selection

Name:

1. The most likely winner
2. Confidence: high, medium or low
3. The strongest reason
4. The principal risk
5. Any evidence unavailable or uncertain at commitment

If the leading two are essentially inseparable, record **no clear selection**.

**Confidence definitions:**

- **High:** one greyhound holds a clear advantage across the leading ranking factors, with no important suitability question and no major tactical contradiction.
- **Medium:** one greyhound ranks first, but the advantage is narrow or one meaningful uncertainty remains.
- **Low:** a selection can be made, but it depends on unproven conditions, an uncertain first bend projection, or several unresolved factors.

**Confidence reflects the quality and completeness of the evidence, never the price.**

---

## Stage 5: Price policy

**Only after the selection is made.** Record:

1. Available decimal price
2. Implied market probability, calculated as 1 divided by decimal odds, multiplied by 100
3. Whether the price falls inside the preferred 4/1 to 6/1 publishing band

**Do not claim a greyhound is value, or assign a fair price, unless a documented probability method has been applied.** No such method exists in v2.0, so record the price and stop there.

The 4/1 to 6/1 range is a preferred publishing band, not proof of value. **Never withhold the most likely winner because its price sits outside it.** Never build a case around a 10/1 or bigger story dog.

**Below 2.00 does not qualify for action.** This is a price restriction only. The selection is still named and recorded.

**Between 2.00 and 3.00**, name the selection and state plainly that the margin is thin. Above 3.00, report the price normally.

---

## Stage 6: No qualifying action

Record no qualifying action where:

1. The current trap grid cannot be established reliably
2. Stages 2 and 3 produce no clear selection
3. Reliable evidence is insufficient
4. Unresolved uncertainties dominate the assessment
5. The number of unexposed runners prevents meaningful comparison between the leading candidates
6. The available price is below 2.00

More than half the field being unexposed does **not** automatically produce no qualifying action. It applies the Stage 1 confidence ceiling.

**The framework selection is still named and recorded. It simply does not qualify for action under the price policy.**

---

## Stage 7: Each way

**Never describe a runner as an each way selection below 6.00.**

At 6.00 or above, each way consideration also requires suitable field size, acceptable place terms, a credible probability of finishing in the places, and no excessive reduction in place terms following withdrawals.

Note that six runner fields frequently offer two places only, so place terms are often thin. Price alone does not make a runner an each way proposition.

---

## Commit rule

Complete the stages once, then commit. Do not reopen because of ordinary price movement, opinions, or later screenshots.

## Material change rule

Reopen only for a withdrawal changing the trap grid, a going allowance change, a distance change, or a track switch.

**A withdrawal is material by definition**, since it alters the grid and requires a full first bend recalculation under Stage 0b.

**Reopening is recorded as a new entry, never as an edit to the original.**

## Overfitting rule

Do not create or alter a rule because of a single result. Record unusual factors under observation. Promote them into the framework only after repeated, recorded evidence.

## Emergency correction exception

Predictive rules remain locked until the scheduled review. Factual errors, calculation faults, data integrity failures and regulatory changes may be corrected immediately through a clearly recorded version change.

**Such corrections must not be justified by whether previous selections won or lost.**

---

## Permanent record

Every entry retains:

1. Framework version
2. Time of commitment
3. Track, exact distance, official distance designation, grade, going allowance
4. **Trap grid exactly as stated at Stage 0**
5. Selection
6. Confidence
7. Price at commitment
8. Starting price
9. Result
10. Principal risk identified beforehand
11. Whether a material change occurred
12. Process compliance grade
13. Whether the operator disagreed with the framework output, and what they would have selected instead
14. **Vacancy testing record** where a trap was vacant, per Stage 0b

Field 13 is recorded but never acted on within the entry. It is reviewed only at the scheduled review point.

**Process compliance grade, assessed blind to the result:**

- **A:** every required stage completed, evidence recorded, confidence rules followed, no framework rule breached
- **B:** the selection followed the framework, but a minor item was missing or insufficiently documented
- **C:** a material stage was skipped, evidence applied inconsistently, or a framework rule breached

**The grade must not depend on whether the greyhound won.** Judge the process separately from the result.

---

## Review point

Scheduled review after the first 100 recorded selections. Do not amend predictive rules before then.

Treat 100 as an initial assessment rather than proof. It remains a small sample, and the vacancy sub sample will be smaller still.

---

## Source and copyright rules

The record is public, permanent and timestamped, so published entries are held to a higher standard than private analysis.

**Do not reproduce third party content.** This includes commercial form providers' written commentary and verdicts, their proprietary ratings and speed figures, and their form tables reproduced as tables.

**Facts may be stated.** Track, date, race time, distance, grade, going allowance, trap grid, finishing positions, official times, starting prices and published race remarks are matters of record and may be stated as facts.

**Published entries must read as original reasoning.** Every entry states the framework's assessment and conclusion in the operator's own words. Where a third party figure informed a judgement, state the judgement, not the figure.

Do not paste raw card extracts into a published entry. Analyse from them, then write the assessment.

If in doubt about whether something is a fact of record or a provider's proprietary work, omit it.

---

## Language rules

Use "the framework selects", "under this method", "the qualifying runner is".

Never use "my pick", "my tip", "back", "bet", "lump on", "banker".

No bookmaker names or logos. No stakes, no returns, no profit and loss. Performance is reported as strike rate, with numerator and denominator.

Site notice: 18+. Educational racing analysis only. Gambling involves financial risk. This site does not accept stakes or provide bookmaker services.
