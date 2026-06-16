import Phaser from 'phaser';
import { SCENE_KEYS } from '../config/gameConfig';
import { COLORS } from '../config/colors';
import { useGameStore } from '../stores/gameStore';
import { isTutorialCompleted } from '../utils/storage';
import { TUTORIAL_LEVEL } from '../data/levels';

export class MainMenuScene extends Phaser.Scene {
  private buttons: Phaser.GameObjects.Container[] = [];
  private floatingIcons: Phaser.GameObjects.Text[] = [];

  constructor() {
    super(SCENE_KEYS.MAIN_MENU);
  }

  create(): void {
    const setCurrentScene = useGameStore.getState().setCurrentScene;
    setCurrentScene(SCENE_KEYS.MAIN_MENU);

    this.createBackground();
    this.createFloatingIcons();
    this.createTitle();
    this.createButtons();
    this.createFooter();
  }

  private createBackground(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const gradient = this.add.graphics();
    gradient.fillGradientStyle(
      0xE3F2FD,
      0xBBDEFB,
      0xE3F2FD,
      0xBBDEFB
    );
    gradient.fillRect(0, 0, width, height);

    const decorCircle1 = this.add.circle(width * 0.1, height * 0.2, 80, 0x64B5F6, 0.1);
    const decorCircle2 = this.add.circle(width * 0.9, height * 0.8, 120, 0x81C784, 0.1);
    const decorCircle3 = this.add.circle(width * 0.85, height * 0.15, 60, 0xBA68C8, 0.1);

    this.tweens.add({
      targets: [decorCircle1, decorCircle2, decorCircle3],
      scale: { from: 1, to: 1.1 },
      duration: 3000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });
  }

  private createFloatingIcons(): void {
    const icons = ['🦷', '📋', '🖼️', '📁', '⏰', '✅'];
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    icons.forEach((icon, index) => {
      const x = Phaser.Math.Between(50, width - 50);
      const y = Phaser.Math.Between(50, height - 50);
      
      const floatingIcon = this.add.text(x, y, icon, {
        fontSize: '32px',
      }).setAlpha(0.3);

      this.floatingIcons.push(floatingIcon);

      this.tweens.add({
        targets: floatingIcon,
        y: y - 30,
        duration: 2000 + index * 500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut',
        delay: index * 300,
      });
    });
  }

  private createTitle(): void {
    const width = this.cameras.main.width;
    const centerY = this.cameras.main.height * 0.25;

    const title = this.add.text(width / 2, centerY - 20, '🦷 口腔影像归档培训', {
      fontFamily: 'Noto Sans SC, sans-serif',
      fontSize: '56px',
      fontStyle: 'bold',
      color: COLORS.primaryDark,
    }).setOrigin(0.5);

    const subtitle = this.add.text(width / 2, centerY + 50, '模拟真实诊所工作流程，快速掌握影像归档技能', {
      fontFamily: 'Noto Sans SC, sans-serif',
      fontSize: '22px',
      color: COLORS.neutral[600],
    }).setOrigin(0.5);

    this.tweens.add({
      targets: title,
      scale: { from: 0.5, to: 1 },
      alpha: { from: 0, to: 1 },
      duration: 800,
      ease: 'Back.Out',
    });

    this.tweens.add({
      targets: subtitle,
      alpha: { from: 0, to: 1 },
      duration: 800,
      delay: 300,
      ease: 'Cubic.Out',
    });
  }

  private createButtons(): void {
    const width = this.cameras.main.width;
    const startY = this.cameras.main.height * 0.45;
    const buttonSpacing = 90;

    const tutorialDone = isTutorialCompleted();

    const buttonConfigs = [
      {
        label: '开始游戏',
        description: tutorialDone ? '继续您的培训之旅' : '开始新手引导',
        action: () => this.startGame(),
        color: COLORS.primary,
        icon: '🎮',
      },
      {
        label: '关卡选择',
        description: '按岗位挑选训练关卡',
        action: () => this.goToLevelSelect(),
        color: COLORS.success,
        icon: '📋',
      },
      {
        label: '新手引导',
        description: '重新学习游戏玩法',
        action: () => this.startTutorial(),
        color: COLORS.info,
        icon: '❓',
      },
      {
        label: '设置',
        description: '音效、音乐等设置',
        action: () => this.showSettings(),
        color: COLORS.neutral[600],
        icon: '⚙️',
      },
    ];

    buttonConfigs.forEach((config, index) => {
      this.createMenuButton(
        width / 2,
        startY + index * buttonSpacing,
        config.label,
        config.description,
        config.color,
        config.icon,
        config.action,
        index
      );
    });
  }

  private createMenuButton(
    x: number,
    y: number,
    label: string,
    description: string,
    color: string,
    icon: string,
    action: () => void,
    delay: number
  ): void {
    const container = this.add.container(x, y);
    container.setSize(400, 70);
    container.setInteractive({ useHandCursor: true });

    const bg = this.add.graphics();
    bg.fillStyle(0xffffff, 0.95);
    bg.lineStyle(2, parseInt(color.replace('#', ''), 16), 0.3);
    bg.fillRoundedRect(-200, -35, 400, 70, 12);
    bg.strokeRoundedRect(-200, -35, 400, 70, 12);

    const iconText = this.add.text(-170, 0, icon, {
      fontSize: '32px',
    }).setOrigin(0, 0.5);

    const labelText = this.add.text(-120, -12, label, {
      fontFamily: 'Noto Sans SC, sans-serif',
      fontSize: '20px',
      fontStyle: 'bold',
      color: COLORS.neutral[800],
    }).setOrigin(0, 0.5);

    const descText = this.add.text(-120, 15, description, {
      fontFamily: 'Noto Sans SC, sans-serif',
      fontSize: '14px',
      color: COLORS.neutral[500],
    }).setOrigin(0, 0.5);

    const arrow = this.add.text(170, 0, '→', {
      fontFamily: 'Noto Sans SC, sans-serif',
      fontSize: '24px',
      color: color,
      fontStyle: 'bold',
    }).setOrigin(1, 0.5);

    container.add([bg, iconText, labelText, descText, arrow]);

    container.on('pointerover', () => {
      this.tweens.add({
        targets: container,
        scale: 1.03,
        x: x + 10,
        duration: 150,
        ease: 'Cubic.Out',
      });
      bg.clear();
      bg.fillStyle(0xffffff, 1);
      bg.lineStyle(3, parseInt(color.replace('#', ''), 16), 0.8);
      bg.fillRoundedRect(-200, -35, 400, 70, 12);
      bg.strokeRoundedRect(-200, -35, 400, 70, 12);
    });

    container.on('pointerout', () => {
      this.tweens.add({
        targets: container,
        scale: 1,
        x: x,
        duration: 150,
        ease: 'Cubic.Out',
      });
      bg.clear();
      bg.fillStyle(0xffffff, 0.95);
      bg.lineStyle(2, parseInt(color.replace('#', ''), 16), 0.3);
      bg.fillRoundedRect(-200, -35, 400, 70, 12);
      bg.strokeRoundedRect(-200, -35, 400, 70, 12);
    });

    container.on('pointerdown', () => {
      this.tweens.add({
        targets: container,
        scale: 0.98,
        duration: 100,
        ease: 'Cubic.Out',
        yoyo: true,
        onComplete: () => {
          action();
        },
      });
    });

    container.setAlpha(0);
    this.tweens.add({
      targets: container,
      alpha: 1,
      duration: 500,
      delay: 500 + delay * 150,
      ease: 'Cubic.Out',
    });

    this.buttons.push(container);
  }

  private createFooter(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    this.add.text(width / 2, height - 30, 'v1.0.0 | 专业口腔培训系统', {
      fontFamily: 'Noto Sans SC, sans-serif',
      fontSize: '14px',
      color: COLORS.neutral[400],
    }).setOrigin(0.5);
  }

  private startGame(): void {
    const tutorialDone = isTutorialCompleted();
    
    if (tutorialDone) {
      this.goToLevelSelect();
    } else {
      this.startTutorial();
    }
  }

  private startTutorial(): void {
    const startGame = useGameStore.getState().startGame;
    startGame(TUTORIAL_LEVEL, true);
    
    const setCurrentScene = useGameStore.getState().setCurrentScene;
    setCurrentScene(SCENE_KEYS.GAME);
    
    // 停止所有其他场景
    Object.values(SCENE_KEYS).forEach(key => {
      if (key !== SCENE_KEYS.GAME && this.scene.isActive(key)) {
        this.scene.stop(key);
      }
    });
    
    this.scene.start(SCENE_KEYS.GAME);
  }

  private goToLevelSelect(): void {
    const setCurrentScene = useGameStore.getState().setCurrentScene;
    setCurrentScene(SCENE_KEYS.LEVEL_SELECT);
    
    // 停止所有其他场景
    Object.values(SCENE_KEYS).forEach(key => {
      if (key !== SCENE_KEYS.LEVEL_SELECT && this.scene.isActive(key)) {
        this.scene.stop(key);
      }
    });
    
    this.scene.start(SCENE_KEYS.LEVEL_SELECT);
  }

  private showSettings(): void {
    const { toggleSound, toggleMusic, soundEnabled, musicEnabled } = useGameStore.getState();
    
    this.add.dom(this.cameras.main.width / 2, this.cameras.main.height / 2, 'div', `
      background: white;
      padding: 30px;
      border-radius: 16px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
      min-width: 300px;
    `, `
      <h2 style="margin: 0 0 20px 0; color: #1E88E5; font-family: 'Noto Sans SC', sans-serif;">设置</h2>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
        <span style="font-family: 'Noto Sans SC', sans-serif;">🔊 音效</span>
        <button id="soundToggle" style="padding: 8px 16px; border: none; border-radius: 8px; background: ${soundEnabled ? '#43A047' : '#E53935'}; color: white; cursor: pointer; font-family: 'Noto Sans SC', sans-serif;">
          ${soundEnabled ? '开启' : '关闭'}
        </button>
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <span style="font-family: 'Noto Sans SC', sans-serif;">🎵 音乐</span>
        <button id="musicToggle" style="padding: 8px 16px; border: none; border-radius: 8px; background: ${musicEnabled ? '#43A047' : '#E53935'}; color: white; cursor: pointer; font-family: 'Noto Sans SC', sans-serif;">
          ${musicEnabled ? '开启' : '关闭'}
        </button>
      </div>
      <button id="closeSettings" style="width: 100%; padding: 12px; border: none; border-radius: 8px; background: #1E88E5; color: white; cursor: pointer; font-family: 'Noto Sans SC', sans-serif; font-size: 16px;">
        关闭
      </button>
    `).setOrigin(0.5);

    setTimeout(() => {
      document.getElementById('soundToggle')?.addEventListener('click', () => {
        toggleSound();
        this.scene.restart();
      });
      document.getElementById('musicToggle')?.addEventListener('click', () => {
        toggleMusic();
        this.scene.restart();
      });
      document.getElementById('closeSettings')?.addEventListener('click', () => {
        this.scene.restart();
      });
    }, 100);
  }

  update(): void {
    //
  }
}
