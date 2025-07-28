import * as L from 'leaflet';
import { LayerFactory } from '../factories';
import { IMapLayer } from '../../interfaces/IMapLayer';
import projectService from '../../services/projectService';
import mapService from '../../services/mapService';

interface BasemapInfo {
  id: number;
  name: string;
  url_template: string;
  provider: string;
  options?: Record<string, any>;
  is_default?: boolean;
}

interface ProjectConstructor {
  project: {
    default_center_lat: number;
    default_center_lng: number;
    default_zoom_level: number;
  };
  layer_groups?: { layers: any[] }[];
  basemaps?: BasemapInfo[];
}

export default class ProjectController {
  private map: L.Map | null = null;
  private layers: IMapLayer[] = [];
  private basemaps: BasemapInfo[] = [];
  private activeBasemap: L.TileLayer | null = null;

  constructor(private projectId: string, private isPublic: boolean) {}

  async loadProject(): Promise<void> {
    try {
      console.log(`Loading project: ${this.projectId}, isPublic: ${this.isPublic}`);

      let data: ProjectConstructor;

      if (this.isPublic) {
        data = await projectService.getPublicProject(this.projectId);
      } else {
        data = await projectService.getProject(this.projectId);
      }

      console.log('Project data loaded:', data);

      this.basemaps = data.basemaps || [];
      await this.createLayers(data);

      if (this.map) {
        this.map.setView(
          [data.project.default_center_lat, data.project.default_center_lng],
          data.project.default_zoom_level
        );

        for (const layer of this.layers) {
          try {
            await layer.initialize(this.map);
            console.log(`Initialized layer: ${layer.name}`);

            const layerData = await this.fetchLayerData(layer.id);
            await layer.loadData(layerData);
            layer.show();

            console.log(`Loaded and shown layer: ${layer.name}`);
          } catch (error) {
            console.error(`Failed to load layer ${layer.name}:`, error);
          }
        }

        this.setDefaultBasemap();
      }

      console.log('Project loading completed successfully');
    } catch (error) {
      console.error('Failed to load project:', error);
      throw error;
    }
  }

  attachMap(map: L.Map): void {
    this.map = map;
    console.log('Map attached to ProjectController');
  }

  private async createLayers(data: ProjectConstructor): Promise<void> {
    const layers: IMapLayer[] = [];

    if (data.layer_groups) {
      data.layer_groups.forEach(group => {
        if (group.layers) {
          group.layers.forEach(layerInfo => {
            try {
              const layer = LayerFactory.createLayer(layerInfo);
              layers.push(layer);
              console.log(`Created layer: ${layer.name}`);
            } catch (error) {
              console.error(`Failed to create layer:`, layerInfo, error);
            }
          });
        }
      });
    }

    this.layers = layers;
    console.log(`Created ${layers.length} layers total`);
  }

  private async fetchLayerData(layerId: number): Promise<any> {
    try {
      console.log(`Fetching data for layer ${layerId} (mock implementation)`);
      return { features: [] };
    } catch (error) {
      console.error(`Failed to fetch data for layer ${layerId}:`, error);
      return { features: [] };
    }
  }

  private setDefaultBasemap(): void {
    if (this.basemaps.length > 0 && this.map) {
      const defaultBasemap = this.basemaps.find(b => b.is_default) || this.basemaps[0];
      console.log(`Setting default basemap: ${defaultBasemap.name}`);

      if (this.activeBasemap) {
        this.map.removeLayer(this.activeBasemap);
      }

      this.activeBasemap = L.tileLayer(defaultBasemap.url_template, {
        attribution: 'Map data',
        ...defaultBasemap.options
      });

      this.activeBasemap.addTo(this.map);
    }
  }
}
