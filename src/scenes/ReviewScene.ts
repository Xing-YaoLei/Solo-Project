import Phaser from 'phaser';
import { GameConfig, CARE_LEVELS } from '../config/GameConfig';
import { UIHelper } from '../utils/UIHelper';
import { DataManager, GameResult } from '../data/DataManager';
import { SoundManager } from '../data/SoundManager';

export class ReviewScene extends Phaser.Scene {
  private selectedLevelId: number | null = null;

  constructor() {
    super({ key: 'ReviewScene' });
  }

  create(): void {
    SoundManager.getInstance().setScene(this);

    const centerX = GameConfig.GAME_WIDTH / 2;

    const bg = this.add.graphics();
    bg.fillStyle(GameConfig.COLORS.background, 1);
    bg.fillRect(0, 0, GameConfig.GAME_WIDTH, GameConfig.GAME_HEIGHT);

    const title = this.add.text(centerX, 50, '数据复盘', {
      fontSize: '36px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    title.setOrigin(0.5);
    UIHelper.animateIn(this, title);

    const subtitle = this.add.text(centerX, 85, '按护理达标情况比较不同关卡效果', {
      fontSize: '16px',
      color: '#888888'
    });
    subtitle.setOrigin(0.5);

    UIHelper.createButton(
      this, 80, 50, 100, 44, '返回',
      () => this.scene.start('MenuScene'),
      { bgColor: 0x6b7280, fontSize: 18 }
    );

    this.renderLevelSelector(centerX, 140);
    this.renderStatsOverview(centerX, 220);
    this.renderCareLevelComparison(centerX, 400);
    this.renderHistoryList(centerX, 580);

    this.input.keyboard?.on('keydown-ESC', () => {
      this.scene.start('MenuScene');
    });
  }

  private renderLevelSelector(centerX: number, y: number): void {
    const levels = DataManager.getInstance().getLevels();
    const hasResults = levels.some(l => DataManager.getInstance().getResultsByLevel(l.id).length > 0);

    if (!hasResults) {
      const emptyText = this.add.text(centerX, y + 100, '📭 暂无游戏记录\n请先完成一局游戏', {
        fontSize: '24px',
        color: '#666666',
        align: 'center'
      });
      emptyText.setOrigin(0.5);
      return;
    }

    this.add.text(centerX - 350, y, '选择关卡：', {
      fontSize: '18px',
      color: '#cccccc',
      fontStyle: 'bold'
    });

    this.createLevelTab(centerX - 220, y, '全部对比', null, this.selectedLevelId === null);
    
    levels.forEach((level, i) => {
      const results = DataManager.getInstance().getResultsByLevel(level.id);
      if (results.length > 0) {
        this.createLevelTab(centerX - 100 + i * 120, y, level.name, level.id, this.selectedLevelId === level.id);
      }
    });
  }

  private createLevelTab(x: number, y: number, name: string, levelId: number | null, isSelected: boolean): Phaser.GameObjects.Container {
    const width = 100;
    const height = 36;
    const container = this.add.container(x, y);
    container.setSize(width, height);

    const bg = this.add.graphics();
    bg.fillStyle(isSelected ? GameConfig.COLORS.primary : 0x333344, 1);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 8);

    const text = this.add.text(0, 0, name, {
      fontSize: '14px',
      color: isSelected ? '#ffffff' : '#aaaaaa',
      fontStyle: 'bold'
    });
    text.setOrigin(0.5);

    container.add([bg, text]);
    container.setInteractive(new Phaser.Geom.Rectangle(0, 0, width, height), Phaser.Geom.Rectangle.Contains);

    container.on('pointerdown', () => {
      this.selectedLevelId = levelId;
      SoundManager.getInstance().playClick();
      this.scene.restart();
    });

    container.on('pointerover', () => {
      this.input.setDefaultCursor('pointer');
    });

    container.on('pointerout', () => {
      this.input.setDefaultCursor('default');
    });

    return container;
  }

  private renderStatsOverview(centerX: number, y: number): void {
    let results: GameResult[];
    if (this.selectedLevelId !== null) {
      results = DataManager.getInstance().getResultsByLevel(this.selectedLevelId);
    } else {
      results = DataManager.getInstance().getResults();
    }

    if (results.length === 0) return;

    const completedCount = results.filter(r => r.completed).length;
    const avgAccuracy = results.reduce((sum, r) => sum + r.accuracy, 0) / results.length;
    const avgTime = results.reduce((sum, r) => sum + r.timeTaken, 0) / results.length;
    const bestScore = results.reduce((max, r) => Math.max(max, r.totalScore), 0);
    const avgStreak = results.reduce((sum, r) => sum + r.maxStreak, 0) / results.length;

    const stats = [
      { icon: '🎮', label: '游戏场次', value: results.length.toString(), color: GameConfig.COLORS.primary },
      { icon: '✅', label: '完成场次', value: completedCount.toString(), color: GameConfig.COLORS.success },
      { icon: '🎯', label: '平均准确率', value: `${Math.round(avgAccuracy * 100)}%`, color: GameConfig.COLORS.warning },
      { icon: '⏱', label: '平均用时', value: `${Math.round(avgTime)}秒`, color: 0x88ccff },
      { icon: '🏆', label: '最高分', value: bestScore.toString(), color: 0xffd700 },
      { icon: '🔥', label: '平均连击', value: avgStreak.toFixed(1), color: 0xff6b6b }
    ];

    const cardWidth = 140;
    const cardHeight = 90;
    const gap = 15;

    stats.forEach((stat, i) => {
      const x = centerX - (stats.length * (cardWidth + gap) - gap) / 2 + i * (cardWidth + gap) + cardWidth / 2;
      const container = this.add.container(x, y);

      const bg = this.add.graphics();
      bg.fillStyle(0x1a1a2e, 0.9);
      bg.fillRoundedRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 10);
      bg.lineStyle(2, stat.color, 0.6);
      bg.strokeRoundedRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 10);

      const icon = this.add.text(0, -cardHeight / 2 + 22, stat.icon, {
        fontSize: '24px'
      });
      icon.setOrigin(0.5);

      const value = this.add.text(0, 8, stat.value, {
        fontSize: '26px',
        color: `#${stat.color.toString(16).padStart(6, '0')}`,
        fontStyle: 'bold'
      });
      value.setOrigin(0.5);

      const label = this.add.text(0, cardHeight / 2 - 15, stat.label, {
        fontSize: '12px',
        color: '#888888'
      });
      label.setOrigin(0.5);

      container.add([bg, icon, value, label]);
      UIHelper.animateIn(this, container, 300 + i * 100);
    });
  }

  private renderCareLevelComparison(centerX: number, y: number): void {
    let results: GameResult[];
    if (this.selectedLevelId !== null) {
      results = DataManager.getInstance().getResultsByLevel(this.selectedLevelId);
    } else {
      results = DataManager.getInstance().getResults();
    }

    if (results.length === 0) return;

    this.add.text(centerX - 350, y - 50, '📊 护理等级达标率对比：', {
      fontSize: '18px',
      color: '#cccccc',
      fontStyle: 'bold'
    });

    const aggregatedStats = CARE_LEVELS.map((level: { id: number; name: string; color: number; description: string }) => {
      const allStats = results.flatMap(r => r.care达标.filter(s => s.level === level.id));
      const totalCorrect = allStats.reduce((sum, s) => sum + s.correct, 0);
      const totalAll = allStats.reduce((sum, s) => sum + s.total, 0);
      return {
        level: level.id,
        name: level.name,
        color: level.color,
        correct: totalCorrect,
        total: totalAll,
        rate: totalAll > 0 ? totalCorrect / totalAll : 0
      };
    });

    const chartWidth = 700;
    const chartHeight = 180;
    const barWidth = 50;
    const gap = 80;

    const chartBg = this.add.graphics();
    chartBg.fillStyle(0x1a1a2e, 0.6);
    chartBg.fillRoundedRect(centerX - chartWidth / 2, y - 20, chartWidth, chartHeight, 12);

    aggregatedStats.forEach((stat: { level: number; name: string; color: number; correct: number; total: number; rate: number }, i: number) => {
      const barX = centerX - (aggregatedStats.length * (barWidth + gap) - gap) / 2 + i * (barWidth + gap);
      const maxBarHeight = 120;
      const barHeight = stat.rate * maxBarHeight;
      const barY = y + chartHeight - 40 - barHeight;

      for (let j = 0; j < 5; j++) {
        const gridY = y + chartHeight - 40 - (j + 1) * (maxBarHeight / 5);
        const grid = this.add.graphics();
        grid.lineStyle(1, 0x333344, 0.5);
        grid.lineBetween(centerX - chartWidth / 2 + 20, gridY, centerX + chartWidth / 2 - 20, gridY);

        const gridLabel = this.add.text(centerX - chartWidth / 2 + 10, gridY, `${(j + 1) * 20}%`, {
          fontSize: '10px',
          color: '#555555'
        });
        gridLabel.setOrigin(1, 0.5);
      }

      const bar = this.add.graphics();
      bar.fillStyle(stat.color, 0.9);
      bar.fillRoundedRect(barX, barY, barWidth, barHeight, 6);

      const barBg = this.add.graphics();
      barBg.lineStyle(2, stat.color, 0.3);
      barBg.strokeRoundedRect(barX, y + chartHeight - 40 - maxBarHeight, barWidth, maxBarHeight, 6);

      const rateText = this.add.text(barX + barWidth / 2, barY - 15, 
        stat.total > 0 ? `${Math.round(stat.rate * 100)}%` : '-',
        {
          fontSize: '16px',
          color: '#ffffff',
          fontStyle: 'bold'
        }
      );
      rateText.setOrigin(0.5);

      const levelBadge = this.add.graphics();
      levelBadge.fillStyle(stat.color, 1);
      levelBadge.fillRoundedRect(barX - 10, y + chartHeight - 25, barWidth + 20, 22, 6);

      const levelName = this.add.text(barX + barWidth / 2, y + chartHeight - 14, stat.name, {
        fontSize: '13px',
        color: '#ffffff',
        fontStyle: 'bold'
      });
      levelName.setOrigin(0.5);

      const countText = this.add.text(barX + barWidth / 2, y + chartHeight + 5, 
        `${stat.correct}/${stat.total}`,
        {
          fontSize: '11px',
          color: '#888888'
        }
      );
      countText.setOrigin(0.5);
    });
  }

  private renderHistoryList(centerX: number, y: number): void {
    let results: GameResult[];
    if (this.selectedLevelId !== null) {
      results = DataManager.getInstance().getResultsByLevel(this.selectedLevelId);
    } else {
      results = DataManager.getInstance().getResults();
    }

    if (results.length === 0) return;

    this.add.text(centerX - 350, y - 30, '📜 最近游戏记录：', {
      fontSize: '18px',
      color: '#cccccc',
      fontStyle: 'bold'
    });

    const recentResults = results.slice(-5).reverse();
    const rowHeight = 36;

    recentResults.forEach((result, i) => {
      const rowY = y + i * rowHeight;
      const container = this.add.container(centerX, rowY);

      const bg = this.add.graphics();
      bg.fillStyle(i % 2 === 0 ? 0x1a1a2e : 0x1e1e38, 0.8);
      bg.fillRoundedRect(-350, -rowHeight / 2, 700, rowHeight - 4, 6);

      const statusIcon = this.add.text(-330, 0, result.completed ? '✅' : '❌', {
        fontSize: '18px'
      });
      statusIcon.setOrigin(0, 0.5);

      const levelName = this.add.text(-290, 0, result.levelName, {
        fontSize: '14px',
        color: '#ffffff'
      });
      levelName.setOrigin(0, 0.5);

      const score = this.add.text(-120, 0, `${result.totalScore}分`, {
        fontSize: '14px',
        color: '#ffd93d',
        fontStyle: 'bold'
      });
      score.setOrigin(0, 0.5);

      const accuracy = this.add.text(-20, 0, `准确率${Math.round(result.accuracy * 100)}%`, {
        fontSize: '13px',
        color: result.accuracy >= 0.8 ? '#6bcb77' : result.accuracy >= 0.5 ? '#ffd93d' : '#ff6b6b'
      });
      accuracy.setOrigin(0, 0.5);

      const streak = this.add.text(100, 0, `连击${result.maxStreak}`, {
        fontSize: '13px',
        color: '#ff9f43'
      });
      streak.setOrigin(0, 0.5);

      const time = this.add.text(200, 0, `${result.timeTaken}秒`, {
        fontSize: '13px',
        color: '#88ccff'
      });
      time.setOrigin(0, 0.5);

      const errors = this.add.text(290, 0, `错${result.errorCount}`, {
        fontSize: '13px',
        color: result.errorCount === 0 ? '#6bcb77' : '#ff6b6b'
      });
      errors.setOrigin(0, 0.5);

      container.add([bg, statusIcon, levelName, score, accuracy, streak, time, errors]);
      UIHelper.animateIn(this, container, 400 + i * 100);
    });
  }
}
