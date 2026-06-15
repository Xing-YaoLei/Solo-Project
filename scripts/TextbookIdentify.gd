extends Control

@onready var back_button: Button = $TopBar/MarginContainer/HBoxContainer/BackButton
@onready var title_label: Label = $TopBar/MarginContainer/HBoxContainer/TitleLabel
@onready var timer_label: Label = $TopBar/MarginContainer/HBoxContainer/TimerLabel
@onready var level_name_label: Label = $MarginContainer/VBoxContainer/LevelNameLabel
@onready var desc_label: Label = $MarginContainer/VBoxContainer/DescLabel
@onready var courses_container: VBoxContainer = $MarginContainer/VBoxContainer/ScrollContainer/CoursesContainer
@onready var submit_button: Button = $MarginContainer/VBoxContainer/SubmitButton
@onready var hint_label: Label = $MarginContainer/VBoxContainer/HintLabel

var level_data: Dictionary = {}
var course_checkboxes: Dictionary = {}
var time_remaining: float = 0.0
var timer_active: bool = false
var start_time: float = 0.0

func _ready() -> void:
	level_data = GameManager.current_level
	if level_data.is_empty():
		level_data = GameManager.start_level("textbook_identify", 0)
	_setup_level()
	back_button.pressed.connect(_on_back_pressed)
	submit_button.pressed.connect(_on_submit_pressed)

func _setup_level() -> void:
	title_label.text = "教材清单识别"
	level_name_label.text = level_data.get("name", "未知关卡")
	desc_label.text = level_data.get("description", "")
	time_remaining = float(level_data.get("time_limit", 120))
	start_time = Time.get_unix_time_from_system()
	var current_mode = GameManager.game_config.get("current_mode", "practice")
	timer_active = current_mode != "practice"
	_update_timer_label()
	_build_course_list()

func _build_course_list() -> void:
	for child in courses_container.get_children():
		child.queue_free()
	course_checkboxes.clear()
	
	var courses = level_data.get("courses", [])
	for i in range(courses.size()):
		var course = courses[i]
		var row := _create_course_row(course, i)
		courses_container.add_child(row)

func _create_course_row(course: Dictionary, index: int) -> PanelContainer:
	var panel := PanelContainer.new()
	
	var margin := MarginContainer.new()
	margin.add_theme_constant_override("margin_left", 16)
	margin.add_theme_constant_override("margin_top", 14)
	margin.add_theme_constant_override("margin_right", 16)
	margin.add_theme_constant_override("margin_bottom", 14)
	panel.add_child(margin)
	
	var hbox := HBoxContainer.new()
	hbox.add_theme_constant_override("separation", 20)
	margin.add_child(hbox)
	
	var checkbox := CheckBox.new()
	checkbox.add_theme_font_size_override("font_size", 16)
	course_checkboxes[index] = checkbox
	hbox.add_child(checkbox)
	
	var info_vbox := VBoxContainer.new()
	info_vbox.add_theme_constant_override("separation", 6)
	info_vbox.size_flags_horizontal = 3
	hbox.add_child(info_vbox)
	
	var name_label := Label.new()
	name_label.text = course.get("name", "")
	name_label.add_theme_font_size_override("font_size", 18)
	name_label.add_theme_color_override("font_color", Color(0.1, 0.2, 0.4, 1))
	info_vbox.add_child(name_label)
	
	var detail_label := Label.new()
	var teacher = course.get("teacher", "")
	var students = course.get("students", 0)
	var textbook_info = ""
	if course.get("has_textbook", false):
		textbook_info = "  |  教材: %s (%s) ￥%.1f" % [
			course.get("textbook_name", ""),
			course.get("publisher", ""),
			course.get("price", 0.0)
		]
	detail_label.text = "授课教师: %s  |  学生人数: %d%s" % [teacher, students, textbook_info]
	detail_label.add_theme_font_size_override("font_size", 14)
	detail_label.add_theme_color_override("font_color", Color(0.4, 0.45, 0.55, 1))
	info_vbox.add_child(detail_label)
	
	return panel

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
	var answers: Array = []
	var correct_count := 0
	var total_checks := 0
	var error_details: Array = []
	
	var courses = level_data.get("courses", [])
	for i in range(courses.size()):
		var course = courses[i]
		var checked = course_checkboxes[i].button_pressed
		var should_order = course.get("has_textbook", false)
		total_checks += 1
		answers.append({"course_index": i, "selected": checked, "correct": should_order})
		
		if checked == should_order:
			correct_count += 1
		else:
			var reason = ""
			if checked and not should_order:
				reason = "课程「%s」不需要订购教材（实践类/体育类课程）" % course.get("name", "")
			elif not checked and should_order:
				reason = "课程「%s」需要订购教材但未选中" % course.get("name", "")
			error_details.append(reason)
	
	var score: int = int(float(correct_count) / float(total_checks) * 100)
	var duration: float = Time.get_unix_time_from_system() - start_time
	
	if error_details.size() > 0:
		var msg = "发现材料缺失或误选：\n"
		for d in error_details:
			msg += "  • " + d + "\n"
		_show_missing_reason(msg)
	
	await get_tree().create_timer(0.5).timeout
	var result = GameManager.complete_level(answers, score, duration)
	result["error_details"] = error_details
	SceneManager.show_result(result)

func _show_missing_reason(message: String) -> void:
	var dialog := AcceptDialog.new()
	dialog.title = "材料缺失提示"
	dialog.dialog_text = message
	dialog.ok_button_text = "查看成绩"
	add_child(dialog)
	dialog.popup_centered()

func _on_back_pressed() -> void:
	SceneManager.go_back()
