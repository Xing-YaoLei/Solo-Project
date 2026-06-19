extends Node

signal game_started()
signal game_paused()
signal game_resumed()
signal game_ended(p_result: Dictionary)
signal work_order_added(p_order: WorkOrder)
signal work_order_completed(p_order: WorkOrder, p_success: bool, p_is_perfect: bool)
signal part_consumed(p_part: Part, p_quantity: int)
signal quote_created(p_quote: Quote)
signal quote_approved(p_quote: Quote)
signal quote_rejected(p_quote: Quote)
signal result_shown(p_result: Dictionary)

enum GameMode { TRAINING, FREE_PLAY }
enum GameState { MENU, PLAYING, PAUSED, GAME_OVER }

var game_mode: GameMode = GameMode.FREE_PLAY
var game_state: GameState = GameState.MENU
var current_level: TrainingLevel
var player_data: PlayerData

var work_orders: Dictionary = {}
var parts_inventory: Dictionary = {}
var quotes: Dictionary = {}

var game_start_time: float
var game_time_limit: float = 600.0
var session_completed_orders: int = 0
var session_failed_orders: int = 0
var session_repair_orders: int = 0
var session_score: int = 0
var session_earnings: float = 0.0

var order_spawn_interval: float = 15.0
var max_active_orders: int = 8
var next_order_id: int = 1

var vehicle_models := ["大众帕萨特", "丰田凯美瑞", "本田雅阁", "日产天籁", "别克君威", "奥迪A4", "宝马3系", "奔驰C级", "比亚迪汉", "特斯拉Model 3"]
var customer_names := ["张先生", "李女士", "王总", "刘经理", "陈师傅", "杨小姐", "黄先生", "周女士", "吴老板", "郑主管"]
var service_types := ["常规保养", "机油更换", "轮胎更换", "刹车检修", "发动机检修", "变速箱维护", "空调检修", "电路检测", "底盘检查", "蓄电池更换"]

func _ready():
	player_data = PlayerData.new("维修技师")
	_initialize_parts_inventory()
	load_player_data()

func _initialize_parts_inventory() -> void:
	var parts_data = [
		["oil_001", "全合成机油 5W-30", Part.Category.FLUIDS, 50, 10, 100, 68.0],
		["oil_002", "变速箱油 ATF", Part.Category.FLUIDS, 30, 5, 60, 85.0],
		["oil_003", "刹车油 DOT4", Part.Category.FLUIDS, 40, 8, 80, 45.0],
		["filter_001", "机油滤清器", Part.Category.FILTERS, 80, 15, 150, 25.0],
		["filter_002", "空气滤清器", Part.Category.FILTERS, 60, 10, 120, 35.0],
		["filter_003", "空调滤清器", Part.Category.FILTERS, 70, 12, 140, 40.0],
		["brake_001", "前刹车片", Part.Category.BRAKES, 25, 5, 50, 280.0],
		["brake_002", "后刹车片", Part.Category.BRAKES, 25, 5, 50, 260.0],
		["brake_003", "刹车盘", Part.Category.BRAKES, 15, 3, 30, 450.0],
		["tire_001", "四季轮胎 225/55R17", Part.Category.TIRES, 20, 4, 40, 580.0],
		["tire_002", "冬季轮胎 225/55R17", Part.Category.TIRES, 15, 3, 30, 650.0],
		["engine_001", "火花塞套装", Part.Category.ENGINE, 30, 6, 60, 120.0],
		["engine_002", "正时皮带", Part.Category.ENGINE, 10, 2, 20, 380.0],
		["electrical_001", "蓄电池 60Ah", Part.Category.ELECTRICAL, 15, 3, 30, 520.0],
		["electrical_002", "发电机皮带", Part.Category.ELECTRICAL, 20, 4, 40, 150.0],
		["suspension_001", "减震器", Part.Category.SUSPENSION, 12, 2, 24, 420.0]
	]

	for data in parts_data:
		var part = Part.new(data[0], data[1], data[2], data[3], data[4], data[5], data[6])
		parts_inventory[part.id] = part

func start_game(p_mode: GameMode, p_level: TrainingLevel = null) -> void:
	game_mode = p_mode
	game_state = GameState.PLAYING
	current_level = p_level
	game_start_time = Time.get_unix_time_from_system()
	session_completed_orders = 0
	session_failed_orders = 0
	session_repair_orders = 0
	session_score = 0
	session_earnings = 0.0
	next_order_id = 1

	work_orders.clear()
	quotes.clear()
	_initialize_parts_inventory()
	player_data.reset_session_stats()

	if p_mode == GameMode.TRAINING and p_level:
		game_time_limit = p_level.target_completion_time * 2
		max_active_orders = p_level.order_count
		for i in range(min(3, p_level.order_count)):
			_generate_work_order()
	else:
		game_time_limit = 600.0
		max_active_orders = 8
		for i in range(3):
			_generate_work_order()

	game_started.emit()

func _generate_work_order() -> void:
	if work_orders.size() >= max_active_orders:
		return

	var id = "WO_%04d" % next_order_id
	next_order_id += 1

	var plate = "京A%c%03d" % ["ABCDEFGHJKLMNPQRSTUVWXYZ"[randi() % 23], randi() % 1000]
	var model = vehicle_models[randi() % vehicle_models.size()]
	var customer = customer_names[randi() % customer_names.size()]

	var num_services = randi_range(1, 3)
	var services: Array[String] = []
	for i in range(num_services):
		var service = service_types[randi() % service_types.size()]
		if not services.has(service):
			services.append(service)

	var num_parts = randi_range(1, 3)
	var part_ids = parts_inventory.keys()
	var required_parts: Array[String] = []
	for i in range(num_parts):
		var part_id = part_ids[randi() % part_ids.size()]
		if not required_parts.has(part_id):
			required_parts.append(part_id)

	var priorities = [WorkOrder.Priority.LOW, WorkOrder.Priority.MEDIUM, WorkOrder.Priority.HIGH, WorkOrder.Priority.URGENT]
	var weights = [0.2, 0.4, 0.3, 0.1]
	var r = randf()
	var priority = WorkOrder.Priority.MEDIUM
	var cumulative = 0.0
	for i in range(weights.size()):
		cumulative += weights[i]
		if r < cumulative:
			priority = priorities[i]
			break

	var time_limits = {
		WorkOrder.Priority.LOW: 300.0,
		WorkOrder.Priority.MEDIUM: 200.0,
		WorkOrder.Priority.HIGH: 120.0,
		WorkOrder.Priority.URGENT: 60.0
	}
	var time_limit = time_limits[priority]

	var desc = "车辆需要%s服务。" % services[0]
	if services.size() > 1:
		desc += " 此外还需要%s等。" % services[1]

	var is_repair = randf() < 0.2
	var reward = 50 + int(priority) * 50 + services.size() * 30 + required_parts.size() * 20
	var penalty = int(reward * 0.5)

	var order = WorkOrder.new(id, plate, model, customer, desc, services, required_parts, priority, time_limit, is_repair, reward, penalty)
	order.created_at = Time.get_unix_time_from_system()
	order.deadline = order.created_at + time_limit

	work_orders[id] = order
	work_order_added.emit(order)
	AudioManager.play_sfx(AudioManager.SFXType.NEW_ORDER)

func select_work_order(p_order_id: String) -> WorkOrder:
	if work_orders.has(p_order_id):
		var order = work_orders[p_order_id]
		if order.status == WorkOrder.Status.PENDING:
			order.status = WorkOrder.Status.IN_PROGRESS
			TutorialManager.check_step_completion("select_order", {"order_id": p_order_id})
			return order
	return null

func check_parts_availability(p_order: WorkOrder) -> Dictionary:
	var result = {
		"all_available": true,
		"missing_parts": [],
		"low_stock_parts": [],
		"available_parts": []
	}

	for part_id in p_order.required_parts:
		if parts_inventory.has(part_id):
			var part = parts_inventory[part_id]
			if part.is_out_of_stock:
				result["all_available"] = false
				result["missing_parts"].append(part)
			elif part.is_low_stock:
				result["low_stock_parts"].append(part)
				result["available_parts"].append(part)
			else:
				result["available_parts"].append(part)
		else:
			result["all_available"] = false
			result["missing_parts"].append({"id": part_id, "name": "未知配件"})

	return result

func create_quote(p_order: WorkOrder) -> Quote:
	var quote_id = "QT_%04d" % quotes.size()
	var quote = Quote.new(quote_id, p_order.id, p_order.customer_name)

	var labor_cost = p_order.required_services.size() * 80.0
	quote.set_labor_cost(labor_cost)

	for part_id in p_order.required_parts:
		if parts_inventory.has(part_id):
			var part = parts_inventory[part_id]
			var qty = randi_range(1, 2)
			quote.add_item(part_id, part.name, qty, part.unit_price)

	quotes[quote_id] = quote
	quote_created.emit(quote)
	TutorialManager.check_step_completion("create_quote", {"quote_id": quote_id})
	return quote

func approve_quote(p_quote: Quote) -> void:
	p_quote.status = Quote.Status.APPROVED
	quote_approved.emit(p_quote)
	AudioManager.play_sfx(AudioManager.SFXType.QUOTE_APPROVED)

func reject_quote(p_quote: Quote) -> void:
	p_quote.status = Quote.Status.REJECTED
	quote_rejected.emit(p_quote)
	AudioManager.play_sfx(AudioManager.SFXType.QUOTE_REJECTED)

func complete_work_order(p_order: WorkOrder, p_success: bool, p_quote: Quote = null) -> Dictionary:
	var result = {
		"success": p_success,
		"is_perfect": false,
		"score": 0,
		"time_bonus": 0,
		"quality_bonus": 0,
		"repair_needed": false,
		"earnings": 0.0,
		"message": ""
	}

	var time_taken = Time.get_unix_time_from_system() - p_order.created_at
	var time_ratio = p_order.get_time_percentage()

	if p_success:
		var parts_ok = true
		for part_id in p_order.required_parts:
			if parts_inventory.has(part_id):
				var part = parts_inventory[part_id]
				if not part.consume(1):
					parts_ok = false
				else:
					part_consumed.emit(part, 1)
					player_data.add_parts_used(1)
					if part.is_out_of_stock:
						AudioManager.play_sfx(AudioManager.SFXType.PART_OUT)
					elif part.is_low_stock:
						AudioManager.play_sfx(AudioManager.SFXType.PART_LOW)

		var needs_repair = p_order.is_repair or randf() < 0.15
		result["repair_needed"] = needs_repair
		result["is_perfect"] = parts_ok and not needs_repair and time_ratio > 0.5

		var base_score = p_order.reward
		var time_bonus = int(base_score * time_ratio * 0.5)
		var quality_bonus = int(base_score * (0.3 if result["is_perfect"] else 0.1))

		result["score"] = base_score + time_bonus + quality_bonus
		result["time_bonus"] = time_bonus
		result["quality_bonus"] = quality_bonus

		var earnings = p_quote.get_total() if p_quote else float(base_score)
		result["earnings"] = earnings

		session_score += result["score"]
		session_earnings += earnings
		session_completed_orders += 1

		player_data.add_score(result["score"])
		player_data.add_completed_order(result["is_perfect"], time_taken)
		player_data.add_earnings(earnings)

		if needs_repair:
			session_repair_orders += 1
			player_data.add_repair_order()
			result["message"] = "工单完成！但需要跟进返修。得分: +%d" % result["score"]
		elif result["is_perfect"]:
			result["message"] = "完美完成！无返修风险。得分: +%d" % result["score"]
		else:
			result["message"] = "工单完成！得分: +%d" % result["score"]

		p_order.status = WorkOrder.Status.COMPLETED
		work_order_completed.emit(p_order, true, result["is_perfect"])
		AudioManager.play_order_complete()
	else:
		result["score"] = -p_order.penalty
		result["message"] = "工单失败！扣分: %d" % result["score"]
		session_score += result["score"]
		session_failed_orders += 1

		player_data.add_score(max(result["score"], 0))
		player_data.add_failed_order()

		p_order.status = WorkOrder.Status.FAILED
		work_order_completed.emit(p_order, false, false)
		AudioManager.play_order_fail()

	result_shown.emit(result)
	return result

func end_game() -> Dictionary:
	game_state = GameState.GAME_OVER

	var total_time = Time.get_unix_time_from_system() - game_start_time
	var repair_rate = float(session_repair_orders) / float(max(session_completed_orders, 1))
	var success_rate = float(session_completed_orders) / float(max(session_completed_orders + session_failed_orders, 1))

	var result = {
		"total_time": total_time,
		"completed_orders": session_completed_orders,
		"failed_orders": session_failed_orders,
		"repair_orders": session_repair_orders,
		"repair_rate": repair_rate,
		"success_rate": success_rate,
		"total_score": session_score,
		"total_earnings": session_earnings,
		"is_training_mode": game_mode == GameMode.TRAINING,
		"level_id": current_level.id if current_level else 0,
		"difficulty": current_level.difficulty if current_level else 0
	}

	if game_mode == GameMode.FREE_PLAY or (game_mode == GameMode.TRAINING and session_completed_orders > 0):
		LeaderboardManager.add_entry(
			player_data.player_name,
			session_score,
			total_time,
			repair_rate,
			session_completed_orders,
			result["difficulty"],
			game_mode == GameMode.TRAINING,
			result["level_id"]
		)

	game_ended.emit(result)
	return result

func pause_game() -> void:
	if game_state == GameState.PLAYING:
		game_state = GameState.PAUSED
		game_paused.emit()

func resume_game() -> void:
	if game_state == GameState.PAUSED:
		game_state = GameState.PLAYING
		game_resumed.emit()

func get_remaining_game_time() -> float:
	return game_time_limit - (Time.get_unix_time_from_system() - game_start_time)

func is_game_over() -> bool:
	return game_state == GameState.GAME_OVER or get_remaining_game_time() <= 0

func get_work_orders_by_status(p_status: WorkOrder.Status) -> Array[WorkOrder]:
	var result: Array[WorkOrder] = []
	for order in work_orders.values():
		if order.status == p_status:
			result.append(order)
	result.sort_custom(func(a: WorkOrder, b: WorkOrder) -> bool:
		return a.priority > b.priority
	)
	return result

func get_part(p_id: String) -> Part:
	return parts_inventory.get(p_id, null)

func update_game(delta: float) -> void:
	if game_state != GameState.PLAYING:
		return

	for order in work_orders.values():
		if order.status == WorkOrder.Status.PENDING and order.is_overdue():
			complete_work_order(order, false)

	if randf() < delta / order_spawn_interval:
		_generate_work_order()

func go_to_main_menu() -> void:
	game_state = GameState.MENU
	get_tree().change_scene_to_file("res://scenes/main_menu.tscn")

func go_to_game() -> void:
	get_tree().change_scene_to_file("res://scenes/game_scene.tscn")

func go_to_leaderboard() -> void:
	get_tree().change_scene_to_file("res://scenes/leaderboard_scene.tscn")

func go_to_level_select() -> void:
	get_tree().change_scene_to_file("res://scenes/level_select_scene.tscn")

func go_to_settings() -> void:
	get_tree().change_scene_to_file("res://scenes/settings_scene.tscn")

func save_player_data() -> void:
	if player_data:
		var config = ConfigFile.new()
		config.set_value("Player", "name", player_data.player_name)
		config.set_value("Player", "level", player_data.level)
		config.set_value("Player", "experience", player_data.experience)
		config.set_value("Player", "total_score", player_data.total_score)
		config.set_value("Player", "total_orders", player_data.total_orders_completed)
		config.set_value("Player", "perfect_orders", player_data.perfect_orders)
		config.set_value("Player", "total_earnings", player_data.total_earnings)
		config.set_value("Player", "unlocked_levels", player_data.unlocked_levels)
		config.save("user://player_data.cfg")

func load_player_data() -> void:
	var config = ConfigFile.new()
	var error = config.load("user://player_data.cfg")
	if error == OK:
		player_data.player_name = config.get_value("Player", "name", "维修技师")
		player_data.level = config.get_value("Player", "level", 1)
		player_data.experience = config.get_value("Player", "experience", 0)
		player_data.total_score = config.get_value("Player", "total_score", 0)
		player_data.total_orders_completed = config.get_value("Player", "total_orders", 0)
		player_data.perfect_orders = config.get_value("Player", "perfect_orders", 0)
		player_data.total_earnings = config.get_value("Player", "total_earnings", 0.0)
		player_data.unlocked_levels = config.get_value("Player", "unlocked_levels", [1])
