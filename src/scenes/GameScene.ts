import Phaser from 'phaser';
import { COLORS } from '../config/gameConfig';
import { AudioManager } from '../managers/AudioManager';
import { GameStateManager } from '../managers/GameStateManager';
import { generateBills, formatAmount, calculateScore, getDiscrepancyLabel } from '../utils/billUtils';
import type { BillData, GameStats, LevelConfig, DiscrepancyCategory, PaymentTransaction } from '../types';
import { CATEGORY_LABELS } from '../types';

declare const Matter: any;

const TX_TYPE_COLORS: Record<string, number> = {
  order: COLORS.primary,
  refund: COLORS.danger,
  coupon: COLORS.warning,
  platform_fee: 0x9b59b6,
  subsidy: COLORS.success,
  delivery: 0x3498db
};

const TX_TYPE_LABELS: Record<string, string> = {
  order: '订单',
  refund: '退款',
  coupon: '优惠券',
  platform_fee: '抽成',
  subsidy: '补贴',
  delivery: '配送'
};

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

  private rootContainer: Phaser.GameObjects.Container | null = null;

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

  private clearRoot(): void {
    if (this.rootContainer) {
      this.rootContainer.destroy();
      this.rootContainer = null;
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

    this.feedbackText = this.add.text(width / 2, 140, '', {
      fontSize: '42px',
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

    this.clearRoot();
    this.rootContainer = this.add.container(width / 2, height / 2 + 10);

    this.rootContainer.setScale(0.95);
    this.rootContainer.setAlpha(0);
    this.tweens.add({
      targets: this.rootContainer,
      scale: 1,
      alpha: 1,
      duration: 250,
      ease: 'Back.easeOut'
    });

    const leftX = -380;
    const rightX = 50;
    const topY = -240;

    this.createLeftPanel(bill, leftX, topY);
    this.createRightPanel(bill, rightX, topY);
    this.createAnswerButtons(bill, 0, 230);
  }

  private createLeftPanel(bill: BillData, x: number, y: number): void {
    if (!this.rootContainer) return;

    const panelWidth = 400;
    const panelHeight = 420;

    const panelBg = this.add.rectangle(x + panelWidth / 2, y + panelHeight / 2, panelWidth, panelHeight, COLORS.cardBg)
      .setStrokeStyle(2, COLORS.cardBorder, 1);
    this.rootContainer.add(panelBg);

    const merchant = this.add.text(x + 15, y + 20, bill.merchantName, {
      fontSize: '22px',
      fontWeight: 'bold',
      color: '#ffffff'
    }).setOrigin(0, 0);
    this.rootContainer.add(merchant);

    const orderInfo = this.add.text(x + 15, y + 52, `订单数: ${bill.orderCount} 单`, {
      fontSize: '14px',
      color: '#a0a0a0'
    }).setOrigin(0, 0);
    this.rootContainer.add(orderInfo);

    const amountsY = y + 85;
    const expLabel = this.add.text(x + 15, amountsY, '预期结算', {
      fontSize: '13px',
      color: '#888888'
    }).setOrigin(0, 0);
    const expVal = this.add.text(x + panelWidth - 15, amountsY, formatAmount(bill.expectedAmount), {
      fontSize: '20px',
      fontWeight: 'bold',
      color: '#ffffff'
    }).setOrigin(1, 0);
    this.rootContainer.add([expLabel, expVal]);

    const actLabel = this.add.text(x + 15, amountsY + 32, '实际到账', {
      fontSize: '13px',
      color: '#888888'
    }).setOrigin(0, 0);
    const actVal = this.add.text(x + panelWidth - 15, amountsY + 32, formatAmount(bill.actualAmount), {
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#' + COLORS.primary.toString(16).padStart(6, '0')
    }).setOrigin(1, 0);
    this.rootContainer.add([actLabel, actVal]);

    const diff = bill.actualAmount - bill.expectedAmount;
    if (Math.abs(diff) >= 0.01) {
      const diffColor = diff > 0 ? COLORS.success : COLORS.danger;
      const diffLabel = this.add.text(x + 15, amountsY + 68, '差额', {
        fontSize: '13px',
        color: '#888888'
      }).setOrigin(0, 0);
      const diffVal = this.add.text(x + panelWidth - 15, amountsY + 68, `${diff > 0 ? '+' : ''}${formatAmount(Math.abs(diff))}`, {
        fontSize: '18px',
        fontWeight: 'bold',
        color: '#' + diffColor.toString(16).padStart(6, '0')
      }).setOrigin(1, 0);
      this.rootContainer.add([diffLabel, diffVal]);
    }

    const dividerY = amountsY + 108;
    const divider = this.add.rectangle(x + panelWidth / 2, dividerY, panelWidth - 30, 1, COLORS.cardBorder, 0.8);
    this.rootContainer.add(divider);

    const txTitle = this.add.text(x + 15, dividerY + 15, '📋 支付流水明细', {
      fontSize: '16px',
      fontWeight: 'bold',
      color: '#ffffff'
    }).setOrigin(0, 0);
    this.rootContainer.add(txTitle);

    const headerY = dividerY + 45;
    const headers = [
      { text: '类型', x: x + 15, w: 70 },
      { text: '单号', x: x + 90, w: 110 },
      { text: '时间', x: x + 205, w: 75 },
      { text: '金额', x: x + panelWidth - 15, w: 80, align: 1 }
    ];
    headers.forEach(h => {
      const t = this.add.text(h.x, headerY, h.text, {
        fontSize: '12px',
        color: '#666666'
      }).setOrigin(h.align || 0, 0);
      this.rootContainer!.add(t);
    });

    const maxShow = 5;
    const displayTxs = bill.transactions.slice(0, maxShow);
    displayTxs.forEach((tx, i) => {
      const ty = headerY + 22 + i * 28;
      this.addTransactionRow(tx, x, ty, panelWidth);
    });

    if (bill.transactions.length > maxShow) {
      const moreY = headerY + 22 + maxShow * 28;
      const more = this.add.text(x + panelWidth / 2, moreY + 8, `...还有 ${bill.transactions.length - maxShow} 条流水`, {
        fontSize: '12px',
        color: '#666666'
      }).setOrigin(0.5, 0);
      this.rootContainer.add(more);
    }

    const computedY = y + panelHeight - 40;
    const computedTitle = this.add.text(x + 15, computedY, '💡 根据流水核对金额，找出问题类型', {
      fontSize: '13px',
      color: '#' + COLORS.warning.toString(16).padStart(6, '0')
    }).setOrigin(0, 0);
    this.rootContainer.add(computedTitle);
  }

  private addTransactionRow(tx: PaymentTransaction, x: number, y: number, panelWidth: number): void {
    if (!this.rootContainer) return;

    const typeColor = TX_TYPE_COLORS[tx.type] || COLORS.textSecondary;
    const typeLabel = TX_TYPE_LABELS[tx.type] || tx.type;

    const typeBg = this.add.rectangle(x + 40, y + 10, 50, 18, typeColor, 0.25);
    const typeText = this.add.text(x + 40, y + 10, typeLabel, {
      fontSize: '11px',
      color: '#' + typeColor.toString(16).padStart(6, '0')
    }).setOrigin(0.5, 0.5);
    this.rootContainer.add([typeBg, typeText]);

    const orderText = this.add.text(x + 90, y + 10, tx.orderNo.slice(-8), {
      fontSize: '11px',
      color: '#cccccc'
    }).setOrigin(0, 0.5);
    this.rootContainer.add(orderText);

    const timeText = this.add.text(x + 205, y + 10, tx.timestamp, {
      fontSize: '11px',
      color: '#888888'
    }).setOrigin(0, 0.5);
    this.rootContainer.add(timeText);

    const isPositive = tx.type === 'order' || tx.type === 'subsidy' || tx.type === 'delivery';
    const amountColor = isPositive ? COLORS.success : COLORS.danger;
    const amountStr = `${isPositive ? '+' : '-'}${formatAmount(tx.amount)}`;
    const amountText = this.add.text(x + panelWidth - 15, y + 10, amountStr, {
      fontSize: '12px',
      fontWeight: 'bold',
      color: '#' + amountColor.toString(16).padStart(6, '0')
    }).setOrigin(1, 0.5);
    this.rootContainer.add(amountText);
  }

  private createRightPanel(bill: BillData, x: number, y: number): void {
    if (!this.rootContainer) return;

    const panelWidth = 320;
    const panelHeight = 420;

    const panelBg = this.add.rectangle(x + panelWidth / 2, y + panelHeight / 2, panelWidth, panelHeight, COLORS.cardBg)
      .setStrokeStyle(2, COLORS.primary, 0.6);
    this.rootContainer.add(panelBg);

    const title = this.add.text(x + panelWidth / 2, y + 22, '选择对账结果', {
      fontSize: '18px',
      fontWeight: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5, 0);
    this.rootContainer.add(title);

    const subtitle = this.add.text(x + panelWidth / 2, y + 50, '综合流水、金额、差额判断', {
      fontSize: '12px',
      color: '#888888'
    }).setOrigin(0.5, 0);
    this.rootContainer.add(subtitle);

    const categories: Array<{ key: DiscrepancyCategory; color: number }> = [
      { key: 'correct', color: COLORS.success },
      { key: 'refund_missing', color: COLORS.danger },
      { key: 'coupon_missing', color: COLORS.warning },
      { key: 'platform_fee_wrong', color: 0x9b59b6 },
      { key: 'subsidy_missing', color: COLORS.primary },
      { key: 'delivery_fee_wrong', color: 0x3498db },
      { key: 'order_missing', color: 0xe67e22 }
    ];

    const btnStartY = y + 80;
    const btnHeight = 40;
    const btnGap = 10;
    const btnWidth = panelWidth - 30;

    categories.forEach((cat, i) => {
      const by = btnStartY + i * (btnHeight + btnGap);
      this.createCategoryButton(x + 15, by, btnWidth, btnHeight, cat.key, cat.color, bill);
    });

    const hintY = btnStartY + categories.length * (btnHeight + btnGap) + 10;
    const hint = this.add.text(x + panelWidth / 2, hintY, '可点击按钮或按数字键 1-7', {
      fontSize: '11px',
      color: '#666666'
    }).setOrigin(0.5, 0);
    this.rootContainer.add(hint);
  }

  private createCategoryButton(
    x: number,
    y: number,
    w: number,
    h: number,
    category: DiscrepancyCategory,
    color: number,
    bill: BillData
  ): void {
    if (!this.rootContainer) return;

    const label = CATEGORY_LABELS[category];

    const bg = this.add.rectangle(x + w / 2, y + h / 2, w, h, COLORS.cardBorder, 0.6)
      .setStrokeStyle(1, color, 0.8)
      .setInteractive({ useHandCursor: true });

    const dot = this.add.circle(x + 16, y + h / 2, 6, color);

    const text = this.add.text(x + 30, y + h / 2, label, {
      fontSize: '15px',
      color: '#ffffff'
    }).setOrigin(0, 0.5);

    this.rootContainer.add([bg, dot, text]);

    bg.on('pointerover', () => {
      bg.setFillStyle(color, 0.25);
      bg.setStrokeStyle(2, color, 1);
    });

    bg.on('pointerout', () => {
      bg.setFillStyle(COLORS.cardBorder, 0.6);
      bg.setStrokeStyle(1, color, 0.8);
    });

    bg.on('pointerdown', () => {
      this.handleAnswer(category, bill);
    });
  }

  private createAnswerButtons(bill: BillData, x: number, y: number): void {
    const categories: DiscrepancyCategory[] = [
      'correct', 'refund_missing', 'coupon_missing',
      'platform_fee_wrong', 'subsidy_missing', 'delivery_fee_wrong', 'order_missing'
    ];

    categories.forEach((cat, i) => {
      const keyNum = (i + 1).toString();
      this.input.keyboard?.on(`keydown-${keyNum}`, () => {
        if (!this.gameOver && !this.paused && this.rootContainer) {
          this.handleAnswer(cat, bill);
        }
      });
    });
  }

  private handleAnswer(selected: DiscrepancyCategory, bill: BillData): void {
    if (this.gameOver || this.paused) return;

    const responseTime = Date.now() - this.billStartTime;
    this.totalResponseTime += responseTime;

    const isCorrect = selected === bill.discrepancyCategory;

    if (isCorrect) {
      this.correctCount++;
      this.combo++;
      this.maxCombo = Math.max(this.maxCombo, this.combo);

      const scoreGain = calculateScore(true, responseTime, this.combo, this.level!.baseScore);
      this.score += scoreGain;

      this.audioManager.playCorrect();
      if (this.combo >= 3) this.audioManager.playCombo();
      this.audioManager.vibrate(20);

      this.showFeedback(`+${scoreGain}`, COLORS.success);
      this.spawnParticles(this.cameras.main.width / 2, 140, COLORS.success);

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

      const correctLabel = getDiscrepancyLabel(bill.discrepancyCategory);
      this.showFeedback(`正确答案: ${correctLabel}`, COLORS.danger);
      this.shakeScreen();

      if (this.comboText) {
        this.comboText.setText(`连击: ${this.combo}`);
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

    this.time.delayedCall(700, () => {
      this.nextBill();
    });
  }

  private showFeedback(text: string, color: number): void {
    if (!this.feedbackText) return;

    this.feedbackText.setText(text);
    this.feedbackText.setColor('#' + color.toString(16).padStart(6, '0'));
    this.feedbackText.setAlpha(1);
    this.feedbackText.setScale(1);
    this.feedbackText.y = 140;

    this.tweens.add({
      targets: this.feedbackText,
      y: 110,
      alpha: 0,
      scale: 1.4,
      duration: 700,
      ease: 'Power2.easeOut'
    });
  }

  private shakeScreen(): void {
    this.cameras.main.shake(200, 0.01);
  }

  private spawnParticles(x: number, y: number, color: number): void {
    const particles = this.add.particles(x, y, '', {
      speed: { min: 80, max: 180 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.4, end: 0 },
      lifespan: 500,
      quantity: 12,
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

      const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.75)
        .setName('pauseOverlay').setDepth(100);

      const pauseText = this.add.text(width / 2, height / 2 - 30, '游戏暂停', {
        fontSize: '36px',
        fontWeight: 'bold',
        color: '#ffffff'
      }).setOrigin(0.5).setName('pauseText').setDepth(101);

      const resumeBtn = this.add.rectangle(width / 2, height / 2 + 40, 200, 50, COLORS.primary)
        .setStrokeStyle(2, 0xffffff, 0.3)
        .setInteractive({ useHandCursor: true })
        .setName('resumeBtn').setDepth(101);

      this.add.text(width / 2, height / 2 + 40, '继续游戏', {
        fontSize: '20px',
        fontWeight: 'bold',
        color: '#ffffff'
      }).setOrigin(0.5).setName('resumeText').setDepth(102);

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

    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.6);
    overlay.setAlpha(0);

    const resultText = this.add.text(width / 2, height / 2 - 20, this.score > 500 ? '结算完成!' : '时间到!', {
      fontSize: '48px',
      fontWeight: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5).setAlpha(0);

    const scoreResult = this.add.text(width / 2, height / 2 + 40, `最终得分: ${this.score}`, {
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
