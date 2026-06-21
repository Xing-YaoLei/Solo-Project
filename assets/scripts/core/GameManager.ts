import { _decorator, Component, Node, game } from 'cc';
import { GameMode, PostType, ActionType, ReservationStatus, ArrivalStatus, ConflictType } from '../models/GameEnums';
import { Reservation, ScenicSpot, Visitor, LevelData, GameResult, TimeSlot } from '../models';
import { ScoreSystem } from './ScoreSystem';
import { ConflictDetector } from './ConflictDetector';

const { ccclass, property } = _decorator;

export interface ActionFeedback {
    correct: boolean;
    scoreChange: number;
    message: string;
    action: ActionType;
}

@ccclass('GameManager')
export class GameManager extends Component {
    private static _instance: GameManager | null = null;

    public static get instance(): GameManager {
        return GameManager._instance!;
    }

    public static hasInstance(): boolean {
        return GameManager._instance !== null;
    }

    private currentLevel: LevelData | null = null;
    private scenicSpots: ScenicSpot[] = [];
    private reservations: Reservation[] = [];
    private currentTaskIndex: number = 0;
    private scoreSystem: ScoreSystem | null = null;
    private gameStartTime: number = 0;
    private gameTime: number = 0;
    private isPaused: boolean = false;
    private isGameOver: boolean = false;
    private selectedReservation: Reservation | null = null;
    private gameMode: GameMode = GameMode.FORMAL_TRAINING;
    private postType: PostType = PostType.RESERVATION_CLERK;
    private tutorialCompleted: boolean = false;
    private lastFeedback: ActionFeedback | null = null;
    private onActionCallback: ((fb: ActionFeedback) => void) | null = null;

    onLoad() {
        if (GameManager._instance && GameManager._instance !== this) {
            this.node.destroy();
            return;
        }
        GameManager._instance = this;
        game.addPersistRootNode(this.node);
    }

    onDestroy() {
        if (GameManager._instance === this) {
            GameManager._instance = null;
        }
    }

    public setOnActionCallback(cb: (fb: ActionFeedback) => void): void {
        this.onActionCallback = cb;
    }

    public getLastFeedback(): ActionFeedback | null {
        return this.lastFeedback;
    }

    public initLevel(levelData: LevelData): void {
        this.currentLevel = levelData;
        this.gameMode = levelData.mode;
        this.scenicSpots = [];
        this.reservations = [];
        this.currentTaskIndex = 0;
        this.gameTime = 0;
        this.isPaused = false;
        this.isGameOver = false;
        this.selectedReservation = null;
        this.lastFeedback = null;

        for (const spotData of levelData.scenicSpots) {
            const spot = new ScenicSpot(
                spotData.id, spotData.name, spotData.description, spotData.icon,
                spotData.mapPosX, spotData.mapPosY, spotData.dailyCapacity, spotData.color
            );
            for (const slotData of spotData.timeSlots) {
                spot.addTimeSlot(slotData.startTime, slotData.endTime, slotData.capacity);
            }
            this.scenicSpots.push(spot);
        }

        for (const taskData of levelData.tasks) {
            const spot = this.scenicSpots.find(s => s.id === taskData.scenicSpotId);
            if (!spot) continue;
            const slot = spot.timeSlots[taskData.timeSlotIndex];
            if (!slot) continue;

            const arrivalStatus = (taskData.arrivalStatus as ArrivalStatus) || ArrivalStatus.NOT_ARRIVED;

            const visitor = new Visitor({
                id: taskData.visitorId,
                name: taskData.visitorName,
                idCard: taskData.idCard,
                phone: taskData.phone,
                ticketCount: taskData.ticketCount,
                hasBlacklist: taskData.hasBlacklist,
                arrivalTime: taskData.arrivalTime,
                arrivalStatus: arrivalStatus,
                notes: taskData.notes
            });

            const reservation = new Reservation(visitor, slot, spot.id);
            reservation.isTask = taskData.isTask;
            reservation.correctAction = taskData.correctAction;
            reservation.correctRescheduleSlotIndex = taskData.correctRescheduleSlotIndex ?? null;

            const conflictTypes = taskData.conflictTypes as ConflictType[];
            for (const ct of conflictTypes) {
                reservation.addConflict(ct);
            }

            for (let i = 0; i < taskData.rescheduleCount; i++) {
                reservation.rescheduleRecords.push({
                    id: `mock_${i}`,
                    originalTimeSlot: new TimeSlot(0, 0, 0),
                    newTimeSlot: slot,
                    reason: '历史改约',
                    operator: 'system',
                    timestamp: Date.now()
                });
            }

            if (visitor.isArrived()) {
                reservation.status = ReservationStatus.CONFIRMED;
            }

            this.reservations.push(reservation);
            spot.reservations.push(reservation);
        }

        const taskCount = levelData.tasks.filter(t => t.isTask).length;
        this.scoreSystem = new ScoreSystem(taskCount);
        this.gameStartTime = Date.now();
    }

    update(deltaTime: number): void {
        if (this.isPaused || this.isGameOver) return;
        this.gameTime += deltaTime;
        if (this.currentLevel && this.gameTime >= this.currentLevel.timeLimit) {
            this.endGame();
        }
    }

    public processAction(action: ActionType, rescheduleSlotIndex: number | null = null): ActionFeedback {
        this.lastFeedback = null;

        if (!this.selectedReservation || !this.scoreSystem) {
            return { correct: false, scoreChange: 0, message: '未选择预约', action };
        }

        const reservation = this.selectedReservation;

        if (action === ActionType.RESCHEDULE && rescheduleSlotIndex === null) {
            const fb: ActionFeedback = { correct: false, scoreChange: 0, message: '请选择改约时段', action };
            this.lastFeedback = fb;
            return fb;
        }

        if (action === ActionType.RESCHEDULE && rescheduleSlotIndex !== null) {
            const spot = this.getScenicSpot(reservation.scenicSpotId);
            if (!spot) {
                const fb: ActionFeedback = { correct: false, scoreChange: 0, message: '景区不存在', action };
                this.lastFeedback = fb;
                return fb;
            }
            const targetSlot = spot.timeSlots[rescheduleSlotIndex];
            if (!targetSlot || !targetSlot.hasCapacity(reservation.visitor.ticketCount)) {
                const fb: ActionFeedback = {
                    correct: false,
                    scoreChange: -ScoreSystem.SCORE_PENALTY_WRONG,
                    message: '错误：该时段容量不足，不能改约到此时段',
                    action
                };
                this.scoreSystem.recordMistake(reservation, action, this.gameTime, fb.message);
                this.score = Math.max(0, this.score - ScoreSystem.SCORE_PENALTY_WRONG);
                this.lastFeedback = fb;
                if (this.onActionCallback) this.onActionCallback(fb);
                return fb;
            }
            if (rescheduleSlotIndex === this.getCurrentSlotIndex(reservation)) {
                const fb: ActionFeedback = {
                    correct: false,
                    scoreChange: -ScoreSystem.SCORE_PENALTY_WRONG,
                    message: '错误：改约到了相同时段，请选择其他时段',
                    action
                };
                this.scoreSystem.recordMistake(reservation, action, this.gameTime, fb.message);
                this.score = Math.max(0, this.score - ScoreSystem.SCORE_PENALTY_WRONG);
                this.lastFeedback = fb;
                if (this.onActionCallback) this.onActionCallback(fb);
                return fb;
            }
        }

        const result = this.scoreSystem.processAction(
            reservation, action, rescheduleSlotIndex, this.gameTime
        );

        switch (action) {
            case ActionType.APPROVE_RESERVATION:
                reservation.status = ReservationStatus.CONFIRMED;
                reservation.timeSlot.bookedCount += reservation.visitor.ticketCount;
                break;
            case ActionType.REJECT_RESERVATION:
                reservation.status = ReservationStatus.CANCELLED;
                break;
            case ActionType.RESCHEDULE:
                if (rescheduleSlotIndex !== null) {
                    const spot = this.getScenicSpot(reservation.scenicSpotId);
                    if (spot && spot.timeSlots[rescheduleSlotIndex]) {
                        const oldSlot = reservation.timeSlot;
                        const newSlot = spot.timeSlots[rescheduleSlotIndex];
                        reservation.reschedule(newSlot, '玩家操作改约', 'player');
                        oldSlot.bookedCount = Math.max(0, oldSlot.bookedCount - reservation.visitor.ticketCount);
                    }
                }
                break;
            case ActionType.CHECK_IN:
                reservation.status = ReservationStatus.ARRIVED;
                break;
            case ActionType.DENY_ENTRY:
                reservation.status = ReservationStatus.NO_SHOW;
                break;
            case ActionType.ESCALATE:
                reservation.status = ReservationStatus.CANCELLED;
                break;
        }

        reservation.processedAt = Date.now();
        reservation.processedBy = 'player';
        reservation.feedback = result.message;

        const fb: ActionFeedback = {
            correct: result.correct,
            scoreChange: result.scoreChange,
            message: result.message,
            action
        };
        this.lastFeedback = fb;

        this.selectedReservation = null;
        this.currentTaskIndex++;

        const remainingTasks = this.reservations.filter(r => r.isTask && r.isPendingOrArrival());
        if (remainingTasks.length === 0) {
            this.endGame();
        }

        if (this.onActionCallback) this.onActionCallback(fb);
        return fb;
    }

    private getCurrentSlotIndex(reservation: Reservation): number {
        const spot = this.getScenicSpot(reservation.scenicSpotId);
        if (!spot) return -1;
        return spot.timeSlots.findIndex(s =>
            s.startTime === reservation.timeSlot.startTime && s.endTime === reservation.timeSlot.endTime
        );
    }

    private get score(): number {
        return this.scoreSystem?.getScore() ?? 0;
    }

    private set score(v: number) {
        if (this.scoreSystem) {
            this.scoreSystem['score'] = v;
        }
    }

    public endGame(): void {
        this.isGameOver = true;
    }

    public getGameResult(): GameResult | null {
        if (!this.scoreSystem || !this.currentLevel) return null;
        const usedTime = this.gameTime;
        const timeLimit = this.currentLevel.timeLimit;
        return {
            levelId: this.currentLevel.id,
            totalScore: this.scoreSystem.getScore(),
            maxScore: this.currentLevel.tasks.filter(t => t.isTask).length * 100,
            correctCount: this.scoreSystem.getCorrectCount(),
            totalTasks: this.currentLevel.tasks.filter(t => t.isTask).length,
            mistakes: this.scoreSystem.getMistakes(),
            usedTime, timeLimit,
            stars: this.scoreSystem.getStars(usedTime, timeLimit),
            passed: this.scoreSystem.getScore() >= this.currentLevel.targetScore,
            accuracy: this.scoreSystem.getAccuracy(),
            comboMax: this.scoreSystem.getMaxCombo()
        };
    }

    public getScenicSpots(): ScenicSpot[] { return this.scenicSpots; }
    public getScenicSpot(id: string): ScenicSpot | undefined { return this.scenicSpots.find(s => s.id === id); }
    public getReservations(): Reservation[] { return this.reservations; }

    public getPendingTasks(): Reservation[] {
        return this.reservations.filter(r => r.isTask && r.isPendingOrArrival());
    }

    public getSelectedReservation(): Reservation | null { return this.selectedReservation; }

    public setSelectedReservation(reservation: Reservation | null): void {
        this.selectedReservation = reservation;
    }

    public getGameTime(): number { return this.gameTime; }
    public getScore(): number { return this.scoreSystem?.getScore() || 0; }
    public getCombo(): number { return this.scoreSystem?.getCombo() || 0; }
    public getCurrentLevel(): LevelData | null { return this.currentLevel; }
    public getGameMode(): GameMode { return this.gameMode; }
    public setGameMode(mode: GameMode): void { this.gameMode = mode; }
    public getPostType(): PostType { return this.postType; }
    public setPostType(post: PostType): void { this.postType = post; }
    public pauseGame(): void { this.isPaused = true; }
    public resumeGame(): void { this.isPaused = false; }
    public isGamePaused(): boolean { return this.isPaused; }
    public isGameEnded(): boolean { return this.isGameOver; }
    public isTutorialCompleted(): boolean { return this.tutorialCompleted; }
    public setTutorialCompleted(c: boolean): void { this.tutorialCompleted = c; }

    public formatTime(seconds: number): string {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
}
