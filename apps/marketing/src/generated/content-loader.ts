// Content loader for Markdown files with frontmatter
// This would typically use a library like gray-matter in production

import fs from 'fs';
import path from 'path';

export interface FrontmatterData {
  title?: string;
  component?: string;
  order?: number;
  [key: string]: any;
}

export interface ParsedContent {
  frontmatter: FrontmatterData;
  content: string;
  rawContent: string;
}

// Simple frontmatter parser (basic implementation)
function parseFrontmatter(content: string): ParsedContent {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return {
      frontmatter: {},
      content: content,
      rawContent: content
    };
  }

  const frontmatterStr = match[1];
  const contentStr = match[2];

  // Simple YAML-like parser for frontmatter
  const frontmatter: FrontmatterData = {};
  const lines = frontmatterStr.split('\n');

  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.substring(0, colonIndex).trim();
      let value: any = line.substring(colonIndex + 1).trim();

      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      // Convert to number if possible
      if (!isNaN(Number(value))) {
        value = Number(value);
      }

      frontmatter[key] = value;
    }
  }

  return {
    frontmatter,
    content: contentStr,
    rawContent: content
  };
}

export async function loadContent(filePath: string): Promise<ParsedContent> {
  try {
    const fullPath = path.resolve(process.cwd(), filePath);
    const rawContent = fs.readFileSync(fullPath, 'utf-8');
    return parseFrontmatter(rawContent);
  } catch (error) {
    console.error(`Error loading content from ${filePath}:`, error);
    return {
      frontmatter: {},
      content: '',
      rawContent: ''
    };
  }
}

// Cache for loaded content
const contentCache = new Map<string, ParsedContent>();

export async function loadContentCached(filePath: string): Promise<ParsedContent> {
  if (contentCache.has(filePath)) {
    return contentCache.get(filePath)!;
  }

  const content = await loadContent(filePath);
  contentCache.set(filePath, content);
  return content;
}

// Clear cache (useful for development)
export function clearContentCache(): void {
  contentCache.clear();
}