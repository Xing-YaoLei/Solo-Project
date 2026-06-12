import {
    _decorator, Component, Node, director, Scene, Label, Sprite, Button, EditBox,
    ScrollView, View, Color, UITransform, Vec3, UIOpacity, ProgressBar, Mask,
    Layout, find, Prefab, instantiate, Widget, Graphics
} from 'cc';
import { GameMain } from '../scenes/GameMain';
import { SupplierPanel } from '../scenes/SupplierPanel';
import { SupplierCard } from '../scenes/SupplierCard';
import { InventoryPanel, InventoryItem } from '../scenes/InventoryPanel';
import { UsageRecordPanel, UsageRecordItem } from '../scenes/UsageRecordPanel';
import { GameTimer } from '../scenes/GameTimer';
import { StoreNode } from '../scenes/StoreNode';
import { EventBanner, EventBannerItem } from '../scenes/EventBanner';
import { ItemBar, ItemSlot } from '../scenes/ItemBar';
import { TutorialSystem } from '../scenes/TutorialSystem';
import { ResultScreen, ObjectiveScoreItem, CardPointItem } from '../scenes/ResultScreen';
import { InventoryCheckDialog, InventoryCheckItem } from '../scenes/InventoryCheckDialog';
import { OrderDialog, OrderItemEditor } from '../scenes/OrderDialog';
import { ToastManager } from './ToastManager';
import { ScreenShake } from './ScreenShake';
import { TopBar } from '../ui/TopBar';
import { ConfigManager, ConfigKeys } from '../core/ConfigManager';
import { Store } from '../models/Store';
import { Supplier } from '../models/Supplier';
import { loadAllConfigs } from '../config/GameConfigs';

export class SceneBuilder {
    public static buildGameScene(scene: Scene): Node {
        if (!ConfigManager.getInstance().isLoaded()) {
            loadAllConfigs();
        }

        const canvas = this.createNode('Canvas', scene, new Vec3(960, 540, 0));
        this.addUITransform(canvas, 1920, 1080);
        this.addCanvasComponent(canvas);

        this.createBackground(canvas);

        const topBar = this.createTopBar(canvas);
        const timerNode = this.createTimer(topBar);
        const storeMap = this.createStoreMap(canvas);
        const supplierPanel = this.createSupplierPanel(canvas);
        const inventoryPanel = this.createInventoryPanel(canvas);
        const usageRecordPanel = this.createUsageRecordPanel(canvas);
        const eventBanner = this.createEventBanner(canvas);
        const itemBar = this.createItemBar(canvas);
        const tutorialLayer = this.createTutorialLayer(canvas);
        const resultScreen = this.createResultScreen(canvas);
        const inventoryCheckDialog = this.createInventoryCheckDialog(canvas);

        this.createOrderDialog(canvas);
        this.createToastManager(canvas);
        this.createScreenShake(canvas);

        this.registerStoreDropTargets(supplierPanel, storeMap);

        const gameMain = canvas.addComponent(GameMain);
        gameMain.topBar = topBar;
        gameMain.timerNode = timerNode;
        gameMain.storeMap = storeMap;
        gameMain.supplierPanel = supplierPanel;
        gameMain.inventoryPanel = inventoryPanel;
        gameMain.usageRecordPanel = usageRecordPanel;
        gameMain.eventBanner = eventBanner;
        gameMain.itemBar = itemBar;
        gameMain.tutorialLayer = tutorialLayer;
        gameMain.resultScreen = resultScreen;
        gameMain.inventoryCheckDialog = inventoryCheckDialog;

        this.bindTopBarActions(topBar, inventoryCheckDialog, gameMain);

        gameMain.manualInit();

        return canvas;
    }

    private static createNode(name: string, parent: Node | Scene, pos: Vec3): Node {
        const node = new Node(name);
        node.setParent(parent instanceof Scene ? null : parent);
        if (parent instanceof Scene) {
            parent.addChild(node);
        }
        node.setPosition(pos);
        return node;
    }

    private static addUITransform(node: Node, width: number, height: number): UITransform {
        const uiTransform = node.addComponent(UITransform);
        uiTransform.setContentSize(width, height);
        uiTransform.setAnchorPoint(0.5, 0.5);
        return uiTransform;
    }

    private static addCanvasComponent(node: Node): void {
        node.addComponent(Widget);
    }

    private static addSprite(node: Node, color: Color, sizeMode: number = 1): Sprite {
        const sprite = node.addComponent(Sprite);
        sprite.sizeMode = sizeMode;
        sprite.color = color;
        sprite.type = Sprite.Type.SIMPLE;
        return sprite;
    }

    private static addLabel(node: Node, text: string, fontSize: number = 24, color: Color = Color.WHITE): Label {
        const label = node.addComponent(Label);
        label.string = text;
        label.fontSize = fontSize;
        label.lineHeight = fontSize;
        label.color = color;
        label.horizontalAlign = Label.HorizontalAlign.CENTER;
        label.verticalAlign = Label.VerticalAlign.CENTER;
        label.isSystemFontUsed = true;
        return label;
    }

    private static addButton(node: Node, normalColor: Color): Button {
        this.addSprite(node, normalColor, 1);
        const btn = node.addComponent(Button);
        btn.transition = Button.Transition.COLOR;
        btn.normalColor = normalColor;
        btn.hoverColor = new Color(
            Math.min(255, normalColor.r + 20),
            Math.min(255, normalColor.g + 20),
            Math.min(255, normalColor.b + 20),
            255
        );
        btn.pressedColor = new Color(
            Math.max(0, normalColor.r - 30),
            Math.max(0, normalColor.g - 30),
            Math.max(0, normalColor.b - 30),
            255
        );
        btn.target = node.getComponent(Sprite);
        return btn;
    }

    private static createBackground(parent: Node): void {
        const bg = this.createNode('Background', parent, new Vec3(0, 0, -10));
        this.addUITransform(bg, 2000, 1200);
        const sprite = this.addSprite(bg, new Color(45, 30, 20, 255), 1);
        sprite.sizeMode = Sprite.SizeMode.CUSTOM;
    }

    private static createTopBar(parent: Node): Node {
        const topBar = this.createNode('TopBar', parent, new Vec3(0, 490, 0));
        this.addUITransform(topBar, 1880, 80);
        this.addSprite(topBar, new Color(30, 20, 15, 230), 1);

        const topBarComp = topBar.addComponent(TopBar);

        const titleLabel = this.createNode('Title', topBar, new Vec3(-800, 0, 0));
        this.addUITransform(titleLabel, 300, 50);
        this.addLabel(titleLabel, '咖啡供应链模拟', 28, new Color(200, 170, 120));

        const capitalNode = this.createNode('CapitalLabel', topBar, new Vec3(-300, 0, 0));
        this.addUITransform(capitalNode, 200, 50);
        this.addLabel(capitalNode, '¥0', 24, new Color(255, 220, 100));
        topBarComp.capitalLabel = capitalNode.getComponent(Label);

        const dayNode = this.createNode('DayLabel', topBar, new Vec3(-100, 0, 0));
        this.addUITransform(dayNode, 200, 50);
        this.addLabel(dayNode, '第 1/15 天', 24, Color.WHITE);
        topBarComp.dayLabel = dayNode.getComponent(Label);

        const pauseBtn = this.createNode('PauseButton', topBar, new Vec3(400, 0, 0));
        this.addUITransform(pauseBtn, 80, 50);
        this.addButton(pauseBtn, new Color(80, 80, 100, 255));
        const pauseLabel = this.createNode('Label', pauseBtn, Vec3.ZERO);
        this.addUITransform(pauseLabel, 80, 40);
        this.addLabel(pauseLabel, '暂停', 20, Color.WHITE);
        topBarComp.pauseBtn = pauseBtn.getComponent(Button);

        const checkBtn = this.createNode('CheckButton', topBar, new Vec3(550, 0, 0));
        this.addUITransform(checkBtn, 120, 50);
        this.addButton(checkBtn, new Color(60, 140, 90, 255));
        const checkLabel = this.createNode('Label', checkBtn, Vec3.ZERO);
        this.addUITransform(checkLabel, 120, 40);
        this.addLabel(checkLabel, '库存盘点', 20, Color.WHITE);
        topBarComp.inventoryCheckBtn = checkBtn.getComponent(Button);

        const quitBtn = this.createNode('QuitButton', topBar, new Vec3(720, 0, 0));
        this.addUITransform(quitBtn, 100, 50);
        this.addButton(quitBtn, new Color(180, 70, 70, 255));
        const quitLabel = this.createNode('Label', quitBtn, Vec3.ZERO);
        this.addUITransform(quitLabel, 100, 40);
        this.addLabel(quitLabel, '结算', 20, Color.WHITE);
        topBarComp.quitBtn = quitBtn.getComponent(Button);

        const pausePanel = this.createNode('PausePanel', topBar, new Vec3(0, -500, 10));
        this.addUITransform(pausePanel, 600, 400);
        this.addSprite(pausePanel, new Color(20, 20, 30, 240), 1);
        topBarComp.pausePanel = pausePanel;
        pausePanel.active = false;

        return topBar;
    }

    private static createTimer(parent: Node): Node {
        const timerNode = this.createNode('Timer', parent, new Vec3(200, 0, 0));
        this.addUITransform(timerNode, 350, 60);
        this.addSprite(timerNode, new Color(50, 40, 30, 180), 1);

        const timerComp = timerNode.addComponent(GameTimer);

        const dayLabel = this.createNode('DayLabel', timerNode, new Vec3(-120, 10, 0));
        this.addUITransform(dayLabel, 150, 24);
        this.addLabel(dayLabel, '第 1/15 天', 18, new Color(200, 170, 120));
        timerComp.dayLabel = dayLabel.getComponent(Label);

        const timeLabel = this.createNode('TimeLabel', timerNode, new Vec3(120, 10, 0));
        this.addUITransform(timeLabel, 100, 24);
        this.addLabel(timeLabel, '08:00', 18, Color.WHITE);
        timerComp.timeLabel = timeLabel.getComponent(Label);

        const capitalLabel = this.createNode('CapitalLabel', timerNode, new Vec3(-80, -15, 0));
        this.addUITransform(capitalLabel, 180, 22);
        this.addLabel(capitalLabel, '资金: ¥0', 16, new Color(255, 220, 100));
        timerComp.capitalLabel = capitalLabel.getComponent(Label);

        const remainingLabel = this.createNode('RemainingLabel', timerNode, new Vec3(100, -15, 0));
        this.addUITransform(remainingLabel, 100, 22);
        this.addLabel(remainingLabel, '剩余 15 天', 16, new Color(150, 200, 150));
        timerComp.remainingLabel = remainingLabel.getComponent(Label);

        const barBg = this.createNode('ProgressBarBg', timerNode, new Vec3(0, 0, 0));
        this.addUITransform(barBg, 280, 4);
        this.addSprite(barBg, new Color(60, 60, 60, 200), 1);

        const bar = this.createNode('ProgressBar', timerNode, new Vec3(-140, 0, 1));
        this.addUITransform(bar, 140, 4);
        this.addSprite(bar, new Color(80, 200, 120, 255), 1);
        bar.getComponent(UITransform)!.setAnchorPoint(0, 0.5);

        const progressBar = timerNode.addComponent(ProgressBar);
        progressBar.barSprite = bar.getComponent(Sprite);
        progressBar.mode = ProgressBar.Mode.FILLED;
        timerComp.dayProgressBar = progressBar;

        const urgency = this.createNode('UrgencyIndicator', timerNode, new Vec3(165, 0, 0));
        this.addUITransform(urgency, 12, 12);
        this.addSprite(urgency, new Color(100, 200, 100), 1);
        urgency.getComponent(Sprite)!.type = Sprite.Type.SIMPLE;
        timerComp.urgencyIndicator = urgency.getComponent(Sprite);

        return timerNode;
    }

    private static createStoreMap(parent: Node): Node {
        const storeMap = this.createNode('StoreMap', parent, new Vec3(0, 0, 0));
        this.addUITransform(storeMap, 1200, 700);
        this.addSprite(storeMap, new Color(35, 25, 18, 150), 1);

        const title = this.createNode('Title', storeMap, new Vec3(0, 320, 0));
        this.addUITransform(title, 400, 30);
        this.addLabel(title, '连锁门店地图', 22, new Color(200, 170, 120));

        const stores = ConfigManager.getInstance().getListConfig<Store>(ConfigKeys.STORES);
        const positions = [
            new Vec3(-400, 150, 0),
            new Vec3(300, 100, 0),
            new Vec3(-150, -150, 0)
        ];

        stores.forEach((store, index) => {
            const pos = positions[index] || new Vec3(0, 0, 0);
            const storeNode = this.createNode(`store_${store.id}`, storeMap, pos);
            this.addUITransform(storeNode, 180, 120);
            this.addSprite(storeNode, new Color(70, 50, 40, 220), 1);

            const comp = storeNode.addComponent(StoreNode);

            const nameNode = this.createNode('NameLabel', storeNode, new Vec3(0, 25, 0));
            this.addUITransform(nameNode, 160, 28);
            this.addLabel(nameNode, store.name, 18, new Color(220, 200, 150));
            comp.nameLabel = nameNode.getComponent(Label);

            const statusNode = this.createNode('StatusLabel', storeNode, new Vec3(0, -5, 0));
            this.addUITransform(statusNode, 100, 22);
            this.addLabel(statusNode, store.isOpen ? '营业中' : '休息中', 14, new Color(100, 200, 100));
            comp.statusLabel = statusNode.getComponent(Label);

            const hintNode = this.createNode('HintLabel', storeNode, new Vec3(0, -35, 0));
            this.addUITransform(hintNode, 160, 20);
            this.addLabel(hintNode, '← 拖供应商到此处下单', 12, new Color(180, 180, 180));

            const highlight = this.createNode('Highlight', storeNode, new Vec3(0, 0, -1));
            this.addUITransform(highlight, 200, 140);
            const hlSprite = this.addSprite(highlight, new Color(255, 220, 100, 100), 1);
            highlight.active = false;
            comp.highlightNode = highlight;

            const alert = this.createNode('AlertIndicator', storeNode, new Vec3(80, 45, 0));
            this.addUITransform(alert, 20, 20);
            this.addSprite(alert, new Color(255, 80, 80, 255), 1);
            alert.active = false;
            comp.alertIndicator = alert.getComponent(Sprite);

            comp.setStoreData(store);
        });

        return storeMap;
    }

    private static createSupplierPanel(parent: Node): Node {
        const panel = this.createNode('SupplierPanel', parent, new Vec3(-820, 0, 0));
        this.addUITransform(panel, 260, 860);
        this.addSprite(panel, new Color(25, 18, 12, 230), 1);

        const comp = panel.addComponent(SupplierPanel);

        const title = this.createNode('Title', panel, new Vec3(0, 400, 0));
        this.addUITransform(title, 240, 40);
        this.addLabel(title, '供应商列表', 22, new Color(200, 170, 120));

        const hint = this.createNode('Hint', panel, new Vec3(0, 370, 0));
        this.addUITransform(hint, 240, 20);
        this.addLabel(hint, '拖拽卡片到门店下单', 13, new Color(180, 180, 180));

        const scrollViewNode = this.createNode('ScrollView', panel, new Vec3(0, -20, 0));
        this.addUITransform(scrollViewNode, 240, 760);
        const scrollView = scrollViewNode.addComponent(ScrollView);
        scrollView.vertical = true;
        scrollView.horizontal = false;
        comp.scrollView = scrollView;

        const viewNode = this.createNode('view', scrollViewNode, Vec3.ZERO);
        this.addUITransform(viewNode, 240, 760);
        viewNode.addComponent(Mask);
        viewNode.addComponent(UIOpacity);
        scrollView.view = viewNode.getComponent('cc.Mask') as any;

        const content = this.createNode('Content', viewNode, new Vec3(0, 380, 0));
        this.addUITransform(content, 240, 800);
        scrollView.content = content.getComponent(UITransform);
        comp.contentNode = content;

        const orderDialog = this.createOrderDialogForPanel(panel);
        comp.orderDialog = orderDialog;

        const suppliers = ConfigManager.getInstance().getListConfig<Supplier>(ConfigKeys.SUPPLIERS);
        const activeSuppliers = suppliers.filter(s => s.isActive);
        const cardGap = 15;
        const cardWidth = 200;
        const cardHeight = 260;

        const uiTransform = content.getComponent(UITransform);
        const totalHeight = activeSuppliers.length * (cardHeight + cardGap) + cardGap;
        uiTransform!.setContentSize(240, Math.max(760, totalHeight));

        activeSuppliers.forEach((supplier, index) => {
            const cardNode = this.createNode(`supplier_${supplier.id}`, content, Vec3.ZERO);
            this.addUITransform(cardNode, cardWidth, cardHeight);
            this.addSprite(cardNode, new Color(55, 40, 30, 255), 1);

            const posY = totalHeight / 2 - cardGap - cardHeight / 2 - index * (cardHeight + cardGap);
            cardNode.setPosition(new Vec3(0, posY - 380, 0));

            const cardComp = cardNode.addComponent(SupplierCard);
            cardComp.dragNode = cardNode;

            const ratingColors: Record<string, Color> = {
                'bronze': new Color(205, 127, 50),
                'silver': new Color(192, 192, 192),
                'gold': new Color(255, 215, 0),
                'platinum': new Color(229, 228, 226)
            };

            const ratingTexts: Record<string, string> = {
                'bronze': '铜牌',
                'silver': '银牌',
                'gold': '金牌',
                'platinum': '铂金'
            };

            const nameNode = this.createNode('NameLabel', cardNode, new Vec3(0, 90, 0));
            this.addUITransform(nameNode, 180, 30);
            this.addLabel(nameNode, supplier.name, 18, new Color(220, 200, 150));
            cardComp.nameLabel = nameNode.getComponent(Label);

            const ratingNode = this.createNode('RatingLabel', cardNode, new Vec3(-60, 55, 0));
            this.addUITransform(ratingNode, 80, 22);
            this.addLabel(ratingNode, ratingTexts[supplier.rating] || supplier.rating, 14, ratingColors[supplier.rating] || Color.WHITE);
            cardComp.ratingLabel = ratingNode.getComponent(Label);

            const reliabNode = this.createNode('ReliabilityLabel', cardNode, new Vec3(60, 55, 0));
            this.addUITransform(reliabNode, 90, 22);
            this.addLabel(reliabNode, `可靠:${supplier.reliabilityScore}%`, 12, new Color(150, 200, 150));
            cardComp.reliabilityLabel = reliabNode.getComponent(Label);

            const descNode = this.createNode('DescLabel', cardNode, new Vec3(0, 10, 0));
            this.addUITransform(descNode, 180, 40);
            this.addLabel(descNode, supplier.description, 12, new Color(180, 180, 180));

            const itemsNode = this.createNode('ItemsLabel', cardNode, new Vec3(0, -40, 0));
            this.addUITransform(itemsNode, 180, 60);
            const itemNames = supplier.items.slice(0, 3).map(i => {
                const ing = ConfigManager.getInstance().findById<any>('ingredients', i.ingredientId);
                return ing ? ing.name : i.ingredientId;
            });
            this.addLabel(itemsNode, `主营:\n${itemNames.join('、')}`, 11, new Color(160, 160, 200));

            const deliveryNode = this.createNode('DeliveryLabel', cardNode, new Vec3(0, -95, 0));
            this.addUITransform(deliveryNode, 180, 22);
            this.addLabel(deliveryNode, `运费¥${supplier.deliveryFee} 满¥${supplier.freeDeliveryThreshold}免邮`, 11, new Color(200, 180, 140));

            cardComp.setSupplierData(supplier);
        });

        return panel;
    }

    private static createOrderDialogForPanel(parent: Node): Node {
        const dialog = this.createNode('OrderDialog', parent, new Vec3(150, 0, 100));
        this.addUITransform(dialog, 500, 700);
        this.addSprite(dialog, new Color(30, 22, 15, 245), 1);
        dialog.active = false;

        const comp = dialog.addComponent(OrderDialog);

        const modal = this.createNode('Modal', dialog, new Vec3(0, 0, -1));
        this.addUITransform(modal, 2000, 1200);
        this.addSprite(modal, new Color(0, 0, 0, 150), 1);
        modal.active = false;
        comp.modal = modal;

        const titleNode = this.createNode('SupplierNameLabel', dialog, new Vec3(0, 310, 0));
        this.addUITransform(titleNode, 400, 36);
        this.addLabel(titleNode, '创建采购订单', 24, new Color(220, 200, 150));
        comp.supplierNameLabel = titleNode.getComponent(Label);

        const deliveryNode = this.createNode('DeliveryInfoLabel', dialog, new Vec3(0, 275, 0));
        this.addUITransform(deliveryNode, 450, 22);
        this.addLabel(deliveryNode, '', 14, new Color(180, 180, 180));
        comp.deliveryInfoLabel = deliveryNode.getComponent(Label);

        const itemsScrollView = this.createNode('ItemsScrollView', dialog, new Vec3(0, 40, 0));
        this.addUITransform(itemsScrollView, 460, 380);
        const scrollView = itemsScrollView.addComponent(ScrollView);
        scrollView.vertical = true;

        const itemsView = this.createNode('view', itemsScrollView, Vec3.ZERO);
        this.addUITransform(itemsView, 460, 380);
        itemsView.addComponent(Mask);
        scrollView.view = itemsView.getComponent('cc.Mask') as any;

        const itemsContent = this.createNode('ItemsContainer', itemsView, new Vec3(0, 190, 0));
        this.addUITransform(itemsContent, 460, 400);
        scrollView.content = itemsContent.getComponent(UITransform);
        comp.itemsContainer = itemsContent;

        const subtotalNode = this.createNode('SubtotalLabel', dialog, new Vec3(-130, -180, 0));
        this.addUITransform(subtotalNode, 200, 26);
        this.addLabel(subtotalNode, '小计: ¥0', 18, Color.WHITE);
        comp.subtotalLabel = subtotalNode.getComponent(Label);

        const deliveryFeeNode = this.createNode('DeliveryFeeLabel', dialog, new Vec3(-130, -215, 0));
        this.addUITransform(deliveryFeeNode, 200, 26);
        this.addLabel(deliveryFeeNode, '运费: ¥0', 16, new Color(200, 200, 200));
        comp.deliveryFeeLabel = deliveryFeeNode.getComponent(Label);

        const totalNode = this.createNode('TotalLabel', dialog, new Vec3(130, -195, 0));
        this.addUITransform(totalNode, 200, 32);
        this.addLabel(totalNode, '总计: ¥0', 24, new Color(255, 220, 100));
        comp.totalLabel = totalNode.getComponent(Label);

        const capitalNode = this.createNode('CapitalLabel', dialog, new Vec3(0, -250, 0));
        this.addUITransform(capitalNode, 400, 22);
        this.addLabel(capitalNode, '', 14, new Color(180, 180, 180));
        comp.capitalLabel = capitalNode.getComponent(Label);

        const confirmBtn = this.createNode('ConfirmButton', dialog, new Vec3(-120, -300, 0));
        this.addUITransform(confirmBtn, 160, 50);
        this.addButton(confirmBtn, new Color(60, 150, 80, 255));
        const confirmLabel = this.createNode('Label', confirmBtn, Vec3.ZERO);
        this.addUITransform(confirmLabel, 160, 40);
        this.addLabel(confirmLabel, '确认下单', 20, Color.WHITE);
        comp.confirmBtn = confirmBtn.getComponent(Button);

        const cancelBtn = this.createNode('CancelButton', dialog, new Vec3(120, -300, 0));
        this.addUITransform(cancelBtn, 160, 50);
        this.addButton(cancelBtn, new Color(150, 80, 80, 255));
        const cancelLabel = this.createNode('Label', cancelBtn, Vec3.ZERO);
        this.addUITransform(cancelLabel, 160, 40);
        this.addLabel(cancelLabel, '取消', 20, Color.WHITE);
        comp.cancelBtn = cancelBtn.getComponent(Button);

        dialog.on('setup_order', (data: any) => {
            comp.onSetupOrder(data);
        }, comp);

        return dialog;
    }

    private static createInventoryPanel(parent: Node): Node {
        const panel = this.createNode('InventoryPanel', parent, new Vec3(820, 200, 0));
        this.addUITransform(panel, 260, 440);
        this.addSprite(panel, new Color(25, 18, 12, 230), 1);

        const comp = panel.addComponent(InventoryPanel);

        const title = this.createNode('TitleLabel', panel, new Vec3(0, 195, 0));
        this.addUITransform(title, 240, 32);
        this.addLabel(title, '库存状态', 22, new Color(200, 170, 120));

        const storeName = this.createNode('StoreNameLabel', panel, new Vec3(0, 165, 0));
        this.addUITransform(storeName, 240, 20);
        this.addLabel(storeName, '主店', 14, new Color(180, 180, 180));
        comp.storeNameLabel = storeName.getComponent(Label);

        const scrollViewNode = this.createNode('ScrollView', panel, new Vec3(0, -30, 0));
        this.addUITransform(scrollViewNode, 240, 370);
        const scrollView = scrollViewNode.addComponent(ScrollView);
        scrollView.vertical = true;
        comp.scrollView = scrollView;

        const viewNode = this.createNode('view', scrollViewNode, Vec3.ZERO);
        this.addUITransform(viewNode, 240, 370);
        viewNode.addComponent(Mask);
        scrollView.view = viewNode.getComponent('cc.Mask') as any;

        const content = this.createNode('Content', viewNode, new Vec3(0, 185, 0));
        this.addUITransform(content, 240, 400);
        scrollView.content = content.getComponent(UITransform);
        comp.contentNode = content;

        return panel;
    }

    private static createUsageRecordPanel(parent: Node): Node {
        const panel = this.createNode('UsageRecordPanel', parent, new Vec3(820, -240, 0));
        this.addUITransform(panel, 260, 380);
        this.addSprite(panel, new Color(25, 18, 12, 230), 1);

        const comp = panel.addComponent(UsageRecordPanel);

        const title = this.createNode('TitleLabel', panel, new Vec3(0, 165, 0));
        this.addUITransform(title, 240, 32);
        this.addLabel(title, '领用记录', 22, new Color(200, 170, 120));

        const scrollViewNode = this.createNode('ScrollView', panel, new Vec3(0, -30, 0));
        this.addUITransform(scrollViewNode, 240, 320);
        const scrollView = scrollViewNode.addComponent(ScrollView);
        scrollView.vertical = true;
        comp.scrollView = scrollView;

        const viewNode = this.createNode('view', scrollViewNode, Vec3.ZERO);
        this.addUITransform(viewNode, 240, 320);
        viewNode.addComponent(Mask);
        scrollView.view = viewNode.getComponent('cc.Mask') as any;

        const content = this.createNode('Content', viewNode, new Vec3(0, 160, 0));
        this.addUITransform(content, 240, 340);
        scrollView.content = content.getComponent(UITransform);
        comp.contentNode = content;

        return panel;
    }

    private static createEventBanner(parent: Node): Node {
        const banner = this.createNode('EventBanner', parent, new Vec3(0, 420, 0));
        this.addUITransform(banner, 600, 80);
        this.addSprite(banner, new Color(40, 25, 20, 200), 1);

        const comp = banner.addComponent(EventBanner);

        const title = this.createNode('TitleLabel', banner, new Vec3(-250, 0, 0));
        this.addUITransform(title, 80, 30);
        this.addLabel(title, '事件', 16, new Color(255, 180, 80));

        const emptyHint = this.createNode('EmptyHint', banner, new Vec3(50, 0, 0));
        this.addUITransform(emptyHint, 300, 30);
        this.addLabel(emptyHint, '暂无突发事件', 14, new Color(150, 150, 150));
        comp.emptyHint = emptyHint;

        const container = this.createNode('Container', banner, new Vec3(50, 0, 0));
        this.addUITransform(container, 450, 80);
        comp.container = container;

        return banner;
    }

    private static createItemBar(parent: Node): Node {
        const bar = this.createNode('ItemBar', parent, new Vec3(0, -470, 0));
        this.addUITransform(bar, 800, 90);
        this.addSprite(bar, new Color(30, 22, 15, 220), 1);

        const comp = bar.addComponent(ItemBar);

        const title = this.createNode('TitleLabel', bar, new Vec3(-350, 0, 0));
        this.addUITransform(title, 80, 30);
        this.addLabel(title, '道具', 18, new Color(200, 170, 120));

        const slotsContainer = this.createNode('SlotsContainer', bar, new Vec3(50, 0, 0));
        this.addUITransform(slotsContainer, 650, 80);
        comp.slotsContainer = slotsContainer;

        const items = ConfigManager.getInstance().getListConfig(ConfigKeys.ITEMS);
        const gap = 15;
        const slotSize = 70;
        const colors = [
            new Color(80, 100, 150),
            new Color(150, 100, 80),
            new Color(100, 150, 100),
            new Color(150, 80, 130),
            new Color(100, 130, 130),
            new Color(130, 130, 80)
        ];

        items.forEach((item: any, index: number) => {
            const slotNode = this.createNode(`Slot_${item.id}`, slotsContainer, Vec3.ZERO);
            this.addUITransform(slotNode, slotSize, slotSize);
            this.addSprite(slotNode, colors[index % colors.length], 1);

            const posX = index * (slotSize + gap) + slotSize / 2;
            slotNode.setPosition(new Vec3(posX - 325, 0, 0));

            const slotComp = slotNode.addComponent(ItemSlot);

            const nameNode = this.createNode('NameLabel', slotNode, new Vec3(0, 20, 0));
            this.addUITransform(nameNode, 66, 18);
            this.addLabel(nameNode, item.name, 10, new Color(255, 255, 255));
            slotComp.nameLabel = nameNode.getComponent(Label);

            const countNode = this.createNode('CountLabel', slotNode, new Vec3(18, -20, 0));
            this.addUITransform(countNode, 40, 18);
            this.addLabel(countNode, 'x1', 14, new Color(255, 220, 100));
            slotComp.countLabel = countNode.getComponent(Label);

            slotComp.setData(item);
        });

        return bar;
    }

    private static createTutorialLayer(parent: Node): Node {
        const layer = this.createNode('TutorialLayer', parent, new Vec3(0, 0, 50));
        this.addUITransform(layer, 1920, 1080);
        layer.active = false;

        const comp = layer.addComponent(TutorialSystem);

        const overlay = this.createNode('Overlay', layer, Vec3.ZERO);
        this.addUITransform(overlay, 1920, 1080);
        this.addSprite(overlay, new Color(0, 0, 0, 150), 1);
        overlay.addComponent(UIOpacity);
        comp.overlay = overlay;

        const highlightMask = this.createNode('HighlightMask', layer, new Vec3(0, 0, 5));
        this.addUITransform(highlightMask, 200, 100);
        this.addSprite(highlightMask, new Color(255, 255, 255, 0), 1);
        highlightMask.active = false;
        comp.highlightMask = highlightMask;

        const dialogBox = this.createNode('DialogBox', layer, new Vec3(0, -200, 10));
        this.addUITransform(dialogBox, 700, 200);
        this.addSprite(dialogBox, new Color(35, 25, 18, 245), 1);
        comp.dialogBox = dialogBox;

        const titleNode = this.createNode('TitleLabel', dialogBox, new Vec3(0, 65, 0));
        this.addUITransform(titleNode, 600, 36);
        this.addLabel(titleNode, '', 26, new Color(220, 200, 150));
        comp.titleLabel = titleNode.getComponent(Label);

        const contentNode = this.createNode('ContentLabel', dialogBox, new Vec3(0, 0, 0));
        this.addUITransform(contentNode, 640, 100);
        const contentLabel = this.addLabel(contentNode, '', 18, Color.WHITE);
        contentLabel.enableWrapText = true;
        comp.contentLabel = contentLabel;

        const skipBtn = this.createNode('SkipButton', dialogBox, new Vec3(-270, -70, 0));
        this.addUITransform(skipBtn, 100, 40);
        this.addButton(skipBtn, new Color(100, 100, 100, 200));
        const skipLabel = this.createNode('Label', skipBtn, Vec3.ZERO);
        this.addUITransform(skipLabel, 100, 32);
        this.addLabel(skipLabel, '跳过', 14, Color.WHITE);
        comp.skipBtn = skipBtn.getComponent(Button);

        const prevBtn = this.createNode('PrevButton', dialogBox, new Vec3(100, -70, 0));
        this.addUITransform(prevBtn, 100, 40);
        this.addButton(prevBtn, new Color(80, 100, 130, 200));
        const prevLabel = this.createNode('Label', prevBtn, Vec3.ZERO);
        this.addUITransform(prevLabel, 100, 32);
        this.addLabel(prevLabel, '上一步', 14, Color.WHITE);
        comp.prevBtn = prevBtn.getComponent(Button);

        const nextBtn = this.createNode('NextButton', dialogBox, new Vec3(270, -70, 0));
        this.addUITransform(nextBtn, 120, 40);
        this.addButton(nextBtn, new Color(60, 150, 90, 255));
        const nextLabel = this.createNode('Label', nextBtn, Vec3.ZERO);
        this.addUITransform(nextLabel, 120, 32);
        this.addLabel(nextLabel, '下一步', 16, Color.WHITE);
        comp.nextBtn = nextBtn.getComponent(Button);

        return layer;
    }

    private static createResultScreen(parent: Node): Node {
        const screen = this.createNode('ResultScreen', parent, new Vec3(0, 0, 80));
        this.addUITransform(screen, 1920, 1080);
        this.addSprite(screen, new Color(0, 0, 0, 200), 1);
        screen.active = false;

        const comp = screen.addComponent(ResultScreen);

        const modal = this.createNode('Modal', screen, new Vec3(0, 0, -1));
        this.addUITransform(modal, 1920, 1080);
        this.addSprite(modal, new Color(0, 0, 0, 100), 1);
        comp.modal = modal;

        const panel = this.createNode('ResultPanel', screen, Vec3.ZERO);
        this.addUITransform(panel, 1000, 800);
        this.addSprite(panel, new Color(30, 22, 15, 245), 1);

        const resultTitle = this.createNode('ResultTitle', panel, new Vec3(0, 340, 0));
        this.addUITransform(resultTitle, 600, 50);
        this.addLabel(resultTitle, '关卡结算', 36, new Color(255, 220, 100));
        comp.resultTitle = resultTitle.getComponent(Label);

        const levelName = this.createNode('LevelNameLabel', panel, new Vec3(0, 295, 0));
        this.addUITransform(levelName, 400, 28);
        this.addLabel(levelName, '', 22, new Color(200, 200, 200));
        comp.levelNameLabel = levelName.getComponent(Label);

        const totalScore = this.createNode('TotalScoreLabel', panel, new Vec3(0, 240, 0));
        this.addUITransform(totalScore, 400, 48);
        this.addLabel(totalScore, '', 40, new Color(255, 220, 100));
        comp.totalScoreLabel = totalScore.getComponent(Label);

        const completionTime = this.createNode('CompletionTimeLabel', panel, new Vec3(-350, 170, 0));
        this.addUITransform(completionTime, 280, 26);
        this.addLabel(completionTime, '完成时间: 0分0秒', 18, Color.WHITE);
        comp.completionTimeLabel = completionTime.getComponent(Label);

        const turnover = this.createNode('TurnoverLabel', panel, new Vec3(0, 170, 0));
        this.addUITransform(turnover, 280, 26);
        this.addLabel(turnover, '周转天数: 0天', 18, Color.WHITE);
        comp.turnoverLabel = turnover.getComponent(Label);

        const totalCost = this.createNode('TotalCostLabel', panel, new Vec3(350, 170, 0));
        this.addUITransform(totalCost, 280, 26);
        this.addLabel(totalCost, '总成本: ¥0', 18, Color.WHITE);
        comp.totalCostLabel = totalCost.getComponent(Label);

        const accuracy = this.createNode('AccuracyLabel', panel, new Vec3(-250, 135, 0));
        this.addUITransform(accuracy, 280, 26);
        this.addLabel(accuracy, '盘点准确率: 0%', 18, Color.WHITE);
        comp.accuracyLabel = accuracy.getComponent(Label);

        const shortage = this.createNode('ShortageLabel', panel, new Vec3(250, 135, 0));
        this.addUITransform(shortage, 280, 26);
        this.addLabel(shortage, '缺货次数: 0', 18, Color.WHITE);
        comp.shortageLabel = shortage.getComponent(Label);

        const objTitle = this.createNode('ObjectivesTitle', panel, new Vec3(-350, 80, 0));
        this.addUITransform(objTitle, 200, 28);
        this.addLabel(objTitle, '目标完成度', 20, new Color(200, 170, 120));

        const objectivesContainer = this.createNode('ObjectivesContainer', panel, new Vec3(-200, -50, 0));
        this.addUITransform(objectivesContainer, 500, 240);
        comp.objectivesContainer = objectivesContainer;

        const cardTitle = this.createNode('CardPointsTitle', panel, new Vec3(250, 80, 0));
        this.addUITransform(cardTitle, 200, 28);
        this.addLabel(cardTitle, '玩家行为记录', 20, new Color(200, 170, 120));

        const cardPointsScroll = this.createNode('CardPointsScroll', panel, new Vec3(250, -50, 0));
        this.addUITransform(cardPointsScroll, 400, 240);
        const cardScrollView = cardPointsScroll.addComponent(ScrollView);
        cardScrollView.vertical = true;
        comp.cardPointsScroll = cardScrollView;

        const cardView = this.createNode('view', cardPointsScroll, Vec3.ZERO);
        this.addUITransform(cardView, 400, 240);
        cardView.addComponent(Mask);
        cardScrollView.view = cardView.getComponent('cc.Mask') as any;

        const cardContent = this.createNode('CardPointsContainer', cardView, new Vec3(0, 120, 0));
        this.addUITransform(cardContent, 400, 260);
        cardScrollView.content = cardContent.getComponent(UITransform);
        comp.cardPointsContainer = cardContent;

        const continueBtn = this.createNode('ContinueButton', panel, new Vec3(-250, -340, 0));
        this.addUITransform(continueBtn, 180, 50);
        this.addButton(continueBtn, new Color(60, 150, 90, 255));
        const continueLabel = this.createNode('Label', continueBtn, Vec3.ZERO);
        this.addUITransform(continueLabel, 180, 40);
        this.addLabel(continueLabel, '下一关', 20, Color.WHITE);
        comp.continueBtn = continueBtn.getComponent(Button);

        const retryBtn = this.createNode('RetryButton', panel, new Vec3(0, -340, 0));
        this.addUITransform(retryBtn, 180, 50);
        this.addButton(retryBtn, new Color(80, 120, 170, 255));
        const retryLabel = this.createNode('Label', retryBtn, Vec3.ZERO);
        this.addUITransform(retryLabel, 180, 40);
        this.addLabel(retryLabel, '重新挑战', 20, Color.WHITE);
        comp.retryBtn = retryBtn.getComponent(Button);

        const backBtn = this.createNode('BackButton', panel, new Vec3(250, -340, 0));
        this.addUITransform(backBtn, 180, 50);
        this.addButton(backBtn, new Color(150, 100, 100, 255));
        const backLabel = this.createNode('Label', backBtn, Vec3.ZERO);
        this.addUITransform(backLabel, 180, 40);
        this.addLabel(backLabel, '返回主菜单', 20, Color.WHITE);
        comp.backBtn = backBtn.getComponent(Button);

        comp.node.on('setup_result', (result: any) => {
            comp.onGameEnd(result);
        }, comp);

        return screen;
    }

    private static createInventoryCheckDialog(parent: Node): Node {
        const dialog = this.createNode('InventoryCheckDialog', parent, new Vec3(0, 0, 70));
        this.addUITransform(dialog, 700, 750);
        this.addSprite(dialog, new Color(30, 22, 15, 245), 1);
        dialog.active = false;

        const comp = dialog.addComponent(InventoryCheckDialog);

        const modal = this.createNode('Modal', dialog, new Vec3(0, 0, -1));
        this.addUITransform(modal, 1920, 1080);
        this.addSprite(modal, new Color(0, 0, 0, 120), 1);
        comp.modal = modal;

        const title = this.createNode('Title', dialog, new Vec3(0, 330, 0));
        this.addUITransform(title, 400, 36);
        this.addLabel(title, '库存盘点', 28, new Color(220, 200, 150));

        const summary = this.createNode('SummaryLabel', dialog, new Vec3(-180, 295, 0));
        this.addUITransform(summary, 300, 24);
        this.addLabel(summary, '', 16, Color.WHITE);
        comp.summaryLabel = summary.getComponent(Label);

        const accuracy = this.createNode('AccuracyLabel', dialog, new Vec3(180, 295, 0));
        this.addUITransform(accuracy, 200, 24);
        this.addLabel(accuracy, '', 16, new Color(100, 200, 100));
        comp.accuracyLabel = accuracy.getComponent(Label);

        const scrollViewNode = this.createNode('ScrollView', dialog, new Vec3(0, 50, 0));
        this.addUITransform(scrollViewNode, 660, 480);
        const scrollView = scrollViewNode.addComponent(ScrollView);
        scrollView.vertical = true;
        comp.scrollView = scrollView;

        const viewNode = this.createNode('view', scrollViewNode, Vec3.ZERO);
        this.addUITransform(viewNode, 660, 480);
        viewNode.addComponent(Mask);
        scrollView.view = viewNode.getComponent('cc.Mask') as any;

        const content = this.createNode('ItemsContainer', viewNode, new Vec3(0, 240, 0));
        this.addUITransform(content, 660, 500);
        scrollView.content = content.getComponent(UITransform);
        comp.itemsContainer = content;

        const confirmBtn = this.createNode('ConfirmButton', dialog, new Vec3(-150, -310, 0));
        this.addUITransform(confirmBtn, 200, 50);
        this.addButton(confirmBtn, new Color(60, 150, 90, 255));
        const confirmLabel = this.createNode('Label', confirmBtn, Vec3.ZERO);
        this.addUITransform(confirmLabel, 200, 40);
        this.addLabel(confirmLabel, '确认盘点', 20, Color.WHITE);
        comp.confirmBtn = confirmBtn.getComponent(Button);

        const cancelBtn = this.createNode('CancelButton', dialog, new Vec3(150, -310, 0));
        this.addUITransform(cancelBtn, 200, 50);
        this.addButton(cancelBtn, new Color(150, 80, 80, 255));
        const cancelLabel = this.createNode('Label', cancelBtn, Vec3.ZERO);
        this.addUITransform(cancelLabel, 200, 40);
        this.addLabel(cancelLabel, '取消', 20, Color.WHITE);
 comp.cancelBtn = cancelBtn.getComponent(Button);

        dialog.on('show', (storeId: string) => {
            comp.show(storeId);
        }, comp);

        return dialog;
    }

    private static createOrderDialog(parent: Node): Node {
        return this.createNode('OrderDialogHolder', parent, Vec3.ZERO);
    }

    private static createToastManager(parent: Node): void {
        const tm = this.createNode('ToastManager', parent, new Vec3(0, 300, 200));
        this.addUITransform(tm, 800, 400);
        const comp = tm.addComponent(ToastManager);

        const container = this.createNode('Container', tm, Vec3.ZERO);
        this.addUITransform(container, 800, 400);
        comp.container = container;

        const template = this.createNode('ToastTemplate', tm, new Vec3(-1000, 0, 0));
        this.addUITransform(template, 400, 50);
        this.addSprite(template, new Color(40, 40, 50, 230), 1);
        const templateLabel = this.createNode('Label', template, Vec3.ZERO);
        this.addUITransform(templateLabel, 380, 40);
        this.addLabel(templateLabel, '', 18, Color.WHITE);
        template.active = false;
        comp.toastTemplate = template;
    }

    private static createScreenShake(parent: Node): void {
        const ss = this.createNode('ScreenShake', parent, Vec3.ZERO);
        this.addUITransform(ss, 10, 10);
        const comp = ss.addComponent(ScreenShake);
        comp.targetNode = parent;
    }

    private static bindTopBarActions(topBar: Node, inventoryCheckDialog: Node, gameMain: GameMain): void {
        const comp = topBar.getComponent(TopBar);
        if (!comp) return;

        comp.inventoryCheckDialog = inventoryCheckDialog;

        const resumePanel = topBar.getChildByName('PausePanel');
        if (resumePanel) {
            comp.pausePanel = resumePanel;

            const resumeBtnNode = this.createNode('ResumeButton', resumePanel, new Vec3(0, 50, 0));
            this.addUITransform(resumeBtnNode, 200, 60);
            this.addButton(resumeBtnNode, new Color(60, 150, 90, 255));
            const resumeLabel = this.createNode('Label', resumeBtnNode, Vec3.ZERO);
            this.addUITransform(resumeLabel, 200, 48);
            this.addLabel(resumeLabel, '继续游戏', 22, Color.WHITE);
            comp.resumeBtn = resumeBtnNode.getComponent(Button);

            resumePanel.on(Node.EventType.TOUCH_END, () => {}, resumePanel);
        }
    }

    private static registerStoreDropTargets(supplierPanel: Node, storeMap: Node): void {
        const comp = supplierPanel.getComponent(SupplierPanel);
        if (!comp) return;

        storeMap.children.forEach((child: Node) => {
            if (child.name.startsWith('store_')) {
                const storeId = child.name.replace('store_', '');
                comp.registerDropTarget(storeId, child);
            }
        });
    }
}

export default SceneBuilder;
