extends Node

signal level_completed(result: Dictionary)

var current_level_id: String = ""
var current_mode: String = "formal"

var time_remaining: float = 0.0
var total_time: float = 0.0
var tasks_completed: int = 0
var tasks_total: int = 0
var errors: int = 0
var combo: int = 0
var max_combo: int = 0
var score: int = 0

var task_history: Array = []

var level_results: Dictionary = {}
var last_result: Dictionary = {}

func start_level(level_id: String, mode: String) -> void:
	current_level_id = level_id
	current_mode = mode
	time_remaining = LevelManager.get_level_time(level_id)
	total_time = time_remaining
	tasks_completed = 0
	tasks_total = LevelManager.get_level_task_count(level_id)
	errors = 0
	combo = 0
	max_combo = 0
	score = 0
	task_history.clear()

func update_timer(delta: float) -> bool:
	time_remaining -= delta
	if time_remaining <= 0.0:
		time_remaining = 0.0
		return true
	return false

func submit_task(correct: bool, task_type: String) -> void:
	var task_data := {
		"type": task_type,
		"correct": correct,
		"time": total_time - time_remaining,
		"combo_before": combo
	}
	task_history.append(task_data)
	if correct:
		tasks_completed += 1
		combo += 1
		max_combo = max(max_combo, combo)
		var base_score: int = 100
		var combo_bonus: int = min(combo, 10) * 10
		score += base_score + combo_bonus
	else:
		errors += 1
		combo = 0
		score = max(0, score - 50)

func is_level_complete() -> bool:
	return tasks_completed >= tasks_total

func finalize_level() -> Dictionary:
	var time_taken: float = total_time - time_remaining
	var accuracy: float = 0.0
	if tasks_completed + errors > 0:
		accuracy = float(tasks_completed) / float(tasks_completed + errors) * 100.0
	var time_score: int = 0
	if tasks_total > 0:
		var time_ratio: float = max(0.0, (total_time - time_taken) / total_time)
		time_score = int(time_ratio * 500)
	var total_score: int = score + time_score
	var result := {
		"level_id": current_level_id,
		"mode": current_mode,
		"time_taken": time_taken,
		"tasks_completed": tasks_completed,
		"tasks_total": tasks_total,
		"errors": errors,
		"max_combo": max_combo,
		"accuracy": accuracy,
		"score": score,
		"time_score": time_score,
		"total_score": total_score,
		"task_history": task_history.duplicate()
	}
	if not level_results.has(current_level_id):
		level_results[current_level_id] = []
	level_results[current_level_id].append(result)
	last_result = result.duplicate()
	emit_signal("level_completed", result)
	return result

func get_best_result(level_id: String) -> Dictionary:
	if not level_results.has(level_id):
		return {}
	var results: Array = level_results[level_id]
	if results.is_empty():
		return {}
	var best: Dictionary = results[0]
	for r in results:
		if int(r.total_score) > int(best.total_score):
			best = r
	return best
