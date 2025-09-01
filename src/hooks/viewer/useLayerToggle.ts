import { useCallback } from 'react';
import { frontendBufferManager, isAntennaTowerLayer } from '../../components/viewer/FrontendAntennaBufferSystem';
import { BufferVisibilityState } from '../../components/viewer/FrontendAntennaBufferSystem';
import { TowerWithBuffers } from '../../components/viewer/FrontendAntennaBufferSystem';
import { selectedTowersManager } from '../../components/viewer/SelectedTowersManager';

export const useLayerToggle = (
    mapRef: React.MutableRefObject<L.Map | null>,
    getLayerNameById: (layerId: number) => string,
    towerBufferRelationships: TowerWithBuffers[],
    setVisibleLayers: React.Dispatch<React.SetStateAction<Set<number>>>,
    setBufferVisibility: React.Dispatch<React.SetStateAction<BufferVisibilityState>>
) => {
    const handleLayerToggle = useCallback((layerId: number) => {
        setVisibleLayers(prev => {
            const newSet = new Set(prev);
            const isNowVisible = !prev.has(layerId);

            if (isNowVisible) {
                newSet.add(layerId);
            } else {
                newSet.delete(layerId);
            }

            // Handle buffer visibility for tower layers
            const layerName = getLayerNameById(layerId);
            const isTowerLayer = isAntennaTowerLayer(layerName);

            if (isTowerLayer && mapRef.current) {
                if (isNowVisible) {
                    // When tower layer is turned ON, enable buffer system but keep buffers hidden by default
                    // First, regenerate any buffers that might have been removed
                    const towerInfo = towerBufferRelationships.find(t => t.towerId === layerId);
                    if (!towerInfo || towerInfo.buffers.length === 0) {
                        // We need to regenerate buffers since they were removed
                        // This will happen on the next render when the layer data is available
                    }
                    
                    frontendBufferManager.toggleParentLayerBuffers(layerId, true, mapRef.current);
                    
                    // Ensure buffer visibility matches the UI state
                    setBufferVisibility(prevBufferState => {
                        const newBufferState = { ...prevBufferState };
                        
                        // Get current buffer states for this layer
                        Object.entries(newBufferState).forEach(([bufferId, isVisible]) => {
                            if (bufferId.startsWith(`buffer_${layerId}_`)) {
                                // Apply current buffer visibility state from UI
                                frontendBufferManager.toggleBufferLayer(
                                    bufferId, 
                                    isVisible, 
                                    mapRef.current!, 
                                    true
                                );
                            }
                        });
                        
                        return newBufferState;
                    });
                } else {
                    // When tower layer is turned OFF, force hide and disable all buffers
                    frontendBufferManager.toggleParentLayerBuffers(layerId, false, mapRef.current);

                    if (layerId === -1) {
                        // Immediately hide selected towers layer and its buffers
                        selectedTowersManager.toggleSelectedLayerVisibility(false);
                        frontendBufferManager.removeBuffersForTower(-1, mapRef.current);
                    }
                    
                    // Physically remove all buffers from the map
                    const towerBuffers = towerBufferRelationships.find(rel => rel.towerId === layerId);
                    if (towerBuffers) {
                        towerBuffers.buffers.forEach(buffer => {
                            if (mapRef.current!.hasLayer(buffer.layerGroup)) {
                                mapRef.current!.removeLayer(buffer.layerGroup);
                                if (buffer.optimizedBufferLayer) {
                                    buffer.optimizedBufferLayer.detachFromMap();
                                }
                            }
                        });
                    }

                    // Also update buffer visibility state to reflect that buffers are off
                    setBufferVisibility(prevBufferState => {
                        const newBufferState = { ...prevBufferState };
                        const towerBuffers = towerBufferRelationships.find(rel => rel.towerId === layerId);
                        if (towerBuffers) {
                            towerBuffers.buffers.forEach(buffer => {
                                newBufferState[buffer.id] = false;
                            });
                        }
                        return newBufferState;
                    });
                }
            }

            return newSet;
        });
    }, [getLayerNameById, towerBufferRelationships]);

    return {
        handleLayerToggle
    };
};
