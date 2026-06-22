import { GameConstants } from './GameConstants';
import { ICase, ILevelConfig, ITutorial, IAssetConfig, IClientProfile, ITrialScheduleItem } from './GameInterfaces';
import { IResourceLoader, ResourceFactory } from './PlatformAdapters';

export class ConfigManager {

    private static _instance: ConfigManager | null = null;

    public static get instance(): ConfigManager {
        if (!ConfigManager._instance) {
            ConfigManager._instance = new ConfigManager();
        }
        return ConfigManager._instance;
    }

    public static reset(): void {
        ConfigManager._instance = null;
    }

    private _cases: Map<string, ICase> = new Map();
    private _levels: Map<string, ILevelConfig> = new Map();
    private _tutorials: Map<string, ITutorial> = new Map();
    private _assets: Map<string, IAssetConfig> = new Map();
    private _clients: Map<string, IClientProfile> = new Map();
    private _trialSchedules: Map<string, ITrialScheduleItem[]> = new Map();
    private _configLoaded: boolean = false;

    private constructor() {
    }

    public setResourceLoader(loader: IResourceLoader): void {
        ResourceFactory.setInstance(loader);
    }

    public async loadAllConfigs(basePath: string = 'assets/resources/configs'): Promise<void> {
        if (this._configLoaded) {
            return;
        }

        const loader = ResourceFactory.getInstance();

        try {
            const [casesData, levelsData, tutorialsData, assetsData, clientsData, trialSchedulesData] = await Promise.all([
                this.safeLoadJson(loader, `${basePath}/cases.json`, []),
                this.safeLoadJson(loader, `${basePath}/levels.json`, []),
                this.safeLoadJson(loader, `${basePath}/tutorials.json`, []),
                this.safeLoadJson(loader, `${basePath}/assets.json`, []),
                this.safeLoadJson(loader, `${basePath}/clients.json`, []),
                this.safeLoadJson(loader, `${basePath}/trial_schedules.json`, {})
            ]);

            const casesArray: ICase[] = casesData;
            casesArray.forEach(c => this._cases.set(c.id, c));

            const levelsArray: ILevelConfig[] = levelsData;
            levelsArray.forEach(l => this._levels.set(l.id, l));

            const tutorialsArray: ITutorial[] = tutorialsData;
            tutorialsArray.forEach(t => this._tutorials.set(t.id, t));

            const assetsArray: IAssetConfig[] = assetsData;
            assetsArray.forEach(a => this._assets.set(a.id, a));

            const clientsArray: IClientProfile[] = clientsData;
            clientsArray.forEach(c => this._clients.set(c.id, c));

            const schedulesData = trialSchedulesData;
            for (const caseId in schedulesData) {
                this._trialSchedules.set(caseId, schedulesData[caseId]);
            }

            this._configLoaded = true;
            console.log(`[ConfigManager] Loaded: ${casesArray.length} cases, ${levelsArray.length} levels, ${tutorialsArray.length} tutorials, ${assetsArray.length} assets, ${clientsArray.length} clients, ${Object.keys(schedulesData).length} schedules`);
        } catch (error) {
            console.error('[ConfigManager] Failed to load configs:', error);
            throw error;
        }
    }

    private async safeLoadJson(loader: IResourceLoader, path: string, defaultValue: any): Promise<any> {
        try {
            return await loader.loadJson(path);
        } catch (e) {
            console.warn(`[ConfigManager] ${path} not found, using default`);
            return defaultValue;
        }
    }

    public loadFromData(data: {
        cases?: ICase[];
        levels?: ILevelConfig[];
        tutorials?: ITutorial[];
        assets?: IAssetConfig[];
        clients?: IClientProfile[];
        trialSchedules?: Record<string, ITrialScheduleItem[]>;
    }): void {
        if (data.cases) data.cases.forEach(c => this._cases.set(c.id, c));
        if (data.levels) data.levels.forEach(l => this._levels.set(l.id, l));
        if (data.tutorials) data.tutorials.forEach(t => this._tutorials.set(t.id, t));
        if (data.assets) data.assets.forEach(a => this._assets.set(a.id, a));
        if (data.clients) data.clients.forEach(c => this._clients.set(c.id, c));
        if (data.trialSchedules) {
            for (const k in data.trialSchedules) {
                this._trialSchedules.set(k, data.trialSchedules[k]);
            }
        }
        this._configLoaded = true;
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

    public getAllTutorials(): ITutorial[] {
        return Array.from(this._tutorials.values());
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

    public getTrialSchedule(caseId: string): ITrialScheduleItem[] {
        return this._trialSchedules.get(caseId) || [];
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
