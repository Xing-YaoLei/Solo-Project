import { _decorator, Component } from "cc";
import { ArrivalCheckResult } from "../appointment/AppointmentSystem";
import { ConflictInfo } from "../appointment/ConflictDetector";
import { LevelConfig } from "./LevelConfig";

const { ccclass } = _decorator;

export interface ScoreRecord {
    levelId: string;
    timestamp: number;
    arrivalRate: number;
    conflictCount: number;
    overbookCount: number;
    correctArrivalChecks: number;
    totalArrivalChecks: number;
    failedActions: number;
    passed: boolean;
    errorCauses: ErrorCause[];
}

export interface ErrorCause {
    category: "capacity_exceeded" | "station_overlap" | "buffer_violation" | "arrival_misjudge" | "timeout" | "overbook_violation";
    description: string;
    relatedRule: string;
    timestamp: number;
}

@ccclass("ScoreManager")
export class ScoreManager extends Component {
    private _history: ScoreRecord[] = [];
    private _currentRecord: Partial<ScoreRecord> | null = null;
    private _errorCauses: ErrorCause[] = [];
    private _conflictCount: number = 0;
    private _overbookCount: number = 0;
    private _correctChecks: number = 0;
    private _totalChecks: number = 0;
    private _failedActions: number = 0;

    get history(): ScoreRecord[] { return this._history; }

    beginLevel(levelId: string): void {
        this._currentRecord = { levelId, timestamp: Date.now() };
        this._errorCauses = [];
        this._conflictCount = 0;
        this._overbookCount = 0;
        this._correctChecks = 0;
        this._totalChecks = 0;
        this._failedActions = 0;
    }

    recordConflict(conflict: ConflictInfo, relatedRule: string): void {
        this._conflictCount++;
        this._failedActions++;

        const category = this._conflictToCategory(conflict.type);
        this._errorCauses.push({
            category,
            description: conflict.message,
            relatedRule,
            timestamp: Date.now()
        });
    }

    recordArrivalCheck(result: ArrivalCheckResult): void {
        this._totalChecks++;
        if (result.isCorrect) {
            this._correctChecks++;
        } else {
            this._failedActions++;
            this._errorCauses.push({
                category: "arrival_misjudge",
                description: `顾客 ${result.customerId} 到场状态判断错误：应为 ${result.previousStatus}，判为 ${result.newStatus}`,
                relatedRule: "arrival_window",
                timestamp: result.timestamp
            });
        }
    }

    recordTimeout(): void {
        this._failedActions++;
        this._errorCauses.push({
            category: "timeout",
            description: "限时内未完成所有预约安排",
            relatedRule: "time_limit",
            timestamp: Date.now()
        });
    }

    recordOverbook(): void {
        this._overbookCount++;
    }

    finishLevel(arrivalRate: number, levelConfig: LevelConfig): ScoreRecord {
        const passed = arrivalRate >= levelConfig.passConditions.minArrivalRate
            && this._conflictCount <= levelConfig.passConditions.maxConflictCount
            && this._overbookCount <= levelConfig.passConditions.maxOverbookCount;

        const record: ScoreRecord = {
            levelId: this._currentRecord?.levelId ?? "",
            timestamp: this._currentRecord?.timestamp ?? Date.now(),
            arrivalRate,
            conflictCount: this._conflictCount,
            overbookCount: this._overbookCount,
            correctArrivalChecks: this._correctChecks,
            totalArrivalChecks: this._totalChecks,
            failedActions: this._failedActions,
            passed,
            errorCauses: [...this._errorCauses]
        };

        this._history.push(record);
        this._currentRecord = null;
        return record;
    }

    getCapacityErrorCauses(): ErrorCause[] {
        return this._errorCauses.filter(e =>
            e.category === "capacity_exceeded" ||
            e.category === "station_overlap" ||
            e.category === "buffer_violation" ||
            e.category === "overbook_violation"
        );
    }

    getOverallArrivalRate(): number {
        if (this._history.length === 0) return 0;
        const sum = this._history.reduce((acc, r) => acc + r.arrivalRate, 0);
        return sum / this._history.length;
    }

    getLevelArrivalRate(levelId: string): number {
        const records = this._history.filter(r => r.levelId === levelId);
        if (records.length === 0) return 0;
        const sum = records.reduce((acc, r) => acc + r.arrivalRate, 0);
        return sum / records.length;
    }

    getTotalPlayCount(): number {
        return this._history.length;
    }

    getTotalPassCount(): number {
        return this._history.filter(r => r.passed).length;
    }

    getPassRate(): number {
        if (this._history.length === 0) return 0;
        return this.getTotalPassCount() / this.getTotalPlayCount();
    }

    private _conflictToCategory(type: string): ErrorCause["category"] {
        switch (type) {
            case "capacity_exceeded": return "capacity_exceeded";
            case "station_overlap": return "station_overlap";
            case "buffer_violation": return "buffer_violation";
            case "double_book": return "overbook_violation";
            default: return "station_overlap";
        }
    }
}
