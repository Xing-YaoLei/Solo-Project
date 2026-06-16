import Phaser from 'phaser';
import { SCENE_KEYS } from '../config/gameConfig';
import { COLORS } from '../config/colors';
import { useGameStore } from '../stores/gameStore';

export class PreloadScene extends Phaser.Scene {
  private progressBar!: Phaser.GameObjects.Graphics;
  private progressBox!: Phaser.GameObjects.Graphics;
  private loadingText!: Phaser.GameObjects.Text;
  private percentText!: Phaser.GameObjects.Text;

  constructor() {
    super(SCENE_KEYS.PRELOAD);
  }

  preload(): void {
    this.createProgressBar();

    this.load.on('progress', (value: number) => {
      this.updateProgress(value);
    });

    this.load.on('complete', () => {
      if (!this.completed) {
        this.completed = true;
        this.onLoadComplete();
      }
    });

    this.loadAssets();
  }

  private completed = false;

  create(): void {
    // 超时保护，确保即使 complete 事件没有正确触发也能跳转
    this.time.delayedCall(2000, () => {
      if (!this.completed && !this.scene.isActive(SCENE_KEYS.MAIN_MENU)) {
        console.log('PreloadScene: Timeout fallback, switching to MainMenuScene');
        this.completed = true;
        this.onLoadComplete();
      }
    });
  }

  private createProgressBar(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const barWidth = 320;
    const barHeight = 40;
    const barX = (width - barWidth) / 2;
    const barY = (height - barHeight) / 2;

    this.progressBox = this.add.graphics();
    this.progressBox.fillStyle(0xffffff, 0.2);
    this.progressBox.fillRoundedRect(barX, barY, barWidth, barHeight, 8);

    this.progressBar = this.add.graphics();

    this.loadingText = this.add.text(width / 2, barY - 40, '正在加载资源...', {
      fontFamily: 'Noto Sans SC, sans-serif',
      fontSize: '20px',
      color: COLORS.neutral[700],
    }).setOrigin(0.5);

    this.percentText = this.add.text(width / 2, barY + barHeight / 2, '0%', {
      fontFamily: 'Noto Sans SC, sans-serif',
      fontSize: '18px',
      color: COLORS.neutral[900],
    }).setOrigin(0.5);

    const title = this.add.text(width / 2, barY - 100, '口腔影像归档培训', {
      fontFamily: 'Noto Sans SC, sans-serif',
      fontSize: '36px',
      fontStyle: 'bold',
      color: COLORS.primary,
    }).setOrigin(0.5);

    this.tweens.add({
      targets: title,
      scale: { from: 0.8, to: 1 },
      duration: 1000,
      ease: 'Elastic.Out',
    });
  }

  private updateProgress(value: number): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const barWidth = 320;
    const barHeight = 40;
    const barX = (width - barWidth) / 2;
    const barY = (height - barHeight) / 2;

    this.progressBar.clear();
    this.progressBar.fillGradientStyle(0x1E88E5, 0x1565C0, 0x1E88E5, 0x1565C0);
    this.progressBar.fillRoundedRect(barX + 4, barY + 4, (barWidth - 8) * value, barHeight - 8, 6);

    this.percentText.setText(`${Math.floor(value * 100)}%`);
  }

  private loadAssets(): void {
    // 加载图标资源（使用 base64 或在线资源）
    this.load.image('icon_archive', 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxib3ggeD0iMyIgeT0iNCIgd2lkdGg9IjE4IiBoZWlnaHQ9IjE2IiByeD0iMiIvPjxwYXRoIGQ9Ik0zIDEwaDE4Ii8+PHBhdGggZD0iTTMgNmgxOCIvPjwvc3ZnPg==');
    this.load.image('icon_check', 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM0M0EwNDciIHN0cm9rZS13aWR0aD0iMyIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cG9seWxpbmUgcG9pbnRzPSIyMCA2IDkgMTcgNCAxMiIvPjwvc3ZnPg==');
    this.load.image('icon_cross', 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNFNTM5MzUiIHN0cm9rZS13aWR0aD0iMyIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48bGluZSB4MT0iMTgiIHkxPSI2IiB4Mj0iNiIgeTI9IjE4Ii8+PGxpbmUgeDE9IjYiIHkxPSI2IiB4Mj0iMTgiIHkyPSIxOCIvPjwvc3ZnPg==');
  }

  private onLoadComplete(): void {
    console.log('PreloadScene: Load complete, switching to MainMenuScene');
    try {
      const setCurrentScene = useGameStore.getState().setCurrentScene;
      setCurrentScene(SCENE_KEYS.MAIN_MENU);
      
      // 立即停止当前场景并启动主菜单
      this.scene.stop(SCENE_KEYS.PRELOAD);
      this.scene.start(SCENE_KEYS.MAIN_MENU);
    } catch (error) {
      console.error('PreloadScene: Error switching to MainMenuScene:', error);
    }
  }
}
