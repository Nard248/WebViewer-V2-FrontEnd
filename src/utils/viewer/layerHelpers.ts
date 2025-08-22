import { ClusteringOptions, StandaloneLayer } from '../../types/viewer';

export const hasClusteringEnabled = (layer: StandaloneLayer): boolean => {
    return !!(
        (layer as any).enable_clustering ||
        ((layer as any).clustering && (layer as any).clustering.enabled) ||
        ((layer as any).functions && (layer as any).functions.some((func: any) => func.type === 'clustering'))
    );
};

export const getClusteringOptions = (layer: StandaloneLayer): ClusteringOptions => {
    if ((layer as any).clustering_options) return (layer as any).clustering_options as ClusteringOptions;
    if ((layer as any).clustering && (layer as any).clustering.options) return (layer as any).clustering.options as ClusteringOptions;
    if ((layer as any).functions) {
        const clusteringFunction = (layer as any).functions.find((func: any) => func.type === 'clustering');
        if (clusteringFunction && clusteringFunction.arguments) return clusteringFunction.arguments as ClusteringOptions;
    }
    return {
        disableClusteringAtZoom: 11,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        spiderfyOnMaxZoom: true
    } as ClusteringOptions;
};

export const isPointLayer = (layer: StandaloneLayer): boolean => {
    return (
        (layer as any).layer_type_name === 'Point Layer' ||
        (layer as any).layer_type_name === 'Point' ||
        (layer as any).type === 'Default-Line' ||
        (layer as any).type === 'Point'
    );
};


