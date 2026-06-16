extends Node
class_name StatisticsManager

const SAVE_PATH: String = "user://statistics.json"

var total_sessions: int = 0
var completed_levels: int = 0
var failed_levels: int = 0
var total_patients_processed: int = 0
var total_correct_triages: int = 0
var total_wrong_triages: int = 0
var total_insurance_rejections: int = 0
var total_training_time: float = 0.0

var level_statistics: Dictionary = {}
var recent_sessions: Array[Dictionary] = []

func _ready():
	load_statistics()

func load_statistics():
	var file: FileAccess = FileAccess.open(SAVE_PATH, FileAccess.READ)
	if file:
		var data: Dictionary = JSON.parse_string(file.get_as_text())
		file.close()
		total_sessions = data.get("total_sessions", 0)
		completed_levels = data.get("completed_levels", 0)
		failed_levels = data.get("failed_levels", 0)
		total_patients_processed = data.get("total_patients_processed", 0)
		total_correct_triages = data.get("total_correct_triages", 0)
		total_wrong_triages = data.get("total_wrong_triages", 0)
		total_insurance_rejections = data.get("total_insurance_rejections", 0)
		total_training_time = data.get("total_training_time", 0.0)
		level_statistics = data.get("level_statistics", {})
		recent_sessions = data.get("recent_sessions", [])

func save_statistics():
	var data: Dictionary = {
		"total_sessions": total_sessions,
		"completed_levels": completed_levels,
		"failed_levels": failed_levels,
		"total_patients_processed": total_patients_processed,
		"total_correct_triages": total_correct_triages,
		"total_wrong_triages": total_wrong_triages,
		"total_insurance_rejections": total_insurance_rejections,
		"total_training_time": total_training_time,
		"level_statistics": level_statistics,
		"recent_sessions": recent_sessions
	}
	var file: FileAccess = FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	if file:
		file.store_string(JSON.stringify(data))
		file.close()

static func record_session(result: Dictionary):
	var instance: StatisticsManager = _get_instance()
	if not instance:
		return
	
	instance.total_sessions += 1
	var passed: bool = result.get("passed", false)
	if passed:
		instance.completed_levels += 1
	else:
		instance.failed_levels += 1
	
	instance.total_patients_processed += result.get("processed_patients", 0)
	instance.total_correct_triages += result.get("correct_count", 0)
	instance.total_wrong_triages += result.get("wrong_count", 0)
	instance.total_insurance_rejections += result.get("insurance_rejections", 0)
	instance.total_training_time += result.get("time_used", 0.0)
	
	var level_id: String = result.get("level_id", "")
	if not instance.level_statistics.has(level_id):
		instance.level_statistics[level_id] = {
			"attempts": 0,
			"completions": 0,
			"best_score": 0,
			"best_accuracy": 0.0,
			"best_time": 0.0,
			"total_time": 0.0
		}
	
	var level_stat: Dictionary = instance.level_statistics[level_id]
	level_stat["attempts"] = level_stat.get("attempts", 0) + 1
	if passed:
		level_stat["completions"] = level_stat.get("completions", 0) + 1
	var score: int = result.get("score", 0)
	if score > level_stat.get("best_score", 0):
		level_stat["best_score"] = score
	var accuracy: float = result.get("accuracy", 0.0)
	if accuracy > level_stat.get("best_accuracy", 0.0):
		level_stat["best_accuracy"] = accuracy
	var time_used: float = result.get("time_used", 0.0)
	var best_time: float = level_stat.get("best_time", 0.0)
	if best_time == 0.0 or (passed and time_used < best_time):
		level_stat["best_time"] = time_used
	level_stat["total_time"] = level_stat.get("total_time", 0.0) + time_used
	
	var session_summary: Dictionary = {
		"timestamp": result.get("timestamp", ""),
		"level_id": level_id,
		"level_name": result.get("level_name", ""),
		"passed": passed,
		"score": score,
		"accuracy": accuracy,
		"time_used": time_used
	}
	instance.recent_sessions.append(session_summary)
	while instance.recent_sessions.size() > 20:
		instance.recent_sessions.remove_at(0)
	
	instance.save_statistics()

func get_overall_statistics() -> Dictionary:
	var overall_accuracy: float = 0.0
	var total_triages: int = total_correct_triages + total_wrong_triages
	if total_triages > 0:
		overall_accuracy = float(total_correct_triages) / float(total_triages)
	
	var completion_rate: float = 0.0
	if total_sessions > 0:
		completion_rate = float(completed_levels) / float(total_sessions)
	
	return {
		"total_sessions": total_sessions,
		"completed_levels": completed_levels,
		"failed_levels": failed_levels,
		"completion_rate": completion_rate,
		"total_patients_processed": total_patients_processed,
		"total_correct_triages": total_correct_triages,
		"total_wrong_triages": total_wrong_triages,
		"overall_accuracy": overall_accuracy,
		"total_insurance_rejections": total_insurance_rejections,
		"total_training_time": total_training_time,
		"level_statistics": level_statistics
	}

func get_level_statistics(level_id: String) -> Dictionary:
	if level_statistics.has(level_id):
		return level_statistics[level_id]
	return {}

func get_training_completion_rate() -> float:
	if total_sessions == 0:
		return 0.0
	return float(completed_levels) / float(total_sessions)

func get_recent_sessions(count: int = 10) -> Array[Dictionary]:
	var recent: Array[Dictionary] = []
	var start: int = max(0, recent_sessions.size() - count)
	for i in range(start, recent_sessions.size()):
		recent.append(recent_sessions[i])
	recent.reverse()
	return recent

func format_time(seconds: float) -> String:
	var hours: int = int(seconds / 3600)
	var minutes: int = int((seconds % 3600) / 60)
	var secs: int = int(seconds % 60)
	if hours > 0:
		return "%d小时%d分钟" % [hours, minutes]
	elif minutes > 0:
		return "%d分钟%d秒" % [minutes, secs]
	else:
		return "%d秒" % secs

func reset_statistics():
	total_sessions = 0
	completed_levels = 0
	failed_levels = 0
	total_patients_processed = 0
	total_correct_triages = 0
	total_wrong_triages = 0
	total_insurance_rejections = 0
	total_training_time = 0.0
	level_statistics.clear()
	recent_sessions.clear()
	save_statistics()

static func _get_instance() -> StatisticsManager:
	var main: Node = get_tree().root.get_node_or_null("Main")
	if main:
		var manager: Node = main.get_node_or_null("StatisticsManager")
		if manager:
			return manager
	return null
