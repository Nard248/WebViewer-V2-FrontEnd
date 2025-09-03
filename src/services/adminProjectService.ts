// src/services/adminProjectService.ts
import { apiGet, createQueryParams } from './api';

// Admin Project interfaces based on the API documentation
export interface AdminProjectCard {
    id: number;
    name: string;
    state_abbr: string;
    state_name: string;
    project_type: string;
    is_public: boolean;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    assigned_clients: {
        id: number;
        name: string;
    }[];
    layer_groups_count: number;
    total_layers_count: number;
    total_features_count: number;
}

export interface AdminProjectDetail extends AdminProjectCard {
    description?: string;
    default_center_lat?: number;
    default_center_lng?: number;
    default_zoom_level?: number;
    max_zoom?: number;
    min_zoom?: number;
    map_controls?: Record<string, any>;
    map_options?: Record<string, any>;
    public_access_token?: string;
    creator_info: {
        id: number;
        username: string;
        full_name: string;
        email: string;
    };
    assigned_clients: {
        client_id: number;
        client_name: string;
        access_level: string;
        unique_link: string;
        created_at: string;
        expires_at?: string;
        last_accessed?: string;
        users: {
            id: number;
            username: string;
            full_name: string;
            email: string;
            client_role: string;
        }[];
    }[];
    layer_groups: {
        id: number;
        name: string;
        display_order: number;
        is_visible_by_default: boolean;
        is_expanded_by_default: boolean;
        created_at: string;
        updated_at: string;
        layers: {
            id: number;
            name: string;
            description?: string;
            layer_type: string;
            feature_count: number;
            is_visible_by_default: boolean;
            is_public: boolean;
            created_at: string;
            updated_at: string;
            last_data_update?: string;
            functions: {
                id: number;
                name: string;
                function_type: string;
                enabled: boolean;
                priority: number;
            }[];
        }[];
    }[];
    project_functions: {
        id: number;
        name: string;
        description?: string;
        function_type: string;
        is_system: boolean;
        created_at: string;
    }[];
    stats: {
        layer_groups_count: number;
        total_layers: number;
        public_layers: number;
        total_features: number;
        total_functions: number;
        active_functions: number;
    };
}

export interface AdminProjectFilters {
    assignment?: string;
    state?: string;
    type?: string;
    is_public?: string;
    is_active?: string;
    ordering?: string;
}

export interface AdminProjectsPaginatedResponse {
    results: AdminProjectCard[];
    pagination: {
        total_count: number;
        page: number;
        page_size: number;
        total_pages: number;
        has_next: boolean;
        has_previous: boolean;
    };
}

/**
 * Get admin projects list with pagination and filtering
 */
export const getAdminProjects = async (
    filters: AdminProjectFilters = {},
    page: number = 1,
    pageSize: number = 20
): Promise<AdminProjectsPaginatedResponse> => {
    const params = {
        page: page.toString(),
        page_size: pageSize.toString(),
        ordering: filters.ordering || '-updated_at',
        ...filters
    };

    const queryParams = createQueryParams(params);
    return apiGet<AdminProjectsPaginatedResponse>(`/admin/projects/?${queryParams.toString()}`);
};

/**
 * Get detailed admin project information
 */
export const getAdminProjectDetail = async (id: number): Promise<AdminProjectDetail> => {
    return apiGet<AdminProjectDetail>(`/admin/projects/${id}/`);
};

// Export all functions as default
const adminProjectService = {
    getAdminProjects,
    getAdminProjectDetail,
};

export default adminProjectService;