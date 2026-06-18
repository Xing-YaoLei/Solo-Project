import { _decorator, Component, Node, TiledMap, TiledLayer, TiledObjectGroup, Vec3, UITransform, resources, TiledMapAsset, JsonAsset, log, error } from 'cc';
import { TiledMapData } from '../core/LevelTypes';
import { GameManager } from '../managers/GameManager';
import { EventManager, GameEvents } from '../utils/EventManager';

const { ccclass, property } = _decorator;

@ccclass('TiledMapController')
export class TiledMapController extends Component {
    @property(TiledMap)
    tiledMap: TiledMap | null = null;

    @property()
    mapScale: number = 1;

    @property(Node)
    playerNode: Node | null = null;

    private _mapData: TiledMapData | null = null;
    private _currentLevelId: string = '';

    onLoad(): void {
        EventManager.instance.on(GameEvents.GAME_START, this._onGameStart.bind(this));
    }

    start(): void {
    }

    private _onGameStart(levelConfig: any): void {
        if (!levelConfig) return;
        const tiledMapPath = levelConfig.tiledMap || levelConfig.mapData?.mapFile;
        if (tiledMapPath) {
            this.loadTiledMap(tiledMapPath);
        }
        if (levelConfig.mapData) {
            this.setMap(levelConfig.id, levelConfig.mapData);
        }
        if (this.playerNode) {
            const spawn = levelConfig.mapData?.spawnPoints?.[0];
            if (spawn) {
                this.movePlayerTo(spawn.x, spawn.y);
            }
        }
        this.node.active = true;
    }

    public loadTiledMap(resourcePath: string): void {
        const tmxPath = resourcePath.replace(/^tiled\//, 'tiled/');

        resources.load(tmxPath, TiledMapAsset, (err: Error | null, tmxAsset: TiledMapAsset) => {
            if (err) {
                error(`[TiledMapController] Failed to load TMX: ${tmxPath}`, err);
                return;
            }
            if (this.tiledMap) {
                this.tiledMap.tmxAsset = tmxAsset;
                this.applyScale();
                log(`[TiledMapController] Loaded TMX: ${tmxPath}`);
            }
        });
    }

    public setMap(levelId: string, mapData: TiledMapData): void {
        this._currentLevelId = levelId;
        this._mapData = mapData;

        this.applyScale();
    }

    private applyScale(): void {
        if (this.tiledMap && this.tiledMap.node) {
            this.tiledMap.node.setScale(this.mapScale, this.mapScale, 1);
        }
    }

    public getLayer(layerName: string): TiledLayer | null {
        if (!this.tiledMap) return null;
        return this.tiledMap.getLayer(layerName);
    }

    public getObjectGroup(groupName: string): TiledObjectGroup | null {
        if (!this.tiledMap) return null;
        return this.tiledMap.getObjectGroup(groupName);
    }

    public getTileGIDAt(layerName: string, x: number, y: number): number {
        const layer = this.getLayer(layerName);
        if (!layer) return 0;
        return layer.getTileGIDAt(x, y);
    }

    public getMapSize(): { width: number; height: number } {
        if (!this.tiledMap) return { width: 0, height: 0 };
        const mapSize = this.tiledMap.getMapSize();
        return { width: mapSize.width, height: mapSize.height };
    }

    public getTileSize(): { width: number; height: number } {
        if (!this.tiledMap) return { width: 0, height: 0 };
        const tileSize = this.tiledMap.getTileSize();
        return { width: tileSize.width, height: tileSize.height };
    }

    public tileToWorld(tileX: number, tileY: number): Vec3 {
        if (!this.tiledMap || !this.tiledMap.node) {
            return new Vec3(0, 0, 0);
        }

        const tileSize = this.getTileSize();
        const mapSize = this.getMapSize();

        const x = tileX * tileSize.width * this.mapScale;
        const y = (mapSize.height - tileY - 1) * tileSize.height * this.mapScale;

        return new Vec3(x, y, 0);
    }

    public worldToTile(worldPos: Vec3): { x: number; y: number } {
        const tileSize = this.getTileSize();
        const mapSize = this.getMapSize();

        const tileX = Math.floor(worldPos.x / (tileSize.width * this.mapScale));
        const tileY = Math.floor(mapSize.height - worldPos.y / (tileSize.height * this.mapScale));

        return { x: tileX, y: tileY };
    }

    public movePlayerTo(tileX: number, tileY: number): void {
        if (!this.playerNode) return;
        const worldPos = this.tileToWorld(tileX, tileY);
        this.playerNode.setPosition(worldPos);
    }

    public setMapScale(scale: number): void {
        this.mapScale = scale;
        this.applyScale();
    }

    onDestroy(): void {
    }
}
