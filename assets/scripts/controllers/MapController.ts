import { _decorator, Component, Node, TiledMap, TiledLayer, UITransform, Vec3, Label, Sprite, Color, Graphics } from 'cc';
import { Position } from '../types/GameTypes';
import { MAP_LOCATIONS } from '../config/GameConfig';

const { ccclass, property } = _decorator;

@ccclass('MapController')
export class MapController extends Component {
    @property(TiledMap)
    tiledMap: TiledMap | null = null;

    @property(Node)
    locationMarkersContainer: Node | null = null;

    @property(Node)
    locationMarkerPrefab: Node | null = null;

    @property(Node)
    roadLayer: Node | null = null;

    @property(Graphics)
    pathGraphics: Graphics | null = null;

    private locationMarkers: Map<string, Node> = new Map();
    private roadPaths: Array<{ start: Vec3; end: Vec3 }> = [];
    private mapSize: { width: number; height: number } = { width: 1280, height: 720 };

    onLoad() {
        this.initMap();
        this.createLocationMarkers();
        this.parseRoadPaths();
    }

    private initMap() {
        if (!this.tiledMap) return;

        const mapSize = this.tiledMap.getMapSize();
        const tileSize = this.tiledMap.getTileSize();
        this.mapSize = {
            width: mapSize.width * tileSize.width,
            height: mapSize.height * tileSize.height,
        };

        const transform = this.tiledMap.node.getComponent(UITransform);
        if (transform) {
            transform.setContentSize(this.mapSize.width, this.mapSize.height);
        }

        this.tiledMap.node.setPosition(-this.mapSize.width / 2, -this.mapSize.height / 2, 0);
    }

    private createLocationMarkers() {
        if (!this.locationMarkersContainer || !this.locationMarkerPrefab) return;

        MAP_LOCATIONS.forEach(location => {
            const marker = this.locationMarkerPrefab!.clone();
            marker.name = `Marker_${location.name}`;

            const markerPos = this.mapToWorldPosition(location.x, location.y);
            marker.setPosition(markerPos);

            const label = marker.getComponentInChildren(Label);
            if (label) {
                label.string = location.name;
            }

            const sprite = marker.getComponent(Sprite);
            if (sprite) {
                sprite.color = this.getLocationColor(location.name);
            }

            marker.on(Node.EventType.TOUCH_START, () => {
                this.onLocationClicked(location);
            }, this);

            this.locationMarkersContainer!.addChild(marker);
            this.locationMarkers.set(location.name, marker);
        });
    }

    private getLocationColor(locationName: string): Color {
        const colorMap: Record<string, Color> = {
            '阳光小区': new Color(100, 200, 255),
            '中心医院': new Color(255, 100, 100),
            '万达广场': new Color(255, 200, 100),
            '科技园A区': new Color(100, 255, 100),
            '大学城': new Color(200, 100, 255),
            '美食街': new Color(255, 150, 50),
            '火车站': new Color(150, 150, 150),
            '居民区': new Color(100, 150, 255),
            '物流园': new Color(200, 200, 100),
            '超市总店': new Color(0, 200, 150),
            '写字楼': new Color(200, 100, 100),
            '公园东门': new Color(50, 200, 50),
        };
        return colorMap[locationName] || new Color(255, 255, 255);
    }

    private parseRoadPaths() {
        if (!this.tiledMap) return;

        const objectGroup = this.tiledMap.getObjectGroup('Pathfinding');
        if (!objectGroup) return;

        const objects = objectGroup.getObjects();
        objects.forEach(obj => {
            if (obj && obj.polylinePoints && obj.polylinePoints.length >= 2) {
                const points = obj.polylinePoints;
                for (let i = 0; i < points.length - 1; i++) {
                    const start = this.mapToWorldPosition(points[i].x, points[i].y);
                    const end = this.mapToWorldPosition(points[i + 1].x, points[i + 1].y);
                    this.roadPaths.push({ start, end });
                }
            }
        });
    }

    private mapToWorldPosition(x: number, y: number): Vec3 {
        return new Vec3(
            x - this.mapSize.width / 2,
            this.mapSize.height / 2 - y,
            0
        );
    }

    private worldToMapPosition(worldPos: Vec3): { x: number; y: number } {
        return {
            x: worldPos.x + this.mapSize.width / 2,
            y: this.mapSize.height / 2 - worldPos.y,
        };
    }

    private onLocationClicked(location: Position) {
        this.node.emit('location-clicked', location);
    }

    highlightLocation(locationName: string, highlight: boolean = true) {
        const marker = this.locationMarkers.get(locationName);
        if (!marker) return;

        const sprite = marker.getComponent(Sprite);
        if (sprite) {
            if (highlight) {
                const originalColor = this.getLocationColor(locationName);
                sprite.color = new Color(
                    Math.min(255, originalColor.r + 100),
                    Math.min(255, originalColor.g + 100),
                    Math.min(255, originalColor.b + 100),
                    255
                );
                marker.setScale(1.3, 1.3, 1);
            } else {
                sprite.color = this.getLocationColor(locationName);
                marker.setScale(1, 1, 1);
            }
        }
    }

    showOrderPath(pickup: Position, delivery: Position) {
        if (!this.pathGraphics) return;

        this.pathGraphics.clear();

        const startPos = this.mapToWorldPosition(pickup.x, pickup.y);
        const endPos = this.mapToWorldPosition(delivery.x, delivery.y);

        const path = this.findPath(startPos, endPos);

        if (path.length >= 2) {
            this.pathGraphics.strokeColor = new Color(255, 200, 0, 200);
            this.pathGraphics.lineWidth = 4;
            this.pathGraphics.lineDash = [10, 5];

            this.pathGraphics.moveTo(path[0].x, path[0].y);
            for (let i = 1; i < path.length; i++) {
                this.pathGraphics.lineTo(path[i].x, path[i].y);
            }
            this.pathGraphics.stroke();

            this.pathGraphics.fillColor = new Color(0, 255, 0, 255);
            this.pathGraphics.circle(path[0].x, path[0].y, 8);
            this.pathGraphics.fill();

            this.pathGraphics.fillColor = new Color(255, 0, 0, 255);
            this.pathGraphics.circle(path[path.length - 1].x, path[path.length - 1].y, 8);
            this.pathGraphics.fill();
        }
    }

    private findPath(start: Vec3, end: Vec3): Vec3[] {
        const path: Vec3[] = [];

        const snappedStart = this.snapToRoad(start);
        const snappedEnd = this.snapToRoad(end);

        path.push(start);
        path.push(snappedStart);

        const midX = (snappedStart.x + snappedEnd.x) / 2;
        const midY = (snappedStart.y + snappedEnd.y) / 2;

        if (Math.abs(snappedStart.x - snappedEnd.x) > Math.abs(snappedStart.y - snappedEnd.y)) {
            path.push(new Vec3(snappedEnd.x, snappedStart.y, 0));
        } else {
            path.push(new Vec3(snappedStart.x, snappedEnd.y, 0));
        }

        path.push(snappedEnd);
        path.push(end);

        return path;
    }

    private snapToRoad(pos: Vec3): Vec3 {
        let nearestPoint = pos.clone();
        let minDistance = Infinity;

        const roadPositions = [
            new Vec3(0, -216, 0),
            new Vec3(0, -72, 0),
            new Vec3(0, 72, 0),
            new Vec3(0, 216, 0),
            new Vec3(-320, 0, 0),
            new Vec3(0, 0, 0),
            new Vec3(320, 0, 0),
        ];

        for (const roadPos of roadPositions) {
            for (let x = -600; x <= 600; x += 100) {
                for (let y = -300; y <= 300; y += 100) {
                    const testPos = new Vec3(
                        roadPos.x !== 0 ? roadPos.x : x,
                        roadPos.y !== 0 ? roadPos.y : y,
                        0
                    );

                    const dist = Vec3.distance(pos, testPos);
                    if (dist < minDistance) {
                        minDistance = dist;
                        nearestPoint = testPos.clone();
                    }
                }
            }
        }

        return nearestPoint;
    }

    clearOrderPath() {
        if (this.pathGraphics) {
            this.pathGraphics.clear();
        }
    }

    getMapSize(): { width: number; height: number } {
        return { ...this.mapSize };
    }

    getAllLocations(): Position[] {
        return [...MAP_LOCATIONS];
    }

    getLocationByName(name: string): Position | undefined {
        return MAP_LOCATIONS.find(loc => loc.name === name);
    }

    updateMarkerPosition(locationName: string, worldPos: Vec3) {
        const marker = this.locationMarkers.get(locationName);
        if (marker) {
            marker.setPosition(worldPos);
        }
    }

    showAllMarkers(show: boolean) {
        this.locationMarkers.forEach(marker => {
            marker.active = show;
        });
    }
}
