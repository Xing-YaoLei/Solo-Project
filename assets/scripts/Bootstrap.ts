import { _decorator, Component, Node, director, find, Canvas, UITransform, Label, Sprite, Color, Button, view, Input, KeyCode, UIOpacity } from 'cc';
import { GameManager } from './core/GameManager';
import { AudioManager } from './core/AudioManager';
import { FeedbackManager } from './core/FeedbackManager';
const { ccclass, property } = _decorator;

@ccclass('Bootstrap')
export class Bootstrap extends Component {
    @property
    startScene: string = 'main-menu';

    onLoad() {
        const gm = GameManager.instance;
        const am = AudioManager.instance;
        const fm = FeedbackManager.instance;
        this.node.addChild(gm.node);
        this.node.addChild(am.node);
        this.node.addChild(fm.node);

        const canvas = find('Canvas');
        if (canvas) {
            const ui = canvas.getComponent(UITransform);
            if (ui) ui.setContentSize(1280, 720);
        }

        this.scheduleOnce(() => {
            director.loadScene(this.startScene, (err) => {
                if (err) this.createFallbackMenu();
                else this.scheduleOnce(() => {
                    const c = find('Canvas');
                    if (!c || c.children.length === 0) this.createFallbackMenu();
                }, 0.5);
            });
        }, 0.1);
    }

    createSpriteNode(name: string, w: number, h: number, color: Color): Node {
        const n = new Node(name);
        const ui = n.addComponent(UITransform);
        ui.setContentSize(w, h);
        const s = n.addComponent(Sprite);
        s.color = color;
        return n;
    }

    createLabel(parent: Node, name: string, text: string, size: number, x: number, y: number, color: Color, width?: number): Label {
        const n = new Node(name);
        const ui = n.addComponent(UITransform);
        ui.setContentSize(width || 400, size + 8);
        n.setPosition(x, y);
        const l = n.addComponent(Label);
        l.string = text;
        l.fontSize = size;
        l.color = color;
        l.lineHeight = size + 8;
        parent.addChild(n);
        return l;
    }

    createLabelOnParent(parent: Node, name: string, text: string, size: number, x: number, y: number, color: Color, w?: number): Label {
        const n = new Node(name);
        const ui = n.addComponent(UITransform);
        ui.setContentSize(w || 400, size + 8);
        n.setPosition(x, y);
        const l = n.addComponent(Label);
        l.string = text;
        l.fontSize = size;
        l.color = color;
        l.lineHeight = size + 8;
        l.horizontalAlign = Label.HorizontalAlign.CENTER;
        parent.addChild(n);
        return l;
    }

    createMenuButton(name: string, text: string, x: number, y: number, color: Color, w: number, cb: () => void): Node {
        const n = this.createSpriteNode(name, w, 50, color);
        n.setPosition(x, y);
        this.createLabelOnParent(n, 'L', text, 18, 0, 0, new Color(255, 255, 255), w);
        const btn = n.addComponent(Button);
        btn.transition = Button.Transition.SCALE;
        btn.zoomScale = 0.95;
        n.on(Node.EventType.TOUCH_END, cb);
        return n;
    }

    createToggle(cv: Node, x: number, y: number, val: boolean, onChange: (v: boolean) => void): Node {
        const track = this.createSpriteNode(`T_${x}`, 60, 28, val ? new Color(46, 204, 113) : new Color(120, 120, 140));
        track.setPosition(x + 30, y);
        cv.addChild(track);
        const thumb = this.createSpriteNode('Th', 22, 22, new Color(255, 255, 255));
        thumb.setPosition(val ? 15 : -15, 0);
        track.addChild(thumb);
        const btn = track.addComponent(Button);
        btn.transition = Button.Transition.NONE;
        track.on(Node.EventType.TOUCH_END, () => {
            const nv = !val;
            onChange(nv);
            this.createToggle(cv, x, y, nv, onChange);
            track.destroy();
        });
        return track;
    }

    createFallbackMenu(): void {
        const cv = find('Canvas'); if (!cv) return;
        cv.removeAllChildren();
        cv.addChild(this.createSpriteNode('BG', 1280, 720, new Color(28, 28, 48, 255)));
        this.createLabel(cv, 'T', '🎫 票务经营模拟大师', 48, 0, 220, new Color(255, 215, 0, 255));
        this.createLabel(cv, 'S', '快速处理票务订单，成为票房之王！', 20, 0, 160, new Color(180, 180, 200, 255));
        cv.addChild(this.createMenuButton('G', '🎮 开始游戏', 0, 60, new Color(46, 204, 113, 255), 240, () => this.showLevelSelect()));
        cv.addChild(this.createMenuButton('L', '📋 关卡选择', 0, -10, new Color(52, 152, 219, 255), 240, () => this.showLevelSelect()));
        cv.addChild(this.createMenuButton('Set', '⚙️ 设置', 0, -80, new Color(155, 89, 182, 255), 240, () => import('./scenes/SettingsFallback').then(m => new m.SettingsFallback().show(this))));
        cv.addChild(this.createMenuButton('R', '📊 复盘', 0, -150, new Color(230, 126, 34, 255), 240, () => import('./scenes/ReviewFallback').then(m => new m.ReviewFallback().show(this))));
        this.createLabel(cv, 'H', '💡 快捷键: [空格]=确认 [R]=拒绝 [S]=推荐 [C]=清空 [ESC]=暂停', 14, 0, -260, new Color(150, 150, 150));
    }

    showLevelSelect(): void {
        const cv = find('Canvas'); if (!cv) return;
        cv.removeAllChildren();
        cv.addChild(this.createSpriteNode('BG', 1280, 720, new Color(28, 28, 48)));
        this.createLabel(cv, 'T', '🎯 选择关卡', 36, 0, 320, new Color(255, 255, 255));
        const levels = [
            { id: 1, name: '新手入门', desc: '学习基础操作', diff: '简单', dc: new Color(46, 204, 113), t: '2分钟', o: 15 },
            { id: 2, name: '渐入佳境', desc: '增加VIP和学生票', diff: '简单', dc: new Color(46, 204, 113), t: '2.5分钟', o: 25 },
            { id: 3, name: '票房热卖', desc: '全票种开放', diff: '普通', dc: new Color(52, 152, 219), t: '3分钟', o: 40 },
            { id: 4, name: '销售达人', desc: '考验熟练度', diff: '普通', dc: new Color(52, 152, 219), t: '3分钟', o: 55 },
            { id: 5, name: '火爆预售', desc: '订单量巨大', diff: '困难', dc: new Color(230, 126, 34), t: '3.3分钟', o: 70 },
            { id: 6, name: '终极挑战', desc: '最高难度', diff: '专家', dc: new Color(192, 57, 43), t: '4分钟', o: 100 }
        ];
        for (let i = 0; i < levels.length; i++) {
            const l = levels[i];
            const c = i % 3, r = Math.floor(i / 3);
            const card = this.createSpriteNode(`C_${l.id}`, 360, 200, new Color(50, 50, 80, 230));
            card.setPosition(-360 + c * 360, 120 - r * 230);
            const dt = this.createSpriteNode('D', 70, 24, l.dc);
            dt.setPosition(-140, 75);
            this.createLabelOnParent(dt, 'L', l.diff, 12, 0, 0, new Color(255, 255, 255));
            card.addChild(dt);
            this.createLabelOnParent(card, 'N', `${l.id}. ${l.name}`, 22, 0, 25, new Color(255, 255, 255));
            this.createLabelOnParent(card, 'Desc', l.desc, 13, 0, -25, new Color(200, 200, 200), 320);
            this.createLabelOnParent(card, 'I', `⏱️ ${l.t} | 🎯 ${l.o}单`, 13, 0, -70, new Color(180, 180, 180));
            const btn = card.addComponent(Button);
            btn.transition = Button.Transition.SCALE;
            btn.zoomScale = 0.95;
            card.on(Node.EventType.TOUCH_END, () => {
                GameManager.instance.setCurrentLevel(l.id);
                GameManager.instance.generateSessionId();
                import('./scenes/GameFallback').then(m => new m.GameFallback().start(this, l.id));
            });
            cv.addChild(card);
        }
        cv.addChild(this.createMenuButton('B', '← 返回', -480, -300, new Color(100, 100, 100), 200, () => this.createFallbackMenu()));
    }
}
