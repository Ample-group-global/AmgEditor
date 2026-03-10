# AmgEditor - Features & Specifications

> **Package**: `@amplecapitalglobal/editor` | **Version**: 1.0.8 | **License**: MIT
> A Notion-like block editor component for React

---

## Part 1: Editor Features (Manual Content Writing)

### Block Types

- **Text** — Plain paragraph text
- **Heading 1 / 2 / 3** — Section headings
- **Bullet List** — Unordered list items
- **Numbered List** — Ordered list items with auto-numbering
- **To-do List** — Checkbox task items (checked/unchecked)
- **Quote** — Blockquotes with nesting support
- **Divider** — Horizontal rule separator
- **Callout** — Info, Warning, Danger, Success admonition blocks
- **Code Block** — 300+ language syntax highlighting, line numbers, edit/preview toggle
- **Math Block** — LaTeX rendering via KaTeX, edit/preview toggle
- **Diagram** — Mermaid diagrams (flowchart, sequence, class, state, Gantt), edit/preview toggle
- **Image** — Upload or embed URL, resizable, captionable, alignment (left/center/right)
- **Video** — Upload or embed URL, auto-detects YouTube, Vimeo, Loom, Dailymotion
- **File** — Upload or link, displays name, size, type with download option
- **Table** — Add/remove rows & columns, resizable columns, header toggle, cell alignment, rich text in cells
- **Table of Contents** — Auto-generated from headings

### Inline Formatting

- **Bold** — `Ctrl+B`
- **Italic** — `Ctrl+I`
- **Underline** — `Ctrl+U`
- **Strikethrough** — `Ctrl+Shift+S`
- **Inline Code** — `Ctrl+E`
- **Highlight** — `Ctrl+Shift+H` (8 colors: Yellow, Green, Blue, Pink, Purple, Orange, Red, Gray)
- **Link** — `Ctrl+K` (create, edit, open, remove)

### Slash Menu (type `/` in empty block)

- Text, Heading 1, Heading 2, Heading 3
- Bullet List, Numbered List, To-do List
- Quote, Callout, Divider
- Code, Math Equation, Diagram
- Table, Table of Contents
- Image, Video, File

### Auto-Detection (while typing)

- `- ` or `* ` → Bullet list
- `1. ` → Numbered list
- `> ` → Quote
- `# ` / `## ` / `### ` → Heading 1 / 2 / 3
- `---` / `***` / `___` → Divider
- ` ``` ` → Code block

### Floating Toolbar (on text selection)

- Block type conversion: Text, H1, H2, H3, Bullet, Numbered, Todo, Quote, Callout
- Text alignment: Left, Center, Right, Justify
- Inline formatting: Bold, Italic, Underline, Strikethrough, Code, Highlight (color picker), Link

### Block Context Menu (right-click / drag handle)

- Delete block
- Duplicate block
- Turn Into (convert block type)
- Move Up / Move Down
- Drag & drop reordering

### Table Navigation

- `Tab` → Next cell
- `Shift+Tab` → Previous cell
- `Enter` → Next row
- `Ctrl+Down` → Add row below
- `Ctrl+Right` → Add column right

### Block Navigation

- `Enter` → Create new block
- `Shift+Enter` / `Ctrl+Enter` → Exit code/math/diagram block
- `Backspace` → Delete empty block or merge with previous
- `Arrow Up/Down` → Navigate between blocks
- `Ctrl+A` → Select all blocks
- `Escape` → Clear selection

### Emoji Autocomplete

- Type `:` to trigger picker (100+ shortcodes)
- Filter by name, arrow key navigation, Enter/Tab to select

### Page Features

- Page title, page icon (emoji), page cover image
- Word count & character count
- Preview mode (read-only)
- Focus mode (distraction-free)
- Dark mode / Light mode
- Auto-save with status indicator (saving/saved/unsaved)
- Clear all content (with confirmation)
- Export as Markdown (.md file download)

---

## Part 2: Markdown Import Features

### Headings
- ATX headings: `#`, `##`, `###` (H4–H6 mapped to H3)
- Setext headings: `===` underline (H1), `---` underline (H2)

### Lists
- Bullet lists: `-`, `*`, `+` with continuation lines
- Numbered lists: `1.` with continuation lines
- Task lists: `- [ ]` (unchecked), `- [x]` (checked)
- Nested/indented lists

### Text Formatting
- **Bold**: `**text**`, `__text__`
- *Italic*: `*text*`, `_text_`
- ***Bold Italic***: `***text***`, `___text___`
- ~~Strikethrough~~: `~~text~~`
- ==Highlight==: `==text==`
- Superscript: `^text^`
- Subscript: `~text~`
- `Inline code`: `` `text` ``

### Links & References
- Inline links: `[text](url)`
- Reference links: `[text][ref]` with `[ref]: url` definitions
- Shorthand references: `[text][]`
- Bare URL auto-linking: `https://...`
- Angle bracket autolinks: `<https://url>`

### Block Quotes
- Single level: `>`
- Nested: `>>`, `>>>`, etc.

### Dividers
- `---`, `***`, `___`

### Code Blocks
- Fenced: ` ``` ` or `~~~` with language tag
- 300+ language detection and syntax highlighting

### Math
- Block math: `$$...$$`
- Inline math: `$...$`

### Diagrams
- Mermaid: ` ```mermaid `
- Sequence: ` ```sequence ` (auto-converted to Mermaid)
- Flow: ` ```flow ` (auto-converted to Mermaid flowchart)
- PlantUML: `@startuml...@enduml`

### Tables
- Pipe-delimited format: `| col1 | col2 |`
- Alignment detection: `:---` (left), `---:` (right), `:---:` (center)
- Header row support

### Images & Media
- Images: `![alt](url)`
- Linked images: `[![alt](thumb)](url)`
- YouTube detection from linked thumbnails
- Video embeds: `{%youtube ID%}`, `<iframe>`

### Callouts / Admonitions
- `:::info` / `:::warning` / `:::danger` with closing `:::`

### Footnotes
- Inline reference: `[^1]`
- Definition: `[^1]: footnote text`

### Definition Lists
- `Term` followed by `: definition`

### Emoji & Icons
- Emoji shortcodes: `:smile:`, `:rocket:`, etc. (100+ supported)
- Font Awesome icons: `<i class="fa fa-icon"></i>` (26 mapped to Unicode)

### HTML Elements
- `<br>`, `<center>`, `<details>`, `<summary>`, `<div>`, `<iframe>`
- `<kbd>`, `<mark>`, `<sub>`, `<sup>`, `<span style>`

### Special / Platform-Specific
- Table of Contents: `[TOC]` / `[toc]`
- HackMD color syntax: `[color=...]`
- Multi-line paragraph merging
- Continuation lines (indented text after list items)
