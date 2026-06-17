import { _decorator, Component, Node, Label, Button, Sprite, Color, instantiate, Prefab } from 'cc';
import { GameManager } from './GameManager';
import { LEVEL_CONFIGS, LevelConfig } from './data/LevelConfig';
const { ccclass, property } = _decorator;

@ccclass('LevelSelectPanel')
export class LevelSelectPanel extends Component {
    @property(Node)
    panelNode: Node | null = null;

    @property(Node)
    levelListContainer: Node | null = null;

    @property(Prefab)
    levelItemPrefab: Prefab | null = null;

    @property(Button)
    backButton: Button | null = null;

    @property(Button)
    settingsButton: Button | null = null;

    onLoad() {
        this.setupEventListeners();
        this.refreshLevelList();
    }

    setupEventListeners(): void {
        if (this.backButton) {
            this.backButton.node.on(Button.EventType.CLICK, this.onBack, this);
        }
        if (this.settingsButton) {
            this.settingsButton.node.on(Button.EventType.CLICK, this.onSettings, this);
        }
    }

    refreshLevelList(): void {
        if (!this.levelListContainer) return;

        this.levelListContainer.removeAllChildren();

        LEVEL_CONFIGS.forEach(config => {
            const item = this.createLevelItem(config);
            if (item) {
                this.levelListContainer.addChild(item);
            }
        });
    }

    createLevelItem(config: LevelConfig): Node | null {
        let node: Node;

        if (this.levelItemPrefab) {
            node = instantiate(this.levelItemPrefab);
        } else {
            node = new Node(`Level_${config.id}`);
            node.addComponent(Sprite);
            node.addComponent(Button);

            const nameLabel = new Node('NameLabel');
            nameLabel.addComponent(Label);
            node.addChild(nameLabel);

            const descLabel = new Node('DescLabel');
            descLabel.addComponent(Label);
            node.addChild(descLabel);

            const starsNode = new Node('Stars');
            node.addChild(starsNode);
        }

        const unlocked = GameManager.instance.isLevelUnlocked(config.id);
        const result = GameManager.instance.getLevelResult(config.id);

        const btn = node.getComponent(Button);
        if (btn) {
            btn.interactable = unlocked;
            btn.node.on(Button.EventType.CLICK, () => {
                if (unlocked) {
                    this.onSelectLevel(config.id);
                }
            }, this);
        }

        const labels = node.getComponentsInChildren(Label);
        if (labels.length >= 1) {
            labels[0].string = `第${config.id}关: ${config.name}`;
        }
        if (labels.length >= 2) {
            labels[1].string = config.description;
        }

        const sprite = node.getComponent(Sprite);
        if (sprite) {
            if (!unlocked) {
                sprite.color = new Color(180, 180, 180, 255);
            } else if (result?.starCount === 3) {
                sprite.color = new Color(255, 240, 200, 255);
            } else {
                sprite.color = new Color(240, 245, 255, 255);
            }
        }

        const starsContainer = node.getChildByName('Stars');
        if (starsContainer) {
            const starCount = result?.starCount || 0;
            const stars = starsContainer.children;
            stars.forEach((star, index) => {
                const starSprite = star.getComponent(Sprite);
                if (starSprite) {
                    if (index < starCount) {
                        starSprite.color = new Color(255, 220, 50, 255);
                    } else {
                        starSprite.color = new Color(200, 200, 200, 255);
                    }
                }
            });
        }

        return node;
    }

    onSelectLevel(levelId: number): void {
        GameManager.instance.playSound('click');
        GameManager.instance.currentLevelId = levelId;
        console.log('Selected level:', levelId);
    }

    show(): void {
        if (this.panelNode) {
            this.panelNode.active = true;
        }
        this.refreshLevelList();
    }

    hide(): void {
        if (this.panelNode) {
            this.panelNode.active = false;
        }
    }

    onBack(): void {
        GameManager.instance.playSound('click');
        this.hide();
    }

    onSettings(): void {
        GameManager.instance.playSound('click');
        console.log('Open settings');
    }
}
