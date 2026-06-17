extends Control

@onready var stats_vbox: VBoxContainer = $ScrollContainer/StatsVBox
@onready var level_list_label: Label = $ScrollContainer/StatsVBox/LevelListLabel

func _ready() -> void:
	_build_stats_list()

func _build_stats_list() -> void:
	var sorted_levels = StatsManager.get_all_levels_sorted_by_satisfaction()
	
	var children = stats_vbox.get_children()
	for i in range(2, children.size()):
		children[i].queue_free()
	
	if sorted_levels.is_empty():
		var empty_label = Label.new()
		empty_label.text = "暂无统计数据\n快去挑战关卡吧！"
		empty_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		empty_label.add_theme_font_size_override("font_size", 18)
		empty_label.add_theme_color_override("font_color", Color(0.6, 0.6, 0.6, 1))
		stats_vbox.add_child(empty_label)
		return
	
	var rank = 1
	for level_data in sorted_levels:
		var level_card = _create_rank_card(level_data, rank)
		stats_vbox.add_child(level_card)
		rank += 1

func _create_rank_card(level_data: Dictionary, rank: int) -> PanelContainer:
	var panel = PanelContainer.new()
	panel.custom_minimum_size = Vector2(0, 100)
	
	var hbox = HBoxContainer.new()
	hbox.add_theme_constant_override("separation", 15)
	panel.add_child(hbox)
	
	var rank_label = Label.new()
	rank_label.custom_minimum_size = Vector2(60, 0)
	rank_label.text = _get_rank_text(rank)
	rank_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	rank_label.add_theme_font_size_override("font_size", 28)
	rank_label.add_theme_color_override("font_color", _get_rank_color(rank))
	hbox.add_child(rank_label)
	
	var level_info = GameManager.get_level_by_id(level_data.level_id)
	var level_name = level_info.name if not level_info.is_empty() else level_data.level_id
	
	var center_vbox = VBoxContainer.new()
	center_vbox.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	center_vbox.alignment = BoxContainer.ALIGNMENT_CENTER
	hbox.add_child(center_vbox)
	
	var name_label = Label.new()
	name_label.text = level_name
	name_label.add_theme_font_size_override("font_size", 20)
	name_label.add_theme_color_override("font_color", Color(0.2, 0.2, 0.2, 1))
	center_vbox.add_child(name_label)
	
	var plays_label = Label.new()
	plays_label.text = "挑战次数: %d" % level_data.total_plays
	plays_label.add_theme_font_size_override("font_size", 14)
	plays_label.add_theme_color_override("font_color", Color(0.5, 0.5, 0.5, 1))
	center_vbox.add_child(plays_label)
	
	var right_vbox = VBoxContainer.new()
	right_vbox.custom_minimum_size = Vector2(120, 0)
	right_vbox.alignment = BoxContainer.ALIGNMENT_CENTER
	hbox.add_child(right_vbox)
	
	var sat_label = Label.new()
	sat_label.text = "满意度"
	sat_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	sat_label.add_theme_font_size_override("font_size", 12)
	sat_label.add_theme_color_override("font_color", Color(0.5, 0.5, 0.5, 1))
	right_vbox.add_child(sat_label)
	
	var sat_val = Label.new()
	sat_val.text = "%d%%" % level_data.best_satisfaction
	sat_val.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	sat_val.add_theme_font_size_override("font_size", 24)
	sat_val.add_theme_color_override("font_color", Color(0.3, 0.7, 0.3, 1))
	right_vbox.add_child(sat_val)
	
	var avg_sat = Label.new()
	avg_sat.text = "平均: %d%%" % level_data.avg_satisfaction
	avg_sat.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	avg_sat.add_theme_font_size_override("font_size", 12)
	avg_sat.add_theme_color_override("font_color", Color(0.6, 0.6, 0.6, 1))
	right_vbox.add_child(avg_sat)
	
	return panel

func _get_rank_text(rank: int) -> String:
	match rank:
		1:
			return "🥇"
		2:
			return "🥈"
		3:
			return "🥉"
		_:
			return "#%d" % rank

func _get_rank_color(rank: int) -> Color:
	match rank:
		1:
			return Color(0.9, 0.7, 0.2, 1)
		2:
			return Color(0.7, 0.7, 0.7, 1)
		3:
			return Color(0.8, 0.5, 0.2, 1)
		_:
			return Color(0.5, 0.5, 0.5, 1)

func _on_back_pressed() -> void:
	AudioManager.play_click_sfx()
	get_tree().change_scene_to_file("res://scenes/main_menu.tscn")
