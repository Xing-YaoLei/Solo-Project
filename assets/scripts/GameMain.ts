import { _decorator, Component, director, game, view, log, error } from 'cc';
import { DataManager } from './managers/DataManager';
import { GameManager } from './managers/GameManager';
import { InputManager } from './managers/InputManager';
import { AudioManager } from './managers/AudioManager';
import { StorageManager } from './utils/StorageManager';

const { ccclass, property } = _decorator;

@ccclass('GameMain')
export class GameMain extends Component {
    @property()
    debugMode: boolean = false;

    private static _inited = false;

    onLoad(): void {
        if (GameMain._inited) return;
        GameMain._inited = true;

        this.initManagers();
        this.loadConfigs();
    }

    start(): void {
        log('[GameMain] Game started');
    }

    private initManagers(): void {
        StorageManager.instance;
        AudioManager.instance.init();
        GameManager.instance.init();
        InputManager.instance.attach();
    }

    private async loadConfigs(): Promise<void> {
        try {
            await DataManager.instance.loadAllConfig();
            log('[GameMain] Configs loaded successfully');
        } catch (err) {
            error('[GameMain] Failed to load configs:', err);
        }
    }

    onDestroy(): void {
        InputManager.instance.detach();
    }
}
