import {
  Engine,
  Scene,
  ArcRotateCamera,
  Vector3,
  HemisphericLight,
  PointLight,
  Color3,
  Color4,
  MeshBuilder,
  StandardMaterial,
  DynamicTexture,
  Mesh,
  Animation,
  CubicEase,
  EasingFunction,
  Nullable,
  ActionManager,
  ExecuteCodeAction
} from '@babylonjs/core';
import * as CANNON from 'cannon-es';
import type { Homework, Chapter } from './types';

interface CardMesh {
  mesh: Mesh;
  homework: Homework;
}

const CHAPTER_HEADER_COLORS: Record<string, string> = {
  ch1: '#3b82f6',
  ch2: '#10b981',
  ch3: '#f59e0b',
  ch4: '#8b5cf6'
};

export class GameScene {
  private engine: Engine;
  private scene: Scene;
  private camera: ArcRotateCamera;
  private world: CANNON.World;
  private cards: CardMesh[] = [];
  private platform!: Mesh;
  private warningPulseMesh: Nullable<Mesh> = null;
  private onCardClickCallback: Nullable<(hw: Homework) => void> = null;

  constructor(canvas: HTMLCanvasElement) {
    this.engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
    this.scene = new Scene(this.engine);
    this.scene.clearColor = new Color4(0.05, 0.08, 0.15, 1);

    this.camera = new ArcRotateCamera(
      'camera',
      -Math.PI / 2,
      Math.PI / 3,
      18,
      Vector3.Zero(),
      this.scene
    );
    this.camera.attachControl(canvas, true);
    this.camera.wheelDeltaPercentage = 0.01;
    this.camera.lowerRadiusLimit = 10;
    this.camera.upperRadiusLimit = 30;
    this.camera.lowerBetaLimit = Math.PI / 6;
    this.camera.upperBetaLimit = Math.PI / 2.2;

    const hemi = new HemisphericLight('hemi', new Vector3(0, 1, 0), this.scene);
    hemi.intensity = 0.7;
    hemi.diffuse = new Color3(0.9, 0.9, 1);
    hemi.groundColor = new Color3(0.2, 0.2, 0.3);

    const point = new PointLight('point', new Vector3(5, 10, 5), this.scene);
    point.intensity = 0.6;

    this.world = new CANNON.World();
    this.world.gravity.set(0, -9.82, 0);
    this.world.broadphase = new CANNON.NaiveBroadphase();

    this.createPlatform();
    this.startRenderLoop();
  }

  private createPlatform(): void {
    this.platform = MeshBuilder.CreateBox('platform', { width: 20, height: 0.5, depth: 14 }, this.scene);
    this.platform.position.y = -0.25;
    const mat = new StandardMaterial('platformMat', this.scene);
    mat.diffuseColor = new Color3(0.15, 0.18, 0.25);
    mat.specularColor = new Color3(0.1, 0.1, 0.1);
    this.platform.material = mat;

    const groundBody = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Box(new CANNON.Vec3(10, 0.25, 7))
    });
    groundBody.position.set(0, -0.25, 0);
    this.world.addBody(groundBody);

    for (let i = 0; i < 4; i++) {
      const pillar = MeshBuilder.CreateCylinder(`pillar_${i}`, { height: 4, diameter: 0.3 }, this.scene);
      const angle = (i / 4) * Math.PI * 2;
      pillar.position.set(Math.cos(angle) * 9, 1.75, Math.sin(angle) * 6.5);
      const pMat = new StandardMaterial(`pMat_${i}`, this.scene);
      pMat.diffuseColor = new Color3(0.3, 0.35, 0.45);
      pillar.material = pMat;
    }
  }

  setOnCardClick(callback: (hw: Homework) => void): void {
    this.onCardClickCallback = callback;
  }

  clearCards(): void {
    this.cards.forEach(c => {
      const body = (c.mesh as any).physicsBody as CANNON.Body;
      if (body) this.world.removeBody(body);
      (c.mesh as any).physicsBody = undefined;
      c.mesh.dispose();
    });
    this.cards = [];
  }

  spawnHomeworkCards(homeworks: Homework[], chapters: Chapter[]): void {
    this.clearCards();
    const cols = Math.min(homeworks.length, 4);
    const rows = Math.ceil(homeworks.length / cols);
    const spacingX = 3.5;
    const spacingZ = 3.2;
    const startX = -((cols - 1) * spacingX) / 2;
    const startZ = -((rows - 1) * spacingZ) / 2;

    homeworks.forEach((hw, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const pos = new Vector3(
        startX + col * spacingX,
        3 + Math.random() * 0.5,
        startZ + row * spacingZ
      );
      this.createHomeworkCard(hw, pos, chapters);
    });

    this.animateCardsDrop();
  }

  private createHomeworkCard(hw: Homework, position: Vector3, chapters: Chapter[]): void {
    const card = MeshBuilder.CreateBox(`card_${hw.id}`, { width: 2.8, height: 0.15, depth: 2.2 }, this.scene);
    card.position = position;

    const frontTexture = this.createCardTexture(hw, chapters);
    const mat = new StandardMaterial(`cardMat_${hw.id}`, this.scene);
    mat.diffuseTexture = frontTexture;
    mat.specularColor = new Color3(0.2, 0.2, 0.2);
    card.material = mat;

    card.actionManager = new ActionManager(this.scene);
    card.actionManager.registerAction(
      new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
        if (this.onCardClickCallback) {
          this.onCardClickCallback(hw);
        }
      })
    );

    const body = new CANNON.Body({
      mass: 0.1,
      shape: new CANNON.Box(new CANNON.Vec3(1.4, 0.075, 1.1))
    });
    body.position.set(position.x, position.y, position.z);
    body.angularDamping = 0.8;
    this.world.addBody(body);
    (card as any).physicsBody = body;

    this.cards.push({
      mesh: card,
      homework: hw
    });
  }

  private roundRect(
    ctx: CanvasRenderingContext2D,
    rx: number, ry: number, rw: number, rh: number, rad: number
  ): void {
    ctx.beginPath();
    ctx.moveTo(rx + rad, ry);
    ctx.lineTo(rx + rw - rad, ry);
    ctx.quadraticCurveTo(rx + rw, ry, rx + rw, ry + rad);
    ctx.lineTo(rx + rw, ry + rh - rad);
    ctx.quadraticCurveTo(rx + rw, ry + rh, rx + rw - rad, ry + rh);
    ctx.lineTo(rx + rad, ry + rh);
    ctx.quadraticCurveTo(rx, ry + rh, rx, ry + rh - rad);
    ctx.lineTo(rx, ry + rad);
    ctx.quadraticCurveTo(rx, ry, rx + rad, ry);
    ctx.closePath();
  }

  private createCardTexture(hw: Homework, _chapters: Chapter[]): DynamicTexture {
    const texture = new DynamicTexture(`tex_${hw.id}`, { width: 512, height: 384 }, this.scene, false);
    const ctx = texture.getContext() as unknown as CanvasRenderingContext2D;

    ctx.fillStyle = '#fafafa';
    ctx.fillRect(0, 0, 512, 384);

    const headerColor = CHAPTER_HEADER_COLORS[hw.chapterId] || '#6366f1';
    ctx.fillStyle = headerColor;
    ctx.fillRect(0, 0, 512, 56);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`� 作业 · 编号${hw.id.slice(-4).toUpperCase()}`, 20, 38);

    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 30px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${hw.studentName} 同学的作业`, 256, 100);

    ctx.fillStyle = '#6b7280';
    ctx.font = '18px sans-serif';
    ctx.fillText(`提交：${new Date(hw.submitTime).toLocaleDateString()}  截止：${new Date(hw.deadline).toLocaleDateString()}`, 256, 132);

    ctx.font = 'bold 22px sans-serif';
    ctx.fillStyle = '#111827';
    ctx.fillText(`🎯 ${hw.scoreHint}`, 256, 172);

    ctx.textAlign = 'left';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillStyle = '#374151';
    ctx.fillText('解题情况：', 28, 202);
    ctx.font = '16px sans-serif';
    ctx.fillStyle = '#4b5563';
    hw.qualityHints.forEach((hint, i) => {
      ctx.fillText(`  ✔ ${hint}`, 28, 226 + i * 24);
    });

    ctx.textAlign = 'left';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillStyle = '#374151';
    ctx.fillText('典型题型（章节线索）：', 270, 202);
    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#4b5563';
    hw.chapterClues.forEach((clue, i) => {
      const short = clue.length > 20 ? clue.slice(0, 20) + '…' : clue;
      ctx.fillText(`  • ${short}`, 270, 226 + i * 24);
    });

    let tagY = 308;
    ctx.textAlign = 'center';
    if (hw.ruleClues.length > 0) {
      hw.ruleClues.forEach(clue => {
        const clueText = clue.text.length > 30 ? clue.text.slice(0, 30) + '…' : clue.text;
        const colorsByType: Record<string, string> = {
          late: '#64748b',
          plagiarism: '#78716c',
          retry: '#ea580c',
          deadline: '#9333ea'
        };
        ctx.fillStyle = colorsByType[clue.type] || '#475569';
        const textWidth = ctx.measureText(clueText).width + 28;
        this.roundRect(ctx, 256 - textWidth / 2, tagY - 20, textWidth, 28, 6);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText(clueText, 256, tagY);
        tagY += 34;
      });
    }

    ctx.fillStyle = '#9ca3af';
    ctx.font = 'italic 14px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('通过题型判断章节 · 点击卡片批改 →', 494, 372);

    texture.update();
    return texture;
  }

  private animateCardsDrop(): void {
    this.cards.forEach((card, idx) => {
      const anim = new Animation(
        `drop_${idx}`,
        'position.y',
        30,
        Animation.ANIMATIONTYPE_FLOAT,
        Animation.ANIMATIONLOOPMODE_CONSTANT
      );
      const ease = new CubicEase();
      ease.setEasingMode(EasingFunction.EASINGMODE_EASEOUT);
      anim.setEasingFunction(ease);

      const targetY = 0.5 + (idx % 3) * 0.02;
      anim.setKeys([
        { frame: 0, value: card.mesh.position.y },
        { frame: 60, value: targetY }
      ]);
      card.mesh.animations = [anim];
      this.scene.beginAnimation(card.mesh, 0, 60, false);
    });
  }

  highlightCard(hwId: string, success: boolean): void {
    const card = this.cards.find(c => c.homework.id === hwId);
    if (!card) return;

    const color = success ? new Color3(0, 1, 0.3) : new Color3(1, 0.2, 0.2);
    const pulse = MeshBuilder.CreateBox(`pulse_${hwId}`, { width: 3.2, height: 0.05, depth: 2.6 }, this.scene);
    pulse.position = card.mesh.position.clone();
    pulse.position.y -= 0.1;
    const pMat = new StandardMaterial(`pulseMat_${hwId}`, this.scene);
    pMat.emissiveColor = color;
    pMat.alpha = 0.8;
    pulse.material = pMat;

    const anim = new Animation('pulseScale', 'scaling', 30, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CONSTANT);
    anim.setKeys([
      { frame: 0, value: new Vector3(0.5, 1, 0.5) },
      { frame: 30, value: new Vector3(1.5, 1, 1.5) },
      { frame: 60, value: new Vector3(0.5, 1, 0.5) }
    ]);
    pulse.animations = [anim];
    this.scene.beginAnimation(pulse, 0, 60, false, 1, () => pulse.dispose());

    setTimeout(() => {
      const fadeAnim = new Animation('cardFade', 'visibility', 30, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
      fadeAnim.setKeys([
        { frame: 0, value: 1 },
        { frame: 30, value: 0 }
      ]);
      card.mesh.animations = [fadeAnim];
      this.scene.beginAnimation(card.mesh, 0, 30, false, 1, () => {
        const body = (card.mesh as any).physicsBody as CANNON.Body;
        if (body) this.world.removeBody(body);
        (card.mesh as any).physicsBody = undefined;
        card.mesh.dispose();
        this.cards = this.cards.filter(c => c.homework.id !== hwId);
      });
    }, 800);
  }

  showProgressWarning(show: boolean): void {
    if (show && !this.warningPulseMesh) {
      this.warningPulseMesh = MeshBuilder.CreateTorus('warningRing', { diameter: 18, thickness: 0.3 }, this.scene);
      this.warningPulseMesh.position.y = 0.1;
      this.warningPulseMesh.rotation.x = Math.PI / 2;
      const wMat = new StandardMaterial('warningMat', this.scene);
      wMat.emissiveColor = new Color3(1, 0.6, 0);
      wMat.alpha = 0.6;
      this.warningPulseMesh.material = wMat;

      const anim = new Animation('warnPulse', 'visibility', 20, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CYCLE);
      anim.setKeys([
        { frame: 0, value: 0.3 },
        { frame: 20, value: 0.9 }
      ]);
      this.warningPulseMesh.animations = [anim];
      this.scene.beginAnimation(this.warningPulseMesh, 0, 20, true);
    } else if (!show && this.warningPulseMesh) {
      this.warningPulseMesh.dispose();
      this.warningPulseMesh = null;
    }
  }

  private startRenderLoop(): void {
    let lastTime = performance.now();
    this.engine.runRenderLoop(() => {
      const now = performance.now();
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      this.world.step(1 / 60, dt, 3);

      this.cards.forEach(card => {
        const body = (card.mesh as any).physicsBody as CANNON.Body;
        if (body) {
          card.mesh.position.set(body.position.x, body.position.y, body.position.z);
          card.mesh.rotationQuaternion = null;
          card.mesh.rotation.x = body.quaternion.x;
          card.mesh.rotation.y = body.quaternion.y;
          card.mesh.rotation.z = body.quaternion.z;
        }
      });

      this.scene.render();
    });

    window.addEventListener('resize', () => this.engine.resize());
  }

  dispose(): void {
    this.scene.dispose();
    this.engine.dispose();
  }

  getScene(): Scene {
    return this.scene;
  }
}
