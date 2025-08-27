// src/services/layerService.ts
import { apiGet, apiPost, apiPut, apiPatch, apiDelete, createQueryParams } from './api';
import {
    Layer,
    LayerCreate,
    LayerUpdate,
    LayerGroup,
    LayerGroupCreate,
    LayerGroupUpdate,
    Feature,
    FeatureCreate,
    FeatureUpdate,
    LayerDataParams,
    LayerBufferRequest,
    LayerDataOperationResponse
} from '../types';
import { PaginatedResponse, FeatureCollection } from '../types';

/**
 * Get layers with pagination and filtering
 */
export const getLayers = (
    params: Record<string, unknown> = {}
): Promise<PaginatedResponse<Layer>> => {
    const queryParams = createQueryParams(params);
    return apiGet<PaginatedResponse<Layer>>(`/layers/?${queryParams.toString()}`);
};

/**
 * Get a single layer by ID
 */
export const getLayer = (id: number): Promise<Layer> => {
    return apiGet<Layer>(`/layers/${id}/`);
};

/**
 * Create a new layer
 */
export const createLayer = (layer: LayerCreate): Promise<Layer> => {
    return apiPost<Layer>('/layers/', layer);
};

/**
 * Update a layer (full update)
 */
export const updateLayer = (id: number, layer: LayerUpdate): Promise<Layer> => {
    return apiPut<Layer>(`/layers/${id}/`, layer);
};

/**
 * Partially update a layer
 */
export const patchLayer = (id: number, layer: LayerUpdate): Promise<Layer> => {
    return apiPatch<Layer>(`/layers/${id}/`, layer);
};

/**
 * Delete a layer
 */
export const deleteLayer = (id: number): Promise<void> => {
    return apiDelete<void>(`/layers/${id}/`);
};

/**
 * Clear layer data
 */
export const clearLayerData = (id: number): Promise<LayerDataOperationResponse> => {
    return apiPost<LayerDataOperationResponse>(`/layers/${id}/clear_data/`);
};

/**
 * Get layer data with viewport filtering and pagination
 */
export const getLayerData = (
    id: number,
    params: LayerDataParams = {}
): Promise<FeatureCollection> => {
    const queryParams = createQueryParams(params);
    return apiGet<FeatureCollection>(`/data-fast/${id}/?${queryParams.toString()}`);
};

/**
 * Export layer as GeoJSON
 */
export const exportLayerGeoJSON = (id: number): Promise<FeatureCollection> => {
    return apiGet<FeatureCollection>(`/layers/${id}/export_geojson/`);
};

/**
 * Import GeoJSON to layer
 */
export const importLayerGeoJSON = (
    id: number,
    geojson: FeatureCollection
): Promise<LayerDataOperationResponse> => {
    return apiPost<LayerDataOperationResponse>(
        `/layers/${id}/import_geojson/`,
        geojson
    );
};

/**
 * Buffer operation on layer
 */
export const bufferLayer = (
    id: number,
    params: LayerBufferRequest
): Promise<LayerDataOperationResponse> => {
    return apiPost<LayerDataOperationResponse>(
        `/layers/${id}/buffer/`,
        params
    );
};

/**
 * Upload shapefile to layer
 */
export const uploadShapefile = (
    id: number,
    file: File
): Promise<LayerDataOperationResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    return apiPost<LayerDataOperationResponse>(
        `/layers/${id}/upload_shapefile/`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
    );
};

/**
 * Get layer groups with pagination and filtering
 */
export const getLayerGroups = (
    params: Record<string, unknown> = {}
): Promise<PaginatedResponse<LayerGroup>> => {
    const queryParams = createQueryParams(params);
    return apiGet<PaginatedResponse<LayerGroup>>(`/layer-groups/?${queryParams.toString()}`);
};

/**
 * Get a single layer group by ID
 */
export const getLayerGroup = (id: number): Promise<LayerGroup> => {
    return apiGet<LayerGroup>(`/layer-groups/${id}/`);
};

/**
 * Create a new layer group
 */
export const createLayerGroup = (layerGroup: LayerGroupCreate): Promise<LayerGroup> => {
    return apiPost<LayerGroup>('/layer-groups/', layerGroup);
};

/**
 * Update a layer group
 */
export const updateLayerGroup = (id: number, layerGroup: LayerGroupUpdate): Promise<LayerGroup> => {
    return apiPut<LayerGroup>(`/layer-groups/${id}/`, layerGroup);
};

/**
 * Delete a layer group
 */
export const deleteLayerGroup = (id: number): Promise<void> => {
    return apiDelete<void>(`/layer-groups/${id}/`);
};

/**
 * Get features for a layer with pagination
 */
export const getFeatures = (
    layerId: number,
    page = 1
): Promise<PaginatedResponse<Feature>> => {
    return apiGet<PaginatedResponse<Feature>>(`/features/?layer_id=${layerId}&page=${page}`);
};

/**
 * Get a single feature by ID
 */
export const getFeature = (id: number): Promise<Feature> => {
    return apiGet<Feature>(`/features/${id}/`);
};

/**
 * Create a new feature
 */
export const createFeature = (feature: FeatureCreate): Promise<Feature> => {
    return apiPost<Feature>('/features/', feature);
};

/**
 * Update a feature
 */
export const updateFeature = (id: number, feature: FeatureUpdate): Promise<Feature> => {
    return apiPut<Feature>(`/features/${id}/`, feature);
};

/**
 * Delete a feature
 */
export const deleteFeature = (id: number): Promise<void> => {
    return apiDelete<void>(`/features/${id}/`);
};

// Export default as object with all methods
const layerService = {
    getLayers,
    getLayer,
    createLayer,
    updateLayer,
    patchLayer,
    deleteLayer,
    clearLayerData,
    getLayerData,
    exportLayerGeoJSON,
    importLayerGeoJSON,
    bufferLayer,
    uploadShapefile,
    getLayerGroups,
    getLayerGroup,
    createLayerGroup,
    updateLayerGroup,
    deleteLayerGroup,
    getFeatures,
    getFeature,
    createFeature,
    updateFeature,
    deleteFeature
};

export default layerService;