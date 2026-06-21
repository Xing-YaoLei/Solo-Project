import { _decorator, Component, Node, Button, Label, Sprite, Color, ScrollView, tween, Vec3, UIOpacity, view } from 'cc';
import { GameManager } from '../core/GameManager';
import { Reservation } from '../models';
import { ReservationStatus, ActionType, ConflictType, ArrivalStatus } from '../models/GameEnums';
import { ConflictDetector } from '../core/ConflictDetector';
import { UIBuilder } from '../utils/UIBuilder';
import { SceneManager, SceneName } from '../utils/SceneManager';
import { GameSaveManager } from '../data/GameSaveManager';
import { GameBootStrap } from '../GameBootStrap';
const { ccclass, property } = _decorator;

@ccclass('GamePlayScene')
export class GamePlayScene extends Component {
    private rootNode: Node | null = null;

    private reservationListContent: Node | null = null;
    private reservationItems: Map<string, Node> = new Map();
    private selectedReservationId: string | null = null;

    private detailPanel: Node | null = null;
    private detailVisitorName: Label | null = null;
    private detailIdCard: Label | null = null;
    private detailPhone: Label | null = null;
    private detailSpot: Label | null = null;
    private detailTimeSlot: Label | null = null;
    private detailTicketCount: Label | null = null;
    private detailRescheduleCount: Label | null = null;
    private detailArrivalStatus: Label | null = null;
    private detailConflictList: Node | null = null;
    private detailNotes: Label | null = null;
    private noSelectionHint: Label | null = null;
    private detailContent: Node | null = null;

    private actionPanel: Node | null = null;
    private approveBtn: Button | null = null;
    private rejectBtn: Button | null = null;
    private rescheduleBtn: Button | null = null;
    private checkInBtn: Button | null = null;
    private denyEntryBtn: Button | null = null;

    private reschedulePanel: Node | null = null;
    private rescheduleSlotList: Node | null = null;
    private selectedSlotIndex: number = -1;

    private hudNode: Node | null = null;
    private scoreLabel: Label | null = null;
    private comboLabel: Label | null = null;
    private timeLabel: Label | null = null;
    private timeBar: Sprite | null = null;
    private levelNameLabel: Label | null = null;
    private pendingCountLabel: Label | null = null;

    private resultPanel: Node | null = null;
    private toastNode: Node | null = null;
    private toastLabel: Label | null = null;

    private totalScore: number = 0;
    private combo: number = 0;
    private maxCombo: number = 0;
    private correctCount: number = 0;
    private mistakeList: { visitorName: string; expectedAction: ActionType; actualAction: ActionType; explanation: string }[] = [];
    private gameStartTime: number = 0;
    private isGameEnded: boolean = false;

    onLoad() {
        GameBootStrap.ensureInitialized();
        this.buildUI();
    }

    start() {
        this.initGame();
    }

    update(deltaTime: number) {
        this.updateGameTime(deltaTime);
    }

    private buildUI(): void {
        const { width, height } = UIBuilder.getDesignResolution();

        this.rootNode = UIBuilder.createNode('GamePlayRoot', this.node);
        UIBuilder.setPosition(this.rootNode, 0, 0);
        UIBuilder.setSize(this.rootNode, width, height);

        const bg = UIBuilder.createPanel(this.rootNode, 'Background', width, height, new Color(245, 250, 255, 255));
        UIBuilder.setPosition(bg, 0, 0);

        this.buildHUD();
        this.buildReservationList();
        this.buildDetailPanel();
        this.buildActionPanel();
        this.buildReschedulePanel();
        this.buildResultPanel();
        this.buildToast();

        const backBtn = UIBuilder.createTextButton(
            this.rootNode,
            'BackBtn',
            '← 返回',
            80,
            36,
            13,
            new Color(158, 158, 158, 200),
            Color.WHITE
        );
        UIBuilder.setPosition(backBtn.node, -width / 2 + 50, height / 2 - 30);
        backBtn.node.on(Button.EventType.CLICK, this.onBackClick, this);
    }

    private buildHUD(): void {
        const { width, height } = UIBuilder.getDesignResolution();

        this.hudNode = UIBuilder.createPanel(
            this.rootNode!,
            'HUD',
            width,
            64,
            new Color(25, 118, 210, 255)
        );
        UIBuilder.setPosition(this.hudNode, 0, height / 2 - 32);

        const scoreNode = UIBuilder.createNode('Score', this.hudNode);
        UIBuilder.setPosition(scoreNode, -width / 2 + 120, 0);
        UIBuilder.setSize(scoreNode, 100, 40);
        const scoreTitle = UIBuilder.addLabel(scoreNode, '得分', 12, new Color(200, 220, 240));
        scoreTitle.horizontalAlign = Label.HorizontalAlign.LEFT;
        scoreTitle.verticalAlign = Label.VerticalAlign.TOP;
        scoreTitle.node.setPosition(0, 12, 0);
        this.scoreLabel = UIBuilder.addLabel(scoreNode, '0', 24, Color.WHITE);
        this.scoreLabel.horizontalAlign = Label.HorizontalAlign.LEFT;
        this.scoreLabel.verticalAlign = Label.VerticalAlign.BOTTOM;
        this.scoreLabel.node.setPosition(0, -8, 0);

        const comboNode = UIBuilder.createNode('Combo', this.hudNode);
        UIBuilder.setPosition(comboNode, -width / 2 + 240, 0);
        UIBuilder.setSize(comboNode, 80, 40);
        const comboTitle = UIBuilder.addLabel(comboNode, '连击', 12, new Color(200, 220, 240));
        comboTitle.horizontalAlign = Label.HorizontalAlign.LEFT;
        comboTitle.verticalAlign = Label.VerticalAlign.TOP;
        comboTitle.node.setPosition(0, 12, 0);
        this.comboLabel = UIBuilder.addLabel(comboNode, 'x0', 24, new Color(255, 193, 7));
        this.comboLabel.horizontalAlign = Label.HorizontalAlign.LEFT;
        this.comboLabel.verticalAlign = Label.VerticalAlign.BOTTOM;
        this.comboLabel.node.setPosition(0, -8, 0);

        const levelNode = UIBuilder.createNode('LevelName', this.hudNode);
        UIBuilder.setPosition(levelNode, 0, 10);
        UIBuilder.setSize(levelNode, 300, 24);
        this.levelNameLabel = UIBuilder.addLabel(levelNode, '关卡名称', 18, Color.WHITE);
        this.levelNameLabel.horizontalAlign = Label.HorizontalAlign.CENTER;
        this.levelNameLabel.verticalAlign = Label.VerticalAlign.CENTER;

        const pendingNode = UIBuilder.createNode('Pending', this.hudNode);
        UIBuilder.setPosition(pendingNode, 0, -14);
        UIBuilder.setSize(pendingNode, 200, 18);
        this.pendingCountLabel = UIBuilder.addLabel(pendingNode, '待处理: 0', 13, new Color(200, 220, 240));
        this.pendingCountLabel.horizontalAlign = Label.HorizontalAlign.CENTER;
        this.pendingCountLabel.verticalAlign = Label.VerticalAlign.CENTER;

        const timeNode = UIBuilder.createNode('Time', this.hudNode);
        UIBuilder.setPosition(timeNode, width / 2 - 160, 5);
        UIBuilder.setSize(timeNode, 120, 30);
        const timeTitle = UIBuilder.addLabel(timeNode, '剩余时间', 12, new Color(200, 220, 240));
        timeTitle.horizontalAlign = Label.HorizontalAlign.RIGHT;
        timeTitle.verticalAlign = Label.VerticalAlign.TOP;
        timeTitle.node.setPosition(0, 8, 0);
        this.timeLabel = UIBuilder.addLabel(timeNode, '03:00', 20, Color.WHITE);
        this.timeLabel.horizontalAlign = Label.HorizontalAlign.RIGHT;
        this.timeLabel.verticalAlign = Label.VerticalAlign.BOTTOM;
        this.timeLabel.node.setPosition(0, -10, 0);

        const barBg = UIBuilder.createNode('TimeBarBg', this.hudNode);
        UIBuilder.setPosition(barBg, width / 2 - 120, -18);
        UIBuilder.setSize(barBg, 180, 6);
        UIBuilder.addSprite(barBg, new Color(255, 255, 255, 50));

        const barFill = UIBuilder.createNode('TimeBarFill', barBg);
        UIBuilder.setPosition(barFill, -90, 0);
        UIBuilder.setSize(barFill, 180, 6);
        this.timeBar = UIBuilder.addSprite(barFill, new Color(76, 175, 80));
        this.timeBar.type = Sprite.Type.SIMPLE;
    }

    private buildReservationList(): void {
        const { width, height } = UIBuilder.getDesignResolution();
        const listWidth = 280;
        const listHeight = height - 120;

        const listBg = UIBuilder.createPanel(
            this.rootNode!,
            'ReservationListBg',
            listWidth,
            listHeight,
            Color.WHITE
        );
        UIBuilder.setPosition(listBg, -width / 2 + listWidth / 2 + 20, -10);

        const header = UIBuilder.createPanel(
            listBg,
            'ListHeader',
            listWidth,
            44,
            new Color(33, 150, 243)
        );
        UIBuilder.setPosition(header, 0, listHeight / 2 - 22);

        const headerLabel = UIBuilder.addLabel(header, '待处理预约', 18, Color.WHITE);
        headerLabel.horizontalAlign = Label.HorizontalAlign.CENTER;
        headerLabel.verticalAlign = Label.VerticalAlign.CENTER;
        headerLabel.node.setPosition(0, 0, 0);
        UIBuilder.setSize(headerLabel.node, listWidth, 44);

        const scrollResult = UIBuilder.createScrollList(
            listBg,
            'ReservationScroll',
            listWidth - 10,
            listHeight - 60,
            90,
            8
        );
        UIBuilder.setPosition(scrollResult.scrollView.node, 0, -30);

        this.reservationListContent = scrollResult.content;
    }

    private buildDetailPanel(): void {
        const { width, height } = UIBuilder.getDesignResolution();
        const panelWidth = 400;
        const panelHeight = 380;

        this.detailPanel = UIBuilder.createPanel(
            this.rootNode!,
            'DetailPanel',
            panelWidth,
            panelHeight,
            Color.WHITE
        );
        UIBuilder.setPosition(this.detailPanel, width / 2 - panelWidth / 2 - 20, height / 2 - panelHeight / 2 - 90);

        const detailHeader = UIBuilder.createPanel(
            this.detailPanel,
            'DetailHeader',
            panelWidth,
            44,
            new Color(103, 58, 183)
        );
        UIBuilder.setPosition(detailHeader, 0, panelHeight / 2 - 22);

        const detailTitle = UIBuilder.addLabel(detailHeader, '预约详情', 18, Color.WHITE);
        detailTitle.horizontalAlign = Label.HorizontalAlign.CENTER;
        detailTitle.verticalAlign = Label.VerticalAlign.CENTER;
        detailTitle.node.setPosition(0, 0, 0);
        UIBuilder.setSize(detailTitle.node, panelWidth, 44);

        this.noSelectionHint = UIBuilder.addLabel(this.detailPanel, '← 请从左侧选择一个预约', 16, new Color(158, 158, 158));
        this.noSelectionHint.horizontalAlign = Label.HorizontalAlign.CENTER;
        this.noSelectionHint.verticalAlign = Label.VerticalAlign.CENTER;
        this.noSelectionHint.node.setPosition(0, 0, 0);
        UIBuilder.setSize(this.noSelectionHint.node, 300, 40);

        this.detailContent = UIBuilder.createNode('DetailContent', this.detailPanel);
        this.detailContent.active = false;
        UIBuilder.setPosition(this.detailContent, 0, -20);
        UIBuilder.setSize(this.detailContent, panelWidth - 40, panelHeight - 80);

        const startY = 140;
        const rowHeight = 32;
        const labelX = -panelWidth / 2 + 40;
        const valueX = 60;

        const rows = [
            { key: '姓名', valueKey: 'visitorName' },
            { key: '身份证', valueKey: 'idCard' },
            { key: '手机号', valueKey: 'phone' },
            { key: '景区', valueKey: 'spot' },
            { key: '预约时段', valueKey: 'timeSlot' },
            { key: '票数', valueKey: 'ticketCount' },
            { key: '改约次数', valueKey: 'rescheduleCount' },
            { key: '到场状态', valueKey: 'arrivalStatus' },
        ];

        for (let i = 0; i < rows.length; i++) {
            const y = startY - i * rowHeight;

            const keyNode = UIBuilder.createNode(`Key_${rows[i].key}`, this.detailContent);
            UIBuilder.setPosition(keyNode, labelX, y);
            UIBuilder.setSize(keyNode, 80, 24);
            const keyLabel = UIBuilder.addLabel(keyNode, rows[i].key, 14, new Color(117, 117, 117));
            keyLabel.horizontalAlign = Label.HorizontalAlign.LEFT;
            keyLabel.verticalAlign = Label.VerticalAlign.CENTER;

            const valueNode = UIBuilder.createNode(`Value_${rows[i].key}`, this.detailContent);
            UIBuilder.setPosition(valueNode, valueX, y);
            UIBuilder.setSize(valueNode, 220, 24);
            const valueLabel = UIBuilder.addLabel(valueNode, '-', 14, new Color(33, 33, 33));
            valueLabel.horizontalAlign = Label.HorizontalAlign.LEFT;
            valueLabel.verticalAlign = Label.VerticalAlign.CENTER;

            switch (rows[i].valueKey) {
                case 'visitorName': this.detailVisitorName = valueLabel; break;
                case 'idCard': this.detailIdCard = valueLabel; break;
                case 'phone': this.detailPhone = valueLabel; break;
                case 'spot': this.detailSpot = valueLabel; break;
                case 'timeSlot': this.detailTimeSlot = valueLabel; break;
                case 'ticketCount': this.detailTicketCount = valueLabel; break;
                case 'rescheduleCount': this.detailRescheduleCount = valueLabel; break;
                case 'arrivalStatus': this.detailArrivalStatus = valueLabel; break;
            }
        }

        const conflictTitleNode = UIBuilder.createNode('ConflictTitle', this.detailContent);
        UIBuilder.setPosition(conflictTitleNode, labelX, startY - rows.length * rowHeight - 10);
        UIBuilder.setSize(conflictTitleNode, 100, 20);
        const conflictTitle = UIBuilder.addLabel(conflictTitleNode, '冲突检测', 14, new Color(33, 33, 33));
        conflictTitle.horizontalAlign = Label.HorizontalAlign.LEFT;
        conflictTitle.verticalAlign = Label.VerticalAlign.CENTER;

        this.detailConflictList = UIBuilder.createNode('ConflictList', this.detailContent);
        UIBuilder.setPosition(this.detailConflictList, valueX - 20, startY - rows.length * rowHeight - 30);
        UIBuilder.setSize(this.detailConflictList, 250, 60);

        const notesTitleNode = UIBuilder.createNode('NotesTitle', this.detailContent);
        UIBuilder.setPosition(notesTitleNode, labelX, startY - rows.length * rowHeight - 90);
        UIBuilder.setSize(notesTitleNode, 100, 20);
        const notesTitle = UIBuilder.addLabel(notesTitleNode, '备注信息', 14, new Color(33, 33, 33));
        notesTitle.horizontalAlign = Label.HorizontalAlign.LEFT;
        notesTitle.verticalAlign = Label.VerticalAlign.CENTER;

        const notesNode = UIBuilder.createNode('NotesContent', this.detailContent);
        UIBuilder.setPosition(notesNode, valueX - 20, startY - rows.length * rowHeight - 110);
        UIBuilder.setSize(notesNode, 250, 40);
        this.detailNotes = UIBuilder.addLabel(notesNode, '-', 12, new Color(117, 117, 117));
        this.detailNotes.horizontalAlign = Label.HorizontalAlign.LEFT;
        this.detailNotes.verticalAlign = Label.VerticalAlign.TOP;
        this.detailNotes.overflow = Label.Overflow.CLAMP;
    }

    private buildActionPanel(): void {
        const { width, height } = UIBuilder.getDesignResolution();
        const panelWidth = 400;
        const panelHeight = 160;

        this.actionPanel = UIBuilder.createPanel(
            this.rootNode!,
            'ActionPanel',
            panelWidth,
            panelHeight,
            Color.WHITE
        );
        UIBuilder.setPosition(this.actionPanel, width / 2 - panelWidth / 2 - 20, -height / 2 + panelHeight / 2 + 30);

        const actionHeader = UIBuilder.createPanel(
            this.actionPanel,
            'ActionHeader',
            panelWidth,
            36,
            new Color(0, 150, 136)
        );
        UIBuilder.setPosition(actionHeader, 0, panelHeight / 2 - 18);

        const actionTitle = UIBuilder.addLabel(actionHeader, '操作面板', 16, Color.WHITE);
        actionTitle.horizontalAlign = Label.HorizontalAlign.CENTER;
        actionTitle.verticalAlign = Label.VerticalAlign.CENTER;
        actionTitle.node.setPosition(0, 0, 0);
        UIBuilder.setSize(actionTitle.node, panelWidth, 36);

        const btnWidth = 110;
        const btnHeight = 44;
        const row1Y = 30;
        const row2Y = -30;
        const spacing = 130;

        const approveBtnData = UIBuilder.createTextButton(
            this.actionPanel,
            'ApproveBtn',
            '批准',
            btnWidth,
            btnHeight,
            15,
            new Color(76, 175, 80),
            Color.WHITE
        );
        UIBuilder.setPosition(approveBtnData.node, -spacing, row1Y);
        approveBtnData.node.on(Button.EventType.CLICK, this.onApproveClick, this);
        this.approveBtn = approveBtnData.button;

        const rejectBtnData = UIBuilder.createTextButton(
            this.actionPanel,
            'RejectBtn',
            '拒绝',
            btnWidth,
            btnHeight,
            15,
            new Color(244, 67, 54),
            Color.WHITE
        );
        UIBuilder.setPosition(rejectBtnData.node, 0, row1Y);
        rejectBtnData.node.on(Button.EventType.CLICK, this.onRejectClick, this);
        this.rejectBtn = rejectBtnData.button;

        const rescheduleBtnData = UIBuilder.createTextButton(
            this.actionPanel,
            'RescheduleBtn',
            '改约',
            btnWidth,
            btnHeight,
            15,
            new Color(255, 152, 0),
            Color.WHITE
        );
        UIBuilder.setPosition(rescheduleBtnData.node, spacing, row1Y);
        rescheduleBtnData.node.on(Button.EventType.CLICK, this.onRescheduleClick, this);
        this.rescheduleBtn = rescheduleBtnData.button;

        const checkInBtnData = UIBuilder.createTextButton(
            this.actionPanel,
            'CheckInBtn',
            '签到入园',
            btnWidth,
            btnHeight,
            15,
            new Color(33, 150, 243),
            Color.WHITE
        );
        UIBuilder.setPosition(checkInBtnData.node, -spacing / 2, row2Y);
        checkInBtnData.node.on(Button.EventType.CLICK, this.onCheckInClick, this);
        this.checkInBtn = checkInBtnData.button;

        const denyEntryBtnData = UIBuilder.createTextButton(
            this.actionPanel,
            'DenyEntryBtn',
            '拒入园',
            btnWidth,
            btnHeight,
            15,
            new Color(156, 39, 176),
            Color.WHITE
        );
        UIBuilder.setPosition(denyEntryBtnData.node, spacing / 2, row2Y);
        denyEntryBtnData.node.on(Button.EventType.CLICK, this.onDenyEntryClick, this);
        this.denyEntryBtn = denyEntryBtnData.button;

        this.updateButtonStates(false);
    }

    private buildReschedulePanel(): void {
        const { width, height } = UIBuilder.getDesignResolution();
        const panelWidth = 360;
        const panelHeight = 320;

        this.reschedulePanel = UIBuilder.createPanel(
            this.rootNode!,
            'ReschedulePanel',
            panelWidth,
            panelHeight,
            new Color(0, 0, 0, 100)
        );
        UIBuilder.setPosition(this.reschedulePanel, 0, 0);
        this.reschedulePanel.active = false;

        const innerPanel = UIBuilder.createPanel(
            this.reschedulePanel,
            'InnerPanel',
            panelWidth - 60,
            panelHeight - 60,
            Color.WHITE
        );
        UIBuilder.setPosition(innerPanel, 0, 0);

        const titleNode = UIBuilder.createNode('Title', innerPanel);
        UIBuilder.setPosition(titleNode, 0, panelHeight / 2 - 90);
        const titleLabel = UIBuilder.addLabel(titleNode, '选择改约时段', 20, new Color(33, 33, 33));
        titleLabel.horizontalAlign = Label.HorizontalAlign.CENTER;
        titleLabel.verticalAlign = Label.VerticalAlign.CENTER;
        UIBuilder.setSize(titleNode, 200, 30);

        const scrollResult = UIBuilder.createScrollList(
            innerPanel,
            'SlotScroll',
            panelWidth - 100,
            160,
            44,
            6
        );
        UIBuilder.setPosition(scrollResult.scrollView.node, 0, -10);
        this.rescheduleSlotList = scrollResult.content;

        const confirmBtn = UIBuilder.createTextButton(
            innerPanel,
            'ConfirmBtn',
            '确认改约',
            120,
            40,
            16,
            new Color(255, 152, 0),
            Color.WHITE
        );
        UIBuilder.setPosition(confirmBtn.node, -70, -panelHeight / 2 + 100);
        confirmBtn.node.on(Button.EventType.CLICK, this.onConfirmReschedule, this);

        const cancelBtn = UIBuilder.createTextButton(
            innerPanel,
            'CancelBtn',
            '取消',
            120,
            40,
            16,
            new Color(158, 158, 158),
            Color.WHITE
        );
        UIBuilder.setPosition(cancelBtn.node, 70, -panelHeight / 2 + 100);
        cancelBtn.node.on(Button.EventType.CLICK, this.onCancelReschedule, this);
    }

    private buildResultPanel(): void {
        this.resultPanel = UIBuilder.createPanel(
            this.rootNode!,
            'ResultPanel',
            500,
            520,
            new Color(0, 0, 0, 120)
        );
        UIBuilder.setPosition(this.resultPanel, 0, 0);
        this.resultPanel.active = false;

        const innerPanel = UIBuilder.createPanel(
            this.resultPanel,
            'ResultInner',
            420,
            480,
            Color.WHITE
        );
        UIBuilder.setPosition(innerPanel, 0, 0);

        const titleNode = UIBuilder.createNode('ResultTitle', innerPanel);
        UIBuilder.setPosition(titleNode, 0, 210);
        const titleLabel = UIBuilder.addLabel(titleNode, '训练结束', 30, new Color(33, 33, 33));
        titleLabel.horizontalAlign = Label.HorizontalAlign.CENTER;
        titleLabel.verticalAlign = Label.VerticalAlign.CENTER;
        UIBuilder.setSize(titleNode, 300, 40);

        const scoreTitleNode = UIBuilder.createNode('ScoreTitle', innerPanel);
        UIBuilder.setPosition(scoreTitleNode, 0, 170);
        const scoreTitle = UIBuilder.addLabel(scoreTitleNode, '最终得分', 16, new Color(117, 117, 117));
        scoreTitle.horizontalAlign = Label.HorizontalAlign.CENTER;
        scoreTitle.verticalAlign = Label.VerticalAlign.CENTER;
        UIBuilder.setSize(scoreTitleNode, 200, 24);

        const scoreValueNode = UIBuilder.createNode('ScoreValue', innerPanel);
        UIBuilder.setPosition(scoreValueNode, 0, 120);
        const scoreValue = UIBuilder.addLabel(scoreValueNode, '0', 56, new Color(33, 150, 243));
        scoreValue.horizontalAlign = Label.HorizontalAlign.CENTER;
        scoreValue.verticalAlign = Label.VerticalAlign.CENTER;
        UIBuilder.setSize(scoreValueNode, 200, 60);

        const statsNode = UIBuilder.createNode('Stats', innerPanel);
        UIBuilder.setPosition(statsNode, 0, 50);
        UIBuilder.setSize(statsNode, 360, 80);

        const statItems = [
            { label: '正确率', value: '0%' },
            { label: '正确数', value: '0/0' },
            { label: '用时', value: '0秒' },
        ];

        for (let i = 0; i < statItems.length; i++) {
            const item = statItems[i];
            const y = 30 - i * 28;

            const statNode = UIBuilder.createNode(`Stat_${item.label}`, statsNode);
            UIBuilder.setPosition(statNode, 0, y);
            UIBuilder.setSize(statNode, 300, 24);

            const label = UIBuilder.addLabel(statNode, `${item.label}: `, 14, new Color(117, 117, 117));
            label.horizontalAlign = Label.HorizontalAlign.LEFT;
            label.verticalAlign = Label.VerticalAlign.CENTER;

            const valueLabel = UIBuilder.addLabel(statNode, item.value, 14, new Color(33, 33, 33));
            valueLabel.horizontalAlign = Label.HorizontalAlign.RIGHT;
            valueLabel.verticalAlign = Label.VerticalAlign.CENTER;
            valueLabel.node.setPosition(100, 0, 0);
        }

        const mistakeTitleNode = UIBuilder.createNode('MistakeTitle', innerPanel);
        UIBuilder.setPosition(mistakeTitleNode, -180, -50);
        const mistakeTitle = UIBuilder.addLabel(mistakeTitleNode, '错因分析', 16, new Color(244, 67, 54));
        mistakeTitle.horizontalAlign = Label.HorizontalAlign.LEFT;
        mistakeTitle.verticalAlign = Label.VerticalAlign.CENTER;
        UIBuilder.setSize(mistakeTitleNode, 100, 24);

        const mistakeListBg = UIBuilder.createPanel(
            innerPanel,
            'MistakeList',
            360,
            140,
            new Color(255, 245, 245)
        );
        UIBuilder.setPosition(mistakeListBg, 0, -130);

        const retryBtn = UIBuilder.createTextButton(
            innerPanel,
            'RetryBtn',
            '重新挑战',
            140,
            44,
            16,
            new Color(33, 150, 243),
            Color.WHITE
        );
        UIBuilder.setPosition(retryBtn.node, -90, -220);
        retryBtn.node.on(Button.EventType.CLICK, this.onRetryClick, this);

        const backBtn = UIBuilder.createTextButton(
            innerPanel,
            'BackBtn',
            '返回关卡',
            140,
            44,
            16,
            new Color(158, 158, 158),
            Color.WHITE
        );
        UIBuilder.setPosition(backBtn.node, 90, -220);
        backBtn.node.on(Button.EventType.CLICK, this.onBackToLevelsClick, this);
    }

    private buildToast(): void {
        this.toastNode = UIBuilder.createPanel(
            this.rootNode!,
            'Toast',
            320,
            60,
            new Color(0, 0, 0, 180)
        );
        UIBuilder.setPosition(this.toastNode, 0, 50);
        this.toastNode.active = false;

        this.toastLabel = UIBuilder.addLabel(this.toastNode, '', 15, Color.WHITE);
        this.toastLabel.horizontalAlign = Label.HorizontalAlign.CENTER;
        this.toastLabel.verticalAlign = Label.VerticalAlign.CENTER;
        this.toastLabel.node.setPosition(0, 0, 0);
        UIBuilder.setSize(this.toastLabel.node, 300, 50);
    }

    private initGame(): void {
        const gameManager = GameManager.instance;
        if (!gameManager) {
            this.showToast('游戏管理器未初始化', 'error');
            return;
        }

        const level = gameManager.getCurrentLevel();
        if (!level) {
            this.showToast('请先选择关卡', 'error');
            this.scheduleOnce(() => {
                this.onBackClick();
            }, 1);
            return;
        }

        if (this.levelNameLabel) {
            this.levelNameLabel.string = level.name;
        }

        this.totalScore = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.correctCount = 0;
        this.mistakeList = [];
        this.gameStartTime = Date.now();
        this.isGameEnded = false;

        this.refreshReservationList();
        this.updateHUD();

        const pending = gameManager.getPendingTasks();
        if (pending.length > 0) {
            this.scheduleOnce(() => {
                this.selectReservation(pending[0].id);
            }, 0.2);
        }
    }

    private refreshReservationList(): void {
        if (!this.reservationListContent) return;

        const gameManager = GameManager.instance;
        if (!gameManager) return;

        const pending = gameManager.getPendingTasks();
        const allReservations = gameManager.getReservations();

        this.reservationListContent.removeAllChildren();
        this.reservationItems.clear();

        for (let i = 0; i < pending.length; i++) {
            const reservation = pending[i];
            const spot = gameManager.getScenicSpot(reservation.scenicSpotId);
            const itemNode = this.createReservationItem(reservation, spot?.name || '未知', i);
            this.reservationListContent.addChild(itemNode);
            this.reservationItems.set(reservation.id, itemNode);
        }

        if (this.pendingCountLabel) {
            this.pendingCountLabel.string = `待处理: ${pending.length} / 总数: ${allReservations.length}`;
        }

        const contentHeight = pending.length * 98 + 20;
        UIBuilder.setSize(this.reservationListContent, this.reservationListContent.contentSize.width, contentHeight);
    }

    private createReservationItem(reservation: Reservation, spotName: string, index: number): Node {
        const itemWidth = 250;
        const itemHeight = 90;

        const itemNode = UIBuilder.createNode(`Item_${reservation.id}`);
        UIBuilder.setSize(itemNode, itemWidth, itemHeight);

        const hasConflict = reservation.hasConflict();
        const bgColor = hasConflict ? new Color(255, 235, 238) : Color.WHITE;
        const bg = UIBuilder.addSprite(itemNode, bgColor);
        bg.type = Sprite.Type.SLICED;

        const button = itemNode.addComponent(Button);
        button.transition = Button.Transition.COLOR;
        button.normalColor = bgColor;
        button.hoverColor = hasConflict ? new Color(255, 205, 210) : new Color(240, 248, 255);
        button.pressedColor = hasConflict ? new Color(255, 180, 180) : new Color(220, 240, 255);

        const nameNode = UIBuilder.createNode('VisitorName', itemNode);
        UIBuilder.setPosition(nameNode, -itemWidth / 2 + 15, 25);
        UIBuilder.setSize(nameNode, 120, 22);
        const nameLabel = UIBuilder.addLabel(nameNode, reservation.visitor.name, 16, new Color(33, 33, 33));
        nameLabel.horizontalAlign = Label.HorizontalAlign.LEFT;
        nameLabel.verticalAlign = Label.VerticalAlign.CENTER;

        const ticketNode = UIBuilder.createNode('TicketCount', itemNode);
        UIBuilder.setPosition(ticketNode, itemWidth / 2 - 15, 25);
        UIBuilder.setSize(ticketNode, 60, 22);
        const ticketLabel = UIBuilder.addLabel(ticketNode, `${reservation.visitor.ticketCount}张`, 12, new Color(117, 117, 117));
        ticketLabel.horizontalAlign = Label.HorizontalAlign.RIGHT;
        ticketLabel.verticalAlign = Label.VerticalAlign.CENTER;

        const timeNode = UIBuilder.createNode('TimeSlot', itemNode);
        UIBuilder.setPosition(timeNode, -itemWidth / 2 + 15, 0);
        UIBuilder.setSize(timeNode, 160, 20);
        const timeLabel = UIBuilder.addLabel(timeNode, reservation.timeSlot.formatTime(), 14, new Color(33, 150, 243));
        timeLabel.horizontalAlign = Label.HorizontalAlign.LEFT;
        timeLabel.verticalAlign = Label.VerticalAlign.CENTER;

        const spotNode = UIBuilder.createNode('SpotName', itemNode);
        UIBuilder.setPosition(spotNode, -itemWidth / 2 + 15, -22);
        UIBuilder.setSize(spotNode, 150, 18);
        const spotLabel = UIBuilder.addLabel(spotNode, spotName, 11, new Color(117, 117, 117));
        spotLabel.horizontalAlign = Label.HorizontalAlign.LEFT;
        spotLabel.verticalAlign = Label.VerticalAlign.CENTER;

        if (hasConflict) {
            const conflictNode = UIBuilder.createNode('ConflictFlag', itemNode);
            UIBuilder.setPosition(conflictNode, itemWidth / 2 - 35, -22);
            UIBuilder.setSize(conflictNode, 50, 18);
            const conflictBg = UIBuilder.addSprite(conflictNode, new Color(244, 67, 54));
            conflictBg.type = Sprite.Type.SLICED;
            const conflictLabel = UIBuilder.addLabel(conflictNode, '有冲突', 10, Color.WHITE);
            conflictLabel.horizontalAlign = Label.HorizontalAlign.CENTER;
            conflictLabel.verticalAlign = Label.VerticalAlign.CENTER;
        }

        if (reservation.getRescheduleCount() > 0) {
            const reschedNode = UIBuilder.createNode('RescheduleFlag', itemNode);
            UIBuilder.setPosition(reschedNode, itemWidth / 2 - 95, -22);
            UIBuilder.setSize(reschedNode, 50, 18);
            const reschedBg = UIBuilder.addSprite(reschedNode, new Color(255, 152, 0));
            reschedBg.type = Sprite.Type.SLICED;
            const reschedLabel = UIBuilder.addLabel(reschedNode, `${reservation.getRescheduleCount()}改约`, 9, Color.WHITE);
            reschedLabel.horizontalAlign = Label.HorizontalAlign.CENTER;
            reschedLabel.verticalAlign = Label.VerticalAlign.CENTER;
        }

        const visitorStatus = reservation.visitor.arrivalStatus;
        if (visitorStatus !== ArrivalStatus.NOT_ARRIVED) {
            const arriveNode = UIBuilder.createNode('ArriveFlag', itemNode);
            UIBuilder.setPosition(arriveNode, -itemWidth / 2 + 15, -22);
            UIBuilder.setSize(arriveNode, 50, 18);
            const arriveBg = UIBuilder.addSprite(arriveNode, new Color(76, 175, 80));
            arriveBg.type = Sprite.Type.SLICED;
            const arriveLabel = UIBuilder.addLabel(arriveNode, '已到场', 9, Color.WHITE);
            arriveLabel.horizontalAlign = Label.HorizontalAlign.CENTER;
            arriveLabel.verticalAlign = Label.VerticalAlign.CENTER;
        }

        itemNode.on(Button.EventType.CLICK, () => {
            this.selectReservation(reservation.id);
        }, this);

        return itemNode;
    }

    private selectReservation(reservationId: string): void {
        this.selectedReservationId = reservationId;

        for (const [id, item] of this.reservationItems) {
            const sprite = item.getComponent(Sprite);
            if (sprite) {
                if (id === reservationId) {
                    sprite.color = new Color(200, 230, 255);
                } else {
                    const reservation = this.getReservationById(id);
                    const hasConflict = reservation?.hasConflict();
                    sprite.color = hasConflict ? new Color(255, 235, 238) : Color.WHITE;
                }
            }
        }

        const gameManager = GameManager.instance;
        const reservation = this.getReservationById(reservationId);
        if (reservation && gameManager) {
            gameManager.setSelectedReservation(reservation);
            this.updateDetailPanel(reservation);
            this.updateButtonStates(true);
        }
    }

    private getReservationById(id: string): Reservation | null {
        const gameManager = GameManager.instance;
        if (!gameManager) return null;

        const all = gameManager.getReservations();
        return all.find(r => r.id === id) || null;
    }

    private updateDetailPanel(reservation: Reservation): void {
        if (!this.detailContent || !this.noSelectionHint) return;

        this.noSelectionHint.node.active = false;
        this.detailContent.active = true;

        const visitor = reservation.visitor;
        const gameManager = GameManager.instance;
        const spot = gameManager?.getScenicSpot(reservation.scenicSpotId);

        if (this.detailVisitorName) {
            this.detailVisitorName.string = visitor.name;
        }
        if (this.detailIdCard) {
            this.detailIdCard.string = visitor.maskIdCard();
        }
        if (this.detailPhone) {
            this.detailPhone.string = visitor.maskPhone();
        }
        if (this.detailSpot) {
            this.detailSpot.string = spot?.name || '未知';
        }
        if (this.detailTimeSlot) {
            this.detailTimeSlot.string = reservation.timeSlot.formatTime();
        }
        if (this.detailTicketCount) {
            this.detailTicketCount.string = `${visitor.ticketCount} 张`;
        }
        if (this.detailRescheduleCount) {
            const count = reservation.getRescheduleCount();
            this.detailRescheduleCount.string = `${count} 次`;
            this.detailRescheduleCount.color = count > 0 ? new Color(255, 152, 0) : new Color(117, 117, 117);
        }
        if (this.detailArrivalStatus) {
            const statusTexts: Record<ArrivalStatus, string> = {
                [ArrivalStatus.NOT_ARRIVED]: '未到场',
                [ArrivalStatus.ARRIVED_ON_TIME]: '已准时到场',
                [ArrivalStatus.ARRIVED_LATE]: '迟到',
                [ArrivalStatus.ARRIVED_EARLY]: '提前到场'
            };
            const statusColors: Record<ArrivalStatus, Color> = {
                [ArrivalStatus.NOT_ARRIVED]: new Color(158, 158, 158),
                [ArrivalStatus.ARRIVED_ON_TIME]: new Color(76, 175, 80),
                [ArrivalStatus.ARRIVED_LATE]: new Color(255, 152, 0),
                [ArrivalStatus.ARRIVED_EARLY]: new Color(33, 150, 243)
            };
            this.detailArrivalStatus.string = statusTexts[visitor.arrivalStatus];
            this.detailArrivalStatus.color = statusColors[visitor.arrivalStatus];
        }
        if (this.detailNotes) {
            this.detailNotes.string = visitor.notes || '无';
        }

        this.updateConflictList(reservation);
    }

    private updateConflictList(reservation: Reservation): void {
        if (!this.detailConflictList) return;

        this.detailConflictList.removeAllChildren();

        const conflicts = reservation.conflicts.filter(c => c !== ConflictType.NONE);

        if (conflicts.length === 0) {
            const node = UIBuilder.createNode('NoConflict', this.detailConflictList);
            UIBuilder.setPosition(node, 0, 0);
            const label = UIBuilder.addLabel(node, '无冲突，可正常处理', 14, new Color(76, 175, 80));
            label.horizontalAlign = Label.HorizontalAlign.LEFT;
            label.verticalAlign = Label.VerticalAlign.CENTER;
            return;
        }

        for (let i = 0; i < conflicts.length; i++) {
            const conflict = conflicts[i];
            const node = UIBuilder.createNode(`Conflict_${i}`, this.detailConflictList);
            UIBuilder.setPosition(node, 0, -i * 22);
            UIBuilder.setSize(node, 240, 20);

            const label = UIBuilder.addLabel(node, ConflictDetector.getConflictDescription(conflict), 12, new Color(244, 67, 54));
            label.horizontalAlign = Label.HorizontalAlign.LEFT;
            label.verticalAlign = Label.VerticalAlign.TOP;
            label.lineHeight = 16;
            label.overflow = Label.Overflow.RESIZE_HEIGHT;
        }
    }

    private updateButtonStates(enabled: boolean): void {
        const buttons = [this.approveBtn, this.rejectBtn, this.rescheduleBtn, this.checkInBtn, this.denyEntryBtn];
        for (const btn of buttons) {
            if (btn) {
                btn.interactable = enabled;
            }
        }
    }

    private onApproveClick(): void {
        this.processAction(ActionType.APPROVE_RESERVATION);
    }

    private onRejectClick(): void {
        this.processAction(ActionType.REJECT_RESERVATION);
    }

    private onRescheduleClick(): void {
        this.showReschedulePanel();
    }

    private onCheckInClick(): void {
        this.processAction(ActionType.CHECK_IN);
    }

    private onDenyEntryClick(): void {
        this.processAction(ActionType.DENY_ENTRY);
    }

    private processAction(action: ActionType, rescheduleSlotIndex: number | null = null): void {
        const gameManager = GameManager.instance;
        if (!gameManager) return;

        const reservation = gameManager.getSelectedReservation();
        if (!reservation) {
            this.showToast('请先选择一个预约', 'error');
            return;
        }

        const result = this.judgeAction(reservation, action, rescheduleSlotIndex);

        if (result.correct) {
            this.combo++;
            if (this.combo > this.maxCombo) {
                this.maxCombo = this.combo;
            }
            this.correctCount++;
            this.totalScore += result.scoreChange;

            if (this.combo >= 3) {
                const bonus = Math.min(this.combo - 2, 5) * 10;
                this.totalScore += bonus;
            }

            this.showToast(result.message, 'success');
        } else {
            this.combo = 0;
            this.totalScore = Math.max(0, this.totalScore + result.scoreChange);

            this.mistakeList.push({
                visitorName: reservation.visitor.name,
                expectedAction: reservation.correctAction,
                actualAction: action,
                explanation: result.message
            });

            this.showToast(result.message, 'error');
        }

        this.applyAction(reservation, action, rescheduleSlotIndex);

        this.selectedReservationId = null;
        gameManager.setSelectedReservation(null);

        this.refreshReservationList();
        this.updateHUD();
        this.resetDetailPanel();
        this.updateButtonStates(false);

        const pending = gameManager.getPendingTasks();
        if (pending.length > 0) {
            this.scheduleOnce(() => {
                this.selectReservation(pending[0].id);
            }, 0.3);
        } else {
            this.endGame();
        }
    }

    private judgeAction(
        reservation: Reservation,
        action: ActionType,
        rescheduleSlotIndex: number | null
    ): { correct: boolean; scoreChange: number; message: string } {
        const expectedAction = reservation.correctAction;
        const gameManager = GameManager.instance;
        const spot = gameManager?.getScenicSpot(reservation.scenicSpotId);
        const visitor = reservation.visitor;

        if (action === ActionType.CHECK_IN) {
            if (visitor.arrivalStatus === ArrivalStatus.NOT_ARRIVED) {
                return {
                    correct: false,
                    scoreChange: -50,
                    message: '错误：游客未到场，不能签到'
                };
            }
            if (reservation.status !== ReservationStatus.PENDING && reservation.status !== ReservationStatus.CONFIRMED) {
                return {
                    correct: false,
                    scoreChange: -50,
                    message: '错误：预约状态异常，不能签到'
                };
            }
            if (visitor.hasBlacklist) {
                return {
                    correct: false,
                    scoreChange: -50,
                    message: '错误：黑名单游客应拒绝入园'
                };
            }
            if (expectedAction !== ActionType.CHECK_IN) {
                return {
                    correct: false,
                    scoreChange: -50,
                    message: this.getMistakeExplanation(reservation, action)
                };
            }
        }

        if (action === ActionType.DENY_ENTRY) {
            if (visitor.arrivalStatus === ArrivalStatus.NOT_ARRIVED) {
                return {
                    correct: false,
                    scoreChange: -50,
                    message: '错误：游客未到场，无需拒入园'
                };
            }
            if (!visitor.hasBlacklist) {
                return {
                    correct: false,
                    scoreChange: -50,
                    message: '错误：正常游客不应拒绝入园'
                };
            }
            if (expectedAction !== ActionType.DENY_ENTRY) {
                return {
                    correct: false,
                    scoreChange: -50,
                    message: this.getMistakeExplanation(reservation, action)
                };
            }
        }

        if (action === ActionType.APPROVE_RESERVATION || action === ActionType.REJECT_RESERVATION || action === ActionType.RESCHEDULE) {
            if (visitor.arrivalStatus !== ArrivalStatus.NOT_ARRIVED) {
                return {
                    correct: false,
                    scoreChange: -50,
                    message: '错误：游客已到场，应进行签到或拒入园'
                };
            }
        }

        if (action !== expectedAction) {
            return {
                correct: false,
                scoreChange: -50,
                message: this.getMistakeExplanation(reservation, action)
            };
        }

        if (action === ActionType.RESCHEDULE) {
            if (rescheduleSlotIndex === null || rescheduleSlotIndex < 0) {
                return {
                    correct: false,
                    scoreChange: -50,
                    message: '错误：请选择改约时段'
                };
            }

            if (spot) {
                const targetSlot = spot.timeSlots[rescheduleSlotIndex];
                if (!targetSlot) {
                    return {
                        correct: false,
                        scoreChange: -50,
                        message: '错误：无效的改约时段'
                    };
                }

                if (!targetSlot.hasCapacity(reservation.visitor.ticketCount)) {
                    return {
                        correct: false,
                        scoreChange: -50,
                        message: '错误：改约时段容量不足'
                    };
                }

                if (reservation.correctRescheduleSlotIndex !== null && reservation.correctRescheduleSlotIndex >= 0) {
                    if (rescheduleSlotIndex !== reservation.correctRescheduleSlotIndex) {
                        return {
                            correct: false,
                            scoreChange: -30,
                            message: '改约时段不是最优选择，注意选最近的可用时段'
                        };
                    }
                }
            }
        }

        return {
            correct: true,
            scoreChange: 100,
            message: '正确! +100分'
        };
    }

    private getMistakeExplanation(reservation: Reservation, action: ActionType): string {
        const expected = reservation.correctAction;
        const actionNames: Record<ActionType, string> = {
            [ActionType.APPROVE_RESERVATION]: '批准预约',
            [ActionType.REJECT_RESERVATION]: '拒绝预约',
            [ActionType.RESCHEDULE]: '改约',
            [ActionType.CHECK_IN]: '签到入园',
            [ActionType.DENY_ENTRY]: '拒绝入园',
            [ActionType.ESCALATE]: '上报'
        };

        if (reservation.conflicts.includes(ConflictType.BLACKLIST)) {
            if (action === ActionType.APPROVE_RESERVATION) {
                return '黑名单游客不应批准预约';
            }
            if (action === ActionType.CHECK_IN) {
                return '黑名单游客不能签到，应拒绝入园';
            }
        }

        if (reservation.conflicts.includes(ConflictType.CAPACITY_EXCEEDED)) {
            if (action === ActionType.APPROVE_RESERVATION) {
                return '该时段已满，应进行改约或拒绝';
            }
        }

        if (reservation.conflicts.includes(ConflictType.TIME_SLOT_OVERLAP)) {
            if (action === ActionType.APPROVE_RESERVATION) {
                return '时段有重叠，应改约或拒绝';
            }
        }

        if (reservation.conflicts.includes(ConflictType.SAME_PERSON_MULTI_BOOKING)) {
            if (action === ActionType.APPROVE_RESERVATION) {
                return '重复预约，应拒绝';
            }
        }

        if (reservation.visitor.arrivalStatus !== ArrivalStatus.NOT_ARRIVED) {
            if (action === ActionType.APPROVE_RESERVATION || action === ActionType.REJECT_RESERVATION) {
                return '游客已到场，应进行签到或拒入园操作';
            }
        }

        if (reservation.visitor.arrivalStatus === ArrivalStatus.NOT_ARRIVED) {
            if (action === ActionType.CHECK_IN || action === ActionType.DENY_ENTRY) {
                return '游客未到场，先处理预约审核';
            }
        }

        return `正确操作应为：${actionNames[expected]}`;
    }

    private applyAction(reservation: Reservation, action: ActionType, rescheduleSlotIndex: number | null): void {
        const gameManager = GameManager.instance;
        if (!gameManager) return;

        const spot = gameManager.getScenicSpot(reservation.scenicSpotId);

        switch (action) {
            case ActionType.APPROVE_RESERVATION:
                reservation.status = ReservationStatus.CONFIRMED;
                reservation.timeSlot.bookedCount += reservation.visitor.ticketCount;
                break;
            case ActionType.REJECT_RESERVATION:
                reservation.status = ReservationStatus.CANCELLED;
                break;
            case ActionType.RESCHEDULE:
                if (spot && rescheduleSlotIndex !== null) {
                    const newSlot = spot.timeSlots[rescheduleSlotIndex];
                    if (newSlot) {
                        reservation.reschedule(newSlot, '玩家操作', 'player');
                        newSlot.bookedCount += reservation.visitor.ticketCount;
                    }
                }
                break;
            case ActionType.CHECK_IN:
                reservation.status = ReservationStatus.ARRIVED;
                break;
            case ActionType.DENY_ENTRY:
                reservation.status = ReservationStatus.CANCELLED;
                break;
        }

        reservation.processedAt = Date.now();
        reservation.processedBy = 'player';
    }

    private showReschedulePanel(): void {
        if (!this.reschedulePanel || !this.rescheduleSlotList) return;

        const gameManager = GameManager.instance;
        const reservation = gameManager?.getSelectedReservation();
        if (!reservation) {
            this.showToast('请先选择一个预约', 'error');
            return;
        }

        const spot = gameManager?.getScenicSpot(reservation.scenicSpotId);
        if (!spot) return;

        this.reschedulePanel.active = true;
        this.selectedSlotIndex = -1;

        this.rescheduleSlotList.removeAllChildren();

        for (let i = 0; i < spot.timeSlots.length; i++) {
            const slot = spot.timeSlots[i];
            const isCurrentSlot = slot.startTime === reservation.timeSlot.startTime && slot.endTime === reservation.timeSlot.endTime;
            const hasCapacity = slot.hasCapacity(reservation.visitor.ticketCount);
            const isAvailable = hasCapacity && !isCurrentSlot;

            const itemNode = UIBuilder.createNode(`Slot_${i}`);
            UIBuilder.setSize(itemNode, 240, 40);

            let bgColor: Color;
            let textColor: Color;
            if (isCurrentSlot) {
                bgColor = new Color(200, 200, 200);
                textColor = new Color(158, 158, 158);
            } else if (!hasCapacity) {
                bgColor = new Color(240, 240, 240);
                textColor = new Color(180, 180, 180);
            } else {
                bgColor = new Color(232, 245, 233);
                textColor = new Color(76, 175, 80);
            }

            const bg = UIBuilder.addSprite(itemNode, bgColor);
            bg.type = Sprite.Type.SLICED;

            const text = isCurrentSlot
                ? `${slot.formatTime()} (当前)`
                : `${slot.formatTime()} 剩${slot.getAvailableSlots()}/${slot.capacity}`;

            const label = UIBuilder.addLabel(itemNode, text, 13, textColor);
            label.horizontalAlign = Label.HorizontalAlign.CENTER;
            label.verticalAlign = Label.VerticalAlign.CENTER;
            label.node.setPosition(0, 0, 0);
            UIBuilder.setSize(label.node, 240, 40);

            if (isAvailable) {
                const button = itemNode.addComponent(Button);
                button.transition = Button.Transition.COLOR;
                button.normalColor = bgColor;
                button.hoverColor = new Color(200, 230, 200);
                button.pressedColor = new Color(180, 220, 180);

                const slotIndex = i;
                itemNode.on(Button.EventType.CLICK, () => {
                    this.selectRescheduleSlot(slotIndex, itemNode);
                }, this);
            }

            this.rescheduleSlotList.addChild(itemNode);
        }

        const slotCount = spot.timeSlots.length;
        const contentHeight = slotCount * 46 + 20;
        UIBuilder.setSize(this.rescheduleSlotList, this.rescheduleSlotList.contentSize.width, contentHeight);
    }

    private selectRescheduleSlot(index: number, itemNode: Node): void {
        this.selectedSlotIndex = index;

        if (!this.rescheduleSlotList) return;

        for (let i = 0; i < this.rescheduleSlotList.children.length; i++) {
            const child = this.rescheduleSlotList.children[i];
            const bg = child.getComponent(Sprite);
            if (bg) {
                if (i === index) {
                    bg.color = new Color(33, 150, 243);
                    const label = child.getComponentInChildren(Label);
                    if (label) {
                        label.color = Color.WHITE;
                    }
                } else {
                    bg.color = new Color(232, 245, 233);
                    const label = child.getComponentInChildren(Label);
                    if (label) {
                        label.color = new Color(76, 175, 80);
                    }
                }
            }
        }
    }

    private onConfirmReschedule(): void {
        if (this.selectedSlotIndex < 0) {
            this.showToast('请选择一个改约时段', 'error');
            return;
        }

        this.hideReschedulePanel();
        this.processAction(ActionType.RESCHEDULE, this.selectedSlotIndex);
    }

    private onCancelReschedule(): void {
        this.hideReschedulePanel();
    }

    private hideReschedulePanel(): void {
        if (this.reschedulePanel) {
            this.reschedulePanel.active = false;
        }
    }

    private resetDetailPanel(): void {
        if (this.detailContent) {
            this.detailContent.active = false;
        }
        if (this.noSelectionHint) {
            this.noSelectionHint.node.active = true;
        }
    }

    private updateHUD(): void {
        if (this.scoreLabel) {
            this.scoreLabel.string = `${this.totalScore}`;
        }
        if (this.comboLabel) {
            this.comboLabel.string = `x${this.combo}`;
            this.comboLabel.color = this.combo >= 3 ? new Color(255, 193, 7) : new Color(200, 220, 240);
        }

        const gameManager = GameManager.instance;
        const level = gameManager?.getCurrentLevel();
        if (level && this.timeLabel) {
            const elapsed = (Date.now() - this.gameStartTime) / 1000;
            const remaining = Math.max(0, level.timeLimit - elapsed);
            const mins = Math.floor(remaining / 60);
            const secs = Math.floor(remaining % 60);
            this.timeLabel.string = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

            if (this.timeBar) {
                const ratio = remaining / level.timeLimit;
                this.timeBar.node.setContentSize(180 * ratio, 6);

                if (ratio < 0.2) {
                    this.timeBar.color = new Color(244, 67, 54);
                } else if (ratio < 0.5) {
                    this.timeBar.color = new Color(255, 193, 7);
                } else {
                    this.timeBar.color = new Color(76, 175, 80);
                }
            }

            if (remaining <= 0 && !this.isGameEnded) {
                this.endGame();
            }
        }
    }

    private updateGameTime(deltaTime: number): void {
        if (this.isGameEnded) return;
        this.updateHUD();
    }

    private endGame(): void {
        if (this.isGameEnded) return;
        this.isGameEnded = true;

        const gameManager = GameManager.instance;
        const level = gameManager?.getCurrentLevel();

        if (level) {
            GameSaveManager.getInstance().updateLevelProgress(
                level.id,
                this.totalScore,
                (Date.now() - this.gameStartTime) / 1000,
                0,
                this.correctCount > 0
            );
        }

        this.showResult();
    }

    private showResult(): void {
        if (!this.resultPanel) return;

        this.resultPanel.active = true;

        const innerPanel = this.resultPanel.getChildByName('ResultInner');
        if (innerPanel) {
            const scoreNode = innerPanel.getChildByName('ScoreValue');
            if (scoreNode) {
                const label = scoreNode.getComponent(Label);
                if (label) {
                    label.string = `${this.totalScore}`;
                }
            }

            const statsNode = innerPanel.getChildByName('Stats');
            if (statsNode) {
                const statLabels = statsNode.getComponentsInChildren(Label);
                const gameManager = GameManager.instance;
                const level = gameManager?.getCurrentLevel();
                const totalTasks = level?.tasks.filter(t => t.isTask).length || 0;
                const usedTime = (Date.now() - this.gameStartTime) / 1000;
                const accuracy = totalTasks > 0 ? (this.correctCount / totalTasks) : 0;
                const mins = Math.floor(usedTime / 60);
                const secs = Math.floor(usedTime % 60);

                const values = [
                    `${Math.floor(accuracy * 100)}%`,
                    `${this.correctCount}/${totalTasks}`,
                    `${mins}分${secs}秒`
                ];

                let valueIndex = 0;
                for (const label of statLabels) {
                    if (label.node.position.x > 50) {
                        if (valueIndex < values.length) {
                            label.string = values[valueIndex];
                            valueIndex++;
                        }
                    }
                }
            }

            const mistakeList = innerPanel.getChildByName('MistakeList');
            if (mistakeList) {
                mistakeList.removeAllChildren();

                if (this.mistakeList.length === 0) {
                    const node = UIBuilder.createNode('NoMistake', mistakeList);
                    UIBuilder.setPosition(node, 0, 0);
                    const label = UIBuilder.addLabel(node, '完美通关！没有任何错误', 16, new Color(76, 175, 80));
                    label.horizontalAlign = Label.HorizontalAlign.CENTER;
                    label.verticalAlign = Label.VerticalAlign.CENTER;
                    UIBuilder.setSize(label.node, 300, 80);
                } else {
                    const actionNames: Record<ActionType, string> = {
                        [ActionType.APPROVE_RESERVATION]: '批准',
                        [ActionType.REJECT_RESERVATION]: '拒绝',
                        [ActionType.RESCHEDULE]: '改约',
                        [ActionType.CHECK_IN]: '签到',
                        [ActionType.DENY_ENTRY]: '拒入园',
                        [ActionType.ESCALATE]: '上报'
                    };

                    for (let i = 0; i < this.mistakeList.length && i < 4; i++) {
                        const mistake = this.mistakeList[i];
                        const itemNode = UIBuilder.createNode(`Mistake_${i}`);
                        UIBuilder.setSize(itemNode, 340, 32);

                        const nameLabel = UIBuilder.addLabel(itemNode, mistake.visitorName, 13, new Color(33, 33, 33));
                        nameLabel.horizontalAlign = Label.HorizontalAlign.LEFT;
                        nameLabel.verticalAlign = Label.VerticalAlign.TOP;
                        nameLabel.node.setPosition(-170, 10, 0);

                        const descLabel = UIBuilder.addLabel(itemNode, mistake.explanation, 12, new Color(244, 67, 54));
                        descLabel.horizontalAlign = Label.HorizontalAlign.LEFT;
                        descLabel.verticalAlign = Label.VerticalAlign.TOP;
                        descLabel.overflow = Label.Overflow.CLAMP;
                        descLabel.node.setPosition(-170, -8, 0);
                        UIBuilder.setSize(descLabel.node, 340, 20);

                        mistakeList.addChild(itemNode);
                    }

                    if (this.mistakeList.length > 4) {
                        const moreNode = UIBuilder.createNode('MoreMistakes', mistakeList);
                        UIBuilder.setPosition(moreNode, 0, -100);
                        const moreLabel = UIBuilder.addLabel(moreNode, `...还有 ${this.mistakeList.length - 4} 个错误`, 12, new Color(158, 158, 158));
                        moreLabel.horizontalAlign = Label.HorizontalAlign.CENTER;
                        moreLabel.verticalAlign = Label.VerticalAlign.CENTER;
                    }
                }
            }
        }
    }

    private showToast(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
        if (!this.toastNode || !this.toastLabel) return;

        const colors: Record<string, Color> = {
            success: new Color(76, 175, 80, 220),
            error: new Color(244, 67, 54, 220),
            info: new Color(0, 0, 0, 180)
        };

        const bgSprite = this.toastNode.getComponent(Sprite);
        if (bgSprite) {
            bgSprite.color = colors[type] || colors.info;
        }

        this.toastLabel.string = message;
        this.toastNode.active = true;
        this.toastNode.setPosition(0, 50, 0);

        const opacity = this.toastNode.getComponent(UIOpacity);
        if (!opacity) {
            UIBuilder.addUIOpacity(this.toastNode, 0);
        }
        const op = this.toastNode.getComponent(UIOpacity)!;
        op.opacity = 0;

        tween(op)
            .to(0.2, { opacity: 255 })
            .delay(1.5)
            .to(0.3, { opacity: 0 })
            .call(() => {
                if (this.toastNode) {
                    this.toastNode.active = false;
                }
            })
            .start();

        tween(this.toastNode)
            .by(0.2, { position: new Vec3(0, 20, 0) })
            .start();
    }

    private onRetryClick(): void {
        const gameManager = GameManager.instance;
        const level = gameManager?.getCurrentLevel();
        if (level && gameManager) {
            gameManager.initLevel(level);
        }

        this.totalScore = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.correctCount = 0;
        this.mistakeList = [];
        this.gameStartTime = Date.now();
        this.isGameEnded = false;
        this.selectedReservationId = null;

        if (this.resultPanel) {
            this.resultPanel.active = false;
        }

        this.refreshReservationList();
        this.updateHUD();
        this.resetDetailPanel();
        this.updateButtonStates(false);

        const pending = gameManager?.getPendingTasks() || [];
        if (pending.length > 0) {
            this.scheduleOnce(() => {
                this.selectReservation(pending[0].id);
            }, 0.2);
        }
    }

    private onBackToLevelsClick(): void {
        if (SceneManager.instance) {
            SceneManager.instance.goToScene(SceneName.LEVEL_SELECT);
        } else {
            const director = require('cc').director;
            director.loadScene('LevelSelect');
        }
    }

    private onBackClick(): void {
        if (SceneManager.instance) {
            SceneManager.instance.goToScene(SceneName.LEVEL_SELECT);
        } else {
            const director = require('cc').director;
            director.loadScene('LevelSelect');
        }
    }
}