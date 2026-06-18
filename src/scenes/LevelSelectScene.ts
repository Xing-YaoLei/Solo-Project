import { BaseScene, COLORS, FONT_FAMILY, UIElement } from './BaseScene';
import { GameEvent } from '../core';
import { taskSystem } from '../systems/TaskSystem';
import { configManager } from '../core/ConfigManager';
import { saveSystem } from '../core/SaveSystem';
import { Level, Task, ConstructionPhase } from '../models';

interface LevelSelectSceneData {
  taskId?: string;
}

export class LevelSelectScene extends BaseScene {
  private currentTaskId: string | null = null;
  private currentTask: Task | null = null;
  private levels: Level[] = [];
  private levelNodes: Map<string, UIElement> = new Map();
  private phaseLabels: Phaser.GameObjects.Text[] = [];
  private selectedLevelId: string | null = null;
  private infoPanel: Phaser.GameObjects.Container | null = null;
  private timelineContainer: Phaser.GameObjects.Container | null = null;

  constructor() {
    super('LevelSelectScene');
  }

  init(data: LevelSelectSceneData): void {
    this.currentTaskId = data?.taskId || null;
  }

  create(): void {
    super.create();

    this.createBackground();
    this.loadTaskData();
    this.createHeader();
    this.createTimeline();
    this.createInfoPanel();
    this.createFooter();

    this.fadeIn(500);

    this.emitEvent(GameEvent.SCENE_CHANGED, { scene: 'LevelSelectScene' });
  }

  private loadTaskData(): void {
    if (!this.currentTaskId) {
      const activeTasks = saveSystem.getCurrentSave()?.activeTasks || [];
      if (activeTasks.length > 0) {
        this.currentTaskId = activeTasks[activeTasks.length - 1];
      }
    }

    if (this.currentTaskId) {
      this.currentTask = taskSystem.getTaskById(this.currentTaskId) || null;
      this.levels = configManager.getLevelsByTaskId(this.currentTaskId);
    }

    if (!this.currentTask || this.levels.length === 0) {
      const allTasks = taskSystem.getAvailableTasks();
      if (allTasks.length > 0) {
        this.currentTask = allTasks[0];
        this.currentTaskId = this.currentTask.id;
        this.levels = configManager.getLevelsByTaskId(this.currentTaskId);
      }
    }
  }

  private createHeader(): void {
    const { width } = this.scale;

    const headerBg = this.add.rectangle(width / 2, 50, width, 80, COLORS.PANEL);
    headerBg.setStrokeStyle(2, COLORS.PANEL_BORDER);

    this.createText(width / 2, 50, '施工阶段', {
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

    if (this.currentTask) {
      this.createText(width - 30, 40, this.currentTask.title, {
        fontSize: 16,
        color: COLORS.ACCENT,
        origin: { x: 1, y: 0.5 },
      });

      this.createText(width - 30, 65, `客户: ${this.currentTask.clientName}`, {
        fontSize: 14,
        color: COLORS.TEXT_SECONDARY,
        origin: { x: 1, y: 0.5 },
      });
    }

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

  private createTimeline(): void {
    const { width, height } = this.scale;

    this.timelineContainer = this.add.container(width / 2, height * 0.45);

    const timelineBg = this.add.rectangle(0, 0, width * 0.9, height * 0.7, COLORS.PANEL);
    timelineBg.setStrokeStyle(2, COLORS.PANEL_BORDER);
    this.timelineContainer.add(timelineBg);

    const timelineTitle = this.createText(0, -height * 0.3, '施工进度时间线', {
      fontSize: 22,
      fontStyle: 'bold',
      color: COLORS.ACCENT,
    });
    this.timelineContainer.add(timelineTitle);

    this.renderPhasesTimeline();
    this.renderLevelNodes();
  }

  private renderPhasesTimeline(): void {
    if (!this.timelineContainer || !this.currentTask) return;

    const { width } = this.scale;
    const allPhases = this.getAllPhases();

    const timelineY = -50;
    const startX = -width * 0.4;
    const endX = width * 0.4;
    const segmentWidth = (endX - startX) / (allPhases.length - 1);

    const timelineLineBg = this.add.rectangle(0, timelineY, width * 0.8, 6, COLORS.PANEL_BORDER);
    this.timelineContainer.add(timelineLineBg);

    const timelineLine = this.add.rectangle(0, timelineY, width * 0.8, 3, COLORS.PRIMARY_LIGHT);
    this.timelineContainer.add(timelineLine);

    allPhases.forEach((phase, index) => {
      const x = startX + index * segmentWidth;
      const phaseInfo = this.getPhaseInfo(phase);

      const isCompleted = this.isPhaseCompleted(phase);
      const isCurrent = this.isPhaseCurrent(phase);
      const isLocked = this.isPhaseLocked(phase);

      const nodeColor = isCompleted
        ? COLORS.SUCCESS
        : isCurrent
        ? COLORS.ACCENT
        : isLocked
        ? COLORS.TEXT_DISABLED
        : COLORS.PRIMARY_LIGHT;

      const node = this.add.circle(x, timelineY, 15, nodeColor);
      node.setStrokeStyle(3, COLORS.PANEL_BORDER);
      this.timelineContainer!.add(node);

      if (isCompleted) {
        const checkMark = this.createText(x, timelineY + 1, '✓', {
          fontSize: 16,
          fontStyle: 'bold',
          color: COLORS.TEXT,
        });
        this.timelineContainer!.add(checkMark);
      }

      const label = this.createText(x, timelineY + 50, phaseInfo.name, {
        fontSize: 14,
        color: isLocked ? COLORS.TEXT_DISABLED : COLORS.TEXT,
      });
      this.timelineContainer!.add(label);
      this.phaseLabels.push(label);

      const icon = this.createText(x, timelineY - 40, phaseInfo.icon, {
        fontSize: 24,
        color: isLocked ? COLORS.TEXT_DISABLED : COLORS.ACCENT,
      });
      this.timelineContainer!.add(icon);
    });
  }

  private renderLevelNodes(): void {
    if (!this.timelineContainer) return;

    const { width } = this.scale;
    const startX = -width * 0.35;
    const endX = width * 0.35;
    const nodeSpacing = (endX - startX) / Math.max(1, this.levels.length - 1);

    this.levels.forEach((level, index) => {
      const x = startX + index * nodeSpacing;
      const y = 80;

      const node = this.createLevelNode(level, x, y, index);
      this.levelNodes.set(level.id, node);
      this.timelineContainer!.add(node.container);

      node.container.setAlpha(0);
      node.container.setScale(0.5);
      this.tweens.add({
        targets: node.container,
        alpha: 1,
        scale: 1,
        duration: 500,
        delay: index * 200,
        ease: 'Back.easeOut',
      });
    });
  }

  private createLevelNode(level: Level, x: number, y: number, index: number): UIElement {
    const container = this.add.container(x, y);

    const isUnlocked = this.isLevelUnlocked(level);
    const isCompleted = this.isLevelCompleted(level);

    const nodeWidth = 220;
    const nodeHeight = 100;

    const bgColor = isCompleted
      ? COLORS.SUCCESS
      : isUnlocked
      ? COLORS.PRIMARY
      : COLORS.PRIMARY_DARK;

    const bg = this.add.rectangle(0, 0, nodeWidth, nodeHeight, bgColor);
    bg.setStrokeStyle(3, isUnlocked ? COLORS.ACCENT : COLORS.PANEL_BORDER);
    bg.setAlpha(isUnlocked ? 1 : 0.6);

    const cornerDecor = this.add.graphics();
    cornerDecor.lineStyle(2, COLORS.ACCENT, isUnlocked ? 1 : 0.3);
    const cornerSize = 12;
    cornerDecor.beginPath();
    cornerDecor.moveTo(-nodeWidth / 2 + cornerSize, -nodeHeight / 2);
    cornerDecor.lineTo(-nodeWidth / 2, -nodeHeight / 2);
    cornerDecor.lineTo(-nodeWidth / 2, -nodeHeight / 2 + cornerSize);
    cornerDecor.moveTo(nodeWidth / 2 - cornerSize, -nodeHeight / 2);
    cornerDecor.lineTo(nodeWidth / 2, -nodeHeight / 2);
    cornerDecor.lineTo(nodeWidth / 2, -nodeHeight / 2 + cornerSize);
    cornerDecor.moveTo(-nodeWidth / 2 + cornerSize, nodeHeight / 2);
    cornerDecor.lineTo(-nodeWidth / 2, nodeHeight / 2);
    cornerDecor.lineTo(-nodeWidth / 2, nodeHeight / 2 - cornerSize);
    cornerDecor.moveTo(nodeWidth / 2 - cornerSize, nodeHeight / 2);
    cornerDecor.lineTo(nodeWidth / 2, nodeHeight / 2);
    cornerDecor.lineTo(nodeWidth / 2, nodeHeight / 2 - cornerSize);
    cornerDecor.strokePath();

    const levelNum = this.add.text(-nodeWidth / 2 + 15, -nodeHeight / 2 + 20, `阶段 ${index + 1}`, {
      fontFamily: FONT_FAMILY,
      fontSize: '14px',
      color: `#${COLORS.ACCENT.toString(16).padStart(6, '0')}`,
      fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    const levelName = this.add.text(-nodeWidth / 2 + 15, 0, level.name, {
      fontFamily: FONT_FAMILY,
      fontSize: '18px',
      color: `#${COLORS.TEXT.toString(16).padStart(6, '0')}`,
      fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    const clueCount = level.clues.length;
    const photoCount = level.photos.length;
    const infoText = this.add.text(-nodeWidth / 2 + 15, nodeHeight / 2 - 20, `🔍 ${clueCount} 线索 | 📷 ${photoCount} 照片`, {
      fontFamily: FONT_FAMILY,
      fontSize: '12px',
      color: `#${COLORS.TEXT_SECONDARY.toString(16).padStart(6, '0')}`,
    }).setOrigin(0, 0.5);

    if (isCompleted) {
      const completedBadge = this.add.rectangle(nodeWidth / 2 - 30, -nodeHeight / 2 + 20, 60, 25, COLORS.SUCCESS);
      const completedText = this.add.text(nodeWidth / 2 - 30, -nodeHeight / 2 + 20, '已完成', {
        fontFamily: FONT_FAMILY,
        fontSize: '12px',
        color: '#ffffff',
        fontStyle: 'bold',
      }).setOrigin(0.5);
      container.add([completedBadge, completedText]);
    }

    if (!isUnlocked) {
      const lockIcon = this.add.text(nodeWidth / 2 - 30, 0, '🔒', {
        fontFamily: FONT_FAMILY,
        fontSize: '28px',
      }).setOrigin(0.5);
      container.add(lockIcon);
    }

    container.add([bg, cornerDecor, levelNum, levelName, infoText]);

    if (isUnlocked) {
      bg.setInteractive({ useHandCursor: true });

      bg.on('pointerover', () => {
        bg.fillColor = COLORS.PRIMARY_LIGHT;
        bg.strokeColor = COLORS.ACCENT_LIGHT;
        this.tweens.add({
          targets: container,
          scale: 1.05,
          duration: 200,
          ease: 'Power2.easeOut',
        });
        this.emitEvent(GameEvent.AUDIO_PLAY, { type: 'sfx', key: 'hover' });
      });

      bg.on('pointerout', () => {
        bg.fillColor = bgColor;
        bg.strokeColor = COLORS.ACCENT;
        this.tweens.add({
          targets: container,
          scale: 1,
          duration: 200,
          ease: 'Power2.easeOut',
        });
      });

      bg.on('pointerup', () => {
        this.selectLevel(level);
        this.emitEvent(GameEvent.AUDIO_PLAY, { type: 'sfx', key: 'click' });
      });
    }

    return {
      container,
      destroy: () => container.destroy(),
      setVisible: (visible: boolean) => container.setVisible(visible),
      setEnabled: (enabled: boolean) => {
        if (enabled && isUnlocked) {
          bg.setInteractive({ useHandCursor: true });
          bg.setAlpha(1);
        } else {
          bg.disableInteractive();
          bg.setAlpha(0.6);
        }
      },
    };
  }

  private selectLevel(level: Level): void {
    this.selectedLevelId = level.id;
    this.updateInfoPanel(level);
    this.highlightSelectedLevel(level.id);
    this.emitEvent(GameEvent.LEVEL_SELECTED, { levelId: level.id });
  }

  private highlightSelectedLevel(selectedId: string): void {
    this.levelNodes.forEach((node, id) => {
      const container = node.container;
      const bg = container.getAt(0) as Phaser.GameObjects.Rectangle;
      if (id === selectedId) {
        bg.strokeColor = COLORS.ACCENT;
        bg.lineWidth = 4;
      } else {
        const level = this.levels.find((l) => l.id === id);
        if (level) {
          bg.strokeColor = this.isLevelUnlocked(level) ? COLORS.ACCENT : COLORS.PANEL_BORDER;
        }
        bg.lineWidth = 3;
      }
    });
  }

  private createInfoPanel(): void {
    const { width, height } = this.scale;

    this.infoPanel = this.createPanel(width / 2, height * 0.85, width * 0.85, 180, '关卡详情');

    const placeholderText = this.createText(width / 2, height * 0.85, '请选择一个关卡', {
      fontSize: 18,
      color: COLORS.TEXT_DISABLED,
    });

    this.infoPanel.add(placeholderText);
  }

  private updateInfoPanel(level: Level): void {
    if (!this.infoPanel) return;

    const { width } = this.scale;
    const panelX = this.infoPanel.x;
    const panelY = this.infoPanel.y;

    this.infoPanel.list
      .filter((obj) => obj !== this.infoPanel!.list[0] && obj !== this.infoPanel!.list[1])
      .forEach((obj) => obj.destroy());

    const descText = this.createText(panelX - width * 0.4, panelY - 40, level.description, {
      fontSize: 14,
      color: COLORS.TEXT,
      origin: { x: 0, y: 0 },
    });
    descText.setWordWrapWidth(width * 0.5);

    const statsY = panelY + 30;

    const cluesLabel = this.createText(panelX - width * 0.4, statsY, `🔍 线索数量: ${level.clues.length}`, {
      fontSize: 14,
      color: COLORS.TEXT_SECONDARY,
      origin: { x: 0, y: 0.5 },
    });

    const photosLabel = this.createText(panelX - width * 0.4 + 200, statsY, `📷 验收照片: ${level.photos.length}`, {
      fontSize: 14,
      color: COLORS.TEXT_SECONDARY,
      origin: { x: 0, y: 0.5 },
    });

    const actionsLabel = this.createText(panelX - width * 0.4 + 400, statsY, `⚡ 可用动作: ${level.availableActions.length}`, {
      fontSize: 14,
      color: COLORS.TEXT_SECONDARY,
      origin: { x: 0, y: 0.5 },
    });

    const isUnlocked = this.isLevelUnlocked(level);
    const startButton = this.createButton({
      x: panelX + width * 0.35,
      y: panelY,
      width: 160,
      height: 50,
      text: '开始关卡',
      variant: 'primary',
      disabled: !isUnlocked,
      onClick: () => this.handleStartLevel(),
    });
    this.uiElements.set('startButton', startButton);

    this.infoPanel.add([descText, cluesLabel, photosLabel, actionsLabel, startButton.container]);
  }

  private createFooter(): void {
    const { width, height } = this.scale;

    const footerBg = this.add.rectangle(width / 2, height - 30, width, 40, COLORS.PANEL);
    footerBg.setStrokeStyle(1, COLORS.PANEL_BORDER);

    this.createText(width / 2, height - 30, '点击关卡卡片查看详情 | 完成前置关卡解锁新内容', {
      fontSize: 14,
      color: COLORS.TEXT_SECONDARY,
    });

    const cornerDecorLeft = this.add.graphics();
    cornerDecorLeft.lineStyle(3, COLORS.ACCENT, 1);
    cornerDecorLeft.beginPath();
    cornerDecorLeft.moveTo(0, height - 50);
    cornerDecorLeft.lineTo(30, height - 50);
    cornerDecorLeft.lineTo(30, height - 40);
    cornerDecorLeft.strokePath();

    const cornerDecorRight = this.add.graphics();
    cornerDecorRight.lineStyle(3, COLORS.ACCENT, 1);
    cornerDecorRight.beginPath();
    cornerDecorRight.moveTo(width, height - 50);
    cornerDecorRight.lineTo(width - 30, height - 50);
    cornerDecorRight.lineTo(width - 30, height - 40);
    cornerDecorRight.strokePath();
  }

  private handleStartLevel(): void {
    if (!this.selectedLevelId) return;

    const level = this.levels.find((l) => l.id === this.selectedLevelId);
    if (!level || !this.isLevelUnlocked(level)) return;

    this.emitEvent(GameEvent.AUDIO_PLAY, { type: 'sfx', key: 'confirm' });
    this.emitEvent(GameEvent.LEVEL_STARTED, { levelId: this.selectedLevelId });

    this.transitionToScene('ConstructionSiteScene', {
      levelId: this.selectedLevelId,
      taskId: this.currentTaskId,
    });
  }

  private handleBack(): void {
    this.emitEvent(GameEvent.AUDIO_PLAY, { type: 'sfx', key: 'cancel' });
    this.transitionToScene('TaskHallScene');
  }

  private getAllPhases(): ConstructionPhase[] {
    const phases: Set<ConstructionPhase> = new Set();
    this.levels.forEach((level) => {
      level.phases.forEach((phase) => phases.add(phase));
    });
    return Array.from(phases).sort((a, b) => {
      const order = [
        ConstructionPhase.PREPARATION,
        ConstructionPhase.DEMOLITION,
        ConstructionPhase.WATER_ELECTRIC,
        ConstructionPhase.MASONRY,
        ConstructionPhase.WOODWORK,
        ConstructionPhase.PAINTING,
        ConstructionPhase.INSTALLATION,
        ConstructionPhase.FINAL,
        ConstructionPhase.INSPECTION,
      ];
      return order.indexOf(a) - order.indexOf(b);
    });
  }

  private getPhaseInfo(phase: ConstructionPhase): { name: string; icon: string } {
    const phaseInfo: Record<ConstructionPhase, { name: string; icon: string }> = {
      [ConstructionPhase.PREPARATION]: { name: '准备阶段', icon: '📋' },
      [ConstructionPhase.DEMOLITION]: { name: '拆除阶段', icon: '🔨' },
      [ConstructionPhase.WATER_ELECTRIC]: { name: '水电改造', icon: '💡' },
      [ConstructionPhase.MASONRY]: { name: '泥瓦工程', icon: '🧱' },
      [ConstructionPhase.WOODWORK]: { name: '木工制作', icon: '🪵' },
      [ConstructionPhase.PAINTING]: { name: '油漆工程', icon: '🎨' },
      [ConstructionPhase.INSTALLATION]: { name: '安装阶段', icon: '🔧' },
      [ConstructionPhase.FINAL]: { name: '收尾阶段', icon: '✨' },
      [ConstructionPhase.INSPECTION]: { name: '最终验收', icon: '✅' },
    };
    return phaseInfo[phase] || { name: '未知阶段', icon: '❓' };
  }

  private isPhaseCompleted(phase: ConstructionPhase): boolean {
    const playerSave = saveSystem.getCurrentSave();
    if (!playerSave) return false;

    const phaseLevels = this.levels.filter((l) => l.phases.includes(phase));
    return phaseLevels.every((l) => playerSave.completedLevels.includes(l.id));
  }

  private isPhaseCurrent(phase: ConstructionPhase): boolean {
    const playerSave = saveSystem.getCurrentSave();
    if (!playerSave) return false;

    const allPhases = this.getAllPhases();
    const currentIndex = allPhases.findIndex((p) => {
      const phaseLevels = this.levels.filter((l) => l.phases.includes(p));
      return !phaseLevels.every((l) => playerSave.completedLevels.includes(l.id));
    });

    return allPhases[currentIndex] === phase;
  }

  private isPhaseLocked(phase: ConstructionPhase): boolean {
    const allPhases = this.getAllPhases();
    const currentPhaseIndex = allPhases.findIndex((p) => this.isPhaseCurrent(p));
    const phaseIndex = allPhases.indexOf(phase);
    return phaseIndex > currentPhaseIndex;
  }

  private isLevelUnlocked(level: Level): boolean {
    const playerSave = saveSystem.getCurrentSave();
    if (!playerSave) return false;

    if (playerSave.completedLevels.includes(level.id)) return true;
    if (playerSave.unlockedLevels.includes(level.id)) return true;

    const levelIndex = this.levels.findIndex((l) => l.id === level.id);
    if (levelIndex === 0) return true;

    const previousLevel = this.levels[levelIndex - 1];
    return playerSave.completedLevels.includes(previousLevel.id);
  }

  private isLevelCompleted(level: Level): boolean {
    const playerSave = saveSystem.getCurrentSave();
    return playerSave?.completedLevels.includes(level.id) || false;
  }

  protected setupEventListeners(): void {
    this.addEventListener(GameEvent.LEVEL_SELECTED, (data: unknown) => {
      console.log('[LevelSelectScene] Level selected:', data);
    });
  }

  destroy(): void {
    super.destroy();
  }
}
