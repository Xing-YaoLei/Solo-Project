import { _decorator, Component, Node, Label, Button, Sprite, Color, Vec3, UITransform, resources, JsonAsset } from 'cc';
import { GameManager } from '../core/GameManager';
import { ConfigManager } from '../core/ConfigManager';
import { SaveManager } from '../core/SaveManager';
import { GameConstants } from '../core/GameConstants';
import { ICase, IClue, ICaseAction, IErrorRecord, IMaterialMissRecord } from '../core/GameInterfaces';
import { ResourceFactory, CocosResourceLoader, StorageFactory, CocosStorage } from '../core/PlatformAdapters';
import { TrainingAnalysis } from '../core/TrainingAnalysis';
import { ClientArchiveUI } from '../ui/ClientArchiveUI';
import { TrainingRecordUI } from '../ui/TrainingRecordUI';
import { LeaderboardUI } from '../ui/LeaderboardUI';
const { ccclass, property } = _decorator;

type UIState = 'loading' | 'hall' | 'playing' | 'result' | 'clientArchive' | 'training' | 'leaderboard';

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
    loadingLabel: Label | null = null;

    @property(Node)
    loadingPanel: Node | null = null;

    @property(Node)
    caseListContainer: Node | null = null;

    @property(Node)
    clueListContainer: Node | null = null;

    @property(Node)
    actionListContainer: Node | null = null;

    @property(Label)
    stageInfoLabel: Label | null = null;

    @property(Label)
    playerInfoLabel: Label | null = null;

    @property(Node)
    mapManagerNode: Node | null = null;

    @property(Node)
    clientArchivePanel: Node | null = null;

    @property(Node)
    trainingRecordPanel: Node | null = null;

    @property(Node)
    leaderboardPanel: Node | null = null;

    @property(Label)
    resultScoreLabel: Label | null = null;

    @property(Label)
    resultCaseInfoLabel: Label | null = null;

    @property(Label)
    resultResultLabel: Label | null = null;

    @property(Node)
    resultErrorsContainer: Node | null = null;

    @property(Node)
    resultMissContainer: Node | null = null;

    private _currentState: UIState = 'loading';
    private _caseItems: Node[] = [];
    private _clueItems: Node[] = [];
    private _actionItems: Node[] = [];
    private _errorItems: Node[] = [];
    private _missItems: Node[] = [];
    private _previousState: UIState = 'hall';

    async onLoad() {
        console.log('[MainSceneController] Loading game...');
        this._setState('loading');

        StorageFactory.setInstance(new CocosStorage());
        ResourceFactory.setInstance(new CocosResourceLoader(''));

        try {
            await GameManager.instance.init('configs');
            console.log('[MainSceneController] Game initialized');
        } catch (e) {
            console.error('[MainSceneController] Failed to init:', e);
            this._fallbackLoad();
        }

        this._setupMenuButtons();
        this._showMissionHall();
    }

    private _fallbackLoad(): void {
        console.warn('[MainSceneController] Using fallback data');
        SaveManager.instance.getSave();
    }

    private _setState(state: UIState): void {
        this._currentState = state;

        if (this.missionHallPanel) this.missionHallPanel.active = state === 'hall';
        if (this.casePlayPanel) this.casePlayPanel.active = state === 'playing';
        if (this.loadingPanel) this.loadingPanel.active = state === 'loading';
        if (this.resultPanel) this.resultPanel.active = state === 'result';
        if (this.cluePanel) this.cluePanel.active = false;
        if (this.clientArchivePanel) this.clientArchivePanel.active = state === 'clientArchive';
        if (this.trainingRecordPanel) this.trainingRecordPanel.active = state === 'training';
        if (this.leaderboardPanel) this.leaderboardPanel.active = state === 'leaderboard';
    }

    private _setupMenuButtons(): void {
        const bindBtn = (panelName: string, state: UIState) => {
            const container = this.missionHallPanel?.getChildByName('MenuButtons');
            if (!container) return;
            const btnNode = container.getChildByName(`${panelName}Button`);
            if (btnNode) {
                const btn = btnNode.getComponent(Button);
                if (btn) {
                    btn.node.on(Button.EventType.CLICK, () => {
                        this._openPanel(state);
                    }, this);
                }
            }
        };

        bindBtn('ClientArchive', 'clientArchive');
        bindBtn('Training', 'training');
        bindBtn('Leaderboard', 'leaderboard');

        const bindPanelClose = (panelNode: Node | null, backState: UIState) => {
            if (!panelNode) return;
            const btnNode = panelNode.getChildByName('CloseButton');
            if (btnNode) {
                const btn = btnNode.getComponent(Button);
                if (btn) {
                    btn.node.on(Button.EventType.CLICK, () => {
                        this._setState(backState);
                    }, this);
                }
            }
        };

        bindPanelClose(this.clientArchivePanel, 'hall');
        bindPanelClose(this.trainingRecordPanel, 'hall');
        bindPanelClose(this.leaderboardPanel, 'hall');

        const bindResultBtn = (btnName: string, callback: () => void) => {
            const container = this.resultPanel?.getChildByName('ResultButtons');
            if (!container) return;
            const btnNode = container.getChildByName(btnName);
            if (btnNode) {
                const btn = btnNode.getComponent(Button);
                if (btn) {
                    btn.node.on(Button.EventType.CLICK, callback, this);
                }
            }
        };

        bindResultBtn('BackButton', () => this._backToHall());
        bindResultBtn('ReviewButton', () => this._openPanel('training'));
        bindResultBtn('RetryButton', () => this._retryCurrentCase());
    }

    private _openPanel(state: UIState): void {
        this._previousState = this._currentState;
        if (state === 'clientArchive') {
            const ui = this.clientArchivePanel?.getComponent(ClientArchiveUI);
            if (ui) {
                ui.node.active = true;
                ui.refreshUI();
            }
        } else if (state === 'training') {
            const ui = this.trainingRecordPanel?.getComponent(TrainingRecordUI);
            if (ui) {
                ui.node.active = true;
                ui.refreshUI();
            }
        } else if (state === 'leaderboard') {
            const ui = this.leaderboardPanel?.getComponent(LeaderboardUI);
            if (ui) {
                ui.node.active = true;
                ui.refreshUI();
            }
        }
        this._setState(state);
    }

    private _showMissionHall(): void {
        this._setState('hall');
        this._refreshMissionHall();
    }

    private _refreshMissionHall(): void {
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

                const itemNode = this._createCaseItem(caseData, isUnlocked, isCompleted, i);
                container.addChild(itemNode);
                this._caseItems.push(itemNode);
            });
        }
    }

    private _createCaseItem(caseData: ICase, unlocked: boolean, completed: boolean, index: number): Node {
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
        titleLabel.string = `[${this._getDifficultyText(caseData.difficulty)}] ${caseData.title}`;
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

            node.on(Node.EventType.TOUCH_END, () => {
                this._onCaseItemClick(caseData.id);
            }, this);
        }

        return node;
    }

    private _getDifficultyText(difficulty: string): string {
        const map: Record<string, string> = {
            easy: '简单', normal: '普通', hard: '困难', expert: '专家'
        };
        return map[difficulty] || difficulty;
    }

    private _onCaseItemClick(caseId: string): void {
        console.log(`[MainSceneController] Clicked case: ${caseId}`);
        this._startCase(caseId);
    }

    private _startCase(caseId: string): void {
        const success = GameManager.instance.startCase(caseId);
        if (!success) {
            console.error(`[MainSceneController] Failed to start case: ${caseId}`);
            return;
        }

        this._setState('playing');
        this._refreshCasePlay();
    }

    private _refreshCasePlay(): void {
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
                const item = this._createClueItem(clue, i);
                clueContainer.addChild(item);
                this._clueItems.push(item);
            });
        }

        const actionContainer = this.actionListContainer || this.casePlayPanel?.getChildByName('ActionArea');
        if (actionContainer) {
            this._actionItems.forEach(item => item.destroy());
            this._actionItems = [];
            actions.forEach((action, i) => {
                const item = this._createActionItem(action, i);
                actionContainer.addChild(item);
                this._actionItems.push(item);
            });
        }
    }

    private _createClueItem(clue: IClue, index: number): Node {
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

    private _createActionItem(action: ICaseAction, index: number): Node {
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

        node.on(Node.EventType.TOUCH_END, () => {
            this._onActionClick(action.id);
        }, this);

        return node;
    }

    private _onActionClick(actionId: string): void {
        console.log(`[MainSceneController] Clicked action: ${actionId}`);
        this._takeAction(actionId);
    }

    private _takeAction(actionId: string): void {
        const result = GameManager.instance.takeAction(actionId);
        console.log(`\n[执行动作] ${actionId}`);
        console.log(`  结果: ${result.isCorrect ? '✓正确' : '✗错误'} 得分变化: ${result.scoreChange}`);
        console.log(`  ${result.message}`);

        if (result.nextStage) {
            console.log(`  → 进入下一阶段`);
        }

        if (GameManager.instance.isPlaying()) {
            this._refreshCasePlay();
        } else {
            this._showCaseResult();
        }
    }

    private _showCaseResult(): void {
        this._setState('result');
        this._refreshResultPanel();
    }

    private _refreshResultPanel(): void {
        const records = SaveManager.instance.getTrainingRecords();
        const lastRecord = records[records.length - 1];
        const caseData = lastRecord ? ConfigManager.instance.getCase(lastRecord.caseId) : null;

        if (this.resultCaseInfoLabel && caseData) {
            this.resultCaseInfoLabel.string = `案件：${caseData.title}`;
        }

        if (this.resultScoreLabel && lastRecord) {
            this.resultScoreLabel.string = `得分: ${lastRecord.score}/${lastRecord.maxScore}`;
        }

        if (this.resultResultLabel && lastRecord) {
            let text = '';
            let color: Color;
            if (lastRecord.perfect) {
                text = '⭐ 完美通关！';
                color = new Color(255, 200, 0, 255);
            } else if (lastRecord.passed) {
                text = '✅ 通过';
                color = new Color(100, 255, 150, 255);
            } else {
                text = '❌ 未通过';
                color = new Color(255, 100, 100, 255);
            }
            this.resultResultLabel.string = text;
            this.resultResultLabel.color = color;
        }

        if (this.resultErrorsContainer) {
            this._errorItems.forEach(item => item.destroy());
            this._errorItems = [];

            const errors = lastRecord?.errorRecords || [];
            if (errors.length === 0) {
                const node = this._createInfoItem('无错误决策，表现优秀！', new Color(100, 255, 150, 255), 0);
                this.resultErrorsContainer.addChild(node);
                this._errorItems.push(node);
            } else {
                errors.forEach((err, i) => {
                    const catName = GameConstants.ERROR_CATEGORY_NAMES[err.errorCategory] || err.errorCategory;
                    const text = `[${catName}] ${err.errorReason}${err.suggestion ? ` → ${err.suggestion}` : ''}`;
                    const node = this._createInfoItem(text, new Color(255, 160, 160, 255), i);
                    this.resultErrorsContainer.addChild(node);
                    this._errorItems.push(node);
                });
            }
        }

        if (this.resultMissContainer) {
            this._missItems.forEach(item => item.destroy());
            this._missItems = [];

            const misses = lastRecord?.materialMissRecords || [];
            if (misses.length === 0) {
                const node = this._createInfoItem('无材料缺页，资料完整！', new Color(100, 255, 150, 255), 0);
                this.resultMissContainer.addChild(node);
                this._missItems.push(node);
            } else {
                misses.forEach((miss, i) => {
                    const text = `📄 ${miss.materialName} - ${miss.reason} (扣分: ${miss.penalty})`;
                    const node = this._createInfoItem(text, new Color(255, 220, 140, 255), i);
                    this.resultMissContainer.addChild(node);
                    this._missItems.push(node);
                });
            }
        }

        if (lastRecord) {
            console.log(`\n[案件结算界面]`);
            console.log(`  案件: ${caseData?.title || lastRecord.caseId}`);
            console.log(`  得分: ${lastRecord.score}/${lastRecord.maxScore}`);
            console.log(`  ${lastRecord.perfect ? '⭐完美通关' : lastRecord.passed ? '✅通过' : '❌未通过'}`);
            console.log(`  错误次数: ${lastRecord.errorRecords.length}, 材料缺页: ${lastRecord.materialMissRecords.length}`);
            lastRecord.errorRecords.forEach(e => {
                console.log(`    ❌ [${GameConstants.ERROR_CATEGORY_NAMES[e.errorCategory]}] ${e.errorReason}`);
            });
            lastRecord.materialMissRecords.forEach(m => {
                console.log(`    ⚠️  ${m.materialName}: ${m.reason} (-${m.penalty}分)`);
            });
        }
    }

    private _createInfoItem(text: string, color: Color, index: number): Node {
        const node = new Node(`InfoItem_${index}`);
        node.addComponent(UITransform);
        node.getComponent(UITransform)!.setContentSize(680, 50);
        node.setPosition(0, 100 - index * 55, 0);

        const sprite = node.addComponent(Sprite);
        sprite.type = Sprite.Type.SIMPLE;
        sprite.sizeMode = Sprite.SizeMode.CUSTOM;
        sprite.color = new Color(40, 55, 80, 200);

        const labelNode = new Node('Label');
        labelNode.addComponent(UITransform);
        labelNode.getComponent(UITransform)!.setContentSize(660, 50);
        labelNode.setPosition(0, 0, 0);
        const label = labelNode.addComponent(Label);
        label.string = text;
        label.fontSize = 18;
        label.lineHeight = 24;
        label.color = color;
        label.horizontalAlign = Label.HorizontalAlign.LEFT;
        label.enableWrapText = true;
        node.addChild(labelNode);

        return node;
    }

    private _backToHall(): void {
        if (GameManager.instance.isPlaying()) {
            GameManager.instance.endCase();
        }
        this._showMissionHall();
    }

    private _retryCurrentCase(): void {
        const records = SaveManager.instance.getTrainingRecords();
        const last = records[records.length - 1];
        if (last) {
            this._startCase(last.caseId);
        }
    }
}
