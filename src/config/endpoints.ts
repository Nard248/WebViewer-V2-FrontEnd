// src/config/endpoints.ts
import { API_VERSION } from './constants';

/**
 * API endpoints for the application
 */
const BASE_API_PATH = `/api/${API_VERSION}`;

export const ENDPOINTS = {
    // Auth
    AUTH: {
        LOGIN: `${BASE_API_PATH}/auth/login/`,
        LOGOUT: `${BASE_API_PATH}/auth/logout/`,
        REFRESH: `${BASE_API_PATH}/auth/refresh/`,
        FORGOT_PASSWORD: `${BASE_API_PATH}/auth/password/reset/`,
        RESET_PASSWORD: `${BASE_API_PATH}/auth/password/reset/confirm/`,
    },

    // Users
    USERS: {
        LIST: `${BASE_API_PATH}/users/`,
        DETAIL: (id: number) => `${BASE_API_PATH}/users/${id}/`,
        ME: `${BASE_API_PATH}/users/me/`,
        CHANGE_PASSWORD: (id: number) => `${BASE_API_PATH}/users/${id}/change_password/`,
        ACTIVITY: (id: number) => `${BASE_API_PATH}/users/${id}/activity/`,
    },

    // Projects
    PROJECTS: {
        LIST: `${BASE_API_PATH}/projects/`,
        DETAIL: (id: number) => `${BASE_API_PATH}/projects/${id}/`,
        CLONE: (id: number) => `${BASE_API_PATH}/projects/${id}/clone/`,
        STATS: (id: number) => `${BASE_API_PATH}/projects/${id}/stats/`,
        CONSTRUCTOR: (id: number) => `${BASE_API_PATH}/constructor/${id}/`,
        STANDALONE: (hash: string) => `${BASE_API_PATH}/standalone/${hash}/`,
    },

    // Layers
    LAYERS: {
        LIST: `${BASE_API_PATH}/layers/`,
        DETAIL: (id: number) => `${BASE_API_PATH}/layers/${id}/`,
        CLEAR_DATA: (id: number) => `${BASE_API_PATH}/layers/${id}/clear_data/`,
        BUFFER: (id: number) => `${BASE_API_PATH}/layers/${id}/buffer/`,
        EXPORT_GEOJSON: (id: number) => `${BASE_API_PATH}/layers/${id}/export_geojson/`,
        IMPORT_GEOJSON: (id: number) => `${BASE_API_PATH}/layers/${id}/import_geojson/`,
        UPLOAD_SHAPEFILE: (id: number) => `${BASE_API_PATH}/layers/${id}/upload_shapefile/`,
    },

    // Layer Groups
    LAYER_GROUPS: {
        LIST: `${BASE_API_PATH}/layer-groups/`,
        DETAIL: (id: number) => `${BASE_API_PATH}/layer-groups/${id}/`,
    },

    // Layer Data
    DATA: {
        GET: (layerId: number) => `${BASE_API_PATH}/data-fast/${layerId}/`,
    },

    // Features
    FEATURES: {
        LIST: `${BASE_API_PATH}/features/`,
        DETAIL: (id: number) => `${BASE_API_PATH}/features/${id}/`,
    },

    // Basemaps
    BASEMAPS: {
        LIST: `${BASE_API_PATH}/basemaps/`,
        DETAIL: (id: number) => `${BASE_API_PATH}/basemaps/${id}/`,
        TEST_CONNECTION: (id: number) => `${BASE_API_PATH}/basemaps/${id}/test_connection/`,
        UPLOAD_PREVIEW: (id: number) => `${BASE_API_PATH}/basemaps/${id}/upload_preview/`,
    },

    // Project Basemaps
    PROJECT_BASEMAPS: {
        LIST: `${BASE_API_PATH}/project-basemaps/`,
        BATCH_UPDATE: `${BASE_API_PATH}/project-basemaps/batch_update/`,
    },

    // Map Tools
    MAP_TOOLS: {
        LIST: `${BASE_API_PATH}/map-tools/`,
        DETAIL: (id: number) => `${BASE_API_PATH}/map-tools/${id}/`,
        CODE: (id: number) => `${BASE_API_PATH}/map-tools/${id}/code/`,
    },

    // Project Tools
    PROJECT_TOOLS: {
        LIST: `${BASE_API_PATH}/project-tools/`,
        BATCH_UPDATE: `${BASE_API_PATH}/project-tools/batch_update/`,
    },

    // Clients
    CLIENTS: {
        LIST: `${BASE_API_PATH}/clients/`,
        DETAIL: (id: number) => `${BASE_API_PATH}/clients/${id}/`,
        USERS: (id: number) => `${BASE_API_PATH}/clients/${id}/users/`,
        PROJECTS: (id: number) => `${BASE_API_PATH}/clients/${id}/projects/`,
        ANALYTICS: (id: number) => `${BASE_API_PATH}/clients/${id}/analytics/`,
    },

    // Client Projects
    CLIENT_PROJECTS: {
        LIST: `${BASE_API_PATH}/client-projects/`,
        RECORD_ACCESS: (id: number) => `${BASE_API_PATH}/client-projects/${id}/record_access/`,
        BATCH_ASSIGN: `${BASE_API_PATH}/client-projects/batch_assign/`,
    },

    // Styling
    STYLES: {
        LIST: `${BASE_API_PATH}/styles/`,
        DETAIL: (id: number) => `${BASE_API_PATH}/styles/${id}/`,
        APPLY_TO_LAYER: (id: number) => `${BASE_API_PATH}/styles/${id}/apply_to_layer/`,
        GENERATE_CATEGORIZED: (id: number) => `${BASE_API_PATH}/styles/${id}/generate_categorized/`,
    },

    // Color Palettes
    COLOR_PALETTES: {
        LIST: `${BASE_API_PATH}/color-palettes/`,
        DETAIL: (id: number) => `${BASE_API_PATH}/color-palettes/${id}/`,
    },

    // Popup Templates
    POPUP_TEMPLATES: {
        LIST: `${BASE_API_PATH}/popup-templates/`,
        DETAIL: (id: number) => `${BASE_API_PATH}/popup-templates/${id}/`,
        PREVIEW: (id: number) => `${BASE_API_PATH}/popup-templates/${id}/preview/`,
    },

    // Layer Functions
    LAYER_FUNCTIONS: {
        LIST: `${BASE_API_PATH}/layer-functions/`,
        DETAIL: (id: number) => `${BASE_API_PATH}/layer-functions/${id}/`,
        CODE: (id: number) => `${BASE_API_PATH}/layer-functions/${id}/code/`,
        EXECUTE: (id: number) => `${BASE_API_PATH}/layer-functions/${id}/execute/`,
    },

    // Project Layer Functions
    PROJECT_LAYER_FUNCTIONS: {
        LIST: `${BASE_API_PATH}/project-layer-functions/`,
        DETAIL: (id: number) => `${BASE_API_PATH}/project-layer-functions/${id}/`,
    },

    // Markers
    MARKERS: {
        LIST: `${BASE_API_PATH}/markers/`,
        DETAIL: (id: number) => `${BASE_API_PATH}/markers/${id}/`,
        UPLOAD_SVG: `${BASE_API_PATH}/markers/upload_svg/`,
    },

    // Analytics
    ANALYTICS: {
        DASHBOARD: `${BASE_API_PATH}/analytics/dashboard/`,
        PROJECT_USAGE: (id: number) => `${BASE_API_PATH}/analytics/projects/${id}/usage/`,
        LAYER_USAGE: (id: number) => `${BASE_API_PATH}/analytics/layers/${id}/usage/`,
        USER_ACTIVITY: `${BASE_API_PATH}/analytics/users/activity/`,
    },
};