extends Node

signal phase_changed(new_phase: StringName)
signal timer_tick(remaining: float)
signal timeout_triggered
signal score_calculated(score: float)

enum Phase {
	OBSERVE,
	PROCESS_EVIDENCE,
	SCORE,
	REVIEW,
}

const DEFAULT_TIME_LIMIT := 60.0

var current_level_id: String = ""
var current_phase: Phase = Phase.OBSERVE
var time_limit: float = DEFAULT_TIME_LIMIT
var time_remaining: float = 0.0
var _phase_timer: float = 0.0
var _is_running: bool = false
var _timeout_count: int = 0
var _retry_method: String = ""
var _complaint_data: Dictionary = {}
var _evidence_attachments: Array[Dictionary] = []
var _selected_method: String = ""
var _phase_start_time: float = 0.0
var _closure_time: float = 0.0

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS

func _process(delta: float) -> void:
	if not _is_running:
		return
	_phase_timer += delta
	time_remaining = time_limit - _phase_timer
	timer_tick.emit(time_remaining)
	if time_remaining <= 0.0:
		time_remaining = 0.0
		_is_running = false
		_timeout_count += 1
		timeout_triggered.emit()

func start_level(level_id: String, data: Dictionary) -> void:
	current_level_id = level_id
	_complaint_data = data
	_evidence_attachments = data.get("evidence", [])
	time_limit = data.get("time_limit", DEFAULT_TIME_LIMIT)
	_timeout_count = 0
	_retry_method = ""
	_selected_method = ""
	_closure_time = 0.0
	set_phase(Phase.OBSERVE)

func set_phase(phase: Phase) -> void:
	current_phase = phase
	_phase_start_time = Time.get_ticks_msec() / 1000.0
	_phase_timer = 0.0
	time_remaining = time_limit
	_is_running = (phase == Phase.PROCESS_EVIDENCE)
	phase_changed.emit(phase_name(phase))

func phase_name(phase: Phase) -> StringName:
	match phase:
		Phase.OBSERVE: return &"observe"
		Phase.PROCESS_EVIDENCE: return &"process_evidence"
		Phase.SCORE: return &"score"
		Phase.REVIEW: return &"review"
		_: return &"unknown"

func select_method(method: String) -> void:
	_selected_method = method

func complete_processing() -> void:
	_is_running = false
	_closure_time = (Time.get_ticks_msec() / 1000.0) - _phase_start_time
	var score := _calculate_score()
	score_calculated.emit(score)
	set_phase(Phase.SCORE)

func retry_with_new_method(method: String) -> void:
	_retry_method = method
	_selected_method = method
	_phase_timer = 0.0
	time_remaining = time_limit
	_is_running = true

func _calculate_score() -> float:
	var base := 100.0
	var time_penalty := (_timeout_count * 20.0)
	var time_bonus := maxf(0.0, time_remaining * 1.5)
	var score := clampf(base - time_penalty + time_bonus, 0.0, 150.0)
	return score

func get_closure_time() -> float:
	return _closure_time

func get_timeout_count() -> int:
	return _timeout_count

func get_retry_method() -> String:
	return _retry_method

func get_selected_method() -> String:
	return _selected_method

func get_complaint_data() -> Dictionary:
	return _complaint_data

func get_evidence_attachments() -> Array[Dictionary]:
	return _evidence_attachments
