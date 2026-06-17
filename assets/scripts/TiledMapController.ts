import { _decorator, Component, Node, Sprite, SpriteFrame, Vec3, UITransform } from 'cc';
import { levelManager } from './LevelManager';
import { NodeUtil } from './utils/NodeUtil';
import { RuntimeTmxLoader, TmxMapData, TmxSpriteFrameCache } from './utils/RuntimeTmxLoader';
const { ccclass, property } = _decorator;

@ccclass('TiledMapController')
export class TiledMapController extends Component {
    @property
    mapName: string = 'nursing_home';

    @property
    mapScale: number = 1;

    @property
    showElderlyNames: boolean = false;

    @property
    resourcePath: string = 'assets/tiled';

    private _mapData: TmxMapData | null = null;
    private _spriteFrames: TmxSpriteFrameCache = {};
    private _elderlyPositions: Map<string, Vec3> = new Map();
    private _loaded: boolean = false;
    private _loading: boolean = false;
    private _error: string | null = null;

    onLoad() {
        this.loadMap();
    }

    async loadMap(): Promise<void> {
        if (this._loading) return;

        this._loading = true;
        this._loaded = false;
        this._error = null;
        this.node.removeAllChildren();
        this._elderlyPositions.clear();

        const tmxUrl = `${this.resourcePath}/${this.mapName}.tmx`;

        try {
            console.log(`[TiledMapController] Loading TMX: ${tmxUrl}`);
            const xmlText = await RuntimeTmxLoader.loadTextFile(tmxUrl);
            this._mapData = RuntimeTmxLoader.parseTmx(xmlText);

            if (!this._mapData || this._mapData.layers.length === 0) {
                throw new Error('Invalid TMX data: no layers found');
            }

            console.log(`[TiledMapController] Parsed map: ${this._mapData.width}x${this._mapData}, ${this._mapData.layers.length} layers, ${this._mapData.tilesets.length} tilesets`);

            for (const tileset of this._mapData.tilesets) {
                const imgUrl = `${this.resourcePath}/${tileset.image}`;
                console.log(`[TiledMapController] Loading tileset: ${imgUrl}`);
                tileset.texture = await RuntimeTmxLoader.loadImageAsTexture(imgUrl);
            }

            this._spriteFrames = RuntimeTmxLoader.buildSpriteFrames(this._mapData);

            const tileCount = Object.keys(this._spriteFrames).length;
            if (tileCount === 0) {
                throw new Error('No sprite frames were built from tilesets');
            }
            console.log(`[TiledMapController] Built ${tileCount} sprite frames`);

            this.parseElderlyPositions();
            this.renderMap();

            if (this.showElderlyNames) {
                this.renderElderlyOverlays();
            }

            this._loaded = true;
            console.log(`[TiledMapController] Map '${this.mapName}' loaded successfully`);

        } catch (err) {
            this._error = err instanceof Error ? err.message : String(err);
            console.error(`[TiledMapController] Failed to load map '${this.mapName}':`, err);
            this.showErrorIndicator();
        } finally {
            this._loading = false;
        }
    }

    parseElderlyPositions(): void {
        if (!this._mapData) return;

        this._elderlyPositions.clear();

        for (const layer of this._mapData.layers) {
            if (layer.name.toLowerCase().includes('elderly') ||
                layer.name.toLowerCase().includes('npc') ||
                layer.name.toLowerCase().includes('people')) {
                for (let y = 0; y < layer.tiles.length; y++) {
                    for (let x = 0; x < layer.tiles[y].length; x++) {
                        const gid = layer.tiles[y][x];
                        if (gid > 0) {
                            const pos = RuntimeTmxLoader.tileToWorldPosition(this._mapData!, x, y, this.mapScale);
                            this._elderlyPositions.set(`tile_${x}_${y}`, pos);
                        }
                    }
                }
            }
        }

        console.log(`[TiledMapController] Found ${this._elderlyPositions.size} elderly positions`);
    }

    renderMap(): void {
        if (!this._mapData) return;

        const { width, height, tileWidth, tileHeight } = this._mapData;
        const totalWidth = width * tileWidth * this.mapScale;
        const totalHeight = height * tileHeight * this.mapScale;

        let transform = this.node.getComponent(UITransform);
        if (!transform) {
            transform = this.node.addComponent(UITransform);
        }
        NodeUtil.setContentSize(this.node, totalWidth, totalHeight);

        for (let layerIdx = 0; layerIdx < this._mapData.layers.length; layerIdx++) {
            const layer = this._mapData.layers[layerIdx];

            const layerNode = new Node(`Layer_${layer.name}`);
            NodeUtil.setContentSize(layerNode, totalWidth, totalHeight);
            layerNode.setSiblingIndex(layerIdx);
            this.node.addChild(layerNode);

            let renderedTiles = 0;
            for (let y = 0; y < layer.tiles.length; y++) {
                for (let x = 0; x < layer.tiles[y].length; x++) {
                    const gid = layer.tiles[y][x];
                    if (gid <= 0) continue;

                    const spriteFrame = this._spriteFrames[gid];
                    if (!spriteFrame) continue;

                    const tileNode = this.createTileNode(gid, x, y, spriteFrame);
                    layerNode.addChild(tileNode);
                    renderedTiles++;
                }
            }

            console.log(`[TiledMapController] Layer '${layer.name}': ${renderedTiles} tiles rendered`);
        }
    }

    createTileNode(gid: number, tileX: number, tileY: number, spriteFrame: SpriteFrame): Node {
        if (!this._mapData) return new Node();

        const { tileWidth, tileHeight } = this._mapData;

        const tileNode = new Node(`Tile_${tileX}_${tileY}_gid${gid}`);
        NodeUtil.setContentSize(tileNode, tileWidth * this.mapScale, tileHeight * this.mapScale);

        const sprite = tileNode.addComponent(Sprite);
        sprite.spriteFrame = spriteFrame;
        sprite.sizeMode = Sprite.SizeMode.CUSTOM;
        sprite.trim = true;

        const pos = RuntimeTmxLoader.tileToWorldPosition(this._mapData, tileX, tileY, this.mapScale);
        tileNode.setPosition(pos.x, pos.y, 0);

        return tileNode;
    }

    renderElderlyOverlays(): void {
        const elderlyProfiles = levelManager.elderlyProfiles;
        const positions = Array.from(this._elderlyPositions.values());

        elderlyProfiles.forEach((profile, index) => {
            if (index >= positions.length) return;

            const pos = positions[index];
            const labelNode = new Node(`ElderlyLabel_${index}`);
            NodeUtil.setContentSize(labelNode, 60 * this.mapScale, 24 * this.mapScale);
            labelNode.setPosition(pos.x, pos.y + 40 * this.mapScale, 10);
            this.node.addChild(labelNode);
        });
    }

    showErrorIndicator(): void {
        const errorNode = new Node('MapLoadError');
        NodeUtil.setContentSize(errorNode, 300, 60);
        const label = errorNode.addComponent(Sprite);
        label.type = Sprite.Type.SIMPLE;
        errorNode.setPosition(0, 0, 0);
        this.node.addChild(errorNode);
    }

    getElderlyPositions(): Map<string, Vec3> {
        return new Map(this._elderlyPositions);
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

    getLayerNames(): string[] {
        return this._mapData?.layers.map(l => l.name) || [];
    }

    get isLoaded(): boolean {
        return this._loaded;
    }

    get isLoading(): boolean {
        return this._loading;
    }

    get error(): string | null {
        return this._error;
    }

    updateElderlyDisplay(): void {
        if (!this.showElderlyNames) return;
        this.renderElderlyOverlays();
    }

    reload(): void {
        this.loadMap();
    }
}
