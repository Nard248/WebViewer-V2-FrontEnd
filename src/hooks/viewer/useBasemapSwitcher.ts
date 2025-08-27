import { MutableRefObject, useEffect } from 'react';
import * as L from 'leaflet';
import { createWhiteTileLayer } from '../../utils/viewer/whiteTileLayer';

export const useBasemapSwitcher = (
    mapRef: MutableRefObject<L.Map | null>,
    projectData: any | null,
    loading: boolean,
    activeBasemap: number | null,
    basemapLayersRef: MutableRefObject<{ [id: number]: L.TileLayer }>
) => {
    useEffect(() => {
        if (!mapRef.current || !projectData || loading) return;

        Object.values(basemapLayersRef.current).forEach(layer => {
            if (mapRef.current!.hasLayer(layer)) {
                mapRef.current!.removeLayer(layer);
            }
        });
        basemapLayersRef.current = {} as any;

        const basemap = projectData.basemaps?.find((b: any) => b.id === activeBasemap);
        if (basemap) {
            let tileLayer: L.TileLayer;
            if (basemap.id === 1) {
                tileLayer = createWhiteTileLayer();
            } else {
                tileLayer = L.tileLayer(basemap.url_template, {
                    ...basemap.options,
                    attribution: basemap.attribution,
                    pane: 'basemapPane'
                });
            }
            tileLayer.addTo(mapRef.current);
            basemapLayersRef.current[basemap.id] = tileLayer;

            mapRef.current.getPane('basemapPane')!.style.zIndex = '200';
            mapRef.current.getPane('overlayPane')!.style.zIndex = '400';
            mapRef.current.getPane('markerPane')!.style.zIndex = '600';
        }
    }, [activeBasemap, projectData, loading]);
};


