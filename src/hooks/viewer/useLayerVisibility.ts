import { useEffect } from 'react';
import * as L from 'leaflet';
import { frontendBufferManager, isAntennaTowerLayer } from '../../components/viewer/FrontendAntennaBufferSystem';
import { zoomVisibilityManager } from '../../components/viewer/ZoomVisibilityManager';
import { selectedTowersManager, SelectedTower } from '../../components/viewer/SelectedTowersManager';
import { layerDataCache } from '../../utils/LayerDataCache';
import { getClusteringOptions, hasClusteringEnabled, isPointLayer } from '../../utils/viewer/layerHelpers';
import iconPool from '../../utils/viewer/iconPool';
import { createTowerPopupHTML } from '../../components/viewer/EnhancedTowerPopupSystem';
import { getTowerCompanyFromLayerName } from '../../components/viewer/FrontendAntennaBufferSystem';
import { createCountyLabelsLayer } from '../../utils/viewer/countyLabels';
import { CBRSLicense } from '../../services/cbrsService';
import { useLazyLayerLoader } from './useLazyLayerLoader';
import { ViewportOptimizedLayer, DEFAULT_VIEWPORT_CONFIG } from '../../utils/viewer/viewportOptimization';

export const useLayerVisibility = (
    mapRef: React.MutableRefObject<L.Map | null>,
    projectData: any | null,
    loading: boolean,
    allLayersLoaded: boolean,
    cbrsLicenses: CBRSLicense[],
    selectedTowers: SelectedTower[],
    visibleLayers: Set<number>,
    preloadedLayers: { [layerId: string]: L.Layer },
    setPreloadedLayers: React.Dispatch<React.SetStateAction<{ [layerId: string]: L.Layer }>>,
    fallbackLayerData: { [layerId: number]: any },
    getLayerNameById: (layerId: number) => string,
    setVisibleLayers: React.Dispatch<React.SetStateAction<Set<number>>>,
    // New parameter for tracking feature counts
    setLayerFeatureCounts?: React.Dispatch<React.SetStateAction<{ [layerId: number]: number }>>
) => {
    // Use the lazy layer loader for on-demand loading
    const { loadLayerData, loadingLayers } = useLazyLayerLoader(false);
    
    // Return the loading layers for the loading indicator
    const getLoadingLayers = () => loadingLayers;
    useEffect(() => {
        if (!mapRef.current || !projectData || loading || !allLayersLoaded) return;

        const updateLayerVisibility = async () => {
            const allProjectLayers: any[] = [];
            if (projectData.layer_groups) {
                projectData.layer_groups.forEach((group: any) => {
                    if (group.layers) {
                        group.layers.forEach((layer: any) => {
                            allProjectLayers.push(layer);
                            
                            // Extract feature counts immediately for all relevant layers
                            if (setLayerFeatureCounts) {
                                const isLocationLayer = (layer.layer_type_name === 'Point Layer' || layer.type === 'Point') && (
                                    layer.name.toLowerCase().includes('location') || 
                                    layer.name.toLowerCase().includes('locations') ||
                                    layer.name.toLowerCase().includes('bead')
                                );
                                const isTowerLayer = isAntennaTowerLayer(layer.name);
                                
                                console.log(`🔍 Checking layer "${layer.name}": layer_type_name="${layer.layer_type_name}", type="${layer.type}", isLocationLayer=${isLocationLayer}, isTowerLayer=${isTowerLayer}`);
                                
                                if (isTowerLayer || isLocationLayer) {
                                    const totalFeatures = layer.data_source?.total_features;
                                    if (totalFeatures !== undefined) {
                                        console.log(`🔍 Setting feature count for ${layer.name}: ${totalFeatures}`);
                                        setLayerFeatureCounts(prev => ({
                                            ...prev,
                                            [layer.id]: totalFeatures
                                        }));
                                    } else {
                                        console.log(`⚠️ No total_features found for ${layer.name}`, layer.data_source);
                                    }
                                }
                            }
                        });
                    }
                });
            }

            if (selectedTowers.length > 0) {
                let antennaTowersGroup = null as any;
                if (projectData.layer_groups) {
                    antennaTowersGroup = projectData.layer_groups.find((group: any) =>
                        group.name?.toLowerCase().includes('antenna') ||
                        group.layers?.some((layer: any) => isAntennaTowerLayer(layer.name))
                    );
                }

                const selectedVirtual = selectedTowersManager.getSelectedTowersVirtualLayer();
                if (antennaTowersGroup && selectedVirtual) {
                    if (!antennaTowersGroup.layers.find((layer: any) => layer.id === -1)) {
                        antennaTowersGroup.layers.push({
                            id: -1,
                            name: 'Selected Towers',
                            layer_type_name: 'Point Layer',
                            type: 'Point',
                            is_visible: true,
                            is_visible_by_default: false,
                            z_index: 999
                        });
                    }
                    allProjectLayers.push({ id: -1, name: 'Selected Towers' });
                } else if (selectedVirtual) {
                    allProjectLayers.push({ id: -1, name: 'Selected Towers' });
                }
            } else {
                if (projectData.layer_groups) {
                    projectData.layer_groups.forEach((group: any) => {
                        if (group.layers) {
                            group.layers = group.layers.filter((layer: any) => layer.id !== -1);
                        }
                    });
                }
            }

            for (const layerInfo of allProjectLayers) {
                if (!preloadedLayers[(layerInfo.id as number).toString()]) {
                    await createMapLayer(layerInfo);
                }
            }

            for (const [layerIdStr, layer] of Object.entries(preloadedLayers)) {
                const layerKey = layerIdStr;
                if (layerKey.includes('_labels')) {
                    const parentLayerId = Number(layerKey.split('_')[0]);
                    const shouldBeVisible = visibleLayers.has(parentLayerId);
                    const isCurrentlyVisible = mapRef.current!.hasLayer(layer);
                    if (shouldBeVisible && !isCurrentlyVisible) mapRef.current!.addLayer(layer);
                    else if (!shouldBeVisible && isCurrentlyVisible) mapRef.current!.removeLayer(layer);
                    continue;
                }

                const layerId = Number(layerIdStr);
                if (layerId === -1) {
                    const shouldBeVisible = selectedTowers.length > 0 && visibleLayers.has(-1);
                    selectedTowersManager.toggleSelectedLayerVisibility(shouldBeVisible);
                    continue;
                }

                const userWantsVisible = visibleLayers.has(layerId);
                const layerName = getLayerNameById(layerId);
                const isTowerLayer = isAntennaTowerLayer(layerName);
                const zoomStatus = zoomVisibilityManager.getLayerZoomStatus(layerId);

                if (isTowerLayer) {
                    const shouldBeVisible = userWantsVisible && zoomStatus.canShow;
                    const isCurrentlyVisible = mapRef.current!.hasLayer(layer);
                    if (shouldBeVisible && !isCurrentlyVisible) {
                        mapRef.current!.addLayer(layer);
                        frontendBufferManager.toggleParentLayerBuffers(layerId, true, mapRef.current!);
                    } else if (!shouldBeVisible && isCurrentlyVisible) {
                        mapRef.current!.removeLayer(layer);
                        // Force hide buffers to ensure they are completely removed from the map
                        if (layerId === -1) {
                            // For selected towers, force cleanup all buffers
                            frontendBufferManager.forceHideBuffersForTower(layerId, mapRef.current!);
                        } else {
                            frontendBufferManager.toggleParentLayerBuffers(layerId, false, mapRef.current!);
                        }
                    }
                } else {
                    const shouldBeVisible = userWantsVisible;
                    const isCurrentlyVisible = mapRef.current!.hasLayer(layer);
                    if (shouldBeVisible && !isCurrentlyVisible) mapRef.current!.addLayer(layer);
                    else if (!shouldBeVisible && isCurrentlyVisible) mapRef.current!.removeLayer(layer);
                }
            }
        };

        const createMapLayer = async (layerInfo: any): Promise<void> => {
            try {
                // First, check if we have pre-calculated feature count from layer metadata
                const isLocationLayer = layerInfo.layer_type_name === 'Point Layer' && (
                    layerInfo.name.toLowerCase().includes('location') || 
                    layerInfo.name.toLowerCase().includes('locations') ||
                    layerInfo.name.toLowerCase().includes('bead')
                );
                const isTowerLayer = isAntennaTowerLayer(layerInfo.name) || layerInfo.id === -1;
                
                // Use pre-calculated total_features if available
                if (setLayerFeatureCounts && (isTowerLayer || isLocationLayer)) {
                    const totalFeatures = layerInfo.data_source?.total_features;
                    if (totalFeatures !== undefined) {
                        setLayerFeatureCounts(prev => ({
                            ...prev,
                            [layerInfo.id]: totalFeatures
                        }));
                    }
                }

                let data = null as any;
                if (layerInfo.id === -1) {
                    const virtual = selectedTowersManager.getSelectedTowersVirtualLayer();
                    if (!virtual) return;
                    const mapLayer = virtual.layerGroup;
                    setPreloadedLayers(prev => ({ ...prev, [-1]: mapLayer } as any));
                    if (visibleLayers.has(-1) && mapRef.current) mapRef.current.addLayer(mapLayer);
                    return;
                } else {
                    // First check if the layer is already in memory
                    const cachedData = layerDataCache.getLayerData(layerInfo.id);
                    if (cachedData) {
                        data = cachedData.data;
                    } 
                    // Then check fallback data from initial load
                    else if (fallbackLayerData[layerInfo.id]) {
                        data = fallbackLayerData[layerInfo.id];
                    }
                    // If not found, use lazy loading to fetch it on demand
                    else if (visibleLayers.has(layerInfo.id)) {
                        try {
                            // Only load if the layer is actually visible
                            data = await loadLayerData(layerInfo.id, layerInfo.name);
                        } catch (error) {
                            console.error(`Failed to lazy load layer ${layerInfo.name}:`, error);
                            return;
                        }
                    } else {
                        // Skip loading invisible layers
                        return;
                    }
                }

                if (!data.features || data.features.length === 0) return;

                const isTowerLayerHere = isAntennaTowerLayer(layerInfo.name) || layerInfo.id === -1;
                const isCountyLayer = layerInfo.name === 'County Outline' || layerInfo.id === 794;
                const isPointLayerType = layerInfo.layer_type_name === 'Point Layer';

                // Track feature count for Locations and Antenna layers (fallback to counting loaded features)
                const isLocationLayerHere = isPointLayerType && (
                    layerInfo.name.toLowerCase().includes('location') || 
                    layerInfo.name.toLowerCase().includes('locations') ||
                    layerInfo.name.toLowerCase().includes('bead')
                );
                if (setLayerFeatureCounts && (isTowerLayerHere || isLocationLayerHere)) {
                    // Only count loaded features if we don't already have the total from metadata
                    setLayerFeatureCounts(prev => {
                        // Don't overwrite if we already have a count from total_features
                        if (prev[layerInfo.id] !== undefined) {
                            return prev;
                        }
                        return {
                            ...prev,
                            [layerInfo.id]: data.features.length
                        };
                    });
                }

                let mapLayer: L.Layer;
                const shouldCluster = isPointLayer(layerInfo) && hasClusteringEnabled(layerInfo);
                const featureCount = data.features.length;
                // Much lower threshold for antenna towers to improve performance
                const optimizationThreshold = isTowerLayerHere ? 100 : DEFAULT_VIEWPORT_CONFIG.maxMarkersWithoutOptimization;
                const useViewportOptimization = !shouldCluster && isPointLayer(layerInfo) && featureCount > optimizationThreshold;
                
                console.log(`🎯 Layer ${layerInfo.name}: ${featureCount} features, clustering: ${shouldCluster}, viewport optimization: ${useViewportOptimization}`);
                
                if (useViewportOptimization) {
                    // Use viewport-based optimization for large non-clustered point layers
                    const createMarker = (feature: any, latlng: L.LatLng): L.Marker | L.CircleMarker => {
                        if (isTowerLayerHere && feature.properties) {
                            let companyName: string;
                            let isSelected = false;
                            if (layerInfo.id === -1) { 
                                companyName = 'Selected'; 
                                isSelected = true; 
                            } else { 
                                companyName = getTowerCompanyFromLayerName(layerInfo.name); 
                            }
                            const towerIcon = iconPool.getTowerIcon(companyName);
                            const marker = L.marker(latlng, { icon: towerIcon });
                            const popupHTML = createTowerPopupHTML(
                                feature.properties,
                                companyName,
                                layerInfo.name,
                                layerInfo.id,
                                isSelected
                            );
                            (marker as any).bindPopup(popupHTML, { maxWidth: 400, className: 'tower-popup' });
                            return marker;
                        } else {
                            return L.circleMarker(latlng, {
                                radius: layerInfo.style?.radius || 4,
                                fillColor: layerInfo.style?.fillColor || '#01fbff',
                                color: layerInfo.style?.color || '#000000',
                                weight: layerInfo.style?.weight || 1,
                                opacity: layerInfo.style?.opacity || 1,
                                fillOpacity: layerInfo.style?.fillOpacity || 0.8
                            });
                        }
                    };
                    
                    const viewportLayer = new ViewportOptimizedLayer(
                        mapRef.current!,
                        data.features,
                        createMarker,
                        {
                            maxMarkersWithoutOptimization: isTowerLayerHere ? 100 : 5000,
                            bufferMultiplier: isTowerLayerHere ? 1.3 : 1.5,
                            minZoomForOptimization: isTowerLayerHere ? 11 : 10,
                            useCanvasForDenseLayers: featureCount > 50000,
                            canvasThreshold: 50000
                        }
                    );
                    
                    mapLayer = viewportLayer.getLayerGroup();
                } else if (shouldCluster) {
                    await import('leaflet.markercluster');
                    const MarkerClusterGroup = (L as any).MarkerClusterGroup;
                    const clusteringOptions = getClusteringOptions(layerInfo);
                    
                    // Dynamic clustering settings based on feature count
                    let dynamicDisableZoom = clusteringOptions.disableClusteringAtZoom || 11;
                    let dynamicRemoveOutside = clusteringOptions.removeOutsideVisibleBounds || false;
                    
                    if (featureCount > 100000) {
                        // For very large datasets, never fully disable clustering
                        dynamicDisableZoom = 22; // Keep clustering at all zoom levels
                        dynamicRemoveOutside = true; // Enable viewport culling
                        console.log(`🔧 Large dataset detected (${featureCount} features): forcing clustering at all zoom levels`);
                    } else if (featureCount > 50000) {
                        // For large datasets, disable clustering later
                        dynamicDisableZoom = Math.max(dynamicDisableZoom, 15);
                        dynamicRemoveOutside = true;
                        console.log(`🔧 Medium dataset detected (${featureCount} features): clustering until zoom ${dynamicDisableZoom}`);
                    }
                    
                    const markerClusterGroup = new MarkerClusterGroup({
                        disableClusteringAtZoom: dynamicDisableZoom,
                        showCoverageOnHover: clusteringOptions.showCoverageOnHover || false,
                        zoomToBoundsOnClick: clusteringOptions.zoomToBoundsOnClick !== false,
                        spiderfyOnMaxZoom: clusteringOptions.spiderfyOnMaxZoom !== false,
                        removeOutsideVisibleBounds: dynamicRemoveOutside,
                        maxClusterRadius: clusteringOptions.maxClusterRadius || 80,
                        iconCreateFunction: iconPool.getClusterIcon,
                        chunkedLoading: featureCount > 10000, // Enable chunked loading for large datasets
                        chunkInterval: 200, // Process markers in chunks
                        ...clusteringOptions
                    });
                    data.features.forEach((feature: any) => {
                        if (feature.geometry && feature.geometry.type === 'Point') {
                            const [lng, lat] = feature.geometry.coordinates;
                            let marker: L.Marker | L.CircleMarker;
                            if (isTowerLayerHere && feature.properties) {
                                let companyName: string;
                                let isSelected = false;
                                if (layerInfo.id === -1) { companyName = 'Selected'; isSelected = true; }
                                else { companyName = getTowerCompanyFromLayerName(layerInfo.name); }
                                const towerIcon = iconPool.getTowerIcon(companyName);
                                marker = L.marker([lat, lng], { icon: towerIcon });
                                const popupHTML = createTowerPopupHTML(
                                    feature.properties,
                                    companyName,
                                    layerInfo.name,
                                    layerInfo.id,
                                    isSelected
                                );
                                (marker as any).bindPopup(popupHTML, { maxWidth: 400, className: 'tower-popup' });
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
                            (markerClusterGroup as any).addLayer(marker);
                        }
                    });
                    mapLayer = markerClusterGroup;
                } else {
                    mapLayer = L.geoJSON(data, {
                        // @ts-expect-error: 'renderer' is not in GeoJSONOptions type, but Leaflet supports it at runtime
                        renderer: L.canvas(), // Use Canvas renderer for better performance with large datasets
                        style: () => ({
                            color: layerInfo.style?.color || '#3388ff',
                            weight: layerInfo.style?.weight || 2,
                            opacity: layerInfo.style?.opacity || 1,
                            fillColor: layerInfo.style?.fillColor || layerInfo.style?.color || '#3388ff',
                            // Remove fill for county/state outline layers
                            fillOpacity: isCountyLayer ? 0 : (layerInfo.style?.fillOpacity || 0.2)
                        }),
                        pointToLayer: (feature, latlng) => {
                            if (isTowerLayerHere) {
                                const companyName = getTowerCompanyFromLayerName(layerInfo.name);
                                const towerIcon = iconPool.getTowerIcon(companyName);
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
                            if (feature.properties && isTowerLayerHere) {
                                const popupHTML = createTowerPopupHTML(
                                    feature.properties,
                                    getTowerCompanyFromLayerName(layerInfo.name),
                                    layerInfo.name,
                                    layerInfo.id,
                                    false
                                );
                                (leafletLayer as any).bindPopup(popupHTML, { maxWidth: 400, className: 'tower-popup' });
                            } else if (isCountyLayer && feature.geometry) {
                                // CBRS popups are handled via labels layer
                            }
                        }
                    });
                }

                const shouldBeVisible_created = visibleLayers.has(layerInfo.id);
                if (isTowerLayerHere && layerInfo.id !== -1) {
                    zoomVisibilityManager.registerLayer(
                        layerInfo.id,
                        layerInfo.name,
                        isTowerLayerHere,
                        shouldBeVisible_created
                    );
                }

                if (isTowerLayerHere && layerInfo.id !== -1) {
                    // Only generate buffers for regular tower layers, not selected towers
                    // Selected towers buffers are handled by SelectedTowersManager
                    const companyName = getTowerCompanyFromLayerName(layerInfo.name);
                    frontendBufferManager.generateBuffersFromTowerData(
                        data,
                        layerInfo.id,
                        layerInfo.name,
                        companyName,
                        mapRef.current! // Pass map reference for viewport optimization
                    );
                }

                setPreloadedLayers(prev => ({ ...prev, [layerInfo.id]: mapLayer } as any));

                const shouldBeVisible = visibleLayers.has(layerInfo.id);
                if (shouldBeVisible && mapRef.current) mapRef.current.addLayer(mapLayer);

                const customMinZoom = layerInfo.id === -1 ? 0 : undefined;
                zoomVisibilityManager.registerLayer(
                    layerInfo.id,
                    layerInfo.name,
                    isTowerLayerHere,
                    shouldBeVisible,
                    customMinZoom
                );

                if (isCountyLayer) {
                    console.log(`🏷️ Creating county labels layer for ${layerInfo.name} with ${cbrsLicenses.length} CBRS licenses`);
                    const labelsKey = `${layerInfo.id}_labels`;
                    const labelsLayer = createCountyLabelsLayer(layerInfo.id, data, cbrsLicenses);
                    setPreloadedLayers(prev => ({ ...prev, [labelsKey]: labelsLayer } as any));
                    const visible = visibleLayers.has(layerInfo.id);
                    if (visible && mapRef.current) {
                        console.log(`🗺️ Adding county labels layer to map`);
                        mapRef.current.addLayer(labelsLayer);
                    }
                }
            } catch (err) {
                // eslint-disable-next-line no-console
                console.error(`Error creating map layer ${layerInfo.name}:`, err);
            }
        };

        updateLayerVisibility();
    }, [visibleLayers, projectData, loading, allLayersLoaded, cbrsLicenses, selectedTowers]);
    
    return {
        getLoadingLayers
    };
};


