extends Control

@onready var start_button: Button = $VBoxContainer/StartButton
@onready var replay_button: Button = $VBoxContainer/ReplayButton
@onready var stats_button: Button = $VBoxContainer/StatsButton
@onready var leaderboard_button: Button = $VBoxContainer/LeaderboardButton

func _ready() -> void:
	start_button.pressed.connect(_on_start_pressed)
	replay_button.pressed.connect(_on_replay_pressed)
	stats_button.pressed.connect(_on_stats_pressed)
	leaderboard_button.pressed.connect(_on_leaderboard_pressed)

func _on_start_pressed() -> void:
	GameData.start_round()
	get_tree().change_scene_to_file("res://scenes/game.tscn")

func _on_replay_pressed() -> void:
	get_tree().change_scene_to_file("res://scenes/replay_viewer.tscn")

func _on_stats_pressed() -> void:
	get_tree().change_scene_to_file("res://scenes/statistics.tscn")

func _on_leaderboard_pressed() -> void:
	get_tree().change_scene_to_file("res://scenes/leaderboard.tscn")
