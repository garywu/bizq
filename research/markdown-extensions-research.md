# Markdown Extensions Research

## Overview
Research into various Markdown extensions and flavors, focusing on MDX, Obsidian-flavored Markdown, and other enhanced Markdown formats that could inform our content processing system.

## Core Markdown Extensions

### MDX (Markdown + JSX)

MDX allows embedding JSX in Markdown, creating interactive documentation:

```mdx
# My Component

Here's some text with a **component**:

<Button onClick={handleClick}>
  Click me!
</Button>

And here's a chart:

<Chart data={data} />
```

**Key Features:**
- **JSX Components**: Embed React components in Markdown
- **Props**: Pass data to components via props
- **Imports**: Import components at the top of files
- **Expressions**: Use JavaScript expressions in content

#### MDX Processing Pipeline
```
MDX Source → MDX Parser → AST → JSX Generation → React Component
```

#### Example Implementation
```javascript
import { compile } from '@mdx-js/mdx'

const mdxContent = `
# Hello World

<Button>Click me</Button>
`

const result = await compile(mdxContent, {
  jsx: true,
  providerImportSource: '@mdx-js/react'
})
```

### Obsidian-Flavored Markdown

Obsidian extends Markdown with knowledge management features:

#### Core Extensions

##### 1. Wikilinks
```markdown
[[Internal Link]]
[[Link|Display Text]]
[[Link#Heading]]
[[Link#^block-id]]
```

##### 2. Frontmatter
```yaml
---
title: My Note
tags: [tag1, tag2]
created: 2024-01-15
---

Content here...
```

##### 3. Block IDs
```markdown
This is a paragraph ^block-id

- List item ^list-item
```

##### 4. Callouts
```markdown
> [!info] Info Callout
> This is an info message

> [!warning] Warning
> Be careful!

> [!tip] Tip
> Here's a helpful tip
```

##### 5. Comments
```markdown
%% This is a comment %%
```

##### 6. Embeds
```markdown
![[Embedded Note]]
![[Image.png]]
![[Audio.mp3]]
```

##### 7. Math (KaTeX)
```markdown
$$ \int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi} $$

Inline math: $E = mc^2$
```

##### 8. Highlighting
```markdown
==highlighted text==
```

##### 9. Strikethrough
```markdown
~~strikethrough text~~
```

#### Plugin System

Obsidian's plugin architecture allows extending functionality:

##### Core Plugin Types
- **Editor Plugins**: Modify editing behavior
- **View Plugins**: Add new views/panes
- **Theme Plugins**: Change appearance
- **Core Plugins**: Built-in functionality

##### Dataview Plugin
Dataview creates dynamic views from note metadata:

```javascript
// Query all notes with tag "project"
dv.list(dv.pages("#project").file.name)

// Create tables from frontmatter
dv.table(["Name", "Status", "Due"],
  dv.pages("#task")
    .where(p => p.status == "in-progress")
    .map(p => [p.file.name, p.status, p.due])
)
```

### Other Markdown Extensions

#### GitHub Flavored Markdown (GFM)

```markdown
<!-- Tables -->
| Feature | Status |
|---------|--------|
| Tables  | ✅     |

<!-- Task Lists -->
- [x] Completed task
- [ ] Incomplete task

<!-- Code Blocks with Syntax Highlighting -->
```javascript
console.log("Hello World");
```

<!-- Strikethrough -->
~~deleted text~~
```

#### CommonMark

Standardized Markdown specification with predictable parsing.

#### MultiMarkdown

Extensions for:
- Tables
- Footnotes
- Citations
- Cross-references
- Math
- Definition lists

#### Pandoc Markdown

Extensive extensions for academic writing:
- Citations and bibliographies
- Cross-references
- Figure/table captions
- Metadata blocks
- Raw HTML/LaTeX

### Advanced Markdown Features

#### Frontmatter Variants

##### YAML Frontmatter (Jekyll/Hugo)
```yaml
---
title: "My Post"
date: 2024-01-15
tags: [web, markdown]
---

Content...
```

##### TOML Frontmatter
```toml
+++
title = "My Post"
date = 2024-01-15
tags = ["web", "markdown"]
+++

Content...
```

##### JSON Frontmatter
```json
{
  "title": "My Post",
  "date": "2024-01-15",
  "tags": ["web", "markdown"]
}
---
Content...
```

#### Custom Syntax Extensions

##### Admonitions (MkDocs)
```markdown
!!! note "Custom Title"
    This is a note with a custom title.

!!! warning
    This is a warning.
```

##### Attributes
```markdown
{#identifier}
{.class}
{key=value}
```

##### Footnotes
```markdown
Here's some text with a footnote.[^1]

[^1]: This is the footnote.
```

##### Abbreviations
```markdown
*[HTML]: HyperText Markup Language
*[CSS]: Cascading Style Sheets

HTML and CSS are web technologies.
```

### Processing Libraries

#### Remark (Unified Ecosystem)
```javascript
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkHtml from 'remark-html'

const processor = unified()
  .use(remarkParse)
  .use(remarkHtml)

const result = await processor.process('# Hello World')
```

#### Rehype (HTML Processing)
```javascript
import { unified } from 'unified'
import rehypeParse from 'rehype-parse'
import rehypeStringify from 'rehype-stringify'

const processor = unified()
  .use(rehypeParse)
  .use(rehypeStringify)
```

#### MDX Processing
```javascript
import { compile } from '@mdx-js/mdx'
import { createProcessor } from '@mdx-js/esbuild'

const result = await compile('# Hello', {
  outputFormat: 'function-body'
})
```

### Integration Patterns

#### Content Processing Pipeline
```
Source MD → Parse → Transform → Render → Output
```

#### Plugin Architecture
```javascript
const processor = unified()
  .use(remarkParse)
  .use(remarkFrontmatter)
  .use(remarkGfm)        // GitHub Flavored Markdown
  .use(remarkMath)       // Math support
  .use(remarkToc)        // Table of contents
  .use(remarkHtml)
```

#### Custom Plugins
```javascript
function myPlugin() {
  return (tree) => {
    // Transform AST
    visit(tree, 'text', (node) => {
      node.value = node.value.replace(/:smile:/g, '😊')
    })
  }
}
```

## Lessons for Our Content System

### Adoptable Patterns
1. **Frontmatter**: YAML metadata for content configuration
2. **Custom Syntax**: Domain-specific extensions
3. **Plugin Architecture**: Extensible processing pipeline
4. **Component Embedding**: MDX-style component integration
5. **Query Systems**: Dataview-style dynamic content

### Implementation Ideas
1. **Extended Frontmatter**: Support for component props and metadata
2. **Custom Markdown**: Domain-specific syntax for BizQ content
3. **Component Integration**: Embed React components in content
4. **Dynamic Queries**: Generate content from data relationships
5. **Plugin System**: Extensible content processing

### Integration with Our System
```typescript
// Extended content processing
interface ExtendedContent {
  frontmatter: Record<string, any>;
  content: string;
  components?: string[];  // Embedded components
  queries?: string[];     // Dynamic queries
}

class ExtendedMarkdownProcessor {
  async process(content: string): Promise<ExtendedContent> {
    // Parse frontmatter
    // Extract embedded components
    // Process custom syntax
    // Generate dynamic content
  }
}
```

This research shows the rich ecosystem of Markdown extensions that could significantly enhance our content processing capabilities with interactive components, custom syntax, and dynamic content generation.