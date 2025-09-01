import { useCallback } from 'react';
import { frontendBufferManager, BufferVisibilityState } from '../../components/viewer/FrontendAntennaBufferSystem';

export const useBufferToggle = (
    mapRef: React.MutableRefObject<L.Map | null>,
    visibleLayers: Set<number>,
    setBufferVisibility: React.Dispatch<React.SetStateAction<BufferVisibilityState>>,
    zoomVisibilityManager?: any
) => {
    const handleBufferToggle = useCallback((bufferId: string, isVisible: boolean) => {
        setBufferVisibility(prev => ({
            ...prev,
            [bufferId]: isVisible
        }));

        if (mapRef.current) {
            const buffer = frontendBufferManager.getBufferLayer(bufferId);
            const parentVisible = buffer ? visibleLayers.has(buffer.parentLayerId) : false;

            let finalParentVisible = parentVisible;
            if (zoomVisibilityManager && buffer) {
                const zoomStatus = zoomVisibilityManager.getLayerZoomStatus(buffer.parentLayerId);
                finalParentVisible = parentVisible && zoomStatus.canShow;
            }

            frontendBufferManager.toggleBufferLayer(bufferId, isVisible, mapRef.current, finalParentVisible, zoomVisibilityManager);
        }
    }, [visibleLayers, zoomVisibilityManager]);

    return {
        handleBufferToggle
    };
};
