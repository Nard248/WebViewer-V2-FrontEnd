import * as L from 'leaflet';
import BaseMapLayer from './BaseMapLayer';

export default class TowerLayer extends BaseMapLayer {
    async loadData(data: any): Promise<void> {
        if (!this.map) return;
        const features = data?.features || [];
        const markers: L.Layer[] = [];
        for (const feature of features) {
            if (feature.geometry?.type === 'Point') {
                const [lng, lat] = feature.geometry.coordinates;
                markers.push(L.marker([lat, lng]));
            }
        }
        this.layer = L.layerGroup(markers);
    }
}
