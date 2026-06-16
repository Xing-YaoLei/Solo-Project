extends Node

const MAX_REPLAYS: int = 3

var _replays: Array = []

signal replay_added(replay: Dictionary)
signal replay_list_changed()

func _ready() -> void:
	_load_replays()

func add_replay(patient_id: String, decisions: Array, error_category: int, error_details: String) -> void:
	var replay = {
		"patient_id": patient_id,
		"timestamp": Time.get_datetime_string_from_system(),
		"decisions": decisions.duplicate(true),
		"error_category": error_category,
		"error_details": error_details,
		"hesitation_points": _extract_hesitation_points(decisions),
		"playback_data": _build_playback_data(decisions),
	}
	_replays.append(replay)
	if _replays.size() > MAX_REPLAYS:
		_replays.pop_front()
	replay_added.emit(replay)
	replay_list_changed.emit()
	_save_replays()

func get_replays() -> Array:
	return _replays.duplicate(true)

func get_replay(index: int) -> Dictionary:
	if index >= 0 and index < _replays.size():
		return _replays[index].duplicate(true)
	return {}

func clear_replays() -> void:
	_replays.clear()
	replay_list_changed.emit()
	_save_replays()

func _extract_hesitation_points(decisions: Array) -> Array:
	var points = []
	for d in decisions:
		if d.get("response_time", 0.0) > 2.0 or not d.get("correct", true):
			points.append({
				"task_type": d.get("task_type", -1),
				"response_time": d.get("response_time", 0.0),
				"correct": d.get("correct", true),
				"is_hesitation": d.get("response_time", 0.0) > 2.0,
			})
	return points

func _build_playback_data(decisions: Array) -> Array:
	var playback = []
	var cumulative_time = 0.0
	for d in decisions:
		cumulative_time += d.get("response_time", 0.0)
		playback.append({
			"task_type": d.get("task_type", -1),
			"correct": d.get("correct", true),
			"elapsed": cumulative_time,
			"hesitation": d.get("response_time", 0.0) > 2.0,
		})
	return playback

func _save_replays() -> void:
	var save_data = {
		"replays": _replays,
	}
	var file = FileAccess.open("user://replays.save", FileAccess.WRITE)
	if file:
		file.store_string(JSON.stringify(save_data))
		file.close()

func _load_replays() -> void:
	if FileAccess.file_exists("user://replays.save"):
		var file = FileAccess.open("user://replays.save", FileAccess.READ)
		if file:
			var json = JSON.new()
			var err = json.parse(file.get_as_text())
			file.close()
			if err == OK:
				var data = json.data
				if data is Dictionary and data.has("replays"):
					_replays = data["replays"]
					if _replays.size() > MAX_REPLAYS:
						_replays = _replays.slice(_replays.size() - MAX_REPLAYS)
