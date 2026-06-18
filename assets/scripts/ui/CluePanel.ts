import { UIBase } from './UIBase';
import { EventManager, GameEvents } from '../utils/EventManager';
import { GameManager } from '../managers/GameManager';
import { Clue } from '../core/Types';

export class CluePanel extends UIBase {
  private _clues: Clue[] = [];
  private _currentIndex: number = 0;
  private _viewedIds: Set<string> = new Set();

  constructor(node?: any) {
    super(node);
    this.registerEvents();
  }

  private registerEvents(): void {
    EventManager.instance.on(GameEvents.GAME_START, this.onGameStart.bind(this));
    EventManager.instance.on(GameEvents.CLUE_VIEWED, this.onClueViewed.bind(this));
  }

  private onGameStart(levelConfig: any): void {
    this._clues = levelConfig.clues || [];
    this._currentIndex = 0;
    this._viewedIds.clear();
    this.refresh();
  }

  private onClueViewed(clueId: string): void {
    this._viewedIds.add(clueId);
    this.refreshClueList();
  }

  public refresh(): void {
    this.refreshClueList();
    this.refreshCurrentClue();
  }

  private refreshClueList(): void {
    if (!this.node) return;
    const listNode = this.node.getChildByName('clueList');
    if (!listNode) return;

    const content = listNode.getChildByName('content');
    if (!content) return;

    this.clearListContent(content);

    for (let i = 0; i < this._clues.length; i++) {
      const clue = this._clues[i];
      const item = this.createClueItem(clue, i);
      content.addChild(item);
    }
  }

  private clearListContent(content: any): void {
    if (!content || !content.removeAllChildren) return;
    content.removeAllChildren();
  }

  private createClueItem(clue: Clue, index: number): any {
    if (typeof cc === 'undefined') return {} as any;

    const node = new cc.Node(`clue_${clue.id}`);
    node.setContentSize(200, 50);

    const bg = node.addComponent(cc.Sprite);
    if (this._viewedIds.has(clue.id)) {
      node.opacity = 150;
    }

    const labelNode = new cc.Node('label');
    labelNode.parent = node;
    const label = labelNode.addComponent(cc.Label);
    label.string = clue.title;
    label.fontSize = 16;
    labelNode.setPosition(0, 0);

    if (clue.isKey) {
      const keyNode = new cc.Node('key');
      keyNode.parent = node;
      const keyLabel = keyNode.addComponent(cc.Label);
      keyLabel.string = '★';
      keyLabel.fontSize = 14;
      keyNode.setPosition(-90, 0);
    }

    node.on(cc.Node.EventType.TOUCH_END, () => {
      this._currentIndex = index;
      this.viewClue(clue.id);
      this.refreshCurrentClue();
    });

    return node;
  }

  private refreshCurrentClue(): void {
    if (!this._clues[this._currentIndex]) return;
    const clue = this._clues[this._currentIndex];

    this.setLabelText('clueTitle', clue.title);
    this.setLabelText('clueContent', clue.content);
    this.setLabelText('clueType', this.getTypeLabel(clue.clueType));
    this.setLabelText('clueIndex', `${this._currentIndex + 1}/${this._clues.length}`);
  }

  private getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      room: '房间信息',
      material: '材料信息',
      process: '工艺信息',
      price: '价格信息',
      risk: '风险提示',
    };
    return labels[type] || type;
  }

  public viewClue(clueId: string): void {
    GameManager.instance.viewClue(clueId);
  }

  public onPrevClick(): void {
    if (this._currentIndex > 0) {
      this._currentIndex--;
      this.viewClue(this._clues[this._currentIndex].id);
      this.refreshCurrentClue();
    }
  }

  public onNextClick(): void {
    if (this._currentIndex < this._clues.length - 1) {
      this._currentIndex++;
      this.viewClue(this._clues[this._currentIndex].id);
      this.refreshCurrentClue();
    }
  }

  public onConfirmClick(): void {
    GameManager.instance.goToDocumentEditing();
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
