import Phaser from 'phaser';
import { BaseScene, COLORS, FONT_FAMILY, UIElement } from './BaseScene';
import { GameEvent } from '../core';
import { physicsManager } from '../core/PhysicsManager';
import { configManager } from '../core/ConfigManager';
import { clueSystem } from '../systems/ClueSystem';
import { actionSystem } from '../systems/ActionSystem';
import { trainingRecorder } from '../systems/TrainingRecorder';
import { inspectionSystem } from '../systems/InspectionSystem';
import { changeOrderSystem } from '../systems/ChangeOrderSystem';
import { Level, Clue, Action, SiteObject, ConstructionPhase, MistakeReason, DecisionOutcome, ChangeOrder } from '../models';

interface ConstructionSiteSceneData {
  levelId?: string;
  taskId?: string;
}

interface MaterialDelayConfig {
  id: string;
  materialName: string;
  phase: string;
  triggerDay: number;
  delayDays: number;
  impact: string;
}

export class ConstructionSiteScene extends BaseScene {
  private currentLevelId: string | null = null;
  private currentTaskId: string | null = null;
  private currentLevel: Level | null = null;
  private currentPhase: ConstructionPhase = ConstructionPhase.PREPARATION;
  private currentDay: number = 1;
  private currentBudget: number = 0;
  private currentDuration: number = 0;
  private totalCost: number = 0;
  private qualityScore: number = 100;
  private selectedClue: Clue | null = null;
  private discoveredClueIds: Set<string> = new Set();
  private executedActionIds: Set<string> = new Set();
  private unlockedPhotoIds: Set<string> = new Set();
  private clueMarkers: Map<string, UIElement> = new Map();
  private siteObjects: Map<string, { sprite: Phaser.GameObjects.Container; bodyId?: string }> = new Map();
  private hudContainer: Phaser.GameObjects.Container | null = null;
  private cluePanel: Phaser.GameObjects.Container | null = null;
  private actionPanel: Phaser.GameObjects.Container | null = null;
  private dayTimer: Phaser.Time.TimerEvent | null = null;
  private triggeredDelays: Set<string> = new Set();
  private changeOrders: ChangeOrder[] = [];
  private tutorialCompleted: boolean = false;
  private tutorialStep: number = 0;
  private cameraControls: { isDragging: boolean; dragStart: { x: number; y: number } } = { isDragging: false, dragStart: { x: 0, y: 0 } };

  constructor() {
    super('ConstructionSiteScene');
  }

  init(data: ConstructionSiteSceneData): void {
    this.currentLevelId = data?.levelId || null;
    this.currentTaskId = data?.taskId || null;
  }

  create(): void {
    super.create();

    this.createBackground();
    this.loadLevelData();
    this.initPhysics();
    this.createHUD();
    this.createSiteLayout();
    this.createClueMarkers();
    this.createCluePanel();
    this.createActionPanel();
    this.setupCameraControls();
    this.startDayTimer();

    this.fadeIn(500);

    this.emitEvent(GameEvent.SCENE_CHANGED, { scene: 'ConstructionSiteScene' });
    this.emitEvent(GameEvent.LEVEL_STARTED, { levelId: this.currentLevelId });

    trainingRecorder.startLevel(this.currentLevelId!, this.currentTaskId!);
    trainingRecorder.setCurrentPhase(this.currentPhase);
    inspectionSystem.initialize(this.currentLevel?.photos || []);
    changeOrderSystem.initialize([]);

    this.showTutorialIfNeeded();
  }

  update(time: number, delta: number): void {
    super.update(time, delta);
    physicsManager.update(delta);
    this.syncPhysicsObjects();
  }

  private loadLevelData(): void {
    if (!this.currentLevelId) return;

    this.currentLevel = configManager.getLevelById(this.currentLevelId);
    if (!this.currentLevel) return;

    clueSystem.initialize(this.currentLevel.clues);
    actionSystem.initialize(this.currentLevel.availableActions);

    const task = configManager.getTaskById(this.currentLevel.taskId);
    if (task) {
      this.currentBudget = task.budget;
      this.currentDuration = task.duration;
    }

    this.qualityScore = 100;
    this.currentDay = 1;
    this.totalCost = 0;
    this.discoveredClueIds.clear();
    this.executedActionIds.clear();
    this.unlockedPhotoIds.clear();
    this.triggeredDelays.clear();
    this.changeOrders = [];

    (this.currentLevel?.photos || []).forEach((photo) => {
      if (photo.isUnlocked) {
        this.unlockedPhotoIds.add(photo.id);
      }
    });

    const save = this.saveSystem.getCurrentSave();
    this.tutorialCompleted = save?.tutorialCompleted ?? false;
  }

  private initPhysics(): void {
    if (!this.currentLevel || !this.currentLevel.layout) return;

    const { width, height } = this.currentLevel.layout;

    physicsManager.init({
      width,
      height,
      gravity: { x: 0, y: 1 },
      enableSleeping: true,
      createBounds: true,
      boundsThickness: 50,
    });

    this.currentLevel.layout.walls.forEach((wall, index) => {
      physicsManager.createBody({
        id: `wall_${index}`,
        shape: 'rectangle',
        x: wall.x + wall.width / 2,
        y: wall.y + wall.height / 2,
        width: wall.width,
        height: wall.height,
        isStatic: true,
        label: 'wall',
        render: { fillStyle: '#2d4a6f', strokeStyle: '#1e3a5f', lineWidth: 2 },
      });
    });

    this.currentLevel.layout.objects.forEach((obj) => {
      if (obj.physics) {
        physicsManager.createBody({
          id: obj.id,
          shape: 'rectangle',
          x: obj.x,
          y: obj.y,
          width: 60,
          height: 60,
          isStatic: false,
          label: obj.type,
          friction: 0.8,
          restitution: 0.1,
          render: { visible: false },
        });
      }
    });

    physicsManager.onCollisionStart(() => {
      this.emitEvent(GameEvent.AUDIO_PLAY, { type: 'sfx', key: 'collision' });
    });
  }

  private createHUD(): void {
    const { width } = this.scale;

    this.hudContainer = this.add.container(width / 2, 40);

    const hudBg = this.add.rectangle(0, 0, width, 70, COLORS.PANEL);
    hudBg.setStrokeStyle(2, COLORS.PANEL_BORDER);

    const leftDecor = this.add.graphics();
    leftDecor.lineStyle(3, COLORS.ACCENT, 1);
    leftDecor.beginPath();
    leftDecor.moveTo(-width / 2, 25);
    leftDecor.lineTo(-width / 2 + 30, 25);
    leftDecor.lineTo(-width / 2 + 30, 35);
    leftDecor.strokePath();

    const rightDecor = this.add.graphics();
    rightDecor.lineStyle(3, COLORS.ACCENT, 1);
    rightDecor.beginPath();
    rightDecor.moveTo(width / 2, 25);
    rightDecor.lineTo(width / 2 - 30, 25);
    rightDecor.lineTo(width / 2 - 30, 35);
    rightDecor.strokePath();

    this.hudContainer.add([hudBg, leftDecor, rightDecor]);

    const levelInfo = this.createText(-width / 2 + 30, -10, this.currentLevel?.name || '', {
      fontSize: 18,
      fontStyle: 'bold',
      origin: { x: 0, y: 0.5 },
    });
    this.hudContainer.add(levelInfo);

    const dayLabel = this.createText(-width / 2 + 30, 15, '第 1 天', {
      fontSize: 14,
      color: COLORS.ACCENT,
      origin: { x: 0, y: 0.5 },
    });
    dayLabel.setName('dayLabel');
    this.hudContainer.add(dayLabel);

    const budgetLabel = this.createText(0, -10, `预算: ¥${this.currentBudget.toLocaleString()}`, {
      fontSize: 16,
      color: COLORS.SUCCESS,
      fontStyle: 'bold',
    });
    budgetLabel.setName('budgetLabel');
    this.hudContainer.add(budgetLabel);

    const qualityLabel = this.createText(0, 15, `质量: ${this.qualityScore}%`, {
      fontSize: 14,
      color: this.qualityScore >= 70 ? COLORS.SUCCESS : this.qualityScore >= 40 ? COLORS.WARNING : COLORS.ERROR,
    });
    qualityLabel.setName('qualityLabel');
    this.hudContainer.add(qualityLabel);

    const progressLabel = this.createText(width / 2 - 200, -10, `工期: ${this.currentDay}/${this.currentDuration}天`, {
      fontSize: 14,
      origin: { x: 0, y: 0.5 },
    });
    progressLabel.setName('progressLabel');
    this.hudContainer.add(progressLabel);

    const clueProgressLabel = this.createText(width / 2 - 200, 15, `线索: ${this.discoveredClueIds.size}/${this.currentLevel?.clues.length || 0}`, {
      fontSize: 14,
      color: COLORS.TEXT_SECONDARY,
      origin: { x: 0, y: 0.5 },
    });
    clueProgressLabel.setName('clueProgressLabel');
    this.hudContainer.add(clueProgressLabel);

    const inspectionButton = this.createButton({
      x: width / 2 - 100,
      y: 0,
      width: 120,
      height: 45,
      text: '🔍 验收照片',
      variant: 'secondary',
      onClick: () => this.handleOpenInspection(),
    });
    this.hudContainer.add(inspectionButton.container);
    this.uiElements.set('inspectionButton', inspectionButton);

    const changeOrderButton = this.createButton({
      x: width / 2 - 240,
      y: 0,
      width: 100,
      height: 45,
      text: '📋 变更单',
      variant: 'secondary',
      onClick: () => this.handleOpenChangeOrders(),
    });
    this.hudContainer.add(changeOrderButton.container);
    this.uiElements.set('changeOrderButton', changeOrderButton);

    const menuButton = this.createButton({
      x: width / 2 - 360,
      y: 0,
      width: 45,
      height: 45,
      text: '☰',
      variant: 'outline',
      onClick: () => this.handleOpenMenu(),
    });
    this.hudContainer.add(menuButton.container);
    this.uiElements.set('menuButton', menuButton);

    this.hudContainer.setDepth(100);
  }

  private createSiteLayout(): void {
    if (!this.currentLevel || !this.currentLevel.layout) return;

    const { width, height } = this.currentLevel.layout;
    const { width: gameWidth, height: gameHeight } = this.scale;

    const siteContainer = this.add.container(gameWidth / 2, gameHeight / 2 + 30);

    const floorBg = this.add.rectangle(0, 0, width, height, 0x1a2f4a);
    floorBg.setStrokeStyle(3, COLORS.PANEL_BORDER);

    const gridGraphics = this.add.graphics();
    gridGraphics.lineStyle(1, COLORS.PANEL_BORDER, 0.2);
    const gridSize = 50;

    for (let x = -width / 2; x <= width / 2; x += gridSize) {
      gridGraphics.beginPath();
      gridGraphics.moveTo(x, -height / 2);
      gridGraphics.lineTo(x, height / 2);
      gridGraphics.strokePath();
    }

    for (let y = -height / 2; y <= height / 2; y += gridSize) {
      gridGraphics.beginPath();
      gridGraphics.moveTo(-width / 2, y);
      gridGraphics.lineTo(width / 2, y);
      gridGraphics.strokePath();
    }

    siteContainer.add([floorBg, gridGraphics]);

    const roomLabels = [
      { x: -300, y: -200, text: '厨房', color: 0xff6b35 },
      { x: 100, y: -100, text: '客厅', color: 0x2ecc71 },
      { x: 300, y: -200, text: '卧室', color: 0x3498db },
    ];

    roomLabels.forEach((label) => {
      const labelBg = this.add.rectangle(label.x, label.y, 80, 30, label.color, 0.3);
      labelBg.setStrokeStyle(2, label.color);
      const labelText = this.createText(label.x, label.y, label.text, {
        fontSize: 14,
        fontStyle: 'bold',
        color: COLORS.TEXT,
      });
      siteContainer.add([labelBg, labelText]);
    });

    this.currentLevel.layout.walls.forEach((wall) => {
      const wallSprite = this.add.rectangle(
        wall.x + wall.width / 2 - width / 2,
        wall.y + wall.height / 2 - height / 2,
        wall.width,
        wall.height,
        COLORS.PRIMARY_DARK
      );
      wallSprite.setStrokeStyle(2, COLORS.ACCENT);
      siteContainer.add(wallSprite);
    });

    this.currentLevel.layout.objects.forEach((obj) => {
      const objectSprite = this.createSiteObject(obj, width, height);
      if (objectSprite) {
        siteContainer.add(objectSprite);
        this.siteObjects.set(obj.id, { sprite: objectSprite, bodyId: obj.physics ? obj.id : undefined });
      }
    });

    const scale = Math.min((gameWidth - 100) / width, (gameHeight - 200) / height);
    siteContainer.setScale(scale);

    this.cameras.main.setBounds(-width / 2, -height / 2, width, height);
  }

  private createSiteObject(obj: SiteObject, layoutWidth: number, layoutHeight: number): Phaser.GameObjects.Container | null {
    const x = obj.x - layoutWidth / 2;
    const y = obj.y - layoutHeight / 2;

    const objectColors: Record<string, { color: number; accent: number; label: string }> = {
      sink: { color: 0x3498db, accent: 0x2980b9, label: '🚰' },
      cabinet: { color: 0x8b4513, accent: 0x654321, label: '🗄️' },
      materials: { color: 0xf39c12, accent: 0xe67e22, label: '📦' },
      panel: { color: 0x95a5a6, accent: 0x7f8c8d, label: '⚡' },
      sofa: { color: 0x9b59b6, accent: 0x8e44ad, label: '🛋️' },
      bed: { color: 0x1abc9c, accent: 0x16a085, label: '🛏️' },
      toolbox: { color: 0xe74c3c, accent: 0xc0392b, label: '🧰' },
      bathtub: { color: 0xecf0f1, accent: 0xbdc3c7, label: '🛁' },
    };

    const config = objectColors[obj.type] || { color: 0x7f8c8d, accent: 0x6c7a7a, label: '📦' };

    const rect = this.add.rectangle(0, 0, 60, 60, config.color);
    rect.setStrokeStyle(3, config.accent);

    const icon = this.createText(0, 0, config.label, {
      fontSize: 28,
    });

    const container = this.add.container(x, y);
    container.add([rect, icon]);

    rect.setInteractive({ useHandCursor: true, draggable: true });

    rect.on('pointerover', () => {
      rect.fillColor = config.accent;
      this.emitEvent(GameEvent.AUDIO_PLAY, { type: 'sfx', key: 'hover' });
    });

    rect.on('pointerout', () => {
      rect.fillColor = config.color;
    });

    rect.on('dragstart', () => {
      if (obj.physics) {
        physicsManager.setBodyStatic(obj.id, true);
      }
    });

    rect.on('drag', (_pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
      const worldX = dragX + layoutWidth / 2;
      const worldY = dragY + layoutHeight / 2;

      container.setPosition(dragX, dragY);

      if (obj.physics) {
        physicsManager.setBodyPosition(obj.id, worldX, worldY);
      }
    });

    rect.on('dragend', () => {
      if (obj.physics) {
        physicsManager.setBodyStatic(obj.id, false);
      }
    });

    return container;
  }

  private createClueMarkers(): void {
    if (!this.currentLevel) return;

    const { width: layoutWidth, height: layoutHeight } = this.currentLevel.layout!;
    const { width: gameWidth, height: gameHeight } = this.scale;
    const scale = Math.min((gameWidth - 100) / layoutWidth, (gameHeight - 200) / layoutHeight);

    this.clueMarkers.forEach((marker) => marker.destroy());
    this.clueMarkers.clear();

    this.currentLevel.clues.forEach((clue) => {
      if (clue.isHidden && !this.discoveredClueIds.has(clue.id)) return;

      const x = (clue.position.x - layoutWidth / 2) * scale + gameWidth / 2;
      const y = (clue.position.y - layoutHeight / 2) * scale + gameHeight / 2 + 30;

      const marker = this.createClueMarker(clue, x, y);
      this.clueMarkers.set(clue.id, marker);
    });
  }

  private createClueMarker(clue: Clue, x: number, y: number): UIElement {
    const container = this.add.container(x, y);

    const typeColors: Record<string, number> = {
      quality: COLORS.WARNING,
      safety: COLORS.ERROR,
      material: COLORS.ACCENT,
      design: COLORS.PRIMARY_LIGHT,
      schedule: 0xfdcb6e,
      cost: 0xe84393,
      fraud: 0xe84393,
      delay: 0xfdcb6e,
    };

    const color = typeColors[clue.problemType] || COLORS.WARNING;
    const isDiscovered = this.discoveredClueIds.has(clue.id);

    const pulseCircle = this.add.circle(0, 0, 25, color, 0.2);
    this.tweens.add({
      targets: pulseCircle,
      scale: { from: 1, to: 1.5 },
      alpha: { from: 0.3, to: 0 },
      duration: 1500,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    const marker = this.add.circle(0, 0, 18, color);
    marker.setStrokeStyle(3, COLORS.TEXT);
    marker.setAlpha(isDiscovered ? 0.6 : 1);

    const icon = this.createText(0, 0, isDiscovered ? '✓' : '!', {
      fontSize: 20,
      fontStyle: 'bold',
      color: COLORS.TEXT,
    });

    const severityStars = this.createText(0, 25, '★'.repeat(clue.severity), {
      fontSize: 12,
      color: COLORS.WARNING,
    });

    container.add([pulseCircle, marker, icon, severityStars]);

    marker.setInteractive({ useHandCursor: true });

    marker.on('pointerover', () => {
      this.tweens.add({
        targets: container,
        scale: 1.2,
        duration: 200,
      });
      this.emitEvent(GameEvent.AUDIO_PLAY, { type: 'sfx', key: 'hover' });
    });

    marker.on('pointerout', () => {
      this.tweens.add({
        targets: container,
        scale: 1,
        duration: 200,
      });
    });

    marker.on('pointerup', () => {
      this.handleClueClick(clue);
      this.emitEvent(GameEvent.AUDIO_PLAY, { type: 'sfx', key: 'click' });
    });

    container.setDepth(50);

    return {
      container,
      destroy: () => container.destroy(),
      setVisible: (visible: boolean) => container.setVisible(visible),
      setEnabled: (enabled: boolean) => {
        if (enabled) {
          marker.setInteractive({ useHandCursor: true });
          container.setAlpha(1);
        } else {
          marker.disableInteractive();
          container.setAlpha(0.5);
        }
      },
    };
  }

  private createCluePanel(): void {
    const { width, height } = this.scale;

    this.cluePanel = this.createPanel(width - 180, height * 0.45, 340, height * 0.7, '发现的问题');
    this.cluePanel.setDepth(80);
    this.cluePanel.setAlpha(0);

    const closeButton = this.createButton({
      x: width - 40,
      y: height * 0.1,
      width: 35,
      height: 35,
      text: '✕',
      variant: 'outline',
      onClick: () => this.toggleCluePanel(false),
    });
    closeButton.container.setDepth(81);
    closeButton.container.setAlpha(0);
    this.uiElements.set('closeCluePanel', closeButton);

    this.toggleCluePanel(false);
  }

  private toggleCluePanel(show: boolean): void {
    if (!this.cluePanel) return;

    const closeButton = this.uiElements.get('closeCluePanel');

    if (show) {
      this.tweens.add({
        targets: this.cluePanel,
        alpha: 1,
        x: this.cluePanel.x - 20,
        duration: 300,
        ease: 'Power2.easeOut',
      });
      if (closeButton) {
        closeButton.container.setAlpha(1);
      }
    } else {
      this.tweens.add({
        targets: this.cluePanel,
        alpha: 0,
        x: this.cluePanel.x + 20,
        duration: 300,
        ease: 'Power2.easeIn',
      });
      if (closeButton) {
        closeButton.container.setAlpha(0);
      }
    }
  }

  private updateCluePanel(clue: Clue): void {
    if (!this.cluePanel) return;

    const panelX = this.cluePanel.x;
    const panelY = this.cluePanel.y;
    const { height } = this.scale;

    this.cluePanel.list
      .filter((obj) => obj !== this.cluePanel!.list[0] && obj !== this.cluePanel!.list[1])
      .forEach((obj) => obj.destroy());

    let currentY = panelY - height * 0.3 + 60;

    const title = this.createText(panelX, currentY, clue.title, {
      fontSize: 20,
      fontStyle: 'bold',
      color: COLORS.ACCENT,
    });
    this.cluePanel.add(title);
    currentY += 40;

    const typeColors: Record<string, { name: string; color: number }> = {
      quality: { name: '质量问题', color: COLORS.WARNING },
      safety: { name: '安全隐患', color: COLORS.ERROR },
      material: { name: '材料问题', color: COLORS.ACCENT },
      design: { name: '设计缺陷', color: COLORS.PRIMARY_LIGHT },
      schedule: { name: '工期问题', color: 0xfdcb6e },
      cost: { name: '成本问题', color: 0xe84393 },
    };

    const typeInfo = typeColors[clue.problemType] || { name: '其他问题', color: COLORS.TEXT_SECONDARY };
    const typeLabel = this.createText(panelX - 150, currentY, `类型: ${typeInfo.name}`, {
      fontSize: 14,
      color: typeInfo.color,
      origin: { x: 0, y: 0.5 },
    });
    this.cluePanel.add(typeLabel);

    const severityLabel = this.createText(panelX + 150, currentY, `严重: ${'★'.repeat(clue.severity)}`, {
      fontSize: 14,
      color: COLORS.WARNING,
      origin: { x: 1, y: 0.5 },
    });
    this.cluePanel.add(severityLabel);
    currentY += 40;

    const descLabel = this.createText(panelX - 150, currentY, '问题描述:', {
      fontSize: 14,
      color: COLORS.TEXT_SECONDARY,
      origin: { x: 0, y: 0 },
    });
    this.cluePanel.add(descLabel);
    currentY += 25;

    const descText = this.createText(panelX - 150, currentY, clue.description, {
      fontSize: 14,
      color: COLORS.TEXT,
      origin: { x: 0, y: 0 },
    });
    descText.setWordWrapWidth(300);
    this.cluePanel.add(descText);
    currentY += 70;

    const hintLabel = this.createText(panelX - 150, currentY, '💡 提示:', {
      fontSize: 14,
      color: COLORS.ACCENT,
      origin: { x: 0, y: 0 },
    });
    this.cluePanel.add(hintLabel);
    currentY += 25;

    const hintText = this.createText(panelX - 150, currentY, clue.hint, {
      fontSize: 13,
      color: COLORS.TEXT_SECONDARY,
      origin: { x: 0, y: 0 },
    });
    hintText.setWordWrapWidth(300);
    this.cluePanel.add(hintText);
    currentY += 55;

    if (clue.relatedClueIds && clue.relatedClueIds.length > 0) {
      const relatedLabel = this.createText(panelX - 150, currentY, `🔗 关联线索: ${clue.relatedClueIds.length}个`, {
        fontSize: 14,
        color: COLORS.TEXT_SECONDARY,
        origin: { x: 0, y: 0 },
      });
      this.cluePanel.add(relatedLabel);
      currentY += 35;
    }

    if (clue.photoId) {
      const viewPhotoButton = this.createButton({
        x: panelX,
        y: panelY + height * 0.3 - 110,
        width: 260,
        height: 45,
        text: '📷 查看验收照片',
        variant: 'secondary',
        onClick: () => this.handleViewPhoto(clue.photoId!),
      });
      this.uiElements.set('viewPhotoButton', viewPhotoButton);
      this.cluePanel.add(viewPhotoButton.container);
    }

    this.toggleCluePanel(true);
    this.selectedClue = clue;
  }

  private createActionPanel(): void {
    const { width, height } = this.scale;

    this.actionPanel = this.createPanel(width / 2, height - 120, width * 0.9, 200, '可用动作');
    this.actionPanel.setDepth(80);

    this.updateActionPanel();
  }

  private updateActionPanel(): void {
    if (!this.actionPanel || !this.currentLevel) return;

    const { width } = this.scale;
    const panelY = this.actionPanel.y;

    this.actionPanel.list
      .filter((obj) => obj !== this.actionPanel!.list[0] && obj !== this.actionPanel!.list[1])
      .forEach((obj) => obj.destroy());

    const applicableActions = actionSystem.getAvailableActions(Array.from(this.discoveredClueIds));
    const buttonWidth = 180;
    const buttonHeight = 70;
    const startX = -width * 0.4 + buttonWidth / 2;
    const spacing = buttonWidth + 15;

    applicableActions.slice(0, 5).forEach((action, index) => {
      const isExecuted = this.executedActionIds.has(action.id);
      const x = startX + index * spacing;

      const button = this.createActionButton(action, x, 10, buttonWidth, buttonHeight, isExecuted);
      this.actionPanel!.add(button.container);
      this.uiElements.set(`action_${action.id}`, button);
    });

    if (applicableActions.length === 0) {
      const placeholder = this.createText(this.actionPanel.x, panelY + 10, '发现问题后会显示可用处理动作', {
        fontSize: 16,
        color: COLORS.TEXT_DISABLED,
      });
      this.actionPanel.add(placeholder);
    }

    const nextPhaseButton = this.createButton({
      x: width / 2 - 130,
      y: panelY + 10,
      width: 160,
      height: 70,
      text: '完成阶段\n进入验收',
      variant: 'primary',
      onClick: () => this.handleCompletePhase(),
    });
    nextPhaseButton.container.setDepth(81);
    this.uiElements.set('nextPhaseButton', nextPhaseButton);
    this.actionPanel.add(nextPhaseButton.container);
  }

  private createActionButton(action: Action, x: number, y: number, width: number, height: number, isExecuted: boolean): UIElement {
    const container = this.add.container(x, y);

    const typeColors: Record<string, { color: number; accent: number }> = {
      repair: { color: 0x27ae60, accent: 0x229954 },
      replace: { color: 0x3498db, accent: 0x2980b9 },
      redesign: { color: 0x9b59b6, accent: 0x8e44ad },
      report: { color: 0xf39c12, accent: 0xe67e22 },
      consult: { color: 0x1abc9c, accent: 0x16a085 },
      ignore: { color: 0x7f8c8d, accent: 0x6c7a7a },
    };

    const colors = typeColors[action.type] || typeColors.repair;

    const bg = this.add.rectangle(0, 0, width, height, isExecuted ? COLORS.PRIMARY_DARK : colors.color);
    bg.setStrokeStyle(3, isExecuted ? COLORS.TEXT_DISABLED : colors.accent);
    bg.setAlpha(isExecuted ? 0.5 : 1);

    const title = this.add.text(-width / 2 + 15, -height / 2 + 20, action.title, {
      fontFamily: FONT_FAMILY,
      fontSize: '15px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    const costText = this.add.text(-width / 2 + 15, 0, `💰 ¥${action.cost.toLocaleString()}`, {
      fontFamily: FONT_FAMILY,
      fontSize: '12px',
      color: '#ffffff',
    }).setOrigin(0, 0.5);

    const timeText = this.add.text(width / 2 - 15, 0, `⏱️ ${action.duration}天`, {
      fontFamily: FONT_FAMILY,
      fontSize: '12px',
      color: '#ffffff',
    }).setOrigin(1, 0.5);

    const riskText = this.add.text(width / 2 - 15, height / 2 - 20, `风险: ${'⚠️'.repeat(action.risk)}`, {
      fontFamily: FONT_FAMILY,
      fontSize: '10px',
      color: action.risk >= 4 ? '#ff6b6b' : '#ffffff',
    }).setOrigin(1, 0.5);

    container.add([bg, title, costText, timeText, riskText]);

    if (isExecuted) {
      const executedMark = this.createText(0, 0, '✓ 已执行', {
        fontSize: 20,
        fontStyle: 'bold',
        color: COLORS.SUCCESS,
      });
      container.add(executedMark);
    } else {
      bg.setInteractive({ useHandCursor: true });

      bg.on('pointerover', () => {
        bg.fillColor = colors.accent;
        this.tweens.add({
          targets: container,
          scale: 1.05,
          duration: 200,
        });
        this.emitEvent(GameEvent.AUDIO_PLAY, { type: 'sfx', key: 'hover' });
      });

      bg.on('pointerout', () => {
        bg.fillColor = colors.color;
        this.tweens.add({
          targets: container,
          scale: 1,
          duration: 200,
        });
      });

      bg.on('pointerdown', () => {
        bg.fillColor = colors.accent;
      });

      bg.on('pointerup', () => {
        bg.fillColor = colors.color;
        this.handleExecuteAction(action);
        this.emitEvent(GameEvent.AUDIO_PLAY, { type: 'sfx', key: 'click' });
      });
    }

    return {
      container,
      destroy: () => container.destroy(),
      setVisible: (visible: boolean) => container.setVisible(visible),
      setEnabled: (enabled: boolean) => {
        if (enabled && !isExecuted) {
          bg.setInteractive({ useHandCursor: true });
          container.setAlpha(1);
        } else {
          bg.disableInteractive();
          container.setAlpha(0.5);
        }
      },
    };
  }

  private handleClueClick(clue: Clue): void {
    if (!this.discoveredClueIds.has(clue.id)) {
      this.discoveredClueIds.add(clue.id);
      trainingRecorder.recordClueDiscovered(clue.id, this.currentPhase);
      this.checkRelatedClues(clue);
      this.createClueMarkers();
      this.updateHUD();
      this.unlockPhotosByClue(clue.id);
    }

    this.updateCluePanel(clue);
    this.updateActionPanel();
    this.advanceTutorial('clue_clicked');
  }

  private checkRelatedClues(clue: Clue): void {
    clue.relatedClueIds.forEach((relatedId) => {
      const relatedClue = this.currentLevel?.clues.find((c) => c.id === relatedId);
      if (relatedClue && relatedClue.isHidden && !this.discoveredClueIds.has(relatedId)) {
        const discoveredCount = relatedClue.relatedClueIds.filter((id) => this.discoveredClueIds.has(id)).length;
        if (discoveredCount >= 1) {
          this.discoveredClueIds.add(relatedId);
          trainingRecorder.recordClueDiscovered(relatedId, this.currentPhase);
        }
      }
    });
  }

  private unlockPhotosByClue(clueId: string): void {
    const photos = this.currentLevel?.photos || [];
    photos.forEach((photo) => {
      if (this.unlockedPhotoIds.has(photo.id)) return;
      const condition = photo.unlockCondition;
      if (condition && condition.type === 'clue' && condition.targetId === clueId) {
        this.unlockedPhotoIds.add(photo.id);
        this.showNotification(`📷 解锁新验收照片: ${photo.title}`);
      }
    });
  }

  private unlockPhotosByAction(actionId: string): void {
    const photos = this.currentLevel?.photos || [];
    photos.forEach((photo) => {
      if (this.unlockedPhotoIds.has(photo.id)) return;
      const condition = photo.unlockCondition;
      if (condition && condition.type === 'action' && condition.targetId === actionId) {
        this.unlockedPhotoIds.add(photo.id);
        this.showNotification(`📷 解锁新验收照片: ${photo.title}`);
      }
    });
  }

  private handleExecuteAction(action: Action): void {
    if (this.executedActionIds.has(action.id)) return;

    if (this.totalCost + action.cost > this.currentBudget) {
      this.showNotification('❌ 预算不足，无法执行此动作', true);
      return;
    }

    this.executedActionIds.add(action.id);
    this.totalCost += action.cost;
    this.currentDay += action.duration;
    this.qualityScore = Math.max(0, Math.min(100, this.qualityScore + action.qualityImpact));

    trainingRecorder.recordAction(
      action.id,
      this.selectedClue?.id ?? '',
      action.cost,
      action.duration,
      action.qualityImpact,
      this.currentPhase
    );

    this.processActionConsequences(action);
    this.unlockPhotosByAction(action.id);
    this.checkMaterialDelays();
    this.updateHUD();
    this.updateActionPanel();
    this.advanceTutorial('action_executed');
  }

  private processActionConsequences(action: Action): void {
    let outcome: DecisionOutcome = DecisionOutcome.POSITIVE as DecisionOutcome;
    let message = `✅ 已执行: ${action.title}`;

    action.consequences.forEach((consequence) => {
      if (Math.random() < consequence.probability) {
        switch (consequence.type) {
          case 'quality':
            this.qualityScore = Math.max(0, Math.min(100, this.qualityScore + consequence.value));
            if (consequence.value < 0) {
              outcome = DecisionOutcome.NEGATIVE;
              trainingRecorder.recordMistake({
                reason: MistakeReason.POOR_QUALITY,
                description: consequence.description,
                phase: this.currentPhase,
                penalty: Math.abs(consequence.value),
              });
            }
            break;
          case 'cost':
            this.totalCost += consequence.value;
            if (consequence.value > 0) {
              outcome = DecisionOutcome.NEGATIVE;
              trainingRecorder.recordMistake({
                reason: MistakeReason.OVER_BUDGET,
                description: consequence.description,
                phase: this.currentPhase,
                penalty: Math.round(consequence.value / 1000),
              });
            }
            break;
          case 'time':
            this.currentDay += consequence.value;
            if (consequence.value > 0) {
              outcome = DecisionOutcome.NEGATIVE;
              trainingRecorder.recordMistake({
                reason: MistakeReason.OVER_TIME,
                description: consequence.description,
                phase: this.currentPhase,
                penalty: consequence.value * 2,
              });
            }
            break;
          case 'material':
            outcome = DecisionOutcome.NEGATIVE;
            this.showNotification(`⚠️ ${consequence.description}`, true);
            break;
        }

        message += `\n${consequence.value >= 0 ? '+' : ''}${consequence.value} - ${consequence.description}`;
      }
    });

    this.emitEvent(GameEvent.DECISION_MADE, {
      action,
      clueIds: this.selectedClue ? [this.selectedClue.id] : [],
      phase: this.currentPhase,
      outcome,
      timestamp: Date.now(),
    });

    this.showNotification(message, outcome === DecisionOutcome.NEGATIVE);
    trainingRecorder.updateQualityScore(this.qualityScore);
    trainingRecorder.updateCost(this.totalCost);
    trainingRecorder.updateDuration(this.currentDay);
  }

  private checkMaterialDelays(): void {
    const delays = (this.currentLevel?.materialDelays || []) as MaterialDelayConfig[];
    delays.forEach((delay) => {
      if (!this.triggeredDelays.has(delay.id) && this.currentDay >= delay.triggerDay) {
        this.triggeredDelays.add(delay.id);
        this.currentDay += delay.delayDays;

        this.emitEvent(GameEvent.MATERIAL_DELAYED, {
          delayId: delay.id,
          materialName: delay.materialName,
          plannedDate: delay.triggerDay,
          actualDate: delay.triggerDay + delay.delayDays,
          delayDays: delay.delayDays,
          impact: delay.impact,
          phase: this.currentPhase,
        });

        trainingRecorder.recordMistake({
          reason: MistakeReason.DELAYED_MATERIAL,
          description: `${delay.materialName}延期${delay.delayDays}天: ${delay.impact}`,
          phase: this.currentPhase,
          penalty: delay.delayDays * 3,
        });

        this.showNotification(`📦 材料延期: ${delay.materialName} 延期${delay.delayDays}天`, true);
        trainingRecorder.updateDuration(this.currentDay);
      }
    });
  }

  private handleViewPhoto(photoId: string): void {
    if (!this.unlockedPhotoIds.has(photoId)) {
      this.showNotification('🔒 此照片尚未解锁', true);
      return;
    }
    this.transitionToScene('InspectionScene', {
      levelId: this.currentLevelId,
      photoId,
      unlockedPhotoIds: Array.from(this.unlockedPhotoIds),
      fromScene: 'ConstructionSiteScene',
    });
  }

  private handleOpenInspection(): void {
    const unlockedPhotos = Array.from(this.unlockedPhotoIds);
    if (unlockedPhotos.length === 0) {
      this.showNotification('🔒 暂无解锁的验收照片，请先发现线索', true);
      return;
    }
    this.transitionToScene('InspectionScene', {
      levelId: this.currentLevelId,
      unlockedPhotoIds: unlockedPhotos,
      fromScene: 'ConstructionSiteScene',
    });
    this.advanceTutorial('inspection_opened');
  }

  private handleOpenChangeOrders(): void {
    const changeOrderModal = this.createPanel(this.scale.width / 2, this.scale.height / 2, 600, 500, '变更单管理');
    changeOrderModal.setDepth(200);

    const overlay = this.add.rectangle(this.scale.width / 2, this.scale.height / 2, this.scale.width, this.scale.height, 0x000000, 0.7);
    overlay.setDepth(199);

    const closeBtn = this.createButton({
      x: this.scale.width / 2 + 260,
      y: this.scale.height / 2 - 220,
      width: 40,
      height: 40,
      text: '✕',
      variant: 'outline',
      onClick: () => {
        overlay.destroy();
        changeOrderModal.destroy();
      },
    });
    closeBtn.container.setDepth(201);

    let y = this.scale.height / 2 - 160;
    if (this.changeOrders.length === 0) {
      const tip = this.createText(this.scale.width / 2, this.scale.height / 2, '暂无变更单\n完成阶段验收后可生成变更单', {
        fontSize: 18,
        color: COLORS.TEXT_SECONDARY,
      });
      tip.setDepth(201);
      changeOrderModal.add(tip);
    } else {
      this.changeOrders.forEach((order, index) => {
        const statusColors: Record<string, number> = {
          draft: COLORS.TEXT_SECONDARY,
          pending_approval: COLORS.WARNING,
          approved: COLORS.SUCCESS,
          rejected: COLORS.ERROR,
          executed: COLORS.ACCENT,
        };
        const statusNames: Record<string, string> = {
          draft: '草稿',
          pending_approval: '待审批',
          approved: '已批准',
          rejected: '已拒绝',
          executed: '已执行',
        };

        const orderBg = this.add.rectangle(this.scale.width / 2, y, 540, 80, COLORS.PANEL_BORDER);
        orderBg.setStrokeStyle(2, statusColors[order.status]);
        orderBg.setDepth(201);

        const orderTitle = this.createText(this.scale.width / 2 - 250, y - 20, `#${index + 1} ${order.title}`, {
          fontSize: 16,
          fontStyle: 'bold',
          origin: { x: 0, y: 0.5 },
        });
        orderTitle.setDepth(202);

        const orderStatus = this.createText(this.scale.width / 2 + 250, y - 20, statusNames[order.status], {
          fontSize: 14,
          color: statusColors[order.status],
          origin: { x: 1, y: 0.5 },
        });
        orderStatus.setDepth(202);

        const orderCost = this.createText(this.scale.width / 2 - 250, y + 20, `费用: ¥${order.additionalCost.toLocaleString()}`, {
          fontSize: 14,
          origin: { x: 0, y: 0.5 },
        });
        orderCost.setDepth(202);

        const orderTime = this.createText(this.scale.width / 2, y + 20, `工期: +${order.additionalDuration}天`, {
          fontSize: 14,
          origin: { x: 0.5, y: 0.5 },
        });
        orderTime.setDepth(202);

        const orderDesc = this.createText(this.scale.width / 2 + 250, y + 20, `涉及线索: ${order.relatedClueIds.length}个`, {
          fontSize: 14,
          origin: { x: 1, y: 0.5 },
        });
        orderDesc.setDepth(202);

        changeOrderModal.add([orderBg, orderTitle, orderStatus, orderCost, orderTime, orderDesc]);
        y += 100;
      });
    }

    const generateBtn = this.createButton({
      x: this.scale.width / 2,
      y: this.scale.height / 2 + 210,
      width: 200,
      height: 50,
      text: '📝 生成变更单',
      variant: 'primary',
      onClick: () => this.generateChangeOrder(),
    });
    generateBtn.container.setDepth(201);
  }

  private generateChangeOrder(): void {
    const unhandledClues = this.currentLevel?.clues.filter(
      (clue) => this.discoveredClueIds.has(clue.id) && !clue.requiredActions.some((id) => this.executedActionIds.has(id))
    ) || [];

    if (unhandledClues.length === 0) {
      this.showNotification('✅ 所有发现的问题都已处理，无需生成变更单');
      return;
    }

    const additionalCost = unhandledClues.reduce((sum, clue) => {
      const minCostAction = clue.requiredActions
        .map((id) => this.currentLevel?.availableActions.find((a) => a.id === id)?.cost || 0)
        .reduce((min, cost) => Math.min(min, cost), Infinity);
      return sum + (isFinite(minCostAction) ? minCostAction : 0);
    }, 0);

    const additionalDuration = Math.ceil(unhandledClues.length * 1.5);

    const newOrder: ChangeOrder = {
      id: `co_${Date.now()}`,
      taskId: this.currentTaskId!,
      levelId: this.currentLevelId!,
      title: `阶段变更单 - ${this.currentPhase}`,
      description: `针对${unhandledClues.length}个未处理问题的变更方案`,
      reason: `阶段${this.currentPhase}有${unhandledClues.length}个问题未处理，需要变更方案`,
      originalPlan: `按原计划继续下一阶段，不处理这些问题`,
      newPlan: `增加预算和工期，处理这些未解决的问题`,
      costIncrease: additionalCost,
      timeExtension: additionalDuration,
      relatedClueIds: unhandledClues.map((c) => c.id),
      relatedActionIds: [],
      additionalCost,
      additionalDuration,
      qualityImpact: unhandledClues.length * 2,
      status: 'draft',
      createdAt: Date.now(),
    };

    this.changeOrders.push(newOrder);
    trainingRecorder.recordChangeOrder(newOrder);

    this.showNotification(`📝 已生成变更单: ¥${additionalCost.toLocaleString()} / +${additionalDuration}天`);
  }

  private handleCompletePhase(): void {
    const undiscoveredCount = (this.currentLevel?.clues.length || 0) - this.discoveredClueIds.size;
    if (undiscoveredCount > 0) {
      trainingRecorder.recordMistake({
        reason: MistakeReason.MISSED_CLUE,
        description: `有${undiscoveredCount}个线索未被发现`,
        phase: this.currentPhase,
        penalty: undiscoveredCount * 5,
      });
    }

    const unresolvedClues = this.currentLevel?.clues.filter(
      (clue) => this.discoveredClueIds.has(clue.id) && !clue.requiredActions.some((id) => this.executedActionIds.has(id))
    ) || [];

    if (unresolvedClues.length > 0) {
      unresolvedClues.forEach((clue) => {
        this.qualityScore = Math.max(0, this.qualityScore - clue.severity * 3);
        trainingRecorder.recordMistake({
          reason: MistakeReason.WRONG_ACTION,
          description: `线索「${clue.title}」未采取正确处理措施`,
          phase: this.currentPhase,
          clueId: clue.id,
          penalty: clue.severity * 3,
        });
      });
      trainingRecorder.updateQualityScore(this.qualityScore);
    }

    if (unresolvedClues.length > 0 || undiscoveredCount > 0) {
      this.showConfirmDialog(
        `本阶段还有 ${undiscoveredCount} 个未发现线索，${unresolvedClues.length} 个未处理问题，是否确认进入验收？`,
        () => this.proceedToSettlement()
      );
    } else {
      this.proceedToSettlement();
    }
  }

  private proceedToSettlement(): void {
    const record = trainingRecorder.finishLevel(
      this.qualityScore,
      this.currentBudget,
      this.totalCost,
      this.currentDay,
      this.currentDuration
    );

    if (record) {
      this.saveSystem.saveTrainingRecord(record);
      this.saveSystem.updatePlayerScore(record.score);

      if (record.score >= (this.currentLevel?.passingScore || 60)) {
        this.saveSystem.unlockNextLevel(this.currentLevelId!);
      }
    }

    this.transitionToScene('SettlementScene', {
      levelId: this.currentLevelId,
      taskId: this.currentTaskId,
      recordId: record?.id,
    });
  }

  private handleOpenMenu(): void {
    const overlay = this.add.rectangle(this.scale.width / 2, this.scale.height / 2, this.scale.width, this.scale.height, 0x000000, 0.7);
    overlay.setDepth(200);

    const panel = this.createPanel(this.scale.width / 2, this.scale.height / 2, 400, 350, '游戏菜单');
    panel.setDepth(201);

    const buttons = [
      { text: '继续游戏', y: -80, onClick: () => { overlay.destroy(); panel.destroy(); closeBtn.destroy(); buttons.forEach((_, i) => menuBtns[i]?.destroy()); } },
      { text: '设置', y: -10, onClick: () => this.showNotification('设置面板开发中...') },
      { text: '查看记录', y: 60, onClick: () => this.transitionToScene('RecordsScene', { fromScene: 'ConstructionSiteScene' }) },
      { text: '返回主菜单', y: 130, onClick: () => this.transitionToScene('MainMenuScene') },
    ];

    const menuBtns: UIElement[] = [];
    buttons.forEach((btn) => {
      const button = this.createButton({
        x: this.scale.width / 2,
        y: this.scale.height / 2 + btn.y,
        width: 250,
        height: 50,
        text: btn.text,
        variant: btn.y === 130 ? 'outline' : 'secondary',
        onClick: btn.onClick,
      });
      button.container.setDepth(202);
      menuBtns.push(button);
    });

    const closeBtn = this.createButton({
      x: this.scale.width / 2 + 170,
      y: this.scale.height / 2 - 150,
      width: 40,
      height: 40,
      text: '✕',
      variant: 'outline',
      onClick: () => { overlay.destroy(); panel.destroy(); closeBtn.destroy(); menuBtns.forEach((b) => b.destroy()); },
    });
    closeBtn.container.setDepth(202);
  }

  private updateHUD(): void {
    if (!this.hudContainer) return;

    const dayLabel = this.hudContainer.getByName('dayLabel') as Phaser.GameObjects.Text;
    if (dayLabel) dayLabel.setText(`第 ${this.currentDay} 天`);

    const budgetLabel = this.hudContainer.getByName('budgetLabel') as Phaser.GameObjects.Text;
    const remainingBudget = this.currentBudget - this.totalCost;
    if (budgetLabel) {
      budgetLabel.setText(`剩余: ¥${remainingBudget.toLocaleString()}`);
      budgetLabel.setColor(`#${(remainingBudget < 0 ? COLORS.ERROR : COLORS.SUCCESS).toString(16).padStart(6, '0')}`);
    }

    const qualityLabel = this.hudContainer.getByName('qualityLabel') as Phaser.GameObjects.Text;
    if (qualityLabel) {
      qualityLabel.setText(`质量: ${this.qualityScore}%`);
      const qualityColor = this.qualityScore >= 70 ? COLORS.SUCCESS : this.qualityScore >= 40 ? COLORS.WARNING : COLORS.ERROR;
      qualityLabel.setColor(`#${qualityColor.toString(16).padStart(6, '0')}`);
    }

    const progressLabel = this.hudContainer.getByName('progressLabel') as Phaser.GameObjects.Text;
    if (progressLabel) progressLabel.setText(`工期: ${this.currentDay}/${this.currentDuration}天`);

    const clueProgressLabel = this.hudContainer.getByName('clueProgressLabel') as Phaser.GameObjects.Text;
    if (clueProgressLabel) {
      clueProgressLabel.setText(`线索: ${this.discoveredClueIds.size}/${this.currentLevel?.clues.length || 0}`);
    }
  }

  private setupCameraControls(): void {
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.leftButtonDown() && pointer.y > 100 && pointer.y < this.scale.height - 250) {
        this.cameraControls.isDragging = true;
        this.cameraControls.dragStart = { x: pointer.x - this.cameras.main.scrollX, y: pointer.y - this.cameras.main.scrollY };
      }
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.cameraControls.isDragging) {
        this.cameras.main.scrollX = pointer.x - this.cameraControls.dragStart.x;
        this.cameras.main.scrollY = pointer.y - this.cameraControls.dragStart.y;
      }
    });

    this.input.on('pointerup', () => {
      this.cameraControls.isDragging = false;
    });
  }

  private syncPhysicsObjects(): void {
    this.siteObjects.forEach(({ sprite, bodyId }) => {
      if (!bodyId) return;
      const body = physicsManager.getBody(bodyId);
      if (!body || body.isStatic) return;
      const { width: layoutWidth, height: layoutHeight } = this.currentLevel?.layout || { width: 0, height: 0 };
      const x = body.position.x - layoutWidth / 2;
      const y = body.position.y - layoutHeight / 2;
      sprite.setPosition(x, y);
      sprite.setRotation(body.angle);
    });
  }

  private startDayTimer(): void {
    this.dayTimer = this.time.addEvent({
      delay: 10000,
      loop: true,
      callback: () => {
        this.currentDay = Math.min(this.currentDay + 1, this.currentDuration);
        this.checkMaterialDelays();
        this.updateHUD();
        trainingRecorder.updateDuration(this.currentDay);

        if (this.currentDay >= this.currentDuration) {
          if (this.dayTimer) this.dayTimer.paused = true;
          this.showNotification('⏰ 工期已到，请尽快完成验收', true);
        }
      },
    });
  }

  private showNotification(message: string, isError: boolean = false): void {
    const { width } = this.scale;
    const notification = this.add.container(width / 2, 130);

    const bg = this.add.rectangle(0, 0, 500, message.split('\n').length * 25 + 30, isError ? 0x5c1f1f : 0x1f4a3e);
    bg.setStrokeStyle(2, isError ? COLORS.ERROR : COLORS.SUCCESS);
    bg.setAlpha(0.95);

    const text = this.createText(0, 0, message, {
      fontSize: 15,
      color: COLORS.TEXT,
    });
    text.setWordWrapWidth(460);

    notification.add([bg, text]);
    notification.setDepth(300);
    notification.setAlpha(0);
    notification.setY(100);

    this.tweens.add({
      targets: notification,
      alpha: 1,
      y: 130,
      duration: 300,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.time.delayedCall(3000, () => {
          this.tweens.add({
            targets: notification,
            alpha: 0,
            y: 100,
            duration: 300,
            ease: 'Back.easeIn',
            onComplete: () => notification.destroy(),
          });
        });
      },
    });
  }

  private showConfirmDialog(message: string, onConfirm: () => void): void {
    const { width, height } = this.scale;

    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);
    overlay.setDepth(400);

    const panel = this.createPanel(width / 2, height / 2, 480, 220, '确认');
    panel.setDepth(401);

    const messageText = this.createText(width / 2, height / 2 - 20, message, {
      fontSize: 17,
      color: COLORS.TEXT,
    });
    messageText.setWordWrapWidth(420);
    messageText.setDepth(402);

    const confirmBtn = this.createButton({
      x: width / 2 - 100,
      y: height / 2 + 60,
      width: 150,
      height: 50,
      text: '确认',
      variant: 'primary',
      onClick: () => {
        overlay.destroy();
        panel.destroy();
        messageText.destroy();
        confirmBtn.destroy();
        cancelBtn.destroy();
        onConfirm();
      },
    });
    confirmBtn.container.setDepth(402);

    const cancelBtn = this.createButton({
      x: width / 2 + 100,
      y: height / 2 + 60,
      width: 150,
      height: 50,
      text: '取消',
      variant: 'secondary',
      onClick: () => {
        overlay.destroy();
        panel.destroy();
        messageText.destroy();
        confirmBtn.destroy();
        cancelBtn.destroy();
      },
    });
    cancelBtn.container.setDepth(402);
  }

  private showTutorialIfNeeded(): void {
    if (this.tutorialCompleted) return;
    this.tutorialStep = 0;
    this.showTutorialStep();
  }

  private showTutorialStep(): void {
    const tutorialSteps = [
      {
        title: '👋 欢迎来到工地！',
        content: '你现在是一名家装项目经理。\n\n你的任务是：\n1️⃣ 发现工地上的问题（线索）\n2️⃣ 选择合适的处理动作\n3️⃣ 通过验收照片确认问题\n\n准备好了吗？',
        highlightTarget: null,
      },
      {
        title: '🔍 发现问题线索',
        content: '工地上有闪烁的感叹号标记！\n\n点击这些标记可以发现隐藏的问题。\n\n每个问题有不同的严重程度和类型。',
        highlightTarget: 'clue_marker',
      },
      {
        title: '📷 查看验收照片',
        content: '发现问题后，可以通过「验收照片」按钮\n查看详细的对比照片。\n\n验收照片是确认问题的关键！\n新玩家从这里开始学习最合适。',
        highlightTarget: 'inspectionButton',
      },
      {
        title: '⚡ 选择处理动作',
        content: '发现问题后，底部会显示可用动作。\n\n每个动作有：\n- 费用（💰）\n- 工期（⏱️）\n- 风险等级（⚠️）\n\n选择最合适的动作来解决问题！',
        highlightTarget: 'action_panel',
      },
      {
        title: '🎯 目标',
        content: '在预算和工期内，尽可能解决所有问题！\n\n- 遗漏线索会扣分\n- 未处理问题会扣分\n- 材料延期会影响工期\n\n祝你顺利完成任务！💪',
        highlightTarget: null,
      },
    ];

    if (this.tutorialStep >= tutorialSteps.length) {
      this.tutorialCompleted = true;
      this.saveSystem.setTutorialCompleted(true);
      return;
    }

    const step = tutorialSteps[this.tutorialStep];
    const { width, height } = this.scale;

    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);
    overlay.setDepth(500);
    overlay.setName('tutorialOverlay');

    if (step.highlightTarget === 'inspectionButton') {
      const btn = this.uiElements.get('inspectionButton');
      if (btn) {
        btn.container.setDepth(501);
        const highlight = this.add.graphics();
        highlight.lineStyle(4, COLORS.ACCENT, 1);
        highlight.strokeRectShape(btn.container.getBounds());
        highlight.setDepth(501);
        highlight.setName('tutorialHighlight');
      }
    }

    const panel = this.createPanel(width / 2, height / 2, 520, 340, step.title);
    panel.setDepth(502);
    panel.setName('tutorialPanel');

    const contentText = this.createText(width / 2, height / 2 - 20, step.content, {
      fontSize: 17,
      color: COLORS.TEXT,
    });
    contentText.setWordWrapWidth(460);
    contentText.setDepth(503);
    contentText.setName('tutorialContent');

    const nextBtn = this.createButton({
      x: width / 2,
      y: height / 2 + 130,
      width: 180,
      height: 50,
      text: this.tutorialStep === tutorialSteps.length - 1 ? '🎉 开始游戏' : '下一步 ➡️',
      variant: 'primary',
      onClick: () => {
        const cleanup = (name: string) => {
          const obj = this.children.getByName(name);
          if (obj) obj.destroy();
        };
        cleanup('tutorialOverlay');
        cleanup('tutorialPanel');
        cleanup('tutorialContent');
        cleanup('tutorialHighlight');
        nextBtn.destroy();

        const btn = this.uiElements.get('inspectionButton');
        if (btn) btn.container.setDepth(100);

        this.tutorialStep++;
        if (this.tutorialStep < tutorialSteps.length) {
          this.time.delayedCall(200, () => this.showTutorialStep());
        } else {
          this.tutorialCompleted = true;
          this.saveSystem.setTutorialCompleted(true);
        }
      },
    });
    nextBtn.container.setDepth(504);
  }

  private advanceTutorial(trigger: string): void {
    if (this.tutorialCompleted) return;

    const triggerMap: Record<string, number> = {
      clue_clicked: 2,
      inspection_opened: 3,
      action_executed: 4,
    };

    const targetStep = triggerMap[trigger];
    if (targetStep && this.tutorialStep < targetStep) {
      this.tutorialStep = targetStep;
    }
  }

  protected setupEventListeners(): void {
    this.addEventListener(GameEvent.SCENE_CHANGED, (data) => {
      console.log('[ConstructionSiteScene] Scene changed:', data);
    });
  }

  destroy(): void {
    if (this.dayTimer) {
      this.dayTimer.destroy();
    }
    super.destroy();
  }
}