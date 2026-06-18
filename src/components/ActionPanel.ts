import Phaser from 'phaser';
import { BaseComponent } from './BaseComponent';
import { UI_STYLES, ACTION_TYPE_CONFIG } from './styles';
import type { Action, ActionType, ChangeOrder } from '../models';

export interface ActionPanelConfig {
  width?: number;
  height?: number;
  onActionSelect?: (action: Action) => void;
  onActionConfirm?: (action: Action) => void;
  onChangeOrderPreview?: (changeOrder: Partial<ChangeOrder>) => void;
}

interface ActionItemData {
  action: Action;
  container: Phaser.GameObjects.Container;
  background: Phaser.GameObjects.Graphics;
  icon: Phaser.GameObjects.Text;
  title: Phaser.GameObjects.Text;
  costText: Phaser.GameObjects.Text;
  durationText: Phaser.GameObjects.Text;
  riskStars: Phaser.GameObjects.Text[];
  selected: boolean;
}

export class ActionPanel extends BaseComponent<ActionPanel> {
  private actions: Action[];
  private selectedActionId: string | null = null;
  private config: Required<ActionPanelConfig>;
  private actionItems: Map<string, ActionItemData> = new Map();
  private background!: Phaser.GameObjects.Graphics;
  private header!: Phaser.GameObjects.Container;
  private titleText!: Phaser.GameObjects.Text;
  private listContainer!: Phaser.GameObjects.Container;
  private comparisonPanel!: Phaser.GameObjects.Container;
  private previewPanel!: Phaser.GameObjects.Container;
  private confirmButton!: Phaser.GameObjects.Container;
  private confirmText!: Phaser.GameObjects.Text;
  private scrollY = 0;
  private maxScrollY = 0;

  constructor(scene: Phaser.Scene, actions: Action[] = [], config: ActionPanelConfig = {}) {
    super(scene);
    this.actions = actions;
    this.config = {
      width: 700,
      height: 520,
      onActionSelect: () => {},
      onActionConfirm: () => {},
      onChangeOrderPreview: () => {},
      ...config,
    };
    this.initialize();
  }

  protected initialize(): void {
    const { width, height } = this.config;
    this.setSize(width, height);

    this.createBackground();
    this.createHeader();
    this.createListContainer();
    this.createComparisonPanel();
    this.createPreviewPanel();
    this.createConfirmButton();
    this.renderActionList();
    this.setupScroll();
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
    headerBg.fillStyle(UI_STYLES.colors.info, 1);
    headerBg.fillRoundedRect(0, 0, width, 60, { tl: UI_STYLES.radii.lg, tr: UI_STYLES.radii.lg, bl: 0, br: 0 });
    this.header.add(headerBg);

    this.titleText = this.scene.add.text(
      UI_STYLES.spacing.lg,
      30,
      '可用动作',
      {
        fontFamily: UI_STYLES.fonts.family,
        fontSize: `${UI_STYLES.fonts.sizes.xl}px`,
        color: '#ffffff',
        fontStyle: 'bold',
      }
    );
    this.titleText.setOrigin(0, 0.5);
    this.header.add(this.titleText);

    this.add(this.header);
  }

  private createListContainer(): void {
    const { width } = this.config;
    const listWidth = width * 0.45;
    const listHeight = this.config.height - 60 - UI_STYLES.spacing.md - 70;

    this.listContainer = this.scene.add.container(UI_STYLES.spacing.md, 60 + UI_STYLES.spacing.md);
    this.listContainer.setSize(listWidth, listHeight);

    const maskShape = this.scene.make.graphics({ x: 0, y: 0 });
    maskShape.fillRect(0, 0, listWidth, listHeight);
    maskShape.setVisible(false);
    const mask = this.listContainer.createBitmapMask(maskShape);
    this.listContainer.setMask(mask);

    this.add(this.listContainer);
  }

  private createComparisonPanel(): void {
    const { width } = this.config;
    const panelX = width * 0.45 + UI_STYLES.spacing.lg;
    const panelY = 60 + UI_STYLES.spacing.md;
    const panelWidth = width * 0.55 - UI_STYLES.spacing.lg * 1.5;
    const panelHeight = 180;

    this.comparisonPanel = this.scene.add.container(panelX, panelY);
    this.comparisonPanel.setSize(panelWidth, panelHeight);

    const bg = this.scene.add.graphics();
    bg.fillStyle(UI_STYLES.colors.background, 1);
    bg.lineStyle(1, UI_STYLES.colors.border, 1);
    bg.fillRoundedRect(0, 0, panelWidth, panelHeight, UI_STYLES.radii.md);
    bg.strokeRoundedRect(0, 0, panelWidth, panelHeight, UI_STYLES.radii.md);
    this.comparisonPanel.add(bg);

    const title = this.scene.add.text(
      UI_STYLES.spacing.md,
      UI_STYLES.spacing.md,
      '参数对比',
      {
        fontFamily: UI_STYLES.fonts.family,
        fontSize: `${UI_STYLES.fonts.sizes.lg}px`,
        color: `#${UI_STYLES.colors.text.toString(16).padStart(6, '0')}`,
        fontStyle: 'bold',
      }
    );
    title.setOrigin(0, 0);
    this.comparisonPanel.add(title);

    const labels = ['成本', '工期', '风险'];
    const values = ['¥0', '0天', '☆☆☆☆☆'];
    const colors = [UI_STYLES.colors.warning, UI_STYLES.colors.info, UI_STYLES.colors.danger];

    labels.forEach((label, i) => {
      const x = UI_STYLES.spacing.md + (panelWidth - UI_STYLES.spacing.md * 2) / 3 * i;

      const labelText = this.scene.add.text(
        x + (panelWidth - UI_STYLES.spacing.md * 2) / 6,
        60,
        label,
        {
          fontFamily: UI_STYLES.fonts.family,
          fontSize: `${UI_STYLES.fonts.sizes.sm}px`,
          color: `#${UI_STYLES.colors.textSecondary.toString(16).padStart(6, '0')}`,
          align: 'center',
        }
      );
      labelText.setOrigin(0.5, 0);
      this.comparisonPanel.add(labelText);

      const valueText = this.scene.add.text(
        x + (panelWidth - UI_STYLES.spacing.md * 2) / 6,
        90,
        values[i],
        {
          fontFamily: UI_STYLES.fonts.family,
          fontSize: `${UI_STYLES.fonts.sizes.lg}px`,
          color: `#${colors[i].toString(16).padStart(6, '0')}`,
          fontStyle: 'bold',
          align: 'center',
        }
      );
      valueText.setOrigin(0.5, 0);
      this.comparisonPanel.add(valueText);

      this.comparisonPanel.setData(`compareValue_${i}`, valueText);
    });

    const qualityLabel = this.scene.add.text(
      UI_STYLES.spacing.md,
      140,
      '质量影响:',
      {
        fontFamily: UI_STYLES.fonts.family,
        fontSize: `${UI_STYLES.fonts.sizes.sm}px`,
        color: `#${UI_STYLES.colors.textSecondary.toString(16).padStart(6, '0')}`,
      }
    );
    qualityLabel.setOrigin(0, 0);
    this.comparisonPanel.add(qualityLabel);

    const qualityValue = this.scene.add.text(
      UI_STYLES.spacing.md + 70,
      140,
      '±0',
      {
        fontFamily: UI_STYLES.fonts.family,
        fontSize: `${UI_STYLES.fonts.sizes.md}px`,
        color: `#${UI_STYLES.colors.success.toString(16).padStart(6, '0')}`,
        fontStyle: 'bold',
      }
    );
    qualityValue.setOrigin(0, 0);
    this.comparisonPanel.setData('qualityValue', qualityValue);
    this.comparisonPanel.add(qualityValue);

    this.add(this.comparisonPanel);
  }

  private createPreviewPanel(): void {
    const { width, height } = this.config;
    const panelX = width * 0.45 + UI_STYLES.spacing.lg;
    const panelY = 60 + UI_STYLES.spacing.md + 180 + UI_STYLES.spacing.md;
    const panelWidth = width * 0.55 - UI_STYLES.spacing.lg * 1.5;
    const panelHeight = height - 60 - UI_STYLES.spacing.md * 3 - 180 - 70;

    this.previewPanel = this.scene.add.container(panelX, panelY);
    this.previewPanel.setSize(panelWidth, panelHeight);

    const bg = this.scene.add.graphics();
    bg.fillStyle(UI_STYLES.colors.background, 1);
    bg.lineStyle(1, UI_STYLES.colors.border, 1);
    bg.fillRoundedRect(0, 0, panelWidth, panelHeight, UI_STYLES.radii.md);
    bg.strokeRoundedRect(0, 0, panelWidth, panelHeight, UI_STYLES.radii.md);
    this.previewPanel.add(bg);

    const title = this.scene.add.text(
      UI_STYLES.spacing.md,
      UI_STYLES.spacing.md,
      '变更单预览',
      {
        fontFamily: UI_STYLES.fonts.family,
        fontSize: `${UI_STYLES.fonts.sizes.lg}px`,
        color: `#${UI_STYLES.colors.text.toString(16).padStart(6, '0')}`,
        fontStyle: 'bold',
      }
    );
    title.setOrigin(0, 0);
    this.previewPanel.add(title);

    const previewContent = this.scene.add.text(
      UI_STYLES.spacing.md,
      50,
      '选择动作后将显示变更单预览',
      {
        fontFamily: UI_STYLES.fonts.family,
        fontSize: `${UI_STYLES.fonts.sizes.sm}px`,
        color: `#${UI_STYLES.colors.textLight.toString(16).padStart(6, '0')}`,
        wordWrap: { width: panelWidth - UI_STYLES.spacing.md * 2 },
      }
    );
    previewContent.setOrigin(0, 0);
    this.previewPanel.setData('previewContent', previewContent);
    this.previewPanel.add(previewContent);

    this.add(this.previewPanel);
  }

  private createConfirmButton(): void {
    const { width, height } = this.config;
    const btnWidth = 200;
    const btnHeight = 44;
    const btnX = width - UI_STYLES.spacing.lg - btnWidth;
    const btnY = height - UI_STYLES.spacing.lg - btnHeight;

    this.confirmButton = this.scene.add.container(btnX, btnY);
    this.confirmButton.setSize(btnWidth, btnHeight);

    const btnBg = this.scene.add.graphics();
    btnBg.fillStyle(UI_STYLES.colors.border, 1);
    btnBg.fillRoundedRect(0, 0, btnWidth, btnHeight, UI_STYLES.radii.md);
    this.confirmButton.add(btnBg);

    this.confirmText = this.scene.add.text(
      btnWidth / 2,
      btnHeight / 2,
      '确认执行',
      {
        fontFamily: UI_STYLES.fonts.family,
        fontSize: `${UI_STYLES.fonts.sizes.md}px`,
        color: '#ffffff',
        fontStyle: 'bold',
      }
    );
    this.confirmText.setOrigin(0.5, 0.5);
    this.confirmButton.add(this.confirmText);

    this.confirmButton.setInteractive(
      new Phaser.Geom.Rectangle(btnWidth / 2, btnHeight / 2, btnWidth, btnHeight),
      Phaser.Geom.Rectangle.Contains as unknown as Phaser.Types.Input.HitAreaCallback
    );

    this.confirmButton.on('pointerover', () => {
      if (this.isDisabled || !this.selectedActionId) return;
      btnBg.clear();
      btnBg.fillStyle(UI_STYLES.colors.secondary, 1);
      btnBg.fillRoundedRect(0, 0, btnWidth, btnHeight, UI_STYLES.radii.md);
      this.scene.input.setDefaultCursor('pointer');
    });

    this.confirmButton.on('pointerout', () => {
      this.updateConfirmButton();
      this.scene.input.setDefaultCursor('default');
    });

    this.confirmButton.on('pointerdown', () => {
      if (this.isDisabled || !this.selectedActionId) return;
      const action = this.actions.find((a) => a.id === this.selectedActionId);
      if (action) {
        this.config.onActionConfirm(action);
      }
    });

    this.add(this.confirmButton);
  }

  private updateConfirmButton(): void {
    const btnBg = this.confirmButton.getAt(0) as Phaser.GameObjects.Graphics;
    const btnWidth = this.confirmButton.width;
    const btnHeight = this.confirmButton.height;

    btnBg.clear();
    if (this.selectedActionId && !this.isDisabled) {
      btnBg.fillStyle(UI_STYLES.colors.primary, 1);
    } else {
      btnBg.fillStyle(UI_STYLES.colors.border, 1);
    }
    btnBg.fillRoundedRect(0, 0, btnWidth, btnHeight, UI_STYLES.radii.md);
  }

  private renderActionList(): void {
    this.actionItems.forEach((item) => {
      item.container.destroy();
    });
    this.actionItems.clear();

    const listWidth = this.config.width * 0.45;
    const itemHeight = 96;
    const spacing = UI_STYLES.spacing.sm;

    this.actions.forEach((action, index) => {
      const y = index * (itemHeight + spacing);
      const item = this.createActionItem(action, listWidth, itemHeight, y);
      this.listContainer.add(item.container);
      this.actionItems.set(action.id, item);
    });

    this.maxScrollY = Math.max(0, this.actions.length * (itemHeight + spacing) - this.listContainer.height);
    this.updateScroll();
  }

  private createActionItem(action: Action, width: number, height: number, y: number): ActionItemData {
    const container = this.scene.add.container(0, y);
    container.setSize(width, height);

    const background = this.scene.add.graphics();
    background.fillStyle(UI_STYLES.colors.background, 1);
    background.lineStyle(1, UI_STYLES.colors.border, 1);
    background.fillRoundedRect(0, 0, width, height, UI_STYLES.radii.sm);
    background.strokeRoundedRect(0, 0, width, height, UI_STYLES.radii.sm);
    container.add(background);

    const typeConfig = ACTION_TYPE_CONFIG[action.type as ActionType];
    const icon = this.scene.add.text(UI_STYLES.spacing.md, height / 2, typeConfig.icon, {
      fontFamily: UI_STYLES.fonts.family,
      fontSize: '28px',
    });
    icon.setOrigin(0, 0.5);
    container.add(icon);

    const title = this.scene.add.text(
      UI_STYLES.spacing.md + 48,
      UI_STYLES.spacing.sm,
      action.title,
      {
        fontFamily: UI_STYLES.fonts.family,
        fontSize: `${UI_STYLES.fonts.sizes.md}px`,
        color: `#${UI_STYLES.colors.text.toString(16).padStart(6, '0')}`,
        fontStyle: 'bold',
      }
    );
    title.setOrigin(0, 0);
    container.add(title);

    const typeLabel = this.scene.add.text(
      UI_STYLES.spacing.md + 48,
      34,
      typeConfig.label,
      {
        fontFamily: UI_STYLES.fonts.family,
        fontSize: `${UI_STYLES.fonts.sizes.xs}px`,
        color: `#${typeConfig.color.toString(16).padStart(6, '0')}`,
        backgroundColor: `#${typeConfig.color.toString(16).padStart(6, '0')}20`,
        padding: { x: 6, y: 2 },
      }
    );
    typeLabel.setOrigin(0, 0);
    container.add(typeLabel);

    const costText = this.scene.add.text(
      UI_STYLES.spacing.md + 48,
      height - UI_STYLES.spacing.sm,
      `¥${action.cost.toLocaleString()}`,
      {
        fontFamily: UI_STYLES.fonts.family,
        fontSize: `${UI_STYLES.fonts.sizes.sm}px`,
        color: `#${UI_STYLES.colors.warning.toString(16).padStart(6, '0')}`,
        fontStyle: 'bold',
      }
    );
    costText.setOrigin(0, 1);
    container.add(costText);

    const durationText = this.scene.add.text(
      UI_STYLES.spacing.md + 120,
      height - UI_STYLES.spacing.sm,
      `${action.duration}天`,
      {
        fontFamily: UI_STYLES.fonts.family,
        fontSize: `${UI_STYLES.fonts.sizes.sm}px`,
        color: `#${UI_STYLES.colors.info.toString(16).padStart(6, '0')}`,
        fontStyle: 'bold',
      }
    );
    durationText.setOrigin(0, 1);
    container.add(durationText);

    const riskStars: Phaser.GameObjects.Text[] = [];
    for (let i = 0; i < 5; i++) {
      const star = this.scene.add.text(
        width - UI_STYLES.spacing.md - 24 - i * 18,
        height - UI_STYLES.spacing.sm,
        i < action.risk ? '★' : '☆',
        {
          fontFamily: UI_STYLES.fonts.family,
          fontSize: '14px',
          color: `#${UI_STYLES.colors.danger.toString(16).padStart(6, '0')}`,
        }
      );
      star.setOrigin(0, 1);
      riskStars.push(star);
      container.add(star);
    }

    container.setInteractive(
      new Phaser.Geom.Rectangle(width / 2, height / 2, width, height),
      Phaser.Geom.Rectangle.Contains as unknown as Phaser.Types.Input.HitAreaCallback
    );

    container.on('pointerover', () => {
      if (this.isDisabled) return;
      background.clear();
      background.fillStyle(UI_STYLES.colors.primary, 0.08);
      background.lineStyle(1, UI_STYLES.colors.secondary, 1);
      background.fillRoundedRect(0, 0, width, height, UI_STYLES.radii.sm);
      background.strokeRoundedRect(0, 0, width, height, UI_STYLES.radii.sm);
      this.scene.input.setDefaultCursor('pointer');
    });

    container.on('pointerout', () => {
      this.updateActionItemStyle(action.id);
      this.scene.input.setDefaultCursor('default');
    });

    container.on('pointerdown', () => {
      if (this.isDisabled) return;
      this.selectAction(action.id);
    });

    return {
      action,
      container,
      background,
      icon,
      title,
      costText,
      durationText,
      riskStars,
      selected: false,
    };
  }

  private updateActionItemStyle(actionId: string): void {
    const item = this.actionItems.get(actionId);
    if (!item) return;

    const { width, height } = item.container;
    const isSelected = actionId === this.selectedActionId;

    item.background.clear();

    if (isSelected) {
      item.background.fillStyle(UI_STYLES.colors.primary, 0.12);
      item.background.lineStyle(2, UI_STYLES.colors.primary, 1);
    } else {
      item.background.fillStyle(UI_STYLES.colors.background, 1);
      item.background.lineStyle(1, UI_STYLES.colors.border, 1);
    }

    item.background.fillRoundedRect(0, 0, width, height, UI_STYLES.radii.sm);
    item.background.strokeRoundedRect(0, 0, width, height, UI_STYLES.radii.sm);
    item.selected = isSelected;
  }

  private selectAction(actionId: string): void {
    if (this.selectedActionId) {
      this.updateActionItemStyle(this.selectedActionId);
    }

    this.selectedActionId = actionId;
    this.updateActionItemStyle(actionId);
    this.updateConfirmButton();

    const action = this.actions.find((a) => a.id === actionId);
    if (action) {
      this.updateComparisonPanel(action);
      this.updateChangeOrderPreview(action);
      this.config.onActionSelect(action);
    }
  }

  private updateComparisonPanel(action: Action): void {
    const compareValues: Phaser.GameObjects.Text[] = [];
    for (let i = 0; i < 3; i++) {
      compareValues.push(this.comparisonPanel.getData(`compareValue_${i}`));
    }
    const qualityValue = this.comparisonPanel.getData('qualityValue') as Phaser.GameObjects.Text;

    if (compareValues[0]) compareValues[0].setText(`¥${action.cost.toLocaleString()}`);
    if (compareValues[1]) compareValues[1].setText(`${action.duration}天`);
    if (compareValues[2]) compareValues[2].setText(`${'★'.repeat(action.risk)}${'☆'.repeat(5 - action.risk)}`);

    if (qualityValue) {
      const sign = action.qualityImpact >= 0 ? '+' : '';
      qualityValue.setText(`${sign}${action.qualityImpact}`);
      qualityValue.setColor(`#${
        action.qualityImpact > 0
          ? UI_STYLES.colors.success.toString(16).padStart(6, '0')
          : action.qualityImpact < 0
          ? UI_STYLES.colors.danger.toString(16).padStart(6, '0')
          : UI_STYLES.colors.text.toString(16).padStart(6, '0')
      }`);
    }
  }

  private updateChangeOrderPreview(action: Action): void {
    const previewContent = this.previewPanel.getData('previewContent') as Phaser.GameObjects.Text;
    if (!previewContent) return;

    const totalCost = action.cost;
    const totalDuration = action.duration;
    const consequences = action.consequences
      .map((c) => `• ${c.description} (${(c.probability * 100).toFixed(0)}%)`)
      .join('\n');

    const preview = `变更内容:
${action.description}

成本增加: ¥${totalCost.toLocaleString()}
工期延长: ${totalDuration}天
质量影响: ${action.qualityImpact >= 0 ? '+' : ''}${action.qualityImpact}

可能后果:
${consequences || '无'}`;

    previewContent.setText(preview);
    previewContent.setColor(`#${UI_STYLES.colors.text.toString(16).padStart(6, '0')}`);

    this.config.onChangeOrderPreview({
      title: action.title,
      description: action.description,
      costIncrease: totalCost,
      timeExtension: totalDuration,
      qualityImpact: action.qualityImpact,
      relatedActionIds: [action.id],
    });
  }

  private setupScroll(): void {
    const { width } = this.config;
    const listWidth = width * 0.45;
    const listHeight = this.config.height - 60 - UI_STYLES.spacing.md - 70;

    this.setInteractive(true);
    if (this.input) {
      this.input.hitArea = new Phaser.Geom.Rectangle(
        UI_STYLES.spacing.md,
        60 + UI_STYLES.spacing.md,
        listWidth,
        listHeight
      );
    }

    this.on('wheel', (_pointer: unknown, _gameObjects: unknown, _deltaX: number, deltaY: number) => {
      this.scrollY += deltaY * 0.5;
      this.scrollY = Phaser.Math.Clamp(this.scrollY, 0, this.maxScrollY);
      this.updateScroll();
    });
  }

  private updateScroll(): void {
    this.actionItems.forEach((item, actionId) => {
      const action = this.actions.find((a) => a.id === actionId);
      const index = this.actions.indexOf(action!);
      const itemHeight = 96;
      const spacing = UI_STYLES.spacing.sm;
      const originalY = index * (itemHeight + spacing);
      item.container.y = originalY - this.scrollY;
    });
  }

  public setActions(actions: Action[]): ActionPanel {
    this.actions = actions;
    this.selectedActionId = null;
    this.scrollY = 0;
    this.renderActionList();
    this.updateConfirmButton();
    return this;
  }

  public getSelectedAction(): Action | null {
    if (!this.selectedActionId) return null;
    return this.actions.find((a) => a.id === this.selectedActionId) || null;
  }

  public onActionSelect(callback: (action: Action) => void): ActionPanel {
    this.config.onActionSelect = callback;
    return this;
  }

  public onActionConfirm(callback: (action: Action) => void): ActionPanel {
    this.config.onActionConfirm = callback;
    return this;
  }

  public onChangeOrderPreview(callback: (changeOrder: Partial<ChangeOrder>) => void): ActionPanel {
    this.config.onChangeOrderPreview = callback;
    return this;
  }
}
