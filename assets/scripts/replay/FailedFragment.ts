import { _decorator, Component } from "cc";
import { ReplaySession, ReplayAction, ReplayActionType } from "./ReplayTypes";

const { ccclass } = _decorator;

const MAX_FAILED_FRAGMENTS = 5;

export interface FailedFragment {
    levelId: string;
    timestamp: number;
    failedActions: ReplayAction[];
    arrivalRate: number;
    errorSummary: string;
}

@ccclass("FailedFragment")
export class FailedFragmentStore extends Component {
    private _fragments: Map<string, FailedFragment[]> = new Map();

    getFragmentCount(levelId?: string): number {
        if (levelId) {
            return (this._fragments.get(levelId) ?? []).length;
        }
        let total = 0;
        for (const [, frags] of this._fragments) {
            total += frags.length;
        }
        return total;
    }

    addFragment(session: ReplaySession): void {
        const failedActions = session.actions.filter(a =>
            a.type === ReplayActionType.CONFLICT_OCCURRED ||
            (a.type === ReplayActionType.ARRIVAL_CHECK && a.isCorrect === false) ||
            a.type === ReplayActionType.TIMEOUT
        );

        if (failedActions.length === 0 && session.passed) return;

        const fragment: FailedFragment = {
            levelId: session.levelId,
            timestamp: Date.now(),
            failedActions,
            arrivalRate: session.finalArrivalRate,
            errorSummary: this._buildErrorSummary(failedActions)
        };

        if (!this._fragments.has(session.levelId)) {
            this._fragments.set(session.levelId, []);
        }

        const levelFragments = this._fragments.get(session.levelId)!;
        levelFragments.unshift(fragment);

        while (levelFragments.length > MAX_FAILED_FRAGMENTS) {
            levelFragments.pop();
        }
    }

    getFragments(levelId: string): FailedFragment[] {
        return this._fragments.get(levelId) ?? [];
    }

    getAllFragments(): FailedFragment[] {
        const all: FailedFragment[] = [];
        for (const [, frags] of this._fragments) {
            all.push(...frags);
        }
        return all.sort((a, b) => b.timestamp - a.timestamp);
    }

    getRecentFragments(count: number): FailedFragment[] {
        return this.getAllFragments().slice(0, count);
    }

    clearFragments(levelId?: string): void {
        if (levelId) {
            this._fragments.delete(levelId);
        } else {
            this._fragments.clear();
        }
    }

    private _buildErrorSummary(actions: ReplayAction[]): string {
        const conflictCount = actions.filter(a => a.type === ReplayActionType.CONFLICT_OCCURRED).length;
        const misjudgeCount = actions.filter(a => a.type === ReplayActionType.ARRIVAL_CHECK && !a.isCorrect).length;
        const timeoutCount = actions.filter(a => a.type === ReplayActionType.TIMEOUT).length;

        const parts: string[] = [];
        if (conflictCount > 0) parts.push(`时段冲突${conflictCount}次`);
        if (misjudgeCount > 0) parts.push(`到场误判${misjudgeCount}次`);
        if (timeoutCount > 0) parts.push(`超时${timeoutCount}次`);

        return parts.length > 0 ? parts.join("；") : "无错误";
    }
}
