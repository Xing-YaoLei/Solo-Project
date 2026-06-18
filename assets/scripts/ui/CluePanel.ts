import { _decorator, Label, Node, Button, Sprite, Color } from 'cc';
import { UIBase } from './UIBase';
import { GameManager } from '../managers/GameManager';
import { AudioManager } from '../managers/AudioManager';
import { GameEvents } from '../utils/EventManager';

const { ccclass, property } = _decorator;

@ccclass('CluePanel')
export class CluePanel extends UIBase {
    @property(Node)
    clueList: Node | null = null;

    @property(Label)
    clueContentLabel: Label | null = null;

    @property(Node)
    clueDetailNode: Node | null = null;

    @property(Node)
    continueButton: Node | null = null;

    @property(Node)
    toDocumentButton: Node | null = null;

    private _clues: any[] = [];
    private _selectedClueId: string | null = null;
    private _clueNodes: Map<string, Node> = new Map();

    onStart(): void {
        this.on(GameEvents.PHASE_CHANGED, this.onPhaseChanged.bind(this));
        this.on(GameEvents.GAME_START, this.onGameStart.bind(this));
        this.on(GameEvents.CLUE_VIEWED, this.onClueViewed.bind(this));

        this.registerInput('up', this.onInputUp.bind(this));
        this.registerInput('down', this.onInputDown.bind(this));
        this.registerInput('confirm', this.onInputConfirm.bind(this));
        this.registerInput('next', this.onInputNext.bind(this));

        this.bindButtonClick(this.continueButton, this.onContinueClicked.bind(this));
        this.bindButtonClick(this.toDocumentButton, this.onContinueClicked.bind(this));
    }

    private onGameStart(levelConfig: any): void {
        this._clues = levelConfig.clues || [];
        this.refreshClueList();
    }

    private onPhaseChanged(phase: string): void {
        if (phase === 'clue_investigation') {
            this.show();
        } else {
            this.hide();
        }
    }

    private refreshClueList(): void {
        if (!this.clueList) return;

        for (const [, node] of this._clueNodes) {
            node.off(Node.EventType.TOUCH_END);
            node.destroy();
        }
        this._clueNodes.clear();

        this._clues.forEach((clue, index) => {
            const clueNode = new Node(`clue_${clue.id}`);
            clueNode.setPosition(0, -index * 50, 0);

            const bgNode = new Node('bg');
            const bg = bgNode.addComponent(Sprite);
            bg.color = new Color(240, 240, 240, 255);
            bgNode.setContentSize(280, 40);
            clueNode.addChild(bgNode);

            const titleNode = new Node('title');
            const titleLabel = titleNode.addComponent(Label);
            titleLabel.string = clue.title;
            titleLabel.fontSize = 14;
            titleNode.setPosition(-130, 0, 0);
            clueNode.addChild(titleNode);

            clueNode.on(Node.EventType.TOUCH_END, () => {
                this.onClueTapped(clue.id);
            }, this);

            this.clueList!.addChild(clueNode);
            this._clueNodes.set(clue.id, clueNode);
        });
    }

    private onClueTapped(clueId: string): void {
        const clue = this._clues.find(c => c.id === clueId);
        if (clue) {
            this._selectedClueId = clueId;
            this.showClueDetail(clue);
            GameManager.instance.viewClue(clueId);
            AudioManager.instance.playClick();
        }
    }

    private showClueDetail(clue: any): void {
        if (this.clueContentLabel) {
            this.clueContentLabel.string = clue.content;
        }
        if (this.clueDetailNode) {
            this.clueDetailNode.active = true;
        }
    }

    private onClueViewed(clueId: string): void {
        const node = this._clueNodes.get(clueId);
        if (node) {
            const bg = node.getChildByName('bg')?.getComponent(Sprite);
            if (bg) {
                bg.color = new Color(200, 230, 255, 255);
            }
        }
    }

    private onInputUp(source: string): void {
    }

    private onInputDown(source: string): void {
    }

    private onInputConfirm(source: string): void {
    }

    private onInputNext(source: string): void {
    }

    public onContinueClicked(): void {
        AudioManager.instance.playClick();
        GameManager.instance.goToDocumentEditing();
    }

    public onBackClicked(): void {
        AudioManager.instance.playClick();
        if (this.clueDetailNode) {
            this.clueDetailNode.active = false;
        }
    }

    onShow(): void {
        this.playShowAnimation();
    }
}
