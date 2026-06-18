declare module 'cc' {
  export const _decorator: {
    ccclass: (name?: string) => ClassDecorator;
    property: (options?: any) => PropertyDecorator;
    executeInEditMode: () => ClassDecorator;
    requireComponent: (comp: any) => ClassDecorator;
    menu: (menu: string) => ClassDecorator;
    tooltip: (tooltip: string) => PropertyDecorator;
    range: (min: number, max: number, step?: number) => PropertyDecorator;
    type: (type: any) => PropertyDecorator;
  };

  export class Component {
    node: Node;
    enabled: boolean;
    isValid: boolean;
    onLoad?(): void;
    start?(): void;
    update?(dt: number): void;
    lateUpdate?(dt: number): void;
    onDestroy?(): void;
    onEnable?(): void;
    onDisable?(): void;
    getComponent<T>(type: new () => T): T | null;
    getComponentInChildren<T>(type: new () => T): T | null;
    getComponentsInChildren<T>(type: new () => T): T[];
    addComponent<T>(type: new () => T): T;
    destroy(): void;
    schedule(callback: Function, interval?: number, repeat?: number, delay?: number): void;
    unschedule(callback: Function): void;
    scheduleOnce(callback: Function, delay?: number): void;
  }

  export class Node {
    name: string;
    active: boolean;
    opacity: number;
    position: Vec3;
    rotation: Quat;
    scale: Vec3;
    eulerAngles: Vec3;
    parent: Node | null;
    children: Node[];
    uuid: string;
    layer: number;
    worldPosition: Vec3;

    constructor(name?: string);
    addChild(node: Node): void;
    removeChild(node: Node): void;
    removeAllChildren(): void;
    getChildByName(name: string): Node | null;
    getChildByPath(path: string): Node | null;
    getChildByUuid(uuid: string): Node | null;
    getComponent<T>(type: new () => T): T | null;
    getComponents<T>(type: new () => T): T[];
    addComponent<T>(type: new () => T): T;
    removeComponent(comp: Component): void;
    destroy(): void;
    destroyAllChildren(): void;
    setPosition(value: Vec3): void;
    setPosition(x: number, y: number, z?: number): void;
    setScale(value: Vec3): void;
    setScale(x: number, y: number, z?: number): void;
    setRotation(x: number, y: number, z: number): void;
    translate(x: number, y: number, z?: number): void;
    getWorldPosition(out?: Vec3): Vec3;
    setWorldPosition(x: number, y: number, z?: number): void;
    getWorldScale(): Vec3;
    getWorldRotation(): Quat;
    on(type: string, callback: Function, target?: any): void;
    off(type: string, callback?: Function, target?: any): void;
    once(type: string, callback: Function, target?: any): void;
    emit(type: string, arg0?: any, arg1?: any, arg2?: any, arg3?: any, arg4?: any): void;
    targetOff(target: any): void;
    pauseSystem(): void;
    resumeSystem(): void;
    setSiblingIndex(index: number): void;
    getSiblingIndex(): number;
    isChildOf(parent: Node): boolean;
    insertChild(node: Node, siblingIndex: number): void;
    setContentSize(size: Size): void;
    setContentSize(width: number, height: number): void;
    getContentSize(): Size;
    getAnchorPoint(): Vec2;
    setAnchorPoint(point: Vec2): void;
    setAnchorPoint(x: number, y: number): void;

    static EventType: {
      TOUCH_START: string;
      TOUCH_MOVE: string;
      TOUCH_END: string;
      TOUCH_CANCEL: string;
      MOUSE_DOWN: string;
      MOUSE_MOVE: string;
      MOUSE_UP: string;
      MOUSE_ENTER: string;
      MOUSE_LEAVE: string;
      SIZE_CHANGED: string;
      ANCHOR_CHANGED: string;
      CHILD_ADDED: string;
      CHILD_REMOVED: string;
      PARENT_CHANGED: string;
      NODE_DESTROYED: string;
      ACTIVE_IN_HIERARCHY_CHANGED: string;
      SIBLING_ORDER_CHANGED: string;
      LAYER_CHANGED: string;
    };
  }

  export class Vec3 {
    x: number;
    y: number;
    z: number;
    constructor(x?: number, y?: number, z?: number);
    set(x: number, y: number, z?: number): this;
    clone(): Vec3;
    copy(v: Vec3): this;
    add(v: Vec3): this;
    subtract(v: Vec3): this;
    multiplyScalar(s: number): this;
    multiply(v: Vec3): this;
    divide(v: Vec3): this;
    negate(): this;
    distanceTo(v: Vec3): number;
    distanceSquaredTo(v: Vec3): number;
    len(): number;
    lengthSqr(): number;
    normalize(): this;
    lerp(to: Vec3, t: number): this;
    equals(v: Vec3): boolean;
    toString(): string;
    static ZERO: Vec3;
    static ONE: Vec3;
    static UNIT_X: Vec3;
    static UNIT_Y: Vec3;
    static UNIT_Z: Vec3;
    static add<Out extends Vec3>(out: Out, a: Vec3, b: Vec3): Out;
    static subtract<Out extends Vec3>(out: Out, a: Vec3, b: Vec3): Out;
    static multiplyScalar<Out extends Vec3>(out: Out, a: Vec3, s: number): Out;
    static distance(a: Vec3, b: Vec3): number;
  }

  export class Vec2 {
    x: number;
    y: number;
    constructor(x?: number, y?: number);
    set(x: number, y: number): this;
    clone(): Vec2;
    copy(v: Vec2): this;
    add(v: Vec2): this;
    subtract(v: Vec2): this;
    multiplyScalar(s: number): this;
    multiply(v: Vec2): this;
    divide(v: Vec2): this;
    negate(): this;
    distanceTo(v: Vec2): number;
    distanceSquaredTo(v: Vec2): number;
    len(): number;
    lengthSqr(): number;
    normalize(): this;
    lerp(to: Vec2, t: number): this;
    equals(v: Vec2): boolean;
    toString(): string;
    static ZERO: Vec2;
    static ONE: Vec2;
    static UNIT_X: Vec2;
    static UNIT_Y: Vec2;
  }

  export class Quat {
    x: number;
    y: number;
    z: number;
    w: number;
    constructor(x?: number, y?: number, z?: number, w?: number);
    set(x: number, y: number, z: number, w: number): this;
    clone(): Quat;
    copy(q: Quat): this;
    identity(): this;
    multiply(q: Quat): this;
    multiplyQuatLeft(q: Quat): this;
    fromEuler(x: number, y: number, z: number): this;
    getEulerAngles(out?: Vec3): Vec3;
    normalize(): this;
    lerp(to: Quat, t: number): this;
    slerp(to: Quat, t: number): this;
    equals(q: Quat): boolean;
    static IDENTITY: Quat;
    static fromEuler(v: Vec3): Quat;
  }

  export class Size {
    width: number;
    height: number;
    constructor(width?: number, height?: number);
    set(width: number, height: number): this;
    clone(): Size;
    equals(other: Size): boolean;
    static ZERO: Size;
  }

  export class Color {
    r: number;
    g: number;
    b: number;
    a: number;
    constructor(r?: number, g?: number, b?: number, a?: number);
    set(r: number, g: number, b: number, a?: number): this;
    clone(): Color;
    copy(other: Color): this;
    fromHEX(hex: string): this;
    toHEX(): string;
    lerp(to: Color, t: number): this;
    equals(other: Color): boolean;
    static WHITE: Color;
    static BLACK: Color;
    static TRANSPARENT: Color;
    static GRAY: Color;
    static RED: Color;
    static GREEN: Color;
    static BLUE: Color;
    static YELLOW: Color;
    static CYAN: Color;
    static MAGENTA: Color;
  }

  export class Label extends Component {
    string: string;
    fontSize: number;
    font: any;
    fontFamily: string;
    lineHeight: number;
    letterSpacing: number;
    overflow: number;
    horizontalAlign: number;
    verticalAlign: number;
    enableWrapText: boolean;
    color: Color;

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
  }

  export class Sprite extends Component {
    spriteFrame: any;
    type: number;
    fillType: number;
    fillCenter: Vec2;
    fillStart: number;
    fillRange: number;
    color: Color;
    sizeMode: number;
    trim: boolean;
    grayscale: boolean;

    static Type: {
      SIMPLE: number;
      SLICED: number;
      TILED: number;
      FILLED: number;
    };
    static FillType: {
      HORIZONTAL: number;
      VERTICAL: number;
      RADIAL: number;
    };
    static SizeMode: {
      CUSTOM: number;
      TRIMMED: number;
      RAW: number;
    };
  }

  export class Button extends Component {
    clickEvents: any[];
    interactable: boolean;
    transition: number;
    normalColor: Color;
    pressedColor: Color;
    hoverColor: Color;
    disabledColor: Color;
    duration: number;
    zoomScale: number;
    target: Node | null;

    static Transition: {
      NONE: number;
      COLOR: number;
      SPRITE: number;
      SCALE: number;
    };

    click(): void;
  }

  export class EditBox extends Component {
    string: string;
    placeholder: string;
    fontSize: number;
    fontColor: Color;
    placeholderFontColor: Color;
    maxLength: number;
    inputFlag: number;
    inputMode: number;
    returnType: number;
    tabIndex: number;

    static InputFlag: {
      DEFAULT: number;
      PASSWORD: number;
      SENSITIVE: number;
    };
    static InputMode: {
      ANY: number;
      EMAIL_ADDR: number;
      NUMERIC: number;
      PHONE_NUMBER: number;
      URL: number;
      DECIMAL: number;
      SINGLE_LINE: number;
    };
    static ReturnType: {
      DEFAULT: number;
      DONE: number;
      NEXT: number;
      SEARCH: number;
      SEND: number;
      GO: number;
    };

    setFocus(): void;
    focus(): void;
    blur(): void;
  }

  export class Widget extends Component {
    isAlignHorizontalCenter: boolean;
    isAlignVerticalCenter: boolean;
    isAlignTop: boolean;
    isAlignBottom: boolean;
    isAlignLeft: boolean;
    isAlignRight: boolean;
    top: number;
    bottom: number;
    left: number;
    right: number;
    horizontalCenter: number;
    verticalCenter: number;
    target: Node | null;
    updateAlignment(): void;

    static AlignMode: {
      WINDOW: number;
      NODE: number;
      WINDOW_WITHOUT_SAFE_AREA: number;
    };
  }

  export class Layout extends Component {
    type: number;
    resizeMode: number;
    paddingLeft: number;
    paddingRight: number;
    paddingTop: number;
    paddingBottom: number;
    spacingX: number;
    spacingY: number;
    horizontalDirection: number;
    verticalDirection: number;
    cellSize: Size;
    startAxis: number;
    constraintNum: number;

    static Type: {
      NONE: number;
      HORIZONTAL: number;
      VERTICAL: number;
      GRID: number;
    };
    static ResizeMode: {
      NONE: number;
      CONTAINER: number;
      CHILDREN: number;
    };
    static HorizontalDirection: {
      LEFT_TO_RIGHT: number;
      RIGHT_TO_LEFT: number;
    };
    static VerticalDirection: {
      TOP_TO_BOTTOM: number;
      BOTTOM_TO_TOP: number;
    };

    updateLayout(): void;
  }

  export class ScrollView extends Component {
    content: Node | null;
    horizontal: boolean;
    vertical: boolean;
    inertia: boolean;
    brake: number;
    elastic: boolean;
    bounceDuration: number;
    cancelInnerEvents: boolean;

    scrollToOffset(offset: Vec2, timeInSecond?: number, attenuated?: boolean): void;
    scrollToTop(timeInSecond?: number, attenuated?: boolean): void;
    scrollToBottom(timeInSecond?: number, attenuated?: boolean): void;
    scrollToLeft(timeInSecond?: number, attenuated?: boolean): void;
    scrollToRight(timeInSecond?: number, attenuated?: boolean): void;
    getScrollOffset(): Vec2;
    getMaxScrollOffset(): Vec2;
    stopAutoScroll(): void;
  }

  export class UITransform extends Component {
    contentSize: Size;
    anchorPoint: Vec2;
    priority: number;

    setContentSize(size: Size): void;
    setContentSize(width: number, height: number): void;
    getContentSize(): Size;
    setAnchorPoint(point: Vec2): void;
    setAnchorPoint(x: number, y: number): void;
    getAnchorPoint(): Vec2;
    getBoundingBox(): any;
    getBoundingBoxToWorld(): any;
    isHit(vec2: Vec2): boolean;
    convertToNodeSpace(worldPoint: Vec3): Vec2;
    convertToWorldSpace(nodeSpace: Vec2): Vec2;
  }

  export class UIOpacity extends Component {
    opacity: number;
  }

  export class Canvas extends Component {
    cameraComponent: any;
    alignCanvasWithScreen: boolean;
    clearFlags: number;
  }

  export class Camera extends Component {
    projection: number;
    priority: number;
    clearFlags: number;
    clearColor: Color;
    depth: number;
    fov: number;
    orthoHeight: number;
    near: number;
    far: number;
    visibility: number;
    targetTexture: any;

    static ClearFlag: {
      SKYBOX: number;
      SOLID_COLOR: number;
      DEPTH_ONLY: number;
      DONT_CLEAR: number;
    };

    screenPointToRay(screenPos: Vec3): any;
    worldToScreen(point: Vec3, out?: Vec3): Vec3;
    worldToScreenPos(point: Vec3, out?: Vec2): Vec2;
    screenToWorld(screenPos: Vec3, out?: Vec3): Vec3;
  }

  export class TiledMapAsset extends Asset {}

  export class TiledMap extends Component {
    tmxAsset: TiledMapAsset | null;
    enableCulling: boolean;
    getMapSize(): Size;
    getTileSize(): Size;
    getLayer(name: string): TiledLayer | null;
    getLayerAt(index: number): TiledLayer | null;
    getLayers(): TiledLayer[];
    getObjectGroup(name: string): TiledObjectGroup | null;
    getObjectGroups(): TiledObjectGroup[];
    getProperties(): Record<string, any>;
    getProperty(name: string): any;
    setProperty(name: string, value: any): void;
  }

  export class TiledLayer {
    getTileAt(x: number, y: number): TiledTile | null;
    getLayerName(): string;
    getLayerSize(): Size;
    getMapTileSize(): Size;
    getPositionAt(x: number, y: number): Vec2;
    setTileGIDAt(gid: number, x: number, y: number, flags?: number): void;
    getTileGIDAt(x: number, y: number): number;
    removeTileAt(x: number, y: number): void;
  }

  export class TiledTile {
    x: number;
    y: number;
    gridX: number;
    gridY: number;
    tileGid: number;
    width: number;
    height: number;
  }

  export class TiledObjectGroup {
    getObjects(): TiledObject[];
    getObject(name: string): TiledObject | null;
    getGroupName(): string;
    getProperties(): Record<string, any>;
    getProperty(name: string): any;
    setProperty(name: string, value: any): void;
  }

  export class TiledObject {
    id: number;
    name: string;
    type: string;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    gid: number;
    visible: boolean;
    properties: Record<string, any>;
    getProperty(name: string): any;
    setProperty(name: string, value: any): void;
  }

  export class Graphics extends Component {
    lineWidth: number;
    lineCap: number;
    lineJoin: number;
    strokeColor: Color;
    fillColor: Color;
    miterLimit: number;

    moveTo(x: number, y: number): void;
    lineTo(x: number, y: number): void;
    bezierCurveTo(c1x: number, c1y: number, c2x: number, c2y: number, x: number, y: number): void;
    quadraticCurveTo(cx: number, cy: number, x: number, y: number): void;
    arc(cx: number, cy: number, r: number, startAngle: number, endAngle: number, counterclockwise?: boolean): void;
    ellipse(cx: number, cy: number, rx: number, ry: number): void;
    circle(cx: number, cy: number, r: number): void;
    rect(x: number, y: number, w: number, h: number): void;
    roundRect(x: number, y: number, w: number, h: number, r: number): void;
    clear(): void;
    close(): void;
    stroke(): void;
    fill(): void;
  }

  export class AudioSource extends Component {
    clip: any;
    loop: boolean;
    playOnLoad: boolean;
    volume: number;
    currentTime: number;
    duration: number;
    state: number;

    static AudioState: {
      PLAYING: number;
      PAUSED: number;
      STOPPED: number;
      INITIAL: number;
    };

    play(): void;
    pause(): void;
    resume(): void;
    stop(): void;
    setCurrentTime(second: number): void;
  }

  export class JsonAsset {
    json: any;
    _native: string;
    _nativeAsset: any;
    constructor();
    toString(): string;
  }

  export class TextAsset {
    text: string;
    _native: string;
    _nativeAsset: any;
    constructor();
    toString(): string;
  }

  export class SpriteFrame {
    texture: any;
    rect: any;
    offset: Vec2;
    originalSize: Size;
    isRotated: boolean;
    constructor();
  }

  export class Texture2D {
    width: number;
    height: number;
    format: number;
    image: any;
    constructor();
    destroy(): boolean;
  }

  export const resources: {
    load(paths: string, type: any, completeCallback?: (err: Error | null, asset: any) => void): void;
    load(paths: string, type: any, progressCallback: (finish: number, total: number, item: any) => void, completeCallback?: (err: Error | null, asset: any) => void): void;
    load(paths: string[], type: any, progressCallback?: (finish: number, total: number, item: any) => void, completeCallback?: (err: Error | null, assets: any[]) => void): void;
    load(paths: string, completeCallback?: (err: Error | null, asset: any) => void): void;
    loadDir(dirName: string, type: any, progressCallback?: (finish: number, total: number, item: any) => void, completeCallback?: (err: Error | null, assets: any[]) => void): void;
    loadDir(dirName: string, completeCallback?: (err: Error | null, assets: any[]) => void): void;
    preload(paths: string | string[], type?: any, progressCallback?: (finish: number, total: number, item: any) => void, completeCallback?: (err: Error | null) => void): void;
    get(path: string, type: any): any;
    release(path: string, type?: any): void;
    releaseAll(): void;
  };

  export const assetManager: {
    assets: any;
    bundles: any;
    loadRemote(url: string, options?: any, onComplete?: (err: Error | null, asset: any) => void): void;
    loadBundle(name: string, options?: any, onComplete?: (err: Error | null, bundle: any) => void): void;
    releaseAsset(asset: any): void;
    releaseUnusedAssets(): void;
    releaseAll(): void;
  };

  export const sys: {
    platform: string;
    isBrowser: boolean;
    isMobile: boolean;
    isNative: boolean;
    language: string;
    languageCode: string;
    os: string;
    osVersion: string;
    browserType: string;
    browserVersion: string;
    pixelRatio: number;
    windowPixelResolution: Vec2;
    isObjectValid(obj: any): boolean;
    openURL(url: string): void;
    close(): void;
    getTime(): number;
    now(): number;
    garbageCollect(): void;
    localStorage: Storage | null;

    static Platform: {
      UNKNOWN: string;
      WIN32: string;
      LINUX: string;
      MACOS: string;
      ANDROID: string;
      IPHONE: string;
      IPAD: string;
      WECHAT_GAME: string;
      HARMONY: string;
    };
  };

  export const director: {
    root: any;
    scene: any;
    getScene(): any;
    loadScene(sceneName: string, onLaunched?: Function, onUnloaded?: Function): void;
    preloadScene(sceneName: string, onLoaded?: Function, onError?: Function): void;
    runSceneImmediate(scene: any, onBeforeLoadScene?: Function, onLaunched?: Function): void;
    setClearColor(color: Color): void;
  };

  export const input: {
    on(eventName: string, callback: Function, target?: any): void;
    off(eventName: string, callback: Function, target?: any): void;
    once(eventName: string, callback: Function, target?: any): void;
    emit(eventName: string, ...args: any[]): void;
  };

  export class Input {
    static EventType: {
      KEY_DOWN: string;
      KEY_UP: string;
      TOUCH_START: string;
      TOUCH_MOVE: string;
      TOUCH_END: string;
      TOUCH_CANCEL: string;
      MOUSE_DOWN: string;
      MOUSE_MOVE: string;
      MOUSE_UP: string;
      MOUSE_WHEEL: string;
    };
  }

  export class KeyCode {
    static NONE: number;
    static BACKSPACE: number;
    static TAB: number;
    static ENTER: number;
    static SHIFT_LEFT: number;
    static SHIFT_RIGHT: number;
    static CTRL_LEFT: number;
    static CTRL_RIGHT: number;
    static ALT_LEFT: number;
    static ALT_RIGHT: number;
    static PAUSE: number;
    static CAPS_LOCK: number;
    static ESCAPE: number;
    static SPACE: number;
    static PAGE_UP: number;
    static PAGE_DOWN: number;
    static END: number;
    static HOME: number;
    static ARROW_LEFT: number;
    static ARROW_UP: number;
    static ARROW_RIGHT: number;
    static ARROW_DOWN: number;
    static PRINT_SCREEN: number;
    static INSERT: number;
    static DELETE: number;
    static DIGIT_0: number;
    static DIGIT_1: number;
    static DIGIT_2: number;
    static DIGIT_3: number;
    static DIGIT_4: number;
    static DIGIT_5: number;
    static DIGIT_6: number;
    static DIGIT_7: number;
    static DIGIT_8: number;
    static DIGIT_9: number;
    static KEY_0: number;
    static KEY_1: number;
    static KEY_2: number;
    static KEY_3: number;
    static KEY_4: number;
    static KEY_5: number;
    static KEY_6: number;
    static KEY_7: number;
    static KEY_8: number;
    static KEY_9: number;
    static A: number;
    static B: number;
    static C: number;
    static D: number;
    static E: number;
    static F: number;
    static G: number;
    static H: number;
    static I: number;
    static J: number;
    static K: number;
    static L: number;
    static M: number;
    static N: number;
    static O: number;
    static P: number;
    static Q: number;
    static R: number;
    static S: number;
    static T: number;
    static U: number;
    static V: number;
    static W: number;
    static X: number;
    static Y: number;
    static Z: number;
    static NUMPAD_0: number;
    static NUMPAD_1: number;
    static NUMPAD_2: number;
    static NUMPAD_3: number;
    static NUMPAD_4: number;
    static NUMPAD_5: number;
    static NUMPAD_6: number;
    static NUMPAD_7: number;
    static NUMPAD_8: number;
    static NUMPAD_9: number;
    static F1: number;
    static F2: number;
    static F3: number;
    static F4: number;
    static F5: number;
    static F6: number;
    static F7: number;
    static F8: number;
    static F9: number;
    static F10: number;
    static F11: number;
    static F12: number;
    static NUM_LOCK: number;
    static SCROLL_LOCK: number;
    static SEMICOLON: number;
    static EQUAL: number;
    static COMMA: number;
    static MINUS: number;
    static PERIOD: number;
    static SLASH: number;
    static BACK_QUOTE: number;
    static BRACKET_LEFT: number;
    static BRACKET_RIGHT: number;
    static BACK_SLASH: number;
    static QUOTE: number;
    static CONTEXT_MENU: number;
    static NUMPAD_ENTER: number;
    static NUMPAD_MULTIPLY: number;
    static NUMPAD_ADD: number;
    static NUMPAD_SUBTRACT: number;
    static NUMPAD_DECIMAL: number;
    static NUMPAD_DIVIDE: number;
  }

  export const EventKeyboard: {
    keyCode: number;
    isPressed: boolean;
  };

  export const EventTouch: {
    touches: any[];
    getLocation(): Vec2;
    getLocationInView(): Vec2;
    getPreviousLocation(): Vec2;
    getStartLocation(): Vec2;
    getUILocation(): Vec2;
    getUIStartLocation(): Vec2;
    getDelta(): Vec2;
    getID(): number;
  };

  export class Tween<T> {
    to(duration: number, props: any, opts?: any): this;
    by(duration: number, props: any, opts?: any): this;
    delay(duration: number): this;
    call(callback: Function): this;
    hide(): this;
    show(): this;
    start(): this;
    stop(): this;
    pause(): this;
    resume(): this;
    clone(target?: T): Tween<T>;
    repeat(times: number, action: Tween<any>): this;
    repeatForever(action?: Tween<any>): this;
    union(other: Tween<any>): this;
    then(other: Tween<any>): this;
    tag(tag: number): this;
    targetIs(target: any): boolean;
  }

  export function tween<T>(target: T): Tween<T>;
  export function tween(target: any): Tween<any>;

  export const find: (path: string, node?: Node) => Node | null;

  export const instantiate: (original: any) => any;

  export const NodeEventType: any;

  export class Vec4 {
    x: number;
    y: number;
    z: number;
    w: number;
    constructor(x?: number, y?: number, z?: number, w?: number);
    set(x: number, y: number, z: number, w: number): this;
    clone(): Vec4;
    static ZERO: Vec4;
    static ONE: Vec4;
  }

  export class Layers {
    static Enum: {
      NONE: number;
      IGNORE_RAYCAST: number;
      UI_3D: number;
      UI_2D: number;
      DEFAULT: number;
      UI: number;
    };
  }

  export const math: {
    lerp(a: number, b: number, t: number): number;
    clamp(val: number, min: number, max: number): number;
    randomRange(min: number, max: number): number;
    randomRangeInt(min: number, max: number): number;
  };

  export const Enum: (obj: any) => any;

  export const warn: (msg: string, ...optionalParams: any[]) => void;
  export const error: (msg: string, ...optionalParams: any[]) => void;
  export const log: (msg: string, ...optionalParams: any[]) => void;
  export const info: (msg: string, ...optionalParams: any[]) => void;
  export const debug: (msg: string, ...optionalParams: any[]) => void;

  export const v3: (x?: number, y?: number, z?: number) => Vec3;
  export const v2: (x?: number, y?: number) => Vec2;
  export const v4: (x?: number, y?: number, z?: number, w?: number) => Vec4;
  export const color: (r?: number, g?: number, b?: number, a?: number) => Color;
  export const size: (w?: number, h?: number) => Size;
  export const quat: (x?: number, y?: number, z?: number, w?: number) => Quat;

  export class EventTarget {
    on(type: string, callback: Function, target?: any): void;
    off(type: string, callback: Function, target?: any): void;
    once(type: string, callback: Function, target?: any): void;
    emit(type: string, arg0?: any, arg1?: any, arg2?: any, arg3?: any, arg4?: any): void;
    targetOff(target: any): void;
    hasEventListener(type: string): boolean;
    dispatchEvent(event: any): void;
  }

  export class Event {
    static NO_TYPE: number;
    static TOUCH: number;
    static MOUSE: number;
    static KEYBOARD: number;
    type: number;
    bubble: boolean;
    target: any;
    currentTarget: any;
    propagationStopped: boolean;
    propagationImmediateStopped: boolean;
    stopPropagation(): void;
    stopPropagationImmediate(): void;
  }

  export const game: {
    addPersistRootNode(node: Node): void;
    removePersistRootNode(node: Node): void;
    isPersistRootNode(node: Node): boolean;
    step(): void;
    pause(): void;
    resume(): void;
    setFrameRate(rate: number): void;
    getFrameRate(): number;
    frameRate: number;
    totalFrames: number;
    startTime: number;
    frameTime: number;
  };

  export const view: {
    getCanvasSize(): Size;
    getVisibleSize(): Size;
    getVisibleOrigin(): Vec2;
    getDesignResolutionSize(): Size;
    setDesignResolutionSize(width: number, height: number, resolutionPolicy: number): void;
    setAutoFullScreen(autoFullScreen: boolean): void;
    getResolutionPolicy(): number;
    enableRetina(enabled: boolean): void;
    isRetina(): boolean;
  };

  export const screen: {
    windowSize: Size;
    resolution: Size;
    devicePixelRatio: number;
    fullScreen(): boolean;
    requestFullScreen(element?: any): Promise<void>;
    exitFullScreen(): void;
    autoFullScreen: boolean;
  };

  export const Touch: any;
}
