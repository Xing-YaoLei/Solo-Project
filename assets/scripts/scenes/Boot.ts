import { _decorator, Component, director, game as ccGame, sys, find, Node, UITransform, Layers, Label, Color, Sprite } from 'cc';
import { game } from '../Game';
import { Logger } from '../core/Logger';
import { SaveManager } from '../core/SaveManager';
const { ccclass, property } = _decorator;

@ccclass('Boot')
export class Boot extends Component {
    @property
    firstScene: string = 'Main';

    async start() {
        Logger.info('========================================');
        Logger.info('  物业园区报修工单经营模拟游戏 启动中...');
        Logger.info('========================================');

        try {
            ccGame.frameRate = 60;

            const saveManager = SaveManager.getInstance();
            saveManager.loadFromStorage();

            await game.initialize();

            Logger.info('✅ 游戏核心系统初始化完成');

            this.showLoadingProgress(100);

            this.scheduleOnce(() => {
                director.loadScene(this.firstScene, () => {
                    Logger.info(`✅ 已加载场景: ${this.firstScene}`);
                    Logger.info('========================================');
                });
            }, 0.5);

        } catch (error) {
            Logger.error('❌ 游戏初始化失败:', error);
            this.showErrorScreen(error);
        }
    }

    private showLoadingProgress(progress: number) {
        const canvas = find('Canvas');
        if (!canvas) return;

        const existing = canvas.getChildByName('LoadingScreen');
        if (!existing) {
            const loadingScreen = new Node('LoadingScreen');
            loadingScreen.layer = Layers.Enum.UI_2D;
            const ui = loadingScreen.addComponent(UITransform);
            const canvasUi = canvas.getComponent(UITransform);
            if (canvasUi) ui.setContentSize(canvasUi.contentSize);

            const bg = loadingScreen.addComponent(Sprite);
            bg.color = new Color(240, 245, 255);

            const titleNode = new Node('Title');
            titleNode.layer = Layers.Enum.UI_2D;
            const tUi = titleNode.addComponent(UITransform);
            tUi.setContentSize(600, 60);
            const tLbl = titleNode.addComponent(Label);
            tLbl.string = '🏢 物业园区报修中心';
            tLbl.fontSize = 36;
            tLbl.color = new Color(40, 80, 160);
            titleNode.setPosition(0, 50, 0);
            loadingScreen.addChild(titleNode);

            const subNode = new Node('Subtitle');
            subNode.layer = Layers.Enum.UI_2D;
            const sUi = subNode.addComponent(UITransform);
            sUi.setContentSize(400, 30);
            const sLbl = subNode.addComponent(Label);
            sLbl.string = '正在加载游戏资源...';
            sLbl.fontSize = 18;
            sLbl.color = new Color(100, 120, 180);
            subNode.setPosition(0, 0, 0);
            loadingScreen.addChild(subNode);

            const progNode = new Node('Progress');
            progNode.layer = Layers.Enum.UI_2D;
            const pUi = progNode.addComponent(UITransform);
            pUi.setContentSize(300, 30);
            const pLbl = progNode.addComponent(Label);
            pLbl.string = `${progress}%`;
            pLbl.fontSize = 16;
            pLbl.color = new Color(80, 150, 220);
            progNode.setPosition(0, -60, 0);
            loadingScreen.addChild(progNode);

            canvas.addChild(loadingScreen);
        } else {
            const progLbl = existing.getChildByName('Progress')?.getComponent(Label);
            if (progLbl) progLbl.string = `${progress}%`;
        }
    }

    private showErrorScreen(error: any) {
        const canvas = find('Canvas');
        if (!canvas) return;

        const errorScreen = new Node('ErrorScreen');
        errorScreen.layer = Layers.Enum.UI_2D;
        const ui = errorScreen.addComponent(UITransform);
        const canvasUi = canvas.getComponent(UITransform);
        if (canvasUi) ui.setContentSize(canvasUi.contentSize);

        const bg = errorScreen.addComponent(Sprite);
        bg.color = new Color(255, 240, 240);

        const titleNode = new Node('Title');
        titleNode.layer = Layers.Enum.UI_2D;
        const tUi = titleNode.addComponent(UITransform);
        tUi.setContentSize(600, 50);
        const tLbl = titleNode.addComponent(Label);
        tLbl.string = '❌ 游戏启动失败';
        tLbl.fontSize = 32;
        tLbl.color = new Color(200, 60, 60);
        titleNode.setPosition(0, 50, 0);
        errorScreen.addChild(titleNode);

        const msgNode = new Node('Message');
        msgNode.layer = Layers.Enum.UI_2D;
        const mUi = msgNode.addComponent(UITransform);
        mUi.setContentSize(500, 100);
        const mLbl = msgNode.addComponent(Label);
        mLbl.string = `错误信息: ${error?.message || error || '未知错误'}\n\n请刷新页面重试或联系开发者。`;
        mLbl.fontSize = 16;
        mLbl.color = new Color(80, 80, 80);
        mLbl.lineHeight = 24;
        msgNode.setPosition(0, -50, 0);
        errorScreen.addChild(msgNode);

        canvas.addChild(errorScreen);
    }
}
