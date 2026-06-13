import { _decorator, Component } from "cc";
import { ReplayAction, ReplayActionType, ReplaySession } from "./ReplayTypes";

const { ccclass } = _decorator;

@ccclass("ReplaySystem")
export class ReplaySystem extends Component {
    private _currentSession: ReplaySession | null = null;
    private _playbackIndex: number = 0;
    private _isPlaying: boolean = false;
    private _playbackSpeed: number = 1.0;
    private _onAction: ((action: ReplayAction, index: number) => void)[] = [];
    private _onSessionEnd: (() => void)[] = [];

    get isPlaying(): boolean { return this._isPlaying; }
    get currentSession(): ReplaySession | null { return this._currentSession; }
    get playbackProgress(): number {
        if (!this._currentSession) return 0;
        return this._currentSession.actions.length > 0
            ? this._playbackIndex / this._currentSession.actions.length
            : 0;
    }

    onAction(callback: (action: ReplayAction, index: number) => void): void {
        this._onAction.push(callback);
    }

    onSessionEnd(callback: () => void): void {
        this._onSessionEnd.push(callback);
    }

    beginSession(levelId: string): void {
        this._currentSession = {
            levelId,
            startTime: Date.now(),
            actions: [],
            finalArrivalRate: 0,
            passed: false
        };
    }

    recordAction(action: ReplayAction): void {
        if (!this._currentSession) return;
        this._currentSession.actions.push(action);
    }

    endSession(arrivalRate: number, passed: boolean): void {
        if (!this._currentSession) return;
        this._currentSession.finalArrivalRate = arrivalRate;
        this._currentSession.passed = passed;
    }

    startPlayback(session: ReplaySession, speed: number = 1.0): void {
        this._currentSession = session;
        this._playbackIndex = 0;
        this._playbackSpeed = speed;
        this._isPlaying = true;
    }

    updatePlayback(dt: number): void {
        if (!this._isPlaying || !this._currentSession) return;

        const adjustedDt = dt * this._playbackSpeed;

        if (this._playbackIndex < this._currentSession.actions.length) {
            const action = this._currentSession.actions[this._playbackIndex];
            for (const cb of this._onAction) {
                cb(action, this._playbackIndex);
            }
            this._playbackIndex++;
        } else {
            this._isPlaying = false;
            for (const cb of this._onSessionEnd) {
                cb();
            }
        }
    }

    pausePlayback(): void {
        this._isPlaying = false;
    }

    resumePlayback(): void {
        if (this._currentSession && this._playbackIndex < this._currentSession.actions.length) {
            this._isPlaying = true;
        }
    }

    seekTo(index: number): void {
        if (!this._currentSession) return;
        this._playbackIndex = Math.max(0, Math.min(index, this._currentSession.actions.length - 1));
    }

    setPlaybackSpeed(speed: number): void {
        this._playbackSpeed = Math.max(0.25, Math.min(4.0, speed));
    }

    getActionAt(index: number): ReplayAction | null {
        if (!this._currentSession || index < 0 || index >= this._currentSession.actions.length) return null;
        return this._currentSession.actions[index];
    }

    getFailedActions(): ReplayAction[] {
        if (!this._currentSession) return [];
        return this._currentSession.actions.filter(a =>
            a.type === ReplayActionType.CONFLICT_OCCURRED ||
            (a.type === ReplayActionType.ARRIVAL_CHECK && a.isCorrect === false)
        );
    }

    getActionCount(): number {
        return this._currentSession?.actions.length ?? 0;
    }
}
