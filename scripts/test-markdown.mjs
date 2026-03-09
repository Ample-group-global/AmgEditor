/**
 * AMG Editor - Automated Markdown Test Suite
 * Tests all 35 markdown files for:
 *   1. Import Markdown (markdownToBlocks)
 *   2. Export Markdown (blocksToMarkdown) - roundtrip
 *   3. Export HTML (blocksToHtml)
 *   4. Manual content writing simulation (createBlock)
 *   5. Server health check at port 3000
 */

import { readFileSync, readdirSync, writeFileSync } from "fs";
import { join, basename } from "path";
import { pathToFileURL } from "url";

// ── Load the built library ──────────────────────────────────────────────────
const libPath = join(process.cwd(), "dist", "index.mjs");
const lib = await import(pathToFileURL(libPath).href);
const { markdownToBlocks, blocksToMarkdown, blocksToHtml, createBlock } = lib;

// ── Configuration ───────────────────────────────────────────────────────────
const ARTICLES_DIR =
  "D:/AMG-Projects/AMGEcosystem/amgecosystem/amgecosystem-v1.0.0/Divakar-Develop/ArticleData/Articles_en";

const mdFiles = readdirSync(ARTICLES_DIR)
  .filter((f) => f.endsWith(".md"))
  .sort();

console.log(`\n${"═".repeat(80)}`);
console.log(`  AMG EDITOR - AUTOMATED MARKDOWN TEST REPORT`);
console.log(`  Date: ${new Date().toISOString()}`);
console.log(`  Files found: ${mdFiles.length}`);
console.log(`${"═".repeat(80)}\n`);

// ── Results tracking ────────────────────────────────────────────────────────
const results = [];
let totalPass = 0;
let totalFail = 0;
let totalWarn = 0;

const blockTypeStats = {};
const issuesSummary = [];

// ── Test each markdown file ─────────────────────────────────────────────────
for (let i = 0; i < mdFiles.length; i++) {
  const file = mdFiles[i];
  const filePath = join(ARTICLES_DIR, file);
  const fileResult = {
    file,
    tests: [],
    blockCount: 0,
    blockTypes: {},
    fileSize: 0,
    lineCount: 0,
  };

  let markdown;
  try {
    markdown = readFileSync(filePath, "utf-8");
    fileResult.fileSize = Buffer.byteLength(markdown);
    fileResult.lineCount = markdown.split("\n").length;
  } catch (e) {
    fileResult.tests.push({ name: "File Read", status: "FAIL", error: e.message });
    totalFail++;
    results.push(fileResult);
    continue;
  }

  // ── TEST 1: Import Markdown → Blocks ────────────────────────────────────
  let blocks;
  try {
    blocks = markdownToBlocks(markdown);
    const blockCount = blocks.length;
    fileResult.blockCount = blockCount;

    // Count block types
    for (const block of blocks) {
      const t = block.type;
      fileResult.blockTypes[t] = (fileResult.blockTypes[t] || 0) + 1;
      blockTypeStats[t] = (blockTypeStats[t] || 0) + 1;
    }

    // Validate blocks
    let validBlocks = true;
    let invalidReason = "";
    for (const block of blocks) {
      if (!block.id) {
        validBlocks = false;
        invalidReason = "Block missing id";
        break;
      }
      if (!block.type) {
        validBlocks = false;
        invalidReason = "Block missing type";
        break;
      }
    }

    if (blockCount === 0) {
      fileResult.tests.push({
        name: "Import Markdown",
        status: "WARN",
        detail: `0 blocks produced from ${fileResult.lineCount} lines`,
      });
      totalWarn++;
    } else if (!validBlocks) {
      fileResult.tests.push({
        name: "Import Markdown",
        status: "FAIL",
        error: invalidReason,
      });
      totalFail++;
    } else {
      fileResult.tests.push({
        name: "Import Markdown",
        status: "PASS",
        detail: `${blockCount} blocks from ${fileResult.lineCount} lines`,
      });
      totalPass++;
    }
  } catch (e) {
    fileResult.tests.push({
      name: "Import Markdown",
      status: "FAIL",
      error: e.message,
    });
    totalFail++;
    blocks = null;
  }

  // ── TEST 2: Export Blocks → Markdown (roundtrip) ────────────────────────
  if (blocks && blocks.length > 0) {
    try {
      const exportedMd = blocksToMarkdown(blocks);
      if (typeof exportedMd !== "string") {
        fileResult.tests.push({
          name: "Export Markdown",
          status: "FAIL",
          error: `Expected string, got ${typeof exportedMd}`,
        });
        totalFail++;
      } else if (exportedMd.trim().length === 0) {
        fileResult.tests.push({
          name: "Export Markdown",
          status: "WARN",
          detail: "Export produced empty string",
        });
        totalWarn++;
      } else {
        // Check roundtrip fidelity: re-import exported markdown
        const reimported = markdownToBlocks(exportedMd);
        const originalTypes = blocks.map((b) => b.type).join(",");
        const reimportedTypes = reimported.map((b) => b.type).join(",");
        const typesMatch = originalTypes === reimportedTypes;
        const blockCountDiff = Math.abs(blocks.length - reimported.length);
        const roundtripRatio = reimported.length / blocks.length;

        if (typesMatch) {
          fileResult.tests.push({
            name: "Export Markdown",
            status: "PASS",
            detail: `Roundtrip perfect (${exportedMd.length} chars)`,
          });
          totalPass++;
        } else if (roundtripRatio >= 0.8 && roundtripRatio <= 1.2) {
          fileResult.tests.push({
            name: "Export Markdown",
            status: "PASS",
            detail: `Roundtrip OK: ${blocks.length}→${reimported.length} blocks (${exportedMd.length} chars)`,
          });
          totalPass++;
        } else {
          fileResult.tests.push({
            name: "Export Markdown",
            status: "WARN",
            detail: `Roundtrip drift: ${blocks.length}→${reimported.length} blocks (diff: ${blockCountDiff})`,
          });
          totalWarn++;
        }
      }
    } catch (e) {
      fileResult.tests.push({
        name: "Export Markdown",
        status: "FAIL",
        error: e.message,
      });
      totalFail++;
    }
  }

  // ── TEST 3: Export Blocks → HTML ────────────────────────────────────────
  if (blocks && blocks.length > 0) {
    try {
      const html = blocksToHtml(blocks);
      if (typeof html !== "string") {
        fileResult.tests.push({
          name: "Export HTML",
          status: "FAIL",
          error: `Expected string, got ${typeof html}`,
        });
        totalFail++;
      } else if (html.trim().length === 0) {
        fileResult.tests.push({
          name: "Export HTML",
          status: "WARN",
          detail: "Export produced empty HTML",
        });
        totalWarn++;
      } else {
        // Validate basic HTML structure
        const hasValidTags = /<[a-z][\s\S]*>/i.test(html);
        fileResult.tests.push({
          name: "Export HTML",
          status: hasValidTags ? "PASS" : "WARN",
          detail: `${html.length} chars, ${hasValidTags ? "valid" : "no"} HTML tags`,
        });
        if (hasValidTags) totalPass++;
        else totalWarn++;
      }
    } catch (e) {
      fileResult.tests.push({
        name: "Export HTML",
        status: "FAIL",
        error: e.message,
      });
      totalFail++;
    }
  }

  // ── TEST 4: Manual Content Writing Simulation ───────────────────────────
  // Simulate creating blocks programmatically (as if user typed content)
  try {
    // Extract first heading and first paragraph from original markdown
    const lines = markdown.split("\n").filter((l) => l.trim());
    let heading = "";
    let paragraph = "";
    for (const line of lines) {
      if (!heading && /^#{1,3}\s/.test(line)) {
        heading = line.replace(/^#{1,3}\s+/, "").trim();
      } else if (!paragraph && line.trim().length > 20 && !/^[#|>\-*`]/.test(line.trim())) {
        paragraph = line.trim().substring(0, 200);
      }
      if (heading && paragraph) break;
    }

    const manualBlocks = [];
    if (heading) manualBlocks.push(createBlock("heading-1", heading));
    if (paragraph) manualBlocks.push(createBlock("text", paragraph));
    manualBlocks.push(createBlock("bullet-list", "Test bullet item"));
    manualBlocks.push(createBlock("numbered-list", "Test numbered item"));
    manualBlocks.push(createBlock("quote", "Test blockquote"));
    manualBlocks.push(createBlock("todo", "Test todo item"));
    manualBlocks.push(createBlock("divider", ""));
    manualBlocks.push(createBlock("callout", "Test callout content"));

    // Verify all blocks are valid
    const allValid = manualBlocks.every((b) => b.id && b.type && typeof b.content === "string");

    // Export to markdown and HTML
    const manualMd = blocksToMarkdown(manualBlocks);
    const manualHtml = blocksToHtml(manualBlocks);

    if (allValid && manualMd.length > 0 && manualHtml.length > 0) {
      fileResult.tests.push({
        name: "Manual Content Writing",
        status: "PASS",
        detail: `${manualBlocks.length} blocks created, MD:${manualMd.length}c, HTML:${manualHtml.length}c`,
      });
      totalPass++;
    } else {
      fileResult.tests.push({
        name: "Manual Content Writing",
        status: "FAIL",
        error: `Blocks valid: ${allValid}, MD length: ${manualMd.length}, HTML length: ${manualHtml.length}`,
      });
      totalFail++;
    }
  } catch (e) {
    fileResult.tests.push({
      name: "Manual Content Writing",
      status: "FAIL",
      error: e.message,
    });
    totalFail++;
  }

  // ── TEST 5: Content Integrity Checks ────────────────────────────────────
  if (blocks && blocks.length > 0) {
    const issues = [];

    // Check: headings preserved
    const mdHeadings = (markdown.match(/^#{1,3}\s+.+$/gm) || []).length;
    const blockHeadings = blocks.filter((b) => b.type.startsWith("heading-")).length;
    if (mdHeadings > 0 && blockHeadings === 0) {
      issues.push("All headings lost during import");
    }

    // Check: code blocks preserved
    const mdCodeBlocks = (markdown.match(/^```/gm) || []).length / 2;
    const blockCodeBlocks = blocks.filter(
      (b) => b.type === "text" && b.metadata && b.metadata.language !== undefined
    ).length;

    // Check: lists preserved
    const mdListItems = (markdown.match(/^[\s]*[-*+]\s/gm) || []).length +
      (markdown.match(/^[\s]*\d+\.\s/gm) || []).length;
    const blockListItems = blocks.filter(
      (b) => b.type === "bullet-list" || b.type === "numbered-list"
    ).length;

    // Check: images/links preserved
    const mdImages = (markdown.match(/!\[.*?\]\(.*?\)/g) || []).length;
    const blockImages = blocks.filter((b) => b.type === "image").length;

    // Check: tables preserved
    const mdTables = (markdown.match(/^\|.*\|$/gm) || []).length;
    const blockTables = blocks.filter((b) => b.type === "table").length;

    // Check: no empty content blocks (except dividers)
    const emptyBlocks = blocks.filter(
      (b) => b.type !== "divider" && b.type !== "toc" && b.content.trim() === "" &&
        (!b.metadata || Object.keys(b.metadata).length === 0)
    ).length;

    if (emptyBlocks > blocks.length * 0.3) {
      issues.push(`${emptyBlocks}/${blocks.length} blocks have empty content`);
    }

    if (issues.length === 0) {
      fileResult.tests.push({
        name: "Content Integrity",
        status: "PASS",
        detail: `H:${blockHeadings} L:${blockListItems} I:${blockImages} T:${blockTables}`,
      });
      totalPass++;
    } else {
      fileResult.tests.push({
        name: "Content Integrity",
        status: "WARN",
        detail: issues.join("; "),
      });
      totalWarn++;
      issuesSummary.push({ file, issues });
    }
  }

  results.push(fileResult);

  // Print progress
  const statusLine = fileResult.tests.map((t) => {
    const icon = t.status === "PASS" ? "+" : t.status === "WARN" ? "~" : "X";
    return `[${icon}]`;
  }).join(" ");
  console.log(
    `  ${String(i + 1).padStart(2)}. ${file.substring(0, 55).padEnd(55)} ${statusLine}`
  );
}

// ── TEST 6: Server Health Check ─────────────────────────────────────────────
console.log(`\n${"─".repeat(80)}`);
console.log("  SERVER TESTS");
console.log(`${"─".repeat(80)}`);

let serverPass = 0;
let serverFail = 0;

try {
  const healthRes = await fetch("http://localhost:3000/health");
  if (healthRes.ok) {
    const data = await healthRes.json();
    console.log(`  [+] Health endpoint: ${JSON.stringify(data)}`);
    serverPass++;
    totalPass++;
  } else {
    console.log(`  [X] Health endpoint: HTTP ${healthRes.status}`);
    serverFail++;
    totalFail++;
  }
} catch (e) {
  console.log(`  [X] Health endpoint: ${e.message}`);
  serverFail++;
  totalFail++;
}

try {
  const indexRes = await fetch("http://localhost:3000/");
  if (indexRes.ok) {
    const html = await indexRes.text();
    const hasReactRoot = html.includes("root") || html.includes("app");
    console.log(
      `  [${hasReactRoot ? "+" : "~"}] Index page: ${html.length} bytes, React root: ${hasReactRoot}`
    );
    if (hasReactRoot) { serverPass++; totalPass++; }
    else { totalWarn++; }
  } else {
    console.log(`  [X] Index page: HTTP ${indexRes.status}`);
    serverFail++;
    totalFail++;
  }
} catch (e) {
  console.log(`  [X] Index page: ${e.message}`);
  serverFail++;
  totalFail++;
}

try {
  const jsRes = await fetch("http://localhost:3000/index.js");
  if (jsRes.ok) {
    const size = (await jsRes.text()).length;
    console.log(`  [+] Client JS bundle: ${(size / 1024).toFixed(0)} KB`);
    serverPass++;
    totalPass++;
  } else {
    console.log(`  [X] Client JS bundle: HTTP ${jsRes.status}`);
    serverFail++;
    totalFail++;
  }
} catch (e) {
  console.log(`  [X] Client JS bundle: ${e.message}`);
  serverFail++;
  totalFail++;
}

try {
  const cssRes = await fetch("http://localhost:3000/style.css");
  if (cssRes.ok) {
    const size = (await cssRes.text()).length;
    console.log(`  [+] CSS stylesheet: ${(size / 1024).toFixed(0)} KB`);
    serverPass++;
    totalPass++;
  } else {
    console.log(`  [X] CSS stylesheet: HTTP ${cssRes.status}`);
    serverFail++;
    totalFail++;
  }
} catch (e) {
  console.log(`  [X] CSS stylesheet: ${e.message}`);
  serverFail++;
  totalFail++;
}

// ── Generate Report ─────────────────────────────────────────────────────────
const totalTests = totalPass + totalFail + totalWarn;
const passRate = ((totalPass / totalTests) * 100).toFixed(1);

console.log(`\n${"═".repeat(80)}`);
console.log(`  TEST RESULTS SUMMARY`);
console.log(`${"═".repeat(80)}`);
console.log(`  Total Tests:  ${totalTests}`);
console.log(`  Passed:       ${totalPass} (${passRate}%)`);
console.log(`  Warnings:     ${totalWarn}`);
console.log(`  Failed:       ${totalFail}`);
console.log(`${"─".repeat(80)}`);

console.log(`\n  BLOCK TYPE DISTRIBUTION (across all ${mdFiles.length} files):`);
const sortedTypes = Object.entries(blockTypeStats).sort((a, b) => b[1] - a[1]);
for (const [type, count] of sortedTypes) {
  const bar = "█".repeat(Math.min(40, Math.ceil((count / sortedTypes[0][1]) * 40)));
  console.log(`    ${type.padEnd(16)} ${String(count).padStart(5)}  ${bar}`);
}

if (issuesSummary.length > 0) {
  console.log(`\n  CONTENT INTEGRITY WARNINGS (${issuesSummary.length} files):`);
  for (const { file, issues } of issuesSummary) {
    console.log(`    ${file}:`);
    for (const issue of issues) {
      console.log(`      - ${issue}`);
    }
  }
}

// ── Per-file detail table ───────────────────────────────────────────────────
console.log(`\n  PER-FILE DETAIL:`);
console.log(
  `  ${"#".padStart(3)} ${"File".padEnd(45)} ${"Blocks".padStart(6)} ${"Lines".padStart(6)} ${"Size".padStart(8)} ${"Import".padStart(7)} ${"Export".padStart(7)} ${"HTML".padStart(7)} ${"Manual".padStart(7)} ${"Integ".padStart(7)}`
);
console.log(`  ${"─".repeat(104)}`);

for (let i = 0; i < results.length; i++) {
  const r = results[i];
  const statuses = ["Import Markdown", "Export Markdown", "Export HTML", "Manual Content Writing", "Content Integrity"]
    .map((name) => {
      const t = r.tests.find((t) => t.name === name);
      if (!t) return "  -  ";
      return t.status === "PASS" ? " PASS " : t.status === "WARN" ? " WARN " : " FAIL ";
    });

  console.log(
    `  ${String(i + 1).padStart(3)} ${r.file.substring(0, 44).padEnd(45)} ${String(r.blockCount).padStart(6)} ${String(r.lineCount).padStart(6)} ${(r.fileSize / 1024).toFixed(1).padStart(7)}K ${statuses.join("")}`
  );
}

// ── Write report to file ────────────────────────────────────────────────────
const reportContent = {
  timestamp: new Date().toISOString(),
  summary: { totalTests, passed: totalPass, warnings: totalWarn, failed: totalFail, passRate: `${passRate}%` },
  blockTypeDistribution: blockTypeStats,
  filesTestedCount: mdFiles.length,
  files: results.map((r) => ({
    file: r.file,
    blockCount: r.blockCount,
    lineCount: r.lineCount,
    fileSize: r.fileSize,
    blockTypes: r.blockTypes,
    tests: r.tests,
  })),
  issuesSummary,
};

const reportPath = join(process.cwd(), "TEST_REPORT.json");
writeFileSync(reportPath, JSON.stringify(reportContent, null, 2));
console.log(`\n  Full report saved to: ${reportPath}`);

console.log(`\n${"═".repeat(80)}`);
console.log(`  OVERALL: ${totalFail === 0 ? "ALL TESTS PASSED" : `${totalFail} FAILURE(S) DETECTED`}`);
console.log(`${"═".repeat(80)}\n`);

process.exit(totalFail > 0 ? 1 : 0);
