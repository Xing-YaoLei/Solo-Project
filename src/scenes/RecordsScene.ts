import Phaser from 'phaser';
import { BaseScene, COLORS, FONT_FAMILY, UIElement } from './BaseScene';
import { GameEvent } from '../core';
import { configManager } from '../core/ConfigManager';
import { TrainingRecord, Rating } from '../models';

interface RecordsSceneData {
  fromScene?: string;
}

type FilterType = 'all' | 'level' | 'task' | 'rating';

export class RecordsScene extends BaseScene {
  private fromScene: string = 'MainMenuScene';
  private allRecords: TrainingRecord[] = [];
  private filteredRecords: TrainingRecord[] = [];
  private currentFilterType: FilterType = 'all';
  private filterValue: string = '';
  private recordItems: Map<string, UIElement> = new Map();
  private selectedRecordId: string | null = null;

  constructor() {
    super('RecordsScene');
  }

  init(data: RecordsSceneData): void {
    this.fromScene = data?.fromScene || 'MainMenuScene';
  }

  create(): void {
    super.create();

    this.createBackground();
    this.loadRecords();
    this.createHeader();
    this.createFilterBar();
    this.createRecordsList();
    this.createFooter();

    this.fadeIn(500);

    this.emitEvent(GameEvent.SCENE_CHANGED, { scene: 'RecordsScene' });
  }

  private loadRecords(): void {
    this.allRecords = this.saveSystem.loadTrainingRecords().sort((a, b) => b.endTime - a.endTime);
    this.filteredRecords = [...this.allRecords];
  }

  private createHeader(): void {
    const { width } = this.scale;

    const headerBg = this.add.rectangle(width / 2, 50, width, 80, COLORS.PANEL);
    headerBg.setStrokeStyle(2, COLORS.PANEL_BORDER);

    this.createText(width / 2, 50, '📋 历史训练记录', {
      fontSize: 26,
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

    const stats = this.getRecordStats();
    this.createText(
      width - 30,
      40,
      `总记录: ${this.allRecords.length} | 平均分: ${stats.avgScore} | 最佳: ${stats.bestScore}`,
      {
        fontSize: 13,
        color: COLORS.TEXT_SECONDARY,
        origin: { x: 1, y: 0.5 },
      }
    );

    this.createText(
      width - 30,
      65,
      `已完成关卡: ${stats.completedLevels} | S级: ${stats.sCount} | A级: ${stats.aCount}`,
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

  private createFilterBar(): void {
    const { width } = this.scale;
    const barY = 130;

    const barBg = this.add.rectangle(width / 2, barY, width * 0.9, 60, COLORS.PANEL);
    barBg.setStrokeStyle(2, COLORS.PANEL_BORDER);

    this.createText(
      width / 2 - width * 0.4 + 20,
      barY,
      '筛选:',
      {
        fontSize: 16,
        color: COLORS.TEXT_SECONDARY,
        origin: { x: 0, y: 0.5 },
      }
    );

    const filters: { type: FilterType; label: string }[] = [
      { type: 'all', label: '全部' },
      { type: 'rating', label: '按评级' },
      { type: 'level', label: '按关卡' },
    ];

    const filterBtnWidth = 100;
    const filterBtnHeight = 35;
    const startX = width / 2 - width * 0.4 + 80;

    filters.forEach((filter, index) => {
      const x = startX + index * (filterBtnWidth + 10);
      const isActive = this.currentFilterType === filter.type;

      const button = this.createButton({
        x,
        y: barY,
        width: filterBtnWidth,
        height: filterBtnHeight,
        text: filter.label,
        fontSize: 13,
        variant: isActive ? 'primary' : 'secondary',
        onClick: () => this.handleFilterChange(filter.type),
      });
      this.uiElements.set(`filter_${filter.type}`, button);
    });

    const clearBtn = this.createButton({
      x: width / 2 + width * 0.4 - 60,
      y: barY,
      width: 100,
      height: 35,
      text: '清除筛选',
      fontSize: 13,
      variant: 'outline',
      onClick: () => this.handleClearFilter(),
    });
    this.uiElements.set('clearFilter', clearBtn);
  }

  private createRecordsList(): void {
    const { width, height } = this.scale;
    const panelWidth = width * 0.9;
    const panelHeight = height - 280;

    const panel = this.createPanel(
      width / 2,
      height / 2 + 60,
      panelWidth,
      panelHeight,
      '训练记录列表'
    );

    if (this.filteredRecords.length === 0) {
      const placeholder = this.createText(width / 2, height / 2 + 60, '暂无训练记录\n开始游戏后记录将显示在这里', {
        fontSize: 18,
        color: COLORS.TEXT_DISABLED,
      });
      panel.add(placeholder);
      return;
    }

    const listStartY = height / 2 + 60 - panelHeight / 2 + 60;
    const itemHeight = 90;
    const itemSpacing = 12;
    const itemWidth = panelWidth - 40;

    this.filteredRecords.slice(0, Math.floor((panelHeight - 120) / (itemHeight + itemSpacing))).forEach((record, index) => {
      const y = listStartY + index * (itemHeight + itemSpacing);
      const item = this.createRecordItem(width / 2, y, itemWidth, itemHeight, record, index + 1);
      panel.add(item.container);
      this.recordItems.set(record.id, item);
    });

    if (this.filteredRecords.length > Math.floor((panelHeight - 120) / (itemHeight + itemSpacing))) {
      const moreText = this.createText(
        width / 2,
        height / 2 + 60 + panelHeight / 2 - 30,
        `还有 ${this.filteredRecords.length - Math.floor((panelHeight - 120) / (itemHeight + itemSpacing))} 条记录未显示...`,
        {
          fontSize: 13,
          color: COLORS.TEXT_SECONDARY,
        }
      );
      panel.add(moreText);
    }
  }

  private createRecordItem(
    x: number,
    y: number,
    width: number,
    height: number,
    record: TrainingRecord,
    index: number
  ): UIElement {
    const container = this.add.container(x, y);
    const level = configManager.getLevelById(record.levelId);
    const isSelected = this.selectedRecordId === record.id;

    const bg = this.add.rectangle(0, 0, width, height, isSelected ? COLORS.PRIMARY : COLORS.PANEL_BORDER);
    bg.setStrokeStyle(2, isSelected ? COLORS.ACCENT : COLORS.PANEL_BORDER);

    const indexBg = this.add.rectangle(-width / 2 + 45, 0, 60, 60, COLORS.PRIMARY_DARK);
    indexBg.setStrokeStyle(2, COLORS.PANEL_BORDER);
    const indexText = this.createText(-width / 2 + 45, 0, `#${index}`, {
      fontSize: 20,
      fontStyle: 'bold',
      color: COLORS.ACCENT,
    });

    const ratingColors: Record<Rating, number> = {
      S: 0xf1c40f,
      A: 0x2ecc71,
      B: 0x3498db,
      C: 0x9b59b6,
      D: 0xe74c3c,
    };
    const ratingColor = ratingColors[record.rating] || COLORS.TEXT;

    const ratingBg = this.add.circle(-width / 2 + 120, 0, 35, COLORS.PRIMARY_DARK);
    ratingBg.setStrokeStyle(3, ratingColor);
    const ratingText = this.createText(-width / 2 + 120, 0, record.rating, {
      fontSize: 28,
      fontStyle: 'bold',
      color: ratingColor,
    });

    const levelText = this.add.text(-width / 2 + 180, -height / 2 + 22, `${level?.name || '未知关卡'}`, {
      fontFamily: FONT_FAMILY,
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    const dateStr = new Date(record.endTime).toLocaleString('zh-CN');
    const dateText = this.add.text(-width / 2 + 180, 0, `🕐 ${dateStr}`, {
      fontFamily: FONT_FAMILY,
      fontSize: '13px',
      color: `#${COLORS.TEXT_SECONDARY.toString(16).padStart(6, '0')}`,
    }).setOrigin(0, 0.5);

    const mistakesCount = record.mistakes.length;
    const delaysCount = record.materialDelays.length;
    const metaText = this.add.text(
      -width / 2 + 180,
      height / 2 - 20,
      `❌ ${mistakesCount} 错误 | 📦 ${delaysCount} 延期 | 📝 ${record.decisions.length} 决策`,
      {
        fontFamily: FONT_FAMILY,
        fontSize: '12px',
        color: `#${COLORS.TEXT_SECONDARY.toString(16).padStart(6, '0')}`,
      }
    ).setOrigin(0, 0.5);

    const scoreText = this.createText(width / 2 - 180, -5, `${record.score}`, {
      fontSize: 36,
      fontStyle: 'bold',
      color: COLORS.ACCENT,
      origin: { x: 0, y: 0.5 },
    });

    const scoreLabel = this.createText(width / 2 - 180, 25, '总分', {
      fontSize: 12,
      color: COLORS.TEXT_SECONDARY,
      origin: { x: 0, y: 0.5 },
    });

    const scoreDetails = this.add.text(
      width / 2 - 180,
      -height / 2 + 22,
      `🛠️${record.qualityScore} 💰${record.costScore} ⏱️${record.timeScore}`,
      {
        fontFamily: FONT_FAMILY,
        fontSize: '12px',
        color: `#${COLORS.TEXT_SECONDARY.toString(16).padStart(6, '0')}`,
      }
    ).setOrigin(0, 0.5);

    const reviewBtn = this.createButton({
      x: width / 2 - 50,
      y: 0,
      width: 80,
      height: 40,
      text: '复盘',
      fontSize: 14,
      variant: 'secondary',
      onClick: () => this.handleReviewRecord(record),
    });

    const settlementBtn = this.createButton({
      x: width / 2 - 50,
      y: 0,
      width: 80,
      height: 40,
      text: '详情',
      fontSize: 14,
      variant: 'primary',
      onClick: () => this.handleViewSettlement(record),
    });

    container.add([bg, indexBg, indexText, ratingBg, ratingText, levelText, dateText, metaText, scoreText, scoreLabel, scoreDetails, reviewBtn.container, settlementBtn.container]);

    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerover', () => {
      if (!isSelected) bg.fillColor = COLORS.PRIMARY_LIGHT;
      this.emitEvent(GameEvent.AUDIO_PLAY, { type: 'sfx', key: 'hover' });
    });
    bg.on('pointerout', () => {
      if (!isSelected) bg.fillColor = COLORS.PANEL_BORDER;
    });
    bg.on('pointerup', () => {
      this.selectedRecordId = record.id;
      this.emitEvent(GameEvent.AUDIO_PLAY, { type: 'sfx', key: 'click' });
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

  private createFooter(): void {
    const { width, height } = this.scale;

    const footerBg = this.add.rectangle(width / 2, height - 40, width, 60, COLORS.PANEL);
    footerBg.setStrokeStyle(1, COLORS.PANEL_BORDER);

    this.createText(width / 2, height - 40, '选择记录进行复盘分析或查看详细结算', {
      fontSize: 14,
      color: COLORS.TEXT_SECONDARY,
    });
  }

  private getRecordStats() {
    if (this.allRecords.length === 0) {
      return {
        avgScore: 0,
        bestScore: 0,
        completedLevels: 0,
        sCount: 0,
        aCount: 0,
      };
    }

    const totalScore = this.allRecords.reduce((sum, r) => sum + r.score, 0);
    const avgScore = Math.round(totalScore / this.allRecords.length);
    const bestScore = Math.max(...this.allRecords.map((r) => r.score));
    const completedLevels = new Set(this.allRecords.map((r) => r.levelId)).size;
    const sCount = this.allRecords.filter((r) => r.rating === 'S').length;
    const aCount = this.allRecords.filter((r) => r.rating === 'A').length;

    return { avgScore, bestScore, completedLevels, sCount, aCount };
  }

  private handleFilterChange(type: FilterType): void {
    this.currentFilterType = type;

    switch (type) {
      case 'all':
        this.filteredRecords = [...this.allRecords];
        break;
      case 'rating':
        this.showRatingFilterDialog();
        return;
      case 'level':
        this.showLevelFilterDialog();
        return;
    }

    this.refreshRecordsList();
    this.emitEvent(GameEvent.AUDIO_PLAY, { type: 'sfx', key: 'confirm' });
  }

  private showRatingFilterDialog(): void {
    const { width, height } = this.scale;

    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);
    overlay.setDepth(200);

    const panel = this.createPanel(width / 2, height / 2, 400, 380, '按评级筛选');
    panel.setDepth(201);

    const ratings: Rating[] = ['S', 'A', 'B', 'C', 'D'];
    const ratingColors: Record<Rating, number> = {
      S: 0xf1c40f,
      A: 0x2ecc71,
      B: 0x3498db,
      C: 0x9b59b6,
      D: 0xe74c3c,
    };
    const ratingNames: Record<Rating, string> = {
      S: '卓越 (S)',
      A: '优秀 (A)',
      B: '良好 (B)',
      C: '合格 (C)',
      D: '待改进 (D)',
    };

    ratings.forEach((rating, index) => {
      const y = height / 2 - 130 + index * 60;
      const btn = this.createButton({
        x: width / 2,
        y,
        width: 300,
        height: 50,
        text: ratingNames[rating],
        fontSize: 16,
        variant: 'secondary',
        onClick: () => {
          this.filterValue = rating;
          this.filteredRecords = this.allRecords.filter((r) => r.rating === rating);
          this.refreshRecordsList();
          overlay.destroy();
          panel.destroy();
          closeBtn.destroy();
          this.emitEvent(GameEvent.AUDIO_PLAY, { type: 'sfx', key: 'confirm' });
        },
      });
      btn.container.setDepth(202);

      const bg = btn.container.getAt(0) as Phaser.GameObjects.Rectangle;
      bg.strokeColor = ratingColors[rating];
    });

    const closeBtn = this.createButton({
      x: width / 2 + 170,
      y: height / 2 - 160,
      width: 40,
      height: 40,
      text: '✕',
      variant: 'outline',
      onClick: () => {
        overlay.destroy();
        panel.destroy();
        closeBtn.destroy();
        this.currentFilterType = 'all';
      },
    });
    closeBtn.container.setDepth(202);
  }

  private showLevelFilterDialog(): void {
    const { width, height } = this.scale;

    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);
    overlay.setDepth(200);

    const levels = Object.values(configManager.getAllLevels() || {});
    const panelHeight = Math.min(500, 120 + levels.length * 60);

    const panel = this.createPanel(width / 2, height / 2, 500, panelHeight, '按关卡筛选');
    panel.setDepth(201);

    const startY = height / 2 - panelHeight / 2 + 70;

    levels.slice(0, Math.floor((panelHeight - 140) / 60)).forEach((level, index) => {
      const y = startY + index * 60;
      const levelRecordCount = this.allRecords.filter((r) => r.levelId === level.id).length;
      const btn = this.createButton({
        x: width / 2,
        y,
        width: 440,
        height: 50,
        text: `${level.name} (${levelRecordCount}条记录)`,
        fontSize: 15,
        variant: 'secondary',
        onClick: () => {
          this.filterValue = level.id;
          this.filteredRecords = this.allRecords.filter((r) => r.levelId === level.id);
          this.refreshRecordsList();
          overlay.destroy();
          panel.destroy();
          closeBtn.destroy();
          this.emitEvent(GameEvent.AUDIO_PLAY, { type: 'sfx', key: 'confirm' });
        },
      });
      btn.container.setDepth(202);
    });

    const closeBtn = this.createButton({
      x: width / 2 + 220,
      y: height / 2 - panelHeight / 2 + 30,
      width: 40,
      height: 40,
      text: '✕',
      variant: 'outline',
      onClick: () => {
        overlay.destroy();
        panel.destroy();
        closeBtn.destroy();
        this.currentFilterType = 'all';
      },
    });
    closeBtn.container.setDepth(202);
  }

  private handleClearFilter(): void {
    this.currentFilterType = 'all';
    this.filterValue = '';
    this.filteredRecords = [...this.allRecords];
    this.refreshRecordsList();
    this.emitEvent(GameEvent.AUDIO_PLAY, { type: 'sfx', key: 'cancel' });
  }

  private refreshRecordsList(): void {
    void this.filterValue;
    this.recordItems.forEach((item) => item.destroy());
    this.recordItems.clear();
    this.createRecordsList();
  }

  private handleReviewRecord(record: TrainingRecord): void {
    this.emitEvent(GameEvent.AUDIO_PLAY, { type: 'sfx', key: 'confirm' });
    this.showReviewPanel(record);
  }

  private handleViewSettlement(record: TrainingRecord): void {
    this.emitEvent(GameEvent.AUDIO_PLAY, { type: 'sfx', key: 'confirm' });
    this.transitionToScene('SettlementScene', {
      levelId: record.levelId,
      taskId: record.taskId,
      recordId: record.id,
    });
  }

  private showReviewPanel(record: TrainingRecord): void {
    const { width, height } = this.scale;

    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.8);
    overlay.setDepth(300);

    const panel = this.createPanel(width / 2, height / 2, width * 0.8, height * 0.8, '📊 训练复盘分析');
    panel.setDepth(301);

    const closeBtn = this.createButton({
      x: width / 2 + width * 0.38,
      y: height / 2 - height * 0.38,
      width: 40,
      height: 40,
      text: '✕',
      variant: 'outline',
      onClick: () => {
        overlay.destroy();
        panel.destroy();
        closeBtn.destroy();
      },
    });
    closeBtn.container.setDepth(302);

    const summaryY = height / 2 - height * 0.3 + 20;

    const summaryItems = [
      { label: '总分', value: `${record.score}`, color: COLORS.ACCENT },
      { label: '质量得分', value: `${record.qualityScore}`, color: COLORS.SUCCESS },
      { label: '成本得分', value: `${record.costScore}`, color: COLORS.WARNING },
      { label: '时间得分', value: `${record.timeScore}`, color: COLORS.PRIMARY_LIGHT },
      { label: '评级', value: record.rating, color: 0xf1c40f },
    ];

    const itemWidth = 140;
    const totalWidth = summaryItems.length * itemWidth;
    const startX = width / 2 - totalWidth / 2 + itemWidth / 2;

    summaryItems.forEach((item, index) => {
      const x = startX + index * itemWidth;
      const container = this.add.container(x, summaryY);
      const bg = this.add.rectangle(0, 0, itemWidth - 10, 80, COLORS.PANEL_BORDER);
      bg.setStrokeStyle(2, item.color);

      const label = this.createText(0, -20, item.label, {
        fontSize: 13,
        color: COLORS.TEXT_SECONDARY,
      });
      const value = this.createText(0, 15, item.value, {
        fontSize: 28,
        fontStyle: 'bold',
        color: item.color,
      });

      container.add([bg, label, value]);
      container.setDepth(302);
      panel.add(container);
    });

    const insightsY = summaryY + 70;
    const insights = this.generateInsights(record);

    const insightsTitle = this.createText(width / 2, insightsY, '💡 复盘要点', {
      fontSize: 18,
      fontStyle: 'bold',
      color: COLORS.ACCENT,
    });
    insightsTitle.setDepth(302);
    panel.add(insightsTitle);

    insights.slice(0, 4).forEach((insight, index) => {
      const y = insightsY + 40 + index * 55;
      const container = this.add.container(width / 2, y);
      const bg = this.add.rectangle(0, 0, width * 0.7 - 40, 45, COLORS.PANEL_BORDER);

      const iconText = this.createText(-width * 0.35 + 25, 0, insight.icon, {
        fontSize: 22,
        origin: { x: 0, y: 0.5 },
      });
      const contentText = this.createText(-width * 0.35 + 65, 0, insight.text, {
        fontSize: 14,
        color: COLORS.TEXT,
        origin: { x: 0, y: 0.5 },
      });

      container.add([bg, iconText, contentText]);
      container.setDepth(302);
      panel.add(container);
    });

    const actions = [
      {
        text: '🔄 重玩此关',
        onClick: () => {
          overlay.destroy();
          panel.destroy();
          closeBtn.destroy();
          this.transitionToScene('ConstructionSiteScene', {
            levelId: record.levelId,
            taskId: record.taskId,
          });
        },
      },
      {
        text: '📋 查看详情',
        onClick: () => {
          overlay.destroy();
          panel.destroy();
          closeBtn.destroy();
          this.handleViewSettlement(record);
        },
      },
    ];

    const btnWidth = 180;
    const btnHeight = 50;
    const actionsStartX = width / 2 - btnWidth - 15;

    actions.forEach((action, index) => {
      const x = actionsStartX + index * (btnWidth + 30);
      const y = height / 2 + height * 0.35;
      const btn = this.createButton({
        x,
        y,
        width: btnWidth,
        height: btnHeight,
        text: action.text,
        fontSize: 15,
        variant: index === 0 ? 'primary' : 'secondary',
        onClick: action.onClick,
      });
      btn.container.setDepth(302);
    });
  }

  private generateInsights(record: TrainingRecord): Array<{ icon: string; text: string }> {
    const insights: Array<{ icon: string; text: string }> = [];

    if (record.qualityScore >= 80) {
      insights.push({ icon: '✅', text: `质量控制出色，得分 ${record.qualityScore} 分！继续保持严谨标准。` });
    } else if (record.qualityScore < 60) {
      insights.push({ icon: '⚠️', text: `质量得分较低 (${record.qualityScore})，需更加关注施工规范和验收标准。` });
    }

    if (record.costScore >= 80) {
      insights.push({ icon: '💰', text: `成本控制优秀，仅花费 ¥${record.actualCost.toLocaleString()}，预算使用合理。` });
    } else if (record.costScore < 60) {
      insights.push({ icon: '💸', text: `成本超支，预算 ¥${record.budget.toLocaleString()}，实际花费 ¥${record.actualCost.toLocaleString()}。` });
    }

    if (record.mistakes.length === 0) {
      insights.push({ icon: '🎯', text: '完美！没有记录任何错误决策，展现了出色的项目管理能力。' });
    } else {
      insights.push({ icon: '📝', text: `共发生 ${record.mistakes.length} 次错误，建议多查看验收照片确认问题细节。` });
    }

    if (record.materialDelays.length === 0) {
      insights.push({ icon: '📦', text: '材料管理到位，未发生任何延期事件，供应链掌控良好。' });
    } else {
      insights.push({ icon: '⏰', text: `${record.materialDelays.length} 次材料延期，建议提前规划材料采购时间表。` });
    }

    if (record.rating === 'S' || record.rating === 'A') {
      insights.push({ icon: '🏆', text: `${record.rating} 级评价！表现优秀，可以尝试挑战更高难度的关卡。` });
    }

    if (insights.length < 4) {
      insights.push({ icon: '📈', text: `本次训练用时 ${Math.round((record.endTime - record.startTime) / 1000 / 60)} 分钟，熟能生巧！` });
    }

    return insights;
  }

  private handleBack(): void {
    this.emitEvent(GameEvent.AUDIO_PLAY, { type: 'sfx', key: 'cancel' });
    this.transitionToScene(this.fromScene);
  }
}
