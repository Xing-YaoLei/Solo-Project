extends Control

const RESULT_SCENE: String = "res://scenes/result.tscn"

var _task_dispatch: TaskDispatchSystem
var _scoring_engine: ScoringEngine
var _risk_word_system: RiskWordSystem
var _stuck_detector: StuckDetector

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
var _level_complete: bool = false
var _risk_phase_active: bool = false
var _current_choice_result: Dictionary = {}
var _revealed_clue_labels: Array[Label] = []
var _choice_buttons: Array[Button] = []
var _risk_word_buttons: Dictionary = {}
var _identified_risk_words: Array[String] = []
var _tutorial_shown: bool = false

@onready var task_title_label: Label = $MainLayout/LeftPanel/VBox/TaskHeader/TaskTitleLabel
@onready var task_desc_label: RichTextLabel = $MainLayout/LeftPanel/VBox/TaskBody/TaskDescLabel
@onready var doc_type_label: Label = $MainLayout/LeftPanel/VBox/TaskHeader/DocTypeLabel
@onready var timer_label: Label = $TopBar/TimerLabel
@onready var score_label: Label = $TopBar/ScoreLabel
@onready var level_label: Label = $TopBar/LevelLabel
@onready var pause_button: Button = $TopBar/PauseButton
@onready var task_progress_label: Label = $TopBar/TaskProgressLabel
@onready var clue_container: VBoxContainer = $MainLayout/LeftPanel/VBox/ClueSection/ClueScroll/ClueContainer
@onready var clue_scroll: ScrollContainer = $MainLayout/LeftPanel/VBox/ClueSection/ClueScroll
@onready var choice_container: VBoxContainer = $MainLayout/RightPanel/ChoiceSection/ChoiceContainer
@onready var choice_section: PanelContainer = $MainLayout/RightPanel/ChoiceSection
@onready var risk_word_section: PanelContainer = $MainLayout/RightPanel/RiskWordSection
@onready var risk_word_container: VBoxContainer = $MainLayout/RightPanel/RiskWordSection/RiskWordContainer
@onready var risk_scan_button: Button = $MainLayout/RightPanel/RiskWordSection/RiskScanButton
@onready var risk_progress_label: Label = $MainLayout/RightPanel/RiskWordSection/RiskProgressLabel
@onready var accept_button: Button = $MainLayout/RightPanel/ActionSection/AcceptButton
@onready var feedback_panel: PanelContainer = $FeedbackPanel
@onready var feedback_label: RichTextLabel = $FeedbackPanel/FeedbackLabel
@onready var feedback_continue: Button = $FeedbackPanel/FeedbackContinue

func _ready() -> void:
	_task_dispatch = TaskDispatchSystem.new()
	_scoring_engine = ScoringEngine.new()
	_risk_word_system = RiskWordSystem.new()
	_stuck_detector = StuckDetector.new()
	add_child(_task_dispatch)
	add_child(_risk_word_system)
	add_child(_stuck_detector)

	_connect_signals()
	_initialize_level()

func _connect_signals() -> void:
	accept_button.pressed.connect(_on_task_accepted)
	risk_scan_button.pressed.connect(_on_risk_scan_confirmed)
	feedback_continue.pressed.connect(_on_feedback_continue)
	pause_button.pressed.connect(_on_pause_requested)
	_task_dispatch.task_dispatched.connect(_on_task_dispatched)
	_task_dispatch.clue_revealed.connect(_on_clue_revealed)
	_task_dispatch.choices_presented.connect(_on_choices_presented)
	_risk_word_system.risk_word_hit.connect(_on_risk_word_hit)
	_risk_word_system.risk_word_missed.connect(_on_risk_word_missed)
	_risk_word_system.all_risk_words_identified.connect(_on_all_risk_words_identified)
	_stuck_detector.stuck_detected.connect(_on_stuck_detected)

func _initialize_level() -> void:
	_current_level_data = LevelManager.get_current_level()
	if _current_level_data.is_empty():
		push_error("No level data loaded")
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

	level_label.text = _current_level_data.get("title", "")
	task_progress_label.text = "任务: 1/%d" % _total_tasks
	score_label.text = "得分: 0"
	update_timer_display(_time_remaining)
	_start_current_task()

func _start_current_task() -> void:
	var task: Dictionary = LevelManager.get_current_task()
	if task.is_empty():
		_complete_level()
		return
	_risk_phase_active = false
	_current_choice_result = {}
	_stuck_detector.set_context("task_%s" % task.get("task_id", ""))
	_stuck_detector.reset()
	_clear_clues()
	_clear_choices()
	_clear_risk_words()
	choice_section.visible = false
	risk_word_section.visible = false
	accept_button.visible = true
	feedback_panel.visible = false
	_identified_risk_words.clear()
	task_title_label.text = task.get("title", "未知任务")
	task_desc_label.text = task.get("description", "")
	doc_type_label.text = "文书类型: " + task.get("document_type", "")
	_task_dispatch.dispatch_task(task)
	ReplayManager.start_recording(task.get("task_id", ""))

func _process(delta: float) -> void:
	if _level_complete:
		return
	_time_remaining -= delta
	if _time_remaining < 0.0:
		_time_remaining = 0.0
	update_timer_display(_time_remaining)
	if _time_remaining <= 0.0:
		_handle_time_out()

func update_timer_display(time_remaining: float) -> void:
	var minutes: int = int(time_remaining) / 60
	var seconds: int = int(time_remaining) % 60
	timer_label.text = "⏱ %02d:%02d" % [minutes, seconds]
	if time_remaining < 30.0:
		timer_label.add_theme_color_override("font_color", Color(1.0, 0.3, 0.3))
	elif time_remaining < 60.0:
		timer_label.add_theme_color_override("font_color", Color(1.0, 0.8, 0.3))
	else:
		timer_label.add_theme_color_override("font_color", Color(0.85, 0.85, 0.9))

func _on_task_dispatched(task_id: String) -> void:
	GameManager.accept_task(task_id)
	accept_button.visible = false
	_stuck_detector.register_interaction("accept_task")
	ReplayManager.record_action("accept_task", {"task_id": task_id})
	_task_dispatch.accept_dispatched_task()

func _on_task_accepted() -> void:
	pass

func _on_clue_revealed(clue_id: String, content: String) -> void:
	var task: Dictionary = LevelManager.get_current_task()
	var clues: Array = task.get("clues", [])
	for clue in clues:
		if clue.get("clue_id", "") == clue_id:
			var label := Label.new()
			label.text = "[%s] %s" % [clue.get("clue_type", "线索"), clue.get("content", "")]
			label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
			label.custom_minimum_size.x = 380
			var relevance: float = clue.get("relevance", 1.0)
			if relevance >= 0.9:
				label.add_theme_color_override("font_color", Color(1.0, 0.95, 0.4))
			elif relevance >= 0.7:
				label.add_theme_color_override("font_color", Color(0.85, 0.85, 0.9))
			else:
				label.add_theme_color_override("font_color", Color(0.6, 0.6, 0.7))
			clue_container.add_child(label)
			_revealed_clue_labels.append(label)
			await get_tree().process_frame
			clue_scroll.scroll_vertical = clue_scroll.get_v_scroll_bar().max_value
			break
	_stuck_detector.register_interaction("clue_reveal")
	ReplayManager.record_action("clue_revealed", {"clue_id": clue_id})

func _on_choices_presented(choices: Array[Dictionary]) -> void:
	_clear_choices()
	choice_section.visible = true
	for choice in choices:
		var btn := Button.new()
		btn.text = choice.get("display_text", "")
		btn.custom_minimum_size = Vector2(320, 50)
		btn.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		var choice_data: Dictionary = choice
		btn.pressed.connect(_on_choice_button_pressed.bind(choice_data))
		choice_container.add_child(btn)
		_choice_buttons.append(btn)
	var task: Dictionary = LevelManager.get_current_task()
	var risk_words: Array = task.get("risk_words", [])
	if not risk_words.is_empty():
		risk_word_section.visible = true
		_clear_risk_words()
		_risk_word_buttons.clear()
		for rw in risk_words:
			var btn := Button.new()
			btn.text = "🔍 " + rw.get("word", "???")
			btn.custom_minimum_size = Vector2(300, 36)
			var word_id: String = rw.get("word_id", "")
			btn.pressed.connect(_on_risk_word_button_pressed.bind(word_id))
			risk_word_container.add_child(btn)
			_risk_word_buttons[word_id] = btn
		risk_progress_label.text = "已识别: 0/%d" % risk_words.size()
		_risk_word_system.load_risk_words(risk_words)
		_risk_word_system.start_scan()
		_accumulated_risk_total.append_array(risk_words)
	_stuck_detector.register_interaction("choices_presented")
	ReplayManager.record_action("choices_presented", {"count": choices.size()})

func _on_choice_button_pressed(choice_data: Dictionary) -> void:
	if _risk_phase_active:
		return
	for btn in _choice_buttons:
		btn.disabled = true
	_stuck_detector.register_interaction("choice_submitted")
	ReplayManager.record_action("choice_made", {"choice_id": choice_data.get("choice_id", "")})
	var result: Dictionary = _task_dispatch.submit_choice(choice_data)
	_current_choice_result = result
	var is_correct: bool = result.get("is_correct", false)
	GameManager.record_choice(choice_data.get("choice_id", ""), is_correct)
	if not is_correct:
		_accumulated_errors.append({
			"error_type": result.get("error_type", ""),
			"feedback": result.get("feedback", ""),
			"choice_id": choice_data.get("choice_id", ""),
			"task_id": GameManager.current_task_id,
		})
		if result.get("triggers_rejection", false):
			_accumulated_rejections.append({
				"reason": result.get("rejection_reason", ""),
				"task_id": GameManager.current_task_id,
				"choice_id": choice_data.get("choice_id", ""),
			})
	feedback_panel.visible = true
	var color_tag: String = "[color=#4CAF50]" if is_correct else "[color=#F44336]"
	feedback_label.text = color_tag + result.get("feedback", "") + "[/color]"
	var task: Dictionary = LevelManager.get_current_task()
	var risk_words: Array = task.get("risk_words", [])
	if is_correct and not risk_words.is_empty():
		_risk_phase_active = true
		feedback_continue.text = "继续标注风险词"
	else:
		feedback_continue.text = "继续"

func _on_risk_word_button_pressed(word_id: String) -> void:
	var result: Dictionary = _risk_word_system.attempt_identify(word_id)
	if result.get("hit", false):
		if _risk_word_buttons.has(word_id):
			var btn: Button = _risk_word_buttons[word_id]
			btn.disabled = true
			var severity: int = result.get("severity", 1)
			match severity:
				3:
					btn.add_theme_color_override("font_color", Color(1.0, 0.3, 0.3))
				2:
					btn.add_theme_color_override("font_color", Color(1.0, 0.7, 0.3))
				_:
					btn.add_theme_color_override("font_color", Color(0.3, 0.9, 0.3))
			if word_id not in _identified_risk_words:
				_identified_risk_words.append(word_id)
		var total: int = _risk_word_buttons.size()
		var identified: int = _identified_risk_words.size()
		risk_progress_label.text = "已识别: %d/%d" % [identified, total]
	else:
		if _risk_word_buttons.has(word_id):
			var btn: Button = _risk_word_buttons[word_id]
			btn.add_theme_color_override("font_color", Color(0.5, 0.5, 0.5))
	_stuck_detector.register_interaction("risk_word_attempt")
	ReplayManager.record_action("risk_word_attempt", {"word_id": word_id, "hit": result.get("hit", false)})

func _on_risk_word_hit(word_id: String, severity: int, category: String) -> void:
	pass

func _on_risk_word_missed(word_id: String) -> void:
	if _risk_word_buttons.has(word_id):
		var btn: Button = _risk_word_buttons[word_id]
		btn.add_theme_color_override("font_color", Color(0.5, 0.5, 0.5))

func _on_all_risk_words_identified() -> void:
	risk_scan_button.disabled = false

func _on_risk_scan_confirmed() -> void:
	var scan_result: Dictionary = _risk_word_system.complete_scan()
	ReplayManager.record_action("risk_scan_confirmed", scan_result)
	_risk_phase_active = false
	_complete_task_flow(_current_choice_result)

func _on_feedback_continue() -> void:
	feedback_panel.visible = false
	if not _risk_phase_active:
		_complete_task_flow(_current_choice_result)

func _on_stuck_detected(stuck_data: Dictionary) -> void:
	ReplayManager.record_stuck_point("Stuck at: %s" % stuck_data.get("context", ""))

func _on_pause_requested() -> void:
	GameManager.pause_game()

func _complete_task_flow(choice_result: Dictionary) -> void:
	feedback_panel.visible = false
	var time_spent: float = _task_dispatch.elapsed_time
	var all_risk: Array = _accumulated_risk_total
	var risk_ids: Array = []
	for rid in _accumulated_risk_identified:
		risk_ids.append(rid)
	var score_result: Dictionary = _scoring_engine.calculate_score(
		choice_result, risk_ids, all_risk, time_spent, _level_time_limit
	)
	_accumulated_score += score_result.get("total_score", 0)
	score_label.text = "得分: %d" % _accumulated_score
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
		task_progress_label.text = "任务: %d/%d" % [_current_task_index + 1, _total_tasks]
		_start_current_task()
	else:
		_complete_level()

func _complete_level() -> void:
	_level_complete = true
	GameManager.complete_level(_accumulated_score)
	var completion_time: float = _level_time_limit - _time_remaining
	LeaderboardManager.add_entry("Player", _accumulated_score, GameManager.current_level_id, completion_time)
	var next_level_id: String = _get_next_level_id()
	if next_level_id != "":
		LevelManager.unlock_level(next_level_id)
	var result_data: Dictionary = {
		"level_id": GameManager.current_level_id,
		"level_title": _current_level_data.get("title", ""),
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
	SaveManager.save_game(0, {
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
	parts[parts.size() - 1] = str(num + 1).pad_zeros(2)
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

func _clear_clues() -> void:
	for label in _revealed_clue_labels:
		label.queue_free()
	_revealed_clue_labels.clear()

func _clear_choices() -> void:
	for btn in _choice_buttons:
		btn.queue_free()
	_choice_buttons.clear()

func _clear_risk_words() -> void:
	for child in risk_word_container.get_children():
		child.queue_free()
	_risk_word_buttons.clear()
	_identified_risk_words.clear()
