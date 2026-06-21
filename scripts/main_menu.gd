extends Control

@onready var title_label: Label = $PanelContainer/VBoxContainer/TitleLabel
@onready var level_list: VBoxContainer = $PanelContainer/VBoxContainer/ScrollContainer/LevelList
@onready var statistics_button: Button = $PanelContainer/VBoxContainer/ButtonRow/StatisticsButton
@onready var config_button: Button = $PanelContainer/VBoxContainer/ButtonRow/ConfigButton
@onready var training_mode_check: CheckBox = $PanelContainer/VBoxContainer/TrainingModeCheck

func _ready() -> void:
	_build_level_list()
	statistics_button.pressed.connect(_on_statistics_pressed)
	config_button.pressed.connect(_on_config_pressed)
	training_mode_check.pressed.connect(_on_training_mode_toggled)

func _build_level_list() -> void:
	for child in level_list.get_children():
		child.queue_free()
	
	var levels: Array = DataManager.get_levels()
	
	for level in levels:
		var level_id: int = level.get("id", 0)
		var is_unlocked: bool = TrainingRecord.is_level_unlocked(level_id)
		var best_score: Dictionary = TrainingRecord.get_best_score(level_id)
		
		var panel: Panel = Panel.new()
		panel.custom_minimum_size = Vector2(0, 80)
		panel.modulate = Color(1, 1, 1, 1) if is_unlocked else Color(0.7, 0.7, 0.7, 0.5)
		
		var hbox: HBoxContainer = HBoxContainer.new()
		hbox.add_theme_constant_override("separation", 20)
		hbox.offset_left = 15
		hbox.offset_top = 10
		hbox.offset_right = -15
		hbox.offset_bottom = -10
		hbox.size_flags_horizontal = SIZE_EXPAND_FILL
		hbox.anchor_right = 1.0
		hbox.anchor_bottom = 1.0
		
		var level_info: VBoxContainer = VBoxContainer.new()
		level_info.size_flags_horizontal = SIZE_EXPAND_FILL
		
		var name_label: Label = Label.new()
		name_label.text = "第%d关: %s" % [level_id, level.get("name", "")]
		name_label.add_theme_font_size_override("font_size", 18)
		name_label.add_theme_color_override("font_color", Color(0.2, 0.3, 0.5))
		level_info.add_child(name_label)
		
		var desc_label: Label = Label.new()
		desc_label.text = level.get("description", "")
		desc_label.add_theme_font_size_override("font_size", 12)
		desc_label.add_theme_color_override("font_color", Color(0.5, 0.5, 0.5))
		level_info.add_child(desc_label)
		
		var difficulty_label: Label = Label.new()
		var stars: String = "★" * level.get("difficulty", 1) + "☆" * (5 - level.get("difficulty", 1))
		difficulty_label.text = "难度: %s  |  及格分: %d" % [stars, level.get("required_score", 60)]
		difficulty_label.add_theme_font_size_override("font_size", 11)
		difficulty_label.add_theme_color_override("font_color", Color(0.8, 0.6, 0.2))
		level_info.add_child(difficulty_label)
		
		if best_score.get("attempts", 0) > 0:
			var score_label: Label = Label.new()
			score_label.text = "最高分: %.1f  |  到场率: %.1f%%  |  尝试: %d次" % [
				best_score.get("score", 0.0),
				best_score.get("attendance_rate", 0.0),
				best_score.get("attempts", 0)
			]
			score_label.add_theme_font_size_override("font_size", 11)
			score_label.add_theme_color_override("font_color", Color(0.3, 0.6, 0.3))
			level_info.add_child(score_label)
		
		hbox.add_child(level_info)
		
		var start_button: Button = Button.new()
		start_button.text = "开始训练" if is_unlocked else "未解锁"
		start_button.disabled = not is_unlocked
		start_button.custom_minimum_size = Vector2(120, 40)
		start_button.add_theme_font_size_override("font_size", 14)
		start_button.pressed.connect(_on_start_level.bind(level_id))
		hbox.add_child(start_button)
		
		panel.add_child(hbox)
		level_list.add_child(panel)

func _on_start_level(level_id: int) -> void:
	GameManager.start_game(level_id, training_mode_check.button_pressed)
	get_tree().change_scene_to_file("res://scenes/game_play.tscn")

func _on_statistics_pressed() -> void:
	get_tree().change_scene_to_file("res://scenes/statistics.tscn")

func _on_config_pressed() -> void:
	get_tree().change_scene_to_file("res://scenes/config.tscn")

func _on_training_mode_toggled() -> void:
	pass
