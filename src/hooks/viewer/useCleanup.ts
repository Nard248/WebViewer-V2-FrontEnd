import { useEffect } from 'react';
import { frontendBufferManager } from '../../components/viewer/FrontendAntennaBufferSystem';
import { zoomVisibilityManager } from '../../components/viewer/ZoomVisibilityManager';
import iconPool from '../../utils/viewer/iconPool';

export const useCleanup = (mapRef: React.MutableRefObject<L.Map | null>) => {
    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (mapRef.current) {
                frontendBufferManager.cleanup(mapRef.current);
                zoomVisibilityManager.cleanup();
                // Clear the icon pool to free memory
                iconPool.clearIconPool();
            }
        };
    }, []);
};
