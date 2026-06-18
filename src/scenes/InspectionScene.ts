import Phaser from 'phaser';
import { BaseScene, COLORS, FONT_FAMILY, UIElement } from './BaseScene';
import { GameEvent } from '../core';
import { configManager } from '../core/ConfigManager';
import { InspectionPhoto, ProblemArea } from '../models';

interface InspectionSceneData {
  levelId?: string;
  photoId?: string;
  unlockedPhotoIds?: string[];
  fromScene?: string;
}

export class InspectionScene extends BaseScene {
  private currentLevelId: string | null = null;
  private fromScene: string = 'ConstructionSiteScene';
  private unlockedPhotoIds: Set<string> = new Set();
  private allPhotos: InspectionPhoto[] = [];
  private visiblePhotos: InspectionPhoto[] = [];
  private selectedPhoto: InspectionPhoto | null = null;
  private photoListContainer: Phaser.GameObjects.Container | null = null;
  private photoDetailContainer: Phaser.GameObjects.Container | null = null;
  private problemAreaMarkers: Map<string, Phaser.GameObjects.Container> = new Map();
  private currentImageMode: 'actual' | 'standard' | 'compare' = 'actual';

  constructor() {
    super('InspectionScene');
  }

  init(data: InspectionSceneData): void {
    this.currentLevelId = data?.levelId || null;
    this.fromScene = data?.fromScene || 'ConstructionSiteScene';
    this.unlockedPhotoIds = new Set(data?.unlockedPhotoIds || []);
    if (data?.photoId) {
      const level = this.currentLevelId ? configManager.getLevelById(this.currentLevelId) : null;
      const photo = level?.photos.find((p) => p.id === data.photoId);
      if (photo) {
        this.selectedPhoto = photo;
      }
    }
  }

  create(): void {
    super.create();

    this.createBackground();
    this.loadPhotoData();
    this.createHeader();
    this.createPhotoList();
    this.createPhotoDetailPanel();

    if (this.selectedPhoto) {
      this.showPhotoDetail(this.selectedPhoto);
    }

    this.fadeIn(500);

    this.emitEvent(GameEvent.SCENE_CHANGED, { scene: 'InspectionScene' });
  }

  private loadPhotoData(): void {
    if (!this.currentLevelId) return;

    const level = configManager.getLevelById(this.currentLevelId);
    if (!level) return;

    this.allPhotos = level.photos;
    this.visiblePhotos = this.allPhotos.filter((p) =>
      this.unlockedPhotoIds.size === 0 ? true : this.unlockedPhotoIds.has(p.id)
    );
  }

  private createHeader(): void {
    const { width } = this.scale;

    const headerBg = this.add.rectangle(width / 2, 50, width, 80, COLORS.PANEL);
    headerBg.setStrokeStyle(2, COLORS.PANEL_BORDER);

    this.createText(width / 2, 50, '📷 验收照片', {
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

    this.createText(
      width - 30,
      50,
      `解锁: ${this.visiblePhotos.length}/${this.allPhotos.length}`,
      {
        fontSize: 14,
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

  private createPhotoList(): void {
    const { height } = this.scale;
    const panelWidth = 320;
    const panelHeight = height - 140;

    this.photoListContainer = this.createPanel(
      panelWidth / 2 + 20,
      height / 2 + 20,
      panelWidth,
      panelHeight,
      '照片列表'
    );

    if (this.visiblePhotos.length === 0) {
      const placeholder = this.createText(
        panelWidth / 2 + 20,
        height / 2 + 20,
        '暂无解锁的照片\n请先在工地发现线索',
        {
          fontSize: 16,
          color: COLORS.TEXT_DISABLED,
        }
      );
      this.photoListContainer.add(placeholder);
      return;
    }

    const scrollAreaHeight = panelHeight - 80;
    const itemHeight = 90;
    const itemSpacing = 10;
    const startY = -scrollAreaHeight / 2 + itemHeight / 2 + 10;

    this.visiblePhotos.forEach((photo, index) => {
      const y = startY + index * (itemHeight + itemSpacing);
      const item = this.createPhotoListItem(photo, 0, y, panelWidth - 40, itemHeight);
      this.photoListContainer!.add(item.container);
      this.uiElements.set(`photo_item_${photo.id}`, item);
    });
  }

  private createPhotoListItem(
    photo: InspectionPhoto,
    x: number,
    y: number,
    width: number,
    height: number
  ): UIElement {
    const container = this.add.container(x, y);
    const isSelected = this.selectedPhoto?.id === photo.id;

    const bg = this.add.rectangle(0, 0, width, height, isSelected ? COLORS.PRIMARY : COLORS.PANEL_BORDER);
    bg.setStrokeStyle(2, isSelected ? COLORS.ACCENT : COLORS.PANEL_BORDER);

    const thumbnailWidth = 70;
    const thumbnailHeight = 70;
    const thumbnailBg = this.add.rectangle(-width / 2 + 50, 0, thumbnailWidth, thumbnailHeight, COLORS.PRIMARY_DARK);
    thumbnailBg.setStrokeStyle(2, COLORS.ACCENT);

    const icon = this.createText(-width / 2 + 50, 0, '📷', {
      fontSize: 28,
    });

    const title = this.add.text(-width / 2 + 100, -height / 2 + 20, photo.title, {
      fontFamily: FONT_FAMILY,
      fontSize: '15px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    const phaseText = this.add.text(-width / 2 + 100, 0, `阶段: ${this.getPhaseName(photo.phase)}`, {
      fontFamily: FONT_FAMILY,
      fontSize: '12px',
      color: `#${COLORS.TEXT_SECONDARY.toString(16).padStart(6, '0')}`,
    }).setOrigin(0, 0.5);

    const problemCount = photo.problemAreas.length;
    const problemText = this.add.text(-width / 2 + 100, height / 2 - 20, `⚠️ ${problemCount} 个问题区域`, {
      fontFamily: FONT_FAMILY,
      fontSize: '12px',
      color: problemCount > 0 ? `#${COLORS.WARNING.toString(16).padStart(6, '0')}` : `#${COLORS.SUCCESS.toString(16).padStart(6, '0')}`,
    }).setOrigin(0, 0.5);

    container.add([bg, thumbnailBg, icon, title, phaseText, problemText]);

    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerover', () => {
      bg.fillColor = COLORS.PRIMARY_LIGHT;
      this.emitEvent(GameEvent.AUDIO_PLAY, { type: 'sfx', key: 'hover' });
    });
    bg.on('pointerout', () => {
      bg.fillColor = isSelected ? COLORS.PRIMARY : COLORS.PANEL_BORDER;
    });
    bg.on('pointerup', () => {
      this.showPhotoDetail(photo);
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

  private createPhotoDetailPanel(): void {
    const { width, height } = this.scale;
    const panelWidth = width - 400;
    const panelHeight = height - 140;
    const panelX = 20 + panelWidth / 2 + 320;

    this.photoDetailContainer = this.createPanel(
      panelX,
      height / 2 + 20,
      panelWidth,
      panelHeight,
      '照片详情'
    );

    const placeholder = this.createText(
      panelX,
      height / 2 + 20,
      '请从左侧选择一张验收照片',
      {
        fontSize: 18,
        color: COLORS.TEXT_DISABLED,
      }
    );
    this.photoDetailContainer.add(placeholder);
  }

  private showPhotoDetail(photo: InspectionPhoto): void {
    this.selectedPhoto = photo;

    if (!this.photoDetailContainer) return;

    const { width, height } = this.scale;
    const panelWidth = width - 400;
    const panelHeight = height - 140;
    const panelX = this.photoDetailContainer.x;
    const panelY = this.photoDetailContainer.y;

    this.photoDetailContainer.list
      .filter((obj) => obj !== this.photoDetailContainer!.list[0] && obj !== this.photoDetailContainer!.list[1])
      .forEach((obj) => obj.destroy());

    this.problemAreaMarkers.forEach((marker) => marker.destroy());
    this.problemAreaMarkers.clear();

    const contentStartY = panelY - panelHeight / 2 + 60;

    const title = this.createText(panelX - panelWidth / 2 + 30, contentStartY, photo.title, {
      fontSize: 22,
      fontStyle: 'bold',
      color: COLORS.ACCENT,
      origin: { x: 0, y: 0.5 },
    });
    this.photoDetailContainer.add(title);

    const desc = this.createText(panelX - panelWidth / 2 + 30, contentStartY + 35, photo.description, {
      fontSize: 14,
      color: COLORS.TEXT_SECONDARY,
      origin: { x: 0, y: 0.5 },
    });
    desc.setWordWrapWidth(panelWidth - 60);
    this.photoDetailContainer.add(desc);

    const modeButtonsY = contentStartY + 70;
    const modeButtonWidth = 120;
    const modeButtonHeight = 35;

    const modes: { key: 'actual' | 'standard' | 'compare'; label: string }[] = [
      { key: 'actual', label: '实际照片' },
      { key: 'standard', label: '标准图' },
      { key: 'compare', label: '对比视图' },
    ];

    modes.forEach((mode, index) => {
      const btnX = panelX - panelWidth / 2 + 30 + index * (modeButtonWidth + 10) + modeButtonWidth / 2;
      const isActive = this.currentImageMode === mode.key;

      const button = this.createButton({
        x: btnX,
        y: modeButtonsY,
        width: modeButtonWidth,
        height: modeButtonHeight,
        text: mode.label,
        fontSize: 13,
        variant: isActive ? 'primary' : 'secondary',
        onClick: () => this.switchImageMode(mode.key),
      });
      this.uiElements.set(`mode_${mode.key}`, button);
      this.photoDetailContainer!.add(button.container);
    });

    const imageAreaY = modeButtonsY + 60;
    const imageAreaWidth = panelWidth - 60;
    const imageAreaHeight = 280;

    this.renderImageArea(panelX, imageAreaY, imageAreaWidth, imageAreaHeight);

    const problemAreaTitleY = imageAreaY + imageAreaHeight / 2 + 30;
    const problemAreaTitle = this.createText(
      panelX - panelWidth / 2 + 30,
      problemAreaTitleY,
      `问题区域 (${photo.problemAreas.length})`,
      {
        fontSize: 18,
        fontStyle: 'bold',
        color: COLORS.WARNING,
        origin: { x: 0, y: 0.5 },
      }
    );
    this.photoDetailContainer.add(problemAreaTitle);

    const problemListStartY = problemAreaTitleY + 30;
    const problemItemHeight = 60;
    photo.problemAreas.forEach((problem, index) => {
      const y = problemListStartY + index * (problemItemHeight + 10);
      this.renderProblemItem(panelX, y, panelWidth - 60, problemItemHeight, problem, index + 1);
    });
  }

  private renderImageArea(
    centerX: number,
    centerY: number,
    width: number,
    height: number
  ): void {
    const areaBg = this.add.rectangle(centerX, centerY, width, height, COLORS.PRIMARY_DARK);
    areaBg.setStrokeStyle(2, COLORS.PANEL_BORDER);
    this.photoDetailContainer!.add(areaBg);

    if (this.currentImageMode === 'compare') {
      const halfWidth = (width - 20) / 2;
      const leftX = centerX - halfWidth / 2 - 5;
      const rightX = centerX + halfWidth / 2 + 5;

      const leftImg = this.renderMockPhoto(leftX, centerY, halfWidth, height, '实际', COLORS.ERROR);
      const rightImg = this.renderMockPhoto(rightX, centerY, halfWidth, height, '标准', COLORS.SUCCESS);
      this.photoDetailContainer!.add([leftImg, rightImg]);
    } else {
      const label = this.currentImageMode === 'actual' ? '实际拍摄' : '标准对照';
      const labelColor = this.currentImageMode === 'actual' ? COLORS.ERROR : COLORS.SUCCESS;
      const img = this.renderMockPhoto(centerX, centerY, width - 10, height, label, labelColor);
      this.photoDetailContainer!.add(img);
    }

    if (this.currentImageMode !== 'standard' && this.selectedPhoto) {
      this.selectedPhoto.problemAreas.forEach((problem, index) => {
        this.addProblemMarker(centerX, centerY, width - 10, height, problem, index + 1);
      });
    }
  }

  private renderMockPhoto(
    x: number,
    y: number,
    width: number,
    height: number,
    label: string,
    labelColor: number
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    const bg = this.add.rectangle(0, 0, width, height, 0x2a3f5f);
    bg.setStrokeStyle(1, COLORS.PANEL_BORDER);

    const gridGraphics = this.add.graphics();
    gridGraphics.lineStyle(1, COLORS.PANEL_BORDER, 0.3);
    const gridSize = 40;
    for (let gx = -width / 2; gx <= width / 2; gx += gridSize) {
      gridGraphics.beginPath();
      gridGraphics.moveTo(gx, -height / 2);
      gridGraphics.lineTo(gx, height / 2);
      gridGraphics.strokePath();
    }
    for (let gy = -height / 2; gy <= height / 2; gy += gridSize) {
      gridGraphics.beginPath();
      gridGraphics.moveTo(-width / 2, gy);
      gridGraphics.lineTo(width / 2, gy);
      gridGraphics.strokePath();
    }

    const labelBg = this.add.rectangle(0, -height / 2 + 20, 120, 30, labelColor, 0.8);
    const labelText = this.createText(0, -height / 2 + 20, label, {
      fontSize: 14,
      fontStyle: 'bold',
      color: COLORS.TEXT,
    });

    const placeholderText = this.createText(0, 0, `[${label}图像]`, {
      fontSize: 20,
      color: COLORS.TEXT_DISABLED,
    });

    container.add([bg, gridGraphics, labelBg, labelText, placeholderText]);
    return container;
  }

  private addProblemMarker(
    areaCenterX: number,
    areaCenterY: number,
    areaWidth: number,
    areaHeight: number,
    problem: ProblemArea,
    number: number
  ): void {
    const relX = (problem.x / 100 - 0.5) * areaWidth;
    const relY = (problem.y / 100 - 0.5) * areaHeight;
    const relW = (problem.width / 100) * areaWidth;
    const relH = (problem.height / 100) * areaHeight;

    const markerX = areaCenterX + relX;
    const markerY = areaCenterY + relY;

    const marker = this.add.container(markerX, markerY);

    const box = this.add.rectangle(0, 0, relW, relH, undefined, 0);
    box.setStrokeStyle(3, COLORS.ERROR);

    const numberBg = this.add.circle(-relW / 2, -relH / 2, 15, COLORS.ERROR);
    const numberText = this.createText(-relW / 2, -relH / 2, `${number}`, {
      fontSize: 14,
      fontStyle: 'bold',
      color: COLORS.TEXT,
    });

    marker.add([box, numberBg, numberText]);

    const area = this.add.rectangle(0, 0, relW + 10, relH + 10, undefined, 0);
    area.setInteractive({ useHandCursor: true });
    area.on('pointerover', () => {
      box.lineWidth = 5;
      this.emitEvent(GameEvent.AUDIO_PLAY, { type: 'sfx', key: 'hover' });
    });
    area.on('pointerout', () => {
      box.lineWidth = 3;
    });
    area.on('pointerup', () => {
      this.showProblemTooltip(problem, markerX, markerY);
    });

    marker.add(area);
    marker.setDepth(10);

    this.photoDetailContainer!.add(marker);
    this.problemAreaMarkers.set(problem.id, marker);
  }

  private showProblemTooltip(problem: ProblemArea, x: number, y: number): void {
    const existing = this.uiElements.get('problemTooltip');
    if (existing) {
      existing.destroy();
      this.uiElements.delete('problemTooltip');
    }

    const tooltipWidth = 280;
    const tooltipHeight = 100;
    const container = this.add.container(x + tooltipWidth / 2 + 20, y);

    const bg = this.add.rectangle(0, 0, tooltipWidth, tooltipHeight, COLORS.PANEL);
    bg.setStrokeStyle(2, COLORS.ERROR);

    const typeColors: Record<string, { name: string; color: number }> = {
      quality: { name: '质量问题', color: COLORS.WARNING },
      safety: { name: '安全隐患', color: COLORS.ERROR },
      material: { name: '材料问题', color: COLORS.ACCENT },
      design: { name: '设计缺陷', color: COLORS.PRIMARY_LIGHT },
      schedule: { name: '工期问题', color: 0xfdcb6e },
      cost: { name: '成本问题', color: 0xe84393 },
    };

    const typeInfo = typeColors[problem.problemType] || { name: '其他', color: COLORS.TEXT_SECONDARY };

    const typeLabel = this.createText(-tooltipWidth / 2 + 15, -tooltipHeight / 2 + 20, typeInfo.name, {
      fontSize: 13,
      color: typeInfo.color,
      fontStyle: 'bold',
      origin: { x: 0, y: 0.5 },
    });

    const descText = this.createText(-tooltipWidth / 2 + 15, 5, problem.description, {
      fontSize: 12,
      color: COLORS.TEXT,
      origin: { x: 0, y: 0 },
    });
    descText.setWordWrapWidth(tooltipWidth - 30);

    const closeBtn = this.createButton({
      x: tooltipWidth / 2 - 20,
      y: -tooltipHeight / 2 + 15,
      width: 25,
      height: 25,
      text: '✕',
      fontSize: 12,
      variant: 'outline',
      onClick: () => {
        container.destroy();
        this.uiElements.delete('problemTooltip');
      },
    });

    container.add([bg, typeLabel, descText, closeBtn.container]);
    container.setDepth(100);

    this.uiElements.set('problemTooltip', {
      container,
      destroy: () => container.destroy(),
      setVisible: (visible: boolean) => container.setVisible(visible),
      setEnabled: () => {},
    });
  }

  private renderProblemItem(
    centerX: number,
    y: number,
    width: number,
    height: number,
    problem: ProblemArea,
    number: number
  ): void {
    const itemX = centerX;
    const container = this.add.container(itemX, y);

    const bg = this.add.rectangle(0, 0, width, height, COLORS.PANEL_BORDER);
    bg.setStrokeStyle(1, COLORS.PANEL_BORDER);

    const numberBg = this.add.circle(-width / 2 + 35, 0, 22, COLORS.ERROR);
    const numberText = this.createText(-width / 2 + 35, 0, `${number}`, {
      fontSize: 16,
      fontStyle: 'bold',
      color: COLORS.TEXT,
    });

    const typeColors: Record<string, { name: string; color: number }> = {
      quality: { name: '质量问题', color: COLORS.WARNING },
      safety: { name: '安全隐患', color: COLORS.ERROR },
      material: { name: '材料问题', color: COLORS.ACCENT },
      design: { name: '设计缺陷', color: COLORS.PRIMARY_LIGHT },
      schedule: { name: '工期问题', color: 0xfdcb6e },
      cost: { name: '成本问题', color: 0xe84393 },
    };

    const typeInfo = typeColors[problem.problemType] || { name: '其他', color: COLORS.TEXT_SECONDARY };

    const typeLabel = this.add.text(-width / 2 + 70, -height / 2 + 18, typeInfo.name, {
      fontFamily: FONT_FAMILY,
      fontSize: '14px',
      color: `#${typeInfo.color.toString(16).padStart(6, '0')}`,
      fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    const descText = this.add.text(-width / 2 + 70, 5, problem.description, {
      fontFamily: FONT_FAMILY,
      fontSize: '13px',
      color: '#ffffff',
    }).setOrigin(0, 0);
    descText.setWordWrapWidth(width - 100);

    container.add([bg, numberBg, numberText, typeLabel, descText]);
    this.photoDetailContainer!.add(container);
  }

  private switchImageMode(mode: 'actual' | 'standard' | 'compare'): void {
    this.currentImageMode = mode;
    if (this.selectedPhoto) {
      this.showPhotoDetail(this.selectedPhoto);
    }
    this.emitEvent(GameEvent.AUDIO_PLAY, { type: 'sfx', key: 'confirm' });
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

  private handleBack(): void {
    this.emitEvent(GameEvent.AUDIO_PLAY, { type: 'sfx', key: 'cancel' });
    this.transitionToScene(this.fromScene, {
      levelId: this.currentLevelId,
    });
  }
}
