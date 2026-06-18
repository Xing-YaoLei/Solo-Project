import { UIBase } from './UIBase';
import { EventManager, GameEvents } from '../utils/EventManager';
import { GameManager } from '../managers/GameManager';
import { LeaderboardManager } from '../managers/LeaderboardManager';

export class ResultPanel extends UIBase {
  private _isVictory: boolean = false;
  private _score: number = 0;
  private _stars: number = 0;
  private _money: number = 0;
  private _time: number = 0;
  private _reason: string = '';
  private _sessionRecord: any = null;

  constructor(node?: any) {
    super(node);
    this.registerEvents();
  }

  private registerEvents(): void {
    EventManager.instance.on(GameEvents.GAME_VICTORY, this.onVictory.bind(this));
    EventManager.instance.on(GameEvents.GAME_OVER, this.onGameOver.bind(this));
  }

  private onVictory(data: any): void {
    this._isVictory = true;
    this._score = data.score;
    this._stars = data.stars;
    this._money = data.money;
    this._time = data.time;
    this._sessionRecord = data.sessionRecord;

    LeaderboardManager.instance.addScore(
      GameManager.instance.gameState?.currentLevelId || '',
      data.score,
      data.stars,
      data.time
    );

    this.refresh();
  }

  private onGameOver(data: any): void {
    this._isVictory = false;
    this._score = data.score;
    this._money = data.money;
    this._time = data.time;
    this._reason = data.reason;
    this._stars = 0;
    this._sessionRecord = data.sessionRecord;

    this.refresh();
  }

  public refresh(): void {
    if (this._isVictory) {
      this.setLabelText('resultTitle', '任务完成！');
      this.setLabelText('resultSubtitle', '恭喜你成功完成了量房报价任务');
      this.showStars(this._stars);
    } else {
      this.setLabelText('resultTitle', '任务失败');
      this.setLabelText('resultSubtitle', this.getReasonText());
      this.hideStars();
    }

    this.setLabelText('scoreValue', `${this._score}`);
    this.setLabelText('moneyValue', `¥${this._money.toLocaleString()}`);
    this.setLabelText('timeValue', this.formatTime(this._time));

    const rank = LeaderboardManager.instance.getPlayerRank(
      GameManager.instance.gameState?.currentLevelId || '',
      this._score,
      this._time
    );
    this.setLabelText('rankValue', `第 ${rank} 名`);

    this.refreshErrorList();
    this.refreshMismatchList();
  }

  private getReasonText(): string {
    switch (this._reason) {
      case 'time_out':
        return '时间不够用了，下次要更快哦！';
      case 'low_score':
        return '分数不足，仔细看看线索再试试吧！';
      default:
        return '再接再厉，下次一定行！';
    }
  }

  private showStars(stars: number): void {
    for (let i = 1; i <= 3; i++) {
      const starNode = this.node?.getChildByName(`star${i}`);
      if (starNode) {
        starNode.active = i <= stars;
      }
    }
  }

  private hideStars(): void {
    for (let i = 1; i <= 3; i++) {
      const starNode = this.node?.getChildByName(`star${i}`);
      if (starNode) {
        starNode.active = false;
      }
    }
  }

  private refreshErrorList(): void {
    if (!this.node) return;
    const listNode = this.node.getChildByName('errorList');
    if (!listNode) return;

    const content = listNode.getChildByName('content');
    if (!content) return;

    this.clearListContent(content);

    if (this._sessionRecord && this._sessionRecord.errors) {
      for (const error of this._sessionRecord.errors) {
        const item = this.createErrorItem(error);
        content.addChild(item);
      }
    }

    if (this._sessionRecord && this._sessionRecord.errors.length === 0) {
      const emptyNode = this.createEmptyItem('没有错误记录，表现很棒！');
      content.addChild(emptyNode);
    }
  }

  private refreshMismatchList(): void {
    if (!this.node) return;
    const listNode = this.node.getChildByName('mismatchList');
    if (!listNode) return;

    const content = listNode.getChildByName('content');
    if (!content) return;

    this.clearListContent(content);

    if (this._sessionRecord && this._sessionRecord.mismatches) {
      for (const mismatch of this._sessionRecord.mismatches) {
        const item = this.createMismatchItem(mismatch);
        content.addChild(item);
      }
    }

    if (this._sessionRecord && this._sessionRecord.mismatches.length === 0) {
      const emptyNode = this.createEmptyItem('所有单据都正确无误！');
      content.addChild(emptyNode);
    }
  }

  private clearListContent(content: any): void {
    if (!content || !content.removeAllChildren) return;
    content.removeAllChildren();
  }

  private createErrorItem(error: any): any {
    if (typeof cc === 'undefined') return {} as any;

    const node = new cc.Node(`error_${error.id}`);
    node.setContentSize(280, 40);

    const typeNode = new cc.Node('type');
    typeNode.parent = node;
    const typeLabel = typeNode.addComponent(cc.Label);
    typeLabel.string = this.getErrorTypeLabel(error.errorType);
    typeLabel.fontSize = 12;
    typeNode.setPosition(-120, 0);

    const descNode = new cc.Node('desc');
    descNode.parent = node;
    descNode.anchorX = 0;
    const descLabel = descNode.addComponent(cc.Label);
    descLabel.string = error.feedback || error.description;
    descLabel.fontSize = 11;
    descNode.setPosition(-60, 0);

    return node;
  }

  private createMismatchItem(mismatch: any): any {
    if (typeof cc === 'undefined') return {} as any;

    const node = new cc.Node(`mismatch_${mismatch.id}`);
    node.setContentSize(280, 40);

    const nameNode = new cc.Node('name');
    nameNode.parent = node;
    nameNode.anchorX = 0;
    const nameLabel = nameNode.addComponent(cc.Label);
    nameLabel.string = mismatch.itemName;
    nameLabel.fontSize = 12;
    nameNode.setPosition(-130, 10);

    const diffNode = new cc.Node('diff');
    diffNode.parent = node;
    diffNode.anchorX = 0;
    const diffLabel = diffNode.addComponent(cc.Label);
    const diffText = mismatch.difference > 0 ? `+¥${mismatch.difference.toFixed(2)}` : `-¥${Math.abs(mismatch.difference).toFixed(2)}`;
    diffLabel.string = diffText;
    diffLabel.fontSize = 11;
    diffNode.setPosition(-130, -10);

    const causeNode = new cc.Node('cause');
    causeNode.parent = node;
    causeNode.anchorX = 1;
    const causeLabel = causeNode.addComponent(cc.Label);
    causeLabel.string = mismatch.cause;
    causeLabel.fontSize = 10;
    causeNode.setPosition(130, 0);

    return node;
  }

  private createEmptyItem(text: string): any {
    if (typeof cc === 'undefined') return {} as any;

    const node = new cc.Node('empty');
    node.setContentSize(280, 40);

    const textNode = new cc.Node('text');
    textNode.parent = node;
    const textLabel = textNode.addComponent(cc.Label);
    textLabel.string = text;
    textLabel.fontSize = 12;
    textNode.setPosition(0, 0);

    return node;
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

  public onRestartClick(): void {
    GameManager.instance.restartLevel();
  }

  public onReviewClick(): void {
    GameManager.instance.showReview();
  }

  public onMenuClick(): void {
    GameManager.instance.exitToMenu();
  }

  public onNextLevelClick(): void {
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
