import { Node, find, Label, Sprite, Color, Button, UITransform } from 'cc';
import { GameManager } from '../core/GameManager';
import { Bootstrap } from '../Bootstrap';

export class SettingsFallback {
    private ui: Bootstrap | null = null;
    private canvas: Node | null = null;

    show(ui: Bootstrap) {
        this.ui = ui;
        this.canvas = find('Canvas');
        if (!this.canvas) return;
        this.render();
    }

    render() {
        if (!this.canvas || !this.ui) return;
        this.canvas.removeAllChildren();

        this.canvas.addChild(this.ui.createSpriteNode('BG', 1280, 720, new Color(28, 28, 48)));
        const panel = this.ui.createSpriteNode('P', 800, 600, new Color(45, 45, 75, 240));
        this.canvas.addChild(panel);

        this.ui.createLabelOnParent(this.canvas, 'T', '⚙️ 游戏设置', 32, 0, 280, new Color(255, 215, 0));

        const s = GameManager.instance.settings;
        let y = 200;

        this.addRow('🔊 音效开关', y, (x, yy) =>
            this.ui.createToggle(this.canvas!, x, yy, s.soundEnabled, v => {
                GameManager.instance.updateSettings({ soundEnabled: v });
                this.render();
            }));
        y -= 60;

        this.addSlider('🎵 背景音乐', s.musicVolume, y,
            new Color(46, 204, 113), v => GameManager.instance.updateSettings({ musicVolume: v }));
        y -= 60;

        this.addSlider('🔔 音效音量', s.sfxVolume, y,
            new Color(52, 152, 219), v => GameManager.instance.updateSettings({ sfxVolume: v }));
        y -= 60;

        this.addRow('📳 震动反馈', y, (x, yy) =>
            this.ui.createToggle(this.canvas!, x, yy, s.vibrationEnabled, v => {
                GameManager.instance.updateSettings({ vibrationEnabled: v });
                this.render();
            }));
        y -= 60;

        this.ui.createLabelOnParent(this.canvas, 'AL', '🎬 动画强度', 18, -300, y, new Color(255, 255, 255), 200);
        const ints: Array<{ k: string; n: string }> = [
            { k: 'off', n: '关' }, { k: 'low', n: '低' },
            { k: 'medium', n: '中' }, { k: 'high', n: '高' }
        ];
        for (let i = 0; i < 4; i++) {
            const it = ints[i];
            const active = s.animationIntensity === it.k;
            const bb = this.ui.createSpriteNode(`AI_${it.k}`, 80, 36,
                active ? new Color(155, 89, 182) : new Color(80, 80, 100));
            bb.setPosition(-80 + i * 80, y - 18);
            this.ui.createLabelOnParent(bb, 'L', it.n, 14, 0, 0, new Color(255, 255, 255));
            bb.on(Node.EventType.TOUCH_END, () => {
                GameManager.instance.updateSettings({ animationIntensity: it.k as any });
                this.render();
            });
            bb.addComponent(Button);
            this.canvas.addChild(bb);
        }
        y -= 80;

        this.addRow('💡 显示提示', y, (x, yy) =>
            this.ui.createToggle(this.canvas!, x, yy, s.showTooltips, v => {
                GameManager.instance.updateSettings({ showTooltips: v });
                this.render();
            }));
        y -= 60;

        this.addRow('⌨️ 键盘快捷键', y, (x, yy) =>
            this.ui.createToggle(this.canvas!, x, yy, s.keyboardShortcuts, v => {
                GameManager.instance.updateSettings({ keyboardShortcuts: v });
                this.render();
            }));
        y -= 80;

        this.canvas.addChild(this.ui.createMenuButton(
            'Reset', '🗑️ 重置所有进度', -200, y, new Color(192, 57, 43, 200), 220,
            () => { GameManager.instance.resetAllProgress(); this.toast('✅ 进度已重置'); }
        ));
        this.canvas.addChild(this.ui.createMenuButton(
            'Back', '← 返回主菜单', 200, y, new Color(52, 152, 219), 220,
            () => this.ui!.createFallbackMenu()
        ));
    }

    addRow(label: string, y: number, build: (x: number, y: number) => void) {
        if (!this.canvas || !this.ui) return;
        this.ui.createLabelOnParent(this.canvas, `L_${label}`, label, 18, -300, y, new Color(255, 255, 255), 200);
        build(-150, y);
    }

    addSlider(label: string, value: number, y: number, color: Color, onChange: (v: number) => void) {
        if (!this.canvas || !this.ui) return;
        this.ui.createLabelOnParent(this.canvas, `L_${label}`, label, 18, -300, y, new Color(255, 255, 255), 200);
        this.ui.createLabelOnParent(this.canvas, `V_${label}`, `${Math.round(value * 100)}%`, 16, 280, y, new Color(255, 255, 255));
        const track = this.ui.createSpriteNode(`T_${label}`, 300, 8, new Color(80, 80, 100));
        track.setPosition(50, y);
        this.canvas.addChild(track);
        const w = Math.round(300 * value);
        const fill = this.ui.createSpriteNode(`F_${label}`, Math.max(4, w), 8, color);
        fill.setPosition(-150 + w / 2, 0);
        track.addChild(fill);

        const hit = this.ui.createSpriteNode(`H_${label}`, 300, 30, new Color(0, 0, 0, 1));
        hit.setPosition(50, y);
        this.canvas.addChild(hit);
        hit.on(Node.EventType.TOUCH_END, (e: any) => {
            const p = e.getUILocation();
            const local = hit.getComponent(UITransform)!.convertToNodeSpaceAR(
                new (require('cc').Vec3)(p.x, p.y, 0));
            const nv = Math.max(0, Math.min(1, (local.x + 150) / 300));
            onChange(nv);
            this.render();
        });
        hit.on(Node.EventType.TOUCH_MOVE, (e: any) => {
            const p = e.getUILocation();
            const local = hit.getComponent(UITransform)!.convertToNodeSpaceAR(
                new (require('cc').Vec3)(p.x, p.y, 0));
            const nv = Math.max(0, Math.min(1, (local.x + 150) / 300));
            onChange(nv);
            this.render();
        });
    }

    toast(msg: string) {
        if (!this.canvas || !this.ui) return;
        const t = this.ui.createSpriteNode('T', 300, 60, new Color(0, 0, 0, 200));
        t.setPosition(0, 0);
        this.ui.createLabelOnParent(t, 'L', msg, 18, 0, 0, new Color(255, 255, 255));
        this.canvas.addChild(t);
        setTimeout(() => { if (t && t.isValid) t.destroy(); }, 2000);
    }
}
