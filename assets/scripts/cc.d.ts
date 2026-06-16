declare module 'cc' {
    export const _decorator: {
        ccclass: (name: string) => ClassDecorator;
        property: PropertyDecorator;
        executeInEditMode: (target: Function) => void;
        menu: (path: string) => ClassDecorator;
        requireComponent: (component: Function) => ClassDecorator;
        disallowMultiple: (target: Function) => void;
        executionOrder: (order: number) => ClassDecorator;
    };

    export class Component {
        node: Node;
        enabled: boolean;
        onLoad(): void;
        start(): void;
        update(dt: number): void;
        lateUpdate(dt: number): void;
        onDestroy(): void;
        onEnable(): void;
        onDisable(): void;
        schedule(callback: Function, interval?: number, repeat?: number, delay?: number): void;
        scheduleOnce(callback: Function, delay?: number): void;
        unschedule(callback: Function): void;
        unscheduleAllCallbacks(): void;
    }

    export class Node {
        static EventType: {
            TOUCH_START: string;
            TOUCH_MOVE: string;
            TOUCH_END: string;
            TOUCH_CANCEL: string;
            MOUSE_DOWN: string;
            MOUSE_MOVE: string;
            MOUSE_UP: string;
            MOUSE_WHEEL: string;
            SIZE_CHANGED: string;
            POSITION_CHANGED: string;
        };
        name: string;
        active: boolean;
        opacity: number;
        angle: number;
        scale: Vec3;
        position: Vec3;
        parent: Node | null;
        children: Node[];
        x: number;
        y: number;
        z: number;
        width: number;
        height: number;
        activeInHierarchy: boolean;
        uuid: string;
        on(type: string, callback: Function, target?: any, useCapture?: boolean): typeof this;
        off(type: string, callback?: Function, target?: any): typeof this;
        emit(type: string, ...args: any[]): void;
        addChild(child: Node): void;
        removeChild(child: Node, cleanup?: boolean): void;
        removeAllChildren(): void;
        getChildByName(name: string): Node | null;
        getChildByUuid(uuid: string): Node | null;
        getComponent<T extends Component>(type: new () => T): T | null;
        getComponent(type: string): Component | null;
        getComponent<T extends Component>(type: { new (...args: any[]): T }): T | null;
        getComponents<T extends Component>(type: new () => T): T[];
        getComponentInChildren<T extends Component>(type: new () => T): T | null;
        getComponentsInChildren<T extends Component>(type: new () => T): T[];
        addComponent<T extends Component>(type: new () => T): T;
        removeComponent(component: Component): void;
        setSiblingIndex(index: number): void;
        setPosition(x: number | Vec3, y?: number, z?: number): void;
        getPosition(): Vec3;
        destroy(): boolean;
        instantiate(): Node;
        convertToNodeSpaceAR(worldPoint: Vec3): Vec3;
        convertToWorldSpaceAR(localPoint: Vec3): Vec3;
    }

    export function instantiate(original: Node | Prefab): Node;

    export class Vec3 {
        static readonly ZERO: Vec3;
        static readonly ONE: Vec3;
        static readonly UNIT_X: Vec3;
        static readonly UNIT_Y: Vec3;
        static readonly UNIT_Z: Vec3;
        x: number;
        y: number;
        z: number;
        constructor(x?: number, y?: number, z?: number);
        set(x?: number, y?: number, z?: number): Vec3;
        equals(other: Vec3, epsilon?: number): boolean;
        length(): number;
        normalize(): Vec3;
        clone(): Vec3;
    }

    export class Color {
        static readonly WHITE: Color;
        static readonly BLACK: Color;
        static readonly RED: Color;
        static readonly GREEN: Color;
        static readonly BLUE: Color;
        static readonly YELLOW: Color;
        static readonly TRANSPARENT: Color;
        r: number;
        g: number;
        b: number;
        a: number;
        constructor(r?: number, g?: number, b?: number, a?: number);
        fromHEX(hex: string): Color;
        toHEX(format?: string): string;
        clone(): Color;
    }

    export class Label extends Component {
        static Overflow: {
            NONE: number;
            CLAMP: number;
            SHRINK: number;
            RESIZE_HEIGHT: number;
        };
        static HorizontalAlign: {
            LEFT: number;
            CENTER: number;
            RIGHT: number;
        };
        static VerticalAlign: {
            TOP: number;
            CENTER: number;
            BOTTOM: number;
        };
        string: string;
        fontSize: number;
        lineHeight: number;
        color: Color;
        horizontalAlign: number;
        verticalAlign: number;
        overflow: number;
        enableWrapText: boolean;
    }

    export class Sprite extends Component {
        static Type: {
            SIMPLE: number;
            SLICED: number;
            TILED: number;
            FILLED: number;
        };
        spriteFrame: SpriteFrame | null;
        type: number;
        sizeMode: number;
        color: Color;
    }

    export class SpriteFrame {
        rect: Rect;
        originalSize: Size;
    }

    export class Rect {
        x: number;
        y: number;
        width: number;
        height: number;
        constructor(x?: number, y?: number, w?: number, h?: number);
    }

    export class Size {
        width: number;
        height: number;
        constructor(w?: number, h?: number);
    }

    export class Button extends Component {
        static EventType: {
            CLICK: string;
        };
        interactable: boolean;
        transition: number;
        clickEvents: Component[];
        node: Node;
    }

    export class Toggle extends Component {
        static EventType: {
            TOGGLE: string;
        };
        isChecked: boolean;
        node: Node;
    }

    export class ProgressBar extends Component {
        progress: number;
        barSprite: Sprite | null;
        mode: number;
        totalLength: number;
        reverse: boolean;
    }

    export class ScrollView extends Component {
        content: Node | null;
        horizontal: boolean;
        vertical: boolean;
        scrollToOffset(offset: Vec3, timeInSeconds?: number, attenuated?: boolean): void;
        scrollToLeft(timeInSeconds?: number, attenuated?: boolean): void;
        scrollToRight(timeInSeconds?: number, attenuated?: boolean): void;
        scrollToTop(timeInSeconds?: number, attenuated?: boolean): void;
        scrollToBottom(timeInSeconds?: number, attenuated?: boolean): void;
    }

    export class Layout extends Component {
        static Type: {
            NONE: number;
            HORIZONTAL: number;
            VERTICAL: number;
            GRID: number;
        };
        type: number;
        resizeMode: number;
        horizontalDirection: number;
        verticalDirection: number;
        paddingLeft: number;
        paddingRight: number;
        paddingTop: number;
        paddingBottom: number;
        spacingX: number;
        spacingY: number;
        updateLayout(): void;
    }

    export class UITransform extends Component {
        width: number;
        height: number;
        anchorX: number;
        anchorY: number;
        setContentSize(width: number | Size, height?: number): void;
        convertToNodeSpaceAR(worldPoint: Vec3): Vec3;
        convertToWorldSpaceAR(localPoint: Vec3): Vec3;
    }

    export class TiledMap extends Component {
        tmxAsset: TiledMapAsset | null;
        getMapSize(): Size;
        getTileSize(): Size;
        getLayer(name: string): TiledLayer | null;
        getObjectGroup(name: string): TiledObjectGroup | null;
    }

    export class TiledLayer {
        getTileGIDAt(x: number, y: number): number;
        setTileGIDAt(gid: number, x: number, y: number): void;
        removeTileAt(x: number, y: number): void;
        getTileAt(x: number, y: number): Node | null;
        getNodeAt(x: number, y: number): Node | null;
    }

    export class TiledObjectGroup {
        getObjects(): any[];
        getObject(name: string): any;
    }

    export class TiledMapAsset extends Asset {}

    export class Asset {
        name: string;
        nativeUrl: string;
        destroy(): boolean;
    }

    export class JsonAsset extends Asset {
        json: any;
    }

    export class Prefab extends Asset {}

    export class Scene extends Asset {
        name: string;
    }

    export namespace director {
        function loadScene(sceneName: string, onLoaded?: (error: Error | null, scene?: Scene) => void): void;
        function loadScene(sceneName: string, onLoaded?: (error: Error | null, scene?: Scene) => void): void;
        function getScene(): Scene | null;
        function getRunningScene(): Scene | null;
        function preloadScene(sceneName: string, onLoaded?: (error: Error | null) => void): void;
    }

    export namespace resources {
        function load(path: string, type: any, callback: (error: Error | null, asset: any) => void): void;
        function loadDir(path: string, type: any, callback: (error: Error | null, assets: any[]) => void): void;
        function release(path: string): void;
        function releaseDir(path: string): void;
        function releaseAsset(asset: Asset): void;
    }

    export namespace sys {
        namespace localStorage {
            function getItem(key: string): string | null;
            function setItem(key: string, value: string): void;
            function removeItem(key: string): void;
            function clear(): void;
        }
        const language: string;
        const os: string;
        const platform: number;
    }

    export function tween(target: any): Tween;

    export class Tween {
        to(duration: number, props: any, opts?: any): Tween;
        by(duration: number, props: any, opts?: any): Tween;
        delay(duration: number): Tween;
        call(callback: Function): Tween;
        repeat(repeatTimes: number, tween: Tween): Tween;
        repeatForever(tween: Tween): Tween;
        sequence(...tweens: Tween[]): Tween;
        parallel(...tweens: Tween[]): Tween;
        start(): Tween;
        stop(): Tween;
        clone(): Tween;
    }

    export class Mask extends Component {
        static Type: {
            RECT: number;
            ELLIPSE: number;
            GRAPHICS_STENCIL: number;
        };
        type: number;
        inverted: boolean;
    }

    export class PageView extends Component {}
    export class EditBox extends Component {}
    export class Slider extends Component {}

    export const math: {
        Vec2: any;
        Vec3: typeof Vec3;
        Vec4: any;
        Mat3: any;
        Mat4: any;
        Quat: any;
        Color: typeof Color;
        Size: typeof Size;
        Rect: typeof Rect;
    };
}
