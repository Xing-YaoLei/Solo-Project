extends Node

var correct_count: int = 0
var wrong_count: int = 0
var disputed_count: int = 0
var upgraded_count: int = 0

var total_possible_score: int = 100
var current_score: int = 0
var efficiency_bonus: float = 0.0

var wrong_reasons: Array = []
var dispute_records: Array = []
var order_results: Array = []

var session_start_time: float = 0.0
var current_order_start_time: float = 0.0
var avg_processing_seconds: float = 0.0
var total_processing_seconds: float = 0.0

var current_session_result: Dictionary = {}
var current_tutorial_id: String = "tutorial_basics"

const SCORE_CORRECT: int = 10
const SCORE_WRONG: int = -15
const SCORE_DISPUTE: int = -25
const SCORE_UPGRADED_CORRECT: int = 5
const SCORE_UPGRADED_WRONG: int = -5
const SCORE_SPEED_BONUS_MAX: int = 20
const AVG_TIME_THRESHOLD: float = 15.0

func reset_session() -> void:
	correct_count = 0
	wrong_count = 0
	disputed_count = 0
	upgraded_count = 0
	current_score = 0
	efficiency_bonus = 0.0
	wrong_reasons.clear()
	dispute_records.clear()
	order_results.clear()
	session_start_time = Time.get_ticks_msec() / 1000.0
	total_processing_seconds = 0.0
	avg_processing_seconds = 0.0
	current_session_result = {}

func start_order_timer() -> void:
	current_order_start_time = Time.get_ticks_msec() / 1000.0

func process_decision(order: Dictionary, decision: String) -> Dictionary:
	var elapsed: float = (Time.get_ticks_msec() / 1000.0) - current_order_start_time
	total_processing_seconds += elapsed

	var actual_valid: bool = order.get("is_valid_order", true)
	var decision_valid: bool = (decision == "pass")
	var is_upgrade: bool = (decision == "upgrade")

	var result: Dictionary = {
		"order_id": order.get("order_id", ""),
		"buyer_name": order.get("buyer_name", ""),
		"ticket_type_id": order.get("ticket_type_id", ""),
		"decision": decision,
		"actual_valid": actual_valid,
		"processing_time": elapsed,
		"score_change": 0,
		"dispute_triggered": false,
		"wrong_reason": ""
	}

	if is_upgrade:
		if not actual_valid:
			result["score_change"] = SCORE_UPGRADED_CORRECT
			current_score += SCORE_UPGRADED_CORRECT
			upgraded_count += 1
		else:
			result["score_change"] = SCORE_UPGRADED_WRONG
			current_score += SCORE_UPGRADED_WRONG
			wrong_count += 1
			result["wrong_reason"] = "过度谨慎：有效订单却被升级处理"
			wrong_reasons.append(result["wrong_reason"])
	else:
		var correct: bool = (actual_valid == decision_valid)
		if correct:
			result["score_change"] = SCORE_CORRECT
			current_score += SCORE_CORRECT
			correct_count += 1
		else:
			result["score_change"] = SCORE_WRONG
			current_score += SCORE_WRONG
			wrong_count += 1
			if actual_valid:
				result["wrong_reason"] = "误拒：有效订单被错误拒绝"
			else:
				result["wrong_reason"] = order.get("invalid_reason", "无效票据被错误放行")
			wrong_reasons.append(result["wrong_reason"])

			var refund_risk: float = GameManager.current_level.get("refund_risk", 0.1)
			if randf() < refund_risk:
				result["dispute_triggered"] = true
				result["score_change"] += SCORE_DISPUTE
				current_score += SCORE_DISPUTE
				disputed_count += 1
				dispute_records.append({
					"order_id": result["order_id"],
					"reason": result["wrong_reason"],
					"time": Time.get_datetime_string_from_system()
				})

	order_results.append(result)
	return result

func finalize_session() -> Dictionary:
	var total_orders: int = order_results.size()
	if total_orders > 0:
		avg_processing_seconds = total_processing_seconds / float(total_orders)
		if avg_processing_seconds < AVG_TIME_THRESHOLD:
			var speed_ratio: float = 1.0 - (avg_processing_seconds / AVG_TIME_THRESHOLD)
			efficiency_bonus = int(speed_ratio * float(SCORE_SPEED_BONUS_MAX))
			current_score += efficiency_bonus

	var accuracy: float = 0.0
	if total_orders > 0:
		accuracy = float(correct_count) / float(total_orders)

	var final_score: int = max(0, current_score)
	var level_id: String = GameManager.current_level.get("id", "unknown")
	var level_name: String = GameManager.current_level.get("name", "未知关卡")
	var passed: bool = final_score >= GameManager.current_level.get("min_score_to_pass", 60)

	current_session_result = {
		"session_id": "SES-%d" % Time.get_unix_time_from_system(),
		"level_id": level_id,
		"level_name": level_name,
		"timestamp": Time.get_datetime_string_from_system(),
		"final_score": final_score,
		"base_score": current_score - efficiency_bonus,
		"efficiency_bonus": efficiency_bonus,
		"passed": passed,
		"total_orders": total_orders,
		"correct_count": correct_count,
		"wrong_count": wrong_count,
		"disputed_count": disputed_count,
		"upgraded_count": upgraded_count,
		"accuracy": accuracy,
		"avg_processing_seconds": avg_processing_seconds,
		"wrong_reasons": wrong_reasons.duplicate(),
		"dispute_records": dispute_records.duplicate(),
		"order_results": order_results.duplicate(),
		"player_name": GameManager.player_name
	}
	return current_session_result
