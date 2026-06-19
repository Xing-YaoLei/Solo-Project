class_name PlayerData
extends RefCounted

var player_name: String
var total_score: int
var completed_orders: int
var failed_orders: int
var repair_orders: int
var total_time_spent: float
var best_time: float
var current_streak: int
var max_streak: int
var level: int
var experience: int
var experience_to_next_level: int
var unlocked_levels: Array[int]
var achievements: Array[String]
var total_earnings: float
var total_parts_used: int
var perfect_completions: int

func _init(p_name: String = "玩家"):
	player_name = p_name
	total_score = 0
	completed_orders = 0
	failed_orders = 0
	repair_orders = 0
	total_time_spent = 0.0
	best_time = INF
	current_streak = 0
	max_streak = 0
	level = 1
	experience = 0
	experience_to_next_level = 1000
	unlocked_levels = [1]
	achievements = []
	total_earnings = 0.0
	total_parts_used = 0
	perfect_completions = 0

func add_score(p_score: int) -> void:
	total_score += p_score
	add_experience(p_score)

func add_experience(p_exp: int) -> void:
	experience += p_exp
	while experience >= experience_to_next_level:
		experience -= experience_to_next_level
		level += 1
		experience_to_next_level = int(experience_to_next_level * 1.5)
		unlocked_levels.append(level)

func add_completed_order(p_is_perfect: bool, p_time: float) -> void:
	completed_orders += 1
	current_streak += 1
	max_streak = max(max_streak, current_streak)
	total_time_spent += p_time
	if p_time < best_time:
		best_time = p_time
	if p_is_perfect:
		perfect_completions += 1

func add_failed_order() -> void:
	failed_orders += 1
	current_streak = 0

func add_repair_order() -> void:
	repair_orders += 1

func add_earnings(p_amount: float) -> void:
	total_earnings += p_amount

func add_parts_used(p_count: int) -> void:
	total_parts_used += p_count

func get_repair_rate() -> float:
	if completed_orders == 0:
		return 0.0
	return float(repair_orders) / float(completed_orders)

func get_success_rate() -> float:
	var total = completed_orders + failed_orders
	if total == 0:
		return 0.0
	return float(completed_orders) / float(total)

func get_average_time() -> float:
	if completed_orders == 0:
		return 0.0
	return total_time_spent / float(completed_orders)

func get_efficiency_score() -> float:
	var success_component = get_success_rate() * 40.0
	var speed_component = 0.0
	if best_time < INF:
		speed_component = clamp(300.0 / best_time, 0.0, 1.0) * 30.0
	var quality_component = (1.0 - get_repair_rate()) * 30.0
	return success_component + speed_component + quality_component

func add_achievement(p_id: String) -> void:
	if not achievements.has(p_id):
		achievements.append(p_id)

func has_achievement(p_id: String) -> bool:
	return achievements.has(p_id)

func is_level_unlocked(p_level: int) -> bool:
	return unlocked_levels.has(p_level)

func reset_session_stats() -> void:
	current_streak = 0

func to_dict() -> Dictionary:
	return {
		"player_name": player_name,
		"total_score": total_score,
		"completed_orders": completed_orders,
		"failed_orders": failed_orders,
		"repair_orders": repair_orders,
		"total_time_spent": total_time_spent,
		"best_time": best_time,
		"current_streak": current_streak,
		"max_streak": max_streak,
		"level": level,
		"experience": experience,
		"experience_to_next_level": experience_to_next_level,
		"unlocked_levels": unlocked_levels,
		"achievements": achievements,
		"total_earnings": total_earnings,
		"total_parts_used": total_parts_used,
		"perfect_completions": perfect_completions
	}

func from_dict(p_dict: Dictionary) -> void:
	player_name = p_dict.get("player_name", "玩家")
	total_score = p_dict.get("total_score", 0)
	completed_orders = p_dict.get("completed_orders", 0)
	failed_orders = p_dict.get("failed_orders", 0)
	repair_orders = p_dict.get("repair_orders", 0)
	total_time_spent = p_dict.get("total_time_spent", 0.0)
	best_time = p_dict.get("best_time", INF)
	current_streak = p_dict.get("current_streak", 0)
	max_streak = p_dict.get("max_streak", 0)
	level = p_dict.get("level", 1)
	experience = p_dict.get("experience", 0)
	experience_to_next_level = p_dict.get("experience_to_next_level", 1000)
	unlocked_levels = p_dict.get("unlocked_levels", [1])
	achievements = p_dict.get("achievements", [])
	total_earnings = p_dict.get("total_earnings", 0.0)
	total_parts_used = p_dict.get("total_parts_used", 0)
	perfect_completions = p_dict.get("perfect_completions", 0)
