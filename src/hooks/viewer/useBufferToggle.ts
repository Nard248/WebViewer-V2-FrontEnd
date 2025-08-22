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
            const parentVisible = buffer ? visibleLayers.has(buffer.parentLayerId) : false;

            frontendBufferManager.toggleBufferLayer(bufferId, isVisible, mapRef.current, parentVisible);
        }
    }, [visibleLayers]);

    return {
        handleBufferToggle
    };
};
