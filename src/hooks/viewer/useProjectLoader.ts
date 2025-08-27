import { useEffect, useRef, useState } from 'react';
import { projectService } from '../../services';
import { cbrsService, CBRSLicense } from '../../services/cbrsService';
import { layerDataCache } from '../../utils/LayerDataCache';
import { optimizedGet, getOptimalBatchSize, cancelAllRequests } from '../../utils/requestOptimizer';

export interface UseProjectLoaderResult {
    projectData: any | null;
    loading: boolean;
    loadingProgress: number;
    loadingStatus: string;
    error: string | null;
    visibleLayers: Set<number>;
    setVisibleLayers: React.Dispatch<React.SetStateAction<Set<number>>>;
    activeBasemap: number | null;
    setActiveBasemap: (id: number | null) => void;
    allLayersLoaded: boolean;
    layerLoadProgress: { [layerId: number]: boolean };
    fallbackLayerData: { [layerId: number]: any };
    cbrsLicenses: CBRSLicense[];
}

export const useProjectLoader = (
    projectIdentifier: string | undefined,
    isPublicAccess: boolean,
    hash?: string
): UseProjectLoaderResult => {
    const [projectData, setProjectData] = useState<any | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [loadingProgress, setLoadingProgress] = useState<number>(5);
    const [loadingStatus, setLoadingStatus] = useState<string>('Loading project...');
    const [error, setError] = useState<string | null>(null);
    const [visibleLayers, setVisibleLayers] = useState<Set<number>>(new Set());
    const [activeBasemap, setActiveBasemap] = useState<number | null>(null);
    const [allLayersLoaded, setAllLayersLoaded] = useState<boolean>(false);
    const [layerLoadProgress, setLayerLoadProgress] = useState<{ [layerId: number]: boolean }>({});
    const [fallbackLayerData, setFallbackLayerData] = useState<{ [layerId: number]: any }>({});
    const [cbrsLicenses, setCbrsLicenses] = useState<CBRSLicense[]>([]);

    // Track total layers and completed layers for progress calculation
    const totalLayersRef = useRef(0);
    const completedLayersRef = useRef(0);

    useEffect(() => {
        let mounted = true;
        const abortController = new AbortController();

        // Helper function to load a single chunk of a layer
        const loadLayerChunk = async (
            layerId: number, 
            chunkId: number, 
            requestOptions: any,
            priority: number = 5
        ): Promise<{features: any[], nextChunk: number | null}> => {
            try {
                // Use optimized request with priority
                const url = `/data-fast/${layerId}/`;
                const params = {
                    chunk_id: chunkId,
                    bounds: '-180,-90,180,90',
                    zoom: 1
                };
                
                const config = {
                    params,
                    ...requestOptions,
                    signal: abortController.signal
                };
                
                // Use optimized request with priority based on layer visibility and chunk number
                // First chunks get higher priority (lower number)
                const chunkPriority = chunkId === 1 ? priority - 2 : priority;
                const chunkData = await optimizedGet(url, config, chunkPriority);
                
                const features = chunkData.features || [];
                const nextChunk = chunkData.chunk_info?.next_chunk || null;
                
                return { features, nextChunk };
            } catch (error) {
                // If aborted, rethrow to be caught by the caller
                if ((error as any)?.name === 'AbortError') {
                    throw error;
                }
                // Otherwise return empty result
                return { features: [], nextChunk: null };
            }
        };

        // Load all chunks for a specific layer in parallel
        const loadCompleteLayer = async (
            layerInfo: any, 
            requestOptions: any
        ): Promise<{layerId: number, data: any}> => {
            const layerId = layerInfo.id;
            
            try {
                // Check cache first
                const cachedData = layerDataCache.getLayerData(layerId);
                if (cachedData) {
                    return { layerId, data: cachedData.data };
                }
                
                // Determine priority based on layer visibility
                const isVisible = layerInfo.is_visible || layerInfo.is_visible_by_default;
                const layerPriority = isVisible ? 3 : 6; // Lower number = higher priority
                
                // First, fetch chunk 1 to determine total chunks
                const firstChunkResult = await loadLayerChunk(layerId, 1, requestOptions, layerPriority);
                let allFeatures = [...firstChunkResult.features];
                
                // If there are more chunks, load them in parallel
                if (firstChunkResult.nextChunk) {
                    // Determine how many chunks to load
                    // We'll use a two-phase approach:
                    // 1. Load first chunk to discover next chunk
                    // 2. Fetch a batch of chunks in parallel
                    // 3. Repeat until all chunks are loaded
                    
                    let chunksToLoad = [];
                    let nextChunkId = firstChunkResult.nextChunk;
                    
                    while (nextChunkId > 0 && mounted) {
                        // Prepare a batch of chunk requests with dynamic batch size
                        chunksToLoad = [];
                        // Use adaptive batch sizing based on network conditions
                        const MAX_PARALLEL_CHUNKS = Math.min(getOptimalBatchSize(), 15);
                        
                        for (let i = 0; i < MAX_PARALLEL_CHUNKS && nextChunkId > 0; i++) {
                            chunksToLoad.push(nextChunkId);
                            nextChunkId++; // Assume sequential chunk IDs
                        }
                        
                        if (chunksToLoad.length === 0) break;
                        
                        // Load chunks in parallel with decreasing priority for later chunks
                        const chunkPromises = chunksToLoad.map((chunkId, index) => {
                            // Gradually decrease priority for chunks later in the sequence
                            // This ensures earlier chunks load first if network is constrained
                            const chunkPriority = layerPriority + Math.min(3, Math.floor(index / 3));
                            return loadLayerChunk(layerId, chunkId, requestOptions, chunkPriority);
                        });
                        
                        try {
                            const chunkResults = await Promise.all(chunkPromises);
                            
                            // Process results and determine if we need to continue
                            let shouldContinue = false;
                            
                            for (const result of chunkResults) {
                                if (result.features.length > 0) {
                                    allFeatures.push(...result.features);
                                    
                                    // If any chunk has a next chunk that's beyond our current nextChunkId,
                                    // update nextChunkId to continue loading
                                    if (result.nextChunk && result.nextChunk > nextChunkId) {
                                        nextChunkId = result.nextChunk;
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
                
                // Create combined data object
                const combinedData = {
                    type: 'FeatureCollection' as const,
                    features: allFeatures
                };
                
                // Try to cache the data
                try {
                    layerDataCache.setLayerData(layerId, layerInfo.name, combinedData);
                } catch (cacheError) {
                    // Non-fatal caching error
                }
                
                return { layerId, data: combinedData };
            } catch (error) {
                // Return empty data on error
                return { 
                    layerId, 
                    data: { 
                        type: 'FeatureCollection', 
                        features: [] 
                    } 
                };
            }
        };

        // Function to preload all layer data in parallel
        const preloadAllLayerData = async (allLayers: any[]) => {
            if (allLayers.length === 0) return;
            
            totalLayersRef.current = allLayers.length;
            completedLayersRef.current = 0;
            
            const loadedData: { [layerId: number]: any } = {};
            const requestOptions = isPublicAccess && hash ? {
                headers: {
                    'X-Public-Token': hash,
                    'Origin': window.location.origin
                }
            } : {};
            
            // Update loading status to show we're loading in parallel
            setLoadingStatus(`Loading ${allLayers.length} layers in parallel...`);
            setLoadingProgress(30);
            
            // Create a batch of promises to load layers in parallel
            // Process in batches with adaptive sizing based on network conditions
            const BATCH_SIZE = Math.min(getOptimalBatchSize(), 15); // Dynamic batch size
            
            for (let i = 0; i < allLayers.length; i += BATCH_SIZE) {
                if (!mounted) break;
                
                const batch = allLayers.slice(i, i + BATCH_SIZE);
                
                // Sort the batch by priority - visible layers first
                const sortedBatch = [...batch].sort((a, b) => {
                    // Prioritize visible layers
                    const aVisible = a.is_visible || a.is_visible_by_default;
                    const bVisible = b.is_visible || b.is_visible_by_default;
                    if (aVisible && !bVisible) return -1;
                    if (!aVisible && bVisible) return 1;
                    return 0;
                });
                
                const batchPromises = sortedBatch.map(layerInfo => 
                    loadCompleteLayer(layerInfo, requestOptions)
                );
                
                try {
                    // Wait for the current batch to complete
                    const results = await Promise.all(batchPromises);
                    
                    // Process results
                    results.forEach(({ layerId, data }) => {
                        loadedData[layerId] = data;
                        
                        // Update progress
                        completedLayersRef.current++;
                        const progressPercent = 30 + (completedLayersRef.current / totalLayersRef.current * 65);
                        
                        if (mounted) {
                            setLayerLoadProgress(prev => ({ ...prev, [layerId]: true }));
                            setLoadingProgress(Math.min(95, progressPercent));
                            setLoadingStatus(`Loaded ${completedLayersRef.current}/${totalLayersRef.current} layers...`);
                        }
                    });
                } catch (error) {
                    // Continue with next batch even if this one fails
                    console.error("Error loading batch:", error);
                }
            }
            
            if (mounted) {
                setFallbackLayerData(loadedData);
            }
        };

        const loadProject = async (projId: string) => {
            try {
                setLoading(true);
                setLoadingProgress(5);
                setLoadingStatus('Loading project configuration...');

                if (!projId) throw new Error('No project ID provided');

                const data = await projectService.getProjectConstructor(Number(projId));
                setLoadingProgress(15);
                if (!mounted) return;

                setProjectData(data);
                setLoadingStatus('Loading CBRS data...');

                const stateAbbr = (data as any)?.project?.state_abbr;
                if (stateAbbr) {
                    try {
                        const licenses = await cbrsService.getCBRSLicensesByState(stateAbbr);
                        setCbrsLicenses(licenses);
                    } catch {}
                }
                setLoadingProgress(25);

                const initialVisibleLayers = new Set<number>();
                const allLayers: any[] = [];
                if (data.layer_groups) {
                    data.layer_groups.forEach((group: any) => {
                        if (group.layers) {
                            group.layers.forEach((layer: any) => {
                                allLayers.push(layer);
                                if (layer.is_visible || layer.is_visible_by_default) {
                                    initialVisibleLayers.add(layer.id);
                                }
                            });
                        }
                    });
                }
                setVisibleLayers(initialVisibleLayers);

                const defaultBasemap = data.basemaps?.find((b: any) => b.is_default);
                if (defaultBasemap) setActiveBasemap(defaultBasemap.id);
                else if (data.basemaps?.length > 0) setActiveBasemap(data.basemaps[0].id);

                setLoadingStatus('Pre-loading all layer data...');
                setLoadingProgress(30);
                await preloadAllLayerData(allLayers);

                if (mounted) {
                    setAllLayersLoaded(true);
                    setLoadingStatus('Initializing map...');
                    setLoadingProgress(100);
                    setTimeout(() => { if (mounted) setLoading(false); }, 500);
                }
            } catch (err: any) {
                if (mounted) {
                    setError(err.message || 'Failed to load project');
                    setLoading(false);
                }
            }
        };

        const loadPublicProject = async (token: string) => {
            try {
                setLoading(true);
                setLoadingProgress(10);
                setLoadingStatus('Loading public project...');

                const data = await projectService.getPublicProjectConstructor(token);
                setLoadingProgress(20);
                if (!mounted) return;

                setProjectData(data);
                setLoadingStatus('Pre-loading all layer data...');

                const initialVisibleLayers = new Set<number>();
                const allLayers: any[] = [];
                if (data.layer_groups) {
                    data.layer_groups.forEach((group: any) => {
                        if (group.layers) {
                            group.layers.forEach((layer: any) => {
                                allLayers.push(layer);
                                if (layer.is_visible || layer.is_visible_by_default) {
                                    initialVisibleLayers.add(layer.id);
                                }
                            });
                        }
                    });
                }
                setVisibleLayers(initialVisibleLayers);

                const defaultBasemap = data.basemaps?.find((b: any) => b.is_default);
                if (defaultBasemap) setActiveBasemap(defaultBasemap.id);
                else if (data.basemaps?.length > 0) setActiveBasemap(data.basemaps[0].id);

                await preloadAllLayerData(allLayers);

                if (mounted) {
                    setAllLayersLoaded(true);
                    setLoadingProgress(100);
                    setLoading(false);
                }
            } catch (err: any) {
                if (mounted) {
                    setError('Invalid or expired public link');
                    setLoading(false);
                }
            }
        };

        if (projectIdentifier) {
            if (isPublicAccess) loadPublicProject(projectIdentifier);
            else loadProject(projectIdentifier);
        }

        return () => { 
            mounted = false; 
            abortController.abort();
            // Cancel any pending optimized requests to free up resources
            cancelAllRequests();
        };
    }, [projectIdentifier, isPublicAccess, hash]);

    return {
        projectData,
        loading,
        loadingProgress,
        loadingStatus,
        error,
        visibleLayers,
        setVisibleLayers,
        activeBasemap,
        setActiveBasemap,
        allLayersLoaded,
        layerLoadProgress,
        fallbackLayerData,
        cbrsLicenses
    };
};