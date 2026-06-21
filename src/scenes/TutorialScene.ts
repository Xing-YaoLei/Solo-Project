import Phaser from 'phaser';
import { COLORS } from '../config/gameConfig';
import { AudioManager } from '../managers/AudioManager';
import { GameStateManager } from '../managers/GameStateManager';
import { generateBill, formatAmount } from '../utils/billUtils';
import type { BillData } from '../types';

export class TutorialScene extends Phaser.Scene {
  private audioManager: AudioManager;
  private stateManager: GameStateManager;
  private currentStep: number = 0;
  private tutorialSteps: TutorialStep[] = [];
  private tutorialContainer?: Phaser.GameObjects.Container;
  private billContainer?: Phaser.GameObjects.Container;
  private currentBill?: BillData;
  private canInteract: boolean = false;

  constructor() {
    super('TutorialScene');
    this.audioManager = AudioManager.getInstance();
    this.stateManager = GameStateManager.getInstance();
  }

  create(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    this.add.rectangle(width / 2, height / 2, width, height, COLORS.background);

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
        title: '认识账单卡片',
        description: '每张账单包含商户信息、预期结算金额和实际到账金额。',
        hasBill: true,
        action: null,
        highlight: 'bill'
      },
      {
        title: '金额校验',
        description: '你的任务是检查「预期金额」和「实际金额」是否一致。',
        hasBill: true,
        action: null,
        highlight: 'amounts'
      },
      {
        title: '一致的账单',
        description: '当两笔金额相同时，点击「✓ 金额一致」按钮，或按键盘 A/←',
        hasBill: true,
        action: 'correct',
        highlight: 'correctBtn',
        billType: 'correct'
      },
      {
        title: '有差异的账单',
        description: '当两笔金额不同时，点击「✗ 有差异」按钮，或按键盘 D/→',
        hasBill: true,
        action: 'wrong',
        highlight: 'wrongBtn',
        billType: 'wrong'
      },
      {
        title: '得分规则',
        description: '回答正确得分，回答错误扣分。连击会获得额外加分！',
        hasBill: false,
        action: null,
        highlight: 'combo'
      },
      {
        title: '速度也很重要',
        description: '回答越快，得分越高。限时关卡，争分夺秒！',
        hasBill: false,
        action: null,
        highlight: 'time'
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

    if (step.hasBill) {
      this.showBillCard(step.billType || 'correct');
    } else {
      if (this.billContainer) {
        this.billContainer.destroy();
        this.billContainer = undefined;
      }
    }

    this.tutorialContainer = this.add.container(width / 2, height / 2 + 80);

    const panelWidth = 500;
    const panelHeight = 180;

    const panelBg = this.add.rectangle(0, 0, panelWidth, panelHeight, COLORS.cardBg)
      .setStrokeStyle(2, COLORS.primary, 0.8);

    const title = this.add.text(0, -panelHeight / 2 + 35, step.title, {
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);

    const description = this.add.text(0, -10, step.description, {
      fontSize: '16px',
      color: '#a0a0a0',
      wordWrap: { width: panelWidth - 60 }
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
    } else if (step.action !== 'correct' && step.action !== 'wrong') {
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

    if (step.highlight) {
      this.showHighlight(step.highlight);
    }

    this.tutorialContainer.setAlpha(0);
    this.tweens.add({
      targets: this.tutorialContainer,
      alpha: 1,
      y: height / 2 + 80,
      duration: 300,
      ease: 'Sine.easeOut'
    });

    if (!step.action || (step.action !== 'correct' && step.action !== 'wrong')) {
      this.canInteract = true;
    } else {
      this.time.delayedCall(500, () => {
        this.canInteract = true;
      });
    }
  }

  private showBillCard(type: 'correct' | 'wrong'): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    if (this.billContainer) {
      this.billContainer.destroy();
    }

    this.currentBill = generateBill(0, type === 'wrong' ? 1 : 0, 0);
    if (type === 'correct') {
      this.currentBill.actualAmount = this.currentBill.expectedAmount;
      this.currentBill.hasDiscrepancy = false;
    } else {
      this.currentBill.hasDiscrepancy = true;
    }

    const bill = this.currentBill;

    this.billContainer = this.add.container(width / 2, height / 2 - 60);

    const cardWidth = 380;
    const cardHeight = 240;

    const cardBg = this.add.rectangle(0, 0, cardWidth, cardHeight, COLORS.cardBg)
      .setStrokeStyle(3, COLORS.primary, 0.8);

    const cardShadow = this.add.rectangle(3, 3, cardWidth, cardHeight, 0x000000, 0.3);

    this.billContainer.add([cardShadow, cardBg]);

    const merchantLabel = this.add.text(-cardWidth / 2 + 25, -cardHeight / 2 + 30, bill.merchantName, {
      fontSize: '22px',
      fontWeight: 'bold',
      color: '#ffffff'
    }).setOrigin(0, 0.5);

    const orderLabel = this.add.text(-cardWidth / 2 + 25, -cardHeight / 2 + 65, `订单数量: ${bill.orderCount} 单`, {
      fontSize: '14px',
      color: '#a0a0a0'
    }).setOrigin(0, 0.5);

    const divider1 = this.add.rectangle(0, -cardHeight / 2 + 90, cardWidth - 50, 1, COLORS.cardBorder, 0.5);

    const expectedLabel = this.add.text(-cardWidth / 2 + 25, -cardHeight / 2 + 115, '预期结算金额', {
      fontSize: '13px',
      color: '#888888'
    }).setOrigin(0, 0.5);

    const expectedAmount = this.add.text(cardWidth / 2 - 25, -cardHeight / 2 + 115, formatAmount(bill.expectedAmount), {
      fontSize: '18px',
      fontWeight: 'bold',
      color: '#ffffff'
    }).setOrigin(1, 0.5);

    const divider2 = this.add.rectangle(0, -cardHeight / 2 + 140, cardWidth - 50, 1, COLORS.cardBorder, 0.5);

    const actualLabel = this.add.text(-cardWidth / 2 + 25, -cardHeight / 2 + 165, '实际到账金额', {
      fontSize: '13px',
      color: '#888888'
    }).setOrigin(0, 0.5);

    const actualAmount = this.add.text(cardWidth / 2 - 25, -cardHeight / 2 + 165, formatAmount(bill.actualAmount), {
      fontSize: '22px',
      fontWeight: 'bold',
      color: '#' + COLORS.primary.toString(16).padStart(6, '0')
    }).setOrigin(1, 0.5);

    const buttonY = cardHeight / 2 + 45;
    const buttonGap = 110;

    const correctBtn = this.add.rectangle(-buttonGap / 2, buttonY, 160, 50, COLORS.success)
      .setStrokeStyle(2, 0xffffff, 0.3)
      .setInteractive({ useHandCursor: true })
      .setName('correctBtn');

    const correctText = this.add.text(-buttonGap / 2, buttonY, '✓ 金额一致', {
      fontSize: '18px',
      fontWeight: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5)
      .setName('correctText');

    const wrongBtn = this.add.rectangle(buttonGap / 2, buttonY, 160, 50, COLORS.danger)
      .setStrokeStyle(2, 0xffffff, 0.3)
      .setInteractive({ useHandCursor: true })
      .setName('wrongBtn');

    const wrongText = this.add.text(buttonGap / 2, buttonY, '✗ 有差异', {
      fontSize: '18px',
      fontWeight: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5)
      .setName('wrongText');

    const step = this.tutorialSteps[this.currentStep];
    const expectCorrect = step.billType === 'correct';

    const handleAnswer = (playerSaysCorrect: boolean) => {
      if (!this.canInteract) return;

      const isCorrect = playerSaysCorrect === !this.currentBill!.hasDiscrepancy;
      
      if (isCorrect) {
        this.audioManager.playCorrect();
        this.showFeedback('回答正确!', COLORS.success);
        this.time.delayedCall(1000, () => {
          this.nextStep();
        });
      } else {
        this.audioManager.playWrong();
        this.showFeedback('再想想哦~', COLORS.warning);
        this.cameras.main.shake(150, 0.008);
      }
      this.canInteract = false;
    };

    correctBtn.on('pointerdown', () => handleAnswer(true));
    wrongBtn.on('pointerdown', () => handleAnswer(false));

    this.input.keyboard?.on('keydown-LEFT', () => handleAnswer(true));
    this.input.keyboard?.on('keydown-RIGHT', () => handleAnswer(false));
    this.input.keyboard?.on('keydown-A', () => handleAnswer(true));
    this.input.keyboard?.on('keydown-D', () => handleAnswer(false));

    this.billContainer.add([
      merchantLabel,
      orderLabel,
      divider1,
      expectedLabel,
      expectedAmount,
      divider2,
      actualLabel,
      actualAmount,
      correctBtn,
      correctText,
      wrongBtn,
      wrongText
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
  }

  private showHighlight(type: string): void {
    if (!this.billContainer) return;

    const pulse = (target: Phaser.GameObjects.GameObject) => {
      this.tweens.add({
        targets: target,
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    };

    switch (type) {
      case 'bill':
        const card = this.billContainer.getAt(0);
        if (card) pulse(card);
        break;
      case 'correctBtn':
        const correctBtn = this.billContainer.getByName('correctBtn');
        if (correctBtn) pulse(correctBtn);
        break;
      case 'wrongBtn':
        const wrongBtn = this.billContainer.getByName('wrongBtn');
        if (wrongBtn) pulse(wrongBtn);
        break;
    }
  }

  private showFeedback(text: string, color: number): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const feedback = this.add.text(width / 2, height / 2 - 20, text, {
      fontSize: '36px',
      fontWeight: 'bold',
      color: '#' + color.toString(16).padStart(6, '0')
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: feedback,
      alpha: 1,
      y: '-=30',
      duration: 300,
      yoyo: true,
      hold: 400,
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
  billType?: 'correct' | 'wrong';
}
