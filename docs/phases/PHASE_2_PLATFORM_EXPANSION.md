# Phase 2: Platform Expansion

## Overview
**Timeline**: Months 3-4 (8 weeks)
**Goal**: Add WordPress and Astro adapters, enhance design systems
**Status**: 📋 Planned
**Dependencies**: Phase 1 MVP completion

## Objectives
Expand platform support beyond HTML static sites and create a rich design system ecosystem.

## Month 1: WordPress Adapter (Weeks 1-4)

### Deliverables

#### 1. WordPress Theme Generation
**Files to create:**
- `packages/compiler/src/adapters/wordpress/index.ts` - Main adapter
- `packages/compiler/src/adapters/wordpress/theme-generator.ts` - Theme generation
- `packages/compiler/src/adapters/wordpress/templates/` - WordPress templates

**Features:**
- Generate complete WordPress theme
- Custom post types for content sections
- Advanced Custom Fields integration
- Theme customization options

#### 2. Gutenberg Block Integration
**Files to create:**
- `packages/compiler/src/adapters/wordpress/blocks/` - Block generation
- `packages/compiler/src/adapters/wordpress/block-editor.ts` - Block editor integration

**Features:**
- Custom Gutenberg blocks for content sections
- Block patterns and reusable blocks
- Block editor compatibility
- Visual editing experience

#### 3. WordPress-Specific Features
**Features:**
- SEO optimization (Yoast integration)
- Performance optimization (caching, minification)
- Security hardening
- Multi-language support (WPML integration)

### Technical Implementation

#### WordPress Theme Structure
```
wordpress-theme/
├── functions.php          # Theme functions and setup
├── index.php             # Main template
├── style.css             # Theme stylesheet
├── templates/            # Custom page templates
│   ├── page-home.php
│   ├── page-about.php
│   └── ...
├── blocks/               # Custom Gutenberg blocks
│   ├── hero/
│   ├── features/
│   └── ...
└── assets/               # Compiled CSS/JS
```

#### Content Mapping
```php
// Custom post types for content sections
register_post_type('ucc_hero', [
    'labels' => ['name' => 'Hero Sections'],
    'public' => true,
    'supports' => ['title', 'editor', 'custom-fields']
]);
```

## Month 2: Astro Adapter + Design Systems (Weeks 5-8)

### Deliverables

#### 1. Astro Content Collections
**Files to create:**
- `packages/compiler/src/adapters/astro/index.ts` - Main adapter
- `packages/compiler/src/adapters/astro/collections.ts` - Content collections
- `packages/compiler/src/adapters/astro/pages/` - Page generation

**Features:**
- Astro content collections integration
- Island architecture support
- Static generation optimization
- Component-based page generation

#### 2. Enhanced Design System
**Files to create:**
- `packages/compiler/src/design-systems/index.ts` - Design system engine
- `packages/compiler/src/design-systems/brand-voices/` - Brand implementations
- `packages/compiler/src/design-systems/components/` - Component library

**Features:**
- Multiple brand voices (Enterprise, Startup, Creative, Minimal)
- Consistent component library across platforms
- Theme customization system
- Responsive design framework

#### 3. Component Abstraction Layer
**Features:**
- Platform-agnostic component definitions
- Automatic component adaptation
- Design token system
- Accessibility compliance

### Technical Implementation

#### Astro Integration
```typescript
// content/config.ts
import { defineCollection } from 'astro:content';

const heroCollection = defineCollection({
    type: 'content',
    schema: z.object({
        title: z.string(),
        subtitle: z.string(),
        cta: z.object({
            text: z.string(),
            url: z.string()
        })
    })
});
```

#### Design System Architecture
```typescript
interface DesignSystem {
    name: string;
    brand: BrandConfiguration;
    components: Record<string, ComponentTemplate>;
    styles: StyleDefinition;
    responsive: ResponsiveConfig;
}

interface BrandVoice {
    name: string;
    colors: ColorPalette;
    typography: TypographyScale;
    spacing: SpacingScale;
    tone: BrandTone;
}
```

## Enhanced CLI Features

### Platform Selection
```bash
# Compile to specific platform
ucc compile --platform wordpress
ucc compile --platform astro
ucc compile --platform html

# Specify design system
ucc compile --design-system enterprise
ucc compile --design-system startup
```

### Multi-Platform Compilation
```bash
# Compile to multiple platforms
ucc compile --platforms wordpress,astro,html
```

## Success Criteria

### Technical Metrics
- ✅ 3 platform adapters (HTML, WordPress, Astro)
- ✅ 3+ design system variants
- ✅ < 30 second compilation time for all platforms
- ✅ Consistent component library across platforms

### Quality Metrics
- ✅ Platform-specific optimizations working
- ✅ Design systems apply correctly
- ✅ Responsive design on all platforms
- ✅ Accessibility compliance (WCAG 2.1 AA)

### User Experience
- ✅ Easy platform switching
- ✅ Design system preview
- ✅ Platform-specific documentation
- ✅ Error handling for platform-specific issues

## Testing Strategy

### Platform Compatibility Testing
- WordPress version compatibility (5.0+)
- Astro version compatibility (2.0+)
- Browser compatibility testing
- Mobile responsiveness testing

### Integration Testing
- Content compilation across platforms
- Design system application
- Asset optimization
- Performance benchmarking

## Risk Mitigation

### Platform Compatibility
- **Version Testing**: Test against multiple platform versions
- **Fallback Options**: Graceful degradation for unsupported features
- **Documentation**: Clear platform requirements and limitations

### Design System Complexity
- **Incremental Implementation**: Start with core components
- **Modular Architecture**: Allow design systems to be mixed/matched
- **Preview System**: Allow users to preview design changes

## Next Phase Integration

Phase 2 establishes multiple platform adapters and design systems that Phase 3 builds upon with AI integration and enterprise features. The modular adapter architecture allows easy addition of new platforms in future phases.