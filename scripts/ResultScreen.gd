extends Control

@onready var back_button: Button = $TopBar/MarginContainer/HBoxContainer/BackButton
@onready var title_label: Label = $TopBar/MarginContainer/HBoxContainer/TitleLabel
@onready var score_label: Label = $MarginContainer/VBoxContainer/ScorePanel/MarginContainer/VBoxContainer/ScoreLabel
@onready var stars_label: Label = $MarginContainer/VBoxContainer/ScorePanel/MarginContainer/VBoxContainer/StarsLabel
@onready var reward_label: Label = $MarginContainer/VBoxContainer/ScorePanel/MarginContainer/VBoxContainer/RewardLabel
@onready var duration_label: Label = $MarginContainer/VBoxContainer/DetailsPanel/MarginContainer/VBoxContainer/DurationLabel
@onready var mode_label: Label = $MarginContainer/VBoxContainer/DetailsPanel/MarginContainer/VBoxContainer/ModeLabel
@onready var level_label: Label = $MarginContainer/VBoxContainer/DetailsPanel/MarginContainer/VBoxContainer/LevelLabel
@onready var error_container: VBoxContainer = $MarginContainer/VBoxContainer/ErrorPanel/MarginContainer/VBoxContainer/ScrollContainer/ErrorContainer
@onready var retry_button: Button = $MarginContainer/VBoxContainer/ButtonContainer/RetryButton
@onready var back_menu_button: Button = $MarginContainer/VBoxContainer/ButtonContainer/BackMenuButton

func _ready() -> void:
	back_button.pressed.connect(_on_back_pressed)
	retry_button.pressed.connect(_on_retry_pressed)
	back_menu_button.pressed.connect(_on_back_menu_pressed)
	_display_result()

func _display_result() -> void:
	var result = SceneManager.last_result
	if result.is_empty():
		score_label.text = "0"
		stars_label.text = ""
		reward_label.text = ""
		duration_label.text = "用时: --"
		mode_label.text = "模式: --"
		level_label.text = "关卡: --"
		return
	
	var score: int = result.get("score", 0)
	var stars: int = result.get("stars", 0)
	var duration: float = result.get("duration", 0.0)
	var level_name: String = result.get("level_name", "未知")
	var mode: String = result.get("mode", "practice")
	
	score_label.text = "%d" % score
	score_label.add_theme_font_size_override("font_size", 64)
	
	if score >= 95:
		score_label.add_theme_color_override("font_color", Color(0.1, 0.6, 0.2))
	elif score >= 80:
		score_label.add_theme_color_override("font_color", Color(0.15, 0.4, 0.9))
	elif score >= 60:
		score_label.add_theme_color_override("font_color", Color(0.85, 0.6, 0.1))
	else:
		score_label.add_theme_color_override("font_color", Color(0.85, 0.2, 0.2))
	
	var stars_text := ""
	for i in range(3):
		if i < stars:
			stars_text += "★"
		else:
			stars_text += "☆"
	stars_label.text = stars_text
	stars_label.add_theme_font_size_override("font_size", 36)
	stars_label.add_theme_color_override("font_color", Color(0.9, 0.7, 0.1))
	
	var reward_name := "未获得奖励"
	for reward in GameManager.game_config.get("rewards", []):
		if score >= reward["min_score"]:
			reward_name = reward["name"]
	reward_label.text = reward_name
	reward_label.add_theme_font_size_override("font_size", 20)
	
	var minutes := int(duration) / 60
	var seconds := int(duration) % 60
	duration_label.text = "用时: %02d:%02d" % [minutes, seconds]
	
	var mode_name := "练习模式"
	for m in GameManager.game_config.get("training_modes", []):
		if m["id"] == mode:
			mode_name = m["name"]
	mode_label.text = "模式: " + mode_name
	
	level_label.text = "关卡: " + level_name
	
	var errors: Array = result.get("error_details", [])
	for child in error_container.get_children():
		child.queue_free()
	
	if errors.size() > 0:
		for err in errors:
			var err_label := Label.new()
			err_label.text = "• " + str(err)
			err_label.add_theme_font_size_override("font_size", 15)
			err_label.add_theme_color_override("font_color", Color(0.7, 0.2, 0.2, 1))
			err_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
			error_container.add_child(err_label)
	else:
		var perfect_label := Label.new()
		perfect_label.text = "完美通关！没有错误"
		perfect_label.add_theme_font_size_override("font_size", 16)
		perfect_label.add_theme_color_override("font_color", Color(0.1, 0.6, 0.2, 1))
		error_container.add_child(perfect_label)

func _on_retry_pressed() -> void:
	var level_type = SceneManager.current_level_type
	var level_index = SceneManager.current_level_index
	SceneManager.start_level(level_type, level_index)

func _on_back_menu_pressed() -> void:
	SceneManager.change_scene("level_select")

func _on_back_pressed() -> void:
	SceneManager.change_scene("level_select")
