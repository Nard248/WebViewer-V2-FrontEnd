// src/services/cbrsService.ts
import { apiGet, apiPost, apiPut, apiDelete, createQueryParams } from './api';
import { PaginatedResponse } from '../types/common.types';

export interface CBRSLicense {
    id: number;
    county_fips: string;
    county_name: string;
    state_abbr: string;
    channel: string;
    bidder: string;
    license_date: string | null;
    frequency_mhz: number | null;
    created_at: string | null;
    updated_at: string | null;
}

export interface CBRSCountyData {
    county_fips: string;
    county_name: string;
    state_abbr: string;
    licenses: CBRSLicense[];
}

export interface CBRSStateResponse {
    state_abbr: string;
    total_counties: number;
    total_licenses: number;
    counties: CBRSCountyData[];
}

export interface CBRSLicenseCreate {
    county_fips: string;
    county_name: string;
    state_abbr: string;
    channel: string;
    bidder: string;
    license_date?: string;
    frequency_mhz?: number;
}

export interface CBRSLicenseUpdate {
    county_fips?: string;
    county_name?: string;
    state_abbr?: string;
    channel?: string;
    bidder?: string;
    license_date?: string;
    frequency_mhz?: number;
}

// Full CRUD operations for CBRS Licenses
export const getCBRSLicenses = (
    params: Record<string, unknown> = {}
): Promise<PaginatedResponse<CBRSLicense>> => {
    const queryParams = createQueryParams(params);
    return apiGet<PaginatedResponse<CBRSLicense>>(`/cbrs-licenses/?${queryParams.toString()}`);
};

export const getCBRSLicense = (id: number): Promise<CBRSLicense> => {
    return apiGet<CBRSLicense>(`/cbrs-licenses/${id}/`);
};

export const createCBRSLicense = (license: CBRSLicenseCreate): Promise<CBRSLicense> => {
    return apiPost<CBRSLicense>('/cbrs-licenses/', license);
};

export const updateCBRSLicense = (id: number, license: CBRSLicenseUpdate): Promise<CBRSLicense> => {
    return apiPut<CBRSLicense>(`/cbrs-licenses/${id}/`, license);
};

export const deleteCBRSLicense = (id: number): Promise<void> => {
    return apiDelete<void>(`/cbrs-licenses/${id}/`);
};

export const bulkCreateCBRSLicenses = (licenses: CBRSLicenseCreate[]): Promise<{ created: CBRSLicense[]; errors: any[] }> => {
    return apiPost<{ created: CBRSLicense[]; errors: any[] }>('/cbrs-licenses/bulk-create/', { licenses });
};

export const cbrsService = {
    getCBRSLicensesByState: async (stateAbbr: string): Promise<CBRSLicense[]> => {
        console.log(`🔵 Fetching CBRS licenses for state: ${stateAbbr}`);
        console.log(`📡 CBRS API URL: /cbrs-licenses/by_state_abbr/?state_abbr=${stateAbbr}`);
        
        try {
            const response = await apiGet<CBRSStateResponse>(`/cbrs-licenses/by_state_abbr/?state_abbr=${stateAbbr}`);
            
            console.log(`✅ CBRS Response received:`, {
                state: response.state_abbr,
                totalCounties: response.total_counties,
                totalLicenses: response.total_licenses,
                countiesWithData: response.counties.length
            });
            
            // Flatten all licenses from all counties into a single array
            const allLicenses: CBRSLicense[] = [];
            response.counties.forEach(county => {
                console.log(`📍 County ${county.county_name} (FIPS: ${county.county_fips}): ${county.licenses.length} licenses`);
                allLicenses.push(...county.licenses);
            });
            
            console.log(`📊 Total licenses extracted: ${allLicenses.length}`);
            if (allLicenses.length > 0) {
                console.log(`📋 Sample license:`, allLicenses[0]);
            }
            
            return allLicenses;
        } catch (error) {
            console.error(`❌ Error fetching CBRS licenses:`, error);
            throw error;
        }
    }
};