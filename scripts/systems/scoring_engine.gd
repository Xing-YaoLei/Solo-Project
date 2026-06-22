class_name ScoringEngine
extends RefCounted

const BASE_CATEGORY_SCORE: int = 100
const RISK_WORD_BONUS: int = 50
const TIME_BONUS_FACTOR: float = 0.5
const REJECTION_PENALTY: int = -200
const PARTIAL_CREDIT_THRESHOLD: float = 0.4

var current_scores: Dictionary = {}
var error_log: Array[Dictionary] = []
var rejection_triggers: Array[Dictionary] = []


func calculate_score(choice_result: Dictionary, identified_risk_words: Array, total_risk_words: Array, time_spent: float, time_limit: float) -> Dictionary:
	error_log.clear()
	rejection_triggers.clear()

	var category_score: int = _calc_category_score(choice_result)
	var risk_word_score: int = _calc_risk_word_score(identified_risk_words, total_risk_words)
	var time_bonus: int = _calc_time_bonus(time_spent, time_limit)
	var errors: Array[Dictionary] = _detect_errors(choice_result)
	var rejection: Dictionary = _check_rejection(choice_result)

	for err in errors:
		error_log.append(err)

	if rejection.get("triggered", false):
		rejection_triggers.append(rejection)
		category_score += REJECTION_PENALTY

	var total_score: int = category_score + risk_word_score + time_bonus
	if total_score < 0:
		total_score = 0

	current_scores = {
		"total_score": total_score,
		"category_score": category_score,
		"risk_word_score": risk_word_score,
		"time_bonus": time_bonus,
		"errors": errors,
		"rejection_triggered": rejection.get("triggered", false),
		"rejection_reasons": rejection.get("reasons", []),
		"completion_time": time_spent,
	}

	return current_scores


func _calc_category_score(choice_result: Dictionary) -> int:
	var is_correct: bool = choice_result.get("is_correct", false)
	if is_correct:
		return BASE_CATEGORY_SCORE

	var error_type: String = choice_result.get("error_type", "")
	match error_type:
		"sub_category_mismatch":
			return int(BASE_CATEGORY_SCORE * PARTIAL_CREDIT_THRESHOLD)
		"category_mismatch":
			return 0
		"critical":
			return REJECTION_PENALTY
		_:
			return 0


func _calc_risk_word_score(identified: Array, total: Array) -> int:
	if total.is_empty():
		return 0
	var total_ids: Array = []
	for word_data in total:
		if word_data is Dictionary:
			total_ids.append(word_data.get("word_id", ""))
		else:
			total_ids.append(str(word_data))
	var identified_count: int = 0
	for word_id in identified:
		if word_id in total_ids:
			identified_count += 1
	return identified_count * RISK_WORD_BONUS


func _calc_time_bonus(time_spent: float, time_limit: float) -> int:
	if time_limit <= 0.0:
		return 0
	var ratio: float = 1.0 - (time_spent / time_limit)
	if ratio < 0.0:
		ratio = 0.0
	return int(ratio * BASE_CATEGORY_SCORE * TIME_BONUS_FACTOR)


func _detect_errors(choice_result: Dictionary) -> Array[Dictionary]:
	var errors: Array[Dictionary] = []
	var is_correct: bool = choice_result.get("is_correct", false)
	if is_correct:
		return errors

	var error_type: String = choice_result.get("error_type", "")
	var feedback: String = choice_result.get("feedback", "")
	var error_entry: Dictionary = {
		"error_type": error_type,
		"feedback": feedback,
		"severity": 0,
	}

	match error_type:
		"category_mismatch":
			error_entry["severity"] = 2
		"sub_category_mismatch":
			error_entry["severity"] = 1
		"critical":
			error_entry["severity"] = 3
		_:
			error_entry["severity"] = 1

	errors.append(error_entry)
	return errors


func _check_rejection(choice_result: Dictionary) -> Dictionary:
	var triggers_rejection: bool = choice_result.get("triggers_rejection", false)
	var rejection_reason: String = choice_result.get("rejection_reason", "")
	var reasons: Array = []
	if triggers_rejection:
		reasons.append(rejection_reason)
	return {
		"triggered": triggers_rejection,
		"reasons": reasons,
	}


func generate_error_summary(errors: Array[Dictionary]) -> String:
	if errors.is_empty():
		return "无错误记录。"
	var summary: String = ""
	var category_errors: int = 0
	var sub_category_errors: int = 0
	var critical_errors: int = 0
	var other_errors: int = 0

	for err in errors:
		var error_type: String = err.get("error_type", "")
		match error_type:
			"category_mismatch":
				category_errors += 1
			"sub_category_mismatch":
				sub_category_errors += 1
			"critical":
				critical_errors += 1
			_:
				other_errors += 1

	var parts: Array = []
	if critical_errors > 0:
		parts.append("严重错误 %d 项" % critical_errors)
	if category_errors > 0:
		parts.append("分类错误 %d 项" % category_errors)
	if sub_category_errors > 0:
		parts.append("子分类错误 %d 项" % sub_category_errors)
	if other_errors > 0:
		parts.append("其他错误 %d 项" % other_errors)

	summary = "、".join(parts) + "。"
	return summary


func get_error_by_type(error_type: String) -> Array[Dictionary]:
	var result: Array[Dictionary] = []
	for err in error_log:
		if err.get("error_type", "") == error_type:
			result.append(err)
	return result


func reset() -> void:
	current_scores.clear()
	error_log.clear()
	rejection_triggers.clear()
