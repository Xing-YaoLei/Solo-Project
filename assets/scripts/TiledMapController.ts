import { _decorator, Component, Node, Sprite, SpriteFrame, Vec3, UITransform, assetManager } from 'cc';
import { levelManager } from './LevelManager';
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
    baseUrl: string = 'assets/tiled';

    private _mapData: TmxMapData | null = null;
    private _spriteFrames: TmxSpriteFrameCache = {};
    private _elderlyPositions: Map<string, Vec3> = new Map();
    private _loaded: boolean = false;
    private _layerNodes: Node[] = [];

    private static _baseUrlCandidates: string[] = [
        'assets/tiled',
        'resources/tiled',
        'assets/resources/tiled',
        './assets/tiled',
        '',
    ];
    private static _detectedBaseUrl: string = '';

    onLoad() {
        this.loadMap(this.mapName);
    }

    async resolveBaseUrl(): Promise<string> {
        if (TiledMapController._detectedBaseUrl) {
            return TiledMapController._detectedBaseUrl;
        }

        for (const candidate of TiledMapController._baseUrlCandidates) {
            try {
                const testUrl = candidate
                    ? `${candidate}/${this.mapName}.tmx`
                    : `${this.mapName}.tmx`;
                const xhr = new XMLHttpRequest();
                xhr.open('HEAD', testUrl, true);
                await new Promise<void>((resolve) => {
                    xhr.onload = () => {
                        if (xhr.status >= 200 && xhr.status < 400) {
                            TiledMapController._detectedBaseUrl = candidate;
                            console.log(`[TiledMapController] Detected base URL: '${candidate}'`);
                        }
                        resolve();
                    };
                    xhr.onerror = () => resolve();
                    xhr.ontimeout = () => resolve();
                    try { xhr.send(); } catch { resolve(); }
                    setTimeout(resolve, 800);
                });

                if (TiledMapController._detectedBaseUrl) {
                    return TiledMapController._detectedBaseUrl;
                }
            } catch (e) {
            }
        }

        TiledMapController._detectedBaseUrl = this.baseUrl;
        return TiledMapController._detectedBaseUrl;
    }

    async loadMap(mapName: string): Promise<void> {
        this.node.removeAllChildren();
        this._layerNodes = [];
        this._loaded = false;
        this._elderlyPositions.clear();

        const base = await this.resolveBaseUrl();
        this.baseUrl = base;

        const tmxUrl = base
            ? `${base}/${mapName}.tmx`
            : `${mapName}.tmx`;

        try {
            console.log(`[TiledMapController] Loading TMX from: ${tmxUrl}`);

            let xmlText: string | null = null;
            const tryUrls = [
                tmxUrl,
                `assets/tiled/${mapName}.tmx`,
                `assets/resources/tiled/${mapName}.tmx`,
                `resources/tiled/${mapName}.tmx`,
            ];

            for (const url of tryUrls) {
                try {
                    xmlText = await RuntimeTmxLoader.loadTextFile(url);
                    console.log(`[TiledMapController] TMX loaded via: ${url}`);
                    this.baseUrl = url.substring(0, url.lastIndexOf('/'));
                    break;
                } catch (e) {
                }
            }

            if (!xmlText) {
                throw new Error('All TMX load paths failed');
            }

            this._mapData = RuntimeTmxLoader.parseTmx(xmlText);

            for (const tileset of this._mapData.tilesets) {
                let texture: any = null;
                const imgTryUrls = [
                    `${this.baseUrl}/${tileset.image}`,
                    `assets/tiled/${tileset.image}`,
                    `assets/resources/tiled/${tileset.image}`,
                ];
                for (const imgUrl of imgTryUrls) {
                    try {
                        texture = await RuntimeTmxLoader.loadImageAsTexture(imgUrl);
                        tileset.texture = texture;
                        console.log(`[TiledMapController] Tileset image loaded via: ${imgUrl}`);
                        break;
                    } catch (e) {
                    }
                }
                if (!tileset.texture) {
                    console.warn(`[TiledMapController] Could not load tileset image: ${tileset.image}`);
                }
            }

            this._spriteFrames = RuntimeTmxLoader.buildSpriteFrames(this._mapData);

            this.parseElderlyLayer();
            this.renderMap();

            if (this.showElderlyNames) {
                this.renderElderlyOverlays();
            }

            this._loaded = true;
            console.log(`[TiledMapController] Map '${mapName}' loaded successfully`);

        } catch (err) {
            console.error(`[TiledMapController] Failed to load map '${mapName}':`, err);
            this.buildFallbackMap();
        }
    }

    loadTmxFromResources(mapName: string): Promise<string> {
        return new Promise((resolve, reject) => {
            assetManager.loadRemote(`${this.baseUrl}/${mapName}.tmx`, (err: any, asset: any) => {
                if (err) {
                    reject(err);
                    return;
                }
                const text = asset?._nativeAsset || asset?.text || '';
                if (text) {
                    resolve(text);
                } else {
                    reject(new Error('Empty TMX data from resources'));
                }
            });
        });
    }

    parseElderlyLayer(): void {
        if (!this._mapData) return;

        const elderlyLayer = this._mapData.layers.find(l => l.name === 'elderly');
        if (!elderlyLayer) return;

        for (let y = 0; y < elderlyLayer.tiles.length; y++) {
            for (let x = 0; x < elderlyLayer.tiles[y].length; x++) {
                const gid = elderlyLayer.tiles[y][x];
                if (gid > 0) {
                    const position = RuntimeTmxLoader.tileToWorldPosition(this._mapData!, x, y, this.mapScale);
                    const key = `tile_${x}_${y}`;
                    this._elderlyPositions.set(key, position);
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
        transform.setContentSize(totalWidth, totalHeight);

        for (let layerIdx = 0; layerIdx < this._mapData.layers.length; layerIdx++) {
            const layer = this._mapData.layers[layerIdx];
            const layerNode = new Node(`Layer_${layer.name}`);
            layerNode.addComponent(UITransform).setContentSize(totalWidth, totalHeight);
            layerNode.setSiblingIndex(layerIdx);
            this.node.addChild(layerNode);
            this._layerNodes.push(layerNode);

            for (let y = 0; y < layer.tiles.length; y++) {
                for (let x = 0; x < layer.tiles[y].length; x++) {
                    const gid = layer.tiles[y][x];
                    if (gid <= 0) continue;

                    const spriteFrame = this._spriteFrames[gid];
                    if (!spriteFrame) continue;

                    const tileNode = this.createTileNode(gid, x, y, spriteFrame);
                    layerNode.addChild(tileNode);
                }
            }
        }
    }

    createTileNode(gid: number, tileX: number, tileY: number, spriteFrame: SpriteFrame): Node {
        if (!this._mapData) return new Node();

        const { tileWidth, tileHeight } = this._mapData;

        const tileNode = new Node(`Tile_${tileX}_${tileY}_${gid}`);
        const transform = tileNode.addComponent(UITransform);
        transform.setContentSize(
            tileWidth * this.mapScale,
            tileHeight * this.mapScale
        );

        const sprite = tileNode.addComponent(Sprite);
        sprite.spriteFrame = spriteFrame;
        sprite.sizeMode = Sprite.SizeMode.CUSTOM;

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
            const transform = labelNode.addComponent(UITransform);
            transform.setContentSize(60 * this.mapScale, 24 * this.mapScale);
            labelNode.setPosition(pos.x, pos.y + 40 * this.mapScale, 10);
            this.node.addChild(labelNode);
        });
    }

    buildFallbackMap(): void {
        console.warn('[TiledMapController] Building fallback colored map');

        this._mapData = {
            width: 20,
            height: 12,
            tileWidth: 64,
            tileHeight: 64,
            orientation: 'orthogonal',
            tilesets: [],
            layers: [],
            objectGroups: [],
        };

        const totalWidth = 20 * 64 * this.mapScale;
        const totalHeight = 12 * 64 * this.mapScale;

        let transform = this.node.getComponent(UITransform);
        if (!transform) {
            transform = this.node.addComponent(UITransform);
        }
        transform.setContentSize(totalWidth, totalHeight);

        const fallbackLayer = new Node('Layer_Fallback');
        fallbackLayer.addComponent(UITransform).setContentSize(totalWidth, totalHeight);
        this.node.addChild(fallbackLayer);
        this._layerNodes.push(fallbackLayer);

        const colors = [
            { r: 245, g: 235, b: 220 },
            { r: 210, g: 195, b: 175 },
        ];

        for (let y = 0; y < 12; y++) {
            for (let x = 0; x < 20; x++) {
                const color = colors[(x + y) % 2];

                const tileNode = new Node(`Tile_${x}_${y}`);
                const t = tileNode.addComponent(UITransform);
                t.setContentSize(64 * this.mapScale, 64 * this.mapScale);

                const sprite = tileNode.addComponent(Sprite);
                (sprite as any).color = { r: color.r, g: color.g, b: color.b, a: 255 };

                const pos = RuntimeTmxLoader.tileToWorldPosition(this._mapData, x, y, this.mapScale);
                tileNode.setPosition(pos.x, pos.y, 0);

                fallbackLayer.addChild(tileNode);
            }
        }

        this._loaded = true;
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

    get isLoaded(): boolean {
        return this._loaded;
    }

    getLayerNames(): string[] {
        return this._mapData?.layers.map(l => l.name) || [];
    }

    updateElderlyDisplay(): void {
        if (!this.showElderlyNames) return;
        this.renderElderlyOverlays();
    }
}
