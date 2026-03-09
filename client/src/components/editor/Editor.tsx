import { useState, useEffect, useRef } from "react";
import { BlockComponent } from "./BlockComponent";
import { SlashMenu } from "./SlashMenu";
import { FloatingToolbar } from "./FloatingToolbar";
import { EmojiPicker } from "./EmojiPicker";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  blocksToHtml,
  blocksToMarkdown,
  markdownToBlocks,
} from "@/lib/converters";
import { PageMenu } from "./PageMenu";
import { toast } from "sonner";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  Block,
  BlockType,
  createBlock,
  initialBlocks,
  generateUUID,
} from "@/lib/editor-types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export interface EditorProps {
  /**
   * Initial blocks/content to display in the editor
   */
  initialBlocks?: Block[];
  /**
   * Callback function called whenever the editor content changes
   * @param blocks - The current blocks array
   */
  onChange?: (blocks: Block[]) => void;
  /**
   * Whether to use localStorage for auto-saving (default: false)
   */
  useLocalStorage?: boolean;
  /**
   * localStorage key to use for saving (default: "editor-content")
   */
  storageKey?: string;
  /**
   * Whether the editor is in read-only/preview mode
   */
  readOnly?: boolean;
  /**
   * Custom className for the editor container
   */
  className?: string;
  /**
   * Whether to show the page menu (export/import options)
   */
  showPageMenu?: boolean;
  /**
   * Callback for when user exports to markdown
   */
  onExportMarkdown?: (markdown: string) => void;
  /**
   * Callback for when user exports to HTML
   */
  onExportHtml?: (html: string) => void;
  /**
   * Callback for when user imports markdown
   */
  onImportMarkdown?: (markdown: string) => void;
}

export function Editor({
  initialBlocks: propInitialBlocks,
  onChange,
  useLocalStorage = false,
  storageKey = "editor-content",
  readOnly = false,
  className,
  showPageMenu = true,
  onExportMarkdown,
  onExportHtml,
  onImportMarkdown,
}: EditorProps = {}) {
  const [blocks, setBlocks] = useState<Block[]>(() => {
    // Priority: prop > localStorage (if enabled) > initialBlocks
    if (propInitialBlocks) {
      return propInitialBlocks;
    }
    if (useLocalStorage) {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return initialBlocks;
        }
      }
    }
    return initialBlocks;
  });
  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);
  const [selectedBlockIds, setSelectedBlockIds] = useState<Set<string>>(new Set());
  const [slashMenuPos, setSlashMenuPos] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [slashMenuBlockId, setSlashMenuBlockId] = useState<string | null>(null);
  const [slashMenuFilter, setSlashMenuFilter] = useState<string>("");
  const [selectionRect, setSelectionRect] = useState<DOMRect | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(readOnly);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkAction, setLinkAction] = useState<"create" | "edit">("create");
  const savedLinkSelectionRef = useRef<Range | null>(null);
  const [clearAllDialogOpen, setClearAllDialogOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");

  // ── Emoji autocomplete state ───────────────────────────────────────────────
  const [emojiQuery, setEmojiQuery] = useState("");
  const [emojiPos, setEmojiPos] = useState<{ top: number; left: number } | null>(null);
  const [emojiBlockId, setEmojiBlockId] = useState<string | null>(null);

  // ── Undo/Redo History ──────────────────────────────────────────────────────
  const historyRef = useRef<Block[][]>([]);
  const historyIndexRef = useRef(-1);
  const isUndoRedoRef = useRef(false);

  const pushHistory = (newBlocks: Block[]) => {
    if (isUndoRedoRef.current) {
      isUndoRedoRef.current = false;
      return;
    }
    // Trim forward history if we're not at the end
    const history = historyRef.current;
    const idx = historyIndexRef.current;
    if (idx < history.length - 1) {
      historyRef.current = history.slice(0, idx + 1);
    }
    historyRef.current.push(JSON.parse(JSON.stringify(newBlocks)));
    // Cap at 100 entries
    if (historyRef.current.length > 100) {
      historyRef.current.shift();
    }
    historyIndexRef.current = historyRef.current.length - 1;
  };

  const handleUndo = () => {
    const idx = historyIndexRef.current;
    if (idx <= 0) return;
    historyIndexRef.current = idx - 1;
    isUndoRedoRef.current = true;
    const restored = JSON.parse(JSON.stringify(historyRef.current[idx - 1]));
    setBlocks(restored);
  };

  const handleRedo = () => {
    const history = historyRef.current;
    const idx = historyIndexRef.current;
    if (idx >= history.length - 1) return;
    historyIndexRef.current = idx + 1;
    isUndoRedoRef.current = true;
    const restored = JSON.parse(JSON.stringify(history[idx + 1]));
    setBlocks(restored);
  };

  // Page Metadata State
  const [pageTitle, setPageTitle] = useState(
    () => localStorage.getItem("page-title") || "Untitled"
  );
  const [pageIcon, setPageIcon] = useState<string | null>(() =>
    localStorage.getItem("page-icon")
  );
  const [pageCover, setPageCover] = useState<string | null>(() =>
    localStorage.getItem("page-cover")
  );

  // Persist Page Metadata
  useEffect(() => {
    localStorage.setItem("page-title", pageTitle);
  }, [pageTitle]);
  useEffect(() => {
    if (pageIcon) localStorage.setItem("page-icon", pageIcon);
    else localStorage.removeItem("page-icon");
  }, [pageIcon]);
  useEffect(() => {
    if (pageCover) localStorage.setItem("page-cover", pageCover);
    else localStorage.removeItem("page-cover");
  }, [pageCover]);

  // Word count calculation
  const wordCount = blocks.reduce((acc, block) => {
    if (
      block.type === "text" ||
      block.type.startsWith("heading") ||
      block.type.endsWith("list")
    ) {
      return (
        acc +
        block.content
          .trim()
          .split(/\s+/)
          .filter(w => w.length > 0).length
      );
    }
    return acc;
  }, 0);

  const charCount = blocks.reduce((acc, block) => {
    if (
      block.type === "text" ||
      block.type.startsWith("heading") ||
      block.type.endsWith("list")
    ) {
      return acc + block.content.length;
    }
    return acc;
  }, 0);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  // Push to history when blocks change
  useEffect(() => {
    pushHistory(blocks);
  }, [blocks]);

  // Call onChange callback when blocks change
  useEffect(() => {
    if (onChange) {
      onChange(blocks);
    }
    setSaveStatus("unsaved");
  }, [blocks, onChange]);

  // Auto-save to local storage (if enabled) with status indicator
  useEffect(() => {
    if (!useLocalStorage) return;
    setSaveStatus("saving");
    const timeoutId = setTimeout(() => {
      localStorage.setItem(storageKey, JSON.stringify(blocks));
      setSaveStatus("saved");
    }, 1000);
    return () => clearTimeout(timeoutId);
  }, [blocks, useLocalStorage, storageKey]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setBlocks(items => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (slashMenuPos) {
        // Check if click is inside the menu
        const target = e.target as HTMLElement;
        if (target.closest(".slash-menu-container")) return;

        // Check if click is on the trigger button (e.g. + button)
        // We can add a class to the trigger button to identify it
        if (target.closest(".slash-menu-trigger")) return;

        setSlashMenuPos(null);
        setSlashMenuBlockId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [slashMenuPos]);

  // Clear block selection when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Don't clear if clicking on a block or block menu
      // Use attribute selector since Tailwind's group/block class contains '/'
      if (target.closest('[class*="group/block"]') || target.closest("[data-slot]")) {
        return;
      }
      // Clear selection if clicking outside blocks
      if (selectedBlockIds.size > 0) {
        setSelectedBlockIds(new Set());
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selectedBlockIds]);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Handle Ctrl+A (Select All Blocks)
      if ((e.ctrlKey || e.metaKey) && e.key === "a") {
        const activeElement = document.activeElement;
        const isInput =
          activeElement instanceof HTMLInputElement ||
          activeElement instanceof HTMLTextAreaElement ||
          activeElement?.getAttribute("contenteditable") === "true";

        if (!isInput) {
          e.preventDefault();
          // Select all blocks
          const allBlockIds = new Set(blocks.map(b => b.id));
          setSelectedBlockIds(allBlockIds);

          // Also select all text content for visual feedback
          const editorContainer = document.querySelector(".editor-container");
          if (editorContainer) {
            const range = document.createRange();
            range.selectNodeContents(editorContainer);
            const selection = window.getSelection();
            selection?.removeAllRanges();
            selection?.addRange(range);
          }
        }
      }

      // Handle Delete key when blocks are selected
      if ((e.key === "Delete" || e.key === "Backspace") && selectedBlockIds.size > 0) {
        const activeElement = document.activeElement;
        const isInput =
          activeElement instanceof HTMLInputElement ||
          activeElement instanceof HTMLTextAreaElement;
        const isContentEditable = activeElement?.getAttribute("contenteditable") === "true";

        // Get current text selection
        const selection = window.getSelection();
        const hasTextSelection = selection && !selection.isCollapsed && selection.toString().trim().length > 0;

        // Only delete blocks if:
        // 1. Not typing in a regular input/textarea, AND
        // 2. Not in a contentEditable element (allow normal text deletion in contentEditable)
        // The block-level handler will handle backspace at the start of empty blocks
        if (!isInput && !isContentEditable) {
          e.preventDefault();
          e.stopPropagation();

          // Delete all selected blocks
          setBlocks(prev => {
            const remainingBlocks = prev.filter(b => !selectedBlockIds.has(b.id));

            // If all blocks were deleted, create an empty text block
            if (remainingBlocks.length === 0) {
              const newBlock = createBlock("text");
              setFocusedBlockId(newBlock.id);
              setSelectedBlockIds(new Set());
              return [newBlock];
            }

            // Focus the first remaining block
            if (remainingBlocks.length > 0) {
              setFocusedBlockId(remainingBlocks[0].id);
            }

            setSelectedBlockIds(new Set());
            return remainingBlocks;
          });

          // Clear text selection
          if (selection) {
            selection.removeAllRanges();
          }
        }
      }

      // Clear selection on Escape
      if (e.key === "Escape" && selectedBlockIds.size > 0) {
        setSelectedBlockIds(new Set());
        const selection = window.getSelection();
        selection?.removeAllRanges();
      }

      // ── Undo/Redo shortcuts ────────────────────────────────────────────────
      const mod = e.ctrlKey || e.metaKey;

      // Ctrl+Z → Undo
      if (mod && !e.shiftKey && e.key === "z") {
        e.preventDefault();
        handleUndo();
        return;
      }
      // Ctrl+Y or Ctrl+Shift+Z → Redo
      if ((mod && e.key === "y") || (mod && e.shiftKey && e.key === "z") || (mod && e.shiftKey && e.key === "Z")) {
        e.preventDefault();
        handleRedo();
        return;
      }

      // ── Formatting keyboard shortcuts ───────────────────────────────────────

      // Ctrl+B → Bold
      if (mod && e.key === "b") {
        e.preventDefault();
        handleFormat("bold");
        return;
      }
      // Ctrl+I → Italic
      if (mod && e.key === "i") {
        e.preventDefault();
        handleFormat("italic");
        return;
      }
      // Ctrl+U → Underline
      if (mod && e.key === "u") {
        e.preventDefault();
        handleFormat("underline");
        return;
      }
      // Ctrl+K → Link
      if (mod && e.key === "k") {
        e.preventDefault();
        handleFormat("link");
        return;
      }
      // Ctrl+E → Inline code
      if (mod && e.key === "e") {
        e.preventDefault();
        handleFormat("inlineCode");
        return;
      }
      // Ctrl+Shift+S → Strikethrough
      if (mod && e.shiftKey && e.key === "S") {
        e.preventDefault();
        handleFormat("strikeThrough");
        return;
      }
      // Ctrl+Shift+H → Highlight
      if (mod && e.shiftKey && e.key === "H") {
        e.preventDefault();
        handleFormat("highlight");
        return;
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [blocks, selectedBlockIds, focusedBlockId]);

  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (selection && !selection.isCollapsed && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        // Only show if selection is within editor
        if (rect.width > 0) {
          setSelectionRect(rect);
        } else {
          setSelectionRect(null);
        }
      } else {
        setSelectionRect(null);
      }
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    return () =>
      document.removeEventListener("selectionchange", handleSelectionChange);
  }, []);

  const updateBlock = (id: string, content: string) => {
    setBlocks(prev => prev.map(b => (b.id === id ? { ...b, content } : b)));

    // ── Check for emoji trigger (:text) ────────────────────────────────────
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      if (range.collapsed) {
        // Get text before cursor
        const node = range.startContainer;
        if (node.nodeType === Node.TEXT_NODE) {
          const textBeforeCursor = (node.textContent || "").substring(0, range.startOffset);
          const colonMatch = textBeforeCursor.match(/:([a-z0-9_+-]{2,})$/i);
          if (colonMatch) {
            const rect = range.getBoundingClientRect();
            setEmojiQuery(colonMatch[1].toLowerCase());
            setEmojiPos({ top: rect.bottom + 5, left: rect.left });
            setEmojiBlockId(id);
          } else {
            setEmojiPos(null);
            setEmojiQuery("");
            setEmojiBlockId(null);
          }
        } else {
          setEmojiPos(null);
          setEmojiQuery("");
        }
      }
    }

    // Check for slash command
    if (content.startsWith("/")) {
      if (!slashMenuPos) {
        // Open the slash menu
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          setSlashMenuPos({ top: rect.bottom + 5, left: rect.left });
          setSlashMenuBlockId(id);
        }
      }
      // Pass filter query to slash menu (text after "/")
      setSlashMenuFilter(content.substring(1).trim().toLowerCase());
    } else if (slashMenuPos && slashMenuBlockId === id) {
      // Content no longer starts with "/" — close menu
      if (content.trim() !== "") {
        setSlashMenuPos(null);
        setSlashMenuBlockId(null);
        setSlashMenuFilter("");
      }
    }
  };

  const updateBlockType = (id: string, type: BlockType) => {
    setBlocks(prev => {
      const blockIndex = prev.findIndex(b => b.id === id);
      if (blockIndex === -1) return prev;

      const block = prev[blockIndex];
      const isListType = type === "bullet-list" || type === "numbered-list";

      // If converting to a list type and content has multiple lines, split into multiple list items
      if (isListType && block.content.includes("\n")) {
        const lines = block.content.split("\n").map(line => line.trim()).filter(line => line.length > 0);

        if (lines.length > 1) {
          // Create multiple list blocks
          const newBlocks = lines.map((line, index) => {
            if (index === 0) {
              // First line replaces the original block
              return { ...block, type, content: line };
            } else {
              // Subsequent lines become new blocks
              return createBlock(type, line);
            }
          });

          // Replace the original block and insert the rest
          const updatedBlocks = [...prev];
          updatedBlocks.splice(blockIndex, 1, ...newBlocks);

          // Focus the first new list item
          if (newBlocks.length > 0) {
            setFocusedBlockId(newBlocks[0].id);
          }

          return updatedBlocks;
        }
      }

      // Default behavior: just change the type
      // For divider, clear content since it doesn't need any
      return prev.map(b =>
        b.id === id
          ? { ...b, type, content: type === "divider" ? "" : b.content }
          : b
      );
    });
  };

  const updateBlockMetadata = (id: string, metadata: any) => {
    setBlocks(prev => prev.map(b => (b.id === id ? { ...b, metadata } : b)));
  };

  const updateBlockProps = (id: string, props: Record<string, any>) => {
    setBlocks(prev => prev.map(b => (b.id === id ? { ...b, props: { ...b.props, ...props } } : b)));
  };


  const addBlock = (afterId: string, type: BlockType = "text") => {
    const newBlock = createBlock(type);
    setBlocks(prev => {
      const index = prev.findIndex(b => b.id === afterId);
      if (index === -1) return prev;
      const newBlocks = [...prev];
      newBlocks.splice(index + 1, 0, newBlock);
      return newBlocks;
    });
    // Use setTimeout to ensure DOM is updated before focusing
    setTimeout(() => {
      setFocusedBlockId(newBlock.id);
    }, 0);
    return newBlock.id;
  };

  const handleAddClick = (id: string) => {
    // Find the element to position the menu
    if (typeof document === 'undefined') return;

    const element = document.getElementById(id);
    if (element) {
      const rect = element.getBoundingClientRect();
      // Position below the current block, but check if it fits
      const menuHeight = 400; // Approximate height
      const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 800;

      let top = rect.bottom + 5;
      // If menu would go off screen bottom, position it above the block
      if (typeof window !== 'undefined' && top + menuHeight > windowHeight) {
        top = Math.max(10, rect.top - menuHeight - 5);
      }

      setSlashMenuPos({ top, left: rect.left });
      // Associate with the CURRENT block (or we can use a special state if we want to insert AFTER this block)
      // But for now, let's use the current block ID as the reference for insertion
      setSlashMenuBlockId(id);
    }
  };

  const removeBlock = (id: string) => {
    setBlocks(prev => {
      const index = prev.findIndex(b => b.id === id);
      if (index === -1) return prev;

      // If it's the only block, just clear content
      if (prev.length === 1) {
        return [{ ...prev[0], content: "", type: "text" }];
      }

      const newBlocks = prev.filter(b => b.id !== id);
      // Focus the previous block if available, else next
      let targetBlockId: string | null = null;
      if (index > 0) {
        targetBlockId = prev[index - 1].id;
      } else if (newBlocks.length > 0) {
        targetBlockId = newBlocks[0].id;
      }

      // Set cursor to the end of the target block's content
      if (targetBlockId) {
        setTimeout(() => {
          const targetBlockElement = document.getElementById(targetBlockId!);
          const editableElement = targetBlockElement?.querySelector('[contenteditable="true"]') as HTMLElement;
          if (editableElement) {
            editableElement.focus();
            // Set cursor to the end of the content
            const range = document.createRange();
            range.selectNodeContents(editableElement);
            range.collapse(false); // Collapse to end
            const sel = window.getSelection();
            sel?.removeAllRanges();
            sel?.addRange(range);
          }
          setFocusedBlockId(targetBlockId!);
        }, 0);
      }

      return newBlocks;
    });
  };

  const duplicateBlock = (id: string) => {
    setBlocks(prev => {
      const index = prev.findIndex(b => b.id === id);
      if (index === -1) return prev;

      const blockToDuplicate = prev[index];
      const newBlock = {
        ...blockToDuplicate,
        id: generateUUID(),
      };

      const newBlocks = [...prev];
      newBlocks.splice(index + 1, 0, newBlock);
      return newBlocks;
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (slashMenuPos) {
      // Let the SlashMenu handle navigation keys
      if (["ArrowUp", "ArrowDown", "Enter", "Escape"].includes(e.key)) {
        return;
      }
    }

    // ── Tab / Shift+Tab for block indentation ──────────────────────────────
    if (e.key === "Tab") {
      const block = blocks.find(b => b.id === id);
      // Only indent list-type and text blocks (not code blocks which handle Tab internally)
      if (block && !block.metadata?.isCode) {
        const indentable = ["bullet-list", "numbered-list", "todo", "text", "quote"];
        if (indentable.includes(block.type)) {
          e.preventDefault();
          const currentIndent = block.props?.indent || 0;
          if (e.shiftKey) {
            // Outdent
            if (currentIndent > 0) {
              setBlocks(prev => prev.map(b =>
                b.id === id ? { ...b, props: { ...b.props, indent: currentIndent - 1 } } : b
              ));
            }
          } else {
            // Indent (max 5 levels)
            if (currentIndent < 5) {
              setBlocks(prev => prev.map(b =>
                b.id === id ? { ...b, props: { ...b.props, indent: currentIndent + 1 } } : b
              ));
            }
          }
          return;
        }
      }
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const currentBlock = blocks.find(b => b.id === id);
      if (!currentBlock) return;

      // Get cursor position and split content
      const selection = window.getSelection();
      let contentBefore = "";
      let contentAfter = "";

      const element = document.querySelector(`[data-block-id="${id}"] [contenteditable]`) as HTMLElement
        || document.getElementById(id)?.querySelector('[contenteditable]') as HTMLElement;

      if (selection && selection.rangeCount > 0 && element) {
        const range = selection.getRangeAt(0);

        // Get content before cursor
        const rangeBefore = document.createRange();
        rangeBefore.selectNodeContents(element);
        rangeBefore.setEnd(range.startContainer, range.startOffset);
        const beforeFrag = rangeBefore.cloneContents();
        const beforeDiv = document.createElement("div");
        beforeDiv.appendChild(beforeFrag);
        contentBefore = beforeDiv.innerHTML;

        // Get content after cursor
        const rangeAfter = document.createRange();
        rangeAfter.selectNodeContents(element);
        rangeAfter.setStart(range.endContainer, range.endOffset);
        const afterFrag = rangeAfter.cloneContents();
        const afterDiv = document.createElement("div");
        afterDiv.appendChild(afterFrag);
        contentAfter = afterDiv.innerHTML;

        // Clean up: if content is just <br> or empty tags, treat as empty
        if (contentBefore.replace(/<br\s*\/?>/g, "").replace(/<[^>]*>/g, "").trim() === "" && !/<img/.test(contentBefore)) {
          contentBefore = "";
        }
        if (contentAfter.replace(/<br\s*\/?>/g, "").replace(/<[^>]*>/g, "").trim() === "" && !/<img/.test(contentAfter)) {
          contentAfter = "";
        }
      }

      // Determine new block type
      const listTypes = ["numbered-list", "bullet-list", "todo"];
      const isListBlock = listTypes.includes(currentBlock.type);
      const newBlockType = isListBlock ? currentBlock.type : "text";

      const newBlock = createBlock(newBlockType);
      newBlock.content = contentAfter;

      if (currentBlock.type === "todo") {
        newBlock.metadata = { checked: false };
      }
      // Preserve indent level
      if (currentBlock.props?.indent) {
        newBlock.props = { ...newBlock.props, indent: currentBlock.props.indent };
      }

      setBlocks(prev => {
        const index = prev.findIndex(b => b.id === id);
        if (index === -1) return prev;
        const newBlocks = [...prev];
        // Update current block with content before cursor
        newBlocks[index] = { ...newBlocks[index], content: contentBefore };
        newBlocks.splice(index + 1, 0, newBlock);
        return newBlocks;
      });
      setFocusedBlockId(newBlock.id);
    } else if (e.key === "Backspace") {
      const block = blocks.find(b => b.id === id);
      if (!block) return;

      // Don't auto-delete dividers, images, videos, files, or tables when empty
      // These block types don't have text content by design
      const nonTextBlockTypes = ["divider", "image", "video", "file", "table"];

      // Get the current selection and cursor position
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);
      const isCollapsed = range.collapsed;

      // Get the actual DOM element and its content
      const activeElement = document.activeElement as HTMLElement;
      const isContentEditable = activeElement?.getAttribute("contenteditable") === "true";

      if (!isContentEditable || !activeElement) {
        // Not in a contentEditable, allow default behavior
        return;
      }

      // Get actual DOM text content (more reliable than state)
      const domTextContent = activeElement.innerText || "";
      const isBlockEmpty = domTextContent.trim() === "";

      // Check if cursor is truly at the start of the element
      // Only merge if we're absolutely sure cursor is at the very beginning
      let isAtStart = false;
      if (isCollapsed) {
        try {
          // Method 1: Create a range from element start to cursor and check if empty
          const testRange = document.createRange();
          testRange.selectNodeContents(activeElement);
          testRange.setEnd(range.startContainer, range.startOffset);
          const textBeforeCursor = testRange.toString();

          // Method 2: Check if we're at the first character position
          const isAtFirstChar = range.startOffset === 0;

          // Both conditions must be true to be considered "at start"
          isAtStart = (textBeforeCursor.length === 0 || textBeforeCursor.trim().length === 0) && isAtFirstChar;

          // Additional safety: if there's any text content in the element and cursor offset > 0,
          // we're definitely not at the start
          if (domTextContent.length > 0 && range.startOffset > 0) {
            isAtStart = false;
          }
        } catch (err) {
          // If range operations fail, be conservative - don't merge
          isAtStart = false;
        }
      }

      // Only handle special cases - otherwise allow normal backspace deletion

      // Case 1: Block is empty - delete the block
      if (isBlockEmpty && blocks.length > 1 && !nonTextBlockTypes.includes(block.type)) {
        e.preventDefault();
        removeBlock(id);
        return;
      }

      // Case 2: Cursor is at the start of a block with content - merge with previous block
      if (isAtStart && !isBlockEmpty && blocks.length > 1 && !nonTextBlockTypes.includes(block.type)) {
        const blockIndex = blocks.findIndex(b => b.id === id);
        if (blockIndex > 0) {
          e.preventDefault();
          const previousBlock = blocks[blockIndex - 1];

          // Only merge if previous block is a text-based block
          if (!nonTextBlockTypes.includes(previousBlock.type)) {
            // Use HTML content to preserve formatting (bold, links, etc.)
            const currentBlockHtml = activeElement.innerHTML || "";
            const previousBlockElement = document.getElementById(previousBlock.id);
            const previousEditableElement = previousBlockElement?.querySelector('[contenteditable="true"]') as HTMLElement;
            const previousBlockHtml = previousEditableElement?.innerHTML || previousBlock.content;

            // Remember the previous block's content length for cursor placement
            const prevContentLength = previousEditableElement?.childNodes.length || 0;

            // Merge HTML content
            const mergedContent = previousBlockHtml + currentBlockHtml;

            setBlocks(prev => {
              const newBlocks = [...prev];
              newBlocks[blockIndex - 1] = { ...previousBlock, content: mergedContent };
              newBlocks.splice(blockIndex, 1);
              return newBlocks;
            });

            // Focus the previous block and place cursor at the junction point
            setTimeout(() => {
              const previousBlockElement = document.getElementById(previousBlock.id);
              const editableElement = previousBlockElement?.querySelector('[contenteditable="true"]') as HTMLElement;
              if (editableElement) {
                editableElement.focus();
                // Place cursor at the junction (end of original previous content)
                try {
                  const range = document.createRange();
                  const sel = window.getSelection();
                  if (prevContentLength > 0 && editableElement.childNodes.length >= prevContentLength) {
                    // Place cursor after the last node of the original previous content
                    const lastPrevNode = editableElement.childNodes[prevContentLength - 1];
                    if (lastPrevNode.nodeType === Node.TEXT_NODE) {
                      range.setStart(lastPrevNode, lastPrevNode.textContent?.length || 0);
                    } else {
                      range.setStartAfter(lastPrevNode);
                    }
                  } else {
                    range.selectNodeContents(editableElement);
                    range.collapse(false);
                  }
                  range.collapse(true);
                  sel?.removeAllRanges();
                  sel?.addRange(range);
                } catch {
                  // Fallback: place cursor at end
                  const range = document.createRange();
                  range.selectNodeContents(editableElement);
                  range.collapse(false);
                  const sel = window.getSelection();
                  sel?.removeAllRanges();
                  sel?.addRange(range);
                }
              }
              setFocusedBlockId(previousBlock.id);
            }, 0);
          } else {
            // Previous block is non-text, just delete current block
            removeBlock(id);
          }
        }
        // If it's the first block, allow normal backspace (don't prevent default)
      }

      // For all other cases (normal text deletion), don't prevent default
      // Let the browser handle normal backspace deletion
    }
  };

  const handleSlashSelect = (type: BlockType | string) => {
    if (slashMenuBlockId) {
      const currentBlock = blocks.find(b => b.id === slashMenuBlockId);
      let targetBlockId = slashMenuBlockId;

      // Non-text blocks (divider, image, video, file, table) should always insert a new block below
      // when using the + button, not convert themselves
      const nonTextBlockTypes = ["divider", "image", "video", "file", "table"];
      const isNonTextBlock = currentBlock && nonTextBlockTypes.includes(currentBlock.type);

      // If current block has content and we are not just changing its type (e.g. via slash command in empty block),
      // we should insert a NEW block below it.
      // However, the slash menu is usually triggered by "/" in an empty block or via "+" button.
      // If triggered via "+" button on a non-empty block, we should insert a new block.
      // If triggered via "/" in a block with content (e.g. "some text /"), we might want to split or just insert below.
      // For simplicity and Notion-like behavior:
      // 1. If block is empty text block, convert it.
      // 2. If block is not empty or is a non-text block, insert new block below.

      const isSlashCommand = currentBlock && currentBlock.content.startsWith("/");
      if (
        isNonTextBlock ||
        (currentBlock &&
          currentBlock.content.trim() !== "" &&
          !isSlashCommand)
      ) {
        // Insert new block below
        const newBlockId = addBlock(slashMenuBlockId);
        if (type === "code-block") {
          updateBlockType(newBlockId, "callout");
          updateBlockMetadata(newBlockId, { isCode: true });
        } else if (type === "todo") {
          updateBlockType(newBlockId, "todo");
          updateBlockMetadata(newBlockId, { checked: false });
        } else if (type === "math-block") {
          updateBlockType(newBlockId, "callout");
          updateBlockMetadata(newBlockId, { isMath: true });
        } else if (type === "diagram") {
          updateBlockType(newBlockId, "callout");
          updateBlockMetadata(newBlockId, { isDiagram: true, diagramType: "mermaid" });
        } else {
          updateBlockType(newBlockId, type as BlockType);
        }
        targetBlockId = newBlockId;
      } else {
        // Convert current block (only for empty text blocks)
        if (type === "code-block") {
          updateBlockType(slashMenuBlockId, "callout");
          updateBlockMetadata(slashMenuBlockId, { isCode: true });
        } else if (type === "todo") {
          updateBlockType(slashMenuBlockId, "todo");
          updateBlockMetadata(slashMenuBlockId, { checked: false });
        } else if (type === "math-block") {
          updateBlockType(slashMenuBlockId, "callout");
          updateBlockMetadata(slashMenuBlockId, { isMath: true });
        } else if (type === "diagram") {
          updateBlockType(slashMenuBlockId, "callout");
          updateBlockMetadata(slashMenuBlockId, { isDiagram: true, diagramType: "mermaid" });
        } else {
          updateBlockType(slashMenuBlockId, type as BlockType);
        }
        updateBlock(slashMenuBlockId, ""); // Clear the "/"
      }

      setSlashMenuPos(null);
      setSlashMenuBlockId(null);
      setSlashMenuFilter("");
      // Re-focus the target block
      setFocusedBlockId(targetBlockId);
    }
  };

  // Helper function to apply formatting manually if execCommand fails
  const applyManualFormatting = (
    element: HTMLElement,
    format: string,
    selection: Selection | null
  ) => {
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    if (range.collapsed) return;

    try {
      const tagMap: Record<string, string> = {
        bold: "strong",
        italic: "em",
        underline: "u",
        strikeThrough: "s",
      };

      const tag = tagMap[format];
      if (!tag) return;

      // Check if selection is already formatted
      let parent = range.commonAncestorContainer;
      if (parent.nodeType !== Node.ELEMENT_NODE) {
        parent = parent.parentElement!;
      }

      // Check if already wrapped in the formatting tag
      const existingTag = (parent as HTMLElement).closest(tag);
      if (existingTag) {
        // Remove formatting
        const contents = existingTag.innerHTML;
        const textNode = document.createTextNode(existingTag.textContent || "");
        existingTag.parentNode?.replaceChild(textNode, existingTag);
        // Note: Formatting removal also persists in DOM, no need to update block content
        return;
      }

      // Apply formatting
      const wrapper = document.createElement(tag);
      try {
        wrapper.appendChild(range.extractContents());
        range.insertNode(wrapper);

        // Note: We don't update block content here because formatting is HTML
        // and block content is plain text. Formatting persists in DOM.
      } catch (error) {
        console.error("Failed to apply formatting:", error);
      }
    } catch (error) {
      console.error("Formatting error:", error);
    }
  };

  const handleFormat = (format: string, value?: string) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      // For block-level operations, we can still proceed
      if (["align", "fontSize", "h1", "h2", "h3", "p", "bullet", "number"].includes(format)) {
        // These can work without selection
      } else {
        toast.error("Please select text to format");
        return;
      }
    }

    // Handle link creation
    if (format === "link") {
      if (!selection || selection.rangeCount === 0) {
        toast.error("Please select text to create a link");
        return;
      }

      const range = selection.getRangeAt(0);
      if (range.collapsed) {
        toast.error("Please select text to create a link");
        return;
      }

      // Save the selection before opening the dialog
      savedLinkSelectionRef.current = range.cloneRange();

      setLinkAction("create");
      setLinkUrl("");
      setLinkDialogOpen(true);
      return;
    }

    // Handle link editing
    if (format === "editLink") {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);
      const commonAncestor = range.commonAncestorContainer;
      let linkElement: HTMLAnchorElement | null = null;

      if (commonAncestor.nodeType === Node.TEXT_NODE) {
        linkElement = (commonAncestor.parentElement?.closest("a") as HTMLAnchorElement) || null;
      } else if (commonAncestor.nodeType === Node.ELEMENT_NODE) {
        linkElement = (commonAncestor as HTMLElement).closest("a") as HTMLAnchorElement;
      }

      if (linkElement) {
        setLinkAction("edit");
        setLinkUrl(linkElement.href);
        setLinkDialogOpen(true);
      }
      return;
    }

    // Handle unlink
    if (format === "unlink") {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);
      const commonAncestor = range.commonAncestorContainer;
      let linkElement: HTMLAnchorElement | null = null;

      if (commonAncestor.nodeType === Node.TEXT_NODE) {
        linkElement = (commonAncestor.parentElement?.closest("a") as HTMLAnchorElement) || null;
      } else if (commonAncestor.nodeType === Node.ELEMENT_NODE) {
        linkElement = (commonAncestor as HTMLElement).closest("a") as HTMLAnchorElement;
      }

      if (linkElement) {
        try {
          // Replace link with its text content
          const textNode = document.createTextNode(linkElement.textContent || "");
          linkElement.parentNode?.replaceChild(textNode, linkElement);

          // Update block content
          if (focusedBlockId) {
            const element = document
              .getElementById(focusedBlockId)
              ?.querySelector('[contenteditable="true"]') as HTMLElement;
            if (element) {
              updateBlock(focusedBlockId, element.innerText || "");
            }
          }

          toast.success("Link removed");
        } catch (error) {
          toast.error("Failed to remove link");
        }
      }
      return;
    }

    // Handle open link
    if (format === "openLink") {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);
      const commonAncestor = range.commonAncestorContainer;
      let linkElement: HTMLAnchorElement | null = null;

      if (commonAncestor.nodeType === Node.TEXT_NODE) {
        linkElement = (commonAncestor.parentElement?.closest("a") as HTMLAnchorElement) || null;
      } else if (commonAncestor.nodeType === Node.ELEMENT_NODE) {
        linkElement = (commonAncestor as HTMLElement).closest("a") as HTMLAnchorElement;
      }

      if (linkElement && linkElement.href) {
        window.open(linkElement.href, "_blank", "noopener,noreferrer");
      }
      return;
    }

    // Handle alignment
    if (format === "align") {
      if (focusedBlockId && value) {
        setBlocks(prev =>
          prev.map(b => {
            if (b.id === focusedBlockId) {
              return { ...b, props: { ...b.props, textAlign: value } };
            }
            return b;
          })
        );
      }
      return;
    }

    // Handle font size
    if (format === "fontSize") {
      if (focusedBlockId && value) {
        setBlocks(prev =>
          prev.map(b => {
            if (b.id === focusedBlockId) {
              const currentSize = b.props?.fontSize || "default";
              let newSize = currentSize;

              // Simple size steps: small -> default -> large -> x-large
              const sizes = ["small", "default", "large", "x-large"];
              const currentIndex =
                sizes.indexOf(currentSize) !== -1
                  ? sizes.indexOf(currentSize)
                  : 1;

              if (value === "increase" && currentIndex < sizes.length - 1) {
                newSize = sizes[currentIndex + 1];
              } else if (value === "decrease" && currentIndex > 0) {
                newSize = sizes[currentIndex - 1];
              }

              return { ...b, props: { ...b.props, fontSize: newSize } };
            }
            return b;
          })
        );
      }
      return;
    }

    // Handle block type conversions from toolbar
    if (["h1", "h2", "h3", "p", "bullet", "number", "quote", "callout", "todo"].includes(format)) {
      if (focusedBlockId) {
        let type: BlockType = "text";
        if (format === "h1") type = "heading-1";
        if (format === "h2") type = "heading-2";
        if (format === "h3") type = "heading-3";
        if (format === "bullet") type = "bullet-list";
        if (format === "number") type = "numbered-list";
        if (format === "quote") type = "quote";
        if (format === "callout") type = "callout";
        if (format === "todo") type = "todo";

        updateBlockType(focusedBlockId, type);
        if (format === "todo") {
          updateBlockMetadata(focusedBlockId, { checked: false });
        }
      }
      return;
    }

    // Handle text color
    if (format === "textColor") {
      if (focusedBlockId && value) {
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
          const range = sel.getRangeAt(0);
          if (!range.collapsed) {
            if (value === "remove") {
              // Remove color - find and unwrap span with color
              let parent = range.commonAncestorContainer;
              if (parent.nodeType !== Node.ELEMENT_NODE) parent = parent.parentElement!;
              const existing = (parent as HTMLElement).closest('span[data-text-color]');
              if (existing) {
                const textNode = document.createTextNode(existing.textContent || "");
                existing.parentNode?.replaceChild(textNode, existing);
              }
            } else {
              // Wrap in colored span
              const wrapper = document.createElement("span");
              wrapper.style.color = value;
              wrapper.setAttribute("data-text-color", value);
              wrapper.appendChild(range.extractContents());
              range.insertNode(wrapper);
            }
          }
        }
      }
      return;
    }

    // Handle inline formatting (bold, italic, underline, strikethrough, inlineCode, highlight)
    if (["bold", "italic", "underline", "strikeThrough", "inlineCode", "highlight"].includes(format)) {
      // Find the focused block's contentEditable element
      if (!focusedBlockId) {
        toast.error("Please focus a block to format text");
        return;
      }

      // Try to find the actual contentEditable element from the current selection first
      // This handles table cells and other nested contentEditable elements
      let element: HTMLElement | null = null;
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const node = sel.getRangeAt(0).commonAncestorContainer;
        const editableNode = node.nodeType === Node.ELEMENT_NODE
          ? (node as HTMLElement).closest('[contenteditable="true"]')
          : node.parentElement?.closest('[contenteditable="true"]');
        if (editableNode) element = editableNode as HTMLElement;
      }

      // Fallback to block-level lookup
      if (!element) {
        element = document
          .getElementById(focusedBlockId)
          ?.querySelector('[contenteditable="true"]') as HTMLElement;
      }

      if (!element) {
        toast.error("Cannot find editable content");
        return;
      }

      // Focus the element first to ensure we can work with it
      element.focus();

      // Get current selection
      const currentSelection = window.getSelection();
      let range: Range | null = null;

      // Check if we have a valid selection within the element
      if (currentSelection && currentSelection.rangeCount > 0) {
        range = currentSelection.getRangeAt(0);

        // Check if selection is within the focused element
        if (!element.contains(range.commonAncestorContainer)) {
          // Selection is outside this element, try to find selection within element
          // or create a new range at cursor position
          range = null;
        } else if (range.collapsed) {
          // Collapsed selection (cursor only) - for inline formatting, we need text selected
          // But execCommand can still work for toggling format at cursor position
          // So we'll allow it
        }
      }

      // If no valid selection, try to preserve cursor position or use element's selection
      if (!range) {
        // Try to get selection from the element itself
        const elementSelection = window.getSelection();
        if (elementSelection && elementSelection.rangeCount > 0) {
          range = elementSelection.getRangeAt(0);
          if (!element.contains(range.commonAncestorContainer)) {
            // Create range at end of element
            range = document.createRange();
            range.selectNodeContents(element);
            range.collapse(false);
            elementSelection.removeAllRanges();
            elementSelection.addRange(range);
          }
        } else {
          // No selection at all, create one at end
          range = document.createRange();
          range.selectNodeContents(element);
          range.collapse(false);
          const sel = window.getSelection();
          sel?.removeAllRanges();
          sel?.addRange(range);
        }
      }

      // Apply formatting using execCommand (still widely supported for contentEditable)
      try {
        // inlineCode and highlight don't have execCommand equivalents — use manual wrapping
        if (format === "inlineCode") {
          if (range && !range.collapsed) {
            let parent = range.commonAncestorContainer;
            if (parent.nodeType !== Node.ELEMENT_NODE) parent = parent.parentElement!;
            const existing = (parent as HTMLElement).closest("code");
            if (existing) {
              const textNode = document.createTextNode(existing.textContent || "");
              existing.parentNode?.replaceChild(textNode, existing);
            } else {
              const wrapper = document.createElement("code");
              wrapper.appendChild(range.extractContents());
              range.insertNode(wrapper);
            }
          }
          return;
        }
        if (format === "highlight") {
          if (range && !range.collapsed) {
            const colorMap: Record<string, string> = {
              yellow: "#fef08a", green: "#bbf7d0", blue: "#bfdbfe",
              pink: "#fbcfe8", purple: "#ddd6fe", orange: "#fed7aa",
              red: "#fecaca", gray: "#e5e7eb",
            };
            let parent = range.commonAncestorContainer;
            if (parent.nodeType !== Node.ELEMENT_NODE) parent = parent.parentElement!;
            const existing = (parent as HTMLElement).closest("mark");
            if (value === "remove" && existing) {
              // Remove highlight
              const textNode = document.createTextNode(existing.textContent || "");
              existing.parentNode?.replaceChild(textNode, existing);
            } else if (existing && value && value !== "remove") {
              // Change color of existing highlight
              existing.style.backgroundColor = colorMap[value] || colorMap.yellow;
            } else if (!existing && value !== "remove") {
              // Wrap selection with colored mark
              const wrapper = document.createElement("mark");
              wrapper.style.backgroundColor = colorMap[value || "yellow"] || colorMap.yellow;
              wrapper.style.borderRadius = "2px";
              wrapper.style.padding = "0 2px";
              wrapper.appendChild(range.extractContents());
              range.insertNode(wrapper);
            }
          }
          return;
        }

        // Map format names to execCommand names
        const commandMap: Record<string, string> = {
          bold: "bold",
          italic: "italic",
          underline: "underline",
          strikeThrough: "strikeThrough",
        };

        const command = commandMap[format];
        if (command) {
          // Use execCommand - it handles both applying and removing formatting
          const success = document.execCommand(command, false, undefined);

          if (!success) {
            // Fallback: manual formatting (only if we have a non-collapsed selection)
            if (range && !range.collapsed) {
              applyManualFormatting(element, format, currentSelection);
            }
          }
        }
      } catch (error) {
        // Fallback to manual formatting if we have a selection
        if (range && !range.collapsed && currentSelection) {
          applyManualFormatting(element, format, currentSelection);
        }
      }
      return;
    }
  };

  const handleExportMarkdown = () => {
    const markdown = blocksToMarkdown(blocks);
    if (onExportMarkdown) {
      onExportMarkdown(markdown);
    } else {
      // Default behavior: download file
      const blob = new Blob([markdown], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "document.md";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Exported to Markdown");
    }
  };

  const handleExportHtml = () => {
    const html = blocksToHtml(blocks);
    if (onExportHtml) {
      onExportHtml(html);
    } else {
      // Default behavior: download file
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "document.html";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Exported to HTML");
    }
  };

  const handleImportMarkdown = (content: string) => {
    const newBlocks = markdownToBlocks(content);
    setBlocks(newBlocks);
    if (onImportMarkdown) {
      onImportMarkdown(content);
    } else {
      toast.success("Imported Markdown");
    }
  };

  // Handle multi-line paste: parse markdown and insert as separate blocks
  const handlePasteBlocks = (blockId: string, markdown: string) => {
    const pastedBlocks = markdownToBlocks(markdown);
    if (pastedBlocks.length === 0) return;

    setBlocks(prev => {
      const index = prev.findIndex(b => b.id === blockId);
      if (index === -1) return prev;

      const currentBlock = prev[index];
      const newBlocks = [...prev];

      // If current block is empty, replace it with the first pasted block
      if (currentBlock.content.trim() === "" && currentBlock.type === "text") {
        newBlocks.splice(index, 1, ...pastedBlocks);
      } else {
        // Insert pasted blocks after the current block
        newBlocks.splice(index + 1, 0, ...pastedBlocks);
      }

      return newBlocks;
    });

    // Focus the last pasted block
    const lastPasted = pastedBlocks[pastedBlocks.length - 1];
    setTimeout(() => {
      setFocusedBlockId(lastPasted.id);
    }, 0);
  };

  const handleClearAll = () => {
    setClearAllDialogOpen(true);
  };

  const confirmClearAll = () => {
    setBlocks([createBlock("text", "")]);
    setClearAllDialogOpen(false);
    toast.success("All content cleared");
  };

  const handleLinkSave = () => {
    if (!linkUrl.trim()) {
      toast.error("Please enter a URL");
      return;
    }

    // Restore saved selection if available, otherwise try to get current selection
    let range: Range | null = null;
    const selection = window.getSelection();

    if (savedLinkSelectionRef.current) {
      // Restore the saved selection
      range = savedLinkSelectionRef.current.cloneRange();
      if (selection) {
        selection.removeAllRanges();
        try {
          selection.addRange(range);
        } catch (e) {
          // Selection might be invalid, try to use it directly
          range = savedLinkSelectionRef.current;
        }
      }
    } else if (selection && selection.rangeCount > 0) {
      // Fallback to current selection
      range = selection.getRangeAt(0);
    }

    if (!range) {
      toast.error("Please select text");
      return;
    }

    // Ensure URL has protocol
    const fullUrl = linkUrl.startsWith("http://") || linkUrl.startsWith("https://")
      ? linkUrl
      : `https://${linkUrl}`;

    try {
      if (linkAction === "edit") {
        // Find and update existing link
        const commonAncestor = range.commonAncestorContainer;
        let linkElement: HTMLAnchorElement | null = null;

        if (commonAncestor.nodeType === Node.TEXT_NODE) {
          linkElement = (commonAncestor.parentElement?.closest("a") as HTMLAnchorElement) || null;
        } else if (commonAncestor.nodeType === Node.ELEMENT_NODE) {
          linkElement = (commonAncestor as HTMLElement).closest("a") as HTMLAnchorElement;
        }

        if (linkElement) {
          linkElement.href = fullUrl;
          toast.success("Link updated");
        }
      } else {
        // Create new link
        if (range.collapsed) {
          toast.error("Please select text to create a link");
          return;
        }

        // Ensure we're working with the correct element
        if (!focusedBlockId) {
          toast.error("Please focus a block to create a link");
          return;
        }

        const element = document
          .getElementById(focusedBlockId)
          ?.querySelector('[contenteditable="true"]') as HTMLElement;

        if (!element) {
          toast.error("Cannot find editable content");
          return;
        }

        // Focus the element first
        element.focus();

        // Verify the range is within the element
        if (!element.contains(range.commonAncestorContainer)) {
          // Range is outside, try to get selection within element
          const currentSelection = window.getSelection();
          if (currentSelection && currentSelection.rangeCount > 0) {
            const currentRange = currentSelection.getRangeAt(0);
            if (element.contains(currentRange.commonAncestorContainer) && !currentRange.collapsed) {
              range = currentRange;
            } else {
              toast.error("Please select text within the block");
              return;
            }
          } else {
            toast.error("Please select text to create a link");
            return;
          }
        }

        const link = document.createElement("a");
        link.href = fullUrl;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.className = "text-blue-600 dark:text-blue-400 no-underline cursor-pointer";

        // Extract the selected content and wrap it in the link
        const selectedContent = range.extractContents();
        link.appendChild(selectedContent);
        range.insertNode(link);

        // Collapse selection to the end of the link
        range.setStartAfter(link);
        range.collapse(true);
        const sel = window.getSelection();
        if (sel) {
          sel.removeAllRanges();
          sel.addRange(range);
        }

        // Update block content to preserve the link HTML
        // We use innerHTML to preserve links, but store as innerText for state
        // The HTML will be preserved in the DOM
        updateBlock(focusedBlockId, element.innerText || "");

        toast.success("Link created");
      }

      // Don't update block content immediately - let the DOM keep the HTML structure
      // The block content will be updated on the next input event, preserving links

      // Clear saved selection
      savedLinkSelectionRef.current = null;

      setLinkDialogOpen(false);
      setLinkUrl("");
    } catch (error) {
      toast.error("Failed to save link");
      savedLinkSelectionRef.current = null;
    }
  };

  // ── Drag-drop image upload ──────────────────────────────────────────────
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(f => f.type.startsWith("image/"));

    if (imageFiles.length === 0) return;

    imageFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const imgBlock = createBlock("image", dataUrl);
        imgBlock.metadata = { caption: file.name, fileName: file.name };

        setBlocks(prev => {
          // Insert after focused block or at end
          if (focusedBlockId) {
            const idx = prev.findIndex(b => b.id === focusedBlockId);
            if (idx !== -1) {
              const newBlocks = [...prev];
              newBlocks.splice(idx + 1, 0, imgBlock);
              return newBlocks;
            }
          }
          return [...prev, imgBlock];
        });

        setTimeout(() => setFocusedBlockId(imgBlock.id), 0);
        toast.success(`Image "${file.name}" added`);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes("Files")) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  return (
    <div
      className={`relative h-screen w-full bg-background flex flex-col overflow-hidden ${className || ""}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {/* Drag overlay */}
      {isDragOver && (
        <div className="absolute inset-0 z-[100] bg-primary/10 border-2 border-dashed border-primary/50 flex items-center justify-center pointer-events-none">
          <div className="bg-popover rounded-lg shadow-xl px-6 py-4 text-center">
            <div className="text-2xl mb-2">Drop images here</div>
            <div className="text-sm text-muted-foreground">Images will be added to the editor</div>
          </div>
        </div>
      )}

      {/* Auto-save status indicator */}
      {useLocalStorage && (
        <div className="fixed bottom-4 right-4 z-40 text-xs text-muted-foreground bg-popover/90 backdrop-blur-sm px-3 py-1.5 rounded-full border shadow-sm flex items-center gap-1.5">
          {saveStatus === "saved" && (
            <><span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> Saved</>
          )}
          {saveStatus === "saving" && (
            <><span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse inline-block" /> Saving...</>
          )}
          {saveStatus === "unsaved" && (
            <><span className="w-2 h-2 rounded-full bg-orange-500 inline-block" /> Unsaved</>
          )}
        </div>
      )}

      {/* Page Menu - Fixed position so it's always visible */}
      {showPageMenu && !readOnly && (
        <div className="fixed top-6 right-6 z-50">
          <PageMenu
            onImportMarkdown={handleImportMarkdown}
            onTogglePreview={() => setIsPreviewMode(!isPreviewMode)}
            isPreviewMode={isPreviewMode}
            onClearAll={handleClearAll}
            onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
            isDarkMode={isDarkMode}
            onToggleFocusMode={() => setIsFocusMode(!isFocusMode)}
            isFocusMode={isFocusMode}
          />
        </div>
      )}

      <div
        className="flex-1 overflow-y-scroll overflow-x-hidden scrollbar-hide"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          scrollBehavior: 'smooth'
        }}
      >
        <style>{`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>
        <div className="w-full min-h-full px-6 sm:px-12 md:px-16 lg:px-24">
          <div className="w-full max-w-[1800px] mx-auto editor-container relative">
            {/* Left gutter for block controls - more elegant positioning */}
            <div className="absolute left-0 top-0 bottom-0 w-20 sm:w-24 md:w-28 pointer-events-none" />

            {/* Content area - full width typing space with margins */}
            <div className="pl-20 sm:pl-24 md:pl-28 pr-12 sm:pr-16 md:pr-20 lg:pr-24 pt-16 pb-40 w-full">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={blocks.map(b => b.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {blocks.map((block, index) => (
                    <BlockComponent
                      key={block.id}
                      block={block}
                      blockIndex={index}
                      allBlocks={blocks}
                      updateBlock={updateBlock}
                      updateBlockType={updateBlockType}
                      updateBlockMetadata={updateBlockMetadata}
                      updateBlockProps={updateBlockProps}
                      onKeyDown={handleKeyDown}
                      onFocus={setFocusedBlockId}
                      isFocused={focusedBlockId === block.id}
                      isSelected={selectedBlockIds.has(block.id)}
                      onDelete={removeBlock}
                      onDuplicate={duplicateBlock}
                      onAddBlock={handleAddClick}
                      onPasteBlocks={handlePasteBlocks}
                      readOnly={isPreviewMode}
                    />
                  ))}
                </SortableContext>
              </DndContext>


              {/* Empty state click area to append at bottom */}
              {!isPreviewMode && (
                <div
                  className="h-[50vh] cursor-text"
                  onClick={() => {
                    if (blocks.length > 0) {
                      // If last block is empty, focus it, else add new
                      const lastBlock = blocks[blocks.length - 1];
                      if (lastBlock.content === "") {
                        setFocusedBlockId(lastBlock.id);
                      } else {
                        addBlock(lastBlock.id);
                      }
                    } else {
                      // Should not happen with initialBlocks, but safe fallback
                      const newBlock = createBlock();
                      setBlocks([newBlock]);
                      setFocusedBlockId(newBlock.id);
                    }
                  }}
                />
              )}
            </div>
          </div>
        </div>

        {!isPreviewMode && (
          <>
            <SlashMenu
              position={slashMenuPos}
              filter={slashMenuFilter}
              onSelect={handleSlashSelect}
              onClose={() => {
                setSlashMenuPos(null);
                setSlashMenuBlockId(null);
                setSlashMenuFilter("");
              }}
            />

            <FloatingToolbar
              anchorRect={selectionRect}
              onFormat={handleFormat}
            />

            <EmojiPicker
              query={emojiQuery}
              position={emojiPos}
              onSelect={(emoji, name) => {
                // Replace :query with the emoji in the DOM
                const sel = window.getSelection();
                if (sel && sel.rangeCount > 0 && emojiBlockId) {
                  const range = sel.getRangeAt(0);
                  const node = range.startContainer;
                  if (node.nodeType === Node.TEXT_NODE) {
                    const text = node.textContent || "";
                    const cursorPos = range.startOffset;
                    // Find the ":" before cursor
                    const colonIdx = text.lastIndexOf(":", cursorPos - 1);
                    if (colonIdx >= 0) {
                      node.textContent = text.substring(0, colonIdx) + emoji + text.substring(cursorPos);
                      // Set cursor after emoji
                      const newRange = document.createRange();
                      newRange.setStart(node, colonIdx + emoji.length);
                      newRange.collapse(true);
                      sel.removeAllRanges();
                      sel.addRange(newRange);
                      // Update block content
                      const editableEl = node.parentElement?.closest('[contenteditable="true"]') as HTMLElement;
                      if (editableEl) {
                        updateBlock(emojiBlockId, editableEl.innerText || "");
                      }
                    }
                  }
                }
                setEmojiPos(null);
                setEmojiQuery("");
                setEmojiBlockId(null);
              }}
              onClose={() => {
                setEmojiPos(null);
                setEmojiQuery("");
                setEmojiBlockId(null);
              }}
            />
          </>
        )}
      </div>

      {/* Clear All Confirmation Dialog */}
      <AlertDialog open={clearAllDialogOpen} onOpenChange={setClearAllDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear all content?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete all blocks and cannot be undone. Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmClearAll} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Clear All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Link Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {linkAction === "edit" ? "Edit Link" : "Create Link"}
            </DialogTitle>
            <DialogDescription>
              {linkAction === "edit"
                ? "Update the URL for this link."
                : "Enter the URL you want to link to."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="link-url" className="text-sm font-medium">
                URL
              </label>
              <Input
                id="link-url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleLinkSave();
                  }
                }}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                savedLinkSelectionRef.current = null;
                setLinkDialogOpen(false);
                setLinkUrl("");
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleLinkSave}>
              {linkAction === "edit" ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
