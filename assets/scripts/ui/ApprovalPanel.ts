import { UIBase } from './UIBase';
import { EventManager, GameEvents } from '../utils/EventManager';
import { GameManager } from '../managers/GameManager';
import { ApprovalNode, Choice } from '../core/Types';

export class ApprovalPanel extends UIBase {
  private _nodes: ApprovalNode[] = [];
  private _currentIndex: number = 0;
  private _selectedChoiceId: string | null = null;

  constructor(node?: any) {
    super(node);
    this.registerEvents();
  }

  private registerEvents(): void {
    EventManager.instance.on(GameEvents.GAME_START, this.onGameStart.bind(this));
    EventManager.instance.on(GameEvents.PHASE_CHANGED, this.onPhaseChanged.bind(this));
    EventManager.instance.on(GameEvents.CHOICE_MADE, this.onChoiceMade.bind(this));
  }

  private onGameStart(levelConfig: any): void {
    this._nodes = levelConfig.approvalNodes || [];
    this._currentIndex = 0;
    this._selectedChoiceId = null;
  }

  private onPhaseChanged(phase: string): void {
    if (phase === 'approval') {
      this.refresh();
    }
  }

  private onChoiceMade(choiceId: string, choice: any): void {
    this._selectedChoiceId = choiceId;
    this.showFeedback(choice);
  }

  public refresh(): void {
    const currentNode = this._nodes[this._currentIndex];
    if (!currentNode) return;

    this.setLabelText('nodeTitle', currentNode.title);
    this.setLabelText('nodeDesc', currentNode.description);
    this.setLabelText('nodeIndex', `${this._currentIndex + 1}/${this._nodes.length}`);
    this.setLabelText('nodeType', this.getTypeLabel(currentNode.nodeType));

    this.refreshChoices(currentNode.choices);
  }

  private getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      quantity: '数量审核',
      price: '价格审核',
      process: '工艺审核',
      final: '最终审批',
    };
    return labels[type] || type;
  }

  private refreshChoices(choices: Choice[]): void {
    if (!this.node) return;
    const choicesNode = this.node.getChildByName('choices');
    if (!choicesNode) return;

    const content = choicesNode.getChildByName('content');
    if (!content) return;

    this.clearListContent(content);

    for (let i = 0; i < choices.length; i++) {
      const choice = choices[i];
      const choiceNode = this.createChoiceItem(choice, i);
      content.addChild(choiceNode);
    }
  }

  private clearListContent(content: any): void {
    if (!content || !content.removeAllChildren) return;
    content.removeAllChildren();
  }

  private createChoiceItem(choice: Choice, index: number): any {
    if (typeof cc === 'undefined') return {} as any;

    const node = new cc.Node(`choice_${choice.id}`);
    node.setContentSize(280, 60);

    const bg = node.addComponent(cc.Sprite);

    const indexNode = new cc.Node('index');
    indexNode.parent = node;
    const indexLabel = indexNode.addComponent(cc.Label);
    indexLabel.string = `${index + 1}.`;
    indexLabel.fontSize = 14;
    indexNode.setPosition(-120, 0);

    const textNode = new cc.Node('text');
    textNode.parent = node;
    textNode.anchorX = 0;
    const textLabel = textNode.addComponent(cc.Label);
    textLabel.string = choice.text;
    textLabel.fontSize = 14;
    textNode.setPosition(-90, 0);

    if (choice.scoreDelta !== 0) {
      const scoreNode = new cc.Node('score');
      scoreNode.parent = node;
      const scoreLabel = scoreNode.addComponent(cc.Label);
      scoreLabel.string = choice.scoreDelta > 0 ? `+${choice.scoreDelta}分` : `${choice.scoreDelta}分`;
      scoreLabel.fontSize = 12;
      scoreNode.setPosition(110, 15);
    }

    node.on(cc.Node.EventType.TOUCH_END, () => {
      this.selectChoice(choice.id);
    });

    return node;
  }

  public selectChoice(choiceId: string): void {
    this._selectedChoiceId = choiceId;
    GameManager.instance.makeChoice(choiceId);
  }

  private showFeedback(choice: any): void {
    this.setLabelText('feedbackText', choice.feedback);
    const feedbackNode = this.node?.getChildByName('feedback');
    if (feedbackNode) {
      feedbackNode.active = true;
    }
  }

  public onConfirmClick(): void {
    if (!this._selectedChoiceId) return;
    this._selectedChoiceId = null;
    GameManager.instance.advanceApproval();
    this.refresh();
  }

  public onChoice1Click(): void {
    this.selectChoiceByIndex(0);
  }

  public onChoice2Click(): void {
    this.selectChoiceByIndex(1);
  }

  public onChoice3Click(): void {
    this.selectChoiceByIndex(2);
  }

  public onChoice4Click(): void {
    this.selectChoiceByIndex(3);
  }

  private selectChoiceByIndex(index: number): void {
    const currentNode = this._nodes[this._currentIndex];
    if (!currentNode || !currentNode.choices[index]) return;
    this.selectChoice(currentNode.choices[index].id);
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
