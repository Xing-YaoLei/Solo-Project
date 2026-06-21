extends Node

signal game_started()
signal game_paused()
signal game_resumed()
signal game_finished()
signal time_updated(time_left: int)

enum GameState {
	MENU,
	PLAYING,
	PAUSED,
	FINISHED,
	REVIEW,
}

var current_state: int = GameState.MENU
var current_level_id: int = 0
var time_left: int = 0
var time_total: int = 0
var timer: Timer
var is_training_mode: bool = false

func _ready() -> void:
	timer = Timer.new()
	timer.wait_time = 1.0
	timer.timeout.connect(_on_timer_timeout)
	add_child(timer)

func start_game(level_id: int, training: bool = false) -> void:
	current_level_id = level_id
	is_training_mode = training
	
	var level: Dictionary = DataManager.get_level_by_id(level_id)
	if level.is_empty():
		return
	
	if training:
		time_total = 99999
		time_left = 99999
	else:
		time_total = level.get("time_limit", 300)
		time_left = time_total
	
	DataManager.set_current_level(level_id)
	DataManager.generate_orders(level_id)
	
	current_state = GameState.PLAYING
	if not training:
		timer.start()
	
	emit_signal("game_started")

func pause_game() -> void:
	if current_state != GameState.PLAYING:
		return
	current_state = GameState.PAUSED
	timer.stop()
	emit_signal("game_paused")

func resume_game() -> void:
	if current_state != GameState.PAUSED:
		return
	current_state = GameState.PLAYING
	timer.start()
	emit_signal("game_resumed")

func finish_game() -> void:
	if current_state != GameState.PLAYING:
		return
	
	current_state = GameState.FINISHED
	timer.stop()
	
	var score_result: Dictionary = DataManager.calculate_score()
	var level: Dictionary = DataManager.get_current_level()
	var required_score: int = level.get("required_score", 60)
	var is_passed: bool = score_result.get("score", 0.0) >= float(required_score)
	
	var duration: int = time_total - time_left
	
	TrainingRecord.add_record(
		current_level_id,
		level.get("name", ""),
		score_result.get("score", 0.0),
		score_result.get("attendance_rate", 0.0),
		score_result.get("assignment_rate", 0.0),
		score_result.get("conflict_rate", 0.0),
		duration,
		is_passed
	)
	
	emit_signal("game_finished")

func get_result() -> Dictionary:
	return DataManager.calculate_score()

func go_to_menu() -> void:
	current_state = GameState.MENU
	if timer and timer.is_stopped() == false:
		timer.stop()

func go_to_review() -> void:
	current_state = GameState.REVIEW

func get_time_left() -> int:
	return time_left

func get_time_total() -> int:
	return time_total

func get_time_formatted() -> String:
	var minutes: int = time_left / 60
	var seconds: int = time_left % 60
	return "%02d:%02d" % [minutes, seconds]

func get_progress() -> float:
	if time_total == 0:
		return 0.0
	return float(time_left) / float(time_total)

func _on_timer_timeout() -> void:
	if current_state != GameState.PLAYING:
		return
	
	time_left -= 1
	emit_signal("time_updated", time_left)
	
	if time_left <= 0:
		time_left = 0
		finish_game()

func get_current_state() -> int:
	return current_state

func is_playing() -> bool:
	return current_state == GameState.PLAYING

func get_current_level_id() -> int:
	return current_level_id

func get_is_training_mode() -> bool:
	return is_training_mode

func format_duration(seconds: int) -> String:
	var mins: int = seconds / 60
	var secs: int = seconds % 60
	return "%d分%d秒" % [mins, secs]
