import { _decorator, Component, JsonAsset, assetManager, Node } from "cc";
import { LevelsConfig, ScenariosConfig } from "../game/LevelConfig";
import { CapacityRuleData } from "../appointment/CapacityRule";
import { CustomerData } from "../appointment/Customer";
import { ServiceData } from "../appointment/TimeSlot";

const { ccclass, property } = _decorator;

interface CustomersFile {
    customers: CustomerData[];
    services: ServiceData[];
}

interface CapacityRulesFile {
    capacityRules: CapacityRuleData[];
}

@ccclass("ConfigLoader")
export class ConfigLoader extends Component {
    private _loaded: Map<string, any> = new Map();
    private _pending: Set<string> = new Set();

    get isLoaded(): boolean {
        return this._pending.size === 0;
    }

    loadAll(): Promise<void> {
        const promises: Promise<void>[] = [
            this._loadJson<LevelsConfig>("configs/levels"),
            this._loadJson<ScenariosConfig>("configs/scenarios"),
            this._loadJson<CapacityRulesFile>("configs/capacity_rules"),
            this._loadJson<CustomersFile>("configs/customers")
        ];
        return Promise.all(promises).then(() => {});
    }

    getLevelsConfig(): LevelsConfig | null {
        return this._loaded.get("configs/levels") as LevelsConfig ?? null;
    }

    getScenariosConfig(): ScenariosConfig | null {
        return this._loaded.get("configs/scenarios") as ScenariosConfig ?? null;
    }

    getCapacityRulesConfig(): CapacityRulesFile | null {
        return this._loaded.get("configs/capacity_rules") as CapacityRulesFile ?? null;
    }

    getCustomersConfig(): CustomersFile | null {
        return this._loaded.get("configs/customers") as CustomersFile ?? null;
    }

    private _loadJson<T>(path: string): Promise<void> {
        this._pending.add(path);
        return new Promise<void>((resolve, reject) => {
            assetManager.resources?.load(path, JsonAsset, (err: Error | null, asset: JsonAsset) => {
                if (err) {
                    this._pending.delete(path);
                    reject(err);
                    return;
                }
                this._loaded.set(path, asset.json as T);
                this._pending.delete(path);
                resolve();
            });
        });
    }
}
