# Jinja2 Template Engine Research

## Overview
Deep dive into Jinja2's templating capabilities, focusing on its variable interpolation, control structures, and extensibility features that could inform our content processing system.

## Core Template Syntax

### Variable Interpolation

Jinja2's variable syntax is clean and powerful:

```jinja2
<!-- Simple variables -->
<h1>{{ title }}</h1>
<p>{{ description }}</p>

<!-- Object properties -->
<h2>{{ post.title }}</h2>
<span>{{ user.name }}</span>

<!-- Array access -->
<p>{{ items[0].name }}</p>
<p>{{ items[-1].name }}</p>  <!-- Last item -->

<!-- Dictionary access -->
<p>{{ config['site_name'] }}</p>
<p>{{ config.site_name }}</p>
```

### Control Structures

#### Conditionals
```jinja2
{% if user.is_admin %}
  <div class="admin-panel">Admin controls</div>
{% elif user.is_moderator %}
  <div class="mod-panel">Moderator controls</div>
{% else %}
  <div class="user-panel">User controls</div>
{% endif %}
```

#### Loops
```jinja2
<!-- Simple loop -->
<ul>
{% for item in items %}
  <li>{{ item.name }}</li>
{% endfor %}
</ul>

<!-- Loop with else -->
<ul>
{% for item in items %}
  <li>{{ item.name }}</li>
{% else %}
  <li>No items found</li>
{% endfor %}
</ul>

<!-- Loop variables -->
{% for item in items %}
  {% if not loop.first %}, {% endif %}
  {{ item.name }}
{% endfor %}

<!-- Loop controls -->
{% for item in items %}
  {% if loop.index > 5 %}...{% break %}{% endif %}
  {{ item }}
{% endfor %}
```

#### Macros (Functions)
```jinja2
{% macro render_button(text, url, style='primary') %}
  <a href="{{ url }}" class="btn btn-{{ style }}">{{ text }}</a>
{% endmacro %}

<!-- Usage -->
{{ render_button('Click me', '/action') }}
{{ render_button('Cancel', '/cancel', 'secondary') }}
```

### Filters

Jinja2 has extensive built-in filters:

```jinja2
<!-- String filters -->
{{ "hello world" | title }}          <!-- Hello World -->
{{ "hello world" | capitalize }}     <!-- Hello world -->
{{ "HELLO WORLD" | lower }}          <!-- hello world -->
{{ "hello world" | upper }}          <!-- HELLO WORLD -->

<!-- List filters -->
{{ [1,2,3,4,5] | first }}            <!-- 1 -->
{{ [1,2,3,4,5] | last }}             <!-- 5 -->
{{ [1,2,3,4,5] | length }}           <!-- 5 -->
{{ [1,2,3,4,5] | join(', ') }}       <!-- 1, 2, 3, 4, 5 -->

<!-- Number filters -->
{{ 1234.567 | round(2) }}            <!-- 1234.57 -->
{{ 1234.567 | round(0, 'floor') }}   <!-- 1234 -->

<!-- Date filters -->
{{ post.date | strftime('%B %d, %Y') }}  <!-- January 15, 2024 -->

<!-- Custom filters -->
{{ content | markdown | safe }}
```

## Advanced Features

### Template Inheritance

Jinja2's inheritance system allows creating base templates:

```jinja2
<!-- base.html -->
<!DOCTYPE html>
<html>
<head>
  <title>{% block title %}Default Title{% endblock %}</title>
  {% block head %}{% endblock %}
</head>
<body>
  <header>{% block header %}{% endblock %}</header>
  <main>{% block content %}{% endblock %}</main>
  <footer>{% block footer %}{% endblock %}</footer>
</body>
</html>

<!-- child.html -->
{% extends "base.html" %}

{% block title %}{{ post.title }}{% endblock %}

{% block content %}
  <article>
    <h1>{{ post.title }}</h1>
    <p>{{ post.content }}</p>
  </article>
{% endblock %}
```

### Include System

Modular template composition:

```jinja2
<!-- page.html -->
<div class="page">
  {% include 'header.html' %}
  <main>
    {% include 'content.html' %}
  </main>
  {% include 'footer.html' %}
</div>

<!-- With context -->
{% include 'pagination.html' with posts=page_posts %}
```

### Custom Extensions

Jinja2 is highly extensible:

```python
from jinja2 import Environment, Extension

class MyExtension(Extension):
    def __init__(self, environment):
        super().__init__(environment)
        environment.filters['custom_filter'] = self.custom_filter
        environment.tests['custom_test'] = self.custom_test

    def custom_filter(self, value):
        return value.upper()

    def custom_test(self, value):
        return value.startswith('custom')

# Usage in templates
{{ "hello" | custom_filter }}  <!-- HELLO -->
{% if value is custom_test %}...{% endif %}
```

### Environment Configuration

```python
from jinja2 import Environment, FileSystemLoader

env = Environment(
    loader=FileSystemLoader('templates'),
    autoescape=True,  # XSS protection
    trim_blocks=True,  # Remove whitespace
    lstrip_blocks=True,
    cache_size=400,  # Template caching
)

# Global variables
env.globals['site_name'] = 'My Site'
env.globals['current_year'] = 2024

# Global functions
def format_price(price):
    return f"${price:.2f}"

env.globals['format_price'] = format_price
```

## Template Processing Pipeline

```
Template Source → Lexer → Parser → AST → Compiler → Render Function
```

### Compilation Process
1. **Lexing**: Break template into tokens
2. **Parsing**: Create Abstract Syntax Tree (AST)
3. **Compilation**: Generate Python bytecode
4. **Caching**: Store compiled templates
5. **Rendering**: Execute with context data

### Performance Features
- **Template Caching**: Compiled templates cached in memory
- **Incremental Parsing**: Only parse changed templates
- **Lazy Evaluation**: Expressions evaluated only when needed
- **Memory Efficient**: Minimal memory footprint

## Integration Patterns

### With Content Management

Jinja2 works well with content systems:

```python
# Content processing with Jinja2
def render_content(content_template, context):
    template = env.from_string(content_template)
    return template.render(**context)

# Example content template
content_template = """
# {{ title }}

{{ description }}

{% if features %}
## Features
{% for feature in features %}
- {{ feature }}
{% endfor %}
{% endif %}

[Learn more]({{ url }})
"""

context = {
    'title': 'BizQ Platform',
    'description': 'Universal delegation for business operations',
    'features': ['AI Workers', 'Human Experts', 'Task Catalog'],
    'url': '/learn-more'
}

rendered = render_content(content_template, context)
```

### With Data Sources

```python
# Dynamic content loading
def load_content_with_template(content_id, context):
    # Load content from database/CMS
    content = cms.get_content(content_id)

    # Apply template if content has template field
    if content.get('template'):
        template = env.from_string(content['template'])
        content['rendered_body'] = template.render(**context)

    return content
```

## Source Code Analysis

### Key Components
- `jinja2/lexer.py` - Template tokenization
- `jinja2/parser.py` - AST generation
- `jinja2/compiler.py` - Python code generation
- `jinja2/environment.py` - Template environment
- `jinja2/filters.py` - Built-in filters

### Extension Points
- **Filters**: Transform variable output
- **Tests**: Custom conditional tests
- **Globals**: Global variables/functions
- **Extensions**: Custom syntax/tags
- **Loaders**: Custom template loading

## Lessons for Our Content System

### Adoptable Patterns
1. **Variable Interpolation**: `{{ variable }}` syntax
2. **Control Structures**: `{% if %}`, `{% for %}`
3. **Filters**: `{{ value | filter }}`
4. **Template Inheritance**: Base templates with blocks
5. **Macros**: Reusable template functions

### Implementation Ideas
1. **Content Templates**: Allow templates in content files
2. **Variable Substitution**: Support `{{ variable }}` in content
3. **Conditional Content**: `{% if condition %}` blocks
4. **Content Filters**: Transform content (markdown, etc.)
5. **Template Inheritance**: Base content with overrides

### Integration with Our System
```typescript
// Our content system could support Jinja2-like syntax
interface ContentTemplate {
  content: string;  // May contain {{ variables }} and {% if %} blocks
  context: Record<string, any>;  // Variables for interpolation
}

class ContentRenderer {
  render(content: ContentTemplate): string {
    // Parse and render template with context
    return this.processTemplate(content.content, content.context);
  }

  private processTemplate(template: string, context: any): string {
    // Handle {{ variables }}
    // Handle {% if %} conditions
    // Handle {% for %} loops
    // Apply filters
  }
}
```

This research shows Jinja2 has a mature and powerful templating system that could significantly enhance our content processing capabilities with dynamic content generation and template composition.