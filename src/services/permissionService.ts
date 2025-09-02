// src/services/permissionService.ts
import { apiGet, apiPost, apiPut, apiDelete } from './api';
import { PaginatedResponse } from '../types/common.types';

export interface LayerPermission {
    id: number;
    project_layer: number;
    client_project: number;
    can_view: boolean;
    can_edit: boolean;
    can_export: boolean;
    created_at: string;
    updated_at: string;
    // Expanded data for UI
    layer_name?: string;
    client_name?: string;
    project_name?: string;
}

export interface LayerPermissionCreate {
    project_layer: number;
    client_project: number;
    can_view: boolean;
    can_edit: boolean;
    can_export: boolean;
}

export interface LayerPermissionUpdate {
    can_view?: boolean;
    can_edit?: boolean;
    can_export?: boolean;
}

export interface LayerPermissionMatrix {
    layer_id: number;
    layer_name: string;
    clients: {
        client_id: number;
        client_name: string;
        client_project_id: number;
        permission_id?: number;
        can_view: boolean;
        can_edit: boolean;
        can_export: boolean;
    }[];
}

export const getLayerPermissions = (
    page = 1,
    projectId?: number,
    layerId?: number,
    clientId?: number
): Promise<PaginatedResponse<LayerPermission>> => {
    const params = new URLSearchParams({ page: page.toString() });
    if (projectId) params.append('project_id', projectId.toString());
    if (layerId) params.append('layer_id', layerId.toString());
    if (clientId) params.append('client_id', clientId.toString());
    
    return apiGet(`/api/v1/layer-permissions/?${params.toString()}`);
};

export const getLayerPermission = (id: number): Promise<LayerPermission> => {
    return apiGet(`/api/v1/layer-permissions/${id}/`);
};

export const createLayerPermission = (permission: LayerPermissionCreate): Promise<LayerPermission> => {
    return apiPost('/api/v1/layer-permissions/', permission);
};

export const updateLayerPermission = (id: number, permission: LayerPermissionUpdate): Promise<LayerPermission> => {
    return apiPut(`/api/v1/layer-permissions/${id}/`, permission);
};

export const deleteLayerPermission = (id: number): Promise<void> => {
    return apiDelete(`/api/v1/layer-permissions/${id}/`);
};

export const getLayerPermissionMatrix = (projectId: number): Promise<LayerPermissionMatrix[]> => {
    return apiGet(`/api/v1/projects/${projectId}/layer-permissions-matrix/`);
};

export const updateLayerPermissionMatrix = (
    projectId: number, 
    updates: Array<{
        layer_id: number;
        client_project_id: number;
        can_view: boolean;
        can_edit: boolean;
        can_export: boolean;
    }>
): Promise<{ success: boolean; updated_count: number }> => {
    return apiPost(`/api/v1/projects/${projectId}/layer-permissions-matrix/`, { updates });
};

export const bulkCreateLayerPermissions = (
    permissions: LayerPermissionCreate[]
): Promise<{ created: LayerPermission[]; errors: any[] }> => {
    return apiPost('/api/v1/layer-permissions/bulk-create/', { permissions });
};