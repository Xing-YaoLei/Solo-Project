import { Scene, GameObjects, Time } from 'phaser';
import { ProgressBar } from '../ui/ProgressBar';
import { COLORS, GAME_WIDTH, GAME_HEIGHT, ANIMATION_DURATIONS } from '../utils/constants';

const TIPS = [
  '💡 小提示：仔细观察赞助权益与票种的对应关系',
  '🎯 快速准确地核销可以获得更高评分',
  '⚠️ 遇到退票争议时，仔细核对信息再做决定',
  '⭐ 每关获得 1 星以上即可解锁下一关',
  '⌨️ 键盘：A/← 拒绝，D/→ 通过，空格确认',
  '👆 触屏：左滑拒绝，右滑通过，点击确认',
  '🏆 追求三星完美评价，挑战更高分数',
  '📊 复盘页可以查看你的效率变化趋势',
];

export class PreloadScene extends Scene {
  private progressBar!: ProgressBar;
  private tipText!: GameObjects.Text;
  private titleText!: GameObjects.Text;
  private tipTimer!: Time.TimerEvent;
  private currentTipIndex: number = 0;

  constructor() {
    super('PreloadScene');
  }

  preload(): void {
    this.cameras.main.setBackgroundColor('#0a0a1a');

    this.createBackground();
    this.createTitle();
    this.createProgressBar();
    this.createTipText();
    this.createParticles();

    this.load.on('progress', (value: number) => {
      this.progressBar.progress = value;
    });

    this.load.on('complete', () => {
      this.progressBar.progress = 1;
      this.time.delayedCall(ANIMATION_DURATIONS.slow, () => {
        this.fadeOutAndStart();
      });
    });

    this.simulateLoading();
  }

  private createBackground(): void {
    const bgGradient = this.add.graphics();
    
    for (let i = 0; i < GAME_HEIGHT; i++) {
      const alpha = 0.3 + (i / GAME_HEIGHT) * 0.3;
      const color = Phaser.Display.Color.GetColor(
        15 + i * 0.02,
        20 + i * 0.02,
        45 + i * 0.05
      );
      bgGradient.fillStyle(color, alpha);
      bgGradient.fillRect(0, i, GAME_WIDTH, 1);
    }

    for (let i = 0; i < 20; i++) {
      const x = Math.random() * GAME_WIDTH;
      const y = Math.random() * GAME_HEIGHT;
      const size = 2 + Math.random() * 4;
      const alpha = 0.2 + Math.random() * 0.3;
      
      const star = this.add.circle(x, y, size, 0xffffff, alpha);
      this.tweens.add({
        targets: star,
        alpha: { from: alpha, to: alpha * 0.3 },
        duration: 2000 + Math.random() * 2000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }

  private createTitle(): void {
    this.titleText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 100, '票务赞助权益', {
      fontSize: '48px',
      color: COLORS.white,
      fontFamily: 'Georgia, serif',
      fontStyle: 'bold',
    });
    this.titleText.setOrigin(0.5);
    this.titleText.setAlpha(0);

    const subtitle = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50, '经营模拟', {
      fontSize: '28px',
      color: COLORS.secondary,
      fontFamily: 'Georgia, serif',
    });
    subtitle.setOrigin(0.5);
    subtitle.setAlpha(0);

    this.tweens.add({
      targets: [this.titleText, subtitle],
      alpha: 1,
      duration: ANIMATION_DURATIONS.slower,
      ease: 'Cubic.easeOut',
    });

    this.tweens.add({
      targets: this.titleText,
      y: GAME_HEIGHT / 2 - 180,
      duration: ANIMATION_DURATIONS.slower,
      delay: 300,
      ease: 'Cubic.easeOut',
    });

    this.tweens.add({
      targets: subtitle,
      y: GAME_HEIGHT / 2 - 140,
      duration: ANIMATION_DURATIONS.slower,
      delay: 400,
      ease: 'Cubic.easeOut',
    });
  }

  private createProgressBar(): void {
    this.progressBar = new ProgressBar(this, {
      x: GAME_WIDTH / 2,
      y: GAME_HEIGHT / 2 + 20,
      width: 400,
      height: 16,
      backgroundColor: '#1a1a3e',
      fillColor: COLORS.accent,
      radius: 8,
      showText: true,
    });
    this.progressBar.setAlpha(0);

    this.tweens.add({
      targets: this.progressBar,
      alpha: 1,
      duration: ANIMATION_DURATIONS.slow,
      delay: 500,
      ease: 'Cubic.easeOut',
    });
  }

  private createTipText(): void {
    this.tipText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 80, '', {
      fontSize: '16px',
      color: '#8892b0',
      fontFamily: '"Segoe UI", Roboto, sans-serif',
      align: 'center',
      wordWrap: { width: 500 },
    });
    this.tipText.setOrigin(0.5);
    this.tipText.setAlpha(0);

    this.currentTipIndex = Math.floor(Math.random() * TIPS.length);
    this.showTip();

    this.tipTimer = this.time.addEvent({
      delay: 4000,
      callback: this.nextTip,
      callbackScope: this,
      loop: true,
    });
  }

  private showTip(): void {
    const tip = TIPS[this.currentTipIndex];
    
    this.tweens.add({
      targets: this.tipText,
      alpha: 0,
      duration: ANIMATION_DURATIONS.fast,
      onComplete: () => {
        this.tipText.setText(tip);
        this.tweens.add({
          targets: this.tipText,
          alpha: 1,
          duration: ANIMATION_DURATIONS.fast,
        });
      },
    });
  }

  private nextTip(): void {
    this.currentTipIndex = (this.currentTipIndex + 1) % TIPS.length;
    this.showTip();
  }

  private createParticles(): void {
    const shapesGraphics = this.add.graphics();
    shapesGraphics.setVisible(false);
    shapesGraphics.fillStyle(0x219c90, 1);
    shapesGraphics.fillCircle(4, 4, 4);
    shapesGraphics.generateTexture('particle', 8, 8);

    this.add.particles(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20, 'particle', {
      speed: { min: 20, max: 60 },
      angle: { min: -90 - 30, max: -90 + 30 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 0.8, end: 0 },
      lifespan: { min: 800, max: 1500 },
      frequency: 100,
      gravityY: 20,
      quantity: 2,
      blendMode: 'ADD',
    });
  }

  private simulateLoading(): void {
    const fakeResources = [
      '加载票种配置...',
      '加载赞助商数据...',
      '生成核销记录...',
      '初始化物理引擎...',
      '准备游戏界面...',
    ];

    let index = 0;
    const interval = 150;

    const loadNext = () => {
      if (index < fakeResources.length) {
        this.time.delayedCall(interval, () => {
          index++;
          loadNext();
        });
      }
    };

    loadNext();
  }

  private fadeOutAndStart(): void {
    this.tweens.add({
      targets: [this.titleText, this.progressBar, this.tipText],
      alpha: 0,
      duration: ANIMATION_DURATIONS.normal,
      ease: 'Cubic.easeIn',
    });

    this.cameras.main.fadeOut(ANIMATION_DURATIONS.normal, 0, 0, 0);

    this.time.delayedCall(ANIMATION_DURATIONS.normal, () => {
      this.scene.start('MainMenuScene');
    });
  }

  shutdown(): void {
    if (this.tipTimer) {
      this.tipTimer.destroy();
    }
  }
}
