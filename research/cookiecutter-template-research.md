# Cookiecutter Template Research

## Overview
Analysis of Cookiecutter's project templating system, focusing on its variable substitution, hooks, and project generation capabilities that could inform our content generation system.

## Core Template System

### Variable Substitution

Cookiecutter uses Jinja2 templating with special variable syntax:

```jinja2
# cookiecutter.json
{
  "project_name": "My Project",
  "author": "John Doe",
  "version": "0.1.0"
}

# Template files use {{cookiecutter.variable_name}}
# {{cookiecutter.project_name}}/
# ├── README.md
# ├── setup.py
# └── {{cookiecutter.project_name}}/
#     └── __init__.py
```

**Key Features:**
- **Namespace**: Variables under `cookiecutter.` namespace
- **Jinja2 Syntax**: Full Jinja2 templating support
- **Context Preservation**: Variables available throughout generation

### Project Structure

Cookiecutter templates define complete project skeletons:

```
my-template/
├── cookiecutter.json          # Template variables
├── {{cookiecutter.project_slug}}/
│   ├── {{cookiecutter.project_slug}}.py
│   ├── tests/
│   │   └── test_{{cookiecutter.project_slug}}.py
│   └── docs/
│       └── index.md
├── hooks/
│   ├── pre_gen_project.py     # Pre-generation hook
│   └── post_gen_project.py    # Post-generation hook
└── README.md
```

### Template Variables

#### Basic Variables
```json
{
  "project_name": "My Awesome Project",
  "author": "Jane Smith",
  "email": "jane@example.com",
  "version": "1.0.0"
}
```

#### Dynamic Defaults
```json
{
  "project_slug": "{{ cookiecutter.project_name.lower().replace(' ', '_') }}",
  "year": "{% now 'utc', '%Y' %}",
  "license": ["MIT", "BSD-3", "GNU GPL v3.0"]
}
```

#### Choice Variables
```json
{
  "license": ["MIT", "BSD-3", "GNU GPL v3.0", "Apache Software License 2.0"],
  "python_version": ["3.8", "3.9", "3.10", "3.11"],
  "include_cli": ["y", "n"]
}
```

### Hooks System

Cookiecutter supports pre and post-generation hooks:

#### Pre-Generation Hook
```python
# hooks/pre_gen_project.py
import sys
import re

# Validate project name
project_name = '{{cookiecutter.project_name}}'
if not re.match(r'^[a-zA-Z][a-zA-Z0-9 _-]*$', project_name):
    print("ERROR: Invalid project name")
    sys.exit(1)

# Check if directory already exists
import os
if os.path.exists('{{cookiecutter.project_slug}}'):
    print("ERROR: Directory already exists")
    sys.exit(1)
```

#### Post-Generation Hook
```python
# hooks/post_gen_project.py
import os
import subprocess

# Initialize git repository
subprocess.call(['git', 'init'])
subprocess.call(['git', 'add', '.'])
subprocess.call(['git', 'commit', '-m', 'Initial commit'])

# Install dependencies
if '{{cookiecutter.include_cli}}' == 'y':
    subprocess.call(['pip', 'install', '-e', '.'])

# Remove unnecessary files
if '{{cookiecutter.license}}' != 'MIT':
    os.remove('LICENSE-MIT')
```

### Advanced Features

#### Conditional File Inclusion

Files can be conditionally included based on variables:

```
my-template/
├── cookiecutter.json
├── {{cookiecutter.project_slug}}/
│   ├── core.py
{% if cookiecutter.include_cli == 'y' -%}
│   ├── cli.py
{% endif -%}
{% if cookiecutter.include_tests == 'y' -%}
│   └── tests/
│       └── test_core.py
{% endif -%}
```

#### Directory Variables

Dynamic directory names:

```json
{
  "project_name": "My Project",
  "project_slug": "{{cookiecutter.project_name|lower|replace(' ', '_')}}"
}
```

Template structure:
```
{{cookiecutter.project_slug}}/
├── {{cookiecutter.project_slug}}.py
└── tests/
    └── test_{{cookiecutter.project_slug}}.py
```

### Context Processing

#### Variable Resolution Order
1. **User Input**: Values provided by user
2. **Dynamic Defaults**: Computed from other variables
3. **Static Defaults**: Values in cookiecutter.json
4. **Built-in Filters**: Jinja2 filters

#### Context Injection
```python
from cookiecutter.main import cookiecutter

# Generate project with custom context
cookiecutter(
    'template/',
    no_input=True,
    extra_context={
        'project_name': 'Custom Project',
        'author': 'Custom Author'
    }
)
```

### Template Engine Integration

Cookiecutter uses Jinja2 with custom extensions:

```python
from cookiecutter.environment import StrictEnvironment

# Custom environment with additional filters
env = StrictEnvironment()
env.filters['slugify'] = lambda x: x.lower().replace(' ', '-')
```

### Generation Process

```
Template Discovery → Variable Collection → Pre-Hooks → File Generation → Post-Hooks → Cleanup
```

#### Detailed Flow
1. **Template Loading**: Read cookiecutter.json and template files
2. **Variable Collection**: Prompt user or use defaults
3. **Context Building**: Resolve dynamic variables
4. **Pre-Generation**: Run pre_gen_project.py
5. **File Processing**: Apply Jinja2 templating to all files
6. **Directory Creation**: Create output directory structure
7. **Post-Generation**: Run post_gen_project.py
8. **Cleanup**: Remove template artifacts

### Performance Features

#### Incremental Generation
- Only processes changed template files
- Caches parsed templates
- Efficient variable resolution

#### Memory Management
- Streams large files during generation
- Minimal memory footprint
- Garbage collection of temporary data

## Source Code Analysis

### Key Components
- `cookiecutter/main.py` - Main generation logic
- `cookiecutter/generate.py` - File generation
- `cookiecutter/prompt.py` - User interaction
- `cookiecutter/hooks.py` - Hook execution
- `cookiecutter/environment.py` - Jinja2 environment

### Extension Points
- **Hooks**: Custom pre/post generation logic
- **Filters**: Additional Jinja2 filters
- **Prompts**: Custom user input methods
- **Environment**: Custom Jinja2 configuration

## Lessons for Our Content System

### Adoptable Patterns
1. **Variable Substitution**: `{{cookiecutter.variable}}` syntax
2. **Dynamic Defaults**: Computed variables
3. **Conditional Content**: `{% if %}` blocks
4. **Hooks System**: Pre/post processing
5. **Template Inheritance**: Base templates with customization

### Implementation Ideas
1. **Content Variables**: Support `{{variable}}` in content
2. **Dynamic Content**: Computed content from other data
3. **Conditional Sections**: Show/hide content based on context
4. **Content Hooks**: Pre/post processing of content
5. **Content Templates**: Reusable content patterns

### Integration with Our System
```typescript
// Our content system could adopt Cookiecutter patterns
interface ContentTemplate {
  variables: Record<string, any>;  // Template variables
  content: string;  // May contain {{variable}} placeholders
  hooks?: {
    preRender?: (context: any) => void;
    postRender?: (result: string) => string;
  };
}

class ContentGenerator {
  async generate(template: ContentTemplate, context: any = {}): Promise<string> {
    // Run pre-render hooks
    if (template.hooks?.preRender) {
      template.hooks.preRender({ ...template.variables, ...context });
    }

    // Substitute variables
    let result = this.substituteVariables(template.content, {
      ...template.variables,
      ...context
    });

    // Run post-render hooks
    if (template.hooks?.postRender) {
      result = template.hooks.postRender(result);
    }

    return result;
  }

  private substituteVariables(content: string, variables: any): string {
    // Replace {{variable}} with values
    // Support Jinja2-like syntax
  }
}
```

This research shows Cookiecutter has a sophisticated project generation system that could inspire dynamic content generation with variables, conditionals, and processing hooks.