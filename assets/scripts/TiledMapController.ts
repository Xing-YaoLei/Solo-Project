import { _decorator, Component, Node, TiledMap, TiledTile, TiledLayer, Vec3, SpriteFrame, resources } from 'cc';
import { levelManager } from './LevelManager';
const { ccclass, property } = _decorator;

@ccclass('TiledMapController')
export class TiledMapController extends Component {
    @property(TiledMap)
    tiledMap: TiledMap | null = null;

    @property(string)
    mapLayerName: string = 'floor';

    @property(string)
    elderlyLayerName: string = 'elderly';

    @property(string)
    decorationLayerName: string = 'decoration';

    private _elderlyPositions: Map<string, Vec3> = new Map();

    onLoad() {
        if (this.tiledMap) {
            this.parseMap();
        }
    }

    parseMap(): void {
        if (!this.tiledMap) return;

        const mapSize = this.tiledMap.getMapSize();
        const tileSize = this.tiledMap.getTileSize();

        console.log(`Tiled Map: ${mapSize.width}x${mapSize.height}, tile size: ${tileSize.width}x${tileSize.height}`);

        const elderlyLayer = this.tiledMap.getLayer(this.elderlyLayerName);
        if (elderlyLayer) {
            this.parseElderlyLayer(elderlyLayer);
        }
    }

    parseElderlyLayer(layer: TiledLayer): void {
        const layerSize = layer.getLayerSize();

        for (let y = 0; y < layerSize.height; y++) {
            for (let x = 0; x < layerSize.width; x++) {
                const tile = layer.getTiledTileAt(x, y, true);
                if (tile && tile.grid !== -1) {
                    const position = this.tileToWorldPosition(x, y);
                    const key = `tile_${x}_${y}`;
                    this._elderlyPositions.set(key, position);
                    console.log(`Elderly tile at (${x}, ${y}) -> world: (${position.x}, ${position.y})`);
                }
            }
        }
    }

    tileToWorldPosition(tileX: number, tileY: number): Vec3 {
        if (!this.tiledMap) return Vec3.ZERO;

        const tileSize = this.tiledMap.getTileSize();
        const mapSize = this.tiledMap.getMapSize();

        const x = (tileX - mapSize.width / 2) * tileSize.width + tileSize.width / 2;
        const y = (mapSize.height / 2 - tileY) * tileSize.height - tileSize.height / 2;

        return new Vec3(x, y, 0);
    }

    getElderlyPositions(): Map<string, Vec3> {
        return new Map(this._elderlyPositions);
    }

    getElderlyPositionCount(): number {
        return this._elderlyPositions.size;
    }

    getMapSize(): { width: number; height: number } {
        if (!this.tiledMap) return { width: 0, height: 0 };
        const size = this.tiledMap.getMapSize();
        const tileSize = this.tiledMap.getTileSize();
        return {
            width: size.width * tileSize.width,
            height: size.height * tileSize.height,
        };
    }

    loadMap(mapName: string): void {
        resources.load(`tiled/${mapName}`, (err, mapAsset) => {
            if (err) {
                console.error('Failed to load tiled map:', mapName, err);
                return;
            }
            if (this.tiledMap && mapAsset) {
                this.tiledMap.tmxAsset = mapAsset as any;
                this.parseMap();
            }
        });
    }

    updateElderlyDisplay(): void {
        const elderlyProfiles = levelManager.elderlyProfiles;
        const positions = Array.from(this._elderlyPositions.values());

        elderlyProfiles.forEach((profile, index) => {
            if (index < positions.length) {
                console.log(`Place ${profile.name} at position`, positions[index]);
            }
        });
    }
}
