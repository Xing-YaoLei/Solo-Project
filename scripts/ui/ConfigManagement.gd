extends "res://scripts/ui/BaseUI.gd"

var tab_container: TabContainer
var start_time_input: LineEdit
var end_time_input: LineEdit
var maintenance_msg_input: LineEdit
var formal_mode_check: CheckBox
var practice_mode_check: CheckBox

func _ready() -> void:
	_setup_background()
	_build_ui()

func _build_ui() -> void:
	var title = create_label("⚙️ 配置管理中心", Vector2(0, 40), 30, STYLE_ACCENT)
	title.size = Vector2(get_viewport_rect().size.x, 50)
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	add_child(title)

	var role_label = create_label("当前角色：" + PermissionManager.get_role_name() + " ｜ 拥有系统配置权限", Vector2(0, 85), 14, STYLE_TEXT_SECONDARY)
	role_label.size = Vector2(get_viewport_rect().size.x, 25)
	role_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	add_child(role_label)

	tab_container = TabContainer.new()
	tab_container.position = Vector2(40, 130)
	tab_container.size = Vector2(get_viewport_rect().size.x - 80, get_viewport_rect().size.y - 240)
	add_child(tab_container)

	var tab1 = _build_levels_tab()
	tab1.name = "关卡管理"
	tab_container.add_child(tab1)

	var tab2 = _build_questions_tab()
	tab2.name = "题目素材"
	tab_container.add_child(tab2)

	var tab3 = _build_rewards_tab()
	tab3.name = "奖励设置"
	tab_container.add_child(tab3)

	var tab4 = _build_availability_tab()
	tab4.name = "开放时间与模式"
	tab_container.add_child(tab4)

	var tab5 = _build_role_tab()
	tab5.name = "角色权限"
	tab_container.add_child(tab5)

	var bottom_hbox = HBoxContainer.new()
	bottom_hbox.position = Vector2(60, get_viewport_rect().size.y - 80)
	bottom_hbox.size = Vector2(get_viewport_rect().size.x - 120, 44)
	bottom_hbox.add_theme_constant_override("separation", 16)
	add_child(bottom_hbox)

	var back_btn = create_button("← 返回主菜单", Vector2.ZERO, Vector2(180, 44), Color(0.4, 0.45, 0.55, 1))
	back_btn.pressed.connect(_on_back_pressed)
	bottom_hbox.add_child(back_btn)

	var spacer = Control.new()
	spacer.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	bottom_hbox.add_child(spacer)

	var reset_btn = create_button("🔄 恢复默认数据", Vector2.ZERO, Vector2(180, 44), Color(0.55, 0.35, 0.35, 1))
	reset_btn.pressed.connect(_on_reset_defaults)
	bottom_hbox.add_child(reset_btn)

	var save_btn = create_button("💾 保存所有配置", Vector2.ZERO, Vector2(180, 44), STYLE_SUCCESS)
	save_btn.pressed.connect(_on_save_all)
	bottom_hbox.add_child(save_btn)

func _build_levels_tab() -> VBoxContainer:
	var vbox = VBoxContainer.new()
	vbox.anchor_right = 1.0
	vbox.anchor_bottom = 1.0
	vbox.add_theme_constant_override("separation", 12)
	var mc = create_margin_container({"left": 8, "right": 8, "top": 8, "bottom": 8})
	mc.add_child(vbox)

	var header = create_label("训练关卡列表 - 可启用/禁用、调整难度和题数", Vector2.ZERO, 15, STYLE_TEXT_SECONDARY)
	vbox.add_child(header)

	var scroll = ScrollContainer.new()
	scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	vbox.add_child(scroll)

	var levels_vbox = VBoxContainer.new()
	levels_vbox.add_theme_constant_override("separation", 10)
	levels_vbox.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	scroll.add_child(levels_vbox)

	for i in range(DataManager.levels.size()):
		var level = DataManager.levels[i]
		var level_card = _build_level_card(i, level)
		levels_vbox.add_child(level_card)

	return mc

func _build_level_card(index: int, level: Dictionary) -> PanelContainer:
	var card = PanelContainer.new()
	var style = StyleBoxFlat.new()
	style.bg_color = Color(0.18, 0.22, 0.28, 1)
	style.corner_radius_top_left = 8
	style.corner_radius_top_right = 8
	style.corner_radius_bottom_left = 8
	style.corner_radius_bottom_right = 8
	style.content_margin_left = 16
	style.content_margin_right = 16
	style.content_margin_top = 12
	style.content_margin_bottom = 12
	card.add_theme_stylebox_override("panel", style)
	card.size_flags_horizontal = Control.SIZE_EXPAND_FILL

	var main_vbox = VBoxContainer.new()
	main_vbox.anchor_right = 1.0
	main_vbox.anchor_bottom = 1.0
	main_vbox.add_theme_constant_override("separation", 10)
	card.add_child(main_vbox)

	var row1 = HBoxContainer.new()
	row1.add_theme_constant_override("separation", 16)
	main_vbox.add_child(row1)

	var unlock_check = CheckBox.new()
	unlock_check.text = "启用"
	unlock_check.button_pressed = level.get("unlocked", false)
	unlock_check.pressed.connect(func(pressed):
		DataManager.levels[index]["unlocked"] = pressed
	)
	row1.add_child(unlock_check)

	var id_label = create_label("ID: " + level.get("id", ""), Vector2.ZERO, 13, STYLE_TEXT_SECONDARY)
	row1.add_child(id_label)

	var spacer1 = Control.new()
	spacer1.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	row1.add_child(spacer1)

	var mode_options = ["both", "formal", "practice"]
	var mode_labels = ["双模式可用", "仅正式训练", "仅自由练习"]
	var mode_menu = OptionButton.new()
	for ml in mode_labels:
		mode_menu.add_item(ml)
	var cur_mode = level.get("mode", "both")
	mode_menu.select(max(0, mode_options.find(cur_mode)))
	mode_menu.item_selected.connect(func(selected_idx):
		DataManager.levels[index]["mode"] = mode_options[selected_idx]
	)
	row1.add_child(mode_menu)

	var row2 = HBoxContainer.new()
	row2.add_theme_constant_override("separation", 12)
	main_vbox.add_child(row2)

	var name_label = create_label("名称：", Vector2.ZERO, 14, STYLE_TEXT_SECONDARY)
	row2.add_child(name_label)
	var name_input = LineEdit.new()
	name_input.text = level.get("name", "")
	name_input.placeholder_text = "关卡名称"
	name_input.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	name_input.text_changed.connect(func(txt): DataManager.levels[index]["name"] = txt)
	row2.add_child(name_input)

	var diff_label = create_label("难度：", Vector2.ZERO, 14, STYLE_TEXT_SECONDARY)
	row2.add_child(diff_label)
	var diff_spin = SpinBox.new()
	diff_spin.min_value = 1
	diff_spin.max_value = 5
	diff_spin.value = level.get("difficulty", 1)
	diff_spin.value_changed.connect(func(v): DataManager.levels[index]["difficulty"] = int(v))
	row2.add_child(diff_spin)

	var row3 = HBoxContainer.new()
	row3.add_theme_constant_override("separation", 12)
	main_vbox.add_child(row3)

	var desc_label = create_label("描述：", Vector2.ZERO, 14, STYLE_TEXT_SECONDARY)
	row3.add_child(desc_label)
	var desc_input = LineEdit.new()
	desc_input.text = level.get("description", "")
	desc_input.placeholder_text = "关卡描述"
	desc_input.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	desc_input.text_changed.connect(func(txt): DataManager.levels[index]["description"] = txt)
	row3.add_child(desc_input)

	var row4 = HBoxContainer.new()
	row4.add_theme_constant_override("separation", 12)
	main_vbox.add_child(row4)

	var qc_label = create_label("题数：", Vector2.ZERO, 14, STYLE_TEXT_SECONDARY)
	row4.add_child(qc_label)
	var qc_spin = SpinBox.new()
	qc_spin.min_value = 1
	qc_spin.max_value = 50
	qc_spin.value = level.get("question_count", 4)
	qc_spin.value_changed.connect(func(v): DataManager.levels[index]["question_count"] = int(v))
	row4.add_child(qc_spin)

	var tl_label = create_label("限时(秒)：", Vector2.ZERO, 14, STYLE_TEXT_SECONDARY)
	row4.add_child(tl_label)
	var tl_spin = SpinBox.new()
	tl_spin.min_value = 60
	tl_spin.max_value = 3600
	tl_spin.value = level.get("time_limit", 300)
	tl_spin.value_changed.connect(func(v): DataManager.levels[index]["time_limit"] = int(v))
	row4.add_child(tl_spin)

	var spacer2 = Control.new()
	spacer2.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	row4.add_child(spacer2)

	var gt_label = create_label("包含玩法：", Vector2.ZERO, 14, STYLE_TEXT_SECONDARY)
	row4.add_child(gt_label)

	var types = ["evidence_identification", "template_selection", "checklist_sorting", "sampling_processing"]
	var type_names = ["证据识别", "模板选择", "清单排序", "抽样处理"]
	var current_gts = level.get("game_types", [])
	for ti in range(types.size()):
		var gt_check = CheckBox.new()
		gt_check.text = type_names[ti]
		gt_check.button_pressed = types[ti] in current_gts
		gt_check.pressed.connect(func(pressed, t = types[ti]):
			var gts = DataManager.levels[index].get("game_types", [])
			if pressed:
				if not t in gts:
					gts.append(t)
			else:
				gts.erase(t)
			DataManager.levels[index]["game_types"] = gts
		)
		row4.add_child(gt_check)

	return card

func _build_questions_tab() -> VBoxContainer:
	var vbox = VBoxContainer.new()
	vbox.anchor_right = 1.0
	vbox.anchor_bottom = 1.0
	vbox.add_theme_constant_override("separation", 12)
	var mc = create_margin_container({"left": 8, "right": 8, "top": 8, "bottom": 8})
	mc.add_child(vbox)

	var header = create_label("题目与素材管理（证据分类、通报模板等）", Vector2.ZERO, 15, STYLE_TEXT_SECONDARY)
	vbox.add_child(header)

	var scroll = ScrollContainer.new()
	scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	vbox.add_child(scroll)

	var main_vbox = VBoxContainer.new()
	main_vbox.add_theme_constant_override("separation", 16)
	main_vbox.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	scroll.add_child(main_vbox)

	var q_types = ["evidence_identification", "template_selection", "checklist_sorting", "sampling_processing"]
	var q_type_names = ["证据附件识别", "通报模板选择", "检查清单排序", "抽样记录处理"]
	for ti in range(q_types.size()):
		var sec_label = create_label("📌 %s - 共 %d 道题" % [q_type_names[ti], DataManager.get_questions_by_type(q_types[ti]).size()], Vector2.ZERO, 17, STYLE_ACCENT)
		main_vbox.add_child(sec_label)
		var questions = DataManager.get_questions_by_type(q_types[ti])
		for q in questions:
			var q_card = PanelContainer.new()
			var qs = StyleBoxFlat.new()
			qs.bg_color = Color(0.16, 0.2, 0.26, 1)
			qs.corner_radius_top_left = 6
			qs.corner_radius_top_right = 6
			qs.corner_radius_bottom_left = 6
			qs.corner_radius_bottom_right = 6
			qs.content_margin_left = 12
			qs.content_margin_right = 12
			qs.content_margin_top = 8
			qs.content_margin_bottom = 8
			q_card.add_theme_stylebox_override("panel", qs)
			q_card.size_flags_horizontal = Control.SIZE_EXPAND_FILL
			var qvbox = VBoxContainer.new()
			qvbox.add_theme_constant_override("separation", 3)
			qvbox.size_flags_horizontal = Control.SIZE_EXPAND_FILL
			q_card.add_child(qvbox)
			var qtitle = create_label("✦ %s（分值：%d）" % [q.get("title", ""), q.get("score", 0)], Vector2.ZERO, 15, STYLE_TEXT_PRIMARY)
			qvbox.add_child(qtitle)
			var qdesc = create_label(q.get("description", ""), Vector2.ZERO, 13, STYLE_TEXT_SECONDARY)
			qdesc.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
			qvbox.add_child(qdesc)
			var qid = create_label("ID: " + q.get("id", "") + " | 所需权限: " + q.get("required_permission", ""), Vector2.ZERO, 12, Color(0.45, 0.5, 0.58, 1))
			qvbox.add_child(qid)
			main_vbox.add_child(q_card)

	var mat_sep = HSeparator.new()
	mat_sep.modulate = Color(0.35, 0.4, 0.48, 1)
	main_vbox.add_child(mat_sep)

	var mat_label = create_label("📂 证据分类素材库", Vector2.ZERO, 17, STYLE_ACCENT)
	main_vbox.add_child(mat_label)
	var evidence_cats = DataManager.materials.get("evidence_categories", [])
	for cat in evidence_cats:
		var cat_text = "• %s：%s" % [cat.get("name", ""), cat.get("description", "")]
		var cat_lbl = create_label(cat_text, Vector2.ZERO, 14, STYLE_TEXT_PRIMARY)
		main_vbox.add_child(cat_lbl)

	var tpl_sep = HSeparator.new()
	tpl_sep.modulate = Color(0.35, 0.4, 0.48, 1)
	main_vbox.add_child(tpl_sep)
	var tpl_label = create_label("📋 通报模板素材库", Vector2.ZERO, 17, STYLE_ACCENT)
	main_vbox.add_child(tpl_label)
	var templates = DataManager.materials.get("templates", [])
	for tpl in templates:
		var tpl_text = "• %s：%s" % [tpl.get("name", ""), tpl.get("description", "")]
		var tpl_lbl = create_label(tpl_text, Vector2.ZERO, 14, STYLE_TEXT_PRIMARY)
		main_vbox.add_child(tpl_lbl)

	return mc

func _build_rewards_tab() -> VBoxContainer:
	var vbox = VBoxContainer.new()
	vbox.anchor_right = 1.0
	vbox.anchor_bottom = 1.0
	vbox.add_theme_constant_override("separation", 12)
	var mc = create_margin_container({"left": 8, "right": 8, "top": 8, "bottom": 8})
	mc.add_child(vbox)

	var header = create_label("徽章奖励设置", Vector2.ZERO, 15, STYLE_TEXT_SECONDARY)
	vbox.add_child(header)

	var scroll = ScrollContainer.new()
	scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	vbox.add_child(scroll)

	var rewards_vbox = VBoxContainer.new()
	rewards_vbox.add_theme_constant_override("separation", 10)
	rewards_vbox.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	scroll.add_child(rewards_vbox)

	for reward in DataManager.rewards:
		var card = PanelContainer.new()
		var style = StyleBoxFlat.new()
		style.bg_color = Color(0.18, 0.22, 0.28, 1)
		style.corner_radius_top_left = 8
		style.corner_radius_top_right = 8
		style.corner_radius_bottom_left = 8
		style.corner_radius_bottom_right = 8
		style.content_margin_left = 16
		style.content_margin_right = 16
		style.content_margin_top = 12
		style.content_margin_bottom = 12
		card.add_theme_stylebox_override("panel", style)
		card.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		var hbox = HBoxContainer.new()
		hbox.add_theme_constant_override("separation", 16)
		card.add_child(hbox)
		var icon_lbl = create_label(reward.get("icon", "🎖"), Vector2.ZERO, 36, STYLE_WARNING)
		icon_lbl.custom_minimum_size = Vector2(60, 0)
		icon_lbl.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
		hbox.add_child(icon_lbl)
		var vbox_info = VBoxContainer.new()
		vbox_info.add_theme_constant_override("separation", 4)
		vbox_info.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		hbox.add_child(vbox_info)
		var rname = create_label(reward.get("name", ""), Vector2.ZERO, 17, STYLE_TEXT_PRIMARY)
		vbox_info.add_child(rname)
		var rdesc = create_label(reward.get("description", ""), Vector2.ZERO, 13, STYLE_TEXT_SECONDARY)
		vbox_info.add_child(rdesc)
		var rcond = create_label("触发条件: " + reward.get("condition", ""), Vector2.ZERO, 12, Color(0.45, 0.5, 0.58, 1))
		vbox_info.add_child(rcond)
		rewards_vbox.add_child(card)

	return mc

func _build_availability_tab() -> VBoxContainer:
	var vbox = VBoxContainer.new()
	vbox.anchor_right = 1.0
	vbox.anchor_bottom = 1.0
	vbox.add_theme_constant_override("separation", 16)
	var mc = create_margin_container({"left": 8, "right": 8, "top": 8, "bottom": 8})
	mc.add_child(vbox)

	var header = create_label("系统开放时间与训练模式设置（留空表示不限制）", Vector2.ZERO, 15, STYLE_TEXT_SECONDARY)
	vbox.add_child(header)

	var av = DataManager.availability

	var time_card = PanelContainer.new()
	var ts = StyleBoxFlat.new()
	ts.bg_color = Color(0.18, 0.22, 0.28, 1)
	ts.corner_radius_top_left = 8
	ts.corner_radius_top_right = 8
	ts.corner_radius_bottom_left = 8
	ts.corner_radius_bottom_right = 8
	ts.content_margin_left = 16
	ts.content_margin_right = 16
	ts.content_margin_top = 12
	ts.content_margin_bottom = 12
	time_card.add_theme_stylebox_override("panel", ts)
	time_card.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	vbox.add_child(time_card)

	var tvbox = VBoxContainer.new()
	tvbox.add_theme_constant_override("separation", 12)
	time_card.add_child(tvbox)

	var row1 = HBoxContainer.new()
	row1.add_theme_constant_override("separation", 12)
	tvbox.add_child(row1)
	var sl = create_label("开始时间：", Vector2.ZERO, 15, STYLE_TEXT_SECONDARY)
	sl.custom_minimum_size = Vector2(100, 0)
	sl.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	row1.add_child(sl)
	start_time_input = LineEdit.new()
	start_time_input.text = av.get("start_time", "")
	start_time_input.placeholder_text = "YYYY-MM-DD HH:mm:ss"
	start_time_input.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	row1.add_child(start_time_input)

	var row2 = HBoxContainer.new()
	row2.add_theme_constant_override("separation", 12)
	tvbox.add_child(row2)
	var el = create_label("结束时间：", Vector2.ZERO, 15, STYLE_TEXT_SECONDARY)
	el.custom_minimum_size = Vector2(100, 0)
	el.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	row2.add_child(el)
	end_time_input = LineEdit.new()
	end_time_input.text = av.get("end_time", "")
	end_time_input.placeholder_text = "YYYY-MM-DD HH:mm:ss"
	end_time_input.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	row2.add_child(end_time_input)

	var row3 = HBoxContainer.new()
	row3.add_theme_constant_override("separation", 12)
	tvbox.add_child(row3)
	var ml = create_label("维护公告：", Vector2.ZERO, 15, STYLE_TEXT_SECONDARY)
	ml.custom_minimum_size = Vector2(100, 0)
	ml.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	row3.add_child(ml)
	maintenance_msg_input = LineEdit.new()
	maintenance_msg_input.text = av.get("maintenance_message", "")
	maintenance_msg_input.placeholder_text = "维护期间展示的消息"
	maintenance_msg_input.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	row3.add_child(maintenance_msg_input)

	var mode_card = PanelContainer.new()
	var ms = StyleBoxFlat.new()
	ms.bg_color = Color(0.18, 0.22, 0.28, 1)
	ms.corner_radius_top_left = 8
	ms.corner_radius_top_right = 8
	ms.corner_radius_bottom_left = 8
	ms.corner_radius_bottom_right = 8
	ms.content_margin_left = 16
	ms.content_margin_right = 16
	ms.content_margin_top = 12
	ms.content_margin_bottom = 12
	mode_card.add_theme_stylebox_override("panel", ms)
	mode_card.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	vbox.add_child(mode_card)

	var mvbox = VBoxContainer.new()
	mvbox.add_theme_constant_override("separation", 10)
	mode_card.add_child(mvbox)

	var mode_title = create_label("启用的训练模式", Vector2.ZERO, 16, STYLE_ACCENT)
	mvbox.add_child(mode_title)

	var enabled_modes = av.get("enabled_modes", ["formal", "practice"])

	formal_mode_check = CheckBox.new()
	formal_mode_check.text = "📋 正式训练模式（有时间限制，计入正式成绩）"
	formal_mode_check.button_pressed = "formal" in enabled_modes
	formal_mode_check.add_theme_font_size_override("font_size", 15)
	mvbox.add_child(formal_mode_check)

	practice_mode_check = CheckBox.new()
	practice_mode_check.text = "🎯 自由练习模式（无时间限制，不计入正式成绩）"
	practice_mode_check.button_pressed = "practice" in enabled_modes
	practice_mode_check.add_theme_font_size_override("font_size", 15)
	mvbox.add_child(practice_mode_check)

	var mode_note = create_label("注意：两个入口相互独立，方便风控专员根据需要选择不同训练模式", Vector2.ZERO, 13, STYLE_WARNING)
	mode_note.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	mvbox.add_child(mode_note)

	var spacer = Control.new()
	spacer.size_flags_vertical = Control.SIZE_EXPAND_FILL
	vbox.add_child(spacer)

	return mc

func _build_role_tab() -> VBoxContainer:
	var vbox = VBoxContainer.new()
	vbox.anchor_right = 1.0
	vbox.anchor_bottom = 1.0
	vbox.add_theme_constant_override("separation", 12)
	var mc = create_margin_container({"left": 8, "right": 8, "top": 8, "bottom": 8})
	mc.add_child(vbox)

	var header = create_label("角色与权限说明（可切换当前角色进行不同权限的功能测试）", Vector2.ZERO, 15, STYLE_TEXT_SECONDARY)
	vbox.add_child(header)

	var current_role_box = PanelContainer.new()
	var crs = StyleBoxFlat.new()
	crs.bg_color = Color(0.20, 0.30, 0.40, 1)
	crs.corner_radius_top_left = 8
	crs.corner_radius_top_right = 8
	crs.corner_radius_bottom_left = 8
	crs.corner_radius_bottom_right = 8
	crs.content_margin_left = 16
	crs.content_margin_right = 16
	crs.content_margin_top = 12
	crs.content_margin_bottom = 12
	current_role_box.add_theme_stylebox_override("panel", crs)
	current_role_box.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	vbox.add_child(current_role_box)

	var cr_hbox = HBoxContainer.new()
	cr_hbox.add_theme_constant_override("separation", 16)
	current_role_box.add_child(cr_hbox)
	var cr_label = create_label("切换当前角色：", Vector2.ZERO, 16, STYLE_TEXT_PRIMARY)
	cr_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	cr_hbox.add_child(cr_label)

	var role_menu = OptionButton.new()
	var roles = PermissionManager.get_available_roles()
	var cur_role = PermissionManager.get_current_role()
	for ri in range(roles.size()):
		role_menu.add_item(roles[ri]["name"])
		if roles[ri]["id"] == cur_role:
			role_menu.select(ri)
	role_menu.item_selected.connect(func(idx):
		PermissionManager.set_role(roles[idx]["id"])
		show_notification("已切换为角色：" + roles[idx]["name"], "info", 2.0)
	)
	cr_hbox.add_child(role_menu)

	var spacer_cr = Control.new()
	spacer_cr.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	cr_hbox.add_child(spacer_cr)

	var scroll = ScrollContainer.new()
	scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	vbox.add_child(scroll)

	var roles_vbox = VBoxContainer.new()
	roles_vbox.add_theme_constant_override("separation", 12)
	roles_vbox.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	scroll.add_child(roles_vbox)

	for role in roles:
		var card = PanelContainer.new()
		var style = StyleBoxFlat.new()
		style.bg_color = Color(0.18, 0.22, 0.28, 1)
		style.corner_radius_top_left = 8
		style.corner_radius_top_right = 8
		style.corner_radius_bottom_left = 8
		style.corner_radius_bottom_right = 8
		style.content_margin_left = 16
		style.content_margin_right = 16
		style.content_margin_top = 12
		style.content_margin_bottom = 12
		card.add_theme_stylebox_override("panel", style)
		card.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		var rvbox = VBoxContainer.new()
		rvbox.add_theme_constant_override("separation", 8)
		card.add_child(rvbox)
		var rname = create_label("👤 " + role["name"], Vector2.ZERO, 18, STYLE_ACCENT)
		rvbox.add_child(rname)
		var perms_title = create_label("拥有权限：", Vector2.ZERO, 14, STYLE_TEXT_SECONDARY)
		rvbox.add_child(perms_title)
		for p in role["permissions"]:
			var pdesc = PermissionManager.PERMISSION_DESCRIPTIONS.get(p, p)
			var ptext = "  • %s - %s" % [p, pdesc]
			var plbl = create_label(ptext, Vector2.ZERO, 13, STYLE_TEXT_PRIMARY)
			rvbox.add_child(plbl)
		roles_vbox.add_child(card)

	return mc

func _collect_availability_config() -> void:
	var enabled: Array = []
	if formal_mode_check and formal_mode_check.button_pressed:
		enabled.append("formal")
	if practice_mode_check and practice_mode_check.button_pressed:
		enabled.append("practice")
	DataManager.availability = {
		"start_time": start_time_input.text if start_time_input else "",
		"end_time": end_time_input.text if end_time_input else "",
		"maintenance_message": maintenance_msg_input.text if maintenance_msg_input else "",
		"enabled_modes": enabled
	}

func _on_save_all() -> void:
	_collect_availability_config()
	DataManager.save_all_data()
	show_notification("✅ 所有配置已保存成功", "success", 3.0)

func _on_reset_defaults() -> void:
	var confirm = AcceptDialog.new()
	confirm.title = "确认恢复默认"
	confirm.dialog_text = "确定要恢复所有配置为默认值吗？当前自定义配置将丢失。"
	confirm.confirmed.connect(func():
		DataManager.save_default_data()
		show_notification("已恢复默认数据，正在刷新...", "success", 2.0)
		await get_tree().create_timer(1.0).timeout
		get_tree().reload_current_scene()
	)
	add_child(confirm)
	confirm.popup_centered()

func _on_back_pressed() -> void:
	GameManager.change_scene("main_menu")
