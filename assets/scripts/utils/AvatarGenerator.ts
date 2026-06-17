import { _decorator, Component, Node, Sprite, SpriteFrame, resources, Texture2D, ImageAsset } from 'cc';
const { ccclass } = _decorator;

export const ELDERLY_AVATAR_COLORS = [
    { bg: '#FFE4C4', border: '#DEB887' },
    { bg: '#E6E6FA', border: '#B8B8D8' },
    { bg: '#E0FFFF', border: '#ADD8E6' },
    { bg: '#F0FFF0', border: '#90EE90' },
    { bg: '#FFF0F5', border: '#DDB6C6' },
    { bg: '#FFFACD', border: '#EEE685' },
];

@ccclass('AvatarGenerator')
export class AvatarGenerator {
    static generateAvatarSprite(gender: 'male' | 'female', index: number = 0): HTMLCanvasElement {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d')!;

        const colorSet = ELDERLY_AVATAR_COLORS[index % ELDERLY_AVATAR_COLORS.length];

        ctx.beginPath();
        ctx.arc(64, 64, 60, 0, Math.PI * 2);
        ctx.fillStyle = colorSet.bg;
        ctx.fill();
        ctx.lineWidth = 4;
        ctx.strokeStyle = colorSet.border;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(64, 50, 30, 0, Math.PI * 2);
        ctx.fillStyle = '#FFDAB9';
        ctx.fill();

        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(54, 48, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(74, 48, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(64, 55, 15, 0.2 * Math.PI, 0.8 * Math.PI);
        ctx.stroke();

        ctx.fillStyle = '#C0C0C0';
        if (gender === 'male') {
            ctx.beginPath();
            ctx.arc(64, 25, 18, Math.PI, 2 * Math.PI);
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.ellipse(64, 28, 28, 20, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.fillStyle = '#8B7355';
        ctx.fillRect(35, 75, 58, 45);

        return canvas;
    }

    static createAvatarNode(gender: 'male' | 'female', index: number = 0, size: number = 80): Node {
        const node = new Node('Avatar');
        const sprite = node.addComponent(Sprite);

        const canvas = this.generateAvatarSprite(gender, index);

        const img = new ImageAsset(canvas);
        const texture = new Texture2D();
        texture.image = img;

        const spriteFrame = new SpriteFrame();
        spriteFrame.texture = texture;
        sprite.spriteFrame = spriteFrame;

        node.setScale(size / 128, size / 128, 1);

        return node;
    }

    static getAvatarColor(index: number): { bg: string; border: string } {
        return ELDERLY_AVATAR_COLORS[index % ELDERLY_AVATAR_COLORS.length];
    }
}
