// Auto-generated content types and data
// Generated from Content/config.jsonc

export interface ContentSection {
  title?: string;
  component: string;
  order: number;
  path: string;
  enabled: boolean;
}

export interface SiteConfig {
  site: {
    name: string;
    description: string;
    version: string;
  };
  sections: Record<string, ContentSection>;
  content: {
    basePath: string;
    format: string;
    frontmatter: boolean;
  };
  build: {
    output: string;
    types: boolean;
    validation: boolean;
  };
}

export const siteConfig: SiteConfig = {
  "site": {
    "name": "BizQ Marketing Site",
    "description": "Universal Delegation Platform for Business Operations",
    "version": "1.0.0"
  },
  "sections": {
    "hero": {
      "path": "Content/sections/hero/content.md",
      "component": "Hero",
      "enabled": true,
      "order": 1
    },
    "features": {
      "path": "Content/sections/features/content.md",
      "component": "Features",
      "enabled": true,
      "order": 2
    },
    "services": {
      "path": "Content/sections/services/content.md",
      "component": "Services",
      "enabled": true,
      "order": 3
    },
    "pricing": {
      "path": "Content/sections/pricing/content.md",
      "component": "Pricing",
      "enabled": true,
      "order": 4
    },
    "testimonials": {
      "path": "Content/sections/testimonials/content.md",
      "component": "Testimonials",
      "enabled": true,
      "order": 5
    },
    "faq": {
      "path": "Content/sections/faq/content.md",
      "component": "FAQ",
      "enabled": true,
      "order": 6
    },
    "cta": {
      "path": "Content/sections/cta/content.md",
      "component": "Cta",
      "enabled": true,
      "order": 7
    }
  },
  "content": {
    "basePath": "Content",
    "format": "markdown",
    "frontmatter": true
  },
  "build": {
    "output": "apps/marketing/src/generated",
    "types": true,
    "validation": true
  }
};

// Helper function to get enabled sections in order
export const getEnabledSections = (): ContentSection[] => {
  return Object.values(siteConfig.sections)
    .filter(section => section.enabled)
    .sort((a, b) => a.order - b.order);
};

// Helper function to get section by component name
export const getSectionByComponent = (componentName: string): ContentSection | undefined => {
  return Object.values(siteConfig.sections).find(section => section.component === componentName);
};