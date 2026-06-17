import { _decorator, Texture2D, ImageAsset, SpriteFrame, Rect, Vec3 } from 'cc';
const { ccclass } = _decorator;

export interface TmxTileset {
    firstgid: number;
    name: string;
    tileWidth: number;
    tileHeight: number;
    tileCount: number;
    columns: number;
    image: string;
    texture: Texture2D | null;
}

export interface TmxTileLayer {
    name: string;
    width: number;
    height: number;
    tiles: number[][];
}

export interface TmxObjectGroup {
    name: string;
    objects: TmxObject[];
}

export interface TmxObject {
    id: number;
    name: string;
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface TmxMapData {
    width: number;
    height: number;
    tileWidth: number;
    tileHeight: number;
    orientation: string;
    tilesets: TmxTileset[];
    layers: TmxTileLayer[];
    objectGroups: TmxObjectGroup[];
}

export interface TmxSpriteFrameCache {
    [gid: number]: SpriteFrame;
}

@ccclass('RuntimeTmxLoader')
export class RuntimeTmxLoader {
    static parseTmx(xmlText: string): TmxMapData {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

        const mapEl = xmlDoc.querySelector('map');
        if (!mapEl) {
            throw new Error('Invalid TMX: no <map> element');
        }

        const mapData: TmxMapData = {
            width: parseInt(mapEl.getAttribute('width') || '0', 10),
            height: parseInt(mapEl.getAttribute('height') || '0', 10),
            tileWidth: parseInt(mapEl.getAttribute('tilewidth') || '0', 10),
            tileHeight: parseInt(mapEl.getAttribute('tileheight') || '0', 10),
            orientation: mapEl.getAttribute('orientation') || 'orthogonal',
            tilesets: [],
            layers: [],
            objectGroups: [],
        };

        const tilesetEls = mapEl.querySelectorAll('tileset');
        tilesetEls.forEach(tsEl => {
            const imgEl = tsEl.querySelector('image');
            const tileset: TmxTileset = {
                firstgid: parseInt(tsEl.getAttribute('firstgid') || '1', 10),
                name: tsEl.getAttribute('name') || '',
                tileWidth: parseInt(tsEl.getAttribute('tilewidth') || '0', 10),
                tileHeight: parseInt(tsEl.getAttribute('tileheight') || '0', 10),
                tileCount: parseInt(tsEl.getAttribute('tilecount') || '0', 10),
                columns: parseInt(tsEl.getAttribute('columns') || '1', 10),
                image: imgEl?.getAttribute('source') || '',
                texture: null,
            };
            mapData.tilesets.push(tileset);
        });

        const layerEls = mapEl.querySelectorAll('layer');
        layerEls.forEach(layerEl => {
            const layer: TmxTileLayer = {
                name: layerEl.getAttribute('name') || '',
                width: parseInt(layerEl.getAttribute('width') || '0', 10),
                height: parseInt(layerEl.getAttribute('height') || '0', 10),
                tiles: [],
            };

            const dataEl = layerEl.querySelector('data');
            if (dataEl) {
                const encoding = dataEl.getAttribute('encoding');
                if (encoding === 'csv') {
                    const csvText = dataEl.textContent?.trim() || '';
                    const rows = csvText
                        .split('\n')
                        .map(r => r.trim())
                        .filter(r => r.length > 0);
                    layer.tiles = rows.map(row =>
                        row
                            .split(',')
                            .map(c => parseInt(c.trim() || '0', 10))
                    );
                }
            }
            mapData.layers.push(layer);
        });

        const objGroupEls = mapEl.querySelectorAll('objectgroup');
        objGroupEls.forEach(ogEl => {
            const group: TmxObjectGroup = {
                name: ogEl.getAttribute('name') || '',
                objects: [],
            };

            const objEls = ogEl.querySelectorAll('object');
            objEls.forEach(objEl => {
                group.objects.push({
                    id: parseInt(objEl.getAttribute('id') || '0', 10),
                    name: objEl.getAttribute('name') || '',
                    x: parseFloat(objEl.getAttribute('x') || '0'),
                    y: parseFloat(objEl.getAttribute('y') || '0'),
                    width: parseFloat(objEl.getAttribute('width') || '0'),
                    height: parseFloat(objEl.getAttribute('height') || '0'),
                });
            });

            mapData.objectGroups.push(group);
        });

        console.log(`[RuntimeTmxLoader] Parsed TMX: ${mapData.width}x${mapData.height}, 
            tilesets: ${mapData.tilesets.length}, layers: ${mapData.layers.length}, 
            objects: ${mapData.objectGroups.reduce((a, g) => a + g.objects.length, 0)}`);

        return mapData;
    }

    static loadImageAsTexture(url: string): Promise<Texture2D> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                try {
                    const imageAsset = new ImageAsset();
                    imageAsset.reset(img);

                    const texture = new Texture2D();
                    texture.image = imageAsset;

                    console.log(`[RuntimeTmxLoader] Loaded texture: ${url} (${img.width}x${img.height})`);
                    resolve(texture);
                } catch (e) {
                    reject(e);
                }
            };
            img.onerror = (err) => {
                console.error(`[RuntimeTmxLoader] Failed to load image: ${url}`, err);
                reject(err);
            };
            img.src = url;
        });
    }

    static loadTextFile(url: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);
            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve(xhr.responseText);
                } else {
                    reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
                }
            };
            xhr.onerror = () => reject(new Error(`Network error fetching ${url}`));
            xhr.send();
        });
    }

    static buildSpriteFrames(mapData: TmxMapData): TmxSpriteFrameCache {
        const cache: TmxSpriteFrameCache = {};

        mapData.tilesets.forEach(tileset => {
            if (!tileset.texture || tileset.tileCount === 0) return;

            const { tileWidth, tileHeight, columns, firstgid, texture } = tileset;

            for (let i = 0; i < tileset.tileCount; i++) {
                const gid = firstgid + i;
                const col = i % columns;
                const row = Math.floor(i / columns);

                const spf = new SpriteFrame();
                spf.texture = texture;

                try {
                    spf.reset({
                        originalSize: { width: tileWidth, height: tileHeight },
                        rect: { x: col * tileWidth, y: row * tileHeight, width: tileWidth, height: tileHeight },
                        offset: { x: 0, y: 0 },
                        borderTop: 0,
                        borderBottom: 0,
                        borderLeft: 0,
                        borderRight: 0,
                    });
                } catch (e) {
                    spf.rect = new Rect(col * tileWidth, row * tileHeight, tileWidth, tileHeight);
                    spf.flipU = false;
                    spf.flipV = false;
                    spf.rotated = false;
                    spf.offset = new Vec3(0, 0, 0);
                }

                cache[gid] = spf;
            }

            console.log(`[RuntimeTmxLoader] Built ${tileset.tileCount} sprite frames for tileset '${tileset.name}'`);
        });

        return cache;
    }

    static findTilesetForGid(mapData: TmxMapData, gid: number): TmxTileset | null {
        for (let i = mapData.tilesets.length - 1; i >= 0; i--) {
            if (gid >= mapData.tilesets[i].firstgid) {
                return mapData.tilesets[i];
            }
        }
        return mapData.tilesets[0] || null;
    }

    static tileToWorldPosition(
        mapData: TmxMapData,
        tileX: number,
        tileY: number,
        scale: number = 1
    ): Vec3 {
        const { width, height, tileWidth, tileHeight } = mapData;
        const x = (tileX - width / 2) * tileWidth * scale + (tileWidth * scale) / 2;
        const y = (height / 2 - tileY) * tileHeight * scale - (tileHeight * scale) / 2;
        return new Vec3(x, y, 0);
    }
}
