interface CacheEntry {
  data: any;
  timestamp: number;
  accessCount: number;
  queryKey: string;
}

interface CacheConfig {
  maxSize: number;
  ttlMs: number; // Time to live in milliseconds
  maxResults: number; // Only cache if results <= this number
}

class MFUCache {
  private cache: Map<string, CacheEntry> = new Map();
  private config: CacheConfig;

  constructor(config: CacheConfig) {
    this.config = config;

    // Clean up expired entries every 5 minutes
    setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  private generateKey(endpoint: string, params: Record<string, any>): string {
    // Create a deterministic key from endpoint and sorted params
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result, key) => {
        result[key] = params[key];
        return result;
      }, {} as Record<string, any>);

    return `${endpoint}:${JSON.stringify(sortedParams)}`;
  }

  private cleanup(): void {
    const now = Date.now();
    const toDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.config.ttlMs) {
        toDelete.push(key);
      }
    }

    toDelete.forEach(key => this.cache.delete(key));
  }

  private evictIfNeeded(): void {
    if (this.cache.size >= this.config.maxSize) {
      // Find the least frequently used item
      let lfuKey = '';
      let minAccessCount = Infinity;

      for (const [key, entry] of this.cache.entries()) {
        if (entry.accessCount < minAccessCount) {
          minAccessCount = entry.accessCount;
          lfuKey = key;
        }
      }

      if (lfuKey) {
        this.cache.delete(lfuKey);
      }
    }
  }

  get(endpoint: string, params: Record<string, any>): any | null {
    const key = this.generateKey(endpoint, params);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > this.config.ttlMs) {
      this.cache.delete(key);
      return null;
    }

    // Increment access count (MFU)
    entry.accessCount++;
    return entry.data;
  }

  set(endpoint: string, params: Record<string, any>, data: any, resultCount?: number): void {
    // Only cache if result count is within limits
    if (resultCount !== undefined && resultCount > this.config.maxResults) {
      return;
    }

    const key = this.generateKey(endpoint, params);

    // Evict if needed before adding new entry
    this.evictIfNeeded();

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      accessCount: 1,
      queryKey: key
    });
  }

  clear(): void {
    this.cache.clear();
  }

  getStats(): { size: number; maxSize: number } {
    return {
      size: this.cache.size,
      maxSize: this.config.maxSize
    };
  }
}

// Create cache instance with 24 hour TTL, max 1000 entries, only cache <= 100 results
const mediaCache = new MFUCache({
  maxSize: 1000,
  ttlMs: 24 * 60 * 60 * 1000, // 24 hours
  maxResults: 100
});

export { mediaCache, MFUCache };