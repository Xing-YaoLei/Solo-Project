import { _decorator, Label, Node, Button, Sprite, Color, instantiate } from 'cc';
import { UIBase } from './UIBase';
import { GameManager } from '../managers/GameManager';
import { AudioManager } from '../managers/AudioManager';
import { GameEvents } from '../utils/EventManager';

const { ccclass, property } = _decorator;

@ccclass('ApprovalPanel')
export class ApprovalPanel extends UIBase {
    @property(Label)
    nodeTitleLabel: Label | null = null;

    @property(Label)
    nodeDescriptionLabel: Label | null = null;

    @property(Label)
    approverLabel: Label | null = null;

    @property(Node)
    choicesContainer: Node | null = null;

    @property(Node)
    choiceTemplate: Node | null = null;

    @property(Label)
    feedbackLabel: Label | null = null;

    @property(Node)
    continueButton: Node | null = null;

    private _currentNode: any = null;
    private _choiceNodes: Node[] = [];
    private _selectedIndex: number = -1;
    private _hasChosen: boolean = false;

    onInit(): void {
        if (this.choiceTemplate) {
            this.choiceTemplate.active = false;
        }
    }

    onStart(): void {
        this.on(GameEvents.PHASE_CHANGED, this.onPhaseChanged.bind(this));
        this.on(GameEvents.CHOICE_MADE, this.onChoiceMade.bind(this));

        this.registerInput('up', this.onInputUp.bind(this));
        this.registerInput('down', this.onInputDown.bind(this));
        this.registerInput('confirm', this.onInputConfirm.bind(this));
        this.registerInput('select_1', () => this.selectChoice(0));
        this.registerInput('select_2', () => this.selectChoice(1));
        this.registerInput('select_3', () => this.selectChoice(2));
        this.registerInput('select_4', () => this.selectChoice(3));
    }

    private onPhaseChanged(phase: string): void {
        if (phase === 'approval') {
            this.show();
            this.refreshNode();
        } else {
            this.hide();
        }
    }

    private refreshNode(): void {
        const node = GameManager.instance.getCurrentNode();
        if (!node) return;

        this._currentNode = node;
        this._hasChosen = false;
        this._selectedIndex = -1;

        if (this.nodeTitleLabel) {
            this.nodeTitleLabel.string = node.title;
        }
        if (this.nodeDescriptionLabel) {
            this.nodeDescriptionLabel.string = node.description;
        }
        if (this.approverLabel) {
            this.approverLabel.string = `审批人：${node.approver}`;
        }
        if (this.feedbackLabel) {
            this.feedbackLabel.string = '';
        }
        if (this.continueButton) {
            this.continueButton.active = false;
        }

        this.refreshChoices(node.choices || []);
    }

    private refreshChoices(choices: any[]): void {
        if (!this.choicesContainer || !this.choiceTemplate) return;

        for (const node of this._choiceNodes) {
            node.off(Node.EventType.TOUCH_END);
            node.destroy();
        }
        this._choiceNodes = [];

        choices.forEach((choice, index) => {
            const choiceNode = instantiate(this.choiceTemplate!);
            choiceNode.active = true;
            choiceNode.setPosition(0, -index * 70, 0);

            const textLabel = choiceNode.getChildByName('textLabel')?.getComponent(Label);
            if (textLabel) {
                textLabel.string = `${index + 1}. ${choice.text}`;
            }

            choiceNode.on(Node.EventType.TOUCH_END, () => {
                this.selectChoice(index);
            }, this);

            this.choicesContainer!.addChild(choiceNode);
            this._choiceNodes.push(choiceNode);
        });
    }

    private selectChoice(index: number): void {
        if (this._hasChosen) return;
        if (index < 0 || index >= this._choiceNodes.length) return;

        this._selectedIndex = index;
        this.updateChoiceVisuals();
    }

    private updateChoiceVisuals(): void {
        this._choiceNodes.forEach((node, index) => {
            const bg = node.getChildByName('bg')?.getComponent(Sprite);
            if (bg) {
                if (index === this._selectedIndex) {
                    bg.color = new Color(100, 180, 255, 255);
                } else {
                    bg.color = new Color(240, 240, 240, 255);
                }
            }
        });
    }

    private confirmChoice(): void {
        if (this._hasChosen || this._selectedIndex < 0) return;

        const choice = this._currentNode?.choices?.[this._selectedIndex];
        if (!choice) return;

        this._hasChosen = true;
        GameManager.instance.makeChoice(choice.id);
        AudioManager.instance.playConfirm();
    }

    private onChoiceMade(choiceId: string, choice: any): void {
        if (this.feedbackLabel) {
            this.feedbackLabel.string = choice.feedback || '';
        }
        if (this.continueButton) {
            this.continueButton.active = true;
        }

        this._choiceNodes.forEach((node, index) => {
            const bg = node.getChildByName('bg')?.getComponent(Sprite);
            if (bg) {
                const c = this._currentNode?.choices?.[index];
                if (c && c.id === choiceId) {
                    bg.color = choice.isCorrect
                        ? new Color(100, 200, 100, 255)
                        : new Color(220, 100, 100, 255);
                }
            }
        });

        if (choice.isCorrect) {
            AudioManager.instance.playSuccess();
        } else {
            AudioManager.instance.playError();
        }
    }

    private onInputUp(source: string): void {
        if (this._selectedIndex > 0) {
            this.selectChoice(this._selectedIndex - 1);
            AudioManager.instance.playClick();
        }
    }

    private onInputDown(source: string): void {
        if (this._selectedIndex < this._choiceNodes.length - 1) {
            this.selectChoice(this._selectedIndex + 1);
            AudioManager.instance.playClick();
        }
    }

    private onInputConfirm(source: string): void {
        if (!this._hasChosen && this._selectedIndex >= 0) {
            this.confirmChoice();
        } else if (this._hasChosen) {
            this.onContinueClicked();
        }
    }

    public onContinueClicked(): void {
        AudioManager.instance.playClick();
        GameManager.instance.advanceApproval();
    }

    onShow(): void {
        this.playShowAnimation();
    }
}
