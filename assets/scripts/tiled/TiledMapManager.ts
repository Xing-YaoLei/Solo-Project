import { _decorator, Component, Node, TiledMap, TiledLayer, UITransform, Vec3, tween, Color, Sprite, Label } from 'cc';
import { ResourceLoader } from '../core/ResourceLoader';

const { ccclass, property } = _decorator;

export interface MapArea {
    id: string;
    name: string;
    type: string;
    x: number;
    y: number;
    width: number;
    height: number;
}

@ccclass('TiledMapManager')
export class TiledMapManager extends Component {
    @property(TiledMap)
    tiledMap: TiledMap | null = null;

    @property(Node)
    interactionLayer: Node | null = null;

    @property(Node)
    highlightNode: Node | null = null;

    @property(Sprite)
    playerCharacter: Sprite | null = null;

    @property(Label)
    areaHintLabel: Label | null = null;

    public onAreaClicked: ((areaId: string) => void) | null = null;

    private mapAreas: MapArea[] = [];
    private currentMapName: string = '';
    private isMapLoaded: boolean = false;

    public async loadMap(mapName: string): Promise<boolean> {
        this.currentMapName = mapName;

        try {
            const mapAsset = await ResourceLoader.instance.loadAsset(
                `tiled-maps/${mapName}`,
                TiledMap
            );

            if (mapAsset && this.tiledMap) {
                this.tiledMap.tmxAsset = mapAsset as any;
                this.setupInteractionLayer();
                this.parseMapAreas();
                this.isMapLoaded = true;
                return true;
            }
        } catch (error) {
            console.error(`Failed to load map ${mapName}:`, error);
        }

        this.createMockMap();
        return false;
    }

    private setupInteractionLayer(): void {
        if (!this.interactionLayer) return;

        this.interactionLayer.on(Node.EventType.TOUCH_END, this.onMapClicked, this);

        const uiTransform = this.interactionLayer.getComponent(UITransform);
        if (uiTransform && this.tiledMap) {
            const mapSize = this.tiledMap.getMapSize();
            const tileSize = this.tiledMap.getTileSize();
            uiTransform.setContentSize(mapSize.width * tileSize.width, mapSize.height * tileSize.height);
        }
    }

    private parseMapAreas(): void {
        if (!this.tiledMap) return;

        const objectGroup = this.tiledMap.getObjectGroup('interactive_areas');
        if (!objectGroup) {
            this.createDefaultAreas();
            return;
        }

        const objects = objectGroup.getObjects();
        this.mapAreas = objects.map((obj: any) => ({
            id: obj.name || obj.id,
            name: obj.name || '未知区域',
            type: obj.type || 'default',
            x: obj.x,
            y: obj.y,
            width: obj.width,
            height: obj.height
        }));
    }

    private createDefaultAreas(): void {
        this.mapAreas = [
            { id: 'prescription_area', name: '处方审核区', type: 'prescription', x: 100, y: 300, width: 150, height: 120 },
            { id: 'replenishment_area', name: '补货区', type: 'replenishment', x: 350, y: 300, width: 150, height: 120 },
            { id: 'insurance_area', name: '医保前台', type: 'insurance', x: 600, y: 300, width: 150, height: 120 }
        ];
    }

    private createMockMap(): void {
        if (!this.tiledMap) return;

        this.createDefaultAreas();
        this.isMapLoaded = true;
        console.log('使用模拟地图数据');
    }

    private onMapClicked(event: any): void {
        if (!this.isMapLoaded || !this.interactionLayer) return;

        const touchPos = event.getUILocation();
        const localPos = this.interactionLayer.getComponent(UITransform)?.convertToNodeSpaceAR(new Vec3(touchPos.x, touchPos.y, 0));

        if (!localPos) return;

        const clickedArea = this.getAreaAtPosition(localPos.x, localPos.y);
        if (clickedArea) {
            this.showAreaHint(clickedArea);
            this.movePlayerTo(clickedArea);

            if (this.onAreaClicked) {
                this.onAreaClicked(clickedArea.id);
            }
        }
    }

    private getAreaAtPosition(x: number, y: number): MapArea | null {
        for (const area of this.mapAreas) {
            if (x >= area.x && x <= area.x + area.width &&
                y >= area.y && y <= area.y + area.height) {
                return area;
            }
        }
        return null;
    }

    private showAreaHint(area: MapArea): void {
        if (!this.areaHintLabel) return;

        this.areaHintLabel.string = `点击查看：${area.name}`;
        this.areaHintLabel.node.opacity = 255;

        tween(this.areaHintLabel.node)
            .delay(1.5)
            .to(0.5, { opacity: 0 })
            .start();
    }

    private movePlayerTo(area: MapArea): void {
        if (!this.playerCharacter) return;

        const targetX = area.x + area.width / 2;
        const targetY = area.y - 20;

        tween(this.playerCharacter.node)
            .to(0.5, { position: new Vec3(targetX, targetY, 0) })
            .start();
    }

    public highlightTaskArea(taskIndex: number): void {
        if (!this.highlightNode) return;

        const areas = ['prescription_area', 'replenishment_area', 'insurance_area'];
        const areaId = areas[taskIndex % areas.length];
        const area = this.mapAreas.find(a => a.id === areaId);

        if (!area) return;

        this.highlightNode.active = true;
        this.highlightNode.setPosition(area.x + area.width / 2, area.y + area.height / 2, 0);

        const uiTransform = this.highlightNode.getComponent(UITransform);
        if (uiTransform) {
            uiTransform.setContentSize(area.width + 20, area.height + 20);
        }

        tween(this.highlightNode)
            .repeatForever(
                tween(this.highlightNode)
                    .to(0.5, { opacity: 200 })
                    .to(0.5, { opacity: 100 })
            )
            .start();
    }

    public setAreaEnabled(areaId: string, enabled: boolean): void {
    }

    public getAllAreas(): MapArea[] {
        return [...this.mapAreas];
    }

    public getMapSize(): { width: number; height: number } {
        if (!this.tiledMap) return { width: 800, height: 600 };
        const mapSize = this.tiledMap.getMapSize();
        const tileSize = this.tiledMap.getTileSize();
        return {
            width: mapSize.width * tileSize.width,
            height: mapSize.height * tileSize.height
        };
    }

    public unloadMap(): void {
        if (this.tiledMap) {
            this.tiledMap.tmxAsset = null;
        }
        this.mapAreas = [];
        this.isMapLoaded = false;
        this.currentMapName = '';
    }

    onDestroy() {
        if (this.interactionLayer) {
            this.interactionLayer.off(Node.EventType.TOUCH_END, this.onMapClicked, this);
        }
        this.unloadMap();
    }
}
