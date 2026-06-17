import { Logger } from '../core/Logger';

export interface IMapLocation {
    id: string;
    name: string;
    type: 'building' | 'area' | 'facility' | 'landmark';
    x: number;
    y: number;
    width: number;
    height: number;
    floorCount?: number;
    description?: string;
    markers?: IMapMarker[];
}

export interface IMapMarker {
    id: string;
    type: 'order' | 'worker' | 'event' | 'warning';
    x: number;
    y: number;
    title: string;
    description?: string;
    data?: any;
    onClick?: () => void;
}

export interface IMapLayer {
    id: string;
    name: string;
    type: 'tile' | 'object' | 'image';
    visible: boolean;
    opacity: number;
    properties?: Record<string, any>;
}

export interface IMapData {
    id: string;
    name: string;
    width: number;
    height: number;
    tileWidth: number;
    tileHeight: number;
    layers: IMapLayer[];
    locations: IMapLocation[];
    properties?: Record<string, any>;
}

export class TiledMapManager {
    private static instance: TiledMapManager;
    private currentMap: IMapData | null = null;
    private markers: Map<string, IMapMarker> = new Map();
    private loadedMaps: Map<string, IMapData> = new Map();

    private constructor() {}

    public static getInstance(): TiledMapManager {
        if (!TiledMapManager.instance) {
            TiledMapManager.instance = new TiledMapManager();
        }
        return TiledMapManager.instance;
    }

    public async loadMap(mapId: string, mapPath: string): Promise<IMapData | null> {
        if (this.loadedMaps.has(mapId)) {
            this.currentMap = this.loadedMaps.get(mapId)!;
            return this.currentMap;
        }

        try {
            const mapData = await this.parseTiledMap(mapId, mapPath);
            if (mapData) {
                this.loadedMaps.set(mapId, mapData);
                this.currentMap = mapData;
                Logger.info(`Map loaded: ${mapId}`);
            }
            return mapData;
        } catch (error) {
            Logger.error(`Failed to load map ${mapId}:`, error);
            return null;
        }
    }

    private async parseTiledMap(mapId: string, mapPath: string): Promise<IMapData | null> {
        const mockMaps: Record<string, IMapData> = {
            'map_park_residential': {
                id: 'map_park_residential',
                name: '住宅区地图',
                width: 40,
                height: 30,
                tileWidth: 32,
                tileHeight: 32,
                layers: [
                    { id: 'layer_ground', name: '地面', type: 'tile', visible: true, opacity: 1 },
                    { id: 'layer_buildings', name: '建筑', type: 'tile', visible: true, opacity: 1 },
                    { id: 'layer_objects', name: '物件', type: 'object', visible: true, opacity: 1 },
                    { id: 'layer_labels', name: '标签', type: 'object', visible: true, opacity: 0.9 }
                ],
                locations: [
                    {
                        id: 'loc_1',
                        name: '1号楼',
                        type: 'building',
                        x: 160,
                        y: 160,
                        width: 128,
                        height: 160,
                        floorCount: 18,
                        description: '高层住宅楼',
                        markers: []
                    },
                    {
                        id: 'loc_2',
                        name: '2号楼',
                        type: 'building',
                        x: 352,
                        y: 160,
                        width: 128,
                        height: 160,
                        floorCount: 22,
                        description: '高层住宅楼，含电梯',
                        markers: []
                    },
                    {
                        id: 'loc_3',
                        name: '3号楼',
                        type: 'building',
                        x: 544,
                        y: 160,
                        width: 128,
                        height: 160,
                        floorCount: 15,
                        description: '多层住宅楼',
                        markers: []
                    },
                    {
                        id: 'loc_4',
                        name: '4号楼',
                        type: 'building',
                        x: 160,
                        y: 400,
                        width: 128,
                        height: 160,
                        floorCount: 12,
                        description: '多层住宅楼',
                        markers: []
                    },
                    {
                        id: 'loc_5',
                        name: '5号楼',
                        type: 'building',
                        x: 352,
                        y: 400,
                        width: 128,
                        height: 160,
                        floorCount: 20,
                        description: '高层住宅楼',
                        markers: []
                    },
                    {
                        id: 'loc_garden',
                        name: '中心花园',
                        type: 'area',
                        x: 544,
                        y: 400,
                        width: 160,
                        height: 160,
                        description: '小区绿化区域',
                        markers: []
                    }
                ],
                properties: { type: 'residential', buildingCount: 5 }
            },
            'map_park_commercial': {
                id: 'map_park_commercial',
                name: '商业区地图',
                width: 50,
                height: 40,
                tileWidth: 32,
                tileHeight: 32,
                layers: [
                    { id: 'layer_ground', name: '地面', type: 'tile', visible: true, opacity: 1 },
                    { id: 'layer_buildings', name: '建筑', type: 'tile', visible: true, opacity: 1 },
                    { id: 'layer_objects', name: '物件', type: 'object', visible: true, opacity: 1 }
                ],
                locations: [
                    {
                        id: 'loc_shop_a',
                        name: 'A座商铺',
                        type: 'building',
                        x: 160,
                        y: 160,
                        width: 192,
                        height: 192,
                        description: '综合商业楼',
                        markers: []
                    },
                    {
                        id: 'loc_shop_b',
                        name: 'B座商铺',
                        type: 'building',
                        x: 416,
                        y: 160,
                        width: 192,
                        height: 192,
                        description: '餐饮娱乐楼',
                        markers: []
                    },
                    {
                        id: 'loc_office',
                        name: '写字楼',
                        type: 'building',
                        x: 160,
                        y: 416,
                        width: 256,
                        height: 256,
                        floorCount: 15,
                        description: '办公写字楼',
                        markers: []
                    },
                    {
                        id: 'loc_parking',
                        name: '地下停车场',
                        type: 'facility',
                        x: 480,
                        y: 416,
                        width: 192,
                        height: 192,
                        description: '公共停车场',
                        markers: []
                    }
                ],
                properties: { type: 'commercial', buildingCount: 4 }
            },
            'map_park_complete': {
                id: 'map_park_complete',
                name: '完整园区地图',
                width: 60,
                height: 50,
                tileWidth: 32,
                tileHeight: 32,
                layers: [
                    { id: 'layer_ground', name: '地面', type: 'tile', visible: true, opacity: 1 },
                    { id: 'layer_roads', name: '道路', type: 'tile', visible: true, opacity: 1 },
                    { id: 'layer_buildings', name: '建筑', type: 'tile', visible: true, opacity: 1 },
                    { id: 'layer_objects', name: '物件', type: 'object', visible: true, opacity: 1 },
                    { id: 'layer_labels', name: '标签', type: 'object', visible: true, opacity: 0.9 }
                ],
                locations: [
                    {
                        id: 'loc_1',
                        name: '1号楼',
                        type: 'building',
                        x: 96,
                        y: 96,
                        width: 128,
                        height: 160,
                        floorCount: 18,
                        markers: []
                    },
                    {
                        id: 'loc_2',
                        name: '2号楼',
                        type: 'building',
                        x: 288,
                        y: 96,
                        width: 128,
                        height: 160,
                        floorCount: 22,
                        markers: []
                    },
                    {
                        id: 'loc_3',
                        name: '3号楼',
                        type: 'building',
                        x: 480,
                        y: 96,
                        width: 128,
                        height: 160,
                        floorCount: 15,
                        markers: []
                    },
                    {
                        id: 'loc_4',
                        name: '4号楼',
                        type: 'building',
                        x: 96,
                        y: 320,
                        width: 128,
                        height: 160,
                        floorCount: 12,
                        markers: []
                    },
                    {
                        id: 'loc_5',
                        name: '5号楼',
                        type: 'building',
                        x: 288,
                        y: 320,
                        width: 128,
                        height: 160,
                        floorCount: 20,
                        markers: []
                    },
                    {
                        id: 'loc_6',
                        name: '商业中心',
                        type: 'building',
                        x: 480,
                        y: 320,
                        width: 256,
                        height: 192,
                        floorCount: 5,
                        markers: []
                    },
                    {
                        id: 'loc_office',
                        name: '物业服务中心',
                        type: 'building',
                        x: 96,
                        y: 560,
                        width: 192,
                        height: 128,
                        floorCount: 3,
                        markers: []
                    },
                    {
                        id: 'loc_garden',
                        name: '中心花园',
                        type: 'area',
                        x: 768,
                        y: 96,
                        width: 192,
                        height: 192,
                        markers: []
                    },
                    {
                        id: 'loc_parking',
                        name: '停车场',
                        type: 'facility',
                        x: 768,
                        y: 352,
                        width: 192,
                        height: 192,
                        markers: []
                    }
                ],
                properties: { type: 'complete', buildingCount: 7 }
            }
        };

        return mockMaps[mapId] || mockMaps['map_park_residential'];
    }

    public getCurrentMap(): IMapData | null {
        return this.currentMap;
    }

    public getLocation(locationId: string): IMapLocation | null {
        if (!this.currentMap) return null;
        return this.currentMap.locations.find(l => l.id === locationId) || null;
    }

    public getLocationsByType(type: IMapLocation['type']): IMapLocation[] {
        if (!this.currentMap) return [];
        return this.currentMap.locations.filter(l => l.type === type);
    }

    public findLocationByBuilding(buildingName: string): IMapLocation | null {
        if (!this.currentMap) return null;
        return this.currentMap.locations.find(l => 
            l.name.includes(buildingName) || buildingName.includes(l.name)
        ) || null;
    }

    public addMarker(marker: IMapMarker): void {
        this.markers.set(marker.id, marker);
        const location = this.findNearestLocation(marker.x, marker.y);
        if (location && location.markers) {
            if (!location.markers.find(m => m.id === marker.id)) {
                location.markers.push(marker);
            }
        }
    }

    public removeMarker(markerId: string): boolean {
        const marker = this.markers.get(markerId);
        if (marker) {
            const location = this.findNearestLocation(marker.x, marker.y);
            if (location && location.markers) {
                const index = location.markers.findIndex(m => m.id === markerId);
                if (index !== -1) {
                    location.markers.splice(index, 1);
                }
            }
        }
        return this.markers.delete(markerId);
    }

    public getMarker(markerId: string): IMapMarker | undefined {
        return this.markers.get(markerId);
    }

    public getAllMarkers(): IMapMarker[] {
        return Array.from(this.markers.values());
    }

    public getMarkersByType(type: IMapMarker['type']): IMapMarker[] {
        return Array.from(this.markers.values()).filter(m => m.type === type);
    }

    public getMarkersAtLocation(locationId: string): IMapMarker[] {
        const location = this.getLocation(locationId);
        return location?.markers || [];
    }

    public clearMarkers(): void {
        this.markers.clear();
        if (this.currentMap) {
            this.currentMap.locations.forEach(loc => {
                if (loc.markers) {
                    loc.markers = [];
                }
            });
        }
    }

    private findNearestLocation(x: number, y: number): IMapLocation | null {
        if (!this.currentMap) return null;
        
        let nearest: IMapLocation | null = null;
        let minDistance = Infinity;

        for (const loc of this.currentMap.locations) {
            const centerX = loc.x + loc.width / 2;
            const centerY = loc.y + loc.height / 2;
            const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
            
            if (distance < minDistance) {
                minDistance = distance;
                nearest = loc;
            }
        }

        return nearest;
    }

    public getMapSize(): { width: number; height: number } {
        if (!this.currentMap) return { width: 0, height: 0 };
        return {
            width: this.currentMap.width * this.currentMap.tileWidth,
            height: this.currentMap.height * this.currentMap.tileHeight
        };
    }

    public isMapLoaded(mapId: string): boolean {
        return this.loadedMaps.has(mapId);
    }

    public unloadMap(mapId: string): void {
        this.loadedMaps.delete(mapId);
        if (this.currentMap?.id === mapId) {
            this.currentMap = null;
            this.clearMarkers();
        }
    }

    public clearAll(): void {
        this.currentMap = null;
        this.markers.clear();
        this.loadedMaps.clear();
    }
}
