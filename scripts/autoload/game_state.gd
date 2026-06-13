extends Node

enum State { MENU, PLAYING, PAUSED, RESULT }

var current_state: int = State.MENU
var current_difficulty: String = "normal"

var score: int = 0
var combo: int = 0
var max_combo: int = 0
var start_time: float = 0
var elapsed_time: float = 0
var pause_time: float = 0

var customers_served: int = 0
var customers_total: int = 0
var projects_completed: int = 0
var projects_failed: int = 0

var customer_queue: Array = []
var active_projects: Array = []
var recharge_history: Array = []
var review_tags: Dictionary = {}

var supplies: Dictionary = {}
var supply_warnings: Dictionary = {}
var active_anomalies: Array = []

var achievements: Dictionary = {}
var unlocked_achievements: Array = []

var stuck_points: Array = []
var last_action_time: float = 0
var stuck_threshold: float = 8.0

var items: Dictionary = {}
var item_cooldowns: Dictionary = {}

var current_level: int = 1

func _ready() -> void:
	_init_supplies()
	_init_items()
	_init_achievements()

func _init_supplies() -> void:
	supplies = {
		"shampoo": {"name": "洗发水", "stock": 100, "max_stock": 100, "consumption_rate": 2},
		"conditioner": {"name": "护发素", "stock": 100, "max_stock": 100, "consumption_rate": 1.5},
		"hair_color": {"name": "染发剂", "stock": 50, "max_stock": 50, "consumption_rate": 3},
		"perm_solution": {"name": "烫发液", "stock": 30, "max_stock": 30, "consumption_rate": 2.5}
	}

func _init_items() -> void:
	items = {
		"speed_boost": {"name": "加速药水", "cooldown": 30, "duration": 10, "icon": "⚡"},
		"supply_refill": {"name": "紧急补货", "cooldown": 45, "amount": 30, "icon": "📦"},
		"charm": {"name": "魅力加成", "cooldown": 60, "duration": 15, "icon": "✨"},
		"time_freeze": {"name": "时间冻结", "cooldown": 90, "duration": 5, "icon": "❄️"}
	}
	for item_id in items.keys():
		item_cooldowns[item_id] = 0

func _init_achievements() -> void:
	achievements = {
		"first_customer": {"name": "初次见面", "desc": "服务第一位顾客", "unlocked": false},
		"combo_5": {"name": "得心应手", "desc": "达成5连击", "unlocked": false},
		"combo_10": {"name": "游刃有余", "desc": "达成10连击", "unlocked": false},
		"perfect_round": {"name": "完美一局", "desc": "无失误完成一局", "unlocked": false},
		"anomaly_handler": {"name": "应急专家", "desc": "成功处理5次耗材异常", "unlocked": false},
		"high_score": {"name": "业绩冠军", "desc": "单局得分超过5000", "unlocked": false},
		"speed_demon": {"name": "闪电手速", "desc": "在60秒内完成10个项目", "unlocked": false}
	}

func start_game(difficulty: String = "normal") -> void:
	current_state = State.PLAYING
	current_difficulty = difficulty
	score = 0
	combo = 0
	max_combo = 0
	start_time = Time.get_ticks_msec() / 1000.0
	elapsed_time = 0
	pause_time = 0
	customers_served = 0
	customers_total = 0
	projects_completed = 0
	projects_failed = 0
	customer_queue.clear()
	active_projects.clear()
	recharge_history.clear()
	review_tags.clear()
	stuck_points.clear()
	last_action_time = Time.get_ticks_msec() / 1000.0
	active_anomalies.clear()
	supply_warnings.clear()
	current_level = 1
	_init_supplies()
	_init_items()
	EventBus.emit_game_started(difficulty)

func pause_game() -> void:
	if current_state == State.PLAYING:
		current_state = State.PAUSED
		pause_time = Time.get_ticks_msec() / 1000.0
		EventBus.game_paused.emit()

func resume_game() -> void:
	if current_state == State.PAUSED:
		var paused_duration = Time.get_ticks_msec() / 1000.0 - pause_time
		start_time += paused_duration
		last_action_time += paused_duration
		current_state = State.PLAYING
		EventBus.game_resumed.emit()

func end_game(success: bool) -> void:
	current_state = State.RESULT
	elapsed_time = Time.get_ticks_msec() / 1000.0 - start_time
	
	var result_data = {
		"success": success,
		"score": score,
		"max_combo": max_combo,
		"elapsed_time": elapsed_time,
		"customers_served": customers_served,
		"customers_total": customers_total,
		"projects_completed": projects_completed,
		"projects_failed": projects_failed,
		"completion_rate": float(projects_completed) / max(1, projects_completed + projects_failed),
		"stuck_points": stuck_points,
		"unlocked_achievements": unlocked_achievements.duplicate()
	}
	EventBus.emit_game_ended(result_data)

func add_score(amount: int) -> void:
	score += amount
	if combo > max_combo:
		max_combo = combo

func add_combo() -> void:
	combo += 1
	if combo > max_combo:
		max_combo = combo
	_check_combo_achievements()

func reset_combo() -> void:
	combo = 0

func register_action() -> void:
	var now = Time.get_ticks_msec() / 1000.0
	var time_since_last = now - last_action_time
	if time_since_last > stuck_threshold:
		stuck_points.append({
			"time": elapsed_time,
			"duration": time_since_last,
			"customers_waiting": customer_queue.size()
		})
	last_action_time = now

func consume_supply(supply_type: String, amount: float) -> bool:
	if supply_type in supplies:
		var supply = supplies[supply_type]
		if supply["stock"] >= amount:
			supply["stock"] -= amount
			return true
	return false

func refill_supply(supply_type: String, amount: float) -> void:
	if supply_type in supplies:
		var supply = supplies[supply_type]
		supply["stock"] = min(supply["max_stock"], supply["stock"] + amount)

func get_supply_stock(supply_type: String) -> float:
	if supply_type in supplies:
		return supplies[supply_type]["stock"]
	return 0

func unlock_achievement(achievement_id: String) -> void:
	if achievement_id in achievements and not achievements[achievement_id]["unlocked"]:
		achievements[achievement_id]["unlocked"] = true
		unlocked_achievements.append(achievement_id)
		EventBus.achievement_unlocked.emit(achievement_id)
		EventBus.emit_analytics("achievement_unlocked", {"id": achievement_id})

func _check_combo_achievements() -> void:
	if combo >= 5:
		unlock_achievement("combo_5")
	if combo >= 10:
		unlock_achievement("combo_10")

func update_item_cooldowns(delta: float) -> void:
	for item_id in item_cooldowns.keys():
		if item_cooldowns[item_id] > 0:
			item_cooldowns[item_id] = max(0, item_cooldowns[item_id] - delta)

func can_use_item(item_id: String) -> bool:
	return item_id in item_cooldowns and item_cooldowns[item_id] <= 0

func use_item(item_id: String) -> bool:
	if not can_use_item(item_id):
		return false
	if item_id in items:
		item_cooldowns[item_id] = items[item_id]["cooldown"]
		EventBus.item_used.emit(item_id, items[item_id]["cooldown"])
		EventBus.emit_analytics("item_used", {"id": item_id})
		return true
	return false

func add_customer(customer_data: Dictionary) -> void:
	customer_queue.append(customer_data)
	customers_total += 1
	EventBus.emit_customer_added(customer_data)

func remove_customer(customer_id: String) -> void:
	for i in range(customer_queue.size()):
		if customer_queue[i].get("id", "") == customer_id:
			customer_queue.remove_at(i)
			break
