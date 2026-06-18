import { _decorator, Label, Node, Button } from 'cc';
import { UIBase } from './UIBase';
import { GameManager } from '../managers/GameManager';
import { AudioManager } from '../managers/AudioManager';
import { LevelManager } from '../managers/LevelManager';
import { LeaderboardManager } from '../managers/LeaderboardManager';
import { GameEvents } from '../utils/EventManager';

const { ccclass, property } = _decorator;

@ccclass('MainMenu')
export class MainMenu extends UIBase {
    @property(Label)
    titleLabel: Label | null = null;

    @property(Node)
    startButton: Node | null = null;

    @property(Node)
    levelSelectButton: Node | null = null;

    @property(Node)
    leaderboardButton: Node | null = null;

    @property(Node)
    tutorialButton: Node | null = null;

    private _currentLevelId: string = 'level_001';

    onInit(): void {
        if (this.titleLabel) {
            this.titleLabel.string = '家装工地量房报价模拟';
        }
    }

    onStart(): void {
        this.registerInput('confirm', this.onStartGame.bind(this));
    }

    onShow(): void {
        this.playShowAnimation();
    }

    public onStartClicked(): void {
        AudioManager.instance.playClick();
        this.startFirstLevel();
    }

    public onLevelSelectClicked(): void {
        AudioManager.instance.playClick();
        this.emit(GameEvents.UI_SHOW_LEVEL_SELECT);
    }

    public onLeaderboardClicked(): void {
        AudioManager.instance.playClick();
        this.emit(GameEvents.UI_SHOW_LEADERBOARD);
    }

    public onTutorialClicked(): void {
        AudioManager.instance.playClick();
        this.emit(GameEvents.UI_SHOW_TUTORIAL);
    }

    private startFirstLevel(): void {
        const unlocked = LevelManager.instance.getUnlockedLevels();
        if (unlocked.length > 0) {
            this._currentLevelId = unlocked[0];
        }

        if (GameManager.instance.startLevel(this._currentLevelId)) {
            this.hide();
        }
    }

    private onStartGame(source: string): void {
        if (!this.node.active) return;
        AudioManager.instance.playConfirm();
        this.startFirstLevel();
    }

    public showMenu(): void {
        this.show();
    }
}
