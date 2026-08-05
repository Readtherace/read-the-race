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
  if (r.includes("void") || r.includes("non-runner") || r.includes("nonrunner") || r.includes("non runner")) return "void";
  if (/^(win|won)\b/.test(r)) return "win";
  return "lose";
}

function resultClass(result) {
  const k = classifyResult(result);
  if (k === "win") return "result-win";
  if (k === "void" || k === "no-action" || k === "pending") return "result-void";
  return "result-lose";
}

/*
 * Whether an entry qualifies for action under the Stage 5 price policy:
 * a selection was named AND the recorded price is 2.00 or above. This is
 * independent of whether the result is known yet — qualification is
 * decided at commitment, not at settlement.
 */
function qualifiesForAction(row) {
  const hasSelection = !!(row.selection && row.selection.trim());
  const pb = computePriceBlock(row.price_at_commitment);
  return hasSelection && pb.qualifies === true;
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
 * way, result, confidence. Date and venue are conveyed by the group header
 * above, not repeated here. Starting price is a separate field from price at
 * publication (price_at_commitment internally) — it's only populated once a
 * result is known, and never overwrites the publication price. Each cell
 * carries data-label so the mobile stacked-card layout (see style.css) can
 * show the column name without duplicating markup here. */
function raceRowHtml(r) {
  const raceTime = raceTimeFromEntryId(r.entry_id);
  const pb = computePriceBlock(r.price_at_commitment);
  const qualifies = qualifiesForAction(r);
  const eachWay = pb.price !== null ? (pb.eachWayEligible ? "Yes" : "No") : "—";
  const sp = formatStartingPrice(r.starting_price);
  const selectionHtml = qualifies
    ? mdEscape(r.selection || "")
    : `<span class="no-action-label">No qualifying action</span><span class="no-action-runner">${mdEscape(r.selection || "")}</span>`;

  return `<tr>
    <td class="price-cell" data-label="Race Time">${mdEscape(raceTime)}</td>
    <td class="selection-cell" data-label="Selection">${selectionHtml}</td>
    <td class="price-cell" data-label="Price at publication">${pb.price !== null ? pb.price.toFixed(2) : "—"}</td>
    <td class="price-cell" data-label="Starting Price">${sp !== null ? sp : "—"}</td>
    <td data-label="Each Way">${eachWay}</td>
    <td class="${resultClass(r.result)}" data-label="Result">${mdEscape(r.result || "pending")}</td>
    <td data-label="Confidence">${mdEscape(r.confidence || "")}</td>
  </tr>`;
}

/* Proportional column widths: Selection gets the most room (it holds the
 * only variable-length prose) without dominating the row; the four numeric/
 * short-text columns stay narrow. Only affects the desktop table — the
 * mobile stacked-card layout (see style.css) ignores colgroup widths. */
const RACE_TABLE_HEAD = `<colgroup>
  <col class="col-time"><col class="col-selection"><col class="col-price"><col class="col-sp"><col class="col-ew"><col class="col-result"><col class="col-conf">
</colgroup>
<thead><tr>
  <th>Race Time</th><th>Selection</th><th>Price at publication</th><th>Starting Price</th><th>Each Way</th><th>Result</th><th>Confidence</th>
</tr></thead>`;

/* Renders the stat-tile summary for one sport's results.csv rows. */
function renderStats(el, rows) {
  if (!rows.length) {
    el.innerHTML = '<div class="empty-state">No entries recorded yet. Check back after the next meeting.</div>';
    return;
  }

  let wins = 0;
  let decided = 0;
  let qualifying = 0;
  let noAction = 0;

  rows.forEach((r) => {
    if (qualifiesForAction(r)) {
      qualifying++;
      const k = classifyResult(r.result);
      if (k === "win") { wins++; decided++; }
      else if (k === "lose") { decided++; }
    } else {
      noAction++;
    }
  });

  const pct = decided > 0 ? Math.round((wins / decided) * 1000) / 10 : null;
  const strikeRateText = decided > 0
    ? `${wins}/${decided}${pct !== null ? ` (${pct}%)` : ""}`
    : "0/0";

  el.innerHTML = `
    <div class="stat-row">
      <div class="stat-tile"><div class="value">${rows.length}</div><div class="label">Entries</div></div>
      <div class="stat-tile"><div class="value">${qualifying}</div><div class="label">Qualifying</div></div>
      <div class="stat-tile"><div class="value">${strikeRateText}</div><div class="label">Strike rate</div></div>
      <div class="stat-tile"><div class="value">${noAction}</div><div class="label">No action</div></div>
    </div>`;
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

  if (!todayRows.length) {
    el.innerHTML = '<div class="empty-state">No races entered for today yet.</div>';
    return;
  }

  const venues = groupByVenueSorted(todayRows, venueKey);
  const body = venues.map((v) =>
    `<tr class="group-header-course"><td colspan="7">${mdEscape(v.venue)}</td></tr>` +
    v.rows.map(raceRowHtml).join("")
  ).join("");

  el.innerHTML = `
    <div class="table-scroll">
      <table>
        ${RACE_TABLE_HEAD}
        <tbody>${body}</tbody>
      </table>
    </div>`;
}

/*
 * "Resulted" table: everything not shown in Today — i.e. any race with a
 * settled result, plus any pending race left over from a previous day.
 * Grouped by date (most recent first), then by venue within each date,
 * same earliest-first sort as Today.
 */
function renderResultedTable(el, rows, venueKey) {
  const today = todayIso();
  const resultedRows = rows.filter((r) => !(r.date === today && classifyResult(r.result) === "pending"));

  if (!resultedRows.length) {
    el.innerHTML = '<div class="empty-state">No results recorded yet.</div>';
    return;
  }

  const dateGroups = groupByDateThenVenue(resultedRows, venueKey);
  const body = dateGroups.map((dg) => {
    const dateHeader = `<tr class="group-header-date"><td colspan="7">${formatDateUK(dg.date)}</td></tr>`;
    const venueRows = dg.venues.map((v) =>
      `<tr class="group-header-course"><td colspan="7">${mdEscape(v.venue)}</td></tr>` +
      v.rows.map(raceRowHtml).join("")
    ).join("");
    return dateHeader + venueRows;
  }).join("");

  el.innerHTML = `
    <div class="table-scroll">
      <table>
        ${RACE_TABLE_HEAD}
        <tbody>${body}</tbody>
      </table>
    </div>`;
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
      <div class="stat-tile"><div class="value">${strikeRateText}</div><div class="label">Strike rate</div></div>
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
    const k = classifyResult(r.result);
    let cls = "form-pending";
    let label = "pending";
    if (!qualifies) {
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
    return `<span class="form-square ${cls}" title="${mdEscape(title)}"></span>`;
  }).join("");

  const sampleNote = last20.length < 10
    ? `Last ${last20.length} of ${rows.length} recorded, oldest to most recent — sample under 10, not yet meaningful.`
    : `Last ${last20.length} of ${rows.length} recorded, oldest to most recent.`;

  el.innerHTML = `
    <div class="form-strip">
      <div class="form-strip-row">${squares}</div>
      <p class="form-strip-caption">${mdEscape(sampleNote)}</p>
      <div class="form-strip-legend">
        <span><span class="form-square form-win"></span>Won</span>
        <span><span class="form-square form-lose"></span>Lost</span>
        <span><span class="form-square form-no-action"></span>No qualifying action</span>
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
            <div class="bar-track"><div class="bar-fill" style="width:${b.decided > 0 ? pct : 0}%"></div></div>
            <div class="bar-row-value">${valueText}</div>
          </div>
          ${note}
        </div>
      </div>`;
  }).join("");

  el.innerHTML = `
    <div class="bar-chart">
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
      const price = parseFloat(r.price_at_commitment);
      if (isNaN(price) || !band.test(price)) return;
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

/* Renders the compact verdict card + collapsible full analysis for one entry. */
function renderEntry(el, frontmatter, body, venueKey) {
  const selection = frontmatter.selection || "";
  const confidence = (frontmatter.confidence || "").trim();
  const confidenceKey = confidence.toLowerCase();
  const venue = frontmatter[venueKey] || "";
  const pb = computePriceBlock(frontmatter.price_at_commitment);
  const raceTime = raceTimeFromEntryId(frontmatter.entry_id);
  const sp = formatStartingPrice(frontmatter.starting_price);

  let qualifiesText;
  if (!selection) {
    qualifiesText = "No qualifying action";
  } else if (pb.price === null) {
    qualifiesText = "Pending";
  } else {
    qualifiesText = pb.qualifies ? "Yes" : "No — below 2.00";
  }

  const metaBits = [venue, formatDateUK(frontmatter.date), raceTime].filter(Boolean);

  const cardHtml = `
    <div class="card verdict-card">
      <div class="verdict-header">
        <h1>${mdEscape(selection || "No clear selection")}</h1>
        ${confidence ? `<span class="confidence-badge confidence-${mdEscape(confidenceKey)}">${mdEscape(confidence)}</span>` : ""}
      </div>
      <p class="verdict-meta">${metaBits.map(mdEscape).join(" · ")}</p>
      <div class="stat-row">
        <div class="stat-tile"><div class="value">${pb.price !== null ? pb.price.toFixed(2) : "—"}</div><div class="label">Price at publication</div></div>
        <div class="stat-tile"><div class="value">${sp !== null ? sp : "—"}</div><div class="label">Starting price</div></div>
        <div class="stat-tile"><div class="value">${pb.impliedProbability !== null ? pb.impliedProbability + "%" : "—"}</div><div class="label">Implied probability</div></div>
        <div class="stat-tile"><div class="value">${mdEscape(qualifiesText)}</div><div class="label">Qualifies for action</div></div>
      </div>
      ${frontmatter.result ? `<p class="verdict-result ${resultClass(frontmatter.result)}">Result: ${mdEscape(frontmatter.result)}</p>` : ""}
      ${frontmatter.principal_risk ? `<p class="principal-risk"><strong>Principal risk:</strong> ${mdEscape(frontmatter.principal_risk)}</p>` : ""}
    </div>
    <details class="framework-details">
      <summary>Show full framework working</summary>
      <div class="prose">${renderMarkdown(body)}</div>
    </details>`;

  el.innerHTML = cardHtml;
}

/* Fetches one entry markdown file and renders it via renderEntry. */
async function loadEntryInto(el, mdUrl, venueKey) {
  const text = await fetchText(mdUrl);
  if (text === null) {
    el.innerHTML = '<div class="empty-state">Entry could not be loaded.</div>';
    return;
  }
  const { data, body } = parseFrontmatter(text);
  renderEntry(el, data, body, venueKey);
}
