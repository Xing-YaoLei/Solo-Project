extends Control

@onready var back_button: Button = $TopBar/MarginContainer/HBoxContainer/BackButton
@onready var title_label: Label = $TopBar/MarginContainer/HBoxContainer/TitleLabel
@onready var mode_option: OptionButton = $MarginContainer/VBoxContainer/ModePanel/MarginContainer/VBoxContainer/ModeOption
@onready var open_enabled_checkbox: CheckBox = $MarginContainer/VBoxContainer/TimePanel/MarginContainer/VBoxContainer/EnabledCheckbox
@onready var start_time_edit: LineEdit = $MarginContainer/VBoxContainer/TimePanel/MarginContainer/VBoxContainer/TimeRow/StartTimeEdit
@onready var end_time_edit: LineEdit = $MarginContainer/VBoxContainer/TimePanel/MarginContainer/VBoxContainer/TimeRow/EndTimeEdit
@onready var reward_container: VBoxContainer = $MarginContainer/VBoxContainer/RewardPanel/MarginContainer/VBoxContainer/RewardContainer
@onready var save_button: Button = $MarginContainer/VBoxContainer/ButtonRow/SaveButton
@onready var reset_button: Button = $MarginContainer/VBoxContainer/ButtonRow/ResetButton
@onready var hint_label: Label = $MarginContainer/VBoxContainer/HintLabel

func _ready() -> void:
	back_button.pressed.connect(_on_back_pressed)
	save_button.pressed.connect(_on_save_pressed)
	reset_button.pressed.connect(_on_reset_pressed)
	_load_config_to_ui()

func _load_config_to_ui() -> void:
	mode_option.clear()
	var modes = GameManager.game_config.get("training_modes", [])
	var current_mode = GameManager.game_config.get("current_mode", "practice")
	for i in range(modes.size()):
		mode_option.add_item(modes[i]["name"], i)
		if modes[i]["id"] == current_mode:
			mode_option.selected = i
	
	var open_time = GameManager.game_config.get("open_time", {})
	open_enabled_checkbox.button_pressed = open_time.get("enabled", false)
	start_time_edit.text = open_time.get("start", "08:00")
	end_time_edit.text = open_time.get("end", "22:00")
	
	_build_reward_list()

func _build_reward_list() -> void:
	for child in reward_container.get_children():
		child.queue_free()
	
	var rewards = GameManager.game_config.get("rewards", [])
	for i in range(rewards.size()):
		var reward = rewards[i]
		var row := HBoxContainer.new()
		row.add_theme_constant_override("separation", 16)
		reward_container.add_child(row)
		
		var name_label := Label.new()
		name_label.text = reward.get("name", "")
		name_label.add_theme_font_size_override("font_size", 18)
		name_label.custom_minimum_size = Vector2(80, 0)
		name_label.add_theme_color_override("font_color", Color(0.1, 0.2, 0.4, 1))
		row.add_child(name_label)
		
		var star_label := Label.new()
		star_label.text = "★" * reward.get("stars", 0)
		star_label.add_theme_font_size_override("font_size", 18)
		star_label.add_theme_color_override("font_color", Color(0.9, 0.7, 0.1))
		star_label.custom_minimum_size = Vector2(80, 0)
		row.add_child(star_label)
		
		var score_label := Label.new()
		score_label.text = "≥ %d分" % reward.get("min_score", 0)
		score_label.add_theme_font_size_override("font_size", 16)
		score_label.add_theme_color_override("font_color", Color(0.4, 0.45, 0.55, 1))
		score_label.size_flags_horizontal = 3
		row.add_child(score_label)

func _on_save_pressed() -> void:
	var modes = GameManager.game_config.get("training_modes", [])
	var selected_idx = mode_option.selected
	if selected_idx >= 0 and selected_idx < modes.size():
		GameManager.game_config["current_mode"] = modes[selected_idx]["id"]
	
	var start_text = start_time_edit.text.strip_edges()
	var end_text = end_time_edit.text.strip_edges()
	
	if not _is_valid_time_format(start_text) or not _is_valid_time_format(end_text):
		hint_label.text = "时间格式错误，请使用 HH:MM 格式"
		hint_label.add_theme_color_override("font_color", Color(0.85, 0.2, 0.2))
		return
	
	if start_text >= end_text:
		hint_label.text = "开始时间必须早于结束时间"
		hint_label.add_theme_color_override("font_color", Color(0.85, 0.2, 0.2))
		return
	
	GameManager.game_config["open_time"] = {
		"enabled": open_enabled_checkbox.button_pressed,
		"start": start_text,
		"end": end_text
	}
	
	GameManager.save_data()
	hint_label.text = "配置已保存"
	hint_label.add_theme_color_override("font_color", Color(0.1, 0.6, 0.2))

func _is_valid_time_format(text: String) -> bool:
	if text.length() != 5:
		return false
	if text[2] != ":":
		return false
	var hour = text.substr(0, 2).to_int()
	var minute = text.substr(3, 2).to_int()
	return hour >= 0 and hour <= 23 and minute >= 0 and minute <= 59

func _on_reset_pressed() -> void:
	GameManager.reset_config()
	_load_config_to_ui()
	hint_label.text = "已恢复默认配置"
	hint_label.add_theme_color_override("font_color", Color(0.15, 0.4, 0.9, 1))

func _on_back_pressed() -> void:
	SceneManager.go_back()
