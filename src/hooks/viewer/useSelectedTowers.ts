import { useEffect, useCallback } from 'react';
import { frontendBufferManager } from '../../components/viewer/FrontendAntennaBufferSystem';
import { selectedTowersManager, SelectedTower } from '../../components/viewer/SelectedTowersManager';
import { BufferVisibilityState } from '../../components/viewer/FrontendAntennaBufferSystem';

export const useSelectedTowers = (
    selectedTowers: SelectedTower[],
    setSelectedTowers: React.Dispatch<React.SetStateAction<SelectedTower[]>>,
    setVisibleLayers: React.Dispatch<React.SetStateAction<Set<number>>>,
    setPreloadedLayers: React.Dispatch<React.SetStateAction<{ [layerId: number]: any }>>,
    setBufferVisibility: React.Dispatch<React.SetStateAction<BufferVisibilityState>>,
    projectData: any | null,
    mapRef: React.MutableRefObject<L.Map | null>
) => {
    // Update layer visibility when selected towers change
    useEffect(() => {
        setVisibleLayers(prev => {
            if (selectedTowers.length > 0) {
                // Auto-enable the Selected Towers layer when towers are selected
                return new Set([...prev, -1]);
            } else {
                // Auto-disable the Selected Towers layer when no towers are selected
                const newSet = new Set(prev);
                newSet.delete(-1);

                // Clean up ALL references to selected towers layer
                setPreloadedLayers(prevLayers => {
                    const newLayers = { ...prevLayers };
                    if (newLayers[-1]) {
                        // Remove from map if currently displayed
                        if (mapRef.current && mapRef.current.hasLayer(newLayers[-1])) {
                            mapRef.current.removeLayer(newLayers[-1]);
                        }
                        delete newLayers[-1];
                    }
                    return newLayers;
                });

                // Also clean up from project data to prevent duplicates
                if (projectData?.layer_groups) {
                    projectData.layer_groups.forEach((group: any) => {
                        if (group.layers) {
                            group.layers = group.layers.filter((layer: any) => layer.id !== -1);
                        }
                    });
                }

                // Reset buffer visibility for selected towers and force cleanup
                if (mapRef.current) {
                    frontendBufferManager.forceHideBuffersForTower(-1, mapRef.current);
                    frontendBufferManager.removeBuffersForTower(-1, mapRef.current);
                }
                setBufferVisibility(prevBuffers => {
                    const updated: Record<string, boolean> = { ...prevBuffers };
                    Object.keys(updated).forEach(id => {
                        if (id.startsWith('buffer_-1_')) {
                            updated[id] = false;
                        }
                    });
                    return updated;
                });

                if (mapRef.current) {
                    frontendBufferManager.removeBuffersForTower(-1, mapRef.current);
                }

                return newSet;
            }
        });
    }, [selectedTowers]);

    const handleSelectedTowersToggle = useCallback((isVisible: boolean) => {
        if (isVisible) {
            setVisibleLayers(prev => new Set([...prev, -1]));
            selectedTowersManager.toggleSelectedLayerVisibility(true);
            
            // Important: When re-enabling selected towers layer, we need to 
            // respect the buffer visibility state from the UI
            // This ensures buffers don't appear when their checkboxes are unchecked
            if (mapRef.current) {
                // Get the current buffer visibility state
                setBufferVisibility(prev => {
                    const bufferState = { ...prev };
                    
                    // Apply the current buffer visibility state
                    Object.entries(bufferState).forEach(([bufferId, isVisible]) => {
                        if (bufferId.startsWith('buffer_-1_')) {
                            // Apply the buffer visibility based on the checkbox state
                            frontendBufferManager.toggleBufferLayer(
                                bufferId, 
                                isVisible, 
                                mapRef.current!, 
                                true
                            );
                        }
                    });
                    
                    return bufferState;
                });
            }
        } else {
            setVisibleLayers(prev => {
                const newSet = new Set(prev);
                newSet.delete(-1);
                return newSet;
            });
            selectedTowersManager.toggleSelectedLayerVisibility(false);
            if (mapRef.current) {
                // Force remove ALL buffers for selected towers layer, regardless of their visibility state
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
    }, [mapRef]);

    return {
        handleSelectedTowersToggle
    };
};
