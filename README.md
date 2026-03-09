# @amplecapitalglobal/editor

A powerful, Notion-like block editor component for React. Create rich, structured content with drag-and-drop blocks, markdown support, and more.

## Features

- 📝 **Block-based editing** - Similar to Notion's block system
- 🎨 **Rich formatting** - Bold, italic, underline, strikethrough, links
- 📋 **Multiple block types** - Headings, lists, quotes, images, videos, tables, and more
- 🖱️ **Drag & Drop** - Reorder blocks with intuitive drag-and-drop
- 📤 **Export/Import** - Export to Markdown or HTML, import from Markdown
- 🎯 **TypeScript** - Fully typed with TypeScript
- 🎨 **Customizable** - Control editor behavior with props
- 💾 **Content access** - Get editor content via onChange callback

## Installation

```bash
npm install @amplecapitalglobal/editor
# or
yarn add @amplecapitalglobal/editor
# or
pnpm add @amplecapitalglobal/editor
```

## Peer Dependencies

Make sure you have React and React DOM installed:

```bash
npm install react react-dom
```

The package also requires these peer dependencies (they should be installed in your project):

- `@dnd-kit/core`
- `@dnd-kit/sortable`
- `@dnd-kit/utilities`
- `@radix-ui/react-dialog`
- `@radix-ui/react-alert-dialog`
- `@radix-ui/react-dropdown-menu`
- `@radix-ui/react-tooltip`
- `@radix-ui/react-switch`
- `@radix-ui/react-progress`
- `@radix-ui/react-avatar`
- `@radix-ui/react-tabs`
- `@radix-ui/react-popover`
- `@radix-ui/react-scroll-area`
- `@radix-ui/react-separator`
- `@radix-ui/react-slot`
- `@radix-ui/react-label`
- `sonner`
- `lucide-react`
- `clsx`
- `tailwind-merge`
- `class-variance-authority`
- `re-resizable`
- `next-themes`

## Basic Usage

### 1. Import the Editor

The CSS is automatically included when you import the editor - no need for separate style imports!

```tsx
import { Editor } from "@amplecapitalglobal/editor";
// Styles are automatically included!
```

### 2. Use the Editor Component

```tsx
import { useState } from "react";
import { Editor, Block } from "@amplecapitalglobal/editor";

function App() {
  const [content, setContent] = useState<Block[]>([]);

  const handleChange = (blocks: Block[]) => {
    setContent(blocks);
    // Save to your database here
    console.log("Editor content:", blocks);
  };

  return (
    <div style={{ height: "100vh" }}>
      <Editor
        onChange={handleChange}
        initialBlocks={content}
      />
    </div>
  );
}
```

## Getting Editor Content

The editor content is available through the `onChange` callback. The callback receives an array of `Block` objects:

```tsx
import { Editor, Block } from "@amplecapitalglobal/editor";

function MyComponent() {
  const handleContentChange = (blocks: Block[]) => {
    // blocks is an array of Block objects
    // Each block has: id, type, content, metadata, props
    
    // Save to database
    saveToDatabase(blocks);
    
    // Or convert to JSON
    const json = JSON.stringify(blocks);
    
    // Or use the converter functions
    const markdown = blocksToMarkdown(blocks);
    const html = blocksToHtml(blocks);
  };

  return (
    <Editor
      onChange={handleContentChange}
    />
  );
}
```

## Saving to Database

Here's a complete example of saving editor content to a database:

```tsx
import { useState, useEffect } from "react";
import { Editor, Block, blocksToMarkdown, blocksToHtml } from "@amplecapitalglobal/editor";

function EditorWithDatabase() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Load initial content from database
  useEffect(() => {
    async function loadContent() {
      try {
        const response = await fetch("/api/content");
        const data = await response.json();
        if (data.blocks) {
          setBlocks(data.blocks);
        }
      } catch (error) {
        console.error("Failed to load content:", error);
      }
    }
    loadContent();
  }, []);

  // Save content to database
  const handleChange = async (newBlocks: Block[]) => {
    setBlocks(newBlocks);
    setIsSaving(true);

    try {
      // Save blocks as JSON
      await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blocks: newBlocks,
          // Optionally also save as markdown or HTML
          markdown: blocksToMarkdown(newBlocks),
          html: blocksToHtml(newBlocks),
        }),
      });

      console.log("Content saved successfully!");
    } catch (error) {
      console.error("Failed to save content:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      {isSaving && <div>Saving...</div>}
      <Editor
        initialBlocks={blocks}
        onChange={handleChange}
        useLocalStorage={false} // Disable localStorage, use your own storage
      />
    </div>
  );
}
```

## API Reference

### Editor Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `initialBlocks` | `Block[]` | `[]` | Initial blocks/content to display |
| `onChange` | `(blocks: Block[]) => void` | `undefined` | Callback called when content changes |
| `useLocalStorage` | `boolean` | `false` | Whether to auto-save to localStorage |
| `storageKey` | `string` | `"editor-content"` | localStorage key (if useLocalStorage is true) |
| `readOnly` | `boolean` | `false` | Whether editor is in read-only mode |
| `className` | `string` | `""` | Custom className for editor container |
| `showPageMenu` | `boolean` | `true` | Whether to show the page menu (export/import) |
| `onExportMarkdown` | `(markdown: string) => void` | `undefined` | Callback when user exports to markdown |
| `onExportHtml` | `(html: string) => void` | `undefined` | Callback when user exports to HTML |
| `onImportMarkdown` | `(markdown: string) => void` | `undefined` | Callback when user imports markdown |

### Block Type

```typescript
interface Block {
  id: string;
  type: BlockType;
  content: string;
  children?: Block[];
  metadata?: Record<string, any>;
  props?: {
    textColor?: string;
    backgroundColor?: string;
    textAlign?: string;
    fontSize?: string;
    [key: string]: any;
  };
}

type BlockType =
  | "text"
  | "heading-1"
  | "heading-2"
  | "heading-3"
  | "bullet-list"
  | "numbered-list"
  | "quote"
  | "divider"
  | "callout"
  | "image"
  | "video"
  | "file"
  | "table";
```

## Converter Functions

Convert blocks to different formats:

```tsx
import { blocksToMarkdown, blocksToHtml, markdownToBlocks } from "@amplecapitalglobal/editor";

// Convert blocks to Markdown
const markdown = blocksToMarkdown(blocks);

// Convert blocks to HTML
const html = blocksToHtml(blocks);

// Convert Markdown to blocks
const blocks = markdownToBlocks(markdownString);
```

## Examples

### Example 1: Basic Editor with onChange

```tsx
import { Editor, Block } from "@amplecapitalglobal/editor";

function MyEditor() {
  const handleChange = (blocks: Block[]) => {
    // This is called whenever the editor content changes
    console.log("Current blocks:", blocks);
    
    // Save to your backend
    fetch("/api/save", {
      method: "POST",
      body: JSON.stringify({ blocks }),
    });
  };

  return <Editor onChange={handleChange} />;
}
```

### Example 2: Editor with Initial Content

```tsx
import { Editor, Block, createBlock } from "@amplecapitalglobal/editor";

function EditorWithContent() {
  const initialBlocks: Block[] = [
    createBlock("heading-1", "Welcome"),
    createBlock("text", "This is the initial content"),
  ];

  return (
    <Editor
      initialBlocks={initialBlocks}
      onChange={(blocks) => console.log(blocks)}
    />
  );
}
```

### Example 3: Read-only Preview Mode

```tsx
import { Editor, Block } from "@amplecapitalglobal/editor";

function PreviewEditor({ blocks }: { blocks: Block[] }) {
  return (
    <Editor
      initialBlocks={blocks}
      readOnly={true}
      showPageMenu={false}
    />
  );
}
```

### Example 4: Custom Export Handlers

```tsx
import { Editor, Block } from "@amplecapitalglobal/editor";

function CustomExportEditor() {
  const handleExportMarkdown = (markdown: string) => {
    // Custom export logic
    downloadFile(markdown, "document.md", "text/markdown");
  };

  const handleExportHtml = (html: string) => {
    // Custom export logic
    downloadFile(html, "document.html", "text/html");
  };

  return (
    <Editor
      onExportMarkdown={handleExportMarkdown}
      onExportHtml={handleExportHtml}
    />
  );
}
```

## Styling

The editor styles are **automatically included** when you import the Editor component - no additional CSS imports required!

The package uses Tailwind CSS internally, but all styles are pre-compiled and bundled with the package. You don't need to configure Tailwind in your project unless you want to customize the editor's appearance.

### Optional: Manual CSS Import

If you need to import the CSS separately (e.g., for custom bundling), you can use:

```tsx
import "@amplecapitalglobal/editor/dist/style.css";
```

## Development

```bash
# Install dependencies
npm install

# Build the library
npm run build:lib

# Build the demo app
npm run build:app

# Run development server
npm run dev
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

