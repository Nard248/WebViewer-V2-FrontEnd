// src/constants/towerConstants.ts
// Tower-related constants for the viewer system

export const towerCompanyColors = {
    'American Towers': '#dc3545', // red
    'SBA': '#6f42c1', // purple
    'Crown Castle': '#fd7e14', // orange
    'Selected': '#FFD700', // gold for selected towers
    'Other': '#0d6efd' // blue
} as const;

export type TowerCompany = keyof typeof towerCompanyColors;

// Additional tower-related constants can go here
export const towerConstants = {
    defaultIconSize: 32,
    selectedIconSize: 36,
    clusteringZoomThreshold: 11,
} as const;