class_name StuckDetector
extends Node

const STUCK_TIMEOUT: float = 30.0
const MIN_STUCK_DURATION: float = 5.0

signal stuck_detected(stuck_data: Dictionary)
signal stuck_resolved

var is_stuck: bool = false
var stuck_start_time: float = 0.0
var last_interaction_time: float = 0.0
var stuck_positions: Array[Dictionary] = []
var current_context: String = ""

var _total_elapsed: float = 0.0
var _current_stuck_duration: float = 0.0
var _stuck_registered: bool = false


func register_interaction(action_type: String = "") -> void:
	var now: float = _total_elapsed
	if is_stuck:
		_current_stuck_duration = now - stuck_start_time
		if _current_stuck_duration >= MIN_STUCK_DURATION:
			var stuck_entry: Dictionary = {
				"context": current_context,
				"start_time": stuck_start_time,
				"end_time": now,
				"duration": _current_stuck_duration,
				"action_type": action_type,
			}
			stuck_positions.append(stuck_entry)
		is_stuck = false
		_stuck_registered = false
		stuck_resolved.emit()
	last_interaction_time = now


func set_context(context: String) -> void:
	current_context = context


func check_for_stuck() -> bool:
	return is_stuck


func get_stuck_positions() -> Array[Dictionary]:
	return stuck_positions


func get_stuck_summary() -> Dictionary:
	var total_stuck_count: int = stuck_positions.size()
	var total_stuck_duration: float = 0.0
	var longest_stuck: Dictionary = {}

	for pos in stuck_positions:
		var dur: float = pos.get("duration", 0.0)
		total_stuck_duration += dur
		if longest_stuck.is_empty() or dur > longest_stuck.get("duration", 0.0):
			longest_stuck = pos

	return {
		"total_stuck_count": total_stuck_count,
		"total_stuck_duration": total_stuck_duration,
		"positions": stuck_positions,
		"longest_stuck": longest_stuck,
	}


func reset() -> void:
	is_stuck = false
	stuck_start_time = 0.0
	last_interaction_time = 0.0
	stuck_positions.clear()
	current_context = ""
	_total_elapsed = 0.0
	_current_stuck_duration = 0.0
	_stuck_registered = false


func _process(delta: float) -> void:
	_total_elapsed += delta

	if last_interaction_time <= 0.0:
		last_interaction_time = _total_elapsed
		return

	var time_since_interaction: float = _total_elapsed - last_interaction_time

	if time_since_interaction >= STUCK_TIMEOUT and not is_stuck:
		is_stuck = true
		stuck_start_time = last_interaction_time
		_stuck_registered = false

	if is_stuck and not _stuck_registered:
		var stuck_data: Dictionary = {
			"context": current_context,
			"start_time": stuck_start_time,
			"detected_at": _total_elapsed,
		}
		_stuck_registered = true
		stuck_detected.emit(stuck_data)
