/**
 * Renders agent-authored proposals as branded HTML.
 *
 * Output opens directly in Word and Google Docs (and prints cleanly to PDF),
 * so one renderer covers every format the team actually uses.
 *
 * Two document types, matching how ARC sells:
 *   הצעת ערך  — detailed; what we'll run and why. Agreed first.
 *   הצעת מחיר — titles and cost only. Follows an agreed value proposal.
 */

import fs from "fs";
import path from "path";

/**
 * The logo travels inside the document as a data URI. A linked src would point
 * at this server, so the mark would vanish the moment a proposal is forwarded
 * to a client.
 */
let logoDataUri = "";
function logo(): string {
  if (!logoDataUri) {
    try {
      const buf = fs.readFileSync(
        path.join(process.cwd(), "public", "arc-logo.png")
      );
      logoDataUri = `data:image/png;base64,${buf.toString("base64")}`;
    } catch {
      logoDataUri = "";
    }
  }
  return logoDataUri;
}

// Brand — taken from the team's own Word template and buildQuoteHTML.ts
const BLUE = "#2e5775";
const INK = "#434343";
const MUTED = "#666666";
const PAPER = "#e7ded2";
const FONT = "'Assistant', 'Heebo', Arial, sans-serif";

export interface ValueSection {
  /** e.g. "הבנת הצורך", or a block name when describing the day */
  heading: string;
  body: string;
  /** Present when the section describes a block in the running order */
  duration?: string;
  /** Why this block, for this client */
  rationale?: string;
}

export interface ValueProposal {
  type: "value";
  client: string;
  title: string;
  intro?: string;
  sections: ValueSection[];
  closing?: string;
}

export interface QuoteLine {
  title: string;
  price: number;
  note?: string;
}

export interface PriceQuote {
  type: "price";
  client: string;
  title: string;
  lines: QuoteLine[];
  /** e.g. "המחירים אינם כוללים מע״מ" */
  terms?: string[];
}

export type AgentDocument = ValueProposal | PriceQuote;

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Renders paragraphs, keeping the agent's line breaks meaningful. */
const paras = (text: string) =>
  esc(text)
    .split(/\n{2,}/)
    .map((p) => `<p>${p.replace(/\n/g, "<br/>")}</p>`)
    .join("");

const shell = (title: string, body: string) => `<!DOCTYPE html>
<html dir="rtl" lang="he"><head><meta charset="utf-8"/>
<title>${esc(title)}</title>
<style>
  @page { size: A4; margin: 2cm; }
  body { font-family: ${FONT}; color: ${INK}; font-size: 12pt; line-height: 1.7;
         max-width: 21cm; margin: 0 auto; padding: 2cm 1.5cm; }
  .logo { width: 150px; height: auto; margin-bottom: 2.5rem; }
  h1 { color: ${BLUE}; font-size: 26pt; font-weight: 700; margin: 0 0 .3rem; }
  .client { color: ${MUTED}; font-size: 14pt; margin-bottom: .2rem; }
  .date { color: ${MUTED}; font-size: 11pt; }
  hr { border: 0; border-top: 2px solid ${PAPER}; margin: 2rem 0; }
  h2 { color: ${BLUE}; font-size: 16pt; font-weight: 600; margin: 2rem 0 .5rem; }
  .dur { color: ${MUTED}; font-size: 11pt; font-weight: 400; }
  .why { background: ${PAPER}; border-right: 3px solid ${BLUE};
         padding: .7rem 1rem; margin: .8rem 0; font-size: 11pt; }
  .why strong { color: ${BLUE}; }
  table { width: 100%; border-collapse: collapse; margin: 1.5rem 0; }
  th { background: ${BLUE}; color: #fff; text-align: right; padding: .7rem 1rem;
       font-size: 12pt; font-weight: 600; }
  td { padding: .7rem 1rem; border-bottom: 1px solid ${PAPER}; }
  td.num { text-align: left; white-space: nowrap; }
  tr.total td { font-weight: 700; font-size: 14pt; color: ${BLUE};
                border-top: 2px solid ${BLUE}; border-bottom: none; }
  .note { color: ${MUTED}; font-size: 10pt; }
  .terms { margin-top: 2rem; color: ${MUTED}; font-size: 10pt; }
  .terms li { margin-bottom: .3rem; }
  footer { margin-top: 3rem; padding-top: 1rem; border-top: 1px solid ${PAPER};
           color: ${MUTED}; font-size: 10pt; text-align: center; }
</style></head>
<body>
<img class="logo" src="${logo()}" width="150" alt="Arc"/>
${body}
<footer>ARC · Irreplaceable Experiences</footer>
</body></html>`;

const today = () =>
  new Date().toLocaleDateString("he-IL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

export function renderDocument(doc: AgentDocument): string {
  const head = `
    <h1>${esc(doc.title)}</h1>
    <div class="client">${esc(doc.client)}</div>
    <div class="date">${today()}</div>
    <hr/>`;

  if (doc.type === "value") {
    const body =
      head +
      (doc.intro ? paras(doc.intro) : "") +
      doc.sections
        .map(
          (s) => `
        <h2>${esc(s.heading)}${
          s.duration ? ` <span class="dur">· ${esc(s.duration)}</span>` : ""
        }</h2>
        ${paras(s.body)}
        ${
          s.rationale
            ? `<div class="why"><strong>למה זה:</strong> ${esc(s.rationale)}</div>`
            : ""
        }`
        )
        .join("") +
      (doc.closing ? `<hr/>${paras(doc.closing)}` : "");
    return shell(doc.title, body);
  }

  const total = doc.lines.reduce((sum, l) => sum + (l.price || 0), 0);
  const money = (n: number) => `${n.toLocaleString("he-IL")} ₪`;

  const body =
    head +
    `<table>
      <thead><tr><th>סעיף</th><th style="text-align:left">עלות</th></tr></thead>
      <tbody>
        ${doc.lines
          .map(
            (l) => `<tr>
              <td>${esc(l.title)}${
              l.note ? `<br/><span class="note">${esc(l.note)}</span>` : ""
            }</td>
              <td class="num">${money(l.price)}</td>
            </tr>`
          )
          .join("")}
        <tr class="total"><td>סה״כ</td><td class="num">${money(total)}</td></tr>
      </tbody>
    </table>` +
    (doc.terms?.length
      ? `<div class="terms"><ul>${doc.terms
          .map((t) => `<li>${esc(t)}</li>`)
          .join("")}</ul></div>`
      : "");

  return shell(doc.title, body);
}
