extends Control

@onready var mode_label: Label = $VBoxContainer/HeaderHBox/ModeLabel
@onready var level_list: VBoxContainer = $VBoxContainer/ScrollContainer/VBoxContainer
@onready var back_btn: Button = $VBoxContainer/HeaderHBox/BackButton

func _ready() -> void:
	_update_mode_label()
	_build_level_list()
	back_btn.pressed.connect(_on_back_pressed)

func _update_mode_label() -> void:
	if GameState.current_mode == "formal":
		mode_label.text = "正式训练模式"
	else:
		mode_label.text = "自由练习模式"

func _build_level_list() -> void:
	for child in level_list.get_children():
		child.queue_free()
	var level_ids: Array = LevelManager.get_all_level_ids()
	for level_id in level_ids:
		_add_level_card(level_id)

func _add_level_card(level_id: String) -> void:
	var data: Dictionary = LevelManager.get_level_data(level_id)
	var card := PanelContainer.new()
	card.custom_minimum_size = Vector2(0, 90)
	var style := StyleBoxFlat.new()
	style.bg_color = Color(1, 1, 1)
	style.corner_radius_top_left = 10
	style.corner_radius_top_right = 10
	style.corner_radius_bottom_right = 10
	style.corner_radius_bottom_left = 10
	style.content_margin_left = 16
	style.content_margin_top = 12
	style.content_margin_right = 16
	style.content_margin_bottom = 12
	style.shadow_color = Color(0, 0, 0, 0.06)
	style.shadow_size = 4
	style.shadow_offset = Vector2(0, 2)
	card.add_theme_stylebox_override("panel", style)
	var hbox := HBoxContainer.new()
	hbox.add_theme_constant_override("separation", 16)
	card.add_child(hbox)
	var left_vbox := VBoxContainer.new()
	left_vbox.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	left_vbox.add_theme_constant_override("separation", 4)
	hbox.add_child(left_vbox)
	var name_label := Label.new()
	name_label.text = data.get("name", level_id)
	name_label.add_theme_font_size_override("font_size", 20)
	name_label.add_theme_color_override("font_color", Color(0.15, 0.35, 0.75))
	left_vbox.add_child(name_label)
	var desc_label := Label.new()
	desc_label.text = data.get("description", "")
	desc_label.add_theme_font_size_override("font_size", 13)
	desc_label.add_theme_color_override("font_color", Color(0.5, 0.55, 0.65))
	left_vbox.add_child(desc_label)
	var info_hbox := HBoxContainer.new()
	info_hbox.add_theme_constant_override("separation", 16)
	left_vbox.add_child(info_hbox)
	var time_label := Label.new()
	var total_time: float = data.get("time", 120.0)
	time_label.text = "⏱ %.0f秒" % total_time
	time_label.add_theme_font_size_override("font_size", 12)
	time_label.add_theme_color_override("font_color", Color(0.4, 0.5, 0.6))
	info_hbox.add_child(time_label)
	var task_label := Label.new()
	task_label.text = "📋 %d任务" % data.get("tasks", 20)
	task_label.add_theme_font_size_override("font_size", 12)
	task_label.add_theme_color_override("font_color", Color(0.4, 0.5, 0.6))
	info_hbox.add_child(task_label)
	var diff_label := Label.new()
	diff_label.text = "⭐ " + "★" * int(data.get("difficulty", 1))
	diff_label.add_theme_font_size_override("font_size", 12)
	diff_label.add_theme_color_override("font_color", Color(0.95, 0.6, 0.1))
	info_hbox.add_child(diff_label)
	var right_vbox := VBoxContainer.new()
	right_vbox.alignment = BoxContainer.ALIGNMENT_CENTER
	hbox.add_child(right_vbox)
	var best_result: Dictionary = GameState.get_best_result(level_id)
	if not best_result.is_empty():
		var best_score_label := Label.new()
		best_score_label.text = "最佳: %d分" % int(best_result.get("total_score", 0))
		best_score_label.add_theme_font_size_override("font_size", 12)
		best_score_label.add_theme_color_override("font_color", Color(0.1, 0.7, 0.55))
		best_score_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		right_vbox.add_child(best_score_label)
		var best_acc_label := Label.new()
		best_acc_label.text = "准确率: %.1f%%" % float(best_result.get("accuracy", 0.0))
		best_acc_label.add_theme_font_size_override("font_size", 11)
		best_acc_label.add_theme_color_override("font_color", Color(0.5, 0.55, 0.6))
		best_acc_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		right_vbox.add_child(best_acc_label)
	var btn := Button.new()
	btn.custom_minimum_size = Vector2(100, 40)
	btn.text = "开始"
	btn.add_theme_color_override("font_color", Color(1, 1, 1))
	btn.add_theme_color_override("font_hover_color", Color(1, 1, 1))
	btn.add_theme_color_override("font_pressed_color", Color(0.9, 0.95, 1))
	btn.add_theme_font_size_override("font_size", 16)
	var btn_style_normal := StyleBoxFlat.new()
	btn_style_normal.bg_color = Color(0.15, 0.55, 0.95)
	btn_style_normal.corner_radius_top_left = 8
	btn_style_normal.corner_radius_top_right = 8
	btn_style_normal.corner_radius_bottom_right = 8
	btn_style_normal.corner_radius_bottom_left = 8
	btn_style_normal.content_margin_left = 16
	btn_style_normal.content_margin_top = 8
	btn_style_normal.content_margin_right = 16
	btn_style_normal.content_margin_bottom = 8
	btn.add_theme_stylebox_override("normal", btn_style_normal)
	var btn_style_hover := btn_style_normal.duplicate()
	btn_style_hover.bg_color = Color(0.25, 0.65, 1.0)
	btn.add_theme_stylebox_override("hover", btn_style_hover)
	var btn_style_pressed := btn_style_normal.duplicate()
	btn_style_pressed.bg_color = Color(0.1, 0.45, 0.85)
	btn.add_theme_stylebox_override("pressed", btn_style_pressed)
	right_vbox.add_child(btn)
	level_list.add_child(card)
	btn.pressed.connect(_on_level_pressed.bind(level_id))

func _on_level_pressed(level_id: String) -> void:
	AudioManager.play_sfx("tick")
	GameState.start_level(level_id, GameState.current_mode)
	get_tree().change_scene_to_file("res://scenes/game/game_main.tscn")

func _on_back_pressed() -> void:
	AudioManager.play_sfx("tick")
	get_tree().change_scene_to_file("res://scenes/ui/main_menu.tscn")
