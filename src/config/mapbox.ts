// src/config/constants.ts
/**
 * Application-wide constants
 */

// API version
export const API_VERSION = 'v1';

// Default map configuration
export const DEFAULT_MAP_CENTER: [number, number] = [0, 0];
export const DEFAULT_MAP_ZOOM = 2;
export const DEFAULT_MAX_ZOOM = 22;
export const DEFAULT_MIN_ZOOM = 0;

// Pagination limits
export const ITEMS_PER_PAGE = 10;
export const MAX_ITEMS_PER_PAGE = 100;

// File upload limits (in bytes)
export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
export const ALLOWED_FILE_TYPES = [
    '.geojson',
    '.json',
    '.zip',
    '.kml',
    '.kmz',
    '.csv',
    '.xlsx',
    '.xls',
    '.gpx',
];

// Default layer styles
export const POINT_LAYER_STYLE = {
    color: '#FF5500',
    radius: 6,
    opacity: 0.8,
    fillOpacity: 0.4,
};

export const LINE_LAYER_STYLE = {
    color: '#3388FF',
    weight: 3,
    opacity: 0.8,
};

export const POLYGON_LAYER_STYLE = {
    color: '#3388FF',
    fillColor: '#3388FF',
    weight: 2,
    opacity: 0.8,
    fillOpacity: 0.4,
};

// User roles
export const USER_ROLES = {
    ADMIN: 'admin',
    USER: 'user',
};

// Map tools
export const MAP_TOOLS = [
    {
        id: 'measure_distance',
        name: 'Measure Distance',
        icon: 'straighten',
    },
    {
        id: 'measure_area',
        name: 'Measure Area',
        icon: 'square_foot',
    },
    {
        id: 'draw',
        name: 'Draw',
        icon: 'edit',
    },
    {
        id: 'export',
        name: 'Export',
        icon: 'download',
    },
    {
        id: 'fullscreen',
        name: 'Fullscreen',
        icon: 'fullscreen',
    },
    {
        id: 'search',
        name: 'Search',
        icon: 'search',
    },
    {
        id: 'print',
        name: 'Print',
        icon: 'print',
    },
];

// Layer types
export const LAYER_TYPES = [
    {
        id: 1,
        name: 'Line Layer',
        description: 'For linear features like roads, rivers, or paths',
    },
    {
        id: 2,
        name: 'Point Layer',
        description: 'For point locations like addresses or landmarks',
    },
    {
        id: 3,
        name: 'Polygon Layer',
        description: 'For area features like boundaries or zones',
    },
    {
        id: 4,
        name: 'Raster Layer',
        description: 'For image-based data like satellite imagery',
    },
];

// Default map controls
export const DEFAULT_MAP_CONTROLS = {
    showZoomControl: true,
    showScaleControl: true,
    showLayerControl: true,
    showMeasureTools: true,
    showDrawingTools: true,
    showExportTools: true,
    showSearchControl: true,
    showAttributionControl: true,
    showCoordinateControl: true,
};

// Default map options
export const DEFAULT_MAP_OPTIONS = {
    enableClustering: true,
    clusterRadius: 80,
    enableGeolocate: true,
    enableFullscreen: true,
    enablePopups: true,
    popupOffset: 10,
    maxBounds: null,
};

// Analytics chart colors
export const CHART_COLORS = [
    '#1f77b4',
    '#ff7f0e',
    '#2ca02c',
    '#d62728',
    '#9467bd',
    '#8c564b',
    '#e377c2',
    '#7f7f7f',
    '#bcbd22',
    '#17becf',
];

// Available basemaps
export const AVAILABLE_BASEMAPS = [
    {
        id: 'streets',
        name: 'Streets',
        provider: 'mapbox',
        style: 'mapbox://styles/mapbox/streets-v11',
        preview_url: '/basemaps/streets.jpg',
    },
    {
        id: 'light',
        name: 'Light',
        provider: 'mapbox',
        style: 'mapbox://styles/mapbox/light-v10',
        preview_url: '/basemaps/light.jpg',
    },
    {
        id: 'dark',
        name: 'Dark',
        provider: 'mapbox',
        style: 'mapbox://styles/mapbox/dark-v10',
        preview_url: '/basemaps/dark.jpg',
    },
    {
        id: 'satellite',
        name: 'Satellite',
        provider: 'mapbox',
        style: 'mapbox://styles/mapbox/satellite-v9',
        preview_url: '/basemaps/satellite.jpg',
    },
    {
        id: 'satellite-streets',
        name: 'Satellite Streets',
        provider: 'mapbox',
        style: 'mapbox://styles/mapbox/satellite-streets-v11',
        preview_url: '/basemaps/satellite-streets.jpg',
    },
    {
        id: 'outdoors',
        name: 'Outdoors',
        provider: 'mapbox',
        style: 'mapbox://styles/mapbox/outdoors-v11',
        preview_url: '/basemaps/outdoors.jpg',
    },
    {
        id: 'osm',
        name: 'OpenStreetMap',
        provider: 'openstreetmap',
        url_template: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        preview_url: '/basemaps/osm.jpg',
    },
];

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

// src/config/mapbox.ts
/**
 * Mapbox configuration options
 */

// Mapbox configuration (would typically be set in .env files)
export const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || 'your-mapbox-token';

// Default Mapbox style URL
export const DEFAULT_MAPBOX_STYLE = 'mapbox://styles/mapbox/streets-v11';

// Mapbox rendering options
export const MAPBOX_RENDER_OPTIONS = {
    preserveDrawingBuffer: true, // Needed for map export functionality
    antialias: true,
};

// Mapbox geocoding options
export const MAPBOX_GEOCODER_OPTIONS = {
    accessToken: MAPBOX_ACCESS_TOKEN,
    placeholder: 'Search for a location...',
    proximity: 'ip', // Prioritize results by IP location
    countries: '', // Restrict results to specific countries, empty for worldwide
    types: '', // Restrict results to specific types (e.g. 'poi,address')
    bbox: [], // Bounding box to restrict results
    limit: 5, // Maximum number of results
};