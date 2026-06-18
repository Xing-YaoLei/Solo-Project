import Phaser from 'phaser';
import { BaseScene, COLORS, FONT_FAMILY, UIElement } from './BaseScene';
import { GameEvent } from '../core';
import { configManager } from '../core/ConfigManager';
import { TrainingRecord, Rating, MistakeRecord, MaterialDelayRecord } from '../models';

interface SettlementSceneData {
  levelId?: string;
  taskId?: string;
  recordId?: string;
}

export class SettlementScene extends BaseScene {
  private currentLevelId: string | null = null;
  private currentTaskId: string | null = null;
  private record: TrainingRecord | null = null;
  private currentSection: 'overview' | 'mistakes' | 'delays' | 'suggestions' = 'overview';
  private activeSectionTab: Map<string, UIElement> = new Map();
  private contentContainer: Phaser.GameObjects.Container | null = null;

  constructor() {
    super('SettlementScene');
  }

  init(data: SettlementSceneData): void {
    this.currentLevelId = data?.levelId || null;
    this.currentTaskId = data?.taskId || null;

    if (data?.recordId) {
      const records = this.saveSystem.loadTrainingRecords();
      this.record = records.find((r) => r.id === data.recordId) || null;
    }

    if (!this.record) {
      const allRecords = this.saveSystem.loadTrainingRecords();
      const levelRecords = allRecords.filter(
        (r) => (!this.currentLevelId || r.levelId === this.currentLevelId)
      );
      if (levelRecords.length > 0) {
        this.record = levelRecords[levelRecords.length - 1];
      }
    }
  }

  create(): void {
    super.create();

    this.createBackground();
    this.createHeader();
    this.createScoreCard();
    this.createSectionTabs();
    this.createContentContainer();
    this.createFooterButtons();
    this.showSection('overview');

    this.fadeIn(500);

    this.emitEvent(GameEvent.SCENE_CHANGED, { scene: 'SettlementScene' });
  }

  private createHeader(): void {
    const { width } = this.scale;

    const headerBg = this.add.rectangle(width / 2, 50, width, 80, COLORS.PANEL);
    headerBg.setStrokeStyle(2, COLORS.PANEL_BORDER);

    const level = this.currentLevelId ? configManager.getLevelById(this.currentLevelId) : null;
    const titleText = level ? `${level.name} - 结算报告` : '训练结算';

    this.createText(width / 2, 50, `🏆 ${titleText}`, {
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
      onClick: () => this.handleBackToLevelSelect(),
    });
    this.uiElements.set('backButton', backButton);

    const dateText = this.record ? new Date(this.record.endTime).toLocaleString('zh-CN') : '-';
    this.createText(
      width - 30,
      40,
      `完成时间: ${dateText}`,
      {
        fontSize: 13,
        color: COLORS.TEXT_SECONDARY,
        origin: { x: 1, y: 0.5 },
      }
    );

    const playerName = this.saveSystem.getCurrentSave()?.playerName || '玩家';
    this.createText(
      width - 30,
      65,
      `项目经理: ${playerName}`,
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

  private createScoreCard(): void {
    const { width } = this.scale;
    const panelWidth = width * 0.9;
    const panelHeight = 220;

    const panel = this.createPanel(width / 2, 210, panelWidth, panelHeight, '得分概览');

    if (!this.record) {
      const placeholder = this.createText(width / 2, 210, '暂无训练记录', {
        fontSize: 18,
        color: COLORS.TEXT_DISABLED,
      });
      panel.add(placeholder);
      return;
    }

    const rating = this.record.rating;
    const ratingInfo = this.getRatingInfo(rating);

    const totalScoreContainer = this.add.container(width / 2 - panelWidth / 2 + 150, 210);

    const ratingCircle = this.add.circle(0, 0, 70, COLORS.PRIMARY_DARK);
    ratingCircle.setStrokeStyle(4, ratingInfo.color);

    const ratingText = this.createText(0, -10, rating, {
      fontSize: 48,
      fontStyle: 'bold',
      color: ratingInfo.color,
    });

    const scoreLabel = this.createText(0, 35, `总分: ${this.record.score}`, {
      fontSize: 18,
      fontStyle: 'bold',
      color: COLORS.TEXT,
    });

    const perfectText = this.record.isPerfect ? this.createText(0, 60, '✨ 完美通关 ✨', {
      fontSize: 14,
      color: COLORS.WARNING,
    }) : null;

    totalScoreContainer.add([ratingCircle, ratingText, scoreLabel]);
    if (perfectText) totalScoreContainer.add(perfectText);

    panel.add(totalScoreContainer);

    const scoreCategories = [
      {
        key: 'quality',
        label: '质量得分',
        value: this.record.qualityScore,
        max: 100,
        icon: '🛠️',
        color: COLORS.SUCCESS,
      },
      {
        key: 'cost',
        label: '成本得分',
        value: this.record.costScore,
        max: 100,
        icon: '💰',
        color: COLORS.ACCENT,
      },
      {
        key: 'time',
        label: '时间得分',
        value: this.record.timeScore,
        max: 100,
        icon: '⏱️',
        color: COLORS.PRIMARY_LIGHT,
      },
    ];

    const categoryWidth = (panelWidth - 400) / 3;
    scoreCategories.forEach((cat, index) => {
      const x = width / 2 - 50 + index * (categoryWidth + 20) - ((scoreCategories.length - 1) * (categoryWidth + 20)) / 2 + categoryWidth / 2;
      const container = this.add.container(x, 210);

      const bg = this.add.rectangle(0, 0, categoryWidth, 160, COLORS.PANEL_BORDER);
      bg.setStrokeStyle(2, cat.color);

      const iconText = this.createText(0, -55, cat.icon, {
        fontSize: 32,
      });

      const labelText = this.createText(0, -20, cat.label, {
        fontSize: 14,
        color: COLORS.TEXT_SECONDARY,
      });

      const valueText = this.createText(0, 15, `${cat.value}`, {
        fontSize: 36,
        fontStyle: 'bold',
        color: cat.color,
      });

      const barWidth = categoryWidth - 40;
      const barBg = this.add.rectangle(0, 50, barWidth, 10, COLORS.PRIMARY_DARK);
      const barFillWidth = (cat.value / cat.max) * barWidth;
      const barFill = this.add.rectangle(-barWidth / 2 + barFillWidth / 2, 50, barFillWidth, 10, cat.color);

      const percentText = this.createText(0, 70, `${Math.round((cat.value / cat.max) * 100)}%`, {
        fontSize: 12,
        color: COLORS.TEXT_SECONDARY,
      });

      container.add([bg, iconText, labelText, valueText, barBg, barFill, percentText]);
      panel.add(container);
    });

    const detailStats = [
      { label: '预算', actual: `¥${this.record.actualCost.toLocaleString()}`, planned: `¥${this.record.budget.toLocaleString()}`, deviation: this.record.costDeviation },
      { label: '工期', actual: `${this.record.actualDuration}天`, planned: `${this.record.plannedDuration}天`, deviation: this.record.timeDeviation },
    ];

    detailStats.forEach((stat, index) => {
      const y = 210 + (index - 0.5) * 40;
      const x = width / 2 - panelWidth / 2 + 150;

      const label = this.createText(x - 100, y, stat.label, {
        fontSize: 13,
        color: COLORS.TEXT_SECONDARY,
        origin: { x: 0, y: 0.5 },
      });

      const actual = this.createText(x, y, stat.actual, {
        fontSize: 14,
        color: COLORS.TEXT,
        fontStyle: 'bold',
        origin: { x: 0, y: 0.5 },
      });

      const planned = this.createText(x + 110, y, `(${stat.planned})`, {
        fontSize: 12,
        color: COLORS.TEXT_DISABLED,
        origin: { x: 0, y: 0.5 },
      });

      const deviationColor = stat.deviation > 0 ? COLORS.ERROR : stat.deviation < 0 ? COLORS.WARNING : COLORS.SUCCESS;
      const deviationPrefix = stat.deviation > 0 ? '+' : '';
      const deviation = this.createText(x + 220, y, `${deviationPrefix}${stat.deviation}`, {
        fontSize: 13,
        color: deviationColor,
        fontStyle: 'bold',
        origin: { x: 0, y: 0.5 },
      });

      panel.add([label, actual, planned, deviation]);
    });
  }

  private createSectionTabs(): void {
    const { width } = this.scale;
    const tabsY = 360;
    const tabs = [
      { key: 'overview', label: '📊 总览' },
      { key: 'mistakes', label: '❌ 错误原因' },
      { key: 'delays', label: '📦 材料延期' },
      { key: 'suggestions', label: '💡 改进建议' },
    ];

    const tabWidth = 180;
    const tabHeight = 45;
    const totalWidth = tabs.length * (tabWidth + 10) - 10;
    const startX = width / 2 - totalWidth / 2 + tabWidth / 2;

    tabs.forEach((tab, index) => {
      const x = startX + index * (tabWidth + 10);
      const button = this.createButton({
        x,
        y: tabsY,
        width: tabWidth,
        height: tabHeight,
        text: tab.label,
        fontSize: 14,
        variant: 'secondary',
        onClick: () => this.showSection(tab.key as typeof this.currentSection),
      });
      this.uiElements.set(`tab_${tab.key}`, button);
      this.activeSectionTab.set(tab.key, button);
    });
  }

  private createContentContainer(): void {
    const { width, height } = this.scale;
    const containerHeight = height - 480;
    this.contentContainer = this.createPanel(
      width / 2,
      height / 2 + 80,
      width * 0.9,
      containerHeight,
      ''
    );
  }

  private showSection(section: 'overview' | 'mistakes' | 'delays' | 'suggestions'): void {
    this.currentSection = section;

    this.activeSectionTab.forEach((element, key) => {
      const container = element.container;
      const bg = container.getAt(0) as Phaser.GameObjects.Rectangle;
      if (key === section) {
        bg.fillColor = COLORS.ACCENT;
      } else {
        bg.fillColor = COLORS.PANEL;
      }
    });

    if (!this.contentContainer) return;

    const { width, height } = this.scale;
    const panelX = this.contentContainer.x;
    const panelY = this.contentContainer.y;
    const panelWidth = width * 0.9;
    const panelHeight = height - 480;

    this.contentContainer.list
      .filter((obj) => obj !== this.contentContainer!.list[0] && obj !== this.contentContainer!.list[1])
      .forEach((obj) => obj.destroy());

    switch (section) {
      case 'overview':
        this.renderOverviewSection(panelX, panelY, panelWidth, panelHeight);
        break;
      case 'mistakes':
        this.renderMistakesSection(panelX, panelY, panelWidth, panelHeight);
        break;
      case 'delays':
        this.renderDelaysSection(panelX, panelY, panelWidth, panelHeight);
        break;
      case 'suggestions':
        this.renderSuggestionsSection(panelX, panelY, panelWidth, panelHeight);
        break;
    }
  }

  private renderOverviewSection(x: number, y: number, width: number, height: number): void {
    if (!this.record) {
      const placeholder = this.createText(x, y, '暂无数据', {
        fontSize: 18,
        color: COLORS.TEXT_DISABLED,
      });
      this.contentContainer!.add(placeholder);
      return;
    }

    const leftColX = x - width / 2 + 30;
    const rightColX = x + width / 2 - 30;
    const startY = y - height / 2 + 40;
    let leftY = startY;
    let rightY = startY;

    const decisionStats = [
      { label: '决策总数', value: this.record.decisions.length, icon: '🎯' },
      { label: '积极结果', value: this.record.decisions.filter((d) => d.outcome === 'positive').length, icon: '✅' },
      { label: '消极结果', value: this.record.decisions.filter((d) => d.outcome === 'negative').length, icon: '⚠️' },
    ];

    decisionStats.forEach((stat, index) => {
      const container = this.add.container(leftColX + 100, leftY + index * 50);
      const bg = this.add.rectangle(0, 0, 200, 40, COLORS.PANEL_BORDER);
      bg.setStrokeStyle(1, COLORS.PANEL_BORDER);

      const icon = this.createText(-80, 0, stat.icon, { fontSize: 20 });
      const label = this.createText(-50, 0, stat.label, {
        fontSize: 13,
        color: COLORS.TEXT_SECONDARY,
        origin: { x: 0, y: 0.5 },
      });
      const value = this.createText(60, 0, `${stat.value}`, {
        fontSize: 20,
        fontStyle: 'bold',
        color: COLORS.ACCENT,
      });

      container.add([bg, icon, label, value]);
      this.contentContainer!.add(container);
    });
    leftY += decisionStats.length * 50 + 20;

    const mistakeCountTitle = this.createText(leftColX, leftY, '📋 错误类型分布', {
      fontSize: 16,
      fontStyle: 'bold',
      color: COLORS.ACCENT,
      origin: { x: 0, y: 0.5 },
    });
    this.contentContainer!.add(mistakeCountTitle);
    leftY += 30;

    const mistakeGroups = this.groupMistakesByReason(this.record.mistakes);
    Object.entries(mistakeGroups).forEach(([reason, count], index) => {
      const container = this.add.container(leftColX + 100, leftY + index * 35);
      const bg = this.add.rectangle(0, 0, 200, 28, COLORS.PRIMARY_DARK);

      const label = this.createText(-90, 0, this.getMistakeReasonName(reason), {
        fontSize: 12,
        color: COLORS.TEXT,
        origin: { x: 0, y: 0.5 },
      });

      const countText = this.createText(70, 0, `${count}次`, {
        fontSize: 13,
        fontStyle: 'bold',
        color: COLORS.ERROR,
      });

      container.add([bg, label, countText]);
      this.contentContainer!.add(container);
    });

    const performanceTitle = this.createText(rightColX, startY, '📈 绩效指标', {
      fontSize: 16,
      fontStyle: 'bold',
      color: COLORS.ACCENT,
      origin: { x: 1, y: 0.5 },
    });
    this.contentContainer!.add(performanceTitle);
    rightY += 30;

    const indicators = [
      { label: '线索发现率', value: this.calculateClueDiscoveryRate(), color: COLORS.PRIMARY_LIGHT },
      { label: '问题处理率', value: this.calculateProblemResolutionRate(), color: COLORS.SUCCESS },
      { label: '变更单数', value: this.record.changeOrders.length, color: COLORS.WARNING },
      { label: '材料延期数', value: this.record.materialDelays.length, color: COLORS.ERROR },
    ];

    indicators.forEach((ind, index) => {
      const container = this.add.container(rightColX - 100, rightY + index * 50);
      const bg = this.add.rectangle(0, 0, 200, 40, COLORS.PANEL_BORDER);

      const label = this.createText(-80, 0, ind.label, {
        fontSize: 13,
        color: COLORS.TEXT_SECONDARY,
        origin: { x: 0, y: 0.5 },
      });

      const valueText = this.createText(60, 0, typeof ind.value === 'number' ? `${ind.value}${ind.value <= 1 && ind.value >= 0 ? '%' : ''}` : `${ind.value}`, {
        fontSize: 18,
        fontStyle: 'bold',
        color: ind.color,
      });

      container.add([bg, label, valueText]);
      this.contentContainer!.add(container);
    });
  }

  private renderMistakesSection(x: number, y: number, width: number, height: number): void {
    if (!this.record || this.record.mistakes.length === 0) {
      const placeholder = this.createText(x, y, '🎉 太棒了！本次训练没有记录任何错误！', {
        fontSize: 18,
        color: COLORS.SUCCESS,
      });
      this.contentContainer!.add(placeholder);
      return;
    }

    const mistakes = this.record.mistakes;
    const itemHeight = 70;
    const itemSpacing = 10;
    const itemWidth = width - 60;
    const startY = y - height / 2 + 40;

    mistakes.slice(0, Math.floor((height - 80) / (itemHeight + itemSpacing))).forEach((mistake, index) => {
      const itemY = startY + index * (itemHeight + itemSpacing);
      this.renderMistakeItem(x, itemY, itemWidth, itemHeight, mistake, index + 1);
    });

    if (mistakes.length > Math.floor((height - 80) / (itemHeight + itemSpacing))) {
      const moreText = this.createText(x, y + height / 2 - 20, `还有 ${mistakes.length - Math.floor((height - 80) / (itemHeight + itemSpacing))} 条错误记录未显示...`, {
        fontSize: 13,
        color: COLORS.TEXT_SECONDARY,
      });
      this.contentContainer!.add(moreText);
    }
  }

  private renderMistakeItem(
    centerX: number,
    y: number,
    width: number,
    height: number,
    mistake: MistakeRecord,
    number: number
  ): void {
    const container = this.add.container(centerX, y);

    const bg = this.add.rectangle(0, 0, width, height, COLORS.PANEL_BORDER);
    bg.setStrokeStyle(1, COLORS.ERROR, 0.5);

    const numberBg = this.add.circle(-width / 2 + 35, 0, 25, COLORS.ERROR, 0.8);
    const numberText = this.createText(-width / 2 + 35, 0, `${number}`, {
      fontSize: 18,
      fontStyle: 'bold',
      color: COLORS.TEXT,
    });

    const reasonName = this.getMistakeReasonName(mistake.reason);
    const reasonText = this.add.text(-width / 2 + 75, -height / 2 + 18, reasonName, {
      fontFamily: FONT_FAMILY,
      fontSize: '15px',
      color: `#${COLORS.ERROR.toString(16).padStart(6, '0')}`,
      fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    const phaseText = this.add.text(width / 2 - 20, -height / 2 + 18, `阶段: ${this.getPhaseName(mistake.phase)}`, {
      fontFamily: FONT_FAMILY,
      fontSize: '12px',
      color: `#${COLORS.TEXT_SECONDARY.toString(16).padStart(6, '0')}`,
    }).setOrigin(1, 0.5);

    const descText = this.add.text(-width / 2 + 75, 5, mistake.description, {
      fontFamily: FONT_FAMILY,
      fontSize: '13px',
      color: '#ffffff',
    }).setOrigin(0, 0);
    descText.setWordWrapWidth(width - 180);

    const penaltyText = this.add.text(width / 2 - 20, 5, `-${mistake.penalty}分`, {
      fontFamily: FONT_FAMILY,
      fontSize: '16px',
      color: `#${COLORS.ERROR.toString(16).padStart(6, '0')}`,
      fontStyle: 'bold',
    }).setOrigin(1, 0.5);

    container.add([bg, numberBg, numberText, reasonText, phaseText, descText, penaltyText]);
    this.contentContainer!.add(container);
  }

  private renderDelaysSection(x: number, y: number, width: number, height: number): void {
    if (!this.record || this.record.materialDelays.length === 0) {
      const placeholder = this.createText(x, y, '🎉 太棒了！本次训练没有材料延期！', {
        fontSize: 18,
        color: COLORS.SUCCESS,
      });
      this.contentContainer!.add(placeholder);
      return;
    }

    const delays = this.record.materialDelays;
    const totalDelayDays = delays.reduce((sum, d) => sum + d.delayDays, 0);

    const summaryContainer = this.add.container(x, y - height / 2 + 40);
    const summaryBg = this.add.rectangle(0, 0, width - 60, 60, COLORS.WARNING, 0.15);
    summaryBg.setStrokeStyle(2, COLORS.WARNING);

    const summaryText = this.createText(0, -10, `📦 材料延期汇总`, {
      fontSize: 16,
      fontStyle: 'bold',
      color: COLORS.WARNING,
    });

    const summaryDetail = this.createText(0, 15, `共 ${delays.length} 次延期，累计延期 ${totalDelayDays} 天`, {
      fontSize: 14,
      color: COLORS.TEXT,
    });

    summaryContainer.add([summaryBg, summaryText, summaryDetail]);
    this.contentContainer!.add(summaryContainer);

    const itemHeight = 80;
    const itemSpacing = 10;
    const itemWidth = width - 60;
    const startY = y - height / 2 + 110;

    delays.slice(0, Math.floor((height - 180) / (itemHeight + itemSpacing))).forEach((delay, index) => {
      const itemY = startY + index * (itemHeight + itemSpacing);
      this.renderDelayItem(x, itemY, itemWidth, itemHeight, delay, index + 1);
    });
  }

  private renderDelayItem(
    centerX: number,
    y: number,
    width: number,
    height: number,
    delay: MaterialDelayRecord,
    number: number
  ): void {
    const container = this.add.container(centerX, y);

    const bg = this.add.rectangle(0, 0, width, height, COLORS.PANEL_BORDER);
    bg.setStrokeStyle(1, COLORS.WARNING, 0.5);

    const numberBg = this.add.circle(-width / 2 + 35, 0, 25, COLORS.WARNING, 0.8);
    const numberText = this.createText(-width / 2 + 35, 0, `${number}`, {
      fontSize: 18,
      fontStyle: 'bold',
      color: COLORS.TEXT,
    });

    const materialName = this.add.text(-width / 2 + 75, -height / 2 + 20, `📦 ${delay.materialName}`, {
      fontFamily: FONT_FAMILY,
      fontSize: '16px',
      color: `#${COLORS.WARNING.toString(16).padStart(6, '0')}`,
      fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    const phaseText = this.add.text(width / 2 - 20, -height / 2 + 20, `阶段: ${this.getPhaseName(delay.phase)}`, {
      fontFamily: FONT_FAMILY,
      fontSize: '12px',
      color: `#${COLORS.TEXT_SECONDARY.toString(16).padStart(6, '0')}`,
    }).setOrigin(1, 0.5);

    const dateText = this.add.text(-width / 2 + 75, 5, `计划: 第${delay.plannedDate}天 → 实际: 第${delay.actualDate}天`, {
      fontFamily: FONT_FAMILY,
      fontSize: '13px',
      color: '#ffffff',
    }).setOrigin(0, 0.5);

    const delayText = this.add.text(width / 2 - 20, 5, `延期 ${delay.delayDays} 天`, {
      fontFamily: FONT_FAMILY,
      fontSize: '16px',
      color: `#${COLORS.ERROR.toString(16).padStart(6, '0')}`,
      fontStyle: 'bold',
    }).setOrigin(1, 0.5);

    const impactText = this.add.text(-width / 2 + 75, height / 2 - 15, `💥 影响: ${delay.impact}`, {
      fontFamily: FONT_FAMILY,
      fontSize: '12px',
      color: `#${COLORS.TEXT_SECONDARY.toString(16).padStart(6, '0')}`,
    }).setOrigin(0, 0.5);

    container.add([bg, numberBg, numberText, materialName, phaseText, dateText, delayText, impactText]);
    this.contentContainer!.add(container);
  }

  private renderSuggestionsSection(x: number, y: number, width: number, height: number): void {
    const suggestions = this.generateSuggestions();
    const startY = y - height / 2 + 40;
    const itemHeight = 80;
    const itemSpacing = 12;

    suggestions.forEach((suggestion, index) => {
      const itemY = startY + index * (itemHeight + itemSpacing);
      this.renderSuggestionItem(x, itemY, width - 60, itemHeight, suggestion, index + 1);
    });
  }

  private renderSuggestionItem(
    centerX: number,
    y: number,
    width: number,
    height: number,
    suggestion: { icon: string; title: string; priority: 'high' | 'medium' | 'low'; content: string },
    number: number
  ): void {
    const container = this.add.container(centerX, y);

    const priorityColors = {
      high: { bg: COLORS.ERROR, text: COLORS.ERROR, label: '高优先级' },
      medium: { bg: COLORS.WARNING, text: COLORS.WARNING, label: '中优先级' },
      low: { bg: COLORS.SUCCESS, text: COLORS.SUCCESS, label: '低优先级' },
    };
    const pc = priorityColors[suggestion.priority];

    const bg = this.add.rectangle(0, 0, width, height, COLORS.PANEL_BORDER);
    bg.setStrokeStyle(2, pc.bg, 0.6);

    const numBg = this.add.rectangle(-width / 2 + 35, 0, 50, 50, pc.bg, 0.2);
    numBg.setStrokeStyle(2, pc.bg);
    const numText = this.createText(-width / 2 + 35, 0, suggestion.icon, {
      fontSize: 26,
    });

    const titleText = this.add.text(-width / 2 + 75, -height / 2 + 20, `${number}. ${suggestion.title}`, {
      fontFamily: FONT_FAMILY,
      fontSize: '15px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    const priorityLabel = this.add.text(width / 2 - 20, -height / 2 + 20, pc.label, {
      fontFamily: FONT_FAMILY,
      fontSize: '12px',
      color: `#${pc.text.toString(16).padStart(6, '0')}`,
      fontStyle: 'bold',
    }).setOrigin(1, 0.5);

    const contentText = this.add.text(-width / 2 + 75, 10, suggestion.content, {
      fontFamily: FONT_FAMILY,
      fontSize: '13px',
      color: `#${COLORS.TEXT_SECONDARY.toString(16).padStart(6, '0')}`,
    }).setOrigin(0, 0);
    contentText.setWordWrapWidth(width - 110);

    container.add([bg, numBg, numText, titleText, priorityLabel, contentText]);
    this.contentContainer!.add(container);
  }

  private createFooterButtons(): void {
    const { width, height } = this.scale;

    const buttons = [
      {
        text: '📋 查看记录',
        variant: 'secondary' as const,
        onClick: () => this.handleViewRecords(),
      },
      {
        text: '🔄 重新挑战',
        variant: 'secondary' as const,
        onClick: () => this.handleRetryLevel(),
      },
      {
        text: '➡️ 下一关',
        variant: 'primary' as const,
        onClick: () => this.handleNextLevel(),
      },
    ];

    const btnWidth = 180;
    const btnHeight = 50;
    const spacing = 30;
    const totalWidth = buttons.length * btnWidth + (buttons.length - 1) * spacing;
    const startX = width / 2 - totalWidth / 2 + btnWidth / 2;

    buttons.forEach((btn, index) => {
      const x = startX + index * (btnWidth + spacing);
      const button = this.createButton({
        x,
        y: height - 50,
        width: btnWidth,
        height: btnHeight,
        text: btn.text,
        fontSize: 16,
        variant: btn.variant,
        onClick: btn.onClick,
      });
      this.uiElements.set(`footer_btn_${index}`, button);
    });
  }

  private generateSuggestions(): Array<{ icon: string; title: string; priority: 'high' | 'medium' | 'low'; content: string }> {
    const suggestions: Array<{ icon: string; title: string; priority: 'high' | 'medium' | 'low'; content: string }> = [];

    if (!this.record) {
      return [
        {
          icon: '📚',
          title: '认真学习基础教程',
          priority: 'high',
          content: '建议先完成新手教程，了解游戏的基本玩法和验收照片的使用方法。',
        },
      ];
    }

    if (this.record.qualityScore < 60) {
      suggestions.push({
        icon: '🛠️',
        title: '提升施工质量',
        priority: 'high',
        content: '质量得分偏低。建议仔细检查每个线索，选择最合适的处理动作，而不是只看成本最低的选项。',
      });
    }

    if (this.record.costScore < 60) {
      suggestions.push({
        icon: '💰',
        title: '控制项目成本',
        priority: 'high',
        content: '成本超支严重。在处理问题时，建议对比不同动作的性价比，避免过度修复带来的额外开支。',
      });
    }

    if (this.record.timeScore < 60) {
      suggestions.push({
        icon: '⏱️',
        title: '优化工期管理',
        priority: 'high',
        content: '项目延期严重。建议合理规划动作顺序，并行处理独立问题，同时关注材料到货时间。',
      });
    }

    const missedClues = this.record.mistakes.filter((m) => m.reason === 'missed_clue');
    if (missedClues.length > 0) {
      suggestions.push({
        icon: '🔍',
        title: '仔细检查每个角落',
        priority: 'medium',
        content: `本次共遗漏 ${missedClues.length} 个线索。请多查看验收照片，对比标准图找出差异，线索往往藏在细节中。`,
      });
    }

    const wrongActions = this.record.mistakes.filter((m) => m.reason === 'wrong_action');
    if (wrongActions.length > 0) {
      suggestions.push({
        icon: '🎯',
        title: '选择正确的处理方案',
        priority: 'medium',
        content: `有 ${wrongActions.length} 个问题处理不当。建议在选择动作前，仔细阅读线索描述和动作说明。`,
      });
    }

    if (this.record.materialDelays.length > 0) {
      suggestions.push({
        icon: '📦',
        title: '提前规划材料供应',
        priority: 'medium',
        content: '发生了材料延期事件。建议在项目早期就确认材料订单，预留缓冲时间以应对可能的供应链问题。',
      });
    }

    if (this.record.changeOrders.length > 0) {
      suggestions.push({
        icon: '📋',
        title: '减少变更单数量',
        priority: 'low',
        content: `生成了 ${this.record.changeOrders.length} 份变更单。尽量在阶段验收前处理所有问题，避免后期变更增加成本。`,
      });
    }

    if (suggestions.length === 0) {
      suggestions.push({
        icon: '⭐',
        title: '保持优秀表现',
        priority: 'low',
        content: '本次训练表现出色！继续保持严谨的工作态度，挑战更高难度的关卡。',
      });
    }

    return suggestions.slice(0, 5);
  }

  private calculateClueDiscoveryRate(): number {
    if (!this.record) return 0;
    const level = this.currentLevelId ? configManager.getLevelById(this.currentLevelId) : null;
    const totalClues = level?.clues.length || 1;
    const missedClues = this.record.mistakes.filter((m) => m.reason === 'missed_clue').length;
    const discovered = Math.max(0, totalClues - missedClues);
    return Math.round((discovered / totalClues) * 100);
  }

  private calculateProblemResolutionRate(): number {
    if (!this.record) return 0;
    const totalMistakes = this.record.mistakes.length || 1;
    const wrongActions = this.record.mistakes.filter((m) => m.reason === 'wrong_action').length;
    const resolved = Math.max(0, totalMistakes - wrongActions);
    return Math.round((resolved / totalMistakes) * 100);
  }

  private groupMistakesByReason(mistakes: MistakeRecord[]): Record<string, number> {
    const groups: Record<string, number> = {};
    mistakes.forEach((m) => {
      groups[m.reason] = (groups[m.reason] || 0) + 1;
    });
    return groups;
  }

  private getRatingInfo(rating: Rating): { name: string; color: number } {
    const info: Record<Rating, { name: string; color: number }> = {
      S: { name: '卓越', color: 0xf1c40f },
      A: { name: '优秀', color: 0x2ecc71 },
      B: { name: '良好', color: 0x3498db },
      C: { name: '合格', color: 0x9b59b6 },
      D: { name: '待改进', color: 0xe74c3c },
    };
    return info[rating] || { name: '未知', color: COLORS.TEXT };
  }

  private getMistakeReasonName(reason: string): string {
    const names: Record<string, string> = {
      missed_clue: '❓ 遗漏线索',
      wrong_action: '⚠️ 处理不当',
      delayed_material: '📦 材料延期',
      poor_quality: '🔧 质量问题',
      over_budget: '💸 预算超支',
      over_time: '⏰ 工期延误',
    };
    return names[reason] || reason;
  }

  private getPhaseName(phase: string): string {
    const phaseMap: Record<string, string> = {
      preparation: '准备阶段',
      demolition: '拆除阶段',
      water_electric: '水电改造',
      masonry: '泥瓦工程',
      woodwork: '木工制作',
      painting: '油漆工程',
      installation: '安装阶段',
      final: '收尾阶段',
      inspection: '最终验收',
    };
    return phaseMap[phase] || phase;
  }

  private handleBackToLevelSelect(): void {
    this.emitEvent(GameEvent.AUDIO_PLAY, { type: 'sfx', key: 'cancel' });
    this.transitionToScene('LevelSelectScene', { taskId: this.currentTaskId });
  }

  private handleViewRecords(): void {
    this.emitEvent(GameEvent.AUDIO_PLAY, { type: 'sfx', key: 'confirm' });
    this.transitionToScene('RecordsScene', { fromScene: 'SettlementScene' });
  }

  private handleRetryLevel(): void {
    this.emitEvent(GameEvent.AUDIO_PLAY, { type: 'sfx', key: 'confirm' });
    this.transitionToScene('ConstructionSiteScene', {
      levelId: this.currentLevelId,
      taskId: this.currentTaskId,
    });
  }

  private handleNextLevel(): void {
    this.emitEvent(GameEvent.AUDIO_PLAY, { type: 'sfx', key: 'confirm' });

    const allLevels = Object.values(configManager.getAllLevels() || {});
    const currentIndex = allLevels.findIndex((l) => l.id === this.currentLevelId);

    if (currentIndex >= 0 && currentIndex < allLevels.length - 1) {
      const nextLevel = allLevels[currentIndex + 1];
      this.transitionToScene('ConstructionSiteScene', {
        levelId: nextLevel.id,
        taskId: this.currentTaskId,
      });
    } else {
      this.showNotification('🎉 恭喜！已完成所有关卡！');
      this.time.delayedCall(1500, () => {
        this.transitionToScene('LevelSelectScene', { taskId: this.currentTaskId });
      });
    }
  }

  private showNotification(message: string): void {
    const { width } = this.scale;
    const notification = this.add.container(width / 2, 130);

    const bg = this.add.rectangle(0, 0, 400, 50, 0x1f4a3e);
    bg.setStrokeStyle(2, COLORS.SUCCESS);
    bg.setAlpha(0.95);

    const text = this.createText(0, 0, message, {
      fontSize: 15,
      color: COLORS.TEXT,
    });

    notification.add([bg, text]);
    notification.setDepth(300);
    notification.setAlpha(0);

    this.tweens.add({
      targets: notification,
      alpha: 1,
      duration: 300,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.time.delayedCall(2000, () => {
          this.tweens.add({
            targets: notification,
            alpha: 0,
            duration: 300,
            ease: 'Back.easeIn',
            onComplete: () => notification.destroy(),
          });
        });
      },
    });
  }
}
