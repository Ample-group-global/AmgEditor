# AMG Editor — Complete Feature Audit

## 1. BLOCK TYPES

| # | Block Type | Slash Menu | Rendering | Import MD | Export MD | Export HTML | Status |
|---|-----------|-----------|-----------|-----------|-----------|------------|--------|
| 1 | Text (paragraph) | Yes | Yes | Yes (with paragraph merging) | Yes | Yes (`<p>`) | **Working** |
| 2 | Heading 1 | Yes | Yes | Yes (`# `) | Yes | Yes (`<h1>`) | **Working** |
| 3 | Heading 2 | Yes | Yes | Yes (`## `) | Yes | Yes (`<h2>`) | **Working** |
| 4 | Heading 3 | Yes | Yes | Yes (`### ` to `######`) | Yes | Yes (`<h3>`) | **Working** |
| 5 | Bullet List | Yes | Yes | Yes (`- `, `* `) | Yes | Yes (`<ul><li>`) | **Working** |
| 6 | Numbered List | Yes | Yes (auto-numbered) | Yes (`1. `) | Yes | Yes (`<ol><li>`) | **Working** |
| 7 | Quote | Yes | Yes (left border, italic) | Yes (`> `, multi-line merged) | Yes (multi-line `> `) | Yes (`<blockquote>`) | **Working** |
| 8 | Callout | Yes | Yes (lightbulb icon, accent bg) | No direct MD syntax | Plain text export | `<div class="callout">` | **Partial** — no standard MD syntax for callouts |
| 9 | Code Block | Yes (via Callout+isCode) | Yes (monospace, language label) | Yes (` ``` ` fences + language) | Yes (` ```lang `) | Yes (`<pre><code>`) | **Working** |
| 10 | Divider | Yes | Yes (styled `<hr>`) | Yes (`---`, `***`, `___`) | Yes (`---`) | Yes (`<hr />`) | **Working** |
| 11 | Image | Yes | Yes (resizable, captioned) | Yes (`![alt](url)`) | Yes | Yes (`<img>`) | **Working** |
| 12 | Video | Yes | Yes (YouTube/Vimeo embed) | Yes (`<iframe>`, `[![](thumb)](url)`) | Yes (`[Video](url)`) | Yes (`<video>`) | **Working** |
| 13 | File | Yes | Yes (file card with icon) | No MD syntax for files | Yes (`[File: name](url)`) | Yes (`<a download>`) | **Partial** — no standard MD for file blocks |
| 14 | Table | Yes | Yes (full editing, resize, header row) | Yes (`| col | col |`) | Yes (pipe format) | Yes (`<table>`) | **Working** |

---

## 2. INLINE FORMATTING

| # | Format | Floating Toolbar | Manual Typing | MD Import (`strip()`) | MD Export | Status |
|---|--------|-----------------|---------------|----------------------|-----------|--------|
| 1 | **Bold** | Yes | `**text**` (paste only) | Yes `**text**` → `<strong>` | Not stripped back | **Working** |
| 2 | *Italic* | Yes | `*text*` / `_text_` (paste only) | Yes → `<em>` | Not stripped back | **Working** |
| 3 | Underline | Yes | No MD syntax | No (not in MD spec) | Not exported | **Partial** — toolbar only, no MD round-trip |
| 4 | ~~Strikethrough~~ | Yes | `~~text~~` (paste only) | Yes → `<del>` | Not stripped back | **Working** |
| 5 | ***Bold Italic*** | No button | `***text***` (paste only) | Yes → `<strong><em>` | Not stripped back | **Working** on import |
| 6 | `Inline Code` | No button | `` `text` `` (paste only) | Yes → `<code>` | Not stripped back | **Partial** — no toolbar button |
| 7 | [Link](url) | Yes (create/edit/open/remove) | No live typing conversion | Yes `[text](url)` → `<a>` | Not stripped back | **Working** |
| 8 | ==Highlight== | No button | No | Yes → `<mark>` | Not stripped back | **Import only** — no toolbar or typing support |
| 9 | Text Color | Props defined | No UI | No | No | **Not Working** — no UI controls exist |
| 10 | Background Color | Props defined | No UI | No | No | **Not Working** — no UI controls exist |
| 11 | Font Size | Rendering works (sm/lg/xl) | No UI in toolbar | No | No | **Not Working** — no way to set it |

---

## 3. KEYBOARD SHORTCUTS & AUTO-DETECTION

| # | Shortcut / Trigger | Action | Status |
|---|-------------------|--------|--------|
| 1 | `/` in empty block | Opens Slash Menu | **Working** |
| 2 | `Enter` on empty list item | Exits list, creates text block | **Working** |
| 3 | `Enter` on non-empty list | Creates new list item of same type | **Working** |
| 4 | `Enter` on regular block | Creates new text block below | **Working** |
| 5 | `Backspace` on empty block | Deletes block, focuses previous | **Working** |
| 6 | `Backspace` at start of non-empty block | Merges content with previous block | **Working** |
| 7 | `Ctrl+A` / `Cmd+A` | Selects all blocks | **Working** |
| 8 | `Delete` / `Backspace` on selection | Deletes all selected blocks | **Working** |
| 9 | `Escape` | Clears block selection | **Working** |
| 10 | Type `1. text` in text block | Auto-converts to numbered-list | **Working** |
| 11 | Type ` ``` ` in text block | Auto-converts to code block | **Working** |
| 12 | `Arrow Up/Down` in Slash Menu | Navigate items | **Working** |
| 13 | `Enter` in Slash Menu | Select item | **Working** |
| 14 | `Escape` in Slash Menu | Close menu | **Working** |
| 15 | `Tab` in table | Move to next cell | **Working** |
| 16 | `Shift+Tab` in table | Move to previous cell | **Working** |
| 17 | `Enter` in table | Move to next row | **Working** |
| 18 | `Ctrl+Down` in table | Add row below | **Working** |
| 19 | `Ctrl+Right` in table | Add column right | **Working** |
| 20 | Type `- ` at line start | Convert to bullet list | **NOT Working** — no auto-detect |
| 21 | Type `* ` at line start | Convert to bullet list | **NOT Working** — no auto-detect |
| 22 | Type `> ` at line start | Convert to quote | **NOT Working** — no auto-detect |
| 23 | Type `# ` at line start | Convert to heading 1 | **NOT Working** — no auto-detect |
| 24 | Type `## ` at line start | Convert to heading 2 | **NOT Working** — no auto-detect |
| 25 | Type `### ` at line start | Convert to heading 3 | **NOT Working** — no auto-detect |
| 26 | Type `---` then Enter | Convert to divider | **NOT Working** — no auto-detect |
| 27 | Type `- [ ]` | Convert to task/checkbox | **NOT Working** — no auto-detect |
| 28 | `Ctrl+B` | Bold | **NOT Working** — no keyboard shortcut |
| 29 | `Ctrl+I` | Italic | **NOT Working** — no keyboard shortcut |
| 30 | `Ctrl+U` | Underline | **NOT Working** — no keyboard shortcut |
| 31 | `Ctrl+K` | Insert link | **NOT Working** — no keyboard shortcut |
| 32 | `Ctrl+Z` | Undo | **Browser native** — works but no custom undo stack |
| 33 | `Ctrl+Shift+S` | Strikethrough | **NOT Working** — no keyboard shortcut |

---

## 4. DRAG & DROP

| Feature | Status |
|---------|--------|
| Reorder blocks via drag handle | **Working** |
| Visual feedback (opacity, z-index) | **Working** |
| Disabled in read-only mode | **Working** |
| Drag handle in left gutter on hover | **Working** |
| Detects drag vs click (>3px threshold) | **Working** |

---

## 5. PAGE-LEVEL FEATURES

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 1 | Page Title | **Working** | Persisted to localStorage |
| 2 | Page Icon (emoji) | **Working** | Stored as base64 |
| 3 | Page Cover Image | **Working** | Stored as base64 |
| 4 | Word Count | **Working** | Counts text/heading/list blocks |
| 5 | Character Count | **Working** | Same as word count |
| 6 | Dark Mode | **Working** | Toggle via PageMenu |
| 7 | Focus Mode | **Working** | Distraction-free editing |
| 8 | Preview Mode | **Working** | Read-only view |
| 9 | Clear All Content | **Working** | With confirmation dialog |
| 10 | Auto-save to localStorage | **Working** | 300ms debounce, optional |
| 11 | onChange callback | **Working** | Fires on every block change |

---

## 6. IMPORT / EXPORT

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 1 | Import Markdown (.md, .txt) | **Working** | Full parser with all block types |
| 2 | Export as Markdown | **Working** | Downloads .md file |
| 3 | Export as HTML | **Working** | Downloads .html file |
| 4 | Import HTML | **NOT Available** | No support |
| 5 | Import JSON (blocks) | **NOT Available** | Only via props |
| 6 | Export JSON (blocks) | **NOT Available** | Only via onChange callback |
| 7 | Copy/Paste markdown | **Partial** | Paste handles inline MD, but doesn't create new blocks from multi-line paste |

---

## 7. MARKDOWN IMPORT — PATTERN COVERAGE

Testing against the 35 article files:

| # | MD Pattern | Parsed Correctly | Notes |
|---|-----------|-----------------|-------|
| 1 | `# Heading 1` | Yes | |
| 2 | `## Heading 2` | Yes | |
| 3 | `### Heading 3` | Yes | |
| 4 | `#### - ######` Headings | Yes | Clamped to h3 |
| 5 | `---` Divider | Yes | |
| 6 | `***` / `___` Divider | Yes | |
| 7 | `> Blockquote` | Yes | Multi-line merged |
| 8 | `- Bullet item` | Yes | With continuation lines |
| 9 | `* Bullet item` | Yes | |
| 10 | `1. Numbered item` | Yes | With continuation lines |
| 11 | `- [ ] Task list` | Yes | Rendered as bullet (no checkbox) |
| 12 | `- [x] Checked task` | Yes | Rendered as bullet (no checkbox) |
| 13 | `![alt](url)` Image | Yes | Caption from alt text |
| 14 | `[![thumb](img)](url)` Linked image | Yes | Becomes video block |
| 15 | `<iframe src="...">` | Yes | Becomes video block |
| 16 | ` ```lang ... ``` ` Code fence | Yes | Language tag preserved & shown |
| 17 | ` ```mermaid ``` ` | Yes | Shows "mermaid" label (no rendering) |
| 18 | Pipe tables `\| col \| col \|` | Yes | Header separator rows filtered |
| 19 | `**bold**` inline | Yes | Converted to `<strong>` |
| 20 | `*italic*` / `_italic_` | Yes | Converted to `<em>` |
| 21 | `~~strikethrough~~` | Yes | Converted to `<del>` |
| 22 | `==highlight==` | Yes | Converted to `<mark>` |
| 23 | `` `inline code` `` | Yes | Converted to `<code>` |
| 24 | `[text](url)` links | Yes | Clickable `<a>` |
| 25 | `**Author:** text` metadata | Yes | Parsed as bold text paragraph |
| 26 | Consecutive text lines (paragraph) | Yes | Merged into single block |
| 27 | Footnote refs `[1]` | Partial | Treated as link syntax if `[1](url)`, otherwise plain text |
| 28 | Nested lists (indented) | Partial | Flattened to same level |
| 29 | HTML tags (`<br>`, `<sup>`) | No | Passed through as raw text |
| 30 | Emoji symbols (unicode) | Yes | Pass through correctly |

---

## 8. WHAT'S MISSING / NOT WORKING

### A. Missing Markdown Auto-Detect While Typing

These markdown shortcuts only work on **paste** or **import**, NOT while typing live:

| Shortcut | Expected | Current |
|----------|----------|---------|
| `- ` at line start | Convert to bullet list | Nothing (only `1. ` and ` ``` ` are auto-detected) |
| `* ` at line start | Convert to bullet list | Nothing |
| `> ` at line start | Convert to quote | Nothing |
| `# ` at line start | Convert to heading 1 | Nothing |
| `## ` at line start | Convert to heading 2 | Nothing |
| `### ` at line start | Convert to heading 3 | Nothing |
| `---` then Enter | Convert to divider | Nothing |
| `- [ ]` | Convert to task/checkbox | Nothing |

### B. Missing Keyboard Shortcuts for Formatting

| Shortcut | Action | Status |
|----------|--------|--------|
| `Ctrl+B` | Bold | Missing |
| `Ctrl+I` | Italic | Missing |
| `Ctrl+U` | Underline | Missing |
| `Ctrl+K` | Insert/edit link | Missing |
| `Ctrl+Shift+S` | Strikethrough | Missing |
| `Ctrl+Shift+H` | Highlight | Missing |
| `Ctrl+E` | Inline code | Missing |
| `Ctrl+Shift+7` | Numbered list | Missing |
| `Ctrl+Shift+8` | Bullet list | Missing |
| `Ctrl+Shift+9` | Quote/blockquote | Missing |

### C. Missing Block Types

| Block Type | Description |
|-----------|-------------|
| **Toggle/Collapsible** | Expandable content sections |
| **Task/Checkbox List** | `- [ ]` with interactive checkboxes |
| **Embed** | Generic URL embeds (Twitter, CodePen, etc.) |
| **Columns/Layout** | Side-by-side block layout |
| **Nested/Indented Blocks** | Sub-blocks under parent blocks |
| **Equation/Math** | LaTeX or KaTeX math rendering |
| **Bookmark** | URL previews with title/description/image |
| **Synced Block** | Reusable block references |
| **Table of Contents** | Auto-generated from headings |

### D. Missing Inline Formatting in Toolbar

| Format | Status |
|--------|--------|
| Inline Code (`` ` ``) | No toolbar button |
| Highlight (`==`) | No toolbar button |
| Superscript | Not supported |
| Subscript | Not supported |
| Text Color picker | Props exist, no UI |
| Background Color picker | Props exist, no UI |
| Font Size control | Props exist, no UI in toolbar |

### E. Missing Features in Import/Export

| Feature | Status |
|---------|--------|
| Mermaid diagram rendering | Language label shown, no visual render |
| Syntax highlighting in code blocks | No (just monospace text) |
| Nested list preservation | Flattened to single level |
| Task list checkboxes | Imported as plain bullets |
| HTML tag pass-through (`<br>`, `<sup>`) | Not parsed |
| Footnote support | Not fully parsed |
| Definition lists (`term : definition`) | Not supported |
| Abbreviations | Not supported |
| Front matter (`---\nyaml\n---`) | Parsed as divider + text |

### F. Other Missing Features

| Feature | Description |
|---------|-------------|
| Custom undo/redo stack | Relies on browser contentEditable undo |
| Block search in BlockMenu | Search input exists but doesn't filter |
| Copy block as markdown | No right-click copy option |
| Paste multi-line to multiple blocks | Paste creates inline `<br>`, not new blocks |
| Collaborative editing | No real-time collaboration |
| Version history | No change tracking |
| Slash menu fuzzy search | Type to filter works, but no fuzzy matching |
| Block comments/annotations | Not supported |

---

## 9. PRIORITY FIX RECOMMENDATIONS

### High Priority (Core editing experience)
1. **Add markdown auto-detect shortcuts** — `- `, `> `, `# `, `## `, `### `, `---` while typing
2. **Add keyboard shortcuts** — `Ctrl+B/I/U/K` for bold/italic/underline/link
3. **Add inline code button** to floating toolbar
4. **Fix multi-line paste** — should create separate blocks, not `<br>` within one block

### Medium Priority (Feature completeness)
5. **Add task/checkbox list** block type with interactive checkboxes
6. **Add text/background color picker** to floating toolbar
7. **Add font size control** to floating toolbar
8. **Make BlockMenu search functional**
9. **Add highlight button** to floating toolbar

### Low Priority (Nice-to-have)
10. Add toggle/collapsible block type
11. Add syntax highlighting for code blocks
12. Add mermaid diagram rendering
13. Add nested block support
14. Add table of contents generator
15. Add front matter parsing for YAML metadata

---

## 10. IMPLEMENTED FIXES (Latest Update)

### Fix 1: Markdown Auto-Detect While Typing
All these shortcuts now work **live while typing** (not just on paste/import):
- `- ` or `* ` at line start → bullet list
- `> ` at line start → quote
- `# ` → heading 1, `## ` → heading 2, `### ` → heading 3
- `---`, `***`, `___` → divider
- ` ``` ` → code block (with language tag)

### Fix 2: Keyboard Shortcuts for Formatting
- `Ctrl+B` → Bold
- `Ctrl+I` → Italic
- `Ctrl+U` → Underline
- `Ctrl+K` → Insert/edit link
- `Ctrl+E` → Inline code
- `Ctrl+Shift+S` → Strikethrough
- `Ctrl+Shift+H` → Highlight

### Fix 3: New Toolbar Buttons
Added to the floating toolbar:
- **Inline Code** button (with `<Code>` icon)
- **Highlight** button (with `<Highlighter>` icon)
- Tooltips with keyboard shortcuts on all formatting buttons

### Fix 4: Multi-Line Paste Creates Proper Blocks
Pasting multi-line markdown text now:
- Parses the markdown through `markdownToBlocks()`
- Creates separate blocks (headings, lists, code, tables, etc.)
- Replaces empty blocks or inserts after current block
- Focuses the last pasted block
