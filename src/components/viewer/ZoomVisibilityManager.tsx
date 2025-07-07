// Zoom-Based Visibility Manager for Antenna Towers
// Automatically hides/shows antenna towers based on zoom level

import * as L from 'leaflet';

// Configuration for zoom-based visibility
interface ZoomVisibilityConfig {
    minZoomForTowers: number;           // Minimum zoom to show towers
    minZoomForBuffers: number;          // Minimum zoom to show buffers
    fadeTransition: boolean;            // Smooth transition vs instant
    showZoomHint: boolean;              // Show zoom hints in UI
}

const defaultZoomConfig: ZoomVisibilityConfig = {
    minZoomForTowers: 11,               // Hide towers below zoom 11
    minZoomForBuffers: 9,               // Hide buffers below zoom 9
    fadeTransition: true,               // Smooth opacity transitions
    showZoomHint: true                  // Show "Zoom in to see towers" hints
};

// Zoom visibility state for layers
interface LayerZoomState {
    layerId: number;
    layerName: string;
    isAntennaTower: boolean;
    userVisible: boolean;               // User's intended visibility
    zoomVisible: boolean;               // Whether visible at current zoom
    currentlyShown: boolean;            // Actually shown on map
    minZoom: number;                    // Custom min zoom for this layer
}

// Zoom hint information
interface ZoomHint {
    layerId: number;
    layerName: string;
    requiredZoom: number;
    currentZoom: number;
}

class ZoomVisibilityManager {
    private map: L.Map | null = null;
    private layerStates: Map<number, LayerZoomState> = new Map();
    private config: ZoomVisibilityConfig = defaultZoomConfig;
    private layerTogglingCallbacks: Set<(layerId: number, visible: boolean, reason: 'zoom' | 'user') => void> = new Set();
    private zoomHintCallbacks: Set<(hints: ZoomHint[]) => void> = new Set();
    private bufferManager: any = null;

    // Initialize with map and buffer manager
    initialize(map: L.Map, bufferManager?: any): void {
        this.map = map;
        this.bufferManager = bufferManager;

        // Listen to zoom events
        map.on('zoomend', this.handleZoomChange.bind(this));

        console.log(`Zoom visibility manager initialized. Tower min zoom: ${this.config.minZoomForTowers}`);
    }

    // Register a layer for zoom-based visibility
    registerLayer(
        layerId: number,
        layerName: string,
        isAntennaTower: boolean,
        userVisible: boolean,
        customMinZoom?: number
    ): void {
        const minZoom = customMinZoom || (isAntennaTower ? this.config.minZoomForTowers : 0);

        const layerState: LayerZoomState = {
            layerId,
            layerName,
            isAntennaTower,
            userVisible,
            zoomVisible: this.map ? this.map.getZoom() >= minZoom : true,
            currentlyShown: false,
            minZoom
        };

        this.layerStates.set(layerId, layerState);

        // Check initial visibility
        this.updateLayerVisibility(layerId);

        console.log(`Registered layer: ${layerName} (antenna: ${isAntennaTower}, min zoom: ${minZoom})`);
    }

    // Update user's intended visibility for a layer
    setUserVisibility(layerId: number, visible: boolean): void {
        const state = this.layerStates.get(layerId);
        if (!state) return;

        state.userVisible = visible;
        this.updateLayerVisibility(layerId);
    }

    // Handle zoom level changes
    private handleZoomChange(): void {
        if (!this.map) return;

        const currentZoom = this.map.getZoom();
        console.log(`Zoom changed to ${currentZoom}, checking antenna tower visibility`);

        // Update zoom visibility for all layers
        for (const [layerId, state] of this.layerStates.entries()) {
            const wasZoomVisible = state.zoomVisible;
            state.zoomVisible = currentZoom >= state.minZoom;

            if (wasZoomVisible !== state.zoomVisible) {
                console.log(`Layer ${state.layerName}: zoom visibility changed to ${state.zoomVisible}`);
                this.updateLayerVisibility(layerId);
            }
        }

        // Update zoom hints
        this.updateZoomHints(currentZoom);
    }

    // ✅ ENHANCED: Update actual layer visibility based on user + zoom state
    private updateLayerVisibility(layerId: number): void {
        const state = this.layerStates.get(layerId);
        if (!state) return;

        const shouldShow = state.userVisible && state.zoomVisible;

        if (state.currentlyShown !== shouldShow) {
            state.currentlyShown = shouldShow;

            // Notify layer control to show/hide the layer
            const reason = state.userVisible ? 'zoom' : 'user';
            this.notifyLayerToggle(layerId, shouldShow, reason);

            // ✅ CRITICAL FIX: Handle buffer layers for antenna towers
            if (state.isAntennaTower && this.bufferManager) {
                if (shouldShow) {
                    // When tower becomes visible, only show buffers that are checked
                    this.bufferManager.toggleParentLayerBuffers(layerId, true, this.map);
                } else {
                    // ✅ NEW: When tower becomes hidden, force hide ALL buffers and uncheck them
                    this.bufferManager.forceHideBuffersForTower(layerId, this.map);
                }
            }

            console.log(`Layer ${state.layerName}: visibility = ${shouldShow} (user: ${state.userVisible}, zoom: ${state.zoomVisible})`);
        }
    }

    // Update zoom hints for UI
    private updateZoomHints(currentZoom: number): void {
        const hints: ZoomHint[] = [];

        for (const [layerId, state] of this.layerStates.entries()) {
            if (state.userVisible && !state.zoomVisible && state.isAntennaTower) {
                hints.push({
                    layerId,
                    layerName: state.layerName,
                    requiredZoom: state.minZoom,
                    currentZoom
                });
            }
        }

        this.notifyZoomHints(hints);
    }

    // Get current zoom status for a layer
    getLayerZoomStatus(layerId: number): {
        canShow: boolean;
        needsZoom: number | null;
        currentZoom: number;
    } {
        const state = this.layerStates.get(layerId);
        if (!state || !this.map) {
            return { canShow: true, needsZoom: null, currentZoom: 0 };
        }

        const currentZoom = this.map.getZoom();
        return {
            canShow: state.zoomVisible,
            needsZoom: state.zoomVisible ? null : state.minZoom,
            currentZoom
        };
    }

    // Check if any antenna towers are hidden due to zoom
    hasHiddenAntennaTowers(): boolean {
        for (const [, state] of this.layerStates.entries()) {
            if (state.isAntennaTower && state.userVisible && !state.zoomVisible) {
                return true;
            }
        }
        return false;
    }

    // Get all antenna towers that are hidden due to zoom
    getHiddenAntennaTowers(): ZoomHint[] {
        const hidden: ZoomHint[] = [];
        const currentZoom = this.map ? this.map.getZoom() : 0;

        for (const [layerId, state] of this.layerStates.entries()) {
            if (state.isAntennaTower && state.userVisible && !state.zoomVisible) {
                hidden.push({
                    layerId,
                    layerName: state.layerName,
                    requiredZoom: state.minZoom,
                    currentZoom
                });
            }
        }

        return hidden;
    }

    // Update configuration
    updateConfig(newConfig: Partial<ZoomVisibilityConfig>): void {
        this.config = { ...this.config, ...newConfig };

        // Re-evaluate all antenna tower layers with new config
        for (const [layerId, state] of this.layerStates.entries()) {
            if (state.isAntennaTower) {
                state.minZoom = this.config.minZoomForTowers;
                this.updateLayerVisibility(layerId);
            }
        }

        console.log('Zoom visibility config updated:', this.config);
    }

    // Get minimum zoom for antenna towers
    getMinZoomForTowers(): number {
        return this.config.minZoomForTowers;
    }

    // Subscribe to layer toggling events
    onLayerToggle(callback: (layerId: number, visible: boolean, reason: 'zoom' | 'user') => void): void {
        this.layerTogglingCallbacks.add(callback);
    }

    // Subscribe to zoom hint updates
    onZoomHints(callback: (hints: ZoomHint[]) => void): void {
        this.zoomHintCallbacks.add(callback);
    }

    // Unsubscribe from events
    offLayerToggle(callback: (layerId: number, visible: boolean, reason: 'zoom' | 'user') => void): void {
        this.layerTogglingCallbacks.delete(callback);
    }

    offZoomHints(callback: (hints: ZoomHint[]) => void): void {
        this.zoomHintCallbacks.delete(callback);
    }

    // Notify layer toggle callbacks
    private notifyLayerToggle(layerId: number, visible: boolean, reason: 'zoom' | 'user'): void {
        this.layerTogglingCallbacks.forEach(callback => {
            callback(layerId, visible, reason);
        });
    }

    // Notify zoom hint callbacks
    private notifyZoomHints(hints: ZoomHint[]): void {
        this.zoomHintCallbacks.forEach(callback => {
            callback(hints);
        });
    }

    // Unregister a layer
    unregisterLayer(layerId: number): void {
        this.layerStates.delete(layerId);
    }

    // Clean up
    cleanup(): void {
        if (this.map) {
            this.map.off('zoomend', this.handleZoomChange.bind(this));
        }
        this.layerStates.clear();
        this.layerTogglingCallbacks.clear();
        this.zoomHintCallbacks.clear();
        this.map = null;
        this.bufferManager = null;
    }

    // Get statistics
    getStats(): {
        totalLayers: number;
        antennaTowers: number;
        hiddenByZoom: number;
        currentZoom: number;
        minZoomRequired: number;
    } {
        const currentZoom = this.map ? this.map.getZoom() : 0;
        let antennaTowers = 0;
        let hiddenByZoom = 0;

        for (const [, state] of this.layerStates.entries()) {
            if (state.isAntennaTower) {
                antennaTowers++;
                if (state.userVisible && !state.zoomVisible) {
                    hiddenByZoom++;
                }
            }
        }

        return {
            totalLayers: this.layerStates.size,
            antennaTowers,
            hiddenByZoom,
            currentZoom,
            minZoomRequired: this.config.minZoomForTowers
        };
    }
}

// Export singleton instance
export const zoomVisibilityManager = new ZoomVisibilityManager();

// Helper function to create zoom hint messages
export const createZoomHintMessage = (hints: ZoomHint[]): string => {
    if (hints.length === 0) return '';

    const minZoom = Math.min(...hints.map(h => h.requiredZoom));
    const layerNames = hints.map(h => h.layerName).join(', ');

    return `Zoom to level ${minZoom}+ to see: ${layerNames}`;
};

export { ZoomVisibilityManager, ZoomHint };