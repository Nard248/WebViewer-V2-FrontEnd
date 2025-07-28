import * as L from 'leaflet';
import TowerLayer from '../layers/TowerLayer';
import BaseMapLayer from '../layers/BaseMapLayer';
import { IMapLayer, LayerConfig } from '../../interfaces/IMapLayer';
import projectService from '../../services/projectService';
import { mapService } from '../../services';

interface ProjectConstructor {
    project: {
        default_center_lat: number;
        default_center_lng: number;
        default_zoom_level: number;
    };
    layer_groups: { layers: LayerConfig[] }[];
}

export default class ProjectController {
    private map: L.Map | null = null;
    private layers: IMapLayer[] = [];

    constructor(private projectId: string | number, private isPublic: boolean) {}

    async loadProject(): Promise<void> {
        let data: ProjectConstructor;
        if (this.isPublic) {
            data = await projectService.getPublicProjectConstructor(String(this.projectId));
        } else {
            data = await projectService.getProjectConstructor(Number(this.projectId));
        }
        await this.createLayers(data);
        if (this.map) {
            this.layers.forEach(layer => layer.initialize(this.map!));
            await Promise.all(
                this.layers.map(async layer => {
                    const layerData = await mapService.getLayerFeatures(layer.id);
                    await layer.loadData(layerData);
                })
            );
            this.layers.forEach(layer => layer.show());
        }
    }

    attachMap(map: L.Map): void {
        this.map = map;
    }

    private async createLayers(data: ProjectConstructor): Promise<void> {
        const layers: IMapLayer[] = [];
        data.layer_groups.forEach(group => {
            group.layers.forEach(layerInfo => {
                if (layerInfo.type === 'tower') {
                    layers.push(new TowerLayer(layerInfo.id, layerInfo.name, layerInfo.type, layerInfo));
                }
            });
        });
        this.layers = layers;
    }
}
