extends Node

var _records: Array = []
var _address_replay_data: Dictionary = {}
var _address_retry_counts: Dictionary = {}

const MAX_REPLAY_SAVES: int = 3

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	_load_records()
	_load_address_replay_data()

func _load_records() -> void:
	var path: String = "user://training_records.json"
	if FileAccess.file_exists(path):
		var file: FileAccess = FileAccess.open(path, FileAccess.READ)
		if file:
			var json: JSON = JSON.new()
			var err: Error = json.parse(file.get_as_text())
			if err == OK and json.data is Array:
				_records = json.data
			file.close()

func _save_records() -> void:
	var file: FileAccess = FileAccess.open("user://training_records.json", FileAccess.WRITE)
	if file:
		file.store_string(JSON.stringify(_records, "\t"))
		file.close()

func add_record(record: Dictionary) -> void:
	_records.append(record)
	_save_records()

func get_records() -> Array:
	return _records

func get_records_by_mode(mode: String) -> Array:
	return _records.filter(func(r): return r.get("mode", "") == mode)

func get_latest_record() -> Dictionary:
	if _records.is_empty():
		return {}
	return _records[-1]

func get_rider_activity() -> Array:
	var activity: Array = []
	for record in _records:
		var entry: Dictionary = {
			"timestamp": record.get("timestamp", ""),
			"mode": record.get("mode", ""),
			"score": record.get("total_score", 0),
			"duration": record.get("duration_msec", 0),
			"phase_scores": record.get("phase_scores", {})
		}
		activity.append(entry)
	return activity

func save_address_replay(session_id: String, attempt: Dictionary) -> void:
	if not _address_replay_data.has(session_id):
		_address_replay_data[session_id] = []
	var replays: Array = _address_replay_data[session_id]
	replays.append(attempt)
	if replays.size() > MAX_REPLAY_SAVES:
		replays.pop_front()
	_address_replay_data[session_id] = replays
	_address_retry_counts[session_id] = replays.size()
	_save_address_replay_data()

func get_address_replays(session_id: String) -> Array:
	return _address_replay_data.get(session_id, [])

func get_address_retry_count(session_id: String) -> int:
	return _address_retry_counts.get(session_id, 0)

func can_retry_address(session_id: String) -> bool:
	return get_address_retry_count(session_id) < MAX_REPLAY_SAVES

func compare_attempts(session_id: String) -> Array:
	var replays: Array = get_address_replays(session_id)
	if replays.size() < 2:
		return []
	var comparisons: Array = []
	for i in range(1, replays.size()):
		var prev: Dictionary = replays[i - 1]
		var curr: Dictionary = replays[i]
		var diff: Dictionary = {
			"attempt_a": i,
			"attempt_b": i + 1,
			"order_changes": _compare_orders(prev.get("order", []), curr.get("order", [])),
			"score_diff": curr.get("score", 0) - prev.get("score", 0),
			"time_diff": curr.get("time_msec", 0) - prev.get("time_msec", 0)
		}
		comparisons.append(diff)
	return comparisons

func _compare_orders(order_a: Array, order_b: Array) -> Dictionary:
	var changes: Dictionary = {}
	for i in range(mini(order_a.size(), order_b.size())):
		if order_a[i] != order_b[i]:
			changes[i] = {"from": order_a[i], "to": order_b[i]}
	return changes

func _save_address_replay_data() -> void:
	var file: FileAccess = FileAccess.open("user://address_replay.json", FileAccess.WRITE)
	if file:
		file.store_string(JSON.stringify({"replays": _address_replay_data, "counts": _address_retry_counts}, "\t"))
		file.close()

func _load_address_replay_data() -> void:
	var path: String = "user://address_replay.json"
	if FileAccess.file_exists(path):
		var file: FileAccess = FileAccess.open(path, FileAccess.READ)
		if file:
			var json: JSON = JSON.new()
			var err: Error = json.parse(file.get_as_text())
			if err == OK:
				_address_replay_data = json.data.get("replays", {})
				_address_retry_counts = json.data.get("counts", {})
			file.close()

func generate_session_id() -> String:
	return Time.get_datetime_string_from_system().replace(":", "").replace("-", "").replace("T", "_")

func reload_data() -> void:
	_load_records()
	_load_address_replay_data()

func get_all_session_ids() -> Array:
	return _address_replay_data.keys()

func clear_all_data() -> void:
	_records.clear()
	_address_replay_data.clear()
	_address_retry_counts.clear()
	_save_records()
	_save_address_replay_data()
