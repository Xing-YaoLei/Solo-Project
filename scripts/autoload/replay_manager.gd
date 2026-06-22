class_name ReplayManager
extends Node

const STUCK_TIMEOUT: float = 30.0
const MAX_REPLAY_PRESERVES: int = 3

var current_recording: Dictionary = {}
var is_recording: bool = false
var last_action_time: float = 0.0
var stuck_thresholds: Dictionary = {}
var _preserved_replays: Dictionary = {}

signal stuck_detected(task_id: String, timestamp: Dictionary)
signal replay_preserved(replay_id: String)

func _ready() -> void:
	is_recording = false
	current_recording = {}
	last_action_time = 0.0
	stuck_thresholds = {}
	_preserved_replays = {}

func _process(delta: float) -> void:
	if is_recording:
		check_stuck()

func start_recording(task_id: String) -> void:
	current_recording = {
		"task_id": task_id,
		"start_time": Time.get_datetime_dict_from_system(),
		"actions": [],
		"stuck_points": [],
	}
	is_recording = true
	last_action_time = Time.get_ticks_msec() / 1000.0

func stop_recording() -> Dictionary:
	is_recording = false
	var result: Dictionary = current_recording.duplicate()
	result["end_time"] = Time.get_datetime_dict_from_system()
	if result.has("start_time") and result.has("end_time"):
		result["duration"] = _calculate_duration(result["start_time"], result["end_time"])
	current_recording = {}
	return result

func record_action(action_type: String, action_data: Dictionary) -> void:
	if not is_recording:
		return
	last_action_time = Time.get_ticks_msec() / 1000.0
	var actions: Array = current_recording.get("actions", [])
	actions.append({
		"action_type": action_type,
		"action_data": action_data,
		"timestamp": Time.get_datetime_dict_from_system(),
		"elapsed": last_action_time,
	})
	current_recording["actions"] = actions

func record_stuck_point(description: String) -> void:
	if not is_recording:
		return
	var stuck_points: Array = current_recording.get("stuck_points", [])
	stuck_points.append({
		"description": description,
		"timestamp": Time.get_datetime_dict_from_system(),
		"elapsed": Time.get_ticks_msec() / 1000.0,
	})
	current_recording["stuck_points"] = stuck_points

func check_stuck() -> void:
	if not is_recording:
		return
	var current_time: float = Time.get_ticks_msec() / 1000.0
	var idle_duration: float = current_time - last_action_time
	var task_id: String = current_recording.get("task_id", "")
	var threshold: float = stuck_thresholds.get(task_id, STUCK_TIMEOUT)
	if idle_duration > threshold:
		var timestamp: Dictionary = Time.get_datetime_dict_from_system()
		stuck_detected.emit(task_id, timestamp)
		record_stuck_point("Auto-detected stuck: idle %.1f seconds" % idle_duration)
		last_action_time = current_time

func preserve_failed_replay(task_id: String) -> bool:
	if not _preserved_replays.has(task_id):
		_preserved_replays[task_id] = []
	var task_replays: Array = _preserved_replays[task_id]
	if task_replays.size() >= MAX_REPLAY_PRESERVES:
		return false
	var replay_id: String = "%s_replay_%d" % [task_id, task_replays.size() + 1]
	var entry: Dictionary = {
		"replay_id": replay_id,
		"task_id": task_id,
		"recording": current_recording.duplicate(),
		"preserved_at": Time.get_datetime_dict_from_system(),
	}
	task_replays.append(entry)
	replay_preserved.emit(replay_id)
	return true

func get_preserved_replays(task_id: String) -> Array:
	return _preserved_replays.get(task_id, [])

func get_replay_at_position(replay_id: String, action_index: int) -> Dictionary:
	for task_replays: Array in _preserved_replays.values():
		for entry: Dictionary in task_replays:
			if entry.get("replay_id", "") == replay_id:
				var actions: Array = entry.get("recording", {}).get("actions", [])
				if action_index >= 0 and action_index < actions.size():
					return actions[action_index]
				return {}
	return {}

func get_stuck_positions(task_id: String) -> Array:
	var stuck_positions: Array = []
	var task_replays: Array = _preserved_replays.get(task_id, [])
	for entry: Dictionary in task_replays:
		var recording: Dictionary = entry.get("recording", {})
		var points: Array = recording.get("stuck_points", [])
		for point: Dictionary in points:
			stuck_positions.append(point)
	return stuck_positions

func _calculate_duration(start: Dictionary, end: Dictionary) -> float:
	var start_seconds: int = start.get("hour", 0) * 3600 + start.get("minute", 0) * 60 + start.get("second", 0)
	var end_seconds: int = end.get("hour", 0) * 3600 + end.get("minute", 0) * 60 + end.get("second", 0)
	var diff: float = end_seconds - start_seconds
	return diff
