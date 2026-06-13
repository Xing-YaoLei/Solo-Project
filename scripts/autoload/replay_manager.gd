extends Node

const MAX_REPLAYS: int = 3
const MAX_STEPS_PER_REPLAY: int = 500

var replays: Array = []
var current_replay_index: int = -1
var is_playing: bool = false
var playback_step: int = 0
var playback_speed: float = 1.0

var current_recording: Dictionary = {}
var is_recording: bool = false

func _ready() -> void:
	EventBus.project_failed.connect(_on_project_failed)
	EventBus.game_started.connect(_on_game_started)

func _on_game_started(difficulty: String) -> void:
	start_recording()

func _on_project_failed(project_data: Dictionary, reason: String) -> void:
	stop_recording()
	save_replay()

func start_recording() -> void:
	is_recording = true
	current_recording = {
		"id": "replay_" + str(Time.get_unix_time_from_system()),
		"timestamp": Time.get_datetime_string_from_system(),
		"difficulty": GameState.current_difficulty,
		"steps": [],
		"final_score": 0,
		"failed_project": null,
		"fail_reason": ""
	}

func stop_recording() -> void:
	is_recording = false
	current_recording["final_score"] = GameState.score

func record_step(step_type: String, step_data: Dictionary) -> void:
	if not is_recording:
		return
	if current_recording["steps"].size() >= MAX_STEPS_PER_REPLAY:
		current_recording["steps"].pop_front()
	var step = {
		"time": Time.get_ticks_msec() / 1000.0 - GameState.start_time,
		"type": step_type,
		"data": step_data
	}
	current_recording["steps"].append(step)

func record_customer_action(action: String, customer_data: Dictionary) -> void:
	record_step("customer", {"action": action, "customer": customer_data})

func record_project_action(action: String, project_data: Dictionary) -> void:
	record_step("project", {"action": action, "project": project_data})

func record_recharge_action(action: String, recharge_data: Dictionary) -> void:
	record_step("recharge", {"action": action, "recharge": recharge_data})

func record_item_usage(item_id: String) -> void:
	record_step("item", {"action": "used", "item_id": item_id})

func set_failed_project(project_data: Dictionary, reason: String) -> void:
	if current_recording:
		current_recording["failed_project"] = project_data
		current_recording["fail_reason"] = reason

func save_replay() -> void:
	if current_recording and current_recording["steps"].size() > 0:
		replays.append(current_recording.duplicate(true))
		if replays.size() > MAX_REPLAYS:
			replays.pop_front()
	EventBus.replay_recorded.emit(current_recording)

func get_replays() -> Array:
	return replays.duplicate()

func get_replay_count() -> int:
	return replays.size()

func get_replay(index: int) -> Dictionary:
	if index >= 0 and index < replays.size():
		return replays[index]
	return {}

func get_latest_replay() -> Dictionary:
	if replays.size() > 0:
		return replays[replays.size() - 1]
	return {}

func start_playback(replay_index: int) -> void:
	if replay_index >= 0 and replay_index < replays.size():
		current_replay_index = replay_index
		playback_step = 0
		is_playing = true

func stop_playback() -> void:
	is_playing = false
	current_replay_index = -1
	playback_step = 0

func step_playback_forward() -> Dictionary:
	if current_replay_index < 0 or current_replay_index >= replays.size():
		return {}
	var replay = replays[current_replay_index]
	if playback_step < replay["steps"].size():
		var step = replay["steps"][playback_step]
		playback_step += 1
		EventBus.playback_step.emit(playback_step - 1, step)
		return step
	return {}

func step_playback_backward() -> Dictionary:
	if current_replay_index < 0 or current_replay_index >= replays.size():
		return {}
	if playback_step > 0:
		playback_step -= 1
		var replay = replays[current_replay_index]
		var step = replay["steps"][playback_step]
		EventBus.playback_step.emit(playback_step, step)
		return step
	return {}

func get_current_playback_step() -> int:
	return playback_step

func get_total_steps() -> int:
	if current_replay_index >= 0 and current_replay_index < replays.size():
		return replays[current_replay_index]["steps"].size()
	return 0

func compare_replays(index1: int, index2: int) -> Dictionary:
	var replay1 = get_replay(index1)
	var replay2 = get_replay(index2)
	if replay1.is_empty() or replay2.is_empty():
		return {}
	var comparison = {
		"replay1_score": replay1.get("final_score", 0),
		"replay2_score": replay2.get("final_score", 0),
		"replay1_steps": replay1.get("steps", []).size(),
		"replay2_steps": replay2.get("steps", []).size(),
		"replay1_fail_reason": replay1.get("fail_reason", ""),
		"replay2_fail_reason": replay2.get("fail_reason", ""),
		"time_difference": 0,
		"key_differences": []
	}
	var steps1 = replay1.get("steps", [])
	var steps2 = replay2.get("steps", [])
	var max_steps = max(steps1.size(), steps2.size())
	for i in range(max_steps):
		var s1 = steps1[i] if i < steps1.size() else null
		var s2 = steps2[i] if i < steps2.size() else null
		if s1 and s2 and s1.get("type", "") != s2.get("type", ""):
			comparison["key_differences"].append({
				"step": i,
				"replay1_type": s1.get("type", ""),
				"replay2_type": s2.get("type", "")
			})
	return comparison

func clear_replays() -> void:
	replays.clear()
	current_replay_index = -1
	playback_step = 0
	is_playing = false

func set_playback_speed(speed: float) -> void:
	playback_speed = speed
