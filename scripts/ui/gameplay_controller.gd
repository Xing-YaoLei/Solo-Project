class_name GameplayController
extends Node

const TUTORIAL_SCENE: String = "res://scenes/tutorial_overlay.tscn"
const RESULT_SCENE: String = "res://scenes/result.tscn"

var _task_dispatch: TaskDispatchSystem
var _scoring_engine: ScoringEngine
var _risk_word_system: RiskWordSystem
var _stuck_detector: StuckDetector
var _ui: GameplayUI

var _current_level_data: Dictionary = {}
var _current_task_index: int = 0
var _total_tasks: int = 0
var _accumulated_score: int = 0
var _accumulated_errors: Array[Dictionary] = []
var _accumulated_rejections: Array[Dictionary] = []
var _accumulated_risk_identified: Array[String] = []
var _accumulated_risk_total: Array[Dictionary] = []
var _time_remaining: float = 0.0
var _level_time_limit: float = 0.0
var _task_start_time: float = 0.0
var _level_complete: bool = false
var _risk_phase_active: bool = false
var _tutorial_shown: bool = false
var _current_choice_result: Dictionary = {}

func _ready() -> void:
	_task_dispatch = TaskDispatchSystem.new()
	_scoring_engine = ScoringEngine.new()
	_risk_word_system = RiskWordSystem.new()
	_stuck_detector = StuckDetector.new()
	add_child(_task_dispatch)
	add_child(_risk_word_system)
	add_child(_stuck_detector)

	_ui = get_node_or_null(^"GameplayUI") as GameplayUI
	if _ui == null:
		var ui_node := get_node_or_null(^"Control")
		if ui_node:
			_ui = ui_node as GameplayUI

	_connect_signals()
	_initialize_level()

func _connect_signals() -> void:
	if _ui:
		_ui.task_accepted.connect(_on_task_accepted)
		_ui.choice_submitted.connect(_on_choice_submitted)
		_ui.risk_word_attempted.connect(_on_risk_word_attempted)
		_ui.risk_scan_confirmed.connect(_on_risk_scan_confirmed)
		_ui.pause_requested.connect(_on_pause_requested)
	_task_dispatch.task_dispatched.connect(_on_task_dispatched)
	_task_dispatch.clue_revealed.connect(_on_clue_revealed)
	_task_dispatch.choices_presented.connect(_on_choices_presented)
	_task_dispatch.dispatch_complete.connect(_on_dispatch_complete)
	_risk_word_system.risk_word_hit.connect(_on_risk_word_hit)
	_risk_word_system.risk_word_missed.connect(_on_risk_word_missed)
	_risk_word_system.all_risk_words_identified.connect(_on_all_risk_words_identified)
	_stuck_detector.stuck_detected.connect(_on_stuck_detected)
	GameManager.choice_made.connect(_on_game_choice_made)

func _initialize_level() -> void:
	_current_level_data = LevelManager.get_current_level()
	if _current_level_data.is_empty():
		push_error("GameplayController: no level data loaded")
		return
	_current_task_index = 0
	_total_tasks = _current_level_data.get("tasks", []).size()
	_accumulated_score = 0
	_accumulated_errors.clear()
	_accumulated_rejections.clear()
	_accumulated_risk_identified.clear()
	_accumulated_risk_total.clear()
	_level_complete = false
	_risk_phase_active = false
	_tutorial_shown = false

	_level_time_limit = float(_current_level_data.get("time_limit", 120))
	_time_remaining = _level_time_limit

	if _ui:
		_ui.update_level_name(_current_level_data.get("title", ""))
		_ui.update_task_progress(1, _total_tasks)
		_ui.update_score(0)
		_ui.update_timer(_time_remaining)

	if not _tutorial_shown:
		_show_tutorial_if_needed()
		_tutorial_shown = true

	_start_current_task()

func _show_tutorial_if_needed() -> void:
	var level_id: String = _current_level_data.get("level_id", "")
	var tutorial_config: TutorialsConfig = load("res://resources/configs/tutorials_config.tres") as TutorialsConfig
	if tutorial_config == null:
		return
	for i in range(tutorial_config.tutorial_ids.size()):
		if tutorial_config.trigger_levels[i] == level_id and tutorial_config.order_indices[i] == 0:
			var tutorial_data: Dictionary = {
				"tutorial_id": tutorial_config.tutorial_ids[i],
				"title": tutorial_config.titles[i],
				"content": tutorial_config.content_texts[i],
			}
			get_tree().call_deferred("change_scene_to_file", TUTORIAL_SCENE)
			await get_tree().create_timer(0.1).timeout
			break

func _start_current_task() -> void:
	var task: Dictionary = LevelManager.get_current_task()
	if task.is_empty():
		_complete_level()
		return
	_risk_phase_active = false
	_current_choice_result = {}
	_stuck_detector.set_context("task_%s" % task.get("task_id", ""))
	_stuck_detector.reset()

	if _ui:
		_ui.show_task_dispatch(task)

	_task_dispatch.dispatch_task(task)
	ReplayManager.start_recording(task.get("task_id", ""))

func _process(delta: float) -> void:
	if _level_complete:
		return
	_time_remaining -= delta
	if _time_remaining < 0.0:
		_time_remaining = 0.0
	if _ui:
		_ui.update_timer(_time_remaining)
	if _time_remaining <= 0.0:
		_handle_time_out()

func _on_task_dispatched(task_id: String) -> void:
	GameManager.accept_task(task_id)
	if _ui:
		_ui.show_accept_state()

func _on_task_accepted() -> void:
	_task_dispatch.accept_dispatched_task()
	_stuck_detector.register_interaction("accept_task")
	ReplayManager.record_action("accept_task", {"task_id": GameManager.current_task_id})

func _on_clue_revealed(clue_id: String, content: String) -> void:
	var task: Dictionary = LevelManager.get_current_task()
	var clues: Array = task.get("clues", [])
	for clue in clues:
		if clue.get("clue_id", "") == clue_id:
			if _ui:
				_ui.add_clue(clue)
			break
	_stuck_detector.register_interaction("clue_reveal")
	ReplayManager.record_action("clue_revealed", {"clue_id": clue_id})

func _on_choices_presented(choices: Array[Dictionary]) -> void:
	if _ui:
		_ui.show_choices(choices)
		var task: Dictionary = LevelManager.get_current_task()
		var risk_words: Array = task.get("risk_words", [])
		if not risk_words.is_empty():
			_ui.show_risk_words(risk_words)
			_risk_word_system.load_risk_words(risk_words)
			_risk_word_system.start_scan()
			_accumulated_risk_total.append_array(risk_words)
	_stuck_detector.register_interaction("choices_presented")
	ReplayManager.record_action("choices_presented", {"count": choices.size()})

func _on_choice_submitted(choice_data: Dictionary) -> void:
	if _risk_phase_active:
		return
	_ui.disable_choices()
	_stuck_detector.register_interaction("choice_submitted")
	ReplayManager.record_action("choice_made", {"choice_id": choice_data.get("choice_id", "")})
	var result: Dictionary = _task_dispatch.submit_choice(choice_data)
	_current_choice_result = result
	var is_correct: bool = result.get("is_correct", false)
	GameManager.record_choice(choice_data.get("choice_id", ""), is_correct)
	if not is_correct:
		var error_type: String = result.get("error_type", "")
		var feedback: String = result.get("feedback", "")
		_accumulated_errors.append({
			"error_type": error_type,
			"feedback": feedback,
			"choice_id": choice_data.get("choice_id", ""),
			"task_id": GameManager.current_task_id,
		})
		if result.get("triggers_rejection", false):
			_accumulated_rejections.append({
				"reason": result.get("rejection_reason", ""),
				"task_id": GameManager.current_task_id,
				"choice_id": choice_data.get("choice_id", ""),
			})
	if _ui:
		_ui.show_feedback(result.get("feedback", ""), is_correct)
	var task: Dictionary = LevelManager.get_current_task()
	var risk_words: Array = task.get("risk_words", [])
	if not risk_words.is_empty() and not is_correct:
		_complete_task_flow(result)
	elif not risk_words.is_empty():
		_risk_phase_active = true
	else:
		_complete_task_flow(result)

func _on_risk_word_attempted(word_id: String) -> void:
	var result: Dictionary = _risk_word_system.attempt_identify(word_id)
	if result.get("hit", false):
		if _ui:
			_ui.mark_risk_word_identified(word_id, result)
		_accumulated_risk_identified.append(word_id)
	_stuck_detector.register_interaction("risk_word_attempt")
	ReplayManager.record_action("risk_word_attempt", {"word_id": word_id, "hit": result.get("hit", false)})

func _on_risk_word_hit(word_id: String, severity: int, category: String) -> void:
	pass

func _on_risk_word_missed(word_id: String) -> void:
	if _ui:
		_ui.mark_risk_word_missed(word_id)

func _on_all_risk_words_identified() -> void:
	if _ui:
		_ui.risk_scan_button.disabled = false

func _on_risk_scan_confirmed() -> void:
	var scan_result: Dictionary = _risk_word_system.complete_scan()
	ReplayManager.record_action("risk_scan_confirmed", scan_result)
	_risk_phase_active = false
	_complete_task_flow(_current_choice_result)

func _on_dispatch_complete(task_id: String, result: Dictionary) -> void:
	pass

func _on_game_choice_made(choice_id: String, is_correct: bool) -> void:
	pass

func _on_stuck_detected(stuck_data: Dictionary) -> void:
	ReplayManager.record_stuck_point("Stuck at: %s" % stuck_data.get("context", ""))

func _on_pause_requested() -> void:
	GameManager.pause_game()

func _complete_task_flow(choice_result: Dictionary) -> void:
	var time_spent: float = _task_dispatch.elapsed_time
	var all_risk: Array[Dictionary] = []
	for rw in _accumulated_risk_total:
		all_risk.append(rw)
	var risk_ids: Array[String] = []
	for rid in _accumulated_risk_identified:
		risk_ids.append(rid)
	var score_result: Dictionary = _scoring_engine.calculate_score(
		choice_result, risk_ids, all_risk, time_spent, _level_time_limit
	)
	_accumulated_score += score_result.get("total_score", 0)
	if _ui:
		_ui.update_score(_accumulated_score)
	_ui.hide_feedback()

	var task: Dictionary = LevelManager.get_current_task()
	var task_id: String = task.get("task_id", "")
	var recording: Dictionary = ReplayManager.stop_recording()
	if not choice_result.get("is_correct", false):
		ReplayManager.preserve_failed_replay(task_id)
		SaveManager.save_replay_record(task_id, recording)

	var score_record: Dictionary = {
		"record_id": "rec_%s_%d" % [task_id, Time.get_ticks_msec()],
		"task_id": task_id,
		"player_name": "Player",
		"timestamp": Time.get_datetime_dict_from_system(),
		"total_score": score_result.get("total_score", 0),
		"category_score": score_result.get("category_score", 0),
		"risk_word_score": score_result.get("risk_word_score", 0),
		"time_bonus": score_result.get("time_bonus", 0),
		"errors": score_result.get("errors", []),
		"rejection_triggered": score_result.get("rejection_triggered", false),
		"rejection_reasons": score_result.get("rejection_reasons", []),
		"completion_time": time_spent,
		"stuck_points": _stuck_detector.get_stuck_positions(),
	}
	SaveManager.save_score_record(score_record)

	_current_task_index += 1
	var has_next: bool = LevelManager.advance_task()
	if has_next:
		_task_dispatch.reset()
		_scoring_engine.reset()
		_risk_word_system.reset()
		if _ui:
			_ui.update_task_progress(_current_task_index + 1, _total_tasks)
		_start_current_task()
	else:
		_complete_level()

func _complete_level() -> void:
	_level_complete = true
	GameManager.complete_level(_accumulated_score)
	LeaderboardManager.add_entry("Player", _accumulated_score, GameManager.current_level_id, _level_time_limit - _time_remaining)
	var next_level_id: String = _get_next_level_id()
	if next_level_id != "":
		LevelManager.unlock_level(next_level_id)
	var result_data: Dictionary = {
		"level_id": GameManager.current_level_id,
		"total_score": _accumulated_score,
		"errors": _accumulated_errors,
		"rejections": _accumulated_rejections,
		"risk_identified": _accumulated_risk_identified.size(),
		"risk_total": _accumulated_risk_total.size(),
		"time_remaining": _time_remaining,
		"time_limit": _level_time_limit,
		"stuck_summary": _stuck_detector.get_stuck_summary(),
		"task_count": _total_tasks,
	}
	var slot: int = 0
	SaveManager.save_game(slot, {
		"level_id": GameManager.current_level_id,
		"score": _accumulated_score,
		"unlocked_levels": LevelManager.unlocked_levels,
		"result_data": result_data,
	})
	GameManager.set_meta("last_result", result_data)
	get_tree().change_scene_to_file(RESULT_SCENE)

func _get_next_level_id() -> String:
	var level_id: String = GameManager.current_level_id
	var parts: PackedStringArray = level_id.split("_")
	if parts.size() < 2:
		return ""
	var num: int = parts[parts.size() - 1].to_int()
	var next_num: int = num + 1
	parts[parts.size() - 1] = str(next_num).pad_zeros(2)
	var next_id: String = "_".join(parts)
	if LevelManager.get_all_levels().has(next_id):
		return next_id
	return ""

func _handle_time_out() -> void:
	_level_complete = true
	ReplayManager.stop_recording()
	_accumulated_errors.append({
		"error_type": "timeout",
		"feedback": "时间耗尽，任务失败。",
		"task_id": GameManager.current_task_id,
	})
	_complete_level()
