import { cn, getVideoEmbedInfo } from "@/lib/utils";
import { Block, BlockType } from "@/lib/editor-types";
import {
  Image as ImageIcon,
  Video,
  File,
  Upload,
  X,
  Link as LinkIcon,
  ExternalLink,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from "lucide-react";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Resizable } from "re-resizable";

interface MediaBlockProps {
  block: Block;
  updateBlock: (id: string, content: string) => void;
  updateBlockMetadata: (id: string, metadata: any) => void;
  onKeyDown: (e: React.KeyboardEvent, id: string) => void;
  onFocus: (id: string) => void;
  readOnly?: boolean;
}

export function MediaBlock({
  block,
  updateBlock,
  updateBlockMetadata,
  onKeyDown,
  onFocus,
  readOnly = false,
}: MediaBlockProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showCaptionInput, setShowCaptionInput] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const metadata = block.metadata || {};
  const hasContent = block.content && block.content.length > 0;
  const isUrl = block.content.startsWith("http");

  // For video blocks, check if URL needs embed detection (if metadata doesn't have it)
  const videoEmbedInfo =
    block.type === "video" && hasContent && !metadata.isEmbed && !metadata.embedUrl
      ? getVideoEmbedInfo(block.content)
      : null;

  // Use embed info from metadata or detected info
  const shouldUseEmbed =
    block.type === "video" &&
    hasContent &&
    (metadata.isEmbed || videoEmbedInfo?.isEmbed);
  const embedUrl =
    block.type === "video" && hasContent
      ? metadata.embedUrl || videoEmbedInfo?.embedUrl || null
      : null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      setUploadProgress(0);
      
      // Simulate upload progress
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      // In a real app, we would upload to a server here.
      // For this demo, we'll create a local object URL.
      setTimeout(() => {
        const url = URL.createObjectURL(file);
        updateBlock(block.id, url);
        updateBlockMetadata(block.id, {
          ...metadata,
          fileName: file.name,
          fileSize: (file.size / 1024).toFixed(1) + " KB",
          fileType: file.type,
          isLocal: true,
        });
        setUploadProgress(100);
        setTimeout(() => {
          setIsUploading(false);
          setUploadProgress(0);
        }, 500);
        clearInterval(interval);
      }, 1000);
    }
  };

  const handleUrlSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const url = formData.get("url") as string;
    if (url) {
      // For video blocks, check if it's a video hosting service
      if (block.type === "video") {
        const embedInfo = getVideoEmbedInfo(url);
        updateBlock(block.id, url); // Store original URL
        updateBlockMetadata(block.id, {
          ...metadata,
          isLocal: false,
          isEmbed: embedInfo.isEmbed,
          embedUrl: embedInfo.embedUrl,
        });
      } else {
        updateBlock(block.id, url);
        updateBlockMetadata(block.id, { ...metadata, isLocal: false });
      }
    }
  };

  const handleCaptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateBlockMetadata(block.id, { ...metadata, caption: e.target.value });
  };

  const handleReferenceLinkChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    updateBlockMetadata(block.id, {
      ...metadata,
      referenceLink: e.target.value,
    });
  };

  const clearContent = () => {
    updateBlock(block.id, "");
    updateBlockMetadata(block.id, {});
  };

  const handleResizeStop = (e: any, direction: any, ref: any, d: any) => {
    const newWidth = ref.offsetWidth;
    const containerWidth = ref.parentElement?.offsetWidth || 1;
    const widthPercent = (newWidth / containerWidth) * 100;
    
    updateBlockMetadata(block.id, {
      ...metadata,
      pixelWidth: `${newWidth}px`,
      width: `${widthPercent}%`,
    });
  };

  const setAlignment = (align: "left" | "center" | "right") => {
    updateBlockMetadata(block.id, { ...metadata, align });
  };

  const alignment = metadata.align || "center";
  const alignClass =
    alignment === "left"
      ? "mr-auto"
      : alignment === "right"
        ? "ml-auto"
        : "mx-auto";

  if (hasContent) {
    return (
      <div
        className={cn(
          "relative group my-2 flex flex-col",
          alignment === "left"
            ? "items-start"
            : alignment === "right"
              ? "items-end"
              : "items-center"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Media Content */}
        <div
          className={cn(
            "relative",
            block.type === "file" || block.type === "video" ? "w-full" : "w-auto"
          )}
        >
          {block.type === "file" ? (
            <div className="rounded-md overflow-hidden border bg-muted/10 relative w-full">
              <div className="p-4 flex items-center gap-3 bg-card">
                <div className="p-2 bg-muted rounded-md">
                  <File className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">
                    {metadata.fileName ||
                      block.content.split("/").pop() ||
                      "File"}
                  </div>
                  <div className="text-xs text-muted-foreground flex gap-2">
                    {metadata.fileSize && <span>{metadata.fileSize}</span>}
                    {metadata.isLocal ? "Uploaded" : "External URL"}
                  </div>
                </div>
                <a
                  href={block.content}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 hover:bg-muted rounded-md text-muted-foreground hover:text-primary"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
              {/* Remove Button for File */}
              {isHovered && !readOnly && (
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute top-2 right-2 h-6 w-6 rounded-full opacity-80 hover:opacity-100"
                  onClick={clearContent}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          ) : (
            <Resizable
              size={{ width: metadata.pixelWidth || (block.type === "video" ? "100%" : "100%"), height: "auto" }}
              onResizeStop={handleResizeStop}
              maxWidth="100%"
              minWidth="20%"
              enable={
                readOnly
                  ? {}
                  : {
                      top: false,
                      right: true,
                      bottom: false,
                      left: true,
                      topRight: false,
                      bottomRight: false,
                      bottomLeft: false,
                      topLeft: false,
                    }
              }
              className={cn(
                "relative rounded-md overflow-hidden border bg-muted/10",
                alignClass
              )}
              handleClasses={{
                right:
                  "w-2 bg-primary/50 hover:bg-primary opacity-0 group-hover:opacity-100 transition-opacity cursor-col-resize h-1/2 top-1/4 rounded-full right-1 absolute z-10",
                left: "w-2 bg-primary/50 hover:bg-primary opacity-0 group-hover:opacity-100 transition-opacity cursor-col-resize h-1/2 top-1/4 rounded-full left-1 absolute z-10",
              }}
            >
              {block.type === "image" && (
                <img
                  src={block.content}
                  alt="Uploaded content"
                  className="w-full h-auto object-contain"
                />
              )}

              {block.type === "video" && (
                <>
                  {shouldUseEmbed && embedUrl ? (
                    <iframe
                      src={embedUrl}
                      className="w-full"
                      style={{ aspectRatio: "16/9", minHeight: "315px" }}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title="Video player"
                    />
                  ) : (
                    <video controls className="w-full h-auto">
                      <source src={block.content} />
                      Your browser does not support the video tag.
                    </video>
                  )}
                </>
              )}

              {/* Remove Button */}
              {isHovered && !readOnly && (
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute top-2 right-2 h-6 w-6 rounded-full opacity-80 hover:opacity-100 z-20"
                  onClick={clearContent}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}

              {/* Alignment Controls */}
              {isHovered && !readOnly && (
                <div className="absolute top-2 left-2 flex gap-1 bg-background/80 backdrop-blur-sm rounded-md border shadow-sm p-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                  <Button
                    variant={alignment === "left" ? "secondary" : "ghost"}
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setAlignment("left")}
                  >
                    <AlignLeft className="h-3 w-3" />
                  </Button>
                  <Button
                    variant={alignment === "center" ? "secondary" : "ghost"}
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setAlignment("center")}
                  >
                    <AlignCenter className="h-3 w-3" />
                  </Button>
                  <Button
                    variant={alignment === "right" ? "secondary" : "ghost"}
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setAlignment("right")}
                  >
                    <AlignRight className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </Resizable>
          )}
        </div>

        {/* Caption & Reference */}
        <div className="mt-1 text-sm text-muted-foreground">
          {metadata.caption || (showCaptionInput && !readOnly) ? (
            <div className="flex flex-col gap-1">
              <input
                className="bg-transparent border-none outline-none w-full placeholder:text-muted-foreground/50 text-center text-xs"
                placeholder={readOnly ? "" : "Write a caption..."}
                value={metadata.caption || ""}
                onChange={handleCaptionChange}
                onFocus={() => !readOnly && setShowCaptionInput(true)}
                onBlur={() => !metadata.caption && setShowCaptionInput(false)}
                readOnly={readOnly}
                disabled={readOnly}
              />
              {metadata.referenceLink && (
                <a
                  href={metadata.referenceLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-500 hover:underline flex items-center justify-center gap-1"
                >
                  <LinkIcon className="h-3 w-3" />
                  {metadata.referenceLink}
                </a>
              )}
            </div>
          ) : (
            <div className="h-2" /> // Spacer for hover target
          )}

          {/* Hover Actions for Caption/Reference */}
          {isHovered && !showCaptionInput && !metadata.caption && !readOnly && (
            <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs bg-background/80 backdrop-blur-sm border shadow-sm"
                onClick={() => setShowCaptionInput(true)}
              >
                Add caption
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card className="my-2">
      <CardContent className="p-4">
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="w-full grid grid-cols-2 mb-4">
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="embed">Embed Link</TabsTrigger>
          </TabsList>

          <TabsContent
            value="upload"
            className="flex flex-col items-center justify-center gap-4 py-8"
          >
            <div className="p-4 bg-muted rounded-full">
              {block.type === "image" && (
                <ImageIcon className="h-6 w-6 text-muted-foreground" />
              )}
              {block.type === "video" && (
                <Video className="h-6 w-6 text-muted-foreground" />
              )}
              {block.type === "file" && (
                <File className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <div className="text-center">
              <div className="font-medium">Upload {block.type}</div>
              <div className="text-xs text-muted-foreground mt-1">
                Click to browse your computer
              </div>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? "Uploading..." : "Choose File"}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Select a file to upload
              </TooltipContent>
            </Tooltip>
            {isUploading && (
              <div className="w-full max-w-xs">
                <Progress value={uploadProgress} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  {uploadProgress}% uploaded
                </p>
              </div>
            )}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept={
                block.type === "image"
                  ? "image/*"
                  : block.type === "video"
                    ? "video/*"
                    : "*/*"
              }
              onChange={handleFileUpload}
            />
        </TabsContent>

        <TabsContent value="embed">
          <form onSubmit={handleUrlSubmit} className="flex gap-2">
            <Input
              name="url"
              placeholder={`Paste ${block.type} link...`}
              className="flex-1"
              autoFocus
            />
            <Button type="submit">Embed</Button>
          </form>
          <div className="text-xs text-muted-foreground mt-2">
            {block.type === "video"
              ? "Works with YouTube, Vimeo, Loom, Dailymotion, or direct video file links."
              : `Works with any link to an ${block.type} file.`}
          </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
