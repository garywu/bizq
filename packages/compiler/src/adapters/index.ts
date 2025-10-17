// Platform adapter registry and management

import { PlatformAdapter, UniversalContent, CompileOptions, CompileResult } from '../types';
import { HTMLStaticAdapter } from './html-static';
import { CloudflarePagesAdapter } from './cloudflare-pages';
import { CloudflareWorkersAdapter } from './cloudflare-workers';

export class AdapterRegistry {
  private adapters: Map<string, PlatformAdapter> = new Map();

  constructor() {
    this.registerBuiltInAdapters();
  }

  /**
   * Register a platform adapter
   */
  registerAdapter(adapter: PlatformAdapter): void {
    this.adapters.set(adapter.name, adapter);
  }

  /**
   * Get an adapter by name
   */
  getAdapter(name: string): PlatformAdapter | null {
    return this.adapters.get(name) || null;
  }

  /**
   * List all available adapters
   */
  listAdapters(): PlatformAdapter[] {
    return Array.from(this.adapters.values());
  }

  /**
   * Compile content using specified adapter
   */
  async compile(
    adapterName: string,
    content: UniversalContent,
    options: CompileOptions
  ): Promise<CompileResult> {
    const adapter = this.getAdapter(adapterName);

    if (!adapter) {
      return {
        success: false,
        outputPath: options.output,
        files: [],
        errors: [`Adapter '${adapterName}' not found`],
        warnings: [],
        duration: 0
      };
    }

    // Validate content before compilation
    const validation = adapter.validate(content);
    if (!validation.valid) {
      return {
        success: false,
        outputPath: options.output,
        files: [],
        errors: validation.errors.map(e => `${e.section}: ${e.message}`),
        warnings: validation.warnings.map(w => `${w.section}: ${w.message}`),
        duration: 0
      };
    }

    // Compile content
    return adapter.compile(content, options);
  }

  /**
   * Register built-in adapters
   */
  private registerBuiltInAdapters(): void {
    this.registerAdapter(new HTMLStaticAdapter());
    this.registerAdapter(new CloudflarePagesAdapter());
    this.registerAdapter(new CloudflareWorkersAdapter());
  }
}

// Global adapter registry instance
export const adapterRegistry = new AdapterRegistry();