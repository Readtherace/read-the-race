/*
 * Minimal, dependency-free markdown renderer.
 * Supports only the subset used by the Read The Race framework pages:
 * #, ##, ### headings; **bold**; > blockquote; - / 1. lists; --- rules;
 * plain paragraphs. Not a general-purpose markdown parser.
 */

function mdEscape(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function mdInline(s) {
  return mdEscape(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

function renderMarkdown(md) {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const html = [];
  let i = 0;
  // True only for the run of full-bold lines directly under the H1 (version/status
  // block) — those render dim and compact. Full-bold lines elsewhere in the
  // document (e.g. "**Confidence definitions:**") render as normal bold paragraphs.
  let inHeaderBlock = false;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === "") {
      i++;
      continue;
    }

    if (line.startsWith("### ")) {
      html.push(`<h3>${mdInline(line.slice(4))}</h3>`);
      inHeaderBlock = false;
      i++;
      continue;
    }
    if (line.startsWith("## ")) {
      html.push(`<h2>${mdInline(line.slice(3))}</h2>`);
      inHeaderBlock = false;
      i++;
      continue;
    }
    if (line.startsWith("# ")) {
      html.push(`<h1>${mdInline(line.slice(2))}</h1>`);
      inHeaderBlock = true;
      i++;
      continue;
    }

    if (line.trim() === "---") {
      html.push("<hr>");
      inHeaderBlock = false;
      i++;
      continue;
    }

    if (line.startsWith("> ")) {
      const quoteLines = [];
      while (i < lines.length && lines[i].startsWith("> ")) {
        quoteLines.push(mdInline(lines[i].slice(2)));
        i++;
      }
      html.push(`<blockquote>${quoteLines.join("<br>")}</blockquote>`);
      inHeaderBlock = false;
      continue;
    }

    if (/^[-*]\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^[-*]\s/.test(lines[i])) {
        items.push(`<li>${mdInline(lines[i].replace(/^[-*]\s/, ""))}</li>`);
        i++;
      }
      html.push(`<ul>${items.join("")}</ul>`);
      inHeaderBlock = false;
      continue;
    }

    if (/^\d+\.\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(`<li>${mdInline(lines[i].replace(/^\d+\.\s/, ""))}</li>`);
        i++;
      }
      html.push(`<ol>${items.join("")}</ol>`);
      inHeaderBlock = false;
      continue;
    }

    // A line that is entirely bold stands alone rather than merging with
    // neighbouring paragraph lines.
    if (/^\*\*.+\*\*$/.test(line.trim())) {
      const cls = inHeaderBlock ? ' class="meta-line"' : "";
      html.push(`<p${cls}>${mdInline(line.trim())}</p>`);
      i++;
      continue;
    }

    inHeaderBlock = false;

    // Plain paragraph: merge consecutive plain lines until a blank line
    // or a line matching one of the block patterns above.
    const paraLines = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !lines[i].startsWith("#") &&
      lines[i].trim() !== "---" &&
      !lines[i].startsWith("> ") &&
      !/^[-*]\s/.test(lines[i]) &&
      !/^\d+\.\s/.test(lines[i]) &&
      !/^\*\*.+\*\*$/.test(lines[i].trim())
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length > 0) {
      html.push(`<p>${mdInline(paraLines.join(" "))}</p>`);
    }
  }

  return html.join("\n");
}
