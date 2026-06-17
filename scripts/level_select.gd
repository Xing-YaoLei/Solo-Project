extends Control

@onready var levels_vbox: VBoxContainer = $ScrollContainer/LevelsVBox

func _ready() -> void:
	_build_level_list()

func _build_level_list() -> void:
	for child in levels_vbox.get_children():
		child.queue_free()
	
	var levels = GameManager.get_levels()
	for level in levels:
		var level_card = _create_level_card(level)
		levels_vbox.add_child(level_card)

func _create_level_card(level: Dictionary) -> PanelContainer:
	var panel = PanelContainer.new()
	panel.custom_minimum_size = Vector2(0, 120)
	
	var hbox = HBoxContainer.new()
	hbox.add_theme_constant_override("separation", 20)
	panel.add_child(hbox)
	
	var left_vbox = VBoxContainer.new()
	left_vbox.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	left_vbox.alignment = BoxContainer.AlignmentMode.ALIGNMENT_CENTER
	hbox.add_child(left_vbox)
	
	var level_name = Label.new()
	level_name.text = level.name
	level_name.add_theme_font_size_override("font_size", 24)
	level_name.add_theme_color_override("font_color", Color(0.2, 0.2, 0.2, 1))
	left_vbox.add_child(level_name)
	
	var level_desc = Label.new()
	level_desc.text = level.description
	level_desc.add_theme_font_size_override("font_size", 14)
	level_desc.add_theme_color_override("font_color", Color(0.5, 0.5, 0.5, 1))
	left_vbox.add_child(level_desc)
	
	var info_hbox = HBoxContainer.new()
	info_hbox.alignment = BoxContainer.AlignmentMode.ALIGNMENT_CENTER
	info_hbox.add_theme_constant_override("separation", 20)
	left_vbox.add_child(info_hbox)
	
	var time_label = Label.new()
	time_label.text = "⏱ %d秒" % level.time_limit
	time_label.add_theme_font_size_override("font_size", 14)
	time_label.add_theme_color_override("font_color", Color(0.9, 0.3, 0.3, 1))
	info_hbox.add_child(time_label)
	
	var task_label = Label.new()
	task_label.text = "📋 %d题" % level.task_count
	task_label.add_theme_font_size_override("font_size", 14)
	task_label.add_theme_color_override("font_color", Color(0.2, 0.4, 0.7, 1))
	info_hbox.add_child(task_label)
	
	var diff_label = Label.new()
	diff_label.text = "⭐" * level.difficulty
	diff_label.add_theme_font_size_override("font_size", 14)
	diff_label.add_theme_color_override("font_color", Color(0.9, 0.6, 0.2, 1))
	info_hbox.add_child(diff_label)
	
	var stats = StatsManager.get_level_stats(level.id)
	if not stats.is_empty():
		var stat_hbox = HBoxContainer.new()
		stat_hbox.alignment = BoxContainer.AlignmentMode.ALIGNMENT_CENTER
		stat_hbox.add_theme_constant_override("separation", 15)
		left_vbox.add_child(stat_hbox)
		
		var best_label = Label.new()
		best_label.text = "最高: %d" % stats.best_score
		best_label.add_theme_font_size_override("font_size", 12)
		best_label.add_theme_color_override("font_color", Color(0.4, 0.4, 0.4, 1))
		stat_hbox.add_child(best_label)
		
		var sat_label = Label.new()
		sat_label.text = "满意度: %d%%" % stats.best_satisfaction
		sat_label.add_theme_font_size_override("font_size", 12)
		sat_label.add_theme_color_override("font_color", Color(0.3, 0.7, 0.3, 1))
		stat_hbox.add_child(sat_label)
	
	var start_btn = Button.new()
	start_btn.custom_minimum_size = Vector2(120, 80)
	start_btn.text = "开始"
	start_btn.add_theme_font_size_override("font_size", 20)
	start_btn.pressed.connect(_on_level_selected.bind(level.id))
	hbox.add_child(start_btn)
	
	return panel

func _on_level_selected(level_id: String) -> void:
	AudioManager.play_click_sfx()
	GameManager.start_game(level_id)
	get_tree().change_scene_to_file("res://scenes/game.tscn")

func _on_back_pressed() -> void:
	AudioManager.play_click_sfx()
	get_tree().change_scene_to_file("res://scenes/main_menu.tscn")
