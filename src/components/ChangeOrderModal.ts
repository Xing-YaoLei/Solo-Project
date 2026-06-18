import Phaser from 'phaser';
import { BaseComponent } from './BaseComponent';
import { UI_STYLES } from './styles';
import type { ChangeOrder } from '../models';

export interface ChangeOrderModalConfig {
  width?: number;
  height?: number;
  onSign?: (changeOrder: ChangeOrder) => void;
  onReject?: (changeOrder: ChangeOrder) => void;
  onClose?: () => void;
}

export class ChangeOrderModal extends BaseComponent<ChangeOrderModal> {
  private changeOrder: ChangeOrder | null = null;
  private config: Required<ChangeOrderModalConfig>;
  private overlay!: Phaser.GameObjects.Graphics;
  private background!: Phaser.GameObjects.Graphics;
  private header!: Phaser.GameObjects.Container;
  private titleText!: Phaser.GameObjects.Text;
  private closeButton!: Phaser.GameObjects.Container;
  private contentContainer!: Phaser.GameObjects.Container;
  private reasonSection!: Phaser.GameObjects.Container;
  private planSection!: Phaser.GameObjects.Container;
  private impactSection!: Phaser.GameObjects.Container;
  private warningSection!: Phaser.GameObjects.Container;
  private buttonContainer!: Phaser.GameObjects.Container;
  private rejectButton!: Phaser.GameObjects.Container;
  private signButton!: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene, changeOrder: ChangeOrder | null = null, config: ChangeOrderModalConfig = {}) {
    super(scene);
    this.changeOrder = changeOrder;
    this.config = {
      width: 600,
      height: 650,
      onSign: () => {},
      onReject: () => {},
      onClose: () => {},
      ...config,
    };
    this.initialize();
  }

  protected initialize(): void {
    const { width, height } = this.config;
    const gameWidth = this.scene.scale.width;
    const gameHeight = this.scene.scale.height;
    this.setPosition(gameWidth / 2 - width / 2, gameHeight / 2 - height / 2);
    this.setSize(width, height);
    this.setDepth(1000);

    this.createOverlay();
    this.createBackground();
    this.createHeader();
    this.createContentContainer();
    this.createButtons();
    this.renderContent();
    this.setupInteraction();
  }

  private createOverlay(): void {
    const gameWidth = this.scene.scale.width;
    const gameHeight = this.scene.scale.height;

    this.overlay = this.scene.add.graphics();
    this.overlay.fillStyle(UI_STYLES.colors.overlay, 0.6);
    this.overlay.fillRect(-this.x, -this.y, gameWidth, gameHeight);
    this.overlay.setInteractive(
      new Phaser.Geom.Rectangle(gameWidth / 2, gameHeight / 2, gameWidth, gameHeight),
      Phaser.Geom.Rectangle.Contains as unknown as Phaser.Types.Input.HitAreaCallback
    );
    this.overlay.on('pointerdown', () => {
      if (!this.isDisabled) {
        this.config.onClose();
      }
    });
    this.add(this.overlay);
  }

  private createBackground(): void {
    const { width, height } = this.config;
    this.background = this.scene.add.graphics();
    this.background.fillStyle(UI_STYLES.colors.background, 1);
    this.background.lineStyle(1, UI_STYLES.colors.border, 1);
    this.background.fillRoundedRect(0, 0, width, height, UI_STYLES.radii.xl);
    this.background.strokeRoundedRect(0, 0, width, height, UI_STYLES.radii.xl);
    this.add(this.background);
  }

  private createHeader(): void {
    const { width } = this.config;
    this.header = this.scene.add.container(0, 0);

    const headerBg = this.scene.add.graphics();
    headerBg.fillStyle(UI_STYLES.colors.warning, 1);
    headerBg.fillRoundedRect(0, 0, width, 70, { tl: UI_STYLES.radii.xl, tr: UI_STYLES.radii.xl, bl: 0, br: 0 });
    this.header.add(headerBg);

    const warningIcon = this.scene.add.text(
      UI_STYLES.spacing.lg,
      35,
      '⚠️',
      {
        fontFamily: UI_STYLES.fonts.family,
        fontSize: '28px',
      }
    );
    warningIcon.setOrigin(0, 0.5);
    this.header.add(warningIcon);

    this.titleText = this.scene.add.text(
      UI_STYLES.spacing.lg + 44,
      35,
      this.changeOrder?.title || '变更单确认',
      {
        fontFamily: UI_STYLES.fonts.family,
        fontSize: `${UI_STYLES.fonts.sizes.xl}px`,
        color: '#ffffff',
        fontStyle: 'bold',
      }
    );
    this.titleText.setOrigin(0, 0.5);
    this.header.add(this.titleText);

    this.closeButton = this.scene.add.container(width - UI_STYLES.spacing.lg - 32, 35);
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
      if (this.isDisabled) return;
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
      if (this.isDisabled) return;
      this.config.onClose();
    });

    this.header.add(this.closeButton);
    this.add(this.header);
  }

  private createContentContainer(): void {
    const { width, height } = this.config;
    const contentY = 70 + UI_STYLES.spacing.lg;
    const contentHeight = height - 70 - UI_STYLES.spacing.lg * 2 - 80;

    this.contentContainer = this.scene.add.container(UI_STYLES.spacing.lg, contentY);
    this.contentContainer.setSize(width - UI_STYLES.spacing.lg * 2, contentHeight);

    const maskShape = this.scene.make.graphics({ x: 0, y: 0 });
    maskShape.fillRect(0, 0, width - UI_STYLES.spacing.lg * 2, contentHeight);
    maskShape.setVisible(false);
    const mask = this.contentContainer.createBitmapMask(maskShape);
    this.contentContainer.setMask(mask);

    this.add(this.contentContainer);
  }

  private createButtons(): void {
    const { width, height } = this.config;
    const btnY = height - UI_STYLES.spacing.lg - 56;

    this.buttonContainer = this.scene.add.container(0, btnY);

    this.rejectButton = this.createButton(
      '拒绝',
      UI_STYLES.spacing.lg,
      UI_STYLES.colors.danger,
      () => {
        if (this.isDisabled || !this.changeOrder) return;
        this.config.onReject(this.changeOrder);
      }
    );

    this.signButton = this.createButton(
      '签署确认',
      width - UI_STYLES.spacing.lg - 200,
      UI_STYLES.colors.success,
      () => {
        if (this.isDisabled || !this.changeOrder) return;
        this.config.onSign(this.changeOrder);
      }
    );

    this.buttonContainer.add(this.rejectButton);
    this.buttonContainer.add(this.signButton);
    this.add(this.buttonContainer);
  }

  private createButton(label: string, x: number, color: number, onClick: () => void): Phaser.GameObjects.Container {
    const btnWidth = 200;
    const btnHeight = 56;
    const container = this.scene.add.container(x, 0);
    container.setSize(btnWidth, btnHeight);

    const bg = this.scene.add.graphics();
    bg.fillStyle(color, 1);
    bg.fillRoundedRect(0, 0, btnWidth, btnHeight, UI_STYLES.radii.md);
    container.add(bg);

    const text = this.scene.add.text(
      btnWidth / 2,
      btnHeight / 2,
      label,
      {
        fontFamily: UI_STYLES.fonts.family,
        fontSize: `${UI_STYLES.fonts.sizes.lg}px`,
        color: '#ffffff',
        fontStyle: 'bold',
      }
    );
    text.setOrigin(0.5, 0.5);
    container.add(text);

    container.setInteractive(
      new Phaser.Geom.Rectangle(btnWidth / 2, btnHeight / 2, btnWidth, btnHeight),
      Phaser.Geom.Rectangle.Contains as unknown as Phaser.Types.Input.HitAreaCallback
    );

    container.on('pointerover', () => {
      if (this.isDisabled) return;
      bg.clear();
      bg.fillStyle(color, 0.85);
      bg.fillRoundedRect(0, 0, btnWidth, btnHeight, UI_STYLES.radii.md);
      this.scene.input.setDefaultCursor('pointer');
    });

    container.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(color, 1);
      bg.fillRoundedRect(0, 0, btnWidth, btnHeight, UI_STYLES.radii.md);
      this.scene.input.setDefaultCursor('default');
    });

    container.on('pointerdown', () => {
      if (this.isDisabled) return;
      onClick();
    });

    return container;
  }

  private renderContent(): void {
    this.contentContainer.removeAll(true);

    if (!this.changeOrder) return;

    const { width } = this.config;
    const contentWidth = width - UI_STYLES.spacing.lg * 2;
    let currentY = 0;

    this.reasonSection = this.createSection(
      '变更原因',
      this.changeOrder.reason,
      0,
      contentWidth,
      UI_STYLES.colors.warning
    );
    this.contentContainer.add(this.reasonSection);
    currentY += this.reasonSection.height + UI_STYLES.spacing.lg;

    this.planSection = this.createPlanSection(currentY, contentWidth);
    this.contentContainer.add(this.planSection);
    currentY += this.planSection.height + UI_STYLES.spacing.lg;

    this.impactSection = this.createImpactSection(currentY, contentWidth);
    this.contentContainer.add(this.impactSection);
    currentY += this.impactSection.height + UI_STYLES.spacing.lg;

    this.warningSection = this.createWarningSection(currentY, contentWidth);
    this.contentContainer.add(this.warningSection);
  }

  private createSection(title: string, content: string, y: number, width: number, accentColor: number): Phaser.GameObjects.Container {
    const container = this.scene.add.container(0, y);

    const titleBg = this.scene.add.graphics();
    titleBg.fillStyle(accentColor, 0.1);
    titleBg.fillRoundedRect(0, 0, width, 36, { tl: UI_STYLES.radii.md, tr: UI_STYLES.radii.md, bl: 0, br: 0 });
    container.add(titleBg);

    const titleText = this.scene.add.text(
      UI_STYLES.spacing.md,
      18,
      title,
      {
        fontFamily: UI_STYLES.fonts.family,
        fontSize: `${UI_STYLES.fonts.sizes.md}px`,
        color: `#${accentColor.toString(16).padStart(6, '0')}`,
        fontStyle: 'bold',
      }
    );
    titleText.setOrigin(0, 0.5);
    container.add(titleText);

    const contentText = this.scene.add.text(
      UI_STYLES.spacing.md,
      36 + UI_STYLES.spacing.md,
      content,
      {
        fontFamily: UI_STYLES.fonts.family,
        fontSize: `${UI_STYLES.fonts.sizes.md}px`,
        color: `#${UI_STYLES.colors.text.toString(16).padStart(6, '0')}`,
        wordWrap: { width: width - UI_STYLES.spacing.md * 2 },
      }
    );
    contentText.setOrigin(0, 0);
    container.add(contentText);

    const containerHeight = 36 + UI_STYLES.spacing.md + contentText.height + UI_STYLES.spacing.md;
    container.setSize(width, containerHeight);

    const bg = this.scene.add.graphics();
    bg.lineStyle(1, UI_STYLES.colors.border, 1);
    bg.strokeRoundedRect(0, 0, width, containerHeight, UI_STYLES.radii.md);
    container.addAt(bg, 0);

    return container;
  }

  private createPlanSection(y: number, width: number): Phaser.GameObjects.Container {
    const container = this.scene.add.container(0, y);

    const titleBg = this.scene.add.graphics();
    titleBg.fillStyle(UI_STYLES.colors.primary, 0.1);
    titleBg.fillRoundedRect(0, 0, width, 36, { tl: UI_STYLES.radii.md, tr: UI_STYLES.radii.md, bl: 0, br: 0 });
    container.add(titleBg);

    const titleText = this.scene.add.text(
      UI_STYLES.spacing.md,
      18,
      '方案变更',
      {
        fontFamily: UI_STYLES.fonts.family,
        fontSize: `${UI_STYLES.fonts.sizes.md}px`,
        color: `#${UI_STYLES.colors.primary.toString(16).padStart(6, '0')}`,
        fontStyle: 'bold',
      }
    );
    titleText.setOrigin(0, 0.5);
    container.add(titleText);

    const originalLabel = this.scene.add.text(
      UI_STYLES.spacing.md,
      36 + UI_STYLES.spacing.md,
      '原始方案:',
      {
        fontFamily: UI_STYLES.fonts.family,
        fontSize: `${UI_STYLES.fonts.sizes.sm}px`,
        color: `#${UI_STYLES.colors.textSecondary.toString(16).padStart(6, '0')}`,
        fontStyle: 'bold',
      }
    );
    originalLabel.setOrigin(0, 0);
    container.add(originalLabel);

    const originalText = this.scene.add.text(
      UI_STYLES.spacing.md,
      36 + UI_STYLES.spacing.md + 22,
      this.changeOrder?.originalPlan || '',
      {
        fontFamily: UI_STYLES.fonts.family,
        fontSize: `${UI_STYLES.fonts.sizes.sm}px`,
        color: `#${UI_STYLES.colors.textLight.toString(16).padStart(6, '0')}`,
        wordWrap: { width: width - UI_STYLES.spacing.md * 2 },
      }
    );
    originalText.setOrigin(0, 0);
    container.add(originalText);

    const arrowY = 36 + UI_STYLES.spacing.md + 22 + originalText.height + UI_STYLES.spacing.sm;
    const arrow = this.scene.add.text(
      width / 2,
      arrowY,
      '↓',
      {
        fontFamily: UI_STYLES.fonts.family,
        fontSize: '20px',
        color: `#${UI_STYLES.colors.primary.toString(16).padStart(6, '0')}`,
      }
    );
    arrow.setOrigin(0.5, 0);
    container.add(arrow);

    const newLabel = this.scene.add.text(
      UI_STYLES.spacing.md,
      arrowY + 30,
      '新方案:',
      {
        fontFamily: UI_STYLES.fonts.family,
        fontSize: `${UI_STYLES.fonts.sizes.sm}px`,
        color: `#${UI_STYLES.colors.textSecondary.toString(16).padStart(6, '0')}`,
        fontStyle: 'bold',
      }
    );
    newLabel.setOrigin(0, 0);
    container.add(newLabel);

    const newText = this.scene.add.text(
      UI_STYLES.spacing.md,
      arrowY + 30 + 22,
      this.changeOrder?.newPlan || '',
      {
        fontFamily: UI_STYLES.fonts.family,
        fontSize: `${UI_STYLES.fonts.sizes.sm}px`,
        color: `#${UI_STYLES.colors.text.toString(16).padStart(6, '0')}`,
        wordWrap: { width: width - UI_STYLES.spacing.md * 2 },
      }
    );
    newText.setOrigin(0, 0);
    container.add(newText);

    const containerHeight = arrowY + 30 + 22 + newText.height + UI_STYLES.spacing.md;
    container.setSize(width, containerHeight);

    const bg = this.scene.add.graphics();
    bg.lineStyle(1, UI_STYLES.colors.border, 1);
    bg.strokeRoundedRect(0, 0, width, containerHeight, UI_STYLES.radii.md);
    container.addAt(bg, 0);

    return container;
  }

  private createImpactSection(y: number, width: number): Phaser.GameObjects.Container {
    const container = this.scene.add.container(0, y);

    const titleBg = this.scene.add.graphics();
    titleBg.fillStyle(UI_STYLES.colors.danger, 0.1);
    titleBg.fillRoundedRect(0, 0, width, 36, { tl: UI_STYLES.radii.md, tr: UI_STYLES.radii.md, bl: 0, br: 0 });
    container.add(titleBg);

    const titleText = this.scene.add.text(
      UI_STYLES.spacing.md,
      18,
      '影响分析',
      {
        fontFamily: UI_STYLES.fonts.family,
        fontSize: `${UI_STYLES.fonts.sizes.md}px`,
        color: `#${UI_STYLES.colors.danger.toString(16).padStart(6, '0')}`,
        fontStyle: 'bold',
      }
    );
    titleText.setOrigin(0, 0.5);
    container.add(titleText);

    const impacts = [
      {
        label: '成本增加',
        value: `+¥${this.changeOrder?.costIncrease.toLocaleString() || 0}`,
        color: UI_STYLES.colors.warning,
        icon: '💰',
      },
      {
        label: '工期延长',
        value: `+${this.changeOrder?.timeExtension || 0}天`,
        color: UI_STYLES.colors.info,
        icon: '⏰',
      },
      {
        label: '质量影响',
        value: `${(this.changeOrder?.qualityImpact || 0) >= 0 ? '+' : ''}${this.changeOrder?.qualityImpact || 0}`,
        color: (this.changeOrder?.qualityImpact || 0) >= 0 ? UI_STYLES.colors.success : UI_STYLES.colors.danger,
        icon: '✨',
      },
    ];

    const itemWidth = (width - UI_STYLES.spacing.md * 4) / 3;
    impacts.forEach((impact, i) => {
      const itemX = UI_STYLES.spacing.md + i * (itemWidth + UI_STYLES.spacing.md);
      const itemY = 36 + UI_STYLES.spacing.md;

      const itemBg = this.scene.add.graphics();
      itemBg.fillStyle(impact.color, 0.1);
      itemBg.lineStyle(1, impact.color, 0.5);
      itemBg.fillRoundedRect(itemX, itemY, itemWidth, 80, UI_STYLES.radii.sm);
      itemBg.strokeRoundedRect(itemX, itemY, itemWidth, 80, UI_STYLES.radii.sm);
      container.add(itemBg);

      const icon = this.scene.add.text(
        itemX + itemWidth / 2,
        itemY + 20,
        impact.icon,
        {
          fontFamily: UI_STYLES.fonts.family,
          fontSize: '24px',
        }
      );
      icon.setOrigin(0.5, 0);
      container.add(icon);

      const valueText = this.scene.add.text(
        itemX + itemWidth / 2,
        itemY + 48,
        impact.value,
        {
          fontFamily: UI_STYLES.fonts.family,
          fontSize: `${UI_STYLES.fonts.sizes.lg}px`,
          color: `#${impact.color.toString(16).padStart(6, '0')}`,
          fontStyle: 'bold',
          align: 'center',
        }
      );
      valueText.setOrigin(0.5, 0);
      container.add(valueText);

      const labelText = this.scene.add.text(
        itemX + itemWidth / 2,
        itemY + 60,
        impact.label,
        {
          fontFamily: UI_STYLES.fonts.family,
          fontSize: `${UI_STYLES.fonts.sizes.xs}px`,
          color: `#${UI_STYLES.colors.textSecondary.toString(16).padStart(6, '0')}`,
          align: 'center',
        }
      );
      labelText.setOrigin(0.5, 0);
      container.add(labelText);
    });

    const containerHeight = 36 + UI_STYLES.spacing.md + 80 + UI_STYLES.spacing.md;
    container.setSize(width, containerHeight);

    const bg = this.scene.add.graphics();
    bg.lineStyle(1, UI_STYLES.colors.border, 1);
    bg.strokeRoundedRect(0, 0, width, containerHeight, UI_STYLES.radii.md);
    container.addAt(bg, 0);

    return container;
  }

  private createWarningSection(y: number, width: number): Phaser.GameObjects.Container {
    const container = this.scene.add.container(0, y);

    const warningBg = this.scene.add.graphics();
    warningBg.fillStyle(UI_STYLES.colors.danger, 0.08);
    warningBg.lineStyle(1, UI_STYLES.colors.danger, 0.3);
    warningBg.fillRoundedRect(0, 0, width, 80, UI_STYLES.radii.md);
    warningBg.strokeRoundedRect(0, 0, width, 80, UI_STYLES.radii.md);
    container.add(warningBg);

    const warningIcon = this.scene.add.text(
      UI_STYLES.spacing.lg,
      40,
      '⚠️',
      {
        fontFamily: UI_STYLES.fonts.family,
        fontSize: '28px',
      }
    );
    warningIcon.setOrigin(0, 0.5);
    container.add(warningIcon);

    const warningText = this.scene.add.text(
      UI_STYLES.spacing.lg + 44,
      UI_STYLES.spacing.md,
      '签署后果提示',
      {
        fontFamily: UI_STYLES.fonts.family,
        fontSize: `${UI_STYLES.fonts.sizes.md}px`,
        color: `#${UI_STYLES.colors.danger.toString(16).padStart(6, '0')}`,
        fontStyle: 'bold',
      }
    );
    warningText.setOrigin(0, 0);
    container.add(warningText);

    const descText = this.scene.add.text(
      UI_STYLES.spacing.lg + 44,
      36,
      '变更单一旦签署，成本和工期变更将立即生效。\n请仔细阅读变更内容和潜在后果后再做决定。',
      {
        fontFamily: UI_STYLES.fonts.family,
        fontSize: `${UI_STYLES.fonts.sizes.sm}px`,
        color: `#${UI_STYLES.colors.textSecondary.toString(16).padStart(6, '0')}`,
        lineSpacing: 4,
      }
    );
    descText.setOrigin(0, 0);
    container.add(descText);

    container.setSize(width, 80);
    return container;
  }

  private setupInteraction(): void {
    const { width, height } = this.config;
    this.setInteractive(true);
    if (this.input) {
      this.input.hitArea = new Phaser.Geom.Rectangle(0, 0, width, height);
    }

    this.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.isDisabled) return;
      const localX = pointer.x - this.x;
      const localY = pointer.y - this.y;
      if (localX < 0 || localX > width || localY < 0 || localY > height) {
        this.config.onClose();
      }
    });
  }

  public setChangeOrder(changeOrder: ChangeOrder | null): ChangeOrderModal {
    this.changeOrder = changeOrder;
    this.titleText.setText(changeOrder?.title || '变更单确认');
    this.renderContent();
    return this;
  }

  public show(): this {
    this.setAlpha(0);
    this.setVisible(true);
    this.fadeIn();
    return this;
  }

  public hide(onComplete?: () => void): this {
    this.fadeOut();
    this.scaleOut(UI_STYLES.animation.duration.normal, () => {
      this.setVisible(false);
      onComplete?.();
    });
    return this;
  }

  public onSign(callback: (changeOrder: ChangeOrder) => void): ChangeOrderModal {
    this.config.onSign = callback;
    return this;
  }

  public onReject(callback: (changeOrder: ChangeOrder) => void): ChangeOrderModal {
    this.config.onReject = callback;
    return this;
  }

  public onClose(callback: () => void): ChangeOrderModal {
    this.config.onClose = callback;
    return this;
  }
}
