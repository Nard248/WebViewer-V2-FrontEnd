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

            const countyLicenses = cbrsLicenses.filter(license => {
                const licenseName = license.county_name.toLowerCase().trim();
                const featureName = countyName.toLowerCase().trim();
                return licenseName === featureName ||
                    licenseName.includes(featureName) ||
                    featureName.includes(licenseName);
            });

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


