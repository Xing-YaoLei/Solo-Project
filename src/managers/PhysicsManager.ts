import Matter from 'matter-js';
import { Scene } from 'phaser';

export interface PhysicsObject {
  body: Matter.Body;
  graphic: Phaser.GameObjects.Graphics | Phaser.GameObjects.Text;
  type: 'circle' | 'rectangle';
}

export class PhysicsManager {
  private static instance: PhysicsManager;
  private engine!: Matter.Engine;
  private runner!: Matter.Runner;
  private objects: PhysicsObject[] = [];
  private scene: Scene | null = null;
  private isRunning: boolean = false;

  private constructor() {}

  static getInstance(): PhysicsManager {
    if (!PhysicsManager.instance) {
      PhysicsManager.instance = new PhysicsManager();
    }
    return PhysicsManager.instance;
  }

  init(scene: Scene, gravity: number = 1): void {
    this.scene = scene;
    
    this.engine = Matter.Engine.create({
      gravity: { x: 0, y: gravity },
    });

    this.runner = Matter.Runner.create();
  }

  start(): void {
    if (this.isRunning) return;
    if (this.runner && this.engine) {
      Matter.Runner.run(this.runner, this.engine);
      this.isRunning = true;
    }
  }

  stop(): void {
    if (!this.isRunning) return;
    if (this.runner) {
      Matter.Runner.stop(this.runner);
      this.isRunning = false;
    }
  }

  addWall(x: number, y: number, width: number, height: number): Matter.Body {
    const wall = Matter.Bodies.rectangle(x, y, width, height, {
      isStatic: true,
      render: { fillStyle: '#ffffff' },
    });
    Matter.Composite.add(this.engine.world, wall);
    return wall;
  }

  addCircle(
    x: number,
    y: number,
    radius: number,
    color: string,
    options?: Matter.IBodyDefinition
  ): PhysicsObject {
    const body = Matter.Bodies.circle(x, y, radius, {
      restitution: 0.6,
      friction: 0.1,
      ...options,
    });

    const graphic = this.scene!.add.graphics();
    graphic.fillStyle(Phaser.Display.Color.HexStringToColor(color).color, 1);
    graphic.fillCircle(0, 0, radius);

    Matter.Composite.add(this.engine.world, body);

    const obj: PhysicsObject = {
      body,
      graphic,
      type: 'circle',
    };

    this.objects.push(obj);
    return obj;
  }

  addRectangle(
    x: number,
    y: number,
    width: number,
    height: number,
    color: string,
    options?: Matter.IBodyDefinition
  ): PhysicsObject {
    const body = Matter.Bodies.rectangle(x, y, width, height, {
      restitution: 0.5,
      friction: 0.1,
      ...options,
    });

    const graphic = this.scene!.add.graphics();
    graphic.fillStyle(Phaser.Display.Color.HexStringToColor(color).color, 1);
    graphic.fillRect(-width / 2, -height / 2, width, height);

    Matter.Composite.add(this.engine.world, body);

    const obj: PhysicsObject = {
      body,
      graphic,
      type: 'rectangle',
    };

    this.objects.push(obj);
    return obj;
  }

  update(): void {
    this.objects.forEach(obj => {
      obj.graphic.x = obj.body.position.x;
      obj.graphic.y = obj.body.position.y;
      obj.graphic.rotation = obj.body.angle;
    });
  }

  removeObject(obj: PhysicsObject): void {
    Matter.Composite.remove(this.engine.world, obj.body);
    obj.graphic.destroy();
    
    const index = this.objects.indexOf(obj);
    if (index > -1) {
      this.objects.splice(index, 1);
    }
  }

  clear(): void {
    this.objects.forEach(obj => {
      Matter.Composite.remove(this.engine.world, obj.body);
      obj.graphic.destroy();
    });
    this.objects = [];
  }

  destroy(): void {
    this.stop();
    this.clear();
    if (this.engine) {
      Matter.Engine.clear(this.engine);
    }
    this.scene = null;
  }

  getEngine(): Matter.Engine {
    return this.engine;
  }
}
