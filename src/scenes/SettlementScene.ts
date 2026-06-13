import Phaser from 'phaser';
import { gameState } from '../systems/GameState';
import { ErrorType } from '../models/types';

export class SettlementScene extends Phaser.Scene {
  constructor() {
    super({ key: 'SettlementScene' });
  }

  create(): void {
    const width = this.scale.width;
    const height = this.scale.height;

    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x0d1117, 0x0d1117, 1);
    bg.fillRect(0, 0, width, height);

    const session = gameState.currentSession;
    if (!session) {
      this.scene.start('MenuScene');
      return;
    }

    this.add.text(width / 2, 35, '训练结算', {
      fontSize: '28px', color: '#4fc3f7', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5);

    const scoreColor = session.finalScore >= 80 ? '#4caf50' : session.finalScore >= 50 ? '#ff9800' : '#e74c3c';
    this.add.text(width / 2, 75, `最终得分: ${session.finalScore}`, {
      fontSize: '32px', color: scoreColor, fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(width / 2, 110, `运营天数: ${session.totalDays}天 | 周转天数: ${session.turnoverDays}天`, {
      fontSize: '14px', color: '#b0bec5', fontFamily: 'Arial',
    }).setOrigin(0.5);

    const safetyErrors = session.errorSummary.filter((e) => e.relatedSafetyStock);
    const otherErrors = session.errorSummary.filter((e) => !e.relatedSafetyStock);

    let yPos = 145;

    this.add.text(50, yPos, '安全库存相关错因', {
      fontSize: '18px', color: '#ff5722', fontFamily: 'Arial', fontStyle: 'bold',
    });
    yPos += 28;

    if (safetyErrors.length === 0) {
      this.add.text(70, yPos, '✅ 安全库存管理无重大失误', {
        fontSize: '14px', color: '#4caf50', fontFamily: 'Arial',
      });
      yPos += 28;
    } else {
      safetyErrors.forEach((err) => {
        const card = this.add.graphics();
        card.fillStyle(0x2c1810, 0.8);
        card.fillRoundedRect(60, yPos, width - 120, 52, 6);
        card.lineStyle(1, 0xff5722, 0.5);
        card.strokeRoundedRect(60, yPos, width - 120, 52, 6);

        this.add.text(75, yPos + 6, `${this.getErrorLabel(err.errorType)} × ${err.count}次`, {
          fontSize: '14px', color: '#ff5722', fontFamily: 'Arial', fontStyle: 'bold',
        });
        this.add.text(75, yPos + 26, err.description, {
          fontSize: '11px', color: '#ffab91', fontFamily: 'Arial',
        });

        const impact = this.getImpactHint(err.errorType);
        if (impact) {
          this.add.text(75, yPos + 40, impact, {
            fontSize: '9px', color: '#ff8a65', fontFamily: 'Arial',
          });
        }

        yPos += 58;
      });
    }

    yPos += 8;
    this.add.text(50, yPos, '其他错因', {
      fontSize: '18px', color: '#ffb74d', fontFamily: 'Arial', fontStyle: 'bold',
    });
    yPos += 28;

    if (otherErrors.length === 0) {
      this.add.text(70, yPos, '✅ 其他操作无失误', {
        fontSize: '14px', color: '#4caf50', fontFamily: 'Arial',
      });
      yPos += 28;
    } else {
      otherErrors.forEach((err) => {
        this.add.text(75, yPos, `${this.getErrorLabel(err.errorType)} × ${err.count}次 - ${err.description}`, {
          fontSize: '12px', color: '#ffb74d', fontFamily: 'Arial',
        });
        yPos += 22;
      });
    }

    yPos += 10;
    const safetyErrorCount = safetyErrors.reduce((a, e) => a + e.count, 0);
    const totalErrors = session.errorSummary.reduce((a, e) => a + e.count, 0);
    const safetyRatio = totalErrors > 0 ? Math.round((safetyErrorCount / totalErrors) * 100) : 0;

    this.add.text(width / 2, yPos, '安全库存错因占比', {
      fontSize: '14px', color: '#b0bec5', fontFamily: 'Arial',
    }).setOrigin(0.5);
    yPos += 18;

    const gaugeWidth = width - 120;
    const gaugeBg = this.add.graphics();
    gaugeBg.fillStyle(0x37474f, 1);
    gaugeBg.fillRoundedRect(60, yPos, gaugeWidth, 20, 4);
    gaugeBg.fillStyle(safetyRatio > 60 ? 0xff5722 : safetyRatio > 30 ? 0xff9800 : 0x4caf50, 1);
    gaugeBg.fillRoundedRect(60, yPos, gaugeWidth * (safetyRatio / 100), 20, 4);
    this.add.text(width / 2, yPos + 10, `${safetyRatio}%`, {
      fontSize: '12px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5);

    const tipY = Math.min(yPos + 40, height - 110);
    if (safetyErrorCount > 0) {
      this.add.text(width / 2, tipY, '💡 改进建议: 优先关注安全库存线，提前2天安排补货', {
        fontSize: '12px', color: '#ffb74d', fontFamily: 'Arial',
      }).setOrigin(0.5);
    }

    this.createButton(width / 2 - 90, height - 55, '查看复盘', 'btn_normal', () => {
      this.scene.start('ReviewScene');
    });
    this.createButton(width / 2 + 90, height - 55, '返回菜单', 'btn_success', () => {
      this.scene.start('MenuScene');
    });
  }

  private getErrorLabel(errorType: ErrorType): string {
    const labels: Record<ErrorType, string> = {
      WRONG_SUPPLIER: '选错供应商',
      OVER_ORDER: '超额领用',
      UNDER_ORDER: '领用不足',
      SAFETY_STOCK_BREACH: '安全库存突破',
      EXPIRED_BATCH: '批次过期',
      STOCKOUT: '耗材断货',
      INVENTORY_MISMATCH: '盘点差异',
      LEAD_TIME_MISJUDGMENT: '交期误判',
    };
    return labels[errorType] || errorType;
  }

  private getImpactHint(errorType: ErrorType): string {
    const hints: Partial<Record<ErrorType, string>> = {
      SAFETY_STOCK_BREACH: '→ 门店随时可能断货，需要立即补货',
      STOCKOUT: '→ 已影响门店运营，应提前预警并安排应急补货',
      UNDER_ORDER: '→ 补货量不足导致安全线被突破，需要计算交期消耗',
      LEAD_TIME_MISJUDGMENT: '→ 选择供应商时未考虑交货周期与断货时间的匹配',
    };
    return hints[errorType] || '';
  }

  private createButton(x: number, y: number, label: string, textureKey: string, callback: () => void): void {
    const btn = this.add.image(x, y, textureKey).setInteractive({ useHandCursor: true });
    const text = this.add.text(x, y, label, {
      fontSize: '15px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5);
    btn.on('pointerover', () => { btn.setScale(1.05); text.setScale(1.05); });
    btn.on('pointerout', () => { btn.setScale(1); text.setScale(1); });
    btn.on('pointerdown', callback);
  }
}
