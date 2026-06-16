import { _decorator, Component, Node, director, UITransform, Color, Label, ProgressBar } from 'cc';
import { GameManager } from '../core/GameManager';
import { GameBootstrap } from './GameBootstrap';
import { UIController } from '../ui/UIController';
import { HUDController } from '../ui/HUDController';
import { TutorialController } from '../ui/TutorialController';
import { SceneController } from '../scene/SceneController';
import { TestRunner } from '../tests/TestRunner';
import { LevelSelectPanel } from '../ui/LevelSelectPanel';
import { TaskPanel } from '../ui/TaskPanel';
import { CluePanel } from '../ui/CluePanel';
import { ActionPanel } from '../ui/ActionPanel';
import { SettlementPanel } from '../ui/SettlementPanel';
import { LeaderboardPanel } from '../ui/LeaderboardPanel';

const { ccclass } = _decorator;

function mkNode(name: string, parent: Node, w = 0, h = 0, x = 0, y = 0): Node {
    const n = new Node(name);
    parent.addChild(n);
    if (w > 0 || h > 0) {
        const ut = n.addComponent(UITransform);
        ut.setContentSize(w, h);
    }
    n.setPosition(x, y, 0);
    return n;
}

@ccclass('MainScene')
export class MainScene extends Component {

    private testRunner: TestRunner | null = null;
    private devModeClickCount: number = 0;

    onLoad(): void {
        this.ensureGameManager();
        this.buildSceneHierarchy();
        this.setupDevMode();
    }

    private ensureGameManager(): void {
        const existing = director.getRootNode().getChildByName('GameManager');
        if (!existing) {
            const gmNode = new Node('GameManager');
            gmNode.addComponent(GameManager);
            director.addPersistRootNode(gmNode);
        }
    }

    private buildSceneHierarchy(): void {
        const canvas = this.node;
        const uiRoot = mkNode('UIRoot', canvas, 1280, 720);
        const sceneRoot = mkNode('SceneRoot', canvas, 768, 512);

        this.buildSceneView(sceneRoot);
        this.buildUIView(uiRoot);
    }

    private buildSceneView(sceneRoot: Node): void {
        const scNode = mkNode('SceneController', sceneRoot);
        const sc = scNode.addComponent(SceneController);
        sc.tiledMapContainer = mkNode('TiledMapContainer', scNode, 768, 512, -384, -256);
        sc.interactiveObjectsContainer = mkNode('InteractiveObjects', scNode, 768, 512);
    }

    private buildUIView(uiRoot: Node): void {
        const uiCtrlNode = mkNode('UIController', uiRoot, 1280, 720);
        const uiCtrl = uiCtrlNode.addComponent(UIController);

        const levelSelectRoot = mkNode('LevelSelectRoot', uiCtrlNode, 800, 600);
        const gameplayRoot = mkNode('GameplayRoot', uiCtrlNode, 800, 600);
        const settlementRoot = mkNode('SettlementRoot', uiCtrlNode, 800, 600);
        const leaderboardRoot = mkNode('LeaderboardRoot', uiCtrlNode, 800, 600);

        uiCtrl.levelSelectRoot = levelSelectRoot;
        uiCtrl.gameplayRoot = gameplayRoot;
        uiCtrl.settlementRoot = settlementRoot;
        uiCtrl.leaderboardRoot = leaderboardRoot;

        this.buildLevelSelectPanel(levelSelectRoot, uiCtrl);
        this.buildGameplayPanel(gameplayRoot, uiCtrl);
        this.buildSettlementPanel(settlementRoot, uiCtrl);
        this.buildLeaderboardPanel(leaderboardRoot, uiCtrl);

        const taskTab = mkNode('TaskTabButton', uiCtrlNode, 100, 36, -180, 210);
        const clueTab = mkNode('ClueTabButton', uiCtrlNode, 100, 36, 0, 210);
        const actionTab = mkNode('ActionTabButton', uiCtrlNode, 100, 36, 180, 210);
        uiCtrl.taskTabButton = taskTab;
        uiCtrl.clueTabButton = clueTab;
        uiCtrl.actionTabButton = actionTab;

        const hudNode = mkNode('HUDController', uiRoot, 1280, 60, 0, 320);
        this.buildHUD(hudNode);

        const tutNode = mkNode('TutorialController', uiRoot, 500, 200);
        tutNode.addComponent(TutorialController);

        const gbNode = mkNode('GameBootstrap', uiRoot);
        gbNode.addComponent(GameBootstrap);
    }

    private buildLevelSelectPanel(root: Node, uiCtrl: UIController): void {
        const panelNode = mkNode('LevelSelectPanel', root, 800, 600);
        const panel = panelNode.addComponent(LevelSelectPanel);
        uiCtrl.levelSelectPanel = panel;

        const titleNode = mkNode('TitleLabel', panelNode, 400, 50, 0, 260);
        const titleLabel = this.addLabel(titleNode, '选择关卡', 28);
        titleLabel.color = new Color(33, 33, 33);

        const container = mkNode('LevelContainer', panelNode, 700, 400);
        panel.levelContainer = container;

        const lbBtn = mkNode('LeaderboardButton', panelNode, 200, 44, 0, -260);
        this.addLabel(lbBtn, '查看排行榜', 16, new Color(255, 255, 255));
        lbBtn.on(Node.EventType.TOUCH_END, () => uiCtrl.showLeaderboard());
    }

    private buildGameplayPanel(root: Node, uiCtrl: UIController): void {
        const taskNode = mkNode('TaskPanel', root, 600, 450);
        const taskPanel = taskNode.addComponent(TaskPanel);
        uiCtrl.taskPanel = taskPanel;
        this.buildTaskPanelChildren(taskNode, taskPanel);

        const clueNode = mkNode('CluePanel', root, 600, 450);
        clueNode.active = false;
        const cluePanel = clueNode.addComponent(CluePanel);
        uiCtrl.cluePanel = cluePanel;
        this.buildCluePanelChildren(clueNode, cluePanel);

        const actionNode = mkNode('ActionPanel', root, 600, 450);
        actionNode.active = false;
        const actionPanel = actionNode.addComponent(ActionPanel);
        uiCtrl.actionPanel = actionPanel;
        this.buildActionPanelChildren(actionNode, actionPanel);
    }

    private buildTaskPanelChildren(node: Node, panel: TaskPanel): void {
        const nameNode = mkNode('TaskNameLabel', node, 500, 40, 0, 160);
        panel.taskNameLabel = this.addLabel(nameNode, '等待开始...', 22);

        const descNode = mkNode('TaskDescLabel', node, 500, 80, 0, 100);
        panel.taskDescLabel = this.addLabel(descNode, '请选择关卡开始游戏', 16, new Color(100, 100, 100));

        const typeNode = mkNode('TaskTypeLabel', node, 200, 30, 0, 40);
        panel.taskTypeLabel = this.addLabel(typeNode, '', 18, new Color(33, 150, 243));

        const progressNode = mkNode('TaskProgressLabel', node, 300, 30, 0, 0);
        panel.taskProgressLabel = this.addLabel(progressNode, '任务进度: 0/0', 16);

        const clueNode = mkNode('ClueIndicator', node, 200, 24, -120, -40);
        panel.clueIndicator = clueNode;
        panel.clueCountLabel = this.addLabel(clueNode, '', 14);

        const acceptBtn = mkNode('AcceptButton', node, 240, 50, 0, -100);
        panel.acceptButton = acceptBtn;
        this.addLabel(acceptBtn, '开始观察线索', 18, new Color(255, 255, 255));
    }

    private buildCluePanelChildren(node: Node, panel: CluePanel): void {
        const titleNode = mkNode('TitleLabel', node, 400, 40, 0, 180);
        panel.titleLabel = this.addLabel(titleNode, '线索资料', 24);

        const container = mkNode('ClueContainer', node, 550, 300, 0, 0);
        panel.clueContainer = container;

        const doneBtn = mkNode('ObserveCompleteButton', node, 220, 44, 0, -180);
        panel.observeCompleteButton = doneBtn;
        this.addLabel(doneBtn, '观察完毕，开始评估', 16, new Color(255, 255, 255));
    }

    private buildActionPanelChildren(node: Node, panel: ActionPanel): void {
        const container = mkNode('OptionsContainer', node, 550, 280, 0, 60);
        panel.optionsContainer = container;

        const hintNode = mkNode('HintLabel', node, 550, 30, 0, -70);
        panel.hintLabel = this.addLabel(hintNode, '', 14, new Color(100, 100, 100));

        const feedbackNode = mkNode('FeedbackSection', node, 550, 80, 0, -130);
        feedbackNode.active = false;
        panel.feedbackSection = feedbackNode;

        const explainNode = mkNode('FeedbackExplanationLabel', feedbackNode, 530, 24, 0, 25);
        panel.feedbackExplanationLabel = this.addLabel(explainNode, '', 14);

        const scoreNode = mkNode('FeedbackScoreLabel', feedbackNode, 200, 24, -120, -5);
        panel.feedbackScoreLabel = this.addLabel(scoreNode, '', 16);

        const errorNode = mkNode('FeedbackErrorLabel', feedbackNode, 300, 24, 80, -5);
        panel.feedbackErrorLabel = this.addLabel(errorNode, '', 13, new Color(198, 40, 40));

        const proceedBtn = mkNode('ProceedButton', node, 160, 44, 0, -190);
        proceedBtn.active = false;
        panel.proceedButton = proceedBtn;
        this.addLabel(proceedBtn, '下一步', 16, new Color(255, 255, 255));
    }

    private buildSettlementPanel(root: Node, uiCtrl: UIController): void {
        root.active = false;
        const panelNode = mkNode('SettlementPanel', root, 700, 700);
        const panel = panelNode.addComponent(SettlementPanel);
        uiCtrl.settlementPanel = panel;

        panel.levelNameLabel = this.addLabel(mkNode('LevelNameLabel', panelNode, 400, 40, 0, 300), '关卡结算', 26);

        panel.totalScoreLabel = this.addLabel(mkNode('TotalScoreLabel', panelNode, 200, 60, 0, 240), '0', 48, new Color(33, 150, 243));

        panel.passScoreLabel = this.addLabel(mkNode('PassScoreLabel', panelNode, 200, 20, 0, 200), '及格线: 60分', 14, new Color(120, 120, 120));

        const starNode = mkNode('StarLabel', panelNode, 200, 40, 0, 160);
        panel.starLabel = starNode;
        this.addLabel(starNode, '☆☆☆', 28, new Color(255, 215, 0));

        const barNode = mkNode('ScoreBar', panelNode, 400, 16, 0, 120);
        panel.scoreProgressBar = barNode.addComponent(ProgressBar);

        panel.timeSpentLabel = this.addLabel(mkNode('TimeSpentLabel', panelNode, 200, 24, -180, 80), '用时: 0分0秒', 16);

        const correctNode = mkNode('CorrectCountLabel', panelNode, 200, 24, 0, 80);
        panel.correctCountLabel = correctNode;
        this.addLabel(correctNode, '正确: 0/0', 16);

        const insuranceNode = mkNode('InsuranceTriggeredLabel', panelNode, 200, 24, 180, 80);
        panel.insuranceTriggeredLabel = insuranceNode;
        this.addLabel(insuranceNode, '', 14, new Color(198, 40, 40));

        const successNode = mkNode('SuccessSection', panelNode, 600, 40, 0, 40);
        panel.successSection = successNode;
        this.addLabel(successNode, '✅ 通过！', 20, new Color(46, 125, 50));

        const failureNode = mkNode('FailureSection', panelNode, 600, 40, 0, 40);
        failureNode.active = false;
        panel.failureSection = failureNode;
        this.addLabel(failureNode, '❌ 未通过', 20, new Color(198, 40, 40));

        const rewardsNode = mkNode('RewardsSection', panelNode, 400, 24, 0, 0);
        panel.rewardsSection = rewardsNode;
        const expNode = mkNode('ExpRewardLabel', rewardsNode, 140, 24, -80, 0);
        panel.expRewardLabel = this.addLabel(expNode, '', 14, new Color(255, 152, 0));
        const coinsNode = mkNode('CoinsRewardLabel', rewardsNode, 140, 24, 80, 0);
        panel.coinsRewardLabel = this.addLabel(coinsNode, '', 14, new Color(255, 193, 7));

        const nursingTab = mkNode('NursingLogTab', panelNode, 140, 36, -100, -60);
        panel.nursingLogTab = nursingTab;
        this.addLabel(nursingTab, '护理日志', 14);

        const billingTab = mkNode('BillingDetailTab', panelNode, 140, 36, 100, -60);
        panel.billingDetailTab = billingTab;
        this.addLabel(billingTab, '结算明细', 14);

        panel.nursingLogPanel = mkNode('NursingLogPanel', panelNode, 550, 120, 0, -140);
        panel.billingDetailPanel = mkNode('BillingDetailPanel', panelNode, 550, 120, 0, -140);

        panel.billingContainer = mkNode('BillingContainer', panel.billingDetailPanel, 540, 100, 0, 0);

        panel.totalCostLabel = this.addLabel(mkNode('TotalCostLabel', panelNode, 180, 24, -200, -210), '总费用: ¥0.00', 14);
        panel.totalInsuranceLabel = this.addLabel(mkNode('TotalInsuranceLabel', panelNode, 180, 24, 0, -210), '医保报销: ¥0.00', 14, new Color(46, 125, 50));
        panel.totalDeniedLabel = this.addLabel(mkNode('TotalDeniedLabel', panelNode, 180, 24, 200, -210), '拒付金额: ¥0.00', 14);

        const drgNode = mkNode('DRGWarning', panelNode, 550, 22, 0, -240);
        panel.drgWarning = drgNode;
        panel.drgCostLabel = this.addLabel(drgNode, '', 13, new Color(255, 152, 0));

        panel.replayButton = mkNode('ReplayButton', panelNode, 140, 40, -180, -300);
        this.addLabel(panel.replayButton, '返回菜单', 14, new Color(255, 255, 255));
        panel.nextLevelButton = mkNode('NextLevelButton', panelNode, 140, 40, 0, -300);
        this.addLabel(panel.nextLevelButton, '下一关', 14, new Color(255, 255, 255));
        panel.retryButton = mkNode('RetryButton', panelNode, 140, 40, 180, -300);
        this.addLabel(panel.retryButton, '重新挑战', 14, new Color(255, 255, 255));
        panel.retryButton.active = false;
    }

    private buildLeaderboardPanel(root: Node, uiCtrl: UIController): void {
        root.active = false;
        const panelNode = mkNode('LeaderboardPanel', root, 700, 550);
        const panel = panelNode.addComponent(LeaderboardPanel);
        uiCtrl.leaderboardPanel = panel;

        this.addLabel(mkNode('TitleLabel', panelNode, 300, 40, 0, 240), '排行榜', 26);
        panel.leaderboardContainer = mkNode('LeaderboardContainer', panelNode, 600, 380, 0, 0);

        const backBtn = mkNode('BackButton', panelNode, 160, 44, 0, -240);
        this.addLabel(backBtn, '返回', 16, new Color(255, 255, 255));
        backBtn.on(Node.EventType.TOUCH_END, () => uiCtrl.showLevelSelect());
    }

    private buildHUD(hudNode: Node): void {
        const hud = hudNode.addComponent(HUDController);
        hud.levelNameLabel = this.addLabel(mkNode('LevelNameLabel', hudNode, 200, 30, -450, 0), '康复中心模拟训练', 18);
        hud.scoreLabel = this.addLabel(mkNode('ScoreLabel', hudNode, 150, 30, -250, 0), '0分', 20, new Color(33, 150, 243));
        hud.timeLabel = this.addLabel(mkNode('TimeLabel', hudNode, 120, 30, -80, 0), '--:--', 20);
        hud.insuranceCountLabel = this.addLabel(mkNode('InsuranceCountLabel', hudNode, 200, 30, 120, 0), '', 14, new Color(198, 40, 40));
        hud.phaseLabel = this.addLabel(mkNode('PhaseLabel', hudNode, 160, 30, 400, 0), '主菜单', 14);
        hud.insuranceWarningIcon = mkNode('InsuranceWarningIcon', hudNode, 32, 32, 30, 0);
        hud.abandonButton = mkNode('AbandonButton', hudNode, 100, 30, 500, 0);
        hud.backToMenuButton = mkNode('BackToMenuButton', hudNode, 100, 30, 500, 0);
        hud.replayButton = mkNode('ReplayButton', hudNode, 100, 30, 540, 0);
        hud.rankingButton = mkNode('RankingButton', hudNode, 100, 30, 580, 0);
    }

    private addLabel(node: Node, text: string, fontSize = 20, color?: Color): Label {
        const label = node.addComponent(Label);
        label.string = text;
        label.fontSize = fontSize;
        label.lineHeight = fontSize * 1.2;
        label.horizontalAlign = Label.HorizontalAlign.CENTER;
        label.verticalAlign = Label.VerticalAlign.CENTER;
        label.overflow = Label.Overflow.CLAMP;
        if (color) label.color = color;
        return label;
    }

    private setupDevMode(): void {
        this.node.on(Node.EventType.TOUCH_END, () => {
            this.devModeClickCount++;
            if (this.devModeClickCount >= 5) {
                this.devModeClickCount = 0;
                if (!this.testRunner) {
                    const testNode = mkNode('TestRunner', this.node, 600, 400);
                    this.testRunner = testNode.addComponent(TestRunner);
                }
                if (this.testRunner) {
                    this.testRunner.toggleTestPanel();
                }
            }
        }, this);
    }
}
