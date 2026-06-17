extends Control

var _last_stats: Dictionary = {}

@onready var score_value: Label = $TopBar/TopHBox/ScorePanel/ScoreValue
@onready var timer_value: Label = $TopBar/TopHBox/TimerPanel/TimerValue
@onready var combo_value: Label = $TopBar/TopHBox/ComboPanel/ComboValue
@onready var progress_value: Label = $TopBar/TopHBox/ProgressPanel/ProgressValue

@onready var task_type_badge: Label = $CenterContainer/TaskCard/CardVBox/TaskTypeBadge
@onready var task_title: Label = $CenterContainer/TaskCard/CardVBox/TaskTitle
@onready var house_number: Label = $CenterContainer/TaskCard/CardVBox/HouseNumber
@onready var hint_label: Label = $CenterContainer/TaskCard/CardVBox/HintLabel

@onready var task_content: VBoxContainer = $CenterContainer/TaskCard/CardVBox/TaskContent

@onready var btn_option1: Button = $CenterContainer/TaskCard/CardVBox/ButtonsHBox/BtnOption1
@onready var btn_option2: Button = $CenterContainer/TaskCard/CardVBox/ButtonsHBox/BtnOption2

@onready var pause_overlay: ColorRect = $PauseOverlay
@onready var game_over_overlay: ColorRect = $GameOverOverlay
@onready var result_title: Label = $GameOverOverlay/GameOverPanel/GameOverVBox/ResultTitle
@onready var result_score: Label = $GameOverOverlay/GameOverPanel/GameOverVBox/ResultScore
@onready var satisfaction_value: Label = $GameOverOverlay/GameOverPanel/GameOverVBox/SatisfactionBar/SatisfactionValue
@onready var stat_correct_value: Label = $GameOverOverlay/GameOverPanel/GameOverVBox/StatsGrid/StatCorrectValue
@onready var stat_wrong_value: Label = $GameOverOverlay/GameOverPanel/GameOverVBox/StatsGrid/StatWrongValue
@onready var stat_accuracy_value: Label = $GameOverOverlay/GameOverPanel/GameOverVBox/StatsGrid/StatAccuracyValue
@onready var stat_combo_value: Label = $GameOverOverlay/GameOverPanel/GameOverVBox/StatsGrid/StatComboValue
@onready var task_card: PanelContainer = $CenterContainer/TaskCard

func _ready() -> void:
	GameManager.game_state_changed.connect(_on_game_state_changed)
	GameManager.game_over.connect(_on_game_over)
	
	_refresh_ui()

func _process(delta: float) -> void:
	if GameManager.is_playing and not GameManager.is_paused:
		GameManager.update_timer(delta)

func _refresh_ui() -> void:
	score_value.text = str(GameManager.score)
	timer_value.text = str(int(ceil(GameManager.time_remaining)))
	combo_value.text = str(GameManager.combo)
	progress_value.text = "%d/%d" % [GameManager.current_task_index, GameManager.tasks.size()]
	
	var task = GameManager.get_current_task()
	if not task.is_empty():
		_display_task(task)

func _display_task(task: Dictionary) -> void:
	task_type_badge.text = _get_task_type_name(task.type)
	task_title.text = task.title
	hint_label.text = "提示：" + task.hint
	
	for child in task_content.get_children():
		child.queue_free()
	
	match task.type:
		"WATER_METER":
			_display_water_meter_task(task)
		"APPROVAL":
			_display_approval_task(task)
		"HOUSE_ARCHIVE":
			_display_house_archive_task(task)
	
	btn_option1.text = task.options[0].text
	btn_option2.text = task.options[1].text
	
	if SettingsManager.animation_enabled:
		_play_card_enter_animation()

func _get_task_type_name(task_type: String) -> String:
	match task_type:
		"WATER_METER":
			return "💧 水电读数"
		"APPROVAL":
			return "📋 审批意见"
		"HOUSE_ARCHIVE":
			return "🏠 房屋档案"
		_:
			return ""

func _display_water_meter_task(task: Dictionary) -> void:
	house_number.text = task.house_number
	
	var water_label = Label.new()
	water_label.text = "💧 水表读数"
	water_label.add_theme_font_size_override("font_size", 18)
	water_label.add_theme_color_override("font_color", Color(0.3, 0.3, 0.3, 1))
	water_label.custom_minimum_size = Vector2(140, 0)
	var water_val = Label.new()
	water_val.text = "上次: %d  本次: %d" % [task.last_water_reading, task.current_water_reading]
	water_val.add_theme_font_size_override("font_size", 18)
	water_val.add_theme_color_override("font_color", Color(0.2, 0.4, 0.7, 1))
	var water_hbox = HBoxContainer.new()
	water_hbox.alignment = BoxContainer.AlignmentMode.ALIGNMENT_CENTER
	water_hbox.add_theme_constant_override("separation", 20)
	water_hbox.add_child(water_label)
	water_hbox.add_child(water_val)
	task_content.add_child(water_hbox)
	
	var electric_label = Label.new()
	electric_label.text = "⚡ 电表读数"
	electric_label.add_theme_font_size_override("font_size", 18)
	electric_label.add_theme_color_override("font_color", Color(0.3, 0.3, 0.3, 1))
	electric_label.custom_minimum_size = Vector2(140, 0)
	var electric_val = Label.new()
	electric_val.text = "上次: %d  本次: %d" % [task.last_electric_reading, task.current_electric_reading]
	electric_val.add_theme_font_size_override("font_size", 18)
	electric_val.add_theme_color_override("font_color", Color(0.9, 0.6, 0.2, 1))
	var electric_hbox = HBoxContainer.new()
	electric_hbox.alignment = BoxContainer.AlignmentMode.ALIGNMENT_CENTER
	electric_hbox.add_theme_constant_override("separation", 20)
	electric_hbox.add_child(electric_label)
	electric_hbox.add_child(electric_val)
	task_content.add_child(electric_hbox)

func _display_approval_task(task: Dictionary) -> void:
	house_number.text = "申请人：" + task.applicant
	
	var item_label = Label.new()
	item_label.text = "装修项目"
	item_label.add_theme_font_size_override("font_size", 16)
	item_label.add_theme_color_override("font_color", Color(0.5, 0.5, 0.5, 1))
	item_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	task_content.add_child(item_label)
	
	var item_val = Label.new()
	item_val.text = task.decoration_item
	item_val.add_theme_font_size_override("font_size", 22)
	item_val.add_theme_color_override("font_color", Color(0.2, 0.4, 0.7, 1))
	item_val.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	task_content.add_child(item_val)
	
	var spacer = Control.new()
	spacer.custom_minimum_size = Vector2(0, 10)
	task_content.add_child(spacer)
	
	var grid_wrapper = CenterContainer.new()
	task_content.add_child(grid_wrapper)
	
	var grid = GridContainer.new()
	grid.columns = 2
	grid.add_theme_constant_override("h_separation", 30)
	grid.add_theme_constant_override("v_separation", 8)
	grid_wrapper.add_child(grid)
	
	var permit_label = Label.new()
	permit_label.text = "装修许可证:"
	permit_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	permit_label.add_theme_font_size_override("font_size", 16)
	permit_label.add_theme_color_override("font_color", Color(0.4, 0.4, 0.4, 1))
	grid.add_child(permit_label)
	
	var permit_val = Label.new()
	permit_val.text = "✓ 已提供" if task.has_permit else "✗ 未提供"
	permit_val.add_theme_color_override("font_color", Color(0.3, 0.7, 0.3, 1) if task.has_permit else Color(0.9, 0.3, 0.3, 1))
	permit_val.add_theme_font_size_override("font_size", 16)
	grid.add_child(permit_val)
	
	var deposit_label = Label.new()
	deposit_label.text = "装修押金:"
	deposit_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	deposit_label.add_theme_font_size_override("font_size", 16)
	deposit_label.add_theme_color_override("font_color", Color(0.4, 0.4, 0.4, 1))
	grid.add_child(deposit_label)
	
	var deposit_val = Label.new()
	deposit_val.text = "✓ 已缴纳 (%d元)" % task.deposit_fee if task.deposit_paid else "✗ 未缴纳"
	deposit_val.add_theme_color_override("font_color", Color(0.3, 0.7, 0.3, 1) if task.deposit_paid else Color(0.9, 0.3, 0.3, 1))
	deposit_val.add_theme_font_size_override("font_size", 16)
	grid.add_child(deposit_val)

func _display_house_archive_task(task: Dictionary) -> void:
	house_number.text = task.house_number
	
	var title_label = Label.new()
	title_label.text = "租户申报信息"
	title_label.add_theme_font_size_override("font_size", 16)
	title_label.add_theme_color_override("font_color", Color(0.5, 0.5, 0.5, 1))
	title_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	task_content.add_child(title_label)
	
	var grid_wrapper = CenterContainer.new()
	task_content.add_child(grid_wrapper)
	
	var grid = GridContainer.new()
	grid.columns = 2
	grid.add_theme_constant_override("h_separation", 30)
	grid.add_theme_constant_override("v_separation", 8)
	grid_wrapper.add_child(grid)
	
	var owner_label = Label.new()
	owner_label.text = "业主姓名:"
	owner_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	owner_label.add_theme_font_size_override("font_size", 16)
	owner_label.add_theme_color_override("font_color", Color(0.4, 0.4, 0.4, 1))
	grid.add_child(owner_label)
	
	var owner_val = Label.new()
	owner_val.text = task.display_owner
	owner_val.add_theme_font_size_override("font_size", 16)
	owner_val.add_theme_color_override("font_color", Color(0.2, 0.2, 0.2, 1))
	grid.add_child(owner_val)
	
	var area_label = Label.new()
	area_label.text = "房屋面积:"
	area_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	area_label.add_theme_font_size_override("font_size", 16)
	area_label.add_theme_color_override("font_color", Color(0.4, 0.4, 0.4, 1))
	grid.add_child(area_label)
	
	var area_val = Label.new()
	area_val.text = "%d ㎡" % task.display_area
	area_val.add_theme_font_size_override("font_size", 16)
	area_val.add_theme_color_override("font_color", Color(0.2, 0.2, 0.2, 1))
	grid.add_child(area_val)
	
	var deco_label = Label.new()
	deco_label.text = "装修记录:"
	deco_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	deco_label.add_theme_font_size_override("font_size", 16)
	deco_label.add_theme_color_override("font_color", Color(0.4, 0.4, 0.4, 1))
	grid.add_child(deco_label)
	
	var deco_val = Label.new()
	deco_val.text = "有" if task.display_has_decoration else "无"
	deco_val.add_theme_font_size_override("font_size", 16)
	deco_val.add_theme_color_override("font_color", Color(0.2, 0.2, 0.2, 1))
	grid.add_child(deco_val)

func _play_card_enter_animation() -> void:
	if not SettingsManager.animation_enabled:
		return
	task_card.scale = Vector2(0.95, 0.95)
	task_card.modulate.a = 0.0
	var tween = create_tween()
	tween.set_ease(Tween.EASE_OUT)
	tween.set_trans(Tween.TRANS_BACK)
	tween.tween_property(task_card, "scale", Vector2(1.0, 1.0), 0.2)
	tween.parallel().tween_property(task_card, "modulate:a", 1.0, 0.15)

func _play_correct_animation() -> void:
	if not SettingsManager.animation_enabled:
		return
	var tween = create_tween()
	tween.set_ease(Tween.EASE_OUT)
	tween.tween_property(task_card, "modulate", Color(0.7, 1.0, 0.7, 1.0), 0.1)
	tween.tween_property(task_card, "modulate", Color(1.0, 1.0, 1.0, 1.0), 0.15)

func _play_wrong_animation() -> void:
	if not SettingsManager.animation_enabled:
		return
	var tween = create_tween()
	tween.set_ease(Tween.EASE_OUT)
	tween.tween_property(task_card, "modulate", Color(1.0, 0.7, 0.7, 1.0), 0.1)
	tween.tween_property(task_card, "modulate", Color(1.0, 1.0, 1.0, 1.0), 0.15)
	
	task_card.position.x = 0
	var shake_tween = create_tween()
	shake_tween.set_loops(3)
	shake_tween.tween_property(task_card, "position:x", -10.0, 0.05)
	shake_tween.tween_property(task_card, "position:x", 10.0, 0.05)
	shake_tween.tween_property(task_card, "position:x", 0.0, 0.05)

func _on_game_state_changed() -> void:
	_refresh_ui()

func _on_game_over(win: bool, stats: Dictionary) -> void:
	_last_stats = stats
	_show_game_over(win, stats)
	AudioManager.play_complete_sfx()

func _show_game_over(win: bool, stats: Dictionary) -> void:
	game_over_overlay.visible = true
	if win:
		result_title.text = "🎉 关卡完成！"
		result_title.add_theme_color_override("font_color", Color(0.2, 0.6, 0.3, 1))
	else:
		result_title.text = "⏰ 时间到！"
		result_title.add_theme_color_override("font_color", Color(0.9, 0.3, 0.3, 1))
	
	result_score.text = "得分: %d" % stats.score
	satisfaction_value.text = "%d%%" % stats.satisfaction
	stat_correct_value.text = str(stats.correct_count)
	stat_wrong_value.text = str(stats.wrong_count)
	stat_accuracy_value.text = "%d%%" % int(stats.accuracy * 100)
	stat_combo_value.text = str(stats.combo)

func _on_option1_pressed() -> void:
	AudioManager.play_click_sfx()
	var task = GameManager.get_current_task()
	var is_correct = task.options[0].is_correct
	if is_correct:
		_play_correct_animation()
	else:
		_play_wrong_animation()
	GameManager.submit_answer(0)

func _on_option2_pressed() -> void:
	AudioManager.play_click_sfx()
	var task = GameManager.get_current_task()
	var is_correct = task.options[1].is_correct
	if is_correct:
		_play_correct_animation()
	else:
		_play_wrong_animation()
	GameManager.submit_answer(1)

func _on_pause_btn_pressed() -> void:
	AudioManager.play_click_sfx()
	GameManager.pause_game()
	pause_overlay.visible = true

func _on_resume_pressed() -> void:
	AudioManager.play_click_sfx()
	GameManager.resume_game()
	pause_overlay.visible = false

func _on_restart_pressed() -> void:
	AudioManager.play_click_sfx()
	pause_overlay.visible = false
	game_over_overlay.visible = false
	GameManager.restart_level()

func _on_quit_pressed() -> void:
	AudioManager.play_click_sfx()
	get_tree().change_scene_to_file("res://scenes/main_menu.tscn")

func _on_retry_pressed() -> void:
	AudioManager.play_click_sfx()
	game_over_overlay.visible = false
	GameManager.restart_level()

func _on_review_pressed() -> void:
	AudioManager.play_click_sfx()
	get_tree().change_scene_to_file("res://scenes/review.tscn")

func _on_back_to_menu_pressed() -> void:
	AudioManager.play_click_sfx()
	get_tree().change_scene_to_file("res://scenes/main_menu.tscn")
