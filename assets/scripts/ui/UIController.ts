import { _decorator, Component, Node, Prefab, instantiate, find, log, warn, Label, Color } from 'cc';
import { GameTypes } from '../types/GameTypes';
import { GameManager, GameEvent } from '../core/GameManager';
import { ConfigManager } from '../core/ConfigManager';
import { TaskPanel } from './TaskPanel';
import { CluePanel } from './CluePanel';
import { ActionPanel } from './ActionPanel';
import { SettlementPanel } from './SettlementPanel';
import { LevelSelectPanel } from './LevelSelectPanel';
import { LeaderboardPanel } from './LeaderboardPanel';

const { ccclass, property } = _decorator;

@ccclass('UIController')
export class UIController extends Component {

    @property(Node)
    levelSelectRoot: Node | null = null;

    @property(Node)
    gameplayRoot: Node | null = null;

    @property(Node)
    settlementRoot: Node | null = null;

    @property(Node)
    leaderboardRoot: Node | null = null;

    @property(LevelSelectPanel)
    levelSelectPanel: LevelSelectPanel | null = null;

    @property(TaskPanel)
    taskPanel: TaskPanel | null = null;

    @property(CluePanel)
    cluePanel: CluePanel | null = null;

    @property(ActionPanel)
    actionPanel: ActionPanel | null = null;

    @property(SettlementPanel)
    settlementPanel: SettlementPanel | null = null;

    @property(LeaderboardPanel)
    leaderboardPanel: LeaderboardPanel | null = null;

    @property(Node)
    taskTabButton: Node | null = null;

    @property(Node)
    clueTabButton: Node | null = null;

    @property(Node)
    actionTabButton: Node | null = null;

    start(): void {
        ConfigManager.instance.preloadAll((success) => {
            if (success) {
                log('[UIController] 配置加载完成，初始化完成');
                this.showLevelSelect();
            } else {
                warn('[UIController] 配置加载失败');
            }
        });

        GameManager.instance.eventTarget.on(GameEvent.PHASE_CHANGED, this.onPhaseChanged, this);
        GameManager.instance.eventTarget.on(GameEvent.TASK_CHANGED, this.onTaskChanged, this);

        this.taskTabButton?.on(Node.EventType.TOUCH_END, () => this.switchGameplayTab('task'), this);
        this.clueTabButton?.on(Node.EventType.TOUCH_END, () => this.switchGameplayTab('clue'), this);
        this.actionTabButton?.on(Node.EventType.TOUCH_END, () => this.switchGameplayTab('action'), this);
    }

    onDestroy(): void {
        GameManager.instance.eventTarget.off(GameEvent.PHASE_CHANGED, this.onPhaseChanged, this);
        GameManager.instance.eventTarget.off(GameEvent.TASK_CHANGED, this.onTaskChanged, this);
    }

    private onPhaseChanged(phase: GameTypes.GamePhase): void {
        switch (phase) {
            case 'MENU':
            case 'LEVEL_SELECT':
                this.showLevelSelect();
                break;
            case 'TASK_ACCEPT':
            case 'CLUE_OBSERVATION':
            case 'ACTION_SELECTION':
            case 'FEEDBACK':
            case 'QUESTION_SET':
                this.showGameplay();
                this.switchGameplayTabByPhase(phase);
                break;
            case 'SETTLEMENT':
            case 'NURSING_LOG':
            case 'BILLING_DETAIL':
                this.showSettlement();
                break;
        }
    }

    private onTaskChanged(): void {
        this.taskPanel?.refresh();
        this.cluePanel?.refresh();
        this.actionPanel?.refresh();
    }

    private showLevelSelect(): void {
        this.levelSelectRoot?.setActive(true);
        this.gameplayRoot?.setActive(false);
        this.settlementRoot?.setActive(false);
        this.leaderboardRoot?.setActive(false);

        this.levelSelectPanel?.refresh();
    }

    private showGameplay(): void {
        this.levelSelectRoot?.setActive(false);
        this.gameplayRoot?.setActive(true);
        this.settlementRoot?.setActive(false);
        this.leaderboardRoot?.setActive(false);
    }

    private showSettlement(): void {
        this.levelSelectRoot?.setActive(false);
        this.gameplayRoot?.setActive(false);
        this.settlementRoot?.setActive(true);
        this.leaderboardRoot?.setActive(false);
    }

    public showLeaderboard(): void {
        this.levelSelectRoot?.setActive(false);
        this.gameplayRoot?.setActive(false);
        this.settlementRoot?.setActive(false);
        this.leaderboardRoot?.setActive(true);

        this.leaderboardPanel?.refresh();
    }

    private switchGameplayTabByPhase(phase: GameTypes.GamePhase): void {
        switch (phase) {
            case 'TASK_ACCEPT':
                this.switchGameplayTab('task');
                break;
            case 'CLUE_OBSERVATION':
                this.switchGameplayTab('clue');
                break;
            case 'ACTION_SELECTION':
            case 'FEEDBACK':
                this.switchGameplayTab('action');
                break;
        }
    }

    private switchGameplayTab(tab: 'task' | 'clue' | 'action'): void {
        if (this.taskPanel) this.taskPanel.node.active = tab === 'task';
        if (this.cluePanel) this.cluePanel.node.active = tab === 'clue';
        if (this.actionPanel) this.actionPanel.node.active = tab === 'action';

        this.updateTabButtonState(tab);
    }

    private updateTabButtonState(activeTab: string): void {
        const setActive = (btn: Node | null, active: boolean) => {
            if (!btn) return;
            const labels = btn.getComponentsInChildren(Label as any);
            labels.forEach(l => {
                l.color = active ? new Color(21, 101, 192) : new Color(97, 97, 97);
            });
        };
        setActive(this.taskTabButton, activeTab === 'task');
        setActive(this.clueTabButton, activeTab === 'clue');
        setActive(this.actionTabButton, activeTab === 'action');
    }
}
