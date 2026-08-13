/* Read The Race — shared page behaviour. Depends on csv.js and markdown.js. */

async function fetchText(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.text();
  } catch (e) {
    return null;
  }
}

async function loadCSVRows(url) {
  const text = await fetchText(url);
  if (text === null) return [];
  return csvToObjects(text);
}

async function loadJSON(url) {
  const text = await fetchText(url);
  if (text === null) return [];
  try {
    return JSON.parse(text);
  } catch (e) {
    return [];
  }
}

function classifyResult(result) {
  const r = (result || "").trim().toLowerCase();
  if (!r) return "pending";
  if (r.includes("no qualifying")) return "no-action";
  if (/^nr\b/.test(r) || r.includes("void") || r.includes("non-runner") || r.includes("nonrunner") || r.includes("non runner")) return "void";
  if (/^(win|won|1st)\b/.test(r)) return "win";
  return "lose";
}

function resultClass(result) {
  const k = classifyResult(result);
  if (k === "win") return "result-win";
  if (k === "void" || k === "no-action" || k === "pending") return "result-void";
  return "result-lose";
}

/*
 * Parses CORRECTIONS.md's machine-readable "entry_id: X, price_at_commitment: Y"
 * lines (inside fenced code blocks) into a map keyed by entry_id, each
 * tagged with the slug of the heading section it appeared under. The slug
 * is computed with the same slugify()/uniqueness rules renderMarkdown uses
 * for opts.headingIds (see markdown.js), so it matches what corrections.html
 * actually renders as that section's id — this is a plain-text scan, not
 * the full block parser, so it only needs to track headings and the record
 * lines, not every markdown construct in between.
 */
function parseCorrections(text) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const seenSlugs = {};
  let currentSlug = "";
  const byEntryId = {};

  lines.forEach((line) => {
    const headingMatch = /^#{1,6}\s+(.+)$/.exec(line);
    if (headingMatch) {
      let slug = slugify(headingMatch[1]) || "section";
      if (seenSlugs[slug]) {
        seenSlugs[slug]++;
        slug = `${slug}-${seenSlugs[slug]}`;
      } else {
        seenSlugs[slug] = 1;
      }
      currentSlug = slug;
      return;
    }
    const recordMatch = /^entry_id:\s*([\w-]+),\s*price_at_commitment:\s*([\d.]+)\s*$/.exec(line.trim());
    if (recordMatch) {
      byEntryId[recordMatch[1]] = { price: recordMatch[2], slug: currentSlug };
    }
  });

  return byEntryId;
}

/* Fetches and parses CORRECTIONS.md. Returns {} (no corrections applied)
 * if the file can't be fetched, rather than failing the whole page. */
async function loadCorrections(url) {
  const text = await fetchText(url);
  if (text === null) return {};
  return parseCorrections(text);
}

/*
 * Attaches a corrected price onto rows/frontmatter objects that have no
 * price of their own recorded, purely for display — never mutates
 * price_at_commitment itself, and never overrides a price that IS
 * recorded (a correction only ever fills a genuine gap). corrections is
 * the map returned by loadCorrections/parseCorrections.
 */
function applyCorrections(items, corrections) {
  items.forEach((item) => {
    const hasPrice = !!(item.price_at_commitment && String(item.price_at_commitment).trim());
    const fix = corrections[item.entry_id];
    if (!hasPrice && fix) {
      item._correctedPrice = fix.price;
      item._correctionSlug = fix.slug;
    }
  });
  return items;
}

/* Price block for display purposes: the recorded price if there is one,
 * otherwise a corrected price applied by applyCorrections, tagged so
 * callers can show it was corrected and link back to the correction. */
function effectivePriceBlock(item) {
  const raw = computePriceBlock(item.price_at_commitment);
  if (raw.price !== null) return Object.assign({ corrected: false }, raw);
  if (item._correctedPrice) {
    const corrected = computePriceBlock(item._correctedPrice);
    return Object.assign({ corrected: true, correctionSlug: item._correctionSlug }, corrected);
  }
  return Object.assign({ corrected: false }, raw);
}

/* A literal "No clear selection" record is not a named runner. */
function hasNamedSelection(row) {
  const selection = (row.selection || "").trim().toLowerCase();
  return !!selection && selection !== "no clear selection";
}

/*
 * Whether an entry qualifies for action under the Stage 5 price policy:
 * a selection was named AND the recorded (or corrected) price is 2.00 or
 * above. This is independent of whether the result is known yet —
 * qualification is decided at commitment, not at settlement.
 */
function qualifiesForAction(row) {
  const pb = effectivePriceBlock(row);
  return hasNamedSelection(row) && pb.qualifies === true;
}

/* True when a row has a named selection but genuinely no price on record
 * at all — not even a correction. Distinct from "below 2.00": this is a
 * data gap, not a Stage 5 rule outcome, and must never be labelled or
 * counted as "no qualifying action". */
function isPriceUnrecorded(row) {
  return hasNamedSelection(row) && effectivePriceBlock(row).price === null;
}

/* Extracts the race off-time from entry_id's YYYYMMDD-<slug>-HHMM suffix. */
function raceTimeFromEntryId(entryId) {
  const m = /-(\d{2})(\d{2})$/.exec(entryId || "");
  return m ? `${m[1]}:${m[2]}` : "";
}

/* Formats an ISO date (YYYY-MM-DD) as UK DD/MM/YYYY. Passes through anything
 * that isn't a plain ISO date rather than mangling it. */
function formatDateUK(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
  if (!m) return iso || "";
  return `${m[3]}/${m[2]}/${m[1]}`;
}

/* Today's date as YYYY-MM-DD in the visitor's local time, to match against
 * the ISO dates stored in results.csv / manifest.json. */
function todayIso() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/*
 * Groups rows by venue (course/track), sorts each group's races by time,
 * and orders the groups by their own earliest race time. Used inside a
 * single date — see groupByDateThenVenue for the Resulted table, which is
 * this same grouping applied once per date.
 */
function groupByVenueSorted(rows, venueKey) {
  const groups = {};
  rows.forEach((r) => {
    const venue = r[venueKey] || "Unknown";
    if (!groups[venue]) groups[venue] = [];
    groups[venue].push(r);
  });
  const list = Object.keys(groups).map((venue) => {
    const sorted = groups[venue].slice().sort((a, b) =>
      raceTimeFromEntryId(a.entry_id).localeCompare(raceTimeFromEntryId(b.entry_id))
    );
    return { venue, rows: sorted, firstTime: raceTimeFromEntryId(sorted[0].entry_id) };
  });
  list.sort((a, b) => a.firstTime.localeCompare(b.firstTime));
  return list;
}

/* Groups rows by date (most recent first), then by venue within each date. */
function groupByDateThenVenue(rows, venueKey) {
  const dateGroups = {};
  rows.forEach((r) => {
    const d = r.date || "";
    if (!dateGroups[d]) dateGroups[d] = [];
    dateGroups[d].push(r);
  });
  const dates = Object.keys(dateGroups).sort((a, b) => b.localeCompare(a));
  return dates.map((date) => ({ date, venues: groupByVenueSorted(dateGroups[date], venueKey) }));
}

/* Parses a starting price (stored as plain decimal odds, same convention as
 * price_at_commitment) for display. Returns null when not yet populated. */
function formatStartingPrice(str) {
  const n = parseFloat(str);
  return isNaN(n) ? null : n.toFixed(2);
}

/* One race row: time, selection, price at publication, starting price, each
 * way, result, total runners, confidence. Date and venue are conveyed by the group header
 * above, not repeated here. Starting price is a separate field from price at
 * publication (price_at_commitment internally) — it's only populated once a
 * result is known, and never overwrites the publication price. Each cell
 * carries data-label so the mobile stacked-card layout (see style.css) can
 * show the column name without duplicating markup here. */
/* Footnote shown below a race table only when at least one of its rows
 * carries a corrected price (see raceRowHtml's price-marker). Same
 * one-level-below-root path assumption as raceRowHtml. */
function correctionFootnoteHtml(rows) {
  const hasCorrection = rows.some((r) => effectivePriceBlock(r).corrected);
  if (!hasCorrection) return "";
  return '<p class="table-footnote">† price recorded via logged correction, see <a href="../corrections.html">CORRECTIONS.md</a>.</p>';
}

/* Builds a link from a CSV entry_file path to the sport's entry viewer.
 * Both sport index pages sit alongside entry.html, so only the path below
 * horses/entries or greyhounds/entries belongs in the query string. */
function entryViewerHref(row) {
  const file = (row.entry_file || "").replace(/^(horses|greyhounds)\/entries\//, "");
  return file ? `entry.html?file=${encodeURIComponent(file)}` : "";
}

/* Assumes it's always rendered from a page one level below repo root
 * (horses/index.html, greyhounds/index.html) — the corrections.html link
 * below is relative to that. Update if raceRowHtml grows other callers. */
function raceRowHtml(r, showTotalRunners) {
  const raceTime = raceTimeFromEntryId(r.entry_id);
  const pb = effectivePriceBlock(r);
  const qualifies = qualifiesForAction(r);
  const unrecorded = isPriceUnrecorded(r);
  const eachWayPriceTest = pb.price !== null ? (pb.eachWayEligible ? "Met" : "Not met") : "—";
  const sp = formatStartingPrice(r.starting_price);

  const viewerHref = entryViewerHref(r);
  const selectionName = mdEscape(r.selection || "");
  const linkedSelection = viewerHref
    ? `<a class="entry-row-link" href="${viewerHref}">${selectionName}</a>`
    : selectionName;
  let selectionHtml;
  if (qualifies) {
    selectionHtml = linkedSelection;
  } else if (unrecorded) {
    selectionHtml = linkedSelection;
  } else {
    selectionHtml = `<span class="no-action-label">No qualifying action</span><span class="no-action-runner">${linkedSelection}</span>`;
  }

  // The marker slot is always emitted, empty when there's no correction,
  // so every numeric price cell reserves the same trailing width and
  // prices align regardless of whether a given row carries a marker.
  let priceHtml;
  if (unrecorded) {
    priceHtml = '<span class="price-unrecorded">Price not recorded</span>';
  } else if (pb.price !== null) {
    const marker = pb.corrected
      ? `<a class="price-marker" href="../corrections.html#${mdEscape(pb.correctionSlug)}" title="Price recorded via logged correction — see CORRECTIONS.md">†</a>`
      : '<span class="price-marker"></span>';
    priceHtml = `<span class="price-num">${pb.price.toFixed(2)}</span>${marker}`;
  } else {
    priceHtml = "—";
  }

  return `<tr>
    <td class="price-cell" data-label="Race Time">${mdEscape(raceTime)}</td>
    <td class="selection-cell" data-label="Selection">${selectionHtml}</td>
    <td class="price-cell" data-label="Price at publication">${priceHtml}</td>
    <td class="price-cell" data-label="Starting Price">${sp !== null ? sp : "—"}</td>
    <td data-label="Each-way price test">${eachWayPriceTest}</td>
    <td class="${resultClass(r.result)}" data-label="Result">${mdEscape(r.result || "pending")}</td>
    ${showTotalRunners ? `<td data-label="Total Runners">${mdEscape(r.total_runners || "—")}</td>` : ""}
    <td data-label="Confidence">${mdEscape(r.confidence || "")}</td>
  </tr>`;
}

/* Proportional column widths: Selection gets the most room (it holds the
 * only variable-length prose) without dominating the row; the four numeric/
 * short-text columns stay narrow. Only affects the desktop table — the
 * mobile stacked-card layout (see style.css) ignores colgroup widths. */
function raceTableHead(showTotalRunners, caption) {
  return `<colgroup>
  <col class="col-time"><col class="col-selection"><col class="col-price"><col class="col-sp"><col class="col-ew"><col class="col-result">${showTotalRunners ? '<col class="col-runners">' : ""}<col class="col-conf">
</colgroup>
<caption class="sr-only">${mdEscape(caption || "Race record")}</caption>
<thead><tr>
  <th scope="col">Race Time</th><th scope="col">Selection</th><th scope="col"><span class="header-line">Price at</span><span class="header-line">publication</span></th><th scope="col"><span class="header-line">Starting</span><span class="header-line">price</span></th><th scope="col"><span class="header-line">Each-way</span><span class="header-line">price test</span></th><th scope="col">Result</th>${showTotalRunners ? '<th scope="col"><span class="header-line">Total</span><span class="header-line">runners</span></th>' : ""}<th scope="col">Confidence</th>
</tr></thead>`;
}

function eachWayPriceFootnoteHtml() {
  return '<p class="table-footnote">“Met” means the publication price was 6.00 or higher, which opens each-way consideration. Price alone does not make a selection an each-way case; field size, place terms and a credible placing chance must also be suitable.</p>';
}

/* Renders the stat-tile summary for one sport's results.csv rows. */
function renderStats(el, rows) {
  if (!rows.length) {
    el.innerHTML = '<div class="empty-state">No entries recorded yet. Check back after the next meeting.</div>';
    return;
  }

  let wins = 0;
  let decided = 0;
  let qualifying = 0;
  let pendingQualifying = 0;
  let belowThreshold = 0;
  let noSelection = 0;
  let voids = 0;
  let unrecorded = 0;
  let complianceReviewed = 0;
  let namedSelections = 0;

  rows.forEach((r) => {
    if ((r.process_compliance_grade || "").trim()) complianceReviewed++;
    if (!hasNamedSelection(r)) {
      noSelection++;
      return;
    }
    namedSelections++;
    if (isPriceUnrecorded(r)) {
      unrecorded++;
      return;
    }
    if (qualifiesForAction(r)) {
      qualifying++;
      const k = classifyResult(r.result);
      if (k === "win") { wins++; decided++; }
      else if (k === "lose") { decided++; }
      else if (k === "pending") { pendingQualifying++; }
      else if (k === "void") { voids++; }
    } else {
      belowThreshold++;
    }
  });

  const pct = decided > 0 ? Math.round((wins / decided) * 1000) / 10 : null;
  const strikeRateText = decided > 0
    ? `${wins}/${decided}${pct !== null ? ` (${pct}%)` : ""}`
    : "0/0";

  const unrecordedTile = unrecorded > 0
    ? `<div class="stat-tile"><div class="value">${unrecorded}</div><div class="label">Price not recorded</div></div>`
    : "";

  const reviewCount = Math.min(namedSelections, 100);
  const reviewPct = Math.min(100, reviewCount);

  el.innerHTML = `
    <div class="stat-row">
      <div class="stat-tile"><div class="value">${rows.length}</div><div class="label">Entries</div></div>
      <div class="stat-tile"><div class="value">${qualifying}</div><div class="label">Qualifying entries</div></div>
      <div class="stat-tile"><div class="value">${strikeRateText}</div><div class="label">Qualifying strike rate</div></div>
      <div class="stat-tile"><div class="value">${decided}</div><div class="label">Settled qualifying</div></div>
      <div class="stat-tile"><div class="value">${pendingQualifying}</div><div class="label">Pending qualifying</div></div>
      <div class="stat-tile"><div class="value">${voids}</div><div class="label">Void / NR</div></div>
      <div class="stat-tile"><div class="value">${belowThreshold}</div><div class="label">Below 2.00</div></div>
      <div class="stat-tile"><div class="value">${noSelection}</div><div class="label">No clear selection</div></div>
      <div class="stat-tile"><div class="value">${complianceReviewed}/${rows.length}</div><div class="label">Compliance reviewed</div></div>
      ${unrecordedTile}
    </div>
    <div class="review-progress" aria-label="${reviewCount} of 100 named selections recorded before the scheduled framework review">
      <div class="review-progress-copy"><strong>Scheduled review progress</strong><span>${reviewCount}/100 named selections</span></div>
      <div class="review-progress-track" aria-hidden="true"><span style="width:${reviewPct}%"></span></div>
      <p>The predictive rules remain locked until the scheduled review point.</p>
    </div>`;
}

function resultFilterKey(row) {
  const result = (row.result || "").trim().toLowerCase();
  const kind = classifyResult(result);
  if (kind === "pending") return "pending";
  if (kind === "win") return "won";
  if (kind === "void") return "void";
  if (kind === "no-action") return "no-selection";
  if (/^(pu|f|ur|rr|ro|bd|co)\b/.test(result)) return "dnf";
  return "finished";
}

function filterRecordRows(rows, venueKey, filters) {
  const search = (filters.search || "").trim().toLowerCase();
  return rows.filter((row) => {
    if (filters.date && row.date !== filters.date) return false;
    if (filters.venue && row[venueKey] !== filters.venue) return false;
    if (filters.confidence && (row.confidence || "").toLowerCase() !== filters.confidence) return false;
    if (filters.result && resultFilterKey(row) !== filters.result) return false;
    if (filters.qualification === "qualifying" && !qualifiesForAction(row)) return false;
    if (filters.qualification === "no-action" && (qualifiesForAction(row) || isPriceUnrecorded(row))) return false;
    if (filters.qualification === "unrecorded" && !isPriceUnrecorded(row)) return false;
    if (search) {
      const haystack = [row.selection, row[venueKey], row.date, row.result].join(" ").toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });
}

function renderRecordFilters(el, rows, venueKey, onChange) {
  const dates = [...new Set(rows.map((r) => r.date).filter(Boolean))].sort((a, b) => b.localeCompare(a));
  const venues = [...new Set(rows.map((r) => r[venueKey]).filter(Boolean))].sort();
  const venueLabel = venueKey === "course" ? "Course" : "Track";

  el.innerHTML = `
    <form class="record-filters" aria-label="Filter resulted entries">
      <label>Search<input type="search" name="search" placeholder="Selection or ${venueLabel.toLowerCase()}" autocomplete="off"></label>
      <label>Date<select name="date"><option value="">All dates</option>${dates.map((d) => `<option value="${mdEscape(d)}">${mdEscape(formatDateUK(d))}</option>`).join("")}</select></label>
      <label>${venueLabel}<select name="venue"><option value="">All ${venueLabel.toLowerCase()}s</option>${venues.map((v) => `<option value="${mdEscape(v)}">${mdEscape(v)}</option>`).join("")}</select></label>
      <label>Confidence<select name="confidence"><option value="">All levels</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></label>
      <label>Result<select name="result"><option value="">All results</option><option value="won">Won</option><option value="finished">Finished, non-win</option><option value="dnf">Did not finish</option><option value="void">NR / void</option><option value="pending">Pending</option><option value="no-selection">No clear selection</option></select></label>
      <label>Price policy<select name="qualification"><option value="">All entries</option><option value="qualifying">Qualifying</option><option value="no-action">No qualifying action</option><option value="unrecorded">Price not recorded</option></select></label>
      <button type="reset" class="filter-reset">Clear filters</button>
    </form>`;

  const form = el.querySelector("form");
  const emit = () => {
    const values = Object.fromEntries(new FormData(form).entries());
    onChange(values);
  };
  form.addEventListener("input", emit);
  form.addEventListener("change", emit);
  form.addEventListener("reset", () => setTimeout(emit, 0));
  emit();
}

/*
 * "Today" table: races dated today that don't have a result yet. Grouped
 * by venue, each venue block sorted earliest race first, venues ordered by
 * their own earliest race. A race leaves this table the moment it settles
 * — see renderResultedTable.
 */
function renderTodayTable(el, rows, venueKey) {
  const today = todayIso();
  const todayRows = rows.filter((r) => r.date === today && classifyResult(r.result) === "pending");
  const showTotalRunners = venueKey === "course";

  if (!todayRows.length) {
    el.innerHTML = '<div class="empty-state">No races entered for today yet.</div>';
    return;
  }

  const venues = groupByVenueSorted(todayRows, venueKey);
  const body = venues.map((v) =>
    `<tr class="group-header-course"><th scope="rowgroup" colspan="${showTotalRunners ? 8 : 7}">${mdEscape(v.venue)}</th></tr>` +
    v.rows.map((r) => raceRowHtml(r, showTotalRunners)).join("")
  ).join("");

  el.innerHTML = `
    <div class="table-scroll">
      <table class="${showTotalRunners ? "with-total-runners" : ""}">
        ${raceTableHead(showTotalRunners, "Today's recorded races")}
        <tbody>${body}</tbody>
      </table>
    </div>
    ${eachWayPriceFootnoteHtml()}
    ${correctionFootnoteHtml(todayRows)}`;
}

/*
 * "Resulted" table: everything not shown in Today — i.e. any race with a
 * settled result, plus any pending race left over from a previous day.
 * Grouped by date (most recent first), then by venue within each date,
 * same earliest-first sort as Today.
 */
function renderResultedTable(el, rows, venueKey, filters) {
  const today = todayIso();
  const baseRows = rows.filter((r) => !(r.date === today && classifyResult(r.result) === "pending"));
  const resultedRows = filterRecordRows(baseRows, venueKey, filters || {});
  const showTotalRunners = venueKey === "course";

  if (!resultedRows.length) {
    el.innerHTML = '<div class="empty-state">No entries match these filters.</div>';
    return;
  }

  const dateGroups = groupByDateThenVenue(resultedRows, venueKey);
  const body = dateGroups.map((dg) => {
    const dateHeader = `<tr class="group-header-date"><th scope="rowgroup" colspan="${showTotalRunners ? 8 : 7}">${formatDateUK(dg.date)}</th></tr>`;
    const venueRows = dg.venues.map((v) =>
      `<tr class="group-header-course"><th scope="rowgroup" colspan="${showTotalRunners ? 8 : 7}">${mdEscape(v.venue)}</th></tr>` +
      v.rows.map((r) => raceRowHtml(r, showTotalRunners)).join("")
    ).join("");
    return dateHeader + venueRows;
  }).join("");

  el.innerHTML = `
    <p class="filter-summary" role="status">Showing ${resultedRows.length} of ${baseRows.length} entries.</p>
    <div class="table-scroll">
      <table class="${showTotalRunners ? "with-total-runners" : ""}">
        ${raceTableHead(showTotalRunners, "Resulted and historical recorded races")}
        <tbody>${body}</tbody>
      </table>
    </div>
    ${eachWayPriceFootnoteHtml()}
    ${correctionFootnoteHtml(resultedRows)}`;
}

/* Renders a compact strike-rate-only summary card, used on the site home page. */
function renderRunningRecordSummary(el, rows) {
  if (!rows.length) {
    el.innerHTML = '<div class="empty-state">No entries recorded yet.</div>';
    return;
  }
  let wins = 0;
  let decided = 0;
  rows.forEach((r) => {
    if (!qualifiesForAction(r)) return;
    const k = classifyResult(r.result);
    if (k === "win") { wins++; decided++; }
    else if (k === "lose") { decided++; }
  });
  const pct = decided > 0 ? Math.round((wins / decided) * 1000) / 10 : null;
  const strikeRateText = decided > 0 ? `${wins}/${decided}${pct !== null ? ` (${pct}%)` : ""}` : "0/0";

  el.innerHTML = `
    <div class="stat-row">
      <div class="stat-tile"><div class="value">${rows.length}</div><div class="label">Entries</div></div>
      <div class="stat-tile"><div class="value">${strikeRateText}</div><div class="label">Qualifying strike rate</div></div>
    </div>`;
}

/*
 * Form strip: the last 20 selections (oldest to most recent, left to
 * right — the same reading order as a horse's own form figures), as small
 * squares. Filled = won, outlined = lost, faded = didn't qualify for
 * action (void results are folded into "faded" too, since neither counts
 * as a genuine win or loss).
 */
function renderFormStrip(el, rows) {
  const sorted = rows.slice().sort((a, b) => {
    const da = `${a.date || ""} ${raceTimeFromEntryId(a.entry_id)}`;
    const db = `${b.date || ""} ${raceTimeFromEntryId(b.entry_id)}`;
    return da.localeCompare(db);
  });
  const last20 = sorted.slice(-20);

  if (!last20.length) {
    el.innerHTML = '<div class="form-strip empty-state">No selections recorded yet.</div>';
    return;
  }

  const squares = last20.map((r) => {
    const qualifies = qualifiesForAction(r);
    const unrecorded = isPriceUnrecorded(r);
    const k = classifyResult(r.result);
    let cls = "form-pending";
    let label = "pending";
    if (unrecorded) {
      cls = "form-unrecorded";
      label = "price not recorded";
    } else if (!qualifies) {
      cls = "form-no-action";
      label = "no qualifying action";
    } else if (k === "win") {
      cls = "form-win";
      label = "won";
    } else if (k === "lose") {
      cls = "form-lose";
      label = "lost";
    } else if (k === "void") {
      cls = "form-no-action";
      label = "void";
    }
    const title = `${r.selection || "—"} — ${label} (${formatDateUK(r.date)})`;
    return `<span class="form-square ${cls}" role="img" aria-label="${mdEscape(title)}" title="${mdEscape(title)}"></span>`;
  }).join("");

  const sampleNote = last20.length < 10
    ? `Last ${last20.length} of ${rows.length} recorded, oldest to most recent — sample under 10, not yet meaningful.`
    : `Last ${last20.length} of ${rows.length} recorded, oldest to most recent.`;

  el.innerHTML = `
    <div class="form-strip">
      <div class="form-strip-row" aria-label="Recent form, oldest to most recent">${squares}</div>
      <p class="form-strip-caption">${mdEscape(sampleNote)}</p>
      <div class="form-strip-legend">
        <span><span class="form-square form-win" aria-hidden="true"></span>Won</span>
        <span><span class="form-square form-lose" aria-hidden="true"></span>Lost</span>
        <span><span class="form-square form-no-action" aria-hidden="true"></span>No qualifying action</span>
        <span><span class="form-square form-unrecorded" aria-hidden="true"></span>Price not recorded</span>
      </div>
    </div>`;
}

/* Shared renderer for the two bar charts — one row per band/level, bar
 * length proportional to strike rate, numerator/denominator always shown
 * as text (never a bare percentage), with a small-sample note per row. */
function renderBarChart(el, title, subtitle, buckets) {
  const rowsHtml = buckets.map((b) => {
    const pct = b.decided > 0 ? Math.round((b.wins / b.decided) * 100) : 0;
    const valueText = b.decided > 0 ? `${b.wins}/${b.decided} (${pct}%)` : "0/0";
    const note = b.decided > 0 && b.decided < 10
      ? '<span class="bar-row-note">Sample under 10 — not yet meaningful.</span>'
      : "";
    return `
      <div class="bar-row">
        <div class="bar-row-label">${mdEscape(b.label)}</div>
        <div>
          <div class="bar-row-track-wrap">
            <div class="bar-track" aria-hidden="true"><div class="bar-fill" style="width:${b.decided > 0 ? pct : 0}%"></div></div>
            <div class="bar-row-value">${valueText}</div>
          </div>
          ${note}
        </div>
      </div>`;
  }).join("");

  el.innerHTML = `
    <div class="bar-chart" role="group" aria-label="${mdEscape(title)}. ${mdEscape(subtitle)}">
      <p class="bar-chart-title">${mdEscape(title)}</p>
      <p class="bar-chart-subtitle">${mdEscape(subtitle)}</p>
      ${rowsHtml}
    </div>`;
}

const CHART_SUBTITLE = "All recorded selections with a settled result, including any that didn't qualify for action under the price policy.";

/* Strike rate by price band. Deliberately includes sub-2.00 selections
 * (unlike the Qualifying stat elsewhere) — otherwise the "under 2.00" band
 * would always read 0/0 and the chart would lose its own point. */
function renderPriceBandChart(el, rows) {
  const bands = [
    { label: "Under 2.00", test: (p) => p < 2 },
    { label: "2.00–3.00", test: (p) => p >= 2 && p < 3 },
    { label: "3.00–4.00", test: (p) => p >= 3 && p < 4 },
    { label: "4.00–6.00", test: (p) => p >= 4 && p < 6 },
    { label: "6.00+", test: (p) => p >= 6 },
  ];
  const buckets = bands.map((band) => {
    let wins = 0;
    let decided = 0;
    rows.forEach((r) => {
      const price = effectivePriceBlock(r).price;
      if (price === null || !band.test(price)) return;
      const k = classifyResult(r.result);
      if (k === "win") { wins++; decided++; }
      else if (k === "lose") { decided++; }
    });
    return { label: band.label, wins, decided };
  });
  renderBarChart(el, "Strike rate by price band", CHART_SUBTITLE, buckets);
}

/* Strike rate by confidence level. */
function renderConfidenceChart(el, rows) {
  const levels = ["High", "Medium", "Low"];
  const buckets = levels.map((level) => {
    let wins = 0;
    let decided = 0;
    rows.forEach((r) => {
      if ((r.confidence || "").trim().toLowerCase() !== level.toLowerCase()) return;
      const k = classifyResult(r.result);
      if (k === "win") { wins++; decided++; }
      else if (k === "lose") { decided++; }
    });
    return { label: level, wins, decided };
  });
  renderBarChart(el, "Strike rate by confidence", CHART_SUBTITLE, buckets);
}

/* Groups manifest entries by year then date and renders a browsable list.
 * Links to the entry viewer page (entry.html?file=...), never straight at
 * the raw .md — the browser can't render markdown on its own. */
function renderDateBrowser(el, entries, viewerPath) {
  if (!entries.length) {
    el.innerHTML = '<div class="empty-state">No entries recorded yet. Check back after the next meeting.</div>';
    return;
  }

  const sorted = entries.slice().sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  const byYear = {};
  sorted.forEach((e) => {
    const year = (e.date || "").slice(0, 4) || "Unknown";
    if (!byYear[year]) byYear[year] = [];
    byYear[year].push(e);
  });

  const years = Object.keys(byYear).sort((a, b) => b.localeCompare(a));

  el.innerHTML = years.map((year) => {
    const items = byYear[year].map((e) => `
      <li>
        <a href="${viewerPath}?file=${encodeURIComponent(e.file)}">
          <span class="entry-track">${mdEscape(e.venue || "")}</span>
          <span class="entry-meta">${mdEscape(formatDateUK(e.date))}${e.time ? " · " + mdEscape(e.time) : ""}${e.result ? " · " + mdEscape(e.result) : ""}</span>
        </a>
      </li>`).join("");
    return `<div class="date-group"><h3>${year}</h3><ul class="entry-list">${items}</ul></div>`;
  }).join("");
}

/* Fetches a markdown file (framework page or README) and renders it into
 * the given container. Pass {links: true} to render [text](url) as <a> —
 * used by the About page; framework pages don't need it and leave it off. */
async function loadFrameworkInto(el, mdUrl, opts) {
  const text = await fetchText(mdUrl);
  if (text === null) {
    el.innerHTML = '<div class="empty-state">Framework text could not be loaded.</div>';
    return;
  }
  el.innerHTML = renderMarkdown(text, opts);
}

/*
 * Splits an entry file into its YAML-ish frontmatter (flat key: value pairs
 * only — matches what the entry templates actually produce) and the
 * markdown body. Not a general YAML parser.
 */
function parseFrontmatter(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { data: {}, body: text };

  const data = {};
  match[1].split(/\r?\n/).forEach((line) => {
    const m = line.match(/^([A-Za-z0-9_]+):\s?(.*)$/);
    if (!m) return;
    let val = m[2].trim();
    if (val.length >= 2 && val.startsWith('"') && val.endsWith('"')) {
      val = val.slice(1, -1);
    }
    data[m[1]] = val;
  });

  return { data, body: match[2] };
}

/*
 * Computes the Stage 5–7 price block from the recorded decimal price alone,
 * so the figures shown always agree with price_at_commitment even if an
 * entry's prose is incomplete. Publishing band is 4/1–6/1 = decimal 5.00–7.00;
 * each way requires 6.00+; qualifying for action requires 2.00+.
 */
function computePriceBlock(priceStr) {
  const price = parseFloat(priceStr);
  if (!priceStr || isNaN(price)) {
    return { price: null, impliedProbability: null, inBand: null, eachWayEligible: null, qualifies: null };
  }
  return {
    price,
    impliedProbability: Math.round((100 / price) * 10) / 10,
    inBand: price >= 5 && price <= 7,
    eachWayEligible: price >= 6,
    qualifies: price >= 2,
  };
}

/* Applies only the fields governance permits to change after commitment.
 * The pre-race reasoning, selection, confidence, publication price and
 * principal risk continue to come exclusively from the frozen Markdown. */
function mergeResultOverlay(frontmatter, overlay) {
  if (!overlay) return frontmatter;
  const allowed = [
    "starting_price", "result", "material_change", "process_compliance_grade",
    "operator_disagreement", "total_runners", "going_allowance",
  ];
  allowed.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(overlay, key)) frontmatter[key] = overlay[key];
  });
  frontmatter._overlayApplied = true;
  return frontmatter;
}

/* Renders the compact verdict card + collapsible full analysis for one entry. */
function renderEntry(el, frontmatter, body, venueKey) {
  const selection = frontmatter.selection || "";
  const confidence = (frontmatter.confidence || "").trim();
  const confidenceKey = confidence.toLowerCase();
  const venue = frontmatter[venueKey] || "";
  const pb = effectivePriceBlock(frontmatter);
  const raceTime = raceTimeFromEntryId(frontmatter.entry_id);
  const sp = formatStartingPrice(frontmatter.starting_price);
  const resultText = (frontmatter.result || "").trim() || "Pending";
  const compliance = (frontmatter.process_compliance_grade || "").trim() || "Not yet reviewed";
  const totalRunners = (frontmatter.total_runners || "").trim();
  const goingAllowance = venueKey === "track" ? (frontmatter.going_allowance || "").trim() : "";
  const materialChange = (frontmatter.material_change || "").trim();
  const operatorDisagreement = (frontmatter.operator_disagreement || "").trim();

  let qualifiesText;
  if (!selection) {
    qualifiesText = "No qualifying action";
  } else if (pb.price === null) {
    qualifiesText = "Price not recorded";
  } else {
    qualifiesText = pb.qualifies ? "Yes" : "No — below 2.00";
  }

  // entry.html lives one level below repo root (horses/, greyhounds/),
  // same as index.html — see raceRowHtml's equivalent link and comment.
  const priceValue = pb.price !== null
    ? `${pb.price.toFixed(2)}${pb.corrected ? `<a class="price-marker" href="../corrections.html#${mdEscape(pb.correctionSlug)}" title="Price recorded via logged correction — see CORRECTIONS.md">†</a>` : ""}`
    : "—";
  const correctionFootnote = pb.corrected
    ? '<p class="table-footnote">† price recorded via logged correction, see <a href="../corrections.html">CORRECTIONS.md</a>.</p>'
    : "";

  const metaBits = [venue, formatDateUK(frontmatter.date), raceTime].filter(Boolean);
  const overlayContextTile = totalRunners
    ? `<div class="stat-tile"><div class="value">${mdEscape(totalRunners)}</div><div class="label">Total runners</div></div>`
    : goingAllowance
      ? `<div class="stat-tile"><div class="value">${mdEscape(goingAllowance)}</div><div class="label">Going allowance</div></div>`
      : "";
  const materialChangeHtml = materialChange && materialChange.toLowerCase() !== "no"
    ? `<p><strong>Material-change record:</strong> ${mdEscape(materialChange)}</p>`
    : "";
  const disagreementHtml = operatorDisagreement && !/^none\b/i.test(operatorDisagreement)
    ? `<p><strong>Operator disagreement:</strong> ${mdEscape(operatorDisagreement)}</p>`
    : "";
  const resultOverlayHtml = frontmatter._overlayApplied ? `
    <section class="result-overlay" aria-labelledby="result-overlay-title">
      <div class="overlay-heading"><h2 id="result-overlay-title">Result information</h2><span>Added after the race</span></div>
      <div class="stat-row">
        <div class="stat-tile"><div class="value ${resultClass(resultText)}">${mdEscape(resultText)}</div><div class="label">Result</div></div>
        <div class="stat-tile"><div class="value">${sp !== null ? sp : "—"}</div><div class="label">Starting price</div></div>
        ${overlayContextTile}
        <div class="stat-tile"><div class="value">${mdEscape(compliance)}</div><div class="label">Process compliance</div></div>
      </div>
      ${materialChangeHtml}${disagreementHtml}
    </section>` : "";

  const cardHtml = `
    <div class="card verdict-card">
      <p class="record-phase">Frozen pre-race record${frontmatter.time_of_commitment ? ` · committed ${mdEscape(frontmatter.time_of_commitment)}` : ""}</p>
      <div class="verdict-header">
        <h1>${mdEscape(selection || "No clear selection")}</h1>
        ${confidence ? `<span class="confidence-badge confidence-${mdEscape(confidenceKey)}">${mdEscape(confidence)}</span>` : ""}
      </div>
      <p class="verdict-meta">${metaBits.map(mdEscape).join(" · ")}</p>
      <div class="stat-row">
        <div class="stat-tile"><div class="value">${priceValue}</div><div class="label">Price at publication</div></div>
        <div class="stat-tile"><div class="value">${pb.impliedProbability !== null ? pb.impliedProbability + "%" : "—"}</div><div class="label">Implied probability</div></div>
        <div class="stat-tile"><div class="value">${mdEscape(qualifiesText)}</div><div class="label">Qualifies for action</div></div>
      </div>
      ${correctionFootnote}
      ${frontmatter.principal_risk ? `<p class="principal-risk"><strong>Principal risk:</strong> ${mdEscape(frontmatter.principal_risk)}</p>` : ""}
    </div>
    ${resultOverlayHtml}
    <details class="framework-details">
      <summary>Show frozen pre-race framework working</summary>
      <div class="prose">${renderMarkdown(body)}</div>
    </details>`;

  el.innerHTML = cardHtml;
}

/* Fetches one entry markdown file and renders it via renderEntry. opts.corrections,
 * if given, is a parseCorrections() map applied to the frontmatter before
 * rendering — see applyCorrections. */
async function loadEntryInto(el, mdUrl, venueKey, opts) {
  const text = await fetchText(mdUrl);
  if (text === null) {
    el.innerHTML = '<div class="empty-state">Entry could not be loaded.</div>';
    return;
  }
  const { data, body } = parseFrontmatter(text);
  if (opts && opts.overlay) {
    mergeResultOverlay(data, opts.overlay);
  }
  if (opts && opts.corrections) {
    applyCorrections([data], opts.corrections);
  }
  renderEntry(el, data, body, venueKey);
}
