#!/usr/bin/env python3
"""生成 Cocos Creator Prefab 和场景文件的辅助脚本"""
import json
import uuid
import os

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PREFAB_DIR = os.path.join(BASE, 'assets/resources/prefabs')
SCENE_DIR = os.path.join(BASE, 'assets/scenes')
os.makedirs(PREFAB_DIR, exist_ok=True)
os.makedirs(SCENE_DIR, exist_ok=True)

def nid():
    return uuid.uuid4().hex[:8].lower()

def cid():
    return uuid.uuid4().hex.lower()

def make_label(text, font_size=20, color=None):
    return {
        "__type__": "cc.Label",
        "name": "",
        "_name": "",
        "_objFlags": 0,
        "node": None,
        "_enabled": True,
        "__prefab": None,
        "_useOriginalSize": False,
        "_string": text,
        "_horizontalAlign": 1,
        "_verticalAlign": 1,
        "_actualFontSize": font_size,
        "_fontSize": font_size,
        "_fontFamily": "Arial",
        "_lineHeight": font_size * 1.2,
        "_overflow": 0,
        "_enableWrapText": True,
        "_font": None,
        "_isSystemFontUsed": True,
        "_spacingX": 0,
        "_cacheMode": 0,
        "_color": color or {"__type__": "cc.Color", "r": 51, "g": 51, "b": 51, "a": 255},
        "_id": cid()
    }

def make_button():
    return {
        "__type__": "cc.Button",
        "name": "",
        "_name": "",
        "_objFlags": 0,
        "node": None,
        "_enabled": True,
        "__prefab": None,
        "clickEvents": [],
        "_interactable": True,
        "_transition": 2,
        "_normalColor": {"__type__": "cc.Color", "r": 255, "g": 255, "b": 255, "a": 255},
        "_pressedColor": {"__type__": "cc.Color", "r": 200, "g": 200, "b": 200, "a": 255},
        "_hoverColor": {"__type__": "cc.Color", "r": 211, "g": 211, "b": 211, "a": 255},
        "_disabledColor": {"__type__": "cc.Color", "r": 124, "g": 124, "b": 124, "a": 255},
        "_duration": 0.1,
        "_zoomScale": 1.2,
        "_target": None,
        "_id": cid()
    }

def make_scrollview():
    return {
        "__type__": "cc.ScrollView",
        "name": "",
        "_name": "",
        "_objFlags": 0,
        "node": None,
        "_enabled": True,
        "__prefab": None,
        "_normalizedPosition": {"__type__": "cc.Vec2", "x": 0, "y": 1},
        "_horizontal": True,
        "_vertical": True,
        "_inertia": True,
        "_brake": 0.5,
        "_elastic": True,
        "_bounceDuration": 0.2,
        "_content": None,
        "_view": None,
        "_verticalScrollBar": None,
        "_horizontalScrollBar": None,
        "_cancelInnerEvents": True,
        "scrollEvents": [],
        "_id": cid()
    }

def make_progressbar():
    return {
        "__type__": "cc.ProgressBar",
        "name": "",
        "_name": "",
        "_objFlags": 0,
        "node": None,
        "_enabled": True,
        "__prefab": None,
        "_progress": 0,
        "_totalWidth": 400,
        "_barSprite": None,
        "_mode": 0,
        "reverse": False,
        "_id": cid()
    }

def make_uitransform(w, h):
    return {
        "__type__": "cc.UITransform",
        "name": "",
        "_name": "",
        "_objFlags": 0,
        "node": None,
        "_enabled": True,
        "__prefab": None,
        "_contentSize": {"__type__": "cc.Size", "width": w, "height": h},
        "_anchorPoint": {"__type__": "cc.Vec2", "x": 0.5, "y": 0.5},
        "_id": cid()
    }

def build_node(name, components=None, children=None, position=None, size=None, active=True,
               script_name=None):
    """
    构建一个节点及其所有子节点/组件。
    返回一个 list，第一个元素是该节点字典，后续是组件和子节点（已递归展开）。
    所有 __id__ 暂时为 -1，最后统一分配。
    """
    node_dict = {
        "__id__": -1,
        "__type__": "cc.Node",
        "_name": name,
        "_objFlags": 0,
        "node": None,
        "_parent": None,
        "_children": [],
        "_active": active,
        "_components": [],
        "_prefab": None,
        "_lpos": position or {"__type__": "cc.Vec3", "x": 0, "y": 0, "z": 0},
        "_lrot": {"__type__": "cc.Quat", "x": 0, "y": 0, "z": 0, "w": 1},
        "_lscale": {"__type__": "cc.Vec3", "x": 1, "y": 1, "z": 1},
        "_mobility": 0,
        "_layer": 33554432,
        "_euler": {"__type__": "cc.Vec3", "x": 0, "y": 0, "z": 0},
        "_id": nid()
    }

    all_items = [node_dict]
    comp_list = []

    if size:
        uit = make_uitransform(size[0], size[1])
        comp_list.append(uit)

    if components:
        comp_list.extend(components)

    if script_name:
        sc = {
            "__type__": "cc.Script",
            "name": script_name,
            "_name": "",
            "_objFlags": 0,
            "node": None,
            "_enabled": True,
            "__prefab": None,
            "__scriptAsset": None,
            "_id": cid()
        }
        comp_list.append(sc)

    for c in comp_list:
        c["__id__"] = -1
        all_items.append(c)
        node_dict["_components"].append({"__id__": -1, "_ref": c})

    if children:
        for child_build_result in children:
            child_items = child_build_result
            child_node = child_items[0]
            child_node["__id__"] = -1
            node_dict["_children"].append({"__id__": -1, "_ref": child_node})
            all_items.extend(child_items)

    return all_items

def assign_ids(flat_list):
    """
    给 flat_list 中所有对象分配递增的 __id__，
    并把所有引用（_children/_components 中的 {"__id__":-1, "_ref": x}）替换成 {"__id__": 真实ID}。
    """
    # 建立 obj -> idx 映射
    id_map = {id(obj): idx for idx, obj in enumerate(flat_list)}
    for idx, obj in enumerate(flat_list):
        obj["__id__"] = idx

    for obj in flat_list:
        if obj.get("__type__") == "cc.Node":
            # 处理 _children
            new_children = []
            for ref in obj.get("_children", []):
                if isinstance(ref, dict) and "_ref" in ref:
                    target = ref["_ref"]
                    new_children.append({"__id__": id_map[id(target)]})
                else:
                    new_children.append(ref)
            obj["_children"] = new_children

            # 处理 _components
            new_comps = []
            for ref in obj.get("_components", []):
                if isinstance(ref, dict) and "_ref" in ref:
                    target = ref["_ref"]
                    new_comps.append({"__id__": id_map[id(target)]})
                else:
                    new_comps.append(ref)
            obj["_components"] = new_comps

def finalize(build_result):
    flat = build_result
    assign_ids(flat)
    return flat

def write_prefab(name, build_result):
    data = finalize(build_result)
    filepath = os.path.join(PREFAB_DIR, f'{name}.prefab')
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f'Created prefab: {name}.prefab ({len(data)} objects)')

def vec3(x, y, z=0):
    return {"__type__": "cc.Vec3", "x": x, "y": y, "z": z}

def color(r, g, b, a=255):
    return {"__type__": "cc.Color", "r": r, "g": g, "b": b, "a": a}

# ============================================================
# 生成 UI Prefab
# ============================================================

def gen_task_panel():
    children = [
        build_node("TitleLabel", [make_label("当前任务", 24)], position=vec3(0, 180), size=(400, 40)),
        build_node("TaskNameLabel", [make_label("等待开始...", 22)], position=vec3(0, 120), size=(500, 40)),
        build_node("TaskDescLabel", [make_label("请选择关卡开始游戏", 16, color(100,100,100))], position=vec3(0, 60), size=(500, 100)),
        build_node("TaskTypeLabel", [make_label("类型: 登记", 18, color(33,150,243))], position=vec3(0, -20), size=(200, 30)),
        build_node("StartTaskBtn", [make_button(), make_label("开始观察线索", 18, color(255,255,255))], position=vec3(0, -100), size=(240, 50))
    ]
    result = build_node("TaskPanel", children=children, position=vec3(0, 0), size=(600, 450), script_name="TaskPanel")
    write_prefab("TaskPanel", result)

def gen_clue_panel():
    content = build_node("Content", [], position=vec3(0, 0), size=(550, 600))
    view = build_node("View", children=[content], position=vec3(0, 0), size=(550, 300))
    scroll = build_node("ClueScrollView", [make_scrollview()], children=[view], position=vec3(0, 0), size=(550, 300))
    # 注意：scrollview 组件需要引用 view 和 content 节点，但这里暂时保持 None，运行时由代码设置
    children = [
        build_node("TitleLabel", [make_label("线索资料", 24)], position=vec3(0, 180), size=(400, 40)),
        scroll,
        build_node("DoneButton", [make_button(), make_label("观察完毕，开始评估", 16, color(255,255,255))], position=vec3(0, -170), size=(220, 44))
    ]
    result = build_node("CluePanel", children=children, position=vec3(0, 0), size=(600, 450), script_name="CluePanel")
    write_prefab("CluePanel", result)

def gen_action_panel():
    children = [
        build_node("TitleLabel", [make_label("选择动作", 24)], position=vec3(0, 180), size=(400, 40)),
        build_node("OptionsContainer", [], position=vec3(0, 0), size=(550, 280)),
        build_node("FeedbackLabel", [make_label("", 16)], position=vec3(0, -130), size=(550, 60)),
        build_node("NextButton", [make_button(), make_label("下一步", 16, color(255,255,255))], position=vec3(0, -180), size=(160, 44))
    ]
    result = build_node("ActionPanel", children=children, position=vec3(0, 0), size=(600, 450), script_name="ActionPanel")
    write_prefab("ActionPanel", result)

def gen_settlement_panel():
    children = [
        build_node("LevelNameLabel", [make_label("关卡结算", 26)], position=vec3(0, 200), size=(400, 40)),
        build_node("TotalScoreLabel", [make_label("0", 48, color(33,150,243))], position=vec3(0, 140), size=(200, 60)),
        build_node("PassScoreLabel", [make_label("及格线: 60分", 14, color(120,120,120))], position=vec3(0, 100), size=(200, 20)),
        build_node("StarLabel", [make_label("☆☆☆", 28, color(255,215,0))], position=vec3(0, 60), size=(200, 40)),
        build_node("ScoreProgressBar", [make_progressbar()], position=vec3(0, 20), size=(400, 16)),
        build_node("TimeSpentLabel", [make_label("用时: 0分0秒", 16)], position=vec3(-150, -20), size=(200, 24)),
        build_node("CorrectCountLabel", [make_label("正确: 0/0", 16)], position=vec3(0, -20), size=(200, 24)),
        build_node("InsuranceTriggeredLabel", [make_label("", 14, color(198,40,40))], position=vec3(150, -20), size=(200, 24)),
        build_node("NursingLogTab", [make_button(), make_label("护理日志", 14)], position=vec3(-100, -60), size=(140, 36)),
        build_node("BillingDetailTab", [make_button(), make_label("结算明细", 14)], position=vec3(100, -60), size=(140, 36)),
        build_node("NursingLogPanel", [], position=vec3(0, -140), size=(550, 120)),
        build_node("BillingDetailPanel", [], position=vec3(0, -140), size=(550, 120)),
        build_node("TotalCostLabel", [make_label("总费用: ¥0.00", 14)], position=vec3(-200, -200), size=(180, 24)),
        build_node("TotalInsuranceLabel", [make_label("医保报销: ¥0.00", 14, color(46,125,50))], position=vec3(0, -200), size=(180, 24)),
        build_node("TotalDeniedLabel", [make_label("拒付金额: ¥0.00", 14)], position=vec3(200, -200), size=(180, 24)),
        build_node("DRGWarning", [make_label("", 13, color(255,152,0))], position=vec3(0, -230), size=(550, 22)),
        build_node("SuccessSection", [], position=vec3(0, 0), size=(100, 30)),
        build_node("FailureSection", [], position=vec3(0, 0), size=(100, 30)),
        build_node("RewardsSection", [], position=vec3(0, 0), size=(100, 30)),
        build_node("ExpRewardLabel", [make_label("+0 经验", 14, color(255,152,0))], position=vec3(-80, -260), size=(140, 24)),
        build_node("CoinsRewardLabel", [make_label("+0 金币", 14, color(255,193,7))], position=vec3(80, -260), size=(140, 24)),
        build_node("ReplayButton", [make_button(), make_label("返回菜单", 14, color(255,255,255))], position=vec3(-180, -300), size=(140, 40)),
        build_node("NextLevelButton", [make_button(), make_label("下一关", 14, color(255,255,255))], position=vec3(0, -300), size=(140, 40)),
        build_node("RetryButton", [make_button(), make_label("重新挑战", 14, color(255,255,255))], position=vec3(180, -300), size=(140, 40)),
    ]
    result = build_node("SettlementPanel", children=children, position=vec3(0, 0), size=(700, 700), script_name="SettlementPanel")
    write_prefab("SettlementPanel", result)

def gen_level_select_panel():
    children = [
        build_node("TitleLabel", [make_label("选择关卡", 28)], position=vec3(0, 260), size=(400, 50)),
        build_node("LevelsContainer", [], position=vec3(0, 0), size=(700, 400)),
        build_node("LeaderboardButton", [make_button(), make_label("查看排行榜", 16, color(255,255,255))], position=vec3(0, -260), size=(200, 44))
    ]
    result = build_node("LevelSelectPanel", children=children, position=vec3(0, 0), size=(800, 600), script_name="LevelSelectPanel")
    write_prefab("LevelSelectPanel", result)

def gen_leaderboard_panel():
    children = [
        build_node("TitleLabel", [make_label("排行榜", 26)], position=vec3(0, 240), size=(300, 40)),
        build_node("ScrollView", [make_scrollview()], position=vec3(0, 0), size=(600, 380)),
        build_node("BackButton", [make_button(), make_label("返回", 16, color(255,255,255))], position=vec3(0, -240), size=(160, 44))
    ]
    result = build_node("LeaderboardPanel", children=children, position=vec3(0, 0), size=(700, 550), script_name="LeaderboardPanel")
    write_prefab("LeaderboardPanel", result)

def gen_hud_controller():
    children = [
        build_node("TimerLabel", [make_label("00:00", 20)], position=vec3(-400, 0), size=(120, 30)),
        build_node("ScoreLabel", [make_label("得分: 0", 20, color(33,150,243))], position=vec3(-200, 0), size=(150, 30)),
        build_node("InsuranceLabel", [make_label("", 14, color(198,40,40))], position=vec3(200, 0), size=(200, 30)),
        build_node("PhaseLabel", [make_label("阶段: 选择", 14)], position=vec3(400, 0), size=(160, 30))
    ]
    result = build_node("HUDController", children=children, position=vec3(0, 320), size=(1280, 60), script_name="HUDController")
    write_prefab("HUDController", result)

def gen_ui_controller():
    children = [
        build_node("LevelSelectRoot", [], position=vec3(0, 0), size=(800, 600)),
        build_node("GameplayRoot", [], position=vec3(0, 0), size=(800, 600)),
        build_node("SettlementRoot", [], position=vec3(0, 0), size=(800, 600)),
        build_node("LeaderboardRoot", [], position=vec3(0, 0), size=(800, 600)),
        build_node("TaskTabButton", [make_button(), make_label("任务", 14, color(255,255,255))], position=vec3(-180, 210), size=(100, 36)),
        build_node("ClueTabButton", [make_button(), make_label("线索", 14, color(255,255,255))], position=vec3(0, 210), size=(100, 36)),
        build_node("ActionTabButton", [make_button(), make_label("动作", 14, color(255,255,255))], position=vec3(180, 210), size=(100, 36))
    ]
    result = build_node("UIController", children=children, position=vec3(0, 0), size=(1280, 720), script_name="UIController")
    write_prefab("UIController", result)

def gen_tutorial_controller():
    children = [
        build_node("TipLabel", [make_label("提示内容", 16)], position=vec3(0, 10), size=(400, 60)),
        build_node("NextButton", [make_button(), make_label("我知道了", 14, color(255,255,255))], position=vec3(0, -50), size=(160, 40))
    ]
    result = build_node("TutorialController", children=children, position=vec3(0, 0), size=(500, 200), script_name="TutorialController")
    write_prefab("TutorialController", result)

def gen_scene_controller():
    children = [
        build_node("TiledMapContainer", [], position=vec3(-384, -256), size=(768, 512)),
        build_node("InteractiveObjects", [], position=vec3(0, 0), size=(768, 512))
    ]
    result = build_node("SceneController", children=children, position=vec3(0, 0), size=(768, 512), script_name="SceneController")
    write_prefab("SceneController", result)

def gen_billing_item_row():
    children = [
        build_node("NameLabel", [make_label("项目名称", 13)], position=vec3(-180, 0), size=(160, 22)),
        build_node("CodeLabel", [make_label("编码", 12, color(100,100,100))], position=vec3(-60, 0), size=(90, 22)),
        build_node("CostLabel", [make_label("¥0.00", 13)], position=vec3(40, 0), size=(80, 22)),
        build_node("InsuranceLabel", [make_label("¥0.00", 13, color(46,125,50))], position=vec3(130, 0), size=(80, 22)),
        build_node("StatusLabel", [make_label("✅ 通过", 13, color(46,125,50))], position=vec3(230, 0), size=(80, 22))
    ]
    result = build_node("BillingItemRow", children=children, position=vec3(0, 0), size=(540, 24), script_name="BillingItemRow")
    write_prefab("BillingItemRow", result)

def gen_simple_prefab(name, script_name):
    result = build_node(name, [], position=vec3(0, 0), size=(100, 100), script_name=script_name)
    write_prefab(name, result)

def gen_test_runner():
    children = [
        build_node("TestPanel", [make_label("测试运行面板", 18)], position=vec3(0, 0), size=(600, 400))
    ]
    result = build_node("TestRunner", children=children, position=vec3(0, 0), size=(600, 400), script_name="TestRunner")
    write_prefab("TestRunner", result)

# ============================================================
# 生成主场景 MainScene
# ============================================================
def gen_main_scene():
    # 构建子节点：UIRoot 和 SceneRoot
    ui_root = build_node("UIRoot", [], position=vec3(0, 0), size=(1280, 720))
    scene_root = build_node("SceneRoot", [], position=vec3(0, 0), size=(768, 512))

    canvas = build_node("Canvas", [
        # UITransform 在 build_node 的 size 参数处理
        {
            "__type__": "cc.Canvas",
            "name": "", "_name": "", "_objFlags": 0, "node": None,
            "_enabled": True, "__prefab": None,
            "_cameraComponent": None,
            "_alignCanvasWithScreen": True,
            "_id": cid()
        },
        {
            "__type__": "cc.Widget",
            "name": "", "_name": "", "_objFlags": 0, "node": None,
            "_enabled": True, "__prefab": None,
            "alignMode": 2, "_target": None,
            "_isAbsLeft": True, "_isAbsRight": True, "_isAbsTop": True, "_isAbsBottom": True,
            "_isAbsHorizontalCenter": True, "_isAbsVerticalCenter": True,
            "_originalWidth": 1280, "_originalHeight": 720,
            "left": 0, "right": 0, "top": 0, "bottom": 0,
            "horizontalCenter": 0, "verticalCenter": 0,
            "isAlignLeft": True, "isAlignRight": True, "isAlignTop": True, "isAlignBottom": True,
            "isAlignHorizontalCenter": False, "isAlignVerticalCenter": False,
            "_id": cid()
        }
    ], children=[ui_root, scene_root], position=vec3(0, 0), size=(1280, 720), script_name="MainScene")

    flat_canvas = finalize(canvas)

    scene_asset_id = 0
    scene_obj_id = 1

    scene_data = [
        {
            "__type__": "cc.SceneAsset",
            "_name": "MainScene",
            "_objFlags": 0,
            "_native": "",
            "scene": {"__id__": scene_obj_id},
            "_id": cid()
        },
        {
            "__type__": "cc.Scene",
            "_name": "MainScene",
            "_objFlags": 0,
            "_parent": None,
            "_children": [],
            "_active": True,
            "_components": [],
            "_prefab": None,
            "_lpos": vec3(0, 0, 0),
            "_lrot": {"__type__": "cc.Quat", "x": 0, "y": 0, "z": 0, "w": 1},
            "_lscale": {"__type__": "cc.Vec3", "x": 1, "y": 1, "z": 1},
            "_mobility": 0,
            "_layer": 1073741824,
            "_euler": {"__type__": "cc.Vec3", "x": 0, "y": 0, "z": 0},
            "_id": cid(),
            "autoReleaseAssets": False,
            "_globals": {"__id__": -1}
        }
    ]

    # 把 canvas 所有元素加入 scene_data 并更新 ID
    base_idx = len(scene_data)
    canvas_node_idx = -1
    for idx, obj in enumerate(flat_canvas):
        new_id = base_idx + idx
        old_id = obj["__id__"]
        obj["__id__"] = new_id
        if idx == 0:  # Canvas 节点
            canvas_node_idx = new_id
        # 更新内部引用
        if obj.get("__type__") == "cc.Node":
            new_children = []
            for ref in obj.get("_children", []):
                if isinstance(ref, dict) and "__id__" in ref:
                    new_children.append({"__id__": ref["__id__"] + base_idx})
                else:
                    new_children.append(ref)
            obj["_children"] = new_children
            new_comps = []
            for ref in obj.get("_components", []):
                if isinstance(ref, dict) and "__id__" in ref:
                    new_comps.append({"__id__": ref["__id__"] + base_idx})
                else:
                    new_comps.append(ref)
            obj["_components"] = new_comps
        scene_data.append(obj)

    # 把 Canvas 挂到 Scene 的 children
    scene_data[scene_obj_id]["_children"] = [{"__id__": canvas_node_idx}]

    # 添加 GlobalConfig（Ambient/Skybox/Fog 等）
    gc_node_idx = len(scene_data)
    scene_data.append({
        "__type__": "cc.Node",
        "_name": "GlobalConfig",
        "_objFlags": 0, "node": None,
        "_parent": {"__id__": scene_obj_id},
        "_children": [],
        "_active": True,
        "_components": [],
        "_prefab": None,
        "_lpos": vec3(0, 0, 0),
        "_lrot": {"__type__": "cc.Quat", "x": 0, "y": 0, "z": 0, "w": 1},
        "_lscale": {"__type__": "cc.Vec3", "x": 1, "y": 1, "z": 1},
        "_mobility": 0,
        "_layer": 1073741824,
        "_euler": {"__type__": "cc.Vec3", "x": 0, "y": 0, "z": 0},
        "_id": cid()
    })

    # 挂到 Scene 下
    scene_data[scene_obj_id]["_children"].append({"__id__": gc_node_idx})

    ambient_idx = len(scene_data)
    scene_data.append({
        "__type__": "cc.AmbientInfo",
        "name": "", "_name": "", "_objFlags": 0, "node": None,
        "_enabled": True, "__prefab": None,
        "_skyColorHDR": {"__type__": "cc.Vec4", "x": 0.2, "y": 0.5, "z": 0.8, "w": 0.520833},
        "_skyColor": {"__type__": "cc.Vec4", "x": 0.2, "y": 0.5, "z": 0.8, "w": 0.520833},
        "_skyIllumHDR": 20000, "_skyIllum": 20000,
        "_groundAlbedoHDR": {"__type__": "cc.Vec4", "x": 0.2, "y": 0.2, "z": 0.2, "w": 1},
        "_groundAlbedo": {"__type__": "cc.Vec4", "x": 0.2, "y": 0.2, "z": 0.2, "w": 1},
        "_skyColorLDR": {"__type__": "cc.Vec4", "x": 0.452588, "y": 0.607642, "z": 0.755699, "w": 0.520833},
        "_skyIllumLDR": 0.8,
        "_groundAlbedoLDR": {"__type__": "cc.Vec4", "x": 0.2, "y": 0.2, "z": 0.2, "w": 1},
        "_skyColorLDRExponent": 1, "_skyIllumLDRExponent": 1, "_groundAlbedoLDRExponent": 1,
        "_id": cid()
    })
    scene_data[gc_node_idx]["_components"].append({"__id__": ambient_idx})
    scene_data[scene_obj_id]["_globals"] = {"__id__": ambient_idx}

    # Scene 必须引用 ambient 作为 globals，同时把剩余组件补齐
    others = [
        ("cc.SkyboxInfo", {"envLightingType": 0, "envmapHDR": None, "envmap": None, "envmapLDR": None,
                           "diffuseMapHDR": None, "diffuseMapLDR": None,
                           "envmapLDRExponent": 1, "diffuseMapLDRExponent": 1}),
        ("cc.FogInfo", {"_enabled": False, "_type": 0,
                        "_fogColor": {"__type__": "cc.Vec3", "x": 0.5, "y": 0.5, "z": 0.5},
                        "_fogDensity": 0.3, "_fogStart": 0.5, "_fogEnd": 300,
                        "_fogAtten": 5, "_fogTop": 1.5, "_fogRange": 1.2, "_accurate": False}),
        ("cc.OctahedronMapReduceInfo", {"_bounces": 2, "_reduceRings": 0, "_reduceSamples": 0}),
        ("cc.PostSettingsInfo", {"_toneMappingType": 0, "toneMappingExposure": 1}),
        ("cc.ShadowsInfo", {"_enabled": False, "_type": 0,
                            "_normal": {"__type__": "cc.Vec3", "x": 0, "y": 1, "z": 0},
                            "_distance": 0,
                            "_shadowColor": {"__type__": "cc.Color", "r": 76, "g": 76, "b": 76, "a": 255},
                            "_maxReceived": 4,
                            "_size": {"__type__": "cc.Vec2", "x": 512, "y": 512}}),
    ]
    for t, extra in others:
        idx = len(scene_data)
        obj = {"__type__": t, "name": "", "_name": "", "_objFlags": 0,
               "node": None, "_enabled": True, "__prefab": None, "_id": cid()}
        obj.update(extra)
        obj["__id__"] = idx
        scene_data.append(obj)
        scene_data[gc_node_idx]["_components"].append({"__id__": idx})

    # 写文件
    filepath = os.path.join(SCENE_DIR, 'MainScene.scene')
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(scene_data, f, ensure_ascii=False, indent=2)
    print(f'Created scene: MainScene.scene ({len(scene_data)} objects)')

if __name__ == "__main__":
    print("开始生成 Cocos Creator Prefab 和场景...\n")
    gen_task_panel()
    gen_clue_panel()
    gen_action_panel()
    gen_settlement_panel()
    gen_level_select_panel()
    gen_leaderboard_panel()
    gen_hud_controller()
    gen_ui_controller()
    gen_tutorial_controller()
    gen_scene_controller()
    gen_billing_item_row()
    gen_simple_prefab("GameManager", "GameManager")
    gen_simple_prefab("GameBootstrap", "GameBootstrap")
    gen_test_runner()
    gen_main_scene()
    print("\n✅ 所有 Prefab 和场景生成完成！")
