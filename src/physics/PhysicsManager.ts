import * as pc from 'playcanvas';

declare const Ammo: any;

export interface PhysicsOptions {
  gravity?: [number, number, number];
}

export interface PhysicsBody {
  entity: pc.Entity;
  rigidBody?: any;
  collisionShape?: any;
  isStatic: boolean;
  mass: number;
}

export class PhysicsManager {
  private physicsWorld: any = null;
  private collisionConfiguration: any = null;
  private dispatcher: any = null;
  private overlappingPairCache: any = null;
  private solver: any = null;
  private bodies: Map<string, PhysicsBody> = new Map();
  private initialized: boolean = false;
  private ammoReady: boolean = false;
  private gravity: [number, number, number] = [0, -9.8, 0];

  constructor(options: PhysicsOptions = {}) {
    if (options.gravity) {
      this.gravity = options.gravity;
    }
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    if (typeof Ammo === 'undefined') {
      throw new Error('Ammo.js 物理引擎未加载，请确保 ammo.js 已正确引入');
    }

    if (typeof Ammo === 'function') {
      await Ammo();
    }

    this.ammoReady = true;
    this.setupPhysicsWorld();
    this.initialized = true;
    console.log('🎯 Ammo.js 物理引擎初始化成功');
  }

  private setupPhysicsWorld(): void {
    if (!this.ammoReady) return;

    this.collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
    this.dispatcher = new Ammo.btCollisionDispatcher(this.collisionConfiguration);
    this.overlappingPairCache = new Ammo.btDbvtBroadphase();
    this.solver = new Ammo.btSequentialImpulseConstraintSolver();

    this.physicsWorld = new Ammo.btDiscreteDynamicsWorld(
      this.dispatcher,
      this.overlappingPairCache,
      this.solver,
      this.collisionConfiguration
    );

    this.physicsWorld.setGravity(new Ammo.btVector3(...this.gravity));
  }

  addStaticBox(id: string, entity: pc.Entity, halfExtents: [number, number, number]): PhysicsBody | null {
    if (!this.ammoReady || !this.physicsWorld) return null;

    const transform = new Ammo.btTransform();
    transform.setIdentity();
    const pos = entity.getPosition();
    transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));

    const motionState = new Ammo.btDefaultMotionState(transform);
    const shape = new Ammo.btBoxShape(
      new Ammo.btVector3(halfExtents[0] * 0.5, halfExtents[1] * 0.5, halfExtents[2] * 0.5)
    );

    const localInertia = new Ammo.btVector3(0, 0, 0);
    const rbInfo = new Ammo.btRigidBodyConstructionInfo(0, motionState, shape, localInertia);
    const body = new Ammo.btRigidBody(rbInfo);

    this.physicsWorld.addRigidBody(body);

    const physicsBody: PhysicsBody = {
      entity,
      rigidBody: body,
      collisionShape: shape,
      isStatic: true,
      mass: 0
    };

    this.bodies.set(id, physicsBody);
    return physicsBody;
  }

  addDynamicBox(id: string, entity: pc.Entity, halfExtents: [number, number, number], mass: number = 1): PhysicsBody | null {
    if (!this.ammoReady || !this.physicsWorld) return null;

    const transform = new Ammo.btTransform();
    transform.setIdentity();
    const pos = entity.getPosition();
    transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));

    const motionState = new Ammo.btDefaultMotionState(transform);
    const shape = new Ammo.btBoxShape(
      new Ammo.btVector3(halfExtents[0] * 0.5, halfExtents[1] * 0.5, halfExtents[2] * 0.5)
    );

    const localInertia = new Ammo.btVector3(0, 0, 0);
    shape.calculateLocalInertia(mass, localInertia);

    const rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, shape, localInertia);
    const body = new Ammo.btRigidBody(rbInfo);

    body.setFriction(0.5);
    body.setRestitution(0.2);
    body.setDamping(0.1, 0.1);

    this.physicsWorld.addRigidBody(body);

    const physicsBody: PhysicsBody = {
      entity,
      rigidBody: body,
      collisionShape: shape,
      isStatic: false,
      mass
    };

    this.bodies.set(id, physicsBody);
    return physicsBody;
  }

  removeBody(id: string): void {
    const body = this.bodies.get(id);
    if (body && this.physicsWorld && body.rigidBody) {
      this.physicsWorld.removeRigidBody(body.rigidBody);
      this.bodies.delete(id);
    }
  }

  applyImpulse(id: string, impulse: [number, number, number]): void {
    const body = this.bodies.get(id);
    if (!body || !body.rigidBody) return;

    body.rigidBody.activate(true);
    body.rigidBody.applyCentralImpulse(new Ammo.btVector3(...impulse));
  }

  applyForce(id: string, force: [number, number, number]): void {
    const body = this.bodies.get(id);
    if (!body || !body.rigidBody) return;

    body.rigidBody.activate(true);
    body.rigidBody.applyCentralForce(new Ammo.btVector3(...force));
  }

  setPosition(id: string, position: [number, number, number]): void {
    const body = this.bodies.get(id);
    if (!body || !body.rigidBody) return;

    const transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin(new Ammo.btVector3(position[0], position[1], position[2]));
    body.rigidBody.setWorldTransform(transform);
    body.rigidBody.activate(true);

    body.entity.setLocalPosition(position[0], position[1], position[2]);
  }

  update(dt: number): void {
    if (!this.ammoReady || !this.physicsWorld) return;

    const fixedDt = Math.min(dt, 1 / 30);
    this.physicsWorld.stepSimulation(fixedDt, 10, 1 / 60);

    const transform = new Ammo.btTransform();

    this.bodies.forEach((body) => {
      if (body.isStatic || !body.rigidBody) return;

      body.rigidBody.getWorldTransform(transform);
      const p = transform.getOrigin();
      const q = transform.getRotation();

      body.entity.setLocalPosition(p.x(), p.y(), p.z());
      body.entity.setLocalRotation(q.x(), q.y(), q.z(), q.w());
    });
  }

  isReady(): boolean {
    return this.ammoReady && this.initialized;
  }

  getBody(id: string): PhysicsBody | undefined {
    return this.bodies.get(id);
  }

  clearAll(): void {
    Array.from(this.bodies.keys()).forEach((id) => this.removeBody(id));
  }

  destroy(): void {
    this.clearAll();
    if (this.physicsWorld) {
      Ammo.destroy(this.physicsWorld);
      Ammo.destroy(this.solver);
      Ammo.destroy(this.overlappingPairCache);
      Ammo.destroy(this.dispatcher);
      Ammo.destroy(this.collisionConfiguration);
    }
    this.physicsWorld = null;
    this.initialized = false;
    this.ammoReady = false;
  }
}
