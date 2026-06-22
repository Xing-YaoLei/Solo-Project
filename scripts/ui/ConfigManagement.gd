extends "res://scripts/ui/BaseUI.gd"

var tab_container: TabContainer
var start_time_input: LineEdit
var end_time_input: LineEdit
var maintenance_msg_input: LineEdit
var formal_mode_check: CheckBox
var practice_mode_check: CheckBox

func _ready() -> void:
	super._ready()
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

	var header = create_label("题目与素材管理 - 可直接编辑后点击底部「保存所有配置」", Vector2.ZERO, 15, STYLE_TEXT_SECONDARY)
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
		var q_type_key = q_types[ti]
		var questions_ref = DataManager.questions[q_type_key]
		for qi in range(questions_ref.size()):
			var q_card = _build_editable_question_card(q_type_key, qi)
			main_vbox.add_child(q_card)

	var mat_sep = HSeparator.new()
	mat_sep.modulate = Color(0.35, 0.4, 0.48, 1)
	main_vbox.add_child(mat_sep)

	var mat_title_hbox = HBoxContainer.new()
	mat_title_hbox.add_theme_constant_override("separation", 12)
	main_vbox.add_child(mat_title_hbox)
	var mat_label = create_label("📂 证据分类素材库", Vector2.ZERO, 17, STYLE_ACCENT)
	mat_title_hbox.add_child(mat_label)
	var add_cat_btn = create_button("+ 新增分类", Vector2.ZERO, Vector2(120, 34), Color(0.25, 0.45, 0.3, 1))
	add_cat_btn.add_theme_font_size_override("font_size", 13)
	add_cat_btn.pressed.connect(func():
		DataManager.materials["evidence_categories"].append({"id": "cat_" + str(randi()), "name": "新分类", "description": "请输入描述"})
		show_notification("已新增，请填写后保存", "info", 1.5)
		get_tree().reload_current_scene()
	)
	mat_title_hbox.add_child(add_cat_btn)

	var evidence_cats = DataManager.materials.get("evidence_categories", [])
	for ci in range(evidence_cats.size()):
		var cat_card = _build_editable_evidence_category_card(ci)
		main_vbox.add_child(cat_card)

	var tpl_sep = HSeparator.new()
	tpl_sep.modulate = Color(0.35, 0.4, 0.48, 1)
	main_vbox.add_child(tpl_sep)

	var tpl_title_hbox = HBoxContainer.new()
	tpl_title_hbox.add_theme_constant_override("separation", 12)
	main_vbox.add_child(tpl_title_hbox)
	var tpl_label = create_label("📋 通报模板素材库", Vector2.ZERO, 17, STYLE_ACCENT)
	tpl_title_hbox.add_child(tpl_label)
	var add_tpl_btn = create_button("+ 新增模板", Vector2.ZERO, Vector2(120, 34), Color(0.25, 0.45, 0.3, 1))
	add_tpl_btn.add_theme_font_size_override("font_size", 13)
	add_tpl_btn.pressed.connect(func():
		DataManager.materials["templates"].append({"id": "tpl_" + str(randi()), "name": "新模板", "description": "请输入适用场景说明"})
		show_notification("已新增，请填写后保存", "info", 1.5)
		get_tree().reload_current_scene()
	)
	tpl_title_hbox.add_child(add_tpl_btn)

	var templates = DataManager.materials.get("templates", [])
	for ti in range(templates.size()):
		var tpl_card = _build_editable_template_card(ti)
		main_vbox.add_child(tpl_card)

	return mc

func _build_editable_question_card(q_type_key: String, q_index: int) -> PanelContainer:
	var q = DataManager.questions[q_type_key][q_index]
	var card = PanelContainer.new()
	var qs = StyleBoxFlat.new()
	qs.bg_color = Color(0.16, 0.2, 0.26, 1)
	qs.corner_radius_top_left = 6
	qs.corner_radius_top_right = 6
	qs.corner_radius_bottom_left = 6
	qs.corner_radius_bottom_right = 6
	qs.content_margin_left = 12
	qs.content_margin_right = 12
	qs.content_margin_top = 10
	qs.content_margin_bottom = 10
	card.add_theme_stylebox_override("panel", qs)
	card.size_flags_horizontal = Control.SIZE_EXPAND_FILL

	var qvbox = VBoxContainer.new()
	qvbox.add_theme_constant_override("separation", 6)
	qvbox.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	card.add_child(qvbox)

	var row0 = HBoxContainer.new()
	row0.add_theme_constant_override("separation", 10)
	qvbox.add_child(row0)
	var id_lbl = create_label("ID: " + q.get("id", ""), Vector2.ZERO, 12, Color(0.45, 0.5, 0.58, 1))
	row0.add_child(id_lbl)
	var spacer0 = Control.new()
	spacer0.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	row0.add_child(spacer0)
	var perm_lbl = create_label("权限:", Vector2.ZERO, 13, STYLE_TEXT_SECONDARY)
	row0.add_child(perm_lbl)
	var perm_input = LineEdit.new()
	perm_input.text = q.get("required_permission", "")
	perm_input.custom_minimum_size = Vector2(150, 28)
	perm_input.add_theme_font_size_override("font_size", 13)
	perm_input.text_changed.connect(func(txt): DataManager.questions[q_type_key][q_index]["required_permission"] = txt)
	row0.add_child(perm_input)
	var score_lbl = create_label("分值:", Vector2.ZERO, 13, STYLE_TEXT_SECONDARY)
	row0.add_child(score_lbl)
	var score_spin = SpinBox.new()
	score_spin.min_value = 5
	score_spin.max_value = 100
	score_spin.step = 5
	score_spin.value = q.get("score", 25)
	score_spin.custom_minimum_size = Vector2(80, 28)
	score_spin.value_changed.connect(func(v): DataManager.questions[q_type_key][q_index]["score"] = int(v))
	row0.add_child(score_spin)

	var row1 = HBoxContainer.new()
	row1.add_theme_constant_override("separation", 10)
	qvbox.add_child(row1)
	var title_lbl = create_label("标题:", Vector2.ZERO, 14, STYLE_TEXT_SECONDARY)
	title_lbl.custom_minimum_size = Vector2(50, 0)
	row1.add_child(title_lbl)
	var title_input = LineEdit.new()
	title_input.text = q.get("title", "")
	title_input.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	title_input.text_changed.connect(func(txt): DataManager.questions[q_type_key][q_index]["title"] = txt)
	row1.add_child(title_input)

	var row2 = HBoxContainer.new()
	row2.add_theme_constant_override("separation", 10)
	qvbox.add_child(row2)
	var desc_lbl = create_label("描述:", Vector2.ZERO, 14, STYLE_TEXT_SECONDARY)
	desc_lbl.custom_minimum_size = Vector2(50, 0)
	row2.add_child(desc_lbl)
	var desc_input = LineEdit.new()
	desc_input.text = q.get("description", "")
	desc_input.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	desc_input.text_changed.connect(func(txt): DataManager.questions[q_type_key][q_index]["description"] = txt)
	row2.add_child(desc_input)

	var row3 = HBoxContainer.new()
	row3.add_theme_constant_override("separation", 10)
	qvbox.add_child(row3)
	var hint_lbl = create_label("提示:", Vector2.ZERO, 14, STYLE_TEXT_SECONDARY)
	hint_lbl.custom_minimum_size = Vector2(50, 0)
	row3.add_child(hint_lbl)
	var hint_input = LineEdit.new()
	hint_input.text = q.get("hint", "")
	hint_input.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	hint_input.text_changed.connect(func(txt): DataManager.questions[q_type_key][q_index]["hint"] = txt)
	row3.add_child(hint_input)

	var content_sep = HSeparator.new()
	content_sep.modulate = Color(0.35, 0.4, 0.48, 1)
	qvbox.add_child(content_sep)

	if q_type_key == "evidence_identification":
		_build_evidence_identification_content(qvbox, q_type_key, q_index)
	elif q_type_key == "template_selection":
		_build_template_selection_content(qvbox, q_type_key, q_index)
	elif q_type_key == "checklist_sorting":
		_build_checklist_sorting_content(qvbox, q_type_key, q_index)
	elif q_type_key == "sampling_processing":
		_build_sampling_processing_content(qvbox, q_type_key, q_index)

	return card

func _build_evidence_identification_content(parent: VBoxContainer, q_type_key: String, q_index: int) -> void:
	var title = create_label("🔘 选项列表 - 勾选「是证据」表示正确答案", Vector2.ZERO, 14, STYLE_ACCENT)
	parent.add_child(title)
	var q_ref = DataManager.questions[q_type_key][q_index]
	if not q_ref.has("options"):
		q_ref["options"] = []
	var options_ref = q_ref["options"]
	for oi in range(options_ref.size()):
		var opt_panel = PanelContainer.new()
		var os = StyleBoxFlat.new()
		os.bg_color = Color(0.14, 0.18, 0.24, 1)
		os.corner_radius_top_left = 5
		os.corner_radius_top_right = 5
		os.corner_radius_bottom_left = 5
		os.corner_radius_bottom_right = 5
		os.content_margin_left = 10
		os.content_margin_right = 10
		os.content_margin_top = 8
		os.content_margin_bottom = 8
		opt_panel.add_theme_stylebox_override("panel", os)
		opt_panel.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		parent.add_child(opt_panel)

		var opt_vbox = VBoxContainer.new()
		opt_vbox.add_theme_constant_override("separation", 6)
		opt_vbox.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		opt_panel.add_child(opt_vbox)

		var row1 = HBoxContainer.new()
		row1.add_theme_constant_override("separation", 8)
		opt_vbox.add_child(row1)
		var id_lbl = create_label("选项" + str(oi + 1) + "（ID:" + options_ref[oi].get("id", "") + "）", Vector2.ZERO, 12, Color(0.5, 0.55, 0.65, 1))
		row1.add_child(id_lbl)
		var spacer = Control.new()
		spacer.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		row1.add_child(spacer)
		var correct_chk = CheckBox.new()
		correct_chk.text = "✓ 是证据（正确答案）"
		correct_chk.button_pressed = options_ref[oi].get("is_evidence", false)
		correct_chk.add_theme_font_size_override("font_size", 13)
		correct_chk.pressed.connect(func(pressed, idx=oi):
			DataManager.questions[q_type_key][q_index]["options"][idx]["is_evidence"] = pressed
		)
		row1.add_child(correct_chk)
		var del_opt = create_button("删除选项", Vector2.ZERO, Vector2(88, 26), STYLE_DANGER)
		del_opt.add_theme_font_size_override("font_size", 11)
		del_opt.pressed.connect(func(idx=oi):
			DataManager.questions[q_type_key][q_index]["options"].remove_at(idx)
			show_notification("已删除选项，刷新页面生效", "warning", 1.5)
			get_tree().reload_current_scene()
		)
		row1.add_child(del_opt)

		var row2 = HBoxContainer.new()
		row2.add_theme_constant_override("separation", 8)
		opt_vbox.add_child(row2)
		var name_lbl = create_label("名称:", Vector2.ZERO, 13, STYLE_TEXT_SECONDARY)
		name_lbl.custom_minimum_size = Vector2(46, 0)
		row2.add_child(name_lbl)
		var name_in = LineEdit.new()
		name_in.text = options_ref[oi].get("name", "")
		name_in.placeholder_text = "选项名称，如：合同扫描件.pdf"
		name_in.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		name_in.add_theme_font_size_override("font_size", 13)
		name_in.text_changed.connect(func(txt): DataManager.questions[q_type_key][q_index]["options"][oi]["name"] = txt)
		row2.add_child(name_in)
		var cat_lbl = create_label("分类:", Vector2.ZERO, 13, STYLE_TEXT_SECONDARY)
		cat_lbl.custom_minimum_size = Vector2(40, 0)
		row2.add_child(cat_lbl)
		var cat_in = LineEdit.new()
		cat_in.text = options_ref[oi].get("category", "")
		cat_in.placeholder_text = "分类"
		cat_in.custom_minimum_size = Vector2(140, 0)
		cat_in.add_theme_font_size_override("font_size", 13)
		cat_in.text_changed.connect(func(txt): DataManager.questions[q_type_key][q_index]["options"][oi]["category"] = txt)
		row2.add_child(cat_in)

		var row3 = HBoxContainer.new()
		row3.add_theme_constant_override("separation", 8)
		opt_vbox.add_child(row3)
		var desc_lbl = create_label("描述:", Vector2.ZERO, 13, STYLE_TEXT_SECONDARY)
		desc_lbl.custom_minimum_size = Vector2(46, 0)
		row3.add_child(desc_lbl)
		var desc_in = LineEdit.new()
		desc_in.text = options_ref[oi].get("description", "")
		desc_in.placeholder_text = "选项描述"
		desc_in.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		desc_in.add_theme_font_size_override("font_size", 13)
		desc_in.text_changed.connect(func(txt): DataManager.questions[q_type_key][q_index]["options"][oi]["description"] = txt)
		row3.add_child(desc_in)

	var add_opt_btn = create_button("+ 新增选项", Vector2.ZERO, Vector2(140, 32), Color(0.25, 0.45, 0.3, 1))
	add_opt_btn.add_theme_font_size_override("font_size", 12)
	add_opt_btn.pressed.connect(func():
		var new_id = "opt_" + str(randi())
		DataManager.questions[q_type_key][q_index]["options"].append({
			"id": new_id, "name": "新选项", "is_evidence": false,
			"category": "未分类", "description": "请填写选项说明"
		})
		show_notification("已新增选项，请填写后刷新", "info", 1.5)
		get_tree().reload_current_scene()
	)
	parent.add_child(add_opt_btn)

func _build_template_selection_content(parent: VBoxContainer, q_type_key: String, q_index: int) -> void:
	var title = create_label("📋 模板选项 - 勾选「适用」表示正确答案", Vector2.ZERO, 14, STYLE_ACCENT)
	parent.add_child(title)
	var q_ref = DataManager.questions[q_type_key][q_index]
	if not q_ref.has("options"):
		q_ref["options"] = []
	var options_ref = q_ref["options"]
	for oi in range(options_ref.size()):
		var opt_panel = PanelContainer.new()
		var os = StyleBoxFlat.new()
		os.bg_color = Color(0.14, 0.18, 0.24, 1)
		os.corner_radius_top_left = 5
		os.corner_radius_top_right = 5
		os.corner_radius_bottom_left = 5
		os.corner_radius_bottom_right = 5
		os.content_margin_left = 10
		os.content_margin_right = 10
		os.content_margin_top = 8
		os.content_margin_bottom = 8
		opt_panel.add_theme_stylebox_override("panel", os)
		opt_panel.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		parent.add_child(opt_panel)

		var opt_vbox = VBoxContainer.new()
		opt_vbox.add_theme_constant_override("separation", 6)
		opt_vbox.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		opt_panel.add_child(opt_vbox)

		var row1 = HBoxContainer.new()
		row1.add_theme_constant_override("separation", 8)
		opt_vbox.add_child(row1)
		var id_lbl = create_label("选项" + str(oi + 1) + "（ID:" + options_ref[oi].get("id", "") + "）", Vector2.ZERO, 12, Color(0.5, 0.55, 0.65, 1))
		row1.add_child(id_lbl)
		var spacer = Control.new()
		spacer.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		row1.add_child(spacer)
		var correct_chk = CheckBox.new()
		correct_chk.text = "✓ 适用（正确答案）"
		correct_chk.button_pressed = options_ref[oi].get("appropriate", false)
		correct_chk.add_theme_font_size_override("font_size", 13)
		correct_chk.pressed.connect(func(pressed, idx=oi):
			DataManager.questions[q_type_key][q_index]["options"][idx]["appropriate"] = pressed
		)
		row1.add_child(correct_chk)
		var del_opt = create_button("删除选项", Vector2.ZERO, Vector2(88, 26), STYLE_DANGER)
		del_opt.add_theme_font_size_override("font_size", 11)
		del_opt.pressed.connect(func(idx=oi):
			DataManager.questions[q_type_key][q_index]["options"].remove_at(idx)
			show_notification("已删除选项，刷新页面生效", "warning", 1.5)
			get_tree().reload_current_scene()
		)
		row1.add_child(del_opt)

		var row2 = HBoxContainer.new()
		row2.add_theme_constant_override("separation", 8)
		opt_vbox.add_child(row2)
		var name_lbl = create_label("名称:", Vector2.ZERO, 13, STYLE_TEXT_SECONDARY)
		name_lbl.custom_minimum_size = Vector2(46, 0)
		row2.add_child(name_lbl)
		var name_in = LineEdit.new()
		name_in.text = options_ref[oi].get("name", "")
		name_in.placeholder_text = "模板名称"
		name_in.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		name_in.add_theme_font_size_override("font_size", 13)
		name_in.text_changed.connect(func(txt): DataManager.questions[q_type_key][q_index]["options"][oi]["name"] = txt)
		row2.add_child(name_in)

		var row3 = HBoxContainer.new()
		row3.add_theme_constant_override("separation", 8)
		opt_vbox.add_child(row3)
		var desc_lbl = create_label("描述:", Vector2.ZERO, 13, STYLE_TEXT_SECONDARY)
		desc_lbl.custom_minimum_size = Vector2(46, 0)
		row3.add_child(desc_lbl)
		var desc_in = LineEdit.new()
		desc_in.text = options_ref[oi].get("description", "")
		desc_in.placeholder_text = "模板适用场景描述"
		desc_in.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		desc_in.add_theme_font_size_override("font_size", 13)
		desc_in.text_changed.connect(func(txt): DataManager.questions[q_type_key][q_index]["options"][oi]["description"] = txt)
		row3.add_child(desc_in)

		var row4 = HBoxContainer.new()
		row4.add_theme_constant_override("separation", 8)
		opt_vbox.add_child(row4)
		var reason_lbl = create_label("原因:", Vector2.ZERO, 13, STYLE_TEXT_SECONDARY)
		reason_lbl.custom_minimum_size = Vector2(46, 0)
		row4.add_child(reason_lbl)
		var reason_in = LineEdit.new()
		reason_in.text = options_ref[oi].get("reason", "")
		reason_in.placeholder_text = "选择/不选择该模板的原因"
		reason_in.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		reason_in.add_theme_font_size_override("font_size", 13)
		reason_in.text_changed.connect(func(txt): DataManager.questions[q_type_key][q_index]["options"][oi]["reason"] = txt)
		row4.add_child(reason_in)

	var add_opt_btn = create_button("+ 新增模板选项", Vector2.ZERO, Vector2(160, 32), Color(0.25, 0.45, 0.3, 1))
	add_opt_btn.add_theme_font_size_override("font_size", 12)
	add_opt_btn.pressed.connect(func():
		var new_id = "tpl_" + str(randi())
		DataManager.questions[q_type_key][q_index]["options"].append({
			"id": new_id, "name": "新模板", "appropriate": false,
			"description": "请输入适用场景", "reason": "请输入选择原因"
		})
		show_notification("已新增模板选项，请填写后刷新", "info", 1.5)
		get_tree().reload_current_scene()
	)
	parent.add_child(add_opt_btn)

func _build_checklist_sorting_content(parent: VBoxContainer, q_type_key: String, q_index: int) -> void:
	var title = create_label("📝 检查清单步骤 - 「顺序」数字决定正确答案", Vector2.ZERO, 14, STYLE_ACCENT)
	parent.add_child(title)
	var q_ref = DataManager.questions[q_type_key][q_index]
	if not q_ref.has("items"):
		q_ref["items"] = []
	var items_ref = q_ref["items"]
	for ii in range(items_ref.size()):
		var item_panel = PanelContainer.new()
		var is_box = StyleBoxFlat.new()
		is_box.bg_color = Color(0.14, 0.18, 0.24, 1)
		is_box.corner_radius_top_left = 5
		is_box.corner_radius_top_right = 5
		is_box.corner_radius_bottom_left = 5
		is_box.corner_radius_bottom_right = 5
		is_box.content_margin_left = 10
		is_box.content_margin_right = 10
		is_box.content_margin_top = 8
		is_box.content_margin_bottom = 8
		item_panel.add_theme_stylebox_override("panel", is_box)
		item_panel.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		parent.add_child(item_panel)

		var item_vbox = VBoxContainer.new()
		item_vbox.add_theme_constant_override("separation", 6)
		item_vbox.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		item_panel.add_child(item_vbox)

		var row1 = HBoxContainer.new()
		row1.add_theme_constant_override("separation", 8)
		item_vbox.add_child(row1)
		var id_lbl = create_label("步骤" + str(ii + 1) + "（ID:" + items_ref[ii].get("id", "") + "）", Vector2.ZERO, 12, Color(0.5, 0.55, 0.65, 1))
		row1.add_child(id_lbl)
		var spacer = Control.new()
		spacer.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		row1.add_child(spacer)
		var order_lbl = create_label("正确顺序:", Vector2.ZERO, 13, STYLE_TEXT_SECONDARY)
		row1.add_child(order_lbl)
		var order_spin = SpinBox.new()
		order_spin.min_value = 1
		order_spin.max_value = 50
		order_spin.value = items_ref[ii].get("order", ii + 1)
		order_spin.step = 1
		order_spin.custom_minimum_size = Vector2(80, 26)
		order_spin.value_changed.connect(func(v):
			DataManager.questions[q_type_key][q_index]["items"][ii]["order"] = int(v)
		)
		row1.add_child(order_spin)
		var del_item = create_button("删除步骤", Vector2.ZERO, Vector2(88, 26), STYLE_DANGER)
		del_item.add_theme_font_size_override("font_size", 11)
		del_item.pressed.connect(func(idx=ii):
			DataManager.questions[q_type_key][q_index]["items"].remove_at(idx)
			show_notification("已删除步骤，刷新页面生效", "warning", 1.5)
			get_tree().reload_current_scene()
		)
		row1.add_child(del_item)

		var row2 = HBoxContainer.new()
		row2.add_theme_constant_override("separation", 8)
		item_vbox.add_child(row2)
		var text_lbl = create_label("步骤名:", Vector2.ZERO, 13, STYLE_TEXT_SECONDARY)
		text_lbl.custom_minimum_size = Vector2(60, 0)
		row2.add_child(text_lbl)
		var text_in = LineEdit.new()
		text_in.text = items_ref[ii].get("text", "")
		text_in.placeholder_text = "步骤名称"
		text_in.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		text_in.add_theme_font_size_override("font_size", 13)
		text_in.text_changed.connect(func(txt): DataManager.questions[q_type_key][q_index]["items"][ii]["text"] = txt)
		row2.add_child(text_in)

		var row3 = HBoxContainer.new()
		row3.add_theme_constant_override("separation", 8)
		item_vbox.add_child(row3)
		var desc_lbl = create_label("描述:", Vector2.ZERO, 13, STYLE_TEXT_SECONDARY)
		desc_lbl.custom_minimum_size = Vector2(60, 0)
		row3.add_child(desc_lbl)
		var desc_in = LineEdit.new()
		desc_in.text = items_ref[ii].get("description", "")
		desc_in.placeholder_text = "步骤详细描述"
		desc_in.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		desc_in.add_theme_font_size_override("font_size", 13)
		desc_in.text_changed.connect(func(txt): DataManager.questions[q_type_key][q_index]["items"][ii]["description"] = txt)
		row3.add_child(desc_in)

	var add_item_btn = create_button("+ 新增步骤", Vector2.ZERO, Vector2(140, 32), Color(0.25, 0.45, 0.3, 1))
	add_item_btn.add_theme_font_size_override("font_size", 12)
	add_item_btn.pressed.connect(func():
		var items = DataManager.questions[q_type_key][q_index]["items"]
		var new_id = "step_" + str(randi())
		items.append({
			"id": new_id, "text": "新步骤",
			"order": items.size() + 1, "description": "请填写步骤描述"
		})
		show_notification("已新增步骤，请填写后刷新", "info", 1.5)
		get_tree().reload_current_scene()
	)
	parent.add_child(add_item_btn)

func _build_sampling_processing_content(parent: VBoxContainer, q_type_key: String, q_index: int) -> void:
	var q_ref = DataManager.questions[q_type_key][q_index]
	if q_ref.has("records"):
		var title = create_label("📂 异常抽样记录 - 「处理方式」即正确答案", Vector2.ZERO, 14, STYLE_ACCENT)
		parent.add_child(title)
		var records_ref = q_ref["records"]
		for ri in range(records_ref.size()):
			var rec_panel = PanelContainer.new()
			var rs = StyleBoxFlat.new()
			rs.bg_color = Color(0.14, 0.18, 0.24, 1)
			rs.corner_radius_top_left = 5
			rs.corner_radius_top_right = 5
			rs.corner_radius_bottom_left = 5
			rs.corner_radius_bottom_right = 5
			rs.content_margin_left = 10
			rs.content_margin_right = 10
			rs.content_margin_top = 8
			rs.content_margin_bottom = 8
			rec_panel.add_theme_stylebox_override("panel", rs)
			rec_panel.size_flags_horizontal = Control.SIZE_EXPAND_FILL
			parent.add_child(rec_panel)

			var rec_vbox = VBoxContainer.new()
			rec_vbox.add_theme_constant_override("separation", 6)
			rec_vbox.size_flags_horizontal = Control.SIZE_EXPAND_FILL
			rec_panel.add_child(rec_vbox)

			var row1 = HBoxContainer.new()
			row1.add_theme_constant_override("separation", 8)
			rec_vbox.add_child(row1)
			var id_lbl = create_label("记录" + str(ri + 1) + "（ID:" + records_ref[ri].get("id", "") + "）", Vector2.ZERO, 12, Color(0.5, 0.55, 0.65, 1))
			row1.add_child(id_lbl)
			var spacer = Control.new()
			spacer.size_flags_horizontal = Control.SIZE_EXPAND_FILL
			row1.add_child(spacer)
			var sev_lbl = create_label("严重度:", Vector2.ZERO, 13, STYLE_TEXT_SECONDARY)
			row1.add_child(sev_lbl)
			var sev_menu = OptionButton.new()
			var sev_options = ["none", "low", "medium", "high"]
			var sev_labels = ["无", "低", "中", "高"]
			for sl in sev_labels:
				sev_menu.add_item(sl)
			var cur_sev = records_ref[ri].get("severity", "low")
			sev_menu.select(max(0, sev_options.find(cur_sev)))
			sev_menu.add_theme_font_size_override("font_size", 12)
			sev_menu.custom_minimum_size = Vector2(80, 26)
			sev_menu.item_selected.connect(func(si):
				DataManager.questions[q_type_key][q_index]["records"][ri]["severity"] = sev_options[si]
			)
			row1.add_child(sev_menu)
			var count_lbl = create_label("数量:", Vector2.ZERO, 13, STYLE_TEXT_SECONDARY)
			row1.add_child(count_lbl)
			var count_spin = SpinBox.new()
			count_spin.min_value = 0
			count_spin.max_value = 9999
			count_spin.value = records_ref[ri].get("count", 0)
			count_spin.custom_minimum_size = Vector2(70, 26)
			count_spin.value_changed.connect(func(v):
				DataManager.questions[q_type_key][q_index]["records"][ri]["count"] = int(v)
			)
			row1.add_child(count_spin)
			var del_rec = create_button("删除", Vector2.ZERO, Vector2(64, 26), STYLE_DANGER)
			del_rec.add_theme_font_size_override("font_size", 11)
			del_rec.pressed.connect(func(idx=ri):
				DataManager.questions[q_type_key][q_index]["records"].remove_at(idx)
				show_notification("已删除记录，刷新生效", "warning", 1.5)
				get_tree().reload_current_scene()
			)
			row1.add_child(del_rec)

			var row2 = HBoxContainer.new()
			row2.add_theme_constant_override("separation", 8)
			rec_vbox.add_child(row2)
			var type_lbl = create_label("类型:", Vector2.ZERO, 13, STYLE_TEXT_SECONDARY)
			type_lbl.custom_minimum_size = Vector2(46, 0)
			row2.add_child(type_lbl)
			var type_in = LineEdit.new()
			type_in.text = records_ref[ri].get("type", "")
			type_in.placeholder_text = "异常类型，如：missing_signature"
			type_in.size_flags_horizontal = Control.SIZE_EXPAND_FILL
			type_in.add_theme_font_size_override("font_size", 13)
			type_in.text_changed.connect(func(txt): DataManager.questions[q_type_key][q_index]["records"][ri]["type"] = txt)
			row2.add_child(type_in)

			var row3 = HBoxContainer.new()
			row3.add_theme_constant_override("separation", 8)
			rec_vbox.add_child(row3)
			var desc_lbl = create_label("描述:", Vector2.ZERO, 13, STYLE_TEXT_SECONDARY)
			desc_lbl.custom_minimum_size = Vector2(46, 0)
			row3.add_child(desc_lbl)
			var desc_in = LineEdit.new()
			desc_in.text = records_ref[ri].get("description", "")
			desc_in.placeholder_text = "异常描述"
			desc_in.size_flags_horizontal = Control.SIZE_EXPAND_FILL
			desc_in.add_theme_font_size_override("font_size", 13)
			desc_in.text_changed.connect(func(txt): DataManager.questions[q_type_key][q_index]["records"][ri]["description"] = txt)
			row3.add_child(desc_in)

			var row4 = HBoxContainer.new()
			row4.add_theme_constant_override("separation", 8)
			rec_vbox.add_child(row4)
			var act_lbl = create_label("处理方式:", Vector2.ZERO, 13, STYLE_TEXT_SECONDARY)
			act_lbl.custom_minimum_size = Vector2(70, 0)
			row4.add_child(act_lbl)
			var act_in = LineEdit.new()
			act_in.text = records_ref[ri].get("action_required", "")
			act_in.placeholder_text = "正确答案处理方式 key"
			act_in.custom_minimum_size = Vector2(180, 0)
			act_in.add_theme_font_size_override("font_size", 13)
			act_in.text_changed.connect(func(txt): DataManager.questions[q_type_key][q_index]["records"][ri]["action_required"] = txt)
			row4.add_child(act_in)
			var actd_lbl = create_label("说明:", Vector2.ZERO, 13, STYLE_TEXT_SECONDARY)
			row4.add_child(actd_lbl)
			var actd_in = LineEdit.new()
			actd_in.text = records_ref[ri].get("action_description", "")
			actd_in.placeholder_text = "处理方式说明文字"
			actd_in.size_flags_horizontal = Control.SIZE_EXPAND_FILL
			actd_in.add_theme_font_size_override("font_size", 13)
			actd_in.text_changed.connect(func(txt): DataManager.questions[q_type_key][q_index]["records"][ri]["action_description"] = txt)
			row4.add_child(actd_in)

		var add_rec_btn = create_button("+ 新增抽样记录", Vector2.ZERO, Vector2(160, 32), Color(0.25, 0.45, 0.3, 1))
		add_rec_btn.add_theme_font_size_override("font_size", 12)
		add_rec_btn.pressed.connect(func():
			var recs = DataManager.questions[q_type_key][q_index]["records"]
			recs.append({
				"id": "rec_" + str(randi()), "type": "new_issue",
				"description": "请输入异常描述", "severity": "low",
				"count": 1, "action_required": "no_action",
				"action_description": "请输入处理方式说明"
			})
			show_notification("已新增记录，请填写后刷新", "info", 1.5)
			get_tree().reload_current_scene()
		)
		parent.add_child(add_rec_btn)

	elif q_ref.has("scenarios"):
		var title = create_label("📊 抽样方法场景 - 每个场景选择「正确抽样方法」", Vector2.ZERO, 14, STYLE_ACCENT)
		parent.add_child(title)
		var scenarios_ref = q_ref["scenarios"]
		for si in range(scenarios_ref.size()):
			var sc_panel = PanelContainer.new()
			var ss = StyleBoxFlat.new()
			ss.bg_color = Color(0.14, 0.20, 0.22, 1)
			ss.corner_radius_top_left = 5
			ss.corner_radius_top_right = 5
			ss.corner_radius_bottom_left = 5
			ss.corner_radius_bottom_right = 5
			ss.content_margin_left = 10
			ss.content_margin_right = 10
			ss.content_margin_top = 8
			ss.content_margin_bottom = 8
			sc_panel.add_theme_stylebox_override("panel", ss)
			sc_panel.size_flags_horizontal = Control.SIZE_EXPAND_FILL
			parent.add_child(sc_panel)

			var sc_vbox = VBoxContainer.new()
			sc_vbox.add_theme_constant_override("separation", 6)
			sc_vbox.size_flags_horizontal = Control.SIZE_EXPAND_FILL
			sc_panel.add_child(sc_vbox)

			var row1 = HBoxContainer.new()
			row1.add_theme_constant_override("separation", 8)
			sc_vbox.add_child(row1)
			var id_lbl = create_label("场景" + str(si + 1) + "（ID:" + scenarios_ref[si].get("id", "") + "）", Vector2.ZERO, 12, Color(0.5, 0.55, 0.65, 1))
			row1.add_child(id_lbl)
			var spacer = Control.new()
			spacer.size_flags_horizontal = Control.SIZE_EXPAND_FILL
			row1.add_child(spacer)
			var del_sc = create_button("删除场景", Vector2.ZERO, Vector2(88, 26), STYLE_DANGER)
			del_sc.add_theme_font_size_override("font_size", 11)
			del_sc.pressed.connect(func(idx=si):
				DataManager.questions[q_type_key][q_index]["scenarios"].remove_at(idx)
				show_notification("已删除场景，刷新生效", "warning", 1.5)
				get_tree().reload_current_scene()
			)
			row1.add_child(del_sc)

			var row2 = HBoxContainer.new()
			row2.add_theme_constant_override("separation", 8)
			sc_vbox.add_child(row2)
			var name_lbl = create_label("场景名:", Vector2.ZERO, 13, STYLE_TEXT_SECONDARY)
			name_lbl.custom_minimum_size = Vector2(60, 0)
			row2.add_child(name_lbl)
			var name_in = LineEdit.new()
			name_in.text = scenarios_ref[si].get("name", "")
			name_in.size_flags_horizontal = Control.SIZE_EXPAND_FILL
			name_in.add_theme_font_size_override("font_size", 13)
			name_in.text_changed.connect(func(txt): DataManager.questions[q_type_key][q_index]["scenarios"][si]["name"] = txt)
			row2.add_child(name_in)
			var method_lbl = create_label("正确方法:", Vector2.ZERO, 13, STYLE_TEXT_SECONDARY)
			row2.add_child(method_lbl)
			var method_in = LineEdit.new()
			method_in.text = scenarios_ref[si].get("sampling_method", "")
			method_in.placeholder_text = "如：random/judgmental"
			method_in.custom_minimum_size = Vector2(140, 0)
			method_in.add_theme_font_size_override("font_size", 13)
			method_in.text_changed.connect(func(txt): DataManager.questions[q_type_key][q_index]["scenarios"][si]["sampling_method"] = txt)
			row2.add_child(method_in)
			var mname_lbl = create_label("方法名:", Vector2.ZERO, 13, STYLE_TEXT_SECONDARY)
			row2.add_child(mname_lbl)
			var mname_in = LineEdit.new()
			mname_in.text = scenarios_ref[si].get("method_name", "")
			mname_in.placeholder_text = "方法显示名称"
			mname_in.custom_minimum_size = Vector2(120, 0)
			mname_in.add_theme_font_size_override("font_size", 13)
			mname_in.text_changed.connect(func(txt): DataManager.questions[q_type_key][q_index]["scenarios"][si]["method_name"] = txt)
			row2.add_child(mname_in)

			var row3 = HBoxContainer.new()
			row3.add_theme_constant_override("separation", 8)
			sc_vbox.add_child(row3)
			var desc_lbl = create_label("描述:", Vector2.ZERO, 13, STYLE_TEXT_SECONDARY)
			desc_lbl.custom_minimum_size = Vector2(60, 0)
			row3.add_child(desc_lbl)
			var desc_in = LineEdit.new()
			desc_in.text = scenarios_ref[si].get("description", "")
			desc_in.size_flags_horizontal = Control.SIZE_EXPAND_FILL
			desc_in.add_theme_font_size_override("font_size", 13)
			desc_in.text_changed.connect(func(txt): DataManager.questions[q_type_key][q_index]["scenarios"][si]["description"] = txt)
			row3.add_child(desc_in)

			var row4 = HBoxContainer.new()
			row4.add_theme_constant_override("separation", 8)
			sc_vbox.add_child(row4)
			var reason_lbl = create_label("原因:", Vector2.ZERO, 13, STYLE_TEXT_SECONDARY)
			reason_lbl.custom_minimum_size = Vector2(60, 0)
			row4.add_child(reason_lbl)
			var reason_in = LineEdit.new()
			reason_in.text = scenarios_ref[si].get("reason", "")
			reason_in.size_flags_horizontal = Control.SIZE_EXPAND_FILL
			reason_in.add_theme_font_size_override("font_size", 13)
			reason_in.text_changed.connect(func(txt): DataManager.questions[q_type_key][q_index]["scenarios"][si]["reason"] = txt)
			row4.add_child(reason_in)

			var opts_lbl = create_label("抽样方法候选选项：", Vector2.ZERO, 13, STYLE_ACCENT)
			sc_vbox.add_child(opts_lbl)
			var sc_options = scenarios_ref[si].get("options", [])
			for oi in range(sc_options.size()):
				var o_row = HBoxContainer.new()
				o_row.add_theme_constant_override("separation", 8)
				sc_vbox.add_child(o_row)
				var corr_chk = CheckBox.new()
				corr_chk.text = "✓正确"
				corr_chk.button_pressed = sc_options[oi].get("correct", false)
				corr_chk.add_theme_font_size_override("font_size", 12)
				corr_chk.pressed.connect(func(pressed, idx=oi):
					DataManager.questions[q_type_key][q_index]["scenarios"][si]["options"][idx]["correct"] = pressed
				)
				o_row.add_child(corr_chk)
				var m_in = LineEdit.new()
				m_in.text = sc_options[oi].get("method", "")
				m_in.placeholder_text = "method key"
				m_in.custom_minimum_size = Vector2(110, 24)
				m_in.add_theme_font_size_override("font_size", 12)
				m_in.text_changed.connect(func(txt, idx=oi): DataManager.questions[q_type_key][q_index]["scenarios"][si]["options"][idx]["method"] = txt)
				o_row.add_child(m_in)
				var n_in = LineEdit.new()
				n_in.text = sc_options[oi].get("name", "")
				n_in.placeholder_text = "显示名"
				n_in.custom_minimum_size = Vector2(110, 24)
				n_in.add_theme_font_size_override("font_size", 12)
				n_in.text_changed.connect(func(txt, idx=oi): DataManager.questions[q_type_key][q_index]["scenarios"][si]["options"][idx]["name"] = txt)
				o_row.add_child(n_in)
				var f_in = LineEdit.new()
				f_in.text = sc_options[oi].get("feedback", "")
				f_in.placeholder_text = "选择反馈"
				f_in.size_flags_horizontal = Control.SIZE_EXPAND_FILL
				f_in.add_theme_font_size_override("font_size", 12)
				f_in.text_changed.connect(func(txt, idx=oi): DataManager.questions[q_type_key][q_index]["scenarios"][si]["options"][idx]["feedback"] = txt)
				o_row.add_child(f_in)
				var del_opt2 = create_button("删", Vector2.ZERO, Vector2(40, 24), STYLE_DANGER)
				del_opt2.add_theme_font_size_override("font_size", 11)
				del_opt2.pressed.connect(func(idx=oi):
					DataManager.questions[q_type_key][q_index]["scenarios"][si]["options"].remove_at(idx)
					show_notification("已删除方法选项，刷新生效", "warning", 1.5)
					get_tree().reload_current_scene()
				)
				o_row.add_child(del_opt2)

			var add_sc_opt_btn = create_button("+ 新增候选抽样方法", Vector2.ZERO, Vector2(180, 28), Color(0.25, 0.45, 0.3, 1))
			add_sc_opt_btn.add_theme_font_size_override("font_size", 11)
			add_sc_opt_btn.pressed.connect(func():
				if not DataManager.questions[q_type_key][q_index]["scenarios"][si].has("options"):
					DataManager.questions[q_type_key][q_index]["scenarios"][si]["options"] = []
				DataManager.questions[q_type_key][q_index]["scenarios"][si]["options"].append({
					"id": "m_" + str(randi()), "method": "new_method",
					"name": "新方法", "correct": false, "feedback": "请输入反馈"
				})
				show_notification("已新增候选方法，刷新生效", "info", 1.5)
				get_tree().reload_current_scene()
			)
			sc_vbox.add_child(add_sc_opt_btn)

		var add_sc_btn = create_button("+ 新增抽样场景", Vector2.ZERO, Vector2(160, 32), Color(0.25, 0.45, 0.3, 1))
		add_sc_btn.add_theme_font_size_override("font_size", 12)
		add_sc_btn.pressed.connect(func():
			var scs = DataManager.questions[q_type_key][q_index]["scenarios"]
			scs.append({
				"id": "sc_" + str(randi()), "name": "新场景",
				"description": "请输入场景描述", "sampling_method": "random",
				"method_name": "随机抽样", "reason": "请输入正确原因",
				"options": []
			})
			show_notification("已新增场景，请填写后刷新", "info", 1.5)
			get_tree().reload_current_scene()
		)
		parent.add_child(add_sc_btn)

func _build_editable_evidence_category_card(cat_index: int) -> PanelContainer:
	var cat = DataManager.materials["evidence_categories"][cat_index]
	var card = PanelContainer.new()
	var cs = StyleBoxFlat.new()
	cs.bg_color = Color(0.18, 0.24, 0.20, 1)
	cs.corner_radius_top_left = 6
	cs.corner_radius_top_right = 6
	cs.corner_radius_bottom_left = 6
	cs.corner_radius_bottom_right = 6
	cs.content_margin_left = 12
	cs.content_margin_right = 12
	cs.content_margin_top = 8
	cs.content_margin_bottom = 8
	card.add_theme_stylebox_override("panel", cs)
	card.size_flags_horizontal = Control.SIZE_EXPAND_FILL

	var hbox = HBoxContainer.new()
	hbox.add_theme_constant_override("separation", 10)
	card.add_child(hbox)

	var id_lbl = create_label(cat.get("id", ""), Vector2.ZERO, 12, Color(0.45, 0.5, 0.58, 1))
	id_lbl.custom_minimum_size = Vector2(70, 0)
	id_lbl.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	hbox.add_child(id_lbl)

	var name_input = LineEdit.new()
	name_input.text = cat.get("name", "")
	name_input.custom_minimum_size = Vector2(150, 28)
	name_input.add_theme_font_size_override("font_size", 13)
	name_input.text_changed.connect(func(txt): DataManager.materials["evidence_categories"][cat_index]["name"] = txt)
	hbox.add_child(name_input)

	var desc_input = LineEdit.new()
	desc_input.text = cat.get("description", "")
	desc_input.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	desc_input.add_theme_font_size_override("font_size", 13)
	desc_input.text_changed.connect(func(txt): DataManager.materials["evidence_categories"][cat_index]["description"] = txt)
	hbox.add_child(desc_input)

	var del_btn = create_button("删除", Vector2.ZERO, Vector2(60, 28), STYLE_DANGER)
	del_btn.add_theme_font_size_override("font_size", 12)
	del_btn.pressed.connect(func():
		DataManager.materials["evidence_categories"].remove_at(cat_index)
		show_notification("已删除分类，点击保存生效", "warning", 1.5)
		get_tree().reload_current_scene()
	)
	hbox.add_child(del_btn)

	return card

func _build_editable_template_card(tpl_index: int) -> PanelContainer:
	var tpl = DataManager.materials["templates"][tpl_index]
	var card = PanelContainer.new()
	var cs = StyleBoxFlat.new()
	cs.bg_color = Color(0.18, 0.20, 0.28, 1)
	cs.corner_radius_top_left = 6
	cs.corner_radius_top_right = 6
	cs.corner_radius_bottom_left = 6
	cs.corner_radius_bottom_right = 6
	cs.content_margin_left = 12
	cs.content_margin_right = 12
	cs.content_margin_top = 8
	cs.content_margin_bottom = 8
	card.add_theme_stylebox_override("panel", cs)
	card.size_flags_horizontal = Control.SIZE_EXPAND_FILL

	var hbox = HBoxContainer.new()
	hbox.add_theme_constant_override("separation", 10)
	card.add_child(hbox)

	var id_lbl = create_label(tpl.get("id", ""), Vector2.ZERO, 12, Color(0.45, 0.5, 0.58, 1))
	id_lbl.custom_minimum_size = Vector2(70, 0)
	id_lbl.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	hbox.add_child(id_lbl)

	var name_input = LineEdit.new()
	name_input.text = tpl.get("name", "")
	name_input.custom_minimum_size = Vector2(200, 28)
	name_input.add_theme_font_size_override("font_size", 13)
	name_input.text_changed.connect(func(txt): DataManager.materials["templates"][tpl_index]["name"] = txt)
	hbox.add_child(name_input)

	var desc_input = LineEdit.new()
	desc_input.text = tpl.get("description", "")
	desc_input.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	desc_input.add_theme_font_size_override("font_size", 13)
	desc_input.text_changed.connect(func(txt): DataManager.materials["templates"][tpl_index]["description"] = txt)
	hbox.add_child(desc_input)

	var del_btn = create_button("删除", Vector2.ZERO, Vector2(60, 28), STYLE_DANGER)
	del_btn.add_theme_font_size_override("font_size", 12)
	del_btn.pressed.connect(func():
		DataManager.materials["templates"].remove_at(tpl_index)
		show_notification("已删除模板，点击保存生效", "warning", 1.5)
		get_tree().reload_current_scene()
	)
	hbox.add_child(del_btn)

	return card

func _build_rewards_tab() -> VBoxContainer:
	var vbox = VBoxContainer.new()
	vbox.anchor_right = 1.0
	vbox.anchor_bottom = 1.0
	vbox.add_theme_constant_override("separation", 12)
	var mc = create_margin_container({"left": 8, "right": 8, "top": 8, "bottom": 8})
	mc.add_child(vbox)

	var header_hbox = HBoxContainer.new()
	header_hbox.add_theme_constant_override("separation", 12)
	vbox.add_child(header_hbox)
	var header = create_label("徽章奖励设置 - 可直接编辑后保存", Vector2.ZERO, 15, STYLE_TEXT_SECONDARY)
	header_hbox.add_child(header)
	var spacer_h = Control.new()
	spacer_h.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	header_hbox.add_child(spacer_h)
	var add_reward_btn = create_button("+ 新增奖励", Vector2.ZERO, Vector2(140, 36), Color(0.25, 0.45, 0.3, 1))
	add_reward_btn.add_theme_font_size_override("font_size", 13)
	add_reward_btn.pressed.connect(func():
		DataManager.rewards.append({
			"id": "reward_" + str(randi()),
			"icon": "🏅",
			"name": "新奖励",
			"description": "请输入奖励描述",
			"condition": "请输入触发条件（例如 accuracy>=90）"
		})
		show_notification("已新增奖励，请填写后保存", "info", 1.5)
		get_tree().reload_current_scene()
	)
	header_hbox.add_child(add_reward_btn)

	var scroll = ScrollContainer.new()
	scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	vbox.add_child(scroll)

	var rewards_vbox = VBoxContainer.new()
	rewards_vbox.add_theme_constant_override("separation", 10)
	rewards_vbox.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	scroll.add_child(rewards_vbox)

	for ri in range(DataManager.rewards.size()):
		var card = _build_editable_reward_card(ri)
		rewards_vbox.add_child(card)

	return mc

func _build_editable_reward_card(reward_index: int) -> PanelContainer:
	var reward = DataManager.rewards[reward_index]
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
	hbox.add_theme_constant_override("separation", 14)
	card.add_child(hbox)

	var icon_vbox = VBoxContainer.new()
	icon_vbox.add_theme_constant_override("separation", 6)
	hbox.add_child(icon_vbox)
	var icon_lbl = create_label(reward.get("icon", "🎖"), Vector2.ZERO, 36, STYLE_WARNING)
	icon_lbl.custom_minimum_size = Vector2(60, 0)
	icon_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	icon_lbl.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	icon_vbox.add_child(icon_lbl)
	var icon_input = LineEdit.new()
	icon_input.text = reward.get("icon", "🎖")
	icon_input.custom_minimum_size = Vector2(60, 28)
	icon_input.placeholder_text = "emoji"
	icon_input.alignment = HORIZONTAL_ALIGNMENT_CENTER
	icon_input.add_theme_font_size_override("font_size", 14)
	icon_input.text_changed.connect(func(txt):
		DataManager.rewards[reward_index]["icon"] = txt
		if icon_lbl:
			icon_lbl.text = txt
	)
	icon_vbox.add_child(icon_input)

	var fields_vbox = VBoxContainer.new()
	fields_vbox.add_theme_constant_override("separation", 8)
	fields_vbox.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	hbox.add_child(fields_vbox)

	var id_row = HBoxContainer.new()
	id_row.add_theme_constant_override("separation", 8)
	fields_vbox.add_child(id_row)
	var id_lbl = create_label("ID: " + reward.get("id", ""), Vector2.ZERO, 12, Color(0.45, 0.5, 0.58, 1))
	id_row.add_child(id_lbl)
	var spacer_id = Control.new()
	spacer_id.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	id_row.add_child(spacer_id)

	var del_btn = create_button("删除奖励", Vector2.ZERO, Vector2(100, 30), STYLE_DANGER)
	del_btn.add_theme_font_size_override("font_size", 12)
	del_btn.pressed.connect(func():
		DataManager.rewards.remove_at(reward_index)
		show_notification("已删除奖励，点击保存生效", "warning", 1.5)
		get_tree().reload_current_scene()
	)
	id_row.add_child(del_btn)

	var name_row = HBoxContainer.new()
	name_row.add_theme_constant_override("separation", 10)
	fields_vbox.add_child(name_row)
	var name_lbl = create_label("名称:", Vector2.ZERO, 14, STYLE_TEXT_SECONDARY)
	name_lbl.custom_minimum_size = Vector2(60, 0)
	name_lbl.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	name_row.add_child(name_lbl)
	var name_input = LineEdit.new()
	name_input.text = reward.get("name", "")
	name_input.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	name_input.add_theme_font_size_override("font_size", 15)
	name_input.text_changed.connect(func(txt): DataManager.rewards[reward_index]["name"] = txt)
	name_row.add_child(name_input)

	var desc_row = HBoxContainer.new()
	desc_row.add_theme_constant_override("separation", 10)
	fields_vbox.add_child(desc_row)
	var desc_lbl = create_label("描述:", Vector2.ZERO, 14, STYLE_TEXT_SECONDARY)
	desc_lbl.custom_minimum_size = Vector2(60, 0)
	desc_lbl.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	desc_row.add_child(desc_lbl)
	var desc_input = LineEdit.new()
	desc_input.text = reward.get("description", "")
	desc_input.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	desc_input.add_theme_font_size_override("font_size", 13)
	desc_input.text_changed.connect(func(txt): DataManager.rewards[reward_index]["description"] = txt)
	desc_row.add_child(desc_input)

	var cond_row = HBoxContainer.new()
	cond_row.add_theme_constant_override("separation", 10)
	fields_vbox.add_child(cond_row)
	var cond_lbl = create_label("条件:", Vector2.ZERO, 14, STYLE_TEXT_SECONDARY)
	cond_lbl.custom_minimum_size = Vector2(60, 0)
	cond_lbl.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	cond_row.add_child(cond_lbl)
	var cond_input = LineEdit.new()
	cond_input.text = reward.get("condition", "")
	cond_input.placeholder_text = "如: accuracy>=80, accuracy>=90 等"
	cond_input.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	cond_input.add_theme_font_size_override("font_size", 13)
	cond_input.text_changed.connect(func(txt): DataManager.rewards[reward_index]["condition"] = txt)
	cond_row.add_child(cond_input)

	return card

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
