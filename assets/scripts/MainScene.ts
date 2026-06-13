import { _decorator, Component, Node, director, resources, JsonAsset, Label, Button, ScrollView, Prefab, instantiate, Color, Vec3, UITransform, Layout, Widget } from "cc";
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
import { ArrivalStatus } from "./appointment/Customer";
import { ConflictInfo } from "./appointment/ConflictDetector";
import { ReplayActionType } from "./replay/ReplayTypes";
import { LevelConfig } from "./game/LevelConfig";

const { ccclass, property } = _decorator;

@ccclass("MainScene")
export class MainScene extends Component {
    @property(GameManager)
    gameManager: GameManager | null = null;

    @property(AppointmentSystem)
    appointmentSystem: AppointmentSystem | null = null;

    @property(LevelManager)
    levelManager: LevelManager | null = null;

    @property(TimerManager)
    timerManager: TimerManager | null = null;

    @property(ScoreManager)
    scoreManager: ScoreManager | null = null;

    @property(ReplaySystem)
    replaySystem: ReplaySystem | null = null;

    @property(FailedFragmentStore)
    failedFragmentStore: FailedFragmentStore | null = null;

    @property(CalendarView)
    calendarView: CalendarView | null = null;

    @property(ReminderList)
    reminderList: ReminderList | null = null;

    @property(ArrivalJudgment)
    arrivalJudgment: ArrivalJudgment | null = null;

    @property(SettlementPage)
    settlementPage: SettlementPage | null = null;

    @property(StatisticsPage)
    statisticsPage: StatisticsPage | null = null;

    @property(ConflictHint)
    conflictHint: ConflictHint | null = null;

    @property(ConfigLoader)
    configLoader: ConfigLoader | null = null;

    private _selectedCustomer: string = "";
    private _currentLevelId: string = "";

    onLoad(): void {
        this._initSystems();
        this._bindUI();
        this._loadConfigs();
    }

    private _initSystems(): void {
        if (this.gameManager && this.appointmentSystem && this.levelManager && this.timerManager && this.scoreManager) {
            this.gameManager.initialize(this.appointmentSystem, this.levelManager, this.timerManager, this.scoreManager);
        }

        if (this.gameManager) {
            this.gameManager.onPhaseChange(this._onPhaseChange.bind(this));
        }
    }

    private _bindUI(): void {
        if (this.calendarView) {
            this.calendarView.onSlotClick(this._onCalendarSlotClick.bind(this));
            this.calendarView.onSlotHover(this._onCalendarSlotHover.bind(this));
        }

        if (this.reminderList) {
            this.reminderList.onEntryClick(this._onReminderEntryClick.bind(this));
        }

        if (this.arrivalJudgment) {
            this.arrivalJudgment.onJudgment(this._onArrivalJudgment.bind(this));
        }

        if (this.settlementPage) {
            this.settlementPage.onRetry(this._onRetry.bind(this));
            this.settlementPage.onNextLevel(this._onNextLevel.bind(this));
            this.settlementPage.onReplay(this._onReplay.bind(this));
            this.settlementPage.onStatistics(this._onShowStatistics.bind(this));
        }

        if (this.statisticsPage) {
            this.statisticsPage.onBack(this._onBackFromStatistics.bind(this));
        }

        if (this.conflictHint) {
            this.conflictHint.onHintAcknowledge(this._onHintAcknowledge.bind(this));
        }

        if (this.appointmentSystem && this.conflictHint) {
            this.appointmentSystem.conflictDetector.onConflictHint((conflict: ConflictInfo) => {
                this.conflictHint!.showConflictHint(conflict);
            });
        }
    }

    private _loadConfigs(): void {
        if (!this.configLoader || !this.levelManager) return;

        this.configLoader.loadAll().then(() => {
            const levelsConfig = this.configLoader!.getLevelsConfig();
            const scenariosConfig = this.configLoader!.getScenariosConfig();
            const capacityRulesConfig = this.configLoader!.getCapacityRulesConfig();
            const customersConfig = this.configLoader!.getCustomersConfig();

            if (levelsConfig) this.levelManager!.loadLevelsConfig(levelsConfig);
            if (scenariosConfig) this.levelManager!.loadScenariosConfig(scenariosConfig);
            if (capacityRulesConfig) this.levelManager!.loadCapacityRulesConfig(capacityRulesConfig);
            if (customersConfig) this.levelManager!.loadCustomersConfig(customersConfig);

            this._startFirstLevel();
        }).catch((err: Error) => {
            console.error("配置加载失败:", err);
        });
    }

    private _startFirstLevel(): void {
        if (!this.levelManager) return;
        const levels = this.levelManager.getAllLevels();
        if (levels.length > 0) {
            this._startLevel(levels[0].id);
        }
    }

    private _startLevel(levelId: string): void {
        this._currentLevelId = levelId;

        if (this.replaySystem) {
            this.replaySystem.beginSession(levelId);
        }

        if (this.gameManager && this.gameManager.startLevel(levelId)) {
            if (this.calendarView && this.appointmentSystem) {
                this.calendarView.bindAppointmentSystem(this.appointmentSystem);
            }
            if (this.reminderList && this.appointmentSystem) {
                this.reminderList.bindAppointmentSystem(this.appointmentSystem);
            }
            if (this.arrivalJudgment && this.appointmentSystem && this.scoreManager && this.replaySystem) {
                this.arrivalJudgment.bindSystems(this.appointmentSystem, this.scoreManager, this.replaySystem);
            }
        }
    }

    private _onPhaseChange(phase: GamePhase): void {
        switch (phase) {
            case GamePhase.PLAYING:
                if (this.settlementPage) this.settlementPage.hide();
                if (this.statisticsPage) this.statisticsPage.hide();
                break;
            case GamePhase.CHECKING_ARRIVAL:
                this._handleArrivalCheck();
                break;
            case GamePhase.SETTLING:
                this._handleSettling();
                break;
            case GamePhase.STATISTICS:
                this._handleStatistics();
                break;
        }
    }

    private _handleArrivalCheck(): void {
        if (!this.appointmentSystem || !this.arrivalJudgment || !this.levelManager) return;

        const unassigned = this.appointmentSystem.getUnassignedCustomers();
        const pendingCustomers = unassigned.filter((c: any) => c.arrivalStatus === ArrivalStatus.PENDING);

        if (pendingCustomers.length > 0) {
            const customer = pendingCustomers[0];
            const level = this.levelManager.currentLevel;
            const timeLimit = level ? 10 : 10;
            this.arrivalJudgment.showJudgment(customer.id, timeLimit);
        }
    }

    private _handleSettling(): void {
        if (!this.gameManager || !this.settlementPage || !this.failedFragmentStore) return;

        const record = this.gameManager.finishLevel();

        if (this.replaySystem) {
            this.replaySystem.endSession(record.arrivalRate, record.passed);
            this.failedFragmentStore.addFragment(this.replaySystem.currentSession!);
        }

        this.settlementPage.show(record, this.failedFragmentStore);
    }

    private _handleStatistics(): void {
        if (!this.scoreManager || !this.statisticsPage) return;
        this.statisticsPage.show(this.scoreManager);
    }

    private _onCalendarSlotClick(event: CalendarSlotClickEvent): void {
        if (!this._selectedCustomer || !this.gameManager) return;

        const success = this.gameManager.assignAppointment(
            this._selectedCustomer,
            event.stationIndex,
            event.time
        );

        if (success) {
            if (this.replaySystem) {
                this.replaySystem.recordAction({
                    type: ReplayActionType.ASSIGN,
                    customerId: this._selectedCustomer,
                    stationIndex: event.stationIndex,
                    time: event.time,
                    timestamp: Date.now(),
                    gameTime: this.gameManager.gameTime
                });
            }

            this._selectedCustomer = "";

            if (this.calendarView) this.calendarView.refresh();
            if (this.reminderList) this.reminderList.refresh();
        } else {
            if (this.conflictHint) {
                const conflicts = this.appointmentSystem?.conflictDetector.checkAssignment(
                    event.stationIndex, event.time,
                    this.appointmentSystem.customers.get(this._selectedCustomer)!,
                    "",
                    60
                ) ?? [];
                for (const c of conflicts) {
                    this.conflictHint.showConflictHint(c);
                }
            }
        }
    }

    private _onCalendarSlotHover(event: CalendarSlotClickEvent): void {
        if (!this._selectedCustomer || !this.appointmentSystem) return;

        const customer = this.appointmentSystem.customers.get(this._selectedCustomer);
        if (!customer) return;

        const conflicts = this.appointmentSystem.predictConflictsForSlot(
            event.stationIndex, event.time, customer.serviceId
        );

        if (conflicts.length > 0 && this.conflictHint) {
            for (const c of conflicts) {
                this.conflictHint.showConflictHint(c);
            }
        }
    }

    private _onReminderEntryClick(entry: ReminderEntry): void {
        this._selectedCustomer = entry.customerId;
    }

    private _onArrivalJudgment(event: ArrivalJudgmentEvent): void {
        if (this.reminderList) this.reminderList.refresh();
    }

    private _onHintAcknowledge(conflict: ConflictInfo): void {
        if (this.calendarView) {
            this.calendarView.clearConflictHint(conflict.stationIndex, conflict.time);
        }
    }

    private _onRetry(): void {
        this._startLevel(this._currentLevelId);
    }

    private _onNextLevel(): void {
        if (!this.levelManager) return;
        const next = this.levelManager.getNextLevel(this._currentLevelId);
        if (next) {
            this._startLevel(next.id);
        }
    }

    private _onReplay(): void {
        if (!this.replaySystem || !this.failedFragmentStore) return;

        const fragments = this.failedFragmentStore.getRecentFragments(1);
        if (fragments.length > 0 && fragments[0].failedActions.length > 0) {
            const failedSession: any = {
                levelId: fragments[0].levelId,
                startTime: fragments[0].timestamp,
                actions: fragments[0].failedActions,
                finalArrivalRate: fragments[0].arrivalRate,
                passed: false
            };
            this.replaySystem.startPlayback(failedSession);
        }
    }

    private _onShowStatistics(): void {
        if (this.gameManager) {
            this.gameManager.showStatistics();
        }
    }

    private _onBackFromStatistics(): void {
        if (this.statisticsPage) this.statisticsPage.hide();
    }

    update(dt: number): void {
        if (this.gameManager) {
            this.gameManager.update(dt);
        }

        if (this.replaySystem && this.replaySystem.isPlaying) {
            this.replaySystem.updatePlayback(dt);
        }

        if (this.conflictHint) {
            this.conflictHint.update(dt);
        }
    }
}
