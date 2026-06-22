import { _decorator, Component, Node, Label, Button, ScrollView, Prefab, instantiate, Sprite, Color } from 'cc';
import { UIBase } from './UIBase';
import { GameManager } from '../core/GameManager';
import { ConfigManager } from '../core/ConfigManager';
import { IClue } from '../core/GameInterfaces';
import { GameConstants } from '../core/GameConstants';
const { ccclass, property } = _decorator;

@ccclass('CluePanelUI')
export class CluePanelUI extends UIBase {

    @property(ScrollView)
    clueScrollView: ScrollView | null = null;

    @property(Prefab)
    clueItemPrefab: Prefab | null = null;

    @property(Node)
    clueContent: Node | null = null;

    @property(Label)
    clueCountLabel: Label | null = null;

    @property(Label)
    stageLabel: Label | null = null;

    @property(Label)
    detailNameLabel: Label | null = null;

    @property(Label)
    detailTypeLabel: Label | null = null;

    @property(Label)
    detailDescLabel: Label | null = null;

    @property(Label)
    detailCredLabel: Label | null = null;

    @property(Node)
    detailPanel: Node | null = null;

    @property(Sprite)
    keyIcon: Sprite | null = null;

    @property(Button)
    closeDetailButton: Button | null = null;

    private _clueItems: Node[] = [];
    private _selectedClue: IClue | null = null;

    onLoad() {
        super.onLoad();

        if (this.closeDetailButton) {
            this.closeDetailButton.node.on(Button.EventType.CLICK, this.onCloseDetail, this);
        }
    }

    protected onShow(): void {
        this.refreshUI();
    }

    public refreshUI(): void {
        const currentStage = GameManager.instance.getCurrentStage();
        if (currentStage) {
            this.setLabelText(this.stageLabel, `阶段: ${GameConstants.STAGE_NAMES[currentStage.stage as GameConstants.CaseStage]}`);
        }

        const clues = GameManager.instance.getDiscoveredClues();
        this.setLabelText(this.clueCountLabel, `已发现线索: ${clues.length}`);

        this.refreshClueList(clues);
    }

    private refreshClueList(clues: IClue[]): void {
        if (!this.clueContent || !this.clueItemPrefab) return;

        this._clueItems.forEach(item => item.destroy());
        this._clueItems = [];

        clues.forEach(clue => {
            const itemNode = instantiate(this.clueItemPrefab!);
            this.clueContent!.addChild(itemNode);
            this._clueItems.push(itemNode);

            this.setupClueItem(itemNode, clue);
        });
    }

    private setupClueItem(node: Node, clue: IClue): void {
        const nameLabel = node.getChildByName('NameLabel')?.getComponent(Label);
        const typeLabel = node.getChildByName('TypeLabel')?.getComponent(Label);
        const iconSprite = node.getChildByName('IconSprite')?.getComponent(Sprite);
        const keyMark = node.getChildByName('KeyMark');
        const missMark = node.getChildByName('MissMark');

        this.setLabelText(nameLabel, clue.name);

        const typeNames: Record<string, string> = {
            [GameConstants.ClueType.TESTIMONY]: '证人证言',
            [GameConstants.ClueType.PHYSICAL]: '物证',
            [GameConstants.ClueType.DOCUMENTARY]: '书证',
            [GameConstants.ClueType.DIGITAL]: '电子数据',
            [GameConstants.ClueType.EXPERT]: '鉴定意见'
        };
        this.setLabelText(typeLabel, typeNames[clue.type] || clue.type);

        if (keyMark) {
            keyMark.active = clue.isKey;
        }

        if (missMark) {
            missMark.active = clue.missingPage;
        }

        node.on(Node.EventType.TOUCH_END, () => {
            this.showClueDetail(clue);
        }, this);
    }

    private showClueDetail(clue: IClue): void {
        this._selectedClue = clue;

        if (this.detailPanel) {
            this.detailPanel.active = true;
        }

        this.setLabelText(this.detailNameLabel, clue.name);

        const typeNames: Record<string, string> = {
            [GameConstants.ClueType.TESTIMONY]: '证人证言',
            [GameConstants.ClueType.PHYSICAL]: '物证',
            [GameConstants.ClueType.DOCUMENTARY]: '书证',
            [GameConstants.ClueType.DIGITAL]: '电子数据',
            [GameConstants.ClueType.EXPERT]: '鉴定意见'
        };
        this.setLabelText(this.detailTypeLabel, `类型: ${typeNames[clue.type] || clue.type}`);
        this.setLabelText(this.detailDescLabel, clue.description);
        this.setLabelText(this.detailCredLabel, `可信度: ${clue.credibility}%`);

        if (this.keyIcon) {
            this.keyIcon.node.active = clue.isKey;
        }
    }

    private onCloseDetail(): void {
        if (this.detailPanel) {
            this.detailPanel.active = false;
        }
        this._selectedClue = null;
    }

    public getSelectedClue(): IClue | null {
        return this._selectedClue;
    }
}
