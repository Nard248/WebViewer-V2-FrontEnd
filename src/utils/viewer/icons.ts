import * as L from 'leaflet';
import { towerCompanyColors } from '../../constants/towerConstants';

export const createWiFiTowerSVG = (color: string, size: number = 32): string => {
    return `
        <svg width="${size}" height="${size}" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 2C10.477 2 6 6.477 6 12c0 7.2 10 18 10 18s10-10.8 10-18c0-5.523-4.477-10-10-10z" 
                  fill="${color}" stroke="white" stroke-width="1"/>
            <g transform="translate(16,12)">
                <rect x="-1" y="2" width="2" height="6" fill="white"/>
                <path d="M-6,-2 A8,8 0 0,1 6,-2" fill="none" stroke="white" stroke-width="1.5" opacity="0.9"/>
                <path d="M-4,-1 A5,5 0 0,1 4,-1" fill="none" stroke="white" stroke-width="1.5" opacity="0.9"/>
                <path d="M-2,0 A2.5,2.5 0 0,1 2,0" fill="none" stroke="white" stroke-width="1.5" opacity="0.9"/>
                <circle cx="0" cy="1" r="1" fill="white"/>
            </g>
        </svg>
    `;
};

export const createTowerIcon = (companyName: string): L.DivIcon => {
    const color = (towerCompanyColors as any)[companyName] || (towerCompanyColors as any)['Other'];
    const svgString = createWiFiTowerSVG(color);

    return L.divIcon({
        html: svgString,
        className: 'custom-tower-icon',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    });
};

export const createClusterIcon = (cluster: any): L.DivIcon => {
    const childCount = cluster.getChildCount();
    const ranges = [
        { range: [1, 50], color: '#00ff00' },
        { range: [50, 100], color: '#80ff00' },
        { range: [100, 200], color: '#ffff00' },
        { range: [200, 400], color: '#ffbf00' },
        { range: [400, 700], color: '#ff8000' },
        { range: [700, 1000], color: '#ff4000' },
        { range: [1000, 2000], color: '#ff0000' },
        { range: [2000, Infinity], color: '#800000' }
    ];

    const rangeMatch = ranges.find(r => childCount >= r.range[0] && childCount <= r.range[1]);
    const clusterColor = rangeMatch ? rangeMatch.color : '#333333';

    const getTextColor = (hexColor: string): string => {
        const r = parseInt(hexColor.substring(1, 3), 16);
        const g = parseInt(hexColor.substring(3, 5), 16);
        const b = parseInt(hexColor.substring(5, 7), 16);
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        return brightness > 125 ? 'black' : 'white';
    };

    const textColor = getTextColor(clusterColor);

    return L.divIcon({
        html: `
            <div style="
                display:flex; align-items:center; justify-content:center;
                width:40px; height:40px;
                border-radius:50%;
                background: radial-gradient(circle, ${clusterColor} 60%, rgba(255,255,255,0) 100%);
                color:${textColor};
                font-weight:bold;
            ">
                ${childCount}
            </div>
        `,
        className: 'marker-cluster'
    });
};


