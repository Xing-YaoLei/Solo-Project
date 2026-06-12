import { _decorator, Component, Node, TiledMap, TiledTile, TiledLayer, Vec3, UITransform, instantiate, Prefab, find } from 'cc';
import { EventManager, GameEvents } from '../core/EventManager';
import { ConfigManager, ConfigKeys } from '../core/ConfigManager';
import { Store } from '../models/Store';
import { StoreNode } from '../scenes/StoreNode';
const { ccclass, property } = _decorator;

export interface TiledMapConfig {
    tileWidth: number;
    tileHeight: number;
    mapWidth: number;
    mapHeight: number;
    storeLayerName: string;
    supplierLayerName: string;
}

@ccclass('TiledMapController')
export class TiledMapController extends Component {
    @property(TiledMap)
    public tiledMap: TiledMap | null = null;

    @property(Prefab)
    public storeNodePrefab: Prefab | null = null;

    @property
    public storeLayerName: string = 'stores';

    @property
    public supplierDropAreaLayer: string = 'drop_zones';

    @property
    public scaleFactor: number = 1;

    private _mapConfig: TiledMapConfig | null = null;
    private _storeNodes: Map<string, StoreNode> = new Map();

    onLoad() {
        EventManager.getInstance().on(GameEvents.SUPPLIER_DROPPED, this.onSupplierDropped.bind(this));
    }

    start() {
        this.initMap();
        this.createStoreNodes();
    }

    onDestroy() {
        EventManager.getInstance().off(GameEvents.SUPPLIER_DROPPED, this.onSupplierDropped.bind(this));
    }

    private initMap(): void {
        if (!this.tiledMap) return;

        const mapSize = this.tiledMap.getMapSize();
        const tileSize = this.tiledMap.getTileSize();

        this._mapConfig = {
            tileWidth: tileSize.width,
            tileHeight: tileSize.height,
            mapWidth: mapSize.width,
            mapHeight: mapSize.height,
            storeLayerName: this.storeLayerName,
            supplierLayerName: this.supplierDropAreaLayer
        };
    }

    private createStoreNodes(): void {
        if (!this.tiledMap || !this.storeNodePrefab || !this._mapConfig) return;

        const stores = ConfigManager.getInstance().getListConfig<Store>(ConfigKeys.STORES);
        const storeLayer = this.tiledMap.getLayer(this.storeLayerName);

        for (const store of stores) {
            const storeNode = instantiate(this.storeNodePrefab);
            storeNode.name = `store_${store.id}`;
            storeNode.setParent(this.node);

            const worldPos = this.tileToWorldPosition(store.tileX, store.tileY);
            storeNode.setPosition(worldPos);
            storeNode.setScale(new Vec3(this.scaleFactor, this.scaleFactor, 1));

            const storeComp = storeNode.getComponent(StoreNode);
            if (storeComp) {
                storeComp.setStoreData(store);
                this._storeNodes.set(store.id, storeComp);

                const supplierPanel = find('Canvas/SupplierPanel');
                if (supplierPanel) {
                    const panelComp = supplierPanel.getComponent('SupplierPanel') as any;
                    if (panelComp && panelComp.registerDropTarget) {
                        panelComp.registerDropTarget(store.id, storeNode);
                    }
                }
            }
        }
    }

    public tileToWorldPosition(tileX: number, tileY: number): Vec3 {
        if (!this._mapConfig) return new Vec3();

        const x = (tileX + 0.5) * this._mapConfig.tileWidth * this.scaleFactor;
        const y = -(tileY + 0.5) * this._mapConfig.tileHeight * this.scaleFactor;

        return new Vec3(x, y, 0);
    }

    public worldToTilePosition(worldX: number, worldY: number): { x: number; y: number } {
        if (!this._mapConfig) return { x: 0, y: 0 };

        const tileX = Math.floor(worldX / (this._mapConfig.tileWidth * this.scaleFactor));
        const tileY = Math.floor(-worldY / (this._mapConfig.tileHeight * this.scaleFactor));

        return { x: tileX, y: tileY };
    }

    public getStoreAtTile(tileX: number, tileY: number): Store | null {
        const stores = ConfigManager.getInstance().getListConfig<Store>(ConfigKeys.STORES);
        return stores.find(s => s.tileX === tileX && s.tileY === tileY) || null;
    }

    public getStoreNode(storeId: string): StoreNode | null {
        return this._storeNodes.get(storeId) || null;
    }

    public getAllStoreNodes(): StoreNode[] {
        return Array.from(this._storeNodes.values());
    }

    private onSupplierDropped(data: { supplierId: string; worldPosition: Vec3; cardNode: Node }): void {
        if (!this._mapConfig) return;

        const tilePos = this.worldToTilePosition(data.worldPosition.x, data.worldPosition.y);
        const store = this.getStoreAtTile(tilePos.x, tilePos.y);

        if (store) {
            const storeNode = this._storeNodes.get(store.id);
            if (storeNode) {
                storeNode.showAlert(true);
                setTimeout(() => storeNode.showAlert(false), 2000);
            }
        }
    }

    public getMapConfig(): TiledMapConfig | null {
        return this._mapConfig;
    }

    public highlightTile(tileX: number, tileY: number, color: any): void {
        if (!this.tiledMap || !this._mapConfig) return;

        const layer = this.tiledMap.getLayer(this.supplierDropAreaLayer);
        if (!layer) return;

        const tile = layer.getTiledTileAt(tileX, tileY, true);
        if (tile && tile.node) {
            tile.node.active = true;
        }
    }

    public clearHighlights(): void {
        if (!this.tiledMap) return;

        const layer = this.tiledMap.getLayer(this.supplierDropAreaLayer);
        if (!layer) return;

        for (let x = 0; x < (this._mapConfig?.mapWidth || 0); x++) {
            for (let y = 0; y < (this._mapConfig?.mapHeight || 0); y++) {
                const tile = layer.getTiledTileAt(x, y, false);
                if (tile && tile.node) {
                    tile.node.active = false;
                }
            }
        }
    }
}
