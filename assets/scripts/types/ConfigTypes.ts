export module ConfigTypes {

    export type UnlockConditionType = 'NONE' | 'LEVEL_PASS' | 'TOTAL_SCORE' | 'EXP_REACHED' | 'ITEM_OWNED';

    export interface UnlockCondition {
        type: UnlockConditionType;
        value: number | string;
    }

    export interface LevelRewards {
        exp: number;
        coins: number;
        unlockItems: string[];
    }

    export interface LevelConfig {
        id: string;
        name: string;
        description: string;
        difficulty: number;
        prescriptionId: string;
        sceneId: string;
        tiledMap: string;
        unlockCondition: UnlockCondition;
        timeLimit: number;
        passScore: number;
        tasks: string[];
        rewards: LevelRewards;
    }

    export interface LevelsConfigFile {
        version: string;
        levels: LevelConfig[];
    }

    export type TaskType =
        | 'ACTION'
        | 'OBSERVATION'
        | 'EVALUATION'
        | 'PLANNING'
        | 'PRESCRIPTION'
        | 'COMMUNICATION'
        | 'SAFETY'
        | 'COLLABORATION'
        | 'BILLING';

    export type ErrorType =
        | 'PROCEDURAL'
        | 'ADMINISTRATIVE'
        | 'DIAGNOSTIC'
        | 'EVALUATION'
        | 'DOCUMENTATION'
        | 'OVERTREATMENT'
        | 'TREATMENT'
        | 'BILLING_FRAUD'
        | 'COMMUNICATION'
        | 'SAFETY'
        | 'COLLABORATION'
        | 'PLANNING';

    export interface ActionOption {
        id: string;
        text: string;
        score: number;
        isCorrect: boolean;
        errorType?: ErrorType;
        explanation: string;
        insuranceRejectionRisk?: number;
        nextTask: string | null;
        cost?: number;
    }

    export interface TaskConfig {
        id: string;
        name: string;
        description: string;
        type: TaskType;
        clueIds: string[];
        actionOptions: ActionOption[];
        questionSetId?: string;
        prescriptionRules?: {
            maxItems?: number;
            requiredCategories?: string[];
            insuranceLimit?: number;
        };
        billingRules?: {
            dailyLimit?: boolean;
            sameDayDeny?: string[];
            drgGroup?: string;
            costCeiling?: number;
            readmissionPenalty?: boolean;
        };
    }

    export interface TasksConfigFile {
        version: string;
        tasks: Record<string, TaskConfig>;
    }

    export type ClueCategory = 'DOCUMENT' | 'PHYSICAL' | 'REFERENCE' | 'MEDIA';
    export type ClueImportance = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

    export interface ClueConfig {
        id: string;
        name: string;
        description: string;
        category: ClueCategory;
        spritePath: string;
        content: Record<string, any>;
        importance: ClueImportance;
        hint: string;
    }

    export interface CluesConfigFile {
        version: string;
        clues: Record<string, ClueConfig>;
    }

    export type PrescriptionCategory =
        | 'ADMINISTRATIVE'
        | 'NEUROLOGICAL'
        | 'ORTHOPEDIC'
        | 'GERIATRIC'
        | 'CARDIAC'
        | 'PEDIATRIC';

    export interface PrescriptionObjective {
        id: string;
        name: string;
        target: number;
        description: string;
    }

    export interface PrescriptionParameters {
        maxAttempts: number;
        timeDeductionPerSecond: number;
        scoreMultiplier: number;
        insuranceWeight: number;
        procedureWeight?: number;
        clinicalWeight?: number;
        unlockComplexLogsAfter: number;
        requiredEvaluationScale?: string;
        minEvaluationItems?: number;
        billingAccuracyThreshold?: number;
        drgCostCeiling?: number;
        requiredCgaDomains?: number;
        polypharmacyScreeningMandatory?: boolean;
        drgGroupCompliance?: boolean;
        readmissionPenaltyEnabled?: boolean;
        [key: string]: any;
    }

    export interface PrescriptionConfig {
        id: string;
        name: string;
        description: string;
        category: PrescriptionCategory;
        parameters: PrescriptionParameters;
        objectives: PrescriptionObjective[];
    }

    export interface PrescriptionsConfigFile {
        version: string;
        prescriptions: Record<string, PrescriptionConfig>;
    }

    export type TutorialTriggerCondition =
        | 'FIRST_LAUNCH'
        | 'ENTER_LEVEL_LV001'
        | 'FIRST_ACTION_COMPLETE'
        | 'UNLOCK_COMPLEX_LOGS'
        | 'FIRST_LEVEL_COMPLETE';

    export type TutorialStepType = 'DIALOG' | 'POINTER' | 'HIGHLIGHT' | 'CLICK';

    export interface TutorialStep {
        id: number;
        type: TutorialStepType;
        target: string | null;
        content: string;
        highlightArea: string | null;
        duration: number;
    }

    export interface TutorialConfig {
        id: string;
        name: string;
        order: number;
        triggerCondition: TutorialTriggerCondition;
        steps: TutorialStep[];
    }

    export interface TutorialsConfigFile {
        version: string;
        tutorials: Record<string, TutorialConfig>;
    }

    export interface QuestionOption {
        text: string;
        score: number;
        correct: boolean;
    }

    export interface Question {
        id: string;
        subscale: string;
        scenario: string;
        options: QuestionOption[];
    }

    export interface QuestionSetConfig {
        id: string;
        name: string;
        description: string;
        questions: Question[];
        passScore: number;
        explanation: string;
    }

    export interface QuestionSetsConfigFile {
        version: string;
        questionSets: Record<string, QuestionSetConfig>;
    }

    export interface InteractiveObject {
        id: string;
        name: string;
        triggerTaskIds: string[];
        triggerClueIds?: string[];
    }

    export interface NPCConfig {
        id: string;
        name: string;
        role: string;
        dialogues: any[];
    }

    export interface SceneConfig {
        id: string;
        name: string;
        description: string;
        tiledMap: string;
        backgroundMusic: string;
        interactiveObjects: InteractiveObject[];
        npcs: NPCConfig[];
    }

    export interface ScenesConfigFile {
        version: string;
        scenes: Record<string, SceneConfig>;
    }
}
