import fs from "fs";
import path from "path";
import { BLOCK_SEEDS } from "@/lib/blockSeeds";

/**
 * Catalog of every block's value proposition, as a branded document.
 *
 * Generated from BLOCK_SEEDS rather than written by hand, so revising a block
 * card and re-running the import keeps the sales collateral in step.
 *
 * GET /api/blocks-catalog          → opens in the browser
 * GET /api/blocks-catalog?dl=1     → downloads as .doc for Word / Google Docs
 */

const BLUE = "#2e5775";
const INK = "#434343";
const MUTED = "#666666";
const PAPER = "#e7ded2";

function logoDataUri(): string {
  try {
    const buf = fs.readFileSync(
      path.join(process.cwd(), "public", "arc-logo.png")
    );
    return `data:image/png;base64,${buf.toString("base64")}`;
  } catch {
    return "";
  }
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Strips the internal warnings — this document goes to clients. */
const isInternal = (s: string) => /^[⚠🔴]/.test(s.trim());

const paras = (text: string) =>
  esc(text)
    .split(/\n{2,}/)
    .filter((p) => p.trim() && !isInternal(p))
    .map((p) => `<p>${p.replace(/\n/g, "<br/>")}</p>`)
    .join("");

export async function GET(req: Request) {
  const download = new URL(req.url).searchParams.get("dl") === "1";

  const blocks = BLOCK_SEEDS.map((b) => {
    const meta = [
      b.duration && b.duration !== "לא מתועד" ? `⏱ ${esc(b.duration)}` : null,
      b.groupSize && b.groupSize !== "לא מתועד" ? `👥 ${esc(b.groupSize)}` : null,
    ]
      .filter(Boolean)
      .join(" &nbsp;·&nbsp; ");

    return `
      <section>
        <h2>${esc(b.name)}</h2>
        <p class="promise">${esc(b.tagline)}</p>
        ${meta ? `<p class="meta">${meta}</p>` : ""}
        ${paras(b.description)}
        ${
          b.marketingPitch
            ? `<div class="pitch">${esc(b.marketingPitch)}</div>`
            : ""
        }
        ${
          b.marketingAudience
            ? `<p class="audience"><strong>למי זה מתאים:</strong> ${esc(
                b.marketingAudience
              )}</p>`
            : ""
        }
      </section>`;
  }).join("");

  const html = `<!DOCTYPE html>
<html dir="rtl" lang="he"><head><meta charset="utf-8"/>
<title>ARC · הבלוקים</title>
<style>
  @page { size: A4; margin: 2cm; }
  body { font-family: 'Assistant','Heebo',Arial,sans-serif; color: ${INK};
         font-size: 12pt; line-height: 1.7; max-width: 21cm; margin: 0 auto;
         padding: 2cm 1.5cm; }
  .logo { width: 150px; height: auto; margin-bottom: 2rem; }
  h1 { color: ${BLUE}; font-size: 28pt; margin: 0 0 .3rem; }
  .sub { color: ${MUTED}; font-size: 13pt; margin-bottom: .3rem; }
  .date { color: ${MUTED}; font-size: 10pt; }
  hr { border: 0; border-top: 2px solid ${PAPER}; margin: 2rem 0; }
  section { margin-bottom: 2.5rem; page-break-inside: avoid; }
  h2 { color: ${BLUE}; font-size: 17pt; margin: 0 0 .3rem; }
  .promise { font-size: 13pt; color: ${BLUE}; font-style: italic;
             margin: 0 0 .5rem; }
  .meta { color: ${MUTED}; font-size: 10pt; margin: 0 0 .8rem; }
  .pitch { background: ${PAPER}; border-right: 3px solid ${BLUE};
           padding: .8rem 1rem; margin: 1rem 0; font-size: 11pt; }
  .audience { color: ${MUTED}; font-size: 10pt; }
  .audience strong { color: ${BLUE}; }
  footer { margin-top: 3rem; padding-top: 1rem; border-top: 1px solid ${PAPER};
           color: ${MUTED}; font-size: 10pt; text-align: center; }
</style></head>
<body>
<img class="logo" src="${logoDataUri()}" width="150" alt="Arc"/>
<h1>הבלוקים</h1>
<div class="sub">אבני הבניין שמהן אנחנו מרכיבים סדנאות, אופסייטים וריטריטים</div>
<div class="date">${new Date().toLocaleDateString("he-IL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })}</div>
<hr/>
${blocks}
<footer>ARC · Irreplaceable Experiences</footer>
</body></html>`;

  return new Response(download ? "﻿" + html : html, {
    headers: {
      "Content-Type": download
        ? "application/msword; charset=utf-8"
        : "text/html; charset=utf-8",
      ...(download && {
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(
          "ARC — הבלוקים.doc"
        )}`,
      }),
    },
  });
}
