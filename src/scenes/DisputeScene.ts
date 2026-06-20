import { Scene } from 'phaser';
import { Button } from '../ui/Button';
import { GameManager } from '../managers/GameManager';
import { InputManager } from '../managers/InputManager';
import { COLORS, GAME_WIDTH, GAME_HEIGHT, ANIMATION_DURATIONS } from '../utils/constants';
import type { VerificationRecord, TicketType, Sponsor } from '../types/game';

export class DisputeScene extends Scene {
  private gameManager!: GameManager;
  private inputManager!: InputManager;
  private disputeRecord!: VerificationRecord;
  private ticketTypes: TicketType[] = [];
  private sponsors: Sponsor[] = [];

  constructor() {
    super('DisputeScene');
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
    
    const record = levelState.records[levelState.disputeRecordIndex];
    if (!record) {
      this.scene.start('VerificationScene');
      return;
    }
    this.disputeRecord = record;

    this.cameras.main.setBackgroundColor('#0a0a1a');
    this.cameras.main.setAlpha(0);
    this.cameras.main.fadeIn(ANIMATION_DURATIONS.normal);

    this.createBackground();
    this.createWarningHeader();
    this.createDisputeInfo();
    this.createRecordDetails();
    this.createActionButtons();

    this.input.keyboard?.on('keydown-ESC', () => this.handleUphold());
    this.input.keyboard?.on('keydown-ENTER', () => this.handleReverse());
    this.input.keyboard?.on('keydown-U', () => this.handleUphold());
    this.input.keyboard?.on('keydown-R', () => this.handleReverse());
  }

  update(): void {
    this.inputManager.update();
  }

  private createBackground(): void {
    const bgGradient = this.add.graphics();
    
    for (let i = 0; i < GAME_HEIGHT; i++) {
      const r = Math.floor(20 + i * 0.02);
      const g = Math.floor(10 + i * 0.01);
      const b = Math.floor(15 + i * 0.02);
      const color = Phaser.Display.Color.GetColor(r, g, b);
      bgGradient.fillStyle(color, 1);
      bgGradient.fillRect(0, i, GAME_WIDTH, 1);
    }

    const vignette = this.add.graphics();
    vignette.fillGradientStyle(0x000000, 0x000000, 0xd83f31, 0xd83f31, 0.1);
    vignette.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  }

  private createWarningHeader(): void {
    const header = this.add.container(GAME_WIDTH / 2, 80);

    const warningIcon = this.add.text(0, 0, '⚠', {
      fontSize: '64px',
      color: COLORS.warning,
    });
    warningIcon.setOrigin(0.5);
    header.add(warningIcon);

    const title = this.add.text(0, 55, '退票争议', {
      fontSize: '32px',
      color: COLORS.danger,
      fontFamily: 'Georgia, serif',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);
    header.add(title);

    const subtitle = this.add.text(0, 95, '该票据存在争议，请仔细核实后决定', {
      fontSize: '16px',
      color: '#8892b0',
      fontFamily: '"Segoe UI", Roboto, sans-serif',
    });
    subtitle.setOrigin(0.5);
    header.add(subtitle);

    header.setY(-20);
    header.setAlpha(0);
    this.tweens.add({
      targets: header,
      y: 80,
      alpha: 1,
      duration: ANIMATION_DURATIONS.normal,
      ease: 'Back.easeOut',
    });
  }

  private createDisputeInfo(): void {
    const container = this.add.container(GAME_WIDTH / 2, 230);
    const width = 480;
    const height = 100;

    const bg = this.add.graphics();
    bg.fillStyle(Phaser.Display.Color.HexStringToColor('#1a1a2e').color, 0.9);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 12);
    
    bg.lineStyle(2, Phaser.Display.Color.HexStringToColor(COLORS.danger).color, 0.6);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 12);
    container.add(bg);

    const reasonLabel = this.add.text(-width / 2 + 20, -height / 2 + 18, '争议原因', {
      fontSize: '14px',
      color: COLORS.danger,
      fontFamily: '"Segoe UI", Roboto, sans-serif',
      fontStyle: 'bold',
    });
    container.add(reasonLabel);

    const reasonText = this.add.text(-width / 2 + 20, -height / 2 + 45, this.disputeRecord.disputeReason || this.disputeRecord.invalidReason || '未知原因', {
      fontSize: '18px',
      color: COLORS.white,
      fontFamily: '"Segoe UI", Roboto, sans-serif',
    });
    container.add(reasonText);

    if (this.disputeRecord.invalidReason && this.disputeRecord.disputeReason !== this.disputeRecord.invalidReason) {
      const detailText = this.add.text(-width / 2 + 20, -height / 2 + 70, this.disputeRecord.invalidReason, {
        fontSize: '13px',
        color: COLORS.warning,
        fontFamily: '"Segoe UI", Roboto, sans-serif',
      });
      container.add(detailText);
    }

    const hintText = this.add.text(0, height / 2 - 18, '选择「推翻」将返回核销场景重新选择，不扣分不改效率', {
      fontSize: '12px',
      color: '#666',
      fontFamily: '"Segoe UI", Roboto, sans-serif',
    });
    hintText.setOrigin(0.5);
    container.add(hintText);

    container.setScale(0.9);
    container.setAlpha(0);
    this.tweens.add({
      targets: container,
      scale: 1,
      alpha: 1,
      duration: ANIMATION_DURATIONS.normal,
      delay: 200,
      ease: 'Back.easeOut',
    });
  }

  private createRecordDetails(): void {
    const ticket = this.ticketTypes.find(t => t.id === this.disputeRecord.ticketType);
    const sponsor = this.sponsors.find(s => s.id === this.disputeRecord.sponsorId);

    const container = this.add.container(GAME_WIDTH / 2, 400);
    const width = 480;
    const height = 200;

    const bg = this.add.graphics();
    bg.fillStyle(Phaser.Display.Color.HexStringToColor('#16213E').color, 0.9);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 12);
    container.add(bg);

    const headerBar = this.add.graphics();
    const ticketColor = ticket?.color || COLORS.primary;
    const ticketColorNum = Phaser.Display.Color.HexStringToColor(ticketColor).color;
    headerBar.fillStyle(ticketColorNum, 0.8);
    headerBar.fillRoundedRect(-width / 2, -height / 2, width, 50, { tl: 12, tr: 12, bl: 0, br: 0 } as any);
    container.add(headerBar);

    const ticketName = this.add.text(0, -height / 2 + 25, ticket?.name || '未知票种', {
      fontSize: '20px',
      color: COLORS.white,
      fontFamily: 'Georgia, serif',
      fontStyle: 'bold',
    });
    ticketName.setOrigin(0.5);
    container.add(ticketName);

    const nameLabel = this.add.text(-width / 2 + 25, -height / 2 + 70, '参会人', {
      fontSize: '13px',
      color: '#666',
      fontFamily: '"Segoe UI", Roboto, sans-serif',
    });
    container.add(nameLabel);

    const nameText = this.add.text(-width / 2 + 25, -height / 2 + 95, this.disputeRecord.attendeeName, {
      fontSize: '20px',
      color: COLORS.white,
      fontFamily: '"Segoe UI", Roboto, sans-serif',
      fontStyle: 'bold',
    });
    container.add(nameText);

    const timeLabel = this.add.text(width / 2 - 25, -height / 2 + 70, '入场时间', {
      fontSize: '13px',
      color: '#666',
      fontFamily: '"Segoe UI", Roboto, sans-serif',
    });
    timeLabel.setOrigin(1, 0);
    container.add(timeLabel);

    const timeText = this.add.text(width / 2 - 25, -height / 2 + 95, this.disputeRecord.time, {
      fontSize: '20px',
      color: COLORS.light,
      fontFamily: '"SF Mono", Monaco, monospace',
      fontStyle: 'bold',
    });
    timeText.setOrigin(1, 0);
    container.add(timeText);

    if (sponsor) {
      const sponsorLabel = this.add.text(-width / 2 + 25, -height / 2 + 135, '赞助商', {
        fontSize: '13px',
        color: '#666',
        fontFamily: '"Segoe UI", Roboto, sans-serif',
      });
      container.add(sponsorLabel);

      const sponsorText = this.add.text(-width / 2 + 25, -height / 2 + 158, sponsor.name, {
        fontSize: '16px',
        color: sponsor.color,
        fontFamily: '"Segoe UI", Roboto, sans-serif',
        fontStyle: 'bold',
      });
      container.add(sponsorText);
    }

    container.setAlpha(0);
    container.setY(420);
    this.tweens.add({
      targets: container,
      y: 400,
      alpha: 1,
      duration: ANIMATION_DURATIONS.normal,
      delay: 350,
      ease: 'Cubic.easeOut',
    });
  }

  private createActionButtons(): void {
    const buttonY = GAME_HEIGHT - 90;

    new Button(this, {
      x: GAME_WIDTH / 2 - 130,
      y: buttonY,
      width: 220,
      height: 60,
      text: '维持原判 (U)',
      backgroundColor: COLORS.danger,
      hoverColor: '#c0392b',
      textColor: COLORS.white,
      fontSize: 18,
      radius: 30,
      onClick: () => this.handleUphold(),
    });

    new Button(this, {
      x: GAME_WIDTH / 2 + 130,
      y: buttonY,
      width: 220,
      height: 60,
      text: '推翻重选 (R)',
      backgroundColor: COLORS.accent,
      hoverColor: '#1ea896',
      textColor: COLORS.white,
      fontSize: 18,
      radius: 30,
      onClick: () => this.handleReverse(),
    });

    const hint = this.add.text(GAME_WIDTH / 2, buttonY + 50, '维持原判得分更高，推翻重选需要返回重新处理', {
      fontSize: '13px',
      color: '#555',
      fontFamily: '"Segoe UI", Roboto, sans-serif',
    });
    hint.setOrigin(0.5);
  }

  private handleUphold(): void {
    const result = this.gameManager.resolveDispute('uphold');
    this.showFeedback(true, result.points);

    this.time.delayedCall(600, () => {
      this.cameras.main.fadeOut(ANIMATION_DURATIONS.normal, 0, 0, 0);
      this.time.delayedCall(ANIMATION_DURATIONS.normal, () => {
        const levelState = this.gameManager.getLevelState();
        if (levelState && levelState.currentRecordIndex >= levelState.records.length - 1) {
          this.gameManager.nextRecord();
          this.gameManager.completeLevel();
          this.scene.start('ScoringScene');
        } else {
          this.gameManager.nextRecord();
          this.scene.start('VerificationScene');
        }
      });
    });
  }

  private handleReverse(): void {
    this.gameManager.resolveDispute('reverse');

    this.time.delayedCall(300, () => {
      this.cameras.main.fadeOut(ANIMATION_DURATIONS.normal, 0, 0, 0);
      this.time.delayedCall(ANIMATION_DURATIONS.normal, () => {
        this.scene.start('VerificationScene');
      });
    });
  }

  private showFeedback(correct: boolean, points: number): void {
    const color = correct ? COLORS.success : COLORS.warning;
    const text = correct ? `+${points} 分` : `${points} 分`;
    const label = correct ? '维持原判' : '推翻重选';

    const feedback = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2);

    const bg = this.add.graphics();
    bg.fillStyle(Phaser.Display.Color.HexStringToColor(color).color, 0.95);
    bg.fillRoundedRect(-100, -50, 200, 100, 20);
    feedback.add(bg);

    const labelText = this.add.text(0, -15, label, {
      fontSize: '20px',
      color: COLORS.white,
      fontFamily: '"Segoe UI", Roboto, sans-serif',
      fontStyle: 'bold',
    });
    labelText.setOrigin(0.5);
    feedback.add(labelText);

    const pointsText = this.add.text(0, 20, text, {
      fontSize: '28px',
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

    this.cameras.main.shake(200, 0.005);
  }
}
