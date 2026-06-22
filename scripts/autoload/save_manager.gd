class_name SaveManager
extends Node

const SAVE_DIR: String = "user://saves/"
const MAX_REPLAY_SLOTS: int = 3
const STUCK_TIMEOUT: float = 30.0

func _ready() -> void:
	_ensure_save_dir()

func _ensure_save_dir() -> void:
	if not DirAccess.dir_exists_absolute(SAVE_DIR):
		DirAccess.make_dir_recursive_absolute(SAVE_DIR)

func save_game(slot: int, data: Dictionary) -> bool:
	_ensure_save_dir()
	var file_path: String = SAVE_DIR + "save_slot_%d.json" % slot
	var file: FileAccess = FileAccess.open(file_path, FileAccess.WRITE)
	if file == null:
		return false
	var json_string: String = JSON.stringify(data)
	file.store_string(json_string)
	file.close()
	return true

func load_game(slot: int) -> Dictionary:
	var file_path: String = SAVE_DIR + "save_slot_%d.json" % slot
	if not FileAccess.file_exists(file_path):
		return {}
	var file: FileAccess = FileAccess.open(file_path, FileAccess.READ)
	if file == null:
		return {}
	var json_string: String = file.get_as_text()
	file.close()
	var json: JSON = JSON.new()
	var result: Error = json.parse(json_string)
	if result != OK:
		return {}
	return json.data

func save_score_record(record: Dictionary) -> bool:
	_ensure_save_dir()
	var records: Array = load_score_records()
	records.append(record)
	var file_path: String = SAVE_DIR + "score_records.json"
	var file: FileAccess = FileAccess.open(file_path, FileAccess.WRITE)
	if file == null:
		return false
	file.store_string(JSON.stringify(records))
	file.close()
	return true

func load_score_records() -> Array:
	var file_path: String = SAVE_DIR + "score_records.json"
	if not FileAccess.file_exists(file_path):
		return []
	var file: FileAccess = FileAccess.open(file_path, FileAccess.READ)
	if file == null:
		return []
	var json_string: String = file.get_as_text()
	file.close()
	var json: JSON = JSON.new()
	var result: Error = json.parse(json_string)
	if result != OK:
		return []
	return json.data if json.data is Array else []

func save_replay_record(task_id: String, record: Dictionary) -> bool:
	_ensure_save_dir()
	var records: Array = load_replay_records(task_id)
	records.append(record)
	var file_path: String = SAVE_DIR + "replay_%s.json" % task_id
	var file: FileAccess = FileAccess.open(file_path, FileAccess.WRITE)
	if file == null:
		return false
	file.store_string(JSON.stringify(records))
	file.close()
	return true

func load_replay_records(task_id: String) -> Array:
	var file_path: String = SAVE_DIR + "replay_%s.json" % task_id
	if not FileAccess.file_exists(file_path):
		return []
	var file: FileAccess = FileAccess.open(file_path, FileAccess.READ)
	if file == null:
		return []
	var json_string: String = file.get_as_text()
	file.close()
	var json: JSON = JSON.new()
	var result: Error = json.parse(json_string)
	if result != OK:
		return []
	return json.data if json.data is Array else []

func get_replay_count(task_id: String) -> int:
	var records: Array = load_replay_records(task_id)
	return records.size()

func can_replay(task_id: String) -> bool:
	return get_replay_count(task_id) < MAX_REPLAY_SLOTS

func delete_save(slot: int) -> bool:
	var file_path: String = SAVE_DIR + "save_slot_%d.json" % slot
	if not FileAccess.file_exists(file_path):
		return false
	var dir: DirAccess = DirAccess.open(SAVE_DIR)
	if dir == null:
		return false
	return dir.remove(file_path) == OK

func list_save_slots() -> Array:
	_ensure_save_dir()
	var slots: Array = []
	var dir: DirAccess = DirAccess.open(SAVE_DIR)
	if dir == null:
		return slots
	dir.list_dir_begin()
	var file_name: String = dir.get_next()
	while file_name != "":
		if file_name.begins_with("save_slot_") and file_name.ends_with(".json"):
			var slot_str: String = file_name.replace("save_slot_", "").replace(".json", "")
			var slot_num: int = slot_str.to_int()
			if slot_str == str(slot_num):
				slots.append(slot_num)
		file_name = dir.get_next()
	dir.list_dir_end()
	slots.sort()
	return slots
