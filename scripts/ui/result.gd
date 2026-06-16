extends Control

@onready var level_label: Label = $Panel/VBoxContainer/LevelLabel
@onready var score_label: Label = $Panel/VBoxContainer/ScoreLabel
@onready var breakdown_vbox: VBoxContainer = $Panel/VBoxContainer/BreakdownBox
@onready var again_btn: Button = $Panel/VBoxContainer/ButtonHBox/AgainButton
@onready var select_btn: Button = $Panel/VBoxContainer/ButtonHBox/SelectButton
@onready var menu_btn: Button = $Panel/VBoxContainer/ButtonHBox/MenuButton

func _ready() -> void:
	again_btn.pressed.connect(_on_again_pressed)
	select_btn.pressed.connect(_on_select_pressed)
	menu_btn.pressed.connect(_on_menu_pressed)
	var result: Dictionary = GameState.last_result
	if result.is_empty():
		result = GameState.get_best_result(GameState.current_level_id)
	if result.is_empty():
		get_tree().change_scene_to_file("res://scenes/ui/main_menu.tscn")
		return
	_build_result(result)

func _build_result(result: Dictionary) -> void:
	var level_name: String = LevelManager.get_level_name(GameState.current_level_id)
	var mode_text: String = "正式训练" if GameState.current_mode == "formal" else "自由练习"
	level_label.text = "%s · %s" % [level_name, mode_text]
	score_label.text = "%d" % int(result.get("total_score", 0))
	_add_stat("完成任务", "%d / %d" % [int(result.get("tasks_completed", 0)), int(result.get("tasks_total", 0))])
	_add_stat("准确率", "%.1f%%" % float(result.get("accuracy", 0.0)))
	_add_stat("最大连击", "%d次" % int(result.get("max_combo", 0)))
	_add_stat("错误次数", "%d次" % int(result.get("errors", 0)))
	_add_stat("用时", "%.1f秒" % float(result.get("time_taken", 0.0)))
	_add_stat("基础得分", "%d分" % int(result.get("score", 0)))
	_add_stat("时间奖励", "+%d分" % int(result.get("time_score", 0)))

func _add_stat(label: String, value: String) -> void:
	var hbox := HBoxContainer.new()
	hbox.add_theme_constant_override("separation", 20)
	var lbl := Label.new()
	lbl.text = label
	lbl.add_theme_color_override("font_color", Color(0.5, 0.55, 0.65))
	lbl.add_theme_font_size_override("font_size", 16)
	lbl.custom_minimum_size = Vector2(140, 0)
	hbox.add_child(lbl)
	var val := Label.new()
	val.text = value
	val.add_theme_color_override("font_color", Color(0.2, 0.25, 0.35))
	val.add_theme_font_size_override("font_size", 18)
	hbox.add_child(val)
	breakdown_vbox.add_child(hbox)

func _on_again_pressed() -> void:
	AudioManager.play_sfx("tick")
	GameState.start_level(GameState.current_level_id, GameState.current_mode)
	get_tree().change_scene_to_file("res://scenes/game/game_main.tscn")

func _on_select_pressed() -> void:
	AudioManager.play_sfx("tick")
	get_tree().change_scene_to_file("res://scenes/ui/level_select.tscn")

func _on_menu_pressed() -> void:
	AudioManager.play_sfx("tick")
	get_tree().change_scene_to_file("res://scenes/ui/main_menu.tscn")
