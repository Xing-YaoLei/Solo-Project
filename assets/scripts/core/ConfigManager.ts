import { _decorator, Component, JsonAsset, resources } from 'cc';
import { ICase, ILevelConfig, ITutorial, IAssetConfig, IClientProfile, ITrialScheduleItem } from './GameInterfaces';
const { ccclass, property } = _decorator;

@ccclass('ConfigManager')
export class ConfigManager extends Component {

    private static _instance: ConfigManager | null = null;

    public static get instance(): ConfigManager {
        if (!ConfigManager._instance) {
            ConfigManager._instance = new ConfigManager();
        }
        return ConfigManager._instance;
    }

    private _cases: Map<string, ICase> = new Map();
    private _levels: Map<string, ILevelConfig> = new Map();
    private _tutorials: Map<string, ITutorial> = new Map();
    private _assets: Map<string, IAssetConfig> = new Map();
    private _clients: Map<string, IClientProfile> = new Map();
    private _trialSchedules: Map<string, ITrialScheduleItem[]> = new Map();

    private _configLoaded: boolean = false;

    constructor() {
        super();
        if (ConfigManager._instance) {
            console.warn('ConfigManager singleton already exists');
        }
    }

    public async loadAllConfigs(): Promise<void> {
        if (this._configLoaded) {
            return;
        }

        try {
            await Promise.all([
                this.loadCases(),
                this.loadLevels(),
                this.loadTutorials(),
                this.loadAssets(),
                this.loadClients(),
                this.loadTrialSchedules()
            ]);
            this._configLoaded = true;
            console.log('[ConfigManager] All configs loaded successfully');
        } catch (error) {
            console.error('[ConfigManager] Failed to load configs:', error);
            throw error;
        }
    }

    private loadCases(): Promise<void> {
        return new Promise((resolve, reject) => {
            resources.load('configs/cases', JsonAsset, (err, jsonAsset) => {
                if (err) {
                    console.warn('[ConfigManager] cases config not found, using empty');
                    resolve();
                    return;
                }
                const casesArray: ICase[] = jsonAsset.json;
                casesArray.forEach(c => this._cases.set(c.id, c));
                console.log(`[ConfigManager] Loaded ${casesArray.length} cases`);
                resolve();
            });
        });
    }

    private loadLevels(): Promise<void> {
        return new Promise((resolve, reject) => {
            resources.load('configs/levels', JsonAsset, (err, jsonAsset) => {
                if (err) {
                    console.warn('[ConfigManager] levels config not found, using empty');
                    resolve();
                    return;
                }
                const levelsArray: ILevelConfig[] = jsonAsset.json;
                levelsArray.forEach(l => this._levels.set(l.id, l));
                console.log(`[ConfigManager] Loaded ${levelsArray.length} levels`);
                resolve();
            });
        });
    }

    private loadTutorials(): Promise<void> {
        return new Promise((resolve, reject) => {
            resources.load('configs/tutorials', JsonAsset, (err, jsonAsset) => {
                if (err) {
                    console.warn('[ConfigManager] tutorials config not found, using empty');
                    resolve();
                    return;
                }
                const tutorialsArray: ITutorial[] = jsonAsset.json;
                tutorialsArray.forEach(t => this._tutorials.set(t.id, t));
                console.log(`[ConfigManager] Loaded ${tutorialsArray.length} tutorials`);
                resolve();
            });
        });
    }

    private loadAssets(): Promise<void> {
        return new Promise((resolve, reject) => {
            resources.load('configs/assets', JsonAsset, (err, jsonAsset) => {
                if (err) {
                    console.warn('[ConfigManager] assets config not found, using empty');
                    resolve();
                    return;
                }
                const assetsArray: IAssetConfig[] = jsonAsset.json;
                assetsArray.forEach(a => this._assets.set(a.id, a));
                console.log(`[ConfigManager] Loaded ${assetsArray.length} assets`);
                resolve();
            });
        });
    }

    private loadClients(): Promise<void> {
        return new Promise((resolve, reject) => {
            resources.load('configs/clients', JsonAsset, (err, jsonAsset) => {
                if (err) {
                    console.warn('[ConfigManager] clients config not found, using empty');
                    resolve();
                    return;
                }
                const clientsArray: IClientProfile[] = jsonAsset.json;
                clientsArray.forEach(c => this._clients.set(c.id, c));
                console.log(`[ConfigManager] Loaded ${clientsArray.length} clients`);
                resolve();
            });
        });
    }

    private loadTrialSchedules(): Promise<void> {
        return new Promise((resolve, reject) => {
            resources.load('configs/trial_schedules', JsonAsset, (err, jsonAsset) => {
                if (err) {
                    console.warn('[ConfigManager] trial_schedules config not found, using empty');
                    resolve();
                    return;
                }
                const schedulesData = jsonAsset.json;
                for (const caseId in schedulesData) {
                    this._trialSchedules.set(caseId, schedulesData[caseId]);
                }
                console.log(`[ConfigManager] Loaded ${Object.keys(schedulesData).length} trial schedules`);
                resolve();
            });
        });
    }

    public getCase(id: string): ICase | undefined {
        return this._cases.get(id);
    }

    public getAllCases(): ICase[] {
        return Array.from(this._cases.values());
    }

    public getLevel(id: string): ILevelConfig | undefined {
        return this._levels.get(id);
    }

    public getAllLevels(): ILevelConfig[] {
        return Array.from(this._levels.values());
    }

    public getTutorial(id: string): ITutorial | undefined {
        return this._tutorials.get(id);
    }

    public getAsset(id: string): IAssetConfig | undefined {
        return this._assets.get(id);
    }

    public getClient(id: string): IClientProfile | undefined {
        return this._clients.get(id);
    }

    public getAllClients(): IClientProfile[] {
        return Array.from(this._clients.values());
    }

    public getTrialSchedule(caseId: string): ITrialScheduleItem[] | undefined {
        return this._trialSchedules.get(caseId);
    }

    public isConfigLoaded(): boolean {
        return this._configLoaded;
    }

    public getCasesByDifficulty(difficulty: string): ICase[] {
        return this.getAllCases().filter(c => c.difficulty === difficulty);
    }

    public getCasesByClient(clientId: string): ICase[] {
        return this.getAllCases().filter(c => c.clientId === clientId);
    }

    public getClueById(caseId: string, clueId: string): any {
        const caseData = this.getCase(caseId);
        if (!caseData) return null;
        return caseData.clues.find(c => c.id === clueId);
    }

    public getActionById(caseId: string, actionId: string): any {
        const caseData = this.getCase(caseId);
        if (!caseData) return null;
        return caseData.actions.find(a => a.id === actionId);
    }

    public getStageConfig(caseId: string, stage: string): any {
        const caseData = this.getCase(caseId);
        if (!caseData) return null;
        return caseData.stages.find(s => s.stage === stage);
    }
}
