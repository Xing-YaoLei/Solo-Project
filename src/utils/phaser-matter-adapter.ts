import Matter from 'matter-js';

interface DragOptions {
  friction?: number;
  restitution?: number;
  inertia?: number;
  bounds?: { x: number; y: number; width: number; height: number };
}

interface DraggableObject {
  gameObject: Phaser.GameObjects.GameObject;
  body: Matter.Body;
  originalX: number;
  originalY: number;
}

export class DragPhysics {
  private scene: Phaser.Scene;
  private engine: Matter.Engine;
  private world: Matter.World;
  private mouseConstraint: Matter.MouseConstraint | null = null;
  private draggableObjects: Map<string, DraggableObject> = new Map();
  private bounds?: { x: number; y: number; width: number; height: number };

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.engine = Matter.Engine.create();
    this.world = this.engine.world;
    this.engine.gravity.y = 0;

    if (scene.matter) {
      scene.matter.world.enabled = false;
    }

    this.startEngine();
  }

  private startEngine(): void {
    this.scene.events.on('update', (_, delta: number) => {
      Matter.Engine.update(this.engine, delta);
      this.syncPositions();
    });
  }

  private syncPositions(): void {
    this.draggableObjects.forEach(({ gameObject, body }) => {
      const obj = gameObject as unknown as { x: number; y: number; rotation: number };
      if ('x' in obj && 'y' in obj && 'rotation' in obj) {
        obj.x = body.position.x;
        obj.y = body.position.y;
        obj.rotation = body.angle;
      }
    });
  }

  enableDrag(
    gameObject: Phaser.GameObjects.Image & Phaser.GameObjects.Components.Transform,
    options: DragOptions = {}
  ): void {
    const {
      friction = 0.1,
      restitution = 0.5,
      inertia = Infinity,
      bounds,
    } = options;

    if (bounds) {
      this.bounds = bounds;
    }

    const body = Matter.Bodies.rectangle(
      gameObject.x,
      gameObject.y,
      gameObject.width,
      gameObject.height,
      {
        friction,
        restitution,
        inertia,
        isStatic: false,
      }
    );

    Matter.World.add(this.world, body);

    this.draggableObjects.set(gameObject.name || gameObject.type, {
      gameObject,
      body,
      originalX: gameObject.x,
      originalY: gameObject.y,
    });

    if (!this.mouseConstraint) {
      this.setupMouseConstraint();
    }

    gameObject.setInteractive({
      draggable: true,
      useHandCursor: true,
    });

    this.scene.input.setDraggable(gameObject);

    gameObject.on('drag', (pointer: Phaser.Input.Pointer) => {
      const { x, y } = this.clampToBounds(pointer.x, pointer.y);
      Matter.Body.setPosition(body, { x, y });
    });

    gameObject.on('dragend', () => {
      const velocity = {
        x: this.scene.input.activePointer.velocity.x * 0.5,
        y: this.scene.input.activePointer.velocity.y * 0.5,
      };
      Matter.Body.setVelocity(body, velocity);
    });
  }

  disableDrag(gameObject: Phaser.GameObjects.Image): void {
    const key = gameObject.name || gameObject.type;
    const draggable = this.draggableObjects.get(key);
    if (draggable) {
      Matter.World.remove(this.world, draggable.body);
      this.draggableObjects.delete(key);
    }

    gameObject.disableInteractive();
  }

  private setupMouseConstraint(): void {
    const canvas = this.scene.game.canvas;
    const mouse = Matter.Mouse.create(canvas);

    const wheelHandler = (mouse as unknown as { wheel: EventListener }).wheel;
    if (wheelHandler) {
      mouse.element.removeEventListener('wheel', wheelHandler);
      mouse.element.removeEventListener('mousewheel', wheelHandler);
      mouse.element.removeEventListener('DOMMouseScroll', wheelHandler);
    }

    this.mouseConstraint = Matter.MouseConstraint.create(this.engine, {
      mouse,
      constraint: {
        stiffness: 0.2,
        damping: 0.1,
      },
    });

    Matter.World.add(this.world, this.mouseConstraint);

    Matter.Events.on(this.mouseConstraint, 'startdrag', () => {
      this.scene.input.setDefaultCursor('grabbing');
    });

    Matter.Events.on(this.mouseConstraint, 'enddrag', () => {
      this.scene.input.setDefaultCursor('grab');
    });
  }

  setBounds(x: number, y: number, width: number, height: number): void {
    this.bounds = { x, y, width, height };

    const wallThickness = 50;
    const walls = [
      Matter.Bodies.rectangle(x + width / 2, y - wallThickness / 2, width, wallThickness, { isStatic: true }),
      Matter.Bodies.rectangle(x + width / 2, y + height + wallThickness / 2, width, wallThickness, { isStatic: true }),
      Matter.Bodies.rectangle(x - wallThickness / 2, y + height / 2, wallThickness, height, { isStatic: true }),
      Matter.Bodies.rectangle(x + width + wallThickness / 2, y + height / 2, wallThickness, height, { isStatic: true }),
    ];

    Matter.World.add(this.world, walls);
  }

  private clampToBounds(x: number, y: number): { x: number; y: number } {
    if (!this.bounds) return { x, y };

    return {
      x: Math.max(this.bounds.x, Math.min(this.bounds.x + this.bounds.width, x)),
      y: Math.max(this.bounds.y, Math.min(this.bounds.y + this.bounds.height, y)),
    };
  }

  resetPosition(gameObject: Phaser.GameObjects.Image): void {
    const key = gameObject.name || gameObject.type;
    const draggable = this.draggableObjects.get(key);
    if (draggable) {
      Matter.Body.setPosition(draggable.body, {
        x: draggable.originalX,
        y: draggable.originalY,
      });
      Matter.Body.setVelocity(draggable.body, { x: 0, y: 0 });
      Matter.Body.setAngularVelocity(draggable.body, 0);
    }
  }

  resetAll(): void {
    this.draggableObjects.forEach(({ body, originalX, originalY }) => {
      Matter.Body.setPosition(body, { x: originalX, y: originalY });
      Matter.Body.setVelocity(body, { x: 0, y: 0 });
      Matter.Body.setAngularVelocity(body, 0);
    });
  }

  destroy(): void {
    Matter.Engine.clear(this.engine);
    this.draggableObjects.clear();
    this.mouseConstraint = null;
  }
}

export class InertialScroller {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private velocityY = 0;
  private isDragging = false;
  private lastPointerY = 0;
  private minY = 0;
  private maxY = 0;
  private friction = 0.95;

  constructor(
    scene: Phaser.Scene,
    container: Phaser.GameObjects.Container,
    options: { minY?: number; maxY?: number; friction?: number } = {}
  ) {
    this.scene = scene;
    this.container = container;
    this.minY = options.minY ?? 0;
    this.maxY = options.maxY ?? 0;
    this.friction = options.friction ?? 0.95;

    this.setupInput();
    this.setupUpdate();
  }

  private setupInput(): void {
    this.container.setInteractive({
      draggable: true,
      useHandCursor: true,
    });

    this.container.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.isDragging = true;
      this.lastPointerY = pointer.y;
      this.velocityY = 0;
    });

    this.container.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.isDragging) return;

      const deltaY = pointer.y - this.lastPointerY;
      this.container.y += deltaY;
      this.lastPointerY = pointer.y;
      this.clampPosition();
    });

    this.container.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (this.isDragging) {
        this.velocityY = pointer.velocity.y * 10;
        this.isDragging = false;
      }
    });

    this.container.on('pointerout', () => {
      this.isDragging = false;
    });
  }

  private setupUpdate(): void {
    this.scene.events.on('update', () => {
      if (!this.isDragging && Math.abs(this.velocityY) > 0.1) {
        this.container.y += this.velocityY;
        this.velocityY *= this.friction;
        this.clampPosition();

        if (Math.abs(this.velocityY) < 0.1) {
          this.velocityY = 0;
        }
      }
    });
  }

  private clampPosition(): void {
    if (this.container.y > this.minY) {
      this.container.y = this.minY;
      this.velocityY = 0;
    } else if (this.container.y < this.maxY) {
      this.container.y = this.maxY;
      this.velocityY = 0;
    }
  }

  setBounds(minY: number, maxY: number): void {
    this.minY = minY;
    this.maxY = maxY;
    this.clampPosition();
  }

  scrollTo(y: number, animate = false): void {
    if (animate) {
      this.scene.tweens.add({
        targets: this.container,
        y,
        duration: 300,
        ease: 'Power2.Out',
      });
    } else {
      this.container.y = y;
      this.clampPosition();
    }
  }

  stop(): void {
    this.velocityY = 0;
    this.isDragging = false;
  }

  destroy(): void {
    this.container.removeInteractive();
    this.scene.events.off('update');
  }
}
