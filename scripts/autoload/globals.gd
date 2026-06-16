extends Node

var game_manager: GameManager
var replay_manager: ReplayManager
var statistics_manager: StatisticsManager
var scene_manager: SceneManager

var pending_replay_data: Dictionary = {}
var pending_level_id: String = ""

func _ready():
	game_manager = GameManager.new()
	game_manager.name = "GameManager"
	add_child(game_manager)
	
	replay_manager = ReplayManager.new()
	replay_manager.name = "ReplayManager"
	add_child(replay_manager)
	
	statistics_manager = StatisticsManager.new()
	statistics_manager.name = "StatisticsManager"
	add_child(statistics_manager)
	
	scene_manager = SceneManager.new()
	scene_manager.name = "SceneManager"
	add_child(scene_manager)
