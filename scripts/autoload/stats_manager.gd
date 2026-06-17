extends Node

const SAVE_PATH := "user://stats.save"

var level_stats: Dictionary = {}

func _ready() -> void:
	_load_stats()

func _load_stats() -> void:
	var file := FileAccess.open(SAVE_PATH, FileAccess.READ)
	if file:
		var data := file.get_var()
		if data is Dictionary and data.has("level_stats"):
			level_stats = data.level_stats
		file.close()

func save_stats() -> void:
	var file := FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	if file:
		var data := {
			"level_stats": level_stats
		}
		file.store_var(data)
		file.close()

func record_level_result(level_id: String, score: int, accuracy: float, satisfaction: int, combo: int) -> void:
	if not level_stats.has(level_id):
		level_stats[level_id] = {
			"best_score": 0,
			"best_satisfaction": 0,
			"best_combo": 0,
			"best_accuracy": 0.0,
			"total_plays": 0,
			"total_score": 0,
			"total_satisfaction": 0,
			"avg_score": 0,
			"avg_satisfaction": 0
		}
	
	var stats: Dictionary = level_stats[level_id]
	stats.total_plays += 1
	stats.total_score += score
	stats.total_satisfaction += satisfaction
	stats.avg_score = stats.total_score / stats.total_plays
	stats.avg_satisfaction = stats.total_satisfaction / stats.total_plays
	
	if score > stats.best_score:
		stats.best_score = score
	if satisfaction > stats.best_satisfaction:
		stats.best_satisfaction = satisfaction
	if combo > stats.best_combo:
		stats.best_combo = combo
	if accuracy > stats.best_accuracy:
		stats.best_accuracy = accuracy
	
	save_stats()

func get_level_stats(level_id: String) -> Dictionary:
	if level_stats.has(level_id):
		return level_stats[level_id]
	return {}

func get_all_levels_sorted_by_satisfaction() -> Array:
	var result: Array = []
	for level_id in level_stats:
		var stats: Dictionary = level_stats[level_id]
		result.append({
			"level_id": level_id,
			"best_satisfaction": stats.best_satisfaction,
			"avg_satisfaction": stats.avg_satisfaction,
			"total_plays": stats.total_plays
		})
	result.sort_custom(func(a, b): return a.best_satisfaction > b.best_satisfaction)
	return result

func reset_all_stats() -> void:
	level_stats.clear()
	save_stats()
