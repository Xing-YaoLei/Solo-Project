import { _decorator, resources, JsonAsset, log, error } from 'cc';
import { ConfigTypes } from '../types/ConfigTypes';

const { ccclass, property } = _decorator;

@ccclass('ConfigManager')
export class ConfigManager {

    private static _instance: ConfigManager | null = null;
    public static get instance(): ConfigManager {
        if (!ConfigManager._instance) {
            ConfigManager._instance = new ConfigManager();
        }
        return ConfigManager._instance;
    }

    private levelsConfig: ConfigTypes.LevelsConfigFile | null = null;
    private tasksConfig: ConfigTypes.TasksConfigFile | null = null;
    private cluesConfig: ConfigTypes.CluesConfigFile | null = null;
    private prescriptionsConfig: ConfigTypes.PrescriptionsConfigFile | null = null;
    private tutorialsConfig: ConfigTypes.TutorialsConfigFile | null = null;
    private questionSetsConfig: ConfigTypes.QuestionSetsConfigFile | null = null;
    private scenesConfig: ConfigTypes.ScenesConfigFile | null = null;

    private loadedCount: number = 0;
    private totalConfigs: number = 7;
    private loadingCallbacks: Array<(success: boolean) => void> = [];
    private isLoaded: boolean = false;

    private constructor() {}

    public preloadAll(onComplete?: (success: boolean) => void): void {
        if (this.isLoaded) {
            onComplete?.(true);
            return;
        }
        if (onComplete) {
            this.loadingCallbacks.push(onComplete);
        }

        this.loadConfig<ConfigTypes.LevelsConfigFile>('configs/LevelsConfig', (data) => {
            this.levelsConfig = data;
            this.checkAllLoaded();
        });
        this.loadConfig<ConfigTypes.TasksConfigFile>('configs/TasksConfig', (data) => {
            this.tasksConfig = data;
            this.checkAllLoaded();
        });
        this.loadConfig<ConfigTypes.CluesConfigFile>('configs/CluesConfig', (data) => {
            this.cluesConfig = data;
            this.checkAllLoaded();
        });
        this.loadConfig<ConfigTypes.PrescriptionsConfigFile>('configs/PrescriptionsConfig', (data) => {
            this.prescriptionsConfig = data;
            this.checkAllLoaded();
        });
        this.loadConfig<ConfigTypes.TutorialsConfigFile>('configs/TutorialsConfig', (data) => {
            this.tutorialsConfig = data;
            this.checkAllLoaded();
        });
        this.loadConfig<ConfigTypes.QuestionSetsConfigFile>('configs/QuestionSetsConfig', (data) => {
            this.questionSetsConfig = data;
            this.checkAllLoaded();
        });
        this.loadConfig<ConfigTypes.ScenesConfigFile>('configs/ScenesConfig', (data) => {
            this.scenesConfig = data;
            this.checkAllLoaded();
        });
    }

    private loadConfig<T>(path: string, onSuccess: (data: T) => void): void {
        resources.load(path, JsonAsset, (err, asset) => {
            if (err) {
                error(`[ConfigManager] 加载配置失败: ${path}`, err);
            } else {
                try {
                    const data = JSON.parse(JSON.stringify(asset.json)) as T;
                    onSuccess(data);
                } catch (e) {
                    error(`[ConfigManager] 解析配置失败: ${path}`, e);
                }
            }
        });
    }

    private checkAllLoaded(): void {
        this.loadedCount++;
        if (this.loadedCount >= this.totalConfigs) {
            this.isLoaded = true;
            log('[ConfigManager] 所有配置加载完成');
            const callbacks = [...this.loadingCallbacks];
            this.loadingCallbacks = [];
            callbacks.forEach(cb => cb(true));
        }
    }

    public getIsLoaded(): boolean {
        return this.isLoaded;
    }

    public getAllLevels(): ConfigTypes.LevelConfig[] {
        return this.levelsConfig?.levels || [];
    }

    public getLevelById(id: string): ConfigTypes.LevelConfig | null {
        return this.levelsConfig?.levels.find(l => l.id === id) || null;
    }

    public getTaskById(id: string): ConfigTypes.TaskConfig | null {
        return this.tasksConfig?.tasks[id] || null;
    }

    public getClueById(id: string): ConfigTypes.ClueConfig | null {
        return this.cluesConfig?.clues[id] || null;
    }

    public getCluesByIds(ids: string[]): ConfigTypes.ClueConfig[] {
        return ids.map(id => this.getClueById(id)).filter(c => c !== null) as ConfigTypes.ClueConfig[];
    }

    public getPrescriptionById(id: string): ConfigTypes.PrescriptionConfig | null {
        return this.prescriptionsConfig?.prescriptions[id] || null;
    }

    public getTutorialById(id: string): ConfigTypes.TutorialConfig | null {
        return this.tutorialsConfig?.tutorials[id] || null;
    }

    public getTutorialsByTrigger(condition: ConfigTypes.TutorialTriggerCondition): ConfigTypes.TutorialConfig[] {
        const tutorials: ConfigTypes.TutorialConfig[] = [];
        if (!this.tutorialsConfig) return tutorials;
        for (const id in this.tutorialsConfig.tutorials) {
            const tut = this.tutorialsConfig.tutorials[id];
            if (tut.triggerCondition === condition) {
                tutorials.push(tut);
            }
        }
        return tutorials.sort((a, b) => a.order - b.order);
    }

    public getQuestionSetById(id: string): ConfigTypes.QuestionSetConfig | null {
        return this.questionSetsConfig?.questionSets[id] || null;
    }

    public getSceneById(id: string): ConfigTypes.SceneConfig | null {
        return this.scenesConfig?.scenes[id] || null;
    }

    public getLevelsByPrescriptionCategory(category: ConfigTypes.PrescriptionCategory): ConfigTypes.LevelConfig[] {
        return this.getAllLevels().filter(level => {
            const prescription = this.getPrescriptionById(level.prescriptionId);
            return prescription?.category === category;
        });
    }
}
