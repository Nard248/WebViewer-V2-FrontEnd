import * as L from 'leaflet';
import { createTowerIcon, createClusterIcon } from './icons';

/**
 * Icon pooling system to reuse Leaflet icons instead of creating new ones for each marker
 * This significantly improves performance by reducing DOM operations and memory usage
 */
interface IconPool {
  tower: { [companyName: string]: L.Icon };
  cluster: { [size: string]: L.DivIcon };
}

// Create a singleton icon pool
const iconPool: IconPool = {
  tower: {},
  cluster: {}
};

/**
 * Get a tower icon from the pool or create a new one if it doesn't exist
 * @param companyName The company name to determine icon style
 * @returns A Leaflet icon instance
 */
export const getTowerIcon = (companyName: string): L.Icon => {
  // Normalize company name to avoid unnecessary icon duplication
  const normalizedName = companyName.toLowerCase().trim();
  
  // Return from pool if exists
  if (iconPool.tower[normalizedName]) {
    return iconPool.tower[normalizedName];
  }
  
  // Create new icon and add to pool
  const icon = createTowerIcon(companyName) as L.Icon;
  iconPool.tower[normalizedName] = icon;
  return icon;
};

/**
 * Get a cluster icon from the pool or create a new one if it doesn't exist
 * @param cluster The cluster object from Leaflet.MarkerCluster
 * @returns A Leaflet div icon instance
 */
export const getClusterIcon = (cluster: any): L.DivIcon => {
  const count = cluster.getChildCount();
  const size = count < 10 ? 'small' : count < 100 ? 'medium' : 'large';
  
  // Create a unique key based on size and count
  const key = `${size}_${count}`;
  
  // Return from pool if exists
  if (iconPool.cluster[key]) {
    return iconPool.cluster[key];
  }
  
  // Create new icon and add to pool
  const icon = createClusterIcon(cluster);
  iconPool.cluster[key] = icon;
  return icon;
};

/**
 * Clear the icon pool to free memory
 * Call this when unmounting the map component
 */
export const clearIconPool = (): void => {
  iconPool.tower = {};
  iconPool.cluster = {};
};

export default {
  getTowerIcon,
  getClusterIcon,
  clearIconPool
};
