import { _decorator, Component, Node, Label, Button } from 'cc';
import { SceneManager } from '../core/SceneManager';
import { PlayerDataService } from '../services/PlayerDataService';
import { GameMode } from '../data/enums/GameMode';
import { PharmacistRole } from '../data/enums/PharmacistRole';
import { getAccuracy, formatTime } from '../data/PlayerData';

const { ccclass, property } = _decorator;

@ccclass('MainMenuScene')
export class MainMenuScene extends Component {
    @property(Label)
    playerNameLabel: Label | null = null;

    @property(Label)
    playerRoleLabel: Label | null = null;

    @property(Label)
    trainingTimeLabel: Label | null = null;

    @property(Label)
    accuracyLabel: Label | null = null;

    @property(Label)
    totalTasksLabel: Label | null = null;

    @property(Node)
    formalTrainingButton: Node | null = null;

    @property(Node)
    freePracticeButton: Node | null = null;

    @property(Node)
    roleSelectPanel: Node | null = null;

    onLoad() {
        PlayerDataService.instance.loadPlayerData();
    }

    start() {
        this.refreshPlayerInfo();
        this.setupButtons();
    }

    private refreshPlayerInfo(): void {
        const playerData = PlayerDataService.instance.loadPlayerData();
        const stats = PlayerDataService.instance.getPlayerStats();

        if (this.playerNameLabel) {
            this.playerNameLabel.string = playerData.playerName;
        }
        if (this.playerRoleLabel) {
            this.playerRoleLabel.string = PharmacistRole.getDisplayName(playerData.role);
        }
        if (this.trainingTimeLabel) {
            this.trainingTimeLabel.string = stats.totalTrainingTime;
        }
        if (this.accuracyLabel) {
            this.accuracyLabel.string = `${stats.accuracy}%`;
        }
        if (this.totalTasksLabel) {
            this.totalTasksLabel.string = `${stats.totalTasks}题`;
        }
    }

    private setupButtons(): void {
        if (this.formalTrainingButton) {
            this.formalTrainingButton.on(Node.EventType.TOUCH_END, () => {
                this.enterLevelSelect(GameMode.FORMAL_TRAINING);
            }, this);
        }

        if (this.freePracticeButton) {
            this.freePracticeButton.on(Node.EventType.TOUCH_END, () => {
                this.enterLevelSelect(GameMode.FREE_PRACTICE);
            }, this);
        }

        if (this.playerRoleLabel) {
            this.playerRoleLabel.node.on(Node.EventType.TOUCH_END, () => {
                this.showRoleSelect();
            }, this);
        }
    }

    private async enterLevelSelect(mode: GameMode): Promise<void> {
        await SceneManager.instance.loadScene('LevelSelect', { mode });
    }

    private showRoleSelect(): void {
        if (!this.roleSelectPanel) return;

        this.roleSelectPanel.active = true;

        const roles = [PharmacistRole.REVIEWER, PharmacistRole.SALES, PharmacistRole.REPLENISHMENT];
        const roleButtons = this.roleSelectPanel.getComponentsInChildren(Button);

        roleButtons.forEach((btn, index) => {
            if (roles[index]) {
                const role = roles[index];
                const label = btn.getComponentInChildren(Label);
                if (label) {
                    label.string = PharmacistRole.getDisplayName(role);
                }
                btn.node.off(Node.EventType.TOUCH_END);
                btn.node.on(Node.EventType.TOUCH_END, () => {
                    this.selectRole(role);
                }, this);
            }
        });
    }

    private selectRole(role: PharmacistRole): void {
        PlayerDataService.instance.updatePlayerRole(role);
        this.refreshPlayerInfo();
        if (this.roleSelectPanel) {
            this.roleSelectPanel.active = false;
        }
    }

    onDestroy() {
        if (this.formalTrainingButton) {
            this.formalTrainingButton.off(Node.EventType.TOUCH_END);
        }
        if (this.freePracticeButton) {
            this.freePracticeButton.off(Node.EventType.TOUCH_END);
        }
        if (this.playerRoleLabel) {
            this.playerRoleLabel.node.off(Node.EventType.TOUCH_END);
        }
    }
}
