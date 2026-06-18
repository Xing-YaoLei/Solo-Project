import { UIBase } from './UIBase';
import { GameManager } from '../managers/GameManager';
import { LevelManager } from '../managers/LevelManager';
import { DataManager } from '../managers/DataManager';
import { LevelConfig } from '../core/LevelTypes';

export class LevelSelectPanel extends UIBase {
  private _levels: LevelConfig[] = [];
  private _selectedIndex: number = 0;

  constructor(node?: any) {
    super(node);
  }

  public refresh(): void {
    this._levels = DataManager.instance.getAllLevels();
    this.refreshLevelList();
    this.refreshLevelDetail();
  }

  private refreshLevelList(): void {
    if (!this.node) return;
    const listNode = this.node.getChildByName('levelList');
    if (!listNode) return;

    const content = listNode.getChildByName('content');
    if (!content) return;

    this.clearListContent(content);

    for (let i = 0; i < this._levels.length; i++) {
      const level = this._levels[i];
      const item = this.createLevelItem(level, i);
      content.addChild(item);
    }
  }

  private clearListContent(content: any): void {
    if (!content || !content.removeAllChildren) return;
    content.removeAllChildren();
  }

  private createLevelItem(level: LevelConfig, index: number): any {
    if (typeof cc === 'undefined') return {} as any;

    const node = new cc.Node(`level_${level.id}`);
    node.setContentSize(200, 80);

    const isUnlocked = LevelManager.instance.isLevelUnlocked(level.id);
    const progress = LevelManager.instance.getLevelProgress(level.id);

    if (index === this._selectedIndex) {
      node.addComponent(cc.Sprite);
    }

    if (!isUnlocked) {
      node.opacity = 100;
    }

    const nameNode = new cc.Node('name');
    nameNode.parent = node;
    nameNode.anchorX = 0;
    const nameLabel = nameNode.addComponent(cc.Label);
    nameLabel.string = level.name;
    nameLabel.fontSize = 16;
    nameNode.setPosition(-90, 20);

    const diffNode = new cc.Node('diff');
    diffNode.parent = node;
    diffNode.anchorX = 0;
    const diffLabel = diffNode.addComponent(cc.Label);
    const stars = '★'.repeat(level.difficulty) + '☆'.repeat(Math.max(0, 5 - level.difficulty));
    diffLabel.string = `难度：${stars}`;
    diffLabel.fontSize = 12;
    diffNode.setPosition(-90, 0);

    if (progress && progress.completed) {
      const scoreNode = new cc.Node('score');
      scoreNode.parent = node;
      scoreNode.anchorX = 0;
      const scoreLabel = scoreNode.addComponent(cc.Label);
      scoreLabel.string = `最高分：${progress.bestScore}`;
      scoreLabel.fontSize = 11;
      scoreNode.setPosition(-90, -20);

      const starNode = new cc.Node('star');
      starNode.parent = node;
      starNode.anchorX = 1;
      const starLabel = starNode.addComponent(cc.Label);
      starLabel.string = '★'.repeat(progress.stars);
      starLabel.fontSize = 12;
      starNode.setPosition(90, 0);
    }

    if (!isUnlocked) {
      const lockNode = new cc.Node('lock');
      lockNode.parent = node;
      const lockLabel = lockNode.addComponent(cc.Label);
      lockLabel.string = '🔒';
      lockLabel.fontSize = 20;
      lockNode.setPosition(70, 0);
    }

    node.on(cc.Node.EventType.TOUCH_END, () => {
      if (isUnlocked) {
        this._selectedIndex = index;
        this.refreshLevelList();
        this.refreshLevelDetail();
      }
    });

    return node;
  }

  private refreshLevelDetail(): void {
    const level = this._levels[this._selectedIndex];
    if (!level) return;

    this.setLabelText('levelName', level.name);
    this.setLabelText('levelDesc', level.description);
    this.setLabelText('levelReward', `基础报酬：¥${level.task.baseReward.toLocaleString()}`);
    this.setLabelText('levelTime', `时间限制：${Math.floor(level.task.timeLimit / 60)}分钟`);
    this.setLabelText('levelDifficulty', `难度：${'★'.repeat(level.difficulty)}${'☆'.repeat(Math.max(0, 5 - level.difficulty))}`);

    const progress = LevelManager.instance.getLevelProgress(level.id);
    if (progress) {
      this.setLabelText('levelAttempts', `挑战次数：${progress.attempts}`);
      this.setLabelText('levelBestScore', `最高分：${progress.bestScore}`);
    } else {
      this.setLabelText('levelAttempts', '尚未挑战');
      this.setLabelText('levelBestScore', '-');
    }
  }

  public onStartClick(): void {
    const level = this._levels[this._selectedIndex];
    if (!level) return;

    if (!LevelManager.instance.isLevelUnlocked(level.id)) {
      return;
    }

    GameManager.instance.startLevel(level.id);
  }

  public onBackClick(): void {
  }

  public onPrevLevel(): void {
    if (this._selectedIndex > 0) {
      this._selectedIndex--;
      this.refreshLevelList();
      this.refreshLevelDetail();
    }
  }

  public onNextLevel(): void {
    if (this._selectedIndex < this._levels.length - 1) {
      this._selectedIndex++;
      this.refreshLevelList();
      this.refreshLevelDetail();
    }
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
