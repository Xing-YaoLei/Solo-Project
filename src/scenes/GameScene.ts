import Phaser from 'phaser';
import { COLORS } from '../config/gameConfig';
import { AudioManager } from '../managers/AudioManager';
import { GameStateManager } from '../managers/GameStateManager';
import { generateBills, formatAmount, calculateScore } from '../utils/billUtils';
import type { BillData, GameStats, LevelConfig } from '../types';

declare const Matter: any;

export class GameScene extends Phaser.Scene {
  private audioManager: AudioManager;
  private stateManager: GameStateManager;
  private level: LevelConfig | null = null;

  private score: number = 0;
  private combo: number = 0;
  private maxCombo: number = 0;
  private correctCount: number = 0;
  private wrongCount: number = 0;
  private timeLeft: number = 0;
  private bills: BillData[] = [];
  private currentBillIndex: number = 0;
  private totalBills: number = 0;
  private billStartTime: number = 0;
  private totalResponseTime: number = 0;
  private gameOver: boolean = false;
  private paused: boolean = false;

  private scoreText?: Phaser.GameObjects.Text;
  private comboText?: Phaser.GameObjects.Text;
  private timeText?: Phaser.GameObjects.Text;
  private progressText?: Phaser.GameObjects.Text;
  private billContainer?: Phaser.GameObjects.Container;
  private feedbackText?: Phaser.GameObjects.Text;

  private matterWorld: any;
  private coinBodies: any[] = [];
  private coinGraphics: Phaser.GameObjects.Graphics[] = [];

  constructor() {
    super('GameScene');
    this.audioManager = AudioManager.getInstance();
    this.stateManager = GameStateManager.getInstance();
  }

  create(): void {
    this.level = this.stateManager.getCurrentLevel();
    if (!this.level) {
      this.scene.start('LevelSelectScene');
      return;
    }

    this.initGame();
    this.createUI();
    this.createBillCard();
    this.startTimer();
  }

  private initGame(): void {
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.correctCount = 0;
    this.wrongCount = 0;
    this.currentBillIndex = 0;
    this.totalResponseTime = 0;
    this.gameOver = false;
    this.paused = false;

    this.bills = generateBills(
      this.level!.id,
      this.level!.billCount,
      this.level!.errorRate
    );
    this.totalBills = this.bills.length;
    this.timeLeft = this.level!.duration;

    if (this.matter && this.matter.world) {
      this.matterWorld = this.matter.world;
      this.matter.world.setBounds(0, 0, this.cameras.main.width, this.cameras.main.height, 64, true, true, false, true);
      this.matter.world.setGravity(0, 1);
    }
  }

  private createUI(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    this.add.rectangle(width / 2, height / 2, width, height, COLORS.background);

    const topBar = this.add.rectangle(width / 2, 30, width, 60, COLORS.cardBg)
      .setStrokeStyle(1, COLORS.cardBorder, 0.5);

    this.scoreText = this.add.text(40, 30, `得分: ${this.score}`, {
      fontSize: '22px',
      fontWeight: 'bold',
      color: '#ffffff'
    }).setOrigin(0, 0.5);

    this.comboText = this.add.text(width / 2, 30, `连击: ${this.combo}`, {
      fontSize: '20px',
      fontWeight: 'bold',
      color: '#' + COLORS.gold.toString(16).padStart(6, '0')
    }).setOrigin(0.5);

    this.timeText = this.add.text(width - 40, 30, `⏱ ${this.timeLeft}s`, {
      fontSize: '22px',
      fontWeight: 'bold',
      color: '#ffffff'
    }).setOrigin(1, 0.5);

    this.progressText = this.add.text(width / 2, 70, `${this.currentBillIndex + 1} / ${this.totalBills}`, {
      fontSize: '16px',
      color: '#a0a0a0'
    }).setOrigin(0.5);

    const progressBarBg = this.add.rectangle(width / 2, 90, 300, 6, COLORS.cardBg)
      .setStrokeStyle(1, COLORS.cardBorder, 0.5);

    const progressBar = this.add.rectangle(
      width / 2 - 150,
      90,
      0,
      6,
      COLORS.primary
    ).setOrigin(0, 0.5);

    this.events.on('updateProgress', () => {
      const progress = this.currentBillIndex / this.totalBills;
      progressBar.width = 300 * progress;
    });

    this.feedbackText = this.add.text(width / 2, height / 2 - 100, '', {
      fontSize: '48px',
      fontWeight: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5).setAlpha(0);

    const pauseBtn = this.add.text(width - 40, 70, '⏸', {
      fontSize: '24px'
    }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });

    pauseBtn.on('pointerdown', () => {
      this.togglePause();
    });

    const quitBtn = this.add.text(40, 70, '退出', {
      fontSize: '16px',
      color: '#888888'
    }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });

    quitBtn.on('pointerdown', () => {
      this.audioManager.playClick();
      this.scene.start('LevelSelectScene');
    });
  }

  private createBillCard(): void {
    if (this.currentBillIndex >= this.bills.length || this.gameOver) {
      this.endGame();
      return;
    }

    const bill = this.bills[this.currentBillIndex];
    this.billStartTime = Date.now();

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const cardX = width / 2;
    const cardY = height / 2 + 20;

    if (this.billContainer) {
      this.billContainer.destroy();
    }

    this.billContainer = this.add.container(cardX, cardY);

    const cardWidth = 420;
    const cardHeight = 280;

    const cardBg = this.add.rectangle(0, 0, cardWidth, cardHeight, COLORS.cardBg)
      .setStrokeStyle(3, COLORS.primary, 0.8);

    const cardShadow = this.add.rectangle(4, 4, cardWidth, cardHeight, 0x000000, 0.3);

    this.billContainer.add([cardShadow, cardBg]);

    const merchantLabel = this.add.text(-cardWidth / 2 + 30, -cardHeight / 2 + 35, bill.merchantName, {
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#ffffff'
    }).setOrigin(0, 0.5);

    const orderLabel = this.add.text(-cardWidth / 2 + 30, -cardHeight / 2 + 75, `订单数量: ${bill.orderCount} 单`, {
      fontSize: '16px',
      color: '#a0a0a0'
    }).setOrigin(0, 0.5);

    const divider1 = this.add.rectangle(0, -cardHeight / 2 + 105, cardWidth - 60, 1, COLORS.cardBorder, 0.5);

    const expectedLabel = this.add.text(-cardWidth / 2 + 30, -cardHeight / 2 + 135, '预期结算金额', {
      fontSize: '14px',
      color: '#888888'
    }).setOrigin(0, 0.5);

    const expectedAmount = this.add.text(cardWidth / 2 - 30, -cardHeight / 2 + 135, formatAmount(bill.expectedAmount), {
      fontSize: '20px',
      fontWeight: 'bold',
      color: '#ffffff'
    }).setOrigin(1, 0.5);

    const divider2 = this.add.rectangle(0, -cardHeight / 2 + 165, cardWidth - 60, 1, COLORS.cardBorder, 0.5);

    const actualLabel = this.add.text(-cardWidth / 2 + 30, -cardHeight / 2 + 195, '实际到账金额', {
      fontSize: '14px',
      color: '#888888'
    }).setOrigin(0, 0.5);

    const actualAmount = this.add.text(cardWidth / 2 - 30, -cardHeight / 2 + 195, formatAmount(bill.actualAmount), {
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#' + COLORS.primary.toString(16).padStart(6, '0')
    }).setOrigin(1, 0.5);

    const hint = this.add.text(0, cardHeight / 2 - 25, '检查两笔金额是否一致', {
      fontSize: '13px',
      color: '#666666'
    }).setOrigin(0.5);

    this.billContainer.add([
      merchantLabel,
      orderLabel,
      divider1,
      expectedLabel,
      expectedAmount,
      divider2,
      actualLabel,
      actualAmount,
      hint
    ]);

    this.billContainer.setScale(0.8);
    this.billContainer.setAlpha(0);

    this.tweens.add({
      targets: this.billContainer,
      scale: 1,
      alpha: 1,
      duration: 300,
      ease: 'Back.easeOut'
    });

    const buttonY = cardHeight / 2 + 50;
    const buttonGap = 120;

    const correctBtn = this.add.rectangle(-buttonGap / 2, buttonY, 180, 56, COLORS.success)
      .setStrokeStyle(2, 0xffffff, 0.3)
      .setInteractive({ useHandCursor: true });

    const correctText = this.add.text(-buttonGap / 2, buttonY, '✓ 金额一致', {
      fontSize: '20px',
      fontWeight: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);

    const wrongBtn = this.add.rectangle(buttonGap / 2, buttonY, 180, 56, COLORS.danger)
      .setStrokeStyle(2, 0xffffff, 0.3)
      .setInteractive({ useHandCursor: true });

    const wrongText = this.add.text(buttonGap / 2, buttonY, '✗ 有差异', {
      fontSize: '20px',
      fontWeight: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);

    const handleAnswer = (playerSaysCorrect: boolean) => {
      if (this.gameOver || this.paused) return;

      const isCorrect = playerSaysCorrect === !bill.hasDiscrepancy;
      this.handleAnswer(isCorrect, bill);
    };

    correctBtn.on('pointerdown', () => handleAnswer(true));
    wrongBtn.on('pointerdown', () => handleAnswer(false));

    this.input.keyboard?.on('keydown-LEFT', () => handleAnswer(true));
    this.input.keyboard?.on('keydown-RIGHT', () => handleAnswer(false));
    this.input.keyboard?.on('keydown-A', () => handleAnswer(true));
    this.input.keyboard?.on('keydown-D', () => handleAnswer(false));

    this.billContainer.add([correctBtn, correctText, wrongBtn, wrongText]);
  }

  private handleAnswer(isCorrect: boolean, bill: BillData): void {
    const responseTime = Date.now() - this.billStartTime;
    this.totalResponseTime += responseTime;

    if (isCorrect) {
      this.correctCount++;
      this.combo++;
      this.maxCombo = Math.max(this.maxCombo, this.combo);

      const scoreGain = calculateScore(
        true,
        responseTime,
        this.combo,
        this.level!.baseScore
      );
      this.score += scoreGain;

      this.audioManager.playCorrect();
      if (this.combo >= 3) {
        this.audioManager.playCombo();
      }
      this.audioManager.vibrate(20);

      this.showFeedback(`+${scoreGain}`, COLORS.success);
      this.spawnParticles(this.cameras.main.width / 2, this.cameras.main.height / 2, COLORS.success);

      if (this.combo > 0 && this.combo % 5 === 0) {
        this.createCoinRain(Math.min(this.combo / 5, 4));
      }

      if (this.comboText) {
        this.comboText.setText(`连击: ${this.combo}`);
        this.tweens.add({
          targets: this.comboText,
          scale: 1.3,
          duration: 100,
          yoyo: true
        });
      }
    } else {
      this.wrongCount++;
      this.combo = 0;
      this.score = Math.max(0, this.score - 50);

      this.audioManager.playWrong();
      this.audioManager.vibrate([50, 30, 50]);

      this.showFeedback(`-50`, COLORS.danger);
      this.shakeScreen();

      if (this.comboText) {
        this.comboText.setText(`连击: ${this.combo}`);
      }

      if (bill.discrepancyReason) {
        this.showDiscrepancyReason(bill.discrepancyReason);
      }
    }

    if (this.scoreText) {
      this.scoreText.setText(`得分: ${this.score}`);
    }

    this.currentBillIndex++;
    this.events.emit('updateProgress');
    
    if (this.progressText) {
      const displayIndex = Math.min(this.currentBillIndex + 1, this.totalBills);
      this.progressText.setText(`${displayIndex} / ${this.totalBills}`);
    }

    this.time.delayedCall(400, () => {
      this.nextBill();
    });
  }

  private showFeedback(text: string, color: number): void {
    if (!this.feedbackText) return;

    this.feedbackText.setText(text);
    this.feedbackText.setColor('#' + color.toString(16).padStart(6, '0'));
    this.feedbackText.setAlpha(1);
    this.feedbackText.setScale(1);
    this.feedbackText.y = this.cameras.main.height / 2 - 100;

    this.tweens.add({
      targets: this.feedbackText,
      y: this.cameras.main.height / 2 - 160,
      alpha: 0,
      scale: 1.5,
      duration: 600,
      ease: 'Power2.easeOut'
    });
  }

  private showDiscrepancyReason(reason: string): void {
    const width = this.cameras.main.width;
    const tip = this.add.text(width / 2, this.cameras.main.height / 2 + 180, `差异原因: ${reason}`, {
      fontSize: '16px',
      color: '#' + COLORS.warning.toString(16).padStart(6, '0')
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: tip,
      alpha: 1,
      duration: 200,
      yoyo: true,
      hold: 600,
      onComplete: () => tip.destroy()
    });
  }

  private shakeScreen(): void {
    this.cameras.main.shake(200, 0.01);
  }

  private spawnParticles(x: number, y: number, color: number): void {
    const particles = this.add.particles(x, y, '', {
      speed: { min: 100, max: 200 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.5, end: 0 },
      lifespan: 500,
      quantity: 10,
      tint: color
    });

    this.time.delayedCall(500, () => particles.destroy());
  }

  private nextBill(): void {
    if (this.currentBillIndex >= this.bills.length) {
      this.endGame();
    } else {
      this.createBillCard();
    }
  }

  private startTimer(): void {
    this.time.addEvent({
      delay: 1000,
      callback: () => {
        if (this.gameOver || this.paused) return;

        this.timeLeft--;
        if (this.timeText) {
          this.timeText.setText(`⏱ ${this.timeLeft}s`);
        }

        if (this.timeLeft <= 10) {
          this.timeText?.setColor('#' + COLORS.danger.toString(16).padStart(6, '0'));
        }

        if (this.timeLeft <= 0) {
          this.endGame();
        }
      },
      loop: true
    });
  }

  private togglePause(): void {
    this.paused = !this.paused;
    
    if (this.paused) {
      const width = this.cameras.main.width;
      const height = this.cameras.main.height;

      const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7)
        .setName('pauseOverlay');

      const pauseText = this.add.text(width / 2, height / 2 - 30, '游戏暂停', {
        fontSize: '36px',
        fontWeight: 'bold',
        color: '#ffffff'
      }).setOrigin(0.5).setName('pauseText');

      const resumeBtn = this.add.rectangle(width / 2, height / 2 + 40, 200, 50, COLORS.primary)
        .setStrokeStyle(2, 0xffffff, 0.3)
        .setInteractive({ useHandCursor: true })
        .setName('resumeBtn');

      this.add.text(width / 2, height / 2 + 40, '继续游戏', {
        fontSize: '20px',
        fontWeight: 'bold',
        color: '#ffffff'
      }).setOrigin(0.5).setName('resumeText');

      resumeBtn.on('pointerdown', () => {
        this.togglePause();
      });
    } else {
      this.children.each((child: Phaser.GameObjects.GameObject) => {
        if (child.name && child.name.startsWith('pause')) {
          child.destroy();
        }
      });
    }
  }

  private endGame(): void {
    if (this.gameOver) return;
    this.gameOver = true;

    const avgResponseTime = this.correctCount + this.wrongCount > 0
      ? this.totalResponseTime / (this.correctCount + this.wrongCount)
      : 0;

    const stats: GameStats = {
      score: this.score,
      correctCount: this.correctCount,
      wrongCount: this.wrongCount,
      combo: this.combo,
      maxCombo: this.maxCombo,
      avgResponseTime,
      totalBills: this.correctCount + this.wrongCount,
      levelId: this.level!.id
    };

    this.stateManager.saveGameStats(stats);
    this.audioManager.playLevelComplete();

    this.time.delayedCall(1000, () => {
      this.scene.start('ReviewScene', { fromGame: true });
    });

    this.showEndGameAnimation();
  }

  private showEndGameAnimation(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.5);
    overlay.setAlpha(0);

    const resultText = this.add.text(width / 2, height / 2, this.score > 500 ? '结算完成!' : '时间到!', {
      fontSize: '48px',
      fontWeight: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5).setAlpha(0);

    const scoreResult = this.add.text(width / 2, height / 2 + 60, `最终得分: ${this.score}`, {
      fontSize: '28px',
      color: '#' + COLORS.gold.toString(16).padStart(6, '0')
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: [overlay],
      alpha: 1,
      duration: 500
    });

    this.tweens.add({
      targets: [resultText, scoreResult],
      alpha: 1,
      y: '-=30',
      duration: 500,
      delay: 300,
      ease: 'Back.easeOut'
    });
  }

  private createCoinRain(intensity: number): void {
    if (!this.matter?.world) return;

    const width = this.cameras.main.width;
    const coinCount = 10 * intensity;

    const Matter = (Phaser.Physics.Matter as any).Matter;

    for (let i = 0; i < coinCount; i++) {
      const x = Math.random() * width;
      const y = -30 - Math.random() * 100;
      const size = 12 + Math.random() * 8;

      const coinBody = Matter.Bodies.circle(x, y, size, {
        restitution: 0.6,
        friction: 0.1,
        frictionAir: 0.02,
        density: 0.001
      });

      const coinGraphic = this.add.graphics({ x: 0, y: 0 });
      coinGraphic.fillStyle(COLORS.gold, 1);
      coinGraphic.fillCircle(0, 0, size);
      coinGraphic.lineStyle(2, 0xffffff, 0.8);
      coinGraphic.strokeCircle(0, 0, size);
      coinGraphic.setData('body', coinBody);

      Matter.World.add(this.matterWorld, coinBody);
      this.coinBodies.push(coinBody);
      this.coinGraphics.push(coinGraphic);
    }

    this.time.delayedCall(4000, () => {
      this.cleanupCoins();
    });
  }

  private cleanupCoins(): void {
    if (!this.matterWorld) return;

    const Matter = (Phaser.Physics.Matter as any).Matter;

    this.coinBodies.forEach(body => {
      if (this.matterWorld) {
        Matter.World.remove(this.matterWorld, body);
      }
    });
    this.coinGraphics.forEach(graphic => graphic.destroy());
    this.coinBodies = [];
    this.coinGraphics = [];
  }

  update(): void {
    for (let i = 0; i < this.coinBodies.length && i < this.coinGraphics.length; i++) {
      const body = this.coinBodies[i];
      const graphic = this.coinGraphics[i];
      if (body && graphic) {
        graphic.setPosition(body.position.x, body.position.y);
        graphic.setRotation(body.angle);
      }
    }

    const height = this.cameras.main.height;
    const toRemove: number[] = [];
    const Matter = (Phaser.Physics.Matter as any).Matter;

    for (let i = 0; i < this.coinBodies.length; i++) {
      if (this.coinBodies[i].position.y > height + 100) {
        toRemove.push(i);
      }
    }

    for (let i = toRemove.length - 1; i >= 0; i--) {
      const idx = toRemove[i];
      if (this.matterWorld && this.coinBodies[idx]) {
        Matter.World.remove(this.matterWorld, this.coinBodies[idx]);
      }
      if (this.coinGraphics[idx]) {
        this.coinGraphics[idx].destroy();
      }
      this.coinBodies.splice(idx, 1);
      this.coinGraphics.splice(idx, 1);
    }
  }
}
