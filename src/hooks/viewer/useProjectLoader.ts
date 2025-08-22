import { useEffect, useMemo, useRef, useState } from 'react';
import { projectService, mapService } from '../../services';
import { cbrsService, CBRSLicense } from '../../services/cbrsService';
import { layerDataCache } from '../../utils/LayerDataCache';

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

    useEffect(() => {
        let mounted = true;

        const preloadAllLayerData = async (allLayers: any[]) => {
            if (allLayers.length === 0) return;

            const progressPerLayer = 65 / allLayers.length;
            let currentProgress = 30;
            const loadedData: { [layerId: number]: any } = {};

            for (let i = 0; i < allLayers.length; i++) {
                const layerInfo = allLayers[i];
                const layerId = layerInfo.id;

                try {
                    setLoadingStatus(`Loading ${layerInfo.name}... (${i + 1}/${allLayers.length})`);

                    const cachedData = layerDataCache.getLayerData(layerId);
                    if (cachedData) {
                        loadedData[layerId] = cachedData.data;
                        setLayerLoadProgress(prev => ({ ...prev, [layerId]: true }));
                        currentProgress += progressPerLayer;
                        setLoadingProgress(Math.min(95, currentProgress));
                        continue;
                    }

                    let allFeatures: any[] = [];
                    let currentChunk = 1;
                    let hasMoreChunks = true;

                    while (hasMoreChunks) {
                        try {
                            const requestOptions = isPublicAccess && hash ? {
                                headers: {
                                    'X-Public-Token': hash,
                                    'Origin': window.location.origin
                                }
                            } : {};

                            const chunkData = await mapService.getLayerData(layerId, {
                                chunk_id: currentChunk,
                                bounds: '-180,-90,180,90',
                                zoom: 1
                            }, requestOptions);

                            if (chunkData.features && chunkData.features.length > 0) {
                                allFeatures.push(...chunkData.features);
                                if (chunkData.chunk_info && chunkData.chunk_info.next_chunk) {
                                    currentChunk = chunkData.chunk_info.next_chunk;
                                } else {
                                    hasMoreChunks = false;
                                }
                            } else {
                                hasMoreChunks = false;
                            }
                        } catch (chunkError: any) {
                            hasMoreChunks = false;
                        }
                    }

                    const combinedData = {
                        type: 'FeatureCollection' as const,
                        features: allFeatures
                    };

                    loadedData[layerId] = combinedData;
                    try {
                        layerDataCache.setLayerData(layerId, layerInfo.name, combinedData);
                    } catch (cacheError) {
                        // non-fatal caching error
                    }

                    setLayerLoadProgress(prev => ({ ...prev, [layerId]: true }));
                    currentProgress += progressPerLayer;
                    setLoadingProgress(Math.min(95, currentProgress));

                } catch (err) {
                    // continue with other layers
                }
            }

            setFallbackLayerData(loadedData);
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

        return () => { mounted = false; };
    }, [projectIdentifier, isPublicAccess, hash]);

    useEffect(() => {
        const loadCBRSLicenses = async () => {
            const stateAbbr = (projectData as any)?.project?.state_abbr;
            if (!stateAbbr) return;
            try {
                const licenses = await cbrsService.getCBRSLicensesByState(stateAbbr);
                setCbrsLicenses(licenses);
            } catch {}
        };
        if (projectData) loadCBRSLicenses();
    }, [projectData]);

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


