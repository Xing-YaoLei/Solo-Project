import { _decorator, Component, Node, Label, Sprite, Color, Vec3, UITransform, tween } from "cc";
import { GameManager, GameState } from "../managers/GameManager";
import { LevelConfig } from "../models/Config";
import { RoomCalendar } from "../components/RoomCalendar";
import { OrderPanel } from "../components/OrderCard";
import { TaskPanel } from "../ui/TaskPanel";
import { ConflictDialog } from "../ui/ConflictDialog";
import { SettlementPanel } from "../ui/SettlementPanel";
import { ReviewPanel } from "../ui/SettlementPanel";
import { TutorialManager } from "../ui/TutorialOverlay";
import { ConflictManager } from "../managers/ConflictManager";
import { AchievementManager } from "../managers/AchievementManager";
import { AudioManager } from "../utils/AudioManager";
import { VibrationManager } from "../utils/VibrationManager";
import { Order, OrderStatus } from "../models/Order";
import { Task, TaskStatus } from "../models/Task";
import { RoomStatus } from "../models/Room";

const { ccclass, property } = _decorator;

@ccclass("HUD")
export class HUD extends Component {
    private dayLabel: Label | null = null;
    private revenueLabel: Label | null = null;
    private penaltyLabel: Label | null = null;
    private occupancyLabel: Label | null = null;
    private pauseBtn: Node | null = null;
    private settingsBtn: Node | null = null;

    public init(): void {
        this.dayLabel = this.findLabel("day");
        this.revenueLabel = this.findLabel("revenue");
        this.penaltyLabel = this.findLabel("penalty");
        this.occupancyLabel = this.findLabel("occupancy");
        this.pauseBtn = this.node.getChildByName("pauseBtn");
        this.settingsBtn = this.node.getChildByName("settingsBtn");
    }

    private findLabel(name: string): Label | null {
        const node = this.node.getChildByName(name);
        return node ? node.getComponent(Label) : null;
    }

    update(dt: number): void {
        const gm = GameManager.instance;
        if (!gm || gm.getCurrentState() !== GameState.PLAYING) return;

        const level = gm.getCurrentLevel();
        if (!level) return;

        if (this.dayLabel) {
            this.dayLabel.string = `第 ${gm.getCurrentDayIndex() + 1}/${level.dayCount} 天`;
        }

        if (this.revenueLabel) {
            this.revenueLabel.string = `收入: ¥${gm.generateReviewStats().totalRevenue}`;
        }

        if (this.penaltyLabel) {
            this.penaltyLabel.string = `扣罚: ¥${gm.generateReviewStats().totalPenalty}`;
        }

        if (this.occupancyLabel) {
            const rate = gm.getRoomManager()?.getOverallOccupancyRate() || 0;
            this.occupancyLabel.string = `入住率: ${(rate * 100).toFixed(1)}%`;
        }
    }

    onEnable(): void {
        if (this.pauseBtn) {
            this.pauseBtn.on(Node.EventType.TOUCH_END, this.onPauseClicked, this);
        }
        if (this.settingsBtn) {
            this.settingsBtn.on(Node.EventType.TOUCH_END, this.onSettingsClicked, this);
        }
    }

    onDisable(): void {
        if (this.pauseBtn) {
            this.pauseBtn.off(Node.EventType.TOUCH_END, this.onPauseClicked, this);
        }
        if (this.settingsBtn) {
            this.settingsBtn.off(Node.EventType.TOUCH_END, this.onSettingsClicked, this);
        }
    }

    private onPauseClicked(): void {
        const gm = GameManager.instance;
        if (gm) {
            if (gm.getCurrentState() === GameState.PLAYING) {
                gm.pauseGame();
            } else if (gm.getCurrentState() === GameState.PAUSED) {
                gm.resumeGame();
            }
        }
    }

    private onSettingsClicked(): void {
        // Toggle settings panel visibility
        const settingsPanel = this.node.parent?.getChildByName("SettingsPanel");
        if (settingsPanel) {
            settingsPanel.active = !settingsPanel.active;
        }
    }
}

@ccclass("MainScene")
export class MainScene extends Component {
    private gameManager: GameManager | null = null;
    private conflictManager: ConflictManager | null = null;
    private achievementManager: AchievementManager | null = null;
    private tutorialManager: TutorialManager | null = null;

    private calendar: RoomCalendar | null = null;
    private orderPanel: OrderPanel | null = null;
    private taskPanel: TaskPanel | null = null;
    private hud: HUD | null = null;

    private conflictCheckTimer: number = 0;

    async onLoad(): Promise<void> {
        this.gameManager = this.node.getComponent(GameManager) || this.node.addComponent(GameManager);
        this.conflictManager = this.node.addComponent(ConflictManager);
        this.achievementManager = this.node.addComponent(AchievementManager);
        this.tutorialManager = this.node.addComponent(TutorialManager);

        this.node.addComponent(AudioManager);
        this.node.addComponent(VibrationManager);

        await this.gameManager.loadConfigs();
        this.achievementManager.init(await this.loadAchievementConfigs());
        this.tutorialManager.init();

        this.setupUI();
        this.bindEvents();

        if (this.tutorialManager.shouldShowTutorial()) {
            this.tutorialManager.startTutorial();
        }

        this.showLevelSelect();
    }

    private async loadAchievementConfigs(): Promise<any[]> {
        try {
            const res = await this.gameManager!["loadJSON"]("configs/achievements");
            return res as any[];
        } catch {
            return [];
        }
    }

    private setupUI(): void {
        const calendarNode = this.node.getChildByName("RoomCalendar");
        if (calendarNode) {
            this.calendar = calendarNode.addComponent(RoomCalendar);
        }

        const orderNode = this.node.getChildByName("OrderPanel");
        if (orderNode) {
            this.orderPanel = orderNode.addComponent(OrderPanel);
            this.orderPanel.init();
        }

        const taskNode = this.node.getChildByName("TaskPanel");
        if (taskNode) {
            this.taskPanel = taskNode.addComponent(TaskPanel);
            this.taskPanel.init();
        }

        const hudNode = this.node.getChildByName("HUD");
        if (hudNode) {
            this.hud = hudNode.addComponent(HUD);
            this.hud.init();
        }
    }

    private bindEvents(): void {
        const gm = this.gameManager!;

        const orderMgr = gm.getOrderManager();
        if (orderMgr) {
            orderMgr.setOnOrderAdded((order) => {
                if (this.orderPanel) {
                    const channel = gm.getChannels().find(c => c.type === order.channelType) || null;
                    this.orderPanel.addOrderCard(order, channel);
                }
                this.achievementManager?.incrementProgress("total_checkins", 1);
            });

            orderMgr.setOnOrderExpired((order) => {
                if (this.orderPanel) {
                    this.orderPanel.removeOrderCard(order.id);
                }
                gm.recordBottleneck("order_expired", 0, `订单过期: ${order.guestName}`);
            });

            orderMgr.setOnOrderCancelled((order) => {
                if (this.orderPanel) {
                    this.orderPanel.removeOrderCard(order.id);
                }
            });
        }

        const taskMgr = gm.getTaskManager();
        if (taskMgr) {
            taskMgr.setOnTaskCompleted((task) => {
                if (this.taskPanel) {
                    this.taskPanel.removeTaskItem(task.id);
                }
                gm.addRevenue(task.reward);
                this.achievementManager?.incrementProgress("task_speed_ratio", 1);

                const roomMgr = gm.getRoomManager();
                if (roomMgr) {
                    roomMgr.releaseRoom(task.roomId, new Date().toISOString().slice(0, 10));
                }

                this.checkSettlementReady();
            });

            taskMgr.setOnTaskFailed((task) => {
                if (this.taskPanel) {
                    this.taskPanel.removeTaskItem(task.id);
                }
                gm.addPenalty(task.penalty);
                gm.recordBottleneck("task_failed", task.elapsed, `任务失败: ${task.description}`);
            });

            taskMgr.setOnTaskCreated((task) => {
                if (this.taskPanel) {
                    this.taskPanel.addTask(task);
                }
            });
        }

        this.conflictManager?.setOnConflictAppeared((conflict) => {
            this.showConflictDialog(conflict);
        });

        this.conflictManager?.setOnConflictResolved((conflict, option) => {
            this.achievementManager?.incrementProgress("consecutive_conflicts_resolved", 1);
            if (this.calendar) {
                this.calendar.refresh();
            }
        });

        if (this.calendar) {
            this.calendar.setOnCellClicked((roomId, date) => {
                this.onCalendarCellClicked(roomId, date);
            });
        }

        if (this.taskPanel) {
            this.taskPanel.setOnTaskClicked((taskId) => {
                this.onTaskClicked(taskId);
            });
        }
    }

    private onCalendarCellClicked(roomId: string, date: string): void {
        const gm = this.gameManager!;
        const roomMgr = gm.getRoomManager();
        if (!roomMgr) return;

        const slot = roomMgr.getSlot(roomId, date);
        if (!slot) return;

        if (slot.status === RoomStatus.CHECKING_OUT) {
            const taskMgr = gm.getTaskManager();
            if (taskMgr) {
                const task = taskMgr.createCleaningTask(roomId);
                taskMgr.startTask(task.id);
            }
            roomMgr.releaseRoom(roomId, date);
            if (this.calendar) this.calendar.refresh();
        }
    }

    private onTaskClicked(taskId: string): void {
        const gm = this.gameManager!;
        const taskMgr = gm.getTaskManager();
        if (!taskMgr) return;

        const task = taskMgr.getTask(taskId);
        if (task && task.status === TaskStatus.PENDING) {
            taskMgr.startTask(taskId);
        }
    }

    private showConflictDialog(conflict: any): void {
        const dialogNode = this.node.getChildByName("ConflictDialog");
        if (dialogNode) {
            const dialog = dialogNode.getComponent(ConflictDialog) || dialogNode.addComponent(ConflictDialog);
            dialog.init(conflict);
            dialog.setOnResolved((conflictId, optionId) => {
                this.conflictManager?.resolveConflict(conflictId, optionId);
                dialogNode.active = false;
            });
            dialogNode.active = true;
        }
    }

    private showLevelSelect(): void {
        const panelNode = this.node.getChildByName("LevelSelectPanel");
        if (panelNode) {
            const panel = panelNode.getComponent("LevelSelectPanel") as any || panelNode.addComponent(require("./ui/LevelSelectPanel").LevelSelectPanel);
            panel.init(this.gameManager!.getLevels());
            panel.setOnLevelSelected((index: number) => {
                this.startLevel(index);
                panelNode.active = false;
            });
            panelNode.active = true;
        }
    }

    private startLevel(index: number): void {
        const gm = this.gameManager!;
        gm.startLevel(index);
        this.conflictManager?.init();

        if (this.calendar) this.calendar.init();
        if (this.orderPanel) this.orderPanel.init();
        if (this.taskPanel) this.taskPanel.init();

        this.conflictCheckTimer = 0;
    }

    update(dt: number): void {
        const gm = this.gameManager;
        if (!gm) return;

        if (gm.getCurrentState() === GameState.PLAYING) {
            this.conflictCheckTimer += dt;
            if (this.conflictCheckTimer >= 15) {
                this.conflictCheckTimer = 0;
                this.conflictManager?.checkForConflicts();
            }

            this.conflictManager?.update(dt);

            if (this.calendar) {
                this.calendar.refresh();
            }
        }

        if (this.tutorialManager && this.tutorialManager.isActive()) {
            // Tutorial is active, waiting for user actions
        }
    }

    private checkSettlementReady(): void {
        const gm = this.gameManager;
        if (!gm) return;
        const taskMgr = gm.getTaskManager();
        if (!taskMgr) return;

        const allTasks = taskMgr.getAllTasks();
        const activeTasks = allTasks.filter(t =>
            t.status === TaskStatus.PENDING || t.status === TaskStatus.IN_PROGRESS
        );

        if (activeTasks.length === 0 && gm.getCurrentState() === GameState.PLAYING) {
            const level = gm.getCurrentLevel();
            if (level) {
                const roomMgr = gm.getRoomManager();
                if (roomMgr) {
                    const occupancy = roomMgr.getOverallOccupancyRate();
                    if (occupancy >= level.targetOccupancy) {
                        gm.enterSettlement();
                        this.showSettlement();
                    }
                }
            }
        }
    }

    private showSettlement(): void {
        const gm = this.gameManager!;
        const stats = gm.generateReviewStats();

        const panelNode = this.node.getChildByName("SettlementPanel");
        if (panelNode) {
            const panel = panelNode.getComponent("SettlementPanel") as any || panelNode.addComponent(require("./ui/SettlementPanel").SettlementPanel);
            panel.init(stats);
            panel.setOnNext(() => {
                panelNode.active = false;
                this.showReview(stats);
            });
            panel.setOnRetry(() => {
                panelNode.active = false;
                gm.startLevel(gm.getCurrentLevelIndex);
            });
            panelNode.active = true;
        }
    }

    private showReview(stats: any): void {
        const panelNode = this.node.getChildByName("ReviewPanel");
        if (panelNode) {
            const panel = panelNode.getComponent("ReviewPanel") as any || panelNode.addComponent(require("./ui/SettlementPanel").ReviewPanel);
            panel.init(stats);
            panel.setOnBack(() => {
                panelNode.active = false;
                this.showLevelSelect();
            });
            panelNode.active = true;
        }
    }
}
