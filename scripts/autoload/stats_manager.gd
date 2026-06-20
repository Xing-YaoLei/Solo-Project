extends Node

var session_history: Array = []
var leaderboard: Array = []

const STATS_FILE: String = "user://tvt_stats.json"
const LEADERBOARD_FILE: String = "user://tvt_leaderboard.json"
const MAX_HISTORY: int = 100
const MAX_LEADERBOARD: int = 10

func _ready() -> void:
	load_stats()
	load_leaderboard()

func load_stats() -> void:
	if FileAccess.file_exists(STATS_FILE):
		var file := FileAccess.open(STATS_FILE, FileAccess.READ)
		if file:
			var content: String = file.get_as_text()
			file.close()
			var data: Variant = JSON.parse_string(content)
			if typeof(data) == TYPE_ARRAY:
				session_history = data

func save_stats() -> void:
	var file := FileAccess.open(STATS_FILE, FileAccess.WRITE)
	if file:
		file.store_string(JSON.stringify(session_history))
		file.close()

func load_leaderboard() -> void:
	if FileAccess.file_exists(LEADERBOARD_FILE):
		var file := FileAccess.open(LEADERBOARD_FILE, FileAccess.READ)
		if file:
			var content: String = file.get_as_text()
			file.close()
			var data: Variant = JSON.parse_string(content)
			if typeof(data) == TYPE_ARRAY:
				leaderboard = data

func save_leaderboard() -> void:
	var file := FileAccess.open(LEADERBOARD_FILE, FileAccess.WRITE)
	if file:
		file.store_string(JSON.stringify(leaderboard))
		file.close()

func record_session(session_result: Dictionary) -> void:
	session_history.insert(0, session_result)
	while session_history.size() > MAX_HISTORY:
		session_history.pop_back()
	save_stats()
	_add_to_leaderboard(session_result)

func _add_to_leaderboard(session_result: Dictionary) -> void:
	var entry: Dictionary = {
		"player_name": session_result.get("player_name", "匿名"),
		"level_id": session_result.get("level_id", ""),
		"level_name": session_result.get("level_name", ""),
		"final_score": session_result.get("final_score", 0),
		"accuracy": session_result.get("accuracy", 0.0),
		"avg_processing_seconds": session_result.get("avg_processing_seconds", 0.0),
		"timestamp": session_result.get("timestamp", "")
	}
	leaderboard.append(entry)
	leaderboard.sort_custom(func(a, b): return a["final_score"] > b["final_score"])
	while leaderboard.size() > MAX_LEADERBOARD:
		leaderboard.pop_back()
	save_leaderboard()

func get_leaderboard_for_level(level_id: String) -> Array:
	if level_id == "" or level_id == "all":
		return leaderboard.duplicate()
	var result: Array = []
	for entry in leaderboard:
		if entry.get("level_id", "") == level_id:
			result.append(entry)
	return result

func get_overall_stats() -> Dictionary:
	var total_sessions: int = session_history.size()
	var total_orders: int = 0
	var total_correct: int = 0
	var total_wrong: int = 0
	var total_disputes: int = 0
	var total_score: int = 0
	var level_stats: Dictionary = {}
	var avg_time_sum: float = 0.0
	var avg_time_count: int = 0

	for session in session_history:
		total_orders += session.get("total_orders", 0)
		total_correct += session.get("correct_count", 0)
		total_wrong += session.get("wrong_count", 0)
		total_disputes += session.get("disputed_count", 0)
		total_score += session.get("final_score", 0)
		avg_time_sum += session.get("avg_processing_seconds", 0.0)
		if session.get("avg_processing_seconds", 0.0) > 0:
			avg_time_count += 1

		var lvl_id: String = session.get("level_id", "unknown")
		if not level_stats.has(lvl_id):
			level_stats[lvl_id] = {
				"count": 0,
				"total_score": 0,
				"best_score": 0,
				"total_accuracy": 0.0,
				"avg_time_sum": 0.0,
				"avg_time_count": 0,
				"level_name": session.get("level_name", lvl_id)
			}
		var ls: Dictionary = level_stats[lvl_id]
		ls["count"] += 1
		ls["total_score"] += session.get("final_score", 0)
		ls["best_score"] = max(ls["best_score"], session.get("final_score", 0))
		ls["total_accuracy"] += session.get("accuracy", 0.0)
		ls["avg_time_sum"] += session.get("avg_processing_seconds", 0.0)
		if session.get("avg_processing_seconds", 0.0) > 0:
			ls["avg_time_count"] += 1

	for lvl_id in level_stats:
		var ls: Dictionary = level_stats[lvl_id]
		if ls["count"] > 0:
			ls["avg_score"] = ls["total_score"] / ls["count"]
			ls["avg_accuracy"] = ls["total_accuracy"] / float(ls["count"])
		if ls["avg_time_count"] > 0:
			ls["avg_time"] = ls["avg_time_sum"] / float(ls["avg_time_count"])
		ls["training_effectiveness"] = _calculate_effectiveness(ls)

	var overall_accuracy: float = 0.0
	if total_orders > 0:
		overall_accuracy = float(total_correct) / float(total_orders)
	var avg_score: float = 0.0
	if total_sessions > 0:
		avg_score = float(total_score) / float(total_sessions)
	var overall_avg_time: float = 0.0
	if avg_time_count > 0:
		overall_avg_time = avg_time_sum / float(avg_time_count)

	return {
		"total_sessions": total_sessions,
		"total_orders": total_orders,
		"total_correct": total_correct,
		"total_wrong": total_wrong,
		"total_disputes": total_disputes,
		"overall_accuracy": overall_accuracy,
		"avg_score": avg_score,
		"overall_avg_time": overall_avg_time,
		"level_stats": level_stats,
		"session_history": session_history.duplicate()
	}

func _calculate_effectiveness(ls: Dictionary) -> float:
	var score: float = 0.0
	var avg_score: float = ls.get("avg_score", 0.0)
	var accuracy: float = ls.get("avg_accuracy", 0.0)
	var avg_time: float = ls.get("avg_time", 0.0)
	var count: int = ls.get("count", 0)

	score += clamp(avg_score / 100.0, 0.0, 1.0) * 40.0
	score += accuracy * 35.0
	if avg_time > 0:
		score += clamp(1.0 - (avg_time / 30.0), 0.0, 1.0) * 15.0
	score += clamp(float(count) / 5.0, 0.0, 1.0) * 10.0

	return score

func get_common_wrong_reasons(limit: int = 5) -> Array:
	var reason_count: Dictionary = {}
	for session in session_history:
		for reason in session.get("wrong_reasons", []):
			if not reason_count.has(reason):
				reason_count[reason] = 0
			reason_count[reason] += 1
	var result: Array = []
	for reason in reason_count:
		result.append({"reason": reason, "count": reason_count[reason]})
	result.sort_custom(func(a, b): return a["count"] > b["count"])
	return result.slice(0, limit)

func clear_all_data() -> void:
	session_history.clear()
	leaderboard.clear()
	save_stats()
	save_leaderboard()
