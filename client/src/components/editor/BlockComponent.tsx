import { cn } from "@/lib/utils";
import { Block, BlockType } from "@/lib/editor-types";
import {
  Image as ImageIcon,
  Video,
  File,
  Table,
} from "lucide-react";
import { BlockMenu } from "./BlockMenu";
import { MediaBlock } from "./MediaBlock";
import { TableBlock } from "./TableBlock";
import { Plus, MoreVertical } from "lucide-react";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// ── Declare global CDN libraries ──────────────────────────────────────────
declare global {
  interface Window {
    katex?: {
      render: (tex: string, element: HTMLElement, options?: any) => void;
      renderToString: (tex: string, options?: any) => string;
    };
    renderMathInElement?: (element: HTMLElement, options?: any) => void;
    mermaid?: {
      initialize: (config: any) => void;
      run: (config?: any) => Promise<void>;
      render: (id: string, definition: string) => Promise<{ svg: string }>;
    };
    Prism?: {
      highlight: (code: string, grammar: any, language: string) => string;
      highlightElement: (element: HTMLElement) => void;
      highlightAllUnder: (container: HTMLElement) => void;
      languages: Record<string, any>;
      plugins: Record<string, any>;
    };
  }
}

// ── KaTeX Math Block Renderer ─────────────────────────────────────────────
const MathBlockRenderer: React.FC<{
  content: string;
  block: Block;
  updateBlock: (id: string, content: string) => void;
  onKeyDown: (e: React.KeyboardEvent, id: string) => void;
  onFocus: (id: string) => void;
  readOnly?: boolean;
}> = ({ content, block, updateBlock, onKeyDown, onFocus, readOnly }) => {
  const renderRef = useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const editRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing || !renderRef.current || !content.trim()) return;
    try {
      if (window.katex) {
        renderRef.current.innerHTML = "";
        window.katex.render(content, renderRef.current, {
          displayMode: true,
          throwOnError: false,
          trust: true,
        });
        setError(null);
      } else {
        renderRef.current.innerHTML = `<pre style="font-family:monospace;color:#888;">$$${content}$$</pre>`;
      }
    } catch (err: any) {
      setError(err.message || "Invalid LaTeX");
      renderRef.current.innerHTML = `<pre style="color:red;">${err.message}</pre>`;
    }
  }, [content, isEditing]);

  if (isEditing) {
    return (
      <div className="my-3 rounded-lg overflow-hidden border border-primary/40 shadow-sm">
        <div className="bg-muted/60 px-3 py-1 text-xs text-muted-foreground font-mono border-b border-border/40 select-none flex justify-between items-center">
          <span>LaTeX (editing)</span>
          <button
            className="text-xs text-primary hover:underline"
            onClick={() => setIsEditing(false)}
          >
            Preview
          </button>
        </div>
        <textarea
          ref={editRef}
          className="w-full p-4 font-mono text-sm leading-relaxed bg-muted/30 outline-none resize-y min-h-[60px]"
          value={content}
          onChange={(e) => updateBlock(block.id, e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") { setIsEditing(false); return; }
            if (e.key === "Enter" && (e.shiftKey || e.ctrlKey)) {
              e.preventDefault();
              setIsEditing(false);
              onKeyDown(e as any, block.id);
              return;
            }
            if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey) {
              const target = e.target as HTMLTextAreaElement;
              if (target.selectionStart === content.length && content.endsWith("\n\n")) {
                e.preventDefault();
                updateBlock(block.id, content.replace(/\n+$/, ""));
                setIsEditing(false);
                onKeyDown(e as any, block.id);
                return;
              }
              return;
            }
          }}
          onFocus={() => onFocus(block.id)}
          autoFocus
          readOnly={readOnly}
        />
      </div>
    );
  }

  return (
    <div className="my-3 rounded-lg overflow-hidden border border-border/60 shadow-sm">
      <div className="bg-muted/60 px-3 py-1 text-xs text-muted-foreground font-mono border-b border-border/40 select-none flex justify-between items-center">
        <span>LaTeX</span>
        {!readOnly && (
          <button
            className="text-xs text-primary hover:underline"
            onClick={() => setIsEditing(true)}
          >
            Edit
          </button>
        )}
      </div>
      <div
        ref={renderRef}
        className="p-4 overflow-x-auto cursor-pointer min-h-[40px] flex items-center justify-center"
        onClick={() => !readOnly && setIsEditing(true)}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !readOnly) {
            setIsEditing(true);
          }
          onKeyDown(e as any, block.id);
        }}
        onFocus={() => onFocus(block.id)}
      />
      {error && (
        <div className="px-3 py-1 text-xs text-red-500 bg-red-50 dark:bg-red-950/30 border-t border-red-200">
          {error}
        </div>
      )}
    </div>
  );
};

// ── Mermaid Diagram Renderer ──────────────────────────────────────────────
const MermaidRenderer: React.FC<{
  content: string;
  block: Block;
  updateBlock: (id: string, content: string) => void;
  onKeyDown: (e: React.KeyboardEvent, id: string) => void;
  onFocus: (id: string) => void;
  readOnly?: boolean;
}> = ({ content, block, updateBlock, onKeyDown, onFocus, readOnly }) => {
  const renderRef = useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [svgHtml, setSvgHtml] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const renderIdRef = useRef(0);

  const renderDiagram = useCallback(async () => {
    if (!content.trim() || !window.mermaid) {
      setSvgHtml("");
      return;
    }
    try {
      renderIdRef.current++;
      const id = `mermaid-${block.id.replace(/[^a-zA-Z0-9]/g, "")}-${renderIdRef.current}`;
      // Clean up any leftover error elements from previous failed renders
      document.querySelectorAll(`#d${id}, [id^="dmermaid-"]`).forEach(el => {
        if (el.closest('.mermaid-renderer-container')) return;
        el.remove();
      });
      const { svg } = await window.mermaid.render(id, content);
      setSvgHtml(svg);
      setError(null);
    } catch (err: any) {
      // Clean up Mermaid's error SVG elements it injects into the DOM
      document.querySelectorAll('[id^="dmermaid-"]').forEach(el => el.remove());
      setError(err.message || "Invalid diagram syntax");
      setSvgHtml("");
    }
  }, [content, block.id]);

  useEffect(() => {
    if (!isEditing) {
      if (window.mermaid) {
        const isDark = document.documentElement.classList.contains("dark");
        window.mermaid.initialize({
          startOnLoad: false,
          theme: isDark ? "dark" : "default",
          securityLevel: "loose",
          themeVariables: isDark
            ? {
                primaryColor: "#4f8fea",
                primaryTextColor: "#e2e8f0",
                primaryBorderColor: "#6aa3f0",
                lineColor: "#94a3b8",
                secondaryColor: "#334155",
                tertiaryColor: "#1e293b",
                noteBkgColor: "#854d0e",
                noteTextColor: "#fef3c7",
                noteBorderColor: "#a16207",
                textColor: "#e2e8f0",
                mainBkg: "#1e293b",
                nodeBorder: "#6aa3f0",
                clusterBkg: "#1e293b",
                titleColor: "#e2e8f0",
                actorTextColor: "#e2e8f0",
                actorBorder: "#6aa3f0",
                actorBkg: "#334155",
                signalColor: "#e2e8f0",
                signalTextColor: "#e2e8f0",
                labelBoxBkgColor: "#334155",
                labelBoxBorderColor: "#6aa3f0",
                labelTextColor: "#e2e8f0",
                loopTextColor: "#e2e8f0",
                activationBorderColor: "#6aa3f0",
                activationBkgColor: "#334155",
                sequenceNumberColor: "#e2e8f0",
              }
            : {
                primaryColor: "#3b82f6",
                primaryTextColor: "#1e293b",
                primaryBorderColor: "#2563eb",
                lineColor: "#334155",
                secondaryColor: "#e0e7ff",
                tertiaryColor: "#f1f5f9",
                noteBkgColor: "#fef3c7",
                noteTextColor: "#78350f",
                noteBorderColor: "#d97706",
                textColor: "#1e293b",
                mainBkg: "#dbeafe",
                nodeBorder: "#2563eb",
                clusterBkg: "#f1f5f9",
                titleColor: "#1e293b",
                actorTextColor: "#1e293b",
                actorBorder: "#2563eb",
                actorBkg: "#dbeafe",
                signalColor: "#1e293b",
                signalTextColor: "#1e293b",
                labelBoxBkgColor: "#dbeafe",
                labelBoxBorderColor: "#2563eb",
                labelTextColor: "#1e293b",
                loopTextColor: "#1e293b",
                activationBorderColor: "#2563eb",
                activationBkgColor: "#e0e7ff",
                sequenceNumberColor: "#1e293b",
              },
        });
      }
      renderDiagram();
    }
  }, [content, isEditing, renderDiagram]);

  if (isEditing) {
    return (
      <div className="my-3 rounded-lg overflow-hidden border border-primary/40 shadow-sm">
        <div className="bg-muted/60 px-3 py-1 text-xs text-muted-foreground font-mono border-b border-border/40 select-none flex justify-between items-center">
          <span>Mermaid (editing)</span>
          <button
            className="text-xs text-primary hover:underline"
            onClick={() => setIsEditing(false)}
          >
            Preview
          </button>
        </div>
        <textarea
          className="w-full p-4 font-mono text-sm leading-relaxed bg-muted/30 outline-none resize-y min-h-[100px]"
          value={content}
          onChange={(e) => updateBlock(block.id, e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") { setIsEditing(false); return; }
            if (e.key === "Enter" && (e.shiftKey || e.ctrlKey)) {
              e.preventDefault();
              setIsEditing(false);
              onKeyDown(e as any, block.id);
              return;
            }
            if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey) {
              const target = e.target as HTMLTextAreaElement;
              if (target.selectionStart === content.length && content.endsWith("\n\n")) {
                e.preventDefault();
                updateBlock(block.id, content.replace(/\n+$/, ""));
                setIsEditing(false);
                onKeyDown(e as any, block.id);
                return;
              }
              return;
            }
          }}
          onFocus={() => onFocus(block.id)}
          autoFocus
          readOnly={readOnly}
        />
      </div>
    );
  }

  return (
    <div className="my-3 rounded-lg overflow-hidden border border-border/60 shadow-sm">
      <div className="bg-muted/60 px-3 py-1 text-xs text-muted-foreground font-mono border-b border-border/40 select-none flex justify-between items-center">
        <span>Diagram</span>
        {!readOnly && (
          <button
            className="text-xs text-primary hover:underline"
            onClick={() => setIsEditing(true)}
          >
            Edit
          </button>
        )}
      </div>
      <div
        className="p-4 overflow-x-auto cursor-pointer min-h-[60px] flex items-center justify-center bg-white dark:bg-gray-900"
        onClick={() => !readOnly && setIsEditing(true)}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !readOnly) setIsEditing(true);
          onKeyDown(e as any, block.id);
        }}
        onFocus={() => onFocus(block.id)}
      >
        {svgHtml ? (
          <div ref={renderRef} className="mermaid-renderer-container w-full [&>svg]:w-full [&>svg]:max-w-full [&>svg]:h-auto [&>svg]:min-h-[200px]" dangerouslySetInnerHTML={{ __html: svgHtml }} />
        ) : error ? (
          <div className="flex flex-col items-center gap-2">
            <div className="text-xs text-red-500 font-mono whitespace-pre-wrap max-h-[100px] overflow-auto">{error}</div>
            {!readOnly && (
              <button className="text-xs text-primary hover:underline" onClick={() => setIsEditing(true)}>
                Edit diagram to fix syntax
              </button>
            )}
          </div>
        ) : (
          <div className="text-muted-foreground text-sm">Loading diagram...</div>
        )}
      </div>
    </div>
  );
};

// ── Prism Code Block Renderer ─────────────────────────────────────────────
const CODE_LANGUAGES = [
  { value: "", label: "Plain Text" },
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "csharp", label: "C#" },
  { value: "cpp", label: "C++" },
  { value: "c", label: "C" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "ruby", label: "Ruby" },
  { value: "php", label: "PHP" },
  { value: "swift", label: "Swift" },
  { value: "kotlin", label: "Kotlin" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "scss", label: "SCSS" },
  { value: "sql", label: "SQL" },
  { value: "bash", label: "Shell/Bash" },
  { value: "powershell", label: "PowerShell" },
  { value: "json", label: "JSON" },
  { value: "yaml", label: "YAML" },
  { value: "xml", label: "XML" },
  { value: "markdown", label: "Markdown" },
  { value: "docker", label: "Docker" },
  { value: "graphql", label: "GraphQL" },
];

const CodeBlockRenderer: React.FC<{
  content: string;
  language: string;
  block: Block;
  updateBlock: (id: string, content: string) => void;
  updateBlockMetadata: (id: string, metadata: any) => void;
  onKeyDown: (e: React.KeyboardEvent, id: string) => void;
  onFocus: (id: string) => void;
  onPasteBlocks?: (blockId: string, markdown: string) => void;
  readOnly?: boolean;
}> = ({ content, language, block, updateBlock, updateBlockMetadata, onKeyDown, onFocus, readOnly }) => {
  const codeRef = useRef<HTMLElement>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (isEditing || !codeRef.current) return;
    // Set text content first, then highlight
    codeRef.current.textContent = content;
    if (window.Prism && language && window.Prism.languages[language]) {
      window.Prism.highlightElement(codeRef.current);
    } else if (window.Prism) {
      // Try auto-loading the language
      window.Prism.highlightElement(codeRef.current);
    }
  }, [content, language, isEditing]);

  if (isEditing) {
    return (
      <div className="my-3 rounded-lg overflow-hidden border border-primary/40 shadow-sm">
        <div className="bg-muted/60 px-3 py-1 text-xs text-muted-foreground font-mono border-b border-border/40 select-none flex justify-between items-center">
          <div className="flex items-center gap-1">
            <select
              value={language}
              onChange={(e) => updateBlockMetadata(block.id, { ...block.metadata, language: e.target.value })}
              className="bg-transparent text-xs font-mono text-muted-foreground border-none outline-none cursor-pointer appearance-none px-1 hover:text-foreground"
            >
              {CODE_LANGUAGES.map((lang) => (
                <option key={lang.value} value={lang.value}>{lang.label}</option>
              ))}
            </select>
            <span className="text-xs opacity-50">(editing)</span>
          </div>
          <button
            className="text-xs text-primary hover:underline"
            onClick={() => setIsEditing(false)}
          >
            Preview
          </button>
        </div>
        <textarea
          className="w-full p-4 font-mono text-sm leading-relaxed bg-muted/30 outline-none resize-y min-h-[80px]"
          value={content}
          onChange={(e) => updateBlock(block.id, e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") { setIsEditing(false); return; }
            // Shift+Enter or Ctrl+Enter: exit code block and create new block below
            if (e.key === "Enter" && (e.shiftKey || e.ctrlKey)) {
              e.preventDefault();
              setIsEditing(false);
              onKeyDown(e as any, block.id);
              return;
            }
            // Enter at end with trailing empty line: exit code block
            if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey) {
              const target = e.target as HTMLTextAreaElement;
              const atEnd = target.selectionStart === content.length;
              if (atEnd && content.endsWith("\n\n")) {
                e.preventDefault();
                // Remove trailing empty lines
                updateBlock(block.id, content.replace(/\n+$/, ""));
                setIsEditing(false);
                onKeyDown(e as any, block.id);
                return;
              }
              // Otherwise let textarea handle Enter normally (add newline)
              return;
            }
            // Allow Tab for indentation
            if (e.key === "Tab") {
              e.preventDefault();
              const target = e.target as HTMLTextAreaElement;
              const start = target.selectionStart;
              const end = target.selectionEnd;
              const newVal = content.substring(0, start) + "  " + content.substring(end);
              updateBlock(block.id, newVal);
              setTimeout(() => {
                target.selectionStart = target.selectionEnd = start + 2;
              }, 0);
              return;
            }
            // Pass ArrowDown at end, Backspace at start, etc. to parent
            if (e.key === "ArrowDown") {
              const target = e.target as HTMLTextAreaElement;
              if (target.selectionStart === content.length) {
                e.preventDefault();
                onKeyDown(e as any, block.id);
              }
              return;
            }
            if (e.key === "ArrowUp") {
              const target = e.target as HTMLTextAreaElement;
              if (target.selectionStart === 0) {
                e.preventDefault();
                onKeyDown(e as any, block.id);
              }
              return;
            }
          }}
          onFocus={() => onFocus(block.id)}
          autoFocus
          readOnly={readOnly}
        />
      </div>
    );
  }

  const lineCount = content.split("\n").length;

  return (
    <div className="my-3 rounded-lg overflow-hidden border border-border/60 shadow-sm">
      <div className="bg-muted/60 px-3 py-1 text-xs text-muted-foreground font-mono border-b border-border/40 select-none flex justify-between items-center">
        <select
          value={language}
          onChange={(e) => updateBlockMetadata(block.id, { ...block.metadata, language: e.target.value })}
          className="bg-transparent text-xs font-mono text-muted-foreground border-none outline-none cursor-pointer appearance-none px-1 hover:text-foreground"
          disabled={readOnly}
        >
          {CODE_LANGUAGES.map((lang) => (
            <option key={lang.value} value={lang.value}>{lang.label}</option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          <span className="text-xs opacity-50">{lineCount} lines</span>
          {!readOnly && (
            <button
              className="text-xs text-primary hover:underline"
              onClick={() => setIsEditing(true)}
            >
              Edit
            </button>
          )}
        </div>
      </div>
      <div className="flex">
        {/* Line numbers */}
        <div className="flex-shrink-0 bg-[#282a2e] border-r border-[#373b41] flex flex-col items-end px-3 py-4 select-none pointer-events-none">
          {content.split("\n").map((_, idx) => (
            <div key={idx} className="text-xs text-[#636870] font-mono" style={{ lineHeight: "1.625", fontSize: "0.875rem" }}>
              {idx + 1}
            </div>
          ))}
        </div>
        <pre
          className="flex-1 p-4 overflow-x-auto m-0 bg-[#1d1f21] text-[#c5c8c6]"
          style={{ margin: 0 }}
          onClick={() => !readOnly && setIsEditing(true)}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !readOnly) setIsEditing(true);
            onKeyDown(e as any, block.id);
          }}
          onFocus={() => onFocus(block.id)}
        >
          <code
            ref={codeRef}
            className={language ? `language-${language}` : ""}
            style={{ fontSize: "0.875rem", lineHeight: "1.625" }}
          >
            {content}
          </code>
        </pre>
      </div>
    </div>
  );
};

// ── Inline Math Renderer (for use within text content) ────────────────────
const InlineMathEffect: React.FC<{ containerRef: React.RefObject<HTMLElement | null> }> = ({ containerRef }) => {
  useEffect(() => {
    if (!containerRef.current || !window.renderMathInElement) return;
    // Render inline math in the container
    const timer = setTimeout(() => {
      if (containerRef.current && window.renderMathInElement) {
        window.renderMathInElement(containerRef.current, {
          delimiters: [
            { left: "$$", right: "$$", display: true },
            { left: "$", right: "$", display: false },
          ],
          throwOnError: false,
        });
      }
    }, 50);
    return () => clearTimeout(timer);
  });
  return null;
};

// Helper component to handle contentEditable without cursor jumps
interface TextEditorProps extends Omit<
  React.HTMLAttributes<HTMLElement>,
  "onKeyDown" | "onFocus"
> {
  tagName?: "div" | "span";
  block: Block;
  updateBlock: (id: string, content: string) => void;
  updateBlockType?: (id: string, type: BlockType) => void;
  updateBlockMetadata?: (id: string, metadata: any) => void;
  updateBlockProps?: (id: string, props: Record<string, any>) => void;
  onKeyDown: (e: React.KeyboardEvent, id: string) => void;
  onFocus: (id: string) => void;
  onPasteBlocks?: (blockId: string, markdown: string) => void;
  readOnly?: boolean;
}

const TextEditor: React.FC<TextEditorProps> = ({
  tagName: Tag = "div",
  block,
  updateBlock,
  updateBlockType,
  updateBlockMetadata,
  updateBlockProps,
  onKeyDown,
  onFocus,
  onPasteBlocks,
  className,
  ...props
}) => {
  const contentRef = useRef<HTMLElement>(null);

  // Sync DOM with state only if they differ (handles AI/external updates)
  useEffect(() => {
    if (!contentRef.current) return;

    const hasHtml = /<[a-z][\s\S]*>/i.test(block.content);

    if (hasHtml) {
      // Content contains HTML (e.g. <a> links) — render via innerHTML
      if (contentRef.current.innerHTML !== block.content) {
        contentRef.current.innerHTML = block.content;
      }
      // Render inline math in .math-inline spans
      if (window.katex) {
        const mathSpans = contentRef.current.querySelectorAll(".math-inline");
        mathSpans.forEach((span) => {
          const tex = span.textContent?.replace(/^\$|\$$/g, "") || "";
          if (tex && !span.querySelector(".katex")) {
            try {
              window.katex!.render(tex, span as HTMLElement, {
                displayMode: false,
                throwOnError: false,
              });
            } catch {}
          }
        });
      }
    } else {
      // Plain text path (original logic)
      const currentText = contentRef.current.innerText;
      if (currentText !== block.content) {
        const hasLinks = contentRef.current.querySelector("a");
        if (!hasLinks) {
          contentRef.current.innerText = block.content;
        } else {
          if (Math.abs(currentText.length - block.content.length) > 1) {
            contentRef.current.innerText = block.content;
          }
        }

        if (document.activeElement === contentRef.current) {
          const range = document.createRange();
          range.selectNodeContents(contentRef.current);
          range.collapse(false);
          const sel = window.getSelection();
          sel?.removeAllRanges();
          sel?.addRange(range);
        }
      }
    }
  }, [block.content]);

  const handleInput = (e: React.FormEvent<HTMLElement>) => {
    const element = e.currentTarget;
    let htmlContent = element.innerHTML || "";
    // Clean up unwanted browser injected <br> tags if it's the only thing
    if (htmlContent === "<br>") htmlContent = "";

    // Use innerText (plain text) unless there are real HTML tags (links, bold, etc.)
    // This avoids &nbsp; entities from innerHTML being stored and double-encoded
    const text = element.innerText || "";
    const hasRealHtmlTags = /<(?:a|strong|em|b|i|u|s|del|code|mark|span|br)\b/i.test(htmlContent);
    const contentToStore = hasRealHtmlTags ? htmlContent : text;

    if (updateBlockType && block.type === "text") {
      // Helper to convert block and set cursor
      const convertBlock = (type: BlockType, content: string, metadata?: Record<string, any>) => {
        updateBlockType(block.id, type);
        if (metadata && updateBlockMetadata) {
          updateBlockMetadata(block.id, metadata);
        }
        updateBlock(block.id, content);
        setTimeout(() => {
          if (contentRef.current) {
            const range = document.createRange();
            const textNode = contentRef.current.firstChild;
            if (textNode) {
              range.setStart(textNode, Math.min(content.length, textNode.textContent?.length || 0));
              range.collapse(true);
              const sel = window.getSelection();
              sel?.removeAllRanges();
              sel?.addRange(range);
            }
          }
        }, 0);
      };

      // "1. text" or "1. " → numbered-list
      const numberedListMatch = text.match(/^(\d+)\.\s(.+)$/);
      if (numberedListMatch) {
        convertBlock("numbered-list", numberedListMatch[2]);
        return;
      }
      const justNumberMatch = text.match(/^(\d+)\.\s$/);
      if (justNumberMatch) {
        convertBlock("numbered-list", "");
        return;
      }

      // "- text" or "- " or "+ text" or "+ " → bullet-list
      const bulletMatch = text.match(/^[-*+]\s(.+)$/);
      if (bulletMatch) {
        convertBlock("bullet-list", bulletMatch[1]);
        return;
      }
      if (/^[-*+]\s$/.test(text)) {
        convertBlock("bullet-list", "");
        return;
      }

      // "> text", ">> text", ">>> text" → quote (with nesting)
      const quoteMatch = text.match(/^(>+)\s(.*)$/);
      if (quoteMatch) {
        const depth = quoteMatch[1].length;
        convertBlock("quote", quoteMatch[2]);
        if (depth > 1 && updateBlockProps) {
          updateBlockProps(block.id, { indent: depth - 1 });
        }
        return;
      }
      if (/^>+\s$/.test(text)) {
        const depth = (text.match(/^(>+)/)?.[1] || ">").length;
        convertBlock("quote", "");
        if (depth > 1 && updateBlockProps) {
          updateBlockProps(block.id, { indent: depth - 1 });
        }
        return;
      }

      // (#1) "####" to "######" → heading-3 (h4-h6 map to heading-3)
      const h456Match = text.match(/^#{4,6}\s(.*)$/);
      if (h456Match) {
        convertBlock("heading-3", h456Match[1]);
        return;
      }

      // "### text" or "### " → heading-3
      const h3Match = text.match(/^###\s(.*)$/);
      if (h3Match) {
        convertBlock("heading-3", h3Match[1]);
        return;
      }

      // "## text" or "## " → heading-2
      const h2Match = text.match(/^##\s(.*)$/);
      if (h2Match) {
        convertBlock("heading-2", h2Match[1]);
        return;
      }

      // "# text" or "# " → heading-1
      const h1Match = text.match(/^#\s(.*)$/);
      if (h1Match) {
        convertBlock("heading-1", h1Match[1]);
        return;
      }

      // "```" → code block
      if (text.startsWith("```") && updateBlockMetadata) {
        let remaining = text.substring(3);

        // Extract optional language tag (e.g. javascript)
        const langMatch = remaining.match(/^\s*(\w*)\s*/);
        let language = "";
        if (langMatch) {
          language = langMatch[1] || "";
          remaining = remaining.substring(langMatch[0].length);
        }

        if (remaining.endsWith("```")) {
          remaining = remaining.slice(0, -3);
        }

        // Check if it's a mermaid code block
        if (language === "mermaid") {
          convertBlock("callout", remaining.trim(), { isDiagram: true, diagramType: "mermaid" });
        } else {
          convertBlock("callout", remaining.trim(), { isCode: true, language });
        }
        return;
      }

      // "[TOC]" or "[[toc]]" → table of contents
      if (/^\[{1,2}toc\]{1,2}$/i.test(text.trim())) {
        convertBlock("toc", "");
        return;
      }

      // "$$" → math block
      if (text.trim() === "$$" && updateBlockMetadata) {
        convertBlock("callout", "", { isMath: true });
        return;
      }

      // ":::type" → admonition/callout
      const admonitionMatch = text.match(/^:::(\w*)\s*$/);
      if (admonitionMatch && updateBlockMetadata) {
        const calloutType = admonitionMatch[1] || "info";
        convertBlock("callout", "", { calloutType });
        return;
      }

      // "- [ ] text" or "- [x] text" → todo
      const todoMatch = text.match(/^-\s\[([ xX])\]\s(.*)$/);
      if (todoMatch) {
        convertBlock("todo", todoMatch[2], { checked: todoMatch[1].toLowerCase() === "x" });
        return;
      }
      if (/^-\s\[([ xX])\]\s$/.test(text)) {
        const checked = text.includes("[x]") || text.includes("[X]");
        convertBlock("todo", "", { checked });
        return;
      }

      // "---" or "***" or "___" → divider
      if (/^(---+|\*\*\*+|___+)$/.test(text.trim())) {
        updateBlockType(block.id, "divider");
        updateBlock(block.id, "");
        return;
      }
    }

    // ── Inline markdown formatting (live typing) ──────────────────────
    // Detect completed inline markdown patterns and convert to HTML.
    // We check innerText for pattern presence, then apply replacement on innerHTML.
    const inlinePatterns: { regex: RegExp; tag: string; wrap: (m: RegExpExecArray) => string }[] = [
      // bold+italic: ***text*** or ___text___
      { regex: /\*\*\*([^*]+)\*\*\*/, tag: 'strong', wrap: m => `<strong><em>${m[1]}</em></strong>` },
      { regex: /___([^_]+)___/, tag: 'strong', wrap: m => `<strong><em>${m[1]}</em></strong>` },
      // bold: **text** or __text__ (content must not contain * or _ to avoid matching partial italic)
      { regex: /(?<!\*)\*\*([^*]+)\*\*(?!\*)/, tag: 'strong', wrap: m => `<strong>${m[1]}</strong>` },
      { regex: /(?<!_)__([^_]+)__(?!_)/, tag: 'strong', wrap: m => `<strong>${m[1]}</strong>` },
      // strikethrough: ~~text~~
      { regex: /~~(.+?)~~/, tag: 'del', wrap: m => `<del>${m[1]}</del>` },
      // (#6) spoiler: ||text||
      { regex: /\|\|(.+?)\|\|/, tag: 'span', wrap: m => `<span class="spoiler" style="background:#333;color:#333;padding:0 4px;border-radius:3px;cursor:pointer" onclick="this.style.color='inherit';this.style.background='#e0e0e0'">${m[1]}</span>` },
      // highlight: ==text==
      { regex: /==(.+?)==/, tag: 'mark', wrap: m => `<mark>${m[1]}</mark>` },
      // superscript: ^text^
      { regex: /\^([^^]+?)\^/, tag: 'sup', wrap: m => `<sup>${m[1]}</sup>` },
      // subscript: ~text~ (single tilde, not ~~)
      { regex: /(?<!~)~([^~]+?)~(?!~)/, tag: 'sub', wrap: m => `<sub>${m[1]}</sub>` },
      // italic: *text* or _text_ (must not be adjacent to other * or _)
      { regex: /(?<!\*)\*([^*]+)\*(?!\*)/, tag: 'em', wrap: m => `<em>${m[1]}</em>` },
      { regex: /(?:^|(?<=\s))_([^_]+)_(?=\s|$)/, tag: 'em', wrap: m => `<em>${m[1]}</em>` },
      // inline code: `text`
      { regex: /`([^`]+)`/, tag: 'code', wrap: m => `<code>${m[1]}</code>` },
      // inline math: $text$ (not $$)
      { regex: /(?<!\$)\$(?!\$)([^$]+?)\$(?!\$)/, tag: 'span', wrap: m => `<span class="inline-math">${m[1]}</span>` },
      // links: [text](url)
      { regex: /\[([^\]]+)\]\(([^)]+)\)/, tag: 'a', wrap: m => `<a href="${m[2]}" target="_blank" rel="noopener noreferrer">${m[1]}</a>` },
    ];

    let transformed = false;
    let workingHtml = element.innerHTML || "";
    for (const pattern of inlinePatterns) {
      // First check if the pattern exists in the plain text
      const textMatch = pattern.regex.exec(text);
      if (textMatch) {
        // Now find and replace in innerHTML using the regex directly
        // (markdown chars like * _ ~ = ^ ` are not HTML special chars, so they appear literally in innerHTML)
        const htmlMatch = pattern.regex.exec(workingHtml);
        if (htmlMatch) {
          workingHtml = workingHtml.substring(0, htmlMatch.index) + pattern.wrap(htmlMatch) + workingHtml.substring(htmlMatch.index + htmlMatch[0].length);
          transformed = true;
          break; // Apply one pattern at a time to avoid conflicts
        }
      }
    }

    if (transformed) {
      // Save cursor position info
      const sel = window.getSelection();
      element.innerHTML = workingHtml;
      updateBlock(block.id, workingHtml);

      // Place cursor after the newly inserted formatted element
      if (sel && element.childNodes.length > 0) {
        requestAnimationFrame(() => {
          const selection = window.getSelection();
          if (!selection) return;
          // Find the formatted element we just inserted and place cursor after it
          const allFormatted = element.querySelectorAll('strong, em, del, code, mark, sup, sub, a, span.inline-math');
          const formattedEl = allFormatted.length > 0 ? allFormatted[allFormatted.length - 1] : null;
          if (formattedEl) {
            const range = document.createRange();
            // Place cursor right after the formatted element
            const parent = formattedEl.parentNode;
            if (parent) {
              const index = Array.from(parent.childNodes).indexOf(formattedEl as ChildNode);
              // Insert a zero-width space after the element so cursor has somewhere to go
              const textNode = document.createTextNode('\u200B');
              if (formattedEl.nextSibling) {
                parent.insertBefore(textNode, formattedEl.nextSibling);
              } else {
                parent.appendChild(textNode);
              }
              range.setStartAfter(textNode);
              range.collapse(true);
              selection.removeAllRanges();
              selection.addRange(range);
            }
          }
        });
      }
      return;
    }

    updateBlock(block.id, contentToStore);
  };

  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    // Make links clickable in contentEditable
    const target = e.target as HTMLElement;
    const link = target.closest("a") as HTMLAnchorElement;

    if (link) {
      const href = link.getAttribute("href");
      if (href) {
        e.preventDefault();
        e.stopPropagation();
        window.open(href, "_blank", "noopener,noreferrer");
      }
    }
  };

  // onMouseDown intercepts link clicks BEFORE contentEditable moves the cursor
  const handleMouseDown = (e: React.MouseEvent<HTMLElement>) => {
    const target = e.target as HTMLElement;
    const link = target.closest("a") as HTMLAnchorElement;
    if (link) {
      e.preventDefault(); // stop cursor placement in contentEditable
      const href = link.getAttribute("href");
      if (href) {
        window.open(href, "_blank", "noopener,noreferrer");
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLElement>) => {
    const text = e.clipboardData.getData("text/plain");
    if (!text) return;

    const hasMultipleLines = text.includes("\n");
    // Detect merged table rows from web copy (e.g. "| A | B |     | C | D |")
    const hasMergedTableRows = /\|[ \t]{3,}\|/.test(text);
    const hasMarkdownFormatting = /\*\*.*?\*\*|\*.*?\*|`.*?`|\[.*?\]\(.*?\)|==.*?==|\^[^^]+?\^|~~.*?~~|\|\|.+?\|\||(?<!~)~[^~]+?~(?!~)|\\[\\`*_{}[\]()#+\-.!~=^|>]|<https?:\/\/|<kbd>|<mark>|<sup>|<sub>|<img\s|<span\s|<details|<!--|\[\^.+?\]|^[\-\*]\s|^(\d+)\.\s|^#{1,6}\s|^>/m.test(text);

    // Multi-line paste OR merged table rows → delegate to Editor to create proper blocks
    if ((hasMultipleLines || hasMergedTableRows) && onPasteBlocks) {
      e.preventDefault();
      onPasteBlocks(block.id, text);
      return;
    }

    // Single-line block-level patterns (headings, lists, quotes, dividers, etc.)
    // should also go through markdownToBlocks for proper block conversion
    const isBlockLevel = /^#{1,6}\s|^[\-\*+]\s|^\d+\.\s|^>\s|^```|^---$|^\*\*\*$|^___$|^-\s\[[ xX]\]\s|^\[\^[^\]]+\]:\s|^\|.+\|/.test(text.trim());
    if (isBlockLevel && onPasteBlocks) {
      e.preventDefault();
      onPasteBlocks(block.id, text);
      return;
    }

    // Single-line with markdown formatting → inline HTML
    if (hasMarkdownFormatting) {
      e.preventDefault();
      // (#2) Handle escape characters first
      const escapes: string[] = [];
      let html = text.replace(/\\([\\`*_{}[\]()#+\-.!~=^|>])/g, (_, ch) => {
        escapes.push(ch);
        return `\x00ESC${escapes.length - 1}\x00`;
      });
      html = html
        .replace(/\*\*\*(.*?)\*\*\*/g, "<strong><em>$1</em></strong>")
        .replace(/_\*\*(.*?)\*\*_/g, "<strong><em>$1</em></strong>")
        .replace(/\*\*_(.*?)_\*\*/g, "<strong><em>$1</em></strong>")
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/~~(.*?)~~/g, "<del>$1</del>")
        .replace(/\|\|(.+?)\|\|/g, '<span class="spoiler" style="background:#333;color:#333;padding:0 4px;border-radius:3px;cursor:pointer" onclick="this.style.color=\'inherit\';this.style.background=\'#e0e0e0\'"">$1</span>')
        .replace(/==(.*?)==/g, "<mark>$1</mark>")
        .replace(/\^([^^]+?)\^/g, "<sup>$1</sup>")
        .replace(/(?<!~)~([^~]+?)~(?!~)/g, "<sub>$1</sub>")
        .replace(/\*(.*?)\*/g, "<em>$1</em>")
        .replace(/_(.*?)_/g, "<em>$1</em>")
        .replace(/`([^`]+)`/g, "<code>$1</code>")
        .replace(/\[([^\]]+)\]\(([^)\s]+)\s+"([^"]+)"\)/g, '<a href="$2" title="$3" target="_blank" rel="noopener noreferrer">$1</a>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
        .replace(/<(https?:\/\/[^>]+)>/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>')
        // HTML comments → strip
        .replace(/<!--[\s\S]*?-->/g, "")
        // <kbd> styling
        .replace(/<kbd>([^<]+)<\/kbd>/g, '<kbd style="background:#f4f4f4;border:1px solid #ccc;border-radius:3px;padding:1px 6px;font-size:0.85em;font-family:monospace;box-shadow:0 1px 0 #999">$1</kbd>')
        // Footnote references [^1] → superscript
        .replace(/\[\^([^\]]+)\]/g, '<sup>[$1]</sup>');
      // Restore escaped characters
      html = html.replace(/\x00ESC(\d+)\x00/g, (_, idx) => escapes[parseInt(idx)]);
      document.execCommand("insertHTML", false, html);
      return;
    }
    // Else, let browser do default plain text paste
  };

  return (
    <Tag
      ref={contentRef as any}
      contentEditable={!props.readOnly}
      suppressContentEditableWarning
      className={cn("block w-full outline-none", className)}
      style={{ width: '100%' }}
      onInput={handleInput}
      onPaste={handlePaste}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onKeyDown={e => onKeyDown(e, block.id)}
      onFocus={e => onFocus(block.id)}
      {...props}
    />
  );
};

interface BlockComponentProps {
  block: Block;
  blockIndex?: number;
  allBlocks?: Block[];
  updateBlock: (id: string, content: string) => void;
  updateBlockType: (id: string, type: BlockType) => void;
  updateBlockMetadata: (id: string, metadata: any) => void;
  updateBlockProps?: (id: string, props: Record<string, any>) => void;
  onKeyDown: (e: React.KeyboardEvent, id: string) => void;
  onFocus: (id: string) => void;
  isFocused: boolean;
  isSelected?: boolean;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onAddBlock: (id: string) => void;
  onPasteBlocks?: (blockId: string, markdown: string) => void;
  readOnly?: boolean;
}

export const BlockComponent: React.FC<BlockComponentProps> = ({
  block,
  blockIndex = 0,
  allBlocks = [],
  updateBlock,
  updateBlockType,
  updateBlockMetadata,
  updateBlockProps,
  onKeyDown,
  onFocus,
  isFocused,
  isSelected = false,
  onDelete,
  onDuplicate,
  onAddBlock,
  onPasteBlocks,
  readOnly = false,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);

  // Calculate the list number for numbered-list blocks
  const getListNumber = (): number => {
    if (block.type !== "numbered-list") return 1;

    let number = 1;
    // Count backwards to find the start of the list
    for (let i = blockIndex - 1; i >= 0; i--) {
      if (allBlocks[i]?.type === "numbered-list") {
        number++;
      } else {
        break;
      }
    }
    return number;
  };

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  // Calculate top offset based on block type to align controls with first line
  const getControlsTopOffset = () => {
    switch (block.type) {
      case "heading-1":
        return "2.25rem"; // mt-8 + extra offset for better alignment
      case "heading-2":
        return "1.5rem"; // mt-5 + extra offset for better alignment
      case "heading-3":
        return "1rem"; // mt-3 + extra offset for better alignment
      case "divider":
        return "50%"; // Center align with divider line
      default:
        return "0.375rem"; // Small offset for text blocks, adjusted for better alignment
    }
  };

  // Get transform for controls positioning
  const getControlsTransform = () => {
    if (block.type === "divider") {
      return "translateY(-50%)";
    }
    return undefined;
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: "relative" as const,
    zIndex: isDragging ? 999 : "auto",
  };

  // Disable drag if readOnly
  if (readOnly) {
    style.transform = undefined as any;
  }

  useEffect(() => {
    if (isFocused) {
      // Use a small delay to ensure DOM is updated
      const timeoutId = setTimeout(() => {
        // For blocks with contentEditable (text blocks), focus the editable element
        // For other blocks (divider, media, etc.), focus the block container itself
        const blockElement = document.getElementById(block.id);
        if (!blockElement) return;

        const editableElement = blockElement.querySelector('[contenteditable="true"]') as HTMLElement;
        if (editableElement) {
          editableElement.focus();
        } else if (block.type === "divider" || block.type === "image" || block.type === "video" || block.type === "file" || block.type === "table") {
          // For non-editable blocks, focus the block container if it has tabIndex
          const focusableElement = blockElement.querySelector('[tabindex]') as HTMLElement;
          if (focusableElement) {
            focusableElement.focus();
          }
        }
      }, 0);

      return () => clearTimeout(timeoutId);
    }
  }, [isFocused, block.id, block.type]);

  const renderContent = () => {
    const commonClasses =
      "outline-none min-h-[1.5em] empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/50 cursor-text";

    // Alignment - use inline style for contentEditable elements
    const alignStyle = block.props?.textAlign
      ? { textAlign: block.props.textAlign as "left" | "center" | "right" | "justify" }
      : undefined;

    // Font size classes (override default sizes if set)
    const getFontSizeClass = (size?: string) => {
      if (!size || size === "default") return "";
      const sizeMap: Record<string, string> = {
        small: "text-sm",
        large: "text-lg",
        "x-large": "text-xl",
      };
      return sizeMap[size] || "";
    };
    const fontSizeClass = getFontSizeClass(block.props?.fontSize);

    // Combine classes
    const combinedClasses = cn(
      commonClasses,
      fontSizeClass
    );

    switch (block.type) {
      case "heading-1":
        return (
          <TextEditor
            block={block}
            updateBlock={updateBlock}
            onKeyDown={onKeyDown}
            onFocus={onFocus}
            onPasteBlocks={onPasteBlocks}
            readOnly={readOnly}
            id={block.id}
            className={cn(
              "text-[2.5rem] font-bold leading-[1.2] mb-3 mt-8 text-primary tracking-tight font-serif",
              combinedClasses
            )}
            style={alignStyle}
            data-placeholder="Heading 1"
          />
        );
      case "heading-2":
        return (
          <TextEditor
            block={block}
            updateBlock={updateBlock}
            onKeyDown={onKeyDown}
            onFocus={onFocus}
            onPasteBlocks={onPasteBlocks}
            readOnly={readOnly}
            id={block.id}
            className={cn(
              "text-3xl font-semibold mb-3 mt-5 text-primary",
              combinedClasses
            )}
            style={alignStyle}
            data-placeholder="Heading 2"
          />
        );
      case "heading-3":
        return (
          <TextEditor
            block={block}
            updateBlock={updateBlock}
            onKeyDown={onKeyDown}
            onFocus={onFocus}
            onPasteBlocks={onPasteBlocks}
            readOnly={readOnly}
            id={block.id}
            className={cn(
              "text-2xl font-semibold mb-2 mt-3 text-primary",
              combinedClasses
            )}
            style={alignStyle}
            data-placeholder="Heading 3"
          />
        );
      case "bullet-list":
        return (
          <div className="flex items-start gap-3 my-1.5">
            <div className="select-none mt-2.5 h-1.5 w-1.5 rounded-full bg-foreground/70 shrink-0" />
            <TextEditor
              block={block}
              updateBlock={updateBlock}
              onKeyDown={onKeyDown}
              onFocus={onFocus}
              onPasteBlocks={onPasteBlocks}
              readOnly={readOnly}
              className={cn(combinedClasses, "flex-1 leading-relaxed")}
              style={alignStyle}
              data-placeholder="List item"
            />
          </div>
        );
      case "numbered-list":
        const listNumber = getListNumber();
        return (
          <div className="flex items-start gap-3 my-1.5">
            <div className="select-none mt-0.5 text-foreground/70 font-medium shrink-0 w-6 text-right text-[15px]">
              {listNumber}.
            </div>
            <TextEditor
              block={block}
              updateBlock={updateBlock}
              updateBlockType={updateBlockType}
              onKeyDown={onKeyDown}
              onFocus={onFocus}
              onPasteBlocks={onPasteBlocks}
              readOnly={readOnly}
              className={cn(combinedClasses, "flex-1 leading-relaxed")}
              style={alignStyle}
              data-placeholder="List item"
            />
          </div>
        );
      case "quote":
        return (
          <div className="flex gap-4 my-3 pl-4 py-1 border-l-[3px] border-foreground/70">
            <TextEditor
              block={block}
              updateBlock={updateBlock}
              onKeyDown={onKeyDown}
              onFocus={onFocus}
              onPasteBlocks={onPasteBlocks}
              readOnly={readOnly}
              className={cn(combinedClasses, "flex-1 text-[15px] italic text-foreground/80 leading-relaxed")}
              style={alignStyle}
              data-placeholder="Quote"
            />
          </div>
        );
      case "todo":
        return (
          <div className="flex items-start gap-3 my-1.5">
            <input
              type="checkbox"
              checked={!!block.metadata?.checked}
              onChange={(e) => {
                if (!readOnly) {
                  updateBlockMetadata(block.id, { ...block.metadata, checked: e.target.checked });
                }
              }}
              className="mt-1.5 h-4 w-4 rounded border-foreground/30 accent-primary cursor-pointer shrink-0"
            />
            <TextEditor
              block={block}
              updateBlock={updateBlock}
              onKeyDown={onKeyDown}
              onFocus={onFocus}
              onPasteBlocks={onPasteBlocks}
              readOnly={readOnly}
              className={cn(
                combinedClasses,
                "flex-1 leading-relaxed",
                block.metadata?.checked && "line-through text-muted-foreground"
              )}
              style={alignStyle}
              data-placeholder="To-do"
            />
          </div>
        );
      case "callout":
        if (block.metadata?.isCode) {
          return (
            <CodeBlockRenderer
              content={block.content}
              language={block.metadata?.language || ""}
              block={block}
              updateBlock={updateBlock}
              updateBlockMetadata={updateBlockMetadata}
              onKeyDown={onKeyDown}
              onFocus={onFocus}
              onPasteBlocks={onPasteBlocks}
              readOnly={readOnly}
            />
          );
        }
        if (block.metadata?.isMath) {
          return (
            <MathBlockRenderer
              content={block.content}
              block={block}
              updateBlock={updateBlock}
              onKeyDown={onKeyDown}
              onFocus={onFocus}
              readOnly={readOnly}
            />
          );
        }
        if (block.metadata?.isDiagram) {
          return (
            <MermaidRenderer
              content={block.content}
              block={block}
              updateBlock={updateBlock}
              onKeyDown={onKeyDown}
              onFocus={onFocus}
              readOnly={readOnly}
            />
          );
        }
        {
          // Determine callout style based on calloutType
          const calloutType = block.metadata?.calloutType || "default";
          const calloutStyles: Record<string, { bg: string; border: string; icon: string }> = {
            info: { bg: "bg-blue-50 dark:bg-blue-950/30", border: "border-blue-200 dark:border-blue-800", icon: "ℹ️" },
            warning: { bg: "bg-yellow-50 dark:bg-yellow-950/30", border: "border-yellow-200 dark:border-yellow-800", icon: "⚠️" },
            danger: { bg: "bg-red-50 dark:bg-red-950/30", border: "border-red-200 dark:border-red-800", icon: "🚫" },
            success: { bg: "bg-green-50 dark:bg-green-950/30", border: "border-green-200 dark:border-green-800", icon: "✅" },
            default: { bg: "bg-accent/30", border: "border-border/50", icon: "💡" },
          };
          const style = calloutStyles[calloutType] || calloutStyles.default;

          return (
            <div className={cn("flex gap-3 my-3 p-4 rounded-lg border shadow-sm", style.bg, style.border)}>
              <div className="select-none text-xl mt-0.5">{style.icon}</div>
              <TextEditor
                block={block}
                updateBlock={updateBlock}
                onKeyDown={onKeyDown}
                onFocus={onFocus}
                onPasteBlocks={onPasteBlocks}
                readOnly={readOnly}
                className={cn(combinedClasses, "flex-1 leading-relaxed")}
                style={alignStyle}
                data-placeholder="Callout"
              />
            </div>
          );
        }
      case "divider":
        return (
          <div
            className={cn(
              "py-3 select-none relative w-full"
            )}
            onClick={(e) => {
              if (!readOnly) {
                onFocus(block.id);
              }
            }}
            onKeyDown={(e) => {
              if (!readOnly) {
                if (e.key === "Delete" || e.key === "Backspace") {
                  e.preventDefault();
                  e.stopPropagation();
                  onDelete(block.id);
                } else if (e.key === "Enter" && !e.shiftKey) {
                  // Allow Enter to add a new block below the divider
                  e.preventDefault();
                  e.stopPropagation();
                  onKeyDown(e, block.id);
                } else {
                  // Pass other keys to parent handler (Arrow keys, etc.)
                  onKeyDown(e, block.id);
                }
              }
            }}
            onFocus={(e) => {
              if (!readOnly) {
                onFocus(block.id);
              }
            }}
            tabIndex={readOnly ? -1 : 0}
            role="separator"
            aria-label="Divider"
          >
            <hr className={cn(
              "w-full border-0 border-t block transition-all duration-200 my-0",
              "h-px min-h-0",
              isFocused
                ? "border-foreground/70 border-t-2"
                : "border-foreground/35 group-hover/block:border-foreground/45"
            )} />
          </div>
        );

      // New Block Types
      case "image":
      case "video":
      case "file":
        return (
          <MediaBlock
            block={block}
            updateBlock={updateBlock}
            updateBlockMetadata={updateBlockMetadata}
            onKeyDown={onKeyDown}
            onFocus={onFocus}
            readOnly={readOnly}
          />
        );
      case "table":
        return (
          <TableBlock
            block={block}
            updateBlockMetadata={updateBlockMetadata}
            onKeyDown={onKeyDown}
            onFocus={onFocus}
            readOnly={readOnly}
          />
        );

      case "toc": {
        // Auto-generated Table of Contents from headings
        const headings = allBlocks.filter(b => b.type.startsWith("heading-"));
        return (
          <div
            className="my-3 rounded-lg border border-border/60 bg-muted/30 px-4 py-3"
            tabIndex={0}
            onKeyDown={e => onKeyDown(e, block.id)}
            onFocus={() => onFocus(block.id)}
          >
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 select-none">
              Table of Contents
            </div>
            {headings.length === 0 ? (
              <div className="text-sm text-muted-foreground italic">No headings found</div>
            ) : (
              <ul className="list-none space-y-0.5 m-0 p-0">
                {headings.map(h => {
                  const level = parseInt(h.type.split("-")[1]) || 1;
                  const plainText = h.content.replace(/<[^>]+>/g, "").trim();
                  return (
                    <li key={h.id} style={{ paddingLeft: `${(level - 1) * 16}px` }}>
                      <a
                        href={`#${h.id}`}
                        className="text-sm text-blue-600 dark:text-blue-400 no-underline hover:text-blue-800 dark:hover:text-blue-300 cursor-pointer transition-colors"
                        onClick={(e) => {
                          e.preventDefault();
                          document.getElementById(h.id)?.scrollIntoView({ behavior: "smooth" });
                        }}
                      >
                        {level === 1 && "● "}
                        {level === 2 && "○ "}
                        {level === 3 && "■ "}
                        {plainText || "Untitled"}
                      </a>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      }

      default: // text
        return (
          <TextEditor
            block={block}
            updateBlock={updateBlock}
            updateBlockType={updateBlockType}
            updateBlockMetadata={updateBlockMetadata}
            updateBlockProps={updateBlockProps}
            onKeyDown={onKeyDown}
            onFocus={onFocus}
            onPasteBlocks={onPasteBlocks}
            readOnly={readOnly}
            className={cn(commonClasses, "my-1.5 leading-relaxed text-[15px]")}
            style={alignStyle}
            data-placeholder="Type '/' for commands"
          />
        );
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      id={block.id}
      className={cn(
        "group/block relative transition-all duration-200 ease-out",
        "py-1",
        isSelected && "bg-primary/5 rounded-lg shadow-sm ring-1 ring-primary/10"
      )}
    >
      <div className="relative flex items-start w-full">
        {/* Hover Drag Handle / Menu Trigger - positioned in left gutter */}
        {!readOnly && (
          <div
            ref={controlsRef}
            className="absolute -left-20 sm:-left-24 md:-left-28 opacity-0 group-hover/block:opacity-100 transition-all duration-200 ease-out flex flex-row items-center gap-1 z-10 pointer-events-auto shrink-0"
            style={{
              top: getControlsTopOffset(),
              transform: getControlsTransform()
            }}
          >
            <div
              className="p-1 hover:bg-accent/80 rounded-md cursor-pointer text-muted-foreground/50 hover:text-foreground transition-all duration-150 shadow-sm hover:shadow-md slash-menu-trigger flex items-center justify-center shrink-0 border border-transparent hover:border-border"
              onClick={e => {
                e.stopPropagation();
                // Trigger slash menu by simulating '/' keypress or direct state update
                // For now, we'll just add a block and focus it, but ideally this should open the menu
                // To match Notion, clicking + should open the menu for the NEW block
                onAddBlock(block.id);
                // We need a way to signal the editor to open the menu for the new block
                // This is handled by the Editor component watching for new blocks or explicit signals
                // But for now, let's just add the block.
                // To fully match Notion, we might need to pass a prop to open menu immediately.
              }}
              title="Click to add a block below"
            >
              <Plus className="h-6 w-6" />
            </div>
            {/* Drag Handle with Menu */}
            <BlockMenu
              blockId={block.id}
              onDelete={onDelete}
              onDuplicate={onDuplicate}
              onTransform={(id, type) => updateBlockType(id, type)}
              dragAttributes={attributes}
              dragListeners={listeners}
            />
          </div>
        )}
        {/* Content wrapper */}
        <div
          ref={contentRef}
          className="w-full"
          style={block.props?.indent ? { marginLeft: `${(block.props.indent as number) * 24}px` } : undefined}
        >
          {renderContent()}
        </div>
      </div>
    </div>
  );
};
