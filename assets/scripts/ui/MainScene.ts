import { _decorator, Component, Node, Label, Sprite, Color, Vec3, UITransform, tween } from "cc";
import { GameManager, GameState } from "../managers/GameManager";
import { RoomCalendar } from "../components/RoomCalendar";
import { OrderPanel, OrderCard } from "../components/OrderCard";
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
import { Task, TaskStatus, TaskType } from "../models/Task";
import { RoomStatus } from "../models/Room";
import { LevelSelectPanel } from "../ui/LevelSelectPanel";
import { SettingsPanel } from "../ui/SettingsPanel";

const { ccclass } = _decorator;

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
        const settingsPanel = this.node.parent?.getChildByName("SettingsPanel");
        if (settingsPanel) {
            settingsPanel.active = !settingsPanel.active;
            if (settingsPanel.active) {
                let panel = settingsPanel.getComponent(SettingsPanel);
                if (!panel) {
                    panel = settingsPanel.addComponent(SettingsPanel);
                }
                panel.init();
            }
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
    private levelSelectPanel: LevelSelectPanel | null = null;
    private settingsPanel: SettingsPanel | null = null;

    private conflictCheckTimer: number = 0;
    private isConfigsLoaded: boolean = false;
    private settlementShown: boolean = false;

    async onLoad(): Promise<void> {
        this.gameManager = this.node.getComponent(GameManager) || this.node.addComponent(GameManager);
        this.conflictManager = this.node.addComponent(ConflictManager);
        this.achievementManager = this.node.addComponent(AchievementManager);
        this.tutorialManager = this.node.addComponent(TutorialManager);

        this.node.addComponent(AudioManager);
        this.node.addComponent(VibrationManager);

        await this.gameManager.loadConfigs();
        this.isConfigsLoaded = true;

        this.achievementManager.init(this.gameManager.getAchievements());
        this.tutorialManager.init();

        this.setupUI();
        this.bindEvents();

        if (this.tutorialManager.shouldShowTutorial()) {
            this.tutorialManager.startTutorial();
        }

        this.showLevelSelect();
    }

    private setupUI(): void {
        const calendarNode = this.node.getChildByName("RoomCalendar");
        if (calendarNode) {
            this.calendar = calendarNode.getComponent(RoomCalendar) || calendarNode.addComponent(RoomCalendar);
        }

        const orderNode = this.node.getChildByName("OrderPanel");
        if (orderNode) {
            this.orderPanel = orderNode.getComponent(OrderPanel) || orderNode.addComponent(OrderPanel);
            this.orderPanel.init();
        }

        const taskNode = this.node.getChildByName("TaskPanel");
        if (taskNode) {
            this.taskPanel = taskNode.getComponent(TaskPanel) || taskNode.addComponent(TaskPanel);
            this.taskPanel.init();
        }

        const hudNode = this.node.getChildByName("HUD");
        if (hudNode) {
            this.hud = hudNode.getComponent(HUD) || hudNode.addComponent(HUD);
            this.hud.init();
        }

        const levelSelectNode = this.node.getChildByName("LevelSelectPanel");
        if (levelSelectNode) {
            this.levelSelectPanel = levelSelectNode.getComponent(LevelSelectPanel) || levelSelectNode.addComponent(LevelSelectPanel);
        }

        const settingsNode = this.node.getChildByName("SettingsPanel");
        if (settingsNode) {
            this.settingsPanel = settingsNode.getComponent(SettingsPanel) || settingsNode.addComponent(SettingsPanel);
            settingsNode.active = false;
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
                    this.bindOrderCardEvents(order.id);
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
                this.handleTaskCompleted(task);
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

        if (this.levelSelectPanel) {
            this.levelSelectPanel.setOnLevelSelected((index) => {
                this.startLevel(index);
                const levelNode = this.node.getChildByName("LevelSelectPanel");
                if (levelNode) levelNode.active = false;
            });
        }

        gm.setOnStateChanged((state) => {
            if (state === GameState.SETTLEMENT && !this.settlementShown) {
                this.settlementShown = true;
                this.showSettlement();
            }
        });
    }

    private bindOrderCardEvents(orderId: string): void {
        if (!this.orderPanel) return;

        const card = this.orderPanel.getOrderCard(orderId);
        if (!card) return;

        card.setOnDragEnd((order, worldPos) => {
            this.handleOrderDragEnd(order, worldPos);
        });

        card.setOnConfirm((orderId, roomId) => {
            this.confirmOrder(orderId, roomId);
        });
    }

    private handleOrderDragEnd(order: Order, worldPos: Vec3): void {
        const calendarNode = this.node.getChildByName("RoomCalendar");
        if (!calendarNode) return;

        const calendarTransform = calendarNode.getComponent(UITransform);
        if (!calendarTransform) return;

        const localPos = calendarTransform.convertToNodeSpaceAR(worldPos);

        const calendarSize = calendarTransform.contentSize;
        const halfW = calendarSize.width / 2;
        const halfH = calendarSize.height / 2;

        const cellsOffsetX = 60;
        const cellsOffsetY = 40;

        const relX = localPos.x + halfW - cellsOffsetX;
        const relY = halfH - localPos.y - cellsOffsetY;

        const cellWidth = 80;
        const cellHeight = 50;
        const cellX = Math.floor(relX / cellWidth);
        const rowIndex = Math.floor(relY / cellHeight);

        const gm = GameManager.instance;
        if (!gm) return;

        const roomMgr = gm.getRoomManager();
        if (!roomMgr) return;

        const rooms = roomMgr.getAllRooms();
        if (rowIndex < 0 || rowIndex >= rooms.length) return;

        const targetRoom = rooms[rowIndex];
        if (cellX < 0 || cellX >= targetRoom.slots.length) return;

        const targetSlot = targetRoom.slots[cellX];
        if (targetSlot.status !== RoomStatus.VACANT && targetSlot.status !== RoomStatus.CLEANING) return;

        this.confirmOrder(order.id, targetRoom.id);
    }

    private confirmOrder(orderId: string, roomId: string): boolean {
        const gm = GameManager.instance;
        if (!gm) return false;

        const orderMgr = gm.getOrderManager();
        const roomMgr = gm.getRoomManager();
        if (!orderMgr || !roomMgr) return false;

        const order = orderMgr.getOrder(orderId);
        if (!order || order.status !== OrderStatus.PENDING) return false;

        const success = roomMgr.assignOrderToRoom(roomId, order.checkIn, order.checkOut, orderId);
        if (!success) return false;

        orderMgr.confirmOrder(orderId, roomId);
        orderMgr.checkInOrder(orderId);

        gm.addRevenue(order.price);

        if (this.orderPanel) {
            this.orderPanel.removeOrderCard(orderId);
        }

        if (this.calendar) {
            this.calendar.refresh();
        }

        this.achievementManager?.updateProgress("daily_occupancy", roomMgr.getOverallOccupancyRate());

        return true;
    }

    private handleTaskCompleted(task: Task): void {
        const gm = GameManager.instance;
        if (!gm) return;

        if (this.taskPanel) {
            this.taskPanel.removeTaskItem(task.id);
        }

        gm.addRevenue(task.reward);

        const roomMgr = gm.getRoomManager();
        if (roomMgr) {
            const room = roomMgr.getRoom(task.roomId);
            if (room) {
                for (const slot of room.slots) {
                    if (slot.status === RoomStatus.CLEANING) {
                        slot.status = RoomStatus.VACANT;
                        slot.orderId = null;
                        slot.checkIn = null;
                        slot.checkOut = null;
                    }
                }
            }
        }

        const elapsedRatio = task.duration > 0 ? task.elapsed / task.duration : 1;
        this.achievementManager?.updateProgress("task_speed_ratio", elapsedRatio);

        if (this.calendar) {
            this.calendar.refresh();
        }

        this.checkSettlementReady();
    }

    private onCalendarCellClicked(roomId: string, date: string): void {
        const gm = GameManager.instance;
        const roomMgr = gm?.getRoomManager();
        if (!roomMgr) return;

        const slot = roomMgr.getSlot(roomId, date);
        if (!slot) return;

        if (slot.status === RoomStatus.OCCUPIED && slot.orderId) {
            this.checkOutAndStartCleaning(roomId, date, slot.orderId);
        }
    }

    private checkOutAndStartCleaning(roomId: string, date: string, orderId: string): void {
        const gm = GameManager.instance;
        if (!gm) return;

        const orderMgr = gm.getOrderManager();
        const taskMgr = gm.getTaskManager();
        const roomMgr = gm.getRoomManager();
        if (!orderMgr || !taskMgr || !roomMgr) return;

        const order = orderMgr.getOrder(orderId);
        if (!order) return;

        orderMgr.checkOutOrder(orderId);

        const room = roomMgr.getRoom(roomId);
        if (room) {
            for (const slot of room.slots) {
                if (slot.orderId === orderId) {
                    slot.status = RoomStatus.CLEANING;
                    slot.checkIn = null;
                    slot.checkOut = null;
                }
            }
        }

        const task = taskMgr.createCleaningTask(roomId);
        taskMgr.startTask(task.id);

        if (this.calendar) {
            this.calendar.refresh();
        }
    }

    private onTaskClicked(taskId: string): void {
        const gm = GameManager.instance;
        const taskMgr = gm?.getTaskManager();
        if (!taskMgr) return;

        const task = taskMgr.getTask(taskId);
        if (task && task.status === TaskStatus.PENDING) {
            taskMgr.startTask(taskId);
        }
    }

    private showConflictDialog(conflict: any): void {
        const dialogNode = this.node.getChildByName("ConflictDialog");
        if (!dialogNode) {
            console.warn("ConflictDialog node not found");
            return;
        }

        let dialog = dialogNode.getComponent(ConflictDialog);
        if (!dialog) {
            dialog = dialogNode.addComponent(ConflictDialog);
        }

        dialog.init(conflict);
        dialog.setOnResolved((conflictId, optionId) => {
            this.conflictManager?.resolveConflict(conflictId, optionId);
            dialogNode.active = false;
        });

        dialogNode.active = true;
    }

    private showLevelSelect(): void {
        if (!this.levelSelectPanel || !this.gameManager) return;

        const panelNode = this.node.getChildByName("LevelSelectPanel");
        if (panelNode) {
            this.levelSelectPanel.init(this.gameManager.getLevels());
            panelNode.active = true;
        }
    }

    private startLevel(index: number): void {
        const gm = this.gameManager!;
        gm.startLevel(index);
        this.conflictManager?.init();

        this.settlementShown = false;
        this.conflictCheckTimer = 0;

        if (this.calendar) this.calendar.init();
        if (this.orderPanel) this.orderPanel.init();
        if (this.taskPanel) this.taskPanel.init();
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

            this.checkSettlementReady();
        }

        if (this.tutorialManager && this.tutorialManager.isActive()) {
            if (gm.getCurrentState() === GameState.PLAYING) {
                this.tutorialManager.advanceStep("start_game");
            }
        }
    }

    private checkSettlementReady(): void {
        const gm = this.gameManager;
        if (!gm) return;

        if (gm.getCurrentState() !== GameState.PLAYING) return;

        const roomMgr = gm.getRoomManager();
        const taskMgr = gm.getTaskManager();
        const orderMgr = gm.getOrderManager();
        if (!roomMgr || !taskMgr || !orderMgr) return;

        const level = gm.getCurrentLevel();
        if (!level) return;

        const allTasks = taskMgr.getAllTasks();
        const activeTasks = allTasks.filter(t =>
            t.status === TaskStatus.PENDING || t.status === TaskStatus.IN_PROGRESS
        );

        const pendingOrders = orderMgr.getPendingOrders();
        const allRoomsClean = roomMgr.getAllRooms().every(room =>
            room.slots.every(slot =>
                slot.status === RoomStatus.VACANT || slot.status === RoomStatus.CLEANING
            )
        );

        const occupancy = roomMgr.getOverallOccupancyRate();
        const hasStarted = occupancy > 0;

        if (hasStarted && activeTasks.length === 0 && pendingOrders.length === 0 && occupancy >= level.targetOccupancy) {
            if (!this.settlementShown) {
                gm.enterSettlement();
            }
        }
    }

    private showSettlement(): void {
        const gm = this.gameManager!;
        const stats = gm.generateReviewStats();

        const panelNode = this.node.getChildByName("SettlementPanel");
        if (!panelNode) {
            console.warn("SettlementPanel node not found");
            return;
        }

        let panel = panelNode.getComponent(SettlementPanel);
        if (!panel) {
            panel = panelNode.addComponent(SettlementPanel);
        }

        panel.init(stats);
        panel.setOnNext(() => {
            panelNode.active = false;
            this.showReview(stats);
        });
        panel.setOnRetry(() => {
            panelNode.active = false;
            this.settlementShown = false;
            gm.startLevel(gm.getCurrentLevelIndex());
        });

        panelNode.active = true;
    }

    private showReview(stats: any): void {
        const panelNode = this.node.getChildByName("ReviewPanel");
        if (!panelNode) {
            console.warn("ReviewPanel node not found");
            return;
        }

        let panel = panelNode.getComponent(ReviewPanel);
        if (!panel) {
            panel = panelNode.addComponent(ReviewPanel);
        }

        panel.init(stats);
        panel.setOnBack(() => {
            panelNode.active = false;
            const gm = GameManager.instance;
            if (gm) {
                const levelIndex = gm.getCurrentLevelIndex();
                if (levelIndex + 1 < gm.getLevels().length && stats.starRating >= 1) {
                    if (this.levelSelectPanel) {
                        this.levelSelectPanel.unlockLevel(levelIndex + 1);
                    }
                }
            }
            gm?.setState(GameState.MENU);
            this.showLevelSelect();
        });

        panelNode.active = true;
    }
}
