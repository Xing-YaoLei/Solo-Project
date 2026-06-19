import Phaser from 'phaser';
import { GAME_CONFIG } from '@/config/constants';
import { InputManager } from '@/game/systems/InputManager';
import { getLeaderboardByRework, getLeaderboardByTime } from '@/utils/Storage';
import { formatTime } from '@/utils/QuoteCalculator';
import type { LeaderboardEntry } from '@/types';

export class LeaderboardScene extends Phaser.Scene {
  private inputManager!: InputManager;
  private currentTab: 'rework' | 'time' = 'rework';
  private reworkTabBg!: Phaser.GameObjects.Rectangle;
  private reworkTabText!: Phaser.GameObjects.Text;
  private timeTabBg!: Phaser.GameObjects.Rectangle;
  private timeTabText!: Phaser.GameObjects.Text;
  private entriesContainer!: Phaser.GameObjects.Container;

  constructor() {
    super('Leaderboard');
  }

  public create(): void {
    this.cameras.main.setBackgroundColor(GAME_CONFIG.COLORS.BG);
    this.inputManager = new InputManager(this);

    this.createHeader();
    this.createTabs();
    this.entriesContainer = this.add.container(0, 0);
    this.renderLeaderboard();
    this.setupKeyboardControls();
  }

  private createHeader(): void {
    const { width } = this.scale;

    const backBtn = this.add.text(30, 35, '← 返回菜单', {
      fontFamily: 'Noto Sans SC, sans-serif',
      fontSize: '16px',
      color: '#94A3B8'
    }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });
    backBtn.on('pointerdown', () => this.scene.start('Menu'));

    this.add.text(width / 2, 35, '🏆 排行榜', {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '28px',
      fontStyle: 'bold',
      color: '#F1F5F9'
    }).setOrigin(0.5);
  }

  private createTabs(): void {
    const { width } = this.scale;
    const y = 90;

    this.reworkTabBg = this.add.rectangle(width / 2 - 130, y, 240, 50, GAME_CONFIG.COLORS.ACCENT, 1);
    this.reworkTabText = this.add.text(width / 2 - 130, y, '返修率排行', {
      fontFamily: 'Noto Sans SC, sans-serif',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#FFFFFF'
    }).setOrigin(0.5);

    this.reworkTabBg.setInteractive({ useHandCursor: true });
    this.reworkTabBg.on('pointerdown', () => this.switchTab('rework'));
    this.reworkTabText.setInteractive({ useHandCursor: true });
    this.reworkTabText.on('pointerdown', () => this.switchTab('rework'));

    this.timeTabBg = this.add.rectangle(width / 2 + 130, y, 240, 50, GAME_CONFIG.COLORS.BG_LIGHT, 1)
      .setStrokeStyle(1, GAME_CONFIG.COLORS.METAL, 0.5);
    this.timeTabText = this.add.text(width / 2 + 130, y, '完成时间排行', {
      fontFamily: 'Noto Sans SC, sans-serif',
      fontSize: '18px',
      fontStyle: '600',
      color: '#94A3B8'
    }).setOrigin(0.5);

    this.timeTabBg.setInteractive({ useHandCursor: true });
    this.timeTabBg.on('pointerdown', () => this.switchTab('time'));
    this.timeTabText.setInteractive({ useHandCursor: true });
    this.timeTabText.on('pointerdown', () => this.switchTab('time'));
  }

  private renderLeaderboard(): void {
    const data = this.currentTab === 'rework'
      ? getLeaderboardByRework()
      : getLeaderboardByTime();

    this.entriesContainer.removeAll(true);

    const { width, height } = this.scale;
    const startY = 160;
    const itemHeight = 72;

    data.slice(0, 8).forEach((entry, index) => {
      this.createEntry(entry, index, width, startY + index * itemHeight);
    });

    if (data.length === 0) {
      const emptyText = this.add.text(width / 2, height / 2, '暂无数据，快去游戏吧！', {
        fontFamily: 'Noto Sans SC, sans-serif',
        fontSize: '20px',
        color: '#6B7280'
      }).setOrigin(0.5);
      this.entriesContainer.add(emptyText);
    }
  }

  private createEntry(entry: LeaderboardEntry, index: number, width: number, y: number): void {
    const container = this.add.container(0, y);
    const isTop3 = index < 3;
    const medals = ['🥇', '🥈', '🥉'];
    const itemWidth = width - 120;

    const bgColor = isTop3 ? GAME_CONFIG.COLORS.PRIMARY : GAME_CONFIG.COLORS.BG;
    const bgAlpha = isTop3 ? 0.5 : 0.4;

    const bg = this.add.rectangle(width / 2, 30, itemWidth, 60, bgColor, bgAlpha);
    if (isTop3) {
      bg.setStrokeStyle(1, GAME_CONFIG.COLORS.ACCENT, 0.3);
    }

    const rankDisplay = isTop3 ? medals[index] : `#${index + 1}`;
    const rankColor = isTop3 ? '#E85D04' : '#6B7280';
    const rankFontSize = isTop3 ? '28px' : '20px';

    const rankText = this.add.text(80, 30, rankDisplay, {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: rankFontSize,
      fontStyle: 'bold',
      color: rankColor
    }).setOrigin(0, 0.5);

    const nameText = this.add.text(170, 30, entry.playerName, {
      fontFamily: 'Noto Sans SC, sans-serif',
      fontSize: '18px',
      fontStyle: isTop3 ? 'bold' : 'normal',
      color: '#F1F5F9'
    }).setOrigin(0, 0.5);

    let valueLabel: string;
    let valueColor: string;

    if (this.currentTab === 'rework') {
      valueLabel = `返修率: ${entry.reworkRate.toFixed(1)}%`;
      valueColor = entry.reworkRate < 5 ? '#10B981' : entry.reworkRate < 10 ? '#F59E0B' : '#EF4444';
    } else {
      valueLabel = `平均用时: ${formatTime(entry.avgCompletionTime)}`;
      valueColor = entry.avgCompletionTime < 60 ? '#10B981' : entry.avgCompletionTime < 120 ? '#F59E0B' : '#EF4444';
    }

    const valueText = this.add.text(width - 280, 30, valueLabel, {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '18px',
      fontStyle: 'bold',
      color: valueColor
    }).setOrigin(0, 0.5);

    const scoreText = this.add.text(width - 130, 30, `总分: ${entry.totalScore}`, {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '16px',
      color: '#94A3B8'
    }).setOrigin(0, 0.5);

    const gamesText = this.add.text(width - 65, 30, `(${entry.gamesPlayed}局)`, {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '12px',
      color: '#6B7280'
    }).setOrigin(1, 0.5);

    container.add([bg, rankText, nameText, valueText, scoreText, gamesText]);
    this.entriesContainer.add(container);

    container.setAlpha(0);
    container.setY(y + 20);
    this.tweens.add({
      targets: container,
      alpha: 1,
      y: y,
      delay: index * 50,
      duration: 300,
      ease: 'Sine.easeOut'
    });
  }

  private switchTab(tab: 'rework' | 'time'): void {
    this.currentTab = tab;

    if (tab === 'rework') {
      this.reworkTabBg.setFillStyle(GAME_CONFIG.COLORS.ACCENT, 1);
      this.reworkTabText.setColor('#FFFFFF');
      this.reworkTabText.setFontStyle('bold');
      this.timeTabBg.setFillStyle(GAME_CONFIG.COLORS.BG_LIGHT, 1);
      this.timeTabBg.setStrokeStyle(1, GAME_CONFIG.COLORS.METAL, 0.5);
      this.timeTabText.setColor('#94A3B8');
      this.timeTabText.setFontStyle('normal');
    } else {
      this.timeTabBg.setFillStyle(GAME_CONFIG.COLORS.ACCENT, 1);
      this.timeTabText.setColor('#FFFFFF');
      this.timeTabText.setFontStyle('bold');
      this.reworkTabBg.setFillStyle(GAME_CONFIG.COLORS.BG_LIGHT, 1);
      this.reworkTabBg.setStrokeStyle(1, GAME_CONFIG.COLORS.METAL, 0.5);
      this.reworkTabText.setColor('#94A3B8');
      this.reworkTabText.setFontStyle('normal');
    }

    this.renderLeaderboard();
  }

  private setupKeyboardControls(): void {
    this.inputManager.onKeys(['ArrowLeft', 'a', 'A'], () => this.switchTab('rework'));
    this.inputManager.onKeys(['ArrowRight', 'd', 'D'], () => this.switchTab('time'));
    this.inputManager.onKey('Escape', () => this.scene.start('Menu'));
  }
}
