# 11ty (Eleventy) Data Processing Pipelines Research

## Overview
Deep dive into 11ty's data processing and content management capabilities, focusing on its data cascade system, collections, and transformation pipeline.

## Core Architecture

### Data Cascade System

11ty's most powerful feature is its hierarchical data inheritance system:

```
project/
├── _data/
│   ├── site.json          # Global site data
│   ├── navigation.json    # Navigation data
│   └── social.json        # Social media links
├── blog/
│   ├── _data/
│   │   ├── author.json    # Blog-specific data
│   │   └── tags.json      # Available tags
│   └── posts/
│       ├── _data/
│       │   └── category.json  # Post category data
│       └── my-post.md
├── about/
│   └── _data/
│       └── team.json      # Team member data
```

**Key Features:**
- **Hierarchical Inheritance**: Child directories inherit parent data
- **Multiple Formats**: JSON, YAML, JavaScript, CSV
- **Computed Data**: Dynamic data generation
- **Global Access**: Data available in all templates

### Data File Formats

#### JSON Files
```json
// _data/site.json
{
  "title": "BizQ",
  "description": "Universal Delegation Platform",
  "url": "https://bizq.com",
  "author": {
    "name": "BizQ Team",
    "email": "hello@bizq.com"
  }
}
```

#### YAML Files
```yaml
# _data/navigation.yml
- label: "Home"
  url: "/"
- label: "Features"
  url: "/features"
- label: "Pricing"
  url: "/pricing"
```

#### JavaScript Files (Computed Data)
```javascript
// _data/computed.js
module.exports = {
  // Static computed data
  buildTime: new Date().toISOString(),

  // Dynamic data
  async latestPosts() {
    const posts = await fetch('https://api.example.com/posts?limit=5');
    return posts.json();
  },

  // Computed from other data
  siteUrl() {
    return process.env.NODE_ENV === 'production'
      ? 'https://bizq.com'
      : 'http://localhost:8080';
  }
};
```

#### CSV Files
```csv
// _data/team.csv
name,email,role
John Doe,john@bizq.com,CEO
Jane Smith,jane@bizq.com,CTO
```

### Collections System

11ty's collections allow grouping and manipulating content:

```javascript
// .eleventy.js
module.exports = function(eleventyConfig) {
  // Tag-based collections
  eleventyConfig.addCollection("posts", function(collectionApi) {
    return collectionApi.getFilteredByTag("post")
      .filter(post => post.data.published !== false)
      .sort((a, b) => b.date - a.date);
  });

  // Glob-based collections
  eleventyConfig.addCollection("pages", function(collectionApi) {
    return collectionApi.getFilteredByGlob("pages/*.md");
  });

  // Custom collections
  eleventyConfig.addCollection("featuredPosts", function(collectionApi) {
    return collectionApi.getFilteredByTag("post")
      .filter(post => post.data.featured === true)
      .slice(0, 3);
  });
};
```

### Template Languages and Data Access

#### Global Data Access
Data is available in all templates via the `site` object:

```liquid
<!-- Liquid template -->
<h1>{{ site.title }}</h1>
<p>{{ site.description }}</p>

<!-- Loop through navigation -->
{% for item in site.navigation %}
  <a href="{{ item.url }}">{{ item.label }}</a>
{% endfor %}
```

```javascript
// JavaScript template
export default function(data) {
  return `
    <h1>${data.site.title}</h1>
    <p>${data.site.description}</p>
  `;
}
```

#### Page-Specific Data
Each page can have its own data file:

```yaml
# posts/my-post.md has corresponding posts/my-post.yml
title: "My Blog Post"
description: "A great post about BizQ"
published: true
tags: ["bizq", "delegation"]
```

### Content Processing Pipeline

```
Data Files → Data Cascade → Template Rendering → Output
```

#### Build Process
1. **Data Loading**: Load all `_data` files
2. **Data Cascade**: Merge hierarchical data
3. **Content Discovery**: Find all content files
4. **Frontmatter Parsing**: Extract page data
5. **Template Rendering**: Process with chosen engine
6. **Output Generation**: Write to `_site` directory

### Advanced Features

#### Custom Filters
```javascript
// .eleventy.js
module.exports = function(eleventyConfig) {
  eleventyConfig.addFilter("readingTime", function(content) {
    const wordsPerMinute = 200;
    const words = content.split(' ').length;
    return Math.ceil(words / wordsPerMinute);
  });

  eleventyConfig.addFilter("formatDate", function(date) {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  });
};

// Usage in templates
{{ post.templateContent | readingTime }} min read
{{ post.date | formatDate }}
```

#### Shortcodes
```javascript
// .eleventy.js
module.exports = function(eleventyConfig) {
  eleventyConfig.addShortcode("youtube", function(id, title) {
    return `
      <div class="video-wrapper">
        <iframe src="https://www.youtube.com/embed/${id}"
                title="${title}"
                allowfullscreen></iframe>
      </div>
    `;
  });

  eleventyConfig.addPairedShortcode("callout", function(content, type = "info") {
    return `<div class="callout callout-${type}">${content}</div>`;
  });
};

// Usage in content
{% youtube "dQw4w9WgXcQ", "Rick Roll" %}

{% callout "warning" %}
This is important information!
{% endcallout %}
```

#### Transforms
```javascript
// .eleventy.js
module.exports = function(eleventyConfig) {
  eleventyConfig.addTransform("minifyHtml", function(content, outputPath) {
    if (outputPath && outputPath.endsWith('.html')) {
      return minify(content, {
        collapseWhitespace: true,
        removeComments: true,
      });
    }
    return content;
  });
};
```

### Pagination

```javascript
// .eleventy.js
module.exports = function(eleventyConfig) {
  eleventyConfig.addCollection("posts", function(collectionApi) {
    return collectionApi.getFilteredByTag("post");
  });
};

// In templates
---
pagination:
  data: collections.posts
  size: 5
  alias: posts
permalink: "blog/page-{{ pagination.pageNumber }}/"
---

<h1>Blog - Page {{ pagination.pageNumber }}</h1>
{% for post in posts %}
  <article>
    <h2><a href="{{ post.url }}">{{ post.data.title }}</a></h2>
    <p>{{ post.data.description }}</p>
  </article>
{% endfor %}
```

### Performance Features

#### Incremental Builds
- Only rebuilds changed files
- Smart dependency tracking
- Fast development server

#### Caching
- Computed data caching
- Template compilation caching
- Asset processing caching

### Development Experience

#### File Watching
- Automatic rebuilds on file changes
- Live reload in browser
- Helpful error messages

#### Debugging
```javascript
// .eleventy.js
module.exports = function(eleventyConfig) {
  // Debug data cascade
  eleventyConfig.on('eleventy.before', () => {
    console.log('Data cascade:', eleventyConfig.data);
  });
};
```

## Source Code Analysis

### Key Files to Examine
- `src/TemplateData.js` - Data cascade implementation
- `src/TemplateCollection.js` - Collections system
- `src/Template.js` - Template processing
- `src/TemplateConfig.js` - Configuration handling

### Data Processing Flow
1. **Configuration Loading**: Parse `.eleventy.js`
2. **Data Discovery**: Find all `_data` files
3. **Data Loading**: Load and parse data files
4. **Data Cascade**: Merge hierarchical data
5. **Content Processing**: Parse frontmatter and content
6. **Template Rendering**: Apply template engines
7. **Output Writing**: Generate final files

## Lessons for Our Content System

### Adoptable Patterns
1. **Data Cascade**: Hierarchical data inheritance
2. **Multiple Data Sources**: JSON, YAML, JS, CSV support
3. **Collections API**: Flexible content grouping
4. **Template Filters**: Content transformation functions
5. **Computed Data**: Dynamic data generation

### Implementation Ideas
1. **Data Cascade System**: Implement `_data` folder hierarchy
2. **Multiple Formats**: Support JSON, YAML, JS for data
3. **Collections**: Create flexible content grouping
4. **Filters/Transforms**: Add content processing pipeline
5. **Computed Data**: Support async data loading

### Integration with Our System
```typescript
// Our content system could adopt 11ty patterns
interface DataCascade {
  global: Record<string, any>;
  section: Record<string, any>;
  page: Record<string, any>;
}

class ContentProcessor {
  private dataCascade: DataCascade = {
    global: {},
    section: {},
    page: {}
  };

  async loadDataCascade(path: string): Promise<void> {
    // Load _data files from path hierarchy
    this.dataCascade.global = await this.loadDataFile('_data/site.json');
    this.dataCascade.section = await this.loadDataFile(`${path}/_data/section.json`);
    this.dataCascade.page = await this.loadDataFile(`${path}/data.json`);
  }
}
```

This research shows 11ty has a mature and flexible data processing system that emphasizes developer experience and content organization, making it an excellent reference for enhancing our content management capabilities.