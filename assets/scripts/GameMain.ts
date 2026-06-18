import { _decorator, Component, director, game, view, log, error, Node } from 'cc';
import { DataManager } from './managers/DataManager';
import { GameManager } from './managers/GameManager';
import { InputManager } from './managers/InputManager';
import { AudioManager } from './managers/AudioManager';
import { StorageManager } from './utils/StorageManager';
import { EventManager, GameEvents } from './utils/EventManager';
import { MainMenu } from './ui/MainMenu';

const { ccclass, property } = _decorator;

@ccclass('GameMain')
export class GameMain extends Component {
    @property(Node)
    canvas: Node | null = null;

    @property()
    debugMode: boolean = false;

    private static _inited = false;

    onLoad(): void {
        if (GameMain._inited) return;
        GameMain._inited = true;

        this.initManagers();
        this.loadConfigs();
        this.initEvents();
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

    private initEvents(): void {
        EventManager.instance.on(GameEvents.UI_SHOW_MENU, this._showMainMenu, this);
    }

    private _showMainMenu(): void {
        if (!this.canvas) return;
        const mainMenuNode = this.canvas.getChildByName('MainMenu');
        if (mainMenuNode) {
            mainMenuNode.active = true;
            const mainMenu = mainMenuNode.getComponent(MainMenu);
            if (mainMenu) {
                mainMenu.showMenu();
            }
        }
    }

    private async loadConfigs(): Promise<void> {
        try {
            await DataManager.instance.loadAllConfig();
            log('[GameMain] Configs loaded successfully');
            EventManager.instance.emit(GameEvents.UI_SHOW_MENU);
        } catch (err) {
            error('[GameMain] Failed to load configs:', err);
        }
    }

    onDestroy(): void {
        EventManager.instance.off(GameEvents.UI_SHOW_MENU, this);
        InputManager.instance.detach();
    }
}
