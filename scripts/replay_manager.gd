extends Node

const MAX_REPLAYS: int = 3
const RECORD_ERROR_CATEGORIES: Array = [
	2,
	3,
]

var _general_replays: Array = []
var _record_replays: Array = []

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
		"is_record_error": _is_record_error(error_category),
		"hesitation_points": _extract_hesitation_points(decisions),
		"playback_data": _build_playback_data(decisions),
	}
	var target_list: Array = _record_replays if replay["is_record_error"] else _general_replays
	target_list.append(replay)
	if target_list.size() > MAX_REPLAYS:
		target_list.pop_front()
	replay_added.emit(replay)
	replay_list_changed.emit()
	_save_replays()

func get_replays() -> Array:
	var all: Array = []
	all.append_array(_record_replays)
	all.append_array(_general_replays)
	return all

func get_record_replays() -> Array:
	return _record_replays.duplicate(true)

func get_general_replays() -> Array:
	return _general_replays.duplicate(true)

func get_replay(index: int) -> Dictionary:
	var all: Array = get_replays()
	if index >= 0 and index < all.size():
		return all[index].duplicate(true)
	return {}

func clear_replays() -> void:
	_general_replays.clear()
	_record_replays.clear()
	replay_list_changed.emit()
	_save_replays()

func _is_record_error(category: int) -> bool:
	return category in RECORD_ERROR_CATEGORIES

func _extract_hesitation_points(decisions: Array) -> Array:
	var points = []
	for d in decisions:
		var resp_time: float = d.get("response_time", 0.0)
		var is_correct: bool = d.get("correct", true)
		if resp_time > 2.0 or not is_correct:
			points.append({
				"task_type": d.get("task_type", -1),
				"response_time": resp_time,
				"correct": is_correct,
				"is_hesitation": resp_time > 2.0,
			})
	return points

func _build_playback_data(decisions: Array) -> Array:
	var playback = []
	var cumulative_time = 0.0
	for d in decisions:
		var resp_time: float = d.get("response_time", 0.0)
		cumulative_time += resp_time
		playback.append({
			"task_type": d.get("task_type", -1),
			"correct": d.get("correct", true),
			"elapsed": cumulative_time,
			"response_time": resp_time,
			"hesitation": resp_time > 2.0,
		})
	return playback

func _save_replays() -> void:
	var save_data = {
		"general_replays": _general_replays,
		"record_replays": _record_replays,
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
				if data is Dictionary:
					if data.has("record_replays"):
						_record_replays = data["record_replays"]
						if _record_replays.size() > MAX_REPLAYS:
							_record_replays = _record_replays.slice(_record_replays.size() - MAX_REPLAYS)
					if data.has("general_replays"):
						_general_replays = data["general_replays"]
						if _general_replays.size() > MAX_REPLAYS:
							_general_replays = _general_replays.slice(_general_replays.size() - MAX_REPLAYS)
					if data.has("replays") and _record_replays.is_empty() and _general_replays.is_empty():
						for r in data["replays"]:
							if r.get("error_category", -1) in RECORD_ERROR_CATEGORIES:
								_record_replays.append(r)
							else:
								_general_replays.append(r)
						if _record_replays.size() > MAX_REPLAYS:
							_record_replays = _record_replays.slice(_record_replays.size() - MAX_REPLAYS)
						if _general_replays.size() > MAX_REPLAYS:
							_general_replays = _general_replays.slice(_general_replays.size() - MAX_REPLAYS)
