import { _decorator, Component, Node } from 'cc';
import { GameMode, PostType, ActionType, ReservationStatus, DifficultyLevel } from '../models/GameEnums';
import { Reservation, ScenicSpot, Visitor, LevelData, GameResult, TimeSlot } from '../models';
import { ScoreSystem } from './ScoreSystem';
import { ConflictDetector } from './ConflictDetector';

const { ccclass, property } = _decorator;

@ccclass('GameManager')
export class GameManager extends Component {
    private static _instance: GameManager | null = null;

    public static get instance(): GameManager {
        if (!GameManager._instance) {
            console.error('GameManager not initialized');
        }
        return GameManager._instance!;
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

    onLoad() {
        if (GameManager._instance && GameManager._instance !== this) {
            this.node.destroy();
            return;
        }
        GameManager._instance = this;
    }

    onDestroy() {
        if (GameManager._instance === this) {
            GameManager._instance = null;
        }
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

        for (const spotData of levelData.scenicSpots) {
            const spot = new ScenicSpot(
                spotData.id,
                spotData.name,
                spotData.description,
                spotData.icon,
                spotData.mapPosX,
                spotData.mapPosY,
                spotData.dailyCapacity,
                spotData.color
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

            const visitor = new Visitor({
                id: taskData.visitorId,
                name: taskData.visitorName,
                idCard: taskData.idCard,
                phone: taskData.phone,
                ticketCount: taskData.ticketCount,
                hasBlacklist: taskData.hasBlacklist,
                arrivalTime: taskData.arrivalTime,
                notes: taskData.notes
            });

            const reservation = new Reservation(visitor, slot, spot.id);
            reservation.isTask = taskData.isTask;
            reservation.correctAction = taskData.correctAction;
            if (taskData.correctRescheduleSlotIndex !== null) {
                reservation.correctRescheduleSlotId = spot.timeSlots[taskData.correctRescheduleSlotIndex]?.startTime.toString() || null;
            }

            const conflictTypes = taskData.conflictTypes as any[];
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

            this.reservations.push(reservation);
            spot.reservations.push(reservation);
        }

        const taskCount = levelData.tasks.filter(t => t.isTask).length;
        this.scoreSystem = new ScoreSystem(taskCount);
        this.gameStartTime = Date.now();
    }

    public update(deltaTime: number): void {
        if (this.isPaused || this.isGameOver) return;

        this.gameTime += deltaTime;

        if (this.currentLevel && this.gameTime >= this.currentLevel.timeLimit) {
            this.endGame();
        }
    }

    public processAction(action: ActionType, rescheduleSlotIndex: number | null = null): void {
        if (!this.selectedReservation || !this.scoreSystem) return;

        const rescheduleSlotId = rescheduleSlotIndex !== null && this.selectedReservation
            ? this.getScenicSpot(this.selectedReservation.scenicSpotId)?.timeSlots[rescheduleSlotIndex]?.startTime.toString() || null
            : null;

        const result = this.scoreSystem.processAction(
            this.selectedReservation,
            action,
            rescheduleSlotId,
            this.gameTime
        );

        switch (action) {
            case ActionType.APPROVE_RESERVATION:
                this.selectedReservation.status = ReservationStatus.CONFIRMED;
                const slot = this.selectedReservation.timeSlot;
                slot.bookedCount += this.selectedReservation.visitor.ticketCount;
                break;
            case ActionType.REJECT_RESERVATION:
                this.selectedReservation.status = ReservationStatus.CANCELLED;
                break;
            case ActionType.RESCHEDULE:
                if (rescheduleSlotIndex !== null) {
                    const spot = this.getScenicSpot(this.selectedReservation.scenicSpotId);
                    if (spot && spot.timeSlots[rescheduleSlotIndex]) {
                        const oldSlot = this.selectedReservation.timeSlot;
                        const newSlot = spot.timeSlots[rescheduleSlotIndex];
                        this.selectedReservation.reschedule(newSlot, '玩家操作改约', 'player');
                        oldSlot.bookedCount = Math.max(0, oldSlot.bookedCount - this.selectedReservation.visitor.ticketCount);
                    }
                }
                break;
        }

        this.selectedReservation.processedAt = Date.now();
        this.selectedReservation.processedBy = 'player';
        this.selectedReservation.feedback = result.message;

        this.selectedReservation = null;
        this.currentTaskIndex++;

        const remainingTasks = this.reservations.filter(r => r.isTask && r.isNew());
        if (remainingTasks.length === 0) {
            this.endGame();
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
            usedTime: usedTime,
            timeLimit: timeLimit,
            stars: this.scoreSystem.getStars(usedTime, timeLimit),
            passed: this.scoreSystem.getScore() >= this.currentLevel.targetScore,
            accuracy: this.scoreSystem.getAccuracy(),
            comboMax: this.scoreSystem.getMaxCombo()
        };
    }

    public getScenicSpots(): ScenicSpot[] {
        return this.scenicSpots;
    }

    public getScenicSpot(id: string): ScenicSpot | undefined {
        return this.scenicSpots.find(s => s.id === id);
    }

    public getReservations(): Reservation[] {
        return this.reservations;
    }

    public getPendingTasks(): Reservation[] {
        return this.reservations.filter(r => r.isTask && r.isNew());
    }

    public getSelectedReservation(): Reservation | null {
        return this.selectedReservation;
    }

    public setSelectedReservation(reservation: Reservation | null): void {
        this.selectedReservation = reservation;
    }

    public getGameTime(): number {
        return this.gameTime;
    }

    public getScore(): number {
        return this.scoreSystem?.getScore() || 0;
    }

    public getCombo(): number {
        return this.scoreSystem?.getCombo() || 0;
    }

    public getCurrentLevel(): LevelData | null {
        return this.currentLevel;
    }

    public getGameMode(): GameMode {
        return this.gameMode;
    }

    public setGameMode(mode: GameMode): void {
        this.gameMode = mode;
    }

    public getPostType(): PostType {
        return this.postType;
    }

    public setPostType(post: PostType): void {
        this.postType = post;
    }

    public pauseGame(): void {
        this.isPaused = true;
    }

    public resumeGame(): void {
        this.isPaused = false;
    }

    public isGamePaused(): boolean {
        return this.isPaused;
    }

    public isGameEnded(): boolean {
        return this.isGameOver;
    }

    public isTutorialCompleted(): boolean {
        return this.tutorialCompleted;
    }

    public setTutorialCompleted(completed: boolean): void {
        this.tutorialCompleted = completed;
    }

    public formatTime(seconds: number): string {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
}
