import Phaser from 'phaser';
import { GAME_CONFIG } from '@/config/constants';
import { InputManager } from '@/game/systems/InputManager';
import { isTutorialComplete } from '@/utils/Storage';

interface MenuButton {
  text: string;
  subtext: string;
  action: () => void;
  icon: string;
}

export class MenuScene extends Phaser.Scene {
  private inputManager!: InputManager;
  private buttons: Phaser.GameObjects.Container[] = [];
  private selectedIndex: number = 0;
  private menuButtons: MenuButton[] = [];

  constructor() {
    super('Menu');
  }

  public create(): void {
    this.cameras.main.setBackgroundColor(GAME_CONFIG.COLORS.BG);
    this.inputManager = new InputManager(this);

    this.setupMenuButtons();
    this.createBackground();
    this.createTitle();
    this.createButtons();
    this.createLevelSelector();
    this.setupKeyboardControls();
    this.selectButton(0);
  }

  private setupMenuButtons(): void {
    const firstPlay = !isTutorialComplete();
    this.menuButtons = [
      {
        text: firstPlay ? '开始新手引导' : '开始游戏',
        subtext: firstPlay ? '首次游玩，学习基础操作' : '进入维修车间开始工作',
        icon: '🔧',
        action: () => this.startGame()
      },
      {
        text: '排行榜',
        subtext: '查看返修率和完成时间排行',
        icon: '🏆',
        action: () => this.scene.start('Leaderboard')
      },
      {
        text: '新手引导',
        subtext: '重新学习操作流程',
        icon: '📖',
        action: () => this.scene.start('Tutorial')
      }
    ];
  }

  private createBackground(): void {
    const { width, height } = this.scale;

    for (let i = 0; i < 5; i++) {
      const cx = Phaser.Math.Between(100, width - 100);
      const cy = Phaser.Math.Between(100, height - 100);
      const radius = Phaser.Math.Between(30, 80);
      const gear = this.add.text(cx, cy, '⚙️', {
        fontSize: `${radius}px`,
        color: '#2D5A87'
      }).setOrigin(0.5).setAlpha(0.2);

      this.tweens.add({
        targets: gear,
        rotation: Math.PI * 2,
        duration: Phaser.Math.Between(20000, 40000),
        repeat: -1,
        ease: 'Linear'
      });
    }
  }

  private createTitle(): void {
    const { width } = this.scale;
    const centerX = width / 2;

    const title = this.add.text(centerX, 100, '汽修报价模拟器', {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '56px',
      fontStyle: 'bold',
      color: '#F1F5F9'
    }).setOrigin(0.5);

    title.setShadow(0, 0, '#E85D04', 30);

    this.tweens.add({
      targets: title,
      scaleX: { from: 0.9, to: 1.05 },
      scaleY: { from: 0.9, to: 1.05 },
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    this.add.text(centerX, 170, 'AUTO REPAIR QUOTE SIMULATOR', {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '18px',
      fontStyle: '500',
      color: '#94A3B8'
    }).setOrigin(0.5);

    this.add.text(centerX, 200, '演练维修报价流程 · 追求零返修 · 效率为王', {
      fontFamily: 'Noto Sans SC, sans-serif',
      fontSize: '16px',
      color: '#6B7280'
    }).setOrigin(0.5);
  }

  private createButtons(): void {
    const { width } = this.scale;
    const startY = 280;
    const buttonHeight = 90;
    const spacing = 20;

    this.menuButtons.forEach((btn, index) => {
      const container = this.add.container(width / 2, startY + index * (buttonHeight + spacing));
      container.setSize(480, buttonHeight);
      container.setData('index', index);

      const bg = this.add.rectangle(0, 0, 480, buttonHeight, GAME_CONFIG.COLORS.PRIMARY, 0.8)
        .setStrokeStyle(2, GAME_CONFIG.COLORS.METAL, 0.5)
        .setOrigin(0.5);

      const icon = this.add.text(-200, 0, btn.icon, {
        fontSize: '36px'
      }).setOrigin(0.5);

      const text = this.add.text(-140, -10, btn.text, {
        fontFamily: 'Noto Sans SC, sans-serif',
        fontSize: '22px',
        fontStyle: 'bold',
        color: '#F1F5F9'
      }).setOrigin(0, 0.5);

      const subtext = this.add.text(-140, 20, btn.subtext, {
        fontFamily: 'Noto Sans SC, sans-serif',
        fontSize: '13px',
        color: '#94A3B8'
      }).setOrigin(0, 0.5);

      container.add([bg, icon, text, subtext]);
      this.buttons.push(container);

      container.setInteractive({ useHandCursor: true });
      container.on('pointerover', () => this.selectButton(index));
      container.on('pointerout', () => {
        if (this.selectedIndex !== index) this.deselectButton(index);
      });
      container.on('pointerdown', () => btn.action());
    });
  }

  private createLevelSelector(): void {
    const { width, height } = this.scale;
    const y = height - 80;

    this.add.text(width / 2, y - 35, '选择难度等级', {
      fontFamily: 'Noto Sans SC, sans-serif',
      fontSize: '14px',
      color: '#94A3B8'
    }).setOrigin(0.5);

    GAME_CONFIG.LEVELS.forEach((level, index) => {
      const x = width / 2 - 250 + index * 170;
      const container = this.add.container(x, y);
      container.setSize(150, 40);
      container.setData('levelIndex', index);

      const bg = this.add.rectangle(0, 0, 150, 40, GAME_CONFIG.COLORS.BG_LIGHT, 1)
        .setStrokeStyle(1, GAME_CONFIG.COLORS.METAL, 0.5);

      const text = this.add.text(0, 0, `L${level.id} ${level.name}`, {
        fontFamily: 'Orbitron, sans-serif',
        fontSize: '14px',
        fontStyle: '500',
        color: index === 0 ? '#E85D04' : '#F1F5F9'
      }).setOrigin(0.5);

      container.add([bg, text]);

      container.setInteractive({ useHandCursor: true });
      container.on('pointerover', () => {
        bg.setStrokeStyle(2, GAME_CONFIG.COLORS.ACCENT, 0.8);
      });
      container.on('pointerout', () => {
        bg.setStrokeStyle(1, GAME_CONFIG.COLORS.METAL, 0.5);
      });
      container.on('pointerdown', () => {
        this.registry.set('selectedLevel', level.id);
        this.scene.start('Game');
      });
    });
  }

  private setupKeyboardControls(): void {
    this.inputManager.onKeys(['ArrowUp', 'w', 'W'], () => {
      const newIndex = Math.max(0, this.selectedIndex - 1);
      this.selectButton(newIndex);
    });

    this.inputManager.onKeys(['ArrowDown', 's', 'S'], () => {
      const newIndex = Math.min(this.menuButtons.length - 1, this.selectedIndex + 1);
      this.selectButton(newIndex);
    });

    this.inputManager.onKeys(['Enter', ' '], () => {
      this.menuButtons[this.selectedIndex].action();
    });
  }

  private selectButton(index: number): void {
    this.deselectButton(this.selectedIndex);
    this.selectedIndex = index;

    const container = this.buttons[index];
    if (container) {
      const bg = container.getAt(0) as Phaser.GameObjects.Rectangle;
      bg.setFillStyle(GAME_CONFIG.COLORS.ACCENT, 0.9);
      bg.setStrokeStyle(3, GAME_CONFIG.COLORS.ACCENT_LIGHT, 1);

      this.tweens.add({
        targets: container,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 200,
        ease: 'Back.easeOut'
      });
    }
  }

  private deselectButton(index: number): void {
    const container = this.buttons[index];
    if (container) {
      const bg = container.getAt(0) as Phaser.GameObjects.Rectangle;
      bg.setFillStyle(GAME_CONFIG.COLORS.PRIMARY, 0.8);
      bg.setStrokeStyle(2, GAME_CONFIG.COLORS.METAL, 0.5);

      this.tweens.add({
        targets: container,
        scaleX: 1,
        scaleY: 1,
        duration: 150,
        ease: 'Sine.easeOut'
      });
    }
  }

  private startGame(): void {
    if (!isTutorialComplete()) {
      this.scene.start('Tutorial');
    } else {
      this.scene.start('Game');
    }
  }
}
