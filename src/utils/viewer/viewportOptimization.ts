import * as L from 'leaflet';

export interface ViewportOptimizationConfig {
    maxMarkersWithoutOptimization: number;
    bufferMultiplier: number;
    minZoomForOptimization: number;
    useCanvasForDenseLayers: boolean;
    canvasThreshold: number;
}

export const DEFAULT_VIEWPORT_CONFIG: ViewportOptimizationConfig = {
    maxMarkersWithoutOptimization: 5000,
    bufferMultiplier: 1.5, // 50% buffer around viewport
    minZoomForOptimization: 10,
    useCanvasForDenseLayers: true,
    canvasThreshold: 50000
};

export class ViewportOptimizedLayer {
    private map: L.Map;
    private allFeatures: any[] = [];
    private visibleMarkers: Map<string, L.Marker | L.CircleMarker> = new Map();
    private layerGroup: L.LayerGroup;
    private config: ViewportOptimizationConfig;
    private lastBounds: L.LatLngBounds | null = null;
    private updateTimeout: NodeJS.Timeout | null = null;
    private createMarkerFn: (feature: any, latlng: L.LatLng) => L.Marker | L.CircleMarker;

    constructor(
        map: L.Map, 
        features: any[], 
        createMarkerFn: (feature: any, latlng: L.LatLng) => L.Marker | L.CircleMarker,
        config: Partial<ViewportOptimizationConfig> = {}
    ) {
        this.map = map;
        this.allFeatures = features;
        this.createMarkerFn = createMarkerFn;
        this.layerGroup = L.layerGroup();
        this.config = { ...DEFAULT_VIEWPORT_CONFIG, ...config };

        // Bind event handlers
        this.updateViewport = this.updateViewport.bind(this);
        
        // Set up event listeners
        this.map.on('moveend', this.updateViewport);
        this.map.on('zoomend', this.updateViewport);
        
        // Initial viewport update
        this.updateViewport();
    }

    private getFeatureKey(feature: any): string {
        // Create unique key for feature (assuming features have coordinates)
        if (feature.geometry && feature.geometry.coordinates) {
            const [lng, lat] = feature.geometry.coordinates;
            return `${lat}_${lng}_${feature.properties?.id || ''}`;
        }
        return `${Math.random()}`; // Fallback
    }

    private shouldOptimize(): boolean {
        const zoom = this.map.getZoom();
        return (
            this.allFeatures.length > this.config.maxMarkersWithoutOptimization &&
            zoom >= this.config.minZoomForOptimization
        );
    }

    private updateViewport(): void {
        // Debounce updates
        if (this.updateTimeout) {
            clearTimeout(this.updateTimeout);
        }

        this.updateTimeout = setTimeout(() => {
            this.performViewportUpdate();
        }, 100);
    }

    private performViewportUpdate(): void {
        if (!this.shouldOptimize()) {
            // If we don't need optimization, show all markers
            this.showAllMarkers();
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
        
        // Find features within expanded viewport
        const visibleFeatures = this.allFeatures.filter(feature => {
            if (!feature.geometry || feature.geometry.type !== 'Point') return false;
            
            const [lng, lat] = feature.geometry.coordinates;
            return expandedBounds.contains([lat, lng]);
        });

        console.log(`🔍 Viewport optimization: Showing ${visibleFeatures.length} of ${this.allFeatures.length} features`);
        
        // Update visible markers
        this.updateVisibleMarkers(visibleFeatures);
    }

    private boundsAreSimilar(bounds1: L.LatLngBounds, bounds2: L.LatLngBounds): boolean {
        const threshold = 0.001; // ~100m threshold
        return (
            Math.abs(bounds1.getNorth() - bounds2.getNorth()) < threshold &&
            Math.abs(bounds1.getSouth() - bounds2.getSouth()) < threshold &&
            Math.abs(bounds1.getEast() - bounds2.getEast()) < threshold &&
            Math.abs(bounds1.getWest() - bounds2.getWest()) < threshold
        );
    }

    private expandBounds(bounds: L.LatLngBounds, multiplier: number): L.LatLngBounds {
        const center = bounds.getCenter();
        const northEast = bounds.getNorthEast();
        const southWest = bounds.getSouthWest();
        
        const latDiff = (northEast.lat - southWest.lat) * (multiplier - 1) / 2;
        const lngDiff = (northEast.lng - southWest.lng) * (multiplier - 1) / 2;
        
        return L.latLngBounds([
            [southWest.lat - latDiff, southWest.lng - lngDiff],
            [northEast.lat + latDiff, northEast.lng + lngDiff]
        ]);
    }

    private updateVisibleMarkers(visibleFeatures: any[]): void {
        // Remove markers that are no longer visible
        const visibleKeys = new Set(visibleFeatures.map(f => this.getFeatureKey(f)));
        
        for (const [key, marker] of this.visibleMarkers.entries()) {
            if (!visibleKeys.has(key)) {
                this.layerGroup.removeLayer(marker);
                this.visibleMarkers.delete(key);
            }
        }

        // Add new markers that became visible
        visibleFeatures.forEach(feature => {
            const key = this.getFeatureKey(feature);
            
            if (!this.visibleMarkers.has(key)) {
                const [lng, lat] = feature.geometry.coordinates;
                const marker = this.createMarkerFn(feature, L.latLng(lat, lng));
                
                this.visibleMarkers.set(key, marker);
                this.layerGroup.addLayer(marker);
            }
        });
    }

    private showAllMarkers(): void {
        // Clear existing markers
        this.visibleMarkers.clear();
        this.layerGroup.clearLayers();

        // Add all markers
        this.allFeatures.forEach(feature => {
            if (feature.geometry && feature.geometry.type === 'Point') {
                const [lng, lat] = feature.geometry.coordinates;
                const marker = this.createMarkerFn(feature, L.latLng(lat, lng));
                const key = this.getFeatureKey(feature);
                
                this.visibleMarkers.set(key, marker);
                this.layerGroup.addLayer(marker);
            }
        });

        console.log(`📍 Showing all ${this.allFeatures.length} markers (optimization disabled)`);
    }

    public addTo(map: L.Map): this {
        this.layerGroup.addTo(map);
        return this;
    }

    public remove(): this {
        this.layerGroup.remove();
        this.map.off('moveend', this.updateViewport);
        this.map.off('zoomend', this.updateViewport);
        
        if (this.updateTimeout) {
            clearTimeout(this.updateTimeout);
        }
        
        return this;
    }

    public getLayerGroup(): L.LayerGroup {
        return this.layerGroup;
    }

    public getVisibleMarkerCount(): number {
        return this.visibleMarkers.size;
    }

    public getTotalFeatureCount(): number {
        return this.allFeatures.length;
    }
}