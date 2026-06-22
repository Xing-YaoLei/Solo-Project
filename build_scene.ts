import * as fs from 'fs';
import * as path from 'path';

interface NodeSpec {
    id: string;
    name: string;
    children?: NodeSpec[];
    components?: ComponentSpec[];
    pos?: [number, number, number];
    size?: [number, number];
    layer?: number;
    active?: boolean;
}

interface ComponentSpec {
    type: string;
    props?: Record<string, any>;
}

const LAYER_UI = 33554432;
const LAYER_DEFAULT = 1073741824;

let idCounter = 0;
const objects: any[] = [];

function nextId(): number { return idCounter++; }

function addObject(obj: any): number {
    const id = nextId();
    obj.__id__ = id;
    objects.push(obj);
    return id;
}

function makeLabelString(text: string): any {
    return {
        __type__: 'cc.Label',
        _name: '',
        _objFlags: 0,
        node: null,
        _enabled: true,
        __prefab: null,
        _customMaterial: null,
        _srcBlendFactor: 2,
        _dstBlendFactor: 4,
        _color: { __type__: 'cc.Color', r: 255, g: 255, b: 255, a: 255 },
        _string: text,
        _horizontalAlign: 1,
        _verticalAlign: 1,
        _actualFontSize: 24,
        _fontSize: 24,
        _fontFamily: 'Arial',
        _lineHeight: 28,
        _overflow: 0,
        _enableWrapText: true,
        _font: null,
        _isSystemFontUsed: true,
        _spacingX: 0,
        _cacheMode: 0,
        _id: 'label-' + Math.random().toString(36).slice(2, 10)
    };
}

function makeUITransform(w: number, h: number): any {
    return {
        __type__: 'cc.UITransform',
        _name: '',
        _objFlags: 0,
        node: null,
        _enabled: true,
        __prefab: null,
        _contentSize: { __type__: 'cc.Size', width: w, height: h },
        _anchorPoint: { __type__: 'cc.Vec2', x: 0.5, y: 0.5 },
        _id: 'uit-' + Math.random().toString(36).slice(2, 10)
    };
}

function makeSprite(r: number, g: number, b: number, a: number = 255): any {
    return {
        __type__: 'cc.Sprite',
        _name: '',
        _objFlags: 0,
        node: null,
        _enabled: true,
        __prefab: null,
        _customMaterial: null,
        _srcBlendFactor: 2,
        _dstBlendFactor: 4,
        _color: { __type__: 'cc.Color', r, g, b, a },
        _spriteFrame: null,
        _type: 0,
        _fillType: 0,
        _sizeMode: 1,
        _fillCenter: { __type__: 'cc.Vec2', x: 0, y: 0 },
        _fillStart: 0,
        _fillRange: 0,
        _isTrimmedMode: true,
        _useGrayscale: false,
        _atlas: null,
        _id: 'sprite-' + Math.random().toString(36).slice(2, 10)
    };
}

function makeScript(uuid: string, extraProps: Record<string, any> = {}): any {
    return {
        __type__: 'cc.Component',
        _name: '',
        _objFlags: 0,
        node: null,
        _enabled: true,
        __prefab: null,
        __scriptAsset: {
            __uuid__: uuid,
            __expectedType__: 'cc.Script'
        },
        ...extraProps,
        _id: 'script-' + Math.random().toString(36).slice(2, 10)
    };
}

function makeButton(): any {
    return {
        __type__: 'cc.Button',
        _name: '',
        _objFlags: 0,
        node: null,
        _enabled: true,
        __prefab: null,
        clickEvents: [],
        _interactable: true,
        _transition: 2,
        _normalColor: { __type__: 'cc.Color', r: 80, g: 120, b: 160, a: 255 },
        _pressedColor: { __type__: 'cc.Color', r: 50, g: 80, b: 120, a: 255 },
        _hoverColor: { __type__: 'cc.Color', r: 100, g: 150, b: 200, a: 255 },
        _disabledColor: { __type__: 'cc.Color', r: 120, g: 120, b: 120, a: 200 },
        _duration: 0.1,
        _zoomScale: 1.2,
        _target: null,
        _id: 'btn-' + Math.random().toString(36).slice(2, 10)
    };
}

function makeNode(spec: NodeSpec, parentRef: any): number {
    const nodeId = nextId();
    const nodeObj: any = {
        __type__: 'cc.Node',
        _name: spec.name,
        _objFlags: 0,
        parent: parentRef,
        _children: [],
        _active: spec.active !== false,
        _components: [],
        _prefab: null,
        _lpos: { __type__: 'cc.Vec3', x: spec.pos?.[0] || 0, y: spec.pos?.[1] || 0, z: spec.pos?.[2] || 0 },
        _lrot: { __type__: 'cc.Quat', x: 0, y: 0, z: 0, w: 1 },
        _lscale: { __type__: 'cc.Vec3', x: 1, y: 1, z: 1 },
        _mobility: 0,
        _layer: spec.layer || LAYER_UI,
        _euler: { __type__: 'cc.Vec3', x: 0, y: 0, z: 0 },
        _id: 'node-' + spec.id
    };
    objects.push(nodeObj);

    const nodeRef = { __id__: nodeId };

    (spec.components || []).forEach(comp => {
        let compObj: any;
        switch (comp.type) {
            case 'UITransform':
                compObj = makeUITransform(comp.props?.w || 100, comp.props?.h || 100);
                break;
            case 'Sprite':
                compObj = makeSprite(
                    comp.props?.r || 255,
                    comp.props?.g || 255,
                    comp.props?.b || 255,
                    comp.props?.a || 255
                );
                break;
            case 'Label':
                compObj = makeLabelString(comp.props?.text || '');
                if (comp.props?.fontSize) {
                    compObj._fontSize = comp.props.fontSize;
                    compObj._actualFontSize = comp.props.fontSize;
                    compObj._lineHeight = comp.props.fontSize + 6;
                }
                if (comp.props?.color) {
                    compObj._color = {
                        __type__: 'cc.Color',
                        r: comp.props.color.r, g: comp.props.color.g, b: comp.props.color.b, a: comp.props.color.a || 255
                    };
                }
                break;
            case 'Button':
                compObj = makeButton();
                break;
            case 'TiledMap':
                compObj = {
                    __type__: 'cc.TiledMap',
                    _name: '',
                    _objFlags: 0,
                    node: null,
                    _enabled: true,
                    __prefab: null,
                    _tmxFile: null,
                    _node: null,
                    _id: 'tiledmap-' + Math.random().toString(36).slice(2, 10)
                };
                break;
            case 'Script':
                compObj = makeScript(comp.props?.uuid, comp.props?.extra || {});
                break;
            default:
                compObj = {
                    __type__: comp.type,
                    _name: '',
                    _objFlags: 0,
                    node: null,
                    _enabled: true,
                    __prefab: null,
                    _id: 'comp-' + Math.random().toString(36).slice(2, 10)
                };
        }
        compObj.node = nodeRef;
        if (comp.type === 'Button' && compObj._target === null) {
            compObj._target = nodeRef;
        }
        const compId = addObject(compObj);
        nodeObj._components.push({ __id__: compId });
    });

    (spec.children || []).forEach(childSpec => {
        const childId = makeNode(childSpec, nodeRef);
        nodeObj._children.push({ __id__: childId });
    });

    return nodeId;
}

const sceneAssetId = addObject({
    __type__: 'cc.SceneAsset',
    _name: 'MainScene',
    _objFlags: 0,
    _native: '',
    scene: null
});

const sceneObjId = nextId();
const sceneObj: any = {
    __type__: 'cc.Scene',
    _name: 'MainScene',
    _objFlags: 0,
    parent: null,
    _children: [],
    _active: true,
    _components: [],
    _prefab: null,
    _lpos: { __type__: 'cc.Vec3', x: 0, y: 0, z: 0 },
    _lrot: { __type__: 'cc.Quat', x: 0, y: 0, z: 0, w: 1 },
    _lscale: { __type__: 'cc.Vec3', x: 1, y: 1, z: 1 },
    _mobility: 0,
    _layer: LAYER_DEFAULT,
    _euler: { __type__: 'cc.Vec3', x: 0, y: 0, z: 0 },
    autoReleaseAssets: false,
    _globals: null,
    _id: 'scene-main-root'
};
objects.push(sceneObj);

objects[sceneAssetId].scene = { __id__: sceneObjId };

const sceneRef = { __id__: sceneObjId };

// ---------- Main Camera ----------
const camNodeId = nextId();
const camNode: any = {
    __type__: 'cc.Node',
    _name: 'Main Camera',
    _objFlags: 0,
    parent: sceneRef,
    _children: [],
    _active: true,
    _components: [],
    _prefab: null,
    _lpos: { __type__: 'cc.Vec3', x: 0, y: 0, z: 1000 },
    _lrot: { __type__: 'cc.Quat', x: 0, y: 0, z: 0, w: 1 },
    _lscale: { __type__: 'cc.Vec3', x: 1, y: 1, z: 1 },
    _mobility: 0,
    _layer: LAYER_DEFAULT,
    _euler: { __type__: 'cc.Vec3', x: 0, y: 0, z: 0 },
    _id: 'node-camera'
};
objects.push(camNode);
sceneObj._children.push({ __id__: camNodeId });
const camNodeRef = { __id__: camNodeId };

const camCompId = addObject({
    __type__: 'cc.Camera',
    _name: '', _objFlags: 0, node: camNodeRef, _enabled: true, __prefab: null,
    _projection: 0, _priority: 0, _fov: 45, _orthoHeight: 360, _near: 1, _far: 2000,
    _color: { __type__: 'cc.Color', r: 51, g: 51, b: 51, a: 255 },
    _depth: 1, _stencil: 0, _clearFlags: 7,
    _rect: { __type__: 'cc.Rect', x: 0, y: 0, width: 1, height: 1 },
    _aperture: 19, _shutter: 7, _iso: 0, _screenScale: 1, _visibility: 41943040, _targetTexture: null,
    _id: 'comp-camera'
});
const audioListenerId = addObject({
    __type__: 'cc.AudioListener',
    _name: '', _objFlags: 0, node: camNodeRef, _enabled: true, __prefab: null,
    _id: 'comp-audio'
});
camNode._components = [{ __id__: camCompId }, { __id__: audioListenerId }];

// ---------- Canvas ----------
const canvasNodeId = nextId();
const canvasNode: any = {
    __type__: 'cc.Node',
    _name: 'Canvas',
    _objFlags: 0,
    parent: sceneRef,
    _children: [],
    _active: true,
    _components: [],
    _prefab: null,
    _lpos: { __type__: 'cc.Vec3', x: 0, y: 0, z: 0 },
    _lrot: { __type__: 'cc.Quat', x: 0, y: 0, z: 0, w: 1 },
    _lscale: { __type__: 'cc.Vec3', x: 1, y: 1, z: 1 },
    _mobility: 0,
    _layer: LAYER_UI,
    _euler: { __type__: 'cc.Vec3', x: 0, y: 0, z: 0 },
    _id: 'node-canvas'
};
objects.push(canvasNode);
sceneObj._children.push({ __id__: canvasNodeId });
const canvasRef = { __id__: canvasNodeId };

const canvasUITFId = addObject({
    ...makeUITransform(750, 1334), node: canvasRef
});
const canvasWidgetId = addObject({
    __type__: 'cc.Widget', _name: '', _objFlags: 0, node: canvasRef, _enabled: true, __prefab: null,
    _alignFlags: 45, _target: null, _left: 0, _right: 0, _top: 0, _bottom: 0,
    _verticalCenter: 0, _horizontalCenter: 0, _isAbsLeft: true, _isAbsRight: true,
    _isAbsTop: true, _isAbsBottom: true, _isAbsHorizontalCenter: true, _isAbsVerticalCenter: true,
    _originalWidth: 750, _originalHeight: 1334, _alignMode: 2,
    _id: 'widget-canvas'
});
const canvasCanvasId = addObject({
    __type__: 'cc.Canvas', _name: '', _objFlags: 0, node: canvasRef, _enabled: true, __prefab: null,
    _cameraComponent: { __id__: camCompId }, _alignCanvasWithScreen: true,
    _id: 'canvas-canvas'
});
canvasNode._components = [
    { __id__: canvasUITFId },
    { __id__: canvasWidgetId },
    { __id__: canvasCanvasId }
];

// ---------- Placeholder refs to be filled in by makeNode children ----------
// We'll collect all child node IDs and plug them in after creating them.

const placeholderRefs: Record<string, number> = {};

function makeTracked(spec: NodeSpec, parentRef: any, key: string): number {
    const id = makeNode(spec, parentRef);
    placeholderRefs[key] = id;
    return id;
}

// Create MainSceneController as tracked - we need its script component index later
// For simplicity we build all children manually to get exact IDs.

// ----- We'll build all children in the right order -----

// Helper for button labels
function makeMenuButton(name: string, labelText: string, y: number, handlerName: string, customData: string, btnColor: [number, number, number] = [80, 120, 160]): NodeSpec {
    return {
        id: `btn-${name}`,
        name: `${name}Button`,
        pos: [0, y, 0],
        components: [
            { type: 'UITransform', props: { w: 200, h: 60 } },
            { type: 'Sprite', props: { r: btnColor[0], g: btnColor[1], b: btnColor[2], a: 255 } },
            { type: 'Button', props: {} }
        ],
        children: [
            {
                id: `btn-${name}-label`,
                name: 'Label',
                pos: [0, 0, 0],
                components: [
                    { type: 'UITransform', props: { w: 200, h: 60 } },
                    { type: 'Label', props: { text: labelText, fontSize: 24, color: { r: 255, g: 255, b: 255, a: 255 } } }
                ]
            }
        ]
    };
}

// ------- Build the tree -------
const tree: NodeSpec = {
    id: 'ROOT',
    name: 'Canvas-children-root',
    children: [
        // 1. MainSceneController node
        {
            id: 'controller',
            name: 'MainSceneController',
            pos: [0, 0, 0],
            components: [
                { type: 'UITransform', props: { w: 100, h: 100 } },
                {
                    type: 'Script',
                    props: {
                        uuid: '5a7e8d10-3b4c-4e5f-9a6b-7c8d9e0f1a2b',
                        extra: {
                            // We'll patch these refs after creation
                            missionHallPanel: null,
                            casePlayPanel: null,
                            cluePanel: null,
                            resultPanel: null,
                            loadingLabel: null,
                            loadingPanel: null,
                            caseListContainer: null,
                            clueListContainer: null,
                            actionListContainer: null,
                            stageInfoLabel: null,
                            playerInfoLabel: null,
                            mapManagerNode: null,
                            mapNode: null,
                            clientArchivePanel: null,
                            trainingRecordPanel: null,
                            leaderboardPanel: null,
                        }
                    }
                }
            ]
        },
        // 2. MapNode (TiledMap + MapManager)
        {
            id: 'mapnode',
            name: 'MapNode',
            pos: [0, 0, 0],
            active: false,
            components: [
                { type: 'UITransform', props: { w: 750, h: 600 } },
                { type: 'TiledMap' },
                {
                    type: 'Script',
                    props: {
                        uuid: '5a7e8d10-3b4c-4e5f-9a6b-7c8d9e0f1a2c',
                        extra: {
                            tiledMap: null
                        }
                    }
                }
            ]
        },
        // 3. LoadingPanel
        {
            id: 'loading-panel',
            name: 'LoadingPanel',
            pos: [0, 0, 0],
            active: true,
            components: [
                { type: 'UITransform', props: { w: 750, h: 1334 } },
                { type: 'Sprite', props: { r: 20, g: 30, b: 50, a: 255 } }
            ],
            children: [
                {
                    id: 'loading-label',
                    name: 'LoadingLabel',
                    pos: [0, 0, 0],
                    components: [
                        { type: 'UITransform', props: { w: 600, h: 80 } },
                        { type: 'Label', props: { text: '正在加载游戏资源...', fontSize: 40, color: { r: 255, g: 255, b: 255, a: 255 } } }
                    ]
                }
            ]
        },
        // 4. MissionHallPanel
        {
            id: 'hall-panel',
            name: 'MissionHallPanel',
            pos: [0, 0, 0],
            active: false,
            components: [
                { type: 'UITransform', props: { w: 750, h: 1334 } },
                { type: 'Sprite', props: { r: 25, g: 45, b: 70, a: 255 } }
            ],
            children: [
                // 标题
                {
                    id: 'hall-title',
                    name: 'TitleLabel',
                    pos: [0, 560, 0],
                    components: [
                        { type: 'UITransform', props: { w: 700, h: 70 } },
                        { type: 'Label', props: { text: '⚖️ 任务大厅 - 法律服务案件委托', fontSize: 38, color: { r: 255, g: 220, b: 140, a: 255 } } }
                    ]
                },
                // 玩家信息
                {
                    id: 'hall-playerinfo',
                    name: 'PlayerInfoLabel',
                    pos: [0, 480, 0],
                    components: [
                        { type: 'UITransform', props: { w: 700, h: 40 } },
                        { type: 'Label', props: { text: '玩家: Player | 总分: 0 | 已完成案件: 0', fontSize: 24, color: { r: 210, g: 210, b: 210, a: 255 } } }
                    ]
                },
                // 菜单按钮组（客户档案/训练复盘/排行榜）
                {
                    id: 'hall-menubtns',
                    name: 'MenuButtons',
                    pos: [0, -560, 0],
                    components: [
                        { type: 'UITransform', props: { w: 750, h: 80 } }
                    ],
                    children: [
                        {
                            id: 'btn-clientarchive',
                            name: 'ClientArchiveButton',
                            pos: [-240, 0, 0],
                            components: [
                                { type: 'UITransform', props: { w: 200, h: 70 } },
                                { type: 'Sprite', props: { r: 60, g: 90, b: 140, a: 255 } },
                                { type: 'Button' }
                            ],
                            children: [
                                {
                                    id: 'btn-clientarchive-label',
                                    name: 'Label',
                                    pos: [0, 0, 0],
                                    components: [
                                        { type: 'UITransform', props: { w: 200, h: 70 } },
                                        { type: 'Label', props: { text: '📇 客户档案', fontSize: 24, color: { r: 255, g: 255, b: 255, a: 255 } } }
                                    ]
                                }
                            ]
                        },
                        {
                            id: 'btn-training',
                            name: 'TrainingButton',
                            pos: [0, 0, 0],
                            components: [
                                { type: 'UITransform', props: { w: 200, h: 70 } },
                                { type: 'Sprite', props: { r: 60, g: 90, b: 140, a: 255 } },
                                { type: 'Button' }
                            ],
                            children: [
                                {
                                    id: 'btn-training-label',
                                    name: 'Label',
                                    pos: [0, 0, 0],
                                    components: [
                                        { type: 'UITransform', props: { w: 200, h: 70 } },
                                        { type: 'Label', props: { text: '📊 训练复盘', fontSize: 24, color: { r: 255, g: 255, b: 255, a: 255 } } }
                                    ]
                                }
                            ]
                        },
                        {
                            id: 'btn-leaderboard',
                            name: 'LeaderboardButton',
                            pos: [240, 0, 0],
                            components: [
                                { type: 'UITransform', props: { w: 200, h: 70 } },
                                { type: 'Sprite', props: { r: 60, g: 90, b: 140, a: 255 } },
                                { type: 'Button' }
                            ],
                            children: [
                                {
                                    id: 'btn-leaderboard-label',
                                    name: 'Label',
                                    pos: [0, 0, 0],
                                    components: [
                                        { type: 'UITransform', props: { w: 200, h: 70 } },
                                        { type: 'Label', props: { text: '🏆 排行榜', fontSize: 24, color: { r: 255, g: 255, b: 255, a: 255 } } }
                                    ]
                                }
                            ]
                        }
                    ]
                },
                // 案件列表容器
                {
                    id: 'caselist',
                    name: 'CaseList',
                    pos: [0, 0, 0],
                    components: [
                        { type: 'UITransform', props: { w: 700, h: 700 } }
                    ]
                }
            ]
        },
        // 5. CasePlayPanel
        {
            id: 'caseplay-panel',
            name: 'CasePlayPanel',
            pos: [0, 0, 0],
            active: false,
            components: [
                { type: 'UITransform', props: { w: 750, h: 1334 } },
                { type: 'Sprite', props: { r: 30, g: 50, b: 75, a: 255 } }
            ],
            children: [
                {
                    id: 'caseplay-stageinfo',
                    name: 'StageInfoLabel',
                    pos: [0, 580, 0],
                    components: [
                        { type: 'UITransform', props: { w: 720, h: 100 } },
                        { type: 'Label', props: { text: '案件: xxx | 阶段: 案件受理 | 得分: 0/100', fontSize: 26, color: { r: 255, g: 240, b: 200, a: 255 } } }
                    ]
                },
                {
                    id: 'caseplay-cluearea',
                    name: 'ClueArea',
                    pos: [0, 200, 0],
                    components: [
                        { type: 'UITransform', props: { w: 700, h: 400 } }
                    ]
                },
                {
                    id: 'caseplay-actionarea',
                    name: 'ActionArea',
                    pos: [0, -250, 0],
                    components: [
                        { type: 'UITransform', props: { w: 700, h: 500 } }
                    ]
                }
            ]
        },
        // 6. CluePanel
        {
            id: 'clue-panel',
            name: 'CluePanel',
            pos: [0, 0, 0],
            active: false,
            components: [
                { type: 'UITransform', props: { w: 750, h: 1334 } }
            ]
        },
        // 7. ResultPanel (完整的结算界面)
        {
            id: 'result-panel',
            name: 'ResultPanel',
            pos: [0, 0, 0],
            active: false,
            components: [
                { type: 'UITransform', props: { w: 750, h: 1334 } },
                { type: 'Sprite', props: { r: 20, g: 35, b: 55, a: 255 } }
            ],
            children: [
                {
                    id: 'result-title',
                    name: 'TitleLabel',
                    pos: [0, 580, 0],
                    components: [
                        { type: 'UITransform', props: { w: 700, h: 70 } },
                        { type: 'Label', props: { text: '📋 案件结算', fontSize: 40, color: { r: 255, g: 220, b: 140, a: 255 } } }
                    ]
                },
                {
                    id: 'result-caseinfo',
                    name: 'CaseInfoLabel',
                    pos: [0, 490, 0],
                    components: [
                        { type: 'UITransform', props: { w: 700, h: 50 } },
                        { type: 'Label', props: { text: '案件：xxx', fontSize: 26, color: { r: 230, g: 230, b: 230, a: 255 } } }
                    ]
                },
                {
                    id: 'result-score',
                    name: 'ScoreLabel',
                    pos: [0, 420, 0],
                    components: [
                        { type: 'UITransform', props: { w: 700, h: 70 } },
                        { type: 'Label', props: { text: '得分: 0/100', fontSize: 40, color: { r: 255, g: 200, b: 80, a: 255 } } }
                    ]
                },
                {
                    id: 'result-result',
                    name: 'ResultLabel',
                    pos: [0, 360, 0],
                    components: [
                        { type: 'UITransform', props: { w: 700, h: 40 } },
                        { type: 'Label', props: { text: '结果：通过', fontSize: 28, color: { r: 100, g: 255, b: 150, a: 255 } } }
                    ]
                },
                {
                    id: 'result-errorstitle',
                    name: 'ErrorsTitleLabel',
                    pos: [-280, 280, 0],
                    components: [
                        { type: 'UITransform', props: { w: 200, h: 40 } },
                        { type: 'Label', props: { text: '❌ 错因记录', fontSize: 24, color: { r: 255, g: 140, b: 140, a: 255 } } }
                    ]
                },
                {
                    id: 'result-errorscontainer',
                    name: 'ErrorsContainer',
                    pos: [0, 120, 0],
                    components: [
                        { type: 'UITransform', props: { w: 700, h: 280 } }
                    ]
                },
                {
                    id: 'result-misstitle',
                    name: 'MissTitleLabel',
                    pos: [-280, -40, 0],
                    components: [
                        { type: 'UITransform', props: { w: 200, h: 40 } },
                        { type: 'Label', props: { text: '⚠️ 材料缺页', fontSize: 24, color: { r: 255, g: 200, b: 120, a: 255 } } }
                    ]
                },
                {
                    id: 'result-misscontainer',
                    name: 'MissContainer',
                    pos: [0, -210, 0],
                    components: [
                        { type: 'UITransform', props: { w: 700, h: 220 } }
                    ]
                },
                // 按钮组
                {
                    id: 'result-btns',
                    name: 'ResultButtons',
                    pos: [0, -500, 0],
                    components: [
                        { type: 'UITransform', props: { w: 750, h: 100 } }
                    ],
                    children: [
                        {
                            id: 'result-backbtn',
                            name: 'BackButton',
                            pos: [-240, 0, 0],
                            components: [
                                { type: 'UITransform', props: { w: 200, h: 80 } },
                                { type: 'Sprite', props: { r: 80, g: 80, b: 100, a: 255 } },
                                { type: 'Button' }
                            ],
                            children: [
                                {
                                    id: 'result-backbtn-label',
                                    name: 'Label',
                                    pos: [0, 0, 0],
                                    components: [
                                        { type: 'UITransform', props: { w: 200, h: 80 } },
                                        { type: 'Label', props: { text: '返回大厅', fontSize: 24, color: { r: 255, g: 255, b: 255, a: 255 } } }
                                    ]
                                }
                            ]
                        },
                        {
                            id: 'result-reviewbtn',
                            name: 'ReviewButton',
                            pos: [0, 0, 0],
                            components: [
                                { type: 'UITransform', props: { w: 200, h: 80 } },
                                { type: 'Sprite', props: { r: 60, g: 100, b: 160, a: 255 } },
                                { type: 'Button' }
                            ],
                            children: [
                                {
                                    id: 'result-reviewbtn-label',
                                    name: 'Label',
                                    pos: [0, 0, 0],
                                    components: [
                                        { type: 'UITransform', props: { w: 200, h: 80 } },
                                        { type: 'Label', props: { text: '📊 复盘记录', fontSize: 24, color: { r: 255, g: 255, b: 255, a: 255 } } }
                                    ]
                                }
                            ]
                        },
                        {
                            id: 'result-retrybtn',
                            name: 'RetryButton',
                            pos: [240, 0, 0],
                            components: [
                                { type: 'UITransform', props: { w: 200, h: 80 } },
                                { type: 'Sprite', props: { r: 50, g: 140, b: 90, a: 255 } },
                                { type: 'Button' }
                            ],
                            children: [
                                {
                                    id: 'result-retrybtn-label',
                                    name: 'Label',
                                    pos: [0, 0, 0],
                                    components: [
                                        { type: 'UITransform', props: { w: 200, h: 80 } },
                                        { type: 'Label', props: { text: '🔄 再玩一次', fontSize: 24, color: { r: 255, g: 255, b: 255, a: 255 } } }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        // 8. ClientArchivePanel
        {
            id: 'clientarchive-panel',
            name: 'ClientArchivePanel',
            pos: [0, 0, 0],
            active: false,
            components: [
                { type: 'UITransform', props: { w: 750, h: 1334 } },
                { type: 'Sprite', props: { r: 25, g: 45, b: 65, a: 255 } },
                {
                    type: 'Script',
                    props: {
                        uuid: '5a7e8d10-3b4c-4e5f-9a6b-7c8d9e0f1a2e',
                        extra: {}
                    }
                }
            ],
            children: [
                {
                    id: 'clientarchive-title',
                    name: 'TitleLabel',
                    pos: [0, 600, 0],
                    components: [
                        { type: 'UITransform', props: { w: 700, h: 60 } },
                        { type: 'Label', props: { text: '📇 客户档案', fontSize: 36, color: { r: 255, g: 220, b: 140, a: 255 } } }
                    ]
                },
                {
                    id: 'clientarchive-unlocked',
                    name: 'UnlockedCountLabel',
                    pos: [0, 540, 0],
                    components: [
                        { type: 'UITransform', props: { w: 700, h: 40 } },
                        { type: 'Label', props: { text: '已解锁客户: 0/4', fontSize: 22, color: { r: 210, g: 210, b: 210, a: 255 } } }
                    ]
                },
                {
                    id: 'clientarchive-content',
                    name: 'ClientContent',
                    pos: [0, 200, 0],
                    components: [
                        { type: 'UITransform', props: { w: 700, h: 600 } }
                    ]
                },
                {
                    id: 'clientarchive-close',
                    name: 'CloseButton',
                    pos: [300, 600, 0],
                    components: [
                        { type: 'UITransform', props: { w: 100, h: 60 } },
                        { type: 'Sprite', props: { r: 140, g: 60, b: 60, a: 255 } },
                        { type: 'Button' }
                    ],
                    children: [
                        {
                            id: 'clientarchive-close-label',
                            name: 'Label',
                            pos: [0, 0, 0],
                            components: [
                                { type: 'UITransform', props: { w: 100, h: 60 } },
                                { type: 'Label', props: { text: '关闭', fontSize: 22, color: { r: 255, g: 255, b: 255, a: 255 } } }
                            ]
                        }
                    ]
                }
            ]
        },
        // 9. TrainingRecordPanel
        {
            id: 'training-panel',
            name: 'TrainingRecordPanel',
            pos: [0, 0, 0],
            active: false,
            components: [
                { type: 'UITransform', props: { w: 750, h: 1334 } },
                { type: 'Sprite', props: { r: 25, g: 40, b: 65, a: 255 } },
                {
                    type: 'Script',
                    props: {
                        uuid: '5a7e8d10-3b4c-4e5f-9a6b-7c8d9e0f1a2f',
                        extra: {}
                    }
                }
            ],
            children: [
                {
                    id: 'training-title',
                    name: 'TitleLabel',
                    pos: [0, 600, 0],
                    components: [
                        { type: 'UITransform', props: { w: 700, h: 60 } },
                        { type: 'Label', props: { text: '📊 训练复盘', fontSize: 36, color: { r: 255, g: 220, b: 140, a: 255 } } }
                    ]
                },
                {
                    id: 'training-stats',
                    name: 'StatsLabel',
                    pos: [0, 540, 0],
                    components: [
                        { type: 'UITransform', props: { w: 700, h: 40 } },
                        { type: 'Label', props: { text: '训练次数: 0 | 平均分: 0 | 通过率: 0%', fontSize: 22, color: { r: 210, g: 210, b: 210, a: 255 } } }
                    ]
                },
                {
                    id: 'training-content',
                    name: 'RecordContent',
                    pos: [0, 200, 0],
                    components: [
                        { type: 'UITransform', props: { w: 700, h: 600 } }
                    ]
                },
                {
                    id: 'training-close',
                    name: 'CloseButton',
                    pos: [300, 600, 0],
                    components: [
                        { type: 'UITransform', props: { w: 100, h: 60 } },
                        { type: 'Sprite', props: { r: 140, g: 60, b: 60, a: 255 } },
                        { type: 'Button' }
                    ],
                    children: [
                        {
                            id: 'training-close-label',
                            name: 'Label',
                            pos: [0, 0, 0],
                            components: [
                                { type: 'UITransform', props: { w: 100, h: 60 } },
                                { type: 'Label', props: { text: '关闭', fontSize: 22, color: { r: 255, g: 255, b: 255, a: 255 } } }
                            ]
                        }
                    ]
                }
            ]
        },
        // 10. LeaderboardPanel
        {
            id: 'leaderboard-panel',
            name: 'LeaderboardPanel',
            pos: [0, 0, 0],
            active: false,
            components: [
                { type: 'UITransform', props: { w: 750, h: 1334 } },
                { type: 'Sprite', props: { r: 25, g: 40, b: 65, a: 255 } },
                {
                    type: 'Script',
                    props: {
                        uuid: '5a7e8d10-3b4c-4e5f-9a6b-7c8d9e0f1a30',
                        extra: {}
                    }
                }
            ],
            children: [
                {
                    id: 'leaderboard-title',
                    name: 'TitleLabel',
                    pos: [0, 600, 0],
                    components: [
                        { type: 'UITransform', props: { w: 700, h: 60 } },
                        { type: 'Label', props: { text: '🏆 排行榜', fontSize: 36, color: { r: 255, g: 220, b: 140, a: 255 } } }
                    ]
                },
                {
                    id: 'leaderboard-myinfo',
                    name: 'MyInfoLabel',
                    pos: [0, 540, 0],
                    components: [
                        { type: 'UITransform', props: { w: 700, h: 40 } },
                        { type: 'Label', props: { text: '我的排名: 未上榜 | 得分: 0', fontSize: 22, color: { r: 210, g: 210, b: 210, a: 255 } } }
                    ]
                },
                {
                    id: 'leaderboard-content',
                    name: 'RankContent',
                    pos: [0, 200, 0],
                    components: [
                        { type: 'UITransform', props: { w: 700, h: 600 } }
                    ]
                },
                {
                    id: 'leaderboard-close',
                    name: 'CloseButton',
                    pos: [300, 600, 0],
                    components: [
                        { type: 'UITransform', props: { w: 100, h: 60 } },
                        { type: 'Sprite', props: { r: 140, g: 60, b: 60, a: 255 } },
                        { type: 'Button' }
                    ],
                    children: [
                        {
                            id: 'leaderboard-close-label',
                            name: 'Label',
                            pos: [0, 0, 0],
                            components: [
                                { type: 'UITransform', props: { w: 100, h: 60 } },
                                { type: 'Label', props: { text: '关闭', fontSize: 22, color: { r: 255, g: 255, b: 255, a: 255 } } }
                            ]
                        }
                    ]
                }
            ]
        }
    ]
};

// We'll create these children by hand to keep track of IDs
// Actually let's just use makeNode for each top-level child and collect IDs in a dict

const nodeIds: Record<string, number> = {};
const labelIds: Record<string, number> = {};
const scriptIds: Record<string, number> = {};
const buttonIds: Record<string, number> = {};

// Walk the tree structure manually using makeNode recursively
// But we need to track specific IDs. Simplify: create nodes one by one.

// Helper to register components by looking through objects array after adding
function findComponentById(scriptId: number): number {
    // Not needed - we return IDs from addObject
    return scriptId;
}

// Build children of Canvas manually:
function buildChildren(): void {
    // ---- MainSceneController Node ----
    {
        const nodeId = nextId();
        const nodeRef = { __id__: nodeId };
        const obj: any = {
            __type__: 'cc.Node', _name: 'MainSceneController', _objFlags: 0,
            parent: canvasRef, _children: [], _active: true, _components: [],
            _prefab: null,
            _lpos: { __type__: 'cc.Vec3', x: 0, y: 0, z: 0 },
            _lrot: { __type__: 'cc.Quat', x: 0, y: 0, z: 0, w: 1 },
            _lscale: { __type__: 'cc.Vec3', x: 1, y: 1, z: 1 },
            _mobility: 0, _layer: LAYER_UI,
            _euler: { __type__: 'cc.Vec3', x: 0, y: 0, z: 0 },
            _id: 'node-controller'
        };
        objects.push(obj);
        canvasNode._children.push(nodeRef);
        nodeIds.controller = nodeId;

        // UITransform
        const uitfId = addObject({ ...makeUITransform(100, 100), node: nodeRef });
        // Script component (MainSceneController)
        const scriptObj: any = {
            __type__: 'cc.Component', _name: '', _objFlags: 0, node: nodeRef,
            _enabled: true, __prefab: null,
            __scriptAsset: {
                __uuid__: '5a7e8d10-3b4c-4e5f-9a6b-7c8d9e0f1a2b',
                __expectedType__: 'cc.Script'
            },
            // All these will be patched later with correct __id__ refs
            missionHallPanel: null, casePlayPanel: null, cluePanel: null, resultPanel: null,
            loadingLabel: null, loadingPanel: null, caseListContainer: null,
            clueListContainer: null, actionListContainer: null,
            stageInfoLabel: null, playerInfoLabel: null,
            mapManagerNode: null, clientArchivePanel: null,
            trainingRecordPanel: null, leaderboardPanel: null,
            resultScoreLabel: null, resultCaseInfoLabel: null,
            resultResultLabel: null, resultErrorsContainer: null,
            resultMissContainer: null,
            _id: 'script-controller'
        };
        const scriptId = addObject(scriptObj);
        obj._components = [{ __id__: uitfId }, { __id__: scriptId }];
        scriptIds.controller = scriptId;
    }

    // ---- MapNode ----
    {
        const nodeId = nextId();
        const nodeRef = { __id__: nodeId };
        const obj: any = {
            __type__: 'cc.Node', _name: 'MapNode', _objFlags: 0,
            parent: canvasRef, _children: [], _active: false, _components: [],
            _prefab: null,
            _lpos: { __type__: 'cc.Vec3', x: 0, y: 0, z: 0 },
            _lrot: { __type__: 'cc.Quat', x: 0, y: 0, z: 0, w: 1 },
            _lscale: { __type__: 'cc.Vec3', x: 1, y: 1, z: 1 },
            _mobility: 0, _layer: LAYER_UI,
            _euler: { __type__: 'cc.Vec3', x: 0, y: 0, z: 0 },
            _id: 'node-mapnode'
        };
        objects.push(obj);
        canvasNode._children.push(nodeRef);
        nodeIds.mapNode = nodeId;

        // UITransform
        const uitfId = addObject({ ...makeUITransform(750, 600), node: nodeRef });
        // TiledMap
        const tiledObj: any = {
            __type__: 'cc.TiledMap', _name: '', _objFlags: 0, node: nodeRef,
            _enabled: true, __prefab: null,
            _tmxFile: null, _node: null,
            _id: 'tiledmap-node'
        };
        const tiledId = addObject(tiledObj);
        // MapManager script
        const scriptObj: any = {
            __type__: 'cc.Component', _name: '', _objFlags: 0, node: nodeRef,
            _enabled: true, __prefab: null,
            __scriptAsset: {
                __uuid__: '5a7e8d10-3b4c-4e5f-9a6b-7c8d9e0f1a2c',
                __expectedType__: 'cc.Script'
            },
            tiledMap: { __id__: tiledId },
            _id: 'script-mapmanager'
        };
        const scriptId = addObject(scriptObj);
        obj._components = [{ __id__: uitfId }, { __id__: tiledId }, { __id__: scriptId }];
        scriptIds.mapManager = scriptId;
        nodeIds.mapTiledComp = tiledId;
    }

    // ---- LoadingPanel ----
    {
        const nodeId = nextId();
        const nodeRef = { __id__: nodeId };
        const obj: any = {
            __type__: 'cc.Node', _name: 'LoadingPanel', _objFlags: 0,
            parent: canvasRef, _children: [], _active: true, _components: [],
            _prefab: null,
            _lpos: { __type__: 'cc.Vec3', x: 0, y: 0, z: 0 },
            _lrot: { __type__: 'cc.Quat', x: 0, y: 0, z: 0, w: 1 },
            _lscale: { __type__: 'cc.Vec3', x: 1, y: 1, z: 1 },
            _mobility: 0, _layer: LAYER_UI,
            _euler: { __type__: 'cc.Vec3', x: 0, y: 0, z: 0 },
            _id: 'node-loadingpanel'
        };
        objects.push(obj);
        canvasNode._children.push(nodeRef);
        nodeIds.loadingPanel = nodeId;

        const uitfId = addObject({ ...makeUITransform(750, 1334), node: nodeRef });
        const spriteId = addObject({ ...makeSprite(20, 30, 50, 255), node: nodeRef });
        obj._components = [{ __id__: uitfId }, { __id__: spriteId }];

        // LoadingLabel child
        const labelNodeId = nextId();
        const labelNodeRef = { __id__: labelNodeId };
        const labelObj: any = {
            __type__: 'cc.Node', _name: 'LoadingLabel', _objFlags: 0,
            parent: nodeRef, _children: [], _active: true, _components: [],
            _prefab: null,
            _lpos: { __type__: 'cc.Vec3', x: 0, y: 0, z: 0 },
            _lrot: { __type__: 'cc.Quat', x: 0, y: 0, z: 0, w: 1 },
            _lscale: { __type__: 'cc.Vec3', x: 1, y: 1, z: 1 },
            _mobility: 0, _layer: LAYER_UI,
            _euler: { __type__: 'cc.Vec3', x: 0, y: 0, z: 0 },
            _id: 'node-loadinglabel'
        };
        objects.push(labelObj);
        obj._children.push(labelNodeRef);

        const luitfId = addObject({ ...makeUITransform(600, 80), node: labelNodeRef });
        const labelComp = makeLabelString('正在加载游戏资源...');
        labelComp._fontSize = 40; labelComp._actualFontSize = 40; labelComp._lineHeight = 48;
        labelComp.node = labelNodeRef;
        const llblId = addObject(labelComp);
        labelObj._components = [{ __id__: luitfId }, { __id__: llblId }];
        labelIds.loadingLabel = llblId;
    }

    // Helper: create a simple panel with background
    function createPanel(name: string, active: boolean = false, bgColor: [number, number, number] = [25, 45, 70], id: string, w: number = 750, h: number = 1334): { nodeId: number, nodeRef: any, obj: any } {
        const nodeId = nextId();
        const nodeRef = { __id__: nodeId };
        const obj: any = {
            __type__: 'cc.Node', _name: name, _objFlags: 0,
            parent: canvasRef, _children: [], _active: active, _components: [],
            _prefab: null,
            _lpos: { __type__: 'cc.Vec3', x: 0, y: 0, z: 0 },
            _lrot: { __type__: 'cc.Quat', x: 0, y: 0, z: 0, w: 1 },
            _lscale: { __type__: 'cc.Vec3', x: 1, y: 1, z: 1 },
            _mobility: 0, _layer: LAYER_UI,
            _euler: { __type__: 'cc.Vec3', x: 0, y: 0, z: 0 },
            _id: id
        };
        objects.push(obj);
        canvasNode._children.push(nodeRef);
        nodeIds[id] = nodeId;

        const uitfId = addObject({ ...makeUITransform(w, h), node: nodeRef });
        const spriteId = addObject({ ...makeSprite(bgColor[0], bgColor[1], bgColor[2], 255), node: nodeRef });
        obj._components = [{ __id__: uitfId }, { __id__: spriteId }];
        return { nodeId, nodeRef, obj };
    }

    function createLabelChild(parentRef: any, parentId: number, name: string, text: string,
        pos: [number, number, number], size: [number, number],
        fontSize: number, color: [number, number, number, number] = [255, 255, 255, 255],
        key?: string): { nodeId: number, labelId: number } {
        const nodeId = nextId();
        const nodeRef = { __id__: nodeId };
        const obj: any = {
            __type__: 'cc.Node', _name: name, _objFlags: 0,
            parent: parentRef, _children: [], _active: true, _components: [],
            _prefab: null,
            _lpos: { __type__: 'cc.Vec3', x: pos[0], y: pos[1], z: pos[2] },
            _lrot: { __type__: 'cc.Quat', x: 0, y: 0, z: 0, w: 1 },
            _lscale: { __type__: 'cc.Vec3', x: 1, y: 1, z: 1 },
            _mobility: 0, _layer: LAYER_UI,
            _euler: { __type__: 'cc.Vec3', x: 0, y: 0, z: 0 },
            _id: `node-${parentId}-${name}`
        };
        objects.push(obj);

        const parentObj = objects[parentId];
        parentObj._children.push(nodeRef);

        const uitfId = addObject({ ...makeUITransform(size[0], size[1]), node: nodeRef });
        const labelComp = makeLabelString(text);
        labelComp._fontSize = fontSize; labelComp._actualFontSize = fontSize; labelComp._lineHeight = fontSize + 6;
        labelComp._color = { __type__: 'cc.Color', r: color[0], g: color[1], b: color[2], a: color[3] };
        labelComp.node = nodeRef;
        const labelId = addObject(labelComp);
        obj._components = [{ __id__: uitfId }, { __id__: labelId }];
        if (key) labelIds[key] = labelId;
        return { nodeId, labelId };
    }

    function createContainerChild(parentRef: any, parentId: number, name: string,
        pos: [number, number, number], size: [number, number], key?: string): number {
        const nodeId = nextId();
        const nodeRef = { __id__: nodeId };
        const obj: any = {
            __type__: 'cc.Node', _name: name, _objFlags: 0,
            parent: parentRef, _children: [], _active: true, _components: [],
            _prefab: null,
            _lpos: { __type__: 'cc.Vec3', x: pos[0], y: pos[1], z: pos[2] },
            _lrot: { __type__: 'cc.Quat', x: 0, y: 0, z: 0, w: 1 },
            _lscale: { __type__: 'cc.Vec3', x: 1, y: 1, z: 1 },
            _mobility: 0, _layer: LAYER_UI,
            _euler: { __type__: 'cc.Vec3', x: 0, y: 0, z: 0 },
            _id: `node-${parentId}-${name}`
        };
        objects.push(obj);
        const parentObj = objects[parentId];
        parentObj._children.push(nodeRef);

        const uitfId = addObject({ ...makeUITransform(size[0], size[1]), node: nodeRef });
        obj._components = [{ __id__: uitfId }];
        if (key) nodeIds[key] = nodeId;
        return nodeId;
    }

    function createButton(parentRef: any, parentId: number, name: string, labelText: string,
        pos: [number, number, number], size: [number, number],
        btnColor: [number, number, number, number] = [80, 120, 160, 255], key?: string): { nodeId: number, buttonId: number } {
        const nodeId = nextId();
        const nodeRef = { __id__: nodeId };
        const obj: any = {
            __type__: 'cc.Node', _name: name, _objFlags: 0,
            parent: parentRef, _children: [], _active: true, _components: [],
            _prefab: null,
            _lpos: { __type__: 'cc.Vec3', x: pos[0], y: pos[1], z: pos[2] },
            _lrot: { __type__: 'cc.Quat', x: 0, y: 0, z: 0, w: 1 },
            _lscale: { __type__: 'cc.Vec3', x: 1, y: 1, z: 1 },
            _mobility: 0, _layer: LAYER_UI,
            _euler: { __type__: 'cc.Vec3', x: 0, y: 0, z: 0 },
            _id: `btn-${parentId}-${name}`
        };
        objects.push(obj);
        const parentObj = objects[parentId];
        parentObj._children.push(nodeRef);

        const uitfId = addObject({ ...makeUITransform(size[0], size[1]), node: nodeRef });
        const spriteId = addObject({ ...makeSprite(btnColor[0], btnColor[1], btnColor[2], btnColor[3]), node: nodeRef });
        const buttonComp = makeButton();
        buttonComp.node = nodeRef;
        buttonComp._target = nodeRef;
        buttonComp._normalColor = { __type__: 'cc.Color', r: btnColor[0], g: btnColor[1], b: btnColor[2], a: btnColor[3] };
        const btnId = addObject(buttonComp);
        obj._components = [{ __id__: uitfId }, { __id__: spriteId }, { __id__: btnId }];

        // label child
        const labelResult = createLabelChild(nodeRef, nodeId, 'Label', labelText, [0, 0, 0], size, 24);

        if (key) buttonIds[key] = btnId;
        return { nodeId, buttonId: btnId };
    }

    function addScriptToNode(nodeId: number, uuid: string, extra: Record<string, any> = {}): number {
        const nodeRef = { __id__: nodeId };
        const scriptObj: any = {
            __type__: 'cc.Component', _name: '', _objFlags: 0, node: nodeRef,
            _enabled: true, __prefab: null,
            __scriptAsset: { __uuid__: uuid, __expectedType__: 'cc.Script' },
            ...extra,
            _id: `script-${uuid}-${nodeId}`
        };
        const id = addObject(scriptObj);
        objects[nodeId]._components.push({ __id__: id });
        return id;
    }

    // ---- MissionHallPanel ----
    {
        const { nodeId: hallId, nodeRef: hallRef, obj: hallObj } =
            createPanel('MissionHallPanel', false, [25, 45, 70], 'hallPanel');
        nodeIds.missionHallPanel = hallId;

        createLabelChild(hallRef, hallId, 'TitleLabel', '⚖️ 任务大厅 - 法律服务案件委托',
            [0, 560, 0], [700, 70], 38, [255, 220, 140, 255]);

        const { labelId: plId } = createLabelChild(hallRef, hallId, 'PlayerInfoLabel',
            '玩家: Player | 总分: 0 | 已完成案件: 0',
            [0, 480, 0], [700, 40], 24, [210, 210, 210, 255], 'playerInfoLabel');
        labelIds.playerInfoLabel = plId;

        // 菜单按钮组
        const menuBtns = createContainerChild(hallRef, hallId, 'MenuButtons', [0, -560, 0], [750, 80], 'hallMenuBtns');
        const menuBtnsRef = { __id__: menuBtns };
        createButton(menuBtnsRef, menuBtns, 'ClientArchiveButton', '📇 客户档案', [-240, 0, 0], [200, 70], [60, 90, 140, 255], 'btnClientArchive');
        createButton(menuBtnsRef, menuBtns, 'TrainingButton', '📊 训练复盘', [0, 0, 0], [200, 70], [60, 90, 140, 255], 'btnTraining');
        createButton(menuBtnsRef, menuBtns, 'LeaderboardButton', '🏆 排行榜', [240, 0, 0], [200, 70], [60, 90, 140, 255], 'btnLeaderboard');

        // 案件列表容器
        createContainerChild(hallRef, hallId, 'CaseList', [0, 0, 0], [700, 700], 'caseListContainer');
    }

    // ---- CasePlayPanel ----
    {
        const { nodeId, nodeRef, obj } = createPanel('CasePlayPanel', false, [30, 50, 75], 'casePlayPanel');
        nodeIds.casePlayPanel = nodeId;

        const { labelId: silId } = createLabelChild(nodeRef, nodeId, 'StageInfoLabel',
            '案件: xxx | 阶段: 案件受理 | 得分: 0/100',
            [0, 580, 0], [720, 100], 26, [255, 240, 200, 255], 'stageInfoLabel');
        labelIds.stageInfoLabel = silId;

        createContainerChild(nodeRef, nodeId, 'ClueArea', [0, 200, 0], [700, 400], 'clueListContainer');
        createContainerChild(nodeRef, nodeId, 'ActionArea', [0, -250, 0], [700, 500], 'actionListContainer');
    }

    // ---- CluePanel ----
    {
        const { nodeId, nodeRef, obj } = createPanel('CluePanel', false, [20, 30, 50], 'cluePanel');
        nodeIds.cluePanel = nodeId;
    }

    // ---- ResultPanel ----
    {
        const { nodeId, nodeRef, obj } = createPanel('ResultPanel', false, [20, 35, 55], 'resultPanel');
        nodeIds.resultPanel = nodeId;

        createLabelChild(nodeRef, nodeId, 'TitleLabel', '📋 案件结算',
            [0, 580, 0], [700, 70], 40, [255, 220, 140, 255]);

        const { labelId: ciId } = createLabelChild(nodeRef, nodeId, 'CaseInfoLabel', '案件：xxx',
            [0, 490, 0], [700, 50], 26, [230, 230, 230, 255], 'resultCaseInfoLabel');
        labelIds.resultCaseInfoLabel = ciId;

        const { labelId: scId } = createLabelChild(nodeRef, nodeId, 'ScoreLabel', '得分: 0/100',
            [0, 420, 0], [700, 70], 40, [255, 200, 80, 255], 'resultScoreLabel');
        labelIds.resultScoreLabel = scId;

        const { labelId: resId } = createLabelChild(nodeRef, nodeId, 'ResultLabel', '结果：通过',
            [0, 360, 0], [700, 40], 28, [100, 255, 150, 255], 'resultResultLabel');
        labelIds.resultResultLabel = resId;

        createLabelChild(nodeRef, nodeId, 'ErrorsTitleLabel', '❌ 错因记录',
            [-280, 280, 0], [200, 40], 24, [255, 140, 140, 255]);

        createContainerChild(nodeRef, nodeId, 'ErrorsContainer',
            [0, 120, 0], [700, 280], 'resultErrorsContainer');

        createLabelChild(nodeRef, nodeId, 'MissTitleLabel', '⚠️ 材料缺页',
            [-280, -40, 0], [200, 40], 24, [255, 200, 120, 255]);

        createContainerChild(nodeRef, nodeId, 'MissContainer',
            [0, -210, 0], [700, 220], 'resultMissContainer');

        // 按钮组
        const btns = createContainerChild(nodeRef, nodeId, 'ResultButtons', [0, -500, 0], [750, 100], 'resultBtns');
        const btnsRef = { __id__: btns };
        createButton(btnsRef, btns, 'BackButton', '返回大厅', [-240, 0, 0], [200, 80], [80, 80, 100, 255], 'btnResultBack');
        createButton(btnsRef, btns, 'ReviewButton', '📊 复盘记录', [0, 0, 0], [200, 80], [60, 100, 160, 255], 'btnResultReview');
        createButton(btnsRef, btns, 'RetryButton', '🔄 再玩一次', [240, 0, 0], [200, 80], [50, 140, 90, 255], 'btnResultRetry');
    }

    // ---- ClientArchivePanel ----
    {
        const { nodeId, nodeRef, obj } = createPanel('ClientArchivePanel', false, [25, 45, 65], 'clientArchivePanel');
        nodeIds.clientArchivePanel = nodeId;

        createLabelChild(nodeRef, nodeId, 'TitleLabel', '📇 客户档案',
            [0, 600, 0], [700, 60], 36, [255, 220, 140, 255]);
        createLabelChild(nodeRef, nodeId, 'UnlockedCountLabel', '已解锁客户: 0/4',
            [0, 540, 0], [700, 40], 22, [210, 210, 210, 255]);
        createContainerChild(nodeRef, nodeId, 'ClientContent', [0, 200, 0], [700, 600], 'clientContent');
        createButton(nodeRef, nodeId, 'CloseButton', '关闭', [300, 600, 0], [100, 60], [140, 60, 60, 255], 'btnCloseClientArchive');

        // Mount ClientArchiveUI script
        addScriptToNode(nodeId, '5a7e8d10-3b4c-4e5f-9a6b-7c8d9e0f1a2e', {});
    }

    // ---- TrainingRecordPanel ----
    {
        const { nodeId, nodeRef, obj } = createPanel('TrainingRecordPanel', false, [25, 40, 65], 'trainingRecordPanel');
        nodeIds.trainingRecordPanel = nodeId;

        createLabelChild(nodeRef, nodeId, 'TitleLabel', '📊 训练复盘',
            [0, 600, 0], [700, 60], 36, [255, 220, 140, 255]);
        createLabelChild(nodeRef, nodeId, 'StatsLabel', '训练次数: 0 | 平均分: 0 | 通过率: 0%',
            [0, 540, 0], [700, 40], 22, [210, 210, 210, 255]);
        createContainerChild(nodeRef, nodeId, 'RecordContent', [0, 200, 0], [700, 600], 'trainingContent');
        createButton(nodeRef, nodeId, 'CloseButton', '关闭', [300, 600, 0], [100, 60], [140, 60, 60, 255], 'btnCloseTraining');

        // Mount TrainingRecordUI script
        addScriptToNode(nodeId, '5a7e8d10-3b4c-4e5f-9a6b-7c8d9e0f1a2f', {});
    }

    // ---- LeaderboardPanel ----
    {
        const { nodeId, nodeRef, obj } = createPanel('LeaderboardPanel', false, [25, 40, 65], 'leaderboardPanel');
        nodeIds.leaderboardPanel = nodeId;

        createLabelChild(nodeRef, nodeId, 'TitleLabel', '🏆 排行榜',
            [0, 600, 0], [700, 60], 36, [255, 220, 140, 255]);
        createLabelChild(nodeRef, nodeId, 'MyInfoLabel', '我的排名: 未上榜 | 得分: 0',
            [0, 540, 0], [700, 40], 22, [210, 210, 210, 255]);
        createContainerChild(nodeRef, nodeId, 'RankContent', [0, 200, 0], [700, 600], 'leaderboardContent');
        createButton(nodeRef, nodeId, 'CloseButton', '关闭', [300, 600, 0], [100, 60], [140, 60, 60, 255], 'btnCloseLeaderboard');

        // Mount LeaderboardUI script
        addScriptToNode(nodeId, '5a7e8d10-3b4c-4e5f-9a6b-7c8d9e0f1a30', {});
    }
}

buildChildren();

// ---- SceneGlobals ----
const ambientId = addObject({
    __type__: 'cc.AmbientInfo', _name: '', _objFlags: 0,
    _skyColorHDR: { __type__: 'cc.Vec4', x: 0.2, y: 0.5, z: 0.8, w: 0.520833 },
    _skyColor: { __type__: 'cc.Vec4', x: 0.2, y: 0.5, z: 0.8, w: 0.520833 },
    _skyIllumHDR: 20000, _skyIllum: 20000,
    _groundAlbedoHDR: { __type__: 'cc.Vec4', x: 0.2, y: 0.2, z: 0.2, w: 1 },
    _groundAlbedo: { __type__: 'cc.Vec4', x: 0.2, y: 0.2, z: 0.2, w: 1 },
    _skyColorLDR: { __type__: 'cc.Vec4', x: 0.452588, y: 0.607642, z: 0.755833, w: 0.520833 },
    _groundAlbedoLDR: { __type__: 'cc.Vec4', x: 0.513325, y: 0.513325, z: 0.513325, w: 1 },
    _skyType: 0, _skyEnvmapHDR: null, _skyEnvmapLDR: null, _skyEnvmap: null,
    _skyReflectionHDR: null, _skyReflectionLDR: null, _skyReflection: null,
    _dynamicSkybox: false, _rotationAngle: 0
});
const shadowsId = addObject({
    __type__: 'cc.ShadowsInfo', _name: '', _objFlags: 0, _enabled: false, _type: 0,
    _normal: { __type__: 'cc.Vec3', x: 0, y: 1, z: 0 }, _distance: 0, _planeOpacity: 1,
    _shadowColor: { __type__: 'cc.Color', r: 76, g: 76, b: 76, a: 255 },
    _maxReceived: 4, _size: { __type__: 'cc.Vec2', x: 512, y: 512 }
});
const skyboxId = addObject({
    __type__: 'cc.SkyboxInfo', _name: '', _objFlags: 0, _envLightingType: 0,
    _envmapHDR: null, _envmapLDR: null, _envmap: null,
    _envmapIntensity: 1.1, _envmapIntensityLDR: 1.1,
    _reflectionHDR: null, _reflectionLDR: null, _reflection: null,
    _reflectionIntensity: 1, _reflectionIntensityLDR: 1, _useIBL: false
});
const fogId = addObject({
    __type__: 'cc.FogInfo', _name: '', _objFlags: 0, _type: 0,
    _fogColor: { __type__: 'cc.Color', r: 200, g: 200, b: 200, a: 255 },
    _enabled: false, _fogDensity: 0.3, _fogStart: 0.5, _fogEnd: 300,
    _fogAtten: 5, _fogTop: 1.5, _fogRange: 1.2, _accurate: false
});
const octreeId = addObject({
    __type__: 'cc.OctreeInfo', _name: '', _objFlags: 0, _enabled: false,
    _minPos: { __type__: 'cc.Vec3', x: -1024, y: -1024, z: -1024 },
    _maxPos: { __type__: 'cc.Vec3', x: 1024, y: 1024, z: 1024 }, _depth: 8
});
const skinId = addObject({
    __type__: 'cc.SkinInfo', _name: '', _objFlags: 0, _enabled: false, _blurRadius: 0.01, _sssIntensity: 3
});
const lightProbeId = addObject({
    __type__: 'cc.LightProbeInfo', _name: '', _objFlags: 0,
    _giScale: 1, _giSamples: 1024, _bounces: 2, _reduceRinging: 0,
    _showProbe: true, _showWireframe: true, _showConvex: false, _data: null
});
const postSettingsId = addObject({
    __type__: 'cc.PostSettingsInfo', _name: '', _objFlags: 0, _toneMappingType: 0, _toneMappingExposure: 1
});
const globalsId = addObject({
    __type__: 'cc.SceneGlobals', _name: '', _objFlags: 0,
    ambient: { __id__: ambientId }, shadows: { __id__: shadowsId },
    _skybox: { __id__: skyboxId }, fog: { __id__: fogId },
    octree: { __id__: octreeId }, skin: { __id__: skinId },
    lightProbeInfo: { __id__: lightProbeId }, postSettings: { __id__: postSettingsId },
    bakedWithStationaryMainLight: false, bakedWithHighpLightmap: false
});
sceneObj._globals = { __id__: globalsId };

// ---- Patch the MainSceneController script component with all refs ----
{
    const scriptObj = objects[scriptIds.controller];
    scriptObj.missionHallPanel = { __id__: nodeIds.missionHallPanel };
    scriptObj.casePlayPanel = { __id__: nodeIds.casePlayPanel };
    scriptObj.cluePanel = { __id__: nodeIds.cluePanel };
    scriptObj.resultPanel = { __id__: nodeIds.resultPanel };
    scriptObj.loadingLabel = { __id__: labelIds.loadingLabel };
    scriptObj.loadingPanel = { __id__: nodeIds.loadingPanel };
    scriptObj.caseListContainer = { __id__: nodeIds.caseListContainer };
    scriptObj.clueListContainer = { __id__: nodeIds.clueListContainer };
    scriptObj.actionListContainer = { __id__: nodeIds.actionListContainer };
    scriptObj.stageInfoLabel = { __id__: labelIds.stageInfoLabel };
    scriptObj.playerInfoLabel = { __id__: labelIds.playerInfoLabel };
    scriptObj.mapManagerNode = { __id__: nodeIds.mapNode };
    scriptObj.clientArchivePanel = { __id__: nodeIds.clientArchivePanel };
    scriptObj.trainingRecordPanel = { __id__: nodeIds.trainingRecordPanel };
    scriptObj.leaderboardPanel = { __id__: nodeIds.leaderboardPanel };
    scriptObj.resultScoreLabel = { __id__: labelIds.resultScoreLabel };
    scriptObj.resultCaseInfoLabel = { __id__: labelIds.resultCaseInfoLabel };
    scriptObj.resultResultLabel = { __id__: labelIds.resultResultLabel };
    scriptObj.resultErrorsContainer = { __id__: nodeIds.resultErrorsContainer };
    scriptObj.resultMissContainer = { __id__: nodeIds.resultMissContainer };
}

// Write file
const outPath = path.join(process.cwd(), 'assets/scenes/MainScene.scene');
fs.writeFileSync(outPath, JSON.stringify(objects, null, 2));
console.log(`Generated scene with ${objects.length} objects at ${outPath}`);
console.log('Key node IDs:', nodeIds);
console.log('Key label IDs:', labelIds);
console.log('Key script IDs:', scriptIds);
console.log('Key button IDs:', buttonIds);
