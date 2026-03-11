# @amplecapitalglobal/editor

A powerful, Notion-like block editor component for React with drag-and-drop, markdown import/export, code highlighting, math equations, diagrams, and tables.

**Demo**: https://amg-editor.vercel.app/

## Installation

```bash
npm install @amplecapitalglobal/editor
```

No CSS import required — styles are auto-injected.

## Quick Start

```tsx
import { useState } from "react";
import { Editor, Block } from "@amplecapitalglobal/editor";

function App() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  return <Editor initialBlocks={blocks} onChange={setBlocks} />;
}
```

## Features

- **17 block types**: Text, Headings, Lists, Todo, Quote, Callout, Code (300+ languages), Math (KaTeX), Diagrams (Mermaid), Image, Video, File, Table, Table of Contents, Divider
- **Rich inline formatting**: Bold, Italic, Underline, Strikethrough, Code, Highlight (8 colors), Links
- **Slash menu**: Type `/` to insert any block type
- **Markdown shortcuts**: `# `, `- `, `> `, ` ``` `, `---` auto-detect while typing
- **Keyboard shortcuts**: `Ctrl+B/I/U/K/E`, `Ctrl+Shift+S/H`
- **Drag & drop** block reordering
- **Import/Export**: Markdown, HTML, JSON
- **Dark mode**, focus mode, preview mode
- **Page features**: Title, icon, cover image, word count

## CDN Dependencies

Add to your `index.html` for math, diagrams, and code highlighting:

```html
<!-- KaTeX -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css" />
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js"></script>
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/auto-render.min.js"></script>

<!-- Mermaid -->
<script src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"></script>

<!-- PrismJS -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/themes/prism-tomorrow.min.css" />
<script src="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/prism.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/plugins/autoloader/prism-autoloader.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/plugins/line-numbers/prism-line-numbers.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/plugins/line-numbers/prism-line-numbers.min.css" />
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `initialBlocks` | `Block[]` | `[]` | Initial content |
| `onChange` | `(blocks: Block[]) => void` | — | Content change callback |
| `readOnly` | `boolean` | `false` | Read-only mode |
| `useLocalStorage` | `boolean` | `false` | Auto-save to localStorage |
| `storageKey` | `string` | `"editor-content"` | localStorage key |
| `showPageMenu` | `boolean` | `true` | Show page menu |
| `className` | `string` | — | Custom CSS class |

## Converter Functions

```tsx
import { blocksToMarkdown, blocksToHtml, markdownToBlocks } from "@amplecapitalglobal/editor";

const markdown = blocksToMarkdown(blocks);
const html = blocksToHtml(blocks);
const blocks = markdownToBlocks(markdownString);
```

## Full Documentation

See [AmgEditor-Features-Specs.md](./AmgEditor-Features-Specs.md) for complete specifications, .NET Core integration guide, and API reference.

## License

MIT
