import { _decorator, Component, Node, Label, Sprite, SpriteFrame, resources } from 'cc';
import { ConfigTypes } from '../types/ConfigTypes';

const { ccclass, property } = _decorator;

@ccclass('NPCHandler')
export class NPCHandler extends Component {

    @property(Label)
    nameLabel: Label | null = null;

    @property(Label)
    roleLabel: Label | null = null;

    @property(Sprite)
    avatarSprite: Sprite | null = null;

    private config: ConfigTypes.NPCConfig | null = null;

    public setup(config: ConfigTypes.NPCConfig): void {
        this.config = config;

        if (this.nameLabel) {
            this.nameLabel.string = config.name;
        }

        if (this.roleLabel) {
            this.roleLabel.string = this.getRoleDisplay(config.role);
        }

        this.loadAvatar();
    }

    private getRoleDisplay(role: string): string {
        const roleMap: Record<string, string> = {
            'PATIENT': '患者',
            'MENTOR': '带教老师',
            'RECEPTIONIST': '前台护士',
            'THERAPIST': '治疗师'
        };
        return roleMap[role] || role;
    }

    private loadAvatar(): void {
        if (!this.avatarSprite || !this.config) return;

        const avatarName = this.config.role.toLowerCase();
        const path = `textures/avatars/${avatarName}/spriteFrame`;

        resources.load(path, SpriteFrame, (err, spriteFrame) => {
            if (!err && this.avatarSprite) {
                this.avatarSprite.spriteFrame = spriteFrame;
            }
        });
    }

    public getConfig(): ConfigTypes.NPCConfig | null {
        return this.config;
    }
}
