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
  if (r === "win" || r.startsWith("win")) return "win";
  return "lose";
}

function resultClass(result) {
  const k = classifyResult(result);
  if (k === "win") return "result-win";
  if (k === "void" || k === "no-action" || k === "pending") return "result-void";
  return "result-lose";
}

/* Renders the stat-tile summary + full table for one sport's results.csv rows. */
function renderRunningRecord(el, rows, venueKey) {
  if (!rows.length) {
    el.innerHTML = '<div class="empty-state">No entries recorded yet. Check back after the next meeting.</div>';
    return;
  }

  let wins = 0;
  let qualifying = 0;
  let noAction = 0;
  let pending = 0;

  rows.forEach((r) => {
    const k = classifyResult(r.result);
    if (k === "win") { wins++; qualifying++; }
    else if (k === "lose" || k === "void") { qualifying++; }
    else if (k === "no-action") { noAction++; }
    else { pending++; }
  });

  const pct = qualifying > 0 ? Math.round((wins / qualifying) * 1000) / 10 : null;
  const strikeRateText = qualifying > 0
    ? `${wins}/${qualifying}${pct !== null ? ` (${pct}%)` : ""}`
    : "0/0";

  const sorted = rows.slice().sort((a, b) => {
    const da = `${a.date || ""} ${a.time_of_commitment || ""}`;
    const db = `${b.date || ""} ${b.time_of_commitment || ""}`;
    return db.localeCompare(da);
  });

  const statHtml = `
    <div class="stat-row">
      <div class="stat-tile"><div class="value">${rows.length}</div><div class="label">Entries</div></div>
      <div class="stat-tile"><div class="value">${qualifying}</div><div class="label">Qualifying</div></div>
      <div class="stat-tile"><div class="value">${strikeRateText}</div><div class="label">Strike rate</div></div>
      <div class="stat-tile"><div class="value">${noAction}</div><div class="label">No action</div></div>
    </div>`;

  const rowsHtml = sorted.map((r) => {
    const venue = r[venueKey] || "";
    return `<tr>
      <td>${mdEscape(r.date || "")}</td>
      <td>${mdEscape(venue)}</td>
      <td>${mdEscape(r.selection || "")}</td>
      <td>${mdEscape(r.confidence || "")}</td>
      <td>${mdEscape(r.price_at_commitment || "")}</td>
      <td>${mdEscape(r.starting_price || "")}</td>
      <td class="${resultClass(r.result)}">${mdEscape(r.result || "pending")}</td>
    </tr>`;
  }).join("");

  const tableHtml = `
    <div class="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Date</th><th>${venueKey === "track" ? "Track" : "Course"}</th><th>Selection</th>
            <th>Confidence</th><th>Price</th><th>SP</th><th>Result</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    </div>`;

  el.innerHTML = statHtml + tableHtml;
}

/* Renders a compact strike-rate-only summary card, used on the site home page. */
function renderRunningRecordSummary(el, rows) {
  if (!rows.length) {
    el.innerHTML = '<div class="empty-state">No entries recorded yet.</div>';
    return;
  }
  let wins = 0;
  let qualifying = 0;
  rows.forEach((r) => {
    const k = classifyResult(r.result);
    if (k === "win") { wins++; qualifying++; }
    else if (k === "lose" || k === "void") { qualifying++; }
  });
  const pct = qualifying > 0 ? Math.round((wins / qualifying) * 1000) / 10 : null;
  const strikeRateText = qualifying > 0 ? `${wins}/${qualifying}${pct !== null ? ` (${pct}%)` : ""}` : "0/0";

  el.innerHTML = `
    <div class="stat-row">
      <div class="stat-tile"><div class="value">${rows.length}</div><div class="label">Entries</div></div>
      <div class="stat-tile"><div class="value">${strikeRateText}</div><div class="label">Strike rate</div></div>
    </div>`;
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
          <span class="entry-meta">${mdEscape(e.date || "")}${e.time ? " · " + mdEscape(e.time) : ""}${e.result ? " · " + mdEscape(e.result) : ""}</span>
        </a>
      </li>`).join("");
    return `<div class="date-group"><h3>${year}</h3><ul class="entry-list">${items}</ul></div>`;
  }).join("");
}

/* Fetches a framework markdown file and renders it into the given container. */
async function loadFrameworkInto(el, mdUrl) {
  const text = await fetchText(mdUrl);
  if (text === null) {
    el.innerHTML = '<div class="empty-state">Framework text could not be loaded.</div>';
    return;
  }
  el.innerHTML = renderMarkdown(text);
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

  let qualifiesText;
  if (!selection) {
    qualifiesText = "No qualifying action";
  } else if (pb.price === null) {
    qualifiesText = "Pending";
  } else {
    qualifiesText = pb.qualifies ? "Yes" : "No — below 2.00";
  }

  const metaBits = [venue, frontmatter.date, frontmatter.time_of_commitment].filter(Boolean);

  const cardHtml = `
    <div class="card verdict-card">
      <div class="verdict-header">
        <h1>${mdEscape(selection || "No clear selection")}</h1>
        ${confidence ? `<span class="confidence-badge confidence-${mdEscape(confidenceKey)}">${mdEscape(confidence)}</span>` : ""}
      </div>
      <p class="verdict-meta">${metaBits.map(mdEscape).join(" · ")}</p>
      <div class="stat-row">
        <div class="stat-tile"><div class="value">${pb.price !== null ? pb.price.toFixed(2) : "—"}</div><div class="label">Price</div></div>
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
