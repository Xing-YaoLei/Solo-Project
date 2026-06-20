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
  private draggableSponsors: Map<string, Phaser.GameObjects.Container> = new Map();
  private slotZones: Map<string, Phaser.GameObjects.Container> = new Map();
  private draggedItem: Phaser.GameObjects.Container | null = null;
  private dragOffset = { x: 0, y: 0 };
  private sponsorStartPositions: Map<string, { x: number; y: number }> = new Map();

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
    this.sponsorStartPositions.clear();
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
    this.verification.load(this.levelConfig.ticketRules, this.levelConfig.performanceSlots, this.levelConfig.ticketOrders, this.levelConfig.sponsors);

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

    const padding = 30;
    const usableW = w - padding * 2;
    const slotAreaTop = 80;
    const slotAreaBottom = h - 200;
    const slotAreaH = slotAreaBottom - slotAreaTop;

    const { cols: slotCols, rows: slotRows, width: slotW, height: slotH } = this.calcGridLayout(slots.length, usableW, slotAreaH, 110, 140, 12);
    const slotTotalW = slotCols * slotW + (slotCols - 1) * 12;
    const slotStartX = (w - slotTotalW) / 2 + slotW / 2;
    const slotTotalH = slotRows * slotH + (slotRows - 1) * 12;
    const slotStartY = slotAreaTop + (slotAreaH - slotTotalH) / 2 + slotH / 2;

    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i];
      const col = i % slotCols;
      const row = Math.floor(i / slotCols);
      const x = slotStartX + col * (slotW + 12);
      const y = slotStartY + row * (slotH + 12);
      const container = this.add.container(x, y);

      const bg = this.add.rectangle(0, 0, slotW, slotH, COLORS.PANEL, 0.9)
        .setStrokeStyle(2, COLORS.PRIMARY, 0.5);
      container.add(bg);

      const nameFontSize = Math.min(13, slotW / 7);
      const name = this.add.text(0, -slotH / 2 + 18, slot.name, {
        fontSize: `${nameFontSize}px`, color: '#ffffff', fontStyle: 'bold', align: 'center',
        wordWrap: { width: slotW - 10 },
      }).setOrigin(0.5);
      container.add(name);

      const time = this.add.text(0, -slotH / 2 + 36, slot.time, {
        fontSize: '11px', color: '#ffd54f',
      }).setOrigin(0.5);
      container.add(time);

      const cap = this.add.text(0, -slotH / 2 + 52, `容量: ${slot.capacity}`, {
        fontSize: '10px', color: '#aaaaaa',
      }).setOrigin(0.5);
      container.add(cap);

      const price = this.add.text(0, -slotH / 2 + 68, `¥${slot.basePrice}`, {
        fontSize: '12px', color: '#4fc3f7',
      }).setOrigin(0.5);
      container.add(price);

      const dropZoneH = Math.min(50, slotH - 90);
      const dropZone = this.add.rectangle(0, slotH / 2 - 30 - dropZoneH / 2, slotW - 16, dropZoneH, 0x2a2a4a, 0.5)
        .setStrokeStyle(1, 0x4fc3f7, 0.3);
      dropZone.setName('dropZone');
      container.add(dropZone);

      const dropLabel = this.add.text(0, slotH / 2 - 30 - dropZoneH / 2, '拖入', {
        fontSize: '10px', color: '#666688',
      }).setOrigin(0.5);
      container.add(dropLabel);

      container.setSize(slotW, slotH);
      container.setDepth(5);
      this.slotZones.set(slot.id, container);
      this.phaseContainer.add(container);
    }

    const sponsorAreaTop = h - 170;
    const sponsorAreaH = 140;
    const { cols: spCols, rows: spRows, width: spW, height: spH } = this.calcGridLayout(sponsors.length, usableW, sponsorAreaH, 140, 60, 10);
    const spTotalW = spCols * spW + (spCols - 1) * 10;
    const spStartX = (w - spTotalW) / 2 + spW / 2;
    const spTotalH = spRows * spH + (spRows - 1) * 10;
    const spStartY = sponsorAreaTop + (sponsorAreaH - spTotalH) / 2 + spH / 2;

    for (let i = 0; i < sponsors.length; i++) {
      const sp = sponsors[i];
      const col = i % spCols;
      const row = Math.floor(i / spCols);
      const x = spStartX + col * (spW + 10);
      const y = spStartY + row * (spH + 10);
      const container = this.add.container(x, y);
      container.setName(sp.id);

      this.sponsorStartPositions.set(sp.id, { x, y });

      const bg = this.add.rectangle(0, 0, spW, spH, 0x2a3a5e, 0.9)
        .setStrokeStyle(2, this.getTierColor(sp.tier));
      container.add(bg);

      const iconSize = Math.min(18, spH / 3);
      const tierIcon = this.add.image(-spW / 2 + 15 + iconSize / 2, -8, this.getTierKey(sp.tier))
        .setDisplaySize(iconSize, iconSize);
      container.add(tierIcon);

      const nameFontSize = Math.min(13, spW / 10);
      const name = this.add.text(0, -8, sp.name, {
        fontSize: `${nameFontSize}px`, color: '#ffffff', fontStyle: 'bold',
      }).setOrigin(0.5);
      container.add(name);

      const budget = this.add.text(0, 10, `预算: ¥${sp.budget}`, {
        fontSize: '10px', color: '#ffd54f',
      }).setOrigin(0.5);
      container.add(budget);

      const verify = this.add.text(0, 24, sp.requiresVerification ? '需核销' : '', {
        fontSize: '9px', color: '#ef5350',
      }).setOrigin(0.5);
      container.add(verify);

      container.setSize(spW, spH);
      container.setDepth(10);

      const matterBody = Matter.Bodies.rectangle(x, y, spW, spH, {
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
      this.phaseContainer.add(container);
    }

    const skipBtn = this.add.text(w / 2, h - 25, '跳过排期 →', {
      fontSize: '14px', color: '#aaaaaa',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    skipBtn.on('pointerdown', () => this.transitionToVerification());
    this.phaseContainer.add(skipBtn);
  }

  private calcGridLayout(
    count: number,
    maxW: number,
    maxH: number,
    minW: number,
    minH: number,
    gap: number
  ): { cols: number; rows: number; width: number; height: number } {
    let bestCols = 1;
    let bestRows = count;
    let bestItemW = minW;
    let bestItemH = minH;
    let bestUtilization = 0;

    for (let cols = 1; cols <= count; cols++) {
      const rows = Math.ceil(count / cols);
      const itemW = (maxW - (cols - 1) * gap) / cols;
      const itemH = (maxH - (rows - 1) * gap) / rows;
      const clampedW = Math.max(minW, itemW);
      const clampedH = Math.max(minH, itemH);
      const totalW = cols * clampedW + (cols - 1) * gap;
      const totalH = rows * clampedH + (rows - 1) * gap;

      if (totalW <= maxW && totalH <= maxH) {
        const utilization = (totalW * totalH) / (maxW * maxH);
        if (utilization > bestUtilization) {
          bestUtilization = utilization;
          bestCols = cols;
          bestRows = rows;
          bestItemW = clampedW;
          bestItemH = clampedH;
        }
      }
    }

    return { cols: bestCols, rows: bestRows, width: bestItemW, height: bestItemH };
  }

  private handleSponsorDrop(container: Phaser.GameObjects.Container): void {
    const sponsorId = container.name;
    let bestSlot: string | null = null;
    let bestDist = Infinity;

    this.slotZones.forEach((slotCont, slotId) => {
      const dropZone = slotCont.getByName('dropZone') as Phaser.GameObjects.Rectangle;
      const dropY = slotCont.y + (dropZone ? dropZone.y : 40);
      const dist = Phaser.Math.Distance.Between(
        container.x, container.y,
        slotCont.x, dropY
      );
      const threshold = Math.max(80, slotCont.width / 2 + container.width / 2 + 20);
      if (dist < threshold && dist < bestDist) {
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
        const dropZone = slotCont.getByName('dropZone') as Phaser.GameObjects.Rectangle;
        const targetY = slotCont.y + (dropZone ? dropZone.y : 40);
        container.setPosition(slotCont.x, targetY);

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
      const startPos = this.sponsorStartPositions.get(sponsorId);
      if (startPos) {
        if (this.settings.shouldAnimate()) {
          this.tweens.add({
            targets: container,
            x: startPos.x, y: startPos.y,
            duration: 300 * this.settings.getAnimDurationMultiplier(),
            ease: 'Back.easeOut',
          });
        } else {
          container.setPosition(startPos.x, startPos.y);
        }
        const body = container.getData('matterBody') as Matter.Body;
        if (body) Matter.Body.setPosition(body, { x: startPos.x, y: startPos.y });
      }
    }
  }

  private transitionToVerification(): void {
    this.phase = 'verification';
    this.draggedItem = null;

    this.draggableSponsors.clear();
    this.slotZones.clear();
    this.sponsorStartPositions.clear();

    Matter.Composite.clear(this.matterEngine.world, false);
    Matter.Engine.clear(this.matterEngine);

    this.phaseContainer.destroy(true);
    this.verifyTaskDisplay = null;
    this.verifyButtons = null;

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
    const cardY = h / 2 - 20;
    const cardW = 440;
    const cardH = 300;

    const cardBg = this.add.rectangle(cardX, cardY, cardW, cardH, COLORS.PANEL, 0.95)
      .setStrokeStyle(2, COLORS.PRIMARY, 0.6);
    this.verifyTaskDisplay.add(cardBg);

    const progressText = this.add.text(cardX, cardY - cardH / 2 + 18, `${this.verification.progress + 1} / ${this.verification.total}`, {
      fontSize: '12px', color: '#888888',
    }).setOrigin(0.5);
    this.verifyTaskDisplay.add(progressText);

    const leftX = cardX - cardW / 2 + 28;
    const rightX = cardX + cardW / 2 - 28;
    const topY = cardY - cardH / 2 + 48;

    const ruleColor = '#' + task.rule.color.toString(16).padStart(6, '0');
    this.verifyTaskDisplay.add(this.add.text(leftX, topY, `票种: ${task.rule.name}`, {
      fontSize: '20px', color: ruleColor, fontStyle: 'bold',
    }).setOrigin(0, 0.5));
    this.verifyTaskDisplay.add(this.add.text(rightX, topY, `数量: ${task.order.quantity}张`, {
      fontSize: '17px', color: '#ffffff',
    }).setOrigin(1, 0.5));

    const row2Y = topY + 34;
    this.verifyTaskDisplay.add(this.add.text(leftX, row2Y, `演出: ${task.slot.name} (${task.slot.time})`, {
      fontSize: '15px', color: '#ffffff',
    }).setOrigin(0, 0.5));

    const dividerY = row2Y + 22;
    this.verifyTaskDisplay.add(this.add.rectangle(cardX, dividerY, cardW - 56, 1, 0x333355, 0.6));

    const ruleY = dividerY + 18;
    const validSlotNames = task.rule.validSlots.map(sid => {
      const s = this.levelConfig.performanceSlots.find(ps => ps.id === sid);
      return s ? s.name : sid;
    }).join('、');
    this.verifyTaskDisplay.add(this.add.text(leftX, ruleY, `适用: ${validSlotNames}`, {
      fontSize: '13px', color: '#aaaaaa',
      wordWrap: { width: cardW - 56 },
    }).setOrigin(0, 0));

    const limitY = ruleY + 24;
    this.verifyTaskDisplay.add(this.add.text(leftX, limitY, `限购: ${task.rule.maxPerOrder}张/单`, {
      fontSize: '13px', color: '#ffb74d',
    }).setOrigin(0, 0.5));
    this.verifyTaskDisplay.add(this.add.text(rightX, limitY, `折扣: ${(task.rule.discountRate * 100).toFixed(0)}%`, {
      fontSize: '13px', color: '#4fc3f7',
    }).setOrigin(1, 0.5));

    const sponsorY = limitY + 26;
    if (task.rule.requiresSponsor) {
      this.verifyTaskDisplay.add(this.add.text(leftX, sponsorY, '需赞助商关联', {
        fontSize: '13px', color: '#f06292',
      }).setOrigin(0, 0.5));
      const sponsorName = task.sponsor ? task.sponsor.name : '无';
      const sponsorColor = task.sponsor ? '#ffffff' : '#ef5350';
      this.verifyTaskDisplay.add(this.add.text(rightX, sponsorY, sponsorName, {
        fontSize: '13px', color: sponsorColor, fontStyle: 'bold',
      }).setOrigin(1, 0.5));
    } else {
      this.verifyTaskDisplay.add(this.add.text(leftX, sponsorY, '无需赞助商关联', {
        fontSize: '13px', color: '#666688',
      }).setOrigin(0, 0.5));
    }

    const btnY = cardY + cardH / 2 - 45;

    const validBtn = this.add.container(cardX - 80, btnY);
    const validBg = this.add.rectangle(0, 0, 130, 48, COLORS.SUCCESS, 0.9);
    const validLabel = this.add.text(0, 0, '✓ 有效', {
      fontSize: '18px', color: '#1a1a2e', fontStyle: 'bold',
    }).setOrigin(0.5);
    validBtn.add([validBg, validLabel]);
    validBtn.setSize(130, 48);
    validBg.setInteractive({ useHandCursor: true });
    validBg.on('pointerdown', () => this.handleVerifyAnswer(true));
    this.verifyTaskDisplay.add(validBtn);

    const invalidBtn = this.add.container(cardX + 80, btnY);
    const invalidBg = this.add.rectangle(0, 0, 130, 48, COLORS.DANGER, 0.9);
    const invalidLabel = this.add.text(0, 0, '✗ 无效', {
      fontSize: '18px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5);
    invalidBtn.add([invalidBg, invalidLabel]);
    invalidBtn.setSize(130, 48);
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
      const reason = result.failReasons.length > 0 ? result.failReasons[0] : '规则不符';
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
