import { useCallback } from 'react';
import { frontendBufferManager, BufferVisibilityState } from '../../components/viewer/FrontendAntennaBufferSystem';

export const useBufferToggle = (
    mapRef: React.MutableRefObject<L.Map | null>,
    visibleLayers: Set<number>,
    setBufferVisibility: React.Dispatch<React.SetStateAction<BufferVisibilityState>>
) => {
    const handleBufferToggle = useCallback((bufferId: string, isVisible: boolean) => {
        setBufferVisibility(prev => ({
            ...prev,
            [bufferId]: isVisible
        }));

        if (mapRef.current) {
            // Check if parent tower is visible
            const buffer = frontendBufferManager.getBufferLayer(bufferId);
            
            if (buffer) {
                const parentVisible = visibleLayers.has(buffer.parentLayerId);
                
                // First, ensure the buffer is removed from the map if it should be hidden
                if (!isVisible || !parentVisible) {
                    if (mapRef.current.hasLayer(buffer.layerGroup)) {
                        mapRef.current.removeLayer(buffer.layerGroup);
                        if (buffer.optimizedBufferLayer) {
                            buffer.optimizedBufferLayer.detachFromMap();
                        }
                    }
                }
                
                // Then update the buffer visibility state
                frontendBufferManager.toggleBufferLayer(bufferId, isVisible, mapRef.current, parentVisible);
            }
        }
    }, [visibleLayers]);

    return {
        handleBufferToggle
    };
};

