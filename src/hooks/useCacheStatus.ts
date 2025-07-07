import { useState, useEffect } from 'react';
import { layerDataCache } from '../utils/LayerDataCache';

export const useCacheStatus = (layerIds: number[]) => {
    const [cacheStatus, setCacheStatus] = useState<{ [layerId: number]: boolean }>({});

    useEffect(() => {
        const checkCache = () => {
            const status: { [layerId: number]: boolean } = {};
            layerIds.forEach(layerId => {
                status[layerId] = layerDataCache.hasValidCache(layerId);
            });
            setCacheStatus(status);
        };

        checkCache();

        // Check every 30 seconds
        const interval = setInterval(checkCache, 30000);

        return () => clearInterval(interval);
    }, [layerIds]);

    return cacheStatus;
};
