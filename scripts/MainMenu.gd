extends Control

@onready var title_label: Label = $MarginContainer/VBoxContainer/TitleLabel
@onready var subtitle_label: Label = $MarginContainer/VBoxContainer/SubtitleLabel
@onready var mode_label: Label = $MarginContainer/VBoxContainer/ModePanel/MarginContainer/VBoxContainer/ModeLabel
@onready var start_button: Button = $MarginContainer/VBoxContainer/ButtonContainer/StartButton
@onready var stats_button: Button = $MarginContainer/VBoxContainer/ButtonContainer/StatsButton
@onready var config_button: Button = $MarginContainer/VBoxContainer/ButtonContainer/ConfigButton
@onready var time_status_label: Label = $MarginContainer/VBoxContainer/TimeStatusLabel

func _ready() -> void:
	_refresh_mode_display()
	_check_open_time()
	start_button.pressed.connect(_on_start_pressed)
	stats_button.pressed.connect(_on_stats_pressed)
	config_button.pressed.connect(_on_config_pressed)

func _refresh_mode_display() -> void:
	var current_mode = GameManager.game_config.get("current_mode", "practice")
	var mode_name = "练习模式"
	for mode in GameManager.game_config.get("training_modes", []):
		if mode["id"] == current_mode:
			mode_name = mode["name"]
	mode_label.text = "当前训练模式: " + mode_name

func _check_open_time() -> void:
	if GameManager.is_within_open_time():
		time_status_label.text = "系统状态: 开放中"
		time_status_label.add_theme_color_override("font_color", Color(0.1, 0.6, 0.2))
	else:
		time_status_label.text = "系统状态: 非开放时间 (开放时间 %s-%s)" % [
			GameManager.game_config.get("open_time", {}).get("start", "08:00"),
			GameManager.game_config.get("open_time", {}).get("end", "22:00")
		]
		time_status_label.add_theme_color_override("font_color", Color(0.8, 0.2, 0.2))

func _on_start_pressed() -> void:
	if not GameManager.is_within_open_time():
		_show_notice("当前非开放时间，请在开放时间内训练")
		return
	SceneManager.change_scene("level_select")

func _on_stats_pressed() -> void:
	SceneManager.change_scene("statistics")

func _on_config_pressed() -> void:
	SceneManager.change_scene("config")

func _show_notice(text: String) -> void:
	var dialog := AcceptDialog.new()
	dialog.title = "提示"
	dialog.dialog_text = text
	dialog.ok_button_text = "确定"
	add_child(dialog)
	dialog.popup_centered()
