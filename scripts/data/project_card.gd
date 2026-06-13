class_name ProjectCard

var id: String
var name: String
var type: String
var duration: float
var remaining_time: float
var base_score: int
var supplies_needed: Dictionary
var difficulty: int
var is_active: bool
var is_completed: bool
var is_failed: bool
var fail_reason: String
var customer_id: String
var progress: float

func _init(p_name: String = "", p_type: String = "normal") -> void:
	id = "project_" + str(Time.get_ticks_msec()) + "_" + str(randi())
	name = p_name
	type = p_type
	duration = 30.0
	remaining_time = 30.0
	base_score = 100
	supplies_needed = {}
	difficulty = 1
	is_active = false
	is_completed = false
	is_failed = false
	fail_reason = ""
	customer_id = ""
	progress = 0.0
	_setup_by_type()

func _setup_by_type() -> void:
	match type:
		"洗剪吹":
			name = "洗剪吹"
			duration = 20.0
			remaining_time = 20.0
			base_score = 80
			supplies_needed = {"shampoo": 5, "conditioner": 3}
			difficulty = 1
		"洗吹造型":
			name = "洗吹造型"
			duration = 25.0
			remaining_time = 25.0
			base_score = 100
			supplies_needed = {"shampoo": 4, "conditioner": 2}
			difficulty = 1
		"染发":
			name = "染发"
			duration = 60.0
			remaining_time = 60.0
			base_score = 250
			supplies_needed = {"shampoo": 3, "hair_color": 10}
			difficulty = 2
		"烫发":
			name = "烫发"
			duration = 90.0
			remaining_time = 90.0
			base_score = 350
			supplies_needed = {"perm_solution": 8, "conditioner": 5}
			difficulty = 3
		"护理":
			name = "护理"
			duration = 45.0
			remaining_time = 45.0
			base_score = 180
			supplies_needed = {"conditioner": 10, "treatment": 5}
			difficulty = 2
		_:
			name = "基础服务"
			duration = 30.0
			remaining_time = 30.0
			base_score = 100
			supplies_needed = {}
			difficulty = 1

func start() -> void:
	is_active = true
	is_completed = false
	is_failed = false
	progress = 0.0
	remaining_time = duration * DifficultyConfig.get_project_time_multiplier()

func update(delta: float) -> void:
	if not is_active or is_completed or is_failed:
		return
	remaining_time -= delta
	progress = 1.0 - (remaining_time / (duration * DifficultyConfig.get_project_time_multiplier()))
	if remaining_time <= 0:
		complete()

func complete() -> void:
	is_active = false
	is_completed = true
	remaining_time = 0
	progress = 1.0
	EventBus.emit_project_completed(to_dict(), true)

func fail(reason: String) -> void:
	is_active = false
	is_failed = true
	fail_reason = reason
	EventBus.project_failed.emit(to_dict(), reason)

func get_progress() -> float:
	return progress

func get_score_with_combo(combo: int) -> int:
	var combo_bonus = 1.0 + (combo * 0.1) * DifficultyConfig.get_combo_bonus_multiplier()
	return int(base_score * combo_bonus)

func check_supplies() -> bool:
	for supply_type in supplies_needed.keys():
		var needed = supplies_needed[supply_type] * DifficultyConfig.get_supply_consumption_multiplier()
		if GameState.get_supply_stock(supply_type) < needed:
			return false
	return true

func consume_supplies() -> void:
	for supply_type in supplies_needed.keys():
		var needed = supplies_needed[supply_type] * DifficultyConfig.get_supply_consumption_multiplier()
		GameState.consume_supply(supply_type, needed)

func to_dict() -> Dictionary:
	return {
		"id": id,
		"name": name,
		"type": type,
		"duration": duration,
		"remaining_time": remaining_time,
		"base_score": base_score,
		"supplies_needed": supplies_needed.duplicate(),
		"difficulty": difficulty,
		"is_active": is_active,
		"is_completed": is_completed,
		"is_failed": is_failed,
		"fail_reason": fail_reason,
		"customer_id": customer_id,
		"progress": progress
	}

static func from_dict(data: Dictionary) -> ProjectCard:
	var project = ProjectCard.new(data.get("name", ""), data.get("type", "normal"))
	project.id = data.get("id", project.id)
	project.duration = data.get("duration", project.duration)
	project.remaining_time = data.get("remaining_time", project.remaining_time)
	project.base_score = data.get("base_score", project.base_score)
	project.supplies_needed = data.get("supplies_needed", project.supplies_needed)
	project.difficulty = data.get("difficulty", project.difficulty)
	project.is_active = data.get("is_active", false)
	project.is_completed = data.get("is_completed", false)
	project.is_failed = data.get("is_failed", false)
	project.fail_reason = data.get("fail_reason", "")
	project.customer_id = data.get("customer_id", "")
	project.progress = data.get("progress", 0.0)
	return project
