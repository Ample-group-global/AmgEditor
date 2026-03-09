import React from "react";
import { BlockType } from "@/lib/editor-types";
import {
  ArrowRight,
  Copy,
  GripVertical,
  RefreshCw,
  Sparkles,
  Trash2,
  Type,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

interface BlockMenuProps {
  blockId: string;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onTransform: (id: string, type: BlockType) => void;
  dragAttributes?: React.HTMLAttributes<HTMLElement>;
  dragListeners?: any;
}

export function BlockMenu({
  blockId,
  onDelete,
  onDuplicate,
  onTransform,
  dragAttributes,
  dragListeners,
}: BlockMenuProps) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const dragStartRef = React.useRef<{ x: number; y: number; time: number } | null>(null);
  const wasDraggingRef = React.useRef(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  // Combine our handlers with drag listeners
  const handlePointerDown = (e: React.PointerEvent) => {
    dragStartRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
    wasDraggingRef.current = false;
    // Call drag listener if it exists
    if (dragListeners?.onPointerDown) {
      dragListeners.onPointerDown(e);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (dragStartRef.current) {
      const deltaX = Math.abs(e.clientX - dragStartRef.current.x);
      const deltaY = Math.abs(e.clientY - dragStartRef.current.y);
      if (deltaX > 3 || deltaY > 3) {
        wasDraggingRef.current = true;
      }
    }
    // Call drag listener if it exists
    if (dragListeners?.onPointerMove) {
      dragListeners.onPointerMove(e);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!dragStartRef.current) {
      // No drag start recorded, allow menu to open
      return;
    }
    
    const deltaX = Math.abs(e.clientX - dragStartRef.current.x);
    const deltaY = Math.abs(e.clientY - dragStartRef.current.y);
    const deltaTime = Date.now() - dragStartRef.current.time;
    
    // If it was a drag, prevent menu from opening
    if (wasDraggingRef.current || deltaX > 3 || deltaY > 3 || deltaTime > 200) {
      e.preventDefault();
      e.stopPropagation();
      setMenuOpen(false);
    } else {
      // It's a click, open menu
      setMenuOpen(true);
    }
    
    dragStartRef.current = null;
  };

  return (
    <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
      <div
        {...dragAttributes}
        className="p-1 hover:bg-accent/80 rounded-md text-muted-foreground/50 hover:text-foreground transition-all duration-150 shadow-sm hover:shadow-md border border-transparent hover:border-border"
      >
        <DropdownMenuTrigger asChild>
          <button
            ref={triggerRef}
            {...dragListeners}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onClick={handleClick}
            className="cursor-grab active:cursor-grabbing border-none bg-transparent p-0 outline-none"
            type="button"
          >
            <GripVertical className="h-6 w-6" />
          </button>
        </DropdownMenuTrigger>
      </div>
      <DropdownMenuContent align="start" className="w-64 p-1 max-h-[60vh] overflow-y-auto">
        <div className="px-2 py-1.5">
          <Input
            placeholder="Search actions..."
            className="h-8 text-xs bg-muted/50 border-transparent focus-visible:ring-0 focus-visible:bg-muted"
          />
        </div>

        <DropdownMenuItem
          onClick={() => onDelete(blockId)}
          className="text-sm px-2 py-1.5 cursor-pointer"
        >
          <Trash2 className="mr-2 h-4 w-4 text-muted-foreground" />
          <span>Delete</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => onDuplicate(blockId)}
          className="text-sm px-2 py-1.5 cursor-pointer"
        >
          <Copy className="mr-2 h-4 w-4 text-muted-foreground" />
          <span>Duplicate</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuLabel className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
          Turn into
        </DropdownMenuLabel>

        <DropdownMenuItem
          onClick={() => onTransform(blockId, "text")}
          className="text-sm px-2 py-1.5 cursor-pointer"
        >
          <Type className="mr-2 h-4 w-4 text-muted-foreground" />
          <span>Text</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => onTransform(blockId, "heading-1")}
          className="text-sm px-2 py-1.5 cursor-pointer"
        >
          <span className="mr-2 text-lg font-bold">H1</span>
          <span>Heading 1</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => onTransform(blockId, "heading-2")}
          className="text-sm px-2 py-1.5 cursor-pointer"
        >
          <span className="mr-2 text-base font-semibold">H2</span>
          <span>Heading 2</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => onTransform(blockId, "heading-3")}
          className="text-sm px-2 py-1.5 cursor-pointer"
        >
          <span className="mr-2 text-sm font-semibold">H3</span>
          <span>Heading 3</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => onTransform(blockId, "bullet-list")}
          className="text-sm px-2 py-1.5 cursor-pointer"
        >
          <span className="mr-2">•</span>
          <span>Bulleted List</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => onTransform(blockId, "numbered-list")}
          className="text-sm px-2 py-1.5 cursor-pointer"
        >
          <span className="mr-2">1.</span>
          <span>Numbered List</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => onTransform(blockId, "todo")}
          className="text-sm px-2 py-1.5 cursor-pointer"
        >
          <span className="mr-2">☐</span>
          <span>To-do List</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => onTransform(blockId, "quote")}
          className="text-sm px-2 py-1.5 cursor-pointer"
        >
          <span className="mr-2">"</span>
          <span>Quote</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => onTransform(blockId, "callout")}
          className="text-sm px-2 py-1.5 cursor-pointer"
        >
          <Sparkles className="mr-2 h-4 w-4 text-muted-foreground" />
          <span>Callout</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => onTransform(blockId, "divider")}
          className="text-sm px-2 py-1.5 cursor-pointer"
        >
          <span className="mr-2">—</span>
          <span>Divider</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => onTransform(blockId, "table")}
          className="text-sm px-2 py-1.5 cursor-pointer"
        >
          <span className="mr-2">⊞</span>
          <span>Table</span>
        </DropdownMenuItem>

      </DropdownMenuContent>
    </DropdownMenu>
  );
}
