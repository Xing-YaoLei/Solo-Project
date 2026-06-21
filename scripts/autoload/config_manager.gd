extends Node

signal config_changed

var _config: Dictionary = {}
var _questions: Array = []
var _materials: Array = []
var _rewards: Array = []

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	_load_config()

func _load_config() -> void:
	var config_path: String = "user://config.json"
	if FileAccess.file_exists(config_path):
		var file: FileAccess = FileAccess.open(config_path, FileAccess.READ)
		if file:
			var json: JSON = JSON.new()
			var err: Error = json.parse(file.get_as_text())
			if err == OK:
				_config = json.data
			file.close()
	else:
		_config = _default_config()

	var questions_path: String = "res://data/questions.json"
	_load_json_file(questions_path, func(data): _questions = data)

	var materials_path: String = "res://data/materials.json"
	_load_json_file(materials_path, func(data): _materials = data)

	var rewards_path: String = "res://data/rewards.json"
	_load_json_file(rewards_path, func(data): _rewards = data)

func _default_config() -> Dictionary:
	return {
		"open_time": {"start": "06:00", "end": "23:00"},
		"training_mode": "practice",
		"max_address_retries": 3,
		"photo_verification_time_limit": 30,
		"label_selection_time_limit": 20,
		"address_sorting_time_limit": 60,
		"trajectory_time_limit": 45,
		"score_per_correct": 10,
		"score_penalty": 5,
		"pass_threshold": 60
	}

func _load_json_file(path: String, callback: Callable) -> void:
	if not FileAccess.file_exists(path):
		return
	var file: FileAccess = FileAccess.open(path, FileAccess.READ)
	if not file:
		return
	var json: JSON = JSON.new()
	var err: Error = json.parse(file.get_as_text())
	if err == OK and json.data is Array:
		callback.call(json.data)
	file.close()

func save_config() -> void:
	var file: FileAccess = FileAccess.open("user://config.json", FileAccess.WRITE)
	if file:
		file.store_string(JSON.stringify(_config, "\t"))
		file.close()
	config_changed.emit()

func get_config() -> Dictionary:
	return _config

func get_value(key: String, default: Variant = null) -> Variant:
	return _config.get(key, default)

func set_value(key: String, value: Variant) -> void:
	_config[key] = value

func get_questions() -> Array:
	return _questions

func set_questions(new_questions: Array) -> void:
	_questions = new_questions

func get_materials() -> Array:
	return _materials

func set_materials(new_materials: Array) -> void:
	_materials = new_materials

func get_rewards() -> Array:
	return _rewards

func set_rewards(new_rewards: Array) -> void:
	_rewards = new_rewards

func is_within_open_time() -> bool:
	var open_time: Dictionary = _config.get("open_time", {"start": "06:00", "end": "23:00"})
	var now: Dictionary = Time.get_time_dict_from_system()
	var current_minutes: int = now.hour * 60 + now.minute
	var start_parts: PackedStringArray = open_time.start.split(":")
	var end_parts: PackedStringArray = open_time.end.split(":")
	var start_minutes: int = int(start_parts[0]) * 60 + int(start_parts[1])
	var end_minutes: int = int(end_parts[0]) * 60 + int(end_parts[1])
	return current_minutes >= start_minutes and current_minutes <= end_minutes

func get_max_address_retries() -> int:
	return _config.get("max_address_retries", 3)

func get_time_limit(phase: int) -> int:
	match phase:
		0:
			return _config.get("photo_verification_time_limit", 30)
		1:
			return _config.get("label_selection_time_limit", 20)
		2:
			return _config.get("address_sorting_time_limit", 60)
		3:
			return _config.get("trajectory_time_limit", 45)
		_:
			return 30

func get_score_per_correct() -> int:
	return _config.get("score_per_correct", 10)

func get_score_penalty() -> int:
	return _config.get("score_penalty", 5)

func get_pass_threshold() -> int:
	return _config.get("pass_threshold", 60)
