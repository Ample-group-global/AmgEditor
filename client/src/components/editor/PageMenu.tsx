import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import {
  FileJson,
  MoreHorizontal,
  Upload,
} from "lucide-react";
import { useRef } from "react";

import { Eye, Trash2, Moon, Sun, Maximize, Minimize } from "lucide-react";

interface PageMenuProps {
  onImportMarkdown: (content: string) => void;
  onTogglePreview: () => void;
  isPreviewMode: boolean;
  onClearAll: () => void;
  onToggleDarkMode: () => void;
  isDarkMode: boolean;
  onToggleFocusMode: () => void;
  isFocusMode: boolean;
}

export function PageMenu({
  onImportMarkdown,
  onTogglePreview,
  isPreviewMode,
  onClearAll,
  onToggleDarkMode,
  isDarkMode,
  onToggleFocusMode,
  isFocusMode,
}: PageMenuProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      onImportMarkdown(content);
    };
    reader.readAsText(file);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept=".md,.txt"
        onChange={handleFileChange}
      />
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Page Options</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={onTogglePreview}
            className="flex items-center justify-between"
            onSelect={(e) => e.preventDefault()}
          >
            <div className="flex items-center">
              <Eye className="mr-2 h-4 w-4" />
              {isPreviewMode ? "Edit Mode" : "Preview Mode"}
            </div>
            <Switch checked={isPreviewMode} onCheckedChange={onTogglePreview} className="ml-2" />
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={onToggleFocusMode}
            className="flex items-center justify-between"
            onSelect={(e) => e.preventDefault()}
          >
            <div className="flex items-center">
              {isFocusMode ? (
                <Minimize className="mr-2 h-4 w-4" />
              ) : (
                <Maximize className="mr-2 h-4 w-4" />
              )}
              {isFocusMode ? "Exit Focus Mode" : "Focus Mode"}
            </div>
            <Switch checked={isFocusMode} onCheckedChange={onToggleFocusMode} className="ml-2" />
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={onToggleDarkMode}
            className="flex items-center justify-between"
            onSelect={(e) => e.preventDefault()}
          >
            <div className="flex items-center">
              {isDarkMode ? (
                <Sun className="mr-2 h-4 w-4" />
              ) : (
                <Moon className="mr-2 h-4 w-4" />
              )}
              {isDarkMode ? "Light Mode" : "Dark Mode"}
            </div>
            <Switch checked={isDarkMode} onCheckedChange={onToggleDarkMode} className="ml-2" />
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={onClearAll}
            className="text-red-600 focus:text-red-600"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Clear All Content
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" />
            Import Markdown
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
        </TooltipTrigger>
        <TooltipContent>
          Page options and settings
        </TooltipContent>
      </Tooltip>
    </>
  );
}
