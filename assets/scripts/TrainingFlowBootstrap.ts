import { _decorator, Component, Node, Label, Button, ScrollView, Color, Vec3, UITransform, Layout, Widget, Scrollbar, instantiate, Prefab, UIOpacity, Sprite, SpriteFrame } from "cc";
import { GameManager, GamePhase } from "./game/GameManager";
import { LevelManager } from "./game/LevelManager";
import { TimerManager } from "./game/TimerManager";
import { ScoreManager } from "./game/ScoreManager";
import { AppointmentSystem } from "./appointment/AppointmentSystem";
import { ConfigLoader } from "./config/ConfigLoader";
import { ReplaySystem } from "./replay/ReplaySystem";
import { FailedFragmentStore } from "./replay/FailedFragment";
import { CalendarView, CalendarSlotClickEvent } from "./ui/CalendarView";
import { ReminderList, ReminderEntry } from "./ui/ReminderList";
import { ArrivalJudgment, ArrivalJudgmentEvent } from "./ui/ArrivalJudgment";
import { SettlementPage } from "./ui/SettlementPage";
import { StatisticsPage } from "./ui/StatisticsPage";
import { ConflictHint } from "./ui/ConflictHint";
import { ArrivalStatus, Customer } from "./appointment/Customer";
import { ConflictInfo } from "./appointment/ConflictDetector";
import { ReplayActionType } from "./replay/ReplayTypes";
import { TimeSlot } from "./appointment/TimeSlot";
import { ScoreRecord } from "./game/ScoreManager";

const { ccclass, property } = _decorator;

@ccclass("TrainingFlowBootstrap")
export class TrainingFlowBootstrap extends Component {
    private _gameManager: GameManager | null = null;
    private _appointmentSystem: AppointmentSystem | null = null;
    private _levelManager: LevelManager | null = null;
    private _timerManager: TimerManager | null = null;
    private _scoreManager: ScoreManager | null = null;
    private _replaySystem: ReplaySystem | null = null;
    private _failedFragmentStore: FailedFragmentStore | null = null;
    private _configLoader: ConfigLoader | null = null;
    private _calendarView: CalendarView | null = null;
    private _reminderList: ReminderList | null = null;
    private _arrivalJudgment: ArrivalJudgment | null = null;
    private _settlementPage: SettlementPage | null = null;
    private _statisticsPage: StatisticsPage | null = null;
    private _conflictHint: ConflictHint | null = null;

    private _selectedCustomerId: string = "";
    private _currentLevelId: string = "";
    private _timerDisplayLabel: Label | null = null;
    private _selectedCustomerLabel: Label | null = null;
    private _arrivalRateLabel: Label | null = null;
    private _settlementProcessed: boolean = false;

    onLoad(): void {
        console.log("=== 美业门店预约经营模拟 - 训练流程启动 ===");
        this._createAllSystems();
        this._createAllUI();
        this._bindInteractions();
        this._loadConfigsAndStart();
    }

    private _createAllSystems(): void {
        const systemsNode = new Node("GameSystems");
        this.node.addChild(systemsNode);

        this._gameManager = systemsNode.addComponent(GameManager);
        this._appointmentSystem = systemsNode.addComponent(AppointmentSystem);
        this._levelManager = systemsNode.addComponent(LevelManager);
        this._timerManager = systemsNode.addComponent(TimerManager);
        this._scoreManager = systemsNode.addComponent(ScoreManager);
        this._replaySystem = systemsNode.addComponent(ReplaySystem);
        this._failedFragmentStore = systemsNode.addComponent(FailedFragmentStore);
        this._configLoader = systemsNode.addComponent(ConfigLoader);

        this._gameManager!.initialize(
            this._appointmentSystem!,
            this._levelManager!,
            this._timerManager!,
            this._scoreManager!
        );

        this._gameManager!.onPhaseChange(this._onPhaseChange.bind(this));
    }

    private _createAllUI(): void {
        const canvas = this.node.parent;
        if (!canvas) return;

        const root = new Node("UIRoot");
        canvas.addChild(root);

        this._createHeaderUI(root);
        this._createCalendarView(root);
        this._createReminderList(root);
        this._createArrivalJudgment(root);
        this._createConflictHint(root);
        this._createSettlementPage(root);
        this._createStatisticsPage(root);
    }

    private _createHeaderUI(parent: Node): void {
        const headerNode = new Node("Header");
        parent.addChild(headerNode);

        const headerTransform = headerNode.addComponent(UITransform);
        headerTransform.contentSize.set(1280, 60);
        headerNode.setPosition(0, 330, 0);

        const headerWidget = headerNode.addComponent(Widget);
        headerWidget.isAlignTop = true;
        headerWidget.top = 0;
        headerWidget.isAlignLeft = true;
        headerWidget.left = 0;
        headerWidget.isAlignRight = true;
        headerWidget.right = 0;

        const titleLabel = this._createLabel(headerNode, "美业门店预约经营模拟", 24, new Color(255, 255, 255));
        titleLabel.node.setPosition(-500, 0, 0);

        this._timerDisplayLabel = this._createLabel(headerNode, "剩余时间: --", 20, new Color(255, 255, 0));
        this._timerDisplayLabel.node.setPosition(-100, 0, 0);

        this._arrivalRateLabel = this._createLabel(headerNode, "到场率: --%", 20, new Color(0, 255, 0));
        this._arrivalRateLabel.node.setPosition(150, 0, 0);

        this._selectedCustomerLabel = this._createLabel(headerNode, "未选择顾客", 18, new Color(200, 200, 200));
        this._selectedCustomerLabel.node.setPosition(450, 0, 0);

        const bg = headerNode.addComponent(Layout);
        bg.type = Layout.Type.NONE;

        headerNode.addComponent(UIOpacity);
    }

    private _createCalendarView(parent: Node): void {
        const calendarNode = new Node("CalendarView");
        parent.addChild(calendarNode);

        const transform = calendarNode.addComponent(UITransform);
        transform.contentSize.set(800, 500);
        calendarNode.setPosition(-200, -50, 0);

        this._calendarView = calendarNode.addComponent(CalendarView);

        this._createCalendarSlots(calendarNode);
    }

    private _createCalendarSlots(parent: Node): void {
        const scrollViewNode = new Node("ScrollView");
        parent.addChild(scrollViewNode);

        const scrollTransform = scrollViewNode.addComponent(UITransform);
        scrollTransform.contentSize.set(800, 500);

        const scrollView = scrollViewNode.addComponent(ScrollView);
        scrollView.horizontal = true;
        scrollView.vertical = true;
        scrollView.brake = 0.5;

        const contentNode = new Node("Content");
        scrollViewNode.addChild(contentNode);
        const contentTransform = contentNode.addComponent(UITransform);
        contentTransform.contentSize.set(1200, 600);
        scrollView.content = contentTransform;

        const layout = contentNode.addComponent(Layout);
        layout.type = Layout.Type.GRID;
        layout.resizeMode = Layout.ResizeMode.CONTAINER;
        layout.cellSize.set(80, 60);
        layout.spacingX = 4;
        layout.spacingY = 4;
        layout.paddingTop = 10;
        layout.paddingLeft = 10;

        this._calendarView!.scrollView = scrollView;

        const headerBg = new Node("HeaderRow");
        contentNode.addChild(headerBg);
        const headerTransform = headerBg.addComponent(UITransform);
        headerTransform.contentSize.set(1200, 40);
        this._createLabel(headerBg, "工位\\时段", 16, new Color(255, 255, 255));

        for (let st = 0; st < 5; st++) {
            for (let t = 0; t < 18; t++) {
                const hour = 9 + Math.floor(t / 2);
                const minute = (t % 2) * 30;
                const timeStr = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;

                const slotNode = new Node(`Slot_${st}_${timeStr}`);
                contentNode.addChild(slotNode);
                const slotTransform = slotNode.addComponent(UITransform);
                slotTransform.contentSize.set(80, 60);

                const bgNode = new Node("Background");
                slotNode.addChild(bgNode);
                const bgTransform = bgNode.addComponent(UITransform);
                bgTransform.contentSize.set(80, 60);
                const bgSprite = bgNode.addComponent(Sprite);
                bgSprite.color = new Color(240, 240, 240);

                const label = this._createLabel(slotNode, timeStr, 12, new Color(0, 0, 0));
                label.node.setPosition(0, 10, 0);

                const subLabel = this._createLabel(slotNode, "", 10, new Color(100, 100, 100));
                subLabel.node.setPosition(0, -10, 0);

                slotNode.on(Node.EventType.TOUCH_END, () => {
                    this._onSlotClick(st, timeStr);
                });
                slotNode.on(Node.EventType.TOUCH_START, () => {
                    this._onSlotHover(st, timeStr);
                });

                this._calendarView!.registerSlotNode(st, timeStr, slotNode);
            }
        }
    }

    private _createReminderList(parent: Node): void {
        const reminderNode = new Node("ReminderList");
        parent.addChild(reminderNode);

        const transform = reminderNode.addComponent(UITransform);
        transform.contentSize.set(400, 450);
        reminderNode.setPosition(450, -75, 0);

        const title = this._createLabel(reminderNode, "=== 提醒名单 ===", 18, new Color(255, 255, 255));
        title.node.setPosition(0, 210, 0);

        const countLabel = this._createLabel(reminderNode, "待确认: 0 | 紧急: 0", 14, new Color(255, 255, 0));
        countLabel.node.setPosition(0, 185, 0);

        const scrollViewNode = new Node("ScrollView");
        reminderNode.addChild(scrollViewNode);
        const scrollTransform = scrollViewNode.addComponent(UITransform);
        scrollTransform.contentSize.set(380, 400);
        scrollViewNode.setPosition(0, -20, 0);

        const scrollView = scrollViewNode.addComponent(ScrollView);
        scrollView.horizontal = false;
        scrollView.vertical = true;

        const contentNode = new Node("Content");
        scrollViewNode.addChild(contentNode);
        const contentTransform = contentNode.addComponent(UITransform);
        contentTransform.contentSize.set(380, 800);
        scrollView.content = contentTransform;

        const layout = contentNode.addComponent(Layout);
        layout.type = Layout.Type.VERTICAL;
        layout.resizeMode = Layout.ResizeMode.CONTAINER;
        layout.spacingY = 4;
        layout.paddingTop = 5;
        layout.paddingLeft = 10;

        this._reminderList = reminderNode.addComponent(ReminderList);
        this._reminderList!.scrollView = scrollView;
        this._reminderList!.countLabel = countLabel;
        this._reminderList!.entryContainer = contentNode;
    }

    private _createArrivalJudgment(parent: Node): void {
        const judgmentNode = new Node("ArrivalJudgment");
        parent.addChild(judgmentNode);
        judgmentNode.active = false;

        const transform = judgmentNode.addComponent(UITransform);
        transform.contentSize.set(600, 400);
        judgmentNode.setPosition(0, 0, 0);

        const bg = this._createLabel(judgmentNode, "", 0, new Color(40, 40, 40, 240));
        const bgTransform = bg.node.getComponent(UITransform)!;
        bgTransform.contentSize.set(600, 400);

        const title = this._createLabel(judgmentNode, "=== 限时到场判断 ===", 22, new Color(255, 255, 255));
        title.node.setPosition(0, 150, 0);

        const customerNameLabel = this._createLabel(judgmentNode, "", 20, new Color(255, 255, 255));
        customerNameLabel.node.setPosition(0, 90, 0);

        const serviceLabel = this._createLabel(judgmentNode, "", 16, new Color(200, 200, 200));
        serviceLabel.node.setPosition(0, 60, 0);

        const preferredTimeLabel = this._createLabel(judgmentNode, "", 16, new Color(200, 200, 200));
        preferredTimeLabel.node.setPosition(0, 30, 0);

        const countdownLabel = this._createLabel(judgmentNode, "剩余 10 秒", 24, new Color(255, 255, 0));
        countdownLabel.node.setPosition(0, -20, 0);

        const buttonGroup = new Node("ButtonGroup");
        judgmentNode.addChild(buttonGroup);
        buttonGroup.setPosition(0, -80, 0);
        const btnGroupTransform = buttonGroup.addComponent(UITransform);
        btnGroupTransform.contentSize.set(500, 60);

        const layout = buttonGroup.addComponent(Layout);
        layout.type = Layout.Type.HORIZONTAL;
        layout.resizeMode = Layout.ResizeMode.CONTAINER;
        layout.spacingX = 15;

        const statuses: { status: ArrivalStatus; name: string; color: Color }[] = [
            { status: ArrivalStatus.ARRIVED, name: "已到场", color: new Color(0, 200, 0) },
            { status: ArrivalStatus.LATE, name: "迟到", color: new Color(255, 200, 0) },
            { status: ArrivalStatus.NO_SHOW, name: "未到场", color: new Color(255, 0, 0) },
            { status: ArrivalStatus.CANCELLED, name: "已取消", color: new Color(150, 150, 150) }
        ];

        for (const s of statuses) {
            const btnNode = new Node(`Btn_${s.status}`);
            buttonGroup.addChild(btnNode);
            const btnTransform = btnNode.addComponent(UITransform);
            btnTransform.contentSize.set(110, 50);

            const bgNode = new Node("Background");
            btnNode.addChild(bgNode);
            const bgTransform = bgNode.addComponent(UITransform);
            bgTransform.contentSize.set(110, 50);
            const bgSprite = bgNode.addComponent(Sprite);
            bgSprite.color = s.color;

            const btn = btnNode.addComponent(Button);

            const btnLabel = this._createLabel(btnNode, s.name, 16, new Color(255, 255, 255));

            btnNode.on(Node.EventType.TOUCH_END, () => {
                this._onArrivalJudgment(s.status);
            });
        }

        this._arrivalJudgment = judgmentNode.addComponent(ArrivalJudgment);
        this._arrivalJudgment!.customerNameLabel = customerNameLabel;
        this._arrivalJudgment!.serviceLabel = serviceLabel;
        this._arrivalJudgment!.preferredTimeLabel = preferredTimeLabel;
        this._arrivalJudgment!.countdownLabel = countdownLabel;
        this._arrivalJudgment!.buttonGroup = buttonGroup;
    }

    private _createConflictHint(parent: Node): void {
        const hintNode = new Node("ConflictHint");
        parent.addChild(hintNode);

        const transform = hintNode.addComponent(UITransform);
        transform.contentSize.set(400, 200);
        hintNode.setPosition(0, -200, 0);

        const container = new Node("HintContainer");
        hintNode.addChild(container);
        const containerTransform = container.addComponent(UITransform);
        containerTransform.contentSize.set(400, 200);

        const layout = container.addComponent(Layout);
        layout.type = Layout.Type.VERTICAL;
        layout.resizeMode = Layout.ResizeMode.CONTAINER;
        layout.spacingY = 4;

        this._conflictHint = hintNode.addComponent(ConflictHint);
        this._conflictHint!.hintContainer = container;
    }

    private _createSettlementPage(parent: Node): void {
        const settlementNode = new Node("SettlementPage");
        parent.addChild(settlementNode);
        settlementNode.active = false;

        const transform = settlementNode.addComponent(UITransform);
        transform.contentSize.set(900, 600);
        settlementNode.setPosition(0, 0, 0);

        const titleLabel = this._createLabel(settlementNode, "", 24, new Color(255, 255, 255));
        titleLabel.node.setPosition(0, 260, 0);

        const passLabel = this._createLabel(settlementNode, "", 32, new Color(0, 255, 0));
        passLabel.node.setPosition(0, 210, 0);

        const arrivalRateLabel = this._createLabel(settlementNode, "", 18, new Color(255, 255, 255));
        arrivalRateLabel.node.setPosition(-300, 160, 0);

        const conflictCountLabel = this._createLabel(settlementNode, "", 18, new Color(255, 255, 255));
        conflictCountLabel.node.setPosition(0, 160, 0);

        const errorSummaryLabel = this._createLabel(settlementNode, "", 18, new Color(255, 255, 0));
        errorSummaryLabel.node.setPosition(300, 160, 0);

        const errorDetailContainer = new Node("ErrorDetailContainer");
        settlementNode.addChild(errorDetailContainer);
        errorDetailContainer.setPosition(-250, 0, 0);
        const edcTransform = errorDetailContainer.addComponent(UITransform);
        edcTransform.contentSize.set(400, 250);
        const edcLayout = errorDetailContainer.addComponent(Layout);
        edcLayout.type = Layout.Type.VERTICAL;
        edcLayout.resizeMode = Layout.ResizeMode.CONTAINER;
        edcLayout.spacingY = 2;

        const fragmentsContainer = new Node("FragmentsContainer");
        settlementNode.addChild(fragmentsContainer);
        fragmentsContainer.setPosition(250, 0, 0);
        const fcTransform = fragmentsContainer.addComponent(UITransform);
        fcTransform.contentSize.set(400, 250);

        const btnGroup = new Node("ButtonGroup");
        settlementNode.addChild(btnGroup);
        btnGroup.setPosition(0, -240, 0);
        const btnGroupTransform = btnGroup.addComponent(UITransform);
        btnGroupTransform.contentSize.set(700, 60);

        const layout = btnGroup.addComponent(Layout);
        layout.type = Layout.Type.HORIZONTAL;
        layout.spacingX = 10;

        const buttonConfigs = [
            { name: "retry", label: "重试本关" },
            { name: "next", label: "下一关" },
            { name: "replay", label: "回放失败" },
            { name: "stats", label: "统计数据" }
        ];

        const buttons: { [key: string]: Button } = {};
        for (const config of buttonConfigs) {
            const btnNode = new Node(config.name);
            btnGroup.addChild(btnNode);
            const btnTransform = btnNode.addComponent(UITransform);
            btnTransform.contentSize.set(150, 50);

            const bgNode = new Node("Background");
            btnNode.addChild(bgNode);
            const bgTransform = bgNode.addComponent(UITransform);
            bgTransform.contentSize.set(150, 50);
            const bgSprite = bgNode.addComponent(Sprite);
            bgSprite.color = new Color(80, 80, 200);

            const btn = btnNode.addComponent(Button);
            this._createLabel(btnNode, config.label, 16, new Color(255, 255, 255));
            buttons[config.name] = btn;
        }

        this._settlementPage = settlementNode.addComponent(SettlementPage);
        this._settlementPage!.titleLabel = titleLabel;
        this._settlementPage!.passLabel = passLabel;
        this._settlementPage!.arrivalRateLabel = arrivalRateLabel;
        this._settlementPage!.conflictCountLabel = conflictCountLabel;
        this._settlementPage!.errorSummaryLabel = errorSummaryLabel;
        this._settlementPage!.errorDetailContainer = errorDetailContainer;
        this._settlementPage!.failedFragmentsContainer = fragmentsContainer;
        this._settlementPage!.retryButton = buttons["retry"];
        this._settlementPage!.nextLevelButton = buttons["next"];
        this._settlementPage!.replayButton = buttons["replay"];
        this._settlementPage!.statisticsButton = buttons["stats"];
    }

    private _createStatisticsPage(parent: Node): void {
        const statsNode = new Node("StatisticsPage");
        parent.addChild(statsNode);
        statsNode.active = false;

        const transform = statsNode.addComponent(UITransform);
        transform.contentSize.set(900, 600);
        statsNode.setPosition(0, 0, 0);

        const title = this._createLabel(statsNode, "=== 数据统计 ===", 24, new Color(255, 255, 255));
        title.node.setPosition(0, 260, 0);

        const overallArrivalRateLabel = this._createLabel(statsNode, "", 20, new Color(0, 255, 0));
        overallArrivalRateLabel.node.setPosition(-300, 200, 0);

        const totalPlayCountLabel = this._createLabel(statsNode, "", 18, new Color(255, 255, 255));
        totalPlayCountLabel.node.setPosition(-300, 160, 0);

        const totalPassCountLabel = this._createLabel(statsNode, "", 18, new Color(255, 255, 255));
        totalPassCountLabel.node.setPosition(-300, 120, 0);

        const passRateLabel = this._createLabel(statsNode, "", 18, new Color(255, 255, 255));
        passRateLabel.node.setPosition(0, 200, 0);

        const avgConflictLabel = this._createLabel(statsNode, "", 18, new Color(255, 255, 255));
        avgConflictLabel.node.setPosition(0, 160, 0);

        const arrivalAccuracyLabel = this._createLabel(statsNode, "", 18, new Color(255, 255, 255));
        arrivalAccuracyLabel.node.setPosition(0, 120, 0);

        const levelStatsContainer = new Node("LevelStatsContainer");
        statsNode.addChild(levelStatsContainer);
        levelStatsContainer.setPosition(-250, -20, 0);
        const lscTransform = levelStatsContainer.addComponent(UITransform);
        lscTransform.contentSize.set(400, 200);

        const arrivalTrendContainer = new Node("ArrivalTrendContainer");
        statsNode.addChild(arrivalTrendContainer);
        arrivalTrendContainer.setPosition(250, -20, 0);
        const atcTransform = arrivalTrendContainer.addComponent(UITransform);
        atcTransform.contentSize.set(400, 200);

        const backBtnNode = new Node("BackButton");
        statsNode.addChild(backBtnNode);
        backBtnNode.setPosition(0, -240, 0);
        const backBtnTransform = backBtnNode.addComponent(UITransform);
        backBtnTransform.contentSize.set(150, 50);

        const bgNode = new Node("Background");
        backBtnNode.addChild(bgNode);
        const bgTransform = bgNode.addComponent(UITransform);
        bgTransform.contentSize.set(150, 50);
        const bgSprite = bgNode.addComponent(Sprite);
        bgSprite.color = new Color(100, 100, 100);

        const backButton = backBtnNode.addComponent(Button);
        this._createLabel(backBtnNode, "返回", 18, new Color(255, 255, 255));

        this._statisticsPage = statsNode.addComponent(StatisticsPage);
        this._statisticsPage!.overallArrivalRateLabel = overallArrivalRateLabel;
        this._statisticsPage!.totalPlayCountLabel = totalPlayCountLabel;
        this._statisticsPage!.totalPassCountLabel = totalPassCountLabel;
        this._statisticsPage!.passRateLabel = passRateLabel;
        this._statisticsPage!.avgConflictLabel = avgConflictLabel;
        this._statisticsPage!.arrivalAccuracyLabel = arrivalAccuracyLabel;
        this._statisticsPage!.levelStatsContainer = levelStatsContainer;
        this._statisticsPage!.arrivalTrendContainer = arrivalTrendContainer;
        this._statisticsPage!.backButton = backButton;
    }

    private _createLabel(parent: Node, text: string, fontSize: number, color: Color): Label {
        const node = new Node("Label");
        parent.addChild(node);
        const label = node.addComponent(Label);
        label.string = text;
        label.fontSize = fontSize;
        label.color = color;
        const transform = node.addComponent(UITransform);
        transform.contentSize.set(200, fontSize + 10);
        return label;
    }

    private _bindInteractions(): void {
        if (!this._gameManager || !this._appointmentSystem || !this._scoreManager || !this._replaySystem) return;

        if (this._calendarView) {
            this._calendarView.onSlotClick((e) => this._onSlotClick(e.stationIndex, e.time));
            this._calendarView.onSlotHover((e) => this._onSlotHover(e.stationIndex, e.time));
            this._calendarView.bindAppointmentSystem(this._appointmentSystem);
        }

        if (this._reminderList) {
            this._reminderList.onEntryClick((e) => this._onReminderEntryClick(e));
            this._reminderList.bindAppointmentSystem(this._appointmentSystem);
        }

        if (this._arrivalJudgment) {
            this._arrivalJudgment.onJudgment((e) => this._onArrivalJudgment(e.judgedStatus));
            this._arrivalJudgment.bindSystems(this._appointmentSystem, this._scoreManager, this._replaySystem);
        }

        if (this._settlementPage) {
            this._settlementPage.onRetry(() => this._retryLevel());
            this._settlementPage.onNextLevel(() => this._nextLevel());
            this._settlementPage.onReplay(() => this._replayLastFail());
            this._settlementPage.onStatistics(() => this._showStatistics());
        }

        if (this._statisticsPage) {
            this._statisticsPage.onBack(() => this._hideStatistics());
        }

        if (this._conflictHint) {
            this._conflictHint.onHintAcknowledge((c) => this._onHintAcknowledge(c));
        }

        this._appointmentSystem.conflictDetector.onConflictHint((conflict) => {
            this._conflictHint!.showConflictHint(conflict);
        });

        if (this._timerManager) {
            this._timerManager.onTick((remaining) => this._onTimerTick(remaining));
            this._timerManager.onWarning((remaining) => this._onTimerWarning(remaining));
            this._timerManager.onExpired(() => this._onTimerExpired());
        }
    }

    private _loadConfigsAndStart(): void {
        if (!this._configLoader || !this._levelManager) return;

        console.log("正在从 assets/resources/configs 加载配置...");

        this._configLoader.loadAll()
            .then(() => {
                console.log("✓ 配置文件加载成功");
                this._applyLoadedConfigs();
                console.log("配置加载完成，启动训练流程...");
                this._startFirstLevel();
            })
            .catch((err) => {
                console.warn(`✗ 配置文件加载失败，使用内置模拟配置: ${err}`);
                this._simulateConfigLoad(() => {
                    console.log("模拟配置加载完成，启动训练流程...");
                    this._startFirstLevel();
                });
            });
    }

    private _applyLoadedConfigs(): void {
        if (!this._configLoader || !this._levelManager) return;

        const levelsConfig = this._configLoader.getLevelsConfig();
        const scenariosConfig = this._configLoader.getScenariosConfig();
        const capacityRulesConfig = this._configLoader.getCapacityRulesConfig();
        const customersConfig = this._configLoader.getCustomersConfig();

        if (levelsConfig) {
            this._levelManager.loadLevelsConfig(levelsConfig);
            console.log(`  - 加载关卡配置: ${levelsConfig.levels.length} 个关卡`);
        }
        if (scenariosConfig) {
            this._levelManager.loadScenariosConfig(scenariosConfig);
            console.log(`  - 加载场景配置: ${scenariosConfig.scenarios.length} 个场景`);
        }
        if (capacityRulesConfig) {
            this._levelManager.loadCapacityRulesConfig(capacityRulesConfig);
            console.log(`  - 加载容量规则配置: ${capacityRulesConfig.capacityRules.length} 套规则`);
        }
        if (customersConfig) {
            this._levelManager.loadCustomersConfig(customersConfig);
            console.log(`  - 加载顾客配置: ${customersConfig.customers.length} 位顾客, ${customersConfig.services.length} 种服务`);
        }
    }

    private _simulateConfigLoad(callback: () => void): void {
        if (!this._configLoader || !this._levelManager) return;

        const levelsConfig = {
            levels: [
                {
                    id: "level_01",
                    name: "初级接待",
                    description: "基础时段安排训练",
                    difficulty: 1,
                    timeLimitSeconds: 120,
                    stationCount: 3,
                    customerIds: ["cust_001", "cust_002", "cust_003", "cust_004"],
                    passConditions: { minArrivalRate: 0.75, maxConflictCount: 0, maxOverbookCount: 0 },
                    capacityRuleId: "rule_basic",
                    scenarioId: "scenario_morning",
                    hintEnabled: true,
                    hintAdvanceSeconds: 5
                }
            ]
        };

        const capacityRulesConfig = {
            capacityRules: [
                {
                    id: "rule_basic",
                    name: "基础容量规则",
                    description: "每个工位同一时段只能服务1位顾客",
                    rules: [
                        { type: "station_capacity", maxConcurrentPerStation: 1, allowOverbook: false },
                        { type: "service_duration", defaultMinutes: 60, bufferMinutes: 10 },
                        { type: "arrival_window", lateThresholdMinutes: 15, noShowThresholdMinutes: 30 }
                    ]
                }
            ]
        };

        const customersConfig = {
            customers: [
                { id: "cust_001", name: "张小姐", phone: "138****1001", serviceId: "svc_haircut", preferredTime: "09:00", arrivalStatus: ArrivalStatus.ARRIVED, vip: false },
                { id: "cust_002", name: "李女士", phone: "139****2002", serviceId: "svc_color", preferredTime: "09:30", arrivalStatus: ArrivalStatus.ARRIVED, vip: true },
                { id: "cust_003", name: "王小姐", phone: "137****3003", serviceId: "svc_haircut", preferredTime: "10:00", arrivalStatus: ArrivalStatus.PENDING, vip: false },
                { id: "cust_004", name: "赵女士", phone: "136****4004", serviceId: "svc_permaline", preferredTime: "10:30", arrivalStatus: ArrivalStatus.PENDING, vip: false }
            ],
            services: [
                { id: "svc_haircut", name: "剪发", durationMinutes: 60, category: "hair" },
                { id: "svc_color", name: "染发", durationMinutes: 120, category: "hair" },
                { id: "svc_permaline", name: "烫发", durationMinutes: 120, category: "hair" }
            ]
        };

        const scenariosConfig = {
            scenarios: [
                {
                    id: "scenario_morning",
                    name: "早间营业",
                    timeRange: { start: "09:00", end: "12:00" },
                    slotIntervalMinutes: 30,
                    events: [
                        { time: "09:00", type: "shop_open", description: "门店开门" },
                        { time: "09:30", type: "customer_arrive", customerId: "cust_002", description: "李女士到店" },
                        { time: "09:45", type: "arrival_check", description: "检查10:00预约顾客到场" },
                        { time: "10:15", type: "arrival_check", description: "检查10:30预约顾客到场" }
                    ]
                }
            ]
        };

        this._levelManager.loadLevelsConfig(levelsConfig);
        this._levelManager.loadCapacityRulesConfig(capacityRulesConfig);
        this._levelManager.loadCustomersConfig(customersConfig);
        this._levelManager.loadScenariosConfig(scenariosConfig);

        setTimeout(callback, 500);
    }

    private _startFirstLevel(): void {
        if (!this._levelManager) return;
        const levels = this._levelManager.getAllLevels();
        if (levels.length > 0) {
            this._startLevel(levels[0].id);
        }
    }

    private _startLevel(levelId: string): void {
        this._currentLevelId = levelId;
        this._selectedCustomerId = "";
        this._settlementProcessed = false;

        if (this._replaySystem) {
            this._replaySystem.beginSession(levelId);
        }

        if (this._gameManager && this._gameManager.startLevel(levelId)) {
            console.log(`=== 关卡 ${levelId} 训练开始 ===`);
            this._refreshUI();
        }
    }

    private _refreshUI(): void {
        if (this._calendarView) this._calendarView.refresh();
        if (this._reminderList) this._reminderList.refresh();
        if (this._appointmentSystem) {
            const rate = this._appointmentSystem.calculateArrivalRate();
            if (this._arrivalRateLabel) {
                this._arrivalRateLabel.string = `到场率: ${(rate * 100).toFixed(1)}%`;
            }
        }
    }

    private _onSlotClick(stationIndex: number, time: string): void {
        if (!this._selectedCustomerId || !this._gameManager) return;

        const customer = this._appointmentSystem?.customers.get(this._selectedCustomerId);
        if (!customer) return;

        const success = this._gameManager.assignAppointment(this._selectedCustomerId, stationIndex, time);

        if (success) {
            if (this._replaySystem) {
                this._replaySystem.recordAction({
                    type: ReplayActionType.ASSIGN,
                    customerId: this._selectedCustomerId,
                    stationIndex,
                    time,
                    timestamp: Date.now(),
                    gameTime: this._gameManager.gameTime
                });
            }

            console.log(`✓ 已分配 ${customer.name} 到工位${stationIndex + 1} ${time}`);
            this._selectedCustomerId = "";
            if (this._selectedCustomerLabel) {
                this._selectedCustomerLabel.string = "未选择顾客";
            }
            this._refreshUI();
        } else {
            console.log(`✗ 分配失败: 工位${stationIndex + 1} ${time} 存在冲突`);
            if (this._conflictHint && this._appointmentSystem) {
                const conflicts = this._appointmentSystem.conflictDetector.checkAssignment(
                    stationIndex, time, customer, customer.serviceId, 60
                );
                for (const c of conflicts) {
                    this._conflictHint.showConflictHint(c);
                }

                if (this._replaySystem && conflicts.length > 0) {
                    this._replaySystem.recordAction({
                        type: ReplayActionType.CONFLICT_OCCURRED,
                        customerId: this._selectedCustomerId,
                        stationIndex,
                        time,
                        conflictMessage: conflicts.map(c => `${c.type}: ${c.message}`).join("; "),
                        timestamp: Date.now(),
                        gameTime: this._gameManager.gameTime
                    });
                }
            }
        }
    }

    private _onSlotHover(stationIndex: number, time: string): void {
        if (!this._selectedCustomerId || !this._appointmentSystem) return;

        const customer = this._appointmentSystem.customers.get(this._selectedCustomerId);
        if (!customer) return;

        const conflicts = this._appointmentSystem.predictConflictsForSlot(
            stationIndex, time, customer.serviceId
        );

        if (conflicts.length > 0 && this._conflictHint) {
            for (const c of conflicts) {
                this._conflictHint.showConflictHint(c);
            }
        }
    }

    private _onReminderEntryClick(entry: ReminderEntry): void {
        this._selectedCustomerId = entry.customerId;
        if (this._selectedCustomerLabel) {
            this._selectedCustomerLabel.string = `已选: ${entry.customerName}`;
        }
        console.log(`选择顾客: ${entry.customerName}`);
    }

    private _onArrivalJudgment(status: ArrivalStatus): void {
        if (!this._gameManager || !this._appointmentSystem) return;

        const pending = this._appointmentSystem.getUnassignedCustomers()
            .filter((c: any) => c.arrivalStatus === ArrivalStatus.PENDING);

        if (pending.length > 0) {
            const customer = pending[0];
            const correctStatus = customer.arrivalStatus;
            const isCorrect = correctStatus === status;

            if (this._replaySystem) {
                this._replaySystem.recordAction({
                    type: ReplayActionType.ARRIVAL_CHECK,
                    customerId: customer.id,
                    previousStatus: correctStatus,
                    newStatus: status,
                    isCorrect: isCorrect,
                    timestamp: Date.now(),
                    gameTime: this._gameManager.gameTime
                });
            }

            this._gameManager.judgeArrival(customer.id, status);
            console.log(`顾客 ${customer.name} 判定为: ${status}, 正确: ${isCorrect}`);

            this._refreshUI();
        }
    }

    private _onHintAcknowledge(conflict: ConflictInfo): void {
        if (this._calendarView) {
            this._calendarView.clearConflictHint(conflict.stationIndex, conflict.time);
        }
    }

    private _onPhaseChange(phase: GamePhase): void {
        console.log(`游戏阶段变更: ${phase}`);

        switch (phase) {
            case GamePhase.PLAYING:
                if (this._settlementPage) this._settlementPage.hide();
                if (this._statisticsPage) this._statisticsPage.hide();
                break;
            case GamePhase.CHECKING_ARRIVAL:
                this._triggerArrivalCheck();
                break;
            case GamePhase.SETTLING:
                this._showSettlement();
                break;
            case GamePhase.STATISTICS:
                if (this._statisticsPage && this._scoreManager) {
                    this._statisticsPage.show(this._scoreManager);
                }
                break;
        }
    }

    private _triggerArrivalCheck(): void {
        if (!this._appointmentSystem || !this._arrivalJudgment) return;

        const unassigned = this._appointmentSystem.getUnassignedCustomers();
        const pendingCustomers = unassigned.filter((c: any) => c.arrivalStatus === ArrivalStatus.PENDING);

        if (pendingCustomers.length > 0) {
            const customer = pendingCustomers[0];
            console.log(`限时到场判断: ${customer.name}`);
            this._arrivalJudgment.showJudgment(customer.id, 10);
        }
    }

    private _showSettlement(): void {
        if (!this._gameManager || !this._settlementPage || !this._failedFragmentStore) return;

        const record = this._gameManager.finishLevel();
        const session = this._replaySystem?.currentSession ?? null;

        if (!this._settlementProcessed) {
            this._settlementProcessed = true;

            if (this._replaySystem) {
                this._replaySystem.endSession(record.arrivalRate, record.passed);
                if (!record.passed && this._replaySystem.currentSession) {
                    this._failedFragmentStore.addFragment(this._replaySystem.currentSession);
                }
            }

            console.log(`=== 结算 ===`);
            console.log(`通过: ${record.passed}`);
            console.log(`到场率: ${(record.arrivalRate * 100).toFixed(1)}%`);
            console.log(`冲突次数: ${record.conflictCount}`);
            console.log(`错误数: ${record.errorCauses.length}`);
            for (const err of record.errorCauses) {
                console.log(`  - [${err.category}] ${err.description}`);
            }
            if (session) {
                const misjudges = session.actions.filter(a => a.type === ReplayActionType.ARRIVAL_CHECK && a.isCorrect === false);
                const conflicts = session.actions.filter(a => a.type === ReplayActionType.CONFLICT_OCCURRED);
                console.log(`到场误判: ${misjudges.length}项, 时段冲突: ${conflicts.length}项`);
            }
        }

        this._settlementPage.show(record, this._failedFragmentStore, session);
    }

    private _retryLevel(): void {
        this._startLevel(this._currentLevelId);
    }

    private _nextLevel(): void {
        if (!this._levelManager) return;
        const next = this._levelManager.getNextLevel(this._currentLevelId);
        if (next) {
            this._startLevel(next.id);
        }
    }

    private _replayLastFail(): void {
        if (!this._replaySystem || !this._failedFragmentStore) return;

        const fragments = this._failedFragmentStore.getRecentFragments(1);
        if (fragments.length > 0 && fragments[0].failedActions.length > 0) {
            console.log("开始回放失败片段...");
            const failedSession: any = {
                levelId: fragments[0].levelId,
                startTime: fragments[0].timestamp,
                actions: fragments[0].failedActions,
                finalArrivalRate: fragments[0].arrivalRate,
                passed: false
            };
            this._replaySystem.startPlayback(failedSession, 0.5);
        } else {
            console.log("没有可回放的失败片段");
        }
    }

    private _showStatistics(): void {
        if (this._gameManager) {
            this._gameManager.showStatistics();
        }
    }

    private _hideStatistics(): void {
        if (this._statisticsPage) this._statisticsPage.hide();
    }

    private _onTimerTick(remaining: number): void {
        if (this._timerDisplayLabel) {
            const minutes = Math.floor(remaining / 60);
            const seconds = Math.floor(remaining % 60);
            this._timerDisplayLabel.string = `剩余时间: ${minutes}:${seconds.toString().padStart(2, "0")}`;
        }
    }

    private _onTimerWarning(remaining: number): void {
        if (this._timerDisplayLabel) {
            this._timerDisplayLabel.color = new Color(255, 0, 0);
        }
        console.log(`⚠ 时间警告: 剩余 ${Math.ceil(remaining)} 秒`);
    }

    private _onTimerExpired(): void {
        console.log("⏰ 时间到！结算本关...");
        if (this._scoreManager) {
            this._scoreManager.recordTimeout();
        }
        if (this._gameManager) {
            this._gameManager.finishLevel();
        }
    }

    update(dt: number): void {
        if (this._gameManager) {
            this._gameManager.update(dt);
        }

        if (this._replaySystem && this._replaySystem.isPlaying) {
            this._replaySystem.updatePlayback(dt);
        }

        if (this._conflictHint) {
            this._conflictHint.update(dt);
        }

        if (this._arrivalJudgment) {
            this._arrivalJudgment.update(dt);
        }
    }
}
