// Core content types for Universal Content Compiler

export interface ContentConfig {
  title: string;
  description: string;
  version: string;
  sections: Record<string, SectionConfig>;
}

export interface SectionConfig {
  path: string;
  schema: Record<string, any>;
  required?: boolean;
}

export interface UniversalContent {
  config: ContentConfig;
  sections: Record<string, ContentSection>;
  metadata: ContentMetadata;
}

export interface ContentSection {
  id: string;
  content: string;
  frontmatter: Record<string, any>;
  path: string;
  modified: Date;
}

export interface ContentMetadata {
  totalSections: number;
  lastModified: Date;
  version: string;
  checksum: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  section: string;
  field: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  section: string;
  field: string;
  message: string;
  code: string;
}

export interface CompileOptions {
  platform: string;
  designSystem?: string;
  output: string;
  watch?: boolean;
  verbose?: boolean;
  clean?: boolean;
}

export interface PlatformAdapter {
  name: string;
  version: string;
  compile(content: UniversalContent, options: CompileOptions): Promise<CompileResult>;
  validate(content: UniversalContent): ValidationResult;
}

export interface CompileResult {
  success: boolean;
  outputPath: string;
  files: string[];
  errors: string[];
  warnings: string[];
  duration: number;
}

export interface CacheEntry {
  key: string;
  data: any;
  timestamp: Date;
  ttl?: number;
}

export interface CacheBucket {
  name: string;
  version: string;
  entries: Map<string, CacheEntry>;
}

// CLI Types
export interface CliOptions {
  verbose: boolean;
  quiet: boolean;
  config?: string;
  cacheDir?: string;
}

export interface CommandResult {
  success: boolean;
  message: string;
  data?: any;
  duration: number;
}