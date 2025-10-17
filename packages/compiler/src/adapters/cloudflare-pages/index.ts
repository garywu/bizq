import * as fs from 'fs-extra';
import * as path from 'path';
import { HTMLStaticAdapter } from '../html-static';
import { UniversalContent, CompileOptions, CompileResult } from '../../types';

export class CloudflarePagesAdapter extends HTMLStaticAdapter {
  name = 'cloudflare-pages';
  version = '1.0.0';

  async compile(content: UniversalContent, options: CompileOptions): Promise<CompileResult> {
    const startTime = Date.now();

    try {
      // Ensure output directory exists
      await fs.ensureDir(options.output);

      // Generate HTML files using parent HTML static adapter
      const result = await super.compile(content, options);

      if (!result.success) {
        return result;
      }

      // Add Cloudflare Pages specific files
      await this.generatePagesConfig(content, options);
      await this.generateFunctionsConfig(content, options);
      await this.generateHeadersConfig(content, options);

      return {
        ...result,
        duration: Date.now() - startTime
      };

    } catch (error) {
      return {
        success: false,
        outputPath: options.output,
        files: [],
        errors: [(error as Error).message],
        warnings: [],
        duration: Date.now() - startTime
      };
    }
  }

  private async generatePagesConfig(content: UniversalContent, options: CompileOptions): Promise<void> {
    // Generate _routes.json for Cloudflare Pages routing
    const routesConfig = {
      version: 1,
      include: ['/*'],
      exclude: ['/api/*', '/_next/*', '/favicon.ico', '/robots.txt', '/sitemap.xml']
    };

    const routesPath = path.join(options.output, '_routes.json');
    await fs.writeFile(routesPath, JSON.stringify(routesConfig, null, 2));
  }

  private async generateFunctionsConfig(content: UniversalContent, options: CompileOptions): Promise<void> {
    // Generate wrangler.toml for Cloudflare Pages Functions
    const wranglerConfig = `# Cloudflare Pages Configuration
name = "${content.config.title?.toLowerCase().replace(/\s+/g, '-') || 'bizq-site'}"
compatibility_date = "${new Date().toISOString().split('T')[0]}"

[env.production]
# Add your production environment variables here

# KV Namespaces for caching and sessions
[[kv_namespaces]]
binding = "CACHE"
id = "your_cache_namespace_id"

# D1 Database for dynamic content
[[d1_databases]]
binding = "DB"
database_name = "content_db"
database_id = "your_database_id"

# R2 Bucket for file storage
[[r2_buckets]]
binding = "FILES"
bucket_name = "content-files"
`;

    const wranglerPath = path.join(options.output, 'wrangler.toml');
    await fs.writeFile(wranglerPath, wranglerConfig);
  }

  private async generateHeadersConfig(content: UniversalContent, options: CompileOptions): Promise<void> {
    // Generate _headers for Cloudflare Pages
    const headersConfig = `# Cloudflare Pages Headers Configuration

# Security headers
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()

# Cache static assets
/assets/*
  Cache-Control: public, max-age=31536000, immutable

# Cache HTML pages
/*.html
  Cache-Control: public, max-age=3600

# API routes (no cache)
/api/*
  Cache-Control: no-cache, no-store, must-revalidate
`;

    const headersPath = path.join(options.output, '_headers');
    await fs.writeFile(headersPath, headersConfig);
  }
}