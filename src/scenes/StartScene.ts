import Phaser from 'phaser';
import { BaseScene } from './BaseScene';
import type { DifficultyLevel } from '@/types/game';
import type { DifficultyConfig, TrackingRule } from '@/types/config';

interface EditableConfig {
  difficulty: Partial<DifficultyConfig>;
  itemCooldowns: Record<string, number>;
  tracking: Partial<TrackingRule>;
}

export class StartScene extends BaseScene {
  private selectedDifficulty: DifficultyLevel = 'normal';
  private configPanelVisible = false;
  private editableConfig: EditableConfig = {
    difficulty: {},
    itemCooldowns: {},
    tracking: {},
  };
  private configContentContainer!: Phaser.GameObjects.Container;
  private configScrollY = 0;

  constructor() {
    super('StartScene');
  }

  create(): void {
    super.create();
    this.fadeIn();
    this.createTitle();
    this.createDifficultySelection();
    this.createStartButton();
    this.createConfigButton();
    this.createConfigPanel();

    this.gameStore.subscribe((state) => {
      if (state.phase === 'playing') {
        this.fadeOut(300, () => {
          this.scene.start('GameScene');
        });
      }
    });
  }

  private createTitle(): void {
    const titleContainer = this.add.container(this.centerX, 120);

    const coffeeIcon = this.add.text(0, -30, '☕', {
      fontSize: '56px',
    }).setOrigin(0.5);

    const title = this.add.text(0, 30, '咖啡设备巡检大师', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '40px',
      fontStyle: 'bold',
      color: '#FFFFFF',
    }).setOrigin(0.5);

    const subtitle = this.add.text(0, 70, '连锁设备清洁经营模拟', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '18px',
      color: '#FFB088',
    }).setOrigin(0.5);

    titleContainer.add([coffeeIcon, title, subtitle]);

    this.tweens.add({
      targets: coffeeIcon,
      y: -35,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });
  }

  private createDifficultySelection(): void {
    const difficulties: { level: DifficultyLevel; label: string; desc: string; color: number }[] = [
      { level: 'easy', label: '简单', desc: '8个点位 · 10分钟', color: 0x4CAF50 },
      { level: 'normal', label: '普通', desc: '12个点位 · 7分钟', color: 0xFF9800 },
      { level: 'hard', label: '困难', desc: '16个点位 · 5分钟', color: 0xD32F2F },
    ];

    const container = this.add.container(this.centerX, 260);
    const cards: Phaser.GameObjects.Container[] = [];

    difficulties.forEach((diff, index) => {
      const x = (index - 1) * 220;
      const card = this.createDifficultyCard(x, 0, diff);
      cards.push(card);
      container.add(card);

      card.setInteractive({ useHandCursor: true });
      card.on('pointerdown', () => {
        this.selectDifficulty(diff.level, cards);
        this.playSound('click');
      });
    });

    this.selectDifficulty('normal', cards);
  }

  private createDifficultyCard(
    x: number,
    y: number,
    diff: { level: DifficultyLevel; label: string; desc: string; color: number }
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    const width = 180;
    const height = 140;

    const background = this.add.graphics();
    background.fillStyle(0x3D2D2D, 0.9);
    background.fillRoundedRect(-width / 2, -height / 2, width, height, 12);

    const colorBar = this.add.graphics();
    colorBar.fillStyle(diff.color, 1);
    colorBar.fillRoundedRect(-width / 2 + 10, -height / 2 + 10, width - 20, 8, 4);

    const label = this.add.text(0, -25, diff.label, {
      fontFamily: 'Inter, sans-serif',
      fontSize: '26px',
      fontStyle: 'bold',
      color: '#FFFFFF',
    }).setOrigin(0.5);

    const desc = this.add.text(0, 10, diff.desc, {
      fontFamily: 'Inter, sans-serif',
      fontSize: '14px',
      color: '#BBBBBB',
    }).setOrigin(0.5);

    const checkmark = this.add.text(0, 45, '✓', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '28px',
      color: '#FFFFFF',
    }).setOrigin(0.5).setAlpha(0);

    container.add([background, colorBar, label, desc, checkmark]);
    container.setSize(width, height);

    container.setData('level', diff.level);
    container.setData('background', background);
    container.setData('checkmark', checkmark);

    return container;
  }

  private selectDifficulty(level: DifficultyLevel, cards: Phaser.GameObjects.Container[]): void {
    this.selectedDifficulty = level;
    this.configStore.getState().setDifficulty(level);

    cards.forEach((card) => {
      const cardLevel = card.getData('level') as DifficultyLevel;
      const background = card.getData('background') as Phaser.GameObjects.Graphics;
      const checkmark = card.getData('checkmark') as Phaser.GameObjects.Text;
      const width = 180;
      const height = 140;

      if (cardLevel === level) {
        background.clear();
        background.fillStyle(0x3D2D2D, 1);
        background.fillRoundedRect(-width / 2, -height / 2, width, height, 12);
        background.lineStyle(3, 0xFF6F00, 1);
        background.strokeRoundedRect(-width / 2, -height / 2, width, height, 12);
        checkmark.setAlpha(1);
      } else {
        background.clear();
        background.fillStyle(0x3D2D2D, 0.6);
        background.fillRoundedRect(-width / 2, -height / 2, width, height, 12);
        background.lineStyle(0, 0, 0);
        checkmark.setAlpha(0);
      }
    });
  }

  private createStartButton(): void {
    this.addButton(
      this.centerX,
      380,
      280,
      56,
      '开始巡检',
      () => {
        this.playSound('success');
        this.gameStore.getState().startGame();
      },
      {
        bgColor: 0xFF6F00,
        hoverColor: 0xFF8F3F,
        textColor: '#FFFFFF',
      }
    );
  }

  private createConfigButton(): void {
    const button = this.add.container(this.width - 60, this.height - 60);

    const icon = this.add.text(0, 0, '⚙️', {
      fontSize: '32px',
    }).setOrigin(0.5);

    button.add(icon);
    button.setSize(60, 60);
    button.setInteractive({ useHandCursor: true });

    button.on('pointerover', () => {
      this.tweens.add({
        targets: icon,
        rotation: Math.PI / 4,
        duration: 300,
      });
    });

    button.on('pointerout', () => {
      this.tweens.add({
        targets: icon,
        rotation: 0,
        duration: 300,
      });
    });

    button.on('pointerdown', () => {
      this.playSound('click');
      this.toggleConfigPanel();
    });
  }

  private createConfigPanel(): void {
    const panelWidth = 600;
    const panelHeight = 560;

    const overlay = this.add.rectangle(0, 0, this.width, this.height, 0x000000, 0.7);
    overlay.setAlpha(0).setVisible(false);
    overlay.setName('configOverlay');
    overlay.setInteractive();

    const panel = this.add.container(this.centerX, this.centerY);
    panel.setAlpha(0).setVisible(false);
    panel.setName('configPanel');

    const background = this.add.graphics();
    background.fillStyle(0x1A1A2E, 0.98);
    background.fillRoundedRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, 16);
    background.lineStyle(2, 0xFF6F00, 1);
    background.strokeRoundedRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, 16);

    const title = this.add.text(0, -panelHeight / 2 + 35, '游戏配置', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '26px',
      fontStyle: 'bold',
      color: '#FFFFFF',
    }).setOrigin(0.5);

    const closeBtn = this.add.text(panelWidth / 2 - 30, -panelHeight / 2 + 30, '✕', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '22px',
      color: '#FFFFFF',
    }).setOrigin(0.5);
    closeBtn.setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => {
      this.playSound('click');
      this.toggleConfigPanel();
    });

    const contentBg = this.add.graphics();
    contentBg.fillStyle(0x0D0D1A, 0.6);
    contentBg.fillRoundedRect(-panelWidth / 2 + 20, -panelHeight / 2 + 70, panelWidth - 40, panelHeight - 200, 10);

    this.configContentContainer = this.add.container(0, 0);

    const scrollArea = this.add.container(0, -panelHeight / 2 + 80);
    scrollArea.setSize(panelWidth - 40, panelHeight - 200);
    scrollArea.add(this.configContentContainer);

    const maskShape = this.make.graphics(undefined, false);
    maskShape.fillRect(this.centerX - panelWidth / 2 + 20, this.centerY - panelHeight / 2 + 70, panelWidth - 40, panelHeight - 200);
    const mask = maskShape.createGeometryMask();
    scrollArea.setMask(mask);

    scrollArea.setInteractive(new Phaser.Geom.Rectangle(-(panelWidth - 40) / 2, 0, panelWidth - 40, panelHeight - 200), Phaser.Geom.Rectangle.Contains);
    let isScrolling = false;
    let lastPointerY = 0;

    scrollArea.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      isScrolling = true;
      lastPointerY = pointer.y;
    });

    scrollArea.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!isScrolling) return;
      const deltaY = pointer.y - lastPointerY;
      this.configScrollY = Math.max(-400, Math.min(0, this.configScrollY + deltaY));
      this.configContentContainer.y = this.configScrollY;
      lastPointerY = pointer.y;
    });

    scrollArea.on('pointerup', () => {
      isScrolling = false;
    });

    scrollArea.on('pointerout', () => {
      isScrolling = false;
    });

    const resetBtn = this.addButton(
      -panelWidth / 4,
      panelHeight / 2 - 40,
      180,
      44,
      '重置默认',
      () => {
        this.playSound('click');
        this.configStore.getState().resetToDefaults();
        this.initEditableConfig();
        this.refreshConfigContent();
      },
      { bgColor: 0x555555, hoverColor: 0x777777 }
    );

    const saveBtn = this.addButton(
      panelWidth / 4,
      panelHeight / 2 - 40,
      180,
      44,
      '保存配置',
      () => {
        this.playSound('success');
        this.saveConfig();
        this.toggleConfigPanel();
      },
      { bgColor: 0x4CAF50, hoverColor: 0x66BB6A }
    );

    panel.add([background, title, closeBtn, contentBg, scrollArea, resetBtn, saveBtn]);
  }

  private initEditableConfig(): void {
    const config = this.configStore.getState();
    const diffConfig = config.difficulty[this.selectedDifficulty];

    this.editableConfig = {
      difficulty: { ...diffConfig },
      itemCooldowns: {},
      tracking: { ...config.tracking },
    };

    config.items.forEach((item) => {
      this.editableConfig.itemCooldowns[item.id] = item.cooldown;
    });
  }

  private refreshConfigContent(): void {
    this.configContentContainer.removeAll(true);
    this.configScrollY = 0;
    this.configContentContainer.y = 0;

    const containerWidth = 560;
    let y = 0;

    y = this.addDifficultySection(containerWidth, y);
    y += 30;
    y = this.addItemsSection(containerWidth, y);
    y += 30;
    y = this.addTrackingSection(containerWidth, y);
  }

  private addDifficultySection(width: number, startY: number): number {
    let y = startY;
    const config = this.configStore.getState();
    const currentDiffConfig = config.difficulty[this.selectedDifficulty];
    const diffConfig = { ...currentDiffConfig, ...this.editableConfig.difficulty };

    const title = this.add.text(-width / 2 + 10, y, '📊 难度参数', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#FF6F00',
    }).setOrigin(0);
    this.configContentContainer.add(title);
    y += 30;

    const params: Array<{
      key: keyof DifficultyConfig;
      label: string;
      min: number;
      max: number;
      step: number;
      display?: (v: number) => string;
    }> = [
      { key: 'totalTime', label: '总时间(秒)', min: 120, max: 900, step: 30 },
      { key: 'pointCount', label: '点位数量', min: 4, max: 20, step: 1 },
      { key: 'faultProbability', label: '故障概率', min: 0.05, max: 0.6, step: 0.05, display: (v) => `${Math.round(v * 100)}%` },
      { key: 'cleanProbability', label: '清洁概率', min: 0.1, max: 0.7, step: 0.05, display: (v) => `${Math.round(v * 100)}%` },
      { key: 'decisionTimeLimit', label: '判断时限(秒)', min: 3, max: 30, step: 1 },
      { key: 'eventFrequency', label: '事件频率', min: 0, max: 5, step: 1 },
    ];

    params.forEach((param) => {
      const currentValue = diffConfig[param.key] as number;
      this.addNumberStepper(-width / 2 + 10, y, width - 20, param.label, currentValue, param.min, param.max, param.step,
        (val) => {
          this.editableConfig.difficulty[param.key] = val as any;
          this.refreshConfigContent();
        },
        param.display
      );
      y += 42;
    });

    return y;
  }

  private addItemsSection(width: number, startY: number): number {
    let y = startY;
    const config = this.configStore.getState();

    const title = this.add.text(-width / 2 + 10, y, '🎒 道具冷却(秒)', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#FF6F00',
    }).setOrigin(0);
    this.configContentContainer.add(title);
    y += 30;

    config.items.forEach((item) => {
      const currentValue = this.editableConfig.itemCooldowns[item.id] ?? item.cooldown;
      this.addNumberStepper(-width / 2 + 10, y, width - 20, `${item.icon} ${item.name}`, currentValue, 0, 300, 5,
        (val) => {
          this.editableConfig.itemCooldowns[item.id] = val;
          this.refreshConfigContent();
        }
      );
      y += 42;
    });

    return y;
  }

  private addTrackingSection(width: number, startY: number): number {
    let y = startY;
    const tracking = { ...this.configStore.getState().tracking, ...this.editableConfig.tracking };

    const title = this.add.text(-width / 2 + 10, y, '📈 埋点规则', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#FF6F00',
    }).setOrigin(0);
    this.configContentContainer.add(title);
    y += 30;

    this.addNumberStepper(-width / 2 + 10, y, width - 20, '卡点阈值(秒)', tracking.stuckThreshold!, 2, 30, 1,
      (val) => {
        this.editableConfig.tracking.stuckThreshold = val;
        this.refreshConfigContent();
      }
    );
    y += 42;

    const toggleItems: Array<{ key: keyof TrackingRule; label: string }> = [
      { key: 'trackDecisionTime', label: '记录判断时间' },
      { key: 'trackErrorTypes', label: '记录错误类型' },
      { key: 'trackOperationPath', label: '记录操作路径' },
      { key: 'trackItemUsage', label: '记录道具使用' },
      { key: 'trackEventHandling', label: '记录事件处理' },
    ];

    toggleItems.forEach((item) => {
      this.addToggle(-width / 2 + 10, y, width - 20, item.label, tracking[item.key] as boolean,
        (val) => {
          (this.editableConfig.tracking as any)[item.key] = val;
          this.refreshConfigContent();
        }
      );
      y += 36;
    });

    return y;
  }

  private addNumberStepper(
    x: number,
    y: number,
    width: number,
    label: string,
    value: number,
    min: number,
    max: number,
    step: number,
    onChange: (value: number) => void,
    display?: (v: number) => string
  ): void {
    const container = this.add.container(x, y);

    const labelText = this.add.text(0, 0, label, {
      fontFamily: 'Inter, sans-serif',
      fontSize: '13px',
      color: '#CCCCCC',
    }).setOrigin(0, 0.5);

    const controlsX = width - 120;

    const minusBg = this.add.graphics();
    minusBg.fillStyle(0x3D3D3D, 1);
    minusBg.fillRoundedRect(controlsX, -14, 28, 28, 6);
    const minusBtn = this.add.container(controlsX + 14, 0);
    minusBtn.add(minusBg);
    minusBtn.setSize(28, 28);
    minusBtn.setInteractive({ useHandCursor: true });
    const minusText = this.add.text(controlsX + 14, 0, '−', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#FFFFFF',
    }).setOrigin(0.5);

    const valueText = this.add.text(controlsX + 58, 0, display ? display(value) : String(value), {
      fontFamily: 'Inter, sans-serif',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#FFB088',
    }).setOrigin(0.5);

    const plusBg = this.add.graphics();
    plusBg.fillStyle(0x3D3D3D, 1);
    plusBg.fillRoundedRect(controlsX + 88, -14, 28, 28, 6);
    const plusBtn = this.add.container(controlsX + 102, 0);
    plusBtn.add(plusBg);
    plusBtn.setSize(28, 28);
    plusBtn.setInteractive({ useHandCursor: true });
    const plusText = this.add.text(controlsX + 102, 0, '+', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#FFFFFF',
    }).setOrigin(0.5);

    minusBtn.on('pointerdown', () => {
      if (value - step >= min) {
        this.playSound('click');
        onChange(Math.round((value - step) * 100) / 100);
      }
    });

    plusBtn.on('pointerdown', () => {
      if (value + step <= max) {
        this.playSound('click');
        onChange(Math.round((value + step) * 100) / 100);
      }
    });

    container.add([labelText, minusBtn, minusText, valueText, plusBtn, plusText]);
    this.configContentContainer.add(container);
  }

  private addToggle(
    x: number,
    y: number,
    width: number,
    label: string,
    value: boolean,
    onChange: (value: boolean) => void
  ): void {
    const container = this.add.container(x, y);

    const labelText = this.add.text(0, 0, label, {
      fontFamily: 'Inter, sans-serif',
      fontSize: '13px',
      color: '#CCCCCC',
    }).setOrigin(0, 0.5);

    const toggleX = width - 50;
    const toggleBg = this.add.graphics();

    if (value) {
      toggleBg.fillStyle(0x4CAF50, 1);
      toggleBg.fillRoundedRect(toggleX, -10, 40, 20, 10);
      const knob = this.add.circle(toggleX + 30, 0, 7, 0xFFFFFF, 1);
      container.add([toggleBg, knob]);
    } else {
      toggleBg.fillStyle(0x555555, 1);
      toggleBg.fillRoundedRect(toggleX, -10, 40, 20, 10);
      const knob = this.add.circle(toggleX + 10, 0, 7, 0x888888, 1);
      container.add([toggleBg, knob]);
    }

    const hitArea = this.add.rectangle(toggleX + 20, 0, 40, 24, 0x000000, 0);
    hitArea.setInteractive({ useHandCursor: true });
    hitArea.on('pointerdown', () => {
      this.playSound('click');
      onChange(!value);
    });

    container.add([labelText, hitArea]);
    this.configContentContainer.add(container);
  }

  private saveConfig(): void {
    const config = this.configStore.getState();

    if (Object.keys(this.editableConfig.difficulty).length > 0) {
      config.updateDifficultyConfig(this.selectedDifficulty, this.editableConfig.difficulty);
    }

    Object.entries(this.editableConfig.itemCooldowns).forEach(([itemId, cooldown]) => {
      if (cooldown !== undefined) {
        config.updateItemCooldown(itemId, cooldown);
      }
    });

    if (Object.keys(this.editableConfig.tracking).length > 0) {
      config.updateTrackingRules(this.editableConfig.tracking);
    }

    this.initEditableConfig();
  }

  private toggleConfigPanel(): void {
    this.configPanelVisible = !this.configPanelVisible;
    const panel = this.children.getByName('configPanel') as Phaser.GameObjects.Container;
    const overlay = this.children.getByName('configOverlay') as Phaser.GameObjects.Rectangle;

    if (this.configPanelVisible) {
      this.initEditableConfig();
      this.refreshConfigContent();

      overlay.setVisible(true).setAlpha(0);
      panel.setVisible(true).setAlpha(0).setScale(0.9);

      this.tweens.add({
        targets: overlay,
        alpha: 0.7,
        duration: 200,
      });

      this.tweens.add({
        targets: panel,
        alpha: 1,
        scale: 1,
        duration: 300,
        ease: 'Back.Out',
      });
    } else {
      this.tweens.add({
        targets: overlay,
        alpha: 0,
        duration: 200,
        onComplete: () => overlay.setVisible(false),
      });

      this.tweens.add({
        targets: panel,
        alpha: 0,
        scale: 0.9,
        duration: 200,
        onComplete: () => panel.setVisible(false),
      });
    }
  }
}
