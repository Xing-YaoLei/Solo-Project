#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const UUID_MAP = require(path.join(PROJECT_ROOT, 'temp', 'uuid-map.json'));

let nextId = 1;
const objects = [];
const nodeNames = {};

function newObj(type, fields = {}) {
  const id = nextId++;
  const obj = Object.assign({ __id__: id, __type__: type }, fields);
  objects.push({ id, obj });
  return id;
}
function ref(id) { return { __id__: id }; }
function uid(name) { return nodeNames[name] || `auto-${Date.now()}-${name}`; }
function vec3(x = 0, y = 0, z = 0) { return { __type__: 'cc.Vec3', x, y, z }; }
function vec2(x = 0, y = 0) { return { __type__: 'cc.Vec2', x, y }; }
function quat() { return { __type__: 'cc.Quat', x: 0, y: 0, z: 0, w: 1 }; }
function size(w = 100, h = 100) { return { __type__: 'cc.Size', width: w, height: h }; }
function color(r = 255, g = 255, b = 255, a = 255) { return { __type__: 'cc.Color', r, g, b, a }; }

function findScriptUuid(filename) { return UUID_MAP[filename] || filename; }
function scriptType(filename) {
  const uuid = findScriptUuid(filename);
  return `s${uuid.replace(/-/g, '')}`;
}

let nodeCounter = 0;
function nextNodeName(prefix) { nodeCounter++; return `${prefix}-${nodeCounter}`; }

function findObj(id) { return objects.find(o => o.id === id).obj; }

function createNode(name, parent, children = [], components = [], opts = {}) {
  const pos = opts.pos || vec3();
  const scale = opts.scale || vec3(1, 1, 1);
  const active = opts.active !== undefined ? opts.active : true;
  const layer = opts.layer !== undefined ? opts.layer : 33554432;
  const nid = newObj('cc.Node', {
    _name: name, _objFlags: 0, '__editorExtras__': {},
    _parent: parent ? ref(parent) : null,
    _children: children.map(c => ref(c)),
    _active: active,
    _components: components.map(c => ref(c)),
    _prefab: null, _lpos: pos, _lrot: quat(), _lscale: scale,
    _mobility: 0, _layer: layer, _euler: vec3(),
    _id: uid(nextNodeName(name))
  });
  return nid;
}

function createUITransform(nodeId, w, h, ax = 0.5, ay = 0.5) {
  return newObj('cc.UITransform', {
    _name: '', _objFlags: 0, node: ref(nodeId), _enabled: true, __prefab: null,
    _id: uid(nextNodeName('ui-')), __scriptAsset: null, __node: ref(nodeId),
    _contentSize: size(w, h), _anchorPoint: vec2(ax, ay)
  });
}

function createLabel(nodeId, text, fontSize = 20, color_v = { r: 255, g: 255, b: 255, a: 255 }) {
  return newObj('cc.Label', {
    _name: '', _objFlags: 0, node: ref(nodeId), _enabled: true, __prefab: null,
    _id: uid(nextNodeName('label-')), __scriptAsset: null, __node: ref(nodeId),
    _string: text, _horizontalAlign: 1, _verticalAlign: 1,
    _actualFontSize: fontSize, _fontSize: fontSize, _fontFamily: 'Arial',
    _lineHeight: fontSize * 1.2, _overflow: 0, _enableWrapText: true,
    _font: null, _isSystemFontUsed: true, _spacingX: 0, _cacheMode: 0,
    _color: color(color_v.r, color_v.g, color_v.b, color_v.a)
  });
}

function createSprite(nodeId, color_v = { r: 50, g: 50, b: 70, a: 255 }) {
  return newObj('cc.Sprite', {
    _name: '', _objFlags: 0, node: ref(nodeId), _enabled: true, __prefab: null,
    _id: uid(nextNodeName('sprite-')), __scriptAsset: null, __node: ref(nodeId),
    _spriteFrame: null, _type: 0, _fillType: 0, _sizeMode: 1,
    _fillCenter: vec2(0.5, 0.5), _fillStart: 0, _fillRange: 0,
    _isTrimmedMode: true, _useGrayscale: false, _atlas: null,
    _color: color(color_v.r, color_v.g, color_v.b, color_v.a),
    _flipX: false, _flipY: false,
    _insetLeft: 0, _insetRight: 0, _insetTop: 0, _insetBottom: 0
  });
}

function createButton(nodeId) {
  return newObj('cc.Button', {
    _name: '', _objFlags: 0, node: ref(nodeId), _enabled: true, __prefab: null,
    _id: uid(nextNodeName('btn-')), __scriptAsset: null, __node: ref(nodeId),
    clickEvents: [], _interactable: true, _transition: 2,
    _normalColor: color(255, 255, 255, 255), _pressedColor: color(200, 200, 200, 255),
    _hoverColor: color(211, 211, 211, 255), _disabledColor: color(124, 124, 124, 255),
    _duration: 0.1, _zoomScale: 1.2, _target: ref(nodeId)
  });
}

function createScript(nodeId, scriptFile, props = {}) {
  const uuid = findScriptUuid(scriptFile);
  const base = {
    _name: '', _objFlags: 0, node: ref(nodeId), _enabled: true, __prefab: null,
    _id: uid(nextNodeName(`scr-${scriptFile}-`)),
    __scriptAsset: { __uuid__: uuid, __expectedType__: 'cc.Script' },
    __node: ref(nodeId)
  };
  return newObj(scriptType(scriptFile), Object.assign(base, props));
}

function createCamera(nodeId) {
  return newObj('cc.Camera', {
    _name: '', _objFlags: 0, node: ref(nodeId), _enabled: true, __prefab: null,
    _id: uid(nextNodeName('cam-')), __scriptAsset: null, __node: ref(nodeId),
    _projection: 0, _priority: 1, _fov: 45, _fovAxis: 0, _orthoHeight: 384,
    _near: 1, _far: 2000, _color: color(51, 128, 204, 255), _depth: 1, _stencil: 0,
    _clearFlags: 7, _rect: { __type__: 'cc.Rect', x: 0, y: 0, width: 1, height: 1 },
    _aperture: 19, _shutter: 7, _iso: 0, _screenScale: 1,
    _visibility: 1082130432, _targetTexture: null, _cameraType: -1, _trackingType: 0
  });
}

function createTiledMap(nodeId, tmxUuid) {
  return newObj('cc.TiledMap', {
    _name: '', _objFlags: 0, node: ref(nodeId), _enabled: true, __prefab: null,
    _id: uid(nextNodeName('tiledmap-')), __scriptAsset: null, __node: ref(nodeId),
    _tmxFile: tmxUuid ? { __uuid__: tmxUuid, __expectedType__: 'cc.TiledMapAsset' } : null
  });
}

function createGlobals() {
  return newObj('cc.SceneGlobals', {
    ambient: ref(newObj('cc.AmbientInfo', {
      _skyColorHDR: { __type__: 'cc.Vec4', x: 0.2, y: 0.5, z: 0.8, w: 0.520833 },
      _skyColor: color(51, 128, 204, 255), _skyIllumHDR: 20000, _skyIllum: 20000,
      _groundAlbedoHDR: { __type__: 'cc.Vec4', x: 0.2, y: 0.2, z: 0.2, w: 1 },
      _groundAlbedo: color(51, 51, 51, 255)
    })),
    shadows: ref(newObj('cc.ShadowsInfo', {
      _enabled: false, _type: 0, _normal: vec3(0, 1, 0), _distance: 0,
      _shadowColor: color(76, 76, 76, 255)
    })),
    _skybox: ref(newObj('cc.SkyboxInfo', {
      _enabled: false, _useHDR: true, _envMap: null, _diffuseMap: null
    })),
    fog: ref(newObj('cc.FogInfo', {
      _enabled: false, _type: 0, _fogColor: color(200, 200, 200, 255),
      _fogDensity: 0, _fogStart: 0, _fogEnd: 0, _fogAtten: 0, _fogTop: 0, _fogRange: 0
    })),
    octree: ref(newObj('cc.OctreeInfo', { _enabled: false })),
    skin: ref(newObj('cc.SkinInfo', { _enabled: false })),
    lightProbeInfo: ref(newObj('cc.LightProbeInfo', {
      _giScale: 1, _giBounce: 1, _giIntensity: 1, _giSampleCount: 256,
      _giMaxBounces: 2, _giRhoMin: 0.02, _giRhoMax: 1, _giLeakFactor: 0.99,
      _giIllum: 1, _giAdaptiveThreshold: 0.0005, _giMaxDistance: 100, _giMinDistance: 0.1,
      _giMaxSamples: 256, _giMaxCacheEntries: 2048, _giRhoMinSamples: 1,
      _giRhoMaxSamples: 64, _giLeakFactorSamples: 1, _giIllumSamples: 1,
      _giAdaptiveThresholdSamples: 1, _giMaxDistanceSamples: 1, _giMinDistanceSamples: 1,
      _giMaxCacheEntriesSamples: 1
    })),
    postSettings: ref(newObj('cc.PostSettingsInfo', { _toneMappingType: 0 })),
    bakedWithStationaryMainLight: false, bakedWithHighpLightmap: false
  });
}

function createLabelNode(name, parent, text, pos, w = 200, h = 40, fontSize = 20, color_v) {
  const uiTId = createUITransform(null, w, h);
  const labelCId = createLabel(null, text, fontSize, color_v);
  const nid = createNode(name, parent, [], [uiTId, labelCId], { pos });
  findObj(uiTId).node = ref(nid); findObj(uiTId).__node = ref(nid);
  findObj(labelCId).node = ref(nid); findObj(labelCId).__node = ref(nid);
  return nid;
}

function createButtonNode(name, parent, labelText, pos, w = 160, h = 48, fontSize = 20) {
  const uiTId = createUITransform(null, w, h);
  const spriteId = createSprite(null, { r: 255, g: 200, b: 80, a: 255 });
  const btnId = createButton(null);
  const labelNodeId = createLabelNode(`${name}-lbl`, null, labelText, vec3(0, 0, 0), w, h, fontSize, { r: 0, g: 0, b: 0, a: 255 });
  const nid = createNode(name, parent, [labelNodeId], [uiTId, spriteId, btnId], { pos });
  findObj(uiTId).node = ref(nid); findObj(uiTId).__node = ref(nid);
  findObj(spriteId).node = ref(nid); findObj(spriteId).__node = ref(nid);
  findObj(btnId).node = ref(nid); findObj(btnId).__node = ref(nid);
  findObj(btnId)._target = ref(nid);
  return nid;
}

function createPanelBg(name, parent, w, h, pos, active = true, color_v = { r: 30, g: 30, b: 45, a: 245 }) {
  const uiTId = createUITransform(null, w, h);
  const spriteId = createSprite(null, color_v);
  const nid = createNode(name, parent, [], [uiTId, spriteId], { pos, active });
  findObj(uiTId).node = ref(nid); findObj(uiTId).__node = ref(nid);
  findObj(spriteId).node = ref(nid); findObj(spriteId).__node = ref(nid);
  return nid;
}

function createListNode(name, parent, pos, w, h) {
  const uiTId = createUITransform(null, w, h);
  const spriteId = createSprite(null, { r: 50, g: 50, b: 70, a: 180 });
  const nid = createNode(name, parent, [], [uiTId, spriteId], { pos });
  findObj(uiTId).node = ref(nid); findObj(uiTId).__node = ref(nid);
  findObj(spriteId).node = ref(nid); findObj(spriteId).__node = ref(nid);
  return nid;
}

function createTemplateNode(name, parent, pos, w, h) {
  const uiTId = createUITransform(null, w, h);
  const spriteId = createSprite(null, { r: 80, g: 80, b: 120, a: 200 });
  const nid = createNode(name, parent, [], [uiTId, spriteId], { pos, active: false });
  findObj(uiTId).node = ref(nid); findObj(uiTId).__node = ref(nid);
  findObj(spriteId).node = ref(nid); findObj(spriteId).__node = ref(nid);
  return nid;
}

function addChildren(parentId, childIds) {
  const p = findObj(parentId);
  const existing = p._children || [];
  for (const cid of childIds) existing.push(ref(cid));
  p._children = existing;
  for (const cid of childIds) {
    const c = findObj(cid);
    if (c._parent === null || c._parent === undefined || Object.keys(c._parent).length === 0) c._parent = ref(parentId);
  }
}

function addComponents(nodeId, compIds) {
  const n = findObj(nodeId);
  n._components = (n._components || []).concat(compIds.map(c => ref(c)));
}

function buildMainMenu(canvasId) {
  const bgId = createPanelBg('MainMenu', canvasId, 960, 640, vec3(0, 0, 0), true);
  const titleId = createLabelNode('title', bgId, '家装工地量房报价模拟器', vec3(0, 220, 0), 800, 80, 48, { r: 255, g: 215, b: 0, a: 255 });
  const startBtnId = createButtonNode('startBtn', bgId, '开始游戏', vec3(-200, 60, 0), 200, 56, 22);
  const levelSelectBtnId = createButtonNode('levelSelBtn', bgId, '关卡选择', vec3(200, 60, 0), 200, 56, 22);
  const leaderboardBtnId = createButtonNode('leaderBtn', bgId, '排行榜', vec3(-200, -20, 0), 200, 56, 22);
  const tutorialBtnId = createButtonNode('tutorialBtn', bgId, '新手教程', vec3(200, -20, 0), 200, 56, 22);
  const hintId = createLabelNode('hint', bgId, '键盘：Enter 确认 / ↑↓←→ 操作 / R 重开', vec3(0, -200, 0), 800, 40, 16, { r: 180, g: 180, b: 200, a: 255 });

  const sId = createScript(bgId, 'MainMenu', {
    titleLabel: ref(titleId), startButton: ref(startBtnId),
    levelSelectButton: ref(levelSelectBtnId), leaderboardButton: ref(leaderboardBtnId),
    tutorialButton: ref(tutorialBtnId)
  });
  findObj(sId).node = ref(bgId); findObj(sId).__node = ref(bgId);

  addChildren(bgId, [titleId, startBtnId, levelSelectBtnId, leaderboardBtnId, tutorialBtnId, hintId]);
  addComponents(bgId, [sId]);
  return bgId;
}

function buildHUD(canvasId) {
  const bgId = createPanelBg('HUD', canvasId, 960, 60, vec3(0, 290, 0), false, { r: 20, g: 20, b: 30, a: 240 });
  const scoreLblId = createLabelNode('scoreLbl', bgId, '得分：0', vec3(-350, 0, 0), 220, 36, 20, { r: 255, g: 255, b: 255, a: 255 });
  const moneyLblId = createLabelNode('moneyLbl', bgId, '回款：¥0', vec3(-100, 0, 0), 220, 36, 20, { r: 0, g: 255, b: 128, a: 255 });
  const timeLblId = createLabelNode('timeLbl', bgId, '时间：0s', vec3(150, 0, 0), 220, 36, 20, { r: 255, g: 200, b: 0, a: 255 });
  const phaseLblId = createLabelNode('phaseLbl', bgId, '阶段：准备', vec3(350, 0, 0), 220, 36, 18, { r: 180, g: 200, b: 255, a: 255 });
  const pauseBtnId = createButtonNode('pauseBtn', bgId, '暂停', vec3(420, 0, 0), 80, 36, 16);
  const menuBtnId = createButtonNode('menuBtn', bgId, '菜单', vec3(-430, 0, 0), 80, 36, 16);

  const sId = createScript(bgId, 'HUD', {
    scoreLabel: ref(scoreLblId), moneyLabel: ref(moneyLblId), timeLabel: ref(timeLblId),
    phaseLabel: ref(phaseLblId), pauseButton: ref(pauseBtnId), menuButton: ref(menuBtnId)
  });
  findObj(sId).node = ref(bgId); findObj(sId).__node = ref(bgId);

  addChildren(bgId, [scoreLblId, moneyLblId, timeLblId, phaseLblId, pauseBtnId, menuBtnId]);
  addComponents(bgId, [sId]);
  return bgId;
}

function buildTaskBriefing(canvasId) {
  const bgId = createPanelBg('TaskBriefingPanel', canvasId, 800, 500, vec3(0, 0, 0), false);
  const t1 = createLabelNode('titleLbl', bgId, '任务简报', vec3(0, 220, 0), 600, 48, 32, { r: 255, g: 215, b: 0, a: 255 });
  const t2 = createLabelNode('descLbl', bgId, '任务描述加载中...', vec3(0, 130, 0), 700, 80, 20, { r: 230, g: 230, b: 255, a: 255 });
  const t3 = createLabelNode('objLbl', bgId, '任务目标：完成单据填写和审批', vec3(0, 50, 0), 700, 40, 18, { r: 180, g: 255, b: 180, a: 255 });
  const t4 = createLabelNode('rewardLbl', bgId, '任务奖励：¥0', vec3(-250, -10, 0), 300, 40, 18, { r: 0, g: 255, b: 128, a: 255 });
  const t5 = createLabelNode('timeLbl', bgId, '时限：0秒', vec3(250, -10, 0), 300, 40, 18, { r: 255, g: 200, b: 0, a: 255 });
  const t6 = createLabelNode('diffLbl', bgId, '难度：★★☆☆☆', vec3(0, -70, 0), 300, 40, 20, { r: 255, g: 160, b: 0, a: 255 });
  const b1 = createButtonNode('startBtn', bgId, '开始任务', vec3(0, -160, 0), 240, 56, 24);

  const sId = createScript(bgId, 'TaskBriefingPanel', {
    levelTitleLabel: ref(t1), descriptionLabel: ref(t2), objectiveLabel: ref(t3),
    rewardLabel: ref(t4), timeLimitLabel: ref(t5), difficultyLabel: ref(t6), startButton: ref(b1)
  });
  findObj(sId).node = ref(bgId); findObj(sId).__node = ref(bgId);

  addChildren(bgId, [t1, t2, t3, t4, t5, t6, b1]);
  addComponents(bgId, [sId]);
  return bgId;
}

function buildCluePanel(canvasId) {
  const bgId = createPanelBg('CluePanel', canvasId, 860, 520, vec3(0, 0, 0), false);
  const t1 = createLabelNode('titleLbl', bgId, '线索调查', vec3(0, 230, 0), 400, 40, 28, { r: 255, g: 215, b: 0, a: 255 });
  const list = createListNode('clueList', bgId, vec3(-280, 0, 0), 240, 380);
  const detail = createListNode('clueDetail', bgId, vec3(180, 40, 0), 420, 300);
  const contentLbl = createLabelNode('clueContentLbl', detail, '点击左侧线索查看详情', vec3(0, 0, 0), 380, 250, 18, { r: 220, g: 220, b: 240, a: 255 });
  addChildren(detail, [contentLbl]);

  const b1 = createButtonNode('continueBtn', bgId, '继续 →', vec3(300, -190, 0), 160, 44, 18);
  const b2 = createButtonNode('toDocBtn', bgId, '填写单据 →', vec3(100, -190, 0), 180, 44, 18);

  const sId = createScript(bgId, 'CluePanel', {
    clueList: ref(list), clueContentLabel: ref(contentLbl), clueDetailNode: ref(detail),
    continueButton: ref(b1), toDocumentButton: ref(b2)
  });
  findObj(sId).node = ref(bgId); findObj(sId).__node = ref(bgId);

  addChildren(bgId, [t1, list, detail, b1, b2]);
  addComponents(bgId, [sId]);
  return bgId;
}

function buildDocumentPanel(canvasId) {
  const bgId = createPanelBg('DocumentPanel', canvasId, 880, 540, vec3(0, 0, 0), false);
  const t0 = createLabelNode('titleLbl', bgId, '单据填写', vec3(0, 240, 0), 400, 40, 28, { r: 255, g: 215, b: 0, a: 255 });
  const t1 = createLabelNode('docTitleLbl', bgId, '工程量清单', vec3(0, 195, 0), 600, 36, 22, { r: 230, g: 230, b: 255, a: 255 });
  const list = createListNode('itemList', bgId, vec3(0, 30, 0), 800, 340);
  const tmpl = createTemplateNode('itemTemplate', list, vec3(0, 120, 0), 780, 60);
  addChildren(list, [tmpl]);
  const tl = createLabelNode('totalLbl', bgId, '合计：¥0', vec3(-300, -190, 0), 300, 40, 22, { r: 0, g: 255, b: 128, a: 255 });
  const b1 = createButtonNode('submitBtn', bgId, '提交审批', vec3(300, -190, 0), 200, 52, 22);

  const sId = createScript(bgId, 'DocumentPanel', {
    itemList: ref(list), itemTemplate: ref(tmpl), totalLabel: ref(tl),
    documentTitleLabel: ref(t1), submitButton: ref(b1)
  });
  findObj(sId).node = ref(bgId); findObj(sId).__node = ref(bgId);

  addChildren(bgId, [t0, t1, list, tl, b1]);
  addComponents(bgId, [sId]);
  return bgId;
}

function buildApprovalPanel(canvasId) {
  const bgId = createPanelBg('ApprovalPanel', canvasId, 820, 520, vec3(0, 0, 0), false);
  const t0 = createLabelNode('titleLbl', bgId, '审批节点', vec3(0, 230, 0), 400, 40, 28, { r: 255, g: 215, b: 0, a: 255 });
  const t1 = createLabelNode('nodeTitleLbl', bgId, '审批标题', vec3(0, 175, 0), 700, 40, 24, { r: 255, g: 255, b: 255, a: 255 });
  const t2 = createLabelNode('nodeDescLbl', bgId, '审批说明文字...', vec3(0, 110, 0), 700, 80, 18, { r: 200, g: 220, b: 255, a: 255 });
  const t3 = createLabelNode('approverLbl', bgId, '审批人：项目经理', vec3(0, 50, 0), 500, 32, 18, { r: 180, g: 255, b: 180, a: 255 });
  const choices = createListNode('choicesContainer', bgId, vec3(0, -50, 0), 700, 180);
  const tmpl = createTemplateNode('choiceTemplate', choices, vec3(0, 60, 0), 680, 50);
  addChildren(choices, [tmpl]);
  const fbl = createLabelNode('feedbackLbl', bgId, '', vec3(0, -190, 0), 600, 30, 16, { r: 255, g: 200, b: 0, a: 255 });
  const b1 = createButtonNode('continueBtn', bgId, '继续 →', vec3(280, -220, 0), 160, 44, 18);

  const sId = createScript(bgId, 'ApprovalPanel', {
    nodeTitleLabel: ref(t1), nodeDescriptionLabel: ref(t2), approverLabel: ref(t3),
    choicesContainer: ref(choices), choiceTemplate: ref(tmpl),
    feedbackLabel: ref(fbl), continueButton: ref(b1)
  });
  findObj(sId).node = ref(bgId); findObj(sId).__node = ref(bgId);

  addChildren(bgId, [t0, t1, t2, t3, choices, fbl, b1]);
  addComponents(bgId, [sId]);
  return bgId;
}

function buildResultPanel(canvasId) {
  const bgId = createPanelBg('ResultPanel', canvasId, 720, 500, vec3(0, 0, 0), false);
  const t1 = createLabelNode('resultTitleLbl', bgId, '任务完成！', vec3(0, 210, 0), 600, 48, 32, { r: 255, g: 215, b: 0, a: 255 });
  const starsC = createListNode('starsContainer', bgId, vec3(0, 140, 0), 300, 60);
  const starT = createTemplateNode('starTemplate', starsC, vec3(0, 0, 0), 50, 50);
  addChildren(starsC, [starT]);
  const sl = createLabelNode('scoreLbl', bgId, '得分：0', vec3(-200, 60, 0), 280, 36, 22, { r: 255, g: 255, b: 255, a: 255 });
  const ml = createLabelNode('moneyLbl', bgId, '回款：¥0', vec3(200, 60, 0), 280, 36, 22, { r: 0, g: 255, b: 128, a: 255 });
  const tl = createLabelNode('timeLbl', bgId, '用时：0秒', vec3(0, 10, 0), 280, 36, 20, { r: 255, g: 200, b: 0, a: 255 });
  const b1 = createButtonNode('restartBtn', bgId, '再来一局', vec3(-250, -130, 0), 180, 52, 20);
  const b2 = createButtonNode('reviewBtn', bgId, '查看复盘', vec3(0, -130, 0), 180, 52, 20);
  const b3 = createButtonNode('menuBtn', bgId, '返回菜单', vec3(250, -130, 0), 180, 52, 20);
  const b4 = createButtonNode('nextLevelBtn', bgId, '下一关 →', vec3(0, -200, 0), 200, 48, 20);

  const sId = createScript(bgId, 'ResultPanel', {
    resultTitleLabel: ref(t1), scoreLabel: ref(sl), moneyLabel: ref(ml), timeLabel: ref(tl),
    starsContainer: ref(starsC), starTemplate: ref(starT),
    restartButton: ref(b1), reviewButton: ref(b2), menuButton: ref(b3), nextLevelButton: ref(b4)
  });
  findObj(sId).node = ref(bgId); findObj(sId).__node = ref(bgId);

  addChildren(bgId, [t1, starsC, sl, ml, tl, b1, b2, b3, b4]);
  addComponents(bgId, [sId]);
  return bgId;
}

function buildReviewPanel(canvasId) {
  const bgId = createPanelBg('ReviewPanel', canvasId, 820, 520, vec3(0, 0, 0), false);
  const t0 = createLabelNode('titleLbl', bgId, '复盘分析', vec3(0, 230, 0), 400, 40, 28, { r: 255, g: 215, b: 0, a: 255 });
  const t1 = createLabelNode('summaryLbl', bgId, '本局表现概览', vec3(0, 180, 0), 700, 40, 20, { r: 230, g: 230, b: 255, a: 255 });
  const el = createListNode('errorList', bgId, vec3(-260, 40, 0), 320, 280);
  const ml = createListNode('mismatchList', bgId, vec3(260, 40, 0), 320, 280);
  const il = createLabelNode('improvementLbl', bgId, '改进建议：继续保持', vec3(0, -130, 0), 720, 80, 16, { r: 180, g: 255, b: 180, a: 255 });
  const b1 = createButtonNode('backBtn', bgId, '返回结果', vec3(0, -220, 0), 200, 48, 20);

  const sId = createScript(bgId, 'ReviewPanel', {
    errorList: ref(el), mismatchList: ref(ml), summaryLabel: ref(t1),
    improvementLabel: ref(il), backButton: ref(b1)
  });
  findObj(sId).node = ref(bgId); findObj(sId).__node = ref(bgId);

  addChildren(bgId, [t0, t1, el, ml, il, b1]);
  addComponents(bgId, [sId]);
  return bgId;
}

function buildLevelSelectPanel(canvasId) {
  const bgId = createPanelBg('LevelSelectPanel', canvasId, 820, 520, vec3(0, 0, 0), false);
  const t1 = createLabelNode('titleLbl', bgId, '关卡选择', vec3(0, 230, 0), 400, 40, 28, { r: 255, g: 215, b: 0, a: 255 });
  const list = createListNode('levelList', bgId, vec3(0, 20, 0), 720, 340);
  const tmpl = createTemplateNode('levelItemTemplate', list, vec3(0, 130, 0), 700, 80);
  addChildren(list, [tmpl]);
  const b1 = createButtonNode('backBtn', bgId, '← 返回', vec3(0, -200, 0), 180, 48, 20);

  const sId = createScript(bgId, 'LevelSelectPanel', {
    levelList: ref(list), levelItemTemplate: ref(tmpl), backButton: ref(b1), titleLabel: ref(t1)
  });
  findObj(sId).node = ref(bgId); findObj(sId).__node = ref(bgId);

  addChildren(bgId, [t1, list, b1]);
  addComponents(bgId, [sId]);
  return bgId;
}

function buildTutorialUI(canvasId) {
  const bgId = createPanelBg('TutorialUI', canvasId, 700, 400, vec3(0, 0, 0), false);
  const t1 = createLabelNode('tutorialTitleLbl', bgId, '教程标题', vec3(0, 160, 0), 560, 40, 26, { r: 255, g: 215, b: 0, a: 255 });
  const t2 = createLabelNode('stepContentLbl', bgId, '教程步骤内容...', vec3(0, 60, 0), 600, 180, 18, { r: 220, g: 230, b: 255, a: 255 });
  const t3 = createLabelNode('stepIndexLbl', bgId, '步骤 1 / 1', vec3(0, -40, 0), 300, 30, 16, { r: 180, g: 180, b: 200, a: 255 });
  const b1 = createButtonNode('prevBtn', bgId, '← 上一步', vec3(-250, -120, 0), 160, 44, 18);
  const b2 = createButtonNode('nextBtn', bgId, '下一步 →', vec3(0, -120, 0), 160, 44, 18);
  const b3 = createButtonNode('closeBtn', bgId, '跳过教程', vec3(250, -120, 0), 160, 44, 18);
  const hl = createListNode('highlightNode', bgId, vec3(0, 0, 0), 200, 100);
  findObj(hl)._active = false;

  const sId = createScript(bgId, 'TutorialUI', {
    tutorialTitleLabel: ref(t1), stepContentLabel: ref(t2), stepIndexLabel: ref(t3),
    prevButton: ref(b1), nextButton: ref(b2), closeButton: ref(b3), highlightNode: ref(hl)
  });
  findObj(sId).node = ref(bgId); findObj(sId).__node = ref(bgId);

  addChildren(bgId, [t1, t2, t3, b1, b2, b3, hl]);
  addComponents(bgId, [sId]);
  return bgId;
}

function buildLeaderboardUI(canvasId) {
  const bgId = createPanelBg('LeaderboardUI', canvasId, 800, 520, vec3(0, 0, 0), false);
  const t1 = createLabelNode('titleLbl', bgId, '排行榜', vec3(0, 230, 0), 400, 40, 28, { r: 255, g: 215, b: 0, a: 255 });
  const tabs = createListNode('levelTabsContainer', bgId, vec3(0, 180, 0), 700, 40);
  const list = createListNode('rankingList', bgId, vec3(0, 20, 0), 720, 300);
  const tmpl = createTemplateNode('rankItemTemplate', list, vec3(0, 120, 0), 700, 50);
  addChildren(list, [tmpl]);
  const pr = createLabelNode('playerRankLbl', bgId, '我的排名：未上榜', vec3(-250, -180, 0), 300, 32, 18, { r: 255, g: 255, b: 255, a: 255 });
  const ps = createLabelNode('playerScoreLbl', bgId, '最高分：0分', vec3(50, -180, 0), 260, 32, 18, { r: 0, g: 255, b: 128, a: 255 });
  const b1 = createButtonNode('backBtn', bgId, '← 返回', vec3(280, -180, 0), 140, 44, 18);

  const sId = createScript(bgId, 'LeaderboardUI', {
    rankingList: ref(list), rankItemTemplate: ref(tmpl),
    playerRankLabel: ref(pr), playerScoreLabel: ref(ps), backButton: ref(b1), levelTabsContainer: ref(tabs)
  });
  findObj(sId).node = ref(bgId); findObj(sId).__node = ref(bgId);

  addChildren(bgId, [t1, tabs, list, pr, ps, b1]);
  addComponents(bgId, [sId]);
  return bgId;
}

function buildTiledMapContainer(canvasId) {
  const bgId = createPanelBg('TiledMapContainer', canvasId, 800, 480, vec3(0, 0, 0), false);
  const player = createPanelBg('player', bgId, 32, 32, vec3(0, 0, 10), true, { r: 255, g: 0, b: 128, a: 255 });

  const mapUIT = createUITransform(null, 800, 480);
  const mapNode = createNode('TiledMap', bgId, [], [mapUIT], { pos: vec3(0, 0, 0) });
  findObj(mapUIT).node = ref(mapNode); findObj(mapUIT).__node = ref(mapNode);

  let tmxUuid = null;
  try {
    tmxUuid = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, 'assets/resources/tiled/level_001.tmx.meta'), 'utf8')).uuid;
  } catch {}
  const tmc = createTiledMap(mapNode, tmxUuid);
  addComponents(mapNode, [tmc]);

  const sId = createScript(bgId, 'TiledMapController', {
    tiledMap: ref(tmc), mapScale: 1, playerNode: ref(player)
  });
  findObj(sId).node = ref(bgId); findObj(sId).__node = ref(bgId);

  addChildren(bgId, [mapNode, player]);
  addComponents(bgId, [sId]);
  return bgId;
}

function buildGameMain(canvasId) {
  const uit = createUITransform(null, 100, 100);
  const sId = createScript(null, 'GameMain', { canvas: ref(canvasId) });
  const nid = createNode('GameMain', canvasId, [], [uit, sId], { pos: vec3(0, 0, 0) });
  findObj(uit).node = ref(nid); findObj(uit).__node = ref(nid);
  findObj(sId).node = ref(nid); findObj(sId).__node = ref(nid);
  return nid;
}

function createScene() {
  objects.length = 0;
  nextId = 1;

  const sceneAssetId = newObj('cc.SceneAsset', { _name: 'Main', _objFlags: 0, '__editorExtras__': {}, _native: '' });
  const globalsId = createGlobals();

  const camNodeId = createNode('Camera', null, [], [], { pos: vec3(0, 0, 1000), layer: 1073741824 });
  const camCompId = createCamera(camNodeId);
  addComponents(camNodeId, [camCompId]);

  const canvasNodeId = createNode('Canvas', null, [], [], { pos: vec3(0, 0, 0), layer: 33554432 });
  const canvasUITId = createUITransform(canvasNodeId, 960, 640);
  findObj(canvasUITId).node = ref(canvasNodeId); findObj(canvasUITId).__node = ref(canvasNodeId);
  const canvasCompId = newObj('cc.Canvas', {
    _name: '', _objFlags: 0, node: ref(canvasNodeId), _enabled: true, __prefab: null,
    _id: uid('canvas-comp'), _cameraComponent: ref(camNodeId), _alignCanvasWithScreen: true
  });
  addComponents(canvasNodeId, [canvasUITId, canvasCompId]);

  const panels = [
    buildMainMenu(canvasNodeId),
    buildHUD(canvasNodeId),
    buildTaskBriefing(canvasNodeId),
    buildCluePanel(canvasNodeId),
    buildDocumentPanel(canvasNodeId),
    buildApprovalPanel(canvasNodeId),
    buildResultPanel(canvasNodeId),
    buildReviewPanel(canvasNodeId),
    buildLevelSelectPanel(canvasNodeId),
    buildTutorialUI(canvasNodeId),
    buildLeaderboardUI(canvasNodeId),
    buildTiledMapContainer(canvasNodeId),
    buildGameMain(canvasNodeId),
  ];
  addChildren(canvasNodeId, panels);

  const sceneId = createNode('Main', null, [canvasNodeId, camNodeId], [], { layer: 1073741824 });
  const sceneObj = findObj(sceneId);
  sceneObj.__type__ = 'cc.Scene';
  sceneObj.autoReleaseAssets = false;
  sceneObj._globals = ref(globalsId);
  sceneObj._id = 'scene-main';
  delete sceneObj._components;

  findObj(sceneAssetId).scene = ref(sceneId);

  return objects.sort((a, b) => a.id - b.id).map(o => o.obj);
}

function main() {
  const sceneData = createScene();
  const scenePath = path.join(PROJECT_ROOT, 'assets/scenes/Main.scene');
  fs.writeFileSync(scenePath, JSON.stringify(sceneData, null, 2));
  console.log(`[✓] 场景已生成: ${scenePath}`);
  console.log(`    总节点/组件数: ${sceneData.length}`);
}

main();
