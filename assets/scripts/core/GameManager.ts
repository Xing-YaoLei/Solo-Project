import { _decorator, Component, Node } from 'cc';
import { GameConstants } from './GameConstants';
import { ICase, IClue, ICaseAction, ICaseStageConfig, ITrainingRecord, IErrorRecord, IMaterialMissRecord } from './GameInterfaces';
import { ConfigManager } from './ConfigManager';
import { SaveManager } from './SaveManager';
const { ccclass, property } = _decorator;

@ccclass('GameManager')
export class GameManager extends Component {

    private static _instance: GameManager | null = null;

    public static get instance(): GameManager {
        if (!GameManager._instance) {
            GameManager._instance = new GameManager();
        }
        return GameManager._instance;
    }

    private _currentCase: ICase | null = null;
    private _currentStageIndex: number = 0;
    private _currentScore: number = 0;
    private _discoveredClueIds: Set<string> = new Set();
    private _takenActionIds: Set<string> = new Set();
    private _errorRecords: IErrorRecord[] = [];
    private _materialMissRecords: IMaterialMissRecord[] = [];
    private _startTime: number = 0;
    private _clientTrustLevel: number = 50;
    private _isPlaying: boolean = false;
    private _dayCount: number = 1;

    constructor() {
        super();
    }

    public async init(): Promise<void> {
        await ConfigManager.instance.loadAllConfigs();
        SaveManager.instance.init();
        console.log('[GameManager] Initialized');
    }

    public startCase(caseId: string): boolean {
        const caseData = ConfigManager.instance.getCase(caseId);
        if (!caseData) {
            console.error(`[GameManager] Case ${caseId} not found`);
            return false;
        }

        const save = SaveManager.instance.getSave();
        if (caseData.requiredUnlockedCaseIds.length > 0) {
            for (const requiredId of caseData.requiredUnlockedCaseIds) {
                if (!save.completedCaseIds.includes(requiredId)) {
                    console.warn(`[GameManager] Case ${caseId} requires case ${requiredId} to be completed`);
                    return false;
                }
            }
        }

        this._currentCase = caseData;
        this._currentStageIndex = 0;
        this._currentScore = caseData.baseScore;
        this._discoveredClueIds = new Set();
        this._takenActionIds = new Set();
        this._errorRecords = [];
        this._materialMissRecords = [];
        this._startTime = Date.now();
        this._clientTrustLevel = 50;
        this._isPlaying = true;
        this._dayCount = 1;

        const firstStage = caseData.stages[0];
        if (firstStage) {
            firstStage.clueIds.forEach(id => this._discoveredClueIds.add(id));
        }

        SaveManager.instance.setCurrentCase(caseId);

        console.log(`[GameManager] Started case: ${caseData.title}`);
        return true;
    }

    public getCurrentCase(): ICase | null {
        return this._currentCase;
    }

    public getCurrentStage(): ICaseStageConfig | null {
        if (!this._currentCase) return null;
        return this._currentCase.stages[this._currentStageIndex] || null;
    }

    public getCurrentStageName(): string {
        const stage = this.getCurrentStage();
        if (!stage) return '';
        return GameConstants.STAGE_NAMES[stage.stage as GameConstants.CaseStage] || stage.stage;
    }

    public getScore(): number {
        return this._currentScore;
    }

    public getMaxScore(): number {
        if (!this._currentCase) return GameConstants.MAX_SCORE;
        return this._currentCase.baseScore + GameConstants.PERFECT_BONUS;
    }

    public getDiscoveredClues(): IClue[] {
        if (!this._currentCase) return [];
        return this._currentCase.clues.filter(c => this._discoveredClueIds.has(c.id));
    }

    public getAvailableActions(): ICaseAction[] {
        if (!this._currentCase) return [];
        const currentStage = this.getCurrentStage();
        if (!currentStage) return [];

        return this._currentCase.actions.filter(action => {
            if (this._takenActionIds.has(action.id)) return false;
            if (action.requiredStage !== currentStage.stage) return false;
            
            const hasRequiredClues = action.requiredClueIds.every(
                clueId => this._discoveredClueIds.has(clueId)
            );
            return hasRequiredClues;
        });
    }

    public takeAction(actionId: string): { 
        success: boolean; 
        message: string;
        isCorrect: boolean;
        scoreChange: number;
        nextStage: boolean;
    } {
        if (!this._isPlaying || !this._currentCase) {
            return { success: false, message: '游戏未开始', isCorrect: false, scoreChange: 0, nextStage: false };
        }

        const action = this._currentCase.actions.find(a => a.id === actionId);
        if (!action) {
            return { success: false, message: '动作不存在', isCorrect: false, scoreChange: 0, nextStage: false };
        }

        if (this._takenActionIds.has(actionId)) {
            return { success: false, message: '动作已执行', isCorrect: false, scoreChange: 0, nextStage: false };
        }

        const currentStage = this.getCurrentStage();
        if (!currentStage || action.requiredStage !== currentStage.stage) {
            return { success: false, message: '当前阶段不可执行此动作', isCorrect: false, scoreChange: 0, nextStage: false };
        }

        const hasRequiredClues = action.requiredClueIds.every(
            clueId => this._discoveredClueIds.has(clueId)
        );
        if (!hasRequiredClues) {
            return { success: false, message: '缺少必要线索', isCorrect: false, scoreChange: 0, nextStage: false };
        }

        this._takenActionIds.add(actionId);

        let scoreChange = action.scoreImpact || 0;
        let message = action.consequence;
        let nextStage = false;

        if (!action.isCorrect) {
            const errorRecord: IErrorRecord = {
                caseId: this._currentCase.id,
                stage: currentStage.stage as GameConstants.CaseStage,
                actionId: actionId,
                errorCategory: action.errorCategory || GameConstants.ErrorCategory.STRATEGIC,
                errorReason: action.errorReason || '策略失误',
                timestamp: Date.now()
            };
            this._errorRecords.push(errorRecord);

            if (scoreChange >= 0) {
                scoreChange = -GameConstants.WRONG_ACTION_PENALTY;
            }
        }

        this._currentScore = Math.max(0, Math.min(this.getMaxScore(), this._currentScore + scoreChange));

        if (action.unlockClueIds) {
            action.unlockClueIds.forEach(clueId => {
                const clue = this._currentCase!.clues.find(c => c.id === clueId);
                if (clue && clue.missingPage) {
                    const missRecord: IMaterialMissRecord = {
                        caseId: this._currentCase!.id,
                        stage: currentStage.stage as GameConstants.CaseStage,
                        clueId: clueId,
                        triggerAction: actionId,
                        reason: clue.missingPageReason || '材料缺页',
                        timestamp: Date.now()
                    };
                    this._materialMissRecords.push(missRecord);
                    this._currentScore -= GameConstants.CLUE_MISS_PENALTY;
                }
                this._discoveredClueIds.add(clueId);
            });
        }

        if (action.nextStage) {
            nextStage = this.advanceToStage(action.nextStage);
        }

        if (this._clientTrustLevel !== undefined) {
            if (action.isCorrect) {
                this._clientTrustLevel = Math.min(100, this._clientTrustLevel + 5);
            } else {
                this._clientTrustLevel = Math.max(0, this._clientTrustLevel - 10);
            }
        }

        return {
            success: true,
            message,
            isCorrect: action.isCorrect,
            scoreChange,
            nextStage
        };
    }

    private advanceToStage(targetStage: GameConstants.CaseStage): boolean {
        if (!this._currentCase) return false;

        const targetIndex = this._currentCase.stages.findIndex(s => s.stage === targetStage);
        if (targetIndex === -1) {
            console.warn(`[GameManager] Stage ${targetStage} not found`);
            return false;
        }

        this._currentStageIndex = targetIndex;
        const stageConfig = this._currentCase.stages[targetIndex];
        
        stageConfig.clueIds.forEach(clueId => {
            if (!this._discoveredClueIds.has(clueId)) {
                const clue = this._currentCase!.clues.find(c => c.id === clueId);
                if (clue && clue.missingPage) {
                    const missRecord: IMaterialMissRecord = {
                        caseId: this._currentCase!.id,
                        stage: targetStage,
                        clueId: clueId,
                        triggerAction: 'stage_advance',
                        reason: clue.missingPageReason || '材料缺页',
                        timestamp: Date.now()
                    };
                    this._materialMissRecords.push(missRecord);
                }
                this._discoveredClueIds.add(clueId);
            }
        });

        if (targetStage === GameConstants.CaseStage.CLOSED) {
            this.endCase();
        }

        console.log(`[GameManager] Advanced to stage: ${targetStage}`);
        return true;
    }

    public endCase(): ITrainingRecord | null {
        if (!this._currentCase || !this._isPlaying) return null;

        const endTime = Date.now();
        const finalScore = this._currentScore;
        const passed = finalScore >= GameConstants.BASE_PASS_SCORE;
        const perfect = finalScore >= this.getMaxScore();

        const record: ITrainingRecord = {
            id: `record_${this._currentCase.id}_${endTime}`,
            caseId: this._currentCase.id,
            startTime: this._startTime,
            endTime: endTime,
            score: finalScore,
            maxScore: this.getMaxScore(),
            passed,
            perfect,
            currentStage: this.getCurrentStage()?.stage as GameConstants.CaseStage || GameConstants.CaseStage.CLOSED,
            discoveredClueIds: Array.from(this._discoveredClueIds),
            takenActionIds: Array.from(this._takenActionIds),
            errorRecords: [...this._errorRecords],
            materialMissRecords: [...this._materialMissRecords],
            totalPlayTime: endTime - this._startTime
        };

        SaveManager.instance.addTrainingRecord(record);

        if (passed) {
            SaveManager.instance.completeCase(this._currentCase.id);
            SaveManager.instance.addScore(finalScore);
            this.checkUnlocks();
        }

        this._isPlaying = false;
        SaveManager.instance.setCurrentCase(null);

        console.log(`[GameManager] Case ended. Score: ${finalScore}, Passed: ${passed}, Perfect: ${perfect}`);
        return record;
    }

    private checkUnlocks(): void {
        if (!this._currentCase) return;

        const allLevels = ConfigManager.instance.getAllLevels();
        const totalScore = SaveManager.instance.getTotalScore();

        allLevels.forEach(level => {
            if (!SaveManager.instance.isLevelUnlocked(level.id) && totalScore >= level.requiredScore) {
                SaveManager.instance.unlockLevel(level.id);
                console.log(`[GameManager] Unlocked level: ${level.name}`);
            }
        });

        const allClients = ConfigManager.instance.getAllClients();
        const completedCases = SaveManager.instance.getSave().completedCaseIds.length;

        allClients.forEach(client => {
            if (!SaveManager.instance.isClientUnlocked(client.id)) {
                const clientCases = ConfigManager.instance.getCasesByClient(client.id);
                const completedClientCases = clientCases.filter(
                    c => SaveManager.instance.isCaseCompleted(c.id)
                );
                if (completedClientCases.length > 0 && completedClientCases.length >= Math.ceil(clientCases.length * 0.3)) {
                    SaveManager.instance.unlockClient(client.id);
                    console.log(`[GameManager] Unlocked client: ${client.name}`);
                }
            }
        });
    }

    public getClientTrustLevel(): number {
        return this._clientTrustLevel;
    }

    public getDayCount(): number {
        return this._dayCount;
    }

    public advanceDay(): void {
        this._dayCount++;
    }

    public isPlaying(): boolean {
        return this._isPlaying;
    }

    public getErrorRecords(): IErrorRecord[] {
        return [...this._errorRecords];
    }

    public getMaterialMissRecords(): IMaterialMissRecord[] {
        return [...this._materialMissRecords];
    }

    public getStageProgress(): number {
        if (!this._currentCase) return 0;
        return (this._currentStageIndex + 1) / this._currentCase.stages.length;
    }

    public canAffordAction(actionId: string): boolean {
        const action = this._currentCase?.actions.find(a => a.id === actionId);
        if (!action) return false;
        return action.requiredClueIds.every(id => this._discoveredClueIds.has(id));
    }

    public restartCase(): boolean {
        if (!this._currentCase) return false;
        const caseId = this._currentCase.id;
        return this.startCase(caseId);
    }

    public getTrialSchedule(): any[] {
        if (!this._currentCase) return [];
        return ConfigManager.instance.getTrialSchedule(this._currentCase.id) || [];
    }
}
