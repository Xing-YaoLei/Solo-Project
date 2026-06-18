import Phaser from 'phaser';
import { BaseScene, COLORS, FONT_FAMILY, UIElement } from './BaseScene';
import { GameEvent } from '../core';
import { configManager } from '../core/ConfigManager';
import { TrainingRecord, Rating, LeaderboardEntry } from '../models';

type LeaderboardTab = 'personal' | 'global';

export class LeaderboardScene extends BaseScene {
  private currentTab: LeaderboardTab = 'personal';
  private currentLevelId: string | null = null;
  private personalRecords: TrainingRecord[] = [];
  private globalEntries: LeaderboardEntry[] = [];
  private tabButtons: Map<LeaderboardTab, UIElement> = new Map();
  private rankItems: Map<string, UIElement> = new Map();

  constructor() {
    super('LeaderboardScene');
  }

  create(): void {
    super.create();

    this.createBackground(true);
    this.loadLeaderboardData();
    this.createHeader();
    this.createLevelSelector();
    this.createTabs();
    this.createLeaderboardPanel();

    this.fadeIn(600);

    this.emitEvent(GameEvent.SCENE_CHANGED, { scene: 'LeaderboardScene' });
  }

  private loadLeaderboardData(): void {
    this.personalRecords = this.saveSystem.loadTrainingRecords()
      .sort((a, b) => b.score - a.score);

    this.generateMockGlobalData();

    if (!this.currentLevelId) {
      const levels = Object.values(configManager.getAllLevels() || {});
      if (levels.length > 0) {
        this.currentLevelId = levels[0].id;
      }
    }
  }

  private generateMockGlobalData(): void {
    this.globalEntries = [];
    const mockNames = ['建筑大师', '工地老兵', '装修达人', '质量卫士', '效率王', '完美主义者', '金牌项目经理', '资深监理', '成本控制专家', '现场指挥官', '装修新手', '细心工头', '验收达人', '预算大师', '时间管理王'];

    const ratingPool: Rating[] = ['S', 'A', 'A', 'B', 'B', 'C'];

    for (let i = 0; i < 15; i++) {
      const entry: LeaderboardEntry = {
        id: `global_${i}`,
        playerName: mockNames[i] || `玩家${i + 1}`,
        levelId: this.currentLevelId || 'level_001',
        score: 950 - i * 35 + Math.floor(Math.random() * 30),
        rating: ratingPool[Math.min(i, ratingPool.length - 1)],
        timestamp: Date.now() - i * 86400000,
      };
      this.globalEntries.push(entry);
    }
  }

  private createHeader(): void {
    const { width } = this.scale;

    const headerBg = this.add.rectangle(width / 2, 50, width, 80, COLORS.PANEL);
    headerBg.setStrokeStyle(2, COLORS.PANEL_BORDER);

    this.createText(width / 2, 50, '🏆 排行榜', {
      fontSize: 28,
      fontStyle: 'bold',
    });

    const backButton = this.createButton({
      x: 80,
      y: 50,
      width: 100,
      height: 40,
      text: '返回',
      variant: 'outline',
      onClick: () => this.handleBack(),
    });
    this.uiElements.set('backButton', backButton);

    const playerSave = this.saveSystem.getCurrentSave();
    this.createText(
      width - 30,
      40,
      `我的总分: ${playerSave?.totalScore || 0}`,
      {
        fontSize: 14,
        color: COLORS.ACCENT,
        fontStyle: 'bold',
        origin: { x: 1, y: 0.5 },
      }
    );

    this.createText(
      width - 30,
      65,
      `完成关卡: ${playerSave?.completedLevels.length || 0} / ${Object.values(configManager.getAllLevels() || {}).length}`,
      {
        fontSize: 13,
        color: COLORS.TEXT_SECONDARY,
        origin: { x: 1, y: 0.5 },
      }
    );

    const cornerDecorLeft = this.add.graphics();
    cornerDecorLeft.lineStyle(3, COLORS.ACCENT, 1);
    cornerDecorLeft.beginPath();
    cornerDecorLeft.moveTo(0, 90);
    cornerDecorLeft.lineTo(30, 90);
    cornerDecorLeft.lineTo(30, 80);
    cornerDecorLeft.strokePath();

    const cornerDecorRight = this.add.graphics();
    cornerDecorRight.lineStyle(3, COLORS.ACCENT, 1);
    cornerDecorRight.beginPath();
    cornerDecorRight.moveTo(width, 90);
    cornerDecorRight.lineTo(width - 30, 90);
    cornerDecorRight.lineTo(width - 30, 80);
    cornerDecorRight.strokePath();
  }

  private createLevelSelector(): void {
    const { width } = this.scale;
    const levels = Object.values(configManager.getAllLevels() || {});

    const panelY = 130;
    const bg = this.add.rectangle(width / 2, panelY, width * 0.9, 55, COLORS.PANEL);
    bg.setStrokeStyle(2, COLORS.PANEL_BORDER);

    this.createText(
      width / 2 - width * 0.4 + 20,
      panelY,
      '选择关卡:',
      {
        fontSize: 15,
        color: COLORS.TEXT_SECONDARY,
        origin: { x: 0, y: 0.5 },
      }
    );

    const btnWidth = 140;
    const btnHeight = 35;
    const startX = width / 2 - width * 0.4 + 110;

    levels.slice(0, 5).forEach((level, index) => {
      const x = startX + index * (btnWidth + 10);
      const isSelected = this.currentLevelId === level.id;

      const button = this.createButton({
        x,
        y: panelY,
        width: btnWidth,
        height: btnHeight,
        text: level.name,
        fontSize: 13,
        variant: isSelected ? 'primary' : 'secondary',
        onClick: () => {
          this.currentLevelId = level.id;
          this.refreshLeaderboard();
          this.emitEvent(GameEvent.AUDIO_PLAY, { type: 'sfx', key: 'confirm' });
        },
      });
      this.uiElements.set(`level_${level.id}`, button);
    });
  }

  private createTabs(): void {
    const { width } = this.scale;
    const tabsY = 210;

    const tabs: { key: LeaderboardTab; label: string; icon: string }[] = [
      { key: 'personal', label: '个人最佳', icon: '👤' },
      { key: 'global', label: '全服排名', icon: '🌍' },
    ];

    const tabWidth = 200;
    const tabHeight = 45;
    const totalWidth = tabs.length * tabWidth + (tabs.length - 1) * 20;
    const startX = width / 2 - totalWidth / 2 + tabWidth / 2;

    tabs.forEach((tab, index) => {
      const x = startX + index * (tabWidth + 20);
      const isActive = this.currentTab === tab.key;

      const button = this.createButton({
        x,
        y: tabsY,
        width: tabWidth,
        height: tabHeight,
        text: `${tab.icon} ${tab.label}`,
        fontSize: 16,
        variant: isActive ? 'primary' : 'secondary',
        onClick: () => {
          this.currentTab = tab.key;
          this.refreshTabStyles();
          this.refreshLeaderboard();
          this.emitEvent(GameEvent.AUDIO_PLAY, { type: 'sfx', key: 'confirm' });
        },
      });
      this.tabButtons.set(tab.key, button);
    });
  }

  private refreshTabStyles(): void {
    this.tabButtons.forEach((element, key) => {
      const container = element.container;
      const bg = container.getAt(0) as Phaser.GameObjects.Rectangle;
      if (key === this.currentTab) {
        bg.fillColor = COLORS.ACCENT;
      } else {
        bg.fillColor = COLORS.PANEL;
      }
    });
  }

  private createLeaderboardPanel(): void {
    const { width, height } = this.scale;
    const panelWidth = width * 0.9;
    const panelHeight = height - 320;

    this.createPanel(
      width / 2,
      height / 2 + 100,
      panelWidth,
      panelHeight,
      this.currentTab === 'personal' ? '个人最佳记录' : '全服排行榜'
    );

    if (this.currentTab === 'personal') {
      this.renderPersonalRankings(width / 2, height / 2 + 100, panelWidth, panelHeight);
    } else {
      this.renderGlobalRankings(width / 2, height / 2 + 100, panelWidth, panelHeight);
    }
  }

  private renderPersonalRankings(
    centerX: number,
    centerY: number,
    width: number,
    height: number
  ): void {
    const filteredRecords = this.currentLevelId
      ? this.personalRecords.filter((r) => r.levelId === this.currentLevelId)
      : this.personalRecords;

    if (filteredRecords.length === 0) {
      this.createText(centerX, centerY, '暂无个人记录\n开始游戏后将显示你的成绩', {
        fontSize: 18,
        color: COLORS.TEXT_DISABLED,
      });
      return;
    }

    const startY = centerY - height / 2 + 60;
    const itemHeight = 70;
    const itemSpacing = 8;

    filteredRecords.slice(0, Math.floor((height - 120) / (itemHeight + itemSpacing))).forEach((record, index) => {
      const y = startY + index * (itemHeight + itemSpacing);
      const item = this.createPersonalRankItem(centerX, y, width - 40, itemHeight, record, index + 1);
      this.rankItems.set(`personal_${record.id}`, item);
    });

    if (filteredRecords.length > Math.floor((height - 120) / (itemHeight + itemSpacing))) {
      this.createText(
        centerX,
        centerY + height / 2 - 30,
        `还有 ${filteredRecords.length - Math.floor((height - 120) / (itemHeight + itemSpacing))} 条记录未显示`,
        {
          fontSize: 13,
          color: COLORS.TEXT_SECONDARY,
        }
      );
    }
  }

  private createPersonalRankItem(
    x: number,
    y: number,
    width: number,
    height: number,
    record: TrainingRecord,
    rank: number
  ): UIElement {
    const container = this.add.container(x, y);
    const level = configManager.getLevelById(record.levelId);

    const rankColors = [0xf1c40f, 0xc0c0c0, 0xcd7f32];
    const rankColor = rank <= 3 ? rankColors[rank - 1] : COLORS.PANEL_BORDER;

    const bg = this.add.rectangle(0, 0, width, height, COLORS.PANEL_BORDER);
    bg.setStrokeStyle(2, rankColor);

    const rankBg = this.add.circle(-width / 2 + 50, 0, 28, rankColor);
    rankBg.setStrokeStyle(3, COLORS.PRIMARY_DARK);
    const rankText = this.createText(-width / 2 + 50, 0, rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : `${rank}`, {
      fontSize: rank <= 3 ? 28 : 20,
      fontStyle: 'bold',
      color: COLORS.TEXT,
    });

    const ratingColors: Record<Rating, number> = { S: 0xf1c40f, A: 0x2ecc71, B: 0x3498db, C: 0x9b59b6, D: 0xe74c3c };
    const ratingColor = ratingColors[record.rating];

    const ratingBg = this.add.circle(-width / 2 + 120, 0, 25, COLORS.PRIMARY_DARK);
    ratingBg.setStrokeStyle(3, ratingColor);
    const ratingText = this.createText(-width / 2 + 120, 0, record.rating, {
      fontSize: 22,
      fontStyle: 'bold',
      color: ratingColor,
    });

    const levelText = this.add.text(-width / 2 + 170, -height / 2 + 20, `${level?.name || '未知关卡'}`, {
      fontFamily: FONT_FAMILY,
      fontSize: '15px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    const dateStr = new Date(record.endTime).toLocaleDateString('zh-CN');
    const dateText = this.add.text(-width / 2 + 170, 5, `🕐 ${dateStr} | 用时: ${Math.round((record.endTime - record.startTime) / 1000 / 60)}分钟`, {
      fontFamily: FONT_FAMILY,
      fontSize: '12px',
      color: `#${COLORS.TEXT_SECONDARY.toString(16).padStart(6, '0')}`,
    }).setOrigin(0, 0.5);

    const detailsText = this.add.text(
      -width / 2 + 170,
      height / 2 - 18,
      `🛠️质量:${record.qualityScore} 💰成本:${record.costScore} ⏱️时间:${record.timeScore}`,
      {
        fontFamily: FONT_FAMILY,
        fontSize: '11px',
        color: `#${COLORS.TEXT_SECONDARY.toString(16).padStart(6, '0')}`,
      }
    ).setOrigin(0, 0.5);

    const scoreText = this.createText(width / 2 - 100, 0, `${record.score}`, {
      fontSize: 32,
      fontStyle: 'bold',
      color: COLORS.ACCENT,
      origin: { x: 0, y: 0.5 },
    });

    const scoreLabel = this.createText(width / 2 - 100, 28, '得分', {
      fontSize: 11,
      color: COLORS.TEXT_SECONDARY,
      origin: { x: 0, y: 0.5 },
    });

    const detailsBtn = this.createButton({
      x: width / 2 - 30,
      y: 0,
      width: 70,
      height: 35,
      text: '详情',
      fontSize: 13,
      variant: 'secondary',
      onClick: () => this.handleViewRecord(record),
    });

    container.add([bg, rankBg, rankText, ratingBg, ratingText, levelText, dateText, detailsText, scoreText, scoreLabel, detailsBtn.container]);

    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerover', () => {
      bg.fillColor = COLORS.PRIMARY_LIGHT;
      this.emitEvent(GameEvent.AUDIO_PLAY, { type: 'sfx', key: 'hover' });
    });
    bg.on('pointerout', () => {
      bg.fillColor = COLORS.PANEL_BORDER;
    });

    return {
      container,
      destroy: () => container.destroy(),
      setVisible: (visible: boolean) => container.setVisible(visible),
      setEnabled: (enabled: boolean) => {
        if (enabled) {
          bg.setInteractive({ useHandCursor: true });
          container.setAlpha(1);
        } else {
          bg.disableInteractive();
          container.setAlpha(0.5);
        }
      },
    };
  }

  private renderGlobalRankings(
    centerX: number,
    centerY: number,
    width: number,
    height: number
  ): void {
    const filteredEntries = this.currentLevelId
      ? this.globalEntries.filter((e) => e.levelId === this.currentLevelId)
      : this.globalEntries;

    const playerSave = this.saveSystem.getCurrentSave();
    const playerName = playerSave?.playerName || '玩家';
    const playerBest = this.personalRecords
      .filter((r) => r.levelId === this.currentLevelId)
      .sort((a, b) => b.score - a.score)[0];

    const myRank = filteredEntries.findIndex((e) => e.score <= (playerBest?.score || 0)) + 1;

    const myRankY = centerY - height / 2 + 50;
    this.renderMyRankCard(centerX, myRankY, width - 40, playerBest, playerName, myRank);

    const startY = centerY - height / 2 + 130;
    const itemHeight = 65;
    const itemSpacing = 6;

    filteredEntries.slice(0, Math.floor((height - 220) / (itemHeight + itemSpacing))).forEach((entry, index) => {
      const y = startY + index * (itemHeight + itemSpacing);
      this.createGlobalRankItem(centerX, y, width - 40, itemHeight, entry, index + 1);
    });
  }

  private renderMyRankCard(
    x: number,
    y: number,
    width: number,
    bestRecord: TrainingRecord | undefined,
    playerName: string,
    rank: number
  ): void {
    const container = this.add.container(x, y);

    const bg = this.add.rectangle(0, 0, width, 70, COLORS.ACCENT, 0.15);
    bg.setStrokeStyle(3, COLORS.ACCENT);

    const label = this.createText(-width / 2 + 20, 0, '我的排名', {
      fontSize: 14,
      fontStyle: 'bold',
      color: COLORS.ACCENT,
      origin: { x: 0, y: 0.5 },
    });

    const rankBg = this.add.circle(-width / 2 + 110, 0, 25, COLORS.ACCENT);
    const rankText = this.createText(-width / 2 + 110, 0, rank > 0 ? `${rank}` : '-', {
      fontSize: 20,
      fontStyle: 'bold',
      color: COLORS.TEXT,
    });

    const nameText = this.add.text(-width / 2 + 160, -15, `👤 ${playerName}`, {
      fontFamily: FONT_FAMILY,
      fontSize: '15px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    const levelText = this.add.text(-width / 2 + 160, 15, bestRecord ? `最佳成绩: ${bestRecord.score}分 | ${bestRecord.rating}评级` : '暂无成绩 - 开始游戏挑战排行榜吧！', {
      fontFamily: FONT_FAMILY,
      fontSize: '12px',
      color: `#${COLORS.TEXT_SECONDARY.toString(16).padStart(6, '0')}`,
    }).setOrigin(0, 0.5);

    const encouragementText = this.createText(width / 2 - 30, 0, rank > 0 && rank <= 3 ? '🏆 TOP3！继续保持！' : rank > 0 ? `💪 加油！还差一点点！` : '🎯 开始挑战', {
      fontSize: 14,
      color: rank > 0 && rank <= 10 ? COLORS.SUCCESS : COLORS.WARNING,
      origin: { x: 1, y: 0.5 },
    });

    container.add([bg, label, rankBg, rankText, nameText, levelText, encouragementText]);
  }

  private createGlobalRankItem(
    x: number,
    y: number,
    width: number,
    height: number,
    entry: LeaderboardEntry,
    rank: number
  ): void {
    const container = this.add.container(x, y);

    const rankColors = [0xf1c40f, 0xc0c0c0, 0xcd7f32];
    const rankColor = rank <= 3 ? rankColors[rank - 1] : COLORS.PANEL_BORDER;

    const bg = this.add.rectangle(0, 0, width, height, COLORS.PANEL_BORDER);
    bg.setStrokeStyle(1, rankColor, rank <= 3 ? 1 : 0.5);

    const rankBg = this.add.circle(-width / 2 + 45, 0, 25, rankColor, rank <= 3 ? 1 : 0.5);
    rankBg.setStrokeStyle(2, COLORS.PRIMARY_DARK);
    const rankText = this.createText(-width / 2 + 45, 0, rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : `${rank}`, {
      fontSize: rank <= 3 ? 26 : 18,
      fontStyle: 'bold',
      color: COLORS.TEXT,
    });

    const ratingColors: Record<Rating, number> = { S: 0xf1c40f, A: 0x2ecc71, B: 0x3498db, C: 0x9b59b6, D: 0xe74c3c };
    const ratingColor = ratingColors[entry.rating];

    const ratingBg = this.add.circle(-width / 2 + 105, 0, 22, COLORS.PRIMARY_DARK);
    ratingBg.setStrokeStyle(2, ratingColor);
    const ratingText = this.createText(-width / 2 + 105, 0, entry.rating, {
      fontSize: 18,
      fontStyle: 'bold',
      color: ratingColor,
    });

    const nameText = this.add.text(-width / 2 + 150, -12, `👤 ${entry.playerName}`, {
      fontFamily: FONT_FAMILY,
      fontSize: '15px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    const dateStr = new Date(entry.timestamp).toLocaleDateString('zh-CN');
    const dateText = this.add.text(-width / 2 + 150, 15, `🕐 ${dateStr}`, {
      fontFamily: FONT_FAMILY,
      fontSize: '12px',
      color: `#${COLORS.TEXT_SECONDARY.toString(16).padStart(6, '0')}`,
    }).setOrigin(0, 0.5);

    const scoreText = this.createText(width / 2 - 80, 0, `${entry.score}`, {
      fontSize: 28,
      fontStyle: 'bold',
      color: COLORS.ACCENT,
      origin: { x: 0, y: 0.5 },
    });

    const scoreLabel = this.createText(width / 2 - 80, 25, '分', {
      fontSize: 11,
      color: COLORS.TEXT_SECONDARY,
      origin: { x: 0, y: 0.5 },
    });

    container.add([bg, rankBg, rankText, ratingBg, ratingText, nameText, dateText, scoreText, scoreLabel]);
  }

  private refreshLeaderboard(): void {
    this.rankItems.forEach((item) => item.destroy());
    this.rankItems.clear();

    const { width, height } = this.scale;
    const panelWidth = width * 0.9;
    const panelHeight = height - 320;
    const centerX = width / 2;
    const centerY = height / 2 + 100;

    this.createPanel(
      centerX,
      centerY,
      panelWidth,
      panelHeight,
      this.currentTab === 'personal' ? '个人最佳记录' : '全服排行榜'
    );

    this.generateMockGlobalData();

    if (this.currentTab === 'personal') {
      this.renderPersonalRankings(centerX, centerY, panelWidth, panelHeight);
    } else {
      this.renderGlobalRankings(centerX, centerY, panelWidth, panelHeight);
    }
  }

  private handleViewRecord(record: TrainingRecord): void {
    this.emitEvent(GameEvent.AUDIO_PLAY, { type: 'sfx', key: 'confirm' });
    this.transitionToScene('SettlementScene', {
      levelId: record.levelId,
      taskId: record.taskId,
      recordId: record.id,
    });
  }

  private handleBack(): void {
    this.emitEvent(GameEvent.AUDIO_PLAY, { type: 'sfx', key: 'cancel' });
    this.transitionToScene('MainMenuScene');
  }
}
