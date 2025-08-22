import { StandaloneLayer } from '../../types/viewer';
import { towerCompanyColors } from '../../constants/towerConstants';
import { SelectedTower } from '../../components/viewer/SelectedTowersManager';

export const createSelectedTowersVirtualLayer = (selectedTowers: SelectedTower[]): StandaloneLayer => {
    return {
        id: -1,
        name: 'Selected Towers',
        layer_type_name: 'Point Layer',
        type: 'Point',
        is_visible: true,
        is_visible_by_default: false,
        z_index: 999,
        style: {
            color: (towerCompanyColors as any)['Selected'],
            fillColor: (towerCompanyColors as any)['Selected']
        },
        enable_clustering: true,
        clustering_options: {
            disableClusteringAtZoom: 11,
            showCoverageOnHover: false,
            zoomToBoundsOnClick: true,
            spiderfyOnMaxZoom: true
        }
    } as any;
};


