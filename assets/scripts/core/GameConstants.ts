export namespace GameConstants {

    export enum CaseStage {
        ACCEPTANCE = 'acceptance',
        INVESTIGATION = 'investigation',
        PLEADING = 'pleading',
        TRIAL = 'trial',
        JUDGMENT = 'judgment',
        CLOSED = 'closed'
    }

    export enum ActionType {
        INTERROGATE = 'interrogate',
        EVIDENCE = 'evidence',
        DOCUMENT = 'document',
        CONSULT = 'consult',
        OBJECTION = 'objection',
        SETTLEMENT = 'settlement'
    }

    export enum Difficulty {
        EASY = 'easy',
        NORMAL = 'normal',
        HARD = 'hard',
        EXPERT = 'expert'
    }

    export enum ClueType {
        TESTIMONY = 'testimony',
        PHYSICAL = 'physical',
        DOCUMENTARY = 'documentary',
        DIGITAL = 'digital',
        EXPERT = 'expert'
    }

    export enum ErrorCategory {
        PROCEDURAL = 'procedural',
        EVIDENTIARY = 'evidentiary',
        LEGAL = 'legal',
        STRATEGIC = 'strategic',
        ETHICAL = 'ethical'
    }

    export const STAGE_NAMES: Record<CaseStage, string> = {
        [CaseStage.ACCEPTANCE]: '案件受理',
        [CaseStage.INVESTIGATION]: '调查取证',
        [CaseStage.PLEADING]: '诉辩阶段',
        [CaseStage.TRIAL]: '庭审阶段',
        [CaseStage.JUDGMENT]: '判决阶段',
        [CaseStage.CLOSED]: '案件结案'
    };

    export const STAGE_ORDER: CaseStage[] = [
        CaseStage.ACCEPTANCE,
        CaseStage.INVESTIGATION,
        CaseStage.PLEADING,
        CaseStage.TRIAL,
        CaseStage.JUDGMENT,
        CaseStage.CLOSED
    ];

    export const ERROR_CATEGORY_NAMES: Record<ErrorCategory, string> = {
        [ErrorCategory.PROCEDURAL]: '程序类',
        [ErrorCategory.EVIDENTIARY]: '证据类',
        [ErrorCategory.LEGAL]: '法律适用类',
        [ErrorCategory.STRATEGIC]: '策略类',
        [ErrorCategory.ETHICAL]: '职业伦理类'
    };

    export const MAX_SCORE = 100;
    export const BASE_PASS_SCORE = 60;
    export const CLUE_MISS_PENALTY = 5;
    export const WRONG_ACTION_PENALTY = 10;
    export const PERFECT_BONUS = 20;
}
