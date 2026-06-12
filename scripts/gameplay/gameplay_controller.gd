extends Control

signal question_completed(is_correct, score)
signal game_finished(score, accuracy)

@onready var back_btn: Button = $Background/TopBar/BackBtn
@onready var level_label: Label = $Background/TopBar/LevelLabel
@onready var score_label: Label = $Background/TopBar/ScoreLabel
@onready var time_label: Label = $Background/TopBar/TimeLabel
@onready var question_panel: PanelContainer = $Background/QuestionContainer
@onready var question_margin: MarginContainer = $Background/QuestionContainer/MarginContainer
@onready var question_number_label: Label = $Background/QuestionInfo/QuestionNumberLabel
@onready var question_type_label: Label = $Background/QuestionInfo/QuestionTypeLabel
@onready var next_btn: Button = $Background/BottomBar/NextBtn
@onready var submit_btn: Button = $Background/BottomBar/SubmitBtn
@onready var feedback_panel: PanelContainer = $Background/FeedbackPanel
@onready var feedback_label: Label = $Background/FeedbackPanel/MarginContainer/VBoxContainer/FeedbackLabel
@onready var feedback_reason: Label = $Background/FeedbackPanel/MarginContainer/VBoxContainer/FeedbackReason
@onready var abnormal_reason: Label = $Background/FeedbackPanel/MarginContainer/VBoxContainer/AbnormalReason

var current_question: Dictionary = {}
var current_question_index: int = 0
var questions: Array = []
var time_remaining: float = 0.0
var game_timer: Timer = Timer.new()
var is_question_answered: bool = false
var current_question_widget: Control = null

var type_names: Dictionary = {
	"review_opinion": "📝 复核意见识别",
	"store_selection": "🏪 责任门店选择",
	"amount_sorting": "💰 成本金额排序",
	"approval_record": "📋 审批记录处理"
}

func _ready() -> void:
	setup_connections()
	setup_timer()
	load_level_questions()
	start_game()

func setup_connections() -> void:
	back_btn.pressed.connect(_on_back_pressed)
	next_btn.pressed.connect(_on_next_pressed)
	submit_btn.pressed.connect(_on_submit_pressed)
	game_timer.timeout.connect(_on_timer_tick)

func setup_timer() -> void:
	add_child(game_timer)
	game_timer.wait_time = 1.0

func load_level_questions() -> void:
	var level: Dictionary = DataManager.get_level(GameManager.current_level_id)
	if level.is_empty():
		return
	
	var question_types: Array = level.get("question_types", [])
	questions = DataManager.get_random_questions(question_types, 8)
	time_remaining = float(level.get("time_limit", 300))

func start_game() -> void:
	current_question_index = 0
	_update_time_display()
	game_timer.start()
	show_question()
	update_ui()

func show_question() -> void:
	if current_question_index >= questions.size():
		finish_game()
		return
	
	is_question_answered = false
	current_question = questions[current_question_index]
	feedback_panel.visible = false
	submit_btn.disabled = false
	next_btn.disabled = true
	
	if current_question_widget:
		current_question_widget.queue_free()
		current_question_widget = null
	
	for child in question_margin.get_children():
		child.queue_free()
	
	var qtype: String = current_question.get("type", "review_opinion")
	current_question_widget = create_question_widget(qtype)
	if current_question_widget:
		current_question_widget.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		current_question_widget.size_flags_vertical = Control.SIZE_EXPAND_FILL
		question_margin.add_child(current_question_widget)
	
	update_question_info()

func create_question_widget(qtype: String) -> Control:
	match qtype:
		"review_opinion":
			return create_review_opinion_widget()
		"store_selection":
			return create_store_selection_widget()
		"amount_sorting":
			return create_amount_sorting_widget()
		"approval_record":
			return create_approval_record_widget()
		_:
			return create_review_opinion_widget()

func create_review_opinion_widget() -> Control:
	var widget: VBoxContainer = VBoxContainer.new()
	widget.size_flags_horizontal = 3
	widget.size_flags_vertical = 3
	widget.theme_override_constants.separation = 16
	
	var desc_label: Label = Label.new()
	desc_label.text = current_question.get("description", "")
	desc_label.theme_override_font_sizes.font_size = 20
	desc_label.autowrap_mode = 3
	widget.add_child(desc_label)
	
	var separator: HSeparator = HSeparator.new()
	widget.add_child(separator)
	
	var options: Array = current_question.get("options", [])
	for i in range(options.size()):
		var opt: Dictionary = options[i]
		var btn: Button = Button.new()
		btn.text = "%s. %s" % [opt.get("id", ""), opt.get("text", "")]
		btn.theme_override_font_sizes.font_size = 16
		btn.size_flags_horizontal = 3
		btn.custom_minimum_size = Vector2(0, 50)
		btn.pressed.connect(func(): _on_option_selected(opt, btn))
		widget.add_child(btn)
	
	return widget

func create_store_selection_widget() -> Control:
	var widget: VBoxContainer = VBoxContainer.new()
	widget.size_flags_horizontal = 3
	widget.size_flags_vertical = 3
	widget.theme_override_constants.separation = 16
	
	var desc_label: Label = Label.new()
	desc_label.text = current_question.get("description", "")
	desc_label.theme_override_font_sizes.font_size = 20
	desc_label.autowrap_mode = 3
	widget.add_child(desc_label)
	
	var scenario_label: Label = Label.new()
	scenario_label.text = current_question.get("scenario", "")
	scenario_label.theme_override_font_sizes.font_size = 16
	scenario_label.modulate = Color(0.4, 0.3, 0.2, 1)
	scenario_label.autowrap_mode = 3
	widget.add_child(scenario_label)
	
	var separator: HSeparator = HSeparator.new()
	widget.add_child(separator)
	
	var options: Array = current_question.get("options", [])
	for i in range(options.size()):
		var opt: Dictionary = options[i]
		var store_id: String = opt.get("store_id", "")
		var store: Dictionary = DataManager.get_store(store_id)
		
		var btn: Button = Button.new()
		var btn_text: String = "%s. %s" % [opt.get("id", ""), opt.get("text", "")]
		if not store.is_empty():
			btn_text += "\n   经理: %s | 目标: %.1f%%" % [store.get("manager", "-"), store.get("loss_rate_target", 0.0)]
		btn.text = btn_text
		btn.theme_override_font_sizes.font_size = 16
		btn.size_flags_horizontal = 3
		btn.custom_minimum_size = Vector2(0, 60)
		btn.pressed.connect(func(): _on_option_selected(opt, btn))
		widget.add_child(btn)
	
	return widget

func create_amount_sorting_widget() -> Control:
	var widget: VBoxContainer = VBoxContainer.new()
	widget.size_flags_horizontal = 3
	widget.size_flags_vertical = 3
	widget.theme_override_constants.separation = 16
	
	var desc_label: Label = Label.new()
	desc_label.text = current_question.get("description", "")
	desc_label.theme_override_font_sizes.font_size = 20
	desc_label.autowrap_mode = 3
	widget.add_child(desc_label)
	
	var hint_label: Label = Label.new()
	hint_label.text = "💡 提示：点击按钮选择顺序，从第一个到最后一个依次点击"
	hint_label.theme_override_font_sizes.font_size = 14
	hint_label.modulate = Color(0.5, 0.4, 0.3, 1)
	widget.add_child(hint_label)
	
	var selected_label: Label = Label.new()
	selected_label.name = "SelectedLabel"
	selected_label.text = "已选择顺序：(未选择)"
	selected_label.theme_override_font_sizes.font_size = 16
	widget.add_child(selected_label)
	
	var separator: HSeparator = HSeparator.new()
	widget.add_child(separator)
	
	var items: Array = current_question.get("items", []).duplicate()
	items.shuffle()
	widget.set_meta("selected_order", [])
	widget.set_meta("all_items", items)
	
	var items_container: GridContainer = GridContainer.new()
	items_container.columns = 2
	items_container.size_flags_horizontal = 3
	items_container.theme_override_constants.h_separation = 12
	items_container.theme_override_constants.v_separation = 12
	widget.add_child(items_container)
	
	for i in range(items.size()):
		var item: Dictionary = items[i]
		var btn: Button = Button.new()
		btn.text = "%s\n¥%.2f" % [item.get("name", ""), item.get("amount", 0.0)]
		btn.theme_override_font_sizes.font_size = 16
		btn.custom_minimum_size = Vector2(0, 70)
		btn.pressed.connect(func(): _on_sort_item_selected(item, btn, widget))
		items_container.add_child(btn)
	
	var reset_btn: Button = Button.new()
	reset_btn.text = "🔄 重新选择"
	reset_btn.theme_override_font_sizes.font_size = 14
	reset_btn.pressed.connect(func(): _on_sort_reset(widget))
	widget.add_child(reset_btn)
	
	return widget

func create_approval_record_widget() -> Control:
	var widget: VBoxContainer = VBoxContainer.new()
	widget.size_flags_horizontal = 3
	widget.size_flags_vertical = 3
	widget.theme_override_constants.separation = 16
	
	var desc_label: Label = Label.new()
	desc_label.text = current_question.get("description", "")
	desc_label.theme_override_font_sizes.font_size = 20
	desc_label.autowrap_mode = 3
	widget.add_child(desc_label)
	
	var hint_label: Label = Label.new()
	hint_label.text = "💡 提示：按正确的审批流程顺序点击步骤"
	hint_label.theme_override_font_sizes.font_size = 14
	hint_label.modulate = Color(0.5, 0.4, 0.3, 1)
	widget.add_child(hint_label)
	
	var selected_label: Label = Label.new()
	selected_label.name = "SelectedLabel"
	selected_label.text = "已选择顺序：(未选择)"
	selected_label.theme_override_font_sizes.font_size = 16
	widget.add_child(selected_label)
	
	var separator: HSeparator = HSeparator.new()
	widget.add_child(separator)
	
	var steps: Array = current_question.get("steps", []).duplicate()
	steps.shuffle()
	widget.set_meta("selected_order", [])
	widget.set_meta("all_steps", steps)
	
	var steps_container: VBoxContainer = VBoxContainer.new()
	steps_container.size_flags_horizontal = 3
	steps_container.theme_override_constants.separation = 10
	widget.add_child(steps_container)
	
	for i in range(steps.size()):
		var step: Dictionary = steps[i]
		var btn: Button = Button.new()
		btn.text = step.get("text", "")
		btn.theme_override_font_sizes.font_size = 16
		btn.custom_minimum_size = Vector2(0, 55)
		btn.pressed.connect(func(): _on_approval_step_selected(step, btn, widget))
		steps_container.add_child(btn)
	
	var reset_btn: Button = Button.new()
	reset_btn.text = "🔄 重新选择"
	reset_btn.theme_override_font_sizes.font_size = 14
	reset_btn.pressed.connect(func(): _on_sort_reset(widget))
	widget.add_child(reset_btn)
	
	return widget

func _on_option_selected(option: Dictionary, button: Button) -> void:
	if is_question_answered:
		return
	
	AudioManager.play_click()
	var is_correct: bool = option.get("correct", false)
	var score: int = current_question.get("score", 0)
	var extra: Dictionary = {}
	var qtype: String = current_question.get("type", "")
	if qtype == "store_selection":
		var sid: String = option.get("store_id", "")
		if sid != "":
			extra["store_id"] = sid
	
	if is_correct:
		button.add_theme_color_override("font_color", Color(1, 1, 1, 1))
		button.add_theme_stylebox_override("normal", create_correct_style())
	else:
		button.add_theme_color_override("font_color", Color(1, 1, 1, 1))
		button.add_theme_stylebox_override("normal", create_wrong_style())
		highlight_correct_option()
	
	show_feedback(is_correct)
	submit_answer(is_correct, score, extra)

func highlight_correct_option() -> void:
	if not current_question_widget:
		return
	
	var options: Array = current_question.get("options", [])
	var correct_opt_id: String = ""
	for opt in options:
		if opt.get("correct", false):
			correct_opt_id = opt.get("id", "")
			break
	
	if correct_opt_id == "":
		return
	
	for child in current_question_widget.get_children():
		if child is Button:
			var btn_text: String = child.text
			if btn_text.begins_with(correct_opt_id + "."):
				child.add_theme_color_override("font_color", Color(1, 1, 1, 1))
				child.add_theme_stylebox_override("normal", create_highlight_style())
				break

func _on_sort_item_selected(item: Dictionary, button: Button, widget: Control) -> void:
	if is_question_answered:
		return
	
	AudioManager.play_click()
	var selected_order: Array = widget.get_meta("selected_order", [])
	if item["id"] in selected_order:
		return
	
	selected_order.append(item["id"])
	widget.set_meta("selected_order", selected_order)
	
	button.disabled = true
	button.modulate = Color(0.7, 0.7, 0.7, 0.5)
	
	var selected_label: Label = widget.get_node("SelectedLabel")
	var order_text: String = "已选择顺序：\n"
	var all_items: Array = widget.get_meta("all_items", [])
	for i in range(selected_order.size()):
		for itm in all_items:
			if itm["id"] == selected_order[i]:
				order_text += "%d. %s (¥%.2f)\n" % [i + 1, itm["name"], itm["amount"]]
				break
	selected_label.text = order_text

func _on_approval_step_selected(step: Dictionary, button: Button, widget: Control) -> void:
	if is_question_answered:
		return
	
	AudioManager.play_click()
	var selected_order: Array = widget.get_meta("selected_order", [])
	if step["id"] in selected_order:
		return
	
	selected_order.append(step["id"])
	widget.set_meta("selected_order", selected_order)
	
	button.disabled = true
	button.modulate = Color(0.7, 0.7, 0.7, 0.5)
	
	var selected_label: Label = widget.get_node("SelectedLabel")
	var order_text: String = "已选择顺序：\n"
	var all_steps: Array = widget.get_meta("all_steps", [])
	for i in range(selected_order.size()):
		for stp in all_steps:
			if stp["id"] == selected_order[i]:
				order_text += "%d. %s\n" % [i + 1, stp["text"]]
				break
	selected_label.text = order_text

func _on_sort_reset(widget: Control) -> void:
	if is_question_answered:
		return
	
	AudioManager.play_click()
	widget.set_meta("selected_order", [])
	var selected_label: Label = widget.get_node("SelectedLabel")
	selected_label.text = "已选择顺序：(未选择)"
	
	var containers: Array = widget.get_children()
	for container in containers:
		if container is GridContainer or container is VBoxContainer:
			for child in container.get_children():
				if child is Button:
					child.disabled = false
					child.modulate = Color(1, 1, 1, 1)

func _on_submit_pressed() -> void:
	if is_question_answered:
		return
	
	var qtype: String = current_question.get("type", "")
	if qtype in ["amount_sorting", "approval_record"]:
		if not current_question_widget:
			return
		var selected_order: Array = current_question_widget.get_meta("selected_order", [])
		var correct_order: Array = current_question.get("correct_order", [])
		
		if selected_order.size() != correct_order.size():
			show_feedback(false, "请完成所有选项的排序")
			return
		
		var is_correct: bool = selected_order == correct_order
		var score: int = current_question.get("score", 0)
		
		highlight_sorting_result(selected_order, correct_order)
		show_feedback(is_correct)
		submit_answer(is_correct, score)

func highlight_sorting_result(selected_order: Array, correct_order: Array) -> void:
	if not current_question_widget:
		return
	
	var containers: Array = current_question_widget.get_children()
	for container in containers:
		if container is GridContainer or container is VBoxContainer:
			var buttons: Array = container.get_children()
			var all_items: Array = current_question_widget.get_meta("all_items", [])
			if all_items.is_empty():
				all_items = current_question_widget.get_meta("all_steps", [])
			
			for btn in buttons:
				if btn is Button:
					for itm in all_items:
						if btn.text.find(itm.get("name", "")) != -1 or btn.text == itm.get("text", ""):
							var selected_pos: int = selected_order.find(itm["id"])
							var correct_pos: int = correct_order.find(itm["id"])
							
							if selected_pos == correct_pos:
								btn.add_theme_color_override("font_color", Color(1, 1, 1, 1))
								btn.add_theme_stylebox_override("normal", create_correct_style())
							else:
								btn.add_theme_color_override("font_color", Color(1, 1, 1, 1))
								btn.add_theme_stylebox_override("normal", create_wrong_style())
							break

func submit_answer(is_correct: bool, score: int, extra: Dictionary = {}) -> void:
	is_question_answered = true
	submit_btn.disabled = true
	next_btn.disabled = false
	
	var actual_score: int = score if is_correct else 0
	GameManager.add_question_result(is_correct, actual_score, current_question.get("type", ""), extra)
	
	if is_correct:
		AudioManager.play_correct()
	else:
		AudioManager.play_wrong()
	
	question_completed.emit(is_correct, actual_score)
	update_ui()

func show_feedback(is_correct: bool, custom_message: String = "") -> void:
	feedback_panel.visible = true
	
	if custom_message != "":
		feedback_label.text = custom_message
		feedback_label.modulate = Color(0.7, 0.3, 0.1, 1)
	else:
		if is_correct:
			feedback_label.text = "✅ 回答正确！+" + str(current_question.get("score", 0)) + "分"
			feedback_label.modulate = Color(0.2, 0.6, 0.2, 1)
		else:
			feedback_label.text = "❌ 回答错误"
			feedback_label.modulate = Color(0.7, 0.2, 0.2, 1)
	
	feedback_reason.text = "📌 解析：" + current_question.get("correct_reason", "")
	
	var abnormal: String = current_question.get("abnormal_reason", "")
	if abnormal != "":
		abnormal_reason.visible = true
		abnormal_reason.text = "⚠️ 异常提示：" + abnormal
	else:
		abnormal_reason.visible = false

func create_correct_style() -> StyleBoxFlat:
	var style: StyleBoxFlat = StyleBoxFlat.new()
	style.bg_color = Color(0.3, 0.7, 0.3, 1)
	style.border_color = Color(0.2, 0.5, 0.2, 1)
	style.border_width_left = 2
	style.border_width_right = 2
	style.border_width_top = 2
	style.border_width_bottom = 2
	style.corner_radius_top_left = 8
	style.corner_radius_top_right = 8
	style.corner_radius_bottom_right = 8
	style.corner_radius_bottom_left = 8
	style.content_margin_left = 16
	style.content_margin_right = 16
	style.content_margin_top = 10
	style.content_margin_bottom = 10
	return style

func create_wrong_style() -> StyleBoxFlat:
	var style: StyleBoxFlat = StyleBoxFlat.new()
	style.bg_color = Color(0.8, 0.3, 0.3, 1)
	style.border_color = Color(0.6, 0.2, 0.2, 1)
	style.border_width_left = 2
	style.border_width_right = 2
	style.border_width_top = 2
	style.border_width_bottom = 2
	style.corner_radius_top_left = 8
	style.corner_radius_top_right = 8
	style.corner_radius_bottom_right = 8
	style.corner_radius_bottom_left = 8
	style.content_margin_left = 16
	style.content_margin_right = 16
	style.content_margin_top = 10
	style.content_margin_bottom = 10
	return style

func create_highlight_style() -> StyleBoxFlat:
	var style: StyleBoxFlat = StyleBoxFlat.new()
	style.bg_color = Color(0.3, 0.7, 0.3, 0.8)
	style.border_color = Color(0.9, 0.7, 0.2, 1)
	style.border_width_left = 3
	style.border_width_right = 3
	style.border_width_top = 3
	style.border_width_bottom = 3
	style.corner_radius_top_left = 8
	style.corner_radius_top_right = 8
	style.corner_radius_bottom_right = 8
	style.corner_radius_bottom_left = 8
	style.content_margin_left = 16
	style.content_margin_right = 16
	style.content_margin_top = 10
	style.content_margin_bottom = 10
	return style

func _on_next_pressed() -> void:
	AudioManager.play_click()
	current_question_index += 1
	show_question()
	update_ui()

func _on_back_pressed() -> void:
	AudioManager.play_click()
	var dialog: ConfirmationDialog = ConfirmationDialog.new()
	dialog.title = "确认退出"
	dialog.dialog_text = "确定要退出当前训练吗？进度将不会保存。"
	dialog.get_ok_button().text = "确定退出"
	dialog.get_cancel_button().text = "继续训练"
	add_child(dialog)
	dialog.confirmed.connect(func(): 
		game_timer.stop()
		GameManager.change_scene("LevelSelect")
	)
	dialog.popup_centered()

func _on_timer_tick() -> void:
	time_remaining -= 1.0
	_update_time_display()
	if time_remaining <= 0:
		time_remaining = 0
		finish_game()

func _update_time_display() -> void:
	var minutes: int = int(time_remaining) / 60
	var seconds: int = int(time_remaining) % 60
	time_label.text = "⏱ %02d:%02d" % [minutes, seconds]
	
	if time_remaining <= 30:
		time_label.modulate = Color(0.8, 0.2, 0.2, 1)
	elif time_remaining <= 60:
		time_label.modulate = Color(0.8, 0.6, 0.2, 1)
	else:
		time_label.modulate = Color(0.2, 0.1, 0.05, 1)

func update_ui() -> void:
	var level: Dictionary = DataManager.get_level(GameManager.current_level_id)
	level_label.text = "📋 " + level.get("name", "")
	score_label.text = "🏆 %d分" % GameManager.current_score

func update_question_info() -> void:
	question_number_label.text = "第 %d / %d 题" % [current_question_index + 1, questions.size()]
	var qtype: String = current_question.get("type", "")
	question_type_label.text = type_names.get(qtype, qtype)

func finish_game() -> void:
	game_timer.stop()
	AudioManager.play_complete()
	game_finished.emit(GameManager.current_score, GameManager.current_accuracy)
	GameManager.end_game()
