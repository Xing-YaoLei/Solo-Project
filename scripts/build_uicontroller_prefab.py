#!/usr/bin/env python3
"""生成完整的 UIController.prefab 文件"""
import json
import os
import random
import string

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class PrefabBuilder:
    def __init__(self):
        self.objects = []
        self.next_id = 0

    def _gen_id(self):
        oid = self.next_id
        self.next_id += 1
        return oid

    def _short_id(self):
        return ''.join(random.choices(string.hexdigits.lower(), k=8))

    def _long_id(self):
        return ''.join(random.choices(string.hexdigits.lower(), k=32))

    def add_node(self, name, parent_id=None, active=True, pos=(0, 0, 0), size=(100, 100), anchor=(0.5, 0.5)):
        node_id = self._gen_id()
        ut_id = self._gen_id()

        node = {
            "__id__": node_id,
            "__type__": "cc.Node",
            "_name": name,
            "_objFlags": 0,
            "node": None,
            "_parent": {"__id__": parent_id} if parent_id is not None else None,
            "_children": [],
            "_active": active,
            "_components": [{"__id__": ut_id}],
            "_prefab": None,
            "_lpos": {"__type__": "cc.Vec3", "x": pos[0], "y": pos[1], "z": pos[2]},
            "_lrot": {"__type__": "cc.Quat", "x": 0, "y": 0, "z": 0, "w": 1},
            "_lscale": {"__type__": "cc.Vec3", "x": 1, "y": 1, "z": 1},
            "_mobility": 0,
            "_layer": 33554432,
            "_euler": {"__type__": "cc.Vec3", "x": 0, "y": 0, "z": 0},
            "_id": self._short_id()
        }

        ut = {
            "__id__": ut_id,
            "__type__": "cc.UITransform",
            "name": "",
            "_name": "",
            "_objFlags": 0,
            "node": None,
            "_enabled": True,
            "__prefab": None,
            "_contentSize": {"__type__": "cc.Size", "width": size[0], "height": size[1]},
            "_anchorPoint": {"__type__": "cc.Vec2", "x": anchor[0], "y": anchor[1]},
            "_id": self._long_id()
        }

        self.objects.append(node)
        self.objects.append(ut)

        if parent_id is not None:
            self._add_child(parent_id, node_id)

        return node_id, ut_id

    def _add_child(self, parent_id, child_id):
        for obj in self.objects:
            if obj.get("__id__") == parent_id and obj.get("__type__") == "cc.Node":
                obj["_children"].append({"__id__": child_id})
                return

    def add_label(self, node_id, text="", font_size=16, color=(51, 51, 51, 255), h_align=1, v_align=1):
        label_id = self._gen_id()
        label = {
            "__id__": label_id,
            "__type__": "cc.Label",
            "name": "",
            "_name": "",
            "_objFlags": 0,
            "node": None,
            "_enabled": True,
            "__prefab": None,
            "_useOriginalSize": False,
            "_string": text,
            "_horizontalAlign": h_align,
            "_verticalAlign": v_align,
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
            "_color": {"__type__": "cc.Color", "r": color[0], "g": color[1], "b": color[2], "a": color[3]},
            "_id": self._long_id()
        }
        self.objects.append(label)
        self._add_component(node_id, label_id)
        return label_id

    def add_button(self, node_id):
        btn_id = self._gen_id()
        btn = {
            "__id__": btn_id,
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
            "_id": self._long_id()
        }
        self.objects.append(btn)
        self._add_component(node_id, btn_id)
        return btn_id

    def add_progress_bar(self, node_id, progress=0, total_width=400):
        pb_id = self._gen_id()
        pb = {
            "__id__": pb_id,
            "__type__": "cc.ProgressBar",
            "name": "",
            "_name": "",
            "_objFlags": 0,
            "node": None,
            "_enabled": True,
            "__prefab": None,
            "_progress": progress,
            "_totalWidth": total_width,
            "_barSprite": None,
            "_mode": 0,
            "reverse": False,
            "_id": self._long_id()
        }
        self.objects.append(pb)
        self._add_component(node_id, pb_id)
        return pb_id

    def add_script(self, node_id, script_name, script_uuid, properties=None):
        script_id = self._gen_id()
        script_obj = {
            "__id__": script_id,
            "__type__": "cc.Script",
            "name": script_name,
            "_name": "",
            "_objFlags": 0,
            "node": None,
            "_enabled": True,
            "__prefab": None,
            "__scriptAsset": {
                "__uuid__": script_uuid,
                "__expectedType__": "cc.Component"
            },
            "_id": self._long_id()
        }
        if properties:
            for key, value in properties.items():
                script_obj[key] = value
        self.objects.append(script_obj)
        self._add_component(node_id, script_id)
        return script_id

    def _add_component(self, node_id, component_id):
        for obj in self.objects:
            if obj.get("__id__") == node_id and obj.get("__type__") == "cc.Node":
                obj["_components"].append({"__id__": component_id})
                return

    def build(self):
        result = sorted(self.objects, key=lambda x: x["__id__"])
        return result


def build_uicontroller():
    builder = PrefabBuilder()

    # UUID 映射
    UUIDS = {
        "LevelSelectPanel": "8f7aa51280dd56f4005416bf7dcfbfdf",
        "TaskPanel": "f2b4dc448677cab8f0fbe363cdd95dd9",
        "CluePanel": "7a6692d5719231fa7c43a368f7475be1",
        "ActionPanel": "5e7e778e3684ff4b2b10d687d398ac24",
        "SettlementPanel": "2303bcef1982c401b944354739911bf3",
        "LeaderboardPanel": "5a399a13f5aee1bd0aa10a2c1cc49dbb",
        "UIController": "e9a5dbce3b97961bdc6d75442250ffb5"
    }

    # ==================== 根节点 UIController ====================
    root_id, root_ut_id = builder.add_node(
        "UIController", parent_id=None, active=True,
        pos=(0, 0, 0), size=(1280, 720)
    )

    # ==================== levelSelectRoot ====================
    level_select_root_id, _ = builder.add_node(
        "levelSelectRoot", parent_id=root_id, active=True,
        pos=(0, 0, 0), size=(800, 600)
    )

    # LevelSelectPanel 节点
    lsp_id, _ = builder.add_node(
        "LevelSelectPanel", parent_id=level_select_root_id, active=True,
        pos=(0, 0, 0), size=(800, 600)
    )

    # LevelSelectPanel 子节点
    lsp_title_id, _ = builder.add_node(
        "titleLabel", parent_id=lsp_id, active=True,
        pos=(0, 260, 0), size=(400, 50)
    )
    lsp_title_label_id = builder.add_label(lsp_title_id, "选择关卡", 28, (51, 51, 51, 255))

    lsp_container_id, _ = builder.add_node(
        "levelContainer", parent_id=lsp_id, active=True,
        pos=(0, 0, 0), size=(700, 400)
    )

    lsp_leaderboard_btn_id, _ = builder.add_node(
        "leaderboardButton", parent_id=lsp_id, active=True,
        pos=(0, -260, 0), size=(200, 44)
    )
    builder.add_button(lsp_leaderboard_btn_id)
    builder.add_label(lsp_leaderboard_btn_id, "查看排行榜", 16, (255, 255, 255, 255))

    # LevelSelectPanel 脚本
    builder.add_script(lsp_id, "LevelSelectPanel", UUIDS["LevelSelectPanel"], {
        "levelScrollView": None,
        "levelContainer": {"__id__": lsp_container_id},
        "totalScoreLabel": None,
        "playerLevelLabel": None,
        "coinsLabel": None
    })

    # ==================== gameplayRoot ====================
    gameplay_root_id, _ = builder.add_node(
        "gameplayRoot", parent_id=root_id, active=False,
        pos=(0, 0, 0), size=(800, 600)
    )

    # TaskPanel
    task_panel_id, _ = builder.add_node(
        "TaskPanel", parent_id=gameplay_root_id, active=True,
        pos=(0, -20, 0), size=(600, 450)
    )

    tp_task_name_id, _ = builder.add_node(
        "taskNameLabel", parent_id=task_panel_id, active=True,
        pos=(0, 160, 0), size=(500, 40)
    )
    tp_task_name_label_id = builder.add_label(tp_task_name_id, "等待开始...", 22, (51, 51, 51, 255))

    tp_task_desc_id, _ = builder.add_node(
        "taskDescLabel", parent_id=task_panel_id, active=True,
        pos=(0, 100, 0), size=(500, 80)
    )
    tp_task_desc_label_id = builder.add_label(tp_task_desc_id, "请选择关卡开始游戏", 16, (100, 100, 100, 255))

    tp_task_type_id, _ = builder.add_node(
        "taskTypeLabel", parent_id=task_panel_id, active=True,
        pos=(0, 40, 0), size=(200, 30)
    )
    tp_task_type_label_id = builder.add_label(tp_task_type_id, "", 18, (33, 150, 243, 255))

    tp_task_progress_id, _ = builder.add_node(
        "taskProgressLabel", parent_id=task_panel_id, active=True,
        pos=(0, 0, 0), size=(300, 30)
    )
    tp_task_progress_label_id = builder.add_label(tp_task_progress_id, "任务进度: 0/0", 16, (51, 51, 51, 255))

    tp_clue_indicator_id, _ = builder.add_node(
        "clueIndicator", parent_id=task_panel_id, active=True,
        pos=(-120, -40, 0), size=(200, 24)
    )
    tp_clue_count_label_id = builder.add_label(tp_clue_indicator_id, "", 14, (51, 51, 51, 255))

    tp_accept_btn_id, _ = builder.add_node(
        "acceptButton", parent_id=task_panel_id, active=True,
        pos=(0, -100, 0), size=(240, 50)
    )
    builder.add_button(tp_accept_btn_id)
    builder.add_label(tp_accept_btn_id, "开始观察线索", 18, (255, 255, 255, 255))

    builder.add_script(task_panel_id, "TaskPanel", UUIDS["TaskPanel"], {
        "taskNameLabel": {"__id__": tp_task_name_label_id},
        "taskDescLabel": {"__id__": tp_task_desc_label_id},
        "taskTypeLabel": {"__id__": tp_task_type_label_id},
        "taskProgressLabel": {"__id__": tp_task_progress_label_id},
        "clueIndicator": {"__id__": tp_clue_indicator_id},
        "clueCountLabel": {"__id__": tp_clue_count_label_id},
        "acceptButton": {"__id__": tp_accept_btn_id}
    })

    # CluePanel
    clue_panel_id, _ = builder.add_node(
        "CluePanel", parent_id=gameplay_root_id, active=False,
        pos=(0, -20, 0), size=(600, 450)
    )

    cp_title_id, _ = builder.add_node(
        "titleLabel", parent_id=clue_panel_id, active=True,
        pos=(0, 200, 0), size=(500, 36)
    )
    cp_title_label_id = builder.add_label(cp_title_id, "线索资料", 20, (51, 51, 51, 255))

    cp_container_id, _ = builder.add_node(
        "clueContainer", parent_id=clue_panel_id, active=True,
        pos=(0, 50, 0), size=(550, 300)
    )

    cp_observe_btn_id, _ = builder.add_node(
        "observeCompleteButton", parent_id=clue_panel_id, active=True,
        pos=(0, -160, 0), size=(200, 44)
    )
    builder.add_button(cp_observe_btn_id)
    builder.add_label(cp_observe_btn_id, "观察完成", 16, (255, 255, 255, 255))

    builder.add_script(clue_panel_id, "CluePanel", UUIDS["CluePanel"], {
        "clueScrollView": None,
        "clueContainer": {"__id__": cp_container_id},
        "observeCompleteButton": {"__id__": cp_observe_btn_id},
        "titleLabel": {"__id__": cp_title_label_id}
    })

    # ActionPanel
    action_panel_id, _ = builder.add_node(
        "ActionPanel", parent_id=gameplay_root_id, active=False,
        pos=(0, -20, 0), size=(600, 450)
    )

    ap_hint_id, _ = builder.add_node(
        "hintLabel", parent_id=action_panel_id, active=True,
        pos=(0, 180, 0), size=(500, 30)
    )
    ap_hint_label_id = builder.add_label(ap_hint_id, "💡 请结合线索资料，做出最专业的判断", 14, (100, 100, 100, 255))

    ap_options_id, _ = builder.add_node(
        "optionsContainer", parent_id=action_panel_id, active=True,
        pos=(0, 60, 0), size=(550, 200)
    )

    ap_feedback_id, _ = builder.add_node(
        "feedbackSection", parent_id=action_panel_id, active=False,
        pos=(0, -80, 0), size=(550, 100)
    )

    ap_feedback_exp_id, _ = builder.add_node(
        "feedbackExplanationLabel", parent_id=ap_feedback_id, active=True,
        pos=(0, 30, 0), size=(520, 40)
    )
    ap_feedback_exp_label_id = builder.add_label(ap_feedback_exp_id, "", 14, (51, 51, 51, 255))

    ap_feedback_score_id, _ = builder.add_node(
        "feedbackScoreLabel", parent_id=ap_feedback_id, active=True,
        pos=(0, -10, 0), size=(200, 28)
    )
    ap_feedback_score_label_id = builder.add_label(ap_feedback_score_id, "", 18, (46, 125, 50, 255))

    ap_feedback_error_id, _ = builder.add_node(
        "feedbackErrorLabel", parent_id=ap_feedback_id, active=False,
        pos=(0, -40, 0), size=(400, 24)
    )
    ap_feedback_error_label_id = builder.add_label(ap_feedback_error_id, "", 12, (198, 40, 40, 255))

    ap_proceed_btn_id, _ = builder.add_node(
        "proceedButton", parent_id=action_panel_id, active=False,
        pos=(0, -180, 0), size=(200, 44)
    )
    builder.add_button(ap_proceed_btn_id)
    builder.add_label(ap_proceed_btn_id, "继续", 16, (255, 255, 255, 255))

    builder.add_script(action_panel_id, "ActionPanel", UUIDS["ActionPanel"], {
        "optionsContainer": {"__id__": ap_options_id},
        "hintLabel": {"__id__": ap_hint_label_id},
        "feedbackSection": {"__id__": ap_feedback_id},
        "feedbackExplanationLabel": {"__id__": ap_feedback_exp_label_id},
        "feedbackScoreLabel": {"__id__": ap_feedback_score_label_id},
        "feedbackErrorLabel": {"__id__": ap_feedback_error_label_id},
        "proceedButton": {"__id__": ap_proceed_btn_id}
    })

    # Tab buttons
    task_tab_btn_id, _ = builder.add_node(
        "taskTabButton", parent_id=gameplay_root_id, active=True,
        pos=(-180, 210, 0), size=(100, 36)
    )
    builder.add_button(task_tab_btn_id)
    builder.add_label(task_tab_btn_id, "任务", 14, (255, 255, 255, 255))

    clue_tab_btn_id, _ = builder.add_node(
        "clueTabButton", parent_id=gameplay_root_id, active=True,
        pos=(0, 210, 0), size=(100, 36)
    )
    builder.add_button(clue_tab_btn_id)
    builder.add_label(clue_tab_btn_id, "线索", 14, (255, 255, 255, 255))

    action_tab_btn_id, _ = builder.add_node(
        "actionTabButton", parent_id=gameplay_root_id, active=True,
        pos=(180, 210, 0), size=(100, 36)
    )
    builder.add_button(action_tab_btn_id)
    builder.add_label(action_tab_btn_id, "动作", 14, (255, 255, 255, 255))

    # ==================== settlementRoot ====================
    settlement_root_id, _ = builder.add_node(
        "settlementRoot", parent_id=root_id, active=False,
        pos=(0, 0, 0), size=(800, 600)
    )

    # SettlementPanel
    sp_id, _ = builder.add_node(
        "SettlementPanel", parent_id=settlement_root_id, active=True,
        pos=(0, 0, 0), size=(700, 700)
    )

    # levelNameLabel
    sp_level_name_id, _ = builder.add_node(
        "levelNameLabel", parent_id=sp_id, active=True,
        pos=(0, 300, 0), size=(400, 40)
    )
    sp_level_name_label_id = builder.add_label(sp_level_name_id, "关卡结算", 26, (51, 51, 51, 255))

    # totalScoreLabel
    sp_total_score_id, _ = builder.add_node(
        "totalScoreLabel", parent_id=sp_id, active=True,
        pos=(0, 240, 0), size=(200, 60)
    )
    sp_total_score_label_id = builder.add_label(sp_total_score_id, "0", 48, (33, 150, 243, 255))

    # passScoreLabel
    sp_pass_score_id, _ = builder.add_node(
        "passScoreLabel", parent_id=sp_id, active=True,
        pos=(0, 200, 0), size=(200, 20)
    )
    sp_pass_score_label_id = builder.add_label(sp_pass_score_id, "及格线: 60分", 14, (120, 120, 120, 255))

    # starLabel
    sp_star_id, _ = builder.add_node(
        "starLabel", parent_id=sp_id, active=True,
        pos=(0, 160, 0), size=(200, 40)
    )
    sp_star_label_id = builder.add_label(sp_star_id, "☆☆☆", 28, (255, 215, 0, 255))

    # scoreProgressBar
    sp_progress_id, _ = builder.add_node(
        "scoreProgressBar", parent_id=sp_id, active=True,
        pos=(0, 120, 0), size=(400, 16)
    )
    sp_progress_bar_id = builder.add_progress_bar(sp_progress_id, 0, 400)

    # timeSpentLabel
    sp_time_id, _ = builder.add_node(
        "timeSpentLabel", parent_id=sp_id, active=True,
        pos=(-180, 80, 0), size=(200, 24)
    )
    sp_time_label_id = builder.add_label(sp_time_id, "用时: 0分0秒", 16, (51, 51, 51, 255))

    # correctCountLabel
    sp_correct_id, _ = builder.add_node(
        "correctCountLabel", parent_id=sp_id, active=True,
        pos=(0, 80, 0), size=(200, 24)
    )
    sp_correct_label_id = builder.add_label(sp_correct_id, "正确: 0/0", 16, (51, 51, 51, 255))

    # insuranceTriggeredLabel
    sp_insurance_id, _ = builder.add_node(
        "insuranceTriggeredLabel", parent_id=sp_id, active=True,
        pos=(180, 80, 0), size=(200, 24)
    )
    sp_insurance_label_id = builder.add_label(sp_insurance_id, "", 14, (198, 40, 40, 255))

    # successSection
    sp_success_id, _ = builder.add_node(
        "successSection", parent_id=sp_id, active=True,
        pos=(0, 40, 0), size=(600, 40)
    )
    sp_success_label_id = builder.add_label(sp_success_id, "✅ 通过！", 20, (46, 125, 50, 255))

    # failureSection
    sp_failure_id, _ = builder.add_node(
        "failureSection", parent_id=sp_id, active=False,
        pos=(0, 40, 0), size=(600, 40)
    )
    sp_failure_label_id = builder.add_label(sp_failure_id, "❌ 未通过", 20, (198, 40, 40, 255))

    # rewardsSection
    sp_rewards_id, _ = builder.add_node(
        "rewardsSection", parent_id=sp_id, active=True,
        pos=(0, 0, 0), size=(400, 24)
    )

    sp_exp_id, _ = builder.add_node(
        "expRewardLabel", parent_id=sp_rewards_id, active=True,
        pos=(-80, 0, 0), size=(140, 24)
    )
    sp_exp_label_id = builder.add_label(sp_exp_id, "", 14, (255, 152, 0, 255))

    sp_coins_id, _ = builder.add_node(
        "coinsRewardLabel", parent_id=sp_rewards_id, active=True,
        pos=(80, 0, 0), size=(140, 24)
    )
    sp_coins_label_id = builder.add_label(sp_coins_id, "", 14, (255, 193, 7, 255))

    # nursingLogTab
    sp_nursing_tab_id, _ = builder.add_node(
        "nursingLogTab", parent_id=sp_id, active=True,
        pos=(-100, -60, 0), size=(140, 36)
    )
    builder.add_button(sp_nursing_tab_id)
    builder.add_label(sp_nursing_tab_id, "护理日志", 14, (51, 51, 51, 255))

    # billingDetailTab
    sp_billing_tab_id, _ = builder.add_node(
        "billingDetailTab", parent_id=sp_id, active=True,
        pos=(100, -60, 0), size=(140, 36)
    )
    builder.add_button(sp_billing_tab_id)
    builder.add_label(sp_billing_tab_id, "结算明细", 14, (51, 51, 51, 255))

    # nursingLogPanel
    sp_nursing_panel_id, _ = builder.add_node(
        "nursingLogPanel", parent_id=sp_id, active=True,
        pos=(0, -140, 0), size=(550, 120)
    )

    # billingDetailPanel
    sp_billing_panel_id, _ = builder.add_node(
        "billingDetailPanel", parent_id=sp_id, active=False,
        pos=(0, -140, 0), size=(550, 120)
    )

    sp_billing_container_id, _ = builder.add_node(
        "billingContainer", parent_id=sp_billing_panel_id, active=True,
        pos=(0, 0, 0), size=(540, 100)
    )

    # totalCostLabel
    sp_total_cost_id, _ = builder.add_node(
        "totalCostLabel", parent_id=sp_id, active=True,
        pos=(-200, -210, 0), size=(180, 24)
    )
    sp_total_cost_label_id = builder.add_label(sp_total_cost_id, "总费用: ¥0.00", 14, (51, 51, 51, 255))

    # totalInsuranceLabel
    sp_total_insurance_id, _ = builder.add_node(
        "totalInsuranceLabel", parent_id=sp_id, active=True,
        pos=(0, -210, 0), size=(180, 24)
    )
    sp_total_insurance_label_id = builder.add_label(sp_total_insurance_id, "医保报销: ¥0.00", 14, (46, 125, 50, 255))

    # totalDeniedLabel
    sp_total_denied_id, _ = builder.add_node(
        "totalDeniedLabel", parent_id=sp_id, active=True,
        pos=(200, -210, 0), size=(180, 24)
    )
    sp_total_denied_label_id = builder.add_label(sp_total_denied_id, "拒付金额: ¥0.00", 14, (51, 51, 51, 255))

    # drgWarning
    sp_drg_warning_id, _ = builder.add_node(
        "drgWarning", parent_id=sp_id, active=True,
        pos=(0, -240, 0), size=(550, 22)
    )
    sp_drg_cost_label_id = builder.add_label(sp_drg_warning_id, "", 13, (255, 152, 0, 255))

    # replayButton
    sp_replay_btn_id, _ = builder.add_node(
        "replayButton", parent_id=sp_id, active=True,
        pos=(-180, -300, 0), size=(140, 40)
    )
    builder.add_button(sp_replay_btn_id)
    builder.add_label(sp_replay_btn_id, "返回菜单", 14, (255, 255, 255, 255))

    # nextLevelButton
    sp_next_btn_id, _ = builder.add_node(
        "nextLevelButton", parent_id=sp_id, active=True,
        pos=(0, -300, 0), size=(140, 40)
    )
    builder.add_button(sp_next_btn_id)
    builder.add_label(sp_next_btn_id, "下一关", 14, (255, 255, 255, 255))

    # retryButton
    sp_retry_btn_id, _ = builder.add_node(
        "retryButton", parent_id=sp_id, active=False,
        pos=(180, -300, 0), size=(140, 40)
    )
    builder.add_button(sp_retry_btn_id)
    builder.add_label(sp_retry_btn_id, "重新挑战", 14, (255, 255, 255, 255))

    # SettlementPanel script
    builder.add_script(sp_id, "SettlementPanel", UUIDS["SettlementPanel"], {
        "successSection": {"__id__": sp_success_id},
        "failureSection": {"__id__": sp_failure_id},
        "levelNameLabel": {"__id__": sp_level_name_label_id},
        "totalScoreLabel": {"__id__": sp_total_score_label_id},
        "passScoreLabel": {"__id__": sp_pass_score_label_id},
        "scoreProgressBar": {"__id__": sp_progress_bar_id},
        "starLabel": {"__id__": sp_star_id},
        "timeSpentLabel": {"__id__": sp_time_label_id},
        "correctCountLabel": {"__id__": sp_correct_id},
        "insuranceTriggeredLabel": {"__id__": sp_insurance_id},
        "rewardsSection": {"__id__": sp_rewards_id},
        "expRewardLabel": {"__id__": sp_exp_label_id},
        "coinsRewardLabel": {"__id__": sp_coins_label_id},
        "nursingLogTab": {"__id__": sp_nursing_tab_id},
        "billingDetailTab": {"__id__": sp_billing_tab_id},
        "nursingLogPanel": {"__id__": sp_nursing_panel_id},
        "billingDetailPanel": {"__id__": sp_billing_panel_id},
        "billingScrollView": None,
        "billingContainer": {"__id__": sp_billing_container_id},
        "totalCostLabel": {"__id__": sp_total_cost_label_id},
        "totalInsuranceLabel": {"__id__": sp_total_insurance_label_id},
        "totalDeniedLabel": {"__id__": sp_total_denied_label_id},
        "drgWarning": {"__id__": sp_drg_warning_id},
        "drgCostLabel": {"__id__": sp_drg_cost_label_id},
        "replayButton": {"__id__": sp_replay_btn_id},
        "nextLevelButton": {"__id__": sp_next_btn_id},
        "retryButton": {"__id__": sp_retry_btn_id}
    })

    # ==================== leaderboardRoot ====================
    leaderboard_root_id, _ = builder.add_node(
        "leaderboardRoot", parent_id=root_id, active=False,
        pos=(0, 0, 0), size=(800, 600)
    )

    # LeaderboardPanel
    lbp_id, _ = builder.add_node(
        "LeaderboardPanel", parent_id=leaderboard_root_id, active=True,
        pos=(0, 0, 0), size=(700, 550)
    )

    lbp_title_id, _ = builder.add_node(
        "titleLabel", parent_id=lbp_id, active=True,
        pos=(0, 240, 0), size=(400, 40)
    )
    lbp_title_label_id = builder.add_label(lbp_title_id, "排行榜", 26, (51, 51, 51, 255))

    lbp_container_id, _ = builder.add_node(
        "leaderboardContainer", parent_id=lbp_id, active=True,
        pos=(0, 50, 0), size=(600, 380)
    )

    lbp_back_btn_id, _ = builder.add_node(
        "backButton", parent_id=lbp_id, active=True,
        pos=(0, -230, 0), size=(200, 44)
    )
    builder.add_button(lbp_back_btn_id)
    builder.add_label(lbp_back_btn_id, "返回", 16, (255, 255, 255, 255))

    lbp_current_rank_id, _ = builder.add_node(
        "currentRankLabel", parent_id=lbp_id, active=True,
        pos=(-150, -190, 0), size=(250, 24)
    )
    lbp_current_rank_label_id = builder.add_label(lbp_current_rank_id, "暂无排名，快去完成训练吧！", 14, (100, 100, 100, 255))

    lbp_current_score_id, _ = builder.add_node(
        "currentScoreLabel", parent_id=lbp_id, active=True,
        pos=(150, -190, 0), size=(200, 24)
    )
    lbp_current_score_label_id = builder.add_label(lbp_current_score_id, "", 14, (51, 51, 51, 255))

    # LeaderboardPanel script
    builder.add_script(lbp_id, "LeaderboardPanel", UUIDS["LeaderboardPanel"], {
        "leaderboardScrollView": None,
        "leaderboardContainer": {"__id__": lbp_container_id},
        "levelFilterNode": None,
        "currentRankLabel": {"__id__": lbp_current_rank_label_id},
        "currentScoreLabel": {"__id__": lbp_current_score_label_id}
    })

    # ==================== UIController script ====================
    builder.add_script(root_id, "UIController", UUIDS["UIController"], {
        "levelSelectRoot": {"__id__": level_select_root_id},
        "gameplayRoot": {"__id__": gameplay_root_id},
        "settlementRoot": {"__id__": settlement_root_id},
        "leaderboardRoot": {"__id__": leaderboard_root_id},
        "levelSelectPanel": {"__id__": builder._find_script_by_node(lsp_id)},
        "taskPanel": {"__id__": builder._find_script_by_node(task_panel_id)},
        "cluePanel": {"__id__": builder._find_script_by_node(clue_panel_id)},
        "actionPanel": {"__id__": builder._find_script_by_node(action_panel_id)},
        "settlementPanel": {"__id__": builder._find_script_by_node(sp_id)},
        "leaderboardPanel": {"__id__": builder._find_script_by_node(lbp_id)},
        "taskTabButton": {"__id__": task_tab_btn_id},
        "clueTabButton": {"__id__": clue_tab_btn_id},
        "actionTabButton": {"__id__": action_tab_btn_id}
    })

    return builder.build()


# 给 PrefabBuilder 添加一个辅助方法
def _find_script_by_node(self, node_id):
    for obj in self.objects:
        if obj.get("__type__") == "cc.Script":
            for comp in self._get_node_components(node_id):
                if comp.get("__id__") == obj.get("__id__"):
                    return obj.get("__id__")
    return None


def _get_node_components(self, node_id):
    for obj in self.objects:
        if obj.get("__id__") == node_id and obj.get("__type__") == "cc.Node":
            return obj.get("_components", [])
    return []


PrefabBuilder._find_script_by_node = _find_script_by_node
PrefabBuilder._get_node_components = _get_node_components


def main():
    print("生成 UIController.prefab...")
    data = build_uicontroller()

    output_path = os.path.join(BASE, 'assets', 'resources', 'prefabs', 'UIController.prefab')
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"✅ 已生成 {len(data)} 个对象")
    print(f"   输出: {output_path}")

    # 验证
    print("\n验证结构:")
    nodes = [o for o in data if o["__type__"] == "cc.Node"]
    scripts = [o for o in data if o["__type__"] == "cc.Script"]
    print(f"   节点数: {len(nodes)}")
    print(f"   脚本数: {len(scripts)}")

    for s in scripts:
        print(f"   - {s['name']} (id={s['__id__']})")


if __name__ == '__main__':
    main()
