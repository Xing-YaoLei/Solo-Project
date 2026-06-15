extends Control

@onready var back_button: Button = $TopBar/MarginContainer/HBoxContainer/BackButton
@onready var title_label: Label = $TopBar/MarginContainer/HBoxContainer/TitleLabel
@onready var timer_label: Label = $TopBar/MarginContainer/HBoxContainer/TimerLabel
@onready var level_name_label: Label = $MarginContainer/VBoxContainer/LevelNameLabel
@onready var desc_label: Label = $MarginContainer/VBoxContainer/DescLabel
@onready var records_container: VBoxContainer = $MarginContainer/VBoxContainer/ScrollContainer/RecordsContainer
@onready var questions_container: VBoxContainer = $MarginContainer/VBoxContainer/QuestionsContainer
@onready var submit_button: Button = $MarginContainer/VBoxContainer/SubmitButton
@onready var hint_label: Label = $MarginContainer/VBoxContainer/HintLabel

var level_data: Dictionary = {}
var record_checkboxes: Dictionary = {}
var question_selections: Dictionary = {}
var time_remaining: float = 0.0
var timer_active: bool = false
var start_time: float = 0.0

func _ready() -> void:
	level_data = GameManager.current_level
	if level_data.is_empty():
		level_data = GameManager.start_level("approval_select", 0)
	_setup_level()
	back_button.pressed.connect(_on_back_pressed)
	submit_button.pressed.connect(_on_submit_pressed)

func _setup_level() -> void:
	title_label.text = "审批记录选择"
	level_name_label.text = level_data.get("name", "未知关卡")
	desc_label.text = level_data.get("description", "")
	time_remaining = float(level_data.get("time_limit", 100))
	start_time = Time.get_unix_time_from_system()
	var current_mode = GameManager.game_config.get("current_mode", "practice")
	timer_active = current_mode != "practice"
	_update_timer_label()
	_build_records_list()
	_build_questions()

func _build_records_list() -> void:
	for child in records_container.get_children():
		child.queue_free()
	record_checkboxes.clear()
	
	var records = level_data.get("records", [])
	for i in range(records.size()):
		var record = records[i]
		var row := _create_record_row(record, i)
		records_container.add_child(row)

func _create_record_row(record: Dictionary, index: int) -> PanelContainer:
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
	
	var header_hbox := HBoxContainer.new()
	header_hbox.add_theme_constant_override("separation", 12)
	vbox.add_child(header_hbox)
	
	var id_label := Label.new()
	id_label.text = record.get("id", "")
	id_label.add_theme_font_size_override("font_size", 14)
	id_label.add_theme_color_override("font_color", Color(0.4, 0.45, 0.55, 1))
	header_hbox.add_child(id_label)
	
	var status_label := Label.new()
	var status = record.get("status", "")
	match status:
		"approved":
			status_label.text = "[已通过]"
			status_label.add_theme_color_override("font_color", Color(0.1, 0.6, 0.2, 1))
		"pending":
			status_label.text = "[待审批]"
			status_label.add_theme_color_override("font_color", Color(0.85, 0.6, 0.1, 1))
		"rejected":
			status_label.text = "[已驳回]"
			status_label.add_theme_color_override("font_color", Color(0.85, 0.2, 0.2, 1))
	status_label.add_theme_font_size_override("font_size", 16)
	header_hbox.add_child(status_label)
	
	if record.get("urgent", false):
		var urgent_label := Label.new()
		urgent_label.text = "[紧急]"
		urgent_label.add_theme_color_override("font_color", Color(0.9, 0.1, 0.1, 1))
		urgent_label.add_theme_font_size_override("font_size", 16)
		header_hbox.add_child(urgent_label)
	
	var course_label := Label.new()
	course_label.text = "课程: %s  |  教材: %s  |  数量: %d" % [
		record.get("course", ""),
		record.get("textbook", ""),
		record.get("quantity", 0)
	]
	course_label.add_theme_font_size_override("font_size", 16)
	course_label.add_theme_color_override("font_color", Color(0.1, 0.2, 0.4, 1))
	vbox.add_child(course_label)
	
	var detail_text := "审批人: %s  |  日期: %s" % [
		record.get("approver", "无") if record.get("approver", "") != "" else "无",
		record.get("date", "")
	]
	if record.has("reason"):
		detail_text += "  |  原因: %s" % record["reason"]
	var detail_label := Label.new()
	detail_label.text = detail_text
	detail_label.add_theme_font_size_override("font_size", 14)
	detail_label.add_theme_color_override("font_color", Color(0.4, 0.45, 0.55, 1))
	detail_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	vbox.add_child(detail_label)
	
	return panel

func _build_questions() -> void:
	for child in questions_container.get_children():
		child.queue_free()
	question_selections.clear()
	
	var questions = level_data.get("questions", [])
	for i in range(questions.size()):
		var question = questions[i]
		question_selections[i] = {}
		var q_panel := _create_question_panel(question, i)
		questions_container.add_child(q_panel)

func _create_question_panel(question: Dictionary, q_index: int) -> PanelContainer:
	var panel := PanelContainer.new()
	
	var margin := MarginContainer.new()
	margin.add_theme_constant_override("margin_left", 16)
	margin.add_theme_constant_override("margin_top", 14)
	margin.add_theme_constant_override("margin_right", 16)
	margin.add_theme_constant_override("margin_bottom", 14)
	panel.add_child(margin)
	
	var vbox := VBoxContainer.new()
	vbox.add_theme_constant_override("separation", 10)
	margin.add_child(vbox)
	
	var q_label := Label.new()
	q_label.text = "问题 %d: %s" % [q_index + 1, question.get("q", "")]
	q_label.add_theme_font_size_override("font_size", 18)
	q_label.add_theme_color_override("font_color", Color(0.1, 0.2, 0.4, 1))
	q_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	vbox.add_child(q_label)
	
	var records = level_data.get("records", [])
	for j in range(records.size()):
		var record = records[j]
		var checkbox := CheckBox.new()
		checkbox.text = "%s - %s (%s)" % [record.get("id", ""), record.get("course", ""), record.get("status", "")]
		checkbox.add_theme_font_size_override("font_size", 16)
		question_selections[q_index][j] = checkbox
		vbox.add_child(checkbox)
	
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
	
	var questions = level_data.get("questions", [])
	for i in range(questions.size()):
		var question = questions[i]
		var correct_ids = question.get("correct", [])
		var selected_ids: Array = []
		
		var records = level_data.get("records", [])
		for j in range(records.size()):
			var checkbox = question_selections[i][j]
			if checkbox.button_pressed:
				selected_ids.append(records[j].get("id", ""))
		
		var is_correct = true
		for cid in correct_ids:
			if not cid in selected_ids:
				is_correct = false
				error_details.append("问题%d: 遗漏了记录「%s」" % [i + 1, cid])
		for sid in selected_ids:
			if not sid in correct_ids:
				is_correct = false
				error_details.append("问题%d: 误选了记录「%s」" % [i + 1, sid])
		
		total_checks += 1
		if is_correct:
			correct_count += 1
		answers.append({
			"question_index": i,
			"selected": selected_ids,
			"correct": correct_ids,
			"is_correct": is_correct
		})
	
	var score: int = int(float(correct_count) / float(max(total_checks, 1)) * 100)
	var duration: float = Time.get_unix_time_from_system() - start_time
	
	if error_details.size() > 0:
		var msg = "审批处理有误：\n"
		for d in error_details:
			msg += "  • " + d + "\n"
		_show_missing_reason(msg)
	
	await get_tree().create_timer(0.5).timeout
	var result = GameManager.complete_level(answers, score, duration)
	result["error_details"] = error_details
	SceneManager.show_result(result)

func _show_missing_reason(message: String) -> void:
	var dialog := AcceptDialog.new()
	dialog.title = "处理结果提示"
	dialog.dialog_text = message
	dialog.ok_button_text = "查看成绩"
	add_child(dialog)
	dialog.popup_centered()

func _on_back_pressed() -> void:
	SceneManager.go_back()
