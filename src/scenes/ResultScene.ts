import Phaser from 'phaser';
import { BaseScene } from './BaseScene';
import type { GameResult, PointTracking } from '@/types/tracking';
import type { TrackingRule } from '@/types/config';

export class ResultScene extends BaseScene {
  private result!: GameResult;
  private trackingRules!: TrackingRule;

  constructor() {
    super('ResultScene');
  }

  create(): void {
    super.create();
    this.fadeIn();

    const state = this.gameStore.getState();
    this.result = state.result!;
    this.trackingRules = this.configStore.getState().tracking;

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

    const icon = this.add.text(this.centerX, 55, isSuccess ? '🏆' : '💪', {
      fontSize: '52px',
    }).setOrigin(0.5);

    this.tweens.add({
      targets: icon,
      scale: 1.1,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });

    const title = this.add.text(this.centerX, 100, isSuccess ? '巡检完成！' : '任务结束', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '32px',
      fontStyle: 'bold',
      color: isSuccess ? '#4CAF50' : '#FF9800',
    }).setOrigin(0.5);

    const subtitle = this.add.text(
      this.centerX,
      130,
      this.result.isTimeOut ? '⏰ 时间耗尽，未能完成所有点位' : `🎉 完成 ${this.result.completedPoints}/${this.result.totalPoints} 个点位`,
      {
        fontFamily: 'Inter, sans-serif',
        fontSize: '14px',
        color: '#AAAAAA',
      }
    ).setOrigin(0.5);
  }

  private createStatCards(): void {
    const startY = 195;
    const cardWidth = 180;
    const cardHeight = 90;
    const spacing = 25;
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
        subtext: this.trackingRules.trackDecisionTime
          ? `平均 ${Math.round(this.result.averageDecisionTime)}秒/判断`
          : '完成全部巡检',
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
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 12);
    bg.lineStyle(2, stat.color, 0.5);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 12);

    const icon = this.add.text(-width / 2 + 15, -height / 2 + 15, stat.icon, {
      fontSize: '22px',
    }).setOrigin(0);

    const label = this.add.text(0, -height / 2 + 20, stat.label, {
      fontFamily: 'Inter, sans-serif',
      fontSize: '12px',
      color: '#888888',
    }).setOrigin(0.5);

    const value = this.add.text(0, 5, stat.value, {
      fontFamily: 'Inter, sans-serif',
      fontSize: '28px',
      fontStyle: 'bold',
      color: `#${stat.color.toString(16).padStart(6, '0')}`,
    }).setOrigin(0.5);

    const subtext = this.add.text(0, height / 2 - 15, stat.subtext, {
      fontFamily: 'Inter, sans-serif',
      fontSize: '11px',
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
    const sectionY = 310;

    const title = this.add.text(60, sectionY, '📊 详细分析', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#FFFFFF',
    }).setOrigin(0);

    const line = this.add.graphics();
    line.lineStyle(2, 0xFF6F00, 0.5);
    line.lineBetween(60, sectionY + 28, this.width - 60, sectionY + 28);

    const hasStuck = this.trackingRules.trackDecisionTime;
    const hasError = this.trackingRules.trackErrorTypes;
    const hasItems = this.trackingRules.trackItemUsage;
    const hasEvents = this.trackingRules.trackEventHandling;

    const analysisCards: Array<{ fn: (x: number, y: number) => void; condition: boolean }> = [];

    if (hasStuck) analysisCards.push({ fn: this.createStuckAnalysis.bind(this), condition: true });
    if (hasError) analysisCards.push({ fn: this.createErrorAnalysis.bind(this), condition: true });
    if (hasItems) analysisCards.push({ fn: this.createItemUsageAnalysis.bind(this), condition: true });
    if (hasEvents) analysisCards.push({ fn: this.createEventAnalysis.bind(this), condition: true });

    if (analysisCards.length === 0) {
      const message = this.add.text(this.centerX, sectionY + 70, '🔒 分析功能已在配置中关闭', {
        fontFamily: 'Inter, sans-serif',
        fontSize: '14px',
        color: '#666666',
      }).setOrigin(0.5);
      return;
    }

    const cardWidth = 280;
    const cardSpacing = 30;
    const perRow = 2;
    const totalWidth = perRow * cardWidth + (perRow - 1) * cardSpacing;
    const startX = this.centerX - totalWidth / 2 + cardWidth / 2;

    analysisCards.forEach((card, index) => {
      const row = Math.floor(index / perRow);
      const col = index % perRow;
      const x = startX + col * (cardWidth + cardSpacing);
      const y = sectionY + 55 + row * 100;
      card.fn(x, y);
    });
  }

  private createStuckAnalysis(x: number, y: number): void {
    const container = this.add.container(0, 0);
    container.setPosition(x, y);

    const cardWidth = 280;
    const cardHeight = 80;
    const halfW = cardWidth / 2;
    const halfH = cardHeight / 2;

    const bg = this.add.graphics();
    bg.fillStyle(0x2D2D2D, 0.95);
    bg.fillRoundedRect(-halfW, -halfH, cardWidth, cardHeight, 10);
    bg.lineStyle(2, 0xFF9800, 0.3);
    bg.strokeRoundedRect(-halfW, -halfH, cardWidth, cardHeight, 10);

    const title = this.add.text(-halfW + 12, -halfH + 10, '⏳ 卡点分析', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#FF9800',
    }).setOrigin(0);

    if (this.result.stuckPoints.length === 0) {
      const message = this.add.text(-halfW + 12, 0, '✅ 判断流畅，没有卡点', {
        fontFamily: 'Inter, sans-serif',
        fontSize: '12px',
        color: '#4CAF50',
      }).setOrigin(0, 0.5);
      container.add([bg, title, message]);
      return;
    }

    const message = this.add.text(
      -halfW + 12,
      0,
      `发现 ${this.result.stuckPoints.length} 个卡点`,
      {
        fontFamily: 'Inter, sans-serif',
        fontSize: '12px',
        color: '#FF9800',
      }
    ).setOrigin(0, 0.5);

    const stuckTrackings = this.result.pointTrackings.filter(t =>
      this.result.stuckPoints.includes(t.pointId)
    );

    let detailY = halfH - 12;
    stuckTrackings.slice(0, 1).forEach((tracking) => {
      const point = this.gameStore.getState().points.find(p => p.id === tracking.pointId);
      if (!point) return;

      const dot = this.add.circle(-halfW + 20, detailY, 3, 0xFF9800, 1);
      const text = this.add.text(
        -halfW + 30,
        detailY,
        `${point.name} · ${Math.round(tracking.decisionTime)}秒`,
        {
          fontFamily: 'Inter, sans-serif',
          fontSize: '11px',
          color: '#AAAAAA',
        }
      ).setOrigin(0, 0.5);

      container.add([dot, text]);
    });

    if (stuckTrackings.length > 1) {
      const more = this.add.text(-halfW + 30, detailY, `... 还有 ${stuckTrackings.length - 1} 个`, {
        fontFamily: 'Inter, sans-serif',
        fontSize: '11px',
        color: '#666666',
      }).setOrigin(0, 0.5);
      container.add(more);
    }

    container.add([bg, title, message]);
  }

  private createErrorAnalysis(x: number, y: number): void {
    const container = this.add.container(0, 0);
    container.setPosition(x, y);

    const cardWidth = 280;
    const cardHeight = 80;
    const halfW = cardWidth / 2;
    const halfH = cardHeight / 2;

    const bg = this.add.graphics();
    bg.fillStyle(0x2D2D2D, 0.95);
    bg.fillRoundedRect(-halfW, -halfH, cardWidth, cardHeight, 10);
    bg.lineStyle(2, 0xD32F2F, 0.3);
    bg.strokeRoundedRect(-halfW, -halfH, cardWidth, cardHeight, 10);

    const title = this.add.text(-halfW + 12, -halfH + 10, '❌ 错误分析', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#D32F2F',
    }).setOrigin(0);

    if (this.result.errorPoints.length === 0) {
      const message = this.add.text(-halfW + 12, 0, '🎉 全部判断正确！', {
        fontFamily: 'Inter, sans-serif',
        fontSize: '12px',
        color: '#4CAF50',
      }).setOrigin(0, 0.5);
      container.add([bg, title, message]);
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
      -halfW + 12,
      0,
      `共 ${this.result.errorPoints.length} 个错误判断`,
      {
        fontFamily: 'Inter, sans-serif',
        fontSize: '12px',
        color: '#D32F2F',
      }
    ).setOrigin(0, 0.5);

    const errorList = Object.entries(errorTypes).slice(0, 1);
    if (errorList.length > 0) {
      const [type, data] = errorList[0];
      const percentage = Math.round((data.count / this.result.errorPoints.length) * 100);

      const barBg = this.add.graphics();
      barBg.fillStyle(0x3D3D3D, 1);
      barBg.fillRoundedRect(-halfW + 12, halfH - 20, cardWidth - 24, 14, 7);

      const barFill = this.add.graphics();
      barFill.fillStyle(0xD32F2F, 0.8);
      barFill.fillRoundedRect(-halfW + 12, halfH - 20, (cardWidth - 24) * (percentage / 100), 14, 7);

      const label = this.add.text(-halfW + 16, halfH - 13, data.label, {
        fontFamily: 'Inter, sans-serif',
        fontSize: '10px',
        color: '#FFFFFF',
      }).setOrigin(0, 0.5);

      const countText = this.add.text(halfW - 16, halfH - 13, `${data.count}次`, {
        fontFamily: 'Inter, sans-serif',
        fontSize: '10px',
        fontStyle: 'bold',
        color: '#FFFFFF',
      }).setOrigin(1, 0.5);

      container.add([barBg, barFill, label, countText]);

      if (Object.entries(errorTypes).length > 1) {
        const more = this.add.text(halfW - 16, halfH - 30, `+${Object.entries(errorTypes).length - 1}种`, {
          fontFamily: 'Inter, sans-serif',
          fontSize: '10px',
          color: '#666666',
        }).setOrigin(1, 0.5);
        container.add(more);
      }
    }

    container.add([bg, title, message]);
  }

  private createItemUsageAnalysis(x: number, y: number): void {
    const container = this.add.container(0, 0);
    container.setPosition(x, y);

    const cardWidth = 280;
    const cardHeight = 80;
    const halfW = cardWidth / 2;
    const halfH = cardHeight / 2;

    const bg = this.add.graphics();
    bg.fillStyle(0x2D2D2D, 0.95);
    bg.fillRoundedRect(-halfW, -halfH, cardWidth, cardHeight, 10);
    bg.lineStyle(2, 0x9C27B0, 0.3);
    bg.strokeRoundedRect(-halfW, -halfH, cardWidth, cardHeight, 10);

    const title = this.add.text(-halfW + 12, -halfH + 10, '🎒 道具使用', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#9C27B0',
    }).setOrigin(0);

    if (this.result.itemUsages.length === 0) {
      const message = this.add.text(-halfW + 12, 0, '📭 本局未使用道具', {
        fontFamily: 'Inter, sans-serif',
        fontSize: '12px',
        color: '#888888',
      }).setOrigin(0, 0.5);
      container.add([bg, title, message]);
      return;
    }

    const itemCounts: Record<string, number> = {};
    const effectiveCounts: Record<string, number> = {};

    this.result.itemUsages.forEach(usage => {
      itemCounts[usage.itemId] = (itemCounts[usage.itemId] || 0) + 1;
      if (usage.effectApplied) {
        effectiveCounts[usage.itemId] = (effectiveCounts[usage.itemId] || 0) + 1;
      }
    });

    const configItems = this.configStore.getState().items;

    const message = this.add.text(
      -halfW + 12,
      0,
      `共使用 ${this.result.itemUsages.length} 次`,
      {
        fontFamily: 'Inter, sans-serif',
        fontSize: '12px',
        color: '#9C27B0',
      }
    ).setOrigin(0, 0.5);

    let detailY = halfH - 12;
    Object.entries(itemCounts).slice(0, 1).forEach(([itemId, count]) => {
      const itemConfig = configItems.find(i => i.id === itemId);
      if (!itemConfig) return;

      const effective = effectiveCounts[itemId] || 0;

      const dot = this.add.circle(-halfW + 20, detailY, 3, 0x9C27B0, 1);
      const text = this.add.text(
        -halfW + 30,
        detailY,
        `${itemConfig.icon} ${itemConfig.name} · ${count}次${effective > 0 ? `(有效${effective}次)` : ''}`,
        {
          fontFamily: 'Inter, sans-serif',
          fontSize: '11px',
          color: '#AAAAAA',
        }
      ).setOrigin(0, 0.5);

      container.add([dot, text]);
    });

    if (Object.entries(itemCounts).length > 1) {
      const more = this.add.text(-halfW + 30, detailY, `... 还有 ${Object.entries(itemCounts).length - 1} 种`, {
        fontFamily: 'Inter, sans-serif',
        fontSize: '11px',
        color: '#666666',
      }).setOrigin(0, 0.5);
      container.add(more);
    }

    container.add([bg, title, message]);
  }

  private createEventAnalysis(x: number, y: number): void {
    const container = this.add.container(0, 0);
    container.setPosition(x, y);

    const cardWidth = 280;
    const cardHeight = 80;
    const halfW = cardWidth / 2;
    const halfH = cardHeight / 2;

    const bg = this.add.graphics();
    bg.fillStyle(0x2D2D2D, 0.95);
    bg.fillRoundedRect(-halfW, -halfH, cardWidth, cardHeight, 10);
    bg.lineStyle(2, 0x2196F3, 0.3);
    bg.strokeRoundedRect(-halfW, -halfH, cardWidth, cardHeight, 10);

    const title = this.add.text(-halfW + 12, -halfH + 10, '⚡ 事件处理', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#2196F3',
    }).setOrigin(0);

    if (this.result.events.length === 0) {
      const message = this.add.text(-halfW + 12, 0, '🛡️ 本局未触发事件', {
        fontFamily: 'Inter, sans-serif',
        fontSize: '12px',
        color: '#888888',
      }).setOrigin(0, 0.5);
      container.add([bg, title, message]);
      return;
    }

    const avgResponseTime = this.result.events.length > 0
      ? this.result.events.reduce((sum, e) => sum + e.choiceTime, 0) / this.result.events.length
      : 0;

    const message = this.add.text(
      -halfW + 12,
      0,
      `触发 ${this.result.events.length} 次 · 平均响应 ${avgResponseTime.toFixed(1)}秒`,
      {
        fontFamily: 'Inter, sans-serif',
        fontSize: '11px',
        color: '#2196F3',
      }
    ).setOrigin(0, 0.5);

    let detailY = halfH - 12;
    this.result.events.slice(0, 1).forEach((event, index) => {
      const choiceLabel = event.playerChoice === 'remote_restart' ? '远程重启'
        : event.playerChoice === 'onsite' ? '现场处理'
        : event.playerChoice === 'ignore' ? '忽略'
        : event.playerChoice;

      const dot = this.add.circle(-halfW + 20, detailY, 3, 0x2196F3, 1);
      const text = this.add.text(
        -halfW + 30,
        detailY,
        `事件${index + 1} · ${choiceLabel} · ${event.choiceTime.toFixed(1)}秒`,
        {
          fontFamily: 'Inter, sans-serif',
          fontSize: '11px',
          color: '#AAAAAA',
        }
      ).setOrigin(0, 0.5);

      container.add([dot, text]);
    });

    if (this.result.events.length > 1) {
      const more = this.add.text(-halfW + 30, detailY, `... 还有 ${this.result.events.length - 1} 个事件`, {
        fontFamily: 'Inter, sans-serif',
        fontSize: '11px',
        color: '#666666',
      }).setOrigin(0, 0.5);
      container.add(more);
    }

    container.add([bg, title, message]);
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
    const timelineY = 530;
    const hasTrackingData = this.result.pointTrackings.length > 0;

    if (!hasTrackingData) {
      return;
    }

    const title = this.add.text(60, timelineY, '📈 操作时间线', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#FFFFFF',
    }).setOrigin(0);

    const line = this.add.graphics();
    line.lineStyle(2, 0xFF6F00, 0.5);
    line.lineBetween(60, timelineY + 28, this.width - 60, timelineY + 28);

    const timelineWidth = this.width - 120;
    const startX = 60;

    const trackings = this.result.pointTrackings.slice(0, 12);
    const step = trackings.length > 0 ? timelineWidth / trackings.length : 0;

    trackings.forEach((tracking, index) => {
      const x = startX + index * step + step / 2;
      const y = timelineY + 28;

      const isStuck = this.result.stuckPoints.includes(tracking.pointId);
      const hasStuckData = this.trackingRules.trackDecisionTime && isStuck;
      const hasErrorData = this.trackingRules.trackErrorTypes && !tracking.isCorrect;

      let color: number;
      if (!this.trackingRules.trackErrorTypes) {
        color = 0x2196F3;
      } else if (!tracking.isCorrect) {
        color = 0xD32F2F;
      } else if (hasStuckData) {
        color = 0xFF9800;
      } else {
        color = 0x4CAF50;
      }

      const dotSize = hasStuckData ? 7 : 5;
      const dot = this.add.circle(x, y, dotSize, color, 1);

      if (index % 2 === 0) {
        const labelY = y + (index % 4 === 0 ? 28 : 42);
        const label = this.add.text(x, labelY, `#${index + 1}`, {
          fontFamily: 'Inter, sans-serif',
          fontSize: '9px',
          color: '#888888',
        }).setOrigin(0.5);

        const connector = this.add.graphics();
        connector.lineStyle(1, color, 0.5);
        connector.lineBetween(x, y + 6, x, labelY - 10);

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

    const legend = this.add.container(this.width - 60, timelineY + 65);
    const legendItems: Array<{ label: string; color: number }> = [];

    if (!this.trackingRules.trackErrorTypes) {
      legendItems.push({ label: '已完成', color: 0x2196F3 });
    } else {
      legendItems.push({ label: '正确', color: 0x4CAF50 });
      if (this.trackingRules.trackDecisionTime) {
        legendItems.push({ label: '卡点', color: 0xFF9800 });
      }
      legendItems.push({ label: '错误', color: 0xD32F2F });
    }

    const totalWidth = legendItems.length * 60;
    legendItems.forEach((item, i) => {
      const x = -totalWidth + i * 60 + 30;
      const text = this.add.text(x, 0, `● ${item.label}`, {
        fontFamily: 'Inter, sans-serif',
        fontSize: '10px',
        color: `#${item.color.toString(16).padStart(6, '0')}`,
      }).setOrigin(0.5);
      legend.add(text);
    });
  }

  private createActionButtons(): void {
    const buttonY = this.height - 55;

    const restartBtn = this.addButton(
      this.centerX - 110,
      buttonY,
      180,
      45,
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
      this.centerX + 110,
      buttonY,
      180,
      45,
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
