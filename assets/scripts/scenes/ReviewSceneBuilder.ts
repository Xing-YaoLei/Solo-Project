import { Node, Label, Sprite, Color, Button, UITransform, ScrollView, Mask, Graphics } from 'cc';
import { GameManager } from '../core/GameManager';
import { Bootstrap } from '../Bootstrap';

export class ReviewSceneBuilder {
    private ui: Bootstrap | null = null;

    build(ui: Bootstrap): Node {
        this.ui = ui;
        const root = new Node('ReviewScene');
        root.addComponent(UITransform).setContentSize(1280, 720);
        this.render(root);
        return root;
    }

    render(root: Node) {
        if (!this.ui) return;
        root.removeAllChildren();

        root.addChild(this.ui.createSpriteNode('BG', 1280, 720, new Color(28, 28, 48)));
        this.ui.createLabelOnParent(root, 'T', '📊 关卡复盘 · 核销效率对比',
            32, 0, 320, new Color(255, 215, 0));

        const best = GameManager.instance.getBestRecords();
        const all = GameManager.instance.getReviewRecords();

        if (best.length === 0 && all.length === 0) {
            this.ui.createLabelOnParent(root, 'Empty',
                '暂无任何记录，先完成关卡再回来查看复盘吧！',
                20, 0, 0, new Color(150, 150, 150), 800);
            this.ui.createLabelOnParent(root, 'Empty2',
                '💡 完成关卡后，这里会显示各关卡的核销效率对比',
                14, 0, -40, new Color(100, 100, 100), 600);
            root.addChild(this.ui.createMenuButton(
                'B', '← 返回主菜单', 0, -200, new Color(52, 152, 219), 240,
                () => this.ui!.loadScene('main-menu')
            ));
            root.addChild(this.ui.createMenuButton(
                'Play', '🎮 去玩第一关', 0, -280, new Color(46, 204, 113), 240,
                () => { GameManager.instance.setCurrentLevel(1); this.ui!.loadScene('game-scene'); }
            ));
            return;
        }

        const bc = this.ui.createSpriteNode('BC', 600, 540, new Color(45, 45, 75, 240));
        bc.setPosition(-340, -20);
        root.addChild(bc);
        this.ui.createLabelOnParent(root, 'BT', '🏆 各关卡最佳记录',
            20, -340, 255, new Color(255, 215, 0));

        const hc = this.ui.createSpriteNode('HC', 540, 540, new Color(45, 45, 75, 240));
        hc.setPosition(320, -20);
        root.addChild(hc);
        this.ui.createLabelOnParent(root, 'HT', `📜 最近历史记录 (${Math.min(10, all.length)}条)`,
            20, 320, 255, new Color(52, 152, 219));

        this.renderBest(root, best);
        this.renderHistory(root, all);
        this.renderChart(root, best);

        root.addChild(this.ui.createMenuButton(
            'Back', '← 返回主菜单', -500, 320, new Color(52, 152, 219), 200,
            () => this.ui!.loadScene('main-menu')
        ));
        root.addChild(this.ui.createMenuButton(
            'Clear', '🗑️ 清空记录', 500, 320, new Color(100, 100, 100), 200,
            () => { GameManager.instance.resetAllProgress(); this.render(root); }
        ));
    }

    renderBest(root: Node, best: any[]) {
        if (!this.ui) return;
        const levelNames: Record<number, string> = {
            1: '新手入门', 2: '渐入佳境', 3: '票房热卖',
            4: '销售达人', 5: '火爆预售', 6: '终极挑战'
        };
        for (let i = 0; i < Math.min(best.length, 6); i++) {
            const rc: any = best[i];
            const row = this.ui.createSpriteNode(`BR_${i}`, 560, 80,
                new Color(55, 55, 90, 230));
            row.setPosition(-340, 200 - i * 88);
            root.addChild(row);

            const dc = this.diffColor(rc.difficulty);
            const dt = this.ui.createSpriteNode('D', 64, 24, dc);
            dt.setPosition(-250, 28);
            this.ui.createLabelOnParent(dt, 'L', rc.difficulty, 12, 0, 0, new Color(255, 255, 255), 64);
            row.addChild(dt);

            this.ui.createLabelOnParent(row, 'LN',
                `L${rc.levelId} ${levelNames[rc.levelId] || rc.levelName || ''}`,
                17, -100, 28, new Color(255, 255, 255), 260);

            const metrics = [
                { l: `${rc.ordersPerMinute.toFixed(1)}单/分`, c: new Color(52, 152, 219) },
                { l: `准确${rc.accuracy.toFixed(0)}%`, c: new Color(46, 204, 113) },
                { l: `耗时${rc.avgProcessingTime.toFixed(1)}s`, c: new Color(230, 126, 34) },
                { l: `连x${rc.consecutiveMax}`, c: new Color(155, 89, 182) }
            ];
            for (let j = 0; j < metrics.length; j++) {
                this.ui.createLabelOnParent(row, `M${j}`, metrics[j].l,
                    12, -160 + j * 90, -10, metrics[j].c, 80);
            }
            this.ui.createLabelOnParent(row, 'SC', rc.score.toString(),
                26, 220, 5, new Color(255, 215, 0));
            this.ui.createLabelOnParent(row, 'Eff', `效率${rc.efficiency}`,
                11, 220, -25, new Color(155, 89, 182));
        }
    }

    renderHistory(root: Node, all: any[]) {
        if (!this.ui) return;
        const levelNames: Record<number, string> = {
            1: 'L1入门', 2: 'L2佳境', 3: 'L3热卖',
            4: 'L4达人', 5: 'L5预售', 6: 'L6终极'
        };
        const sorted = [...all].sort((a: any, b: any) => b.timestamp - a.timestamp).slice(0, 10);
        for (let i = 0; i < sorted.length; i++) {
            const rc: any = sorted[i];
            const row = this.ui.createSpriteNode(`HR_${i}`, 500, 50, new Color(55, 55, 90, 230));
            row.setPosition(320, 200 - i * 54);
            root.addChild(row);

            this.ui.createLabelOnParent(row, 'LN',
                levelNames[rc.levelId] || `L${rc.levelId}`,
                13, -220, 0, new Color(255, 255, 255), 110);
            this.ui.createLabelOnParent(row, 'Acc', `${rc.accuracy.toFixed(0)}%`,
                12, -80, 0, new Color(46, 204, 113), 60);
            this.ui.createLabelOnParent(row, 'Time', `${rc.avgProcessingTime.toFixed(1)}s`,
                12, -10, 0, new Color(230, 126, 34), 60);
            this.ui.createLabelOnParent(row, 'Combo', `x${rc.consecutiveMax}`,
                12, 60, 0, new Color(155, 89, 182), 50);
            this.ui.createLabelOnParent(row, 'SC', rc.score.toString(),
                17, 160, 0, new Color(52, 152, 219), 60);

            const d = new Date(rc.timestamp);
            this.ui.createLabelOnParent(row, 'Date',
                `${(d.getMonth() + 1)}/${d.getDate()} ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`,
                9, 230, -16, new Color(150, 150, 150), 70);
        }
    }

    renderChart(root: Node, best: any[]) {
        if (!this.ui || best.length < 2) return;

        this.ui.createLabelOnParent(root, 'CT', '📈 多维度核销效率对比图',
            18, 0, -310, new Color(255, 255, 255));

        const cw = 700, ch = 180;
        const chart = this.ui.createSpriteNode('Chart', cw, ch, new Color(40, 40, 70, 240));
        chart.setPosition(0, -405);
        root.addChild(chart);

        const metrics2 = [
            { key: 'efficiency', name: '综合效率', color: new Color(155, 89, 182, 255), max: 150 },
            { key: 'accuracy', name: '准确度', color: new Color(46, 204, 113, 255), max: 100 },
            { key: 'ordersPerMinute', name: '处理速度', color: new Color(52, 152, 219, 255), max: 20 }
        ];

        const lp = 40, rp = 20, tp = 20, bp = 35;
        const iw = cw - lp - rp;
        const ih = ch - tp - bp;
        const gw = iw / best.length;
        const bw = Math.min(14, gw / (metrics2.length + 1.5));

        const g = chart.getComponent(Graphics) || chart.addComponent(Graphics);
        g.lineWidth = 1;
        g.strokeColor = new Color(100, 100, 120, 255);
        g.moveTo(lp, bp);
        g.lineTo(cw - rp, bp);
        g.moveTo(lp, bp);
        g.lineTo(lp, ch - tp);
        g.stroke();

        for (let i = 0; i < best.length; i++) {
            const rc: any = best[i];
            const cx = lp + (i + 0.5) * gw;

            for (let j = 0; j < metrics2.length; j++) {
                const m = metrics2[j];
                const val = Math.min(1, (rc[m.key] || 0) / m.max);
                const bh = Math.max(3, Math.round(ih * val));
                const bx = cx + (j - 1) * (bw + 4);
                g.fillColor = m.color;
                g.rect(bx - bw / 2, bp, bw, bh);
                g.fill();
            }

            const xl = this.ui.createLabel('XL', `L${rc.levelId}`, 10, cx - cw / 2, -ch / 2 + 12,
                new Color(200, 200, 200), 40);
            chart.addChild(xl.node);
        }

        for (let j = 0; j < metrics2.length; j++) {
            const m = metrics2[j];
            const lx = 60 + j * 150;
            const cb = this.ui.createSpriteNode(`CB${j}`, 12, 12, m.color);
            cb.setPosition(-cw / 2 + lx, ch / 2 - 12);
            chart.addChild(cb);
            this.ui.createLabelOnParent(chart, `CL${j}`, m.name, 11,
                -cw / 2 + lx + 30, ch / 2 - 12, new Color(220, 220, 220), 80);
        }
    }

    diffColor(d: string): Color {
        if (d === '简单') return new Color(46, 204, 113);
        if (d === '普通') return new Color(52, 152, 219);
        if (d === '困难') return new Color(230, 126, 34);
        return new Color(192, 57, 43);
    }
}
