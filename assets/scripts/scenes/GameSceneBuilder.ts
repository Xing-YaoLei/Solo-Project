import { Node, Label, Sprite, Color, Button, UITransform, Input, KeyCode, UIOpacity, find, ScrollView, Layout } from 'cc';
import { GameManager } from '../core/GameManager';
import { FeedbackManager, VibrationType } from '../core/FeedbackManager';
import { AudioManager, SfxType } from '../core/AudioManager';
import { Bootstrap } from '../Bootstrap';
import { TICKET_TYPE_NAMES } from '../core/GameTypes';

interface Section { type: string; rows: number; perRow: number; color: Color; price: number }
interface SeatInfo { type: string; selected: boolean; sold: boolean; section: Section; seatNode: Node }

export class GameSceneBuilder {
    private ui: Bootstrap | null = null;
    private root: Node | null = null;

    private timerLabel: Label | null = null;
    private progressLabel: Label | null = null;
    private errorLabel: Label | null = null;
    private comboLabel: Label | null = null;
    private orderPanel: Node | null = null;
    private seatMap: Node | null = null;
    private hintLabel: Label | null = null;

    private state: any = {
        timeLeft: 0, processed: 0, correct: 0, errors: 0,
        combo: 0, maxCombo: 0, selectedSeats: 0, targetSeats: 2,
        seatInfos: new Map<string, SeatInfo>(),
        processingTimes: [] as number[], orderStartTime: 0, revenue: 0,
        seatsSold: 0, ticketsSold: 0, orderSeatType: 'standard',
        orderValid: true, paused: false, gameEnded: false,
        ticketTypeColors: {
            'vip': new Color(255, 215, 0, 200),
            'premium': new Color(155, 89, 182, 200),
            'standard': new Color(52, 152, 219, 200),
            'student': new Color(46, 204, 113, 200),
            'group': new Color(230, 126, 34, 200)
        }
    };

    private sections: Section[] = [
        { type: 'VIP', rows: 3, perRow: 8, color: new Color(255, 215, 0, 200), price: 1280 },
        { type: 'PREMIUM', rows: 3, perRow: 12, color: new Color(155, 89, 182, 200), price: 680 },
        { type: 'STANDARD', rows: 4, perRow: 15, color: new Color(52, 152, 219, 200), price: 280 }
    ];

    private config: any = null;
    private levelId = 1;
    private cleanupFns: (() => void)[] = [];
    private timerHandle: any = null;

    build(ui: Bootstrap): Node {
        this.ui = ui;
        this.levelId = GameManager.instance.currentLevelId || 1;

        const configs: Record<number, any> = {
            1: { time: 120, target: 15, maxErrors: 5, name: '新手入门', venue: '小型剧场' },
            2: { time: 150, target: 25, maxErrors: 6, name: '渐入佳境', venue: '中型体育馆' },
            3: { time: 180, target: 40, maxErrors: 7, name: '票房热卖', venue: '大型体育场' },
            4: { time: 180, target: 55, maxErrors: 6, name: '销售达人', venue: '会展中心' },
            5: { time: 200, target: 70, maxErrors: 5, name: '火爆预售', venue: '国家大剧院' },
            6: { time: 240, target: 100, maxErrors: 5, name: '终极挑战', venue: '奥林匹克体育场' }
        };
        this.config = configs[this.levelId] || configs[1];
        this.state.timeLeft = this.config.time;
        this.state.processingTimes = [];

        this.root = new Node('GameScene');
        this.root.addComponent(UITransform).setContentSize(1280, 720);

        this.buildLayout();
        this.setupKeyboard();

        setTimeout(() => this.showCountdown(() => {
            this.state.orderStartTime = Date.now();
            this.generateOrder();
            this.startTimer();
        }), 100);

        return this.root;
    }

    buildLayout() {
        if (!this.root || !this.ui) return;

        const bg = this.ui.createSpriteNode('BG', 1280, 720, new Color(24, 24, 40));
        this.root.addChild(bg);

        const hud = new Node('HUD');
        hud.addComponent(UITransform).setContentSize(1280, 720);
        this.root.addChild(hud);

        const topBar = this.ui.createSpriteNode('TB', 1280, 60, new Color(40, 40, 70, 230));
        topBar.setPosition(0, 330);
        hud.addChild(topBar);

        const levelBadge = this.ui.createSpriteNode('Level', 220, 40, new Color(155, 89, 182, 200));
        levelBadge.setPosition(-640 + 130, 330);
        this.ui.createLabelOnParent(levelBadge, 'Lb', `🎯 L${this.levelId} ${this.config.name}`,
            15, 0, 0, new Color(255, 255, 255), 220);
        hud.addChild(levelBadge);

        this.timerLabel = this.ui.createLabelOnParent(hud, 'T',
            `⏱️ ${this.fmtTime(this.state.timeLeft)}`, 24, -500, 330, new Color(46, 204, 113));
        this.progressLabel = this.ui.createLabelOnParent(hud, 'P',
            `📋 0 / ${this.config.target} 单`, 20, 0, 330, new Color(255, 255, 255));
        this.errorLabel = this.ui.createLabelOnParent(hud, 'E',
            `❌ 0 / ${this.config.maxErrors}`, 18, 500, 330, new Color(231, 76, 60));
        this.comboLabel = this.ui.createLabelOnParent(hud, 'C',
            `🔥 连击 x0`, 16, 500, 295, new Color(241, 196, 15));

        this.orderPanel = this.ui.createSpriteNode('OP', 420, 500, new Color(45, 45, 75, 240));
        this.orderPanel.setPosition(-380, 0);
        this.root.addChild(this.orderPanel);

        this.seatMap = this.ui.createSpriteNode('SM', 600, 520, new Color(35, 35, 55, 240));
        this.seatMap.setPosition(80, 10);
        this.root.addChild(this.seatMap);

        const stage = this.ui.createSpriteNode('ST', 500, 40, new Color(100, 50, 50, 255));
        stage.setPosition(80, 240);
        this.ui.createLabelOnParent(stage, 'L', `🎤 ${this.config.venue} 舞台`,
            20, 0, 0, new Color(255, 255, 255), 500);
        this.root.addChild(stage);

        const rulesPanel = this.ui.createSpriteNode('RP', 200, 520, new Color(40, 40, 65, 240));
        rulesPanel.setPosition(500, 10);
        this.root.addChild(rulesPanel);
        this.ui.createLabelOnParent(this.root, 'RT', '📖 票种规则',
            16, 500, 255, new Color(255, 215, 0));

        const rules = [
            { name: 'VIP票', price: '¥1280', color: new Color(255, 215, 0, 120), note: '需身份证' },
            { name: '高级票', price: '¥680', color: new Color(155, 89, 182, 120), note: '需身份证' },
            { name: '标准票', price: '¥280', color: new Color(52, 152, 219, 120), note: '无需证件' },
            { name: '学生票', price: '¥180', color: new Color(46, 204, 113, 120), note: '学生证+年龄12-26' },
            { name: '团体票', price: '¥220', color: new Color(230, 126, 34, 120), note: '≥10人+身份证' }
        ];
        for (let i = 0; i < rules.length; i++) {
            const r = rules[i];
            const it = this.ui.createSpriteNode(`R_${i}`, 180, 44, r.color);
            it.setPosition(500, 228 - i * 54);
            this.ui.createLabelOnParent(it, 'T', `[${i + 1}] ${r.name} ${r.price}`,
                12, -70, 8, new Color(255, 255, 255), 160);
            this.ui.createLabelOnParent(it, 'N', r.note, 10, -70, -12, new Color(230, 230, 230), 160);
            this.root.addChild(it);
        }

        this.buildSeats();
        this.buildActions();

        this.hintLabel = this.ui.createLabelOnParent(this.orderPanel, 'Hint',
            '⏳ 游戏即将开始...', 14, 0, -210, new Color(180, 180, 180), 400);
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
                    const seat = this.ui.createSpriteNode(`Seat_${sid}`, 30, 26, sec.color);
                    seat.setPosition(sx + col * 36 + 15, sy - 10);
                    this.ui.createLabelOnParent(seat, 'L', `${row + 1}-${col + 1}`,
                        9, 0, 0, new Color(0, 0, 0, 180), 30);
                    seat.on(Node.EventType.TOUCH_END, () => this.onSeatClick(sid));
                    this.seatMap.addChild(seat);

                    this.state.seatInfos.set(sid, {
                        type: sec.type, selected: false, sold: false, section: sec, seatNode: seat
                    });
                }
                sy -= 36;
            }
            sy -= 10;
        }
    }

    buildActions() {
        if (!this.root || !this.ui) return;

        this.root.addChild(this.ui.createMenuButton(
            'OK', '✅ 确认 [空格]', -380, -260, new Color(46, 204, 113), 180,
            () => this.processAction(true), 50), 100);
        this.root.addChild(this.ui.createMenuButton(
            'RJ', '🚫 拒绝 [R]', -200, -260, new Color(231, 76, 60), 160,
            () => this.processAction(false), 50), 100);
        this.root.addChild(this.ui.createMenuButton(
            'SG', '💡 推荐 [S]', -500, -260, new Color(52, 152, 219), 120,
            () => this.suggestSeats(), 50), 100);
        this.root.addChild(this.ui.createMenuButton(
            'CL', '🗑️ 清空 [C]', -380, -320, new Color(127, 140, 141), 180,
            () => this.clearSelection(), 40), 100);
        this.root.addChild(this.ui.createMenuButton(
            'PS', '⏸️ 暂停 [ESC]', 500, 260, new Color(100, 100, 120), 140,
            () => this.showPauseMenu(), 40), 100);
    }

    setupKeyboard() {
        const handler = (e: any) => {
            if (this.state.paused) return;
            const k = e.keyCode;
            if (k === KeyCode.SPACE) { e.propagationStopped = true; this.processAction(true); }
            else if (k === KeyCode.KEY_R) this.processAction(false);
            else if (k === KeyCode.KEY_S) this.suggestSeats();
            else if (k === KeyCode.KEY_C) this.clearSelection();
            else if (k === KeyCode.ESCAPE) this.showPauseMenu();
            else if (k >= KeyCode.DIGIT_1 && k <= KeyCode.DIGIT_9) {
                this.quickTypeSelect(k - KeyCode.DIGIT_1 + 1);
            }
        };
        Input.instance.on(Input.EventType.KEY_DOWN, handler);
        this.cleanupFns.push(() => Input.instance.off(Input.EventType.KEY_DOWN, handler));
    }

    quickTypeSelect(typeIdx: number) {
        const typeMap: Record<number, string> = {
            1: 'VIP', 2: 'PREMIUM', 3: 'STANDARD', 4: 'STUDENT', 5: 'GROUP'
        };
        const ttype = typeMap[typeIdx];
        if (!ttype) return;

        let sel = 0;
        for (const [id, info] of this.state.seatInfos) {
            if (sel >= this.state.targetSeats) break;
            if (!info.sold && !info.selected &&
                info.type.toLowerCase().startsWith(ttype.toLowerCase().slice(0, 3))) {
                this.selectSeat(id, info);
                sel++;
            }
        }
        this.updateHint();
    }

    onSeatClick(id: string) {
        if (this.state.paused || this.state.gameEnded) return;
        const info = this.state.seatInfos.get(id);
        if (!info || info.sold) return;

        const sp = info.seatNode.getComponent(Sprite)!;
        if (info.selected) {
            info.selected = false;
            this.state.selectedSeats--;
            sp.color = info.section.color;
        } else if (this.state.selectedSeats < this.state.targetSeats) {
            this.selectSeat(id, info);
        }
        this.updateHint();
    }

    selectSeat(id: string, info: SeatInfo) {
        info.selected = true;
        this.state.selectedSeats++;
        info.seatNode.getComponent(Sprite)!.color = new Color(241, 196, 15, 255);
        AudioManager.instance.playSfx(SfxType.CLICK);
    }

    suggestSeats() {
        if (this.state.paused || this.state.gameEnded) return;
        let sel = 0;
        const tt = this.state.orderSeatType.toLowerCase();
        for (const [id, info] of this.state.seatInfos) {
            if (sel >= this.state.targetSeats) break;
            if (!info.sold && !info.selected && info.type.toLowerCase().includes(tt)) {
                this.selectSeat(id, info);
                sel++;
            }
        }
        this.state.selectedSeats = 0;
        for (const [, info] of this.state.seatInfos) if (info.selected) this.state.selectedSeats++;
        this.updateHint();
    }

    clearSelection() {
        for (const [, info] of this.state.seatInfos) {
            if (info.selected) {
                info.selected = false;
                info.seatNode.getComponent(Sprite)!.color = info.section.color;
            }
        }
        this.state.selectedSeats = 0;
        this.updateHint();
    }

    processAction(confirm: boolean) {
        if (this.state.paused || this.state.gameEnded) return;
        this.state.processingTimes.push((Date.now() - this.state.orderStartTime) / 1000);

        const playerValid = confirm && this.state.selectedSeats === this.state.targetSeats;
        let success = false, correctRej = false;

        if (this.state.orderValid && playerValid) {
            success = true; this.state.correct++; this.state.combo++;
            this.state.maxCombo = Math.max(this.state.maxCombo, this.state.combo);
            for (const [, info] of this.state.seatInfos) {
                if (info.selected) {
                    info.sold = true; info.selected = false;
                    info.seatNode.getComponent(Sprite)!.color = new Color(127, 140, 141, 150);
                    this.state.seatsSold++; this.state.revenue += info.section.price;
                }
            }
            this.state.ticketsSold += this.state.targetSeats;
            AudioManager.instance.playSfx(SfxType.ORDER_COMPLETE);
            FeedbackManager.instance.vibrate(VibrationType.SUCCESS);
        } else if (!this.state.orderValid && !confirm) {
            success = true; this.state.correct++; this.state.combo++;
            this.state.maxCombo = Math.max(this.state.maxCombo, this.state.combo);
            correctRej = true;
            for (const [, info] of this.state.seatInfos) info.selected = false;
            AudioManager.instance.playSfx(SfxType.ORDER_COMPLETE);
            FeedbackManager.instance.vibrate(VibrationType.SUCCESS);
        } else {
            this.state.errors++; this.state.combo = 0;
            for (const [, info] of this.state.seatInfos) {
                if (info.selected) {
                    info.selected = false;
                    info.seatNode.getComponent(Sprite)!.color = info.section.color;
                }
            }
            AudioManager.instance.playSfx(SfxType.ERROR);
            FeedbackManager.instance.vibrate(VibrationType.ERROR);
            this.shakeError();
        }

        this.state.selectedSeats = 0; this.state.processed++;
        this.updateHUD();
        this.showResultToast(success, correctRej);

        if (this.state.errors >= this.config.maxErrors ||
            this.state.timeLeft <= 0 ||
            this.state.processed >= this.config.target) {
            setTimeout(() => this.endGame(), 800);
            return;
        }

        setTimeout(() => {
            this.state.orderStartTime = Date.now();
            this.generateOrder();
        }, 600);
    }

    shakeError() {
        if (!this.root || !this.ui) return;
        const original = this.root.position.clone();
        const steps = 6;
        for (let i = 0; i < steps; i++) {
            setTimeout(() => {
                if (!this.root || !this.root.isValid) return;
                if (i === steps - 1) {
                    this.root!.setPosition(original);
                } else {
                    const ox = (Math.random() - 0.5) * (8 - i);
                    const oy = (Math.random() - 0.5) * (8 - i);
                    this.root!.setPosition(original.x + ox, original.y + oy);
                }
            }, i * 40);
        }
    }

    updateHUD() {
        if (this.progressLabel) this.progressLabel.string = `📋 ${this.state.processed} / ${this.config.target} 单`;
        if (this.errorLabel) this.errorLabel.string = `❌ ${this.state.errors} / ${this.config.maxErrors}`;
        if (this.comboLabel) this.comboLabel.string = `🔥 连击 x${this.state.combo}`;
        if (this.timerLabel) {
            this.timerLabel.color =
                this.state.errors >= this.config.maxErrors - 1 ? new Color(231, 76, 60) :
                this.state.timeLeft <= 30 ? new Color(241, 196, 15) : new Color(46, 204, 113);
        }
        if (this.state.combo >= 5) this.showComboPop();
    }

    showComboPop() {
        if (!this.root || !this.ui) return;
        let p = this.root.getChildByName('ComboPop');
        if (!p) {
            p = this.ui.createSpriteNode('ComboPop', 200, 50, new Color(0, 0, 0, 150));
            p.setPosition(0, 0);
            this.ui.createLabelOnParent(p, 'L', '', 28, 0, 0, new Color(241, 196, 15), 200);
            this.root.addChild(p);
        }
        const l = p.getChildByName('L')!.getComponent(Label)!;
        l.string = `🔥 ${this.state.combo} 连击!`;
        p.setPosition(0, 80);
        p.active = true;
        setTimeout(() => { if (p && p.isValid) p.active = false; }, 800);
    }

    showResultToast(ok: boolean, rej: boolean) {
        if (!this.orderPanel || !this.ui) return;
        let rn = this.orderPanel.getChildByName('Res');
        if (!rn) {
            rn = this.ui.createSpriteNode('Res', 400, 50, new Color(0, 0, 0, 150));
            rn.setPosition(0, -250);
            this.ui.createLabelOnParent(rn, 'L', '', 18, 0, 0, new Color(255, 255, 255), 400);
            this.orderPanel.addChild(rn);
        }
        const l = rn.getChildByName('L')!.getComponent(Label)!;
        rn.active = true;
        if (ok) { l.string = rej ? '✅ 正确拒绝无效订单!' : '✅ 订单处理成功!'; l.color = new Color(46, 204, 113); }
        else { l.string = '❌ 处理错误，请检查规则!'; l.color = new Color(231, 76, 60); }
        setTimeout(() => { if (rn && rn.isValid) rn.active = false; }, 600);
    }

    generateOrder() {
        if (!this.orderPanel || !this.ui) return;
        this.orderPanel.removeAllChildren();

        const names = ['张三', '李四', '王五', '赵六', '陈七', '刘八', 'Alice', 'Bob', 'Charlie', 'Emma'];
        const payments = ['微信', '支付宝', '信用卡', '借记卡', '现金'];
        const typeNames: Record<string, string> = {
            VIP: 'VIP票', PREMIUM: '高级票', STANDARD: '标准票', STUDENT: '学生票', GROUP: '团体票'
        };
        const prices: Record<string, number> = {
            VIP: 1280, PREMIUM: 680, STANDARD: 280, STUDENT: 180, GROUP: 220
        };

        const avail = this.levelId <= 1 ? ['PREMIUM', 'STANDARD'] :
            this.levelId <= 2 ? ['VIP', 'PREMIUM', 'STANDARD', 'STUDENT'] :
                ['VIP', 'PREMIUM', 'STANDARD', 'STUDENT', 'GROUP'];
        const sType = avail[Math.floor(Math.random() * avail.length)];
        const ranges: Record<string, number[]> = {
            VIP: [1, 2], PREMIUM: [1, 4], STANDARD: [1, 6], STUDENT: [1, 1], GROUP: [10, 16]
        };
        const r = ranges[sType] || [1, 4];
        const sCount = Math.floor(Math.random() * (r[1] - r[0] + 1)) + r[0];

        const hasId = Math.random() > 0.15;
        const hasStuId = sType === 'STUDENT' ? Math.random() > 0.25 : true;
        const groupSize = sType === 'GROUP' ? sCount : Math.floor(Math.random() * 20) + 1;
        const age = Math.floor(Math.random() * 45) + 15;

        const chance = this.levelId <= 1 ? 0.85 : this.levelId <= 2 ? 0.75 :
            this.levelId <= 3 ? 0.7 : 0.65;
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
        this.ui.createLabelOnParent(this.orderPanel, 'Cust',
            `👤 ${names[Math.floor(Math.random() * names.length)]}`,
            18, -180, 180, new Color(255, 255, 255), 360);
        this.ui.createLabelOnParent(this.orderPanel, 'Tix',
            `🎟️ ${typeNames[sType] || sType} x ${sCount}`,
            16, -180, 145, new Color(52, 152, 219), 360);
        this.ui.createLabelOnParent(this.orderPanel, 'Price',
            `💰 单价: ¥${prices[sType] || 280}`,
            14, -180, 115, new Color(231, 76, 60), 360);
        this.ui.createLabelOnParent(this.orderPanel, 'RT', '📋 订单信息:',
            14, -180, 80, new Color(255, 255, 255), 360);

        const reqs = [
            { icon: '🆔', label: '身份证', val: hasId, show: true },
            { icon: '🎓', label: '学生证', val: hasStuId, show: sType === 'STUDENT' },
            { icon: '👥', label: `团体人数: ${groupSize}`, val: groupSize >= 10, show: sType === 'GROUP' },
            { icon: '🎂', label: `年龄: ${age}岁`, val: age >= 12 && age <= 26, show: sType === 'STUDENT' },
            { icon: '💳', label: payments[Math.floor(Math.random() * 5)], val: null, show: true }
        ];

        let ry = 50;
        for (const req of reqs) {
            if (!req.show && req.val === null) continue;
            let str = `${req.icon} ${req.label}`;
            const c = req.val === false ? new Color(231, 76, 60) : new Color(220, 220, 220);
            if (req.val !== null) str += `: ${req.val ? '✅ 已提供' : '❌ 未提供'}`;
            this.ui.createLabelOnParent(this.orderPanel, `R_${req.label}`,
                str, 13, -180, ry, c, 360);
            ry -= 24;
        }

        this.ui.createLabelOnParent(this.orderPanel, 'Total',
            `💵 总计: ¥${(sCount * (prices[sType] || 280)).toLocaleString()}`,
            20, 0, -140, new Color(255, 255, 255));

        this.state.targetSeats = sCount;
        this.state.orderSeatType = sType.toLowerCase();
        this.state.orderValid = orderValid;
        this.state.selectedSeats = 0;
        this.updateHint();
    }

    updateHint() {
        if (!this.hintLabel || !this.ui) {
            if (!this.orderPanel || !this.ui) return;
            this.hintLabel = this.ui.createLabelOnParent(this.orderPanel, 'Hint',
                '', 14, 0, -210, new Color(180, 180, 180), 400);
        }
        const { selectedSeats: s, targetSeats: t } = this.state;
        if (s === 0) { this.hintLabel.string = '💡 选择座位 或 [R]拒绝订单'; this.hintLabel.color = new Color(180, 180, 180); }
        else if (s === t) { this.hintLabel.string = `✅ ${s}/${t} [空格]确认`; this.hintLabel.color = new Color(46, 204, 113); }
        else if (s < t) { this.hintLabel.string = `📍 ${s}/${t} 继续选择座位...`; this.hintLabel.color = new Color(241, 196, 15); }
        else { this.hintLabel.string = `⚠️ 已选${s} 超过${t}`; this.hintLabel.color = new Color(231, 76, 60); }
    }

    showCountdown(done: () => void) {
        if (!this.root || !this.ui) { done(); return; }
        const hud = this.root.getChildByName('HUD') || this.root;
        let cd = hud.getChildByName('CD');
        if (!cd) {
            cd = this.ui.createSpriteNode('CD', 300, 300, new Color(0, 0, 0, 1));
            const n = this.ui.createLabel('N', '', 180, 0, 0, new Color(255, 215, 0), 300);
            cd.addChild(n.node);
            hud.addChild(cd);
        }
        let count = 3;
        const tick = () => {
            const lbl = cd!.getChildByName('N')!.getComponent(Label)!;
            lbl.string = count > 0 ? count.toString() : '开始!';
            lbl.fontSize = count > 0 ? 180 : 80;
            cd!.setPosition(0, 0);
            AudioManager.instance.playCountdownTick();

            const s = 0.3;
            cd!.setScale(s, s, 1);
            const op = cd!.getComponent(UIOpacity) || cd!.addComponent(UIOpacity);
            op.opacity = 255;

            let t = 0;
            const anim = setInterval(() => {
                t += 0.04;
                const p = Math.min(1, t / 0.8);
                const scale = s + (1.5 - s) * p;
                cd!.setScale(scale, scale, 1);
                op.opacity = count > 0 ? Math.round(255 * (1 - p * 0.3)) : Math.round(255 * (1 - p));
                if (p >= 1) {
                    clearInterval(anim);
                    if (count > 0) { count--; setTimeout(tick, 120); }
                    else { cd!.active = false; done(); }
                }
            }, 40);
        };
        tick();
    }

    startTimer() {
        const tick = () => {
            if (this.state.gameEnded) return;
            if (!this.state.paused) {
                this.state.timeLeft--;
                if (this.timerLabel) {
                    this.timerLabel.string = `⏱️ ${this.fmtTime(this.state.timeLeft)}`;
                    if (this.state.timeLeft <= 10) this.timerLabel.color = new Color(231, 76, 60);
                    if (this.state.timeLeft === 0) {
                        setTimeout(() => this.endGame(), 300);
                        return;
                    }
                }
            }
            this.timerHandle = setTimeout(tick, 1000);
        };
        tick();
    }

    fmtTime(t: number): string {
        const m = Math.floor(t / 60), s = t % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    }

    showPauseMenu() {
        if (!this.root || !this.ui) return;
        this.state.paused = true;

        const ov = this.ui.createSpriteNode('PO', 1280, 720, new Color(0, 0, 0, 180));
        this.root.addChild(ov);
        const m = this.ui.createSpriteNode('PM', 400, 360, new Color(50, 50, 80));
        ov.addChild(m);
        this.ui.createLabelOnParent(m, 'T', '⏸️ 游戏暂停', 28, 0, 130, new Color(255, 255, 255));

        m.addChild(this.ui.createMenuButton('R1', '▶️ 继续', 0, 50, new Color(46, 204, 113), 240,
            () => { ov.destroy(); this.state.paused = false; }));
        m.addChild(this.ui.createMenuButton('R2', '🔄 重新开始', 0, -10, new Color(230, 126, 34), 240,
            () => {
                this.cleanup();
                GameManager.instance.generateSessionId();
                this.ui!.loadScene('game-scene');
            }));
        m.addChild(this.ui.createMenuButton('R3', '🏠 主菜单', 0, -70, new Color(52, 152, 219), 240,
            () => { this.cleanup(); this.ui!.loadScene('main-menu'); }));
    }

    endGame() {
        this.state.gameEnded = true;
        this.cleanup();

        const tt = this.config.time - this.state.timeLeft;
        const avg = this.state.processingTimes.length > 0
            ? this.state.processingTimes.reduce((a: number, b: number) => a + b, 0) / this.state.processingTimes.length : 0;
        const acc = this.state.processed > 0 ? this.state.correct / this.state.processed : 0;
        const totalSeats = this.sections.reduce((s, sec) => s + sec.rows * sec.perRow, 0);
        const su = totalSeats > 0 ? this.state.seatsSold / totalSeats : 0;
        const er = this.state.processed > 0
            ? (this.state.processed / this.config.target) * (this.config.time / Math.max(tt, 1)) : 0;
        const multiplier = this.levelId * 0.2 + 1;
        const sr = Math.round(Math.min(2, Math.max(0, er)) * 100 * multiplier);
        const ar = Math.round(acc * 100 * multiplier);
        const cb = Math.min(100, this.state.maxCombo * 5);
        const es = Math.round(sr * 0.4 + ar * 0.5 + cb * 0.1);
        const ts = Math.round(es * multiplier);
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

        setTimeout(() => this.ui!.loadScene('result-scene'), 200);
    }

    cleanup() {
        if (this.timerHandle) clearTimeout(this.timerHandle);
        for (const fn of this.cleanupFns) try { fn(); } catch (e) { }
        this.cleanupFns = [];
    }
}
