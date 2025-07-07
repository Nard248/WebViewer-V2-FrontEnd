// src/pages/viewer/StandaloneViewerPage.tsx
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Paper } from '@mui/material';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { projectService, mapService } from '../../services';
import StandaloneLayerControl from '../../components/viewer/StandaloneLayerControl';
import StandaloneLoadingScreen from '../../components/viewer/StandaloneLoadingScreen';
import StandaloneHeader from '../../components/viewer/StandaloneHeader';
import {
    frontendBufferManager,
    isAntennaTowerLayer,
    getTowerCompanyFromLayerName,
    TowerWithBuffers,
    BufferVisibilityState
} from '../../components/viewer/FrontendAntennaBufferSystem';
import {
    zoomVisibilityManager,
    ZoomHint,
    createZoomHintMessage
} from '../../components/viewer/ZoomVisibilityManager';
import '../../styles/standalone-viewer.css';
import { createTowerPopupHTML, isAntennaLayer } from '../../components/viewer/EnhancedTowerPopupSystem';
import { cbrsService, CBRSLicense } from '../../services/cbrsService';
import { createCBRSPopupHTML } from '../../components/viewer/CBRSPopupSystem';
import * as turf from '@turf/turf';
import { layerDataCache } from '../../utils/LayerDataCache';
import { selectedTowersManager, SelectedTower } from '../../components/viewer/SelectedTowersManager';
import { towerCompanyColors } from '../../constants/towerConstants';
import { initializeTowerPopupHandler } from '../../components/viewer/EnhancedTowerPopupSystem';
import { useAuth } from '../../context/AuthContext';


// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Enhanced interfaces for JSON structure support
interface ClusteringOptions {
    disableClusteringAtZoom?: number;
    showCoverageOnHover?: boolean;
    zoomToBoundsOnClick?: boolean;
    spiderfyOnMaxZoom?: boolean;
    removeOutsideVisibleBounds?: boolean;
    maxClusterRadius?: number;
    [key: string]: any;
}

interface ClusteringConfig {
    enabled: boolean;
    options?: ClusteringOptions;
}

interface LayerFunction {
    id?: number;
    type: string;
    name?: string;
    arguments?: Record<string, any>;
    priority?: number;
}

interface StandaloneLayer {
    id: number;
    name: string;
    layer_type_name?: string;
    type?: string;
    is_visible?: boolean;
    is_visible_by_default?: boolean;
    z_index?: number;
    style?: any;
    marker_type?: string;
    marker_image_url?: string;

    // Clustering properties - multiple formats supported
    enable_clustering?: boolean;
    clustering_options?: ClusteringOptions;
    clustering?: ClusteringConfig;
    functions?: LayerFunction[];
}

// WiFi Tower Icon Generator
const createWiFiTowerSVG = (color: string, size: number = 32): string => {
    return `
        <svg width="${size}" height="${size}" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <!-- Marker background -->
            <path d="M16 2C10.477 2 6 6.477 6 12c0 7.2 10 18 10 18s10-10.8 10-18c0-5.523-4.477-10-10-10z" 
                  fill="${color}" stroke="white" stroke-width="1"/>
            
            <!-- WiFi tower icon -->
            <g transform="translate(16,12)">
                <!-- Tower base -->
                <rect x="-1" y="2" width="2" height="6" fill="white"/>
                
                <!-- WiFi signal arcs -->
                <path d="M-6,-2 A8,8 0 0,1 6,-2" fill="none" stroke="white" stroke-width="1.5" opacity="0.9"/>
                <path d="M-4,-1 A5,5 0 0,1 4,-1" fill="none" stroke="white" stroke-width="1.5" opacity="0.9"/>
                <path d="M-2,0 A2.5,2.5 0 0,1 2,0" fill="none" stroke="white" stroke-width="1.5" opacity="0.9"/>
                
                <!-- Center dot -->
                <circle cx="0" cy="1" r="1" fill="white"/>
            </g>
        </svg>
    `;
};

// Helper functions
const hasClusteringEnabled = (layer: StandaloneLayer): boolean => {
    return !!(
        layer.enable_clustering ||
        (layer.clustering && layer.clustering.enabled) ||
        (layer.functions && layer.functions.some(func => func.type === 'clustering'))
    );
};

const getClusteringOptions = (layer: StandaloneLayer): ClusteringOptions => {
    if (layer.clustering_options) return layer.clustering_options;
    if (layer.clustering && layer.clustering.options) return layer.clustering.options;
    if (layer.functions) {
        const clusteringFunction = layer.functions.find(func => func.type === 'clustering');
        if (clusteringFunction && clusteringFunction.arguments) return clusteringFunction.arguments;
    }
    return {
        disableClusteringAtZoom: 11,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        spiderfyOnMaxZoom: true
    };
};

const isPointLayer = (layer: StandaloneLayer): boolean => {
    return (
        layer.layer_type_name === 'Point Layer' ||
        layer.layer_type_name === 'Point' ||
        layer.type === 'Default-Line' ||
        layer.type === 'Point'
    );
};

const createTowerIcon = (companyName: string): L.DivIcon => {
    const color = towerCompanyColors[companyName] || towerCompanyColors['Other'];
    const svgString = createWiFiTowerSVG(color);

    return L.divIcon({
        html: svgString,
        className: 'custom-tower-icon',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    });
};


const StandaloneViewerPage: React.FC = () => {
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const { id } = useParams<{ id: string }>();

    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    const layersRef = useRef<{ [id: number]: L.Layer }>({});
    const basemapLayersRef = useRef<{ [id: number]: L.TileLayer }>({});
    const towerDataRef = useRef<{ [id: number]: any }>({});

    const [projectData, setProjectData] = useState<any | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [loadingProgress, setLoadingProgress] = useState<number>(5);
    const [error, setError] = useState<string | null>(null);
    const [visibleLayers, setVisibleLayers] = useState<Set<number>>(new Set());
    const [activeBasemap, setActiveBasemap] = useState<number | null>(null);

    // Frontend buffer system state
    const [towerBufferRelationships, setTowerBufferRelationships] = useState<TowerWithBuffers[]>([]);
    const [bufferVisibility, setBufferVisibility] = useState<BufferVisibilityState>({});

    // Zoom visibility state
    const [zoomHints, setZoomHints] = useState<ZoomHint[]>([]);
    const [currentZoom, setCurrentZoom] = useState<number>(7);

    const [cbrsLicenses, setCbrsLicenses] = useState<CBRSLicense[]>([]);

    const [allLayersLoaded, setAllLayersLoaded] = useState<boolean>(false);
    const [loadingStatus, setLoadingStatus] = useState<string>('Loading project...');
    const [layerLoadProgress, setLayerLoadProgress] = useState<{ [layerId: number]: boolean }>({});
    const [preloadedLayers, setPreloadedLayers] = useState<{ [layerId: number]: L.Layer }>({});

    const [fallbackLayerData, setFallbackLayerData] = useState<{ [layerId: number]: any }>({});

    const [selectedTowers, setSelectedTowers] = useState<SelectedTower[]>([]);

    if (authLoading) {
        return <StandaloneLoadingScreen progress={0} statusMessage="Authenticating..." />;
    }

    if (!isAuthenticated) {
        return <StandaloneLoadingScreen progress={0} statusMessage="Authentication required..." />;
    }

    // ✅ MOVE getLayerNameById outside of useEffect and make it a useCallback
    const getLayerNameById = useCallback((layerId: number): string => {
        if (!projectData?.layer_groups) return '';

        for (const group of projectData.layer_groups) {
            if (group.layers) {
                for (const layer of group.layers) {
                    if (layer.id === layerId) {
                        return layer.name;
                    }
                }
            }
        }
        return '';
    }, [projectData]);

    // ✅ ADD handleLayerToggle function for proper buffer management
    const handleLayerToggle = useCallback((layerId: number) => {
        setVisibleLayers(prev => {
            const newSet = new Set(prev);
            const isNowVisible = !prev.has(layerId);

            if (isNowVisible) {
                newSet.add(layerId);
            } else {
                newSet.delete(layerId);
            }

            // ✅ CRITICAL FIX: Handle buffer visibility for tower layers
            const layerName = getLayerNameById(layerId);
            const isTowerLayer = isAntennaTowerLayer(layerName);

            if (isTowerLayer && mapRef.current) {
                if (isNowVisible) {
                    // When tower layer is turned ON, enable buffer system but keep buffers hidden by default
                    frontendBufferManager.toggleParentLayerBuffers(layerId, true, mapRef.current);
                } else {
                    // ✅ When tower layer is turned OFF, force hide and disable all buffers
                    frontendBufferManager.toggleParentLayerBuffers(layerId, false, mapRef.current);

                    if (layerId === -1) {
                        // Immediately hide selected towers layer and its buffers
                        selectedTowersManager.toggleSelectedLayerVisibility(false);
                        if (mapRef.current) {
                            frontendBufferManager.removeBuffersForTower(-1, mapRef.current);
                        }
                        setBufferVisibility(prev => {
                            const updated: Record<string, boolean> = { ...prev };
                            Object.keys(updated).forEach(id => {
                                if (id.startsWith('buffer_-1_')) {
                                    updated[id] = false;
                                }
                            });
                            return updated;
                        });

                    }

                    // Also update buffer visibility state to reflect that buffers are off
                    setBufferVisibility(prevBufferState => {
                        const newBufferState = { ...prevBufferState };
                        const towerBuffers = towerBufferRelationships.find(rel => rel.towerId === layerId);
                        if (towerBuffers) {
                            towerBuffers.buffers.forEach(buffer => {
                                newBufferState[buffer.id] = false;
                            });
                        }
                        return newBufferState;
                    });
                }
            }

            return newSet;
        });
    }, [getLayerNameById, towerBufferRelationships]);

    const createSelectedTowersVirtualLayer = (selectedTowers: SelectedTower[]): StandaloneLayer => {
        return {
            id: -1, // Virtual layer ID
            name: 'Selected Towers',
            layer_type_name: 'Point Layer',
            type: 'Point',
            is_visible: true,
            is_visible_by_default: false,
            z_index: 999, // High z-index to appear on top
            style: {
                color: towerCompanyColors['Selected'],
                fillColor: towerCompanyColors['Selected']
            },
            enable_clustering: true,
            clustering_options: {
                disableClusteringAtZoom: 11,
                showCoverageOnHover: false,
                zoomToBoundsOnClick: true,
                spiderfyOnMaxZoom: true
            }
        };
    };

// Add this function to create white tiles on demand

// Replace the createWhiteTileLayer function with this corrected version
const createWhiteTileLayer = (): L.TileLayer => {
    // Create a custom tile layer that always returns white tiles
    const WhiteTileLayer = L.TileLayer.extend({
        createTile: function(coords: any, done: any) {
            const tile = document.createElement('canvas');
            tile.width = 256;
            tile.height = 256;
            const ctx = tile.getContext('2d');
            
            if (ctx) {
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, 256, 256);
            }
            
            setTimeout(() => done(null, tile), 0);
            return tile;
        }
    });
    
    return new (WhiteTileLayer as any)('', {
        attribution: 'White Background',
        minZoom: 1,
        maxZoom: 18
    });
};

    // Subscribe to buffer manager changes
    useEffect(() => {
        const handleBufferChange = (towers: TowerWithBuffers[]) => {
            setTowerBufferRelationships(towers);

            // Update buffer visibility state
            setBufferVisibility(prev => {
                const newState = { ...prev };
                towers.forEach(tower => {
                    tower.buffers.forEach(buffer => {
                        if (!(buffer.id in newState)) {
                            newState[buffer.id] = false; // Default to hidden
                        }
                    });
                });
                return newState;
            });
        };

        frontendBufferManager.onVisibilityChange(handleBufferChange);

        return () => {
            frontendBufferManager.offVisibilityChange(handleBufferChange);
        };
    }, []);

    // Subscribe to zoom visibility manager changes
    useEffect(() => {
        const handleZoomLayerToggle = (layerId: number, visible: boolean, reason: 'zoom' | 'user') => {
            if (reason === 'zoom') {
                // Update the actual layer visibility when zoom changes
                if (mapRef.current && layersRef.current[layerId]) {
                    if (visible) {
                        mapRef.current.addLayer(layersRef.current[layerId]);
                    } else {
                        mapRef.current.removeLayer(layersRef.current[layerId]);
                    }
                }
                console.log(`Zoom manager toggled layer ${layerId}: ${visible}`);
            }
        };

        const handleZoomHints = (hints: ZoomHint[]) => {
            setZoomHints(hints);
        };

        zoomVisibilityManager.onLayerToggle(handleZoomLayerToggle);
        zoomVisibilityManager.onZoomHints(handleZoomHints);

        return () => {
            zoomVisibilityManager.offLayerToggle(handleZoomLayerToggle);
            zoomVisibilityManager.offZoomHints(handleZoomHints);
        };
    }, []);


// Update the useEffect for selectedTowers to properly clean up:
    useEffect(() => {
        // ✅ Force layer visibility update when selected towers change
        setVisibleLayers(prev => {
            if (selectedTowers.length > 0) {
                // Auto-enable the Selected Towers layer when towers are selected
                const newSet = new Set([...prev, -1]);
                return newSet;
            } else {
                // Auto-disable the Selected Towers layer when no towers are selected
                const newSet = new Set(prev);
                newSet.delete(-1);

                // ✅ CRITICAL: Clean up ALL references to selected towers layer
                setPreloadedLayers(prevLayers => {
                    const newLayers = { ...prevLayers };
                    if (newLayers[-1]) {
                        // Remove from map if currently displayed
                        if (mapRef.current && mapRef.current.hasLayer(newLayers[-1])) {
                            mapRef.current.removeLayer(newLayers[-1]);
                        }
                        delete newLayers[-1];
                    }
                    return newLayers;
                });

                // ✅ Also clean up from project data to prevent duplicates
                if (projectData?.layer_groups) {
                    projectData.layer_groups.forEach((group: any) => {
                        if (group.layers) {
                            group.layers = group.layers.filter((layer: any) => layer.id !== -1);
                        }
                    });
                }

                // Also reset buffer visibility for selected towers
                setBufferVisibility(prevBuffers => {
                    const updated: Record<string, boolean> = { ...prevBuffers };
                    Object.keys(updated).forEach(id => {
                        if (id.startsWith('buffer_-1_')) {
                            updated[id] = false;
                        }
                    });
                    return updated;
                });

                return newSet;
            }
        });
    }, [selectedTowers]);


    // Load project data
    useEffect(() => {
        let mounted = true;

        const loadProject = async () => {
            try {
                setLoading(true);
                setLoadingProgress(5);
                setLoadingStatus('Loading project configuration...');

                if (!id) {
                    throw new Error('No project ID provided');
                }

                const data = await projectService.getProjectConstructor(Number(id));
                setLoadingProgress(15);

                if (!mounted) return;

                setProjectData(data);
                setLoadingStatus('Loading CBRS data...');

                // Load CBRS licenses
                if (data?.project?.state_abbr) {
                    try {
                        const licenses = await cbrsService.getCBRSLicensesByState(data.project.state_abbr);
                        setCbrsLicenses(licenses);
                        console.log(`Loaded ${licenses.length} CBRS licenses for ${data.project.state_abbr}`);
                    } catch (error) {
                        console.error('Error loading CBRS licenses:', error);
                    }
                }
                setLoadingProgress(25);

                // Initialize visible layers
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

                // Set default basemap
                const defaultBasemap = data.basemaps?.find((b: any) => b.is_default);
                if (defaultBasemap) {
                    setActiveBasemap(defaultBasemap.id);
                } else if (data.basemaps?.length > 0) {
                    setActiveBasemap(data.basemaps[0].id);
                }

                setLoadingStatus('Pre-loading all layer data...');
                setLoadingProgress(30);

                // Pre-load ALL layer data
                await preloadAllLayerData(allLayers);

                if (mounted) {
                    setAllLayersLoaded(true);
                    setLoadingStatus('Initializing map...');
                    setLoadingProgress(100);

                    setTimeout(() => {
                        if (mounted) setLoading(false);
                    }, 500);
                }

            } catch (err: any) {
                console.error('Error loading project:', err);
                if (mounted) {
                    setError(err.message || 'Failed to load project');
                    setLoading(false);
                }
            }
        };

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

                    // Check if data is already cached
                    const cachedData = layerDataCache.getLayerData(layerId);
                    if (cachedData) {
                        console.log(`Using cached data for layer: ${layerInfo.name}`);
                        loadedData[layerId] = cachedData.data;
                        setLayerLoadProgress(prev => ({ ...prev, [layerId]: true }));
                        currentProgress += progressPerLayer;
                        setLoadingProgress(Math.min(95, currentProgress));
                        continue;
                    }

                    console.log(`Loading layer: ${layerInfo.name} (ID: ${layerId})`);

                    // Load all chunks for the layer
                    let allFeatures: any[] = [];
                    let currentChunk = 1;
                    let hasMoreChunks = true;

                    while (hasMoreChunks) {
                        try {
                            const chunkData = await mapService.getLayerData(layerId, {
                                chunk_id: currentChunk,
                                bounds: '-180,-90,180,90',
                                zoom: 1
                            });

                            if (chunkData.features && chunkData.features.length > 0) {
                                allFeatures.push(...chunkData.features);
                                console.log(`Loaded chunk ${currentChunk} with ${chunkData.features.length} features for layer: ${layerInfo.name}`);
                                currentChunk++;

                                if (chunkData.features.length < 1000) {
                                    hasMoreChunks = false;
                                }
                            } else {
                                hasMoreChunks = false;
                            }
                        } catch (chunkError: any) {
                            console.log(`No more chunks available after chunk ${currentChunk - 1} for layer ${layerInfo.name}`);
                            hasMoreChunks = false;
                        }
                    }

                    // Create the combined data object
                    const combinedData = {
                        type: 'FeatureCollection' as const,
                        features: allFeatures
                    };

                    // Store data in memory regardless of cache success/failure
                    loadedData[layerId] = combinedData;

                    // Try to cache the data (may fail for large datasets)
                    try {
                        layerDataCache.setLayerData(layerId, layerInfo.name, combinedData);
                    } catch (cacheError) {
                        console.warn(`Failed to cache layer ${layerInfo.name}, but data is still available in memory:`, cacheError);
                    }

                    console.log(`Loaded ${allFeatures.length} features for layer: ${layerInfo.name}`);

                    setLayerLoadProgress(prev => ({ ...prev, [layerId]: true }));
                    currentProgress += progressPerLayer;
                    setLoadingProgress(Math.min(95, currentProgress));

                } catch (err) {
                    console.error(`Error loading layer ${layerInfo.name}:`, err);
                    // Continue with other layers even if one fails
                }
            }

            // Store all loaded data in fallback state
            setFallbackLayerData(loadedData);

            console.log('All layers loaded!');
            const cacheInfo = layerDataCache.getCacheInfo();
            console.log('Cache info:', cacheInfo);
        };

        loadProject();

        return () => {
            mounted = false;
        };
    }, [id]);

    useEffect(() => {
        // Add class to body when component mounts
        document.body.classList.add('standalone-viewer-active');

        // Cleanup function to remove class when component unmounts
        return () => {
            document.body.classList.remove('standalone-viewer-active');
        };
    }, []);

    // Initialize map
    useEffect(() => {
        if (!projectData || !mapContainerRef.current || loading) return;

        if (mapRef.current) {
            frontendBufferManager.cleanup(mapRef.current);
            zoomVisibilityManager.cleanup();
            selectedTowersManager.cleanup(); // Add this line
            mapRef.current.remove();
        }

        try {
            const map = L.map(mapContainerRef.current, {
                center: [
                    projectData.project?.default_center_lat || 40.0,
                    projectData.project?.default_center_lng || -83.0
                ],
                zoom: projectData.project?.default_zoom_level || 7,
                zoomControl: false,
                attributionControl: false
            });

            // Create panes for better layer ordering
            map.createPane('basemapPane');
            map.createPane('overlayPane');
            map.createPane('markerPane');

            map.getPane('basemapPane')!.style.zIndex = '200';
            map.getPane('overlayPane')!.style.zIndex = '400';
            map.getPane('markerPane')!.style.zIndex = '600';

            L.control.zoom({ position: 'bottomright' }).addTo(map);

            // Track zoom changes
            map.on('zoomend', () => {
                const newZoom = map.getZoom();
                setCurrentZoom(newZoom);

                // ✅ TRIGGER LAYER VISIBILITY UPDATE WHEN ZOOM CHANGES
                setTimeout(() => {
                    // Trigger the layer visibility update effect
                    setVisibleLayers(prev => new Set(prev));
                }, 0);
            });

            mapRef.current = map;
            setCurrentZoom(map.getZoom());

            // Initialize zoom visibility manager
            zoomVisibilityManager.initialize(map, frontendBufferManager);

            // ✅ FIX: Initialize tower popup handler FIRST
            initializeTowerPopupHandler();

            // ✅ FIX: Initialize selected towers manager with the correct map reference
            selectedTowersManager.initialize(map); // Use 'map', not 'mapInstance'
            selectedTowersManager.onSelectionChange((towers: SelectedTower[]) => {
                setSelectedTowers(towers);
                console.log(`Selection changed: ${towers.length} towers selected`);
            });

            // ✅ FIX: Make map globally available for popup handler
            (window as any).currentMap = map;

            console.log('Map initialized with zoom visibility manager');

        } catch (err) {
            console.error('Error initializing map:', err);
            setError('Failed to initialize map');
        }

        // ✅ REMOVE: These duplicate lines are causing the error
        // initializeTowerPopupHandler();
        // selectedTowersManager.initialize(mapInstance);

    }, [projectData, loading]);


// Modify the basemap handling useEffect
    useEffect(() => {
        if (!mapRef.current || !projectData || loading) return;

        // Clear existing basemaps
        Object.values(basemapLayersRef.current).forEach(layer => {
            if (mapRef.current!.hasLayer(layer)) {
                mapRef.current!.removeLayer(layer);
            }
        });
        basemapLayersRef.current = {};

        const basemap = projectData.basemaps?.find((b: any) => b.id === activeBasemap);
        if (basemap) {
            let tileLayer: L.TileLayer;

            // Check if this is the white background basemap (ID 1 in your case)
            if (basemap.id === 1) {
                // Use custom white tile layer instead of URL
                tileLayer = createWhiteTileLayer();
            } else {
                // Regular tile layer for other basemaps
                tileLayer = L.tileLayer(basemap.url_template, {
                    ...basemap.options,
                    attribution: basemap.attribution,
                    pane: 'basemapPane'
                });
            }

            tileLayer.addTo(mapRef.current);
            basemapLayersRef.current[basemap.id] = tileLayer;

            // Ensure proper z-index
            mapRef.current.getPane('basemapPane')!.style.zIndex = '200';
            mapRef.current.getPane('overlayPane')!.style.zIndex = '400';
            mapRef.current.getPane('markerPane')!.style.zIndex = '600';
        }
    }, [activeBasemap, projectData, loading]);

    // Load layers when visibility changes
    useEffect(() => {
        if (!mapRef.current || !projectData || loading || !allLayersLoaded) return;

        // Replace the existing updateLayerVisibility function (around line 577)
        const updateLayerVisibility = async () => {
            // Get all layers from project data
            const allProjectLayers: any[] = [];
            if (projectData.layer_groups) {
                projectData.layer_groups.forEach((group: any) => {
                    if (group.layers) {
                        group.layers.forEach((layer: any) => {
                            allProjectLayers.push(layer);
                        });
                    }
                });
            }

            // ✅ CRITICAL FIX: Add Selected Towers layer to the Antenna Towers group instead of as separate layer
            if (selectedTowers.length > 0) {
                // Find the Antenna Towers group
                let antennaTowersGroup = null;
                if (projectData.layer_groups) {
                    antennaTowersGroup = projectData.layer_groups.find((group: any) =>
                        group.name?.toLowerCase().includes('antenna') ||
                        group.layers?.some((layer: any) => isAntennaTowerLayer(layer.name))
                    );
                }

                if (antennaTowersGroup) {
                    // Create the virtual Selected Towers layer
                    const selectedTowersLayer = createSelectedTowersVirtualLayer(selectedTowers);

                    // ✅ Add it to the existing Antenna Towers group instead of creating separate
                    if (!antennaTowersGroup.layers.find((layer: any) => layer.id === -1)) {
                        // Only add if not already present
                        antennaTowersGroup.layers.push(selectedTowersLayer);
                        console.log(`Added Selected Towers layer to ${antennaTowersGroup.name} group`);
                    }

                    // Add to allProjectLayers for processing
                    allProjectLayers.push(selectedTowersLayer);
                } else {
                    // Fallback: add as standalone if no antenna group found
                    const selectedTowersLayer = createSelectedTowersVirtualLayer(selectedTowers);
                    allProjectLayers.push(selectedTowersLayer);
                }
            } else {
                // Remove Selected Towers layer from group when no towers selected
                if (projectData.layer_groups) {
                    projectData.layer_groups.forEach((group: any) => {
                        if (group.layers) {
                            group.layers = group.layers.filter((layer: any) => layer.id !== -1);
                        }
                    });
                }
            }

            console.log(`Processing ${allProjectLayers.length} layers:`, allProjectLayers.map(l => l.name));

            // Create map layers for layers that don't exist yet
            for (const layerInfo of allProjectLayers) {
                if (!preloadedLayers[layerInfo.id]) {
                    console.log(`Creating map layer for: ${layerInfo.name}`);
                    await createMapLayer(layerInfo);
                }
            }

            // Update visibility of all layers
            for (const [layerIdStr, layer] of Object.entries(preloadedLayers)) {
                const layerKey = layerIdStr;

                // Handle county labels separately
                if (layerKey.includes('_labels')) {
                    const parentLayerId = Number(layerKey.split('_')[0]);
                    const shouldBeVisible = visibleLayers.has(parentLayerId);
                    const isCurrentlyVisible = mapRef.current!.hasLayer(layer);

                    if (shouldBeVisible && !isCurrentlyVisible) {
                        mapRef.current!.addLayer(layer);
                        console.log(`Showed county labels for layer ${parentLayerId}`);
                    } else if (!shouldBeVisible && isCurrentlyVisible) {
                        mapRef.current!.removeLayer(layer);
                        console.log(`Hidden county labels for layer ${parentLayerId}`);
                    }
                    continue;
                }

                // Handle regular layers with zoom restrictions
                const layerId = Number(layerIdStr);

                // Selected towers layer should always be visible if there are selected towers
                if (layerId === -1) {
                    const shouldBeVisible = selectedTowers.length > 0 && visibleLayers.has(-1);
                    selectedTowersManager.toggleSelectedLayerVisibility(shouldBeVisible);
                    continue;
                }


                const userWantsVisible = visibleLayers.has(layerId);

                // Check zoom restrictions for tower layers
                const layerName = getLayerNameById(layerId);
                const isTowerLayer = isAntennaTowerLayer(layerName);
                const zoomStatus = zoomVisibilityManager.getLayerZoomStatus(layerId);

                // Layer should only be visible if user wants it AND zoom allows it (for tower layers)
                if (isTowerLayer) {
                    const shouldBeVisible = userWantsVisible && zoomStatus.canShow;
                    const isCurrentlyVisible = mapRef.current!.hasLayer(layer);

                    if (shouldBeVisible && !isCurrentlyVisible) {
                        mapRef.current!.addLayer(layer);
                        // Enable buffer system when tower becomes visible
                        frontendBufferManager.toggleParentLayerBuffers(layerId, true, mapRef.current!);
                        console.log(`Showed layer ${layerId} (zoom allowed: ${zoomStatus.canShow})`);
                    } else if (!shouldBeVisible && isCurrentlyVisible) {
                        mapRef.current!.removeLayer(layer);
                        // ✅ CRITICAL: Hide all buffers when tower layer becomes hidden
                        frontendBufferManager.toggleParentLayerBuffers(layerId, false, mapRef.current!);
                        console.log(`Hidden layer ${layerId} (user wants: ${userWantsVisible}, zoom allows: ${zoomStatus.canShow})`);
                    }
                } else {
                    // Handle non-tower layers normally
                    const shouldBeVisible = userWantsVisible;
                    const isCurrentlyVisible = mapRef.current!.hasLayer(layer);

                    if (shouldBeVisible && !isCurrentlyVisible) {
                        mapRef.current!.addLayer(layer);
                        console.log(`Showed layer ${layerId}`);
                    } else if (!shouldBeVisible && isCurrentlyVisible) {
                        mapRef.current!.removeLayer(layer);
                        console.log(`Hidden layer ${layerId}`);
                    }
                }
            }
        };


        const createMapLayer = async (layerInfo: any): Promise<void> => {
            try {
                let data = null;

                // Handle Selected Towers virtual layer using the manager's layer group
                if (layerInfo.id === -1) {
                    const virtual = selectedTowersManager.getSelectedTowersVirtualLayer();
                    if (!virtual) {
                        console.error('Selected towers layer not initialized');
                        return;
                    }
                    const mapLayer = virtual.layerGroup;
                    setPreloadedLayers(prev => ({
                        ...prev,
                        [-1]: mapLayer
                    }));
                    if (visibleLayers.has(-1) && mapRef.current) {
                        mapRef.current.addLayer(mapLayer);
                    }
                    return;
                } else {
                    // Try to get data from cache first, then fallback
                    const cachedData = layerDataCache.getLayerData(layerInfo.id);

                    if (cachedData) {
                        data = cachedData.data;
                        console.log(`Using cached data for map layer: ${layerInfo.name}`);
                    } else if (fallbackLayerData[layerInfo.id]) {
                        data = fallbackLayerData[layerInfo.id];
                        console.log(`Using fallback data for map layer: ${layerInfo.name}`);
                    } else {
                        console.error(`No data available for layer: ${layerInfo.name}`);
                        return;
                    }
                }

                if (!data.features || data.features.length === 0) {
                    console.log(`No features found for layer: ${layerInfo.name}`);
                    return;
                }

                console.log(`Creating map layer for: ${layerInfo.name} with ${data.features.length} features`);

                const isTowerLayer = isAntennaTowerLayer(layerInfo.name) || layerInfo.id === -1;
                const isCountyLayer = layerInfo.name === "County Outline" || layerInfo.id === 794;

                // Store tower data for buffer generation
                if (isTowerLayer) {
                    towerDataRef.current[layerInfo.id] = data;
                }

                let mapLayer: L.Layer;

                const shouldCluster = isPointLayer(layerInfo) && hasClusteringEnabled(layerInfo);

                if (shouldCluster) {
                    // Create clustered layer
                    const L_MarkerCluster = await import('leaflet.markercluster');
                    const MarkerClusterGroup = (L as any).MarkerClusterGroup;

                    const clusteringOptions = getClusteringOptions(layerInfo);

                    const markerClusterGroup = new MarkerClusterGroup({
                        disableClusteringAtZoom: clusteringOptions.disableClusteringAtZoom || 11,
                        showCoverageOnHover: clusteringOptions.showCoverageOnHover || false,
                        zoomToBoundsOnClick: clusteringOptions.zoomToBoundsOnClick !== false,
                        spiderfyOnMaxZoom: clusteringOptions.spiderfyOnMaxZoom !== false,
                        removeOutsideVisibleBounds: clusteringOptions.removeOutsideVisibleBounds || false,
                        maxClusterRadius: clusteringOptions.maxClusterRadius || 80,
                        ...clusteringOptions
                    });

                    // Process each feature and add to cluster group
                    data.features.forEach((feature: any) => {
                        if (feature.geometry && feature.geometry.type === 'Point') {
                            const [lng, lat] = feature.geometry.coordinates;
                            let marker: L.Marker | L.CircleMarker;

                            if (isTowerLayer && feature.properties) {
                                let companyName: string;
                                let isSelected = false;

                                if (layerInfo.id === -1) {
                                    // This is a selected tower
                                    companyName = 'Selected';
                                    isSelected = true;
                                } else {
                                    companyName = getTowerCompanyFromLayerName(layerInfo.name);
                                }

                                const towerIcon = createTowerIcon(companyName);
                                marker = L.marker([lat, lng], { icon: towerIcon });

                                const popupHTML = createTowerPopupHTML(
                                    feature.properties,
                                    companyName,
                                    layerInfo.name,
                                    layerInfo.id,
                                    isSelected
                                );
                                marker.bindPopup(popupHTML, {
                                    maxWidth: 400,
                                    className: 'tower-popup'
                                });
                            } else {
                                marker = L.circleMarker([lat, lng], {
                                    radius: 6,
                                    fillColor: '#01fbff',
                                    color: '#000000',
                                    weight: 2,
                                    opacity: 1,
                                    fillOpacity: 0.8
                                });
                            }

                            markerClusterGroup.addLayer(marker);
                        }
                    });

                    mapLayer = markerClusterGroup;
                } else {
                    // Create non-clustered layer
                    mapLayer = L.geoJSON(data, {
                        style: () => ({
                            color: layerInfo.style?.color || '#3388ff',
                            weight: layerInfo.style?.weight || 2,
                            opacity: layerInfo.style?.opacity || 1,
                            fillColor: layerInfo.style?.fillColor || layerInfo.style?.color || '#3388ff',
                            fillOpacity: layerInfo.style?.fillOpacity || 0.2
                        }),
                        pointToLayer: (feature, latlng) => {
                            if (isTowerLayer) {
                                const companyName = getTowerCompanyFromLayerName(layerInfo.name);
                                const towerIcon = createTowerIcon(companyName);
                                return L.marker(latlng, { icon: towerIcon });
                            } else {
                                return L.circleMarker(latlng, {
                                    radius: 6,
                                    fillColor: '#3388ff',
                                    color: '#ffffff',
                                    weight: 2,
                                    opacity: 1,
                                    fillOpacity: 0.8
                                });
                            }
                        },
                        onEachFeature: (feature, leafletLayer) => {
                            if (feature.properties && isTowerLayer) {
                                const popupHTML = createTowerPopupHTML(
                                    feature.properties,
                                    getTowerCompanyFromLayerName(layerInfo.name), // companyName
                                    layerInfo.name, // layerName
                                    layerInfo.id, // layerId
                                    false // isSelected
                                );
                                leafletLayer.bindPopup(popupHTML, {
                                    maxWidth: 400,
                                    className: 'tower-popup'
                                });
                            } else if (isCountyLayer && feature.geometry) {
                                console.log('Processing County Outline feature:', feature.properties);

                                const countyName = feature.properties?.NAME ||
                                    feature.properties?.name ||
                                    feature.properties?.county_name ||
                                    feature.properties?.COUNTY ||
                                    feature.properties?.County ||
                                    feature.properties?.NAMELSAD ||
                                    feature.properties?.COUNTYNAME ||
                                    `County ${feature.properties?.FIPS || 'Unknown'}`;

                                // Just bind the CBRS popup to the county outline itself
                                const countyLicenses = cbrsLicenses.filter(license => {
                                    const licenseName = license.county_name.toLowerCase().trim();
                                    const featureName = countyName.toLowerCase().trim();
                                    return licenseName === featureName ||
                                        licenseName.includes(featureName) ||
                                        featureName.includes(licenseName);
                                });

                                const cbrsPopupHTML = createCBRSPopupHTML(countyLicenses, countyName);
                                leafletLayer.bindPopup(cbrsPopupHTML, {
                                    maxWidth: 650,
                                    maxHeight: 450,
                                    className: 'cbrs-popup'
                                });
                            }
                        }
                    });
                }

                const shouldBeVisible_created = visibleLayers.has(layerInfo.id);
                if (isTowerLayer && layerInfo.id !== -1) {
                    zoomVisibilityManager.registerLayer(
                        layerInfo.id,
                        layerInfo.name,
                        isTowerLayer,
                        shouldBeVisible_created
                    );
                }

                // Generate frontend buffers for antenna tower layers
                if (isTowerLayer) {
                    const companyName = layerInfo.id === -1 ? 'Selected' : getTowerCompanyFromLayerName(layerInfo.name);
                    frontendBufferManager.generateBuffersFromTowerData(
                        data,
                        layerInfo.id,
                        layerInfo.name,
                        companyName
                    );
                    console.log(`Generated frontend buffers for: ${layerInfo.name}`);
                }

                // Store the created layer
                setPreloadedLayers(prev => ({
                    ...prev,
                    [layerInfo.id]: mapLayer
                }));

                // FIX 1: IMMEDIATELY ADD TO MAP IF SHOULD BE VISIBLE
                const shouldBeVisible = visibleLayers.has(layerInfo.id);
                if (shouldBeVisible && mapRef.current) {
                    mapRef.current.addLayer(mapLayer);
                    console.log(`Initially showed layer ${layerInfo.id}`);
                }

                // Register with zoom visibility manager
                // Selected towers should ignore zoom restrictions
                const customMinZoom = layerInfo.id === -1 ? 0 : undefined;
                zoomVisibilityManager.registerLayer(
                    layerInfo.id,
                    layerInfo.name,
                    isTowerLayer,
                    shouldBeVisible, // FIX 3: Pass actual visibility state
                    customMinZoom
                );

                // Generate frontend buffer layers for antenna towers
                if (isTowerLayer) {
                    const companyName = getTowerCompanyFromLayerName(layerInfo.name);
                    console.log(`Generating frontend buffers for ${layerInfo.name} (${companyName})`);
                    const buffers = frontendBufferManager.generateBuffersFromTowerData(
                        data,
                        layerInfo.id,
                        layerInfo.name,
                        companyName
                    );
                    console.log(`Generated ${buffers.length} buffer layers`);
                }

                if (isCountyLayer) {
                    createCountyLabels(layerInfo.id, data);
                }

                console.log(`Successfully created map layer: ${layerInfo.name}`);

            } catch (err) {
                console.error(`Error creating map layer ${layerInfo.name}:`, err);
            }
        };

        updateLayerVisibility();
    }, [visibleLayers, projectData, loading, allLayersLoaded, cbrsLicenses, selectedTowers]);

    useEffect(() => {
        const loadCBRSLicenses = async () => {
            if (!projectData?.project?.state_abbr) return;

            try {
                const licenses = await cbrsService.getCBRSLicensesByState(projectData.project.state_abbr);
                setCbrsLicenses(licenses);
                console.log(`Loaded ${licenses.length} CBRS licenses for ${projectData.project.state_abbr}`);
            } catch (error) {
                console.error('Error loading CBRS licenses:', error);
            }
        };

        if (projectData) {
            loadCBRSLicenses();
        }
    }, [projectData]);

    // Add this function around line 1297 or in the appropriate location
    const onBufferToggle = useCallback((bufferId: string, isVisible: boolean) => {
        if (!mapRef.current) return;

        // Find the parent layer that owns this buffer
        let parentLayerVisible = false;
        for (const [layerId] of Object.entries(layersRef.current)) {
            if (visibleLayers.has(Number(layerId))) {
                parentLayerVisible = true;
                break;
            }
        }

        // Toggle the buffer layer
        frontendBufferManager.toggleBufferLayer(bufferId, isVisible, mapRef.current, parentLayerVisible);

        // Update buffer visibility state
        setBufferVisibility(prev => ({
            ...prev,
            [bufferId]: isVisible
        }));
    }, [visibleLayers]);

    const createCountyLabels = (layerId: number, data: any) => {
        if (!mapRef.current) return;

        const countyLabelsGroup = L.layerGroup();

        data.features.forEach((feature: any) => {
            if (feature.geometry) {
                const countyName = feature.properties?.NAME ||
                    feature.properties?.name ||
                    feature.properties?.county_name ||
                    feature.properties?.COUNTY ||
                    feature.properties?.County ||
                    feature.properties?.NAMELSAD ||
                    feature.properties?.COUNTYNAME ||
                    `County ${feature.properties?.FIPS || 'Unknown'}`;

                try {
                    // Calculate polygon centroid for label placement
                    let centroid;
                    if (feature.geometry.type === 'Polygon') {
                        centroid = turf.centroid(feature);
                    } else if (feature.geometry.type === 'MultiPolygon') {
                        const polygons = feature.geometry.coordinates;
                        const largestPolygon = polygons.reduce((largest, current) =>
                            current[0].length > largest[0].length ? current : largest
                        );
                        centroid = turf.centroid({
                            type: 'Polygon',
                            coordinates: largestPolygon
                        });
                    } else {
                        return; // Skip unsupported geometry types
                    }

                    const [lng, lat] = centroid.geometry.coordinates;

                    // Filter CBRS licenses for this county
                    const countyLicenses = cbrsLicenses.filter(license => {
                        const licenseName = license.county_name.toLowerCase().trim();
                        const featureName = countyName.toLowerCase().trim();
                        return licenseName === featureName ||
                            licenseName.includes(featureName) ||
                            featureName.includes(licenseName);
                    });

                    const cbrsPopupHTML = createCBRSPopupHTML(countyLicenses, countyName);

                    // Create clickable county name label
                    const textLength = countyName.length;
                    const approximateWidth = Math.max(textLength * 8, 80);
                    const offsetLeft = approximateWidth / 2;
                    const offsetUp = 10;

                    const countyLabel = L.marker([lat, lng], {
                        icon: L.divIcon({
                            className: 'county-label-clickable',
                            html: `<div style="
                            font-size: 14px;
                            font-weight: bold;
                            text-shadow: -1px -1px 0 white, 1px -1px 0 white, -1px 1px 0 white, 1px 1px 0 white;
                            text-align: center;
                            pointer-events: auto;
                            cursor: pointer;
                            padding: 0;
                            margin: 0;
                            white-space: nowrap;
                            color: #333;
                            transition: all 0.2s ease;
                            width: ${approximateWidth}px;
                        " 
                        onmouseover="this.style.textShadow='-2px -2px 0 white, 2px -2px 0 white, -2px 2px 0 white, 2px 2px 0 white'; this.style.transform='scale(1.1)'" 
                        onmouseout="this.style.textShadow='-1px -1px 0 white, 1px -1px 0 white, -1px 1px 0 white, 1px 1px 0 white'; this.style.transform='scale(1)'"
                        title="Click to view CBRS licenses for ${countyName}">${countyName}</div>`,
                            iconSize: [approximateWidth, 20],
                            iconAnchor: [offsetLeft, offsetUp],
                            popupAnchor: [0, 0]
                        }),
                        pane: 'markerPane'
                    });

                    // Add popup to the clickable label
                    countyLabel.bindPopup(cbrsPopupHTML, {
                        maxWidth: 650,
                        maxHeight: 450,
                        className: 'cbrs-popup'
                    });

                    // Add label to the county labels group
                    countyLabelsGroup.addLayer(countyLabel);

                } catch (error) {
                    console.error('Error processing county centroid for:', countyName, error);
                }
            }
        });

        // Store the county labels as a separate layer with a special key
        const labelsKey = `${layerId}_labels`;
        setPreloadedLayers(prev => ({
            ...prev,
            [labelsKey]: countyLabelsGroup
        }));

        // Add labels to map if county layer should be visible
        const shouldBeVisible = visibleLayers.has(layerId);
        if (shouldBeVisible && mapRef.current) {
            mapRef.current.addLayer(countyLabelsGroup);
            console.log(`County labels added for layer ${layerId}`);
        }
    };
    // Handle layer toggle
    // Update the layer toggle handler to properly manage buffer visibility


    // Handle buffer toggle
    const handleBufferToggle = useCallback((bufferId: string, isVisible: boolean) => {
        setBufferVisibility(prev => ({
            ...prev,
            [bufferId]: isVisible
        }));

        if (mapRef.current) {
            // Check if parent tower is visible
            const buffer = frontendBufferManager.getBufferLayer(bufferId);
            const parentVisible = buffer ? visibleLayers.has(buffer.parentLayerId) : false;

            frontendBufferManager.toggleBufferLayer(bufferId, isVisible, mapRef.current, parentVisible);
        }
    }, [visibleLayers]);

    const handleBasemapChange = (basemapId: number) => {
        setActiveBasemap(basemapId);
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (mapRef.current) {
                frontendBufferManager.cleanup(mapRef.current);
                zoomVisibilityManager.cleanup();
            }
        };
    }, []);

    // Show loading screen
    if (loading && !error) {
        return (
            <StandaloneLoadingScreen
                progress={loadingProgress}
                projectName={projectData?.project?.name}
                statusMessage={loadingStatus}
            />
        );
    }
    // Show error state
    if (error) {
        return (
            <>
                <StandaloneHeader />
                <Box
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                    height="calc(100vh - 48px)"
                    marginTop="48px"
                >
                    <Paper elevation={3} sx={{ p: 3, maxWidth: 500 }}>
                        <Typography variant="h5" color="error" gutterBottom>
                            Error
                        </Typography>
                        <Typography>{error}</Typography>
                    </Paper>
                </Box>
            </>
        );
    }

    return (
        <>
            <StandaloneHeader projectName={projectData?.project?.name} />
            <Box
                position="relative"
                height="calc(100vh - 48px)"
                marginTop="48px"
            >
                <Box
                    ref={mapContainerRef}
                    width="100%"
                    height="100%"
                    sx={{ position: 'absolute', top: 0, left: 0, backgroundColor: 'white', '& .leaflet-container': {
                            backgroundColor: '#ffffff !important'
                        }
                    }}
                />

                {/* Zoom hints notification */}
                {zoomHints.length > 0 && (
                    <Box
                        position="absolute"
                        bottom="50px"
                        left="10px"
                        backgroundColor="rgba(0,0,0,0.8)"
                        color="white"
                        padding="8px 12px"
                        borderRadius="5px"
                        zIndex={1000}
                        maxWidth="300px"
                    >
                        <Typography variant="body2" sx={{ fontSize: '12px', fontWeight: 600 }}>
                            Zoom Level: {currentZoom}
                        </Typography>
                        {zoomHints.map((hint, index) => (
                            <Typography key={index} variant="body2" sx={{ fontSize: '11px', marginTop: '2px' }}>
                                {createZoomHintMessage([hint])}  // ✅ Pass single hint as array
                            </Typography>
                        ))}
                    </Box>
                )}

                {projectData && (
                    // Update the StandaloneLayerControl component call
                    <StandaloneLayerControl
                        projectData={projectData}
                        visibleLayers={visibleLayers}
                        activeBasemap={activeBasemap}
                        onLayerToggle={handleLayerToggle}
                        onBasemapChange={setActiveBasemap}
                        towerBufferRelationships={towerBufferRelationships}
                        onBufferToggle={handleBufferToggle}
                        bufferVisibility={bufferVisibility}
                        zoomHints={zoomHints}
                        currentZoom={currentZoom}
                        selectedTowersLayer={selectedTowers.length > 0 ? {
                            id: -1,
                            name: 'Selected Towers',
                            is_visible: visibleLayers.has(-1),
                            featureCount: selectedTowers.length
                        } : null}
                        onSelectedTowersToggle={(isVisible) => {
                            if (isVisible) {
                                setVisibleLayers(prev => new Set([...prev, -1]));
                                selectedTowersManager.toggleSelectedLayerVisibility(true);
                            } else {
                                setVisibleLayers(prev => {
                                    const newSet = new Set(prev);
                                    newSet.delete(-1);
                                    return newSet;
                                });
                                selectedTowersManager.toggleSelectedLayerVisibility(false);
                                if (mapRef.current) {
                                    frontendBufferManager.removeBuffersForTower(-1, mapRef.current);
                                }
                                setBufferVisibility(prev => {
                                    const updated: Record<string, boolean> = { ...prev };
                                    Object.keys(updated).forEach(id => {
                                        if (id.startsWith('buffer_-1_')) {
                                            updated[id] = false;
                                        }
                                    });
                                    return updated;
                                });

                            }
                        }}
                    />



                )}
            </Box>
        </>
    );
};

export default StandaloneViewerPage;
