// src/services/fccService.ts
import { apiGet, apiPost, createQueryParams } from './api';
import { PaginatedResponse } from '../types/common.types';

export interface FCCLocation {
    id: number;
    fcc_location_id: number;
    lat: number;
    long: number;
    state_name: string;
    county_name?: string;
    state_geoid?: number;
    county_geoid: number;
    geom: {
        type: 'Point';
        coordinates: [number, number];
    };
}

export interface FCCLocationFilters {
    state?: string;
    county_name?: string;
    search?: string;
    ordering?: string;
    page?: number;
    page_size?: number;
}

export interface BoundingBoxQuery {
    state?: string;
    bbox: [number, number, number, number]; // [west, south, east, north]
}

export interface BoundingBoxResponse {
    results: FCCLocation[];
    count: number;
    query_bounds: [number, number, number, number];
    state_filter?: string;
}

// Get FCC locations with pagination and filtering
export const getFCCLocations = (
    params: FCCLocationFilters = {}
): Promise<PaginatedResponse<FCCLocation>> => {
    const queryParams = createQueryParams(params);
    return apiGet<PaginatedResponse<FCCLocation>>(`/fcc-locations/?${queryParams.toString()}`);
};

// Get single FCC location
export const getFCCLocation = (id: number): Promise<FCCLocation> => {
    return apiGet<FCCLocation>(`/fcc-locations/${id}/`);
};

// Bounding box query for FCC locations
export const queryFCCLocationsByBoundingBox = (
    query: BoundingBoxQuery
): Promise<BoundingBoxResponse> => {
    console.log(`🔵 FCC Bounding Box Query:`, query);
    return apiPost<BoundingBoxResponse>('/fcc-query/bounding_box_query/', query);
};

// Get states summary
export const getFCCStatesSummary = (): Promise<{
    states: Array<{
        state_name: string;
        location_count: number;
        counties: Array<{
            county_name: string;
            county_geoid: number;
            location_count: number;
        }>;
    }>;
    total_locations: number;
}> => {
    return apiGet('/fcc-locations/states-summary/');
};

export const fccService = {
    getFCCLocations,
    getFCCLocation,
    queryFCCLocationsByBoundingBox,
    getFCCStatesSummary,
};