import { EventManager, GameEvents } from '../utils/EventManager';

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
  private _tiledMap: any = null;
  private _mapObjects: MapObject[] = [];
  private _interactiveObjects: MapObject[] = [];
  private _playerPosition: { x: number; y: number } = { x: 0, y: 0 };

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
    if (tiledMapAsset && this._node) {
      const tiledMap = this._node.getComponent(cc.TiledMap);
      if (tiledMap) {
        tiledMap.tmxAsset = tiledMapAsset;
      }
    }
    this.parseMapObjects();
  }

  private parseMapObjects(): void {
    if (!this._tiledMap && this._node) {
      this._tiledMap = this._node.getComponent(cc.TiledMap);
    }

    if (!this._tiledMap) return;

    this._mapObjects = [];
    this._interactiveObjects = [];

    const objectGroups = this._tiledMap.getObjectGroups();
    if (!objectGroups) return;

    for (const group of objectGroups) {
      const objects = group.getObjects();
      if (!objects) continue;

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

  public getObjectPosition(obj: MapObject): { x: number; y: number } {
    if (!this._tiledMap) return { x: 0, y: 0 };

    const mapSize = this._tiledMap.getMapSize();
    const tileSize = this._tiledMap.getTileSize();

    return {
      x: obj.x,
      y: mapSize.height * tileSize.height - obj.y,
    };
  }

  public worldToTile(worldX: number, worldY: number): { x: number; y: number } {
    if (!this._tiledMap) return { x: 0, y: 0 };

    const tileSize = this._tiledMap.getTileSize();
    const mapSize = this._tiledMap.getMapSize();

    return {
      x: Math.floor(worldX / tileSize.width),
      y: Math.floor((mapSize.height * tileSize.height - worldY) / tileSize.height),
    };
  }

  public isWalkable(tileX: number, tileY: number): boolean {
    if (!this._tiledMap) return true;

    const collisionLayer = this._tiledMap.getLayer('collision');
    if (!collisionLayer) return true;

    const tile = collisionLayer.getTileAt(tileX, tileY);
    return !tile;
  }

  public getPlayerSpawnPoint(): { x: number; y: number } | null {
    const spawnPoints = this.getObjectsByType('spawn');
    if (spawnPoints.length > 0) {
      return this.getObjectPosition(spawnPoints[0]);
    }
    return null;
  }

  public onObjectAtPosition(x: number, y: number): MapObject | null {
    for (const obj of this._interactiveObjects) {
      const pos = this.getObjectPosition(obj);
      const distance = Math.sqrt(Math.pow(x - pos.x, 2) + Math.pow(y - pos.y, 2));
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
