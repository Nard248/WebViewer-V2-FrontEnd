// src/components/viewer/SelectedTowersManager.tsx
import * as L from 'leaflet';
import { frontendBufferManager, TowerWithBuffers, getTowerCompanyFromLayerName } from './FrontendAntennaBufferSystem';
import { createTowerPopupHTML } from './EnhancedTowerPopupSystem';

export interface SelectedTower {
    id: string;
    data: any;
    coordinates: [number, number];
    layerName: string;
    companyName: string;
    originalLayerId: number;
}

// Virtual layer info for Selected Towers
export interface SelectedTowersVirtualLayer {
    id: number;
    name: string;
    layer_type_name: string;
    is_visible: boolean;
    layerGroup: L.LayerGroup;
    featureCount: number;
    companyName: string;
}

export class SelectedTowersManager {
    private selectedTowers: Map<string, SelectedTower> = new Map();
    private selectedLayerGroup: L.LayerGroup | null = null;
    private mapRef: L.Map | null = null;
    private onSelectionChangeCallback: ((towers: SelectedTower[]) => void) | null = null;

    // Virtual layer for integration with LayerControl
    private selectedTowersVirtualLayer: SelectedTowersVirtualLayer | null = null;
    private onLayerUpdateCallback: ((layer: SelectedTowersVirtualLayer | null) => void) | null = null;

    constructor() {
        // Make this manager globally available
        (window as any).selectedTowersManager = this;
    }

    initialize(map: L.Map) {
        this.mapRef = map;
        this.selectedLayerGroup = L.layerGroup();

        // Initialize virtual layer for LayerControl integration
        this.selectedTowersVirtualLayer = {
            id: -1, // Special ID for selected towers
            name: 'Selected Towers',
            layer_type_name: 'Point Layer',
            is_visible: false,
            layerGroup: this.selectedLayerGroup,
            featureCount: 0,
            companyName: 'Selected'
        };
    }

    onSelectionChange(callback: (towers: SelectedTower[]) => void) {
        this.onSelectionChangeCallback = callback;
    }

    onLayerUpdate(callback: (layer: SelectedTowersVirtualLayer | null) => void) {
        this.onLayerUpdateCallback = callback;
    }

    toggleTower(
        towerId: string,
        towerData: any,
        coordinates: [number, number],
        layerName: string,
        companyName: string,
        originalLayerId: number
    ): boolean {
        const isCurrentlySelected = this.selectedTowers.has(towerId);

        if (isCurrentlySelected) {
            this.unselectTower(towerId);
            return false;
        } else {
            this.selectTower(towerId, towerData, coordinates, layerName, companyName, originalLayerId);
            return true;
        }
    }

    selectTower(
        towerId: string,
        towerData: any,
        coordinates: [number, number],
        layerName: string,
        companyName: string,
        originalLayerId: number
    ) {
        const selectedTower: SelectedTower = {
            id: towerId,
            data: towerData,
            coordinates,
            layerName,
            companyName,
            originalLayerId
        };

        this.selectedTowers.set(towerId, selectedTower);
        this.updateSelectedLayer();
        this.notifySelectionChange();
        this.notifyLayerUpdate();

        console.log(`Tower ${towerId} selected from ${layerName}`);
    }

    unselectTower(towerId: string) {
        this.selectedTowers.delete(towerId);
        this.updateSelectedLayer();
        this.notifySelectionChange();
        this.notifyLayerUpdate();

        console.log(`Tower ${towerId} unselected`);
    }

    isSelected(towerId: string): boolean {
        return this.selectedTowers.has(towerId);
    }

    getSelectedTowers(): SelectedTower[] {
        return Array.from(this.selectedTowers.values());
    }

    getSelectedTowersVirtualLayer(): SelectedTowersVirtualLayer | null {
        return this.selectedTowersVirtualLayer;
    }

    toggleSelectedLayerVisibility(isVisible: boolean) {
        if (!this.selectedTowersVirtualLayer || !this.mapRef || !this.selectedLayerGroup) return;

        console.log(`Toggling selected towers visibility: ${isVisible}, count: ${this.selectedTowers.size}`);

        this.selectedTowersVirtualLayer.is_visible = isVisible;

        if (isVisible && this.selectedTowers.size > 0) {
            // Ensure markers are created before adding to map
            if (this.selectedLayerGroup.getLayers().length === 0) {
                this.createAllSelectedTowerMarkers();
            }

            if (!this.mapRef.hasLayer(this.selectedLayerGroup)) {
                this.mapRef.addLayer(this.selectedLayerGroup);
                console.log('Added selected towers layer to map');
            }

            // Generate buffers when made visible
            this.generateSelectedTowerBuffers();
        } else {
            if (this.mapRef.hasLayer(this.selectedLayerGroup)) {
                this.mapRef.removeLayer(this.selectedLayerGroup);
                console.log('Removed selected towers layer from map');
            }

            // Clean up buffers when hidden
            frontendBufferManager.removeBuffersForTower(-1, this.mapRef);
        }

        this.notifyLayerUpdate();
    }


    clearAllSelections() {
        this.selectedTowers.clear();
        this.updateSelectedLayer();
        this.notifySelectionChange();
        this.notifyLayerUpdate();
    }


// Update the updateSelectedLayer method to properly handle buffer generation:
    private updateSelectedLayer() {
        if (!this.mapRef || !this.selectedLayerGroup || !this.selectedTowersVirtualLayer) return;

        // Clear existing selected layer
        this.selectedLayerGroup.clearLayers();

        // ✅ CRITICAL: Clean up old buffer layers for selected towers
        frontendBufferManager.removeBuffersForTower(-1, this.mapRef);

        if (this.selectedTowers.size === 0) {
            // Remove from map if no towers selected
            if (this.mapRef.hasLayer(this.selectedLayerGroup)) {
                this.mapRef.removeLayer(this.selectedLayerGroup);
            }
            this.selectedTowersVirtualLayer.featureCount = 0;
            this.selectedTowersVirtualLayer.is_visible = false;
            return;
        }

        // Update feature count
        this.selectedTowersVirtualLayer.featureCount = this.selectedTowers.size;

        // ✅ FIX: Only add to map if both conditions are met
        const shouldBeVisible = this.selectedTowersVirtualLayer.is_visible && this.selectedTowers.size > 0;

        if (shouldBeVisible && !this.mapRef.hasLayer(this.selectedLayerGroup)) {
            this.mapRef.addLayer(this.selectedLayerGroup);
        } else if (!shouldBeVisible && this.mapRef.hasLayer(this.selectedLayerGroup)) {
            this.mapRef.removeLayer(this.selectedLayerGroup);
        }

        // ✅ FIX: Create all markers properly
        this.createAllSelectedTowerMarkers();

        // Generate buffer layers for selected towers only if layer is visible
        if (shouldBeVisible) {
            this.generateSelectedTowerBuffers();
        }
    }

    private createAllSelectedTowerMarkers() {
        if (!this.selectedLayerGroup) return;

        const selectedTowersArray = Array.from(this.selectedTowers.values());

        selectedTowersArray.forEach((tower, index) => {
            const marker = this.createSelectedTowerMarker(tower, index);
            if (marker) {
                this.selectedLayerGroup!.addLayer(marker);
            }
        });
    }

// ✅ NEW: Create individual marker with proper styling
    private createSelectedTowerMarker(tower: SelectedTower, index: number): L.Marker | null {
        try {
            const icon = this.createSelectedTowerIcon();

            const marker = L.marker(tower.coordinates, {
                icon,
                // Add unique identifier for debugging
                alt: `selected-tower-${tower.id}-${index}`
            });

            // Add popup with tower information
            const popupContent = createTowerPopupHTML(
                tower.data,
                'Selected', // company name
                'Selected Towers', // layer name
                -1, // layer ID for selected towers
                true // isSelected flag
            );

            marker.bindPopup(popupContent);

            return marker;
        } catch (error) {
            console.error('Error creating selected tower marker:', error);
            return null;
        }
    }


    private createSelectedTowerIcon(): L.DivIcon {
        const svgString = `
        <svg width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
            <!-- Larger marker background with gold color -->
            <path d="M18 3C12.477 3 8 7.477 8 13c0 7.2 10 18 10 18s10-10.8 10-18c0-5.523-4.477-10-10-10z" 
                  fill="#FFD700" stroke="#FFA500" stroke-width="2"/>
            
            <!-- WiFi tower icon - larger and more prominent -->
            <g transform="translate(18,13)">
                <!-- Tower base -->
                <rect x="-1.5" y="2" width="3" height="7" fill="white"/>
                
                <!-- WiFi signal arcs - larger -->
                <path d="M-8,-3 A10,10 0 0,1 8,-3" fill="none" stroke="white" stroke-width="2" opacity="0.9"/>
                <path d="M-5,-1 A6,6 0 0,1 5,-1" fill="none" stroke="white" stroke-width="2" opacity="0.9"/>
                <path d="M-2.5,1 A3,3 0 0,1 2.5,1" fill="none" stroke="white" stroke-width="2" opacity="0.9"/>
                
                <!-- Center dot - larger -->
                <circle cx="0" cy="2" r="1.5" fill="white"/>
            </g>
            
            <!-- Selection indicator ring -->
            <circle cx="18" cy="18" r="16" fill="none" stroke="#FFD700" stroke-width="3" opacity="0.5"/>
        </svg>
    `;

        return L.divIcon({
            html: svgString,
            className: 'selected-tower-icon',
            iconSize: [36, 36],
            iconAnchor: [18, 36],
            popupAnchor: [0, -36]
        });
    }


    private generateSelectedTowerBuffers() {
        if (!this.mapRef || this.selectedTowers.size === 0) return;

        const selectedData = {
            type: 'FeatureCollection' as const,
            features: Array.from(this.selectedTowers.values()).map(tower => ({
                type: 'Feature' as const,
                geometry: {
                    type: 'Point' as const,
                    coordinates: [tower.coordinates[1], tower.coordinates[0]] // [lng, lat] for GeoJSON
                },
                properties: {
                    ...tower.data,
                    tower_selection_id: tower.id
                }
            }))
        };

        // Generate buffers with selected towers styling
        frontendBufferManager.generateBuffersFromTowerData(
            selectedData,
            -1, // Virtual layer ID for selected towers
            'Selected Towers',
            'Selected'
        );
    }


    private notifySelectionChange() {
        if (this.onSelectionChangeCallback) {
            this.onSelectionChangeCallback(this.getSelectedTowers());
        }
    }

    private notifyLayerUpdate() {
        if (this.onLayerUpdateCallback) {
            this.onLayerUpdateCallback(this.selectedTowersVirtualLayer);
        }
    }
}

// Create global instance
export const selectedTowersManager = new SelectedTowersManager();