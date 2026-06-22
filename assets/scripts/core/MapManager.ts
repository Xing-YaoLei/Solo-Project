import { _decorator, Component, Node, TiledMap, TiledLayer, TiledObjectGroup, Vec3, UITransform } from 'cc';
import { GameConstants } from './GameConstants';
const { ccclass, property } = _decorator;

@ccclass('MapManager')
export class MapManager extends Component {

    private static _instance: MapManager | null = null;

    public static get instance(): MapManager {
        if (!MapManager._instance) {
            MapManager._instance = new MapManager();
        }
        return MapManager._instance;
    }

    @property(TiledMap)
    tiledMap: TiledMap | null = null;

    private _mapObjects: Map<string, MapObjectData> = new Map();
    private _currentMapId: string = '';
    private _objectLayers: Map<string, TiledObjectGroup> = new Map();

    constructor() {
        super();
    }

    public init(tiledMap: TiledMap): void {
        this.tiledMap = tiledMap;
        this.parseMapObjects();
        console.log('[MapManager] Initialized');
    }

    private parseMapObjects(): void {
        if (!this.tiledMap) return;

        const objectGroups = this.tiledMap.getObjectGroups();
        objectGroups.forEach(group => {
            this._objectLayers.set(group.name, group);
            
            const objects = group.getObjects();
            objects.forEach(obj => {
                const mapObj: MapObjectData = {
                    id: obj.id.toString(),
                    name: obj.name,
                    x: obj.x,
                    y: obj.y,
                    width: obj.width,
                    height: obj.height,
                    type: obj.type,
                    properties: obj.properties || {}
                };
                this._mapObjects.set(obj.id.toString(), mapObj);
            });
        });

        console.log(`[MapManager] Parsed ${this._mapObjects.size} map objects`);
    }

    public getObjectById(id: string): MapObjectData | undefined {
        return this._mapObjects.get(id);
    }

    public getObjectsByName(name: string): MapObjectData[] {
        return Array.from(this._mapObjects.values()).filter(o => o.name === name);
    }

    public getObjectsByType(type: string): MapObjectData[] {
        return Array.from(this._mapObjects.values()).filter(o => o.type === type);
    }

    public getObjectLayer(layerName: string): TiledObjectGroup | undefined {
        return this._objectLayers.get(layerName);
    }

    public getMapSize(): { width: number; height: number } {
        if (!this.tiledMap) return { width: 0, height: 0 };
        return {
            width: this.tiledMap.getMapSize().width,
            height: this.tiledMap.getMapSize().height
        };
    }

    public getTileSize(): { width: number; height: number } {
        if (!this.tiledMap) return { width: 0, height: 0 };
        return {
            width: this.tiledMap.getTileSize().width,
            height: this.tiledMap.getTileSize().height
        };
    }

    public screenToMap(screenPos: Vec3): { x: number; y: number } {
        if (!this.tiledMap) return { x: 0, y: 0 };
        
        const tileSize = this.getTileSize();
        const mapSize = this.getMapSize();
        
        const mapPos = {
            x: Math.floor(screenPos.x / tileSize.width),
            y: Math.floor((mapSize.height * tileSize.height - screenPos.y) / tileSize.height)
        };
        
        return mapPos;
    }

    public mapToScreen(mapX: number, mapY: number): Vec3 {
        if (!this.tiledMap) return new Vec3(0, 0, 0);
        
        const tileSize = this.getTileSize();
        const mapSize = this.getMapSize();
        
        return new Vec3(
            mapX * tileSize.width + tileSize.width / 2,
            (mapSize.height - mapY) * tileSize.height - tileSize.height / 2,
            0
        );
    }

    public getProperty(objectId: string, propertyName: string): any {
        const obj = this._mapObjects.get(objectId);
        if (!obj) return null;
        return obj.properties[propertyName];
    }

    public getAllObjects(): MapObjectData[] {
        return Array.from(this._mapObjects.values());
    }

    public setObjectVisible(objectId: string, visible: boolean): void {
        const obj = this._mapObjects.get(objectId);
        if (obj) {
            obj.visible = visible;
        }
    }

    public getCurrentMapId(): string {
        return this._currentMapId;
    }

    public clear(): void {
        this._mapObjects.clear();
        this._objectLayers.clear();
        this._currentMapId = '';
    }
}

export interface MapObjectData {
    id: string;
    name: string;
    x: number;
    y: number;
    width: number;
    height: number;
    type: string;
    properties: Record<string, any>;
    visible?: boolean;
}

export interface MapSceneConfig {
    mapId: string;
    mapPath: string;
    caseId: string;
    stage: GameConstants.CaseStage;
    interactableObjectIds: string[];
    spawnPoints: { id: string; x: number; y: number }[];
    backgroundMusic?: string;
}
