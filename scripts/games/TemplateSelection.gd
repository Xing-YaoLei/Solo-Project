extends "res://scripts/games/BaseGame.gd"

var selected_option_id: String = ""
var content_container: VBoxContainer
var timer_label: Label
var score_label: Label
var progress_label: Label

func _ready() -> void:
	super._ready()
	initialize_game("template_selection", GameManager.current_level)

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
	content_container.add_theme_constant_override("separation", 14)
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
	selected_option_id = ""
	for child in content_container.get_children():
		content_container.remove_child(child)
		child.queue_free()

	var title_label = create_label("📝 " + question.get("title", ""), Vector2.ZERO, 24, STYLE_TEXT_PRIMARY)
	title_label.add_theme_color_override("font_color", STYLE_ACCENT)
	content_container.add_child(title_label)

	var scenario_label = create_label("【违规场景】" + question.get("scenario", ""), Vector2.ZERO, 15, STYLE_TEXT_SECONDARY)
	scenario_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	content_container.add_child(scenario_label)

	var level_hbox = HBoxContainer.new()
	level_hbox.add_theme_constant_override("separation", 20)
	content_container.add_child(level_hbox)
	var vl_text = "违规等级：" + _get_violation_level_text(question.get("violation_level", ""))
	var level_label = create_label(vl_text, Vector2.ZERO, 14, STYLE_WARNING)
	level_hbox.add_child(level_label)
	var vt_text = "违规类型：" + _get_violation_type_text(question.get("violation_type", ""))
	var type_label = create_label(vt_text, Vector2.ZERO, 14, STYLE_ACCENT)
	level_hbox.add_child(type_label)

	var desc_label = create_label(question.get("description", ""), Vector2.ZERO, 16, STYLE_TEXT_PRIMARY)
	desc_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	content_container.add_child(desc_label)

	var options_sep = HSeparator.new()
	options_sep.modulate = Color(0.35, 0.4, 0.48, 1)
	content_container.add_child(options_sep)

	var options = question.get("options", [])
	var vbox_options = VBoxContainer.new()
	vbox_options.add_theme_constant_override("separation", 12)
	vbox_options.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	content_container.add_child(vbox_options)

	for opt in options:
		var opt_card = _build_option_card(opt)
		vbox_options.add_child(opt_card)

	if GameManager.current_mode == "practice" and question.has("hint") and question["hint"] != "":
		var hint_sep = HSeparator.new()
		hint_sep.modulate = Color(0.35, 0.4, 0.48, 1)
		content_container.add_child(hint_sep)
		var hint_label = create_label("💡 提示：" + question["hint"], Vector2.ZERO, 14, STYLE_WARNING)
		hint_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		content_container.add_child(hint_label)

	var bottom_bar = HBoxContainer.new()
	bottom_bar.add_theme_constant_override("separation", 16)
	bottom_bar.alignment = BoxContainer.ALIGNMENT_END
	content_container.add_child(bottom_bar)

	var info_label = create_label("请选择最合适的通报模板（单选）", Vector2.ZERO, 14, STYLE_TEXT_SECONDARY)
	info_label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	info_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	bottom_bar.add_child(info_label)

	var submit_btn = create_button("确认提交", Vector2.ZERO, Vector2(160, 48), STYLE_ACCENT)
	submit_btn.pressed.connect(_on_submit)
	bottom_bar.add_child(submit_btn)

func _build_option_card(opt: Dictionary) -> PanelContainer:
	var card = PanelContainer.new()
	card.name = "tpl_" + opt.get("id", "")
	var normal_style = StyleBoxFlat.new()
	normal_style.bg_color = Color(0.22, 0.26, 0.34, 1)
	normal_style.corner_radius_top_left = 8
	normal_style.corner_radius_top_right = 8
	normal_style.corner_radius_bottom_left = 8
	normal_style.corner_radius_bottom_right = 8
	normal_style.content_margin_left = 18
	normal_style.content_margin_right = 18
	normal_style.content_margin_top = 14
	normal_style.content_margin_bottom = 14
	card.add_theme_stylebox_override("panel", normal_style)
	card.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	card.custom_minimum_size = Vector2(0, 90)
	card.gui_input.connect(func(event): _on_option_clicked(event, opt, card, normal_style))

	var vbox = VBoxContainer.new()
	vbox.anchor_right = 1.0
	vbox.anchor_bottom = 1.0
	vbox.add_theme_constant_override("separation", 6)
	card.add_child(vbox)

	var name_hbox = HBoxContainer.new()
	name_hbox.add_theme_constant_override("separation", 12)
	vbox.add_child(name_hbox)
	var icon_label = create_label("📋", Vector2.ZERO, 20, STYLE_ACCENT)
	name_hbox.add_child(icon_label)
	var tpl_name = create_label(opt.get("name", ""), Vector2.ZERO, 17, STYLE_TEXT_PRIMARY)
	name_hbox.add_child(tpl_name)

	var desc_label = create_label(opt.get("description", ""), Vector2.ZERO, 14, STYLE_TEXT_SECONDARY)
	desc_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	vbox.add_child(desc_label)

	return card

func _on_option_clicked(event: InputEvent, opt: Dictionary, card: PanelContainer, normal_style: StyleBoxFlat) -> void:
	if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		selected_option_id = opt.get("id", "")
		for child in card.get_parent().get_children():
			if child is PanelContainer:
				var s = StyleBoxFlat.new()
				s.bg_color = Color(0.22, 0.26, 0.34, 1)
				s.corner_radius_top_left = 8
				s.corner_radius_top_right = 8
				s.corner_radius_bottom_left = 8
				s.corner_radius_bottom_right = 8
				s.content_margin_left = 18
				s.content_margin_right = 18
				s.content_margin_top = 14
				s.content_margin_bottom = 14
				child.add_theme_stylebox_override("panel", s)
		var selected_style = normal_style.duplicate()
		selected_style.bg_color = STYLE_ACCENT.darkened(0.3)
		selected_style.border_color = STYLE_ACCENT
		selected_style.border_width_left = 3
		selected_style.border_width_right = 3
		selected_style.border_width_top = 3
		selected_style.border_width_bottom = 3
		card.add_theme_stylebox_override("panel", selected_style)

func _on_submit() -> void:
	if selected_option_id == "":
		show_notification("请选择一个模板", "warning", 2.0)
		return
	var question = current_question
	var correct_id = ""
	var correct_reason = ""
	for opt in question.get("options", []):
		if opt.get("appropriate", false):
			correct_id = opt.get("id", "")
			correct_reason = opt.get("reason", "")
			break
	var correct = selected_option_id == correct_id
	var total_score = question.get("score", 0)
	if not correct:
		var selected_opt: Dictionary = {}
		for opt in question.get("options", []):
			if opt.get("id", "") == selected_option_id:
				selected_opt = opt
				break
		show_notification("不适用原因：" + selected_opt.get("reason", ""), "warning", 4.0)
	_submit_answer(selected_option_id, correct, total_score if correct else 0)

func _get_violation_level_text(level: String) -> String:
	match level:
		"serious": return "🔴 严重"
		"general": return "🟡 一般"
		"minor": return "🟢 轻微"
		_: return level

func _get_violation_type_text(vtype: String) -> String:
	match vtype:
		"record_keeping": return "记录保存"
		"regulatory_findings": return "监管检查"
		"data_security": return "数据安全"
		"process_violation": return "流程违规"
		_: return vtype

func _get_correct_answer() -> String:
	for opt in current_question.get("options", []):
		if opt.get("appropriate", false):
			return opt.get("id", "")
	return ""
