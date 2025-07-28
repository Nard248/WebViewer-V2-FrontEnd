import TowerLayer from '../layers/TowerLayer';
import GenericLayer from '../layers/GenericLayer';
import AntennaTowerLayer from '../layers/AntennaTowerLayer';
import { IMapLayer, LayerConfig } from '../../interfaces/IMapLayer';

export default class LayerFactory {
    static createLayer(config: LayerConfig): IMapLayer {
        switch (config.type) {
            case 'tower':
                return new TowerLayer(config.id, config.name, config.type, config);
            case 'antenna_tower':
                return new AntennaTowerLayer(config.id, config.name, config.type, config);
            default:
                return new GenericLayer(config.id, config.name, config.type, config);
        }
    }
}
