import { _decorator, Component, Node, Label, Button, ScrollView, Prefab, instantiate, Sprite, Color, Vec3, tween, UITransform, SpriteFrame, Texture2D, ImageAsset, resources, JsonAsset } from 'cc';
import { GameManager } from '../core/GameManager';
import { ConfigManager } from '../core/ConfigManager';
import { SaveManager } from '../core/SaveManager';
import { GameConstants } from '../core/GameConstants';
import { ICase, IClue, ICaseAction } from '../core/GameInterfaces';
import { ResourceFactory, CocosResourceLoader, StorageFactory, CocosStorage } from '../core/PlatformAdapters';
const { ccclass, property } = _decorator;

@ccclass('MainSceneController')
export class MainSceneController extends Component {

    @property(Node)
    missionHallPanel: Node | null = null;

    @property(Node)
    casePlayPanel: Node | null = null;

    @property(Node)
    cluePanel: Node | null = null;

    @property(Node)
    resultPanel: Node | null = null;

    @property(Label)
    loadingLabel: Node | null = null;

    @property(Node)
    loadingPanel: Node | null = null;

    @property(Node)
    caseListContainer: Node | null = null;

    @property(Node)
    clueListContainer: Node | null = null;

    @property(Node)
    actionListContainer: Node | null = null;

    @property(Label)
    stageInfoLabel: Node | null = null;

    @property(Label)
    playerInfoLabel: Node | null = null;

    private _currentState: 'loading' | 'hall' | 'playing' = 'loading';
    private _caseItems: Node[] = [];
    private _clueItems: Node[] = [];
    private _actionItems: Node[] = [];

    async onLoad() {
        console.log('[MainSceneController] Loading game...');
        this.showPanel('loading');

        StorageFactory.setInstance(new CocosStorage());
        ResourceFactory.setInstance(new CocosResourceLoader(''));

        try {
            await GameManager.instance.init('configs');
            console.log('[MainSceneController] Game initialized');
        } catch (e) {
            console.error('[MainSceneController] Failed to init:', e);
            this.fallbackLoad();
        }

        this.showMissionHall();
    }

    private fallbackLoad(): void {
        console.warn('[MainSceneController] Using fallback data');
        const save = SaveManager.instance.getSave();
        this.showMissionHall();
    }

    private showPanel(panelName: string): void {
        if (this.missionHallPanel) this.missionHallPanel.active = panelName === 'hall';
        if (this.casePlayPanel) this.casePlayPanel.active = panelName === 'playing';
        if (this.loadingPanel) this.loadingPanel.active = panelName === 'loading';
        if (this.cluePanel) this.cluePanel.active = false;
        if (this.resultPanel) this.resultPanel.active = false;
    }

    public showMissionHall(): void {
        this._currentState = 'hall';
        this.showPanel('hall');
        this.refreshMissionHall();
    }

    private refreshMissionHall(): void {
        const save = SaveManager.instance.getSave();
        const allCases = ConfigManager.instance.getAllCases();
        const container = this.caseListContainer || this.missionHallPanel?.getChildByName('CaseList');

        if (this.playerInfoLabel) {
            this.playerInfoLabel.string = `玩家: Player | 总分: ${save.totalScore} | 已完成案件: ${save.completedCaseIds.length}`;
        }

        console.log(`[MainSceneController] ${allCases.length} cases available, score: ${save.totalScore}`);

        if (container) {
            this._caseItems.forEach(item => item.destroy());
            this._caseItems = [];

            allCases.forEach((caseData, i) => {
                const isUnlocked = caseData.requiredUnlockedCaseIds.length === 0 ||
                    caseData.requiredUnlockedCaseIds.every(id => save.completedCaseIds.includes(id));
                const isCompleted = save.completedCaseIds.includes(caseData.id);

                const itemNode = this.createCaseItem(caseData, isUnlocked, isCompleted, i);
                container.addChild(itemNode);
                this._caseItems.push(itemNode);
            });
        }
    }

    private createCaseItem(caseData: ICase, unlocked: boolean, completed: boolean, index: number): Node {
        const node = new Node(`CaseItem_${caseData.id}`);
        node.addComponent(UITransform);
        const transform = node.getComponent(UITransform)!;
        transform.setContentSize(660, 160);
        node.setPosition(0, 280 - index * 200, 0);

        const sprite = node.addComponent(Sprite);
        sprite.type = Sprite.Type.SIMPLE;
        sprite.sizeMode = Sprite.SizeMode.CUSTOM;
        sprite.color = unlocked
            ? new Color(60, 100, 140, 255)
            : new Color(60, 60, 60, 255);

        const titleNode = new Node('TitleLabel');
        titleNode.addComponent(UITransform);
        const titleTransform = titleNode.getComponent(UITransform)!;
        titleTransform.setContentSize(600, 40);
        titleNode.setPosition(0, 40, 0);
        const titleLabel = titleNode.addComponent(Label);
        titleLabel.string = `[${this.getDifficultyText(caseData.difficulty)}] ${caseData.title}`;
        titleLabel.fontSize = 28;
        titleLabel.lineHeight = 32;
        titleLabel.color = unlocked ? new Color(255, 230, 150, 255) : new Color(150, 150, 150, 255);
        titleLabel.horizontalAlign = Label.HorizontalAlign.CENTER;
        node.addChild(titleNode);

        const descNode = new Node('DescLabel');
        descNode.addComponent(UITransform);
        const descTransform = descNode.getComponent(UITransform)!;
        descTransform.setContentSize(600, 60);
        descNode.setPosition(0, -20, 0);
        const descLabel = descNode.addComponent(Label);
        descLabel.string = caseData.backgroundStory.substring(0, 50) + '...';
        descLabel.fontSize = 22;
        descLabel.lineHeight = 28;
        descLabel.color = unlocked ? new Color(220, 220, 220, 255) : new Color(120, 120, 120, 255);
        descLabel.horizontalAlign = Label.HorizontalAlign.CENTER;
        descLabel.enableWrapText = true;
        node.addChild(descNode);

        const statusNode = new Node('StatusLabel');
        statusNode.addComponent(UITransform);
        const statusTransform = statusNode.getComponent(UITransform)!;
        statusTransform.setContentSize(600, 30);
        statusNode.setPosition(0, -55, 0);
        const statusLabel = statusNode.addComponent(Label);
        if (completed) {
            statusLabel.string = '✓ 已完成';
            statusLabel.color = new Color(100, 255, 150, 255);
        } else if (unlocked) {
            statusLabel.string = '○ 点击开始';
            statusLabel.color = new Color(200, 200, 200, 255);
        } else {
            statusLabel.string = `🔒 需先完成: ${caseData.requiredUnlockedCaseIds.join(', ')}`;
            statusLabel.color = new Color(150, 150, 150, 255);
        }
        statusLabel.fontSize = 20;
        statusLabel.lineHeight = 24;
        statusLabel.horizontalAlign = Label.HorizontalAlign.CENTER;
        node.addChild(statusNode);

        if (unlocked) {
            const button = node.addComponent(Button);
            button.target = node;
            button.transition = Button.Transition.COLOR;
            button.normalColor = new Color(60, 100, 140, 255);
            button.pressedColor = new Color(40, 70, 100, 255);
            button.hoverColor = new Color(80, 130, 180, 255);
            button.disabledColor = new Color(120, 120, 120, 200);

            const clickEventHandler = new Component.EventHandler();
            clickEventHandler.target = this.node;
            clickEventHandler.component = 'MainSceneController';
            clickEventHandler.handler = 'onCaseItemClick';
            clickEventHandler.customEventData = caseData.id;
            button.clickEvents.push(clickEventHandler);
        }

        return node;
    }

    private getDifficultyText(difficulty: string): string {
        const map: Record<string, string> = {
            easy: '简单', normal: '普通', hard: '困难', expert: '专家'
        };
        return map[difficulty] || difficulty;
    }

    public onCaseItemClick(event: any, caseId: string): void {
        console.log(`[MainSceneController] Clicked case: ${caseId}`);
        this.startCase(caseId);
    }

    public startCase(caseId: string): void {
        const success = GameManager.instance.startCase(caseId);
        if (!success) {
            console.error(`[MainSceneController] Failed to start case: ${caseId}`);
            return;
        }

        this._currentState = 'playing';
        this.showPanel('playing');
        this.refreshCasePlay();
    }

    private refreshCasePlay(): void {
        const caseData = GameManager.instance.getCurrentCase();
        const stage = GameManager.instance.getCurrentStage();
        const score = GameManager.instance.getScore();
        const maxScore = GameManager.instance.getMaxScore();
        const clues = GameManager.instance.getDiscoveredClues();
        const actions = GameManager.instance.getAvailableActions();

        console.log(`\n[案件进行中] ${caseData?.title}`);
        console.log(`  阶段: ${GameConstants.STAGE_NAMES[stage?.stage as GameConstants.CaseStage] || ''}`);
        console.log(`  得分: ${score}/${maxScore}`);
        console.log(`  线索: ${clues.length}条, 可用动作: ${actions.length}个`);

        if (this.stageInfoLabel) {
            this.stageInfoLabel.string = `案件: ${caseData?.title} | 阶段: ${GameConstants.STAGE_NAMES[stage?.stage as GameConstants.CaseStage] || ''} | 得分: ${score}/${maxScore}`;
        }

        const clueContainer = this.clueListContainer || this.casePlayPanel?.getChildByName('ClueArea');
        if (clueContainer) {
            this._clueItems.forEach(item => item.destroy());
            this._clueItems = [];
            clues.forEach((clue, i) => {
                const item = this.createClueItem(clue, i);
                clueContainer.addChild(item);
                this._clueItems.push(item);
            });
        }

        const actionContainer = this.actionListContainer || this.casePlayPanel?.getChildByName('ActionArea');
        if (actionContainer) {
            this._actionItems.forEach(item => item.destroy());
            this._actionItems = [];
            actions.forEach((action, i) => {
                const item = this.createActionItem(action, i);
                actionContainer.addChild(item);
                this._actionItems.push(item);
            });
        }
    }

    private createClueItem(clue: IClue, index: number): Node {
        const node = new Node(`Clue_${clue.id}`);
        node.addComponent(UITransform);
        const transform = node.getComponent(UITransform)!;
        transform.setContentSize(660, 90);
        node.setPosition(0, 180 - index * 100, 0);

        const sprite = node.addComponent(Sprite);
        sprite.type = Sprite.Type.SIMPLE;
        sprite.sizeMode = Sprite.SizeMode.CUSTOM;
        sprite.color = new Color(40, 70, 100, 200);

        const titleNode = new Node('Title');
        titleNode.addComponent(UITransform);
        titleNode.getComponent(UITransform)!.setContentSize(620, 30);
        titleNode.setPosition(0, 20, 0);
        const titleLabel = titleNode.addComponent(Label);
        const keyMark = clue.isKey ? ' ⭐' : '';
        const missMark = clue.missingPage ? ' ⚠️缺页' : '';
        titleLabel.string = `${index + 1}. ${clue.name}${keyMark}${missMark}`;
        titleLabel.fontSize = 22;
        titleLabel.lineHeight = 26;
        titleLabel.color = new Color(255, 240, 200, 255);
        titleLabel.horizontalAlign = Label.HorizontalAlign.LEFT;
        node.addChild(titleNode);

        const descNode = new Node('Desc');
        descNode.addComponent(UITransform);
        descNode.getComponent(UITransform)!.setContentSize(620, 40);
        descNode.setPosition(0, -15, 0);
        const descLabel = descNode.addComponent(Label);
        descLabel.string = clue.description.substring(0, 40) + '...';
        descLabel.fontSize = 18;
        descLabel.lineHeight = 22;
        descLabel.color = new Color(200, 200, 200, 255);
        descLabel.horizontalAlign = Label.HorizontalAlign.LEFT;
        descLabel.enableWrapText = true;
        node.addChild(descNode);

        return node;
    }

    private createActionItem(action: ICaseAction, index: number): Node {
        const node = new Node(`Action_${action.id}`);
        node.addComponent(UITransform);
        const transform = node.getComponent(UITransform)!;
        transform.setContentSize(660, 80);
        node.setPosition(0, 200 - index * 90, 0);

        const sprite = node.addComponent(Sprite);
        sprite.type = Sprite.Type.SIMPLE;
        sprite.sizeMode = Sprite.SizeMode.CUSTOM;
        sprite.color = new Color(80, 120, 160, 255);

        const nameNode = new Node('Name');
        nameNode.addComponent(UITransform);
        nameNode.getComponent(UITransform)!.setContentSize(620, 35);
        nameNode.setPosition(0, 12, 0);
        const nameLabel = nameNode.addComponent(Label);
        nameLabel.string = action.name;
        nameLabel.fontSize = 24;
        nameLabel.lineHeight = 28;
        nameLabel.color = new Color(255, 255, 255, 255);
        nameLabel.horizontalAlign = Label.HorizontalAlign.CENTER;
        node.addChild(nameNode);

        const descNode = new Node('Desc');
        descNode.addComponent(UITransform);
        descNode.getComponent(UITransform)!.setContentSize(620, 30);
        descNode.setPosition(0, -18, 0);
        const descLabel = descNode.addComponent(Label);
        descLabel.string = action.description.substring(0, 30);
        descLabel.fontSize = 18;
        descLabel.lineHeight = 22;
        descLabel.color = new Color(220, 220, 220, 255);
        descLabel.horizontalAlign = Label.HorizontalAlign.CENTER;
        node.addChild(descNode);

        const button = node.addComponent(Button);
        button.target = node;
        button.transition = Button.Transition.COLOR;
        button.normalColor = new Color(80, 120, 160, 255);
        button.pressedColor = new Color(50, 80, 120, 255);
        button.hoverColor = new Color(100, 150, 200, 255);
        button.disabledColor = new Color(100, 100, 100, 200);

        const clickHandler = new Component.EventHandler();
        clickHandler.target = this.node;
        clickHandler.component = 'MainSceneController';
        clickHandler.handler = 'onActionClick';
        clickHandler.customEventData = action.id;
        button.clickEvents.push(clickHandler);

        return node;
    }

    public onActionClick(event: any, actionId: string): void {
        console.log(`[MainSceneController] Clicked action: ${actionId}`);
        this.takeAction(actionId);
    }

    public takeAction(actionId: string): void {
        const result = GameManager.instance.takeAction(actionId);
        console.log(`\n[执行动作] ${actionId}`);
        console.log(`  结果: ${result.isCorrect ? '✓正确' : '✗错误'} 得分变化: ${result.scoreChange}`);
        console.log(`  ${result.message}`);

        if (result.nextStage) {
            console.log(`  → 进入下一阶段`);
        }

        if (GameManager.instance.isPlaying()) {
            this.refreshCasePlay();
        } else {
            this.showCaseResult();
        }
    }

    public showClues(): void {
        if (this.cluePanel) this.cluePanel.active = true;
        const clues = GameManager.instance.getDiscoveredClues();
        console.log(`\n[线索详情] 共${clues.length}条`);
        clues.forEach((c, i) => {
            const typeNames: Record<string, string> = {
                testimony: '证人证言', physical: '物证', documentary: '书证',
                digital: '电子数据', expert: '鉴定意见'
            };
            const keyMark = c.isKey ? ' ⭐关键' : '';
            const missMark = c.missingPage ? ' ⚠️缺页' : '';
            console.log(`  ${i + 1}. ${c.name}${keyMark}${missMark}`);
            console.log(`     类型: ${typeNames[c.type] || c.type} 可信度: ${c.credibility}%`);
            console.log(`     ${c.description}`);
        });
    }

    public hideClues(): void {
        if (this.cluePanel) this.cluePanel.active = false;
    }

    private showCaseResult(): void {
        if (this.resultPanel) this.resultPanel.active = true;
        const records = SaveManager.instance.getTrainingRecords();
        const last = records[records.length - 1];
        if (last) {
            console.log(`\n[案件结案]`);
            console.log(`  最终得分: ${last.score}/${last.maxScore}`);
            console.log(`  ${last.passed ? '✓已通过' : '✗未通过'} ${last.perfect ? '⭐完美通关' : ''}`);
            console.log(`  错误次数: ${last.errorRecords.length}, 材料缺页: ${last.materialMissRecords.length}`);
            last.errorRecords.forEach((e, i) => {
                const catName = GameConstants.ERROR_CATEGORY_NAMES[e.errorCategory] || e.errorCategory;
                console.log(`    错误${i + 1}: [${catName}] ${e.errorReason}`);
            });
        }
    }

    public backToHall(): void {
        if (GameManager.instance.isPlaying()) {
            GameManager.instance.endCase();
        }
        this.showMissionHall();
    }

    public retryCase(): void {
        const currentCase = GameManager.instance.getCurrentCase();
        if (currentCase) {
            this.startCase(currentCase.id);
        }
    }

    public restartGame(): void {
        SaveManager.instance.resetSave();
        this.showMissionHall();
    }
}
