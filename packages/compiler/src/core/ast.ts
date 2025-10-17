// Abstract Syntax Tree definitions for content parsing

export interface ContentAST {
  type: 'root';
  metadata: ContentMetadata;
  sections: SectionNode[];
}

export interface ContentMetadata {
  title: string;
  description?: string;
  version: string;
  lastModified: Date;
  checksum: string;
}

export interface SectionNode {
  type: 'section';
  id: string;
  path: string;
  frontmatter: Record<string, any>;
  children: ContentNode[];
  metadata: SectionMetadata;
}

export interface SectionMetadata {
  lineStart: number;
  lineEnd: number;
  hasFrontmatter: boolean;
  contentType: 'markdown' | 'mixed';
}

export type ContentNode =
  | HeadingNode
  | ParagraphNode
  | ListNode
  | CodeBlockNode
  | LinkNode
  | ImageNode
  | TextNode
  | ComponentNode;

export interface HeadingNode {
  type: 'heading';
  level: 1 | 2 | 3 | 4 | 5 | 6;
  content: TextNode[];
  metadata: NodeMetadata;
}

export interface ParagraphNode {
  type: 'paragraph';
  content: ContentNode[];
  metadata: NodeMetadata;
}

export interface ListNode {
  type: 'list';
  ordered: boolean;
  items: ListItemNode[];
  metadata: NodeMetadata;
}

export interface ListItemNode {
  type: 'listItem';
  content: ContentNode[];
  metadata: NodeMetadata;
}

export interface CodeBlockNode {
  type: 'codeBlock';
  language?: string;
  content: string;
  metadata: NodeMetadata;
}

export interface LinkNode {
  type: 'link';
  url: string;
  title?: string;
  content: ContentNode[];
  metadata: NodeMetadata;
}

export interface ImageNode {
  type: 'image';
  src: string;
  alt: string;
  title?: string;
  metadata: NodeMetadata;
}

export interface TextNode {
  type: 'text';
  content: string;
  metadata: NodeMetadata;
}

export interface ComponentNode {
  type: 'component';
  name: string;
  props: Record<string, any>;
  children?: ContentNode[];
  metadata: NodeMetadata;
}

export interface NodeMetadata {
  line: number;
  column: number;
  source: string;
}

// AST Builder interface
export interface ASTBuilder {
  build(content: string, path: string): Promise<ContentAST>;
  validate(ast: ContentAST): ValidationResult;
}

// Content parser interface
export interface ContentParser {
  parse(markdown: string, path: string): Promise<ContentNode[]>;
  parseFrontmatter(content: string): { frontmatter: Record<string, any>; content: string };
}

// Validation result for AST
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  node: ContentNode;
  message: string;
  code: string;
  severity: 'error';
}

export interface ValidationWarning {
  node: ContentNode;
  message: string;
  code: string;
  severity: 'warning';
}