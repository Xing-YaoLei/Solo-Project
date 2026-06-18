import { UIBase } from './UIBase';
import { EventManager, GameEvents } from '../utils/EventManager';
import { GameManager } from '../managers/GameManager';
import { Task } from '../core/Types';

export class TaskBriefingPanel extends UIBase {
  private _task: Task | null = null;

  constructor(node?: any) {
    super(node);
    this.registerEvents();
  }

  private registerEvents(): void {
    EventManager.instance.on(GameEvents.GAME_START, this.onGameStart.bind(this));
  }

  private onGameStart(levelConfig: any): void {
    this._task = levelConfig.task;
    this.refresh();
  }

  public refresh(): void {
    if (!this._task) return;

    this.updateTitle(this._task.title);
    this.updateClient(this._task.clientName);
    this.updateHouseInfo(this._task.houseType, this._task.houseArea);
    this.updateDescription(this._task.description);
    this.updateReward(this._task.baseReward);
    this.updateTimeLimit(this._task.timeLimit);
    this.updateDifficulty(this._task.difficulty);
  }

  private updateTitle(title: string): void {
    this.setLabelText('titleLabel', title);
  }

  private updateClient(clientName: string): void {
    this.setLabelText('clientLabel', `客户：${clientName}`);
  }

  private updateHouseInfo(type: string, area: number): void {
    this.setLabelText('houseInfoLabel', `房型：${type} / 面积：${area}㎡`);
  }

  private updateDescription(desc: string): void {
    this.setLabelText('descLabel', desc);
  }

  private updateReward(reward: number): void {
    this.setLabelText('rewardLabel', `基础报酬：¥${reward.toLocaleString()}`);
  }

  private updateTimeLimit(timeLimit: number): void {
    const minutes = Math.floor(timeLimit / 60);
    const seconds = timeLimit % 60;
    this.setLabelText('timeLimitLabel', `时间限制：${minutes}分${seconds}秒`);
  }

  private updateDifficulty(difficulty: number): void {
    const stars = '★'.repeat(difficulty) + '☆'.repeat(Math.max(0, 5 - difficulty));
    this.setLabelText('difficultyLabel', `难度：${stars}`);
  }

  public onStartClick(): void {
    GameManager.instance.startGameplay();
  }

  public onCancelClick(): void {
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
