import { Node, Label, Sprite, Color, Button, UITransform } from 'cc';
import { GameManager } from '../core/GameManager';
import { Bootstrap } from '../Bootstrap';

export class SettingsSceneBuilder {
    private ui: Bootstrap | null = null;
    private canvas: Node | null = null;

    build(ui: Bootstrap): Node {
        this.ui = ui;
        this.canvas = new Node('SettingsScene');
        this.canvas.addComponent(UITransform).setContentSize(1280, 720);
        this.render();
        return this.canvas;
    }

    render() {
        if (!this.canvas || !this.ui) return;
        this.canvas.removeAllChildren();

        const s = GameManager.instance.settings;

        this.canvas.addChild(this.ui.createSpriteNode('BG', 1280, 720, new Color(28, 28, 48)));
        const panel = this.ui.createSpriteNode('P', 820, 620, new Color(45, 45, 75, 240));
        this.canvas.addChild(panel);

        this.ui.createLabelOnParent(this.canvas, 'T', '⚙️ 游戏设置',
            34, 0, 300, new Color(255, 215, 0));

        let y = 220;

        this.addRow('🔊 音效总开关', y, s.soundEnabled,
            (v) => { GameManager.instance.updateSettings({ soundEnabled: v }); this.render(); });
        y -= 60;

        this.addSlider('🎵 背景音乐音量', s.musicVolume, y, new Color(46, 204, 113),
            (v) => GameManager.instance.updateSettings({ musicVolume: v }));
        y -= 60;

        this.addSlider('🔔 音效音量', s.sfxVolume, y, new Color(52, 152, 219),
            (v) => GameManager.instance.updateSettings({ sfxVolume: v }));
        y -= 60;

        this.addRow('📳 震动反馈', y, s.vibrationEnabled,
            (v) => { GameManager.instance.updateSettings({ vibrationEnabled: v }); this.render(); });
        y -= 60;

        this.addAnimationIntensity(s.animationIntensity, y);
        y -= 90;

        this.addRow('💡 显示提示信息', y, s.showTooltips,
            (v) => { GameManager.instance.updateSettings({ showTooltips: v }); this.render(); });
        y -= 60;

        this.addRow('⌨️ 启用键盘快捷键', y, s.keyboardShortcuts,
            (v) => { GameManager.instance.updateSettings({ keyboardShortcuts: v }); this.render(); });
        y -= 60;

        this.canvas.addChild(this.ui.createMenuButton(
            'Reset', '🗑️ 重置所有游戏进度',
            -200, y, new Color(192, 57, 43, 200), 260,
            () => { GameManager.instance.resetAllProgress(); this.toast('✅ 进度已重置'); }
        ));
        this.canvas.addChild(this.ui.createMenuButton(
            'Back', '← 返回主菜单',
            200, y, new Color(52, 152, 219), 260,
            () => this.ui!.loadScene('main-menu')
        ));
    }

    addRow(label: string, y: number, val: boolean, onChange: (v: boolean) => void) {
        if (!this.canvas || !this.ui) return;
        this.ui.createLabelOnParent(this.canvas, `L_${label}`,
            label, 18, -300, y, new Color(255, 255, 255), 220);
        this.ui.createToggle(this.canvas, `T_${label}`, -150, y - 14, val, onChange);
    }

    addSlider(label: string, value: number, y: number, color: Color, onChange: (v: number) => void) {
        if (!this.canvas || !this.ui) return;
        this.ui.createLabelOnParent(this.canvas, `L_${label}`,
            label, 18, -300, y, new Color(255, 255, 255), 220);
        this.ui.createLabelOnParent(this.canvas, `V_${label}`,
            `${Math.round(value * 100)}%`, 16, 280, y, new Color(255, 255, 255), 80);

        const track = this.ui.createSpriteNode(`Tr_${label}`, 320, 8, new Color(80, 80, 100));
        track.setPosition(50, y);
        this.canvas.addChild(track);

        const w = Math.round(320 * value);
        const fill = this.ui.createSpriteNode(`Fl_${label}`, Math.max(4, w), 8, color);
        fill.setPosition(-160 + w / 2, 0);
        track.addChild(fill);

        const hit = this.ui.createSpriteNode(`H_${label}`, 340, 36, new Color(0, 0, 0, 1));
        hit.setPosition(50, y);
        this.canvas.addChild(hit);

        const handler = (e: any) => {
            const p = e.getUILocation();
            const local = hit.getComponent(UITransform)!.convertToNodeSpaceAR(
                new (require('cc').Vec3)(p.x, p.y, 0));
            const nv = Math.max(0, Math.min(1, (local.x + 170) / 340));
            onChange(Math.round(nv * 100) / 100);
            this.render();
        };
        hit.on(Node.EventType.TOUCH_END, handler);
        hit.on(Node.EventType.TOUCH_MOVE, handler);
    }

    addAnimationIntensity(current: string, y: number) {
        if (!this.canvas || !this.ui) return;
        this.ui.createLabelOnParent(this.canvas, 'AL', '🎬 动画强度',
            18, -300, y, new Color(255, 255, 255), 200);

        const options: Array<{ k: string; n: string }> = [
            { k: 'off', n: '关闭' },
            { k: 'low', n: '低' },
            { k: 'medium', n: '中' },
            { k: 'high', n: '高' }
        ];
        for (let i = 0; i < 4; i++) {
            const o = options[i];
            const active = current === o.k;
            const b = this.ui.createSpriteNode(`AI_${o.k}`, 90, 38,
                active ? new Color(155, 89, 182) : new Color(80, 80, 100));
            b.setPosition(-125 + i * 95, y - 19);
            this.ui.createLabelOnParent(b, 'L', o.n, 14, 0, 0,
                new Color(255, 255, 255), 90);
            b.on(Node.EventType.TOUCH_END, () => {
                GameManager.instance.updateSettings({ animationIntensity: o.k as any });
                this.render();
            });
            b.addComponent(Button);
            this.canvas.addChild(b);
        }
    }

    toast(msg: string) {
        if (!this.canvas || !this.ui) return;
        const t = this.ui.createSpriteNode('Toast', 320, 60, new Color(0, 0, 0, 200));
        t.setPosition(0, 0);
        this.ui.createLabelOnParent(t, 'L', msg, 18, 0, 0, new Color(255, 255, 255), 320);
        this.canvas.addChild(t);
        setTimeout(() => { if (t && t.isValid) t.destroy(); }, 2000);
    }
}
