class_name GameManager
extends Node

signal level_started(level_id: String)
signal level_completed(level_id: String, score: int)
signal task_accepted(task_id: String)
signal choice_made(choice_id: String, is_correct: bool)
signal risk_word_identified(word_id: String)
signal game_paused
signal game_resumed
signal state_changed(old_state: int, new_state: int)

enum State {
	MENU,
	LEVEL_SELECT,
	PLAYING,
	PAUSED,
	RESULT,
	REVIEW,
	TUTORIAL,
}

var current_state: State = State.MENU
var current_level_id: String = ""
var current_task_id: String = ""
var _previous_state: State = State.MENU
var _session_score: int = 0
var _session_errors: Array[Dictionary] = []
var _session_rejections: Array[Dictionary] = []

func _ready() -> void:
	current_state = State.MENU

func start_level(level_id: String) -> void:
	current_level_id = level_id
	current_task_id = ""
	_session_score = 0
	_session_errors.clear()
	_session_rejections.clear()
	change_state(State.PLAYING)
	level_started.emit(level_id)

func complete_level(score: int) -> void:
	_session_score = score
	level_completed.emit(current_level_id, score)
	change_state(State.RESULT)

func accept_task(task_id: String) -> void:
	current_task_id = task_id
	task_accepted.emit(task_id)

func record_choice(choice_id: String, is_correct: bool) -> void:
	choice_made.emit(choice_id, is_correct)

func identify_risk_word(word_id: String) -> void:
	risk_word_identified.emit(word_id)

func record_session_error(error_data: Dictionary) -> void:
	_session_errors.append(error_data)

func record_session_rejection(rejection_data: Dictionary) -> void:
	_session_rejections.append(rejection_data)

func get_session_score() -> int:
	return _session_score

func get_session_errors() -> Array[Dictionary]:
	return _session_errors

func get_session_rejections() -> Array[Dictionary]:
	return _session_rejections

func pause_game() -> void:
	_previous_state = current_state
	change_state(State.PAUSED)
	game_paused.emit()

func resume_game() -> void:
	change_state(_previous_state)
	game_resumed.emit()

func enter_review() -> void:
	change_state(State.REVIEW)

func enter_tutorial() -> void:
	_previous_state = current_state
	change_state(State.TUTORIAL)

func exit_tutorial() -> void:
	change_state(_previous_state)

func change_state(new_state: State) -> void:
	var old_state: State = current_state
	current_state = new_state
	state_changed.emit(old_state, new_state)

func is_playing() -> bool:
	return current_state == State.PLAYING

func is_paused() -> bool:
	return current_state == State.PAUSED
