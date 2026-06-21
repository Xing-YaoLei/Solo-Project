extends Control

@onready var back_button: Button = $TopBar/HBoxContainer/BackButton
@onready var summary_grid: GridContainer = $MainVBox/SummaryPanel/VBox/SummaryGrid
@onready var level_list: VBoxContainer = $MainVBox/HSplit/LevelPanel/VBox/LevelScroll/LevelList
@onready var recent_list: VBoxContainer = $MainVBox/HSplit/RecentPanel/VBox/RecentScroll/RecentList
@onready var clear_button: Button = $MainVBox/HSplit/RecentPanel/VBox/HBox/ClearButton

func _ready() -> void:
	back_button.pressed.connect(_on_back_pressed)
	clear_button.pressed.connect(_on_clear_pressed)
	_update_statistics()

func _update_statistics() -> void:
	_build_summary()
	_build_level_stats()
	_build_recent_records()

func _build_summary() -> void:
	for child in summary_grid.get_children():
		child.queue_free()
	
	var stats: Dictionary = TrainingRecord.get_statistics()
	
	var summary_items: Array = [
		{"label": "总练习次数", "value": str(stats.get("total_attempts", 0)), "color": Color(0.3, 0.6, 0.85)},
		{"label": "通关次数", "value": str(stats.get("total_passes", 0)), "color": Color(0.3, 0.7, 0.4)},
		{"label": "平均分数", "value": "%.1f" % stats.get("average_score", 0.0), "color": Color(0.8, 0.6, 0.3)},
		{"label": "平均到场率", "value": "%.1f%%" % stats.get("average_attendance", 0.0), "color": Color(0.6, 0.4, 0.7)},
		{"label": "已解锁关卡", "value": "%d / %d" % [stats.get("unlocked_levels", 0), DataManager.get_levels().size()], "color": Color(0.2, 0.5, 0.4)},
	]
	
	for item in summary_items:
		var label: Label = Label.new()
		label.text = item.get("label", "")
		label.add_theme_font_size_override("font_size", 14)
		label.add_theme_color_override("font_color", Color(0.5, 0.5, 0.5))
		label.horizontal_alignment = 1
		summary_grid.add_child(label)
		
		var value: Label = Label.new()
		value.text = item.get("value", "")
		value.add_theme_font_size_override("font_size", 22)
		value.add_theme_color_override("font_color", item.get("color", Color(0.2, 0.3, 0.5)))
		value.horizontal_alignment = 1
		value.custom_minimum_size = Vector2(0, 35)
		summary_grid.add_child(value)

func _build_level_stats() -> void:
	for child in level_list.get_children():
		child.queue_free()
	
	var levels: Array = DataManager.get_levels()
	
	for level in levels:
		var level_id: int = level.get("id", 0)
		var best: Dictionary = TrainingRecord.get_best_score(level_id)
		var is_unlocked: bool = TrainingRecord.is_level_unlocked(level_id)
		
		var panel: Panel = Panel.new()
		panel.custom_minimum_size = Vector2(0, 70)
		if not is_unlocked:
			panel.modulate = Color(0.85, 0.85, 0.85, 0.6)
		
		var hbox: HBoxContainer = HBoxContainer.new()
		hbox.offset_left = 12
		hbox.offset_top = 8
		hbox.offset_right = -12
		hbox.offset_bottom = -8
		hbox.anchor_right = 1.0
		hbox.anchor_bottom = 1.0
		hbox.add_theme_constant_override("separation", 15)
		
		var level_info: VBoxContainer = VBoxContainer.new()
		level_info.size_flags_horizontal = SIZE_EXPAND_FILL
		
		var name_label: Label = Label.new()
		name_label.text = "第%d关: %s" % [level_id, level.get("name", "")]
		name_label.add_theme_font_size_override("font_size", 15)
		name_label.add_theme_color_override("font_color", Color(0.2, 0.3, 0.5))
		level_info.add_child(name_label)
		
		var diff_label: Label = Label.new()
		var stars: String = "★" * level.get("difficulty", 1)
		diff_label.text = "难度: %s  |  及格分: %d" % [stars, level.get("required_score", 60)]
		diff_label.add_theme_font_size_override("font_size", 11)
		diff_label.add_theme_color_override("font_color", Color(0.7, 0.55, 0.2))
		level_info.add_child(diff_label)
		
		if best.get("attempts", 0) > 0:
			var detail_label: Label = Label.new()
			detail_label.text = "最高分: %.1f  |  到场率: %.1f%%  |  尝试: %d次  |  通过: %d次" % [
				best.get("score", 0.0),
				best.get("attendance_rate", 0.0),
				best.get("attempts", 0),
				best.get("pass_count", 0)
			]
			detail_label.add_theme_font_size_override("font_size", 11)
			detail_label.add_theme_color_override("font_color", Color(0.4, 0.5, 0.6))
			level_info.add_child(detail_label)
		else:
			var detail_label: Label = Label.new()
			detail_label.text = "尚未练习" if is_unlocked else "未解锁"
			detail_label.add_theme_font_size_override("font_size", 11)
			detail_label.add_theme_color_override("font_color", Color(0.6, 0.6, 0.6))
			level_info.add_child(detail_label)
		
		hbox.add_child(level_info)
		
		var score_bar: VBoxContainer = VBoxContainer.new()
		score_bar.custom_minimum_size = Vector2(120, 0)
		
		var bar_label: Label = Label.new()
		bar_label.text = "最高分: %.1f" % best.get("score", 0.0)
		bar_label.add_theme_font_size_override("font_size", 10)
		bar_label.add_theme_color_override("font_color", Color(0.5, 0.5, 0.5))
		score_bar.add_child(bar_label)
		
		var bar_bg: ColorRect = ColorRect.new()
		bar_bg.custom_minimum_size = Vector2(0, 10)
		bar_bg.color = Color(0.85, 0.85, 0.85)
		score_bar.add_child(bar_bg)
		
		var bar_fill: ColorRect = ColorRect.new()
		var score_percent: float = min(best.get("score", 0.0) / 100.0, 1.0)
		bar_fill.custom_minimum_size = Vector2(int(120.0 * score_percent), 10)
		if best.get("score", 0.0) >= float(level.get("required_score", 60)):
			bar_fill.color = Color(0.3, 0.7, 0.4)
		else:
			bar_fill.color = Color(0.9, 0.6, 0.3)
		score_bar.add_child(bar_fill)
		
		hbox.add_child(score_bar)
		
		panel.add_child(hbox)
		level_list.add_child(panel)

func _build_recent_records() -> void:
	for child in recent_list.get_children():
		child.queue_free()
	
	var recent: Array = TrainingRecord.get_recent_records(10)
	
	if recent.is_empty():
		var empty_label: Label = Label.new()
		empty_label.text = "暂无训练记录"
		empty_label.add_theme_font_size_override("font_size", 14)
		empty_label.add_theme_color_override("font_color", Color(0.6, 0.6, 0.6))
		empty_label.horizontal_alignment = 1
		empty_label.custom_minimum_size = Vector2(0, 60)
		recent_list.add_child(empty_label)
		return
	
	for record in recent:
		var panel: Panel = Panel.new()
		panel.custom_minimum_size = Vector2(0, 50)
		
		var hbox: HBoxContainer = HBoxContainer.new()
		hbox.offset_left = 10
		hbox.offset_top = 5
		hbox.offset_right = -10
		hbox.offset_bottom = -5
		hbox.anchor_right = 1.0
		hbox.anchor_bottom = 1.0
		hbox.add_theme_constant_override("separation", 10)
		
		var level_label: Label = Label.new()
		level_label.text = record.get("level_name", "")
		level_label.add_theme_font_size_override("font_size", 13)
		level_label.custom_minimum_size = Vector2(120, 0)
		level_label.add_theme_color_override("font_color", Color(0.2, 0.3, 0.5))
		hbox.add_child(level_label)
		
		var score_label: Label = Label.new()
		var passed: bool = record.get("is_passed", false)
		score_label.text = "%.1f分" % record.get("score", 0.0)
		score_label.add_theme_font_size_override("font_size", 13)
		score_label.add_theme_color_override("font_color", Color(0.3, 0.7, 0.4) if passed else Color(0.8, 0.4, 0.3))
		score_label.custom_minimum_size = Vector2(80, 0)
		hbox.add_child(score_label)
		
		var attend_label: Label = Label.new()
		attend_label.text = "到场率: %.1f%%" % record.get("attendance_rate", 0.0)
		attend_label.add_theme_font_size_override("font_size", 11)
		attend_label.add_theme_color_override("font_color", Color(0.5, 0.5, 0.5))
		attend_label.size_flags_horizontal = SIZE_EXPAND_FILL
		hbox.add_child(attend_label)
		
		var time_label: Label = Label.new()
		time_label.text = record.get("timestamp", "").substr(5, 11)
		time_label.add_theme_font_size_override("font_size", 10)
		time_label.add_theme_color_override("font_color", Color(0.6, 0.6, 0.6))
		hbox.add_child(time_label)
		
		panel.add_child(hbox)
		recent_list.add_child(panel)

func _on_back_pressed() -> void:
	GameManager.go_to_menu()
	get_tree().change_scene_to_file("res://scenes/main_menu.tscn")

func _on_clear_pressed() -> void:
	var confirm_dialog: ConfirmationDialog = ConfirmationDialog.new()
	confirm_dialog.title = "确认清除"
	confirm_dialog.dialog_text = "确定要清除所有训练记录吗？此操作不可撤销。"
	confirm_dialog.get_ok_button().text = "确定清除"
	confirm_dialog.get_cancel_button().text = "取消"
	confirm_dialog.confirmed.connect(_on_clear_confirmed)
	add_child(confirm_dialog)
	confirm_dialog.popup_centered()

func _on_clear_confirmed() -> void:
	TrainingRecord.clear_records()
	_update_statistics()
