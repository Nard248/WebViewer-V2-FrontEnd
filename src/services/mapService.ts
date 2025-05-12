// src/services/mapService.ts
import { apiGet, apiPost, apiPut, apiDelete, createQueryParams } from './api';
import {
    MapTool,
    MapToolCreate,
    MapToolUpdate,
    ProjectTool,
    ProjectToolCreate,
    ProjectToolBatchUpdate
} from '../types';
import { PaginatedResponse, FeatureCollection } from '../types';
import { LayerDataParams } from '../types';

/**
 * Get layer data by layer ID
 */
export const getLayerData = (
    layerId: number,
    params: LayerDataParams = {}
): Promise<FeatureCollection> => {
    const queryParams = createQueryParams(params);
    return apiGet<FeatureCollection>(`/data/${layerId}/?${queryParams.toString()}`);
};

/**
 * Get map tools with pagination and filtering
 */
export const getMapTools = (
    params: Record<string, unknown> = {}
): Promise<PaginatedResponse<MapTool>> => {
    const queryParams = createQueryParams(params);
    return apiGet<PaginatedResponse<MapTool>>(`/map-tools/?${queryParams.toString()}`);
};

/**
 * Get a single map tool by ID
 */
export const getMapTool = (id: number): Promise<MapTool> => {
    return apiGet<MapTool>(`/map-tools/${id}/`);
};

/**
 * Get map tool code
 */
export const getMapToolCode = (id: number): Promise<MapTool> => {
    return apiGet<MapTool>(`/map-tools/${id}/code/`);
};

/**
 * Create a new map tool
 */
export const createMapTool = (tool: MapToolCreate): Promise<MapTool> => {
    return apiPost<MapTool>('/map-tools/', tool);
};

/**
 * Update a map tool
 */
export const updateMapTool = (id: number, tool: MapToolUpdate): Promise<MapTool> => {
    return apiPut<MapTool>(`/map-tools/${id}/`, tool);
};

/**
 * Delete a map tool
 */
export const deleteMapTool = (id: number): Promise<void> => {
    return apiDelete<void>(`/map-tools/${id}/`);
};

/**
 * Get project tools with pagination and filtering
 */
export const getProjectTools = (
    params: Record<string, unknown> = {}
): Promise<PaginatedResponse<ProjectTool>> => {
    const queryParams = createQueryParams(params);
    return apiGet<PaginatedResponse<ProjectTool>>(`/project-tools/?${queryParams.toString()}`);
};

/**
 * Create a project tool association
 */
export const createProjectTool = (projectTool: ProjectToolCreate): Promise<ProjectTool> => {
    return apiPost<ProjectTool>('/project-tools/', projectTool);
};

/**
 * Update project tools in batch
 */
export const updateProjectTools = (
    batchUpdate: ProjectToolBatchUpdate
): Promise<ProjectTool[]> => {
    return apiPost<ProjectTool[]>(`/project-tools/batch_update/`, batchUpdate);
};

const mapService = {
    getLayerData,
    getMapTools,
    getMapTool,
    getMapToolCode,
    createMapTool,
    updateMapTool,
    deleteMapTool,
    getProjectTools,
    createProjectTool,
    updateProjectTools
};

export default mapService;