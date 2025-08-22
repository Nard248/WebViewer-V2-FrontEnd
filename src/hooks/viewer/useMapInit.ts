import { MutableRefObject, useEffect } from 'react';
import * as L from 'leaflet';
import { zoomVisibilityManager } from '../../components/viewer/ZoomVisibilityManager';
import { frontendBufferManager } from '../../components/viewer/FrontendAntennaBufferSystem';
import { initializeTowerPopupHandler } from '../../components/viewer/EnhancedTowerPopupSystem';
import { selectedTowersManager, SelectedTower } from '../../components/viewer/SelectedTowersManager';

export const useMapInit = (
    projectData: any | null,
    loading: boolean,
    mapRef: MutableRefObject<L.Map | null>,
    mapContainerRef: MutableRefObject<HTMLDivElement | null>,
    setCurrentZoom: (z: number) => void,
    triggerLayerVisibilityUpdate: (updater: (prev: Set<number>) => Set<number>) => void,
    setSelectedTowers: (towers: SelectedTower[]) => void
) => {
    useEffect(() => {
        if (!projectData || !mapContainerRef.current || loading) return;

        if (mapRef.current) {
            frontendBufferManager.cleanup(mapRef.current);
            zoomVisibilityManager.cleanup();
            selectedTowersManager.cleanup();
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

            map.createPane('basemapPane');
            map.createPane('overlayPane');
            map.createPane('markerPane');

            map.getPane('basemapPane')!.style.zIndex = '200';
            map.getPane('overlayPane')!.style.zIndex = '400';
            map.getPane('markerPane')!.style.zIndex = '600';

            L.control.zoom({ position: 'topleft' }).addTo(map);

            map.on('zoomend', () => {
                const newZoom = map.getZoom();
                setCurrentZoom(newZoom);
                setTimeout(() => {
                    triggerLayerVisibilityUpdate(prev => new Set(prev));
                }, 0);
            });

            mapRef.current = map;
            setCurrentZoom(map.getZoom());

            zoomVisibilityManager.initialize(map, frontendBufferManager);
            initializeTowerPopupHandler();
            selectedTowersManager.initialize(map);
            selectedTowersManager.onSelectionChange((towers: SelectedTower[]) => {
                setSelectedTowers(towers);
                // eslint-disable-next-line no-console
                console.log(`Selection changed: ${towers.length} towers selected`);
            });

            (window as any).currentMap = map;
        } catch (err) {
            // eslint-disable-next-line no-console
            console.error('Error initializing map:', err);
        }
    }, [projectData, loading]);
};


