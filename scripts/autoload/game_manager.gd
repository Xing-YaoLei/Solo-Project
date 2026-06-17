extends Node

signal game_state_changed
signal task_completed(correct: bool, score_gain: int)
signal game_over(win: bool, stats: Dictionary)

const TASK_TYPES := {
	"WATER_METER": "水电读数",
	"APPROVAL": "审批意见",
	"HOUSE_ARCHIVE": "房屋档案"
}

const LEVELS := [
	{
		"id": "level_1",
		"name": "新手入门",
		"description": "熟悉基本的备案流程",
		"time_limit": 60,
		"task_count": 8,
		"difficulty": 1,
		"task_types": ["WATER_METER", "APPROVAL"]
	},
	{
		"id": "level_2",
		"name": "日常值班",
		"description": "处理多种类型的备案申请",
		"time_limit": 90,
		"task_count": 15,
		"difficulty": 2,
		"task_types": ["WATER_METER", "APPROVAL", "HOUSE_ARCHIVE"]
	},
	{
		"id": "level_3",
		"name": "繁忙时段",
		"description": "高压下保持准确率",
		"time_limit": 120,
		"task_count": 25,
		"difficulty": 3,
		"task_types": ["WATER_METER", "APPROVAL", "HOUSE_ARCHIVE"]
	},
	{
		"id": "level_4",
		"name": "专家挑战",
		"description": "极致速度与精准",
		"time_limit": 90,
		"task_count": 30,
		"difficulty": 4,
		"task_types": ["WATER_METER", "APPROVAL", "HOUSE_ARCHIVE"]
	}
]

var current_level: Dictionary = {}
var current_task_index: int = 0
var tasks: Array = []
var score: int = 0
var combo: int = 0
var max_combo: int = 0
var correct_count: int = 0
var wrong_count: int = 0
var time_remaining: float = 0.0
var is_playing: bool = false
var is_paused: bool = false

func _ready() -> void:
	randomize()

func get_levels() -> Array:
	return LEVELS

func get_level_by_id(level_id: String) -> Dictionary:
	for level in LEVELS:
		if level.id == level_id:
			return level
	return {}

func start_game(level_id: String) -> void:
	current_level = get_level_by_id(level_id)
	if current_level.is_empty():
		return
	
	current_task_index = 0
	score = 0
	combo = 0
	max_combo = 0
	correct_count = 0
	wrong_count = 0
	time_remaining = current_level.time_limit
	is_playing = true
	is_paused = false
	tasks = _generate_tasks(current_level)
	
	game_state_changed.emit()

func _generate_tasks(level: Dictionary) -> Array:
	var result: Array = []
	var task_types: Array = level.task_types
	var difficulty: int = level.difficulty
	
	for i in range(level.task_count):
		var task_type = task_types[i % task_types.size()]
		var task = _create_task(task_type, difficulty)
		task["index"] = i
		result.append(task)
	
	return result

func _create_task(task_type: String, difficulty: int) -> Dictionary:
	match task_type:
		"WATER_METER":
			return _create_water_meter_task(difficulty)
		"APPROVAL":
			return _create_approval_task(difficulty)
		"HOUSE_ARCHIVE":
			return _create_house_archive_task(difficulty)
		_:
			return {}

func _create_water_meter_task(difficulty: int) -> Dictionary:
	var house_numbers := ["101", "102", "103", "201", "202", "203", "301", "302", "303"]
	var house = house_numbers[randi() % house_numbers.size()]
	
	var base_water = randi() % 500 + 100
	var base_electric = randi() % 1000 + 200
	
	var variances := [
		{"water_var": 0, "electric_var": 0, "is_normal": true},
		{"water_var": randi() % 20 + 5, "electric_var": 0, "is_normal": false},
		{"water_var": 0, "electric_var": randi() % 50 + 10, "is_normal": false},
		{"water_var": -(randi() % 20 + 5), "electric_var": 0, "is_normal": false}
	]
	
	var variance = variances[randi() % variances.size()]
	var reported_water = base_water + variance.water_var
	var reported_electric = base_electric + variance.electric_var
	
	var options := [
		{"text": "读数正常，通过", "is_correct": variance.is_normal},
		{"text": "水电异常，驳回", "is_correct": not variance.is_normal}
	]
	if randi() % 2 == 0:
		options.reverse()
	
	return {
		"type": "WATER_METER",
		"title": "水电读数核对",
		"house_number": house + "室",
		"last_water_reading": base_water,
		"current_water_reading": reported_water,
		"last_electric_reading": base_electric,
		"current_electric_reading": reported_electric,
		"description": "核对租户申报的水电读数是否正常",
		"options": options,
		"hint": "水表波动正常范围 ±20 吨，电表波动正常范围 ±50 度",
		"time_bonus": 100
	}

func _create_approval_task(difficulty: int) -> Dictionary:
	var applicants := ["张三", "李四", "王五", "赵六", "陈七", "刘八"]
	var applicant = applicants[randi() % applicants.size()]
	
	var approval_items := [
		{"item": "墙面刷漆", "needs_permit": true, "has_permit": true, "fee": 500},
		{"item": "地砖铺设", "needs_permit": true, "has_permit": true, "fee": 800},
		{"item": "水电改造", "needs_permit": true, "has_permit": false, "fee": 1200},
		{"item": "更换门窗", "needs_permit": true, "has_permit": false, "fee": 2000},
		{"item": "室内吊顶", "needs_permit": true, "has_permit": true, "fee": 600},
		{"item": "家具摆放", "needs_permit": false, "has_permit": false, "fee": 0}
	]
	
	var item_data = approval_items[randi() % approval_items.size()]
	var has_fee = randi() % 3 != 0
	var deposit_paid = randi() % 2 == 0
	
	var can_approve = item_data.needs_permit == item_data.has_permit and (not item_data.needs_permit or deposit_paid)
	
	var options := [
		{"text": "批准装修", "is_correct": can_approve},
		{"text": "退回补件", "is_correct": not can_approve}
	]
	if randi() % 2 == 0:
		options.reverse()
	
	var reasons: Array = []
	if item_data.needs_permit and not item_data.has_permit:
		reasons.append("缺少装修许可证")
	if item_data.needs_permit and not deposit_paid:
		reasons.append("未缴纳装修押金")
	if reasons.is_empty():
		reasons.append("材料齐全，符合要求")
	
	return {
		"type": "APPROVAL",
		"title": "装修审批",
		"applicant": applicant,
		"decoration_item": item_data.item,
		"has_permit": item_data.has_permit,
		"needs_permit": item_data.needs_permit,
		"deposit_paid": deposit_paid,
		"deposit_fee": item_data.fee,
		"reasons": reasons,
		"description": "审核装修申请材料是否齐全",
		"options": options,
		"hint": "需要许可证的项目必须提供许可证并缴纳押金",
		"time_bonus": 120
	}

func _create_house_archive_task(difficulty: int) -> Dictionary:
	var archive_data := [
		{"house": "1栋101", "owner": "王先生", "area": 85, "decoration_record": true, "last_check": "2024-01-15"},
		{"house": "1栋202", "owner": "李女士", "area": 102, "decoration_record": false, "last_check": "2023-11-20"},
		{"house": "2栋303", "owner": "张先生", "area": 120, "decoration_record": true, "last_check": "2024-02-10"},
		{"house": "2栋401", "owner": "刘女士", "area": 95, "decoration_record": false, "last_check": "2023-09-05"},
		{"house": "3栋502", "owner": "陈先生", "area": 110, "decoration_record": true, "last_check": "2024-03-01"}
	]
	
	var archive = archive_data[randi() % archive_data.size()]
	var query_type = randi() % 3
	
	var is_match = true
	var display_archive = archive.duplicate()
	
	match query_type:
		0:
			is_match = randi() % 2 == 0
			if not is_match:
				display_archive.owner = "未知业主" if randi() % 2 == 0 else "错误业主"
		1:
			is_match = randi() % 2 == 0
			if not is_match:
				display_archive.area = archive.area + (randi() % 30 + 10)
		2:
			is_match = randi() % 2 == 0
			if not is_match:
				display_archive.decoration_record = not archive.decoration_record
	
	var options := [
		{"text": "档案一致", "is_correct": is_match},
		{"text": "档案不符", "is_correct": not is_match}
	]
	if randi() % 2 == 0:
		options.reverse()
	
	return {
		"type": "HOUSE_ARCHIVE",
		"title": "房屋档案核对",
		"house_number": display_archive.house,
		"display_owner": display_archive.owner,
		"actual_owner": archive.owner,
		"display_area": display_archive.area,
		"actual_area": archive.area,
		"display_has_decoration": display_archive.decoration_record,
		"actual_has_decoration": archive.decoration_record,
		"last_check_date": archive.last_check,
		"description": "核对租户提供的房屋信息与档案是否一致",
		"options": options,
		"hint": "仔细核对业主姓名、房屋面积和装修记录",
		"time_bonus": 150
	}

func get_current_task() -> Dictionary:
	if current_task_index < tasks.size():
		return tasks[current_task_index]
	return {}

func submit_answer(selected_option_index: int) -> void:
	if not is_playing or is_paused:
		return
	
	var task = get_current_task()
	if task.is_empty():
		return
	
	var option = task.options[selected_option_index]
	var is_correct = option.is_correct
	
	var score_gain = 0
	if is_correct:
		correct_count += 1
		combo += 1
		if combo > max_combo:
			max_combo = combo
		
		var base_score = 100
		var combo_bonus = combo * 10
		var time_bonus = int(time_remaining * 2)
		score_gain = base_score + combo_bonus + time_bonus
		score += score_gain
		
		AudioManager.play_correct_sfx()
	else:
		wrong_count += 1
		combo = 0
		score = max(0, score - 50)
		
		AudioManager.play_wrong_sfx()
		AudioManager.vibrate(0.5)
	
	task_completed.emit(is_correct, score_gain)
	
	current_task_index += 1
	game_state_changed.emit()
	
	if current_task_index >= tasks.size():
		_end_game(true)

func _end_game(completed: bool) -> void:
	is_playing = false
	
	var total_tasks = tasks.size()
	var accuracy = 0.0
	if total_tasks > 0:
		accuracy = float(correct_count) / float(total_tasks)
	
	var satisfaction = _calculate_satisfaction(accuracy, score, max_combo, completed)
	
	var stats := {
		"score": score,
		"correct_count": correct_count,
		"wrong_count": wrong_count,
		"total_tasks": total_tasks,
		"accuracy": accuracy,
		"combo": max_combo,
		"satisfaction": satisfaction,
		"completed": completed,
		"time_used": current_level.time_limit - time_remaining
	}
	
	StatsManager.record_level_result(
		current_level.id,
		score,
		accuracy,
		satisfaction,
		max_combo
	)
	
	game_over.emit(completed, stats)

func _calculate_satisfaction(accuracy: float, score: int, max_combo: int, completed: bool) -> int:
	var satisfaction = 0
	
	if not completed:
		satisfaction = int(accuracy * 40)
		return satisfaction
	
	satisfaction = 30
	satisfaction += int(accuracy * 30)
	satisfaction += min(20, int(score / 500))
	satisfaction += min(20, max_combo * 2)
	
	return min(100, satisfaction)

func update_timer(delta: float) -> void:
	if not is_playing or is_paused:
		return
	
	time_remaining -= delta
	if time_remaining <= 0:
		time_remaining = 0
		_end_game(false)
	
	game_state_changed.emit()

func pause_game() -> void:
	if is_playing and not is_paused:
		is_paused = true
		game_state_changed.emit()

func resume_game() -> void:
	if is_playing and is_paused:
		is_paused = false
		game_state_changed.emit()

func restart_level() -> void:
	if not current_level.is_empty():
		start_game(current_level.id)
