import { Node, find, Label, Sprite, Color, Button, UITransform, director } from 'cc';
import { GameManager } from '../core/GameManager';
import { Bootstrap } from '../Bootstrap';

export class ResultFallback {
    private ui: Bootstrap | null = null;

    show(ui: Bootstrap, r: any) {
        this.ui = ui;
        const cv = find('Canvas'); if (!cv) return;
        cv.removeAllChildren();

        const bg = ui.createSpriteNode('BG', 1280, 720,
            r.passed ? new Color(20, 40, 30) : new Color(40, 20, 20));
        cv.addChild(bg);

        const panel = ui.createSpriteNode('P', 900, 640,
            r.passed ? new Color(40, 70, 50, 240) : new Color(70, 40, 40, 240));
        cv.addChild(panel);

        ui.createLabelOnParent(cv, 'T', r.passed ? '🎉 关卡通过！' : '💔 挑战失败',
            42, 0, 270, r.passed ? new Color(46, 204, 113) : new Color(231, 76, 60));

        const ln: Record<number, string> = {
            1: '新手入门', 2: '渐入佳境', 3: '票房热卖',
            4: '销售达人', 5: '火爆预售', 6: '终极挑战'
        };
        ui.createLabelOnParent(cv, 'LN', `关卡: ${ln[r.levelId] || r.levelId}`,
            18, 0, 225, new Color(200, 200, 200));

        const sc = r.passed ? (r.efficiencyScore >= 90 ? 3 : r.efficiencyScore >= 70 ? 2 : 1) : 0;
        const starsC = new Node('SC');
        starsC.addComponent(UITransform).setContentSize(400, 80);
        starsC.setPosition(0, 175);
        cv.addChild(starsC);
        for (let i = 0; i < 3; i++) {
            ui.createLabelOnParent(starsC, `S${i}`, i < sc ? '⭐' : '☆', 56,
                -100 + i * 100, 0,
                i < sc ? new Color(241, 196, 15) : new Color(100, 100, 100));
        }

        ui.createLabelOnParent(cv, 'Score', r.score.toString(), 48, 0, 105, new Color(255, 215, 0));
        ui.createLabelOnParent(cv, 'ST', '综合得分', 14, 0, 70, new Color(180, 180, 180));

        const bars = [
            { l: '⚡ 速度', s: r.speedScore, c: new Color(52, 152, 219), y: 30 },
            { l: '🎯 准确度', s: r.accuracyScore, c: new Color(46, 204, 113), y: -20 },
            { l: '📊 综合效率', s: r.efficiencyScore, c: new Color(155, 89, 182), y: -70 }
        ];
        for (const b of bars) {
            ui.createLabelOnParent(cv, `BL_${b.l}`, b.l, 14, -280, b.y, new Color(230, 230, 230), 150);
            const bo = ui.createSpriteNode(`BO_${b.l}`, 400, 20, new Color(60, 60, 80));
            bo.setPosition(70, b.y);
            cv.addChild(bo);
            const w = Math.max(4, Math.round(400 * Math.min(1, b.s / 100)));
            const bf = ui.createSpriteNode(`BF_${b.l}`, w, 18, b.c);
            bf.setPosition(-200 + w / 2, 0);
            bo.addChild(bf);
            ui.createLabelOnParent(cv, `BS_${b.l}`, b.s.toString(), 14, 290, b.y, b.c);
        }

        const s = r.stats;
        const items = [
            { i: '📋', l: '处理订单', v: s.ordersProcessed },
            { i: '✅', l: '正确处理', v: s.ordersCorrect },
            { i: '❌', l: '错误次数', v: s.errors },
            { i: '🚫', l: '正确拒绝', v: s.correctRejections || 0 },
            { i: '🔥', l: '最高连击', v: `x${s.maxConsecutiveCorrect}` },
            { i: '⏱️', l: '平均耗时', v: `${s.averageProcessingTime.toFixed(1)}秒` },
            { i: '🎫', l: '售出票数', v: s.ticketsSold },
            { i: '💰', l: '收入', v: `¥${s.revenue.toLocaleString()}` },
            { i: '💺', l: '座位利用', v: `${(s.seatsUtilization * 100).toFixed(1)}%` },
            { i: '⌛', l: '总用时', v: `${Math.floor(s.totalTime / 60)}分${Math.floor(s.totalTime % 60)}秒` }
        ];

        const cols = 2;
        const iw = 260, ih = 50, gx = 20, gy = 10;
        const tw = cols * iw + (cols - 1) * gx;
        const th = Math.ceil(items.length / cols) * (ih + gy);

        for (let i = 0; i < items.length; i++) {
            const col = i % cols, row = Math.floor(i / cols);
            const it = ui.createSpriteNode(`I_${i}`, iw, ih, new Color(255, 255, 255, 80));
            const x = -tw / 2 + col * (iw + gx) + iw / 2;
            const y = th / 2 - row * (ih + gy) - ih / 2 - 140;
            it.setPosition(x, y);
            cv.addChild(it);
            ui.createLabelOnParent(it, 'Ic', items[i].i, 24, -110, 0, new Color(255, 255, 255));
            ui.createLabelOnParent(it, 'Lb', items[i].l, 12, -10, 10, new Color(200, 200, 200), 120);
            ui.createLabelOnParent(it, 'Vb', String(items[i].v), 16, -10, -10, new Color(255, 255, 255), 120);
        }

        cv.addChild(ui.createMenuButton(
            'Retry', '🔄 再来一局', -250, -280, new Color(230, 126, 34), 200,
            () => { GameManager.instance.generateSessionId(); import('./GameFallback').then(m => new m.GameFallback().start(this.ui!, r.levelId)); }
        ));

        if (r.passed && r.levelId < 6) {
            cv.addChild(ui.createMenuButton(
                'Next', '➡️ 下一关', 0, -280, new Color(46, 204, 113), 200,
                () => {
                    GameManager.instance.setCurrentLevel(r.levelId + 1);
                    GameManager.instance.generateSessionId();
                    import('./GameFallback').then(m => new m.GameFallback().start(this.ui!, r.levelId + 1));
                }
            ));
        }

        cv.addChild(ui.createMenuButton(
            'Home', '🏠 主菜单', 250, -280, new Color(52, 152, 219), 200,
            () => ui.createFallbackMenu()
        ));

        cv.addChild(ui.createMenuButton(
            'Rev', '📊 复盘', 250, -340, new Color(155, 89, 182), 200,
            () => import('./ReviewFallback').then(m => new m.ReviewFallback().show(ui))
        ));
    }
}
