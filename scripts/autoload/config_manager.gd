extends Node

signal config_changed
signal questions_changed
signal materials_changed
signal rewards_changed

var _config: Dictionary = {}
var _default_questions: Array = []
var _default_materials: Array = []
var _default_rewards: Array = []
var _user_questions: Array = []
var _user_materials: Array = []
var _user_rewards: Array = []

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	_load_config()
	_load_default_data()
	_load_user_data()

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

func _load_default_data() -> void:
	var questions_path: String = "res://data/questions.json"
	_load_json_array(questions_path, func(data): _default_questions = data)

	var materials_path: String = "res://data/materials.json"
	_load_json_array(materials_path, func(data): _default_materials = data)

	var rewards_path: String = "res://data/rewards.json"
	_load_json_array(rewards_path, func(data): _default_rewards = data)

func _load_user_data() -> void:
	var user_questions_path: String = "user://user_questions.json"
	if FileAccess.file_exists(user_questions_path):
		_load_json_array(user_questions_path, func(data): _user_questions = data)

	var user_materials_path: String = "user://user_materials.json"
	if FileAccess.file_exists(user_materials_path):
		_load_json_array(user_materials_path, func(data): _user_materials = data)

	var user_rewards_path: String = "user://user_rewards.json"
	if FileAccess.file_exists(user_rewards_path):
		_load_json_array(user_rewards_path, func(data): _user_rewards = data)

func _load_json_array(path: String, callback: Callable) -> void:
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
	if not _user_questions.is_empty():
		return _user_questions
	return _default_questions

func set_questions(new_questions: Array) -> void:
	_user_questions = new_questions.duplicate(true)
	_save_user_questions()
	questions_changed.emit()

func save_questions(new_questions: Array) -> void:
	set_questions(new_questions)

func _save_user_questions() -> void:
	var file: FileAccess = FileAccess.open("user://user_questions.json", FileAccess.WRITE)
	if file:
		file.store_string(JSON.stringify(_user_questions, "\t"))
		file.close()

func add_question(question: Dictionary) -> void:
	var questions: Array = get_questions().duplicate(true)
	questions.append(question)
	set_questions(questions)

func update_question(index: int, question: Dictionary) -> bool:
	if index < 0 or index >= get_questions().size():
		return false
	var questions: Array = get_questions().duplicate(true)
	questions[index] = question
	set_questions(questions)
	return true

func delete_question(index: int) -> bool:
	if index < 0 or index >= get_questions().size():
		return false
	var questions: Array = get_questions().duplicate(true)
	questions.remove_at(index)
	set_questions(questions)
	return true

func reset_questions_to_default() -> void:
	_user_questions.clear()
	var file: FileAccess = FileAccess.open("user://user_questions.json", FileAccess.WRITE)
	if file:
		file.store_string("[]")
		file.close()
	questions_changed.emit()

func get_materials() -> Array:
	if not _user_materials.is_empty():
		return _user_materials
	return _default_materials

func set_materials(new_materials: Array) -> void:
	_user_materials = new_materials.duplicate(true)
	_save_user_materials()
	materials_changed.emit()

func save_materials(new_materials: Array) -> void:
	set_materials(new_materials)

func _save_user_materials() -> void:
	var file: FileAccess = FileAccess.open("user://user_materials.json", FileAccess.WRITE)
	if file:
		file.store_string(JSON.stringify(_user_materials, "\t"))
		file.close()

func add_material(material: Dictionary) -> void:
	var materials: Array = get_materials().duplicate(true)
	materials.append(material)
	set_materials(materials)

func update_material(index: int, material: Dictionary) -> bool:
	if index < 0 or index >= get_materials().size():
		return false
	var materials: Array = get_materials().duplicate(true)
	materials[index] = material
	set_materials(materials)
	return true

func delete_material(index: int) -> bool:
	if index < 0 or index >= get_materials().size():
		return false
	var materials: Array = get_materials().duplicate(true)
	materials.remove_at(index)
	set_materials(materials)
	return true

func reset_materials_to_default() -> void:
	_user_materials.clear()
	var file: FileAccess = FileAccess.open("user://user_materials.json", FileAccess.WRITE)
	if file:
		file.store_string("[]")
		file.close()
	materials_changed.emit()

func get_rewards() -> Array:
	if not _user_rewards.is_empty():
		return _user_rewards
	return _default_rewards

func set_rewards(new_rewards: Array) -> void:
	_user_rewards = new_rewards.duplicate(true)
	_save_user_rewards()
	rewards_changed.emit()

func save_rewards(new_rewards: Array) -> void:
	set_rewards(new_rewards)

func _save_user_rewards() -> void:
	var file: FileAccess = FileAccess.open("user://user_rewards.json", FileAccess.WRITE)
	if file:
		file.store_string(JSON.stringify(_user_rewards, "\t"))
		file.close()

func add_reward(reward: Dictionary) -> void:
	var rewards: Array = get_rewards().duplicate(true)
	rewards.append(reward)
	set_rewards(rewards)

func update_reward(index: int, reward: Dictionary) -> bool:
	if index < 0 or index >= get_rewards().size():
		return false
	var rewards: Array = get_rewards().duplicate(true)
	rewards[index] = reward
	set_rewards(rewards)
	return true

func delete_reward(index: int) -> bool:
	if index < 0 or index >= get_rewards().size():
		return false
	var rewards: Array = get_rewards().duplicate(true)
	rewards.remove_at(index)
	set_rewards(rewards)
	return true

func reset_rewards_to_default() -> void:
	_user_rewards.clear()
	var file: FileAccess = FileAccess.open("user://user_rewards.json", FileAccess.WRITE)
	if file:
		file.store_string("[]")
		file.close()
	rewards_changed.emit()

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
