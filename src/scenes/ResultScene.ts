import Phaser from 'phaser';
import { BaseScene } from './BaseScene';
import type { GameResult, PointTracking } from '@/types/tracking';

export class ResultScene extends BaseScene {
  private result!: GameResult;

  constructor() {
    super('ResultScene');
  }

  create(): void {
    super.create();
    this.fadeIn();

    const state = this.gameStore.getState();
    this.result = state.result!;

    this.createResultBackground();
    this.createResultHeader();
    this.createStatCards();
    this.createAnalysisSection();
    this.createTimeline();
    this.createActionButtons();

    this.playSound(this.result.accuracyRate >= 0.7 ? 'complete' : 'error');
  }

  protected createResultBackground(): void {
    const isSuccess = this.result.accuracyRate >= 0.6 && !this.result.isTimeOut;

    const gradient = this.add.graphics();
    if (isSuccess) {
      gradient.fillGradientStyle(0x1A2E1A, 0x2D4A2D, 0x1A2E1A, 0x0F1A0F, 1);
    } else {
      gradient.fillGradientStyle(0x2E1A1A, 0x4A2D2D, 0x2E1A1A, 0x1A0F0F, 1);
    }
    gradient.fillRect(0, 0, this.width, this.height);

    for (let i = 0; i < 30; i++) {
      const x = Math.random() * this.width;
      const y = Math.random() * this.height;
      const size = 3 + Math.random() * 5;
      const color = isSuccess ? 0x4CAF50 : 0xFF6F00;
      const circle = this.add.circle(x, y, size, color, 0.1);

      this.tweens.add({
        targets: circle,
        alpha: 0.25,
        y: y - 20,
        duration: 3000 + Math.random() * 2000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut',
      });
    }
  }

  private createResultHeader(): void {
    const isSuccess = this.result.accuracyRate >= 0.6 && !this.result.isTimeOut;

    const icon = this.add.text(this.centerX, 80, isSuccess ? '🏆' : '💪', {
      fontSize: '72px',
    }).setOrigin(0.5);

    this.tweens.add({
      targets: icon,
      scale: 1.1,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });

    const title = this.add.text(this.centerX, 150, isSuccess ? '巡检完成！' : '任务结束', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '42px',
      fontStyle: 'bold',
      color: isSuccess ? '#4CAF50' : '#FF9800',
    }).setOrigin(0.5);

    const subtitle = this.add.text(
      this.centerX,
      190,
      this.result.isTimeOut ? '⏰ 时间耗尽，未能完成所有点位' : `🎉 完成 ${this.result.completedPoints}/${this.result.totalPoints} 个点位`,
      {
        fontFamily: 'Inter, sans-serif',
        fontSize: '18px',
        color: '#AAAAAA',
      }
    ).setOrigin(0.5);
  }

  private createStatCards(): void {
    const startY = 260;
    const cardWidth = 220;
    const cardHeight = 140;
    const spacing = 30;
    const totalWidth = cardWidth * 3 + spacing * 2;
    const startX = this.centerX - totalWidth / 2 + cardWidth / 2;

    const stats = [
      {
        label: '巡检合格率',
        value: `${Math.round(this.result.accuracyRate * 100)}%`,
        icon: '✅',
        color: this.result.accuracyRate >= 0.8 ? 0x4CAF50 : this.result.accuracyRate >= 0.6 ? 0xFF9800 : 0xD32F2F,
        subtext: `${this.result.correctDecisions}/${this.result.completedPoints} 正确`,
      },
      {
        label: '完成时间',
        value: this.formatTime(this.result.timeUsed),
        icon: '⏱️',
        color: 0x2196F3,
        subtext: `总限时 ${this.formatTime(this.result.totalTime)}`,
      },
      {
        label: '最终得分',
        value: this.result.finalScore.toString(),
        icon: '⭐',
        color: 0xFFC107,
        subtext: `平均 ${Math.round(this.result.averageDecisionTime)}秒/判断`,
      },
    ];

    stats.forEach((stat, index) => {
      const x = startX + index * (cardWidth + spacing);
      this.createStatCard(x, startY, cardWidth, cardHeight, stat, index);
    });
  }

  private createStatCard(
    x: number,
    y: number,
    width: number,
    height: number,
    stat: { label: string; value: string; icon: string; color: number; subtext: string },
    index: number
  ): void {
    const container = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(0x2D2D2D, 0.95);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 16);
    bg.lineStyle(2, stat.color, 0.5);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 16);

    const icon = this.add.text(-width / 2 + 20, -height / 2 + 25, stat.icon, {
      fontSize: '28px',
    }).setOrigin(0);

    const label = this.add.text(0, -height / 2 + 30, stat.label, {
      fontFamily: 'Inter, sans-serif',
      fontSize: '14px',
      color: '#888888',
    }).setOrigin(0.5);

    const value = this.add.text(0, 10, stat.value, {
      fontFamily: 'Inter, sans-serif',
      fontSize: '36px',
      fontStyle: 'bold',
      color: `#${stat.color.toString(16).padStart(6, '0')}`,
    }).setOrigin(0.5);

    const subtext = this.add.text(0, height / 2 - 25, stat.subtext, {
      fontFamily: 'Inter, sans-serif',
      fontSize: '12px',
      color: '#666666',
    }).setOrigin(0.5);

    container.add([bg, icon, label, value, subtext]);

    container.setAlpha(0).setScale(0.8);
    this.time.delayedCall(200 + index * 100, () => {
      this.tweens.add({
        targets: container,
        alpha: 1,
        scale: 1,
        duration: 400,
        ease: 'Back.Out',
      });
    });
  }

  private createAnalysisSection(): void {
    const sectionY = 450;

    const title = this.add.text(60, sectionY, '📊 详细分析', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#FFFFFF',
    }).setOrigin(0);

    const line = this.add.graphics();
    line.lineStyle(2, 0xFF6F00, 0.5);
    line.lineBetween(60, sectionY + 35, this.width - 60, sectionY + 35);

    this.createStuckAnalysis(80, sectionY + 70);
    this.createErrorAnalysis(400, sectionY + 70);
  }

  private createStuckAnalysis(x: number, y: number): void {
    const container = this.add.container(x, y);

    const title = this.add.text(0, 0, '⏳ 卡点分析', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#FF9800',
    }).setOrigin(0);

    if (this.result.stuckPoints.length === 0) {
      const message = this.add.text(0, 30, '✅ 没有卡点，判断流畅！', {
        fontFamily: 'Inter, sans-serif',
        fontSize: '14px',
        color: '#4CAF50',
      }).setOrigin(0);
      container.add([title, message]);
      return;
    }

    const message = this.add.text(
      0,
      30,
      `发现 ${this.result.stuckPoints.length} 个卡点`,
      {
        fontFamily: 'Inter, sans-serif',
        fontSize: '14px',
        color: '#FF9800',
      }
    ).setOrigin(0);

    const stuckTrackings = this.result.pointTrackings.filter(t =>
      this.result.stuckPoints.includes(t.pointId)
    );

    let detailY = 55;
    stuckTrackings.slice(0, 3).forEach((tracking) => {
      const point = this.gameStore.getState().points.find(p => p.id === tracking.pointId);
      if (!point) return;

      const dot = this.add.circle(10, detailY, 5, 0xFF9800, 1);
      const text = this.add.text(
        25,
        detailY,
        `${point.name} - 犹豫 ${Math.round(tracking.decisionTime)}秒`,
        {
          fontFamily: 'Inter, sans-serif',
          fontSize: '12px',
          color: '#AAAAAA',
        }
      ).setOrigin(0);

      container.add([dot, text]);
      detailY += 22;
    });

    if (stuckTrackings.length > 3) {
      const more = this.add.text(25, detailY, `... 还有 ${stuckTrackings.length - 3} 个`, {
        fontFamily: 'Inter, sans-serif',
        fontSize: '12px',
        color: '#666666',
      }).setOrigin(0);
      container.add(more);
    }

    container.add([title, message]);
  }

  private createErrorAnalysis(x: number, y: number): void {
    const container = this.add.container(x, y);

    const title = this.add.text(0, 0, '❌ 错误分析', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#D32F2F',
    }).setOrigin(0);

    if (this.result.errorPoints.length === 0) {
      const message = this.add.text(0, 30, '🎉 全部判断正确！', {
        fontFamily: 'Inter, sans-serif',
        fontSize: '14px',
        color: '#4CAF50',
      }).setOrigin(0);
      container.add([title, message]);
      return;
    }

    const errorTypes: Record<string, { count: number; label: string }> = {};

    this.result.pointTrackings
      .filter(t => !t.isCorrect && t.errorType)
      .forEach(t => {
        if (!t.errorType) return;
        if (!errorTypes[t.errorType]) {
          errorTypes[t.errorType] = { count: 0, label: this.getErrorTypeLabel(t.errorType) };
        }
        errorTypes[t.errorType].count++;
      });

    const message = this.add.text(
      0,
      30,
      `共 ${this.result.errorPoints.length} 个错误判断`,
      {
        fontFamily: 'Inter, sans-serif',
        fontSize: '14px',
        color: '#D32F2F',
      }
    ).setOrigin(0);

    let detailY = 55;
    Object.entries(errorTypes).forEach(([type, data]) => {
      const percentage = Math.round((data.count / this.result.errorPoints.length) * 100);

      const barBg = this.add.graphics();
      barBg.fillStyle(0x3D3D3D, 1);
      barBg.fillRoundedRect(0, detailY, 200, 18, 9);

      const barFill = this.add.graphics();
      barFill.fillStyle(0xD32F2F, 0.8);
      barFill.fillRoundedRect(0, detailY, 200 * (percentage / 100), 18, 9);

      const label = this.add.text(5, detailY + 9, data.label, {
        fontFamily: 'Inter, sans-serif',
        fontSize: '11px',
        color: '#FFFFFF',
      }).setOrigin(0, 0.5);

      const countText = this.add.text(195, detailY + 9, `${data.count}次`, {
        fontFamily: 'Inter, sans-serif',
        fontSize: '11px',
        fontStyle: 'bold',
        color: '#FFFFFF',
      }).setOrigin(1, 0.5);

      container.add([barBg, barFill, label, countText]);
      detailY += 25;
    });

    container.add([title, message]);
  }

  private getErrorTypeLabel(errorType: string): string {
    const labels: Record<string, string> = {
      false_positive: '正常判故障',
      false_negative: '故障判正常',
      missed_clean: '漏判清洁',
      clean_as_fault: '清洁判故障',
      unnecessary_clean: '误判清洁',
      fault_as_clean: '故障判清洁',
      unknown: '其他错误',
    };
    return labels[errorType] || errorType;
  }

  private createTimeline(): void {
    const timelineY = 630;

    const title = this.add.text(60, timelineY, '📈 操作时间线', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#FFFFFF',
    }).setOrigin(0);

    const line = this.add.graphics();
    line.lineStyle(2, 0xFF6F00, 0.5);
    line.lineBetween(60, timelineY + 35, this.width - 60, timelineY + 35);

    const timelineWidth = this.width - 120;
    const startX = 60;

    const trackings = this.result.pointTrackings.slice(0, 12);
    const step = trackings.length > 0 ? timelineWidth / trackings.length : 0;

    trackings.forEach((tracking, index) => {
      const x = startX + index * step + step / 2;
      const y = timelineY + 35;

      const isStuck = this.result.stuckPoints.includes(tracking.pointId);
      const color = tracking.isCorrect
        ? (isStuck ? 0xFF9800 : 0x4CAF50)
        : 0xD32F2F;

      const dot = this.add.circle(x, y, isStuck ? 8 : 6, color, 1);

      if (index % 2 === 0) {
        const labelY = y + (index % 4 === 0 ? 40 : 60);
        const label = this.add.text(x, labelY, `#${index + 1}`, {
          fontFamily: 'Inter, sans-serif',
          fontSize: '10px',
          color: '#888888',
        }).setOrigin(0.5);

        const connector = this.add.graphics();
        connector.lineStyle(1, color, 0.5);
        connector.lineBetween(x, y + 8, x, labelY - 12);

        dot.setAlpha(0);
        label.setAlpha(0);
        connector.setAlpha(0);

        this.time.delayedCall(500 + index * 50, () => {
          this.tweens.add({
            targets: [dot, label, connector],
            alpha: 1,
            duration: 300,
          });
        });
      }
    });

    const legend = this.add.container(this.width - 60, timelineY + 80);

    const correctLegend = this.add.text(-120, 0, '● 正确', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '12px',
      color: '#4CAF50',
    }).setOrigin(1);

    const stuckLegend = this.add.text(-40, 0, '● 卡点', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '12px',
      color: '#FF9800',
    }).setOrigin(1);

    const errorLegend = this.add.text(40, 0, '● 错误', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '12px',
      color: '#D32F2F',
    }).setOrigin(1);

    legend.add([correctLegend, stuckLegend, errorLegend]);
  }

  private createActionButtons(): void {
    const buttonY = this.height - 80;

    const restartBtn = this.addButton(
      this.centerX - 120,
      buttonY,
      200,
      55,
      '🔄 再来一局',
      () => {
        this.playSound('click');
        this.gameStore.getState().restartGame();
        this.fadeOut(300, () => {
          this.scene.start('StartScene');
        });
      },
      {
        bgColor: 0xFF6F00,
        hoverColor: 0xFF8F3F,
        textColor: '#FFFFFF',
      }
    );

    const homeBtn = this.addButton(
      this.centerX + 120,
      buttonY,
      200,
      55,
      '🏠 返回主页',
      () => {
        this.playSound('click');
        this.gameStore.getState().restartGame();
        this.fadeOut(300, () => {
          this.scene.start('StartScene');
        });
      },
      {
        bgColor: 0x555555,
        hoverColor: 0x777777,
        textColor: '#FFFFFF',
      }
    );

    restartBtn.setAlpha(0).setScale(0.9);
    homeBtn.setAlpha(0).setScale(0.9);

    this.time.delayedCall(800, () => {
      this.tweens.add({
        targets: [restartBtn, homeBtn],
        alpha: 1,
        scale: 1,
        duration: 400,
        ease: 'Back.Out',
      });
    });
  }
}
