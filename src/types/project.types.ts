// src/types/project.types.ts
import { MapControls, MapOptions } from './common.types';
import { LayerGroup } from './layer.types.ts'
import { Basemap } from './map.types.ts';
/**
 * Project definition
 */
export interface Project {
    id: number;
    name: string;
    description: string;
    is_public: boolean;
    is_active: boolean;
    default_center_lat: number;
    default_center_lng: number;
    default_zoom_level: number;
    map_controls: MapControls;
    map_options: MapOptions;
    max_zoom: number;
    min_zoom: number;
    state_abbr?: string; // State abbreviation for CBRS license lookup
    created_at: string;
    updated_at: string;
    created_by_user: number;
    creator_username: string;
}

/**
 * Project creation request
 */
export interface ProjectCreate {
    name: string;
    description: string;
    is_public: boolean;
    is_active: boolean;
    default_center_lat: number;
    default_center_lng: number;
    default_zoom_level: number;
    map_controls: MapControls;
    map_options: MapOptions;
    max_zoom: number;
    min_zoom: number;
    state_abbr?: string; // State abbreviation for CBRS license lookup
}

/**
 * Project update request
 */
export type ProjectUpdate = Partial<ProjectCreate>

/**
 * Project statistics
 */
export interface ProjectStats {
    total_layer_groups: number;
    total_layers: number;
    total_features: number;
    layer_stats: LayerStat[];
    client_shares: number;
    created_at: string;
    created_by: string;
}

/**
 * Layer statistics within project stats
 */
export interface LayerStat {
    id: number;
    name: string;
    feature_count: number;
    last_updated: string;
}

/**
 * Project share entry for a client
 */
export interface ProjectShare {
    id: number;
    project_id: number;
    project_name: string;
    unique_link: string;
    is_active: boolean;
    expires_at: string | null;
    last_accessed: string | null;
}

/**
 * Project constructor data returned from API
 */
export interface ProjectConstructor {
    project: Project;
    layer_groups: LayerGroup[]; // Will be replaced with typed LayerGroup[] when layer types are defined
    basemaps: Basemap[]; // Will be replaced with typed Basemap[] when map types are defined
    tools: Basemap[]; // Will be replaced with typed Basemap[] when map types are defined
}

/**
 * Project clone request
 */
export interface ProjectCloneRequest {
    name?: string;
}