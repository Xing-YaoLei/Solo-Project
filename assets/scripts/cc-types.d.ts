declare module 'cc' {

    export namespace _decorator {
        function ccclass(name?: string): any;
        function property(options?: any): any;
        function executeInEditMode(target: any): void;
        function menu(path: string): any;
        function requireComponent(component: any): any;
        function disallowMultiple(target: any): void;
        function executionOrder(order: number): any;
    }

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
        on(type: string, callback: Function, target?: any, useCapture?: boolean): Node;
        off(type: string, callback?: Function, target?: any): Node;
        emit(type: string, ...args: any[]): void;
        addChild(child: Node): void;
        removeChild(child: Node, cleanup?: boolean): void;
        removeAllChildren(): void;
        getChildByName(name: string): Node | null;
        getChildByUuid(uuid: string): Node | null;
        getComponent<T extends Component>(type: new () => T): T | null;
        getComponent(type: string): any | null;
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

    export class Vec2 {
        x: number;
        y: number;
        constructor(x?: number, y?: number);
    }

    export class Vec4 {
        x: number;
        y: number;
        z: number;
        w: number;
        constructor(x?: number, y?: number, z?: number, w?: number);
    }

    export class Quat {
        x: number;
        y: number;
        z: number;
        w: number;
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
        overflowMode: number;
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
        fillCenter: any;
        fillRange: number;
        fillStart: number;
        fillType: number;
        material: any;
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
        clickEvents: any[];
        node: Node;
        duration: number;
        zoomScale: number;
        enabled: boolean;
    }

    export class Toggle extends Component {
        static EventType: {
            TOGGLE: string;
        };
        isChecked: boolean;
        node: Node;
        toggleEvents: any[];
        checkMark: Node | null;
        enabled: boolean;
    }

    export class ToggleContainer extends Component {
        allowSwitchOff: boolean;
        toggleItems: Toggle[];
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
        scrollThreshold: number;
        cancelInnerEvents: boolean;
        inertia: boolean;
        brake: number;
        elastic: boolean;
        bounceDuration: number;
        scrollToOffset(offset: any, timeInSeconds?: number, attenuated?: boolean): void;
        scrollToLeft(timeInSeconds?: number, attenuated?: boolean): void;
        scrollToRight(timeInSeconds?: number, attenuated?: boolean): void;
        scrollToTop(timeInSeconds?: number, attenuated?: boolean): void;
        scrollToBottom(timeInSeconds?: number, attenuated?: boolean): void;
        stopAutoScroll(): void;
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
        cellSize: Size;
        constraint: number;
        constraintNum: number;
        startAxis: number;
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
        setAnchorPoint(x: number, y: number): void;
        getBoundingBoxToWorld(): any;
    }

    export class Canvas extends Component {
        alignCanvasWithScreen: boolean;
        cameraComponent: any;
    }

    export class Camera extends Component {
        orthoHeight: number;
        near: number;
        far: number;
        fov: number;
        ortho: boolean;
        clearFlags: number;
        clearDepth: number;
        clearStencil: number;
        clearColor: any;
        visibility: number;
    }

    export class Widget extends Component {
        isAlignHorizontal: boolean;
        isAlignVertical: boolean;
        isAlignTop: boolean;
        isAlignBottom: boolean;
        isAlignLeft: boolean;
        isAlignRight: boolean;
        isStretchHeight: boolean;
        isStretchWidth: boolean;
        left: number;
        right: number;
        top: number;
        bottom: number;
        horizontalCenter: number;
        verticalCenter: number;
        alignMode: number;
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
        _uuid: string;
    }

    export class JsonAsset extends Asset {
        json: any;
    }

    export class Prefab extends Asset {
        data: any;
    }

    export class Scene extends Asset {
        name: string;
    }

    export class ImageAsset extends Asset {
        data: any;
    }

    export class Texture2D extends Asset {
        image: ImageAsset | null;
    }

    export class TextAsset extends Asset {
        text: string;
    }

    export class AudioClip extends Asset {}
    export class AnimationClip extends Asset {}

    export namespace director {
        function loadScene(sceneName: string, onLoaded?: (error: Error | null, scene?: Scene) => void, onLaunched?: (error: Error | null, scene?: Scene) => void): void;
        function loadScene(sceneName: string, onLoaded?: (error: Error | null, scene?: Scene) => void): void;
        function getScene(): Scene | null;
        function getRunningScene(): Scene | null;
        function preloadScene(sceneName: string, onLoaded?: (error: Error | null) => void, onProgress?: (finished: number, total: number, item: any) => void): void;
        function addScene(): any;
        function removeScene(): void;
        function replaceScene(scene: Scene): void;
        function runSceneImmediate(sceneName: string, onLaunch?: Function): void;
        const root: any;
        const scenes: Scene[];
    }

    export namespace resources {
        function load(path: string, type: any, callback: (error: Error | null, asset: any) => void): void;
        function load(path: string, callback: (error: Error | null, asset: any) => void): void;
        function loadDir(path: string, type: any, callback: (error: Error | null, assets: any[]) => void): void;
        function loadDir(path: string, callback: (error: Error | null, assets: any[]) => void): void;
        function release(path: string): void;
        function releaseDir(path: string): void;
        function releaseAsset(asset: Asset): void;
        function preload(path: string, type: any, callback?: (error: Error | null, asset: any) => void): void;
    }

    export namespace assetManager {
        const bundles: any;
        function loadAny(paths: string[], type: any, onProgress: any, onComplete: any): void;
        function loadRemote(url: string, options: any, callback: (err: Error | null, data: any) => void): void;
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
        const isBrowser: boolean;
        const isMobile: boolean;
        const isNative: boolean;
    }

    export function tween(target: any): Tween;

    export class Tween {
        to(duration: number, props: any, opts?: any): Tween;
        by(duration: number, props: any, opts?: any): Tween;
        delay(duration: number): Tween;
        call(callback: Function): Tween;
        repeat(repeatTimes: number, tween?: Tween): Tween;
        repeatForever(tween?: Tween): Tween;
        sequence(...tweens: Tween[]): Tween;
        parallel(...tweens: Tween[]): Tween;
        start(): Tween;
        stop(): Tween;
        clone(): Tween;
        hide(): Tween;
        show(): Tween;
        removeSelf(): Tween;
        reverseTime(): Tween;
        then(other: Tween): Tween;
        target(newTarget?: any): Tween;
        union(): Tween;
    }

    export class Mask extends Component {
        static Type: {
            RECT: number;
            ELLIPSE: number;
            GRAPHICS_STENCIL: number;
        };
        type: number;
        inverted: boolean;
        alphaThreshold: number;
        spriteFrame: SpriteFrame | null;
        node: Node;
    }

    export class Graphics extends Component {
        lineWidth: number;
        strokeColor: Color;
        fillColor: Color;
        lineCap: number;
        lineJoin: number;
        miterLimit: number;
        clear(): void;
        moveTo(x: number, y: number): void;
        lineTo(x: number, y: number): void;
        circle(cx: number, cy: number, r: number): void;
        rect(x: number, y: number, w: number, h: number): void;
        close(): void;
        stroke(): void;
        fill(): void;
    }

    export class PageView extends Component {
        content: Node | null;
        pageEvents: any[];
        scrollThreshold: number;
        cancelInnerEvents: boolean;
        turnPageEventTiming: number;
        scrollToPage(index: number, timeInSeconds?: number): void;
        getCurrentPageIndex(): number;
    }

    export class EditBox extends Component {
        string: string;
        placeholder: string;
        background: SpriteFrame | null;
        fontColor: Color;
        fontSize: number;
        inputMode: number;
        inputFlag: number;
        returnType: number;
        maxLength: number;
        editBoxRect: Rect;
    }

    export class Slider extends Component {
        progress: number;
        direction: number;
        handle: Node | null;
        slideEvents: any[];
    }

    export class RichText extends Component {
        string: string;
        fontSize: number;
        lineHeight: number;
        maxWidth: number;
        enableWrapText: boolean;
    }

    export class Animation extends Component {
        defaultClip: AnimationClip | null;
        play(name?: string, frameRate?: number): void;
        stop(name?: string): void;
        pause(name?: string): void;
        resume(name?: string): void;
    }

    export namespace math {
        const Vec2: any;
        const Vec3: typeof Vec3;
        const Vec4: any;
        const Mat3: any;
        const Mat4: any;
        const Quat: any;
        const Color: typeof Color;
        const Size: typeof Size;
        const Rect: typeof Rect;
    }

    export namespace NodeSpace {
        const LOCAL: number;
        const WORLD: number;
    }

    export function warn(...args: any[]): void;
    export function warnID(id: number, ...args: any[]): void;
    export function error(...args: any[]): void;
    export function errorID(id: number, ...args: any[]): void;
    export function log(...args: any[]): void;
    export function logID(id: number, ...args: any[]): void;

    export const game: any;
    export const view: any;
}
