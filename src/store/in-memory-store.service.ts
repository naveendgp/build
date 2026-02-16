import { Injectable } from '@nestjs/common';

interface CacheEntry<T> {
  value: T;
  expiresAt?: number; // Unix timestamp in milliseconds
}

@Injectable()
export class InMemoryStoreService {
  private store: Map<string, CacheEntry<any>>;
  private ttlTimers: Map<string, NodeJS.Timeout>;

  constructor() {
    this.store = new Map<string, CacheEntry<any>>();
    this.ttlTimers = new Map<string, NodeJS.Timeout>();
    this.initialize();
  }

  private initialize(): void {
    console.log('✅ In-Memory Store initialized');
  }

  set<T>(key: string, value: T, ttlMs?: number): void {
    // Clear existing timer if any
    const existingTimer = this.ttlTimers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
      this.ttlTimers.delete(key);
    }

    const entry: CacheEntry<T> = { value };
    
    if (ttlMs && ttlMs > 0) {
      entry.expiresAt = Date.now() + ttlMs;
      // Set up automatic expiration
      const timer = setTimeout(() => {
        this.delete(key);
      }, ttlMs);
      this.ttlTimers.set(key, timer);
    }

    this.store.set(key, entry);
  }

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;

    // Check if expired
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.delete(key);
      return undefined;
    }

    return entry.value as T;
  }

  has(key: string): boolean {
    const entry = this.store.get(key);
    if (!entry) return false;
    
    // Check if expired
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.delete(key);
      return false;
    }
    
    return true;
  }

  delete(key: string): boolean {
    // Clear timer if exists
    const timer = this.ttlTimers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.ttlTimers.delete(key);
    }
    return this.store.delete(key);
  }

  /**
   * Clear all data from the store
   */
  clear(): void {
    // Clear all timers
    this.ttlTimers.forEach((timer) => clearTimeout(timer));
    this.ttlTimers.clear();
    this.store.clear();
  }

  /**
   * Get all keys in the store
   * @returns Array of all keys
   */
  keys(): string[] {
    return Array.from(this.store.keys());
  }

  /**
   * Get all values in the store
   * @returns Array of all values (expired entries are filtered out)
   */
  values(): any[] {
    const now = Date.now();
    return Array.from(this.store.entries())
      .filter(([_, entry]) => !entry.expiresAt || entry.expiresAt >= now)
      .map(([_, entry]) => entry.value);
  }

  /**
   * Get all entries (key-value pairs) in the store
   * @returns Array of [key, value] pairs (expired entries are filtered out)
   */
  entries(): [string, any][] {
    const now = Date.now();
    return Array.from(this.store.entries())
      .filter(([_, entry]) => !entry.expiresAt || entry.expiresAt >= now)
      .map(([key, entry]) => [key, entry.value]);
  }

  /**
   * Get the size of the store
   * @returns Number of entries in the store
   */
  size(): number {
    return this.store.size;
  }
}

