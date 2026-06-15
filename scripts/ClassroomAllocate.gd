extends Control

@onready var back_button: Button = $TopBar/MarginContainer/HBoxContainer/BackButton
@onready var title_label: Label = $TopBar/MarginContainer/HBoxContainer/TitleLabel
@onready var timer_label: Label = $TopBar/MarginContainer/HBoxContainer/TimerLabel
@onready var level_name_label: Label = $MarginContainer/VBoxContainer/LevelNameLabel
@onready var desc_label: Label = $MarginContainer/VBoxContainer/DescLabel
@onready var allocation_container: VBoxContainer = $MarginContainer/VBoxContainer/ScrollContainer/AllocationContainer
@onready var submit_button: Button = $MarginContainer/VBoxContainer/SubmitButton
@onready var hint_label: Label = $MarginContainer/VBoxContainer/HintLabel

var level_data: Dictionary = {}
var course_options: Dictionary = {}
var time_remaining: float = 0.0
var timer_active: bool = false
var start_time: float = 0.0

func _ready() -> void:
	level_data = GameManager.current_level
	if level_data.is_empty():
		level_data = GameManager.start_level("classroom_allocate", 0)
	_setup_level()
	back_button.pressed.connect(_on_back_pressed)
	submit_button.pressed.connect(_on_submit_pressed)

func _setup_level() -> void:
	title_label.text = "教室资源处理"
	level_name_label.text = level_data.get("name", "未知关卡")
	desc_label.text = level_data.get("description", "")
	time_remaining = float(level_data.get("time_limit", 150))
	start_time = Time.get_unix_time_from_system()
	var current_mode = GameManager.game_config.get("current_mode", "practice")
	timer_active = current_mode != "practice"
	_update_timer_label()
	_build_allocation_list()

func _build_allocation_list() -> void:
	for child in allocation_container.get_children():
		child.queue_free()
	course_options.clear()
	
	var classrooms = level_data.get("classrooms", [])
	var courses = level_data.get("courses", [])
	
	var room_panel := _create_classrooms_panel(classrooms)
	allocation_container.add_child(room_panel)
	
	var divider := ColorRect.new()
	divider.custom_minimum_size = Vector2(0, 2)
	divider.color = Color(0.8, 0.85, 0.9, 1)
	allocation_container.add_child(divider)
	
	for i in range(courses.size()):
		var course = courses[i]
		var row := _create_allocation_row(course, classrooms, i)
		allocation_container.add_child(row)

func _create_classrooms_panel(classrooms: Array) -> PanelContainer:
	var panel := PanelContainer.new()
	
	var margin := MarginContainer.new()
	margin.add_theme_constant_override("margin_left", 16)
	margin.add_theme_constant_override("margin_top", 12)
	margin.add_theme_constant_override("margin_right", 16)
	margin.add_theme_constant_override("margin_bottom", 12)
	panel.add_child(margin)
	
	var vbox := VBoxContainer.new()
	vbox.add_theme_constant_override("separation", 6)
	margin.add_child(vbox)
	
	var title := Label.new()
	title.text = "可用教室资源"
	title.add_theme_font_size_override("font_size", 20)
	title.add_theme_color_override("font_color", Color(0.1, 0.25, 0.55, 1))
	vbox.add_child(title)
	
	for room in classrooms:
		var room_label := Label.new()
		room_label.text = "  %s | 容量: %d | 设备: %s" % [
			room.get("name", ""),
			room.get("capacity", 0),
			", ".join(room.get("equipment", []))
		]
		room_label.add_theme_font_size_override("font_size", 15)
		room_label.add_theme_color_override("font_color", Color(0.3, 0.35, 0.45, 1))
		room_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		vbox.add_child(room_label)
	
	return panel

func _create_allocation_row(course: Dictionary, classrooms: Array, index: int) -> PanelContainer:
	var panel := PanelContainer.new()
	
	var margin := MarginContainer.new()
	margin.add_theme_constant_override("margin_left", 16)
	margin.add_theme_constant_override("margin_top", 12)
	margin.add_theme_constant_override("margin_right", 16)
	margin.add_theme_constant_override("margin_bottom", 12)
	panel.add_child(margin)
	
	var vbox := VBoxContainer.new()
	vbox.add_theme_constant_override("separation", 8)
	margin.add_child(vbox)
	
	var name_label := Label.new()
	name_label.text = course.get("name", "")
	name_label.add_theme_font_size_override("font_size", 18)
	name_label.add_theme_color_override("font_color", Color(0.1, 0.2, 0.4, 1))
	vbox.add_child(name_label)
	
	var info_label := Label.new()
	info_label.text = "学生: %d人 | 需要设备: %s | 时间: %s" % [
		course.get("students", 0),
		", ".join(course.get("needs_equipment", [])),
		course.get("time_slot", "")
	]
	info_label.add_theme_font_size_override("font_size", 14)
	info_label.add_theme_color_override("font_color", Color(0.4, 0.45, 0.55, 1))
	vbox.add_child(info_label)
	
	var select_hbox := HBoxContainer.new()
	select_hbox.add_theme_constant_override("separation", 8)
	vbox.add_child(select_hbox)
	
	var select_label := Label.new()
	select_label.text = "分配教室: "
	select_label.add_theme_font_size_override("font_size", 16)
	select_hbox.add_child(select_label)
	
	var option_btn := OptionButton.new()
	option_btn.add_item("请选择教室", 0)
	for j in range(classrooms.size()):
		option_btn.add_item(classrooms[j].get("name", ""), j + 1)
	option_btn.add_theme_font_size_override("font_size", 16)
	option_btn.custom_minimum_size = Vector2(280, 40)
	select_hbox.add_child(option_btn)
	
	course_options[index] = {"option": option_btn, "course": course}
	
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
	
	var classrooms = level_data.get("classrooms", [])
	var optimal = level_data.get("optimal_allocation", {})
	
	var allocated_rooms: Array = []
	
	for key in course_options:
		var data = course_options[key]
		var option_btn: OptionButton = data["option"]
		var course: Dictionary = data["course"]
		var selected_idx = option_btn.selected - 1
		
		total_checks += 1
		
		if selected_idx < 0:
			error_details.append("课程「%s」未分配教室" % course.get("name", ""))
			answers.append({
				"course": course.get("id", ""),
				"selected_room": "",
				"correct_room": optimal.get(course.get("id", ""), "")
			})
			continue
		
		var selected_room_id = classrooms[selected_idx].get("id", "")
		var correct_room_id = optimal.get(course.get("id", ""), "")
		
		if selected_room_id in allocated_rooms:
			error_details.append("教室「%s」被重复分配" % classrooms[selected_idx].get("name", ""))
		else:
			allocated_rooms.append(selected_room_id)
		
		var is_correct = (selected_room_id == correct_room_id)
		if is_correct:
			correct_count += 1
		else:
			var reason = _analyze_allocation_error(course, classrooms[selected_idx], classrooms, optimal)
			error_details.append("课程「%s」: %s" % [course.get("name", ""), reason])
		
		answers.append({
			"course": course.get("id", ""),
			"selected_room": selected_room_id,
			"correct_room": correct_room_id,
			"is_correct": is_correct
		})
	
	var score: int = int(float(correct_count) / float(max(total_checks, 1)) * 100)
	var duration: float = Time.get_unix_time_from_system() - start_time
	
	if error_details.size() > 0:
		var msg = "分配有误：\n"
		for d in error_details:
			msg += "  • " + d + "\n"
		_show_missing_reason(msg)
	
	await get_tree().create_timer(0.5).timeout
	var result = GameManager.complete_level(answers, score, duration)
	result["error_details"] = error_details
	SceneManager.show_result(result)

func _analyze_allocation_error(course: Dictionary, selected_room: Dictionary, classrooms: Array, optimal: Dictionary) -> String:
	var correct_room_id = optimal.get(course.get("id", ""), "")
	var correct_room: Dictionary = {}
	for room in classrooms:
		if room.get("id", "") == correct_room_id:
			correct_room = room
			break
	
	var reasons: Array = []
	if selected_room.get("capacity", 0) < course.get("students", 0):
		reasons.append("容量不足(需要%d,仅有%d)" % [course.get("students", 0), selected_room.get("capacity", 0)])
	
	var needs = course.get("needs_equipment", [])
	var equip = selected_room.get("equipment", [])
	for n in needs:
		if not n in equip:
			reasons.append("缺少设备「%s」" % n)
	
	if reasons.size() == 0:
		reasons.append("不是最优分配(推荐: %s)" % correct_room.get("name", ""))
	
	return "，".join(reasons)

func _show_missing_reason(message: String) -> void:
	var dialog := AcceptDialog.new()
	dialog.title = "分配结果提示"
	dialog.dialog_text = message
	dialog.ok_button_text = "查看成绩"
	add_child(dialog)
	dialog.popup_centered()

func _on_back_pressed() -> void:
	SceneManager.go_back()
