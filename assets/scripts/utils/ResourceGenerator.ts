import { _decorator, SpriteFrame, Texture2D, ImageAsset, Color, Sprite, Node, Size, UITransform } from 'cc';
const { ccclass } = _decorator;

export type ResourceType = 
    | 'button_primary'
    | 'button_secondary'
    | 'button_danger'
    | 'panel_bg'
    | 'card_bg'
    | 'card_correct'
    | 'card_wrong'
    | 'card_processed'
    | 'tile_floor_1'
    | 'tile_floor_2'
    | 'tile_floor_3'
    | 'tile_wall'
    | 'tile_bed'
    | 'tile_chair'
    | 'tile_table'
    | 'tile_elderly'
    | 'icon_star'
    | 'icon_star_empty'
    | 'icon_settings'
    | 'icon_back'
    | 'icon_medicine'
    | 'icon_visit'
    | 'icon_activity'
    | 'progress_bar_bg'
    | 'progress_bar_green'
    | 'progress_bar_yellow'
    | 'progress_bar_red'
    | 'tab_active'
    | 'tab_inactive'
    | 'overlay_bg';

@ccclass('ResourceGenerator')
export class ResourceGenerator {
    private static _cache: Map<ResourceType, SpriteFrame> = new Map();
    private static _tileSize: number = 64;

    static getTileSize(): number {
        return this._tileSize;
    }

    static getSpriteFrame(type: ResourceType): SpriteFrame {
        if (this._cache.has(type)) {
            return this._cache.get(type)!;
        }

        const canvas = this.generateCanvas(type);
        const spriteFrame = this.canvasToSpriteFrame(canvas);
        this._cache.set(type, spriteFrame);
        return spriteFrame;
    }

    static getElderlyAvatarSpriteFrame(gender: 'male' | 'female', index: number): SpriteFrame {
        const key = `avatar_${gender}_${index}` as ResourceType;
        if (this._cache.has(key)) {
            return this._cache.get(key)!;
        }

        const canvas = this.generateElderlyAvatar(gender, index);
        const spriteFrame = this.canvasToSpriteFrame(canvas);
        this._cache.set(key, spriteFrame);
        return spriteFrame;
    }

    static preloadAll(): void {
        const types: ResourceType[] = [
            'button_primary', 'button_secondary', 'button_danger',
            'panel_bg', 'card_bg', 'card_correct', 'card_wrong', 'card_processed',
            'tile_floor_1', 'tile_floor_2', 'tile_floor_3', 'tile_wall',
            'tile_bed', 'tile_chair', 'tile_table', 'tile_elderly',
            'icon_star', 'icon_star_empty', 'icon_settings', 'icon_back',
            'icon_medicine', 'icon_visit', 'icon_activity',
            'progress_bar_bg', 'progress_bar_green', 'progress_bar_yellow', 'progress_bar_red',
            'tab_active', 'tab_inactive', 'overlay_bg',
        ];
        types.forEach(t => this.getSpriteFrame(t));
    }

    private static canvasToSpriteFrame(canvas: HTMLCanvasElement): SpriteFrame {
        const img = new ImageAsset(canvas);
        const texture = new Texture2D();
        texture.image = img;
        const spriteFrame = new SpriteFrame();
        spriteFrame.texture = texture;
        return spriteFrame;
    }

    private static generateCanvas(type: ResourceType): HTMLCanvasElement {
        switch (type) {
            case 'button_primary': return this.drawButton(200, 60, '#4A90D9', '#357ABD', '#FFFFFF');
            case 'button_secondary': return this.drawButton(200, 60, '#E0E0E0', '#BDBDBD', '#333333');
            case 'button_danger': return this.drawButton(200, 60, '#E74C3C', '#C0392B', '#FFFFFF');
            case 'panel_bg': return this.drawPanel(400, 300);
            case 'card_bg': return this.drawCard(600, 100, '#FFFFFF', '#E0E0E0');
            case 'card_correct': return this.drawCard(600, 100, '#E8F5E9', '#4CAF50');
            case 'card_wrong': return this.drawCard(600, 100, '#FFEBEE', '#E53935');
            case 'card_processed': return this.drawCard(600, 100, '#F5F5F5', '#BDBDBD');
            case 'tile_floor_1': return this.drawTile('#F5E6D3', '#E8D5B7');
            case 'tile_floor_2': return this.drawTile('#E8D5B7', '#D4C09E');
            case 'tile_floor_3': return this.drawTile('#D4C09E', '#C0AA85');
            case 'tile_wall': return this.drawTile('#A0A0A0', '#808080');
            case 'tile_bed': return this.drawBedTile();
            case 'tile_chair': return this.drawChairTile();
            case 'tile_table': return this.drawTableTile();
            case 'tile_elderly': return this.drawElderlyTile();
            case 'icon_star': return this.drawStar(48, '#FFD700', '#FFA500');
            case 'icon_star_empty': return this.drawStar(48, '#E0E0E0', '#BDBDBD');
            case 'icon_settings': return this.drawSettingsIcon(48);
            case 'icon_back': return this.drawBackIcon(48);
            case 'icon_medicine': return this.drawMedicineIcon(48);
            case 'icon_visit': return this.drawVisitIcon(48);
            case 'icon_activity': return this.drawActivityIcon(48);
            case 'progress_bar_bg': return this.drawProgressBar(400, 20, '#E0E0E0');
            case 'progress_bar_green': return this.drawProgressBar(400, 20, '#4CAF50');
            case 'progress_bar_yellow': return this.drawProgressBar(400, 20, '#FFC107');
            case 'progress_bar_red': return this.drawProgressBar(400, 20, '#F44336');
            case 'tab_active': return this.drawTab(120, 44, '#4A90D9', '#FFFFFF');
            case 'tab_inactive': return this.drawTab(120, 44, '#EEEEEE', '#666666');
            case 'overlay_bg': return this.drawOverlay(800, 1400);
            default: return this.drawTile('#CCCCCC', '#AAAAAA');
        }
    }

    private static drawButton(w: number, h: number, bgColor: string, borderColor: string, textColor: string): HTMLCanvasElement {
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d')!;
        const r = 10;

        ctx.beginPath();
        ctx.moveTo(r, 0);
        ctx.lineTo(w - r, 0);
        ctx.quadraticCurveTo(w, 0, w, r);
        ctx.lineTo(w, h - r);
        ctx.quadraticCurveTo(w, h, w - r, h);
        ctx.lineTo(r, h);
        ctx.quadraticCurveTo(0, h, 0, h - r);
        ctx.lineTo(0, r);
        ctx.quadraticCurveTo(0, 0, r, 0);
        ctx.closePath();

        ctx.fillStyle = bgColor;
        ctx.fill();
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 2;
        ctx.stroke();

        return canvas;
    }

    private static drawPanel(w: number, h: number): HTMLCanvasElement {
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d')!;
        const r = 16;

        ctx.beginPath();
        ctx.moveTo(r, 0);
        ctx.lineTo(w - r, 0);
        ctx.quadraticCurveTo(w, 0, w, r);
        ctx.lineTo(w, h - r);
        ctx.quadraticCurveTo(w, h, w - r, h);
        ctx.lineTo(r, h);
        ctx.quadraticCurveTo(0, h, 0, h - r);
        ctx.lineTo(0, r);
        ctx.quadraticCurveTo(0, 0, r, 0);
        ctx.closePath();

        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        ctx.strokeStyle = '#CCCCCC';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#FAFAFA';
        ctx.fillRect(8, 50, w - 16, h - 58);
        ctx.strokeStyle = '#EEEEEE';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, 50);
        ctx.lineTo(w, 50);
        ctx.stroke();

        return canvas;
    }

    private static drawCard(w: number, h: number, bgColor: string, borderColor: string): HTMLCanvasElement {
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d')!;
        const r = 8;

        ctx.beginPath();
        ctx.moveTo(r, 0);
        ctx.lineTo(w - r, 0);
        ctx.quadraticCurveTo(w, 0, w, r);
        ctx.lineTo(w, h - r);
        ctx.quadraticCurveTo(w, h, w - r, h);
        ctx.lineTo(r, h);
        ctx.quadraticCurveTo(0, h, 0, h - r);
        ctx.lineTo(0, r);
        ctx.quadraticCurveTo(0, 0, r, 0);
        ctx.closePath();

        ctx.fillStyle = bgColor;
        ctx.fill();
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 2;
        ctx.stroke();

        return canvas;
    }

    private static drawTile(color1: string, color2: string): HTMLCanvasElement {
        const size = this._tileSize;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d')!;

        ctx.fillStyle = color1;
        ctx.fillRect(0, 0, size, size);

        ctx.fillStyle = color2;
        ctx.fillRect(0, 0, size, 2);
        ctx.fillRect(0, 0, 2, size);
        ctx.fillRect(size - 2, 0, 2, size);
        ctx.fillRect(0, size - 2, size, 2);

        ctx.fillStyle = color2;
        ctx.globalAlpha = 0.3;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                ctx.fillRect(10 + i * 20, 10 + j * 20, 2, 2);
            }
        }
        ctx.globalAlpha = 1;

        return canvas;
    }

    private static drawBedTile(): HTMLCanvasElement {
        const size = this._tileSize;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d')!;

        ctx.fillStyle = '#F5E6D3';
        ctx.fillRect(0, 0, size, size);

        ctx.fillStyle = '#8B7355';
        ctx.fillRect(6, 6, size - 12, size - 12);

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(10, 10, size - 20, (size - 20) / 2);

        ctx.fillStyle = '#FFB6C1';
        ctx.fillRect(10, 10, (size - 20) / 3, (size - 20) / 2);

        return canvas;
    }

    private static drawChairTile(): HTMLCanvasElement {
        const size = this._tileSize;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d')!;

        ctx.fillStyle = '#F5E6D3';
        ctx.fillRect(0, 0, size, size);

        ctx.fillStyle = '#8B4513';
        ctx.fillRect(18, 10, size - 36, size - 20);
        ctx.fillRect(18, 10, 8, size - 12);

        ctx.fillStyle = '#654321';
        ctx.fillRect(16, size - 10, 8, 6);
        ctx.fillRect(size - 24, size - 10, 8, 6);

        return canvas;
    }

    private static drawTableTile(): HTMLCanvasElement {
        const size = this._tileSize;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d')!;

        ctx.fillStyle = '#F5E6D3';
        ctx.fillRect(0, 0, size, size);

        ctx.fillStyle = '#D2691E';
        ctx.fillRect(8, 18, size - 16, 14);

        ctx.fillStyle = '#8B4513';
        ctx.fillRect(12, 32, 8, size - 40);
        ctx.fillRect(size - 20, 32, 8, size - 40);

        return canvas;
    }

    private static drawElderlyTile(): HTMLCanvasElement {
        const size = this._tileSize;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d')!;

        ctx.fillStyle = '#F5E6D3';
        ctx.fillRect(0, 0, size, size);

        ctx.beginPath();
        ctx.arc(size / 2, 24, 14, 0, Math.PI * 2);
        ctx.fillStyle = '#FFDAB9';
        ctx.fill();

        ctx.fillStyle = '#C0C0C0';
        ctx.beginPath();
        ctx.arc(size / 2, 18, 10, Math.PI, 2 * Math.PI);
        ctx.fill();

        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(size / 2 - 5, 24, 2, 0, Math.PI * 2);
        ctx.arc(size / 2 + 5, 24, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#4A90D9';
        ctx.fillRect(size / 2 - 16, 38, 32, 22);

        return canvas;
    }

    private static drawStar(size: number, color1: string, color2: string): HTMLCanvasElement {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d')!;

        const cx = size / 2;
        const cy = size / 2;
        const outerR = size / 2 - 2;
        const innerR = outerR * 0.4;
        const spikes = 5;

        ctx.beginPath();
        for (let i = 0; i < spikes * 2; i++) {
            const r = i % 2 === 0 ? outerR : innerR;
            const angle = (Math.PI / spikes) * i - Math.PI / 2;
            const x = cx + Math.cos(angle) * r;
            const y = cy + Math.sin(angle) * r;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();

        ctx.fillStyle = color1;
        ctx.fill();
        ctx.strokeStyle = color2;
        ctx.lineWidth = 2;
        ctx.stroke();

        return canvas;
    }

    private static drawSettingsIcon(size: number): HTMLCanvasElement {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d')!;
        const cx = size / 2;
        const cy = size / 2;

        ctx.beginPath();
        ctx.arc(cx, cy, size * 0.35, 0, Math.PI * 2);
        ctx.fillStyle = '#666';
        ctx.fill();

        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI / 4) * i;
            const x1 = cx + Math.cos(angle) * size * 0.35;
            const y1 = cy + Math.sin(angle) * size * 0.35;
            const x2 = cx + Math.cos(angle) * size * 0.48;
            const y2 = cy + Math.sin(angle) * size * 0.48;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.strokeStyle = '#666';
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(cx, cy, size * 0.15, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();

        return canvas;
    }

    private static drawBackIcon(size: number): HTMLCanvasElement {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d')!;

        ctx.strokeStyle = '#666';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(size * 0.65, size * 0.2);
        ctx.lineTo(size * 0.3, size * 0.5);
        ctx.lineTo(size * 0.65, size * 0.8);
        ctx.stroke();

        return canvas;
    }

    private static drawMedicineIcon(size: number): HTMLCanvasElement {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d')!;

        ctx.fillStyle = '#E74C3C';
        ctx.fillRect(size * 0.15, size * 0.35, size * 0.7, size * 0.3);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(size * 0.45, size * 0.35, size * 0.1, size * 0.3);

        ctx.fillStyle = '#E74C3C';
        ctx.font = `bold ${size * 0.2}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Rx', size / 2, size * 0.75);

        return canvas;
    }

    private static drawVisitIcon(size: number): HTMLCanvasElement {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d')!;

        ctx.beginPath();
        ctx.arc(size * 0.35, size * 0.35, size * 0.15, 0, Math.PI * 2);
        ctx.fillStyle = '#4A90D9';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(size * 0.65, size * 0.4, size * 0.12, 0, Math.PI * 2);
        ctx.fillStyle = '#90EE90';
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(size * 0.2, size * 0.85);
        ctx.quadraticCurveTo(size * 0.35, size * 0.55, size * 0.5, size * 0.55);
        ctx.quadraticCurveTo(size * 0.65, size * 0.55, size * 0.8, size * 0.85);
        ctx.closePath();
        ctx.fillStyle = '#4A90D9';
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(size * 0.55, size * 0.7);
        ctx.quadraticCurveTo(size * 0.65, size * 0.58, size * 0.75, size * 0.75);
        ctx.closePath();
        ctx.fillStyle = '#90EE90';
        ctx.fill();

        return canvas;
    }

    private static drawActivityIcon(size: number): HTMLCanvasElement {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d')!;

        ctx.strokeStyle = '#4CAF50';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(size * 0.1, size * 0.7);
        ctx.lineTo(size * 0.3, size * 0.5);
        ctx.lineTo(size * 0.5, size * 0.6);
        ctx.lineTo(size * 0.7, size * 0.3);
        ctx.lineTo(size * 0.9, size * 0.4);
        ctx.stroke();

        ctx.fillStyle = '#FF9800';
        ctx.beginPath();
        ctx.arc(size * 0.3, size * 0.5, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#2196F3';
        ctx.beginPath();
        ctx.arc(size * 0.7, size * 0.3, 4, 0, Math.PI * 2);
        ctx.fill();

        return canvas;
    }

    private static drawProgressBar(w: number, h: number, color: string): HTMLCanvasElement {
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d')!;
        const r = h / 2;

        ctx.beginPath();
        ctx.moveTo(r, 0);
        ctx.lineTo(w - r, 0);
        ctx.quadraticCurveTo(w, 0, w, r);
        ctx.lineTo(w, h - r);
        ctx.quadraticCurveTo(w, h, w - r, h);
        ctx.lineTo(r, h);
        ctx.quadraticCurveTo(0, h, 0, h - r);
        ctx.lineTo(0, r);
        ctx.quadraticCurveTo(0, 0, r, 0);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();

        return canvas;
    }

    private static drawTab(w: number, h: number, bgColor: string, textColor: string): HTMLCanvasElement {
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d')!;
        const r = 6;

        ctx.beginPath();
        ctx.moveTo(r, 0);
        ctx.lineTo(w - r, 0);
        ctx.quadraticCurveTo(w, 0, w, r);
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.lineTo(0, r);
        ctx.quadraticCurveTo(0, 0, r, 0);
        ctx.closePath();

        ctx.fillStyle = bgColor;
        ctx.fill();

        return canvas;
    }

    private static drawOverlay(w: number, h: number): HTMLCanvasElement {
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d')!;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, 0, w, h);

        return canvas;
    }

    private static generateElderlyAvatar(gender: 'male' | 'female', index: number): HTMLCanvasElement {
        const colors = [
            { bg: '#FFE4C4', border: '#DEB887' },
            { bg: '#E6E6FA', border: '#B8B8D8' },
            { bg: '#E0FFFF', border: '#ADD8E6' },
            { bg: '#F0FFF0', border: '#90EE90' },
            { bg: '#FFF0F5', border: '#DDB6C6' },
            { bg: '#FFFACD', border: '#EEE685' },
        ];
        const colorSet = colors[index % colors.length];

        const size = 128;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d')!;

        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2 - 4, 0, Math.PI * 2);
        ctx.fillStyle = colorSet.bg;
        ctx.fill();
        ctx.lineWidth = 4;
        ctx.strokeStyle = colorSet.border;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(size / 2, 50, 30, 0, Math.PI * 2);
        ctx.fillStyle = '#FFDAB9';
        ctx.fill();

        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(size / 2 - 10, 48, 4, 0, Math.PI * 2);
        ctx.arc(size / 2 + 10, 48, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(size / 2, 55, 15, 0.2 * Math.PI, 0.8 * Math.PI);
        ctx.stroke();

        ctx.fillStyle = '#C0C0C0';
        if (gender === 'male') {
            ctx.beginPath();
            ctx.arc(size / 2, 25, 18, Math.PI, 2 * Math.PI);
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.ellipse(size / 2, 28, 28, 20, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.fillStyle = '#8B7355';
        ctx.fillRect(size / 2 - 29, 75, 58, 45);

        return canvas;
    }

    static createSpriteNode(type: ResourceType, width?: number, height?: number): Node {
        const node = new Node();
        const sprite = node.addComponent(Sprite);
        sprite.spriteFrame = this.getSpriteFrame(type);

        const uiTransform = node.addComponent(UITransform);
        if (width && height) {
            uiTransform.setContentSize(width, height);
        }

        return node;
    }

    static createElderlyAvatarNode(gender: 'male' | 'female', index: number, size: number = 80): Node {
        const node = new Node('Avatar');
        const sprite = node.addComponent(Sprite);
        sprite.spriteFrame = this.getElderlyAvatarSpriteFrame(gender, index);

        const uiTransform = node.addComponent(UITransform);
        uiTransform.setContentSize(size, size);

        return node;
    }

    static clearCache(): void {
        this._cache.clear();
    }
}
