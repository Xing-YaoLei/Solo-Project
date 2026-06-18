import { UIBase } from './UIBase';
import { EventManager, GameEvents } from '../utils/EventManager';
import { GameManager } from '../managers/GameManager';
import { GamePhase } from '../core/GameState';

export class HUD extends UIBase {
  private _score: number = 0;
  private _money: number = 0;
  private _time: number = 0;
  private _phase: GamePhase = 'task_briefing';

  constructor(node?: any) {
    super(node);
    this.registerEvents();
  }

  private registerEvents(): void {
    EventManager.instance.on(GameEvents.SCORE_CHANGED, this.onScoreChanged.bind(this));
    EventManager.instance.on(GameEvents.MONEY_CHANGED, this.onMoneyChanged.bind(this));
    EventManager.instance.on(GameEvents.TIME_TICK, this.onTimeTick.bind(this));
    EventManager.instance.on(GameEvents.PHASE_CHANGED, this.onPhaseChanged.bind(this));
    EventManager.instance.on(GameEvents.GAME_START, this.onGameStart.bind(this));
  }

  private onGameStart(levelConfig: any): void {
    this._score = 0;
    this._money = levelConfig.task?.baseReward || 0;
    this._time = levelConfig.task?.timeLimit || 0;
    this.refresh();
  }

  private onScoreChanged(score: number): void {
    this._score = score;
    this.refreshScore();
  }

  private onMoneyChanged(money: number): void {
    this._money = money;
    this.refreshMoney();
  }

  private onTimeTick(time: number): void {
    this._time = time;
    this.refreshTime();
  }

  private onPhaseChanged(phase: GamePhase): void {
    this._phase = phase;
    this.refreshPhase();
  }

  public refresh(): void {
    this.refreshScore();
    this.refreshMoney();
    this.refreshTime();
    this.refreshPhase();
  }

  private refreshScore(): void {
    this.setLabelText('scoreValue', `${this._score}`);
  }

  private refreshMoney(): void {
    this.setLabelText('moneyValue', `¥${this._money.toLocaleString()}`);
  }

  private refreshTime(): void {
    const mins = Math.floor(this._time / 60);
    const secs = this._time % 60;
    const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    this.setLabelText('timeValue', timeStr);

    if (this._time <= 30) {
      this.setLabelColor('timeValue', new cc.Color(255, 100, 100));
    } else {
      this.setLabelColor('timeValue', new cc.Color(255, 255, 255));
    }
  }

  private refreshPhase(): void {
    const phaseNames: Record<GamePhase, string> = {
      task_briefing: '任务简报',
      clue_investigation: '线索调查',
      document_editing: '单据填写',
      approval: '审批环节',
      result: '结算',
      review: '复盘',
    };
    this.setLabelText('phaseValue', phaseNames[this._phase] || this._phase);
  }

  public onPauseClick(): void {
    if (GameManager.instance.gameState?.isPaused) {
      GameManager.instance.resumeGame();
    } else {
      GameManager.instance.pauseGame();
    }
  }

  public onMenuClick(): void {
    GameManager.instance.pauseGame();
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

  private setLabelColor(labelName: string, color: any): void {
    if (!this.node) return;
    const label = this.node.getChildByName(labelName);
    if (label && label.getComponent) {
      const labelComp = label.getComponent(cc.Label);
      if (labelComp && labelComp.node) {
        labelComp.node.color = color;
      }
    }
  }
}
