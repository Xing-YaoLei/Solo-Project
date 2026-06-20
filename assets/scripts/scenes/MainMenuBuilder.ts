import { Node, Label, Sprite, Color, Button, UITransform, find } from 'cc';
import { GameManager } from '../core/GameManager';
import { Bootstrap } from '../Bootstrap';

export class MainMenuBuilder {
    private ui: Bootstrap | null = null;

    build(ui: Bootstrap): Node {
        this.ui = ui;
        const root = new Node('MainMenu');
        root.addComponent(UITransform).setContentSize(1280, 720);

        const bg = ui.createSpriteNode('BG', 1280, 720, new Color(28, 28, 48));
        root.addChild(bg);

        ui.createLabelOnParent(root, 'T', '🎫 票务经营模拟大师', 48, 0, 220, new Color(255, 215, 0));
        ui.createLabelOnParent(root, 'S', '活动票务 · 演出票务经营模拟', 20, 0, 160, new Color(180, 180, 200));
        ui.createLabelOnParent(root, 'ST', '快速处理票务订单，成为票房之王！', 16, 0, 125, new Color(150, 150, 150));

        root.addChild(ui.createMenuButton(
            'Play', '🎮 开始游戏', 0, 40, new Color(46, 204, 113), 280,
            () => this.showLevels(root)
        ));
        root.addChild(ui.createMenuButton(
            'Levels', '📋 关卡选择', 0, -20, new Color(52, 152, 219), 280,
            () => this.showLevels(root)
        ));
        root.addChild(ui.createMenuButton(
            'Set', '⚙️ 游戏设置', 0, -80, new Color(155, 89, 182), 280,
            () => ui.loadScene('settings-scene')
        ));
        root.addChild(ui.createMenuButton(
            'Rev', '📊 数据复盘', 0, -140, new Color(230, 126, 34), 280,
            () => ui.loadScene('review-scene')
        ));

        ui.createLabelOnParent(root, 'Hint',
            '💡 触屏点击座位选座 | 键盘: [空格]确认 [R]拒绝 [S]推荐 [C]清空 [ESC]暂停',
            14, 0, -240, new Color(150, 150, 150), 900);

        ui.createLabelOnParent(root, 'Ver',
            'v1.0.0  |  Cocos Creator + TypeScript + Tiled',
            11, 0, -300, new Color(100, 100, 100), 600);

        return root;
    }

    showLevels(root: Node): void {
        if (!this.ui) return;
        root.removeAllChildren();

        const bg = this.ui.createSpriteNode('BG', 1280, 720, new Color(28, 28, 48));
        root.addChild(bg);

        this.ui.createLabelOnParent(root, 'T', '🎯 选择关卡', 36, 0, 310, new Color(255, 255, 255));

        const levels = [
            { id: 1, name: '新手入门', desc: '简单演唱会，学习基础操作', diff: '简单', dc: new Color(46, 204, 113), t: '2分钟', o: 15 },
            { id: 2, name: '渐入佳境', desc: '增加VIP和学生票，复杂度提升', diff: '简单', dc: new Color(46, 204, 113), t: '2.5分钟', o: 25 },
            { id: 3, name: '票房热卖', desc: '全票种开放，热门演唱会', diff: '普通', dc: new Color(52, 152, 219), t: '3分钟', o: 40 },
            { id: 4, name: '销售达人', desc: '订单节奏加快，考验熟练度', diff: '普通', dc: new Color(52, 152, 219), t: '3分钟', o: 55 },
            { id: 5, name: '火爆预售', desc: '预售首日，订单量巨大', diff: '困难', dc: new Color(230, 126, 34), t: '3.3分钟', o: 70 },
            { id: 6, name: '终极挑战', desc: '最高难度，专业级挑战', diff: '专家', dc: new Color(192, 57, 43), t: '4分钟', o: 100 }
        ];

        const completed = GameManager.instance.getCompletedLevelIds();

        for (let i = 0; i < levels.length; i++) {
            const lv = levels[i];
            const col = i % 3;
            const row = Math.floor(i / 3);
            const unlocked = lv.id === 1 || completed.includes(lv.id - 1);

            const card = this.ui.createSpriteNode(`C_${lv.id}`, 360, 200,
                unlocked ? new Color(50, 50, 80, 230) : new Color(60, 60, 60, 200));
            card.setPosition(-360 + col * 360, 110 - row * 230);
            root.addChild(card);

            const dt = this.ui.createSpriteNode('D', 70, 24, lv.dc);
            dt.setPosition(-140, 75);
            const dtl = this.ui.createLabel('Lb', lv.diff, 12, 0, 0, new Color(255, 255, 255), 70);
            dt.addChild(dtl.node);
            card.addChild(dt);

            this.ui.createLabelOnParent(card, 'N',
                `${unlocked ? '' : '🔒 '}${lv.id}. ${lv.name}`,
                22, 0, 25, new Color(255, 255, 255));
            this.ui.createLabelOnParent(card, 'Desc', lv.desc, 13, 0, -25, new Color(200, 200, 200), 320);
            this.ui.createLabelOnParent(card, 'I',
                `⏱️ ${lv.t} | 🎯 ${lv.o}单`, 13, 0, -70, new Color(180, 180, 180));

            const best = GameManager.instance.getLevelResult(lv.id);
            if (best) {
                this.ui.createLabelOnParent(card, 'Best',
                    `🏆 最高: ${best.score}分`, 11, 0, -95, new Color(255, 215, 0));
            }

            if (unlocked) {
                const btn = card.addComponent(Button);
                btn.transition = Button.Transition.SCALE;
                btn.zoomScale = 0.95;
                card.on(Node.EventType.TOUCH_END, () => {
                    GameManager.instance.setCurrentLevel(lv.id);
                    GameManager.instance.generateSessionId();
                    this.ui!.loadScene('game-scene');
                });
            }
        }

        root.addChild(this.ui.createMenuButton(
            'B', '← 返回主菜单', -480, -290, new Color(100, 100, 100), 200,
            () => this.ui!.loadScene('main-menu')
        ));
    }
}
