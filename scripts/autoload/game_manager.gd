extends Node

enum Phase { PHOTO_VERIFICATION, LABEL_SELECTION, ADDRESS_SORTING, TRAJECTORY_REVIEW }
enum TrainingMode { PRACTICE, ASSESSMENT, CHALLENGE }

signal phase_changed(new_phase: Phase)
signal score_updated(total_score: int)
signal session_started
signal session_ended

var current_phase: Phase = Phase.PHOTO_VERIFICATION
var current_mode: TrainingMode = TrainingMode.PRACTICE
var total_score: int = 0
var phase_scores: Dictionary = {}
var current_question_index: int = 0
var questions: Array = []
var is_session_active: bool = false
var session_start_time: int = 0

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS

func start_session(mode: TrainingMode) -> void:
	current_mode = mode
	total_score = 0
	phase_scores.clear()
	current_question_index = 0
	is_session_active = true
	session_start_time = Time.get_ticks_msec()
	_load_questions_for_mode(mode)
	session_started.emit()
	_set_phase(Phase.PHOTO_VERIFICATION)

func end_session() -> void:
	is_session_active = false
	var duration: int = Time.get_ticks_msec() - session_start_time
	var record: Dictionary = {
		"timestamp": Time.get_datetime_string_from_system(),
		"mode": TrainingMode.keys()[current_mode],
		"total_score": total_score,
		"phase_scores": phase_scores,
		"duration_msec": duration,
		"question_count": questions.size()
	}
	TrainingRecordManager.add_record(record)
	session_ended.emit()

func advance_phase() -> void:
	var next: int = current_phase + 1
	if next <= Phase.TRAJECTORY_REVIEW:
		_set_phase(next as Phase)
	else:
		end_session()
		get_tree().change_scene_to_file("res://scenes/training_record/training_record.tscn")

func _set_phase(phase: Phase) -> void:
	current_phase = phase
	phase_changed.emit(phase)

func add_score(phase: Phase, score: int) -> void:
	if not phase_scores.has(phase):
		phase_scores[phase] = 0
	phase_scores[phase] += score
	total_score += score
	score_updated.emit(total_score)

func get_current_question() -> Dictionary:
	if current_question_index < questions.size():
		return questions[current_question_index]
	return {}

func advance_question() -> bool:
	current_question_index += 1
	return current_question_index < questions.size()

func _load_questions_for_mode(mode: TrainingMode) -> void:
	var all_questions: Array = ConfigManager.get_questions()
	match mode:
		TrainingMode.PRACTICE:
			questions = all_questions
		TrainingMode.ASSESSMENT:
			questions = all_questions
			questions.shuffle()
		TrainingMode.CHALLENGE:
			questions = all_questions
			questions.shuffle()
			var limit: int = mini(10, questions.size())
			questions = questions.slice(0, limit)

func get_phase_name(phase: Phase) -> String:
	match phase:
		Phase.PHOTO_VERIFICATION:
			return "照片核验"
		Phase.LABEL_SELECTION:
			return "评价标签"
		Phase.ADDRESS_SORTING:
			return "地址排序"
		Phase.TRAJECTORY_REVIEW:
			return "轨迹处理"
		_:
			return ""
