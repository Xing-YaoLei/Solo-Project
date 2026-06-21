extends Node

signal data_updated()

const SLOT_DURATION: int = 60
const WORK_START_HOUR: int = 8
const WORK_END_HOUR: int = 18

var cleaners: Array = []
var orders: Array = []
var levels: Array = []
var current_level: Dictionary = {}

func _ready() -> void:
	_init_default_data()

func _init_default_data() -> void:
	_init_cleaners()
	_init_levels()

func _init_cleaners() -> void:
	cleaners = [
		{"id": 1, "name": "张阿姨", "capacity": 4, "skills": ["日常保洁", "深度保洁"], "work_days": [1, 2, 3, 4, 5]},
		{"id": 2, "name": "李阿姨", "capacity": 5, "skills": ["日常保洁", "厨房专项"], "work_days": [1, 2, 3, 4, 5, 6]},
		{"id": 3, "name": "王阿姨", "capacity": 3, "skills": ["日常保洁", "深度保洁", "厨房专项"], "work_days": [2, 3, 4, 5, 6, 0]},
		{"id": 4, "name": "赵阿姨", "capacity": 4, "skills": ["日常保洁", "卫生间专项"], "work_days": [1, 2, 3, 4, 5]},
		{"id": 5, "name": "陈阿姨", "capacity": 5, "skills": ["日常保洁", "深度保洁", "卫生间专项"], "work_days": [1, 2, 3, 5, 6]},
	]

func _init_levels() -> void:
	levels = [
		{
			"id": 1,
			"name": "新手入门",
			"description": "学习基础的排班概念，认识时段和保洁员分配",
			"difficulty": 1,
			"time_limit": 300,
			"order_count": 5,
			"cleaner_count": 3,
			"required_score": 60,
			"unlocked": true,
		},
		{
			"id": 2,
			"name": "冲突检测",
			"description": "识别时段冲突，学习冲突原因判断",
			"difficulty": 2,
			"time_limit": 360,
			"order_count": 8,
			"cleaner_count": 4,
			"required_score": 70,
			"unlocked": false,
		},
		{
			"id": 3,
			"name": "容量规划",
			"description": "根据保洁员容量合理分配订单",
			"difficulty": 3,
			"time_limit": 420,
			"order_count": 12,
			"cleaner_count": 4,
			"required_score": 75,
			"unlocked": false,
		},
		{
			"id": 4,
			"name": "改约处理",
			"description": "处理客户改约请求，重新安排排班",
			"difficulty": 4,
			"time_limit": 480,
			"order_count": 15,
			"cleaner_count": 5,
			"required_score": 80,
			"unlocked": false,
		},
		{
			"id": 5,
			"name": "综合挑战",
			"description": "综合运用所有技能，应对复杂排班场景",
			"difficulty": 5,
			"time_limit": 600,
			"order_count": 20,
			"cleaner_count": 5,
			"required_score": 85,
			"unlocked": false,
		},
	]

func generate_orders(level_id: int) -> Array:
	var level: Dictionary = get_level_by_id(level_id)
	if level.is_empty():
		return []
	
	var order_types: Array = [
		{"type": "日常保洁", "duration": 60, "difficulty": 1},
		{"type": "深度保洁", "duration": 120, "difficulty": 2},
		{"type": "厨房专项", "duration": 90, "difficulty": 2},
		{"type": "卫生间专项", "duration": 90, "difficulty": 2},
	]
	
	var apartment_list: Array = [
		"A栋-101", "A栋-203", "A栋-305", "A栋-502", "A栋-608",
		"B栋-102", "B栋-204", "B栋-306", "B栋-401", "B栋-503",
		"C栋-101", "C栋-205", "C栋-308", "C栋-402", "C栋-601",
	]
	
	var new_orders: Array = []
	var count: int = level.get("order_count", 5)
	randomize()
	
	for i in range(count):
		var order_type = order_types[randi() % order_types.size()]
		var apartment = apartment_list[randi() % apartment_list.size()]
		var start_hour: int = WORK_START_HOUR + randi() % (WORK_END_HOUR - WORK_START_HOUR - 2)
		var day_offset: int = randi() % 7
		var duration: int = order_type.get("duration", 60)
		
		var order: Dictionary = {
			"id": i + 1,
			"apartment": apartment,
			"order_type": order_type.get("type", "日常保洁"),
			"duration": duration,
			"difficulty": order_type.get("difficulty", 1),
			"preferred_day": day_offset,
			"preferred_start_hour": start_hour,
			"assigned_cleaner": null,
			"assigned_day": null,
			"assigned_start_hour": null,
			"status": "pending",
			"is_rescheduled": false,
			"reschedule_count": 0,
			"conflict_reason": "",
		}
		new_orders.append(order)
	
	orders = new_orders
	return new_orders

func get_levels() -> Array:
	return levels

func get_level_by_id(id: int) -> Dictionary:
	for level in levels:
		if level.get("id") == id:
			return level
	return {}

func get_cleaners_for_level(level_id: int) -> Array:
	var level: Dictionary = get_level_by_id(level_id)
	var count: int = level.get("cleaner_count", 3)
	var result: Array = []
	
	for i in range(min(count, cleaners.size())):
		var cleaner = cleaners[i].duplicate(true)
		result.append(cleaner)
	
	return result

func get_available_slots(day: int, cleaner_id: int) -> Array:
	var cleaner: Dictionary = _get_cleaner_by_id(cleaner_id)
	if cleaner.is_empty():
		return []
	
	var work_days: Array = cleaner.get("work_days", [])
	if not work_days.has(day):
		return []
	
	var slots: Array = []
	for hour in range(WORK_START_HOUR, WORK_END_HOUR):
		slots.append({
			"day": day,
			"start_hour": hour,
			"end_hour": hour + 1,
			"available": true,
		})
	
	for order in orders:
		if order.get("assigned_cleaner") == cleaner_id and order.get("assigned_day") == day:
			var order_start: int = order.get("assigned_start_hour", 0)
			var order_duration_hours: float = float(order.get("duration", 60)) / 60.0
			var order_end: float = float(order_start) + order_duration_hours
			
			for slot in slots:
				var slot_start: int = slot.get("start_hour", 0)
				var slot_end: int = slot.get("end_hour", 0)
				if slot_start < order_end and slot_end > order_start:
					slot["available"] = false
	
	return slots

func assign_order_to_cleaner(order_id: int, cleaner_id: int, day: int, start_hour: int) -> Dictionary:
	var result: Dictionary = {
		"success": false,
		"conflict": false,
		"reason": "",
		"order": null,
	}
	
	var order: Dictionary = _get_order_by_id(order_id)
	if order.is_empty():
		result["reason"] = "订单不存在"
		return result
	
	var cleaner: Dictionary = _get_cleaner_by_id(cleaner_id)
	if cleaner.is_empty():
		result["reason"] = "保洁员不存在"
		return result
	
	var work_days: Array = cleaner.get("work_days", [])
	if not work_days.has(day):
		result["conflict"] = true
		result["reason"] = "该保洁员当日不上班"
		return result
	
	var skills: Array = cleaner.get("skills", [])
	if not skills.has(order.get("order_type", "")):
		result["conflict"] = true
		result["reason"] = "该保洁员不具备此服务类型技能"
		return result
	
	var day_orders: int = _get_cleaner_day_order_count(cleaner_id, day)
	var capacity: int = cleaner.get("capacity", 4)
	if day_orders >= capacity:
		result["conflict"] = true
		result["reason"] = "该保洁员当日订单数已满"
		return result
	
	var order_duration_hours: float = float(order.get("duration", 60)) / 60.0
	var order_end: float = float(start_hour) + order_duration_hours
	
	if order_end > WORK_END_HOUR:
		result["conflict"] = true
		result["reason"] = "订单结束时间超过工作时间"
		return result
	
	for existing_order in orders:
		if existing_order.get("id") == order_id:
			continue
		if existing_order.get("assigned_cleaner") != cleaner_id:
			continue
		if existing_order.get("assigned_day") != day:
			continue
		
		var existing_start: int = existing_order.get("assigned_start_hour", 0)
		var existing_duration_hours: float = float(existing_order.get("duration", 60)) / 60.0
		var existing_end: float = float(existing_start) + existing_duration_hours
		
		if start_hour < existing_end and order_end > existing_start:
			result["conflict"] = true
			result["reason"] = "与现有订单时段冲突"
			return result
	
	order["assigned_cleaner"] = cleaner_id
	order["assigned_day"] = day
	order["assigned_start_hour"] = start_hour
	order["status"] = "assigned"
	order["conflict_reason"] = ""
	
	result["success"] = true
	result["order"] = order
	
	emit_signal("data_updated")
	return result

func unassign_order(order_id: int) -> bool:
	var order: Dictionary = _get_order_by_id(order_id)
	if order.is_empty():
		return false
	
	order["assigned_cleaner"] = null
	order["assigned_day"] = null
	order["assigned_start_hour"] = null
	order["status"] = "pending"
	order["conflict_reason"] = ""
	
	emit_signal("data_updated")
	return true

func reschedule_order(order_id: int, new_day: int, new_start_hour: int) -> Dictionary:
	var order: Dictionary = _get_order_by_id(order_id)
	if order.is_empty():
		return {"success": false, "reason": "订单不存在"}
	
	var cleaner_id: int = order.get("assigned_cleaner", 0)
	if cleaner_id == 0:
		return {"success": false, "reason": "订单未分配"}
	
	var original_day = order.get("assigned_day")
	var original_start_hour = order.get("assigned_start_hour")
	
	order["assigned_day"] = null
	order["assigned_start_hour"] = null
	
	var result: Dictionary = assign_order_to_cleaner(order_id, cleaner_id, new_day, new_start_hour)
	
	if not result.get("success", false):
		order["assigned_day"] = original_day
		order["assigned_start_hour"] = original_start_hour
		return result
	
	order["is_rescheduled"] = true
	order["reschedule_count"] = order.get("reschedule_count", 0) + 1
	
	return result

func check_conflicts() -> Array:
	var conflicts: Array = []
	
	for order in orders:
		if order.get("status") != "assigned":
			continue
		
		var cleaner_id: int = order.get("assigned_cleaner", 0)
		var day: int = order.get("assigned_day", 0)
		var start_hour: int = order.get("assigned_start_hour", 0)
		var duration_hours: float = float(order.get("duration", 60)) / 60.0
		var end_hour: float = float(start_hour) + duration_hours
		
		var cleaner: Dictionary = _get_cleaner_by_id(cleaner_id)
		if cleaner.is_empty():
			continue
		
		var work_days: Array = cleaner.get("work_days", [])
		if not work_days.has(day):
			conflicts.append({
				"order_id": order.get("id"),
				"type": "workday",
				"reason": "保洁员当日不上班",
			})
			continue
		
		var skills: Array = cleaner.get("skills", [])
		if not skills.has(order.get("order_type", "")):
			conflicts.append({
				"order_id": order.get("id"),
				"type": "skill",
				"reason": "保洁员不具备该技能",
			})
			continue
		
		for other_order in orders:
			if other_order.get("id") == order.get("id"):
				continue
			if other_order.get("assigned_cleaner") != cleaner_id:
				continue
			if other_order.get("assigned_day") != day:
				continue
			
			var other_start: int = other_order.get("assigned_start_hour", 0)
			var other_duration: float = float(other_order.get("duration", 60)) / 60.0
			var other_end: float = float(other_start) + other_duration
			
			if start_hour < other_end and end_hour > other_start:
				conflicts.append({
					"order_id": order.get("id"),
					"other_order_id": other_order.get("id"),
					"type": "time_overlap",
					"reason": "时段重叠冲突",
				})
		
		var day_orders: int = _get_cleaner_day_order_count(cleaner_id, day)
		var capacity: int = cleaner.get("capacity", 4)
		if day_orders > capacity:
			conflicts.append({
				"order_id": order.get("id"),
				"type": "capacity",
				"reason": "超出日容量限制",
			})
	
	return conflicts

func calculate_score() -> Dictionary:
	var total_orders: int = orders.size()
	var assigned_orders: int = 0
	var conflicted_orders: int = 0
	var on_time_orders: int = 0
	var rescheduled_orders: int = 0
	
	var conflicts: Array = check_conflicts()
	var conflict_order_ids: Array = []
	for conflict in conflicts:
		if not conflict_order_ids.has(conflict.get("order_id")):
			conflict_order_ids.append(conflict.get("order_id"))
	
	for order in orders:
		if order.get("status") == "assigned":
			assigned_orders += 1
			if order.get("is_rescheduled", false):
				rescheduled_orders += 1
			
			var preferred_day = order.get("preferred_day")
			var assigned_day = order.get("assigned_day")
			var preferred_start = order.get("preferred_start_hour")
			var assigned_start = order.get("assigned_start_hour")
			
			if preferred_day == assigned_day and abs(preferred_start - assigned_start) <= 1:
				on_time_orders += 1
	
	var assignment_rate: float = 0.0
	if total_orders > 0:
		assignment_rate = float(assigned_orders) / float(total_orders) * 100.0
	
	var conflict_rate: float = 0.0
	if assigned_orders > 0:
		conflict_rate = float(conflict_order_ids.size()) / float(assigned_orders) * 100.0
	
	var on_time_rate: float = 0.0
	if assigned_orders > 0:
		on_time_rate = float(on_time_orders) / float(assigned_orders) * 100.0
	
	var attendance_rate: float = float(assigned_orders - conflict_order_ids.size()) / float(total_orders) * 100.0
	
	var score: float = assignment_rate * 0.4 + on_time_rate * 0.3 - conflict_rate * 0.5 + (100.0 - float(rescheduled_orders) * 5.0) * 0.3
	score = clamp(score, 0.0, 100.0)
	
	return {
		"total_orders": total_orders,
		"assigned_orders": assigned_orders,
		"conflicted_orders": conflict_order_ids.size(),
		"on_time_orders": on_time_orders,
		"rescheduled_orders": rescheduled_orders,
		"assignment_rate": assignment_rate,
		"conflict_rate": conflict_rate,
		"on_time_rate": on_time_rate,
		"attendance_rate": attendance_rate,
		"score": score,
	}

func _get_order_by_id(id: int) -> Dictionary:
	for order in orders:
		if order.get("id") == id:
			return order
	return {}

func _get_cleaner_by_id(id: int) -> Dictionary:
	for cleaner in cleaners:
		if cleaner.get("id") == id:
			return cleaner
	return {}

func _get_cleaner_day_order_count(cleaner_id: int, day: int) -> int:
	var count: int = 0
	for order in orders:
		if order.get("assigned_cleaner") == cleaner_id and order.get("assigned_day") == day:
			count += 1
	return count

func get_orders() -> Array:
	return orders

func get_cleaners() -> Array:
	return cleaners

func set_current_level(level_id: int) -> void:
	current_level = get_level_by_id(level_id)

func get_current_level() -> Dictionary:
	return current_level
