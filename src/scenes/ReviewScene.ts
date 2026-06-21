import Phaser from 'phaser';
import { COLORS } from '../config/gameConfig';
import { AudioManager } from '../managers/AudioManager';
import { GameStateManager } from '../managers/GameStateManager';
import type { LevelRecord, GameStats } from '../types';

export class ReviewScene extends Phaser.Scene {
  private audioManager: AudioManager;
  private stateManager: GameStateManager;
  private fromGame: boolean = false;

  private rootContainer: Phaser.GameObjects.Container | null = null;
  private staticHeader: Phaser.GameObjects.Container | null = null;

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
    this.createStaticHeader();

    if (this.fromGame) {
      this.showGameResultView();
    } else {
      this.showRecordsView();
    }
  }

  private clearContent(): void {
    if (this.rootContainer) {
      this.rootContainer.destroy();
      this.rootContainer = null;
    }
  }

  private createStaticHeader(): void {
    const width = this.cameras.main.width;

    this.staticHeader = this.add.container(0, 0);

    const title = this.add.text(width / 2, 45, '复盘中心', {
      fontSize: '28px',
      fontWeight: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);

    const backBtn = this.add.text(40, 40, '← 返回主菜单', {
      fontSize: '16px',
      color: '#a0a0a0'
    }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });

    backBtn.on('pointerdown', () => {
      this.audioManager.playClick();
      this.scene.start('MainMenuScene');
    });

    this.staticHeader.add([title, backBtn]);
  }

  private showGameResultView(): void {
    this.clearContent();
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const lastStats = this.stateManager.getLastGameStats();

    if (!lastStats) {
      this.showRecordsView();
      return;
    }

    this.rootContainer = this.add.container(0, 0);

    const viewTitle = this.add.text(width / 2, 85, '单局结算报告', {
      fontSize: '16px',
      color: '#' + COLORS.primary.toString(16).padStart(6, '0')
    }).setOrigin(0.5);

    const level = this.stateManager.getCurrentLevel();
    let levelInfoText = '';
    if (level) {
      const difficultyLabel = level.difficulty === 'easy' ? '简单' : level.difficulty === 'normal' ? '中等' : '困难';
      levelInfoText = `${level.name} · ${difficultyLabel} · 回款周期${level.payoutCycle}天`;
    }
    const levelInfo = this.add.text(width / 2, 110, levelInfoText, {
      fontSize: '14px',
      color: '#888888'
    }).setOrigin(0.5);

    this.rootContainer.add([viewTitle, levelInfo]);

    const panelY = 160 + 175;
    const panelWidth = 560;
    const panelHeight = 350;

    const panelBg = this.add.rectangle(width / 2, panelY, panelWidth, panelHeight, COLORS.cardBg)
      .setStrokeStyle(2, COLORS.cardBorder, 1);
    this.rootContainer.add(panelBg);

    const scoreDisplay = this.add.text(width / 2, panelY - 130, lastStats.score.toString(), {
      fontSize: '64px',
      fontWeight: 'bold',
      color: '#' + COLORS.gold.toString(16).padStart(6, '0')
    }).setOrigin(0.5);

    const scoreLabel = this.add.text(width / 2, panelY - 75, '总得分', {
      fontSize: '16px',
      color: '#a0a0a0'
    }).setOrigin(0.5);

    this.rootContainer.add([scoreDisplay, scoreLabel]);

    const statsY = panelY - 25;
    const statGap = 70;
    const stats = [
      { label: '正确', value: lastStats.correctCount, color: COLORS.success },
      { label: '错误', value: lastStats.wrongCount, color: COLORS.danger },
      { label: '最高连击', value: lastStats.maxCombo, color: COLORS.gold }
    ];

    const accuracy = lastStats.totalBills > 0
      ? Math.round((lastStats.correctCount / lastStats.totalBills) * 100)
      : 0;
    const avgTime = lastStats.totalBills > 0
      ? Math.round(lastStats.avgResponseTime / 100) / 10
      : 0;

    stats.forEach((s, i) => {
      const sx = width / 2 - (stats.length - 1) * statGap / 2 + i * statGap;
      const val = this.add.text(sx, statsY, s.value.toString(), {
        fontSize: '28px',
        fontWeight: 'bold',
        color: '#' + s.color.toString(16).padStart(6, '0')
      }).setOrigin(0.5);
      const lbl = this.add.text(sx, statsY + 28, s.label, {
        fontSize: '13px',
        color: '#888888'
      }).setOrigin(0.5);
      this.rootContainer!.add([val, lbl]);
    });

    const acc = this.add.text(width / 2 - 80, statsY + 75, `正确率 ${accuracy}%`, {
      fontSize: '15px',
      color: '#' + COLORS.primary.toString(16).padStart(6, '0')
    }).setOrigin(0.5);
    const avg = this.add.text(width / 2 + 80, statsY + 75, `平均响应 ${avgTime}s/单`, {
      fontSize: '15px',
      color: '#888888'
    }).setOrigin(0.5);
    this.rootContainer.add([acc, avg]);

    const record = this.stateManager.getLevelRecord(lastStats.levelId);
    if (record && record.bestScore === lastStats.score && lastStats.score > 0) {
      const badge = this.add.text(width / 2 + 200, panelY - 150, '🎉 新纪录!', {
        fontSize: '20px',
        fontWeight: 'bold',
        color: '#' + COLORS.warning.toString(16).padStart(6, '0')
      }).setOrigin(0.5).setAngle(-10);
      this.rootContainer.add(badge);
      this.tweens.add({
        targets: badge,
        scale: 1.1,
        duration: 300,
        yoyo: true,
        repeat: -1
      });
    }

    const btnY = panelY + panelHeight / 2 + 50;
    const btnGap = 20;

    const retryBtn = this.add.rectangle(width / 2 - 115 - btnGap / 2, btnY, 210, 50, COLORS.primary)
      .setStrokeStyle(2, 0xffffff, 0.25)
      .setInteractive({ useHandCursor: true });
    const retryText = this.add.text(width / 2 - 115 - btnGap / 2, btnY, '再来一局', {
      fontSize: '18px',
      fontWeight: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);

    const recordsBtn = this.add.rectangle(width / 2 + 115 + btnGap / 2, btnY, 210, 50, COLORS.success)
      .setStrokeStyle(2, 0xffffff, 0.25)
      .setInteractive({ useHandCursor: true });
    const recordsText = this.add.text(width / 2 + 115 + btnGap / 2, btnY, '查看全部记录', {
      fontSize: '18px',
      fontWeight: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);

    [retryBtn, recordsBtn].forEach(b => {
      b.on('pointerover', () => b.setScale(1.05));
      b.on('pointerout', () => b.setScale(1));
    });

    retryBtn.on('pointerdown', () => {
      this.audioManager.playClick();
      this.audioManager.vibrate(30);
      this.scene.start('GameScene');
    });

    recordsBtn.on('pointerdown', () => {
      this.audioManager.playClick();
      this.fromGame = false;
      this.showRecordsView();
    });

    this.rootContainer.add([retryBtn, retryText, recordsBtn, recordsText]);

    scoreDisplay.setScale(0);
    this.tweens.add({
      targets: scoreDisplay,
      scale: 1,
      duration: 600,
      ease: 'Back.easeOut',
      delay: 200
    });
  }

  private showRecordsView(): void {
    this.clearContent();
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const records = this.stateManager.getAllRecords();

    this.rootContainer = this.add.container(0, 0);

    const viewTitle = this.add.text(width / 2, 85, '全关卡成绩 · 按回款周期对比', {
      fontSize: '16px',
      color: '#' + COLORS.warning.toString(16).padStart(6, '0')
    }).setOrigin(0.5);
    this.rootContainer.add(viewTitle);

    if (this.stateManager.getLastGameStats()) {
      const backBtn = this.add.text(width - 40, 40, '← 单局报告', {
        fontSize: '14px',
        color: '#' + COLORS.primary.toString(16).padStart(6, '0')
      }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });
      backBtn.on('pointerdown', () => {
        this.audioManager.playClick();
        this.fromGame = true;
        this.showGameResultView();
      });
      this.rootContainer.add(backBtn);
    }

    if (records.length === 0) {
      const empty = this.add.text(width / 2, height / 2 + 20, '暂无记录，快去挑战吧！', {
        fontSize: '22px',
        color: '#666666'
      }).setOrigin(0.5);

      const startBtn = this.add.rectangle(width / 2, height / 2 + 80, 200, 50, COLORS.primary)
        .setStrokeStyle(2, 0xffffff, 0.25)
        .setInteractive({ useHandCursor: true });
      const startText = this.add.text(width / 2, height / 2 + 80, '开始游戏', {
        fontSize: '18px',
        fontWeight: 'bold',
        color: '#ffffff'
      }).setOrigin(0.5);

      startBtn.on('pointerover', () => startBtn.setScale(1.05));
      startBtn.on('pointerout', () => startBtn.setScale(1));
      startBtn.on('pointerdown', () => {
        this.audioManager.playClick();
        this.scene.start('LevelSelectScene');
      });

      this.rootContainer.add([empty, startBtn, startText]);
      return;
    }

    const sortedRecords = [...records].sort((a, b) => a.payoutCycle - b.payoutCycle);

    const cardWidth = 230;
    const cardHeight = 340;
    const totalGap = cardWidth + 25;
    const startX = width / 2 - (sortedRecords.length - 1) * totalGap / 2;
    const cardY = height / 2 + 30;

    sortedRecords.forEach((record, index) => {
      const x = startX + index * totalGap;
      this.createRecordCard(x, cardY, record, cardWidth, cardHeight, index);
    });

    const tip = this.add.text(width / 2, height - 35, '💡 回款周期越短，资金周转越快，经营效率越高', {
      fontSize: '13px',
      color: '#666666'
    }).setOrigin(0.5);
    this.rootContainer.add(tip);
  }

  private createRecordCard(
    x: number,
    y: number,
    record: LevelRecord,
    width: number,
    height: number,
    index: number
  ): void {
    if (!this.rootContainer) return;

    const card = this.add.rectangle(x, y, width, height, COLORS.cardBg)
      .setStrokeStyle(2, COLORS.cardBorder, 1);

    const levelName = this.add.text(x, y - height / 2 + 35, record.levelName, {
      fontSize: '20px',
      fontWeight: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);

    const cycleBg = this.add.rectangle(x, y - height / 2 + 70, 110, 30, COLORS.gold, 0.18)
      .setStrokeStyle(1, COLORS.gold, 0.5);
    const cycleText = this.add.text(x, y - height / 2 + 70, `${record.payoutCycle}天回款`, {
      fontSize: '14px',
      fontWeight: 'bold',
      color: '#' + COLORS.gold.toString(16).padStart(6, '0')
    }).setOrigin(0.5);

    const divider = this.add.rectangle(x, y - height / 2 + 100, width - 30, 1, COLORS.cardBorder, 0.5);

    const rows = [
      { label: '最高得分', value: record.bestScore.toString(), color: COLORS.primary, size: '32px' },
      { label: '最高连击', value: record.bestCombo.toString(), color: COLORS.gold, size: '24px' },
      { label: '正确率', value: `${Math.round(record.accuracy * 100)}%`, color: COLORS.success, size: '24px' }
    ];

    let rowY = y - height / 2 + 135;
    rows.forEach(r => {
      const lbl = this.add.text(x, rowY, r.label, {
        fontSize: '12px',
        color: '#888888'
      }).setOrigin(0.5);
      rowY += 18;
      const val = this.add.text(x, rowY, r.value, {
        fontSize: r.size,
        fontWeight: 'bold',
        color: '#' + r.color.toString(16).padStart(6, '0')
      }).setOrigin(0.5);
      rowY += 32;
      this.rootContainer!.add([lbl, val]);
    });

    const playCount = this.add.text(x, y + height / 2 - 60, `挑战次数: ${record.playCount}`, {
      fontSize: '12px',
      color: '#666666'
    }).setOrigin(0.5);

    const btn = this.add.rectangle(x, y + height / 2 - 30, 150, 40, COLORS.primary, 0.85)
      .setStrokeStyle(2, 0xffffff, 0.2)
      .setInteractive({ useHandCursor: true });
    const btnText = this.add.text(x, y + height / 2 - 30, '再次挑战', {
      fontSize: '15px',
      fontWeight: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);

    btn.on('pointerover', () => btn.setScale(1.05));
    btn.on('pointerout', () => btn.setScale(1));
    btn.on('pointerdown', () => {
      this.audioManager.playClick();
      this.audioManager.vibrate(30);
      const level = this.stateManager.getLevelById(record.levelId);
      if (level) {
        this.stateManager.setCurrentLevel(level);
        this.scene.start('GameScene');
      }
    });

    this.rootContainer.add([
      card, levelName, cycleBg, cycleText, divider,
      playCount, btn, btnText
    ]);

    card.setAlpha(0);
    card.setScale(0.9);
    this.tweens.add({
      targets: card,
      alpha: 1,
      scale: 1,
      duration: 400,
      delay: index * 100,
      ease: 'Back.easeOut'
    });
  }
}
