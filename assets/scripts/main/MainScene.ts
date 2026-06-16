import { _decorator, Component, Node, find, instantiate, Prefab, director, resources } from 'cc';
import { GameManager } from '../core/GameManager';
import { GameBootstrap } from './GameBootstrap';
import { UIController } from '../ui/UIController';
import { HUDController } from '../ui/HUDController';
import { TutorialController } from '../ui/TutorialController';
import { SceneController } from '../scene/SceneController';
import { TestRunner } from '../tests/TestRunner';

const { ccclass, property } = _decorator;

@ccclass('MainScene')
export class MainScene extends Component {

    @property(Prefab)
    gameManagerPrefab: Prefab | null = null;

    @property(Node)
    uiRoot: Node | null = null;

    @property(Node)
    sceneRoot: Node | null = null;

    @property(Prefab)
    uiControllerPrefab: Prefab | null = null;

    @property(Prefab)
    hudControllerPrefab: Prefab | null = null;

    @property(Prefab)
    tutorialControllerPrefab: Prefab | null = null;

    @property(Prefab)
    sceneControllerPrefab: Prefab | null = null;

    @property(Prefab)
    gameBootstrapPrefab: Prefab | null = null;

    @property(Prefab)
    testRunnerPrefab: Prefab | null = null;

    private gameBootstrapInstance: GameBootstrap | null = null;
    private testRunner: TestRunner | null = null;
    private devModeClickCount: number = 0;

    onLoad(): void {
        this.instantiateCoreComponents();
    }

    start(): void {
        this.setupDevMode();
    }

    private instantiateCoreComponents(): void {
        if (this.gameManagerPrefab && !find('GameManager')) {
            const gmNode = instantiate(this.gameManagerPrefab);
            gmNode.name = 'GameManager';
            director.addPersistRootNode(gmNode);
        } else if (!find('GameManager')) {
            const gmNode = new Node('GameManager');
            gmNode.addComponent(GameManager);
            director.addPersistRootNode(gmNode);
        }

        if (this.sceneControllerPrefab && this.sceneRoot) {
            const scNode = instantiate(this.sceneControllerPrefab);
            this.sceneRoot.addChild(scNode);
            const sc = scNode.getComponent(SceneController) || scNode.addComponent(SceneController);
            if (sc && sc.node.name === 'SceneController') {
                sc.tiledMapContainer = find('TiledMapContainer', this.sceneRoot);
                sc.interactiveObjectsContainer = find('InteractiveObjects', this.sceneRoot);
            }
        } else if (this.sceneRoot) {
            const scNode = new Node('SceneController');
            this.sceneRoot.addChild(scNode);
            scNode.addComponent(SceneController);
        }

        if (this.gameBootstrapPrefab) {
            const gbNode = instantiate(this.gameBootstrapPrefab);
            this.node.addChild(gbNode);
            this.gameBootstrapInstance = gbNode.getComponent(GameBootstrap) || gbNode.addComponent(GameBootstrap);
        } else {
            const gbNode = new Node('GameBootstrap');
            this.node.addChild(gbNode);
            this.gameBootstrapInstance = gbNode.addComponent(GameBootstrap);
        }

        if (this.uiControllerPrefab && this.uiRoot) {
            const uiNode = instantiate(this.uiControllerPrefab);
            this.uiRoot.addChild(uiNode);
        } else if (this.uiRoot) {
            const uiNode = new Node('UIController');
            this.uiRoot.addChild(uiNode);
            uiNode.addComponent(UIController);
        }

        if (this.hudControllerPrefab && this.uiRoot) {
            const hudNode = instantiate(this.hudControllerPrefab);
            this.uiRoot.addChild(hudNode);
        } else if (this.uiRoot) {
            const hudNode = new Node('HUDController');
            this.uiRoot.addChild(hudNode);
            hudNode.addComponent(HUDController);
        }

        if (this.tutorialControllerPrefab && this.uiRoot) {
            const tutNode = instantiate(this.tutorialControllerPrefab);
            this.uiRoot.addChild(tutNode);
        } else if (this.uiRoot) {
            const tutNode = new Node('TutorialController');
            this.uiRoot.addChild(tutNode);
            tutNode.addComponent(TutorialController);
        }

        if (this.testRunnerPrefab && this.uiRoot) {
            const testNode = instantiate(this.testRunnerPrefab);
            this.uiRoot.addChild(testNode);
            this.testRunner = testNode.getComponent(TestRunner) || testNode.addComponent(TestRunner);
        }

        if (this.gameBootstrapInstance) {
            const gmNode = find('GameManager');
            if (gmNode) {
                this.gameBootstrapInstance.gameManager = gmNode.getComponent(GameManager);
            }
            const uiControllerNode = find('UIController', this.uiRoot || undefined);
            if (uiControllerNode) {
                this.gameBootstrapInstance.uiController = uiControllerNode.getComponent(UIController);
            }
            const hudNode = find('HUDController', this.uiRoot || undefined);
            if (hudNode) {
                this.gameBootstrapInstance.hudController = hudNode.getComponent(HUDController);
            }
            const tutNode = find('TutorialController', this.uiRoot || undefined);
            if (tutNode) {
                this.gameBootstrapInstance.tutorialController = tutNode.getComponent(TutorialController);
            }
            const scNode = find('SceneController', this.sceneRoot || undefined);
            if (scNode) {
                this.gameBootstrapInstance.sceneController = scNode.getComponent(SceneController);
            }
        }
    }

    private setupDevMode(): void {
        this.node.on(Node.EventType.TOUCH_END, () => {
            this.devModeClickCount++;
            if (this.devModeClickCount >= 5) {
                this.devModeClickCount = 0;
                if (this.testRunner) {
                    this.testRunner.toggleTestPanel();
                } else if (this.uiRoot) {
                    const testNode = new Node('TestRunner');
                    this.uiRoot.addChild(testNode);
                    this.testRunner = testNode.addComponent(TestRunner);
                    this.testRunner.showTestPanel();
                }
            }
        }, this);
    }

    update(deltaTime: number): void {

    }
}
