// src/services/cbrsService.ts
import { apiGet } from './api';

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