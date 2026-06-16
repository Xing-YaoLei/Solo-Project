import { _decorator, Component, Node, Label } from 'cc';
import { SceneManager } from '../core/SceneManager';
import { EventBus } from '../core/EventBus';
import { GameEventType } from '../data/enums/GameEventType';
import { LevelLoader } from '../services/LevelLoader';
import { GameFlowController, type LevelCompletionData } from '../services/GameFlowController';
import type { LevelConfig, TaskConfig } from '../data/LevelConfig';
import { GameMode } from '../data/enums/GameMode';
import type { TaskResult } from '../data/GameState';
import { TaskPanel } from '../components/TaskPanel';
import { InfoPanel, type InfoPanelType } from '../components/InfoPanel';
import { ActionBar } from '../components/ActionBar';
import { TiledMapManager } from '../tiled/TiledMapManager';

const { ccclass, property } = _decorator;

@ccclass('GameScene')
export class GameScene extends Component {
    @property(TaskPanel)
    taskPanel: TaskPanel | null = null;

    @property(InfoPanel)
    infoPanel: InfoPanel | null = null;

    @property(ActionBar)
    actionBar: ActionBar | null = null;

    @property(TiledMapManager)
    tiledMapManager: TiledMapManager | null = null;

    @property(Node)
    prescriptionButton: Node | null = null;

    @property(Node)
    replenishmentButton: Node | null = null;

    @property(Node)
    insuranceButton: Node | null = null;

    @property(Node)
    pausePanel: Node | null = null;

    @property(Label)
    taskDescriptionLabel: Label | null = null;

    private currentLevel: LevelConfig | null = null;
    private currentMode: GameMode = GameMode.FORMAL_TRAINING;

    async onLoad() {
        const params = SceneManager.instance.getParams();
        const levelId = params.levelId as string;
        this.currentMode = params.mode as GameMode;

        this.currentLevel = await LevelLoader.instance.getLevelById(levelId);
        if (!this.currentLevel) {
            console.error(`Level ${levelId} not found`);
            await SceneManager.instance.goBack();
            return;
        }

        GameFlowController.instance.startLevel(this.currentLevel, this.currentMode);

        EventBus.instance.on(GameEventType.LEVEL_COMPLETED, this.onLevelCompleted, this);
        EventBus.instance.on(GameEventType.PAUSE, this.onPause, this);
        EventBus.instance.on(GameEventType.RESUME, this.onResume, this);
    }

    start() {
        if (!this.currentLevel) return;

        this.setupInfoButtons();
        this.setupActionBar();
        this.loadCurrentTask();

        if (this.tiledMapManager) {
            this.tiledMapManager.loadMap('pharmacy');
            this.tiledMapManager.onAreaClicked = (area: string) => {
                this.onMapAreaClicked(area);
            };
        }
    }

    private setupInfoButtons(): void {
        const buttons: { node: Node | null; type: InfoPanelType }[] = [
            { node: this.prescriptionButton, type: 'prescription' },
            { node: this.replenishmentButton, type: 'replenishment' },
            { node: this.insuranceButton, type: 'insurance' }
        ];

        buttons.forEach(config => {
            if (config.node) {
                config.node.on(Node.EventType.TOUCH_END, () => {
                    this.showInfoPanel(config.type);
                }, this);
            }
        });
    }

    private setupActionBar(): void {
        if (!this.actionBar) return;

        this.actionBar.setOnActionDone((result: TaskResult) => {
            const hasMore = GameFlowController.instance.advanceToNextTask();
            if (hasMore) {
                this.loadCurrentTask();
            }
        });
    }

    private loadCurrentTask(): void {
        const task = GameFlowController.instance.getCurrentTask();
        const state = GameFlowController.instance.getState();

        if (!task || !state.currentLevel) return;

        if (this.taskPanel) {
            this.taskPanel.setTask(task, state.currentTaskIndex, state.currentLevel.tasks.length);
        }

        if (this.infoPanel) {
            this.infoPanel.setTask(task, this.currentLevel!.prescriptionBlur);
        }

        if (this.tiledMapManager) {
            this.tiledMapManager.highlightTaskArea(state.currentTaskIndex);
        }

        this.highlightActiveButton(null);

        if (this.actionBar) {
            this.actionBar.reset();
        }

        if (this.taskDescriptionLabel) {
            this.taskDescriptionLabel.string = task.description;
        }
    }

    private showInfoPanel(type: InfoPanelType): void {
        if (this.infoPanel) {
            this.infoPanel.showPanel(type);
        }
        this.highlightActiveButton(type);
    }

    private highlightActiveButton(activeType: InfoPanelType | null): void {
        const buttons: { node: Node | null; type: string }[] = [
            { node: this.prescriptionButton, type: 'prescription' },
            { node: this.replenishmentButton, type: 'replenishment' },
            { node: this.insuranceButton, type: 'insurance' }
        ];

        buttons.forEach(config => {
            if (config.node) {
                config.node.opacity = config.type === activeType ? 255 : 150;
            }
        });
    }

    private onMapAreaClicked(area: string): void {
        const areaToType: Record<string, InfoPanelType> = {
            'prescription_area': 'prescription',
            'replenishment_area': 'replenishment',
            'insurance_area': 'insurance'
        };

        const type = areaToType[area];
        if (type) {
            this.showInfoPanel(type);
        }
    }

    private onPause(): void {
        if (this.pausePanel) {
            this.pausePanel.active = true;
        }
    }

    private onResume(): void {
        if (this.pausePanel) {
            this.pausePanel.active = false;
        }
    }

    private async onLevelCompleted(data: LevelCompletionData): Promise<void> {
        await SceneManager.instance.loadScene('Result', data);
    }

    public onResumeButtonClick(): void {
        GameFlowController.instance.resumeGame();
    }

    public async onQuitButtonClick(): Promise<void> {
        GameFlowController.instance.reset();
        await SceneManager.instance.goBack();
    }

    onDestroy() {
        EventBus.instance.off(GameEventType.LEVEL_COMPLETED, this.onLevelCompleted, this);
        EventBus.instance.off(GameEventType.PAUSE, this.onPause, this);
        EventBus.instance.off(GameEventType.RESUME, this.onResume, this);

        GameFlowController.instance.reset();
    }
}
