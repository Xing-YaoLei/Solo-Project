import { Scene, GameObjects, Input } from 'phaser';
import { GameManager } from '../managers/GameManager';
import { InputManager } from '../managers/InputManager';
import { COLORS, GAME_WIDTH, GAME_HEIGHT, ANIMATION_DURATIONS } from '../utils/constants';
import type { VerificationRecord, TicketType, Sponsor } from '../types/game';

export class VerificationScene extends Scene {
  private gameManager!: GameManager;
  private inputManager!: InputManager;
  private currentRecord!: VerificationRecord | null;
  private ticketTypes: TicketType[] = [];
  private sponsors: Sponsor[] = [];
  
  private recordCard!: GameObjects.Container;
  private scoreText!: GameObjects.Text;
  private progressText!: GameObjects.Text;
  private counterText!: GameObjects.Text;
  private progressFill!: GameObjects.Graphics;
  
  private passButton!: GameObjects.Container;
  private rejectButton!: GameObjects.Container;
  
  private isProcessing: boolean = false;
  private cardOriginalX!: number;
  private cardOriginalY!: number;
  
  private swipeStartX: number = 0;
  private isDragging: boolean = false;

  constructor() {
    super('VerificationScene');
  }

  create(): void {
    this.gameManager = GameManager.getInstance();
    this.inputManager = InputManager.getInstance();
    this.inputManager.init(this);

    const levelState = this.gameManager.getLevelState();
    if (!levelState) {
      this.scene.start('MainMenuScene');
      return;
    }

    this.ticketTypes = levelState.tickets;
    this.sponsors = levelState.sponsors;
    this.currentRecord = this.gameManager.getCurrentRecord();

    this.cameras.main.setBackgroundColor('#0a0a1a');
    this.cameras.main.setAlpha(0);
    this.cameras.main.fadeIn(ANIMATION_DURATIONS.normal);

    this.createBackground();
    this.createTopBar();
    this.createRecordCard();
    this.createActionButtons();
    this.createKeyboardHints();

    this.setupSwipeInput();

    this.input.keyboard?.on('keydown-ESC', () => this.pauseGame());
    this.input.keyboard?.on('keydown-A', () => this.handleReject());
    this.input.keyboard?.on('keydown-LEFT', () => this.handleReject());
    this.input.keyboard?.on('keydown-D', () => this.handlePass());
    this.input.keyboard?.on('keydown-RIGHT', () => this.handlePass());
    this.input.keyboard?.on('keydown-SPACE', () => this.handlePass());
    this.input.keyboard?.on('keydown-ENTER', () => this.handlePass());
  }

  update(): void {
    this.inputManager.update();
  }

  private createBackground(): void {
    const bgGradient = this.add.graphics();
    
    for (let i = 0; i < GAME_HEIGHT; i++) {
      const r = Math.floor(10 + i * 0.012);
      const g = Math.floor(10 + i * 0.012);
      const b = Math.floor(26 + i * 0.035);
      const color = Phaser.Display.Color.GetColor(r, g, b);
      bgGradient.fillStyle(color, 1);
      bgGradient.fillRect(0, i, GAME_WIDTH, 1);
    }

    const leftGradient = this.add.graphics();
    leftGradient.fillGradientStyle(0xd83f31, 0xd83f31, 0x0a0a1a, 0x0a0a1a, 0.08);
    leftGradient.fillRect(0, 0, GAME_WIDTH / 2, GAME_HEIGHT);

    const rightGradient = this.add.graphics();
    rightGradient.fillGradientStyle(0x219c90, 0x219c90, 0x0a0a1a, 0x0a0a1a, 0.08);
    rightGradient.fillRect(GAME_WIDTH / 2, 0, GAME_WIDTH / 2, GAME_HEIGHT);
  }

  private createTopBar(): void {
    const topBar = this.add.container(0, 0);

    const backBtn = this.add.text(30, 30, '← 暂停', {
      fontSize: '16px',
      color: COLORS.light,
      fontFamily: '"Segoe UI", Roboto, sans-serif',
    });
    backBtn.setInteractive({ useHandCursor: true });
    backBtn.on('pointerdown', () => this.pauseGame());
    topBar.add(backBtn);

    this.scoreText = this.add.text(GAME_WIDTH / 2, 30, '得分: 0', {
      fontSize: '24px',
      color: COLORS.secondary,
      fontFamily: '"Segoe UI", Roboto, sans-serif',
      fontStyle: 'bold',
    });
    this.scoreText.setOrigin(0.5, 0);
    topBar.add(this.scoreText);

    const levelState = this.gameManager.getLevelState();
    const totalRecords = levelState?.records.length || 0;
    const currentIndex = levelState?.currentRecordIndex || 0;

    this.progressText = this.add.text(GAME_WIDTH - 30, 35, `${currentIndex + 1} / ${totalRecords}`, {
      fontSize: '18px',
      color: '#8892b0',
      fontFamily: '"Segoe UI", Roboto, sans-serif',
    });
    this.progressText.setOrigin(1, 0);
    topBar.add(this.progressText);

    const progressBg = this.add.graphics();
    progressBg.fillStyle(0x333333, 0.5);
    progressBg.fillRect(GAME_WIDTH / 2 - 150, 70, 300, 6);
    topBar.add(progressBg);

    this.progressFill = this.add.graphics();
    const progress = currentIndex / Math.max(totalRecords - 1, 1);
    this.progressFill.fillStyle(Phaser.Display.Color.HexStringToColor(COLORS.accent).color, 1);
    this.progressFill.fillRect(GAME_WIDTH / 2 - 150, 70, 300 * progress, 6);
    topBar.add(this.progressFill);
    this.progressFill.setName('progressFill');

    const statsContainer = this.add.container(GAME_WIDTH - 30, 75);
    
    this.counterText = this.add.text(0, 0, '✓ 0  ✗ 0  ⚠ 0', {
      fontSize: '14px',
      color: '#666',
      fontFamily: '"Segoe UI", Roboto, sans-serif',
    });
    this.counterText.setOrigin(1, 0);
    statsContainer.add(this.counterText);

    topBar.setY(-10);
    this.tweens.add({
      targets: topBar,
      y: 0,
      alpha: { from: 0, to: 1 },
      duration: ANIMATION_DURATIONS.normal,
      ease: 'Cubic.easeOut',
    });
  }

  private createRecordCard(): void {
    this.cardOriginalX = GAME_WIDTH / 2;
    this.cardOriginalY = GAME_HEIGHT / 2 - 30;

    this.recordCard = this.add.container(this.cardOriginalX, this.cardOriginalY);
    this.recordCard.setSize(400, 420);

    const cardBg = this.add.graphics();
    const bgColor = Phaser.Display.Color.HexStringToColor('#16213E').color;
    cardBg.fillStyle(bgColor, 0.95);
    cardBg.fillRoundedRect(-200, -210, 400, 420, 20);

    cardBg.lineStyle(2, Phaser.Display.Color.HexStringToColor('#2a3a5c').color, 0.5);
    cardBg.strokeRoundedRect(-200, -210, 400, 420, 20);

    this.recordCard.add(cardBg);
    cardBg.setName('cardBg');

    this.updateCardContent();

    this.recordCard.setInteractive({ draggable: false, useHandCursor: true });
    this.recordCard.setAlpha(0);
    this.recordCard.setScale(0.8);

    this.tweens.add({
      targets: this.recordCard,
      alpha: 1,
      scale: 1,
      duration: ANIMATION_DURATIONS.slow,
      ease: 'Back.easeOut',
      delay: 200,
    });
  }

  private updateCardContent(): void {
    if (!this.currentRecord) return;

    const ticket = this.ticketTypes.find(t => t.id === this.currentRecord!.ticketType);
    const sponsor = this.sponsors.find(s => s.id === this.currentRecord!.sponsorId);

    const bg = this.recordCard.getByName('cardBg') as GameObjects.Graphics;

    this.recordCard.list.forEach(child => {
      if (child !== bg) {
        child.destroy();
      }
    });

    const ticketColor = ticket?.color || COLORS.primary;
    const ticketColorNum = Phaser.Display.Color.HexStringToColor(ticketColor).color;

    const headerBar = this.add.graphics();
    headerBar.fillStyle(ticketColorNum, 0.9);
    headerBar.fillRoundedRect(-200, -210, 400, 70, { tl: 20, tr: 20, bl: 0, br: 0 } as any);
    this.recordCard.add(headerBar);

    const ticketTypeText = this.add.text(0, -175, ticket?.name || '未知票种', {
      fontSize: '24px',
      color: COLORS.white,
      fontFamily: 'Georgia, serif',
      fontStyle: 'bold',
    });
    ticketTypeText.setOrigin(0.5);
    this.recordCard.add(ticketTypeText);

    const priceText = this.add.text(0, -150, `¥${ticket?.price || 0}`, {
      fontSize: '16px',
      color: 'rgba(255,255,255,0.8)',
      fontFamily: '"Segoe UI", Roboto, sans-serif',
    });
    priceText.setOrigin(0.5);
    this.recordCard.add(priceText);

    const nameLabel = this.add.text(-170, -100, '参会人', {
      fontSize: '13px',
      color: '#666',
      fontFamily: '"Segoe UI", Roboto, sans-serif',
    });
    this.recordCard.add(nameLabel);

    const nameText = this.add.text(-170, -75, this.currentRecord.attendeeName, {
      fontSize: '22px',
      color: COLORS.white,
      fontFamily: '"Segoe UI", Roboto, sans-serif',
      fontStyle: 'bold',
    });
    this.recordCard.add(nameText);

    const timeLabel = this.add.text(170, -100, '入场时间', {
      fontSize: '13px',
      color: '#666',
      fontFamily: '"Segoe UI", Roboto, sans-serif',
    });
    timeLabel.setOrigin(1, 0);
    this.recordCard.add(timeLabel);

    const timeText = this.add.text(170, -75, this.currentRecord.time, {
      fontSize: '20px',
      color: COLORS.light,
      fontFamily: '"SF Mono", Monaco, monospace',
      fontStyle: 'bold',
    });
    timeText.setOrigin(1, 0);
    this.recordCard.add(timeText);

    const divider = this.add.graphics();
    divider.lineStyle(1, 0x333333, 0.6);
    divider.beginPath();
    divider.moveTo(-170, -40);
    divider.lineTo(170, -40);
    divider.strokePath();
    this.recordCard.add(divider);

    if (sponsor) {
      const sponsorLabel = this.add.text(-170, -15, '赞助商', {
        fontSize: '13px',
        color: '#666',
        fontFamily: '"Segoe UI", Roboto, sans-serif',
      });
      this.recordCard.add(sponsorLabel);

      const sponsorName = this.add.text(-170, 10, sponsor.name, {
        fontSize: '18px',
        color: sponsor.color,
        fontFamily: '"Segoe UI", Roboto, sans-serif',
        fontStyle: 'bold',
      });
      this.recordCard.add(sponsorName);
    }

    const benefitsLabel = this.add.text(-170, 50, '核销权益', {
      fontSize: '13px',
      color: '#666',
      fontFamily: '"Segoe UI", Roboto, sans-serif',
    });
    this.recordCard.add(benefitsLabel);

    let benefitY = 75;
    const allBenefits = this.sponsors.flatMap(s => s.benefits);
    
    this.currentRecord.benefits.slice(0, 3).forEach(benefitId => {
      const benefit = allBenefits.find(b => b.id === benefitId);
      if (benefit) {
        const benefitBg = this.add.graphics();
        benefitBg.fillStyle(ticketColorNum, 0.15);
        benefitBg.fillRoundedRect(-170, benefitY - 14, 100, 28, 14);
        this.recordCard.add(benefitBg);

        const benefitText = this.add.text(-120, benefitY, benefit.name, {
          fontSize: '13px',
          color: ticketColor,
          fontFamily: '"Segoe UI", Roboto, sans-serif',
        });
        benefitText.setOrigin(0.5);
        this.recordCard.add(benefitText);

        benefitY += 35;
      }
    });

    const recordId = this.add.text(0, 180, `记录编号: ${this.currentRecord.id}`, {
      fontSize: '12px',
      color: '#444',
      fontFamily: '"SF Mono", Monaco, monospace',
    });
    recordId.setOrigin(0.5);
    this.recordCard.add(recordId);

    if (this.currentRecord.hasDispute) {
      const disputeBadge = this.add.graphics();
      disputeBadge.fillStyle(Phaser.Display.Color.HexStringToColor(COLORS.danger).color, 0.9);
      disputeBadge.fillRoundedRect(-200 + 20, -210 + 90, 80, 24, 12);
      this.recordCard.add(disputeBadge);

      const disputeText = this.add.text(-200 + 60, -210 + 102, '⚠ 待核实', {
        fontSize: '12px',
        color: COLORS.white,
        fontFamily: '"Segoe UI", Roboto, sans-serif',
        fontStyle: 'bold',
      });
      disputeText.setOrigin(0.5);
      this.recordCard.add(disputeText);
    }
  }

  private createActionButtons(): void {
    const buttonY = GAME_HEIGHT - 100;
    const buttonSize = 100;

    const rejectContainer = this.add.container(GAME_WIDTH / 2 - 120, buttonY);
    rejectContainer.setSize(buttonSize, buttonSize);

    const rejectBg = this.add.graphics();
    const rejectColor = Phaser.Display.Color.HexStringToColor(COLORS.danger).color;
    rejectBg.fillStyle(rejectColor, 0.9);
    rejectBg.fillCircle(0, 2, buttonSize / 2);
    rejectBg.fillStyle(0x000000, 0.2);
    rejectBg.fillCircle(0, 0, buttonSize / 2);
    rejectContainer.add(rejectBg);

    const rejectIcon = this.add.text(0, -5, '✗', {
      fontSize: '40px',
      color: COLORS.white,
      fontFamily: '"Segoe UI", Roboto, sans-serif',
      fontStyle: 'bold',
    });
    rejectIcon.setOrigin(0.5);
    rejectContainer.add(rejectIcon);

    const rejectLabel = this.add.text(0, buttonSize / 2 + 15, '拒绝', {
      fontSize: '14px',
      color: '#8892b0',
      fontFamily: '"Segoe UI", Roboto, sans-serif',
    });
    rejectLabel.setOrigin(0.5);
    rejectContainer.add(rejectLabel);

    rejectContainer.setInteractive({ useHandCursor: true });
    rejectContainer.on('pointerover', () => {
      this.tweens.add({
        targets: rejectContainer,
        scale: 1.1,
        duration: ANIMATION_DURATIONS.fast,
      });
    });
    rejectContainer.on('pointerout', () => {
      this.tweens.add({
        targets: rejectContainer,
        scale: 1,
        duration: ANIMATION_DURATIONS.fast,
      });
    });
    rejectContainer.on('pointerdown', () => this.handleReject());

    this.rejectButton = rejectContainer;

    const passContainer = this.add.container(GAME_WIDTH / 2 + 120, buttonY);
    passContainer.setSize(buttonSize, buttonSize);

    const passBg = this.add.graphics();
    const passColor = Phaser.Display.Color.HexStringToColor(COLORS.success).color;
    passBg.fillStyle(passColor, 0.9);
    passBg.fillCircle(0, 2, buttonSize / 2);
    passBg.fillStyle(0x000000, 0.2);
    passBg.fillCircle(0, 0, buttonSize / 2);
    passContainer.add(passBg);

    const passIcon = this.add.text(0, -5, '✓', {
      fontSize: '40px',
      color: COLORS.white,
      fontFamily: '"Segoe UI", Roboto, sans-serif',
      fontStyle: 'bold',
    });
    passIcon.setOrigin(0.5);
    passContainer.add(passIcon);

    const passLabel = this.add.text(0, buttonSize / 2 + 15, '通过', {
      fontSize: '14px',
      color: '#8892b0',
      fontFamily: '"Segoe UI", Roboto, sans-serif',
    });
    passLabel.setOrigin(0.5);
    passContainer.add(passLabel);

    passContainer.setInteractive({ useHandCursor: true });
    passContainer.on('pointerover', () => {
      this.tweens.add({
        targets: passContainer,
        scale: 1.1,
        duration: ANIMATION_DURATIONS.fast,
      });
    });
    passContainer.on('pointerout', () => {
      this.tweens.add({
        targets: passContainer,
        scale: 1,
        duration: ANIMATION_DURATIONS.fast,
      });
    });
    passContainer.on('pointerdown', () => this.handlePass());

    this.passButton = passContainer;

    [this.rejectButton, this.passButton].forEach((btn, i) => {
      btn.setAlpha(0);
      btn.setY(btn.y + 30);
      this.tweens.add({
        targets: btn,
        alpha: 1,
        y: btn.y - 30,
        duration: ANIMATION_DURATIONS.normal,
        delay: 400 + i * 100,
        ease: 'Back.easeOut',
      });
    });
  }

  private createKeyboardHints(): void {
    const hints = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT - 40);

    const hintText = this.add.text(0, 0, '← / A 拒绝    → / D 通过    空格/回车 快速通过', {
      fontSize: '12px',
      color: '#555',
      fontFamily: '"Segoe UI", Roboto, sans-serif',
    });
    hintText.setOrigin(0.5);
    hints.add(hintText);

    hints.setAlpha(0);
    this.tweens.add({
      targets: hints,
      alpha: 1,
      duration: ANIMATION_DURATIONS.slow,
      delay: 800,
    });
  }

  private setupSwipeInput(): void {
    this.input.on('pointerdown', (pointer: Input.Pointer) => {
      if (pointer.id !== 0) return;
      if (this.isProcessing) return;
      
      this.swipeStartX = pointer.x;
      this.isDragging = true;
    });

    this.input.on('pointermove', (pointer: Input.Pointer) => {
      if (!this.isDragging || pointer.id !== 0) return;
      if (this.isProcessing) return;

      const deltaX = pointer.x - this.swipeStartX;
      const maxDrag = 150;
      const clampedX = Phaser.Math.Clamp(deltaX, -maxDrag, maxDrag);

      this.recordCard.x = this.cardOriginalX + clampedX;
      
      const rotation = clampedX * 0.003;
      this.recordCard.rotation = rotation;

      const alpha = Math.min(1, Math.abs(clampedX) / 100);
      if (clampedX > 0) {
        this.passButton.setAlpha(0.5 + alpha * 0.5);
        this.passButton.setScale(1 + alpha * 0.1);
        this.rejectButton.setAlpha(1);
        this.rejectButton.setScale(1);
      } else {
        this.rejectButton.setAlpha(0.5 + alpha * 0.5);
        this.rejectButton.setScale(1 + alpha * 0.1);
        this.passButton.setAlpha(1);
        this.passButton.setScale(1);
      }
    });

    this.input.on('pointerup', (pointer: Input.Pointer) => {
      if (!this.isDragging || pointer.id !== 0) return;
      this.isDragging = false;
      if (this.isProcessing) return;

      const deltaX = pointer.x - this.swipeStartX;
      const threshold = 80;

      if (deltaX > threshold) {
        this.handlePass();
      } else if (deltaX < -threshold) {
        this.handleReject();
      } else {
        this.tweens.add({
          targets: this.recordCard,
          x: this.cardOriginalX,
          rotation: 0,
          duration: ANIMATION_DURATIONS.fast,
          ease: 'Back.easeOut',
        });

        this.tweens.add({
          targets: [this.passButton, this.rejectButton],
          alpha: 1,
          scale: 1,
          duration: ANIMATION_DURATIONS.fast,
        });
      }
    });
  }

  private handlePass(): void {
    if (this.isProcessing || !this.currentRecord) return;
    this.processVerification('pass');
  }

  private handleReject(): void {
    if (this.isProcessing || !this.currentRecord) return;
    this.processVerification('reject');
  }

  private processVerification(result: 'pass' | 'reject'): void {
    if (this.isProcessing || !this.currentRecord) return;
    this.isProcessing = true;

    const direction = result === 'pass' ? 1 : -1;
    const targetX = this.cardOriginalX + direction * (GAME_WIDTH / 2 + 300);

    this.tweens.add({
      targets: this.recordCard,
      x: targetX,
      rotation: direction * 0.3,
      alpha: 0,
      duration: ANIMATION_DURATIONS.normal,
      ease: 'Cubic.easeIn',
    });

    const verifyResult = this.gameManager.verifyRecord(result);

    this.showFeedback(verifyResult.correct, verifyResult.points, result);

    this.time.delayedCall(ANIMATION_DURATIONS.normal + 100, () => {
      if (verifyResult.hasDispute) {
        this.goToDispute();
      } else {
        this.advanceToNextRecord();
      }
    });
  }

  private showFeedback(correct: boolean, points: number, _action: 'pass' | 'reject'): void {
    const color = correct ? COLORS.success : COLORS.danger;
    const text = correct ? `+${points}` : `${points}`;
    const icon = correct ? '✓ 正确' : '✗ 错误';

    const feedback = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 80);

    const bg = this.add.graphics();
    bg.fillStyle(Phaser.Display.Color.HexStringToColor(color).color, 0.9);
    bg.fillRoundedRect(-80, -35, 160, 70, 16);
    feedback.add(bg);

    const iconText = this.add.text(0, -5, icon, {
      fontSize: '18px',
      color: COLORS.white,
      fontFamily: '"Segoe UI", Roboto, sans-serif',
      fontStyle: 'bold',
    });
    iconText.setOrigin(0.5);
    feedback.add(iconText);

    const pointsText = this.add.text(0, 20, text, {
      fontSize: '22px',
      color: COLORS.white,
      fontFamily: '"Segoe UI", Roboto, sans-serif',
      fontStyle: 'bold',
    });
    pointsText.setOrigin(0.5);
    feedback.add(pointsText);

    feedback.setAlpha(0);
    feedback.setScale(0.5);

    this.tweens.add({
      targets: feedback,
      alpha: 1,
      scale: 1,
      duration: ANIMATION_DURATIONS.fast,
      ease: 'Back.easeOut',
    });

    this.tweens.add({
      targets: feedback,
      y: feedback.y - 30,
      alpha: 0,
      duration: ANIMATION_DURATIONS.normal,
      delay: 300,
      ease: 'Cubic.easeIn',
      onComplete: () => feedback.destroy(),
    });

    const levelState = this.gameManager.getLevelState();
    if (levelState) {
      this.scoreText.setText(`得分: ${levelState.score}`);
      
      const totalRecords = levelState.records.length;
      const currentIndex = levelState.currentRecordIndex + 1;
      this.progressText.setText(`${Math.min(currentIndex, totalRecords)} / ${totalRecords}`);

      this.counterText.setText(`✓ ${levelState.correctCount}  ✗ ${levelState.wrongCount}  ⚠ ${levelState.disputeCount}`);

      if (this.progressFill) {
        this.progressFill.clear();
        const progress = Math.min(1, currentIndex / Math.max(totalRecords - 1, 1));
        this.progressFill.fillStyle(Phaser.Display.Color.HexStringToColor(COLORS.accent).color, 1);
        this.progressFill.fillRect(GAME_WIDTH / 2 - 150, 70, 300 * progress, 6);
      }
    }
  }

  private advanceToNextRecord(): void {
    const hasMore = this.gameManager.nextRecord();
    this.currentRecord = this.gameManager.getCurrentRecord();

    if (!hasMore || !this.currentRecord) {
      this.gameManager.completeLevel();
      this.cameras.main.fadeOut(ANIMATION_DURATIONS.normal, 0, 0, 0);
      this.time.delayedCall(ANIMATION_DURATIONS.normal, () => {
        this.scene.start('ScoringScene');
      });
      return;
    }

    this.recordCard.x = this.cardOriginalX - (GAME_WIDTH / 2 + 300);
    this.recordCard.rotation = -0.3;
    this.recordCard.setAlpha(0);
    this.recordCard.setScale(0.9);

    this.updateCardContent();

    this.tweens.add({
      targets: this.recordCard,
      x: this.cardOriginalX,
      rotation: 0,
      alpha: 1,
      scale: 1,
      duration: ANIMATION_DURATIONS.normal,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.isProcessing = false;
      },
    });

    this.tweens.add({
      targets: [this.passButton, this.rejectButton],
      alpha: 1,
      scale: 1,
      duration: ANIMATION_DURATIONS.fast,
    });
  }

  private goToDispute(): void {
    this.cameras.main.fadeOut(ANIMATION_DURATIONS.normal, 0, 0, 0);
    this.time.delayedCall(ANIMATION_DURATIONS.normal, () => {
      this.scene.start('DisputeScene');
    });
  }

  private pauseGame(): void {
    console.log('Pause game');
  }
}
