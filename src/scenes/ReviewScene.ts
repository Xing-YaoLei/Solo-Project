import { Scene, GameObjects } from 'phaser';
import { Button } from '../ui/Button';
import { GameManager } from '../managers/GameManager';
import { InputManager } from '../managers/InputManager';
import { COLORS, GAME_WIDTH, GAME_HEIGHT, ANIMATION_DURATIONS } from '../utils/constants';
import type { LevelState, EfficiencyPoint } from '../types/game';

export class ReviewScene extends Scene {
  private gameManager!: GameManager;
  private inputManager!: InputManager;
  private levelState!: LevelState;
  private stars: number = 0;

  constructor() {
    super('ReviewScene');
  }

  create(): void {
    this.gameManager = GameManager.getInstance();
    this.inputManager = InputManager.getInstance();
    this.inputManager.init(this);

    const state = this.gameManager.getLevelState();
    if (!state) {
      this.scene.start('MainMenuScene');
      return;
    }
    this.levelState = state;
    this.stars = this.gameManager.calculateStars();

    this.cameras.main.setBackgroundColor('#0a0a1a');
    this.cameras.main.setAlpha(0);
    this.cameras.main.fadeIn(ANIMATION_DURATIONS.normal);

    this.createBackground();
    this.createHeader();
    this.createStatsGrid();
    this.createEfficiencyChart();
    this.createBottomButtons();

    this.input.keyboard?.on('keydown-ENTER', () => this.nextLevel());
    this.input.keyboard?.on('keydown-SPACE', () => this.nextLevel());
    this.input.keyboard?.on('keydown-ESC', () => this.goToMenu());
    this.input.keyboard?.on('keydown-R', () => this.replayLevel());
  }

  update(): void {
    this.inputManager.update();
  }

  private createBackground(): void {
    const bgGradient = this.add.graphics();
    
    for (let i = 0; i < GAME_HEIGHT; i++) {
      const r = Math.floor(10 + i * 0.012);
      const g = Math.floor(12 + i * 0.015);
      const b = Math.floor(28 + i * 0.035);
      const color = Phaser.Display.Color.GetColor(r, g, b);
      bgGradient.fillStyle(color, 1);
      bgGradient.fillRect(0, i, GAME_WIDTH, 1);
    }
  }

  private createHeader(): void {
    const header = this.add.container(GAME_WIDTH / 2, 60);

    const title = this.add.text(0, 0, '复盘分析', {
      fontSize: '32px',
      color: COLORS.white,
      fontFamily: 'Georgia, serif',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);
    header.add(title);

    const subtitle = this.add.text(0, 40, '查看你的核销效率与表现', {
      fontSize: '16px',
      color: '#8892b0',
      fontFamily: '"Segoe UI", Roboto, sans-serif',
    });
    subtitle.setOrigin(0.5);
    header.add(subtitle);

    const starsContainer = this.add.container(0, 90);
    for (let i = 0; i < 3; i++) {
      const star = this.add.text((i - 1) * 45, 0, '★', {
        fontSize: '36px',
        color: i < this.stars ? COLORS.secondary : '#333',
        fontFamily: '"Segoe UI", Roboto, sans-serif',
      });
      star.setOrigin(0.5);
      starsContainer.add(star);
    }
    header.add(starsContainer);

    header.setY(-20);
    header.setAlpha(0);
    this.tweens.add({
      targets: header,
      y: 60,
      alpha: 1,
      duration: ANIMATION_DURATIONS.normal,
      ease: 'Cubic.easeOut',
    });
  }

  private createStatsGrid(): void {
    const stats = [
      { label: '最终得分', value: this.levelState.score.toString(), color: COLORS.secondary, icon: '🏆' },
      { label: '正确核销', value: this.levelState.correctCount.toString(), color: COLORS.success, icon: '✓' },
      { label: '错误核销', value: this.levelState.wrongCount.toString(), color: COLORS.danger, icon: '✗' },
      { label: '争议处理', value: this.levelState.disputeCount.toString(), color: COLORS.warning, icon: '⚠' },
    ];

    const startX = GAME_WIDTH / 2 - 270;
    const y = 220;
    const cardWidth = 170;
    const cardHeight = 110;
    const spacing = 20;

    stats.forEach((stat, index) => {
      const x = startX + index * (cardWidth + spacing);
      this.createStatCard(x, y, cardWidth, cardHeight, stat, index);
    });
  }

  private createStatCard(
    x: number,
    y: number,
    width: number,
    height: number,
    stat: { label: string; value: string; color: string; icon: string },
    index: number
  ): void {
    const container = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(Phaser.Display.Color.HexStringToColor('#16213E').color, 0.9);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 12);
    
    bg.lineStyle(1, Phaser.Display.Color.HexStringToColor(stat.color).color, 0.3);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 12);
    container.add(bg);

    const iconText = this.add.text(-width / 2 + 20, -height / 2 + 25, stat.icon, {
      fontSize: '24px',
    });
    container.add(iconText);

    const valueText = this.add.text(width / 2 - 20, -height / 2 + 30, stat.value, {
      fontSize: '28px',
      color: stat.color,
      fontFamily: '"SF Mono", Monaco, monospace',
      fontStyle: 'bold',
    });
    valueText.setOrigin(1, 0.5);
    container.add(valueText);

    const labelText = this.add.text(0, height / 2 - 20, stat.label, {
      fontSize: '14px',
      color: '#8892b0',
      fontFamily: '"Segoe UI", Roboto, sans-serif',
    });
    labelText.setOrigin(0.5);
    container.add(labelText);

    container.setAlpha(0);
    container.setY(y + 20);
    this.tweens.add({
      targets: container,
      y: y,
      alpha: 1,
      duration: ANIMATION_DURATIONS.normal,
      delay: 200 + index * 100,
      ease: 'Back.easeOut',
    });
  }

  private createEfficiencyChart(): void {
    const chartX = GAME_WIDTH / 2;
    const chartY = 400;
    const chartWidth = 560;
    const chartHeight = 180;

    const container = this.add.container(chartX, chartY);

    const bg = this.add.graphics();
    bg.fillStyle(Phaser.Display.Color.HexStringToColor('#16213E').color, 0.9);
    bg.fillRoundedRect(-chartWidth / 2, -chartHeight / 2 - 30, chartWidth, chartHeight + 60, 12);
    container.add(bg);

    const title = this.add.text(-chartWidth / 2 + 20, -chartHeight / 2 - 10, '核销效率变化', {
      fontSize: '16px',
      color: COLORS.light,
      fontFamily: '"Segoe UI", Roboto, sans-serif',
      fontStyle: 'bold',
    });
    container.add(title);

    const subtitle = this.add.text(chartWidth / 2 - 20, -chartHeight / 2 - 10, '正确率随时间变化', {
      fontSize: '12px',
      color: '#666',
      fontFamily: '"Segoe UI", Roboto, sans-serif',
    });
    subtitle.setOrigin(1, 0);
    container.add(subtitle);

    this.drawEfficiencyLine(container, chartWidth, chartHeight);

    const xAxisLabel1 = this.add.text(-chartWidth / 2 + 20, chartHeight / 2 + 10, '开始', {
      fontSize: '12px',
      color: '#555',
      fontFamily: '"Segoe UI", Roboto, sans-serif',
    });
    container.add(xAxisLabel1);

    const xAxisLabel2 = this.add.text(chartWidth / 2 - 20, chartHeight / 2 + 10, '结束', {
      fontSize: '12px',
      color: '#555',
      fontFamily: '"Segoe UI", Roboto, sans-serif',
    });
    xAxisLabel2.setOrigin(1, 0);
    container.add(xAxisLabel2);

    const yAxisLabel1 = this.add.text(-chartWidth / 2 + 10, -chartHeight / 2 + 10, '100%', {
      fontSize: '11px',
      color: '#555',
      fontFamily: '"Segoe UI", Roboto, sans-serif',
    });
    container.add(yAxisLabel1);

    const yAxisLabel2 = this.add.text(-chartWidth / 2 + 10, chartHeight / 2 - 10, '0%', {
      fontSize: '11px',
      color: '#555',
      fontFamily: '"Segoe UI", Roboto, sans-serif',
    });
    yAxisLabel2.setOrigin(0, 1);
    container.add(yAxisLabel2);

    const totalTime = ((this.levelState.endTime - this.levelState.startTime) / 1000).toFixed(1);
    const timeLabel = this.add.text(0, chartHeight / 2 + 10, `总用时: ${totalTime}秒`, {
      fontSize: '12px',
      color: '#555',
      fontFamily: '"Segoe UI", Roboto, sans-serif',
    });
    timeLabel.setOrigin(0.5);
    container.add(timeLabel);

    container.setAlpha(0);
    container.setY(chartY + 20);
    this.tweens.add({
      targets: container,
      y: chartY,
      alpha: 1,
      duration: ANIMATION_DURATIONS.normal,
      delay: 600,
      ease: 'Cubic.easeOut',
    });
  }

  private drawEfficiencyLine(container: GameObjects.Container, width: number, height: number): void {
    const chartLeft = -width / 2 + 50;
    const chartRight = width / 2 - 20;
    const chartTop = -height / 2 + 20;
    const chartBottom = height / 2 - 20;
    const chartWidth = chartRight - chartLeft;
    const chartHeight = chartBottom - chartTop;

    const gridLines = this.add.graphics();
    gridLines.lineStyle(1, 0x333333, 0.3);
    
    for (let i = 0; i <= 4; i++) {
      const y = chartTop + (chartHeight / 4) * i;
      gridLines.beginPath();
      gridLines.moveTo(chartLeft, y);
      gridLines.lineTo(chartRight, y);
      gridLines.strokePath();
    }
    container.add(gridLines);

    const data = this.levelState.efficiencyHistory;
    if (data.length < 2) {
      const line = this.add.graphics();
      line.lineStyle(3, Phaser.Display.Color.HexStringToColor(COLORS.accent).color, 1);
      line.beginPath();
      line.moveTo(chartLeft, chartBottom - chartHeight * 0.5);
      line.lineTo(chartRight, chartBottom - chartHeight * 0.5);
      line.strokePath();
      container.add(line);
      return;
    }

    const maxTime = data[data.length - 1].time || 1;

    const areaGradient = this.add.graphics();
    areaGradient.fillGradientStyle(
      Phaser.Display.Color.HexStringToColor(COLORS.accent).color,
      Phaser.Display.Color.HexStringToColor(COLORS.accent).color,
      0x000000,
      0x000000,
      0.2
    );
    areaGradient.beginPath();
    areaGradient.moveTo(chartLeft, chartBottom);

    const line = this.add.graphics();
    line.lineStyle(3, Phaser.Display.Color.HexStringToColor(COLORS.accent).color, 1);

    data.forEach((point: EfficiencyPoint, index: number) => {
      const x = chartLeft + (point.time / maxTime) * chartWidth;
      const y = chartBottom - point.correctRate * chartHeight;

      if (index === 0) {
        line.beginPath();
        line.moveTo(x, y);
        areaGradient.lineTo(x, y);
      } else {
        line.lineTo(x, y);
        areaGradient.lineTo(x, y);
      }
    });

    line.strokePath();
    container.add(line);

    areaGradient.lineTo(chartRight, chartBottom);
    areaGradient.lineTo(chartLeft, chartBottom);
    areaGradient.closePath();
    areaGradient.fillPath();
    container.addAt(areaGradient, 1);

    data.forEach((point: EfficiencyPoint, index: number) => {
      if (index % Math.max(1, Math.floor(data.length / 5)) === 0 || index === data.length - 1) {
        const x = chartLeft + (point.time / maxTime) * chartWidth;
        const y = chartBottom - point.correctRate * chartHeight;

        const dot = this.add.graphics();
        dot.fillStyle(Phaser.Display.Color.HexStringToColor(COLORS.secondary).color, 1);
        dot.fillCircle(x, y, 5);
        container.add(dot);

        const dotBg = this.add.graphics();
        dotBg.fillStyle(Phaser.Display.Color.HexStringToColor(COLORS.secondary).color, 0.3);
        dotBg.fillCircle(x, y, 10);
        container.addAt(dotBg, 2);
      }
    });
  }

  private createBottomButtons(): void {
    const buttonY = GAME_HEIGHT - 70;

    new Button(this, {
      x: GAME_WIDTH / 2 - 180,
      y: buttonY,
      width: 160,
      height: 52,
      text: '返回菜单',
      backgroundColor: '#1a1a3e',
      hoverColor: '#2a2a4e',
      textColor: COLORS.light,
      fontSize: 16,
      radius: 26,
      onClick: () => this.goToMenu(),
    });

    new Button(this, {
      x: GAME_WIDTH / 2,
      y: buttonY,
      width: 160,
      height: 52,
      text: '重玩本关 (R)',
      backgroundColor: COLORS.primary,
      hoverColor: '#1a4a7a',
      textColor: COLORS.white,
      fontSize: 16,
      radius: 26,
      onClick: () => this.replayLevel(),
    });

    const levels = this.gameManager.getLevels();
    const currentIndex = levels.findIndex(l => l.id === this.levelState.levelId);
    const hasNext = currentIndex >= 0 && currentIndex < levels.length - 1 && levels[currentIndex + 1].unlocked;

    const nextBtn = new Button(this, {
      x: GAME_WIDTH / 2 + 180,
      y: buttonY,
      width: 160,
      height: 52,
      text: '下一关 →',
      backgroundColor: COLORS.accent,
      hoverColor: '#2CB5A8',
      textColor: COLORS.white,
      fontSize: 16,
      radius: 26,
      onClick: () => this.nextLevel(),
    });

    if (!hasNext) {
      nextBtn.setEnabled(false);
    }

    const hint = this.add.text(GAME_WIDTH / 2, buttonY + 45, 'Enter/空格 下一关 | R 重玩 | ESC 返回', {
      fontSize: '12px',
      color: '#555',
      fontFamily: '"Segoe UI", Roboto, sans-serif',
    });
    hint.setOrigin(0.5);
  }

  private goToMenu(): void {
    this.cameras.main.fadeOut(ANIMATION_DURATIONS.normal, 0, 0, 0);
    this.time.delayedCall(ANIMATION_DURATIONS.normal, () => {
      this.scene.start('MainMenuScene');
    });
  }

  private replayLevel(): void {
    this.gameManager.resetLevel();
    this.cameras.main.fadeOut(ANIMATION_DURATIONS.normal, 0, 0, 0);
    this.time.delayedCall(ANIMATION_DURATIONS.normal, () => {
      this.scene.start('SponsorScene');
    });
  }

  private nextLevel(): void {
    const levels = this.gameManager.getLevels();
    const currentIndex = levels.findIndex(l => l.id === this.levelState.levelId);
    
    if (currentIndex >= 0 && currentIndex < levels.length - 1) {
      const nextLevel = levels[currentIndex + 1];
      if (nextLevel.unlocked) {
        this.gameManager.startLevel(nextLevel.id);
        this.cameras.main.fadeOut(ANIMATION_DURATIONS.normal, 0, 0, 0);
        this.time.delayedCall(ANIMATION_DURATIONS.normal, () => {
          this.scene.start('SponsorScene');
        });
      }
    }
  }
}
