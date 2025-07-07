// Frontend-Only Antenna Buffer System
// Generates buffers dynamically from tower data without backend changes

import * as L from 'leaflet';
import { towerCompanyColors } from '../../constants/towerConstants';

// Buffer configuration
interface BufferConfig {
    distances: number[]; // in miles
    opacity: number;
    fillOpacity: number;
}

const defaultBufferConfig: BufferConfig = {
    distances: [2, 5], // 2 and 5 mile buffers
    opacity: 0.8,
    fillOpacity: 0.1
};

// Convert miles to meters (for Leaflet circle radius)
const milesToMeters = (miles: number): number => miles * 1609.34;

// Virtual buffer layer info (frontend only)
interface VirtualBufferLayer {
    id: string;
    parentLayerId: number;
    parentLayerName: string;
    companyName: string;
    distance: number;
    color: string;
    layerGroup: L.LayerGroup;
    isVisible: boolean;
    featureCount: number;
}

// Tower layer relationship
interface TowerWithBuffers {
    towerId: number;
    towerName: string;
    companyName: string;
    isVisible: boolean;
    buffers: VirtualBufferLayer[];
}

class FrontendAntennaBufferManager {
    private bufferLayers: Map<string, VirtualBufferLayer> = new Map();
    private towerBufferRelationships: Map<number, VirtualBufferLayer[]> = new Map();
    private visibilityCallbacks: Set<(towers: TowerWithBuffers[]) => void> = new Set();

    // Generate buffer circles from tower GeoJSON data
    generateBuffersFromTowerData(
        towerData: any,
        parentLayerId: number,
        parentLayerName: string,
        companyName: string
    ): VirtualBufferLayer[] {
        const createdBuffers: VirtualBufferLayer[] = [];

        defaultBufferConfig.distances.forEach(distance => {
            const bufferId = `buffer_${parentLayerId}_${distance}mi`;
            const bufferColor = this.getCompanyColor(companyName);
            const bufferGroup = L.layerGroup();

            let featureCount = 0;

            if (towerData && towerData.features) {
                towerData.features.forEach((feature: any) => {
                    if (feature.geometry?.type === 'Point') {
                        const [lng, lat] = feature.geometry.coordinates;

                        // Create buffer circle
                        const circle = L.circle([lat, lng], {
                            radius: milesToMeters(distance),
                            color: bufferColor,
                            fillColor: bufferColor,
                            weight: distance === 2 ? 2 : 1,
                            opacity: defaultBufferConfig.opacity,
                            fillOpacity: distance === 2 ? 0.15 : 0.1,
                            dashArray: distance === 5 ? '5,5' : undefined,
                            pane: 'overlayPane'
                        });

                        // ✅ REMOVED: No popup binding for buffers
                        // circle.bindPopup(popupContent);

                        bufferGroup.addLayer(circle);
                        featureCount++;
                    }
                });
            }

            // Create virtual buffer layer
            const virtualBuffer: VirtualBufferLayer = {
                id: bufferId,
                parentLayerId,
                parentLayerName,
                companyName,
                distance,
                color: bufferColor,
                layerGroup: bufferGroup,
                isVisible: false,
                featureCount
            };

            this.bufferLayers.set(bufferId, virtualBuffer);
            createdBuffers.push(virtualBuffer);
        });

        // Store relationship
        this.towerBufferRelationships.set(parentLayerId, createdBuffers);
        this.notifyVisibilityChange();

        return createdBuffers;
    }

    // Get company-specific colors
    private getCompanyColor(companyName: string): string {
        return towerCompanyColors[companyName as keyof typeof towerCompanyColors] || towerCompanyColors['Other'];
    }

    // ✅ FIXED: Toggle all buffers for a parent tower layer with zoom-aware logic
    toggleParentLayerBuffers(parentLayerId: number, isVisible: boolean, map: L.Map): void {
        const buffers = this.towerBufferRelationships.get(parentLayerId);
        if (!buffers) return;

        buffers.forEach(buffer => {
            if (isVisible && buffer.isVisible) {
                // Add to map if parent is visible and buffer is enabled
                if (!map.hasLayer(buffer.layerGroup)) {
                    map.addLayer(buffer.layerGroup);
                }
            } else {
                // Remove from map if parent is hidden or buffer is disabled
                if (map.hasLayer(buffer.layerGroup)) {
                    map.removeLayer(buffer.layerGroup);
                }
            }
        });

        this.notifyVisibilityChange();
    }

    // ✅ NEW: Force hide all buffers for a tower (when zooming out)
    forceHideBuffersForTower(parentLayerId: number, map: L.Map): void {
        const buffers = this.towerBufferRelationships.get(parentLayerId);
        if (!buffers) return;

        buffers.forEach(buffer => {
            if (map.hasLayer(buffer.layerGroup)) {
                map.removeLayer(buffer.layerGroup);
            }
            // ✅ CRITICAL: Set buffer visibility to false when parent tower is hidden by zoom
            buffer.isVisible = false;
        });

        this.notifyVisibilityChange();
        console.log(`Force hidden all buffers for tower layer ${parentLayerId} due to zoom out`);
    }

    // ✅ ENHANCED: Toggle individual buffer layer with parent visibility check
    toggleBufferLayer(bufferId: string, isVisible: boolean, map: L.Map, parentVisible: boolean = true): void {
        const buffer = this.bufferLayers.get(bufferId);
        if (!buffer) return;

        buffer.isVisible = isVisible;

        // Only show if parent is also visible AND user wants buffer visible
        if (isVisible && parentVisible) {
            if (!map.hasLayer(buffer.layerGroup)) {
                map.addLayer(buffer.layerGroup);
            }
        } else {
            if (map.hasLayer(buffer.layerGroup)) {
                map.removeLayer(buffer.layerGroup);
            }
        }

        this.notifyVisibilityChange();
    }

    // ✅ NEW: Check if tower is currently visible (for zoom logic)
    isTowerLayerVisible(parentLayerId: number, map: L.Map): boolean {
        // This will be called by the zoom manager to check parent visibility
        // You can add additional logic here if needed
        return true; // Default - let zoom manager handle the logic
    }

    // Get all tower-buffer relationships for UI
    getTowerBufferRelationships(visibleTowerLayers: Set<number>): TowerWithBuffers[] {
        const relationships: TowerWithBuffers[] = [];

        for (const [towerId, buffers] of this.towerBufferRelationships.entries()) {
            if (buffers.length > 0) {
                const firstBuffer = buffers[0];
                relationships.push({
                    towerId,
                    towerName: firstBuffer.parentLayerName,
                    companyName: firstBuffer.companyName,
                    isVisible: visibleTowerLayers.has(towerId),
                    buffers: buffers
                });
            }
        }

        return relationships;
    }

    // Get buffer layer by ID
    getBufferLayer(bufferId: string): VirtualBufferLayer | undefined {
        return this.bufferLayers.get(bufferId);
    }

    // Remove buffers for a specific tower layer
    removeBuffersForTower(parentLayerId: number, map: L.Map): void {
        const buffers = this.towerBufferRelationships.get(parentLayerId);
        if (!buffers) return;

        buffers.forEach(buffer => {
            if (map.hasLayer(buffer.layerGroup)) {
                map.removeLayer(buffer.layerGroup);
            }
            this.bufferLayers.delete(buffer.id);
        });

        this.towerBufferRelationships.delete(parentLayerId);
        this.notifyVisibilityChange();
    }

    // Check if layer has buffers
    hasBuffersForLayer(layerId: number): boolean {
        return this.towerBufferRelationships.has(layerId);
    }

    // Get buffer count for a layer
    getBufferCountForLayer(layerId: number): number {
        const buffers = this.towerBufferRelationships.get(layerId);
        return buffers ? buffers.length : 0;
    }

    // Subscribe to visibility changes
    onVisibilityChange(callback: (towers: TowerWithBuffers[]) => void): void {
        this.visibilityCallbacks.add(callback);
    }

    // Unsubscribe from visibility changes
    offVisibilityChange(callback: (towers: TowerWithBuffers[]) => void): void {
        this.visibilityCallbacks.delete(callback);
    }

    // Notify subscribers of visibility changes
    private notifyVisibilityChange(): void {
        const relationships = this.getTowerBufferRelationships(new Set());
        this.visibilityCallbacks.forEach(callback => {
            callback(relationships);
        });
    }

    // Clean up all buffer layers
    cleanup(map: L.Map): void {
        this.bufferLayers.forEach(buffer => {
            if (map.hasLayer(buffer.layerGroup)) {
                map.removeLayer(buffer.layerGroup);
            }
        });
        this.bufferLayers.clear();
        this.towerBufferRelationships.clear();
        this.visibilityCallbacks.clear();
    }

    // Get statistics
    getStats(): { totalBuffers: number; totalTowers: number; totalBufferCircles: number } {
        let totalBufferCircles = 0;
        this.bufferLayers.forEach(buffer => {
            totalBufferCircles += buffer.featureCount;
        });

        return {
            totalBuffers: this.bufferLayers.size,
            totalTowers: this.towerBufferRelationships.size,
            totalBufferCircles
        };
    }
}

// Export singleton instance
export const frontendBufferManager = new FrontendAntennaBufferManager();

// Helper functions
export const isAntennaTowerLayer = (layerName: string): boolean => {
    return layerName.toLowerCase().includes('antenna locations') ||
        layerName.toLowerCase() === 'selected towers';
};

// Update getTowerCompanyFromLayerName to handle Selected Towers
export const getTowerCompanyFromLayerName = (layerName: string): string => {
    const lowerName = layerName.toLowerCase();

    if (lowerName === 'selected towers') return 'Selected';
    if (lowerName.includes('american tower')) return 'American Towers';
    if (lowerName.includes('sba')) return 'SBA';
    if (lowerName.includes('crown castle')) return 'Crown Castle';
    if (lowerName.includes('other')) return 'Other';

    // Default fallback
    return 'FCC Tower';
};

export const getTowerCompanyColor = (companyName: string): string => {
    return towerCompanyColors[companyName as keyof typeof towerCompanyColors] || towerCompanyColors['Other'];
};

// Buffer visibility state management
export interface BufferVisibilityState {
    [bufferId: string]: boolean;
}

export const createInitialBufferVisibility = (towerBuffers: TowerWithBuffers[]): BufferVisibilityState => {
    const state: BufferVisibilityState = {};
    towerBuffers.forEach(tower => {
        tower.buffers.forEach(buffer => {
            state[buffer.id] = false; // Start with buffers hidden
        });
    });
    return state;
};

export { FrontendAntennaBufferManager, VirtualBufferLayer, TowerWithBuffers };