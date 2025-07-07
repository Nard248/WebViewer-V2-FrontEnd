// src/components/map/MapContainer.tsx
import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';
import { Box } from '@mui/material';
import { Layer, LayerFunction } from '../../types/layer.types';
import { mapService } from '../../services/mapService';
import { createTowerPopupHTML, isAntennaLayer, getTowerCompanyFromLayerName } from '../viewer/EnhancedTowerPopupSystem';

// Fix Leaflet default marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

interface MapContainerProps {
    layers: Layer[];
    center?: [number, number];
    zoom?: number;
    basemapUrl?: string;
}

const MapContainer: React.FC<MapContainerProps> = ({
                                                       layers,
                                                       center = [51.505, -0.09],
                                                       zoom = 13,
                                                       basemapUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
                                                   }) => {
    const mapRef = useRef<L.Map | null>(null);
    const layersRef = useRef<{ [key: number]: L.Layer }>({});
    const [isLoading, setIsLoading] = useState(true);

    // Initialize map
    useEffect(() => {
        if (!mapRef.current) {
            const map = L.map('map', {
                center,
                zoom,
                zoomControl: true,
                attributionControl: true,
            });

            // Add basemap
            L.tileLayer(basemapUrl, {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);

            mapRef.current = map;
            setIsLoading(false);
        }

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, []);

    // Update map center and zoom when props change
    useEffect(() => {
        if (mapRef.current) {
            mapRef.current.setView(center, zoom);
        }
    }, [center, zoom]);

    // Handle layers
    useEffect(() => {
        if (!mapRef.current || isLoading) return;

        // Remove existing layers
        Object.values(layersRef.current).forEach(layer => {
            mapRef.current!.removeLayer(layer);
        });
        layersRef.current = {};

        // Add new layers
        layers.forEach(layer => {
            if (layer.is_visible_by_default) {
                loadLayer(layer);
            }
        });
    }, [layers, isLoading]);

    const loadLayer = async (layer: Layer) => {
        if (!mapRef.current) return;

        try {
            const bounds = mapRef.current.getBounds().toBBoxString();
            const currentZoom = mapRef.current.getZoom();

            if (layer.enable_clustering && layer.layer_functions?.length > 0) {
                await loadClusteredLayer(layer, bounds, currentZoom, layer.layer_functions[0]);
            } else {
                await loadRegularLayer(layer, bounds, currentZoom);
            }
        } catch (error) {
            console.error(`Error loading layer ${layer.name}:`, error);
        }
    };

    const loadClusteredLayer = async (layer: Layer, bounds: string, zoom: number, clusterFunction?: LayerFunction) => {
        if (!mapRef.current) return;

        try {
            // Fetch layer data
            const { features } = await mapService.getLayerData(layer.id, 1, bounds, zoom);

            // Create cluster group with function options
            const clusterOptions = clusterFunction?.function_options || {
                showCoverageOnHover: false,
                maxClusterRadius: 80,
                disableClusteringAtZoom: 11,
                spiderfyOnMaxZoom: true,
                chunkedLoading: true,
            };

            const clusterGroup = L.markerClusterGroup(clusterOptions);

            // Process features based on layer type
            const geoJsonLayer = L.geoJSON(features, {
                style: (feature) => ({
                    color: layer.style?.color || '#3388ff',
                    weight: layer.style?.weight || 3,
                    opacity: layer.style?.opacity || 1,
                    fillColor: layer.style?.fillColor || layer.style?.color || '#3388ff',
                    fillOpacity: layer.style?.fillOpacity || 0.2,
                    radius: layer.style?.radius || 6
                }),
                pointToLayer: (feature, latlng) => {
                    // Check if this is a tower layer and has marker options
                    if (isAntennaLayer(layer.name) && layer.marker_options) {
                        return L.marker(latlng, {
                            icon: L.divIcon({
                                html: `<i class="${layer.marker_options.prefix || 'fa'} ${layer.marker_options.prefix || 'fa'}-${layer.marker_options.icon || 'wifi'}" style="color: ${layer.marker_options.iconColor || 'white'}; background-color: ${layer.marker_options.color || 'blue'}; padding: 6px; border-radius: 50%;"></i>`,
                                iconSize: [30, 30],
                                className: 'custom-div-icon'
                            })
                        });
                    }

                    // Default circle marker
                    return L.circleMarker(latlng, {
                        radius: layer.style?.radius || 6,
                        fillColor: layer.style?.fillColor || '#3388ff',
                        color: layer.style?.color || '#000',
                        weight: layer.style?.weight || 1,
                        opacity: layer.style?.opacity || 1,
                        fillOpacity: layer.style?.fillOpacity || 0.8
                    });
                },
                onEachFeature: (feature, leafletLayer) => {
                    // Add popup if properties exist
                    if (feature.properties) {
                        let popupContent: string;

                        // Check if this is an antenna/tower layer
                        if (isAntennaLayer(layer.name)) {
                            const companyName = getTowerCompanyFromLayerName(layer.name);
                            popupContent = createTowerPopupHTML(feature.properties, companyName);
                        } else {
                            // Standard popup for non-tower layers
                            popupContent = createStandardPopupContent(feature.properties);
                        }

                        // Bind popup with appropriate options
                        const popupOptions = isAntennaLayer(layer.name)
                            ? { maxWidth: 450, maxHeight: 400, className: 'tower-popup' }
                            : { maxWidth: 300 };

                        leafletLayer.bindPopup(popupContent, popupOptions);
                    }
                }
            });

            // Add features to cluster group and add to map
            clusterGroup.addLayer(geoJsonLayer);
            mapRef.current.addLayer(clusterGroup);
            layersRef.current[layer.id] = clusterGroup;

        } catch (error) {
            console.error(`Error loading clustered layer ${layer.name}:`, error);
        }
    };

    const loadRegularLayer = async (layer: Layer, bounds: string, zoom: number) => {
        if (!mapRef.current) return;

        try {
            // Fetch layer data
            const { features } = await mapService.getLayerData(layer.id, 1, bounds, zoom);

            // Process features based on layer type
            const geoJsonLayer = L.geoJSON(features, {
                style: (feature) => {
                    // Apply style from layer
                    return {
                        color: layer.style?.color || '#3388ff',
                        weight: layer.style?.weight || 3,
                        opacity: layer.style?.opacity || 1,
                        fillColor: layer.style?.fillColor || layer.style?.color || '#3388ff',
                        fillOpacity: layer.style?.fillOpacity || 0.2,
                        radius: layer.style?.radius || 6
                    };
                },
                pointToLayer: (feature, latlng) => {
                    // Check if this is a tower layer and has marker options
                    if (isAntennaLayer(layer.name) && layer.marker_options) {
                        return L.marker(latlng, {
                            icon: L.divIcon({
                                html: `<i class="${layer.marker_options.prefix || 'fa'} ${layer.marker_options.prefix || 'fa'}-${layer.marker_options.icon || 'wifi'}" style="color: ${layer.marker_options.iconColor || 'white'}; background-color: ${layer.marker_options.color || 'blue'}; padding: 6px; border-radius: 50%;"></i>`,
                                iconSize: [30, 30],
                                className: 'custom-div-icon'
                            })
                        });
                    }

                    // Default circle marker
                    return L.circleMarker(latlng, {
                        radius: layer.style?.radius || 6,
                        fillColor: layer.style?.fillColor || '#3388ff',
                        color: layer.style?.color || '#000',
                        weight: layer.style?.weight || 1,
                        opacity: layer.style?.opacity || 1,
                        fillOpacity: layer.style?.fillOpacity || 0.8
                    });
                },
                onEachFeature: (feature, leafletLayer) => {
                    // Add popup if properties exist
                    if (feature.properties) {
                        let popupContent: string;

                        // Check if this is an antenna/tower layer
                        if (isAntennaLayer(layer.name)) {
                            const companyName = getTowerCompanyFromLayerName(layer.name);
                            popupContent = createTowerPopupHTML(feature.properties, companyName);
                        } else {
                            // Standard popup for non-tower layers
                            popupContent = createStandardPopupContent(feature.properties);
                        }

                        // Bind popup with appropriate options
                        const popupOptions = isAntennaLayer(layer.name)
                            ? { maxWidth: 450, maxHeight: 400, className: 'tower-popup' }
                            : { maxWidth: 300 };

                        leafletLayer.bindPopup(popupContent, popupOptions);
                    }
                }
            });

            mapRef.current.addLayer(geoJsonLayer);
            layersRef.current[layer.id] = geoJsonLayer;

        } catch (error) {
            console.error(`Error loading layer ${layer.name}:`, error);
        }
    };

    // Create standard popup content for non-tower layers
    const createStandardPopupContent = (properties: any): string => {
        if (!properties) return 'No properties';

        let content = '<div class="feature-popup">';

        // Try to find a title property
        const titleProps = ['name', 'title', 'id', 'label'];
        let title = null;

        for (const prop of titleProps) {
            if (properties[prop]) {
                title = properties[prop];
                break;
            }
        }

        if (title) {
            content += `<h4>${title}</h4>`;
        }

        // Add all properties
        content += '<table>';
        Object.entries(properties).forEach(([key, value]) => {
            // Skip if it's the title we already displayed
            if (title && titleProps.includes(key) && properties[key] === title) {
                return;
            }

            // Format value if it's an object
            let displayValue = value;
            if (typeof value === 'object' && value !== null) {
                displayValue = JSON.stringify(value);
            }

            content += `<tr>
                <td style="padding: 4px; font-weight: bold;">${key}:</td>
                <td style="padding: 4px;">${displayValue}</td>
            </tr>`;
        });
        content += '</table>';
        content += '</div>';

        return content;
    };

    return (
        <Box
            id="map"
            sx={{
                width: '100%',
                height: '100%',
                position: 'relative',
                '& .leaflet-container': {
                    width: '100%',
                    height: '100%',
                },
                '& .custom-div-icon': {
                    background: 'transparent',
                    border: 'none',
                }
            }}
        />
    );
};

export default MapContainer;