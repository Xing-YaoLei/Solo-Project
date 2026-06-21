extends Node

func _ready() -> void:
	_register_autoloads()

func _register_autoloads() -> void:
	var scene_manager := load("res://scripts/managers/scene_manager.gd").new()
	scene_manager.name = "SceneManager"
	get_tree().root.add_child.call_deferred(scene_manager)

	var game_manager := load("res://scripts/managers/game_manager.gd").new()
	game_manager.name = "GameManager"
	get_tree().root.add_child.call_deferred(game_manager)

	var stats_manager := load("res://scripts/managers/stats_manager.gd").new()
	stats_manager.name = "StatsManager"
	get_tree().root.add_child.call_deferred(stats_manager)
