import { _decorator, Component, Node, UITransform, Sprite, Label, Color, resources, TiledMap, TiledMapAsset, Size, view } from "cc";
import { MainScene } from "../ui/MainScene";

const { ccclass, executionOrder } = _decorator;

@ccclass("GameBoot")
@executionOrder(-1)
export class GameBoot extends Component {
    onLoad(): void {
        this.buildUILayout();
    }

    private buildUILayout(): void {
        const root = this.node;

        this.createInnMap(root);
        this.createHUD(root);
        this.createRoomCalendar(root);
        this.createOrderPanel(root);
        this.createTaskPanel(root);
        this.createLevelSelectPanel(root);
        this.createSettlementPanel(root);
        this.createReviewPanel(root);
        this.createConflictDialog(root);
        this.createSettingsPanel(root);

        root.addComponent(MainScene);
    }

    private createHUD(parent: Node): void {
        const hud = new Node("HUD");
        hud.addComponent(UITransform).setContentSize(1280, 60);
        hud.setPosition(0, 330, 0);

        const bg = hud.addComponent(Sprite);
        bg.color = new Color(30, 30, 40, 230);

        this.createLabel(hud, "day", "第 1/3 天", -500, 0, 20, Color.WHITE);
        this.createLabel(hud, "revenue", "收入: ¥0", -250, 0, 18, Color.GREEN);
        this.createLabel(hud, "penalty", "扣罚: ¥0", 0, 0, 18, Color.RED);
        this.createLabel(hud, "occupancy", "入住率: 0%", 250, 0, 18, Color.YELLOW);

        const pauseBtn = this.createButton(hud, "pauseBtn", "暂停", 500, 0, 80, 36, 14);
        pauseBtn.name = "pauseBtn";

        const settingsBtn = this.createButton(hud, "settingsBtn", "设置", 600, 0, 80, 36, 14);
        settingsBtn.name = "settingsBtn";

        hud.parent = parent;
    }

    private createRoomCalendar(parent: Node): void {
        const calendar = new Node("RoomCalendar");
        const transform = calendar.addComponent(UITransform);
        transform.setContentSize(900, 500);
        calendar.setPosition(-100, -50, 0);

        const bg = calendar.addComponent(Sprite);
        bg.color = new Color(40, 40, 55, 200);

        const titleNode = new Node("title");
        titleNode.addComponent(UITransform).setContentSize(200, 30);
        const titleLabel = titleNode.addComponent(Label);
        titleLabel.fontSize = 18;
        titleLabel.string = "房源日历";
        titleLabel.color = Color.WHITE;
        titleNode.setPosition(-380, 220, 0);
        titleNode.parent = calendar;

        const content = new Node("content");
        content.addComponent(UITransform).setContentSize(880, 440);
        content.setPosition(0, -10, 0);
        content.parent = calendar;

        calendar.parent = parent;
    }

    private createOrderPanel(parent: Node): void {
        const panel = new Node("OrderPanel");
        const transform = panel.addComponent(UITransform);
        transform.setContentSize(220, 500);
        panel.setPosition(540, -50, 0);

        const bg = panel.addComponent(Sprite);
        bg.color = new Color(35, 35, 50, 220);

        const title = new Node("title");
        title.addComponent(UITransform).setContentSize(200, 30);
        const label = title.addComponent(Label);
        label.fontSize = 16;
        label.string = "渠道订单";
        label.color = Color.WHITE;
        title.setPosition(0, 220, 0);
        title.parent = panel;

        const orders = new Node("orders");
        orders.addComponent(UITransform).setContentSize(210, 450);
        orders.setPosition(0, -10, 0);
        orders.parent = panel;

        panel.parent = parent;
    }

    private createTaskPanel(parent: Node): void {
        const panel = new Node("TaskPanel");
        const transform = panel.addComponent(UITransform);
        transform.setContentSize(200, 500);
        panel.setPosition(-540, -50, 0);

        const bg = panel.addComponent(Sprite);
        bg.color = new Color(35, 35, 50, 220);

        const title = new Node("title");
        title.addComponent(UITransform).setContentSize(180, 30);
        const label = title.addComponent(Label);
        label.fontSize = 16;
        label.string = "任务列表";
        label.color = Color.WHITE;
        title.setPosition(0, 220, 0);
        title.parent = panel;

        const taskList = new Node("taskList");
        taskList.addComponent(UITransform).setContentSize(190, 450);
        taskList.setPosition(0, -10, 0);
        taskList.parent = panel;

        panel.parent = parent;
    }

    private createLevelSelectPanel(parent: Node): void {
        const panel = new Node("LevelSelectPanel");
        const transform = panel.addComponent(UITransform);
        transform.setContentSize(800, 500);
        panel.setPosition(0, 0, 0);

        const bg = panel.addComponent(Sprite);
        bg.color = new Color(20, 20, 35, 240);

        const title = new Node("title");
        title.addComponent(UITransform).setContentSize(400, 40);
        const label = title.addComponent(Label);
        label.fontSize = 28;
        label.string = "选择关卡";
        label.color = Color.WHITE;
        title.setPosition(0, 200, 0);
        title.parent = panel;

        const levelList = new Node("levelList");
        levelList.addComponent(UITransform).setContentSize(700, 400);
        levelList.setPosition(0, -20, 0);
        levelList.parent = panel;

        panel.active = false;
        panel.parent = parent;
    }

    private createSettlementPanel(parent: Node): void {
        const panel = new Node("SettlementPanel");
        const transform = panel.addComponent(UITransform);
        transform.setContentSize(500, 400);
        panel.setPosition(0, 0, 0);

        const bg = panel.addComponent(Sprite);
        bg.color = new Color(30, 30, 50, 250);

        const title = new Node("title");
        title.addComponent(UITransform).setContentSize(400, 40);
        const label = title.addComponent(Label);
        label.fontSize = 24;
        label.string = "结算";
        label.color = Color.YELLOW;
        title.setPosition(0, 160, 0);
        title.parent = panel;

        this.createLabel(panel, "revenue", "总收入: ¥0", 0, 100, 20, Color.WHITE);
        this.createLabel(panel, "penalty", "扣罚: ¥0", 0, 60, 20, Color.WHITE);
        this.createLabel(panel, "net", "净收入: ¥0", 0, 20, 22, Color.GREEN);
        this.createLabel(panel, "occupancy", "入住率: 0%", 0, -20, 18, Color.WHITE);
        this.createLabel(panel, "tasks", "任务: 0/0", 0, -50, 16, Color.WHITE);
        this.createLabel(panel, "conflict", "冲突解决率: 0%", 0, -80, 16, Color.WHITE);
        this.createLabel(panel, "time", "用时: 0分0秒", 0, -110, 16, Color.WHITE);
        this.createLabel(panel, "stars", "☆☆☆", 0, -145, 32, Color.YELLOW);

        const nextBtn = this.createButton(panel, "nextBtn", "查看复盘", -100, -175, 120, 36, 14);
        nextBtn.name = "nextBtn";

        const retryBtn = this.createButton(panel, "retryBtn", "重新开始", 100, -175, 120, 36, 14);
        retryBtn.name = "retryBtn";

        panel.active = false;
        panel.parent = parent;
    }

    private createReviewPanel(parent: Node): void {
        const panel = new Node("ReviewPanel");
        const transform = panel.addComponent(UITransform);
        transform.setContentSize(600, 500);
        panel.setPosition(0, 0, 0);

        const bg = panel.addComponent(Sprite);
        bg.color = new Color(25, 25, 40, 250);

        const title = new Node("title");
        title.addComponent(UITransform).setContentSize(400, 40);
        const label = title.addComponent(Label);
        label.fontSize = 24;
        label.string = "经营复盘";
        label.color = Color.WHITE;
        title.setPosition(0, 210, 0);
        title.parent = panel;

        this.createLabel(panel, "occupancy", "入住率: 0%", 0, 170, 18, Color.WHITE);
        this.createLabel(panel, "time", "完成时间: 0分0秒", 0, 140, 16, Color.WHITE);
        this.createLabel(panel, "taskStats", "任务完成率: 0%", 0, 110, 16, Color.WHITE);
        this.createLabel(panel, "conflictStats", "冲突解决率: 0%", 0, 80, 16, Color.WHITE);
        this.createLabel(panel, "revenueStats", "净收入: ¥0", 0, 50, 18, Color.GREEN);

        const bnContainer = new Node("bottlenecks");
        bnContainer.addComponent(UITransform).setContentSize(550, 250);
        bnContainer.setPosition(0, -80, 0);
        bnContainer.parent = panel;

        const backBtn = this.createButton(panel, "backBtn", "返回选关", 0, -210, 120, 36, 14);
        backBtn.name = "backBtn";

        panel.active = false;
        panel.parent = parent;
    }

    private createConflictDialog(parent: Node): void {
        const dialog = new Node("ConflictDialog");
        const transform = dialog.addComponent(UITransform);
        transform.setContentSize(600, 350);
        dialog.setPosition(0, 0, 0);

        const bg = dialog.addComponent(Sprite);
        bg.color = new Color(60, 20, 20, 245);

        const title = new Node("title");
        title.addComponent(UITransform).setContentSize(400, 40);
        const label = title.addComponent(Label);
        label.fontSize = 22;
        label.string = "⚠ 房态冲突";
        label.color = Color.RED;
        title.setPosition(0, 140, 0);
        title.parent = dialog;

        const desc = new Node("description");
        desc.addComponent(UITransform).setContentSize(550, 40);
        const descLabel = desc.addComponent(Label);
        descLabel.fontSize = 16;
        descLabel.string = "";
        descLabel.color = Color.WHITE;
        desc.setPosition(0, 90, 0);
        desc.parent = dialog;

        const timer = new Node("timer");
        timer.addComponent(UITransform).setContentSize(200, 30);
        const timerLabel = timer.addComponent(Label);
        timerLabel.fontSize = 14;
        timerLabel.string = "限时: 30s";
        timerLabel.color = Color.RED;
        timer.setPosition(0, 50, 0);
        timer.parent = dialog;

        const options = new Node("options");
        options.addComponent(UITransform).setContentSize(550, 200);
        options.setPosition(0, -40, 0);
        options.parent = dialog;

        dialog.active = false;
        dialog.parent = parent;
    }

    private createSettingsPanel(parent: Node): void {
        const panel = new Node("SettingsPanel");
        const transform = panel.addComponent(UITransform);
        transform.setContentSize(400, 350);
        panel.setPosition(0, 0, 0);

        const bg = panel.addComponent(Sprite);
        bg.color = new Color(40, 40, 60, 245);

        const title = new Node("title");
        title.addComponent(UITransform).setContentSize(300, 30);
        const label = title.addComponent(Label);
        label.fontSize = 20;
        label.string = "设置";
        label.color = Color.WHITE;
        title.setPosition(0, 140, 0);
        title.parent = panel;

        const soundLabel = this.createLabel(panel, "soundLabel", "音效", -150, 90, 16, Color.WHITE);
        soundLabel.name = "soundLabel";

        const soundToggle = this.createToggle(panel, "soundToggle", 150, 90);
        soundToggle.name = "soundToggle";

        const vibLabel = this.createLabel(panel, "vibrationLabel", "震动", -150, 40, 16, Color.WHITE);
        vibLabel.name = "vibrationLabel";

        const vibToggle = this.createToggle(panel, "vibrationToggle", 150, 40);
        vibToggle.name = "vibrationToggle";

        const animLabel = this.createLabel(panel, "animLabel", "动画强度: 100%", -150, -10, 14, Color.WHITE);
        animLabel.name = "animLabel";

        const slider = this.createSlider(panel, "animSlider", 150, -10, 150);
        slider.name = "animSlider";

        const saveBtn = this.createButton(panel, "saveBtn", "保存", -80, -120, 100, 36, 14);
        saveBtn.name = "saveBtn";

        const cancelBtn = this.createButton(panel, "cancelBtn", "取消", 80, -120, 100, 36, 14);
        cancelBtn.name = "cancelBtn";

        panel.active = false;
        panel.parent = parent;
    }

    private createLabel(parent: Node, name: string, text: string, x: number, y: number, size: number, color: Color): Node {
        const node = new Node(name);
        node.addComponent(UITransform).setContentSize(200, 30);
        const label = node.addComponent(Label);
        label.fontSize = size;
        label.string = text;
        label.color = color;
        label.horizontalAlign = Label.HorizontalAlign.CENTER;
        node.setPosition(x, y, 0);
        node.parent = parent;
        return node;
    }

    private createButton(parent: Node, name: string, text: string, x: number, y: number, w: number, h: number, fontSize: number): Node {
        const node = new Node(name);
        node.addComponent(UITransform).setContentSize(w, h);
        const bg = node.addComponent(Sprite);
        bg.color = new Color(66, 133, 244, 255);

        const labelNode = new Node("label");
        labelNode.addComponent(UITransform).setContentSize(w, h);
        const label = labelNode.addComponent(Label);
        label.fontSize = fontSize;
        label.string = text;
        label.color = Color.WHITE;
        label.horizontalAlign = Label.HorizontalAlign.CENTER;
        label.verticalAlign = Label.VerticalAlign.CENTER;
        labelNode.parent = node;

        node.setPosition(x, y, 0);
        node.parent = parent;
        return node;
    }

    private createToggle(parent: Node, name: string, x: number, y: number): Node {
        const node = new Node(name);
        node.addComponent(UITransform).setContentSize(40, 40);
        const bg = node.addComponent(Sprite);
        bg.color = Color.GREEN;
        node.setPosition(x, y, 0);
        node.parent = parent;
        return node;
    }

    private createSlider(parent: Node, name: string, x: number, y: number, width: number): Node {
        const node = new Node(name);
        node.addComponent(UITransform).setContentSize(width, 20);
        const bg = node.addComponent(Sprite);
        bg.color = new Color(100, 100, 120, 255);
        node.setPosition(x, y, 0);
        node.parent = parent;
        return node;
    }

    private createInnMap(parent: Node): void {
        const mapNode = new Node("InnMap");
        const transform = mapNode.addComponent(UITransform);
        transform.setContentSize(1280, 720);
        mapNode.setPosition(0, 0, 0);

        const mapBg = mapNode.addComponent(Sprite);
        mapBg.color = new Color(25, 25, 35, 255);

        const tiledNode = new Node("TiledMap");
        const tiledTransform = tiledNode.addComponent(UITransform);
        tiledTransform.setContentSize(1280, 768);
        tiledNode.setPosition(0, -20, 0);
        tiledNode.parent = mapNode;

        resources.load("maps/inn_layout", TiledMapAsset, (err, asset) => {
            if (err) {
                console.warn("Failed to load Tiled map:", err);
                return;
            }
            const tiledMap = tiledNode.addComponent(TiledMap);
            tiledMap.tmxAsset = asset;
        });

        mapNode.parent = parent;
    }
}
