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
                    frontendBufferManager.toggleParentLayerBuffers(layerId, true, mapRef.current);
                } else {
                    // When tower layer is turned OFF, force hide and disable all buffers
                    frontendBufferManager.toggleParentLayerBuffers(layerId, false, mapRef.current);

                    if (layerId === -1) {
                        // Immediately hide selected towers layer and its buffers
                        selectedTowersManager.toggleSelectedLayerVisibility(false);
                        if (mapRef.current) {
                            frontendBufferManager.forceHideBuffersForTower(-1, mapRef.current);
                            frontendBufferManager.removeBuffersForTower(-1, mapRef.current);
                        }
                        setBufferVisibility(prev => {
                            const updated: Record<string, boolean> = { ...prev };
                            Object.keys(updated).forEach(id => {
                                if (id.startsWith('buffer_-1_')) {
                                    updated[id] = false;
                                }
                            });
                            return updated;
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
