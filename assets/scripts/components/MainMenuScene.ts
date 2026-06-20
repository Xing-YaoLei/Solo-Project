import { _decorator, Component, Node, Button, Label, Sprite, Color, tween, Vec3 } from 'cc';
import { GameMode, PostType } from '../models/GameEnums';
import { GameManager } from '../core/GameManager';
import { SceneManager } from '../utils/SceneManager';
import { GameSaveManager } from '../data/GameSaveManager';
const { ccclass, property } = _decorator;

@ccclass('MainMenuScene')
export class MainMenuScene extends Component {
    @property(Label)
    titleLabel: Label | null = null;

    @property(Label)
    subtitleLabel: Label | null = null;

    @property(Node)
    modeSelectionPanel: Node | null = null;

    @property(Node)
    postSelectionPanel: Node | null = null;

    @property(Button)
    formalTrainingBtn: Button | null = null;

    @property(Button)
    freePracticeBtn: Button | null = null;

    @property(Button)
    challengeBtn: Button | null = null;

    @property(Button)
    ticketCheckerBtn: Button | null = null;

    @property(Button)
    reservationClerkBtn: Button | null = null;

    @property(Button)
    siteManagerBtn: Button | null = null;

    @property(Button)
    backBtn: Button | null = null;

    @property(Label)
    totalStarsLabel: Label | null = null;

    @property(Label)
    completedLevelsLabel: Label | null = null;

    private selectedMode: GameMode | null = null;
    private selectedPost: PostType | null = null;

    onLoad() {
        this.registerEvents();
        this.showModeSelection();
        this.updatePlayerStats();
    }

    private registerEvents(): void {
        if (this.formalTrainingBtn) {
            this.formalTrainingBtn.node.on(Button.EventType.CLICK, () => {
                this.onModeSelected(GameMode.FORMAL_TRAINING);
            }, this);
        }
        if (this.freePracticeBtn) {
            this.freePracticeBtn.node.on(Button.EventType.CLICK, () => {
                this.onModeSelected(GameMode.FREE_PRACTICE);
            }, this);
        }
        if (this.challengeBtn) {
            this.challengeBtn.node.on(Button.EventType.CLICK, () => {
                this.onModeSelected(GameMode.CHALLENGE);
            }, this);
        }

        if (this.ticketCheckerBtn) {
            this.ticketCheckerBtn.node.on(Button.EventType.CLICK, () => {
                this.onPostSelected(PostType.TICKET_CHECKER);
            }, this);
        }
        if (this.reservationClerkBtn) {
            this.reservationClerkBtn.node.on(Button.EventType.CLICK, () => {
                this.onPostSelected(PostType.RESERVATION_CLERK);
            }, this);
        }
        if (this.siteManagerBtn) {
            this.siteManagerBtn.node.on(Button.EventType.CLICK, () => {
                this.onPostSelected(PostType.SITE_MANAGER);
            }, this);
        }

        if (this.backBtn) {
            this.backBtn.node.on(Button.EventType.CLICK, this.onBackClick, this);
        }
    }

    private showModeSelection(): void {
        if (this.modeSelectionPanel) {
            this.modeSelectionPanel.active = true;
        }
        if (this.postSelectionPanel) {
            this.postSelectionPanel.active = false;
        }
        if (this.backBtn) {
            this.backBtn.node.active = false;
        }

        this.selectedMode = null;
        this.selectedPost = null;
    }

    private showPostSelection(): void {
        if (this.modeSelectionPanel) {
            this.modeSelectionPanel.active = false;
        }
        if (this.postSelectionPanel) {
            this.postSelectionPanel.active = true;
        }
        if (this.backBtn) {
            this.backBtn.node.active = true;
        }
    }

    private onModeSelected(mode: GameMode): void {
        this.selectedMode = mode;

        const gameManager = GameManager.instance;
        if (gameManager) {
            gameManager.setGameMode(mode);
        }

        this.showPostSelection();
    }

    private onPostSelected(post: PostType): void {
        this.selectedPost = post;

        const gameManager = GameManager.instance;
        if (gameManager) {
            gameManager.setPostType(post);
        }

        this.goToLevelSelect();
    }

    private onBackClick(): void {
        this.showModeSelection();
    }

    private goToLevelSelect(): void {
        SceneManager.instance?.goToLevelSelect();
    }

    private updatePlayerStats(): void {
        const saveManager = GameSaveManager.getInstance();

        if (this.totalStarsLabel) {
            this.totalStarsLabel.string = `${saveManager.getTotalStars()}`;
        }
        if (this.completedLevelsLabel) {
            this.completedLevelsLabel.string = `${saveManager.getCompletedLevelsCount()}`;
        }
    }

    public getSelectedMode(): GameMode | null {
        return this.selectedMode;
    }

    public getSelectedPost(): PostType | null {
        return this.selectedPost;
    }
}
