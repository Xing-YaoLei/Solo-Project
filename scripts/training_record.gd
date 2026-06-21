extends Node

signal record_updated()

var records: Array = []
var best_scores: Dictionary = {}

const SAVE_FILE := "user://training_records.json"

func _ready() -> void:
	_load_records()

func add_record(level_id: int, level_name: String, score: float, attendance_rate: float, 
		assignment_rate: float, conflict_rate: float, duration: int, is_passed: bool) -> Dictionary:
	var record: Dictionary = {
		"id": Time.get_unix_time_from_system(),
		"level_id": level_id,
		"level_name": level_name,
		"score": score,
		"attendance_rate": attendance_rate,
		"assignment_rate": assignment_rate,
		"conflict_rate": conflict_rate,
		"duration": duration,
		"is_passed": is_passed,
		"timestamp": Time.get_datetime_string_from_system(),
	}
	
	records.append(record)
	
	if not best_scores.has(str(level_id)):
		best_scores[str(level_id)] = {
			"score": 0.0,
			"attendance_rate": 0.0,
			"attempts": 0,
			"pass_count": 0,
		}
	
	var best: Dictionary = best_scores[str(level_id)]
	best["attempts"] = best.get("attempts", 0) + 1
	if is_passed:
		best["pass_count"] = best.get("pass_count", 0) + 1
	if score > best.get("score", 0.0):
		best["score"] = score
	if attendance_rate > best.get("attendance_rate", 0.0):
		best["attendance_rate"] = attendance_rate
	
	_save_records()
	emit_signal("record_updated")
	return record

func get_records() -> Array:
	return records.duplicate(true)

func get_records_by_level(level_id: int) -> Array:
	var result: Array = []
	for record in records:
		if record.get("level_id") == level_id:
			result.append(record)
	return result

func get_best_score(level_id: int) -> Dictionary:
	if best_scores.has(str(level_id)):
		return best_scores[str(level_id)].duplicate(true)
	return {"score": 0.0, "attendance_rate": 0.0, "attempts": 0, "pass_count": 0}

func get_all_best_scores() -> Dictionary:
	return best_scores.duplicate(true)

func get_statistics() -> Dictionary:
	var total_attempts: int = 0
	var total_passes: int = 0
	var total_score_sum: float = 0.0
	var total_attendance_sum: float = 0.0
	
	for level_id_str in best_scores.keys():
		var best: Dictionary = best_scores[level_id_str]
		total_attempts += best.get("attempts", 0)
		total_passes += best.get("pass_count", 0)
		total_score_sum += best.get("score", 0.0)
		total_attendance_sum += best.get("attendance_rate", 0.0)
	
	var level_count: int = best_scores.size()
	var avg_score: float = 0.0
	var avg_attendance: float = 0.0
	
	if level_count > 0:
		avg_score = total_score_sum / float(level_count)
		avg_attendance = total_attendance_sum / float(level_count)
	
	return {
		"total_attempts": total_attempts,
		"total_passes": total_passes,
		"average_score": avg_score,
		"average_attendance": avg_attendance,
		"unlocked_levels": _count_unlocked_levels(),
	}

func is_level_unlocked(level_id: int) -> bool:
	if level_id == 1:
		return true
	
	var prev_level_id: int = level_id - 1
	var prev_best: Dictionary = get_best_score(prev_level_id)
	
	var levels: Array = DataManager.get_levels()
	var required_score: int = 60
	for level in levels:
		if level.get("id") == prev_level_id:
			required_score = level.get("required_score", 60)
			break
	
	return prev_best.get("score", 0.0) >= float(required_score)

func _count_unlocked_levels() -> int:
	var count: int = 0
	var levels: Array = DataManager.get_levels()
	for level in levels:
		var level_id: int = level.get("id", 0)
		if is_level_unlocked(level_id):
			count += 1
	return count

func _save_records() -> void:
	var save_data: Dictionary = {
		"records": records,
		"best_scores": best_scores,
	}
	
	var file := FileAccess.open(SAVE_FILE, FileAccess.WRITE)
	if file:
		file.store_string(JSON.stringify(save_data))
		file.close()

func _load_records() -> void:
	if not FileAccess.file_exists(SAVE_FILE):
		return
	
	var file := FileAccess.open(SAVE_FILE, FileAccess.READ)
	if file:
		var content: String = file.get_as_text()
		file.close()
		
		var parsed = JSON.parse_string(content)
		if typeof(parsed) == TYPE_DICTIONARY:
			records = parsed.get("records", [])
			best_scores = parsed.get("best_scores", {})

func clear_records() -> void:
	records.clear()
	best_scores.clear()
	_save_records()
	emit_signal("record_updated")

func get_recent_records(count: int = 10) -> Array:
	var sorted_records: Array = records.duplicate(true)
	sorted_records.sort_custom(func(a, b): return a.get("id", 0) > b.get("id", 0))
	
	if sorted_records.size() > count:
		sorted_records = sorted_records.slice(0, count)
	
	return sorted_records
