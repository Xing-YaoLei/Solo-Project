extends "res://scripts/games/BaseGame.gd"

var current_answers: Dictionary = {}
var content_container: VBoxContainer
var timer_label: Label
var score_label: Label
var progress_label: Label
var sub_question_index: int = 0

func _ready() -> void:
	super._ready()
	initialize_game("sampling_processing", GameManager.current_level)

func _setup_ui() -> void:
	_clear_children_except_background()
	var top_bar = HBoxContainer.new()
	top_bar.anchor_right = 1.0
	top_bar.position = Vector2(40, 20)
	top_bar.size = Vector2(get_viewport_rect().size.x - 80, 50)
	top_bar.add_theme_constant_override("separation", 30)
	add_child(top_bar)

	var back_btn = create_button("← 返回", Vector2.ZERO, Vector2(100, 40), Color(0.4, 0.45, 0.55, 1))
	back_btn.pressed.connect(go_back)
	top_bar.add_child(back_btn)

	var mode_text = "📋 正式训练" if GameManager.current_mode == "formal" else "🎯 自由练习"
	var mode_label = create_label(mode_text, Vector2.ZERO, 18, STYLE_ACCENT)
	mode_label.size = Vector2(180, 40)
	mode_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	top_bar.add_child(mode_label)

	var spacer = Control.new()
	spacer.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	top_bar.add_child(spacer)

	progress_label = create_label("", Vector2.ZERO, 16, STYLE_TEXT_SECONDARY)
	progress_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	top_bar.add_child(progress_label)

	score_label = create_label("", Vector2.ZERO, 16, STYLE_SUCCESS)
	score_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	top_bar.add_child(score_label)

	timer_label = create_label("", Vector2.ZERO, 18, STYLE_WARNING)
	timer_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	top_bar.add_child(timer_label)

	var content_panel = create_panel(Vector2(40, 90), Vector2(get_viewport_rect().size.x - 80, get_viewport_rect().size.y - 160), STYLE_CARD_BG)
	add_child(content_panel)

	var content_mc = create_margin_container({"left": 24, "right": 24, "top": 20, "bottom": 20})
	content_panel.add_child(content_mc)

	content_container = VBoxContainer.new()
	content_container.anchor_right = 1.0
	content_container.anchor_bottom = 1.0
	content_container.add_theme_constant_override("separation", 12)
	content_mc.add_child(content_container)

	_update_info_labels()

func _clear_children_except_background() -> void:
	var children = get_children()
	for child in children:
		if child is ColorRect:
			continue
		remove_child(child)
		child.queue_free()

func _update_info_labels() -> void:
	progress_label.text = "进度：%d / %d" % [current_question_index + 1, len(questions)]
	score_label.text = "得分：%d / %d" % [score, max_score]
	if timer_active:
		timer_label.text = "⏱ " + format_time(int(time_remaining))
		if time_remaining < 60:
			timer_label.add_theme_color_override("font_color", STYLE_DANGER)
		else:
			timer_label.add_theme_color_override("font_color", STYLE_WARNING)
	else:
		timer_label.text = "练习模式"
		timer_label.add_theme_color_override("font_color", STYLE_SUCCESS)

func _process(delta: float) -> void:
	super._process(delta)
	if timer_label:
		_update_info_labels()

func _render_question(question: Dictionary) -> void:
	current_answers.clear()
	sub_question_index = 0
	for child in content_container.get_children():
		content_container.remove_child(child)
		child.queue_free()

	var title_label = create_label("🔍 " + question.get("title", ""), Vector2.ZERO, 24, STYLE_TEXT_PRIMARY)
	title_label.add_theme_color_override("font_color", STYLE_ACCENT)
	content_container.add_child(title_label)

	var scenario_label = create_label("【场景】" + question.get("scenario", ""), Vector2.ZERO, 15, STYLE_TEXT_SECONDARY)
	scenario_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	content_container.add_child(scenario_label)

	if question.has("sample_size") or question.has("population_size"):
		var info_hbox = HBoxContainer.new()
		info_hbox.add_theme_constant_override("separation", 24)
		content_container.add_child(info_hbox)
		if question.has("sample_size"):
			var ss_label = create_label("样本量：%d" % question["sample_size"], Vector2.ZERO, 14, STYLE_ACCENT)
			info_hbox.add_child(ss_label)
		if question.has("population_size"):
			var ps_label = create_label("总体规模：%d" % question["population_size"], Vector2.ZERO, 14, STYLE_TEXT_SECONDARY)
			info_hbox.add_child(ps_label)

	var desc_label = create_label(question.get("description", ""), Vector2.ZERO, 16, STYLE_TEXT_PRIMARY)
	desc_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	content_container.add_child(desc_label)

	var sep = HSeparator.new()
	sep.modulate = Color(0.35, 0.4, 0.48, 1)
	content_container.add_child(sep)

	var scroll = ScrollContainer.new()
	scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	content_container.add_child(scroll)

	var main_vbox = VBoxContainer.new()
	main_vbox.add_theme_constant_override("separation", 12)
	main_vbox.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	scroll.add_child(main_vbox)

	if question.has("records"):
		_render_records_processing(question, main_vbox)
	elif question.has("scenarios"):
		_render_method_selection(question, main_vbox)

	if GameManager.current_mode == "practice" and question.has("hint") and question["hint"] != "":
		var hint_sep = HSeparator.new()
		hint_sep.modulate = Color(0.35, 0.4, 0.48, 1)
		content_container.add_child(hint_sep)
		var hint_lbl = create_label("💡 提示：" + question["hint"], Vector2.ZERO, 14, STYLE_WARNING)
		hint_lbl.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		content_container.add_child(hint_lbl)

	var bottom_bar = HBoxContainer.new()
	bottom_bar.add_theme_constant_override("separation", 16)
	bottom_bar.alignment = BoxContainer.ALIGNMENT_END
	content_container.add_child(bottom_bar)

	var info_label = create_label("请为每条记录选择合适的处理方式", Vector2.ZERO, 14, STYLE_TEXT_SECONDARY)
	info_label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	info_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	bottom_bar.add_child(info_label)

	var submit_btn = create_button("确认提交", Vector2.ZERO, Vector2(160, 44), STYLE_ACCENT)
	submit_btn.pressed.connect(_on_submit)
	bottom_bar.add_child(submit_btn)

func _render_records_processing(question: Dictionary, parent: VBoxContainer) -> void:
	var records = question.get("records", [])
	for rec in records:
		if rec.get("type") == "normal":
			var normal_card = _build_normal_record_card(rec)
			parent.add_child(normal_card)
			current_answers[rec.get("id", "")] = rec.get("action_required", "no_action")
			continue
		var rec_card = _build_record_card(rec)
		parent.add_child(rec_card)

func _build_normal_record_card(rec: Dictionary) -> PanelContainer:
	var card = PanelContainer.new()
	var style = StyleBoxFlat.new()
	style.bg_color = Color(0.18, 0.3, 0.22, 1)
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
	hbox.anchor_right = 1.0
	hbox.anchor_bottom = 1.0
	hbox.add_theme_constant_override("separation", 14)
	card.add_child(hbox)

	var icon_label = create_label("✅", Vector2.ZERO, 22, STYLE_SUCCESS)
	hbox.add_child(icon_label)

	var vbox_center = VBoxContainer.new()
	vbox_center.add_theme_constant_override("separation", 3)
	vbox_center.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	hbox.add_child(vbox_center)

	var title = create_label("%s （%d份）" % [rec.get("description", ""), rec.get("count", 0)], Vector2.ZERO, 15, STYLE_TEXT_PRIMARY)
	vbox_center.add_child(title)

	var auto_label = create_label("已自动标记：" + rec.get("action_description", ""), Vector2.ZERO, 13, STYLE_SUCCESS)
	vbox_center.add_child(auto_label)

	return card

func _build_record_card(rec: Dictionary) -> PanelContainer:
	var card = PanelContainer.new()
	var style = StyleBoxFlat.new()
	var sev_color = Color(0.3, 0.25, 0.18, 1)
	match rec.get("severity", "low"):
		"high": sev_color = Color(0.32, 0.18, 0.18, 1)
		"medium": sev_color = Color(0.32, 0.28, 0.15, 1)
		"low": sev_color = Color(0.18, 0.28, 0.32, 1)
	style.bg_color = sev_color
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
	card.name = "rec_" + rec.get("id", "")

	var hbox = HBoxContainer.new()
	hbox.anchor_right = 1.0
	hbox.anchor_bottom = 1.0
	hbox.add_theme_constant_override("separation", 14)
	card.add_child(hbox)

	var sev_icon = "🔴"
	match rec.get("severity", "low"):
		"high": sev_icon = "🔴"
		"medium": sev_icon = "🟡"
		"low": sev_icon = "🔵"
	var icon_label = create_label(sev_icon, Vector2.ZERO, 22, STYLE_WARNING)
	hbox.add_child(icon_label)

	var vbox_center = VBoxContainer.new()
	vbox_center.add_theme_constant_override("separation", 4)
	vbox_center.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	hbox.add_child(vbox_center)

	var desc_text = create_label("%s （%d份）" % [rec.get("description", ""), rec.get("count", 0)], Vector2.ZERO, 15, STYLE_TEXT_PRIMARY)
	vbox_center.add_child(desc_text)

	var sev_text = "严重程度："
	match rec.get("severity", "low"):
		"high": sev_text += "高"
		"medium": sev_text += "中"
		"low": sev_text += "低"
	var sev_label = create_label(sev_text, Vector2.ZERO, 13, STYLE_TEXT_SECONDARY)
	vbox_center.add_child(sev_label)

	var option_btn = create_button("▼ 选择处理方式", Vector2.ZERO, Vector2(180, 40), Color(0.35, 0.4, 0.48, 1))
	option_btn.name = "action_btn_" + rec.get("id", "")
	option_btn.add_theme_font_size_override("font_size", 13)
	var actions = [
		{"id": "expand_sample", "name": "扩大抽样范围并补充取证", "severity": "high"},
		{"id": "verify_explanation", "name": "核实业务部门解释并记录", "severity": "medium"},
		{"id": "supplement_materials", "name": "要求补充缺失材料", "severity": "low"},
		{"id": "no_action", "name": "无需处理，记录归档", "severity": "none"}
	]
	var popup = PopupMenu.new()
	popup.name = "popup_" + rec.get("id", "")
	for act in actions:
		popup.add_item(act["name"])
	var action_handler = func(index: int):
		var selected = actions[index]
		current_answers[rec.get("id", "")] = selected["id"]
		option_btn.text = "✓ " + selected["name"]
		option_btn.add_theme_color_override("font_color", STYLE_SUCCESS)
	popup.index_pressed.connect(action_handler)
	option_btn.pressed.connect(func():
		popup.position = option_btn.get_global_position() + Vector2(0, option_btn.size.y)
		popup.size = Vector2(option_btn.size.x + 60, 0)
		popup.popup()
	)
	hbox.add_child(option_btn)
	card.add_child(popup)

	return card

func _render_method_selection(question: Dictionary, parent: VBoxContainer) -> void:
	var scenarios = question.get("scenarios", [])
	for sc in scenarios:
		var sc_card = _build_scenario_card(sc)
		parent.add_child(sc_card)

func _build_scenario_card(sc: Dictionary) -> PanelContainer:
	var card = PanelContainer.new()
	var style = StyleBoxFlat.new()
	style.bg_color = Color(0.22, 0.26, 0.34, 1)
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

	var vbox = VBoxContainer.new()
	vbox.anchor_right = 1.0
	vbox.anchor_bottom = 1.0
	vbox.add_theme_constant_override("separation", 8)
	card.add_child(vbox)

	var sc_title = create_label("📌 场景：" + sc.get("name", ""), Vector2.ZERO, 16, STYLE_ACCENT)
	vbox.add_child(sc_title)

	var sc_desc = create_label(sc.get("description", ""), Vector2.ZERO, 14, STYLE_TEXT_SECONDARY)
	sc_desc.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	vbox.add_child(sc_desc)

	var options_grid = HBoxContainer.new()
	options_grid.add_theme_constant_override("separation", 10)
	vbox.add_child(options_grid)

	var options = sc.get("options", [])
	var selected_btn_ref: Button = null
	for opt in options:
		var opt_btn = create_button(opt.get("name", ""), Vector2.ZERO, Vector2(140, 40), Color(0.35, 0.4, 0.48, 1))
		opt_btn.add_theme_font_size_override("font_size", 13)
		opt_btn.toggle_mode = true
		opt_btn.pressed.connect(func():
			if selected_btn_ref and selected_btn_ref != opt_btn:
				selected_btn_ref.button_pressed = false
				selected_btn_ref.add_theme_stylebox_override("normal", _get_normal_style(Color(0.35, 0.4, 0.48, 1)))
			selected_btn_ref = opt_btn
			current_answers[sc.get("id", "")] = opt.get("method", "")
			if opt_btn.button_pressed:
				var sel_style = _get_normal_style(STYLE_ACCENT.darkened(0.2))
				opt_btn.add_theme_stylebox_override("normal", sel_style)
			else:
				opt_btn.add_theme_stylebox_override("normal", _get_normal_style(Color(0.35, 0.4, 0.48, 1)))
		)
		options_grid.add_child(opt_btn)

	return card

func _get_normal_style(color: Color) -> StyleBoxFlat:
	var s = StyleBoxFlat.new()
	s.bg_color = color
	s.corner_radius_top_left = 8
	s.corner_radius_top_right = 8
	s.corner_radius_bottom_left = 8
	s.corner_radius_bottom_right = 8
	s.content_margin_left = 16
	s.content_margin_right = 16
	s.content_margin_top = 8
	s.content_margin_bottom = 8
	return s

func _on_submit() -> void:
	var question = current_question
	var all_answered = true
	if question.has("records"):
		for rec in question.get("records", []):
			if rec.get("type") != "normal" and not current_answers.has(rec.get("id", "")):
				all_answered = false
				break
	elif question.has("scenarios"):
		for sc in question.get("scenarios", []):
			if not current_answers.has(sc.get("id", "")):
				all_answered = false
				break
	if not all_answered:
		show_notification("请为所有项目选择处理方式", "warning", 2.0)
		return
	var correct_count = 0
	var total_items = 0
	if question.has("records"):
		for rec in question.get("records", []):
			if rec.get("type") == "normal":
				continue
			total_items += 1
			var user_act = current_answers.get(rec.get("id", ""), "")
			var correct_act = rec.get("action_required", "")
			if user_act == correct_act:
				correct_count += 1
			else:
				show_notification("%s：建议处理方式为「%s」" % [rec.get("description", ""), rec.get("action_description", "")], "warning", 3.0)
	elif question.has("scenarios"):
		for sc in question.get("scenarios", []):
			total_items += 1
			var user_method = current_answers.get(sc.get("id", ""), "")
			var correct_method = sc.get("sampling_method", "")
			if user_method == correct_method:
				correct_count += 1
			else:
				show_notification("%s：推荐方法为「%s」——%s" % [sc.get("name", ""), sc.get("method_name", ""), sc.get("reason", "")], "warning", 4.0)
	var total_score = question.get("score", 0)
	var all_correct = correct_count == total_items
	var partial_score = 0
	if total_items > 0:
		partial_score = int(total_score * float(correct_count) / float(total_items))
	_submit_answer(current_answers.duplicate(), all_correct, partial_score)

func _get_correct_answer() -> Dictionary:
	var correct: Dictionary = {}
	var question = current_question
	if question.has("records"):
		for rec in question.get("records", []):
			correct[rec.get("id", "")] = rec.get("action_required", "")
		elif question.has("scenarios"):
			for sc in question.get("scenarios", []):
				correct[sc.get("id", "")] = sc.get("sampling_method", "")
	return correct
