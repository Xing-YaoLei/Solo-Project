import Phaser from 'phaser';
import type { LevelResult } from '@/config/types';
import levelConfigs from '@/config/levelConfigs';
import { ResultStore } from '@/systems/ResultStore';

const COLORS = {
  BG: 0x1a1a2e,
  PRIMARY: 0x4fc3f7,
  DANGER: 0xef5350,
  SUCCESS: 0x66bb6a,
  GOLD: 0xffd54f,
  TEXT: 0xffffff,
  PANEL: 0x16213e,
};

export class ReviewScene extends Phaser.Scene {
  private resultStore = new ResultStore();

  constructor() {
    super({ key: 'Review' });
  }

  create(): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(COLORS.BG);

    this.add.text(width / 2, 40, '复盘统计', {
      fontSize: '32px', color: '#ffd54f', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(width / 2, 75, '按核销效率比较不同关卡表现', {
      fontSize: '14px', color: '#888888',
    }).setOrigin(0.5);

    const comparison = this.resultStore.getEfficiencyComparison();

    if (comparison.length === 0) {
      this.add.text(width / 2, height / 2, '暂无通关记录', {
        fontSize: '20px', color: '#666666',
      }).setOrigin(0.5);
    } else {
      this.drawComparisonChart(width, height, comparison);
      this.drawDetailList(width, height, comparison);
    }

    const backBtn = this.add.text(40, 20, '← 返回', {
      fontSize: '16px', color: '#4fc3f7',
    }).setInteractive({ useHandCursor: true });
    backBtn.on('pointerdown', () => this.scene.start('Menu'));
    backBtn.on('pointerover', () => backBtn.setScale(1.1));
    backBtn.on('pointerout', () => backBtn.setScale(1));
  }

  private drawComparisonChart(w: number, h: number, data: { levelId: string; efficiency: number; score: number }[]): void {
    const chartX = 80;
    const chartY = 120;
    const chartW = w - 160;
    const chartH = 200;

    this.add.rectangle(chartX + chartW / 2, chartY + chartH / 2, chartW, chartH, COLORS.PANEL, 0.6)
      .setStrokeStyle(1, 0x333355);

    for (let i = 0; i <= 4; i++) {
      const y = chartY + chartH - (chartH * i / 4);
      const pct = (i * 25);
      this.add.text(chartX - 5, y, `${pct}%`, {
        fontSize: '10px', color: '#666666',
      }).setOrigin(1, 0.5);
      this.add.rectangle(chartX + chartW / 2, y, chartW, 1, 0x333355, 0.3);
    }

    const barWidth = Math.min(80, (chartW - 40) / data.length - 10);
    const spacing = (chartW - 40) / data.length;

    data.forEach((item, i) => {
      const x = chartX + 20 + spacing * i + spacing / 2;
      const barH = chartH * item.efficiency;
      const y = chartY + chartH - barH;

      const color = item.efficiency >= 0.8 ? COLORS.SUCCESS : item.efficiency >= 0.5 ? COLORS.GOLD : COLORS.DANGER;
      this.add.rectangle(x, y + barH / 2, barWidth, barH, color, 0.85);

      const cfg = levelConfigs.find(l => l.id === item.levelId);
      const name = cfg ? cfg.name : item.levelId;
      this.add.text(x, chartY + chartH + 15, name, {
        fontSize: '11px', color: '#aaaaaa', align: 'center',
      }).setOrigin(0.5, 0);

      this.add.text(x, y - 12, `${(item.efficiency * 100).toFixed(0)}%`, {
        fontSize: '12px', color: '#ffffff', fontStyle: 'bold',
      }).setOrigin(0.5);

      this.add.text(x, y - 25, `${item.score}分`, {
        fontSize: '10px', color: '#4fc3f7',
      }).setOrigin(0.5);
    });

    this.add.text(chartX + chartW / 2, chartY + chartH + 40, '核销效率对比', {
      fontSize: '13px', color: '#888888',
    }).setOrigin(0.5);
  }

  private drawDetailList(w: number, h: number, data: { levelId: string; efficiency: number; score: number }[]): void {
    const startY = 400;
    const gap = 44;

    this.add.text(w / 2, startY - 20, '详细数据', {
      fontSize: '16px', color: '#4fc3f7', fontStyle: 'bold',
    }).setOrigin(0.5);

    const allResults = this.resultStore.getAllResults();
    const grouped = new Map<string, LevelResult[]>();
    for (const r of allResults) {
      if (!grouped.has(r.levelId)) grouped.set(r.levelId, []);
      grouped.get(r.levelId)!.push(r);
    }

    let y = startY + 15;
    grouped.forEach((results, levelId) => {
      const best = results.reduce((a, b) => a.score > b.score ? a : b);
      const cfg = levelConfigs.find(l => l.id === levelId);
      const name = cfg ? cfg.name : levelId;

      this.add.rectangle(w / 2, y, w - 100, 36, COLORS.PANEL, 0.7)
        .setStrokeStyle(1, 0x333355);

      this.add.text(60, y, name, {
        fontSize: '14px', color: '#ffffff', fontStyle: 'bold',
      }).setOrigin(0, 0.5);

      this.add.text(200, y, `得分: ${best.score}`, {
        fontSize: '13px', color: '#4fc3f7',
      }).setOrigin(0, 0.5);

      this.add.text(310, y, `效率: ${(best.verificationEfficiency * 100).toFixed(1)}%`, {
        fontSize: '13px', color: '#66bb6a',
      }).setOrigin(0, 0.5);

      this.add.text(440, y, `连击: ${best.maxStreak}`, {
        fontSize: '13px', color: '#ff9800',
      }).setOrigin(0, 0.5);

      this.add.text(540, y, `误: ${best.errors}`, {
        fontSize: '13px', color: '#ef5350',
      }).setOrigin(0, 0.5);

      y += gap;
    });
  }
}
