import { _decorator, Component, Node, Label, Toggle, Layout, ScrollView, instantiate, Prefab, UITransform } from 'cc';
import { SceneManager } from '../core/SceneManager';
import { LevelLoader } from '../services/LevelLoader';
import { PlayerDataService } from '../services/PlayerDataService';
import type { LevelConfig } from '../data/LevelConfig';
import { GameMode } from '../data/enums/GameMode';
import { Difficulty } from '../data/enums/Difficulty';
import { PharmacistRole } from '../data/enums/PharmacistRole';

const { ccclass, property } = _decorator;

@ccclass('LevelSelectScene')
export class LevelSelectScene extends Component {
    @property(Label)
    modeLabel: Label | null = null;

    @property(Node)
    roleFilterContainer: Node | null = null;

    @property(Node)
    difficultyFilterContainer: Node | null = null;

    @property(ScrollView)
    levelScrollView: ScrollView | null = null;

    @property(Prefab)
    levelCardPrefab: Prefab | null = null;

    @property(Node)
    backButton: Node | null = null;

    @property(Label)
    levelCountLabel: Label | null = null;

    private currentMode: GameMode = GameMode.FORMAL_TRAINING;
    private selectedRole: PharmacistRole | null = null;
    private selectedDifficulty: Difficulty | null = null;
    private allLevels: LevelConfig[] = [];
    private filteredLevels: LevelConfig[] = [];

    async onLoad() {
        const params = SceneManager.instance.getParams();
        if (params.mode) {
            this.currentMode = params.mode as GameMode;
        }

        this.allLevels = await LevelLoader.instance.loadAllLevels();
    }

    start() {
        this.refreshModeLabel();
        this.setupFilters();
        this.setupBackButton();
        this.applyFilters();
    }

    private refreshModeLabel(): void {
        if (this.modeLabel) {
            this.modeLabel.string = GameMode.getDisplayName(this.currentMode);
        }
    }

    private setupFilters(): void {
        this.setupRoleFilter();
        this.setupDifficultyFilter();
    }

    private setupRoleFilter(): void {
        if (!this.roleFilterContainer) return;

        const playerData = PlayerDataService.instance.loadPlayerData();
        const roles = [null, PharmacistRole.REVIEWER, PharmacistRole.SALES, PharmacistRole.REPLENISHMENT];
        const toggles = this.roleFilterContainer.getComponentsInChildren(Toggle);

        toggles.forEach((toggle, index) => {
            const role = roles[index];
            const label = toggle.node.getComponentInChildren(Label);
            if (label) {
                label.string = role ? PharmacistRole.getDisplayName(role) : '全部';
            }

            toggle.isChecked = playerData.role === role || (role === null && index === 0);

            toggle.node.off(Toggle.EventType.TOGGLE);
            toggle.node.on(Toggle.EventType.TOGGLE, (t: Toggle) => {
                if (t.isChecked) {
                    this.selectedRole = role;
                    this.applyFilters();
                }
            }, this);
        });

        this.selectedRole = playerData.role;
    }

    private setupDifficultyFilter(): void {
        if (!this.difficultyFilterContainer) return;

        const difficulties: (Difficulty | null)[] = [null, Difficulty.BEGINNER, Difficulty.INTERMEDIATE, Difficulty.ADVANCED, Difficulty.CHALLENGE];
        const toggles = this.difficultyFilterContainer.getComponentsInChildren(Toggle);

        toggles.forEach((toggle, index) => {
            const difficulty = difficulties[index];
            const label = toggle.node.getComponentInChildren(Label);
            if (label) {
                label.string = difficulty ? Difficulty.getDisplayName(difficulty) : '全部';
            }

            toggle.isChecked = index === 0;

            toggle.node.off(Toggle.EventType.TOGGLE);
            toggle.node.on(Toggle.EventType.TOGGLE, (t: Toggle) => {
                if (t.isChecked) {
                    this.selectedDifficulty = difficulty;
                    this.applyFilters();
                }
            }, this);
        });
    }

    private setupBackButton(): void {
        if (this.backButton) {
            this.backButton.on(Node.EventType.TOUCH_END, async () => {
                await SceneManager.instance.goBack();
            }, this);
        }
    }

    private applyFilters(): void {
        this.filteredLevels = this.allLevels.filter(level => {
            if (this.selectedRole && !level.roles.includes(this.selectedRole)) {
                return false;
            }
            if (this.selectedDifficulty && level.difficulty !== this.selectedDifficulty) {
                return false;
            }
            return true;
        });

        this.refreshLevelList();
    }

    private refreshLevelList(): void {
        if (!this.levelScrollView || !this.levelCardPrefab) return;

        const content = this.levelScrollView.content;
        if (!content) return;

        content.removeAllChildren();

        this.filteredLevels.forEach((level, index) => {
            const cardNode = instantiate(this.levelCardPrefab!);
            const card = cardNode.getComponent('LevelCard') as any;
            if (card) {
                const unlocked = this.currentMode === GameMode.FREE_PRACTICE ||
                    PlayerDataService.instance.isLevelUnlocked(level.id, index);
                card.setData(level, unlocked, (selectedLevel: LevelConfig) => {
                    this.onLevelSelected(selectedLevel);
                });
            }
            content.addChild(cardNode);
        });

        if (this.levelCountLabel) {
            this.levelCountLabel.string = `共 ${this.filteredLevels.length} 个关卡`;
        }

        const layout = content.getComponent(Layout);
        if (layout) {
            layout.updateLayout();
        }
    }

    private async onLevelSelected(level: LevelConfig): Promise<void> {
        await SceneManager.instance.loadScene('Game', {
            levelId: level.id,
            mode: this.currentMode
        });
    }

    onDestroy() {
        if (this.backButton) {
            this.backButton.off(Node.EventType.TOUCH_END);
        }
    }
}
