import Phaser from 'phaser';
import Matter from 'matter-js';
import levelConfigs from '@/config/levelConfigs';
import scoringConfig from '@/config/scoringConfig';
import type { LevelConfig, LevelResult } from '@/config/types';
import { ScoringSystem } from '@/systems/ScoringSystem';
import { VerificationSystem } from '@/systems/VerificationSystem';
import { SponsorSystem } from '@/systems/SponsorSystem';
import { SettingsSystem } from '@/systems/SettingsSystem';
import { ResultStore } from '@/systems/ResultStore';

const COLORS = {
  BG: 0x1a1a2e,
  PRIMARY: 0x4fc3f7,
  DANGER: 0xef5350,
  SUCCESS: 0x66bb6a,
  GOLD: 0xffd54f,
  TEXT: 0xffffff,
  PANEL: 0x16213e,
  STREAK: 0xff9800,
};

type GamePhase = 'sponsor' | 'verification' | 'complete';

export class GameScene extends Phaser.Scene {
  private levelConfig!: LevelConfig;
  private scoring!: ScoringSystem;
  private verification!: VerificationSystem;
  private sponsorSys!: SponsorSystem;
  private settings = new SettingsSystem();
  private resultStore = new ResultStore();

  private phase: GamePhase = 'sponsor';
  private timerEvent?: Phaser.Time.TimerEvent;
  private timeLeft = 0;
  private isPaused = false;

  private hudContainer!: Phaser.GameObjects.Container;
  private phaseContainer!: Phaser.GameObjects.Container;
  private scoreText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private streakText!: Phaser.GameObjects.Text;
  private errorsText!: Phaser.GameObjects.Text;
  private phaseLabel!: Phaser.GameObjects.Text;

  private matterEngine!: Matter.Engine;
  private matterRender!: boolean;
  private draggableSponsors: Map<string, Phaser.GameObjects.Container> = new Map();
  private slotZones: Map<string, Phaser.GameObjects.Container> = new Map();
  private draggedItem: Phaser.GameObjects.Container | null = null;
  private dragOffset = { x: 0, y: 0 };

  private verifyButtons: { valid: Phaser.GameObjects.Container; invalid: Phaser.GameObjects.Container } | null = null;
  private verifyTaskDisplay: Phaser.GameObjects.Container | null = null;

  private feedbackText!: Phaser.GameObjects.Text;
  private comboParticles: Phaser.GameObjects.Particles.ParticleEmitter | null = null;

  constructor() {
    super({ key: 'Game' });
  }

  init(data: { levelId: string }): void {
    const cfg = levelConfigs.find(l => l.id === data.levelId);
    if (!cfg) {
      this.scene.start('LevelSelect');
      return;
    }
    this.levelConfig = cfg;
    this.scoring = new ScoringSystem(scoringConfig);
    this.verification = new VerificationSystem();
    this.sponsorSys = new SponsorSystem();
    this.phase = 'sponsor';
    this.timeLeft = cfg.timeLimitSec;
    this.isPaused = false;
    this.draggableSponsors.clear();
    this.slotZones.clear();
    this.draggedItem = null;
    this.verifyButtons = null;
    this.verifyTaskDisplay = null;
    this.comboParticles = null;
  }

  create(): void {
    const { width, height } = this.scale;

    this.matterEngine = Matter.Engine.create();
    this.matterEngine.gravity.y = 0;

    this.cameras.main.setBackgroundColor(COLORS.BG);

    this.scoring.reset();
    this.sponsorSys.load(this.levelConfig.sponsors, this.levelConfig.performanceSlots);
    this.verification.load(this.levelConfig.ticketRules, this.levelConfig.performanceSlots, this.levelConfig.verificationRecords);

    this.createHUD(width, height);
    this.createFeedback(width, height);
    this.buildSponsorPhase(width, height);
    this.startTimer();
  }

  private createHUD(w: number, h: number): void {
    this.hudContainer = this.add.container(0, 0);

    const bg = this.add.rectangle(w / 2, 30, w, 56, COLORS.PANEL, 0.9);
    this.hudContainer.add(bg);

    this.scoreText = this.add.text(20, 12, '得分: 0', {
      fontSize: '18px', color: '#ffffff', fontStyle: 'bold',
    });
    this.hudContainer.add(this.scoreText);

    this.timerText = this.add.text(w / 2, 12, '', {
      fontSize: '18px', color: '#ffd54f', fontStyle: 'bold',
    }).setOrigin(0.5, 0);
    this.hudContainer.add(this.timerText);

    this.streakText = this.add.text(w - 180, 12, '连击: 0', {
      fontSize: '16px', color: '#ff9800',
    });
    this.hudContainer.add(this.streakText);

    this.errorsText = this.add.text(w - 80, 12, '误: 0', {
      fontSize: '16px', color: '#ef5350',
    });
    this.hudContainer.add(this.errorsText);

    this.phaseLabel = this.add.text(w / 2, 48, '', {
      fontSize: '14px', color: '#4fc3f7',
    }).setOrigin(0.5, 0);
    this.hudContainer.add(this.phaseLabel);

    const pauseBtn = this.add.text(w - 30, 14, '⏸', {
      fontSize: '20px', color: '#ffffff',
    }).setInteractive({ useHandCursor: true });

    pauseBtn.on('pointerdown', () => this.togglePause());
    this.hudContainer.add(pauseBtn);
  }

  private createFeedback(w: number, h: number): void {
    this.feedbackText = this.add.text(w / 2, h / 2, '', {
      fontSize: '32px', color: '#ffffff', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5).setAlpha(0).setDepth(100);
  }

  private showFeedback(text: string, color: string): void {
    this.feedbackText.setText(text).setColor(color).setAlpha(1);
    if (this.settings.shouldAnimate()) {
      const dur = 600 * this.settings.getAnimDurationMultiplier();
      this.tweens.add({
        targets: this.feedbackText,
        alpha: 0, y: this.feedbackText.y - 40,
        duration: dur, ease: 'Power2',
        onComplete: () => {
          this.feedbackText.y += 40;
        },
      });
    } else {
      this.time.delayedCall(600, () => this.feedbackText.setAlpha(0));
    }
  }

  private startTimer(): void {
    this.updateTimerDisplay();
    this.timerEvent = this.time.addEvent({
      delay: 1000,
      callback: () => {
        if (this.isPaused) return;
        this.timeLeft--;
        this.updateTimerDisplay();
        if (this.timeLeft <= 0) {
          this.endGame();
        }
      },
      loop: true,
    });
  }

  private updateTimerDisplay(): void {
    const min = Math.floor(this.timeLeft / 60);
    const sec = this.timeLeft % 60;
    const color = this.timeLeft <= 10 ? '#ef5350' : '#ffd54f';
    this.timerText.setText(`${min}:${sec.toString().padStart(2, '0')}`).setColor(color);
  }

  private updateHUD(): void {
    this.scoreText.setText(`得分: ${this.scoring.score}`);
    this.streakText.setText(`连击: ${this.scoring.streak}`);
    this.errorsText.setText(`误: ${this.scoring.errors}`);
  }

  private togglePause(): void {
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      this.showPauseOverlay();
    }
  }

  private showPauseOverlay(): void {
    const { width, height } = this.scale;
    const overlay = this.add.container(0, 0).setDepth(200);

    const bg = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);
    overlay.add(bg);

    const title = this.add.text(width / 2, height / 2 - 60, '暂停', {
      fontSize: '36px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5);
    overlay.add(title);

    const resumeBtn = this.add.text(width / 2, height / 2, '继续', {
      fontSize: '24px', color: '#4fc3f7',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    resumeBtn.on('pointerdown', () => {
      overlay.destroy();
      this.isPaused = false;
    });
    overlay.add(resumeBtn);

    const quitBtn = this.add.text(width / 2, height / 2 + 50, '退出关卡', {
      fontSize: '20px', color: '#ef5350',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    quitBtn.on('pointerdown', () => {
      overlay.destroy();
      this.scene.start('LevelSelect');
    });
    overlay.add(quitBtn);
  }

  private buildSponsorPhase(w: number, h: number): void {
    this.phaseLabel.setText('赞助商排期');
    this.phaseContainer = this.add.container(0, 0);
    const slots = this.levelConfig.performanceSlots;
    const sponsors = this.levelConfig.sponsors;

    const slotStartX = 60;
    const slotY = 180;

    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i];
      const x = slotStartX + i * 155;
      const container = this.add.container(x, slotY);

      const bg = this.add.rectangle(0, 0, 140, 180, COLORS.PANEL, 0.9)
        .setStrokeStyle(2, COLORS.PRIMARY, 0.5);
      container.add(bg);

      const name = this.add.text(0, -60, slot.name, {
        fontSize: '14px', color: '#ffffff', fontStyle: 'bold', align: 'center',
      }).setOrigin(0.5);
      container.add(name);

      const time = this.add.text(0, -40, slot.time, {
        fontSize: '12px', color: '#ffd54f',
      }).setOrigin(0.5);
      container.add(time);

      const cap = this.add.text(0, -20, `容量: ${slot.capacity}`, {
        fontSize: '11px', color: '#aaaaaa',
      }).setOrigin(0.5);
      container.add(cap);

      const price = this.add.text(0, 0, `¥${slot.basePrice}`, {
        fontSize: '13px', color: '#4fc3f7',
      }).setOrigin(0.5);
      container.add(price);

      const dropZone = this.add.rectangle(0, 40, 120, 60, 0x2a2a4a, 0.5)
        .setStrokeStyle(1, 0x4fc3f7, 0.3);
      dropZone.setName('dropZone');
      container.add(dropZone);

      const dropLabel = this.add.text(0, 40, '拖入', {
        fontSize: '11px', color: '#666688',
      }).setOrigin(0.5);
      container.add(dropLabel);

      container.setSize(140, 180);
      container.setDepth(5);
      this.slotZones.set(slot.id, container);
    }

    const sponsorStartX = 60;
    const sponsorY = h - 140;

    for (let i = 0; i < sponsors.length; i++) {
      const sp = sponsors[i];
      const x = sponsorStartX + i * 200;
      const container = this.add.container(x, sponsorY);
      container.setName(sp.id);

      const bg = this.add.rectangle(0, 0, 180, 80, 0x2a3a5e, 0.9)
        .setStrokeStyle(2, this.getTierColor(sp.tier));
      container.add(bg);

      const tierIcon = this.add.image(-70, -20, this.getTierKey(sp.tier)).setDisplaySize(20, 20);
      container.add(tierIcon);

      const name = this.add.text(0, -20, sp.name, {
        fontSize: '14px', color: '#ffffff', fontStyle: 'bold',
      }).setOrigin(0.5);
      container.add(name);

      const budget = this.add.text(0, 5, `预算: ¥${sp.budget}`, {
        fontSize: '12px', color: '#ffd54f',
      }).setOrigin(0.5);
      container.add(budget);

      const verify = this.add.text(0, 22, sp.requiresVerification ? '需核销' : '', {
        fontSize: '10px', color: '#ef5350',
      }).setOrigin(0.5);
      container.add(verify);

      container.setSize(180, 80);
      container.setDepth(10);

      const matterBody = Matter.Bodies.rectangle(x, sponsorY, 180, 80, {
        isStatic: false, friction: 0.8, restitution: 0.2,
        label: sp.id,
      });
      Matter.Composite.add(this.matterEngine.world, matterBody);
      container.setData('matterBody', matterBody);

      container.setInteractive({ draggable: true, useHandCursor: true });

      container.on('dragstart', (pointer: Phaser.Input.Pointer) => {
        this.draggedItem = container;
        this.dragOffset.x = container.x - pointer.x;
        this.dragOffset.y = container.y - pointer.y;
        container.setDepth(20);
        this.playClickSound();
      });

      container.on('drag', (pointer: Phaser.Input.Pointer) => {
        if (!this.draggedItem) return;
        const newX = pointer.x + this.dragOffset.x;
        const newY = pointer.y + this.dragOffset.y;
        container.setPosition(newX, newY);
        const body = container.getData('matterBody') as Matter.Body;
        if (body) {
          Matter.Body.setPosition(body, { x: newX, y: newY });
        }
      });

      container.on('dragend', () => {
        if (!this.draggedItem) return;
        container.setDepth(10);
        this.handleSponsorDrop(container);
        this.draggedItem = null;
      });

      this.draggableSponsors.set(sp.id, container);
    }

    const skipBtn = this.add.text(w / 2, h - 40, '跳过排期 →', {
      fontSize: '16px', color: '#aaaaaa',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    skipBtn.on('pointerdown', () => this.transitionToVerification());
    this.phaseContainer.add(skipBtn);
  }

  private handleSponsorDrop(container: Phaser.GameObjects.Container): void {
    const sponsorId = container.name;
    let bestSlot: string | null = null;
    let bestDist = Infinity;

    this.slotZones.forEach((slotCont, slotId) => {
      const dist = Phaser.Math.Distance.Between(
        container.x, container.y,
        slotCont.x, slotCont.y + 40
      );
      if (dist < 100 && dist < bestDist) {
        bestDist = dist;
        bestSlot = slotId;
      }
    });

    if (bestSlot) {
      const result = this.sponsorSys.assignSponsor(sponsorId, bestSlot);
      if (result) {
        if (result.isCorrect) {
          this.scoring.recordCorrect();
          this.showFeedback('✓ 排期正确', '#66bb6a');
          this.spawnComboParticles(container.x, container.y);
        } else {
          this.scoring.recordError();
          this.showFeedback('✗ 排期不当', '#ef5350');
        }

        const slotCont = this.slotZones.get(bestSlot)!;
        container.setPosition(slotCont.x, slotCont.y + 40);

        const body = container.getData('matterBody') as Matter.Body;
        if (body) {
          Matter.Body.setStatic(body, true);
          Matter.Body.setPosition(body, { x: container.x, y: container.y });
        }

        container.disableInteractive();
        this.updateHUD();

        if (this.sponsorSys.isComplete) {
          this.time.delayedCall(800, () => this.transitionToVerification());
        }
      }
    } else {
      const sp = this.levelConfig.sponsors.find(s => s.id === sponsorId);
      if (sp) {
        const idx = this.levelConfig.sponsors.indexOf(sp);
        const startX = 60 + idx * 200;
        const { height } = this.scale;
        if (this.settings.shouldAnimate()) {
          this.tweens.add({
            targets: container,
            x: startX, y: height - 140,
            duration: 300 * this.settings.getAnimDurationMultiplier(),
            ease: 'Back.easeOut',
          });
        } else {
          container.setPosition(startX, height - 140);
        }
        const body = container.getData('matterBody') as Matter.Body;
        if (body) Matter.Body.setPosition(body, { x: startX, y: height - 140 });
      }
    }
  }

  private transitionToVerification(): void {
    this.phase = 'verification';
    this.phaseContainer.destroy(true);
    this.draggableSponsors.clear();
    this.slotZones.clear();
    Matter.Engine.clear(this.matterEngine);

    this.buildVerificationPhase(this.scale.width, this.scale.height);
  }

  private buildVerificationPhase(w: number, h: number): void {
    this.phaseLabel.setText('票务核销');
    this.phaseContainer = this.add.container(0, 0);

    const currentTask = this.verification.getCurrentTask();
    if (!currentTask) {
      this.endGame();
      return;
    }

    this.renderVerifyTask(currentTask, w, h);
  }

  private renderVerifyTask(task: ReturnType<VerificationSystem['getCurrentTask']>, w: number, h: number): void {
    if (!task) return;
    if (this.verifyTaskDisplay) this.verifyTaskDisplay.destroy(true);

    this.verifyTaskDisplay = this.add.container(0, 0);

    const cardX = w / 2;
    const cardY = h / 2 - 40;

    const cardBg = this.add.rectangle(cardX, cardY, 400, 220, COLORS.PANEL, 0.95)
      .setStrokeStyle(2, COLORS.PRIMARY, 0.6);
    this.verifyTaskDisplay.add(cardBg);

    const title = this.add.text(cardX, cardY - 80, '核销验证', {
      fontSize: '18px', color: '#4fc3f7', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.verifyTaskDisplay.add(title);

    const progressText = this.add.text(cardX, cardY - 60, `${this.verification.progress + 1} / ${this.verification.total}`, {
      fontSize: '12px', color: '#888888',
    }).setOrigin(0.5);
    this.verifyTaskDisplay.add(progressText);

    const ruleColor = '#' + task.rule.color.toString(16).padStart(6, '0');
    const ticketName = this.add.text(cardX, cardY - 30, `票种: ${task.rule.name}`, {
      fontSize: '20px', color: ruleColor, fontStyle: 'bold',
    }).setOrigin(0.5);
    this.verifyTaskDisplay.add(ticketName);

    const slotName = this.add.text(cardX, cardY, `演出: ${task.slot.name} (${task.slot.time})`, {
      fontSize: '16px', color: '#ffffff',
    }).setOrigin(0.5);
    this.verifyTaskDisplay.add(slotName);

    const discount = this.add.text(cardX, cardY + 25, `折扣率: ${(task.rule.discountRate * 100).toFixed(0)}% | 单价: ¥${task.slot.basePrice}`, {
      fontSize: '13px', color: '#aaaaaa',
    }).setOrigin(0.5);
    this.verifyTaskDisplay.add(discount);

    const sponsorNote = this.add.text(cardX, cardY + 48,
      task.rule.requiresSponsor ? '⚠ 此票种需赞助商关联' : '',
      { fontSize: '12px', color: '#ef5350' }
    ).setOrigin(0.5);
    this.verifyTaskDisplay.add(sponsorNote);

    const btnY = cardY + 90;

    const validBtn = this.add.container(cardX - 80, btnY);
    const validBg = this.add.rectangle(0, 0, 120, 44, COLORS.SUCCESS, 0.9);
    const validLabel = this.add.text(0, 0, '✓ 有效', {
      fontSize: '16px', color: '#1a1a2e', fontStyle: 'bold',
    }).setOrigin(0.5);
    validBtn.add([validBg, validLabel]);
    validBtn.setSize(120, 44);
    validBg.setInteractive({ useHandCursor: true });
    validBg.on('pointerdown', () => this.handleVerifyAnswer(true));
    this.verifyTaskDisplay.add(validBtn);

    const invalidBtn = this.add.container(cardX + 80, btnY);
    const invalidBg = this.add.rectangle(0, 0, 120, 44, COLORS.DANGER, 0.9);
    const invalidLabel = this.add.text(0, 0, '✗ 无效', {
      fontSize: '16px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5);
    invalidBtn.add([invalidBg, invalidLabel]);
    invalidBtn.setSize(120, 44);
    invalidBg.setInteractive({ useHandCursor: true });
    invalidBg.on('pointerdown', () => this.handleVerifyAnswer(false));
    this.verifyTaskDisplay.add(invalidBtn);

    this.verifyButtons = { valid: validBtn, invalid: invalidBtn };

    if (this.settings.shouldAnimate()) {
      this.verifyTaskDisplay.setAlpha(0);
      this.tweens.add({
        targets: this.verifyTaskDisplay,
        alpha: 1,
        duration: 200 * this.settings.getAnimDurationMultiplier(),
      });
    }
  }

  private handleVerifyAnswer(playerSaysValid: boolean): void {
    if (this.phase !== 'verification') return;
    if (!this.verifyButtons) return;

    const result = this.verification.answerCurrent(playerSaysValid);
    if (!result) return;

    if (result.isCorrect) {
      this.scoring.recordCorrect();
      this.showFeedback('✓ 正确', '#66bb6a');
      this.spawnComboParticles(this.scale.width / 2, this.scale.height / 2);
    } else {
      this.scoring.recordError();
      const reason = result.record.reason || '规则不符';
      this.showFeedback(`✗ ${reason}`, '#ef5350');
    }

    this.updateHUD();

    if (this.settings.vibrationEnabled && navigator.vibrate) {
      try { navigator.vibrate(result.isCorrect ? 30 : 100); } catch {}
    }

    if (this.verification.isComplete) {
      this.time.delayedCall(600, () => this.endGame());
      return;
    }

    const nextTask = this.verification.getCurrentTask();
    if (nextTask) {
      this.time.delayedCall(300, () => this.renderVerifyTask(nextTask, this.scale.width, this.scale.height));
    }
  }

  private spawnComboParticles(x: number, y: number): void {
    if (!this.settings.shouldAnimate()) return;
    if (this.scoring.streak < 3) return;

    const particles = this.add.particles(x, y, 'particle', {
      speed: { min: 50, max: 150 },
      scale: { start: 0.6, end: 0 },
      lifespan: 600,
      quantity: 8 + this.scoring.streak * 2,
      tint: COLORS.STREAK,
      emitting: false,
    });
    particles.explode();
    this.time.delayedCall(1000, () => particles.destroy());
  }

  private endGame(): void {
    if (this.phase === 'complete') return;
    this.phase = 'complete';

    if (this.timerEvent) this.timerEvent.remove(false);

    const levelResult: LevelResult = {
      levelId: this.levelConfig.id,
      score: this.scoring.score,
      speed: this.scoring.getSpeed(),
      errors: this.scoring.errors,
      maxStreak: this.scoring.maxStreak,
      verificationEfficiency: this.scoring.getVerificationEfficiency(),
      completedAt: Date.now(),
    };

    this.resultStore.addResult(levelResult);

    this.scene.start('Result', {
      levelId: this.levelConfig.id,
      result: levelResult,
      targetScore: this.levelConfig.targetScore,
    });
  }

  private getTierColor(tier: string): number {
    switch (tier) {
      case 'gold': return 0xffd54f;
      case 'silver': return 0xb0bec5;
      case 'bronze': return 0xa1887f;
      default: return 0xffffff;
    }
  }

  private getTierKey(tier: string): string {
    return `tier_${tier}`;
  }

  private playClickSound(): void {
    if (!this.settings.soundEnabled) return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 600;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.08);
    } catch {}
  }

  update(): void {
    if (this.phase === 'sponsor') {
      Matter.Engine.update(this.matterEngine, 16.67);
      this.draggableSponsors.forEach((container) => {
        const body = container.getData('matterBody') as Matter.Body | undefined;
        if (body && !body.isStatic && this.draggedItem !== container) {
          container.setPosition(body.position.x, body.position.y);
        }
      });
    }
  }
}
