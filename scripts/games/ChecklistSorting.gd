extends "res://scripts/games/BaseGame.gd"

var current_order: Array = []
var items_container: VBoxContainer
var content_container: VBoxContainer
var timer_label: Label
var score_label: Label
var progress_label: Label

func _ready() -> void:
	super._ready()
	initialize_game("checklist_sorting", GameManager.current_level)

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
	var items = question.get("items", [])
	current_order = items.duplicate()
	shuffle_array(current_order)
	for child in content_container.get_children():
		content_container.remove_child(child)
		child.queue_free()

	var title_label = create_label("📋 " + question.get("title", ""), Vector2.ZERO, 24, STYLE_TEXT_PRIMARY)
	title_label.add_theme_color_override("font_color", STYLE_ACCENT)
	content_container.add_child(title_label)

	var scenario_label = create_label("【场景】" + question.get("scenario", ""), Vector2.ZERO, 15, STYLE_TEXT_SECONDARY)
	scenario_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	content_container.add_child(scenario_label)

	var desc_label = create_label(question.get("description", ""), Vector2.ZERO, 16, STYLE_TEXT_PRIMARY)
	desc_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	content_container.add_child(desc_label)

	var hint_label = create_label("使用 ↑↓ 按钮调整步骤顺序，正确的流程应该从上到下依次执行", Vector2.ZERO, 14, STYLE_WARNING)
	content_container.add_child(hint_label)

	var sep = HSeparator.new()
	sep.modulate = Color(0.35, 0.4, 0.48, 1)
	content_container.add_child(sep)

	var scroll_container = ScrollContainer.new()
	scroll_container.size_flags_vertical = Control.SIZE_EXPAND_FILL
	scroll_container.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	content_container.add_child(scroll_container)

	items_container = VBoxContainer.new()
	items_container.add_theme_constant_override("separation", 8)
	items_container.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	scroll_container.add_child(items_container)

	_refresh_items_display()

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

	var reset_btn = create_button("重置顺序", Vector2.ZERO, Vector2(120, 44), Color(0.55, 0.45, 0.25, 1))
	reset_btn.pressed.connect(_on_reset)
	bottom_bar.add_child(reset_btn)

	var info_label = create_label("请按正确流程排序后提交", Vector2.ZERO, 14, STYLE_TEXT_SECONDARY)
	info_label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	info_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	bottom_bar.add_child(info_label)

	var submit_btn = create_button("确认提交", Vector2.ZERO, Vector2(160, 44), STYLE_ACCENT)
	submit_btn.pressed.connect(_on_submit)
	bottom_bar.add_child(submit_btn)

func _refresh_items_display() -> void:
	for child in items_container.get_children():
		items_container.remove_child(child)
		child.queue_free()
	for i in range(current_order.size()):
		var item = current_order[i]
		var item_card = _build_item_row(item, i)
		items_container.add_child(item_card)

func _build_item_row(item: Dictionary, index: int) -> PanelContainer:
	var card = PanelContainer.new()
	var style = StyleBoxFlat.new()
	style.bg_color = Color(0.22, 0.26, 0.34, 1)
	style.corner_radius_top_left = 6
	style.corner_radius_top_right = 6
	style.corner_radius_bottom_left = 6
	style.corner_radius_bottom_right = 6
	style.content_margin_left = 14
	style.content_margin_right = 14
	style.content_margin_top = 10
	style.content_margin_bottom = 10
	card.add_theme_stylebox_override("panel", style)
	card.size_flags_horizontal = Control.SIZE_EXPAND_FILL

	var hbox = HBoxContainer.new()
	hbox.anchor_right = 1.0
	hbox.anchor_bottom = 1.0
	hbox.add_theme_constant_override("separation", 14)
	card.add_child(hbox)

	var order_num = create_label("%d." % (index + 1), Vector2.ZERO, 20, STYLE_ACCENT)
	order_num.custom_minimum_size = Vector2(40, 0)
	order_num.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	hbox.add_child(order_num)

	var vbox_center = VBoxContainer.new()
	vbox_center.add_theme_constant_override("separation", 4)
	vbox_center.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	hbox.add_child(vbox_center)

	var step_text = create_label(item.get("text", ""), Vector2.ZERO, 16, STYLE_TEXT_PRIMARY)
	vbox_center.add_child(step_text)

	var step_desc = create_label(item.get("description", ""), Vector2.ZERO, 13, STYLE_TEXT_SECONDARY)
	step_desc.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	vbox_center.add_child(step_desc)

	var btn_vbox = VBoxContainer.new()
	btn_vbox.add_theme_constant_override("separation", 4)
	hbox.add_child(btn_vbox)

	var up_btn = create_button("↑", Vector2.ZERO, Vector2(36, 28), Color(0.35, 0.4, 0.5, 1))
	up_btn.add_theme_font_size_override("font_size", 14)
	up_btn.disabled = (index == 0)
	up_btn.pressed.connect(func(): _on_move_up(index))
	btn_vbox.add_child(up_btn)

	var down_btn = create_button("↓", Vector2.ZERO, Vector2(36, 28), Color(0.35, 0.4, 0.5, 1))
	down_btn.add_theme_font_size_override("font_size", 14)
	down_btn.disabled = (index == current_order.size() - 1)
	down_btn.pressed.connect(func(): _on_move_down(index))
	btn_vbox.add_child(down_btn)

	return card

func _on_move_up(index: int) -> void:
	if index <= 0:
		return
	var temp = current_order[index]
	current_order[index] = current_order[index - 1]
	current_order[index - 1] = temp
	_refresh_items_display()

func _on_move_down(index: int) -> void:
	if index >= current_order.size() - 1:
		return
	var temp = current_order[index]
	current_order[index] = current_order[index + 1]
	current_order[index + 1] = temp
	_refresh_items_display()

func _on_reset() -> void:
	var items = current_question.get("items", [])
	current_order = items.duplicate()
	shuffle_array(current_order)
	_refresh_items_display()
	show_notification("已重置顺序", "info", 1.5)

func _on_submit() -> void:
	var question = current_question
	var raw_items = question.get("items", [])
	var correct_order = raw_items.duplicate()
	correct_order.sort_custom(func(a, b):
		return a.get("order", 0) < b.get("order", 0)
	)
	var correct = true
	var correct_positions = 0
	for i in range(current_order.size()):
		if current_order[i].get("id", "") == correct_order[i].get("id", ""):
			correct_positions += 1
		else:
			correct = false
	var user_order_ids: Array = []
	for item in current_order:
		user_order_ids.append(item.get("id", ""))
	var total_score = question.get("score", 0)
	var partial_score = 0
	if correct:
		partial_score = total_score
	else:
		var ratio = float(correct_positions) / float(current_order.size()) if current_order.size() > 0 else 0
		partial_score = int(total_score * ratio)
	_submit_answer(user_order_ids, correct, partial_score)

func _get_correct_answer() -> Array:
	var correct_ids: Array = []
	var sorted_items = current_question.get("items", []).duplicate()
	sorted_items.sort_custom(func(a, b):
		return a.get("order", 0) < b.get("order", 0)
	)
	for item in sorted_items:
		correct_ids.append(item.get("id", ""))
	return correct_ids
