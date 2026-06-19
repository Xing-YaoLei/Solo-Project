import { _decorator, Component, Node, Label, Sprite, Color, Vec3, find, UITransform, UIOpacity, tween, Tween, resources, SpriteFrame, instantiate, Prefab, director } from 'cc';
import { ConfigManager, LevelConfig, DiagnosisConfig, EventConfig, QuoteOption } from '../config/ILevelConfig';
import { GameController } from './GameController';
import { GamePhase } from './GameState';
import { VehicleProfile, VehicleInfo, DiagnosisRecord, EventRecord } from './VehicleProfile';
import { DraggableQuote } from '../components/DraggableQuote';
import { QuoteDropZone } from '../components/QuoteDropZone';
import { InspectionPhoto } from '../components/InspectionPhoto';
import { TimerTask } from '../components/TimerTask';
import { EmergencyEvent } from '../components/EmergencyEvent';
import { EventPopupUI } from '../components/EventPopupUI';
import { AnalyticsTracker } from '../managers/AnalyticsTracker';
import { DifficultyManager } from '../managers/DifficultyManager';
import { AchievementManager } from '../managers/AchievementManager';
import { ReviewPageComponent, ReviewStats, BottleneckData, DiagnosisBreakdown } from '../ui/ReviewPage';
import { SettlementComponent } from './Settlement';

const { ccclass, property } = _decorator;

const PLATE_PREFIXES = ['京', '沪', '粤', '苏', '浙', '鲁', '川', '鄂', '湘', '闽'];
const BRANDS = ['大众', '丰田', '本田', '奔驰', '宝马', '奥迪', '日产', '福特', '别克', '特斯拉'];
const MODELS: Record<string, string[]> = {
    '大众': ['帕萨特', '迈腾', '朗逸', '速腾'],
    '丰田': ['凯美瑞', '卡罗拉', 'RAV4', '汉兰达'],
    '本田': ['雅阁', '思域', 'CR-V', '飞度'],
    '奔驰': ['C级', 'E级', 'S级', 'GLC'],
    '宝马': ['3系', '5系', '7系', 'X5'],
    '奥迪': ['A4L', 'A6L', 'Q5L', 'Q7'],
    '日产': ['轩逸', '天籁', '奇骏', '逍客'],
    '福特': ['蒙迪欧', '福克斯', '锐界', '翼虎'],
    '别克': ['君威', '君越', '昂科威', '英朗'],
    '特斯拉': ['Model 3', 'Model Y', 'Model S', 'Model X'],
};
const SURNAMES = ['张', '王', '李', '赵', '刘', '陈', '杨', '黄', '周', '吴'];
const GIVEN_NAMES = ['伟', '芳', '娜', '敏', '静', '强', '磊', '军', '洋', '勇'];

@ccclass('LevelSceneController')
export class LevelSceneController extends Component {

    @property({ type: Node, tooltip: 'Tiled地图根' })
    mapRoot: Node | null = null;

    @property({ type: Node, tooltip: 'HUD层(计时显示、分数、准确率)' })
    hudRoot: Node | null = null;

    @property({ type: Label, tooltip: '计时显示文本' })
    timerLabel: Label | null = null;

    @property({ type: Label })
    scoreLabel: Label | null = null;

    @property({ type: Label })
    accuracyLabel: Label | null = null;

    @property({ type: Label, tooltip: '当前诊断描述' })
    diagnosisDescLabel: Label | null = null;

    @property({ type: Node, tooltip: '上一张按钮' })
    photoPrevBtn: Node | null = null;

    @property({ type: Node, tooltip: '下一张按钮' })
    photoNextBtn: Node | null = null;

    @property({ type: Label, tooltip: '照片索引 "1/3"' })
    photoIndexLabel: Label | null = null;

    @property({ type: Node, tooltip: '质检照片节点(挂InspectionPhoto组件)' })
    inspectionPhotoNode: Node | null = null;

    @property({ type: Node, tooltip: '报价单容器（所有报价单DraggableQuote父节点）' })
    quotesContainer: Node | null = null;

    @property({ type: Node, tooltip: '放置区节点(挂QuoteDropZone)' })
    quoteDropZoneNode: Node | null = null;

    @property({ type: Node, tooltip: '诊断选择Tab容器（每个Tab对应一个诊断）' })
    diagnosisTabBar: Node | null = null;

    @property({ type: Node, tooltip: '结算面板根' })
    settlementRoot: Node | null = null;

    @property({ type: SettlementComponent })
    settlementComponent: SettlementComponent | null = null;

    @property({ type: Node, tooltip: '复盘面板根' })
    reviewRoot: Node | null = null;

    @property({ type: ReviewPageComponent })
    reviewComponent: ReviewPageComponent | null = null;

    @property({ type: Node, tooltip: '事件弹窗根' })
    eventPopupRoot: Node | null = null;

    @property({ type: Node })
    pauseBtn: Node | null = null;

    private _gameController: GameController | null = null;
    private _timerTask: TimerTask | null = null;
    private _inspectionPhoto: InspectionPhoto | null = null;
    private _quoteDropZone: QuoteDropZone | null = null;
    private _vehicleProfile: VehicleProfile = new VehicleProfile();
    private _currentLevelId: string = '';
    private _currentDiagId: string = '';
    private _currentLevelConfig: LevelConfig | null = null;
    private _scaledTimeLimit: number = 0;
    private _diagnosisStartTime: number = 0;
    private _levelStartTime: number = 0;
    private _sessionId: string = '';
    private _tabNodes: Map<string, Node> = new Map();
    private _diagnosisConfigs: Map<string, DiagnosisConfig> = new Map();
    private _emergencyEvents: EmergencyEvent[] = [];

    async onLoad(): Promise<void> {
        const configMgr = ConfigManager.getInstance();
        if (!configMgr.isLoaded) {
            await configMgr.loadAllConfigs();
        }

        this._gameController = this.getComponent(GameController);
        if (!this._gameController) {
            this._gameController = this.addComponent(GameController);
        }

        if (this.inspectionPhotoNode) {
            this._inspectionPhoto = this.inspectionPhotoNode.getComponent(InspectionPhoto);
            if (!this._inspectionPhoto) {
                this._inspectionPhoto = this.inspectionPhotoNode.addComponent(InspectionPhoto);
            }
        }

        if (this.quoteDropZoneNode) {
            this._quoteDropZone = this.quoteDropZoneNode.getComponent(QuoteDropZone);
            if (!this._quoteDropZone) {
                this._quoteDropZone = this.quoteDropZoneNode.addComponent(QuoteDropZone);
            }
        }

        const timerNode = find('Canvas/TimerTaskNode') || new Node('TimerTaskNode');
        if (!timerNode.parent) {
            this.node.addChild(timerNode);
        }
        this._timerTask = timerNode.getComponent(TimerTask);
        if (!this._timerTask) {
            this._timerTask = timerNode.addComponent(TimerTask);
        }
        this._timerTask.node.on('timer-tick', this.onTimerTickHandler, this);
        this._timerTask.node.on('timer-expired', this.onTimerExpiredHandler, this);

        if (this.photoPrevBtn) {
            this.photoPrevBtn.on(Node.EventType.TOUCH_END, this.onPhotoPrev, this);
        }
        if (this.photoNextBtn) {
            this.photoNextBtn.on(Node.EventType.TOUCH_END, this.onPhotoNext, this);
        }
        if (this.pauseBtn) {
            this.pauseBtn.on(Node.EventType.TOUCH_END, this.onPauseBtn, this);
        }

        if (this.settlementRoot) {
            this.settlementRoot.active = false;
            const opacity = this.settlementRoot.getComponent(UIOpacity) || this.settlementRoot.addComponent(UIOpacity);
            opacity.opacity = 0;
        }
        if (this.settlementComponent) {
            this.settlementComponent.node.on('settlement-continue', this.showReview, this);
            this.settlementComponent.node.on('settlement-retry', this.restartLevel, this);
        }

        if (this.reviewRoot) {
            this.reviewRoot.active = false;
            const opacity = this.reviewRoot.getComponent(UIOpacity) || this.reviewRoot.addComponent(UIOpacity);
            opacity.opacity = 0;
        }
        if (this.reviewComponent) {
            this.reviewComponent.node.on('review-retry', this.restartLevel, this);
            this.reviewComponent.node.on('review-next', this.gotoNextLevel, this);
        }

        this._gameController.node.on('diagnosis-completed', this.onDiagnosisCompletedHandler, this);
        this._gameController.node.on('event-triggered', this.handleEventTriggered, this);
        this._gameController.node.on('level-completed', this.onLevelCompletedHandler, this);
        this._gameController.node.on('timer-expired', this.onGameTimerExpired, this);
        this._gameController.node.on('phase-changed', this.onPhaseChangedHandler, this);
    }

    onDestroy(): void {
        if (this._timerTask) {
            this._timerTask.node.off('timer-tick', this.onTimerTickHandler, this);
            this._timerTask.node.off('timer-expired', this.onTimerExpiredHandler, this);
        }
        if (this.photoPrevBtn) {
            this.photoPrevBtn.off(Node.EventType.TOUCH_END, this.onPhotoPrev, this);
        }
        if (this.photoNextBtn) {
            this.photoNextBtn.off(Node.EventType.TOUCH_END, this.onPhotoNext, this);
        }
        if (this.pauseBtn) {
            this.pauseBtn.off(Node.EventType.TOUCH_END, this.onPauseBtn, this);
        }
        if (this.settlementComponent) {
            this.settlementComponent.node.off('settlement-continue', this.showReview, this);
            this.settlementComponent.node.off('settlement-retry', this.restartLevel, this);
        }
        if (this.reviewComponent) {
            this.reviewComponent.node.off('review-retry', this.restartLevel, this);
            this.reviewComponent.node.off('review-next', this.gotoNextLevel, this);
        }
        if (this._gameController) {
            this._gameController.node.off('diagnosis-completed', this.onDiagnosisCompletedHandler, this);
            this._gameController.node.off('event-triggered', this.handleEventTriggered, this);
            this._gameController.node.off('level-completed', this.onLevelCompletedHandler, this);
            this._gameController.node.off('timer-expired', this.onGameTimerExpired, this);
            this._gameController.node.off('phase-changed', this.onPhaseChangedHandler, this);
        }
    }

    startLevel(levelId: string): void {
        const configMgr = ConfigManager.getInstance();
        const levelConfig = configMgr.getLevelConfig(levelId);
        if (!levelConfig) {
            console.error(`Level config not found: ${levelId}`);
            return;
        }

        this._currentLevelId = levelId;
        this._currentLevelConfig = levelConfig;

        const difficultyMgr = DifficultyManager.getInstance();
        const difficultyParams = difficultyMgr.getParamsForLevel(levelConfig.difficulty);
        this._scaledTimeLimit = levelConfig.timeLimit * difficultyParams.timeMultiplier;

        this._gameController!.startLevel(levelId);

        this._vehicleProfile = new VehicleProfile();
        this._vehicleProfile.setVehicleInfo(this._generateRandomVehicleInfo());

        if (this._timerTask) {
            this._timerTask.totalSeconds = this._scaledTimeLimit;
            this._timerTask.resetTimer();
            this._timerTask.startTimer();
        }

        this._diagnosisConfigs.clear();
        for (const diagId of levelConfig.diagnosisIds) {
            const diagConfig = configMgr.getDiagnosisConfig(diagId);
            if (diagConfig) {
                this._diagnosisConfigs.set(diagId, diagConfig);
                this._vehicleProfile.setInspectionPhotos(diagId, diagConfig.photoPaths);
            }
        }

        this._initDiagnosisTabBar();

        if (levelConfig.diagnosisIds.length > 0) {
            this.switchToDiagnosis(levelConfig.diagnosisIds[0]);
        }

        this._sessionId = `${levelId}_${Date.now()}`;
        const analytics = AnalyticsTracker.getInstance();
        analytics.startSession(this._sessionId, levelId);
        analytics.trackLevelStart(levelId);

        this._levelStartTime = Date.now();

        if (this.settlementRoot) {
            this.settlementRoot.active = false;
            const opacity = this.settlementRoot.getComponent(UIOpacity);
            if (opacity) opacity.opacity = 0;
        }
        if (this.reviewRoot) {
            this.reviewRoot.active = false;
            const opacity = this.reviewRoot.getComponent(UIOpacity);
            if (opacity) opacity.opacity = 0;
        }
    }

    switchToDiagnosis(diagId: string): void {
        const diagConfig = this._diagnosisConfigs.get(diagId);
        if (!diagConfig) {
            console.error(`Diagnosis config not found: ${diagId}`);
            return;
        }

        this._currentDiagId = diagId;
        this._diagnosisStartTime = Date.now();

        if (this.diagnosisDescLabel) {
            this.diagnosisDescLabel.string = diagConfig.description;
        }

        if (this._inspectionPhoto) {
            this._inspectionPhoto.loadPhotos(diagConfig.photoPaths);
        }

        this._updatePhotoIndexLabel();

        this.createQuoteNodes(diagId, diagConfig.quoteOptions);

        if (this._quoteDropZone) {
            this._quoteDropZone.acceptedQuoteIds = [diagConfig.correctQuoteId];
        }

        this._highlightCurrentTab(diagId);
    }

    completeDiagnosis(diagId: string, selectedQuoteId: string): void {
        const diagConfig = this._diagnosisConfigs.get(diagId);
        if (!diagConfig) return;

        const isCorrect = selectedQuoteId === diagConfig.correctQuoteId;
        const timestamp = Date.now();
        const timeSpent = (timestamp - this._diagnosisStartTime) / 1000;

        const record: DiagnosisRecord = {
            diagId,
            diagDescription: diagConfig.description,
            selectedQuoteId,
            isCorrect,
            timestamp,
            reworkRisk: diagConfig.reworkRisk,
        };
        this._vehicleProfile.addDiagnosisRecord(record);

        this._updateTabVisualState(diagId, isCorrect);

        const analytics = AnalyticsTracker.getInstance();
        analytics.trackDiagnosisAttempt(diagId, selectedQuoteId, isCorrect, timeSpent);
        if (!isCorrect) {
            analytics.trackBottleneck(diagId, timeSpent, 'wrong_diagnosis');
        }

        this._gameController!.completeDiagnosis(diagId, selectedQuoteId);
    }

    createQuoteNodes(diagId: string, quoteOptions: QuoteOption[]): void {
        if (!this.quotesContainer) return;

        this.quotesContainer.removeAllChildren();

        const spacing = 10;
        const itemWidth = 180;
        const itemHeight = 80;
        const startX = -((quoteOptions.length - 1) * (itemWidth + spacing)) / 2;

        for (let i = 0; i < quoteOptions.length; i++) {
            const option = quoteOptions[i];
            const quoteNode = this._createSingleQuoteNode(option);
            quoteNode.setPosition(startX + i * (itemWidth + spacing), 0, 0);
            this.quotesContainer.addChild(quoteNode);

            const draggable = quoteNode.getComponent(DraggableQuote);
            if (draggable) {
                draggable.setQuoteData(option);
                quoteNode.on('quote-dropped', (data: { quoteId: string; targetZoneId: string }) => {
                    this.completeDiagnosis(diagId, data.quoteId);
                }, this);
            }
        }
    }

    onPhotoPrev(): void {
        if (this._inspectionPhoto) {
            this._inspectionPhoto.showPreviousPhoto();
            this._updatePhotoIndexLabel();
        }
    }

    onPhotoNext(): void {
        if (this._inspectionPhoto) {
            this._inspectionPhoto.showNextPhoto();
            this._updatePhotoIndexLabel();
        }
    }

    updateHUD(): void {
        if (!this._gameController) return;
        const playerState = this._gameController.playerState;

        if (this.timerLabel) {
            const remaining = this._timerTask ? this._timerTask.getRemaining() : playerState.timerRemaining;
            this.timerLabel.string = this._formatTime(remaining);
            if (remaining < 30) {
                this.timerLabel.color = new Color(255, 80, 80, 255);
            } else {
                this.timerLabel.color = Color.WHITE;
            }
        }

        if (this.scoreLabel) {
            this.scoreLabel.string = `分数: ${playerState.score}`;
        }

        if (this.accuracyLabel) {
            this.accuracyLabel.string = `准确率: ${Math.round(playerState.accuracy * 100)}%`;
        }
    }

    update(dt: number): void {
        if (this._timerTask) {
            this._timerTask.update(dt);
        }
        if (this._gameController) {
            this._gameController.update(dt);
        }
        for (const evt of this._emergencyEvents) {
            evt.update(dt);
        }
        this.updateHUD();
    }

    onTimerTickHandler(data: { elapsed: number; remaining: number; progress: number }): void {
        if (this._gameController && this._gameController.playerState) {
            this._gameController.playerState.timerRemaining = data.remaining;
        }
    }

    onTimerExpiredHandler(): void {
        const analytics = AnalyticsTracker.getInstance();
        analytics.trackTimerExpired(this._currentLevelId);
    }

    onGameTimerExpired(): void {
        this.onTimerExpiredHandler();
    }

    onDiagnosisCompletedHandler(diagId: string, correct: boolean): void {
        this.scheduleOnce(() => {
            if (!this._currentLevelConfig) return;

            const remainingDiags = this._currentLevelConfig.diagnosisIds.filter(
                id => !this._gameController!.playerState.completedDiagnoses.has(id)
            );

            if (remainingDiags.length > 0) {
                this.switchToDiagnosis(remainingDiags[0]);
            }
        }, 0.1);
    }

    onLevelCompletedHandler(finalScore: number): void {
        if (this._timerTask) {
            this._timerTask.pauseTimer();
        }

        const timeUsed = (Date.now() - this._levelStartTime) / 1000;
        const accuracy = this._gameController ? this._gameController.playerState.accuracy : 0;

        const analytics = AnalyticsTracker.getInstance();
        analytics.trackLevelComplete(this._currentLevelId, finalScore, accuracy);

        if (this.settlementRoot && this.settlementComponent) {
            this.settlementRoot.active = true;
            const opacity = this.settlementRoot.getComponent(UIOpacity) || this.settlementRoot.addComponent(UIOpacity);
            opacity.opacity = 0;
            tween(opacity)
                .to(0.5, { opacity: 255 })
                .start();

            this.settlementComponent.showSettlement(this._vehicleProfile, finalScore, timeUsed);
        }
    }

    showReview(): void {
        if (!this._gameController) return;

        const timeUsed = (Date.now() - this._levelStartTime) / 1000;
        const diagnosisRecords = this._vehicleProfile.diagnosisRecords;
        const diagnosisCount = diagnosisRecords.length > 0 ? diagnosisRecords.length : 1;

        const diagTimeMap: Record<string, number> = {};
        for (let i = 0; i < diagnosisRecords.length; i++) {
            const prev = i > 0 ? diagnosisRecords[i - 1].timestamp : this._levelStartTime;
            diagTimeMap[diagnosisRecords[i].diagId] = (diagnosisRecords[i].timestamp - prev) / 1000;
        }

        const playerBottlenecks: BottleneckData[] = diagnosisRecords
            .filter(r => !r.isCorrect)
            .map(r => ({
                diagId: r.diagId,
                timeSpent: diagTimeMap[r.diagId] || 0,
                retryCount: 1,
                errorType: 'wrong_quote_selection',
            }));

        const allSorted = [...diagnosisRecords]
            .map(r => ({
                diagId: r.diagId,
                timeSpent: diagTimeMap[r.diagId] || 0,
                retryCount: r.isCorrect ? 0 : 1,
                errorType: r.isCorrect ? '' : 'wrong_quote_selection',
                isCorrect: r.isCorrect,
            }))
            .sort((a, b) => {
                if (a.isCorrect !== b.isCorrect) return a.isCorrect ? 1 : -1;
                return b.timeSpent - a.timeSpent;
            });

        for (const item of allSorted) {
            if (playerBottlenecks.length >= 3) break;
            if (!playerBottlenecks.find(b => b.diagId === item.diagId) && !item.isCorrect) {
                playerBottlenecks.push({
                    diagId: item.diagId,
                    timeSpent: item.timeSpent,
                    retryCount: item.retryCount,
                    errorType: item.errorType,
                });
            }
        }

        const diagnosisBreakdown: DiagnosisBreakdown[] = diagnosisRecords.map(r => ({
            diagId: r.diagId,
            isCorrect: r.isCorrect,
            timeSpent: diagTimeMap[r.diagId] || 0,
            selectedQuoteId: r.selectedQuoteId,
            reworkRisk: r.reworkRisk,
        }));

        const stats: ReviewStats = {
            reworkRate: this._vehicleProfile.getReworkRate(),
            totalTime: timeUsed,
            averageDiagnosisTime: timeUsed / diagnosisCount,
            playerBottlenecks,
            diagnosisBreakdown,
        };

        if (this.reviewComponent) {
            this.reviewComponent.showReview(stats);
        }

        if (this.reviewRoot) {
            this.reviewRoot.active = true;
            const opacity = this.reviewRoot.getComponent(UIOpacity) || this.reviewRoot.addComponent(UIOpacity);
            opacity.opacity = 0;
            tween(opacity)
                .to(0.5, { opacity: 255 })
                .start();
        }

        const achievementMgr = AchievementManager.getInstance();
        const correctCount = diagnosisRecords.filter(r => r.isCorrect).length;
        const accuracy = this._gameController ? this._gameController.playerState.accuracy : 0;
        achievementMgr.checkAchievements({
            accuracy,
            timeUsed,
            streak: correctCount,
            totalCompleted: 1,
            reworkCount: this._vehicleProfile.reworkCount,
        });

        const analytics = AnalyticsTracker.getInstance();
        analytics.endSession();
    }

    restartLevel(): void {
        this._tabNodes.clear();
        this._emergencyEvents = [];
        if (this.diagnosisTabBar) {
            this.diagnosisTabBar.removeAllChildren();
        }
        this.startLevel(this._currentLevelId);
    }

    gotoNextLevel(): void {
        const configMgr = ConfigManager.getInstance();
        const allLevelIds = configMgr.getAllLevelIds();
        const currentIndex = allLevelIds.indexOf(this._currentLevelId);

        if (currentIndex >= 0 && currentIndex < allLevelIds.length - 1) {
            this._tabNodes.clear();
            this._emergencyEvents = [];
            if (this.diagnosisTabBar) {
                this.diagnosisTabBar.removeAllChildren();
            }
            this.startLevel(allLevelIds[currentIndex + 1]);
        } else {
            console.log('No more levels available');
        }
    }

    handleEventTriggered(eventId: string, eventConfig: EventConfig): void {
        if (!this.eventPopupRoot) return;

        const analytics = AnalyticsTracker.getInstance();
        analytics.trackEventTriggered(eventId, eventConfig.type);

        const eventNode = new Node(`EmergencyEvent_${eventId}`);
        this.eventPopupRoot.addChild(eventNode);

        const emergencyEvent = eventNode.addComponent(EmergencyEvent);
        emergencyEvent.bindEvent(eventId);
        if (this._gameController) {
            emergencyEvent.setPlayerState(this._gameController.playerState);
        }

        const startTime = Date.now();
        emergencyEvent.node.on('event-resolution-selected', (data: { eventId: string; resolutionId: string; cost: number; timePenalty: number }) => {
            const timeToResolve = (Date.now() - startTime) / 1000;
            analytics.trackEventResolved(data.eventId, data.resolutionId, timeToResolve);

            const record: EventRecord = {
                eventId: data.eventId,
                eventType: eventConfig.type,
                resolutionId: data.resolutionId,
                cost: data.cost,
                timePenalty: data.timePenalty,
                timestamp: Date.now(),
            };
            this._vehicleProfile.addEventRecord(record);

            if (this._gameController) {
                this._gameController.handleEvent(data.eventId, data.resolutionId);
            }

            const idx = this._emergencyEvents.indexOf(emergencyEvent);
            if (idx !== -1) {
                this._emergencyEvents.splice(idx, 1);
            }
        }, this);

        emergencyEvent.trigger();
        this._emergencyEvents.push(emergencyEvent);
    }

    onPauseBtn(): void {
        if (!this._gameController) return;
        if (this._gameController.currentPhase === GamePhase.PLAYING) {
            this._gameController.pauseGame();
            if (this._timerTask) this._timerTask.pauseTimer();
        } else if (this._gameController.currentPhase === GamePhase.PAUSED) {
            this._gameController.resumeGame();
            if (this._timerTask) this._timerTask.resumeTimer();
        }
    }

    onPhaseChangedHandler(newPhase: GamePhase, prevPhase: GamePhase): void {
    }

    private _initDiagnosisTabBar(): void {
        if (!this.diagnosisTabBar || !this._currentLevelConfig) return;

        this.diagnosisTabBar.removeAllChildren();
        this._tabNodes.clear();

        const diagIds = this._currentLevelConfig.diagnosisIds;
        const tabWidth = 100;
        const tabHeight = 50;
        const spacing = 8;
        const startX = -((diagIds.length - 1) * (tabWidth + spacing)) / 2;

        for (let i = 0; i < diagIds.length; i++) {
            const diagId = diagIds[i];
            const tabNode = this._createTabNode(diagId, i + 1, tabWidth, tabHeight);
            tabNode.setPosition(startX + i * (tabWidth + spacing), 0, 0);
            this.diagnosisTabBar.addChild(tabNode);
            this._tabNodes.set(diagId, tabNode);

            tabNode.on(Node.EventType.TOUCH_END, () => {
                if (!this._gameController) return;
                if (!this._gameController.playerState.completedDiagnoses.has(diagId)) {
                    this.switchToDiagnosis(diagId);
                }
            }, this);
        }
    }

    private _createTabNode(diagId: string, index: number, width: number, height: number): Node {
        const node = new Node(`Tab_${diagId}`);
        const uiTransform = node.addComponent(UITransform);
        uiTransform.setContentSize(width, height);

        const sprite = node.addComponent(Sprite);
        sprite.sizeMode = Sprite.SizeMode.CUSTOM;
        sprite.color = new Color(100, 100, 100, 255);

        const labelNode = new Node('Label');
        node.addChild(labelNode);
        const labelUiTransform = labelNode.addComponent(UITransform);
        labelUiTransform.setContentSize(width - 10, height - 10);
        const label = labelNode.addComponent(Label);
        label.string = `诊断${index}`;
        label.fontSize = 20;
        label.color = Color.WHITE;
        label.horizontalAlign = Label.HorizontalAlign.CENTER;
        label.verticalAlign = Label.VerticalAlign.CENTER;

        return node;
    }

    private _highlightCurrentTab(diagId: string): void {
        for (const [id, node] of this._tabNodes.entries()) {
            const sprite = node.getComponent(Sprite);
            const label = node.getComponentInChildren(Label);
            if (id === diagId) {
                if (sprite) sprite.color = new Color(80, 140, 255, 255);
            } else {
                if (sprite && !node.name.startsWith('Tab_done_')) {
                    sprite.color = new Color(100, 100, 100, 255);
                }
            }
        }
    }

    private _updateTabVisualState(diagId: string, isCorrect: boolean): void {
        const tabNode = this._tabNodes.get(diagId);
        if (!tabNode) return;

        tabNode.name = `Tab_done_${diagId}`;
        const sprite = tabNode.getComponent(Sprite);
        const label = tabNode.getComponentInChildren(Label);

        if (sprite) {
            sprite.color = isCorrect ? new Color(80, 200, 80, 255) : new Color(200, 80, 80, 255);
        }
        if (label) {
            const mark = isCorrect ? '✓' : '✗';
            const baseText = label.string.replace(/ [✓✗]$/, '');
            label.string = `${baseText} ${mark}`;
        }
    }

    private _createSingleQuoteNode(option: QuoteOption): Node {
        const node = new Node(`Quote_${option.id}`);
        const uiTransform = node.addComponent(UITransform);
        uiTransform.setContentSize(180, 80);

        const sprite = node.addComponent(Sprite);
        sprite.sizeMode = Sprite.SizeMode.CUSTOM;
        sprite.color = new Color(240, 240, 240, 255);

        const nameLabelNode = new Node('NameLabel');
        node.addChild(nameLabelNode);
        const nameUiTransform = nameLabelNode.addComponent(UITransform);
        nameUiTransform.setContentSize(160, 30);
        nameLabelNode.setPosition(0, 15, 0);
        const nameLabel = nameLabelNode.addComponent(Label);
        nameLabel.string = option.name;
        nameLabel.fontSize = 18;
        nameLabel.color = new Color(50, 50, 50, 255);
        nameLabel.horizontalAlign = Label.HorizontalAlign.CENTER;
        nameLabel.verticalAlign = Label.VerticalAlign.CENTER;

        const priceLabelNode = new Node('PriceLabel');
        node.addChild(priceLabelNode);
        const priceUiTransform = priceLabelNode.addComponent(UITransform);
        priceUiTransform.setContentSize(160, 30);
        priceLabelNode.setPosition(0, -15, 0);
        const priceLabel = priceLabelNode.addComponent(Label);
        priceLabel.string = `¥${option.price.toFixed(0)}`;
        priceLabel.fontSize = 20;
        priceLabel.color = new Color(200, 80, 60, 255);
        priceLabel.horizontalAlign = Label.HorizontalAlign.CENTER;
        priceLabel.verticalAlign = Label.VerticalAlign.CENTER;

        node.addComponent(DraggableQuote);

        return node;
    }

    private _updatePhotoIndexLabel(): void {
        if (!this.photoIndexLabel || !this._inspectionPhoto) return;
        const current = this._inspectionPhoto.getCurrentPhotoIndex() + 1;
        const total = this._inspectionPhoto.getPhotoCount();
        this.photoIndexLabel.string = total > 0 ? `${current}/${total}` : '0/0';
    }

    private _generateRandomVehicleInfo(): VehicleInfo {
        const prefix = PLATE_PREFIXES[Math.floor(Math.random() * PLATE_PREFIXES.length)];
        const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
        let plateNumber = prefix;
        for (let i = 0; i < 6; i++) {
            if (i === 0) {
                plateNumber += letters[Math.floor(Math.random() * letters.length)];
            } else {
                plateNumber += Math.floor(Math.random() * 10).toString();
            }
        }

        const brand = BRANDS[Math.floor(Math.random() * BRANDS.length)];
        const modelList = MODELS[brand] || ['未知车型'];
        const model = modelList[Math.floor(Math.random() * modelList.length)];
        const year = 2015 + Math.floor(Math.random() * 10);
        const mileage = 5000 + Math.floor(Math.random() * 200000);

        const surname = SURNAMES[Math.floor(Math.random() * SURNAMES.length)];
        const givenName = GIVEN_NAMES[Math.floor(Math.random() * GIVEN_NAMES.length)];
        const ownerName = surname + givenName;

        let ownerPhone = '1';
        const secondDigit = ['3', '5', '7', '8', '9'][Math.floor(Math.random() * 5)];
        ownerPhone += secondDigit;
        for (let i = 0; i < 9; i++) {
            ownerPhone += Math.floor(Math.random() * 10).toString();
        }

        return {
            plateNumber,
            brand,
            model,
            year,
            mileage,
            ownerName,
            ownerPhone,
        };
    }

    private _formatTime(seconds: number): string {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
}
