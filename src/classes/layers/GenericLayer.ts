import * as L from 'leaflet';
import BaseMapLayer from './BaseMapLayer';
import { LayerConfig } from '../../interfaces/IMapLayer';

export default class GenericLayer extends BaseMapLayer {
    constructor(id: number, name: string, type: string, config: LayerConfig) {
        super(id, name, type, config);
    }

    async loadData(data: any): Promise<void> {
        if (!this.map) return;
        this.layer = L.geoJSON(data, {
            style: this.config.style as any
        });
    }
}
