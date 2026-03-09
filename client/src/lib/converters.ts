import { Block, BlockType, createBlock } from "./editor-types";

// ─── Emoji shortcode map ────────────────────────────────────────────────────
const EMOJI_MAP: Record<string, string> = {
  // Smileys
  smile: "\u{1F604}", grinning: "\u{1F600}", joy: "\u{1F602}", heart_eyes: "\u{1F60D}",
  wink: "\u{1F609}", thinking: "\u{1F914}", sunglasses: "\u{1F60E}", sweat_smile: "\u{1F605}",
  laughing: "\u{1F606}", rofl: "\u{1F923}", blush: "\u{1F60A}", innocent: "\u{1F607}",
  // Hands
  thumbsup: "\u{1F44D}", "+1": "\u{1F44D}", thumbsdown: "\u{1F44E}", "-1": "\u{1F44E}",
  clap: "\u{1F44F}", wave: "\u{1F44B}", ok_hand: "\u{1F44C}", raised_hands: "\u{1F64C}",
  pray: "\u{1F64F}", muscle: "\u{1F4AA}", point_up: "\u261D\uFE0F", point_down: "\u{1F447}",
  point_left: "\u{1F448}", point_right: "\u{1F449}",
  // Objects
  rocket: "\u{1F680}", fire: "\u{1F525}", star: "\u2B50", sparkles: "\u2728",
  heart: "\u2764\uFE0F", broken_heart: "\u{1F494}", bomb: "\u{1F4A3}",
  bulb: "\u{1F4A1}", lightbulb: "\u{1F4A1}", gem: "\u{1F48E}",
  key: "\u{1F511}", lock: "\u{1F512}", unlock: "\u{1F513}",
  bell: "\u{1F514}", trophy: "\u{1F3C6}", medal: "\u{1F3C5}",
  // Symbols & Arrows
  check: "\u2705", white_check_mark: "\u2705", heavy_check_mark: "\u2714\uFE0F",
  x: "\u274C", warning: "\u26A0\uFE0F", exclamation: "\u2757",
  question: "\u2753", info: "\u2139\uFE0F", no_entry: "\u26D4",
  arrow_left: "\u2B05\uFE0F", arrow_right: "\u27A1\uFE0F",
  arrow_up: "\u2B06\uFE0F", arrow_down: "\u2B07\uFE0F",
  arrow_upper_left: "\u2196\uFE0F", arrow_upper_right: "\u2197\uFE0F",
  arrow_lower_left: "\u2199\uFE0F", arrow_lower_right: "\u2198\uFE0F",
  // Misc
  tada: "\u{1F389}", party_popper: "\u{1F389}", confetti_ball: "\u{1F38A}",
  gift: "\u{1F381}", balloon: "\u{1F388}", ribbon: "\u{1F380}",
  memo: "\u{1F4DD}", pencil: "\u270F\uFE0F", pencil2: "\u270F\uFE0F",
  book: "\u{1F4D6}", books: "\u{1F4DA}", bookmark: "\u{1F516}",
  link: "\u{1F517}", paperclip: "\u{1F4CE}", scissors: "\u2702\uFE0F",
  pushpin: "\u{1F4CC}", pin: "\u{1F4CC}", round_pushpin: "\u{1F4CD}",
  mag: "\u{1F50D}", mag_right: "\u{1F50E}",
  wrench: "\u{1F527}", hammer: "\u{1F528}", gear: "\u2699\uFE0F",
  // Tech
  computer: "\u{1F4BB}", keyboard: "\u2328\uFE0F", video_game: "\u{1F3AE}",
  joystick: "\u{1F579}\uFE0F", phone: "\u{1F4F1}", email: "\u{1F4E7}",
  inbox_tray: "\u{1F4E5}", outbox_tray: "\u{1F4E4}",
  package: "\u{1F4E6}", bug: "\u{1F41B}", robot: "\u{1F916}",
  // Weather/Nature
  sunny: "\u2600\uFE0F", cloud: "\u2601\uFE0F", rain: "\u{1F327}\uFE0F",
  zap: "\u26A1", snowflake: "\u2744\uFE0F", rainbow: "\u{1F308}",
  earth_americas: "\u{1F30E}", earth_asia: "\u{1F30F}",
  // Food
  coffee: "\u2615", pizza: "\u{1F355}", beer: "\u{1F37A}",
  // People
  eyes: "\u{1F440}", brain: "\u{1F9E0}",
};

function resolveEmoji(text: string): string {
  return text.replace(/:([a-z0-9_+-]+):/gi, (match, name) => {
    return EMOJI_MAP[name.toLowerCase()] || match;
  });
}

// ─── Export: Blocks → Markdown ──────────────────────────────────────────────

export function blocksToMarkdown(blocks: Block[]): string {
  return blocks
    .map(block => {
      const indent = block.props?.indent ? "  ".repeat(block.props.indent as number) : "";
      switch (block.type) {
        case "heading-1":
          return `# ${block.content}`;
        case "heading-2":
          return `## ${block.content}`;
        case "heading-3":
          return `### ${block.content}`;
        case "bullet-list":
          return `${indent}- ${block.content}`;
        case "numbered-list":
          return `${indent}1. ${block.content}`;
        case "todo": {
          const checked = block.metadata?.checked ? "x" : " ";
          return `${indent}- [${checked}] ${block.content}`;
        }
        case "quote": {
          const quoteDepth = (block.props?.indent as number || 0) + 1;
          const prefix = ">".repeat(quoteDepth) + " ";
          return block.content
            .split("\n")
            .map(l => `${prefix}${l}`)
            .join("\n");
        }
        case "divider":
          return `---`;
        case "toc":
          return `[TOC]`;
        case "image":
          return `![${block.metadata?.caption || "Image"}](${block.content})`;
        case "video":
          return `[Video](${block.content})`;
        case "file":
          return `[File: ${block.metadata?.fileName || "Download"}](${block.content})`;
        case "callout":
          if (block.metadata?.isCode) {
            const lang = block.metadata?.language || "";
            return `\`\`\`${lang}\n${block.content}\n\`\`\``;
          }
          if (block.metadata?.isMath) {
            return `$$\n${block.content}\n$$`;
          }
          if (block.metadata?.isDiagram) {
            if (block.metadata.diagramType === "plantuml") {
              return `@startuml\n${block.content}\n@enduml`;
            }
            return `\`\`\`mermaid\n${block.content}\n\`\`\``;
          }
          if (block.metadata?.calloutType) {
            return `:::${block.metadata.calloutType}\n${block.content}\n:::`;
          }
          return block.content;
        case "table": {
          const tableData = block.metadata?.tableData;
          if (tableData?.cells && tableData.cells.length > 0) {
            const allRows = tableData.cells.map((row: string[]) =>
              `| ${row.join(" | ")} |`
            );
            const aligns: string[] = tableData.alignments || [];
            const headerSeparator = `| ${Array(tableData.cols).fill(null).map((_: null, ci: number) => {
              const a = aligns[ci] || "";
              if (a === "center") return ":---:";
              if (a === "right") return "---:";
              if (a === "left") return ":---";
              return "---";
            }).join(" | ")} |`;
            // Header row, then separator, then data rows
            return `${allRows[0]}\n${headerSeparator}\n${allRows.slice(1).join("\n")}`;
          }
          return "";
        }
        default:
          return block.content;
      }
    })
    .join("\n\n");
}

// ─── Export: Blocks → HTML ──────────────────────────────────────────────────

export function blocksToHtml(blocks: Block[]): string {
  return blocks
    .map(block => {
      switch (block.type) {
        case "heading-1":
          return `<h1>${block.content}</h1>`;
        case "heading-2":
          return `<h2>${block.content}</h2>`;
        case "heading-3":
          return `<h3>${block.content}</h3>`;
        case "bullet-list":
          return `<ul><li>${block.content}</li></ul>`;
        case "numbered-list":
          return `<ol><li>${block.content}</li></ol>`;
        case "todo": {
          const checked = block.metadata?.checked ? " checked" : "";
          return `<ul class="todo"><li><input type="checkbox"${checked} disabled /> ${block.content}</li></ul>`;
        }
        case "quote":
          return `<blockquote>${block.content}</blockquote>`;
        case "divider":
          return `<hr />`;
        case "toc":
          return `<!-- [TOC] -->`;
        case "image":
          return `<img src="${block.content}" alt="${block.metadata?.caption || ""}" />`;
        case "video":
          return `<video src="${block.content}" controls></video>`;
        case "file":
          return `<a href="${block.content}" download>${block.metadata?.fileName || "Download File"}</a>`;
        case "callout":
          if (block.metadata?.isCode) {
            const lang = block.metadata?.language || "";
            return `<pre><code${lang ? ` class="language-${lang}"` : ""}>${block.content}</code></pre>`;
          }
          if (block.metadata?.isMath) {
            return `<div class="math-block">$$${block.content}$$</div>`;
          }
          if (block.metadata?.isDiagram) {
            return `<pre class="mermaid">${block.content}</pre>`;
          }
          if (block.metadata?.calloutType) {
            return `<div class="callout callout-${block.metadata.calloutType}">${block.content}</div>`;
          }
          return `<div class="callout">${block.content}</div>`;
        case "table": {
          const tblData = block.metadata?.tableData;
          if (tblData?.cells) {
            const aligns: string[] = tblData.alignments || [];
            const rows = tblData.cells.map((row: string[], rowIdx: number) => {
              const cells = row.map((cell: string, colIdx: number) => {
                const tag = rowIdx === 0 ? "th" : "td";
                const align = aligns[colIdx] ? ` style="text-align:${aligns[colIdx]}"` : "";
                return `<${tag}${align}>${cell || ""}</${tag}>`;
              }).join("");
              return `<tr>${cells}</tr>`;
            }).join("");
            return `<table><tbody>${rows}</tbody></table>`;
          }
          return "";
        }
        default:
          return `<p>${block.content}</p>`;
      }
    })
    .join("\n");
}

// ─── Inline Markdown → HTML ─────────────────────────────────────────────────

/**
 * Converts inline markdown to HTML for visual rendering in the editor.
 * Handles: bold-italic, bold, italic, strikethrough, highlight,
 * superscript, subscript, inline code, links, emoji shortcodes.
 */
function strip(text: string, refLinks?: Map<string, string>, footnotes?: Map<string, string>): string {
  // (#2) Escape characters: replace \X with a placeholder, restore after all formatting
  const escapes: string[] = [];
  let result = text.replace(/\\([\\`*_{}[\]()#+\-.!~=^|>])/g, (_, ch) => {
    escapes.push(ch);
    return `\x00ESC${escapes.length - 1}\x00`;
  });

  // (#7) Strip HTML comments <!-- ... -->
  result = result.replace(/<!--[\s\S]*?-->/g, "");

  // First: handle inline images BEFORE links (to prevent ![alt](url) matching [alt](url))
  result = result.replace(
    /!\[([^\]]*)\]\(([^)]+)\)/g,
    '<img src="$2" alt="$1" style="max-width:100%;height:auto;display:inline-block;vertical-align:middle;" />'
  );

  // Linked images [![alt](img)](url) — already converted img above, now wrap remaining
  result = result.replace(
    /\[(<img [^>]+>)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
  );

  result = result
    // ***bold-italic*** or ___bold-italic___
    .replace(/\*\*\*(.*?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/___(.*?)___/g, "<strong><em>$1</em></strong>")
    // _**bold-italic**_ or **_bold-italic_**
    .replace(/_\*\*(.*?)\*\*_/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*_(.*?)_\*\*/g, "<strong><em>$1</em></strong>")
    // **bold**
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    // ~~strikethrough~~
    .replace(/~~(.*?)~~/g, "<del>$1</del>")
    // (#6) ||spoiler|| (Discord-style)
    .replace(/\|\|(.+?)\|\|/g, '<span class="spoiler" style="background:#333;color:#333;padding:0 4px;border-radius:3px;cursor:pointer" onclick="this.style.color=\'inherit\';this.style.background=\'#e0e0e0\'">$1</span>')
    // ==highlight== or <mark>text</mark>
    .replace(/==(.*?)==/g, "<mark>$1</mark>")
    // ^superscript^
    .replace(/\^([^^]+?)\^/g, "<sup>$1</sup>")
    // ~subscript~ (single tilde, not ~~)
    .replace(/(?<!~)~([^~]+?)~(?!~)/g, "<sub>$1</sub>")
    // *italic* (single asterisk)
    .replace(/(?<!\w)\*([^*]+?)\*(?!\w)/g, "<em>$1</em>")
    // _italic_ (underscores)
    .replace(/(?<!\w)_([^_]+?)_(?!\w)/g, "<em>$1</em>")
    // `inline code`
    .replace(/`([^`]+)`/g, "<code>$1</code>");

  // (#5) <kbd>Key</kbd> — style keyboard keys
  result = result.replace(/<kbd>([^<]+)<\/kbd>/g,
    '<kbd style="background:#f4f4f4;border:1px solid #ccc;border-radius:3px;padding:1px 6px;font-size:0.85em;font-family:monospace;box-shadow:0 1px 0 #999">$1</kbd>');

  // (#9) [link text](url "title") — links with optional title
  result = result.replace(
    /\[([^\]]+)\]\(([^)\s]+)\s+"([^"]+)"\)/g,
    '<a href="$2" title="$3" target="_blank" rel="noopener noreferrer">$1</a>'
  );
  // [link text](url) — without title
  result = result.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
  );

  // Reference-style links: [text][ref] → resolved via refLinks map
  if (refLinks && refLinks.size > 0) {
    result = result.replace(/\[([^\]]+)\]\[([^\]]*)\]/g, (match, text, ref) => {
      const key = (ref || text).toLowerCase();
      const url = refLinks.get(key);
      if (url) {
        return `<a href="${url}" target="_blank" rel="noopener noreferrer">${text}</a>`;
      }
      return match;
    });
    // Shorthand reference links: [text][] or standalone [text] with matching ref
    result = result.replace(/\[([^\]]+)\](?:\[\])?(?!\()/g, (match, text) => {
      const key = text.toLowerCase();
      const url = refLinks.get(key);
      if (url) {
        return `<a href="${url}" target="_blank" rel="noopener noreferrer">${text}</a>`;
      }
      return match;
    });
  }

  // (#3) Footnote references [^1] → superscript link
  if (footnotes && footnotes.size > 0) {
    result = result.replace(/\[\^([^\]]+)\]/g, (match, id) => {
      const note = footnotes.get(id);
      if (note) {
        return `<sup class="footnote-ref" title="${note.replace(/"/g, '&quot;')}" style="cursor:help"><a id="fnref-${id}" href="#fn-${id}">[${id}]</a></sup>`;
      }
      return `<sup>[${id}]</sup>`;
    });
  } else {
    // Still render footnote refs as superscript even without definitions
    result = result.replace(/\[\^([^\]]+)\]/g, '<sup>[$1]</sup>');
  }

  // Emoji shortcodes :name:
  result = resolveEmoji(result);

  // Inline math $...$ → wrap in span for KaTeX rendering
  result = result.replace(/(?<!\$)\$(?!\$)(.+?)(?<!\$)\$(?!\$)/g, '<span class="math-inline">$$$1$$</span>');

  // Font Awesome <i class="fa ..."></i> → approximate with Unicode or keep as-is
  const FA_MAP: Record<string, string> = {
    "share-alt": "↗", "link": "🔗", "check": "✓", "times": "✗",
    "arrow-right": "→", "arrow-left": "←", "arrow-up": "↑", "arrow-down": "↓",
    "star": "★", "heart": "♥", "home": "🏠", "search": "🔍",
    "cog": "⚙", "user": "👤", "envelope": "✉", "pencil": "✏",
    "trash": "🗑", "download": "⬇", "upload": "⬆", "file": "📄",
    "folder": "📁", "calendar": "📅", "clock-o": "🕐", "bell": "🔔",
    "comment": "💬", "book": "📖", "code": "💻", "eye": "👁",
  };
  result = result.replace(/<i\s+class="fa\s+fa-([^"]+)"[^>]*><\/i>/g, (match, icon) => {
    return FA_MAP[icon] || match;
  });

  // Strip [color=...] inline annotations (HackMD-specific, not renderable)
  result = result.replace(/\[color=[^\]]*\]/g, "");

  // (#8) Angle bracket autolinks: <https://url> → clickable link
  result = result.replace(/<(https?:\/\/[^>]+)>/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');

  // Bare URL autolink: convert plain https://... and http://... to clickable links
  // Only match URLs NOT already inside an HTML tag attribute (href="..." or src="...")
  result = result.replace(
    /(?<!=["'])(?<![<"'])(https?:\/\/[^\s<>\[\]"')\]]+)/g,
    (match, url, offset) => {
      // Check if this URL is already inside an <a> or <img> tag
      const before = result.substring(Math.max(0, offset - 100), offset);
      if (/(?:href|src)=["'][^"']*$/.test(before)) return match;
      // Check if already wrapped in an <a> tag
      if (/<a\s[^>]*$/.test(before)) return match;
      // Clean trailing punctuation that's likely sentence-ending
      let cleanUrl = url.replace(/[.,;:!?)]+$/, "");
      const trailing = url.substring(cleanUrl.length);
      return `<a href="${cleanUrl}" target="_blank" rel="noopener noreferrer">${cleanUrl}</a>${trailing}`;
    }
  );

  // (#12/#13/#14) Preserve HTML inline elements: <mark>, <span style=...>, <img width=...>, <sub>, <sup>, <kbd>
  // These are already preserved since we don't strip HTML — just pass them through

  // (#2) Restore escaped characters
  result = result.replace(/\x00ESC(\d+)\x00/g, (_, idx) => escapes[parseInt(idx)]);

  return result;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function isBlank(line: string): boolean {
  return line.trim() === "";
}

function hasBlockPrefix(trimmed: string): boolean {
  if (/^#{1,6}\s/.test(trimmed)) return true;
  if (/^[\-\*+]\s/.test(trimmed)) return true;
  if (/^\d+\.\s/.test(trimmed)) return true;
  if (trimmed.startsWith("> ") || trimmed === ">") return true;
  if (trimmed.startsWith("```") || trimmed.startsWith("~~~")) return true;
  if (trimmed.startsWith("|")) return true;
  if (/^(---+|\*\*\*+|___+)$/.test(trimmed)) return true;
  if (trimmed.startsWith("![")) return true;
  if (trimmed.startsWith("[![")) return true;
  if (trimmed.startsWith("<iframe")) return true;
  if (/^<(details|summary|center|div|br\s*\/?>)/i.test(trimmed)) return true;
  if (/^<!--/.test(trimmed)) return true;
  if (trimmed.startsWith(":::")) return true;
  if (/^\{%\s*youtube/.test(trimmed)) return true;
  if (/^\$\$?\s*$/.test(trimmed)) return true;
  if (trimmed === "@startuml") return true;
  // Numbered references like [1], [2] etc — treat each as its own line/block
  if (/^\[\d+\]\s/.test(trimmed)) return true;
  // [TOC] or [[toc]]
  if (/^\[{1,2}toc\]{1,2}$/i.test(trimmed)) return true;
  return false;
}

/**
 * Detect if a line is a "reference link definition" [ref]: url
 * vs a "numbered reference" [1] Author text...
 * Reference link def: [text]: URL (colon immediately after ])
 * Numbered ref: [1] Some text (space after ], no colon)
 */
function isRefLinkDef(trimmed: string): boolean {
  return /^\[([^\]]+)\]:\s+\S/.test(trimmed);
}

function isContinuationLine(raw: string): boolean {
  return /^(?:  |\t)\S/.test(raw) || /^   +\S/.test(raw);
}

/** Check if a line is an indented list item (sub-bullet, sub-number, sub-task) */
function isIndentedListItem(raw: string): boolean {
  // Must start with whitespace (at least 2 spaces or tab)
  if (!/^(?:  |\t)/.test(raw)) return false;
  const trimmed = raw.trim();
  // Check if it's a list item pattern
  return /^[\-\*+]\s/.test(trimmed) || /^\d+\.\s/.test(trimmed) || /^[\-\*+]\s+\[[ xX\/]\]\s/.test(trimmed);
}

/** Calculate indent level from leading whitespace (2 spaces or 1 tab = 1 level) */
function getIndentLevel(raw: string): number {
  const match = raw.match(/^(\s+)/);
  if (!match) return 0;
  const ws = match[1];
  // Count tabs as 1 level, every 2 spaces as 1 level
  let level = 0;
  for (const ch of ws) {
    if (ch === '\t') level++;
    else level += 0.5; // each space = 0.5, so 2 spaces = 1 level
  }
  return Math.max(1, Math.floor(level));
}

/**
 * Sanitize mermaid content to fix common issues:
 * - Duplicate node definitions (A[label1] then A[label2]) → merge into A[label1<br/>label2]
 * - Remove standalone node redefinitions that have no arrows
 */
function sanitizeMermaid(content: string): string {
  const lines = content.split("\n");
  // Track first definition of each node ID
  const nodeDefs = new Map<string, { line: number; label: string }>();
  const linesToRemove = new Set<number>();

  for (let i = 0; i < lines.length; i++) {
    const trimLine = lines[i].trim();
    // Match standalone node definition: "    A[Some text]" (no arrows)
    const standaloneMatch = trimLine.match(/^([A-Za-z_]\w*)\[([^\]]+)\]\s*$/);
    if (standaloneMatch && !trimLine.includes("-->") && !trimLine.includes("---")) {
      const nodeId = standaloneMatch[1];
      const label = standaloneMatch[2];
      if (nodeDefs.has(nodeId)) {
        // This is a redefinition — merge label into original or just remove
        const original = nodeDefs.get(nodeId)!;
        const origLine = lines[original.line];
        // Replace original label with "original<br/>new"
        lines[original.line] = origLine.replace(
          `${nodeId}[${original.label}]`,
          `${nodeId}[${original.label}<br/><small>${label}</small>]`
        );
        linesToRemove.add(i);
      } else {
        nodeDefs.set(nodeId, { line: i, label });
      }
    } else {
      // Line with arrows — extract node defs from it
      const arrowNodeMatches = Array.from(trimLine.matchAll(/([A-Za-z_]\w*)\[([^\]]+)\]/g));
      for (const m of arrowNodeMatches) {
        if (!nodeDefs.has(m[1])) {
          nodeDefs.set(m[1], { line: i, label: m[2] });
        }
      }
    }
  }

  return lines.filter((_, i) => !linesToRemove.has(i)).join("\n");
}

// ─── Import: Markdown → Blocks ──────────────────────────────────────────────

export function markdownToBlocks(markdown: string): Block[] {
  let normalised = markdown.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  // Pre-process: when pasting from web, table rows may be merged onto one line
  // with large whitespace gaps (e.g. "| A | B |       | C | D |"). Split them.
  // Only match spaces/tabs (not newlines) to avoid merging separate lines
  normalised = normalised.replace(/\|[ \t]{3,}\|/g, "|\n|");
  const lines = normalised.split("\n");
  const blocks: Block[] = [];

  // ── First pass: collect reference link definitions [ref]: url ──────────
  const refLinks = new Map<string, string>();
  // (#3) Collect footnote definitions [^id]: text
  const footnotes = new Map<string, string>();
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (isRefLinkDef(trimmedLine)) {
      const refMatch = trimmedLine.match(/^\[([^\]]+)\]:\s+(.+)$/);
      if (refMatch) {
        const urlPart = refMatch[2].trim().replace(/\s+["'(].*["')]?\s*$/, "");
        refLinks.set(refMatch[1].toLowerCase(), urlPart);
      }
    }
    // Footnote definition: [^1]: This is the footnote text
    const fnMatch = trimmedLine.match(/^\[\^([^\]]+)\]:\s+(.+)$/);
    if (fnMatch) {
      footnotes.set(fnMatch[1], fnMatch[2]);
    }
  }

  let i = 0;

  while (i < lines.length) {
    const raw = lines[i];
    const line = raw.trimEnd();
    const trimmed = line.trim();

    // ── Skip blank lines ──────────────────────────────────────────────────
    if (isBlank(raw)) { i++; continue; }

    // ── Skip reference link definitions (already collected) ───────────────
    if (isRefLinkDef(trimmed)) { i++; continue; }

    // (#3) Skip footnote definitions (already collected, will render at bottom)
    if (/^\[\^[^\]]+\]:\s+/.test(trimmed)) { i++; continue; }

    // ── [TOC] / [[toc]] → Table of Contents block ────────────────────────
    if (/^\[{1,2}toc\]{1,2}$/i.test(trimmed)) {
      blocks.push(createBlock("toc", ""));
      i++;
      continue;
    }

    // (#7) Skip HTML comments <!-- ... -->
    if (trimmed.startsWith("<!--")) {
      // Single-line comment
      if (trimmed.includes("-->")) { i++; continue; }
      // Multi-line comment — skip until -->
      i++;
      while (i < lines.length && !lines[i].includes("-->")) { i++; }
      i++; // skip the closing --> line
      continue;
    }

    // ── Setext headings: text followed by === or --- on next line ────────
    if (i + 1 < lines.length && !hasBlockPrefix(trimmed) && trimmed.length > 0) {
      const nextLine = lines[i + 1].trim();
      if (/^={3,}$/.test(nextLine)) {
        blocks.push(createBlock("heading-1", strip(trimmed, refLinks, footnotes)));
        i += 2;
        continue;
      }
      if (/^-{3,}$/.test(nextLine) && !isBlank(lines[i])) {
        blocks.push(createBlock("heading-2", strip(trimmed, refLinks, footnotes)));
        i += 2;
        continue;
      }
    }

    // ── Fenced code block ```...``` or ~~~...~~~ ─────────────────────────
    if (trimmed.startsWith("```") || trimmed.startsWith("~~~")) {
      const fence = trimmed.startsWith("```") ? "```" : "~~~";
      const langMatch = trimmed.match(/^(?:```|~~~)(\w*)(?:=\d+)?/);
      const language = langMatch && langMatch[1] ? langMatch[1] : "";
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trimEnd().startsWith(fence)) {
        codeLines.push(lines[i].trimEnd());
        i++;
      }
      i++; // skip closing fence

      // Mermaid diagrams get their own metadata flag
      if (language === "mermaid") {
        const sanitized = sanitizeMermaid(codeLines.join("\n"));
        const mermaidBlock = createBlock("callout", sanitized);
        mermaidBlock.metadata = { isDiagram: true, diagramType: "mermaid" };
        blocks.push(mermaidBlock);
      } else if (language === "sequence") {
        // Convert js-sequence-diagrams syntax to Mermaid sequenceDiagram syntax
        const mermaidLines = ["sequenceDiagram"];
        for (const line of codeLines) {
          const trimLine = line.trim();
          if (!trimLine) continue;
          // "Note right of Bob: Bob thinks" → same in Mermaid
          if (/^Note\s+(right|left)\s+of\s+/i.test(trimLine)) {
            mermaidLines.push("    " + trimLine);
          }
          // "Bob-->Alice: message" (dashed) → "Bob-->>Alice: message" — MUST match before ->
          else if (/^(.+?)-->(.+?):\s*(.*)$/.test(trimLine)) {
            const m = trimLine.match(/^(.+?)-->(.+?):\s*(.*)$/);
            if (m) mermaidLines.push(`    ${m[1].trim()}-->>${m[2].trim()}: ${m[3]}`);
          }
          // "Alice->Bob: message" (solid) → "Alice->>Bob: message"
          else if (/^(.+?)->(.+?):\s*(.*)$/.test(trimLine)) {
            const m = trimLine.match(/^(.+?)->(.+?):\s*(.*)$/);
            if (m) mermaidLines.push(`    ${m[1].trim()}->>` + `${m[2].trim()}: ${m[3]}`);
          }
          else {
            mermaidLines.push("    " + trimLine);
          }
        }
        const mermaidBlock = createBlock("callout", mermaidLines.join("\n"));
        mermaidBlock.metadata = { isDiagram: true, diagramType: "mermaid" };
        blocks.push(mermaidBlock);
      } else if (language === "flow") {
        // Convert flow syntax to Mermaid flowchart
        const mermaidLines = ["flowchart TD"];
        for (const line of codeLines) {
          if (line.trim()) mermaidLines.push("    " + line.trim());
        }
        const mermaidBlock = createBlock("callout", mermaidLines.join("\n"));
        mermaidBlock.metadata = { isDiagram: true, diagramType: "mermaid" };
        blocks.push(mermaidBlock);
      } else {
        const codeBlock = createBlock("callout", codeLines.join("\n"));
        codeBlock.metadata = { isCode: true, language };
        blocks.push(codeBlock);
      }
      continue;
    }

    // ── Math block $$...$$ (block-level, $$ on its own line) ─────────────
    if (/^\$\$\s*$/.test(trimmed)) {
      const mathLines: string[] = [];
      i++;
      while (i < lines.length && !/^\$\$\s*$/.test(lines[i].trim())) {
        mathLines.push(lines[i].trimEnd());
        i++;
      }
      i++; // skip closing $$
      const mathBlock = createBlock("callout", mathLines.join("\n"));
      mathBlock.metadata = { isMath: true };
      blocks.push(mathBlock);
      continue;
    }

    // ── Math block $...$ (single $ on its own line — HackMD style) ───────
    if (/^\$\s*$/.test(trimmed)) {
      const mathLines: string[] = [];
      i++;
      while (i < lines.length && !/^\$\s*$/.test(lines[i].trim())) {
        mathLines.push(lines[i].trimEnd());
        i++;
      }
      i++; // skip closing $
      const mathBlock = createBlock("callout", mathLines.join("\n"));
      mathBlock.metadata = { isMath: true };
      blocks.push(mathBlock);
      continue;
    }

    // ── PlantUML @startuml...@enduml ─────────────────────────────────────
    if (trimmed === "@startuml") {
      const umlLines: string[] = [];
      i++;
      while (i < lines.length && lines[i].trim() !== "@enduml") {
        umlLines.push(lines[i].trimEnd());
        i++;
      }
      i++; // skip @enduml
      const umlBlock = createBlock("callout", umlLines.join("\n"));
      umlBlock.metadata = { isDiagram: true, diagramType: "plantuml" };
      blocks.push(umlBlock);
      continue;
    }

    // ── Mermaid shorthand (```sequence / ```graph etc without mermaid keyword) ──
    // Already handled above in the fenced code block section

    // ── Admonition blocks :::info / :::warning / :::danger ────────────────
    if (trimmed.startsWith(":::")) {
      const typeMatch = trimmed.match(/^:::(\w*)/);
      const calloutType = typeMatch && typeMatch[1] ? typeMatch[1] : "info";
      const contentLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith(":::")) {
        contentLines.push(lines[i].trimEnd());
        i++;
      }
      i++; // skip closing :::
      const block = createBlock("callout", strip(contentLines.join("\n").trim(), refLinks, footnotes));
      block.metadata = { calloutType };
      blocks.push(block);
      continue;
    }

    // ── YouTube embed {%youtube ID %} ─────────────────────────────────────
    const ytMatch = trimmed.match(/^\{%\s*youtube\s+([a-zA-Z0-9_-]+)\s*%\}/);
    if (ytMatch) {
      const videoId = ytMatch[1];
      const videoBlock = createBlock("video", `https://www.youtube.com/watch?v=${videoId}`);
      videoBlock.metadata = {
        isEmbed: true,
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
      };
      blocks.push(videoBlock);
      i++;
      continue;
    }

    // ── Markdown table  | col | col | ─────────────────────────────────────
    if (trimmed.startsWith("|")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        tableLines.push(lines[i].trim());
        i++;
      }
      // (#10) Parse alignment from separator row (e.g. |:---|:---:|---:|)
      const alignments: string[] = [];
      const separatorIdx = tableLines.findIndex(l => /^\|[\s:\-|]+\|$/.test(l) && /---/.test(l));
      if (separatorIdx !== -1) {
        const sepCols = tableLines[separatorIdx].replace(/^\|/, "").replace(/\|$/, "").split("|");
        for (const col of sepCols) {
          const t = col.trim();
          if (t.startsWith(":") && t.endsWith(":")) alignments.push("center");
          else if (t.endsWith(":")) alignments.push("right");
          else if (t.startsWith(":")) alignments.push("left");
          else alignments.push("");
        }
      }
      const dataRows = tableLines.filter((l) => /[^|:\-\s]/.test(l));
      const cells = dataRows.map((row) =>
        row.replace(/^\|/, "").replace(/\|$/, "").split("|")
          .map((c) => strip(c.trim(), refLinks, footnotes))
      );
      if (cells.length > 0) {
        const block = createBlock("table", "");
        block.metadata = {
          tableData: {
            cells, rows: cells.length, cols: cells[0].length,
            ...(alignments.length > 0 ? { alignments } : {}),
          },
        };
        blocks.push(block);
      }
      continue;
    }

    // ── HTML iframe embed → video block ───────────────────────────────────
    if (trimmed.startsWith("<iframe")) {
      // May span multiple lines — collect until >
      let iframeLine = trimmed;
      if (!iframeLine.includes(">")) {
        i++;
        while (i < lines.length) {
          iframeLine += " " + lines[i].trim();
          if (lines[i].includes(">")) { i++; break; }
          i++;
        }
      } else {
        i++;
      }
      const srcMatch = iframeLine.match(/src=["']([^"']+)["']/);
      const src = srcMatch ? srcMatch[1] : "";
      const videoBlock = createBlock("video", src);
      // Detect YouTube/Vimeo embeds
      const ytEmbed = src.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]+)/);
      const vimeoEmbed = src.match(/player\.vimeo\.com\/video\/(\d+)/);
      if (ytEmbed) {
        videoBlock.metadata = { isEmbed: true, embedUrl: src };
      } else if (vimeoEmbed) {
        videoBlock.metadata = { isEmbed: true, embedUrl: src };
      } else if (src) {
        videoBlock.metadata = { isEmbed: true, embedUrl: src };
      }
      blocks.push(videoBlock);
      continue;
    }

    // ── Headings ──────────────────────────────────────────────────────────
    if (/^#{1,6}\s/.test(trimmed)) {
      const match = trimmed.match(/^(#{1,6})\s(.+)/);
      if (match) {
        const level = Math.min(match[1].length, 4);
        const text = strip(match[2].trim(), refLinks, footnotes);
        const typeMap: Record<number, BlockType> = {
          1: "heading-1", 2: "heading-2", 3: "heading-3",
          4: "heading-3", 5: "heading-3", 6: "heading-3",
        };
        blocks.push(createBlock(typeMap[level], text));
      }
      i++;
      continue;
    }

    // ── Divider ---, ***, ___ ─────────────────────────────────────────────
    if (/^(---+|\*\*\*+|___+)$/.test(trimmed)) {
      blocks.push(createBlock("divider", ""));
      i++;
      continue;
    }

    // ── Multi-line blockquote > text (with nested >> support) ──────────────
    if (trimmed.startsWith(">")) {
      // Collect consecutive quote lines grouped by nesting depth
      // Each depth change creates a new quote block
      let currentDepth = 0;
      let currentLines: string[] = [];

      const flushQuote = () => {
        if (currentLines.length > 0) {
          const qBlock = createBlock("quote", strip(currentLines.join("\n"), refLinks, footnotes));
          if (currentDepth > 1) {
            qBlock.props = { indent: currentDepth - 1 };
          }
          blocks.push(qBlock);
          currentLines = [];
        }
      };

      while (i < lines.length) {
        const qt = lines[i].trim();
        if (!qt.startsWith(">")) break;

        // Count nesting depth: >, >>, >>>, etc.
        const depthMatch = qt.match(/^(>+)\s?/);
        const depth = depthMatch ? depthMatch[1].length : 1;
        const content = qt.replace(/^>+\s?/, "").trim();

        if (depth !== currentDepth && currentLines.length > 0) {
          flushQuote();
        }
        currentDepth = depth;

        if (content === "" && qt.replace(/>/g, "").trim() === "") {
          currentLines.push("");
        } else {
          currentLines.push(content);
        }
        i++;
      }
      flushQuote();
      continue;
    }

    // ── Linked image / YouTube thumbnail → video  [![](thumb)](url) ──────
    if (trimmed.startsWith("[![")) {
      const match = trimmed.match(/^\[!\[.*?\]\(.*?\)\]\((.+?)\)/);
      if (match) {
        const linkUrl = match[1];
        const videoBlock = createBlock("video", linkUrl);
        // Detect YouTube links
        const ytId = linkUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
        if (ytId) {
          videoBlock.metadata = {
            isEmbed: true,
            embedUrl: `https://www.youtube.com/embed/${ytId[1]}`,
          };
        }
        blocks.push(videoBlock);
        i++;
        continue;
      }
    }

    // ── Standalone image ![alt](url) ──────────────────────────────────────
    if (trimmed.startsWith("![")) {
      const match = trimmed.match(/^!\[(.*?)\]\((.+?)\)$/);
      if (match) {
        const block = createBlock("image", match[2]);
        block.metadata = { caption: strip(match[1], refLinks, footnotes) };
        blocks.push(block);
        i++;
        continue;
      }
    }

    // ── Task list  - [x] / - [ ] → todo block ────────────────────────────
    if (/^[\-\*+]\s+\[[ xX\/]\]\s/.test(trimmed)) {
      const isChecked = /^[\-\*+]\s+\[[xX]\]/.test(trimmed);
      let text = trimmed.replace(/^[\-\*+]\s+\[[ xX\/]\]\s+/, "");
      i++;
      // Collect plain continuation lines (NOT indented sub-bullets)
      while (i < lines.length && !isBlank(lines[i]) && isContinuationLine(lines[i]) && !isIndentedListItem(lines[i])) {
        text += " " + lines[i].trim();
        i++;
      }
      const block = createBlock("todo", strip(text, refLinks, footnotes));
      block.metadata = { checked: isChecked };
      blocks.push(block);
      // Parse nested sub-items as separate blocks with indent
      while (i < lines.length && !isBlank(lines[i]) && isIndentedListItem(lines[i])) {
        const subRaw = lines[i];
        const subTrimmed = subRaw.trim();
        const indent = getIndentLevel(subRaw);
        // Sub-task
        if (/^[\-\*+]\s+\[[ xX\/]\]\s/.test(subTrimmed)) {
          const subChecked = /^[\-\*+]\s+\[[xX]\]/.test(subTrimmed);
          const subText = subTrimmed.replace(/^[\-\*+]\s+\[[ xX\/]\]\s+/, "");
          const subBlock = createBlock("todo", strip(subText, refLinks, footnotes));
          subBlock.metadata = { checked: subChecked };
          subBlock.props = { indent };
          blocks.push(subBlock);
        }
        // Sub-bullet
        else if (/^[\-\*+]\s+/.test(subTrimmed)) {
          const subText = subTrimmed.replace(/^[\-\*+]\s+/, "");
          const subBlock = createBlock("bullet-list", strip(subText, refLinks, footnotes));
          subBlock.props = { indent };
          blocks.push(subBlock);
        }
        // Sub-number
        else if (/^\d+\.\s+/.test(subTrimmed)) {
          const subText = subTrimmed.replace(/^\d+\.\s+/, "");
          const subBlock = createBlock("numbered-list", strip(subText, refLinks, footnotes));
          subBlock.props = { indent };
          blocks.push(subBlock);
        }
        // Plain indented continuation
        else {
          const subBlock = createBlock("text", strip(subTrimmed, refLinks, footnotes));
          subBlock.props = { indent };
          blocks.push(subBlock);
        }
        i++;
      }
      continue;
    }

    // ── Bullet list  - / * / + ────────────────────────────────────────────
    if (/^[\-\*+]\s+/.test(trimmed)) {
      let text = trimmed.replace(/^[\-\*+]\s+/, "");
      i++;
      // Collect plain continuation lines (NOT indented sub-bullets)
      while (i < lines.length && !isBlank(lines[i]) && isContinuationLine(lines[i]) && !isIndentedListItem(lines[i])) {
        text += " " + lines[i].trim();
        i++;
      }
      blocks.push(createBlock("bullet-list", strip(text, refLinks, footnotes)));
      // Parse nested sub-items as separate blocks with indent
      while (i < lines.length && !isBlank(lines[i]) && isIndentedListItem(lines[i])) {
        const subRaw = lines[i];
        const subTrimmed = subRaw.trim();
        const indent = getIndentLevel(subRaw);
        if (/^[\-\*+]\s+/.test(subTrimmed)) {
          const subText = subTrimmed.replace(/^[\-\*+]\s+/, "");
          const subBlock = createBlock("bullet-list", strip(subText, refLinks, footnotes));
          subBlock.props = { indent };
          blocks.push(subBlock);
        } else if (/^\d+\.\s+/.test(subTrimmed)) {
          const subText = subTrimmed.replace(/^\d+\.\s+/, "");
          const subBlock = createBlock("numbered-list", strip(subText, refLinks, footnotes));
          subBlock.props = { indent };
          blocks.push(subBlock);
        } else {
          const subBlock = createBlock("text", strip(subTrimmed, refLinks, footnotes));
          subBlock.props = { indent };
          blocks.push(subBlock);
        }
        i++;
      }
      continue;
    }

    // ── Numbered list  1. ─────────────────────────────────────────────────
    if (/^\d+\.\s+/.test(trimmed)) {
      let text = trimmed.replace(/^\d+\.\s+/, "");
      i++;
      // Collect plain continuation lines (NOT indented sub-bullets)
      while (i < lines.length && !isBlank(lines[i]) && isContinuationLine(lines[i]) && !isIndentedListItem(lines[i])) {
        text += " " + lines[i].trim();
        i++;
      }
      blocks.push(createBlock("numbered-list", strip(text, refLinks, footnotes)));
      // Parse nested sub-items as separate blocks with indent
      while (i < lines.length && !isBlank(lines[i]) && isIndentedListItem(lines[i])) {
        const subRaw = lines[i];
        const subTrimmed = subRaw.trim();
        const indent = getIndentLevel(subRaw);
        if (/^[\-\*+]\s+/.test(subTrimmed)) {
          const subText = subTrimmed.replace(/^[\-\*+]\s+/, "");
          const subBlock = createBlock("bullet-list", strip(subText, refLinks, footnotes));
          subBlock.props = { indent };
          blocks.push(subBlock);
        } else if (/^\d+\.\s+/.test(subTrimmed)) {
          const subText = subTrimmed.replace(/^\d+\.\s+/, "");
          const subBlock = createBlock("numbered-list", strip(subText, refLinks, footnotes));
          subBlock.props = { indent };
          blocks.push(subBlock);
        } else {
          const subBlock = createBlock("text", strip(subTrimmed, refLinks, footnotes));
          subBlock.props = { indent };
          blocks.push(subBlock);
        }
        i++;
      }
      continue;
    }

    // (#4) Definition lists: Term followed by : Definition
    if (i + 1 < lines.length && !hasBlockPrefix(trimmed) && trimmed.length > 0) {
      const nextLine = lines[i + 1];
      if (nextLine && /^\s*:\s+\S/.test(nextLine)) {
        const term = strip(trimmed, refLinks, footnotes);
        const definitions: string[] = [];
        i++;
        while (i < lines.length && /^\s*:\s+/.test(lines[i])) {
          definitions.push(strip(lines[i].replace(/^\s*:\s+/, "").trim(), refLinks, footnotes));
          i++;
        }
        const dlHtml = `<dl><dt><strong>${term}</strong></dt>${definitions.map(d => `<dd style="margin-left:24px">${d}</dd>`).join("")}</dl>`;
        blocks.push(createBlock("text", dlHtml));
        continue;
      }
    }

    // (#15) Collapsible sections <details> → interactive HTML block
    if (/^<details/i.test(trimmed)) {
      const htmlLines: string[] = [trimmed];
      if (!trimmed.includes("</details>")) {
        i++;
        while (i < lines.length) {
          htmlLines.push(lines[i].trimEnd());
          if (lines[i].includes("</details>")) { i++; break; }
          i++;
        }
      } else {
        i++;
      }
      // Process the content between <summary> and </details> with markdown
      let fullHtml = htmlLines.join("\n");
      // Extract and process inner content (between </summary> and </details>)
      fullHtml = fullHtml.replace(
        /(<\/summary>)([\s\S]*?)(<\/details>)/i,
        (_, summaryClose, inner, detailsClose) => {
          const processed = strip(inner.trim(), refLinks, footnotes);
          return `${summaryClose}\n<div style="padding:8px 0 4px 16px">${processed}</div>\n${detailsClose}`;
        }
      );
      blocks.push(createBlock("text", fullHtml));
      continue;
    }

    // ── HTML block elements (pass through) ───────────────────────────────
    if (/^<(summary|center|div|br\s*\/?>)/i.test(trimmed)) {
      // Collect until closing tag or blank line
      if (trimmed.startsWith("<br")) {
        blocks.push(createBlock("text", ""));
        i++;
        continue;
      }
      const tagMatch = trimmed.match(/^<(\w+)/);
      if (tagMatch) {
        const tag = tagMatch[1].toLowerCase();
        const htmlLines: string[] = [trimmed];
        const closingTag = `</${tag}>`;
        if (!trimmed.includes(closingTag)) {
          i++;
          while (i < lines.length) {
            htmlLines.push(lines[i].trimEnd());
            if (lines[i].includes(closingTag)) { i++; break; }
            i++;
          }
        } else {
          i++;
        }
        blocks.push(createBlock("text", htmlLines.join("\n")));
        continue;
      }
    }

    // ── Plain text / paragraph ────────────────────────────────────────────
    {
      const paraLines: string[] = [trimmed];
      i++;
      while (i < lines.length) {
        const nextRaw = lines[i];
        const nextTrimmed = nextRaw.trim();
        if (isBlank(nextRaw) || hasBlockPrefix(nextTrimmed)) break;
        if (isRefLinkDef(nextTrimmed)) break;
        if (/^\[\^[^\]]+\]:\s+/.test(nextTrimmed)) break;
        // Stop on definition list
        if (/^\s*:\s+\S/.test(nextRaw)) break;
        // Stop on HTML block elements
        if (/^<(details|summary|center|div|iframe|br\s*\/?>)/i.test(nextTrimmed)) break;
        paraLines.push(nextTrimmed);
        i++;
      }
      // (#11) Line breaks: two trailing spaces before newline → <br>
      const joined = paraLines.join("  \n"); // preserve line structure
      const withBreaks = joined.replace(/  \n/g, "<br>");
      // If no <br> was inserted, fall back to space-joined
      const content = withBreaks.includes("<br>") ? withBreaks : paraLines.join(" ");
      blocks.push(createBlock("text", strip(content, refLinks, footnotes)));
    }
  }

  // (#3) Append footnotes as a divider + text block at the end
  if (footnotes.size > 0) {
    blocks.push(createBlock("divider", ""));
    const fnEntries = Array.from(footnotes.entries()).map(
      ([id, text]) => `<span id="fn-${id}" style="font-size:0.85em"><sup>${id}</sup> ${strip(text, refLinks, footnotes)} <a href="#fnref-${id}" style="text-decoration:none">↩</a></span>`
    );
    blocks.push(createBlock("text", fnEntries.join("<br>")));
  }

  if (blocks.length === 0) {
    blocks.push(createBlock("text", ""));
  }

  return blocks;
}
