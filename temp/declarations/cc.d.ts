declare module "cc" {
    export const _decorator: any;
    export class Component { node: any; onLoad?(): void; start?(): void; update?(dt: number): void; onDestroy?(): void; }
    export class Node { name: string; active: boolean; children: Node[]; parent: Node | null; scene: any; isValid: boolean; addChild(node: Node): void; removeFromParent(): void; setWorldPosition(pos: any): void; setPosition(x:number,y:number,z?:number): void; getComponent<T>(type: any): T | null; addComponent<T>(type: any): T; emit(event: string, ...args: any[]): void; on(event: string, callback: any, target?: any): void; off(event: string, callback: any, target?: any): void; once(event: string, callback: any, target?: any): void; getChildByName(name: string): Node | null; worldPosition: any; position: any; }
    export const director: any;
    export const find: any;
    export const resources: any;
    export const instantiate: any;
    export const tween: any;
    export const Tween: any;
    export const Vec3: any;
    export const Color: any;
    export class Sprite { spriteFrame: any; sizeMode: any; color: any; static SizeMode: any; }
    export class Label { string: string; color: any; fontSize: number; lineHeight: number; horizontalAlign: any; overflow: any; }
    export class SpriteFrame { texture: any; }
    export class Texture2D { image: any; }
    export class JsonAsset { json: any; }
    export class Prefab { data: any; }
    export class UITransform { setContentSize(w:number,h:number):void; contentSize: any; }
    export class UIOpacity { opacity: number; }
    export class EventTouch { getUILocation(): any; propagationStopped: boolean; }
    export class EventMouse { }
    export const input: any;
    export const Input: any;
    export class AssetManager { assets: any; }
}
