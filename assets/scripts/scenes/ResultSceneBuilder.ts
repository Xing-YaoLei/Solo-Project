import { Node, Label, Sprite, Color, Button, UITransform } from 'cc';
import { GameManager } from '../core/GameManager';
import { Bootstrap } from '../Bootstrap';

export class ResultSceneBuilder {
    private ui: Bootstrap | null = null;

    build(ui: Bootstrap): Node {
        this.ui = ui;
        const root = new Node('ResultScene');
        root.addComponent(UITransform).setContentSize(1280, 720);

        const levelId = GameManager.instance.currentLevelId || 1;
        const r = GameManager.instance.getLevelResult(levelId) || this.mockResult(levelId);

        const bgColor = r.passed ? new Color(20, 40, 30) : new Color(40, 20, 20);
        root.addChild(ui.createSpriteNode('BG', 1280, 720, bgColor));

        const panelColor = r.passed ? new Color(40, 70, 50, 240) : new Color(70, 40, 40, 240);
        const panel = ui.createSpriteNode('P', 900, 640, panelColor);
        root.addChild(panel);

        ui.createLabelOnParent(root, 'T',
            r.passed ? '🎉 关卡通过！' : '💔 挑战失败',
            42, 0, 280, r.passed ? new Color(46, 204, 113) : new Color(231, 76, 60));

        const ln: Record<number, string> = {
            1: '新手入门', 2: '渐入佳境', 3: '票房热卖',
            4: '销售达人', 5: '火爆预售', 6: '终极挑战'
        };
        ui.createLabelOnParent(root, 'LN', `关卡: ${ln[r.levelId] || r.levelId} - L${r.levelId}`,
            18, 0, 235, new Color(200, 200, 200));

        this.renderStars(root, r);
        this.renderScore(root, r);
        this.renderBars(root, r);
        this.renderStats(root, r);
        this.renderButtons(root, r);

        return root;
    }

    mockResult(id: number): any {
        return {
            levelId: id, passed: false, score: 0, efficiencyScore: 0, speedScore: 0, accuracyScore: 0,
            stats: {
                levelId: id, ordersProcessed: 0, ordersCorrect: 0, ordersRejected: 0,
                correctRejections: 0, errors: 0, maxConsecutiveCorrect: 0, currentConsecutiveCorrect: 0,
                totalTime: 0, processingStartTime: 0, averageProcessingTime: 0, processingTimes: [],
                ticketsSold: 0, revenue: 0, seatsUtilization: 0
            },
            timestamp: Date.now()
        };
    }

    renderStars(root: Node, r: any) {
        if (!this.ui) return;
        const sc = new Node('SC');
        sc.addComponent(UITransform).setContentSize(400, 80);
        sc.setPosition(0, 180);
        root.addChild(sc);
        const sc0 = r.efficiencyScore >= 90 ? 3 : r.efficiencyScore >= 70 ? 2 : 1;
        const stars = r.passed ? sc0 : 0;
        for (let i = 0; i < 3; i++) {
            this.ui.createLabelOnParent(sc, `S${i}`,
                i < stars ? '⭐' : '☆', 64, -100 + i * 100, 0,
                i < stars ? new Color(241, 196, 15) : new Color(100, 100, 100));
        }
    }

    renderScore(root: Node, r: any) {
        if (!this.ui) return;
        this.ui.createLabelOnParent(root, 'Score', r.score.toString(),
            52, 0, 100, new Color(255, 215, 0));
        this.ui.createLabelOnParent(root, 'ST', '综合得分',
            14, 0, 65, new Color(180, 180, 180));
    }

    renderBars(root: Node, r: any) {
        if (!this.ui) return;
        const bars = [
            { l: '⚡ 速度', s: r.speedScore, c: new Color(52, 152, 219), y: 25 },
            { l: '🎯 准确度', s: r.accuracyScore, c: new Color(46, 204, 113), y: -25 },
            { l: '📊 综合效率', s: r.efficiencyScore, c: new Color(155, 89, 182), y: -75 }
        ];
        for (const b of bars) {
            this.ui.createLabelOnParent(root, `BL_${b.l}`, b.l,
                15, -280, b.y, new Color(230, 230, 230), 150);
            const bo = this.ui.createSpriteNode(`BO_${b.l}`, 400, 22, new Color(60, 60, 80));
            bo.setPosition(70, b.y);
            root.addChild(bo);
            const w = Math.max(6, Math.round(400 * Math.min(1, b.s / 100)));
            const bf = this.ui.createSpriteNode(`BF_${b.l}`, w, 18, b.c);
            bf.setPosition(-200 + w / 2, 0);
            bo.addChild(bf);
            this.ui.createLabelOnParent(root, `BS_${b.l}`, b.s.toString(),
                15, 290, b.y, b.c);
        }
    }

    renderStats(root: Node, r: any) {
        if (!this.ui) return;
        const s = r.stats;
        const items = [
            { i: '📋', l: '处理订单数', v: s.ordersProcessed },
            { i: '✅', l: '正确处理', v: s.ordersCorrect },
            { i: '❌', l: '错误次数', v: s.errors },
            { i: '🚫', l: '正确拒绝', v: s.correctRejections || 0 },
            { i: '🔥', l: '最高连击', v: `x${s.maxConsecutiveCorrect}` },
            { i: '⏱️', l: '平均耗时', v: `${s.averageProcessingTime.toFixed(1)}秒` },
            { i: '🎫', l: '售出票数', v: s.ticketsSold },
            { i: '💰', l: '收入总额', v: `¥${s.revenue.toLocaleString()}` },
            { i: '💺', l: '座位利用率', v: `${(s.seatsUtilization * 100).toFixed(1)}%` },
            { i: '⌛', l: '总用时', v: `${Math.floor(s.totalTime / 60)}分${Math.floor(s.totalTime % 60)}秒` }
        ];
        const cols = 2, iw = 280, ih = 54, gx = 20, gy = 10;
        const tw = cols * iw + (cols - 1) * gx;
        const th = Math.ceil(items.length / cols) * (ih + gy);
        for (let i = 0; i < items.length; i++) {
            const col = i % cols, row = Math.floor(i / cols);
            const it = this.ui.createSpriteNode(`I_${i}`, iw, ih, new Color(255, 255, 255, 70));
            const x = -tw / 2 + col * (iw + gx) + iw / 2;
            const y = th / 2 - row * (ih + gy) - ih / 2 - 150;
            it.setPosition(x, y);
            root.addChild(it);
            this.ui.createLabelOnParent(it, 'Ic', items[i].i, 26, -120, 0, new Color(255, 255, 255));
            this.ui.createLabelOnParent(it, 'Lb', items[i].l, 12, -10, 12, new Color(200, 200, 200), 140);
            this.ui.createLabelOnParent(it, 'Vb', String(items[i].v), 18, -10, -12, new Color(255, 255, 255), 140);
        }
    }

    renderButtons(root: Node, r: any) {
        if (!this.ui) return;
        root.addChild(this.ui.createMenuButton(
            'Retry', '🔄 再来一局', -280, -290, new Color(230, 126, 34), 200,
            () => {
                GameManager.instance.generateSessionId();
                this.ui!.loadScene('game-scene');
            }
        ));
        if (r.passed && r.levelId < 6) {
            root.addChild(this.ui.createMenuButton(
                'Next', '➡️ 下一关', 0, -290, new Color(46, 204, 113), 200,
                () => {
                    GameManager.instance.setCurrentLevel(r.levelId + 1);
                    GameManager.instance.generateSessionId();
                    this.ui!.loadScene('game-scene');
                }
            ));
        }
        root.addChild(this.ui.createMenuButton(
            'Home', '🏠 主菜单', 280, -290, new Color(52, 152, 219), 200,
            () => this.ui!.loadScene('main-menu')
        ));
        root.addChild(this.ui.createMenuButton(
            'Rev', '📊 复盘', -140, -350, new Color(155, 89, 182), 180,
            () => this.ui!.loadScene('review-scene')
        ));
        root.addChild(this.ui.createMenuButton(
            'Set', '⚙️ 设置', 140, -350, new Color(100, 100, 120), 180,
            () => this.ui!.loadScene('settings-scene')
        ));
    }
}
