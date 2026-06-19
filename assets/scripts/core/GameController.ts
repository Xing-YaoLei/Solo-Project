import { _decorator, Component } from 'cc';
import { ConfigManager, LevelConfig } from '../config/ILevelConfig';
import { GamePhase, PlayerState } from './GameState';

const { ccclass } = _decorator;

@ccclass('GameController')
export class GameController extends Component {

    private _currentPhase: GamePhase = GamePhase.MENU;
    private _playerState: PlayerState = new PlayerState();
    private _currentLevelConfig: LevelConfig | null = null;
    private _elapsedTime: number = 0;

    get currentPhase(): GamePhase {
        return this._currentPhase;
    }

    get playerState(): PlayerState {
        return this._playerState;
    }

    async initGame(): Promise<void> {
        const configMgr = ConfigManager.getInstance();
        if (!configMgr.isLoaded) {
            await configMgr.loadAllConfigs();
        }
        this._setPhase(GamePhase.MENU);
    }

    startLevel(levelId: string): void {
        const configMgr = ConfigManager.getInstance();
        const levelConfig = configMgr.getLevelConfig(levelId);
        if (!levelConfig) {
            console.error(`Level config not found: ${levelId}`);
            return;
        }

        this._currentLevelConfig = levelConfig;
        this._playerState.resetForLevel(levelId);
        this._playerState.startTimer(levelConfig.timeLimit);
        this._elapsedTime = 0;
        this._setPhase(GamePhase.PLAYING);
    }

    completeDiagnosis(diagId: string, selectedQuoteId: string): void {
        if (this._currentPhase !== GamePhase.PLAYING) return;
        if (this._playerState.completedDiagnoses.has(diagId)) return;

        const configMgr = ConfigManager.getInstance();
        const diagConfig = configMgr.getDiagnosisConfig(diagId);
        if (!diagConfig) {
            console.error(`Diagnosis config not found: ${diagId}`);
            return;
        }

        const correct = selectedQuoteId === diagConfig.correctQuoteId;
        this._playerState.addDiagnosisResult(diagId, correct);
        this.node.emit('diagnosis-completed', diagId, correct);

        this.checkLevelComplete();
    }

    handleEvent(eventId: string, resolutionId: string): void {
        if (this._currentPhase !== GamePhase.PLAYING) return;

        const configMgr = ConfigManager.getInstance();
        const eventConfig = configMgr.getEventConfig(eventId);
        if (!eventConfig) {
            console.error(`Event config not found: ${eventId}`);
            return;
        }

        const resolution = eventConfig.resolutionOptions.find(r => r.id === resolutionId);
        if (!resolution) {
            console.error(`Resolution not found: ${eventId} / ${resolutionId}`);
            return;
        }

        this._playerState.timerRemaining = Math.max(0, this._playerState.timerRemaining - resolution.timePenalty);
        this._playerState.score -= resolution.cost;

        const idx = this._playerState.activeEvents.indexOf(eventId);
        if (idx !== -1) {
            this._playerState.activeEvents.splice(idx, 1);
        }
    }

    checkLevelComplete(): boolean {
        if (!this._currentLevelConfig) return false;

        const allDone = this._currentLevelConfig.diagnosisIds.every(
            id => this._playerState.completedDiagnoses.has(id)
        );

        if (allDone) {
            this.enterSettlement();
            return true;
        }
        return false;
    }

    calculateScore(): number {
        if (!this._currentLevelConfig) return 0;

        const rule = this._currentLevelConfig.scoringRule;
        const accuracy = this._playerState.accuracy;
        const timeRatio = this._currentLevelConfig.timeLimit > 0
            ? this._playerState.timerRemaining / this._currentLevelConfig.timeLimit
            : 0;

        const finalScore =
            rule.baseScore +
            rule.timeBonus * timeRatio +
            rule.accuracyWeight * accuracy * rule.baseScore;

        return Math.round(finalScore);
    }

    enterSettlement(): void {
        this._playerState.score = this.calculateScore();
        this._playerState.pauseTimer();
        this._setPhase(GamePhase.SETTLEMENT);
        this.node.emit('level-completed', this._playerState.score);
    }

    enterReview(): void {
        this._setPhase(GamePhase.REVIEW);
    }

    pauseGame(): void {
        if (this._currentPhase !== GamePhase.PLAYING) return;
        this._playerState.pauseTimer();
        this._setPhase(GamePhase.PAUSED);
    }

    resumeGame(): void {
        if (this._currentPhase !== GamePhase.PAUSED) return;
        this._playerState.resumeTimer();
        this._setPhase(GamePhase.PLAYING);
    }

    update(dt: number): void {
        if (this._currentPhase !== GamePhase.PLAYING) return;

        this._elapsedTime += dt;

        const expired = this._playerState.tickTimer(dt);
        if (expired) {
            this.node.emit('timer-expired');
            this.enterSettlement();
            return;
        }

        this._checkEventTriggers();
    }

    private _checkEventTriggers(): void {
        if (!this._currentLevelConfig) return;

        const configMgr = ConfigManager.getInstance();

        for (const eventId of this._currentLevelConfig.eventIds) {
            if (this._playerState.activeEvents.indexOf(eventId) !== -1) continue;

            const eventConfig = configMgr.getEventConfig(eventId);
            if (!eventConfig) continue;

            const cond = eventConfig.triggerCondition;
            if (this._elapsedTime < cond.minElapsed) continue;
            if (Math.random() >= cond.probability) continue;

            this._playerState.activeEvents.push(eventId);
            this.node.emit('event-triggered', eventId, eventConfig);
        }
    }

    private _setPhase(phase: GamePhase): void {
        if (this._currentPhase === phase) return;
        const prev = this._currentPhase;
        this._currentPhase = phase;
        this.node.emit('phase-changed', phase, prev);
    }
}
