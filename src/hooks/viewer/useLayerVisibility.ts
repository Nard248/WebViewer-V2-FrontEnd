import { useEffect } from 'react';
import * as L from 'leaflet';
import { frontendBufferManager, isAntennaTowerLayer } from '../../components/viewer/FrontendAntennaBufferSystem';
import { zoomVisibilityManager } from '../../components/viewer/ZoomVisibilityManager';
import { selectedTowersManager, SelectedTower } from '../../components/viewer/SelectedTowersManager';
import { layerDataCache } from '../../utils/LayerDataCache';
import { getClusteringOptions, hasClusteringEnabled, isPointLayer } from '../../utils/viewer/layerHelpers';
import { createClusterIcon, createTowerIcon } from '../../utils/viewer/icons';
import { createTowerPopupHTML } from '../../components/viewer/EnhancedTowerPopupSystem';
import { getTowerCompanyFromLayerName } from '../../components/viewer/FrontendAntennaBufferSystem';
import { createCountyLabelsLayer } from '../../utils/viewer/countyLabels';
import { CBRSLicense } from '../../services/cbrsService';
import { useLazyLayerLoader } from './useLazyLayerLoader';

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
    setVisibleLayers: React.Dispatch<React.SetStateAction<Set<number>>>
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
                    if (group.layers) group.layers.forEach((layer: any) => allProjectLayers.push(layer));
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
                        frontendBufferManager.toggleParentLayerBuffers(layerId, false, mapRef.current!);
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

                const isTowerLayer = isAntennaTowerLayer(layerInfo.name) || layerInfo.id === -1;
                const isCountyLayer = layerInfo.name === 'County Outline' || layerInfo.id === 794;

                let mapLayer: L.Layer;
                const shouldCluster = isPointLayer(layerInfo) && hasClusteringEnabled(layerInfo);
                if (shouldCluster) {
                    await import('leaflet.markercluster');
                    const MarkerClusterGroup = (L as any).MarkerClusterGroup;
                    const clusteringOptions = getClusteringOptions(layerInfo);
                    const markerClusterGroup = new MarkerClusterGroup({
                        disableClusteringAtZoom: clusteringOptions.disableClusteringAtZoom || 11,
                        showCoverageOnHover: clusteringOptions.showCoverageOnHover || false,
                        zoomToBoundsOnClick: clusteringOptions.zoomToBoundsOnClick !== false,
                        spiderfyOnMaxZoom: clusteringOptions.spiderfyOnMaxZoom !== false,
                        removeOutsideVisibleBounds: clusteringOptions.removeOutsideVisibleBounds || false,
                        maxClusterRadius: clusteringOptions.maxClusterRadius || 80,
                        iconCreateFunction: createClusterIcon,
                        ...clusteringOptions
                    });
                    data.features.forEach((feature: any) => {
                        if (feature.geometry && feature.geometry.type === 'Point') {
                            const [lng, lat] = feature.geometry.coordinates;
                            let marker: L.Marker | L.CircleMarker;
                            if (isTowerLayer && feature.properties) {
                                let companyName: string;
                                let isSelected = false;
                                if (layerInfo.id === -1) { companyName = 'Selected'; isSelected = true; }
                                else { companyName = getTowerCompanyFromLayerName(layerInfo.name); }
                                const towerIcon = createTowerIcon(companyName);
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
                if (isTowerLayer && layerInfo.id !== -1) {
                    zoomVisibilityManager.registerLayer(
                        layerInfo.id,
                        layerInfo.name,
                        isTowerLayer,
                        shouldBeVisible_created
                    );
                }

                if (isTowerLayer) {
                    const companyName = layerInfo.id === -1 ? 'Selected' : getTowerCompanyFromLayerName(layerInfo.name);
                    frontendBufferManager.generateBuffersFromTowerData(
                        data,
                        layerInfo.id,
                        layerInfo.name,
                        companyName
                    );
                }

                setPreloadedLayers(prev => ({ ...prev, [layerInfo.id]: mapLayer } as any));

                const shouldBeVisible = visibleLayers.has(layerInfo.id);
                if (shouldBeVisible && mapRef.current) mapRef.current.addLayer(mapLayer);

                const customMinZoom = layerInfo.id === -1 ? 0 : undefined;
                zoomVisibilityManager.registerLayer(
                    layerInfo.id,
                    layerInfo.name,
                    isTowerLayer,
                    shouldBeVisible,
                    customMinZoom
                );

                if (isCountyLayer) {
                    const labelsKey = `${layerInfo.id}_labels`;
                    const labelsLayer = createCountyLabelsLayer(layerInfo.id, data, cbrsLicenses);
                    setPreloadedLayers(prev => ({ ...prev, [labelsKey]: labelsLayer } as any));
                    const visible = visibleLayers.has(layerInfo.id);
                    if (visible && mapRef.current) mapRef.current.addLayer(labelsLayer);
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


