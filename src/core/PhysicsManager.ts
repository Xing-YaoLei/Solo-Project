import Matter from 'matter-js';
import { eventBus, GameEvent } from './EventBus';

export type BodyShape = 'rectangle' | 'circle' | 'polygon' | 'fromVertices';

export interface PhysicsBodyConfig {
  id: string;
  shape: BodyShape;
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  sides?: number;
  vertices?: { x: number; y: number }[];
  angle?: number;
  isStatic?: boolean;
  isSensor?: boolean;
  density?: number;
  friction?: number;
  frictionAir?: number;
  frictionStatic?: number;
  restitution?: number;
  label?: string;
  collisionFilter?: {
    category?: number;
    mask?: number;
    group?: number;
  };
  render?: {
    fillStyle?: string;
    strokeStyle?: string;
    lineWidth?: number;
    visible?: boolean;
    opacity?: number;
  };
}

export interface PhysicsWorldConfig {
  width: number;
  height: number;
  gravity?: { x: number; y: number };
  enableSleeping?: boolean;
  createBounds?: boolean;
  boundsThickness?: number;
}

export interface CollisionEvent {
  bodyA: Matter.Body;
  bodyB: Matter.Body;
  pair: Matter.Pair;
  timestamp: number;
}

export interface PhysicsStats {
  bodyCount: number;
  constraintCount: number;
  compositeCount: number;
  collisionCount: number;
  fps: number;
}

type CollisionCallback = (event: CollisionEvent) => void;

interface BodyEntry {
  id: string;
  body: Matter.Body;
  config: PhysicsBodyConfig;
}

export class PhysicsManager {
  private static instance: PhysicsManager | null = null;
  private engine: Matter.Engine | null = null;
  private world: Matter.World | null = null;
  private runner: Matter.Runner | null = null;
  private render: Matter.Render | null = null;
  
  private bodies: Map<string, BodyEntry> = new Map();
  private collisionListeners: Map<string, Set<CollisionCallback>> = new Map();
  private bodyCollisionListeners: Map<string, Set<CollisionCallback>> = new Map();
  
  private stats: PhysicsStats = {
    bodyCount: 0,
    constraintCount: 0,
    compositeCount: 0,
    collisionCount: 0,
    fps: 60,
  };
  
  private lastUpdateTime = 0;
  private frameCount = 0;
  private initialized = false;
  private debugMode = false;

  static getInstance(): PhysicsManager {
    if (!PhysicsManager.instance) {
      PhysicsManager.instance = new PhysicsManager();
    }
    return PhysicsManager.instance;
  }

  private constructor() {}

  init(config: PhysicsWorldConfig, canvas?: HTMLCanvasElement): void {
    if (this.initialized) return;
    
    this.engine = Matter.Engine.create({
      enableSleeping: config.enableSleeping ?? true,
      gravity: config.gravity || { x: 0, y: 1 },
    });
    
    this.world = this.engine.world;
    
    this.world.bounds = {
      min: { x: 0, y: 0 },
      max: { x: config.width, y: config.height },
    };
    
    if (config.createBounds) {
      this.createBounds(config.width, config.height, config.boundsThickness || 50);
    }
    
    if (canvas) {
      this.createDebugRenderer(canvas, config.width, config.height);
    }
    
    this.setupCollisionEvents();
    this.start();
    this.initialized = true;
    
    console.log('[PhysicsManager] Initialized');
  }

  private createBounds(width: number, height: number, thickness: number): void {
    const boundsConfig: PhysicsBodyConfig[] = [
      { id: 'bound_top', shape: 'rectangle', x: width / 2, y: -thickness / 2, width, height: thickness, isStatic: true, label: 'bound' },
      { id: 'bound_bottom', shape: 'rectangle', x: width / 2, y: height + thickness / 2, width, height: thickness, isStatic: true, label: 'bound' },
      { id: 'bound_left', shape: 'rectangle', x: -thickness / 2, y: height / 2, width: thickness, height, isStatic: true, label: 'bound' },
      { id: 'bound_right', shape: 'rectangle', x: width + thickness / 2, y: height / 2, width: thickness, height, isStatic: true, label: 'bound' },
    ];
    
    for (const cfg of boundsConfig) {
      this.createBody(cfg);
    }
  }

  private createDebugRenderer(canvas: HTMLCanvasElement, width: number, height: number): void {
    this.render = Matter.Render.create({
      canvas,
      engine: this.engine!,
      options: {
        width,
        height,
        wireframes: false,
        showAngleIndicator: true,
        showCollisions: true,
        showVelocity: true,
      },
    });
    
    Matter.Render.run(this.render);
    this.debugMode = true;
  }

  createBody(config: PhysicsBodyConfig): Matter.Body | null {
    if (!this.engine || !this.world) return null;
    
    if (this.bodies.has(config.id)) {
      console.warn(`[PhysicsManager] Body with id ${config.id} already exists`);
      return this.bodies.get(config.id)!.body;
    }
    
    const body = this.createMatterBody(config);
    
    if (!body) return null;
    
    body.id = Matter.Common.nextId();
    
    Matter.World.add(this.world, body);
    
    this.bodies.set(config.id, { id: config.id, body, config });
    this.stats.bodyCount++;
    
    return body;
  }

  createBodies(configs: PhysicsBodyConfig[]): Matter.Body[] {
    const bodies: Matter.Body[] = [];
    
    for (const config of configs) {
      const body = this.createBody(config);
      if (body) bodies.push(body);
    }
    
    return bodies;
  }

  getBody(id: string): Matter.Body | null {
    return this.bodies.get(id)?.body || null;
  }

  getBodyConfig(id: string): PhysicsBodyConfig | null {
    return this.bodies.get(id)?.config || null;
  }

  getAllBodies(): Matter.Body[] {
    return Array.from(this.bodies.values()).map(entry => entry.body);
  }

  removeBody(id: string): boolean {
    const entry = this.bodies.get(id);
    if (!entry || !this.world) return false;
    
    Matter.World.remove(this.world, entry.body);
    this.bodies.delete(id);
    this.bodyCollisionListeners.delete(id);
    this.stats.bodyCount--;
    
    return true;
  }

  removeBodies(ids: string[]): number {
    let removed = 0;
    for (const id of ids) {
      if (this.removeBody(id)) removed++;
    }
    return removed;
  }

  clear(): void {
    if (!this.world) return;
    
    for (const id of this.bodies.keys()) {
      const entry = this.bodies.get(id)!;
      Matter.World.remove(this.world, entry.body);
    }
    
    this.bodies.clear();
    this.bodyCollisionListeners.clear();
    this.stats.bodyCount = 0;
  }

  setBodyPosition(id: string, x: number, y: number): boolean {
    const body = this.getBody(id);
    if (!body) return false;
    
    Matter.Body.setPosition(body, { x, y });
    return true;
  }

  setBodyVelocity(id: string, x: number, y: number): boolean {
    const body = this.getBody(id);
    if (!body) return false;
    
    Matter.Body.setVelocity(body, { x, y });
    return true;
  }

  setBodyAngle(id: string, angle: number): boolean {
    const body = this.getBody(id);
    if (!body) return false;
    
    Matter.Body.setAngle(body, angle);
    return true;
  }

  setBodyAngularVelocity(id: string, velocity: number): boolean {
    const body = this.getBody(id);
    if (!body) return false;
    
    Matter.Body.setAngularVelocity(body, velocity);
    return true;
  }

  applyForce(id: string, x: number, y: number, forceX: number, forceY: number): boolean {
    const body = this.getBody(id);
    if (!body) return false;
    
    Matter.Body.applyForce(body, { x, y }, { x: forceX, y: forceY });
    return true;
  }

  applyForceToCenter(id: string, forceX: number, forceY: number): boolean {
    const body = this.getBody(id);
    if (!body) return false;
    
    Matter.Body.applyForce(body, body.position, { x: forceX, y: forceY });
    return true;
  }

  setBodyStatic(id: string, isStatic: boolean): boolean {
    const body = this.getBody(id);
    if (!body) return false;
    
    Matter.Body.setStatic(body, isStatic);
    return true;
  }

  setBodySensor(id: string, isSensor: boolean): boolean {
    const body = this.getBody(id);
    if (!body) return false;
    
    body.isSensor = isSensor;
    return true;
  }

  onCollisionStart(callback: CollisionCallback): () => void {
    return this.addListener(this.collisionListeners, 'start', callback);
  }

  onCollisionEnd(callback: CollisionCallback): () => void {
    return this.addListener(this.collisionListeners, 'end', callback);
  }

  onCollisionActive(callback: CollisionCallback): () => void {
    return this.addListener(this.collisionListeners, 'active', callback);
  }

  onBodyCollisionStart(bodyId: string, callback: CollisionCallback): () => void {
    return this.addBodyListener(bodyId, 'start', callback);
  }

  onBodyCollisionEnd(bodyId: string, callback: CollisionCallback): () => void {
    return this.addBodyListener(bodyId, 'end', callback);
  }

  onBodyCollisionActive(bodyId: string, callback: CollisionCallback): () => void {
    return this.addBodyListener(bodyId, 'active', callback);
  }

  offCollisionStart(callback: CollisionCallback): void {
    this.removeListener(this.collisionListeners, 'start', callback);
  }

  offCollisionEnd(callback: CollisionCallback): void {
    this.removeListener(this.collisionListeners, 'end', callback);
  }

  offCollisionActive(callback: CollisionCallback): void {
    this.removeListener(this.collisionListeners, 'active', callback);
  }

  setGravity(x: number, y: number): void {
    if (!this.engine) return;
    this.engine.gravity.x = x;
    this.engine.gravity.y = y;
  }

  setDebugMode(enabled: boolean, canvas?: HTMLCanvasElement): void {
    if (enabled && !this.render && canvas) {
      const config = {
        width: canvas.width,
        height: canvas.height,
      };
      this.createDebugRenderer(canvas, config.width, config.height);
    } else if (!enabled && this.render) {
      Matter.Render.stop(this.render);
      this.render.canvas.remove();
      this.render = null;
    }
    
    this.debugMode = enabled;
  }

  isDebugMode(): boolean {
    return this.debugMode;
  }

  getStats(): PhysicsStats {
    return { ...this.stats };
  }

  update(deltaTime?: number): void {
    if (!this.engine) return;
    
    const now = performance.now();
    this.frameCount++;
    
    if (now - this.lastUpdateTime >= 1000) {
      this.stats.fps = Math.round((this.frameCount * 1000) / (now - this.lastUpdateTime));
      this.frameCount = 0;
      this.lastUpdateTime = now;
    }
    
    if (deltaTime !== undefined) {
      Matter.Engine.update(this.engine, deltaTime);
    }
  }

  start(): void {
    if (!this.engine) return;
    
    this.runner = Matter.Runner.create();
    Matter.Runner.run(this.runner, this.engine);
    eventBus.emit(GameEvent.GAME_RESUMED);
  }

  stop(): void {
    if (this.runner) {
      Matter.Runner.stop(this.runner);
      this.runner = null;
    }
    eventBus.emit(GameEvent.GAME_PAUSED);
  }

  pause(): void {
    this.stop();
  }

  resume(): void {
    this.start();
  }

  isRunning(): boolean {
    return this.runner !== null;
  }

  destroy(): void {
    this.clear();
    
    if (this.render) {
      Matter.Render.stop(this.render);
      this.render.canvas.remove();
      this.render = null;
    }
    
    if (this.runner) {
      Matter.Runner.stop(this.runner);
      this.runner = null;
    }
    
    if (this.engine) {
      Matter.Engine.clear(this.engine);
      this.engine = null;
    }
    
    this.world = null;
    this.collisionListeners.clear();
    this.initialized = false;
    this.debugMode = false;
    
    console.log('[PhysicsManager] Destroyed');
  }

  private createMatterBody(config: PhysicsBodyConfig): Matter.Body | null {
    const options: Matter.IBodyDefinition = {
      isStatic: config.isStatic ?? false,
      isSensor: config.isSensor ?? false,
      density: config.density ?? 0.001,
      friction: config.friction ?? 0.1,
      frictionAir: config.frictionAir ?? 0.01,
      frictionStatic: config.frictionStatic ?? 0.5,
      restitution: config.restitution ?? 0.2,
      angle: config.angle ?? 0,
      label: config.label ?? config.id,
      collisionFilter: config.collisionFilter,
      render: config.render,
    };
    
    switch (config.shape) {
      case 'rectangle':
        if (!config.width || !config.height) {
          console.error('[PhysicsManager] Rectangle requires width and height');
          return null;
        }
        return Matter.Bodies.rectangle(config.x, config.y, config.width, config.height, options);
        
      case 'circle':
        if (!config.radius) {
          console.error('[PhysicsManager] Circle requires radius');
          return null;
        }
        return Matter.Bodies.circle(config.x, config.y, config.radius, options);
        
      case 'polygon':
        if (!config.radius || !config.sides) {
          console.error('[PhysicsManager] Polygon requires radius and sides');
          return null;
        }
        return Matter.Bodies.polygon(config.x, config.y, config.sides, config.radius, options);
        
      case 'fromVertices':
        if (!config.vertices || config.vertices.length < 3) {
          console.error('[PhysicsManager] fromVertices requires at least 3 vertices');
          return null;
        }
        return Matter.Bodies.fromVertices(config.x, config.y, [config.vertices], options);
        
      default:
        console.error(`[PhysicsManager] Unknown shape: ${config.shape}`);
        return null;
    }
  }

  private setupCollisionEvents(): void {
    if (!this.engine) return;
    
    Matter.Events.on(this.engine, 'collisionStart', (event) => {
      this.stats.collisionCount++;
      this.handleCollision(event.pairs, 'start');
    });
    
    Matter.Events.on(this.engine, 'collisionEnd', (event) => {
      this.handleCollision(event.pairs, 'end');
    });
    
    Matter.Events.on(this.engine, 'collisionActive', (event) => {
      this.handleCollision(event.pairs, 'active');
    });
  }

  private handleCollision(pairs: Matter.Pair[], type: string): void {
    const timestamp = Date.now();
    
    for (const pair of pairs) {
      const collisionEvent: CollisionEvent = {
        bodyA: pair.bodyA,
        bodyB: pair.bodyB,
        pair,
        timestamp,
      };
      
      const listeners = this.collisionListeners.get(type);
      if (listeners) {
        for (const callback of listeners) {
          this.safeInvoke(callback, collisionEvent);
        }
      }
      
      this.notifyBodyListeners(pair.bodyA.label, type, collisionEvent);
      this.notifyBodyListeners(pair.bodyB.label, type, collisionEvent);
      
      const bodyIdA = this.findBodyIdByMatterId(pair.bodyA.id);
      const bodyIdB = this.findBodyIdByMatterId(pair.bodyB.id);
      
      if (bodyIdA) this.notifyBodyListeners(bodyIdA, type, collisionEvent);
      if (bodyIdB) this.notifyBodyListeners(bodyIdB, type, collisionEvent);
    }
  }

  private findBodyIdByMatterId(matterId: number): string | null {
    for (const [id, entry] of this.bodies) {
      if (entry.body.id === matterId) return id;
    }
    return null;
  }

  private notifyBodyListeners(bodyId: string, type: string, event: CollisionEvent): void {
    const key = `${bodyId}:${type}`;
    const listeners = this.bodyCollisionListeners.get(key);
    
    if (listeners) {
      for (const callback of listeners) {
        this.safeInvoke(callback, event);
      }
    }
  }

  private addListener(
    map: Map<string, Set<CollisionCallback>>,
    type: string,
    callback: CollisionCallback
  ): () => void {
    if (!map.has(type)) {
      map.set(type, new Set());
    }
    map.get(type)!.add(callback);
    
    return () => this.removeListener(map, type, callback);
  }

  private removeListener(
    map: Map<string, Set<CollisionCallback>>,
    type: string,
    callback: CollisionCallback
  ): void {
    const listeners = map.get(type);
    if (listeners) {
      listeners.delete(callback);
      if (listeners.size === 0) {
        map.delete(type);
      }
    }
  }

  private addBodyListener(
    bodyId: string,
    type: string,
    callback: CollisionCallback
  ): () => void {
    const key = `${bodyId}:${type}`;
    if (!this.bodyCollisionListeners.has(key)) {
      this.bodyCollisionListeners.set(key, new Set());
    }
    this.bodyCollisionListeners.get(key)!.add(callback);
    
    return () => {
      const listeners = this.bodyCollisionListeners.get(key);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          this.bodyCollisionListeners.delete(key);
        }
      }
    };
  }

  private safeInvoke(callback: CollisionCallback, event: CollisionEvent): void {
    try {
      callback(event);
    } catch (error) {
      console.error('[PhysicsManager] Error in collision callback:', error);
    }
  }
}

export const physicsManager = PhysicsManager.getInstance();
