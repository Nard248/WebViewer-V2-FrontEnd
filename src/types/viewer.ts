// Shared viewer-related TypeScript types and interfaces

export interface ClusteringOptions {
    disableClusteringAtZoom?: number;
    showCoverageOnHover?: boolean;
    zoomToBoundsOnClick?: boolean;
    spiderfyOnMaxZoom?: boolean;
    removeOutsideVisibleBounds?: boolean;
    maxClusterRadius?: number;
    [key: string]: any;
}

export interface ClusteringConfig {
    enabled: boolean;
    options?: ClusteringOptions;
}

export interface LayerFunction {
    id?: number;
    type: string;
    name?: string;
    arguments?: Record<string, any>;
    priority?: number;
}

export interface StandaloneLayer {
    id: number;
    name: string;
    layer_type_name?: string;
    type?: string;
    is_visible?: boolean;
    is_visible_by_default?: boolean;
    z_index?: number;
    style?: any;
    marker_type?: string;
    marker_image_url?: string;

    // Clustering properties - multiple formats supported
    enable_clustering?: boolean;
    clustering_options?: ClusteringOptions;
    clustering?: ClusteringConfig;
    functions?: LayerFunction[];
}


