#!/usr/bin/env python3
"""生成 Cocos Creator 3.8.0 Prefab 和场景文件的辅助脚本"""
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


def make_node(name: str, w: int = 0, h: int = 0, x: int = 0, y: int = 0,
             active: bool = True, layer: int = 33554432) -> dict:
    node = {
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
        "_lpos": {"__type__": "cc.Vec3", "x": x, "y": y, "z": 0},
        "_lrot": {"__type__": "cc.Quat", "x": 0, "y": 0, "z": 0, "w": 1},
        "_lscale": {"__type__": "cc.Vec3", "x": 1, "y": 1, "z": 1},
        "_mobility": 0,
        "_layer": layer,
        "_euler": {"__type__": "cc.Vec3", "x": 0, "y": 0, "z": 0},
        "_id": nid()
    }
    if w > 0 or h > 0:
        uit = {
            "__id__": -1,
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
        node["_components"].append({"__id__": -1, "_ref": uit})
        return [node, uit]
    return [node]


def make_label(text: str, font_size: int = 20,
               color: tuple = (51, 51, 51, 255)) -> dict:
    return {
        "__id__": -1,
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
        "_color": {
            "__type__": "cc.Color",
            "r": color[0], "g": color[1], "b": color[2], "a": color[3]
        },
        "_id": cid()
    }


def make_button() -> dict:
    return {
        "__id__": -1,
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


def make_scrollview() -> dict:
    return {
        "__id__": -1,
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


def make_progressbar() -> dict:
    return {
        "__id__": -1,
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


def make_sprite() -> dict:
    return {
        "__id__": -1,
        "__type__": "cc.Sprite",
        "name": "",
        "_name": "",
        "_objFlags": 0,
        "node": None,
        "_enabled": True,
        "__prefab": None,
        "_spriteFrame": None,
        "_type": 0,
        "_fillType": 0,
        "_sizeMode": 0,
        "_fillCenter": {"__type__": "cc.Vec2", "x": 0, "y": 0},
        "_fillStart": 0,
        "_fillRange": 0,
        "_isTrimmedMode": False,
        "_useGrayscale": False,
        "_atlas": None,
        "_color": {"__type__": "cc.Color", "r": 255, "g": 255, "b": 255, "a": 255},
        "_flipU": 0,
        "_flipV": 0,
        "_id": cid()
    }


def make_widget() -> dict:
    return {
        "__id__": -1,
        "__type__": "cc.Widget",
        "name": "",
        "_name": "",
        "_objFlags": 0,
        "node": None,
        "_enabled": True,
        "__prefab": None,
        "alignMode": 2,
        "_target": None,
        "_isAbsLeft": True,
        "_isAbsRight": True,
        "_isAbsTop": True,
        "_isAbsBottom": True,
        "_isAbsHorizontalCenter": True,
        "_isAbsVerticalCenter": True,
        "_originalWidth": 1280,
        "_originalHeight": 720,
        "left": 0,
        "right": 0,
        "top": 0,
        "bottom": 0,
        "horizontalCenter": 0,
        "verticalCenter": 0,
        "isAlignLeft": True,
        "isAlignRight": True,
        "isAlignTop": True,
        "isAlignBottom": True,
        "isAlignHorizontalCenter": False,
        "isAlignVerticalCenter": False,
        "_id": cid()
    }


def make_canvas() -> dict:
    return {
        "__id__": -1,
        "__type__": "cc.Canvas",
        "name": "",
        "_name": "",
        "_objFlags": 0,
        "node": None,
        "_enabled": True,
        "__prefab": None,
        "_cameraComponent": None,
        "_alignCanvasWithScreen": True,
        "_id": cid()
    }


def make_script(ccclass_name: str, uuid_map: dict, **properties) -> dict:
    uuid = uuid_map.get(ccclass_name, "")
    script = {
        "__id__": -1,
        "__type__": "cc.Script",
        "name": ccclass_name,
        "_name": "",
        "_objFlags": 0,
        "node": None,
        "_enabled": True,
        "__prefab": None,
        "__scriptAsset": {
            "__uuid__": uuid,
            "__expectedType__": "cc.Component"
        },
        "_id": cid()
    }
    for key, value in properties.items():
        script[key] = value
    return script


def finalize(flat_objects: list) -> list:
    id_map = {}
    for idx, obj in enumerate(flat_objects):
        obj["__id__"] = idx
        id_map[id(obj)] = idx

    for obj in flat_objects:
        if obj.get("__type__") == "cc.Node":
            new_children = []
            for ref in obj.get("_children", []):
                if isinstance(ref, dict) and "_ref" in ref:
                    target = ref["_ref"]
                    new_children.append({"__id__": id_map[id(target)]})
                else:
                    new_children.append(ref)
            obj["_children"] = new_children

            new_comps = []
            for ref in obj.get("_components", []):
                if isinstance(ref, dict) and "_ref" in ref:
                    target = ref["_ref"]
                    new_comps.append({"__id__": id_map[id(target)]})
                else:
                    new_comps.append(ref)
            obj["_components"] = new_comps

            if obj.get("_parent") is not None and isinstance(obj["_parent"], dict) and "_ref" in obj["_parent"]:
                target = obj["_parent"]["_ref"]
                obj["_parent"] = {"__id__": id_map[id(target)]}

        elif obj.get("__type__") == "cc.Script":
            for key, value in obj.items():
                if key.startswith("__") or key in ["_name", "name", "_objFlags", "node", "_enabled", "__prefab", "__scriptAsset", "_id"]:
                    continue
                if isinstance(value, dict) and "_ref" in value:
                    target = value["_ref"]
                    obj[key] = {"__id__": id_map[id(target)]}

    return flat_objects


def add_components(node_obj: dict, components: list, flat_list: list):
    for comp in components:
        node_obj["_components"].append({"__id__": -1, "_ref": comp})
        flat_list.append(comp)


def add_child(parent_obj: dict, child_build_result: list, flat_list: list):
    child_node = child_build_result[0]
    child_node["_parent"] = {"__id__": -1, "_ref": parent_obj}
    parent_obj["_children"].append({"__id__": -1, "_ref": child_node})
    flat_list.extend(child_build_result)


def write_prefab(name: str, flat_objects: list):
    data = finalize(flat_objects)
    filepath = os.path.join(PREFAB_DIR, f'{name}.prefab')
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f'Created prefab: {name}.prefab ({len(data)} objects)')


def find_by_name(flat_list: list, name: str) -> dict:
    for obj in flat_list:
        if obj.get("_name") == name:
            return obj
    return None


def find_component(flat_list: list, node_name: str, comp_type: str) -> dict:
    node = find_by_name(flat_list, node_name)
    if not node:
        for comp_ref in node.get("_components", []):
            comp_id = comp_ref.get("__id__")
            if comp_id is not None and comp_id < len(flat_list):
                comp = flat_list[comp_id]
                if comp.get("__type__") == comp_type:
                    return comp
    return None


def gen_task_panel(uuid_map: dict):
    flat = []

    root = make_node("TaskPanel", 600, 450, 0, 0)
    flat.extend(root)
    root_node = root[0]

    task_name = make_node("taskNameLabel", 500, 40, 0, 160)
    add_child(root_node, task_name, flat)
    task_name_label = make_label("等待开始...", 22)
    add_components(task_name[0], [task_name_label], flat)

    task_desc = make_node("taskDescLabel", 500, 80, 0, 100)
    add_child(root_node, task_desc, flat)
    task_desc_label = make_label("请选择关卡开始游戏", 16, (100, 100, 100, 255))
    add_components(task_desc[0], [task_desc_label], flat)

    task_type = make_node("taskTypeLabel", 200, 30, 0, 40)
    add_child(root_node, task_type, flat)
    task_type_label = make_label("", 18, (33, 150, 243, 255))
    add_components(task_type[0], [task_type_label], flat)

    task_progress = make_node("taskProgressLabel", 300, 30, 0, 0)
    add_child(root_node, task_progress, flat)
    task_progress_label = make_label("任务进度: 0/0", 16)
    add_components(task_progress[0], [task_progress_label], flat)

    clue_indicator = make_node("clueIndicator", 200, 24, -120, -40)
    add_child(root_node, clue_indicator, flat)
    clue_count_label = make_label("", 14)
    add_components(clue_indicator[0], [clue_count_label], flat)

    accept_btn = make_node("acceptButton", 240, 50, 0, -100)
    add_child(root_node, accept_btn, flat)
    accept_btn_label = make_label("开始观察线索", 18, (255, 255, 255, 255))
    add_components(accept_btn[0], [make_button(), accept_btn_label], flat)

    script = make_script("TaskPanel", uuid_map,
                        taskNameLabel={"__id__": -1, "_ref": task_name_label},
                        taskDescLabel={"__id__": -1, "_ref": task_desc_label},
                        taskTypeLabel={"__id__": -1, "_ref": task_type_label},
                        taskProgressLabel={"__id__": -1, "_ref": task_progress_label},
                        clueIndicator={"__id__": -1, "_ref": clue_indicator[0]},
                        clueCountLabel={"__id__": -1, "_ref": clue_count_label},
                        acceptButton={"__id__": -1, "_ref": accept_btn[0]})
    add_components(root_node, [script], flat)

    write_prefab("TaskPanel", flat)


def gen_clue_panel(uuid_map: dict):
    flat = []

    root = make_node("CluePanel", 600, 450, 0, 0)
    flat.extend(root)
    root_node = root[0]

    title = make_node("titleLabel", 400, 40, 0, 180)
    add_child(root_node, title, flat)
    title_label = make_label("线索资料", 24)
    add_components(title[0], [title_label], flat)

    container = make_node("clueContainer", 550, 300, 0, 0)
    add_child(root_node, container, flat)

    done_btn = make_node("observeCompleteButton", 220, 44, 0, -180)
    add_child(root_node, done_btn, flat)
    done_btn_label = make_label("观察完毕，开始评估", 16, (255, 255, 255, 255))
    add_components(done_btn[0], [make_button(), done_btn_label], flat)

    script = make_script("CluePanel", uuid_map,
                          clueScrollView=None,
                          clueContainer={"__id__": -1, "_ref": container[0]},
                          observeCompleteButton={"__id__": -1, "_ref": done_btn[0]},
                          titleLabel={"__id__": -1, "_ref": title_label})
    add_components(root_node, [script], flat)

    write_prefab("CluePanel", flat)


def gen_action_panel(uuid_map: dict):
    flat = []

    root = make_node("ActionPanel", 600, 450, 0, 0)
    flat.extend(root)
    root_node = root[0]

    options_container = make_node("optionsContainer", 550, 280, 0, 60)
    add_child(root_node, options_container, flat)

    hint = make_node("hintLabel", 550, 30, 0, -70)
    add_child(root_node, hint, flat)
    hint_label = make_label("", 14, (100, 100, 100, 255))
    add_components(hint[0], [hint_label], flat)

    feedback_section = make_node("feedbackSection", 550, 80, 0, -130, active=False)
    add_child(root_node, feedback_section, flat)

    explain = make_node("feedbackExplanationLabel", 530, 24, 0, 25)
    add_child(feedback_section[0], explain, flat)
    explain_label = make_label("", 14)
    add_components(explain[0], [explain_label], flat)

    score = make_node("feedbackScoreLabel", 200, 24, -120, -5)
    add_child(feedback_section[0], score, flat)
    score_label = make_label("", 16)
    add_components(score[0], [score_label], flat)

    error = make_node("feedbackErrorLabel", 300, 24, 80, -5)
    add_child(feedback_section[0], error, flat)
    error_label = make_label("", 13, (198, 40, 40, 255))
    add_components(error[0], [error_label], flat)

    proceed_btn = make_node("proceedButton", 160, 44, 0, -190, active=False)
    add_child(root_node, proceed_btn, flat)
    proceed_btn_label = make_label("下一步", 16, (255, 255, 255, 255))
    add_components(proceed_btn[0], [make_button(), proceed_btn_label], flat)

    script = make_script("ActionPanel", uuid_map,
                          optionsContainer={"__id__": -1, "_ref": options_container[0]},
                          hintLabel={"__id__": -1, "_ref": hint_label},
                          feedbackSection={"__id__": -1, "_ref": feedback_section[0]},
                          feedbackExplanationLabel={"__id__": -1, "_ref": explain_label},
                          feedbackScoreLabel={"__id__": -1, "_ref": score_label},
                          feedbackErrorLabel={"__id__": -1, "_ref": error_label},
                          proceedButton={"__id__": -1, "_ref": proceed_btn[0]})
    add_components(root_node, [script], flat)

    write_prefab("ActionPanel", flat)


def gen_settlement_panel(uuid_map: dict):
    flat = []

    root = make_node("SettlementPanel", 700, 700, 0, 0)
    flat.extend(root)
    root_node = root[0]

    level_name = make_node("levelNameLabel", 400, 40, 0, 300)
    add_child(root_node, level_name, flat)
    level_name_label = make_label("关卡结算", 26)
    add_components(level_name[0], [level_name_label], flat)

    total_score = make_node("totalScoreLabel", 200, 60, 0, 240)
    add_child(root_node, total_score, flat)
    total_score_label = make_label("0", 48, (33, 150, 243, 255))
    add_components(total_score[0], [total_score_label], flat)

    pass_score = make_node("passScoreLabel", 200, 20, 0, 200)
    add_child(root_node, pass_score, flat)
    pass_score_label = make_label("及格线: 60分", 14, (120, 120, 120, 255))
    add_components(pass_score[0], [pass_score_label], flat)

    star_label_node = make_node("starLabel", 200, 40, 0, 160)
    add_child(root_node, star_label_node, flat)
    star_label_comp = make_label("☆☆☆", 28, (255, 215, 0, 255))
    add_components(star_label_node[0], [star_label_comp], flat)

    score_bar = make_node("scoreProgressBar", 400, 16, 0, 120)
    add_child(root_node, score_bar, flat)
    progress_bar = make_progressbar()
    add_components(score_bar[0], [progress_bar], flat)

    time_spent = make_node("timeSpentLabel", 200, 24, -180, 80)
    add_child(root_node, time_spent, flat)
    time_spent_label = make_label("用时: 0分0秒", 16)
    add_components(time_spent[0], [time_spent_label], flat)

    correct_count = make_node("correctCountLabel", 200, 24, 0, 80)
    add_child(root_node, correct_count, flat)
    correct_count_label = make_label("正确: 0/0", 16)
    add_components(correct_count[0], [correct_count_label], flat)

    insurance_triggered = make_node("insuranceTriggeredLabel", 200, 24, 180, 80)
    add_child(root_node, insurance_triggered, flat)
    insurance_triggered_label = make_label("", 14, (198, 40, 40, 255))
    add_components(insurance_triggered[0], [insurance_triggered_label], flat)

    success_section = make_node("successSection", 600, 40, 0, 40)
    add_child(root_node, success_section, flat)
    success_label = make_label("✅ 通过！", 20, (46, 125, 50, 255))
    add_components(success_section[0], [success_label], flat)

    failure_section = make_node("failureSection", 600, 40, 0, 40, active=False)
    add_child(root_node, failure_section, flat)
    failure_label = make_label("❌ 未通过", 20, (198, 40, 40, 255))
    add_components(failure_section[0], [failure_label], flat)

    rewards_section = make_node("rewardsSection", 400, 24, 0, 0)
    add_child(root_node, rewards_section, flat)

    exp_reward = make_node("expRewardLabel", 140, 24, -80, 0)
    add_child(rewards_section[0], exp_reward, flat)
    exp_reward_label = make_label("", 14, (255, 152, 0, 255))
    add_components(exp_reward[0], [exp_reward_label], flat)

    coins_reward = make_node("coinsRewardLabel", 140, 24, 80, 0)
    add_child(rewards_section[0], coins_reward, flat)
    coins_reward_label = make_label("", 14, (255, 193, 7, 255))
    add_components(coins_reward[0], [coins_reward_label], flat)

    nursing_tab = make_node("nursingLogTab", 140, 36, -100, -60)
    add_child(root_node, nursing_tab, flat)
    nursing_tab_label = make_label("护理日志", 14)
    add_components(nursing_tab[0], [make_button(), nursing_tab_label], flat)

    billing_tab = make_node("billingDetailTab", 140, 36, 100, -60)
    add_child(root_node, billing_tab, flat)
    billing_tab_label = make_label("结算明细", 14)
    add_components(billing_tab[0], [make_button(), billing_tab_label], flat)

    nursing_log_panel = make_node("nursingLogPanel", 550, 120, 0, -140)
    add_child(root_node, nursing_log_panel, flat)

    billing_detail_panel = make_node("billingDetailPanel", 550, 120, 0, -140)
    add_child(root_node, billing_detail_panel, flat)

    billing_container = make_node("billingContainer", 540, 100, 0, 0)
    add_child(billing_detail_panel[0], billing_container, flat)

    total_cost = make_node("totalCostLabel", 180, 24, -200, -210)
    add_child(root_node, total_cost, flat)
    total_cost_label = make_label("总费用: ¥0.00", 14)
    add_components(total_cost[0], [total_cost_label], flat)

    total_insurance = make_node("totalInsuranceLabel", 180, 24, 0, -210)
    add_child(root_node, total_insurance, flat)
    total_insurance_label = make_label("医保报销: ¥0.00", 14, (46, 125, 50, 255))
    add_components(total_insurance[0], [total_insurance_label], flat)

    total_denied = make_node("totalDeniedLabel", 180, 24, 200, -210)
    add_child(root_node, total_denied, flat)
    total_denied_label = make_label("拒付金额: ¥0.00", 14)
    add_components(total_denied[0], [total_denied_label], flat)

    drg_warning = make_node("drgWarning", 550, 22, 0, -240)
    add_child(root_node, drg_warning, flat)
    drg_cost_label = make_label("", 13, (255, 152, 0, 255))
    add_components(drg_warning[0], [drg_cost_label], flat)

    replay_btn = make_node("replayButton", 140, 40, -180, -300)
    add_child(root_node, replay_btn, flat)
    replay_btn_label = make_label("返回菜单", 14, (255, 255, 255, 255))
    add_components(replay_btn[0], [make_button(), replay_btn_label], flat)

    next_level_btn = make_node("nextLevelButton", 140, 40, 0, -300)
    add_child(root_node, next_level_btn, flat)
    next_level_btn_label = make_label("下一关", 14, (255, 255, 255, 255))
    add_components(next_level_btn[0], [make_button(), next_level_btn_label], flat)

    retry_btn = make_node("retryButton", 140, 40, 180, -300, active=False)
    add_child(root_node, retry_btn, flat)
    retry_btn_label = make_label("重新挑战", 14, (255, 255, 255, 255))
    add_components(retry_btn[0], [make_button(), retry_btn_label], flat)

    script = make_script("SettlementPanel", uuid_map,
                      successSection={"__id__": -1, "_ref": success_section[0]},
                      failureSection={"__id__": -1, "_ref": failure_section[0]},
                      levelNameLabel={"__id__": -1, "_ref": level_name_label},
                      totalScoreLabel={"__id__": -1, "_ref": total_score_label},
                      passScoreLabel={"__id__": -1, "_ref": pass_score_label},
                      scoreProgressBar={"__id__": -1, "_ref": progress_bar},
                      starLabel={"__id__": -1, "_ref": star_label_node[0]},
                      timeSpentLabel={"__id__": -1, "_ref": time_spent_label},
                      correctCountLabel={"__id__": -1, "_ref": correct_count[0]},
                      insuranceTriggeredLabel={"__id__": -1, "_ref": insurance_triggered[0]},
                      rewardsSection={"__id__": -1, "_ref": rewards_section[0]},
                      expRewardLabel={"__id__": -1, "_ref": exp_reward_label},
                      coinsRewardLabel={"__id__": -1, "_ref": coins_reward_label},
                      nursingLogTab={"__id__": -1, "_ref": nursing_tab[0]},
                      billingDetailTab={"__id__": -1, "_ref": billing_tab[0]},
                      nursingLogPanel={"__id__": -1, "_ref": nursing_log_panel[0]},
                      billingDetailPanel={"__id__": -1, "_ref": billing_detail_panel[0]},
                      billingScrollView=None,
                      billingContainer={"__id__": -1, "_ref": billing_container[0]},
                      totalCostLabel={"__id__": -1, "_ref": total_cost_label},
                      totalInsuranceLabel={"__id__": -1, "_ref": total_insurance_label},
                      totalDeniedLabel={"__id__": -1, "_ref": total_denied_label},
                      drgWarning={"__id__": -1, "_ref": drg_warning[0]},
                      drgCostLabel={"__id__": -1, "_ref": drg_cost_label},
                      replayButton={"__id__": -1, "_ref": replay_btn[0]},
                      nextLevelButton={"__id__": -1, "_ref": next_level_btn[0]},
                      retryButton={"__id__": -1, "_ref": retry_btn[0]})
    add_components(root_node, [script], flat)

    write_prefab("SettlementPanel", flat)


def gen_level_select_panel(uuid_map: dict):
    flat = []

    root = make_node("LevelSelectPanel", 800, 600, 0, 0)
    flat.extend(root)
    root_node = root[0]

    title = make_node("titleLabel", 400, 50, 0, 260)
    add_child(root_node, title, flat)
    title_label = make_label("选择关卡", 28)
    add_components(title[0], [title_label], flat)

    container = make_node("levelContainer", 700, 400, 0, 0)
    add_child(root_node, container, flat)

    lb_btn = make_node("leaderboardButton", 200, 44, 0, -260)
    add_child(root_node, lb_btn, flat)
    lb_btn_label = make_label("查看排行榜", 16, (255, 255, 255, 255))
    add_components(lb_btn[0], [make_button(), lb_btn_label], flat)

    script = make_script("LevelSelectPanel", uuid_map,
                          levelScrollView=None,
                          levelContainer={"__id__": -1, "_ref": container[0]},
                          totalScoreLabel=None,
                          playerLevelLabel=None,
                          coinsLabel=None)
    add_components(root_node, [script], flat)

    write_prefab("LevelSelectPanel", flat)


def gen_leaderboard_panel(uuid_map: dict):
    flat = []

    root = make_node("LeaderboardPanel", 700, 550, 0, 0)
    flat.extend(root)
    root_node = root[0]

    title = make_node("titleLabel", 300, 40, 0, 240)
    add_child(root_node, title, flat)
    title_label = make_label("排行榜", 26)
    add_components(title[0], [title_label], flat)

    container = make_node("leaderboardContainer", 600, 380, 0, 0)
    add_child(root_node, container, flat)

    back_btn = make_node("backButton", 160, 44, 0, -240)
    add_child(root_node, back_btn, flat)
    back_btn_label = make_label("返回", 16, (255, 255, 255, 255))
    add_components(back_btn[0], [make_button(), back_btn_label], flat)

    script = make_script("LeaderboardPanel", uuid_map,
                      leaderboardScrollView=None,
                      leaderboardContainer={"__id__": -1, "_ref": container[0]},
                      levelFilterNode=None,
                      currentRankLabel=None,
                      currentScoreLabel=None)
    add_components(root_node, [script], flat)

    write_prefab("LeaderboardPanel", flat)


def gen_hud_controller(uuid_map: dict):
    flat = []

    root = make_node("HUDController", 1280, 60, 0, 320)
    flat.extend(root)
    root_node = root[0]

    level_name = make_node("levelNameLabel", 200, 30, -450, 0)
    add_child(root_node, level_name, flat)
    level_name_label = make_label("康复中心模拟训练", 18)
    add_components(level_name[0], [level_name_label], flat)

    score = make_node("scoreLabel", 150, 30, -250, 0)
    add_child(root_node, score, flat)
    score_label = make_label("0分", 20, (33, 150, 243, 255))
    add_components(score[0], [score_label], flat)

    time = make_node("timeLabel", 120, 30, -80, 0)
    add_child(root_node, time, flat)
    time_label = make_label("--:--", 20)
    add_components(time[0], [time_label], flat)

    insurance_count = make_node("insuranceCountLabel", 200, 30, 120, 0)
    add_child(root_node, insurance_count, flat)
    insurance_count_label = make_label("", 14, (198, 40, 40, 255))
    add_components(insurance_count[0], [insurance_count_label], flat)

    phase = make_node("phaseLabel", 160, 30, 400, 0)
    add_child(root_node, phase, flat)
    phase_label = make_label("主菜单", 14)
    add_components(phase[0], [phase_label], flat)

    insurance_warning = make_node("insuranceWarningIcon", 32, 32, 30, 0)
    add_child(root_node, insurance_warning, flat)

    abandon_btn = make_node("abandonButton", 100, 30, 500, 0)
    add_child(root_node, abandon_btn, flat)
    abandon_btn_label = make_label("放弃", 12, (255, 255, 255, 255))
    add_components(abandon_btn[0], [make_button(), abandon_btn_label], flat)

    back_to_menu_btn = make_node("backToMenuButton", 100, 30, 500, 0)
    add_child(root_node, back_to_menu_btn, flat)
    back_to_menu_btn_label = make_label("菜单", 12, (255, 255, 255, 255))
    add_components(back_to_menu_btn[0], [make_button(), back_to_menu_btn_label], flat)

    replay_btn = make_node("replayButton", 100, 30, 540, 0)
    add_child(root_node, replay_btn, flat)
    replay_btn_label = make_label("回放", 12, (255, 255, 255, 255))
    add_components(replay_btn[0], [make_button(), replay_btn_label], flat)

    ranking_btn = make_node("rankingButton", 100, 30, 580, 0)
    add_child(root_node, ranking_btn, flat)
    ranking_btn_label = make_label("排行", 12, (255, 255, 255, 255))
    add_components(ranking_btn[0], [make_button(), ranking_btn_label], flat)

    script = make_script("HUDController", uuid_map,
                          levelNameLabel={"__id__": -1, "_ref": level_name_label},
                          scoreLabel={"__id__": -1, "_ref": score_label},
                          timeLabel={"__id__": -1, "_ref": time_label},
                          timeProgressBar=None,
                          insuranceWarningIcon={"__id__": -1, "_ref": insurance_warning[0]},
                          insuranceCountLabel={"__id__": -1, "_ref": insurance_count_label},
                          phaseLabel={"__id__": -1, "_ref": phase_label},
                          abandonButton={"__id__": -1, "_ref": abandon_btn[0]},
                          backToMenuButton={"__id__": -1, "_ref": back_to_menu_btn[0]},
                          replayButton={"__id__": -1, "_ref": replay_btn[0]},
                          rankingButton={"__id__": -1, "_ref": ranking_btn[0]})
    add_components(root_node, [script], flat)

    write_prefab("HUDController", flat)


def gen_ui_controller(uuid_map: dict):
    flat = []

    root = make_node("UIController", 1280, 720, 0, 0)
    flat.extend(root)
    root_node = root[0]

    level_select_root = make_node("levelSelectRoot", 800, 600, 0, 0)
    add_child(root_node, level_select_root, flat)

    gameplay_root = make_node("gameplayRoot", 800, 600, 0, 0)
    add_child(root_node, gameplay_root, flat)

    settlement_root = make_node("settlementRoot", 800, 600, 0, 0)
    add_child(root_node, settlement_root, flat)

    leaderboard_root = make_node("leaderboardRoot", 800, 600, 0, 0)
    add_child(root_node, leaderboard_root, flat)

    task_tab_btn = make_node("taskTabButton", 100, 36, -180, 210)
    add_child(root_node, task_tab_btn, flat)
    task_tab_label = make_label("任务", 14, (255, 255, 255, 255))
    add_components(task_tab_btn[0], [make_button(), task_tab_label], flat)

    clue_tab_btn = make_node("clueTabButton", 100, 36, 0, 210)
    add_child(root_node, clue_tab_btn, flat)
    clue_tab_label = make_label("线索", 14, (255, 255, 255, 255))
    add_components(clue_tab_btn[0], [make_button(), clue_tab_label], flat)

    action_tab_btn = make_node("actionTabButton", 100, 36, 180, 210)
    add_child(root_node, action_tab_btn, flat)
    action_tab_label = make_label("动作", 14, (255, 255, 255, 255))
    add_components(action_tab_btn[0], [make_button(), action_tab_label], flat)

    script = make_script("UIController", uuid_map,
                          levelSelectRoot={"__id__": -1, "_ref": level_select_root[0]},
                          gameplayRoot={"__id__": -1, "_ref": gameplay_root[0]},
                          settlementRoot={"__id__": -1, "_ref": settlement_root[0]},
                          leaderboardRoot={"__id__": -1, "_ref": leaderboard_root[0]},
                          levelSelectPanel=None,
                          taskPanel=None,
                          cluePanel=None,
                          actionPanel=None,
                          settlementPanel=None,
                          leaderboardPanel=None,
                          taskTabButton={"__id__": -1, "_ref": task_tab_btn[0]},
                          clueTabButton={"__id__": -1, "_ref": clue_tab_btn[0]},
                          actionTabButton={"__id__": -1, "_ref": action_tab_btn[0]})
    add_components(root_node, [script], flat)

    write_prefab("UIController", flat)


def gen_tutorial_controller(uuid_map: dict):
    flat = []

    root = make_node("TutorialController", 500, 200, 0, 0)
    flat.extend(root)
    root_node = root[0]

    script = make_script("TutorialController", uuid_map,
                      tutorialOverlay=None,
                      tutorialContentLabel=None,
                      pointerArrow=None,
                      highlightMask=None,
                      nextButton=None,
                      skipButton=None,
                      highlightArea=None)
    add_components(root_node, [script], flat)

    write_prefab("TutorialController", flat)


def gen_scene_controller(uuid_map: dict):
    flat = []

    root = make_node("SceneController", 0, 0, 0, 0)
    flat.extend(root)
    root_node = root[0]

    tiled_map_container = make_node("tiledMapContainer", 768, 512, -384, -256)
    add_child(root_node, tiled_map_container, flat)

    interactive_objects_container = make_node("interactiveObjectsContainer", 768, 512, 0, 0)
    add_child(root_node, interactive_objects_container, flat)

    script = make_script("SceneController", uuid_map,
                      tiledMapContainer={"__id__": -1, "_ref": tiled_map_container[0]},
                      interactiveObjectsContainer={"__id__": -1, "_ref": interactive_objects_container[0]})
    add_components(root_node, [script], flat)

    write_prefab("SceneController", flat)


def gen_billing_item_row(uuid_map: dict):
    flat = []

    root = make_node("BillingItemRow", 530, 28, 0, 0)
    flat.extend(root)
    root_node = root[0]

    name_label_node = make_node("nameLabel", 160, 22, -180, 0)
    add_child(root_node, name_label_node, flat)
    name_label = make_label("项目名称", 13)
    add_components(name_label_node[0], [name_label], flat)

    code_label_node = make_node("codeLabel", 90, 22, -60, 0)
    add_child(root_node, code_label_node, flat)
    code_label = make_label("编码", 12, (100, 100, 100, 255))
    add_components(code_label_node[0], [code_label], flat)

    cost_label_node = make_node("costLabel", 80, 22, 40, 0)
    add_child(root_node, cost_label_node, flat)
    cost_label = make_label("¥0.00", 13)
    add_components(cost_label_node[0], [cost_label], flat)

    insurance_label_node = make_node("insuranceLabel", 80, 22, 130, 0)
    add_child(root_node, insurance_label_node, flat)
    insurance_label = make_label("¥0.00", 13, (46, 125, 50, 255))
    add_components(insurance_label_node[0], [insurance_label], flat)

    status_label_node = make_node("statusLabel", 80, 22, 230, 0)
    add_child(root_node, status_label_node, flat)
    status_label = make_label("✅ 通过", 13, (46, 125, 50, 255))
    add_components(status_label_node[0], [status_label], flat)

    script = make_script("BillingItemRow", uuid_map,
                      nameLabel={"__id__": -1, "_ref": name_label},
                      codeLabel={"__id__": -1, "_ref": code_label},
                      costLabel={"__id__": -1, "_ref": cost_label},
                      insuranceLabel={"__id__": -1, "_ref": insurance_label},
                      statusLabel={"__id__": -1, "_ref": status_label})
    add_components(root_node, [script], flat)

    write_prefab("BillingItemRow", flat)


def gen_game_manager(uuid_map: dict):
    flat = []

    root = make_node("GameManager", 0, 0, 0, 0)
    flat.extend(root)
    root_node = root[0]

    script = make_script("GameManager", uuid_map)
    add_components(root_node, [script], flat)

    write_prefab("GameManager", flat)


def gen_game_bootstrap(uuid_map: dict):
    flat = []

    root = make_node("GameBootstrap", 0, 0, 0, 0)
    flat.extend(root)
    root_node = root[0]

    script = make_script("GameBootstrap", uuid_map,
                      gameManager=None,
                      uiController=None,
                      hudController=None,
                      tutorialController=None,
                      sceneController=None)
    add_components(root_node, [script], flat)

    write_prefab("GameBootstrap", flat)


def gen_test_runner(uuid_map: dict):
    flat = []

    root = make_node("TestRunner", 600, 400, 0, 0)
    flat.extend(root)
    root_node = root[0]

    script = make_script("TestRunner", uuid_map,
                          testPanelRoot=None,
                          summaryLabel=None,
                          resultScrollView=None,
                          resultContainer=None,
                          resultItemPrefab=None,
                          runButton=None,
                          closeButton=None,
                          exportButton=None)
    add_components(root_node, [script], flat)

    write_prefab("TestRunner", flat)


def gen_main_scene(uuid_map: dict):
    scene_data = []

    scene_asset = {
        "__id__": 0,
        "__type__": "cc.SceneAsset",
        "_name": "MainScene",
        "_objFlags": 0,
        "_native": "",
        "scene": {"__id__": 1},
        "_id": cid()
    }
    scene_data.append(scene_asset)

    scene_obj = {
        "__id__": 1,
        "__type__": "cc.Scene",
        "_name": "MainScene",
        "_objFlags": 0,
        "_parent": None,
        "_children": [],
        "_active": True,
        "_components": [],
        "_prefab": None,
        "_lpos": {"__type__": "cc.Vec3", "x": 0, "y": 0, "z": 0},
        "_lrot": {"__type__": "cc.Quat", "x": 0, "y": 0, "z": 0, "w": 1},
        "_lscale": {"__type__": "cc.Vec3", "x": 1, "y": 1, "z": 1},
        "_mobility": 0,
        "_layer": 1073741824,
        "_euler": {"__type__": "cc.Vec3", "x": 0, "y": 0, "z": 0},
        "_id": cid(),
        "autoReleaseAssets": False,
        "_globals": {"__id__": -1}
    }
    scene_data.append(scene_obj)

    canvas_flat = []

    canvas = make_node("Canvas", 1280, 720, 0, 0, layer=1073741824)
    canvas_flat.extend(canvas)
    canvas_node = canvas[0]

    canvas_comp = make_canvas()
    widget_comp = make_widget()
    add_components(canvas_node, [canvas_comp, widget_comp], canvas_flat)

    ui_root = make_node("UIRoot", 1280, 720, 0, 0)
    add_child(canvas_node, ui_root, canvas_flat)

    scene_root = make_node("SceneRoot", 768, 512, 0, 0)
    add_child(canvas_node, scene_root, canvas_flat)

    main_scene_script = make_script("MainScene", uuid_map)
    add_components(canvas_node, [main_scene_script], canvas_flat)

    finalized_canvas = finalize(canvas_flat)

    base_idx = len(scene_data)
    canvas_node_idx = -1
    for idx, obj in enumerate(finalized_canvas):
        new_id = base_idx + obj["__id__"]
        old_id = obj["__id__"]
        obj["__id__"] = new_id
        if idx == 0:
            canvas_node_idx = new_id
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
            if obj.get("_parent") is not None and isinstance(obj["_parent"], dict) and "__id__" in obj["_parent"]:
                parent_id = obj["_parent"]["__id__"]
                if parent_id >= 0 and parent_id < len(finalized_canvas):
                    obj["_parent"] = {"__id__": parent_id + base_idx}
        scene_data.append(obj)

    scene_data[1]["_children"] = [{"__id__": canvas_node_idx}]

    gc_node_idx = len(scene_data)
    gc_node = {
        "__id__": gc_node_idx,
        "__type__": "cc.Node",
        "_name": "GlobalConfig",
        "_objFlags": 0,
        "node": None,
        "_parent": {"__id__": 1},
        "_children": [],
        "_active": True,
        "_components": [],
        "_prefab": None,
        "_lpos": {"__type__": "cc.Vec3", "x": 0, "y": 0, "z": 0},
        "_lrot": {"__type__": "cc.Quat", "x": 0, "y": 0, "z": 0, "w": 1},
        "_lscale": {"__type__": "cc.Vec3", "x": 1, "y": 1, "z": 1},
        "_mobility": 0,
        "_layer": 1073741824,
        "_euler": {"__type__": "cc.Vec3", "x": 0, "y": 0, "z": 0},
        "_id": cid()
    }
    scene_data.append(gc_node)
    scene_data[1]["_children"].append({"__id__": gc_node_idx})

    ambient_idx = len(scene_data)
    ambient = {
        "__id__": ambient_idx,
        "__type__": "cc.AmbientInfo",
        "name": "",
        "_name": "",
        "_objFlags": 0,
        "node": None,
        "_enabled": True,
        "__prefab": None,
        "_skyColorHDR": {"__type__": "cc.Vec4", "x": 0.2, "y": 0.5, "z": 0.8, "w": 0.520833},
        "_skyColor": {"__type__": "cc.Vec4", "x": 0.2, "y": 0.5, "z": 0.8, "w": 0.520833},
        "_skyIllumHDR": 20000,
        "_skyIllum": 20000,
        "_groundAlbedoHDR": {"__type__": "cc.Vec4", "x": 0.2, "y": 0.2, "z": 0.2, "w": 1},
        "_groundAlbedo": {"__type__": "cc.Vec4", "x": 0.2, "y": 0.2, "z": 0.2, "w": 1},
        "_skyColorLDR": {"__type__": "cc.Vec4", "x": 0.452588, "y": 0.607642, "z": 0.755699, "w": 0.520833},
        "_skyIllumLDR": 0.8,
        "_groundAlbedoLDR": {"__type__": "cc.Vec4", "x": 0.2, "y": 0.2, "z": 0.2, "w": 1},
        "_skyColorLDRExponent": 1,
        "_skyIllumLDRExponent": 1,
        "_groundAlbedoLDRExponent": 1,
        "_id": cid()
    }
    scene_data.append(ambient)
    scene_data[gc_node_idx]["_components"].append({"__id__": ambient_idx})
    scene_data[1]["_globals"] = {"__id__": ambient_idx}

    others = [
        ("cc.SkyboxInfo", {
            "envLightingType": 0,
            "envmapHDR": None, "envmap": None, "envmapLDR": None,
            "diffuseMapHDR": None, "diffuseMapLDR": None,
            "envmapLDRExponent": 1, "diffuseMapLDRExponent": 1
        }),
        ("cc.FogInfo", {
            "_enabled": False, "_type": 0,
            "_fogColor": {"__type__": "cc.Vec3", "x": 0.5, "y": 0.5, "z": 0.5},
            "_fogDensity": 0.3, "_fogStart": 0.5, "_fogEnd": 300,
            "_fogAtten": 5, "_fogTop": 1.5, "_fogRange": 1.2, "_accurate": False
        }),
        ("cc.OctahedronMapReduceInfo", {"_bounces": 2, "_reduceRings": 0, "_reduceSamples": 0}),
        ("cc.PostSettingsInfo", {"_toneMappingType": 0, "toneMappingExposure": 1}),
        ("cc.ShadowsInfo", {
            "_enabled": False, "_type": 0,
            "_normal": {"__type__": "cc.Vec3", "x": 0, "y": 1, "z": 0},
            "_distance": 0,
            "_shadowColor": {"__type__": "cc.Color", "r": 76, "g": 76, "b": 76, "a": 255},
            "_maxReceived": 4,
            "_size": {"__type__": "cc.Vec2", "x": 512, "y": 512}
        }),
    ]
    for t, extra in others:
        idx = len(scene_data)
        obj = {"__type__": t, "name": "", "_name": "", "_objFlags": 0,
               "node": None, "_enabled": True, "__prefab": None, "_id": cid(),
               "__id__": idx}
        obj.update(extra)
        scene_data.append(obj)
        scene_data[gc_node_idx]["_components"].append({"__id__": idx})

    filepath = os.path.join(SCENE_DIR, 'MainScene.scene')
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(scene_data, f, ensure_ascii=False, indent=2)
    print(f'Created scene: MainScene.scene ({len(scene_data)} objects)')


if __name__ == "__main__":
    print("开始生成 Cocos Creator 3.8.0 Prefab 和场景...\n")

    uuid_map = {
        "MainScene": "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6",
        "TaskPanel": "b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7",
        "CluePanel": "c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8",
        "ActionPanel": "d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9",
        "SettlementPanel": "e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0",
        "LevelSelectPanel": "f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1",
        "LeaderboardPanel": "a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2",
        "HUDController": "b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3",
        "UIController": "c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4",
        "TutorialController": "d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5",
        "SceneController": "e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6",
        "BillingItemRow": "f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7",
        "GameManager": "a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8",
        "GameBootstrap": "b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9",
        "TestRunner": "c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0"
    }

    gen_task_panel(uuid_map)
    gen_clue_panel(uuid_map)
    gen_action_panel(uuid_map)
    gen_settlement_panel(uuid_map)
    gen_level_select_panel(uuid_map)
    gen_leaderboard_panel(uuid_map)
    gen_hud_controller(uuid_map)
    gen_ui_controller(uuid_map)
    gen_tutorial_controller(uuid_map)
    gen_scene_controller(uuid_map)
    gen_billing_item_row(uuid_map)
    gen_game_manager(uuid_map)
    gen_game_bootstrap(uuid_map)
    gen_test_runner(uuid_map)
    gen_main_scene(uuid_map)

    print("\n✅ 所有 Prefab 和场景生成完成！")
