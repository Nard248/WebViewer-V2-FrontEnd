import { useEffect } from 'react';
import { frontendBufferManager } from '../../components/viewer/FrontendAntennaBufferSystem';
import { zoomVisibilityManager } from '../../components/viewer/ZoomVisibilityManager';

export const useCleanup = (mapRef: React.MutableRefObject<L.Map | null>) => {
    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (mapRef.current) {
                frontendBufferManager.cleanup(mapRef.current);
                zoomVisibilityManager.cleanup();
            }
        };
    }, []);
};
