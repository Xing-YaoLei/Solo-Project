import Phaser from 'phaser';
import { gameState } from '../systems/GameState';

export class StatsScene extends Phaser.Scene {
  private scrollOffset: number = 0;
  private contentContainer!: Phaser.GameObjects.Container;
  private maxScroll: number = 0;

  constructor() {
    super({ key: 'StatsScene' });
  }

  create(): void {
    const width = this.scale.width;
    const height = this.scale.height;

    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0d1117, 0x0d1117, 0x161b22, 0x161b22, 1);
    bg.fillRect(0, 0, width, height);

    const headerBg = this.add.graphics();
    headerBg.fillStyle(0x161b22, 1);
    headerBg.fillRect(0, 0, width, 55);
    headerBg.lineStyle(1, 0x4fc3f7, 0.3);
    headerBg.lineBetween(0, 55, width, 55);

    this.add.text(width / 2, 27, '统计总览', {
      fontSize: '22px', color: '#4fc3f7', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5);

    const backBtn = this.add.text(20, 18, '← 返回', {
      fontSize: '14px', color: '#b0bec5', fontFamily: 'Arial',
    }).setInteractive({ useHandCursor: true });
    backBtn.on('pointerdown', () => this.scene.start('MenuScene'));
    backBtn.on('pointerover', () => backBtn.setColor('#4fc3f7'));
    backBtn.on('pointerout', () => backBtn.setColor('#b0bec5'));

    this.contentContainer = this.add.container(0, 60);

    const turnoverDays = gameState.calculateTurnoverDays();

    const heroBg = this.add.graphics();
    heroBg.fillStyle(0x1a2332, 0.9);
    heroBg.fillRoundedRect(40, 10, width - 80, 100, 10);
    heroBg.lineStyle(2, 0x4fc3f7, 0.3);
    heroBg.strokeRoundedRect(40, 10, width - 80, 100, 10);
    this.contentContainer.add(heroBg);

    this.contentContainer.add(
      this.add.text(width / 2, 35, `${turnoverDays}`, {
        fontSize: '48px', color: '#4fc3f7', fontFamily: 'Arial', fontStyle: 'bold',
      }).setOrigin(0.5)
    );
    this.contentContainer.add(
      this.add.text(width / 2, 72, '周转天数（核心指标）', {
        fontSize: '13px', color: '#90a4ae', fontFamily: 'Arial',
      }).setOrigin(0.5)
    );

    const rating = turnoverDays <= 5 ? '优秀' : turnoverDays <= 10 ? '良好' : turnoverDays <= 15 ? '一般' : '需改善';
    const ratingColor = turnoverDays <= 5 ? '#4caf50' : turnoverDays <= 10 ? '#4fc3f7' : turnoverDays <= 15 ? '#ff9800' : '#e74c3c';
    this.contentContainer.add(
      this.add.text(width / 2, 92, rating, {
        fontSize: '14px', color: ratingColor, fontFamily: 'Arial', fontStyle: 'bold',
      }).setOrigin(0.5)
    );

    let yPos = 125;

    this.renderConsumableStats(width, yPos);
    yPos += 30 + gameState.consumables.length * 48;

    this.renderTurnoverChart(width, yPos);
    yPos += 120;

    const session = gameState.currentSession;
    if (session) {
      this.renderSessionStats(width, yPos, session);
      yPos += 40;
    }

    this.maxScroll = Math.max(0, yPos + 50 - (height - 60));

    this.input.on('wheel', (_pointer: any, _gameObjects: any, _dx: number, dy: number) => {
      this.scrollOffset = Phaser.Math.Clamp(this.scrollOffset + dy, 0, this.maxScroll);
      this.contentContainer.setY(60 - this.scrollOffset);
    });
  }

  private renderConsumableStats(width: number, startY: number): void {
    this.contentContainer.add(
      this.add.text(40, startY, '各耗材库存与周转', {
        fontSize: '16px', color: '#b0bec5', fontFamily: 'Arial', fontStyle: 'bold',
      })
    );

    const barWidth = width - 200;
    const barHeight = 14;

    gameState.consumables.forEach((c, i) => {
      const y = startY + 30 + i * 48;

      this.contentContainer.add(
        this.add.text(50, y, c.name, {
          fontSize: '12px', color: '#b0bec5', fontFamily: 'Arial',
        })
      );

      this.contentContainer.add(
        this.add.text(50, y + 16, `${c.currentStock}/${c.maxStock}${c.unit} | 日耗${c.dailyUsage}${c.unit}`, {
          fontSize: '10px', color: '#78909c', fontFamily: 'Arial',
        })
      );

      const barBg = this.add.graphics();
      barBg.fillStyle(0x37474f, 1);
      barBg.fillRoundedRect(150, y + 2, barWidth, barHeight, 3);
      this.contentContainer.add(barBg);

      const ratio = c.currentStock / c.maxStock;
      const fillColor = ratio < 0.2 ? 0xe74c3c : ratio < 0.4 ? 0xff9800 : ratio < 0.6 ? 0xf1c40f : 0x4caf50;

      const barFill = this.add.graphics();
      barFill.fillStyle(fillColor, 1);
      barFill.fillRoundedRect(150, y + 2, barWidth * ratio, barHeight, 3);
      this.contentContainer.add(barFill);

      const safetyLine = this.add.graphics();
      const safetyX = 150 + barWidth * (c.safetyStock / c.maxStock);
      safetyLine.lineStyle(2, 0xff5722, 0.8);
      safetyLine.lineBetween(safetyX, y, safetyX, y + barHeight + 4);
      this.contentContainer.add(safetyLine);

      const itemTurnover = c.dailyUsage > 0 ? ((c.maxStock + c.currentStock) / 2 / c.dailyUsage).toFixed(1) : '-';
      this.contentContainer.add(
        this.add.text(150 + barWidth + 8, y + 2, `${itemTurnover}天`, {
          fontSize: '10px', color: ratio < 0.3 ? '#ff5722' : '#78909c', fontFamily: 'Arial',
        })
      );
    });
  }

  private renderTurnoverChart(width: number, startY: number): void {
    this.contentContainer.add(
      this.add.text(40, startY, '各品类周转天数对比', {
        fontSize: '16px', color: '#b0bec5', fontFamily: 'Arial', fontStyle: 'bold',
      })
    );

    const categories = [...new Set(gameState.consumables.map((c) => c.category))];
    const chartWidth = width - 120;
    const chartHeight = 70;

    const chartBg = this.add.graphics();
    chartBg.fillStyle(0x1e293b, 1);
    chartBg.fillRoundedRect(60, startY + 28, chartWidth, chartHeight, 4);
    chartBg.lineStyle(1, 0x4fc3f7, 0.1);
    chartBg.strokeRoundedRect(60, startY + 28, chartWidth, chartHeight, 4);
    this.contentContainer.add(chartBg);

    const refLine = this.add.graphics();
    refLine.lineStyle(1, 0xff5722, 0.4);
    const refX = 60 + chartWidth * (10 / 30);
    refLine.lineBetween(refX, startY + 28, refX, startY + 28 + chartHeight);
    this.contentContainer.add(refLine);
    this.contentContainer.add(
      this.add.text(refX, startY + 25, '10天', {
        fontSize: '8px', color: '#ff5722', fontFamily: 'Arial',
      }).setOrigin(0.5, 1)
    );

    const maxDays = 30;
    categories.forEach((cat, i) => {
      const catItems = gameState.consumables.filter((c) => c.category === cat);
      const avgStock = catItems.reduce((a, c) => a + (c.maxStock + c.currentStock) / 2, 0) / catItems.length;
      const avgDaily = catItems.reduce((a, c) => a + c.dailyUsage, 0);
      const catTurnover = avgDaily > 0 ? Math.round((avgStock / avgDaily) * 10) / 10 : 0;
      const barW = Math.min(chartWidth - 20, (catTurnover / maxDays) * (chartWidth - 20));
      const barColor = catTurnover <= 5 ? 0x4caf50 : catTurnover <= 10 ? 0x4fc3f7 : catTurnover <= 15 ? 0xff9800 : 0xe74c3c;

      const bar = this.add.graphics();
      bar.fillStyle(barColor, 0.8);
      bar.fillRoundedRect(70, startY + 33 + i * 14, barW, 10, 2);
      this.contentContainer.add(bar);

      this.contentContainer.add(
        this.add.text(75 + barW, startY + 31 + i * 14, `${cat} ${catTurnover}天`, {
          fontSize: '9px', color: '#b0bec5', fontFamily: 'Arial',
        })
      );
    });
  }

  private renderSessionStats(width: number, y: number, session: typeof gameState.currentSession): void {
    if (!session) return;
    const totalSteps = session.steps.length;
    const correctSteps = session.steps.filter((s) => s.isCorrect).length;
    const accuracy = totalSteps > 0 ? Math.round((correctSteps / totalSteps) * 100) : 0;

    this.contentContainer.add(
      this.add.text(40, y, '本次训练统计', {
        fontSize: '16px', color: '#b0bec5', fontFamily: 'Arial', fontStyle: 'bold',
      })
    );

    const statsLine = `总操作: ${totalSteps}次 | 正确率: ${accuracy}% | 得分: ${session.finalScore} | 周转: ${session.turnoverDays}天`;
    this.contentContainer.add(
      this.add.text(50, y + 22, statsLine, {
        fontSize: '11px', color: '#546e7a', fontFamily: 'Arial',
      })
    );
  }
}
