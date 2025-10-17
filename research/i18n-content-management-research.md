# i18n and Content Management Research

## Overview
Researching internationalization (i18n) concepts and libraries to inform our content management system design. The parallels between i18n and content management are striking - both deal with managing different "versions" of content for different contexts.

## Key i18n Concepts

### 1. **Translation Keys**
- Unique identifiers for translatable strings
- Example: `hero.title`, `features.subtitle`
- Allows content to be referenced by key rather than hardcoded values

### 2. **Namespaces**
- Grouping related translations
- Example: `common`, `hero`, `features`, `pricing`
- Maps well to our section-based content structure

### 3. **Interpolation**
- Dynamic content insertion: `Hello {{name}}`
- Useful for personalized content or dynamic data

### 4. **Pluralization**
- Handling singular/plural forms based on count
- Example: `{{count}} item(s)`

### 5. **Fallbacks**
- Default language/content when translation missing
- Graceful degradation

## Popular i18n Libraries

### React i18next
```javascript
// Translation files
{
  "hero": {
    "title": "Welcome to BizQ",
    "subtitle": "Transform your business operations"
  },
  "features": {
    "title": "Amazing Features"
  }
}

// Usage
const { t } = useTranslation();
return <h1>{t('hero.title')}</h1>;
```

**Key Features:**
- React integration
- Namespaces
- Interpolation
- Pluralization
- Fallbacks
- Hot reloading in development

### Lingui
```javascript
// Extracted from code
t`Hello ${name}!`

// Generated catalog
{
  "Hello {name}!": "Hello {name}!",
  "features.title": "Amazing Features"
}
```

**Key Features:**
- Compile-time extraction
- TypeScript support
- Smaller bundle size
- CLI tools for extraction/management

### React Intl (FormatJS)
```javascript
<FormattedMessage
  id="hero.title"
  defaultMessage="Welcome to BizQ"
  values={{ name }}
/>
```

**Key Features:**
- ICU message format
- Rich formatting (dates, numbers, currencies)
- React components
- Good for complex formatting needs

## Parallels to Our Content System

### 1. **Translation Keys = Content Keys**
Our current system uses component names as keys. We could extend this to:
```
hero.title
hero.subtitle
features.title
features.items.0.title
```

### 2. **Namespaces = Content Sections**
```
hero: { title, subtitle, cta }
features: { title, items[] }
pricing: { plans[] }
```

### 3. **Locales = Content Variants**
Instead of languages, we could have:
- `en` - English content
- `enterprise` - Enterprise-focused messaging
- `startup` - Startup-focused messaging
- `ab-test-a` / `ab-test-b` - A/B test variants

### 4. **Interpolation = Dynamic Content**
```
hero.title: "Welcome to {{productName}}"
pricing.cta: "Start your {{trialLength}} day trial"
```

## Proposed Architecture Evolution

### 1. **Content Keys System**
Extend our current frontmatter to include translation-like keys:

```yaml
---
component: Hero
keys:
  title: hero.title
  subtitle: hero.subtitle
  cta.primary: hero.cta.primary
  cta.secondary: hero.cta.secondary
---

# Content here uses the keys...
```

### 2. **Content Variants**
Support multiple content files per section:

```
Content/sections/hero/
├── content.en.md      # English
├── content.enterprise.md  # Enterprise variant
└── content.startup.md     # Startup variant
```

### 3. **Content Resolution**
Similar to i18n fallback chains:
1. Try specific variant (e.g., `enterprise`)
2. Fall back to default (`en`)
3. Fall back to component defaults

### 4. **Dynamic Content Injection**
Support interpolation in content:
```markdown
Welcome to **{{productName}}** - the {{tagline}}
```

## Implementation Ideas

### 1. **Content Loader Enhancement**
```typescript
interface ContentVariant {
  locale: string;
  content: ParsedContent;
}

class ContentManager {
  loadContentWithVariants(section: string): ContentVariant[] {
    // Load all variants for a section
  }

  resolveContent(section: string, variant: string = 'default'): ParsedContent {
    // Resolve with fallback chain
  }
}
```

### 2. **Component Integration**
```typescript
// Instead of hardcoded content
const heroContent = useContent('hero', 'enterprise');

// With interpolation
const personalizedContent = interpolateContent(heroContent, {
  productName: 'BizQ',
  tagline: 'Universal Delegation Platform'
});
```

### 3. **Build-time Generation**
Generate type-safe content accessors:
```typescript
// Auto-generated
export const content = {
  hero: {
    title: 'Welcome to BizQ',
    subtitle: 'Transform your business operations'
  },
  features: {
    title: 'Amazing Features'
  }
};
```

## Benefits

1. **Content Variants**: Support A/B testing, enterprise vs. startup messaging
2. **Dynamic Content**: Personalized messaging based on user context
3. **Type Safety**: Compile-time checking of content keys
4. **Developer Experience**: Similar to i18n workflows developers know
5. **Scalability**: Easy to add new content variants without code changes

## Next Steps

1. Implement content keys system in frontmatter
2. Add support for content variants
3. Create interpolation system
4. Build content resolution with fallbacks
5. Generate type-safe content accessors
6. Add CLI tools for content management

This approach would make our content system much more powerful and flexible, borrowing proven patterns from the i18n ecosystem.