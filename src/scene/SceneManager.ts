import * as pc from 'playcanvas';

export interface SceneOptions {
  canvas: HTMLCanvasElement;
  enablePhysics?: boolean;
}

export interface SceneEventListener {
  onInitialized?(): void;
  onMaterialClicked?(materialName: string): void;
  onUpdate?(dt: number): void;
}

export class SceneManager {
  private app: pc.Application | null = null;
  private canvas: HTMLCanvasElement;
  private sceneRoot: pc.Entity | null = null;
  private materials: Map<string, pc.Entity> = new Map();
  private listeners: Set<SceneEventListener> = new Set();
  private enablePhysics: boolean;
  private initialized: boolean = false;
  private camera: pc.Entity | null = null;
  private animationTime: number = 0;

  constructor(options: SceneOptions) {
    this.canvas = options.canvas;
    this.enablePhysics = options.enablePhysics ?? true;
  }

  addListener(listener: SceneEventListener): void {
    this.listeners.add(listener);
  }

  removeListener(listener: SceneEventListener): void {
    this.listeners.delete(listener);
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    const graphicsDevice = new pc.GraphicsDevice(this.canvas, {
      antialias: true,
      depth: true,
      alpha: false
    });

    this.app = new pc.Application(this.canvas, { graphicsDevice });
    this.app.start();

    this.setupScene();
    this.setupLights();
    this.setupCamera();
    this.createDeskEnvironment();
    this.setupInput();

    this.app.on('update', (dt: number) => this.onUpdate(dt));

    window.addEventListener('resize', () => this.onResize());
    this.onResize();

    this.initialized = true;
    this.listeners.forEach((l) => l.onInitialized?.());
  }

  private setupScene(): void {
    if (!this.app) return;
    this.app.scene.ambientLight = new pc.Color(0.4, 0.4, 0.4);
    this.app.scene.skybox = null;
    this.sceneRoot = new pc.Entity('SceneRoot');
    this.app.root.addChild(this.sceneRoot);
  }

  private setupLights(): void {
    if (!this.app || !this.sceneRoot) return;

    const directionalLight = new pc.Entity('DirectionalLight');
    directionalLight.addComponent('light', {
      type: pc.LIGHTTYPE_DIRECTIONAL,
      color: new pc.Color(1, 0.95, 0.85),
      intensity: 1.0,
      castShadows: true,
      shadowBias: 0.2,
      normalOffsetBias: 0.05,
      shadowResolution: 2048
    });
    directionalLight.setLocalEulerAngles(45, 30, 0);
    directionalLight.setLocalPosition(5, 10, 5);
    this.sceneRoot.addChild(directionalLight);

    const ambientLight = new pc.Entity('AmbientLight');
    ambientLight.addComponent('light', {
      type: pc.LIGHTTYPE_POINT,
      color: new pc.Color(0.6, 0.6, 0.7),
      intensity: 0.4,
      range: 15
    });
    ambientLight.setLocalPosition(0, 3, 0);
    this.sceneRoot.addChild(ambientLight);
  }

  private setupCamera(): void {
    if (!this.app || !this.sceneRoot) return;

    this.camera = new pc.Entity('MainCamera');
    this.camera.addComponent('camera', {
      clearColor: new pc.Color(0.1, 0.12, 0.15),
      fov: 50,
      nearClip: 0.1,
      farClip: 100
    });
    this.camera.setLocalPosition(0, 2.5, 4);
    this.camera.lookAt(0, 0.5, 0);
    this.sceneRoot.addChild(this.camera);
  }

  private createDeskEnvironment(): void {
    if (!this.app || !this.sceneRoot) return;

    const desk = this.createBox('Desk', 4, 0.1, 2, [0.35, 0.2, 0.1]);
    desk.setLocalPosition(0, 0, 0);
    this.sceneRoot.addChild(desk);

    const legMaterial = new pc.StandardMaterial();
    legMaterial.diffuse = new pc.Color(0.25, 0.15, 0.08);
    legMaterial.update();

    const legPositions = [
      [-1.8, -0.55, 0.8], [1.8, -0.55, 0.8],
      [-1.8, -0.55, -0.8], [1.8, -0.55, -0.8]
    ];

    legPositions.forEach((pos, index) => {
      const leg = this.createBox(`DeskLeg_${index}`, 0.1, 1, 0.1, [0.25, 0.15, 0.08]);
      leg.setLocalPosition(pos[0], pos[1], pos[2]);
      this.sceneRoot.addChild(leg);
    });

    const floor = this.createBox('Floor', 20, 0.1, 20, [0.18, 0.18, 0.2]);
    floor.setLocalPosition(0, -1.1, 0);
    this.sceneRoot.addChild(floor);

    this.createVehicleDisplay();
  }

  private createVehicleDisplay(): void {
    if (!this.app || !this.sceneRoot) return;

    const displayStand = this.createBox('DisplayStand', 0.8, 0.8, 1.6, [0.3, 0.3, 0.35]);
    displayStand.setLocalPosition(-1.5, 0.45, 0);
    this.sceneRoot.addChild(displayStand);

    const carBody = this.createBox('CarBody', 0.6, 0.35, 1.2, [0.8, 0.15, 0.15]);
    carBody.setLocalPosition(-1.5, 1.0, 0);
    this.sceneRoot.addChild(carBody);

    const carTop = this.createBox('CarTop', 0.55, 0.25, 0.7, [0.85, 0.18, 0.18]);
    carTop.setLocalPosition(-1.5, 1.25, -0.1);
    this.sceneRoot.addChild(carTop);

    const wheelPositions = [
      [-1.78, 0.88, 0.45], [-1.22, 0.88, 0.45],
      [-1.78, 0.88, -0.45], [-1.22, 0.88, -0.45]
    ];

    wheelPositions.forEach((pos, index) => {
      const wheel = this.createCylinder(`Wheel_${index}`, 0.05, 0.15, 0.15, [0.1, 0.1, 0.1]);
      wheel.setLocalPosition(pos[0], pos[1], pos[2]);
      wheel.setLocalEulerAngles(0, 0, 90);
      this.sceneRoot.addChild(wheel);
    });
  }

  private createBox(name: string, width: number, height: number, depth: number, color: [number, number, number]): pc.Entity {
    if (!this.app) return new pc.Entity(name);

    const entity = new pc.Entity(name);
    entity.addComponent('render', {
      type: 'box'
    });

    const material = new pc.StandardMaterial();
    material.diffuse = new pc.Color(color[0], color[1], color[2]);
    material.metalness = 0.1;
    material.gloss = 0.5;
    material.update();

    const meshInstances = entity.render?.meshInstances;
    if (meshInstances && meshInstances.length > 0) {
      meshInstances[0].material = material;
    }

    entity.setLocalScale(width, height, depth);
    return entity;
  }

  private createCylinder(name: string, height: number, radius: number, baseRadius: number, color: [number, number, number]): pc.Entity {
    if (!this.app) return new pc.Entity(name);

    const entity = new pc.Entity(name);
    entity.addComponent('render', {
      type: 'cylinder'
    });

    const material = new pc.StandardMaterial();
    material.diffuse = new pc.Color(color[0], color[1], color[2]);
    material.metalness = 0.3;
    material.gloss = 0.6;
    material.update();

    const meshInstances = entity.render?.meshInstances;
    if (meshInstances && meshInstances.length > 0) {
      meshInstances[0].material = material;
    }

    entity.setLocalScale(radius * 2, height, baseRadius * 2);
    return entity;
  }

  createMaterialDocument(name: string, materialType: string, position: [number, number, number]): pc.Entity {
    if (!this.app || !this.sceneRoot) return new pc.Entity(name);

    const entity = new pc.Entity(name);
    entity.addComponent('render', { type: 'box' });

    const colors: Record<string, [number, number, number]> = {
      registration: [0.15, 0.4, 0.15],
      id_card: [0.7, 0.6, 0.2],
      contract: [0.8, 0.8, 0.95],
      invoice: [0.9, 0.85, 0.6],
      insurance: [0.2, 0.3, 0.6],
      finance: [0.5, 0.2, 0.5],
      default: [0.85, 0.85, 0.85]
    };

    const color = colors[materialType] ?? colors.default;
    const material = new pc.StandardMaterial();
    material.diffuse = new pc.Color(color[0], color[1], color[2]);
    material.metalness = 0.05;
    material.gloss = 0.7;
    material.update();

    const meshInstances = entity.render?.meshInstances;
    if (meshInstances && meshInstances.length > 0) {
      meshInstances[0].material = material;
    }

    entity.setLocalPosition(position[0], position[1], position[2]);
    entity.setLocalScale(0.35, 0.02, 0.25);

    entity.setLocalEulerAngles(-5, Math.random() * 10 - 5, Math.random() * 4 - 2);

    this.materials.set(name, entity);
    this.sceneRoot.addChild(entity);
    return entity;
  }

  highlightMaterial(name: string, highlight: boolean): void {
    const entity = this.materials.get(name);
    if (!entity) return;

    const meshInstances = entity.render?.meshInstances;
    if (!meshInstances || meshInstances.length === 0) return;

    const material = meshInstances[0].material as pc.StandardMaterial;
    if (highlight) {
      material.emissive = new pc.Color(0.5, 0.5, 0.1);
    } else {
      material.emissive = new pc.Color(0, 0, 0);
    }
    material.update();
  }

  removeMaterial(name: string): void {
    const entity = this.materials.get(name);
    if (entity && this.sceneRoot) {
      this.sceneRoot.removeChild(entity);
      entity.destroy();
      this.materials.delete(name);
    }
  }

  clearAllMaterials(): void {
    Array.from(this.materials.keys()).forEach((name) => this.removeMaterial(name));
  }

  showMaterialsForStep(stepIndex: number): void {
    this.clearAllMaterials();
    const baseY = 0.08;
    const startX = 0.2;
    const spacingX = 0.45;
    const startZ = 0.3;
    const spacingZ = -0.35;

    const docs: Array<{ name: string; type: string }> = [
      { name: '登记证书', type: 'registration' },
      { name: '车主身份证', type: 'id_card' },
      { name: '购车合同', type: 'contract' },
      { name: '保险单', type: 'insurance' },
      { name: '贷款协议', type: 'finance' },
      { name: '购车发票', type: 'invoice' }
    ];

    const activeDocs = docs.slice(0, Math.min(stepIndex + 3, docs.length));

    activeDocs.forEach((doc, index) => {
      const col = index % 3;
      const row = Math.floor(index / 3);
      this.createMaterialDocument(doc.name, doc.type, [
        startX + col * spacingX,
        baseY,
        startZ + row * spacingZ
      ]);
    });
  }

  private setupInput(): void {
    if (!this.app) return;

    this.app.mouse.on(pc.EVENT_MOUSEDOWN, (event: pc.MouseEvent) => {
      this.handleClick(event);
    });

    let isDragging = false;
    let lastX = 0;
    let lastY = 0;

    this.app.mouse.on(pc.EVENT_MOUSEDOWN, (event: pc.MouseEvent) => {
      if (event.button === 2 || event.button === 1) {
        isDragging = true;
        lastX = event.x;
        lastY = event.y;
      }
    });

    this.app.mouse.on(pc.EVENT_MOUSEUP, () => {
      isDragging = false;
    });

    this.app.mouse.on(pc.EVENT_MOUSEMOVE, (event: pc.MouseEvent) => {
      if (isDragging && this.camera && this.app) {
        const dx = event.x - lastX;
        const dy = event.y - lastY;
        lastX = event.x;
        lastY = event.y;

        const currentPos = this.camera.getLocalPosition();
        this.camera.setLocalPosition(
          currentPos.x - dx * 0.01,
          Math.max(1, currentPos.y + dy * 0.01),
          currentPos.z
        );
        this.camera.lookAt(0, 0.5, 0);
      }
    });

    this.app.mouse.on(pc.EVENT_MOUSEWHEEL, (event: pc.MouseWheelEvent) => {
      if (this.camera && this.app) {
        event.event.preventDefault();
        const wheel = event.wheel;
        const currentPos = this.camera.getLocalPosition();
        this.camera.setLocalPosition(
          currentPos.x,
          currentPos.y,
          Math.max(2, Math.min(8, currentPos.z - wheel * 0.3))
        );
      }
    }, this);
  }

  private handleClick(event: pc.MouseEvent): void {
    if (!this.app || !this.camera) return;

    const from = this.camera.camera?.screenToWorld(event.x, event.y, 0);
    const to = this.camera.camera?.screenToWorld(event.x, event.y, 1);

    if (!from || !to) return;

    const ray = new pc.Ray();
    ray.origin.copy(from);
    ray.direction.copy(to).sub(from).normalize();

    for (const [name, entity] of this.materials) {
      const meshInstances = entity.render?.meshInstances;
      if (!meshInstances || meshInstances.length === 0) continue;

      const mesh = meshInstances[0].mesh;
      if (!mesh) continue;

      const aabb = meshInstances[0].aabb;
      if (aabb && aabb.intersectsRay(ray)) {
        this.listeners.forEach((l) => l.onMaterialClicked?.(name));
        return;
      }
    }
  }

  private onUpdate(dt: number): void {
    this.animationTime += dt;

    this.materials.forEach((entity, name) => {
      const pos = entity.getLocalPosition();
      entity.setLocalPosition(
        pos.x,
        pos.y + Math.sin(this.animationTime * 2 + name.length) * 0.001,
        pos.z
      );
    });

    this.listeners.forEach((l) => l.onUpdate?.(dt));
  }

  private onResize(): void {
    if (!this.app) return;
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.app.canvas.width = width;
    this.app.canvas.height = height;
    this.app.graphicsDevice.width = width;
    this.app.graphicsDevice.height = height;
    this.app.resizeCanvas(width, height);
  }

  getApp(): pc.Application | null {
    return this.app;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  destroy(): void {
    if (this.app) {
      this.app.destroy();
      this.app = null;
    }
    this.initialized = false;
  }
}
