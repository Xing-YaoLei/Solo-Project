extends Control

@onready var back_button: Button = $TopBar/BackButton
@onready var filter_option: OptionButton = $TopBar/FilterOption
@onready var leaderboard_container: VBoxContainer = $ScrollContainer/LeaderboardContainer

func _ready() -> void:
	back_button.pressed.connect(_on_back_pressed)
	filter_option.item_selected.connect(_on_filter_changed)
	_populate_filter()
	_refresh_leaderboard()

func _populate_filter() -> void:
	filter_option.add_item("全部关卡", 0)
	var levels: Dictionary = LevelManager.get_all_levels()
	var item_index: int = 1
	for level_id in levels:
		var level_data: Dictionary = levels[level_id]
		filter_option.add_item(level_data.get("title", level_id), item_index)
		filter_option.set_item_metadata(item_index, level_id)
		item_index += 1

func _refresh_leaderboard() -> void:
	for child in leaderboard_container.get_children():
		child.queue_free()
	var selected: int = filter_option.get_selected_id()
	var task_id: String = ""
	if selected > 0:
		var meta = filter_option.get_item_metadata(selected)
		if meta != null:
			task_id = str(meta)
	var entries: Array = LeaderboardManager.get_top_entries(20, task_id)
	if entries.is_empty():
		var label := Label.new()
		label.text = "暂无排行数据"
		label.add_theme_color_override("font_color", Color(0.6, 0.6, 0.7, 1))
		leaderboard_container.add_child(label)
		return
	var header := HBoxContainer.new()
	var rank_h := Label.new()
	rank_h.text = "排名"
	rank_h.custom_minimum_size.x = 50
	rank_h.add_theme_color_override("font_color", Color(0.7, 0.7, 0.8, 1))
	var name_h := Label.new()
	name_h.text = "关卡"
	name_h.custom_minimum_size.x = 200
	name_h.add_theme_color_override("font_color", Color(0.7, 0.7, 0.8, 1))
	var score_h := Label.new()
	score_h.text = "得分"
	score_h.custom_minimum_size.x = 80
	score_h.add_theme_color_override("font_color", Color(0.7, 0.7, 0.8, 1))
	var time_h := Label.new()
	time_h.text = "用时"
	time_h.custom_minimum_size.x = 80
	time_h.add_theme_color_override("font_color", Color(0.7, 0.7, 0.8, 1))
	header.add_child(rank_h)
	header.add_child(name_h)
	header.add_child(score_h)
	header.add_child(time_h)
	leaderboard_container.add_child(header)
	for i in range(entries.size()):
		var entry: Dictionary = entries[i]
		var row := HBoxContainer.new()
		var rank_label := Label.new()
		rank_label.text = "#%d" % (i + 1)
		rank_label.custom_minimum_size.x = 50
		if i == 0:
			rank_label.add_theme_color_override("font_color", Color(1.0, 0.85, 0.0))
		elif i == 1:
			rank_label.add_theme_color_override("font_color", Color(0.85, 0.85, 0.85))
		elif i == 2:
			rank_label.add_theme_color_override("font_color", Color(0.85, 0.55, 0.3))
		var task_label := Label.new()
		task_label.text = entry.get("task_id", "")
		task_label.custom_minimum_size.x = 200
		var score_val_label := Label.new()
		score_val_label.text = str(entry.get("score", 0))
		score_val_label.custom_minimum_size.x = 80
		score_val_label.add_theme_color_override("font_color", Color(0.9, 0.85, 0.4))
		var time_val_label := Label.new()
		var ct: float = entry.get("completion_time", 0.0)
		time_val_label.text = "%.1fs" % ct
		time_val_label.custom_minimum_size.x = 80
		row.add_child(rank_label)
		row.add_child(task_label)
		row.add_child(score_val_label)
		row.add_child(time_val_label)
		leaderboard_container.add_child(row)

func _on_filter_changed(index: int) -> void:
	_refresh_leaderboard()

func _on_back_pressed() -> void:
	get_tree().change_scene_to_file("res://scenes/main_menu.tscn")
