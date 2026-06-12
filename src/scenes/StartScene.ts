import Phaser from 'phaser';
import { BaseScene } from './BaseScene';
import type { DifficultyLevel } from '@/types/game';

export class StartScene extends BaseScene {
  private selectedDifficulty: DifficultyLevel = 'normal';
  private configPanelVisible = false;

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
    const titleContainer = this.add.container(this.centerX, 150);

    const coffeeIcon = this.add.text(0, -40, '☕', {
      fontSize: '64px',
    }).setOrigin(0.5);

    const title = this.add.text(0, 30, '咖啡设备巡检大师', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '48px',
      fontStyle: 'bold',
      color: '#FFFFFF',
    }).setOrigin(0.5);

    const subtitle = this.add.text(0, 80, '连锁设备清洁经营模拟', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '20px',
      color: '#FFB088',
    }).setOrigin(0.5);

    titleContainer.add([coffeeIcon, title, subtitle]);

    this.tweens.add({
      targets: coffeeIcon,
      y: -45,
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

    const container = this.add.container(this.centerX, this.centerY - 20);
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
    const height = 160;

    const background = this.add.graphics();
    background.fillStyle(0x3D2D2D, 0.9);
    background.fillRoundedRect(-width / 2, -height / 2, width, height, 12);

    const colorBar = this.add.graphics();
    colorBar.fillStyle(diff.color, 1);
    colorBar.fillRoundedRect(-width / 2 + 10, -height / 2 + 10, width - 20, 8, 4);

    const label = this.add.text(0, -30, diff.label, {
      fontFamily: 'Inter, sans-serif',
      fontSize: '28px',
      fontStyle: 'bold',
      color: '#FFFFFF',
    }).setOrigin(0.5);

    const desc = this.add.text(0, 10, diff.desc, {
      fontFamily: 'Inter, sans-serif',
      fontSize: '14px',
      color: '#BBBBBB',
    }).setOrigin(0.5);

    const checkmark = this.add.text(0, 50, '✓', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '32px',
      color: '#FFFFFF',
    }).setOrigin(0.5).setAlpha(0);

    container.add([background, colorBar, label, desc, checkmark]);

    container.setData('level', diff.level);
    container.setData('background', background);
    container.setData('checkmark', checkmark);
    container.setSize(width, height);

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
      const height = 160;

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
      this.centerY + 180,
      280,
      60,
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
    const panel = this.add.container(this.centerX, this.centerY);
    panel.setAlpha(0).setVisible(false);
    panel.setName('configPanel');

    const width = 500;
    const height = 400;

    const background = this.add.graphics();
    background.fillStyle(0x1A1A2E, 0.98);
    background.fillRoundedRect(-width / 2, -height / 2, width, height, 16);
    background.lineStyle(2, 0xFF6F00, 1);
    background.strokeRoundedRect(-width / 2, -height / 2, width, height, 16);

    const overlay = this.add.rectangle(0, 0, this.width, this.height, 0x000000, 0.7);
    overlay.setAlpha(0).setVisible(false);
    overlay.setName('configOverlay');
    overlay.setInteractive();

    const title = this.add.text(0, -height / 2 + 40, '游戏配置', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '28px',
      fontStyle: 'bold',
      color: '#FFFFFF',
    }).setOrigin(0.5);

    const closeBtn = this.add.text(width / 2 - 30, -height / 2 + 30, '✕', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '24px',
      color: '#FFFFFF',
    }).setOrigin(0.5);
    closeBtn.setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => {
      this.playSound('click');
      this.toggleConfigPanel();
    });

    this.addConfigSliders(panel, width, height);

    const resetBtn = this.addButton(
      -80,
      height / 2 - 50,
      140,
      40,
      '重置默认',
      () => {
        this.playSound('click');
        this.configStore.getState().resetToDefaults();
        this.selectDifficulty(this.selectedDifficulty, []);
      },
      { bgColor: 0x555555, hoverColor: 0x777777 }
    );

    const saveBtn = this.addButton(
      80,
      height / 2 - 50,
      140,
      40,
      '保存配置',
      () => {
        this.playSound('success');
        this.toggleConfigPanel();
      },
      { bgColor: 0x4CAF50, hoverColor: 0x66BB6A }
    );

    panel.add([background, title, closeBtn, resetBtn, saveBtn]);
  }

  private addConfigSliders(panel: Phaser.GameObjects.Container, width: number, height: number): void {
    const config = this.configStore.getState();
    const diffConfig = config.difficulty[this.selectedDifficulty];

    const items = config.items;
    let yOffset = -80;

    const sectionTitle = this.add.text(-width / 2 + 30, yOffset, '难度参数', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#FF6F00',
    }).setOrigin(0);
    panel.add(sectionTitle);

    yOffset += 40;

    const params: { key: keyof typeof diffConfig; label: string; min: number; max: number; step: number }[] = [
      { key: 'totalTime', label: '总时间(秒)', min: 120, max: 900, step: 30 },
      { key: 'pointCount', label: '点位数量', min: 4, max: 20, step: 1 },
      { key: 'faultProbability', label: '故障概率', min: 0.05, max: 0.6, step: 0.05 },
      { key: 'cleanProbability', label: '清洁概率', min: 0.1, max: 0.7, step: 0.05 },
    ];

    params.forEach((param) => {
      const label = this.add.text(-width / 2 + 30, yOffset, param.label, {
        fontFamily: 'Inter, sans-serif',
        fontSize: '14px',
        color: '#CCCCCC',
      }).setOrigin(0);

      const value = this.add.text(width / 2 - 30, yOffset, String(diffConfig[param.key]), {
        fontFamily: 'Inter, sans-serif',
        fontSize: '14px',
        color: '#FFFFFF',
        fontStyle: 'bold',
      }).setOrigin(1, 0);

      panel.add([label, value]);
      yOffset += 30;
    });

    yOffset += 20;
    const itemsTitle = this.add.text(-width / 2 + 30, yOffset, '道具冷却(秒)', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#FF6F00',
    }).setOrigin(0);
    panel.add(itemsTitle);

    yOffset += 30;

    items.forEach((item) => {
      const label = this.add.text(-width / 2 + 30, yOffset, `${item.icon} ${item.name}`, {
        fontFamily: 'Inter, sans-serif',
        fontSize: '14px',
        color: '#CCCCCC',
      }).setOrigin(0);

      const value = this.add.text(width / 2 - 30, yOffset, String(item.cooldown), {
        fontFamily: 'Inter, sans-serif',
        fontSize: '14px',
        color: '#FFFFFF',
        fontStyle: 'bold',
      }).setOrigin(1, 0);

      panel.add([label, value]);
      yOffset += 25;
    });
  }

  private toggleConfigPanel(): void {
    this.configPanelVisible = !this.configPanelVisible;
    const panel = this.children.getByName('configPanel') as Phaser.GameObjects.Container;
    const overlay = this.children.getByName('configOverlay') as Phaser.GameObjects.Rectangle;

    if (this.configPanelVisible) {
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
