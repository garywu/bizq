# Universal Content Compiler Architecture

## Overview

The Universal Content Compiler transforms the content folder into a platform-agnostic intermediate representation that can be compiled to any web platform (WordPress, Astro, Next.js, etc.) with any design system.

## Core Architecture

### Universal Content Format
```
Content/
├── config.jsonc          # Site structure & metadata
├── sections/             # Content sections (Markdown + frontmatter)
│   ├── hero/content.md
│   ├── features/content.md
│   └── ...
└── assets/               # Images, files
```

### Platform Adapters
Each platform gets an adapter that implements the compilation interface:

```typescript
interface PlatformAdapter {
  name: string;
  compile(content: UniversalContent): Promise<PlatformOutput>;
  validate(content: UniversalContent): ValidationResult;
}

interface UniversalContent {
  config: SiteConfig;
  sections: Record<string, ContentSection>;
  assets: AssetMap;
}

interface PlatformOutput {
  files: FileMap;
  dependencies: string[];
  buildCommands: string[];
}
```

## MVP Implementation Plan

### Phase 1: HTML Static Site Adapter (Proof of Concept)

**Goal**: Prove that content can be compiled to different output formats

#### 1. Create Adapter Interface
```typescript
// packages/compiler/src/adapters/base.ts
export abstract class BaseAdapter implements PlatformAdapter {
  abstract name: string;

  async compile(content: UniversalContent): Promise<PlatformOutput> {
    const files = await this.generateFiles(content);
    const dependencies = this.getDependencies();
    const buildCommands = this.getBuildCommands();

    return { files, dependencies, buildCommands };
  }

  abstract generateFiles(content: UniversalContent): Promise<FileMap>;
  abstract getDependencies(): string[];
  abstract getBuildCommands(): string[];
}
```

#### 2. HTML Static Adapter Implementation
```typescript
// packages/compiler/src/adapters/html-static.ts
export class HtmlStaticAdapter extends BaseAdapter {
  name = 'html-static';

  async generateFiles(content: UniversalContent): Promise<FileMap> {
    const files: FileMap = {};

    // Generate index.html
    files['index.html'] = this.generateIndexHtml(content);

    // Generate CSS
    files['styles.css'] = this.generateCss(content);

    // Copy assets
    for (const [path, asset] of Object.entries(content.assets)) {
      files[`assets/${path}`] = asset;
    }

    return files;
  }

  private generateIndexHtml(content: UniversalContent): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <title>${content.config.site.name}</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  ${Object.values(content.sections)
    .sort((a, b) => a.order - b.order)
    .map(section => this.renderSection(section))
    .join('\n')}
</body>
</html>`;
  }

  private renderSection(section: ContentSection): string {
    // Simple HTML rendering of content
    return `<section id="${section.component.toLowerCase()}">
  ${this.markdownToHtml(section.content)}
</section>`;
  }
}
```

#### 3. Compiler CLI
```typescript
// packages/compiler/src/cli.ts
import { HtmlStaticAdapter } from './adapters/html-static';
import { loadContent } from './content-loader';

export async function compile(contentPath: string, outputPath: string, adapterName: string) {
  // Load universal content
  const content = await loadContent(contentPath);

  // Select adapter
  const adapter = adapterName === 'html-static'
    ? new HtmlStaticAdapter()
    : /* other adapters */;

  // Validate content
  const validation = await adapter.validate(content);
  if (!validation.valid) {
    throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
  }

  // Compile to platform
  const output = await adapter.compile(content);

  // Write files
  await writeOutput(output, outputPath);

  console.log(`✅ Compiled to ${adapterName} in ${outputPath}`);
}
```

### Phase 2: React/Astro Adapter (Existing System Integration)

**Goal**: Make current React system an adapter

#### 1. ReactAdapter Implementation
```typescript
export class ReactAdapter extends BaseAdapter {
  name = 'react';

  async generateFiles(content: UniversalContent): Promise<FileMap> {
    const files: FileMap = {};

    // Generate content files
    files['src/generated/content.ts'] = this.generateContentTs(content);

    // Copy existing React components
    // (Current system becomes the adapter output)

    return files;
  }
}
```

### Phase 3: WordPress Adapter (Multi-Platform Proof)

**Goal**: Demonstrate cross-platform compilation

#### 1. WordPressAdapter Implementation
```typescript
export class WordPressAdapter extends BaseAdapter {
  name = 'wordpress';

  async generateFiles(content: UniversalContent): Promise<FileMap> {
    // Generate WordPress theme files
    // Convert content sections to WordPress pages
    // Create custom post types for dynamic content
  }
}
```

## Content Processing Pipeline

### 1. Content Loading
```typescript
async function loadContent(contentPath: string): Promise<UniversalContent> {
  const config = await loadConfig(`${contentPath}/config.jsonc`);
  const sections = await loadSections(`${contentPath}/sections`);
  const assets = await loadAssets(`${contentPath}/assets`);

  return { config, sections, assets };
}
```

### 2. Content Validation
```typescript
interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

function validateContent(content: UniversalContent): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required sections
  if (!content.sections.hero) {
    errors.push('Missing hero section');
  }

  // Validate section structure
  for (const [key, section] of Object.entries(content.sections)) {
    if (!section.component) {
      errors.push(`Section ${key} missing component`);
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}
```

### 3. Platform-Specific Compilation
Each adapter implements platform-specific logic for:
- **File Structure**: How files are organized
- **Content Transformation**: How content is rendered
- **Asset Handling**: How images/videos are processed
- **Build Process**: Platform-specific build commands

## Design System Integration

### Design System Definition
```typescript
interface DesignSystem {
  name: string;
  components: Record<string, ComponentDefinition>;
  styles: StyleDefinition;
  brand: BrandDefinition;
}

interface ComponentDefinition {
  template: string;  // HTML/template string
  styles: string;    // CSS classes
  props: string[];   // Required properties
}
```

### Design System Application
```typescript
function applyDesignSystem(content: UniversalContent, design: DesignSystem): UniversalContent {
  // Transform content with design system
  // Apply brand voice, component styles, etc.
  return transformedContent;
}
```

## Development Workflow

### 1. Content Authoring
```bash
# Edit content in familiar Markdown format
code Content/sections/hero/content.md
```

### 2. Platform Compilation
```bash
# Compile to different platforms
npx @bizq/compiler compile ./Content ./output/html-static --adapter html-static
npx @bizq/compiler compile ./Content ./output/wordpress --adapter wordpress
npx @bizq/compiler compile ./Content ./output/astro --adapter astro
```

### 3. Design System Application
```bash
# Apply different designs
npx @bizq/compiler compile ./Content ./output --adapter react --design enterprise
npx @bizq/compiler compile ./Content ./output --adapter react --design startup
```

## Testing Strategy

### Unit Tests
- Content loading and parsing
- Adapter validation logic
- Individual component rendering

### Integration Tests
- Full compilation pipeline
- Cross-platform output validation
- Design system application

### E2E Tests
- Generated sites load correctly
- Content renders as expected
- Platform-specific features work

## Deployment Strategy

### 1. NPM Package
```json
{
  "name": "@bizq/compiler",
  "bin": {
    "bizq-compile": "./dist/cli.js"
  }
}
```

### 2. GitHub Actions
```yaml
- name: Compile Site
  run: npx @bizq/compiler compile ./Content ./dist --adapter astro
```

### 3. Platform-Specific Deployment
- **Vercel/Netlify**: For static/JAMstack sites
- **WP Engine**: For WordPress sites
- **Railway/Render**: For full-stack apps

## Success Metrics

### Technical Metrics
- Compilation time < 30 seconds
- Output size optimization
- Cross-platform compatibility

### User Experience Metrics
- Content editing simplicity
- Platform migration ease
- Design system flexibility

### Business Metrics
- Time to deploy new sites
- Platform migration cost reduction
- Developer productivity improvement

## Future Extensions

### Advanced Features
- **Content Variants**: A/B testing support
- **Dynamic Content**: API-driven content
- **Internationalization**: Multi-language support
- **Performance Optimization**: Platform-specific optimizations

### Additional Platforms
- **Gatsby**: React-based static sites
- **Nuxt.js**: Vue-based full-stack
- **SvelteKit**: Svelte framework
- **Hugo**: Go-based static generator

### AI Integration
- **Content Generation**: AI-powered content creation
- **Platform Migration**: AI-assisted platform transitions
- **Design Adaptation**: AI-driven design system application

This architecture provides a solid foundation for the universal content compiler while starting simple with the HTML static adapter to prove the concept.