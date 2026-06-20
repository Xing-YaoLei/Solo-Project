import { ActionType, ConflictType } from '../models/GameEnums';
import { Reservation, MistakeRecord } from '../models';
import { ConflictDetector } from './ConflictDetector';

export class ScoreSystem {
    public static readonly BASE_SCORE_CORRECT = 100;
    public static readonly SCORE_PENALTY_WRONG = 50;
    public static readonly SCORE_BONUS_FAST = 20;
    public static readonly SCORE_BONUS_COMBO = 10;
    public static readonly SCORE_BONUS_PERFECT = 50;

    private score: number;
    private combo: number;
    private maxCombo: number;
    private correctCount: number;
    private wrongCount: number;
    private totalTasks: number;
    private mistakes: MistakeRecord[];
    private startTime: number;

    constructor(totalTasks: number) {
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.correctCount = 0;
        this.wrongCount = 0;
        this.totalTasks = totalTasks;
        this.mistakes = [];
        this.startTime = Date.now();
    }

    public processAction(
        reservation: Reservation,
        action: ActionType,
        rescheduleSlotId: string | null,
        currentTime: number
    ): { correct: boolean; scoreChange: number; message: string } {
        const expectedAction = reservation.correctAction;
        const isCorrect = this.checkActionCorrect(reservation, action, rescheduleSlotId);

        let scoreChange = 0;
        let message = '';

        if (isCorrect) {
            this.correctCount++;
            this.combo++;
            if (this.combo > this.maxCombo) {
                this.maxCombo = this.combo;
            }

            scoreChange = ScoreSystem.BASE_SCORE_CORRECT;
            message = '正确！';

            if (this.combo >= 3) {
                scoreChange += ScoreSystem.SCORE_BONUS_COMBO * Math.min(this.combo - 2, 5);
                message = `正确！连击 x${this.combo}`;
            }

            const timeTaken = (Date.now() - this.startTime) / 1000;
            if (timeTaken < 30) {
                scoreChange += ScoreSystem.SCORE_BONUS_FAST;
                message += ' 快速判定奖励！';
            }

            this.score += scoreChange;
        } else {
            this.wrongCount++;
            this.combo = 0;

            scoreChange = -ScoreSystem.SCORE_PENALTY_WRONG;
            this.score = Math.max(0, this.score + scoreChange);

            const mistake: MistakeRecord = {
                reservationId: reservation.id,
                visitorName: reservation.visitor.name,
                expectedAction: expectedAction,
                actualAction: action,
                conflicts: [...reservation.conflicts],
                explanation: this.getMistakeExplanation(reservation, action),
                timePoint: currentTime
            };
            this.mistakes.push(mistake);

            message = `错误：${mistake.explanation}`;
        }

        return { correct: isCorrect, scoreChange, message };
    }

    private checkActionCorrect(
        reservation: Reservation,
        action: ActionType,
        rescheduleSlotId: string | null
    ): boolean {
        const expectedAction = reservation.correctAction;

        if (action !== expectedAction) {
            return false;
        }

        if (action === ActionType.RESCHEDULE) {
            if (!rescheduleSlotId) return false;
            return true;
        }

        return true;
    }

    private getMistakeExplanation(reservation: Reservation, action: ActionType): string {
        const expected = reservation.correctAction;

        if (reservation.conflicts.includes(ConflictType.BLACKLIST)) {
            if (action === ActionType.APPROVE_RESERVATION) {
                return '黑名单游客不应批准预约';
            }
        }

        if (reservation.conflicts.includes(ConflictType.CAPACITY_EXCEEDED)) {
            if (action === ActionType.APPROVE_RESERVATION) {
                return '该时段已满，应进行改约或拒绝';
            }
            if (action === ActionType.REJECT_RESERVATION) {
                return '容量满时可尝试改约，而非直接拒绝';
            }
        }

        if (reservation.conflicts.includes(ConflictType.TIME_SLOT_OVERLAP)) {
            if (action === ActionType.APPROVE_RESERVATION) {
                return '时段有重叠，应改约或拒绝';
            }
        }

        if (reservation.conflicts.length === 0 || reservation.conflicts.includes(ConflictType.NONE)) {
            if (action === ActionType.REJECT_RESERVATION) {
                return '无冲突的预约应予以批准';
            }
            if (action === ActionType.RESCHEDULE) {
                return '无冲突无需改约';
            }
        }

        const actionNames: Record<ActionType, string> = {
            [ActionType.APPROVE_RESERVATION]: '批准',
            [ActionType.REJECT_RESERVATION]: '拒绝',
            [ActionType.RESCHEDULE]: '改约',
            [ActionType.CHECK_IN]: '签到',
            [ActionType.DENY_ENTRY]: '拒绝入园',
            [ActionType.ESCALATE]: '上报'
        };

        return `正确操作应为：${actionNames[expected]}`;
    }

    public getScore(): number {
        return Math.floor(this.score);
    }

    public getCombo(): number {
        return this.combo;
    }

    public getMaxCombo(): number {
        return this.maxCombo;
    }

    public getCorrectCount(): number {
        return this.correctCount;
    }

    public getWrongCount(): number {
        return this.wrongCount;
    }

    public getMistakes(): MistakeRecord[] {
        return [...this.mistakes];
    }

    public getAccuracy(): number {
        const total = this.correctCount + this.wrongCount;
        if (total === 0) return 0;
        return this.correctCount / total;
    }

    public getStars(timeUsed: number, timeLimit: number): number {
        const accuracy = this.getAccuracy();
        const timeRatio = 1 - (timeUsed / timeLimit);
        const maxScore = this.totalTasks * ScoreSystem.BASE_SCORE_CORRECT;
        const scoreRatio = this.score / maxScore;

        const compositeScore = scoreRatio * 0.5 + accuracy * 0.3 + Math.max(0, timeRatio) * 0.2;

        if (compositeScore >= 0.9) return 3;
        if (compositeScore >= 0.7) return 2;
        if (compositeScore >= 0.5) return 1;
        return 0;
    }

    public reset(): void {
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.correctCount = 0;
        this.wrongCount = 0;
        this.mistakes = [];
        this.startTime = Date.now();
    }
}
