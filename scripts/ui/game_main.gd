extends Control

@onready var timer_label: Label = $MainContainer/TopBar/MarginContainer/HBoxContainer/TimerLabel
@onready var score_label: Label = $MainContainer/TopBar/MarginContainer/HBoxContainer/ScoreLabel
@onready var progress_label: Label = $MainContainer/TopBar/MarginContainer/HBoxContainer/ProgressLabel
@onready var combo_label: Label = $MainContainer/TopBar/MarginContainer/HBoxContainer/ComboLabel
@onready var pause_button: Button = $MainContainer/TopBar/MarginContainer/HBoxContainer/PauseButton

@onready var price_rules_container: VBoxContainer = $MainContainer/MainContent/LeftPanel/Content/PriceRulesContainer

@onready var task_description: Label = $MainContainer/MainContent/CenterPanel/VBoxContainer/TaskArea/Content/TaskDescription
@onready var task_hint: Label = $MainContainer/MainContent/CenterPanel/VBoxContainer/TaskArea/Content/TaskHint

@onready var packages_container: HBoxContainer = $MainContainer/MainContent/CenterPanel/VBoxContainer/PackagesArea/Content/PackagesContainer

@onready var calendar_header: Label = $MainContainer/MainContent/CenterPanel/VBoxContainer/DateArea/Content/CalendarNav/CalendarHeader
@onready var prev_month_button: Button = $MainContainer/MainContent/CenterPanel/VBoxContainer/DateArea/Content/CalendarNav/PrevMonthButton
@onready var next_month_button: Button = $MainContainer/MainContent/CenterPanel/VBoxContainer/DateArea/Content/CalendarNav/NextMonthButton
@onready var calendar_grid: GridContainer = $MainContainer/MainContent/CenterPanel/VBoxContainer/DateArea/Content/CalendarGrid
@onready var weekday_labels: Array = []

@onready var stay_days_spin: SpinBox = $MainContainer/MainContent/CenterPanel/VBoxContainer/OptionsArea/Content/StayDaysRow/StayDaysSpin
@onready var guest_count_spin: SpinBox = $MainContainer/MainContent/CenterPanel/VBoxContainer/OptionsArea/Content/GuestCountRow/GuestCountSpin

@onready var preview_base_price: Label = $MainContainer/MainContent/CenterPanel/VBoxContainer/PreviewArea/Content/PreviewBasePrice
@onready var preview_rules_container: VBoxContainer = $MainContainer/MainContent/CenterPanel/VBoxContainer/PreviewArea/Content/PreviewRulesContainer
@onready var preview_final_price: Label = $MainContainer/MainContent/CenterPanel/VBoxContainer/PreviewArea/Content/PreviewFinalPrice
@onready var preview_message: Label = $MainContainer/MainContent/CenterPanel/VBoxContainer/PreviewArea/Content/PreviewMessage

@onready var submit_button: Button = $MainContainer/MainContent/CenterPanel/VBoxContainer/SubmitButton

@onready var verification_records_container: VBoxContainer = $MainContainer/MainContent/RightPanel/Content/RecordsContainer

@onready var result_panel: Control = $MainContainer/ResultPanel
@onready var result_title: Label = $MainContainer/ResultPanel/Content/PanelContainer/MarginContainer/VBoxContainer/ResultTitle
@onready var result_score: Label = $MainContainer/ResultPanel/Content/PanelContainer/MarginContainer/VBoxContainer/ResultScore
@onready var result_stats: Label = $MainContainer/ResultPanel/Content/PanelContainer/MarginContainer/VBoxContainer/ResultStats
@onready var result_restart_button: Button = $MainContainer/ResultPanel/Content/PanelContainer/MarginContainer/VBoxContainer/RestartButton
@onready var result_back_button: Button = $MainContainer/ResultPanel/Content/PanelContainer/MarginContainer/VBoxContainer/BackButton

@onready var feedback_label: Label = $FeedbackLabel

var package_card_scene: PackedScene = preload("res://scenes/ui_components/package_card.tscn")
var price_rule_card_scene: PackedScene = preload("res://scenes/ui_components/price_rule_card.tscn")
var date_cell_scene: PackedScene = preload("res://scenes/ui_components/date_cell.tscn")
var verification_record_scene: PackedScene = preload("res://scenes/ui_components/verification_record.tscn")

var current_year: int = 2026
var current_month: int = 7
var selected_package_id: String = ""
var selected_date_str: String = ""
var date_cells: Dictionary = {}
var package_cards: Dictionary = {}

func _ready():
	GameManager.game_started.connect(_on_game_started)
	GameManager.game_completed.connect(_on_game_completed)
	GameManager.task_completed.connect(_on_task_completed)
	GameManager.timer_updated.connect(_on_timer_updated)
	
	GameData.package_selected.connect(_on_package_selected)
	GameData.date_selected.connect(_on_date_selected)
	GameData.verification_completed.connect(_on_verification_completed)
	
	pause_button.pressed.connect(_on_pause_pressed)
	submit_button.pressed.connect(_on_submit_pressed)
	result_restart_button.pressed.connect(_on_restart_pressed)
	result_back_button.pressed.connect(_on_back_pressed)
	prev_month_button.pressed.connect(_on_prev_month)
	next_month_button.pressed.connect(_on_next_month)
	
	stay_days_spin.value_changed.connect(_on_stay_days_changed)
	guest_count_spin.value_changed.connect(_on_guest_count_changed)
	
	_init_weekday_labels()
	_update_calendar()
	_update_preview()

func _init_weekday_labels():
	var weekdays = ["日", "一", "二", "三", "四", "五", "六"]
	for i in range(7):
		var label = Label.new()
		label.text = weekdays[i]
		label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		if i >= 5:
			label.add_theme_color_override("font_color", Color(0.95, 0.61, 0.07))
		calendar_grid.add_child(label)
		weekday_labels.append(label)

func _on_game_started(level_data):
	current_year = 2026
	current_month = 7
	selected_package_id = ""
	selected_date_str = ""
	feedback_label.visible = false
	result_panel.visible = false
	
	_load_price_rules(level_data)
	_load_packages(level_data)
	_update_calendar()
	_update_task()
	_update_progress()
	_update_records()
	_update_preview()

func _load_price_rules(level_data):
	for child in price_rules_container.get_children():
		child.queue_free()
	
	for rule_id in level_data.rules:
		var rule = GameData.get_rule(rule_id)
		if rule:
			var card = price_rule_card_scene.instantiate()
			card.setup(rule)
			price_rules_container.add_child(card)

func _load_packages(level_data):
	for child in packages_container.get_children():
		child.queue_free()
	package_cards.clear()
	
	for pkg_id in level_data.packages:
		var pkg = GameData.get_package(pkg_id)
		if pkg:
			var card = package_card_scene.instantiate()
			card.setup(pkg)
			card.selected.connect(_on_package_card_selected)
			packages_container.add_child(card)
			package_cards[pkg_id] = card

func _update_calendar():
	for child in calendar_grid.get_children():
		if child is VBoxContainer || child is Label:
			if child not in weekday_labels:
				child.queue_free()
	
	date_cells.clear()
	
	var dates = GameData.generate_dates_for_month(current_year, current_month)
	var first_day_of_week = dates[0].day_of_week if dates.size() > 0 else 0
	
	for i in range(first_day_of_week):
		var empty = Control.new()
		empty.custom_minimum_size = Vector2(80, 80)
		calendar_grid.add_child(empty)
	
	for date_data in dates:
		var cell = date_cell_scene.instantiate()
		cell.setup(date_data)
		cell.date_selected.connect(_on_date_cell_selected)
		calendar_grid.add_child(cell)
		date_cells[date_data.date] = cell
	
	calendar_header.text = "%d年%d月" % [current_year, current_month]
	_update_date_selection_visual()

func _update_date_selection_visual():
	for date_str in date_cells:
		var cell = date_cells[date_str]
		cell.set_selected(date_str == selected_date_str)

func _update_task():
	var task = GameManager.get_current_task()
	if task:
		task_description.text = task.description
		task_hint.text = task.hint if task.hint else ""
		task_hint.visible = task.hint != ""
	else:
		task_description.text = "没有更多任务了"
		task_hint.visible = false

func _update_progress():
	var progress = GameManager.get_progress()
	progress_label.text = "进度: %d/%d (%.0f%%)" % [
		progress["current_task"],
		progress["total_tasks"],
		progress["conversion_rate"] * 100
	]
	score_label.text = "分数: %d" % progress["score"]
	combo_label.text = "连击: x%d" % progress["combo"]
	combo_label.visible = progress["combo"] > 0

func _update_records():
	for child in verification_records_container.get_children():
		child.queue_free()
	
	for record in GameManager.verification_records:
		var record_item = verification_record_scene.instantiate()
		record_item.setup(record)
		verification_records_container.add_child(record_item)

func _update_preview():
	if not GameManager.is_game_active:
		preview_message.text = "游戏未开始"
		preview_message.visible = true
		preview_base_price.visible = false
		preview_rules_container.visible = false
		preview_final_price.visible = false
		return
	
	var preview = GameManager.get_current_preview()
	
	if not preview["valid"]:
		preview_message.text = preview["message"]
		preview_message.visible = true
		preview_base_price.visible = false
		preview_rules_container.visible = false
		preview_final_price.visible = false
		submit_button.disabled = true
		return
	
	preview_message.visible = false
	preview_base_price.visible = true
	preview_rules_container.visible = true
	preview_final_price.visible = true
	submit_button.disabled = false
	
	preview_base_price.text = "基础价格: ¥%.2f" % preview["base_price"]
	preview_final_price.text = "总价: ¥%.2f" % preview["final_price"]
	
	for child in preview_rules_container.get_children():
		child.queue_free()
	
	for breakdown in preview["breakdown"]:
		if breakdown["rule_name"] == "基础价格":
			continue
		
		var rule_label = Label.new()
		var effect_text = ""
		match breakdown["effect"]:
			GameData.RuleEffect.DISCOUNT_FIXED:
				effect_text = "-¥%.2f" % breakdown["value"]
				rule_label.add_theme_color_override("font_color", Color(0.18, 0.8, 0.44))
			GameData.RuleEffect.DISCOUNT_PERCENT:
				effect_text = "-%d%%" % int(breakdown["value"])
				rule_label.add_theme_color_override("font_color", Color(0.18, 0.8, 0.44))
			GameData.RuleEffect.SURCHARGE_FIXED:
				effect_text = "+¥%.2f" % breakdown["value"]
				rule_label.add_theme_color_override("font_color", Color(0.91, 0.3, 0.24))
			GameData.RuleEffect.SURCHARGE_PERCENT:
				effect_text = "+%d%%" % int(breakdown["value"])
				rule_label.add_theme_color_override("font_color", Color(0.91, 0.3, 0.24))
		
		rule_label.text = "  %s: %s  (¥%.2f → ¥%.2f)" % [
			breakdown["rule_name"],
			effect_text,
			breakdown["price_before"],
			breakdown["price_after"]
		]
		preview_rules_container.add_child(rule_label)

func _show_feedback(message: String, is_success: bool):
	feedback_label.text = message
	feedback_label.add_theme_color_override("font_color", Color(0.18, 0.8, 0.44) if is_success else Color(0.91, 0.3, 0.24))
	feedback_label.visible = true
	
	var tween = create_tween()
	tween.tween_property(feedback_label, "modulate:a", 1.0, 0.3)
	tween.tween_interval(2.0)
	tween.tween_property(feedback_label, "modulate:a", 0.0, 0.5)
	tween.tween_callback(feedback_label.set_visible.bind(false))

func _format_time(seconds: float) -> String:
	var mins = int(seconds) / 60
	var secs = int(seconds) % 60
	return "%02d:%02d" % [mins, secs]

func _on_package_card_selected(pkg_id: String):
	AudioManager.play_sfx("select")
	GameManager.select_package(pkg_id)

func _on_date_cell_selected(date_str: String):
	AudioManager.play_sfx("date_select")
	GameManager.select_date(date_str)

func _on_stay_days_changed(value):
	AudioManager.play_sfx("click")
	GameManager.set_stay_days(int(value))
	_update_preview()

func _on_guest_count_changed(value):
	AudioManager.play_sfx("click")
	GameManager.set_guest_count(int(value))
	_update_preview()

func _on_package_selected(package_data):
	selected_package_id = package_data.id if package_data else ""
	for pkg_id in package_cards:
		package_cards[pkg_id].set_selected(pkg_id == selected_package_id)
	
	if package_data:
		guest_count_spin.max_value = package_data.max_guests
		stay_days_spin.min_value = package_data.min_stay
	
	_update_preview()

func _on_date_selected(date_data):
	selected_date_str = date_data.date if date_data else ""
	_update_date_selection_visual()
	_update_preview()

func _on_verification_completed(result):
	_update_records()

func _on_timer_updated(time_remaining):
	timer_label.text = _format_time(time_remaining)
	
	if time_remaining < 30:
		timer_label.add_theme_color_override("font_color", Color(0.91, 0.3, 0.24))
	elif time_remaining < 60:
		timer_label.add_theme_color_override("font_color", Color(0.95, 0.61, 0.07))
	else:
		timer_label.add_theme_color_override("font_color", Color(0.95, 0.95, 0.95, 1))
	if int(time_remaining) == 30 or int(time_remaining) == 10:
		AudioManager.play_sfx("timer", 0.5)

func _on_task_completed(result):
	if result["is_correct"]:
		AudioManager.play_sfx("correct")
	else:
		AudioManager.play_sfx("wrong")
	_show_feedback(result["message"], result["is_correct"])
	_update_progress()
	_update_task()
	_update_preview()

func _on_game_completed(result):
	AudioManager.play_sfx("complete")
	result_panel.visible = true
	
	result_title.text = "恭喜通关！" if result["passed"] else "挑战失败"
	result_title.add_theme_color_override("font_color", Color(0.18, 0.8, 0.44) if result["passed"] else Color(0.91, 0.3, 0.24))
	
	result_score.text = "最终得分: %d" % result["score"]
	
	result_stats.text = "正确: %d/%d (%.0f%%)\n用时: %s / %s\n最大连击: x%d" % [
		result["correct_tasks"],
		result["total_tasks"],
		result["conversion_rate"] * 100,
		_format_time(result["time_taken"]),
		_format_time(result["time_limit"]),
		result["max_combo"]
	]

func _on_pause_pressed():
	AudioManager.play_sfx("click")
	if GameManager.is_paused:
		GameManager.resume_game()
		pause_button.text = "暂停"
	else:
		GameManager.pause_game()
		pause_button.text = "继续"

func _on_submit_pressed():
	AudioManager.play_sfx("click")
	GameManager.submit_selection()

func _on_restart_pressed():
	AudioManager.play_sfx("click")
	result_panel.visible = false
	if GameManager.current_level:
		GameManager.start_game(GameManager.current_level.id)

func _on_back_pressed():
	AudioManager.play_sfx("click")
	result_panel.visible = false
	get_tree().change_scene_to_file("res://scenes/main_menu.tscn")

func _on_prev_month():
	current_month -= 1
	if current_month < 1:
		current_month = 12
		current_year -= 1
	_update_calendar()

func _on_next_month():
	current_month += 1
	if current_month > 12:
		current_month = 1
		current_year += 1
	_update_calendar()
