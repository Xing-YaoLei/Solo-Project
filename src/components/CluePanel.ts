import Phaser from 'phaser';
import { BaseComponent } from './BaseComponent';
import { UI_STYLES, CLUE_TYPE_CONFIG } from './styles';
import type { Clue, ClueType, ProblemType } from '../models';

export interface CluePanelConfig {
  width?: number;
  height?: number;
  onClueSelect?: (clue: Clue) => void;
}

interface ClueItemData {
  clue: Clue;
  container: Phaser.GameObjects.Container;
  background: Phaser.GameObjects.Graphics;
  icon: Phaser.GameObjects.Text;
  title: Phaser.GameObjects.Text;
  selected: boolean;
}

export class CluePanel extends BaseComponent<CluePanel> {
  private clues: Clue[];
  private selectedClueId: string | null = null;
  private config: Required<CluePanelConfig>;
  private clueItems: Map<string, ClueItemData> = new Map();
  private background!: Phaser.GameObjects.Graphics;
  private header!: Phaser.GameObjects.Container;
  private titleText!: Phaser.GameObjects.Text;
  private countText!: Phaser.GameObjects.Text;
  private listContainer!: Phaser.GameObjects.Container;
  private detailPanel!: Phaser.GameObjects.Container;
  private detailBackground!: Phaser.GameObjects.Graphics;
  private detailIcon!: Phaser.GameObjects.Text;
  private detailTitle!: Phaser.GameObjects.Text;
  private detailType!: Phaser.GameObjects.Text;
  private detailDescription!: Phaser.GameObjects.Text;
  private detailSeverity!: Phaser.GameObjects.Text;
  private detailHint!: Phaser.GameObjects.Text;
  private relatedCluesContainer!: Phaser.GameObjects.Container;
  private scrollY = 0;
  private maxScrollY = 0;

  constructor(scene: Phaser.Scene, clues: Clue[] = [], config: CluePanelConfig = {}) {
    super(scene);
    this.clues = clues;
    this.config = {
      width: 600,
      height: 500,
      onClueSelect: () => {},
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
    this.createDetailPanel();
    this.renderClueList();
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
    headerBg.fillStyle(UI_STYLES.colors.primary, 1);
    headerBg.fillRoundedRect(0, 0, width, 60, { tl: UI_STYLES.radii.lg, tr: UI_STYLES.radii.lg, bl: 0, br: 0 });
    this.header.add(headerBg);

    this.titleText = this.scene.add.text(
      UI_STYLES.spacing.lg,
      30,
      '已发现线索',
      {
        fontFamily: UI_STYLES.fonts.family,
        fontSize: `${UI_STYLES.fonts.sizes.xl}px`,
        color: '#ffffff',
        fontStyle: 'bold',
      }
    );
    this.titleText.setOrigin(0, 0.5);
    this.header.add(this.titleText);

    this.countText = this.scene.add.text(
      width - UI_STYLES.spacing.lg,
      30,
      `${this.clues.length} 条`,
      {
        fontFamily: UI_STYLES.fonts.family,
        fontSize: `${UI_STYLES.fonts.sizes.md}px`,
        color: '#ffffff',
      }
    );
    this.countText.setOrigin(1, 0.5);
    this.header.add(this.countText);

    this.add(this.header);
  }

  private createListContainer(): void {
    const { width, height } = this.config;
    const listWidth = width * 0.4;
    const listHeight = height - 60 - UI_STYLES.spacing.md;

    this.listContainer = this.scene.add.container(UI_STYLES.spacing.md, 60 + UI_STYLES.spacing.md);
    this.listContainer.setSize(listWidth, listHeight);

    const maskShape = this.scene.make.graphics({ x: 0, y: 0 });
    maskShape.fillRect(0, 0, listWidth, listHeight);
    maskShape.setVisible(false);
    const mask = this.listContainer.createBitmapMask(maskShape);
    this.listContainer.setMask(mask);

    this.add(this.listContainer);
  }

  private createDetailPanel(): void {
    const { width, height } = this.config;
    const detailX = width * 0.4 + UI_STYLES.spacing.lg;
    const detailY = 60 + UI_STYLES.spacing.md;
    const detailWidth = width * 0.6 - UI_STYLES.spacing.lg * 1.5;
    const detailHeight = height - 60 - UI_STYLES.spacing.md * 2;

    this.detailPanel = this.scene.add.container(detailX, detailY);
    this.detailPanel.setSize(detailWidth, detailHeight);

    this.detailBackground = this.scene.add.graphics();
    this.detailBackground.fillStyle(UI_STYLES.colors.background, 1);
    this.detailBackground.lineStyle(1, UI_STYLES.colors.border, 1);
    this.detailBackground.fillRoundedRect(0, 0, detailWidth, detailHeight, UI_STYLES.radii.md);
    this.detailBackground.strokeRoundedRect(0, 0, detailWidth, detailHeight, UI_STYLES.radii.md);
    this.detailPanel.add(this.detailBackground);

    this.detailIcon = this.scene.add.text(UI_STYLES.spacing.lg, UI_STYLES.spacing.lg, '🔍', {
      fontFamily: UI_STYLES.fonts.family,
      fontSize: '32px',
    });
    this.detailIcon.setOrigin(0, 0);
    this.detailPanel.add(this.detailIcon);

    this.detailTitle = this.scene.add.text(
      UI_STYLES.spacing.lg + 48,
      UI_STYLES.spacing.lg + 4,
      '选择线索查看详情',
      {
        fontFamily: UI_STYLES.fonts.family,
        fontSize: `${UI_STYLES.fonts.sizes.lg}px`,
        color: `#${UI_STYLES.colors.text.toString(16).padStart(6, '0')}`,
        fontStyle: 'bold',
      }
    );
    this.detailTitle.setOrigin(0, 0);
    this.detailPanel.add(this.detailTitle);

    this.detailType = this.scene.add.text(
      UI_STYLES.spacing.lg + 48,
      UI_STYLES.spacing.lg + 32,
      '',
      {
        fontFamily: UI_STYLES.fonts.family,
        fontSize: `${UI_STYLES.fonts.sizes.sm}px`,
        color: `#${UI_STYLES.colors.textSecondary.toString(16).padStart(6, '0')}`,
      }
    );
    this.detailType.setOrigin(0, 0);
    this.detailPanel.add(this.detailType);

    this.detailDescription = this.scene.add.text(
      UI_STYLES.spacing.lg,
      100,
      '',
      {
        fontFamily: UI_STYLES.fonts.family,
        fontSize: `${UI_STYLES.fonts.sizes.md}px`,
        color: `#${UI_STYLES.colors.text.toString(16).padStart(6, '0')}`,
        wordWrap: { width: detailWidth - UI_STYLES.spacing.lg * 2 },
      }
    );
    this.detailDescription.setOrigin(0, 0);
    this.detailPanel.add(this.detailDescription);

    this.detailSeverity = this.scene.add.text(
      UI_STYLES.spacing.lg,
      180,
      '',
      {
        fontFamily: UI_STYLES.fonts.family,
        fontSize: `${UI_STYLES.fonts.sizes.sm}px`,
        color: `#${UI_STYLES.colors.danger.toString(16).padStart(6, '0')}`,
      }
    );
    this.detailSeverity.setOrigin(0, 0);
    this.detailPanel.add(this.detailSeverity);

    const hintLabel = this.scene.add.text(
      UI_STYLES.spacing.lg,
      220,
      '提示:',
      {
        fontFamily: UI_STYLES.fonts.family,
        fontSize: `${UI_STYLES.fonts.sizes.sm}px`,
        color: `#${UI_STYLES.colors.textSecondary.toString(16).padStart(6, '0')}`,
        fontStyle: 'bold',
      }
    );
    hintLabel.setOrigin(0, 0);
    this.detailPanel.add(hintLabel);

    this.detailHint = this.scene.add.text(
      UI_STYLES.spacing.lg,
      240,
      '',
      {
        fontFamily: UI_STYLES.fonts.family,
        fontSize: `${UI_STYLES.fonts.sizes.sm}px`,
        color: `#${UI_STYLES.colors.info.toString(16).padStart(6, '0')}`,
        wordWrap: { width: detailWidth - UI_STYLES.spacing.lg * 2 },
      }
    );
    this.detailHint.setOrigin(0, 0);
    this.detailPanel.add(this.detailHint);

    const relatedLabel = this.scene.add.text(
      UI_STYLES.spacing.lg,
      300,
      '关联线索:',
      {
        fontFamily: UI_STYLES.fonts.family,
        fontSize: `${UI_STYLES.fonts.sizes.sm}px`,
        color: `#${UI_STYLES.colors.textSecondary.toString(16).padStart(6, '0')}`,
        fontStyle: 'bold',
      }
    );
    relatedLabel.setOrigin(0, 0);
    this.detailPanel.add(relatedLabel);

    this.relatedCluesContainer = this.scene.add.container(UI_STYLES.spacing.lg, 324);
    this.detailPanel.add(this.relatedCluesContainer);

    this.add(this.detailPanel);
  }

  private renderClueList(): void {
    this.clueItems.forEach((item) => {
      item.container.destroy();
    });
    this.clueItems.clear();

    const listWidth = this.config.width * 0.4;
    const itemHeight = 72;
    const spacing = UI_STYLES.spacing.sm;

    this.clues.forEach((clue, index) => {
      const y = index * (itemHeight + spacing);
      const item = this.createClueItem(clue, listWidth, itemHeight, y);
      this.listContainer.add(item.container);
      this.clueItems.set(clue.id, item);
    });

    this.maxScrollY = Math.max(0, this.clues.length * (itemHeight + spacing) - this.listContainer.height);
    this.updateScroll();
  }

  private createClueItem(clue: Clue, width: number, height: number, y: number): ClueItemData {
    const container = this.scene.add.container(0, y);
    container.setSize(width, height);

    const background = this.scene.add.graphics();
    background.fillStyle(UI_STYLES.colors.background, 1);
    background.lineStyle(1, UI_STYLES.colors.border, 1);
    background.fillRoundedRect(0, 0, width, height, UI_STYLES.radii.sm);
    background.strokeRoundedRect(0, 0, width, height, UI_STYLES.radii.sm);
    container.add(background);

    const typeConfig = CLUE_TYPE_CONFIG[clue.type as ClueType];
    const icon = this.scene.add.text(UI_STYLES.spacing.md, height / 2, typeConfig.icon, {
      fontFamily: UI_STYLES.fonts.family,
      fontSize: '24px',
    });
    icon.setOrigin(0, 0.5);
    container.add(icon);

    const title = this.scene.add.text(
      UI_STYLES.spacing.md + 40,
      UI_STYLES.spacing.sm,
      clue.title,
      {
        fontFamily: UI_STYLES.fonts.family,
        fontSize: `${UI_STYLES.fonts.sizes.md}px`,
        color: `#${UI_STYLES.colors.text.toString(16).padStart(6, '0')}`,
        fontStyle: 'bold',
        wordWrap: { width: width - UI_STYLES.spacing.md * 2 - 40 },
      }
    );
    title.setOrigin(0, 0);
    container.add(title);

    const severityText = this.scene.add.text(
      UI_STYLES.spacing.md + 40,
      height - UI_STYLES.spacing.sm,
      `${'●'.repeat(clue.severity)}${'○'.repeat(5 - clue.severity)}`,
      {
        fontFamily: UI_STYLES.fonts.family,
        fontSize: '12px',
        color: `#${typeConfig.color.toString(16).padStart(6, '0')}`,
      }
    );
    severityText.setOrigin(0, 1);
    container.add(severityText);

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
      this.updateClueItemStyle(clue.id);
      this.scene.input.setDefaultCursor('default');
    });

    container.on('pointerdown', () => {
      if (this.isDisabled) return;
      this.selectClue(clue.id);
    });

    return {
      clue,
      container,
      background,
      icon,
      title,
      selected: false,
    };
  }

  private updateClueItemStyle(clueId: string): void {
    const item = this.clueItems.get(clueId);
    if (!item) return;

    const { width, height } = item.container;
    const isSelected = clueId === this.selectedClueId;

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

  private selectClue(clueId: string): void {
    if (this.selectedClueId) {
      this.updateClueItemStyle(this.selectedClueId);
    }

    this.selectedClueId = clueId;
    this.updateClueItemStyle(clueId);

    const clue = this.clues.find((c) => c.id === clueId);
    if (clue) {
      this.showClueDetail(clue);
      this.config.onClueSelect(clue);
    }
  }

  private showClueDetail(clue: Clue): void {
    const typeConfig = CLUE_TYPE_CONFIG[clue.type as ClueType];

    this.detailIcon.setText(typeConfig.icon);
    this.detailTitle.setText(clue.title);
    this.detailType.setText(`${typeConfig.label} · ${this.getProblemTypeLabel(clue.problemType)}`);
    this.detailDescription.setText(clue.description);
    this.detailSeverity.setText(`严重程度: ${'★'.repeat(clue.severity)}${'☆'.repeat(5 - clue.severity)}`);
    this.detailHint.setText(clue.hint);

    this.renderRelatedClues(clue.relatedClueIds);
  }

  private getProblemTypeLabel(type: ProblemType): string {
    const labels: Record<ProblemType, string> = {
      quality: '质量问题',
      safety: '安全隐患',
      design: '设计缺陷',
      material: '材料问题',
      schedule: '进度问题',
      cost: '成本问题',
    };
    return labels[type] || type;
  }

  private renderRelatedClues(relatedIds: string[]): void {
    this.relatedCluesContainer.removeAll(true);

    if (relatedIds.length === 0) {
      const noRelated = this.scene.add.text(0, 0, '暂无关联线索', {
        fontFamily: UI_STYLES.fonts.family,
        fontSize: `${UI_STYLES.fonts.sizes.sm}px`,
        color: `#${UI_STYLES.colors.textLight.toString(16).padStart(6, '0')}`,
      });
      noRelated.setOrigin(0, 0);
      this.relatedCluesContainer.add(noRelated);
      return;
    }

    const detailWidth = this.config.width * 0.6 - UI_STYLES.spacing.lg * 1.5;

    relatedIds.forEach((id, index) => {
      const relatedClue = this.clues.find((c) => c.id === id);
      if (!relatedClue) return;

      const typeConfig = CLUE_TYPE_CONFIG[relatedClue.type as ClueType];
      const y = index * 28;

      const chipBg = this.scene.add.graphics();
      chipBg.fillStyle(typeConfig.color, 0.15);
      chipBg.lineStyle(1, typeConfig.color, 0.5);
      chipBg.fillRoundedRect(0, y, detailWidth - UI_STYLES.spacing.lg * 2, 24, UI_STYLES.radii.sm);
      chipBg.strokeRoundedRect(0, y, detailWidth - UI_STYLES.spacing.lg * 2, 24, UI_STYLES.radii.sm);
      this.relatedCluesContainer.add(chipBg);

      const chipText = this.scene.add.text(8, y + 12, `${typeConfig.icon} ${relatedClue.title}`, {
        fontFamily: UI_STYLES.fonts.family,
        fontSize: `${UI_STYLES.fonts.sizes.sm}px`,
        color: `#${typeConfig.color.toString(16).padStart(6, '0')}`,
      });
      chipText.setOrigin(0, 0.5);
      this.relatedCluesContainer.add(chipText);
    });
  }

  private setupScroll(): void {
    const { width } = this.config;
    const listWidth = width * 0.4;
    const listHeight = this.config.height - 60 - UI_STYLES.spacing.md;

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
    this.clueItems.forEach((item, clueId) => {
      const clue = this.clues.find((c) => c.id === clueId);
      const index = this.clues.indexOf(clue!);
      const itemHeight = 72;
      const spacing = UI_STYLES.spacing.sm;
      const originalY = index * (itemHeight + spacing);
      item.container.y = originalY - this.scrollY;
    });
  }

  public setClues(clues: Clue[]): CluePanel {
    this.clues = clues;
    this.selectedClueId = null;
    this.scrollY = 0;
    this.countText.setText(`${clues.length} 条`);
    this.renderClueList();
    this.resetDetailPanel();
    return this;
  }

  private resetDetailPanel(): void {
    this.detailIcon.setText('🔍');
    this.detailTitle.setText('选择线索查看详情');
    this.detailType.setText('');
    this.detailDescription.setText('');
    this.detailSeverity.setText('');
    this.detailHint.setText('');
    this.renderRelatedClues([]);
  }

  public addClue(clue: Clue): CluePanel {
    if (!this.clues.find((c) => c.id === clue.id)) {
      this.clues.push(clue);
      this.countText.setText(`${this.clues.length} 条`);
      this.renderClueList();
    }
    return this;
  }

  public removeClue(clueId: string): CluePanel {
    this.clues = this.clues.filter((c) => c.id !== clueId);
    if (this.selectedClueId === clueId) {
      this.selectedClueId = null;
      this.resetDetailPanel();
    }
    this.countText.setText(`${this.clues.length} 条`);
    this.renderClueList();
    return this;
  }

  public getSelectedClue(): Clue | null {
    if (!this.selectedClueId) return null;
    return this.clues.find((c) => c.id === this.selectedClueId) || null;
  }

  public onClueSelect(callback: (clue: Clue) => void): CluePanel {
    this.config.onClueSelect = callback;
    return this;
  }
}
