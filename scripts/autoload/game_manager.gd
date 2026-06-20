extends Node

signal current_level_changed(new_level: Dictionary)
signal game_state_changed(new_state: String)

enum GameState {
	MENU,
	LEVEL_SELECT,
	PLAYING,
	TUTORIAL,
	RESULTS,
	STATS
}

var current_state: int = GameState.MENU
var current_level: Dictionary = {}
var current_orders: Array = []
var current_order_index: int = 0

var unlocked_level_ids: Array = []
var level_high_scores: Dictionary = {}
var player_name: String = "核销员"

const SAVE_FILE: String = "user://tvt_save.json"

func _ready() -> void:
	randomize()
	load_progress()

func load_progress() -> void:
	if FileAccess.file_exists(SAVE_FILE):
		var file := FileAccess.open(SAVE_FILE, FileAccess.READ)
		if file:
			var content: String = file.get_as_text()
			file.close()
			var data: Variant = JSON.parse_string(content)
			if typeof(data) == TYPE_DICTIONARY:
				unlocked_level_ids = data.get("unlocked_levels", ["level_01"])
				level_high_scores = data.get("high_scores", {})
				player_name = data.get("player_name", "核销员")

func save_progress() -> void:
	var data: Dictionary = {
		"unlocked_levels": unlocked_level_ids,
		"high_scores": level_high_scores,
		"player_name": player_name
	}
	var file := FileAccess.open(SAVE_FILE, FileAccess.WRITE)
	if file:
		file.store_string(JSON.stringify(data))
		file.close()

func set_state(new_state: int) -> void:
	current_state = new_state
	var state_names: Array = ["MENU", "LEVEL_SELECT", "PLAYING", "TUTORIAL", "RESULTS", "STATS"]
	game_state_changed.emit(state_names[new_state])

func start_level(level_id: String) -> void:
	current_level = DataLoader.get_level_by_id(level_id)
	current_orders = DataLoader.generate_random_orders(current_level)
	current_order_index = 0
	current_level_changed.emit(current_level)
	set_state(GameState.PLAYING)
	change_scene("res://scenes/game_play.tscn")

func go_to_level_select() -> void:
	set_state(GameState.LEVEL_SELECT)
	change_scene("res://scenes/level_select.tscn")

func go_to_main_menu() -> void:
	set_state(GameState.MENU)
	change_scene("res://scenes/main_menu.tscn")

func go_to_results(session_result: Dictionary) -> void:
	var level_id: String = current_level.get("id", "")
	var final_score: int = session_result.get("final_score", 0)
	if level_id != "":
		if not level_high_scores.has(level_id) or level_high_scores[level_id] < final_score:
			level_high_scores[level_id] = final_score
		if final_score >= current_level.get("min_score_to_pass", 60):
			_unlock_next_level(level_id)
		save_progress()
	StatsManager.record_session(session_result)
	set_state(GameState.RESULTS)
	ScoreManager.current_session_result = session_result
	change_scene("res://scenes/results.tscn")

func go_to_stats() -> void:
	set_state(GameState.STATS)
	change_scene("res://scenes/stats.tscn")

func go_to_tutorial(tutorial_id: String = "tutorial_basics") -> void:
	ScoreManager.current_tutorial_id = tutorial_id
	set_state(GameState.TUTORIAL)
	change_scene("res://scenes/tutorial.tscn")

func _unlock_next_level(level_id: String) -> void:
	var all_levels: Array = DataLoader.levels
	for i in range(all_levels.size()):
		if all_levels[i]["id"] == level_id and i + 1 < all_levels.size():
			var next_id: String = all_levels[i + 1]["id"]
			if not next_id in unlocked_level_ids:
				unlocked_level_ids.append(next_id)
			break

func is_level_unlocked(level_id: String) -> bool:
	return level_id in unlocked_level_ids or level_id == "level_01"

func change_scene(scene_path: String) -> void:
	get_tree().change_scene_to_file(scene_path)
