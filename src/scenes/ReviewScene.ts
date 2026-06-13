import Phaser from 'phaser';
import { gameState } from '../systems/GameState';
import { GameStep, ErrorType } from '../models/types';
import { ERROR_DESCRIPTIONS } from '../models/gameData';

export class ReviewScene extends Phaser.Scene {
  private scrollOffset: number = 0;
  private contentContainer!: Phaser.GameObjects.Container;
  private maxScroll: number = 0;

  constructor() {
    super({ key: 'ReviewScene' });
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

    this.add.text(width / 2, 27, '复盘记录', {
      fontSize: '22px', color: '#4fc3f7', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5);

    const backBtn = this.add.text(20, 18, '← 返回', {
      fontSize: '14px', color: '#b0bec5', fontFamily: 'Arial',
    }).setInteractive({ useHandCursor: true });
    backBtn.on('pointerdown', () => this.scene.start('MenuScene'));
    backBtn.on('pointerover', () => backBtn.setColor('#4fc3f7'));
    backBtn.on('pointerout', () => backBtn.setColor('#b0bec5'));

    this.contentContainer = this.add.container(0, 60);

    const session = gameState.currentSession;
    const replays = gameState.replayRecords;

    let yPos = 10;

    if (session && session.steps.length > 0) {
      this.addSectionTitle(width, yPos, '本次训练详情');
      yPos += 35;

      const failedSteps = session.steps.filter((s) => !s.isCorrect);
      if (failedSteps.length === 0) {
        this.contentContainer.add(
          this.add.text(60, yPos, '🎉 本次训练全部正确，无失误步骤', {
            fontSize: '14px', color: '#4caf50', fontFamily: 'Arial',
          })
        );
        yPos += 30;
      } else {
        for (const step of failedSteps) {
          yPos = this.renderStepCard(width, yPos, step);
        }
      }
    }

    if (replays.length > 0) {
      yPos += 15;
      this.addSectionTitle(width, yPos, `最近 ${replays.length} 次失败记录`);
      yPos += 35;

      for (let ri = replays.length - 1; ri >= 0; ri--) {
        const replay = replays[ri];
        yPos = this.renderReplayCard(width, yPos, replay, ri);
      }
    }

    if (!session?.steps.length && replays.length === 0) {
      this.contentContainer.add(
        this.add.text(width / 2, 100, '暂无复盘记录\n完成一次训练后即可查看', {
          fontSize: '16px', color: '#546e7a', fontFamily: 'Arial', align: 'center',
        }).setOrigin(0.5)
      );
    }

    this.maxScroll = Math.max(0, yPos + 100 - (height - 60));

    this.input.on('wheel', (_pointer: any, _gameObjects: any, _dx: number, dy: number) => {
      this.scrollOffset = Phaser.Math.Clamp(this.scrollOffset + dy, 0, this.maxScroll);
      this.contentContainer.setY(60 - this.scrollOffset);
    });
  }

  private addSectionTitle(width: number, y: number, text: string): void {
    const bg = this.add.graphics();
    bg.fillStyle(0x1e293b, 1);
    bg.fillRect(30, y, width - 60, 28);
    this.contentContainer.add(bg);
    this.contentContainer.add(
      this.add.text(45, y + 4, text, {
        fontSize: '14px', color: '#4fc3f7', fontFamily: 'Arial', fontStyle: 'bold',
      })
    );
  }

  private renderStepCard(width: number, y: number, step: GameStep): number {
    const cardHeight = 90;
    const card = this.add.graphics();
    card.fillStyle(0x1e293b, 0.9);
    card.fillRoundedRect(40, y, width - 80, cardHeight, 6);
    card.lineStyle(1, 0xe74c3c, 0.4);
    card.strokeRoundedRect(40, y, width - 80, cardHeight, 6);
    this.contentContainer.add(card);

    const phaseName = this.getPhaseName(step.type);
    this.contentContainer.add(
      this.add.text(55, y + 8, `第${step.gameDay + 1}天 · ${phaseName} · 步骤#${step.stepIndex + 1}`, {
        fontSize: '12px', color: '#e74c3c', fontFamily: 'Arial', fontStyle: 'bold',
      })
    );

    const errLabel = step.errorType || '未知';
    const errDesc = step.errorType ? ERROR_DESCRIPTIONS[step.errorType] || errLabel : '';
    this.contentContainer.add(
      this.add.text(55, y + 28, `错因: ${errLabel}`, {
        fontSize: '11px', color: '#ffab91', fontFamily: 'Arial',
      })
    );
    if (errDesc) {
      this.contentContainer.add(
        this.add.text(55, y + 44, errDesc, {
          fontSize: '10px', color: '#78909c', fontFamily: 'Arial',
        })
      );
    }

    this.contentContainer.add(
      this.add.text(55, y + 60, `用时: ${(step.timeSpent / 1000).toFixed(1)}秒`, {
        fontSize: '11px', color: '#78909c', fontFamily: 'Arial',
      })
    );

    this.contentContainer.add(
      this.add.text(55, y + 74, this.getStepDetail(step), {
        fontSize: '10px', color: '#546e7a', fontFamily: 'Arial',
      })
    );

    return y + cardHeight + 8;
  }

  private renderReplayCard(width: number, y: number, replay: typeof gameState.replayRecords[0], index: number): number {
    const errorSteps = replay.steps.filter((s) => !s.isCorrect);
    const cardHeight = 110 + Math.min(errorSteps.length, 4) * 18;
    const card = this.add.graphics();
    card.fillStyle(0x263238, 0.9);
    card.fillRoundedRect(40, y, width - 80, cardHeight, 8);
    card.lineStyle(1, 0xff9800, 0.3);
    card.strokeRoundedRect(40, y, width - 80, cardHeight, 8);
    this.contentContainer.add(card);

    const date = new Date(replay.timestamp);
    const label = index === gameState.replayRecords.length - 1 ? '最新' : `#${index + 1}`;
    this.contentContainer.add(
      this.add.text(55, y + 8, `[${label}] ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`, {
        fontSize: '12px', color: '#ff9800', fontFamily: 'Arial', fontStyle: 'bold',
      })
    );

    this.contentContainer.add(
      this.add.text(55, y + 28, `失败于步骤#${replay.failedAtStep + 1} - ${this.getErrorLabel(replay.failureReason)}`, {
        fontSize: '11px', color: '#ffab91', fontFamily: 'Arial',
      })
    );

    this.contentContainer.add(
      this.add.text(55, y + 46, `总步骤: ${replay.steps.length} | 失误: ${errorSteps.length}次`, {
        fontSize: '11px', color: '#b0bec5', fontFamily: 'Arial',
      })
    );

    this.contentContainer.add(
      this.add.text(55, y + 62, '失误步骤:', {
        fontSize: '10px', color: '#90a4ae', fontFamily: 'Arial', fontStyle: 'bold',
      })
    );

    const showErrors = errorSteps.slice(0, 4);
    showErrors.forEach((s, i) => {
      const detail = this.getStepDetail(s);
      this.contentContainer.add(
        this.add.text(65, y + 78 + i * 18, `· 第${s.gameDay + 1}天 ${this.getPhaseName(s.type)} ${s.errorType || ''} ${detail}`, {
          fontSize: '10px', color: '#78909c', fontFamily: 'Arial',
        })
      );
    });

    if (errorSteps.length > 4) {
      this.contentContainer.add(
        this.add.text(65, y + 78 + 4 * 18, `... 还有${errorSteps.length - 4}次失误`, {
          fontSize: '10px', color: '#546e7a', fontFamily: 'Arial',
        })
      );
    }

    return y + cardHeight + 10;
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

  private getPhaseName(type: string): string {
    switch (type) {
      case 'SUPPLIER_SELECT': return '供应商选择';
      case 'REQUISITION': return '领用操作';
      case 'INVENTORY_CHECK': return '盘点核对';
      case 'STOCK_REVIEW': return '库存审查';
      default: return type;
    }
  }

  private getStepDetail(step: GameStep): string {
    const d = step.data as any;
    if (step.type === 'SUPPLIER_SELECT') {
      const chosen = gameState.suppliers.find((s) => s.id === d.chosenSupplierId);
      const correct = gameState.suppliers.find((s) => s.id === d.correctSupplierId);
      return `选择: ${chosen?.name || d.chosenSupplierId} → 推荐: ${correct?.name || d.correctSupplierId}`;
    }
    if (step.type === 'REQUISITION') {
      return `领用: ${d.orderQty} | 建议: ${d.correctQty}`;
    }
    if (step.type === 'INVENTORY_CHECK') {
      return `系统: ${d.reportedQty} | 实际: ${d.actualQty}`;
    }
    return '';
  }
}
