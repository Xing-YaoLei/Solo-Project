import Phaser from 'phaser';
import { COLORS } from '../config/gameConfig';
import { AudioManager } from '../managers/AudioManager';
import { GameStateManager } from '../managers/GameStateManager';
import type { LevelRecord, GameStats } from '../types';

export class ReviewScene extends Phaser.Scene {
  private audioManager: AudioManager;
  private stateManager: GameStateManager;
  private fromGame: boolean = false;

  constructor() {
    super('ReviewScene');
    this.audioManager = AudioManager.getInstance();
    this.stateManager = GameStateManager.getInstance();
  }

  init(data: { fromGame?: boolean }): void {
    this.fromGame = data.fromGame || false;
  }

  create(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    this.add.rectangle(width / 2, height / 2, width, height, COLORS.background);

    const lastStats = this.stateManager.getLastGameStats();
    const records = this.stateManager.getAllRecords();

    if (this.fromGame && lastStats) {
      this.createGameResultView(width, height, lastStats);
    } else {
      this.createRecordsView(width, height, records);
    }
  }

  private createGameResultView(width: number, height: number, stats: GameStats): void {
    this.add.text(width / 2, 60, '结算报告', {
      fontSize: '32px',
      fontWeight: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);

    const level = this.stateManager.getCurrentLevel();
    if (level) {
      this.add.text(width / 2, 100, `${level.name} - ${level.difficulty === 'easy' ? '简单' : level.difficulty === 'normal' ? '中等' : '困难'}`, {
        fontSize: '18px',
        color: '#a0a0a0'
      }).setOrigin(0.5);
    }

    const panelY = height / 2 - 20;
    const panelWidth = 500;
    const panelHeight = 320;

    this.add.rectangle(width / 2, panelY, panelWidth, panelHeight, COLORS.cardBg)
      .setStrokeStyle(2, COLORS.cardBorder, 1);

    const scoreDisplay = this.add.text(width / 2, panelY - 110, stats.score.toString(), {
      fontSize: '64px',
      fontWeight: 'bold',
      color: '#' + COLORS.gold.toString(16).padStart(6, '0')
    }).setOrigin(0.5);

    this.add.text(width / 2, panelY - 60, '总得分', {
      fontSize: '18px',
      color: '#a0a0a0'
    }).setOrigin(0.5);

    const statsY = panelY - 10;
    const statGap = 60;

    this.createStatItem(width / 2 - 120, statsY, '正确', stats.correctCount, COLORS.success);
    this.createStatItem(width / 2 + 120, statsY, '错误', stats.wrongCount, COLORS.danger);
    this.createStatItem(width / 2 - 120, statsY + statGap, '最高连击', stats.maxCombo, COLORS.gold);
    
    const accuracy = stats.totalBills > 0 
      ? Math.round((stats.correctCount / stats.totalBills) * 100) 
      : 0;
    this.createStatItem(width / 2 + 120, statsY + statGap, '正确率', `${accuracy}%`, COLORS.primary);

    const avgTime = stats.totalBills > 0 
      ? Math.round(stats.avgResponseTime / 100) / 10 
      : 0;
    this.add.text(width / 2, statsY + statGap * 2, `平均响应: ${avgTime}秒/单`, {
      fontSize: '16px',
      color: '#888888'
    }).setOrigin(0.5);

    const record = this.stateManager.getLevelRecord(stats.levelId);
    if (record && record.bestScore === stats.score && stats.score > 0) {
      const newRecordBadge = this.add.text(width / 2 + 180, panelY - 130, '🎉 新纪录!', {
        fontSize: '20px',
        fontWeight: 'bold',
        color: '#' + COLORS.warning.toString(16).padStart(6, '0')
      }).setOrigin(0.5);
      newRecordBadge.setAngle(-10);

      this.tweens.add({
        targets: newRecordBadge,
        scale: 1.1,
        duration: 300,
        yoyo: true,
        repeat: -1
      });
    }

    const btnY = height - 80;
    const btnGap = 20;

    const retryBtn = this.add.rectangle(width / 2 - 110 - btnGap / 2, btnY, 200, 50, COLORS.primary)
      .setStrokeStyle(2, 0xffffff, 0.3)
      .setInteractive({ useHandCursor: true });

    this.add.text(width / 2 - 110 - btnGap / 2, btnY, '再来一局', {
      fontSize: '18px',
      fontWeight: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);

    const recordsBtn = this.add.rectangle(width / 2 + 110 + btnGap / 2, btnY, 200, 50, COLORS.success)
      .setStrokeStyle(2, 0xffffff, 0.3)
      .setInteractive({ useHandCursor: true });

    this.add.text(width / 2 + 110 + btnGap / 2, btnY, '查看全部记录', {
      fontSize: '18px',
      fontWeight: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);

    retryBtn.on('pointerover', () => retryBtn.setScale(1.05));
    retryBtn.on('pointerout', () => retryBtn.setScale(1));
    recordsBtn.on('pointerover', () => recordsBtn.setScale(1.05));
    recordsBtn.on('pointerout', () => recordsBtn.setScale(1));

    retryBtn.on('pointerdown', () => {
      this.audioManager.playClick();
      this.audioManager.vibrate(30);
      this.scene.start('GameScene');
    });

    recordsBtn.on('pointerdown', () => {
      this.audioManager.playClick();
      this.fromGame = false;
      this.createRecordsView(width, height, this.stateManager.getAllRecords());
    });

    const backBtn = this.add.text(40, 40, '← 返回主菜单', {
      fontSize: '18px',
      color: '#a0a0a0'
    }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });

    backBtn.on('pointerdown', () => {
      this.audioManager.playClick();
      this.scene.start('MainMenuScene');
    });

    scoreDisplay.setScale(0);
    this.tweens.add({
      targets: scoreDisplay,
      scale: 1,
      duration: 600,
      ease: 'Back.easeOut',
      delay: 200
    });
  }

  private createStatItem(x: number, y: number, label: string, value: number | string, color: number): void {
    const valueText = this.add.text(x, y, value.toString(), {
      fontSize: '28px',
      fontWeight: 'bold',
      color: '#' + color.toString(16).padStart(6, '0')
    }).setOrigin(0.5);

    this.add.text(x, y + 25, label, {
      fontSize: '14px',
      color: '#888888'
    }).setOrigin(0.5);
  }

  private createRecordsView(width: number, height: number, records: LevelRecord[]): void {
    this.add.text(width / 2, 60, '复盘记录', {
      fontSize: '32px',
      fontWeight: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);

    this.add.text(width / 2, 95, '按回款周期对比各关卡表现', {
      fontSize: '14px',
      color: '#888888'
    }).setOrigin(0.5);

    const backBtn = this.add.text(40, 40, '← 返回', {
      fontSize: '18px',
      color: '#a0a0a0'
    }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });

    backBtn.on('pointerdown', () => {
      this.audioManager.playClick();
      if (this.fromGame) {
        this.fromGame = false;
        const lastStats = this.stateManager.getLastGameStats();
        if (lastStats) {
          this.createGameResultView(width, height, lastStats);
          return;
        }
      }
      this.scene.start('MainMenuScene');
    });

    if (records.length === 0) {
      this.add.text(width / 2, height / 2, '暂无记录，快去挑战吧！', {
        fontSize: '22px',
        color: '#666666'
      }).setOrigin(0.5);

      const startBtn = this.add.rectangle(width / 2, height / 2 + 60, 200, 50, COLORS.primary)
        .setStrokeStyle(2, 0xffffff, 0.3)
        .setInteractive({ useHandCursor: true });

      this.add.text(width / 2, height / 2 + 60, '开始游戏', {
        fontSize: '18px',
        fontWeight: 'bold',
        color: '#ffffff'
      }).setOrigin(0.5);

      startBtn.on('pointerdown', () => {
        this.audioManager.playClick();
        this.scene.start('LevelSelectScene');
      });
      return;
    }

    const sortedRecords = [...records].sort((a, b) => a.payoutCycle - b.payoutCycle);

    const cardWidth = 220;
    const cardHeight = 300;
    const startX = width / 2 - (cardWidth + 30) * (sortedRecords.length - 1) / 2;
    const cardY = height / 2 + 20;

    sortedRecords.forEach((record, index) => {
      const x = startX + index * (cardWidth + 30);
      this.createRecordCard(x, cardY, record, cardWidth, cardHeight);
    });

    const compareTip = this.add.text(width / 2, height - 50, '💡 回款周期越短，资金周转越快，经营效率越高', {
      fontSize: '14px',
      color: '#666666'
    }).setOrigin(0.5);
  }

  private createRecordCard(x: number, y: number, record: LevelRecord, width: number, height: number): void {
    const card = this.add.rectangle(x, y, width, height, COLORS.cardBg)
      .setStrokeStyle(2, COLORS.cardBorder, 1);

    const levelName = this.add.text(x, y - height / 2 + 35, record.levelName, {
      fontSize: '20px',
      fontWeight: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);

    const cycleBadge = this.add.rectangle(x, y - height / 2 + 70, 100, 28, COLORS.gold, 0.2)
      .setStrokeStyle(1, COLORS.gold, 0.5);

    this.add.text(x, y - height / 2 + 70, `${record.payoutCycle}天回款`, {
      fontSize: '14px',
      fontWeight: 'bold',
      color: '#' + COLORS.gold.toString(16).padStart(6, '0')
    }).setOrigin(0.5);

    const divider = this.add.rectangle(x, y - height / 2 + 95, width - 30, 1, COLORS.cardBorder, 0.5);

    const scoreLabel = this.add.text(x, y - height / 2 + 125, '最高得分', {
      fontSize: '13px',
      color: '#888888'
    }).setOrigin(0.5);

    const scoreValue = this.add.text(x, y - height / 2 + 155, record.bestScore.toString(), {
      fontSize: '32px',
      fontWeight: 'bold',
      color: '#' + COLORS.primary.toString(16).padStart(6, '0')
    }).setOrigin(0.5);

    const comboLabel = this.add.text(x, y - height / 2 + 190, '最高连击', {
      fontSize: '13px',
      color: '#888888'
    }).setOrigin(0.5);

    const comboValue = this.add.text(x, y - height / 2 + 215, record.bestCombo.toString(), {
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#' + COLORS.gold.toString(16).padStart(6, '0')
    }).setOrigin(0.5);

    const accuracyLabel = this.add.text(x, y - height / 2 + 245, '正确率', {
      fontSize: '13px',
      color: '#888888'
    }).setOrigin(0.5);

    const accuracyValue = this.add.text(x, y - height / 2 + 270, `${Math.round(record.accuracy * 100)}%`, {
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#' + COLORS.success.toString(16).padStart(6, '0')
    }).setOrigin(0.5);

    const playCount = this.add.text(x, y + height / 2 - 20, `挑战次数: ${record.playCount}`, {
      fontSize: '12px',
      color: '#666666'
    }).setOrigin(0.5);

    const challengeBtn = this.add.rectangle(x, y + height / 2 - 55, 140, 38, COLORS.primary, 0.8)
      .setStrokeStyle(2, 0xffffff, 0.2)
      .setInteractive({ useHandCursor: true });

    this.add.text(x, y + height / 2 - 55, '再次挑战', {
      fontSize: '15px',
      fontWeight: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);

    challengeBtn.on('pointerover', () => challengeBtn.setScale(1.05));
    challengeBtn.on('pointerout', () => challengeBtn.setScale(1));

    challengeBtn.on('pointerdown', () => {
      this.audioManager.playClick();
      this.audioManager.vibrate(30);
      const level = this.stateManager.getLevelById(record.levelId);
      if (level) {
        this.stateManager.setCurrentLevel(level);
        this.scene.start('GameScene');
      }
    });
  }
}
