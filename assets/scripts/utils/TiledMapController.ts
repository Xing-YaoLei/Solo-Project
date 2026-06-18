import { TiledMap } from 'cc';

export interface MapObject {
  id: string;
  name: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  properties: Record<string, any>;
}

export class TiledMapController {
  private _node: any = null;
  private _tiledMap: TiledMap | null = null;
  private _mapObjects: MapObject[] = [];
  private _interactiveObjects: MapObject[] = [];

  constructor(node?: any) {
    this._node = node || null;
  }

  public get mapObjects(): MapObject[] {
    return [...this._mapObjects];
  }

  public get interactiveObjects(): MapObject[] {
    return [...this._interactiveObjects];
  }

  public init(tiledMapAsset?: any): void {
    if (this._node) {
      const tiledMap = this._node.getComponent(TiledMap) as TiledMap | null;
      if (tiledMap) {
        this._tiledMap = tiledMap;
      }
    }
    this.parseMapObjects();
  }

  private parseMapObjects(): void {
    if (!this._tiledMap && this._node) {
      this._tiledMap = this._node.getComponent(TiledMap) as TiledMap | null;
    }

    if (!this._tiledMap) return;

    this._mapObjects = [];
    this._interactiveObjects = [];

    const objectGroups = (this._tiledMap as any).getObjectGroups?.();
    if (!objectGroups) return;

    for (const group of objectGroups) {
      const objects = group.getObjects?.() || [];
      for (const obj of objects) {
        const mapObj: MapObject = {
          id: obj.id || obj.name || '',
          name: obj.name || '',
          type: obj.type || '',
          x: obj.x || 0,
          y: obj.y || 0,
          width: obj.width || 0,
          height: obj.height || 0,
          properties: obj.properties || {},
        };

        this._mapObjects.push(mapObj);

        if (obj.type === 'interactive' || obj.properties?.interactive) {
          this._interactiveObjects.push(mapObj);
        }
      }
    }
  }

  public getObjectByName(name: string): MapObject | null {
    return this._mapObjects.find(o => o.name === name) || null;
  }

  public getObjectsByType(type: string): MapObject[] {
    return this._mapObjects.filter(o => o.type === type);
  }

  public getPlayerSpawnPoint(): { x: number; y: number } | null {
    const spawnPoints = this.getObjectsByType('spawn');
    if (spawnPoints.length > 0) {
      return { x: spawnPoints[0].x, y: spawnPoints[0].y };
    }
    return null;
  }

  public onObjectAtPosition(x: number, y: number): MapObject | null {
    for (const obj of this._interactiveObjects) {
      const distance = Math.sqrt(Math.pow(x - obj.x, 2) + Math.pow(y - obj.y, 2));
      if (distance < 50) {
        return obj;
      }
    }
    return null;
  }

  public destroy(): void {
    this._node = null;
    this._tiledMap = null;
    this._mapObjects = [];
    this._interactiveObjects = [];
  }
}
