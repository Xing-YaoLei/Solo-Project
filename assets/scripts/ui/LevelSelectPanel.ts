import { _decorator, Component, Node, Label, Sprite, Color, Vec3, tween, UITransform, Button } from "cc";
import { LevelConfig } from "../models/Config";
import { GameManager } from "../managers/GameManager";

const { ccclass } = _decorator;

@ccclass("LevelSelectPanel")
export class LevelSelectPanel extends Component {
    private levels: LevelConfig[] = [];
    private onLevelSelected: ((levelIndex: number) => void) | null = null;
    private unlockedLevelIndex: number = 0;

    public init(levels: LevelConfig[]): void {
        this.levels = levels;
        this.loadProgress();
        this.renderLevels();
    }

    private loadProgress(): void {
        try {
            const saved = localStorage.getItem("inn_manager_level_progress");
            if (saved) {
                this.unlockedLevelIndex = parseInt(saved, 10);
            }
        } catch (e) {
            this.unlockedLevelIndex = 0;
        }
    }

    private renderLevels(): void {
        const container = this.node.getChildByName("levelList");
        if (!container) return;

        const existing = container.children;
        for (let i = existing.length - 1; i >= 0; i--) {
            existing[i].destroy();
        }

        for (let i = 0; i < this.levels.length; i++) {
            const level = this.levels[i];
            const isUnlocked = i <= this.unlockedLevelIndex;

            const itemNode = new Node(`level_${i}`);
            itemNode.addComponent(UITransform).setContentSize(200, 80);

            const bg = itemNode.addComponent(Sprite);
            bg.color = isUnlocked ? new Color(60, 60, 80, 255) : new Color(40, 40, 40, 255);

            const nameLabel = new Node("name");
            nameLabel.addComponent(UITransform).setContentSize(180, 20);
            const nl = nameLabel.addComponent(Label);
            nl.fontSize = 16;
            nl.string = isUnlocked ? level.name : "🔒 未解锁";
            nl.color = isUnlocked ? Color.WHITE : Color.GRAY;
            nameLabel.setPosition(0, 20, 0);
            nameLabel.parent = itemNode;

            const descLabel = new Node("desc");
            descLabel.addComponent(UITransform).setContentSize(180, 16);
            const dl = descLabel.addComponent(Label);
            dl.fontSize = 10;
            dl.string = isUnlocked ? level.description : "";
            dl.color = new Color(180, 180, 180, 255);
            descLabel.setPosition(0, 0, 0);
            descLabel.parent = itemNode;

            const infoLabel = new Node("info");
            infoLabel.addComponent(UITransform).setContentSize(180, 14);
            const il = infoLabel.addComponent(Label);
            il.fontSize = 10;
            il.string = isUnlocked ? `${level.roomCount}间房 | ${level.dayCount}天 | 冲突${(level.conflictProbability * 100).toFixed(0)}%` : "";
            il.color = new Color(150, 150, 150, 255);
            infoLabel.setPosition(0, -20, 0);
            infoLabel.parent = itemNode;

            const col = i % 3;
            const row = Math.floor(i / 3);
            itemNode.setPosition(-220 + col * 230, 120 - row * 100, 0);
            itemNode.parent = container;

            if (isUnlocked) {
                itemNode.on(Node.EventType.TOUCH_END, () => {
                    if (this.onLevelSelected) {
                        this.onLevelSelected(i);
                    }
                });
            }
        }
    }

    public unlockLevel(index: number): void {
        if (index > this.unlockedLevelIndex) {
            this.unlockedLevelIndex = index;
            try {
                localStorage.setItem("inn_manager_level_progress", String(index));
            } catch (e) {
                // ignore
            }
            this.renderLevels();
        }
    }

    public setOnLevelSelected(cb: (levelIndex: number) => void): void {
        this.onLevelSelected = cb;
    }
}
