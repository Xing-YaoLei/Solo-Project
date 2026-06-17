import { _decorator, Component, Node, Sprite, SpriteFrame, Vec3, UITransform } from 'cc';
import { ResourceGenerator } from './utils/ResourceGenerator';
import { levelManager } from './LevelManager';
const { ccclass, property } = _decorator;

export interface TileMapData {
    width: number;
    height: number;
    tileWidth: number;
    tileHeight: number;
    layers: {
        name: string;
        tiles: number[][];
    }[];
}

export const NURSING_HOME_MAP: TileMapData = {
    width: 20,
    height: 12,
    tileWidth: 64,
    tileHeight: 64,
    layers: [
        {
            name: 'floor',
            tiles: [
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                [1,1,2,2,2,1,1,1,1,1,1,1,1,1,2,2,2,1,1,1],
                [1,1,2,2,2,1,1,1,1,1,1,1,1,1,2,2,2,1,1,1],
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                [1,1,2,2,2,1,1,1,1,1,1,1,1,1,2,2,2,1,1,1],
                [1,1,2,2,2,1,1,1,1,1,1,1,1,1,2,2,2,1,1,1],
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            ],
        },
        {
            name: 'elderly',
            tiles: [
                [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                [0,0,3,0,3,0,0,0,0,0,0,0,0,0,3,0,3,0,0,0],
                [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,3,0,3,0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                [0,0,3,0,3,0,0,0,0,0,0,0,0,0,3,0,3,0,0,0],
                [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            ],
        },
    ],
};

const TILE_ID_TO_RESOURCE: { [key: number]: string } = {
    1: 'tile_floor_1',
    2: 'tile_floor_2',
    3: 'tile_elderly',
    4: 'tile_bed',
    5: 'tile_chair',
    6: 'tile_table',
};

@ccclass('TiledMapController')
export class TiledMapController extends Component {
    @property
    mapScale: number = 1;

    @property
    showElderlyNames: boolean = false;

    private _mapData: TileMapData | null = null;
    private _elderlyPositions: Map<string, Vec3> = new Map();
    private _loaded: boolean = false;

    onLoad() {
        this.loadMap(NURSING_HOME_MAP);
    }

    loadMap(mapData: TileMapData): void {
        this._mapData = mapData;
        this.parseElderlyLayer();
        this.renderMap();
    }

    parseElderlyLayer(): void {
        if (!this._mapData) return;

        const elderlyLayer = this._mapData.layers.find(l => l.name === 'elderly');
        if (!elderlyLayer) return;

        this._elderlyPositions.clear();

        for (let y = 0; y < elderlyLayer.tiles.length; y++) {
            for (let x = 0; x < elderlyLayer.tiles[y].length; x++) {
                const gid = elderlyLayer.tiles[y][x];
                if (gid > 0) {
                    const position = this.tileToWorldPosition(x, y);
                    const key = `tile_${x}_${y}`;
                    this._elderlyPositions.set(key, position);
                }
            }
        }
    }

    renderMap(): void {
        if (!this._mapData) return;

        this.node.removeAllChildren();

        const { width, height, tileWidth, tileHeight } = this._mapData;
        const totalWidth = width * tileWidth * this.mapScale;
        const totalHeight = height * tileHeight * this.mapScale;

        const transform = this.node.getComponent(UITransform);
        if (!transform) {
            this.node.addComponent(UITransform).setContentSize(totalWidth, totalHeight);
        } else {
            transform.setContentSize(totalWidth, totalHeight);
        }

        for (let layerIdx = 0; layerIdx < this._mapData.layers.length; layerIdx++) {
            const layer = this._mapData.layers[layerIdx];
            const layerNode = new Node(`Layer_${layer.name}`);
            layerNode.addComponent(UITransform).setContentSize(totalWidth, totalHeight);
            this.node.addChild(layerNode);

            for (let y = 0; y < layer.tiles.length; y++) {
                for (let x = 0; x < layer.tiles[y].length; x++) {
                    const tileId = layer.tiles[y][x];
                    if (tileId <= 0) continue;

                    const resourceType = TILE_ID_TO_RESOURCE[tileId];
                    if (!resourceType) continue;

                    const spriteFrame = ResourceGenerator.getSpriteFrame(resourceType as any);
                    if (!spriteFrame) continue;

                    const tileNode = new Node(`Tile_${x}_${y}`);
                    tileNode.addComponent(UITransform).setContentSize(
                        tileWidth * this.mapScale,
                        tileHeight * this.mapScale
                    );

                    const sprite = tileNode.addComponent(Sprite);
                    sprite.spriteFrame = spriteFrame;

                    const pos = this.tileToWorldPosition(x, y);
                    tileNode.setPosition(pos.x * this.mapScale, pos.y * this.mapScale, 0);

                    layerNode.addChild(tileNode);
                }
            }
        }

        if (this.showElderlyNames) {
            this.renderElderlyNames();
        }

        this._loaded = true;
        console.log(`[TiledMapController] Map rendered: ${width}x${height}, ${this._elderlyPositions.size} elders`);
    }

    renderElderlyNames(): void {
        const elderlyProfiles = levelManager.elderlyProfiles;
        const positions = Array.from(this._elderlyPositions.values());

        elderlyProfiles.forEach((profile, index) => {
            if (index >= positions.length) return;

            const pos = positions[index];
            const labelNode = new Node(`ElderlyLabel_${index}`);
            const label = labelNode.addComponent(Sprite);
            label.spriteFrame = ResourceGenerator.getSpriteFrame('tile_elderly');
            labelNode.setPosition(pos.x * this.mapScale, pos.y * this.mapScale + 30, 10);
            labelNode.setScale(this.mapScale * 1.5, this.mapScale * 1.5, 1);
            this.node.addChild(labelNode);
        });
    }

    tileToWorldPosition(tileX: number, tileY: number): Vec3 {
        if (!this._mapData) return Vec3.ZERO;

        const { width, height, tileWidth, tileHeight } = this._mapData;
        const x = (tileX - width / 2) * tileWidth + tileWidth / 2;
        const y = (height / 2 - tileY) * tileHeight - tileHeight / 2;

        return new Vec3(x, y, 0);
    }

    getElderlyPositions(): Map<string, Vec3> {
        const result = new Map<string, Vec3>();
        this._elderlyPositions.forEach((pos, key) => {
            result.set(key, new Vec3(
                pos.x * this.mapScale,
                pos.y * this.mapScale,
                pos.z
            ));
        });
        return result;
    }

    getElderlyPositionCount(): number {
        return this._elderlyPositions.size;
    }

    getMapSize(): { width: number; height: number } {
        if (!this._mapData) return { width: 0, height: 0 };
        return {
            width: this._mapData.width * this._mapData.tileWidth * this.mapScale,
            height: this._mapData.height * this._mapData.tileHeight * this.mapScale,
        };
    }

    get isLoaded(): boolean {
        return this._loaded;
    }

    updateElderlyDisplay(): void {
        if (!this.showElderlyNames) return;
        this.renderElderlyNames();
    }
}
