extends Control

@onready var start_button: Button = %StartButton
@onready var training_button: Button = %TrainingButton
@onready var practice_button: Button = %PracticeButton
@onready var leaderboard_button: Button = %LeaderboardButton
@onready var settings_button: Button = %SettingsButton
@onready var exit_button: Button = %ExitButton

func _ready():
	start_button.pressed.connect(_on_start_pressed)
	training_button.pressed.connect(_on_training_pressed)
	practice_button.pressed.connect(_on_practice_pressed)
	leaderboard_button.pressed.connect(_on_leaderboard_pressed)
	settings_button.pressed.connect(_on_settings_pressed)
	exit_button.pressed.connect(_on_exit_pressed)

func _on_start_pressed():
	GameManager.current_level = null
	get_tree().change_scene_to_file("res://scenes/level_select.tscn")

func _on_training_pressed():
	GameManager.current_level = null
	get_tree().change_scene_to_file("res://scenes/level_select.tscn")

func _on_practice_pressed():
	GameManager.current_level = null
	get_tree().change_scene_to_file("res://scenes/level_select.tscn")

func _on_leaderboard_pressed():
	AudioManager.play_sfx("click")
	get_tree().change_scene_to_file("res://scenes/leaderboard.tscn")

func _on_settings_pressed():
	AudioManager.play_sfx("click")
	get_tree().change_scene_to_file("res://scenes/settings.tscn")

func _enter_tree():
	if SettingsManager.get("show_tutorial", true):
		SettingsManager.set("show_tutorial", false)
		SettingsManager.save_settings()
		_call_deferred_start_tutorial()

func _call_deferred_start_tutorial():
	call_deferred("_start_tutorial")

func _start_tutorial():
	get_tree().change_scene_to_file("res://scenes/tutorial.tscn")

func _on_exit_pressed():
	get_tree().quit()
