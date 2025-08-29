import * as L from 'leaflet';
import * as turf from '@turf/turf';
import { createCBRSPopupHTML } from '../../components/viewer/CBRSPopupSystem';
import { CBRSLicense } from '../../services/cbrsService';

export const createCountyLabelsLayer = (
    layerId: number,
    data: any,
    cbrsLicenses: CBRSLicense[]
): L.LayerGroup => {
    const countyLabelsGroup = L.layerGroup();
    
    console.log(`🗂️ Creating county labels layer with ${cbrsLicenses.length} CBRS licenses available`);
    if (cbrsLicenses.length > 0) {
        console.log(`📋 Sample CBRS license:`, cbrsLicenses[0]);
        console.log(`📋 First 5 license FIPS codes:`, cbrsLicenses.slice(0, 5).map(l => l.county_fips));
    }

    // Log sample county feature to see available properties
    if (data.features.length > 0) {
        console.log(`🗺️ Sample county feature properties:`, data.features[0].properties);
    }

    data.features.forEach((feature: any) => {
        if (!feature.geometry) return;

        const countyName = feature.properties?.NAME ||
            feature.properties?.name ||
            feature.properties?.county_name ||
            feature.properties?.COUNTY ||
            feature.properties?.County ||
            feature.properties?.NAMELSAD ||
            feature.properties?.COUNTYNAME ||
            `County ${feature.properties?.FIPS || 'Unknown'}`;

        try {
            let centroid: any;
            if (feature.geometry.type === 'Polygon') {
                centroid = turf.centroid(feature);
            } else if (feature.geometry.type === 'MultiPolygon') {
                const polygons = feature.geometry.coordinates;
                const largestPolygon = polygons.reduce((largest: any, current: any) =>
                    current[0].length > largest[0].length ? current : largest
                );
                centroid = turf.centroid({
                    type: 'Polygon',
                    coordinates: largestPolygon
                } as any);
            } else {
                return;
            }

            const [lng, lat] = centroid.geometry.coordinates;

            // Extract GEOID from feature properties to match with county_fips
            // Priority: geoid, GEOID, then fallback to other FIPS fields
            const featureGeoid = feature.properties?.geoid || 
                                feature.properties?.GEOID || 
                                feature.properties?.fips ||
                                feature.properties?.FIPS ||
                                feature.properties?.county_fips ||
                                feature.properties?.COUNTY_FIPS;

            console.log(`🏛️ County: ${countyName}, GEOID: ${featureGeoid}`);
            console.log(`📄 County feature properties:`, feature.properties);

            const countyLicenses = cbrsLicenses.filter(license => {
                // Primary matching: Use GEOID to match with county_fips
                if (featureGeoid && license.county_fips) {
                    // Normalize both values to ensure consistent comparison
                    const normalizedGeoid = featureGeoid.toString().trim();
                    const normalizedLicenseFips = license.county_fips.toString().trim();
                    
                    console.log(`🔍 Comparing GEOID to county_fips: County GEOID '${normalizedGeoid}' vs License county_fips '${normalizedLicenseFips}'`);
                    
                    // Direct comparison - both should be 5-digit FIPS codes
                    if (normalizedGeoid === normalizedLicenseFips) {
                        console.log(`✅ GEOID match found for ${countyName} - License: ${license.channel} by ${license.bidder}`);
                        return true;
                    }
                    
                    // Handle case where one might be padded and other isn't
                    const paddedGeoid = normalizedGeoid.padStart(5, '0');
                    const paddedLicenseFips = normalizedLicenseFips.padStart(5, '0');
                    
                    if (paddedGeoid === paddedLicenseFips) {
                        console.log(`✅ GEOID match found (after padding) for ${countyName} - License: ${license.channel} by ${license.bidder}`);
                        return true;
                    }
                }
                
                // Fallback: Use county name matching if FIPS is not available
                const licenseName = license.county_name.toLowerCase().trim();
                const featureName = countyName.toLowerCase().trim();
                
                // Remove "County" suffix for better matching
                const cleanLicenseName = licenseName.replace(/\s+county$/i, '');
                const cleanFeatureName = featureName.replace(/\s+county$/i, '');
                
                const nameMatch = cleanLicenseName === cleanFeatureName ||
                    licenseName === featureName ||
                    licenseName.includes(featureName) ||
                    featureName.includes(licenseName);
                    
                if (nameMatch) {
                    console.log(`📝 Name match found for ${countyName} - License: ${license.channel} by ${license.bidder}`);
                }
                
                return nameMatch;
            });

            console.log(`🎯 Found ${countyLicenses.length} CBRS licenses for ${countyName}`);
            if (countyLicenses.length > 0) {
                console.log(`📝 Licenses:`, countyLicenses.map(l => `${l.channel} - ${l.bidder}`));
            }

            const cbrsPopupHTML = createCBRSPopupHTML(countyLicenses, countyName);

            const textLength = countyName.length;
            const approximateWidth = Math.max(textLength * 8, 80);
            const offsetLeft = approximateWidth / 2;
            const offsetUp = 10;

            const countyLabel = L.marker([lat, lng], {
                icon: L.divIcon({
                    className: 'county-label-clickable',
                    html: `<div style="
                            font-size: 14px;
                            font-weight: bold;
                            text-shadow: -1px -1px 0 white, 1px -1px 0 white, -1px 1px 0 white, 1px 1px 0 white;
                            text-align: center;
                            pointer-events: auto;
                            padding: 0;
                            white-space: nowrap;
                            width: auto;
                        " 
                        onmouseover="this.style.textShadow='-2px -2px 0 white, 2px -2px 0 white, -2px 2px 0 white, 2px 2px 0 white'; this.style.transform='scale(1.1)'" 
                        onmouseout="this.style.textShadow='-1px -1px 0 white, 1px -1px 0 white, -1px 1px 0 white, 1px 1px 0 white'; this.style.transform='scale(1)'"
                        title="Click to view CBRS licenses for ${countyName}">${countyName}</div>`,
                    iconSize: [approximateWidth, 20],
                    iconAnchor: [offsetLeft, offsetUp],
                    popupAnchor: [0, 0]
                }),
                pane: 'markerPane'
            });

            countyLabel.bindPopup(cbrsPopupHTML, {
                maxWidth: 650,
                maxHeight: 450,
                className: 'cbrs-popup'
            });

            countyLabelsGroup.addLayer(countyLabel);
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Error processing county centroid for:', countyName, error);
        }
    });

    return countyLabelsGroup;
};


