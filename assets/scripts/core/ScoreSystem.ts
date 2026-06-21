import { ActionType, ConflictType, ArrivalStatus } from '../models/GameEnums';
import { Reservation, MistakeRecord } from '../models';

export class ScoreSystem {
    public static readonly BASE_SCORE_CORRECT = 100;
    public static readonly SCORE_PENALTY_WRONG = 50;
    public static readonly SCORE_BONUS_FAST = 20;
    public static readonly SCORE_BONUS_COMBO = 10;

    public score: number = 0;
    private combo: number = 0;
    private maxCombo: number = 0;
    private correctCount: number = 0;
    private wrongCount: number = 0;
    private totalTasks: number;
    private mistakes: MistakeRecord[] = [];
    private startTime: number;

    constructor(totalTasks: number) {
        this.totalTasks = totalTasks;
        this.startTime = Date.now();
    }

    public processAction(
        reservation: Reservation,
        action: ActionType,
        rescheduleSlotIndex: number | null,
        currentTime: number
    ): { correct: boolean; scoreChange: number; message: string } {
        const isCorrect = this.checkActionCorrect(reservation, action, rescheduleSlotIndex);

        let scoreChange = 0;
        let message = '';

        if (isCorrect) {
            this.correctCount++;
            this.combo++;
            if (this.combo > this.maxCombo) this.maxCombo = this.combo;

            scoreChange = ScoreSystem.BASE_SCORE_CORRECT;
            message = '正确！';

            if (this.combo >= 3) {
                scoreChange += ScoreSystem.SCORE_BONUS_COMBO * Math.min(this.combo - 2, 5);
                message = `正确！连击 x${this.combo}`;
            }

            const elapsed = (Date.now() - this.startTime) / 1000;
            if (elapsed < 30) {
                scoreChange += ScoreSystem.SCORE_BONUS_FAST;
                message += ' 快速判定奖励！';
            }

            this.score += scoreChange;
        } else {
            this.wrongCount++;
            this.combo = 0;
            scoreChange = -ScoreSystem.SCORE_PENALTY_WRONG;
            this.score = Math.max(0, this.score + scoreChange);

            const explanation = this.getMistakeExplanation(reservation, action, rescheduleSlotIndex);
            this.mistakes.push({
                reservationId: reservation.id,
                visitorName: reservation.visitor.name,
                expectedAction: reservation.correctAction,
                actualAction: action,
                conflicts: [...reservation.conflicts],
                explanation,
                timePoint: currentTime
            });

            message = `错误：${explanation}`;
        }

        return { correct: isCorrect, scoreChange, message };
    }

    public recordMistake(reservation: Reservation, action: ActionType, currentTime: number, explanation: string): void {
        this.wrongCount++;
        this.combo = 0;
        this.mistakes.push({
            reservationId: reservation.id,
            visitorName: reservation.visitor.name,
            expectedAction: reservation.correctAction,
            actualAction: action,
            conflicts: [...reservation.conflicts],
            explanation,
            timePoint: currentTime
        });
    }

    private checkActionCorrect(
        reservation: Reservation,
        action: ActionType,
        rescheduleSlotIndex: number | null
    ): boolean {
        const expected = reservation.correctAction;

        if (action !== expected) return false;

        if (action === ActionType.RESCHEDULE) {
            if (rescheduleSlotIndex === null) return false;
            if (reservation.correctRescheduleSlotIndex !== null) {
                return rescheduleSlotIndex === reservation.correctRescheduleSlotIndex;
            }
        }

        return true;
    }

    private getMistakeExplanation(reservation: Reservation, action: ActionType, rescheduleSlotIndex: number | null): string {
        const expected = reservation.correctAction;
        const actionNames: Record<ActionType, string> = {
            [ActionType.APPROVE_RESERVATION]: '批准预约',
            [ActionType.REJECT_RESERVATION]: '拒绝预约',
            [ActionType.RESCHEDULE]: '改约',
            [ActionType.CHECK_IN]: '签到入园',
            [ActionType.DENY_ENTRY]: '拒绝入园',
            [ActionType.ESCALATE]: '上报'
        };

        if (action === ActionType.RESCHEDULE && rescheduleSlotIndex !== null && reservation.correctRescheduleSlotIndex !== null) {
            if (rescheduleSlotIndex !== reservation.correctRescheduleSlotIndex) {
                return `改约时段选择错误：应改约到第${reservation.correctRescheduleSlotIndex + 1}时段，而非第${rescheduleSlotIndex + 1}时段`;
            }
        }

        if (reservation.conflicts.includes(ConflictType.BLACKLIST)) {
            if (action === ActionType.APPROVE_RESERVATION || action === ActionType.CHECK_IN) {
                return '黑名单游客不应批准预约或允许签到入园';
            }
            if (action === ActionType.RESCHEDULE) {
                return '黑名单游客应直接拒绝，而非改约';
            }
        }

        if (reservation.conflicts.includes(ConflictType.ARRIVAL_LATE)) {
            if (action === ActionType.CHECK_IN) {
                return '迟到游客不应签到入园，应拒绝入园';
            }
            if (action === ActionType.APPROVE_RESERVATION) {
                return '迟到游客不应批准，应拒绝入园';
            }
        }

        if (reservation.conflicts.includes(ConflictType.ARRIVAL_NO_SHOW)) {
            if (action === ActionType.CHECK_IN) {
                return '未到场的游客不应签到入园';
            }
            if (action === ActionType.APPROVE_RESERVATION) {
                return '未到场的游客不应批准';
            }
        }

        if (reservation.conflicts.includes(ConflictType.ARRIVAL_EARLY)) {
            if (action === ActionType.DENY_ENTRY) {
                return '早到游客可正常签到入园，不应拒绝';
            }
        }

        if (reservation.conflicts.includes(ConflictType.CAPACITY_EXCEEDED)) {
            if (action === ActionType.APPROVE_RESERVATION || action === ActionType.CHECK_IN) {
                return '该时段已满，应改约或拒绝';
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
            if (action === ActionType.DENY_ENTRY) {
                return '正常到场的游客应签到入园';
            }
        }

        if (expected === ActionType.CHECK_IN && action !== ActionType.CHECK_IN) {
            return `该游客已按时到场，应签到入园，而非${actionNames[action]}`;
        }
        if (expected === ActionType.DENY_ENTRY && action !== ActionType.DENY_ENTRY) {
            return `该游客不应入园，应拒绝入园，而非${actionNames[action]}`;
        }

        return `正确操作应为：${actionNames[expected]}`;
    }

    public getScore(): number { return Math.floor(this.score); }
    public getCombo(): number { return this.combo; }
    public getMaxCombo(): number { return this.maxCombo; }
    public getCorrectCount(): number { return this.correctCount; }
    public getWrongCount(): number { return this.wrongCount; }
    public getMistakes(): MistakeRecord[] { return [...this.mistakes]; }

    public getAccuracy(): number {
        const total = this.correctCount + this.wrongCount;
        if (total === 0) return 0;
        return this.correctCount / total;
    }

    public getStars(timeUsed: number, timeLimit: number): number {
        const accuracy = this.getAccuracy();
        const timeRatio = 1 - (timeUsed / timeLimit);
        const maxScore = this.totalTasks * ScoreSystem.BASE_SCORE_CORRECT;
        const scoreRatio = maxScore > 0 ? this.score / maxScore : 0;
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
