import { _decorator, Component, Node, director, game, find, Canvas, UITransform, Widget, Label, Sprite, Color, Button, instantiate, Prefab, SpriteFrame, resources, view, sys, Input, KeyCode, UIOpacity, ScrollView, Layout, ProgressBar, Toggle, Slider, Graphics, Texture2D, ImageAsset, TiledMap, TiledLayer } from 'cc';
import { GameManager } from './core/GameManager';
import { AudioManager, SfxType } from './core/AudioManager';
import { FeedbackManager } from './core/FeedbackManager';
const { ccclass, property } = _decorator;

type SceneName = 'main-menu' | 'game-scene' | 'result-scene' | 'settings-scene' | 'review-scene';

@ccclass('Bootstrap')
export class Bootstrap extends Component {
    @property
    startScene: SceneName = 'main-menu';

    public sceneRegistry: Map<string, () => Node> = new Map();

    onLoad() {
        this.initializeManagers();
        this.setupCanvas();
        this.registerScenes();
        this.startCurrentScene();
    }

    initializeManagers(): void {
        const gm = GameManager.instance;
        const am = AudioManager.instance;
        const fm = FeedbackManager.instance;
        this.node.addChild(gm.node);
        this.node.addChild(am.node);
        this.node.addChild(fm.node);
    }

    setupCanvas(): void {
        const canvas = find('Canvas');
        if (canvas) {
            const ui = canvas.getComponent(UITransform);
            if (ui) ui.setContentSize(1280, 720);
        } else {
            const cv = new Node('Canvas');
            const uit = cv.addComponent(UITransform);
            uit.setContentSize(1280, 720);
            cv.addComponent(Canvas);
            const w = cv.addComponent(Widget);
            w.alignMode = 2;
            w.isAlignLeft = w.isAlignRight = w.isAlignTop = w.isAlignBottom = true;
            w.left = w.right = w.top = w.bottom = 0;
            cv.setPosition(640, 360);
            director.getScene()?.addChild(cv);

            const camNode = new Node('Main Camera');
            const cam = camNode.addComponent(require('cc').Camera);
            cam.projection = 0;
            cam.orthoHeight = 360;
            cam.clearFlags = 6;
            cam.color = new Color(28, 28, 48, 255);
            cam.visibility = 1946157057;
            camNode.addComponent(require('cc').AudioListener);
            camNode.setPosition(0, 0, 1000);
            director.getScene()?.addChild(camNode);
        }
    }

    registerScenes(): void {
        const MainScene = require('./scenes/MainMenuBuilder');
        const GameScene = require('./scenes/GameSceneBuilder');
        const ResultScene = require('./scenes/ResultSceneBuilder');
        const SettingsScene = require('./scenes/SettingsSceneBuilder');
        const ReviewScene = require('./scenes/ReviewSceneBuilder');

        this.sceneRegistry.set('main-menu', () => new MainScene.MainMenuBuilder().build(this));
        this.sceneRegistry.set('game-scene', () => new GameScene.GameSceneBuilder().build(this));
        this.sceneRegistry.set('result-scene', () => new ResultScene.ResultSceneBuilder().build(this));
        this.sceneRegistry.set('settings-scene', () => new SettingsScene.SettingsSceneBuilder().build(this));
        this.sceneRegistry.set('review-scene', () => new ReviewScene.ReviewSceneBuilder().build(this));
    }

    startCurrentScene(): void {
        this.scheduleOnce(() => this.loadScene(this.startScene), 0.05);
    }

    loadScene(name: SceneName): void {
        const builder = this.sceneRegistry.get(name);
        if (!builder) {
            console.error(`场景 ${name} 未注册`);
            return;
        }

        const canvas = find('Canvas');
        if (!canvas) { this.setupCanvas(); return; }

        canvas.removeAllChildren();
        this.scheduleOnce(() => {
            try {
                const sceneNode = builder();
                if (sceneNode) canvas.addChild(sceneNode);
            } catch (e) {
                console.error(`加载场景 ${name} 失败:`, e);
                this.fallbackMainMenu();
            }
        }, 0.02);
    }

    fallbackMainMenu(): void {
        this.loadScene('main-menu');
    }

    createSpriteNode(name: string, w: number, h: number, color: Color): Node {
        const n = new Node(name);
        const ui = n.addComponent(UITransform);
        ui.setContentSize(w, h);
        const s = n.addComponent(Sprite);
        s.color = color;
        s.type = Sprite.Type.SIMPLE;
        s.sizeMode = Sprite.SizeMode.CUSTOM;
        return n;
    }

    createLabel(name: string, text: string, size: number, x: number, y: number, color: Color, w?: number): Label {
        const n = new Node(name);
        const ui = n.addComponent(UITransform);
        ui.setContentSize(w || 400, size + 10);
        n.setPosition(x, y);
        const l = n.addComponent(Label);
        l.string = text;
        l.fontSize = size;
        l.color = color;
        l.lineHeight = size + 10;
        return l;
    }

    createLabelOnParent(parent: Node, name: string, text: string, size: number, x: number, y: number, color: Color, w?: number): Label {
        const l = this.createLabel(name, text, size, x, y, color, w);
        parent.addChild(l.node);
        return l;
    }

    createMenuButton(name: string, text: string, x: number, y: number, color: Color, w: number, cb: () => void, h: number = 50): Node {
        const n = this.createSpriteNode(name, w, h, color);
        n.setPosition(x, y);
        this.createLabelOnParent(n, 'L', text, 18, 0, 0, new Color(255, 255, 255), w);
        const btn = n.addComponent(Button);
        btn.transition = Button.Transition.SCALE;
        btn.zoomScale = 0.95;
        btn.duration = 0.08;
        n.on(Node.EventType.TOUCH_END, cb);
        return n;
    }

    createToggle(parent: Node, id: string, x: number, y: number, val: boolean, onChange: (v: boolean) => void): Node {
        const track = this.createSpriteNode(`T_${id}`, 60, 28, val ? new Color(46, 204, 113) : new Color(120, 120, 140));
        track.setPosition(x + 30, y);
        const thumb = this.createSpriteNode('Th', 22, 22, new Color(255, 255, 255));
        thumb.setPosition(val ? 15 : -15, 0);
        track.addChild(thumb);
        const btn = track.addComponent(Button);
        btn.transition = Button.Transition.NONE;
        track.on(Node.EventType.TOUCH_END, () => {
            onChange(!val);
        });
        parent.addChild(track);
        return track;
    }
}

export const bootstrap = { instance: (null) };
