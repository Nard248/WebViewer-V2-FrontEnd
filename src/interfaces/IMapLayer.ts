export interface LayerConfig {
    id: number;
    name: string;
    type: string;
    zIndex?: number;
    /** Optional style information used for generic GeoJSON layers */
    style?: any;
    /** Enable clustering for point layers */
    enable_clustering?: boolean;
}

export interface IMapLayer {
    readonly id: number;
    readonly name: string;
    readonly type: string;
    isVisible: boolean;

    initialize(map: L.Map): Promise<void>;
    loadData(data: any): Promise<void>;
    show(): void;
    hide(): void;
    destroy(): void;
}
