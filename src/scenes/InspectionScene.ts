import Phaser from 'phaser';
import Matter from 'matter-js';
import type { LevelConfig, PatrolPoint } from '../types';
import { levelManager } from '../data/levelManager';

interface InspectionSceneData {
  levelId: string;
}

export class InspectionScene extends Phaser.Scene {
  private levelId = '';
  private level?: LevelConfig;
  private patrolPoints: PatrolPoint[] = [];
  private correctRoute: number[] = [];
  private playerRoute: number[] = [];
  private isObserving = true;
  private graphics?: Phaser.GameObjects.Graphics;
  private pointSprites: Phaser.GameObjects.Sprite[] = [];
  private routeLine?: Phaser.GameObjects.Graphics;
  private observedTime = 0;
  private observeTimeLimit = 15;
  private matterEngine?: Matter.Engine;

  constructor() {
    super('InspectionScene');
  }

  init(data: InspectionSceneData) {
    this.levelId = data.levelId;
    this.level = levelManager.getLevelById(this.levelId);
    if (this.level) {
      this.patrolPoints = this.level.inspection.patrolPoints;
      this.correctRoute = this.level.inspection.patrolRoute;
      this.observeTimeLimit = this.level.inspection.observeTime;
    }
  }

  preload() {
    this.load.image('park-bg', 'assets/images/park-bg.png');
  }

  create() {
    const { width, height } = this.scale;

    this.matterEngine = Matter.Engine.create();
    this.matterEngine.gravity.y = 0;

    this.add.rectangle(width / 2, height / 2, width, height, 0x1a3150);

    this.createParkMap();

    this.graphics = this.add.graphics();
    this.routeLine = this.add.graphics();

    this.patrolPoints.forEach((point, index) => {
      const sprite = this.add.sprite(point.x, point.y, 'patrol-point');
      sprite.setScale(0.5);
      sprite.setInteractive();
      sprite.setData('index', index);
      sprite.on('pointerdown', () => this.onPointClick(index));
      this.pointSprites.push(sprite);

      this.add.text(point.x, point.y + 30, point.name, {
        fontSize: '12px',
        color: '#ffffff',
        align: 'center',
      }).setOrigin(0.5);
    });

    this.input.on('gameobjectup', (pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.Sprite) => {
      const index = gameObject.getData('index');
      if (index !== undefined && !this.isObserving) {
        this.onPointClick(index);
      }
    });

    this.startObservation();
  }

  private createParkMap() {
    const { width, height } = this.scale;

    const buildingColors = [0x4a5568, 0x2d3748, 0x1a202c];
    const buildingPositions = [
      { x: 100, y: 150, w: 80, h: 60 },
      { x: 250, y: 100, w: 100, h: 80 },
      { x: 400, y: 200, w: 90, h: 70 },
      { x: 350, y: 350, w: 70, h: 50 },
      { x: 150, y: 300, w: 60, h: 60 },
    ];

    buildingPositions.forEach((pos, index) => {
      const building = this.add.rectangle(
        pos.x, pos.y, pos.w, pos.h,
        buildingColors[index % buildingColors.length]
      );
      building.setStrokeStyle(2, 0x718096);

      Matter.Bodies.rectangle(pos.x, pos.y, pos.w, pos.h, {
        isStatic: true,
        label: `building-${index}`,
      });
    });

    this.add.rectangle(275, 225, 400, 5, 0x4a5568);
    this.add.rectangle(275, 225, 5, 350, 0x4a5568);

    for (let i = 0; i < 20; i++) {
      const x = Phaser.Math.Between(50, width - 50);
      const y = Phaser.Math.Between(50, height - 50);
      const tree = this.add.circle(x, y, 8, 0x22543d);
      tree.setAlpha(0.6);
    }
  }

  private startObservation() {
    this.isObserving = true;
    this.observedTime = 0;

    this.showRouteAnimation();

    this.time.addEvent({
      delay: 1000,
      callback: () => {
        this.observedTime++;
        if (this.observedTime >= this.observeTimeLimit) {
          this.endObservation();
        }
      },
      loop: true,
    });
  }

  private showRouteAnimation() {
    if (!this.routeLine || !this.level) return;

    this.routeLine.clear();
    this.routeLine.lineStyle(4, 0xff6b35, 0.8);

    const points = this.correctRoute.map((index) => this.patrolPoints[index]);

    for (let i = 0; i < points.length - 1; i++) {
      const start = points[i];
      const end = points[i + 1];

      this.tweens.addCounter({
        from: 0,
        to: 1,
        duration: 500,
        delay: i * 500,
        onUpdate: (tween) => {
          const progress = tween.getValue();
          const x = Phaser.Math.Linear(start.x, end.x, progress);
          const y = Phaser.Math.Linear(start.y, end.y, progress);
          
          if (this.routeLine) {
            this.routeLine.beginPath();
            this.routeLine.moveTo(start.x, start.y);
            this.routeLine.lineTo(x, y);
            this.routeLine.strokePath();
          }
        },
      });

      this.tweens.add({
        targets: this.pointSprites[this.correctRoute[i + 1]],
        scale: 0.7,
        duration: 300,
        delay: i * 500 + 200,
        yoyo: true,
      });
    }
  }

  private endObservation() {
    this.isObserving = false;
    this.routeLine?.clear();
    
    this.pointSprites.forEach((sprite) => {
      sprite.clearTint();
      sprite.setAlpha(0.5);
    });

    this.events.emit('observationComplete');
  }

  private onPointClick(index: number) {
    if (this.isObserving) return;
    if (this.playerRoute.includes(index)) return;

    this.playerRoute.push(index);
    
    const sprite = this.pointSprites[index];
    sprite.setAlpha(1);
    sprite.setTint(0x00ff00);

    this.add.text(sprite.x, sprite.y - 20, this.playerRoute.length.toString(), {
      fontSize: '16px',
      color: '#00ff00',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.updatePlayerRoute();

    this.events.emit('routeUpdate', [...this.playerRoute]);

    if (this.playerRoute.length === this.patrolPoints.length) {
      this.events.emit('routeComplete', [...this.playerRoute]);
    }
  }

  private updatePlayerRoute() {
    if (!this.graphics || this.playerRoute.length < 2) return;

    this.graphics.clear();
    this.graphics.lineStyle(3, 0x00ff00, 0.6);
    this.graphics.beginPath();

    for (let i = 0; i < this.playerRoute.length - 1; i++) {
      const start = this.patrolPoints[this.playerRoute[i]];
      const end = this.patrolPoints[this.playerRoute[i + 1]];
      this.graphics.moveTo(start.x, start.y);
      this.graphics.lineTo(end.x, end.y);
    }

    this.graphics.strokePath();
  }

  resetRoute() {
    this.playerRoute = [];
    this.graphics?.clear();
    this.routeLine?.clear();
    
    this.pointSprites.forEach((sprite) => {
      sprite.setAlpha(0.5);
      sprite.clearTint();
    });

    this.children.each((child) => {
      if (child.type === 'Text' && child.getData('isNumber')) {
        child.destroy();
      }
    });

    this.events.emit('routeUpdate', []);
  }

  getPlayerRoute(): number[] {
    return [...this.playerRoute];
  }

  getCorrectRoute(): number[] {
    return [...this.correctRoute];
  }

  getIsObserving(): boolean {
    return this.isObserving;
  }

  update(time: number, delta: number) {
    if (this.matterEngine) {
      Matter.Engine.update(this.matterEngine, delta);
    }
  }
}

export default InspectionScene;
