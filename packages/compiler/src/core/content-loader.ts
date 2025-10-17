import * as fs from 'fs-extra';
import * as path from 'path';
import * as glob from 'glob';
import matter from 'gray-matter';
import { UniversalContent, ContentSection, ContentConfig, ValidationResult } from '../types';

export class ContentLoader {
  private contentDir: string;

  constructor(contentDir: string = './Content') {
    this.contentDir = contentDir;
  }

  /**
   * Load all content from the content directory
   */
  async loadContent(): Promise<UniversalContent> {
    const config = await this.loadConfig();
    const sections = await this.loadSections(config);
    const metadata = await this.generateMetadata(sections);

    return {
      config,
      sections,
      metadata
    };
  }

  /**
   * Load content configuration from config.jsonc
   */
  private async loadConfig(): Promise<ContentConfig> {
    const configPath = path.join(this.contentDir, 'config.jsonc');

    if (!await fs.pathExists(configPath)) {
      throw new Error(`Content configuration not found at ${configPath}`);
    }

    const configContent = await fs.readFile(configPath, 'utf-8');

    // Parse JSONC (JSON with comments)
    const cleanedContent = configContent
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove /* */ comments
      .replace(/\/\/.*$/gm, ''); // Remove // comments

    try {
      return JSON.parse(cleanedContent);
    } catch (error) {
      throw new Error(`Invalid JSONC in ${configPath}: ${(error as Error).message}`);
    }
  }

  /**
   * Load all content sections based on configuration
   */
  private async loadSections(config: ContentConfig): Promise<Record<string, ContentSection>> {
    const sections: Record<string, ContentSection> = {};

    for (const [sectionId, sectionConfig] of Object.entries(config.sections)) {
      try {
        const section = await this.loadSection(sectionId, sectionConfig);
        sections[sectionId] = section;
      } catch (error) {
        console.warn(`Failed to load section ${sectionId}: ${(error as Error).message}`);
        if (sectionConfig.required) {
          throw error;
        }
      }
    }

    return sections;
  }

  /**
   * Load a single content section
   */
  private async loadSection(sectionId: string, config: any): Promise<ContentSection> {
    const sectionPath = path.join(this.contentDir, config.path);

    if (!await fs.pathExists(sectionPath)) {
      throw new Error(`Section directory not found: ${sectionPath}`);
    }

    // Look for content.md first, then content.markdown
    let contentFile = path.join(sectionPath, 'content.md');
    if (!await fs.pathExists(contentFile)) {
      contentFile = path.join(sectionPath, 'content.markdown');
      if (!await fs.pathExists(contentFile)) {
        throw new Error(`Content file not found in ${sectionPath}`);
      }
    }

    const content = await fs.readFile(contentFile, 'utf-8');
    const stats = await fs.stat(contentFile);

    // Parse frontmatter
    const { data: frontmatter, content: markdownContent } = matter(content);

    // Load additional data files if they exist
    const additionalData = await this.loadAdditionalData(sectionPath);

    return {
      id: sectionId,
      content: markdownContent.trim(),
      frontmatter: { ...frontmatter, ...additionalData },
      path: sectionPath,
      modified: stats.mtime
    };
  }

  /**
   * Load additional data files (JSON, YAML, etc.)
   */
  private async loadAdditionalData(sectionPath: string): Promise<Record<string, any>> {
    const data: Record<string, any> = {};

    // Look for data.json
    const jsonFile = path.join(sectionPath, 'data.json');
    if (await fs.pathExists(jsonFile)) {
      try {
        const jsonContent = await fs.readFile(jsonFile, 'utf-8');
        data.json = JSON.parse(jsonContent);
      } catch (error) {
        console.warn(`Failed to parse ${jsonFile}: ${(error as Error).message}`);
      }
    }

    return data;
  }

  /**
   * Generate content metadata
   */
  private async generateMetadata(sections: Record<string, ContentSection>): Promise<any> {
    const sectionCount = Object.keys(sections).length;
    const lastModified = Math.max(
      ...Object.values(sections).map(s => s.modified.getTime())
    );

    // Simple checksum based on modification times and content length
    const checksum = this.generateChecksum(sections);

    return {
      totalSections: sectionCount,
      lastModified: new Date(lastModified),
      version: '1.0.0',
      checksum
    };
  }

  /**
   * Generate a simple checksum for content validation
   */
  private generateChecksum(sections: Record<string, ContentSection>): string {
    const content = Object.values(sections)
      .map(section => `${section.id}:${section.modified.getTime()}:${section.content.length}`)
      .sort()
      .join('|');

    // Simple hash function
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return Math.abs(hash).toString(16);
  }

  /**
   * Validate loaded content against configuration
   */
  validateContent(content: UniversalContent): ValidationResult {
    const errors: any[] = [];
    const warnings: any[] = [];

    // Validate required sections
    for (const [sectionId, sectionConfig] of Object.entries(content.config.sections)) {
      if (sectionConfig.required && !content.sections[sectionId]) {
        errors.push({
          section: sectionId,
          field: 'content',
          message: `Required section '${sectionId}' is missing`,
          code: 'MISSING_REQUIRED_SECTION'
        });
      }
    }

    // Validate section content
    for (const [sectionId, section] of Object.entries(content.sections)) {
      if (!section.content.trim()) {
        warnings.push({
          section: sectionId,
          field: 'content',
          message: `Section '${sectionId}' has empty content`,
          code: 'EMPTY_CONTENT'
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
}