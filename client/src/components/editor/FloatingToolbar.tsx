import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Link,
  ChevronDown,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  ExternalLink,
  Unlink,
  Code,
  Highlighter,
  Palette,
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { DropdownMenuLabel } from "@/components/ui/dropdown-menu";

interface FloatingToolbarProps {
  anchorRect: DOMRect | null;
  onFormat: (format: string, value?: string) => void;
}

export function FloatingToolbar({
  anchorRect,
  onFormat,
}: FloatingToolbarProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLinkSelected, setIsLinkSelected] = useState(false);
  const [linkUrl, setLinkUrl] = useState<string | null>(null);
  const savedSelectionRef = useRef<Range | null>(null);

  // Helper to check if selection is inside a link
  const checkLinkSelection = () => {
    // Use saved selection if available, otherwise use current selection
    let range: Range | null = savedSelectionRef.current;
    if (!range) {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) {
        setIsLinkSelected(false);
        setLinkUrl(null);
        return;
      }
      range = selection.getRangeAt(0);
    }

    const commonAncestor = range.commonAncestorContainer;
    
    // Check if the common ancestor or its parent is a link
    let linkElement: HTMLAnchorElement | null = null;
    if (commonAncestor.nodeType === Node.TEXT_NODE) {
      linkElement = (commonAncestor.parentElement?.closest("a") as HTMLAnchorElement) || null;
    } else if (commonAncestor.nodeType === Node.ELEMENT_NODE) {
      linkElement = (commonAncestor as HTMLElement).closest("a") as HTMLAnchorElement;
    }

    if (linkElement) {
      setIsLinkSelected(true);
      setLinkUrl(linkElement.href);
    } else {
      setIsLinkSelected(false);
      setLinkUrl(null);
    }
  };

  useEffect(() => {
    if (anchorRect) {
      setIsVisible(true);
      // Save current selection when toolbar appears
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        savedSelectionRef.current = selection.getRangeAt(0).cloneRange();
      }
      // Check if selection is inside a link
      checkLinkSelection();
    } else {
      setIsVisible(false);
      savedSelectionRef.current = null;
      setIsLinkSelected(false);
      setLinkUrl(null);
    }
  }, [anchorRect]);

  // Helper to restore selection before formatting
  const handleFormatClick = (format: string, value?: string) => {
    // Always try to restore selection before formatting
    const selection = window.getSelection();
    if (selection) {
      // First try saved selection
      if (savedSelectionRef.current) {
        try {
          selection.removeAllRanges();
          const restoredRange = savedSelectionRef.current.cloneRange();
          selection.addRange(restoredRange);
        } catch (e) {
          console.warn("Could not restore selection:", e);
          // Selection might be invalid, try current selection
          if (selection.rangeCount > 0) {
            savedSelectionRef.current = selection.getRangeAt(0).cloneRange();
          }
        }
      } else if (selection.rangeCount > 0) {
        // Save current selection if we don't have a saved one
        savedSelectionRef.current = selection.getRangeAt(0).cloneRange();
      }
    }
    
    // Small delay to ensure selection is restored before format is applied
    setTimeout(() => {
      onFormat(format, value);
    }, 0);
  };

  if (!isVisible || !anchorRect) return null;

  // Calculate position (centered above selection)
  // Use clientY from rect which is relative to viewport
  const toolbarHeight = 40; // Approximate toolbar height
  const toolbarWidth = 400; // Approximate toolbar width
  const padding = 10;
  
  let top = anchorRect.top - toolbarHeight - 8; // Position above selection
  let left = anchorRect.left + (anchorRect.width / 2) - (toolbarWidth / 2); // Center horizontally
  
  // Adjust position only if window is available (client-side)
  if (typeof window !== 'undefined') {
    // Adjust if toolbar would go off-screen right
    if (left + toolbarWidth > window.innerWidth - padding) {
      left = window.innerWidth - toolbarWidth - padding;
    }
    
    // Adjust if toolbar would go off-screen left
    if (left < padding) {
      left = padding;
    }
    
    // If toolbar would go off-screen top, position below selection instead
    if (top < padding) {
      top = anchorRect.bottom + 8;
      // If still off-screen bottom, position at top of viewport
      if (top + toolbarHeight > window.innerHeight - padding) {
        top = padding;
      }
    }
  }

  return (
    <div
      className="fixed z-50 flex items-center gap-0.5 rounded-lg border border-border bg-popover/95 backdrop-blur-sm p-1 shadow-xl animate-in fade-in zoom-in-95 duration-150 transition-all"
      style={{ 
        top: `${top}px`, 
        left: `${left}px`,
        pointerEvents: 'auto'
      }}
      onMouseDown={e => {
        e.preventDefault(); // Prevent losing focus
        e.stopPropagation(); // Stop event from bubbling
        // Save selection when toolbar is interacted with
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          savedSelectionRef.current = selection.getRangeAt(0).cloneRange();
        }
      }}
      onClick={e => {
        e.stopPropagation(); // Prevent clicks from affecting editor
      }}
      onMouseEnter={() => {
        // Save selection when mouse enters toolbar to ensure it's preserved
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
          try {
            savedSelectionRef.current = selection.getRangeAt(0).cloneRange();
          } catch (e) {
            // Ignore errors
          }
        }
      }}
    >

      {/* Text Type Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1 px-2 font-normal"
            onMouseDown={e => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <span className="text-xs">Text</span>
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="start"
          onCloseAutoFocus={e => e.preventDefault()}
        >
          <DropdownMenuItem onClick={() => handleFormatClick("p")}>
            Text
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleFormatClick("h1")}>
            Heading 1
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleFormatClick("h2")}>
            Heading 2
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleFormatClick("h3")}>
            Heading 3
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleFormatClick("bullet")}>
            Bulleted List
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleFormatClick("number")}>
            Numbered List
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleFormatClick("todo")}>
            To-do List
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleFormatClick("quote")}>
            Quote
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleFormatClick("callout")}>
            Call Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Separator orientation="vertical" className="h-4 mx-1" />

      {/* Alignment Controls */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onMouseDown={e => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="start" 
          className="min-w-[120px]"
          onCloseAutoFocus={e => e.preventDefault()}
        >
          <DropdownMenuItem onClick={() => handleFormatClick("align", "left")}>
            <AlignLeft className="h-4 w-4 mr-2" /> Left
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleFormatClick("align", "center")}>
            <AlignCenter className="h-4 w-4 mr-2" /> Center
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleFormatClick("align", "right")}>
            <AlignRight className="h-4 w-4 mr-2" /> Right
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleFormatClick("align", "justify")}>
            <AlignJustify className="h-4 w-4 mr-2" /> Justify
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Separator orientation="vertical" className="h-4 mx-1" />

      {/* Formatting Buttons */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => handleFormatClick("bold")}
        title="Bold (Ctrl+B)"
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => handleFormatClick("italic")}
        title="Italic (Ctrl+I)"
      >
        <Italic className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => handleFormatClick("underline")}
        title="Underline (Ctrl+U)"
      >
        <Underline className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => handleFormatClick("strikeThrough")}
        title="Strikethrough (Ctrl+Shift+S)"
      >
        <Strikethrough className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => handleFormatClick("inlineCode")}
        title="Inline Code (Ctrl+E)"
      >
        <Code className="h-4 w-4" />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            title="Highlight (Ctrl+Shift+H)"
            onMouseDown={e => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <Highlighter className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="min-w-[140px]"
          onCloseAutoFocus={e => e.preventDefault()}
        >
          <DropdownMenuLabel className="text-xs py-1">Highlight Color</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => handleFormatClick("highlight", "yellow")}>
            <span className="w-4 h-4 rounded-sm mr-2 border" style={{ backgroundColor: "#fef08a" }} /> Yellow
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleFormatClick("highlight", "green")}>
            <span className="w-4 h-4 rounded-sm mr-2 border" style={{ backgroundColor: "#bbf7d0" }} /> Green
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleFormatClick("highlight", "blue")}>
            <span className="w-4 h-4 rounded-sm mr-2 border" style={{ backgroundColor: "#bfdbfe" }} /> Blue
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleFormatClick("highlight", "pink")}>
            <span className="w-4 h-4 rounded-sm mr-2 border" style={{ backgroundColor: "#fbcfe8" }} /> Pink
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleFormatClick("highlight", "purple")}>
            <span className="w-4 h-4 rounded-sm mr-2 border" style={{ backgroundColor: "#ddd6fe" }} /> Purple
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleFormatClick("highlight", "orange")}>
            <span className="w-4 h-4 rounded-sm mr-2 border" style={{ backgroundColor: "#fed7aa" }} /> Orange
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleFormatClick("highlight", "red")}>
            <span className="w-4 h-4 rounded-sm mr-2 border" style={{ backgroundColor: "#fecaca" }} /> Red
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleFormatClick("highlight", "gray")}>
            <span className="w-4 h-4 rounded-sm mr-2 border" style={{ backgroundColor: "#e5e7eb" }} /> Gray
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleFormatClick("highlight", "remove")}>
            <span className="w-4 h-4 rounded-sm mr-2 border bg-background" /> Remove
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            title="Text Color"
            onMouseDown={e => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <Palette className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="min-w-[140px]"
          onCloseAutoFocus={e => e.preventDefault()}
        >
          <DropdownMenuLabel className="text-xs py-1">Text Color</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => handleFormatClick("textColor", "remove")}>
            <span className="w-4 h-4 rounded-full mr-2 border bg-background" /> Default
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleFormatClick("textColor", "#ef4444")}>
            <span className="w-4 h-4 rounded-full mr-2 border" style={{ backgroundColor: "#ef4444" }} /> Red
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleFormatClick("textColor", "#f97316")}>
            <span className="w-4 h-4 rounded-full mr-2 border" style={{ backgroundColor: "#f97316" }} /> Orange
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleFormatClick("textColor", "#eab308")}>
            <span className="w-4 h-4 rounded-full mr-2 border" style={{ backgroundColor: "#eab308" }} /> Yellow
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleFormatClick("textColor", "#22c55e")}>
            <span className="w-4 h-4 rounded-full mr-2 border" style={{ backgroundColor: "#22c55e" }} /> Green
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleFormatClick("textColor", "#3b82f6")}>
            <span className="w-4 h-4 rounded-full mr-2 border" style={{ backgroundColor: "#3b82f6" }} /> Blue
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleFormatClick("textColor", "#a855f7")}>
            <span className="w-4 h-4 rounded-full mr-2 border" style={{ backgroundColor: "#a855f7" }} /> Purple
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleFormatClick("textColor", "#ec4899")}>
            <span className="w-4 h-4 rounded-full mr-2 border" style={{ backgroundColor: "#ec4899" }} /> Pink
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleFormatClick("textColor", "#6b7280")}>
            <span className="w-4 h-4 rounded-full mr-2 border" style={{ backgroundColor: "#6b7280" }} /> Gray
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Separator orientation="vertical" className="h-4 mx-1" />

      {/* Link Button - Direct action when no link selected, dropdown when link is selected */}
      {isLinkSelected ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1 px-2"
              onMouseDown={e => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <Link className="h-4 w-4" />
              <ChevronDown className="h-3 w-3 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="start" 
            className="min-w-[180px]"
            onCloseAutoFocus={e => e.preventDefault()}
          >
            <DropdownMenuItem onClick={() => handleFormatClick("editLink")}>
              <Link className="h-4 w-4 mr-2" />
              Edit link
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleFormatClick("openLink")}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Open link
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleFormatClick("unlink")}>
              <Unlink className="h-4 w-4 mr-2" />
              Remove link
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => handleFormatClick("link")}
          title="Create link"
        >
          <Link className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
