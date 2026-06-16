extends Control

enum LeaderboardTab { REVISIT, TIME }

@onready var revisit_tab_button: Button = %RevisitTabButton
@onready var time_tab_button: Button = %TimeTabButton
@onready var leaderboard_list: VBoxContainer = %LeaderboardList
@onready var back_button: Button = %BackButton

var _current_tab: LeaderboardTab = LeaderboardTab.REVISIT

func _ready() -> void:
	revisit_tab_button.pressed.connect(_on_revisit_tab)
	time_tab_button.pressed.connect(_on_time_tab)
	back_button.pressed.connect(_on_back_pressed)
	StatsManager.leaderboard_changed.connect(_refresh)
	_update_tab_styles()
	_refresh()

func _on_revisit_tab() -> void:
	_current_tab = LeaderboardTab.REVISIT
	_update_tab_styles()
	_refresh()

func _on_time_tab() -> void:
	_current_tab = LeaderboardTab.TIME
	_update_tab_styles()
	_refresh()

func _update_tab_styles() -> void:
	var active_style = StyleBoxFlat.new()
	active_style.bg_color = Color(0.2, 0.4, 0.8)
	active_style.corner_radius_top_left = 6
	active_style.corner_radius_top_right = 6
	active_style.corner_radius_bottom_left = 6
	active_style.corner_radius_bottom_right = 6

	var inactive_style = StyleBoxFlat.new()
	inactive_style.bg_color = Color(0.1, 0.15, 0.3)
	inactive_style.corner_radius_top_left = 6
	inactive_style.corner_radius_top_right = 6
	inactive_style.corner_radius_bottom_left = 6
	inactive_style.corner_radius_bottom_right = 6

	if _current_tab == LeaderboardTab.REVISIT:
		revisit_tab_button.add_theme_stylebox_override("normal", active_style)
		time_tab_button.add_theme_stylebox_override("normal", inactive_style)
		revisit_tab_button.add_theme_color_override("font_color", Color.WHITE)
		time_tab_button.add_theme_color_override("font_color", Color(0.6, 0.6, 0.6))
	else:
		time_tab_button.add_theme_stylebox_override("normal", active_style)
		revisit_tab_button.add_theme_stylebox_override("normal", inactive_style)
		time_tab_button.add_theme_color_override("font_color", Color.WHITE)
		revisit_tab_button.add_theme_color_override("font_color", Color(0.6, 0.6, 0.6))

func _refresh() -> void:
	for child in leaderboard_list.get_children():
		child.queue_free()
	match _current_tab:
		LeaderboardTab.REVISIT:
			_populate_revisit()
		LeaderboardTab.TIME:
			_populate_time()

func _populate_revisit() -> void:
	var entries = StatsManager.get_leaderboard_by_revisit()
	if entries.is_empty():
		_add_empty_label()
		return
	for i in entries.size():
		var entry: Dictionary = entries[i]
		_add_entry_row(i + 1, "第%d回合" % entry.get("round", 0), "%.1f%%" % (entry.get("revisit_rate", 0.0) * 100.0))

func _populate_time() -> void:
	var entries = StatsManager.get_leaderboard_by_time()
	if entries.is_empty():
		_add_empty_label()
		return
	for i in entries.size():
		var entry: Dictionary = entries[i]
		_add_entry_row(i + 1, "第%d回合" % entry.get("round", 0), "%.1fs" % entry.get("elapsed_time", 0.0))

func _add_entry_row(rank: int, round_text: String, score_text: String) -> void:
	var row = HBoxContainer.new()
	row.add_theme_constant_override("separation", 16)

	var rank_label = Label.new()
	rank_label.text = "#%d" % rank
	rank_label.custom_minimum_size.x = 50
	rank_label.add_theme_color_override("font_color", Color(1.0, 0.85, 0.3) if rank <= 3 else Color(0.8, 0.8, 0.8))
	rank_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	row.add_child(rank_label)

	var round_label = Label.new()
	round_label.text = round_text
	round_label.custom_minimum_size.x = 120
	round_label.add_theme_color_override("font_color", Color(0.85, 0.9, 1.0))
	row.add_child(round_label)

	var score_label = Label.new()
	score_label.text = score_text
	score_label.add_theme_color_override("font_color", Color(0.4, 1.0, 0.6))
	row.add_child(score_label)

	leaderboard_list.add_child(row)

func _add_empty_label() -> void:
	var label = Label.new()
	label.text = "暂无排行数据"
	label.add_theme_color_override("font_color", Color(0.5, 0.5, 0.5))
	leaderboard_list.add_child(label)

func _on_back_pressed() -> void:
	get_tree().change_scene_to_file("res://scenes/main_menu.tscn")
