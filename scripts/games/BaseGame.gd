extends "res://scripts/ui/BaseUI.gd"

var current_question_index: int = 0
var questions: Array = []
var current_question: Dictionary = {}
var score: int = 0
var max_score: int = 0
var time_remaining: int = 0
var timer_active: bool = false
var game_completed: bool = false
var game_type: String = ""

func _ready() -> void:
	super._ready()

func initialize_game(game_type_param: String, level_data: Dictionary) -> void:
	game_type = game_type_param
	var mode = GameManager.current_mode
	questions = _select_questions(game_type_param, level_data)
	current_question_index = 0
	score = 0
	max_score = 0
	game_completed = false
	if mode == "formal" and level_data.has("time_limit"):
		time_remaining = level_data["time_limit"]
		timer_active = true
	else:
		timer_active = false
	if len(questions) > 0:
		_load_question(0)
	_setup_ui()

func _select_questions(game_type_param: String, level_data: Dictionary) -> Array:
	var all_questions = DataManager.get_questions_by_type(game_type_param)
	var question_count = level_data.get("question_count", 0)
	if question_count <= 0 or question_count >= len(all_questions):
		return all_questions.duplicate()
	var shuffled = all_questions.duplicate()
	shuffle_array(shuffled)
	return shuffled.slice(0, question_count)

func shuffle_array(arr: Array) -> void:
	for i in range(arr.size() - 1, 0, -1):
		var j = randi() % (i + 1)
		var temp = arr[i]
		arr[i] = arr[j]
		arr[j] = temp

func _setup_ui() -> void:
	pass

func _load_question(index: int) -> void:
	if index < 0 or index >= len(questions):
		return
	current_question_index = index
	current_question = questions[index]
	var permission_check = PermissionManager.check_permission(current_question.get("required_permission", ""))
	if not permission_check["granted"]:
		show_permission_error(permission_check["reason"])
	max_score += current_question.get("score", 0)
	_render_question(current_question)

func _render_question(question: Dictionary) -> void:
	pass

func _process(delta: float) -> void:
	if timer_active and not game_completed:
		time_remaining -= delta
		if time_remaining <= 0:
			time_remaining = 0
			timer_active = false
			_on_time_up()

func _on_time_up() -> void:
	show_notification("训练时间已到，正在结算成绩...", "warning", 3.0)
	await get_tree().create_timer(1.5).timeout
	_finish_game()

func _submit_answer(answer, correct: bool, question_score: int = 0) -> void:
	var actual_score = question_score if correct else 0
	score += actual_score
	GameManager.record_answer(
		current_question.get("id", ""),
		correct,
		actual_score,
		current_question.get("score", 0),
		answer,
		_get_correct_answer(),
		_get_mistake_type(correct)
	)
	if correct:
		show_notification("回答正确！+%d 分" % actual_score, "success", 2.0)
	else:
		show_notification("回答错误。正确答案已记录。", "error", 3.0)
	await get_tree().create_timer(1.0).timeout
	_next_question()

func _get_correct_answer():
	return null

func _get_mistake_type(correct: bool) -> String:
	if correct:
		return ""
	return game_type

func _next_question() -> void:
	var next_index = current_question_index + 1
	if next_index >= len(questions):
		_finish_game()
	else:
		_load_question(next_index)

func _finish_game() -> void:
	if game_completed:
		return
	game_completed = true
	timer_active = false
	var result = GameManager.finish_game()
	result["game_type"] = game_type
	result["display_score"] = score
	result["display_max_score"] = max_score
	_show_result(result)

func _show_result(result: Dictionary) -> void:
	_advance_to_next_game_or_finish(result)

func _advance_to_next_game_or_finish(_result: Dictionary) -> void:
	var queue = GameManager.current_level.get("_game_types_queue", [])
	var idx = GameManager.current_level.get("_current_game_index", 0)
	idx += 1
	if idx < queue.size():
		GameManager.current_level["_current_game_index"] = idx
		GameManager.change_scene(queue[idx])
	else:
		GameManager.change_scene("result_review")

func go_back() -> void:
	if GameManager.current_mode == "formal":
		GameManager.finish_game()
	if game_type == "evidence_identification" or game_type == "template_selection" or game_type == "checklist_sorting" or game_type == "sampling_processing":
		if GameManager.current_mode == "formal":
			GameManager.change_scene("formal_training")
		else:
			GameManager.change_scene("free_practice")
	else:
		GameManager.change_scene("main_menu")
