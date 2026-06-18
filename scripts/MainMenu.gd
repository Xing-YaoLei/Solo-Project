extends Control

@onready var start_btn: Button = $ButtonsPanel/StartGameBtn
@onready var stats_btn: Button = $ButtonsPanel/StatisticsBtn
@onready var replay_btn: Button = $ButtonsPanel/ReplayBtn

func _ready() -> void:
	start_btn.pressed.connect(_on_start_game)
	stats_btn.pressed.connect(_on_statistics)
	replay_btn.pressed.connect(_on_replay)

func _on_start_game() -> void:
	GameManager.start_new_game()
	get_tree().change_scene_to_file("res://scenes/Gameplay.tscn")

func _on_statistics() -> void:
	get_tree().change_scene_to_file("res://scenes/Statistics.tscn")

func _on_replay() -> void:
	get_tree().change_scene_to_file("res://scenes/Replay.tscn")
