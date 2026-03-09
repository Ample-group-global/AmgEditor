export type BlockType =
  | "text"
  | "heading-1"
  | "heading-2"
  | "heading-3"
  | "bullet-list"
  | "numbered-list"
  | "todo"
  | "quote"
  | "divider"
  | "callout"
  | "image"
  | "video"
  | "file"
  | "table"
  | "toc";

export interface Block {
  id: string;
  type: BlockType;
  content: string;
  children?: Block[];
  metadata?: Record<string, any>;
  props?: {
    textColor?: string;
    backgroundColor?: string;
    [key: string]: any;
  };
}


export function generateUUID(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export const createBlock = (
  type: BlockType = "text",
  content: string = ""
): Block => {
  return {
    id: generateUUID(),
    type,
    content,
    metadata: {},
  };
};

export const initialBlocks: Block[] = [createBlock("text", "")];
