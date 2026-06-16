import { _decorator, Component, Node, Label, Sprite, SpriteFrame, resources } from 'cc';
import { ConfigTypes } from '../types/ConfigTypes';

const { ccclass, property } = _decorator;

@ccclass('InteractiveObjectHandler')
export class InteractiveObjectHandler extends Component {

    @property(Label)
    nameLabel: Label | null = null;

    @property(Sprite)
    iconSprite: Sprite | null = null;

    private config: ConfigTypes.InteractiveObject | null = null;

    public setup(config: ConfigTypes.InteractiveObject): void {
        this.config = config;

        if (this.nameLabel) {
            this.nameLabel.string = config.name;
        }

        this.loadIcon();
    }

    private loadIcon(): void {
        if (!this.iconSprite || !this.config) return;

        const iconName = this.config.id.replace('OBJ_', '').toLowerCase();
        const path = `textures/scene_objects/${iconName}/spriteFrame`;

        resources.load(path, SpriteFrame, (err, spriteFrame) => {
            if (!err && this.iconSprite) {
                this.iconSprite.spriteFrame = spriteFrame;
            }
        });
    }

    public getConfig(): ConfigTypes.InteractiveObject | null {
        return this.config;
    }
}
