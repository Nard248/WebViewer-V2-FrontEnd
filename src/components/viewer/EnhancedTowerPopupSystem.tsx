
// src/components/viewer/EnhancedTowerPopupSystem.tsx

interface TowerProperties {
    lat?: string | number;
    lon?: string | number;
    county_display?: string;
    county_name?: string;
    state_fips?: string;
    county_fips?: string;
    overall_height_above_ground?: string | number;
    type_display?: string;
    english_type?: string;
    structure_type?: string;
    entity?: string;
    [key: string]: string | number | boolean | null | undefined;
}

interface BufferProperties {
    tower_id?: string | number;
    tower_name?: string;
    company?: string;
    radius?: string | number;
    tower_height?: string | number;
    lat?: string | number;
    lon?: string | number;
    [key: string]: string | number | boolean | null | undefined;
}

// Global storage for tower data to avoid embedding large objects in onclick
let towerDataStore: Map<string, any> = new Map();

// Global popup handler - single function for all popups
declare global {
    interface Window {
        handleTowerPopupAction: (action: string, towerId: string, layerName?: string, companyName?: string, layerId?: number) => void;
    }
}

// Create styled popup HTML for antenna towers
export const createTowerPopupHTML = (
    properties: TowerProperties,
    companyName?: string,
    layerName?: string,
    layerId?: number,
    isSelected?: boolean
): string => {
    // Create tower ID for selection management
    const towerId = `tower_${properties.lat}_${properties.lon}`;

    // Store tower data globally to avoid embedding in onclick
    towerDataStore.set(towerId, properties);

    // Format county display
    const formatCountyDisplay = (): string => {
        if (properties.county_display) {
            return properties.county_display.toString();
        }

        const countyName = properties.county_name || 'N/A';
        const stateFips = properties.state_fips || '';
        const countyFips = properties.county_fips || '';

        if (stateFips && countyFips) {
            return `${countyName} (${stateFips}${countyFips})`;
        }

        return countyName;
    };

    // Format type display
    const formatTypeDisplay = (): string => {
        if (properties.type_display) {
            return properties.type_display.toString();
        }

        const englishType = properties.english_type || 'Unknown';
        const structureType = properties.structure_type || 'None';

        return `${englishType} (${structureType})`;
    };

    // Safe value formatter
    const safeValue = (val: string | number | boolean | null | undefined, defaultVal: string = 'N/A'): string => {
        if (val === null || val === undefined || val === '') {
            return defaultVal;
        }
        return val.toString();
    };

    // Determine if this tower can be selected (not for selected towers layer)
    const canSelect = layerId !== -1 && !isSelected;
    const currentlySelected = isSelected || false;

    // Escape strings for HTML/JavaScript
    const escapeHtml = (str: string): string => {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    };

// Replace the popup button logic section (around line 110) with this:
    const popupHTML = `
    <style>
    .popup-container {
        font-family: Arial, sans-serif;
        max-width: 400px;
        position: relative;
    }
    
    .copy-btn {
        position: absolute;
        top: 5px;
        right: 5px;
        background-color: #4CAF50;
        color: white;
        border: none;
        padding: 4px 8px;
        border-radius: 3px;
        cursor: pointer;
        font-size: 12px;
        font-weight: bold;
        z-index: 1000;
    }
    
    .copy-btn:hover {
        background-color: #45a049;
    }

    .select-btn {
        position: absolute;
        top: 5px;
        right: ${currentlySelected ? '5px' : '60px'};
        background-color: ${currentlySelected ? '#FFD700' : '#2196F3'};
        color: ${currentlySelected ? '#333' : 'white'};
        border: none;
        padding: 4px 8px;
        border-radius: 3px;
        cursor: pointer;
        font-size: 12px;
        font-weight: bold;
        z-index: 1000;
    }
    
    .select-btn:hover {
        background-color: ${currentlySelected ? '#FFC107' : '#1976D2'};
    }
    
    .tower-table {
        width: 100%;
        border-collapse: collapse;
        font-family: Arial, sans-serif;
        margin-top: 20px;
    }
    
    .tower-table th, .tower-table td {
        border: 1px solid #ddd;
        padding: 10px;
        text-align: left;
        min-width: 120px;
    }
    
    .tower-table th {
        background-color: #2196F3;
        color: white;
        font-weight: bold;
    }
    
    .tower-table tr:nth-child(even) {
        background-color: #f2f2f2;
    }
    
    .tower-table tr:hover {
        background-color: #ddd;
    }
    
    .tower-table td {
        font-weight: normal;
    }
    
    .popup-header {
        font-weight: bold;
        font-size: 14px;
        color: #333;
        margin-bottom: 5px;
    }
    </style>

    <div class="popup-container">
        <!-- Always show copy button -->
        <button class="copy-btn" onclick="window.handleTowerPopupAction('copy', '${escapeHtml(towerId)}')">Copy</button>
        
        <!-- Show select/unselect button only for non-selected towers layer -->
        ${canSelect ? `<button class="select-btn" onclick="window.handleTowerPopupAction('toggle', '${escapeHtml(towerId)}', '${escapeHtml(layerName || 'Unknown Layer')}', '${escapeHtml(companyName || 'Unknown Company')}', ${layerId || 0})">${currentlySelected ? 'Unselect' : 'Select'}</button>` : ''}
        
        <!-- Show selected status for towers in Selected Towers layer -->
        ${currentlySelected && layerId === -1 ? `<button class="select-btn" onclick="window.handleTowerPopupAction('toggle', '${escapeHtml(towerId)}', '${escapeHtml(layerName || 'Unknown Layer')}', '${escapeHtml(companyName || 'Unknown Company')}', ${layerId || 0})">Unselect</button>` : ''}
        
        <div class="popup-header">
            ${layerName === 'Selected Towers' ? 'Selected ' : ''}FCC Tower Information
        </div>
        
        <table class='tower-table'>
            <tr><td><b>Latitude</b></td><td>${safeValue(properties.lat)}</td></tr>
            <tr><td><b>Longitude</b></td><td>${safeValue(properties.lon)}</td></tr>
            <tr><td><b>County Name</b></td><td>${formatCountyDisplay()}</td></tr>
            <tr><td><b>Overall Height Above Ground (Meters)</b></td><td>${safeValue(properties.overall_height_above_ground)}</td></tr>
            <tr><td><b>Type</b></td><td>${formatTypeDisplay()}</td></tr>
            <tr><td><b>Owner</b></td><td>${safeValue(properties.entity)}</td></tr>
            ${companyName ? `<tr><td><b>Company</b></td><td>${companyName}</td></tr>` : ''}
            ${layerName ? `<tr><td><b>Layer</b></td><td>${layerName}</td></tr>` : ''}
        </table>
    </div>
    `;

    return popupHTML;
};

// Initialize the global popup handler
export const initializeTowerPopupHandler = () => {
    window.handleTowerPopupAction = (action: string, towerId: string, layerName?: string, companyName?: string, layerId?: number) => {
        try {
            if (action === 'copy') {
                handleCopyAction(towerId);
            } else if (action === 'toggle') {
                handleToggleAction(towerId, layerName, companyName, layerId);
            }
        } catch (error) {
            console.error('Error handling popup action:', error);
        }
    };
};

// Handle copy action
// const handleCopyAction = (towerId: string) => {
//     const table = document.querySelector('.tower-table');
//     if (!table) return;
//
//     let textContent = 'FCC Tower Information\n\n';
//     const rows = table.querySelectorAll('tr');
//
//     rows.forEach(row => {
//         const cells = row.querySelectorAll('td');
//         if (cells.length >= 2) {
//             const label = cells[0].textContent?.trim() || '';
//             const value = cells[1].textContent?.trim() || '';
//             textContent += label + ': ' + value + '\n';
//         }
//     });
//
//     // Try to copy to clipboard
//     if (navigator.clipboard && navigator.clipboard.writeText) {
//         navigator.clipboard.writeText(textContent).then(() => {
//             const btn = document.querySelector('.copy-btn') as HTMLButtonElement;
//             if (btn) {
//                 const originalText = btn.textContent;
//                 btn.textContent = 'Copied!';
//                 setTimeout(() => {
//                     btn.textContent = originalText;
//                 }, 2000);
//             }
//         }).catch(err => {
//             console.error('Failed to copy:', err);
//             fallbackCopy(textContent);
//         });
//     } else {
//         fallbackCopy(textContent);
//     }
// };
const handleCopyAction = (towerId: string) => {
    const towerData = towerDataStore.get(towerId);
    if (!towerData) {
        console.error('No tower data found for ID:', towerId);
        return;
    }

    const copyText = `Tower Information:
Latitude: ${towerData.lat || 'N/A'}
Longitude: ${towerData.lon || 'N/A'}
County: ${towerData.county_display || towerData.county_name || 'N/A'}
Height: ${towerData.overall_height_above_ground || 'N/A'}m
Type: ${towerData.type_display || towerData.english_type || 'N/A'}
Owner: ${towerData.entity || 'N/A'}`;

    navigator.clipboard.writeText(copyText).then(() => {
        console.log('Tower data copied to clipboard');
        // Could add a toast notification here
    }).catch(err => {
        console.error('Failed to copy tower data:', err);
    });
};


// Handle toggle selection action
const handleToggleAction = (towerId: string, layerName?: string, companyName?: string, layerId?: number) => {
    const towerData = towerDataStore.get(towerId);
    if (!towerData) {
        console.error('No tower data found for ID:', towerId);
        return;
    }

    // Get selected towers manager from global scope
    const manager = (window as any).selectedTowersManager;
    if (!manager) {
        console.error('SelectedTowersManager not found on window object');
        return;
    }

    // Extract coordinates from tower data
    const lat = parseFloat(towerData.lat?.toString() || '0');
    const lng = parseFloat(towerData.lon?.toString() || '0');

    if (lat === 0 || lng === 0) {
        console.error('Invalid coordinates for tower:', towerData);
        return;
    }

    const coordinates: [number, number] = [lat, lng];

    // Toggle tower selection
    const isSelected = manager.toggleTower(
        towerId,
        towerData,
        coordinates,
        layerName || 'Unknown Layer',
        companyName || 'Unknown Company',
        layerId || 0
    );

    console.log(`Tower ${towerId} ${isSelected ? 'selected' : 'unselected'}`);
};



// Fallback copy method
const fallbackCopy = (textContent: string) => {
    const textArea = document.createElement('textarea');
    textArea.value = textContent;
    document.body.appendChild(textArea);
    textArea.select();

    try {
        document.execCommand('copy');
        const btn = document.querySelector('.copy-btn') as HTMLButtonElement;
        if (btn) {
            btn.textContent = 'Copied!';
            setTimeout(() => {
                btn.textContent = 'Copy';
            }, 2000);
        }
    } catch (err) {
        console.error('Fallback copy failed:', err);
    }

    document.body.removeChild(textArea);
};

// Helper function to determine if a layer is an antenna/tower layer
export const isAntennaLayer = (layerName: string): boolean => {
    const antennaKeywords = ['antenna', 'tower', 'fcc tower'];
    const lowerName = layerName.toLowerCase();
    return antennaKeywords.some(keyword => lowerName.includes(keyword));
};

// Get tower company from layer name
export const getTowerCompanyFromLayerName = (layerName: string): string => {
    const lowerName = layerName.toLowerCase();

    if (lowerName.includes('american tower')) return 'American Towers';
    if (lowerName.includes('sba')) return 'SBA';
    if (lowerName.includes('crown castle')) return 'Crown Castle';
    if (lowerName.includes('other')) return 'Other';

    // Default fallback
    return 'FCC Tower';
};

// Create styled popup HTML for antenna buffers
// Create styled popup HTML for antenna buffers
export const createBufferPopupHTML = (
    properties: BufferProperties,
    distance: number,
    companyName: string
): string => {
    const safeValue = (val: string | number | boolean | null | undefined, defaultVal: string = 'N/A'): string => {
        if (val === null || val === undefined || val === '') {
            return defaultVal;
        }
        return val.toString();
    };

    // Create a unique ID for the buffer popup
    const bufferId = `buffer_${properties.lat}_${properties.lon}_${distance}mi`;

    const popupHTML = `
    <style>
    .popup-container {
        font-family: Arial, sans-serif;
        max-width: 400px;
        position: relative;
    }
    
    .copy-btn {
        position: absolute;
        top: 5px;
        right: 5px;
        background-color: #4CAF50;
        color: white;
        border: none;
        padding: 4px 8px;
        border-radius: 3px;
        cursor: pointer;
        font-size: 12px;
        font-weight: bold;
        z-index: 1000;
    }
    
    .copy-btn:hover {
        background-color: #45a049;
    }
    
    .buffer-table {
        width: 100%;
        border-collapse: collapse;
        font-family: Arial, sans-serif;
        margin-top: 20px;
    }
    
    .buffer-table th, .buffer-table td {
        border: 1px solid #ddd;
        padding: 10px;
        text-align: left;
        min-width: 120px;
    }
    
    .buffer-table th {
        background-color: #FF9800;
        color: white;
        font-weight: bold;
    }
    
    .buffer-table tr:nth-child(even) {
        background-color: #f2f2f2;
    }
    
    .buffer-table tr:hover {
        background-color: #ddd;
    }
    
    .buffer-table td {
        font-weight: normal;
    }
    
    .popup-header {
        font-weight: bold;
        font-size: 14px;
        color: #333;
        margin-bottom: 5px;
    }
    </style>

    <div class="popup-container">
        <button class="copy-btn" onclick="window.handleTowerPopupAction('copy', '${bufferId}')">Copy</button>
        
        <div class="popup-header">
            ${distance} Mile Buffer Zone - ${companyName}
        </div>
        
        <table class='buffer-table'>
            <tr><td><b>Buffer Distance</b></td><td>${distance} miles</td></tr>
            <tr><td><b>Center Latitude</b></td><td>${safeValue(properties.lat)}</td></tr>
            <tr><td><b>Center Longitude</b></td><td>${safeValue(properties.lon)}</td></tr>
            <tr><td><b>Company</b></td><td>${companyName}</td></tr>
            <tr><td><b>Tower Height (Meters)</b></td><td>${safeValue(properties.overall_height_above_ground || properties.tower_height)}</td></tr>
            <tr><td><b>Tower Owner</b></td><td>${safeValue(properties.entity || properties.tower_name)}</td></tr>
        </table>
    </div>
    `;

    return popupHTML;
};

// Clear tower data store (call this when needed to prevent memory leaks)
export const clearTowerDataStore = () => {
    towerDataStore.clear();
};