extends Node

const SAVE_PATH := "user://stats_save.json"

var _level_records: Dictionary = {}

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	_load_from_disk()

func record_level(level_id: String, closure_time: float, score: float, timeout_count: int, method: String) -> void:
	var entry := {
		"closure_time": closure_time,
		"score": score,
		"timeout_count": timeout_count,
		"method": method,
		"timestamp": Time.get_datetime_string_from_system(),
	}
	if not _level_records.has(level_id):
		_level_records[level_id] = []
	_level_records[level_id].append(entry)
	_save_to_disk()

func get_level_history(level_id: String) -> Array:
	return _level_records.get(level_id, [])

func get_all_level_ids() -> Array:
	return _level_records.keys()

func get_best_closure_time(level_id: String) -> float:
	var history := get_level_history(level_id)
	if history.is_empty():
		return -1.0
	var best := INF
	for entry in history:
		best = minf(best, entry.get("closure_time", INF))
	return best

func get_average_closure_time(level_id: String) -> float:
	var history := get_level_history(level_id)
	if history.is_empty():
		return -1.0
	var total := 0.0
	for entry in history:
		total += entry.get("closure_time", 0.0)
	return total / history.size()

func get_level_comparison() -> Dictionary:
	var comparison := {}
	for level_id in _level_records:
		comparison[level_id] = {
			"best": get_best_closure_time(level_id),
			"average": get_average_closure_time(level_id),
			"attempts": _level_records[level_id].size(),
		}
	return comparison

func clear_all() -> void:
	_level_records.clear()
	_save_to_disk()

func _save_to_disk() -> void:
	var file := FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	if file == null:
		push_error("StatsManager: cannot open save file")
		return
	var json_string := JSON.stringify(_level_records)
	file.store_string(json_string)
	file.close()

func _load_from_disk() -> void:
	if not FileAccess.file_exists(SAVE_PATH):
		return
	var file := FileAccess.open(SAVE_PATH, FileAccess.READ)
	if file == null:
		return
	var json_string := file.get_as_text()
	file.close()
	var json := JSON.new()
	var err := json.parse(json_string)
	if err != OK:
		push_error("StatsManager: parse error - %s" % json.get_error_message())
		return
	var data = json.data
	if data is Dictionary:
		_level_records = data
