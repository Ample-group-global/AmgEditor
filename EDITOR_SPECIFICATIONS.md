# AMG Editor - Complete Specifications

## Overview

AMG Editor (`@amplecapitalglobal/editor`) is a Notion-like block editor built with React and TypeScript. It supports rich text editing, markdown import/export, media blocks, code highlighting, math equations, diagrams, and tables.

**Version:** 1.0.8
**Package:** `@amplecapitalglobal/editor`
**License:** MIT

---

## Public API

### Exports

```typescript
// Main Component
import { Editor } from "@amplecapitalglobal/editor";
import type { EditorProps } from "@amplecapitalglobal/editor";

// Types
import type { Block, BlockType } from "@amplecapitalglobal/editor";
import { createBlock, initialBlocks, generateUUID } from "@amplecapitalglobal/editor";

// Converters
import { blocksToHtml, blocksToMarkdown, markdownToBlocks } from "@amplecapitalglobal/editor";
```

### EditorProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `initialBlocks` | `Block[]` | `[empty text block]` | Initial blocks to display |
| `onChange` | `(blocks: Block[]) => void` | - | Callback on content change |
| `useLocalStorage` | `boolean` | `false` | Enable localStorage auto-save |
| `storageKey` | `string` | `"editor-content"` | localStorage key |
| `readOnly` | `boolean` | `false` | Read-only/preview mode |
| `className` | `string` | - | Custom CSS class for container |
| `showPageMenu` | `boolean` | `true` | Show page menu (export/import) |
| `onExportMarkdown` | `(markdown: string) => void` | - | Custom export handler |
| `onExportHtml` | `(html: string) => void` | - | Custom HTML export handler |
| `onImportMarkdown` | `(markdown: string) => void` | - | Custom import handler |

### Block Interface

```typescript
type BlockType =
  | "text" | "heading-1" | "heading-2" | "heading-3"
  | "bullet-list" | "numbered-list" | "todo"
  | "quote" | "divider" | "callout"
  | "image" | "video" | "file" | "table";

interface Block {
  id: string;
  type: BlockType;
  content: string;
  children?: Block[];
  metadata?: Record<string, any>;
  props?: { textColor?: string; backgroundColor?: string; [key: string]: any };
}
```

---

## Block Types

| Block Type | Description | Auto-detect Shortcut |
|------------|-------------|---------------------|
| Text | Plain text with inline formatting | (default) |
| Heading 1 | Large section heading | `# ` |
| Heading 2 | Medium section heading | `## ` |
| Heading 3 | Small section heading | `### ` |
| Bullet List | Unordered list item | `- ` or `* ` or `+ ` |
| Numbered List | Ordered list item | `1. ` |
| To-do List | Checkbox task item | `- [ ] ` or `- [x] ` |
| Quote | Blockquote | `> ` |
| Divider | Horizontal rule | `---` or `***` or `___` |
| Code Block | Syntax-highlighted code (callout with isCode) | ` ``` ` or `~~~ ` |
| Math Block | LaTeX equations via KaTeX (callout with isMath) | `$$` |
| Diagram | Mermaid diagrams (callout with isDiagram) | `/diagram` or ` ```mermaid ` |
| Callout | Info/warning/danger/success callout | `:::info`, `:::warning`, etc. |
| Table | Editable table with rows/columns | `/table` or `| col |` |
| Image | Upload or embed via URL | `/image` or `![alt](url)` |
| Video | Embed YouTube, Vimeo, Loom, etc. | `/video` |
| File | Upload or link a file | `/file` |

---

## Inline Formatting

| Format | Keyboard Shortcut | Markdown Syntax |
|--------|-------------------|-----------------|
| **Bold** | `Ctrl+B` | `**text**` |
| *Italic* | `Ctrl+I` | `*text*` or `_text_` |
| Underline | `Ctrl+U` | - |
| ~~Strikethrough~~ | `Ctrl+Shift+S` | `~~text~~` |
| `Inline Code` | `Ctrl+E` | `` `text` `` |
| Highlight | `Ctrl+Shift+H` | `==text==` |
| Link | `Ctrl+K` | `[text](url)` |
| Superscript | - | `^text^` |
| Subscript | - | `~text~` |
| ***Bold Italic*** | - | `***text***` |

### Highlight Colors

8 highlight colors available via toolbar dropdown:
- Yellow, Green, Blue, Pink, Purple, Orange, Red, Gray
- Remove highlight option

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+B` | Toggle bold |
| `Ctrl+I` | Toggle italic |
| `Ctrl+U` | Toggle underline |
| `Ctrl+K` | Create/edit link |
| `Ctrl+E` | Toggle inline code |
| `Ctrl+Shift+S` | Toggle strikethrough |
| `Ctrl+Shift+H` | Toggle highlight |
| `Ctrl+A` | Select all blocks |
| `Enter` | Create new block / continue list |
| `Shift+Enter` | Exit code/math/diagram block |
| `Ctrl+Enter` | Exit code/math/diagram block |
| `Backspace` | Delete empty block / merge with previous |
| `Tab` | Indent in code block |
| `Escape` | Exit editing mode (code/math/diagram) |
| `Arrow Up/Down` | Navigate between blocks |

---

## Slash Menu Commands

Type `/` in an empty block to open the command menu. Supports search/filtering.

### Available Commands

**Basic Blocks:**
Text, Heading 1, Heading 2, Heading 3, Bullet List, Numbered List, To-do List, Callout, Code, Quote, Divider, Math Equation, Diagram, Table

**Media:**
Image, Video, File

---

## Markdown Import Features

The editor can import any standard markdown file and render it correctly. Validated against 36 test articles (35 production articles + 1 feature test file) with **100% success rate** - zero errors, zero warnings.

### Supported Markdown Syntax

- **Headings**: `#`, `##`, `###` (ATX style, H4-H6 mapped to H3) and underline style (setext `===`, `---`)
- **Lists**: `-`, `*`, `+` bullets; `1.` numbered; `- [ ]` / `- [x]` tasks
- **Nested lists**: Indented sub-bullets, sub-numbers, sub-tasks parsed as separate blocks
- **Continuation lines**: Indented text after list items merged into parent
- **Bold/Italic**: `**bold**`, `*italic*`, `***bold italic***`, `_italic_`, `__bold__`, mixed `_**text**_`
- **Strikethrough**: `~~text~~`
- **Highlight**: `==text==`
- **Superscript/Subscript**: `^text^` / `~text~`
- **Inline code**: `` `code` ``
- **Code blocks**: Fenced with ` ``` ` or `~~~`, with language detection (300+ languages via PrismJS)
- **Math blocks**: `$$...$$` (block-level, $$ on own line)
- **Inline math**: `$...$` in text blocks (wrapped in KaTeX span)
- **Diagrams**: ` ```mermaid ` (native), ` ```sequence ` (auto-converted to Mermaid), ` ```flow ` (auto-converted to flowchart)
- **Tables**: Full markdown table parsing with header separator detection, inline formatting in cells
- **Images**: `![alt](url)` standalone images with caption support
- **Linked images**: `[![alt](img)](url)` - YouTube thumbnails auto-detected as video embeds
- **Videos**: YouTube `{%youtube ID %}` (HackMD), `<iframe>` embeds, linked thumbnails
- **Blockquotes**: `>` with multi-line support (empty `>` for blank lines within quotes)
- **Dividers**: `---`, `***`, `___`
- **Links**: `[text](url)` inline, `[text][ref]` reference-style, `[text][]` shorthand reference
- **Reference link definitions**: `[ref]: url "title"` (collected in first pass, used globally)
- **Admonitions**: `:::info`, `:::warning`, `:::danger` with closing `:::`
- **Emoji shortcodes**: `:smile:`, `:rocket:`, etc. (100+ supported emojis across 8 categories)
- **HTML elements**: `<br>`, `<center>`, `<details>`, `<summary>`, `<div>`, `<iframe>` (multi-line)
- **Font Awesome icons**: `<i class="fa fa-icon"></i>` converted to Unicode (26 icons mapped)
- **HackMD-specific**: `[ToC]` (skipped), `[color=...]` (stripped), `{%youtube%}` (converted)
- **PlantUML**: `@startuml...@enduml` (preserved as diagram block)
- **Bare URL autolinking**: Plain `https://...` converted to clickable links (with smart context detection to avoid double-wrapping)
- **Mermaid sanitization**: Duplicate node definitions auto-merged, standalone redefinitions cleaned up

### Parsing Test Results (36 files)

| Metric | Count |
|--------|-------|
| Total files tested | 36 |
| Files passed | 36 (100%) |
| Files with warnings | 0 |
| Files with errors | 0 |
| Total blocks generated | 1,835 |

### Block Type Distribution (across all 36 test articles)

| Block Type | Count |
|------------|-------|
| text | 548 |
| bullet-list | 263 |
| heading-2 | 236 |
| divider | 169 |
| heading-3 | 160 |
| numbered-list | 140 |
| todo | 77 |
| table | 63 |
| quote | 37 |
| heading-1 | 36 |
| code | 28 |
| image | 20 |
| video | 15 |
| diagram | 3 |
| callout-info | 2 |
| math | 1 |

### Features Validated Across Articles

All of the following features were detected and correctly parsed across the 36 test files:

admonitions, bold, bullet-lists, callout-info, checked-todo, code-block, diagram-mermaid, dividers, emoji-shortcodes, font-awesome, hackmd-color, hackmd-toc, headings, highlight, iframe-embed, image, images-md, inline-code, inline-math, italic, linked-images, links, math-block, math-block-syntax, mermaid-syntax, numbered-lists, reference-link-defs, reference-links, sequence-syntax, strikethrough, subscript, superscript, table, tables-md, task-lists, video-embed, youtube-hackmd

---

## Markdown Export

The editor exports content in two formats via the UI, plus HTML programmatically:

### 1. Markdown (UI + API)
```typescript
import { blocksToMarkdown } from "@amplecapitalglobal/editor";
const md = blocksToMarkdown(blocks);
```
Standard markdown output. Export available via Page Menu > "Export as Markdown".

### 2. JSON (Block State)
```typescript
const json = JSON.stringify(blocks);
```
Full editor state - preserves all block types, metadata, table data, formatting. Used for re-editing.

### 3. HTML (API only)
```typescript
import { blocksToHtml } from "@amplecapitalglobal/editor";
const html = blocksToHtml(blocks);
```
Rendered HTML for display-only views. Available programmatically via the `onExportHtml` prop or direct function call. Not exposed in the UI Page Menu.

---

## Media Block Features

### Images
- Upload from computer or embed via URL
- Resizable with drag handles (left/right)
- Alignment: Left, Center, Right
- Caption support
- Reference link support

### Videos
- Upload or embed via URL
- YouTube, Vimeo, Loom, Dailymotion auto-detection
- Embed rendering with proper 16:9 aspect ratio (min-height 315px)
- Full-width display by default
- Resizable
- Alignment: Left, Center, Right

### Files
- Upload or link via URL
- File metadata display (name, size, type)
- Download/external link

---

## Table Features

- Add/remove rows and columns
- Insert rows above/below, columns left/right
- Tab/Shift+Tab navigation between cells
- Column resizing via drag handles
- Header row toggle
- Rich text formatting in cells (bold, italic, links)
- Auto-add row on Enter at last cell

---

## Code Block Features

- **300+ languages** supported via PrismJS
- Syntax highlighting with dark theme (Tomorrow Night)
- Line numbers displayed
- Tab indentation support
- Edit/Preview toggle
- Exit with Shift+Enter, Ctrl+Enter, or double-Enter at end

---

## Math Block Features (KaTeX)

- Full LaTeX support via KaTeX CDN
- Block-level math (`$$...$$`)
- Inline math (`$...$`) in text blocks
- Edit/Preview toggle
- Error display for invalid LaTeX

---

## Diagram Features (Mermaid)

- Flowcharts, sequence diagrams, class diagrams, state diagrams, Gantt charts
- Auto-conversion from `sequence` syntax to Mermaid
- Auto-conversion from `flow` syntax to Mermaid flowchart
- Syntax sanitization (duplicate node definitions auto-merged)
- Edit/Preview toggle
- Error display with "Edit to fix" button
- PlantUML support (preserved as diagram block with `plantuml` type)

---

## Floating Toolbar

Appears when text is selected. Provides:
- Block type conversion (Text, H1-H3, Bullet, Numbered, Todo, Quote, Callout)
- Text alignment (Left, Center, Right, Justify)
- Inline formatting (Bold, Italic, Underline, Strikethrough, Code, Highlight)
- Highlight color picker (8 colors + remove)
- Link management (Create, Edit, Open, Remove)

---

## Block Menu (Right-click)

- Delete block
- Duplicate block
- Turn Into (convert to another block type)
- Move Up / Move Down

---

## Page Menu

Page Options dropdown provides:
- Preview Mode toggle (with switch)
- Focus Mode toggle (with switch)
- Dark Mode toggle (with switch)
- Clear All Content (destructive, red text)
- Import Markdown (file picker, accepts .md/.txt)
- Export as Markdown (downloads .md file)

---

## Editor Features

- **Drag-and-drop** block reordering via handle (@dnd-kit)
- **Dark/Light mode** toggle
- **Focus mode** option
- **Preview mode** (read-only)
- **Word and character count** display
- **Auto-save** to localStorage (opt-in via `useLocalStorage` prop)
- **Page title and icon** customization with emoji picker
- **Multi-block selection** (Ctrl+A)
- **CSS auto-injection** - no separate CSS import needed (styles injected into `<head>` at runtime)
- **Toast notifications** via Sonner

---

## CDN Dependencies

The following CDN scripts are required in `index.html` for full functionality:

```html
<!-- KaTeX (Math) -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css" />
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js"></script>
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/auto-render.min.js"></script>

<!-- Mermaid (Diagrams) -->
<script src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"></script>

<!-- PrismJS (Code Highlighting) -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/themes/prism-tomorrow.min.css" />
<script src="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/prism.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/plugins/autoloader/prism-autoloader.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/plugins/line-numbers/prism-line-numbers.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/plugins/line-numbers/prism-line-numbers.min.css" />
```

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| React 18/19 | UI framework |
| TypeScript | Type safety |
| Tailwind CSS v4 | Styling |
| @dnd-kit | Drag-and-drop |
| Radix UI | Accessible UI primitives (Dialog, Dropdown, Switch, Tabs, Tooltip, etc.) |
| Lucide React | Icons |
| re-resizable | Media resize handles |
| Sonner | Toast notifications |
| KaTeX (CDN) | LaTeX math rendering |
| Mermaid (CDN) | Diagram rendering |
| PrismJS (CDN) | Code syntax highlighting |
| esbuild | Bundling (ESM + CJS + app) |
| Express | Dev/production server |

---

## Build Outputs

| Output | Path | Format | Purpose |
|--------|------|--------|---------|
| Library ESM | `dist/index.mjs` | ES Module | npm import |
| Library CJS | `dist/index.cjs` | CommonJS | npm require |
| Type declarations | `dist/index.d.ts` | TypeScript | Type safety |
| App bundle | `dist/public/index.js` | Browser JS | Standalone app |
| App CSS | `dist/public/style.css` | CSS | Standalone app |
| App HTML | `dist/public/index.html` | HTML | Standalone app |
| Server | `dist/index.js` | Node ESM | Express server |

---

## Emoji Map

100+ emoji shortcodes supported across 8 categories:
- **Smileys**: smile, grinning, joy, heart_eyes, wink, thinking, sunglasses, etc.
- **Hands**: thumbsup, +1, clap, wave, ok_hand, raised_hands, pray, muscle, etc.
- **Objects**: rocket, fire, star, sparkles, heart, bulb, gem, key, trophy, etc.
- **Symbols**: check, white_check_mark, x, warning, exclamation, arrows, etc.
- **Misc**: tada, party_popper, gift, balloon, memo, pencil, book, link, etc.
- **Tech**: computer, keyboard, phone, email, package, bug, robot, etc.
- **Weather/Nature**: sunny, cloud, zap, snowflake, rainbow, earth, etc.
- **Food/People**: coffee, pizza, beer, eyes, brain

---

## Font Awesome Icon Map

26 Font Awesome icons mapped to Unicode equivalents:
share-alt, link, check, times, arrow-right, arrow-left, arrow-up, arrow-down, star, heart, home, search, cog, user, envelope, pencil, trash, download, upload, file, folder, calendar, clock-o, bell, comment, book, code, eye
