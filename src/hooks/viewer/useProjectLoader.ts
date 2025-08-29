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

    // Track total chunks and completed chunks for progress calculation
    const totalChunksRef = useRef(0);
    const completedChunksRef = useRef(0);

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
                
                console.log(`📦 Loading chunk ${chunkId} for layer ${layerId}`);
                console.log(`📡 Chunk URL: ${url}`);
                console.log(`📝 Chunk params:`, params);
                console.log(`🔧 Request options:`, requestOptions);
                
                // Use optimized request with priority based on layer visibility and chunk number
                // First chunks get higher priority (lower number)
                const chunkPriority = chunkId === 1 ? priority - 2 : priority;
                const chunkData = await optimizedGet(url, config, chunkPriority);
                
                const features = chunkData.features || [];
                const nextChunk = chunkData.chunk_info?.next_chunk || null;
                
                console.log(`✅ Chunk ${chunkId} loaded for layer ${layerId}: ${features.length} features, next chunk: ${nextChunk}`);
                console.log(`📊 Chunk response:`, { featuresCount: features.length, nextChunk, chunkInfo: chunkData.chunk_info });
                
                return { features, nextChunk };
            } catch (error) {
                console.error(`❌ Error loading chunk ${chunkId} for layer ${layerId}:`, error);
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
            
            console.log(`🔄 Starting to load complete layer: ${layerInfo.name} (ID: ${layerId})`);
            
            try {
                // Caching disabled - always fetch fresh data
                // const cachedData = layerDataCache.getLayerData(layerId);
                // if (cachedData) {
                //     return { layerId, data: cachedData.data };
                // }
                
                // Determine priority based on layer visibility
                const isVisible = layerInfo.is_visible || layerInfo.is_visible_by_default;
                const layerPriority = isVisible ? 3 : 6; // Lower number = higher priority
                
                // Get chunk IDs from constructor data instead of following nextChunk values
                const chunkIds = layerInfo.data_source?.chunk_ids || [1];
                console.log(`📋 Layer ${layerId} has ${chunkIds.length} chunks:`, chunkIds);
                
                let allFeatures: any[] = [];
                
                // Load all chunks based on the chunk_ids from constructor
                for (const chunkId of chunkIds) {
                    if (!mounted) break;
                    
                    try {
                        const chunkResult = await loadLayerChunk(layerId, chunkId, requestOptions, layerPriority);
                        
                        if (chunkResult.features.length > 0) {
                            allFeatures.push(...chunkResult.features);
                        }
                        
                        // Update chunk progress
                        if (mounted) {
                            completedChunksRef.current++;
                            const progressPercent = 30 + (completedChunksRef.current / totalChunksRef.current * 65);
                            setLoadingProgress(Math.min(95, progressPercent));
                            setLoadingStatus(`Loaded ${completedChunksRef.current}/${totalChunksRef.current} chunks...`);
                        }
                        
                    } catch (error) {
                        console.error(`Error loading chunk ${chunkId} for layer ${layerId}:`, error);
                        // Update progress even for failed chunks to avoid getting stuck
                        if (mounted) {
                            completedChunksRef.current++;
                            const progressPercent = 30 + (completedChunksRef.current / totalChunksRef.current * 65);
                            setLoadingProgress(Math.min(95, progressPercent));
                            setLoadingStatus(`Loaded ${completedChunksRef.current}/${totalChunksRef.current} chunks...`);
                        }
                        // Continue loading other chunks even if one fails
                    }
                }
                
                // Create combined data object
                const combinedData = {
                    type: 'FeatureCollection' as const,
                    features: allFeatures
                };
                
                console.log(`🎉 Layer ${layerId} (${layerInfo.name}) fully loaded: ${allFeatures.length} total features`);
                
                // Caching disabled
                // try {
                //     layerDataCache.setLayerData(layerId, layerInfo.name, combinedData);
                // } catch (cacheError) {
                //     // Non-fatal caching error
                // }
                
                return { layerId, data: combinedData };
            } catch (error) {
                console.error(`❌ Error loading complete layer ${layerId} (${layerInfo.name}):`, error);
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
            
            // Calculate total chunks across all layers
            totalChunksRef.current = allLayers.reduce((total, layer) => {
                const chunkIds = layer.data_source?.chunk_ids || [1];
                return total + chunkIds.length;
            }, 0);
            completedChunksRef.current = 0;
            
            const loadedData: { [layerId: number]: any } = {};
            const requestOptions = isPublicAccess && hash ? {
                headers: {
                    'X-Public-Token': hash,
                    'Origin': window.location.origin
                }
            } : {};
            
            // Update loading status to show we're loading in parallel
            setLoadingStatus(`Loading ${totalChunksRef.current} chunks from ${allLayers.length} layers...`);
            setLoadingProgress(30);
            
            // Create a batch of promises to load layers in parallel
            // Process in batches with adaptive sizing based on network conditions
            const BATCH_SIZE = Math.min(getOptimalBatchSize(), 15); // Dynamic batch size
            
            for (let i = 0; i < allLayers.length; i += BATCH_SIZE) {
                if (!mounted) break;
                
                const batch = allLayers.slice(i, i + BATCH_SIZE);
                console.log(`📦 Processing batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(allLayers.length/BATCH_SIZE)}: ${batch.length} layers`);
                console.log(`📝 Batch layers:`, batch.map(l => ({id: l.id, name: l.name, visible: l.is_visible || l.is_visible_by_default})));
                
                // Sort the batch by priority - visible layers first
                const sortedBatch = [...batch].sort((a, b) => {
                    // Prioritize visible layers
                    const aVisible = a.is_visible || a.is_visible_by_default;
                    const bVisible = b.is_visible || b.is_visible_by_default;
                    if (aVisible && !bVisible) return -1;
                    if (!aVisible && bVisible) return 1;
                    return 0;
                });
                
                console.log(`🔄 Loading batch with request options:`, requestOptions);
                const batchPromises = sortedBatch.map(layerInfo => 
                    loadCompleteLayer(layerInfo, requestOptions)
                );
                
                try {
                    // Wait for the current batch to complete
                    const results = await Promise.all(batchPromises);
                    
                    // Process results
                    results.forEach(({ layerId, data }) => {
                        loadedData[layerId] = data;
                        
                        if (mounted) {
                            setLayerLoadProgress(prev => ({ ...prev, [layerId]: true }));
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

                console.log(`🏗️ Loading project constructor for ID: ${projId}`);
                console.log(`📡 Constructor URL: /api/projects/${projId}/constructor`);
                
                const data = await projectService.getProjectConstructor(Number(projId));
                console.log(`✅ Constructor response received:`, data);
                setLoadingProgress(15);
                if (!mounted) return;

                setProjectData(data);
                setLoadingStatus('Loading CBRS data...');

                const stateAbbr = data?.project?.state_abbr;
                console.log(`🌟 Project state abbreviation: ${stateAbbr}`);
                console.log(`📊 Full project data:`, data?.project);
                
                if (stateAbbr) {
                    try {
                        console.log(`🗂️ Loading CBRS licenses for state: ${stateAbbr}`);
                        const licenses = await cbrsService.getCBRSLicensesByState(stateAbbr);
                        console.log(`✅ CBRS licenses loaded: ${licenses.length} total licenses`);
                        
                        // Log unique counties with licenses
                        const uniqueCounties = new Set(licenses.map(l => l.county_fips));
                        console.log(`📍 Counties with licenses: ${uniqueCounties.size} unique counties`);
                        console.log(`📋 County FIPS codes:`, Array.from(uniqueCounties));
                        
                        setCbrsLicenses(licenses);
                    } catch (error) {
                        console.error(`❌ Failed to load CBRS licenses for state ${stateAbbr}:`, error);
                    }
                } else {
                    console.warn(`⚠️ No state_abbr found in project data. CBRS licenses will not be loaded.`);
                    console.log(`📝 Available project fields:`, Object.keys(data?.project || {}));
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
                setLoadingStatus('Loading CBRS data...');

                // Load CBRS licenses for public projects too
                const stateAbbr = data?.project?.state_abbr;

                if (stateAbbr) {
                    try {
                        console.log(`🗂️ Loading CBRS licenses for state: ${stateAbbr}`);
                        const licenses = await cbrsService.getCBRSLicensesByState(stateAbbr);
                        console.log(`✅ CBRS licenses loaded: ${licenses.length} total licenses`);
                        
                        // Log unique counties with licenses
                        const uniqueCounties = new Set(licenses.map(l => l.county_fips));
                        console.log(`📍 Counties with licenses: ${uniqueCounties.size} unique counties`);
                        console.log(`📋 County FIPS codes:`, Array.from(uniqueCounties));
                        
                        setCbrsLicenses(licenses);
                    } catch (error) {
                        console.error(`❌ Failed to load CBRS licenses for state ${stateAbbr}:`, error);
                    }
                } else {
                    console.warn(`⚠️ No state_abbr found in public project data. CBRS licenses will not be loaded.`);
                    console.log(`📝 Available public project fields:`, Object.keys(data?.project || {}));
                }

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

                console.log(`📊 Starting to preload ${allLayers.length} layers for public project:`, allLayers.map(l => ({id: l.id, name: l.name})));
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