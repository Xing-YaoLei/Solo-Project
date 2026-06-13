import { _decorator, Component, JsonAsset } from "cc";
import { LevelConfig, LevelsConfig, ScenarioConfig, ScenariosConfig } from "./LevelConfig";
import { CapacityRuleData } from "../appointment/CapacityRule";
import { CustomerData } from "../appointment/Customer";
import { ServiceData } from "../appointment/TimeSlot";

const { ccclass, property } = _decorator;

@ccclass("LevelManager")
export class LevelManager extends Component {
    private _levels: Map<string, LevelConfig> = new Map();
    private _scenarios: Map<string, ScenarioConfig> = new Map();
    private _capacityRules: Map<string, CapacityRuleData> = new Map();
    private _customers: Map<string, CustomerData> = new Map();
    private _services: Map<string, ServiceData> = new Map();
    private _currentLevelId: string = "";

    get currentLevel(): LevelConfig | null {
        return this._levels.get(this._currentLevelId) ?? null;
    }

    get currentScenario(): ScenarioConfig | null {
        const level = this.currentLevel;
        if (!level) return null;
        return this._scenarios.get(level.scenarioId) ?? null;
    }

    get currentCapacityRule(): CapacityRuleData | null {
        const level = this.currentLevel;
        if (!level) return null;
        return this._capacityRules.get(level.capacityRuleId) ?? null;
    }

    loadLevelsConfig(data: LevelsConfig): void {
        this._levels.clear();
        for (const level of data.levels) {
            this._levels.set(level.id, level);
        }
    }

    loadScenariosConfig(data: ScenariosConfig): void {
        this._scenarios.clear();
        for (const scenario of data.scenarios) {
            this._scenarios.set(scenario.id, scenario);
        }
    }

    loadCapacityRulesConfig(data: { capacityRules: CapacityRuleData[] }): void {
        this._capacityRules.clear();
        for (const rule of data.capacityRules) {
            this._capacityRules.set(rule.id, rule);
        }
    }

    loadCustomersConfig(data: { customers: CustomerData[]; services: ServiceData[] }): void {
        this._customers.clear();
        this._services.clear();
        for (const c of data.customers) {
            this._customers.set(c.id, c);
        }
        for (const s of data.services) {
            this._services.set(s.id, s);
        }
    }

    selectLevel(levelId: string): boolean {
        if (!this._levels.has(levelId)) return false;
        this._currentLevelId = levelId;
        return true;
    }

    getLevelCustomers(): CustomerData[] {
        const level = this.currentLevel;
        if (!level) return [];
        return level.customerIds
            .map(id => this._customers.get(id))
            .filter((c): c is CustomerData => c !== undefined);
    }

    getLevelServices(): ServiceData[] {
        const result: ServiceData[] = [];
        for (const [, s] of this._services) {
            result.push(s);
        }
        return result;
    }

    getAllLevels(): LevelConfig[] {
        const result: LevelConfig[] = [];
        for (const [, l] of this._levels) {
            result.push(l);
        }
        return result.sort((a, b) => a.difficulty - b.difficulty);
    }

    getNextLevel(currentId: string): LevelConfig | null {
        const levels = this.getAllLevels();
        const idx = levels.findIndex(l => l.id === currentId);
        if (idx < 0 || idx >= levels.length - 1) return null;
        return levels[idx + 1];
    }
}
