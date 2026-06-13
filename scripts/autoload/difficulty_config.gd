extends Node

var difficulties: Dictionary = {}

func _ready() -> void:
	_init_difficulties()

func _init_difficulties() -> void:
	difficulties = {
		"easy": {
			"name": "简单模式",
			"description": "适合新手，节奏较慢",
			"customer_spawn_interval": 8.0,
			"min_customers": 3,
			"max_customers": 6,
			"project_time_multiplier": 1.3,
			"supply_consumption_multiplier": 0.7,
			"anomaly_chance": 0.1,
			"anomaly_warning_time": 8.0,
			"start_score": 0,
			"combo_bonus_multiplier": 1.0,
			"item_cooldown_multiplier": 0.8,
			"levels": _generate_easy_levels()
		},
		"normal": {
			"name": "普通模式",
			"description": "标准难度，适合有经验的玩家",
			"customer_spawn_interval": 5.0,
			"min_customers": 5,
			"max_customers": 10,
			"project_time_multiplier": 1.0,
			"supply_consumption_multiplier": 1.0,
			"anomaly_chance": 0.25,
			"anomaly_warning_time": 5.0,
			"start_score": 0,
			"combo_bonus_multiplier": 1.0,
			"item_cooldown_multiplier": 1.0,
			"levels": _generate_normal_levels()
		},
		"hard": {
			"name": "困难模式",
			"description": "高强度挑战，考验反应速度",
			"customer_spawn_interval": 3.0,
			"min_customers": 8,
			"max_customers": 15,
			"project_time_multiplier": 0.75,
			"supply_consumption_multiplier": 1.3,
			"anomaly_chance": 0.45,
			"anomaly_warning_time": 3.0,
			"start_score": 0,
			"combo_bonus_multiplier": 1.5,
			"item_cooldown_multiplier": 1.2,
			"levels": _generate_hard_levels()
		}
	}

func _generate_easy_levels() -> Array:
	var levels = []
	for i in range(1, 6):
		levels.append({
			"level": i,
			"target_score": i * 500,
			"customer_types": ["wash_cut", "wash_dry"],
			"project_count": 3 + i,
			"supply_drain_rate": 0.5 + i * 0.1
		})
	return levels

func _generate_normal_levels() -> Array:
	var levels = []
	for i in range(1, 8):
		levels.append({
			"level": i,
			"target_score": i * 800,
			"customer_types": ["wash_cut", "wash_dry", "color", "perm"],
			"project_count": 5 + i,
			"supply_drain_rate": 0.8 + i * 0.15
		})
	return levels

func _generate_hard_levels() -> Array:
	var levels = []
	for i in range(1, 11):
		levels.append({
			"level": i,
			"target_score": i * 1200,
			"customer_types": ["wash_cut", "wash_dry", "color", "perm", "treatment"],
			"project_count": 8 + i,
			"supply_drain_rate": 1.0 + i * 0.2
		})
	return levels

func get_difficulty(diff_id: String) -> Dictionary:
	if diff_id in difficulties:
		return difficulties[diff_id]
	return difficulties["normal"]

func get_current_difficulty() -> Dictionary:
	return get_difficulty(GameState.current_difficulty)

func get_customer_spawn_interval() -> float:
	return get_current_difficulty().get("customer_spawn_interval", 5.0)

func get_project_time_multiplier() -> float:
	return get_current_difficulty().get("project_time_multiplier", 1.0)

func get_supply_consumption_multiplier() -> float:
	return get_current_difficulty().get("supply_consumption_multiplier", 1.0)

func get_anomaly_chance() -> float:
	return get_current_difficulty().get("anomaly_chance", 0.25)

func get_anomaly_warning_time() -> float:
	return get_current_difficulty().get("anomaly_warning_time", 5.0)

func get_combo_bonus_multiplier() -> float:
	return get_current_difficulty().get("combo_bonus_multiplier", 1.0)

func get_level_data(level: int) -> Dictionary:
	var levels = get_current_difficulty().get("levels", [])
	var idx = min(level - 1, levels.size() - 1)
	if idx >= 0 and idx < levels.size():
		return levels[idx]
	return levels[0] if levels.size() > 0 else {}

func adjust_difficulty(param: String, value) -> void:
	for diff_id in difficulties.keys():
		if param in difficulties[diff_id]:
			difficulties[diff_id][param] = value

func set_item_cooldown_multiplier(diff_id: String, multiplier: float) -> void:
	if diff_id in difficulties:
		difficulties[diff_id]["item_cooldown_multiplier"] = multiplier
