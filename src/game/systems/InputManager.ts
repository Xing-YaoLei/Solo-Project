export class InputManager {
  private scene: Phaser.Scene;
  private keyHandlers: Map<string, () => void> = new Map();
  private touchStartX: number = 0;
  private touchStartY: number = 0;
  private onSwipeLeft?: () => void;
  private onSwipeRight?: () => void;
  private onSwipeUp?: () => void;
  private onSwipeDown?: () => void;
  private onClick?: (x: number, y: number) => void;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.setupKeyboard();
    this.setupTouch();
  }

  private setupKeyboard(): void {
    this.scene.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      const handler = this.keyHandlers.get(event.key);
      if (handler) handler();
    });
  }

  private setupTouch(): void {
    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.touchStartX = pointer.x;
      this.touchStartY = pointer.y;
    });

    this.scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      const deltaX = pointer.x - this.touchStartX;
      const deltaY = pointer.y - this.touchStartY;
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);
      const threshold = 50;

      if (absX < 10 && absY < 10) {
        this.onClick?.(pointer.x, pointer.y);
      } else if (absX > absY && absX > threshold) {
        if (deltaX > 0) this.onSwipeRight?.();
        else this.onSwipeLeft?.();
      } else if (absY > absX && absY > threshold) {
        if (deltaY > 0) this.onSwipeDown?.();
        else this.onSwipeUp?.();
      }
    });
  }

  public onKey(key: string, handler: () => void): void {
    this.keyHandlers.set(key, handler);
  }

  public onKeys(keys: string[], handler: () => void): void {
    keys.forEach(key => this.keyHandlers.set(key, handler));
  }

  public setSwipeHandlers(handlers: {
    left?: () => void;
    right?: () => void;
    up?: () => void;
    down?: () => void;
  }): void {
    this.onSwipeLeft = handlers.left;
    this.onSwipeRight = handlers.right;
    this.onSwipeUp = handlers.up;
    this.onSwipeDown = handlers.down;
  }

  public setClickHandler(handler: (x: number, y: number) => void): void {
    this.onClick = handler;
  }

  public destroy(): void {
    this.scene.input.keyboard?.removeAllListeners();
    this.scene.input.removeAllListeners();
    this.keyHandlers.clear();
  }
}
