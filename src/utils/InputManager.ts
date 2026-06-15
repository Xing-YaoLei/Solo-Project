import { KEY_MAPPINGS, InputMethod } from '../types';
import { isKeyInMapping } from './index';

type InputCallback = (input: string, method: InputMethod) => void;
type DragCallback = (x: number, y: number, dx: number, dy: number) => void;

interface TouchData {
  identifier: number;
  startX: number;
  startY: number;
  lastX: number;
  lastY: number;
  startTime: number;
}

class InputManager {
  private scene: Phaser.Scene | null = null;
  private keyboardListeners: Map<string, Set<InputCallback>>;
  private touchListeners: Set<InputCallback>;
  private dragStartListeners: Set<DragCallback>;
  private dragMoveListeners: Set<DragCallback>;
  private dragEndListeners: Set<DragCallback>;
  private activeTouches: Map<number, TouchData>;
  private isDragging: boolean;
  private keysPressed: Set<string>;
  private lastKeyPressTime: number;
  private keyRepeatDelay: number;
  private keyRepeatInterval: number;
  private selectedIndex: number;
  private maxIndex: number;

  constructor() {
    this.keyboardListeners = new Map();
    this.touchListeners = new Set();
    this.dragStartListeners = new Set();
    this.dragMoveListeners = new Set();
    this.dragEndListeners = new Set();
    this.activeTouches = new Map();
    this.isDragging = false;
    this.keysPressed = new Set();
    this.lastKeyPressTime = 0;
    this.keyRepeatDelay = 500;
    this.keyRepeatInterval = 100;
    this.selectedIndex = 0;
    this.maxIndex = 0;
  }

  initialize(scene: Phaser.Scene): void {
    this.scene = scene;
    this.setupKeyboardInput(scene);
    this.setupTouchInput(scene);
  }

  private setupKeyboardInput(scene: Phaser.Scene): void {
    scene.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      this.handleKeyDown(event.key);
    });

    scene.input.keyboard?.on('keyup', (event: KeyboardEvent) => {
      this.handleKeyUp(event.key);
    });
  }

  private setupTouchInput(scene: Phaser.Scene): void {
    scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.isDown) {
        this.handleTouchStart(pointer);
      }
    });

    scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (pointer.isDown) {
        this.handleTouchMove(pointer);
      }
    });

    scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      this.handleTouchEnd(pointer);
    });

    scene.input.on('pointercancel', (pointer: Phaser.Input.Pointer) => {
      this.handleTouchEnd(pointer);
    });
  }

  private handleKeyDown(key: string): void {
    const now = Date.now();
    const shouldHandle = !this.keysPressed.has(key) ||
      (now - this.lastKeyPressTime > this.keyRepeatDelay && now - this.lastKeyPressTime > this.keyRepeatInterval);

    if (shouldHandle) {
      this.keysPressed.add(key);
      this.lastKeyPressTime = now;

      for (const mapping of Object.keys(KEY_MAPPINGS) as Array<keyof typeof KEY_MAPPINGS>) {
        if (isKeyInMapping(key, mapping)) {
          this.notifyKeyboardListeners(mapping);
          this.handleNavigation(mapping);
          break;
        }
      }

      if (/^[0-9]$/.test(key)) {
        this.notifyKeyboardListeners('NUMBER_' + key);
      }

      if (key === 'Backspace') {
        this.notifyKeyboardListeners('BACKSPACE');
      }
    }
  }

  private handleKeyUp(key: string): void {
    this.keysPressed.delete(key);
  }

  private handleTouchStart(pointer: Phaser.Input.Pointer): void {
    const touchData: TouchData = {
      identifier: pointer.id,
      startX: pointer.x,
      startY: pointer.y,
      lastX: pointer.x,
      lastY: pointer.y,
      startTime: Date.now()
    };
    this.activeTouches.set(pointer.id, touchData);
    this.isDragging = true;
    this.notifyDragStartListeners(pointer.x, pointer.y, 0, 0);
  }

  private handleTouchMove(pointer: Phaser.Input.Pointer): void {
    const touchData = this.activeTouches.get(pointer.id);
    if (!touchData || !this.isDragging) return;

    const dx = pointer.x - touchData.lastX;
    const dy = pointer.y - touchData.lastY;

    touchData.lastX = pointer.x;
    touchData.lastY = pointer.y;

    this.notifyDragMoveListeners(pointer.x, pointer.y, dx, dy);

    if (Math.abs(dx) > 50) {
      if (dx > 0) {
        this.notifyTouchListeners('SWIPE_RIGHT');
      } else {
        this.notifyTouchListeners('SWIPE_LEFT');
      }
    }

    if (Math.abs(dy) > 50) {
      if (dy > 0) {
        this.notifyTouchListeners('SWIPE_DOWN');
      } else {
        this.notifyTouchListeners('SWIPE_UP');
      }
    }
  }

  private handleTouchEnd(pointer: Phaser.Input.Pointer): void {
    const touchData = this.activeTouches.get(pointer.id);
    if (!touchData) return;

    const dx = pointer.x - touchData.startX;
    const dy = pointer.y - touchData.startY;
    const duration = Date.now() - touchData.startTime;

    if (Math.abs(dx) < 10 && Math.abs(dy) < 10 && duration < 300) {
      this.notifyTouchListeners('TAP');
    } else if (duration > 500 && Math.abs(dx) < 10 && Math.abs(dy) < 10) {
      this.notifyTouchListeners('LONG_PRESS');
    }

    this.notifyDragEndListeners(pointer.x, pointer.y, dx, dy);
    this.activeTouches.delete(pointer.id);
    this.isDragging = false;
  }

  private handleNavigation(mapping: keyof typeof KEY_MAPPINGS): void {
    switch (mapping) {
      case 'LEFT':
        this.notifyKeyboardListeners('NAV_LEFT');
        break;
      case 'RIGHT':
        this.notifyKeyboardListeners('NAV_RIGHT');
        break;
      case 'TAB_LEFT':
        this.notifyKeyboardListeners('TAB_LEFT');
        break;
      case 'TAB_RIGHT':
        this.notifyKeyboardListeners('TAB_RIGHT');
        break;
    }
  }

  onKeyboard(input: string, callback: InputCallback): () => void {
    if (!this.keyboardListeners.has(input)) {
      this.keyboardListeners.set(input, new Set());
    }
    this.keyboardListeners.get(input)!.add(callback);
    return () => this.keyboardListeners.get(input)?.delete(callback);
  }

  onTouch(callback: InputCallback): () => void {
    this.touchListeners.add(callback);
    return () => this.touchListeners.delete(callback);
  }

  onDragStart(callback: DragCallback): () => void {
    this.dragStartListeners.add(callback);
    return () => this.dragStartListeners.delete(callback);
  }

  onDragMove(callback: DragCallback): () => void {
    this.dragMoveListeners.add(callback);
    return () => this.dragMoveListeners.delete(callback);
  }

  onDragEnd(callback: DragCallback): () => void {
    this.dragEndListeners.add(callback);
    return () => this.dragEndListeners.delete(callback);
  }

  private notifyKeyboardListeners(input: string): void {
    const listeners = this.keyboardListeners.get(input);
    if (listeners) {
      listeners.forEach(callback => callback(input, 'keyboard'));
    }
  }

  private notifyTouchListeners(input: string): void {
    this.touchListeners.forEach(callback => callback(input, 'touch'));
  }

  private notifyDragStartListeners(x: number, y: number, dx: number, dy: number): void {
    this.dragStartListeners.forEach(callback => callback(x, y, dx, dy));
  }

  private notifyDragMoveListeners(x: number, y: number, dx: number, dy: number): void {
    this.dragMoveListeners.forEach(callback => callback(x, y, dx, dy));
  }

  private notifyDragEndListeners(x: number, y: number, dx: number, dy: number): void {
    this.dragEndListeners.forEach(callback => callback(x, y, dx, dy));
  }

  setMaxIndex(max: number): void {
    this.maxIndex = max;
    if (this.selectedIndex > max) {
      this.selectedIndex = max;
    }
  }

  getSelectedIndex(): number {
    return this.selectedIndex;
  }

  setSelectedIndex(index: number): void {
    this.selectedIndex = Math.max(0, Math.min(this.maxIndex, index));
  }

  isKeyPressed(key: string): boolean {
    return this.keysPressed.has(key);
  }

  getActiveTouchCount(): number {
    return this.activeTouches.size;
  }

  setKeyRepeat(delay: number, interval: number): void {
    this.keyRepeatDelay = delay;
    this.keyRepeatInterval = interval;
  }

  destroy(): void {
    this.keyboardListeners.clear();
    this.touchListeners.clear();
    this.dragStartListeners.clear();
    this.dragMoveListeners.clear();
    this.dragEndListeners.clear();
    this.activeTouches.clear();
    this.keysPressed.clear();
    this.scene = null;
  }
}

export const inputManager = new InputManager();
