import * as L from 'leaflet';

export interface BufferOptimizationConfig {
    maxBuffersWithoutOptimization: number;
    bufferMultiplier: number;
    minZoomForOptimization: number;
    updateDebounceMs: number;
}

export const DEFAULT_BUFFER_CONFIG: BufferOptimizationConfig = {
    maxBuffersWithoutOptimization: 500, // Much lower threshold for buffers
    bufferMultiplier: 1.2, // Smaller buffer since circles are already large
    minZoomForOptimization: 11, // Start optimizing at zoom 11
    updateDebounceMs: 150
};

interface BufferFeature {
    lat: number;
    lng: number;
    radius: number;
    options: L.CircleOptions;
    id: string;
}

export class ViewportOptimizedBufferLayer {
    private map: L.Map;
    private allBuffers: BufferFeature[] = [];
    private visibleBuffers: Map<string, L.Circle> = new Map();
    private layerGroup: L.LayerGroup;
    private config: BufferOptimizationConfig;
    private lastBounds: L.LatLngBounds | null = null;
    private updateTimeout: NodeJS.Timeout | null = null;
    private isAttached: boolean = false;

    constructor(
        map: L.Map,
        config: Partial<BufferOptimizationConfig> = {}
    ) {
        this.map = map;
        this.layerGroup = L.layerGroup();
        this.config = { ...DEFAULT_BUFFER_CONFIG, ...config };

        // Bind event handlers
        this.updateViewport = this.updateViewport.bind(this);
    }

    public addBuffer(lat: number, lng: number, radius: number, options: L.CircleOptions): void {
        const id = `${lat}_${lng}_${radius}`;
        this.allBuffers.push({
            lat,
            lng,
            radius,
            options,
            id
        });

        // If already attached and should show immediately
        if (this.isAttached && !this.shouldOptimize()) {
            this.addSingleBuffer({ lat, lng, radius, options, id });
        } else if (this.isAttached) {
            // Trigger viewport update if optimizing
            this.updateViewport();
        }
    }

    private addSingleBuffer(buffer: BufferFeature): void {
        if (!this.visibleBuffers.has(buffer.id)) {
            const circle = L.circle([buffer.lat, buffer.lng], {
                ...buffer.options,
                radius: buffer.radius
            });
            this.visibleBuffers.set(buffer.id, circle);
            this.layerGroup.addLayer(circle);
        }
    }

    public clearBuffers(): void {
        this.allBuffers = [];
        this.visibleBuffers.clear();
        this.layerGroup.clearLayers();
    }

    private shouldOptimize(): boolean {
        const zoom = this.map.getZoom();
        return (
            this.allBuffers.length > this.config.maxBuffersWithoutOptimization &&
            zoom >= this.config.minZoomForOptimization
        );
    }

    private updateViewport(): void {
        if (!this.isAttached) return;

        // Debounce updates
        if (this.updateTimeout) {
            clearTimeout(this.updateTimeout);
        }

        this.updateTimeout = setTimeout(() => {
            this.performViewportUpdate();
        }, this.config.updateDebounceMs);
    }

    private performViewportUpdate(): void {
        if (!this.shouldOptimize()) {
            // Show all buffers if not optimizing
            this.showAllBuffers();
            return;
        }

        const bounds = this.map.getBounds();
        
        // Only update if bounds changed significantly
        if (this.lastBounds && this.boundsAreSimilar(bounds, this.lastBounds)) {
            return;
        }
        
        this.lastBounds = bounds;

        // Expand bounds for buffer
        const expandedBounds = this.expandBounds(bounds, this.config.bufferMultiplier);
        
        // Find buffers that intersect with viewport
        const visibleBufferFeatures = this.allBuffers.filter(buffer => {
            // Check if buffer circle intersects with viewport
            const bufferBounds = L.latLngBounds(
                L.latLng(buffer.lat, buffer.lng).toBounds(buffer.radius * 2)
            );
            return expandedBounds.intersects(bufferBounds);
        });

        console.log(`🎯 Buffer optimization: Showing ${visibleBufferFeatures.length} of ${this.allBuffers.length} buffers`);
        
        // Update visible buffers
        this.updateVisibleBuffers(visibleBufferFeatures);
    }

    private boundsAreSimilar(bounds1: L.LatLngBounds, bounds2: L.LatLngBounds): boolean {
        const threshold = 0.002; // Slightly larger threshold for buffers
        return (
            Math.abs(bounds1.getNorth() - bounds2.getNorth()) < threshold &&
            Math.abs(bounds1.getSouth() - bounds2.getSouth()) < threshold &&
            Math.abs(bounds1.getEast() - bounds2.getEast()) < threshold &&
            Math.abs(bounds1.getWest() - bounds2.getWest()) < threshold
        );
    }

    private expandBounds(bounds: L.LatLngBounds, multiplier: number): L.LatLngBounds {
        const northEast = bounds.getNorthEast();
        const southWest = bounds.getSouthWest();
        
        const latDiff = (northEast.lat - southWest.lat) * (multiplier - 1) / 2;
        const lngDiff = (northEast.lng - southWest.lng) * (multiplier - 1) / 2;
        
        return L.latLngBounds([
            [southWest.lat - latDiff, southWest.lng - lngDiff],
            [northEast.lat + latDiff, northEast.lng + lngDiff]
        ]);
    }

    private updateVisibleBuffers(visibleBufferFeatures: BufferFeature[]): void {
        // Remove buffers that are no longer visible
        const visibleIds = new Set(visibleBufferFeatures.map(b => b.id));
        
        for (const [id, circle] of this.visibleBuffers.entries()) {
            if (!visibleIds.has(id)) {
                this.layerGroup.removeLayer(circle);
                this.visibleBuffers.delete(id);
            }
        }

        // Add new buffers that became visible
        visibleBufferFeatures.forEach(buffer => {
            if (!this.visibleBuffers.has(buffer.id)) {
                this.addSingleBuffer(buffer);
            }
        });
    }

    private showAllBuffers(): void {
        // Clear existing buffers
        this.visibleBuffers.clear();
        this.layerGroup.clearLayers();

        // Add all buffers
        this.allBuffers.forEach(buffer => {
            this.addSingleBuffer(buffer);
        });

        console.log(`⭕ Showing all ${this.allBuffers.length} buffers (optimization disabled)`);
    }

    public attachToMap(): void {
        if (!this.isAttached) {
            this.isAttached = true;
            this.map.on('moveend', this.updateViewport);
            this.map.on('zoomend', this.updateViewport);
            this.updateViewport(); // Initial update
        }
    }

    public detachFromMap(): void {
        if (this.isAttached) {
            this.isAttached = false;
            this.map.off('moveend', this.updateViewport);
            this.map.off('zoomend', this.updateViewport);
            
            if (this.updateTimeout) {
                clearTimeout(this.updateTimeout);
                this.updateTimeout = null;
            }
        }
    }

    public getLayerGroup(): L.LayerGroup {
        return this.layerGroup;
    }

    public getVisibleBufferCount(): number {
        return this.visibleBuffers.size;
    }

    public getTotalBufferCount(): number {
        return this.allBuffers.length;
    }

    public destroy(): void {
        this.detachFromMap();
        this.clearBuffers();
    }
}