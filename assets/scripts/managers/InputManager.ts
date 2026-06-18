import { input, KeyCode, Input, log } from 'cc';
import { EventManager, GameEvents } from '../utils/EventManager';

export type InputAction =
  | 'confirm'
  | 'cancel'
  | 'up'
  | 'down'
  | 'left'
  | 'right'
  | 'menu'
  | 'restart'
  | 'pause'
  | 'next'
  | 'prev'
  | 'select_1'
  | 'select_2'
  | 'select_3'
  | 'select_4'
  | 'page_up'
  | 'page_down';

export interface TouchInfo {
  x: number;
  y: number;
  startX: number;
  startY: number;
  deltaX: number;
  deltaY: number;
}

interface IEventKeyboard {
  keyCode: number;
  isPressed: boolean;
}

interface IEventTouch {
  touches: any[];
  getLocation(): { x: number; y: number };
  getLocationInView(): { x: number; y: number };
  getUILocation(): { x: number; y: number };
  getUIStartLocation(): { x: number; y: number };
  getPreviousLocation(): { x: number; y: number };
  getStartLocation(): { x: number; y: number };
  getDelta(): { x: number; y: number };
  getID(): number;
}

export class InputManager {
  private static _instance: InputManager | null = null;

  private _keyMap: Map<number, InputAction> = new Map();
  private _keyStates: Map<number, boolean> = new Map();
  private _touchStart: { x: number; y: number } | null = null;
  private _isTouching: boolean = false;
  private _swipeThreshold: number = 50;
  private _enabled: boolean = true;
  private _inited = false;

  public static get instance(): InputManager {
    if (!this._instance) {
      this._instance = new InputManager();
    }
    return this._instance;
  }

  private constructor() {
    this.initKeyMap();
  }

  public get enabled(): boolean {
    return this._enabled;
  }

  public set enabled(value: boolean) {
    this._enabled = value;
  }

  private initKeyMap(): void {
    this._keyMap.set(KeyCode.ENTER, 'confirm');
    this._keyMap.set(KeyCode.SPACE, 'confirm');
    this._keyMap.set(KeyCode.ESCAPE, 'cancel');
    this._keyMap.set(KeyCode.ARROW_UP, 'up');
    this._keyMap.set(KeyCode.ARROW_DOWN, 'down');
    this._keyMap.set(KeyCode.ARROW_LEFT, 'left');
    this._keyMap.set(KeyCode.ARROW_RIGHT, 'right');
    this._keyMap.set(KeyCode.W, 'up');
    this._keyMap.set(KeyCode.S, 'down');
    this._keyMap.set(KeyCode.A, 'left');
    this._keyMap.set(KeyCode.D, 'right');
    this._keyMap.set(KeyCode.M, 'menu');
    this._keyMap.set(KeyCode.R, 'restart');
    this._keyMap.set(KeyCode.P, 'pause');
    this._keyMap.set(KeyCode.TAB, 'next');
    this._keyMap.set(KeyCode.N, 'next');
    this._keyMap.set(KeyCode.KEY_1, 'select_1');
    this._keyMap.set(KeyCode.KEY_2, 'select_2');
    this._keyMap.set(KeyCode.KEY_3, 'select_3');
    this._keyMap.set(KeyCode.KEY_4, 'select_4');
    this._keyMap.set(KeyCode.PAGE_UP, 'page_up');
    this._keyMap.set(KeyCode.PAGE_DOWN, 'page_down');
  }

  public attach(): void {
    if (this._inited) return;
    this._inited = true;

    if (input && input.on) {
      input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
      input.on(Input.EventType.KEY_UP, this.onKeyUp, this);
      input.on(Input.EventType.TOUCH_START, this.onTouchStart, this);
      input.on(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
      input.on(Input.EventType.TOUCH_END, this.onTouchEnd, this);
      log('[InputManager] Input events attached');
    }
  }

  public detach(): void {
    if (!this._inited) return;
    this._inited = false;

    if (input && input.off) {
      input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
      input.off(Input.EventType.KEY_UP, this.onKeyUp, this);
      input.off(Input.EventType.TOUCH_START, this.onTouchStart, this);
      input.off(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
      input.off(Input.EventType.TOUCH_END, this.onTouchEnd, this);
    }
  }

  private onKeyDown(event: IEventKeyboard): void {
    if (!this._enabled) return;

    const keyCode = event.keyCode;
    if (this._keyStates.get(keyCode)) return;

    this._keyStates.set(keyCode, true);

    const action = this._keyMap.get(keyCode);
    if (action) {
      EventManager.instance.emit(GameEvents.INPUT_ACTION, action, 'keyboard');
    }
  }

  private onKeyUp(event: IEventKeyboard): void {
    this._keyStates.delete(event.keyCode);
  }

  private onTouchStart(event: IEventTouch): void {
    if (!this._enabled) return;

    this._isTouching = true;
    const location = event.getUILocation ? event.getUILocation() : event.getLocation();
    this._touchStart = { x: location.x, y: location.y };
  }

  private onTouchMove(event: IEventTouch): void {
    if (!this._enabled || !this._isTouching || !this._touchStart) return;

    const location = event.getUILocation ? event.getUILocation() : event.getLocation();
    const deltaX = location.x - this._touchStart.x;
    const deltaY = location.y - this._touchStart.y;
  }

  private onTouchEnd(event: IEventTouch): void {
    if (!this._enabled || !this._touchStart) return;

    const location = event.getUILocation ? event.getUILocation() : event.getLocation();
    const deltaX = location.x - this._touchStart.x;
    const deltaY = location.y - this._touchStart.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (distance > this._swipeThreshold) {
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      if (absX > absY) {
        if (deltaX > 0) {
          EventManager.instance.emit(GameEvents.INPUT_ACTION, 'right', 'touch');
        } else {
          EventManager.instance.emit(GameEvents.INPUT_ACTION, 'left', 'touch');
        }
      } else {
        if (deltaY > 0) {
          EventManager.instance.emit(GameEvents.INPUT_ACTION, 'up', 'touch');
        } else {
          EventManager.instance.emit(GameEvents.INPUT_ACTION, 'down', 'touch');
        }
      }
    }

    this._isTouching = false;
    this._touchStart = null;
  }

  public isActionPressed(action: InputAction): boolean {
    for (const [key, mappedAction] of this._keyMap) {
      if (mappedAction === action && this._keyStates.has(key)) {
        return true;
      }
    }
    return false;
  }

  public handleTap(x: number, y: number): void {
    if (!this._enabled) return;
    EventManager.instance.emit(GameEvents.INPUT_ACTION, 'confirm', 'touch');
  }

  public handleDoubleTap(x: number, y: number): void {
    if (!this._enabled) return;
    EventManager.instance.emit(GameEvents.INPUT_ACTION, 'cancel', 'touch');
  }

  public handleSwipe(direction: 'up' | 'down' | 'left' | 'right'): void {
    if (!this._enabled) return;
    EventManager.instance.emit(GameEvents.INPUT_ACTION, direction, 'touch');
  }

  public addKeyMapping(keyCode: number, action: InputAction): void {
    this._keyMap.set(keyCode, action);
  }

  public removeKeyMapping(keyCode: number): void {
    this._keyMap.delete(keyCode);
  }

  public clearKeyMappings(): void {
    this._keyMap.clear();
  }

  public setSwipeThreshold(threshold: number): void {
    this._swipeThreshold = threshold;
  }
}
