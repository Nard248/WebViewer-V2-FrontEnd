import React, { useState, useRef, useCallback } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Box, Typography, Paper } from '@mui/material';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import StandaloneLayerControl from '../../components/viewer/StandaloneLayerControl';
import StandaloneLoadingScreen from '../../components/viewer/StandaloneLoadingScreen';
import StandaloneHeader from '../../components/viewer/StandaloneHeader';
import {
    TowerWithBuffers,
    BufferVisibilityState
} from '../../components/viewer/FrontendAntennaBufferSystem';
import { ZoomHint } from '../../components/viewer/ZoomVisibilityManager';
import '../../styles/standalone-viewer.css';
import { selectedTowersManager, SelectedTower } from '../../components/viewer/SelectedTowersManager';
import { useAuth } from '../../context/AuthContext';
import ZoomHintsOverlay from '../../components/viewer/ZoomHintsOverlay';
import LayerLoadingIndicator from '../../components/viewer/LayerLoadingIndicator';
import { useBufferManager } from '../../hooks/viewer/useBufferManager';
import { useZoomVisibility } from '../../hooks/viewer/useZoomVisibility';
import { useBodyClass } from '../../hooks/viewer/useBodyClass';
import { useProjectLoader } from '../../hooks/viewer/useProjectLoader';
import { useMapInit } from '../../hooks/viewer/useMapInit';
import { useLayerVisibility } from '../../hooks/viewer/useLayerVisibility';
import { useBasemapSwitcher } from '../../hooks/viewer/useBasemapSwitcher';
import { useSelectedTowers } from '../../hooks/viewer/useSelectedTowers';
import { useBufferToggle } from '../../hooks/viewer/useBufferToggle';
import { useLayerToggle } from '../../hooks/viewer/useLayerToggle';
import { useCleanup } from '../../hooks/viewer/useCleanup';

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const StandaloneViewerPage: React.FC = () => {
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const { id, hash } = useParams<{ id?: string; hash?: string }>();
    const location = useLocation();

    // Determine if this is public access
    const isPublicAccess = location.pathname.startsWith('/public-viewer/');
    const projectIdentifier = isPublicAccess ? hash : id;

    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    const layersRef = useRef<{ [id: number]: L.Layer }>({});
    const basemapLayersRef = useRef<{ [id: number]: L.TileLayer }>({});

    // Load project data with our custom hook
    const {
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
        fallbackLayerData,
        cbrsLicenses
    } = useProjectLoader(projectIdentifier, isPublicAccess, hash);

    // Frontend buffer system state
    const [towerBufferRelationships, setTowerBufferRelationships] = useState<TowerWithBuffers[]>([]);
    const [bufferVisibility, setBufferVisibility] = useState<BufferVisibilityState>({});

    // Zoom visibility state
    const [zoomHints, setZoomHints] = useState<ZoomHint[]>([]);
    const [currentZoom, setCurrentZoom] = useState<number>(7);

    const [preloadedLayers, setPreloadedLayers] = useState<{ [layerId: number]: L.Layer }>({});
    const [selectedTowers, setSelectedTowers] = useState<SelectedTower[]>([]);

    // Error message helper
    const getErrorMessage = () => {
        if (isPublicAccess) {
            return 'This public link is invalid or has expired. Please contact the project owner for a new link.';
        }
        return 'Project not found or access denied.';
    };

    // Authentication checks
    if (!isPublicAccess && authLoading) {
        return <StandaloneLoadingScreen progress={0} statusMessage="Authenticating..." />;
    }

    if (!isPublicAccess && !isAuthenticated) {
        return <StandaloneLoadingScreen progress={0} statusMessage="Authentication required..." />;
    }

    // Helper for layer name lookup
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

    // Use custom hooks for various functionality
    useBodyClass('standalone-viewer-active');
    
    useBufferManager(
        (towers: TowerWithBuffers[]) => setTowerBufferRelationships(towers),
        (towers: TowerWithBuffers[]) => {
            setBufferVisibility(prev => {
                const newState = { ...prev } as any;
                towers.forEach(tower => {
                    tower.buffers.forEach(buffer => {
                        if (!(buffer.id in newState)) {
                            newState[buffer.id] = false;
                        }
                    });
                });
                return newState;
            });
        }
    );
    
    useZoomVisibility(
        (layerId: number, visible: boolean, reason: 'zoom' | 'user') => {
            if (reason !== 'zoom') return;
            if (mapRef.current && layersRef.current[layerId]) {
                const layer = layersRef.current[layerId];
                if (visible) {
                    mapRef.current.addLayer(layer);
                } else {
                    mapRef.current.removeLayer(layer);
                }
            }
        },
        (hints: ZoomHint[]) => setZoomHints(hints)
    );

    // Initialize map
    useMapInit(projectData, loading, mapRef, mapContainerRef, setCurrentZoom, setVisibleLayers, setSelectedTowers);
    
    // Handle basemap switching
    useBasemapSwitcher(mapRef, projectData, loading, activeBasemap, basemapLayersRef);
    
    // Use layer visibility hook to handle layer creation and visibility
    const { getLoadingLayers } = useLayerVisibility(
        mapRef,
        projectData,
        loading,
        allLayersLoaded,
        cbrsLicenses,
        selectedTowers,
        visibleLayers,
        preloadedLayers,
        setPreloadedLayers,
        fallbackLayerData,
        getLayerNameById,
        setVisibleLayers
    );
    
    // Handle selected towers
    const { handleSelectedTowersToggle } = useSelectedTowers(
        selectedTowers,
        setSelectedTowers,
        setVisibleLayers,
        setPreloadedLayers,
        setBufferVisibility,
        projectData,
        mapRef
    );
    
    // Handle buffer toggling
    const { handleBufferToggle } = useBufferToggle(
        mapRef,
        visibleLayers,
        setBufferVisibility
    );
    
    // Handle layer toggling
    const { handleLayerToggle } = useLayerToggle(
        mapRef,
        getLayerNameById,
        towerBufferRelationships,
        setVisibleLayers,
        setBufferVisibility
    );
    
    // Cleanup on unmount
    useCleanup(mapRef);

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
                <StandaloneHeader isPublicAccess={isPublicAccess} />
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
                        <Typography color="error">{getErrorMessage()}</Typography>
                    </Paper>
                </Box>
            </>
        );
    }

    return (
        <>
            <StandaloneHeader projectName={projectData?.project?.name} isPublicAccess={isPublicAccess} />
            <Box
                position="relative"
                height="calc(100vh - 48px)"
                marginTop="48px"
            >
                <Box
                    ref={mapContainerRef}
                    width="100%"
                    height="100%"
                    sx={{
                        position: 'absolute', 
                        top: 0, 
                        left: 0, 
                        backgroundColor: 'white', 
                        '& .leaflet-container': {
                            backgroundColor: '#ffffff !important'
                        }
                    }}
                />

                <ZoomHintsOverlay zoomHints={zoomHints} currentZoom={currentZoom} />
                
                {/* Show loading indicator for layers being loaded on-demand */}
                {getLoadingLayers && <LayerLoadingIndicator 
                    loadingLayers={getLoadingLayers()} 
                    getLayerNameById={getLayerNameById} 
                />}

                {projectData && (
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
                        selectedTowersLayer={selectedTowers.length > 0 ? selectedTowersManager.getSelectedTowersVirtualLayer() : null}
                        onSelectedTowersToggle={handleSelectedTowersToggle}
                    />
                )}
            </Box>
        </>
    );
};

export default StandaloneViewerPage;
