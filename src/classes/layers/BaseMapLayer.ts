import * as L from 'leaflet';
import { IMapLayer, LayerConfig } from '../../interfaces/IMapLayer';

export default abstract class BaseMapLayer implements IMapLayer {
    public isVisible = false;
    protected map: L.Map | null = null;
    protected layer: L.Layer | null = null;

    constructor(
        public readonly id: number,
        public readonly name: string,
        public readonly type: string,
        public readonly config: LayerConfig
    ) {}

    async initialize(map: L.Map): Promise<void> {
        this.map = map;
    }

    abstract loadData(data: any): Promise<void>;

    show(): void {
        if (this.map && this.layer && !this.isVisible) {
            this.map.addLayer(this.layer);
            this.isVisible = true;
        }
    }

    hide(): void {
        if (this.map && this.layer && this.isVisible) {
            this.map.removeLayer(this.layer);
            this.isVisible = false;
        }
    }

    destroy(): void {
        if (this.map && this.layer) {
            this.map.removeLayer(this.layer);
        }
        this.map = null;
        this.layer = null;
        this.isVisible = false;
    }
}
