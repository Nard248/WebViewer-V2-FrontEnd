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

export const cbrsService = {
    getCBRSLicensesByState: (stateAbbr: string): Promise<CBRSLicense[]> => {
        return apiGet<CBRSLicense[]>(`/cbrs-licenses/?state_abbr=${stateAbbr}`);
    }
};