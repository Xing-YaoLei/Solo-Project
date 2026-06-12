import { _decorator, Component, Node, Button, Label, Sprite, Color, Prefab, instantiate, Vec3, UITransform, ScrollView, director, find, UIOpacity } from 'cc';
import { EventManager, GameEvents } from '../core/EventManager';
import { ConfigManager, ConfigKeys } from '../core/ConfigManager';
import { LevelManager } from '../game/LevelManager';
import { LevelConfig } from '../models/Level';
import { loadAllConfigs } from '../config/GameConfigs';
import { SceneBuilder } from '../utils/SceneBuilder';
const { ccclass, property } = _decorator;

@ccclass('MainMenu')
export class MainMenu extends Component {
    @property(Node)
    public startBtn: Node | null = null;

    @property(Node)
    public achievementsBtn: Node | null = null;

    @property(Node)
    public settingsBtn: Node | null = null;

    @property(Node)
    public levelSelectPanel: Node | null = null;

    @property(Node)
    public levelsContainer: Node | null = null;

    @property(Node)
    public backToMenuBtn: Node | null = null;

    @property
    public itemGap: number = 20;

    @property
    public itemHeight: number = 140;

    @property([Button])
    public levelButtons: Button[] = [];

    private _isInited: boolean = false;

    onLoad() {
        if (!this._isInited) {
            try {
                loadAllConfigs();
                this._isInited = true;
                console.log('[MainMenu] Configs loaded successfully');
            } catch (e) {
                console.error('[MainMenu] Failed to load configs:', e);
            }
        }

        if (this.startBtn) {
            this.startBtn.on(Node.EventType.TOUCH_END, this.onStartClick, this);
        }
        if (this.achievementsBtn) {
            this.achievementsBtn.on(Button.EventType.CLICK, this.onAchievementsClick, this);
        }
        if (this.settingsBtn) {
            this.settingsBtn.on(Button.EventType.CLICK, this.onSettingsClick, this);
        }
        if (this.backToMenuBtn) {
            this.backToMenuBtn.on(Button.EventType.CLICK, this.onBackToMenu, this);
        }

        if (this.levelSelectPanel) this.levelSelectPanel.active = false;
    }

    onDestroy() {
        if (this.startBtn) {
            this.startBtn.off(Node.EventType.TOUCH_END, this.onStartClick, this);
        }
        if (this.achievementsBtn) {
            this.achievementsBtn.off(Button.EventType.CLICK, this.onAchievementsClick, this);
        }
        if (this.settingsBtn) {
            this.settingsBtn.off(Button.EventType.CLICK, this.onSettingsClick, this);
        }
        if (this.backToMenuBtn) {
            this.backToMenuBtn.off(Button.EventType.CLICK, this.onBackToMenu, this);
        }
    }

    private onStartClick(): void {
        console.log('[MainMenu] Start button clicked, building game scene...');
        this.buildAndEnterGameScene();
    }

    private buildAndEnterGameScene(): void {
        const scene = director.getScene();
        if (!scene) {
            console.error('[MainMenu] No active scene');
            return;
        }

        const oldCanvas = find('Canvas', scene);
        if (oldCanvas) {
            oldCanvas.active = false;
        }

        SceneBuilder.buildGameScene(scene);

        EventManager.getInstance().emit(GameEvents.SHOW_TOAST, {
            message: '游戏场景加载完成！',
            type: 'success'
        });
    }

    private onAchievementsClick(): void {
        EventManager.getInstance().emit(GameEvents.SHOW_TOAST, {
            message: '成就系统开发中...',
            type: 'info'
        });
    }

    private onSettingsClick(): void {
        EventManager.getInstance().emit(GameEvents.SHOW_TOAST, {
            message: '设置功能开发中...',
            type: 'info'
        });
    }

    private onBackToMenu(): void {
        if (this.levelSelectPanel) this.levelSelectPanel.active = false;
    }
}
