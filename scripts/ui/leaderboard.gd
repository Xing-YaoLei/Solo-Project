extends Control

@onready var tab_container: TabContainer = $Panel/MarginContainer/VBoxContainer/TabContainer
@onready var conversion_list: VBoxContainer = $Panel/MarginContainer/VBoxContainer/TabContainer/ConversionTab/ScrollContainer/ConversionList
@onready var time_list: VBoxContainer = $Panel/MarginContainer/VBoxContainer/TabContainer/TimeTab/ScrollContainer2/TimeList
@onready var level_filter: OptionButton = $Panel/MarginContainer/VBoxContainer/FilterBar/LevelFilter
@onready var back_button: Button = $Panel/MarginContainer/VBoxContainer/BackButton

var current_level_filter: String = ""

func _ready():
	AudioManager.play_sfx("click")
	_setup_level_filter()
	_refresh_lists()
	
	tab_container.tab_changed.connect(_on_tab_changed)
	level_filter.item_selected.connect(_on_level_filter_changed)
	back_button.pressed.connect(_on_back_pressed)
	
	LeaderboardManager.scores_updated.connect(_refresh_lists)

func _setup_level_filter():
	level_filter.clear()
	level_filter.add_item("全部关卡", -1)
	
	var training_levels = GameData.get_training_levels()
	for level in training_levels:
		level_filter.add_item(level.name, level.id)
	
	var practice_levels = GameData.get_practice_levels()
	for level in practice_levels:
		level_filter.add_item(level.name, level.id)

func _refresh_lists():
	_refresh_conversion_list()
	_refresh_time_list()

func _refresh_conversion_list():
	_clear_children(conversion_list)
	
	var scores = LeaderboardManager.get_conversion_ranking(current_level_filter)
	
	if scores.is_empty():
		_add_empty_message(conversion_list)
		return
	
	for i in range(min(len(scores), 10)):
		var entry = scores[i]
		_add_conversion_entry(i + 1, entry)

func _refresh_time_list():
	_clear_children(time_list)
	
	var scores = LeaderboardManager.get_time_ranking(current_level_filter)
	
	if scores.is_empty():
		_add_empty_message(time_list)
		return
	
	for i in range(min(len(scores), 10)):
		var entry = scores[i]
		_add_time_entry(i + 1, entry)

func _clear_children(container: Node):
	for child in container.get_children():
		container.remove_child(child)
		child.queue_free()

func _add_empty_message(container: Node):
	var label = Label.new()
	label.text = "暂无记录"
	label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	label.add_theme_font_size_override("font_size", 18)
	label.modulate = Color(0.7, 0.7, 0.7, 1)
	container.add_child(label)

func _add_conversion_entry(rank: int, entry: Dictionary):
	var entry_panel = Panel.new()
	entry_panel.custom_minimum_size = Vector2(0, 70)
	
	var hbox = HBoxContainer.new()
	hbox.add_theme_constant_override("separation", 16)
	entry_panel.add_child(hbox)
	
	var rank_label = Label.new()
	rank_label.text = str(rank)
	rank_label.custom_minimum_size = Vector2(40, 0)
	rank_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	rank_label.add_theme_font_size_override("font_size", 20)
	if rank == 1:
		rank_label.modulate = Color(1, 0.84, 0, 1)
	elif rank == 2:
		rank_label.modulate = Color(0.75, 0.75, 0.75, 1)
	elif rank == 3:
		rank_label.modulate = Color(0.8, 0.5, 0.2, 1)
	hbox.add_child(rank_label)
	
	var info_vbox = VBoxContainer.new()
	info_vbox.add_theme_constant_override("separation", 4)
	info_vbox.size_flags_horizontal = SIZE_EXPAND_FILL
	hbox.add_child(info_vbox)
	
	var level_label = Label.new()
	level_label.text = entry.get("level_name", "未知关卡")
	level_label.add_theme_font_size_override("font_size", 16)
	info_vbox.add_child(level_label)
	
	var date_label = Label.new()
	var timestamp = entry.get("timestamp", 0)
	date_label.text = Time.get_datetime_string_from_unix_time(timestamp)
	date_label.add_theme_font_size_override("font_size", 12)
	date_label.modulate = Color(0.6, 0.6, 0.6, 1)
	info_vbox.add_child(date_label)
	
	var stats_vbox = VBoxContainer.new()
	stats_vbox.add_theme_constant_override("separation", 4)
	stats_vbox.custom_minimum_size = Vector2(180, 0)
	stats_vbox.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	hbox.add_child(stats_vbox)
	
	var conversion_label = Label.new()
	var rate = entry.get("conversion_rate", 0.0)
	conversion_label.text = "转化率: %.1f%%" % [rate * 100]
	conversion_label.add_theme_font_size_override("font_size", 14)
	conversion_label.modulate = Color(0.2, 0.8, 0.44, 1)
	stats_vbox.add_child(conversion_label)
	
	var score_label = Label.new()
	score_label.text = "得分: %d" % entry.get("score", 0)
	score_label.add_theme_font_size_override("font_size", 12)
	score_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	stats_vbox.add_child(score_label)
	
	conversion_list.add_child(entry_panel)

func _add_time_entry(rank: int, entry: Dictionary):
	var entry_panel = Panel.new()
	entry_panel.custom_minimum_size = Vector2(0, 70)
	
	var hbox = HBoxContainer.new()
	hbox.add_theme_constant_override("separation", 16)
	entry_panel.add_child(hbox)
	
	var rank_label = Label.new()
	rank_label.text = str(rank)
	rank_label.custom_minimum_size = Vector2(40, 0)
	rank_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	rank_label.add_theme_font_size_override("font_size", 20)
	if rank == 1:
		rank_label.modulate = Color(1, 0.84, 0, 1)
	elif rank == 2:
		rank_label.modulate = Color(0.75, 0.75, 0.75, 1)
	elif rank == 3:
		rank_label.modulate = Color(0.8, 0.5, 0.2, 1)
	hbox.add_child(rank_label)
	
	var info_vbox = VBoxContainer.new()
	info_vbox.add_theme_constant_override("separation", 4)
	info_vbox.size_flags_horizontal = SIZE_EXPAND_FILL
	hbox.add_child(info_vbox)
	
	var level_label = Label.new()
	level_label.text = entry.get("level_name", "未知关卡")
	level_label.add_theme_font_size_override("font_size", 16)
	info_vbox.add_child(level_label)
	
	var date_label = Label.new()
	var timestamp = entry.get("timestamp", 0)
	date_label.text = Time.get_datetime_string_from_unix_time(timestamp)
	date_label.add_theme_font_size_override("font_size", 12)
	date_label.modulate = Color(0.6, 0.6, 0.6, 1)
	info_vbox.add_child(date_label)
	
	var stats_vbox = VBoxContainer.new()
	stats_vbox.add_theme_constant_override("separation", 4)
	stats_vbox.custom_minimum_size = Vector2(180, 0)
	stats_vbox.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	hbox.add_child(stats_vbox)
	
	var time_label = Label.new()
	var time_taken = entry.get("time_taken", 0.0)
	var mins = int(time_taken / 60)
	var secs = int(time_taken % 60)
	time_label.text = "用时: %02d:%02d" % [mins, secs]
	time_label.add_theme_font_size_override("font_size", 14)
	time_label.modulate = Color(0.2, 0.6, 0.86, 1)
	stats_vbox.add_child(time_label)
	
	var score_label = Label.new()
	score_label.text = "得分: %d" % entry.get("score", 0)
	score_label.add_theme_font_size_override("font_size", 12)
	score_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	stats_vbox.add_child(score_label)
	
	time_list.add_child(entry_panel)

func _on_tab_changed(index: int):
	pass

func _on_level_filter_changed(index: int):
	var level_id = level_filter.get_item_metadata(index)
	if level_id == -1:
		current_level_filter = ""
	else:
		current_level_filter = level_id
	_refresh_lists()

func _on_back_pressed():
	AudioManager.play_sfx("click")
	get_tree().change_scene_to_file("res://scenes/main_menu.tscn")
