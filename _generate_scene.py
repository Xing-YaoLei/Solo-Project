import json

# UUID 定义
UUID = {
    'GameEntrance': 'script-000006',
    'LevelSceneController': 'script-000001',
    'SettlementComponent': 'script-000005',
    'ReviewPageComponent': 'script-000018',
    'InspectionPhoto': 'script-000010',
    'QuoteDropZone': 'script-000009',
    'TiledMap': 'map-000001',
}

# 构建场景对象数组
scene = []
next_id = 0

def obj(type_name, **kwargs):
    global next_id
    o = {'__id__': next_id, '__type__': type_name, **kwargs}
    scene.append(o)
    id_val = next_id
    next_id += 1
    return id_val, o

# 0: Scene
scene_id, _ = obj('cc.Scene',
    _name='main',
    _active=True,
    _components=[],
    _children=[{'__id__': 1}],
)

# 1: Canvas Node
canvas_id, canvas = obj('cc.Node',
    _name='Canvas',
    _active=True,
    _components=[{'__id__': 2}, {'__id__': 3}, {'__id__': 4}, {'__id__': 5}],
    _children=[
        {'__id__': 6},   # MapRoot
        {'__id__': 9},   # HUDRoot
        {'__id__': 11},  # TimerLabel
        {'__id__': 14},  # ScoreLabel
        {'__id__': 17},  # AccuracyLabel
        {'__id__': 20},  # DiagnosisDescLabel
        {'__id__': 23},  # DiagnosisTabBar
        {'__id__': 25},  # InspectionPhotoNode
        {'__id__': 29},  # PhotoPrevBtn
        {'__id__': 32},  # PhotoNextBtn
        {'__id__': 35},  # PhotoIndexLabel
        {'__id__': 38},  # QuotesContainer
        {'__id__': 40},  # QuoteDropZoneNode
        {'__id__': 44},  # SettlementRoot
        {'__id__': 48},  # ReviewRoot
        {'__id__': 52},  # EventPopupRoot
        {'__id__': 54},  # PauseBtn
    ],
    _lpos=[0, 0, 0],
)

# 2: UITransform (Canvas)
obj('cc.UITransform',
    node={'__id__': 1},
    _contentSize=[1280, 720],
    _anchorPoint=[0.5, 0.5],
)

# 3: cc.Canvas
obj('cc.Canvas',
    node={'__id__': 1},
    _designResolution={'width': 1280, 'height': 720, 'fitWidth': True, 'fitHeight': False},
)

# 4: GameEntrance
ge_id, ge = obj('GameEntrance',
    node={'__id__': 1},
    __scriptAsset={'__uuid__': UUID['GameEntrance'], '__expectedType__': 'cc.Script'},
    startSceneName='main',
)

# 5: LevelSceneController
lsc_id, lsc = obj('LevelSceneController',
    node={'__id__': 1},
    __scriptAsset={'__uuid__': UUID['LevelSceneController'], '__expectedType__': 'cc.Script'},
    # 稍后填充属性绑定
)

# === MapRoot ===
# 6: MapRoot Node
maproot_id, _ = obj('cc.Node',
    _name='MapRoot',
    _active=True,
    _components=[{'__id__': 7}, {'__id__': 8}],
    _children=[],
    _lpos=[-400, 200, 0],
)

# 7: UITransform (MapRoot)
obj('cc.UITransform',
    node={'__id__': 6},
    _contentSize=[640, 480],
    _anchorPoint=[0.5, 0.5],
)

# 8: cc.TiledMap
obj('cc.TiledMap',
    node={'__id__': 6},
    tmxAsset={'__uuid__': UUID['TiledMap'], '__expectedType__': 'cc.TiledMapAsset'},
    enableCulling=False,
)

# === HUDRoot ===
# 9: HUDRoot Node
hudroot_id, _ = obj('cc.Node',
    _name='HUDRoot',
    _active=True,
    _components=[{'__id__': 10}],
    _children=[],
    _lpos=[0, 0, 0],
)

# 10: UITransform (HUDRoot)
obj('cc.UITransform',
    node={'__id__': 9},
    _contentSize=[1280, 720],
    _anchorPoint=[0.5, 0.5],
)

# === TimerLabel ===
# 11: TimerLabel Node
timerlabel_id, _ = obj('cc.Node',
    _name='TimerLabel',
    _active=True,
    _components=[{'__id__': 12}, {'__id__': 13}],
    _children=[],
    _lpos=[500, 330, 0],
)

# 12: UITransform (TimerLabel)
obj('cc.UITransform',
    node={'__id__': 11},
    _contentSize=[200, 40],
    _anchorPoint=[0.5, 0.5],
)

# 13: cc.Label (TimerLabel)
obj('cc.Label',
    node={'__id__': 11},
    _string='00:00',
    _fontSize=28,
    _color={'r': 255, 'g': 255, 'b': 255, 'a': 255},
    _horizontalAlign=1,  # CENTER
    _verticalAlign=1,    # CENTER
)

# === ScoreLabel ===
# 14: ScoreLabel Node
scorelabel_id, _ = obj('cc.Node',
    _name='ScoreLabel',
    _active=True,
    _components=[{'__id__': 15}, {'__id__': 16}],
    _children=[],
    _lpos=[500, 300, 0],
)

# 15: UITransform (ScoreLabel)
obj('cc.UITransform',
    node={'__id__': 14},
    _contentSize=[200, 30],
    _anchorPoint=[0.5, 0.5],
)

# 16: cc.Label (ScoreLabel)
obj('cc.Label',
    node={'__id__': 14},
    _string='分数: 0',
    _fontSize=22,
    _color={'r': 255, 'g': 255, 'b': 255, 'a': 255},
    _horizontalAlign=1,
    _verticalAlign=1,
)

# === AccuracyLabel ===
# 17: AccuracyLabel Node
accuracylabel_id, _ = obj('cc.Node',
    _name='AccuracyLabel',
    _active=True,
    _components=[{'__id__': 18}, {'__id__': 19}],
    _children=[],
    _lpos=[500, 270, 0],
)

# 18: UITransform (AccuracyLabel)
obj('cc.UITransform',
    node={'__id__': 17},
    _contentSize=[200, 30],
    _anchorPoint=[0.5, 0.5],
)

# 19: cc.Label (AccuracyLabel)
obj('cc.Label',
    node={'__id__': 17},
    _string='准确率: 0%',
    _fontSize=22,
    _color={'r': 255, 'g': 255, 'b': 255, 'a': 255},
    _horizontalAlign=1,
    _verticalAlign=1,
)

# === DiagnosisDescLabel ===
# 20: DiagnosisDescLabel Node
diagnosisdesclabel_id, _ = obj('cc.Node',
    _name='DiagnosisDescLabel',
    _active=True,
    _components=[{'__id__': 21}, {'__id__': 22}],
    _children=[],
    _lpos=[0, 200, 0],
)

# 21: UITransform (DiagnosisDescLabel)
obj('cc.UITransform',
    node={'__id__': 20},
    _contentSize=[600, 50],
    _anchorPoint=[0.5, 0.5],
)

# 22: cc.Label (DiagnosisDescLabel)
obj('cc.Label',
    node={'__id__': 20},
    _string='诊断描述',
    _fontSize=24,
    _color={'r': 255, 'g': 255, 'b': 255, 'a': 255},
    _horizontalAlign=1,
    _verticalAlign=1,
)

# === DiagnosisTabBar ===
# 23: DiagnosisTabBar Node
diagnosistabbar_id, _ = obj('cc.Node',
    _name='DiagnosisTabBar',
    _active=True,
    _components=[{'__id__': 24}],
    _children=[],
    _lpos=[0, 150, 0],
)

# 24: UITransform (DiagnosisTabBar)
obj('cc.UITransform',
    node={'__id__': 23},
    _contentSize=[800, 60],
    _anchorPoint=[0.5, 0.5],
)

# === InspectionPhotoNode ===
# 25: InspectionPhotoNode Node
inspectionphotonode_id, _ = obj('cc.Node',
    _name='InspectionPhotoNode',
    _active=True,
    _components=[{'__id__': 26}, {'__id__': 27}, {'__id__': 28}],
    _children=[],
    _lpos=[0, 0, 0],
)

# 26: UITransform (InspectionPhotoNode)
obj('cc.UITransform',
    node={'__id__': 25},
    _contentSize=[256, 256],
    _anchorPoint=[0.5, 0.5],
)

# 27: cc.Sprite (InspectionPhotoNode bg)
obj('cc.Sprite',
    node={'__id__': 25},
    _color={'r': 255, 'g': 255, 'b': 255, 'a': 255},
    _sizeMode=1,  # CUSTOM
    _type=1,      # SIMPLE
)

# 28: InspectionPhoto 组件
obj('InspectionPhoto',
    node={'__id__': 25},
    __scriptAsset={'__uuid__': UUID['InspectionPhoto'], '__expectedType__': 'cc.Script'},
    transitionDuration=0.5,
    maxPhotos=5,
)

# === PhotoPrevBtn ===
# 29: PhotoPrevBtn Node
photoprevbtn_id, _ = obj('cc.Node',
    _name='PhotoPrevBtn',
    _active=True,
    _components=[{'__id__': 30}, {'__id__': 31}],
    _children=[],
    _lpos=[-170, 0, 0],
)

# 30: UITransform (PhotoPrevBtn)
obj('cc.UITransform',
    node={'__id__': 29},
    _contentSize=[60, 60],
    _anchorPoint=[0.5, 0.5],
)

# 31: cc.Sprite (PhotoPrevBtn)
obj('cc.Sprite',
    node={'__id__': 29},
    _color={'r': 100, 'g': 100, 'b': 100, 'a': 255},
    _sizeMode=1,
    _type=1,
)

# === PhotoNextBtn ===
# 32: PhotoNextBtn Node
photonextbtn_id, _ = obj('cc.Node',
    _name='PhotoNextBtn',
    _active=True,
    _components=[{'__id__': 33}, {'__id__': 34}],
    _children=[],
    _lpos=[170, 0, 0],
)

# 33: UITransform (PhotoNextBtn)
obj('cc.UITransform',
    node={'__id__': 32},
    _contentSize=[60, 60],
    _anchorPoint=[0.5, 0.5],
)

# 34: cc.Sprite (PhotoNextBtn)
obj('cc.Sprite',
    node={'__id__': 32},
    _color={'r': 100, 'g': 100, 'b': 100, 'a': 255},
    _sizeMode=1,
    _type=1,
)

# === PhotoIndexLabel ===
# 35: PhotoIndexLabel Node
photoindexlabel_id, _ = obj('cc.Node',
    _name='PhotoIndexLabel',
    _active=True,
    _components=[{'__id__': 36}, {'__id__': 37}],
    _children=[],
    _lpos=[0, -150, 0],
)

# 36: UITransform (PhotoIndexLabel)
obj('cc.UITransform',
    node={'__id__': 35},
    _contentSize=[100, 30],
    _anchorPoint=[0.5, 0.5],
)

# 37: cc.Label (PhotoIndexLabel)
obj('cc.Label',
    node={'__id__': 35},
    _string='1/3',
    _fontSize=20,
    _color={'r': 255, 'g': 255, 'b': 255, 'a': 255},
    _horizontalAlign=1,
    _verticalAlign=1,
)

# === QuotesContainer ===
# 38: QuotesContainer Node
quotescontainer_id, _ = obj('cc.Node',
    _name='QuotesContainer',
    _active=True,
    _components=[{'__id__': 39}],
    _children=[],
    _lpos=[0, -150, 0],
)

# 39: UITransform (QuotesContainer)
obj('cc.UITransform',
    node={'__id__': 38},
    _contentSize=[800, 120],
    _anchorPoint=[0.5, 0.5],
)

# === QuoteDropZoneNode ===
# 40: QuoteDropZoneNode Node
quotedropzonenode_id, _ = obj('cc.Node',
    _name='QuoteDropZoneNode',
    _active=True,
    _components=[{'__id__': 41}, {'__id__': 42}, {'__id__': 43}],
    _children=[],
    _lpos=[0, -270, 0],
)

# 41: UITransform (QuoteDropZoneNode)
obj('cc.UITransform',
    node={'__id__': 40},
    _contentSize=[300, 100],
    _anchorPoint=[0.5, 0.5],
)

# 42: cc.Sprite (QuoteDropZoneNode)
obj('cc.Sprite',
    node={'__id__': 40},
    _color={'r': 180, 'g': 220, 'b': 180, 'a': 255},
    _sizeMode=1,
    _type=1,
)

# 43: QuoteDropZone 组件
obj('QuoteDropZone',
    node={'__id__': 40},
    __scriptAsset={'__uuid__': UUID['QuoteDropZone'], '__expectedType__': 'cc.Script'},
    zoneId='main_zone',
    acceptedQuoteIds=[],
)

# === SettlementRoot ===
# 44: SettlementRoot Node
settlementroot_id, _ = obj('cc.Node',
    _name='SettlementRoot',
    _active=False,
    _components=[{'__id__': 45}, {'__id__': 46}, {'__id__': 47}],
    _children=[],
    _lpos=[0, 0, 0],
)

# 45: UITransform (SettlementRoot)
obj('cc.UITransform',
    node={'__id__': 44},
    _contentSize=[1280, 720],
    _anchorPoint=[0.5, 0.5],
)

# 46: cc.Sprite (SettlementRoot 遮罩)
obj('cc.Sprite',
    node={'__id__': 44},
    _color={'r': 0, 'g': 0, 'b': 0, 'a': 200},
    _sizeMode=1,
    _type=1,
)

# 47: SettlementComponent 组件
settlementcomponent_id, _ = obj('SettlementComponent',
    node={'__id__': 44},
    __scriptAsset={'__uuid__': UUID['SettlementComponent'], '__expectedType__': 'cc.Script'},
    # 稍后填充属性
)

# === ReviewRoot ===
# 48: ReviewRoot Node
reviewroot_id, _ = obj('cc.Node',
    _name='ReviewRoot',
    _active=False,
    _components=[{'__id__': 49}, {'__id__': 50}, {'__id__': 51}],
    _children=[],
    _lpos=[0, 0, 0],
)

# 49: UITransform (ReviewRoot)
obj('cc.UITransform',
    node={'__id__': 48},
    _contentSize=[1280, 720],
    _anchorPoint=[0.5, 0.5],
)

# 50: cc.Sprite (ReviewRoot 遮罩)
obj('cc.Sprite',
    node={'__id__': 48},
    _color={'r': 0, 'g': 0, 'b': 0, 'a': 200},
    _sizeMode=1,
    _type=1,
)

# 51: ReviewPageComponent 组件
reviewcomponent_id, _ = obj('ReviewPageComponent',
    node={'__id__': 48},
    __scriptAsset={'__uuid__': UUID['ReviewPageComponent'], '__expectedType__': 'cc.Script'},
    # 稍后填充属性
)

# === EventPopupRoot ===
# 52: EventPopupRoot Node
eventpopuproot_id, _ = obj('cc.Node',
    _name='EventPopupRoot',
    _active=True,
    _components=[{'__id__': 53}],
    _children=[],
    _lpos=[0, 0, 0],
)

# 53: UITransform (EventPopupRoot)
obj('cc.UITransform',
    node={'__id__': 52},
    _contentSize=[1280, 720],
    _anchorPoint=[0.5, 0.5],
)

# === PauseBtn ===
# 54: PauseBtn Node
pausebtn_id, _ = obj('cc.Node',
    _name='PauseBtn',
    _active=True,
    _components=[{'__id__': 55}, {'__id__': 56}],
    _children=[],
    _lpos=[580, 330, 0],
)

# 55: UITransform (PauseBtn)
obj('cc.UITransform',
    node={'__id__': 54},
    _contentSize=[50, 50],
    _anchorPoint=[0.5, 0.5],
)

# 56: cc.Sprite (PauseBtn)
obj('cc.Sprite',
    node={'__id__': 54},
    _color={'r': 255, 'g': 150, 'b': 50, 'a': 255},
    _sizeMode=1,
    _type=1,
)

# 57: cc.SceneGlobals (必需组件)
obj('cc.SceneGlobals',
    ambientSkyColor={'r': 51, 'g': 128, 'b': 204, 'a': 255},
    ambientGroundColor={'r': 51, 'g': 128, 'b': 204, 'a': 255},
    ambientLightIntensity=1,
    autoExposure=False,
)

# === 填充 LevelSceneController 的属性绑定 ===
lsc.update({
    'mapRoot': {'__id__': maproot_id},
    'hudRoot': {'__id__': hudroot_id},
    'timerLabel': {'__id__': timerlabel_id},
    'scoreLabel': {'__id__': scorelabel_id},
    'accuracyLabel': {'__id__': accuracylabel_id},
    'diagnosisDescLabel': {'__id__': diagnosisdesclabel_id},
    'photoPrevBtn': {'__id__': photoprevbtn_id},
    'photoNextBtn': {'__id__': photonextbtn_id},
    'photoIndexLabel': {'__id__': photoindexlabel_id},
    'inspectionPhotoNode': {'__id__': inspectionphotonode_id},
    'quotesContainer': {'__id__': quotescontainer_id},
    'quoteDropZoneNode': {'__id__': quotedropzonenode_id},
    'diagnosisTabBar': {'__id__': diagnosistabbar_id},
    'settlementRoot': {'__id__': settlementroot_id},
    'settlementComponent': {'__id__': settlementcomponent_id},
    'reviewRoot': {'__id__': reviewroot_id},
    'reviewComponent': {'__id__': reviewcomponent_id},
    'eventPopupRoot': {'__id__': eventpopuproot_id},
    'pauseBtn': {'__id__': pausebtn_id},
})

# 输出 JSON
output_path = '/Users/yaoleyxing/Developer/solo-mange-pro/MP0359/assets/scenes/main.scene'
with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(scene, f, ensure_ascii=False, indent=2)

print(f"✅ 场景文件已生成: {output_path}")
print(f"   共 {len(scene)} 个对象，__id__ 范围 0~{len(scene)-1}")
print()
print(f"   LevelSceneController 属性绑定:")
for k, v in lsc.items():
    if isinstance(v, dict) and '__id__' in v:
        target = scene[v['__id__']]
        print(f"   ✅ {k:25s} -> __id__={v['__id__']:3d} [{target.get('__type__','?')}] '{target.get('_name','?')}'")
