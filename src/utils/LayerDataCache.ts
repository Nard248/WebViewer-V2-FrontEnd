// Updated LayerDataCache.ts with better storage management

interface CachedLayerData {
    data: any;
    timestamp: number;
    layerId: number;
    layerName: string;
    size: number; // Track data size
}

interface LayerCacheEntry {
    [layerId: number]: CachedLayerData;
}

class LayerDataCache {
    private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
    private readonly CACHE_KEY_PREFIX = 'layer_cache_';
    private readonly MAX_STORAGE_SIZE = 1000 * 1024 * 1024; // 4MB limit for localStorage
    private memoryCache: Map<number, CachedLayerData> = new Map();

    // Enhanced storage with size management
    setLayerData(layerId: number, layerName: string, data: any): void {
        const dataString = JSON.stringify(data);
        const dataSize = new Blob([dataString]).size;

        const cacheEntry: CachedLayerData = {
            data,
            timestamp: Date.now(),
            layerId,
            layerName,
            size: dataSize
        };

        // Always store in memory cache
        this.memoryCache.set(layerId, cacheEntry);
        console.log(`Cached layer ${layerName} in memory (${this.formatSize(dataSize)})`);

        // Try to store in localStorage only if size is reasonable
        if (dataSize < this.MAX_STORAGE_SIZE) {
            try {
                // Check if we need to make room
                this.makeRoomInStorage(dataSize);

                const cacheKey = `${this.CACHE_KEY_PREFIX}${layerId}`;
                localStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
                console.log(`Cached layer ${layerName} in localStorage (${this.formatSize(dataSize)})`);
            } catch (error) {
                if (error.name === 'QuotaExceededError') {
                    console.warn(`Layer ${layerName} too large for localStorage (${this.formatSize(dataSize)}), using memory only`);
                    // Try to clear some space and retry once
                    this.clearOldestFromStorage();
                    try {
                        const cacheKey = `${this.CACHE_KEY_PREFIX}${layerId}`;
                        localStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
                        console.log(`Cached layer ${layerName} in localStorage after cleanup`);
                    } catch (retryError) {
                        console.warn(`Failed to cache ${layerName} in localStorage even after cleanup, memory only`);
                    }
                } else {
                    console.warn('Failed to cache to localStorage:', error);
                }
            }
        } else {
            console.log(`Layer ${layerName} (${this.formatSize(dataSize)}) too large for localStorage, using memory only`);
        }
    }

    // Make room in localStorage by removing oldest entries
    private makeRoomInStorage(neededSize: number): void {
        const currentSize = this.getStorageSize();
        const availableSpace = this.MAX_STORAGE_SIZE - currentSize;

        if (availableSpace < neededSize) {
            console.log(`Need to free ${this.formatSize(neededSize - availableSpace)} in localStorage`);
            this.clearOldestFromStorage(neededSize - availableSpace);
        }
    }

    // Get current localStorage usage for our cache
    private getStorageSize(): number {
        let totalSize = 0;
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(this.CACHE_KEY_PREFIX)) {
                    const value = localStorage.getItem(key);
                    if (value) {
                        totalSize += new Blob([value]).size;
                    }
                }
            }
        } catch (error) {
            console.warn('Failed to calculate storage size:', error);
        }
        return totalSize;
    }

    // Clear oldest entries from localStorage
    private clearOldestFromStorage(targetSize?: number): void {
        const entries: { key: string; timestamp: number; size: number }[] = [];

        try {
            // Collect all cache entries with their timestamps
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(this.CACHE_KEY_PREFIX)) {
                    const value = localStorage.getItem(key);
                    if (value) {
                        try {
                            const parsed: CachedLayerData = JSON.parse(value);
                            entries.push({
                                key,
                                timestamp: parsed.timestamp,
                                size: new Blob([value]).size
                            });
                        } catch (parseError) {
                            // Remove corrupted entries
                            localStorage.removeItem(key);
                        }
                    }
                }
            }

            // Sort by timestamp (oldest first)
            entries.sort((a, b) => a.timestamp - b.timestamp);

            // Remove entries until we have enough space or half are gone
            let freedSpace = 0;
            let removedCount = 0;
            const maxToRemove = Math.ceil(entries.length / 2);

            for (const entry of entries) {
                if (removedCount >= maxToRemove || (targetSize && freedSpace >= targetSize)) {
                    break;
                }

                localStorage.removeItem(entry.key);
                freedSpace += entry.size;
                removedCount++;
            }

            console.log(`Cleared ${removedCount} old cache entries, freed ${this.formatSize(freedSpace)}`);
        } catch (error) {
            console.warn('Failed to clear old cache entries:', error);
        }
    }

    // Enhanced getter with better fallback
    getLayerData(layerId: number): CachedLayerData | null {
        // Check memory cache first (fastest)
        const memoryCached = this.memoryCache.get(layerId);
        if (memoryCached && this.isValid(memoryCached.timestamp)) {
            return memoryCached;
        }

        // Check localStorage
        try {
            const cacheKey = `${this.CACHE_KEY_PREFIX}${layerId}`;
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
                const parsedCache: CachedLayerData = JSON.parse(cached);
                if (this.isValid(parsedCache.timestamp)) {
                    // Restore to memory cache for faster future access
                    this.memoryCache.set(layerId, parsedCache);
                    return parsedCache;
                } else {
                    // Remove expired cache
                    localStorage.removeItem(cacheKey);
                }
            }
        } catch (error) {
            console.warn(`Failed to retrieve layer ${layerId} from localStorage:`, error);
        }

        return null;
    }

    // Helper to format file sizes
    private formatSize(bytes: number): string {
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 Bytes';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }

    // Check if cached data is still valid
    private isValid(timestamp: number): boolean {
        return (Date.now() - timestamp) < this.CACHE_DURATION;
    }

    // Check if layer data exists and is valid
    hasValidCache(layerId: number): boolean {
        return this.getLayerData(layerId) !== null;
    }

    // Enhanced cleanup with memory management
    cleanupExpiredCache(): void {
        let memoryCleared = 0;
        let storageCleared = 0;

        // Clean memory cache
        for (const [layerId, cacheEntry] of this.memoryCache.entries()) {
            if (!this.isValid(cacheEntry.timestamp)) {
                this.memoryCache.delete(layerId);
                memoryCleared++;
            }
        }

        // Clean localStorage cache
        try {
            const keysToRemove: string[] = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(this.CACHE_KEY_PREFIX)) {
                    const cached = localStorage.getItem(key);
                    if (cached) {
                        try {
                            const parsedCache: CachedLayerData = JSON.parse(cached);
                            if (!this.isValid(parsedCache.timestamp)) {
                                keysToRemove.push(key);
                            }
                        } catch (parseError) {
                            keysToRemove.push(key); // Remove corrupted entries
                        }
                    }
                }
            }
            keysToRemove.forEach(key => localStorage.removeItem(key));
            storageCleared = keysToRemove.length;
        } catch (error) {
            console.warn('Failed to cleanup localStorage cache:', error);
        }

        if (memoryCleared > 0 || storageCleared > 0) {
            console.log(`Cleanup completed: ${memoryCleared} memory entries, ${storageCleared} storage entries removed`);
        }
    }

    // Clear cache for specific layer
    clearLayerCache(layerId: number): void {
        this.memoryCache.delete(layerId);
        try {
            const cacheKey = `${this.CACHE_KEY_PREFIX}${layerId}`;
            localStorage.removeItem(cacheKey);
        } catch (error) {
            console.warn('Failed to clear localStorage cache:', error);
        }
    }

    // Clear all cache
    clearAllCache(): void {
        this.memoryCache.clear();
        try {
            const keysToRemove: string[] = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(this.CACHE_KEY_PREFIX)) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(key => localStorage.removeItem(key));
            console.log(`Cleared all cache: ${keysToRemove.length} localStorage entries removed`);
        } catch (error) {
            console.warn('Failed to clear localStorage cache:', error);
        }
    }

    // Enhanced cache info
    getCacheInfo(): {
        memoryEntries: number;
        localStorageEntries: number;
        totalSize: string;
        memorySize: string;
        storageSize: string;
        storageUsage: string;
    } {
        let localStorageEntries = 0;
        let storageSize = 0;
        let memorySize = 0;

        // Calculate memory size
        for (const [_, entry] of this.memoryCache.entries()) {
            memorySize += entry.size || 0;
        }

        // Calculate storage size
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(this.CACHE_KEY_PREFIX)) {
                    localStorageEntries++;
                    const value = localStorage.getItem(key);
                    if (value) {
                        storageSize += new Blob([value]).size;
                    }
                }
            }
        } catch (error) {
            console.warn('Failed to get cache info:', error);
        }

        const totalSize = memorySize + storageSize;
        const storageUsagePercent = ((storageSize / this.MAX_STORAGE_SIZE) * 100).toFixed(1);

        return {
            memoryEntries: this.memoryCache.size,
            localStorageEntries,
            totalSize: this.formatSize(totalSize),
            memorySize: this.formatSize(memorySize),
            storageSize: this.formatSize(storageSize),
            storageUsage: `${storageUsagePercent}% of ${this.formatSize(this.MAX_STORAGE_SIZE)}`
        };
    }
}

// Export singleton instance
export const layerDataCache = new LayerDataCache();

// Auto-cleanup every 5 minutes
setInterval(() => {
    layerDataCache.cleanupExpiredCache();
}, 5 * 60 * 1000);