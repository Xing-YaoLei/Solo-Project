class_name TaskDispatchSystem
extends Node

signal task_dispatched(task_id: String)
signal clue_revealed(clue_id: String, content: String)
signal choices_presented(choices: Array[Dictionary])
signal dispatch_complete(task_id: String, result: Dictionary)

enum State {
	IDLE,
	WAITING_ACCEPT,
	REVEALING_CLUES,
	AWAITING_CHOICE,
	EVALUATING,
	COMPLETE,
}

var current_state: State = State.IDLE
var current_task_data: Dictionary = {}
var revealed_clues: Array[Dictionary] = []
var elapsed_time: float = 0.0
var clue_reveal_timer: float = 0.0
var clue_reveal_interval: float = 1.5

var _clue_queue: Array[Dictionary] = []
var _current_clue_index: int = 0
var _sorted_clues: Array[Dictionary] = []
var _all_clues_revealed: bool = false


func dispatch_task(task_data: Dictionary) -> void:
	if current_state != State.IDLE:
		return
	current_task_data = task_data
	revealed_clues.clear()
	_clue_queue.clear()
	_sorted_clues.clear()
	_current_clue_index = 0
	_all_clues_revealed = false
	elapsed_time = 0.0
	clue_reveal_timer = 0.0

	var clues: Array = task_data.get("clues", [])
	for clue in clues:
		_sorted_clues.append(clue)
	_sorted_clues.sort_custom(func(a: Dictionary, b: Dictionary) -> bool:
		return a.get("reveal_order", 0) < b.get("reveal_order", 0)
	)

	current_state = State.WAITING_ACCEPT
	task_dispatched.emit(task_data.get("task_id", ""))


func accept_dispatched_task() -> void:
	if current_state != State.WAITING_ACCEPT:
		return
	current_state = State.REVEALING_CLUES
	clue_reveal_timer = 0.0
	if _sorted_clues.is_empty():
		_all_clues_revealed = true
		present_choices()


func reveal_next_clue() -> void:
	if current_state != State.REVEALING_CLUES:
		return
	if _current_clue_index >= _sorted_clues.size():
		_all_clues_revealed = true
		present_choices()
		return

	var clue: Dictionary = _sorted_clues[_current_clue_index]
	revealed_clues.append(clue)
	_current_clue_index += 1
	clue_revealed.emit(clue.get("clue_id", ""), clue.get("content", ""))

	if _current_clue_index >= _sorted_clues.size():
		_all_clues_revealed = true
		present_choices()


func present_choices() -> void:
	if current_state != State.REVEALING_CLUES:
		return
	var choices: Array[Dictionary] = []
	var raw_choices: Array = current_task_data.get("choices", [])
	for choice in raw_choices:
		choices.append(choice)
	current_state = State.AWAITING_CHOICE
	choices_presented.emit(choices)


func submit_choice(choice_data: Dictionary) -> Dictionary:
	if current_state != State.AWAITING_CHOICE:
		return {}
	current_state = State.EVALUATING
	var evaluation: Dictionary = _evaluate_choice(choice_data)
	var result: Dictionary = _build_result_dict(choice_data, evaluation)
	current_state = State.COMPLETE
	dispatch_complete.emit(current_task_data.get("task_id", ""), result)
	return result


func get_dispatch_state() -> int:
	return current_state


func reset() -> void:
	current_state = State.IDLE
	current_task_data.clear()
	revealed_clues.clear()
	_clue_queue.clear()
	_sorted_clues.clear()
	_current_clue_index = 0
	_all_clues_revealed = false
	elapsed_time = 0.0
	clue_reveal_timer = 0.0


func _process(delta: float) -> void:
	if current_state == State.WAITING_ACCEPT or current_state == State.REVEALING_CLUES \
		or current_state == State.AWAITING_CHOICE:
		elapsed_time += delta

	if current_state == State.REVEALING_CLUES and not _all_clues_revealed:
		clue_reveal_timer += delta
		if clue_reveal_timer >= clue_reveal_interval:
			clue_reveal_timer = 0.0
			reveal_next_clue()


func _evaluate_choice(choice: Dictionary) -> Dictionary:
	var is_correct: bool = choice.get("is_correct", false)
	var correct_category: String = current_task_data.get("correct_category", "")
	var correct_sub_category: String = current_task_data.get("correct_sub_category", "")
	var choice_category: String = choice.get("category", "")
	var choice_sub_category: String = choice.get("sub_category", "")

	var score_value: int = 0
	var feedback: String = ""
	var error_type: String = ""
	var triggers_rejection: bool = false
	var rejection_reason: String = ""

	if is_correct:
		score_value = choice.get("score_value", 100)
		feedback = choice.get("feedback", "正确分类。")
	else:
		score_value = 0
		triggers_rejection = choice.get("triggers_rejection", false)
		rejection_reason = choice.get("rejection_reason", "")

		if triggers_rejection:
			error_type = "critical"
			feedback = choice.get("feedback", "严重错误：触发驳回。")
		elif choice_category != correct_category:
			error_type = "category_mismatch"
			feedback = choice.get("feedback", "分类错误：文档类别不正确。")
		elif choice_sub_category != correct_sub_category:
			error_type = "sub_category_mismatch"
			feedback = choice.get("feedback", "子分类错误：文档子类别不正确。")
		else:
			error_type = "other"
			feedback = choice.get("feedback", "分类不正确。")

	return {
		"is_correct": is_correct,
		"score_value": score_value,
		"feedback": feedback,
		"error_type": error_type,
		"triggers_rejection": triggers_rejection,
		"rejection_reason": rejection_reason,
	}


func _build_result_dict(choice: Dictionary, evaluation: Dictionary) -> Dictionary:
	var time_limit: float = current_task_data.get("time_limit", 0.0)
	return {
		"task_id": current_task_data.get("task_id", ""),
		"choice_id": choice.get("choice_id", ""),
		"choice_data": choice,
		"is_correct": evaluation.get("is_correct", false),
		"score_value": evaluation.get("score_value", 0),
		"feedback": evaluation.get("feedback", ""),
		"error_type": evaluation.get("error_type", ""),
		"triggers_rejection": evaluation.get("triggers_rejection", false),
		"rejection_reason": evaluation.get("rejection_reason", ""),
		"elapsed_time": elapsed_time,
		"time_limit": time_limit,
		"revealed_clues": revealed_clues.duplicate(),
	}
