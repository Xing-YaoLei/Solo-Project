import { _decorator, Component, Node, Label, Sprite, Prefab, instantiate, ScrollView, Color, resources, SpriteFrame } from 'cc';
import { ConfigTypes } from '../types/ConfigTypes';
import { GameManager } from '../core/GameManager';

const { ccclass, property } = _decorator;

@ccclass('ClueCard')
export class ClueCard extends Component {

    @property(Label)
    nameLabel: Label | null = null;

    @property(Label)
    categoryLabel: Label | null = null;

    @property(Label)
    importanceLabel: Label | null = null;

    @property(Sprite)
    iconSprite: Sprite | null = null;

    @property(Node)
    viewedIndicator: Node | null = null;

    @property(Node)
    detailPanel: Node | null = null;

    @property(Label)
    detailContentLabel: Label | null = null;

    @property(Label)
    detailHintLabel: Label | null = null;

    private config: ConfigTypes.ClueConfig | null = null;
    private isViewed: boolean = false;
    private isDetailShown: boolean = false;

    public setup(config: ConfigTypes.ClueConfig): void {
        this.config = config;

        if (this.nameLabel) {
            this.nameLabel.string = config.name;
        }
        if (this.categoryLabel) {
            this.categoryLabel.string = this.getCategoryDisplay(config.category);
        }
        if (this.importanceLabel) {
            this.importanceLabel.string = this.getImportanceDisplay(config.importance);
            this.importanceLabel.color = this.getImportanceColor(config.importance);
        }

        this.loadIcon(config.spritePath);

        this.node.on(Node.EventType.TOUCH_END, this.onCardClicked, this);
        this.hideDetail();
    }

    private getCategoryDisplay(category: ConfigTypes.ClueCategory): string {
        const map: Record<ConfigTypes.ClueCategory, string> = {
            'DOCUMENT': '文档',
            'PHYSICAL': '实物',
            'REFERENCE': '参考资料',
            'MEDIA': '多媒体'
        };
        return map[category] || category;
    }

    private getImportanceDisplay(importance: ConfigTypes.ClueImportance): string {
        const map: Record<ConfigTypes.ClueImportance, string> = {
            'LOW': '一般',
            'MEDIUM': '重要',
            'HIGH': '重点',
            'CRITICAL': '关键'
        };
        return map[importance] || importance;
    }

    private getImportanceColor(importance: ConfigTypes.ClueImportance): Color {
        switch (importance) {
            case 'CRITICAL': return new Color(198, 40, 40);
            case 'HIGH': return new Color(230, 81, 0);
            case 'MEDIUM': return new Color(21, 101, 192);
            default: return new Color(97, 97, 97);
        }
    }

    private loadIcon(path: string): void {
        if (!this.iconSprite) return;
        resources.load(`${path}/spriteFrame`, SpriteFrame, (err, spriteFrame) => {
            if (!err && this.iconSprite) {
                this.iconSprite.spriteFrame = spriteFrame;
            }
        });
    }

    private onCardClicked(): void {
        if (!this.config) return;

        GameManager.instance.viewClue(this.config.id);
        this.markViewed();

        if (this.isDetailShown) {
            this.hideDetail();
        } else {
            this.showDetail();
        }
    }

    private showDetail(): void {
        if (!this.config || !this.detailPanel) return;
        this.isDetailShown = true;
        this.detailPanel.active = true;

        if (this.detailContentLabel) {
            this.detailContentLabel.string = this.formatContent(this.config.content);
        }
        if (this.detailHintLabel) {
            this.detailHintLabel.string = `💡 提示: ${this.config.hint}`;
        }
    }

    private hideDetail(): void {
        this.isDetailShown = false;
        if (this.detailPanel) {
            this.detailPanel.active = false;
        }
    }

    private formatContent(content: Record<string, any>): string {
        const lines: string[] = [];
        for (const key in content) {
            const value = content[key];
            if (Array.isArray(value)) {
                lines.push(`${key}:\n  ${value.map(v => `• ${v}`).join('\n  ')}`);
            } else if (typeof value === 'object') {
                lines.push(`${key}: ${JSON.stringify(value, null, 2)}`);
            } else {
                lines.push(`${key}: ${value}`);
            }
        }
        return lines.join('\n');
    }

    public markViewed(): void {
        this.isViewed = true;
        if (this.viewedIndicator) {
            this.viewedIndicator.active = false;
        }
    }

    public getIsViewed(): boolean {
        return this.isViewed;
    }
}

@ccclass('CluePanel')
export class CluePanel extends Component {

    @property(ScrollView)
    clueScrollView: ScrollView | null = null;

    @property(Node)
    clueContainer: Node | null = null;

    @property(Prefab)
    clueCardPrefab: Prefab | null = null;

    @property(Node)
    observeCompleteButton: Node | null = null;

    @property(Label)
    titleLabel: Label | null = null;

    private clueCards: ClueCard[] = [];

    start(): void {
        GameManager.instance.eventTarget.on('task_changed', this.onTaskChanged, this);
        this.observeCompleteButton?.on(Node.EventType.TOUCH_END, this.onObserveComplete, this);
    }

    onDestroy(): void {
        GameManager.instance.eventTarget.off('task_changed', this.onTaskChanged, this);
        this.observeCompleteButton?.off(Node.EventType.TOUCH_END, this.onObserveComplete, this);
    }

    private onTaskChanged(): void {
        this.refresh();
    }

    public refresh(): void {
        const clues = GameManager.instance.getCluesForCurrentTask();

        if (this.clueContainer) {
            this.clueContainer.removeAllChildren();
        }
        this.clueCards = [];

        if (!this.clueCardPrefab || !this.clueContainer) return;

        const task = GameManager.instance.getCurrentTask();
        if (this.titleLabel && task) {
            this.titleLabel.string = `${task.name} - 线索资料 (${clues.length}份)`;
        }

        clues.forEach(clue => {
            const node = instantiate(this.clueCardPrefab!);
            const card = node.getComponent(ClueCard) || node.addComponent(ClueCard);
            card.setup(clue);
            this.clueContainer!.addChild(node);
            this.clueCards.push(card);
        });

        this.node.active = clues.length > 0;
    }

    private onObserveComplete(): void {
        const unviewedCount = this.clueCards.filter(c => !c.getIsViewed()).length;
        if (unviewedCount > 0 && this.clueCards.length > 2) {
            console.warn(`还有 ${unviewedCount} 份线索未查看，建议仔细阅读所有资料`);
        }
        GameManager.instance.markClueObservationComplete();
    }
}
