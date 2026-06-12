import { Vec3 } from 'cc';

export interface TiledStoreObject {
    id: string;
    name: string;
    type: 'store' | 'warehouse';
    storeId: string;
    storeName: string;
    position: Vec3;
    width: number;
    height: number;
}

export interface TiledDropZone {
    id: string;
    name: string;
    type: 'drop_zone';
    targetStoreId: string;
    position: Vec3;
    width: number;
    height: number;
}

export interface TiledMapData {
    mapWidth: number;
    mapHeight: number;
    tileWidth: number;
    tileHeight: number;
    stores: TiledStoreObject[];
    dropZones: TiledDropZone[];
}

export class TiledMapParser {
    public static parseMapXml(xmlContent: string): TiledMapData {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');

        const mapElement = xmlDoc.querySelector('map');
        if (!mapElement) {
            throw new Error('Invalid Tiled map: no <map> element');
        }

        const mapWidth = parseInt(mapElement.getAttribute('width') || '30', 10);
        const mapHeight = parseInt(mapElement.getAttribute('height') || '20', 10);
        const tileWidth = parseInt(mapElement.getAttribute('tilewidth') || '64', 10);
        const tileHeight = parseInt(mapElement.getAttribute('tileheight') || '64', 10);

        const pixelWidth = mapWidth * tileWidth;
        const pixelHeight = mapHeight * tileHeight;

        const stores: TiledStoreObject[] = [];
        const dropZones: TiledDropZone[] = [];

        const objectGroups = xmlDoc.querySelectorAll('objectgroup');
        objectGroups.forEach(group => {
            const objects = group.querySelectorAll('object');
            objects.forEach(obj => {
                const type = obj.getAttribute('type') || '';
                const x = parseFloat(obj.getAttribute('x') || '0');
                const y = parseFloat(obj.getAttribute('y') || '0');
                const width = parseFloat(obj.getAttribute('width') || '128');
                const height = parseFloat(obj.getAttribute('height') || '128');

                const properties: Record<string, string> = {};
                const propElements = obj.querySelectorAll('property');
                propElements.forEach(prop => {
                    const name = prop.getAttribute('name') || '';
                    const value = prop.getAttribute('value') || '';
                    if (name) properties[name] = value;
                });

                const centerX = x + width / 2;
                const centerY = y + height / 2;
                const cocosPos = this.tiledPixelToCocos(centerX, centerY, pixelWidth, pixelHeight);

                if (type === 'store' || type === 'warehouse') {
                    stores.push({
                        id: obj.getAttribute('id') || '',
                        name: obj.getAttribute('name') || '',
                        type: type as 'store' | 'warehouse',
                        storeId: properties.storeId || '',
                        storeName: properties.storeName || '',
                        position: cocosPos,
                        width,
                        height
                    });
                } else if (type === 'drop_zone') {
                    dropZones.push({
                        id: obj.getAttribute('id') || '',
                        name: obj.getAttribute('name') || '',
                        type: 'drop_zone',
                        targetStoreId: properties.targetStoreId || '',
                        position: cocosPos,
                        width,
                        height
                    });
                }
            });
        });

        return {
            mapWidth: pixelWidth,
            mapHeight: pixelHeight,
            tileWidth,
            tileHeight,
            stores,
            dropZones
        };
    }

    private static tiledPixelToCocos(
        tiledX: number,
        tiledY: number,
        mapPixelWidth: number,
        mapPixelHeight: number
    ): Vec3 {
        const centerOffsetX = mapPixelWidth / 2;
        const centerOffsetY = mapPixelHeight / 2;
        const cocosX = tiledX - centerOffsetX;
        const cocosY = centerOffsetY - tiledY;
        return new Vec3(cocosX, cocosY, 0);
    }
}
