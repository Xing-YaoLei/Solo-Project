export class ScoreManager {
    private _score: number = 0;
    private _combo: number = 0;
    private _maxCombo: number = 0;
    private _correctCount: number = 0;
    private _wrongCount: number = 0;
    private _startTime: number = 0;
    private _totalTime: number = 0;
    private _timeLimit: number = 0;
    private _baseScore: number = 100;

    constructor(timeLimit: number = 120) {
        this._timeLimit = timeLimit;
    }

    reset(timeLimit?: number): void {
        this._score = 0;
        this._combo = 0;
        this._maxCombo = 0;
        this._correctCount = 0;
        this._wrongCount = 0;
        this._startTime = Date.now();
        this._totalTime = 0;
        if (timeLimit !== undefined) {
            this._timeLimit = timeLimit;
        }
    }

    startTimer(): void {
        this._startTime = Date.now();
    }

    stopTimer(): void {
        this._totalTime = (Date.now() - this._startTime) / 1000;
    }

    get elapsedTime(): number {
        if (this._totalTime > 0) return this._totalTime;
        return (Date.now() - this._startTime) / 1000;
    }

    get remainingTime(): number {
        return Math.max(0, this._timeLimit - this.elapsedTime);
    }

    get isTimeUp(): boolean {
        return this.remainingTime <= 0;
    }

    get score(): number {
        return Math.floor(this._score);
    }

    get combo(): number {
        return this._combo;
    }

    get maxCombo(): number {
        return this._maxCombo;
    }

    get correctCount(): number {
        return this._correctCount;
    }

    get wrongCount(): number {
        return this._wrongCount;
    }

    get totalTime(): number {
        return this._totalTime || this.elapsedTime;
    }

    addCorrect(basePoints: number = 1): number {
        this._correctCount++;
        this._combo++;
        this._maxCombo = Math.max(this._maxCombo, this._combo);

        const comboBonus = Math.min(this._combo * 0.1, 1);
        const points = this._baseScore * basePoints * (1 + comboBonus);
        this._score += points;

        return Math.floor(points);
    }

    addWrong(): number {
        this._wrongCount++;
        this._combo = 0;

        const penalty = this._baseScore * 0.5;
        this._score = Math.max(0, this._score - penalty);

        return Math.floor(penalty);
    }

    calculateFinalScore(threeStarScore: number, twoStarScore: number, targetScore: number): {
        finalScore: number;
        speedScore: number;
        accuracyScore: number;
        comboScore: number;
        starCount: number;
        passed: boolean;
    } {
        this.stopTimer();

        const timeBonus = Math.max(0, this._timeLimit - this._totalTime);
        const speedScore = Math.floor(timeBonus * 2);

        const totalAttempts = this._correctCount + this._wrongCount;
        const accuracy = totalAttempts > 0 ? this._correctCount / totalAttempts : 0;
        const accuracyScore = Math.floor(accuracy * 500);

        const comboScore = Math.floor(this._maxCombo * 20);

        const finalScore = this.score + speedScore + accuracyScore + comboScore;

        let starCount = 0;
        if (finalScore >= targetScore) starCount = 1;
        if (finalScore >= twoStarScore) starCount = 2;
        if (finalScore >= threeStarScore) starCount = 3;

        const passed = finalScore >= targetScore;

        return {
            finalScore,
            speedScore,
            accuracyScore,
            comboScore,
            starCount,
            passed,
        };
    }

    getAccuracy(): number {
        const total = this._correctCount + this._wrongCount;
        if (total === 0) return 100;
        return Math.floor((this._correctCount / total) * 100);
    }
}
