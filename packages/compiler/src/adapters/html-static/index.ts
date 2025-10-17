import * as fs from 'fs-extra';
import * as path from 'path';
import Handlebars from 'handlebars';
import { UniversalContent, CompileOptions, CompileResult, PlatformAdapter } from '../../types';

export class HTMLStaticAdapter implements PlatformAdapter {
  name = 'html-static';
  version = '1.0.0';

  private templates: Map<string, HandlebarsTemplateDelegate> = new Map();

  async compile(content: UniversalContent, options: CompileOptions): Promise<CompileResult> {
    const startTime = Date.now();

    try {
      // Ensure output directory exists
      await fs.ensureDir(options.output);

      // Load templates
      await this.loadTemplates();

      // Generate HTML files
      const files = await this.generateHTML(content, options);

      // Copy static assets if they exist
      await this.copyAssets(content, options);

      return {
        success: true,
        outputPath: options.output,
        files,
        errors: [],
        warnings: [],
        duration: Date.now() - startTime
      };

    } catch (error) {
      return {
        success: false,
        outputPath: options.output,
        files: [],
        errors: [(error as Error).message],
        warnings: [],
        duration: Date.now() - startTime
      };
    }
  }

  validate(content: UniversalContent): import('../../types').ValidationResult {
    const errors: any[] = [];
    const warnings: any[] = [];

    // Basic validation for HTML static generation
    if (!content.config.title) {
      warnings.push({
        section: 'config',
        field: 'title',
        message: 'No site title specified',
        code: 'MISSING_TITLE'
      });
    }

    // Check for required sections
    const requiredSections = ['hero'];
    for (const sectionId of requiredSections) {
      if (!content.sections[sectionId]) {
        errors.push({
          section: sectionId,
          field: 'content',
          message: `Required section '${sectionId}' is missing`,
          code: 'MISSING_REQUIRED_SECTION'
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  private async loadTemplates(): Promise<void> {
    // Load built-in templates
    const templateDir = path.join(__dirname, '..', '..', '..', 'src', 'adapters', 'html-static', 'templates');

    // Main layout template
    const layoutTemplate = await this.loadTemplate(path.join(templateDir, 'layout.hbs'));
    if (layoutTemplate) {
      this.templates.set('layout', layoutTemplate);
    }

    // Section templates
    const sectionTemplates = ['hero', 'features', 'services', 'pricing', 'testimonials', 'faq', 'cta', 'footer'];
    for (const templateName of sectionTemplates) {
      const template = await this.loadTemplate(path.join(templateDir, `${templateName}.hbs`));
      if (template) {
        this.templates.set(templateName, template);
      }
    }
  }

  private async loadTemplate(templatePath: string): Promise<HandlebarsTemplateDelegate | null> {
    try {
      if (await fs.pathExists(templatePath)) {
        const templateContent = await fs.readFile(templatePath, 'utf-8');
        return Handlebars.compile(templateContent);
      }
    } catch (error) {
      // Template not found or invalid
    }
    return null;
  }

  private async generateHTML(content: UniversalContent, options: CompileOptions): Promise<string[]> {
    const files: string[] = [];

    // Generate main index.html
    const indexHtml = this.generateIndexHTML(content, options);
    const indexPath = path.join(options.output, 'index.html');
    await fs.writeFile(indexPath, indexHtml);
    files.push('index.html');

    // Generate additional pages if needed
    // For now, just the main index page

    return files;
  }

  private generateIndexHTML(content: UniversalContent, options: CompileOptions): string {
    const layoutTemplate = this.templates.get('layout');
    if (!layoutTemplate) {
      throw new Error('Layout template not found');
    }

    // Prepare section data
    const sections = this.prepareSections(content);

    // Prepare template data
    const templateData = {
      site: {
        title: content.config.title || 'My Website',
        description: content.config.description,
        version: content.metadata.version
      },
      sections,
      options
    };

    return layoutTemplate(templateData);
  }

  private prepareSections(content: UniversalContent): Record<string, any> {
    const sections: Record<string, any> = {};

    for (const [sectionId, section] of Object.entries(content.sections)) {
      const template = this.templates.get(sectionId);
      if (template) {
        // Use section-specific template
        sections[sectionId] = template({
          ...section.frontmatter,
          content: this.renderMarkdown(section.content)
        });
      } else {
        // Fallback to basic rendering
        sections[sectionId] = {
          ...section.frontmatter,
          content: this.renderMarkdown(section.content)
        };
      }
    }

    return sections;
  }

  private renderMarkdown(markdown: string): string {
    // Simple markdown rendering - can be enhanced
    return markdown
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      .replace(/\n\n/gim, '</p><p>')
      .replace(/\n/gim, '<br>');
  }

  private async copyAssets(content: UniversalContent, options: CompileOptions): Promise<void> {
    const assetsDir = path.join(content.config.title ? 'Content' : './Content', 'assets');
    const outputAssetsDir = path.join(options.output, 'assets');

    try {
      if (await fs.pathExists(assetsDir)) {
        await fs.copy(assetsDir, outputAssetsDir);
      }
    } catch (error) {
      // Assets copy failed - non-critical
    }
  }
}