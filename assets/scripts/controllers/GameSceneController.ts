import { _decorator, Node, Label, UITransform, Sprite, Color, view } from 'cc';
import { UIBase } from '../ui/UIBase';
import { GameManager } from '../managers/GameManager';
import { DataManager } from '../managers/DataManager';
import { EventManager, GameEvents } from '../utils/EventManager';
import { InputManager } from '../managers/InputManager';
import { AudioManager } from '../managers/AudioManager';
import { MainMenu } from '../ui/MainMenu';

const { ccclass, property } = _decorator;

@ccclass('GameSceneController')
export class GameSceneController extends UIBase {
    @property(Node)
    mainMenuNode: Node | null = null;

    @property(Node)
    hudNode: Node | null = null;

    @property(Node)
    taskBriefingNode: Node | null = null;

    @property(Node)
    cluePanelNode: Node | null = null;

    @property(Node)
    documentPanelNode: Node | null = null;

    @property(Node)
    approvalPanelNode: Node | null = null;

    @property(Node)
    resultPanelNode: Node | null = null;

    @property(Node)
    reviewPanelNode: Node | null = null;

    @property(Node)
    levelSelectNode: Node | null = null;

    private _inited = false;

    onInit(): void {
        if (this._inited) return;
        this._inited = true;

        this.initManagers();
        this.initEvents();
        this.initUI();

        EventManager.instance.emit(GameEvents.UI_SHOW_MENU);
    }

    onStart(): void {
        this.showMainMenu();
    }

    private initManagers(): void {
        GameManager.instance.init();
        InputManager.instance.attach();
        AudioManager.instance.init();
    }

    private initEvents(): void {
        this.on(GameEvents.UI_SHOW_MENU, this.showMainMenu.bind(this));
        this.on(GameEvents.UI_SHOW_LEVEL_SELECT, this.showLevelSelect.bind(this));
        this.on(GameEvents.UI_SHOW_RESULT, this.showResult.bind(this));
        this.on(GameEvents.GAME_START, this.onGameStart.bind(this));
    }

    private initUI(): void {
        this.hideAllPanels();
    }

    private hideAllPanels(): void {
        if (this.mainMenuNode) this.mainMenuNode.active = false;
        if (this.hudNode) this.hudNode.active = false;
        if (this.taskBriefingNode) this.taskBriefingNode.active = false;
        if (this.cluePanelNode) this.cluePanelNode.active = false;
        if (this.documentPanelNode) this.documentPanelNode.active = false;
        if (this.approvalPanelNode) this.approvalPanelNode.active = false;
        if (this.resultPanelNode) this.resultPanelNode.active = false;
        if (this.reviewPanelNode) this.reviewPanelNode.active = false;
        if (this.levelSelectNode) this.levelSelectNode.active = false;
    }

    private showMainMenu(): void {
        this.hideAllPanels();
        if (this.mainMenuNode) {
            this.mainMenuNode.active = true;
            const mainMenu = this.mainMenuNode.getComponent(MainMenu) as MainMenu | null;
            if (mainMenu && mainMenu.showMenu) {
                mainMenu.showMenu();
            }
        }
    }

    private showLevelSelect(): void {
        this.hideAllPanels();
        if (this.levelSelectNode) {
            this.levelSelectNode.active = true;
        }
    }

    private showResult(): void {
        if (this.resultPanelNode) {
            this.resultPanelNode.active = true;
        }
    }

    private onGameStart(levelConfig: any): void {
        if (this.hudNode) {
            this.hudNode.active = true;
        }
    }

    onDestroy(): void {
        InputManager.instance.detach();
        super.onDestroy();
    }
}
