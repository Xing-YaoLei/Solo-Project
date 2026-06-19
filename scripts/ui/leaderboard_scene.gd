extends Control

var current_view: String = "time"
var current_mode_filter: int = 0
var current_level: int = -1

@onready var time_tab_button: Button = $TopBar/TabContainer/TimeTab
@onready var repair_tab_button: Button = $TopBar/TabContainer/RepairTab
@onready var back_button: Button = $TopBar/BackButton
@onready var mode_filter: OptionButton = $TopBar/FilterRow/ModeFilter
@onready var level_filter: OptionButton = $TopBar/FilterRow/LevelFilter
@onready var leaderboard_list: VBoxContainer = $ScrollContainer/LeaderboardList
@onready var title_label: Label = $TopBar/TitleLabel

func _ready():
	_setup_connections()
	_setup_filters()
	_refresh_leaderboard()

func _setup_connections() -> void:
	time_tab_button.pressed.connect(_on_time_tab_pressed)
	repair_tab_button.pressed.connect(_on_repair_tab_pressed)
	back_button.pressed.connect(_on_back_pressed)
	mode_filter.item_selected.connect(_on_mode_filter_changed)
	level_filter.item_selected.connect(_on_level_filter_changed)

func _setup_filters() -> void:
	mode_filter.clear()
	mode_filter.add_item("全部模式")
	mode_filter.add_item("训练模式")
	mode_filter.add_item("自由模式")

	level_filter.clear()
	level_filter.add_item("全部关卡")
	for i in range(1, 11):
		level_filter.add_item("关卡 %d" % i)

func _refresh_leaderboard() -> void:
	for child in leaderboard_list.get_children():
		child.queue_free()

	var entries: Array[LeaderboardManager.LeaderboardEntry] = []
	var is_training_mode = current_mode_filter == 1
	var filter_level = current_level if current_mode_filter > 0 else -1

	match current_view:
		"time":
			entries = LeaderboardManager.get_time_leaderboard(20, is_training_mode, filter_level)
			title_label.text = "最快完成排行榜"
		"repair":
			entries = LeaderboardManager.get_repair_leaderboard(20, is_training_mode, filter_level)
			title_label.text = "最低返修排行榜"

	if entries.size() == 0:
		_show_empty_message()
		return

	for i in range(entries.size()):
		var entry = entries[i]
		var item = _create_leaderboard_item(entry, i + 1)
		leaderboard_list.add_child(item)

func _create_leaderboard_item(p_entry: LeaderboardManager.LeaderboardEntry, p_rank: int) -> Control:
	var item = PanelContainer.new()
	item.custom_minimum_size = Vector2(0, 70)
	item.size_flags_horizontal = SIZE_EXPAND_FILL

	var style = StyleBoxFlat.new()
	style.bg_color = Color(0.2, 0.25, 0.3, 0.9) if p_rank > 3 else Color(0.25, 0.35, 0.45, 0.9)
	if p_rank == 1:
		style.bg_color = Color(0.4, 0.35, 0.15, 0.9)
	elif p_rank == 2:
		style.bg_color = Color(0.3, 0.3, 0.35, 0.9)
	elif p_rank == 3:
		style.bg_color = Color(0.35, 0.2, 0.1, 0.9)
	style.corner_radius_top_left = 8
	style.corner_radius_top_right = 8
	style.corner_radius_bottom_right = 8
	style.corner_radius_bottom_left = 8
	style.content_margin_left = 15
	style.content_margin_right = 15
	style.content_margin_top = 10
	style.content_margin_bottom = 10
	item.add_theme_stylebox_override("panel", style)

	var hbox = HBoxContainer.new()
	hbox.size_flags_horizontal = SIZE_EXPAND_FILL
	hbox.theme_override_constants.spacing = 15
	item.add_child(hbox)

	var rank_label = Label.new()
	rank_label.text = "#%d" % p_rank
	rank_label.custom_minimum_size = Vector2(50, 0)
	rank_label.add_theme_font_size_override("font_size", 20)
	rank_label.add_theme_color_override("font_color", Color(1, 0.9, 0.5, 1) if p_rank <= 3 else Color(0.8, 0.85, 0.9, 1))
	rank_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	hbox.add_child(rank_label)

	var info_vbox = VBoxContainer.new()
	info_vbox.size_flags_horizontal = SIZE_EXPAND_FILL
	hbox.add_child(info_vbox)

	var name_label = Label.new()
	name_label.text = p_entry.player_name
	name_label.add_theme_font_size_override("font_size", 16)
	name_label.add_theme_color_override("font_color", Color.WHITE)
	info_vbox.add_child(name_label)

	var details_hbox = HBoxContainer.new()
	details_hbox.theme_override_constants.spacing = 20
	info_vbox.add_child(details_hbox)

	var score_label = Label.new()
	score_label.text = "得分: %d" % p_entry.score
	score_label.add_theme_font_size_override("font_size", 12)
	score_label.add_theme_color_override("font_color", Color(0.7, 0.8, 0.9, 1))
	details_hbox.add_child(score_label)

	var orders_label = Label.new()
	orders_label.text = "工单: %d" % p_entry.completed_orders
	orders_label.add_theme_font_size_override("font_size", 12)
	orders_label.add_theme_color_override("font_color", Color(0.7, 0.8, 0.9, 1))
	details_hbox.add_child(orders_label)

	var mode_label = Label.new()
	mode_label.text = "模式: %s" % ("训练" if p_entry.is_training_mode else "自由")
	mode_label.add_theme_font_size_override("font_size", 12)
	mode_label.add_theme_color_override("font_color", Color(0.7, 0.8, 0.9, 1))
	details_hbox.add_child(mode_label)

	var right_vbox = VBoxContainer.new()
	right_vbox.alignment = ALIGNMENT_CENTER
	right_vbox.size_flags_horizontal = SIZE_SHRINK_END
	hbox.add_child(right_vbox)

	if current_view == "time":
		var value_label = Label.new()
		value_label.text = LeaderboardManager.format_time(p_entry.completion_time)
		value_label.add_theme_font_size_override("font_size", 18)
		value_label.add_theme_color_override("font_color", Color(0.5, 1.0, 1.0, 1))
		value_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
		right_vbox.add_child(value_label)

		var subtitle_label = Label.new()
		subtitle_label.text = "完成时间"
		subtitle_label.add_theme_font_size_override("font_size", 11)
		subtitle_label.add_theme_color_override("font_color", Color(0.6, 0.7, 0.8, 1))
		subtitle_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
		right_vbox.add_child(subtitle_label)
	else:
		var value_label = Label.new()
		value_label.text = LeaderboardManager.format_repair_rate(p_entry.repair_rate)
		value_label.add_theme_font_size_override("font_size", 18)
		value_label.add_theme_color_override("font_color", Color(0.5, 1.0, 0.5, 1))
		value_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
		right_vbox.add_child(value_label)

		var subtitle_label = Label.new()
		subtitle_label.text = "返修率"
		subtitle_label.add_theme_font_size_override("font_size", 11)
		subtitle_label.add_theme_color_override("font_color", Color(0.6, 0.7, 0.8, 1))
		subtitle_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
		right_vbox.add_child(subtitle_label)

	item.mouse_entered.connect(func():
		if SettingsManager.should_play_animation(SettingsManager.AnimationIntensity.LOW):
			var tween = create_tween()
			tween.tween_property(item, "modulate", Color(1.1, 1.1, 1.1), 0.1)
	)

	item.mouse_exited.connect(func():
		if SettingsManager.should_play_animation(SettingsManager.AnimationIntensity.LOW):
			var tween = create_tween()
			tween.tween_property(item, "modulate", Color.WHITE, 0.1)
	)

	return item

func _show_empty_message() -> void:
	var label = Label.new()
	label.text = "暂无排行记录\n完成一场游戏后将显示在这里"
	label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	label.add_theme_font_size_override("font_size", 16)
	label.add_theme_color_override("font_color", Color(0.6, 0.7, 0.8, 1))
	leaderboard_list.add_child(label)

func _on_time_tab_pressed() -> void:
	current_view = "time"
	time_tab_button.disabled = true
	repair_tab_button.disabled = false
	_refresh_leaderboard()
	AudioManager.play_click()

func _on_repair_tab_pressed() -> void:
	current_view = "repair"
	time_tab_button.disabled = false
	repair_tab_button.disabled = true
	_refresh_leaderboard()
	AudioManager.play_click()

func _on_back_pressed() -> void:
	AudioManager.play_click()
	GameManager.go_to_main_menu()

func _on_mode_filter_changed(p_index: int) -> void:
	current_mode_filter = p_index
	_refresh_leaderboard()
	AudioManager.play_click()

func _on_level_filter_changed(p_index: int) -> void:
	if p_index == 0:
		current_level = -1
	else:
		current_level = p_index
	_refresh_leaderboard()
	AudioManager.play_click()
