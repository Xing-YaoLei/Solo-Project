import Phaser from 'phaser';
import { COLORS } from '../config/gameConfig';
import { AudioManager } from '../managers/AudioManager';
import { GameStateManager } from '../managers/GameStateManager';
import { generateBill, formatAmount, getDiscrepancyLabel } from '../utils/billUtils';
import { CATEGORY_LABELS, type BillData, type DiscrepancyCategory } from '../types';

export class TutorialScene extends Phaser.Scene {
  private audioManager: AudioManager;
  private stateManager: GameStateManager;
  private currentStep: number = 0;
  private tutorialSteps: TutorialStep[] = [];
  private tutorialContainer?: Phaser.GameObjects.Container;
  private billContainer?: Phaser.GameObjects.Container;
  private currentBill?: BillData;
  private canInteract: boolean = false;
  private keyboardRegistered: boolean = false;
  private activeBillId: string = '';

  constructor() {
    super('TutorialScene');
    this.audioManager = AudioManager.getInstance();
    this.stateManager = GameStateManager.getInstance();
  }

  create(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    this.add.rectangle(width / 2, height / 2, width, height, COLORS.background);

    this.registerKeyboardHandler();

    this.add.text(width / 2, 50, '新手引导', {
      fontSize: '28px',
      fontWeight: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);

    const skipBtn = this.add.text(width - 40, 40, '跳过 →', {
      fontSize: '16px',
      color: '#888888'
    }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });

    skipBtn.on('pointerdown', () => {
      this.audioManager.playClick();
      this.finishTutorial();
    });

    const backBtn = this.add.text(40, 40, '← 返回', {
      fontSize: '18px',
      color: '#a0a0a0'
    }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });

    backBtn.on('pointerdown', () => {
      this.audioManager.playClick();
      this.scene.start('MainMenuScene');
    });

    this.initTutorialSteps();
    this.showStep(0);
  }

  private registerKeyboardHandler(): void {
    if (this.keyboardRegistered) return;
    this.keyboardRegistered = true;

    const categories: DiscrepancyCategory[] = [
      'correct', 'refund_missing', 'coupon_missing',
      'platform_fee_wrong', 'subsidy_missing', 'delivery_fee_wrong', 'order_missing'
    ];

    categories.forEach((cat, i) => {
      const keyNum = (i + 1).toString();
      this.input.keyboard?.on(`keydown-${keyNum}`, () => {
        if (!this.canInteract) return;
        if (!this.currentBill || this.currentBill.id !== this.activeBillId) return;
        this.handleAnswer(cat);
      });
    });
  }

  private initTutorialSteps(): void {
    this.tutorialSteps = [
      {
        title: '欢迎来到商户结算大师！',
        description: '你将扮演一名财务对账员，负责审核每日商户的结算账单。',
        hasBill: false,
        action: null,
        highlight: null
      },
      {
        title: '认识结算账单',
        description: '每张账单包含商户信息、订单数、预期结算金额、实际到账金额和差额。',
        hasBill: true,
        action: null,
        highlight: 'bill',
        billCategory: 'correct'
      },
      {
        title: '支付流水明细',
        description: '核心是左边的支付流水表：包含订单、退款、优惠券、平台抽成、补贴、配送费等明细，你需要把流水和结算金额对照来看。',
        hasBill: true,
        action: null,
        highlight: 'transactions',
        billCategory: 'correct'
      },
      {
        title: '对账差异判断',
        description: '你的任务是：核对流水后，从右侧选择正确的对账结果。可以用鼠标点击，或按键盘数字键 1-7 快速选择。',
        hasBill: true,
        action: null,
        highlight: 'options',
        billCategory: 'correct'
      },
      {
        title: '练习：金额正确',
        description: '当前账单：流水和结算金额一致，差额为 0。请点击「✓ 金额正确」按钮，或按键盘数字键 1。',
        hasBill: true,
        action: 'select',
        highlight: 'correctBtn',
        billCategory: 'correct',
        expectAnswer: 'correct'
      },
      {
        title: '练习：退款未扣除',
        description: '当前账单：有退款流水（显示为 − 扣减），但实际到账没有减去退款金额，导致差额为正。请选择「✗ 退款未扣除」，或按键盘数字键 2。',
        hasBill: true,
        action: 'select',
        highlight: 'refund_missingBtn',
        billCategory: 'refund_missing',
        expectAnswer: 'refund_missing'
      },
      {
        title: '练习：优惠未抵扣',
        description: '当前账单：有优惠券流水（显示为 − 扣减），但实际到账没有抵扣优惠金额，导致差额为正。请选择「✗ 优惠未抵扣」，或按键盘数字键 3。',
        hasBill: true,
        action: 'select',
        highlight: 'coupon_missingBtn',
        billCategory: 'coupon_missing',
        expectAnswer: 'coupon_missing'
      },
      {
        title: '得分规则',
        description: '回答正确 +20~40 分（越快越高），连击额外加分；回答错误 -15 分，连击清零。限时关卡，争分夺秒！',
        hasBill: false,
        action: null,
        highlight: null
      },
      {
        title: '准备好了吗？',
        description: '新手引导完成！现在开始你的对账之旅吧！',
        hasBill: false,
        action: 'finish',
        highlight: null
      }
    ];
  }

  private showStep(stepIndex: number): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    this.currentStep = stepIndex;
    this.canInteract = false;

    if (this.tutorialContainer) {
      this.tutorialContainer.destroy();
    }

    const step = this.tutorialSteps[stepIndex];

    if (step.hasBill && step.billCategory) {
      this.showBillCard(step.billCategory);
    } else {
      if (this.billContainer) {
        this.billContainer.destroy();
        this.billContainer = undefined;
      }
    }

    this.tutorialContainer = this.add.container(width / 2, height / 2 + 170);

    const panelWidth = 620;
    const panelHeight = 160;

    const panelBg = this.add.rectangle(0, 0, panelWidth, panelHeight, COLORS.cardBg)
      .setStrokeStyle(2, COLORS.primary, 0.8);

    const title = this.add.text(0, -panelHeight / 2 + 30, step.title, {
      fontSize: '22px',
      fontWeight: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);

    const description = this.add.text(0, -2, step.description, {
      fontSize: '15px',
      color: '#a0a0a0',
      wordWrap: { width: panelWidth - 60 },
      align: 'center'
    }).setOrigin(0.5);

    const stepIndicator = this.add.text(
      -panelWidth / 2 + 30,
      panelHeight / 2 - 25,
      `${stepIndex + 1} / ${this.tutorialSteps.length}`,
      {
        fontSize: '14px',
        color: '#666666'
      }
    ).setOrigin(0, 0.5);

    this.tutorialContainer.add([panelBg, title, description, stepIndicator]);

    if (step.action === 'finish') {
      const startBtn = this.add.rectangle(0, panelHeight / 2 - 35, 200, 44, COLORS.success)
        .setStrokeStyle(2, 0xffffff, 0.3)
        .setInteractive({ useHandCursor: true });

      this.add.text(0, panelHeight / 2 - 35, '开始游戏', {
        fontSize: '18px',
        fontWeight: 'bold',
        color: '#ffffff'
      }).setOrigin(0.5);

      startBtn.on('pointerdown', () => {
        this.audioManager.playClick();
        this.finishTutorial();
      });

      this.tutorialContainer.add(startBtn);
    } else if (step.action !== 'select') {
      const nextBtn = this.add.rectangle(panelWidth / 2 - 30, panelHeight / 2 - 35, 100, 38, COLORS.primary)
        .setStrokeStyle(2, 0xffffff, 0.2)
        .setInteractive({ useHandCursor: true });

      this.add.text(panelWidth / 2 - 30, panelHeight / 2 - 35, '下一步', {
        fontSize: '16px',
        fontWeight: 'bold',
        color: '#ffffff'
      }).setOrigin(0.5);

      nextBtn.on('pointerdown', () => {
        this.audioManager.playClick();
        this.nextStep();
      });

      if (stepIndex > 0) {
        const prevBtn = this.add.rectangle(-panelWidth / 2 + 30, panelHeight / 2 - 35, 100, 38, COLORS.cardBorder, 1)
          .setStrokeStyle(2, 0xffffff, 0.2)
          .setInteractive({ useHandCursor: true });

        this.add.text(-panelWidth / 2 + 30, panelHeight / 2 - 35, '上一步', {
          fontSize: '16px',
          color: '#ffffff'
        }).setOrigin(0.5);

        prevBtn.on('pointerdown', () => {
          this.audioManager.playClick();
          this.prevStep();
        });

        this.tutorialContainer.add(prevBtn);
      }

      this.tutorialContainer.add(nextBtn);
    }

    if (step.highlight && this.billContainer) {
      this.showHighlight(step.highlight);
    }

    this.tutorialContainer.setAlpha(0);
    this.tweens.add({
      targets: this.tutorialContainer,
      alpha: 1,
      duration: 300,
      ease: 'Sine.easeOut'
    });

    if (!step.action || step.action !== 'select') {
      this.canInteract = true;
    } else {
      this.time.delayedCall(500, () => {
        this.canInteract = true;
      });
    }
  }

  private showBillCard(category: DiscrepancyCategory): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    if (this.billContainer) {
      this.billContainer.destroy();
    }

    this.currentBill = generateBill(0, 0, 0, category);

    const bill = this.currentBill;
    this.billContainer = this.add.container(width / 2, height / 2 - 70);

    const leftX = -380;
    const rightX = 180;
    const panelW = 360;
    const panelH = 380;

    const leftPanel = this.add.rectangle(leftX, 0, panelW, panelH, COLORS.cardBg)
      .setStrokeStyle(2, COLORS.cardBorder, 1);

    const merchantLabel = this.add.text(leftX - panelW / 2 + 20, -panelH / 2 + 30, bill.merchantName, {
      fontSize: '20px',
      fontWeight: 'bold',
      color: '#ffffff'
    }).setOrigin(0, 0.5);

    const orderLabel = this.add.text(leftX - panelW / 2 + 20, -panelH / 2 + 60, `订单数量: ${bill.orderCount} 单`, {
      fontSize: '13px',
      color: '#888888'
    }).setOrigin(0, 0.5);

    const divider1 = this.add.rectangle(leftX, -panelH / 2 + 85, panelW - 40, 1, COLORS.cardBorder, 0.5);

    const expectedLabel = this.add.text(leftX - panelW / 2 + 20, -panelH / 2 + 110, '预期结算', {
      fontSize: '12px',
      color: '#888888'
    }).setOrigin(0, 0.5);

    const expectedAmount = this.add.text(leftX + panelW / 2 - 20, -panelH / 2 + 110, formatAmount(bill.expectedAmount), {
      fontSize: '16px',
      fontWeight: 'bold',
      color: '#ffffff'
    }).setOrigin(1, 0.5);

    const actualLabel = this.add.text(leftX - panelW / 2 + 20, -panelH / 2 + 135, '实际到账', {
      fontSize: '12px',
      color: '#888888'
    }).setOrigin(0, 0.5);

    const diff = bill.actualAmount - bill.expectedAmount;
    const actualAmount = this.add.text(leftX + panelW / 2 - 20, -panelH / 2 + 135, formatAmount(bill.actualAmount), {
      fontSize: '16px',
      fontWeight: 'bold',
      color: diff === 0 ? '#' + COLORS.success.toString(16).padStart(6, '0') : '#' + COLORS.danger.toString(16).padStart(6, '0')
    }).setOrigin(1, 0.5);

    const diffLabel = this.add.text(leftX - panelW / 2 + 20, -panelH / 2 + 160, '差额', {
      fontSize: '12px',
      color: '#888888'
    }).setOrigin(0, 0.5);

    const diffAmount = this.add.text(leftX + panelW / 2 - 20, -panelH / 2 + 160, `${diff >= 0 ? '+' : ''}${formatAmount(diff)}`, {
      fontSize: '16px',
      fontWeight: 'bold',
      color: diff === 0 ? '#' + COLORS.success.toString(16).padStart(6, '0') : '#' + COLORS.danger.toString(16).padStart(6, '0')
    }).setOrigin(1, 0.5);

    const divider2 = this.add.rectangle(leftX, -panelH / 2 + 185, panelW - 40, 1, COLORS.cardBorder, 0.5);

    const txTitle = this.add.text(leftX - panelW / 2 + 20, -panelH / 2 + 210, '📋 支付流水明细', {
      fontSize: '14px',
      fontWeight: 'bold',
      color: '#' + COLORS.primary.toString(16).padStart(6, '0')
    }).setOrigin(0, 0.5);

    this.billContainer.add([
      leftPanel, merchantLabel, orderLabel, divider1,
      expectedLabel, expectedAmount, actualLabel, actualAmount,
      diffLabel, diffAmount, divider2, txTitle
    ]);

    const TYPE_COLORS: Record<string, number> = {
      order: COLORS.success,
      refund: COLORS.danger,
      coupon: COLORS.warning,
      platform_fee: COLORS.primary,
      subsidy: 0xffa500,
      delivery: 0x87ceeb
    };

    const TYPE_LABELS: Record<string, string> = {
      order: '订单',
      refund: '退款',
      coupon: '优惠',
      platform_fee: '抽成',
      subsidy: '补贴',
      delivery: '配送'
    };

    const visibleTransactions = bill.transactions.slice(0, 5);
    visibleTransactions.forEach((tx, i) => {
      const ty = -panelH / 2 + 235 + i * 24;
      const isPositive = tx.type === 'order' || tx.type === 'subsidy' || tx.type === 'delivery';
      const tagColor = TYPE_COLORS[tx.type] || 0x888888;

      const tag = this.add.rectangle(leftX - panelW / 2 + 30, ty, 42, 18, tagColor, 0.25)
        .setStrokeStyle(1, tagColor, 0.5);
      const tagText = this.add.text(leftX - panelW / 2 + 30, ty, TYPE_LABELS[tx.type] || tx.type, {
        fontSize: '10px',
        fontWeight: 'bold',
        color: '#' + tagColor.toString(16).padStart(6, '0')
      }).setOrigin(0.5);

      const idText = this.add.text(leftX - panelW / 2 + 60, ty, tx.orderNo, {
        fontSize: '10px',
        color: '#888888'
      }).setOrigin(0, 0.5);

      const amtText = this.add.text(leftX + panelW / 2 - 20, ty,
        `${isPositive ? '+' : '-'}${formatAmount(tx.amount)}`, {
          fontSize: '12px',
          fontWeight: 'bold',
          color: isPositive ? '#' + COLORS.success.toString(16).padStart(6, '0') : '#' + COLORS.danger.toString(16).padStart(6, '0')
        }
      ).setOrigin(1, 0.5);

      this.billContainer!.add([tag, tagText, idText, amtText]);
    });

    if (bill.transactions.length > 5) {
      const moreText = this.add.text(leftX, -panelH / 2 + 235 + 5 * 24,
        `... 还有 ${bill.transactions.length - 5} 条流水`, {
          fontSize: '11px',
          color: '#666666'
        }
      ).setOrigin(0.5);
      this.billContainer.add(moreText);
    }

    const tip = this.add.text(leftX, panelH / 2 - 20, '💡 对照流水和结算金额判断差异', {
      fontSize: '11px',
      color: '#666666'
    }).setOrigin(0.5);
    this.billContainer.add(tip);

    const rightPanel = this.add.rectangle(rightX, 0, 300, panelH, COLORS.cardBg)
      .setStrokeStyle(2, COLORS.cardBorder, 1);

    const optionsTitle = this.add.text(rightX, -panelH / 2 + 30, '请选择对账结果 (按数字键 1-7)', {
      fontSize: '13px',
      fontWeight: 'bold',
      color: '#' + COLORS.warning.toString(16).padStart(6, '0')
    }).setOrigin(0.5);

    this.billContainer.add([rightPanel, optionsTitle]);

    const categories: DiscrepancyCategory[] = [
      'correct', 'refund_missing', 'coupon_missing',
      'platform_fee_wrong', 'subsidy_missing', 'delivery_fee_wrong', 'order_missing'
    ];

    const dotColors: Record<DiscrepancyCategory, number> = {
      correct: COLORS.success,
      refund_missing: COLORS.danger,
      coupon_missing: COLORS.warning,
      platform_fee_wrong: COLORS.primary,
      subsidy_missing: 0xffa500,
      delivery_fee_wrong: 0x87ceeb,
      order_missing: 0xdda0dd
    };

    categories.forEach((cat, i) => {
      const by = -panelH / 2 + 70 + i * 43;
      const btnColor = dotColors[cat];
      const label = CATEGORY_LABELS[cat];

      const btn = this.add.rectangle(rightX, by, 260, 36, 0x1a1a2e, 1)
        .setStrokeStyle(2, btnColor, 0.6)
        .setInteractive({ useHandCursor: true })
        .setName(cat + 'Btn');

      const dot = this.add.circle(rightX - 110, by, 6, btnColor).setName(cat + 'Dot');

      const numLabel = this.add.text(rightX - 85, by, `${i + 1}`, {
        fontSize: '14px',
        fontWeight: 'bold',
        color: '#' + btnColor.toString(16).padStart(6, '0')
      }).setOrigin(0.5);

      const txt = this.add.text(rightX - 65, by, label, {
        fontSize: '13px',
        fontWeight: 'bold',
        color: cat === 'correct' ? '#90ee90' : '#ffffff'
      }).setOrigin(0, 0.5);

      btn.on('pointerover', () => btn.setScale(1.03));
      btn.on('pointerout', () => btn.setScale(1));
      btn.on('pointerdown', () => this.handleAnswer(cat));

      this.billContainer!.add([btn, dot, numLabel, txt]);
    });

    this.activeBillId = this.currentBill!.id;

    this.billContainer.setScale(0.85);
    this.billContainer.setAlpha(0);

    this.tweens.add({
      targets: this.billContainer,
      scale: 1,
      alpha: 1,
      duration: 350,
      ease: 'Back.easeOut'
    });
  }

  private handleAnswer(selected: DiscrepancyCategory): void {
    if (!this.canInteract || !this.currentBill) return;

    const step = this.tutorialSteps[this.currentStep];
    const isCorrect = step.action === 'select' && selected === step.expectAnswer;

    if (isCorrect) {
      this.audioManager.playCorrect();
      this.showFeedback('回答正确! ' + CATEGORY_LABELS[selected], COLORS.success);
      this.canInteract = false;
      this.time.delayedCall(1200, () => {
        this.nextStep();
      });
    } else {
      this.audioManager.playWrong();
      this.showFeedback(`再想想哦~ 正确答案是: ${CATEGORY_LABELS[this.currentBill!.discrepancyCategory]}`, COLORS.warning);
      this.cameras.main.shake(150, 0.008);
    }
  }

  private showHighlight(type: string): void {
    if (!this.billContainer) return;

    const pulse = (target: Phaser.GameObjects.GameObject) => {
      this.tweens.add({
        targets: target,
        scaleX: 1.08,
        scaleY: 1.15,
        duration: 500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    };

    if (type === 'bill') {
      const card = this.billContainer.getAt(0);
      if (card) pulse(card);
    } else if (type.endsWith('Btn')) {
      const btn = this.billContainer.getByName(type);
      if (btn) pulse(btn);
    }
  }

  private showFeedback(text: string, color: number): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const feedback = this.add.text(width / 2, height / 2 - 10, text, {
      fontSize: '32px',
      fontWeight: 'bold',
      color: '#' + color.toString(16).padStart(6, '0')
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: feedback,
      alpha: 1,
      y: '-=30',
      duration: 300,
      yoyo: true,
      hold: 500,
      onComplete: () => feedback.destroy()
    });
  }

  private nextStep(): void {
    if (this.currentStep < this.tutorialSteps.length - 1) {
      this.showStep(this.currentStep + 1);
    }
  }

  private prevStep(): void {
    if (this.currentStep > 0) {
      this.showStep(this.currentStep - 1);
    }
  }

  private finishTutorial(): void {
    this.stateManager.setTutorialCompleted();
    this.audioManager.playLevelComplete();
    this.scene.start('LevelSelectScene');
  }
}

interface TutorialStep {
  title: string;
  description: string;
  hasBill: boolean;
  action: string | null;
  highlight: string | null;
  billCategory?: DiscrepancyCategory;
  expectAnswer?: DiscrepancyCategory;
}
