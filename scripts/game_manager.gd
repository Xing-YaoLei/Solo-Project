extends Node

signal game_started(level_data)
signal game_completed(result)
signal task_completed(task_result)
signal timer_updated(time_remaining)

var current_level: Dictionary = null
var current_task_index: int = 0
var completed_tasks: Array = []
var correct_tasks: int = 0
var total_tasks: int = 0
var score: int = 0
var time_elapsed: float = 0.0
var time_remaining: float = 0.0
var is_paused: bool = false
var is_game_active: bool = false
var verification_records: Array = []
var selected_package = null
var selected_date = null
var selected_stay_days: int = 1
var selected_guest_count: int = 2
var combo_count: int = 0
var max_combo: int = 0

func start_game(level_id: String):
	var level = GameData.get_level(level_id)
	if not level:
		return false
	
	current_level = level
	current_task_index = 0
	completed_tasks = []
	correct_tasks = 0
	total_tasks = len(level.tasks)
	score = 0
	time_elapsed = 0.0
	time_remaining = level.time_limit
	is_paused = false
	is_game_active = true
	verification_records = []
	combo_count = 0
	max_combo = 0
	selected_package = null
	selected_date = null
	selected_stay_days = 1
	selected_guest_count = 2
	
	if level.tasks.is_empty():
		_generate_random_tasks(level)
		total_tasks = len(level.tasks)
	
	game_started.emit(level)
	return true

func _generate_random_tasks(level):
	var packages = level.packages
	var rules = _get_active_rules(level)
	var dates = GameData.generate_dates_for_month(2026, 7)
	
	var task_count = level.target_sales
	for i in range(task_count):
		var pkg_id = packages[randi() % len(packages)]
		var pkg = GameData.get_package(pkg_id)
		var date = dates[randi() % len(dates)]
		var stay_days = randi() % 5 + 1
		var guests = randi() % pkg.max_guests + 1
		
		var price_result = GameData.calculate_price(pkg, date.date, stay_days, guests, rules)
		
		var task = GameData.Task.new(
			"gen_t_%d" % i,
			"顾客预订%s入住%s%s晚" % [date.date, pkg.name, stay_days],
			pkg.type,
			date.date,
			stay_days,
			guests,
			price_result["final_price"],
			""
		)
		level.tasks.append(task)

func _get_active_rules(level) -> Array:
	var rules: Array = []
	for rule_id in level.rules:
		var rule = GameData.get_rule(rule_id)
		if rule:
			rules.append(rule)
	return rules

func get_current_task():
	if not current_level or current_task_index >= len(current_level.tasks):
		return null
	return current_level.tasks[current_task_index]

func select_package(package_id: String):
	selected_package = GameData.get_package(package_id)
	if selected_package:
		selected_guest_count = min(selected_guest_count, selected_package.max_guests)
	GameData.package_selected.emit(selected_package)
	return selected_package != null

func select_date(date_str: String):
	var dates = GameData.generate_dates_for_month(2026, 7)
	for d in dates:
		if d.date == date_str:
			selected_date = d
			GameData.date_selected.emit(d)
			return true
	return false

func set_stay_days(days: int):
	if current_level:
		selected_stay_days = clamp(days, 1, 30)
	return selected_stay_days

func set_guest_count(count: int):
	if selected_package:
		selected_guest_count = clamp(count, 1, selected_package.max_guests)
	else:
		selected_guest_count = clamp(count, 1, 4)
	return selected_guest_count

func submit_selection() -> Dictionary:
	var result = {
		"success": false,
		"is_correct": false,
		"message": "",
		"expected_price": 0.0,
		"calculated_price": 0.0,
		"score_gained": 0,
		"applied_rules": []
	}
	
	if not selected_package or not selected_date:
		result["message"] = "请先选择套餐和日期"
		return result
	
	var task = get_current_task()
	if not task:
		result["message"] = "没有待处理的任务"
		return result
	
	var rules = _get_active_rules(current_level)
	var price_result = GameData.calculate_price(selected_package, selected_date.date, selected_stay_days, selected_guest_count, rules)
	
	var calculated_price = price_result["final_price"]
	var expected_price = task.expected_price
	var is_correct = abs(calculated_price - expected_price) < 0.01
	
	result["success"] = true
	result["is_correct"] = is_correct
	result["calculated_price"] = calculated_price
	result["expected_price"] = expected_price
	result["applied_rules"] = price_result["applied_rules"]
	
	if is_correct:
		combo_count += 1
		max_combo = max(max_combo, combo_count)
		correct_tasks += 1
		
		var base_score = 100
		var combo_bonus = combo_count * 10
		var time_bonus = int(time_remaining / 10)
		var score_gained = base_score + combo_bonus + time_bonus
		score += score_gained
		result["score_gained"] = score_gained
		result["message"] = "正确！+%d分" % score_gained
		
		if combo_count >= 3:
			result["message"] += " 连击x%d！" % combo_count
	else:
		combo_count = 0
		result["message"] = "错误！正确价格：¥%.2f，你的计算：¥%.2f" % [expected_price, calculated_price]
	
	var record = GameData.VerificationRecord.new(
		"rec_%d_%d" % [Time.get_unix_time_from_system(), current_task_index],
		selected_package.id,
		selected_date.date,
		_add_days(selected_date.date, selected_stay_days),
		selected_guest_count,
		price_result["base_price"],
		calculated_price,
		price_result["applied_rules"],
		is_correct,
		expected_price
	)
	verification_records.append(record)
	completed_tasks.append(result)
	
	GameData.verification_completed.emit(result)
	task_completed.emit(result)
	
	current_task_index += 1
	selected_package = null
	selected_date = null
	
	if current_task_index >= total_tasks:
		_end_game()
	
	return result

func _add_days(date_str: String, days: int) -> String:
	var year = date_str.substr(0, 4).to_int()
	var month = date_str.substr(5, 2).to_int()
	var day = date_str.substr(8, 2).to_int()
	var days_in_month = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
	if year % 4 == 0 and (year % 100 != 0 or year % 400 == 0):
		days_in_month[1] = 29
	
	day += days
	while day > days_in_month[month - 1]:
		day -= days_in_month[month - 1]
		month += 1
		if month > 12:
			month = 1
			year += 1
	
	return "%04d-%02d-%02d" % [year, month, day]

func pause_game():
	is_paused = true

func resume_game():
	is_paused = false

func _end_game():
	is_game_active = false
	
	var conversion_rate = float(correct_tasks) / float(max(1, total_tasks))
	var time_taken = current_level.time_limit - time_remaining
	
	var result = {
		"level_id": current_level.id,
		"level_name": current_level.name,
		"score": score,
		"correct_tasks": correct_tasks,
		"total_tasks": total_tasks,
		"conversion_rate": conversion_rate,
		"time_taken": time_taken,
		"time_limit": current_level.time_limit,
		"max_combo": max_combo,
		"passed": conversion_rate >= current_level.target_conversion_rate,
		"verification_records": verification_records
	}
	
	game_completed.emit(result)
	LeaderboardManager.add_score(result)

func get_progress() -> Dictionary:
	return {
		"current_task": current_task_index + 1,
		"total_tasks": total_tasks,
		"correct_tasks": correct_tasks,
		"score": score,
		"combo": combo_count,
		"conversion_rate": float(correct_tasks) / float(max(1, current_task_index))
	}

func update(delta: float):
	if is_game_active and not is_paused:
		time_elapsed += delta
		time_remaining -= delta
		timer_updated.emit(time_remaining)
		
		if time_remaining <= 0:
			time_remaining = 0
			_end_game()

func _process(delta: float):
	update(delta)

func get_current_preview() -> Dictionary:
	if not selected_package or not selected_date:
		return {"valid": false, "message": "请选择套餐和日期"}
	
	var rules = _get_active_rules(current_level)
	var result = GameData.calculate_price(selected_package, selected_date.date, selected_stay_days, selected_guest_count, rules)
	result["valid"] = true
	result["package_name"] = selected_package.name
	result["date"] = selected_date.date
	result["stay_days"] = selected_stay_days
	result["guest_count"] = selected_guest_count
	return result
