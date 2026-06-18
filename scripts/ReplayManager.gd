extends Node

signal replay_selected(replay_data: Dictionary)
signal playback_step_changed(step_index: int, step_data: Dictionary)
signal playback_finished

const MAX_PROFILE_REPLAYS := 3

var current_replay: Dictionary = {}
var current_playback_index: int = -1
var is_playing: bool = false
var playback_timer: float = 0.0
var profile_failure_replays: Array[Dictionary] = []
var _last_slow_step_positions: Array[Dictionary] = []

func _ready() -> void:
	_profile_replays_load()

func load_replay(replay_data: Dictionary) -> void:
	current_replay = replay_data
	current_playback_index = -1
	is_playing = false
	_last_slow_step_positions = replay_data.get("stats", {}).get("slow_steps", [])
	emit_signal("replay_selected", replay_data)

func get_current_replay_mistakes() -> Array[Dictionary]:
	return current_replay.get("mistakes", [])

func start_playback() -> void:
	if current_replay.is_empty():
		return
	is_playing = true
	current_playback_index = -1
	playback_timer = 0.0
	_next_playback_step()

func stop_playback() -> void:
	is_playing = false

func _next_playback_step() -> void:
	var steps := get_current_replay_mistakes()
	current_playback_index += 1
	if current_playback_index >= steps.size():
		is_playing = false
		emit_signal("playback_finished")
		return
	var step_data: Dictionary = steps[current_playback_index]
	emit_signal("playback_step_changed", current_playback_index, step_data)
	playback_timer = step_data.get("duration", 2.0)

func _process(delta: float) -> void:
	if not is_playing:
		return
	playback_timer -= delta
	if playback_timer <= 0.0:
		_next_playback_step()

func jump_to_step(index: int) -> void:
	var steps := get_current_replay_mistakes()
	if index < 0 or index >= steps.size():
		return
	current_playback_index = index
	emit_signal("playback_step_changed", index, steps[index])

func get_slow_step_positions() -> Array[Dictionary]:
	return _last_slow_step_positions.duplicate(true)

func save_profile_failure(failure_data: Dictionary) -> void:
	profile_failure_replays.insert(0, failure_data)
	while profile_failure_replays.size() > MAX_PROFILE_REPLAYS:
		profile_failure_replays.pop_back()
	_profile_replays_save()

func get_profile_failure_replays() -> Array[Dictionary]:
	return profile_failure_replays.duplicate(true)

func get_profile_failure_count() -> int:
	return profile_failure_replays.size()

func _profile_replays_save() -> void:
	var file := FileAccess.open("user://profile_failure_replays.save", FileAccess.WRITE)
	if file:
		file.store_string(JSON.stringify(profile_failure_replays))
		file.close()

func _profile_replays_load() -> void:
	if not FileAccess.file_exists("user://profile_failure_replays.save"):
		return
	var file := FileAccess.open("user://profile_failure_replays.save", FileAccess.READ)
	if file:
		var content: String = file.get_as_text()
		file.close()
		var parsed = JSON.parse_string(content)
		if typeof(parsed) == TYPE_ARRAY:
			profile_failure_replays = parsed

func analyze_mistakes(replay_data: Dictionary) -> Dictionary:
	var analysis: Dictionary = {
		"total_mistakes": 0,
		"by_type": {},
		"by_challenge": {},
		"history_related": [],
		"slow_step_count": 0
	}
	var mistakes: Array = replay_data.get("mistakes", [])
	analysis.total_mistakes = mistakes.size()
	for m in mistakes:
		var type_key: String = str(m.get("mistake_type", -1))
		if not analysis.by_type.has(type_key):
			analysis.by_type[type_key] = 0
		analysis.by_type[type_key] += 1
		var challenge_key: String = str(m.get("challenge_type", -1))
		if not analysis.by_challenge.has(challenge_key):
			analysis.by_challenge[challenge_key] = 0
		analysis.by_challenge[challenge_key] += 1
		if m.get("mistake_type", -1) == GameManager.MistakeType.WRONG_TIMELINE:
			analysis.history_related.append(m)
	analysis.slow_step_count = replay_data.get("stats", {}).get("slow_steps", []).size()
	return analysis
