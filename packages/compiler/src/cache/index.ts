import * as fs from 'fs-extra';
import * as path from 'path';
import { CacheEntry, CacheBucket } from '../types';

export class Cache {
  private cacheDir: string;
  private buckets: Map<string, CacheBucket> = new Map();

  constructor(cacheDir: string = './.ucc-cache') {
    this.cacheDir = cacheDir;
  }

  /**
   * Initialize cache directory structure
   */
  async initialize(): Promise<void> {
    await fs.ensureDir(this.cacheDir);

    // Initialize standard buckets
    await this.createBucket('ast-v1', 'Parsed content ASTs');
    await this.createBucket('compiled-v1', 'Generated platform outputs');
    await this.createBucket('templates-v1', 'Compiled templates');
    await this.createBucket('metadata-v1', 'Content metadata');
  }

  /**
   * Create a new cache bucket
   */
  private async createBucket(name: string, description: string): Promise<void> {
    const bucketPath = path.join(this.cacheDir, name);
    await fs.ensureDir(bucketPath);

    this.buckets.set(name, {
      name,
      version: '1.0.0',
      entries: new Map()
    });
  }

  /**
   * Get a value from cache
   */
  async get(bucket: string, key: string): Promise<any | null> {
    const bucketPath = path.join(this.cacheDir, bucket);
    const entryPath = path.join(bucketPath, this.hashKey(key) + '.json');

    try {
      if (await fs.pathExists(entryPath)) {
        const content = await fs.readFile(entryPath, 'utf-8');
        const entry: CacheEntry = JSON.parse(content);

        // Check if entry is still valid
        if (this.isValid(entry)) {
          return entry.data;
        } else {
          // Remove expired entry
          await fs.remove(entryPath);
        }
      }
    } catch (error) {
      // Ignore cache read errors
    }

    return null;
  }

  /**
   * Store a value in cache
   */
  async set(bucket: string, key: string, data: any, ttl?: number): Promise<void> {
    const bucketPath = path.join(this.cacheDir, bucket);
    await fs.ensureDir(bucketPath);

    const entry: CacheEntry = {
      key,
      data,
      timestamp: new Date(),
      ttl
    };

    const entryPath = path.join(bucketPath, this.hashKey(key) + '.json');
    await fs.writeFile(entryPath, JSON.stringify(entry, null, 2));
  }

  /**
   * Check if cache entry is still valid
   */
  private isValid(entry: CacheEntry): boolean {
    if (!entry.ttl) return true;

    const now = new Date().getTime();
    const entryTime = new Date(entry.timestamp).getTime();
    const expiryTime = entryTime + (entry.ttl * 1000);

    return now < expiryTime;
  }

  /**
   * Remove a specific entry from cache
   */
  async remove(bucket: string, key: string): Promise<void> {
    const bucketPath = path.join(this.cacheDir, bucket);
    const entryPath = path.join(bucketPath, this.hashKey(key) + '.json');

    try {
      await fs.remove(entryPath);
    } catch (error) {
      // Ignore if file doesn't exist
    }
  }

  /**
   * Clear an entire bucket
   */
  async clearBucket(bucket: string): Promise<void> {
    const bucketPath = path.join(this.cacheDir, bucket);

    try {
      await fs.emptyDir(bucketPath);
    } catch (error) {
      // Ignore if directory doesn't exist
    }
  }

  /**
   * Clear all cache
   */
  async clearAll(): Promise<void> {
    try {
      await fs.emptyDir(this.cacheDir);
      await this.initialize(); // Recreate bucket structure
    } catch (error) {
      // Ignore errors
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<Record<string, any>> {
    const stats: Record<string, any> = {};

    for (const bucketName of this.buckets.keys()) {
      const bucketPath = path.join(this.cacheDir, bucketName);
      const entries = await this.getBucketEntries(bucketName);
      stats[bucketName] = {
        entries: entries.length,
        size: await this.getBucketSize(bucketPath)
      };
    }

    return stats;
  }

  /**
   * Get all entries in a bucket
   */
  private async getBucketEntries(bucket: string): Promise<string[]> {
    const bucketPath = path.join(this.cacheDir, bucket);

    try {
      const files = await fs.readdir(bucketPath);
      return files.filter(file => file.endsWith('.json'));
    } catch (error) {
      return [];
    }
  }

  /**
   * Get bucket size in bytes
   */
  private async getBucketSize(bucketPath: string): Promise<number> {
    try {
      const files = await fs.readdir(bucketPath);
      let totalSize = 0;

      for (const file of files) {
        const filePath = path.join(bucketPath, file);
        const stats = await fs.stat(filePath);
        totalSize += stats.size;
      }

      return totalSize;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Create a hash for cache keys (simple but effective)
   */
  private hashKey(key: string): string {
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      const char = key.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Clean up expired entries across all buckets
   */
  async cleanup(): Promise<void> {
    for (const bucketName of this.buckets.keys()) {
      await this.cleanupBucket(bucketName);
    }
  }

  /**
   * Clean up expired entries in a specific bucket
   */
  private async cleanupBucket(bucket: string): Promise<void> {
    const bucketPath = path.join(this.cacheDir, bucket);
    const entries = await this.getBucketEntries(bucket);

    for (const entry of entries) {
      const entryPath = path.join(bucketPath, entry);

      try {
        const content = await fs.readFile(entryPath, 'utf-8');
        const cacheEntry: CacheEntry = JSON.parse(content);

        if (!this.isValid(cacheEntry)) {
          await fs.remove(entryPath);
        }
      } catch (error) {
        // Remove corrupted entries
        await fs.remove(entryPath);
      }
    }
  }
}