import { Input, Scene } from 'phaser';

export interface InputActions {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  confirm: boolean;
  cancel: boolean;
  pass: boolean;
  reject: boolean;
}

export class InputManager {
  private static instance: InputManager;
  private _scene: Scene | null = null;
  private keys: Record<string, Input.Keyboard.Key> = {};
  private actions: InputActions = {
    up: false,
    down: false,
    left: false,
    right: false,
    confirm: false,
    cancel: false,
    pass: false,
    reject: false,
  };
  
  private swipeStartX: number = 0;
  private swipeStartY: number = 0;
  private isSwiping: boolean = false;
  private swipeThreshold: number = 50;

  private onSwipeLeftCallbacks: (() => void)[] = [];
  private onSwipeRightCallbacks: (() => void)[] = [];
  private onTapCallbacks: ((x: number, y: number) => void)[] = [];
  private justPressedKeys: Set<string> = new Set();

  private constructor() {}

  static getInstance(): InputManager {
    if (!InputManager.instance) {
      InputManager.instance = new InputManager();
    }
    return InputManager.instance;
  }

  init(scene: Scene): void {
    this._scene = scene;
    
    const cursorKeys = scene.input.keyboard?.createCursorKeys();
    if (cursorKeys) {
      this.keys['up'] = cursorKeys.up;
      this.keys['down'] = cursorKeys.down;
      this.keys['left'] = cursorKeys.left;
      this.keys['right'] = cursorKeys.right;
    }

    this.keys['space'] = scene.input.keyboard?.addKey(Input.Keyboard.KeyCodes.SPACE)!;
    this.keys['enter'] = scene.input.keyboard?.addKey(Input.Keyboard.KeyCodes.ENTER)!;
    this.keys['esc'] = scene.input.keyboard?.addKey(Input.Keyboard.KeyCodes.ESC)!;
    this.keys['a'] = scene.input.keyboard?.addKey(Input.Keyboard.KeyCodes.A)!;
    this.keys['d'] = scene.input.keyboard?.addKey(Input.Keyboard.KeyCodes.D)!;

    Object.keys(this.keys).forEach(key => {
      this.keys[key].on('down', () => {
        this.justPressedKeys.add(key);
      });
    });

    scene.input.on('pointerdown', this.handlePointerDown, this);
    scene.input.on('pointerup', this.handlePointerUp, this);
  }

  private handlePointerDown(pointer: Input.Pointer): void {
    if (pointer.id !== 0) return;
    
    this.swipeStartX = pointer.x;
    this.swipeStartY = pointer.y;
    this.isSwiping = true;
  }

  private handlePointerUp(pointer: Input.Pointer): void {
    if (pointer.id !== 0 || !this.isSwiping) return;

    const deltaX = pointer.x - this.swipeStartX;
    const deltaY = pointer.y - this.swipeStartY;

    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > this.swipeThreshold) {
      if (deltaX > 0) {
        this.onSwipeRightCallbacks.forEach(cb => cb());
      } else {
        this.onSwipeLeftCallbacks.forEach(cb => cb());
      }
    } else if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
      this.onTapCallbacks.forEach(cb => cb(pointer.x, pointer.y));
    }

    this.isSwiping = false;
  }

  update(): void {
    this.justPressedKeys.clear();
    
    this.actions.up = this.keys['up']?.isDown || false;
    this.actions.down = this.keys['down']?.isDown || false;
    this.actions.left = this.keys['left']?.isDown || this.keys['a']?.isDown || false;
    this.actions.right = this.keys['right']?.isDown || this.keys['d']?.isDown || false;
    this.actions.confirm = this.keys['space']?.isDown || this.keys['enter']?.isDown || false;
    this.actions.cancel = this.keys['esc']?.isDown || false;
    this.actions.pass = this.keys['right']?.isDown || this.keys['d']?.isDown || false;
    this.actions.reject = this.keys['left']?.isDown || this.keys['a']?.isDown || false;
  }

  getActions(): InputActions {
    return { ...this.actions };
  }

  isKeyJustPressed(key: string): boolean {
    return this.justPressedKeys.has(key);
  }

  onSwipeLeft(callback: () => void): void {
    this.onSwipeLeftCallbacks.push(callback);
  }

  onSwipeRight(callback: () => void): void {
    this.onSwipeRightCallbacks.push(callback);
  }

  onTap(callback: (x: number, y: number) => void): void {
    this.onTapCallbacks.push(callback);
  }

  offSwipeLeft(callback: () => void): void {
    const index = this.onSwipeLeftCallbacks.indexOf(callback);
    if (index > -1) this.onSwipeLeftCallbacks.splice(index, 1);
  }

  offSwipeRight(callback: () => void): void {
    const index = this.onSwipeRightCallbacks.indexOf(callback);
    if (index > -1) this.onSwipeRightCallbacks.splice(index, 1);
  }

  offTap(callback: (x: number, y: number) => void): void {
    const index = this.onTapCallbacks.indexOf(callback);
    if (index > -1) this.onTapCallbacks.splice(index, 1);
  }

  destroy(): void {
    if (this._scene) {
      this._scene.input.off('pointerdown', this.handlePointerDown, this);
      this._scene.input.off('pointerup', this.handlePointerUp, this);
    }
    this._scene = null;
    this.keys = {};
    this.justPressedKeys.clear();
    this.onSwipeLeftCallbacks = [];
    this.onSwipeRightCallbacks = [];
    this.onTapCallbacks = [];
  }
}
