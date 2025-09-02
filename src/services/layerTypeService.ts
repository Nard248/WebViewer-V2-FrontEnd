// src/services/layerTypeService.ts
import { apiGet, apiPost, apiPut, apiDelete } from './api';
import { PaginatedResponse } from '../types/common.types';

export interface LayerType {
    id: number;
    type_name: string;
    description?: string;
    default_style?: Record<string, any>;
    icon_type?: string;
    icon_options?: Record<string, any>;
    is_system: boolean;
    created_at: string;
    updated_at: string;
}

export interface LayerTypeCreate {
    type_name: string;
    description?: string;
    default_style?: Record<string, any>;
    icon_type?: string;
    icon_options?: Record<string, any>;
}

export interface LayerTypeUpdate {
    type_name?: string;
    description?: string;
    default_style?: Record<string, any>;
    icon_type?: string;
    icon_options?: Record<string, any>;
}

export const getLayerTypes = (
    page = 1,
    search?: string,
    ordering = '-created_at'
): Promise<PaginatedResponse<LayerType>> => {
    const params = new URLSearchParams({ 
        page: page.toString(),
        ordering 
    });
    if (search) params.append('search', search);
    
    return apiGet(`/api/v1/layer-types/?${params.toString()}`);
};

export const getLayerType = (id: number): Promise<LayerType> => {
    return apiGet(`/api/v1/layer-types/${id}/`);
};

export const createLayerType = (layerType: LayerTypeCreate): Promise<LayerType> => {
    return apiPost('/api/v1/layer-types/', layerType);
};

export const updateLayerType = (id: number, layerType: LayerTypeUpdate): Promise<LayerType> => {
    return apiPut(`/api/v1/layer-types/${id}/`, layerType);
};

export const deleteLayerType = (id: number): Promise<void> => {
    return apiDelete(`/api/v1/layer-types/${id}/`);
};