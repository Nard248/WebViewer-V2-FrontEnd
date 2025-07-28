import * as L from 'leaflet';
import { LayerFactory } from '../factories';
import { IMapLayer, LayerConfig } from '../../interfaces/IMapLayer';
import projectService from '../../services/projectService';
import mapService from '../../services/mapService';

interface BasemapInfo {
    id: number;
    name: string;
    url_template: string;
    provider: string;
    options?: Record<string, any>;
    is_default?: boolean;
}

interface ProjectConstructor {
    project: {
        default_center_lat: number;
        default_center_lng: number;
        default_zoom_level: number;
    };
    layer_groups: { layers: LayerConfig[] }[];
    basemaps: BasemapInfo[];
}

export default class ProjectController {
    private map: L.Map | null = null;
    private layers: IMapLayer[] = [];
    private basemaps: BasemapInfo[] = [];
    private activeBasemap: L.TileLayer | null = null;

    constructor(private projectId: string | number, private isPublic: boolean) {}

    async loadProject(): Promise<void> {
        let data: ProjectConstructor;
        if (this.isPublic) {
            data = await projectService.getPublicProjectConstructor(String(this.projectId));
        } else {
            data = await projectService.getProjectConstructor(Number(this.projectId));
        }
        this.basemaps = data.basemaps || [];
        await this.createLayers(data);

        if (this.map) {
            // set initial view
            this.map.setView(
                [data.project.default_center_lat, data.project.default_center_lng],
                data.project.default_zoom_level
            );

            await Promise.all(
                this.layers.map(async layer => {
                    await layer.initialize(this.map!);
                    const layerData = await this.fetchLayerData(layer.id);
                    await layer.loadData(layerData);
                    layer.show();
                })
            );

            this.setDefaultBasemap();
        }
    }

    attachMap(map: L.Map): void {
        this.map = map;
    }

    private async createLayers(data: ProjectConstructor): Promise<void> {
        const layers: IMapLayer[] = [];
        data.layer_groups.forEach(group => {
            group.layers.forEach(layerInfo => {
                layers.push(LayerFactory.createLayer(layerInfo));
            });
        });
        this.layers = layers;
    }

    private async fetchLayerData(layerId: number): Promise<any> {
        const headers = this.isPublic
            ? { headers: { 'X-Public-Token': String(this.projectId), Origin: window.location.origin } }
            : {};

        let chunk = 1;
        const features: any[] = [];
        let more = true;
        while (more) {
            try {
                const data = await mapService.getLayerData(layerId, { chunk_id: chunk }, headers);
                if (data.features && data.features.length) {
                    features.push(...data.features);
                    if (data.chunk_info && data.chunk_info.next_chunk) {
                        chunk = data.chunk_info.next_chunk;
                    } else {
                        more = false;
                    }
                } else {
                    more = false;
                }
            } catch {
                more = false;
            }
        }

        return { type: 'FeatureCollection', features };
    }

    private setDefaultBasemap(): void {
        if (!this.map || this.basemaps.length === 0) return;
        const defaultBm = this.basemaps.find(b => b.is_default) || this.basemaps[0];
        if (!defaultBm) return;

        let tileLayer: L.TileLayer;

        if (defaultBm.provider === 'custom' && !defaultBm.url_template) {
            // white background
            tileLayer = L.tileLayer('', {
                minZoom: 0,
                maxZoom: 22,
            });
        } else {
            tileLayer = L.tileLayer(defaultBm.url_template, defaultBm.options || {});
        }

        tileLayer.addTo(this.map);
        this.activeBasemap = tileLayer;
    }
}
