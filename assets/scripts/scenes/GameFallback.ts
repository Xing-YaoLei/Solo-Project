import { Node, find, Label, Sprite, Color, Button, UITransform, Input, KeyCode, UIOpacity, director } from 'cc';
import { GameManager } from '../core/GameManager';
import { Bootstrap } from '../Bootstrap';

export class GameFallback {
    private ui: Bootstrap | null = null;
    private canvas: Node | null = null;

    private timerLabel: Label | null = null;
    private progressLabel: Label | null = null;
    private errorLabel: Label | null = null;
    private comboLabel: Label | null = null;
    private orderPanel: Node | null = null;
    private seatMap: Node | null = null;

    private state: any = {
        timeLeft: 0, processed: 0, correct: 0, errors: 0,
        combo: 0, maxCombo: 0, selectedSeats: 0, targetSeats: 2,
        seatMap: new Map<string, any>(), processingTimes: [],
        orderStartTime: 0, revenue: 0, seatsSold: 0, ticketsSold: 0,
        orderSeatType: 'standard', orderValid: true, timerStarted: false
    };

    private sections = [
        { type: 'VIP', rows: 3, perRow: 8, color: new Color(255, 215, 0, 200), price: 1280 },
        { type: 'PREMIUM', rows: 3, perRow: 12, color: new Color(155, 89, 182, 200), price: 680 },
        { type: 'STANDARD', rows: 4, perRow: 15, color: new Color(52, 152, 219, 200), price: 280 }
    ];

    private config: any = null;
    private levelId = 1;
    private paused = false;

    start(ui: Bootstrap, levelId: number) {
        this.ui = ui;
        this.levelId = levelId;
        this.canvas = find('Canvas');
        if (!this.canvas) return;
        this.canvas.removeAllChildren();

        const configs: Record<number, any> = {
            1: { time: 120, target: 15, maxErrors: 5 },
            2: { time: 150, target: 25, maxErrors: 6 },
            3: { time: 180, target: 40, maxErrors: 7 },
            4: { time: 180, target: 55, maxErrors: 6 },
            5: { time: 200, target: 70, maxErrors: 5 },
            6: { time: 240, target: 100, maxErrors: 5 }
        };
        this.config = configs[levelId] || configs[1];
        this.state.timeLeft = this.config.time;
        this.state.processingTimes = [];

        this.buildUI();
        this.setupShortcuts();

        setTimeout(() => this.showCountdown(() => {
            this.tickTimer();
            this.state.orderStartTime = Date.now();
            this.generateOrder();
        }), 300);
    }

    buildUI() {
        if (!this.canvas || !this.ui) return;

        this.canvas.addChild(this.ui.createSpriteNode('BG', 1280, 720, new Color(24, 24, 40)));
        const hud = new Node('HUD');
        hud.addComponent(UITransform).setContentSize(1280, 720);
        this.canvas.addChild(hud);

        const topBar = this.ui.createSpriteNode('TB', 1280, 60, new Color(40, 40, 70, 230));
        topBar.setPosition(0, 330);
        hud.addChild(topBar);

        this.timerLabel = this.ui.createLabelOnParent(hud, 'T', '⏱️ 2:00', 24, -500, 330, new Color(46, 204, 113));
        this.progressLabel = this.ui.createLabelOnParent(hud, 'P', '📋 0 / 15 单', 20, 0, 330, new Color(255, 255, 255));
        this.errorLabel = this.ui.createLabelOnParent(hud, 'E', '❌ 0 / 5', 18, 500, 330, new Color(231, 76, 60));
        this.comboLabel = this.ui.createLabelOnParent(hud, 'C', '🔥 连击 x0', 16, 500, 295, new Color(241, 196, 15));

        this.orderPanel = this.ui.createSpriteNode('OP', 420, 500, new Color(45, 45, 75, 240));
        this.orderPanel.setPosition(-380, 0);
        this.canvas.addChild(this.orderPanel);

        this.seatMap = this.ui.createSpriteNode('SM', 600, 520, new Color(35, 35, 55, 240));
        this.seatMap.setPosition(80, 10);
        this.canvas.addChild(this.seatMap);

        const stage = this.ui.createSpriteNode('ST', 500, 40, new Color(100, 50, 50, 255));
        stage.setPosition(80, 240);
        this.ui.createLabelOnParent(stage, 'L', '🎤 舞台 STAGE', 20, 0, 0, new Color(255, 255, 255));
        this.canvas.addChild(stage);

        const rulesPanel = this.ui.createSpriteNode('RP', 200, 520, new Color(40, 40, 65, 240));
        rulesPanel.setPosition(500, 10);
        this.canvas.addChild(rulesPanel);
        this.ui.createLabelOnParent(this.canvas, 'RT', '📖 票种规则', 16, 500, 255, new Color(255, 215, 0));

        const rules = [
            { name: 'VIP票', price: '¥1280', color: new Color(255, 215, 0, 120), note: '需身份证' },
            { name: '高级票', price: '¥680', color: new Color(155, 89, 182, 120), note: '需身份证' },
            { name: '标准票', price: '¥280', color: new Color(52, 152, 219, 120), note: '无需证件' },
            { name: '学生票', price: '¥180', color: new Color(46, 204, 113, 120), note: '需学生证' },
            { name: '团体票', price: '¥220', color: new Color(230, 126, 34, 120), note: '≥10人' }
        ];
        for (let i = 0; i < rules.length; i++) {
            const r = rules[i];
            const it = this.ui.createSpriteNode(`R_${i}`, 180, 42, r.color);
            it.setPosition(500, 230 - i * 52);
            this.ui.createLabelOnParent(it, 'T', `[${i + 1}] ${r.name} ${r.price}`, 12, -70, 8, new Color(255, 255, 255), 160);
            this.ui.createLabelOnParent(it, 'N', r.note, 10, -70, -10, new Color(230, 230, 230), 160);
            this.canvas.addChild(it);
        }

        this.buildSeats();
        this.buildButtons();
    }

    buildSeats() {
        if (!this.seatMap || !this.ui) return;
        let sy = 180;
        for (const sec of this.sections) {
            for (let row = 0; row < sec.rows; row++) {
                const w = sec.perRow * 36;
                const sx = 80 - w / 2;
                for (let col = 0; col < sec.perRow; col++) {
                    const sid = `${sec.type}_${row}_${col}`;
                    this.state.seatMap.set(sid, { type: sec.type, selected: false, sold: false, section: sec });
                    const seat = this.ui.createSpriteNode(`Seat_${sid}`, 30, 26, sec.color);
                    seat.setPosition(sx + col * 36 + 15, sy - 10);
                    this.ui.createLabelOnParent(seat, 'L', `${row + 1}-${col + 1}`, 9, 0, 0, new Color(0, 0, 0, 180));
                    seat.on(Node.EventType.TOUCH_END, () => this.onSeatClick(sid, sec, seat));
                    this.seatMap.addChild(seat);
                }
                sy -= 36;
            }
            sy -= 10;
        }
    }

    onSeatClick(id: string, sec: any, seat: Node) {
        if (this.paused) return;
        const info = this.state.seatMap.get(id);
        if (!info || info.sold) return;
        const sp = seat.getComponent(Sprite)!;
        if (info.selected) {
            info.selected = false;
            this.state.selectedSeats--;
            sp.color = sec.color;
        } else if (this.state.selectedSeats < this.state.targetSeats) {
            info.selected = true;
            this.state.selectedSeats++;
            sp.color = new Color(241, 196, 15, 255);
        }
        this.updateHint();
    }

    buildButtons() {
        if (!this.canvas || !this.ui) return;
        this.canvas.addChild(this.ui.createMenuButton(
            'OK', '✅ 确认 [空格]', -380, -260, new Color(46, 204, 113), 180,
            () => this.processAction(true)), 100);
        this.canvas.addChild(this.ui.createMenuButton(
            'RJ', '🚫 拒绝 [R]', -200, -260, new Color(231, 76, 60), 160,
            () => this.processAction(false)), 100);
        this.canvas.addChild(this.ui.createMenuButton(
            'SG', '💡 推荐 [S]', -500, -260, new Color(52, 152, 219), 120,
            () => this.suggestSeats()), 100);
        this.canvas.addChild(this.ui.createMenuButton(
            'CL', '🗑️ 清空 [C]', -380, -320, new Color(127, 140, 141), 180,
            () => this.clearSelection()), 100);
        this.canvas.addChild(this.ui.createMenuButton(
            'PS', '⏸️ 暂停 [ESC]', 500, 260, new Color(100, 100, 120), 140,
            () => this.showPauseMenu()), 100);
    }

    setupShortcuts() {
        Input.instance.on(Input.EventType.KEY_DOWN, (e: any) => {
            if (this.paused) return;
            const k = e.keyCode;
            if (k === KeyCode.SPACE) { e.propagationStopped = true; this.processAction(true); }
            else if (k === KeyCode.KEY_R) this.processAction(false);
            else if (k === KeyCode.KEY_S) this.suggestSeats();
            else if (k === KeyCode.KEY_C) this.clearSelection();
            else if (k === KeyCode.ESCAPE) this.showPauseMenu();
        });
    }

    suggestSeats() {
        if (!this.ui || !this.seatMap) return;
        let sel = 0;
        const tt = this.state.orderSeatType.toLowerCase();
        for (const [id, info] of this.state.seatMap) {
            if (sel >= this.state.targetSeats) break;
            if (!info.sold && !info.selected && info.type.toLowerCase().includes(tt)) {
                info.selected = true; sel++;
            }
        }
        this.state.selectedSeats = sel;
        this.refreshSeats();
        this.updateHint();
    }

    clearSelection() {
        for (const [, info] of this.state.seatMap) info.selected = false;
        this.state.selectedSeats = 0;
        this.refreshSeats();
        this.updateHint();
    }

    refreshSeats() {
        if (!this.seatMap) return;
        this.seatMap.children.forEach(c => {
            if (!c.name.startsWith('Seat_')) return;
            const id = c.name.replace('Seat_', '');
            const info = this.state.seatMap.get(id);
            const sp = c.getComponent(Sprite);
            if (info && sp) {
                if (info.sold) sp.color = new Color(127, 140, 141, 150);
                else if (info.selected) sp.color = new Color(241, 196, 15, 255);
                else sp.color = info.section.color;
            }
        });
    }

    updateHint() {
        if (!this.orderPanel || !this.ui) return;
        let hint = this.orderPanel.getChildByName('Hint');
        if (!hint) {
            hint = new Node('Hint');
            hint.addComponent(UITransform).setContentSize(400, 30);
            hint.setPosition(0, -210);
            const l = hint.addComponent(Label);
            l.fontSize = 14;
            this.orderPanel.addChild(hint);
        }
        const l = hint.getComponent(Label)!;
        const { selectedSeats: s, targetSeats: t } = this.state;
        if (s === 0) { l.string = '💡 选择座位 或 [R]拒绝'; l.color = new Color(180, 180, 180); }
        else if (s === t) { l.string = `✅ ${s}/${t} [空格]确认`; l.color = new Color(46, 204, 113); }
        else if (s < t) { l.string = `📍 ${s}/${t} 继续选择`; l.color = new Color(241, 196, 15); }
        else { l.string = `⚠️ ${s}超过${t}`; l.color = new Color(231, 76, 60); }
    }

    processAction(confirm: boolean) {
        if (this.paused) return;
        this.state.processingTimes.push((Date.now() - this.state.orderStartTime) / 1000);

        const playerValid = confirm && this.state.selectedSeats === this.state.targetSeats;
        let success = false, correctRej = false;

        if (this.state.orderValid && playerValid) {
            success = true; this.state.correct++; this.state.combo++;
            this.state.maxCombo = Math.max(this.state.maxCombo, this.state.combo);
            for (const [, info] of this.state.seatMap) if (info.selected) {
                info.sold = true; info.selected = false;
                this.state.seatsSold++; this.state.revenue += info.section.price;
            }
            this.state.ticketsSold += this.state.targetSeats;
        } else if (!this.state.orderValid && !confirm) {
            success = true; this.state.correct++; this.state.combo++;
            this.state.maxCombo = Math.max(this.state.maxCombo, this.state.combo);
            correctRej = true;
            for (const [, info] of this.state.seatMap) info.selected = false;
        } else {
            this.state.errors++; this.state.combo = 0;
            for (const [, info] of this.state.seatMap) info.selected = false;
        }

        this.state.selectedSeats = 0; this.state.processed++;
        this.refreshSeats();
        this.updateLabels();
        this.showResult(success, correctRej);

        if (this.state.errors >= this.config.maxErrors ||
            this.state.timeLeft <= 0 ||
            this.state.processed >= this.config.target) {
            setTimeout(() => this.showResultScreen(), 800);
            return;
        }

        setTimeout(() => {
            this.state.orderStartTime = Date.now();
            this.generateOrder();
        }, 600);
    }

    updateLabels() {
        if (!this.timerLabel || !this.progressLabel || !this.errorLabel || !this.comboLabel) return;
        this.progressLabel.string = `📋 ${this.state.processed} / ${this.config.target} 单`;
        this.errorLabel.string = `❌ ${this.state.errors} / ${this.config.maxErrors}`;
        this.comboLabel.string = `🔥 连击 x${this.state.combo}`;
        this.timerLabel.color = this.state.errors >= this.config.maxErrors - 1 ? new Color(231, 76, 60)
            : this.state.timeLeft <= 30 ? new Color(241, 196, 15) : new Color(46, 204, 113);
    }

    showResult(ok: boolean, rej: boolean) {
        if (!this.orderPanel || !this.ui) return;
        let rn = this.orderPanel.getChildByName('Res');
        if (!rn) {
            rn = new Node('Res');
            rn.addComponent(UITransform).setContentSize(400, 50);
            rn.setPosition(0, -250);
            rn.addComponent(Label).fontSize = 18;
            this.orderPanel.addChild(rn);
        }
        const l = rn.getComponent(Label)!;
        rn.active = true;
        if (ok) { l.string = rej ? '✅ 正确拒绝无效订单!' : '✅ 订单处理成功!'; l.color = new Color(46, 204, 113); }
        else { l.string = '❌ 处理错误!'; l.color = new Color(231, 76, 60); }
        setTimeout(() => { if (rn && rn.isValid) rn.active = false; }, 600);
    }

    tickTimer() {
        if (this.paused) { setTimeout(() => this.tickTimer(), 1000); return; }
        this.state.timeLeft--;
        if (this.timerLabel) {
            const m = Math.floor(this.state.timeLeft / 60);
            const s = this.state.timeLeft % 60;
            this.timerLabel.string = `⏱️ ${m}:${s.toString().padStart(2, '0')}`;
            if (this.state.timeLeft <= 10) this.timerLabel.color = new Color(231, 76, 60);
        }
        if (this.state.timeLeft <= 0) {
            setTimeout(() => this.showResultScreen(), 300);
            return;
        }
        setTimeout(() => this.tickTimer(), 1000);
    }

    showCountdown(done: () => void) {
        if (!this.canvas || !this.ui) return;
        const hud = this.canvas.getChildByName('HUD');
        if (!hud) return;
        let cd = hud.getChildByName('CD');
        if (!cd) {
            cd = new Node('CD');
            cd.addComponent(UITransform).setContentSize(300, 300);
            const ln = new Node('N');
            ln.addComponent(UITransform).setContentSize(300, 300);
            const lbl = ln.addComponent(Label);
            lbl.fontSize = 200;
            lbl.color = new Color(255, 215, 0);
            ln.name = 'N'; cd.addChild(ln);
            hud.addChild(cd);
        }
        let count = 3;
        const tick = () => {
            const lbl = cd!.getChildByName('N')!.getComponent(Label)!;
            lbl.string = count > 0 ? count.toString() : '开始!';
            cd!.setScale(0.3, 0.3, 1);
            const op = cd!.addComponent(UIOpacity); op.opacity = 255;
            import('cc').then(({ tween, Vec3 }) => {
                tween(cd!).to(0.4, { scale: new Vec3(1.3, 1.3, 1) }).to(0.4, { scale: new Vec3(1.6, 1.6, 1) }).start();
                tween(op).to(0.8, { opacity: count > 0 ? 180 : 0 }).call(() => {
                    if (count > 0) { count--; setTimeout(tick, 100); }
                    else { cd!.active = false; done(); }
                }).start();
            });
        };
        tick();
    }

    generateOrder() {
        if (!this.orderPanel || !this.ui) return;
        this.orderPanel.removeAllChildren();

        const names = ['张三', '李四', '王五', '赵六', '陈七', 'Alice', 'Bob', 'Charlie'];
        const payments = ['微信', '支付宝', '信用卡', '借记卡'];
        const types = ['VIP', 'PREMIUM', 'STANDARD', 'STUDENT', 'GROUP'];
        const avail = this.levelId <= 1 ? types.slice(1, 3) : this.levelId <= 2 ? types.slice(0, 4) : types;
        const sType = avail[Math.floor(Math.random() * avail.length)];
        const ranges: Record<string, number[]> = { VIP: [1, 2], PREMIUM: [1, 4], STANDARD: [1, 6], STUDENT: [1, 1], GROUP: [10, 16] };
        const r = ranges[sType] || [1, 4];
        const sCount = Math.floor(Math.random() * (r[1] - r[0] + 1)) + r[0];
        const prices: Record<string, number> = { VIP: 1280, PREMIUM: 680, STANDARD: 280, STUDENT: 180, GROUP: 220 };
        const tNames: Record<string, string> = { VIP: 'VIP票', PREMIUM: '高级票', STANDARD: '标准票', STUDENT: '学生票', GROUP: '团体票' };

        const hasId = Math.random() > 0.15;
        const hasStuId = sType === 'STUDENT' ? Math.random() > 0.25 : true;
        const groupSize = sType === 'GROUP' ? sCount : Math.floor(Math.random() * 20) + 1;
        const age = Math.floor(Math.random() * 45) + 15;

        const chance = this.levelId <= 1 ? 0.85 : this.levelId <= 2 ? 0.75 : this.levelId <= 3 ? 0.7 : 0.65;
        const targetValid = Math.random() < chance;
        let orderValid = targetValid;

        if (!targetValid) {
            orderValid = (sType === 'STUDENT') ? (hasStuId && age >= 12 && age <= 26 && hasId)
                : (sType === 'GROUP') ? (groupSize >= 10 && hasId)
                    : (sType !== 'STANDARD') ? !hasId : false;
        } else {
            if (sType !== 'STANDARD') orderValid = orderValid && hasId;
            if (sType === 'STUDENT') orderValid = orderValid && hasStuId && age >= 12 && age <= 26;
            if (sType === 'GROUP') orderValid = orderValid && groupSize >= 10;
        }

        this.ui.createLabelOnParent(this.orderPanel, 'OT', '🎫 新购票订单', 22, 0, 220, new Color(255, 215, 0));
        this.ui.createLabelOnParent(this.orderPanel, 'Cust', `👤 ${names[Math.floor(Math.random() * names.length)]}`, 18, -180, 180, new Color(255, 255, 255), 360);
        this.ui.createLabelOnParent(this.orderPanel, 'Tix', `🎟️ ${tNames[sType]} x ${sCount}`, 16, -180, 145, new Color(52, 152, 219), 360);
        this.ui.createLabelOnParent(this.orderPanel, 'Price', `💰 单价: ¥${prices[sType]}`, 14, -180, 115, new Color(231, 76, 60), 360);
        this.ui.createLabelOnParent(this.orderPanel, 'RT', '📋 订单信息:', 14, -180, 80, new Color(255, 255, 255), 360);

        const reqs = [
            { icon: '🆔', label: '身份证', val: hasId, show: true },
            { icon: '🎓', label: '学生证', val: hasStuId, show: sType === 'STUDENT' },
            { icon: '👥', label: `人数: ${groupSize}`, val: groupSize >= 10, show: sType === 'GROUP' },
            { icon: '🎂', label: `年龄: ${age}岁`, val: age >= 12 && age <= 26, show: sType === 'STUDENT' },
            { icon: '💳', label: payments[Math.floor(Math.random() * 4)], val: null, show: true }
        ];

        let ry = 50;
        for (const req of reqs) {
            if (!req.show && req.val === null) continue;
            let str = `${req.icon} ${req.label}`;
            const c = req.val === false ? new Color(231, 76, 60) : new Color(220, 220, 220);
            if (req.val !== null) str += `: ${req.val ? '✅' : '❌'} ${req.val ? '' : '未'}`;
            this.ui.createLabelOnParent(this.orderPanel, `R_${req.label}`, str, 13, -180, ry, c, 360);
            ry -= 24;
        }

        this.ui.createLabelOnParent(this.orderPanel, 'Total', `💵 总计: ¥${(sCount * prices[sType]).toLocaleString()}`, 20, 0, -140, new Color(255, 255, 255));

        this.state.targetSeats = sCount;
        this.state.orderSeatType = sType.toLowerCase();
        this.state.orderValid = orderValid;
        this.state.selectedSeats = 0;
        this.updateHint();
    }

    showPauseMenu() {
        if (!this.canvas || !this.ui) return;
        this.paused = true;
        const ov = this.ui.createSpriteNode('PO', 1280, 720, new Color(0, 0, 0, 180));
        this.canvas.addChild(ov);
        const menu = this.ui.createSpriteNode('PM', 400, 360, new Color(50, 50, 80));
        ov.addChild(menu);
        this.ui.createLabelOnParent(menu, 'T', '⏸️ 游戏暂停', 28, 0, 130, new Color(255, 255, 255));

        menu.addChild(this.ui.createMenuButton('R1', '▶️ 继续', 0, 50, new Color(46, 204, 113), 240,
            () => { ov.destroy(); this.paused = false; }));
        menu.addChild(this.ui.createMenuButton('R2', '🔄 重新开始', 0, -10, new Color(230, 126, 34), 240,
            () => { ov.destroy(); this.paused = false; GameManager.instance.generateSessionId(); this.start(this.ui!, this.levelId); }));
        menu.addChild(this.ui.createMenuButton('R3', '🏠 主菜单', 0, -70, new Color(52, 152, 219), 240,
            () => { ov.destroy(); this.paused = false; this.ui!.createFallbackMenu(); }));
    }

    priceOf(t: string): number { if (t.startsWith('VIP')) return 1280; if (t.startsWith('PREMIUM')) return 680; return 280; }

    showResultScreen() {
        const tt = this.config.time - this.state.timeLeft;
        const avg = this.state.processingTimes.length > 0
            ? this.state.processingTimes.reduce((a: number, b: number) => a + b, 0) / this.state.processingTimes.length : 0;
        const acc = this.state.processed > 0 ? this.state.correct / this.state.processed : 0;
        const totalSeats = 324;
        const su = totalSeats > 0 ? this.state.seatsSold / totalSeats : 0;
        const er = this.state.processed > 0 ? (this.state.processed / this.config.target) *
            (this.config.time / Math.max(tt, 1)) : 0;
        const sr = Math.round(Math.min(2, Math.max(0, er)) * 100 * (this.levelId * 0.2 + 1));
        const ar = Math.round(acc * 100 * (this.levelId * 0.2 + 1));
        const cb = Math.min(100, this.state.maxCombo * 5);
        const es = Math.round(sr * 0.4 + ar * 0.5 + cb * 0.1);
        const ts = Math.round(es * (this.levelId * 0.2 + 1));
        const passed = acc >= 0.85 &&
            this.state.processed >= Math.floor(this.config.target * 0.7) &&
            this.state.errors < this.config.maxErrors;

        const result: any = {
            levelId: this.levelId, passed,
            stats: {
                levelId: this.levelId, ordersProcessed: this.state.processed,
                ordersCorrect: this.state.correct, ordersRejected: this.state.errors,
                correctRejections: Math.floor(this.state.correct * 0.2),
                errors: this.state.errors, maxConsecutiveCorrect: this.state.maxCombo,
                currentConsecutiveCorrect: 0, totalTime: tt, processingStartTime: 0,
                averageProcessingTime: avg, processingTimes: this.state.processingTimes,
                ticketsSold: this.state.ticketsSold, revenue: this.state.revenue, seatsUtilization: su
            },
            score: Math.max(0, ts), efficiencyScore: Math.max(0, es),
            speedScore: Math.max(0, sr), accuracyScore: Math.max(0, ar), timestamp: Date.now()
        };
        GameManager.instance.recordLevelResult(result);

        import('./ResultFallback').then(m => new m.ResultFallback().show(this.ui!, result));
    }
}
