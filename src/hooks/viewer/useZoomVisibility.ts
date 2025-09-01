import { useEffect } from 'react';
import { zoomVisibilityManager, ZoomHint } from '../../components/viewer/ZoomVisibilityManager';

export const useZoomVisibility = (
    onZoomLayerToggle: (layerId: number, visible: boolean, reason: 'zoom' | 'user') => void,
    onZoomHints: (hints: ZoomHint[]) => void,
    onBufferVisibilityUpdate?: (bufferIds: string[], visible: boolean) => void
) => {
    useEffect(() => {
        zoomVisibilityManager.onLayerToggle(onZoomLayerToggle);
        zoomVisibilityManager.onZoomHints(onZoomHints);
        if (onBufferVisibilityUpdate) {
            zoomVisibilityManager.setBufferVisibilityUpdateCallback(onBufferVisibilityUpdate);
        }
        return () => {
            zoomVisibilityManager.offLayerToggle(onZoomLayerToggle);
            zoomVisibilityManager.offZoomHints(onZoomHints);
        };
    }, [onZoomLayerToggle, onZoomHints, onBufferVisibilityUpdate]);
};


