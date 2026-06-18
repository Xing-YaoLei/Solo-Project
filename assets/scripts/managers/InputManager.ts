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

export class InputManager {
  private static _instance: InputManager | null = null;

  private _keyMap: Map<string, InputAction> = new Map();
  private _keyStates: Map<string, boolean> = new Map();
  private _touchStart: { x: number; y: number } | null = null;
  private _isTouching: boolean = false;
  private _swipeThreshold: number = 50;
  private _enabled: boolean = true;

  private _onKeyDownBound: (e: KeyboardEvent) => void;
  private _onKeyUpBound: (e: KeyboardEvent) => void;

  public static get instance(): InputManager {
    if (!this._instance) {
      this._instance = new InputManager();
    }
    return this._instance;
  }

  private constructor() {
    this._onKeyDownBound = this.onKeyDown.bind(this);
    this._onKeyUpBound = this.onKeyUp.bind(this);
    this.initKeyMap();
  }

  public get enabled(): boolean {
    return this._enabled;
  }

  public set enabled(value: boolean) {
    this._enabled = value;
  }

  private initKeyMap(): void {
    this._keyMap.set('Enter', 'confirm');
    this._keyMap.set('Space', 'confirm');
    this._keyMap.set('Escape', 'cancel');
    this._keyMap.set('ArrowUp', 'up');
    this._keyMap.set('w', 'up');
    this._keyMap.set('W', 'up');
    this._keyMap.set('ArrowDown', 'down');
    this._keyMap.set('s', 'down');
    this._keyMap.set('S', 'down');
    this._keyMap.set('ArrowLeft', 'left');
    this._keyMap.set('a', 'left');
    this._keyMap.set('A', 'left');
    this._keyMap.set('ArrowRight', 'right');
    this._keyMap.set('d', 'right');
    this._keyMap.set('D', 'right');
    this._keyMap.set('m', 'menu');
    this._keyMap.set('M', 'menu');
    this._keyMap.set('r', 'restart');
    this._keyMap.set('R', 'restart');
    this._keyMap.set('p', 'pause');
    this._keyMap.set('P', 'pause');
    this._keyMap.set('Tab', 'next');
    this._keyMap.set('n', 'next');
    this._keyMap.set('N', 'next');
    this._keyMap.set('p', 'prev');
    this._keyMap.set('P', 'prev');
    this._keyMap.set('1', 'select_1');
    this._keyMap.set('2', 'select_2');
    this._keyMap.set('3', 'select_3');
    this._keyMap.set('4', 'select_4');
    this._keyMap.set('PageUp', 'page_up');
    this._keyMap.set('PageDown', 'page_down');
  }

  public attach(): void {
    if (typeof document !== 'undefined') {
      document.addEventListener('keydown', this._onKeyDownBound);
      document.addEventListener('keyup', this._onKeyUpBound);
    }
  }

  public detach(): void {
    if (typeof document !== 'undefined') {
      document.removeEventListener('keydown', this._onKeyDownBound);
      document.removeEventListener('keyup', this._onKeyUpBound);
    }
  }

  private onKeyDown(e: KeyboardEvent): void {
    if (!this._enabled) return;
    if (e.repeat) return;

    const action = this._keyMap.get(e.code) || this._keyMap.get(e.key);
    if (action) {
      this._keyStates.set(e.code || e.key, true);
      EventManager.instance.emit(GameEvents.INPUT_ACTION, action, 'keyboard');
      e.preventDefault();
    }
  }

  private onKeyUp(e: KeyboardEvent): void {
    this._keyStates.delete(e.code || e.key);
  }

  public isActionPressed(action: InputAction): boolean {
    for (const [key, mappedAction] of this._keyMap) {
      if (mappedAction === action && this._keyStates.has(key)) {
        return true;
      }
    }
    return false;
  }

  public handleTouchStart(x: number, y: number): void {
    if (!this._enabled) return;

    this._isTouching = true;
    this._touchStart = { x, y };
  }

  public handleTouchMove(x: number, y: number): void {
    if (!this._enabled || !this._isTouching || !this._touchStart) return;

    const deltaX = x - this._touchStart.x;
    const deltaY = y - this._touchStart.y;
  }

  public handleTouchEnd(x: number, y: number): void {
    if (!this._enabled || !this._touchStart) return;

    const deltaX = x - this._touchStart.x;
    const deltaY = y - this._touchStart.y;
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
          EventManager.instance.emit(GameEvents.INPUT_ACTION, 'down', 'touch');
        } else {
          EventManager.instance.emit(GameEvents.INPUT_ACTION, 'up', 'touch');
        }
      }
    } else {
      EventManager.instance.emit(GameEvents.INPUT_ACTION, 'confirm', 'touch');
    }

    this._isTouching = false;
    this._touchStart = null;
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

  public addKeyMapping(key: string, action: InputAction): void {
    this._keyMap.set(key, action);
  }

  public removeKeyMapping(key: string): void {
    this._keyMap.delete(key);
  }

  public clearKeyMappings(): void {
    this._keyMap.clear();
  }

  public getActionKey(action: InputAction): string | null {
    for (const [key, mappedAction] of this._keyMap) {
      if (mappedAction === action) {
        return key;
      }
    }
    return null;
  }

  public setSwipeThreshold(threshold: number): void {
    this._swipeThreshold = threshold;
  }
}
