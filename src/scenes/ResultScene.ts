import Phaser from 'phaser';
import type { LevelResult } from '@/config/types';
import levelConfigs from '@/config/levelConfigs';
import { SettingsSystem } from '@/systems/SettingsSystem';

const COLORS = {
  BG: 0x1a1a2e,
  PRIMARY: 0x4fc3f7,
  DANGER: 0xef5350,
  SUCCESS: 0x66bb6a,
  GOLD: 0xffd54f,
  TEXT: 0xffffff,
  PANEL: 0x16213e,
};

export class ResultScene extends Phaser.Scene {
  private levelId = '';
  private result!: LevelResult;
  private targetScore = 0;
  private settings = new SettingsSystem();

  constructor() {
    super({ key: 'Result' });
  }

  init(data: { levelId: string; result: LevelResult; targetScore: number }): void {
    this.levelId = data.levelId;
    this.result = data.result;
    this.targetScore = data.targetScore;
  }

  create(): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(COLORS.BG);

    const passed = this.result.score >= this.targetScore;

    const titleText = passed ? '🎉 关卡通过' : '❌ 未达标';
    const titleColor = passed ? '#66bb6a' : '#ef5350';
    this.add.text(width / 2, 60, titleText, {
      fontSize: '36px', color: titleColor, fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5);

    const cfg = levelConfigs.find(l => l.id === this.levelId);
    this.add.text(width / 2, 110, cfg ? cfg.name : this.levelId, {
      fontSize: '18px', color: '#ffd54f',
    }).setOrigin(0.5);

    const statsY = 170;
    const gap = 50;

    this.createStatRow(width / 2, statsY, '总分', `${this.result.score}`, '#4fc3f7', `目标: ${this.targetScore}`);
    this.createStatRow(width / 2, statsY + gap, '用时', `${this.result.speed.toFixed(1)}s`, '#ffffff', '');
    this.createStatRow(width / 2, statsY + gap * 2, '错误次数', `${this.result.errors}`, '#ef5350', '');
    this.createStatRow(width / 2, statsY + gap * 3, '最大连击', `${this.result.maxStreak}`, '#ff9800', '');
    this.createStatRow(width / 2, statsY + gap * 4, '核销效率', `${(this.result.verificationEfficiency * 100).toFixed(1)}%`, '#66bb6a', '');

    this.drawEfficiencyBar(width / 2, statsY + gap * 5 + 20);

    const btnY = height - 100;
    const retryBtn = this.add.text(width / 2 - 120, btnY, '重新挑战', {
      fontSize: '20px', color: '#4fc3f7', fontStyle: 'bold',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    retryBtn.on('pointerover', () => retryBtn.setScale(1.1));
    retryBtn.on('pointerout', () => retryBtn.setScale(1));
    retryBtn.on('pointerdown', () => {
      this.scene.start('Game', { levelId: this.levelId });
    });

    const levelsBtn = this.add.text(width / 2 + 120, btnY, '关卡列表', {
      fontSize: '20px', color: '#ffffff',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    levelsBtn.on('pointerover', () => levelsBtn.setScale(1.1));
    levelsBtn.on('pointerout', () => levelsBtn.setScale(1));
    levelsBtn.on('pointerdown', () => {
      this.scene.start('LevelSelect');
    });

    const reviewBtn = this.add.text(width / 2, btnY + 50, '复盘比较 →', {
      fontSize: '16px', color: '#ffd54f',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    reviewBtn.on('pointerover', () => reviewBtn.setScale(1.1));
    reviewBtn.on('pointerout', () => reviewBtn.setScale(1));
    reviewBtn.on('pointerdown', () => {
      this.scene.start('Review');
    });
  }

  private createStatRow(x: number, y: number, label: string, value: string, valueColor: string, sub: string): void {
    this.add.text(x - 100, y, label, {
      fontSize: '16px', color: '#aaaaaa',
    }).setOrigin(0, 0.5);

    this.add.text(x + 20, y, value, {
      fontSize: '20px', color: valueColor, fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    if (sub) {
      this.add.text(x + 120, y, sub, {
        fontSize: '13px', color: '#666666',
      }).setOrigin(0, 0.5);
    }
  }

  private drawEfficiencyBar(x: number, y: number): void {
    const barW = 300;
    const barH = 16;
    const eff = this.result.verificationEfficiency;

    this.add.rectangle(x, y, barW, barH, 0x333355).setStrokeStyle(1, 0x444466);

    const fillColor = eff >= 0.8 ? COLORS.SUCCESS : eff >= 0.5 ? COLORS.GOLD : COLORS.DANGER;
    const fillW = barW * eff;
    this.add.rectangle(x - barW / 2 + fillW / 2, y, fillW, barH - 2, fillColor);
  }
}
