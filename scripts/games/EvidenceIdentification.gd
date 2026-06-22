extends "res://scripts/games/BaseGame.gd"

var selected_options: Dictionary = {}
var content_container: VBoxContainer
var timer_label: Label
var score_label: Label
var progress_label: Label

func _ready() -> void:
	super._ready()
	initialize_game("evidence_identification", GameManager.current_level)

func _setup_ui() -> void:
	_clear_children_except_background()
	var top_bar = HBoxContainer.new()
	top_bar.anchor_right = 1.0
	top_bar.position = Vector2(40, 20)
	top_bar.size = Vector2(get_viewport_rect().size.x - 80, 50)
	top_bar.add_theme_constant_override("separation", 30)
	top_bar.alignment = BoxContainer.ALIGNMENT_BEGIN
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
	content_container.add_theme_constant_override("separation", 16)
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
	selected_options.clear()
	for child in content_container.get_children():
		content_container.remove_child(child)
		child.queue_free()

	var title_label = create_label("📁 " + question.get("title", ""), Vector2.ZERO, 24, STYLE_TEXT_PRIMARY)
	title_label.add_theme_color_override("font_color", STYLE_ACCENT)
	content_container.add_child(title_label)

	var scenario_label = create_label("【场景】" + question.get("scenario", ""), Vector2.ZERO, 15, STYLE_TEXT_SECONDARY)
	scenario_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	content_container.add_child(scenario_label)

	var desc_label = create_label(question.get("description", ""), Vector2.ZERO, 16, STYLE_TEXT_PRIMARY)
	desc_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	content_container.add_child(desc_label)

	var options_sep = HSeparator.new()
	options_sep.modulate = Color(0.35, 0.4, 0.48, 1)
	content_container.add_child(options_sep)

	var options = question.get("options", [])
	var grid = GridContainer.new()
	grid.columns = 2
	grid.add_theme_constant_override("h_separation", 16)
	grid.add_theme_constant_override("v_separation", 12)
	grid.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	content_container.add_child(grid)

	for opt in options:
		var opt_card = _build_option_card(opt)
		grid.add_child(opt_card)

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

	var info_label = create_label("请选择所有应该归档的证据附件（可多选）", Vector2.ZERO, 14, STYLE_TEXT_SECONDARY)
	info_label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	info_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	bottom_bar.add_child(info_label)

	var submit_btn = create_button("确认提交", Vector2.ZERO, Vector2(160, 48), STYLE_ACCENT)
	submit_btn.pressed.connect(_on_submit)
	bottom_bar.add_child(submit_btn)

func _build_option_card(opt: Dictionary) -> PanelContainer:
	var card = PanelContainer.new()
	card.name = "opt_" + opt.get("id", "")
	var normal_style = StyleBoxFlat.new()
	normal_style.bg_color = Color(0.22, 0.26, 0.34, 1)
	normal_style.corner_radius_top_left = 8
	normal_style.corner_radius_top_right = 8
	normal_style.corner_radius_bottom_left = 8
	normal_style.corner_radius_bottom_right = 8
	normal_style.content_margin_left = 16
	normal_style.content_margin_right = 16
	normal_style.content_margin_top = 12
	normal_style.content_margin_bottom = 12
	card.add_theme_stylebox_override("panel", normal_style)
	card.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	card.custom_minimum_size = Vector2(0, 100)
	card.gui_input.connect(func(event): _on_option_clicked(event, opt, card, normal_style))

	var vbox = VBoxContainer.new()
	vbox.anchor_right = 1.0
	vbox.anchor_bottom = 1.0
	vbox.add_theme_constant_override("separation", 6)
	card.add_child(vbox)

	var file_name = create_label("📄 " + opt.get("name", ""), Vector2.ZERO, 16, STYLE_TEXT_PRIMARY)
	vbox.add_child(file_name)

	var cat_label = create_label("分类：" + opt.get("category", ""), Vector2.ZERO, 13, STYLE_ACCENT)
	vbox.add_child(cat_label)

	var desc_label = create_label(opt.get("description", ""), Vector2.ZERO, 13, STYLE_TEXT_SECONDARY)
	desc_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	vbox.add_child(desc_label)

	return card

func _on_option_clicked(event: InputEvent, opt: Dictionary, card: PanelContainer, normal_style: StyleBoxFlat) -> void:
	if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		var opt_id = opt.get("id", "")
		var selected_style = normal_style.duplicate()
		if selected_options.has(opt_id):
			selected_options.erase(opt_id)
			card.add_theme_stylebox_override("panel", normal_style)
		else:
			selected_options[opt_id] = opt
			selected_style.bg_color = STYLE_ACCENT.darkened(0.3)
			selected_style.border_color = STYLE_ACCENT
			selected_style.border_width_left = 3
			selected_style.border_width_right = 3
			selected_style.border_width_top = 3
			selected_style.border_width_bottom = 3
			card.add_theme_stylebox_override("panel", selected_style)

func _on_submit() -> void:
	if selected_options.is_empty():
		show_notification("请至少选择一个选项", "warning", 2.0)
		return
	var question = current_question
	var options = question.get("options", [])
	var correct_ids: Array = []
	var user_ids: Array = selected_options.keys()
	for opt in options:
		if opt.get("is_evidence", false):
			correct_ids.append(opt.get("id", ""))
	user_ids.sort()
	correct_ids.sort()
	var correct = user_ids == correct_ids
	var total_score = question.get("score", 0)
	var partial_score = 0
	if correct:
		partial_score = total_score
	else:
		var correct_selected = 0
		var wrong_selected = 0
		var missed = 0
		for uid in user_ids:
			if uid in correct_ids:
				correct_selected += 1
			else:
				wrong_selected += 1
		for cid in correct_ids:
			if not cid in user_ids:
				missed += 1
		var penalty = wrong_selected * 0.2 + missed * 0.2
		var ratio = float(correct_selected) / float(correct_ids.size()) if correct_ids.size() > 0 else 0
		partial_score = int(max(0, total_score * (ratio - penalty)))
	_submit_answer(user_ids, correct, partial_score)

func _get_correct_answer() -> Array:
	var correct_ids: Array = []
	for opt in current_question.get("options", []):
		if opt.get("is_evidence", false):
			correct_ids.append(opt.get("id", ""))
	correct_ids.sort()
	return correct_ids

func _show_result(result: Dictionary) -> void:
	_advance_to_next_game_or_finish(result)

func _advance_to_next_game_or_finish(result: Dictionary) -> void:
	var queue = GameManager.current_level.get("_game_types_queue", [])
	var idx = GameManager.current_level.get("_current_game_index", 0)
	idx += 1
	if idx < queue.size():
		GameManager.current_level["_current_game_index"] = idx
		GameManager.change_scene(queue[idx])
	else:
		GameManager.change_scene("result_review")
