import Phaser from 'phaser';
import { BaseComponent } from './BaseComponent';
import { UI_STYLES } from './styles';
import type { InspectionPhoto, ProblemArea } from '../models';

export interface PhotoViewerConfig {
  width?: number;
  height?: number;
  onProblemAreaClick?: (area: ProblemArea) => void;
  onClose?: () => void;
}

export class PhotoViewer extends BaseComponent<PhotoViewer> {
  private photo: InspectionPhoto | null = null;
  private config: Required<PhotoViewerConfig>;
  private background!: Phaser.GameObjects.Graphics;
  private header!: Phaser.GameObjects.Container;
  private titleText!: Phaser.GameObjects.Text;
  private closeButton!: Phaser.GameObjects.Container;
  private photoContainer!: Phaser.GameObjects.Container;
  private leftPhotoContainer!: Phaser.GameObjects.Container;
  private rightPhotoContainer!: Phaser.GameObjects.Container;
  private leftLabel!: Phaser.GameObjects.Text;
  private rightLabel!: Phaser.GameObjects.Text;
  private leftPhoto!: Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle;
  private rightPhoto!: Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle;
  private problemAreas: Map<string, { rect: Phaser.GameObjects.Graphics; label: Phaser.GameObjects.Text }> = new Map();
  private controlsContainer!: Phaser.GameObjects.Container;

  private zoomLevel = 1;
  private minZoom = 0.5;
  private maxZoom = 3;
  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private photoOffsetX = 0;
  private photoOffsetY = 0;
  private selectedAreaId: string | null = null;

  constructor(scene: Phaser.Scene, photo: InspectionPhoto | null = null, config: PhotoViewerConfig = {}) {
    super(scene);
    this.photo = photo;
    this.config = {
      width: 900,
      height: 600,
      onProblemAreaClick: () => {},
      onClose: () => {},
      ...config,
    };
    this.initialize();
  }

  protected initialize(): void {
    const { width, height } = this.config;
    this.setSize(width, height);

    this.createBackground();
    this.createHeader();
    this.createPhotoContainer();
    this.createControls();
    this.loadPhoto();
    this.setupInteraction();
  }

  private createBackground(): void {
    const { width, height } = this.config;
    this.background = this.scene.add.graphics();
    this.background.fillStyle(UI_STYLES.colors.surface, 1);
    this.background.fillRoundedRect(0, 0, width, height, UI_STYLES.radii.lg);
    this.add(this.background);
  }

  private createHeader(): void {
    const { width } = this.config;
    this.header = this.scene.add.container(0, 0);

    const headerBg = this.scene.add.graphics();
    headerBg.fillStyle(UI_STYLES.colors.primary, 1);
    headerBg.fillRoundedRect(0, 0, width, 60, { tl: UI_STYLES.radii.lg, tr: UI_STYLES.radii.lg, bl: 0, br: 0 });
    this.header.add(headerBg);

    this.titleText = this.scene.add.text(
      UI_STYLES.spacing.lg,
      30,
      this.photo?.title || '照片查看器',
      {
        fontFamily: UI_STYLES.fonts.family,
        fontSize: `${UI_STYLES.fonts.sizes.xl}px`,
        color: '#ffffff',
        fontStyle: 'bold',
      }
    );
    this.titleText.setOrigin(0, 0.5);
    this.header.add(this.titleText);

    this.closeButton = this.scene.add.container(width - UI_STYLES.spacing.lg - 32, 30);
    this.closeButton.setSize(32, 32);

    const closeBg = this.scene.add.graphics();
    closeBg.fillStyle(0xffffff, 0.2);
    closeBg.fillCircle(16, 16, 16);
    this.closeButton.add(closeBg);

    const closeIcon = this.scene.add.text(16, 16, '✕', {
      fontFamily: UI_STYLES.fonts.family,
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    closeIcon.setOrigin(0.5, 0.5);
    this.closeButton.add(closeIcon);

    this.closeButton.setInteractive(
      new Phaser.Geom.Circle(16, 16, 16),
      Phaser.Geom.Circle.Contains
    );

    this.closeButton.on('pointerover', () => {
      closeBg.clear();
      closeBg.fillStyle(0xffffff, 0.35);
      closeBg.fillCircle(16, 16, 16);
      this.scene.input.setDefaultCursor('pointer');
    });

    this.closeButton.on('pointerout', () => {
      closeBg.clear();
      closeBg.fillStyle(0xffffff, 0.2);
      closeBg.fillCircle(16, 16, 16);
      this.scene.input.setDefaultCursor('default');
    });

    this.closeButton.on('pointerdown', () => {
      this.config.onClose();
    });

    this.header.add(this.closeButton);
    this.add(this.header);
  }

  private createPhotoContainer(): void {
    const { width, height } = this.config;
    const containerWidth = (width - UI_STYLES.spacing.lg * 3) / 2;
    const containerHeight = height - 60 - UI_STYLES.spacing.lg * 2 - 60;

    this.photoContainer = this.scene.add.container(UI_STYLES.spacing.lg, 60 + UI_STYLES.spacing.lg);
    this.photoContainer.setSize(width - UI_STYLES.spacing.lg * 2, containerHeight);

    const maskShape = this.scene.make.graphics({ x: 0, y: 0 });
    maskShape.fillRect(0, 0, width - UI_STYLES.spacing.lg * 2, containerHeight);
    maskShape.setVisible(false);
    const mask = this.photoContainer.createBitmapMask(maskShape);
    this.photoContainer.setMask(mask);

    this.leftPhotoContainer = this.scene.add.container(0, 0);
    this.leftPhotoContainer.setSize(containerWidth, containerHeight);

    const leftBg = this.scene.add.graphics();
    leftBg.fillStyle(UI_STYLES.colors.background, 1);
    leftBg.lineStyle(2, UI_STYLES.colors.border, 1);
    leftBg.fillRoundedRect(0, 0, containerWidth, containerHeight, UI_STYLES.radii.md);
    leftBg.strokeRoundedRect(0, 0, containerWidth, containerHeight, UI_STYLES.radii.md);
    this.leftPhotoContainer.add(leftBg);

    this.leftLabel = this.scene.add.text(
      containerWidth / 2,
      UI_STYLES.spacing.md,
      '验收照片',
      {
        fontFamily: UI_STYLES.fonts.family,
        fontSize: `${UI_STYLES.fonts.sizes.md}px`,
        color: `#${UI_STYLES.colors.danger.toString(16).padStart(6, '0')}`,
        fontStyle: 'bold',
        backgroundColor: `#${UI_STYLES.colors.danger.toString(16).padStart(6, '0')}20`,
        padding: { x: 12, y: 4 },
      }
    );
    this.leftLabel.setOrigin(0.5, 0);
    this.leftPhotoContainer.add(this.leftLabel);

    this.rightPhotoContainer = this.scene.add.container(containerWidth + UI_STYLES.spacing.lg, 0);
    this.rightPhotoContainer.setSize(containerWidth, containerHeight);

    const rightBg = this.scene.add.graphics();
    rightBg.fillStyle(UI_STYLES.colors.background, 1);
    rightBg.lineStyle(2, UI_STYLES.colors.border, 1);
    rightBg.fillRoundedRect(0, 0, containerWidth, containerHeight, UI_STYLES.radii.md);
    rightBg.strokeRoundedRect(0, 0, containerWidth, containerHeight, UI_STYLES.radii.md);
    this.rightPhotoContainer.add(rightBg);

    this.rightLabel = this.scene.add.text(
      containerWidth / 2,
      UI_STYLES.spacing.md,
      '标准照片',
      {
        fontFamily: UI_STYLES.fonts.family,
        fontSize: `${UI_STYLES.fonts.sizes.md}px`,
        color: `#${UI_STYLES.colors.success.toString(16).padStart(6, '0')}`,
        fontStyle: 'bold',
        backgroundColor: `#${UI_STYLES.colors.success.toString(16).padStart(6, '0')}20`,
        padding: { x: 12, y: 4 },
      }
    );
    this.rightLabel.setOrigin(0.5, 0);
    this.rightPhotoContainer.add(this.rightLabel);

    this.photoContainer.add(this.leftPhotoContainer);
    this.photoContainer.add(this.rightPhotoContainer);
    this.add(this.photoContainer);
  }

  private createControls(): void {
    const { width, height } = this.config;
    const controlsY = height - UI_STYLES.spacing.lg - 44;

    this.controlsContainer = this.scene.add.container(width / 2, controlsY);

    const btnSize = 44;
    const btnSpacing = UI_STYLES.spacing.md;

    this.createControlButton('-', -btnSize - btnSpacing);
    this.createControlButton('⟲', 0);
    this.createControlButton('+', btnSize + btnSpacing);

    const zoomText = this.scene.add.text(0, btnSize / 2 + UI_STYLES.spacing.sm, '100%', {
      fontFamily: UI_STYLES.fonts.family,
      fontSize: `${UI_STYLES.fonts.sizes.sm}px`,
      color: `#${UI_STYLES.colors.textSecondary.toString(16).padStart(6, '0')}`,
    });
    zoomText.setOrigin(0.5, 0);
    this.controlsContainer.setData('zoomText', zoomText);
    this.controlsContainer.add(zoomText);

    this.add(this.controlsContainer);
  }

  private createControlButton(label: string, x: number): Phaser.GameObjects.Container {
    const btnSize = 44;
    const container = this.scene.add.container(x, 0);
    container.setSize(btnSize, btnSize);

    const bg = this.scene.add.graphics();
    bg.fillStyle(UI_STYLES.colors.background, 1);
    bg.lineStyle(1, UI_STYLES.colors.border, 1);
    bg.fillRoundedRect(-btnSize / 2, -btnSize / 2, btnSize, btnSize, UI_STYLES.radii.md);
    bg.strokeRoundedRect(-btnSize / 2, -btnSize / 2, btnSize, btnSize, UI_STYLES.radii.md);
    container.add(bg);

    const text = this.scene.add.text(0, 0, label, {
      fontFamily: UI_STYLES.fonts.family,
      fontSize: `${UI_STYLES.fonts.sizes.xl}px`,
      color: `#${UI_STYLES.colors.text.toString(16).padStart(6, '0')}`,
      fontStyle: 'bold',
    });
    text.setOrigin(0.5, 0.5);
    container.add(text);

    container.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, btnSize, btnSize),
      Phaser.Geom.Rectangle.Contains
    );

    container.on('pointerover', () => {
      if (this.isDisabled) return;
      bg.clear();
      bg.fillStyle(UI_STYLES.colors.primary, 0.1);
      bg.lineStyle(2, UI_STYLES.colors.primary, 1);
      bg.fillRoundedRect(-btnSize / 2, -btnSize / 2, btnSize, btnSize, UI_STYLES.radii.md);
      bg.strokeRoundedRect(-btnSize / 2, -btnSize / 2, btnSize, btnSize, UI_STYLES.radii.md);
      this.scene.input.setDefaultCursor('pointer');
    });

    container.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(UI_STYLES.colors.background, 1);
      bg.lineStyle(1, UI_STYLES.colors.border, 1);
      bg.fillRoundedRect(-btnSize / 2, -btnSize / 2, btnSize, btnSize, UI_STYLES.radii.md);
      bg.strokeRoundedRect(-btnSize / 2, -btnSize / 2, btnSize, btnSize, UI_STYLES.radii.md);
      this.scene.input.setDefaultCursor('default');
    });

    container.on('pointerdown', () => {
      if (this.isDisabled) return;
      if (label === '+') {
        this.zoomIn();
      } else if (label === '-') {
        this.zoomOut();
      } else if (label === '⟲') {
        this.resetView();
      }
    });

    this.controlsContainer.add(container);
    return container;
  }

  private loadPhoto(): void {
    const containerWidth = (this.config.width - UI_STYLES.spacing.lg * 3) / 2;
    const containerHeight = this.config.height - 60 - UI_STYLES.spacing.lg * 2 - 60;
    const photoWidth = containerWidth - UI_STYLES.spacing.md * 2;
    const photoHeight = containerHeight - UI_STYLES.spacing.md * 2 - 40;

    if (this.leftPhoto) {
      this.leftPhoto.destroy();
    }
    if (this.rightPhoto) {
      this.rightPhoto.destroy();
    }

    if (this.photo?.imageUrl) {
      this.leftPhoto = this.scene.add.image(
        containerWidth / 2 + this.photoOffsetX,
        containerHeight / 2 + 40 + this.photoOffsetY,
        this.photo.imageUrl
      );
      this.leftPhoto.setScale(this.zoomLevel);
    } else {
      this.leftPhoto = this.scene.add.rectangle(
        containerWidth / 2,
        containerHeight / 2 + 40,
        photoWidth,
        photoHeight,
        0xeeeeee
      );
      const placeholderText = this.scene.add.text(
        containerWidth / 2,
        containerHeight / 2 + 40,
        '验收照片\n暂无图片',
        {
          fontFamily: UI_STYLES.fonts.family,
          fontSize: `${UI_STYLES.fonts.sizes.md}px`,
          color: `#${UI_STYLES.colors.textLight.toString(16).padStart(6, '0')}`,
          align: 'center',
        }
      );
      placeholderText.setOrigin(0.5, 0.5);
      this.leftPhotoContainer.add(placeholderText);
    }

    if (this.photo?.standardImageUrl) {
      this.rightPhoto = this.scene.add.image(
        containerWidth / 2,
        containerHeight / 2 + 40,
        this.photo.standardImageUrl
      );
      const scale = Math.min(photoWidth / this.rightPhoto.width, photoHeight / this.rightPhoto.height);
      this.rightPhoto.setScale(scale);
    } else {
      this.rightPhoto = this.scene.add.rectangle(
        containerWidth / 2,
        containerHeight / 2 + 40,
        photoWidth,
        photoHeight,
        0xf0fff0
      );
      const placeholderText = this.scene.add.text(
        containerWidth / 2,
        containerHeight / 2 + 40,
        '标准照片\n暂无图片',
        {
          fontFamily: UI_STYLES.fonts.family,
          fontSize: `${UI_STYLES.fonts.sizes.md}px`,
          color: `#${UI_STYLES.colors.textLight.toString(16).padStart(6, '0')}`,
          align: 'center',
        }
      );
      placeholderText.setOrigin(0.5, 0.5);
      this.rightPhotoContainer.add(placeholderText);
    }

    this.leftPhotoContainer.add(this.leftPhoto);
    this.rightPhotoContainer.add(this.rightPhoto);

    this.renderProblemAreas();
  }

  private renderProblemAreas(): void {
    this.problemAreas.forEach(({ rect, label }) => {
      rect.destroy();
      label.destroy();
    });
    this.problemAreas.clear();

    if (!this.photo) return;

    const containerWidth = (this.config.width - UI_STYLES.spacing.lg * 3) / 2;
    const containerHeight = this.config.height - 60 - UI_STYLES.spacing.lg * 2 - 60;

    this.photo.problemAreas.forEach((area) => {
      const areaColor = this.getProblemAreaColor(area.problemType);

      const rect = this.scene.add.graphics();
      rect.lineStyle(3, areaColor, 1);
      rect.fillStyle(areaColor, 0.2);
      rect.strokeRect(
        area.x + containerWidth / 2 + this.photoOffsetX,
        area.y + containerHeight / 2 + 40 + this.photoOffsetY,
        area.width * this.zoomLevel,
        area.height * this.zoomLevel
      );
      rect.fillRect(
        area.x + containerWidth / 2 + this.photoOffsetX,
        area.y + containerHeight / 2 + 40 + this.photoOffsetY,
        area.width * this.zoomLevel,
        area.height * this.zoomLevel
      );

      const label = this.scene.add.text(
        area.x + containerWidth / 2 + this.photoOffsetX,
        area.y + containerHeight / 2 + 40 + this.photoOffsetY - 6,
        area.description,
        {
          fontFamily: UI_STYLES.fonts.family,
          fontSize: `${UI_STYLES.fonts.sizes.xs}px`,
          color: '#ffffff',
          backgroundColor: `#${areaColor.toString(16).padStart(6, '0')}`,
          padding: { x: 4, y: 2 },
        }
      );
      label.setOrigin(0, 1);
      label.setScale(this.zoomLevel);

      rect.setInteractive(
        new Phaser.Geom.Rectangle(
          area.x + containerWidth / 2 + this.photoOffsetX + area.width * this.zoomLevel / 2,
          area.y + containerHeight / 2 + 40 + this.photoOffsetY + area.height * this.zoomLevel / 2,
          area.width * this.zoomLevel,
          area.height * this.zoomLevel
        ),
        Phaser.Geom.Rectangle.Contains
      );

      rect.on('pointerover', () => {
        if (this.isDisabled) return;
        this.scene.input.setDefaultCursor('pointer');
      });

      rect.on('pointerout', () => {
        this.scene.input.setDefaultCursor('default');
      });

      rect.on('pointerdown', () => {
        if (this.isDisabled) return;
        this.selectProblemArea(area.id);
        this.config.onProblemAreaClick(area);
      });

      this.problemAreas.set(area.id, { rect, label });
      this.leftPhotoContainer.add(rect);
      this.leftPhotoContainer.add(label);
    });
  }

  private getProblemAreaColor(type: string): number {
    const colors: Record<string, number> = {
      quality: UI_STYLES.colors.danger,
      safety: UI_STYLES.colors.warning,
      design: UI_STYLES.colors.info,
      material: UI_STYLES.colors.secondary,
      schedule: UI_STYLES.colors.primary,
      cost: 0x722ed1,
    };
    return colors[type] || UI_STYLES.colors.danger;
  }

  private selectProblemArea(areaId: string): void {
    if (this.selectedAreaId) {
      this.updateProblemAreaStyle(this.selectedAreaId, false);
    }
    this.selectedAreaId = areaId;
    this.updateProblemAreaStyle(areaId, true);
  }

  private updateProblemAreaStyle(areaId: string, selected: boolean): void {
    const areaData = this.problemAreas.get(areaId);
    if (!areaData || !this.photo) return;

    const area = this.photo.problemAreas.find((a) => a.id === areaId);
    if (!area) return;

    const areaColor = this.getProblemAreaColor(area.problemType);
    const containerWidth = (this.config.width - UI_STYLES.spacing.lg * 3) / 2;
    const containerHeight = this.config.height - 60 - UI_STYLES.spacing.lg * 2 - 60;

    areaData.rect.clear();
    areaData.rect.lineStyle(selected ? 4 : 3, areaColor, 1);
    areaData.rect.fillStyle(areaColor, selected ? 0.4 : 0.2);
    areaData.rect.strokeRect(
      area.x + containerWidth / 2 + this.photoOffsetX,
      area.y + containerHeight / 2 + 40 + this.photoOffsetY,
      area.width * this.zoomLevel,
      area.height * this.zoomLevel
    );
    areaData.rect.fillRect(
      area.x + containerWidth / 2 + this.photoOffsetX,
      area.y + containerHeight / 2 + 40 + this.photoOffsetY,
      area.width * this.zoomLevel,
      area.height * this.zoomLevel
    );
  }

  private setupInteraction(): void {
    const { width, height } = this.config;
    const containerWidth = (width - UI_STYLES.spacing.lg * 3) / 2;
    const containerHeight = height - 60 - UI_STYLES.spacing.lg * 2 - 60;

    this.leftPhotoContainer.setInteractive(
      new Phaser.Geom.Rectangle(containerWidth / 2, containerHeight / 2, containerWidth, containerHeight),
      Phaser.Geom.Rectangle.Contains
    );

    this.leftPhotoContainer.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.isDisabled) return;
      this.isDragging = true;
      this.dragStartX = pointer.x - this.photoOffsetX;
      this.dragStartY = pointer.y - this.photoOffsetY;
    });

    this.leftPhotoContainer.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.isDragging || this.isDisabled) return;
      this.photoOffsetX = pointer.x - this.dragStartX;
      this.photoOffsetY = pointer.y - this.dragStartY;
      this.updatePhotoTransform();
    });

    this.leftPhotoContainer.on('pointerup', () => {
      this.isDragging = false;
    });

    this.leftPhotoContainer.on('pointerupoutside', () => {
      this.isDragging = false;
    });

    this.leftPhotoContainer.on('wheel', (_pointer: unknown, _gameObjects: unknown, _deltaX: number, deltaY: number) => {
      if (this.isDisabled) return;
      const delta = deltaY > 0 ? -0.1 : 0.1;
      this.setZoom(this.zoomLevel + delta);
    });
  }

  private updatePhotoTransform(): void {
    if (this.leftPhoto && this.leftPhoto.type === 'Image') {
      (this.leftPhoto as Phaser.GameObjects.Image).x =
        (this.config.width - UI_STYLES.spacing.lg * 3) / 4 + this.photoOffsetX;
      (this.leftPhoto as Phaser.GameObjects.Image).y =
        (this.config.height - 60 - UI_STYLES.spacing.lg * 2 - 60) / 2 + 40 + this.photoOffsetY;
      (this.leftPhoto as Phaser.GameObjects.Image).setScale(this.zoomLevel);
    }

    this.renderProblemAreas();

    const zoomText = this.controlsContainer.getData('zoomText') as Phaser.GameObjects.Text;
    if (zoomText) {
      zoomText.setText(`${Math.round(this.zoomLevel * 100)}%`);
    }
  }

  private setZoom(zoom: number): void {
    this.zoomLevel = Phaser.Math.Clamp(zoom, this.minZoom, this.maxZoom);
    this.updatePhotoTransform();
  }

  public zoomIn(): PhotoViewer {
    this.setZoom(this.zoomLevel + 0.25);
    return this;
  }

  public zoomOut(): PhotoViewer {
    this.setZoom(this.zoomLevel - 0.25);
    return this;
  }

  public resetView(): PhotoViewer {
    this.zoomLevel = 1;
    this.photoOffsetX = 0;
    this.photoOffsetY = 0;
    this.updatePhotoTransform();
    return this;
  }

  public setPhoto(photo: InspectionPhoto | null): PhotoViewer {
    this.photo = photo;
    this.titleText.setText(photo?.title || '照片查看器');
    this.selectedAreaId = null;
    this.resetView();
    this.loadPhoto();
    return this;
  }

  public onProblemAreaClick(callback: (area: ProblemArea) => void): PhotoViewer {
    this.config.onProblemAreaClick = callback;
    return this;
  }

  public onClose(callback: () => void): PhotoViewer {
    this.config.onClose = callback;
    return this;
  }

  public getSelectedArea(): ProblemArea | null {
    if (!this.selectedAreaId || !this.photo) return null;
    return this.photo.problemAreas.find((a) => a.id === this.selectedAreaId) || null;
  }
}
