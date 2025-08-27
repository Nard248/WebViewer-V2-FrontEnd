import { useState, useCallback } from 'react';
import { layerDataCache } from '../../utils/LayerDataCache';
import { optimizedGet, getOptimalBatchSize } from '../../utils/requestOptimizer';

/**
 * Custom hook for lazy loading layer data when needed
 * This is used to load layers that weren't initially visible
 * but are toggled on later by the user
 */
export const useLazyLayerLoader = (
    isPublicAccess: boolean,
    hash?: string
) => {
    const [loadingLayers, setLoadingLayers] = useState<Set<number>>(new Set());
    const [loadedLayerData, setLoadedLayerData] = useState<{ [layerId: number]: any }>({});

    // Function to load a layer on demand
    const loadLayerData = useCallback(async (
        layerId: number,
        layerName: string
    ): Promise<any> => {
        // Check if already loaded or loading
        if (loadedLayerData[layerId] || loadingLayers.has(layerId)) {
            return loadedLayerData[layerId];
        }

        // Check cache first
        const cachedData = layerDataCache.getLayerData(layerId);
        if (cachedData) {
            setLoadedLayerData(prev => ({
                ...prev,
                [layerId]: cachedData.data
            }));
            return cachedData.data;
        }

        try {
            // Mark as loading
            setLoadingLayers(prev => new Set([...prev, layerId]));

            // Load chunks in parallel
            let allFeatures: any[] = [];
            const requestOptions = isPublicAccess && hash ? {
                headers: {
                    'X-Public-Token': hash,
                    'Origin': window.location.origin
                }
            } : {};

            // First, fetch chunk 1 to determine total chunks
            try {
                const url = `/data-fast/${layerId}/`;
                const params = {
                    chunk_id: 1,
                    bounds: '-180,-90,180,90',
                    zoom: 1
                };
                
                const config = {
                    params,
                    ...requestOptions
                };
                
                // Use optimized request with high priority for first chunk
                const firstChunkData = await optimizedGet(url, config, 2);

                if (firstChunkData.features && firstChunkData.features.length > 0) {
                    allFeatures.push(...firstChunkData.features);
                    
                    // If there are more chunks, load them in parallel
                    if (firstChunkData.chunk_info && firstChunkData.chunk_info.next_chunk) {
                        let nextChunkId = firstChunkData.chunk_info.next_chunk;
                        
                        while (nextChunkId > 0) {
                            // Prepare a batch of chunk requests with dynamic batch size
                            const chunksToLoad = [];
                            // Use adaptive batch sizing based on network conditions
                            const MAX_PARALLEL_CHUNKS = Math.min(getOptimalBatchSize(), 15);
                            
                            for (let i = 0; i < MAX_PARALLEL_CHUNKS && nextChunkId > 0; i++) {
                                chunksToLoad.push(nextChunkId);
                                nextChunkId++; // Assume sequential chunk IDs
                            }
                            
                            if (chunksToLoad.length === 0) break;
                            
                            // Load chunks in parallel with decreasing priority for later chunks
                            const chunkPromises = chunksToLoad.map((chunkId, index) => {
                                const url = `/data-fast/${layerId}/`;
                                const params = {
                                    chunk_id: chunkId,
                                    bounds: '-180,-90,180,90',
                                    zoom: 1
                                };
                                
                                const config = {
                                    params,
                                    ...requestOptions
                                };
                                
                                // Gradually decrease priority for chunks later in the sequence
                                const chunkPriority = 3 + Math.min(3, Math.floor(index / 3));
                                return optimizedGet(url, config, chunkPriority);
                            });
                            
                            try {
                                const chunkResults = await Promise.all(chunkPromises);
                                let shouldContinue = false;
                                
                                for (const result of chunkResults) {
                                    if (result.features && result.features.length > 0) {
                                        allFeatures.push(...result.features);
                                        
                                        // If any chunk has a next chunk that's beyond our current nextChunkId,
                                        // update nextChunkId to continue loading
                                        if (result.chunk_info && result.chunk_info.next_chunk && 
                                            result.chunk_info.next_chunk > nextChunkId) {
                                            nextChunkId = result.chunk_info.next_chunk;
                                            shouldContinue = true;
                                        }
                                    }
                                }
                                
                                if (!shouldContinue) {
                                    // If none of the chunks indicated more chunks, we're done
                                    nextChunkId = 0;
                                }
                            } catch (error) {
                                console.error(`Error loading chunk batch for layer ${layerId}:`, error);
                                nextChunkId = 0; // Stop loading on error
                            }
                        }
                    }
                }
            } catch (error) {
                console.error(`Error loading first chunk for layer ${layerId}:`, error);
            }

            // Create the combined data object
            const combinedData = {
                type: 'FeatureCollection' as const,
                features: allFeatures
            };

            // Cache the data
            try {
                layerDataCache.setLayerData(layerId, layerName, combinedData);
            } catch (error) {
                console.warn(`Failed to cache layer ${layerName}, but data is still available in memory:`, error);
            }

            // Update state
            setLoadedLayerData(prev => ({
                ...prev,
                [layerId]: combinedData
            }));

            // Remove from loading state
            setLoadingLayers(prev => {
                const newSet = new Set([...prev]);
                newSet.delete(layerId);
                return newSet;
            });

            return combinedData;
        } catch (error) {
            console.error(`Error loading layer ${layerId}:`, error);
            
            // Remove from loading state
            setLoadingLayers(prev => {
                const newSet = new Set([...prev]);
                newSet.delete(layerId);
                return newSet;
            });
            
            // Return empty data
            return {
                type: 'FeatureCollection',
                features: []
            };
        }
    }, [isPublicAccess, hash, loadingLayers, loadedLayerData]);

    return {
        loadLayerData,
        loadingLayers,
        loadedLayerData,
        isLayerLoading: (layerId: number) => loadingLayers.has(layerId)
    };
};
