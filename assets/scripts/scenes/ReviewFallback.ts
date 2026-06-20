import { Node, find, Label, Sprite, Color, Button, UITransform } from 'cc';
import { GameManager } from '../core/GameManager';
import { Bootstrap } from '../Bootstrap';

export class ReviewFallback {
    private ui: Bootstrap | null = null;

    show(ui: Bootstrap) {
        this.ui = ui;
        const cv = find('Canvas'); if (!cv) return;
        cv.removeAllChildren();

        cv.addChild(ui.createSpriteNode('BG', 1280, 720, new Color(28, 28, 48)));
        ui.createLabelOnParent(cv, 'T', '📊 复盘对比', 32, 0, 320, new Color(255, 215, 0));

        const best = GameManager.instance.getBestRecords();
        const all = GameManager.instance.getReviewRecords();

        if (best.length === 0) {
            ui.createLabelOnParent(cv, 'Empty', '暂无记录，先去完成关卡吧！', 20, 0, 0, new Color(150, 150, 150));
            cv.addChild(ui.createMenuButton(
                'B', '← 返回主菜单', 0, -200, new Color(52, 152, 219), 240,
                () => ui.createFallbackMenu()
            ));
            return;
        }

        const bc = ui.createSpriteNode('BC', 620, 540, new Color(45, 45, 75, 240));
        bc.setPosition(-320, -10);
        cv.addChild(bc);
        ui.createLabelOnParent(cv, 'BT', '🏆 最佳记录', 20, -320, 250, new Color(255, 215, 0));

        const hc = ui.createSpriteNode('HC', 560, 540, new Color(45, 45, 75, 240));
        hc.setPosition(340, -10);
        cv.addChild(hc);
        ui.createLabelOnParent(cv, 'HT', '📜 历史记录', 20, 340, 250, new Color(52, 152, 219));

        const levelNames: Record<number, string> = {
            1: '新手入门', 2: '渐入佳境', 3: '票房热卖',
            4: '销售达人', 5: '火爆预售', 6: '终极挑战'
        };

        for (let i = 0; i < Math.min(best.length, 6); i++) {
            const rc: any = best[i];
            const row = ui.createSpriteNode(`BR_${i}`, 580, 78, new Color(55, 55, 90));
            row.setPosition(0, 200 - i * 88);
            bc.addChild(row);
            ui.createLabelOnParent(row, 'LN', `🏆 ${levelNames[rc.levelId] || rc.levelName}`,
                16, -260, 18, new Color(255, 255, 255), 220);
            ui.createLabelOnParent(row, 'Diff', rc.difficulty, 12, -260, -14, this.diffColor(rc.difficulty), 100);
            const m = [
                { l: `${rc.ordersPerMinute.toFixed(1)}/分`, c: new Color(52, 152, 219) },
                { l: `${rc.accuracy.toFixed(0)}%`, c: new Color(46, 204, 113) },
                { l: `${rc.avgProcessingTime.toFixed(1)}s`, c: new Color(230, 126, 34) },
                { l: `x${rc.consecutiveMax}`, c: new Color(155, 89, 182) }
            ];
            for (let j = 0; j < m.length; j++) {
                ui.createLabelOnParent(row, `M${j}`, m[j].l, 13, -80 + j * 90, 2, m[j].c);
            }
            ui.createLabelOnParent(row, 'SC', rc.score.toString(), 24, 240, 0, new Color(255, 215, 0));
            ui.createLabelOnParent(row, 'Eff', `效率:${rc.efficiency}`, 10, 240, -24, new Color(155, 89, 182));
        }

        const sorted = [...all].sort((a: any, b: any) => b.timestamp - a.timestamp).slice(0, 10);
        for (let i = 0; i < sorted.length; i++) {
            const rc: any = sorted[i];
            const row = ui.createSpriteNode(`HR_${i}`, 520, 50, new Color(55, 55, 90));
            row.setPosition(0, 200 - i * 54);
            hc.addChild(row);
            ui.createLabelOnParent(row, 'LN', levelNames[rc.levelId] || rc.levelName,
                13, -230, 0, new Color(255, 255, 255), 120);
            ui.createLabelOnParent(row, 'Acc', `${rc.accuracy.toFixed(0)}%`, 12, -60, 0, new Color(46, 204, 113), 60);
            ui.createLabelOnParent(row, 'Time', `${rc.avgProcessingTime.toFixed(1)}s`, 12, 30, 0, new Color(230, 126, 34), 60);
            ui.createLabelOnParent(row, 'Combo', `x${rc.consecutiveMax}`, 12, 110, 0, new Color(155, 89, 182), 60);
            ui.createLabelOnParent(row, 'SC', rc.score.toString(), 16, 200, 0, new Color(52, 152, 219), 60);
            const d = new Date(rc.timestamp);
            ui.createLabelOnParent(row, 'Date', `${(d.getMonth() + 1)}/${d.getDate()}`, 9, 240, -18, new Color(150, 150, 150), 50);
        }

        if (best.length >= 2) {
            ui.createLabelOnParent(cv, 'CT', '📈 效率对比柱状图', 18, 0, -300, new Color(255, 255, 255));
            const chart = ui.createSpriteNode('Chart', 600, 140, new Color(40, 40, 70));
            chart.setPosition(0, -370);
            cv.addChild(chart);

            const metrics2 = [
                { key: 'efficiency', color: new Color(155, 89, 182), name: '效率' },
                { key: 'accuracy', color: new Color(46, 204, 113), name: '准确度' },
                { key: 'ordersPerMinute', color: new Color(52, 152, 219), name: '速度' }
            ];

            const groupW = 560 / best.length;
            for (let i = 0; i < best.length; i++) {
                const rc: any = best[i];
                for (let j = 0; j < metrics2.length; j++) {
                    const m2 = metrics2[j];
                    const base = m2.key === 'ordersPerMinute' ? 20 : 100;
                    const val = Math.min(1, (rc[m2.key] || 0) / base);
                    const h = Math.max(4, Math.round(110 * val));
                    const bw = Math.min(12, groupW / (metrics2.length + 1));
                    const bx = -280 + (i + 0.5) * groupW + (j - 1) * (bw + 3);
                    const bar = ui.createSpriteNode(`Bar_${i}_${j}`, bw, h, m2.color);
                    bar.setPosition(bx, -55 + h / 2);
                    chart.addChild(bar);
                }
                ui.createLabelOnParent(chart, `X${i}`, `L${rc.levelId}`, 10,
                    -280 + (i + 0.5) * groupW, -70, new Color(200, 200, 200));
            }

            for (let j = 0; j < metrics2.length; j++) {
                const m2 = metrics2[j];
                const keyBox = ui.createSpriteNode(`KB${j}`, 12, 12, m2.color);
                keyBox.setPosition(-250 + j * 120, -90);
                chart.addChild(keyBox);
                ui.createLabelOnParent(chart, `KL${j}`, m2.name, 10,
                    -250 + j * 120 + 30, -90, new Color(200, 200, 200), 60);
            }
        }

        cv.addChild(ui.createMenuButton(
            'Back', '← 返回主菜单', 0, 320, new Color(52, 152, 219), 240,
            () => ui.createFallbackMenu()
        ));
    }

    diffColor(d: string): Color {
        if (d === '简单') return new Color(46, 204, 113);
        if (d === '普通') return new Color(52, 152, 219);
        if (d === '困难') return new Color(230, 126, 34);
        return new Color(192, 57, 43);
    }
}
