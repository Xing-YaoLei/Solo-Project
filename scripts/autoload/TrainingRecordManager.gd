extends Node

const RECORDS_PATH := "user://training_records.json"
var records: Array = []
var mistake_statistics: Dictionary = {}

func _ready() -> void:
	load_records()

func load_records() -> void:
	var dir := DirAccess.open("user://")
	if dir.file_exists("training_records.json"):
		var file := FileAccess.open(RECORDS_PATH, FileAccess.READ)
		if file:
			var data := JSON.parse_string(file.get_as_text())
			file.close()
			if data and data is Dictionary:
				records = data.get("records", [])
				mistake_statistics = data.get("mistake_statistics", {})
				return
	records = []
	mistake_statistics = {}

func save_records() -> void:
	var data := {
		"records": records,
		"mistake_statistics": mistake_statistics
	}
	var file := FileAccess.open(RECORDS_PATH, FileAccess.WRITE)
	if file:
		file.store_string(JSON.stringify(data))
		file.close()

func add_record(record: Dictionary) -> void:
	var record_copy = record.duplicate(true)
	records.append(record_copy)
	if record.get("mode") == "formal":
		_update_mistake_statistics(record_copy)
	_check_and_award_rewards(record_copy)
	save_records()

func _update_mistake_statistics(record: Dictionary) -> void:
	for mistake in record.get("mistakes", []):
		var mistake_type = mistake.get("mistake_type", "unknown")
		if not mistake_statistics.has(mistake_type):
			mistake_statistics[mistake_type] = {
				"count": 0,
				"instances": []
			}
		mistake_statistics[mistake_type]["count"] += 1
		mistake_statistics[mistake_type]["instances"].append({
			"question_id": mistake.get("question_id", ""),
			"timestamp": record.get("end_time", 0)
		})

func _check_and_award_rewards(record: Dictionary) -> Dictionary:
	var awarded: Dictionary = {}
	var accuracy = record.get("accuracy", 0.0)
	var mistakes = record.get("mistakes", [])
	var question_count = len(record.get("questions", []))
	var formal_records = get_records_by_mode("formal")
	
	if len(formal_records) == 1:
		awarded["badge_bronze"] = true
	if accuracy >= 0.8:
		awarded["badge_silver"] = true
	if accuracy >= 0.95:
		awarded["badge_gold"] = true
	if question_count > 0 and len(mistakes) == 0:
		awarded["badge_perfect"] = true
	return awarded

func get_records_by_mode(mode: String) -> Array:
	var result: Array = []
	for record in records:
		if record.get("mode") == mode:
			result.append(record)
	result.sort_custom(func(a, b): return a.get("end_time", 0) > b.get("end_time", 0))
	return result

func get_records_by_level(level_id: String) -> Array:
	var result: Array = []
	for record in records:
		if record.get("level_id") == level_id:
			result.append(record)
	result.sort_custom(func(a, b): return a.get("end_time", 0) > b.get("end_time", 0))
	return result

func get_recent_records(limit: int = 10) -> Array:
	var sorted = records.duplicate()
	sorted.sort_custom(func(a, b): return a.get("end_time", 0) > b.get("end_time", 0))
	if limit > 0 and len(sorted) > limit:
		sorted.resize(limit)
	return sorted

func get_mistake_recurrence() -> Array:
	var result: Array = []
	for mistake_type in mistake_statistics.keys():
		var data = mistake_statistics[mistake_type]
		result.append({
			"mistake_type": mistake_type,
			"count": data.get("count", 0),
			"recurrence_rate": float(data.get("count", 0)) / float(len(records)) if len(records) > 0 else 0.0,
			"recent_instances": data.get("instances", [])
		})
	result.sort_custom(func(a, b): return a["count"] > b["count"])
	return result

func get_statistics_summary() -> Dictionary:
	var formal_records = get_records_by_mode("formal")
	var total_score = 0
	var total_max_score = 0
	var total_accuracy = 0.0
	for record in formal_records:
		total_score += record.get("total_score", 0)
		total_max_score += record.get("max_score", 1)
		total_accuracy += record.get("accuracy", 0.0)
	return {
		"total_training_count": len(records),
		"formal_training_count": len(formal_records),
		"average_accuracy": total_accuracy / float(len(formal_records)) if len(formal_records) > 0 else 0.0,
		"total_score": total_score,
		"total_max_score": total_max_score,
		"permission_violation_count": _count_permission_violations(),
		"mistake_types": get_mistake_recurrence()
	}

func _count_permission_violations() -> int:
	var count = 0
	for record in records:
		count += len(record.get("permission_violations", []))
	return count

func clear_all_records() -> void:
	records = []
	mistake_statistics = {}
	save_records()
