#!/usr/bin/env python3
"""
生成 Cocos Creator 3.x 可反序列化的 main.scene
关键点：
  - Label 类型属性直接绑定 cc.Label 组件（不是 Node）
  - SettlementRoot / ReviewRoot 有完整子节点结构
  - 按钮节点存在，事件通过组件 onLoad 动态绑定
"""

import json

# ========== UUID 定义 ==========
UUID = {
    'GameEntrance': 'script-000006',
    'LevelSceneController': 'script-000001',
    'SettlementComponent': 'script-000005',
    'ReviewPageComponent': 'script-000018',
    'InspectionPhoto': 'script-000010',
    'QuoteDropZone': 'script-000009',
    'TiledMap': 'map-000001',
}

scene = []
next_id = 0

def make_obj(type_name, **kwargs):
    global next_id
    oid = next_id
    obj_data = {'__id__': oid, '__type__': type_name, **kwargs}
    scene.append(obj_data)
    next_id += 1
    return oid


# ========== 辅助：创建带 UITransform 的 Node ==========
def make_node(name, active=True, size=(100, 100), anchor=(0.5, 0.5), pos=(0, 0, 0)):
    nid = make_obj('cc.Node',
        _name=name,
        _active=active,
        _components=[],  # 稍后追加
        _children=[],
        _lpos=[pos[0], pos[1], pos[2]],
    )
    uitid = make_obj('cc.UITransform',
        node={'__id__': nid},
        _contentSize=[size[0], size[1]],
        _anchorPoint=[anchor[0], anchor[1]],
    )
    scene[nid]['_components'].append({'__id__': uitid})
    return nid, uitid


# ========== 辅助：给 Node 添加组件 ==========
def add_component(node_id, comp_id):
    scene[node_id]['_components'].append({'__id__': comp_id})


# ========== 辅助：给 Node 添加子节点 ==========
def add_child(parent_id, child_id):
    scene[parent_id]['_children'].append({'__id__': child_id})


# ========== 辅助：创建 Label（Node + UITransform + Label） ==========
def make_label(name, text='', font_size=24, color=None, size=(200, 30), pos=(0, 0, 0)):
    if color is None:
        color = {'r': 255, 'g': 255, 'b': 255, 'a': 255}
    nid, uitid = make_node(name, size=size, pos=pos)
    lid = make_obj('cc.Label',
        node={'__id__': nid},
        _string=text,
        _fontSize=font_size,
        _color=color,
        _horizontalAlign=1,  # CENTER
        _verticalAlign=1,    # CENTER
    )
    add_component(nid, lid)
    return nid, uitid, lid


# ========== 辅助：创建 Sprite 节点（用作面板/按钮背景） ==========
def make_sprite_node(name, color=None, size=(200, 100), pos=(0, 0, 0)):
    if color is None:
        color = {'r': 255, 'g': 255, 'b': 255, 'a': 255}
    nid, uitid = make_node(name, size=size, pos=pos)
    sid = make_obj('cc.Sprite',
        node={'__id__': nid},
        _color=color,
        _sizeMode=1,  # CUSTOM
        _type=1,      # SIMPLE
    )
    add_component(nid, sid)
    return nid, uitid, sid


# ======================================================================
# 0: Scene
# ======================================================================
scene_id = make_obj('cc.Scene',
    _name='main',
    _active=True,
    _components=[],
    _children=[],  # 稍后追加 Canvas
)

# ======================================================================
# Canvas
# ======================================================================
canvas_id, canvas_ui_id = make_node('Canvas', size=(1280, 720))
add_child(scene_id, canvas_id)

# Canvas 组件
canvas_comp_id = make_obj('cc.Canvas',
    node={'__id__': canvas_id},
    _designResolution={'width': 1280, 'height': 720, 'fitWidth': True, 'fitHeight': False},
)
add_component(canvas_id, canvas_comp_id)

# GameEntrance 组件
game_entrance_id = make_obj('GameEntrance',
    node={'__id__': canvas_id},
    __scriptAsset={'__uuid__': UUID['GameEntrance'], '__expectedType__': 'cc.Script'},
    startSceneName='main',
)
add_component(canvas_id, game_entrance_id)

# LevelSceneController 组件（稍后填充属性）
lsc_id = make_obj('LevelSceneController',
    node={'__id__': canvas_id},
    __scriptAsset={'__uuid__': UUID['LevelSceneController'], '__expectedType__': 'cc.Script'},
)
add_component(canvas_id, lsc_id)

# ======================================================================
# MapRoot
# ======================================================================
maproot_id, maproot_ui_id = make_node('MapRoot', size=(640, 480), pos=(-400, 200, 0))
add_child(canvas_id, maproot_id)

tiledmap_id = make_obj('cc.TiledMap',
    node={'__id__': maproot_id},
    tmxAsset={'__uuid__': UUID['TiledMap'], '__expectedType__': 'cc.TiledMapAsset'},
    enableCulling=False,
)
add_component(maproot_id, tiledmap_id)

# ======================================================================
# HUDRoot
# ======================================================================
hudroot_id, hudroot_ui_id = make_node('HUDRoot', size=(1280, 720))
add_child(canvas_id, hudroot_id)

# ======================================================================
# TimerLabel (Label 属性直接绑定 cc.Label 组件)
# ======================================================================
timer_node_id, timer_ui_id, timer_label_id = make_label(
    'TimerLabel', '00:00', font_size=28,
    color={'r': 255, 'g': 255, 'b': 255, 'a': 255},
    size=(200, 40), pos=(500, 330, 0)
)
add_child(canvas_id, timer_node_id)

# ======================================================================
# ScoreLabel
# ======================================================================
score_node_id, score_ui_id, score_label_id = make_label(
    'ScoreLabel', '分数: 0', font_size=22,
    color={'r': 255, 'g': 255, 'b': 255, 'a': 255},
    size=(200, 30), pos=(500, 300, 0)
)
add_child(canvas_id, score_node_id)

# ======================================================================
# AccuracyLabel
# ======================================================================
accuracy_node_id, accuracy_ui_id, accuracy_label_id = make_label(
    'AccuracyLabel', '准确率: 0%', font_size=22,
    color={'r': 255, 'g': 255, 'b': 255, 'a': 255},
    size=(200, 30), pos=(500, 270, 0)
)
add_child(canvas_id, accuracy_node_id)

# ======================================================================
# DiagnosisDescLabel
# ======================================================================
desc_node_id, desc_ui_id, desc_label_id = make_label(
    'DiagnosisDescLabel', '诊断描述', font_size=24,
    color={'r': 255, 'g': 255, 'b': 255, 'a': 255},
    size=(600, 50), pos=(0, 200, 0)
)
add_child(canvas_id, desc_node_id)

# ======================================================================
# DiagnosisTabBar
# ======================================================================
tabbar_id, tabbar_ui_id = make_node('DiagnosisTabBar', size=(800, 60), pos=(0, 150, 0))
add_child(canvas_id, tabbar_id)

# ======================================================================
# InspectionPhotoNode
# ======================================================================
photo_node_id, photo_ui_id, photo_sprite_id = make_sprite_node(
    'InspectionPhotoNode',
    color={'r': 255, 'g': 255, 'b': 255, 'a': 255},
    size=(256, 256), pos=(0, 0, 0)
)
add_child(canvas_id, photo_node_id)

inspection_photo_comp_id = make_obj('InspectionPhoto',
    node={'__id__': photo_node_id},
    __scriptAsset={'__uuid__': UUID['InspectionPhoto'], '__expectedType__': 'cc.Script'},
    transitionDuration=0.5,
    maxPhotos=5,
)
add_component(photo_node_id, inspection_photo_comp_id)

# ======================================================================
# PhotoPrevBtn
# ======================================================================
prev_btn_id, prev_btn_ui_id, prev_btn_sprite_id = make_sprite_node(
    'PhotoPrevBtn',
    color={'r': 100, 'g': 100, 'b': 100, 'a': 255},
    size=(60, 60), pos=(-170, 0, 0)
)
add_child(canvas_id, prev_btn_id)

# ======================================================================
# PhotoNextBtn
# ======================================================================
next_btn_id, next_btn_ui_id, next_btn_sprite_id = make_sprite_node(
    'PhotoNextBtn',
    color={'r': 100, 'g': 100, 'b': 100, 'a': 255},
    size=(60, 60), pos=(170, 0, 0)
)
add_child(canvas_id, next_btn_id)

# ======================================================================
# PhotoIndexLabel
# ======================================================================
photo_idx_node_id, photo_idx_ui_id, photo_idx_label_id = make_label(
    'PhotoIndexLabel', '1/3', font_size=20,
    color={'r': 255, 'g': 255, 'b': 255, 'a': 255},
    size=(100, 30), pos=(0, -150, 0)
)
add_child(canvas_id, photo_idx_node_id)

# ======================================================================
# QuotesContainer
# ======================================================================
quotes_id, quotes_ui_id = make_node('QuotesContainer', size=(800, 120), pos=(0, -150, 0))
add_child(canvas_id, quotes_id)

# ======================================================================
# QuoteDropZoneNode
# ======================================================================
dropzone_id, dropzone_ui_id, dropzone_sprite_id = make_sprite_node(
    'QuoteDropZoneNode',
    color={'r': 180, 'g': 220, 'b': 180, 'a': 255},
    size=(300, 100), pos=(0, -270, 0)
)
add_child(canvas_id, dropzone_id)

quote_dropzone_comp_id = make_obj('QuoteDropZone',
    node={'__id__': dropzone_id},
    __scriptAsset={'__uuid__': UUID['QuoteDropZone'], '__expectedType__': 'cc.Script'},
    zoneId='main_zone',
    acceptedQuoteIds=[],
)
add_component(dropzone_id, quote_dropzone_comp_id)

# ======================================================================
# SettlementRoot (完整结构)
# ======================================================================
settlement_root_id, settlement_ui_id, settlement_bg_id = make_sprite_node(
    'SettlementRoot',
    color={'r': 0, 'g': 0, 'b': 0, 'a': 200},
    size=(1280, 720)
)
scene[settlement_root_id]['_active'] = False  # 初始非激活
add_child(canvas_id, settlement_root_id)

# 结算面板（白色底板）
settle_panel_id, settle_panel_ui_id, settle_panel_sprite_id = make_sprite_node(
    'SettlePanel',
    color={'r': 40, 'g': 40, 'b': 60, 'a': 255},
    size=(500, 500), pos=(0, 0, 0)
)
add_child(settlement_root_id, settle_panel_id)

# 标题
settle_title_node, settle_title_ui, settle_title_label = make_label(
    'TitleLabel', '结算', font_size=36,
    color={'r': 255, 'g': 215, 'b': 0, 'a': 255},
    size=(400, 50), pos=(0, 200, 0)
)
add_child(settle_panel_id, settle_title_node)

# 分数行
settle_score_node, settle_score_ui, settle_score_label = make_label(
    'ScoreLabel', '0', font_size=48,
    color={'r': 255, 'g': 200, 'b': 50, 'a': 255},
    size=(300, 60), pos=(0, 130, 0)
)
add_child(settle_panel_id, settle_score_node)

# 准确率行
settle_acc_node, settle_acc_ui, settle_acc_label = make_label(
    'AccuracyLabel', '准确率: 0% S', font_size=26,
    color={'r': 255, 'g': 255, 'b': 255, 'a': 255},
    size=(350, 35), pos=(0, 70, 0)
)
add_child(settle_panel_id, settle_acc_node)

# 成本行
settle_cost_node, settle_cost_ui, settle_cost_label = make_label(
    'CostLabel', '成本: ¥0', font_size=24,
    color={'r': 200, 'g': 200, 'b': 200, 'a': 255},
    size=(350, 30), pos=(0, 20, 0)
)
add_child(settle_panel_id, settle_cost_node)

# 返修行
settle_rework_node, settle_rework_ui, settle_rework_label = make_label(
    'ReworkLabel', '返修次数: 0次', font_size=24,
    color={'r': 255, 'g': 150, 'b': 150, 'a': 255},
    size=(350, 30), pos=(0, -20, 0)
)
add_child(settle_panel_id, settle_rework_node)

# 时间行
settle_time_node, settle_time_ui, settle_time_label = make_label(
    'TimeLabel', '用时: 00:00', font_size=24,
    color={'r': 200, 'g': 200, 'b': 200, 'a': 255},
    size=(350, 30), pos=(0, -60, 0)
)
add_child(settle_panel_id, settle_time_node)

# 继续按钮
settle_continue_btn_id, settle_continue_ui, settle_continue_sprite = make_sprite_node(
    'ContinueBtn',
    color={'r': 80, 'g': 180, 'b': 100, 'a': 255},
    size=(160, 50), pos=(100, -150, 0)
)
add_child(settle_panel_id, settle_continue_btn_id)

settle_continue_label_node, settle_continue_label_ui, settle_continue_label_id = make_label(
    'BtnLabel', '继续', font_size=24,
    color={'r': 255, 'g': 255, 'b': 255, 'a': 255},
    size=(140, 40), pos=(0, 0, 0)
)
add_child(settle_continue_btn_id, settle_continue_label_node)

# 重试按钮
settle_retry_btn_id, settle_retry_ui, settle_retry_sprite = make_sprite_node(
    'RetryBtn',
    color={'r': 200, 'g': 100, 'b': 100, 'a': 255},
    size=(160, 50), pos=(-100, -150, 0)
)
add_child(settle_panel_id, settle_retry_btn_id)

settle_retry_label_node, settle_retry_label_ui, settle_retry_label_id = make_label(
    'BtnLabel', '重试', font_size=24,
    color={'r': 255, 'g': 255, 'b': 255, 'a': 255},
    size=(140, 40), pos=(0, 0, 0)
)
add_child(settle_retry_btn_id, settle_retry_label_node)

# SettlementComponent 组件
settlement_comp_id = make_obj('SettlementComponent',
    node={'__id__': settlement_root_id},
    __scriptAsset={'__uuid__': UUID['SettlementComponent'], '__expectedType__': 'cc.Script'},
    scoreLabel={'__id__': settle_score_label},
    accuracyLabel={'__id__': settle_acc_label},
    costLabel={'__id__': settle_cost_label},
    reworkLabel={'__id__': settle_rework_label},
    timeLabel={'__id__': settle_time_label},
    continueBtn={'__id__': settle_continue_btn_id},
    retryBtn={'__id__': settle_retry_btn_id},
)
add_component(settlement_root_id, settlement_comp_id)

# ======================================================================
# ReviewRoot (完整结构)
# ======================================================================
review_root_id, review_ui_id, review_bg_id = make_sprite_node(
    'ReviewRoot',
    color={'r': 0, 'g': 0, 'b': 0, 'a': 200},
    size=(1280, 720)
)
scene[review_root_id]['_active'] = False
add_child(canvas_id, review_root_id)

# 复盘面板
review_panel_id, review_panel_ui_id, review_panel_sprite_id = make_sprite_node(
    'ReviewPanel',
    color={'r': 40, 'g': 45, 'b': 70, 'a': 255},
    size=(600, 600), pos=(0, 0, 0)
)
add_child(review_root_id, review_panel_id)

# 标题
review_title_node, review_title_ui, review_title_label = make_label(
    'TitleLabel', '复盘', font_size=36,
    color={'r': 255, 'g': 215, 'b': 0, 'a': 255},
    size=(400, 50), pos=(0, 250, 0)
)
add_child(review_panel_id, review_title_node)

# 返修率
review_rework_node, review_rework_ui, review_rework_label = make_label(
    'ReworkRateLabel', '返修率: 0.0%', font_size=26,
    color={'r': 255, 'g': 150, 'b': 150, 'a': 255},
    size=(400, 40), pos=(0, 190, 0)
)
add_child(review_panel_id, review_rework_node)

# 总时间
review_time_node, review_time_ui, review_time_label = make_label(
    'TotalTimeLabel', '总用时: 00:00', font_size=24,
    color={'r': 200, 'g': 200, 'b': 200, 'a': 255},
    size=(400, 35), pos=(0, 145, 0)
)
add_child(review_panel_id, review_time_node)

# 平均时间
review_avg_node, review_avg_ui, review_avg_label = make_label(
    'AvgTimeLabel', '平均诊断: 00:00', font_size=24,
    color={'r': 200, 'g': 200, 'b': 200, 'a': 255},
    size=(400, 35), pos=(0, 105, 0)
)
add_child(review_panel_id, review_avg_node)

# 玩家卡点标题
review_bn_title_node, review_bn_title_ui, review_bn_title_label = make_label(
    'BottleneckTitle', '玩家卡点 TOP 3', font_size=22,
    color={'r': 255, 'g': 200, 'b': 100, 'a': 255},
    size=(400, 30), pos=(0, 60, 0)
)
add_child(review_panel_id, review_bn_title_node)

# 卡点容器
bottleneck_container_id, bottleneck_ui_id = make_node(
    'BottleneckContainer', size=(500, 120), pos=(0, -20, 0)
)
add_child(review_panel_id, bottleneck_container_id)

# 诊断拆解标题
review_bd_title_node, review_bd_title_ui, review_bd_title_label = make_label(
    'BreakdownTitle', '诊断详情', font_size=22,
    color={'r': 255, 'g': 200, 'b': 100, 'a': 255},
    size=(400, 30), pos=(0, -100, 0)
)
add_child(review_panel_id, review_bd_title_node)

# 拆解容器
breakdown_container_id, breakdown_ui_id = make_node(
    'BreakdownContainer', size=(500, 150), pos=(0, -190, 0)
)
add_child(review_panel_id, breakdown_container_id)

# 重试按钮
review_retry_btn_id, review_retry_ui, review_retry_sprite = make_sprite_node(
    'RetryBtn',
    color={'r': 200, 'g': 100, 'b': 100, 'a': 255},
    size=(140, 45), pos=(-120, -260, 0)
)
add_child(review_panel_id, review_retry_btn_id)

review_retry_label_node, review_retry_label_ui, review_retry_label_id = make_label(
    'BtnLabel', '重玩', font_size=22,
    color={'r': 255, 'g': 255, 'b': 255, 'a': 255},
    size=(120, 35), pos=(0, 0, 0)
)
add_child(review_retry_btn_id, review_retry_label_node)

# 下一关按钮
review_next_btn_id, review_next_ui, review_next_sprite = make_sprite_node(
    'NextLevelBtn',
    color={'r': 80, 'g': 180, 'b': 100, 'a': 255},
    size=(140, 45), pos=(120, -260, 0)
)
add_child(review_panel_id, review_next_btn_id)

review_next_label_node, review_next_label_ui, review_next_label_id = make_label(
    'BtnLabel', '下一关', font_size=22,
    color={'r': 255, 'g': 255, 'b': 255, 'a': 255},
    size=(120, 35), pos=(0, 0, 0)
)
add_child(review_next_btn_id, review_next_label_node)

# ReviewPageComponent 组件
review_comp_id = make_obj('ReviewPageComponent',
    node={'__id__': review_root_id},
    __scriptAsset={'__uuid__': UUID['ReviewPageComponent'], '__expectedType__': 'cc.Script'},
    reworkRateLabel={'__id__': review_rework_label},
    totalTimeLabel={'__id__': review_time_label},
    avgTimeLabel={'__id__': review_avg_label},
    bottleneckContainer={'__id__': bottleneck_container_id},
    breakdownContainer={'__id__': breakdown_container_id},
    retryBtn={'__id__': review_retry_btn_id},
    nextLevelBtn={'__id__': review_next_btn_id},
)
add_component(review_root_id, review_comp_id)

# ======================================================================
# EventPopupRoot
# ======================================================================
event_popup_id, event_popup_ui_id = make_node('EventPopupRoot', size=(1280, 720))
add_child(canvas_id, event_popup_id)

# ======================================================================
# PauseBtn
# ======================================================================
pause_btn_id, pause_btn_ui_id, pause_btn_sprite_id = make_sprite_node(
    'PauseBtn',
    color={'r': 255, 'g': 150, 'b': 50, 'a': 255},
    size=(50, 50), pos=(580, 330, 0)
)
add_child(canvas_id, pause_btn_id)

# ======================================================================
# SceneGlobals
# ======================================================================
make_obj('cc.SceneGlobals',
    ambientSkyColor={'r': 51, 'g': 128, 'b': 204, 'a': 255},
    ambientGroundColor={'r': 51, 'g': 128, 'b': 204, 'a': 255},
    ambientLightIntensity=1,
    autoExposure=False,
)

# ======================================================================
# 填充 LevelSceneController 属性（Label 直接绑定 cc.Label 组件）
# ======================================================================
scene[lsc_id].update({
    # Node 类型
    'mapRoot': {'__id__': maproot_id},
    'hudRoot': {'__id__': hudroot_id},
    'photoPrevBtn': {'__id__': prev_btn_id},
    'photoNextBtn': {'__id__': next_btn_id},
    'inspectionPhotoNode': {'__id__': photo_node_id},
    'quotesContainer': {'__id__': quotes_id},
    'quoteDropZoneNode': {'__id__': dropzone_id},
    'diagnosisTabBar': {'__id__': tabbar_id},
    'settlementRoot': {'__id__': settlement_root_id},
    'settlementComponent': {'__id__': settlement_comp_id},
    'reviewRoot': {'__id__': review_root_id},
    'reviewComponent': {'__id__': review_comp_id},
    'eventPopupRoot': {'__id__': event_popup_id},
    'pauseBtn': {'__id__': pause_btn_id},
    # Label 类型 - 直接绑定 cc.Label 组件
    'timerLabel': {'__id__': timer_label_id},
    'scoreLabel': {'__id__': score_label_id},
    'accuracyLabel': {'__id__': accuracy_label_id},
    'diagnosisDescLabel': {'__id__': desc_label_id},
    'photoIndexLabel': {'__id__': photo_idx_label_id},
})

# ======================================================================
# 写出文件
# ======================================================================
output_path = '/Users/yaoleyxing/Developer/solo-mange-pro/MP0359/assets/scenes/main.scene'
with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(scene, f, ensure_ascii=False, indent=2)

print(f"✅ 场景文件已生成: {output_path}")
print(f"   共 {len(scene)} 个对象，__id__ 范围 0~{len(scene)-1}")
print()

# ===== 验证 LevelSceneController 绑定 =====
print("=== LevelSceneController 属性绑定 ===")
lsc_data = scene[lsc_id]
node_props = ['mapRoot','hudRoot','photoPrevBtn','photoNextBtn','inspectionPhotoNode',
              'quotesContainer','quoteDropZoneNode','diagnosisTabBar','settlementRoot',
              'settlementComponent','reviewRoot','reviewComponent','eventPopupRoot','pauseBtn']
label_props = ['timerLabel','scoreLabel','accuracyLabel','diagnosisDescLabel','photoIndexLabel']

for k in node_props + label_props:
    v = lsc_data.get(k)
    if isinstance(v, dict) and '__id__' in v:
        target = scene[v['__id__']]
        ttype = target.get('__type__', '?')
        tname = target.get('_name', '?')
        expected = 'cc.Label' if k in label_props else 'cc.Node'
        status = '✅' if ttype == expected else '⚠️ '
        print(f"   {status} {k:25s} -> __id__={v['__id__']:3d} [{ttype}] '{tname}'")
    else:
        print(f"   ❌ {k:25s} -> 未绑定")

print()
print("=== SettlementComponent 属性绑定 ===")
settle_data = scene[settlement_comp_id]
for k in ['scoreLabel','accuracyLabel','costLabel','reworkLabel','timeLabel']:
    v = settle_data.get(k)
    if isinstance(v, dict) and '__id__' in v:
        target = scene[v['__id__']]
        print(f"   ✅ {k:20s} -> __id__={v['__id__']:3d} [{target.get('__type__','?')}]")
    else:
        print(f"   ❌ {k:20s} -> 未绑定")

print()
print("=== ReviewPageComponent 属性绑定 ===")
rev_data = scene[review_comp_id]
for k in ['reworkRateLabel','totalTimeLabel','avgTimeLabel','bottleneckContainer','breakdownContainer']:
    v = rev_data.get(k)
    if isinstance(v, dict) and '__id__' in v:
        target = scene[v['__id__']]
        print(f"   ✅ {k:25s} -> __id__={v['__id__']:3d} [{target.get('__type__','?')}] '{target.get('_name','?')}'")
    else:
        print(f"   ❌ {k:25s} -> 未绑定")

print()
print("=== 关键结构检查 ===")
print(f"   ✅ Canvas 子节点数: {len(scene[canvas_id]['_children'])}")
print(f"   ✅ SettlementRoot 初始 active: {scene[settlement_root_id]['_active']}")
print(f"   ✅ ReviewRoot 初始 active: {scene[review_root_id]['_active']}")
print(f"   ✅ TiledMap 存在: {tiledmap_id}")
print(f"   ✅ Settlement 面板子节点数: {len(scene[settle_panel_id]['_children'])}")
print(f"   ✅ Review 面板子节点数: {len(scene[review_panel_id]['_children'])}")
