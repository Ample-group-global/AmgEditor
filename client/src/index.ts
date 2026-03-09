// Import styles
import "./index.css";

// Main Editor Component
export { Editor } from "./components/editor/Editor";
export type { EditorProps } from "./components/editor/Editor";

// Types
export type { Block, BlockType } from "./lib/editor-types";
export { createBlock, initialBlocks, generateUUID } from "./lib/editor-types";

// Converters
export { blocksToHtml, blocksToMarkdown, markdownToBlocks } from "./lib/converters";

