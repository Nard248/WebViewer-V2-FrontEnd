import * as L from 'leaflet';
import TowerLayer from './TowerLayer';
import { LayerConfig } from '../../interfaces/IMapLayer';
import { towerCompanyColors } from '../../constants/towerConstants';

export default class AntennaTowerLayer extends TowerLayer {
    constructor(id: number, name: string, type: string, config: LayerConfig) {
        super(id, name, type, config);
    }

    async loadData(data: any): Promise<void> {
        if (!this.map) return;
        const features = data?.features || [];
        const markers: L.Layer[] = [];
        for (const feature of features) {
            if (feature.geometry?.type === 'Point') {
                const [lng, lat] = feature.geometry.coordinates;
                const company = feature.properties?.company || 'Other';
                const color = towerCompanyColors[company as keyof typeof towerCompanyColors] || towerCompanyColors['Other'];
                const icon = L.divIcon({
                    className: 'antenna-tower-icon',
                    html: `<div style="background-color:${color};width:10px;height:10px;border-radius:50%"></div>`
                });
                markers.push(L.marker([lat, lng], { icon }));
            }
        }
        this.layer = L.layerGroup(markers);
    }
}
