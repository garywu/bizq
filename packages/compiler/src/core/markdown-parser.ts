import { marked } from 'marked';
import matter from 'gray-matter';
import {
  ContentNode,
  ContentAST,
  SectionNode,
  HeadingNode,
  ParagraphNode,
  ListNode,
  ListItemNode,
  CodeBlockNode,
  LinkNode,
  ImageNode,
  TextNode,
  ComponentNode,
  NodeMetadata,
  ContentParser,
  ASTBuilder
} from './ast';

export class MarkdownParser implements ContentParser, ASTBuilder {
  private lineNumber = 1;
  private source = '';

  async build(content: string, path: string): Promise<ContentAST> {
    this.source = path;
    this.lineNumber = 1;

    // Parse frontmatter
    const { frontmatter, content: markdownContent } = this.parseFrontmatter(content);

    // Parse markdown content
    const nodes = await this.parse(markdownContent, path);

    // Create section node
    const sectionNode: SectionNode = {
      type: 'section',
      id: this.extractSectionId(path),
      path,
      frontmatter,
      children: nodes,
      metadata: {
        lineStart: 1,
        lineEnd: this.lineNumber,
        hasFrontmatter: Object.keys(frontmatter).length > 0,
        contentType: 'markdown'
      }
    };

    // Generate metadata
    const metadata = {
      title: frontmatter.title || this.extractTitle(nodes) || 'Untitled',
      description: frontmatter.description,
      version: frontmatter.version || '1.0.0',
      lastModified: new Date(),
      checksum: this.generateChecksum(content)
    };

    return {
      type: 'root',
      metadata,
      sections: [sectionNode]
    };
  }

  parseFrontmatter(content: string): { frontmatter: Record<string, any>; content: string } {
    try {
      const result = matter(content);
      return {
        frontmatter: result.data,
        content: result.content
      };
    } catch (error) {
      // If frontmatter parsing fails, treat everything as content
      return {
        frontmatter: {},
        content
      };
    }
  }

  async parse(markdown: string, path: string): Promise<ContentNode[]> {
    const nodes: ContentNode[] = [];
    this.source = path;
    this.lineNumber = 1;

    // Parse markdown without custom renderer for now
    const tokens = marked.lexer(markdown);

    for (const token of tokens) {
      const node = this.tokenToNode(token);
      if (node) {
        nodes.push(node);
      }
    }

    return nodes;
  }

  private tokenToNode(token: any): ContentNode | null {
    const metadata: NodeMetadata = {
      line: this.lineNumber,
      column: 0,
      source: this.source
    };

    switch (token.type) {
      case 'heading':
        return {
          type: 'heading',
          level: token.depth as 1 | 2 | 3 | 4 | 5 | 6,
          content: this.parseInline(token.text).filter(node => node.type === 'text') as TextNode[],
          metadata
        };

      case 'paragraph':
        return {
          type: 'paragraph',
          content: this.parseInline(token.text),
          metadata
        };

      case 'list':
        return {
          type: 'list',
          ordered: token.ordered,
          items: token.items.map((item: any) => ({
            type: 'listItem',
            content: this.parseInline(item.text),
            metadata: { ...metadata, line: this.lineNumber }
          })),
          metadata
        };

      case 'code':
        return {
          type: 'codeBlock',
          language: token.lang,
          content: token.text,
          metadata
        };

      case 'text':
        return {
          type: 'text',
          content: token.text,
          metadata
        };

      default:
        return null;
    }
  }

  private parseInline(text: string): ContentNode[] {
    const nodes: ContentNode[] = [];

    // Simple inline parsing - can be enhanced
    // For now, just return text nodes
    nodes.push({
      type: 'text',
      content: text,
      metadata: {
        line: this.lineNumber,
        column: 0,
        source: this.source
      }
    });

    return nodes;
  }

  validate(ast: ContentAST): import('./ast').ValidationResult {
    const errors: import('./ast').ValidationError[] = [];
    const warnings: import('./ast').ValidationWarning[] = [];

    // Basic validation rules
    for (const section of ast.sections) {
      // Check for required frontmatter
      if (!section.frontmatter.title && section.metadata.hasFrontmatter) {
        warnings.push({
          node: section as any,
          message: 'Section has frontmatter but no title',
          code: 'MISSING_TITLE',
          severity: 'warning'
        });
      }

      // Check for empty content
      if (section.children.length === 0) {
        warnings.push({
          node: section as any,
          message: 'Section has no content',
          code: 'EMPTY_SECTION',
          severity: 'warning'
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  private extractSectionId(path: string): string {
    // Extract section ID from path (e.g., "Content/sections/hero/content.md" -> "hero")
    const parts = path.split('/');
    const sectionsIndex = parts.indexOf('sections');
    if (sectionsIndex !== -1 && sectionsIndex + 1 < parts.length) {
      return parts[sectionsIndex + 1];
    }
    return 'unknown';
  }

  private extractTitle(nodes: ContentNode[]): string {
    // Find first heading
    for (const node of nodes) {
      if (node.type === 'heading' && node.level === 1) {
        return node.content.map(n => n.type === 'text' ? n.content : '').join('');
      }
    }
    return '';
  }

  private generateChecksum(content: string): string {
    // Simple checksum for content validation
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }
}

// Custom renderer for marked to track line numbers
class CustomRenderer extends marked.Renderer {
  constructor(private parser: MarkdownParser) {
    super();
  }

  // Override methods to track line numbers
  heading(text: string, level: number, raw: string): string {
    (this.parser as any).lineNumber += 1;
    return super.heading(text, level, raw);
  }

  paragraph(text: string): string {
    (this.parser as any).lineNumber += 1;
    return super.paragraph(text);
  }

  list(body: string, ordered: boolean, start: number | ''): string {
    (this.parser as any).lineNumber += body.split('\n').length;
    return super.list(body, ordered, start);
  }

  code(code: string, infostring: string | undefined, escaped: boolean): string {
    (this.parser as any).lineNumber += code.split('\n').length;
    return super.code(code, infostring, escaped);
  }
}