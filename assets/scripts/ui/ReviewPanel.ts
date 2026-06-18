import { UIBase } from './UIBase';
import { EventManager, GameEvents } from '../utils/EventManager';
import { GameManager } from '../managers/GameManager';
import { ScoreManager } from '../managers/ScoreManager';
import { GameSessionRecord } from '../core/GameState';

export class ReviewPanel extends UIBase {
  private _sessionRecord: GameSessionRecord | null = null;
  private _tabIndex: number = 0;

  constructor(node?: any) {
    super(node);
    this.registerEvents();
  }

  private registerEvents(): void {
    EventManager.instance.on(GameEvents.PHASE_CHANGED, this.onPhaseChanged.bind(this));
  }

  private onPhaseChanged(phase: string): void {
    if (phase === 'review') {
      this._sessionRecord = ScoreManager.instance.lastSessionRecord;
      this.refresh();
    }
  }

  public refresh(): void {
    if (!this._sessionRecord) return;

    this.setLabelText('reviewTitle', '任务复盘');
    this.setLabelText('scoreValue', `${this._sessionRecord.finalScore}`);
    this.setLabelText('timeValue', this.formatTime(this._sessionRecord.duration));
    this.setLabelText('resultValue', this._sessionRecord.isVictory ? '成功' : '失败');

    this.refreshSummary();
    this.refreshErrorAnalysis();
    this.refreshMismatchAnalysis();
    this.refreshImprovementTips();
  }

  private refreshSummary(): void {
    if (!this._sessionRecord) return;

    const mismatches = this._sessionRecord.mismatches.length;
    const errors = this._sessionRecord.errors.length;
    const choices = Object.keys(this._sessionRecord.choicesMade).length;

    this.setLabelText('summaryText',
      `本次训练共进行了 ${this.formatTime(this._sessionRecord.duration)}\n` +
      `做出了 ${choices} 个选择\n` +
      `出现 ${mismatches} 处金额不一致\n` +
      `犯下 ${errors} 个错误`
    );
  }

  private refreshErrorAnalysis(): void {
    if (!this._sessionRecord) return;

    const byType: Record<string, number> = {};
    for (const error of this._sessionRecord.errors) {
      byType[error.errorType] = (byType[error.errorType] || 0) + 1;
    }

    let text = '错误类型分析：\n';
    for (const type in byType) {
      text += `  ${this.getErrorTypeLabel(type)}：${byType[type]} 次\n`;
    }

    this.setLabelText('errorAnalysisText', text);
  }

  private refreshMismatchAnalysis(): void {
    if (!this._sessionRecord) return;

    const byItem: Record<string, { count: number; totalDiff: number }> = {};
    for (const mismatch of this._sessionRecord.mismatches) {
      if (!byItem[mismatch.itemName]) {
        byItem[mismatch.itemName] = { count: 0, totalDiff: 0 };
      }
      byItem[mismatch.itemName].count++;
      byItem[mismatch.itemName].totalDiff += Math.abs(mismatch.difference);
    }

    let text = '金额不一致分析：\n';
    for (const itemName in byItem) {
      const data = byItem[itemName];
      text += `  ${itemName}：${data.count} 次，累计偏差 ¥${data.totalDiff.toFixed(2)}\n`;
    }

    if (this._sessionRecord.mismatches.length === 0) {
      text = '本次没有出现金额不一致，做得很好！';
    }

    this.setLabelText('mismatchAnalysisText', text);
  }

  private refreshImprovementTips(): void {
    if (!this._sessionRecord) return;

    const tips: string[] = [];

    const mismatches = this._sessionRecord.mismatches.length;
    const errors = this._sessionRecord.errors.length;

    if (mismatches > 2) {
      tips.push('• 仔细阅读每条线索，特别是与价格和数量相关的信息');
      tips.push('• 填写单据时多检查几遍，确保数量和单价正确');
    }

    if (errors > 2) {
      tips.push('• 审批环节要谨慎思考，不要急于做选择');
      tips.push('• 多联系类似的审批场景，积累经验');
    }

    if (!this._sessionRecord.isVictory) {
      tips.push('• 不要气馁，失败是成功之母');
      tips.push('• 建议先从简单的关卡开始练习');
    }

    if (tips.length === 0) {
      tips.push('• 表现很棒！继续保持');
      tips.push('• 可以尝试挑战更高难度的关卡');
    }

    this.setLabelText('tipsText', tips.join('\n'));
  }

  private getErrorTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      wrong_choice: '选择错误',
      quantity_mismatch: '数量错误',
      price_mismatch: '价格错误',
      total_mismatch: '总价错误',
      process_error: '流程错误',
      time_out: '超时',
    };
    return labels[type] || type;
  }

  private formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}分${secs}秒`;
  }

  public onTab1Click(): void {
    this._tabIndex = 0;
    this.switchTab();
  }

  public onTab2Click(): void {
    this._tabIndex = 1;
    this.switchTab();
  }

  public onTab3Click(): void {
    this._tabIndex = 2;
    this.switchTab();
  }

  private switchTab(): void {
    const tabs = ['summaryPanel', 'errorPanel', 'mismatchPanel'];
    for (let i = 0; i < tabs.length; i++) {
      const tabNode = this.node?.getChildByName(tabs[i]);
      if (tabNode) {
        tabNode.active = i === this._tabIndex;
      }
    }
  }

  public onRestartClick(): void {
    GameManager.instance.restartLevel();
  }

  public onBackClick(): void {
    GameManager.instance.changePhase('result');
  }

  public onMenuClick(): void {
    GameManager.instance.exitToMenu();
  }

  private setLabelText(labelName: string, text: string): void {
    if (!this.node) return;
    const label = this.node.getChildByName(labelName);
    if (label && label.getComponent) {
      const labelComp = label.getComponent(cc.Label);
      if (labelComp) {
        labelComp.string = text;
      }
    }
  }
}
