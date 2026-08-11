#!/usr/bin/env node

/* Read The Race record-integrity validator.
 *
 * Normal mode checks the working tree's CSV, manifest and entry-file parity.
 * --staged additionally rejects edits to immutable fields in existing rows,
 * removal of existing rows, and modification of frozen entry Markdown.
 */

const fs = require("fs");
const path = require("path");
const cp = require("child_process");

const root = path.resolve(__dirname, "..");
const stagedMode = process.argv.includes("--staged");
const errors = [];

function parseCsv(text) {
  const records = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") { row.push(field); field = ""; }
    else if (ch === "\n") { row.push(field.replace(/\r$/, "")); records.push(row); row = []; field = ""; }
    else field += ch;
  }
  if (field || row.length) { row.push(field.replace(/\r$/, "")); records.push(row); }
  const header = records.shift() || [];
  return {
    header,
    rows: records.filter((r) => r.some((v) => v !== "")).map((values, index) => {
      if (values.length !== header.length) errors.push(`CSV row ${index + 2} has ${values.length} fields; expected ${header.length}.`);
      return Object.fromEntries(header.map((key, i) => [key, values[i] === undefined ? "" : values[i]]));
    }),
  };
}

function readText(relative) {
  return fs.readFileSync(path.join(root, relative), "utf8");
}

function positiveDecimal(value) {
  if (!value) return true;
  return Number.isFinite(Number(value)) && Number(value) > 0;
}

function validResult(value) {
  if (!value) return true;
  return /^(won|win|1st|\d+(st|nd|rd|th)|nr|pu|f|ur|rr|ro|bd|co|void|no qualifying action\b)/i.test(value.trim());
}

const configs = {
  horses: {
    csv: "horses/results.csv",
    manifest: "horses/entries/manifest.json",
    headers: ["entry_id", "date", "course", "framework_version", "time_of_commitment", "code", "structure", "category", "distance", "surface", "going", "selection", "confidence", "price_at_commitment", "starting_price", "result", "principal_risk", "material_change", "process_compliance_grade", "operator_disagreement", "entry_file", "total_runners"],
    immutable: ["entry_id", "date", "course", "framework_version", "time_of_commitment", "code", "structure", "category", "distance", "surface", "going", "selection", "confidence", "price_at_commitment", "principal_risk", "operator_disagreement", "entry_file"],
  },
  greyhounds: {
    csv: "greyhounds/results.csv",
    manifest: "greyhounds/entries/manifest.json",
    headers: ["entry_id", "date", "track", "framework_version", "time_of_commitment", "exact_distance", "official_distance_designation", "grade", "going_allowance", "trap_grid", "selection", "confidence", "price_at_commitment", "starting_price", "result", "principal_risk", "material_change", "process_compliance_grade", "operator_disagreement", "vacancy_testing_record", "entry_file"],
    immutable: ["entry_id", "date", "track", "framework_version", "time_of_commitment", "exact_distance", "official_distance_designation", "grade", "trap_grid", "selection", "confidence", "price_at_commitment", "principal_risk", "operator_disagreement", "vacancy_testing_record", "entry_file"],
  },
};

for (const [sport, cfg] of Object.entries(configs)) {
  const parsed = parseCsv(readText(cfg.csv));
  if (parsed.header.join(",") !== cfg.headers.join(",")) errors.push(`${cfg.csv} header does not match the governed schema.`);

  let manifest;
  try { manifest = JSON.parse(readText(cfg.manifest)); }
  catch (error) { errors.push(`${cfg.manifest} is not valid JSON: ${error.message}`); continue; }

  const ids = new Set();
  const files = new Set();
  const manifestByFile = new Map();
  manifest.forEach((entry) => {
    if (manifestByFile.has(entry.file)) errors.push(`${cfg.manifest} contains duplicate file ${entry.file}.`);
    manifestByFile.set(entry.file, entry);
  });

  parsed.rows.forEach((row) => {
    if (!row.entry_id) errors.push(`${cfg.csv} contains a row without entry_id.`);
    if (ids.has(row.entry_id)) errors.push(`${cfg.csv} contains duplicate entry_id ${row.entry_id}.`);
    ids.add(row.entry_id);
    if (files.has(row.entry_file)) errors.push(`${cfg.csv} contains duplicate entry_file ${row.entry_file}.`);
    files.add(row.entry_file);

    if (!positiveDecimal(row.price_at_commitment)) errors.push(`${row.entry_id}: invalid publication price ${row.price_at_commitment}.`);
    if (!positiveDecimal(row.starting_price)) errors.push(`${row.entry_id}: invalid starting price ${row.starting_price}.`);
    if (!validResult(row.result)) errors.push(`${row.entry_id}: unrecognised result label ${row.result}.`);

    const entryPath = path.join(root, row.entry_file || "");
    if (!row.entry_file || !fs.existsSync(entryPath)) {
      errors.push(`${row.entry_id}: entry file does not exist (${row.entry_file}).`);
    } else {
      const frontmatterId = /^entry_id:\s*(.+)$/m.exec(fs.readFileSync(entryPath, "utf8"));
      if (!frontmatterId || frontmatterId[1].trim() !== row.entry_id) errors.push(`${row.entry_id}: entry Markdown frontmatter ID does not match.`);
    }

    const manifestFile = (row.entry_file || "").replace(new RegExp(`^${sport}/entries/`), "");
    const manifestEntry = manifestByFile.get(manifestFile);
    if (!manifestEntry) errors.push(`${row.entry_id}: missing from ${cfg.manifest}.`);
    else {
      if (String(manifestEntry.result || "") !== String(row.result || "")) errors.push(`${row.entry_id}: CSV/manifest result mismatch.`);
      if (String(manifestEntry.date || "") !== String(row.date || "")) errors.push(`${row.entry_id}: CSV/manifest date mismatch.`);
      const venueField = sport === "horses" ? "course" : "track";
      if (String(manifestEntry.venue || "") !== String(row[venueField] || "")) errors.push(`${row.entry_id}: CSV/manifest venue mismatch.`);
      if (Object.prototype.hasOwnProperty.call(manifestEntry, "starting_price") && String(manifestEntry.starting_price || "") !== String(row.starting_price || "")) errors.push(`${row.entry_id}: CSV/manifest starting-price mismatch.`);
      if (sport === "horses" && String(manifestEntry.total_runners || "") !== String(row.total_runners || "")) errors.push(`${row.entry_id}: CSV/manifest total-runners mismatch.`);
    }

    if (sport === "horses" && row.result) {
      if (!/^\d+$/.test(row.total_runners || "") || Number(row.total_runners) < 1) errors.push(`${row.entry_id}: settled horse entry needs a positive total_runners value.`);
    }
  });

  if (parsed.rows.length !== manifest.length) errors.push(`${sport}: CSV has ${parsed.rows.length} rows but manifest has ${manifest.length}.`);
  manifest.forEach((entry) => {
    const full = `${sport}/entries/${entry.file}`;
    if (!files.has(full)) errors.push(`${cfg.manifest}: ${entry.file} has no CSV row.`);
  });
}

if (stagedMode) {
  let staged = [];
  try { staged = cp.execFileSync("git", ["diff", "--cached", "--name-status"], { cwd: root, encoding: "utf8" }).trim().split(/\r?\n/).filter(Boolean); }
  catch (error) { errors.push(`Could not inspect staged changes: ${error.message}`); }

  staged.forEach((line) => {
    const [status, file] = line.split(/\t/);
    if (/^(horses|greyhounds)\/entries\/.*\.md$/.test(file) && status !== "A") errors.push(`${file}: frozen entry Markdown may not be modified after creation.`);
  });

  for (const cfg of Object.values(configs)) {
    if (!staged.some((line) => line.endsWith(`\t${cfg.csv}`))) continue;
    try {
      const before = parseCsv(cp.execFileSync("git", ["show", `HEAD:${cfg.csv}`], { cwd: root, encoding: "utf8" })).rows;
      const after = parseCsv(cp.execFileSync("git", ["show", `:${cfg.csv}`], { cwd: root, encoding: "utf8" })).rows;
      const afterById = new Map(after.map((row) => [row.entry_id, row]));
      before.forEach((oldRow, index) => {
        if (!after[index] || after[index].entry_id !== oldRow.entry_id) errors.push(`${cfg.csv}: new rows must be appended after all existing rows.`);
      });
      before.forEach((oldRow) => {
        const newRow = afterById.get(oldRow.entry_id);
        if (!newRow) { errors.push(`${cfg.csv}: existing row ${oldRow.entry_id} may not be removed.`); return; }
        cfg.immutable.forEach((field) => {
          if (String(oldRow[field] || "") !== String(newRow[field] || "")) errors.push(`${oldRow.entry_id}: immutable field ${field} changed.`);
        });
      });
    } catch (error) {
      errors.push(`Could not compare staged ${cfg.csv}: ${error.message}`);
    }
  }
}

if (errors.length) {
  console.error(`Record validation failed (${errors.length} issue${errors.length === 1 ? "" : "s"}):`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log("Record validation passed: CSV schemas, manifests, entry files and governed fields are consistent.");
