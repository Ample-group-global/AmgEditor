import { BlockType } from "@/lib/editor-types";
import { cn } from "@/lib/utils";
import {
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Type,
  Minus,
  Image,
  Video,
  File,
  Table,
  Layout,
  Code,
  Sigma,
  GitBranch,
  TableOfContents,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface SlashMenuProps {
  position: { top: number; left: number } | null;
  filter?: string;
  onSelect: (type: BlockType | string) => void;
  onClose: () => void;
}

type MenuItem = {
  type: BlockType | string;
  label: string;
  icon: React.ReactNode;
  desc: string;
  shortcut?: string;
};

type MenuCategory = {
  title: string;
  items: MenuItem[];
};

const MENU_CATEGORIES: MenuCategory[] = [
  {
    title: "Basic blocks",
    items: [
      {
        type: "text",
        label: "Text",
        icon: <Type className="h-4 w-4" />,
        desc: "Just start writing with plain text.",
      },
      {
        type: "heading-1",
        label: "Heading 1",
        icon: <Heading1 className="h-4 w-4" />,
        desc: "Big section heading.",
        shortcut: "#",
      },
      {
        type: "heading-2",
        label: "Heading 2",
        icon: <Heading2 className="h-4 w-4" />,
        desc: "Medium section heading.",
        shortcut: "##",
      },
      {
        type: "heading-3",
        label: "Heading 3",
        icon: <Heading3 className="h-4 w-4" />,
        desc: "Small section heading.",
        shortcut: "###",
      },
      {
        type: "bullet-list",
        label: "Bullet List",
        icon: <List className="h-4 w-4" />,
        desc: "Create a simple bulleted list.",
        shortcut: "-",
      },
      {
        type: "numbered-list",
        label: "Numbered List",
        icon: <ListOrdered className="h-4 w-4" />,
        desc: "Create a list with numbering.",
        shortcut: "1.",
      },
      {
        type: "todo",
        label: "To-do List",
        icon: <CheckSquare className="h-4 w-4" />,
        desc: "Track tasks with a to-do list.",
        shortcut: "- [ ]",
      },
      {
        type: "callout",
        label: "Callout",
        icon: <Layout className="h-4 w-4" />,
        desc: "Make writing stand out.",
      },
      {
        type: "code-block",
        label: "Code",
        icon: <Code className="h-4 w-4" />,
        desc: "Capture a code snippet.",
        shortcut: "```",
      },
      {
        type: "quote",
        label: "Quote",
        icon: <Quote className="h-4 w-4" />,
        desc: "Capture a quote.",
        shortcut: ">",
      },
      {
        type: "divider",
        label: "Divider",
        icon: <Minus className="h-4 w-4" />,
        desc: "Visually divide blocks.",
        shortcut: "---",
      },
      {
        type: "math-block",
        label: "Math Equation",
        icon: <Sigma className="h-4 w-4" />,
        desc: "Write LaTeX math formulas.",
        shortcut: "$$",
      },
      {
        type: "diagram",
        label: "Diagram",
        icon: <GitBranch className="h-4 w-4" />,
        desc: "Create Mermaid diagrams (UML, flowchart, sequence).",
      },
      {
        type: "table",
        label: "Table",
        icon: <Table className="h-4 w-4" />,
        desc: "Add a table with rows and columns.",
      },
      {
        type: "toc",
        label: "Table of Contents",
        icon: <TableOfContents className="h-4 w-4" />,
        desc: "Auto-generated from headings.",
        shortcut: "[TOC]",
      },
    ],
  },
  {
    title: "Media",
    items: [
      {
        type: "image",
        label: "Image",
        icon: <Image className="h-4 w-4" />,
        desc: "Upload or embed with a link.",
      },
      {
        type: "video",
        label: "Video",
        icon: <Video className="h-4 w-4" />,
        desc: "Embed from YouTube, Vimeo...",
      },
      {
        type: "file",
        label: "File",
        icon: <File className="h-4 w-4" />,
        desc: "Upload or embed with a link.",
      },
    ],
  },
];

// Flatten items for keyboard navigation
const ALL_ITEMS = MENU_CATEGORIES.flatMap(cat => cat.items);

export function SlashMenu({ position, filter = "", onSelect, onClose }: SlashMenuProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  // Filter items based on search query
  const filteredItems = filter
    ? ALL_ITEMS.filter(item =>
        item.label.toLowerCase().includes(filter) ||
        item.desc.toLowerCase().includes(filter) ||
        item.type.toLowerCase().includes(filter) ||
        (item.shortcut && item.shortcut.toLowerCase().includes(filter))
      )
    : ALL_ITEMS;

  // Filter categories to only show ones with matching items
  const filteredCategories = filter
    ? MENU_CATEGORIES.map(cat => ({
        ...cat,
        items: cat.items.filter(item =>
          item.label.toLowerCase().includes(filter) ||
          item.desc.toLowerCase().includes(filter) ||
          item.type.toLowerCase().includes(filter) ||
          (item.shortcut && item.shortcut.toLowerCase().includes(filter))
        ),
      })).filter(cat => cat.items.length > 0)
    : MENU_CATEGORIES;

  // Reset selection when filter changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [filter]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!position) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % (filteredItems.length || 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(
          prev => (prev - 1 + filteredItems.length) % (filteredItems.length || 1)
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredItems.length > 0) {
          const selectedItem = filteredItems[selectedIndex];
          onSelect(selectedItem.type as BlockType);
        }
      } else if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [position, selectedIndex, filteredItems, onSelect, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    if (menuRef.current && position) {
      const selectedElement = menuRef.current.querySelector(
        `[data-index="${selectedIndex}"]`
      ) as HTMLElement;
      if (selectedElement) {
        const container = menuRef.current.querySelector('.overflow-y-auto') || menuRef.current;
        const containerRect = container.getBoundingClientRect();
        const elementRect = selectedElement.getBoundingClientRect();

        // Check if element is outside visible area
        if (elementRect.top < containerRect.top) {
          selectedElement.scrollIntoView({ block: "start", behavior: "smooth" });
        } else if (elementRect.bottom > containerRect.bottom) {
          selectedElement.scrollIntoView({ block: "end", behavior: "smooth" });
        }
      }
    }
  }, [selectedIndex, position]);

  if (!position) return null;

  // Calculate position to keep menu within viewport
  const menuWidth = 380; // Increased width for better readability
  const menuMaxHeight = typeof window !== 'undefined' ? window.innerHeight * 0.6 : 400; // 60vh (smaller height)
  const padding = 10; // Padding from viewport edges

  let top = position.top;
  let left = position.left;

  // Adjust position only if window is available (client-side)
  if (typeof window !== 'undefined') {
    // Adjust horizontal position if menu would go off-screen right
    if (left + menuWidth > window.innerWidth - padding) {
      left = window.innerWidth - menuWidth - padding;
    }

    // Adjust horizontal position if menu would go off-screen left
    if (left < padding) {
      left = padding;
    }

    // Adjust vertical position if menu would go off-screen bottom
    if (top + menuMaxHeight > window.innerHeight - padding) {
      // Position above the cursor instead
      top = Math.max(padding, position.top - menuMaxHeight - 10);
    }

    // Ensure menu doesn't go off-screen top
    if (top < padding) {
      top = padding;
    }
  }

  let globalIndex = 0;

  return (
    <div
      ref={menuRef}
      className="fixed z-50 w-[380px] bg-popover rounded-lg border shadow-xl animate-in fade-in zoom-in-120 duration-100 slash-menu-container"
      style={{
        top: `${top}px`,
        left: `${left}px`,
        maxHeight: `${menuMaxHeight}px`,
      }}
      onMouseDown={e => e.preventDefault()} // Prevent focus loss from editor
    >
      {filter && (
        <div className="px-3 py-1.5 border-b border-border/50 text-xs text-muted-foreground">
          Filtering: <span className="font-mono font-medium text-foreground">/{filter}</span>
        </div>
      )}
      <div className="p-1.5 space-y-1 overflow-y-auto" style={{ maxHeight: `${menuMaxHeight - (filter ? 30 : 0)}px`, scrollbarWidth: 'thin' }}>
        {filteredCategories.length === 0 && (
          <div className="px-3 py-4 text-sm text-muted-foreground text-center">
            No matching blocks found
          </div>
        )}
        {filteredCategories.map((category, catIndex) => (
          <div key={category.title}>
            <div className="text-[10px] font-medium text-muted-foreground px-2 py-1 mt-2 first:mt-0 uppercase tracking-wider">
              {category.title}
            </div>
            {category.items.map(item => {
              const currentIndex = globalIndex++;
              const isSelected = currentIndex === selectedIndex;

              return (
                <div
                  key={item.type}
                  data-index={currentIndex}
                  className={cn(
                    "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer text-sm group transition-colors",
                    isSelected
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-accent hover:text-accent-foreground"
                  )}
                  onClick={() => onSelect(item.type as BlockType)}
                  onMouseEnter={() => setSelectedIndex(currentIndex)}
                >
                  <div className="flex items-center justify-center h-8 w-8 rounded border bg-background shadow-sm text-foreground/80 relative shrink-0">
                    {item.icon}
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="font-medium text-sm">{item.label}</span>
                    <span className="text-xs text-muted-foreground line-clamp-1">
                      {item.desc}
                    </span>
                  </div>
                  {item.shortcut && (
                    <span className="text-xs text-muted-foreground/50 font-mono">
                      {item.shortcut}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
