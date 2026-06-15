extends Control

@onready var back_button: Button = $TopBar/MarginContainer/HBoxContainer/BackButton
@onready var title_label: Label = $TopBar/MarginContainer/HBoxContainer/TitleLabel
@onready var timer_label: Label = $TopBar/MarginContainer/HBoxContainer/TimerLabel
@onready var level_name_label: Label = $MarginContainer/VBoxContainer/LevelNameLabel
@onready var desc_label: Label = $MarginContainer/VBoxContainer/DescLabel
@onready var sort_container: VBoxContainer = $MarginContainer/VBoxContainer/ScrollContainer/SortContainer
@onready var submit_button: Button = $MarginContainer/VBoxContainer/SubmitButton
@onready var hint_label: Label = $MarginContainer/VBoxContainer/HintLabel

var level_data: Dictionary = {}
var course_items: Array = []
var current_order: Array = []
var drag_index: int = -1
var time_remaining: float = 0.0
var timer_active: bool = false
var start_time: float = 0.0

func _ready() -> void:
	level_data = GameManager.current_level
	if level_data.is_empty():
		level_data = GameManager.start_level("course_sort", 0)
	_setup_level()
	back_button.pressed.connect(_on_back_pressed)
	submit_button.pressed.connect(_on_submit_pressed)

func _setup_level() -> void:
	title_label.text = "课程目录排序"
	level_name_label.text = level_data.get("name", "未知关卡")
	desc_label.text = level_data.get("description", "")
	time_remaining = float(level_data.get("time_limit", 90))
	start_time = Time.get_unix_time_from_system()
	var current_mode = GameManager.game_config.get("current_mode", "practice")
	timer_active = current_mode != "practice"
	_update_timer_label()
	
	course_items = level_data.get("courses", [])
	current_order = range(course_items.size())
	
	var shuffled = current_order.duplicate()
	shuffled.shuffle()
	current_order = shuffled
	
	_build_sort_list()

func _build_sort_list() -> void:
	for child in sort_container.get_children():
		child.queue_free()
	
	for rank in range(current_order.size()):
		var idx = current_order[rank]
		var course = course_items[idx]
		var row := _create_sort_row(course, rank)
		sort_container.add_child(row)

func _create_sort_row(course: Dictionary, rank: int) -> PanelContainer:
	var panel := PanelContainer.new()
	
	var margin := MarginContainer.new()
	margin.add_theme_constant_override("margin_left", 16)
	margin.add_theme_constant_override("margin_top", 12)
	margin.add_theme_constant_override("margin_right", 16)
	margin.add_theme_constant_override("margin_bottom", 12)
	panel.add_child(margin)
	
	var hbox := HBoxContainer.new()
	hbox.add_theme_constant_override("separation", 12)
	margin.add_child(hbox)
	
	var up_btn := Button.new()
	up_btn.text = "▲"
	up_btn.custom_minimum_size = Vector2(40, 36)
	up_btn.add_theme_font_size_override("font_size", 18)
	up_btn.pressed.connect(_on_move_up.bind(rank))
	hbox.add_child(up_btn)
	
	var down_btn := Button.new()
	down_btn.text = "▼"
	down_btn.custom_minimum_size = Vector2(40, 36)
	down_btn.add_theme_font_size_override("font_size", 18)
	down_btn.pressed.connect(_on_move_down.bind(rank))
	hbox.add_child(down_btn)
	
	var rank_label := Label.new()
	rank_label.text = "%d." % (rank + 1)
	rank_label.add_theme_font_size_override("font_size", 22)
	rank_label.add_theme_color_override("font_color", Color(0.15, 0.4, 0.9, 1))
	rank_label.custom_minimum_size = Vector2(36, 0)
	hbox.add_child(rank_label)
	
	var info_vbox := VBoxContainer.new()
	info_vbox.add_theme_constant_override("separation", 4)
	info_vbox.size_flags_horizontal = 3
	hbox.add_child(info_vbox)
	
	var name_label := Label.new()
	name_label.text = course.get("name", "")
	name_label.add_theme_font_size_override("font_size", 18)
	name_label.add_theme_color_override("font_color", Color(0.1, 0.2, 0.4, 1))
	info_vbox.add_child(name_label)
	
	var prereqs = course.get("prerequisites", [])
	var prereq_text := "无先修课程"
	if prereqs.size() > 0:
		var prereq_names: Array = []
		for pid in prereqs:
			for c in course_items:
				if c.get("id", "") == pid:
					prereq_names.append(c.get("name", ""))
		prereq_text = "先修: " + ", ".join(prereq_names)
	var prereq_label := Label.new()
	prereq_label.text = prereq_text + "  |  第%d学期" % course.get("semester", 1)
	prereq_label.add_theme_font_size_override("font_size", 14)
	prereq_label.add_theme_color_override("font_color", Color(0.4, 0.45, 0.55, 1))
	info_vbox.add_child(prereq_label)
	
	return panel

func _on_move_up(rank: int) -> void:
	if rank <= 0:
		return
	var temp = current_order[rank]
	current_order[rank] = current_order[rank - 1]
	current_order[rank - 1] = temp
	_build_sort_list()

func _on_move_down(rank: int) -> void:
	if rank >= current_order.size() - 1:
		return
	var temp = current_order[rank]
	current_order[rank] = current_order[rank + 1]
	current_order[rank + 1] = temp
	_build_sort_list()

func _process(delta: float) -> void:
	if timer_active and time_remaining > 0:
		time_remaining -= delta
		if time_remaining <= 0:
			time_remaining = 0
			timer_active = false
			_on_time_up()
		_update_timer_label()

func _update_timer_label() -> void:
	if timer_active:
		var minutes := int(time_remaining) / 60
		var seconds := int(time_remaining) % 60
		timer_label.text = "剩余时间: %02d:%02d" % [minutes, seconds]
		if time_remaining < 30:
			timer_label.add_theme_color_override("font_color", Color(0.85, 0.2, 0.2))
		else:
			timer_label.add_theme_color_override("font_color", Color(0.1, 0.4, 0.8))
	else:
		timer_label.text = "练习模式 (不限时)"
		timer_label.add_theme_color_override("font_color", Color(0.4, 0.45, 0.55))

func _on_time_up() -> void:
	hint_label.text = "时间已到！系统将自动提交..."
	hint_label.add_theme_color_override("font_color", Color(0.85, 0.2, 0.2))
	submit_button.disabled = true
	await get_tree().create_timer(1.0).timeout
	_on_submit_pressed()

func _on_submit_pressed() -> void:
	submit_button.disabled = true
	var correct_order = level_data.get("correct_order", [])
	var answers: Array = []
	var correct_count := 0
	var total_checks := 0
	var error_details: Array = []
	
	var user_order_ids: Array = []
	for idx in current_order:
		user_order_ids.append(course_items[idx].get("id", ""))
	
	for pos in range(user_order_ids.size()):
		total_checks += 1
		if pos < correct_order.size():
			if user_order_ids[pos] == correct_order[pos]:
				correct_count += 1
			else:
				var course_name = ""
				for c in course_items:
					if c.get("id", "") == user_order_ids[pos]:
						course_name = c.get("name", "")
				error_details.append("第%d位应为「%s」，实际排了「%s」" % [
					pos + 1,
					_get_course_name(correct_order[pos]),
					course_name
				])
	
	answers = [{"user_order": user_order_ids, "correct_order": correct_order}]
	
	var score: int = int(float(correct_count) / float(max(total_checks, 1)) * 100)
	var duration: float = Time.get_unix_time_from_system() - start_time
	
	if error_details.size() > 0:
		var msg = "排序有误：\n"
		for d in error_details:
			msg += "  • " + d + "\n"
		_show_missing_reason(msg)
	
	await get_tree().create_timer(0.5).timeout
	var result = GameManager.complete_level(answers, score, duration)
	result["error_details"] = error_details
	SceneManager.show_result(result)

func _get_course_name(course_id: String) -> String:
	for c in course_items:
		if c.get("id", "") == course_id:
			return c.get("name", "")
	return course_id

func _show_missing_reason(message: String) -> void:
	var dialog := AcceptDialog.new()
	dialog.title = "排序结果提示"
	dialog.dialog_text = message
	dialog.ok_button_text = "查看成绩"
	add_child(dialog)
	dialog.popup_centered()

func _on_back_pressed() -> void:
	SceneManager.go_back()
