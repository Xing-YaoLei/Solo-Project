import { _decorator } from 'cc';

const { ccclass } = _decorator;

export enum GamePhase {
    MENU,
    LEVEL_SELECT,
    PLAYING,
    PAUSED,
    SETTLEMENT,
    REVIEW,
}

@ccclass('PlayerState')
export class PlayerState {
    currentLevelId: string = '';
    score: number = 0;
    accuracy: number = 0;
    completedDiagnoses: Set<string> = new Set();
    activeEvents: string[] = [];
    timerRemaining: number = 0;
    isTimerPaused: boolean = false;
    vehicleProfileData: Map<string, unknown> = new Map();
    levelPassed?: boolean;

    private _totalDiagnoses: number = 0;
    private _correctDiagnoses: number = 0;

    resetForLevel(levelId: string): void {
        this.currentLevelId = levelId;
        this.score = 0;
        this.accuracy = 0;
        this.completedDiagnoses = new Set();
        this.activeEvents = [];
        this.timerRemaining = 0;
        this.isTimerPaused = false;
        this.vehicleProfileData = new Map();
        this._totalDiagnoses = 0;
        this._correctDiagnoses = 0;
    }

    addDiagnosisResult(diagId: string, correct: boolean): void {
        if (this.completedDiagnoses.has(diagId)) return;
        this.completedDiagnoses.add(diagId);
        this._totalDiagnoses++;
        if (correct) this._correctDiagnoses++;
        this.accuracy = this._totalDiagnoses > 0
            ? this._correctDiagnoses / this._totalDiagnoses
            : 0;
    }

    startTimer(seconds: number): void {
        this.timerRemaining = seconds;
        this.isTimerPaused = false;
    }

    pauseTimer(): void {
        this.isTimerPaused = true;
    }

    resumeTimer(): void {
        this.isTimerPaused = false;
    }

    tickTimer(dt: number): boolean {
        if (this.isTimerPaused) return false;
        this.timerRemaining -= dt;
        if (this.timerRemaining <= 0) {
            this.timerRemaining = 0;
            return true;
        }
        return false;
    }
}
