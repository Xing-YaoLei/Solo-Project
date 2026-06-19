export interface DifficultyParams {
    timeMultiplier: number;
    eventProbabilityMultiplier: number;
    diagnosisCount: number;
    reworkRiskMultiplier: number;
    hintCooldown: number;
    scoreMultiplier: number;
}

export type DifficultyCurve = { level: number; params: DifficultyParams }[];

export class DifficultyManager {
    private static _instance: DifficultyManager | null = null;
    private _curve: DifficultyCurve = [];

    static getInstance(): DifficultyManager {
        if (!DifficultyManager._instance) {
            DifficultyManager._instance = new DifficultyManager();
        }
        return DifficultyManager._instance;
    }

    loadCurve(curve: DifficultyCurve): void {
        this._curve = curve.sort((a, b) => a.level - b.level);
    }

    getParamsForLevel(level: number): DifficultyParams {
        if (this._curve.length === 0) {
            return this._defaultParams();
        }

        const exact = this._curve.find((entry) => entry.level === level);
        if (exact) return exact.params;

        const first = this._curve[0];
        const last = this._curve[this._curve.length - 1];

        if (level <= first.level) return first.params;
        if (level >= last.level) return last.params;

        let lower = first;
        let upper = last;
        for (let i = 0; i < this._curve.length - 1; i++) {
            if (level >= this._curve[i].level && level < this._curve[i + 1].level) {
                lower = this._curve[i];
                upper = this._curve[i + 1];
                break;
            }
        }

        const t = (level - lower.level) / (upper.level - lower.level);
        return this.interpolateParams(lower.params, upper.params, t);
    }

    interpolateParams(
        level1Params: DifficultyParams,
        level2Params: DifficultyParams,
        t: number,
    ): DifficultyParams {
        const lerp = (a: number, b: number) => a + (b - a) * t;
        return {
            timeMultiplier: lerp(level1Params.timeMultiplier, level2Params.timeMultiplier),
            eventProbabilityMultiplier: lerp(
                level1Params.eventProbabilityMultiplier,
                level2Params.eventProbabilityMultiplier,
            ),
            diagnosisCount: Math.round(lerp(level1Params.diagnosisCount, level2Params.diagnosisCount)),
            reworkRiskMultiplier: lerp(level1Params.reworkRiskMultiplier, level2Params.reworkRiskMultiplier),
            hintCooldown: lerp(level1Params.hintCooldown, level2Params.hintCooldown),
            scoreMultiplier: lerp(level1Params.scoreMultiplier, level2Params.scoreMultiplier),
        };
    }

    scaleTimeLimit(baseTime: number, level: number): number {
        return baseTime * this.getParamsForLevel(level).timeMultiplier;
    }

    scaleEventProbability(baseProbability: number, level: number): number {
        return baseProbability * this.getParamsForLevel(level).eventProbabilityMultiplier;
    }

    getDefaultCurve(): DifficultyCurve {
        return [
            {
                level: 1,
                params: {
                    timeMultiplier: 1.5,
                    eventProbabilityMultiplier: 0.6,
                    diagnosisCount: 2,
                    reworkRiskMultiplier: 0.5,
                    hintCooldown: 30,
                    scoreMultiplier: 0.8,
                },
            },
            {
                level: 2,
                params: {
                    timeMultiplier: 1.0,
                    eventProbabilityMultiplier: 1.0,
                    diagnosisCount: 3,
                    reworkRiskMultiplier: 1.0,
                    hintCooldown: 60,
                    scoreMultiplier: 1.0,
                },
            },
            {
                level: 3,
                params: {
                    timeMultiplier: 0.7,
                    eventProbabilityMultiplier: 1.5,
                    diagnosisCount: 5,
                    reworkRiskMultiplier: 1.8,
                    hintCooldown: 120,
                    scoreMultiplier: 1.5,
                },
            },
        ];
    }

    private _defaultParams(): DifficultyParams {
        return {
            timeMultiplier: 1.0,
            eventProbabilityMultiplier: 1.0,
            diagnosisCount: 3,
            reworkRiskMultiplier: 1.0,
            hintCooldown: 60,
            scoreMultiplier: 1.0,
        };
    }
}
