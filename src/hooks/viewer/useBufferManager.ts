import { useEffect } from 'react';
import { frontendBufferManager, TowerWithBuffers } from '../../components/viewer/FrontendAntennaBufferSystem';

export const useBufferManager = (
    onTowersChange: (towers: TowerWithBuffers[]) => void,
    ensureBufferVisibilityKeys: (towers: TowerWithBuffers[]) => void
) => {
    useEffect(() => {
        const handleBufferChange = (towers: TowerWithBuffers[]) => {
            onTowersChange(towers);
            ensureBufferVisibilityKeys(towers);
        };

        frontendBufferManager.onVisibilityChange(handleBufferChange);
        return () => {
            frontendBufferManager.offVisibilityChange(handleBufferChange);
        };
    }, [onTowersChange, ensureBufferVisibilityKeys]);
};


