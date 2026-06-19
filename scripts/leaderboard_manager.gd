extends Node

signal scores_updated()

var conversion_scores: Array = []
var time_scores: Array = []

const SAVE_PATH = "user://leaderboard.save"
const MAX_ENTRIES = 10

func _ready():
	_load_scores()

func _load_scores():
	var file = FileAccess.open(SAVE_PATH, FileAccess.READ)
	if file:
		var data = file.get_var()
		if data is Dictionary:
			conversion_scores = data.get("conversion", [])
			time_scores = data.get("time", [])
		file.close()

func save_scores():
	var file = FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	if file:
		file.store_var({
			"conversion": conversion_scores,
			"time": time_scores
		})
		file.close()
		scores_updated.emit()

func add_score(result: Dictionary):
	var entry = {
		"level_id": result.get("level_id", ""),
		"level_name": result.get("level_name", ""),
		"score": result.get("score", 0),
		"correct_tasks": result.get("correct_tasks", 0),
		"total_tasks": result.get("total_tasks", 0),
		"conversion_rate": result.get("conversion_rate", 0.0),
		"time_taken": result.get("time_taken", 0.0),
		"max_combo": result.get("max_combo", 0),
		"timestamp": Time.get_unix_time_from_system()
	}
	
	_add_to_conversion_list(entry.duplicate())
	_add_to_time_list(entry.duplicate())
	
	save_scores()

func _add_to_conversion_list(entry: Dictionary):
	conversion_scores.append(entry)
	conversion_scores.sort_custom(func(a, b):
		if a.conversion_rate != b.conversion_rate:
			return a.conversion_rate > b.conversion_rate
		return a.score > b.score
	)
	
	while len(conversion_scores) > MAX_ENTRIES:
		conversion_scores.pop_back()

func _add_to_time_list(entry: Dictionary):
	time_scores.append(entry)
	time_scores.sort_custom(func(a, b):
		if a.time_taken != b.time_taken:
			return a.time_taken < b.time_taken
		return a.conversion_rate > b.conversion_rate
	)
	
	while len(time_scores) > MAX_ENTRIES:
		time_scores.pop_back()

func get_conversion_ranking(level_id: String = "") -> Array:
	if level_id == "":
		return conversion_scores
	var filtered: Array = []
	for entry in conversion_scores:
		if entry.get("level_id", "") == level_id:
			filtered.append(entry)
	return filtered

func get_time_ranking(level_id: String = "") -> Array:
	if level_id == "":
		return time_scores
	var filtered: Array = []
	for entry in time_scores:
		if entry.get("level_id", "") == level_id:
			filtered.append(entry)
	return filtered

func get_best_conversion(level_id: String) -> Dictionary:
	var list = get_conversion_ranking(level_id)
	if not list.is_empty():
		return list[0]
	return {}

func get_best_time(level_id: String) -> Dictionary:
	var list = get_time_ranking(level_id)
	if not list.is_empty():
		return list[0]
	return {}

func clear_scores():
	conversion_scores = []
	time_scores = []
	save_scores()

func format_time(seconds: float) -> String:
	var mins = int(seconds / 60)
	var secs = int(seconds % 60)
	return "%02d:%02d" % [mins, secs]

func format_conversion_rate(rate: float) -> String:
	return "%.1f%%" % [rate * 100]
