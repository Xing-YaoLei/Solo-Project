import { _decorator, Component, Node, TiledMap, TiledLayer, Sprite, Color, Label, Vec3, tween } from 'cc';
import { GameManager } from '../core/GameManager';
import { ScenicSpot } from '../models';
const { ccclass, property } = _decorator;

@ccclass('ScenicMap')
export class ScenicMap extends Component {
    @property(TiledMap)
    tiledMap: TiledMap | null = null;

    @property(Node)
    markersContainer: Node | null = null;

    @property(Prefab)
    spotMarkerPrefab: any = null;

    private spotMarkers: Map<string, Node> = new Map();

    start() {
        this.initMarkers();
    }

    public initMarkers(): void {
        const gameManager = GameManager.instance;
        if (!gameManager || !this.markersContainer) return;

        this.clearMarkers();

        const spots = gameManager.getScenicSpots();
        for (const spot of spots) {
            this.createSpotMarker(spot);
        }
    }

    private clearMarkers(): void {
        if (!this.markersContainer) return;
        this.markersContainer.removeAllChildren();
        this.spotMarkers.clear();
    }

    private createSpotMarker(spot: ScenicSpot): void {
        if (!this.markersContainer) return;

        const markerNode = new Node(`SpotMarker_${spot.id}`);
        const bgSprite = markerNode.addComponent(Sprite);
        bgSprite.type = Sprite.Type.SIMPLE;
        bgSprite.color = new Color().fromHEX(spot.color);

        const nameNode = new Node('NameLabel');
        const nameLabel = nameNode.addComponent(Label);
        nameLabel.string = spot.name;
        nameLabel.fontSize = 12;
        nameLabel.color = Color.WHITE;
        nameNode.setPosition(0, -20, 0);
        markerNode.addChild(nameNode);

        const countNode = new Node('CountLabel');
        const countLabel = countNode.addComponent(Label);
        const totalBooked = spot.getTotalBookedCount();
        countLabel.string = `${totalBooked}/${spot.dailyCapacity}`;
        countLabel.fontSize = 10;
        countLabel.color = Color.WHITE;
        countNode.setPosition(0, 20, 0);
        markerNode.addChild(countNode);

        markerNode.setPosition(spot.mapPosition.x - 400, spot.mapPosition.y - 300, 0);
        markerNode.setScale(1, 1, 1);

        this.markersContainer.addChild(markerNode);
        this.spotMarkers.set(spot.id, markerNode);
    }

    public highlightSpot(spotId: string): void {
        const marker = this.spotMarkers.get(spotId);
        if (!marker) return;

        tween(marker)
            .to(0.2, { scale: new Vec3(1.2, 1.2, 1) })
            .to(0.2, { scale: new Vec3(1, 1, 1) })
            .start();
    }

    public updateSpotInfo(spotId: string): void {
        const marker = this.spotMarkers.get(spotId);
        if (!marker) return;

        const gameManager = GameManager.instance;
        const spot = gameManager?.getScenicSpot(spotId);
        if (!spot) return;

        const countNode = marker.getChildByName('CountLabel');
        if (countNode) {
            const label = countNode.getComponent(Label);
            if (label) {
                const totalBooked = spot.getTotalBookedCount();
                label.string = `${totalBooked}/${spot.dailyCapacity}`;
            }
        }
    }

    public refreshAllSpots(): void {
        const gameManager = GameManager.instance;
        if (!gameManager) return;

        const spots = gameManager.getScenicSpots();
        for (const spot of spots) {
            this.updateSpotInfo(spot.id);
        }
    }
}
